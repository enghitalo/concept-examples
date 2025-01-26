import time
import sync

type Callback = fn (id string)

fn producer(producer_name string, mut exchange map[string][]Callback, mut mtx sync.Mutex, routing_key string) {
    for i in 1 .. 5 {
        mtx.lock()
        if routing_key !in exchange {
            exchange[routing_key] = []Callback{}
        }
        exchange[routing_key] << fn [producer_name, i] (consumer_name string) {
            println('task ${i} created by producer ${producer_name}: consumed by ${consumer_name}')
            time.sleep(500 * time.millisecond)
        }
        println('Produced: task ${i} with routing_key "${routing_key}"')
        time.sleep(50 * time.millisecond)
        mtx.unlock()
    }
}

fn consumer(consumer_name string, mut exchange map[string][]Callback, mut mtx sync.Mutex, routing_key string) {
    for {
        mtx.lock()
        if routing_key in exchange && exchange[routing_key].len > 0 {
            callback := exchange[routing_key][0]
            exchange[routing_key].delete(0)
            mtx.unlock()
            callback(consumer_name) // run after unlocking to allow other threads to consume
            continue
        } else {
            println('- No items to consume for routing_key "${routing_key}"')
            mtx.unlock()
            break // Uncomment to stop after consuming all items
        }
    }
}

fn heavy_processing(queue_id string) {
    println('One more: ${queue_id}')
    time.sleep(500 * time.millisecond)
}

fn main() {
    mut mtx := sync.new_mutex()
    mut exchange := map[string][]Callback{}

    // Producers with different routing keys
    producer_threads := [
        spawn producer('Paula', mut &exchange, mut mtx, 'key1'),
        spawn producer('Adriano', mut &exchange, mut mtx, 'key2'),
        spawn producer('Kaka', mut &exchange, mut mtx, 'key1'),
        spawn producer('Hitalo', mut &exchange, mut mtx, 'key3'),
        spawn producer('Jonh', mut &exchange, mut mtx, 'key2'),
    ]

    mut consumer_threads := [
        spawn consumer('consumer 0', mut &exchange, mut mtx, 'key1'),
    ]

    // Spawn consumers for different routing keys
    for i in 1 .. 4 {
        consumer_threads << spawn consumer('consumer ${i}', mut &exchange, mut mtx, 'key${i}')
    }

    // Add a global heavy processing task
    mtx.lock()
    if 'global' !in exchange {
        exchange['global'] = []Callback{}
    }
    exchange['global'] << heavy_processing
    mtx.unlock()

    for t in producer_threads {
        t.wait()
    }
    for t in consumer_threads {
        t.wait()
    }
}
