// ═══════════════════════════════════════════════════════
//  Algorithm Visualization — Step Generators
//  Central source for algorithm metadata AND
//  step-by-step generation used by the visualizer
// ═══════════════════════════════════════════════════════

import { generateMoveZeroesSteps, generateRotateArraySteps, generateRemoveDuplicatesSteps, generateBuySellStockSteps, generateProductExceptSelfSteps, generateContainsDuplicateSteps, generateMajorityElementSteps, generateIncreasingTripletSteps, generateFirstMissingPositiveSteps, generateValidPalindromeSteps, generateIsSubsequenceSteps, generateReverseWordsSteps, generateLongestCommonPrefixSteps, generateGroupAnagramsSteps, generateLongestConsecutiveSteps, generateContainsDuplicateIISteps, generateRansomNoteSteps, generateIsomorphicStringsSteps, generateGoodPairsSteps } from './stepGeneratorsExtra.js';

import { generate3SumSteps, generateContainerWaterSteps, generateTrappingRainWaterSteps, generateMergeSortedArraySteps, generateSubarraySumKSteps, generateContiguousArraySteps, generateLongestSubstringSteps, generatePermutationInStringSteps, generateMaxConsecutiveOnesSteps, generateMaxProductSubarraySteps, generateValidParenthesesSteps, generateDailyTemperaturesSteps, generateEvalRPNSteps, generateLargestRectangleSteps, generateSlidingWindowMaxSteps, generateSearchInsertSteps, generateSearchRotatedSteps, generateFindPeakSteps, generateFindMinRotatedSteps, generateSpiralMatrixSteps, generateSetMatrixZeroesSteps, generateRotateImageSteps, generatePermutationsSteps, generateJumpGameIISteps, generateGasStationSteps, generateLISSteps, generateHouseRobberSteps, generateCoinChangeSteps, generateLCSSteps, generateEditDistanceSteps, generateUniquePathsSteps, generateMinPathSumSteps, generateNumberOfIslandsSteps, generateRottingOrangesSteps, generateHeapSortSteps, generateCountingSortSteps, generateRadixSortSteps, generateSortColorsSteps } from './stepGeneratorsMore.js';

