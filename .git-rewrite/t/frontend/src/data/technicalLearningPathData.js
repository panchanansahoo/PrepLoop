// Technical Learning Path Data — Focusing on CS Fundamentals and System Design
export const TECHNICAL_STAGES = [
    { id: 'cs-fundamentals', name: 'CS Fundamentals', color: '#818cf8', icon: '💻' },
    { id: 'system-design', name: 'System Design', color: '#34d399', icon: '🏗️' },
    { id: 'web-dev', name: 'Web & API Design', color: '#f59e0b', icon: '🌐' },
    { id: 'advanced', name: 'Advanced Architecture', color: '#f472b6', icon: '🚀' },
];

export const TECHNICAL_TOPICS = [
    // ═══════════════ STAGE 1: CS FUNDAMENTALS ═══════════════
    {
        id: 'dbms',
        title: 'Database Management Systems',
        stage: 'cs-fundamentals',
        icon: '🗄️',
        color: '#818cf8',
        difficulty: 'Medium',
        estimatedTime: '4–5 hours',
        description: 'Relational vs NoSQL, ACID, Normalization, Indexing, and Transactions.',
        scenarios: [
            { id: 'scenario-1', title: 'Designing a schema for E-commerce', type: 'Design' },
            { id: 'scenario-2', title: 'Handling high concurrent transactions', type: 'Concurrency' }
        ],
        flashcards: [
            { q: 'What is the ACID property?', a: 'Atomicity, Consistency, Isolation, Durability. Ensures reliable database transactions.' },
            { q: 'What is a Clustered Index?', a: 'An index that determines the physical order of data in a table. Only one per table is allowed.' },
            { q: 'What is 3NF?', a: 'A table is in 3NF if it is in 2NF and has no transitive functional dependencies.' },
            { q: 'What is the difference between TRUNCATE and DELETE?', a: 'TRUNCATE is DDL, faster, resets identity, cannot be rolled back (usually). DELETE is DML, logs each row, can be rolled back.' },
            { q: 'What is a Foreign Key?', a: 'A field (or collection of fields) in one table that uniquely identifies a row of another table or the same table.' },
            { q: 'What is Database Normalization?', a: 'The process of organizing data to minimize redundancy and dependency.' },
            { q: 'What is the difference between SQL and NoSQL?', a: 'SQL databases are relational, structured, and use schemas. NoSQL databases are non-relational, document/key-value/graph based, and scheme-less.' },
            { q: 'What is a JOIN? Explain different types.', a: 'JOIN combines rows from two or more tables based on a related column. Types: INNER JOIN (matching rows only), LEFT JOIN (all left + matching right), RIGHT JOIN (all right + matching left), FULL OUTER JOIN (all rows from both), CROSS JOIN (cartesian product).' },
            { q: 'What is a View in SQL?', a: 'A virtual table based on the result set of a SQL query. Views do not store data themselves; they dynamically fetch data from the underlying tables whenever accessed.' },
            { q: 'What is a Stored Procedure?', a: 'A prepared SQL code saved in the database that can be reused. It accepts parameters, performs operations, and can return results. Improves performance and maintainability.' },
            { q: 'What is a Trigger in databases?', a: 'A special type of stored procedure that automatically runs when certain events (INSERT, UPDATE, DELETE) occur on a table. Used for auditing, validation, and enforcing business rules.' },
            { q: 'What is Denormalization and when is it used?', a: 'Adding redundant data to a normalized database to improve read performance. Used in read-heavy applications, data warehousing, and when complex joins hurt performance.' },
            { q: 'What is the difference between WHERE and HAVING clause?', a: 'WHERE filters rows before grouping (applied on individual rows). HAVING filters groups after GROUP BY (applied on aggregated results).' },
            { q: 'What is an Index in a database and how does it work?', a: 'An index is a data structure (usually B-tree or hash) that improves the speed of data retrieval. It creates a separate lookup structure that maps column values to their row locations, trading extra storage and write overhead for faster reads.' },
            { q: 'What is a Primary Key vs Unique Key?', a: 'Primary Key: Uniquely identifies each row, cannot be NULL, only one per table. Unique Key: Ensures uniqueness of values in a column, can have one NULL, multiple allowed per table.' },
            { q: 'What is a Composite Key?', a: 'A key that consists of two or more columns to uniquely identify a row in a table. Used when a single column cannot uniquely identify records.' },
            { q: 'What are the different types of SQL commands?', a: 'DDL (CREATE, ALTER, DROP), DML (INSERT, UPDATE, DELETE), DCL (GRANT, REVOKE), TCL (COMMIT, ROLLBACK, SAVEPOINT), DQL (SELECT).' },
            { q: 'What is a Cursor in SQL?', a: 'A database object used to retrieve and manipulate data row by row from a result set. Useful for row-level processing but slower than set-based operations.' },
            { q: 'What is BCNF (Boyce-Codd Normal Form)?', a: 'A stricter version of 3NF where every determinant must be a candidate key. Eliminates all redundancy based on functional dependencies.' },
            { q: 'What is a Transaction in SQL?', a: 'A sequence of one or more SQL statements that are executed as a single unit of work. Either all succeed (COMMIT) or all fail (ROLLBACK), ensuring data integrity.' },
            { q: 'What is a Deadlock in databases and how to prevent it?', a: 'When two or more transactions are waiting for each other to release locks, creating a circular wait. Prevention: Lock ordering, timeout mechanisms, deadlock detection algorithms, and keeping transactions short.' },
            { q: 'What are Aggregate Functions in SQL?', a: 'Functions that perform calculations on a set of values and return a single value. COUNT, SUM, AVG, MIN, MAX. Used with GROUP BY to summarize data.' },
            { q: 'What is a Materialized View?', a: 'Unlike regular views, a materialized view stores the query result physically. Faster reads but needs periodic refresh to stay in sync with base tables. Used in data warehousing and reporting.' },
            { q: 'What is the difference between UNION and UNION ALL?', a: 'UNION combines result sets and removes duplicates (slower). UNION ALL combines result sets and keeps all rows including duplicates (faster). Use UNION ALL when duplicates are acceptable.' },
            { q: 'What is a Self Join?', a: 'A join where a table is joined with itself. Used to compare rows within the same table. Example: Finding employees who have the same manager.' },
            { q: 'What is Database Partitioning?', a: 'Dividing a large table into smaller, more manageable pieces while maintaining it as a single logical table. Types: Range, List, Hash, Composite. Improves query performance and maintenance.' }
        ]
    },
    {
        id: 'os',
        title: 'Operating Systems',
        stage: 'cs-fundamentals',
        icon: '⚙️',
        color: '#a78bfa',
        difficulty: 'Medium–Hard',
        estimatedTime: '3–4 hours',
        description: 'Processes vs Threads, Concurrency, Deadlocks, Memory Management.',
        scenarios: [
            { id: 'scenario-1', title: 'Resolving a Deadlock in a banking system', type: 'Concurrency' },
            { id: 'scenario-2', title: 'Designing an efficient LRU Cache', type: 'Memory' }
        ],
        flashcards: [
            { q: 'What is a Process vs Thread?', a: 'A process is an executing program (heavyweight, independent memory). A thread is a unit of execution within a process (lightweight, shared memory).' },
            { q: 'What are the 4 conditions for Deadlock?', a: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.' },
            { q: 'What is Paging vs Segmentation?', a: 'Paging divides memory into fixed-size blocks (pages). Segmentation divides memory into variable-sized logical blocks (segments).' },
            { q: 'What is a Mutex vs Semaphore?', a: 'A mutex provides mutual exclusion to a shared resource (only one thread can access). A semaphore is a signaling mechanism with a counter to control access to a resource pool.' },
            { q: 'What is Virtual Memory?', a: 'A memory management capability that provides an idealized abstraction of the storage resources that are actually available, combining RAM and disk space.' },
            { q: 'What is context switching?', a: 'The process of storing the state of a process or thread, so that it can be restored and resume execution at a later point, allowing multiple processes to share a single CPU.' },
            { q: 'What is Thrashing?', a: 'A condition when the system spends more time swapping pages in and out of memory than executing processes. Occurs when there is not enough memory to hold the working sets of all active processes.' },
            { q: 'Explain the difference between Preemptive and Non-Preemptive scheduling.', a: 'Preemptive scheduling allows the OS to interrupt and suspend a running process to allocate CPU to another (e.g., Round Robin). Non-preemptive scheduling lets a process run until it voluntarily releases the CPU (e.g., FCFS, SJF).' },
            { q: 'What is a System Call?', a: 'An interface between a user-level process and the operating system kernel. It allows programs to request services from the kernel like file I/O, process creation, and memory allocation.' },
            { q: 'What is the difference between User Mode and Kernel Mode?', a: 'User Mode has restricted access to hardware and memory (runs user applications). Kernel Mode has unrestricted access to all hardware and system resources (runs OS core operations). Mode switching happens via system calls.' },
            { q: 'What is a Page Fault?', a: 'Occurs when a program accesses a memory page not currently in physical RAM. The OS must load the page from disk (swap space). Frequent page faults cause thrashing.' },
            { q: 'What is the difference between Internal and External Fragmentation?', a: 'Internal Fragmentation: Wasted memory inside allocated blocks (fixed-size allocation gives more than needed). External Fragmentation: Free memory exists but is scattered in small non-contiguous blocks.' },
            { q: 'Explain different CPU Scheduling algorithms.', a: 'FCFS (First Come First Serve), SJF (Shortest Job First), Priority Scheduling, Round Robin (time quantum), Multilevel Queue. Each trades between throughput, latency, and fairness.' },
            { q: 'What is a Zombie Process vs Orphan Process?', a: 'Zombie: Finished execution but still has an entry in the process table (parent hasn\'t called wait()). Orphan: Parent terminated before the child; adopted by init process (PID 1).' },
            { q: 'What is Demand Paging?', a: 'A memory management scheme where pages are loaded into RAM only when they are needed (on demand), not in advance. Reduces initial loading time and memory usage.' },
            { q: 'What is Starvation and how is it different from Deadlock?', a: 'Starvation: A process waits indefinitely because other higher-priority processes keep getting executed. Deadlock: Two or more processes are blocked forever, each waiting for the other. Starvation can be solved with aging; deadlock needs prevention or detection.' },
            { q: 'What is the difference between Process and Program?', a: 'A program is a passive entity (code stored on disk). A process is an active entity (a program in execution with its own memory space, program counter, and resources). Multiple processes can be created from the same program.' },
            { q: 'What is a Race Condition?', a: 'When multiple threads/processes access shared data concurrently and the final result depends on the order of execution. Prevented using mutexes, semaphores, or atomic operations.' },
            { q: 'What is the difference between Logical and Physical Address?', a: 'Logical (Virtual) Address: Generated by CPU during execution. Physical Address: Actual location in RAM. The Memory Management Unit (MMU) translates logical to physical addresses.' },
            { q: 'What is Belady\'s Anomaly?', a: 'A phenomenon in FIFO page replacement where increasing the number of page frames can actually increase the number of page faults. Does not occur in LRU or Optimal page replacement.' },
            { q: 'What is IPC (Inter-Process Communication)?', a: 'Mechanisms for processes to communicate and synchronize. Methods: Pipes, Message Queues, Shared Memory, Sockets, Signals. Shared Memory is fastest; Message Queues provide structured communication.' }
        ]
    },
    {
        id: 'networks',
        title: 'Computer Networks',
        stage: 'cs-fundamentals',
        icon: '🌐',
        color: '#22d3ee',
        difficulty: 'Medium',
        estimatedTime: '3–4 hours',
        description: 'OSI Model, TCP/UDP, HTTP/HTTPS, DNS, and Routing.',
        scenarios: [
            { id: 'scenario-1', title: 'What happens when you type google.com?', type: 'Lifecycle' },
            { id: 'scenario-2', title: 'Choosing between TCP and UDP for a streaming app', type: 'Design' }
        ],
        flashcards: [
            { q: 'What are the 7 layers of the OSI Model?', a: 'Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
            { q: 'TCP vs UDP?', a: 'TCP is connection-oriented, reliable, and ordered. UDP is connectionless, fast, and does not guarantee delivery.' },
            { q: 'How does DNS work?', a: 'Translates human-readable domain names (google.com) to IP addresses using a hierarchy of nameservers.' },
            { q: 'What is a subnet mask?', a: 'A 32-bit number that masks an IP address, and divides the IP address into network address and host address.' },
            { q: 'What is the difference between a Router and a Switch?', a: 'A router operates at the Network layer (Layer 3) and connects different networks. A switch operates at the Data Link layer (Layer 2) and connects devices within the same network.' },
            { q: 'What is a MAC address?', a: 'Media Access Control address. A unique identifier assigned to a network interface controller (NIC) for use as a network address in communications within a network segment.' },
            { q: 'What is the difference between HTTP and HTTPS?', a: 'HTTP transfers data in plain text. HTTPS (HTTP Secure) uses SSL/TLS encryption to secure data in transit. HTTPS operates on port 443, HTTP on port 80.' },
            { q: 'What is ARP (Address Resolution Protocol)?', a: 'A protocol used to map a known IP address to a MAC address within a local network. The device broadcasts an ARP request and the device with the matching IP responds with its MAC address.' },
            { q: 'What is a Firewall?', a: 'A network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules. Can be hardware-based or software-based.' },
            { q: 'What is NAT (Network Address Translation)?', a: 'A method of remapping one IP address space into another by modifying network address information. Allows multiple devices in a private network to share a single public IP address.' },
            { q: 'What is the 3-way handshake in TCP?', a: 'Step 1: Client sends SYN. Step 2: Server responds with SYN-ACK. Step 3: Client sends ACK. This establishes a reliable connection before data transfer begins.' },
            { q: 'What is DHCP?', a: 'Dynamic Host Configuration Protocol. Automatically assigns IP addresses and other network settings (subnet mask, gateway, DNS) to devices on a network.' },
            { q: 'What is the difference between IPv4 and IPv6?', a: 'IPv4: 32-bit addresses (~4.3 billion). IPv6: 128-bit addresses (~340 undecillion). IPv6 also has built-in security (IPSec), no broadcast, and auto-configuration.' },
            { q: 'What is a VPN and how does it work?', a: 'Virtual Private Network creates an encrypted tunnel between your device and a VPN server. All traffic passes through this tunnel, hiding your IP and encrypting data from eavesdroppers.' },
            { q: 'What is the difference between a Hub, Switch, and Router?', a: 'Hub: Layer 1, broadcasts to all ports. Switch: Layer 2, forwards to specific MAC address. Router: Layer 3, routes between different networks using IP addresses.' },
            { q: 'What happens when you type a URL in the browser?', a: 'DNS resolution → TCP 3-way handshake → TLS handshake (if HTTPS) → HTTP request sent → Server processes request → HTTP response with HTML → Browser parses HTML, loads CSS/JS → DOM construction → Page rendered.' },
            { q: 'What is WebSocket and how is it different from HTTP?', a: 'WebSocket provides full-duplex, persistent communication over a single TCP connection. HTTP is request-response (half-duplex). WebSocket is ideal for real-time apps (chat, gaming, live feeds). Starts with an HTTP upgrade handshake.' },
            { q: 'What are the differences between TCP/IP and OSI model?', a: 'OSI has 7 layers (theoretical reference model). TCP/IP has 4 layers (practical implementation): Network Access, Internet, Transport, Application. TCP/IP is what the internet actually uses.' },
            { q: 'What is a Proxy vs Reverse Proxy in networking?', a: 'Proxy (Forward): Client-side intermediary that hides client identity. Reverse Proxy: Server-side intermediary that hides server details, provides load balancing, SSL termination, and caching (e.g., Nginx, HAProxy).' }
        ]
    },
    {
        id: 'oops',
        title: 'Object-Oriented Programming',
        stage: 'cs-fundamentals',
        icon: '🧱',
        color: '#fb923c',
        difficulty: 'Easy–Medium',
        estimatedTime: '2–3 hours',
        description: 'Encapsulation, Abstraction, Inheritance, Polymorphism, and Design Patterns.',
        scenarios: [
            { id: 'scenario-1', title: 'Designing a Parking Lot', type: 'Low-Level Design' },
            { id: 'scenario-2', title: 'Designing an Elevator System', type: 'Low-Level Design' }
        ],
        flashcards: [
            { q: 'What are the 4 pillars of OOP?', a: 'Encapsulation, Abstraction, Inheritance, Polymorphism.' },
            { q: 'Method Overloading vs Overriding?', a: 'Overloading: Same method name, different parameters (compile-time). Overriding: Subclass redefines parent method (run-time).' },
            { q: 'What is the Singleton Pattern?', a: 'Ensures a class has only one instance and provides a global point of access to it.' },
            { q: 'What is an Abstract Class vs Interface?', a: 'An Abstract class can have both abstract and concrete methods, and fields. An Interface only defines a contract (usually all abstract methods) and a class can implement multiple interfaces.' },
            { q: 'What is Encapsulation?', a: 'The bundling of data (variables) and methods that operate on that data into a single unit (class), and restricting direct access to some of the object\'s components.' },
            { q: 'What is Polymorphism?', a: 'The ability of different classes to be treated as instances of the same class through a common interface.' },
            { q: 'What are SOLID principles?', a: 'S — Single Responsibility, O — Open/Closed, L — Liskov Substitution, I — Interface Segregation, D — Dependency Inversion. They make code more maintainable and flexible.' },
            { q: 'What is Composition over Inheritance?', a: 'A design principle favoring building complex functionality by combining simpler objects (has-a relationship) instead of inheriting behavior (is-a). Reduces tight coupling and makes code more flexible.' },
            { q: 'What is the Factory Design Pattern?', a: 'A creational design pattern that provides an interface for creating objects without specifying their exact class. A factory method returns an instance of a class based on input parameters.' },
            { q: 'What is the Observer Design Pattern?', a: 'A behavioral pattern where an object (subject) maintains a list of dependents (observers) and notifies them of state changes automatically. Used in event handling systems, MVC pattern, etc.' },
            { q: 'What is the Strategy Design Pattern?', a: 'A behavioral pattern that defines a family of algorithms, encapsulates each one, and makes them interchangeable. Lets the algorithm vary independently from clients that use it. Example: different sorting strategies.' },
            { q: 'What is the Decorator Pattern?', a: 'A structural pattern that allows adding new behavior to objects dynamically by wrapping them. Provides a flexible alternative to subclassing. Example: Java I/O streams (BufferedInputStream wraps FileInputStream).' },
            { q: 'What is Dependency Injection?', a: 'A design pattern where an object receives its dependencies from external sources rather than creating them internally. Promotes loose coupling and makes code more testable. Types: Constructor, Setter, and Interface injection.' },
            { q: 'What is the difference between Association, Aggregation, and Composition?', a: 'Association: Two objects are related but independent. Aggregation: "Has-a" relationship where child can exist independently (Teacher has Students). Composition: Strong "Has-a" where child cannot exist without parent (House has Rooms).' },
            { q: 'What is the MVC pattern?', a: 'Model-View-Controller separates an application into three components: Model (data/business logic), View (UI/presentation), Controller (handles input, updates model/view). Promotes separation of concerns.' },
            { q: 'What is the Builder Design Pattern?', a: 'A creational pattern that constructs complex objects step by step. Separates construction from representation. Useful when an object has many optional parameters. Example: StringBuilder, query builders.' },
            { q: 'What is Coupling vs Cohesion?', a: 'Coupling: Degree of interdependence between modules (low is better). Cohesion: Degree to which elements within a module belong together (high is better). Goal: Low coupling, high cohesion for maintainable code.' },
            { q: 'What is the difference between Early and Late Binding?', a: 'Early Binding (Static): Method call resolved at compile time (method overloading). Late Binding (Dynamic): Method call resolved at runtime (method overriding/polymorphism). Late binding enables flexibility but has slight performance overhead.' },
            { q: 'What is the Proxy Design Pattern?', a: 'A structural pattern that provides a surrogate/placeholder for another object to control access. Types: Virtual (lazy loading), Protection (access control), Remote (network proxy). Example: Spring AOP proxies.' }
        ]
    },

    // ═══════════════ STAGE 2: SYSTEM DESIGN ═══════════════
    {
        id: 'sysdesign-basics',
        title: 'System Design Basics',
        stage: 'system-design',
        icon: '🏗️',
        color: '#34d399',
        difficulty: 'Medium',
        estimatedTime: '4–5 hours',
        description: 'Scaling, Load Balancing, Caching, and Database Sharding.',
        scenarios: [
            { id: 'scenario-1', title: 'Scaling from 0 to Millions of Users', type: 'Architecture' },
            { id: 'scenario-2', title: 'Designing a URL Shortener', type: 'System Design' }
        ],
        flashcards: [
            { q: 'Vertical vs Horizontal Scaling?', a: 'Vertical: Upgrading existing hardware (CPU/RAM). Horizontal: Adding more machines to the pool.' },
            { q: 'What is a Load Balancer?', a: 'Distributes incoming network traffic across multiple servers to ensure reliability and performance.' },
            { q: 'What is Consistent Hashing?', a: 'A distributed hashing scheme that operates independently of the number of servers, minimizing data movement when scaling.' },
            { q: 'What is Rate Limiting?', a: 'Controlling the rate of requests sent or received by a network interface to prevent server overload and abuse (e.g., Token Bucket algorithm).' },
            { q: 'What is a Message Queue?', a: 'An asynchronous service-to-service communication used in serverless and microservices architectures (e.g., RabbitMQ, Kafka).' },
            { q: 'SQL vs. NoSQL scaling?', a: 'SQL databases generally scale vertically. NoSQL databases scale horizontally by design via sharding/partitioning.' },
            { q: 'What is Database Sharding?', a: 'A horizontal partitioning strategy where data is split across multiple database instances. Each shard holds a subset of data, improving read/write performance and scalability.' },
            { q: 'What is a Proxy Server? Forward vs Reverse Proxy?', a: 'A proxy acts as an intermediary. Forward Proxy: sits in front of clients, hides client identity (e.g., VPN). Reverse Proxy: sits in front of servers, distributes load, hides server identity (e.g., Nginx).' },
            { q: 'How would you design a notification system?', a: 'Components: Message producer, message queue (Kafka/SQS), notification service, delivery channels (push/email/SMS), user preference store, retry mechanism with exponential backoff, and delivery tracking.' },
            { q: 'What is Data Replication and its types?', a: 'Copying data across multiple servers for reliability. Synchronous: Write confirmed after all replicas updated (consistent but slow). Asynchronous: Write confirmed after primary updated (fast but may lose data). Semi-synchronous: Hybrid approach.' },
            { q: 'What is Leader Election in distributed systems?', a: 'A process where nodes in a distributed system select one node as the coordinator/leader. Algorithms: Bully, Ring, Raft, Paxos. Ensures only one node handles writes or coordination at a time.' },
            { q: 'Design a URL Shortener (like bit.ly).', a: 'Use Base62 encoding of auto-increment ID or hash. Components: URL mapping DB, cache layer (Redis), load balancer, analytics tracker. Handle collisions, custom aliases, and expiration. Read-heavy system — optimize with caching.' },
            { q: 'What is the difference between Latency and Throughput?', a: 'Latency: Time taken for a single request to complete (measured in ms). Throughput: Number of requests processed per unit time (measured in requests/sec). Optimizing one can affect the other.' },
            { q: 'How would you design a chat application like WhatsApp?', a: 'Components: WebSocket servers for real-time messaging, message queue (Kafka), user service, message storage (Cassandra for write-heavy), media storage (S3), push notification service, presence service, end-to-end encryption, message delivery status (sent/delivered/read).' },
            { q: 'What is the difference between Availability and Reliability?', a: 'Availability: System is operational and accessible when needed (measured as uptime percentage, e.g., 99.99%). Reliability: System performs correctly without failure over time (measured as MTBF — Mean Time Between Failures). A system can be available but unreliable if it returns wrong results.' },
            { q: 'What is a Bloom Filter?', a: 'A space-efficient probabilistic data structure that tests whether an element is a member of a set. May have false positives but never false negatives. Used in database engines, caches, and spam filters.' },
            { q: 'What is Horizontal vs Vertical Partitioning?', a: 'Horizontal (Sharding): Split rows across different databases (each shard has all columns but a subset of rows). Vertical: Split columns across databases (each partition has all rows but different columns). Horizontal scales better for large datasets.' }
        ]
    },
    {
        id: 'data-structures',
        title: 'Data Structures Core',
        stage: 'cs-fundamentals',
        icon: '🌳',
        color: '#fbbf24',
        difficulty: 'Medium',
        estimatedTime: '5–6 hours',
        description: 'Arrays, Linked Lists, Trees, Graphs, Hash Tables, and Heaps.',
        scenarios: [
            { id: 'scenario-1', title: 'Implementing a Twitter Timeline', type: 'Design' },
            { id: 'scenario-2', title: 'Building a search autocomplete system', type: 'Design' }
        ],
        flashcards: [
            { q: 'What is a Hash Collision?', a: 'When two different keys map to the same hash code/index. Handled via chaining or open addressing.' },
            { q: 'Time complexity of Binary Search?', a: 'O(log N). Requires a sorted array.' },
            { q: 'What is a Trie?', a: 'A tree-like data structure used to store an associative array where keys are usually strings. Great for prefix matching.' },
            { q: 'What is the difference between an Array and a Linked List?', a: 'Arrays have contiguous memory allocation and O(1) random access. Linked Lists have non-contiguous memory, O(n) access, but O(1) insertion/deletion if the node is known.' },
            { q: 'What is a Heap data structure?', a: 'A specialized tree-based structure that satisfies the heap property (max-heap or min-heap). Often used to implement priority queues.' },
            { q: 'What is a Graph?', a: 'A non-linear data structure consisting of nodes (vertices) and edges that connect them. Can be directed or undirected.' },
            { q: 'What is the difference between a Stack and a Queue?', a: 'Stack follows LIFO (Last In First Out) — push and pop from the same end. Queue follows FIFO (First In First Out) — enqueue at rear, dequeue from front.' },
            { q: 'What is a Binary Search Tree (BST)?', a: 'A binary tree where the left child is smaller and the right child is larger than the parent. Provides O(log N) average time for search, insert, and delete operations.' },
            { q: 'What is a HashMap and how does it work internally?', a: 'A data structure that stores key-value pairs. Internally uses a hash function to compute an index into an array of buckets. Average O(1) for get/put operations. Handles collisions via chaining or open addressing.' },
            { q: 'What is a Doubly Linked List and when to use it?', a: 'Each node has pointers to both next and previous nodes. Allows bidirectional traversal, O(1) deletion when the node is known. Used in LRU cache, browser history, and undo/redo functionality.' },
            { q: 'What is an AVL Tree?', a: 'A self-balancing BST where the height difference between left and right subtrees (balance factor) is at most 1. Uses rotations (LL, RR, LR, RL) to maintain balance. Guarantees O(log N) for all operations.' },
            { q: 'What is a Segment Tree?', a: 'A tree data structure used for storing information about intervals/segments. Allows answering range queries (sum, min, max) and updates in O(log N) time. Used in competitive programming and database engines.' },
            { q: 'What is a Disjoint Set (Union-Find)?', a: 'A data structure that tracks a set of elements partitioned into disjoint subsets. Supports Find (which set an element belongs to) and Union (merge two sets). Used in Kruskal\'s MST algorithm, network connectivity.' },
            { q: 'What is the difference between BFS and DFS on graphs?', a: 'BFS uses Queue, explores level by level, finds shortest path in unweighted graphs. DFS uses Stack/recursion, explores depth-first, good for topological sorting, cycle detection, and connected components.' },
            { q: 'What is a Red-Black Tree?', a: 'A self-balancing BST with an extra bit per node for color (red/black). Guarantees O(log N) operations. Rules: Root is black, red nodes have black children, all paths from root to leaves have same black count. Used in TreeMap (Java), map (C++).' },
            { q: 'What is a Priority Queue and where is it used?', a: 'An abstract data type where each element has a priority. Higher priority elements are served first. Implemented using heaps. Used in Dijkstra\'s algorithm, task scheduling, Huffman encoding, and event-driven simulations.' },
            { q: 'What is a Circular Queue (Ring Buffer)?', a: 'A fixed-size queue where the last position connects to the first, forming a circle. Efficient use of memory — avoids the problem of unused space in linear queues. Used in OS scheduling, buffering, and producer-consumer problems.' },
            { q: 'What is the difference between Adjacency Matrix and Adjacency List?', a: 'Matrix: 2D array, O(1) edge lookup, O(V²) space — good for dense graphs. List: Array of linked lists, O(V+E) space — good for sparse graphs. Most real-world graphs are sparse, so adjacency list is preferred.' }
        ]
    },
    {
        id: 'algorithms',
        title: 'Algorithms Core',
        stage: 'cs-fundamentals',
        icon: '🔄',
        color: '#ef4444',
        difficulty: 'Hard',
        estimatedTime: '6–8 hours',
        description: 'Sorting, Searching, Dynamic Programming, Greedy, and Divide & Conquer.',
        scenarios: [
            { id: 'scenario-1', title: 'Finding the shortest path in a navigation map', type: 'Graph' },
            { id: 'scenario-2', title: 'Optimizing resource allocation', type: 'Dynamic Programming' }
        ],
        flashcards: [
            { q: 'What is Dynamic Programming?', a: 'Solving complex problems by breaking them down into simpler overlapping subproblems and storing the results (memoization/tabulation).' },
            { q: 'Time complexity of QuickSort?', a: 'Average: O(N log N). Worst: O(N^2) if pivot is poorly chosen.' },
            { q: 'Dijkstra vs A*?', a: 'Dijkstra expands uniformly (no heuristic). A* uses a heuristic to guide the search towards the goal faster.' },
            { q: 'What is a Greedy Algorithm?', a: 'An algorithmic paradigm that builds up a solution piece by piece, always choosing the next piece that offers the most obvious and immediate benefit.' },
            { q: 'What is the time complexity of Merge Sort?', a: 'Always O(N log N). It consistently divides the array in half and takes linear time to merge the halves.' },
            { q: 'What is Breadth-First Search (BFS)?', a: 'An algorithm for searching a tree or graph data structure level by level, starting from the root. Uses a Queue.' },
            { q: 'What is Depth-First Search (DFS)?', a: 'An algorithm that explores as far as possible along each branch before backtracking. Uses a Stack (or recursion). Three traversals for trees: PreOrder, InOrder, PostOrder.' },
            { q: 'What is the Two-Pointer technique?', a: 'An algorithm pattern using two pointers that move towards each other or in the same direction to solve problems efficiently. Common in sorted arrays and linked list problems. Reduces O(N²) to O(N).' },
            { q: 'What is the Sliding Window technique?', a: 'A technique for problems involving contiguous subarrays/substrings. Maintain a window that expands or shrinks as you iterate, tracking the optimal answer. Common in string and array problems.' },
            { q: 'What is Backtracking?', a: 'An algorithmic technique for solving problems recursively by trying to build a solution incrementally, abandoning a path ("backtracking") as soon as it determines the path cannot lead to a valid solution. Used in N-Queens, Sudoku solver, permutations.' },
            { q: 'What is Topological Sort?', a: 'A linear ordering of vertices in a DAG (Directed Acyclic Graph) such that for every directed edge (u,v), vertex u comes before v. Used in task scheduling, build systems, and course prerequisite ordering. Implemented via DFS or Kahn\'s algorithm (BFS).' },
            { q: 'What is the Kadane\'s Algorithm?', a: 'Finds the maximum sum contiguous subarray in O(N) time. Maintains current_max and global_max. At each element, current_max = max(element, current_max + element). Updates global_max if current_max is larger.' },
            { q: 'What is Memoization vs Tabulation?', a: 'Memoization (Top-Down): Recursive approach that stores results of subproblems in a cache. Tabulation (Bottom-Up): Iterative approach that fills a table from the smallest subproblem up. Both are DP techniques; tabulation is generally more space-efficient.' },
            { q: 'Explain the concept of Time and Space Complexity.', a: 'Time Complexity: How the runtime grows with input size (Big O notation). Space Complexity: How the memory usage grows with input size. Common complexities: O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(2^N) < O(N!).' },
            { q: 'What is the Knapsack Problem?', a: '0/1 Knapsack: Given items with weights and values, maximize value within weight capacity without breaking items. Solved with DP in O(nW) time. Fractional Knapsack: Items can be broken — solved with Greedy approach.' },
            { q: 'What is Hashing and how does it work?', a: 'Converting input of any size to a fixed-size output using a hash function. Properties: deterministic, fast, uniform distribution. Collision handling: Chaining (linked list at each index) or Open Addressing (linear/quadratic probing).' },
            { q: 'What is the Floyd-Warshall Algorithm?', a: 'An all-pairs shortest path algorithm. Uses DP to find shortest distances between every pair of vertices. Time: O(V³). Works with negative weights (but not negative cycles). Good for dense graphs.' },
            { q: 'What is the difference between Stable and Unstable Sorting?', a: 'Stable sort preserves the relative order of equal elements (Merge Sort, Insertion Sort, Bubble Sort). Unstable sort does not guarantee this (Quick Sort, Heap Sort). Stability matters when sorting by multiple keys.' }
        ]
    },

    // ═══════════════ STAGE 3: WEB & API DESIGN ═══════════════
    {
        id: 'api-design',
        title: 'API Design',
        stage: 'web-dev',
        icon: '🔌',
        color: '#f59e0b',
        difficulty: 'Medium',
        estimatedTime: '3–4 hours',
        description: 'RESTful guidelines, GraphQL, gRPC, versioning, and pagination.',
        scenarios: [
            { id: 'scenario-1', title: 'Designing an API for a ride-sharing app', type: 'API Design' },
            { id: 'scenario-2', title: 'Handling breaking changes in a public API', type: 'Versioning' }
        ],
        flashcards: [
            { q: 'REST vs GraphQL?', a: 'REST exposes multiple endpoints for resources. GraphQL exposes a single endpoint where clients query exactly the shape of data they need.' },
            { q: 'What is Idempotency?', a: 'An operation that produces the same result regardless of how many times it is executed (e.g., PUT or DELETE in REST).' },
            { q: 'How do you paginate large result sets?', a: 'Offset-based pagination (LIMIT/OFFSET) or Cursor-based pagination (faster, reliable for real-time).' },
            { q: 'What are HTTP status codes 200, 201, 400, 401, 403, 404, 500?', a: '200: OK, 201: Created, 400: Bad Request, 401: Unauthorized, 403: Forbidden, 404: Not Found, 500: Internal Server Error.' },
            { q: 'What is HATEOAS?', a: 'Hypermedia as the Engine of Application State. A constraint of the REST architecture where a client interacts with a network application entirely through hypermedia provided dynamically.' },
            { q: 'What is a Webhook?', a: 'A method of augmenting or altering the behavior of a web page or web application with custom callbacks. It pushes data to other applications in real-time.' },
            { q: 'What is CORS (Cross-Origin Resource Sharing)?', a: 'A browser security mechanism that allows or restricts web pages from making requests to a different domain. The server sets Access-Control-Allow-Origin headers to specify which origins are permitted.' },
            { q: 'What is OAuth 2.0?', a: 'An authorization framework that allows third-party applications to obtain limited access to a user\'s account on an HTTP service. Uses access tokens instead of sharing credentials. Common flows: Authorization Code, Client Credentials, Implicit.' },
            { q: 'What is gRPC and how is it different from REST?', a: 'gRPC is a high-performance RPC framework by Google using Protocol Buffers (binary serialization) and HTTP/2. Faster than REST (JSON/HTTP/1.1), supports streaming, strongly typed. REST is more widely adopted and browser-friendly.' },
            { q: 'What is API Rate Limiting and how to implement it?', a: 'Restricting the number of API calls a client can make in a given time period. Algorithms: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket. Implemented via middleware, API gateways, or Redis-based counters.' },
            { q: 'What is API Versioning and best practices?', a: 'Strategies: URI versioning (/api/v1/), Header versioning, Query parameter (?version=1). Best practice: Use URI versioning for simplicity, deprecate old versions gracefully, document changes in a changelog.' },
            { q: 'What is the difference between PUT and PATCH?', a: 'PUT replaces the entire resource with the provided data (requires full object). PATCH partially updates the resource with only the changed fields. PUT is idempotent; PATCH may or may not be.' },
            { q: 'What is GraphQL N+1 Problem and how to solve it?', a: 'When resolving nested data, GraphQL may make 1 query for the parent and N queries for each child. Solution: Batching/DataLoader pattern — batch all child requests into a single query. Also: Join Monster, query planning.' },
            { q: 'What is API Gateway Pattern?', a: 'A single entry point for all API calls that handles cross-cutting concerns: authentication, rate limiting, logging, request routing, protocol translation, and response aggregation. Examples: Kong, AWS API Gateway, Nginx.' },
            { q: 'What is Content Negotiation in REST APIs?', a: 'The mechanism by which the client and server agree on the response format. Client sends Accept header (e.g., application/json, text/xml). Server responds with Content-Type header matching the agreed format.' }
        ]
    },
    {
        id: 'caching-strategies',
        title: 'Caching Strategies',
        stage: 'web-dev',
        icon: '⚡',
        color: '#fb7185',
        difficulty: 'Medium–Hard',
        estimatedTime: '2–3 hours',
        description: 'Cache invalidation, LRU, Memcached, Redis, CDN.',
        scenarios: [
            { id: 'scenario-1', title: 'Caching the home feed of Instagram', type: 'Caching' },
            { id: 'scenario-2', title: 'Preventing Cache Stampede', type: 'Concurrency' }
        ],
        flashcards: [
            { q: 'Write-Through vs Write-Back Cache?', a: 'Write-Through: Update cache and DB synchronously. Write-Back: Update cache, async update DB later (faster but risks data loss).' },
            { q: 'What is Cache Eviction?', a: 'Removing old data to make room for new data. LRU (Least Recently Used) is common.' },
            { q: 'What is a CDN?', a: 'Content Delivery Network. Geographically distributed servers that cache static assets close to users.' },
            { q: 'What is Cache Stampede?', a: 'When a popular cache item expires, and many concurrent requests hit the database simultaneously to regenerate it.' },
            { q: 'What is Write-Around Cache?', a: 'Data is written directly to the database, bypassing the cache. Reduces cache churn for data that is infrequently read after being written.' },
            { q: 'Redis vs Memcached?', a: 'Redis supports complex data types (lists, sets) and persistence. Memcached handles only strings and is purely in-memory (no persistence).' },
            { q: 'What is Cache-Aside (Lazy Loading) pattern?', a: 'The application first checks the cache. On a cache miss, it fetches data from the database, stores it in the cache, and returns. Most common caching strategy — only caches data that is actually requested.' },
            { q: 'How does a CDN work internally?', a: 'CDN uses edge servers distributed globally. When a user requests content, DNS routes them to the nearest edge server. If cached (cache hit), content is served directly. If not (cache miss), the edge fetches from the origin server, caches it, and serves it.' },
            { q: 'What is Cache Invalidation and why is it hard?', a: 'The process of removing stale data from a cache. Hard because you must decide WHEN to invalidate (time-based TTL, event-based, manual). "There are only two hard things in CS: cache invalidation and naming things."' },
            { q: 'What is a Multi-Level Cache?', a: 'Using multiple layers of caching: L1 (in-process/local cache, fastest), L2 (distributed cache like Redis), L3 (CDN for static assets). Each level trades off between speed, capacity, and consistency.' },
            { q: 'What is TTL (Time-To-Live) in caching?', a: 'The duration a cached item remains valid before expiring and being refreshed. Short TTL: Fresher data but more DB hits. Long TTL: Better performance but stale data risk. Must be tuned per use case.' },
            { q: 'What is Read-Through vs Write-Through Cache?', a: 'Read-Through: Cache itself loads data from DB on a miss (cache manages the fetch). Write-Through: Application writes to cache and cache writes to DB synchronously. Both simplify application code by making cache responsible for data loading/saving.' },
            { q: 'How to prevent Cache Stampede?', a: 'Techniques: Lock/mutex (only one thread regenerates cache), staggered TTLs (add random jitter), background refresh (pre-warm before expiry), probabilistic early expiration (XFetch algorithm).' }
        ]
    },

    // ═══════════════ STAGE 4: ADVANCED ARCHITECTURE ═══════════════
    {
        id: 'microservices',
        title: 'Microservices & Distributed Systems',
        stage: 'advanced',
        icon: '🚀',
        color: '#f472b6',
        difficulty: 'Hard',
        estimatedTime: '5–6 hours',
        description: 'Service discovery, saga pattern, event-driven architecture, CAP theorem.',
        scenarios: [
            { id: 'scenario-1', title: 'Handling a distributed transaction (Booking Flight + Hotel)', type: 'Saga Pattern' },
            { id: 'scenario-2', title: 'Design a scalable message queue', type: 'Architecture' }
        ],
        flashcards: [
            { q: 'What is the CAP Theorem?', a: 'In a distributed system, you can only guarantee two out of three: Consistency, Availability, Partition Tolerance (usually choose AP or CP).' },
            { q: 'What is the Saga Pattern?', a: 'A sequence of local transactions where each updates data and publishes a message triggering the next step. If one fails, compensating transactions rollback the changes.' },
            { q: 'Choreography vs Orchestration?', a: 'Choreography: Services react to events autonomously. Orchestration: A central controller tells services what to do.' },
            { q: 'What is an API Gateway?', a: 'A server that acts as an API front-end, receives API requests, enforces throttling and security policies, passes requests to the back-end service and then passes the response back to the requester.' },
            { q: 'What is Service Discovery?', a: 'The process of automatically detecting devices and services on a network, essential in microservices where instances scale dynamically (e.g., Consul, Eureka).' },
            { q: 'What is the Circuit Breaker pattern?', a: 'A design pattern used in software development to quickly fail a remote call if a service is down, preventing cascading failures across multiple systems.' },
            { q: 'What is Event-Driven Architecture?', a: 'A software design pattern where the flow of the program is determined by events — messages produced, detected, and consumed. Components communicate via events published to a broker (e.g., Kafka), enabling loose coupling and high scalability.' },
            { q: 'Monolithic vs Microservices Architecture?', a: 'Monolithic: Single deployable unit, simpler to develop/test, but harder to scale and update. Microservices: Independent services with their own databases, scale independently, but add complexity in communication, data consistency, and deployment.' },
            { q: 'What is Eventual Consistency?', a: 'A consistency model where, after an update, all replicas will eventually converge to the same value but may temporarily serve stale data. Trade-off: higher availability vs immediate consistency. Used in NoSQL, DNS, and distributed caches.' },
            { q: 'What is the Strangler Fig Pattern?', a: 'A migration pattern to gradually replace a monolith with microservices. New functionality is built as services while old functionality is "strangled" (redirected) to new services piece by piece. Minimizes risk compared to a big-bang rewrite.' },
            { q: 'What is a Dead Letter Queue?', a: 'A special queue that stores messages that cannot be processed after multiple retry attempts. Prevents message loss, enables debugging, and allows later reprocessing. Used in SQS, RabbitMQ, Kafka.' },
            { q: 'What is Idempotency in distributed systems and why does it matter?', a: 'An operation that produces the same result no matter how many times it\'s executed. Critical because network failures can cause duplicate requests. Implement via idempotency keys, unique request IDs, or database constraints.' },
            { q: 'What is CQRS (Command Query Responsibility Segregation)?', a: 'A pattern that separates read (Query) and write (Command) operations into different models. Write model handles data mutation, read model is optimized for queries. Often combined with Event Sourcing for scalable systems.' },
            { q: 'What is a Sidecar Pattern?', a: 'A pattern where a helper container runs alongside the main application container in the same pod. It handles cross-cutting concerns like logging, monitoring, proxying, and configuration. Used extensively in service meshes (Istio, Envoy).' },
            { q: 'What is Distributed Consensus?', a: 'The process of achieving agreement among distributed nodes on a single data value or action. Algorithms: Raft (understandable, used in etcd), Paxos (theoretical foundation), ZAB (ZooKeeper). Essential for leader election and consistent replication.' }
        ]
    },
    {
        id: 'cloud-computing',
        title: 'Cloud Computing & DevOps',
        stage: 'advanced',
        icon: '☁️',
        color: '#3b82f6',
        difficulty: 'Medium–Hard',
        estimatedTime: '4–6 hours',
        description: 'IaaS vs PaaS vs SaaS, Docker, Kubernetes, CI/CD, and Serverless.',
        scenarios: [
            { id: 'scenario-1', title: 'Deploying a containerized web app to AWS', type: 'Deployment' },
            { id: 'scenario-2', title: 'Designing a zero-downtime deployment pipeline', type: 'CI/CD' }
        ],
        flashcards: [
            { q: 'What is Kubernetes?', a: 'An open-source container orchestration system for automating application deployment, scaling, and management.' },
            { q: 'What is Blue-Green Deployment?', a: 'A deployment strategy where two identical environments run. Traffic routing is flipped from the old (blue) loop to the new (green) loop.' },
            { q: 'What does Serverless actually mean?', a: 'An execution model where the cloud provider dynamically manages the allocation and provisioning of servers (e.g., AWS Lambda).' },
            { q: 'IaaS vs PaaS vs SaaS?', a: 'IaaS: Infrastructure (AWS EC2). PaaS: Platform for dev (Heroku, AWS Elastic Beanstalk). SaaS: Software ready to use (Google Workspace, Dropbox).' },
            { q: 'What is Docker?', a: 'A platform for developers and sysadmins to develop, deploy, and run applications with containers.' },
            { q: 'What is Infrastructure as Code (IaC)?', a: 'The process of managing and provisioning computer data centers through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools (e.g., Terraform).' },
            { q: 'What is CI/CD?', a: 'Continuous Integration: Automatically building and testing code on every commit. Continuous Delivery/Deployment: Automatically deploying tested code to staging or production. Tools: Jenkins, GitHub Actions, GitLab CI.' },
            { q: 'What is Container Orchestration?', a: 'Automating the deployment, management, scaling, and networking of containers. Kubernetes is the standard — it handles service discovery, load balancing, rolling updates, self-healing, and resource management.' },
            { q: 'What is Canary Deployment?', a: 'A deployment strategy where new code is released to a small subset of users first. If no issues are detected, it\'s gradually rolled out to the entire infrastructure. Reduces risk of deploying breaking changes.' },
            { q: 'What is a Microservice vs Serverless function?', a: 'Microservice: Always-running container with full control over runtime, scaling, and dependencies. Serverless: Short-lived function triggered by events, auto-scales to zero, pay-per-invocation. Serverless is cheaper for sporadic workloads; microservices for sustained traffic.' },
            { q: 'What are the differences between Docker Image and Docker Container?', a: 'Image: A read-only template with the application code, dependencies, and OS. Container: A running instance of an image. Multiple containers can be created from one image. Images are built with Dockerfiles.' },
            { q: 'What is Observability vs Monitoring?', a: 'Monitoring: Tracking predefined metrics and alerts (you know what to look for). Observability: Understanding system behavior from its outputs — logs, metrics, traces (you can diagnose unknown unknowns). Three pillars: Logs, Metrics, Traces.' },
            { q: 'What is a Rolling Update vs Recreate Deployment?', a: 'Rolling Update: Gradually replaces old pods with new ones (zero downtime, default in K8s). Recreate: Terminates all old pods before creating new ones (brief downtime but simpler, avoids running two versions simultaneously).' },
            { q: 'What is GitOps?', a: 'An operational framework using Git as the single source of truth for declarative infrastructure and applications. Changes are made via pull requests, automatically applied by tools like ArgoCD/Flux. Benefits: auditability, rollback, and consistency.' },
            { q: 'What is a Dockerfile multi-stage build?', a: 'A technique to create smaller, more secure Docker images. Separate build stages use different base images. The final stage copies only needed artifacts from build stages. Reduces image size by excluding build tools and dependencies.' }
        ]
    },
    {
        id: 'security-cryptography',
        title: 'Security & Cryptography',
        stage: 'cs-fundamentals',
        icon: '🔒',
        color: '#eab308',
        difficulty: 'Medium–Hard',
        estimatedTime: '3–4 hours',
        description: 'Hashing, Encryption (Symmetric/Asymmetric), JWT, OAuth, XSS, CSRF.',
        scenarios: [
            { id: 'scenario-1', title: 'Designing a secure password storage mechanism', type: 'Security' },
            { id: 'scenario-2', title: 'Securing a public REST API', type: 'Authentication' }
        ],
        flashcards: [
            { q: 'Hashing vs Encryption?', a: 'Hashing is one-way (irreversible, used for checking integrity). Encryption is two-way (reversible, used for hiding data).' },
            { q: 'What is a Salt in cryptography?', a: 'Random data added to an input (like a password) before hashing to prevent rainbow table attacks.' },
            { q: 'What is Cross-Site Scripting (XSS)?', a: 'A vulnerability where an attacker injects malicious client-side script into web pages viewed by other users.' },
            { q: 'What is CSRF?', a: 'Cross-Site Request Forgery. An attack that forces an end user to execute unwanted actions on a web application in which they\'re currently authenticated.' },
            { q: 'What is a JWT?', a: 'JSON Web Token. A compact, URL-safe means of representing claims to be transferred between two parties. Used for stateless authentication.' },
            { q: 'Symmetric vs Asymmetric Encryption?', a: 'Symmetric uses the same key for encryption and decryption. Asymmetric uses a public key to encrypt and a private key to decrypt.' },
            { q: 'What is SQL Injection and how to prevent it?', a: 'An attack where malicious SQL is injected through user input to manipulate the database. Prevention: Parameterized queries/prepared statements, input validation, ORM usage, least privilege DB access.' },
            { q: 'What is the difference between Authentication and Authorization?', a: 'Authentication: Verifying who the user is (login with credentials). Authorization: Verifying what the user has permission to do (role-based access control). Auth happens first, then authorization.' },
            { q: 'What is HTTPS/TLS Handshake?', a: 'Step 1: Client Hello (supported ciphers). Step 2: Server Hello + Certificate. Step 3: Client verifies certificate, generates session key, encrypts with server\'s public key. Step 4: Both sides use session key for symmetric encryption. All subsequent data is encrypted.' },
            { q: 'What is the difference between Session-based and Token-based Authentication?', a: 'Session-based: Server stores session data, client gets session ID in cookie. Stateful. Token-based: Server issues JWT token, client sends it in headers. Stateless and scalable — preferred for APIs and SPAs.' },
            { q: 'What is OWASP Top 10?', a: 'Top 10 web application security risks: Injection, Broken Auth, Sensitive Data Exposure, XXE, Broken Access Control, Misconfig, XSS, Insecure Deserialization, Vulnerable Components, Insufficient Logging.' },
            { q: 'What is Rate Limiting used for in security?', a: 'Prevents brute-force attacks, credential stuffing, DDoS, and API abuse. Limits the number of requests per IP/user in a time window. Combined with CAPTCHA and account lockout for defense-in-depth.' },
            { q: 'What is a Man-in-the-Middle (MITM) Attack?', a: 'An attack where the attacker secretly intercepts and relays communication between two parties. Prevention: HTTPS/TLS, certificate pinning, HSTS headers, public key infrastructure (PKI).' },
            { q: 'What is RBAC (Role-Based Access Control)?', a: 'An access control model where permissions are assigned to roles, and users are assigned to roles. More scalable than per-user permissions. Example: Admin, Editor, Viewer roles with different permissions. Used in K8s, cloud platforms, and applications.' },
            { q: 'What is CORS and how to configure it securely?', a: 'Cross-Origin Resource Sharing controls which domains can access your API. Secure configuration: Whitelist specific origins (never use *), allow only needed HTTP methods, set proper headers (Access-Control-Allow-Origin, Allow-Methods, Allow-Headers).' }
        ]
    },
    {
        id: 'frontend-architecture',
        title: 'Frontend Architecture',
        stage: 'web-dev',
        icon: '🎨',
        color: '#ec4899',
        difficulty: 'Medium',
        estimatedTime: '4–5 hours',
        description: 'DOM, Browser Rendering, Virtual DOM, State Management, Web Vitals.',
        scenarios: [
            { id: 'scenario-1', title: 'Optimizing a slow, laggy React application', type: 'Performance' },
            { id: 'scenario-2', title: 'Designing the architecture for an infinite-scrolling feed', type: 'System Design' }
        ],
        flashcards: [
            { q: 'What are Core Web Vitals?', a: 'Metrics representing user experience: LCP (Loading), FID (Interactivity), CLS (Visual Stability).' },
            { q: 'What is debouncing vs throttling?', a: 'Debounce: Execute after wait time of no events. Throttle: Execute at most once per wait time.' },
            { q: 'What is the Virtual DOM?', a: 'A lightweight JavaScript representation of the DOM. UI libraries use it to calculate the minimal DOM operations needed to update the UI.' },
            { q: 'What is Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)?', a: 'SSR: The server generates the full HTML page. CSR: The browser downloads a minimal HTML page and JS renders the complete UI dynamically.' },
            { q: 'What is a Service Worker?', a: 'A script that your browser runs in the background, separate from a web page, enabling features that don\'t need a web page or user interaction, like push notifications and background sync.' },
            { q: 'What is Webpack / Bundling?', a: 'A module bundler. Its main purpose is to bundle JavaScript files for usage in a browser, but it is also capable of transforming, bundling, or packaging just about any resource or asset.' },
            { q: 'What is the difference between localStorage, sessionStorage, and cookies?', a: 'localStorage: Persists until manually cleared (~5-10MB). sessionStorage: Cleared when the tab closes (~5MB). Cookies: Sent with every HTTP request, have expiration, limited to ~4KB. Used for server-side session tracking.' },
            { q: 'What is Lazy Loading in web development?', a: 'A technique to defer loading non-critical resources at page load time. Images, components, or modules are loaded only when they enter the viewport or are needed. Improves initial load time and reduces bandwidth.' },
            { q: 'Explain the Event Loop in JavaScript.', a: 'JavaScript is single-threaded. The Event Loop continuously checks the Call Stack and the Callback Queue. When the stack is empty, it picks the first task from the queue and pushes it to the stack. Microtasks (Promises) have priority over Macrotasks (setTimeout).' },
            { q: 'What is Hydration in React/Next.js?', a: 'The process of attaching event listeners and making server-rendered HTML interactive on the client side. Server sends static HTML (fast), then React "hydrates" it by attaching state and event handlers without re-rendering the DOM.' },
            { q: 'What are React Hooks and why were they introduced?', a: 'Functions that let you use state and lifecycle features in functional components. useState for state, useEffect for side effects, useContext for context, useMemo/useCallback for optimization. Eliminated the need for class components.' },
            { q: 'What is Code Splitting and Tree Shaking?', a: 'Code Splitting: Breaking the bundle into smaller chunks loaded on demand (React.lazy, dynamic imports). Tree Shaking: Removing unused code during bundling (dead code elimination). Both reduce bundle size and improve load time.' },
            { q: 'What is Cross-Browser Compatibility and how to ensure it?', a: 'Ensuring your website works consistently across different browsers (Chrome, Firefox, Safari, Edge). Use CSS resets/normalizers, feature detection (not browser detection), polyfills, testing tools (BrowserStack), and progressive enhancement.' },
            { q: 'What is Progressive Web App (PWA)?', a: 'A web app that uses modern web technologies to deliver native-like experiences. Features: offline support (Service Workers), installable (Web App Manifest), push notifications, fast loading. Bridges the gap between web and native apps.' },
            { q: 'What is the Critical Rendering Path?', a: 'The sequence of steps the browser takes to convert HTML, CSS, and JS into pixels: Parse HTML → Build DOM → Parse CSS → Build CSSOM → Construct Render Tree → Layout → Paint → Composite. Optimizing this path improves first paint time.' },
            { q: 'What is React Reconciliation?', a: 'React\'s algorithm for updating the DOM efficiently. It compares the new Virtual DOM with the previous one (diffing), identifies changes, and applies minimal updates. Uses heuristics: different types → full replace, same type → update props, keys help identify moved elements.' },
            { q: 'What is Micro-Frontend Architecture?', a: 'An architectural pattern where a frontend application is decomposed into smaller, independent apps owned by different teams. Each micro-frontend can use different frameworks. Composition via iframes, Web Components, Module Federation, or runtime integration.' },
            { q: 'What is CORS Preflight Request?', a: 'An automatic OPTIONS request the browser sends before certain cross-origin requests (non-simple: PUT, DELETE, custom headers). The server responds with allowed methods/headers. If approved, the actual request is sent. Caching preflight with Access-Control-Max-Age reduces overhead.' }
        ]
    }
];

export const getTechnicalTopicIds = () => TECHNICAL_TOPICS.map(t => t.id);
export const getTechnicalTopicsByStage = (stageId) => TECHNICAL_TOPICS.filter(t => t.stage === stageId);
