// Low Level Design Learning Path - Complete Curriculum
export const lldLearningPath = {
  id: 'lld',
  title: 'Low Level Design Mastery',
  slug: 'lld',
  description: 'Master Object-Oriented Design, Design Patterns, and build scalable, maintainable software systems',
  duration: '8-10 weeks',
  difficulty: 'Intermediate to Advanced',
  totalModules: 12,
  totalProblems: 50,
  color: '#8b5cf6',
  icon: 'Box',
  
  overview: {
    objectives: [
      'Master Object-Oriented Programming principles (OOP)',
      'Learn all 23 Gang of Four (GoF) design patterns',
      'Understand SOLID principles deeply',
      'Design real-world systems from scratch',
      'Write clean, maintainable, and extensible code',
      'Prepare for LLD interview rounds at top companies'
    ],
    prerequisites: [
      'Strong programming skills in Java, C++, Python, or JavaScript',
      'Basic understanding of OOP concepts',
      'Familiarity with data structures',
      'Experience with building small applications'
    ],
    outcomes: [
      'Design complex systems with proper abstraction',
      'Apply design patterns to solve real problems',
      'Write SOLID, maintainable code',
      'Ace LLD rounds at FAANG companies',
      'Refactor legacy code effectively',
      'Make informed design decisions'
    ],
    skillsGained: [
      'Object-Oriented Design',
      'Design Patterns',
      'SOLID Principles',
      'Clean Code',
      'Refactoring',
      'API Design',
      'Code Architecture',
      'System Modeling'
    ]
  },

  studyPlan: {
    beginner: {
      duration: '10 weeks',
      hoursPerWeek: '8-10 hours',
      approach: 'Focus on OOP fundamentals, start with simple patterns',
      weeklyGoals: '1 module per week, implement 3-4 patterns/designs'
    },
    intermediate: {
      duration: '8 weeks',
      hoursPerWeek: '10-12 hours',
      approach: 'Deep dive into patterns, build complex systems',
      weeklyGoals: '1-2 modules per week, implement 5-6 patterns/designs'
    },
    advanced: {
      duration: '6 weeks',
      hoursPerWeek: '12-15 hours',
      approach: 'Focus on system design, pattern combinations, real-world problems',
      weeklyGoals: '2 modules per week, implement 7-8 complex systems'
    }
  },

  modules: [
    {
      id: 1,
      slug: 'oop-fundamentals',
      title: 'OOP Fundamentals',
      description: 'Master the four pillars of Object-Oriented Programming',
      difficulty: 'Beginner',
      estimatedTime: '1 week',
      problemCount: 5,
      topics: [
        'Classes and Objects',
        'Encapsulation',
        'Inheritance',
        'Polymorphism',
        'Abstraction',
        'Interfaces vs Abstract Classes',
        'Composition vs Inheritance',
        'Access Modifiers'
      ],
      theory: {
        fundamentals: `
THE FOUR PILLARS OF OOP:

1. ENCAPSULATION:
CONCEPT: Bundle data (attributes) and methods that operate on it together.
Hide internal implementation, expose only necessary interface.

BENEFITS:
- Data protection: Can't access/modify directly
- Control: Implement validation in setters
- Flexibility: Can change internal implementation without breaking external code
- Maintainability: Centralized place to modify behavior

EXAMPLE:
class BankAccount {
  #balance = 0; // Private field (encapsulated)
  
  constructor(initialBalance) {
    this.#balance = initialBalance;
  }
  
  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }
  
  getBalance() {
    return this.#balance; // Controlled access
  }
}

2. INHERITANCE:
CONCEPT: Child class inherits properties and methods from parent class.
Promotes code reuse and establishes "is-a" relationship.

TYPES:
- Single: Child extends one parent
- Multi-level: Child → Parent → Grandparent
- Hierarchical: Multiple children from one parent
- Hybrid: Combination of above

ADVANTAGES:
- Code reuse: Don't repeat common code
- Relationship: Models real-world "is-a" relationships
- Polymorphism base: Enables dynamic dispatch

EXAMPLE:
class Animal {
  makeSound() {
    console.log("Generic sound");
  }
}

class Dog extends Animal {
  makeSound() {
    console.log("Woof!");
  }
}

3. POLYMORPHISM:
CONCEPT: Same interface, different implementations.
Objects respond to same message differently based on type.

TYPES:
- Compile-time (Static): Method overloading - same method name, different parameters
- Runtime (Dynamic): Method overriding - child overrides parent method

BENEFITS:
- Flexibility: Write general code that works with multiple types
- Extension: Add new types without changing existing code
- Testability: Use duck typing for mocking

EXAMPLE:
class Shape {
  area() { return 0; }
}

class Circle extends Shape {
  constructor(radius) { this.radius = radius; }
  area() { return Math.PI * this.radius * this.radius; }
}

class Rectangle extends Shape {
  constructor(w, h) { this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

// Polymorphic usage
function calculateTotalArea(shapes) {
  return shapes.reduce((sum, shape) => sum + shape.area(), 0);
}

4. ABSTRACTION:
CONCEPT: Hide complexity, expose only essential features.
Show what to do, not how to do it.

DIFFERENCE FROM ENCAPSULATION:
- Encapsulation: How - Hide implementation details
- Abstraction: What - Hide unnecessary complexity

EXAMPLE:
// User doesn't need to know HOW a car works
class Car {
  drive() { /* complex logic */ }
  brake() { /* complex logic */ }
}

// User just calls simple methods
const car = new Car();
car.drive();
car.brake();
        `,
        composition: `
COMPOSITION VS INHERITANCE:

INHERITANCE ("is-a"):
class Vehicle {}
class Car extends Vehicle {} // Car IS-A Vehicle
- Strong coupling between parent and child
- Cannot change parent hierarchy later
- Fragile base class problem
- When: Clear permanent relationship

Example: Dog IS-A Animal (permanent)

COMPOSITION ("has-a"):
class Car {
  engine = new Engine();
  wheels = [new Wheel(), ...];
}
- Loose coupling
- Flexible: can change components
- Follows Favor composition principle
- When: Objects collaborated to form larger object

Example: Car HAS-A Engine (can be replaced)

WHEN TO USE INHERITANCE:
- Clear permanent "is-a" relationship
- Small, stable hierarchy
- Sharing code between closely related classes
- Need polymorphism through inheritance

WHEN TO USE COMPOSITION:
- Flexible component relationships
- Multiple responsibilities (don't repeat with inheritance)
- Want to avoid inheritance chain
- Need runtime flexibility

EXAMPLE - Design Problem:
Design: Bird, Penguin, Airplane all fly

WRONG (Inheritance):
class FlyingThing {
  fly() {}
}
class airplane extends FlyingThing {}
// Penguin IS-A Bird, but penguin doesn't fly like others
Problem: Can't express different flying behaviors

RIGHT (Composition + Interface):
class Flier {
  fly() {} // Interface
}
class Bird implements Flier { fly() { /* flaps wings */ } }
class Airplane implements Flier { fly() { /* engines */ } }
class Penguin extends Bird { fly() { /* waddles */ } }

Each object has its own Flier implementation
  `,
  architectureHeuristics: `
OOP ARCHITECTURE HEURISTICS FOR REAL SYSTEMS:

1. MODEL STABILITY FIRST:
- Core domain concepts should change slower than delivery/integration layers.
- Keep domain entities and invariants isolated from UI, DB, and API details.

2. ENFORCE INVARIANTS INSIDE AGGREGATES:
- If balance cannot go below zero, the entity must enforce it.
- Do not rely only on service-layer checks.

3. BEHAVIOR-CENTRIC MODELING:
- Prefer rich domain models over anemic DTO-style classes.
- Methods should represent business actions, not generic setters.

4. DEPENDENCY DIRECTION:
- High-level policy depends on abstractions.
- Infrastructure depends on domain interfaces.

5. LIMIT PUBLIC SURFACE AREA:
- Public methods are long-term contracts.
- Start minimal, evolve intentionally.

6. TEST DESIGN QUALITY, NOT JUST OUTPUT:
- Add tests for illegal state transitions, invariant violations, and substitution behavior.
  `,
  tradeoffMatrix: `
OOP TRADE-OFF MATRIX:

INHERITANCE:
- Pros: reuse, polymorphism, clear hierarchy when domain is stable
- Cons: tight coupling, fragile base class, rigid evolution
- Use when: true and stable "is-a" relationship exists

COMPOSITION:
- Pros: flexibility, runtime variation, better separation of concerns
- Cons: more wiring/indirection
- Use when: behavior combinations evolve frequently

INTERFACES:
- Pros: decoupling, testability, substitutability
- Cons: may add indirection without value if overused
- Use when: multiple implementations or external boundaries exist

ABSTRACT CLASSES:
- Pros: shared code + contracts together
- Cons: inheritance lock-in
- Use when: close family with stable default behavior
  `,
  interviewTemplate: `
INTERVIEW ANSWER TEMPLATE - OOP/LDD:

1. Clarify requirements:
- Functional flows, constraints, edge cases, extension points

2. Identify core entities and invariants:
- What objects exist? What rules must never break?

3. Define relationships:
- Composition vs inheritance with rationale

4. Design interfaces:
- Show abstractions for volatile parts (payments, notifications, repositories)

5. Walk through one critical flow:
- Create object, execute behavior, enforce invariants, persist/notify

6. Discuss trade-offs:
- Why this model is maintainable and extensible
- Where complexity is intentionally introduced
  `,
  caseStudyWalkthrough: `
CASE STUDY WALKTHROUGH - DIGITAL WALLET DOMAIN:

Problem:
Design a wallet that supports add funds, transfer, and statement generation.

Step 1: Identify core entities
- WalletAccount, Transaction, TransferRequest, LimitPolicy

Step 2: Define invariants
- Balance can never be negative
- Transfer must be atomic debit+credit
- Transaction log must be append-only

Step 3: Apply OOP principles
- Encapsulation: WalletAccount validates all balance mutations
- Abstraction: PaymentGateway interface for external providers
- Polymorphism: Multiple transfer channels under common interface
- Composition: Wallet uses LimitPolicy and FraudPolicy components

Step 4: Walk critical flow
transfer(from, to, amount)
1. Validate limit/fraud checks
2. Reserve amount
3. Debit source, credit destination
4. Persist transaction entries
5. Publish notification event

Step 5: Discuss extension
- Add international transfer by introducing FxStrategy
- No change required in WalletAccount core behavior
  `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Object-Oriented Programming Fundamentals',
          duration: '60 min',
          description: 'Complete guide to OOP concepts with real-world examples',
          difficulty: 'Beginner',
          url: 'https://www.youtube.com/watch?v=pTB0EiLXUC8'
        },
        {
          type: 'article',
          title: 'The Four Pillars of OOP',
          duration: '45 min',
          description: 'Deep dive into encapsulation, inheritance, polymorphism, and abstraction',
          difficulty: 'Beginner'
        },
        {
          type: 'video',
          title: 'Composition vs Inheritance',
          duration: '30 min',
          description: 'When to use composition over inheritance',
          difficulty: 'Intermediate'
        },
        {
          type: 'practice',
          title: 'OOP Practice Problems',
          duration: '4 hours',
          description: 'Hands-on exercises to solidify OOP concepts',
          difficulty: 'Beginner'
        }
      ],
      keyProblems: [
        { 
          title: 'Design a Library Management System',
          difficulty: 'Easy',
          description: 'Create classes for Book, Member, Library with proper encapsulation',
          mustSolve: true 
        },
        { 
          title: 'Implement a Banking System',
          difficulty: 'Easy',
          description: 'Design Account hierarchy with checking, savings accounts',
          mustSolve: true 
        },
        { 
          title: 'Build a Shape Hierarchy',
          difficulty: 'Easy',
          description: 'Demonstrate polymorphism with different shapes',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Start by identifying real-world entities. Practice converting requirements to classes. Focus on proper encapsulation.',
      commonMistakes: [
        'Making everything public (breaking encapsulation)',
        'Overusing inheritance instead of composition',
        'Not understanding the difference between interface and abstract class',
        'Creating god classes that do everything'
      ],
      tips: [
        'Think in terms of real-world objects and their behaviors',
        'Use composition when "has-a" relationship, inheritance for "is-a"',
        'Keep classes focused on single responsibility',
        'Program to interfaces, not implementations',
        'Practice identifying access levels for class members'
      ]
    },
    {
      id: 2,
      slug: 'solid-principles',
      title: 'SOLID Principles',
      description: 'Master the five principles of object-oriented design',
      difficulty: 'Intermediate',
      estimatedTime: '1 week',
      problemCount: 5,
      topics: [
        'Single Responsibility Principle (SRP)',
        'Open/Closed Principle (OCP)',
        'Liskov Substitution Principle (LSP)',
        'Interface Segregation Principle (ISP)',
        'Dependency Inversion Principle (DIP)',
        'Code Smells',
        'Refactoring Techniques',
        'Clean Code Practices'
      ],
      theory: {
        srp: `
SINGLE RESPONSIBILITY PRINCIPLE (SRP):

PRINCIPLE:
A class should have ONE reason to change.
Each class should have only ONE responsibility.

GOAL:
- Easy to understand: Class does one thing
- Easy to test: Mock one responsibility
- Easy to maintain: Changes to responsibility don't affect others
- Reusable: Single focused classes are reusable

VIOLATION EXAMPLE:
class UserManager {
  // Responsibility 1: User management
  createUser(name, email) { }
  updateUser(id, data) { }
  
  // Responsibility 2: Email notifications
  sendWelcomeEmail(user) { }
  sendPasswordReset(user) { }
  
  // Responsibility 3: Logging
  logUserAction(action) { }
}

PROBLEMS:
- Changes to email sending break UserManager
- Changes to logging break UserManager
- Hard to test email without UserManager
- Can't reuse email logic elsewhere

REFACTORED:
class UserManager {
  constructor(emailService, logger) {
    this.emailService = emailService;
    this.logger = logger;
  }
  
  createUser(name, email) {
    // User creation logic
    this.logger.log("User created");
    return newUser;
  }
}

class EmailService {
  sendWelcomeEmail(user) { }
  sendPasswordReset(user) { }
}

class Logger {
  log(message) { }
}

BENEFITS:
- Each class has one reason to change
- Easy to test: mock dependent services
- Reusable: EmailService used elsewhere
- Maintainable: Changes isolated
        `,
        ocp: `
OPEN/CLOSED PRINCIPLE (OCP):

PRINCIPLE:
Software should be OPEN for extension, CLOSED for modification.
Add new functionality without changing existing code.

GOAL:
- Add features without breaking existing
- Reduce regression risks
- Existing code remains untested (stable)
- New code isolated and testable

VIOLATION EXAMPLE:
class PaymentProcessor {
  processPayment(payment) {
    if (payment.type === 'credit_card') {
      // Process credit card
    } else if (payment.type === 'paypal') {
      // Process PayPal
    } else if (payment.type === 'stripe') {
      // Process Stripe
    }
  }
}

PROBLEM:
- Each new payment type requires modifying class
- Risks breaking existing payment types
- Open for modification, not extension

REFACTORED (STRATEGY PATTERN):
interface PaymentMethod {
  process(amount): boolean;
}

class CreditCardPayment implements PaymentMethod {
  process(amount) { /* process CC */ }
}

class PayPalPayment implements PaymentMethod {
  process(amount) { /* process PayPal */ }
}

class PaymentProcessor {
  constructor(paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
  
  processPayment(amount) {
    return this.paymentMethod.process(amount);
  }
}

BENEFITS:
- New payment types don't modify existing
- Closed for modification: PaymentProcessor unchanged
- Open for extension: Add new PaymentMethod
- Each payment method in separate class
        `,
        lsp: `
LISKOV SUBSTITUTION PRINCIPLE (LSP):

PRINCIPLE:
Subtypes must be substitutable for their base types.
If S is a subtype of T, objects of type S should replace objects of type T without breaking program.

CONCEPT:
Child class must honor parent class contract.
Method overrides must maintain expected behavior.

VIOLATION EXAMPLE:
class Bird {
  fly() { return 'flying'; }
}

class Penguin extends Bird {
  fly() { throw new Error('Cannot fly'); } // VIOLATES LSP!
}

function makeBirdFly(bird) {
  return bird.fly(); // Works for Bird, crashes for Penguin
}

PROBLEM:
- Penguin IS-A Bird, but violates Bird contract
- Code expecting Bird breaks with Penguin
- Polymorphism fails

REFACTORED:
class Bird {
  move() { } // Generic move
}

class FlyingBird extends Bird {
  fly() { return 'flying'; }
  move() { return this.fly(); }
}

class Penguin extends Bird {
  move() { return 'waddling'; } // Penguin-specific move
}

LSP CHECKLIST:
- Child method should not throw unexpected exceptions
- Output should be in expected range
- Preconditions cannot be stronger (accept fewer inputs)
- Postconditions cannot be weaker (return less)
- Invariants from parent must be maintained
        `,
        isp: `
INTERFACE SEGREGATION PRINCIPLE (ISP):

PRINCIPLE:
Clients should not depend on interfaces they don't use.
Create specific interfaces, not general ones.

GOAL:
- Small focused interfaces
- Clients depend only on methods they use
- Loose coupling between clients

VIOLATION EXAMPLE:
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* robot works */ }
  eat() { } // ERROR: Robot doesn't eat!
  sleep() { } // ERROR: Robot doesn't sleep!
}

PROBLEM:
- Robot forced to implement unused methods
- Confusing interface
- Tight coupling: changes to eat() affect Robot

REFACTORED:
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work() { }
  eat() { }
  sleep() { }
}

class Robot implements Workable {
  work() { }
}

BENEFITS:
- Only implement relevant methods
- Robot not forced to implement eat/sleep
- Can add new interface without changing existing
- Clear client dependencies
        `,
        dip: `
DEPENDENCY INVERSION PRINCIPLE (DIP):

PRINCIPLE:
High-level modules should not depend on low-level modules.
Both should depend on abstractions.
Depend on abstractions, not concrete implementations.

GOAL:
- Loose coupling
- Swappable implementations
- Testable: Easy to mock dependencies

VIOLATION EXAMPLE:
// High-level
class UserService {
  constructor() {
    this.emailSender = new GmailSender(); // TIGHT COUPLING!
  }
  
  registerUser(user) {
    // logic
    this.emailSender.send(user.email); // Must use Gmail
  }
}

// Low-level
class GmailSender {
  send(email) { }
}

PROBLEM:
- UserService depends on GmailSender
- Can't change email provider without modifying UserService
- Hard to test: can't mock email sender

REFACTORED:
// Abstraction
interface EmailService {
  send(email): void;
}

// Low-level implementations
class GmailSender implements EmailService {
  send(email) { }
}

class SendGridSender implements EmailService {
  send(email) { }
}

// High-level
class UserService {
  constructor(emailService) { // INJECT dependency
    this.emailService = emailService;
  }
  
  registerUser(user) {
    this.emailService.send(user.email); // Works with any provider
  }
}

BENEFITS:
- EmailService is abstraction
- UserService depends on abstraction, not Gmail
- Can inject GmailSender or SendGridSender
- Easy to mock for testing
  `,
  refactoringPlaybook: `
SOLID REFACTORING PLAYBOOK:

STEP 1 - DETECT SMELLS:
- God class, shotgun surgery, long conditionals, feature envy, cyclic dependencies

STEP 2 - SLICE RESPONSIBILITIES:
- Split by reason-to-change axes: policy, orchestration, IO, formatting, persistence

STEP 3 - EXTRACT ABSTRACTIONS:
- Introduce interfaces at volatile seams (gateway, repository, notifier)

STEP 4 - MOVE TO COMPOSITION:
- Replace inheritance-heavy variant logic with strategy objects

STEP 5 - LOCK IN WITH TESTS:
- Characterization tests before change
- Contract tests for interfaces
- Mutation tests for critical business rules

STEP 6 - ITERATE IN SMALL BATCHES:
- Keep each refactor deployable
- Avoid big-bang rewrites
  `,
  tradeoffMatrix: `
SOLID ADOPTION TRADE-OFFS:

Pros:
- Better change isolation and lower regression risk
- Higher testability through dependency boundaries
- Easier team parallelization due to clear module contracts

Costs:
- More classes/interfaces initially
- Additional abstraction layers can slow onboarding
- Over-application can over-engineer simple flows

PRACTICAL GUIDELINE:
- Apply SOLID strongly in high-churn/high-risk areas
- Keep low-volatility code simpler
- Optimize for clarity over pattern purity
  `,
  interviewTemplate: `
INTERVIEW ANSWER TEMPLATE - SOLID:

1. Show current issue:
- "This class has multiple reasons to change and hard-coded dependencies."

2. Map issue to principle:
- SRP/OCP/LSP/ISP/DIP with one-line justification

3. Propose target design:
- Interfaces + small focused classes + orchestration service

4. Explain migration path:
- Strangler-style incremental refactor with tests

5. Explain measurable outcomes:
- Reduced coupling, easier test mocks, safer feature extension
  `,
  caseStudyWalkthrough: `
CASE STUDY WALKTHROUGH - ORDER PRICING REFACTOR:

Initial problem:
OrderService contains 700+ lines with pricing, tax, discount, coupon, and invoice logic.

Refactor plan mapped to SOLID:
1. SRP:
- Split pricing, tax, and invoice responsibilities into dedicated services

2. OCP:
- Introduce PricingStrategy interface (Regular, Festival, VIP)

3. LSP:
- Ensure each pricing strategy honors same contract and constraints

4. ISP:
- Separate read-only pricing query interfaces from mutation APIs

5. DIP:
- OrderService depends on PricingStrategyFactory abstraction

Validation:
- Characterization tests around old output
- Contract tests for each strategy
- Golden test snapshots for invoice totals

Outcome:
- New promo rule added by implementing strategy only
- Core OrderService unchanged, safer deployments
  `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'SOLID Principles Explained',
          duration: '70 min',
          description: 'Complete guide to all five SOLID principles with examples',
          difficulty: 'Intermediate',
          url: 'https://www.youtube.com/watch?v=_jDNAf3CzeY'
        },
        {
          type: 'article',
          title: 'SOLID Principles in Action',
          duration: '60 min',
          description: 'Real-world examples of applying SOLID principles',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Refactoring to SOLID Code',
          duration: '50 min',
          description: 'How to refactor existing code to follow SOLID',
          difficulty: 'Advanced'
        },
        {
          type: 'practice',
          title: 'SOLID Refactoring Exercises',
          duration: '6 hours',
          description: 'Practice identifying and fixing SOLID violations',
          difficulty: 'Intermediate'
        }
      ],
      keyProblems: [
        { 
          title: 'Refactor Code to Follow SRP',
          difficulty: 'Medium',
          description: 'Take a god class and split it following Single Responsibility',
          mustSolve: true 
        },
        { 
          title: 'Implement Plugin System (OCP)',
          difficulty: 'Medium',
          description: 'Design extensible system without modifying existing code',
          mustSolve: true 
        },
        { 
          title: 'Fix LSP Violations',
          difficulty: 'Medium',
          description: 'Correct inheritance hierarchy that violates Liskov Substitution',
          mustSolve: true 
        },
        { 
          title: 'Apply Dependency Injection',
          difficulty: 'Medium',
          description: 'Refactor code to use dependency inversion',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Learn one principle at a time. Practice identifying violations in existing code. Refactor code to follow principles.',
      commonMistakes: [
        'Trying to apply all principles at once',
        'Over-engineering simple solutions',
        'Misunderstanding LSP (it\'s not just about inheritance)',
        'Creating too many small classes (over-splitting)'
      ],
      tips: [
        'SRP: Each class should have one reason to change',
        'OCP: Extend behavior without modifying existing code',
        'LSP: Subtypes must be substitutable for base types',
        'ISP: Many specific interfaces > one general interface',
        'DIP: Depend on abstractions, not concrete implementations'
      ]
    },
    {
      id: 3,
      slug: 'creational-patterns',
      title: 'Creational Design Patterns',
      description: 'Master object creation mechanisms and patterns',
      difficulty: 'Intermediate',
      estimatedTime: '1-2 weeks',
      problemCount: 6,
      topics: [
        'Singleton Pattern',
        'Factory Method Pattern',
        'Abstract Factory Pattern',
        'Builder Pattern',
        'Prototype Pattern',
        'Object Pool Pattern',
        'Dependency Injection',
        'Lazy Initialization'
      ],
      theory: {
        singleton: `
SINGLETON PATTERN:

INTENT:
Ensure a class has only one instance and provide global point of access.

WHEN TO USE:
- Database connections - only one connection pool
- Logging - single logger instance
- Configuration - single config object
- Caching - single cache instance

IMPLEMENTATION:
class Singleton {
  static instance = null;
  
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance; // Return existing
    }
    Singleton.instance = this;
  }
  
  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}

THREAD-SAFE (Java):
class Singleton {
  private static Singleton instance;
  
  private Singleton() {}
  
  public synchronized static Singleton getInstance() {
    if (instance == null) {
      instance = new Singleton();
    }
    return instance;
  }
}

PROPERTIES:
- Single instance guaranteed
- Lazy initialization (created only when needed)
- Global access point
- Thread-safe in some implementations

CAUTIONS:
- Global state (avoid if possible)
- Hard to test (can't create multiple instances)
- Can hide dependencies
- Consider dependency injection instead
        `,
        factory: `
FACTORY METHOD PATTERN:

INTENT:
Create objects without specifying exact classes.
Define interface for object creation, let subclasses decide which class to instantiate.

STRUCTURE:
interface PaymentProcessor {
  process(amount): boolean;
}

class CreditCardProcessor implements PaymentProcessor { }
class PayPalProcessor implements PaymentProcessor { }

abstract class PaymentFactory {
  abstract createProcessor(): PaymentProcessor;
  
  process(amount) {
    const processor = this.createProcessor();
    return processor.process(amount);
  }
}

class CreditCardFactory extends PaymentFactory {
  createProcessor() { return new CreditCardProcessor(); }
}

class PayPalFactory extends PaymentFactory {
  createProcessor() { return new PayPalProcessor(); }
}

USAGE:
const factory = new CreditCardFactory();
factory.process(100); // Creates CreditCardProcessor

BENEFITS:
- Decouples client from concrete processor classes
- Adding new processor: create new Factory subclass
- Single Responsibility: each factory creates one type
- Open/Closed: open for extension (new factories), closed for modification

USE CASES:
- Multiple implementations (payment methods, loggers, databases)
- Decision made at runtime (based on config/user input)
- Localization (different implementations per region)
        `,
        builder: `
BUILDER PATTERN:

INTENT:
Separate object construction from representation.
Allow construction of complex objects step by step.

WHEN TO USE:
- Complex objects with many optional parameters
- Objects with multiple constructors (constructor overloading)
- Immutable objects with optional fields
- Building through step-by-step process

PROBLEM:
class Car {
  constructor(make, model, color, transmission, sunroof,
              leather, gps, aux, doors) {
    // 9 parameters!
    // Hard to remember order
    // Most params optional
  }
}

SOLUTION - BUILDER:
class CarBuilder {
  constructor(make, model) {
    this.make = make;
    this.model = model;
  }
  
  withColor(color) {
    this.color = color;
    return this;
  }
  
  withTransmission(trans) {
    this.transmission = trans;
    return this;
  }
  
  withSunroof() {
    this.sunroof = true;
    return this;
  }
  
  build() {
    return new Car(this);
  }
}

USAGE:
const car = new CarBuilder('Toyota', 'Camry')
  .withColor('Blue')
  .withSunroof()
  .withTransmission('Auto')
  .build();

BENEFITS:
- Clear intent: readability
- Only set needed properties
- Immutability possible
- Flexible: add properties without constructor changes
- Chain method calls (fluent interface)

VS FACTORY:
- Factory: Create already defined objects
- Builder: Step-by-step construction of complex objects
  `,
  creationalDecisionMatrix: `
CREATIONAL PATTERN DECISION MATRIX:

SINGLETON:
- Use when exactly one shared instance is required (config, registry, pool)
- Avoid when hidden global state harms testability

FACTORY METHOD:
- Use when concrete type choice varies by runtime context
- Keeps callers independent from concrete constructors

ABSTRACT FACTORY:
- Use when creating families of related objects together
- Ensures compatibility among produced objects

BUILDER:
- Use for complex object assembly with many optional fields
- Improves readability and validation before object creation

PROTOTYPE:
- Use when object creation is expensive and cloning is cheaper

OBJECT POOL:
- Use for expensive reusable resources with bounded capacity
  `,
  concurrencyAndLifecycle: `
CREATION, LIFECYCLE, AND CONCURRENCY:

1. Singleton safety:
- Ensure thread-safe lazy init in multithreaded runtimes
- Beware double-checked locking correctness

2. Factory and configuration drift:
- Constructor selection should be deterministic and observable
- Validate config at startup, not first request

3. Builder validation:
- Enforce required fields at build() time
- Keep built object immutable where possible

4. Object pools:
- Include timeout, health checks, max lifetime
- Prevent resource leaks with finally/auto-close semantics

5. Telemetry:
- Track creation rates, pool exhaustion, constructor failures
  `,
  interviewTemplate: `
INTERVIEW ANSWER TEMPLATE - CREATIONAL PATTERNS:

1. Describe creation problem:
- Complexity, variability, lifecycle, performance constraints

2. Pick pattern with rationale:
- "Builder for readability and validation",
- "Factory for runtime pluggability", etc.

3. Show extension story:
- How new variants are added without changing existing callers

4. Address operational concerns:
- Thread safety, config validation, resource lifecycle, metrics

5. Mention anti-pattern guardrails:
- Avoid Singleton overuse, avoid factory explosion without need
        `,
  caseStudyWalkthrough: `
CASE STUDY WALKTHROUGH - NOTIFICATION PLATFORM:

Problem:
Create notifications via Email/SMS/Push with tenant-specific templates and retries.

Creational design:
1. Factory Method:
- NotificationChannelFactory returns EmailChannel/SmsChannel/PushChannel

2. Abstract Factory:
- TenantThemeFactory creates template parser + formatter families

3. Builder:
- NotificationRequestBuilder assembles optional metadata, locale, tags, tracing

4. Singleton (careful):
- TemplateRegistry shared cache with startup validation

5. Object Pool:
- Reuse expensive SMTP/HTTP clients with health checks

Flow:
Request -> Builder validates -> Factory creates channel -> send -> retry on transient failure

Trade-off note:
Factory abstraction improves extension but requires strong observability to debug routing.
  `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Creational Design Patterns',
          duration: '90 min',
          description: 'All creational patterns explained with real examples',
          difficulty: 'Intermediate',
          url: 'https://www.youtube.com/watch?v=EcFVTgRHJLM'
        },
        {
          type: 'article',
          title: 'When to Use Which Creational Pattern',
          duration: '45 min',
          description: 'Decision guide for choosing the right pattern',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Builder Pattern Deep Dive',
          duration: '40 min',
          description: 'Master the builder pattern for complex object creation',
          difficulty: 'Intermediate'
        },
        {
          type: 'practice',
          title: 'Implement All Creational Patterns',
          duration: '8 hours',
          description: 'Hands-on implementation of each pattern',
          difficulty: 'Intermediate'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Database Connection Pool',
          difficulty: 'Medium',
          description: 'Implement Singleton pattern for connection management',
          mustSolve: true 
        },
        { 
          title: 'Build a Document Creator',
          difficulty: 'Medium',
          description: 'Use Factory pattern to create different document types',
          mustSolve: true 
        },
        { 
          title: 'Implement Complex Object Builder',
          difficulty: 'Medium',
          description: 'Use Builder pattern for objects with many parameters',
          mustSolve: true 
        },
        { 
          title: 'Design UI Component Factory',
          difficulty: 'Medium',
          description: 'Use Abstract Factory for cross-platform UI components',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Implement each pattern from scratch. Understand when to use each pattern. Practice identifying use cases.',
      commonMistakes: [
        'Overusing Singleton (global state anti-pattern)',
        'Not making Singleton thread-safe',
        'Confusing Factory Method with Abstract Factory',
        'Making Builder mutable'
      ],
      tips: [
        'Singleton: Use for truly global resources only',
        'Factory Method: When subclasses decide which class to instantiate',
        'Abstract Factory: When you need families of related objects',
        'Builder: For complex objects with many optional parameters',
        'Prototype: When object creation is expensive'
      ]
    },
    {
      id: 4,
      slug: 'structural-patterns',
      title: 'Structural Design Patterns',
      description: 'Learn to compose objects and classes into larger structures',
      difficulty: 'Intermediate',
      estimatedTime: '1-2 weeks',
      problemCount: 7,
      topics: [
        'Adapter Pattern',
        'Bridge Pattern',
        'Composite Pattern',
        'Decorator Pattern',
        'Facade Pattern',
        'Flyweight Pattern',
        'Proxy Pattern',
        'Module Pattern'
      ],
      theory: {
        intentMap: `
  STRUCTURAL PATTERNS - CORE INTENT:

  Structural patterns focus on composing classes and objects to build flexible structures
  without changing existing business logic.

  THREE MAIN PROBLEMS THEY SOLVE:
  1. Interface mismatch: systems cannot talk directly (Adapter)
  2. Behavioral layering: add capabilities without subclass explosion (Decorator)
  3. Complexity hiding: many subsystem calls overwhelm clients (Facade)

  CLASS VS OBJECT COMPOSITION:
  - Class composition (inheritance) is static at compile time
  - Object composition (delegation) is dynamic at runtime
  - Structural patterns prefer object composition for flexibility

  DESIGN GOAL:
  Keep high-level modules stable while low-level components can vary independently.
        `,
        patternComparisons: `
  PATTERN COMPARISONS AND TRADE-OFFS:

  ADAPTER vs FACADE vs PROXY:
  - Adapter: Changes interface to expected shape
  - Facade: Simplifies interface to a complex subsystem
  - Proxy: Controls access to an object with same interface

  DECORATOR vs INHERITANCE:
  - Inheritance grows class hierarchy quickly (N feature combinations)
  - Decorator composes features at runtime
  - Good when capabilities must be optional and combinable

  BRIDGE PATTERN:
  Separates abstraction from implementation so both can change independently.

  Example:
  Abstraction: Notification (Alert, Reminder)
  Implementation: Channel (Email, SMS, Push)

  Without Bridge:
  AlertEmail, AlertSMS, ReminderEmail, ReminderSMS...
  With Bridge:
  Notification has-a Channel, no Cartesian class explosion.

  FLYWEIGHT:
  Splits intrinsic state (shared) from extrinsic state (context-specific).
  Use when millions of similar objects cause memory pressure.
        `,
        implementationHeuristics: `
  IMPLEMENTATION HEURISTICS:

  1. Start with dependency direction:
    - Domain code should not depend on infrastructure details
    - Structural patterns often enforce this boundary

  2. Preserve invariants:
    - Decorators must preserve base contract
    - Proxies must not change semantic behavior unexpectedly

  3. Measure complexity cost:
    - Every wrapper/layer adds indirection
    - Use patterns where change frequency justifies abstraction

  4. Test strategy:
    - Contract tests for interface compatibility
    - Integration tests around facades/adapters
    - Performance tests for proxy/flyweight overhead

  5. Interview-grade articulation:
    - State problem signal first
    - Explain why simpler approach fails
    - Then justify chosen structural pattern
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - LEGACY BILLING INTEGRATION:

  Scenario:
  New checkout service must integrate with three legacy billing providers with incompatible APIs.

  Design:
  1. Adapter:
  - One adapter per provider normalizes request/response contract

  2. Facade:
  - BillingFacade exposes createInvoice(), capturePayment(), refund()

  3. Decorator:
  - Add logging, tracing, and retry behavior without changing core adapters

  4. Proxy:
  - Add caching proxy for idempotent invoice lookups

  Flow:
  Checkout -> BillingFacade -> ProviderAdapter -> Provider API
  Failures handled by retry decorator and circuit-breaker proxy policy.

  Result:
  Business logic remains provider-agnostic; onboarding new provider becomes adapter-only work.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Structural Design Patterns Explained',
          duration: '100 min',
          description: 'Complete guide to all structural patterns',
          difficulty: 'Intermediate',
          url: 'https://www.youtube.com/watch?v=v9ejT8FO-7I'
        },
        {
          type: 'article',
          title: 'Decorator vs Proxy vs Adapter',
          duration: '40 min',
          description: 'Understanding the differences between similar patterns',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Composite Pattern in Real Systems',
          duration: '45 min',
          description: 'How to use Composite for tree structures',
          difficulty: 'Intermediate'
        },
        {
          type: 'practice',
          title: 'Structural Patterns Workshop',
          duration: '10 hours',
          description: 'Build real systems using structural patterns',
          difficulty: 'Intermediate'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Legacy System Adapter',
          difficulty: 'Medium',
          description: 'Make incompatible interfaces work together',
          mustSolve: true 
        },
        { 
          title: 'Build File System with Composite',
          difficulty: 'Medium',
          description: 'Implement hierarchical file/folder structure',
          mustSolve: true 
        },
        { 
          title: 'Implement Logging Decorator',
          difficulty: 'Medium',
          description: 'Add logging to objects without modifying them',
          mustSolve: true 
        },
        { 
          title: 'Create API Facade',
          difficulty: 'Medium',
          description: 'Simplify complex subsystem with simple interface',
          mustSolve: true 
        },
        { 
          title: 'Design Caching Proxy',
          difficulty: 'Hard',
          description: 'Implement lazy loading and caching with Proxy',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Understand the problem each pattern solves. Draw UML diagrams. Implement real-world examples.',
      commonMistakes: [
        'Confusing Decorator with inheritance',
        'Using Adapter when you should redesign interfaces',
        'Overcomplicating with Bridge pattern',
        'Not understanding Flyweight\'s memory optimization'
      ],
      tips: [
        'Adapter: Convert interface of class to another interface',
        'Decorator: Add responsibilities to objects dynamically',
        'Composite: Treat individual objects and compositions uniformly',
        'Facade: Provide unified interface to subsystem',
        'Proxy: Control access to objects'
      ]
    },
    {
      id: 5,
      slug: 'behavioral-patterns',
      title: 'Behavioral Design Patterns',
      description: 'Master patterns for object interaction and responsibility distribution',
      difficulty: 'Advanced',
      estimatedTime: '2 weeks',
      problemCount: 11,
      topics: [
        'Observer Pattern',
        'Strategy Pattern',
        'Command Pattern',
        'State Pattern',
        'Template Method Pattern',
        'Iterator Pattern',
        'Mediator Pattern',
        'Memento Pattern',
        'Chain of Responsibility',
        'Visitor Pattern',
        'Interpreter Pattern'
      ],
      theory: {
        interactionModels: `
  BEHAVIORAL PATTERNS - INTERACTION DESIGN:

  Behavioral patterns model how responsibilities and messages flow between objects.
  They reduce coupling in decision logic and communication pathways.

  CORE QUESTIONS:
  1. Who decides behavior at runtime? (Strategy/State)
  2. How are requests represented and deferred? (Command)
  3. How do many objects stay synchronized? (Observer/Mediator)

  MESSAGE FLOW PRINCIPLES:
  - Push model: source sends full data to listeners
  - Pull model: listeners fetch what they need
  - Push is simpler, pull is more resilient to schema changes

  COUPLING AXIS:
  - Observer reduces direct dependencies but may hide execution order
  - Mediator centralizes interactions but can become a god object
        `,
        patternDecisionGuide: `
  STATE vs STRATEGY vs COMMAND:

  STATE:
  - Behavior changes based on internal lifecycle stage
  - Transitions are part of domain model
  - Example: Order: Created -> Paid -> Shipped -> Delivered

  STRATEGY:
  - Behavior selected by policy, not lifecycle
  - Algorithms interchangeable without changing object identity
  - Example: pricing policy, routing algorithm

  COMMAND:
  - Encapsulates request as object
  - Enables queueing, retries, undo/redo, audit
  - Example: TextEditorCommand, PaymentCommand

  CHAIN OF RESPONSIBILITY:
  - Multiple handlers can process a request in sequence
  - Use for middleware pipelines (auth -> validation -> business rules)
  - Stop on first success/failure based on policy

  TEMPLATE METHOD:
  - Fix overall algorithm skeleton in base class
  - Override steps in subclasses
  - Great for framework-style extensibility with guardrails
        `,
        consistencyAndFailure: `
  CONSISTENCY, FAILURES, AND OBSERVABILITY:

  1. Idempotency in handlers:
    - Observer callbacks and command handlers may run more than once
    - Design side effects to tolerate retries

  2. Ordering guarantees:
    - If event order matters, enforce sequence numbers/version checks
    - Otherwise stale events can overwrite newer state

  3. Error isolation:
    - One observer failure should not crash all subscribers
    - Wrap listeners and route failures to dead-letter/retry channel

  4. Backpressure:
    - Unbounded command queues create memory risk
    - Use bounded queues and rejection/backoff policies

  5. Test strategy:
    - State transition tests for illegal transitions
    - Contract tests for strategy interfaces
    - Replay tests for command history and undo correctness
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - ORDER FULFILLMENT WORKFLOW:

  Problem:
  Model order workflow with retries, notifications, and audit trail.

  Pattern composition:
  1. State:
  - Order states: Created, Paid, Packed, Shipped, Delivered, Cancelled

  2. Strategy:
  - Shipping cost policy selected by region/service level

  3. Command:
  - PackOrderCommand, ShipOrderCommand queued with retry metadata

  4. Observer:
  - Subscribers: NotificationService, AnalyticsService, RiskService

  5. Chain of Responsibility:
  - Validation chain: fraud -> stock -> address -> payment verification

  Failure handling:
  - Commands idempotent with operationId
  - Observer failures isolated via dead-letter queue

  Interview angle:
  Explain sequence guarantees and why eventual consistency is acceptable for notifications.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Behavioral Design Patterns',
          duration: '120 min',
          description: 'All 11 behavioral patterns with examples',
          difficulty: 'Advanced',
          url: 'https://www.youtube.com/watch?v=v9ejT8FO-7I'
        },
        {
          type: 'article',
          title: 'Observer vs Mediator vs Event Bus',
          duration: '50 min',
          description: 'Choosing the right communication pattern',
          difficulty: 'Advanced'
        },
        {
          type: 'video',
          title: 'State Pattern vs Strategy Pattern',
          duration: '35 min',
          description: 'Understanding the subtle differences',
          difficulty: 'Advanced'
        },
        {
          type: 'practice',
          title: 'Behavioral Patterns Implementation',
          duration: '15 hours',
          description: 'Build systems using each behavioral pattern',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Event System (Observer)',
          difficulty: 'Medium',
          description: 'Implement pub-sub system for event handling',
          mustSolve: true 
        },
        { 
          title: 'Build Text Editor (Command + Memento)',
          difficulty: 'Hard',
          description: 'Implement undo/redo functionality',
          mustSolve: true 
        },
        { 
          title: 'Design Vending Machine (State)',
          difficulty: 'Hard',
          description: 'Implement state transitions properly',
          mustSolve: true 
        },
        { 
          title: 'Create Payment System (Strategy)',
          difficulty: 'Medium',
          description: 'Support multiple payment methods dynamically',
          mustSolve: true 
        },
        { 
          title: 'Implement Request Chain (Chain of Responsibility)',
          difficulty: 'Medium',
          description: 'Build middleware/filter chain',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'These patterns are complex. Focus on understanding the intent. Build real systems, not toy examples.',
      commonMistakes: [
        'Confusing Strategy with State pattern',
        'Not properly decoupling Observer from Observable',
        'Making Command classes too complex',
        'Using Chain of Responsibility when simple if-else would work'
      ],
      tips: [
        'Observer: For one-to-many dependency notifications',
        'Strategy: Encapsulate algorithms and make them interchangeable',
        'Command: Encapsulate requests as objects',
        'State: Allow object to alter behavior when state changes',
        'Chain of Responsibility: Pass request along chain of handlers'
      ]
    },
    {
      id: 6,
      slug: 'design-parking-lot',
      title: 'Design Parking Lot System',
      description: 'Complete LLD of parking lot with multiple vehicle types',
      difficulty: 'Medium',
      estimatedTime: '3-4 days',
      problemCount: 1,
      topics: [
        'Requirements Gathering',
        'Class Diagram Design',
        'Use Case Analysis',
        'API Design',
        'Concurrency Handling',
        'Payment Integration',
        'Spot Allocation Strategies',
        'Rate Calculation'
      ],
      theory: {
        domainModel: `
  PARKING LOT - DOMAIN MODELING DEPTH:

  KEY ENTITIES:
  - ParkingLot -> Floors -> Spots
  - Spot types: Bike, Compact, Large, Electric, Accessible
  - Vehicle types: Bike, Car, SUV, Truck, EV
  - Ticket: entry timestamp, spot, vehicle, rate policy snapshot
  - Payment: amount, method, transaction status

  IMPORTANT INVARIANTS:
  1. A spot can hold at most one active vehicle
  2. A ticket belongs to exactly one active parking session
  3. Exit processing must be atomic with spot release
  4. Price must be computed from ticketed policy snapshot, not mutable global config

  AGGREGATE BOUNDARIES:
  - Spot availability is highly concurrent: isolate with lock/version field
  - Ticket and payment lifecycle can be separate aggregate with saga orchestration
        `,
        allocationAndConcurrency: `
  SPOT ALLOCATION STRATEGIES AND CONCURRENCY:

  ALLOCATION STRATEGIES:
  - Nearest Entry First: best UX, may cause hotspot floors
  - Even Distribution: balances occupancy
  - Type-first with fallback: strict type then upgrade/downgrade rules

  CONCURRENCY RISKS:
  - Double booking the same spot
  - Ticket issued but spot not reserved (partial failure)
  - Exit completed but payment timeout

  SAFE APPROACH:
  1. Query candidate spots
  2. Attempt compare-and-set update on one spot (available -> reserved)
  3. Create ticket in same transactional boundary (or compensate on failure)
  4. Confirm reservation or rollback

  DATA MODEL TIP:
  - Keep active_spot_assignment table with unique index on spot_id where active=true
  - DB constraint becomes final safety net even if app race occurs
        `,
        extensibility: `
  EXTENSIBILITY AND OPERATIONS:

  1. Pricing policy as Strategy:
    - Hourly, slab-based, dynamic demand, membership discounts

  2. Entry/Exit integration:
    - Gate sensors, ANPR camera, QR ticketing, offline fallback

  3. Operational dashboards:
    - Occupancy by floor/type
    - Throughput per gate
    - Failed payment retries

  4. Edge-case handling:
    - Lost ticket policy
    - Grace period windows
    - EV charging occupancy and overstay fees

  5. Interview articulation:
    - State assumptions on capacity and concurrency
    - Explain consistency model around spot locking
    - Show extensible policy interfaces
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - WEEKEND STADIUM EVENT:

  Context:
  Parking demand spikes 5x during event start and end windows.

  Requirements:
  - Sub-second spot assignment
  - Prevent double allocation
  - Dynamic pricing by occupancy tier

  Design choices:
  1. Candidate spot index by floor/type for fast lookup
  2. Optimistic lock on spot row for allocation (versioned update)
  3. Ticket creation and spot reservation in transactional boundary
  4. PricingStrategy selected by occupancy buckets

  Critical flow:
  Entry request -> select candidate -> CAS reserve -> issue ticket -> open gate

  Edge handling:
  - Payment timeout at exit triggers pending-release workflow
  - Lost ticket uses fallback rate + manual audit flag

  Outcome:
  Stable allocation under contention, predictable release behavior, auditable revenue policy.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Parking Lot System Design',
          duration: '60 min',
          description: 'Step-by-step LLD of parking lot system',
          difficulty: 'Medium',
          url: 'https://www.youtube.com/watch?v=DSGsa0pu8-k'
        },
        {
          type: 'article',
          title: 'Parking Lot Design - Complete Guide',
          duration: '45 min',
          description: 'Requirements, classes, and implementation',
          difficulty: 'Medium'
        },
        {
          type: 'video',
          title: 'Advanced Parking Lot Features',
          duration: '40 min',
          description: 'Reservations, handicap spots, electric charging',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Multi-Level Parking Lot',
          difficulty: 'Medium',
          description: 'Support cars, bikes, trucks with different pricing',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Start with requirements. Draw class diagram. Identify relationships. Implement core functionality first.',
      commonMistakes: [
        'Not handling concurrent parking requests',
        'Tight coupling between vehicle types and spots',
        'Not designing for extensibility (new vehicle types)',
        'Poor separation of concerns'
      ],
      tips: [
        'Use Strategy pattern for rate calculation',
        'Use Factory pattern for vehicle creation',
        'Consider thread safety for spot allocation',
        'Design clear interfaces for payment methods',
        'Think about real-world constraints (handicap spots, EV charging)'
      ]
    },
    {
      id: 7,
      slug: 'design-elevator-system',
      title: 'Design Elevator System',
      description: 'Design a multi-elevator control system',
      difficulty: 'Hard',
      estimatedTime: '3-4 days',
      problemCount: 1,
      topics: [
        'State Machine Design',
        'Scheduling Algorithms',
        'Request Dispatching',
        'Door Control',
        'Emergency Handling',
        'Load Balancing',
        'Optimization Strategies',
        'Real-time Systems'
      ],
      theory: {
        stateMachine: `
  ELEVATOR SYSTEM - STATE MODEL:

  PER ELEVATOR STATES:
  - Idle
  - MovingUp
  - MovingDown
  - DoorOpening
  - DoorOpen
  - DoorClosing
  - OutOfService
  - EmergencyStop

  TRANSITION RULES:
  1. Movement requires door closed and safety interlocks true
  2. Direction change should occur only at floor boundary after queue reconciliation
  3. Emergency signals preempt normal schedule and move to safe behavior

  REQUEST TYPES:
  - Hall calls: external Up/Down requests
  - Car calls: internal floor selections

  Separate queues for up/down improve scheduling clarity and reduce oscillation.
        `,
        dispatchAlgorithms: `
  DISPATCH ALGORITHMS:

  1. FCFS:
  - Easy implementation
  - Poor throughput at high load

  2. SCAN/LOOK (elevator algorithm):
  - Continue in current direction while pending requests exist
  - Reverse only when needed
  - Better average wait than FCFS

  3. Nearest Car Heuristic:
  - Score each elevator by distance, direction alignment, load
  - Assign request to lowest cost elevator

  SCORING EXAMPLE:
  score = w1*distance + w2*directionPenalty + w3*loadFactor + w4*stopCount

  REAL-WORLD CONSIDERATIONS:
  - Morning up-peak and evening down-peak traffic profiles
  - VIP/service elevator priorities
  - Accessibility constraints
        `,
        reliability: `
  SAFETY, RELIABILITY, AND REAL-TIME BEHAVIOR:

  1. Hard safety constraints:
    - Door sensor blocks close if obstruction detected
    - Movement disabled when overweight sensor active

  2. Fault handling:
    - Sensor heartbeat timeouts
    - Graceful degrade to manual control
    - Out-of-service isolation per car

  3. Observability:
    - Track wait time percentile (P50/P95)
    - Ride time distribution
    - Door fault and stop error rates

  4. Testing:
    - Deterministic simulation for scheduling
    - Chaos tests for sensor failures
    - Property tests for illegal state transitions
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - CORPORATE TOWER MORNING PEAK:

  Goal:
  Minimize wait time between 8:30-10:00 with 10 elevators across 40 floors.

  Model:
  1. Real-time hall-call queue per direction
  2. Elevator score function includes distance, direction, load, pending stops
  3. Dynamic mode switch to Up-Peak policy during rush interval

  Operational safeguards:
  - Overload sensor blocks movement
  - Door obstruction retries with fault escalation
  - Out-of-service isolation per car

  Simulation KPIs:
  - P95 wait time
  - Average ride time
  - Stop efficiency (passengers/stop)

  Interview explanation:
  State why pure FCFS fails under peak and how scoring strategy improves throughput.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Elevator System Design',
          duration: '70 min',
          description: 'Complete LLD with scheduling algorithms',
          difficulty: 'Hard',
          url: 'https://www.youtube.com/watch?v=siqiJAJWUVg'
        },
        {
          type: 'article',
          title: 'Elevator Scheduling Algorithms',
          duration: '50 min',
          description: 'SCAN, LOOK, FCFS algorithms explained',
          difficulty: 'Hard'
        },
        {
          type: 'video',
          title: 'State Pattern in Elevator System',
          duration: '30 min',
          description: 'Managing elevator states properly',
          difficulty: 'Medium'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Smart Elevator System',
          difficulty: 'Hard',
          description: 'Optimize wait time with multiple elevators',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Focus on state management. Design clean dispatcher. Implement at least one scheduling algorithm.',
      commonMistakes: [
        'Not properly managing elevator states',
        'Poor request dispatching logic',
        'Not handling edge cases (overload, emergency)',
        'Tight coupling between controller and elevators'
      ],
      tips: [
        'Use State pattern for elevator states',
        'Use Strategy pattern for scheduling algorithms',
        'Consider Observer pattern for button press notifications',
        'Design for real-world scenarios (maintenance mode, emergency)',
        'Think about minimizing wait time and energy consumption'
      ]
    },
    {
      id: 8,
      slug: 'design-library-management',
      title: 'Design Library Management System',
      description: 'Complete library system with book catalog, members, and lending',
      difficulty: 'Medium',
      estimatedTime: '2-3 days',
      problemCount: 1,
      topics: [
        'Catalog Management',
        'Member Management',
        'Book Lending & Returns',
        'Fine Calculation',
        'Search & Filtering',
        'Reservation System',
        'Notification System',
        'Report Generation'
      ],
      theory: {
        domainBoundaries: `
  LIBRARY SYSTEM - DOMAIN BOUNDARIES:

  SEPARATE ENTITIES CLEARLY:
  - Book (ISBN metadata) vs BookCopy (physical instance with barcode)
  - Member account vs borrowing transactions
  - Reservation queue per title/copy policy

  INVARIANTS:
  1. A BookCopy can have only one active loan
  2. A member cannot exceed borrowing limit
  3. Return date and fine policy snapshot should be immutable per loan
  4. Reservation queue order must be deterministic and auditable

  MODEL TIP:
  Treat BookCopy as aggregate root for availability lifecycle.
        `,
        workflows: `
  BORROW/RETURN WORKFLOW DEPTH:

  BORROW FLOW:
  1. Validate member status and borrowing quota
  2. Check copy availability and reservation priority
  3. Create Loan transaction with due date policy snapshot
  4. Mark copy as OnLoan

  RETURN FLOW:
  1. Close loan with actual return timestamp
  2. Compute fine from due date and grace rules
  3. Mark copy Available or ReservedForPickup
  4. Notify next reservation candidate

  RESERVATION POLICIES:
  - FIFO queue by timestamp
  - Hold window (e.g., 48 hours) before next candidate
  - Max active reservations per member
        `,
        scalabilityAndSearch: `
  SCALABILITY, SEARCH, AND REPORTING:

  1. Catalog search:
    - Full-text index on title/author/keywords
    - Faceted filters: language, genre, publication year

  2. Reporting:
    - Most borrowed titles
    - Overdue distribution by member tier
    - Inventory aging and damaged copies

  3. Consistency:
    - Borrow and copy-status update in one transaction
    - Notification can be eventual consistency via outbox/event queue

  4. Security:
    - Staff-only operations for inventory mutations
    - Audit trail for fines waivers and manual overrides
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - UNIVERSITY EXAM WEEK SURGE:

  Situation:
  High-demand textbooks with long waitlists and strict return deadlines.

  Design:
  1. Book vs BookCopy separation to manage physical inventory accurately
  2. Reservation queue with deterministic FIFO and hold expiration
  3. FinePolicy snapshot at borrow time to avoid retroactive disputes
  4. Outbox event for notification dispatch on copy availability

  Borrow flow:
  Validate member quota -> allocate copy -> create loan -> update copy state

  Return flow:
  Close loan -> compute fine -> move copy to available/reserved hold -> notify next member

  Outcome:
  Fair reservation order, auditable fines, and resilient notifications under load.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Library Management System Design',
          duration: '55 min',
          description: 'End-to-end LLD with all features',
          difficulty: 'Medium'
        },
        {
          type: 'article',
          title: 'Library System Requirements & Design',
          duration: '40 min',
          description: 'Complete requirements and class design',
          difficulty: 'Medium'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Complete Library System',
          difficulty: 'Medium',
          description: 'Handle books, members, lending, fines, reservations',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Start with core entities. Add features incrementally. Focus on business logic.',
      commonMistakes: [
        'Not handling book copies vs book items',
        'Poor fine calculation logic',
        'Not supporting different member types',
        'Missing reservation and waitlist functionality'
      ],
      tips: [
        'Separate Book (metadata) from BookItem (physical copy)',
        'Use Strategy pattern for fine calculation',
        'Use Observer pattern for reservation notifications',
        'Consider Factory pattern for creating different member types',
        'Design extensible search/filter system'
      ]
    },
    {
      id: 9,
      slug: 'design-hotel-management',
      title: 'Design Hotel Management System',
      description: 'Hotel booking system with rooms, reservations, and services',
      difficulty: 'Medium',
      estimatedTime: '2-3 days',
      problemCount: 1,
      topics: [
        'Room Management',
        'Booking & Reservations',
        'Guest Management',
        'Service Management',
        'Billing & Invoicing',
        'Room Service',
        'Housekeeping',
        'Dynamic Pricing'
      ],
      theory: {
        reservationModel: `
  HOTEL SYSTEM - RESERVATION MODEL:

  KEY AGGREGATES:
  - RoomType (Deluxe, Suite) with capacity/features
  - Room inventory (physical units)
  - Reservation with lifecycle states
  - Folio (guest bill ledger)

  BOOKING STATE LIFECYCLE:
  Requested -> Confirmed -> CheckedIn -> CheckedOut -> Closed
                -> Cancelled / NoShow

  INVARIANTS:
  1. Room cannot be double-booked for overlapping intervals
  2. Check-in requires valid reservation or walk-in allocation
  3. Charges posted to folio must be immutable ledger entries
  4. Refunds/voids are compensating entries, not destructive edits
        `,
        pricingPolicies: `
  PRICING, CANCELLATION, AND POLICY ENGINE:

  PRICING FACTORS:
  - Base rate by room type
  - Seasonality and demand multiplier
  - Day-of-week adjustments
  - Occupancy-based surge
  - Membership/corporate discounts

  POLICY SNAPSHOTS:
  Capture policy terms at reservation time:
  - Cancellation window
  - No-show fee rules
  - Tax/service rules

  Why snapshot?
  Future policy updates should not retroactively alter existing bookings.

  CANCELLATION LOGIC:
  - Free cancellation until threshold
  - Partial/total fee after threshold
  - Refund path depends on original payment instrument
        `,
        operations: `
  OPERATIONS AND CONCURRENCY:

  1. Availability search:
    - Precompute inventory calendar by date and room type
    - On booking confirmation, atomically decrement availability

  2. Housekeeping integration:
    - Room status: VacantClean, VacantDirty, Occupied, OutOfOrder
    - Check-in allowed only for clean and available rooms

  3. Overbooking strategy:
    - Configurable limits by room type
    - Recovery workflow (upgrade, relocation compensation)

  4. Monitoring:
    - Occupancy rate, ADR, RevPAR
    - Cancellation and no-show rates
    - Check-in queue time
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - HOLIDAY SEASON OPERATIONS:

  Scenario:
  Hotel occupancy reaches 95% with frequent cancellations and walk-ins.

  Design priorities:
  1. Date-range availability index by room type
  2. Atomic inventory decrement at confirmation
  3. Cancellation policy snapshot attached to reservation
  4. Folio as append-only ledger for charge integrity

  Edge cases:
  - Overbooking threshold triggers controlled upgrade/relocation flow
  - No-show fee posted automatically after grace window
  - Housekeeping status gates check-in eligibility

  KPI impact:
  - Lower booking conflicts
  - Faster front-desk decisioning
  - Fewer billing disputes due to immutable ledger entries
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Hotel Management System LLD',
          duration: '65 min',
          description: 'Complete system with all features',
          difficulty: 'Medium'
        },
        {
          type: 'article',
          title: 'Hotel Booking System Design',
          duration: '45 min',
          description: 'Requirements and implementation guide',
          difficulty: 'Medium'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Hotel Booking System',
          difficulty: 'Medium',
          description: 'Handle rooms, bookings, services, billing',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Focus on booking logic and conflict resolution. Design flexible pricing strategy.',
      commonMistakes: [
        'Not handling booking conflicts properly',
        'Poor room availability checking',
        'Not supporting different room types',
        'Missing cancellation and refund logic'
      ],
      tips: [
        'Use Strategy pattern for pricing strategies',
        'Use State pattern for booking states',
        'Consider Factory pattern for room types',
        'Design proper concurrency control for bookings',
        'Think about overbooking scenarios'
      ]
    },
    {
      id: 10,
      slug: 'design-atm-system',
      title: 'Design ATM System',
      description: 'ATM machine with cash dispensing, balance inquiry, and transactions',
      difficulty: 'Medium',
      estimatedTime: '2-3 days',
      problemCount: 1,
      topics: [
        'Authentication & Security',
        'Cash Dispensing',
        'Transaction Management',
        'Balance Inquiry',
        'Receipt Printing',
        'PIN Management',
        'Cash Management',
        'Transaction Limits'
      ],
            theory: {
        securityModel: `
      ATM SYSTEM - SECURITY MODEL:

      AUTHENTICATION FLOW:
      1. Card read (chip/magstripe/NFC)
      2. PIN capture on secure keypad
      3. PIN verification via HSM-backed backend
      4. Session token issued with short TTL

      SECURITY REQUIREMENTS:
      - PIN never stored or logged in plaintext
      - Attempt counter with card lock after threshold
      - Session timeout and auto card eject on inactivity
      - Tamper events trigger ATM lock-down mode

      AUDITABILITY:
      Every critical action should produce immutable audit events:
      card insert, PIN attempts, transaction request, dispense success/failure.
        `,
        transactionFlow: `
      TRANSACTION LIFECYCLE:

      WITHDRAWAL SAGA:
      1. Validate account, limits, and balance
      2. Place hold/authorization on account
      3. Dispense cash
      4. Confirm dispense and capture transaction
      5. Release hold or convert to settled debit

      FAILURE SCENARIOS:
      - Dispense failed after authorization -> reverse hold
      - Cash jam after partial dispense -> partial settlement + dispute event
      - Network timeout after dispense -> reconciliation required

      DESIGN PRINCIPLE:
      Separate "financial ledger success" from "hardware dispense success" and reconcile safely.
        `,
        cashManagement: `
      CASH DISPENSING AND OPERATIONAL CONTROLS:

      DENOMINATION ENGINE:
      - Goal can be min notes, balanced cassette usage, or wear-leveling
      - Chain of Responsibility works well for denomination selection

      CONSTRAINTS:
      - Cassette inventory by denomination
      - Per-transaction and daily withdrawal limits
      - ATM-level cash threshold for maintenance alerts

      OBSERVABILITY:
      - Cash-out prediction window
      - Dispense failure ratio by cassette
      - Reconciliation mismatch count

      RESILIENCE:
      - Local queue for receipts/logs during network outage
      - Graceful degradation: deny cash operations if reconciliation risk too high
        `,
        caseStudyWalkthrough: `
      CASE STUDY WALKTHROUGH - INTERMITTENT NETWORK OUTAGE:

      Problem:
      ATM must handle withdrawal requests while upstream banking service is flaky.

      Design:
      1. Authenticate and authorize only with reachable backend
      2. Use transaction saga with hold -> dispense -> settle/reverse
      3. Persist local audit journal for reconciliation after outage
      4. Denomination engine chooses notes with cassette health constraints

      Failure branches:
      - Dispense failed after hold -> automatic reversal request
      - Timeout after dispense -> mark pending reconciliation and alert ops

      Security controls:
      - Session timeout and PIN attempt lock
      - Tamper event forces safe lock-down state

      Outcome:
      No silent financial divergence; every ambiguous transaction is recoverable by reconciliation.
        `
            },
      studyMaterials: [
        {
          type: 'video',
          title: 'ATM System Design',
          duration: '50 min',
          description: 'Complete ATM system with state management',
          difficulty: 'Medium'
        },
        {
          type: 'article',
          title: 'ATM Design Patterns',
          duration: '35 min',
          description: 'State pattern and Chain of Responsibility in ATM',
          difficulty: 'Medium'
        }
      ],
      keyProblems: [
        { 
          title: 'Design ATM Machine',
          difficulty: 'Medium',
          description: 'Handle authentication, transactions, cash dispensing',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Use State pattern extensively. Focus on security and cash management.',
      commonMistakes: [
        'Not properly managing ATM states',
        'Poor cash denomination dispensing logic',
        'Not handling insufficient funds',
        'Missing transaction rollback on failure'
      ],
      tips: [
        'Use State pattern for ATM states',
        'Use Chain of Responsibility for cash dispensing',
        'Use Strategy pattern for different transaction types',
        'Consider security aspects (PIN encryption, session timeout)',
        'Handle edge cases (out of cash, network failure)'
      ]
    },
    {
      id: 11,
      slug: 'design-online-shopping',
      title: 'Design Online Shopping System',
      description: 'E-commerce platform with products, cart, orders, and payments',
      difficulty: 'Hard',
      estimatedTime: '4-5 days',
      problemCount: 1,
      topics: [
        'Product Catalog',
        'Shopping Cart',
        'Order Management',
        'Payment Processing',
        'Inventory Management',
        'User Management',
        'Review & Ratings',
        'Recommendation System'
      ],
      theory: {
        boundedContexts: `
  E-COMMERCE LLD - BOUNDED CONTEXTS:

  SEPARATE DOMAINS:
  - Catalog: product metadata, search, faceting
  - Cart: user/session cart state and pricing snapshot
  - Checkout/Order: immutable order record and lifecycle
  - Payment: authorization/capture/refund orchestration
  - Inventory: stock levels, reservations, replenishment

  WHY SEPARATE:
  Each domain has different consistency, scaling, and latency needs.
  Keeping them isolated reduces coupling and enables independent evolution.
        `,
        orderAndInventory: `
  ORDER LIFECYCLE AND INVENTORY CONSISTENCY:

  ORDER STATES:
  Created -> PaymentAuthorized -> Confirmed -> Packed -> Shipped -> Delivered
                    -> Cancelled / RefundPending / Refunded

  INVENTORY MODEL:
  - On checkout: reserve stock (soft hold)
  - On payment success: convert reservation to committed deduction
  - On payment failure/timeout: release reservation

  RACE CONDITION RISK:
  Without reservations, concurrent checkouts oversell stock.

  SAFE PATTERN:
  1. Reserve with versioned decrement
  2. Store reservation expiry
  3. Reaper job releases expired holds
  4. Outbox events keep inventory/order/payment in sync
        `,
        reliabilityAndExperience: `
  RELIABILITY, UX, AND OPERATIONS:

  1. Cart persistence:
    - Guest cart via session token
    - Merge guest and user cart on login

  2. Pricing correctness:
    - Snapshot prices, tax rules, and promotions at checkout
    - Revalidate before payment capture

  3. Idempotency:
    - Payment and order APIs need idempotency keys
    - Prevent duplicate charges on retries

  4. Event-driven notifications:
    - Order confirmed, shipped, delivered events
    - Retry with dead-letter on notification failures

  5. Metrics:
    - Conversion funnel by step
    - Payment failure rates by method
    - Oversell incidents and stockout latency
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - FLASH SALE EVENT:

  Context:
  Traffic spikes 20x, same SKU purchased concurrently by thousands of users.

  Design:
  1. Inventory reservation at checkout (soft hold with TTL)
  2. Idempotent order and payment APIs keyed by requestId
  3. Price/promo snapshot at checkout for consistency
  4. Outbox-driven events for order status notifications

  Critical path:
  Add to cart -> checkout -> reserve stock -> authorize payment -> confirm order -> commit stock

  Race prevention:
  - Versioned inventory updates
  - Expired reservation reaper job

  Business result:
  Reduced oversell, fewer duplicate charges, stable customer experience under burst load.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'E-commerce System Design',
          duration: '90 min',
          description: 'Complete online shopping platform design',
          difficulty: 'Hard',
          url: 'https://www.youtube.com/watch?v=EpASu_1dUdE'
        },
        {
          type: 'article',
          title: 'Shopping Cart Design Patterns',
          duration: '45 min',
          description: 'Best practices for cart and order management',
          difficulty: 'Medium'
        },
        {
          type: 'video',
          title: 'Inventory Management System',
          duration: '40 min',
          description: 'Handling stock, reservations, and concurrency',
          difficulty: 'Hard'
        }
      ],
      keyProblems: [
        { 
          title: 'Design E-commerce Platform',
          difficulty: 'Hard',
          description: 'Complete shopping system with cart, orders, payments',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Start with core shopping flow. Add payment and inventory. Focus on concurrency issues.',
      commonMistakes: [
        'Not handling inventory race conditions',
        'Poor order state management',
        'Not supporting multiple payment methods properly',
        'Missing cart persistence'
      ],
      tips: [
        'Use Strategy pattern for payment methods',
        'Use State pattern for order states',
        'Use Observer pattern for order notifications',
        'Design proper concurrency control for inventory',
        'Consider cart abandonment and session management'
      ]
    },
    {
      id: 12,
      slug: 'design-patterns-real-world',
      title: 'Design Patterns in Real Systems',
      description: 'Apply multiple patterns together in complex systems',
      difficulty: 'Advanced',
      estimatedTime: '1 week',
      problemCount: 3,
      topics: [
        'Pattern Combinations',
        'Anti-patterns',
        'Refactoring',
        'Pattern Selection',
        'Trade-offs',
        'Performance Considerations',
        'Maintainability',
        'Scalability'
      ],
      theory: {
        compositionPlaybook: `
  COMBINING PATTERNS IN PRODUCTION SYSTEMS:

  Patterns are rarely used in isolation. Real systems often combine them around boundaries.

  COMMON COMPOSITIONS:
  1. Strategy + Factory:
    - Factory creates strategy by runtime policy/config

  2. Observer + Command:
    - Events trigger commands that are queued and retried

  3. State + Template Method:
    - State handles transitions, template constrains execution skeleton

  4. Facade + Adapter:
    - Facade provides simple API while adapters normalize downstream systems

  KEY RULE:
  Composition should reduce accidental complexity, not increase abstraction layers unnecessarily.
        `,
        antiPatterns: `
  ANTI-PATTERNS TO AVOID:

  1. Pattern-first design:
    Choosing a pattern before understanding constraints.

  2. God mediator/facade:
    One class centralizes too much logic and becomes bottleneck.

  3. Interface explosion:
    Tiny interfaces without meaningful boundaries increase cognitive load.

  4. Inheritance abuse:
    Deep hierarchies where behavior should be compositional.

  5. Accidental distributed transactions:
    Assuming synchronous calls across modules are always safe.

  HEURISTIC:
  If a pattern requires extensive explanation to team members, simplify first.
        `,
        refactoringRoadmap: `
  REFACTORING ROADMAP FOR LEGACY CODE:

  STEP 1: Stabilize behavior
  - Add characterization tests around critical flows

  STEP 2: Identify hotspots
  - Find classes with high churn, high bug density, many dependencies

  STEP 3: Isolate seams
  - Introduce interfaces/adapters at IO boundaries

  STEP 4: Incremental pattern introduction
  - Replace conditionals with strategy where policy variation is frequent
  - Introduce state for lifecycle-heavy objects
  - Add facade for overly chatty subsystem usage

  STEP 5: Measure outcomes
  - Reduced change surface area
  - Lower cyclomatic complexity
  - Improved deploy confidence and rollback safety

  INTERVIEW TIP:
  Always explain trade-offs: why this pattern, why now, and what cost it introduces.
    `,
    caseStudyWalkthrough: `
  CASE STUDY WALKTHROUGH - MULTI-CHANNEL NOTIFICATION HUB:

  Goal:
  Support email, SMS, and push with user preferences, throttling, and retries.

  Pattern composition:
  1. Factory + Strategy for channel selection and provider routing
  2. Command objects for queued send operations with retry metadata
  3. Observer for domain events (order shipped, payment failed)
  4. Facade for simple API used by product teams

  Anti-pattern checks:
  - Avoid giant mediator by separating channel orchestration from policy engine
  - Keep interfaces meaningful to prevent abstraction noise

  Refactoring path:
  - Start with facade + adapter, then introduce strategy for policy variation
  - Add command queue only after reliability requirements increase

  Outcome:
  Incremental architecture growth, clear extension points, and maintainable operational behavior.
    `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Combining Design Patterns',
          duration: '80 min',
          description: 'How patterns work together in real systems',
          difficulty: 'Advanced'
        },
        {
          type: 'article',
          title: 'Design Pattern Anti-patterns',
          duration: '50 min',
          description: 'Common mistakes when applying patterns',
          difficulty: 'Advanced'
        },
        {
          type: 'video',
          title: 'Refactoring to Patterns',
          duration: '60 min',
          description: 'When and how to introduce patterns',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { 
          title: 'Design Trading Platform',
          difficulty: 'Hard',
          description: 'Use multiple patterns for order matching, execution, and notification',
          mustSolve: true 
        },
        { 
          title: 'Design Social Media Feed',
          difficulty: 'Hard',
          description: 'Combine patterns for posts, comments, notifications, and recommendations',
          mustSolve: true 
        },
        { 
          title: 'Design Notification Service',
          difficulty: 'Hard',
          description: 'Support multiple channels with filtering and preferences',
          mustSolve: true 
        }
      ],
      practiceStrategy: 'Don\'t force patterns. Let them emerge from requirements. Focus on solving real problems.',
      commonMistakes: [
        'Overengineering with too many patterns',
        'Forcing patterns where they don\'t fit',
        'Not considering performance implications',
        'Sacrificing simplicity for pattern purity'
      ],
      tips: [
        'Start simple, add patterns when needed',
        'Understand the problem before applying patterns',
        'Consider maintenance and team knowledge',
        'Patterns should make code clearer, not more complex',
        'Know when NOT to use a pattern'
      ]
    }
  ],

    theoryCompanion: {
    architectureFundamentals: `
  ARCHITECTURE FUNDAMENTALS FOR LLD:

  1. BOUNDED CONTEXT THINKING:
  - Split system by business capability, not by database table.
  - Each context should own its language, rules, and data boundaries.

  2. LAYERS AND DEPENDENCY RULE:
  - Domain layer: business rules and invariants.
  - Application layer: use-case orchestration.
  - Infrastructure layer: DB, cache, queue, external APIs.
  - Dependencies should point inward toward domain abstractions.

  3. AGGREGATE DESIGN:
  - Keep transactional consistency inside aggregate boundary.
  - Cross-aggregate operations should use events/sagas or explicit compensation.

  4. EVOLUTION PRINCIPLE:
  - Favor designs where new behavior is added by extension points.
  - Avoid central monolithic switch/case that grows with every feature.

  5. STABILITY VS VOLATILITY:
  - Stable core: domain entities, invariants, language of business.
  - Volatile edge: adapters, integrations, policies, UI contracts.
    `,
    nfrDeepDive: `
  NON-FUNCTIONAL REQUIREMENTS (NFR) DEEP DIVE:

  PERFORMANCE:
  - Latency budgets per use case (P50/P95/P99).
  - Throughput targets and queue depth control.
  - Identify hot paths and avoid unnecessary round-trips.

  SCALABILITY:
  - Vertical: increase node capacity.
  - Horizontal: stateless services + partitioned state.
  - Predict scaling bottlenecks: locks, shared DB rows, global counters.

  RELIABILITY:
  - Timeouts, retries with exponential backoff, circuit breakers.
  - Graceful degradation and fallback UX.
  - Idempotency for externally visible commands.

  AVAILABILITY:
  - Remove single points of failure.
  - Health checks + automated failover.
  - Plan for partial outage, not just total outage.

  SECURITY:
  - Principle of least privilege.
  - Encryption in transit and at rest.
  - Secret rotation and auditability.

  OBSERVABILITY:
  - Logs for event narratives.
  - Metrics for trends and SLOs.
  - Traces for causality across components.
    `,
    dataAndConsistency: `
  DATA MODELING AND CONSISTENCY:

  1. CONSISTENCY SPECTRUM:
  - Strong consistency: immediate correctness, lower flexibility.
  - Eventual consistency: asynchronous convergence, higher resilience.

  2. TRANSACTION STRATEGY:
  - Keep ACID transactions short and local.
  - For distributed changes, use saga with compensation.

  3. IDEMPOTENCY KEYS:
  - Required for payment/order APIs with retry behavior.
  - Prevents duplicate side effects under network failures.

  4. OUTBOX PATTERN:
  - Persist domain change and event in same transaction.
  - Background publisher emits events reliably.

  5. VERSIONING AND CONFLICTS:
  - Optimistic concurrency via version fields.
  - Reject stale updates with clear error semantics.

  6. READ/WRITE MODELS:
  - Command model optimized for invariants.
  - Query model optimized for reporting/search (CQRS-style where justified).
    `,
    apiAndContracts: `
  API DESIGN THEORY:

  1. CONTRACT-FIRST MINDSET:
  - Request/response schema is a long-lived interface.
  - Design for backward compatibility from day one.

  2. ERROR TAXONOMY:
  - Validation errors (4xx), business rule conflicts (409), transient infra (5xx).
  - Include machine-readable error codes and remediation hints.

  3. IDEMPOTENT VERBS:
  - GET/PUT/DELETE should be idempotent.
  - POST requires idempotency key when duplicate creation is risky.

  4. PAGINATION AND FILTERING:
  - Cursor pagination for high-scale datasets.
  - Stable ordering + deterministic next tokens.

  5. VERSIONING STRATEGY:
  - Prefer additive changes.
  - Deprecate with migration window and observability on old usage.

  6. CONTRACT TESTING:
  - Provider and consumer tests prevent integration regressions.
    `,
    concurrencyPatterns: `
  CONCURRENCY AND PARALLELISM PATTERNS:

  1. LOCKING CHOICES:
  - Pessimistic lock: strong safety, lower throughput.
  - Optimistic lock: higher throughput, retry on conflict.

  2. HOTSPOT MITIGATION:
  - Shard counters, batch writes, avoid global mutable state.
  - Use queue partitioning by key to serialize conflicting operations.

  3. WORK QUEUES:
  - Bounded queues avoid memory blow-up.
  - Dead-letter queues for poison messages.

  4. RETRY SAFETY:
  - Retries must be idempotent and side-effect aware.
  - Use jitter to avoid thundering herds.

  5. CLOCK AND ORDERING:
  - Distributed clocks are imperfect.
  - Use logical sequencing/versioning when order matters.
    `,
    testingAndQuality: `
  TESTING STRATEGY FOR LLD SYSTEMS:

  1. PYRAMID BALANCE:
  - Unit tests for domain invariants and policy rules.
  - Integration tests for DB/queue/adapters.
  - End-to-end tests for critical business flows.

  2. CONTRACT TESTS:
  - Validate interface semantics across modules and services.

  3. PROPERTY TESTING:
  - Great for state machines and rule engines.
  - Assert invariants across many generated scenarios.

  4. CHAOS/Fault TESTS:
  - Inject timeouts, partial failures, duplicate events.
  - Verify recovery and observability quality.

  5. PERFORMANCE TESTS:
  - Baseline throughput and latency under realistic load patterns.
  - Track regressions as part of CI gates for critical systems.
    `,
    interviewBlueprint: `
  SYSTEM DESIGN INTERVIEW BLUEPRINT:

  STEP 1 - CLARIFY:
  - Functional requirements, constraints, scale, success criteria.

  STEP 2 - MODEL:
  - Core entities, states, invariants, workflows.

  STEP 3 - API AND DATA:
  - Key APIs, schema, consistency decisions, indexing strategy.

  STEP 4 - COMPONENTS:
  - Service boundaries, internal modules, adapters.

  STEP 5 - FAILURE HANDLING:
  - Timeouts, retries, idempotency, compensation.

  STEP 6 - TRADE-OFFS:
  - Explain alternatives and justify your choice.

  STEP 7 - EVOLUTION:
  - Show how design supports future features with minimal churn.

  STEP 8 - OBSERVABILITY:
  - Metrics, logs, traces, SLO and alert signals.
    `,
    antiPatternsDeepDive: `
  ADVANCED ANTI-PATTERNS:

  1. ANEMIC DOMAIN MODEL:
  - Data-only objects and business logic spread across services.
  - Leads to duplicated rules and drift.

  2. SHARED DATABASE COUPLING:
  - Multiple modules writing each other's tables.
  - Kills autonomy and migration safety.

  3. LEAKY ABSTRACTIONS:
  - Interface exists but callers still depend on implementation details.

  4. RETRY STORM:
  - Aggressive retries without backoff or budgets amplify outages.

  5. METRIC-LESS DESIGN:
  - No measurable SLO means no objective health signal.

  6. BIG-BANG REWRITE:
  - High risk and delayed value; prefer incremental migration seams.
    `
    },

  resources: {
    books: [
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Gang of Four (Gamma, Helm, Johnson, Vlissides)',
        difficulty: 'Advanced',
        topics: ['All 23 GoF Patterns'],
        description: 'The definitive book on design patterns - a must-read classic'
      },
      {
        title: 'Head First Design Patterns',
        author: 'Freeman & Robson',
        difficulty: 'Beginner',
        topics: ['Design Patterns'],
        description: 'Most accessible introduction to design patterns with engaging examples'
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        difficulty: 'Intermediate',
        topics: ['Clean Code', 'Best Practices'],
        description: 'Essential book for writing maintainable, clean code'
      },
      {
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        difficulty: 'Intermediate',
        topics: ['Refactoring', 'Code Quality'],
        description: 'Learn to improve code design without changing behavior'
      },
      {
        title: 'Object-Oriented Analysis and Design',
        author: 'Grady Booch',
        difficulty: 'Advanced',
        topics: ['OOP', 'System Design'],
        description: 'Comprehensive guide to object-oriented design principles'
      }
    ],
    websites: [
      {
        name: 'Refactoring.Guru',
        url: 'https://refactoring.guru/design-patterns',
        type: 'Tutorials',
        description: 'Best visual guide to design patterns with examples in multiple languages'
      },
      {
        name: 'SourceMaking',
        url: 'https://sourcemaking.com/design_patterns',
        type: 'Reference',
        description: 'Design patterns, anti-patterns, and refactoring techniques'
      },
      {
        name: 'Design Patterns Game',
        url: 'https://designpatternsgame.com',
        type: 'Practice',
        description: 'Interactive game to learn design patterns'
      },
      {
        name: 'OODesign.com',
        url: 'https://www.oodesign.com',
        type: 'Tutorials',
        description: 'Object-oriented design principles and patterns'
      }
    ],
    videos: [
      {
        title: 'Design Patterns in Object Oriented Programming',
        platform: 'YouTube',
        instructor: 'Christopher Okhravi',
        duration: '30+ videos',
        difficulty: 'Intermediate',
        url: 'https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc'
      },
      {
        title: 'Low Level Design Primer',
        platform: 'YouTube',
        instructor: 'Gaurav Sen',
        duration: '15 videos',
        difficulty: 'Intermediate',
        url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX'
      },
      {
        title: 'SOLID Principles',
        platform: 'YouTube',
        instructor: 'Uncle Bob',
        duration: '5 hours',
        difficulty: 'Advanced',
        url: 'https://www.youtube.com/watch?v=t86v3N4OshQ'
      }
    ],
    tools: [
      {
        name: 'PlantUML',
        description: 'Create UML diagrams from text',
        url: 'https://plantuml.com'
      },
      {
        name: 'draw.io',
        description: 'Free online diagram software',
        url: 'https://www.draw.io'
      },
      {
        name: 'Lucidchart',
        description: 'Professional diagramming tool',
        url: 'https://www.lucidchart.com'
      }
    ]
  },

  tips: {
    general: [
      'Master OOP fundamentals before diving into patterns',
      'Learn SOLID principles - they are foundation of good design',
      'Draw UML diagrams before coding',
      'Practice implementing patterns from scratch',
      'Don\'t memorize patterns - understand when to use them',
      'Read real codebases to see patterns in action',
      'Refactor existing code to apply patterns',
      'Focus on problem-solving, not pattern-matching'
    ],
    beforeInterview: [
      'Review all 23 GoF patterns',
      'Practice drawing class diagrams quickly',
      'Prepare 5-6 LLD problems thoroughly',
      'Be ready to explain SOLID principles with examples',
      'Practice thinking out loud while designing',
      'Know tradeoffs of different approaches',
      'Prepare questions about requirements'
    ],
    duringInterview: [
      'Ask clarifying questions about requirements',
      'Start with core entities and relationships',
      'Think about extensibility from the start',
      'Discuss design patterns you\'re using',
      'Consider edge cases and error handling',
      'Explain your design decisions',
      'Be open to feedback and iteration',
      'Use proper OOP terminology'
    ],
    antiPatterns: [
      'God Class - class that does everything',
      'Spaghetti Code - tangled, unstructured code',
      'Golden Hammer - using same pattern for everything',
      'Premature Optimization - optimizing before needed',
      'Tight Coupling - classes too dependent on each other',
      'Not Invented Here - rejecting existing solutions',
      'Analysis Paralysis - overthinking the design'
    ]
  },

  faqs: [
    {
      question: 'Do I need to memorize all 23 design patterns?',
      answer: 'No. Focus on understanding the principles behind patterns. Know 10-12 common patterns well (Singleton, Factory, Observer, Strategy, Decorator, Adapter, Command, Template Method). Others you can learn when needed.'
    },
    {
      question: 'Which programming language should I use for LLD interviews?',
      answer: 'Java and C++ are most common for LLD interviews. Python is also accepted. Choose the language you know best and that supports OOP well. The concepts matter more than syntax.'
    },
    {
      question: 'How do I know which design pattern to use?',
      answer: 'Focus on the problem, not the pattern. Understand what each pattern solves. With practice, you\'ll recognize patterns naturally. Don\'t force patterns - use them when they make code clearer and more maintainable.'
    },
    {
      question: 'How much time should I spend on LLD interviews?',
      answer: 'LLD rounds typically last 45-60 minutes. Spend 10 minutes on requirements, 15-20 minutes on class diagram, 20-25 minutes on implementation details, and 5-10 minutes on discussion/improvements.'
    },
    {
      question: 'Should I focus on implementation or class design?',
      answer: 'Class design is more important in LLD interviews. Have clean class diagrams with proper relationships. Implementation can be pseudo-code or key methods. Focus on extensibility and SOLID principles.'
    },
    {
      question: 'How detailed should my UML diagrams be?',
      answer: 'Include all major classes, their attributes, key methods, and relationships (inheritance, composition, association). Don\'t add getter/setters to clutter. Focus on design, not every detail.'
    }
  ],

  practiceProblems: [
    {
      id: 1,
      title: 'Design Chess Game',
      difficulty: 'Medium',
      topics: ['OOP', 'State Pattern', 'Strategy Pattern'],
      description: 'Design chess game with pieces, board, moves, and game rules',
      estimatedTime: '3-4 hours'
    },
    {
      id: 2,
      title: 'Design Tic-Tac-Toe',
      difficulty: 'Easy',
      topics: ['OOP', 'State Pattern'],
      description: 'Simple tic-tac-toe game with win detection',
      estimatedTime: '1-2 hours'
    },
    {
      id: 3,
      title: 'Design Snake and Ladder',
      difficulty: 'Easy',
      topics: ['OOP', 'Random'],
      description: 'Classic board game with snakes and ladders',
      estimatedTime: '2 hours'
    },
    {
      id: 4,
      title: 'Design Movie Ticket Booking',
      difficulty: 'Medium',
      topics: ['Booking System', 'Concurrency'],
      description: 'Book movie tickets with seat selection',
      estimatedTime: '3 hours'
    },
    {
      id: 5,
      title: 'Design Car Rental System',
      difficulty: 'Medium',
      topics: ['Rental', 'Booking', 'Pricing'],
      description: 'Rent cars with different types and pricing',
      estimatedTime: '3 hours'
    },
    {
      id: 6,
      title: 'Design LinkedIn',
      difficulty: 'Hard',
      topics: ['Social Network', 'Connections', 'Feed'],
      description: 'Social network with connections, posts, and feed',
      estimatedTime: '5 hours'
    },
    {
      id: 7,
      title: 'Design Uber/Ola',
      difficulty: 'Hard',
      topics: ['Ride Sharing', 'Matching', 'Pricing'],
      description: 'Ride sharing with driver-rider matching',
      estimatedTime: '4-5 hours'
    },
    {
      id: 8,
      title: 'Design Restaurant Management',
      difficulty: 'Medium',
      topics: ['Booking', 'Orders', 'Billing'],
      description: 'Manage reservations, orders, and billing',
      estimatedTime: '3 hours'
    },
    {
      id: 9,
      title: 'Design Stack Overflow',
      difficulty: 'Hard',
      topics: ['Q&A', 'Voting', 'Reputation'],
      description: 'Q&A platform with voting and reputation system',
      estimatedTime: '4 hours'
    },
    {
      id: 10,
      title: 'Design Logging Framework',
      difficulty: 'Medium',
      topics: ['Logging', 'Decorator', 'Chain of Responsibility'],
      description: 'Flexible logging with levels, formats, and outputs',
      estimatedTime: '2-3 hours'
    },
    {
      id: 11,
      title: 'Design Cache System',
      difficulty: 'Medium',
      topics: ['LRU Cache', 'Eviction Policies'],
      description: 'Cache with different eviction strategies',
      estimatedTime: '2 hours'
    },
    {
      id: 12,
      title: 'Design Notification Service',
      difficulty: 'Medium',
      topics: ['Observer', 'Strategy', 'Factory'],
      description: 'Send notifications via email, SMS, push',
      estimatedTime: '2-3 hours'
    },
    {
      id: 13,
      title: 'Design Rate Limiter',
      difficulty: 'Medium',
      topics: ['Rate Limiting', 'Strategy Pattern'],
      description: 'Rate limiter with different algorithms',
      estimatedTime: '2 hours'
    },
    {
      id: 14,
      title: 'Design URL Shortener',
      difficulty: 'Easy',
      topics: ['Hashing', 'Encoding'],
      description: 'Shorten URLs and redirect',
      estimatedTime: '1-2 hours'
    },
    {
      id: 15,
      title: 'Design File System',
      difficulty: 'Medium',
      topics: ['Composite Pattern', 'Tree'],
      description: 'File system with files, folders, and operations',
      estimatedTime: '2-3 hours'
    }
  ],

  interviewCompanies: [
    'Google', 'Amazon', 'Microsoft', 'Facebook/Meta', 'Apple',
    'Netflix', 'Uber', 'Airbnb', 'LinkedIn', 'Twitter',
    'Adobe', 'Oracle', 'Salesforce', 'Atlassian', 'Flipkart',
    'PhonePe', 'Razorpay', 'Swiggy', 'Zomato', 'Ola'
  ]
};

export default lldLearningPath;
