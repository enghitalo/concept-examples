#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define POOL_SIZE 5

typedef struct {
    int id;
    char data[50];
} MyObject;

typedef struct {
    MyObject* objects[POOL_SIZE];
    int index;
} ObjectPool;

ObjectPool* create_pool() {
    ObjectPool* pool = (ObjectPool*)malloc(sizeof(ObjectPool));
    pool->index = -1;
    for (int i = 0; i < POOL_SIZE; i++) {
        pool->objects[i] = NULL;
    }
    return pool;
}

MyObject* acquire_object(ObjectPool* pool) {
    if (pool->index >= 0) {
        return pool->objects[pool->index--];
    } else {
        return (MyObject*)malloc(sizeof(MyObject));
    }
}

void release_object(ObjectPool* pool, MyObject* obj) {
    if (pool->index < POOL_SIZE - 1) {
        pool->objects[++pool->index] = obj;
    } else {
        free(obj);
    }
}

void destroy_pool(ObjectPool* pool) {
    for (int i = 0; i <= pool->index; i++) {
        free(pool->objects[i]);
    }
    free(pool);
}

int main() {
    ObjectPool* pool = create_pool();

    MyObject* obj1 = acquire_object(pool);
    obj1->id = 1;
    strcpy(obj1->data, "Objeto 1");

    MyObject* obj2 = acquire_object(pool);
    obj2->id = 2;
    strcpy(obj2->data, "Objeto 2");

    printf("Obj1: ID=%d, Data=%s\n", obj1->id, obj1->data);
    printf("Obj2: ID=%d, Data=%s\n", obj2->id, obj2->data);

    // Libera objetos para reutilização
    release_object(pool, obj1);
    release_object(pool, obj2);

    destroy_pool(pool);
    return 0;
}
