#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define POOL_SIZE 3 // Número de conexões no pool

typedef struct {
    int id;            // ID da conexão (para exemplo)
    int in_use;        // Flag para indicar se a conexão está em uso
} Connection;

typedef struct {
    Connection* connections[POOL_SIZE];
    pthread_mutex_t lock;
    pthread_cond_t available;
} ConnectionPool;

// Função para criar o pool de conexões
ConnectionPool* create_connection_pool() {
    ConnectionPool* pool = (ConnectionPool*)malloc(sizeof(ConnectionPool));
    pthread_mutex_init(&(pool->lock), NULL);
    pthread_cond_init(&(pool->available), NULL);

    // Inicializa as conexões
    for (int i = 0; i < POOL_SIZE; i++) {
        pool->connections[i] = (Connection*)malloc(sizeof(Connection));
        pool->connections[i]->id = i;
        pool->connections[i]->in_use = 0;
    }
    return pool;
}

// Função para adquirir uma conexão do pool
Connection* acquire_connection(ConnectionPool* pool) {
    pthread_mutex_lock(&(pool->lock));

    // Espera até que uma conexão esteja disponível
    while (1) {
        for (int i = 0; i < POOL_SIZE; i++) {
            if (!pool->connections[i]->in_use) {
                pool->connections[i]->in_use = 1;
                pthread_mutex_unlock(&(pool->lock));
                printf("Conexão %d adquirida.\n", pool->connections[i]->id);
                return pool->connections[i];
            }
        }
        // Se todas as conexões estiverem ocupadas, espera
        pthread_cond_wait(&(pool->available), &(pool->lock));
    }
}

// Função para liberar uma conexão de volta ao pool
void release_connection(ConnectionPool* pool, Connection* connection) {
    pthread_mutex_lock(&(pool->lock));
    connection->in_use = 0;
    printf("Conexão %d liberada.\n", connection->id);

    // Notifica uma thread que uma conexão está disponível
    pthread_cond_signal(&(pool->available));
    pthread_mutex_unlock(&(pool->lock));
}

// Função para destruir o pool de conexões
void destroy_connection_pool(ConnectionPool* pool) {
    for (int i = 0; i < POOL_SIZE; i++) {
        free(pool->connections[i]);
    }
    pthread_mutex_destroy(&(pool->lock));
    pthread_cond_destroy(&(pool->available));
    free(pool);
}

// Função de exemplo que simula o uso de uma conexão
void* use_connection(void* arg) {
    ConnectionPool* pool = (ConnectionPool*)arg;
    Connection* conn = acquire_connection(pool);
    
    // Simula trabalho com a conexão
    sleep(1);
    
    release_connection(pool, conn);
    return NULL;
}

int main() {
    ConnectionPool* pool = create_connection_pool();

    // Cria threads para simular clientes tentando adquirir conexões
    pthread_t threads[5];
    for (int i = 0; i < 5; i++) {
        pthread_create(&threads[i], NULL, use_connection, pool);
    }

    // Aguarda as threads terminarem
    for (int i = 0; i < 5; i++) {
        pthread_join(threads[i], NULL);
    }

    destroy_connection_pool(pool);
    return 0;
}
