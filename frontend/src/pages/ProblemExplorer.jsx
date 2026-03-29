import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, ChevronDown, ChevronUp, Check, X,
    Clock, Building2, Tag, BarChart3, Target, Flame,
    ArrowUpDown, CheckCircle2, Circle, AlertCircle,
    ExternalLink, SlidersHorizontal, Bookmark, Shuffle,
    Zap, Star, Sparkles, History, StickyNote,
    ChevronRight, Trophy, BarChart2, Eye, EyeOff,
    ChevronLeft, ListFilter, BookOpen, TrendingUp,
    Lock, MessageSquare, Play, Code2, List
} from 'lucide-react';
import { PROBLEMS, COMPANIES, TOPICS, PATTERNS, getDifficultyCounts } from '../data/problemsDatabase';
import { dsaPatternsAll as baseDsaPatterns } from '../data/dsaPatternsData';
import { useTheme } from '../context/ThemeContext';
import { filterAndSortProblems } from '../features/problemExplorer/filtering';
import { ProblemExplorerFiltersPanel } from '../features/problemExplorer/ProblemExplorerFiltersPanel';
import { ProblemExplorerAllQuestionsView } from '../features/problemExplorer/ProblemExplorerAllQuestionsView';
import { ProblemExplorerViewControls } from '../features/problemExplorer/ProblemExplorerViewControls';
import { ProblemExplorerPatternView } from '../features/problemExplorer/ProblemExplorerPatternView';
import { ProblemExplorerNotesModal } from '../features/problemExplorer/ProblemExplorerNotesModal';
import { ProblemExplorerSearchToolbar } from '../features/problemExplorer/ProblemExplorerSearchToolbar';
import { ProblemExplorerInsightsPanels } from '../features/problemExplorer/ProblemExplorerInsightsPanels';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX'];