// ── Algorithm metadata ──
export const ALGORITHMS = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'Easy',
    icon: '🫧',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    description: 'Repeatedly swap adjacent elements if they are in the wrong order. Like bubbles rising to the surface, the largest unsorted element "bubbles up" to its correct position after each pass.',
    color: '#f472b6',
    defaultInput: [64, 34, 25, 12, 22, 11, 90, 45],
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    difficulty: 'Easy',
    icon: '👆',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    description: 'Find the minimum element from the unsorted portion and place it at the beginning. Repeat for each position until the array is sorted.',
    color: '#fb923c',
    defaultInput: [64, 25, 12, 22, 11, 90, 45, 34],
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    difficulty: 'Easy',
    icon: '📥',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    description: 'Build the sorted array one element at a time by inserting each new element into its correct position among the already-sorted elements.',
    color: '#a78bfa',
    defaultInput: [12, 11, 13, 5, 6, 7, 45, 22],
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    difficulty: 'Medium',
    icon: '🔀',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    description: 'Divide the array in half recursively, sort each half, then merge the sorted halves back together. A classic divide-and-conquer algorithm.',
    color: '#34d399',
    defaultInput: [38, 27, 43, 3, 9, 82, 10, 55],
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'sorting',
    difficulty: 'Medium',
    icon: '⚡',
    complexity: { time: 'O(n log n) avg', space: 'O(log n)' },
    description: 'Pick a pivot, partition the array so elements smaller go left and larger go right, then recursively sort both partitions.',
    color: '#fbbf24',
    defaultInput: [10, 80, 30, 90, 40, 50, 70, 60],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'searching',
    difficulty: 'Easy',
    icon: '🔍',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    description: 'Search a sorted array by repeatedly dividing the search range in half. Compare the middle element with the target and eliminate half the remaining elements.',
    color: '#60a5fa',
    defaultInput: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
    searchTarget: 23,
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'searching',
    difficulty: 'Easy',
    icon: '📏',
    complexity: { time: 'O(n)', space: 'O(1)' },
    description: 'Check each element one by one from left to right until the target is found or the end is reached. Simple but works on unsorted arrays.',
    color: '#c084fc',
    defaultInput: [64, 34, 25, 12, 22, 11, 90, 45],
    searchTarget: 22,
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: 'graph',
    difficulty: 'Medium',
    icon: '🌊',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    description: 'Explore all neighbors at the current depth level before moving to nodes at the next depth level. Uses a queue to track which node to visit next.',
    color: '#22d3ee',
    defaultGraph: {
      nodes: [0, 1, 2, 3, 4, 5, 6],
      edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[5,6]],
    },
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    category: 'graph',
    difficulty: 'Medium',
    icon: '🏊',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    description: 'Explore as deep as possible along each branch before backtracking. Uses a stack (or recursion) to track which node to visit next.',
    color: '#f97316',
    defaultGraph: {
      nodes: [0, 1, 2, 3, 4, 5, 6],
      edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[5,6]],
    },
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    category: 'two-pointers',
    difficulty: 'Easy',
    icon: '↔️',
    complexity: { time: 'O(n)', space: 'O(1)' },
    description: 'Use two pointers that converge from both ends of a sorted array to find pairs that meet a condition.',
    color: '#60a5fa',
    defaultInput: [1, 3, 5, 7, 9, 11, 15, 20],
    searchTarget: 16,
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    category: 'sliding-window',
    difficulty: 'Medium',
    icon: '🪟',
    complexity: { time: 'O(n)', space: 'O(1)' },
    description: 'Maintain a window of elements and slide it across the array to find optimal subarrays.',
    color: '#34d399',
    defaultInput: [2, 1, 5, 1, 3, 2, 8, 4, 3],
    windowSize: 3,
  },
  {
    id: 'merge-intervals',
    name: 'Merge Intervals',
    category: 'intervals',
    difficulty: 'Medium',
    icon: '🔗',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    description: 'Sort intervals by start time, then merge overlapping ones by comparing endpoints.',
    color: '#f472b6',
    defaultInput: [[1,3],[2,6],[8,10],[15,18],[17,20]],
  },
  {
    id: 'kadane',
    name: "Kadane's Algorithm",
    category: 'kadanes',
    difficulty: 'Medium',
    icon: '📈',
    complexity: { time: 'O(n)', space: 'O(1)' },
    description: "Find the maximum sum contiguous subarray using Kadane's approach: extend or restart at each element.",
    color: '#fbbf24',
    defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  },
  {
    id: 'prefix-sum',
    name: 'Prefix Sum',
    category: 'prefix-sum',
    difficulty: 'Easy',
    icon: '➕',
    complexity: { time: 'O(n)', space: 'O(n)' },
    description: 'Build a prefix sum array for O(1) range sum queries. prefix[i] = sum of elements from 0 to i-1.',
    color: '#a78bfa',
    defaultInput: [3, 1, 4, 1, 5, 9, 2, 6],
  },
  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack',
    category: 'stack',
    difficulty: 'Medium',
    icon: '📚',
    complexity: { time: 'O(n)', space: 'O(n)' },
    description: 'Maintain a stack where elements are in monotonic order to find next greater/smaller elements efficiently.',
    color: '#f97316',
    defaultInput: [4, 5, 2, 10, 8, 6, 11, 3],
  },
  {
    id: 'dp-fibonacci',
    name: 'DP: Climbing Stairs',
    category: 'dp',
    difficulty: 'Easy',
    icon: '🧬',
    complexity: { time: 'O(n)', space: 'O(n)' },
    description: 'Classic Fibonacci-style DP: number of ways to climb n stairs taking 1 or 2 steps at a time.',
    color: '#22d3ee',
    dpN: 8,
  },
  {
    id: 'dp-knapsack',
    name: 'DP: 0/1 Knapsack',
    category: 'dp',
    difficulty: 'Hard',
    icon: '🎒',
    complexity: { time: 'O(nW)', space: 'O(nW)' },
    description: 'Given items with weights and values, find the maximum value that fits in a knapsack of capacity W.',
    color: '#ef4444',
    knapsackData: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 8 },
  },
  {
    id: 'backtracking',
    name: 'Backtracking: Subsets',
    category: 'backtracking',
    difficulty: 'Medium',
    icon: '🌳',
    complexity: { time: 'O(2^n)', space: 'O(n)' },
    description: 'Generate all subsets using the choose-explore-unchoose backtracking pattern.',
    color: '#c084fc',
    defaultInput: [1, 2, 3],
  },
  {
    id: 'greedy',
    name: 'Greedy: Activity Selection',
    category: 'greedy',
    difficulty: 'Medium',
    icon: '🏆',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    description: 'Select maximum non-overlapping activities by always choosing the one that ends earliest.',
    color: '#4ade80',
    defaultInput: [[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11],[8,12],[2,14],[12,16]],
  },
  {
    id: 'union-find',
    name: 'Union-Find',
    category: 'graph',
    difficulty: 'Hard',
    icon: '🔲',
    complexity: { time: 'O(alpha(n))', space: 'O(n)' },
    description: 'Disjoint Set Union with path compression and union by rank for efficient connectivity queries.',
    color: '#fb923c',
    defaultGraph: {
      nodes: [0, 1, 2, 3, 4, 5],
      unions: [[0,1],[2,3],[1,3],[4,5],[3,5]],
    },
  },
  {
    id: 'topological-sort',
    name: 'Topological Sort',
    category: 'graph',
    difficulty: 'Hard',
    icon: '📐',
    complexity: { time: 'O(V + E)', space: 'O(V)' },
    description: "Kahn's algorithm: repeatedly remove nodes with 0 in-degree to produce a valid ordering of a DAG.",
    color: '#818cf8',
    defaultGraph: {
      nodes: [0, 1, 2, 3, 4, 5],
      edges: [[0,2],[0,3],[1,3],[1,4],[2,5],[3,5],[4,5]],
      directed: true,
    },
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    category: 'bit-manipulation',
    difficulty: 'Easy',
    icon: '💻',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    description: 'Count set bits using bitwise AND and right shift. Also demonstrates XOR trick for finding single numbers.',
    color: '#e879f9',
    defaultInput: [42],
  },
  // ════════════ NEW ALGORITHMS ════════════
  // ── Array ──
  { id: 'move-zeroes', name: 'Move Zeroes', category: 'array', difficulty: 'Easy', icon: '0️⃣', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Move all zeroes to end while maintaining relative order of non-zero elements.', color: '#60a5fa', defaultInput: [0, 1, 0, 3, 12, 0, 5] },
  { id: 'rotate-array', name: 'Rotate Array', category: 'array', difficulty: 'Medium', icon: '🔄', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Rotate array to the right by k steps using the reverse approach.', color: '#f472b6', defaultInput: [1, 2, 3, 4, 5, 6, 7], rotateK: 3 },
  { id: 'remove-duplicates', name: 'Remove Duplicates from Sorted Array', category: 'array', difficulty: 'Easy', icon: '✂️', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Remove duplicates in-place from a sorted array using two pointers.', color: '#a78bfa', defaultInput: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] },
  { id: 'buy-sell-stock', name: 'Best Time to Buy and Sell Stock', category: 'array', difficulty: 'Easy', icon: '📈', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find the maximum profit from a single buy-sell transaction.', color: '#4ade80', defaultInput: [7, 1, 5, 3, 6, 4] },
  { id: 'product-except-self', name: 'Product of Array Except Self', category: 'array', difficulty: 'Medium', icon: '✖️', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Compute output[i] = product of all elements except arr[i] without division.', color: '#fbbf24', defaultInput: [1, 2, 3, 4] },
  { id: 'contains-duplicate', name: 'Contains Duplicate', category: 'hash-table', difficulty: 'Easy', icon: '🔍', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Check if any value appears at least twice using a hash set.', color: '#f97316', defaultInput: [1, 2, 3, 1, 5, 6] },
  { id: 'majority-element', name: 'Majority Element', category: 'array', difficulty: 'Easy', icon: '👑', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find the element appearing more than n/2 times using Boyer-Moore Voting.', color: '#818cf8', defaultInput: [2, 2, 1, 1, 1, 2, 2] },
  { id: 'increasing-triplet', name: 'Increasing Triplet Subsequence', category: 'array', difficulty: 'Medium', icon: '📊', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find if there exists i < j < k such that a[i] < a[j] < a[k].', color: '#c084fc', defaultInput: [1, 2, 3, 4, 5] },
  { id: 'first-missing-positive', name: 'First Missing Positive', category: 'array', difficulty: 'Hard', icon: '❓', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find the smallest missing positive integer using cyclic sort.', color: '#ef4444', defaultInput: [3, 4, -1, 1] },
  // ── String ──
  { id: 'valid-palindrome', name: 'Valid Palindrome', category: 'string', difficulty: 'Easy', icon: '🪞', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Check if a string is a palindrome considering only alphanumeric characters.', color: '#22d3ee', defaultInput: 'racecar' },
  { id: 'is-subsequence', name: 'Is Subsequence', category: 'string', difficulty: 'Easy', icon: '📎', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Check if s is a subsequence of t by scanning with two pointers.', color: '#34d399', defaultInput: { s: 'ace', t: 'abcde' } },
  { id: 'reverse-words', name: 'Reverse Words in a String', category: 'string', difficulty: 'Medium', icon: '🔃', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Reverse the order of words in a string.', color: '#f472b6', defaultInput: 'the sky is blue' },
  { id: 'longest-common-prefix', name: 'Longest Common Prefix', category: 'string', difficulty: 'Easy', icon: '🔤', complexity: { time: 'O(n·m)', space: 'O(1)' }, description: 'Find the longest common prefix among an array of strings.', color: '#a78bfa', defaultInput: ['flower', 'flow', 'flight'] },
  // ── Hash Table ──
  { id: 'ransom-note', name: 'Ransom Note', category: 'hash-table', difficulty: 'Easy', icon: '✉️', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Check if ransom note can be constructed from magazine letters.', color: '#fb923c', defaultInput: { ransomNote: 'aab', magazine: 'aabbc' } },
  { id: 'group-anagrams', name: 'Group Anagrams', category: 'hash-table', difficulty: 'Medium', icon: '📦', complexity: { time: 'O(n·k log k)', space: 'O(n)' }, description: 'Group strings that are anagrams by sorting characters as keys.', color: '#818cf8', defaultInput: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
  { id: 'longest-consecutive', name: 'Longest Consecutive Sequence', category: 'hash-table', difficulty: 'Medium', icon: '🔗', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Find the longest sequence of consecutive integers using a HashSet.', color: '#22d3ee', defaultInput: [100, 4, 200, 1, 3, 2] },
  { id: 'contains-duplicate-ii', name: 'Contains Duplicate II', category: 'hash-table', difficulty: 'Easy', icon: '📏', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Check if duplicate values exist within k distance of each other.', color: '#34d399', defaultInput: [1, 2, 3, 1, 2, 3] },
  { id: 'isomorphic-strings', name: 'Isomorphic Strings', category: 'hash-table', difficulty: 'Easy', icon: '🔄', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Check if characters in s can be replaced to get t (bijection).', color: '#f97316', defaultInput: { s: 'egg', t: 'add' } },
  { id: 'good-pairs', name: 'Number of Good Pairs', category: 'hash-table', difficulty: 'Easy', icon: '🤝', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Count pairs (i,j) where nums[i] == nums[j] and i < j.', color: '#c084fc', defaultInput: [1, 2, 3, 1, 1, 3] },
  // ── Two Pointers (additional) ──
  { id: '3sum', name: '3Sum', category: 'two-pointers', difficulty: 'Medium', icon: '3️⃣', complexity: { time: 'O(n²)', space: 'O(1)' }, description: 'Find all unique triplets that sum to zero using sort + two pointers.', color: '#f472b6', defaultInput: [-1, 0, 1, 2, -1, -4] },
  { id: 'container-water', name: 'Container with Most Water', category: 'two-pointers', difficulty: 'Medium', icon: '🏊', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Maximize water area between two vertical lines using two pointers.', color: '#60a5fa', defaultInput: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
  { id: 'trapping-rain-water', name: 'Trapping Rain Water', category: 'two-pointers', difficulty: 'Hard', icon: '🌧️', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Compute trapped rain water using two-pointer approach with left/right max.', color: '#22d3ee', defaultInput: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
  { id: 'merge-sorted-array', name: 'Merge Sorted Array', category: 'two-pointers', difficulty: 'Easy', icon: '🔀', complexity: { time: 'O(m+n)', space: 'O(1)' }, description: 'Merge two sorted arrays in-place from the end.', color: '#34d399', defaultInput: { nums1: [1, 2, 3, 0, 0, 0], nums2: [2, 5, 6], m: 3 } },
  // ── Prefix Sum (additional) ──
  { id: 'subarray-sum-k', name: 'Subarray Sum Equals K', category: 'prefix-sum', difficulty: 'Medium', icon: '🎯', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Count subarrays summing to k using prefix sum + hash map.', color: '#fbbf24', defaultInput: [1, 1, 1, 2, 3] },
  { id: 'contiguous-array', name: 'Contiguous Array', category: 'prefix-sum', difficulty: 'Medium', icon: '⚖️', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Find longest subarray with equal 0s and 1s using running count + map.', color: '#818cf8', defaultInput: [0, 1, 0, 0, 1, 1, 0] },
  // ── Sliding Window (additional) ──
  { id: 'longest-substring', name: 'Longest Substring Without Repeating', category: 'sliding-window', difficulty: 'Medium', icon: '🔤', complexity: { time: 'O(n)', space: 'O(min(n,m))' }, description: 'Find the longest substring without repeating characters.', color: '#f97316', defaultInput: 'abcabcbb' },
  { id: 'permutation-in-string', name: 'Permutation in String', category: 'sliding-window', difficulty: 'Medium', icon: '🔀', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Check if s2 contains a permutation of s1 using a sliding window.', color: '#c084fc', defaultInput: { s1: 'ab', s2: 'eidbaooo' } },
  { id: 'max-consecutive-ones', name: 'Max Consecutive Ones III', category: 'sliding-window', difficulty: 'Medium', icon: '1️⃣', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Max consecutive 1s if you can flip at most k zeroes.', color: '#4ade80', defaultInput: [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0] },
  // ── Kadane's (additional) ──
  { id: 'max-product-subarray', name: 'Maximum Product Subarray', category: 'kadanes', difficulty: 'Medium', icon: '✖️', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find the contiguous subarray with the largest product, tracking both max and min.', color: '#ef4444', defaultInput: [2, 3, -2, 4, -1] },
  // ── Matrix ──
  { id: 'spiral-matrix', name: 'Spiral Matrix', category: 'matrix', difficulty: 'Medium', icon: '🌀', complexity: { time: 'O(m·n)', space: 'O(1)' }, description: 'Traverse matrix in spiral order: right → down → left → up.', color: '#f472b6', defaultInput: [[1,2,3],[4,5,6],[7,8,9]] },
  { id: 'rotate-image', name: 'Rotate Image', category: 'matrix', difficulty: 'Medium', icon: '🔄', complexity: { time: 'O(n²)', space: 'O(1)' }, description: 'Rotate NxN matrix 90° clockwise: transpose then reverse each row.', color: '#60a5fa', defaultInput: [[1,2,3],[4,5,6],[7,8,9]] },
  { id: 'set-matrix-zeroes', name: 'Set Matrix Zeroes', category: 'matrix', difficulty: 'Medium', icon: '0️⃣', complexity: { time: 'O(m·n)', space: 'O(m+n)' }, description: 'If an element is 0, set its entire row and column to 0.', color: '#fbbf24', defaultInput: [[1,1,1],[1,0,1],[1,1,1]] },
  // ── Stack ──
  { id: 'valid-parentheses', name: 'Valid Parentheses', category: 'stack', difficulty: 'Easy', icon: '🔐', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Check if brackets are balanced using a stack.', color: '#34d399', defaultInput: '({[]})' },
  { id: 'daily-temperatures', name: 'Daily Temperatures', category: 'stack', difficulty: 'Medium', icon: '🌡️', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Find days until warmer temperature using monotonic stack.', color: '#f97316', defaultInput: [73, 74, 75, 71, 69, 72, 76, 73] },
  { id: 'eval-rpn', name: 'Evaluate Reverse Polish Notation', category: 'stack', difficulty: 'Medium', icon: '🧮', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Evaluate postfix expression using a stack.', color: '#818cf8', defaultInput: ['2', '1', '+', '3', '*'] },
  { id: 'largest-rectangle', name: 'Largest Rectangle in Histogram', category: 'stack', difficulty: 'Hard', icon: '📊', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Find largest rectangular area in histogram using monotonic stack.', color: '#ef4444', defaultInput: [2, 1, 5, 6, 2, 3] },
  // ── Queue ──
  { id: 'sliding-window-max', name: 'Sliding Window Maximum', category: 'queue', difficulty: 'Hard', icon: '📈', complexity: { time: 'O(n)', space: 'O(k)' }, description: 'Find maximum in each sliding window using a monotonic deque.', color: '#22d3ee', defaultInput: [1, 3, -1, -3, 5, 3, 6, 7] },
  // ── Binary Search (additional) ──
  { id: 'search-insert', name: 'Search Insert Position', category: 'searching', difficulty: 'Easy', icon: '📍', complexity: { time: 'O(log n)', space: 'O(1)' }, description: 'Find target index or insertion point in sorted array.', color: '#a78bfa', defaultInput: [1, 3, 5, 6], searchTarget: 5 },
  { id: 'search-rotated', name: 'Search in Rotated Sorted Array', category: 'searching', difficulty: 'Medium', icon: '🔄', complexity: { time: 'O(log n)', space: 'O(1)' }, description: 'Binary search in a rotated sorted array by identifying the sorted half.', color: '#fb923c', defaultInput: [4, 5, 6, 7, 0, 1, 2], searchTarget: 0 },
  { id: 'find-peak', name: 'Find Peak Element', category: 'searching', difficulty: 'Medium', icon: '⛰️', complexity: { time: 'O(log n)', space: 'O(1)' }, description: 'Find a peak element using binary search on slope direction.', color: '#f472b6', defaultInput: [1, 2, 3, 1, 5, 4] },
  { id: 'find-min-rotated', name: 'Find Min in Rotated Sorted Array', category: 'searching', difficulty: 'Medium', icon: '📉', complexity: { time: 'O(log n)', space: 'O(1)' }, description: 'Find minimum in rotated sorted array using binary search.', color: '#34d399', defaultInput: [3, 4, 5, 1, 2] },
  // ── Backtracking (additional) ──
  { id: 'permutations', name: 'Permutations', category: 'backtracking', difficulty: 'Medium', icon: '🔀', complexity: { time: 'O(n!)', space: 'O(n)' }, description: 'Generate all permutations using choose-recurse-unchoose pattern.', color: '#f97316', defaultInput: [1, 2, 3] },
  // ── Greedy (additional) ──
  { id: 'jump-game-ii', name: 'Jump Game II', category: 'greedy', difficulty: 'Medium', icon: '🦘', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Minimum jumps to reach the end using greedy BFS approach.', color: '#60a5fa', defaultInput: [2, 3, 1, 1, 4] },
  { id: 'gas-station', name: 'Gas Station', category: 'greedy', difficulty: 'Medium', icon: '⛽', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Find starting gas station for a circular tour using net gain tracking.', color: '#fbbf24', defaultInput: { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] } },
  // ── DP (additional) ──
  { id: 'dp-lis', name: 'Longest Increasing Subsequence', category: 'dp', difficulty: 'Medium', icon: '📈', complexity: { time: 'O(n²)', space: 'O(n)' }, description: 'Find the length of the longest strictly increasing subsequence.', color: '#f97316', defaultInput: [10, 9, 2, 5, 3, 7, 101, 18] },
  { id: 'dp-house-robber', name: 'House Robber', category: 'dp', difficulty: 'Medium', icon: '🏠', complexity: { time: 'O(n)', space: 'O(n)' }, description: 'Max money robbing non-adjacent houses using DP.', color: '#ef4444', defaultInput: [2, 7, 9, 3, 1, 8] },
  { id: 'dp-coin-change', name: 'Coin Change', category: 'dp', difficulty: 'Medium', icon: '🪙', complexity: { time: 'O(n·amount)', space: 'O(amount)' }, description: 'Min coins needed to make an amount using DP.', color: '#fbbf24', defaultInput: { coins: [1, 5, 10, 25], amount: 30 } },
  { id: 'dp-lcs', name: 'Longest Common Subsequence', category: 'dp', difficulty: 'Medium', icon: '🔗', complexity: { time: 'O(m·n)', space: 'O(m·n)' }, description: 'Find length of longest common subsequence of two strings.', color: '#22d3ee', defaultInput: { s1: 'abcde', s2: 'ace' } },
  { id: 'dp-edit-distance', name: 'Edit Distance', category: 'dp', difficulty: 'Hard', icon: '✏️', complexity: { time: 'O(m·n)', space: 'O(m·n)' }, description: 'Min operations (insert/delete/replace) to convert one string to another.', color: '#c084fc', defaultInput: { s1: 'horse', s2: 'ros' } },
  { id: 'dp-unique-paths', name: 'Unique Paths', category: 'dp', difficulty: 'Medium', icon: '🗺️', complexity: { time: 'O(m·n)', space: 'O(m·n)' }, description: 'Number of unique paths from top-left to bottom-right in a grid.', color: '#34d399', defaultInput: { m: 3, n: 7 } },
  { id: 'dp-min-path-sum', name: 'Minimum Path Sum', category: 'dp', difficulty: 'Medium', icon: '🛤️', complexity: { time: 'O(m·n)', space: 'O(1)' }, description: 'Find path from top-left to bottom-right minimizing sum of values.', color: '#818cf8', defaultInput: [[1,3,1],[1,5,1],[4,2,1]] },
  // ── Graph (additional) ──
  { id: 'number-of-islands', name: 'Number of Islands', category: 'graph', difficulty: 'Medium', icon: '🏝️', complexity: { time: 'O(m·n)', space: 'O(m·n)' }, description: 'Count connected components of 1s in a binary grid using DFS.', color: '#4ade80', defaultInput: [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]] },
  { id: 'rotting-oranges', name: 'Rotting Oranges', category: 'graph', difficulty: 'Medium', icon: '🍊', complexity: { time: 'O(m·n)', space: 'O(m·n)' }, description: 'BFS from rotten oranges to determine minutes until all are rotten.', color: '#f97316', defaultInput: [[2,1,1],[1,1,0],[0,1,1]] },
  // ── Sorting (additional) ──
  { id: 'heap-sort', name: 'Heap Sort', category: 'sorting', difficulty: 'Medium', icon: '🏔️', complexity: { time: 'O(n log n)', space: 'O(1)' }, description: 'Build max-heap then repeatedly extract the maximum element.', color: '#818cf8', defaultInput: [12, 11, 13, 5, 6, 7, 45, 22] },
  { id: 'counting-sort', name: 'Counting Sort', category: 'sorting', difficulty: 'Easy', icon: '🔢', complexity: { time: 'O(n+k)', space: 'O(k)' }, description: 'Sort by counting occurrences. Works for small integer ranges.', color: '#4ade80', defaultInput: [4, 2, 2, 8, 3, 3, 1] },
  { id: 'radix-sort', name: 'Radix Sort', category: 'sorting', difficulty: 'Medium', icon: '🎰', complexity: { time: 'O(d·(n+k))', space: 'O(n+k)' }, description: 'Sort integers digit by digit from least to most significant.', color: '#c084fc', defaultInput: [170, 45, 75, 90, 802, 24, 2, 66] },
  { id: 'sort-colors', name: 'Sort Colors', category: 'sorting', difficulty: 'Medium', icon: '🎨', complexity: { time: 'O(n)', space: 'O(1)' }, description: 'Dutch National Flag: partition array into 0s, 1s, and 2s in one pass.', color: '#f472b6', defaultInput: [2, 0, 2, 1, 1, 0] },
];

// ═══════════ STEP GENERATORS ═══════════

// ── Bubble Sort ──
export function generateBubbleSortSteps(arr) {
  const a = [...arr];
  const n = a.length;
  const steps = [{ array: [...a], highlights: [], sorted: [], message: '🫧 Bubble Sort works by comparing neighbors — if the left is bigger, we swap. After each pass, the largest unsorted value "bubbles" to the end.', variables: { n, pass: 0 } }];

  for (let i = 0; i < n - 1; i++) {
    steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: i }, (_, k) => n - 1 - k), message: `── Pass ${i + 1} of ${n - 1} ── Scanning from left to right to bubble up the next largest value.`, variables: { pass: i + 1, comparisons: n - i - 1 } });
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], highlights: [j, j + 1], comparing: true, sorted: Array.from({ length: i }, (_, k) => n - 1 - k), message: `Is ${a[j]} > ${a[j + 1]}? ${a[j] > a[j + 1] ? `Yes! ${a[j]} is bigger, so we need to swap.` : `No, ${a[j]} ≤ ${a[j + 1]} — they're already in order. Move on.`}`, variables: { i, j, left: a[j], right: a[j + 1] } });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ array: [...a], highlights: [j, j + 1], swapping: true, sorted: Array.from({ length: i }, (_, k) => n - 1 - k), message: `🔄 Swapped! [${a[j]}, ${a[j + 1]}] — the larger value (${a[j + 1]}) moves one step closer to the end.`, variables: { i, j, left: a[j], right: a[j + 1], swapped: true } });
      }
    }
    steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: i + 1 }, (_, k) => n - 1 - k), message: `✅ Pass ${i + 1} done! ${a[n - 1 - i]} has bubbled to position ${n - 1 - i}. ${i + 1} element${i > 0 ? 's' : ''} sorted so far.`, variables: { pass: i + 1, sorted: i + 1 } });
  }
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: n }, (_, k) => k), message: '🎉 Bubble Sort complete! All elements are in ascending order. Total passes: ' + (n - 1), variables: { sorted: n, totalPasses: n - 1 } });
  return steps;
}

// ── Selection Sort ──
export function generateSelectionSortSteps(arr) {
  const a = [...arr];
  const n = a.length;
  const steps = [{ array: [...a], highlights: [], sorted: [], message: '👆 Selection Sort finds the smallest element and places it first, then the second smallest, and so on. Simple but illustrates the "select and place" pattern.', variables: { n, sorted: 0 } }];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({ array: [...a], highlights: [i], minIndex: i, sorted: Array.from({ length: i }, (_, k) => k), message: `── Round ${i + 1} ── Position ${i} needs the ${i === 0 ? 'smallest' : `${i + 1}th smallest`} element. Starting with ${a[i]} as our candidate.`, variables: { round: i + 1, minIdx, candidate: a[minIdx] } });
    for (let j = i + 1; j < n; j++) {
      const isBetter = a[j] < a[minIdx];
      steps.push({ array: [...a], highlights: [j, minIdx], comparing: true, minIndex: minIdx, sorted: Array.from({ length: i }, (_, k) => k), message: `Is ${a[j]} < ${a[minIdx]} (our current min)? ${isBetter ? `Yes! ${a[j]} is smaller — updating our min.` : `No, ${a[minIdx]} is still the smallest we've found.`}`, variables: { j, checking: a[j], currentMin: a[minIdx], minIdx } });
      if (isBetter) {
        minIdx = j;
        steps.push({ array: [...a], highlights: [minIdx], minIndex: minIdx, sorted: Array.from({ length: i }, (_, k) => k), message: `📌 New minimum = ${a[minIdx]} (at index ${minIdx}). Keep scanning to see if anything smaller exists.`, variables: { minIdx, newMin: a[minIdx] } });
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], highlights: [i, minIdx], swapping: true, sorted: Array.from({ length: i + 1 }, (_, k) => k), message: `🔄 Placing ${a[i]} into position ${i} (swapped with ${a[minIdx]}). Position ${i} is now final!`, variables: { placed: a[i], position: i } });
    } else {
      steps.push({ array: [...a], highlights: [i], sorted: Array.from({ length: i + 1 }, (_, k) => k), message: `${a[i]} was already in the correct position — no swap needed.`, variables: { placed: a[i], position: i } });
    }
  }
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: n }, (_, k) => k), message: '🎉 Selection Sort complete! Each position now holds its correct value.', variables: { sorted: n } });
  return steps;
}

// ── Insertion Sort ──
export function generateInsertionSortSteps(arr) {
  const a = [...arr];
  const n = a.length;
  const steps = [{ array: [...a], highlights: [], sorted: [0], message: '📥 Insertion Sort works like sorting cards in your hand — take each new card and slide it into the right spot among your already-sorted cards.', variables: { n, sorted: 1 } }];

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({ array: [...a], highlights: [i], sorted: Array.from({ length: i }, (_, k) => k), message: `── Picking up ${key} (index ${i}) ── Now inserting it into the sorted portion [${a.slice(0, i).join(', ')}].`, variables: { card: key, sortedPortion: i } });
    let shifted = 0;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      shifted++;
      steps.push({ array: [...a], highlights: [j, j + 1], comparing: true, sorted: Array.from({ length: i }, (_, k) => k), message: `${a[j]} > ${key} — shifting ${a[j]} one position right to make room.`, variables: { key, shifting: a[j], from: j, to: j + 1 } });
      j--;
    }
    a[j + 1] = key;
    steps.push({ array: [...a], highlights: [j + 1], sorted: Array.from({ length: i + 1 }, (_, k) => k), message: shifted > 0 ? `✅ Placed ${key} at index ${j + 1} after shifting ${shifted} element${shifted > 1 ? 's' : ''}. Sorted: [${a.slice(0, i + 1).join(', ')}]` : `✅ ${key} is already in the right spot — no shifting needed!`, variables: { key, insertedAt: j + 1, shifted } });
  }
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: n }, (_, k) => k), message: '🎉 Insertion Sort complete! Like a sorted hand of cards — each element found its place.', variables: { sorted: n } });
  return steps;
}

// ── Merge Sort ──
export function generateMergeSortSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], sorted: [], ranges: [], message: 'Starting Merge Sort — divide array in half recursively, then merge sorted halves.' }];

  function merge(arr, l, m, r, steps) {
    const left = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    steps.push({ array: [...arr], highlights: Array.from({ length: r - l + 1 }, (_, i) => l + i), ranges: [{ start: l, mid: m, end: r }], message: `Merging [${left.join(',')}] and [${right.join(',')}]` });
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        arr[k] = left[i]; i++;
      } else {
        arr[k] = right[j]; j++;
      }
      k++;
    }
    while (i < left.length) { arr[k] = left[i]; i++; k++; }
    while (j < right.length) { arr[k] = right[j]; j++; k++; }
    steps.push({ array: [...arr], highlights: Array.from({ length: r - l + 1 }, (_, i) => l + i), sorted: [], message: `Merged result: [${arr.slice(l, r + 1).join(',')}]` });
  }

  function sort(arr, l, r) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      steps.push({ array: [...arr], highlights: Array.from({ length: r - l + 1 }, (_, i) => l + i), ranges: [{ start: l, end: r }], message: `Dividing [${l}..${r}] at midpoint ${m}` });
      sort(arr, l, m);
      sort(arr, m + 1, r);
      merge(arr, l, m, r, steps);
    }
  }

  sort(a, 0, a.length - 1);
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: a.length }, (_, k) => k), message: '✅ Array is fully sorted!' });
  return steps;
}

