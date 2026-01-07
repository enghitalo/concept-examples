import strings

const pool_size = 5

struct MyObject {
	id   int
	data string
}

struct ObjectPool {
mut:
	objects [pool_size]&MyObject
	index   int = -1
}

fn create_pool() &ObjectPool {
	return &ObjectPool{}
}

fn acquire_object(mut pool ObjectPool) &MyObject {
	if pool.index >= 0 {
		obj := pool.objects[pool.index]
		pool.index--
		return obj
	} else {
		return &MyObject{}
	}
}

fn release_object(mut pool ObjectPool, obj &MyObject) {
	if pool.index < pool_size - 1 {
		pool.index++
		pool.objects[pool.index] = obj
	}
}

fn destroy_pool(mut pool ObjectPool) {
	for i in 0 .. pool.index + 1 {
		unsafe { free(pool.objects[i]) }
	}
}

fn main() {
	mut pool := create_pool()

	mut obj1 := acquire_object(mut pool)
	obj1.id = 1
	obj1.data = 'Objeto 1'

	mut obj2 := acquire_object(mut pool)
	obj2.id = 2
	obj2.data = 'Objeto 2'

	println('Obj1: ID=${obj1.id}, Data=${obj1.data}')
	println('Obj2: ID=${obj2.id}, Data=${obj2.data}')

	// Libera objetos para reutilização
	release_object(mut pool, obj1)
	release_object(mut pool, obj2)

	destroy_pool(mut pool)
}
