import time
import sync

type Callback = fn (id string)

fn producer(producer_name string, mut queues []&[]Callback, mut mtx sync.Mutex) {
    for i in 1 .. 5 {
        task := fn [producer_name, i] (consumer_name string) {
            println('task ${i} created by producer ${producer_name}: consumed by ${consumer_name}')
            time.sleep(500 * time.millisecond)
        }

        mtx.lock()
        for queue in queues {
            queue << task // Broadcast the task to all consumer queues
        }
        println('Produced: task ${i} by ${producer_name}')
        time.sleep(50 * time.millisecond)
        mtx.unlock()
    }
}

fn consumer(consumer_name string, mut queue []Callback, mut mtx sync.Mutex) {
    for {
        mtx.lock()
        if queue.len > 0 {
            callback := queue[0]
            queue.delete(0)

            mtx.unlock()
            callback(consumer_name) // Run after unlocking to allow other threads to consume
            continue
        } else {
            println('- No items to consume for ${consumer_name}')
            mtx.unlock()
            break // Uncomment to stop after consuming all items
        }
    }
}

fn main() {
    mut mtx := sync.new_mutex()

    // Create separate queues for each consumer
    mut queues := []&[]Callback{}
    for _ in 0 .. 16 {
        queues << &[]Callback{}
    }

    // Spawn producers
    producer_threads := [
        spawn producer('Paula', mut queues, mut mtx),
        spawn producer('Adriano', mut queues, mut mtx),
        spawn producer('Kaka', mut queues, mut mtx),
        spawn producer('Hitalo', mut queues, mut mtx),
        spawn producer('Jonh', mut queues, mut mtx),
    ]

    // Spawn consumers, each with its own queue
    mut consumer_threads := []thread{}
    for i, queue in queues {
        consumer_threads << spawn consumer('consumer ${i}', mut queue, mut mtx)
    }

    for t in producer_threads {
        t.wait()
    }
    for t in consumer_threads {
        t.wait()
    }
}