// ── Quick Sort ──
export function generateQuickSortSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], sorted: [], message: 'Starting Quick Sort — pick a pivot, partition around it, then recurse on both sides.' }];

  function partition(arr, low, high) {
    const pivot = arr[high];
    steps.push({ array: [...arr], highlights: [high], pivot: high, sorted: [], message: `Pivot selected: ${pivot} (index ${high})` });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({ array: [...arr], highlights: [j, high], comparing: true, pivot: high, partitionBoundary: i + 1, sorted: [], message: `Comparing ${arr[j]} with pivot ${pivot}` });
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        if (i !== j) {
          steps.push({ array: [...arr], highlights: [i, j], swapping: true, pivot: high, partitionBoundary: i, sorted: [], message: `${arr[j]} < ${pivot} — swapped to position ${i}` });
        }
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    steps.push({ array: [...arr], highlights: [i + 1], pivot: i + 1, sorted: [], message: `Pivot ${pivot} placed at final position ${i + 1}` });
    return i + 1;
  }

  function sort(arr, low, high) {
    if (low < high) {
      const pi = partition(arr, low, high);
      sort(arr, low, pi - 1);
      sort(arr, pi + 1, high);
    }
  }

  sort(a, 0, a.length - 1);
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: a.length }, (_, k) => k), message: '✅ Array is fully sorted!' });
  return steps;
}

