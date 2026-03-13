import { supabaseAdmin } from './supabaseClient.js';

// All remaining test cases mapped by title
const ALL_TEST_DATA = {
    // ===== EASY =====
    'Assign Cookies': { fn: 'findContentChildren', tc: [{ i: [[1, 2, 3], [1, 1]], o: 1 }, { i: [[1, 2], [1, 2, 3]], o: 2 }] },
    'Average of Levels in Binary Tree': { fn: 'averageOfLevels', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: [3.0, 14.5, 11.0] }] },
    'Balanced Binary Tree': { fn: 'isBalanced', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: true }, { i: [[1, 2, 2, 3, 3, null, null, 4, 4]], o: false }] },
    'Binary Tree Paths': { fn: 'binaryTreePaths', tc: [{ i: [[1, 2, 3, null, 5]], o: ["1->2->5", "1->3"] }] },
    'Convert Binary Number in LinkedList': { fn: 'getDecimalValue', tc: [{ i: [[1, 0, 1]], o: 5 }, { i: [[0]], o: 0 }] },
    'Convert Sorted Array to BST': { fn: 'sortedArrayToBST', tc: [{ i: [[-10, -3, 0, 5, 9]], o: [0, -3, 9, -10, null, 5] }] },
    'Detect Cycle in LinkedList': { fn: 'hasCycle', tc: [{ i: [[3, 2, 0, -4], 1], o: true }, { i: [[1, 2], -1], o: false }] },
    'Diameter of Binary Tree': { fn: 'diameterOfBinaryTree', tc: [{ i: [[1, 2, 3, 4, 5]], o: 3 }, { i: [[1, 2]], o: 1 }] },
    'Diet Plan Performance': { fn: 'dietPlanPerformance', tc: [{ i: [[1, 2, 3, 4, 5], 1, 3, 3], o: 0 }, { i: [[3, 2], 2, 0, 1], o: 1 }] },
    'Find if Path Exists in Graph': { fn: 'validPath', tc: [{ i: [3, [[0, 1], [1, 2], [2, 0]], 0, 2], o: true }, { i: [6, [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], 0, 5], o: false }] },
    'Find Smallest Letter Greater Than Target': { fn: 'nextGreatestLetter', tc: [{ i: [["c", "f", "j"], "a"], o: "c" }, { i: [["c", "f", "j"], "c"], o: "f" }] },
    'Find the Middle Node of LinkedList': { fn: 'middleNode', tc: [{ i: [[1, 2, 3, 4, 5]], o: [3, 4, 5] }, { i: [[1, 2, 3, 4, 5, 6]], o: [4, 5, 6] }] },
    'First Bad Version': { fn: 'firstBadVersion', tc: [{ i: [5, 4], o: 4 }, { i: [1, 1], o: 1 }] },
    'Guess Number Higher or Lower': { fn: 'guessNumber', tc: [{ i: [10, 6], o: 6 }, { i: [1, 1], o: 1 }] },
    'Implement Queue using Stacks': { fn: 'MyQueue', tc: [{ i: [], o: "class" }] },
    'Implement Stack using Queues': { fn: 'MyStack', tc: [{ i: [], o: "class" }] },
    'Intersection of Two Linked Lists': { fn: 'getIntersectionNode', tc: [{ i: [[4, 1, 8, 4, 5], [5, 6, 1, 8, 4, 5]], o: 8 }] },
    'Linked List Cycle': { fn: 'hasCycle', tc: [{ i: [[3, 2, 0, -4], 1], o: true }, { i: [[1], -1], o: false }] },
    'Longest Nice Substring': { fn: 'longestNiceSubstring', tc: [{ i: ["YazaAay"], o: "aAa" }, { i: ["Bb"], o: "Bb" }, { i: ["c"], o: "" }] },
    'Lowest Common Ancestor of BST': { fn: 'lowestCommonAncestor', tc: [{ i: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], o: 6 }, { i: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], o: 2 }] },
    'Max Stack': { fn: 'MaxStack', tc: [{ i: [], o: "class" }] },
    'Maximum Nesting Depth of Parentheses': { fn: 'maxDepth', tc: [{ i: ["(1+(2*3)+((8)/4))+1"], o: 3 }, { i: ["(1)+((2))+(((3)))"], o: 3 }] },
    'Maximum Units on a Truck': { fn: 'maximumUnits', tc: [{ i: [[[1, 3], [2, 2], [3, 1]], 4], o: 8 }, { i: [[[5, 10], [2, 5], [4, 7], [3, 9]], 10], o: 91 }] },
    'Merge Two Binary Trees': { fn: 'mergeTrees', tc: [{ i: [[1, 3, 2, 5], [2, 1, 3, null, 4, null, 7]], o: [3, 4, 5, 5, 4, null, 7] }] },
    'Middle of the Linked List': { fn: 'middleNode', tc: [{ i: [[1, 2, 3, 4, 5]], o: [3, 4, 5] }, { i: [[1, 2, 3, 4, 5, 6]], o: [4, 5, 6] }] },
    'Min Cost Climbing Stairs': { fn: 'minCostClimbingStairs', tc: [{ i: [[10, 15, 20]], o: 15 }, { i: [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], o: 6 }] },
    'Min Stack': { fn: 'MinStack', tc: [{ i: [], o: "class" }] },
    'Minimum Depth of Binary Tree': { fn: 'minDepth', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: 2 }, { i: [[2, null, 3, null, 4, null, 5, null, 6]], o: 5 }] },
    'Palindrome Linked List': { fn: 'isPalindrome', tc: [{ i: [[1, 2, 2, 1]], o: true }, { i: [[1, 2]], o: false }] },
    'Peak Index in a Mountain Array': { fn: 'peakIndexInMountainArray', tc: [{ i: [[0, 1, 0]], o: 1 }, { i: [[0, 2, 1, 0]], o: 1 }, { i: [[0, 10, 5, 2]], o: 1 }] },
    'Remove Duplicates from Sorted List': { fn: 'deleteDuplicates', tc: [{ i: [[1, 1, 2]], o: [1, 2] }, { i: [[1, 1, 2, 3, 3]], o: [1, 2, 3] }] },
    'Reverse Vowels of a String': { fn: 'reverseVowels', tc: [{ i: ["hello"], o: "holle" }, { i: ["leetcode"], o: "leotcede" }] },
    'Reverse Words in a String III': { fn: 'reverseWords', tc: [{ i: ["Let's take LeetCode contest"], o: "s'teL ekat edoCteeL tsetnoc" }] },
    'Subtree of Another Tree': { fn: 'isSubtree', tc: [{ i: [[3, 4, 5, 1, 2], [4, 1, 2]], o: true }, { i: [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], o: false }] },

    // ===== MEDIUM - DP =====
    'Arithmetic Slices': { fn: 'numberOfArithmeticSlices', tc: [{ i: [[1, 2, 3, 4]], o: 3 }, { i: [[1]], o: 0 }] },
    'Best Time to Buy and Sell Stock II': { fn: 'maxProfit', tc: [{ i: [[7, 1, 5, 3, 6, 4]], o: 7 }, { i: [[1, 2, 3, 4, 5]], o: 4 }, { i: [[7, 6, 4, 3, 1]], o: 0 }] },
    'Best Time to Buy and Sell Stock with Cooldown': { fn: 'maxProfit', tc: [{ i: [[1, 2, 3, 0, 2]], o: 3 }, { i: [[1]], o: 0 }] },
    'Best Time to Buy and Sell Stock with Transaction Fee': { fn: 'maxProfit', tc: [{ i: [[1, 3, 2, 8, 4, 9], 2], o: 8 }] },
    'Coin Change 2': { fn: 'change', tc: [{ i: [5, [1, 2, 5]], o: 4 }, { i: [3, [2]], o: 0 }, { i: [10, [10]], o: 1 }] },
    'Combination Sum IV': { fn: 'combinationSum4', tc: [{ i: [[1, 2, 3], 4], o: 7 }, { i: [[9], 3], o: 0 }] },
    'House Robber III': { fn: 'rob', tc: [{ i: [[3, 2, 3, null, 3, null, 1]], o: 7 }, { i: [[3, 4, 5, 1, 3, null, 1]], o: 9 }] },
    'Interleaving String': { fn: 'isInterleave', tc: [{ i: ["aabcc", "dbbca", "aadbbcbcac"], o: true }, { i: ["aabcc", "dbbca", "aadbbbaccc"], o: false }] },
    'Last Stone Weight II': { fn: 'lastStoneWeightII', tc: [{ i: [[2, 7, 4, 1, 8, 1]], o: 1 }, { i: [[31, 26, 33, 21, 40]], o: 5 }] },
    'Longest Palindromic Subsequence': { fn: 'longestPalindromeSubseq', tc: [{ i: ["bbbab"], o: 4 }, { i: ["cbbd"], o: 2 }] },
    'Maximum Length of Pair Chain': { fn: 'findLongestChain', tc: [{ i: [[[1, 2], [2, 3], [3, 4]]], o: 2 }, { i: [[[1, 2], [7, 8], [4, 5]]], o: 3 }] },
    'Maximal Square': { fn: 'maximalSquare', tc: [{ i: [[["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]]], o: 4 }] },
    'Ones and Zeroes': { fn: 'findMaxForm', tc: [{ i: [["10", "0001", "111001", "1", "0"], 5, 3], o: 4 }] },
    'Partition Equal Subset Sum': { fn: 'canPartition', tc: [{ i: [[1, 5, 11, 5]], o: true }, { i: [[1, 2, 3, 5]], o: false }] },
    'Partition to K Equal Sum Subsets': { fn: 'canPartitionKSubsets', tc: [{ i: [[4, 3, 2, 3, 5, 2, 1], 4], o: true }] },
    'Perfect Squares': { fn: 'numSquares', tc: [{ i: [12], o: 3 }, { i: [13], o: 2 }] },
    'Triangle': { fn: 'minimumTotal', tc: [{ i: [[[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]]], o: 11 }, { i: [[[-10]]], o: -10 }] },
    'Unique Binary Search Trees': { fn: 'numTrees', tc: [{ i: [3], o: 5 }, { i: [1], o: 1 }] },
    'Unique Paths II': { fn: 'uniquePathsWithObstacles', tc: [{ i: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], o: 2 }, { i: [[[0, 1], [0, 0]]], o: 1 }] },
    'Wiggle Subsequence': { fn: 'wiggleMaxLength', tc: [{ i: [[1, 7, 4, 9, 2, 5]], o: 6 }, { i: [[1, 17, 5, 10, 13, 15, 10, 5, 16, 8]], o: 7 }] },

    // ===== MEDIUM - Graph =====
    'Accounts Merge': { fn: 'accountsMerge', tc: [{ i: [[["John", "john@mail", "john_neo@gmail"], ["John", "john@mail", "john00@mail"], ["Mary", "mary@mail"], ["John", "johnnybravo@mail"]]], o: [["John", "john00@mail", "john@mail", "john_neo@gmail"], ["Mary", "mary@mail"], ["John", "johnnybravo@mail"]] }] },
    'All Paths from Source to Target': { fn: 'allPathsSourceTarget', tc: [{ i: [[[1, 2], [3], [3], []]], o: [[0, 1, 3], [0, 2, 3]] }] },
    'Cheapest Flights Within K Stops': { fn: 'findCheapestPrice', tc: [{ i: [4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1], o: 700 }] },
    'Evaluate Division': { fn: 'calcEquation', tc: [{ i: [[["a", "b"], ["b", "c"]], [2.0, 3.0], [["a", "c"], ["b", "a"], ["a", "e"]]], o: [6.0, 0.5, -1.0] }] },
    'Graph Valid Tree': { fn: 'validTree', tc: [{ i: [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], o: true }, { i: [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], o: false }] },
    'Is Graph Bipartite': { fn: 'isBipartite', tc: [{ i: [[[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]], o: false }, { i: [[[1, 3], [0, 2], [1, 3], [0, 2]]], o: true }] },
    'Max Area of Island': { fn: 'maxAreaOfIsland', tc: [{ i: [[[0, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 1, 1, 0, 0], [0, 1, 0, 0, 0]]], o: 3 }] },
    'Minimum Height Trees': { fn: 'findMinHeightTrees', tc: [{ i: [4, [[1, 0], [1, 2], [1, 3]]], o: [1] }, { i: [6, [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]], o: [3, 4] }] },
    'Network Delay Time': { fn: 'networkDelayTime', tc: [{ i: [[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], o: 2 }, { i: [[[1, 2, 1]], 2, 1], o: 1 }] },
    'Number of Connected Components': { fn: 'countComponents', tc: [{ i: [5, [[0, 1], [1, 2], [3, 4]]], o: 2 }, { i: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], o: 1 }] },
    'Number of Closed Islands': { fn: 'closedIsland', tc: [{ i: [[[1, 1, 1, 1, 1, 1, 1, 0], [1, 0, 0, 0, 0, 1, 1, 0], [1, 0, 1, 0, 1, 1, 1, 0], [1, 0, 0, 0, 0, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 0]]], o: 2 }] },
    'Number of Distinct Islands': { fn: 'numDistinctIslands', tc: [{ i: [[[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 0, 1, 1], [0, 0, 0, 1, 1]]], o: 1 }] },
    'Number of Provinces': { fn: 'findCircleNum', tc: [{ i: [[[1, 1, 0], [1, 1, 0], [0, 0, 1]]], o: 2 }, { i: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]], o: 3 }] },
    'Reconstruct Itinerary': { fn: 'findItinerary', tc: [{ i: [[["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]]], o: ["JFK", "MUC", "LHR", "SFO", "SJC"] }] },
    'Redundant Connection': { fn: 'findRedundantConnection', tc: [{ i: [[[1, 2], [1, 3], [2, 3]]], o: [2, 3] }] },
    'Shortest Bridge': { fn: 'shortestBridge', tc: [{ i: [[[0, 1], [1, 0]]], o: 1 }] },
    'Shortest Path in Binary Matrix': { fn: 'shortestPathBinaryMatrix', tc: [{ i: [[[0, 1], [1, 0]]], o: 2 }, { i: [[[0, 0, 0], [1, 1, 0], [1, 1, 0]]], o: 4 }] },
    'Surrounded Regions': { fn: 'solve', tc: [{ i: [[["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]]], o: [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]] }] },

    // ===== MEDIUM - Backtracking =====
    'Combination Sum II': { fn: 'combinationSum2', tc: [{ i: [[10, 1, 2, 7, 6, 1, 5], 8], o: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]] }] },
    'Combination Sum III': { fn: 'combinationSum3', tc: [{ i: [3, 7], o: [[1, 2, 4]] }, { i: [3, 9], o: [[1, 2, 6], [1, 3, 5], [2, 3, 4]] }] },
    'Combinations': { fn: 'combine', tc: [{ i: [4, 2], o: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]] }] },
    'Letter Case Permutation': { fn: 'letterCasePermutation', tc: [{ i: ["a1b2"], o: ["a1b2", "a1B2", "A1b2", "A1B2"] }, { i: ["3z4"], o: ["3z4", "3Z4"] }] },
    'Palindrome Partitioning': { fn: 'partition', tc: [{ i: ["aab"], o: [["a", "a", "b"], ["aa", "b"]] }, { i: ["a"], o: [["a"]] }] },
    'Permutations II': { fn: 'permuteUnique', tc: [{ i: [[1, 1, 2]], o: [[1, 1, 2], [1, 2, 1], [2, 1, 1]] }] },
    'Restore IP Addresses': { fn: 'restoreIpAddresses', tc: [{ i: ["25525511135"], o: ["255.255.11.135", "255.255.111.35"] }] },
    'Subsets II': { fn: 'subsetsWithDup', tc: [{ i: [[1, 2, 2]], o: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] }] },

    // ===== MEDIUM - Stack =====
    'Basic Calculator II': { fn: 'calculate', tc: [{ i: ["3+2*2"], o: 7 }, { i: [" 3/2 "], o: 1 }, { i: [" 3+5 / 2 "], o: 5 }] },
    'Minimum Add to Make Parentheses Valid': { fn: 'minAddToMakeValid', tc: [{ i: ["())"], o: 1 }, { i: ["((("], o: 3 }] },
    'Minimum Remove to Make Valid Parentheses': { fn: 'minRemoveToMakeValid', tc: [{ i: ["lee(t(c)o)de)"], o: "lee(t(c)o)de" }, { i: ["a)b(c)d"], o: "ab(c)d" }] },
    'Next Greater Element II': { fn: 'nextGreaterElements', tc: [{ i: [[1, 2, 1]], o: [2, -1, 2] }, { i: [[1, 2, 3, 4, 3]], o: [2, 3, 4, -1, 4] }] },
    'Remove All Adjacent Duplicates in String II': { fn: 'removeDuplicates', tc: [{ i: ["deeedbbcccbdaa", 3], o: "aa" }, { i: ["abcd", 2], o: "abcd" }] },
    'Score of Parentheses': { fn: 'scoreOfParentheses', tc: [{ i: ["()"], o: 1 }, { i: ["(())"], o: 2 }, { i: ["()()"], o: 2 }] },
    'Valid Parenthesis String': { fn: 'checkValidString', tc: [{ i: ["()"], o: true }, { i: ["(*)"], o: true }, { i: ["(*))"], o: true }] },

    // ===== MEDIUM - Binary Search =====
    'Count Complete Tree Nodes': { fn: 'countNodes', tc: [{ i: [[1, 2, 3, 4, 5, 6]], o: 6 }, { i: [[]], o: 0 }] },
    'Divide Two Integers': { fn: 'divide', tc: [{ i: [10, 3], o: 3 }, { i: [7, -3], o: -2 }] },
    'Find K Closest Elements': { fn: 'findClosestElements', tc: [{ i: [[1, 2, 3, 4, 5], 4, 3], o: [1, 2, 3, 4] }, { i: [[1, 2, 3, 4, 5], 4, -1], o: [1, 2, 3, 4] }] },
    'Magnetic Force Between Two Balls': { fn: 'maxDistance', tc: [{ i: [[1, 2, 3, 4, 7], 3], o: 3 }] },
    'Minimum Number of Days to Make m Bouquets': { fn: 'minDays', tc: [{ i: [[1, 10, 3, 10, 2], 3, 1], o: 3 }, { i: [[1, 10, 3, 10, 2], 3, 2], o: -1 }] },
    'Search in Rotated Sorted Array II': { fn: 'search', tc: [{ i: [[2, 5, 6, 0, 0, 1, 2], 0], o: true }, { i: [[2, 5, 6, 0, 0, 1, 2], 3], o: false }] },

    // ===== MEDIUM - Sliding Window =====
    'Binary Subarrays With Sum': { fn: 'numSubarraysWithSum', tc: [{ i: [[1, 0, 1, 0, 1], 2], o: 4 }, { i: [[0, 0, 0, 0, 0], 0], o: 15 }] },
    'Contains Duplicate III': { fn: 'containsNearbyAlmostDuplicate', tc: [{ i: [[1, 2, 3, 1], 3, 0], o: true }, { i: [[1, 5, 9, 1, 5, 9], 2, 3], o: false }] },
    'Count Number of Nice Subarrays': { fn: 'numberOfSubarrays', tc: [{ i: [[1, 1, 2, 1, 1], 3], o: 2 }, { i: [[2, 4, 6], 1], o: 0 }] },
    'Frequency of the Most Frequent Element': { fn: 'maxFrequency', tc: [{ i: [[1, 2, 4], 5], o: 3 }, { i: [[1, 4, 8, 13], 5], o: 2 }] },
    'Fruit Into Baskets': { fn: 'totalFruit', tc: [{ i: [[1, 2, 1]], o: 3 }, { i: [[0, 1, 2, 2]], o: 3 }, { i: [[1, 2, 3, 2, 2]], o: 4 }] },
    'Get Equal Substrings Within Budget': { fn: 'equalSubstring', tc: [{ i: ["abcd", "bcdf", 3], o: 3 }, { i: ["abcd", "cdef", 3], o: 1 }] },
    'Grumpy Bookstore Owner': { fn: 'maxSatisfied', tc: [{ i: [[1, 0, 1, 2, 1, 1, 7, 5], [0, 1, 0, 1, 0, 1, 0, 1], 3], o: 16 }] },
    'Longest Mountain in Array': { fn: 'longestMountain', tc: [{ i: [[2, 1, 4, 7, 3, 2, 5]], o: 5 }, { i: [[2, 2, 2]], o: 0 }] },
    'Longest Substring with At Most K Distinct Characters': { fn: 'lengthOfLongestSubstringKDistinct', tc: [{ i: ["eceba", 2], o: 3 }, { i: ["aa", 1], o: 2 }] },
    'Longest Substring with At Most Two Distinct Characters': { fn: 'lengthOfLongestSubstringTwoDistinct', tc: [{ i: ["eceba"], o: 3 }, { i: ["ccaabbb"], o: 5 }] },
    'Longest Turbulent Subarray': { fn: 'maxTurbulenceSize', tc: [{ i: [[9, 4, 2, 10, 7, 8, 8, 1, 9]], o: 5 }, { i: [[4, 8, 12, 16]], o: 2 }] },
    'Maximum Points You Can Obtain from Cards': { fn: 'maxScore', tc: [{ i: [[1, 2, 3, 4, 5, 6, 1], 3], o: 12 }, { i: [[2, 2, 2], 5], o: 6 }] },
    'Maximum Sum of Distinct Subarrays': { fn: 'maximumSubarraySum', tc: [{ i: [[1, 5, 4, 2, 9, 9, 9], 3], o: 15 }] },
    'Minimum Operations to Reduce X to Zero': { fn: 'minOperations', tc: [{ i: [[1, 1, 4, 2, 3], 5], o: 2 }, { i: [[5, 6, 7, 8, 9], 4], o: -1 }] },
    'Number of Sub-arrays of Size K': { fn: 'numOfSubarrays', tc: [{ i: [[2, 2, 2, 2, 5, 5, 5, 8], 3, 4], o: 3 }] },
    'Sliding Window Maximum': { fn: 'maxSlidingWindow', tc: [{ i: [[1, 3, -1, -3, 5, 3, 6, 7], 3], o: [3, 3, 5, 5, 6, 7] }] },
    'Subarrays with K Different Integers': { fn: 'subarraysWithKDistinct', tc: [{ i: [[1, 2, 1, 2, 3], 2], o: 7 }, { i: [[1, 2, 1, 3, 4], 3], o: 3 }] },
    'Substring with Concatenation of All Words': { fn: 'findSubstring', tc: [{ i: ["barfoothefoobarman", ["foo", "bar"]], o: [0, 9] }] },

    // ===== MEDIUM - Linked List =====
    'Add Two Numbers II': { fn: 'addTwoNumbers', tc: [{ i: [[7, 2, 4, 3], [5, 6, 4]], o: [7, 8, 0, 7] }] },
    'Copy List with Random Pointer': { fn: 'copyRandomList', tc: [{ i: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]], o: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }] },
    'Design Browser History': { fn: 'BrowserHistory', tc: [{ i: [], o: "class" }] },
    'Design Linked List': { fn: 'MyLinkedList', tc: [{ i: [], o: "class" }] },
    'LRU Cache': { fn: 'LRUCache', tc: [{ i: [], o: "class" }] },
    'Odd Even Linked List': { fn: 'oddEvenList', tc: [{ i: [[1, 2, 3, 4, 5]], o: [1, 3, 5, 2, 4] }, { i: [[2, 1, 3, 5, 6, 4, 7]], o: [2, 3, 6, 7, 1, 5, 4] }] },
    'Remove Nth Node From End of List': { fn: 'removeNthFromEnd', tc: [{ i: [[1, 2, 3, 4, 5], 2], o: [1, 2, 3, 5] }, { i: [[1], 1], o: [] }] },
    'Reorder List': { fn: 'reorderList', tc: [{ i: [[1, 2, 3, 4]], o: [1, 4, 2, 3] }, { i: [[1, 2, 3, 4, 5]], o: [1, 5, 2, 4, 3] }] },
    'Reverse Linked List II': { fn: 'reverseBetween', tc: [{ i: [[1, 2, 3, 4, 5], 2, 4], o: [1, 4, 3, 2, 5] }, { i: [[5], 1, 1], o: [5] }] },
    'Sort List': { fn: 'sortList', tc: [{ i: [[4, 2, 1, 3]], o: [1, 2, 3, 4] }, { i: [[-1, 5, 3, 4, 0]], o: [-1, 0, 3, 4, 5] }] },
    'Swap Nodes in Pairs': { fn: 'swapPairs', tc: [{ i: [[1, 2, 3, 4]], o: [2, 1, 4, 3] }, { i: [[]], o: [] }, { i: [[1]], o: [1] }] },

    // ===== MEDIUM - Tree =====
    'Binary Search Tree Iterator': { fn: 'BSTIterator', tc: [{ i: [], o: "class" }] },
    'Binary Tree Level Order Traversal II': { fn: 'levelOrderBottom', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: [[15, 7], [9, 20], [3]] }] },
    'Binary Tree Right Side View': { fn: 'rightSideView', tc: [{ i: [[1, 2, 3, null, 5, null, 4]], o: [1, 3, 4] }, { i: [[1, null, 3]], o: [1, 3] }] },
    'Binary Tree Zigzag Level Order': { fn: 'zigzagLevelOrder', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: [[3], [20, 9], [15, 7]] }] },
    'Count Good Nodes in Binary Tree': { fn: 'goodNodes', tc: [{ i: [[3, 1, 4, 3, null, 1, 5]], o: 4 }, { i: [[3, 3, null, 4, 2]], o: 3 }] },
    'Delete Node in a BST': { fn: 'deleteNode', tc: [{ i: [[5, 3, 6, 2, 4, null, 7], 3], o: [5, 4, 6, 2, null, null, 7] }] },
    'Insert into a BST': { fn: 'insertIntoBST', tc: [{ i: [[4, 2, 7, 1, 3], 5], o: [4, 2, 7, 1, 3, 5] }] },
    'Kth Smallest Element in BST': { fn: 'kthSmallest', tc: [{ i: [[3, 1, 4, null, 2], 1], o: 1 }, { i: [[5, 3, 6, 2, 4, null, null, 1], 3], o: 3 }] },
    'Lowest Common Ancestor of Binary Tree': { fn: 'lowestCommonAncestor', tc: [{ i: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], o: 3 }, { i: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], o: 5 }] },
    'Path Sum II': { fn: 'pathSum', tc: [{ i: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], 22], o: [[5, 4, 11, 2], [5, 8, 4, 5]] }] },
    'Path Sum III': { fn: 'pathSum', tc: [{ i: [[10, 5, -3, 3, 2, null, 11, 3, -2, null, 1], 8], o: 3 }] },
    'Populating Next Right Pointers': { fn: 'connect', tc: [{ i: [[1, 2, 3, 4, 5, 6, 7]], o: [1, 2, 3, 4, 5, 6, 7] }] },
    'Sum Root to Leaf Numbers': { fn: 'sumNumbers', tc: [{ i: [[1, 2, 3]], o: 25 }, { i: [[4, 9, 0, 5, 1]], o: 1026 }] },

    // ===== MEDIUM - Heap =====
    'K Closest Points to Origin': { fn: 'kClosest', tc: [{ i: [[[1, 3], [-2, 2]], 1], o: [[-2, 2]] }, { i: [[[3, 3], [5, -1], [-2, 4]], 2], o: [[3, 3], [-2, 4]] }] },
    'Kth Smallest Element in a Sorted Matrix': { fn: 'kthSmallest', tc: [{ i: [[[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8], o: 13 }] },
    'Meeting Rooms II': { fn: 'minMeetingRooms', tc: [{ i: [[[0, 30], [5, 10], [15, 20]]], o: 2 }, { i: [[[7, 10], [2, 4]]], o: 1 }] },
    'Reorganize String': { fn: 'reorganizeString', tc: [{ i: ["aab"], o: "aba" }, { i: ["aaab"], o: "" }] },
    'Top K Frequent Words': { fn: 'topKFrequent', tc: [{ i: [["i", "love", "leetcode", "i", "love", "coding"], 2], o: ["i", "love"] }] },

    // ===== MEDIUM - Trie =====
    'Design Add and Search Words Data Structure': { fn: 'WordDictionary', tc: [{ i: [], o: "class" }] },
    'Implement Trie (Prefix Tree)': { fn: 'Trie', tc: [{ i: [], o: "class" }] },
    'Search Suggestions System': { fn: 'suggestedProducts', tc: [{ i: [["mobile", "mouse", "moneypot", "monitor", "mousepad"], "mouse"], o: [["mobile", "moneypot", "monitor"], ["mobile", "moneypot", "monitor"], ["mouse", "mousepad"], ["mouse", "mousepad"], ["mouse", "mousepad"]] }] },
    'Replace Words': { fn: 'replaceWords', tc: [{ i: [["cat", "bat", "rat"], "the cattle was rattled by the battery"], o: "the cat was rat by the bat" }] },

    // ===== MEDIUM - Greedy =====
    'Advantage Shuffle': { fn: 'advantageCount', tc: [{ i: [[2, 7, 11, 15], [1, 10, 4, 11]], o: [2, 11, 7, 15] }] },
    'Bag of Tokens': { fn: 'bagOfTokensScore', tc: [{ i: [[100, 200, 300, 400], 200], o: 2 }] },
    'Broken Calculator': { fn: 'brokenCalc', tc: [{ i: [2, 3], o: 2 }, { i: [5, 8], o: 2 }, { i: [3, 10], o: 3 }] },
    'Largest Number': { fn: 'largestNumber', tc: [{ i: [[10, 2]], o: "210" }, { i: [[3, 30, 34, 5, 9]], o: "9534330" }] },
    'Maximum Swap': { fn: 'maximumSwap', tc: [{ i: [2736], o: 7236 }, { i: [9973], o: 9973 }] },
    'Minimum Number of Arrows to Burst Balloons': { fn: 'findMinArrowShots', tc: [{ i: [[[10, 16], [2, 8], [1, 6], [7, 12]]], o: 2 }] },
    'Queue Reconstruction by Height': { fn: 'reconstructQueue', tc: [{ i: [[[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]]], o: [[5, 0], [7, 0], [5, 2], [6, 1], [4, 4], [7, 1]] }] },
    'Remove Duplicate Letters': { fn: 'removeDuplicateLetters', tc: [{ i: ["bcabc"], o: "abc" }, { i: ["cbacdcbc"], o: "acdb" }] },

    // ===== HARD =====
    'Binary Tree Maximum Path Sum': { fn: 'maxPathSum', tc: [{ i: [[1, 2, 3]], o: 6 }, { i: [[-10, 9, 20, null, null, 15, 7]], o: 42 }] },
    'Burst Balloons': { fn: 'maxCoins', tc: [{ i: [[3, 1, 5, 8]], o: 167 }, { i: [[1, 5]], o: 10 }] },
    'Edit Distance': { fn: 'minDistance', tc: [{ i: ["horse", "ros"], o: 3 }, { i: ["intention", "execution"], o: 5 }] },
    'Find Median from Data Stream': { fn: 'MedianFinder', tc: [{ i: [], o: "class" }] },
    'Largest Rectangle in Histogram': { fn: 'largestRectangleArea', tc: [{ i: [[2, 1, 5, 6, 2, 3]], o: 10 }, { i: [[2, 4]], o: 4 }] },
    'Merge K Sorted Lists': { fn: 'mergeKLists', tc: [{ i: [[[1, 4, 5], [1, 3, 4], [2, 6]]], o: [1, 1, 2, 3, 4, 4, 5, 6] }, { i: [[]], o: [] }] },
    'N-Queens': { fn: 'solveNQueens', tc: [{ i: [4], o: [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]] }] },
    'Reverse Nodes in k-Group': { fn: 'reverseKGroup', tc: [{ i: [[1, 2, 3, 4, 5], 2], o: [2, 1, 4, 3, 5] }, { i: [[1, 2, 3, 4, 5], 3], o: [3, 2, 1, 4, 5] }] },
    'Serialize and Deserialize Binary Tree': { fn: 'Codec', tc: [{ i: [], o: "class" }] },
    'Sliding Window Median': { fn: 'medianSlidingWindow', tc: [{ i: [[1, 3, -1, -3, 5, 3, 6, 7], 3], o: [1.0, -1.0, -1.0, 3.0, 5.0, 6.0] }] },
    'Split Array Largest Sum': { fn: 'splitArray', tc: [{ i: [[7, 2, 5, 10, 8], 2], o: 18 }] },
    'Sudoku Solver': { fn: 'solveSudoku', tc: [{ i: [], o: "class" }] },
    'Word Break II': { fn: 'wordBreak', tc: [{ i: ["catsanddog", ["cat", "cats", "and", "sand", "dog"]], o: ["cats and dog", "cat sand dog"] }] },
    'Word Ladder': { fn: 'ladderLength', tc: [{ i: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], o: 5 }, { i: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], o: 0 }] },
    'Regular Expression Matching': { fn: 'isMatch', tc: [{ i: ["aa", "a"], o: false }, { i: ["aa", "a*"], o: true }, { i: ["ab", ".*"], o: true }] },
    'Wildcard Matching': { fn: 'isMatch', tc: [{ i: ["aa", "a"], o: false }, { i: ["aa", "*"], o: true }, { i: ["cb", "?a"], o: false }] },
    'Trapping Rain Water II': { fn: 'trapRainWater', tc: [{ i: [[[1, 4, 3, 1, 3, 2], [3, 2, 1, 3, 2, 4], [2, 3, 3, 2, 3, 1]]], o: 4 }] },
    'Distinct Subsequences': { fn: 'numDistinct', tc: [{ i: ["rabbbit", "rabbit"], o: 3 }, { i: ["babgbag", "bag"], o: 5 }] },
    'Longest Increasing Path in a Matrix': { fn: 'longestIncreasingPath', tc: [{ i: [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], o: 4 }, { i: [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], o: 4 }] },

    // ===== remaining Medium misc =====
    'Circular Array Loop': { fn: 'circularArrayLoop', tc: [{ i: [[2, -1, 1, 2, 2]], o: true }, { i: [[-1, 2]], o: false }] },
    'Find All Duplicates in Array': { fn: 'findDuplicates', tc: [{ i: [[4, 3, 2, 7, 8, 2, 3, 1]], o: [2, 3] }, { i: [[1, 1, 2]], o: [1] }] },
    'Find Duplicate Number': { fn: 'findDuplicate', tc: [{ i: [[1, 3, 4, 2, 2]], o: 2 }, { i: [[3, 1, 3, 4, 2]], o: 3 }] },
    'Game of Life': { fn: 'gameOfLife', tc: [{ i: [[[0, 1, 0], [0, 0, 1], [1, 1, 1], [0, 0, 0]]], o: [[0, 0, 0], [1, 0, 1], [0, 1, 1], [0, 1, 0]] }] },
    'Linked List Cycle II': { fn: 'detectCycle', tc: [{ i: [[3, 2, 0, -4], 1], o: 1 }, { i: [[1, 2], -1], o: -1 }] },
    'Minimize Maximum Pair Sum': { fn: 'minPairSum', tc: [{ i: [[3, 5, 2, 3]], o: 7 }, { i: [[3, 5, 4, 2, 4, 6]], o: 8 }] },
    'Number of Subsequences': { fn: 'numSubseq', tc: [{ i: [[3, 5, 6, 7], 9], o: 4 }, { i: [[3, 3, 6, 8], 10], o: 6 }] },
    'Partition List': { fn: 'partition', tc: [{ i: [[1, 4, 3, 2, 5, 2], 3], o: [1, 2, 2, 4, 3, 5] }, { i: [[2, 1], 2], o: [1, 2] }] },
    'Remove Duplicates from Sorted Array II': { fn: 'removeDuplicates', tc: [{ i: [[1, 1, 1, 2, 2, 3]], o: 5 }, { i: [[0, 0, 1, 1, 1, 1, 2, 3, 3]], o: 7 }] },
    'Remove Duplicates from Sorted List II': { fn: 'deleteDuplicates', tc: [{ i: [[1, 2, 3, 3, 4, 4, 5]], o: [1, 2, 5] }, { i: [[1, 1, 1, 2, 3]], o: [2, 3] }] },
    'Reverse Words in a String': { fn: 'reverseWords', tc: [{ i: ["the sky is blue"], o: "blue is sky the" }, { i: ["  hello world  "], o: "world hello" }] },
    'Search a 2D Matrix II': { fn: 'searchMatrix', tc: [{ i: [[[1, 4, 7, 11, 15], [2, 5, 8, 12, 19], [3, 6, 9, 16, 22], [10, 13, 14, 17, 24], [18, 21, 23, 26, 30]], 5], o: true }] },
    'Sort Transformed Array': { fn: 'sortTransformedArray', tc: [{ i: [[-4, -2, 2, 4], 1, 3, 5], o: [3, 9, 15, 33] }] },
    'Wiggle Sort': { fn: 'wiggleSort', tc: [{ i: [[3, 5, 2, 1, 6, 4]], o: [3, 5, 1, 6, 2, 4] }] },
    'Wiggle Sort II': { fn: 'wiggleSort', tc: [{ i: [[1, 5, 1, 1, 6, 4]], o: [1, 6, 1, 5, 1, 4] }] },
    'Valid Sudoku': { fn: 'isValidSudoku', tc: [{ i: [[["5", "3", ".", ".", "7", ".", ".", ".", "."], ["6", ".", ".", "1", "9", "5", ".", ".", "."], [".", "9", "8", ".", ".", ".", ".", "6", "."], ["8", ".", ".", ".", "6", ".", ".", ".", "3"], ["4", ".", ".", "8", ".", "3", ".", ".", "1"], ["7", ".", ".", ".", "2", ".", ".", ".", "6"], [".", "6", ".", ".", ".", ".", "2", "8", "."], [".", ".", ".", "4", "1", "9", ".", ".", "5"], [".", ".", ".", ".", "8", ".", ".", "7", "9"]]], o: true }] },
    'Rotate List': { fn: 'rotateRight', tc: [{ i: [[1, 2, 3, 4, 5], 2], o: [4, 5, 1, 2, 3] }, { i: [[0, 1, 2], 4], o: [2, 0, 1] }] },
};

