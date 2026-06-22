export const TECHNICAL_THEORY = {
    'dbms': {
        title: 'Database Management Systems Deep Dive',
        sections: [
            {
                title: 'ACID Properties Breakdown',
                content: `ACID is a set of properties of database transactions intended to guarantee data validity despite errors, power failures, and other mishaps.\n\n- **Atomicity:** Transactions are all or nothing.\n- **Consistency:** Only valid data is saved.\n- **Isolation:** Concurrent transactions don't affect each other.\n- **Durability:** Committed data is saved permanently.`,
                diagram: `Atomicity ──> All or Nothing\nConsistency ──> Valid State\nIsolation ──> Concurrency Control\nDurability ──> Persistent Storage`,
            },
            {
                title: 'Database Normalization',
                content: `Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.\n\n- **1NF:** No repeating groups, atomic values.\n- **2NF:** 1NF + no partial dependencies.\n- **3NF:** 2NF + no transitive dependencies.\n- **BCNF:** Stricter version of 3NF.`,
                diagram: `Raw Data ──(1NF)──> Atomic Values ──(2NF)──> Full Dependency ──(3NF)──> No Transitive Dep`,
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Designing an E-commerce Schema',
                context: 'You are designing the database for an e-commerce platform like Amazon.',
                steps: [
                    'Identify Entities: Users, Products, Orders, Categories.',
                    'Define Relationships: 1-to-N (User -> Orders), M-to-N (Orders <-> Products).',
                    'Optimize for Reads: Add appropriate indexes on Product(category_id) and Order(user_id).',
                    'Handle Concurrency: Use appropriate isolation levels when updating inventory during checkout.'
                ]
            },
            {
                id: 'scenario-2',
                title: 'High Concurrency Inventory Update',
                context: 'Multiple users trying to buy the last item in stock.',
                steps: [
                    'Optimistic Concurrency Control: Read item, get version. Update if version unchanged.',
                    'Pessimistic Locking: SELECT ... FOR UPDATE. Locks the row until transaction completes.',
                    'Tradeoffs: OCC is better for read-heavy workloads. Pessimistic is better when contention is high.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'Can you explain the difference between a clustered and non-clustered index?',
                answer: 'A clustered index physically sorts the data rows in a table based on the index key. Therefore, a table can only have one clustered index. It is extremely fast for range queries. A non-clustered index, on the other hand, contains pointers to the actual data rows rather than storing the data itself. You can have multiple non-clustered indexes on a table. If a query requests data not in the non-clustered index, a "bookmark lookup" occurs to fetch the rest of the row from the clustered index.',
                analysis: 'Clearly defines both concepts, contrasts their physical structures, and notes the limitation (1 vs many) as well as the performance implication (bookmark lookups).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is a database transaction and what are ACID properties?',
                answer: 'A transaction is a single logic unit of work that contains one or more database operations. ACID stands for Atomicity (all operations succeed or all fail), Consistency (the database must remain in a valid state), Isolation (concurrent transactions do not interfere with each other), and Durability (once committed, changes are permanent, even after a crash). These guarantee data reliability in critical systems like banking.',
                analysis: 'Provides a clear, textbook definition of a transaction and then breaks down the ACID acronym flawlessly with brief, accurate descriptions of each letter.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'When would you use a NoSQL database over a relational database?',
                answer: 'I would choose NoSQL when dealing with highly unstructured or rapidly changing data schemas, or when the system requires massive horizontal scalability and high write throughput (like logging systems or real-time analytics). I would stick to Relational DBs when the data is highly structured, strongly connected with complex joins, and requires strict ACID compliance for transactional integrity.',
                analysis: 'Demonstrates architectural maturity by contrasting the strengths of NoSQL (scale, unstructured data) with the strengths of RDBMS (relational integrity, ACID), rather than just saying "NoSQL is faster".',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'os': {
        title: 'Operating Systems Deep Dive',
        sections: [
            {
                title: 'Processes vs Threads',
                content: `A **process** is an instance of a computer program that is being executed. A **thread** of execution is the smallest sequence of programmed instructions that can be managed independently by a scheduler.\n\nKey differences: Processes have isolated memory; threads share memory. Context switching is faster for threads.`,
                diagram: `Process\n├── Thread 1 (Stack, Registers)\n├── Thread 2 (Stack, Registers)\n└── Shared Memory (Heap, Code, Data)`,
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Resolving a banking deadlock',
                context: 'Two transfers happen simultaneously: A to B and B to A. They acquire locks in reverse order, causing a deadlock.',
                steps: [
                    'Understand: Both are waiting for locks held by each other.',
                    'Solution: Impose a strict, global lock acquisition order (e.g., always lock the smaller account ID first).'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'What is a race condition and how do you prevent it?',
                answer: 'A race condition occurs when two or more threads attempt to access and modify shared data simultaneously, leading to unpredictable results depending on the exact timing of thread execution. To prevent it, we use synchronization primitives like Mutexes (Mutual Exclusion locks) or Semaphores to ensure that only one thread can execute the critical section of code at a time. Alternatively, we can use thread-safe atomic variables or design the system using message passing (like Go channels) to avoid shared mutable state entirely.',
                analysis: 'Explains the concept simply, provides standard solutions (mutexes), and offers modern, highly scalable alternatives (atomic variables, message passing).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain the difference between a process and a thread.',
                answer: 'A process is an independent program in execution with its own isolated memory space. Creating and context-switching between processes is "heavy" and expensive. A thread is a smaller execution unit within a process. Multiple threads within the same process share the same memory space (heap) and resources, making context-switching between them much "lighter" and faster, but requiring careful synchronization to avoid data corruption.',
                analysis: 'Clearly highlights the fundamental difference: memory isolation (processes) vs shared memory (threads), linking this directly to the performance cost of context switching.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is a deadlock and what are the four necessary conditions for it to occur?',
                answer: 'A deadlock is a situation where two or more threads are blocked forever, waiting for each other to release resources. For it to happen, four Coffman conditions must be met simultaneously: 1. Mutual Exclusion (resources cannot be shared), 2. Hold and Wait (a thread holds a resource while waiting for another), 3. No Preemption (resources cannot be forcibly taken away), and 4. Circular Wait (a chain of threads waiting on each other). Preventing deadlock involves breaking any one of these conditions, usually Circular Wait by enforcing a strict global lock acquisition order.',
                analysis: 'An academically rigorous answer that lists the four Coffman conditions precisely, and then immediately pivots to practical application by explaining how to prevent it (lock ordering).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'networks': {
        title: 'Computer Networks Deep Dive',
        sections: [
            {
                title: 'OSI vs TCP/IP',
                content: `The OSI model is a conceptual model that characterizes and standardizes the communication functions of a telecommunication or computing system without regard to its underlying internal structure and technology. TCP/IP is the practical implementation used on the Internet.`,
                diagram: `OSI                TCP/IP\nApplication ────── Application\nPresentation\nSession\nTransport ──────── Transport\nNetwork ────────── Internet\nData Link ──────── Network Access\nPhysical`,
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'What happens when you type google.com?',
                context: 'Tracing the journey of a web request.',
                steps: [
                    'DNS Lookup: Browser checks cache, OS cache, router, ISP DNS, then iterative DNS query.',
                    'TCP Handshake: SYN, SYN-ACK, ACK.',
                    'TLS Handshake: if HTTPS, negotiate encryption.',
                    'HTTP Request/Response: Send GET, receive HTML/CSS/JS.',
                    'Browser Rendering: Construct DOM, CSSOM, Render Tree, Paint.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'Explain the difference between TCP and UDP.',
                answer: 'TCP (Transmission Control Protocol) is a connection-oriented protocol that guarantees delivery, order, and error-checking of data packets. It uses a three-way handshake to establish a connection, making it reliable but slower. It is ideal for HTTP, SSH, and file transfers. UDP (User Datagram Protocol) is a connectionless protocol. It simply sends packets without verifying if they arrived or in what order. It is much faster but inherently unreliable, making it ideal for real-time video streaming, VoIP, or multiplayer gaming where dropping a frame is better than waiting for it to be retransmitted.',
                analysis: 'Categorizes both by reliability, connection-state, and speed, and maps them to perfect real-world use cases.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What happens when you type a URL into a browser?',
                answer: 'First, the browser checks its cache, the OS cache, and then performs a DNS lookup to translate the domain name into an IP address. Next, it establishes a TCP connection using a three-way handshake, followed by a TLS handshake if it\'s HTTPS to secure the connection. The browser then sends an HTTP GET request to the server. The server processes the request and sends back an HTTP response containing HTML. Finally, the browser parses the HTML, constructs the DOM and CSSOM trees, builds the render tree, and paints the pixels to the screen.',
                analysis: 'Provides a highly structured, step-by-step summary of one of the most common and complex full-stack interview questions.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain how symmetric and asymmetric encryption work in HTTPS.',
                answer: 'HTTPS uses both to achieve speed and security. Asymmetric encryption uses a public and private key pair. It is highly secure but computationally slow. During the TLS handshake, asymmetric encryption is used solely to securely exchange a "session key" between the client and server. Once both sides have this shared session key, they switch to Symmetric encryption (where the same key is used to encrypt and decrypt). Symmetric encryption is incredibly fast, allowing for quick transfer of the actual website data.',
                analysis: 'Demonstrates a deep understanding of why both algorithms are needed in tandem: using asymmetric for the initial secure handshake, and symmetric for the fast data transmission.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'oops': {
        title: 'Object-Oriented Programming Deep Dive',
        sections: [
            {
                title: 'The Four Pillars',
                content: `1. **Encapsulation:** Binding data and methods, hiding internal state.\n2. **Abstraction:** Exposing only necessary implementation details.\n3. **Inheritance:** Deriving new classes from existing ones.\n4. **Polymorphism:** The ability to present the same interface for differing underlying forms.`,
                diagram: `Animal (Abstract)\n├── Dog : Animal (Inheritance, Overriding speak())\n└── Cat : Animal (Inheritance, Overriding speak())`,
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Designing a Parking Lot',
                context: 'Low-level design of a standard parking lot.',
                steps: [
                    'Entities: ParkingLot, ParkingFloor, ParkingSpot, Vehicle, Ticket.',
                    'Enums: VehicleType (Compact, Large, Bike), SpotType.',
                    'Logic: Assign a spot based on VehicleType, generate Ticket. On exit, calculate fee based on time.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'What is Composition over Inheritance?',
                answer: 'Inheritance implies an "is-a" relationship (e.g., a Dog *is an* Animal), which can lead to brittle, deeply nested class hierarchies. If requirements change, changing a base class breaks all subclasses. Composition implies a "has-a" relationship (e.g., a Car *has an* Engine). It promotes building complex objects by assembling smaller, interchangeable, and easily testable components (interfaces/traits) rather than inheriting behaviors. It leads to far more flexible and maintainable codebases.',
                analysis: 'Explains the core definitions, pinpoints the fatal flaw of inheritance, and clearly articulates why composition makes code architecture more resilient.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain the SOLID principles briefly.',
                answer: 'Single Responsibility means a class should only have one reason to change. Open-Closed means classes should be open for extension but closed for modification. Liskov Substitution means subclasses must be swappable for their base classes without breaking the program. Interface Segregation means clients shouldn\'t be forced to depend on methods they do not use (prefer small, specific interfaces). Dependency Inversion means high-level modules should depend on abstractions (interfaces), not concrete implementations.',
                analysis: 'Provides extremely concise, one-sentence definitions of 5 highly complex architectural principles.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is Polymorphism and how is it useful?',
                answer: 'Polymorphism translates to "many forms." It allows objects of different classes to be treated as instances of the same class through a common interface. For example, a drawing application might have an array of Shape objects, each implementing a `draw()` method. We can iterate through the array calling `shape.draw()` without needing to know if the object is actually a Circle, Square, or Triangle. This eliminates massive switch statements and makes adding new shapes incredibly easy and safe.',
                analysis: 'Provides the technical definition, but immediately grounds it in a practical, easy-to-understand real-world example (the drawing app) to show *why* it is useful.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'sysdesign-basics': {
        title: 'System Design Basics Deep Dive',
        sections: [
            {
                title: 'Scaling 101',
                content: `As traffic grows, systems must scale.\n\n**Vertical Scaling (Scale Up):** Buying a bigger machine (more RAM, CPU). Easy but has a hard limit and a single point of failure.\n\n**Horizontal Scaling (Scale Out):** Adding more machines to a cluster. Requires a load balancer, stateless application servers, and distributed databases.`,
                diagram: `User ──> Load Balancer\n          ├── App Server 1\n          ├── App Server 2\n          └── App Server 3`,
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Scaling from 0 to Millions of Users',
                context: 'Evolving an architecture as it grows.',
                steps: [
                    'Single Server: Run web app, DB, and cache on one box.',
                    'Database Separation: Move DB to its own server to isolate resources.',
                    'Horizontal Scaling: Add a Load Balancer and multiple stateless web servers.',
                    'Caching: Add Redis/Memcached to reduce DB load.',
                    'CDN: Serve static assets from edge locations.',
                    'Database Scaling: Read replicas, shading, partitioning.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'How would you design a URL shortener like bit.ly?',
                answer: 'I would start with a REST API gateway pointing to stateless app servers. When a long URL arrives, I would generate a unique 7-character base-62 hash. To prevent hash collisions in a distributed system, I\'d use a centralized counter like Snowflake or ZooKeeper to generate a unique ID, then encode it to base-62. I\'d store the mapping in a NoSQL DB like DynamoDB for high read/write throughput. Finally, I\'d put Redis in front of the DB to cache the top 20% of most accessed URLs (Pareto principle), ensuring sub-10ms redirection.',
                analysis: 'Demonstrates end-to-end thinking: defines the API, addresses the critical collision problem, chooses the right DB, and optimizes speed with a cache.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is the purpose of a Load Balancer?',
                answer: 'A Load Balancer sits in front of a cluster of servers and distributes incoming network traffic across them. This prevents any single server from becoming a bottleneck, improving overall application responsiveness. It also increases reliability: through continuous "health checks," if a server goes down, the load balancer stops sending traffic to it and safely routes user requests to the remaining healthy servers.',
                analysis: 'Addresses both performance (preventing bottlenecks) and reliability (health checks/failover) aspects of load balancing.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain CAP Theorem.',
                answer: 'CAP theorem states that a distributed data store can only simultaneously provide two of three guarantees: Consistency (every read receives the most recent write), Availability (every request receives a non-error response, without guarantee that it contains the most recent write), and Partition Tolerance (the system continues to operate despite network failures dropping messages between nodes). Because network partitions (P) are inevitable in the real world, you must essentially always choose between prioritizing Consistency (CP - like banking databases) or Availability (AP - like social media feeds).',
                analysis: 'Accurately defines all three terms and shows deep understanding of the practical reality: Partition Tolerance is a given, so the real engineering choice is just C vs A.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'data-structures': {
        title: 'Data Structures Deep Dive',
        sections: [
            {
                title: 'Choosing the Right Structure',
                content: `Choosing the correct data structure is the root of an efficient algorithm.\n\n- **Arrays:** O(1) access by index. O(n) insert/delete.\n- **Linked Lists:** O(1) insert/delete at known node. O(n) search.\n- **Hash Maps:** O(1) average search/insert. Used for caching, counting, lookups.\n- **Trees/Graphs:** Hierarchical data, routing, relationships.\n- **Heaps (Priority Queue):** Finding min/max dynamically in O(log n).`,
                diagram: `Hash Map Collision Resolution\nKeys ─(Hash Function)─> Index\nIndex 3: [ "Alice" ] -> [ "Bob" ] (Chaining)`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Implementing a Twitter Timeline',
                context: 'You need to quickly merge tweets from hundreds of accounts a user follows, sorted by time.',
                steps: [
                    'Approach 1 (Naive): Fetch all tweets, sort them in memory. O(N log N) where N is total tweets. Too slow.',
                    'Approach 2 (K-Way Merge): Each user\'s timeline is already sorted. We have K sorted arrays. Use a Min-Heap of size K.',
                    'Extract min from heap, add to result, and insert next element from the same user\'s timeline into the heap. O(N log K) time.'
                ]
            },
            {
                id: 'scenario-2',
                title: 'Building a search autocomplete system',
                context: 'As the user types "cat", suggest "cat", "catch", "caterpillar" based on prefix.',
                steps: [
                    'Data Structure: A Trie (Prefix Tree).',
                    'Each node stores a character. A path from root represents a prefix.',
                    'To optimize retrieval, each node can store the top 5 most popular words that pass through it, avoiding full subtree traversal.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'When would you use a LinkedList over an Array?',
                answer: 'I would use a Linked List when the application requires frequent insertions or deletions at both ends or in the middle of the dataset, because shifting elements in an Array is O(N), whereas pointer reassignment in a Linked List is O(1) if you have the node reference. Alternatively, Arrays are strictly better when the application is read-heavy and requires frequent random access via an index, because Arrays operate in O(1) time utilizing CPU cache locality, whereas Linked Lists require O(N) traversal.',
                analysis: 'Clearly defines the Big-O tradeoffs for insertions vs reads, and earns bonus points for mentioning CPU cache locality, a true mark of a senior engineer.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain how a Hash Map works under the hood.',
                answer: 'A Hash Map is essentially an array of linked lists (or trees). When you insert a key-value pair, the key is passed through a hashing function which spits out an integer. We modulo that integer by the array size to get an index, and store the value there. If two different keys hash to the same index (a collision), we simply append the new value to the linked list at that index. This gives us O(1) average time complexity for both inserts and lookups.',
                analysis: 'Demystifies the "magic" of O(1) lookups by explaining the underlying array structure, the hashing function, and collision resolution via chaining.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is a Trie and what are its standard use cases?',
                answer: 'A Trie, or prefix tree, is a specialized tree data structure used to store associative arrays where the keys are usually strings. Unlike a binary search tree, no node in the tree stores the key associated with that node; instead, its position in the tree defines the key with which it is associated. Tries are perfectly optimized for prefix-matching operations. I would use them for building search autocomplete systems, spell checkers, or IP routing tables.',
                analysis: 'Provides a clear definition of the structure (nodes represent characters, paths represent strings) and gives three excellent, industry-standard use cases.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'algorithms': {
        title: 'Algorithms Deep Dive',
        sections: [
            {
                title: 'Dynamic Programming vs Greed',
                content: `**Greedy:** Makes the locally optimal choice at each step hoping to find the global optimum. Fast, but doesn't always work (e.g., Coin Change with weird denominations).\n\n**Dynamic Programming:** Explores all possibilities but avoids redundant work by storing results of subproblems. Requires Optimal Substructure and Overlapping Subproblems.`,
                diagram: `Fibonacci (DP Memoization)\nFib(5)\n├── Fib(4)\n│   ├── Fib(3)\n│   └── Fib(2) (Computed once, cached)\n└── Fib(3) (Read from cache!)`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-2',
                title: 'Optimizing resource allocation (0/1 Knapsack)',
                context: 'Given a set of items with weights and values, maximize value in a knapsack of capacity W.',
                steps: [
                    'Identify: Is it DP? Yes, choices (include or exclude) and constraints (capacity).',
                    'State: dp[i][w] = max value using first i items with capacity w.',
                    'Transition: dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w-wt[i]]).',
                    'Space Optimization: Only need the previous row, so space can be O(W).'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'How do you know when to use Dynamic Programming vs a Greedy approach?',
                answer: 'A Greedy algorithm makes the locally optimal choice at every step, hoping it leads to a global optimum. It is fast but cannot backtrack. Dynamic Programming explores all valid possibilities by breaking the problem into subproblems, saving the results to avoid redundant work (memoization/tabulation). You must use DP if the problem has "overlapping subproblems" and "optimal substructure", but a greedy choice might lock you out of the true optimal branch (like the Coin Change problem with weird denominations).',
                analysis: 'Succinctly compares the two paradigms, explicitly names the two mathematical requirements for DP, and provides a classic example of where Greedy fails.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain the difference between BFS and DFS.',
                answer: 'Breadth-First Search (BFS) explores a graph level by level, radiating outward from the starting node. It uses a Queue and is guaranteed to find the shortest path in an unweighted graph. Depth-First Search (DFS) dives as deep as possible down one branch before backtracking. It uses a Stack (or recursion). DFS is generally more memory-efficient than BFS for deep, sparse trees, and is ideal for topological sorting or cycle detection.',
                analysis: 'Contrasts the two traversal methods not just by their definitions, but by the underlying data structures they use (Queue vs Stack) and their ideal use cases (Shortest Path vs Cycle Detection).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'When would you use QuickSort over MergeSort?',
                answer: 'MergeSort guarantees O(N log N) worst-case time complexity and is a stable sort, but requires O(N) auxiliary memory, making it ideal for sorting Linked Lists or massive datasets that don\'t fit in RAM. QuickSort has a worst-case of O(N^2) if you pick a bad pivot, but its average case is O(N log N). Crucially, QuickSort operates in-place, requiring only O(log N) memory for the call stack, and is highly optimized for CPU caching. Therefore, for most in-memory array sorting, QuickSort is drastically faster in the real world.',
                analysis: 'A phenomenal answer. It acknowledges the theoretical weakness of QuickSort (O(N^2) worst case) but explains why it is still the industry standard for array sorting (in-place memory, CPU cache).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'api-design': {
        title: 'API Design Deep Dive',
        sections: [
            {
                title: 'REST vs GraphQL vs gRPC',
                content: `**REST:** Standard, stateless, uses HTTP verbs (GET, POST, PUT, DELETE). Best for public-facing, simple integrations.\n\n**GraphQL:** Client specifies exactly what it needs. Prevents over-fetching and under-fetching. Great for complex frontend applications.\n\n**gRPC:** Uses Protocol Buffers and HTTP/2. Binary, fast, strict typing. Excellent for internal microservice-to-microservice communication.`,
                diagram: `REST: GET /users/1/posts -> [ {id: 1, title: '...'} ]\nGraphQL: POST { user(id: 1) { posts { title } } }`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Designing an API for a ride-sharing app',
                context: 'Need an API for drivers to update their location rapidly and riders to request rides.',
                steps: [
                    'Driver Location: REST is too heavy for every 3 seconds. Use WebSockets or gRPC streams for telemetry.',
                    'Rider Request: POST /v1/rides. Idempotency key in header to prevent double booking if net drops.',
                    'Polling vs Push: Rider app uses Server-Sent Events (SSE) or WebSockets to get ride status updates without polling GET /rides/123.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'Why would you choose GraphQL over REST?',
                answer: 'I would choose GraphQL when building an application with complex, highly relational data where clients have varying data needs. In REST, clients often suffer from "over-fetching" (getting massive payloads when they only need a username) or "under-fetching" (making 5 sequential requests to load a profile page). GraphQL solves this by exposing a single endpoint where the client queries exactly the shape and size of the data it wants. However, I would stick to REST for simple CRUD APIs, binary uploads, or when strict HTTP layer caching is required.',
                analysis: 'Nails the core problem GraphQL solves (over/under-fetching), but crucially shows maturity by acknowledging its weaknesses (caching, binary data) and when REST is still superior.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain what Idempotency means in REST API design.',
                answer: 'An API endpoint is idempotent if making the same exact request multiple times produces the same result on the server as making it just once. For example, a GET request is naturally idempotent. A PUT request (e.g., PUT /user/1 {name: "John"}) is also idempotent because executing it 100 times still leaves the name as "John". However, a POST request (e.g., POST /checkout) is NOT idempotent, because clicking the button twice might charge the user twice. To fix this, we pass an Idempotency-Key in the header so the server knows to ignore duplicate POST requests.',
                analysis: 'Defines the term clearly, gives examples of which HTTP verbs are naturally idempotent, and explains how to enforce it on verbs that aren\'t (Idempotency Keys).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you handle pagination in a high-traffic API?',
                answer: 'Offset pagination (e.g., `LIMIT 10 OFFSET 50000`) is terrible for performance at scale because the database still has to scan and discard the first 50,000 rows. Instead, I use Cursor-based pagination (e.g., `WHERE id > last_seen_id LIMIT 10`). This allows the database to instantly jump to the correct row using an index, rendering the query in O(1) time regardless of how deep the user scrolls. The only drawback is that you cannot jump to a specific page number.',
                analysis: 'Identifies the fatal flaw in standard offset pagination (database scanning) and proposes the industry-standard scalable solution (cursor pagination).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'caching-strategies': {
        title: 'Caching Strategies Deep Dive',
        sections: [
            {
                title: 'Cache Invalidation & Stampedes',
                content: `**Invalidation is hard.** Strategies:\n- **TTL (Time to Live):** Data expires after X seconds.\n- **Eviction:** LRU/LFU when cache is full.\n- **Active Invalidation:** App deletes cache key when DB updates.\n\n**Cache Stampede:** When a highly accessed key expires, thousands of threads hit the DB simultaneously. Solve with locking or probabilistic early expiration.`,
                diagram: `User -> Cache Miss -> Lock Key -> Fetch DB -> Update Cache -> Unlock\nOther Users -> Cache Miss -> See Lock -> Sleep 50ms, Retry`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Caching the home feed of Instagram',
                context: 'Users want instant load times for their feed.',
                steps: [
                    'Pre-computation (Push Model): For active users, as soon as a followed account posts, push the post ID into their Redis timeline list.',
                    'Read (Pull Model): For celebrities (millions of followers), pushing to millions of lists is too slow (Fan-out problem).',
                    'Hybrid: Pull celeb posts on read, merge with pre-computed push feed from normal users.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'What is a Cache Stampede and how do you prevent it?',
                answer: 'A cache stampede occurs when a highly accessed, compute-heavy piece of data expires in the cache. Suddenly, thousands of concurrent requests miss the cache and all hit the database at the exact same time to recompute the data, causing a DB meltdown. I prevent this using "mutual exclusion locking": when a cache miss occurs, the first thread acquires a distributed lock in Redis to fetch the data. If other threads miss the cache and see the lock, they simply sleep for 50ms and check the cache again.',
                analysis: 'Identifies the catastrophic edge-case of caching, and provides exactly the right distributed locking algorithm to solve it.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain Cache Eviction Policies, and which one you use most often.',
                answer: 'When a cache reaches its memory limit, it must evict old data to make room for new data. The most common policy is LRU (Least Recently Used), which evicts the item that hasn\'t been accessed for the longest period of time. There is also LFU (Least Frequently Used), which evicts items with the lowest hit count. I use LRU 95% of the time, as it naturally accommodates "trending" data where recent access is the best predictor of future access.',
                analysis: 'Defines the problem, lists the two major algorithms, and makes a definitive, well-reasoned choice (LRU) for practical application.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is the difference between Write-Through and Write-Behind caching?',
                answer: 'In a Write-Through cache, the application synchronously writes data to both the cache and the underlying database before returning success to the user. This guarantees data consistency but adds latency to every write operation. In a Write-Behind (Write-Back) cache, the application writes only to the cache and immediately returns success. The cache then asynchronously writes the data to the database in the background. Write-Behind is much faster for write-heavy workloads (like view counters), but risks data loss if the cache server crashes before flushing to the DB.',
                analysis: 'Perfectly contrasts the two write strategies based on their tradeoffs: Consistency vs Latency/Risk.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'microservices': {
        title: 'Microservices & Distributed Systems Deep Dive',
        sections: [
            {
                title: 'The CAP Theorem & Event Sourcing',
                content: `Microservices mean distributed data.\n\n**CAP Theorem:** Consistency, Availability, Partition Tolerance. Networks fail (P is given), so you choose C (wait for sync) or A (return stale data).\n\n**Event Sourcing:** Instead of storing just the current state, store a log of all events (e.g., OrderPlaced, PaymentProcessed, OrderShipped). You can reconstruct state at any time.`,
                diagram: `Monolith: Central DB (ACID)\nMicroservices: Service A DB <-> Network <-> Service B DB (Eventual Consistency)`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Handling a distributed transaction (Booking Flight + Hotel)',
                context: 'You charge the user\'s card, book the flight, but the hotel booking fails. You must rollback.',
                steps: [
                    'No 2-Phase Commit (too slow). Use the **Saga Pattern**.',
                    'Step 1: Orchestrator calls PaymentService (Success).',
                    'Step 2: Orchestrator calls FlightService (Success).',
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'What are the main drawbacks of moving from a Monolith to Microservices?',
                answer: 'Microservices introduce intense distributed system complexity. You lose ACID database guarantees across services, forcing you into complex Eventual Consistency models like the Saga pattern. You must suddenly handle network latency, partial service failures, and distributed tracing. Additionally, operational overhead skyrockets: you now need Docker, Kubernetes, CI/CD pipelines per service, and sophisticated API gateways. I only recommend microservices when organizational scaling requires independent team deployments, not just for technical "purity".',
                analysis: 'Shows high architectural maturity. Junior engineers love microservices; senior engineers fear them and only use them to solve organizational bottlenecks.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do microservices communicate with each other?',
                answer: 'They communicate either synchronously or asynchronously. Synchronously, we use REST over HTTP or, for higher performance, gRPC which uses Protocol Buffers over HTTP/2. This is best when the calling service absolutely needs an immediate response. Asynchronously, we use message brokers like Kafka or RabbitMQ. The calling service publishes an event and immediately returns, while other services consume that event at their own pace. This loose coupling prevents cascading failures and is vital for highly resilient systems.',
                analysis: 'Classifies communication into synchronous vs asynchronous, lists the industry-standard tools for both, and explains the resilience benefit of message queues.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is an API Gateway and why is it needed in a microservice architecture?',
                answer: 'An API Gateway sits between the client applications and the internal microservices. Instead of a mobile app making 10 separate HTTP requests to 10 different internal services (which is terrible for battery life and latency), it makes one request to the Gateway. The Gateway routes the request, aggregates data from multiple services, and strips out internal data before returning the payload. It also centralizes cross-cutting concerns like SSL termination, rate limiting, and JWT authentication.',
                analysis: 'Clearly explains the "Backend-for-Frontend" aggregate pattern, and lists the critical operational benefits (SSL, Auth) of centralizing entry traffic.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'cloud-computing': {
        title: 'Cloud Computing & DevOps Deep Dive',
        sections: [
            {
                title: 'Containers vs Virtual Machines',
                content: `**Virtual Machines (VMs):** Emulate a full computer system, including the OS. Heavyweight, slow to start, but offer strong isolation.\n\n**Containers (Docker):** Share the host OS kernel but isolate application processes. Lightweight, start in milliseconds, portably run anywhere.`,
                diagram: `VM: Infrastructure -> Hypervisor -> Guest OS -> App\nContainer: Infrastructure -> OS -> Container Engine -> App`
            },
            {
                title: 'CI/CD Pipelines',
                content: `**Continuous Integration (CI):** Automating the building and testing of code every time a team member commits changes to version control.\n\n**Continuous Deployment (CD):** Automatically releasing the built code to production environments safely.`,
                diagram: `Code Commit -> Automated Build -> Automated Tests -> Staging Deploy -> Intergration Test -> Prod Deploy`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-2',
                title: 'Designing a zero-downtime deployment pipeline',
                context: 'You must deploy a new version of the main API while users are actively making thousands of requests per second.',
                steps: [
                    'Approach: Blue-Green Deployment.',
                    'The current stable version is running on the "Blue" environment.',
                    'Deploy the new version to a separate, isolated "Green" environment.',
                    'Run automated smoke tests and health checks against the Green environment.',
                    'If healthy, flip the Load Balancer to route all new traffic to Green.',
                    'Keep Blue running for a short time to allow quick rollback if an issue is caught later in production.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'Explain the difference between a Container and a Virtual Machine.',
                answer: 'A Virtual Machine abstracts physical hardware. Each VM runs a full, independent Guest OS, making them highly isolated but very heavy and slow to boot. A Container (like Docker) abstracts the Operating System. It packages the application code and dependencies, but shares the underlying Host OS kernel. This makes containers extremely lightweight, taking megabytes instead of gigabytes, and allows them to spin up in milliseconds, making them perfect for CI/CD and autoscaling microservices.',
                analysis: 'Clearly delineates where the abstraction layer exists (hardware vs kernel), and explains why that makes containers superior for modern autoscaling workloads.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is Kubernetes and what problem does it solve?',
                answer: 'Docker is great for running a single container, but in production, you might have hundreds of microservices, each needing 5 replicas. Kubernetes is a container orchestration platform that manages this complexity. It handles automated rollouts and rollbacks, self-healing (restarting failed containers), horizontal autoscaling based on CPU usage, and load balancing traffic across the replicas. It essentially acts as the "Operating System" for a cluster of servers.',
                analysis: 'Moves past the definition of a container to explain *orchestration*, listing the specific automation features (autoscaling, self-healing) that make k8s the industry standard.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain Serverless computing and its tradeoffs.',
                answer: 'Serverless (like AWS Lambda) means the cloud provider dynamically manages the allocation of machine resources. You write a function, and AWS spins up a container to run it only when requested, charging you purely by the millisecond of execution time. It is incredible for spiky, unpredictable workloads or background cron jobs because it scales to zero, saving money. The main tradeoff is "Cold Starts"—the initialization latency incurred when a function hasn\'t been called in a while and a new container must be provisioned.',
                analysis: 'Accurately defines the billing/execution model, provides the ideal use case (spiky workloads), and immediately identifies the primary architectural flaw (cold starts).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'security-cryptography': {
        title: 'Security & Cryptography Deep Dive',
        sections: [
            {
                title: 'Password Hashing & Salting',
                content: `Never store plaintext passwords! \n\n**Hashing:** A one-way mathematical function (like SHA-256 or bcrypt) that turns a password into a garbled string. If a hacker steals the DB, they only see the hashes.\n\n**Salting:** Hackers use "Rainbow Tables" (pre-computed hashes of common passwords). To defeat this, we add a random string (a "salt") to every password *before* hashing.`,
                diagram: `Bad:  hash("password") -> [fixed hash]\nGood: hash(salt + "password") -> [unique hash per user]`
            },
            {
                title: 'JWT vs Session Cookies',
                content: `**Session Cookies (Stateful):** Server creates a session, stores it in DB/Redis, and gives client an ID in a cookie. Server must look up ID on every request.\n\n**JSON Web Tokens (JWT) (Stateless):** Server cryptographically signs user data into a token and gives it to client. Server mathematically verifies the signature on each request without hitting the DB.`,
                diagram: `Session: Client [ID:123] -> Server [Checks Redis for ID:123] -> Valid\nJWT: Client [Token(Role:Admin, Sign:xyz)] -> Server [Verifies Sign:xyz] -> Valid`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-2',
                title: 'Securing a public REST API',
                context: 'Your SPA needs to communicate securely with your backend API.',
                steps: [
                    'HTTPS Only: Enforce TLS to prevent Man-in-the-Middle (MITM) attacks and packet sniffing.',
                    'Authentication: Use OAuth 2.0 or JWT for stateless auth.',
                    'Authorization/RBAC: Verify roles on every protected route.',
                    'Rate Limiting: Prevent DDoS and brute force attacks (e.g., max 100 req/min per IP).',
                    'Input Validation & Parameterization: Prevent SQL injection by validating payloads and using ORM abstractions.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'How do you safely store user passwords?',
                answer: 'Passwords should never be stored in plain text or using two-way encryption. They must be hashed using a computationally expensive, one-way cryptographic function like bcrypt or Argon2. This prevents attackers from easily brute-forcing the hashes if the database is leaked. Furthermore, before hashing, a cryptographically random string called a "salt" must be appended to the password. This uniquely modifies every hash in the database, rendering pre-computed dictionary attacks (rainbow tables) completely useless.',
                analysis: 'Hits all the keywords an interviewer is looking for: one-way hashing, computationally expensive algorithms (bcrypt), and the absolute necessity of unique per-user salting.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is Cross-Site Scripting (XSS) and how do you prevent it?',
                answer: 'XSS occurs when an attacker injects malicious JavaScript into your application, which is then executed by other users\' browsers. This usually happens in comment sections or message boards. The script can steal their session cookies or perform actions on their behalf. To prevent it, we must rigorously sanitize and escape all user input before rendering it to the DOM. If React is used, it escapes data by default, but we must never use `dangerouslySetInnerHTML` directly with user input.',
                analysis: 'Defines the attack vector, explains the devastating payload (cookie theft), and provides the framework-specific mitigation strategy (React auto-escaping).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain Cross-Site Request Forgery (CSRF).',
                answer: 'CSRF is an attack that forces an authenticated user to execute unwanted actions on a web application. For example, if you are logged into your bank, and click a malicious link on a hacker\'s site, that link could submit a hidden POST request to `bank.com/transfer`. Because you are logged in, your browser automatically attaches your authentication cookies, and the transfer succeeds. I prevent this by implementing anti-CSRF tokens—unique, cryptographically random strings embedded in the UI forms that the server verifies on every state-changing request.',
                analysis: 'Uses a clear, terrifying real-world example (bank transfer) to explain how the browser\'s automatic cookie behavior is weaponized, and provides the standard mitigation (tokens).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'frontend-architecture': {
        title: 'Frontend Architecture Deep Dive',
        sections: [
            {
                title: 'The Critical Rendering Path',
                content: `How a browser turns HTML/CSS/JS into pixels on a screen:\n\n1. **DOM:** Parse HTML into Document Object Model.\n2. **CSSOM:** Parse CSS into CSS Object Model.\n3. **Render Tree:** Combine DOM & CSSOM (excluding hidden nodes like display:none).\n4. **Layout:** Calculate size and position of every node.\n5. **Paint:** Draw pixels to the screen.`,
                diagram: `HTML ─> DOM ──┐\n            ├─> Render Tree ─> Layout ─> Paint\nCSS ─> CSSOM ─┘`
            },
            {
                title: 'Frontend State Management',
                content: `**Local State:** Stored within a single component (e.g., simple toggles or input fields).\n**Global State:** Shared across the entire app (e.g., User session, Shopping Cart). Usually managed by Redux, Zustand, or Context API.\n**Server State:** Remote data that needs fetching, caching, and invalidation (e.g., list of products). Best handled by Tanstack Query or SWR.`,
                diagram: `Component ──> Local State\nComponent ──> Context/Redux (Global)\nComponent ──> ReactQuery ──> API (Server State)`
            }
        ],
        scenarioBreakdown: [
            {
                id: 'scenario-1',
                title: 'Optimizing a slow, laggy React application',
                context: 'The interface freezes when typing into a search box on a page with a heavy data list.',
                steps: [
                    'Identify issue: The parent component is re-rendering the heavy list on every keystroke.',
                    'Fix 1 (Debouncing): Debounce the search input handler so state only updates 300ms after the user stops typing.',
                    'Fix 2 (Memoization): Wrap the heavy list component in React.memo so it skips rendering if its props haven\'t changed.',
                    'Fix 3 (Virtualization): If the list has 10,000 items, use a Virtual List library to only render the 20 items visible in the viewport.'
                ]
            }
        ],
        exampleAnswers: [
            {
                question: 'Explain the difference between Debouncing and Throttling.',
                answer: 'Both are techniques to limit the rate at which a function executes, typically tied to DOM events. Debouncing delays the function execution until a specified period of inactivity has passed. It\'s perfect for search inputs, where you only want to fire the API call after the user stops typing. Throttling ensures the function executes at most once every specified time interval, regardless of how many times the event fires. It\'s ideal for scroll or window resize events, where you want to continuously track progress but at a manageable, reduced framerate.',
                analysis: 'Clearly defines the operational difference between waiting for inactivity (debounce) vs enforcing a strict framerate (throttle), and brilliantly pair each with their standard UI use-case.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is the Virtual DOM and why did React introduce it?',
                answer: 'Directly manipulating the browser\'s actual DOM (like using `document.getElementById`) is computationally expensive and slow. React introduced the Virtual DOM as an in-memory, lightweight object representation of the actual UI. When state changes, React creates a new Virtual DOM, compares it to the previous one using a diffing algorithm, and calculates the absolute minimum number of actual DOM updates required. It then batches these updates together, applying them all at once, which drastically improves rendering performance.',
                analysis: 'Explains the problem (slow actual DOM), the mechanism (in-memory representation + diffing algorithm), and the ultimate performance benefit (batched updates).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Explain Server-Side Rendering (SSR) vs Single Page Applications (SPA).',
                answer: 'A traditional SPA sends an empty HTML file to the browser along with a massive JavaScript bundle. The browser must download and execute the JS before rendering the UI. This is terrible for SEO (crawlers see a blank page) and causes slow initial load times. Server-Side Rendering (using frameworks like Next.js) renders the initial HTML state on the server and sends fully formed HTML to the client. This results in instant initial page loads and perfect SEO, after which the page "hydrates" and behaves exactly like a fast SPA.',
                analysis: 'Perfectly contrasts the two approaches, highligting the two major flaws of SPAs (SEO and slow initial paint) and explaining how SSR (Next.js) solves them via hydration.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    }
};
