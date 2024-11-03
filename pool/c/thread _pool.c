#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define THREAD_POOL_SIZE 4  // Número de threads no pool
#define TASK_QUEUE_SIZE 10  // Tamanho máximo da fila de tarefas

typedef struct {
    void (*function)(void*); // Ponteiro para a função que será executada
    void* arg;               // Argumento da função
} Task;

typedef struct {
    pthread_mutex_t lock;
    pthread_cond_t notify;
    pthread_t threads[THREAD_POOL_SIZE];
    Task task_queue[TASK_QUEUE_SIZE];
    int queue_size;
    int head;
    int tail;
    int count;
    int shutdown;
} ThreadPool;

void* thread_worker(void* arg);

ThreadPool* create_thread_pool() {
    ThreadPool* pool = (ThreadPool*)malloc(sizeof(ThreadPool));
    pool->queue_size = TASK_QUEUE_SIZE;
    pool->head = pool->tail = pool->count = 0;
    pool->shutdown = 0;
    pthread_mutex_init(&(pool->lock), NULL);
    pthread_cond_init(&(pool->notify), NULL);

    // Criar threads
    for (int i = 0; i < THREAD_POOL_SIZE; i++) {
        pthread_create(&(pool->threads[i]), NULL, thread_worker, (void*)pool);
    }
    return pool;
}

void add_task(ThreadPool* pool, void (*function)(void*), void* arg) {
    pthread_mutex_lock(&(pool->lock));

    // Adiciona a tarefa à fila, se não estiver cheia
    if (pool->count < pool->queue_size) {
        Task task;
        task.function = function;
        task.arg = arg;
        pool->task_queue[pool->tail] = task;
        pool->tail = (pool->tail + 1) % pool->queue_size;
        pool->count += 1;

        // Notifica uma thread que há uma nova tarefa
        pthread_cond_signal(&(pool->notify));
    } else {
        printf("Fila de tarefas cheia. Tarefa descartada.\n");
    }
    
    pthread_mutex_unlock(&(pool->lock));
}

void destroy_thread_pool(ThreadPool* pool) {
    pthread_mutex_lock(&(pool->lock));
    pool->shutdown = 1;

    // Notificar todas as threads para finalizar
    pthread_cond_broadcast(&(pool->notify));
    pthread_mutex_unlock(&(pool->lock));

    // Aguarda todas as threads terminarem
    for (int i = 0; i < THREAD_POOL_SIZE; i++) {
        pthread_join(pool->threads[i], NULL);
    }

    pthread_mutex_destroy(&(pool->lock));
    pthread_cond_destroy(&(pool->notify));
    free(pool);
}

void* thread_worker(void* arg) {
    ThreadPool* pool = (ThreadPool*)arg;

    while (1) {
        Task task;

        pthread_mutex_lock(&(pool->lock));

        // Espera por uma tarefa ou pelo sinal de shutdown
        while (pool->count == 0 && !pool->shutdown) {
            pthread_cond_wait(&(pool->notify), &(pool->lock));
        }

        // Finaliza a thread se o pool estiver em shutdown
        if (pool->shutdown) {
            pthread_mutex_unlock(&(pool->lock));
            break;
        }

        // Pega a próxima tarefa
        task = pool->task_queue[pool->head];
        pool->head = (pool->head + 1) % pool->queue_size;
        pool->count -= 1;

        pthread_mutex_unlock(&(pool->lock));

        // Executa a tarefa fora do bloqueio
        (*(task.function))(task.arg);
    }
    pthread_exit(NULL);
}

// Função de exemplo que simula uma tarefa
void example_task(void* arg) {
    int num = *((int*)arg);
    printf("Processando tarefa %d na thread %ld\n", num, pthread_self());
    sleep(1);  // Simula trabalho
}

int main() {
    ThreadPool* pool = create_thread_pool();

    // Adiciona tarefas ao pool
    for (int i = 0; i < 10; i++) {
        int* task_num = (int*)malloc(sizeof(int));
        *task_num = i;
        add_task(pool, example_task, task_num);
    }

    // Dê tempo para as threads processarem as tarefas
    sleep(5);

    destroy_thread_pool(pool);
    return 0;
}