const PATTERN_CATEGORIES = [
    {
        id: 'array',
        name: 'Array',
        topics: [],
        subPatterns: [
            { id: 'sw-fixed-size', name: 'Sliding Window - Fixed Size', topics: ['Sliding Window', 'Arrays'] },
            { id: 'sw-variable-expand-shrink', name: 'Sliding Window - Variable Size Window', topics: ['Sliding Window', 'Arrays'] },
            { id: 'sw-monotonic-window', name: 'Sliding Window - Monotonic Queue (Max/Min)', topics: ['Sliding Window', 'Queue'] },
            { id: 'sw-char-frequency-matching', name: 'Sliding Window - Character Frequency Matching', topics: ['Sliding Window', 'Strings', 'Hashing'] },
            { id: 'tp-opposite-ends', name: 'Two Pointer - Opposite ends (left + right)', topics: ['Two Pointers', 'Arrays'] },
            { id: 'tp-fast-slow', name: 'Two Pointer - Same direction (fast & slow pointers)', topics: ['Two Pointers', 'Arrays', 'Linked List'] },
            { id: 'tp-partition-dutch-flag', name: 'Two Pointer - Partition / Dutch Flag', topics: ['Two Pointers', 'Arrays', 'Sorting'] },
            { id: 'tp-converging', name: 'Two Pointer - Converging', topics: ['Two Pointers', 'Arrays'] },
            { id: 'tp-string-reversal', name: 'Two Pointer - String Reversal', topics: ['Two Pointers', 'Strings'] },
            { id: 'tp-inplace-array-mod', name: 'Two Pointer - In-place Array Modification', topics: ['Two Pointers', 'Arrays'] },
            { id: 'tp-fixed-separation', name: 'Two Pointer - Fixed Separation', topics: ['Two Pointers', 'Arrays', 'Linked List'] },
            { id: 'tp-string-special-compare', name: 'Two Pointer - String Comparison with Special Characters', topics: ['Two Pointers', 'Strings'] },
            { id: 'tp-expand-center', name: 'Two Pointer - Expanding From Center', topics: ['Two Pointers', 'Strings'] },
            { id: 'prefix-sum-array', name: 'Prefix Based - Prefix Sum', topics: ['Arrays', 'Prefix Sum'] },
            { id: 'prefix-xor', name: 'Prefix Based - Prefix XOR', topics: ['Arrays', 'Bit Manipulation'] },
            { id: 'prefix-2d', name: 'Prefix Based - 2D Prefix', topics: ['Matrix', 'Arrays'] },
            { id: 'kadane-max-sum', name: "Kadane's / Subarray - Max subarray sum (Kadane's)", topics: ['Arrays', 'Dynamic Programming'] },
            { id: 'kadane-max-product', name: "Kadane's / Subarray - Max product subarray", topics: ['Arrays', 'Dynamic Programming'] },
            { id: 'subarray-given-xor-sum', name: "Kadane's / Subarray - Subarray with given XOR / sum", topics: ['Arrays', 'Bit Manipulation', 'Prefix Sum'] },
            { id: 'bs-on-index', name: 'Binary Search - on index', topics: ['Binary Search'] },
            { id: 'bs-on-answer', name: 'Binary Search - on answer', topics: ['Binary Search'] },
            { id: 'am-plus-one', name: 'Array/Matrix Manipulation Patterns - Plus One', topics: ['Arrays'] },
            { id: 'am-merge-sorted-array', name: 'Array/Matrix Manipulation Patterns - Merge Sorted Array', topics: ['Arrays', 'Sorting'] },
            { id: 'am-inplace-rotation', name: 'Array/Matrix Manipulation Patterns - In-place Rotation', topics: ['Arrays', 'Matrix'] },
            { id: 'am-spiral-traversal', name: 'Array/Matrix Manipulation Patterns - Spiral Traversal', topics: ['Matrix', 'Arrays'] },
            { id: 'am-set-matrix-zeroes', name: 'Array/Matrix Manipulation Patterns - Set Matrix Zeroes', topics: ['Matrix', 'Arrays'] },
            { id: 'am-product-except-self', name: 'Array/Matrix Manipulation Patterns - Product Except Self', topics: ['Arrays', 'Prefix Sum'] },
            { id: 'am-hashing-frequency', name: 'Array/Matrix Manipulation Patterns - Hashing - Frequency Map', topics: ['Hashing', 'Arrays'] },
            { id: 'am-hashing-seen-check', name: 'Array/Matrix Manipulation Patterns - Hashing - Seen Check', topics: ['Hashing', 'Arrays'] },
            { id: 'am-prefix-range-query', name: 'Array/Matrix Manipulation Patterns - Prefix Sum - Subarray and Range Query', topics: ['Arrays', 'Prefix Sum'] },
            { id: 'am-array-cyclic-sort', name: 'Array/Matrix Manipulation Patterns - Array - Cyclic Sort', topics: ['Arrays', 'Sorting'] },
        ],
    },
    {
        id: 'string',
        name: 'String',
        topics: [],
        subPatterns: [
            { id: 'str-sw-no-repeat', name: 'Sliding Window - Longest substring without repeat', topics: ['Strings', 'Sliding Window'] },
            { id: 'str-sw-min-window', name: 'Sliding Window - Minimum window substring', topics: ['Strings', 'Sliding Window'] },
            { id: 'str-sw-anagram', name: 'Sliding Window - Anagram / permutation in string', topics: ['Strings', 'Sliding Window'] },
            { id: 'str-tp-palindrome', name: 'Two Pointers - Palindrome check', topics: ['Strings', 'Two Pointers'] },
            { id: 'str-tp-reverse', name: 'Two Pointers - Reverse words / characters', topics: ['Strings', 'Two Pointers'] },
            { id: 'str-tp-compression', name: 'Two Pointers - String compression', topics: ['Strings', 'Two Pointers'] },
            { id: 'str-kmp', name: 'Pattern Matching - KMP (failure function)', topics: ['Strings'] },
            { id: 'str-rabin-karp', name: 'Pattern Matching - Rabin-Karp (rolling hash)', topics: ['Strings', 'Hashing'] },
            { id: 'str-z-algorithm', name: 'Pattern Matching - Z-algorithm', topics: ['Strings'] },
        ],
    },

    {
        id: 'hash-map',
        name: 'Hash map',
        topics: [],
        subPatterns: [
            { id: 'hash-frequency', name: 'Frequency Based', topics: ['Hashing', 'Arrays', 'Strings'] },
            { id: 'hash-lookup', name: 'Lookup Based', topics: ['Hashing', 'Arrays'] },
            { id: 'hash-set', name: 'Set Based', topics: ['Hashing', 'Arrays'] },
            { id: 'hash-index-mapping', name: 'Index Mapping', topics: ['Hashing', 'Arrays'] },
            { id: 'hash-grouping', name: 'Grouping Pattern', topics: ['Hashing', 'Strings', 'Arrays'] },
        ],
    },
    {
        id: 'stack',
        name: 'Stack Patterns',
        topics: [],
        subPatterns: [
            { id: 'sp-valid-parentheses', name: 'Valid Parentheses', topics: ['Stack', 'Strings'] },
            { id: 'sp-min-stack-design', name: 'Min Stack Design', topics: ['Stack'] },
            { id: 'sp-expression-evaluation', name: 'Expression Evaluation', topics: ['Stack', 'Strings'] },
            { id: 'sp-monotonic-stack', name: 'Monotonic Stack', topics: ['Stack', 'Arrays'] },
            { id: 'sp-largest-rectangle', name: 'Largest Rectangle in Histogram', topics: ['Stack', 'Arrays'] },
            { id: 'sp-simulation-backtracking', name: 'Simulation and Backtracking', topics: ['Stack', 'Backtracking'] },
            { id: 'stack-next-greater', name: 'Nearest Element - Next Greater', topics: ['Stack'] },
            { id: 'stack-next-smaller', name: 'Nearest Element - Next Smaller', topics: ['Stack'] },
            { id: 'stack-range-span', name: 'Range / Span', topics: ['Stack'] },
        ],
    },
    {
        id: 'queue-deque',
        name: 'QUEUE / DEQUE',
        topics: [],
        subPatterns: [
            { id: 'queue-fifo', name: 'FIFO Processing', topics: ['Queue'] },
            { id: 'queue-level-wise', name: 'Level-wise Processing', topics: ['Queue', 'Trees', 'Graphs', 'BFS'] },
            { id: 'queue-circular', name: 'Circular Queue Pattern', topics: ['Queue'] },
            { id: 'queue-deque-based', name: 'Deque Based', topics: ['Queue', 'Sliding Window'] },
        ],
    },
    {
        id: 'linked-list',
        name: 'Linked List Manipulation Patterns',
        topics: [],
        subPatterns: [
            { id: 'll-fast-slow', name: 'Fast-Slow Pointers', topics: ['Linked List', 'Two Pointers'] },
            { id: 'll-cycle-detection', name: 'Cycle Detection', topics: ['Linked List', 'Two Pointers'] },
            { id: 'll-inplace-reversal', name: 'In-place Reversal', topics: ['Linked List'] },
            { id: 'll-reversal-k-group', name: 'Reversal - Partial (k-group)', topics: ['Linked List'] },
            { id: 'll-merge-two-sorted-lists', name: 'Merge Two Sorted Lists', topics: ['Linked List'] },
            { id: 'll-intersection-detection', name: 'Intersection Detection', topics: ['Linked List', 'Two Pointers'] },
            { id: 'll-addition-of-numbers', name: 'Addition of Numbers', topics: ['Linked List'] },
            { id: 'll-reordering-partitioning', name: 'Reordering and Partitioning', topics: ['Linked List', 'Two Pointers'] },
        ],
    },
    {
        id: 'trees',
        name: 'Tree Traversal Patterns (DFS & BFS)',
        topics: [],
        subPatterns: [
            { id: 'tt-recursive-preorder', name: 'DFS - Preorder', topics: ['Trees', 'DFS'] },
            { id: 'tt-recursive-inorder', name: 'DFS - Inorder', topics: ['Trees', 'DFS', 'Binary Search Tree'] },
            { id: 'tt-recursive-postorder', name: 'DFS - Postorder', topics: ['Trees', 'DFS'] },
            { id: 'tt-level-order', name: 'BFS - Level Order', topics: ['Trees', 'BFS'] },
            { id: 'tree-rec-top-down', name: 'Recursion - Top Down', topics: ['Trees', 'Recursion'] },
            { id: 'tree-rec-bottom-up', name: 'Recursion - Bottom Up', topics: ['Trees', 'Recursion'] },
            { id: 'tree-max-path-sum', name: 'Path Based - Max Path Sum', topics: ['Trees', 'Dynamic Programming'] },
            { id: 'tree-diameter-height-depth', name: 'Diameter / Height / Depth', topics: ['Trees'] },
            { id: 'tree-bst', name: 'BST Operations', topics: ['Trees', 'Binary Search Tree'] },
            { id: 'tt-lca', name: 'Lowest Common Ancestor', topics: ['Trees', 'DFS', 'Binary Search Tree'] },
            { id: 'tt-serialize-deserialize', name: 'Serialization & Deserialization', topics: ['Trees', 'BFS', 'DFS'] },
        ],
    },
    {
        id: 'recursion',
        name: 'Recursion',
        topics: [],
        subPatterns: [
            { id: 'bt-decision-tree', name: 'Backtracking Exploration - Decision Tree', topics: ['Backtracking', 'Recursion'] },
            { id: 'bt-choose-explore-unchoose', name: 'Backtracking Exploration - Choose-Explore-Unchoose', topics: ['Backtracking', 'Recursion'] },
            { id: 'bt-subsets', name: 'Backtracking Exploration - Subsets (power set)', topics: ['Backtracking', 'Recursion'] },
            { id: 'bt-permutation-combination', name: 'Backtracking Exploration - PermutationsCombinations (nCr)', topics: ['Backtracking', 'Recursion'] },
            { id: 'bt-word-search-grid', name: 'Backtracking Exploration - Word search on grid', topics: ['Backtracking', 'Matrix', 'Recursion'] },
            { id: 'bt-palindrome-partitioning', name: 'Backtracking Exploration - Palindrome partitioning', topics: ['Backtracking', 'Strings', 'Recursion'] },
            { id: 'bt-pruning-state', name: 'Backtracking - Pruning / State Tracking', topics: ['Backtracking', 'Recursion'] },
            { id: 'dc-merge-sort', name: 'Divide & Conquer - Merge sort pattern', topics: ['Sorting', 'Divide & Conquer'] },
            { id: 'dc-quick-select', name: 'Divide & Conquer - Quick select (Kth largest)', topics: ['Divide & Conquer', 'Sorting', 'Heap'] },
            { id: 'dc-count-inversions', name: 'Divide & Conquer - Count inversions', topics: ['Divide & Conquer', 'Sorting'] },
        ],
    },
    {
        id: 'heap',
        name: 'Heap (Priority Queue) Patterns',
        topics: [],
        subPatterns: [
            { id: 'hp-top-k-elements', name: 'Top K Elements', topics: ['Heap', 'Priority Queue'] },
            { id: 'hp-k-way-merge', name: 'K-way Merge', topics: ['Heap'] },
            { id: 'hp-two-heaps-median', name: 'Two Heaps for Median', topics: ['Heap', 'Priority Queue'] },
            { id: 'hp-scheduling-min-cost', name: 'Scheduling / Minimum Cost', topics: ['Heap', 'Greedy'] },
            { id: 'heap-task-scheduler', name: 'Task Scheduler', topics: ['Heap', 'Greedy'] },
            { id: 'heap-meeting-rooms', name: 'Meeting Rooms', topics: ['Heap', 'Greedy'] },
            { id: 'heap-reorganize-string', name: 'Reorganize String', topics: ['Heap', 'Greedy', 'Strings'] },
            { id: 'heap-huffman', name: 'Huffman Encoding', topics: ['Heap', 'Greedy'] },
        ],
    },
    {
        id: 'graphs',
        name: 'GRAPHS',
        topics: [],
        subPatterns: [
            { id: 'graph-bfs-traversal', name: 'Traversal - BFS', topics: ['Graphs', 'BFS'] },
            { id: 'graph-dfs-traversal', name: 'Traversal - DFS', topics: ['Graphs', 'DFS'] },
            { id: 'graph-cycle-directed', name: 'Cycle Detection - Directed', topics: ['Graphs'] },
            { id: 'graph-cycle-undirected', name: 'Cycle Detection - Undirected', topics: ['Graphs'] },
            { id: 'graph-topo-bfs-dfs', name: 'Topological Sort - BFS / DFS', topics: ['Graphs', 'Topological Sort'] },
            { id: 'graph-topo-kahn', name: "Topological Sort - Kahn's algorithm (BFS in-degree)", topics: ['Graphs', 'Topological Sort'] },
            { id: 'graph-topo-dfs', name: 'Topological Sort - DFS-based topo sort', topics: ['Graphs', 'Topological Sort', 'DFS'] },
            { id: 'graph-dijkstra', name: 'Shortest Path - Dijkstra', topics: ['Graphs', 'Heap'] },
            { id: 'graph-bellman-ford', name: 'Shortest Path - Bellman-Ford', topics: ['Graphs'] },
            { id: 'graph-floyd-warshall', name: 'Shortest Path - Floyd-Warshall', topics: ['Graphs', 'Dynamic Programming'] },
            { id: 'graph-kruskal', name: 'Spanning Tree - Kruskal', topics: ['Graphs', 'Union Find'] },
            { id: 'graph-prims', name: "Spanning Tree - Prim's", topics: ['Graphs', 'Heap'] },
            { id: 'graph-union-find', name: 'Union-Find (DSU) - Detect Cycle in Undirected', topics: ['Union Find', 'Graphs'] },
            { id: 'graph-bipartite-multi-01-bfs', name: 'Bipartite / Multi-source BFS / 0-1 BFS', topics: ['Graphs', 'BFS'] },
        ],
    },

    {
        id: 'trie',
        name: 'TRIE',
        topics: [],
        subPatterns: [
            { id: 'trie-insert-search', name: 'Prefix Based - Insert/Search', topics: ['Trie', 'Strings'] },
            { id: 'trie-prefix-match', name: 'Prefix Based - Prefix Match', topics: ['Trie', 'Strings'] },
            { id: 'bitwise-trie', name: 'Bitwise Trie', topics: ['Trie', 'Bit Manipulation'] },
        ],
    },
    {
        id: 'dynamic-programming',
        name: 'DYNAMIC PROGRAMMING',
        topics: [],
        subPatterns: [
            { id: 'dp-1d', name: 'Core - 1D', topics: ['Dynamic Programming'] },
            { id: 'dp-2d', name: 'Core - 2D', topics: ['Dynamic Programming'] },
            { id: 'dp-linear', name: 'Transition Type - Linear DP', topics: ['Dynamic Programming'] },
            { id: 'dp-grid', name: 'Transition Type - Grid DP', topics: ['Dynamic Programming', 'Matrix'] },
            { id: 'dp-decision', name: 'Transition Type - Decision DP', topics: ['Dynamic Programming'] },
            { id: 'dp-knapsack', name: 'Pattern Types - Knapsack', topics: ['Dynamic Programming'] },
            { id: 'dp-sequence', name: 'Pattern Types - Sequence DP', topics: ['Dynamic Programming', 'Strings'] },
            { id: 'dp-partition', name: 'Pattern Types - Partition DP', topics: ['Dynamic Programming'] },
            { id: 'dp-interval', name: 'Pattern Types - Interval DP', topics: ['Dynamic Programming'] },
            { id: 'dp-bitmask', name: 'Advanced - Bitmask DP', topics: ['Dynamic Programming', 'Bit Manipulation'] },
            { id: 'dp-digit', name: 'Advanced - Digit DP', topics: ['Dynamic Programming', 'Math'] },
            { id: 'dp-trees', name: 'Advanced - DP on Trees', topics: ['Dynamic Programming', 'Trees'] },
            { id: 'dp-memoization', name: 'Optimization - Memoization', topics: ['Dynamic Programming', 'Recursion'] },
            { id: 'dp-tabulation', name: 'Optimization - Tabulation', topics: ['Dynamic Programming'] },
        ],
    },
    {
        id: 'greedy',
        name: 'GREEDY',
        topics: [],
        subPatterns: [
            { id: 'greedy-activity-selection', name: 'Interval Greedy - Activity Selection', topics: ['Greedy', 'Intervals'] },
            { id: 'greedy-non-overlap', name: 'Interval Greedy - Non-overlapping Intervals', topics: ['Greedy', 'Intervals'] },
            { id: 'greedy-min-removals', name: 'Interval Greedy - Minimum Removals', topics: ['Greedy', 'Intervals'] },
            { id: 'greedy-deadline-scheduling', name: 'Scheduling Greedy - Deadline Based Scheduling', topics: ['Greedy'] },
            { id: 'greedy-profit-selection', name: 'Scheduling Greedy - Profit Based Selection', topics: ['Greedy'] },
            { id: 'greedy-min-platforms', name: 'Resource Allocation - Minimum Platforms / Rooms', topics: ['Greedy', 'Heap'] },
            { id: 'greedy-meeting-rooms', name: 'Resource Allocation - Meeting Rooms', topics: ['Greedy', 'Heap'] },
            { id: 'greedy-jump-game', name: 'Jump Game Pattern', topics: ['Greedy', 'Arrays'] },
            { id: 'greedy-huffman-merge-cost', name: 'Huffman / Merge Cost', topics: ['Greedy', 'Heap'] },
        ],
    },

    {
        id: 'bit-manipulation',
        name: 'BIT MANIPULATION',
        topics: [],
        subPatterns: [
            { id: 'bit-xor-pattern', name: 'Core - XOR Pattern', topics: ['Bit Manipulation'] },
            { id: 'bit-masking', name: 'Core - Bit Masking', topics: ['Bit Manipulation'] },
            { id: 'bit-subset', name: 'Usage - Subset via Bits', topics: ['Bit Manipulation'] },
            { id: 'bit-checks', name: 'Usage - Bit Checks', topics: ['Bit Manipulation'] },
            { id: 'bit-prefix-xor', name: 'Usage - Prefix XOR', topics: ['Bit Manipulation', 'Prefix Sum'] },
        ],
    },
    {
        id: 'sorting',
        name: 'Sorting Algorithms',
        topics: [],
        subPatterns: [
            { id: 'sort-bubble', name: 'Bubble Sort', topics: ['Sorting'] },
            { id: 'sort-selection', name: 'Selection Sort', topics: ['Sorting'] },
            { id: 'sort-insertion', name: 'Insertion Sort', topics: ['Sorting'] },
            { id: 'sort-merge', name: 'Merge Sort', topics: ['Sorting', 'Divide & Conquer'] },
            { id: 'sort-quick', name: 'Quick Sort', topics: ['Sorting', 'Divide & Conquer'] },
            { id: 'sort-heap', name: 'Heap Sort', topics: ['Sorting', 'Heap'] },
            { id: 'sort-counting', name: 'Counting Sort', topics: ['Sorting'] },
            { id: 'sort-radix', name: 'Radix Sort', topics: ['Sorting'] },
            { id: 'sort-bucket', name: 'Bucket Sort', topics: ['Sorting'] },
        ],
    },
    {
        id: 'range-structures',
        name: 'RANGE STRUCTURES',
        topics: [],
        subPatterns: [
            { id: 'segment-tree-range-query', name: 'Segment Tree - Range Query', topics: ['Segment Tree', 'Trees'] },
            { id: 'segment-tree-lazy', name: 'Segment Tree - Lazy Propagation', topics: ['Segment Tree', 'Trees'] },
            { id: 'fenwick-prefix-query', name: 'Fenwick Tree - Prefix Query', topics: ['Fenwick Tree', 'Trees'] },
        ],
    },
].map((category) => ({
    ...category,
    patternIds: category.subPatterns.map((subPattern) => subPattern.id),
}));

