/**
 * HTTPS Server using Mbed TLS 4.0.0
 * TLS 1.3 with ChaCha20-Poly1305
 */

#include <mbedtls/build_info.h>
#include <mbedtls/net_sockets.h>
#include <mbedtls/ssl.h>
#include <psa/crypto.h>
#include <mbedtls/x509_crt.h>
#include <mbedtls/x509_csr.h>
#include <mbedtls/pk.h>
#include <mbedtls/error.h>
#include <mbedtls/debug.h>
#include <mbedtls/version.h>
#include <mbedtls/pem.h>
#include <mbedtls/oid.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <unistd.h>
#include <mbedtls/pk.h>       // For mbedtls_pk functions
#include <mbedtls/psa_util.h> // For mbedtls_psa_get_random

#define SERVER_PORT "8443"
#define SERVER_ADDR "0.0.0.0"
#define HTTP_RESPONSE "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n"         \
                      "<html><body><h1>🔒 TLS 1.3 Mbed TLS 4.0 Server</h1>"                             \
                      "<p>This connection is secured with TLS 1.3 using a self-signed certificate.</p>" \
                      "<p>To trust this certificate, save it as 'server_cert.pem' and use:</p>"         \
                      "<pre>curl --cacert server_cert.pem https://localhost:8443</pre>"                 \
                      "</body></html>"

typedef struct
{
    mbedtls_net_context listen_fd;
    mbedtls_ssl_config conf;
    mbedtls_x509_crt srvcert;
    mbedtls_pk_context pkey;
    mbedtls_svc_key_id_t key_id; // Store this for PSA cleanup
    int running;
    char cert_pem[4096];
    size_t cert_pem_len;
} server_context_t;

/* --- Utility Functions --- */

static void print_certificate_info(mbedtls_x509_crt *cert)
{
    char buf[4096];
    mbedtls_x509_crt_info(buf, sizeof(buf), "  ", cert);
    printf("%s\n", buf);
}

/**
 * Save certificate to PEM file
 */
static void save_certificate_pem(const char *filename, const char *pem_data, size_t pem_len)
{
    FILE *fp = fopen(filename, "w");
    if (fp)
    {
        fwrite(pem_data, 1, pem_len, fp);
        fclose(fp);
        printf("Certificate saved to %s\n", filename);
    }
    else
    {
        printf("Failed to save certificate to %s\n", filename);
    }
}

/**
 * Generate self-signed certificate using PSA-backed PK
 */
