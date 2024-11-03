import java.util.ArrayList;
import java.util.List;

class ObjectPool {
    private final List<MyObject> pool;
    private final int maxSize;

    public ObjectPool(int size) {
        this.maxSize = size;
        pool = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            pool.add(new MyObject(i));
        }
    }

    public MyObject acquire() {
        for (MyObject obj : pool) {
            if (!obj.isInUse()) {
                obj.setInUse(true);
                return obj;
            }
        }
        return null; // No available object
    }

    public void release(MyObject obj) {
        obj.setInUse(false);
    }
}

class MyObject {
    private final int id;
    private boolean inUse;

    public MyObject(int id) {
        this.id = id;
        this.inUse = false;
    }

    public int getId() {
        return id;
    }

    public boolean isInUse() {
        return inUse;
    }

    public void setInUse(boolean inUse) {
        this.inUse = inUse;
    }
}

public class Main {
    public static void main(String[] args) {
        ObjectPool pool = new ObjectPool(5);

        MyObject obj1 = pool.acquire();
        System.out.println("Acquired object with ID: " + obj1.getId());

        pool.release(obj1);
        System.out.println("Released object with ID: " + obj1.getId());

        MyObject obj2 = pool.acquire();
        System.out.println("Acquired object with ID: " + obj2.getId());
    }
}
