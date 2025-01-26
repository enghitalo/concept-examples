class User {
    private String name;

    public User(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

// Single responsibility: fetching user data
class UserRepository {
    public User getUserById(int id) {
        // Simulate fetching user
        return new User("John Doe");
    }
}

// Single responsibility: generating reports
class ReportGenerator {
    public void generateReport(User user) {
        System.out.println("Generating report for: " + user.getName());
    }
}
