import sync

struct Connection {
mut:
	id     int
	in_use bool
}

struct ConnectionPool {
mut:
	connections []Connection
	mutex       sync.Mutex
}

fn new_connection_pool(size int) &ConnectionPool {
	mut pool := ConnectionPool{}
	for i in 0 .. size {
		pool.connections << Connection{id: i, in_use: false}
	}
	return &pool
}

fn (mut pool ConnectionPool) acquire_connection() !&Connection {
	pool.mutex.@lock()
	defer { pool.mutex.unlock() }

	for mut conn in pool.connections {
		if !conn.in_use {
			conn.in_use = true
			println('Connection $conn.id acquired.')
			return &conn
		}
	}
	return error('No available connections in pool')
}

fn (mut pool ConnectionPool) release_connection(conn &Connection) {
	pool.mutex.@lock()
	defer { pool.mutex.unlock() }
	conn.in_use = false
	println('Connection $conn.id released.')
}

fn use_connection(mut pool ConnectionPool) {
	mut conn := pool.acquire_connection() or { 
		println(err)
		return 
	}
	// Simula o uso da conexão
	println('Using connection ${conn.id}')
	pool.release_connection(conn)
}

fn main() {
	mut pool := new_connection_pool(3)

	spawn use_connection(mut pool)
	spawn use_connection(mut pool)
	spawn use_connection(mut pool)
	spawn use_connection(mut pool)
	spawn use_connection(mut pool)

	// Dê tempo para as threads terminarem
	sleep(1)
}