static int generate_self_signed_certificate(server_context_t *server)
{
    mbedtls_x509write_cert write_cert;
    unsigned char cert_der[4096];
    int ret;
    psa_status_t status;

    printf("Generating self-signed certificate...\n");

    mbedtls_x509write_crt_init(&write_cert);
    mbedtls_pk_init(&server->pkey);

    // 1. Generate EC Key using PSA API
    psa_key_attributes_t attributes = PSA_KEY_ATTRIBUTES_INIT;

    psa_set_key_usage_flags(&attributes, PSA_KEY_USAGE_SIGN_HASH | PSA_KEY_USAGE_EXPORT);
    psa_set_key_algorithm(&attributes, PSA_ALG_ECDSA(PSA_ALG_SHA_256));
    psa_set_key_type(&attributes, PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1));
    psa_set_key_bits(&attributes, 256);

    status = psa_generate_key(&attributes, &server->key_id);
    if (status != PSA_SUCCESS)
    {
        printf("Failed to generate PSA key: %d\n", (int)status);
        return MBEDTLS_ERR_SSL_HW_ACCEL_FAILED;
    }

    // 2. Wrap the PSA key into the PK context
    ret = mbedtls_pk_wrap_psa(&server->pkey, server->key_id);
    if (ret != 0)
    {
        printf("Failed to wrap PSA key: %d\n", ret);
        return ret;
    }

    // 3. Configure the Certificate
    mbedtls_x509write_crt_set_subject_key(&write_cert, &server->pkey);
    mbedtls_x509write_crt_set_issuer_key(&write_cert, &server->pkey);

    ret = mbedtls_x509write_crt_set_subject_name(&write_cert, "CN=localhost,O=MbedTLS4,C=US");
    if (ret != 0)
        return ret;
    ret = mbedtls_x509write_crt_set_issuer_name(&write_cert, "CN=localhost,O=MbedTLS4,C=US");
    if (ret != 0)
        return ret;

    mbedtls_x509write_crt_set_version(&write_cert, MBEDTLS_X509_CRT_VERSION_3);
    mbedtls_x509write_crt_set_md_alg(&write_cert, MBEDTLS_MD_SHA256);

    // 4. Set Serial Number
    unsigned char raw_serial[12];
    psa_generate_random(raw_serial, sizeof(raw_serial));
    ret = mbedtls_x509write_crt_set_serial_raw(&write_cert, raw_serial, sizeof(raw_serial));
    if (ret != 0)
        return ret;

    // 5. Set validity dates
    mbedtls_x509write_crt_set_validity(&write_cert, "20250101000000", "20301231235959");

    // 6. Write DER certificate
    printf("  Writing DER certificate...\n");
    ret = mbedtls_x509write_crt_der(&write_cert, cert_der, sizeof(cert_der));
    if (ret < 0)
    {
        printf("Failed to write DER certificate: %d\n", ret);
        return ret;
    }

    size_t cert_len = (size_t)ret;
    unsigned char *cert_start = cert_der + sizeof(cert_der) - cert_len;

    // 7. Parse into the server context srvcert
    ret = mbedtls_x509_crt_parse_der(&server->srvcert, cert_start, cert_len);
    if (ret != 0)
    {
        printf("Failed to parse DER certificate: %d\n", ret);
        return ret;
    }

    // 8. Export to PEM
    printf("  Exporting to PEM format...\n");
    ret = mbedtls_pem_write_buffer("-----BEGIN CERTIFICATE-----\n", "-----END CERTIFICATE-----\n",
                                   cert_start, cert_len,
                                   (unsigned char *)server->cert_pem, sizeof(server->cert_pem), &server->cert_pem_len);
    if (ret != 0)
    {
        printf("Failed to write PEM buffer: %d\n", ret);
        return ret;
    }

    // 9. Print certificate information
    printf("\n=== Generated Self-Signed Certificate ===\n");
    print_certificate_info(&server->srvcert);
    printf("=========================================\n\n");

    // 10. Save certificate to file
    save_certificate_pem("server_cert.pem", server->cert_pem, server->cert_pem_len);

    printf("To connect with curl, use:\n");
    printf("  curl --cacert server_cert.pem https://localhost:8443\n\n");

    mbedtls_x509write_crt_free(&write_cert);
    return 0;
}

static void handle_client(server_context_t *server, mbedtls_net_context *client_fd)
{
    mbedtls_ssl_context ssl;
    unsigned char buf[1024];
    int ret;

    mbedtls_ssl_init(&ssl);
    mbedtls_ssl_setup(&ssl, &server->conf);
    mbedtls_ssl_set_bio(&ssl, client_fd, mbedtls_net_send, mbedtls_net_recv, NULL);

    printf("New client connection...\n");

    while ((ret = mbedtls_ssl_handshake(&ssl)) != 0)
    {
        if (ret != MBEDTLS_ERR_SSL_WANT_READ && ret != MBEDTLS_ERR_SSL_WANT_WRITE)
        {
            char error_buf[256];
            mbedtls_strerror(ret, error_buf, sizeof(error_buf));
            printf("SSL handshake failed: %s (%d)\n", error_buf, ret);
            goto cleanup;
        }
    }

    printf("TLS handshake successful!\n");
    printf("  Cipher: %s\n", mbedtls_ssl_get_ciphersuite(&ssl));
    printf("  Version: %s\n", mbedtls_ssl_get_version(&ssl));

    ret = mbedtls_ssl_read(&ssl, buf, sizeof(buf) - 1);
    if (ret > 0)
    {
        buf[ret] = '\0';
        printf("Received request:\n%s\n", buf);
        mbedtls_ssl_write(&ssl, (unsigned char *)HTTP_RESPONSE, strlen(HTTP_RESPONSE));
    }

    mbedtls_ssl_close_notify(&ssl);
    printf("Connection closed.\n\n");

cleanup:
    mbedtls_ssl_free(&ssl);
    mbedtls_net_free(client_fd);
}