// ── Binary Search ──
export function generateBinarySearchSteps(arr, target) {
  const a = [...arr].sort((x, y) => x - y);
  const steps = [{ array: [...a], highlights: [], left: 0, right: a.length - 1, message: `Searching for ${target} in sorted array. Search range: [0..${a.length - 1}]`, variables: { lo: 0, hi: a.length - 1, target } }];
  let lo = 0, hi = a.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], highlights: [mid], left: lo, right: hi, mid, message: `Mid = ${mid}, value = ${a[mid]}. Comparing with target ${target}`, variables: { lo, hi, mid, 'arr[mid]': a[mid], target } });
    if (a[mid] === target) {
      steps.push({ array: [...a], highlights: [mid], found: mid, left: lo, right: hi, message: `✅ Found ${target} at index ${mid}!`, variables: { lo, hi, mid, found: true } });
      return steps;
    } else if (a[mid] < target) {
      steps.push({ array: [...a], highlights: [mid], left: mid + 1, right: hi, eliminated: Array.from({ length: mid - lo + 1 }, (_, i) => lo + i), message: `${a[mid]} < ${target} — eliminate left half. New range: [${mid + 1}..${hi}]`, variables: { lo: mid + 1, hi, action: 'go right' } });
      lo = mid + 1;
    } else {
      steps.push({ array: [...a], highlights: [mid], left: lo, right: mid - 1, eliminated: Array.from({ length: hi - mid + 1 }, (_, i) => mid + i), message: `${a[mid]} > ${target} — eliminate right half. New range: [${lo}..${mid - 1}]`, variables: { lo, hi: mid - 1, action: 'go left' } });
      hi = mid - 1;
    }
  }
  steps.push({ array: [...a], highlights: [], left: lo, right: hi, message: `❌ ${target} not found in the array.`, variables: { lo, hi, found: false } });
  return steps;
}

