use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Object {
    id: usize,
}

struct ObjectPool {
    pool: Vec<Rc<RefCell<Object>>>,
}

impl ObjectPool {
    fn new(size: usize) -> Self {
        let mut pool = Vec::with_capacity(size);
        for i in 0..size {
            pool.push(Rc::new(RefCell::new(Object { id: i })));
        }
        ObjectPool { pool }
    }

    fn acquire(&self) -> Option<Rc<RefCell<Object>>> {
        for obj in &self.pool {
            let mut obj_borrowed = obj.borrow_mut();
            if obj_borrowed.id != usize::MAX {
                let id = obj_borrowed.id;
                obj_borrowed.id = usize::MAX; // Marcar como em uso
                return Some(obj.clone());
            }
        }
        None
    }

    fn release(&self, obj: Rc<RefCell<Object>>) {
        let mut obj_borrowed = obj.borrow_mut();
        obj_borrowed.id = self.pool.iter().position(|x| Rc::ptr_eq(x, &obj)).unwrap();
    }
}

fn main() {
    let pool = ObjectPool::new(5);

    let obj1 = pool.acquire().expect("No object available");
    println!("Acquired object with ID: {}", obj1.borrow().id);

    pool.release(obj1.clone());
    println!("Released object with ID: {}", obj1.borrow().id);

    let obj2 = pool.acquire().expect("No object available");
    println!("Acquired object with ID: {}", obj2.borrow().id);
}
