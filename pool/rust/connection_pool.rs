use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::time::Duration;

struct Connection {
    id: usize,
    in_use: bool,
}

struct ConnectionPool {
    connections: Vec<Arc<Mutex<Connection>>>,
    condvar: Arc<Condvar>,
}

impl ConnectionPool {
    fn new(size: usize) -> Self {
        let mut connections = Vec::with_capacity(size);
        for i in 0..size {
            connections.push(Arc::new(Mutex::new(Connection { id: i, in_use: false })));
        }
        ConnectionPool {
            connections,
            condvar: Arc::new(Condvar::new()),
        }
    }

    fn acquire_connection(&self) -> Arc<Mutex<Connection>> {
        let mut connection = None;
        while connection.is_none() {
            for conn in &self.connections {
                let mut conn = conn.lock().unwrap();
                if !conn.in_use {
                    conn.in_use = true;
                    connection = Some(conn.clone());
                    break;
                }
            }
            if connection.is_none() {
                self.condvar.wait_timeout_while(
                    &self.connections[0].lock().unwrap(),
                    Duration::from_millis(10),
                    |conn| conn.in_use
                ).unwrap();
            }
        }
        connection.unwrap()
    }

    fn release_connection(&self, connection: Arc<Mutex<Connection>>) {
        let mut conn = connection.lock().unwrap();
        conn.in_use = false;
        println!("Connection {} released.", conn.id);
        self.condvar.notify_one();
    }
}

fn use_connection(pool: Arc<ConnectionPool>) {
    let conn = pool.acquire_connection();
    {
        let conn = conn.lock().unwrap();
        println!("Using connection {}", conn.id);
    }
    thread::sleep(Duration::from_millis(500));
    pool.release_connection(conn);
}

fn main() {
    let pool = Arc::new(ConnectionPool::new(3));

    let mut handles = vec![];
    for _ in 0..5 {
        let pool_clone = Arc::clone(&pool);
        handles.push(thread::spawn(move || {
            use_connection(pool_clone);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