// ── Linear Search ──
export function generateLinearSearchSteps(arr, target) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], checked: [], message: `Searching for ${target} — checking each element from left to right.`, variables: { target, i: 0, checked: 0 } }];
  const checked = [];

  for (let i = 0; i < a.length; i++) {
    checked.push(i);
    if (a[i] === target) {
      steps.push({ array: [...a], highlights: [i], found: i, checked: [...checked], message: `✅ Found ${target} at index ${i}!`, variables: { i, 'arr[i]': a[i], found: true } });
      return steps;
    }
    steps.push({ array: [...a], highlights: [i], checked: [...checked], message: `Index ${i}: ${a[i]} ≠ ${target} — moving on`, variables: { i, 'arr[i]': a[i], match: false } });
  }
  steps.push({ array: [...a], highlights: [], checked: [...checked], message: `❌ ${target} not found after checking all ${a.length} elements.`, variables: { checked: a.length, found: false } });
  return steps;
}

// ── BFS ──
export function generateBFSSteps(graph, start = 0) {
  const { nodes, edges } = graph;
  const adj = {};
  nodes.forEach(n => { adj[n] = []; });
  edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });

  const visited = new Set();
  const queue = [start];
  visited.add(start);
  const order = [];
  const steps = [{ nodes, edges, visited: [], queue: [start], current: null, order: [], message: `Starting BFS from node ${start}. Queue: [${start}]` }];

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: node, order: [...order], message: `Visiting node ${node}. Exploring neighbors: [${adj[node].join(', ')}]` });

    for (const neighbor of adj[node].sort((a, b) => a - b)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: node, exploring: neighbor, order: [...order], message: `  → Adding node ${neighbor} to queue` });
      }
    }
  }
  steps.push({ nodes, edges, visited: [...visited], queue: [], current: null, order: [...order], message: `✅ BFS complete! Traversal order: [${order.join(' → ')}]` });
  return steps;
}

