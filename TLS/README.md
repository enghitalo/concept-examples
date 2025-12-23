### Build and Run

```sh

gcc TLS/server.c -o TLS/server -lmbedtls -lmbedx509 -lmbedcrypto
./TLS/server
```

### Test

- cURL

```sh
curl --cacert server_cert.pem https://localhost:8443
```
