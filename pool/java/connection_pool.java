import java.util.ArrayList;
import java.util.List;

class Connection {
    private final int id;
    private boolean inUse;

    public Connection(int id) {
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

class ConnectionPool {
    private final List<Connection> connections;

    public ConnectionPool(int size) {
        connections = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            connections.add(new Connection(i));
        }
    }

    public synchronized Connection acquireConnection() {
        for (Connection conn : connections) {
            if (!conn.isInUse()) {
                conn.setInUse(true);
                System.out.println("Connection " + conn.getId() + " acquired.");
                return conn;
            }
        }
        return null; // No available connection
    }

    public synchronized void releaseConnection(Connection connection) {
        connection.setInUse(false);
        System.out.println("Connection " + connection.getId() + " released.");
    }
}

public class Main {
    public static void main(String[] args) {
        ConnectionPool pool = new ConnectionPool(3);

        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                Connection conn = pool.acquireConnection();
                if (conn != null) {
                    try {
                        // Simulate using the connection
                        Thread.sleep(500);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    pool.releaseConnection(conn);
                }
            }).start();
        }
    }
}
