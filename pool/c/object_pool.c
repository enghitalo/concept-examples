#include <stdio.h>
#include <stdlib.h>

#define POOL_SIZE 5

typedef struct {
    int* objects[POOL_SIZE];
    int index;
} IntPool;

IntPool* create_pool() {
    IntPool* pool = (IntPool*)malloc(sizeof(IntPool));
    pool->index = -1;
    for (int i = 0; i < POOL_SIZE; i++) {
        pool->objects[i] = NULL;
    }
    return pool;
}

int* acquire_object(IntPool* pool) {
    if (pool->index >= 0) {
        return pool->objects[pool->index--];
    } else {
        // Pool está vazio, cria um novo objeto
        return (int*)malloc(sizeof(int));
    }
}

void release_object(IntPool* pool, int* obj) {
    if (pool->index < POOL_SIZE - 1) {
        pool->objects[++pool->index] = obj;
    } else {
        // Pool está cheio, libera o objeto
        free(obj);
    }
}

void destroy_pool(IntPool* pool) {
    for (int i = 0; i <= pool->index; i++) {
        free(pool->objects[i]);
    }
    free(pool);
}

int main() {
    IntPool* pool = create_pool();
    
    // Adquire objetos do pool
    int* obj1 = acquire_object(pool);
    int* obj2 = acquire_object(pool);

    *obj1 = 10;
    *obj2 = 20;
    printf("Obj1: %d, Obj2: %d\n", *obj1, *obj2);
    
    // Libera objetos de volta para o pool
    release_object(pool, obj1);
    release_object(pool, obj2);
    
    destroy_pool(pool);
    return 0;
}
