#include <stdio.h>
#include <stdlib.h>

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
void sort_array(int *arr, size_t len)
{
    qsort(arr, len, sizeof(int), compare);
}