// ── DFS ──
export function generateDFSSteps(graph, start = 0) {
  const { nodes, edges } = graph;
  const adj = {};
  nodes.forEach(n => { adj[n] = []; });
  edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });

  const visited = new Set();
  const order = [];
  const steps = [{ nodes, edges, visited: [], stack: [start], current: null, order: [], message: `Starting DFS from node ${start}. Stack: [${start}]` }];

  function dfs(node, depth = 0) {
    visited.add(node);
    order.push(node);
    const indent = '  '.repeat(depth);
    steps.push({ nodes, edges, visited: [...visited], current: node, order: [...order], depth, message: `${indent}Visiting node ${node} (depth ${depth}). Neighbors: [${adj[node].join(', ')}]` });

    for (const neighbor of adj[node].sort((a, b) => a - b)) {
      if (!visited.has(neighbor)) {
        steps.push({ nodes, edges, visited: [...visited], current: node, exploring: neighbor, order: [...order], depth, message: `${indent}  → Going deeper to node ${neighbor}` });
        dfs(neighbor, depth + 1);
        steps.push({ nodes, edges, visited: [...visited], current: node, order: [...order], depth, message: `${indent}  ← Backtracking to node ${node}` });
      }
    }
  }

  dfs(start);
  steps.push({ nodes, edges, visited: [...visited], current: null, order: [...order], message: `✅ DFS complete! Traversal order: [${order.join(' → ')}]` });
  return steps;
}

// ── Two Pointers ──
export function generateTwoPointersSteps(arr, target) {
  const a = [...arr].sort((x, y) => x - y);
  const steps = [{ array: [...a], highlights: [], left: 0, right: a.length - 1, message: `Two Pointers: find pair summing to ${target} in sorted array` }];
  let l = 0, r = a.length - 1;
  while (l < r) {
    const sum = a[l] + a[r];
    steps.push({ array: [...a], highlights: [l, r], left: l, right: r, message: `Sum = ${a[l]} + ${a[r]} = ${sum}, target = ${target}` });
    if (sum === target) {
      steps.push({ array: [...a], highlights: [l, r], found: true, left: l, right: r, message: `\u2705 Found pair! ${a[l]} + ${a[r]} = ${target}` });
      return steps;
    } else if (sum < target) {
      steps.push({ array: [...a], highlights: [l], left: l + 1, right: r, message: `Too small (${sum} < ${target}) \u2014 move left pointer right` });
      l++;
    } else {
      steps.push({ array: [...a], highlights: [r], left: l, right: r - 1, message: `Too large (${sum} > ${target}) \u2014 move right pointer left` });
      r--;
    }
  }
  steps.push({ array: [...a], highlights: [], message: `\u274c No pair found summing to ${target}` });
  return steps;
}

// ── Sliding Window ──
export function generateSlidingWindowSteps(arr, k) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], windowStart: 0, windowEnd: k - 1, message: `Sliding Window: find max sum subarray of size ${k}` }];
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += a[i];
    steps.push({ array: [...a], highlights: Array.from({ length: i + 1 }, (_, j) => j), windowStart: 0, windowEnd: i, windowSum, message: `Building initial window: adding ${a[i]}, sum = ${windowSum}` });
  }
  let maxSum = windowSum, maxStart = 0;
  for (let i = k; i < a.length; i++) {
    const removed = a[i - k];
    windowSum += a[i] - removed;
    const ws = i - k + 1;
    const highlights = Array.from({ length: k }, (_, j) => ws + j);
    const isNewMax = windowSum > maxSum;
    if (isNewMax) { maxSum = windowSum; maxStart = ws; }
    steps.push({ array: [...a], highlights, windowStart: ws, windowEnd: i, windowSum, maxSum, removing: i - k, adding: i, message: `Slide: remove ${removed}, add ${a[i]}. Sum = ${windowSum}${isNewMax ? ' \u2022 New max!' : ''}` });
  }
  steps.push({ array: [...a], highlights: Array.from({ length: k }, (_, j) => maxStart + j), windowSum: maxSum, maxSum, message: `\u2705 Max sum subarray = ${maxSum} at indices [${maxStart}..${maxStart + k - 1}]` });
  return steps;
}

// ── Merge Intervals ──
export function generateMergeIntervalsSteps(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const steps = [{ intervals: sorted.map(iv => ({ val: iv, state: 'default' })), merged: [], message: `Merge Intervals: ${sorted.length} intervals sorted by start time` }];
  const merged = [sorted[0]];
  steps.push({ intervals: sorted.map((iv, i) => ({ val: iv, state: i === 0 ? 'current' : 'default' })), merged: [[...sorted[0]]], message: `Start with interval [${sorted[0]}]` });
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    steps.push({ intervals: sorted.map((iv, j) => ({ val: iv, state: j === i ? 'comparing' : j < i ? 'processed' : 'default' })), merged: merged.map(m => [...m]), message: `Comparing [${cur}] with last merged [${last}]` });
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
      steps.push({ intervals: sorted.map((iv, j) => ({ val: iv, state: j <= i ? 'processed' : 'default' })), merged: merged.map(m => [...m]), message: `Overlap! Extend to [${last[0]}, ${last[1]}]` });
    } else {
      merged.push([...cur]);
      steps.push({ intervals: sorted.map((iv, j) => ({ val: iv, state: j <= i ? 'processed' : 'default' })), merged: merged.map(m => [...m]), message: `No overlap. Add new interval [${cur}]` });
    }
  }
  steps.push({ intervals: sorted.map(iv => ({ val: iv, state: 'processed' })), merged: merged.map(m => [...m]), message: `\u2705 Result: ${merged.map(m => '[' + m + ']').join(', ')}` });
  return steps;
}

// ── Kadane's Algorithm ──
export function generateKadaneSteps(arr) {
  const a = [...arr];
  let maxSoFar = a[0], maxEndingHere = a[0];
  const steps = [{ array: [...a], highlights: [0], maxSoFar, maxEndingHere, subarrayStart: 0, subarrayEnd: 0, message: `Start: maxEndingHere = ${a[0]}, maxSoFar = ${a[0]}` }];
  let bestStart = 0, bestEnd = 0, tempStart = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] > maxEndingHere + a[i]) {
      maxEndingHere = a[i]; tempStart = i;
      steps.push({ array: [...a], highlights: [i], maxSoFar, maxEndingHere, subarrayStart: tempStart, subarrayEnd: i, message: `Start new subarray at ${a[i]} (better than extending ${maxEndingHere - a[i]} + ${a[i]})` });
    } else {
      maxEndingHere += a[i];
      steps.push({ array: [...a], highlights: Array.from({ length: i - tempStart + 1 }, (_, j) => tempStart + j), maxSoFar, maxEndingHere, subarrayStart: tempStart, subarrayEnd: i, message: `Extend subarray: ${maxEndingHere - a[i]} + ${a[i]} = ${maxEndingHere}` });
    }
    if (maxEndingHere > maxSoFar) {
      maxSoFar = maxEndingHere; bestStart = tempStart; bestEnd = i;
      steps.push({ array: [...a], highlights: Array.from({ length: bestEnd - bestStart + 1 }, (_, j) => bestStart + j), maxSoFar, maxEndingHere, subarrayStart: bestStart, subarrayEnd: bestEnd, message: `New global max = ${maxSoFar}!` });
    }
  }
  steps.push({ array: [...a], highlights: Array.from({ length: bestEnd - bestStart + 1 }, (_, j) => bestStart + j), maxSoFar, maxEndingHere, subarrayStart: bestStart, subarrayEnd: bestEnd, sorted: Array.from({ length: bestEnd - bestStart + 1 }, (_, j) => bestStart + j), message: `\u2705 Max subarray sum = ${maxSoFar}, subarray = [${a.slice(bestStart, bestEnd + 1)}]` });
  return steps;
}

