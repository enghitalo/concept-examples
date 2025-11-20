#include <signal.h> // For no_segfault_handler

@[export: 'print_hello_world']
pub fn print_hello_world() {
	println('Hello, World!')
}

@[export: 'sum']
pub fn sum(a int, b int) int {
	return a + b
}

@[export: 'sort_array']
pub fn sort_array(mut arr []int) {
	arr.sort(|a, b| a < b)
}
