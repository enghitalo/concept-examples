#include <stdio.h>
#include <stdlib.h>

typedef void* voidptr;
typedef enum {
	ArrayFlags__noslices = 1U, // u64(1) << 0
	ArrayFlags__noshrink = 2U, // u64(1) << 1
	ArrayFlags__nogrow = 4U, // u64(1) << 2
	ArrayFlags__nofree = 8U, // u64(1) << 3
}  ArrayFlags;

struct array {
    voidptr data;
    int offset;
    int len;
    int cap;
    ArrayFlags flags;
    int element_size;
};

__attribute__((export_name("malloc")))
void* builtin___v_malloc(size_t size) {
	return malloc(size);
}

__attribute__((export_name("free")))
void builtin___v_free(void* ptr) {
	free(ptr);
}

__attribute__((export_name("print_hello_world")))
void print_hello_world()
{
    printf("Hello, World!\n");
}

__attribute__((export_name("sum")))
int sum(int a, int b)
{
    return a + b;
}

int compare(const void *a, const void *b)
{
    return (*(int *)a - *(int *)b);
}

__attribute__((export_name("sort_array")))
void sort_array(struct array *arr)
{
    if (!arr || !arr->data || arr->element_size != sizeof(int)) return;
    qsort(arr->data, arr->len, sizeof(int), compare);
}