function genStarter(fnName, title) {
    return {
        python: `def ${fnName}(*args):\n    # Your code here\n    pass`,
        javascript: `function ${fnName}(...args) {\n    // Your code here\n}`,
        cpp: `// Implement ${title}`,
        java: `// Implement ${title}`
    };
}

function genExamples(tc, title) {
    return tc.slice(0, 2).map((t, idx) => ({
        input: JSON.stringify(t.i),
        output: JSON.stringify(t.o),
        explanation: idx === 0 ? `Example for ${title}` : undefined
    }));
}

async function main() {
    console.log('Fetching problems with placeholder test cases...');
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, description')
        .order('id');

    if (error) { console.error('Error:', error); return; }

    // Filter to only placeholder problems
    const { data: placeholders } = await supabaseAdmin
        .from('problems')
        .select('id, title')
        .filter('test_cases', 'cs', '[{"input":["example_input"],"output":"example_output"}]');

    const placeholderIds = new Set((placeholders || []).map(p => p.id));
    const toUpdate = problems.filter(p => placeholderIds.has(p.id));

    console.log(`Found ${toUpdate.length} problems with placeholder test cases`);

    let updated = 0, skipped = 0;

    for (const p of toUpdate) {
        const testData = ALL_TEST_DATA[p.title];
        if (!testData) { skipped++; continue; }
        if (testData.tc[0]?.o === 'class') { skipped++; continue; }

        const testCases = testData.tc.map(t => ({ input: t.i, output: t.o }));
        const starterCode = genStarter(testData.fn, p.title);
        const examples = genExamples(testData.tc, p.title);
        const description = p.description && !p.description.startsWith('Solve the')
            ? p.description
            : `Given inputs, implement the ${testData.fn} function to solve ${p.title}.`;

        const { error: upErr } = await supabaseAdmin
            .from('problems')
            .update({ test_cases: testCases, starter_code: starterCode, examples, description })
            .eq('id', p.id);

        if (upErr) console.error(`Error ${p.title}:`, upErr.message);
        else updated++;
    }

    console.log(`\nDone: ${updated} updated, ${skipped} skipped`);

    // Final check
    const { data: check } = await supabaseAdmin
        .from('problems')
        .select('id')
        .filter('test_cases', 'cs', '[{"input":["example_input"],"output":"example_output"}]');

    console.log(`Remaining placeholder problems: ${check?.length || 0}/425`);
}

main().catch(console.error);
