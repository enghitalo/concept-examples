import time
import sync

struct Task {
	headers  map[string]string
	callback Callback
}

type Callback = fn (id string)

fn producer(producer_name string, mut exchange []Task, mut mtx sync.Mutex, headers map[string]string) {
	for i in 1 .. 5 {
		task := Task{
			headers:  headers
			callback: fn [producer_name, i] (consumer_name string) {
				println('task ${i} created by producer ${producer_name}: consumed by ${consumer_name}')
				time.sleep(500 * time.millisecond)
			}
		}

		mtx.lock()
		exchange << task
		println('Produced: task ${i} with headers ${headers} by ${producer_name}')
		time.sleep(50 * time.millisecond)
		mtx.unlock()
	}
}

fn consumer(consumer_name string, mut exchange []Task, mut mtx sync.Mutex, filter map[string]string) {
	for {
		mtx.lock()
		mut found := false
		for i, task in exchange {
			if matches_headers(task.headers, filter) {
				callback := task.callback
				exchange.delete(i)

				mtx.unlock()
				callback(consumer_name) // Execute after unlocking
				found = true
				break
			}
		}
		if !found {
			println('- No matching items to consume for ${consumer_name}')
			mtx.unlock()
			break
		}
	}
}

fn matches_headers(task_headers map[string]string, filter map[string]string) bool {
	for key, value in filter {
		if task_headers[key] != value {
			return false
		}
	}
	return true
}

fn main() {
	mut mtx := sync.new_mutex()
	mut exchange := []Task{}

	// Producers with specific headers
	producer_threads := [
		spawn producer('Paula', mut exchange, mut mtx, {
			'type':  'log'
			'level': 'error'
		}),
		spawn producer('Adriano', mut exchange, mut mtx, {
			'type':  'log'
			'level': 'info'
		}),
		spawn producer('Kaka', mut exchange, mut mtx, {
			'type':      'db'
			'operation': 'update'
		}),
		spawn producer('Hitalo', mut exchange, mut mtx, {
			'type':      'db'
			'operation': 'insert'
		}),
		spawn producer('Jonh', mut exchange, mut mtx, {
			'type':   'cache'
			'action': 'invalidate'
		}),
	]

	// Consumers with specific header filters
	mut consumer_threads := []thread{}
	consumer_threads << spawn consumer('consumer 1', mut exchange, mut mtx, {
		'type': 'log'
	})
	consumer_threads << spawn consumer('consumer 2', mut exchange, mut mtx, {
		'type':      'db'
		'operation': 'update'
	})
	consumer_threads << spawn consumer('consumer 3', mut exchange, mut mtx, {
		'type': 'cache'
	})

	for t in producer_threads {
		t.wait()
	}
	for t in consumer_threads {
		t.wait()
	}
}
