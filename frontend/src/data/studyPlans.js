// src/data/studyPlans.js

// PrepLoop Top — curated problems across 10 core pattern categories
const PREPLOOP_TOP_TITLES = new Set([
    // Arrays & Strings
    'Two Sum', 'Product of Array Except Self', 'Maximum Subarray',
    'Longest Substring Without Repeating Characters', 'Subarray Sum Equals K',
    // Sorting & Searching
    'Binary Search', 'Search in Rotated Sorted Array', 'Count Inversions',
    'Sort Colors', 'Kth Largest Element in an Array',
    // Linked Lists
    'Reverse Linked List', 'Linked List Cycle', 'Merge Two Sorted Lists',
    'Remove Nth Node From End of List',
    // Stacks & Queues
    'Valid Parentheses', 'Next Greater Element I', 'LRU Cache',
    // Trees & Tries
    'Maximum Depth of Binary Tree', 'Minimum Depth of Binary Tree',
    'Binary Tree Level Order Traversal', 'Lowest Common Ancestor of Binary Tree',
    'Implement Trie (Prefix Tree)',
    // Heaps & Priority Queues
    'Merge K Sorted Lists', 'Sliding Window Maximum',
    // Graphs
    'Number of Islands', 'Course Schedule', 'Course Schedule II', 'Network Delay Time',
    // Dynamic Programming
    'Partition Equal Subset Sum', 'Longest Increasing Subsequence', 'Coin Change',
    'Matrix Chain Multiplication',
    // Hashing & Sets
    'Group Anagrams', 'Longest Consecutive Sequence', 'Count Subarrays with Given XOR',
    // Classic Hard
    'Trapping Rain Water', 'Container With Most Water',
    'Largest Rectangle in Histogram', 'Merge Intervals',
]);

export const STUDY_PLANS = [
    {
        id: 'preploop-top',
        label: 'PrepLoop Top',
        desc: 'The definitive PrepLoop collection — 39 must-solve problems across 10 core DSA patterns. Master these and you\'re interview-ready.',
        icon: '🚀',
        gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.2))',
        border: 'rgba(139, 92, 246, 0.4)',
        textLight: '#5b21b6',
        textDark: '#ddd6fe',
        filter: p => PREPLOOP_TOP_TITLES.has(p.title) || (p.studyPlans && p.studyPlans.includes('preploop-top'))
    },
    { 
        id: 'top-interview-150', 
        label: 'Interview Top 150', 
        desc: 'Master the top 150 most frequently asked questions in tech interviews. Essential for Big Tech.', 
        icon: '🏆',
        gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.15))',
        border: 'rgba(234, 179, 8, 0.35)',
        textLight: '#854d0e',
        textDark: '#fef08a',
        filter: p => p.studyPlans && p.studyPlans.includes('top-interview-150')
    },
    { 
        id: 'beginner', 
        label: 'Beginner 50', 
        desc: 'A curated list of 50 easy problems to build your confidence and fundamental problem-solving skills.', 
        icon: '🌱',
        gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))',
        border: 'rgba(34, 197, 94, 0.35)',
        textLight: '#166534',
        textDark: '#bbf7d0',
        filter: p => p.difficulty === 'Easy', 
        limit: 50 
    },
    { 
        id: 'top-medium', 
        label: 'Top Medium', 
        desc: 'The most frequently asked medium difficulty problems. Perfect for the main interview rounds.', 
        icon: '🔥',
        gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))',
        border: 'rgba(249, 115, 22, 0.35)',
        textLight: '#9a3412',
        textDark: '#fed7aa',
        filter: p => p.difficulty === 'Medium' && p.frequency === 'high', 
        limit: 50 
    },
    { 
        id: 'hard-grind', 
        label: 'Hard Grind', 
        desc: 'Challenge yourself with the hardest problems to guarantee you can pass any technical bar.', 
        icon: '💪',
        gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
        border: 'rgba(239, 68, 68, 0.35)',
        textLight: '#991b1b',
        textDark: '#fecaca',
        filter: p => p.difficulty === 'Hard', 
        limit: 30 
    },
    { 
        id: 'arrays-strings', 
        label: 'Arrays & Strings', 
        desc: 'Master the foundation of data structures. Crucial for both coding and system design rounds.', 
        icon: '📚',
        gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))',
        border: 'rgba(59, 130, 246, 0.35)',
        textLight: '#1e40af',
        textDark: '#bfdbfe',
        filter: p => p.topics.includes('Arrays') || p.topics.includes('Strings'), 
        limit: 50 
    },
    { 
        id: 'trees-graphs', 
        label: 'Trees & Graphs', 
        desc: 'Conquer tree traversals and graph algorithms like BFS, DFS, and topological sort.', 
        icon: '🌳',
        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
        border: 'rgba(16, 185, 129, 0.35)',
        textLight: '#065f46',
        textDark: '#a7f3d0',
        filter: p => p.topics.includes('Trees') || p.topics.includes('Graphs'), 
        limit: 40 
    },
    { 
        id: 'dp-master', 
        label: 'DP Master', 
        desc: 'Build intuition for Dynamic Programming. Learn to identify states, transitions, and memoization.', 
        icon: '🧠',
        gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.15))',
        border: 'rgba(168, 85, 247, 0.35)',
        textLight: '#6b21a8',
        textDark: '#e9d5ff',
        filter: p => p.topics.includes('Dynamic Programming'), 
        limit: 45 
    },
];
