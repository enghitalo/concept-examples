// Dependency Inversion Principle (DIP) example in Java
// High-level modules should not depend on low-level modules. Both should depend on abstractions.
// Example: Use interfaces to decouple dependencies.

// High-level module
// In this example, the NotificationService class is a high-level module that depends on the MessageSender interface, which is an abstraction.
// Class that depends on abstractions.
class NotificationService {
    private MessageSender messageSender;

    public NotificationService(MessageSender messageSender) {
        this.messageSender = messageSender;
    }

    public void sendNotification(String message) {
        messageSender.sendMessage(message);
    }
}

// Low-level module
// MessageSender interface is the abstraction that decouples the NotificationService from the concrete implementations (EmailSender and SmsSender).
// Interface that decouples high-level modules from low-level modules.
interface MessageSender {
    void sendMessage(String message);
}

class EmailSender implements MessageSender {
    public void sendMessage(String message) {
        System.out.println("Sending email with message: " + message);
    }
}

class SmsSender implements MessageSender {
    public void sendMessage(String message) {
        System.out.println("Sending SMS with message: " + message);
    }
}

public class DIPExample {
    public static void main(String[] args) {
        MessageSender emailSender = new EmailSender();
        NotificationService notificationService = new NotificationService(emailSender);
        notificationService.sendNotification("Hello via Email!");

        MessageSender smsSender = new SmsSender();
        notificationService = new NotificationService(smsSender);
        notificationService.sendNotification("Hello via SMS!");
    }
}