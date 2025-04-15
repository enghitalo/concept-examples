/**
 * This code demonstrates several key object-oriented programming (OOP)
 * principles and SOLID design principles:
 *
 * 1. **Encapsulation**:
 * - Encapsulation is achieved by restricting direct access to the fields of the
 * `User` class using private access modifiers.
 * - Controlled access is provided through public getter and setter methods,
 * ensuring data integrity and hiding implementation details.
 *
 * 2. **Abstraction**:
 * - Abstraction is implemented through the `DatabaseConnector` interface, which
 * defines high-level operations (connect, disconnect, saveUser, getUserById).
 * - Concrete implementations (`PostgreSQLConnector`, `MySQLConnector`) provide
 * specific details while adhering to the abstract contract.
 *
 * 3. **Inheritance**:
 * - Although not explicitly used in this code, inheritance is a mechanism where
 * a class can inherit behavior from a parent class.
 * - This principle is indirectly supported by the use of interfaces, which
 * allow for polymorphic behavior.
 *
 * 4. **Polymorphism**:
 * - Polymorphism is demonstrated through the `DatabaseConnector` interface and
 * its implementations (`PostgreSQLConnector`, `MySQLConnector`).
 * - The `createConnector` factory method selects the appropriate implementation
 * at runtime, enabling flexible behavior.
 *
 * 5. **Single Responsibility Principle (SRP)**:
 * - Each class has a single responsibility:
 * - `User` handles user data encapsulation.
 * - `DatabaseUserRepository` manages persistence logic.
 * - `UserService` handles business logic related to user operations.
 *
 * 6. **Open-Closed Principle (OCP)**:
 * - The code is open for extension but closed for modification.
 * - New database types can be added by creating new implementations of
 * `DatabaseConnector` without modifying existing code.
 *
 * 7. **Liskov Substitution Principle (LSP)**:
 * - Subtypes (`PostgreSQLConnector`, `MySQLConnector`) can replace the base
 * type (`DatabaseConnector`) without altering the correctness of the program.
 * - This ensures that the system remains functional regardless of the specific
 * implementation used.
 *
 * 8. **Interface Segregation Principle (ISP)**:
 * - Interfaces are segregated into smaller, more specific contracts
 * (`ReadOperations`, `WriteOperations`).
 * - This prevents classes from being forced to implement methods they do not
 * use.
 *
 * 9. **Dependency Inversion Principle (DIP)**:
 * - High-level modules (`UserService`) depend on abstractions
 * (`UserRepository`) rather than concrete implementations.
 * - This decouples the business logic from the persistence layer, making the
 * system more flexible and testable.
 */

// ENCAPSULATION: The User class encapsulates its fields (id, name, email)
// by making them private and provides controlled access through public
// getter and setter methods.
class User {
    private int id;
    private String name;
    private String email;

    public User(int id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // Controlled access methods maintain data integrity
    // Getter and setter methods to access and modify private fields
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

// INTERFACE SEGREGATION PRINCIPLE (ISP): Interfaces are split into smaller,
// more specific contracts to avoid forcing classes to implement unnecessary
// methods.
interface ReadOperations {
    User getUserById(int id); // Defines a read operation to fetch a user by ID
}

interface WriteOperations {
    void saveUser(User user); // Defines a write operation to save a user
}

// ABSTRACTION: The DatabaseConnector interface abstracts database operations
// and connection management, allowing flexibility in implementation.
interface DatabaseConnector extends ReadOperations, WriteOperations {
    void connect();

    void disconnect();
}

// OPEN/CLOSED PRINCIPLE (OCP): New database types can be added by creating
// new implementations of DatabaseConnector without modifying existing code.
// LISKOV SUBSTITUTION PRINCIPLE (LSP): Subtypes can replace the base type
// without altering the program's correctness.
class PostgreSQLConnector implements DatabaseConnector {
    @Override
    public void connect() {
        System.out.println("Connecting to PostgreSQL...");
    }

    @Override
    public void disconnect() {
        System.out.println("Disconnecting from PostgreSQL...");
    }

    @Override
    public void saveUser(User user) {
        System.out.println("Saving user to PostgreSQL: " + user.getName());
    }

    @Override
    public User getUserById(int id) {
        return new User(id, "PostgresUser", "postgres@example.com");
    }
}

class MySQLConnector implements DatabaseConnector {
    @Override
    public void connect() {
        System.out.println("Connecting to MySQL...");
    }

    @Override
    public void disconnect() {
        System.out.println("Disconnecting from MySQL...");
    }

    @Override
    public void saveUser(User user) {
        System.out.println("Saving user to MySQL: " + user.getName());
    }

    @Override
    public User getUserById(int id) {
        return new User(id, "MySQLUser", "mysql@example.com");
    }
}

// REPOSITORY LAYER: Abstracts data access logic, adhering to the
// DEPENDENCY INVERSION PRINCIPLE (DIP).
interface UserRepository {
    void save(User user); // Save a user to the repository

    User findById(int id); // Find a user by ID in the repository
}

// SINGLE RESPONSIBILITY PRINCIPLE (SRP): The DatabaseUserRepository class
// is responsible only for user persistence logic.
class DatabaseUserRepository implements UserRepository {
    private final DatabaseConnector dbConnector; // Dependency on a database connector

    // Constructor injects the database connector, adhering to DIP
    public DatabaseUserRepository(DatabaseConnector dbConnector) {
        this.dbConnector = dbConnector;
    }

    @Override
    public void save(User user) {
        dbConnector.connect();
        dbConnector.saveUser(user);
        dbConnector.disconnect();
    }

    @Override
    public User findById(int id) {
        dbConnector.connect();
        User user = dbConnector.getUserById(id);
        dbConnector.disconnect();
        return user;
    }
}

// SINGLE RESPONSIBILITY PRINCIPLE (SRP): The UserService class handles
// business logic related to user operations, separate from persistence
// concerns.
class UserService {
    private final UserRepository userRepository; // Dependency on a user repository

    // Constructor injects the repository, adhering to DIP
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void registerUser(User user) {
        userRepository.save(user);
    }

    public User getUser(int id) {
        return userRepository.findById(id);
    }
}

// POLYMORPHISM: Demonstrates runtime selection of database implementations
public class Main {
    public static void main(String[] args) {
        // Factory method creates the appropriate database connector
        DatabaseConnector connector = createConnector("PostgreSQL");

        UserRepository repository = new DatabaseUserRepository(connector);
        UserService service = new UserService(repository);

        User newUser = new User(1, "Alice", "alice@example.com");
        service.registerUser(newUser);

        User foundUser = service.getUser(1);
        System.out.println("Found user: " + foundUser.getName());
    }

    private static DatabaseConnector createConnector(String type) {
        // POLYMORPHISM: Factory method selects the appropriate database implementation
        return switch (type) {
            case "PostgreSQL" -> new PostgreSQLConnector();
            case "MySQL" -> new MySQLConnector();
            default -> throw new IllegalArgumentException("Unsupported database");
        };
    }
}