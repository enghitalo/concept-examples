struct Object {
mut:
	id int
}

struct ObjectPool {
mut:
	pool []&Object
}

fn new_object_pool(size int) &ObjectPool {
	mut obj_pool := ObjectPool{
		pool: []&Object{cap: size}
	}
	for i in 0 .. size {
		obj_pool.pool << &Object{
			id: i
		}
	}
	return &obj_pool
}

fn (mut pool ObjectPool) acquire() !&Object {
	for obj in pool.pool {
		if obj.id == -1 {
			obj.id = pool.pool.index(obj)
			return obj
		}
	}
	return error('No available objects in pool')
}

fn (mut pool ObjectPool) release(obj &Object) {
	unsafe {
		obj.id = -1
	}
}

fn main() {
	mut pool := new_object_pool(5)
	mut obj := pool.acquire() or { panic(err) }
	println('Acquired object with ID: ${obj.id}')

	pool.release(obj)
	println('Released object with ID: ${obj.id}')

	obj = pool.acquire() or { panic(err) }
	println('Acquired object with ID: ${obj.id}')
}