const EXTRA_SUBPATTERN_MATCHERS = {
    'am-plus-one': {
        keywords: ['plus one'],
        topicHints: ['Arrays'],
    },
    'am-merge-sorted-array': {
        keywords: ['merge sorted array', 'merge intervals', 'merge'],
        topicHints: ['Arrays', 'Sorting'],
    },
    'am-inplace-rotation': {
        keywords: ['rotate array', 'rotate image', 'rotation'],
        topicHints: ['Arrays', 'Matrix'],
    },
    'am-spiral-traversal': {
        keywords: ['spiral'],
        topicHints: ['Matrix', 'Arrays'],
    },
    'am-set-matrix-zeroes': {
        keywords: ['set matrix zeroes', 'matrix zero'],
        topicHints: ['Matrix', 'Arrays'],
    },
    'am-product-except-self': {
        keywords: ['product except self', 'product of array except self'],
        topicHints: ['Arrays', 'Prefix Sum'],
    },
    'am-hashing-frequency': {
        keywords: ['top k frequent', 'frequency', 'anagram', 'majority element', 'good pairs'],
        topicHints: ['Hashing', 'Arrays', 'Strings'],
    },
    'am-hashing-seen-check': {
        keywords: ['contains duplicate', 'seen', 'isomorphic', 'ransom note', 'longest consecutive'],
        topicHints: ['Hashing', 'Arrays', 'Strings'],
    },
    'am-prefix-range-query': {
        keywords: ['prefix', 'subarray sum', 'contiguous array', 'range sum'],
        topicHints: ['Prefix Sum', 'Arrays'],
    },
    'am-array-cyclic-sort': {
        keywords: ['cyclic sort', 'first missing positive', 'missing positive'],
        topicHints: ['Arrays', 'Sorting'],
    },
    'll-merge-two-sorted-lists': {
        keywords: ['merge two sorted lists', 'merge k sorted lists', 'merge lists'],
        topicHints: ['Linked List'],
    },
    'll-inplace-reversal': {
        keywords: ['reverse linked list', 'reverse k group', 'in-place reversal', 'reverse list'],
        topicHints: ['Linked List'],
    },
    'll-intersection-detection': {
        keywords: ['intersection of two linked lists', 'intersection detection', 'detect cycle'],
        topicHints: ['Linked List', 'Two Pointers'],
    },
    'll-addition-of-numbers': {
        keywords: ['add two numbers', 'addition of numbers'],
        topicHints: ['Linked List'],
    },
    'll-reordering-partitioning': {
        keywords: ['reorder list', 'partition list', 'odd even linked list', 'reordering'],
        topicHints: ['Linked List', 'Two Pointers'],
    },
    'tt-recursive-preorder': {
        keywords: ['preorder traversal', 'preorder'],
        topicHints: ['Trees', 'DFS'],
    },
    'tt-recursive-inorder': {
        keywords: ['inorder traversal', 'inorder', 'validate bst'],
        topicHints: ['Trees', 'DFS', 'Binary Search Tree'],
    },
    'tt-recursive-postorder': {
        keywords: ['postorder traversal', 'postorder'],
        topicHints: ['Trees', 'DFS'],
    },
    'tt-level-order': {
        keywords: ['level order traversal', 'zigzag level order', 'right side view', 'level order'],
        topicHints: ['Trees', 'BFS'],
    },
    'tt-lca': {
        keywords: ['lowest common ancestor', 'lca'],
        topicHints: ['Trees', 'DFS', 'Binary Search Tree'],
    },
    'tt-serialize-deserialize': {
        keywords: ['serialize and deserialize', 'serialize', 'deserialize'],
        topicHints: ['Trees', 'BFS', 'DFS'],
    },
    'sw-char-frequency-matching': {
        keywords: ['anagram', 'permutation in string', 'frequency', 'character replacement', 'minimum window substring'],
        topicHints: ['Sliding Window', 'Strings', 'Hashing'],
    },
    'swp-fixed-size': {
        keywords: ['fixed size window', 'maximum average subarray', 'max sum subarray', 'window'],
        topicHints: ['Sliding Window', 'Arrays'],
    },
    'swp-variable-size': {
        keywords: ['variable size window', 'minimum window substring', 'longest substring', 'sliding window'],
        topicHints: ['Sliding Window', 'Arrays', 'Strings'],
    },
    'swp-char-frequency': {
        keywords: ['character frequency', 'anagram', 'permutation in string', 'character replacement'],
        topicHints: ['Sliding Window', 'Strings', 'Hashing'],
    },
    'swp-monotonic-queue': {
        keywords: ['sliding window maximum', 'monotonic queue', 'deque', 'max min window'],
        topicHints: ['Sliding Window', 'Queue', 'Arrays'],
    },
    'sp-valid-parentheses': {
        keywords: ['valid parentheses', 'balanced parentheses', 'parentheses'],
        topicHints: ['Stack', 'Strings'],
    },
    'sp-min-stack-design': {
        keywords: ['min stack', 'min stack design'],
        topicHints: ['Stack'],
    },
    'sp-simulation-backtracking': {
        keywords: ['backtracking', 'simulation', 'generate parentheses', 'daily temperatures'],
        topicHints: ['Stack', 'Backtracking'],
    },
    'sp-expression-evaluation': {
        keywords: ['evaluate reverse polish notation', 'expression', 'calculator', 'postfix', 'infix'],
        topicHints: ['Stack', 'Strings'],
    },
    'sp-monotonic-stack': {
        keywords: ['monotonic stack', 'next greater', 'next smaller', 'daily temperatures'],
        topicHints: ['Stack', 'Arrays'],
    },
    'sp-largest-rectangle': {
        keywords: ['largest rectangle in histogram', 'histogram', 'max rectangle'],
        topicHints: ['Stack', 'Arrays'],
    },
    'hp-top-k-elements': {
        keywords: ['top k frequent', 'k closest', 'kth largest', 'top k elements'],
        topicHints: ['Heap', 'Priority Queue'],
    },
    'hp-k-way-merge': {
        keywords: ['k-way merge', 'merge k sorted lists', 'merge k sorted arrays'],
        topicHints: ['Heap'],
    },
    'hp-two-heaps-median': {
        keywords: ['find median from data stream', 'two heaps', 'median'],
        topicHints: ['Heap', 'Priority Queue'],
    },
    'hp-scheduling-min-cost': {
        keywords: ['task scheduler', 'minimum cost', 'meeting rooms', 'schedule'],
        topicHints: ['Heap', 'Greedy'],
    },
    'bsp-sorted-array-search': {
        keywords: ['binary search', 'search insert position', 'sorted array search'],
        topicHints: ['Binary Search', 'Arrays'],
    },
    'bsp-first-last': {
        keywords: ['first and last position', 'first/last occurrence', 'search range'],
        topicHints: ['Binary Search', 'Arrays'],
    },
    'bsp-rotated-min-max': {
        keywords: ['rotated sorted array', 'find min', 'rotated array min', 'search in rotated sorted array'],
        topicHints: ['Binary Search', 'Arrays'],
    },
    'bsp-on-answer': {
        keywords: ['koko eating bananas', 'capacity to ship', 'minimum days', 'binary search on answer'],
        topicHints: ['Binary Search'],
    },
    'bsp-median-kth-two-arrays': {
        keywords: ['median of two sorted arrays', 'kth element of two sorted arrays', 'median/kth of two arrays'],
        topicHints: ['Binary Search', 'Arrays'],
    },
    'gtp-dfs-connected-islands': {
        keywords: ['number of islands', 'island counting', 'count connected components', 'connected components'],
        topicHints: ['Graphs', 'DFS'],
    },
    'gtp-bfs-connected-islands': {
        keywords: ['number of islands', 'island counting', 'connected components', 'bfs'],
        topicHints: ['Graphs', 'BFS'],
    },
    'gtp-deep-copy-cloning': {
        keywords: ['clone graph', 'deep copy', 'copy graph', 'cloning'],
        topicHints: ['Graphs', 'DFS', 'BFS'],
    },
    'gtp-dfs-cycle-directed': {
        keywords: ['cycle detection directed', 'find cycle in directed graph', 'course schedule'],
        topicHints: ['Graphs', 'DFS'],
    },
    'gtp-bfs-topo-kahn': {
        keywords: ['topological sort', 'kahn', 'course schedule ii', 'indegree'],
        topicHints: ['Graphs', 'BFS', 'Topological Sort'],
    },
    'gtp-union-find-dsu': {
        keywords: ['union find', 'disjoint set', 'dsu', 'redundant connection'],
        topicHints: ['Graphs', 'Union Find'],
    },
    'gtp-shortest-bellman-bfsk': {
        keywords: ['bellman ford', 'cheapest flights within k stops', 'shortest path with k stops'],
        topicHints: ['Graphs', 'BFS'],
    },
    'gtp-shortest-dijkstra': {
        keywords: ['dijkstra', 'network delay time', 'shortest path'],
        topicHints: ['Graphs', 'Heap'],
    },
    'gtp-bidirectional-bfs': {
        keywords: ['word ladder', 'bidirectional bfs', 'double ended bfs'],
        topicHints: ['Graphs', 'BFS'],
    },
    'gtp-minimum-spanning-tree': {
        keywords: ['minimum spanning tree', 'mst', 'kruskal', 'prim'],
        topicHints: ['Graphs', 'Union Find', 'Heap'],
    },
    'gtp-bridges-articulation': {
        keywords: ['critical connections', 'bridges', 'articulation points', 'tarjan'],
        topicHints: ['Graphs', 'DFS'],
    },
    'gdp-sorting-based-greedy': {
        keywords: ['assign cookies', 'candy', 'sorting greedy', 'maximize profit'],
        topicHints: ['Greedy', 'Sorting'],
    },
    'gdp-interval-merging-scheduling': {
        keywords: ['merge intervals', 'non-overlapping intervals', 'interval scheduling', 'erase overlap intervals'],
        topicHints: ['Greedy', 'Intervals'],
    },
    'gdp-jump-game-reachability-min': {
        keywords: ['jump game', 'jump game ii', 'minimum jumps', 'reachability'],
        topicHints: ['Greedy', 'Arrays'],
    },
    'gdp-buy-sell-stock': {
        keywords: ['best time to buy and sell stock', 'buy sell stock', 'max profit'],
        topicHints: ['Greedy', 'Arrays'],
    },
    'gdp-task-scheduling': {
        keywords: ['task scheduler', 'schedule tasks', 'minimum intervals'],
        topicHints: ['Greedy', 'Heap'],
    },
    'gdp-gas-station-circuit': {
        keywords: ['gas station', 'circuit'],
        topicHints: ['Greedy', 'Arrays'],
    },
    'gdp-line-sweep': {
        keywords: ['line sweep', 'meeting rooms', 'car pooling', 'sweep line'],
        topicHints: ['Greedy', 'Intervals'],
    },
    'bkp-subsets': {
        keywords: ['subsets', 'power set'],
        topicHints: ['Backtracking', 'Recursion'],
    },
    'bkp-permutations': {
        keywords: ['permutations', 'next permutation'],
        topicHints: ['Backtracking', 'Recursion'],
    },
    'bkp-combination-sum': {
        keywords: ['combination sum', 'combination sum ii', 'combination'],
        topicHints: ['Backtracking', 'Recursion'],
    },
    'bkp-parentheses-generation': {
        keywords: ['generate parentheses', 'parentheses generation'],
        topicHints: ['Backtracking', 'Recursion', 'Strings'],
    },
    'bkp-word-search-grid-path': {
        keywords: ['word search', 'grid path', 'exist'],
        topicHints: ['Backtracking', 'Recursion', 'Matrix'],
    },
    'bkp-palindrome-partitioning': {
        keywords: ['palindrome partitioning', 'partition string'],
        topicHints: ['Backtracking', 'Recursion', 'Strings'],
    },
    'bkp-nqueens-constraint': {
        keywords: ['n-queens', 'constraint satisfaction', 'sudoku solver'],
        topicHints: ['Backtracking', 'Recursion'],
    },
    'dpp-fibonacci-style': {
        keywords: ['fibonacci', 'climbing stairs', 'house robber', 'tribonacci'],
        topicHints: ['Dynamic Programming'],
    },
    'dpp-kadane-max-min-subarray': {
        keywords: ['maximum subarray', 'minimum subarray', 'kadane', 'max/min subarray'],
        topicHints: ['Dynamic Programming', 'Arrays'],
    },
    'dpp-unique-paths': {
        keywords: ['unique paths', 'minimum path sum', 'grid dp'],
        topicHints: ['Dynamic Programming', 'Matrix'],
    },
    'dpp-01-knapsack': {
        keywords: ['0/1 knapsack', 'partition equal subset sum', 'target sum'],
        topicHints: ['Dynamic Programming'],
    },
    'dpp-coin-change': {
        keywords: ['coin change', 'coin change 2'],
        topicHints: ['Dynamic Programming'],
    },
    'dpp-lcs': {
        keywords: ['longest common subsequence', 'lcs'],
        topicHints: ['Dynamic Programming', 'Strings'],
    },
    'dpp-word-break': {
        keywords: ['word break', 'word break ii'],
        topicHints: ['Dynamic Programming', 'Strings'],
    },
    'dpp-lis': {
        keywords: ['longest increasing subsequence', 'lis'],
        topicHints: ['Dynamic Programming', 'Arrays', 'Binary Search'],
    },
    'dpp-stock-problems': {
        keywords: ['best time to buy and sell stock', 'stock with cooldown', 'stock with transaction fee'],
        topicHints: ['Dynamic Programming', 'Arrays'],
    },
    'dpp-edit-distance': {
        keywords: ['edit distance', 'levenshtein'],
        topicHints: ['Dynamic Programming', 'Strings'],
    },
    'dpp-interval-dp': {
        keywords: ['burst balloons', 'palindrome partitioning ii', 'interval dp'],
        topicHints: ['Dynamic Programming'],
    },
    'smp-anagram-check': {
        keywords: ['valid anagram', 'anagram check', 'group anagrams'],
        topicHints: ['Strings', 'Hashing'],
    },
    'smp-palindrome-check': {
        keywords: ['valid palindrome', 'palindrome check', 'palindrome'],
        topicHints: ['Strings', 'Two Pointers'],
    },
    'smp-repeated-substring-detection': {
        keywords: ['repeated substring pattern', 'repeated substring detection'],
        topicHints: ['Strings'],
    },
    'smp-naive-kmp-rk-search': {
        keywords: ['find the index of the first occurrence', 'strstr', 'kmp', 'rabin karp'],
        topicHints: ['Strings', 'Hashing'],
    },
    'smp-integer-roman-conversion': {
        keywords: ['roman to integer', 'integer to roman'],
        topicHints: ['Strings', 'Math'],
    },
    'smp-multiply-strings': {
        keywords: ['multiply strings'],
        topicHints: ['Strings', 'Math'],
    },
    'bmp-power-two-four': {
        keywords: ['power of two', 'power of four'],
        topicHints: ['Bit Manipulation', 'Math'],
    },
    'bmp-bitwise-and-setbit-count': {
        keywords: ['number of 1 bits', 'hamming weight', 'count set bits', 'bitwise and'],
        topicHints: ['Bit Manipulation'],
    },
    'bmp-bitwise-xor-single-missing': {
        keywords: ['single number', 'missing number', 'xor'],
        topicHints: ['Bit Manipulation'],
    },
    'bmp-bitwise-dp-counting-bits': {
        keywords: ['counting bits', 'bitwise dp'],
        topicHints: ['Bit Manipulation', 'Dynamic Programming'],
    },
    'dsp-general-design': {
        keywords: ['design', 'design hashmap', 'design twitter', 'design add and search words', 'lru cache'],
        topicHints: ['Design', 'Hashing', 'Arrays', 'Strings'],
    },
    'dsp-tries': {
        keywords: ['implement trie', 'trie', 'word dictionary', 'prefix tree'],
        topicHints: ['Trie', 'Strings'],
    },
    'sfp-fenwick-prefix-inversions': {
        keywords: ['fenwick tree', 'binary indexed tree', 'prefix queries', 'count inversions'],
        topicHints: ['Fenwick Tree', 'Trees'],
    },
    'sfp-segment-range-point-update': {
        keywords: ['segment tree', 'range sum query', 'point update'],
        topicHints: ['Segment Tree', 'Trees'],
    },
};

