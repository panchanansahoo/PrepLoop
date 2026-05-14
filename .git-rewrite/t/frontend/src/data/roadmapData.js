export const roadmapHierarchy = [
    {
        id: "array",
        label: "Array",
        category: "Root",
        children: [
            {
                id: "array-sliding-window",
                label: "Sliding Window",
                children: [
                    { id: "fixed-size", label: "Fixed Size" },
                    { 
                        id: "variable-size", 
                        label: "Variable Size",
                        children: [
                            { id: "expand-shrink", label: "Expand–Shrink" },
                            { id: "monotonic-window", label: "Monotonic Window" }
                        ]
                    }
                ]
            },
            {
                id: "array-two-pointer",
                label: "Two Pointer",
                children: [
                    { id: "opposite-ends", label: "Opposite ends (left + right)" },
                    { id: "same-direction", label: "Same direction (fast & slow pointers)" },
                    { id: "partition-dutch-flag", label: "Partition / Dutch flag" }
                ]
            },
            {
                id: "prefix-based",
                label: "Prefix Based",
                children: [
                    { id: "prefix-sum", label: "Prefix Sum" },
                    { id: "prefix-xor", label: "Prefix XOR" },
                    { id: "2d-prefix", label: "2D Prefix" }
                ]
            },
            {
                id: "kadanes-subarray",
                label: "Kadane's / Subarray",
                children: [
                    { id: "max-subarray-sum", label: "Max subarray sum (Kadane's)" },
                    { id: "max-product-subarray", label: "Max product subarray" },
                    { id: "subarray-xor-sum", label: "Subarray with given XOR / sum" }
                ]
            },
            {
                id: "array-binary-search",
                label: "Binary Search",
                children: [
                    { id: "binary-search-index", label: "on index" },
                    { id: "binary-search-answer", label: "on answer" }
                ]
            }
        ]
    },
    {
        id: "string",
        label: "String",
        category: "Root",
        children: [
            {
                id: "string-sliding-window",
                label: "Sliding Window",
                children: [
                    { id: "longest-substring-without-repeat", label: "Longest substring without repeat" },
                    { id: "minimum-window-substring", label: "Minimum window substring" },
                    { id: "anagram-permutation-string", label: "Anagram / permutation in string" }
                ]
            },
            {
                id: "string-two-pointers",
                label: "Two Pointers",
                children: [
                    { id: "palindrome-check", label: "Palindrome check" },
                    { id: "reverse-words", label: "Reverse words / characters" },
                    { id: "string-compression", label: "String compression" }
                ]
            },
            {
                id: "pattern-matching",
                label: "Pattern Matching",
                children: [
                    { id: "kmp", label: "KMP (failure function)" },
                    { id: "rabin-karp", label: "Rabin-Karp (rolling hash)" },
                    { id: "z-algorithm", label: "Z-algorithm" }
                ]
            }
        ]
    },
    {
        id: "hash-map",
        label: "Hash map",
        category: "Root",
        children: [
            { id: "frequency-based", label: "Frequency Based" },
            { id: "lookup-based", label: "Lookup Based" },
            { id: "set-based", label: "Set Based" },
            { id: "index-mapping", label: "Index Mapping" },
            { id: "grouping-pattern", label: "Grouping Pattern" }
        ]
    },
    {
        id: "stack",
        label: "Stack",
        category: "Root",
        children: [
            {
                id: "stack-monotonic",
                label: "Monotonic Stack",
                children: [
                    { id: "monotonic-increasing", label: "Increasing" },
                    { id: "monotonic-decreasing", label: "Decreasing" }
                ]
            },
            {
                id: "nearest-element",
                label: "Nearest Element",
                children: [
                    { id: "next-greater", label: "Next Greater" },
                    { id: "next-smaller", label: "Next Smaller" },
                    { id: "previous-variants", label: "Previous Variants" }
                ]
            },
            { id: "range-span", label: "Range / Span" },
            { id: "min-max-stack", label: "min/Max Stack" },
            { id: "expression-handling", label: "Expression Handling" },
            { id: "histogram-pattern", label: "Histogram Pattern" }
        ]
    },
    {
        id: "queue-deque",
        label: "QUEUE / DEQUE",
        category: "Root",
        children: [
            { id: "fifo-processing", label: "FIFO Processing" },
            { id: "level-wise-processing", label: "Level-wise Processing" },
            { id: "circular-queue", label: "Circular Queue Pattern" },
            { id: "deque-based", label: "Deque Based" }
        ]
    },
    {
        id: "linked-list",
        label: "LINKED LIST",
        category: "Root",
        children: [
            {
                id: "pointer-techniques",
                label: "Pointer Techniques",
                children: [
                    { id: "list-fast-slow", label: "Fast–Slow" },
                    { id: "list-cycle-detection", label: "Cycle Detection" }
                ]
            },
            {
                id: "reversal",
                label: "Reversal",
                children: [
                    { id: "full-reverse", label: "Full Reverse" },
                    { id: "partial-k-group", label: "Partial (k-group)" }
                ]
            },
            { id: "merge-lists", label: "Merge Lists" }
        ]
    },
    {
        id: "trees",
        label: "TREES",
        category: "Root",
        children: [
            {
                id: "tree-traversal",
                label: "Traversal",
                children: [
                    { id: "dfs-tree", label: "DFS (Pre / In / Post order)" },
                    { id: "bfs-tree", label: "BFS (Level Order/ zigzag/ right side view)" }
                ]
            },
            {
                id: "recursion-patterns",
                label: "Recursion Patterns",
                children: [
                    { id: "top-down", label: "Top Down approach" },
                    { id: "bottom-up", label: "Bottom Up approach" }
                ]
            },
            {
                id: "path-based",
                label: "Path Based",
                children: [
                    { id: "max-path-sum", label: "Max path sum" },
                    { id: "diameter-height-depth", label: "Diameter/Height / depth" }
                ]
            },
            { id: "bst", label: "BST (Binary Search Tree)" }
        ]
    },
    {
        id: "recursion",
        label: "Recursion",
        category: "Root",
        children: [
            {
                id: "backtracking",
                label: "BACKTRACKING",
                children: [
                    {
                        id: "exploration",
                        label: "Exploration",
                        children: [
                            { id: "decision-tree", label: "Decision Tree" },
                            { id: "choose-explore-unchoose", label: "Choose–Explore–Unchoose" },
                            { id: "subsets", label: "Subsets (power set)" },
                            { id: "permutations-combinations", label: "PermutationsCombinations (nCr)" },
                            { id: "word-search", label: "Word search on grid" },
                            { id: "palindrome-partitioning", label: "Palindrome partitioning" }
                        ]
                    },
                    { id: "pruning-state-tracking", label: "Pruning / State Tracking" }
                ]
            },
            {
                id: "divide-conquer",
                label: "Divide & Conquer",
                children: [
                    { id: "merge-sort-pattern", label: "Merge sort pattern" },
                    { id: "quick-select", label: "Quick select (Kth largest)" },
                    { id: "count-inversions", label: "Count inversions" }
                ]
            }
        ]
    },
    {
        id: "heap",
        label: "Heap",
        category: "Root",
        children: [
            { id: "top-k", label: "Top K/ Kth Element/ k closest points" },
            {
                id: "greedy-heap",
                label: "Greedy+ Heap",
                children: [
                    { id: "task-scheduler", label: "Task scheduler" },
                    { id: "meeting-rooms", label: "Meeting rooms" },
                    { id: "reorganize-string", label: "Reorganize string" },
                    { id: "huffman-encoding-heap", label: "Huffman encoding" }
                ]
            },
            { id: "k-way-merge", label: "K-way Merge" }
        ]
    },
    {
        id: "graphs",
        label: "GRAPHS",
        category: "Root",
        children: [
            {
                id: "graph-traversal",
                label: "Traversal",
                children: [
                    { id: "graph-bfs", label: "BFS" },
                    { id: "graph-dfs", label: "DFS" }
                ]
            },
            {
                id: "graph-cycle-detection",
                label: "Cycle Detection",
                children: [
                    { id: "cycle-directed", label: "Directed" },
                    { id: "cycle-undirected", label: "Undirected" }
                ]
            },
            {
                id: "graph-topological-sort",
                label: "Topological Sort",
                children: [
                    { id: "topo-bfs-dfs", label: "Topological Sort (BFS / DFS)" },
                    { id: "kahns-algorithm", label: "Kahn's algorithm (BFS in-degree)" },
                    { id: "dfs-topo-sort", label: "DFS-based topo sort" }
                ]
            },
            {
                id: "shortest-path",
                label: "Shortest Path",
                children: [
                    { id: "dijkstra", label: "Dijkstra" },
                    { id: "bellman-ford", label: "Bellman-Ford" },
                    { id: "floyd-warshall", label: "Floyd-Warshall (all pairs)" }
                ]
            },
            {
                id: "spanning-tree",
                label: "Spanning Tree",
                children: [
                    { id: "kruskal", label: "Kruskal" },
                    { id: "prims", label: "Prims" }
                ]
            },
            { id: "union-find-detect", label: "Union-Find (DSU) Detect cycle in undirected" },
            { id: "bipartite-multi-bfs", label: "Bipartite/ Multi-source BFS/ 0-1 BFS" }
        ]
    },
    {
        id: "trie",
        label: "TRIE",
        category: "Root",
        children: [
            {
                id: "trie-prefix",
                label: "Prefix Based",
                children: [
                    { id: "trie-insert-search", label: "Insert/Search" },
                    { id: "trie-prefix-match", label: "Prefix Match" }
                ]
            },
            { id: "bitwise-trie", label: "Bitwise Trie" }
        ]
    },
    {
        id: "dp",
        label: "DYNAMIC PROGRAMMING",
        category: "Root",
        children: [
            {
                id: "dp-core",
                label: "Core",
                children: [
                    { id: "dp-1d", label: "1D" },
                    { id: "dp-2d", label: "2D" }
                ]
            },
            {
                id: "dp-transition",
                label: "Transition Type",
                children: [
                    { id: "linear-dp", label: "Linear DP" },
                    { id: "grid-dp", label: "Grid DP" },
                    { id: "decision-dp", label: "Decision DP" }
                ]
            },
            {
                id: "dp-pattern",
                label: "Pattern Types",
                children: [
                    { id: "knapsack", label: "Knapsack" },
                    { id: "sequence-dp", label: "Sequence DP" },
                    { id: "partition-dp", label: "Partition DP" },
                    { id: "interval-dp", label: "Interval DP" }
                ]
            },
            {
                id: "dp-advanced",
                label: "Advanced",
                children: [
                    { id: "bitmask-dp", label: "Bitmask DP" },
                    { id: "digit-dp", label: "Digit DP" },
                    { id: "dp-on-trees", label: "DP on Trees" }
                ]
            },
            {
                id: "dp-optimization",
                label: "Optimization",
                children: [
                    { id: "memoization", label: "Memoization" },
                    { id: "tabulation", label: "Tabulation" }
                ]
            }
        ]
    },
    {
        id: "greedy",
        label: "GREEDY",
        category: "Root",
        children: [
            {
                id: "interval-greedy",
                label: "Interval Greedy",
                children: [
                    { id: "activity-selection", label: "Activity Selection" },
                    { id: "non-overlapping", label: "Non-overlapping Intervals" },
                    { id: "min-removals", label: "Minimum Removals" }
                ]
            },
            {
                id: "scheduling-greedy",
                label: "Scheduling Greedy",
                children: [
                    { id: "deadline-scheduling", label: "Deadline Based Scheduling" },
                    { id: "profit-selection", label: "Profit Based Selection" }
                ]
            },
            {
                id: "resource-allocation",
                label: "Resource Allocation",
                children: [
                    { id: "min-platforms", label: "Minimum Platforms / Rooms" },
                    { id: "meeting-rooms-greedy", label: "Meeting Rooms" }
                ]
            },
            { id: "jump-game", label: "Jump Game Pattern" },
            { id: "huffman-merge", label: "Huffman / Merge Cost" }
        ]
    },
    {
        id: "bit-manipulation",
        label: "BIT MANIPULATION",
        category: "Root",
        children: [
            {
                id: "bit-core",
                label: "Core",
                children: [
                    { id: "xor-pattern", label: "XOR Pattern" },
                    { id: "bit-masking", label: "Bit Masking" }
                ]
            },
            {
                id: "bit-usage",
                label: "Usage",
                children: [
                    { id: "subset-bits", label: "Subset via Bits" },
                    { id: "bit-checks", label: "Bit Checks" },
                    { id: "bit-prefix-xor", label: "Prefix XOR" }
                ]
            }
        ]
    },
    {
        id: "sorting-algorithms",
        label: "Sorting Algorithms",
        category: "Root",
        children: [
            { id: "bubble-sort", label: "Bubble Sort" },
            { id: "selection-sort", label: "Selection Sort" },
            { id: "insertion-sort", label: "Insertion Sort" },
            { id: "merge-sort", label: "Merge Sort" },
            { id: "quick-sort", label: "Quick Sort" },
            { id: "heap-sort", label: "Heap Sort" },
            { id: "counting-sort", label: "Counting Sort" },
            { id: "radix-sort", label: "Radix Sort" },
            { id: "bucket-sort", label: "Bucket Sort" }
        ]
    },
    {
        id: "range-structures",
        label: "RANGE STRUCTURES",
        category: "Root",
        children: [
            {
                id: "segment-tree",
                label: "Segment Tree",
                children: [
                    { id: "range-query", label: "Range Query" },
                    { id: "lazy-propagation", label: "Lazy Propagation" }
                ]
            },
            {
                id: "fenwick-tree",
                label: "Fenwick Tree",
                children: [
                    { id: "fenwick-prefix-query", label: "Prefix Query" }
                ]
            }
        ]
    }
];