static int setup_server(server_context_t *server)
{
    int ret;

    mbedtls_net_init(&server->listen_fd);
    mbedtls_ssl_config_init(&server->conf);
    mbedtls_x509_crt_init(&server->srvcert);
    mbedtls_pk_init(&server->pkey);

    // Generate certificate
    if ((ret = generate_self_signed_certificate(server)) != 0)
    {
        printf("Failed to generate certificate: %d\n", ret);
        return ret;
    }

    // Configure SSL
    ret = mbedtls_ssl_config_defaults(&server->conf,
                                      MBEDTLS_SSL_IS_SERVER,
                                      MBEDTLS_SSL_TRANSPORT_STREAM,
                                      MBEDTLS_SSL_PRESET_DEFAULT);
    if (ret != 0)
    {
        printf("Failed to set SSL defaults: %d\n", ret);
        return ret;
    }

    // Force TLS 1.3 only
    mbedtls_ssl_conf_min_tls_version(&server->conf, MBEDTLS_SSL_VERSION_TLS1_3);
    mbedtls_ssl_conf_max_tls_version(&server->conf, MBEDTLS_SSL_VERSION_TLS1_3);

    // Supported groups for TLS 1.3
    static const uint16_t groups[] = {
        MBEDTLS_SSL_IANA_TLS_GROUP_SECP256R1,
        MBEDTLS_SSL_IANA_TLS_GROUP_SECP384R1,
        0};
    mbedtls_ssl_conf_groups(&server->conf, groups);

    // Ciphersuites for TLS 1.3
    static const int ciphers[] = {
        MBEDTLS_TLS1_3_CHACHA20_POLY1305_SHA256,
        MBEDTLS_TLS1_3_AES_256_GCM_SHA384,
        MBEDTLS_TLS1_3_AES_128_GCM_SHA256,
        0};
    mbedtls_ssl_conf_ciphersuites(&server->conf, ciphers);

    // Set our certificate and private key
    mbedtls_ssl_conf_own_cert(&server->conf, &server->srvcert, &server->pkey);

    // Bind to address
    printf("Binding to %s:%s...\n", SERVER_ADDR, SERVER_PORT);
    return mbedtls_net_bind(&server->listen_fd, SERVER_ADDR, SERVER_PORT, MBEDTLS_NET_PROTO_TCP);
}

int main()
{
    server_context_t server = {.running = 1};
    int ret;

    printf("Initializing PSA crypto...\n");
    if (psa_crypto_init() != PSA_SUCCESS)
    {
        printf("Failed to initialize PSA crypto\n");
        return 1;
    }

    printf("Setting up server...\n");
    if ((ret = setup_server(&server)) != 0)
    {
        char error_buf[256];
        mbedtls_strerror(ret, error_buf, sizeof(error_buf));
        printf("Server setup failed: %s (%d)\n", error_buf, ret);
        return 1;
    }

    printf("\n========================================\n");
    printf("✅ Server listening on https://localhost:8443\n");
    printf("========================================\n\n");

    while (server.running)
    {
        mbedtls_net_context client_fd;
        mbedtls_net_init(&client_fd);

        ret = mbedtls_net_accept(&server.listen_fd, &client_fd, NULL, 0, NULL);
        if (ret == 0)
        {
            handle_client(&server, &client_fd);
        }
        else if (ret != MBEDTLS_ERR_SSL_WANT_READ)
        {
            printf("Accept failed: %d\n", ret);
            break;
        }
    }

    // Cleanup
    printf("Shutting down server...\n");

    mbedtls_net_free(&server.listen_fd);
    mbedtls_x509_crt_free(&server.srvcert);

    // Destroy PSA key
    if (server.key_id != 0)
    {
        psa_destroy_key(server.key_id);
    }

    mbedtls_pk_free(&server.pkey);
    mbedtls_ssl_config_free(&server.conf);
    mbedtls_psa_crypto_free();

    printf("Server shutdown complete.\n");
    return 0;
}