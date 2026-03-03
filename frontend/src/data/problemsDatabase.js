// ─── Original DSA Problems Database ───
// All problems are originally defined for the platform — no external links.

export const COMPANIES = [
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'meta', name: 'Meta', color: '#1877F2' },
  { id: 'microsoft', name: 'Microsoft', color: '#00BCF2' },
  { id: 'apple', name: 'Apple', color: '#A2AAAD' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'uber', name: 'Uber', color: '#000000' },
  { id: 'twitter', name: 'Twitter/X', color: '#1DA1F2' },
  { id: 'adobe', name: 'Adobe', color: '#FF0000' },
  { id: 'tcs', name: 'TCS', color: '#644EEE' },
  { id: 'infosys', name: 'Infosys', color: '#007CC3' },
  { id: 'wipro', name: 'Wipro', color: '#44A149' },
  { id: 'flipkart', name: 'Flipkart', color: '#F7D431' },
  { id: 'paytm', name: 'Paytm', color: '#00BAF2' },
  { id: 'swiggy', name: 'Swiggy', color: '#FC8019' },
  { id: 'razorpay', name: 'Razorpay', color: '#2D97E5' },
  { id: 'oracle', name: 'Oracle', color: '#F80000' },
  { id: 'samsung', name: 'Samsung', color: '#1428A0' },
  { id: 'goldman', name: 'Goldman Sachs', color: '#6FA4D5' },
  { id: 'morgan', name: 'Morgan Stanley', color: '#002B5C' },
];

export const TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
  'Trees', 'Binary Search', 'Sorting', 'Hashing',
  'Recursion', 'Dynamic Programming', 'Graphs',
  'Heap', 'Greedy', 'Backtracking', 'Bit Manipulation',
  'Two Pointers', 'Sliding Window', 'Matrix', 'Trie',
  'Math', 'Design', 'Divide & Conquer',
];

export const PATTERNS = [
  { id: 'two-pointers', name: 'Two Pointers', icon: '↔️', color: '#6ee7b7', desc: 'Use two pointers to traverse from both ends or at different speeds' },
  { id: 'sliding-window', name: 'Sliding Window', icon: '🪟', color: '#67e8f9', desc: 'Maintain a window of elements and slide it across the data' },
  { id: 'fast-slow', name: 'Fast & Slow Pointers', icon: '🐢🐇', color: '#a78bfa', desc: 'Floyd cycle detection — tortoise and hare approach' },
  { id: 'merge-intervals', name: 'Merge Intervals', icon: '📐', color: '#fbbf24', desc: 'Sort and merge overlapping intervals efficiently' },
  { id: 'cyclic-sort', name: 'Cyclic Sort', icon: '🔄', color: '#f472b6', desc: 'Place each number at its correct index in linear time' },
  { id: 'in-place-reversal', name: 'In-Place Reversal', icon: '↩️', color: '#f87171', desc: 'Reverse portions of a linked list in-place' },
  { id: 'bfs', name: 'BFS (Breadth-First)', icon: '🌊', color: '#38bdf8', desc: 'Level-by-level traversal using a queue' },
  { id: 'dfs', name: 'DFS (Depth-First)', icon: '🌲', color: '#4ade80', desc: 'Explore as deep as possible before backtracking' },
  { id: 'binary-search', name: 'Binary Search', icon: '🔍', color: '#fbbf24', desc: 'Divide search space in half each step — O(log n)' },
  { id: 'top-k', name: 'Top K Elements', icon: '🏆', color: '#f59e0b', desc: 'Use heap or quickselect to find K largest/smallest' },
  { id: 'k-way-merge', name: 'K-Way Merge', icon: '🔀', color: '#c084fc', desc: 'Merge K sorted arrays/lists using min-heap' },
  { id: 'topological-sort', name: 'Topological Sort', icon: '📊', color: '#fb923c', desc: 'Order nodes in a DAG respecting dependencies' },
  { id: 'dp-fibonacci', name: 'DP: Fibonacci Pattern', icon: '🐚', color: '#a78bfa', desc: 'Current state depends on previous 1-2 states' },
  { id: 'dp-knapsack', name: 'DP: 0/1 Knapsack', icon: '🎒', color: '#c084fc', desc: 'Include or exclude items to optimize value within constraints' },
  { id: 'dp-subsequence', name: 'DP: Subsequence', icon: '📏', color: '#818cf8', desc: 'Find optimal subsequences (LIS, LCS, etc.)' },
  { id: 'dp-string', name: 'DP: String Matching', icon: '🔤', color: '#6366f1', desc: 'Edit distance, word break, palindrome partitioning' },
  { id: 'dp-interval', name: 'DP: Interval / Range', icon: '📐', color: '#7c3aed', desc: 'Optimal substructure over contiguous ranges' },
  { id: 'monotonic-stack', name: 'Monotonic Stack', icon: '📚', color: '#f87171', desc: 'Maintain increasing/decreasing stack for next greater/smaller' },
  { id: 'prefix-sum', name: 'Prefix Sum', icon: '➕', color: '#34d399', desc: 'Precompute cumulative sums for range query in O(1)' },
  { id: 'union-find', name: 'Union-Find (DSU)', icon: '🔗', color: '#fb923c', desc: 'Disjoint set union for connected components' },
  { id: 'backtracking', name: 'Backtracking', icon: '🔙', color: '#e879f9', desc: 'Explore all paths, prune invalid branches early' },
  { id: 'greedy', name: 'Greedy Strategy', icon: '💰', color: '#fbbf24', desc: 'Make locally optimal choice at each step' },
  { id: 'bit-manipulation', name: 'Bit Manipulation', icon: '🔢', color: '#94a3b8', desc: 'Use bitwise ops for efficient computation' },
  { id: 'trie-pattern', name: 'Trie Pattern', icon: '🌳', color: '#2dd4bf', desc: 'Prefix tree for string searching and autocomplete' },
  { id: 'graph-coloring', name: 'Graph Coloring / Bipartite', icon: '🎨', color: '#f472b6', desc: 'Assign colors/groups ensuring no adjacent conflicts' },
  { id: 'matrix-traversal', name: 'Matrix Traversal', icon: '🗺️', color: '#22d3ee', desc: 'Navigate 2D grids using BFS/DFS patterns' },
  { id: 'expand-center', name: 'Expand From Center', icon: '↔️', color: '#c084fc', desc: 'Expand outward from center to detect palindromes or symmetric patterns' },
  { id: 'string-reversal', name: 'String Reversal', icon: '🔁', color: '#fb7185', desc: 'Reverse strings or portions using two-pointer swap technique' },
  { id: 'backspace-compare', name: 'Backspace String Compare', icon: '⌫', color: '#fdba74', desc: 'Compare strings with backspace characters using reverse traversal' },
  { id: 'sliding-window-fixed', name: 'Fixed-Size Sliding Window', icon: '📏', color: '#22d3ee', desc: 'Slide a window of fixed size K across the data' },
  { id: 'monotonic-queue', name: 'Monotonic Queue (Max/Min)', icon: '📊', color: '#38bdf8', desc: 'Deque-based monotonic queue for sliding window max/min' },
  { id: 'char-freq-match', name: 'Character Frequency Match', icon: '🔠', color: '#a78bfa', desc: 'Match character frequencies between windows and target string' },
  { id: 'tree-inorder', name: 'Tree Inorder Traversal', icon: '🌿', color: '#4ade80', desc: 'Left → Root → Right traversal, yields sorted order in BST' },
  { id: 'tree-preorder', name: 'Tree Preorder Traversal', icon: '🌱', color: '#34d399', desc: 'Root → Left → Right traversal, used for serialization' },
  { id: 'tree-postorder', name: 'Tree Postorder Traversal', icon: '🍂', color: '#10b981', desc: 'Left → Right → Root traversal, used for deletion and evaluation' },
  { id: 'tree-lca', name: 'Lowest Common Ancestor', icon: '🔱', color: '#06b6d4', desc: 'Find lowest shared ancestor of two nodes in a tree' },
  { id: 'tree-serialize', name: 'Tree Serialization', icon: '💾', color: '#0ea5e9', desc: 'Convert tree to string and reconstruct from string' },
  { id: 'shortest-path', name: 'Shortest Path', icon: '🛤️', color: '#f59e0b', desc: 'Dijkstra, Bellman-Ford, or BFS for shortest path in graphs' },
  { id: 'graph-cycle', name: 'Graph Cycle Detection', icon: '🔄', color: '#ef4444', desc: 'Detect cycles in directed/undirected graphs using DFS colors' },
  { id: 'multi-source-bfs', name: 'Multi-Source BFS', icon: '🌊', color: '#14b8a6', desc: 'BFS from multiple starting points simultaneously' },
  { id: 'eulerian-path', name: 'Eulerian Path', icon: '✈️', color: '#8b5cf6', desc: 'Find a path visiting every edge exactly once' },
  { id: 'dp-grid', name: 'DP: Grid Traversal', icon: '🏁', color: '#7c3aed', desc: 'Dynamic programming on 2D grids for paths, sums, etc.' },
  { id: 'dp-state-machine', name: 'DP: State Machine', icon: '⚙️', color: '#6d28d9', desc: 'Model problem states and transitions (stock trading, etc.)' },
  { id: 'dp-bitmask', name: 'DP: Bitmask', icon: '🎭', color: '#5b21b6', desc: 'Use bitmask to represent subsets in DP state' },
  { id: 'dp-counting', name: 'DP: Counting', icon: '🔢', color: '#4c1d95', desc: 'Count distinct ways, arrangements, or structures' },
  { id: 'two-heaps', name: 'Two Heaps (Median)', icon: '⚖️', color: '#f97316', desc: 'Use max-heap + min-heap to track running median' },
  { id: 'interval-scheduling', name: 'Interval Scheduling', icon: '📅', color: '#eab308', desc: 'Greedy selection of non-overlapping intervals' },
  { id: 'expression-eval', name: 'Expression Evaluation', icon: '🧮', color: '#dc2626', desc: 'Evaluate mathematical expressions using stack' },
  { id: 'paren-match', name: 'Parentheses Matching', icon: '🔗', color: '#e11d48', desc: 'Match and validate bracket pairs using stack' },
  { id: 'xor-tricks', name: 'XOR Tricks', icon: '⊕', color: '#71717a', desc: 'Use XOR properties for finding unique/missing elements' },
  { id: 'merge-lists', name: 'Merge Linked Lists', icon: '🔀', color: '#f472b6', desc: 'Merge two or more sorted linked lists' },
  { id: 'kadane', name: "Kadane\'s Algorithm", icon: '📈', color: '#22c55e', desc: 'Find maximum subarray sum in O(n) time' },
  { id: 'dutch-flag', name: 'Dutch National Flag', icon: '🇳🇱', color: '#f97316', desc: 'Three-way partitioning for sorting with 3 categories' },
  { id: 'string-search', name: 'String Search (KMP)', icon: '🔎', color: '#0284c7', desc: 'Pattern matching using KMP, Rabin-Karp, or Z-algorithm' },
  { id: 'char-counting', name: 'Character Counting', icon: '📝', color: '#0891b2', desc: 'Frequency counting and comparison of characters' },
  { id: 'palindrome-check', name: 'Palindrome Check', icon: '🪞', color: '#d946ef', desc: 'Check or build palindromes using various techniques' },
];

export const PROBLEMS = [
  // ── Arrays ──
  { id: 1, leetcodeLink: 'https://leetcode.com/problems/maximum-subarray/', studyPlans: ['top-interview-150'], title: 'Maximum Subarray Sum', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming'], patterns: ['prefix-sum', 'dp-fibonacci', 'kadane'], companies: ['google', 'amazon', 'microsoft'], frequency: 'high', acceptance: 68, timeEstimate: 15, description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.', examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }, { input: 'nums = [1]', output: '1' }, { input: 'nums = [5,4,-1,7,8]', output: '23' }], constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4', hints: ['Think about Kadane\'s algorithm', 'Track current sum and max sum', 'Reset current sum when it drops below zero'] },
  { id: 2, leetcodeLink: 'https://leetcode.com/problems/rotate-array/', studyPlans: ['top-interview-150'], title: 'Rotate Array by K Positions', difficulty: 'Easy', topics: ['Arrays'], patterns: ['two-pointers'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 72, timeEstimate: 15, description: 'Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Perform the rotation in-place with O(1) extra space.', examples: [{ input: 'nums = [1,2,3,4,5,6,7], k = 3', output: '[5,6,7,1,2,3,4]', explanation: 'Rotate 1 step: [7,1,2,3,4,5,6] → 2 steps: [6,7,1,2,3,4,5] → 3 steps: [5,6,7,1,2,3,4].' }, { input: 'nums = [-1,-100,3,99], k = 2', output: '[3,99,-1,-100]' }], constraints: '1 <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1\n0 <= k <= 10^5', hints: ['Reverse the entire array', 'Reverse the first K elements', 'Reverse the remaining elements'] },
  { id: 3, leetcodeLink: 'https://leetcode.com/problems/missing-number/', title: 'Find Missing Number in Range', difficulty: 'Easy', topics: ['Arrays', 'Math', 'Bit Manipulation'], patterns: ['cyclic-sort', 'bit-manipulation'], companies: ['tcs', 'wipro', 'infosys'], frequency: 'high', acceptance: 85, timeEstimate: 10, description: 'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.', examples: [{ input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3, range is [0,3]. 2 is missing.' }, { input: 'nums = [0,1]', output: '2' }, { input: 'nums = [9,6,4,2,3,5,7,0,1]', output: '8' }], constraints: 'n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n\nAll numbers are unique.', hints: ['Use sum formula N*(N+1)/2', 'XOR all elements with 1 to N', 'Sort and check gaps'] },
  { id: 4, leetcodeLink: 'https://leetcode.com/problems/merge-sorted-array/', studyPlans: ['top-interview-150'], title: 'Merge Two Sorted Arrays', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['microsoft', 'adobe', 'samsung'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array in-place.\n\nnums1 has length m + n, where the last n elements are set to 0 and should be ignored.', examples: [{ input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1,2,2,3,5,6]' }, { input: 'nums1 = [1], m = 1, nums2 = [], n = 0', output: '[1]' }], constraints: 'nums1.length == m + n\nnums2.length == n\n0 <= m, n <= 200\n-10^9 <= nums1[i], nums2[j] <= 10^9', hints: ['Use two pointers approach', 'Compare elements from both arrays', 'Fill from the end to avoid overwriting'] },
  { id: 5, leetcodeLink: 'https://leetcode.com/problems/find-all-duplicates-in-an-array/', title: 'Find All Duplicates in Array', difficulty: 'Medium', topics: ['Arrays', 'Hashing'], patterns: ['cyclic-sort'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 62, timeEstimate: 20, description: 'Given an integer array nums of length n where all integers are in the range [1, n] and each integer appears once or twice, return an array of all the integers that appear twice.\n\nYou must write an algorithm that runs in O(n) time and uses only constant extra space.', examples: [{ input: 'nums = [4,3,2,7,8,2,3,1]', output: '[2,3]' }, { input: 'nums = [1,1,2]', output: '[1]' }, { input: 'nums = [1]', output: '[]' }], constraints: 'n == nums.length\n1 <= n <= 10^5\n1 <= nums[i] <= n\nEach element appears once or twice.', hints: ['Use the array itself as hash map', 'Mark visited indices negative', 'O(1) space solution exists'] },
  { id: 6, leetcodeLink: 'https://leetcode.com/problems/trapping-rain-water/', studyPlans: ['top-interview-150'], title: 'Trapping Rain Water', difficulty: 'Hard', topics: ['Arrays', 'Stack', 'Two Pointers'], patterns: ['two-pointers', 'monotonic-stack'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 45, timeEstimate: 30, description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.', examples: [{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '6 units of rain water are trapped between the elevation bars.' }, { input: 'height = [4,2,0,3,2,5]', output: '9' }], constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5', hints: ['For each bar find max left and max right', 'Water at bar = min(maxLeft, maxRight) - height', 'Two pointer approach works in O(n)'] },
  { id: 7, leetcodeLink: 'https://leetcode.com/problems/product-of-array-except-self/', studyPlans: ['top-interview-150'], title: 'Product Except Self', difficulty: 'Medium', topics: ['Arrays'], patterns: ['prefix-sum'], companies: ['meta', 'amazon', 'apple'], frequency: 'high', acceptance: 60, timeEstimate: 20, description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nYou must solve it without using division and in O(n) time.', examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }, { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' }], constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30\nThe product of any prefix or suffix fits in a 32-bit integer.', hints: ['Use prefix products from left', 'Use suffix products from right', 'Combine prefix and suffix'] },
  { id: 8, leetcodeLink: 'https://leetcode.com/problems/next-greater-element-i/', title: 'Next Greater Element', difficulty: 'Medium', topics: ['Arrays', 'Stack'], patterns: ['monotonic-stack'], companies: ['amazon', 'flipkart'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given an array of integers nums, for each element find the first element to its right that is strictly greater than it. If no such element exists, return -1 for that position.', examples: [{ input: 'nums = [4,5,2,25]', output: '[5,25,25,-1]', explanation: '5 is the next greater for 4, 25 for both 5 and 2, and -1 for 25.' }, { input: 'nums = [13,7,6,12]', output: '[-1,12,12,-1]' }], constraints: '1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9', hints: ['Use a monotonic stack', 'Process from right to left', 'Stack stores potential "next greater" elements'] },
  { id: 9, leetcodeLink: 'https://leetcode.com/problems/spiral-matrix/', studyPlans: ['top-interview-150'], title: 'Spiral Matrix Traversal', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['matrix-traversal'], companies: ['microsoft', 'google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'Given an m x n matrix, return all elements of the matrix in spiral order.\n\nTraverse the matrix layer by layer, starting from the outer ring and moving inward.', examples: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[1,2,3,6,9,8,7,4,5]' }, { input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]', output: '[1,2,3,4,8,12,11,10,9,5,6,7]' }], constraints: 'm == matrix.length\nn == matrix[i].length\n1 <= m, n <= 10\n-100 <= matrix[i][j] <= 100', hints: ['Maintain four boundaries: top, bottom, left, right', 'Traverse right, down, left, up', 'Shrink boundaries after each direction'] },
  { id: 10, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', studyPlans: ['top-interview-150'], title: 'Stock Buy and Sell Maximum Profit', difficulty: 'Easy', topics: ['Arrays', 'Greedy'], patterns: ['greedy'], companies: ['amazon', 'microsoft', 'goldman'], frequency: 'high', acceptance: 75, timeEstimate: 10, description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy and a single day to sell in the future.\n\nReturn the maximum profit. If no profit is possible, return 0.', examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' }, { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No profitable transaction is possible.' }], constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4', hints: ['Track minimum price so far', 'Calculate profit at each step', 'Keep maximum profit'] },

  // ── Strings ──
  { id: 11, leetcodeLink: 'https://leetcode.com/problems/longest-palindromic-substring/', studyPlans: ['top-interview-150'], title: 'Longest Palindromic Substring', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming'], patterns: ['dp-string', 'two-pointers', 'expand-center', 'palindrome-check'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'Given a string s, return the longest substring that is a palindrome. A palindrome reads the same forward and backward.\n\nIf there are multiple answers of the same length, return any one of them.', examples: [{ input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' }, { input: 's = "cbbd"', output: '"bb"' }], constraints: '1 <= s.length <= 1000\ns consists of only digits and English letters.', hints: ['Expand around center approach', 'Consider both odd and even length', 'DP table tracking palindrome substrings'] },
  { id: 12, leetcodeLink: 'https://leetcode.com/problems/group-anagrams/', studyPlans: ['top-interview-150'], title: 'Group Strings by Anagram', difficulty: 'Medium', topics: ['Strings', 'Hashing'], patterns: ['char-counting'], companies: ['meta', 'microsoft', 'uber'], frequency: 'high', acceptance: 60, timeEstimate: 20, description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nAn anagram is a word formed by rearranging the letters of another word, using all the original letters exactly once.', examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }, { input: 'strs = [""]', output: '[[""]]' }, { input: 'strs = ["a"]', output: '[["a"]]' }], constraints: '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.', hints: ['Sort each string as a key', 'Use a hash map with sorted key', 'Character frequency can also be a key'] },
  { id: 13, leetcodeLink: 'https://leetcode.com/problems/valid-parentheses/', studyPlans: ['top-interview-150'], title: 'Check Valid Parentheses', difficulty: 'Easy', topics: ['Strings', 'Stack'], patterns: ['paren-match'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'high', acceptance: 80, timeEstimate: 10, description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nA string is valid if: open brackets are closed by the same type, and in the correct order.', examples: [{ input: 's = "()"', output: 'true' }, { input: 's = "()[]{}"', output: 'true' }, { input: 's = "(]"', output: 'false' }], constraints: '1 <= s.length <= 10^4\ns consists of parentheses only: \'()[]{}\'.', hints: ['Use a stack to match brackets', 'Push opening, pop for closing', 'Check if stack is empty at end'] },
  { id: 14, leetcodeLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', studyPlans: ['top-interview-150'], title: 'Longest Substring Without Repeating', difficulty: 'Medium', topics: ['Strings', 'Sliding Window', 'Hashing'], patterns: ['sliding-window', 'char-counting'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given a string s, find the length of the longest substring without repeating characters.', examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length 3.' }, { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with length 1.' }, { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with length 3.' }], constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.', hints: ['Use sliding window technique', 'Hash set to track characters in window', 'Shrink window when duplicate found'] },
  { id: 15, leetcodeLink: 'https://leetcode.com/problems/string-compression/', title: 'String Compression', difficulty: 'Easy', topics: ['Strings'], patterns: ['two-pointers'], companies: ['amazon', 'wipro', 'tcs'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'Given an array of characters chars, compress it in-place. Replace consecutive identical characters with the character followed by the count (if count > 1).\n\nReturn the new length of the array after compression.', examples: [{ input: 'chars = ["a","a","b","b","c","c","c"]', output: '6, chars = ["a","2","b","2","c","3"]' }, { input: 'chars = ["a"]', output: '1, chars = ["a"]' }], constraints: '1 <= chars.length <= 2000\nchars[i] is a lowercase English letter, digit, or symbol.', hints: ['Two pointer approach', 'Count consecutive characters', 'Handle single character case'] },
  { id: 16, leetcodeLink: 'https://leetcode.com/problems/minimum-window-substring/', studyPlans: ['top-interview-150'], title: 'Minimum Window Substring', difficulty: 'Hard', topics: ['Strings', 'Sliding Window', 'Hashing'], patterns: ['sliding-window', 'char-freq-match'], companies: ['google', 'meta', 'uber'], frequency: 'high', acceptance: 35, timeEstimate: 45, description: 'Given two strings s and t of lengths m and n, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.\n\nIf there is no such substring, return the empty string "".', examples: [{ input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'The minimum window substring "BANC" includes A, B, and C from string t.' }, { input: 's = "a", t = "a"', output: '"a"' }, { input: 's = "a", t = "aa"', output: '""', explanation: 'Both a\'s from t must be in the window.' }], constraints: 'm == s.length, n == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters.', hints: ['Sliding window with char frequency', 'Expand right until valid, shrink left', 'Track count of matched characters'] },
  { id: 17, leetcodeLink: 'https://leetcode.com/problems/reverse-words-in-a-string/', studyPlans: ['top-interview-150'], title: 'Reverse Words in a String', difficulty: 'Easy', topics: ['Strings'], patterns: ['two-pointers', 'string-reversal'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters. Return a string of the words in reverse order, separated by a single space.', examples: [{ input: 's = "the sky is blue"', output: '"blue is sky the"' }, { input: 's = "  hello world  "', output: '"world hello"', explanation: 'Leading/trailing spaces and extra spaces between words should be removed.' }], constraints: '1 <= s.length <= 10^4\ns contains English letters, digits, and spaces.', hints: ['Split by spaces, reverse array, join', 'Handle multiple spaces', 'In-place: reverse whole, then each word'] },
  { id: 18, leetcodeLink: 'https://leetcode.com/problems/zigzag-conversion/', studyPlans: ['top-interview-150'], title: 'Zigzag String Conversion', difficulty: 'Medium', topics: ['Strings'], patterns: ['matrix-traversal'], companies: ['amazon', 'google'], frequency: 'low', acceptance: 42, timeEstimate: 25, description: 'Write the string in a zigzag pattern on a given number of rows, then read line by line.\n\nFor example, "PAYPALISHIRING" with 3 rows:\nP   A   H   N\nA P L S I I G\nY   I   R', examples: [{ input: 's = "PAYPALISHIRING", numRows = 3', output: '"PAHNAPLSIIGYIR"' }, { input: 's = "PAYPALISHIRING", numRows = 4', output: '"PINALSIGYAHRPI"' }, { input: 's = "A", numRows = 1', output: '"A"' }], constraints: '1 <= s.length <= 1000\n1 <= numRows <= 1000\ns consists of English letters, commas, and periods.', hints: ['Simulate the zigzag process', 'Use direction flag to go up/down', 'Create separate string for each row'] },
  { id: 19, leetcodeLink: 'https://leetcode.com/problems/count-and-say/', title: 'Count and Say Sequence', difficulty: 'Easy', topics: ['Strings', 'Recursion'], patterns: ['dp-fibonacci'], companies: ['meta', 'microsoft'], frequency: 'low', acceptance: 65, timeEstimate: 15, description: 'The count-and-say sequence is a sequence of digit strings defined by the recursive formula: countAndSay(1) = "1", and countAndSay(n) describes the previous term.\n\nGenerate the nth term of the sequence.', examples: [{ input: 'n = 1', output: '"1"' }, { input: 'n = 4', output: '"1211"', explanation: 'countAndSay(1)="1", (2)="11", (3)="21", (4)="1211".' }], constraints: '1 <= n <= 30', hints: ['Build iteratively from previous term', 'Count consecutive digits', 'Concatenate count + digit'] },
  { id: 20, leetcodeLink: 'https://leetcode.com/problems/decode-string/', title: 'Decode String', difficulty: 'Medium', topics: ['Strings', 'Stack', 'Recursion'], patterns: ['monotonic-stack', 'backtracking'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'Given an encoded string, return its decoded string. The encoding rule is: k[encoded_string], where the encoded_string inside brackets is repeated exactly k times.', examples: [{ input: 's = "3[a]2[bc]"', output: '"aaabcbc"' }, { input: 's = "3[a2[c]]"', output: '"accaccacc"' }, { input: 's = "2[abc]3[cd]ef"', output: '"abcabccdcdcdef"' }], constraints: '1 <= s.length <= 30\ns consists of digits, lowercase English letters, and brackets.\nAll integers in s are in range [1, 300].', hints: ['Use a stack for nested brackets', 'Push current string and count on "["', 'Pop and repeat on "]"'] },

  // ── Linked List ──
  { id: 21, leetcodeLink: 'https://leetcode.com/problems/reverse-linked-list/', studyPlans: ['top-interview-150'], title: 'Reverse a Linked List', difficulty: 'Easy', topics: ['Linked List'], patterns: ['in-place-reversal'], companies: ['microsoft', 'amazon', 'tcs'], frequency: 'high', acceptance: 82, timeEstimate: 10, description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.', examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }, { input: 'head = [1,2]', output: '[2,1]' }, { input: 'head = []', output: '[]' }], constraints: 'The number of nodes is in range [0, 5000].\n-5000 <= Node.val <= 5000', hints: ['Use three pointers: prev, curr, next', 'Update links as you traverse', 'New head is the last node'] },
  { id: 22, leetcodeLink: 'https://leetcode.com/problems/linked-list-cycle/', studyPlans: ['top-interview-150'], title: 'Detect Cycle in Linked List', difficulty: 'Easy', topics: ['Linked List', 'Two Pointers'], patterns: ['fast-slow', 'graph-cycle'], companies: ['google', 'amazon', 'microsoft'], frequency: 'high', acceptance: 76, timeEstimate: 15, description: 'Given head, the head of a linked list, determine if the linked list has a cycle in it. There is a cycle if some node can be reached again by continuously following the next pointer.\n\nReturn true if there is a cycle, otherwise return false. Use O(1) memory.', examples: [{ input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'There is a cycle where the tail connects to node at index 1.' }, { input: 'head = [1,2], pos = 0', output: 'true' }, { input: 'head = [1], pos = -1', output: 'false' }], constraints: 'Number of nodes is in range [0, 10^4].\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index in the list.', hints: ['Floyd\'s tortoise and hare algorithm', 'Slow moves 1 step, fast moves 2', 'If they meet, cycle exists'] },
  { id: 23, leetcodeLink: 'https://leetcode.com/problems/merge-k-sorted-lists/', studyPlans: ['top-interview-150'], title: 'Merge K Sorted Linked Lists', difficulty: 'Hard', topics: ['Linked List', 'Heap', 'Divide & Conquer'], patterns: ['k-way-merge', 'merge-lists'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 40, timeEstimate: 30, description: 'You are given an array of k linked lists, each sorted in ascending order. Merge all the linked lists into one sorted linked list and return it.', examples: [{ input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' }, { input: 'lists = []', output: '[]' }, { input: 'lists = [[]]', output: '[]' }], constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nTotal nodes across all lists <= 10^4.', hints: ['Use a min-heap of size K', 'Divide and conquer approach', 'Merge pairs repeatedly'] },
  { id: 24, leetcodeLink: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', studyPlans: ['top-interview-150'], title: 'Remove Nth Node From End', difficulty: 'Medium', topics: ['Linked List', 'Two Pointers'], patterns: ['two-pointers', 'fast-slow'], companies: ['amazon', 'meta'], frequency: 'medium', acceptance: 62, timeEstimate: 15, description: 'Given the head of a linked list, remove the nth node from the end of the list and return its head.\n\nDo this in one pass through the list.', examples: [{ input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]', explanation: 'Remove the 2nd node from end (value 4).' }, { input: 'head = [1], n = 1', output: '[]' }, { input: 'head = [1,2], n = 1', output: '[1]' }], constraints: 'Number of nodes is in range [1, 30].\n0 <= Node.val <= 100\n1 <= n <= number of nodes.', hints: ['Use two pointers with gap of N', 'Advance fast pointer N steps first', 'Then advance both until fast reaches end'] },
  { id: 25, leetcodeLink: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', title: 'Find Intersection Point of Lists', difficulty: 'Easy', topics: ['Linked List'], patterns: ['two-pointers', 'fast-slow'], companies: ['amazon', 'oracle'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'Given the heads of two singly linked lists headA and headB, return the node at which the two lists intersect. If they do not intersect, return null.\n\nThe lists retain their original structure after the function returns.', examples: [{ input: 'listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3', output: 'Node with value 8', explanation: 'The intersected node value is 8.' }, { input: 'listA = [2,6,4], listB = [1,5], skipA = 3, skipB = 2', output: 'null', explanation: 'The two lists do not intersect.' }], constraints: 'Number of nodes in listA is m.\nNumber of nodes in listB is n.\n1 <= m, n <= 3 * 10^4\n-10^5 <= Node.val <= 10^5', hints: ['Calculate lengths and align', 'Two pointer technique', 'Reset to other list\'s head on reaching null'] },

  // ── Stack & Queue ──
  { id: 26, leetcodeLink: 'https://leetcode.com/problems/min-stack/', studyPlans: ['top-interview-150'], title: 'Implement Min Stack', difficulty: 'Easy', topics: ['Stack', 'Design'], patterns: ['monotonic-stack'], companies: ['amazon', 'microsoft', 'wipro'], frequency: 'high', acceptance: 75, timeEstimate: 15, description: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1) for all operations.', examples: [{ input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]' }], constraints: '-2^31 <= val <= 2^31 - 1\nMethods pop, top and getMin will always be called on non-empty stacks.\nAt most 3 * 10^4 calls will be made.', hints: ['Keep auxiliary stack of minimums', 'Push min when new min found', 'Pop both stacks together'] },
  { id: 27, leetcodeLink: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', studyPlans: ['top-interview-150'], title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', topics: ['Stack'], patterns: ['expression-eval'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 20, description: 'You are given an array of strings tokens that represents an arithmetic expression in Reverse Polish Notation. Evaluate the expression and return the result.\n\nValid operators are +, -, *, and /. Division truncates toward zero.', examples: [{ input: 'tokens = ["2","1","+","3","*"]', output: '9', explanation: '((2 + 1) * 3) = 9' }, { input: 'tokens = ["4","13","5","/","+"]', output: '6', explanation: '(4 + (13 / 5)) = 6' }], constraints: '1 <= tokens.length <= 10^4\nTokens are valid operators or integers in range [-200, 200].', hints: ['Use a stack for operands', 'Pop two on operator', 'Push result back'] },
  { id: 28, leetcodeLink: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', topics: ['Stack', 'Arrays'], patterns: ['monotonic-stack'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 38, timeEstimate: 30, description: 'Given an array of integers heights representing the histogram bar heights where the width of each bar is 1, return the area of the largest rectangle in the histogram.', examples: [{ input: 'heights = [2,1,5,6,2,3]', output: '10', explanation: 'The largest rectangle spans bars of height 5 and 6, area = 5*2 = 10.' }, { input: 'heights = [2,4]', output: '4' }], constraints: '1 <= heights.length <= 10^5\n0 <= heights[i] <= 10^4', hints: ['Use monotonic stack', 'Pop when current bar is shorter', 'Calculate width using stack indices'] },
  { id: 29, leetcodeLink: 'https://leetcode.com/problems/implement-queue-using-stacks/', title: 'Implement Queue Using Stacks', difficulty: 'Easy', topics: ['Stack', 'Queue', 'Design'], patterns: ['paren-match'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'medium', acceptance: 72, timeEstimate: 15, description: 'Implement a first-in-first-out (FIFO) queue using only two stacks. The implemented queue should support push, pop, peek, and empty operations.', examples: [{ input: '["MyQueue","push","push","peek","pop","empty"]\n[[],[1],[2],[],[],[]]', output: '[null,null,null,1,1,false]' }], constraints: '1 <= x <= 9\nAt most 100 calls will be made to push, pop, peek, and empty.\nAll calls to pop and peek are valid.', hints: ['Transfer between two stacks', 'Lazy transfer on dequeue', 'Amortized O(1) per operation'] },
  { id: 30, leetcodeLink: 'https://leetcode.com/problems/sliding-window-maximum/', title: 'Sliding Window Maximum', difficulty: 'Hard', topics: ['Queue', 'Sliding Window', 'Arrays'], patterns: ['sliding-window', 'monotonic-queue'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 42, timeEstimate: 30, description: 'You are given an array of integers nums and an integer k. There is a sliding window of size k moving from left to right. Return the maximum value in each window position.', examples: [{ input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]', explanation: 'Window [1,3,-1]→3, [3,-1,-3]→3, [-1,-3,5]→5, [-3,5,3]→5, [5,3,6]→6, [3,6,7]→7.' }, { input: 'nums = [1], k = 1', output: '[1]' }], constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\n1 <= k <= nums.length', hints: ['Use deque (monotonic queue)', 'Remove smaller elements from back', 'Front of deque is maximum'] },

  // ── Trees ──
  { id: 31, leetcodeLink: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', studyPlans: ['top-interview-150'], title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topics: ['Trees', 'Queue'], patterns: ['bfs'], companies: ['amazon', 'microsoft', 'meta'], frequency: 'high', acceptance: 65, timeEstimate: 15, description: 'Given the root of a binary tree, return the level order traversal of its nodes (i.e., from left to right, level by level).', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' }, { input: 'root = [1]', output: '[[1]]' }, { input: 'root = []', output: '[]' }], constraints: 'Number of nodes is in range [0, 2000].\n-1000 <= Node.val <= 1000', hints: ['Use a queue for BFS', 'Process each level separately', 'Track level size'] },
  { id: 32, leetcodeLink: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', studyPlans: ['top-interview-150'], title: 'Lowest Common Ancestor', difficulty: 'Medium', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'tree-lca'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q.\n\nThe LCA is defined as the lowest node in the tree that has both p and q as descendants (a node can be a descendant of itself).', examples: [{ input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1', output: '3', explanation: 'The LCA of nodes 5 and 1 is 3.' }, { input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4', output: '5', explanation: 'A node can be a descendant of itself.' }], constraints: 'Number of nodes in range [2, 10^5].\n-10^9 <= Node.val <= 10^9\nAll Node.val are unique.\np != q and both exist in tree.', hints: ['Recursive approach from root', 'If both sides return non-null, current is LCA', 'If one side null, return the other'] },
  { id: 33, leetcodeLink: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topics: ['Trees', 'Design', 'Strings'], patterns: ['dfs', 'bfs', 'tree-serialize'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 42, timeEstimate: 30, description: 'Design an algorithm to serialize and deserialize a binary tree. Serialization is the process of converting a tree to a string, and deserialization is reconstructing the tree from the string.\n\nThere is no restriction on how your algorithm should work.', examples: [{ input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]' }, { input: 'root = []', output: '[]' }], constraints: 'Number of nodes in range [0, 10^4].\n-1000 <= Node.val <= 1000', hints: ['Use preorder traversal for serialization', 'Use null markers for missing nodes', 'Queue/index for deserialization'] },
  { id: 34, leetcodeLink: 'https://leetcode.com/problems/balanced-binary-tree/', title: 'Check if Tree is Balanced', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'tree-postorder'], companies: ['microsoft', 'amazon', 'tcs'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'Given a binary tree, determine if it is height-balanced.\n\nA height-balanced binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: 'true' }, { input: 'root = [1,2,2,3,3,null,null,4,4]', output: 'false' }, { input: 'root = []', output: 'true' }], constraints: 'Number of nodes in range [0, 5000].\n-10^4 <= Node.val <= 10^4', hints: ['Calculate height recursively', 'Check height difference at each node', 'Return -1 to signal imbalance early'] },
  { id: 35, leetcodeLink: 'https://leetcode.com/problems/diameter-of-binary-tree/', title: 'Diameter of Binary Tree', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'tree-postorder'], companies: ['meta', 'google'], frequency: 'medium', acceptance: 68, timeEstimate: 15, description: 'Given the root of a binary tree, return the length of the diameter of the tree.\n\nThe diameter is the length of the longest path between any two nodes. This path may or may not pass through the root. The length is measured by the number of edges.', examples: [{ input: 'root = [1,2,3,4,5]', output: '3', explanation: 'Longest path is [4,2,1,3] or [5,2,1,3] with length 3.' }, { input: 'root = [1,2]', output: '1' }], constraints: 'Number of nodes in range [1, 10^4].\n-100 <= Node.val <= 100', hints: ['Diameter at node = left height + right height', 'Calculate height recursively', 'Track max diameter globally'] },
  { id: 36, leetcodeLink: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', studyPlans: ['top-interview-150'], title: 'Construct Binary Tree from Traversals', difficulty: 'Medium', topics: ['Trees', 'Recursion', 'Hashing'], patterns: ['dfs', 'tree-preorder', 'tree-inorder'], companies: ['google', 'amazon', 'microsoft'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'Given two integer arrays preorder and inorder where preorder is the preorder traversal and inorder is the inorder traversal of a binary tree, construct and return the binary tree.', examples: [{ input: 'preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]', output: '[3,9,20,null,null,15,7]' }, { input: 'preorder = [-1], inorder = [-1]', output: '[-1]' }], constraints: '1 <= preorder.length <= 3000\ninorder.length == preorder.length\n-3000 <= preorder[i], inorder[i] <= 3000\nAll values are unique.', hints: ['First element of preorder is root', 'Find root in inorder to split left/right', 'Use hashmap for O(1) lookup in inorder'] },
  { id: 37, leetcodeLink: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/', studyPlans: ['top-interview-150'], title: 'Binary Tree Zigzag Traversal', difficulty: 'Medium', topics: ['Trees', 'Queue'], patterns: ['bfs'], companies: ['amazon', 'meta', 'microsoft'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Given the root of a binary tree, return the zigzag level order traversal of its nodes. (i.e., from left to right on the first level, then right to left on the next level, and so on alternating.)', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[20,9],[15,7]]' }, { input: 'root = [1]', output: '[[1]]' }], constraints: 'Number of nodes in range [0, 2000].\n-100 <= Node.val <= 100', hints: ['BFS with direction flag', 'Reverse alternate levels', 'Use deque for efficient insertion at both ends'] },
  { id: 38, leetcodeLink: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', studyPlans: ['top-interview-150'], title: 'Maximum Path Sum in Binary Tree', difficulty: 'Hard', topics: ['Trees', 'Dynamic Programming', 'Recursion'], patterns: ['dfs', 'dp-fibonacci'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 35, timeEstimate: 30, description: 'Given the root of a binary tree, return the maximum path sum of any non-empty path.\n\nA path is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. A node can only appear in the path at most once. The path does not need to pass through the root.', examples: [{ input: 'root = [1,2,3]', output: '6', explanation: 'Optimal path is 2 → 1 → 3 with sum 6.' }, { input: 'root = [-10,9,20,null,null,15,7]', output: '42', explanation: 'Optimal path is 15 → 20 → 7 with sum 42.' }], constraints: 'Number of nodes in range [1, 3 * 10^4].\n-1000 <= Node.val <= 1000', hints: ['At each node: max gain = node + max(left, right)', 'Path through node = node + left + right', 'Track global maximum separately'] },
  { id: 39, leetcodeLink: 'https://leetcode.com/problems/validate-binary-search-tree/', studyPlans: ['top-interview-150'], title: 'Validate Binary Search Tree', difficulty: 'Medium', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'binary-search', 'tree-inorder'], companies: ['amazon', 'microsoft', 'google'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as: the left subtree contains only nodes with keys less than the node, the right subtree contains only nodes with keys greater than the node, and both subtrees must also be valid BSTs.', examples: [{ input: 'root = [2,1,3]', output: 'true' }, { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: 'Root node value is 5 but right child is 4, which is less than 5.' }], constraints: 'Number of nodes in range [1, 10^4].\n-2^31 <= Node.val <= 2^31 - 1', hints: ['Use min/max range at each node', 'Inorder traversal should be sorted', 'Be careful with equal values'] },
  { id: 40, leetcodeLink: 'https://leetcode.com/problems/binary-tree-right-side-view/', studyPlans: ['top-interview-150'], title: 'Binary Tree Right Side View', difficulty: 'Medium', topics: ['Trees', 'Queue'], patterns: ['bfs', 'dfs'], companies: ['meta', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 15, description: 'Given the root of a binary tree, imagine yourself standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom.', examples: [{ input: 'root = [1,2,3,null,5,null,4]', output: '[1,3,4]' }, { input: 'root = [1,null,3]', output: '[1,3]' }, { input: 'root = []', output: '[]' }], constraints: 'Number of nodes in range [0, 100].\n-100 <= Node.val <= 100', hints: ['BFS taking last element of each level', 'DFS with right-first traversal', 'Track level depth'] },

  // ── Binary Search ──
  { id: 41, leetcodeLink: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', studyPlans: ['top-interview-150'], title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topics: ['Binary Search', 'Arrays'], patterns: ['binary-search'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 52, timeEstimate: 20, description: 'There is an integer array nums sorted in ascending order (with distinct values) that is possibly rotated at an unknown pivot. Given the array after rotation and an integer target, return the index of target if found, or -1 if not found.\n\nYou must write an algorithm with O(log n) runtime.', examples: [{ input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' }, { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1' }, { input: 'nums = [1], target = 0', output: '-1' }], constraints: '1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\nAll values are unique.\nnums is a possibly rotated sorted array.', hints: ['Find which half is sorted', 'Check if target is in sorted half', 'Narrow search accordingly'] },
  { id: 42, leetcodeLink: 'https://leetcode.com/problems/find-peak-element/', studyPlans: ['top-interview-150'], title: 'Find Peak Element', difficulty: 'Medium', topics: ['Binary Search', 'Arrays'], patterns: ['binary-search'], companies: ['amazon', 'microsoft'], frequency: 'medium', acceptance: 60, timeEstimate: 15, description: 'A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array nums, find a peak element, and return its index.\n\nYou may assume that nums[-1] = nums[n] = -∞. You must write an algorithm that runs in O(log n) time.', examples: [{ input: 'nums = [1,2,3,1]', output: '2', explanation: '3 is a peak element at index 2.' }, { input: 'nums = [1,2,1,3,5,6,4]', output: '5', explanation: 'Index 1 or 5 are valid answers.' }], constraints: '1 <= nums.length <= 1000\n-2^31 <= nums[i] <= 2^31 - 1\nnums[i] != nums[i+1] for all valid i.', hints: ['Binary search on the array', 'If mid > mid+1, peak is on left side', 'If mid < mid+1, peak is on right side'] },
  { id: 43, leetcodeLink: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', studyPlans: ['top-interview-150'], title: 'Find First and Last Position', difficulty: 'Medium', topics: ['Binary Search', 'Arrays'], patterns: ['binary-search'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value. If target is not found, return [-1,-1].\n\nYou must write an algorithm with O(log n) runtime.', examples: [{ input: 'nums = [5,7,7,8,8,10], target = 8', output: '[3,4]' }, { input: 'nums = [5,7,7,8,8,10], target = 6', output: '[-1,-1]' }, { input: 'nums = [], target = 0', output: '[-1,-1]' }], constraints: '0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9\nnums is sorted in non-decreasing order.', hints: ['Two binary searches: leftmost and rightmost', 'Modify standard binary search', 'Continue searching even after finding target'] },
  { id: 44, leetcodeLink: 'https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/', title: 'Kth Smallest Element in Sorted Matrix', difficulty: 'Medium', topics: ['Binary Search', 'Heap', 'Matrix'], patterns: ['binary-search', 'top-k'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'Given an n x n matrix where each of the rows and columns is sorted in ascending order, return the kth smallest element in the matrix.\n\nNote that it is the kth smallest element in the sorted order, not the kth distinct element.', examples: [{ input: 'matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8', output: '13' }, { input: 'matrix = [[-5]], k = 1', output: '-5' }], constraints: 'n == matrix.length == matrix[i].length\n1 <= n <= 300\n-10^9 <= matrix[i][j] <= 10^9\n1 <= k <= n^2', hints: ['Binary search on value range', 'Count elements <= mid', 'Min-heap with matrix positions'] },
  { id: 45, leetcodeLink: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', studyPlans: ['top-interview-150'], title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topics: ['Binary Search', 'Arrays', 'Divide & Conquer'], patterns: ['binary-search'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 32, timeEstimate: 45, description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log(m+n)).', examples: [{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Merged array = [1,2,3] and median is 2.' }, { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5', explanation: 'Merged array = [1,2,3,4] and median is (2+3)/2 = 2.5.' }], constraints: 'nums1.length == m, nums2.length == n\n0 <= m <= 1000, 0 <= n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6', hints: ['Binary search on partition', 'Partition smaller array', 'Ensure left max <= right min'] },

  // ── Sorting ──
  { id: 46, leetcodeLink: 'https://leetcode.com/problems/sort-colors/', title: 'Sort Colors (Dutch National Flag)', difficulty: 'Medium', topics: ['Sorting', 'Arrays', 'Two Pointers'], patterns: ['two-pointers', 'dutch-flag'], companies: ['microsoft', 'amazon', 'meta'], frequency: 'high', acceptance: 62, timeEstimate: 15, description: 'Given an array nums with n objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent in the order red, white, and blue.\n\nYou must solve this without using the library sort function.', examples: [{ input: 'nums = [2,0,2,1,1,0]', output: '[0,0,1,1,2,2]' }, { input: 'nums = [2,0,1]', output: '[0,1,2]' }], constraints: 'n == nums.length\n1 <= n <= 300\nnums[i] is 0, 1, or 2.', hints: ['Three pointers: low, mid, high', 'Swap 0s to front, 2s to back', 'Process mid pointer'] },
  { id: 47, leetcodeLink: 'https://leetcode.com/problems/sort-an-array/', title: 'Merge Sort Implementation', difficulty: 'Medium', topics: ['Sorting', 'Divide & Conquer', 'Recursion'], patterns: ['k-way-merge'], companies: ['tcs', 'infosys', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 20, description: 'Implement the merge sort algorithm from scratch. Given an unsorted array of integers, return the array sorted in ascending order using divide-and-conquer merge sort with O(n log n) time complexity.', examples: [{ input: 'nums = [5,2,3,1]', output: '[1,2,3,5]' }, { input: 'nums = [5,1,1,2,0,0]', output: '[0,0,1,1,2,5]' }], constraints: '1 <= nums.length <= 5 * 10^4\n-5 * 10^4 <= nums[i] <= 5 * 10^4', hints: ['Divide array into halves', 'Recursively sort each half', 'Merge sorted halves'] },
  { id: 48, leetcodeLink: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', studyPlans: ['top-interview-150'], title: 'Kth Largest Element', difficulty: 'Medium', topics: ['Sorting', 'Heap', 'Divide & Conquer'], patterns: ['top-k'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an integer array nums and an integer k, return the kth largest element in the array.\n\nNote that it is the kth largest element in sorted order, not the kth distinct element. Can you solve it without sorting?', examples: [{ input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' }, { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4' }], constraints: '1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4', hints: ['QuickSelect algorithm', 'Min-heap of size K', 'Partition-based approach'] },

  // ── Hashing ──
  { id: 49, leetcodeLink: 'https://leetcode.com/problems/two-sum/', studyPlans: ['top-interview-150'], title: 'Two Sum Problem', difficulty: 'Easy', topics: ['Hashing', 'Arrays'], patterns: ['two-pointers', 'prefix-sum'], companies: ['google', 'amazon', 'meta', 'tcs'], frequency: 'high', acceptance: 85, timeEstimate: 10, description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.', examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }, { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }, { input: 'nums = [3,3], target = 6', output: '[0,1]' }], constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.', hints: ['Use a hash map', 'Store complement = target - current', 'Check if complement exists'] },
  { id: 50, leetcodeLink: 'https://leetcode.com/problems/subarray-sum-equals-k/', title: 'Subarray Sum Equals K', difficulty: 'Medium', topics: ['Hashing', 'Arrays'], patterns: ['prefix-sum'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 48, timeEstimate: 20, description: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.\n\nA subarray is a contiguous non-empty sequence of elements within an array.', examples: [{ input: 'nums = [1,1,1], k = 2', output: '2' }, { input: 'nums = [1,2,3], k = 3', output: '2', explanation: 'Subarrays [1,2] and [3] both sum to 3.' }], constraints: '1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= k <= 10^7', hints: ['Use prefix sum with hash map', 'Store frequency of prefix sums', 'Check if (prefixSum - k) exists'] },
  { id: 51, leetcodeLink: 'https://leetcode.com/problems/longest-consecutive-sequence/', studyPlans: ['top-interview-150'], title: 'Longest Consecutive Sequence', difficulty: 'Medium', topics: ['Hashing', 'Arrays'], patterns: ['prefix-sum'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 50, timeEstimate: 20, description: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in O(n) time.', examples: [{ input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'The longest consecutive sequence is [1,2,3,4], length 4.' }, { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9' }], constraints: '0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9', hints: ['Use a hash set', 'Only start counting from sequence beginning', 'Check if num-1 exists in set'] },

  // ── Recursion & Backtracking ──
  { id: 52, leetcodeLink: 'https://leetcode.com/problems/permutations/', studyPlans: ['top-interview-150'], title: 'Generate All Permutations', difficulty: 'Medium', topics: ['Recursion', 'Backtracking'], patterns: ['backtracking'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 58, timeEstimate: 20, description: 'Given an array nums of distinct integers, return all possible permutations. You can return the answer in any order.', examples: [{ input: 'nums = [1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' }, { input: 'nums = [0,1]', output: '[[0,1],[1,0]]' }], constraints: '1 <= nums.length <= 6\n-10 <= nums[i] <= 10\nAll integers are unique.', hints: ['Swap and recurse', 'Use visited array approach', 'Backtrack by undoing swap'] },
  { id: 53, leetcodeLink: 'https://leetcode.com/problems/n-queens/', title: 'N-Queens Problem', difficulty: 'Hard', topics: ['Backtracking', 'Recursion', 'Matrix'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\n\nGiven an integer n, return all distinct solutions. Each solution contains a distinct board configuration.', examples: [{ input: 'n = 4', output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' }, { input: 'n = 1', output: '[["Q"]]' }], constraints: '1 <= n <= 9', hints: ['Place queens row by row', 'Check column, diagonal, anti-diagonal', 'Backtrack when no valid position'] },
  { id: 54, leetcodeLink: 'https://leetcode.com/problems/sudoku-solver/', title: 'Sudoku Solver', difficulty: 'Hard', topics: ['Backtracking', 'Recursion', 'Matrix'], patterns: ['backtracking'], companies: ['google', 'amazon', 'microsoft'], frequency: 'medium', acceptance: 40, timeEstimate: 45, description: 'Write a program to solve a Sudoku puzzle by filling the empty cells. A valid solution must satisfy: each row, column, and 3x3 sub-box contains digits 1-9 with no repetition.\n\nEmpty cells are indicated by the character \'.\'.', examples: [{ input: 'board = [["5","3",".",".","7",".",".",".","."],...]', output: '[["5","3","4","6","7","8","9","1","2"],...]', explanation: 'The input board has a unique solution.' }], constraints: 'board.length == 9\nboard[i].length == 9\nboard[i][j] is a digit or \'.\'\nThe input board has exactly one solution.', hints: ['Try digits 1-9 in empty cells', 'Validate row, column, 3x3 box', 'Backtrack on invalid placement'] },
  { id: 55, leetcodeLink: 'https://leetcode.com/problems/word-search/', studyPlans: ['top-interview-150'], title: 'Word Search in Grid', difficulty: 'Medium', topics: ['Backtracking', 'Matrix', 'Recursion'], patterns: ['backtracking', 'dfs', 'matrix-traversal'], companies: ['amazon', 'meta', 'microsoft'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells (horizontally or vertically). The same cell may not be used more than once.', examples: [{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' }, { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: 'true' }, { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: 'false' }], constraints: 'm == board.length\nn == board[i].length\n1 <= m, n <= 6\n1 <= word.length <= 15', hints: ['DFS from each cell matching first char', 'Mark visited cells', 'Backtrack by unmarking'] },
  { id: 56, leetcodeLink: 'https://leetcode.com/problems/generate-parentheses/', studyPlans: ['top-interview-150'], title: 'Generate Valid Parentheses', difficulty: 'Medium', topics: ['Recursion', 'Backtracking', 'Strings'], patterns: ['backtracking'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 60, timeEstimate: 15, description: 'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.', examples: [{ input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]' }, { input: 'n = 1', output: '["()"]' }], constraints: '1 <= n <= 8', hints: ['Track open and close counts', 'Add open if count < n', 'Add close if close < open'] },
  { id: 57, leetcodeLink: 'https://leetcode.com/problems/combination-sum/', studyPlans: ['top-interview-150'], title: 'Combination Sum', difficulty: 'Medium', topics: ['Backtracking', 'Recursion', 'Arrays'], patterns: ['backtracking'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given an array of distinct integers candidates and a target integer target, return all unique combinations of candidates where the chosen numbers sum to target. The same number may be chosen unlimited times.\n\nReturn combinations in any order.', examples: [{ input: 'candidates = [2,3,6,7], target = 7', output: '[[2,2,3],[7]]', explanation: '2+2+3=7 and 7=7 are the only combinations.' }, { input: 'candidates = [2,3,5], target = 8', output: '[[2,2,2,2],[2,3,3],[3,5]]' }], constraints: '1 <= candidates.length <= 30\n2 <= candidates[i] <= 40\nAll values are distinct.\n1 <= target <= 40', hints: ['Sort to handle duplicates', 'Include current or skip', 'Prune when sum exceeds target'] },
  { id: 58, leetcodeLink: 'https://leetcode.com/problems/subsets/', title: 'Subset Generation', difficulty: 'Medium', topics: ['Backtracking', 'Recursion', 'Bit Manipulation'], patterns: ['backtracking', 'bit-manipulation'], companies: ['meta', 'google', 'amazon'], frequency: 'medium', acceptance: 62, timeEstimate: 15, description: 'Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets.', examples: [{ input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' }, { input: 'nums = [0]', output: '[[],[0]]' }], constraints: '1 <= nums.length <= 10\n-10 <= nums[i] <= 10\nAll elements are unique.', hints: ['Include or exclude each element', 'Bit manipulation approach', 'Iterative doubling approach'] },

  // ── Dynamic Programming ──
  { id: 59, leetcodeLink: 'https://leetcode.com/problems/climbing-stairs/', studyPlans: ['top-interview-150'], title: 'Climbing Stairs Ways', difficulty: 'Easy', topics: ['Dynamic Programming', 'Recursion'], patterns: ['dp-fibonacci'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 80, timeEstimate: 10, description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?', examples: [{ input: 'n = 2', output: '2', explanation: '1+1 or 2. Two ways.' }, { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1. Three ways.' }], constraints: '1 <= n <= 45', hints: ['f(n) = f(n-1) + f(n-2)', 'Similar to Fibonacci', 'DP or two variables'] },
  { id: 60, leetcodeLink: 'https://leetcode.com/problems/longest-increasing-subsequence/', studyPlans: ['top-interview-150'], title: 'Longest Increasing Subsequence', difficulty: 'Medium', topics: ['Dynamic Programming', 'Binary Search'], patterns: ['dp-subsequence', 'binary-search'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nA subsequence is derived from the array by deleting some or no elements without changing the order of remaining elements.', examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'The LIS is [2,3,7,101], length 4.' }, { input: 'nums = [0,1,0,3,2,3]', output: '4' }, { input: 'nums = [7,7,7,7,7,7,7]', output: '1' }], constraints: '1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4', hints: ['DP: dp[i] = max LIS ending at i', 'Binary search with patience sorting', 'O(n log n) optimal solution'] },
  { id: 61, leetcodeLink: 'https://leetcode.com/problems/coin-change/', studyPlans: ['top-interview-150'], title: 'Coin Change Minimum Coins', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dp-knapsack'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 50, timeEstimate: 20, description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins needed to make up that amount. If not possible, return -1.', examples: [{ input: 'coins = [1,5,11], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' }, { input: 'coins = [2], amount = 3', output: '-1' }, { input: 'coins = [1], amount = 0', output: '0' }], constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4', hints: ['DP with dp[amount]', 'Try each coin, take minimum', 'Base case: dp[0] = 0'] },
  { id: 62, leetcodeLink: 'https://leetcode.com/problems/partition-equal-subset-sum/', title: '0/1 Knapsack', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dp-knapsack'], companies: ['amazon', 'google', 'flipkart'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'Given N items with weights and values, and a knapsack with capacity W, find the maximum value that can be put in the knapsack. Each item can be used at most once (0/1 choice).', examples: [{ input: 'weights = [1,3,4,5], values = [1,4,5,7], W = 7', output: '9', explanation: 'Pick items with weights 3 and 4 for values 4+5=9.' }, { input: 'weights = [2,3,4], values = [3,4,5], W = 5', output: '7' }], constraints: '1 <= N <= 100\n1 <= W <= 1000\n1 <= weights[i], values[i] <= 1000', hints: ['2D DP: items x capacity', 'Include or exclude each item', 'dp[i][w] = max(include, exclude)'] },
  { id: 63, leetcodeLink: 'https://leetcode.com/problems/edit-distance/', studyPlans: ['top-interview-150'], title: 'Edit Distance', difficulty: 'Hard', topics: ['Dynamic Programming', 'Strings'], patterns: ['dp-string'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 42, timeEstimate: 30, description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have three operations: insert a character, delete a character, or replace a character.', examples: [{ input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse → rorse → rose → ros (replace, delete, delete).' }, { input: 'word1 = "intention", word2 = "execution"', output: '5' }], constraints: '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.', hints: ['2D DP on both string lengths', 'Match: no cost, else min of 3 ops', 'Base case: empty string transformations'] },
  { id: 64, leetcodeLink: 'https://leetcode.com/problems/longest-common-subsequence/', title: 'Longest Common Subsequence', difficulty: 'Medium', topics: ['Dynamic Programming', 'Strings'], patterns: ['dp-subsequence'], companies: ['google', 'amazon', 'microsoft'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence is derived by deleting some characters without changing the relative order of remaining characters.', examples: [{ input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'The LCS is "ace", length 3.' }, { input: 'text1 = "abc", text2 = "abc"', output: '3' }, { input: 'text1 = "abc", text2 = "def"', output: '0' }], constraints: '1 <= text1.length, text2.length <= 1000\nStrings consist of lowercase English letters only.', hints: ['2D DP table', 'If chars match, dp[i][j] = 1 + dp[i-1][j-1]', 'Else max of dp[i-1][j], dp[i][j-1]'] },
  { id: 65, leetcodeLink: 'https://leetcode.com/problems/word-break/', studyPlans: ['top-interview-150'], title: 'Word Break Problem', difficulty: 'Medium', topics: ['Dynamic Programming', 'Strings', 'Hashing'], patterns: ['dp-string'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.\n\nThe same dictionary word may be reused multiple times.', examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: '"leetcode" can be segmented as "leet code".' }, { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: 'true' }, { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false' }], constraints: '1 <= s.length <= 300\n1 <= wordDict.length <= 1000\n1 <= wordDict[i].length <= 20\nAll strings consist of lowercase English letters.', hints: ['DP where dp[i] = can segment s[0..i]', 'Try all possible last words', 'Use hash set for dictionary lookup'] },
  { id: 66, leetcodeLink: 'https://leetcode.com/problems/minimum-score-triangulation-of-polygon/', title: 'Matrix Chain Multiplication', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dp-interval'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 38, timeEstimate: 30, description: 'Given a sequence of matrices, find the most efficient way to multiply them together. The order of multiplication matters for the number of scalar multiplications.\n\nReturn the minimum number of scalar multiplications needed.', examples: [{ input: 'dims = [10, 30, 5, 60]', output: '4500', explanation: 'Optimal: (A1×A2)×A3 costs 10×30×5 + 10×5×60 = 1500+3000 = 4500.' }, { input: 'dims = [40, 20, 30, 10, 30]', output: '26000' }], constraints: '2 <= dims.length <= 100\n1 <= dims[i] <= 500', hints: ['Interval DP', 'Try all partition points', 'dp[i][j] = min cost for matrices i to j'] },
  { id: 67, leetcodeLink: 'https://leetcode.com/problems/house-robber/', studyPlans: ['top-interview-150'], title: 'House Robber', difficulty: 'Easy', topics: ['Dynamic Programming'], patterns: ['dp-fibonacci'], companies: ['amazon', 'google', 'tcs'], frequency: 'high', acceptance: 70, timeEstimate: 15, description: 'You are a robber planning to rob houses along a street. Each house has a certain amount of money. Adjacent houses have security systems connected — if two adjacent houses are robbed, the police will be alerted.\n\nReturn the maximum amount you can rob without alerting the police.', examples: [{ input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 (1) + house 3 (3) = 4.' }, { input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob house 1 (2) + house 3 (9) + house 5 (1) = 12.' }], constraints: '1 <= nums.length <= 100\n0 <= nums[i] <= 400', hints: ['dp[i] = max(dp[i-1], dp[i-2] + nums[i])', 'Two variables instead of array', 'Include or skip each house'] },
  { id: 68, leetcodeLink: 'https://leetcode.com/problems/partition-equal-subset-sum/', title: 'Partition Equal Subset Sum', difficulty: 'Medium', topics: ['Dynamic Programming', 'Arrays'], patterns: ['dp-knapsack'], companies: ['amazon', 'meta'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'Given an integer array nums, return true if you can partition the array into two subsets such that the sum of elements in both subsets is equal.', examples: [{ input: 'nums = [1,5,11,5]', output: 'true', explanation: '[1,5,5] and [11] both sum to 11.' }, { input: 'nums = [1,2,3,5]', output: 'false', explanation: 'Total sum 11 is odd, so partition is impossible.' }], constraints: '1 <= nums.length <= 200\n1 <= nums[i] <= 100', hints: ['Only possible if total sum is even', 'Reduces to subset sum = total/2', 'DP with boolean array'] },

  // ── Graphs ──
  { id: 69, leetcodeLink: 'https://leetcode.com/problems/number-of-islands/', studyPlans: ['top-interview-150'], title: 'Number of Connected Islands', difficulty: 'Medium', topics: ['Graphs', 'Matrix', 'Recursion'], patterns: ['dfs', 'matrix-traversal', 'bfs'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 58, timeEstimate: 20, description: 'Given an m x n 2D binary grid which represents a map of 1s (land) and 0s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.', examples: [{ input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' }, { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }], constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'.', hints: ['DFS/BFS from each unvisited land cell', 'Mark visited cells', 'Count number of DFS/BFS initiations'] },
  { id: 70, leetcodeLink: 'https://leetcode.com/problems/course-schedule/', studyPlans: ['top-interview-150'], title: 'Course Schedule (Cycle Detection)', difficulty: 'Medium', topics: ['Graphs'], patterns: ['topological-sort', 'dfs', 'graph-cycle'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 50, timeEstimate: 25, description: 'There are a total of numCourses courses labeled from 0 to numCourses-1. You are given an array prerequisites where prerequisites[i] = [a, b] indicates you must take course b before course a.\n\nReturn true if you can finish all courses.', examples: [{ input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0, then course 1.' }, { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'Circular dependency.' }], constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\nAll pairs are unique.', hints: ['Build adjacency list', 'Detect cycle using DFS colors', 'Topological sort with BFS (Kahn\'s)'] },
  { id: 71, leetcodeLink: 'https://leetcode.com/problems/network-delay-time/', title: 'Shortest Path in Weighted Graph', difficulty: 'Medium', topics: ['Graphs', 'Heap'], patterns: ['shortest-path', 'greedy'], companies: ['google', 'uber', 'amazon'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'Given a weighted directed graph with n nodes (0 to n-1) and a source node, find the shortest path distances from source to all other nodes using Dijkstra\'s algorithm.\n\nReturn an array of shortest distances.', examples: [{ input: 'n = 5, edges = [[0,1,10],[0,3,5],[1,2,1],[3,1,3],[3,2,9],[3,4,2],[4,2,6]], src = 0', output: '[0,8,9,5,7]' }], constraints: '1 <= n <= 10^4\n0 <= edges.length <= 10^5\nWeights are non-negative.', hints: ['Priority queue (min-heap)', 'Relaxation of edges', 'Process closest unvisited vertex'] },
  { id: 72, leetcodeLink: 'https://leetcode.com/problems/clone-graph/', studyPlans: ['top-interview-150'], title: 'Clone a Graph', difficulty: 'Medium', topics: ['Graphs', 'Hashing', 'Recursion'], patterns: ['dfs', 'bfs'], companies: ['meta', 'google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value and a list of its neighbors.', examples: [{ input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', explanation: 'The graph has 4 nodes. Clone preserves all connections.' }, { input: 'adjList = [[]]', output: '[[]]' }], constraints: 'Number of nodes in range [0, 100].\n1 <= Node.val <= 100\nNode.val is unique for each node.\nNo self-loops or repeated edges.', hints: ['Hash map from old to new node', 'DFS/BFS traversal', 'Create clone lazily on visit'] },
  { id: 73, leetcodeLink: 'https://leetcode.com/problems/course-schedule/', title: 'Detect Cycle in Directed Graph', difficulty: 'Medium', topics: ['Graphs', 'Recursion'], patterns: ['dfs', 'graph-coloring', 'graph-cycle'], companies: ['amazon', 'google', 'microsoft'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'Given a directed graph with n nodes, determine if the graph contains a cycle.\n\nReturn true if a cycle exists, false otherwise.', examples: [{ input: 'n = 4, edges = [[0,1],[1,2],[2,0],[2,3]]', output: 'true', explanation: 'Cycle: 0 → 1 → 2 → 0.' }, { input: 'n = 3, edges = [[0,1],[1,2]]', output: 'false' }], constraints: '1 <= n <= 2000\n0 <= edges.length <= 5000', hints: ['DFS with three colors (white/gray/black)', 'Gray node in recursion stack = cycle', 'Track visited and in-stack separately'] },
  { id: 74, leetcodeLink: 'https://leetcode.com/problems/course-schedule-ii/', title: 'Topological Sort', difficulty: 'Medium', topics: ['Graphs'], patterns: ['topological-sort', 'bfs'], companies: ['google', 'amazon', 'uber'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given a directed acyclic graph (DAG) with n nodes labeled 0 to n-1, find any valid topological ordering.\n\nA topological ordering is a linear ordering of vertices such that for every directed edge u → v, vertex u comes before v.', examples: [{ input: 'n = 4, edges = [[1,0],[2,0],[3,1],[3,2]]', output: '[0,1,2,3]', explanation: 'Or [0,2,1,3] — multiple valid orderings exist.' }], constraints: '2 <= n <= 2000\n0 <= edges.length <= 5000\nThe graph is a DAG.', hints: ['Kahn\'s algorithm with indegree', 'DFS post-order and reverse', 'Only possible for DAGs'] },
  { id: 75, leetcodeLink: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', title: 'Minimum Spanning Tree', difficulty: 'Medium', topics: ['Graphs', 'Greedy'], patterns: ['greedy', 'union-find'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'Given a connected, undirected, weighted graph with n nodes, find the minimum spanning tree (MST) — a subset of edges connecting all vertices with the minimum total weight.', examples: [{ input: 'n = 4, edges = [[0,1,10],[0,2,6],[0,3,5],[1,3,15],[2,3,4]]', output: '19', explanation: 'MST edges: (2,3,4), (0,3,5), (0,1,10) with total weight 19.' }], constraints: '2 <= n <= 1000\n1 <= edges.length <= 10^4\n1 <= weight <= 10^6', hints: ['Kruskal: sort edges, Union-Find', 'Prim: priority queue, grow tree', 'V-1 edges in MST'] },
  { id: 76, leetcodeLink: 'https://leetcode.com/problems/word-ladder/', studyPlans: ['top-interview-150'], title: 'Word Ladder Transformation', difficulty: 'Hard', topics: ['Graphs', 'Strings', 'Hashing'], patterns: ['bfs', 'shortest-path'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 35, timeEstimate: 30, description: 'A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence where each adjacent pair differs by a single letter.\n\nReturn the number of words in the shortest transformation sequence, or 0 if no sequence exists.', examples: [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: '"hit" → "hot" → "dot" → "dog" → "cog" (5 words).' }, { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0', explanation: 'endWord "cog" is not in wordList.' }], constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nAll words have the same length.\nAll words consist of lowercase English letters.', hints: ['BFS level by level', 'Generate all one-letter mutations', 'Use word set for O(1) lookup'] },
  { id: 77, leetcodeLink: 'https://leetcode.com/problems/alien-dictionary/', title: 'Alien Dictionary', difficulty: 'Hard', topics: ['Graphs', 'Strings'], patterns: ['topological-sort'], companies: ['google', 'meta', 'uber'], frequency: 'medium', acceptance: 35, timeEstimate: 30, description: 'There is a new alien language that uses the English alphabet, but the order of letters is unknown. Given a list of strings words from the alien dictionary sorted lexicographically by the alien language rules, return a string of the unique letters sorted in the alien language order.', examples: [{ input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"' }, { input: 'words = ["z","x"]', output: '"zx"' }], constraints: '1 <= words.length <= 100\n1 <= words[i].length <= 100\nAll characters are lowercase English letters.', hints: ['Compare adjacent words for ordering', 'Build directed graph of characters', 'Topological sort for result'] },
  { id: 78, leetcodeLink: 'https://leetcode.com/problems/network-delay-time/', title: 'Network Delay Time', difficulty: 'Medium', topics: ['Graphs', 'Heap'], patterns: ['shortest-path', 'bfs'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'You are given a network of n nodes labeled 1 to n. Given times, a list of travel times as directed edges times[i] = (u, v, w), and a source node k, find the minimum time for all n nodes to receive the signal. Return -1 if not all nodes can be reached.', examples: [{ input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2', output: '2' }, { input: 'times = [[1,2,1]], n = 2, k = 2', output: '-1' }], constraints: '1 <= k <= n <= 100\n1 <= times.length <= 6000\n1 <= u, v <= n\n1 <= w <= 100', hints: ['Dijkstra from source node', 'Answer is max of all shortest paths', 'Return -1 if any node unreachable'] },

  // ── Heap ──
  { id: 79, leetcodeLink: 'https://leetcode.com/problems/find-median-from-data-stream/', studyPlans: ['top-interview-150'], title: 'Find Median from Data Stream', difficulty: 'Hard', topics: ['Heap', 'Design'], patterns: ['top-k', 'two-heaps'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 42, timeEstimate: 25, description: 'The median is the middle value in an ordered integer list. Design a data structure that supports adding integers and finding the median efficiently.\n\nImplement addNum(int num) and findMedian() methods.', examples: [{ input: '["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"]\n[[],[1],[2],[],[3],[]]', output: '[null,null,null,1.5,null,2.0]' }], constraints: '-10^5 <= num <= 10^5\nAt most 5 * 10^4 calls to addNum and findMedian.\nfindMedian is called only after at least one addNum.', hints: ['Two heaps: max-heap for lower half, min-heap for upper', 'Balance sizes after each insert', 'Median from tops of heaps'] },
  { id: 80, leetcodeLink: 'https://leetcode.com/problems/top-k-frequent-elements/', title: 'Top K Frequent Elements', difficulty: 'Medium', topics: ['Heap', 'Hashing'], patterns: ['top-k'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 60, timeEstimate: 20, description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.', examples: [{ input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' }, { input: 'nums = [1], k = 1', output: '[1]' }], constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\nk is in range [1, number of unique elements].\nThe answer is guaranteed to be unique.', hints: ['Count frequencies with hash map', 'Min-heap of size K', 'Bucket sort for O(n) solution'] },
  { id: 81, leetcodeLink: null, title: 'Sort Nearly Sorted Array', difficulty: 'Medium', topics: ['Heap', 'Sorting'], patterns: ['top-k'], companies: ['amazon', 'samsung'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given an array of integers where each element is at most k positions away from its sorted position, sort the array efficiently.\n\nUse a min-heap of size k+1 for an O(n log k) solution.', examples: [{ input: 'nums = [6,5,3,2,8,10,9], k = 3', output: '[2,3,5,6,8,9,10]' }, { input: 'nums = [10,9,8,7,4,70,60,50], k = 4', output: '[4,7,8,9,10,50,60,70]' }], constraints: '1 <= nums.length <= 10^5\n0 <= k <= nums.length - 1', hints: ['Min-heap of size K+1', 'Insert K+1 elements, extract min', 'Slide window through array'] },

  // ── Greedy ──
  { id: 82, leetcodeLink: 'https://leetcode.com/problems/non-overlapping-intervals/', title: 'Activity Selection Problem', difficulty: 'Easy', topics: ['Greedy', 'Sorting'], patterns: ['greedy', 'interval-scheduling'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'medium', acceptance: 68, timeEstimate: 15, description: 'Given a set of activities with start and finish times, select the maximum number of activities that can be performed by a single person, assuming they can only work on one activity at a time.', examples: [{ input: 'start = [1,3,0,5,8,5], finish = [2,4,6,7,9,9]', output: '4', explanation: 'Select activities with finish times 2, 4, 7, 9.' }, { input: 'start = [1,2], finish = [2,3]', output: '2' }], constraints: '1 <= n <= 10^5\n0 <= start[i] < finish[i] <= 10^9', hints: ['Sort by finish time', 'Greedily select earliest finishing', 'Compare start time with last finish'] },
  { id: 83, leetcodeLink: 'https://leetcode.com/problems/jump-game/', studyPlans: ['top-interview-150'], title: 'Jump Game', difficulty: 'Medium', topics: ['Greedy', 'Arrays'], patterns: ['greedy'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'You are given an integer array nums. You are initially positioned at the first index. Each element represents your maximum jump length from that position.\n\nReturn true if you can reach the last index.', examples: [{ input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1 step from 0→1, then 3 steps from 1→4.' }, { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'You will always arrive at index 3 where max jump is 0.' }], constraints: '1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5', hints: ['Track farthest reachable index', 'If current > farthest possible, return false', 'Greedy forward pass'] },
  { id: 84, leetcodeLink: null, title: 'Minimum Platforms', difficulty: 'Medium', topics: ['Greedy', 'Sorting'], patterns: ['greedy', 'two-pointers'], companies: ['amazon', 'flipkart', 'swiggy'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'Given arrival and departure times of all trains, find the minimum number of platforms required at the railway station so that no train has to wait.', examples: [{ input: 'arrival = [900,940,950,1100,1500,1800], departure = [910,1200,1120,1130,1900,2000]', output: '3', explanation: 'At most 3 trains overlap between 940-1120.' }], constraints: '1 <= n <= 10^5\n0 <= arrival[i], departure[i] <= 2359\narrival[i] <= departure[i]', hints: ['Sort arrivals and departures', 'Two pointer merge approach', 'Track current and max platforms'] },
  { id: 85, leetcodeLink: null, title: 'Fractional Knapsack', difficulty: 'Easy', topics: ['Greedy', 'Sorting'], patterns: ['greedy'], companies: ['tcs', 'wipro', 'infosys'], frequency: 'medium', acceptance: 72, timeEstimate: 15, description: 'Given weights and values of n items, and a knapsack with capacity W, fill the knapsack to maximize total value. Unlike 0/1 knapsack, you can take fractional amounts of items.\n\nReturn the maximum total value.', examples: [{ input: 'values = [60,100,120], weights = [10,20,30], W = 50', output: '240.0', explanation: 'Take items 1 and 2 fully (100+120=220), then 2/3 of item 0 (40). But optimal is take all of item 2, all of item 1, 0 of item 0 = 220, or sort by ratio.' }], constraints: '1 <= n <= 10^5\n1 <= W <= 10^9\n1 <= values[i], weights[i] <= 10^4', hints: ['Sort by value/weight ratio', 'Take full items first', 'Take fraction of last item'] },

  // ── Bit Manipulation ──
  { id: 86, leetcodeLink: 'https://leetcode.com/problems/single-number/', studyPlans: ['top-interview-150'], title: 'Single Number in Array', difficulty: 'Easy', topics: ['Bit Manipulation', 'Arrays'], patterns: ['bit-manipulation', 'xor-tricks'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 85, timeEstimate: 5, description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with linear runtime and without using extra memory.', examples: [{ input: 'nums = [2,2,1]', output: '1' }, { input: 'nums = [4,1,2,1,2]', output: '4' }, { input: 'nums = [1]', output: '1' }], constraints: '1 <= nums.length <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4\nEvery element appears twice except one.', hints: ['XOR all elements', 'a XOR a = 0', 'Result is the unique number'] },
  { id: 87, leetcodeLink: 'https://leetcode.com/problems/number-of-1-bits/', studyPlans: ['top-interview-150'], title: 'Count Set Bits', difficulty: 'Easy', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['tcs', 'wipro', 'infosys'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Write a function that takes the binary representation of a positive integer and returns the number of set bits (1 bits) it has. This is also known as the Hamming weight.', examples: [{ input: 'n = 11 (binary: 1011)', output: '3' }, { input: 'n = 128 (binary: 10000000)', output: '1' }, { input: 'n = 2147483645 (binary: 1111...101)', output: '30' }], constraints: '1 <= n <= 2^31 - 1', hints: ['n & (n-1) removes rightmost set bit', 'Brian Kernighan\'s algorithm', 'Count until n becomes 0'] },
  { id: 88, leetcodeLink: 'https://leetcode.com/problems/power-of-two/', title: 'Power of Two Check', difficulty: 'Easy', topics: ['Bit Manipulation', 'Math'], patterns: ['bit-manipulation'], companies: ['tcs', 'wipro'], frequency: 'medium', acceptance: 82, timeEstimate: 5, description: 'Given an integer n, return true if it is a power of two. Otherwise, return false.\n\nAn integer n is a power of two if there exists an integer x such that n == 2^x.', examples: [{ input: 'n = 1', output: 'true', explanation: '2^0 = 1' }, { input: 'n = 16', output: 'true', explanation: '2^4 = 16' }, { input: 'n = 3', output: 'false' }], constraints: '-2^31 <= n <= 2^31 - 1', hints: ['n & (n-1) == 0 for power of 2', 'Only one set bit', 'Handle n <= 0'] },

  // ── Two Pointers ──
  { id: 89, leetcodeLink: 'https://leetcode.com/problems/container-with-most-water/', studyPlans: ['top-interview-150'], title: 'Container With Most Water', difficulty: 'Medium', topics: ['Two Pointers', 'Arrays', 'Greedy'], patterns: ['two-pointers', 'greedy'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'You are given an integer array height of length n. There are n vertical lines drawn. Find two lines that together with the x-axis form a container that holds the most water.\n\nReturn the maximum amount of water the container can store.', examples: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 (height 8) and index 8 (height 7) form container with area min(8,7)*7 = 49.' }, { input: 'height = [1,1]', output: '1' }], constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4', hints: ['Two pointers: left and right', 'Area = min(height) * width', 'Move the shorter pointer inward'] },
  { id: 90, leetcodeLink: 'https://leetcode.com/problems/3sum/', studyPlans: ['top-interview-150'], title: 'Three Sum Problem', difficulty: 'Medium', topics: ['Two Pointers', 'Arrays', 'Sorting'], patterns: ['two-pointers'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nThe solution set must not contain duplicate triplets.', examples: [{ input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' }, { input: 'nums = [0,1,1]', output: '[]' }, { input: 'nums = [0,0,0]', output: '[[0,0,0]]' }], constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5', hints: ['Sort array first', 'Fix one, two-pointer for remaining', 'Skip duplicates'] },
  { id: 91, leetcodeLink: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', studyPlans: ['top-interview-150'], title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', topics: ['Two Pointers', 'Arrays'], patterns: ['two-pointers'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 78, timeEstimate: 10, description: 'Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Return the number of unique elements k.\n\nThe first k elements of nums should hold the final result.', examples: [{ input: 'nums = [1,1,2]', output: '2, nums = [1,2,_]' }, { input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: '5, nums = [0,1,2,3,4,_,_,_,_,_]' }], constraints: '1 <= nums.length <= 3 * 10^4\n-100 <= nums[i] <= 100\nnums is sorted in non-decreasing order.', hints: ['Two pointers: read and write', 'Advance write only on new element', 'Modify array in-place'] },

  // ── Sliding Window ──
  { id: 92, leetcodeLink: null, title: 'Maximum Sum Subarray of Size K', difficulty: 'Easy', topics: ['Sliding Window', 'Arrays'], patterns: ['sliding-window', 'sliding-window-fixed'], companies: ['amazon', 'flipkart'], frequency: 'medium', acceptance: 72, timeEstimate: 10, description: 'Given an array of positive integers nums and a positive integer k, find the maximum sum of any contiguous subarray of size k.', examples: [{ input: 'nums = [2,1,5,1,3,2], k = 3', output: '9', explanation: 'Subarray [5,1,3] has the max sum of 9.' }, { input: 'nums = [2,3,4,1,5], k = 2', output: '7' }], constraints: '1 <= k <= nums.length <= 10^5\n1 <= nums[i] <= 10^4', hints: ['Fixed-size sliding window', 'Add right, subtract left', 'Track maximum window sum'] },
  { id: 93, leetcodeLink: 'https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/', title: 'Longest Substring with K Distinct Characters', difficulty: 'Medium', topics: ['Sliding Window', 'Strings', 'Hashing'], patterns: ['sliding-window'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 48, timeEstimate: 20, description: 'Given a string s and an integer k, return the length of the longest substring that contains at most k distinct characters.', examples: [{ input: 's = "eceba", k = 2', output: '3', explanation: 'The substring "ece" has 2 distinct chars and length 3.' }, { input: 's = "aa", k = 1', output: '2' }], constraints: '1 <= s.length <= 5 * 10^4\n0 <= k <= 50', hints: ['Variable-size sliding window', 'Hash map for char frequency', 'Shrink when distinct > K'] },
  { id: 94, leetcodeLink: 'https://leetcode.com/problems/minimum-size-subarray-sum/', studyPlans: ['top-interview-150'], title: 'Minimum Size Subarray Sum', difficulty: 'Medium', topics: ['Sliding Window', 'Arrays', 'Two Pointers'], patterns: ['sliding-window', 'two-pointers'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'Given an array of positive integers nums and a positive integer target, return the minimal length of the subarray whose sum is greater than or equal to target. If no such subarray exists, return 0.', examples: [{ input: 'target = 7, nums = [2,3,1,2,4,3]', output: '2', explanation: 'Subarray [4,3] has sum >= 7 with min length 2.' }, { input: 'target = 4, nums = [1,4,4]', output: '1' }, { input: 'target = 11, nums = [1,1,1,1,1,1,1,1]', output: '0' }], constraints: '1 <= target <= 10^9\n1 <= nums.length <= 10^5\n1 <= nums[i] <= 10^4', hints: ['Expand right to increase sum', 'Shrink left when sum >= target', 'Track minimum length'] },

  // ── Trie ──
  { id: 95, leetcodeLink: 'https://leetcode.com/problems/implement-trie-prefix-tree/', studyPlans: ['top-interview-150'], title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', topics: ['Trie', 'Design', 'Strings'], patterns: ['trie-pattern'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'A trie (prefix tree) is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.\n\nImplement the Trie class with insert, search, and startsWith methods.', examples: [{ input: '["Trie","insert","search","search","startsWith","insert","search"]\n[[],["apple"],["apple"],["app"],["app"],["app"],["app"]]', output: '[null,null,true,false,true,null,true]' }], constraints: '1 <= word.length, prefix.length <= 2000\nword and prefix consist only of lowercase English letters.\nAt most 3 * 10^4 total calls.', hints: ['Each node has children map and end flag', 'Traverse character by character', 'startsWith stops at prefix end'] },
  { id: 96, leetcodeLink: 'https://leetcode.com/problems/word-search-ii/', studyPlans: ['top-interview-150'], title: 'Word Search II', difficulty: 'Hard', topics: ['Trie', 'Backtracking', 'Matrix'], patterns: ['trie-pattern', 'backtracking', 'matrix-traversal'], companies: ['google', 'meta'], frequency: 'high', acceptance: 35, timeEstimate: 30, description: 'Given an m x n board of characters and a list of strings words, return all words on the board.\n\nEach word must be constructed from letters of sequentially adjacent cells. The same cell cannot be used more than once in a word.', examples: [{ input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: '["eat","oath"]' }], constraints: 'm == board.length\nn == board[i].length\n1 <= m, n <= 12\n1 <= words.length <= 3 * 10^4\n1 <= words[i].length <= 10', hints: ['Build trie from word list', 'DFS from each cell using trie', 'Prune trie branches for efficiency'] },

  // ── Math ──
  { id: 97, leetcodeLink: null, title: 'Greatest Common Divisor', difficulty: 'Easy', topics: ['Math', 'Recursion'], patterns: ['dp-fibonacci'], companies: ['tcs', 'wipro', 'infosys'], frequency: 'medium', acceptance: 85, timeEstimate: 5, description: 'Given two non-negative integers a and b, return their greatest common divisor (GCD) — the largest number that divides both a and b.\n\nUse the Euclidean algorithm for efficiency.', examples: [{ input: 'a = 12, b = 8', output: '4' }, { input: 'a = 100, b = 75', output: '25' }, { input: 'a = 7, b = 13', output: '1' }], constraints: '0 <= a, b <= 2^31 - 1\nAt least one of a or b is non-zero.', hints: ['gcd(a,b) = gcd(b, a%b)', 'Base case: b == 0, return a', 'Iterative or recursive'] },
  { id: 98, leetcodeLink: 'https://leetcode.com/problems/count-primes/', title: 'Sieve of Eratosthenes', difficulty: 'Easy', topics: ['Math'], patterns: ['prefix-sum'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'medium', acceptance: 72, timeEstimate: 10, description: 'Given an integer n, return all prime numbers less than or equal to n. Use the Sieve of Eratosthenes algorithm for an efficient O(n log log n) solution.', examples: [{ input: 'n = 10', output: '[2,3,5,7]', explanation: 'There are 4 primes less than or equal to 10.' }, { input: 'n = 1', output: '[]' }], constraints: '0 <= n <= 5 * 10^6', hints: ['Mark multiples of each prime', 'Start from p*p', 'Remaining unmarked are primes'] },
  { id: 99, leetcodeLink: 'https://leetcode.com/problems/powx-n/', studyPlans: ['top-interview-150'], title: 'Power Function (Fast Exponentiation)', difficulty: 'Medium', topics: ['Math', 'Recursion'], patterns: ['binary-search'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 15, description: 'Implement pow(x, n), which calculates x raised to the power n (i.e., x^n).\n\nUse fast exponentiation to achieve O(log n) time complexity.', examples: [{ input: 'x = 2.0, n = 10', output: '1024.0' }, { input: 'x = 2.1, n = 3', output: '9.261' }, { input: 'x = 2.0, n = -2', output: '0.25' }], constraints: '-100.0 < x < 100.0\n-2^31 <= n <= 2^31 - 1\nn is an integer.\nResult fits in a double.', hints: ['If n is even: x^n = (x^(n/2))^2', 'If n is odd: x^n = x * x^(n-1)', 'Handle negative exponents'] },
  { id: 100, leetcodeLink: 'https://leetcode.com/problems/roman-to-integer/', studyPlans: ['top-interview-150'], title: 'Roman to Integer', difficulty: 'Easy', topics: ['Math', 'Strings'], patterns: ['greedy'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'medium', acceptance: 75, timeEstimate: 10, description: 'Given a Roman numeral string, convert it to an integer. Roman numerals use: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.\n\nSubtraction is used when a smaller numeral appears before a larger one (e.g., IV = 4).', examples: [{ input: 's = "III"', output: '3' }, { input: 's = "LVIII"', output: '58', explanation: 'L=50, V=5, III=3.' }, { input: 's = "MCMXCIV"', output: '1994', explanation: 'M=1000, CM=900, XC=90, IV=4.' }], constraints: '1 <= s.length <= 15\ns contains only characters in {I, V, X, L, C, D, M}.\nInput is guaranteed to be a valid Roman numeral in range [1, 3999].', hints: ['Map each char to value', 'If current < next, subtract', 'Otherwise add'] },

  // ── Design ──
  { id: 101, leetcodeLink: 'https://leetcode.com/problems/lru-cache/', studyPlans: ['top-interview-150'], title: 'LRU Cache Design', difficulty: 'Medium', topics: ['Design', 'Hashing', 'Linked List'], patterns: ['merge-lists'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'Design a data structure that follows the Least Recently Used (LRU) cache eviction policy.\n\nImplement get(key) and put(key, value) operations, both in O(1) time complexity. When the cache reaches capacity, evict the least recently used item before inserting a new item.', examples: [{ input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: '[null,null,null,1,null,-1,null,-1,3,4]' }], constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls to get and put.', hints: ['HashMap + Doubly Linked List', 'Move to front on access', 'Remove from tail on eviction'] },
  { id: 102, leetcodeLink: 'https://leetcode.com/problems/design-twitter/', title: 'Design Twitter Feed', difficulty: 'Medium', topics: ['Design', 'Heap', 'Hashing'], patterns: ['top-k', 'k-way-merge'], companies: ['meta', 'twitter'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'Design a simplified Twitter.\n\nUsers can post tweets, follow/unfollow other users, and see the 10 most recent tweets in their news feed (from themselves and people they follow).', examples: [{ input: '["Twitter","postTweet","getNewsFeed","follow","postTweet","getNewsFeed","unfollow","getNewsFeed"]\n[[],[1,5],[1],[1,2],[2,6],[1],[1,2],[1]]', output: '[null,null,[5],null,null,[6,5],null,[5]]' }], constraints: '1 <= userId, tweetId <= 500\nAt most 3 * 10^4 calls total.', hints: ['HashMap for user follows', 'HashMap for user tweets', 'Merge K sorted lists for feed'] },

  // ── Extra problems for diversity ──
  { id: 103, leetcodeLink: 'https://leetcode.com/problems/valid-sudoku/', studyPlans: ['top-interview-150'], title: 'Valid Sudoku Board', difficulty: 'Medium', topics: ['Matrix', 'Hashing'], patterns: ['matrix-traversal'], companies: ['microsoft', 'google'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the rules:\n\nEach row, column, and 3x3 sub-box must contain digits 1-9 without repetition.', examples: [{ input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],...]', output: 'true' }, { input: 'board = [["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],...]', output: 'false', explanation: 'Row 1 has two 8s which is invalid even if incomplete.' }], constraints: 'board.length == 9\nboard[i].length == 9\nboard[i][j] is a digit 1-9 or \'.\'.', hints: ['Check rows, columns, 3x3 boxes', 'Use sets for seen numbers', 'No need to solve, just validate'] },
  { id: 104, leetcodeLink: 'https://leetcode.com/problems/rotate-image/', studyPlans: ['top-interview-150'], title: 'Rotate Image 90 Degrees', difficulty: 'Medium', topics: ['Matrix', 'Arrays'], patterns: ['matrix-traversal'], companies: ['amazon', 'microsoft', 'google'], frequency: 'medium', acceptance: 60, timeEstimate: 15, description: 'You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees clockwise in-place.\n\nDo not allocate another 2D matrix — modify the input matrix directly.', examples: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]' }, { input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' }], constraints: 'n == matrix.length == matrix[i].length\n1 <= n <= 20\n-1000 <= matrix[i][j] <= 1000', hints: ['Transpose then reverse each row', 'Or rotate layer by layer', 'temp variable for 4-way swap'] },
  { id: 105, leetcodeLink: 'https://leetcode.com/problems/set-matrix-zeroes/', studyPlans: ['top-interview-150'], title: 'Set Matrix Zeroes', difficulty: 'Medium', topics: ['Matrix', 'Arrays'], patterns: ['matrix-traversal', 'prefix-sum'], companies: ['amazon', 'microsoft', 'meta'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given an m x n integer matrix, if an element is 0, set its entire row and column to 0. You must do it in-place.\n\nTry to solve it with O(1) extra space.', examples: [{ input: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]' }, { input: 'matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' }], constraints: 'm == matrix.length\nn == matrix[0].length\n1 <= m, n <= 200\n-2^31 <= matrix[i][j] <= 2^31 - 1', hints: ['Use first row/col as markers', 'Mark then fill', 'Handle first row/col separately'] },

  // ══════════ NEW LOGIC-BUILDING PROBLEMS ══════════

  // ── Two Pointers & Sliding Window (Logic) ──
  { id: 106, leetcodeLink: 'https://leetcode.com/discuss/interview-question/200608/', title: 'Pair Sum Closest to Target', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers', 'Sorting'], patterns: ['two-pointers'], companies: ['amazon', 'google', 'goldman'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given two sorted arrays and a target sum, find a pair of numbers (one from each array) whose sum is closest to the target.', examples: [{"input":"ar1 = [-1, 3, 8, 2, 9, 5], ar2 = [4, 1, 2, 10, 5, 20], target = 24","output":"[5, 20] or [3, 20]"}],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]', output: '4' }, { input: 'matrix = [["0","1"],["1","0"]]', output: '1' }], constraints: '1 <= ar1.length, ar2.length <= 10^5
-10^9 <= ar1[i], ar2[i] <= 10^9'0\' or \'1\'.', hints: ['Sort and use two pointers', 'Track minimum difference', 'Move pointer based on comparison'] },
  { id: 107, leetcodeLink: 'https://leetcode.com/problems/4sum/', title: 'Four Sum Problem', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers', 'Sorting'], patterns: ['two-pointers', 'dp-grid'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'Given an array nums of n integers, return an array of all the unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that: 
0 <= a, b, c, d < n
a, b, c, and d are distinct.
nums[a] + nums[b] + nums[c] + nums[d] == target', examples: [{"input":"nums = [1,0,-1,0,-2,2], target = 0","output":"[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"}], constraints: '1 <= nums.length <= 200
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9', hints: ['Fix two elements, two-pointer for rest', 'Sort to skip duplicates', 'Reduce to two-sum problem'] },
  { id: 108, leetcodeLink: 'https://leetcode.com/problems/boats-to-save-people/', title: 'Boats to Save People', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers', 'Greedy'], patterns: ['two-pointers', 'greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'You are given an array people where people[i] is the weight of the ith person, and an infinite number of boats where each boat can carry a maximum weight of limit. Each boat carries at most two people at the same time, provided the sum of the weight of those people is at most limit.

Return the minimum number of boats to carry every given person.', examples: [{"input":"people = [1,2], limit = 3","output":"1","explanation":"1 boat (1, 2)"},{"input":"people = [3,2,2,1], limit = 3","output":"3","explanation":"3 boats (1, 2), (2) and (3)"}],[0,1,0],[0,0,0]]', output: '2', explanation: 'One obstacle in the middle. Two paths available.' }, { input: 'obstacleGrid = [[0,1],[0,0]]', output: '1' }], constraints: '1 <= people.length <= 5 * 10^4
1 <= people[i] <= limit <= 3 * 10^4', hints: ['Sort by weight', 'Pair heaviest with lightest', 'Greedy pairing from both ends'] },
  { id: 109, leetcodeLink: 'https://leetcode.com/problems/longest-repeating-character-replacement/', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', topics: ['Strings', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.', examples: [{"input":"s = \"ABAB\", k = 2","output":"4","explanation":"Replace the two 'A's with two 'B's or vice versa."},{"input":"s = \"AABABBA\", k = 1","output":"4","explanation":"Replace the one 'A' in the middle with 'B' and form \"AABBBBA\". The substring \"BBBB\" has the longest repeating letters, which is 4."}],[3,4],[6,5,7],[4,1,8,3]]', output: '11', explanation: 'Path: 2 → 3 → 5 → 1 = 11.' }, { input: 'triangle = [[-10]]', output: '-10' }], constraints: '1 <= s.length <= 10^5
s consists of only uppercase English letters.
0 <= k <= s.length', hints: ['Variable sliding window', 'Track max frequency char in window', 'Window invalid if size - maxFreq > k'] },
  { id: 110, leetcodeLink: 'https://leetcode.com/problems/fruit-into-baskets/', title: 'Fruits Into Baskets', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window', 'Hashing'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'You are visiting a farm that has a single row of fruit trees arranged from left to right. The trees are represented by an integer array fruits where fruits[i] is the type of fruit the ith tree produces.

You want to collect as much fruit as possible. However, the owner has some strict rules that you must follow:
You only have two baskets, and each basket can only hold a single type of fruit.
Starting from any tree of your choice, you must pick exactly one fruit from every tree (including the start tree) while moving to the right.
Once you reach a tree with fruit that cannot fit in your baskets, you must stop.', examples: [{"input":"fruits = [1,2,1]","output":"3","explanation":"We can collect [1,2,1]."},{"input":"fruits = [0,1,2,2]","output":"3","explanation":"We can collect [1,2,2]."}]', output: '6' }, { input: 'height = [4,2,0,3,2,5]', output: '9' }], constraints: '1 <= fruits.length <= 10^5
0 <= fruits[i] < fruits.length', hints: ['Sliding window with hash map', 'Shrink when distinct > 2', 'Track maximum window length'] },
  { id: 111, leetcodeLink: 'https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/', title: 'Maximum Points from Cards', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'There are several cards arranged in a row, and each card has an associated number of points. The points are given in the integer array cardPoints.

In one step, you can take one card from the beginning or from the end of the row. You have to take exactly k cards.

Your score is the sum of the points of the cards you have taken. Given the integer array cardPoints and the integer k, return the maximum score you can obtain.', examples: [{"input":"cardPoints = [1,2,3,4,5,6,1], k = 3","output":"12","explanation":"Pick 1 from the right, then 6 from the right, then 5 from the right. Total score is 1 + 6 + 5 = 12."}]' }, { input: 'digits = ""', output: '[]' }, { input: 'digits = "2"', output: '["a","b","c"]' }], constraints: '1 <= cardPoints.length <= 10^5
1 <= cardPoints[i] <= 10^4
1 <= k <= cardPoints.length'2\', \'9\'].', hints: ['Find minimum subarray of size n-k', 'Total - min subarray = answer', 'Fixed size sliding window'] },
  { id: 112, leetcodeLink: 'https://leetcode.com/problems/subarrays-with-k-different-integers/', title: 'Subarrays with K Different Integers', difficulty: 'Hard', topics: ['Arrays', 'Sliding Window', 'Hashing'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Given an integer array nums and an integer k, return the number of good subarrays of nums.

A good array is an array where the number of different integers in that array is exactly k.', examples: [{"input":"nums = [1,2,1,2,3], k = 2","output":"7","explanation":"Subarrays formed with exactly 2 different integers: [1,2], [2,1], [1,2], [2,3], [1,2,1], [2,1,2], [1,2,1,2]"}], target = 8', output: '[[1,1,6],[1,2,5],[1,7],[2,6]]' }, { input: 'candidates = [2,5,2,1,2], target = 5', output: '[[1,2,2],[5]]' }], constraints: '1 <= nums.length <= 2 * 10^4
1 <= nums[i], k <= nums.length', hints: ['atMost(K) - atMost(K-1)', 'Sliding window for atMost', 'Two function approach'] },

  // ── Prefix Sum & Cumulative Logic ──
  { id: 113, leetcodeLink: 'https://leetcode.com/problems/range-sum-query-immutable/', title: 'Range Sum Query - Immutable', difficulty: 'Easy', topics: ['Arrays', 'Dynamic Programming'], patterns: ['prefix-sum', 'dp-counting'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Given an integer array nums, handle multiple queries of the following type:

Calculate the sum of the elements of nums between indices left and right inclusive where left <= right.
Implement the NumArray class.', examples: [{"input":"[\"NumArray\", \"sumRange\", \"sumRange\", \"sumRange\"]\n[[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]]","output":"[null, 1, -1, -3]"}], constraints: '1 <= nums.length <= 10^4
-10^5 <= nums[i] <= 10^5
0 <= left <= right < nums.length
At most 10^4 calls will be made to sumRange.', hints: ['Build prefix sum array', 'sum(l,r) = prefix[r+1] - prefix[l]', 'Precompute once, query many times'] },
  { id: 114, leetcodeLink: 'https://leetcode.com/problems/contiguous-array/', title: 'Contiguous Array (Equal 0s and 1s)', difficulty: 'Medium', topics: ['Arrays', 'Hashing'], patterns: ['prefix-sum'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'Given a binary array nums, return the maximum length of a contiguous subarray with an equal number of 0 and 1.', examples: [{"input":"nums = [0,1]","output":"2","explanation":"[0, 1] is the longest contiguous subarray with an equal number of 0 and 1."},{"input":"nums = [0,1,0]","output":"2"}],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]', output: '6' }, { input: 'matrix = [["0"]]', output: '0' }], constraints: '1 <= nums.length <= 10^5
nums[i] is either 0 or 1.'0\' or \'1\'.', hints: ['Replace 0 with -1', 'Use prefix sum approach', 'Hash map stores first occurrence of sum'] },
  { id: 115, leetcodeLink: 'https://leetcode.com/problems/subarray-sums-divisible-by-k/', title: 'Count Subarrays with Sum Divisible by K', difficulty: 'Medium', topics: ['Arrays', 'Hashing', 'Math'], patterns: ['prefix-sum'], companies: ['amazon', 'google', 'microsoft'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'Given an integer array nums and an integer k, return the number of non-empty subarrays that have a sum divisible by k.', examples: [{"input":"nums = [4,5,0,-2,-3,1], k = 5","output":"7","explanation":"There are 7 subarrays with a sum divisible by k = 5: [4, 5, 0, -2, -3, 1], [5], [5, 0], [5, 0, -2, -3], [0], [0, -2, -3], [-2, -3]"}]', output: '2', explanation: '3 is a peak element at index 2.' }, { input: 'nums = [1,2,1,3,5,6,4]', output: '5', explanation: 'Index 1 or 5 are valid peaks.' }], constraints: '1 <= nums.length <= 3 * 10^4
-10^4 <= nums[i] <= 10^4
2 <= k <= 10^4', hints: ['Prefix sum modulo K', 'Count frequencies of remainders', 'Handle negative modulo'] },

  // ── Cyclic Sort & Missing/Duplicate ──
  { id: 116, leetcodeLink: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/', title: 'Find All Missing Numbers', difficulty: 'Easy', topics: ['Arrays'], patterns: ['cyclic-sort'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 75, timeEstimate: 15, description: 'Given an array nums of n integers where nums[i] is in the range [1, n], return an array of all the integers in the range [1, n] that do not appear in nums.', examples: [{"input":"nums = [4,3,2,7,8,2,3,1]","output":"[5,6]"},{"input":"nums = [1,1]","output":"[2]"}]. The 10th is 12.' }, { input: 'n = 1', output: '1' }], constraints: 'n == nums.length
1 <= n <= 10^5
1 <= nums[i] <= n', hints: ['Place each number at index num-1', 'Scan for mismatches', 'O(n) time O(1) space'] },
  { id: 117, leetcodeLink: 'https://leetcode.com/problems/first-missing-positive/', title: 'Find the First Missing Positive', difficulty: 'Hard', topics: ['Arrays'], patterns: ['cyclic-sort'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 35, timeEstimate: 30, description: 'Given an unsorted integer array nums. Return the smallest positive integer that is not present in nums.

You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.', examples: [{"input":"nums = [1,2,0]","output":"3"},{"input":"nums = [3,4,-1,1]","output":"2"},{"input":"nums = [7,8,9,11,12]","output":"1"}]', output: '[1,null,2,null,3,null,4,null,5,null,6]' }, { input: 'root = []', output: '[]' }], constraints: '1 <= nums.length <= 10^5
-2^31 <= nums[i] <= 2^31 - 1', hints: ['Place positive nums at correct index', 'Ignore negatives and out of range', 'Scan for first mismatch'] },
  { id: 118, leetcodeLink: 'https://leetcode.com/problems/find-the-duplicate-number/', title: 'Find the Duplicate Number', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['fast-slow', 'cyclic-sort'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive.

There is only one repeated number in nums, return this repeated number. You must solve the problem without modifying the array nums and uses only constant extra space.', examples: [{"input":"nums = [1,3,4,2,2]","output":"2"},{"input":"nums = [3,1,3,4,2]","output":"3"}]', output: '[[9],[3,15],[20],[7]]' }, { input: 'root = [1,2,3,4,5,6,7]', output: '[[4],[2],[1,5,6],[3],[7]]' }], constraints: '1 <= n <= 10^5
nums.length == n + 1
1 <= nums[i] <= n
All the integers in nums appear only once except for precisely one integer which appears two or more times.', hints: ['Floyd cycle detection on values', 'Treat values as next pointers', 'Fast and slow pointers meet in cycle'] },
  { id: 119, leetcodeLink: 'https://leetcode.com/problems/set-mismatch/', title: 'Find Corrupt Pair', difficulty: 'Easy', topics: ['Arrays', 'Math'], patterns: ['cyclic-sort'], companies: ['tcs', 'flipkart', 'infosys'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'You have a set of integers s, which originally contains all the numbers from 1 to n. Unfortunately, due to some error, one of the numbers in s got duplicated to another number in the set, which results in repetition of one number and loss of another number.

You are given an integer array nums representing the data status of this set after the error.

Find the number that occurs twice and the number that is missing and return them in the form of an array.', examples: [{"input":"nums = [1,2,2,4]","output":"[2,3]"},{"input":"nums = [1,1]","output":"[1,2]"}], k = 1', output: '1' }, { input: 'root = [5,3,6,2,4,null,null,1], k = 3', output: '3' }], constraints: '2 <= nums.length <= 10^4
1 <= nums[i] <= 10^4', hints: ['Cyclic sort approach', 'After sorting, mismatched index reveals both', 'XOR or math approach also works'] },

  // ── Linked List Logic Building ──
  { id: 120, leetcodeLink: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', studyPlans: ['top-interview-150'], title: 'Reverse Linked List in K-Groups', difficulty: 'Hard', topics: ['Linked List'], patterns: ['in-place-reversal'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 40, timeEstimate: 30, description: 'Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list.

k is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list\'s nodes, only nodes themselves may be changed.', examples: [{"input":"head = [1,2,3,4,5], k = 2","output":"[2,1,4,3,5]"},{"input":"head = [1,2,3,4,5], k = 3","output":"[3,2,1,4,5]"}]', output: 'true' }, { input: 'root = [1,2,2,null,3,null,3]', output: 'false' }], constraints: 'The number of nodes in the list is n.
1 <= k <= n <= 5000
0 <= Node.val <= 1000', hints: ['Count k nodes first', 'Reverse k nodes in-place', 'Connect reversed groups'] },
  { id: 121, leetcodeLink: 'https://leetcode.com/problems/reverse-nodes-in-even-length-groups/', title: 'Reverse Alternating K-Nodes', difficulty: 'Medium', topics: ['Linked List'], patterns: ['in-place-reversal'], companies: ['amazon', 'microsoft'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'You are given the head of a linked list. The nodes in the linked list are sequentially assigned to non-empty groups whose lengths form the sequence of the natural numbers (1, 2, 3, 4, ...). The length of a group is the number of nodes assigned to it. In other words, the 1st node is assigned to the first group, the 2nd and 3rd nodes are assigned to the second group, and so on.

Reverse the nodes in each group with an even length, and return the head of the modified linked list.', examples: [{"input":"head = [5,2,6,3,9,1,7,3,8,4]","output":"[5,6,2,3,9,1,4,8,3,7]"}]', output: '[4,7,2,9,6,3,1]' }, { input: 'root = [2,1,3]', output: '[2,3,1]' }], constraints: 'The number of nodes in the list is in the range [1, 10^5].
0 <= Node.val <= 10^5', hints: ['Reverse first K nodes', 'Skip next K nodes', 'Repeat until end'] },
  { id: 122, leetcodeLink: 'https://leetcode.com/problems/rotate-list/', studyPlans: ['top-interview-150'], title: 'Rotate Linked List by K', difficulty: 'Medium', topics: ['Linked List', 'Two Pointers'], patterns: ['fast-slow', 'in-place-reversal'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'Given the head of a linked list, rotate the list to the right by k places.', examples: [{"input":"head = [1,2,3,4,5], k = 2","output":"[4,5,1,2,3]"},{"input":"head = [0,1,2], k = 4","output":"[2,0,1]"}]', output: '6' }, { input: 'root = []', output: '0' }], constraints: 'The number of nodes in the list is in the range [0, 500].
-100 <= Node.val <= 100
0 <= k <= 2 * 10^9', hints: ['Find length and make circular', 'Break at length-k position', 'Handle k > length'] },
  { id: 123, leetcodeLink: 'https://leetcode.com/problems/reorder-list/', title: 'Reorder List', difficulty: 'Medium', topics: ['Linked List', 'Two Pointers'], patterns: ['fast-slow', 'in-place-reversal'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'You are given the head of a singly linked-list. The list can be represented as:
L0 → L1 → ... → Ln - 1 → Ln

Reorder the list to be on the following form:
L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → ...

You may not modify the values in the list\'s nodes. Only nodes themselves may be changed.', examples: [{"input":"head = [1,2,3,4]","output":"[1,4,2,3]"},{"input":"head = [1,2,3,4,5]","output":"[1,5,2,4,3]"}]', output: '24', explanation: '9 and 15 are left leaves. Sum = 9 + 15 = 24.' }, { input: 'root = [1]', output: '0' }], constraints: 'The number of nodes in the list is in the range [1, 5 * 10^4].
1 <= Node.val <= 1000', hints: ['Find middle using slow-fast', 'Reverse second half', 'Merge two halves alternately'] },
  { id: 124, leetcodeLink: 'https://leetcode.com/problems/add-two-numbers/', studyPlans: ['top-interview-150'], title: 'Add Two Numbers as Lists', difficulty: 'Medium', topics: ['Linked List', 'Math'], patterns: ['two-pointers'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.', examples: [{"input":"l1 = [2,4,3], l2 = [5,6,4]","output":"[7,0,8]","explanation":"342 + 465 = 807."},{"input":"l1 = [0], l2 = [0]","output":"[0]"}]', output: '["0->2","4->5","7"]' }, { input: 'nums = [0,2,3,4,6,8,9]', output: '["0","2->4","6","8->9"]' }], constraints: 'The number of nodes in each linked list is in the range [1, 100].
0 <= Node.val <= 9
It is guaranteed that the list represents a number that does not have leading zeros.', hints: ['Traverse both lists simultaneously', 'Handle carry at each step', 'Don\'t forget final carry'] },
  { id: 125, leetcodeLink: 'https://leetcode.com/problems/palindrome-linked-list/', title: 'Palindrome Linked List', difficulty: 'Easy', topics: ['Linked List', 'Two Pointers'], patterns: ['fast-slow', 'in-place-reversal'], companies: ['amazon', 'meta'], frequency: 'medium', acceptance: 60, timeEstimate: 20, description: 'Given the head of a singly linked list, return true if it is a palindrome or false otherwise.', examples: [{"input":"head = [1,2,2,1]","output":"true"},{"input":"head = [1,2]","output":"false"}], val = 3', output: '2, nums = [2,2,_,_]' }, { input: 'nums = [0,1,2,2,3,0,4,2], val = 2', output: '5, nums = [0,1,4,0,3,_,_,_]' }], constraints: 'The number of nodes in the list is in the range [1, 10^5].
0 <= Node.val <= 9', hints: ['Find middle with slow-fast', 'Reverse second half', 'Compare both halves'] },

  // ── Monotonic Stack Logic ──
  { id: 126, leetcodeLink: 'https://leetcode.com/problems/daily-temperatures/', title: 'Daily Temperatures', difficulty: 'Medium', topics: ['Arrays', 'Stack'], patterns: ['monotonic-stack'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.', examples: [{"input":"temperatures = [73,74,75,71,69,72,76,73]","output":"[1,1,4,2,1,1,0,0]"},{"input":"temperatures = [30,40,50,60]","output":"[1,1,1,0]"}]' }, { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' }, { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' }], constraints: '1 <= temperatures.length <= 10^5
30 <= temperatures[i] <= 100', hints: ['Monotonic decreasing stack', 'Store indices in stack', 'Pop when current temp > stack top'] },
  { id: 127, leetcodeLink: 'https://leetcode.com/problems/next-greater-element-i/', title: 'Next Smaller Element', difficulty: 'Medium', topics: ['Arrays', 'Stack'], patterns: ['monotonic-stack'], companies: ['amazon', 'flipkart', 'paytm'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Given an array, find the next smaller element for every element. The next smaller element for an element x is the first smaller element on the right side of x in the array. Elements for which no smaller element exist, consider the next smaller element as -1.', examples: [{"input":"arr = [4, 8, 5, 2, 25]","output":"[2, 5, 2, -1, -1]"}], constraints: '1 <= arr.length <= 10^5
0 <= arr[i] <= 10^9', hints: ['Monotonic increasing stack', 'Process right to left', 'Pop larger elements'] },
  { id: 128, leetcodeLink: 'https://leetcode.com/problems/maximum-width-ramp/', title: 'Maximum Width Ramp', difficulty: 'Medium', topics: ['Arrays', 'Stack'], patterns: ['monotonic-stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'A ramp in an integer array nums is a pair (i, j) for which i < j and nums[i] <= nums[j]. The width of such a ramp is j - i. Given an integer array nums, return the maximum width of a ramp in nums. If there is no ramp in nums, return 0.', examples: [{"input":"nums = [6,0,8,2,1,5]","output":"4","explanation":"The maximum width ramp is achieved at (i, j) = (1, 5): nums[1] = 0 and nums[5] = 5."},{"input":"nums = [9,8,1,0,1,9,4,0,4,1]","output":"7"}], constraints: '2 <= nums.length <= 5 * 10^4
0 <= nums[i] <= 5 * 10^4', hints: ['Build decreasing stack of candidates', 'Scan right to left for matches', 'Stack stores potential left endpoints'] },
  { id: 129, leetcodeLink: 'https://leetcode.com/problems/online-stock-span/', title: 'Stock Span Problem', difficulty: 'Medium', topics: ['Arrays', 'Stack'], patterns: ['monotonic-stack'], companies: ['amazon', 'flipkart', 'oracle'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Design a class StockSpanner which collects daily price quotes for some stock and returns the span of that stock\'s price for the current day. The span of the stock\'s price in one day is the maximum number of consecutive days (starting from that day and going backward) for which the stock price was less than or equal to the price of that day.', examples: [{"input":"[\"StockSpanner\", \"next\", \"next\", \"next\", \"next\", \"next\", \"next\", \"next\"]\n[[], [100], [80], [60], [70], [60], [75], [85]]","output":"[null, 1, 1, 1, 2, 1, 4, 6]"}], constraints: '1 <= price <= 10^5
At most 10^4 calls will be made to next.', hints: ['Monotonic decreasing stack', 'Pop while stack top price <= current', 'Span = current index - stack top index'] },
  { id: 130, leetcodeLink: 'https://leetcode.com/problems/sum-of-subarray-minimums/', title: 'Sum of Subarray Minimums', difficulty: 'Medium', topics: ['Arrays', 'Stack', 'Math'], patterns: ['monotonic-stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 30, description: 'Given an array of integers arr, find the sum of min(b), where b ranges over every (contiguous) subarray of arr. Since the answer may be large, return the answer modulo 10^9 + 7.', examples: [{"input":"arr = [3,1,2,4]","output":"17","explanation":"Subarrays: [3], [1], [2], [4], [3,1], [1,2], [2,4], [3,1,2], [1,2,4], [3,1,2,4]. Mins: 3, 1, 2, 4, 1, 1, 2, 1, 1, 1. Sum: 17."}]\n[[],[5],[7],[5],[7],[4],[5],[],[],[],[]]', output: '[null,null,null,null,null,null,null,5,7,5,4]' }], constraints: '1 <= arr.length <= 3 * 10^4
1 <= arr[i] <= 3 * 10^4', hints: ['For each element find its contribution', 'Use previous smaller and next smaller', 'Monotonic stack for both boundaries'] },

  // ── BFS / DFS Logic Building ──
  { id: 131, leetcodeLink: 'https://leetcode.com/problems/rotting-oranges/', title: 'Rotten Oranges', difficulty: 'Medium', topics: ['Graphs', 'Matrix', 'Queue'], patterns: ['bfs', 'matrix-traversal', 'multi-source-bfs'], companies: ['amazon', 'google', 'microsoft'], frequency: 'high', acceptance: 52, timeEstimate: 20, description: 'You are given an m x n grid where each cell can have one of three values: 0 representing an empty cell, 1 representing a fresh orange, or 2 representing a rotten orange.

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.', examples: [{"input":"grid = [[2,1,1],[1,1,0],[0,1,1]]","output":"4"},{"input":"grid = [[2,1,1],[0,1,1],[1,0,1]]","output":"-1"}],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, so merge to [1,6].' }, { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' }], constraints: 'm == grid.length
n == grid[i].length
1 <= m, n <= 10
grid[i][j] is 0, 1, or 2.', hints: ['Start BFS from all rotten oranges', 'Process level by level for time', 'Check if any fresh remain'] },
  { id: 132, leetcodeLink: 'https://leetcode.com/problems/surrounded-regions/', studyPlans: ['top-interview-150'], title: 'Surrounded Regions', difficulty: 'Medium', topics: ['Graphs', 'Matrix'], patterns: ['dfs', 'matrix-traversal'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'Given an m x n matrix board containing \'X\' and \'O\', capture all regions that are 4-directionally surrounded by \'X\'.

A region is captured by flipping all \'O\'s into \'X\'s in that surrounded region.', examples: [{"input":"board = [[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"O\",\"X\"],[\"X\",\"X\",\"O\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]","output":"[[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]"}],[6,9]], newInterval = [2,5]', output: '[[1,5],[6,9]]' }, { input: 'intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]', output: '[[1,2],[3,10],[12,16]]' }], constraints: 'm == board.length
n == board[i].length
1 <= m, n <= 200
board[i][j] is \'X\' or \'O\'.', hints: ['DFS from border Os to mark safe', 'Flip remaining Os to X', 'Restore safe cells'] },
  { id: 133, leetcodeLink: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', topics: ['Graphs', 'Matrix'], patterns: ['dfs', 'matrix-traversal'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 45, timeEstimate: 30, description: 'There is an m x n rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island\'s left and top edges, and the Atlantic touches the right and bottom edges.

The island is partitioned into a grid of square cells. You are given an m x n integer matrix heights where heights[r][c] represents the height above sea level of the cell at coordinate (r, c).

The island receives a lot of rain, and the rain water can flow to neighboring cells directly north, south, east, and west if the neighboring cell\'s height is less than or equal to the current cell\'s height. Water can flow from any cell adjacent to an ocean into the ocean.

Return a 2D list of grid coordinates result where result[i] = [ri, ci] denotes that rain water can flow from cell (ri, ci) to both the Pacific and Atlantic oceans.', examples: [{"input":"heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]","output":"[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]"}],[5,10],[15,20]]', output: 'false', explanation: 'Meetings [0,30] and [5,10] overlap.' }, { input: 'intervals = [[7,10],[2,4]]', output: 'true' }], constraints: 'm == heights.length
n == heights[r].length
1 <= m, n <= 200
0 <= heights[r][c] <= 10^5', hints: ['DFS/BFS from ocean borders inward', 'Two visited sets for each ocean', 'Intersection of both sets'] },
  { id: 134, leetcodeLink: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', title: 'Shortest Path in Binary Matrix', difficulty: 'Medium', topics: ['Graphs', 'Matrix', 'Queue'], patterns: ['bfs', 'matrix-traversal'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'Given an n x n binary matrix grid, return the length of the shortest clear path in the matrix. If there is no clear path, return -1.

A clear path in a binary matrix is a path from the top-left cell (0, 0) to the bottom-right cell (n - 1, n - 1) such that all visited cells are 0, and all adjacent cells on the path are 8-directionally connected.', examples: [{"input":"grid = [[0,1],[1,0]]","output":"2"},{"input":"grid = [[0,0,0],[1,1,0],[1,1,0]]","output":"4"}],[5,10],[15,20]]', output: '2', explanation: 'Two rooms needed: one for [0,30] and one for [5,10] (then reused for [15,20]).' }, { input: 'intervals = [[7,10],[2,4]]', output: '1' }], constraints: 'n == grid.length
n == grid[i].length
1 <= n <= 100
grid[i][j] is 0 or 1', hints: ['BFS with 8-directional movement', 'Track distance in BFS', 'Return -1 if no path exists'] },
  { id: 135, leetcodeLink: 'https://leetcode.com/problems/graph-valid-tree/', title: 'Graph Valid Tree', difficulty: 'Medium', topics: ['Graphs'], patterns: ['union-find', 'dfs'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 48, timeEstimate: 20, description: 'You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and a list of edges where edges[i] = [ai, bi] indicates that there is an undirected edge between nodes ai and bi in the graph.

Return true if the edges of the given graph make up a valid tree, and false otherwise.', examples: [{"input":"n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]","output":"true"},{"input":"n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]","output":"false"}],[12,30],[40,50],[5,1],[12,10],[3,4]]', output: '1.414', explanation: 'Closest pair is (2,3) and (3,4) with distance sqrt(2).' }], constraints: '1 <= n <= 2000
0 <= edges.length <= 5000
edges[i].length == 2
0 <= ai, bi < n', hints: ['n-1 edges required for n nodes', 'Union-Find for cycle detection', 'DFS and count visited nodes'] },
  { id: 136, leetcodeLink: 'https://leetcode.com/problems/is-graph-bipartite/', title: 'Is Graph Bipartite', difficulty: 'Medium', topics: ['Graphs'], patterns: ['graph-coloring', 'bfs', 'dfs'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'There is an undirected graph with n nodes, where each node is numbered between 0 and n - 1. You are given a 2D array graph, where graph[u] is an array of nodes that node u is adjacent to.

A graph is bipartite if the nodes can be partitioned into two independent sets A and B such that every edge in the graph connects a node in set A and a node in set B.

Return true if and only if it is bipartite.', examples: [{"input":"graph = [[1,2,3],[0,2],[0,1,3],[0,2]]","output":"false"},{"input":"graph = [[1,3],[0,2],[1,3],[0,2]]","output":"true"}]', output: '[1,3,2]' }, { input: 'root = []', output: '[]' }, { input: 'root = [1]', output: '[1]' }], constraints: 'graph.length == n
1 <= n <= 100
0 <= graph[u].length < n
0 <= graph[u][i] <= n - 1', hints: ['BFS/DFS with 2-coloring', 'If neighbor has same color, not bipartite', 'Handle disconnected components'] },

  // ── Union-Find / DSU ──
  { id: 137, leetcodeLink: 'https://leetcode.com/problems/number-of-provinces/', title: 'Number of Provinces', difficulty: 'Medium', topics: ['Graphs'], patterns: ['union-find', 'dfs'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 60, timeEstimate: 20, description: 'There are n cities. Some of them are connected, while some are not. If city a is connected directly with city b, and city b is connected directly with city c, then city a is connected indirectly with city c.

A province is a group of directly or indirectly connected cities and no other cities outside of the group.

You are given an n x n matrix isConnected where isConnected[i][j] = 1 if the ith city and the jth city are directly connected, and isConnected[i][j] = 0 otherwise.

Return the total number of provinces.', examples: [{"input":"isConnected = [[1,1,0],[1,1,0],[0,0,1]]","output":"2"},{"input":"isConnected = [[1,0,0],[0,1,0],[0,0,1]]","output":"3"}], nums2 = [2]', output: '2.0' }, { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5' }], constraints: 'n == isConnected.length
n == isConnected[i].length
1 <= n <= 200
isConnected[i][j] is 1 or 0.', hints: ['Union-Find with path compression', 'Or BFS/DFS from each unvisited', 'Count distinct roots'] },
  { id: 138, leetcodeLink: 'https://leetcode.com/problems/redundant-connection/', title: 'Redundant Connection', difficulty: 'Medium', topics: ['Graphs'], patterns: ['union-find'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'In this problem, a tree is an undirected graph that is connected and has no cycles.

You are given a graph that started as a tree with n nodes labeled from 1 to n, with one additional edge added. The added edge has two different vertices chosen from 1 to n, and was not an edge that already existed. The graph is represented as an array edges of length n where edges[i] = [ai, bi] indicates that there is an edge between nodes ai and bi in the graph.

Return an edge that can be removed so that the resulting graph is a tree of n nodes. If there are multiple answers, return the answer that occurs last in the input.', examples: [{"input":"edges = [[1,2],[1,3],[2,3]]","output":"[2,3]"},{"input":"edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]","output":"[1,4]"}], target = 9', output: '4' }, { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }], constraints: 'n == edges.length
3 <= n <= 1000
edges[i].length == 2
1 <= ai < bi <= edges.length', hints: ['Add edges one by one', 'Union-Find detects cycle', 'Return edge that connects same component'] },
  { id: 139, leetcodeLink: 'https://leetcode.com/problems/accounts-merge/', title: 'Accounts Merge', difficulty: 'Medium', topics: ['Graphs', 'Hashing'], patterns: ['union-find', 'dfs'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 45, timeEstimate: 30, description: 'Given a list of accounts where each element accounts[i] is a list of strings, where the first element accounts[i][0] is a name, and the rest of the elements are emails representing emails of the account.

Now, we would like to merge these accounts. Two accounts definitely belong to the same person if there is some common email to both accounts. Note that even if two accounts have the same name, they may belong to different people as people could have the same name. A person can have any number of accounts initially, but all of their accounts definitely have the same name.

After merging the accounts, return the accounts in the following format: the first element of each account is the name, and the rest of the elements are emails in sorted order. The accounts themselves can be returned in any order.', examples: [{"input":"accounts = [[\"John\",\"johnsmith@mail.com\",\"john_newyork@mail.com\"],[\"John\",\"johnsmith@mail.com\",\"john00@mail.com\"],[\"Mary\",\"mary@mail.com\"],[\"John\",\"johnnybravo@mail.com\"]]","output":"[[\"John\",\"john00@mail.com\",\"john_newyork@mail.com\",\"johnsmith@mail.com\"],[\"Mary\",\"mary@mail.com\"],[\"John\",\"johnnybravo@mail.com\"]]"}]', output: '[1,2,3,5]' }, { input: 'nums = [5,1,1,2,0,0]', output: '[0,0,1,1,2,5]' }], constraints: '1 <= accounts.length <= 1000
2 <= accounts[i].length <= 10
1 <= accounts[i][j].length <= 30', hints: ['Union-Find on email addresses', 'Map each email to account index', 'Group emails by root'] },

  // ── Topological Sort Logic ──
  { id: 140, leetcodeLink: 'https://leetcode.com/problems/course-schedule-ii/', studyPlans: ['top-interview-150'], title: 'Course Schedule II (Order)', difficulty: 'Medium', topics: ['Graphs'], patterns: ['topological-sort', 'bfs'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.

Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array.', examples: [{"input":"numCourses = 2, prerequisites = [[1,0]]","output":"[0,1]"},{"input":"numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]","output":"[0,2,1,3]"}]', output: '[2,1,4,3]' }, { input: 'head = []', output: '[]' }, { input: 'head = [1]', output: '[1]' }], constraints: '1 <= numCourses <= 2000
0 <= prerequisites.length <= numCourses * (numCourses - 1)
prerequisites[i].length == 2
0 <= ai, bi < numCourses', hints: ['Kahn\'s algorithm with indegree', 'BFS processing zero-indegree nodes', 'If result size < n, no valid order'] },
  { id: 141, leetcodeLink: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/', title: 'Longest Path in DAG', difficulty: 'Hard', topics: ['Graphs', 'Dynamic Programming'], patterns: ['topological-sort', 'dp-fibonacci'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 30, description: 'Given an m x n integers matrix, return the length of the longest increasing path in matrix.

From each cell, you can either move in four directions: left, right, up, or down. You may not move diagonally or move outside the boundary (i.e., wrap-around is not allowed).'s Tortoise and Hare algorithm to detect and find the cycle start.', examples: [{"input":"matrix = [[9,9,4],[6,6,8],[2,1,1]]","output":"4","explanation":"The longest increasing path is [1, 2, 6, 9]."}], pos = 1', output: 'Node at index 1 (value 2)', explanation: 'Tail connects to node index 1.' }, { input: 'head = [1], pos = -1', output: 'null' }], constraints: 'm == matrix.length
n == matrix[i].length
1 <= m, n <= 200
0 <= matrix[i][j] <= 2^31 - 1', hints: ['Topological sort first', 'DP in topological order', 'dist[v] = max(dist[u] + weight(u,v))'] },
  { id: 142, leetcodeLink: 'https://leetcode.com/problems/task-scheduler/', title: 'Task Scheduler', difficulty: 'Medium', topics: ['Arrays', 'Greedy', 'Heap'], patterns: ['greedy', 'top-k'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 50, timeEstimate: 25, description: 'Given a characters array tasks, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or just be idle.

However, there is a non-negative integer n that represents the cooldown period between two same tasks (the same letter in the array), that is that there must be at least n units of time between any two same tasks.

Return the least number of units of times that the CPU will take to finish all the given tasks.', examples: [{"input":"tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"], n = 2","output":"8","explanation":"A -> B -> idle -> A -> B -> idle -> A -> B"}], l2 = [5,6,4]', output: '[7,0,8]', explanation: '342 + 465 = 807.' }, { input: 'l1 = [0], l2 = [0]', output: '[0]' }], constraints: '1 <= task.length <= 10^4
tasks[i] is an uppercase English letter.
0 <= n <= 100', hints: ['Count frequency of each task', 'Most frequent task dictates length', 'Fill gaps with other tasks or idle'] },

  // ── DP: Fibonacci / State Machine ──
  { id: 143, leetcodeLink: 'https://leetcode.com/problems/decode-ways/', title: 'Decode Ways', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming'], patterns: ['dp-fibonacci'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 42, timeEstimate: 25, description: 'A message containing letters from A-Z can be encoded into numbers using the following mapping:
\'A\' -> "1"
\'B\' -> "2"
...
\'Z\' -> "26"

To decode an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above (there may be multiple ways). For example, "11106" can be mapped into:
"AAJF" with the grouping (1 1 10 6)
"KJF" with the grouping (11 10 6)
Note that the grouping (1 11 06) is invalid because "06" cannot be mapped into \'F\' since "6" is different from "06".

Given a string s containing only digits, return the number of ways to decode it.', examples: [{"input":"s = \"12\"","output":"2","explanation":"\"12\" could be decoded as \"AB\" (1 2) or \"L\" (12)."},{"input":"s = \"226\"","output":"3","explanation":"\"226\" could be decoded as \"BZ\" (2 26), \"VF\" (22 6), or \"BBF\" (2 2 6)."}]', output: '[1,4,2,3]' }, { input: 'head = [1,2,3,4,5]', output: '[1,5,2,4,3]' }], constraints: '1 <= s.length <= 100
s contains only digits and may contain leading zero(s).', hints: ['dp[i] depends on dp[i-1] and dp[i-2]', 'Check single digit and two digit validity', 'Handle zeros carefully'] },
  { id: 144, leetcodeLink: 'https://leetcode.com/problems/unique-paths/', title: 'Unique Paths in Grid', difficulty: 'Medium', topics: ['Dynamic Programming', 'Matrix'], patterns: ['dp-fibonacci', 'dp-grid'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 60, timeEstimate: 15, description: 'There is a robot on an m x n grid. The robot is initially located at the top-left corner (i.e., grid[0][0]). The robot tries to move to the bottom-right corner (i.e., grid[m - 1][n - 1]). The robot can only move either down or right at any point in time.

Given the two integers m and n, return the number of possible unique paths that the robot can take to reach the bottom-right corner.', examples: [{"input":"m = 3, n = 7","output":"28"},{"input":"m = 3, n = 2","output":"3"}], x = 3', output: '[1,2,2,4,3,5]' }, { input: 'head = [2,1], x = 2', output: '[1,2]' }], constraints: '1 <= m, n <= 100', hints: ['dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'First row and column all have 1 path', 'Can optimize to 1D array'] },
  { id: 145, leetcodeLink: 'https://leetcode.com/problems/minimum-path-sum/', studyPlans: ['top-interview-150'], title: 'Minimum Path Sum', difficulty: 'Medium', topics: ['Dynamic Programming', 'Matrix'], patterns: ['dp-fibonacci', 'dp-grid'], companies: ['amazon', 'google', 'goldman'], frequency: 'high', acceptance: 58, timeEstimate: 20, description: 'Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.

Note: You can only move either down or right at any point in time.', examples: [{"input":"grid = [[1,3,1],[1,5,1],[4,2,1]]","output":"7","explanation":"Because the path 1 -> 3 -> 1 -> 1 -> 1 minimizes the sum."}]', output: '[1,2,5]' }, { input: 'head = [1,1,1,2,3]', output: '[2,3]' }], constraints: 'm == grid.length
n == grid[i].length
1 <= m, n <= 200
0 <= grid[i][j] <= 100', hints: ['dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])', 'Fill first row and column first', 'In-place modification possible'] },
  { id: 146, leetcodeLink: 'https://leetcode.com/problems/maximum-product-subarray/', studyPlans: ['top-interview-150'], title: 'Maximum Product Subarray', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming'], patterns: ['dp-fibonacci'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 45, timeEstimate: 20, description: 'Given an integer array nums, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a 32-bit integer.'s h-index.\n\nThe h-index is the maximum value of h such that the researcher has at least h papers with h or more citations.', examples: [{"input":"nums = [2,3,-2,4]","output":"6","explanation":"[2,3] has the largest product 6."},{"input":"nums = [-2,0,-1]","output":"0","explanation":"The result cannot be 2, because [-2,-1] is not a subarray."}]', output: '3', explanation: '3 papers have >= 3 citations each.' }, { input: 'citations = [1,3,1]', output: '1' }], constraints: '1 <= nums.length <= 2 * 10^4
-10 <= nums[i] <= 10
The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.', hints: ['Track both max and min products', 'Negative * negative = positive', 'Reset on zero'] },
  { id: 147, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', title: 'Stock Buy Sell with Cooldown', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming'], patterns: ['dp-fibonacci', 'dp-state-machine'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.

Find the maximum profit you can achieve. You may complete as many transactions as you like (i.e., buy one and sell one share of the stock multiple times) with the following restrictions:

After you sell your stock, you cannot buy stock on the next day (i.e., cooldown one day).
Note: You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).', examples: [{"input":"prices = [1,2,3,0,2]","output":"3","explanation":"transactions = [buy, sell, cooldown, buy, sell]"},{"input":"prices = [1]","output":"0"}]', output: '[1,3,12,0,0]' }, { input: 'nums = [0]', output: '[0]' }], constraints: '1 <= prices.length <= 5000
0 <= prices[i] <= 1000', hints: ['State machine: hold, sold, rest', 'hold[i] = max(hold[i-1], rest[i-1] - price)', 'Rest after sell'] },
  { id: 148, leetcodeLink: 'https://leetcode.com/problems/paint-house/', title: 'Paint Houses', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dp-fibonacci'], companies: ['meta', 'google'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'There is a row of n houses, where each house can be painted one of three colors: red, blue, or green. The cost of painting each house with a certain color is different. You have to paint all the houses such that no two adjacent houses have the same color.

The cost of painting each house with a certain color is represented by an n x 3 cost matrix costs.

For example, costs[0][0] is the cost of painting house 0 with the color red; costs[1][2] is the cost of painting house 1 with color green, and so on.
Return the minimum cost to paint all houses.', examples: [{"input":"costs = [[17,2,17],[16,16,5],[14,3,19]]","output":"10","explanation":"Paint house 0 into blue, paint house 1 into green, paint house 2 into blue. Minimum cost: 2 + 5 + 3 = 10."}]', output: '3', explanation: 'The last three elements are consecutive 1s.' }, { input: 'nums = [1,0,1,1,0,1]', output: '2' }], constraints: 'costs.length == n
costs[i].length == 3
1 <= n <= 100
1 <= costs[i][j] <= 20', hints: ['dp[i][c] = cost[i][c] + min of other colors dp[i-1]', 'Three states per house', 'Only need previous row'] },

  // ── DP: Knapsack Variants ──
  { id: 149, leetcodeLink: 'https://leetcode.com/problems/target-sum/', title: 'Target Sum (±)', difficulty: 'Medium', topics: ['Dynamic Programming', 'Recursion'], patterns: ['dp-knapsack', 'backtracking'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'You are given an integer array nums and an integer target.

You want to build an expression out of nums by adding one of the symbols \'+\' and \'-\' before each integer in nums and then concatenate all the integers.

For example, if nums = [2, 1], you can add a \'+\' before 2 and a \'-\' before 1 and concatenate them to build the expression "+2-1".
Return the number of different expressions that you can build, which evaluates to target.', examples: [{"input":"nums = [1,1,1,1,1], target = 3","output":"5","explanation":"There are 5 ways to assign symbols to make the sum of nums be target 3.\n-1 + 1 + 1 + 1 + 1 = 3\n+1 - 1 + 1 + 1 + 1 = 3\n+1 + 1 - 1 + 1 + 1 = 3\n+1 + 1 + 1 - 1 + 1 = 3\n+1 + 1 + 1 + 1 - 1 = 3"}]', output: '3' }, { input: 'nums = [2,2,1,1,1,2,2]', output: '2' }], constraints: '1 <= nums.length <= 20
0 <= nums[i] <= 1000
0 <= sum(nums[i]) <= 1000
-1000 <= target <= 1000', hints: ['Reduces to subset sum problem', 'Find subset with sum = (total + target) / 2', '0/1 knapsack on count'] },
  { id: 150, leetcodeLink: 'https://leetcode.com/problems/coin-change-2/', title: 'Coin Change II (Count Ways)', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dp-knapsack'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the number of combinations that make up that amount. If that amount of money cannot be made up by any combination of the coins, return 0.

You may assume that you have an infinite number of each kind of coin.

The answer is guaranteed to fit into a signed 32-bit integer.', examples: [{"input":"amount = 5, coins = [1,2,5]","output":"4","explanation":"there are four ways to make up the amount:\n5=5\n5=2+2+1\n5=2+1+1+1\n5=1+1+1+1+1"}]', output: 'true' }, { input: 'head = [1,2]', output: 'false' }], constraints: '1 <= coins.length <= 300
1 <= coins[i] <= 5000
All the values of coins are unique.
0 <= amount <= 5000', hints: ['Unbounded knapsack', 'dp[amount] += dp[amount - coin]', 'Process coins in outer loop'] },
  { id: 151, leetcodeLink: 'https://leetcode.com/problems/ones-and-zeroes/', title: 'Ones and Zeroes', difficulty: 'Medium', topics: ['Dynamic Programming', 'Strings'], patterns: ['dp-knapsack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'You are given an array of binary strings strs and two integers m and n.

Return the size of the largest subset of strs such that there are at most m 0\'s and n 1\'s in the subset.

A set x is a subset of a set y if all elements of x are also elements of y.', examples: [{"input":"strs = [\"10\",\"0001\",\"111001\",\"1\",\"0\"], m = 5, n = 3","output":"4","explanation":"The largest subset with at most 5 0\'s and 3 1\'s is {\"10\", \"0001\", \"1\", \"0\"}."}]', output: '[3,4,5]', explanation: 'Middle node is 3.' }, { input: 'head = [1,2,3,4,5,6]', output: '[4,5,6]', explanation: 'Two middle nodes 3 and 4, return the second one.' }], constraints: '1 <= strs.length <= 600
1 <= strs[i].length <= 100
strs[i] consists only of digits \'0\' and \'1\'.
1 <= m, n <= 100', hints: ['2D knapsack: m zeros and n ones', 'dp[i][j] = max strings with i 0s and j 1s', 'Process strings in reverse'] },

  // ── DP: Subsequence & String ──
  { id: 152, leetcodeLink: 'https://leetcode.com/problems/maximum-length-of-repeated-subarray/', title: 'Longest Common Substring', difficulty: 'Medium', topics: ['Dynamic Programming', 'Strings'], patterns: ['dp-subsequence'], companies: ['amazon', 'google', 'tcs'], frequency: 'high', acceptance: 52, timeEstimate: 20, description: 'Given two integer arrays nums1 and nums2, return the maximum length of a subarray that appears in both arrays.', examples: [{"input":"nums1 = [1,2,3,2,1], nums2 = [3,2,1,4,7]","output":"3","explanation":"The repeated subarray with maximum length is [3,2,1]."},{"input":"nums1 = [0,0,0,0,0], nums2 = [0,0,0,0,0]","output":"5"}]' }, { input: 'x = 3, y = 5, bound = 15', output: '[2,4,6,8,10,14]' }], constraints: '1 <= nums1.length, nums2.length <= 1000
0 <= nums1[i], nums2[i] <= 100', hints: ['dp[i][j] = dp[i-1][j-1] + 1 if match', 'Reset to 0 if no match', 'Track global maximum'] },
  { id: 153, leetcodeLink: 'https://leetcode.com/problems/distinct-subsequences/', title: 'Distinct Subsequences', difficulty: 'Hard', topics: ['Dynamic Programming', 'Strings'], patterns: ['dp-string'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 38, timeEstimate: 30, description: 'Given two strings s and t, return the number of distinct subsequences of s which equals t.

The test cases are generated so that the answer fits on a 32-bit signed integer.', examples: [{"input":"s = \"rabbbit\", t = \"rabbit\"","output":"3","explanation":"As shown below, there are 3 ways you can generate \"rabbit\" from s.\nrabbbit\nrabbbit\nrabbbit"}]\n[[[7,3,15,null,null,9,20]],[],[],[],[],[],[],[],[],[]]', output: '[null,3,7,true,9,true,15,true,20,false]' }], constraints: '1 <= s.length, t.length <= 1000
s and t consist of English letters.', hints: ['dp[i][j]: ways to form t[0..j] from s[0..i]', 'Match: dp[i-1][j-1] + dp[i-1][j]', 'No match: dp[i-1][j]'] },
  { id: 154, leetcodeLink: 'https://leetcode.com/problems/palindrome-partitioning/', title: 'Palindrome Partitioning', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming', 'Backtracking'], patterns: ['dp-string', 'backtracking'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of s.', examples: [{"input":"s = \"aab\"","output":"[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]"},{"input":"s = \"a\"","output":"[[\"a\"]]"}]', output: '18', explanation: 'Nodes with even grandparent (6 or 8): 2+7+1+3+5 = 18. Actually nodes 2,7,1,3 have grandparent 6 (even) and 5 has grandparent 8 (even).' }], constraints: '1 <= s.length <= 16
s contains only lowercase English letters.', hints: ['Backtracking to generate partitions', 'Check palindrome for each prefix', 'Precompute palindrome DP table'] },
  { id: 155, leetcodeLink: 'https://leetcode.com/problems/interleaving-string/', studyPlans: ['top-interview-150'], title: 'Interleaving String', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming'], patterns: ['dp-string'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'Given strings s1, s2, and s3, find whether s3 is formed by an interleaving of s1 and s2.

An interleaving of two strings s and t is a configuration where s and t are divided into n and m substrings respectively, such that:
s = s1 + s2 + ... + sn
t = t1 + t2 + ... + tm
s3 = s1 + t1 + s2 + t2 + ...

Notice that the lengths of the substrings can be 0. Also, sum of lengths of parts = s.length + t.length.', examples: [{"input":"s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbcbcac\"","output":"true"},{"input":"s1 = \"aabcc\", s2 = \"dbbca\", s3 = \"aadbbbaccc\"","output":"false"}], targetSum = 22', output: 'true', explanation: 'Path 5 → 4 → 11 → 2 sums to 22.' }, { input: 'root = [1,2,3], targetSum = 5', output: 'false' }], constraints: '0 <= s1.length, s2.length <= 100
0 <= s3.length <= 200
s1, s2, and s3 consist of lowercase English letters.', hints: ['2D DP: dp[i][j] for s1[0..i] and s2[0..j]', 'Match character from s1 or s2', 'Both must be fully consumed'] },

  // ── DP: Interval ──
  { id: 156, leetcodeLink: 'https://leetcode.com/problems/burst-balloons/', title: 'Burst Balloons', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dp-interval'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'You are given n balloons, indexed from 0 to n - 1. Each balloon is painted with a number on it represented by an array nums. You are asked to burst all the balloons.

If you burst the ith balloon, you will get nums[i - 1] * nums[i] * nums[i + 1] coins. If i - 1 or i + 1 goes out of bounds of the array, then treat it as if there is a balloon with a 1 painted on it.

Return the maximum coins you can collect by bursting the balloons wisely.', examples: [{"input":"nums = [3,1,5,8]","output":"167","explanation":"nums = [3,1,5,8] --> [3,5,8] --> [3,8] --> [8] --> []\ncoins =  3*1*5    +   3*5*8   +  1*3*8  + 1*8*1 = 167"}],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]' }, { input: 'adjList = [[]]', output: '[[]]' }], constraints: 'n == nums.length
1 <= n <= 300
0 <= nums[i] <= 100', hints: ['Think in reverse: which to burst last', 'dp[i][j] = max coins for range i..j', 'Try each k as last balloon in range'] },
  { id: 157, leetcodeLink: 'https://leetcode.com/problems/minimum-cost-to-merge-stones/', title: 'Minimum Cost to Merge Stones', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dp-interval'], companies: ['google', 'amazon'], frequency: 'low', acceptance: 30, timeEstimate: 40, description: 'There are n piles of stones arranged in a row. The ith pile has stones[i] stones.

A move consists of merging exactly k consecutive piles into one pile, and the cost of this move is equal to the total number of stones in these k piles.

Return the minimum cost to merge all piles of stones into one pile. If it is impossible, return -1.', examples: [{"input":"stones = [3,2,4,1], k = 2","output":"20","explanation":"We start with [3, 2, 4, 1].\nWe merge [3, 2] for a cost of 5, and we are left with [5, 4, 1].\nWe merge [4, 1] for a cost of 5, and we are left with [5, 5].\nWe merge [5, 5] for a cost of 10, and we are left with [10].\nThe total cost was 20, and this is the minimum possible."}],[1,2,1],[1,3,4],[2,3,1]], threshold = 4', output: '3', explanation: 'Cities reachable within distance 4: city 0→{1,2}, city 1→{0,2,3}, city 2→{1,3}, city 3→{1,2}. City 0 and 3 both have 2 neighbors, return 3.' }], constraints: 'n == stones.length
1 <= n <= 30
1 <= stones[i] <= 100
2 <= k <= 30', hints: ['Interval DP with step of K', 'dp[i][j] = min cost to merge piles i..j', 'Prefix sums for range costs'] },
  { id: 158, leetcodeLink: 'https://leetcode.com/problems/longest-palindromic-subsequence/', title: 'Longest Palindromic Subsequence', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming'], patterns: ['dp-interval', 'dp-subsequence'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'Given a string s, find the longest palindromic subsequence\'s length in s.

A subsequence is a sequence that can be derived from another sequence by deleting some or no elements without changing the order of the remaining elements.', examples: [{"input":"s = \"bbbab\"","output":"4","explanation":"One possible longest palindromic subsequence is \"bbbb\"."},{"input":"s = \"cbbd\"","output":"2","explanation":"One possible longest palindromic subsequence is \"bb\"."}],[0,3,7],[1,2,2],[2,3,1]]', output: '[[0,3,5,6],[INF,0,2,3],[INF,INF,0,1],[INF,INF,INF,0]]' }], constraints: '1 <= s.length <= 1000
s consists only of lowercase English letters.', hints: ['dp[i][j] for substring s[i..j]', 'If s[i]==s[j]: 2 + dp[i+1][j-1]', 'Else: max(dp[i+1][j], dp[i][j-1])'] },

  // ── Greedy Logic Building ──
  { id: 159, leetcodeLink: 'https://leetcode.com/problems/jump-game-ii/', studyPlans: ['top-interview-150'], title: 'Jump Game II (Minimum Jumps)', difficulty: 'Medium', topics: ['Arrays', 'Greedy'], patterns: ['greedy'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 45, timeEstimate: 20, description: 'You are given a 0-indexed array of integers nums of length n. You are initially positioned at nums[0].

Each element nums[i] represents the maximum length of a forward jump from index i. In other words, if you are at nums[i], you can jump to any nums[i + j] where:
0 <= j <= nums[i] and
i + j < n

Return the minimum number of jumps to reach nums[n - 1].', examples: [{"input":"nums = [2,3,1,1,4]","output":"2","explanation":"The minimum number of jumps to reach the last index is 2. Jump 1 step from index 0 to 1, then 3 steps to the last index."}],[0,2,4],[1,2,3],[1,3,2],[1,4,2],[3,2,5],[3,1,1],[4,3,-3]], src = 0', output: '[0,-1,2,-2,1]' }], constraints: '1 <= nums.length <= 10^4
0 <= nums[i] <= 1000
It\'s guaranteed that you can reach nums[n - 1].', hints: ['Track farthest reachable at each level', 'Increment jumps at level boundary', 'BFS-like greedy approach'] },
  { id: 160, leetcodeLink: 'https://leetcode.com/problems/gas-station/', studyPlans: ['top-interview-150'], title: 'Gas Station Circuit', difficulty: 'Medium', topics: ['Arrays', 'Greedy'], patterns: ['greedy'], companies: ['google', 'amazon', 'uber'], frequency: 'high', acceptance: 48, timeEstimate: 25, description: 'There are n gas stations along a circular route, where the amount of gas at the ith station is gas[i].

You have a car with an unlimited gas tank and it costs cost[i] of gas to travel from the ith station to its next (i + 1)th station. You begin the journey with an empty tank at one of the gas stations.

Given two integer arrays gas and cost, return the starting gas station\'s index if you can travel around the circuit once in the clockwise direction, otherwise return -1. If there exists a solution, it is guaranteed to be unique', examples: [{"input":"gas = [1,2,3,4,5], cost = [3,4,5,1,2]","output":"3","explanation":"Start at station 3 (index 3) and fill up with 4 unit of gas. Your tank = 0 + 4 = 4\nTravel to station 4. Your tank = 4 - 1 + 5 = 8\nTravel to station 0. Your tank = 8 - 2 + 1 = 7\nTravel to station 1. Your tank = 7 - 3 + 2 = 6\nTravel to station 2. Your tank = 6 - 4 + 3 = 5\nTravel to station 3. The cost is 5. Your gas is just enough to travel back to station 3."}],[0,2],[2,1],[0,3],[3,4]]', output: '3', explanation: 'SCCs: {0,1,2}, {3}, {4}.' }], constraints: 'n == gas.length == cost.length
1 <= n <= 10^5
0 <= gas[i], cost[i] <= 10^4', hints: ['If total gas >= total cost, solution exists', 'Track remaining gas', 'Reset start when tank goes negative'] },
  { id: 161, leetcodeLink: 'https://leetcode.com/problems/candy/', studyPlans: ['top-interview-150'], title: 'Candy Distribution', difficulty: 'Hard', topics: ['Arrays', 'Greedy'], patterns: ['greedy', 'two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 38, timeEstimate: 25, description: 'There are n children standing in a line. Each child is assigned a rating value given in the integer array ratings.

You are giving candies to these children subjected to the following requirements:
Each child must have at least one candy.
Children with a higher rating get more candies than their neighbors.

Return the minimum number of candies you need to have to distribute the candies to the children.', examples: [{"input":"ratings = [1,0,2]","output":"5","explanation":"You can allocate to the first, second and third child with 2, 1, 2 candies respectively."},{"input":"ratings = [1,2,2]","output":"4","explanation":"You can allocate to the first, second and third child with 1, 2, 1 candies respectively."}],[1,2],[2,0],[1,3],[3,4]]', output: '[1,3]', explanation: 'Removing node 1 or 3 disconnects the graph.' }], constraints: 'n == ratings.length
1 <= n <= 2 * 10^4
0 <= ratings[i] <= 2 * 10^4', hints: ['Two passes: left to right, right to left', 'Each pass enforces one direction', 'Take max of both passes'] },
  { id: 162, leetcodeLink: 'https://leetcode.com/problems/non-overlapping-intervals/', title: 'Non-Overlapping Intervals', difficulty: 'Medium', topics: ['Arrays', 'Greedy', 'Sorting'], patterns: ['greedy', 'merge-intervals', 'interval-scheduling'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 50, timeEstimate: 20, description: 'Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.', examples: [{"input":"intervals = [[1,2],[2,3],[3,4],[1,3]]","output":"1","explanation":"[1,3] can be removed and the rest of the intervals are non-overlapping."},{"input":"intervals = [[1,2],[1,2],[1,2]]","output":"2","explanation":"You need to remove two [1,2] to make the rest of the intervals non-overlapping."}],[1,2],[2,0],[1,3]]', output: '[[1,3]]', explanation: 'Only edge (1,3) is a bridge.' }], constraints: '1 <= intervals.length <= 10^5
intervals[i].length == 2
-5 * 10^4 <= starti < endi <= 5 * 10^4', hints: ['Sort by end time', 'Greedily keep earliest ending', 'Count removals'] },
  { id: 163, leetcodeLink: 'https://leetcode.com/problems/meeting-rooms-ii/', title: 'Meeting Rooms II', difficulty: 'Medium', topics: ['Arrays', 'Sorting', 'Heap'], patterns: ['merge-intervals', 'greedy', 'interval-scheduling'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 48, timeEstimate: 20, description: 'Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.', examples: [{"input":"intervals = [[0,30],[5,10],[15,20]]","output":"2"},{"input":"intervals = [[7,10],[2,4]]","output":"1"}],["e","t","a","e"]], words = ["oath","eat","rain"]', output: '["eat","oath"]' }], constraints: '1 <= intervals.length <= 10^4
0 <= starti < endi <= 10^6', hints: ['Sort by start time', 'Min-heap for end times', 'Reuse room if earliest end <= current start'] },

  // ── Merge Intervals Pattern ──
  { id: 164, leetcodeLink: 'https://leetcode.com/problems/merge-intervals/', studyPlans: ['top-interview-150'], title: 'Merge Overlapping Intervals', difficulty: 'Medium', topics: ['Arrays', 'Sorting'], patterns: ['merge-intervals'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.', examples: [{"input":"intervals = [[1,3],[2,6],[8,10],[15,18]]","output":"[[1,6],[8,10],[15,18]]","explanation":"Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."}]\n[[3],[1],[10],[3],[5]]', output: '[null,1.0,5.5,4.667,6.0]', explanation: 'Window size 3: [1]=1.0, [1,10]=5.5, [1,10,3]=4.667, [10,3,5]=6.0.' }], constraints: '1 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= starti <= endi <= 10^4', hints: ['Sort by start time', 'Merge if current start <= prev end', 'Update end to max of both'] },
  { id: 165, leetcodeLink: 'https://leetcode.com/problems/insert-interval/', studyPlans: ['top-interview-150'], title: 'Insert Interval', difficulty: 'Medium', topics: ['Arrays'], patterns: ['merge-intervals'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 50, timeEstimate: 20, description: 'You are given an array of non-overlapping intervals intervals where intervals[i] = [starti, endi] represent the start and the end of the ith interval and intervals is sorted in ascending order by starti. You are also given an interval newInterval = [start, end] that represents the start and end of another interval.

Insert newInterval into intervals such that intervals is still sorted in ascending order by starti and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).', examples: [{"input":"intervals = [[1,3],[6,9]], newInterval = [2,5]","output":"[[1,5],[6,9]]"},{"input":"intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]","output":"[[1,2],[3,10],[12,16]]"}]', output: '[2,-1,2]', explanation: 'For 1 at index 0: next greater is 2. For 2: no greater circularly → -1. For 1 at index 2: circularly the next greater is 2.' }, { input: 'nums = [1,2,3,4,3]', output: '[2,3,4,-1,4]' }], constraints: '0 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= starti <= endi <= 10^5
newInterval.length == 2
0 <= start <= end <= 10^5', hints: ['Add non-overlapping before', 'Merge all overlapping', 'Add non-overlapping after'] },
  { id: 166, leetcodeLink: 'https://leetcode.com/problems/interval-list-intersections/', title: 'Interval List Intersections', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['merge-intervals', 'two-pointers'], companies: ['meta', 'google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'You are given two lists of closed intervals, firstList and secondList, where firstList[i] = [starti, endi] and secondList[j] = [startj, endj]. Each list of intervals is pairwise disjoint and in sorted order.

Return the intersection of these two interval lists.', examples: [{"input":"firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]","output":"[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]"}]', output: '[1,1,4,2,1,1,0,0]' }, { input: 'temperatures = [30,40,50,60]', output: '[1,1,1,0]' }], constraints: '0 <= firstList.length, secondList.length <= 1000
firstList.length + secondList.length >= 1
0 <= starti < endi <= 10^9
0 <= startj < endj <= 10^9', hints: ['Two pointers on both lists', 'Intersection = [max(starts), min(ends)]', 'Advance pointer with smaller end'] },
  { id: 167, leetcodeLink: 'https://leetcode.com/problems/employee-free-time/', title: 'Employee Free Time', difficulty: 'Hard', topics: ['Arrays', 'Sorting', 'Heap'], patterns: ['merge-intervals', 'k-way-merge'], companies: ['google', 'meta', 'uber'], frequency: 'medium', acceptance: 40, timeEstimate: 30, description: 'We are given a list schedule of employees, which represents the working time for each employee.

Each employee has a list of non-overlapping Intervals, and these intervals are in sorted order.

Return the list of finite intervals representing common, positive-length free time for all employees, also in sorted order.', examples: [{"input":"schedule = [[[1,2],[5,6]],[[1,3]],[[4,10]]]","output":"[[3,4]]","explanation":"There are a total of three employees, and all common free time intervals would be [-inf, 1], [3, 4], [10, inf]."}], target = 6', output: '3', explanation: 'Pairs: (1,5), (1,5), (7,-1).' }, { input: 'nums = [1,1,1,1], target = 2', output: '6' }], constraints: '1 <= schedule.length <= 50
1 <= schedule[i].length <= 50
0 <= schedule[i][j].start < schedule[i][j].end <= 10^8', hints: ['Flatten and sort all intervals', 'Merge overlapping work times', 'Gaps between merged intervals'] },

  // ── Trie Logic Building ──
  { id: 168, leetcodeLink: 'https://leetcode.com/problems/replace-words/', title: 'Replace Words with Root', difficulty: 'Medium', topics: ['Strings', 'Trie'], patterns: ['trie-pattern'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'In English, we have a concept called root, which can be followed by some other word to form another longer word - let\'s call this word derivative. For example, when the root "help" is followed by the word "ful", we can form a derivative "helpful".

Given a dictionary consisting of many roots and a sentence consisting of words separated by spaces, replace all the derivatives in the sentence with the root forming it. If a derivative can be replaced by more than one root, replace it with the root that has the shortest length.', examples: [{"input":"dictionary = [\"cat\",\"bat\",\"rat\"], sentence = \"the cattle was rattled by the battery\"","output":"\"the cat was rat by the bat\""},{"input":"dictionary = [\"a\",\"b\",\"c\"], sentence = \"aadsfasf absbs bbab cadsfafs\"","output":"\"a a b c\""}]', output: '2' }, { input: 'nums = [2,4,3,5,1]', output: '3' }], constraints: '1 <= dictionary.length <= 1000
1 <= dictionary[i].length <= 100
dictionary[i] consists of only lowercase letters.
1 <= sentence.length <= 10^6
sentence consists of only lowercase letters and spaces.', hints: ['Build trie from dictionary', 'For each word, find shortest prefix in trie', 'Replace word with found root'] },
  { id: 169, leetcodeLink: 'https://leetcode.com/problems/design-search-autocomplete-system/', title: 'Design Search Autocomplete', difficulty: 'Hard', topics: ['Trie', 'Design', 'Sorting'], patterns: ['trie-pattern', 'top-k'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 38, timeEstimate: 35, description: 'Design a search autocomplete system for a search engine. Users may input a sentence (at least one word and end with a special character \'#\').

You are given a string array sentences and an integer array times both of length n where sentences[i] is a previously typed sentence and times[i] is the corresponding number of times the sentence was typed. For each input character except \'#\', return the top 3 historical hot sentences that have the same prefix as the part of the sentence already typed.', examples: [{"input":"[\"AutocompleteSystem\", \"input\", \"input\", \"input\", \"input\"]\n[[[\"i love you\", \"island\", \"ironman\", \"i love leetcode\"], [5, 3, 2, 2]], [\"i\"], [\" \"], [\"a\"], [\"#\"]]","output":"[null, [\"i love you\", \"island\", \"i love leetcode\"], [\"i love you\", \"i love leetcode\"], [], []]"}]', output: '"fl"' }, { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: 'There is no common prefix among the input strings.' }], constraints: 'n == sentences.length == times.length
1 <= n <= 100
1 <= sentences[i].length <= 100
1 <= times[i] <= 50
At most 5000 calls will be made to input.', hints: ['Trie with sentence frequencies', 'DFS from current prefix node', 'Sort by frequency, then lexicographic'] },
  { id: 170, leetcodeLink: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/', title: 'Maximum XOR of Two Numbers', difficulty: 'Medium', topics: ['Bit Manipulation', 'Trie'], patterns: ['trie-pattern', 'bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'Given an integer array nums, return the maximum result of nums[i] XOR nums[j], where 0 <= i <= j < n.', examples: [{"input":"nums = [3,10,5,25,2,8]","output":"28","explanation":"The maximum result is 5 XOR 25 = 28."},{"input":"nums = [14,70,53,83,49,91,36,80,92,51,66,70]","output":"127"}], constraints: '1 <= nums.length <= 2 * 10^5
0 <= nums[i] <= 2^31 - 1', hints: ['Build binary trie (MSB to LSB)', 'For each number, traverse opposite bits', 'Greedy XOR maximization'] },

  // ── Bit Manipulation Logic ──
  { id: 171, leetcodeLink: 'https://leetcode.com/problems/regular-expression-matching/', title: 'Missing Number (XOR)', difficulty: 'Easy', topics: ['Arrays', 'Bit Manipulation'], patterns: ['bit-manipulation', 'xor-tricks'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'high', acceptance: 85, timeEstimate: 10, description: 'Given a string s and a pattern p, implement regular expression matching with support for \'.\' and \'*\'.\n\n\'.\' matches any single character. \'*\' matches zero or more of the preceding element.', examples: [{ input: 's = "aa", p = "a"', output: 'false' }, { input: 's = "aa", p = "a*"', output: 'true' }, { input: 's = "ab", p = ".*"', output: 'true' }], constraints: '1 <= s.length <= 20\n1 <= p.length <= 20\ns contains only lowercase English letters.\np contains only lowercase English letters, \'.\', and \'*\'.', hints: ['XOR all nums and 0..n', 'a XOR a = 0', 'Only missing remains'] },
  { id: 172, leetcodeLink: 'https://leetcode.com/problems/wildcard-matching/', title: 'Two Numbers Appearing Once', difficulty: 'Medium', topics: ['Arrays', 'Bit Manipulation'], patterns: ['bit-manipulation', 'xor-tricks'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'Given an input string s and a pattern p, implement wildcard pattern matching with support for \'?\' and \'*\'.\n\n\'?\' matches any single character. \'*\' matches any sequence of characters (including empty).', examples: [{ input: 's = "aa", p = "a"', output: 'false' }, { input: 's = "aa", p = "*"', output: 'true' }, { input: 's = "cb", p = "?a"', output: 'false' }], constraints: '0 <= s.length, p.length <= 2000\ns contains only lowercase English letters.\np contains only lowercase English letters, \'?\', and \'*\'.', hints: ['XOR all = a XOR b', 'Find rightmost set bit to split', 'XOR each group separately'] },
  { id: 173, leetcodeLink: 'https://leetcode.com/problems/string-to-integer-atoi/', studyPlans: ['top-interview-150'], title: 'Reverse Bits', difficulty: 'Easy', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['tcs', 'infosys', 'apple'], frequency: 'medium', acceptance: 72, timeEstimate: 10, description: 'Implement the atoi function which converts a string to a 32-bit signed integer.\n\nThe algorithm: skip whitespace, read optional sign, read digits, clamp to [-2^31, 2^31 - 1].', examples: [{ input: 's = "42"', output: '42' }, { input: 's = "   -42"', output: '-42' }, { input: 's = "4193 with words"', output: '4193' }], constraints: '0 <= s.length <= 200\ns consists of English letters, digits, spaces, +, and -.', hints: ['Extract last bit, shift result left', 'Process all 32 bits', 'OR each extracted bit'] },
  { id: 174, title: 'Counting Bits', difficulty: 'Easy', topics: ['Dynamic Programming', 'Bit Manipulation'], patterns: ['bit-manipulation', 'dp-fibonacci'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'There are n gas stations along a circular route. You have a car with an unlimited gas tank. You start with an empty tank at one of the stations.\n\nReturn the starting gas station index if you can travel around the circuit once clockwise, otherwise return -1.', examples: [{ input: 'gas = [1,2,3,4,5], cost = [3,4,5,1,2]', output: '3', explanation: 'Start at station 3. Tank: 0+4-1=3, 3+5-2=6, 6+1-3=4, 4+2-4=2, 2+3-5=0.' }, { input: 'gas = [2,3,4], cost = [3,4,3]', output: '-1' }], constraints: 'n == gas.length == cost.length\n1 <= n <= 10^5\n0 <= gas[i], cost[i] <= 10^4', hints: ['dp[i] = dp[i >> 1] + (i & 1)', 'Or dp[i] = dp[i & (i-1)] + 1', 'Build on previously computed values'] },

  // ── Advanced Graph Logic ──
  { id: 175, title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', topics: ['Graphs', 'Dynamic Programming'], patterns: ['bfs', 'dp-fibonacci', 'shortest-path'], companies: ['google', 'amazon', 'uber'], frequency: 'high', acceptance: 42, timeEstimate: 30, description: 'Given an integer columnNumber, return its corresponding Excel column title.\n\n1 → A, 2 → B, ..., 26 → Z, 27 → AA, 28 → AB, ...', examples: [{ input: 'columnNumber = 1', output: '"A"' }, { input: 'columnNumber = 28', output: '"AB"' }, { input: 'columnNumber = 701', output: '"ZY"' }], constraints: '1 <= columnNumber <= 2^31 - 1', hints: ['BFS with price tracking', 'Bellman-Ford with K iterations', 'Dijkstra modified with stops constraint'] },
  { id: 176, studyPlans: ['top-interview-150'], title: 'Evaluate Division', difficulty: 'Medium', topics: ['Graphs', 'Hashing'], patterns: ['dfs', 'union-find'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'You are given a perfect binary tree where all leaves are on the same level. Populate each next pointer to point to its next right node. If no next right node, set next to NULL.\n\nInitially, all next pointers are set to NULL.', examples: [{ input: 'root = [1,2,3,4,5,6,7]', output: '[1,#,2,3,#,4,5,6,7,#]', explanation: '# represents the null next pointer.' }], constraints: 'Number of nodes in range [0, 2^12 - 1].\n-1000 <= Node.val <= 1000', hints: ['Build weighted graph', 'DFS from numerator to denominator', 'Multiply weights along path'] },
  { id: 177, title: 'Reconstruct Itinerary', difficulty: 'Hard', topics: ['Graphs'], patterns: ['dfs', 'eulerian-path'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 38, timeEstimate: 30, description: 'Given n nodes labeled 0 to n-1 and a list of undirected edges, write a function to check if these edges form a valid tree.\n\nA valid tree has n-1 edges, is connected, and has no cycles.', examples: [{ input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]', output: 'true' }, { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]', output: 'false', explanation: 'Contains a cycle: 1→2→3→1.' }], constraints: '1 <= n <= 2000\n0 <= edges.length <= 5000\nedges[i].length == 2', hints: ['Eulerian path using DFS', 'Sort destinations lexicographically', 'Build path in reverse post-order'] },
  { id: 178, title: 'Swim in Rising Water', difficulty: 'Hard', topics: ['Graphs', 'Matrix', 'Heap'], patterns: ['bfs', 'binary-search', 'matrix-traversal', 'shortest-path'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'Given n nodes labeled 0 to n-1, find the number of connected components in the undirected graph defined by the given edges.', examples: [{ input: 'n = 5, edges = [[0,1],[1,2],[3,4]]', output: '2', explanation: 'Components: {0,1,2} and {3,4}.' }, { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]', output: '1' }], constraints: '1 <= n <= 2000\n0 <= edges.length <= 5000', hints: ['Binary search on answer + BFS check', 'Or Dijkstra-like with priority queue', 'Process cells in order of elevation'] },

  // ── K-Way Merge Pattern ──
  { id: 179, title: 'Merge K Sorted Arrays', difficulty: 'Medium', topics: ['Arrays', 'Heap'], patterns: ['k-way-merge'], companies: ['amazon', 'google', 'microsoft'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given a list of accounts where each element accounts[i] is a list of strings where the first element is a name and the rest are emails, merge accounts that share a common email.\n\nReturn the merged accounts with emails sorted.', examples: [{ input: 'accounts = [["John","j1@mail","j2@mail"],["John","j1@mail","j3@mail"],["Mary","m@mail"]]', output: '[["John","j1@mail","j2@mail","j3@mail"],["Mary","m@mail"]]' }], constraints: '1 <= accounts.length <= 1000\n2 <= accounts[i].length <= 10\n1 <= accounts[i][j].length <= 30', hints: ['Min-heap of K elements', 'Always extract minimum', 'Insert next element from same array'] },
  { id: 180, title: 'Smallest Range Covering K Lists', difficulty: 'Hard', topics: ['Arrays', 'Heap', 'Sliding Window'], patterns: ['k-way-merge'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 38, timeEstimate: 35, description: 'Design a data structure that supports adding new words and finding if a string matches any previously added word.\n\nThe search word may contain dots \'.\' where each dot can match any letter.', examples: [{ input: '["WordDictionary","addWord","addWord","addWord","search","search","search","search"]\n[[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]', output: '[null,null,null,null,false,true,true,true]' }], constraints: '1 <= word.length <= 25\nword in addWord consists of lowercase English letters.\nword in search consists of \'.\' or lowercase English letters.\nAt most 10^4 calls to addWord and search.', hints: ['Min-heap with one element per list', 'Track global max alongside heap min', 'Advance minimum element'] },
  { id: 181, studyPlans: ['top-interview-150'], title: 'Find K Pairs with Smallest Sums', difficulty: 'Medium', topics: ['Arrays', 'Heap'], patterns: ['k-way-merge', 'top-k'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'Given an integer array arr, find the contiguous subarray (containing at least one number) which has the largest product. Return the product.\n\nBe careful with negative numbers and zeros.', examples: [{ input: 'nums = [2,3,-2,4]', output: '6', explanation: 'Subarray [2,3] has the largest product 6.' }, { input: 'nums = [-2,0,-1]', output: '0' }], constraints: '1 <= nums.length <= 2 * 10^4\n-10 <= nums[i] <= 10\nThe product of any prefix or suffix fits in a 32-bit integer.', hints: ['Min-heap seeded with first row', 'Expand from smallest pair', 'Only advance second array index'] },

  // ── Matrix Logic Building ──
  { id: 182, title: 'Search in 2D Sorted Matrix', difficulty: 'Medium', topics: ['Matrix', 'Binary Search'], patterns: ['binary-search', 'matrix-traversal'], companies: ['amazon', 'google', 'microsoft'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'Given a rows x cols grid where each cell is either 0 (empty) or 1 (obstacle), find the shortest path from (0,0) to (rows-1, cols-1) that allows eliminating at most k obstacles.\n\nReturn the length of the shortest path, or -1 if not possible.', examples: [{ input: 'grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1', output: '6' }, { input: 'grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1', output: '-1' }], constraints: 'm == grid.length\nn == grid[0].length\n1 <= m, n <= 40\n0 <= k <= m * n\ngrid[i][j] is 0 or 1.', hints: ['Start from top-right corner', 'Go left if too large, down if too small', 'O(m+n) staircase search'] },
  { id: 183, title: 'Minimum Path Sum in Triangle', difficulty: 'Medium', topics: ['Dynamic Programming', 'Matrix'], patterns: ['dp-fibonacci', 'dp-grid'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given a 2D grid map of 1s (land) and 0s (water), return the maximum area of an island.\n\nAn island is a group of 1s connected 4-directionally. If there is no island, return 0.', examples: [{ input: 'grid = [[0,0,1,0,0],[0,0,0,0,0],[0,1,1,0,0],[0,1,0,0,0]]', output: '3' }, { input: 'grid = [[0,0,0,0,0]]', output: '0' }], constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 50\ngrid[i][j] is 0 or 1.', hints: ['Bottom-up DP preferred', 'dp[j] = triangle[i][j] + min(dp[j], dp[j+1])', 'Modify triangle in-place'] },
  { id: 184, studyPlans: ['top-interview-150'], title: 'Game of Life', difficulty: 'Medium', topics: ['Matrix'], patterns: ['matrix-traversal'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'You are given an n x n grid representing a field of cherries. Starting from (0,0) go to (n-1,n-1) and back, collecting cherries along the way.\n\nReturn the maximum number of cherries you can collect on both trips combined.', examples: [{ input: 'grid = [[0,1,-1],[1,0,-1],[1,1,1]]', output: '5', explanation: 'Going right-down collects 3 cherries, return trip collects 2 more.' }], constraints: 'n == grid.length\nn == grid[i].length\n1 <= n <= 50\ngrid[i][j] is -1, 0, or 1.', hints: ['Encode next state in unused bits', 'Count neighbors for each cell', 'Extract new state in second pass'] },

  // ── Advanced Backtracking ──
  { id: 185, studyPlans: ['top-interview-150'], title: 'Letter Combinations of Phone', difficulty: 'Medium', topics: ['Strings', 'Backtracking'], patterns: ['backtracking'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'Count the number of prime numbers less than a given non-negative number n using the Sieve of Eratosthenes algorithm.', examples: [{ input: 'n = 10', output: '4', explanation: 'Primes less than 10: 2, 3, 5, 7.' }, { input: 'n = 0', output: '0' }, { input: 'n = 1', output: '0' }], constraints: '0 <= n <= 5 * 10^6', hints: ['Map digits to letters', 'Backtrack through digits', 'Build combinations character by character'] },
  { id: 186, title: 'Restore IP Addresses', difficulty: 'Medium', topics: ['Strings', 'Backtracking'], patterns: ['backtracking'], companies: ['amazon', 'google', 'meta'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'Write a function to determine if a given number is a perfect square without using any built-in sqrt function.\n\nReturn true if num is a perfect square, else false.', examples: [{ input: 'num = 16', output: 'true', explanation: '4 * 4 = 16.' }, { input: 'num = 14', output: 'false' }], constraints: '1 <= num <= 2^31 - 1', hints: ['Exactly 4 segments needed', 'Each segment 0-255, no leading zeros', 'Backtrack on invalid segments'] },
  { id: 187, title: 'Expression Add Operators', difficulty: 'Hard', topics: ['Strings', 'Backtracking', 'Math'], patterns: ['backtracking'], companies: ['meta', 'google'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Given two integers dividend and divisor, divide two integers without using multiplication, division, and mod operators.\n\nReturn the quotient. Truncate toward zero. Handle overflow.', examples: [{ input: 'dividend = 10, divisor = 3', output: '3', explanation: '10/3 = 3.333... truncated to 3.' }, { input: 'dividend = 7, divisor = -3', output: '-2' }], constraints: '-2^31 <= dividend, divisor <= 2^31 - 1\ndivisor != 0', hints: ['Try all positions for operators', 'Track multiplication separately', 'Handle multi-digit numbers and leading zeros'] },
  { id: 188, title: 'Beautiful Arrangement', difficulty: 'Medium', topics: ['Backtracking', 'Bit Manipulation'], patterns: ['backtracking', 'bit-manipulation', 'dp-bitmask'], companies: ['google', 'amazon'], frequency: 'low', acceptance: 55, timeEstimate: 20, description: 'Given the coordinates of two rectilinear rectangles in a 2D plane, return the total area covered by the two rectangles.\n\nEach rectangle is defined by its bottom-left corner (ax1, ay1) and top-right corner (ax2, ay2).', examples: [{ input: 'ax1=-3, ay1=0, ax2=3, ay2=4, bx1=0, by1=-1, bx2=9, by2=2', output: '45' }], constraints: '-10^4 <= ax1 <= ax2 <= 10^4\n-10^4 <= ay1 <= ay2 <= 10^4\n-10^4 <= bx1 <= bx2 <= 10^4\n-10^4 <= by1 <= by2 <= 10^4', hints: ['Backtrack with visited set', 'Prune early on invalid positions', 'Bitmask DP alternative'] },

  // ── Design / System Logic ──
  { id: 189, title: 'LFU Cache', difficulty: 'Hard', topics: ['Design', 'Hashing', 'Linked List'], patterns: ['prefix-sum'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Given a linked list, reverse the nodes of the list k at a time and return the modified list.\n\nk is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k, leave the remaining nodes as is.', examples: [{ input: 'head = [1,2,3,4,5], k = 2', output: '[2,1,4,3,5]' }, { input: 'head = [1,2,3,4,5], k = 3', output: '[3,2,1,4,5]' }], constraints: 'Number of nodes in range [1, 5000].\n0 <= Node.val <= 1000\n1 <= k <= n', hints: ['HashMap for key->value', 'HashMap for freq->doubly linked list', 'Track minimum frequency'] },
  { id: 190, title: 'Design Hit Counter', difficulty: 'Medium', topics: ['Design', 'Queue'], patterns: ['sliding-window'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Given a linked list, rotate the list to the right by k places.\n\nFor example, given 1→2→3→4→5 and k=2, the result is 4→5→1→2→3.', examples: [{ input: 'head = [1,2,3,4,5], k = 2', output: '[4,5,1,2,3]' }, { input: 'head = [0,1,2], k = 4', output: '[2,0,1]' }], constraints: 'Number of nodes in range [0, 500].\n-100 <= Node.val <= 100\n0 <= k <= 2 * 10^9', hints: ['Circular buffer of 300 seconds', 'Queue-based approach', 'Binary search for count in range'] },
  { id: 191, title: 'Implement Stack Using Queues', difficulty: 'Easy', topics: ['Stack', 'Queue', 'Design'], patterns: ['monotonic-stack'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'medium', acceptance: 72, timeEstimate: 15, description: 'Given the head of a linked list, return the list after sorting it in ascending order.\n\nCan you sort the linked list in O(n log n) time and O(1) memory (i.e., constant space)?', examples: [{ input: 'head = [4,2,1,3]', output: '[1,2,3,4]' }, { input: 'head = [-1,5,3,4,0]', output: '[-1,0,3,4,5]' }], constraints: 'Number of nodes in range [0, 5 * 10^4].\n-10^5 <= Node.val <= 10^5', hints: ['Push: enqueue to queue', 'Pop: dequeue n-1 items, re-enqueue', 'Or make push costly'] },

  // ── Math / Number Theory Logic ──
  { id: 192, studyPlans: ['top-interview-150'], title: 'Happy Number', difficulty: 'Easy', topics: ['Math', 'Hashing'], patterns: ['fast-slow'], companies: ['tcs', 'infosys', 'amazon'], frequency: 'medium', acceptance: 68, timeEstimate: 10, description: 'Given the head of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.', examples: [{ input: 'head = [1,1,2]', output: '[1,2]' }, { input: 'head = [1,1,2,3,3]', output: '[1,2,3]' }], constraints: 'Number of nodes in range [0, 300].\n-100 <= Node.val <= 100\nThe list is sorted.', hints: ['Detect cycle using fast-slow pointers', 'Or use hash set for seen numbers', 'If cycle doesn\'t include 1, not happy'] },
  { id: 193, studyPlans: ['top-interview-150'], title: 'Trailing Zeros in Factorial', difficulty: 'Easy', topics: ['Math'], patterns: ['greedy'], companies: ['tcs', 'wipro', 'infosys'], frequency: 'medium', acceptance: 75, timeEstimate: 10, description: 'Given an integer array nums where every element appears three times except for one, which appears exactly once. Find the single element and return it.\n\nYou must implement a solution with linear runtime and O(1) extra space.', examples: [{ input: 'nums = [2,2,3,2]', output: '3' }, { input: 'nums = [0,1,0,1,0,1,99]', output: '99' }], constraints: '1 <= nums.length <= 3 * 10^4\n-2^31 <= nums[i] <= 2^31 - 1\nEvery element appears exactly three times except one.', hints: ['Count factors of 5', 'n/5 + n/25 + n/125 + ...', '5 is the limiting factor over 2'] },
  { id: 194, title: 'Ugly Number II', difficulty: 'Medium', topics: ['Math', 'Dynamic Programming', 'Heap'], patterns: ['dp-fibonacci', 'top-k'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'Given two integers left and right, return the bitwise AND of all numbers in range [left, right] inclusive.', examples: [{ input: 'left = 5, right = 7', output: '4', explanation: '5 & 6 & 7 = 4.' }, { input: 'left = 0, right = 0', output: '0' }, { input: 'left = 1, right = 2147483647', output: '0' }], constraints: '0 <= left <= right <= 2^31 - 1', hints: ['Three pointers for 2, 3, 5', 'Take minimum of three candidates', 'Advance pointer(s) matching minimum'] },
  { id: 195, title: 'Integer to English Words', difficulty: 'Hard', topics: ['Strings', 'Math', 'Recursion'], patterns: ['backtracking'], companies: ['meta', 'amazon', 'microsoft'], frequency: 'medium', acceptance: 30, timeEstimate: 30, description: 'Reverse the bits of a given 32-bit unsigned integer.\n\nReturn the integer with its bits reversed.', examples: [{ input: 'n = 43261596 (00000010100101000001111010011100)', output: '964176192 (00111001011110000010100101000000)' }, { input: 'n = 4294967293 (11111111111111111111111111111101)', output: '3221225471 (10111111111111111111111111111111)' }], constraints: 'The input is a 32-bit unsigned integer.', hints: ['Process three digits at a time', 'Handle Thousand, Million, Billion', 'Special cases for teens'] },

  // ── More Tree Logic Building ──
  { id: 196, studyPlans: ['top-interview-150'], title: 'Kth Smallest in BST', difficulty: 'Medium', topics: ['Trees', 'Binary Search'], patterns: ['dfs', 'tree-inorder'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 60, timeEstimate: 15, description: 'Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1s in the binary representation of i.', examples: [{ input: 'n = 2', output: '[0,1,1]' }, { input: 'n = 5', output: '[0,1,1,2,1,2]' }], constraints: '0 <= n <= 10^5', hints: ['Inorder traversal is sorted', 'Count nodes during traversal', 'Stop at kth node'] },
  { id: 197, title: 'Flatten Binary Tree to List', difficulty: 'Medium', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'tree-preorder'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 52, timeEstimate: 20, description: 'Given a positive integer n, generate a square matrix filled with elements from 1 to n² in spiral order.', examples: [{ input: 'n = 3', output: '[[1,2,3],[8,9,4],[7,6,5]]' }, { input: 'n = 1', output: '[[1]]' }], constraints: '1 <= n <= 20', hints: ['Morris traversal approach', 'Or process right subtree first', 'Connect left child to right'] },
  { id: 198, title: 'All Nodes Distance K', difficulty: 'Medium', topics: ['Trees', 'Graphs'], patterns: ['bfs', 'dfs'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'Given an m x n matrix, if an element is 0, set its entire row and column to 0.\n\nDo it in place using O(1) extra space by using the first row and column as markers.', examples: [{ input: 'matrix = [[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]' }, { input: 'matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' }], constraints: 'm == matrix.length, n == matrix[0].length\n1 <= m, n <= 200\n-2^31 <= matrix[i][j] <= 2^31 - 1', hints: ['Build parent pointers', 'BFS from target node', 'Track visited to avoid revisiting'] },
  { id: 199, title: 'Binary Tree Cameras', difficulty: 'Hard', topics: ['Trees', 'Dynamic Programming', 'Greedy'], patterns: ['dfs', 'greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 38, timeEstimate: 30, description: 'Given a string s representing the column title as it appears in an Excel sheet, return its corresponding column number.\n\nA → 1, B → 2, ..., Z → 26, AA → 27, AB → 28, ...', examples: [{ input: 'columnTitle = "A"', output: '1' }, { input: 'columnTitle = "AB"', output: '28' }, { input: 'columnTitle = "ZY"', output: '701' }], constraints: '1 <= columnTitle.length <= 7\ncolumnTitle consists only of uppercase English letters.\ncolumnTitle is in range ["A", "FXSHRXW"].', hints: ['Post-order DFS with 3 states', 'Covered, has camera, not covered', 'Greedy: place cameras at parents of leaves'] },
  { id: 200, studyPlans: ['top-interview-150'], title: 'Sum Root to Leaf Numbers', difficulty: 'Medium', topics: ['Trees', 'Recursion'], patterns: ['dfs'], companies: ['amazon', 'meta'], frequency: 'medium', acceptance: 58, timeEstimate: 15, description: 'Design a HashMap without using any built-in hash table libraries.\n\nImplement put(key, value), get(key), and remove(key) methods.', examples: [{ input: '["MyHashMap","put","put","get","get","put","get","remove","get"]\n[[],[1,1],[2,2],[1],[3],[2,1],[2],[2],[2]]', output: '[null,null,null,1,-1,null,1,null,-1]' }], constraints: '0 <= key, value <= 10^6\nAt most 10^4 calls to put, get, and remove.', hints: ['DFS passing accumulated number', 'num = num * 10 + node.val', 'Add to sum at leaf nodes'] },

  // ── Additional Logic Builders ──
  { id: 201, studyPlans: ['top-interview-150'], title: 'Majority Element (Boyer-Moore)', difficulty: 'Easy', topics: ['Arrays'], patterns: ['greedy'], companies: ['amazon', 'google', 'tcs'], frequency: 'high', acceptance: 78, timeEstimate: 10, description: 'Implement a basic calculator to evaluate a simple expression string containing non-negative integers, +, -, *, /, and spaces.\n\nOperator precedence: * and / before + and -. Division truncates toward zero.', examples: [{ input: 's = "3+2*2"', output: '7' }, { input: 's = " 3/2 "', output: '1' }, { input: 's = " 3+5 / 2 "', output: '5' }], constraints: '1 <= s.length <= 3 * 10^5\ns consists of digits, +, -, *, /, and spaces.\ns represents a valid expression.', hints: ['Boyer-Moore voting algorithm', 'Maintain candidate and count', 'Candidate survives if majority'] },
  { id: 202, title: 'Next Permutation', difficulty: 'Medium', topics: ['Arrays'], patterns: ['two-pointers'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 45, timeEstimate: 20, description: 'Given a non-negative integer represented as a linked list of digits, add one to the number.\n\nThe digits are stored such that the most significant digit is at the head of the list. Return the updated linked list.', examples: [{ input: 'head = [1,2,3]', output: '[1,2,4]' }, { input: 'head = [9,9,9]', output: '[1,0,0,0]', explanation: '999 + 1 = 1000, so a new node is added.' }], constraints: 'Number of nodes in range [1, 100].\n0 <= Node.val <= 9\nThe number represented does not contain leading zeros except 0 itself.', hints: ['Find rightmost ascending pair', 'Swap with just-larger element from right', 'Reverse suffix after swap point'] },
  { id: 203, title: 'Longest Valid Parentheses', difficulty: 'Hard', topics: ['Strings', 'Stack', 'Dynamic Programming'], patterns: ['monotonic-stack', 'dp-fibonacci'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 35, timeEstimate: 30, description: 'Implement a RandomizedSet class that supports insert, remove, and getRandom in average O(1) time.\n\ngetRandom should return each element with equal probability.', examples: [{ input: '["RandomizedSet","insert","remove","insert","getRandom","remove","insert","getRandom"]\n[[],[1],[2],[2],[],[1],[2],[]]', output: '[null,true,false,true,2,true,false,2]' }], constraints: '-2^31 <= val <= 2^31 - 1\nAt most 2 * 10^5 calls to insert, remove, and getRandom.\nThere will be at least one element when getRandom is called.', hints: ['Stack to track indices', 'Push -1 as base, push index of (', 'On ), pop and calculate length'] },
  { id: 204, title: 'Smallest Window Containing All Characters', difficulty: 'Hard', topics: ['Strings', 'Sliding Window', 'Hashing'], patterns: ['sliding-window'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 38, timeEstimate: 30, description: 'Given a data stream, find the first non-repeating character at each point. If no such character exists, return \'#\'.\n\nProcess the stream character by character and track character frequencies.', examples: [{ input: 'stream = "aabcbc"', output: '["a","#","b","b","c","#"]', explanation: 'After "a"→a, "aa"→#, "aab"→b, "aabc"→b, "aabcb"→c, "aabcbc"→#.' }], constraints: '1 <= stream.length <= 10^5\nstream consists of lowercase English letters.', hints: ['Sliding window with character counts', 'Expand right, shrink left optimally', 'Track matched character count'] },
  { id: 205, studyPlans: ['top-interview-150'], title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topics: ['Arrays', 'Binary Search'], patterns: ['binary-search'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 52, timeEstimate: 15, description: 'Given the head of a singly linked list and two integers left and right where left <= right, reverse the nodes of the list from position left to position right, and return the reversed list.\n\nPositions are 1-indexed.', examples: [{ input: 'head = [1,2,3,4,5], left = 2, right = 4', output: '[1,4,3,2,5]' }, { input: 'head = [5], left = 1, right = 1', output: '[5]' }], constraints: 'Number of nodes in range [1, 500].\n-500 <= Node.val <= 500\n1 <= left <= right <= n', hints: ['Binary search comparing with rightmost', 'If mid > right, min is in right half', 'Otherwise min is in left half'] },
  // ── New Problems: Expanded Pattern Coverage ──

  // Backspace Compare
  { id: 206, title: 'Backspace String Compare', difficulty: 'Easy', topics: ['Strings', 'Two Pointers', 'Stack'], patterns: ['backspace-compare', 'two-pointers'], companies: ['google', 'meta', 'amazon'], frequency: 'high', acceptance: 72, timeEstimate: 15, description: 'Given two strings s and t, return true if they are equal when both are typed into empty text editors. \'#\' means a backspace character.\n\nNote that after backspacing an empty text, the text will remain empty.', examples: [{ input: 's = "ab#c", t = "ad#c"', output: 'true', explanation: 'Both become "ac".' }, { input: 's = "ab##", t = "c#d#"', output: 'true', explanation: 'Both become "".' }, { input: 's = "a#c", t = "b"', output: 'false' }], constraints: '1 <= s.length, t.length <= 200\ns and t only contain lowercase letters and \'#\'.', hints: ['Traverse from end with skip counter', 'Compare characters after processing backspaces', 'O(1) space with reverse two-pointer'] },

  // String Search (KMP)
  { id: 207, studyPlans: ['top-interview-150'], title: 'Implement strStr (KMP)', difficulty: 'Medium', topics: ['Strings'], patterns: ['string-search'], companies: ['amazon', 'microsoft', 'google'], frequency: 'high', acceptance: 45, timeEstimate: 30, description: 'Given two strings haystack and needle, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.\n\nImplement using the KMP (Knuth-Morris-Pratt) algorithm for O(n+m) time complexity.', examples: [{ input: 'haystack = "sadbutsad", needle = "sad"', output: '0' }, { input: 'haystack = "leetcode", needle = "leeto"', output: '-1' }], constraints: '1 <= haystack.length, needle.length <= 10^4\nhaystack and needle consist of lowercase English letters.', hints: ['Build failure/prefix function for needle', 'Use prefix function to skip comparisons', 'Time: O(n+m), Space: O(m)'] },

  // Palindrome Check (various)
  { id: 208, title: 'Valid Palindrome II', difficulty: 'Easy', topics: ['Strings', 'Two Pointers'], patterns: ['palindrome-check', 'two-pointers'], companies: ['meta', 'microsoft', 'amazon'], frequency: 'high', acceptance: 68, timeEstimate: 15, description: 'Given a string s, return true if the string can become a palindrome after deleting at most one character from it.', examples: [{ input: 's = "aba"', output: 'true' }, { input: 's = "abca"', output: 'true', explanation: 'Delete c to get "aba".' }, { input: 's = "abc"', output: 'false' }], constraints: '1 <= s.length <= 10^5\ns consists of lowercase English letters.', hints: ['Two pointers from both ends', 'When mismatch found, try skipping left or right', 'Check both remaining substrings for palindrome'] },

  // Monotonic Queue
  { id: 209, title: 'Shortest Subarray with Sum >= K', difficulty: 'Hard', topics: ['Arrays', 'Queue', 'Sliding Window'], patterns: ['monotonic-queue', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 28, timeEstimate: 35, description: 'Given an integer array nums and an integer k, return the length of the shortest non-empty subarray of nums with a sum of at least k. If there is no such subarray, return -1.\n\nNote: the array may contain negative numbers.', examples: [{ input: 'nums = [1], k = 1', output: '1' }, { input: 'nums = [1,2], k = 4', output: '-1' }, { input: 'nums = [2,-1,2], k = 3', output: '3' }], constraints: '1 <= nums.length <= 10^5\n-10^5 <= nums[i] <= 10^5\n1 <= k <= 10^9', hints: ['Use prefix sums', 'Monotonic deque for optimal subarray', 'Pop from front when sum condition met'] },

  // Character Frequency Match
  { id: 210, title: 'Find All Anagrams in String', difficulty: 'Medium', topics: ['Strings', 'Sliding Window', 'Hashing'], patterns: ['char-freq-match', 'sliding-window-fixed'], companies: ['meta', 'amazon', 'microsoft'], frequency: 'high', acceptance: 52, timeEstimate: 20, description: 'Given two strings s and p, return an array of all the start indices of p\'s anagrams in s. An anagram is a permutation of the original string.\n\nYou may return the answer in any order.', examples: [{ input: 's = "cbaebabacd", p = "abc"', output: '[0, 6]', explanation: 'Substrings "cba" (index 0) and "bac" (index 6) are anagrams of "abc".' }, { input: 's = "abab", p = "ab"', output: '[0, 1, 2]' }], constraints: '1 <= s.length, p.length <= 3 * 10^4\ns and p consist of lowercase English letters.', hints: ['Fixed-size sliding window of length p', 'Compare character frequency arrays', 'Update frequencies as window slides'] },

  // Tree Inorder
  { id: 211, title: 'Binary Tree Inorder Traversal (Iterative)', difficulty: 'Easy', topics: ['Trees', 'Stack'], patterns: ['tree-inorder'], companies: ['amazon', 'microsoft', 'google'], frequency: 'high', acceptance: 75, timeEstimate: 15, description: 'Given the root of a binary tree, return the inorder traversal of its nodes\' values using an iterative approach (no recursion).\n\nInorder means: left subtree → root → right subtree.', examples: [{ input: 'root = [1,null,2,3]', output: '[1,3,2]' }, { input: 'root = []', output: '[]' }, { input: 'root = [1]', output: '[1]' }], constraints: 'Number of nodes in range [0, 100].\n-100 <= Node.val <= 100', hints: ['Use explicit stack', 'Push all left children first', 'Pop, process, then go right'] },

  // Tree Preorder
  { id: 212, title: 'Binary Tree Preorder Traversal (Iterative)', difficulty: 'Easy', topics: ['Trees', 'Stack'], patterns: ['tree-preorder'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Given the root of a binary tree, return the preorder traversal of its nodes\' values using an iterative approach.\n\nPreorder means: root → left subtree → right subtree.', examples: [{ input: 'root = [1,null,2,3]', output: '[1,2,3]' }, { input: 'root = []', output: '[]' }, { input: 'root = [1]', output: '[1]' }], constraints: 'Number of nodes in range [0, 100].\n-100 <= Node.val <= 100', hints: ['Push root to stack', 'Push right child first, then left', 'Pop and process each node'] },

  // Tree Postorder
  { id: 213, title: 'Binary Tree Postorder Traversal (Iterative)', difficulty: 'Medium', topics: ['Trees', 'Stack'], patterns: ['tree-postorder'], companies: ['google', 'microsoft'], frequency: 'medium', acceptance: 62, timeEstimate: 20, description: 'Given the root of a binary tree, return the postorder traversal of its nodes\' values using an iterative approach.\n\nPostorder means: left subtree → right subtree → root.', examples: [{ input: 'root = [1,null,2,3]', output: '[3,2,1]' }, { input: 'root = []', output: '[]' }, { input: 'root = [1]', output: '[1]' }], constraints: 'Number of nodes in range [0, 100].\n-100 <= Node.val <= 100', hints: ['Modified preorder: root → right → left', 'Reverse the result for postorder', 'Or use two stacks approach'] },

  // Tree LCA (BST variant)
  { id: 214, title: 'LCA of Binary Search Tree', difficulty: 'Easy', topics: ['Trees', 'Binary Search'], patterns: ['tree-lca', 'dfs'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 72, timeEstimate: 15, description: 'Given a binary search tree (BST), find the lowest common ancestor (LCA) of two given nodes p and q.\n\nLeverage the BST property: left < root < right.', examples: [{ input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6', explanation: 'LCA of 2 and 8 is 6.' }, { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4', output: '2' }], constraints: 'All Node.val are unique.\np != q and both exist in the BST.\nNumber of nodes in range [2, 10^5].', hints: ['If both < root, go left', 'If both > root, go right', 'Otherwise current node is LCA'] },

  // Shortest Path (Bellman-Ford)
  { id: 215, title: 'Bellman-Ford Shortest Path', difficulty: 'Medium', topics: ['Graphs', 'Dynamic Programming'], patterns: ['shortest-path', 'dp-fibonacci'], companies: ['google', 'uber', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'Given a weighted directed graph with n nodes and edges that may have negative weights, find the shortest path from source to all other nodes using the Bellman-Ford algorithm.\n\nDetect if a negative weight cycle exists.', examples: [{ input: 'n = 5, edges = [[0,1,-1],[0,2,4],[1,2,3],[1,3,2],[3,2,-5]], src = 0', output: '[0,-1,-3,1,INF]' }, { input: 'n = 3, edges = [[0,1,1],[1,2,-1],[2,0,-1]], src = 0', output: 'Negative cycle detected' }], constraints: '1 <= n <= 500\n0 <= edges.length <= n*(n-1)\n-10^4 <= weight <= 10^4', hints: ['Relax all edges V-1 times', 'Check for negative cycle with one more iteration', 'If any distance decreases, negative cycle exists'] },

  // Graph Cycle (Undirected)
  { id: 216, title: 'Detect Cycle in Undirected Graph', difficulty: 'Medium', topics: ['Graphs', 'Union Find'], patterns: ['graph-cycle', 'union-find'], companies: ['amazon', 'microsoft', 'google'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Given an undirected graph with n nodes (0 to n-1) and a list of edges, determine if the graph contains a cycle.\n\nUse Union-Find for an efficient O(V+E) solution.', examples: [{ input: 'n = 4, edges = [[0,1],[1,2],[2,3],[3,0]]', output: 'true', explanation: 'Cycle: 0→1→2→3→0.' }, { input: 'n = 4, edges = [[0,1],[1,2],[2,3]]', output: 'false' }], constraints: '1 <= n <= 2000\n0 <= edges.length <= 5000', hints: ['Union-Find: if two nodes share same parent, cycle found', 'DFS: track parent to avoid false positive', 'BFS with visited set and parent tracking'] },

  // Multi-source BFS
  { id: 217, title: 'Walls and Gates (Distance to Nearest Gate)', difficulty: 'Medium', topics: ['Graphs', 'Matrix', 'Queue'], patterns: ['multi-source-bfs', 'matrix-traversal'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 58, timeEstimate: 20, description: 'You are given an m x n grid rooms initialized with three values:\n- -1: a wall or obstacle\n- 0: a gate\n- INF: an empty room\n\nFill each empty room with the distance to its nearest gate. If it is impossible to reach a gate, leave it as INF.', examples: [{ input: 'rooms = [[INF,-1,0,INF],[INF,INF,INF,-1],[INF,-1,INF,-1],[0,-1,INF,INF]]', output: '[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]' }], constraints: 'm == rooms.length\nn == rooms[i].length\n1 <= m, n <= 250\nrooms[i][j] is -1, 0, or 2^31 - 1.', hints: ['Start BFS from all gates simultaneously', 'Process level by level for distance', 'Skip walls and already-visited rooms'] },

  // DP Grid
  { id: 218, studyPlans: ['top-interview-150'], title: 'Maximal Square', difficulty: 'Medium', topics: ['Dynamic Programming', 'Matrix'], patterns: ['dp-grid', 'matrix-traversal'], companies: ['google', 'amazon', 'apple'], frequency: 'high', acceptance: 45, timeEstimate: 25, description: 'Given an m x n binary matrix filled with 0s and 1s, find the largest square containing only 1s and return its area.', examples: [{ input: 'matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]', output: '4', explanation: 'The largest square of 1s has side 2, area = 4.' }, { input: 'matrix = [["0","1"],["1","0"]]', output: '1' }], constraints: 'm == matrix.length\nn == matrix[i].length\n1 <= m, n <= 300\nmatrix[i][j] is \'0\' or \'1\'.', hints: ['dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1', 'Only when matrix[i][j] == 1', 'Track maximum side length'] },

  // DP State Machine
  { id: 219, title: 'Best Time to Buy and Sell Stock with Transaction Fee', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming', 'Greedy'], patterns: ['dp-state-machine', 'greedy'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'You are given an array prices where prices[i] is the price of a stock on day i, and an integer fee representing a transaction fee.\n\nFind the maximum profit with unlimited transactions but each transaction incurs a fee. You may hold at most one share at a time.', examples: [{ input: 'prices = [1,3,2,8,4,9], fee = 2', output: '8', explanation: 'Buy at 1, sell at 8 (profit 5), buy at 4, sell at 9 (profit 3). Total = 8.' }, { input: 'prices = [1,3,7,5,10,3], fee = 3', output: '6' }], constraints: '1 <= prices.length <= 5 * 10^4\n1 <= prices[i] <= 5 * 10^4\n0 <= fee <= 5 * 10^4', hints: ['Two states: holding and not holding', 'hold[i] = max(hold[i-1], notHold[i-1] - price)', 'notHold[i] = max(notHold[i-1], hold[i-1] + price - fee)'] },

  // DP Bitmask
  { id: 220, title: 'Partition to K Equal Sum Subsets', difficulty: 'Medium', topics: ['Backtracking', 'Dynamic Programming', 'Bit Manipulation'], patterns: ['dp-bitmask', 'backtracking'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Given an integer array nums and an integer k, return true if it is possible to divide the array into k non-empty subsets with equal sum.', examples: [{ input: 'nums = [4,3,2,3,5,2,1], k = 4', output: 'true', explanation: 'Four subsets: {5}, {1,4}, {2,3}, {2,3}.' }, { input: 'nums = [1,2,3,4], k = 3', output: 'false' }], constraints: '1 <= k <= nums.length <= 16\n1 <= nums[i] <= 10^4', hints: ['Bitmask DP: mask represents used elements', 'dp[mask] = remaining sum if valid', 'Sort in descending order for pruning'] },

  // DP Counting
  { id: 221, title: 'Unique Binary Search Trees (Catalan)', difficulty: 'Medium', topics: ['Dynamic Programming', 'Trees', 'Math'], patterns: ['dp-counting'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 20, description: 'Given an integer n, return the number of structurally unique BSTs which have exactly n nodes of unique values from 1 to n.\n\nThis is the nth Catalan number.', examples: [{ input: 'n = 3', output: '5', explanation: 'Five unique BSTs: 1-2-3 can form 5 different structures.' }, { input: 'n = 1', output: '1' }], constraints: '1 <= n <= 19', hints: ['dp[n] = sum of dp[i-1] * dp[n-i] for i=1..n', 'Base case: dp[0] = dp[1] = 1', 'This is the Catalan number formula'] },

  // Two Heaps
  { id: 222, title: 'Sliding Window Median', difficulty: 'Hard', topics: ['Heap', 'Sliding Window', 'Sorting'], patterns: ['two-heaps', 'sliding-window'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 32, timeEstimate: 40, description: 'The median is the middle value in an ordered integer list. Given an array nums and an integer k, there is a sliding window of size k. Return the median array for each window position.', examples: [{ input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[1.0,-1.0,-1.0,3.0,5.0,6.0]' }], constraints: '1 <= k <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1', hints: ['Two heaps: max-heap for lower half, min-heap for upper', 'Lazy deletion when elements leave window', 'Rebalance heaps after each insert/remove'] },

  // Interval Scheduling
  { id: 223, title: 'Maximum Number of Events That Can Be Attended', difficulty: 'Medium', topics: ['Arrays', 'Greedy', 'Heap'], patterns: ['interval-scheduling', 'greedy'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 38, timeEstimate: 25, description: 'You are given an array of events where events[i] = [startDay, endDay]. Every event i starts at startDay and ends at endDay.\n\nYou can attend an event at any day d where startDay <= d <= endDay. You can only attend one event per day. Return the maximum number of events you can attend.', examples: [{ input: 'events = [[1,2],[2,3],[3,4]]', output: '3', explanation: 'Attend all events on days 1, 2, 3.' }, { input: 'events = [[1,2],[2,3],[3,4],[1,2]]', output: '4' }], constraints: '1 <= events.length <= 10^5\nevents[i].length == 2\n1 <= startDay <= endDay <= 10^5', hints: ['Sort events by start day', 'Use min-heap of end days', 'Greedily attend event ending earliest'] },

  // Expression Evaluation
  { id: 224, studyPlans: ['top-interview-150'], title: 'Basic Calculator', difficulty: 'Hard', topics: ['Stack', 'Math', 'Strings'], patterns: ['expression-eval', 'paren-match'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 38, timeEstimate: 35, description: 'Given a string s representing a mathematical expression, implement a basic calculator to evaluate it.\n\nThe expression contains digits, +, -, (, ), and spaces.', examples: [{ input: 's = "1 + 1"', output: '2' }, { input: 's = " 2-1 + 2 "', output: '3' }, { input: 's = "(1+(4+5+2)-3)+(6+8)"', output: '23' }], constraints: '1 <= s.length <= 3 * 10^5\ns consists of digits, +, -, (, ), and spaces.\ns represents a valid expression.', hints: ['Use stack for nested parentheses', 'Track current sign and number', 'Push sign and result on ( , pop on )'] },

  // Parentheses Matching
  { id: 225, title: 'Generate Parentheses', difficulty: 'Medium', topics: ['Strings', 'Backtracking'], patterns: ['paren-match', 'backtracking'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 70, timeEstimate: 20, description: 'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.', examples: [{ input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]' }, { input: 'n = 1', output: '["()"]' }], constraints: '1 <= n <= 8', hints: ['Backtracking with open/close counts', 'Add ( if open < n', 'Add ) if close < open'] },

  // XOR Tricks
  { id: 226, title: 'Find the Duplicate Number (XOR/Cycle)', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers', 'Bit Manipulation'], patterns: ['xor-tricks', 'fast-slow'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 58, timeEstimate: 20, description: 'Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive, there is exactly one repeated number. Return this repeated number.\n\nYou must solve it without modifying the array and using only constant extra space.', examples: [{ input: 'nums = [1,3,4,2,2]', output: '2' }, { input: 'nums = [3,1,3,4,2]', output: '3' }], constraints: '1 <= n <= 10^5\nnums.length == n + 1\n1 <= nums[i] <= n\nOnly one repeated number.', hints: ['Floyd\'s cycle detection on index mapping', 'Phase 1: find cycle intersection', 'Phase 2: find cycle entrance'] },

  // Merge Linked Lists
  { id: 227, studyPlans: ['top-interview-150'], title: 'Merge Two Sorted Linked Lists', difficulty: 'Easy', topics: ['Linked List', 'Two Pointers'], patterns: ['merge-lists', 'two-pointers'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'high', acceptance: 80, timeEstimate: 10, description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list by splicing together the nodes.\n\nReturn the head of the merged linked list.', examples: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }, { input: 'list1 = [], list2 = []', output: '[]' }, { input: 'list1 = [], list2 = [0]', output: '[0]' }], constraints: 'Both lists are sorted in non-decreasing order.\n0 <= list.length <= 50\n-100 <= Node.val <= 100', hints: ['Use dummy head node', 'Compare heads and advance smaller', 'Attach remaining list at end'] },

  // Kadane Variant
  { id: 228, studyPlans: ['top-interview-150'], title: 'Maximum Circular Subarray Sum', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming'], patterns: ['kadane', 'prefix-sum'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'Given a circular integer array nums, find the maximum possible sum of a non-empty subarray of nums.\n\nA circular array means the end connects to the beginning. A subarray may wrap around.', examples: [{ input: 'nums = [1,-2,3,-2]', output: '3', explanation: 'Subarray [3] has maximum sum 3.' }, { input: 'nums = [5,-3,5]', output: '10', explanation: 'Wrap-around subarray [5,5] has sum 10.' }, { input: 'nums = [-3,-2,-3]', output: '-2' }], constraints: 'n == nums.length\n1 <= n <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4', hints: ['Max of normal Kadane and total - min subarray', 'Handle edge case: all negatives', 'Circular max = total_sum - min_subarray_sum'] },

  // Dutch Flag Variant
  { id: 229, title: 'Move Zeroes', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['dutch-flag', 'two-pointers'], companies: ['meta', 'amazon', 'microsoft'], frequency: 'high', acceptance: 78, timeEstimate: 10, description: 'Given an integer array nums, move all 0s to the end of it while maintaining the relative order of the non-zero elements.\n\nYou must do this in-place without making a copy of the array.', examples: [{ input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]' }, { input: 'nums = [0]', output: '[0]' }], constraints: '1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1', hints: ['Two pointers: read and write positions', 'Write non-zero elements forward', 'Fill remaining positions with zeros'] },

  // String Reversal (Two Pointer on char array)
  { id: 230, title: 'Reverse String', difficulty: 'Easy', topics: ['Strings', 'Two Pointers'], patterns: ['string-reversal', 'two-pointers'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'high', acceptance: 85, timeEstimate: 5, description: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this in-place with O(1) extra memory by modifying the input array.', examples: [{ input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }, { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }], constraints: '1 <= s.length <= 10^5\ns[i] is a printable ASCII character.', hints: ['Two pointers: left and right', 'Swap and move inward', 'Stop when pointers cross'] },

  // Expand Center (Palindrome Counting)
  { id: 231, title: 'Palindromic Substrings', difficulty: 'Medium', topics: ['Strings', 'Dynamic Programming'], patterns: ['expand-center', 'palindrome-check'], companies: ['meta', 'google', 'amazon'], frequency: 'high', acceptance: 62, timeEstimate: 20, description: 'Given a string s, return the number of palindromic substrings in it.\n\nA string is a palindrome when it reads the same backward as forward. A substring is a contiguous sequence of characters.', examples: [{ input: 's = "abc"', output: '3', explanation: 'Three palindromic substrings: "a", "b", "c".' }, { input: 's = "aaa"', output: '6', explanation: '"a", "a", "a", "aa", "aa", "aaa".' }], constraints: '1 <= s.length <= 1000\ns consists of lowercase English letters.', hints: ['Expand around each center (2n-1 centers)', 'Count both odd and even length palindromes', 'Or use Manacher\'s algorithm for O(n)'] },

  // Fixed-size Sliding Window
  { id: 232, title: 'Maximum Average Subarray I', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window-fixed'], companies: ['meta', 'amazon'], frequency: 'medium', acceptance: 72, timeEstimate: 10, description: 'You are given an integer array nums consisting of n elements, and an integer k.\n\nFind a contiguous subarray whose length is equal to k that has the maximum average value and return this value.', examples: [{ input: 'nums = [1,12,-5,-6,50,3], k = 4', output: '12.75', explanation: 'Maximum average is (12 + -5 + -6 + 50) / 4 = 12.75.' }, { input: 'nums = [5], k = 1', output: '5.0' }], constraints: 'n == nums.length\n1 <= k <= n <= 10^5\n-10^4 <= nums[i] <= 10^4', hints: ['Fixed-size window of k elements', 'Sum first k elements as initial window', 'Slide: add right, subtract left, track max'] },

  // Char Counting
  { id: 233, title: 'First Unique Character in String', difficulty: 'Easy', topics: ['Strings', 'Hashing'], patterns: ['char-counting'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'high', acceptance: 78, timeEstimate: 10, description: 'Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.', examples: [{ input: 's = "leetcode"', output: '0', explanation: 'l is the first unique character.' }, { input: 's = "loveleetcode"', output: '2' }, { input: 's = "aabb"', output: '-1' }], constraints: '1 <= s.length <= 10^5\ns consists of only lowercase English letters.', hints: ['Count frequency of each character', 'Scan string again for first freq == 1', 'Array of 26 instead of hash map'] },

  // DP Counting (Stairs)
  { id: 234, title: 'Climbing Stairs', difficulty: 'Easy', topics: ['Dynamic Programming', 'Math'], patterns: ['dp-counting', 'dp-fibonacci'], companies: ['amazon', 'google', 'tcs'], frequency: 'high', acceptance: 82, timeEstimate: 10, description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps.\n\nIn how many distinct ways can you climb to the top?', examples: [{ input: 'n = 2', output: '2', explanation: '1+1 or 2.' }, { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1.' }], constraints: '1 <= n <= 45', hints: ['dp[n] = dp[n-1] + dp[n-2]', 'Same as Fibonacci sequence', 'Base cases: dp[1]=1, dp[2]=2'] },

  // Eulerian Path

  // ═══ LeetCode Top Interview 150 - Additional Problems ═══

  // Array/String additions
  { id: 236, studyPlans: ['top-interview-150'], title: 'Remove Element', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['amazon', 'tcs', 'infosys'], frequency: 'high', acceptance: 72, timeEstimate: 10, description: 'Given an integer array nums and an integer val, remove all occurrences of val in nums in-place. Return the number of remaining elements.', examples: [{ input: 'nums = [3,2,2,3], val = 3', output: '2, nums = [2,2,_,_]' }, { input: 'nums = [0,1,2,2,3,0,4,2], val = 2', output: '5, nums = [0,1,4,0,3,_,_,_]' }], constraints: '0 <= nums.length <= 100\n0 <= nums[i] <= 50\n0 <= val <= 100', hints: ['Two pointers: read and write', 'Skip elements equal to val', 'Overwrite from the front'] },
  { id: 237, studyPlans: ['top-interview-150'], title: 'Remove Duplicates from Sorted Array II', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 15, description: 'Given a sorted array nums, remove duplicates in-place such that each unique element appears at most twice. Return the number of elements remaining.', examples: [{ input: 'nums = [1,1,1,2,2,3]', output: '5, nums = [1,1,2,2,3]' }, { input: 'nums = [0,0,1,1,1,1,2,3,3]', output: '7, nums = [0,0,1,1,2,3,3]' }], constraints: '1 <= nums.length <= 3 * 10^4\n-10^4 <= nums[i] <= 10^4\nnums is sorted.', hints: ['Track write position', 'Allow at most 2 of each', 'Compare with element 2 positions back'] },
  { id: 238, studyPlans: ['top-interview-150'], title: 'Best Time to Buy and Sell Stock II', difficulty: 'Medium', topics: ['Arrays', 'Greedy', 'Dynamic Programming'], patterns: ['greedy', 'dp-state-machine'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 62, timeEstimate: 15, description: 'You are given an array prices. On each day you may buy and/or sell the stock. Find the maximum profit. You may complete as many transactions as you like.', examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '7', explanation: 'Buy day 2, sell day 3 (profit 4), buy day 4, sell day 5 (profit 3). Total = 7.' }, { input: 'prices = [1,2,3,4,5]', output: '4' }], constraints: '1 <= prices.length <= 3 * 10^4\n0 <= prices[i] <= 10^4', hints: ['Collect all upward slopes', 'Add profit whenever price goes up', 'Greedy: sum of positive differences'] },
  { id: 239, studyPlans: ['top-interview-150'], title: 'H-Index', difficulty: 'Medium', topics: ['Arrays', 'Sorting'], patterns: ['greedy'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 20, description: 'Given an array of integers citations, return the researcher\'s h-index. h-index is the max value h such that the researcher has at least h papers with h+ citations.', examples: [{ input: 'citations = [3,0,6,1,5]', output: '3' }, { input: 'citations = [1,3,1]', output: '1' }], constraints: 'n == citations.length\n1 <= n <= 5000\n0 <= citations[i] <= 1000', hints: ['Sort in descending order', 'Count papers meeting threshold', 'Bucket sort for O(n)'] },
  { id: 240, studyPlans: ['top-interview-150'], title: 'Insert Delete GetRandom O(1)', difficulty: 'Medium', topics: ['Arrays', 'Hashing', 'Design'], patterns: ['prefix-sum'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'Implement a RandomizedSet class that supports insert, remove, and getRandom operations, each in average O(1) time.', examples: [{ input: '["RandomizedSet","insert","remove","insert","getRandom"]\\n[[],[1],[2],[2],[]]', output: '[null,true,false,true,2]' }], constraints: '-2^31 <= val <= 2^31 - 1\nAt most 2 * 10^5 calls.', hints: ['HashMap + ArrayList', 'Swap with last element on remove', 'Random index for getRandom'] },
  { id: 241, studyPlans: ['top-interview-150'], title: 'Integer to Roman', difficulty: 'Medium', topics: ['Math', 'Strings'], patterns: ['greedy'], companies: ['amazon', 'microsoft', 'meta'], frequency: 'medium', acceptance: 60, timeEstimate: 15, description: 'Given an integer, convert it to a Roman numeral.', examples: [{ input: 'num = 3749', output: '"MMMDCCXLIX"' }, { input: 'num = 58', output: '"LVIII"' }], constraints: '1 <= num <= 3999', hints: ['Use greedy with value table', 'Include subtractive forms (IV, IX)', 'Process from largest to smallest'] },
  { id: 242, studyPlans: ['top-interview-150'], title: 'Length of Last Word', difficulty: 'Easy', topics: ['Strings'], patterns: ['two-pointers'], companies: ['tcs', 'infosys', 'wipro'], frequency: 'medium', acceptance: 78, timeEstimate: 5, description: 'Given a string s consisting of words and spaces, return the length of the last word.', examples: [{ input: 's = "Hello World"', output: '5' }, { input: 's = "   fly me   to   the moon  "', output: '4' }], constraints: '1 <= s.length <= 10^4', hints: ['Trim trailing spaces', 'Count from end', 'Stop at first space'] },
  { id: 243, studyPlans: ['top-interview-150'], title: 'Longest Common Prefix', difficulty: 'Easy', topics: ['Strings'], patterns: ['two-pointers'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 72, timeEstimate: 10, description: 'Find the longest common prefix string amongst an array of strings. If no common prefix, return "".', examples: [{ input: 'strs = ["flower","flow","flight"]', output: '"fl"' }, { input: 'strs = ["dog","racecar","car"]', output: '""' }], constraints: '1 <= strs.length <= 200\n0 <= strs[i].length <= 200', hints: ['Compare characters position by position', 'Use first string as reference', 'Stop at shortest string or mismatch'] },
  { id: 244, studyPlans: ['top-interview-150'], title: 'Text Justification', difficulty: 'Hard', topics: ['Strings'], patterns: ['greedy'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 40, description: 'Given an array of words and maxWidth, format text such that each line has exactly maxWidth characters and is fully justified.', examples: [{ input: 'words = ["This","is","an","example"], maxWidth = 16', output: '["This    is    an","example        "]' }], constraints: '1 <= words.length <= 300\n1 <= maxWidth <= 100', hints: ['Greedily pack words per line', 'Distribute spaces evenly', 'Left justify the last line'] },

  // Two Pointers additions
  { id: 245, studyPlans: ['top-interview-150'], title: 'Valid Palindrome', difficulty: 'Easy', topics: ['Strings', 'Two Pointers'], patterns: ['two-pointers', 'palindrome-check'], companies: ['meta', 'amazon', 'microsoft'], frequency: 'high', acceptance: 72, timeEstimate: 10, description: 'Determine if a string is a palindrome, considering only alphanumeric characters and ignoring cases.', examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: 'true' }, { input: 's = "race a car"', output: 'false' }], constraints: '1 <= s.length <= 2 * 10^5', hints: ['Two pointers from both ends', 'Skip non-alphanumeric chars', 'Compare case-insensitively'] },
  { id: 246, studyPlans: ['top-interview-150'], title: 'Is Subsequence', difficulty: 'Easy', topics: ['Strings', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'tcs', 'infosys'], frequency: 'medium', acceptance: 75, timeEstimate: 10, description: 'Given two strings s and t, return true if s is a subsequence of t.', examples: [{ input: 's = "abc", t = "ahbgdc"', output: 'true' }, { input: 's = "axc", t = "ahbgdc"', output: 'false' }], constraints: '0 <= s.length <= 100\n0 <= t.length <= 10^4', hints: ['Two pointers on both strings', 'Advance s pointer only on match', 'If s pointer reaches end, true'] },
  { id: 247, studyPlans: ['top-interview-150'], title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['amazon', 'meta', 'google'], frequency: 'high', acceptance: 60, timeEstimate: 10, description: 'Given a 1-indexed sorted array, find two numbers that add up to target. Return their indices.', examples: [{ input: 'numbers = [2,7,11,15], target = 9', output: '[1,2]' }, { input: 'numbers = [2,3,4], target = 6', output: '[1,3]' }], constraints: '2 <= numbers.length <= 3 * 10^4\nExactly one solution exists.', hints: ['Two pointers from both ends', 'If sum too large, move right left', 'If sum too small, move left right'] },

  // Sliding Window additions
  { id: 248, studyPlans: ['top-interview-150'], title: 'Substring with Concatenation of All Words', difficulty: 'Hard', topics: ['Strings', 'Sliding Window', 'Hashing'], patterns: ['sliding-window', 'char-freq-match'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 40, description: 'Given a string s and an array of equal-length words, find all starting indices where a substring is a concatenation of each word exactly once.', examples: [{ input: 's = "barfoothefoobarman", words = ["foo","bar"]', output: '[0,9]' }], constraints: '1 <= s.length <= 10^4\n1 <= words.length <= 5000', hints: ['Sliding window with word frequency map', 'Window size = total length of all words', 'Check each starting offset mod word_length'] },

  // Hashmap additions
  { id: 249, studyPlans: ['top-interview-150'], title: 'Ransom Note', difficulty: 'Easy', topics: ['Strings', 'Hashing'], patterns: ['char-counting'], companies: ['amazon', 'tcs'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Given ransomNote and magazine strings, return true if ransomNote can be constructed from magazine letters. Each letter used once.', examples: [{ input: 'ransomNote = "a", magazine = "b"', output: 'false' }, { input: 'ransomNote = "aa", magazine = "aab"', output: 'true' }], constraints: '1 <= ransomNote.length, magazine.length <= 10^5', hints: ['Count character frequencies', 'Check availability', 'Array of 26 for lowercase'] },
  { id: 250, studyPlans: ['top-interview-150'], title: 'Isomorphic Strings', difficulty: 'Easy', topics: ['Strings', 'Hashing'], patterns: ['char-counting'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'Determine if two strings are isomorphic. Characters can be mapped one-to-one to get the other string.', examples: [{ input: 's = "egg", t = "add"', output: 'true' }, { input: 's = "foo", t = "bar"', output: 'false' }], constraints: '1 <= s.length <= 5 * 10^4\nt.length == s.length', hints: ['Two hash maps for bidirectional mapping', 'Check both s->t and t->s', 'First occurrence comparison'] },
  { id: 251, studyPlans: ['top-interview-150'], title: 'Word Pattern', difficulty: 'Easy', topics: ['Strings', 'Hashing'], patterns: ['char-counting'], companies: ['meta', 'google'], frequency: 'medium', acceptance: 60, timeEstimate: 15, description: 'Given a pattern and string s, find if s follows the same pattern (bijection between pattern letters and words).', examples: [{ input: 'pattern = "abba", s = "dog cat cat dog"', output: 'true' }, { input: 'pattern = "abba", s = "dog cat cat fish"', output: 'false' }], constraints: '1 <= pattern.length <= 300\n1 <= s.length <= 3000', hints: ['Map each pattern char to a word', 'Ensure bijection (both directions)', 'Split string by spaces'] },
  { id: 252, studyPlans: ['top-interview-150'], title: 'Valid Anagram', difficulty: 'Easy', topics: ['Strings', 'Hashing', 'Sorting'], patterns: ['char-counting'], companies: ['amazon', 'meta', 'tcs'], frequency: 'high', acceptance: 80, timeEstimate: 10, description: 'Given two strings s and t, return true if t is an anagram of s.', examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true' }, { input: 's = "rat", t = "car"', output: 'false' }], constraints: '1 <= s.length, t.length <= 5 * 10^4', hints: ['Count frequencies and compare', 'Sort both strings', 'Array of 26 for O(n)'] },
  { id: 253, studyPlans: ['top-interview-150'], title: 'Contains Duplicate II', difficulty: 'Easy', topics: ['Arrays', 'Hashing', 'Sliding Window'], patterns: ['sliding-window'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 15, description: 'Return true if there are two distinct indices i,j such that nums[i]==nums[j] and abs(i-j) <= k.', examples: [{ input: 'nums = [1,2,3,1], k = 3', output: 'true' }, { input: 'nums = [1,2,3,1,2,3], k = 2', output: 'false' }], constraints: '1 <= nums.length <= 10^5\n0 <= k <= 10^5', hints: ['Hash map storing last seen index', 'Sliding window of size k', 'Hash set with window'] },

  // Intervals additions
  { id: 254, studyPlans: ['top-interview-150'], title: 'Summary Ranges', difficulty: 'Easy', topics: ['Arrays'], patterns: ['two-pointers'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 55, timeEstimate: 15, description: 'Given a sorted unique integer array, return the smallest sorted list of ranges that cover all numbers.', examples: [{ input: 'nums = [0,1,2,4,5,7]', output: '["0->2","4->5","7"]' }], constraints: '0 <= nums.length <= 20\nAll values unique and sorted.', hints: ['Track start of each range', 'Extend while consecutive', 'Format single vs range'] },
  { id: 255, studyPlans: ['top-interview-150'], title: 'Minimum Number of Arrows to Burst Balloons', difficulty: 'Medium', topics: ['Arrays', 'Greedy', 'Sorting'], patterns: ['greedy', 'merge-intervals'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Given intervals representing balloons, find the minimum number of arrows to burst all. An arrow at x bursts overlapping balloons.', examples: [{ input: 'points = [[10,16],[2,8],[1,6],[7,12]]', output: '2' }], constraints: '1 <= points.length <= 10^5', hints: ['Sort by end coordinate', 'Greedily shoot at first end', 'Skip overlapping balloons'] },

  // Stack additions
  { id: 256, studyPlans: ['top-interview-150'], title: 'Simplify Path', difficulty: 'Medium', topics: ['Strings', 'Stack'], patterns: ['monotonic-stack'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 45, timeEstimate: 20, description: 'Convert an absolute Unix file path to its simplified canonical path.', examples: [{ input: 'path = "/home/"', output: '"/home"' }, { input: 'path = "/a/./b/../../c/"', output: '"/c"' }], constraints: '1 <= path.length <= 3000', hints: ['Split by slash', 'Stack for directory names', 'Pop on "..", skip "."'] },

  // Linked List additions
  { id: 257, studyPlans: ['top-interview-150'], title: 'Copy List with Random Pointer', difficulty: 'Medium', topics: ['Linked List', 'Hashing'], patterns: ['two-pointers'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'Deep copy a linked list where each node has an additional random pointer.', examples: [{ input: 'head = [[7,null],[13,0],[11,4],[10,2],[1,0]]', output: '[[7,null],[13,0],[11,4],[10,2],[1,0]]' }], constraints: '0 <= n <= 1000', hints: ['HashMap: old -> new node', 'Interleave copies', 'Two-pass approach'] },
  { id: 258, studyPlans: ['top-interview-150'], title: 'Reverse Linked List II', difficulty: 'Medium', topics: ['Linked List'], patterns: ['in-place-reversal'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 45, timeEstimate: 20, description: 'Reverse the nodes from position left to right in a singly linked list.', examples: [{ input: 'head = [1,2,3,4,5], left = 2, right = 4', output: '[1,4,3,2,5]' }], constraints: '1 <= n <= 500\n1 <= left <= right <= n', hints: ['Find node before left', 'Reverse between left and right', 'Reconnect'] },
  { id: 259, studyPlans: ['top-interview-150'], title: 'Remove Duplicates from Sorted List II', difficulty: 'Medium', topics: ['Linked List', 'Two Pointers'], patterns: ['two-pointers'], companies: ['meta', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 20, description: 'Delete all duplicate nodes from a sorted linked list, leaving only distinct numbers.', examples: [{ input: 'head = [1,2,3,3,4,4,5]', output: '[1,2,5]' }], constraints: '0 <= n <= 300\nThe list is sorted.', hints: ['Use dummy head', 'Skip all duplicate values', 'Reconnect non-duplicates'] },
  { id: 260, studyPlans: ['top-interview-150'], title: 'Partition List', difficulty: 'Medium', topics: ['Linked List', 'Two Pointers'], patterns: ['two-pointers'], companies: ['meta', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 20, description: 'Partition a linked list around value x: nodes < x before nodes >= x, preserving order.', examples: [{ input: 'head = [1,4,3,2,5,2], x = 3', output: '[1,2,2,4,3,5]' }], constraints: '0 <= n <= 200', hints: ['Two separate lists', 'Append to appropriate list', 'Connect the two lists'] },

  // Binary Tree additions
  { id: 261, studyPlans: ['top-interview-150'], title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs'], companies: ['amazon', 'microsoft', 'tcs'], frequency: 'high', acceptance: 80, timeEstimate: 10, description: 'Return the maximum depth of a binary tree.', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '3' }], constraints: 'Number of nodes in [0, 10^4].', hints: ['1 + max(left, right)', 'Base: null returns 0', 'BFS counting levels'] },
  { id: 262, studyPlans: ['top-interview-150'], title: 'Same Tree', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs'], companies: ['amazon', 'meta'], frequency: 'medium', acceptance: 78, timeEstimate: 10, description: 'Check if two binary trees are structurally identical with same node values.', examples: [{ input: 'p = [1,2,3], q = [1,2,3]', output: 'true' }, { input: 'p = [1,2], q = [1,null,2]', output: 'false' }], constraints: 'Nodes in [0, 100].', hints: ['Recursive comparison', 'Both null = same', 'Check val then children'] },
  { id: 263, studyPlans: ['top-interview-150'], title: 'Invert Binary Tree', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 82, timeEstimate: 10, description: 'Invert a binary tree: every left child becomes right and vice versa.', examples: [{ input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }], constraints: 'Nodes in [0, 100].', hints: ['Swap left and right', 'Recurse on subtrees', 'BFS level by level'] },
  { id: 264, studyPlans: ['top-interview-150'], title: 'Symmetric Tree', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'bfs'], companies: ['amazon', 'microsoft', 'meta'], frequency: 'high', acceptance: 72, timeEstimate: 10, description: 'Check whether a binary tree is a mirror of itself (symmetric around center).', examples: [{ input: 'root = [1,2,2,3,4,4,3]', output: 'true' }], constraints: 'Nodes in [1, 1000].', hints: ['Compare left with mirror of right', 'Recursive helper with two nodes', 'BFS with queue'] },
  { id: 265, studyPlans: ['top-interview-150'], title: 'Construct Binary Tree from Inorder and Postorder', difficulty: 'Medium', topics: ['Trees', 'Recursion', 'Hashing'], patterns: ['dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'Construct a binary tree from inorder and postorder traversal arrays.', examples: [{ input: 'inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]', output: '[3,9,20,null,null,15,7]' }], constraints: '1 <= inorder.length <= 3000\nAll values unique.', hints: ['Last in postorder is root', 'Find root in inorder', 'Recursively build'] },
  { id: 266, studyPlans: ['top-interview-150'], title: 'Populating Next Right Pointers', difficulty: 'Medium', topics: ['Trees', 'Queue'], patterns: ['bfs'], companies: ['meta', 'amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Populate each next pointer to point to its next right node. If none, set NULL.', examples: [{ input: 'root = [1,2,3,4,5,6,7]', output: '[1,#,2,3,#,4,5,6,7,#]' }], constraints: 'Nodes in [0, 6000].', hints: ['BFS level by level', 'Connect to next in queue', 'Use established next pointers'] },
  { id: 267, studyPlans: ['top-interview-150'], title: 'Flatten Binary Tree to Linked List', difficulty: 'Medium', topics: ['Trees', 'Recursion'], patterns: ['dfs', 'tree-preorder'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Flatten a binary tree into a linked list in-place using right child pointers in pre-order.', examples: [{ input: 'root = [1,2,5,3,4,null,6]', output: '[1,null,2,null,3,null,4,null,5,null,6]' }], constraints: 'Nodes in [0, 2000].', hints: ['Morris traversal', 'Reverse postorder', 'Connect left rightmost to right'] },
  { id: 268, studyPlans: ['top-interview-150'], title: 'Path Sum', difficulty: 'Easy', topics: ['Trees', 'Recursion'], patterns: ['dfs'], companies: ['amazon', 'microsoft'], frequency: 'medium', acceptance: 68, timeEstimate: 15, description: 'Check if there is a root-to-leaf path with values summing to targetSum.', examples: [{ input: 'root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22', output: 'true' }], constraints: 'Nodes in [0, 5000].', hints: ['Subtract node value from target', 'At leaf, check remaining == 0', 'Recurse on children'] },
  { id: 269, studyPlans: ['top-interview-150'], title: 'Count Complete Tree Nodes', difficulty: 'Easy', topics: ['Trees', 'Binary Search'], patterns: ['dfs', 'binary-search'], companies: ['google', 'meta'], frequency: 'medium', acceptance: 60, timeEstimate: 15, description: 'Count nodes in a complete binary tree in O(log^2 n) time.', examples: [{ input: 'root = [1,2,3,4,5,6]', output: '6' }], constraints: 'Nodes in [0, 5 * 10^4].', hints: ['Compare left and right heights', 'If equal: 2^h - 1', 'Otherwise recurse'] },
  { id: 270, studyPlans: ['top-interview-150'], title: 'Binary Search Tree Iterator', difficulty: 'Medium', topics: ['Trees', 'Stack', 'Design'], patterns: ['tree-inorder', 'dfs'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 55, timeEstimate: 20, description: 'Implement a BST iterator with next() and hasNext() operations.', examples: [{ input: '["BSTIterator","next","next","hasNext"]\\n[[[7,3,15,null,null,9,20]],[],[],[]]', output: '[null,3,7,true]' }], constraints: 'Nodes in [1, 10^5].', hints: ['Controlled inorder with stack', 'Push all left children', 'On next, process and push right'] },
  { id: 271, studyPlans: ['top-interview-150'], title: 'Average of Levels in Binary Tree', difficulty: 'Easy', topics: ['Trees', 'Queue'], patterns: ['bfs'], companies: ['meta', 'amazon'], frequency: 'medium', acceptance: 72, timeEstimate: 15, description: 'Return the average value of nodes on each level.', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[3.0,14.5,11.0]' }], constraints: 'Nodes in [1, 10^4].', hints: ['BFS level by level', 'Sum values each level', 'Divide by level size'] },
  { id: 272, studyPlans: ['top-interview-150'], title: 'Minimum Absolute Difference in BST', difficulty: 'Easy', topics: ['Trees', 'Binary Search'], patterns: ['tree-inorder', 'dfs'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'Return the minimum absolute difference between any two node values in a BST.', examples: [{ input: 'root = [4,2,6,1,3]', output: '1' }], constraints: 'Nodes in [2, 10^4].', hints: ['Inorder gives sorted order', 'Track previous value', 'Min between consecutive elements'] },

  // Graph additions
  { id: 273, studyPlans: ['top-interview-150'], title: 'Snakes and Ladders', difficulty: 'Medium', topics: ['Graphs', 'Matrix', 'Queue'], patterns: ['bfs'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 40, timeEstimate: 30, description: 'Find minimum dice moves to reach the last square on a Snakes and Ladders board.', examples: [{ input: 'board (6x6)', output: '4' }], constraints: 'n == board.length\n2 <= n <= 20', hints: ['BFS from square 1', 'Handle Boustrophedon numbering', 'Take snake/ladder destinations'] },
  { id: 274, studyPlans: ['top-interview-150'], title: 'Minimum Genetic Mutation', difficulty: 'Medium', topics: ['Graphs', 'Strings', 'Hashing'], patterns: ['bfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 20, description: 'Find minimum mutations to transform one gene string to another using a bank of valid mutations.', examples: [{ input: 'start = "AACCGGTT", end = "AACCGGTA", bank = ["AACCGGTA"]', output: '1' }], constraints: '0 <= bank.length <= 10\nGene strings are 8 chars from {A,C,G,T}.', hints: ['BFS from start', 'Try all single-char mutations', 'Only use mutations in bank'] },

  // Trie addition
  { id: 275, studyPlans: ['top-interview-150'], title: 'Design Add and Search Words', difficulty: 'Medium', topics: ['Trie', 'Design', 'Strings', 'Backtracking'], patterns: ['trie-pattern', 'backtracking'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 42, timeEstimate: 25, description: 'Design a data structure supporting adding words and searching with dots (.) as wildcards.', examples: [{ input: '["WordDictionary","addWord","addWord","search"]\\n[[],["bad"],["dad"],[".ad"]]', output: '[null,null,null,true]' }], constraints: '1 <= word.length <= 25', hints: ['Trie for addWord', 'DFS with backtracking for dots', 'At dot, try all 26 children'] },

  // Backtracking additions
  { id: 276, studyPlans: ['top-interview-150'], title: 'Combinations', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'Return all possible combinations of k numbers chosen from range [1, n].', examples: [{ input: 'n = 4, k = 2', output: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]' }], constraints: '1 <= n <= 20\n1 <= k <= n', hints: ['Backtracking with start index', 'Add when size == k', 'Prune when remaining insufficient'] },
  { id: 277, studyPlans: ['top-interview-150'], title: 'N-Queens II', difficulty: 'Hard', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 60, timeEstimate: 25, description: 'Return the number of distinct solutions to the n-queens puzzle.', examples: [{ input: 'n = 4', output: '2' }, { input: 'n = 1', output: '1' }], constraints: '1 <= n <= 9', hints: ['Count valid placements', 'Track columns and diagonals', 'Backtrack row by row'] },

  // Divide & Conquer additions
  { id: 278, studyPlans: ['top-interview-150'], title: 'Convert Sorted Array to BST', difficulty: 'Easy', topics: ['Trees', 'Binary Search', 'Recursion'], patterns: ['binary-search', 'dfs'], companies: ['amazon', 'microsoft'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'Convert a sorted array to a height-balanced BST.', examples: [{ input: 'nums = [-10,-3,0,5,9]', output: '[0,-3,9,-10,null,5]' }], constraints: '1 <= nums.length <= 10^4', hints: ['Middle element is root', 'Recurse on halves', 'Like binary search partition'] },
  { id: 279, studyPlans: ['top-interview-150'], title: 'Sort List', difficulty: 'Medium', topics: ['Linked List', 'Sorting'], patterns: ['k-way-merge', 'fast-slow'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'Sort a linked list in O(n log n) time and O(1) memory.', examples: [{ input: 'head = [4,2,1,3]', output: '[1,2,3,4]' }], constraints: 'Nodes in [0, 5 * 10^4].', hints: ['Find middle with slow-fast', 'Merge sort halves', 'Merge two sorted lists'] },

  // Binary Search additions
  { id: 280, studyPlans: ['top-interview-150'], title: 'Search Insert Position', difficulty: 'Easy', topics: ['Binary Search', 'Arrays'], patterns: ['binary-search'], companies: ['amazon', 'google', 'tcs'], frequency: 'high', acceptance: 75, timeEstimate: 10, description: 'Return the index of target in sorted array, or where it would be inserted.', examples: [{ input: 'nums = [1,3,5,6], target = 5', output: '2' }, { input: 'nums = [1,3,5,6], target = 2', output: '1' }], constraints: '1 <= nums.length <= 10^4', hints: ['Standard binary search', 'Return left pointer', 'Left = insertion point'] },
  { id: 281, studyPlans: ['top-interview-150'], title: 'Search a 2D Matrix', difficulty: 'Medium', topics: ['Binary Search', 'Matrix'], patterns: ['binary-search', 'matrix-traversal'], companies: ['amazon', 'google', 'meta'], frequency: 'high', acceptance: 55, timeEstimate: 15, description: 'Search for a target in a sorted 2D matrix where each row starts greater than the last of the previous row.', examples: [{ input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' }], constraints: '1 <= m, n <= 100', hints: ['Treat as flat sorted array', 'Binary search with row/col conversion', 'Or two binary searches'] },

  // Heap addition
  { id: 282, studyPlans: ['top-interview-150'], title: 'IPO', difficulty: 'Hard', topics: ['Heap', 'Greedy', 'Sorting'], patterns: ['top-k', 'greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 30, description: 'Choose at most k projects to maximize capital, given profits and capital requirements.', examples: [{ input: 'k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]', output: '4' }], constraints: '1 <= k <= 10^5\n0 <= w <= 10^9', hints: ['Sort by capital', 'Max-heap of available profits', 'Greedily pick highest'] },

  // Bit Manipulation additions
  { id: 283, studyPlans: ['top-interview-150'], title: 'Add Binary', difficulty: 'Easy', topics: ['Strings', 'Math', 'Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['meta', 'amazon', 'google'], frequency: 'high', acceptance: 68, timeEstimate: 15, description: 'Given two binary strings, return their sum as a binary string.', examples: [{ input: 'a = "11", b = "1"', output: '"100"' }, { input: 'a = "1010", b = "1011"', output: '"10101"' }], constraints: '1 <= a.length, b.length <= 10^4', hints: ['Process right to left', 'Track carry', 'Handle different lengths'] },
  { id: 284, studyPlans: ['top-interview-150'], title: 'Single Number II', difficulty: 'Medium', topics: ['Arrays', 'Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'Every element appears three times except one. Find the single one in O(n) time, O(1) space.', examples: [{ input: 'nums = [2,2,3,2]', output: '3' }, { input: 'nums = [0,1,0,1,0,1,99]', output: '99' }], constraints: '1 <= nums.length <= 3 * 10^4', hints: ['Count bits mod 3', 'State machine with ones/twos', 'Sum bits and mod 3'] },
  { id: 285, studyPlans: ['top-interview-150'], title: 'Bitwise AND of Numbers Range', difficulty: 'Medium', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 45, timeEstimate: 20, description: 'Return the bitwise AND of all numbers in range [left, right].', examples: [{ input: 'left = 5, right = 7', output: '4' }], constraints: '0 <= left <= right <= 2^31 - 1', hints: ['Find common binary prefix', 'Right shift until equal', 'Left shift back'] },

  // Math additions
  { id: 286, studyPlans: ['top-interview-150'], title: 'Palindrome Number', difficulty: 'Easy', topics: ['Math'], patterns: ['two-pointers'], companies: ['tcs', 'amazon', 'infosys'], frequency: 'high', acceptance: 75, timeEstimate: 10, description: 'Determine if an integer is a palindrome without converting to string.', examples: [{ input: 'x = 121', output: 'true' }, { input: 'x = -121', output: 'false' }], constraints: '-2^31 <= x <= 2^31 - 1', hints: ['Negatives are not palindromes', 'Reverse half the number', 'Compare halves'] },
  { id: 287, studyPlans: ['top-interview-150'], title: 'Plus One', difficulty: 'Easy', topics: ['Arrays', 'Math'], patterns: ['greedy'], companies: ['google', 'amazon', 'meta'], frequency: 'medium', acceptance: 72, timeEstimate: 10, description: 'Increment a large integer represented as a digit array by one.', examples: [{ input: 'digits = [1,2,3]', output: '[1,2,4]' }, { input: 'digits = [9,9,9]', output: '[1,0,0,0]' }], constraints: '1 <= digits.length <= 100\n0 <= digits[i] <= 9', hints: ['Add from right', 'Handle carry', 'Prepend 1 on overflow'] },
  { id: 288, studyPlans: ['top-interview-150'], title: 'Sqrt(x)', difficulty: 'Easy', topics: ['Math', 'Binary Search'], patterns: ['binary-search'], companies: ['amazon', 'meta', 'google'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'Compute integer square root of x (rounded down).', examples: [{ input: 'x = 4', output: '2' }, { input: 'x = 8', output: '2' }], constraints: '0 <= x <= 2^31 - 1', hints: ['Binary search on answer', 'Check mid*mid <= x', 'Newton method alternative'] },
  { id: 289, studyPlans: ['top-interview-150'], title: 'Max Points on a Line', difficulty: 'Hard', topics: ['Math', 'Hashing'], patterns: ['greedy'], companies: ['google', 'meta', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Find the maximum number of points on a 2D plane that lie on the same straight line.', examples: [{ input: 'points = [[1,1],[2,2],[3,3]]', output: '3' }], constraints: '1 <= points.length <= 300', hints: ['Calculate slope for each pair', 'Use GCD for slope representation', 'Hash map of slopes per point'] },

  // DP additions
  { id: 290, studyPlans: ['top-interview-150'], title: 'Triangle', difficulty: 'Medium', topics: ['Dynamic Programming', 'Arrays'], patterns: ['dp-grid'], companies: ['amazon', 'google'], frequency: 'medium', acceptance: 52, timeEstimate: 20, description: 'Find minimum path sum from top to bottom of a triangle. Move to adjacent numbers on the row below.', examples: [{ input: 'triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]', output: '11' }], constraints: '1 <= triangle.length <= 200', hints: ['Bottom-up DP', 'dp[j] += min(dp[j], dp[j+1])', 'O(n) space'] },
  { id: 291, studyPlans: ['top-interview-150'], title: 'Unique Paths II', difficulty: 'Medium', topics: ['Dynamic Programming', 'Matrix'], patterns: ['dp-grid'], companies: ['amazon', 'google', 'meta'], frequency: 'medium', acceptance: 55, timeEstimate: 20, description: 'Find unique paths in a grid with obstacles. Can only move down or right.', examples: [{ input: 'obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]', output: '2' }], constraints: '1 <= m, n <= 100', hints: ['Skip obstacles', 'dp[i][j] = 0 if obstacle', 'Handle first row/column'] },
  { id: 292, studyPlans: ['top-interview-150'], title: 'Best Time to Buy and Sell Stock III', difficulty: 'Hard', topics: ['Arrays', 'Dynamic Programming'], patterns: ['dp-state-machine'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 30, description: 'Find maximum profit with at most two transactions.', examples: [{ input: 'prices = [3,3,5,0,0,3,1,4]', output: '6' }], constraints: '1 <= prices.length <= 10^5', hints: ['Track buy1, sell1, buy2, sell2', 'State machine approach', 'Forward + backward passes'] },
  { id: 293, studyPlans: ['top-interview-150'], title: 'Best Time to Buy and Sell Stock IV', difficulty: 'Hard', topics: ['Arrays', 'Dynamic Programming'], patterns: ['dp-state-machine', 'dp-knapsack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'Find maximum profit with at most k transactions.', examples: [{ input: 'k = 2, prices = [2,4,1]', output: '2' }, { input: 'k = 2, prices = [3,2,6,5,0,3]', output: '7' }], constraints: '1 <= k <= 100\n1 <= prices.length <= 1000', hints: ['If k >= n/2, unlimited', 'dp[i][j] = max profit i txns up to day j', 'State machine with k states'] },
,

    // ═══════════════════════════════════════════════════════
    // THITA PATTERNS SHEET — Additional LeetCode Problems
    // ═══════════════════════════════════════════════════════
    { id: 294, leetcodeLink: 'https://leetcode.com/problems/twosum/', title: 'TwoSum', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 66, timeEstimate: 15, description: 'LeetCode #1. TwoSum. Pattern 11: Character Frequency Matching.',
        examples: [{ input: 'See LeetCode #1', output: 'See LeetCode #1' }],
        constraints: ['See LeetCode problem #1 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 11: Character Frequency Matching']
    },
    { id: 295, leetcodeLink: 'https://leetcode.com/problems/palindrome-number/', title: 'Palindrome Number', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 74, timeEstimate: 15, description: 'LeetCode #9. Palindrome Number. Pattern 86: Palindrome Check.',
        examples: [{ input: 'See LeetCode #9', output: 'See LeetCode #9' }],
        constraints: ['See LeetCode problem #9 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 86: Palindrome Check']
    },
    { id: 296, leetcodeLink: 'https://leetcode.com/problems/integer-to-roman/', title: 'Integer to Roman', difficulty: 'Medium', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #12. Integer to Roman. Pattern 88: Roman to Integer Conversion.',
        examples: [{ input: 'See LeetCode #12', output: 'See LeetCode #12' }],
        constraints: ['See LeetCode problem #12 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 88: Roman to Integer Conversion']
    },
    { id: 297, leetcodeLink: 'https://leetcode.com/problems/3sum-closest/', title: '3Sum Closest', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #16. 3Sum Closest. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #16', output: 'See LeetCode #16' }],
        constraints: ['See LeetCode problem #16 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 298, leetcodeLink: 'https://leetcode.com/problems/4sum/', title: '4Sum', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #18. 4Sum. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #18', output: 'See LeetCode #18' }],
        constraints: ['See LeetCode problem #18 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 299, leetcodeLink: 'https://leetcode.com/problems/merge-two-sorted-lists/', title: 'Merge Two Sorted Lists', difficulty: 'Easy', topics: ['Linked List'], patterns: ['linked-list'], companies: ['amazon', 'microsoft'], frequency: 'high', acceptance: 71, timeEstimate: 15, description: 'LeetCode #21. Merge Two Sorted Lists. Pattern 75: Merging Two Sorted Lists.',
        examples: [{ input: 'See LeetCode #21', output: 'See LeetCode #21' }],
        constraints: ['See LeetCode problem #21 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 75: Merging Two Sorted Lists']
    },
    { id: 300, leetcodeLink: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', title: 'Reverse Nodes in k-Group', difficulty: 'Medium', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'LeetCode #25. Reverse Nodes in k-Group. Pattern 74: In-place Reversal.',
        examples: [{ input: 'See LeetCode #25', output: 'See LeetCode #25' }],
        constraints: ['See LeetCode problem #25 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 74: In-place Reversal']
    },
    { id: 301, leetcodeLink: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', title: 'Find the Index of the First Occurrence in a String', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'LeetCode #28. Find the Index of the First Occurrence in a String. Pattern 91: String Matching - Naive / KMP / Rabin-Karp, Pattern 92: Repeated Substring Pattern Detection.',
        examples: [{ input: 'See LeetCode #28', output: 'See LeetCode #28' }],
        constraints: ['See LeetCode problem #28 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 91: String Matching - Naive / KMP / Rabin-Karp']
    },
    { id: 302, leetcodeLink: 'https://leetcode.com/problems/next-permutation/', title: 'Next Permutation', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #31. Next Permutation. Pattern 47: Permutations.',
        examples: [{ input: 'See LeetCode #31', output: 'See LeetCode #31' }],
        constraints: ['See LeetCode problem #31 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 47: Permutations']
    },
    { id: 303, leetcodeLink: 'https://leetcode.com/problems/longest-valid-parentheses/', title: 'Longest Valid Parentheses', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #32. Longest Valid Parentheses. Pattern 64: Valid Parentheses Matching.',
        examples: [{ input: 'See LeetCode #32', output: 'See LeetCode #32' }],
        constraints: ['See LeetCode problem #32 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 64: Valid Parentheses Matching']
    },
    { id: 304, leetcodeLink: 'https://leetcode.com/problems/search-insert-position/', title: 'Search Insert Position', difficulty: 'Easy', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #35. Search Insert Position. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #35', output: 'See LeetCode #35' }],
        constraints: ['See LeetCode problem #35 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 305, leetcodeLink: 'https://leetcode.com/problems/first-missing-positive/', title: 'First Missing Positive', difficulty: 'Hard', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 26, timeEstimate: 35, description: 'LeetCode #41. First Missing Positive. Pattern 85: Cyclic Sort.',
        examples: [{ input: 'See LeetCode #41', output: 'See LeetCode #41' }],
        constraints: ['See LeetCode problem #41 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 85: Cyclic Sort']
    },
    { id: 306, leetcodeLink: 'https://leetcode.com/problems/multiply-strings/', title: 'Multiply Strings', difficulty: 'Medium', topics: ['Arrays', 'Matrix', 'Strings'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum', 'string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #43. Multiply Strings. Pattern 83: Plus One, Pattern 90: Manual Simulation.',
        examples: [{ input: 'See LeetCode #43', output: 'See LeetCode #43' }],
        constraints: ['See LeetCode problem #43 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 83: Plus One']
    },
    { id: 307, leetcodeLink: 'https://leetcode.com/problems/spiral-matrix-ii/', title: 'Spiral Matrix II', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #59. Spiral Matrix II. Pattern 80: Spiral Traversal.',
        examples: [{ input: 'See LeetCode #59', output: 'See LeetCode #59' }],
        constraints: ['See LeetCode problem #59 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 80: Spiral Traversal']
    },
    { id: 308, leetcodeLink: 'https://leetcode.com/problems/permutation-sequence/', title: 'Permutation Sequence', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #60. Permutation Sequence. Pattern 47: Permutations.',
        examples: [{ input: 'See LeetCode #60', output: 'See LeetCode #60' }],
        constraints: ['See LeetCode problem #60 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 47: Permutations']
    },
    { id: 309, leetcodeLink: 'https://leetcode.com/problems/rotate-list/', title: 'Rotate List', difficulty: 'Medium', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #61. Rotate List. Pattern 78: Reordering / Partitioning.',
        examples: [{ input: 'See LeetCode #61', output: 'See LeetCode #61' }],
        constraints: ['See LeetCode problem #61 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 78: Reordering / Partitioning']
    },
    { id: 310, leetcodeLink: 'https://leetcode.com/problems/minimum-path-sum/', title: 'Minimum Path Sum', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #64. Minimum Path Sum. Pattern 37: Unique Paths on Grid.',
        examples: [{ input: 'See LeetCode #64', output: 'See LeetCode #64' }],
        constraints: ['See LeetCode problem #64 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 37: Unique Paths on Grid']
    },
    { id: 311, leetcodeLink: 'https://leetcode.com/problems/plus-one/', title: 'Plus One', difficulty: 'Easy', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 71, timeEstimate: 15, description: 'LeetCode #66. Plus One. Pattern 83: Plus One.',
        examples: [{ input: 'See LeetCode #66', output: 'See LeetCode #66' }],
        constraints: ['See LeetCode problem #66 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 83: Plus One']
    },
    { id: 312, leetcodeLink: 'https://leetcode.com/problems/add-binary/', title: 'Add Binary', difficulty: 'Easy', topics: ['Arrays', 'Matrix', 'Strings'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum', 'string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 72, timeEstimate: 15, description: 'LeetCode #67. Add Binary. Pattern 83: Plus One, Pattern 90: Manual Simulation.',
        examples: [{ input: 'See LeetCode #67', output: 'See LeetCode #67' }],
        constraints: ['See LeetCode problem #67 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 83: Plus One']
    },
    { id: 313, leetcodeLink: 'https://leetcode.com/problems/sqrtx/', title: 'Sqrt(x)', difficulty: 'Easy', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 74, timeEstimate: 15, description: 'LeetCode #69. Sqrt(x). Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #69', output: 'See LeetCode #69' }],
        constraints: ['See LeetCode problem #69 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 314, leetcodeLink: 'https://leetcode.com/problems/simplify-path/', title: 'Simplify Path', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #71. Simplify Path. Pattern 67: Simulation / Backtracking Helper.',
        examples: [{ input: 'See LeetCode #71', output: 'See LeetCode #71' }],
        constraints: ['See LeetCode problem #71 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 67: Simulation / Backtracking Helper']
    },
    { id: 315, leetcodeLink: 'https://leetcode.com/problems/search-a-2d-matrix/', title: 'Search a 2D Matrix', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #74. Search a 2D Matrix. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #74', output: 'See LeetCode #74' }],
        constraints: ['See LeetCode problem #74 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 316, leetcodeLink: 'https://leetcode.com/problems/combinations/', title: 'Combinations', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #77. Combinations. Pattern 46: Subsets (Include/Exclude).',
        examples: [{ input: 'See LeetCode #77', output: 'See LeetCode #77' }],
        constraints: ['See LeetCode problem #77 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 46: Subsets (Include/Exclude)']
    },
    { id: 317, leetcodeLink: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/', title: 'Remove Duplicates from Sorted Array II', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #80. Remove Duplicates from Sorted Array II. Pattern 4: In-place Array Modification.',
        examples: [{ input: 'See LeetCode #80', output: 'See LeetCode #80' }],
        constraints: ['See LeetCode problem #80 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 4: In-place Array Modification']
    },
    { id: 318, leetcodeLink: 'https://leetcode.com/problems/search-in-rotated-sorted-array-ii/', title: 'Search in Rotated Sorted Array II', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #81. Search in Rotated Sorted Array II. Pattern 60: Find Min/Max in Rotated Sorted Array.',
        examples: [{ input: 'See LeetCode #81', output: 'See LeetCode #81' }],
        constraints: ['See LeetCode problem #81 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 60: Find Min/Max in Rotated Sorted Array']
    },
    { id: 319, leetcodeLink: 'https://leetcode.com/problems/remove-duplicates-from-sorted-list/', title: 'Remove Duplicates from Sorted List', difficulty: 'Easy', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 73, timeEstimate: 15, description: 'LeetCode #83. Remove Duplicates from Sorted List. Pattern 74: In-place Reversal.',
        examples: [{ input: 'See LeetCode #83', output: 'See LeetCode #83' }],
        constraints: ['See LeetCode problem #83 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 74: In-place Reversal']
    },
    { id: 320, leetcodeLink: 'https://leetcode.com/problems/subsets-ii/', title: 'Subsets II', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #90. Subsets II. Pattern 46: Subsets (Include/Exclude).',
        examples: [{ input: 'See LeetCode #90', output: 'See LeetCode #90' }],
        constraints: ['See LeetCode problem #90 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 46: Subsets (Include/Exclude)']
    },
    { id: 321, leetcodeLink: 'https://leetcode.com/problems/decode-ways/', title: 'Decode Ways', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #91. Decode Ways. Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #91', output: 'See LeetCode #91' }],
        constraints: ['See LeetCode problem #91 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 30: Fibonacci Style']
    },
    { id: 322, leetcodeLink: 'https://leetcode.com/problems/reverse-linked-list-ii/', title: 'Reverse Linked List II', difficulty: 'Medium', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #92. Reverse Linked List II. Pattern 74: In-place Reversal.',
        examples: [{ input: 'See LeetCode #92', output: 'See LeetCode #92' }],
        constraints: ['See LeetCode problem #92 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 74: In-place Reversal']
    },
    { id: 323, leetcodeLink: 'https://leetcode.com/problems/unique-binary-search-trees-ii/', title: 'Unique Binary Search Trees II', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #95. Unique Binary Search Trees II. Pattern 39: Catalan Numbers.',
        examples: [{ input: 'See LeetCode #95', output: 'See LeetCode #95' }],
        constraints: ['See LeetCode problem #95 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 39: Catalan Numbers']
    },
    { id: 324, leetcodeLink: 'https://leetcode.com/problems/same-tree/', title: 'Same Tree', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 75, timeEstimate: 15, description: 'LeetCode #100. Same Tree. Pattern 13: Recursive Preorder Traversal.',
        examples: [{ input: 'See LeetCode #100', output: 'See LeetCode #100' }],
        constraints: ['See LeetCode problem #100 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 13: Recursive Preorder Traversal']
    },
    { id: 325, leetcodeLink: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #104. Maximum Depth of Binary Tree. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #104', output: 'See LeetCode #104' }],
        constraints: ['See LeetCode problem #104 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 326, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/', title: 'Best Time to Buy and Sell Stock II', difficulty: 'Medium', topics: ['Dynamic Programming', 'Greedy'], patterns: ['dynamic-programming', 'greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #122. Best Time to Buy and Sell Stock II. Pattern 41: Stock problems, Pattern 55: Buy/Sell Stock.',
        examples: [{ input: 'See LeetCode #122', output: 'See LeetCode #122' }],
        constraints: ['See LeetCode problem #122 for full constraints'],
        hints: ['Think about Dynamic Programming / Greedy patterns', 'Consider Pattern 41: Stock problems']
    },
    { id: 327, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/', title: 'Best Time to Buy and Sell Stock III', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 28, timeEstimate: 35, description: 'LeetCode #123. Best Time to Buy and Sell Stock III. Pattern 41: Stock problems.',
        examples: [{ input: 'See LeetCode #123', output: 'See LeetCode #123' }],
        constraints: ['See LeetCode problem #123 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 41: Stock problems']
    },
    { id: 328, leetcodeLink: 'https://leetcode.com/problems/word-ladder-ii/', title: 'Word Ladder II', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 31, timeEstimate: 35, description: 'LeetCode #126. Word Ladder II. Pattern 29: Bidirectional BFS.',
        examples: [{ input: 'See LeetCode #126', output: 'See LeetCode #126' }],
        constraints: ['See LeetCode problem #126 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 29: Bidirectional BFS']
    },
    { id: 329, leetcodeLink: 'https://leetcode.com/problems/surrounded-regions/', title: 'Surrounded Regions', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #130. Surrounded Regions. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #130', output: 'See LeetCode #130' }],
        constraints: ['See LeetCode problem #130 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 330, leetcodeLink: 'https://leetcode.com/problems/palindrome-partitioning/', title: 'Palindrome Partitioning', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #131. Palindrome Partitioning. Pattern 52: Palindrome Partitioning.',
        examples: [{ input: 'See LeetCode #131', output: 'See LeetCode #131' }],
        constraints: ['See LeetCode problem #131 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 52: Palindrome Partitioning']
    },
    { id: 331, leetcodeLink: 'https://leetcode.com/problems/palindrome-partitioning-ii/', title: 'Palindrome Partitioning II', difficulty: 'Hard', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #132. Palindrome Partitioning II. Pattern 52: Palindrome Partitioning.',
        examples: [{ input: 'See LeetCode #132', output: 'See LeetCode #132' }],
        constraints: ['See LeetCode problem #132 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 52: Palindrome Partitioning']
    },
    { id: 332, leetcodeLink: 'https://leetcode.com/problems/single-number-ii/', title: 'Single Number II', difficulty: 'Medium', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #137. Single Number II. Pattern 70: Bitwise XOR - Finding Single/Missing Number.',
        examples: [{ input: 'See LeetCode #137', output: 'See LeetCode #137' }],
        constraints: ['See LeetCode problem #137 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 70: Bitwise XOR - Finding Single/Missing Number']
    },
    { id: 333, leetcodeLink: 'https://leetcode.com/problems/copy-list-with-random-pointer/', title: 'Copy List with Random Pointer', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #138. Copy List with Random Pointer. Pattern 22: Deep Copy / Cloning.',
        examples: [{ input: 'See LeetCode #138', output: 'See LeetCode #138' }],
        constraints: ['See LeetCode problem #138 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 22: Deep Copy / Cloning']
    },
    { id: 334, leetcodeLink: 'https://leetcode.com/problems/word-break-ii/', title: 'Word Break II', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 25, timeEstimate: 35, description: 'LeetCode #140. Word Break II. Pattern 34: Word Break Style.',
        examples: [{ input: 'See LeetCode #140', output: 'See LeetCode #140' }],
        constraints: ['See LeetCode problem #140 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 34: Word Break Style']
    },
    { id: 335, leetcodeLink: 'https://leetcode.com/problems/binary-tree-postorder-traversal/', title: 'Binary Tree Postorder Traversal', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 75, timeEstimate: 15, description: 'LeetCode #145. Binary Tree Postorder Traversal. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #145', output: 'See LeetCode #145' }],
        constraints: ['See LeetCode problem #145 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 336, leetcodeLink: 'https://leetcode.com/problems/maximum-product-subarray/', title: 'Maximum Product Subarray', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon', 'microsoft'], frequency: 'high', acceptance: 52, timeEstimate: 25, description: 'LeetCode #152. Maximum Product Subarray. Pattern 31: Kadane\'s Algorithm for Max/Min Subarray.',
        examples: [{ input: 'See LeetCode #152', output: 'See LeetCode #152' }],
        constraints: ['See LeetCode problem #152 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 31: Kadane\'s Algorithm for Max/Min Subarray']
    },
    { id: 337, leetcodeLink: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 53, timeEstimate: 25, description: 'LeetCode #153. Find Minimum in Rotated Sorted Array. Pattern 60: Find Min/Max in Rotated Sorted Array.',
        examples: [{ input: 'See LeetCode #153', output: 'See LeetCode #153' }],
        constraints: ['See LeetCode problem #153 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 60: Find Min/Max in Rotated Sorted Array']
    },
    { id: 338, leetcodeLink: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #167. Two Sum II - Input Array Is Sorted. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #167', output: 'See LeetCode #167' }],
        constraints: ['See LeetCode problem #167 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 339, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/', title: 'Best Time to Buy and Sell Stock IV', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 33, timeEstimate: 35, description: 'LeetCode #188. Best Time to Buy and Sell Stock IV. Pattern 41: Stock problems.',
        examples: [{ input: 'See LeetCode #188', output: 'See LeetCode #188' }],
        constraints: ['See LeetCode problem #188 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 41: Stock problems']
    },
    { id: 340, leetcodeLink: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #211. Design Add and Search Words Data Structure. Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #211', output: 'See LeetCode #211' }],
        constraints: ['See LeetCode problem #211 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 94: Tries']
    },
    { id: 341, leetcodeLink: 'https://leetcode.com/problems/house-robber-ii/', title: 'House Robber II', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #213. House Robber II. Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #213', output: 'See LeetCode #213' }],
        constraints: ['See LeetCode problem #213 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 30: Fibonacci Style']
    },
    { id: 342, leetcodeLink: 'https://leetcode.com/problems/shortest-palindrome/', title: 'Shortest Palindrome', difficulty: 'Hard', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 39, timeEstimate: 35, description: 'LeetCode #214. Shortest Palindrome. Pattern 91: String Matching - Naive / KMP / Rabin-Karp.',
        examples: [{ input: 'See LeetCode #214', output: 'See LeetCode #214' }],
        constraints: ['See LeetCode problem #214 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 91: String Matching - Naive / KMP / Rabin-Karp']
    },
    { id: 343, leetcodeLink: 'https://leetcode.com/problems/contains-duplicate-ii/', title: 'Contains Duplicate II', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 74, timeEstimate: 15, description: 'LeetCode #219. Contains Duplicate II. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #219', output: 'See LeetCode #219' }],
        constraints: ['See LeetCode problem #219 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 344, leetcodeLink: 'https://leetcode.com/problems/basic-calculator/', title: 'Basic Calculator', difficulty: 'Hard', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 29, timeEstimate: 35, description: 'LeetCode #224. Basic Calculator. Pattern 66: Expression Evaluation.',
        examples: [{ input: 'See LeetCode #224', output: 'See LeetCode #224' }],
        constraints: ['See LeetCode problem #224 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 66: Expression Evaluation']
    },
    { id: 345, leetcodeLink: 'https://leetcode.com/problems/implement-stack-using-queues/', title: 'Implement Stack using Queues', difficulty: 'Easy', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'LeetCode #225. Implement Stack using Queues. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #225', output: 'See LeetCode #225' }],
        constraints: ['See LeetCode problem #225 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 346, leetcodeLink: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #235. Lowest Common Ancestor of a Binary Search Tree. Pattern 16: Lowest Common Ancestor.',
        examples: [{ input: 'See LeetCode #235', output: 'See LeetCode #235' }],
        constraints: ['See LeetCode problem #235 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 16: Lowest Common Ancestor']
    },
    { id: 347, leetcodeLink: 'https://leetcode.com/problems/different-ways-to-add-parentheses/', title: 'Different Ways to Add Parentheses', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #241. Different Ways to Add Parentheses. Pattern 39: Catalan Numbers.',
        examples: [{ input: 'See LeetCode #241', output: 'See LeetCode #241' }],
        constraints: ['See LeetCode problem #241 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 39: Catalan Numbers']
    },
    { id: 348, leetcodeLink: 'https://leetcode.com/problems/valid-anagram/', title: 'Valid Anagram', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #242. Valid Anagram. Pattern 87: Anagram Check.',
        examples: [{ input: 'See LeetCode #242', output: 'See LeetCode #242' }],
        constraints: ['See LeetCode problem #242 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 87: Anagram Check']
    },
    { id: 349, leetcodeLink: 'https://leetcode.com/problems/flatten-2d-vector/', title: 'Flatten 2D Vector', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #251. Flatten 2D Vector. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #251', output: 'See LeetCode #251' }],
        constraints: ['See LeetCode problem #251 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 350, leetcodeLink: 'https://leetcode.com/problems/binary-tree-paths/', title: 'Binary Tree Paths', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #257. Binary Tree Paths. Pattern 13: Recursive Preorder Traversal.',
        examples: [{ input: 'See LeetCode #257', output: 'See LeetCode #257' }],
        constraints: ['See LeetCode problem #257 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 13: Recursive Preorder Traversal']
    },
    { id: 351, leetcodeLink: 'https://leetcode.com/problems/3sum-smaller/', title: '3Sum Smaller', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #259. 3Sum Smaller. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #259', output: 'See LeetCode #259' }],
        constraints: ['See LeetCode problem #259 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 352, leetcodeLink: 'https://leetcode.com/problems/graph-valid-tree/', title: 'Graph Valid Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #261. Graph Valid Tree. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #261', output: 'See LeetCode #261' }],
        constraints: ['See LeetCode problem #261 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 353, leetcodeLink: 'https://leetcode.com/problems/encode-and-decode-strings/', title: 'Encode and Decode Strings', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #271. Encode and Decode Strings. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #271', output: 'See LeetCode #271' }],
        constraints: ['See LeetCode problem #271 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 354, leetcodeLink: 'https://leetcode.com/problems/first-bad-version/', title: 'First Bad Version', difficulty: 'Easy', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 73, timeEstimate: 15, description: 'LeetCode #278. First Bad Version. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #278', output: 'See LeetCode #278' }],
        constraints: ['See LeetCode problem #278 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 355, leetcodeLink: 'https://leetcode.com/problems/find-the-duplicate-number/', title: 'Find the Duplicate Number', difficulty: 'Medium', topics: ['Arrays', 'Matrix', 'Two Pointers'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum', 'two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #287. Find the Duplicate Number. Pattern 2: Fast & Slow, Pattern 85: Cyclic Sort.',
        examples: [{ input: 'See LeetCode #287', output: 'See LeetCode #287' }],
        constraints: ['See LeetCode problem #287 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 2: Fast & Slow']
    },
    { id: 356, leetcodeLink: 'https://leetcode.com/problems/game-of-life/', title: 'Game of Life', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #289. Game of Life. Pattern 81: In-place Marking.',
        examples: [{ input: 'See LeetCode #289', output: 'See LeetCode #289' }],
        constraints: ['See LeetCode problem #289 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 81: In-place Marking']
    },
    { id: 357, leetcodeLink: 'https://leetcode.com/problems/remove-invalid-parentheses/', title: 'Remove Invalid Parentheses', difficulty: 'Hard', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 26, timeEstimate: 35, description: 'LeetCode #301. Remove Invalid Parentheses. Pattern 49: Parentheses Generation.',
        examples: [{ input: 'See LeetCode #301', output: 'See LeetCode #301' }],
        constraints: ['See LeetCode problem #301 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 49: Parentheses Generation']
    },
    { id: 358, leetcodeLink: 'https://leetcode.com/problems/number-of-islands-ii/', title: 'Number of Islands II', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 35, description: 'LeetCode #305. Number of Islands II. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #305', output: 'See LeetCode #305' }],
        constraints: ['See LeetCode problem #305 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 359, leetcodeLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #309. Best Time to Buy and Sell Stock with Cooldown. Pattern 41: Stock problems.',
        examples: [{ input: 'See LeetCode #309', output: 'See LeetCode #309' }],
        constraints: ['See LeetCode problem #309 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 41: Stock problems']
    },
    { id: 360, leetcodeLink: 'https://leetcode.com/problems/minimum-height-trees/', title: 'Minimum Height Trees', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #310. Minimum Height Trees. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #310', output: 'See LeetCode #310' }],
        constraints: ['See LeetCode problem #310 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 361, leetcodeLink: 'https://leetcode.com/problems/burst-balloons/', title: 'Burst Balloons', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #312. Burst Balloons. Pattern 38: Interval DP.',
        examples: [{ input: 'See LeetCode #312', output: 'See LeetCode #312' }],
        constraints: ['See LeetCode problem #312 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 38: Interval DP']
    },
    { id: 362, leetcodeLink: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', title: 'Number of Connected Components in an Undirected Graph', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #323. Number of Connected Components in an Undirected Graph. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #323', output: 'See LeetCode #323' }],
        constraints: ['See LeetCode problem #323 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 363, leetcodeLink: 'https://leetcode.com/problems/odd-even-linked-list/', title: 'Odd Even Linked List', difficulty: 'Medium', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'LeetCode #328. Odd Even Linked List. Pattern 78: Reordering / Partitioning.',
        examples: [{ input: 'See LeetCode #328', output: 'See LeetCode #328' }],
        constraints: ['See LeetCode problem #328 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 78: Reordering / Partitioning']
    },
    { id: 364, leetcodeLink: 'https://leetcode.com/problems/house-robber-iii/', title: 'House Robber III', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Dynamic Programming', 'Trees'], patterns: ['dynamic-programming', 'tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #337. House Robber III. Pattern 15: Recursive Postorder Traversal, Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #337', output: 'See LeetCode #337' }],
        constraints: ['See LeetCode problem #337 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 365, leetcodeLink: 'https://leetcode.com/problems/counting-bits/', title: 'Counting Bits', difficulty: 'Easy', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 73, timeEstimate: 15, description: 'LeetCode #338. Counting Bits. Pattern 72: Bitwise DP - Counting Bits Optimization.',
        examples: [{ input: 'See LeetCode #338', output: 'See LeetCode #338' }],
        constraints: ['See LeetCode problem #338 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 72: Bitwise DP - Counting Bits Optimization']
    },
    { id: 366, leetcodeLink: 'https://leetcode.com/problems/flatten-nested-list-iterator/', title: 'Flatten Nested List Iterator', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #341. Flatten Nested List Iterator. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #341', output: 'See LeetCode #341' }],
        constraints: ['See LeetCode problem #341 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 367, leetcodeLink: 'https://leetcode.com/problems/power-of-four/', title: 'Power of Four', difficulty: 'Easy', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 77, timeEstimate: 15, description: 'LeetCode #342. Power of Four. Pattern 73: Bitwise Operations - Power of Two/Four Check.',
        examples: [{ input: 'See LeetCode #342', output: 'See LeetCode #342' }],
        constraints: ['See LeetCode problem #342 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 73: Bitwise Operations - Power of Two/Four Check']
    },
    { id: 368, leetcodeLink: 'https://leetcode.com/problems/reverse-string/', title: 'Reverse String', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #344. Reverse String. Pattern 7: String Reversal.',
        examples: [{ input: 'See LeetCode #344', output: 'See LeetCode #344' }],
        constraints: ['See LeetCode problem #344 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 7: String Reversal']
    },
    { id: 369, leetcodeLink: 'https://leetcode.com/problems/reverse-vowels-of-a-string/', title: 'Reverse Vowels of a String', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'LeetCode #345. Reverse Vowels of a String. Pattern 7: String Reversal.',
        examples: [{ input: 'See LeetCode #345', output: 'See LeetCode #345' }],
        constraints: ['See LeetCode problem #345 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 7: String Reversal']
    },
    { id: 370, leetcodeLink: 'https://leetcode.com/problems/moving-average-from-data-stream/', title: 'Moving Average from Data Stream', difficulty: 'Easy', topics: ['Arrays', 'Design', 'Sliding Window'], patterns: ['design', 'sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 66, timeEstimate: 15, description: 'LeetCode #346. Moving Average from Data Stream. Pattern 8: Fixed Size, Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #346', output: 'See LeetCode #346' }],
        constraints: ['See LeetCode problem #346 for full constraints'],
        hints: ['Think about Arrays / Design patterns', 'Consider Pattern 8: Fixed Size']
    },
    { id: 371, leetcodeLink: 'https://leetcode.com/problems/intersection-of-two-arrays/', title: 'Intersection of Two Arrays', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 69, timeEstimate: 15, description: 'LeetCode #349. Intersection of Two Arrays. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #349', output: 'See LeetCode #349' }],
        constraints: ['See LeetCode problem #349 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 372, leetcodeLink: 'https://leetcode.com/problems/design-snake-game/', title: 'Design Snake Game', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #353. Design Snake Game. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #353', output: 'See LeetCode #353' }],
        constraints: ['See LeetCode problem #353 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 373, leetcodeLink: 'https://leetcode.com/problems/russian-doll-envelopes/', title: 'Russian Doll Envelopes', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 39, timeEstimate: 35, description: 'LeetCode #354. Russian Doll Envelopes. Pattern 40: Longest Increasing Subsequence.',
        examples: [{ input: 'See LeetCode #354', output: 'See LeetCode #354' }],
        constraints: ['See LeetCode problem #354 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 40: Longest Increasing Subsequence']
    },
    { id: 374, leetcodeLink: 'https://leetcode.com/problems/logger-rate-limiter/', title: 'Logger Rate Limiter', difficulty: 'Easy', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #359. Logger Rate Limiter. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #359', output: 'See LeetCode #359' }],
        constraints: ['See LeetCode problem #359 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 375, leetcodeLink: 'https://leetcode.com/problems/design-hit-counter/', title: 'Design Hit Counter', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #362. Design Hit Counter. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #362', output: 'See LeetCode #362' }],
        constraints: ['See LeetCode problem #362 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 376, leetcodeLink: 'https://leetcode.com/problems/find-leaves-of-binary-tree/', title: 'Find Leaves of Binary Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #366. Find Leaves of Binary Tree. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #366', output: 'See LeetCode #366' }],
        constraints: ['See LeetCode problem #366 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 377, leetcodeLink: 'https://leetcode.com/problems/plus-one-linked-list/', title: 'Plus One Linked List', difficulty: 'Medium', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #369. Plus One Linked List. Pattern 76: Addition of Numbers.',
        examples: [{ input: 'See LeetCode #369', output: 'See LeetCode #369' }],
        constraints: ['See LeetCode problem #369 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 76: Addition of Numbers']
    },
    { id: 378, leetcodeLink: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/', title: 'Find K Pairs with Smallest Sums', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #373. Find K Pairs with Smallest Sums. Pattern 44: K-way Merge.',
        examples: [{ input: 'See LeetCode #373', output: 'See LeetCode #373' }],
        constraints: ['See LeetCode problem #373 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 44: K-way Merge']
    },
    { id: 379, leetcodeLink: 'https://leetcode.com/problems/guess-number-higher-or-lower/', title: 'Guess Number Higher or Lower', difficulty: 'Easy', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #374. Guess Number Higher or Lower. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #374', output: 'See LeetCode #374' }],
        constraints: ['See LeetCode problem #374 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 380, leetcodeLink: 'https://leetcode.com/problems/combination-sum-iv/', title: 'Combination Sum IV', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #377. Combination Sum IV. Pattern 32: Coin Change / Unbounded Knapsack Style.',
        examples: [{ input: 'See LeetCode #377', output: 'See LeetCode #377' }],
        constraints: ['See LeetCode problem #377 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 32: Coin Change / Unbounded Knapsack Style']
    },
    { id: 381, leetcodeLink: 'https://leetcode.com/problems/design-phone-directory/', title: 'Design Phone Directory', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #379. Design Phone Directory. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #379', output: 'See LeetCode #379' }],
        constraints: ['See LeetCode problem #379 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 382, leetcodeLink: 'https://leetcode.com/problems/insert-delete-getrandom-o1/', title: 'Insert Delete GetRandom O(1)', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #380. Insert Delete GetRandom O(1). Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #380', output: 'See LeetCode #380' }],
        constraints: ['See LeetCode problem #380 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 383, leetcodeLink: 'https://leetcode.com/problems/find-the-difference/', title: 'Find the Difference', difficulty: 'Easy', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #389. Find the Difference. Pattern 70: Bitwise XOR - Finding Single/Missing Number.',
        examples: [{ input: 'See LeetCode #389', output: 'See LeetCode #389' }],
        constraints: ['See LeetCode problem #389 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 70: Bitwise XOR - Finding Single/Missing Number']
    },
    { id: 384, leetcodeLink: 'https://leetcode.com/problems/is-subsequence/', title: 'Is Subsequence', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #392. Is Subsequence. Pattern 2: Fast & Slow.',
        examples: [{ input: 'See LeetCode #392', output: 'See LeetCode #392' }],
        constraints: ['See LeetCode problem #392 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 2: Fast & Slow']
    },
    { id: 385, leetcodeLink: 'https://leetcode.com/problems/remove-k-digits/', title: 'Remove K Digits', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #402. Remove K Digits. Pattern 65: Monotonic Stack.',
        examples: [{ input: 'See LeetCode #402', output: 'See LeetCode #402' }],
        constraints: ['See LeetCode problem #402 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 386, leetcodeLink: 'https://leetcode.com/problems/queue-reconstruction-by-height/', title: 'Queue Reconstruction by Height', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #406. Queue Reconstruction by Height. Pattern 58: Sorting Based.',
        examples: [{ input: 'See LeetCode #406', output: 'See LeetCode #406' }],
        constraints: ['See LeetCode problem #406 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 58: Sorting Based']
    },
    { id: 387, leetcodeLink: 'https://leetcode.com/problems/split-array-largest-sum/', title: 'Split Array Largest Sum', difficulty: 'Hard', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'LeetCode #410. Split Array Largest Sum. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #410', output: 'See LeetCode #410' }],
        constraints: ['See LeetCode problem #410 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 388, leetcodeLink: 'https://leetcode.com/problems/add-strings/', title: 'Add Strings', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 75, timeEstimate: 15, description: 'LeetCode #415. Add Strings. Pattern 90: Manual Simulation.',
        examples: [{ input: 'See LeetCode #415', output: 'See LeetCode #415' }],
        constraints: ['See LeetCode problem #415 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 90: Manual Simulation']
    },
    { id: 389, leetcodeLink: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #417. Pacific Atlantic Water Flow. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #417', output: 'See LeetCode #417' }],
        constraints: ['See LeetCode problem #417 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 390, leetcodeLink: 'https://leetcode.com/problems/longest-repeating-character-replacement/', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #424. Longest Repeating Character Replacement. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #424', output: 'See LeetCode #424' }],
        constraints: ['See LeetCode problem #424 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 391, leetcodeLink: 'https://leetcode.com/problems/word-squares/', title: 'Word Squares', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 35, description: 'LeetCode #425. Word Squares. Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #425', output: 'See LeetCode #425' }],
        constraints: ['See LeetCode problem #425 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 94: Tries']
    },
    { id: 392, leetcodeLink: 'https://leetcode.com/problems/all-oone-data-structure/', title: 'All O-one Data Structure', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #432. All O-one Data Structure. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #432', output: 'See LeetCode #432' }],
        constraints: ['See LeetCode problem #432 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 393, leetcodeLink: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/', title: 'Find All Anagrams in a String', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'high', acceptance: 58, timeEstimate: 25, description: 'LeetCode #438. Find All Anagrams in a String. Pattern 11: Character Frequency Matching.',
        examples: [{ input: 'See LeetCode #438', output: 'See LeetCode #438' }],
        constraints: ['See LeetCode problem #438 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 11: Character Frequency Matching']
    },
    { id: 394, leetcodeLink: 'https://leetcode.com/problems/sequence-reconstruction/', title: 'Sequence Reconstruction', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #444. Sequence Reconstruction. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #444', output: 'See LeetCode #444' }],
        constraints: ['See LeetCode problem #444 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 395, leetcodeLink: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/', title: 'Find All Numbers Disappeared in an Array', difficulty: 'Easy', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'LeetCode #448. Find All Numbers Disappeared in an Array. Pattern 85: Cyclic Sort.',
        examples: [{ input: 'See LeetCode #448', output: 'See LeetCode #448' }],
        constraints: ['See LeetCode problem #448 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 85: Cyclic Sort']
    },
    { id: 396, leetcodeLink: 'https://leetcode.com/problems/sort-characters-by-frequency/', title: 'Sort Characters By Frequency', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #451. Sort Characters By Frequency. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #451', output: 'See LeetCode #451' }],
        constraints: ['See LeetCode problem #451 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 397, leetcodeLink: 'https://leetcode.com/problems/assign-cookies/', title: 'Assign Cookies', difficulty: 'Easy', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #455. Assign Cookies. Pattern 58: Sorting Based.',
        examples: [{ input: 'See LeetCode #455', output: 'See LeetCode #455' }],
        constraints: ['See LeetCode problem #455 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 58: Sorting Based']
    },
    { id: 398, leetcodeLink: 'https://leetcode.com/problems/repeated-substring-pattern/', title: 'Repeated Substring Pattern', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 74, timeEstimate: 15, description: 'LeetCode #459. Repeated Substring Pattern. Pattern 92: Repeated Substring Pattern Detection.',
        examples: [{ input: 'See LeetCode #459', output: 'See LeetCode #459' }],
        constraints: ['See LeetCode problem #459 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 92: Repeated Substring Pattern Detection']
    },
    { id: 399, leetcodeLink: 'https://leetcode.com/problems/lfu-cache/', title: 'LFU Cache', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 25, timeEstimate: 35, description: 'LeetCode #460. LFU Cache. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #460', output: 'See LeetCode #460' }],
        constraints: ['See LeetCode problem #460 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 400, leetcodeLink: 'https://leetcode.com/problems/total-hamming-distance/', title: 'Total Hamming Distance', difficulty: 'Medium', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #477. Total Hamming Distance. Pattern 71: Bitwise AND - Counting Set Bits (Hamming Weight).',
        examples: [{ input: 'See LeetCode #477', output: 'See LeetCode #477' }],
        constraints: ['See LeetCode problem #477 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 71: Bitwise AND - Counting Set Bits (Hamming Weight)']
    },
    { id: 401, leetcodeLink: 'https://leetcode.com/problems/target-sum/', title: 'Target Sum', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #494. Target Sum. Pattern 33: 0/1 Knapsack, Subset Sum Style.',
        examples: [{ input: 'See LeetCode #494', output: 'See LeetCode #494' }],
        constraints: ['See LeetCode problem #494 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 33: 0/1 Knapsack, Subset Sum Style']
    },
    { id: 402, leetcodeLink: 'https://leetcode.com/problems/diagonal-traverse/', title: 'Diagonal Traverse', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #498. Diagonal Traverse. Pattern 81: In-place Marking.',
        examples: [{ input: 'See LeetCode #498', output: 'See LeetCode #498' }],
        constraints: ['See LeetCode problem #498 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 81: In-place Marking']
    },
    { id: 403, leetcodeLink: 'https://leetcode.com/problems/find-mode-in-binary-search-tree/', title: 'Find Mode in Binary Search Tree', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 71, timeEstimate: 15, description: 'LeetCode #501. Find Mode in Binary Search Tree. Pattern 14: Recursive Inorder Traversal.',
        examples: [{ input: 'See LeetCode #501', output: 'See LeetCode #501' }],
        constraints: ['See LeetCode problem #501 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 14: Recursive Inorder Traversal']
    },
    { id: 404, leetcodeLink: 'https://leetcode.com/problems/relative-ranks/', title: 'Relative Ranks', difficulty: 'Easy', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 76, timeEstimate: 15, description: 'LeetCode #506. Relative Ranks. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #506', output: 'See LeetCode #506' }],
        constraints: ['See LeetCode problem #506 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 405, leetcodeLink: 'https://leetcode.com/problems/fibonacci-number/', title: 'Fibonacci Number', difficulty: 'Easy', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #509. Fibonacci Number. Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #509', output: 'See LeetCode #509' }],
        constraints: ['See LeetCode problem #509 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 30: Fibonacci Style']
    },
    { id: 406, leetcodeLink: 'https://leetcode.com/problems/find-largest-value-in-each-tree-row/', title: 'Find Largest Value in Each Tree Row', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #515. Find Largest Value in Each Tree Row. Pattern 12: Level Order Traversal.',
        examples: [{ input: 'See LeetCode #515', output: 'See LeetCode #515' }],
        constraints: ['See LeetCode problem #515 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 12: Level Order Traversal']
    },
    { id: 407, leetcodeLink: 'https://leetcode.com/problems/coin-change-ii/', title: 'Coin Change II', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #518. Coin Change II. Pattern 32: Coin Change / Unbounded Knapsack Style.',
        examples: [{ input: 'See LeetCode #518', output: 'See LeetCode #518' }],
        constraints: ['See LeetCode problem #518 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 32: Coin Change / Unbounded Knapsack Style']
    },
    { id: 408, leetcodeLink: 'https://leetcode.com/problems/minimum-absolute-difference-in-bst/', title: 'Minimum Absolute Difference in BST', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #530. Minimum Absolute Difference in BST. Pattern 14: Recursive Inorder Traversal.',
        examples: [{ input: 'See LeetCode #530', output: 'See LeetCode #530' }],
        constraints: ['See LeetCode problem #530 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 14: Recursive Inorder Traversal']
    },
    { id: 409, leetcodeLink: 'https://leetcode.com/problems/single-element-in-a-sorted-array/', title: 'Single Element in a Sorted Array', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #540. Single Element in a Sorted Array. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #540', output: 'See LeetCode #540' }],
        constraints: ['See LeetCode problem #540 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 410, leetcodeLink: 'https://leetcode.com/problems/reverse-string-ii/', title: 'Reverse String II', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 66, timeEstimate: 15, description: 'LeetCode #541. Reverse String II. Pattern 7: String Reversal.',
        examples: [{ input: 'See LeetCode #541', output: 'See LeetCode #541' }],
        constraints: ['See LeetCode problem #541 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 7: String Reversal']
    },
    { id: 411, leetcodeLink: 'https://leetcode.com/problems/01-matrix/', title: '01 Matrix', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #542. 01 Matrix. Pattern 19: BFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #542', output: 'See LeetCode #542' }],
        constraints: ['See LeetCode problem #542 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 19: BFS - Connected Components / Island Counting']
    },
    { id: 412, leetcodeLink: 'https://leetcode.com/problems/remove-boxes/', title: 'Remove Boxes', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 31, timeEstimate: 35, description: 'LeetCode #546. Remove Boxes. Pattern 38: Interval DP.',
        examples: [{ input: 'See LeetCode #546', output: 'See LeetCode #546' }],
        constraints: ['See LeetCode problem #546 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 38: Interval DP']
    },
    { id: 413, leetcodeLink: 'https://leetcode.com/problems/number-of-provinces/', title: 'Number of Provinces', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #547. Number of Provinces. Pattern 18: DFS - Connected Components / Island Counting, Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #547', output: 'See LeetCode #547' }],
        constraints: ['See LeetCode problem #547 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 414, leetcodeLink: 'https://leetcode.com/problems/permutation-in-string/', title: 'Permutation in String', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'high', acceptance: 47, timeEstimate: 25, description: 'LeetCode #567. Permutation in String. Pattern 11: Character Frequency Matching.',
        examples: [{ input: 'See LeetCode #567', output: 'See LeetCode #567' }],
        constraints: ['See LeetCode problem #567 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 11: Character Frequency Matching']
    },
    { id: 415, leetcodeLink: 'https://leetcode.com/problems/subtree-of-another-tree/', title: 'Subtree of Another Tree', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #572. Subtree of Another Tree. Pattern 17: Serialization and Deserialization.',
        examples: [{ input: 'See LeetCode #572', output: 'See LeetCode #572' }],
        constraints: ['See LeetCode problem #572 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 17: Serialization and Deserialization']
    },
    { id: 416, leetcodeLink: 'https://leetcode.com/problems/delete-operation-for-two-strings/', title: 'Delete Operation for Two Strings', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #583. Delete Operation for Two Strings. Pattern 36: Edit Distance / Levenshtein Distance.',
        examples: [{ input: 'See LeetCode #583', output: 'See LeetCode #583' }],
        constraints: ['See LeetCode problem #583 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 36: Edit Distance / Levenshtein Distance']
    },
    { id: 417, leetcodeLink: 'https://leetcode.com/problems/minimum-index-sum-of-two-lists/', title: 'Minimum Index Sum of Two Lists', difficulty: 'Easy', topics: ['Linked List'], patterns: ['linked-list'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #599. Minimum Index Sum of Two Lists. Pattern 77: Intersection Detection.',
        examples: [{ input: 'See LeetCode #599', output: 'See LeetCode #599' }],
        constraints: ['See LeetCode problem #599 for full constraints'],
        hints: ['Think about Linked List patterns', 'Consider Pattern 77: Intersection Detection']
    },
    { id: 418, leetcodeLink: 'https://leetcode.com/problems/design-compressed-string-iterator/', title: 'Design Compressed String Iterator', difficulty: 'Easy', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 69, timeEstimate: 15, description: 'LeetCode #604. Design Compressed String Iterator. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #604', output: 'See LeetCode #604' }],
        constraints: ['See LeetCode problem #604 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 419, leetcodeLink: 'https://leetcode.com/problems/task-scheduler/', title: 'Task Scheduler', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 41, timeEstimate: 25, description: 'LeetCode #621. Task Scheduler. Pattern 57: Task Scheduling.',
        examples: [{ input: 'See LeetCode #621', output: 'See LeetCode #621' }],
        constraints: ['See LeetCode problem #621 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 57: Task Scheduling']
    },
    { id: 420, leetcodeLink: 'https://leetcode.com/problems/design-circular-queue/', title: 'Design Circular Queue', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #622. Design Circular Queue. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #622', output: 'See LeetCode #622' }],
        constraints: ['See LeetCode problem #622 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 421, leetcodeLink: 'https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/', title: 'Smallest Range Covering Elements from K Lists', difficulty: 'Hard', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #632. Smallest Range Covering Elements from K Lists. Pattern 44: K-way Merge.',
        examples: [{ input: 'See LeetCode #632', output: 'See LeetCode #632' }],
        constraints: ['See LeetCode problem #632 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 44: K-way Merge']
    },
    { id: 422, leetcodeLink: 'https://leetcode.com/problems/design-circular-deque/', title: 'Design Circular Deque', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #641. Design Circular Deque. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #641', output: 'See LeetCode #641' }],
        constraints: ['See LeetCode problem #641 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 423, leetcodeLink: 'https://leetcode.com/problems/design-search-autocomplete-system/', title: 'Design Search Autocomplete System', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 27, timeEstimate: 35, description: 'LeetCode #642. Design Search Autocomplete System. Pattern 93: Design (General/Specific), Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #642', output: 'See LeetCode #642' }],
        constraints: ['See LeetCode problem #642 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 424, leetcodeLink: 'https://leetcode.com/problems/maximum-average-subarray-i/', title: 'Maximum Average Subarray I', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'LeetCode #643. Maximum Average Subarray I. Pattern 8: Fixed Size.',
        examples: [{ input: 'See LeetCode #643', output: 'See LeetCode #643' }],
        constraints: ['See LeetCode problem #643 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 8: Fixed Size']
    },
    { id: 425, leetcodeLink: 'https://leetcode.com/problems/palindromic-substrings/', title: 'Palindromic Substrings', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #647. Palindromic Substrings. Pattern 6: Expanding From Center.',
        examples: [{ input: 'See LeetCode #647', output: 'See LeetCode #647' }],
        constraints: ['See LeetCode problem #647 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 6: Expanding From Center']
    },
    { id: 426, leetcodeLink: 'https://leetcode.com/problems/replace-words/', title: 'Replace Words', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'LeetCode #648. Replace Words. Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #648', output: 'See LeetCode #648' }],
        constraints: ['See LeetCode problem #648 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 94: Tries']
    },
    { id: 427, leetcodeLink: 'https://leetcode.com/problems/find-duplicate-subtrees/', title: 'Find Duplicate Subtrees', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #652. Find Duplicate Subtrees. Pattern 17: Serialization and Deserialization.',
        examples: [{ input: 'See LeetCode #652', output: 'See LeetCode #652' }],
        constraints: ['See LeetCode problem #652 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 17: Serialization and Deserialization']
    },
    { id: 428, leetcodeLink: 'https://leetcode.com/problems/find-k-closest-elements/', title: 'Find K Closest Elements', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #658. Find K Closest Elements. Pattern 62: Find First/Last Occurrence.',
        examples: [{ input: 'See LeetCode #658', output: 'See LeetCode #658' }],
        constraints: ['See LeetCode problem #658 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 62: Find First/Last Occurrence']
    },
    { id: 429, leetcodeLink: 'https://leetcode.com/problems/valid-palindrome-ii/', title: 'Valid Palindrome II', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #680. Valid Palindrome II. Pattern 86: Palindrome Check.',
        examples: [{ input: 'See LeetCode #680', output: 'See LeetCode #680' }],
        constraints: ['See LeetCode problem #680 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 86: Palindrome Check']
    },
    { id: 430, leetcodeLink: 'https://leetcode.com/problems/redundant-connection/', title: 'Redundant Connection', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #684. Redundant Connection. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #684', output: 'See LeetCode #684' }],
        constraints: ['See LeetCode problem #684 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 431, leetcodeLink: 'https://leetcode.com/problems/repeated-string-match/', title: 'Repeated String Match', difficulty: 'Medium', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #686. Repeated String Match. Pattern 91: String Matching - Naive / KMP / Rabin-Karp, Pattern 92: Repeated Substring Pattern Detection.',
        examples: [{ input: 'See LeetCode #686', output: 'See LeetCode #686' }],
        constraints: ['See LeetCode problem #686 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 91: String Matching - Naive / KMP / Rabin-Karp']
    },
    { id: 432, leetcodeLink: 'https://leetcode.com/problems/max-area-of-island/', title: 'Max Area of Island', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'high', acceptance: 55, timeEstimate: 25, description: 'LeetCode #695. Max Area of Island. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #695', output: 'See LeetCode #695' }],
        constraints: ['See LeetCode problem #695 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 433, leetcodeLink: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', title: 'Kth Largest Element in a Stream', difficulty: 'Easy', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'LeetCode #703. Kth Largest Element in a Stream. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #703', output: 'See LeetCode #703' }],
        constraints: ['See LeetCode problem #703 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 434, leetcodeLink: 'https://leetcode.com/problems/design-hashmap/', title: 'Design HashMap', difficulty: 'Easy', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 66, timeEstimate: 15, description: 'LeetCode #706. Design HashMap. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #706', output: 'See LeetCode #706' }],
        constraints: ['See LeetCode problem #706 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 435, leetcodeLink: 'https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/', title: 'Minimum ASCII Delete Sum for Two Strings', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #712. Minimum ASCII Delete Sum for Two Strings. Pattern 36: Edit Distance / Levenshtein Distance.',
        examples: [{ input: 'See LeetCode #712', output: 'See LeetCode #712' }],
        constraints: ['See LeetCode problem #712 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 36: Edit Distance / Levenshtein Distance']
    },
    { id: 436, leetcodeLink: 'https://leetcode.com/problems/subarray-product-less-than-k/', title: 'Subarray Product Less Than K', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #713. Subarray Product Less Than K. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #713', output: 'See LeetCode #713' }],
        constraints: ['See LeetCode problem #713 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 437, leetcodeLink: 'https://leetcode.com/problems/range-module/', title: 'Range Module', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 35, description: 'LeetCode #715. Range Module. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #715', output: 'See LeetCode #715' }],
        constraints: ['See LeetCode problem #715 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 438, leetcodeLink: 'https://leetcode.com/problems/find-k-th-smallest-pair-distance/', title: 'Find K-th Smallest Pair Distance', difficulty: 'Hard', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 35, description: 'LeetCode #719. Find K-th Smallest Pair Distance. Pattern 63: Median / Kth across Two Sorted Arrays.',
        examples: [{ input: 'See LeetCode #719', output: 'See LeetCode #719' }],
        constraints: ['See LeetCode problem #719 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 63: Median / Kth across Two Sorted Arrays']
    },
    { id: 439, leetcodeLink: 'https://leetcode.com/problems/longest-word-in-dictionary/', title: 'Longest Word in Dictionary', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #720. Longest Word in Dictionary. Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #720', output: 'See LeetCode #720' }],
        constraints: ['See LeetCode problem #720 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 94: Tries']
    },
    { id: 440, leetcodeLink: 'https://leetcode.com/problems/accounts-merge/', title: 'Accounts Merge', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #721. Accounts Merge. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #721', output: 'See LeetCode #721' }],
        constraints: ['See LeetCode problem #721 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 441, leetcodeLink: 'https://leetcode.com/problems/flood-fill/', title: 'Flood Fill', difficulty: 'Easy', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 78, timeEstimate: 15, description: 'LeetCode #733. Flood Fill. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #733', output: 'See LeetCode #733' }],
        constraints: ['See LeetCode problem #733 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 442, leetcodeLink: 'https://leetcode.com/problems/asteroid-collision/', title: 'Asteroid Collision', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #735. Asteroid Collision. Pattern 67: Simulation / Backtracking Helper.',
        examples: [{ input: 'See LeetCode #735', output: 'See LeetCode #735' }],
        constraints: ['See LeetCode problem #735 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 67: Simulation / Backtracking Helper']
    },
    { id: 443, leetcodeLink: 'https://leetcode.com/problems/sentence-similarity-ii/', title: 'Sentence Similarity II', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #737. Sentence Similarity II. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #737', output: 'See LeetCode #737' }],
        constraints: ['See LeetCode problem #737 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 444, leetcodeLink: 'https://leetcode.com/problems/delete-and-earn/', title: 'Delete and Earn', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #740. Delete and Earn. Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #740', output: 'See LeetCode #740' }],
        constraints: ['See LeetCode problem #740 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 30: Fibonacci Style']
    },
    { id: 445, leetcodeLink: 'https://leetcode.com/problems/prefix-and-suffix-search/', title: 'Prefix and Suffix Search', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 35, description: 'LeetCode #745. Prefix and Suffix Search. Pattern 94: Tries.',
        examples: [{ input: 'See LeetCode #745', output: 'See LeetCode #745' }],
        constraints: ['See LeetCode problem #745 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 94: Tries']
    },
    { id: 446, leetcodeLink: 'https://leetcode.com/problems/min-cost-climbing-stairs/', title: 'Min Cost Climbing Stairs', difficulty: 'Easy', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 76, timeEstimate: 15, description: 'LeetCode #746. Min Cost Climbing Stairs. Pattern 30: Fibonacci Style.',
        examples: [{ input: 'See LeetCode #746', output: 'See LeetCode #746' }],
        constraints: ['See LeetCode problem #746 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 30: Fibonacci Style']
    },
    { id: 447, leetcodeLink: 'https://leetcode.com/problems/employee-free-time/', title: 'Employee Free Time', difficulty: 'Hard', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 35, description: 'LeetCode #759. Employee Free Time. Pattern 53: Interval Merging/Scheduling.',
        examples: [{ input: 'See LeetCode #759', output: 'See LeetCode #759' }],
        constraints: ['See LeetCode problem #759 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 53: Interval Merging/Scheduling']
    },
    { id: 448, leetcodeLink: 'https://leetcode.com/problems/reorganize-string/', title: 'Reorganize String', difficulty: 'Medium', topics: ['Greedy', 'Heap', 'Priority Queue'], patterns: ['greedy', 'heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #767. Reorganize String. Pattern 45: Scheduling / Minimum Cost, Pattern 57: Task Scheduling.',
        examples: [{ input: 'See LeetCode #767', output: 'See LeetCode #767' }],
        constraints: ['See LeetCode problem #767 for full constraints'],
        hints: ['Think about Greedy / Heap patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 449, leetcodeLink: 'https://leetcode.com/problems/basic-calculator-iii/', title: 'Basic Calculator III', difficulty: 'Hard', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #772. Basic Calculator III. Pattern 66: Expression Evaluation.',
        examples: [{ input: 'See LeetCode #772', output: 'See LeetCode #772' }],
        constraints: ['See LeetCode problem #772 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 66: Expression Evaluation']
    },
    { id: 450, leetcodeLink: 'https://leetcode.com/problems/minimize-max-distance-to-gas-station/', title: 'Minimize Max Distance to Gas Station', difficulty: 'Hard', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 39, timeEstimate: 35, description: 'LeetCode #774. Minimize Max Distance to Gas Station. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #774', output: 'See LeetCode #774' }],
        constraints: ['See LeetCode problem #774 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 451, leetcodeLink: 'https://leetcode.com/problems/swim-in-rising-water/', title: 'Swim in Rising Water', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 35, description: 'LeetCode #778. Swim in Rising Water. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #778', output: 'See LeetCode #778' }],
        constraints: ['See LeetCode problem #778 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 452, leetcodeLink: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #787. Cheapest Flights Within K Stops. Pattern 24: Shortest Path (Bellman-Ford / BFS+K).',
        examples: [{ input: 'See LeetCode #787', output: 'See LeetCode #787' }],
        constraints: ['See LeetCode problem #787 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 24: Shortest Path (Bellman-Ford / BFS+K)']
    },
    { id: 453, leetcodeLink: 'https://leetcode.com/problems/rotate-string/', title: 'Rotate String', difficulty: 'Easy', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 66, timeEstimate: 15, description: 'LeetCode #796. Rotate String. Pattern 91: String Matching - Naive / KMP / Rabin-Karp.',
        examples: [{ input: 'See LeetCode #796', output: 'See LeetCode #796' }],
        constraints: ['See LeetCode problem #796 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 91: String Matching - Naive / KMP / Rabin-Karp']
    },
    { id: 454, leetcodeLink: 'https://leetcode.com/problems/find-eventual-safe-states/', title: 'Find Eventual Safe States', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #802. Find Eventual Safe States. Pattern 20: DFS - Cycle Detection.',
        examples: [{ input: 'See LeetCode #802', output: 'See LeetCode #802' }],
        constraints: ['See LeetCode problem #802 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 20: DFS - Cycle Detection']
    },
    { id: 455, leetcodeLink: 'https://leetcode.com/problems/bus-routes/', title: 'Bus Routes', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 35, description: 'LeetCode #815. Bus Routes. Pattern 29: Bidirectional BFS.',
        examples: [{ input: 'See LeetCode #815', output: 'See LeetCode #815' }],
        constraints: ['See LeetCode problem #815 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 29: Bidirectional BFS']
    },
    { id: 456, leetcodeLink: 'https://leetcode.com/problems/keys-and-rooms/', title: 'Keys and Rooms', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #841. Keys and Rooms. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #841', output: 'See LeetCode #841' }],
        constraints: ['See LeetCode problem #841 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 457, leetcodeLink: 'https://leetcode.com/problems/backspace-string-compare/', title: 'Backspace String Compare', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #844. Backspace String Compare. Pattern 5: String Comparison with  special characters.',
        examples: [{ input: 'See LeetCode #844', output: 'See LeetCode #844' }],
        constraints: ['See LeetCode problem #844 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 5: String Comparison with  special characters']
    },
    { id: 458, leetcodeLink: 'https://leetcode.com/problems/longest-mountain-in-array/', title: 'Longest Mountain in Array', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'LeetCode #845. Longest Mountain in Array. Pattern 82: Prefix/Suffix Products.',
        examples: [{ input: 'See LeetCode #845', output: 'See LeetCode #845' }],
        constraints: ['See LeetCode problem #845 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 82: Prefix/Suffix Products']
    },
    { id: 459, leetcodeLink: 'https://leetcode.com/problems/peak-index-in-a-mountain-array/', title: 'Peak Index in a Mountain Array', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #852. Peak Index in a Mountain Array. Pattern 60: Find Min/Max in Rotated Sorted Array.',
        examples: [{ input: 'See LeetCode #852', output: 'See LeetCode #852' }],
        constraints: ['See LeetCode problem #852 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 60: Find Min/Max in Rotated Sorted Array']
    },
    { id: 460, leetcodeLink: 'https://leetcode.com/problems/minimum-cost-to-hire-k-workers/', title: 'Minimum Cost to Hire K Workers', difficulty: 'Hard', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 35, description: 'LeetCode #857. Minimum Cost to Hire K Workers. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #857', output: 'See LeetCode #857' }],
        constraints: ['See LeetCode problem #857 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 461, leetcodeLink: 'https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/', title: 'Shortest Subarray with Sum at Least K', difficulty: 'Hard', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 27, timeEstimate: 35, description: 'LeetCode #862. Shortest Subarray with Sum at Least K. Pattern 10: Monotonic Queue for Max/Min.',
        examples: [{ input: 'See LeetCode #862', output: 'See LeetCode #862' }],
        constraints: ['See LeetCode problem #862 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 10: Monotonic Queue for Max/Min']
    },
    { id: 462, leetcodeLink: 'https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/', title: 'All Nodes Distance K in Binary Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #863. All Nodes Distance K in Binary Tree. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #863', output: 'See LeetCode #863' }],
        constraints: ['See LeetCode problem #863 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 463, leetcodeLink: 'https://leetcode.com/problems/transpose-matrix/', title: 'Transpose Matrix', difficulty: 'Easy', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 77, timeEstimate: 15, description: 'LeetCode #867. Transpose Matrix. Pattern 79: In-place Rotation.',
        examples: [{ input: 'See LeetCode #867', output: 'See LeetCode #867' }],
        constraints: ['See LeetCode problem #867 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 79: In-place Rotation']
    },
    { id: 464, leetcodeLink: 'https://leetcode.com/problems/koko-eating-bananas/', title: 'Koko Eating Bananas', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #875. Koko Eating Bananas. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #875', output: 'See LeetCode #875' }],
        constraints: ['See LeetCode problem #875 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 465, leetcodeLink: 'https://leetcode.com/problems/boats-to-save-people/', title: 'Boats to Save People', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #881. Boats to Save People. Pattern 1: Converging.',
        examples: [{ input: 'See LeetCode #881', output: 'See LeetCode #881' }],
        constraints: ['See LeetCode problem #881 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 1: Converging']
    },
    { id: 466, leetcodeLink: 'https://leetcode.com/problems/spiral-matrix-iii/', title: 'Spiral Matrix III', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'LeetCode #885. Spiral Matrix III. Pattern 80: Spiral Traversal.',
        examples: [{ input: 'See LeetCode #885', output: 'See LeetCode #885' }],
        constraints: ['See LeetCode problem #885 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 80: Spiral Traversal']
    },
    { id: 467, leetcodeLink: 'https://leetcode.com/problems/rle-iterator/', title: 'RLE Iterator', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #900. RLE Iterator. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #900', output: 'See LeetCode #900' }],
        constraints: ['See LeetCode problem #900 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 468, leetcodeLink: 'https://leetcode.com/problems/online-stock-span/', title: 'Online Stock Span', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #901. Online Stock Span. Pattern 65: Monotonic Stack, Pattern 68: Min Stack Design.',
        examples: [{ input: 'See LeetCode #901', output: 'See LeetCode #901' }],
        constraints: ['See LeetCode problem #901 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 469, leetcodeLink: 'https://leetcode.com/problems/fruit-into-baskets/', title: 'Fruit Into Baskets', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #904. Fruit Into Baskets. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #904', output: 'See LeetCode #904' }],
        constraints: ['See LeetCode problem #904 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 470, leetcodeLink: 'https://leetcode.com/problems/sort-array-by-parity/', title: 'Sort Array By Parity', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #905. Sort Array By Parity. Pattern 4: In-place Array Modification.',
        examples: [{ input: 'See LeetCode #905', output: 'See LeetCode #905' }],
        constraints: ['See LeetCode problem #905 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 4: In-place Array Modification']
    },
    { id: 471, leetcodeLink: 'https://leetcode.com/problems/sum-of-subarray-minimums/', title: 'Sum of Subarray Minimums', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #907. Sum of Subarray Minimums. Pattern 65: Monotonic Stack.',
        examples: [{ input: 'See LeetCode #907', output: 'See LeetCode #907' }],
        constraints: ['See LeetCode problem #907 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 472, leetcodeLink: 'https://leetcode.com/problems/maximum-sum-circular-subarray/', title: 'Maximum Sum Circular Subarray', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #918. Maximum Sum Circular Subarray. Pattern 31: Kadane\'s Algorithm for Max/Min Subarray.',
        examples: [{ input: 'See LeetCode #918', output: 'See LeetCode #918' }],
        constraints: ['See LeetCode problem #918 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 31: Kadane\'s Algorithm for Max/Min Subarray']
    },
    { id: 473, leetcodeLink: 'https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/', title: 'Minimum Add to Make Parentheses Valid', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #921. Minimum Add to Make Parentheses Valid. Pattern 64: Valid Parentheses Matching.',
        examples: [{ input: 'See LeetCode #921', output: 'See LeetCode #921' }],
        constraints: ['See LeetCode problem #921 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 64: Valid Parentheses Matching']
    },
    { id: 474, leetcodeLink: 'https://leetcode.com/problems/minimum-falling-path-sum/', title: 'Minimum Falling Path Sum', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #931. Minimum Falling Path Sum. Pattern 37: Unique Paths on Grid.',
        examples: [{ input: 'See LeetCode #931', output: 'See LeetCode #931' }],
        constraints: ['See LeetCode problem #931 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 37: Unique Paths on Grid']
    },
    { id: 475, leetcodeLink: 'https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/', title: 'Most Stones Removed with Same Row or Column', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 47, timeEstimate: 25, description: 'LeetCode #947. Most Stones Removed with Same Row or Column. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #947', output: 'See LeetCode #947' }],
        constraints: ['See LeetCode problem #947 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 476, leetcodeLink: 'https://leetcode.com/problems/largest-component-size-by-common-factor/', title: 'Largest Component Size by Common Factor', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #952. Largest Component Size by Common Factor. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #952', output: 'See LeetCode #952' }],
        constraints: ['See LeetCode problem #952 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 477, leetcodeLink: 'https://leetcode.com/problems/regions-cut-by-slashes/', title: 'Regions Cut By Slashes', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #959. Regions Cut By Slashes. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #959', output: 'See LeetCode #959' }],
        constraints: ['See LeetCode problem #959 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 478, leetcodeLink: 'https://leetcode.com/problems/maximum-width-ramp/', title: 'Maximum Width Ramp', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #962. Maximum Width Ramp. Pattern 65: Monotonic Stack.',
        examples: [{ input: 'See LeetCode #962', output: 'See LeetCode #962' }],
        constraints: ['See LeetCode problem #962 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 479, leetcodeLink: 'https://leetcode.com/problems/k-closest-points-to-origin/', title: 'K Closest Points to Origin', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #973. K Closest Points to Origin. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #973', output: 'See LeetCode #973' }],
        constraints: ['See LeetCode problem #973 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 480, leetcodeLink: 'https://leetcode.com/problems/squares-of-a-sorted-array/', title: 'Squares of a Sorted Array', difficulty: 'Easy', topics: ['Arrays', 'Matrix', 'Two Pointers'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum', 'two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #977. Squares of a Sorted Array. Pattern 1: Converging, Pattern 84: In-place from End.',
        examples: [{ input: 'See LeetCode #977', output: 'See LeetCode #977' }],
        constraints: ['See LeetCode problem #977 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 1: Converging']
    },
    { id: 481, leetcodeLink: 'https://leetcode.com/problems/time-based-key-value-store/', title: 'Time Based Key-Value Store', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #981. Time Based Key-Value Store. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #981', output: 'See LeetCode #981' }],
        constraints: ['See LeetCode problem #981 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 482, leetcodeLink: 'https://leetcode.com/problems/interval-list-intersections/', title: 'Interval List Intersections', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #986. Interval List Intersections. Pattern 53: Interval Merging/Scheduling.',
        examples: [{ input: 'See LeetCode #986', output: 'See LeetCode #986' }],
        constraints: ['See LeetCode problem #986 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 53: Interval Merging/Scheduling']
    },
    { id: 483, leetcodeLink: 'https://leetcode.com/problems/smallest-string-starting-from-leaf/', title: 'Smallest String Starting From Leaf', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'LeetCode #988. Smallest String Starting From Leaf. Pattern 13: Recursive Preorder Traversal.',
        examples: [{ input: 'See LeetCode #988', output: 'See LeetCode #988' }],
        constraints: ['See LeetCode problem #988 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 13: Recursive Preorder Traversal']
    },
    { id: 484, leetcodeLink: 'https://leetcode.com/problems/add-to-array-form-of-integer/', title: 'Add to Array-Form of Integer', difficulty: 'Easy', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 79, timeEstimate: 15, description: 'LeetCode #989. Add to Array-Form of Integer. Pattern 83: Plus One.',
        examples: [{ input: 'See LeetCode #989', output: 'See LeetCode #989' }],
        constraints: ['See LeetCode problem #989 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 83: Plus One']
    },
    { id: 485, leetcodeLink: 'https://leetcode.com/problems/rotting-oranges/', title: 'Rotting Oranges', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon', 'meta'], frequency: 'high', acceptance: 54, timeEstimate: 25, description: 'LeetCode #994. Rotting Oranges. Pattern 19: BFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #994', output: 'See LeetCode #994' }],
        constraints: ['See LeetCode problem #994 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 19: BFS - Connected Components / Island Counting']
    },
    { id: 486, leetcodeLink: 'https://leetcode.com/problems/max-consecutive-ones-iii/', title: 'Max Consecutive Ones III', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #1004. Max Consecutive Ones III. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #1004', output: 'See LeetCode #1004' }],
        constraints: ['See LeetCode problem #1004 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 487, leetcodeLink: 'https://leetcode.com/problems/capacity-to-ship-packages-6-within-d-days/', title: 'Capacity To Ship Packages 6  Within D Days', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #1011. Capacity To Ship Packages 6  Within D Days. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #1011', output: 'See LeetCode #1011' }],
        constraints: ['See LeetCode problem #1011 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 488, leetcodeLink: 'https://leetcode.com/problems/number-of-enclaves/', title: 'Number of Enclaves', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #1020. Number of Enclaves. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #1020', output: 'See LeetCode #1020' }],
        constraints: ['See LeetCode problem #1020 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 489, leetcodeLink: 'https://leetcode.com/problems/two-city-scheduling/', title: 'Two City Scheduling', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #1029. Two City Scheduling. Pattern 58: Sorting Based.',
        examples: [{ input: 'See LeetCode #1029', output: 'See LeetCode #1029' }],
        constraints: ['See LeetCode problem #1029 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 58: Sorting Based']
    },
    { id: 490, leetcodeLink: 'https://leetcode.com/problems/last-stone-weight/', title: 'Last Stone Weight', difficulty: 'Easy', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 76, timeEstimate: 15, description: 'LeetCode #1046. Last Stone Weight. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #1046', output: 'See LeetCode #1046' }],
        constraints: ['See LeetCode problem #1046 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 491, leetcodeLink: 'https://leetcode.com/problems/distant-barcodes/', title: 'Distant Barcodes', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #1054. Distant Barcodes. Pattern 57: Task Scheduling.',
        examples: [{ input: 'See LeetCode #1054', output: 'See LeetCode #1054' }],
        constraints: ['See LeetCode problem #1054 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 57: Task Scheduling']
    },
    { id: 492, leetcodeLink: 'https://leetcode.com/problems/all-paths-from-source-lead-to-destination/', title: 'All Paths from Source Lead to Destination', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #1059. All Paths from Source Lead to Destination. Pattern 20: DFS - Cycle Detection.',
        examples: [{ input: 'See LeetCode #1059', output: 'See LeetCode #1059' }],
        constraints: ['See LeetCode problem #1059 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 20: DFS - Cycle Detection']
    },
    { id: 493, leetcodeLink: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', title: 'Shortest Path in Binary Matrix', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #1091. Shortest Path in Binary Matrix. Pattern 19: BFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #1091', output: 'See LeetCode #1091' }],
        constraints: ['See LeetCode problem #1091 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 19: BFS - Connected Components / Island Counting']
    },
    { id: 494, leetcodeLink: 'https://leetcode.com/problems/shortest-common-supersequence/', title: 'Shortest Common Supersequence', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #1092. Shortest Common Supersequence. Pattern 35: Longest Common Subsequence - LCS.',
        examples: [{ input: 'See LeetCode #1092', output: 'See LeetCode #1092' }],
        constraints: ['See LeetCode problem #1092 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 35: Longest Common Subsequence - LCS']
    },
    { id: 495, leetcodeLink: 'https://leetcode.com/problems/find-in-mountain-array/', title: 'Find in Mountain Array', difficulty: 'Hard', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 35, description: 'LeetCode #1095. Find in Mountain Array. Pattern 60: Find Min/Max in Rotated Sorted Array.',
        examples: [{ input: 'See LeetCode #1095', output: 'See LeetCode #1095' }],
        constraints: ['See LeetCode problem #1095 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 60: Find Min/Max in Rotated Sorted Array']
    },
    { id: 496, leetcodeLink: 'https://leetcode.com/problems/the-earliest-moment-when-everyone-become-friends/', title: 'The Earliest Moment When Everyone Become Friends', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #1101. The Earliest Moment When Everyone Become Friends. Pattern 25: Union-Find.',
        examples: [{ input: 'See LeetCode #1101', output: 'See LeetCode #1101' }],
        constraints: ['See LeetCode problem #1101 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 25: Union-Find']
    },
    { id: 497, leetcodeLink: 'https://leetcode.com/problems/delete-nodes-and-return-forest/', title: 'Delete Nodes And Return Forest', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #1110. Delete Nodes And Return Forest. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #1110', output: 'See LeetCode #1110' }],
        constraints: ['See LeetCode problem #1110 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 498, leetcodeLink: 'https://leetcode.com/problems/shortest-path-with-alternating-colors/', title: 'Shortest Path with Alternating Colors', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #1129. Shortest Path with Alternating Colors. Pattern 24: Shortest Path (Bellman-Ford / BFS+K).',
        examples: [{ input: 'See LeetCode #1129', output: 'See LeetCode #1129' }],
        constraints: ['See LeetCode problem #1129 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 24: Shortest Path (Bellman-Ford / BFS+K)']
    },
    { id: 499, leetcodeLink: 'https://leetcode.com/problems/connecting-cities-with-minimum-cost/', title: 'Connecting Cities With Minimum Cost', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #1135. Connecting Cities With Minimum Cost. Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap).',
        examples: [{ input: 'See LeetCode #1135', output: 'See LeetCode #1135' }],
        constraints: ['See LeetCode problem #1135 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap)']
    },
    { id: 500, leetcodeLink: 'https://leetcode.com/problems/parallel-courses/', title: 'Parallel Courses', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #1136. Parallel Courses. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #1136', output: 'See LeetCode #1136' }],
        constraints: ['See LeetCode problem #1136 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 501, leetcodeLink: 'https://leetcode.com/problems/snapshot-array/', title: 'Snapshot Array', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #1146. Snapshot Array. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #1146', output: 'See LeetCode #1146' }],
        constraints: ['See LeetCode problem #1146 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 502, leetcodeLink: 'https://leetcode.com/problems/maximum-level-sum-of-a-binary-tree/', title: 'Maximum Level Sum of a Binary Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #1161. Maximum Level Sum of a Binary Tree. Pattern 12: Level Order Traversal.',
        examples: [{ input: 'See LeetCode #1161', output: 'See LeetCode #1161' }],
        constraints: ['See LeetCode problem #1161 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 12: Level Order Traversal']
    },
    { id: 503, leetcodeLink: 'https://leetcode.com/problems/optimize-water-distribution-in-a-village/', title: 'Optimize Water Distribution in a Village', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 33, timeEstimate: 35, description: 'LeetCode #1168. Optimize Water Distribution in a Village. Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap).',
        examples: [{ input: 'See LeetCode #1168', output: 'See LeetCode #1168' }],
        constraints: ['See LeetCode problem #1168 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap)']
    },
    { id: 504, leetcodeLink: 'https://leetcode.com/problems/critical-connections-in-a-network/', title: 'Critical Connections in a Network', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #1192. Critical Connections in a Network. Pattern 26: Strongly Connected Components (Kosaraju / Tarjan), Pattern 27: Bridges & Articulation Points (Tarjan low-link).',
        examples: [{ input: 'See LeetCode #1192', output: 'See LeetCode #1192' }],
        constraints: ['See LeetCode problem #1192 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 26: Strongly Connected Components (Kosaraju / Tarjan)']
    },
    { id: 505, leetcodeLink: 'https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/', title: 'Minimum Remove to Make Valid Parentheses', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #1249. Minimum Remove to Make Valid Parentheses. Pattern 64: Valid Parentheses Matching.',
        examples: [{ input: 'See LeetCode #1249', output: 'See LeetCode #1249' }],
        constraints: ['See LeetCode problem #1249 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 64: Valid Parentheses Matching']
    },
    { id: 506, leetcodeLink: 'https://leetcode.com/problems/number-of-closed-islands/', title: 'Number of Closed Islands', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #1254. Number of Closed Islands. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #1254', output: 'See LeetCode #1254' }],
        constraints: ['See LeetCode problem #1254 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 507, leetcodeLink: 'https://leetcode.com/problems/count-square-submatrices-with-all-ones/', title: 'Count Square Submatrices with All Ones', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #1277. Count Square Submatrices with All Ones. Pattern 37: Unique Paths on Grid.',
        examples: [{ input: 'See LeetCode #1277', output: 'See LeetCode #1277' }],
        constraints: ['See LeetCode problem #1277 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 37: Unique Paths on Grid']
    },
    { id: 508, leetcodeLink: 'https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/', title: 'Minimum Insertion Steps to Make a String Palindrome', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #1312. Minimum Insertion Steps to Make a String Palindrome. Pattern 35: Longest Common Subsequence - LCS.',
        examples: [{ input: 'See LeetCode #1312', output: 'See LeetCode #1312' }],
        constraints: ['See LeetCode problem #1312 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 35: Longest Common Subsequence - LCS']
    },
    { id: 509, leetcodeLink: 'https://leetcode.com/problems/tweet-counts-per-frequency/', title: 'Tweet Counts Per Frequency', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 48, timeEstimate: 25, description: 'LeetCode #1348. Tweet Counts Per Frequency. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #1348', output: 'See LeetCode #1348' }],
        constraints: ['See LeetCode problem #1348 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 510, leetcodeLink: 'https://leetcode.com/problems/product-of-the-last-k-numbers/', title: 'Product of the Last K Numbers', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #1352. Product of the Last K Numbers. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #1352', output: 'See LeetCode #1352' }],
        constraints: ['See LeetCode problem #1352 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 511, leetcodeLink: 'https://leetcode.com/problems/design-a-stack-with-increment-operation/', title: 'Design a Stack With Increment Operation', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #1381. Design a Stack With Increment Operation. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #1381', output: 'See LeetCode #1381' }],
        constraints: ['See LeetCode problem #1381 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 512, leetcodeLink: 'https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/', title: 'Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #1438. Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #1438', output: 'See LeetCode #1438' }],
        constraints: ['See LeetCode problem #1438 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 513, leetcodeLink: 'https://leetcode.com/problems/count-triplets-that-can-form-two-arrays-of-equal-xor/', title: 'Count Triplets That Can Form Two Arrays of Equal XOR', difficulty: 'Medium', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #1442. Count Triplets That Can Form Two Arrays of Equal XOR. Pattern 72: Bitwise DP - Counting Bits Optimization.',
        examples: [{ input: 'See LeetCode #1442', output: 'See LeetCode #1442' }],
        constraints: ['See LeetCode problem #1442 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 72: Bitwise DP - Counting Bits Optimization']
    },
    { id: 514, leetcodeLink: 'https://leetcode.com/problems/pseudo-palindromic-paths-in-a-binary-tree/', title: 'Pseudo-Palindromic Paths in a Binary Tree', difficulty: 'Easy', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 67, timeEstimate: 15, description: 'LeetCode #1457. Pseudo-Palindromic Paths in a Binary Tree. Pattern 52: Palindrome Partitioning.',
        examples: [{ input: 'See LeetCode #1457', output: 'See LeetCode #1457' }],
        constraints: ['See LeetCode problem #1457 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 52: Palindrome Partitioning']
    },
    { id: 515, leetcodeLink: 'https://leetcode.com/problems/final-prices-with-a-special-discount-in-a-shop/', title: 'Final Prices With a Special Discount in a Shop', difficulty: 'Easy', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 70, timeEstimate: 15, description: 'LeetCode #1475. Final Prices With a Special Discount in a Shop. Pattern 65: Monotonic Stack.',
        examples: [{ input: 'See LeetCode #1475', output: 'See LeetCode #1475' }],
        constraints: ['See LeetCode problem #1475 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 516, leetcodeLink: 'https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/', title: 'Minimum Number of Days to Make m Bouquets', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #1482. Minimum Number of Days to Make m Bouquets. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #1482', output: 'See LeetCode #1482' }],
        constraints: ['See LeetCode problem #1482 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 517, leetcodeLink: 'https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/', title: 'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 34, timeEstimate: 35, description: 'LeetCode #1489. Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree. Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap).',
        examples: [{ input: 'See LeetCode #1489', output: 'See LeetCode #1489' }],
        constraints: ['See LeetCode problem #1489 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 28: Minimum Spanning Tree (Kruskal / Prim / DSU + heap)']
    },
    { id: 518, leetcodeLink: 'https://leetcode.com/problems/clone-n-ary-tree/', title: 'Clone N-ary Tree', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #1490. Clone N-ary Tree. Pattern 22: Deep Copy / Cloning.',
        examples: [{ input: 'See LeetCode #1490', output: 'See LeetCode #1490' }],
        constraints: ['See LeetCode problem #1490 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 22: Deep Copy / Cloning']
    },
    { id: 519, leetcodeLink: 'https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/', title: 'Longest Subarray of 1\'s After Deleting One Element', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #1493. Longest Subarray of 1\'s After Deleting One Element. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #1493', output: 'See LeetCode #1493' }],
        constraints: ['See LeetCode problem #1493 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 520, leetcodeLink: 'https://leetcode.com/problems/parallel-courses-ii/', title: 'Parallel Courses II', difficulty: 'Hard', topics: ['Bit Manipulation'], patterns: ['bit-manipulation'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 39, timeEstimate: 35, description: 'LeetCode #1494. Parallel Courses II. Pattern 72: Bitwise DP - Counting Bits Optimization.',
        examples: [{ input: 'See LeetCode #1494', output: 'See LeetCode #1494' }],
        constraints: ['See LeetCode problem #1494 for full constraints'],
        hints: ['Think about Bit Manipulation patterns', 'Consider Pattern 72: Bitwise DP - Counting Bits Optimization']
    },
    { id: 521, leetcodeLink: 'https://leetcode.com/problems/path-with-maximum-probability/', title: 'Path with Maximum Probability', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #1514. Path with Maximum Probability. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #1514', output: 'See LeetCode #1514' }],
        constraints: ['See LeetCode problem #1514 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 522, leetcodeLink: 'https://leetcode.com/problems/kth-missing-positive-number/', title: 'Kth Missing Positive Number', difficulty: 'Easy', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 74, timeEstimate: 15, description: 'LeetCode #1539. Kth Missing Positive Number. Pattern 59: On Sorted Array/List.',
        examples: [{ input: 'See LeetCode #1539', output: 'See LeetCode #1539' }],
        constraints: ['See LeetCode problem #1539 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 59: On Sorted Array/List']
    },
    { id: 523, leetcodeLink: 'https://leetcode.com/problems/crawler-log-folder/', title: 'Crawler Log Folder', difficulty: 'Easy', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 73, timeEstimate: 15, description: 'LeetCode #1598. Crawler Log Folder. Pattern 5: String Comparison with  special characters.',
        examples: [{ input: 'See LeetCode #1598', output: 'See LeetCode #1598' }],
        constraints: ['See LeetCode problem #1598 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 5: String Comparison with  special characters']
    },
    { id: 524, leetcodeLink: 'https://leetcode.com/problems/path-with-minimum-effort/', title: 'Path With Minimum Effort', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 51, timeEstimate: 25, description: 'LeetCode #1631. Path With Minimum Effort. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #1631', output: 'See LeetCode #1631' }],
        constraints: ['See LeetCode problem #1631 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 525, leetcodeLink: 'https://leetcode.com/problems/furthest-building-you-can-reach/', title: 'Furthest Building You Can Reach', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #1642. Furthest Building You Can Reach. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #1642', output: 'See LeetCode #1642' }],
        constraints: ['See LeetCode problem #1642 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 526, leetcodeLink: 'https://leetcode.com/problems/minimum-operations-to-reduce-x-to-zero/', title: 'Minimum Operations to Reduce X to Zero', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #1658. Minimum Operations to Reduce X to Zero. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #1658', output: 'See LeetCode #1658' }],
        constraints: ['See LeetCode problem #1658 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 527, leetcodeLink: 'https://leetcode.com/problems/minimum-number-of-removals-to-make-mountain-array/', title: 'Minimum Number of Removals to Make Mountain Array', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 36, timeEstimate: 35, description: 'LeetCode #1671. Minimum Number of Removals to Make Mountain Array. Pattern 40: Longest Increasing Subsequence.',
        examples: [{ input: 'See LeetCode #1671', output: 'See LeetCode #1671' }],
        constraints: ['See LeetCode problem #1671 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 40: Longest Increasing Subsequence']
    },
    { id: 528, leetcodeLink: 'https://leetcode.com/problems/find-the-most-competitive-subsequence/', title: 'Find the Most Competitive Subsequence', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #1673. Find the Most Competitive Subsequence. Pattern 65: Monotonic Stack.',
        examples: [{ input: 'See LeetCode #1673', output: 'See LeetCode #1673' }],
        constraints: ['See LeetCode problem #1673 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 65: Monotonic Stack']
    },
    { id: 529, leetcodeLink: 'https://leetcode.com/problems/jump-game-vi/', title: 'Jump Game VI', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #1696. Jump Game VI. Pattern 10: Monotonic Queue for Max/Min.',
        examples: [{ input: 'See LeetCode #1696', output: 'See LeetCode #1696' }],
        constraints: ['See LeetCode problem #1696 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 10: Monotonic Queue for Max/Min']
    },
    { id: 530, leetcodeLink: 'https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/', title: 'Maximum Absolute Sum of Any Subarray', difficulty: 'Medium', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 49, timeEstimate: 25, description: 'LeetCode #1749. Maximum Absolute Sum of Any Subarray. Pattern 31: Kadane\'s Algorithm for Max/Min Subarray.',
        examples: [{ input: 'See LeetCode #1749', output: 'See LeetCode #1749' }],
        constraints: ['See LeetCode problem #1749 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 31: Kadane\'s Algorithm for Max/Min Subarray']
    },
    { id: 531, leetcodeLink: 'https://leetcode.com/problems/design-most-recently-used-queue/', title: 'Design Most Recently Used Queue', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #1756. Design Most Recently Used Queue. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #1756', output: 'See LeetCode #1756' }],
        constraints: ['See LeetCode problem #1756 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 532, leetcodeLink: 'https://leetcode.com/problems/minimum-limit-of-balls-in-a-bag/', title: 'Minimum Limit of Balls in a Bag', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 40, timeEstimate: 25, description: 'LeetCode #1760. Minimum Limit of Balls in a Bag. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #1760', output: 'See LeetCode #1760' }],
        constraints: ['See LeetCode problem #1760 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 533, leetcodeLink: 'https://leetcode.com/problems/maximum-average-pass-ratio/', title: 'Maximum Average Pass Ratio', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #1792. Maximum Average Pass Ratio. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #1792', output: 'See LeetCode #1792' }],
        constraints: ['See LeetCode problem #1792 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 534, leetcodeLink: 'https://leetcode.com/problems/finding-mk-average/', title: 'Finding MK Average', difficulty: 'Hard', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 35, description: 'LeetCode #1825. Finding MK Average. Pattern 43: Two Heaps for Median Finding.',
        examples: [{ input: 'See LeetCode #1825', output: 'See LeetCode #1825' }],
        constraints: ['See LeetCode problem #1825 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 43: Two Heaps for Median Finding']
    },
    { id: 535, leetcodeLink: 'https://leetcode.com/problems/single-threaded-cpu/', title: 'Single-Threaded CPU', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #1834. Single-Threaded CPU. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #1834', output: 'See LeetCode #1834' }],
        constraints: ['See LeetCode problem #1834 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 536, leetcodeLink: 'https://leetcode.com/problems/frequency-of-the-most-frequent-element/', title: 'Frequency of the Most Frequent Element', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #1838. Frequency of the Most Frequent Element. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #1838', output: 'See LeetCode #1838' }],
        constraints: ['See LeetCode problem #1838 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 537, leetcodeLink: 'https://leetcode.com/problems/largest-color-value-in-a-directed-graph/', title: 'Largest Color Value in a Directed Graph', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 35, description: 'LeetCode #1857. Largest Color Value in a Directed Graph. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #1857', output: 'See LeetCode #1857' }],
        constraints: ['See LeetCode problem #1857 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 538, leetcodeLink: 'https://leetcode.com/problems/count-sub-islands/', title: 'Count Sub Islands', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 45, timeEstimate: 25, description: 'LeetCode #1905. Count Sub Islands. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #1905', output: 'See LeetCode #1905' }],
        constraints: ['See LeetCode problem #1905 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 539, leetcodeLink: 'https://leetcode.com/problems/the-number-of-the-smallest-unoccupied-chair/', title: 'The Number of the Smallest Unoccupied Chair', difficulty: 'Medium', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #1942. The Number of the Smallest Unoccupied Chair. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #1942', output: 'See LeetCode #1942' }],
        constraints: ['See LeetCode problem #1942 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 540, leetcodeLink: 'https://leetcode.com/problems/minimum-number-of-swaps-to-make-the-string-balanced/', title: 'Minimum Number of Swaps to Make the String Balanced', difficulty: 'Medium', topics: ['Stack'], patterns: ['stack'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #1963. Minimum Number of Swaps to Make the String Balanced. Pattern 64: Valid Parentheses Matching.',
        examples: [{ input: 'See LeetCode #1963', output: 'See LeetCode #1963' }],
        constraints: ['See LeetCode problem #1963 for full constraints'],
        hints: ['Think about Stack patterns', 'Consider Pattern 64: Valid Parentheses Matching']
    },
    { id: 541, leetcodeLink: 'https://leetcode.com/problems/number-of-ways-to-arrive-at-destination/', title: 'Number of Ways to Arrive at Destination', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #1976. Number of Ways to Arrive at Destination. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #1976', output: 'See LeetCode #1976' }],
        constraints: ['See LeetCode problem #1976 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 542, leetcodeLink: 'https://leetcode.com/problems/detect-squares/', title: 'Detect Squares', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 53, timeEstimate: 25, description: 'LeetCode #2013. Detect Squares. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #2013', output: 'See LeetCode #2013' }],
        constraints: ['See LeetCode problem #2013 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 543, leetcodeLink: 'https://leetcode.com/problems/check-if-word-can-be-placed-in-crossword/', title: 'Check if Word Can Be Placed In Crossword', difficulty: 'Medium', topics: ['Backtracking', 'Recursion'], patterns: ['backtracking'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #2018. Check if Word Can Be Placed In Crossword. Pattern 50: Word Search / Path Finding in Grid.',
        examples: [{ input: 'See LeetCode #2018', output: 'See LeetCode #2018' }],
        constraints: ['See LeetCode problem #2018 for full constraints'],
        hints: ['Think about Backtracking / Recursion patterns', 'Consider Pattern 50: Word Search / Path Finding in Grid']
    },
    { id: 544, leetcodeLink: 'https://leetcode.com/problems/stock-price-fluctuation/', title: 'Stock Price Fluctuation', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #2034. Stock Price Fluctuation. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #2034', output: 'See LeetCode #2034' }],
        constraints: ['See LeetCode problem #2034 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 545, leetcodeLink: 'https://leetcode.com/problems/second-minimum-time-to-reach-destination/', title: 'Second Minimum Time to Reach Destination', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 30, timeEstimate: 35, description: 'LeetCode #2045. Second Minimum Time to Reach Destination. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #2045', output: 'See LeetCode #2045' }],
        constraints: ['See LeetCode problem #2045 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 546, leetcodeLink: 'https://leetcode.com/problems/parallel-courses-iii/', title: 'Parallel Courses III', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'LeetCode #2050. Parallel Courses III. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #2050', output: 'See LeetCode #2050' }],
        constraints: ['See LeetCode problem #2050 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 547, leetcodeLink: 'https://leetcode.com/problems/minimized-maximum-of-products-distributed-to-any-store/', title: 'Minimized Maximum of Products Distributed to Any Store', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 44, timeEstimate: 25, description: 'LeetCode #2064. Minimized Maximum of Products Distributed to Any Store. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #2064', output: 'See LeetCode #2064' }],
        constraints: ['See LeetCode problem #2064 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 548, leetcodeLink: 'https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/', title: 'Delete the Middle Node of a Linked List', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #2095. Delete the Middle Node of a Linked List. Pattern 3: Fixed Separation.',
        examples: [{ input: 'See LeetCode #2095', output: 'See LeetCode #2095' }],
        constraints: ['See LeetCode problem #2095 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 3: Fixed Separation']
    },
    { id: 549, leetcodeLink: 'https://leetcode.com/problems/detonate-the-maximum-bombs/', title: 'Detonate the Maximum Bombs', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #2101. Detonate the Maximum Bombs. Pattern 18: DFS - Connected Components / Island Counting.',
        examples: [{ input: 'See LeetCode #2101', output: 'See LeetCode #2101' }],
        constraints: ['See LeetCode problem #2101 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 18: DFS - Connected Components / Island Counting']
    },
    { id: 550, leetcodeLink: 'https://leetcode.com/problems/find-all-possible-recipes-from-given-supplies/', title: 'Find All Possible Recipes from Given Supplies', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 55, timeEstimate: 25, description: 'LeetCode #2115. Find All Possible Recipes from Given Supplies. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #2115', output: 'See LeetCode #2115' }],
        constraints: ['See LeetCode problem #2115 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 551, leetcodeLink: 'https://leetcode.com/problems/maximum-employees-to-be-invited-to-a-meeting/', title: 'Maximum Employees to Be Invited to a Meeting', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 32, timeEstimate: 35, description: 'LeetCode #2127. Maximum Employees to Be Invited to a Meeting. Pattern 26: Strongly Connected Components (Kosaraju / Tarjan).',
        examples: [{ input: 'See LeetCode #2127', output: 'See LeetCode #2127' }],
        constraints: ['See LeetCode problem #2127 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 26: Strongly Connected Components (Kosaraju / Tarjan)']
    },
    { id: 552, leetcodeLink: 'https://leetcode.com/problems/maximize-the-topmost-element-after-k-moves/', title: 'Maximize the Topmost Element After K Moves', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #2202. Maximize the Topmost Element After K Moves. Pattern 56: Gas Station Circuit.',
        examples: [{ input: 'See LeetCode #2202', output: 'See LeetCode #2202' }],
        constraints: ['See LeetCode problem #2202 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 56: Gas Station Circuit']
    },
    { id: 553, leetcodeLink: 'https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths/', title: 'Minimum Weighted Subgraph With the Required Paths', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 28, timeEstimate: 35, description: 'LeetCode #2203. Minimum Weighted Subgraph With the Required Paths. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #2203', output: 'See LeetCode #2203' }],
        constraints: ['See LeetCode problem #2203 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 554, leetcodeLink: 'https://leetcode.com/problems/maximum-candies-allocated-to-k-children/', title: 'Maximum Candies Allocated to K Children', difficulty: 'Medium', topics: ['Binary Search'], patterns: ['binary-search'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #2226. Maximum Candies Allocated to K Children. Pattern 61: On Answer / Condition Function.',
        examples: [{ input: 'See LeetCode #2226', output: 'See LeetCode #2226' }],
        constraints: ['See LeetCode problem #2226 for full constraints'],
        hints: ['Think about Binary Search patterns', 'Consider Pattern 61: On Answer / Condition Function']
    },
    { id: 555, leetcodeLink: 'https://leetcode.com/problems/minimum-obstacle-removal-to-reach-corner/', title: 'Minimum Obstacle Removal to Reach Corner', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 35, timeEstimate: 35, description: 'LeetCode #2290. Minimum Obstacle Removal to Reach Corner. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #2290', output: 'See LeetCode #2290' }],
        constraints: ['See LeetCode problem #2290 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 556, leetcodeLink: 'https://leetcode.com/problems/design-a-text-editor/', title: 'Design a Text Editor', difficulty: 'Hard', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 35, description: 'LeetCode #2296. Design a Text Editor. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #2296', output: 'See LeetCode #2296' }],
        constraints: ['See LeetCode problem #2296 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 557, leetcodeLink: 'https://leetcode.com/problems/maximum-score-of-spliced-array/', title: 'Maximum Score Of Spliced Array', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 26, timeEstimate: 35, description: 'LeetCode #2321. Maximum Score Of Spliced Array. Pattern 31: Kadane\'s Algorithm for Max/Min Subarray.',
        examples: [{ input: 'See LeetCode #2321', output: 'See LeetCode #2321' }],
        constraints: ['See LeetCode problem #2321 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 31: Kadane\'s Algorithm for Max/Min Subarray']
    },
    { id: 558, leetcodeLink: 'https://leetcode.com/problems/spiral-matrix-iv/', title: 'Spiral Matrix IV', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #2326. Spiral Matrix IV. Pattern 80: Spiral Traversal.',
        examples: [{ input: 'See LeetCode #2326', output: 'See LeetCode #2326' }],
        constraints: ['See LeetCode problem #2326 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 80: Spiral Traversal']
    },
    { id: 559, leetcodeLink: 'https://leetcode.com/problems/smallest-number-in-infinite-set/', title: 'Smallest Number in Infinite Set', difficulty: 'Medium', topics: ['Design'], patterns: ['design'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #2336. Smallest Number in Infinite Set. Pattern 93: Design (General/Specific).',
        examples: [{ input: 'See LeetCode #2336', output: 'See LeetCode #2336' }],
        constraints: ['See LeetCode problem #2336 for full constraints'],
        hints: ['Think about Design patterns', 'Consider Pattern 93: Design (General/Specific)']
    },
    { id: 560, leetcodeLink: 'https://leetcode.com/problems/move-pieces-to-obtain-a-string/', title: 'Move Pieces to Obtain a String', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 57, timeEstimate: 25, description: 'LeetCode #2337. Move Pieces to Obtain a String. Pattern 4: In-place Array Modification.',
        examples: [{ input: 'See LeetCode #2337', output: 'See LeetCode #2337' }],
        constraints: ['See LeetCode problem #2337 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 4: In-place Array Modification']
    },
    { id: 561, leetcodeLink: 'https://leetcode.com/problems/longest-cycle-in-a-graph/', title: 'Longest Cycle in a Graph', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 25, timeEstimate: 35, description: 'LeetCode #2360. Longest Cycle in a Graph. Pattern 27: Bridges & Articulation Points (Tarjan low-link).',
        examples: [{ input: 'See LeetCode #2360', output: 'See LeetCode #2360' }],
        constraints: ['See LeetCode problem #2360 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 27: Bridges & Articulation Points (Tarjan low-link)']
    },
    { id: 562, leetcodeLink: 'https://leetcode.com/problems/removing-stars-from-a-string/', title: 'Removing Stars From a String', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 50, timeEstimate: 25, description: 'LeetCode #2390. Removing Stars From a String. Pattern 5: String Comparison with  special characters.',
        examples: [{ input: 'See LeetCode #2390', output: 'See LeetCode #2390' }],
        constraints: ['See LeetCode problem #2390 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 5: String Comparison with  special characters']
    },
    { id: 563, leetcodeLink: 'https://leetcode.com/problems/build-a-matrix-with-conditions/', title: 'Build a Matrix With Conditions', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 37, timeEstimate: 35, description: 'LeetCode #2392. Build a Matrix With Conditions. Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm).',
        examples: [{ input: 'See LeetCode #2392', output: 'See LeetCode #2392' }],
        constraints: ['See LeetCode problem #2392 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 21: BFS - Topological Sort(Kahn\'s Algorithm)']
    },
    { id: 564, leetcodeLink: 'https://leetcode.com/problems/meeting-rooms-iii/', title: 'Meeting Rooms III', difficulty: 'Hard', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 27, timeEstimate: 35, description: 'LeetCode #2402. Meeting Rooms III. Pattern 45: Scheduling / Minimum Cost.',
        examples: [{ input: 'See LeetCode #2402', output: 'See LeetCode #2402' }],
        constraints: ['See LeetCode problem #2402 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 45: Scheduling / Minimum Cost']
    },
    { id: 565, leetcodeLink: 'https://leetcode.com/problems/divide-intervals-into-minimum-number-of-groups/', title: 'Divide Intervals Into Minimum Number of Groups', difficulty: 'Medium', topics: ['Greedy'], patterns: ['greedy'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 46, timeEstimate: 25, description: 'LeetCode #2406. Divide Intervals Into Minimum Number of Groups. Pattern 53: Interval Merging/Scheduling.',
        examples: [{ input: 'See LeetCode #2406', output: 'See LeetCode #2406' }],
        constraints: ['See LeetCode problem #2406 for full constraints'],
        hints: ['Think about Greedy patterns', 'Consider Pattern 53: Interval Merging/Scheduling']
    },
    { id: 566, leetcodeLink: 'https://leetcode.com/problems/longest-increasing-subsequence-ii/', title: 'Longest Increasing Subsequence II', difficulty: 'Hard', topics: ['Dynamic Programming'], patterns: ['dynamic-programming'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 32, timeEstimate: 35, description: 'LeetCode #2407. Longest Increasing Subsequence II. Pattern 40: Longest Increasing Subsequence.',
        examples: [{ input: 'See LeetCode #2407', output: 'See LeetCode #2407' }],
        constraints: ['See LeetCode problem #2407 for full constraints'],
        hints: ['Think about Dynamic Programming patterns', 'Consider Pattern 40: Longest Increasing Subsequence']
    },
    { id: 567, leetcodeLink: 'https://leetcode.com/problems/height-of-binary-tree-after-subtree-removal-queries/', title: 'Height of Binary Tree After Subtree Removal Queries', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Trees'], patterns: ['tree-bfs', 'tree-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 35, description: 'LeetCode #2458. Height of Binary Tree After Subtree Removal Queries. Pattern 15: Recursive Postorder Traversal.',
        examples: [{ input: 'See LeetCode #2458', output: 'See LeetCode #2458' }],
        constraints: ['See LeetCode problem #2458 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 15: Recursive Postorder Traversal']
    },
    { id: 568, leetcodeLink: 'https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/', title: 'Maximum Sum of Distinct Subarrays With Length K', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #2461. Maximum Sum of Distinct Subarrays With Length K. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #2461', output: 'See LeetCode #2461' }],
        constraints: ['See LeetCode problem #2461 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 569, leetcodeLink: 'https://leetcode.com/problems/minimum-penalty-for-a-shop/', title: 'Minimum Penalty for a Shop', difficulty: 'Medium', topics: ['Arrays', 'Matrix'], patterns: ['cyclic-sort', 'matrix-traversal', 'prefix-sum'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 43, timeEstimate: 25, description: 'LeetCode #2483. Minimum Penalty for a Shop. Pattern 82: Prefix/Suffix Products.',
        examples: [{ input: 'See LeetCode #2483', output: 'See LeetCode #2483' }],
        constraints: ['See LeetCode problem #2483 for full constraints'],
        hints: ['Think about Arrays / Matrix patterns', 'Consider Pattern 82: Prefix/Suffix Products']
    },
    { id: 570, leetcodeLink: 'https://leetcode.com/problems/take-k-of-each-character-from-left-and-right/', title: 'Take K of Each Character From Left and Right', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 56, timeEstimate: 25, description: 'LeetCode #2516. Take K of Each Character From Left and Right. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #2516', output: 'See LeetCode #2516' }],
        constraints: ['See LeetCode problem #2516 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 571, leetcodeLink: 'https://leetcode.com/problems/take-gifts-from-the-richest-pile/', title: 'Take Gifts From the Richest Pile', difficulty: 'Easy', topics: ['Heap', 'Priority Queue'], patterns: ['heap'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 73, timeEstimate: 15, description: 'LeetCode #2558. Take Gifts From the Richest Pile. Pattern 42: Top K Elements.',
        examples: [{ input: 'See LeetCode #2558', output: 'See LeetCode #2558' }],
        constraints: ['See LeetCode problem #2558 for full constraints'],
        hints: ['Think about Heap / Priority Queue patterns', 'Consider Pattern 42: Top K Elements']
    },
    { id: 572, leetcodeLink: 'https://leetcode.com/problems/minimum-time-to-visit-a-cell-in-a-grid/', title: 'Minimum Time to Visit a Cell In a Grid', difficulty: 'Hard', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 35, description: 'LeetCode #2577. Minimum Time to Visit a Cell In a Grid. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #2577', output: 'See LeetCode #2577' }],
        constraints: ['See LeetCode problem #2577 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 573, leetcodeLink: 'https://leetcode.com/problems/continuous-subarrays/', title: 'Continuous Subarrays', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 42, timeEstimate: 25, description: 'LeetCode #2762. Continuous Subarrays. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #2762', output: 'See LeetCode #2762' }],
        constraints: ['See LeetCode problem #2762 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 574, leetcodeLink: 'https://leetcode.com/problems/maximum-beauty-of-an-array-after-applying-operation/', title: 'Maximum Beauty of an Array After Applying Operation', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 59, timeEstimate: 25, description: 'LeetCode #2779. Maximum Beauty of an Array After Applying Operation. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #2779', output: 'See LeetCode #2779' }],
        constraints: ['See LeetCode problem #2779 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 575, leetcodeLink: 'https://leetcode.com/problems/find-the-safest-path-in-a-grid/', title: 'Find the Safest Path in a Grid', difficulty: 'Medium', topics: ['BFS', 'DFS', 'Graphs'], patterns: ['graph-bfs', 'graph-dfs'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 52, timeEstimate: 25, description: 'LeetCode #2812. Find the Safest Path in a Grid. Pattern 23: Shortest Path.',
        examples: [{ input: 'See LeetCode #2812', output: 'See LeetCode #2812' }],
        constraints: ['See LeetCode problem #2812 for full constraints'],
        hints: ['Think about BFS / DFS patterns', 'Consider Pattern 23: Shortest Path']
    },
    { id: 576, leetcodeLink: 'https://leetcode.com/problems/separate-black-and-white-balls/', title: 'Separate Black and White Balls', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], patterns: ['two-pointers'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 58, timeEstimate: 25, description: 'LeetCode #2938. Separate Black and White Balls. Pattern 4: In-place Array Modification.',
        examples: [{ input: 'See LeetCode #2938', output: 'See LeetCode #2938' }],
        constraints: ['See LeetCode problem #2938 for full constraints'],
        hints: ['Think about Arrays / Two Pointers patterns', 'Consider Pattern 4: In-place Array Modification']
    },
    { id: 577, leetcodeLink: 'https://leetcode.com/problems/find-longest-special-substring-that-occurs-thrice-i/', title: 'Find Longest Special Substring That Occurs Thrice I', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 41, timeEstimate: 25, description: 'LeetCode #2981. Find Longest Special Substring That Occurs Thrice I. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #2981', output: 'See LeetCode #2981' }],
        constraints: ['See LeetCode problem #2981 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 578, leetcodeLink: 'https://leetcode.com/problems/calculate-compressed-mean/', title: 'Calculate Compressed Mean', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 65, timeEstimate: 15, description: 'LeetCode #2985. Calculate Compressed Mean. Pattern 8: Fixed Size.',
        examples: [{ input: 'See LeetCode #2985', output: 'See LeetCode #2985' }],
        constraints: ['See LeetCode problem #2985 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 8: Fixed Size']
    },
    { id: 579, leetcodeLink: 'https://leetcode.com/problems/find-beautiful-indices-in-the-given-array-ii/', title: 'Find Beautiful Indices in the Given Array II', difficulty: 'Hard', topics: ['Strings'], patterns: ['string-matching'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 33, timeEstimate: 35, description: 'LeetCode #3008. Find Beautiful Indices in the Given Array II. Pattern 91: String Matching - Naive / KMP / Rabin-Karp.',
        examples: [{ input: 'See LeetCode #3008', output: 'See LeetCode #3008' }],
        constraints: ['See LeetCode problem #3008 for full constraints'],
        hints: ['Think about Strings patterns', 'Consider Pattern 91: String Matching - Naive / KMP / Rabin-Karp']
    },
    { id: 580, leetcodeLink: 'https://leetcode.com/problems/maximum-good-subarray-sum/', title: 'Maximum Good Subarray Sum', difficulty: 'Hard', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 31, timeEstimate: 35, description: 'LeetCode #3026. Maximum Good Subarray Sum. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #3026', output: 'See LeetCode #3026' }],
        constraints: ['See LeetCode problem #3026 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 581, leetcodeLink: 'https://leetcode.com/problems/find-the-power-of-k-size-subarrays-i/', title: 'Find the Power of K-Size Subarrays I', difficulty: 'Medium', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 54, timeEstimate: 25, description: 'LeetCode #3254. Find the Power of K-Size Subarrays I. Pattern 8: Fixed Size.',
        examples: [{ input: 'See LeetCode #3254', output: 'See LeetCode #3254' }],
        constraints: ['See LeetCode problem #3254 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 8: Fixed Size']
    },
    { id: 582, leetcodeLink: 'https://leetcode.com/problems/find-x-sum-of-all-k-long-subarrays-i/', title: 'Find X-Sum of All K-Long Subarrays I', difficulty: 'Easy', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 68, timeEstimate: 15, description: 'LeetCode #3318. Find X-Sum of All K-Long Subarrays I. Pattern 8: Fixed Size.',
        examples: [{ input: 'See LeetCode #3318', output: 'See LeetCode #3318' }],
        constraints: ['See LeetCode problem #3318 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 8: Fixed Size']
    },
    { id: 583, leetcodeLink: 'https://leetcode.com/problems/maximum-frequency-of-an-element-after-performing-operations-i/', title: 'Maximum Frequency of an Element After Performing Operations I', difficulty: 'Hard', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 31, timeEstimate: 35, description: 'LeetCode #3346. Maximum Frequency of an Element After Performing Operations I. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #3346', output: 'See LeetCode #3346' }],
        constraints: ['See LeetCode problem #3346 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    },
    { id: 584, leetcodeLink: 'https://leetcode.com/problems/maximum-frequency-of-an-element-after-performing-operations-ii-2/', title: 'Maximum Frequency of an Element After Performing Operations II 2', difficulty: 'Hard', topics: ['Arrays', 'Sliding Window'], patterns: ['sliding-window'], companies: ['google', 'amazon'], frequency: 'medium', acceptance: 32, timeEstimate: 35, description: 'LeetCode #3347. Maximum Frequency of an Element After Performing Operations II 2. Pattern 9: Variable Size.',
        examples: [{ input: 'See LeetCode #3347', output: 'See LeetCode #3347' }],
        constraints: ['See LeetCode problem #3347 for full constraints'],
        hints: ['Think about Arrays / Sliding Window patterns', 'Consider Pattern 9: Variable Size']
    }

];



// Utility: get problems by topic
export function getByTopic(topic) {
  return PROBLEMS.filter(p => p.topics.includes(topic));
}

// Utility: get problems by company
export function getByCompany(companyId) {
  return PROBLEMS.filter(p => p.companies.includes(companyId));
}

// Utility: get problems by difficulty
export function getByDifficulty(diff) {
  return PROBLEMS.filter(p => p.difficulty === diff);
}

// Utility: get difficulty counts
export function getDifficultyCounts() {
  return {
    Easy: PROBLEMS.filter(p => p.difficulty === 'Easy').length,
    Medium: PROBLEMS.filter(p => p.difficulty === 'Medium').length,
    Hard: PROBLEMS.filter(p => p.difficulty === 'Hard').length,
  };
}

// Utility: get problems by study plan
export function getByStudyPlan(planId) {
  return PROBLEMS.filter(p => p.studyPlans && p.studyPlans.includes(planId));
}
