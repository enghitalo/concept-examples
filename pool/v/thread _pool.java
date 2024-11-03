import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

class ThreadPool {
    private final List<Worker> workers;
    private final BlockingQueue<Runnable> taskQueue;

    public ThreadPool(int numThreads) {
        taskQueue = new LinkedBlockingQueue<>();
        workers = new ArrayList<>(numThreads);

        for (int i = 0; i < numThreads; i++) {
            Worker worker = new Worker(taskQueue);
            workers.add(worker);
            new Thread(worker).start();
        }
    }

    public void execute(Runnable task) {
        try {
            taskQueue.put(task);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

class Worker implements Runnable {
    private final BlockingQueue<Runnable> taskQueue;

    public Worker(BlockingQueue<Runnable> taskQueue) {
        this.taskQueue = taskQueue;
    }

    @Override
    public void run() {
        while (true) {
            try {
                Runnable task = taskQueue.take();
                task.run();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}

public class Main {
    public static void main(String[] args) {
        ThreadPool pool = new ThreadPool(3);

        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            pool.execute(() -> {
                System.out.println("Executing task " + taskId);
            });
        }
    }
}
