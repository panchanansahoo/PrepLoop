export const technicalQuestions = {
    dataStructures: {
        title: "Data Structures",
        icon: "GitBranch",
        color: "#3b82f6",
        description: "Arrays, Linked Lists, Trees, Graphs, and Hash Tables",
        questions: [
            {
                id: "dsa_1",
                question: "Which data structure is best suited to implement a priority queue?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Stack" },
                    { label: "B", value: "Linked List" },
                    { label: "C", value: "Heap" },
                    { label: "D", value: "Array" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Heaps (specifically Min-Heap or Max-Heap) provide O(log n) time complexity for insertion and extraction, making them ideal for priority queues."
            },
            {
                id: "dsa_2",
                question: "What is the worst-case time complexity of QuickSort?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "O(n log n)" },
                    { label: "B", value: "O(n)" },
                    { label: "C", value: "O(n²)" },
                    { label: "D", value: "O(log n)" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "In the worst case (e.g., when the array is already sorted and the pivot is the smallest or largest element), QuickSort takes O(n²) time."
            },
            {
                id: "dsa_3",
                question: "A graph algorithm that finds the shortest path from a starting node to all other nodes in a weighted graph with positive weights is:",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "Kruskal's Algorithm" },
                    { label: "B", value: "Dijkstra's Algorithm" },
                    { label: "C", value: "Breadth-First Search" },
                    { label: "D", value: "Prim's Algorithm" }
                ],
                correctAnswer: "B",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Dijkstra's Algorithm finds the shortest path tree from a single source node to all other nodes on graphs with non-negative edge weights."
            },
            {
                id: "dsa_4",
                question: "Which of the following traversals of a Binary Search Tree (BST) visits nodes in ascending order?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Pre-order" },
                    { label: "B", value: "Post-order" },
                    { label: "C", value: "In-order" },
                    { label: "D", value: "Level-order" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "An In-order traversal (Left, Root, Right) of a BST will process the nodes in sorted (ascending) order."
            },
            {
                id: "dsa_5",
                question: "What is the primary advantage of a Hash Table over a Binary Search Tree?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "It uses less memory" },
                    { label: "B", value: "Elements are stored in sorted order" },
                    { label: "C", value: "It allows O(1) average time complexity for search, insert, and delete" },
                    { label: "D", value: "It prevents hash collisions entirely" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Hash Tables operate in O(1) average time for lookups, insertions, and deletions, which is faster than the O(log n) time typical of balanced BSTs."
            }
        ]
    },
    operatingSystems: {
        title: "Operating Systems",
        icon: "Settings",
        color: "#f59e0b",
        description: "Processes, Threads, Memory Management, and Deadlocks",
        questions: [
            {
                id: "os_1",
                question: "Which of the following is NOT a necessary condition for a deadlock to occur?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "Mutual Exclusion" },
                    { label: "B", value: "Hold and Wait" },
                    { label: "C", value: "Preemption" },
                    { label: "D", value: "Circular Wait" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "The four Coffman conditions for deadlock are Mutual Exclusion, Hold and Wait, **No Preemption**, and Circular Wait. Preemption breaks deadlocks."
            },
            {
                id: "os_2",
                question: "What is the main role of a 'Page Table' in memory management?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "To map logical addresses to physical addresses" },
                    { label: "B", value: "To store executing process data" },
                    { label: "C", value: "To handle hardware interrupts" },
                    { label: "D", value: "To increase disk storage capacity" }
                ],
                correctAnswer: "A",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "A page table is the data structure used by a virtual memory system in a computer operating system to store the mapping between virtual addresses and physical addresses."
            },
            {
                id: "os_3",
                question: "Which scheduling algorithm is associated with 'time slicing'?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "First Come First Serve (FCFS)" },
                    { label: "B", value: "Shortest Job First (SJF)" },
                    { label: "C", value: "Round Robin (RR)" },
                    { label: "D", value: "Priority Scheduling" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Round Robin assigns a fixed time unit (a time slice or quantum) to each process in a cyclic order."
            },
            {
                id: "os_4",
                question: "What state is a process in if it is waiting for an I/O operation to complete?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Ready state" },
                    { label: "B", value: "Running state" },
                    { label: "C", value: "Blocked/Waiting state" },
                    { label: "D", value: "Terminated state" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "A process goes into the Blocked or Waiting state when it cannot continue executing until a specific event happens, like I/O completion."
            }
        ]
    },
    dbms: {
        title: "Database Management",
        icon: "Database",
        color: "#10b981",
        description: "SQL, Normalization, ACID properties, and Transactions",
        questions: [
            {
                id: "dbms_1",
                question: "Which of the following describes the 'I' in the ACID properties of a database transaction?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "Integrity" },
                    { label: "B", value: "Isolation" },
                    { label: "C", value: "Identity" },
                    { label: "D", value: "Indexing" }
                ],
                correctAnswer: "B",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures concurrent transactions don't interfere with each other."
            },
            {
                id: "dbms_2",
                question: "The process of organizing data to reduce redundancy and improve data integrity is called:",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Normalization" },
                    { label: "B", value: "Denormalization" },
                    { label: "C", value: "Indexing" },
                    { label: "D", value: "Partitioning" }
                ],
                correctAnswer: "A",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Normalization involves dividing a database into two or more tables and defining relationships between the tables to minimize data redundancy."
            },
            {
                id: "dbms_3",
                question: "Which SQL command is used to remove all records from a table, including all spaces allocated for the records, but leaving the table structure intact?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "DROP" },
                    { label: "B", value: "DELETE" },
                    { label: "C", value: "TRUNCATE" },
                    { label: "D", value: "REMOVE" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "TRUNCATE deletes all rows from a table and frees the space containing the table, but the table structure remains. It cannot be rolled back."
            },
            {
                id: "dbms_4",
                question: "A Foreign Key in a database table implies:",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "It must contain unique values only" },
                    { label: "B", value: "It cannot be null" },
                    { label: "C", value: "It refers to the Primary Key of another table" },
                    { label: "D", value: "It is automatically indexed for search" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "A Foreign Key provides a link between data in two tables by referencing the Primary Key of the other table."
            }
        ]
    },
    oops: {
        title: "Object-Oriented Programming",
        icon: "Box",
        color: "#e879f9",
        description: "Inheritance, Polymorphism, Encapsulation, and Abstraction",
        questions: [
            {
                id: "oop_1",
                question: "Which OOP concept is demonstrated by hiding the internal implementation details and exposing only the necessary functionality?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Polymorphism" },
                    { label: "B", value: "Inheritance" },
                    { label: "C", value: "Abstraction" },
                    { label: "D", value: "Encapsulation" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Abstraction is the process of hiding implementation details and showing only the functionality to the user. (Encapsulation is data binding/protection)."
            },
            {
                id: "oop_2",
                question: "Method overloading is an example of which type of polymorphism?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "Compile-time polymorphism" },
                    { label: "B", value: "Run-time polymorphism" },
                    { label: "C", value: "Dynamic binding" },
                    { label: "D", value: "Overriding" }
                ],
                correctAnswer: "A",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Method overloading (same method name, different parameters) is resolved during compilation, hence Compile-time polymorphism (Static binding)."
            },
            {
                id: "oop_3",
                question: "If a class inherits from its parent, and then defines a method with the exact same name and signature as the parent's method, this is known as:",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Method Overloading" },
                    { label: "B", value: "Method Overriding" },
                    { label: "C", value: "Virtualization" },
                    { label: "D", value: "Encapsulation" }
                ],
                correctAnswer: "B",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "Method Overriding allows a subclass to provide a specific implementation of a method that is already provided by one of its parent classes."
            },
            {
                id: "oop_4",
                question: "What does the 'super' keyword generally reference in OOP languages like Java or C++?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "The child class" },
                    { label: "B", value: "The global scope" },
                    { label: "C", value: "The immediate parent class" },
                    { label: "D", value: "A static variable" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "The 'super' keyword refers to superclass (parent) objects and is often used to call superclass methods or constructors."
            }
        ]
    },
    computerNetworks: {
        title: "Computer Networks",
        icon: "Network",
        color: "#6366f1",
        description: "OSI Model, TCP/IP, Routing, and Protocols",
        questions: [
            {
                id: "cn_1",
                question: "Which layer of the OSI model is responsible for routing packets across different networks?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "Data Link Layer" },
                    { label: "B", value: "Network Layer" },
                    { label: "C", value: "Transport Layer" },
                    { label: "D", value: "Session Layer" }
                ],
                correctAnswer: "B",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "The Network Layer (Layer 3) is responsible for packet forwarding including routing through intermediate routers."
            },
            {
                id: "cn_2",
                question: "What is the primary difference between TCP and UDP?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "TCP is connectionless, UDP is connection-oriented" },
                    { label: "B", value: "UDP guarantees delivery, TCP does not" },
                    { label: "C", value: "TCP is connection-oriented and reliable, UDP is connectionless and best-effort" },
                    { label: "D", value: "TCP is faster than UDP" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "TCP provides reliable, ordered, and error-checked delivery of a stream of octets. UDP is connectionless without guarantee of delivery, order, or duplication protection."
            },
            {
                id: "cn_3",
                question: "What is the standard port number for the HTTP protocol?",
                difficulty: "easy",
                xp: 10,
                options: [
                    { label: "A", value: "21" },
                    { label: "B", value: "22" },
                    { label: "C", value: "80" },
                    { label: "D", value: "443" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "HTTP uses port 80. HTTPS uses port 443. Port 21 is FTP, and Port 22 is SSH."
            },
            {
                id: "cn_4",
                question: "Which protocol resolves IP addresses into MAC addresses?",
                difficulty: "medium",
                xp: 15,
                options: [
                    { label: "A", value: "DNS" },
                    { label: "B", value: "DHCP" },
                    { label: "C", value: "ARP" },
                    { label: "D", value: "NAT" }
                ],
                correctAnswer: "C",
                theory: "This question probes your core computer science fundamentals. The theory behind this concept is essential for writing efficient, scalable, and secure software systems in a production environment.",
      explanation: "The Address Resolution Protocol (ARP) is used to find a host's hardware MAC address when only its IP address is known."
            }
        ]
    }
};