// ── Prefix Sum ──
export function generatePrefixSumSteps(arr) {
  const a = [...arr];
  const prefix = [0];
  const steps = [{ array: [...a], prefix: [0], highlights: [], message: `Prefix Sum: build cumulative sum array. prefix[0] = 0` }];
  for (let i = 0; i < a.length; i++) {
    prefix.push(prefix[i] + a[i]);
    steps.push({ array: [...a], prefix: [...prefix], highlights: [i], message: `prefix[${i + 1}] = prefix[${i}] + arr[${i}] = ${prefix[i]} + ${a[i]} = ${prefix[i + 1]}` });
  }
  const l = 1, r = 4;
  const rangeSum = prefix[r + 1] - prefix[l];
  steps.push({ array: [...a], prefix: [...prefix], highlights: Array.from({ length: r - l + 1 }, (_, j) => l + j), message: `Range query [${l}..${r}]: prefix[${r + 1}] - prefix[${l}] = ${prefix[r + 1]} - ${prefix[l]} = ${rangeSum}` });
  steps.push({ array: [...a], prefix: [...prefix], highlights: [], sorted: Array.from({ length: a.length }, (_, k) => k), message: `\u2705 Complete! Prefix array: [${prefix.join(', ')}]` });
  return steps;
}

// ── Monotonic Stack ──
export function generateMonotonicStackSteps(arr) {
  const a = [...arr];
  const result = new Array(a.length).fill(-1);
  const stack = [];
  const steps = [{ array: [...a], result: [...result], stack: [], highlights: [], message: `Monotonic Stack: find next greater element for each position` }];
  for (let i = 0; i < a.length; i++) {
    while (stack.length > 0 && a[i] > a[stack[stack.length - 1]]) {
      const idx = stack.pop();
      result[idx] = a[i];
      steps.push({ array: [...a], result: [...result], stack: [...stack], highlights: [idx, i], message: `Pop index ${idx}: next greater of ${a[idx]} is ${a[i]}. Found!` });
    }
    stack.push(i);
    steps.push({ array: [...a], result: [...result], stack: [...stack], highlights: [i], message: `Push index ${i} (value ${a[i]}) onto stack. Stack: [${stack.map(s => a[s]).join(', ')}]` });
  }
  steps.push({ array: [...a], result: [...result], stack: [...stack], highlights: [], sorted: Array.from({ length: a.length }, (_, k) => k), message: `\u2705 Result: [${result.join(', ')}]. Remaining in stack have no next greater.` });
  return steps;
}

