import time
import sync

struct Task {
	routing_key string
	callback    Callback
}

type Callback = fn (id string)

fn producer(producer_name string, mut exchange []Task, mut mtx sync.Mutex) {
	for i in 1 .. 5 {
		task := Task{
			routing_key: producer_name // Use producer name as the routing key
			callback:    fn [producer_name, i] (consumer_name string) {
				println('Task ${i} created by producer ${producer_name}: consumed by ${consumer_name}')
				time.sleep(500 * time.millisecond)
			}
		}

		mtx.lock()
		exchange << task
		println('Produced: task ${i} with routing key "${task.routing_key}"')
		time.sleep(50 * time.millisecond)
		mtx.unlock()
	}
}

fn consumer(consumer_name string, mut queue []Task, mut mtx sync.Mutex, binding_key string) {
	for {
		mtx.lock()
		mut found := false
		for i, task in queue {
			if task.routing_key == binding_key {
				callback := task.callback
				queue.delete(i)

				mtx.unlock()
				callback(consumer_name) // Execute after unlocking
				found = true
				break
			}
		}
		if !found {
			println('- No matching tasks for ${consumer_name} with binding key "${binding_key}"')
			mtx.unlock()
			break
		}
	}
}

fn main() {
	mut mtx := sync.new_mutex()
	mut exchange := []Task{}

	// Producers with routing keys matching their names
	producer_threads := [
		spawn producer('Paula', mut exchange, mut mtx),
		spawn producer('Adriano', mut exchange, mut mtx),
		spawn producer('Kaka', mut exchange, mut mtx),
		spawn producer('Hitalo', mut exchange, mut mtx),
		spawn producer('Jonh', mut exchange, mut mtx),
	]

	// Consumers bound to specific routing keys
	mut consumer_threads := []thread{}
	consumer_threads << spawn consumer('consumer 1', mut exchange, mut mtx, 'Paula')
	consumer_threads << spawn consumer('consumer 2', mut exchange, mut mtx, 'Adriano')
	consumer_threads << spawn consumer('consumer 3', mut exchange, mut mtx, 'Kaka')

	for t in producer_threads {
		t.wait()
	}
	for t in consumer_threads {
		t.wait()
	}
}