const FIXED_PATTERN_PROBLEM_COUNTS = {
    'am-plus-one': 4,
    'am-merge-sorted-array': 2,
    'am-inplace-rotation': 3,
    'am-spiral-traversal': 4,
    'am-set-matrix-zeroes': 3,
    'am-product-except-self': 2,
    'am-hashing-frequency': 6,
    'am-hashing-seen-check': 6,
    'am-prefix-range-query': 6,
    'am-array-cyclic-sort': 5,
    'swp-fixed-size': 4,
    'swp-variable-size': 4,
    'swp-char-frequency': 4,
    'swp-monotonic-queue': 4,
    'sp-valid-parentheses': 4,
    'sp-min-stack-design': 4,
    'sp-simulation-backtracking': 4,
    'sp-expression-evaluation': 4,
    'sp-monotonic-stack': 4,
    'sp-largest-rectangle': 4,
    'hp-top-k-elements': 4,
    'hp-k-way-merge': 4,
    'hp-two-heaps-median': 4,
    'hp-scheduling-min-cost': 4,
    'bsp-sorted-array-search': 4,
    'bsp-first-last': 4,
    'bsp-rotated-min-max': 4,
    'bsp-on-answer': 4,
    'bsp-median-kth-two-arrays': 4,
    'gtp-dfs-connected-islands': 4,
    'gtp-bfs-connected-islands': 4,
    'gtp-deep-copy-cloning': 4,
    'gtp-dfs-cycle-directed': 4,
    'gtp-bfs-topo-kahn': 4,
    'gtp-union-find-dsu': 4,
    'gtp-shortest-bellman-bfsk': 4,
    'gtp-shortest-dijkstra': 4,
    'gtp-bidirectional-bfs': 4,
    'gtp-minimum-spanning-tree': 4,
    'gtp-bridges-articulation': 4,
    'gdp-sorting-based-greedy': 4,
    'gdp-interval-merging-scheduling': 4,
    'gdp-jump-game-reachability-min': 4,
    'gdp-buy-sell-stock': 4,
    'gdp-task-scheduling': 4,
    'gdp-gas-station-circuit': 4,
    'gdp-line-sweep': 4,
    'bkp-subsets': 4,
    'bkp-permutations': 4,
    'bkp-combination-sum': 4,
    'bkp-parentheses-generation': 4,
    'bkp-word-search-grid-path': 4,
    'bkp-palindrome-partitioning': 4,
    'bkp-nqueens-constraint': 4,
    'dpp-fibonacci-style': 4,
    'dpp-kadane-max-min-subarray': 4,
    'dpp-unique-paths': 4,
    'dpp-01-knapsack': 4,
    'dpp-coin-change': 4,
    'dpp-lcs': 4,
    'dpp-word-break': 4,
    'dpp-lis': 4,
    'dpp-stock-problems': 4,
    'dpp-edit-distance': 4,
    'dpp-interval-dp': 4,
    'smp-anagram-check': 4,
    'smp-palindrome-check': 4,
    'smp-repeated-substring-detection': 4,
    'smp-naive-kmp-rk-search': 4,
    'smp-integer-roman-conversion': 4,
    'smp-multiply-strings': 4,
    'bmp-power-two-four': 4,
    'bmp-bitwise-and-setbit-count': 4,
    'bmp-bitwise-xor-single-missing': 4,
    'bmp-bitwise-dp-counting-bits': 4,
    'dsp-general-design': 4,
    'dsp-tries': 4,
    'sfp-fenwick-prefix-inversions': 4,
    'sfp-segment-range-point-update': 4,
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const FREQUENCIES = ['high', 'medium', 'low'];
const TIME_ESTIMATES = [10, 15, 20, 25, 30, 45];

// Daily challenge: deterministic pick based on date
function getDailyChallenge() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return PROBLEMS[seed % PROBLEMS.length];
}

