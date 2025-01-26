import time
import sync

type Callback = fn (id string)

fn producer(producer_name string, mut exchange map[string][]Callback, mut mtx sync.Mutex, routing_key string) {
	for i in 1 .. 5 {
		task := fn [producer_name, i] (consumer_name string) {
			println('task ${i} created by producer ${producer_name}: consumed by ${consumer_name}')
			time.sleep(500 * time.millisecond)
		}

		mtx.lock()
		if routing_key !in exchange {
			exchange[routing_key] = []Callback{}
		}
		exchange[routing_key] << task
		println('Produced: task ${i} with routing_key "${routing_key}" by ${producer_name}')
		time.sleep(50 * time.millisecond)
		mtx.unlock()
	}
}

fn consumer(consumer_name string, mut exchange map[string][]Callback, mut mtx sync.Mutex, binding_key string) {
	for {
		mtx.lock()
		mut found := false
		for topic, queue in exchange {
			if matches_topic(topic, binding_key) && queue.len > 0 {
				callback := queue[0]
				exchange[topic].delete(0)

				mtx.unlock()
				callback(consumer_name) // Execute after unlocking
				found = true
				break
			}
		}
		if !found {
			println('- No items to consume for ${consumer_name} with binding_key "${binding_key}"')
			mtx.unlock()
			break
		}
	}
}

fn matches_topic(topic string, binding_key string) bool {
	topic_parts := topic.split('.')
	binding_parts := binding_key.split('.')

	for i in 0 .. binding_parts.len {
		if i >= topic_parts.len {
			return binding_parts[i] == '#'
		}
		if binding_parts[i] == '#' {
			return true
		}
		if binding_parts[i] != '*' && binding_parts[i] != topic_parts[i] {
			return false
		}
	}
	return topic_parts.len == binding_parts.len
}

fn main() {
	mut mtx := sync.new_mutex()
	mut exchange := map[string][]Callback{}

	// Producers with specific routing keys
	producer_threads := [
		spawn producer('Paula', mut exchange, mut mtx, 'app.error'),
		spawn producer('Adriano', mut exchange, mut mtx, 'app.info'),
		spawn producer('Kaka', mut exchange, mut mtx, 'db.error'),
		spawn producer('Hitalo', mut exchange, mut mtx, 'db.info'),
		spawn producer('Jonh', mut exchange, mut mtx, 'cache.warn'),
	]

	// Consumers subscribing to topics using patterns
	mut consumer_threads := []thread{}
	consumer_threads << spawn consumer('consumer 1', mut exchange, mut mtx, 'app.*')
	consumer_threads << spawn consumer('consumer 2', mut exchange, mut mtx, 'db.#')
	consumer_threads << spawn consumer('consumer 3', mut exchange, mut mtx, '*.warn')

	for t in producer_threads {
		t.wait()
	}
	for t in consumer_threads {
		t.wait()
	}
}