// ── DP Fibonacci (Climbing Stairs) ──
export function generateDPFibonacciSteps(n) {
  const dp = [0, 1, 2];
  const steps = [{ array: [...dp], highlights: [], dpTable: [...dp], message: `Climbing Stairs: dp[1] = 1, dp[2] = 2 (base cases)` }];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    steps.push({ array: dp.slice(1), highlights: [i - 1], dpTable: [...dp], dpCurrent: i, message: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}` });
  }
  steps.push({ array: dp.slice(1), highlights: [n - 1], dpTable: [...dp], sorted: [n - 1], message: `\u2705 Ways to climb ${n} stairs = ${dp[n]}` });
  return steps;
}

// ── DP 0/1 Knapsack ──
export function generateKnapsackSteps(data) {
  const { weights, values, capacity } = data;
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  const steps = [{ dpTable: dp.map(r => [...r]), weights, values, capacity, message: `0/1 Knapsack: ${n} items, capacity ${capacity}` }];
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weights[i - 1] <= w) {
        const include = dp[i - 1][w - weights[i - 1]] + values[i - 1];
        if (include > dp[i][w]) {
          dp[i][w] = include;
          steps.push({ dpTable: dp.map(r => [...r]), weights, values, capacity, currentItem: i, currentWeight: w, action: 'include', message: `Item ${i} (w=${weights[i - 1]}, v=${values[i - 1]}): Include! dp[${i}][${w}] = ${dp[i][w]}` });
        } else {
          steps.push({ dpTable: dp.map(r => [...r]), weights, values, capacity, currentItem: i, currentWeight: w, action: 'skip', message: `Item ${i} at w=${w}: Skip (${dp[i - 1][w]} >= ${include})` });
        }
      }
    }
  }
  steps.push({ dpTable: dp.map(r => [...r]), weights, values, capacity, message: `\u2705 Max value = ${dp[n][capacity]}` });
  return steps;
}

// ── Backtracking: Subsets ──
export function generateBacktrackingSteps(arr) {
  const a = [...arr];
  const result = [];
  const steps = [{ array: [...a], result: [], current: [], highlights: [], message: `Backtracking: generate all subsets of [${a.join(', ')}]` }];
  function backtrack(start, current) {
    result.push([...current]);
    steps.push({ array: [...a], result: result.map(r => [...r]), current: [...current], highlights: current.map(c => a.indexOf(c)), message: `Record subset: [${current.join(', ')}]` });
    for (let i = start; i < a.length; i++) {
      current.push(a[i]);
      steps.push({ array: [...a], result: result.map(r => [...r]), current: [...current], highlights: [i], message: `Choose ${a[i]}` });
      backtrack(i + 1, current);
      current.pop();
      steps.push({ array: [...a], result: result.map(r => [...r]), current: [...current], highlights: [], message: `Un-choose ${a[i]} (backtrack)` });
    }
  }
  backtrack(0, []);
  steps.push({ array: [...a], result: result.map(r => [...r]), current: [], highlights: [], message: `\u2705 All ${result.length} subsets generated!` });
  return steps;
}

// ── Greedy: Activity Selection ──
export function generateGreedySteps(intervals) {
  const activities = intervals.map((iv, i) => ({ start: iv[0], end: iv[1], id: i })).sort((a, b) => a.end - b.end);
  const steps = [{ intervals: activities, selected: [], message: `Activity Selection: ${activities.length} activities sorted by end time` }];
  const selected = [activities[0]];
  let lastEnd = activities[0].end;
  steps.push({ intervals: activities, selected: [0], current: 0, message: `Select activity [${activities[0].start}, ${activities[0].end}] (first by end time)` });
  for (let i = 1; i < activities.length; i++) {
    const act = activities[i];
    if (act.start >= lastEnd) {
      selected.push(act);
      lastEnd = act.end;
      steps.push({ intervals: activities, selected: selected.map((_, j) => activities.findIndex(a => a === selected[j])), current: i, message: `Select [${act.start}, ${act.end}] \u2014 starts at ${act.start} >= last end ${lastEnd - (act.end - lastEnd > 0 ? 0 : 0)}` });
    } else {
      steps.push({ intervals: activities, selected: selected.map((_, j) => activities.findIndex(a => a === selected[j])), current: i, skipped: true, message: `Skip [${act.start}, ${act.end}] \u2014 overlaps with last selected` });
    }
  }
  steps.push({ intervals: activities, selected: selected.map((_, j) => activities.findIndex(a => a === selected[j])), message: `\u2705 Max non-overlapping: ${selected.length} activities` });
  return steps;
}

// ── Union-Find ──
export function generateUnionFindSteps(data) {
  const { nodes, unions } = data;
  const parent = [...nodes];
  const rank = new Array(nodes.length).fill(0);
  const steps = [{ nodes, parent: [...parent], rank: [...rank], sets: nodes.map(n => [n]), message: `Union-Find: ${nodes.length} nodes, each in its own set` }];
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  for (const [u, v] of unions) {
    const pu = find(u), pv = find(v);
    steps.push({ nodes, parent: [...parent], rank: [...rank], highlights: [u, v], message: `Union(${u}, ${v}): Find(${u})=${pu}, Find(${v})=${pv}` });
    if (pu === pv) {
      steps.push({ nodes, parent: [...parent], rank: [...rank], highlights: [u, v], message: `Already in same set! Skip.` });
      continue;
    }
    if (rank[pu] < rank[pv]) { parent[pu] = pv; }
    else if (rank[pu] > rank[pv]) { parent[pv] = pu; }
    else { parent[pv] = pu; rank[pu]++; }
    steps.push({ nodes, parent: [...parent], rank: [...rank], highlights: [u, v], message: `Union complete: parent[${rank[pu] >= rank[pv] ? pv : pu}] = ${rank[pu] >= rank[pv] ? pu : pv}` });
  }
  steps.push({ nodes, parent: [...parent], rank: [...rank], message: `\u2705 Union-Find complete! Components connected.` });
  return steps;
}

// ── Topological Sort ──
export function generateTopologicalSortSteps(graph) {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const adj = {};
  const inDeg = {};
  nodes.forEach(node => { adj[node] = []; inDeg[node] = 0; });
  edges.forEach(([u, v]) => { adj[u].push(v); inDeg[v]++; });
  const steps = [{ nodes, edges, inDegree: { ...inDeg }, queue: [], order: [], visited: [], message: `Topological Sort: computing in-degrees for ${n} nodes` }];
  const queue = nodes.filter(n => inDeg[n] === 0);
  steps.push({ nodes, edges, inDegree: { ...inDeg }, queue: [...queue], order: [], visited: [], message: `Nodes with in-degree 0: [${queue.join(', ')}]. Add to queue.` });
  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    steps.push({ nodes, edges, inDegree: { ...inDeg }, queue: [...queue], order: [...order], visited: [...order], current: node, message: `Process node ${node}. Order so far: [${order.join(' \u2192 ')}]` });
    for (const neighbor of adj[node]) {
      inDeg[neighbor]--;
      if (inDeg[neighbor] === 0) {
        queue.push(neighbor);
        steps.push({ nodes, edges, inDegree: { ...inDeg }, queue: [...queue], order: [...order], visited: [...order], current: node, exploring: neighbor, message: `Decrement in-degree of ${neighbor} to ${inDeg[neighbor]}. Enqueue!` });
      }
    }
  }
  steps.push({ nodes, edges, inDegree: { ...inDeg }, queue: [], order: [...order], visited: [...order], message: `\u2705 Topological order: [${order.join(' \u2192 ')}]` });
  return steps;
}

// ── Bit Manipulation ──
export function generateBitManipulationSteps(arr) {
  const num = arr[0];
  let n = num;
  const bits = num.toString(2);
  const steps = [{ number: num, binary: bits, highlights: [], count: 0, message: `Count set bits of ${num} (binary: ${bits})` }];
  let count = 0;
  let pos = 0;
  let temp = n;
  while (temp > 0) {
    const bit = temp & 1;
    if (bit === 1) count++;
    steps.push({ number: num, binary: bits, currentBit: pos, bitValue: bit, count, remaining: temp.toString(2), message: `Bit ${pos}: ${bit}${bit === 1 ? ' (set! count=' + count + ')' : ''} | Remaining: ${temp.toString(2)}` });
    temp >>= 1;
    pos++;
  }
  steps.push({ number: num, binary: bits, count, message: `\u2705 ${num} has ${count} set bits. Binary: ${bits}` });
  return steps;
}

// ── Step generator dispatcher ──
export function generateSteps(algorithmId, input, extra = {}) {
  switch (algorithmId) {
    case 'bubble-sort': return generateBubbleSortSteps(input);
    case 'selection-sort': return generateSelectionSortSteps(input);
    case 'insertion-sort': return generateInsertionSortSteps(input);
    case 'merge-sort': return generateMergeSortSteps(input);
    case 'quick-sort': return generateQuickSortSteps(input);
    case 'binary-search': return generateBinarySearchSteps(input, extra.target ?? 23);
    case 'linear-search': return generateLinearSearchSteps(input, extra.target ?? 22);
    case 'bfs': return generateBFSSteps(input, extra.start ?? 0);
    case 'dfs': return generateDFSSteps(input, extra.start ?? 0);
    case 'two-pointers': return generateTwoPointersSteps(input, extra.target ?? 16);
    case 'sliding-window': return generateSlidingWindowSteps(input, extra.windowSize ?? 3);
    case 'merge-intervals': return generateMergeIntervalsSteps(input);
    case 'kadane': return generateKadaneSteps(input);
    case 'prefix-sum': return generatePrefixSumSteps(input);
    case 'monotonic-stack': return generateMonotonicStackSteps(input);
    case 'dp-fibonacci': return generateDPFibonacciSteps(extra.dpN ?? 8);
    case 'dp-knapsack': return generateKnapsackSteps(input);
    case 'backtracking': return generateBacktrackingSteps(input);
    case 'greedy': return generateGreedySteps(input);
    case 'union-find': return generateUnionFindSteps(input);
    case 'topological-sort': return generateTopologicalSortSteps(input);
    case 'bit-manipulation': return generateBitManipulationSteps(input);
    // ── New algorithms from stepGeneratorsExtra.js ──
    case 'move-zeroes': return generateMoveZeroesSteps(input);
    case 'rotate-array': return generateRotateArraySteps(input, extra.rotateK ?? 3);
    case 'remove-duplicates': return generateRemoveDuplicatesSteps(input);
    case 'buy-sell-stock': return generateBuySellStockSteps(input);
    case 'product-except-self': return generateProductExceptSelfSteps(input);
    case 'contains-duplicate': return generateContainsDuplicateSteps(input);
    case 'majority-element': return generateMajorityElementSteps(input);
    case 'increasing-triplet': return generateIncreasingTripletSteps(input);
    case 'first-missing-positive': return generateFirstMissingPositiveSteps(input);
    case 'valid-palindrome': return generateValidPalindromeSteps(input);
    case 'is-subsequence': return generateIsSubsequenceSteps(input);
    case 'reverse-words': return generateReverseWordsSteps(input);
    case 'longest-common-prefix': return generateLongestCommonPrefixSteps(input);
    case 'ransom-note': return generateRansomNoteSteps(input);
    case 'group-anagrams': return generateGroupAnagramsSteps(input);
    case 'longest-consecutive': return generateLongestConsecutiveSteps(input);
    case 'contains-duplicate-ii': return generateContainsDuplicateIISteps(input);
    case 'isomorphic-strings': return generateIsomorphicStringsSteps(input);
    case 'good-pairs': return generateGoodPairsSteps(input);
    // ── New algorithms from stepGeneratorsMore.js ──
    case '3sum': return generate3SumSteps(input);
    case 'container-water': return generateContainerWaterSteps(input);
    case 'trapping-rain-water': return generateTrappingRainWaterSteps(input);
    case 'merge-sorted-array': return generateMergeSortedArraySteps(input);
    case 'subarray-sum-k': return generateSubarraySumKSteps(input, extra.k ?? 7);
    case 'contiguous-array': return generateContiguousArraySteps(input);
    case 'longest-substring': return generateLongestSubstringSteps(input);
    case 'permutation-in-string': return generatePermutationInStringSteps(input);
    case 'max-consecutive-ones': return generateMaxConsecutiveOnesSteps(input, extra.k ?? 2);
    case 'max-product-subarray': return generateMaxProductSubarraySteps(input);
    case 'valid-parentheses': return generateValidParenthesesSteps(input);
    case 'daily-temperatures': return generateDailyTemperaturesSteps(input);
    case 'eval-rpn': return generateEvalRPNSteps(input);
    case 'largest-rectangle': return generateLargestRectangleSteps(input);
    case 'sliding-window-max': return generateSlidingWindowMaxSteps(input, extra.windowSize ?? 3);
    case 'search-insert': return generateSearchInsertSteps(input, extra.target ?? 5);
    case 'search-rotated': return generateSearchRotatedSteps(input, extra.target ?? 0);
    case 'find-peak': return generateFindPeakSteps(input);
    case 'find-min-rotated': return generateFindMinRotatedSteps(input);
    case 'spiral-matrix': return generateSpiralMatrixSteps(input);
    case 'rotate-image': return generateRotateImageSteps(input);
    case 'set-matrix-zeroes': return generateSetMatrixZeroesSteps(input);
    case 'permutations': return generatePermutationsSteps(input);
    case 'jump-game-ii': return generateJumpGameIISteps(input);
    case 'gas-station': return generateGasStationSteps(input);
    case 'dp-lis': return generateLISSteps(input);
    case 'dp-house-robber': return generateHouseRobberSteps(input);
    case 'dp-coin-change': return generateCoinChangeSteps(input);
    case 'dp-lcs': return generateLCSSteps(input);
    case 'dp-edit-distance': return generateEditDistanceSteps(input);
    case 'dp-unique-paths': return generateUniquePathsSteps(input);
    case 'dp-min-path-sum': return generateMinPathSumSteps(input);
    case 'number-of-islands': return generateNumberOfIslandsSteps(input);
    case 'rotting-oranges': return generateRottingOrangesSteps(input);
    case 'heap-sort': return generateHeapSortSteps(input);
    case 'counting-sort': return generateCountingSortSteps(input);
    case 'radix-sort': return generateRadixSortSteps(input);
    case 'sort-colors': return generateSortColorsSteps(input);
    default: return [];
  }
}