// Top companies for quick prep
const QUICK_PREP_COMPANIES = ['google', 'amazon', 'meta', 'microsoft', 'apple'];
const ITEMS_PER_PAGE = 30;

// Study plan presets
const STUDY_PLANS = [
    { id: 'top-interview-150', label: '🏆 Interview Top 150', desc: 'LeetCode Top Interview 150', filter: p => p.studyPlans && p.studyPlans.includes('top-interview-150') },
    { id: 'beginner', label: '🌱 Beginner 50', desc: 'Easy problems to build confidence', filter: p => p.difficulty === 'Easy', limit: 50 },
    { id: 'top-medium', label: '🔥 Top Medium', desc: 'Most asked medium problems', filter: p => p.difficulty === 'Medium' && p.frequency === 'high', limit: 50 },
    { id: 'hard-grind', label: '💪 Hard Grind', desc: 'Challenge yourself', filter: p => p.difficulty === 'Hard', limit: 30 },
    { id: 'arrays-strings', label: '📚 Arrays & Strings', desc: 'Foundation topics', filter: p => p.topics.includes('Arrays') || p.topics.includes('Strings'), limit: 50 },
    { id: 'trees-graphs', label: '🌳 Trees & Graphs', desc: 'Tree and graph mastery', filter: p => p.topics.includes('Trees') || p.topics.includes('Graphs'), limit: 40 },
    { id: 'dp-master', label: '🧠 DP Master', desc: 'Dynamic programming focus', filter: p => p.topics.includes('Dynamic Programming'), limit: 45 },
];



