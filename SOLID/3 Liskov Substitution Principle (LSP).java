// Liskov Substitution Principle is the third principle in SOLID. It states that objects of a superclass should be replaceable with objects of its subclasses without affecting the functionality of the program. In other words, a subclass should be substitutable for its superclass without breaking the program.

// Base class for all birds
abstract class Bird {
    private String name;

    public Bird(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    // General behavior for birds
    public void eat() {
        System.out.println(name + " is eating...");
    }
}

// Interface for flying behavior
interface Flyable {
    void fly();
}

// Flying bird
class Sparrow extends Bird implements Flyable {
    public Sparrow(String name) {
        super(name);
    }

    @Override
    public void fly() {
        System.out.println(getName() + " is flying...");
    }
}

// Non-flying bird
class Ostrich extends Bird {
    public Ostrich(String name) {
        super(name);
    }

    // Ostriches do not implement Flyable
}

// Client code
public class BirdExample {
    public static void main(String[] args) {
        Bird sparrow = new Sparrow("Sparrow");
        Bird ostrich = new Ostrich("Ostrich");

        // Common behavior for all birds
        sparrow.eat();
        ostrich.eat();

        // Specific behavior for Flyable birds
        if (sparrow instanceof Flyable) {
            ((Flyable) sparrow).fly();
        }

        // Ostrich will not have a fly() method, so no inappropriate behavior.
    }
}
