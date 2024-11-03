import sync

struct Task {
mut:
	id int
}

struct ThreadPool {
mut:
	tasks    []Task
	workers  []thread
	mutex    sync.Mutex
}

fn worker(mut pool ThreadPool, id int) {
	for {
		mut task := Task{}
		pool.mutex.@lock()
		if pool.tasks.len > 0 {
			task = pool.tasks.pop()
		} else {
			pool.mutex.unlock()
			break
		}
		pool.mutex.unlock()
		println('Worker $id processing task $task.id')
	}
}

fn new_thread_pool(num_workers int) &ThreadPool {
	mut pool := &ThreadPool{
		tasks: []Task{}
	}
	for i in 0 .. num_workers {
		pool.workers << spawn worker(mut pool, i)
	}
	return pool
}

fn (mut pool ThreadPool) add_task(task Task) {
	pool.mutex.@lock()
	pool.tasks << task
	pool.mutex.unlock()
}

fn (mut pool ThreadPool) wait() {
	for worker in pool.workers {
		worker.wait()
	}
}

fn main() {
	mut pool := new_thread_pool(3)
	for i in 0 .. 10 {
		pool.add_task(Task{id: i})
	}
	pool.wait()
}