// Calculate streak from solved dates
function calcStreak() {
    try {
        const dates = JSON.parse(localStorage.getItem('cl_solve_dates') || '[]');
        if (!dates.length) return 0;
        const unique = [...new Set(dates)].sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        let streak = 0;
        for (let i = 0; i < unique.length; i++) {
            const expected = new Date();
            expected.setDate(expected.getDate() - i);
            const exp = expected.toISOString().slice(0, 10);
            if (unique[i] === exp || (i === 0 && unique[0] === new Date(Date.now() - 86400000).toISOString().slice(0, 10))) {
                streak++;
            } else if (i === 0 && unique[0] !== today) {
                // check if yesterday
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                if (unique[0] === yesterday) { streak = 1; continue; }
                break;
            } else break;
        }
        return streak;
    } catch { return 0; }
}

function getWeekSolved() {
    try {
        const dates = JSON.parse(localStorage.getItem('cl_solve_dates') || '[]');
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().slice(0, 10);
        return dates.filter(d => d >= weekStr).length;
    } catch { return 0; }
}

function useProblemExplorerState() {
    const [search, setSearch] = useState('');
    const [selectedDifficulties, setSelectedDifficulties] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [selectedPatterns, setSelectedPatterns] = useState([]);
    const [selectedFrequency, setSelectedFrequency] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [hideSolved, setHideSolved] = useState(false);
    const [activePlan, setActivePlan] = useState(null);
    const [viewMode, setViewMode] = useState('patterns'); // 'patterns' | 'all'
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(() => {
        try { return parseInt(localStorage.getItem('cl_weekly_goal') || '7'); } catch { return 7; }
    });
    const [showGoalEdit, setShowGoalEdit] = useState(false);
    const [showTopicMastery, setShowTopicMastery] = useState(false);
    const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
    const [activeNote, setActiveNote] = useState(null); // problemId being edited
    const [noteText, setNoteText] = useState('');
    const [expandedPatterns, setExpandedPatterns] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubPatterns, setExpandedSubPatterns] = useState({});
    const [solvedSet, setSolvedSet] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('cl_solved') || '[]')); } catch { return new Set(); }
    });
    const [bookmarks, setBookmarks] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('cl_bookmarks') || '[]')); } catch { return new Set(); }
    });
    const [notes, setNotes] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cl_notes') || '{}'); } catch { return {}; }
    });
    const [recentlyViewed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cl_recent') || '[]'); } catch { return []; }
    });

    return {
        search,
        setSearch,
        selectedDifficulties,
        setSelectedDifficulties,
        selectedTopics,
        setSelectedTopics,
        selectedCompanies,
        setSelectedCompanies,
        selectedPatterns,
        setSelectedPatterns,
        selectedFrequency,
        setSelectedFrequency,
        maxTime,
        setMaxTime,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        showFilters,
        setShowFilters,
        showBookmarksOnly,
        setShowBookmarksOnly,
        hideSolved,
        setHideSolved,
        activePlan,
        setActivePlan,
        viewMode,
        setViewMode,
        page,
        setPage,
        isLoading,
        setIsLoading,
        initialLoading,
        setInitialLoading,
        weeklyGoal,
        setWeeklyGoal,
        showGoalEdit,
        setShowGoalEdit,
        showTopicMastery,
        setShowTopicMastery,
        showRecentlyViewed,
        setShowRecentlyViewed,
        activeNote,
        setActiveNote,
        noteText,
        setNoteText,
        expandedPatterns,
        setExpandedPatterns,
        expandedCategories,
        setExpandedCategories,
        expandedSubPatterns,
        setExpandedSubPatterns,
        solvedSet,
        setSolvedSet,
        bookmarks,
        setBookmarks,
        notes,
        setNotes,
        recentlyViewed,
    };
}

export default function ProblemExplorer() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const {
        search,
        setSearch,
        selectedDifficulties,
        setSelectedDifficulties,
        selectedTopics,
        setSelectedTopics,
        selectedCompanies,
        setSelectedCompanies,
        selectedPatterns,
        setSelectedPatterns,
        selectedFrequency,
        setSelectedFrequency,
        maxTime,
        setMaxTime,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        showFilters,
        setShowFilters,
        showBookmarksOnly,
        setShowBookmarksOnly,
        hideSolved,
        setHideSolved,
        activePlan,
        setActivePlan,
        viewMode,
        setViewMode,
        page,
        setPage,
        isLoading,
        setIsLoading,
        initialLoading,
        setInitialLoading,
        weeklyGoal,
        setWeeklyGoal,
        showGoalEdit,
        setShowGoalEdit,
        showTopicMastery,
        setShowTopicMastery,
        showRecentlyViewed,
        setShowRecentlyViewed,
        activeNote,
        setActiveNote,
        noteText,
        setNoteText,
        expandedPatterns,
        setExpandedPatterns,
        expandedCategories,
        setExpandedCategories,
        expandedSubPatterns,
        setExpandedSubPatterns,
        solvedSet,
        setSolvedSet,
        bookmarks,
        setBookmarks,
        notes,
        setNotes,
        recentlyViewed,
    } = useProblemExplorerState();

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const streak = useMemo(() => calcStreak(), []);
    const weekSolved = useMemo(() => getWeekSolved(), []);

    const dsaPatterns = useMemo(() => {
        const basePatternsById = new Map(baseDsaPatterns.map((pattern) => [pattern.id, pattern]));

        // ── Global registry: first-match-wins deduplication ──
        const assignedProblemIds = new Set();
        const results = [];

        // First pass: collect all problem IDs from base (pre-existing) patterns
        // so dynamically-matched sub-patterns won't duplicate them
        for (const category of PATTERN_CATEGORIES) {
            for (const subPattern of category.subPatterns) {
                const existing = basePatternsById.get(subPattern.id);
                if (existing) {
                    (existing.problems || []).forEach(p => assignedProblemIds.add(p.id));
                }
            }
        }

        // Second pass: build each sub-pattern with deduplication
        for (const category of PATTERN_CATEGORIES) {
            for (const subPattern of category.subPatterns) {
                const existing = basePatternsById.get(subPattern.id);
                if (existing) {
                    results.push(existing);
                    continue;
                }

                const topicSet = new Set([...(category.topics || []), ...(subPattern.topics || [])]);
                const matcher = EXTRA_SUBPATTERN_MATCHERS[subPattern.id];

                const scoredProblems = PROBLEMS
                    .filter((problem) => !assignedProblemIds.has(problem.id))   // skip already-assigned
                    .map((problem) => {
                        const title = String(problem.title || '').toLowerCase();
                        const topics = problem.topics || [];
                        const hasTopicMatch = topics.some((topic) => topicSet.has(topic));

                        let score = hasTopicMatch ? 1 : 0;

                        if (matcher) {
                            const keywordHits = (matcher.keywords || []).reduce((count, keyword) => (
                                title.includes(String(keyword).toLowerCase()) ? count + 1 : count
                            ), 0);

                            const hintTopicHits = (matcher.topicHints || []).reduce((count, hint) => (
                                topics.includes(hint) ? count + 1 : count
                            ), 0);

                            score += (keywordHits * 4) + (hintTopicHits * 2);
                        }

                        return { problem, score };
                    });

                let matchedProblems = scoredProblems
                    .filter(({ score }) => score > 0)
                    .sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return String(a.problem.id).localeCompare(String(b.problem.id));
                    })
                    .map(({ problem }) => problem);

                const targetCount = FIXED_PATTERN_PROBLEM_COUNTS[subPattern.id] ?? (matcher ? 12 : undefined);
                if (typeof targetCount === 'number') matchedProblems = matchedProblems.slice(0, targetCount);

                // Register these problems as assigned
                matchedProblems.forEach(p => assignedProblemIds.add(p.id));

                const fallbackProblems = matchedProblems.map((problem) => ({
                    id: problem.id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    status: solvedSet.has(problem.id) ? 'solved' : 'pending',
                    leetcodeLink: problem.leetcodeLink,
                    link: `/problem/${problem.id}`,
                }));

                results.push({
                    id: subPattern.id,
                    name: subPattern.name,
                    category: category.name,
                    difficulty: 'Mixed',
                    description: `${subPattern.name} practice track`,
                    theory: '',
                    examples: [],
                    problems: fallbackProblems,
                });
            }
        }

        return results;
    }, [solvedSet]);

    // Simulate smooth initial loading
    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 700);
        return () => clearTimeout(timer);
    }, []);

    const toggleListItem = (list, setter, item) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const toggleBookmark = useCallback((e, problemId) => {
        e.stopPropagation();
        setBookmarks(prev => {
            const next = new Set(prev);
            if (next.has(problemId)) next.delete(problemId);
            else next.add(problemId);
            localStorage.setItem('cl_bookmarks', JSON.stringify([...next]));
            return next;
        });
    }, []);





    const saveNote = useCallback((problemId, text) => {
        setNotes(prev => {
            const next = { ...prev };
            if (text.trim()) next[problemId] = text.trim();
            else delete next[problemId];
            localStorage.setItem('cl_notes', JSON.stringify(next));
            return next;
        });
        setActiveNote(null);
    }, []);

    const openNote = useCallback((e, problemId) => {
        e.stopPropagation();
        setActiveNote(problemId);
        setNoteText(notes[problemId] || '');
    }, [notes]);

    // Track recently viewed when navigating
    const goToProblem = useCallback((problemId) => {
        const recent = JSON.parse(localStorage.getItem('cl_recent') || '[]');
        const updated = [problemId, ...recent.filter(id => id !== problemId)].slice(0, 10);
        localStorage.setItem('cl_recent', JSON.stringify(updated));
        navigate(`/code-editor/${problemId}`);
    }, [navigate]);

    const filteredProblems = useMemo(() => {
        return filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks,
            solvedSet,
            filters: {
                showBookmarksOnly,
                hideSolved,
                activePlan,
                search,
                selectedDifficulties,
                selectedTopics,
                selectedCompanies,
                selectedPatterns,
                selectedFrequency,
                maxTime,
                sortBy,
                sortDir,
            },
        });
    }, [search, selectedDifficulties, selectedTopics, selectedCompanies, selectedPatterns, selectedFrequency, maxTime, sortBy, sortDir, showBookmarksOnly, hideSolved, activePlan, bookmarks, solvedSet]);

    const diffCounts = getDifficultyCounts();
    const activeFilterCount = selectedDifficulties.length + selectedTopics.length + selectedCompanies.length + selectedPatterns.length + (selectedFrequency ? 1 : 0) + (maxTime ? 1 : 0);

    // Auto-switch to "All Questions" when any filter is active
    useEffect(() => {
        if (activeFilterCount > 0 || search || activePlan) {
            setViewMode('all');
        }
    }, [activeFilterCount, search, activePlan]);

    const clearAll = () => {
        setSelectedDifficulties([]);
        setSelectedTopics([]);
        setSelectedCompanies([]);
        setSelectedPatterns([]);
        setSelectedFrequency('');
        setMaxTime('');
        setSearch('');
        setShowBookmarksOnly(false);
        setHideSolved(false);
        setActivePlan(null);
        setPage(1);
    };

    const handleSort = (key) => {
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('asc'); }
    };

    const diffColor = (d) => d === 'Easy' ? '#6ee7b7' : d === 'Medium' ? '#fbbf24' : '#f87171';
    const freqColor = (f) => f === 'high' ? '#f87171' : f === 'medium' ? '#fbbf24' : '#6ee7b7';

    const getExplanationSnippet = useCallback((problem) => {
        const base = (problem.explanation || problem.description || '').trim();
        if (!base) return 'No explanation available yet.';
        return base.length > 140 ? `${base.slice(0, 137)}...` : base;
    }, []);

    const pickRandom = () => {
        const pool = filteredProblems.length > 0 ? filteredProblems : PROBLEMS;
        const random = pool[Math.floor(Math.random() * pool.length)];
        goToProblem(random.id);
    };

    // Quick company prep
    const quickPrep = (companyId) => {
        setSelectedCompanies([companyId]);
        setSelectedDifficulties([]);
        setSelectedTopics([]);
        setSelectedPatterns([]);
        setSelectedFrequency('');
        setMaxTime('');
        setSearch('');
        setShowBookmarksOnly(false);
        setHideSolved(false);
        setActivePlan(null);
        setPage(1);
    };

    // Topic mastery data
    const topicMastery = useMemo(() => {
        return TOPICS.map(topic => {
            const topicProblems = PROBLEMS.filter(p => p.topics.includes(topic));
            const solved = topicProblems.filter(p => solvedSet.has(p.id)).length;
            return { topic, total: topicProblems.length, solved, percent: topicProblems.length > 0 ? Math.round((solved / topicProblems.length) * 100) : 0 };
        }).sort((a, b) => b.total - a.total);
    }, [solvedSet]);

    // Progress calculations
    const solvedCount = solvedSet.size;
    const totalCount = PROBLEMS.length;
    const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
    const solvedInFiltered = filteredProblems.filter(p => solvedSet.has(p.id)).length;

    // Recently viewed problems
    const recentProblems = useMemo(() => {
        return recentlyViewed.map(id => PROBLEMS.find(p => p.id === id)).filter(Boolean).slice(0, 5);
    }, [recentlyViewed]);

    return (
        <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'} selection:bg-purple-500/30`} style={{ scrollBehavior: 'smooth' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.06), transparent 70%)' : 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.10), transparent 70%)' }} />
            <style>{`
                @keyframes shimmer-border { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
                @keyframes fade-up-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes skeleton-pulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.08; } }
            `}</style>

            <ProblemExplorerNotesModal
                activeNote={activeNote}
                setActiveNote={setActiveNote}
                isLight={isLight}
                problems={PROBLEMS}
                noteText={noteText}
                setNoteText={setNoteText}
                saveNote={saveNote}
            />

            <div className="max-w-7xl mx-auto px-6 py-8 pt-24 relative z-10">
                {/* Header */}
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{
                            fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            background: 'linear-gradient(135deg, #c084fc, #a78bfa, #67e8f9, #6ee7b7)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            textShadow: 'none',
                        }}>Problem Explorer</h1>
                        <p style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', animation: 'pulse-glow 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(110,231,183,0.4)' }} />
                            {PROBLEMS.length} original problems • {TOPICS.length} topics • {COMPANIES.length} companies
                        </p>
                    </div>
                    <button onClick={pickRandom} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                        background: isLight ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(110,231,183,0.08))' : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(110,231,183,0.1))',
                        border: isLight ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.25)', color: isLight ? '#7c3aed' : '#e9d5ff',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
                        boxShadow: '0 0 15px rgba(139,92,246,0.08)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(110,231,183,0.15))'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(139,92,246,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(110,231,183,0.1))'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(139,92,246,0.08)'; }}
                    >
                        <Shuffle size={16} />
                        Surprise Me
                    </button>
                </div>

                {/* Stats Bar */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    {DIFFICULTIES.map(d => (
                        <div key={d} style={{
                            padding: '8px 14px', borderRadius: 12,
                            background: `${diffColor(d)}08`, border: `1px solid ${diffColor(d)}20`,
                            display: 'flex', alignItems: 'center', gap: 6,
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            boxShadow: `0 0 12px ${diffColor(d)}08, inset 0 1px 0 rgba(255,255,255,0.04)`,
                            transition: 'all 0.25s ease', cursor: 'default',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${diffColor(d)}15, inset 0 1px 0 rgba(255,255,255,0.06)`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 12px ${diffColor(d)}08, inset 0 1px 0 rgba(255,255,255,0.04)`; }}
                        >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: diffColor(d), boxShadow: `0 0 6px ${diffColor(d)}60` }} />
                            <span style={{ fontSize: 13, color: diffColor(d), fontWeight: 700 }}>{diffCounts[d]}</span>
                            <span style={{ fontSize: 12, color: isLight ? '#475569' : 'rgba(255,255,255,0.4)' }}>{d}</span>
                        </div>
                    ))}

                    {/* Progress Ring */}
                    <div style={{
                        padding: '8px 14px', borderRadius: 12,
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 0 12px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                        transition: 'all 0.25s ease',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'; }}
                    >
                        <div style={{ position: 'relative', width: 28, height: 28 }}>
                            <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="14" cy="14" r="11" stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="3" fill="none" />
                                <circle cx="14" cy="14" r="11" stroke="url(#progressGrad)" strokeWidth="3" fill="none"
                                    strokeDasharray={`${2 * Math.PI * 11}`}
                                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - progressPercent / 100)}`}
                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 3px rgba(167,139,250,0.4))' }} />
                                <defs><linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#6ee7b7" /></linearGradient></defs>
                            </svg>
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#a78bfa' }}>
                                {progressPercent}%
                            </span>
                        </div>
                        <div>
                            <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 700 }}>{solvedCount}</span>
                            <span style={{ fontSize: 12, color: isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>/{totalCount}</span>
                        </div>
                    </div>

                    {/* Bookmarks Toggle */}
                    <button onClick={() => setShowBookmarksOnly(b => !b)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showBookmarksOnly ? 'rgba(251,191,36,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: showBookmarksOnly ? '1px solid rgba(251,191,36,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Bookmark size={14} color={showBookmarksOnly ? '#fbbf24' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} fill={showBookmarksOnly ? '#fbbf24' : 'none'} />
                        <span style={{ fontSize: 13, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#475569' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{bookmarks.size}</span>
                        <span style={{ fontSize: 12, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Saved</span>
                    </button>

                    {/* Streak Badge */}
                    <div style={{
                        padding: '8px 14px', borderRadius: 10,
                        background: streak > 0 ? 'rgba(251,146,60,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: streak > 0 ? '1px solid rgba(251,146,60,0.25)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Flame size={14} color={streak > 0 ? '#fb923c' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: streak > 0 ? '#fb923c' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)' }}>{streak}</span>
                        <span style={{ fontSize: 11, color: streak > 0 ? 'rgba(251,146,60,0.7)' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.25)' }}>Streak</span>
                    </div>

                    {/* Weekly Goal */}
                    <div onClick={() => setShowGoalEdit(g => !g)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(103,232,249,0.06)', border: '1px solid rgba(103,232,249,0.15)',
                        display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                    }}>
                        <Target size={14} color='#67e8f9' />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 10, color: 'rgba(103,232,249,0.7)' }}>Week Goal</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 50, height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, (weekSolved / weeklyGoal) * 100)}%`, height: '100%', background: weekSolved >= weeklyGoal ? '#6ee7b7' : '#67e8f9', borderRadius: 2, transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: weekSolved >= weeklyGoal ? '#6ee7b7' : '#67e8f9' }}>{weekSolved}/{weeklyGoal}</span>
                            </div>
                        </div>
                        {showGoalEdit && (
                            <div onClick={e => e.stopPropagation()} style={{
                                position: 'absolute', top: '110%', left: 0, zIndex: 20, padding: 12, borderRadius: 10,
                                background: isLight ? '#fff' : 'rgba(15,15,25,0.97)', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(103,232,249,0.2)',
                                display: 'flex', alignItems: 'center', gap: 6, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.5)',
                            }}>
                                <span style={{ fontSize: 11, color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)' }}>Goal:</span>
                                {[3, 5, 7, 10, 15].map(g => (
                                    <button key={g} onClick={() => { setWeeklyGoal(g); localStorage.setItem('cl_weekly_goal', String(g)); setShowGoalEdit(false); }} style={{
                                        padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                        background: weeklyGoal === g ? 'rgba(103,232,249,0.2)' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                        border: weeklyGoal === g ? '1px solid rgba(103,232,249,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
                                        color: weeklyGoal === g ? (isLight ? '#0891b2' : '#67e8f9') : isLight ? '#475569' : 'rgba(255,255,255,0.4)',
                                    }}>{g}/wk</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Topic Mastery Toggle */}
                    <button onClick={() => setShowTopicMastery(t => !t)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showTopicMastery ? 'rgba(103,232,249,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: showTopicMastery ? '1px solid rgba(103,232,249,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <BarChart2 size={14} color={showTopicMastery ? '#67e8f9' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} />
                        <span style={{ fontSize: 12, color: showTopicMastery ? (isLight ? '#0891b2' : '#67e8f9') : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Mastery</span>
                    </button>

                    {/* Recently Viewed Toggle */}
                    {recentProblems.length > 0 && (
                        <button onClick={() => setShowRecentlyViewed(r => !r)} style={{
                            padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                            background: showRecentlyViewed ? 'rgba(139,92,246,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                            border: showRecentlyViewed ? '1px solid rgba(139,92,246,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <History size={14} color={showRecentlyViewed ? '#a78bfa' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} />
                            <span style={{ fontSize: 12, color: showRecentlyViewed ? '#a78bfa' : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Recent</span>
                        </button>
                    )}
                </div>

                <ProblemExplorerInsightsPanels
                    showTopicMastery={showTopicMastery}
                    isLight={isLight}
                    topicMastery={topicMastery}
                    setSelectedTopics={setSelectedTopics}
                    setShowTopicMastery={setShowTopicMastery}
                    showRecentlyViewed={showRecentlyViewed}
                    recentProblems={recentProblems}
                    goToProblem={goToProblem}
                    diffColor={diffColor}
                />

                {/* Company Quick Prep */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Quick Prep:</span>
                    {QUICK_PREP_COMPANIES.map(cId => {
                        const comp = COMPANIES.find(c => c.id === cId);
                        if (!comp) return null;
                        const isActive = selectedCompanies.length === 1 && selectedCompanies[0] === cId;
                        return (
                            <button key={cId} onClick={() => isActive ? clearAll() : quickPrep(cId)} style={{
                                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                background: isActive ? `${comp.color}20` : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
                                border: isActive ? `1px solid ${comp.color}40` : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.06)',
                                color: isActive ? comp.color : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.15s',
                            }}>
                                {comp.name}
                            </button>
                        );
                    })}
                </div>

                {/* Daily Challenge */}
                <div
                    onClick={() => goToProblem(dailyChallenge.id)}
                    style={{
                        marginBottom: 16, padding: '14px 22px', borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.08))',
                        border: '1px solid rgba(251,191,36,0.2)',
                        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(251,191,36,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(139,92,246,0.12))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(251,191,36,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.08))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(251,191,36,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'; }}
                >
                    {/* Animated shimmer overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.04) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer-border 4s ease infinite', pointerEvents: 'none' }} />
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))',
                        border: '1px solid rgba(251,191,36,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        boxShadow: '0 0 12px rgba(251,191,36,0.15)',
                    }}>
                        <Sparkles size={17} color="#fbbf24" style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Challenge</span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, color: diffColor(dailyChallenge.difficulty),
                                padding: '1px 5px', borderRadius: 3, background: `${diffColor(dailyChallenge.difficulty)}15`,
                            }}>{dailyChallenge.difficulty}</span>
                            {solvedSet.has(dailyChallenge.id) && (
                                <span style={{ fontSize: 9, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                                    <CheckCircle2 size={10} /> Done
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#1e293b' : '#fff' }}>{dailyChallenge.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {dailyChallenge.topics.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#c084fc', fontWeight: 600 }}>{t}</span>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <Clock size={11} />{dailyChallenge.timeEstimate}m
                    </div>
                </div>

                <ProblemExplorerSearchToolbar
                    search={search}
                    setSearch={setSearch}
                    isLight={isLight}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    activeFilterCount={activeFilterCount}
                />

                {/* Filters Panel */}
                <ProblemExplorerFiltersPanel
                    showFilters={showFilters}
                    isLight={isLight}
                    activeFilterCount={activeFilterCount}
                    clearAll={clearAll}
                    difficulties={DIFFICULTIES}
                    selectedDifficulties={selectedDifficulties}
                    setSelectedDifficulties={setSelectedDifficulties}
                    topics={TOPICS}
                    selectedTopics={selectedTopics}
                    setSelectedTopics={setSelectedTopics}
                    companies={COMPANIES}
                    selectedCompanies={selectedCompanies}
                    setSelectedCompanies={setSelectedCompanies}
                    patterns={PATTERNS}
                    selectedPatterns={selectedPatterns}
                    setSelectedPatterns={setSelectedPatterns}
                    frequencies={FREQUENCIES}
                    selectedFrequency={selectedFrequency}
                    setSelectedFrequency={setSelectedFrequency}
                    timeEstimates={TIME_ESTIMATES}
                    maxTime={maxTime}
                    setMaxTime={setMaxTime}
                    toggleListItem={toggleListItem}
                    diffColor={diffColor}
                    freqColor={freqColor}
                />

                <ProblemExplorerViewControls
                    isLight={isLight}
                    studyPlans={STUDY_PLANS}
                    activePlan={activePlan}
                    setActivePlan={setActivePlan}
                    setViewMode={setViewMode}
                    setPage={setPage}
                    viewMode={viewMode}
                    filteredCount={filteredProblems.length}
                    solvedInFiltered={solvedInFiltered}
                    hideSolved={hideSolved}
                    setHideSolved={setHideSolved}
                />

                <ProblemExplorerPatternView
                    viewMode={viewMode}
                    isLight={isLight}
                    dsaPatterns={dsaPatterns}
                    patternCategories={PATTERN_CATEGORIES}
                    problems={PROBLEMS}
                    solvedSet={solvedSet}
                    expandedCategories={expandedCategories}
                    setExpandedCategories={setExpandedCategories}
                    expandedSubPatterns={expandedSubPatterns}
                    setExpandedSubPatterns={setExpandedSubPatterns}
                    search={search}
                    selectedDifficulties={selectedDifficulties}
                    initialLoading={initialLoading}
                    roman={ROMAN}
                    getExplanationSnippet={getExplanationSnippet}
                    onSolveProblem={(problemId) => navigate(`/problem/${problemId}`)}
                />

                {/* ══════════ ALL QUESTIONS VIEW ══════════ */}
                <ProblemExplorerAllQuestionsView
                    viewMode={viewMode}
                    isLight={isLight}
                    filteredProblems={filteredProblems}
                    solvedSet={solvedSet}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    setSortBy={setSortBy}
                    setSortDir={setSortDir}
                    onSolveProblem={(problemId) => navigate(`/problem/${problemId}`)}
                    getExplanationSnippet={getExplanationSnippet}
                />

            </div >
        </div >
    );
}

