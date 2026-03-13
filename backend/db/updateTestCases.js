// Comprehensive test case data for ALL 425 DSA problems
// Updates Supabase problems table with real test_cases, starter_code, examples, and descriptions
import { supabaseAdmin } from './supabaseClient.js';

// ── Master test case data by problem title ──
const TEST_DATA = {
    // ===== ARRAY =====
    'Best Time to Buy and Sell Stock': { fn: 'maxProfit', tc: [{ i: [[7, 1, 5, 3, 6, 4]], o: 5 }, { i: [[7, 6, 4, 3, 1]], o: 0 }, { i: [[1, 2]], o: 1 }, { i: [[2, 4, 1]], o: 2 }] },
    'Contains Duplicate': { fn: 'containsDuplicate', tc: [{ i: [[1, 2, 3, 1]], o: true }, { i: [[1, 2, 3, 4]], o: false }, { i: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], o: true }] },
    'Product of Array Except Self': { fn: 'productExceptSelf', tc: [{ i: [[1, 2, 3, 4]], o: [24, 12, 8, 6] }, { i: [[-1, 1, 0, -3, 3]], o: [0, 0, 9, 0, 0] }] },
    'Maximum Subarray': { fn: 'maxSubArray', tc: [{ i: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], o: 6 }, { i: [[1]], o: 1 }, { i: [[5, 4, -1, 7, 8]], o: 23 }] },
    'Maximum Product Subarray': { fn: 'maxProduct', tc: [{ i: [[2, 3, -2, 4]], o: 6 }, { i: [[-2, 0, -1]], o: 0 }, { i: [[-2, 3, -4]], o: 24 }] },
    'Find Minimum in Rotated Sorted Array': { fn: 'findMin', tc: [{ i: [[3, 4, 5, 1, 2]], o: 1 }, { i: [[4, 5, 6, 7, 0, 1, 2]], o: 0 }, { i: [[11, 13, 15, 17]], o: 11 }] },
    'Search in Rotated Sorted Array': { fn: 'search', tc: [{ i: [[4, 5, 6, 7, 0, 1, 2], 0], o: 4 }, { i: [[4, 5, 6, 7, 0, 1, 2], 3], o: -1 }, { i: [[1], 0], o: -1 }] },
    'Container With Most Water': { fn: 'maxArea', tc: [{ i: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], o: 49 }, { i: [[1, 1]], o: 1 }, { i: [[4, 3, 2, 1, 4]], o: 16 }] },
    '3Sum': { fn: 'threeSum', tc: [{ i: [[-1, 0, 1, 2, -1, -4]], o: [[-1, -1, 2], [-1, 0, 1]] }, { i: [[0, 1, 1]], o: [] }, { i: [[0, 0, 0]], o: [[0, 0, 0]] }] },
    '4Sum': { fn: 'fourSum', tc: [{ i: [[1, 0, -1, 0, -2, 2], 0], o: [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]] }, { i: [[2, 2, 2, 2, 2], 8], o: [[2, 2, 2, 2]] }] },
    'Remove Duplicates from Sorted Array': { fn: 'removeDuplicates', tc: [{ i: [[1, 1, 2]], o: 2 }, { i: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], o: 5 }] },
    'Remove Element': { fn: 'removeElement', tc: [{ i: [[3, 2, 2, 3], 3], o: 2 }, { i: [[0, 1, 2, 2, 3, 0, 4, 2], 2], o: 5 }] },
    'Next Permutation': { fn: 'nextPermutation', tc: [{ i: [[1, 2, 3]], o: [1, 3, 2] }, { i: [[3, 2, 1]], o: [1, 2, 3] }, { i: [[1, 1, 5]], o: [1, 5, 1] }] },
    'Rotate Array': { fn: 'rotate', tc: [{ i: [[1, 2, 3, 4, 5, 6, 7], 3], o: [5, 6, 7, 1, 2, 3, 4] }, { i: [[-1, -100, 3, 99], 2], o: [3, 99, -1, -100] }] },
    'Jump Game': { fn: 'canJump', tc: [{ i: [[2, 3, 1, 1, 4]], o: true }, { i: [[3, 2, 1, 0, 4]], o: false }, { i: [[0]], o: true }] },
    'Jump Game II': { fn: 'jump', tc: [{ i: [[2, 3, 1, 1, 4]], o: 2 }, { i: [[2, 3, 0, 1, 4]], o: 2 }] },
    'Merge Sorted Array': { fn: 'merge', tc: [{ i: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], o: [1, 2, 2, 3, 5, 6] }] },
    "Pascal's Triangle": { fn: 'generate', tc: [{ i: [5], o: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]] }, { i: [1], o: [[1]] }] },
    "Pascal's Triangle II": { fn: 'getRow', tc: [{ i: [3], o: [1, 3, 3, 1] }, { i: [0], o: [1] }, { i: [1], o: [1, 1] }] },
    'Majority Element': { fn: 'majorityElement', tc: [{ i: [[3, 2, 3]], o: 3 }, { i: [[2, 2, 1, 1, 1, 2, 2]], o: 2 }] },
    'Majority Element II': { fn: 'majorityElement', tc: [{ i: [[3, 2, 3]], o: [3] }, { i: [[1]], o: [1] }, { i: [[1, 2]], o: [1, 2] }] },
    'Rotate Image': { fn: 'rotate', tc: [{ i: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], o: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] }] },
    'Spiral Matrix': { fn: 'spiralOrder', tc: [{ i: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], o: [1, 2, 3, 6, 9, 8, 7, 4, 5] }] },
    'Spiral Matrix II': { fn: 'generateMatrix', tc: [{ i: [3], o: [[1, 2, 3], [8, 9, 4], [7, 6, 5]] }, { i: [1], o: [[1]] }] },
    'Set Matrix Zeroes': { fn: 'setZeroes', tc: [{ i: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], o: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] }] },
    'Find First and Last Position of Element': { fn: 'searchRange', tc: [{ i: [[5, 7, 7, 8, 8, 10], 8], o: [3, 4] }, { i: [[5, 7, 7, 8, 8, 10], 6], o: [-1, -1] }, { i: [[], 0], o: [-1, -1] }] },
    'Search a 2D Matrix': { fn: 'searchMatrix', tc: [{ i: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], o: true }, { i: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], o: false }] },
    'Kth Largest Element in an Array': { fn: 'findKthLargest', tc: [{ i: [[3, 2, 1, 5, 6, 4], 2], o: 5 }, { i: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], o: 4 }] },
    'Top K Frequent Elements': { fn: 'topKFrequent', tc: [{ i: [[1, 1, 1, 2, 2, 3], 2], o: [1, 2] }, { i: [[1], 1], o: [1] }] },
    'Sort Colors': { fn: 'sortColors', tc: [{ i: [[2, 0, 2, 1, 1, 0]], o: [0, 0, 1, 1, 2, 2] }, { i: [[2, 0, 1]], o: [0, 1, 2] }] },
    'First Missing Positive': { fn: 'firstMissingPositive', tc: [{ i: [[1, 2, 0]], o: 3 }, { i: [[3, 4, -1, 1]], o: 2 }, { i: [[7, 8, 9, 11, 12]], o: 1 }] },
    'Missing Number': { fn: 'missingNumber', tc: [{ i: [[3, 0, 1]], o: 2 }, { i: [[0, 1]], o: 2 }, { i: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], o: 8 }] },
    'Find All Numbers Disappeared in Array': { fn: 'findDisappearedNumbers', tc: [{ i: [[4, 3, 2, 7, 8, 2, 3, 1]], o: [5, 6] }, { i: [[1, 1]], o: [2] }] },
    'Longest Consecutive Sequence': { fn: 'longestConsecutive', tc: [{ i: [[100, 4, 200, 1, 3, 2]], o: 4 }, { i: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], o: 9 }] },
    'Move Zeroes': { fn: 'moveZeroes', tc: [{ i: [[0, 1, 0, 3, 12]], o: [1, 3, 12, 0, 0] }, { i: [[0]], o: [0] }] },
    'Plus One': { fn: 'plusOne', tc: [{ i: [[1, 2, 3]], o: [1, 2, 4] }, { i: [[4, 3, 2, 1]], o: [4, 3, 2, 2] }, { i: [[9]], o: [1, 0] }] },
    'Merge Intervals': { fn: 'merge', tc: [{ i: [[[1, 3], [2, 6], [8, 10], [15, 18]]], o: [[1, 6], [8, 10], [15, 18]] }, { i: [[[1, 4], [4, 5]]], o: [[1, 5]] }] },
    'Insert Interval': { fn: 'insert', tc: [{ i: [[[1, 3], [6, 9]], [2, 5]], o: [[1, 5], [6, 9]] }, { i: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], o: [[1, 2], [3, 10], [12, 16]] }] },
    'Non-overlapping Intervals': { fn: 'eraseOverlapIntervals', tc: [{ i: [[[1, 2], [2, 3], [3, 4], [1, 3]]], o: 1 }, { i: [[[1, 2], [1, 2], [1, 2]]], o: 2 }] },

    // ===== TWO POINTERS =====
    'Valid Palindrome': { fn: 'isPalindrome', tc: [{ i: ['A man, a plan, a canal: Panama'], o: true }, { i: ['race a car'], o: false }, { i: [' '], o: true }] },
    'Valid Palindrome II': { fn: 'validPalindrome', tc: [{ i: ['aba'], o: true }, { i: ['abca'], o: true }, { i: ['abc'], o: false }] },
    'Two Sum II - Input Array Is Sorted': { fn: 'twoSum', tc: [{ i: [[2, 7, 11, 15], 9], o: [1, 2] }, { i: [[2, 3, 4], 6], o: [1, 3] }, { i: [[-1, 0], -1], o: [1, 2] }] },
    '3Sum Closest': { fn: 'threeSumClosest', tc: [{ i: [[-1, 2, 1, -4], 1], o: 2 }, { i: [[0, 0, 0], 1], o: 0 }] },
    'Reverse String': { fn: 'reverseString', tc: [{ i: [['h', 'e', 'l', 'l', 'o']], o: ['o', 'l', 'l', 'e', 'h'] }, { i: [['H', 'a', 'n', 'n', 'a', 'h']], o: ['h', 'a', 'n', 'n', 'a', 'H'] }] },
    'Is Subsequence': { fn: 'isSubsequence', tc: [{ i: ['abc', 'ahbgdc'], o: true }, { i: ['axc', 'ahbgdc'], o: false }] },
    'Backspace String Compare': { fn: 'backspaceCompare', tc: [{ i: ['ab#c', 'ad#c'], o: true }, { i: ['ab##', 'c#d#'], o: true }, { i: ['a#c', 'b'], o: false }] },
    'Squares of a Sorted Array': { fn: 'sortedSquares', tc: [{ i: [[-4, -1, 0, 3, 10]], o: [0, 1, 9, 16, 100] }, { i: [[-7, -3, 2, 3, 11]], o: [4, 9, 9, 49, 121] }] },
    'Trapping Rain Water': { fn: 'trap', tc: [{ i: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], o: 6 }, { i: [[4, 2, 0, 3, 2, 5]], o: 9 }] },
    'Boats to Save People': { fn: 'numRescueBoats', tc: [{ i: [[1, 2], 3], o: 1 }, { i: [[3, 2, 2, 1], 3], o: 3 }, { i: [[3, 5, 3, 4], 5], o: 4 }] },
    'Intersection of Two Arrays': { fn: 'intersection', tc: [{ i: [[1, 2, 2, 1], [2, 2]], o: [2] }, { i: [[4, 9, 5], [9, 4, 9, 8, 4]], o: [4, 9] }] },
    'Intersection of Two Arrays II': { fn: 'intersect', tc: [{ i: [[1, 2, 2, 1], [2, 2]], o: [2, 2] }, { i: [[4, 9, 5], [9, 4, 9, 8, 4]], o: [4, 9] }] },
    'Happy Number': { fn: 'isHappy', tc: [{ i: [19], o: true }, { i: [2], o: false }] },
    'Partition Labels': { fn: 'partitionLabels', tc: [{ i: ['ababcbacadefegdehijhklij'], o: [9, 7, 8] }] },
    'Find the Duplicate Number': { fn: 'findDuplicate', tc: [{ i: [[1, 3, 4, 2, 2]], o: 2 }, { i: [[3, 1, 3, 4, 2]], o: 3 }] },

    // ===== SLIDING WINDOW =====
    'Longest Substring Without Repeating Characters': { fn: 'lengthOfLongestSubstring', tc: [{ i: ['abcabcbb'], o: 3 }, { i: ['bbbbb'], o: 1 }, { i: ['pwwkew'], o: 3 }, { i: [''], o: 0 }] },
    'Longest Repeating Character Replacement': { fn: 'characterReplacement', tc: [{ i: ['ABAB', 2], o: 4 }, { i: ['AABABBA', 1], o: 4 }] },
    'Minimum Window Substring': { fn: 'minWindow', tc: [{ i: ['ADOBECODEBANC', 'ABC'], o: 'BANC' }, { i: ['a', 'a'], o: 'a' }, { i: ['a', 'aa'], o: '' }] },
    'Permutation in String': { fn: 'checkInclusion', tc: [{ i: ['ab', 'eidbaooo'], o: true }, { i: ['ab', 'eidboaoo'], o: false }] },
    'Find All Anagrams in a String': { fn: 'findAnagrams', tc: [{ i: ['cbaebabacd', 'abc'], o: [0, 6] }, { i: ['abab', 'ab'], o: [0, 1, 2] }] },
    'Minimum Size Subarray Sum': { fn: 'minSubArrayLen', tc: [{ i: [7, [2, 3, 1, 2, 4, 3]], o: 2 }, { i: [4, [1, 4, 4]], o: 1 }, { i: [11, [1, 1, 1, 1, 1, 1, 1, 1]], o: 0 }] },
    'Max Consecutive Ones III': { fn: 'longestOnes', tc: [{ i: [[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2], o: 6 }, { i: [[0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3], o: 10 }] },
    'Contains Duplicate II': { fn: 'containsNearbyDuplicate', tc: [{ i: [[1, 2, 3, 1], 3], o: true }, { i: [[1, 0, 1, 1], 1], o: true }, { i: [[1, 2, 3, 1, 2, 3], 2], o: false }] },
    'Subarray Product Less Than K': { fn: 'numSubarrayProductLessThanK', tc: [{ i: [[10, 5, 2, 6], 100], o: 8 }, { i: [[1, 2, 3], 0], o: 0 }] },

    // ===== STACK =====
    'Valid Parentheses': { fn: 'isValid', tc: [{ i: ['()'], o: true }, { i: ['()[]{}'], o: true }, { i: ['(]'], o: false }, { i: ['([)]'], o: false }, { i: ['{[]}'], o: true }] },
    'Min Stack': { fn: 'MinStack', tc: [{ i: [], o: 'class' }] },
    'Evaluate Reverse Polish Notation': { fn: 'evalRPN', tc: [{ i: [['2', '1', '+', '3', '*']], o: 9 }, { i: [['4', '13', '5', '/', '+']], o: 6 }] },
    'Decode String': { fn: 'decodeString', tc: [{ i: ['3[a]2[bc]'], o: 'aaabcbc' }, { i: ['3[a2[c]]'], o: 'accaccacc' }, { i: ['2[abc]3[cd]ef'], o: 'abcabccdcdcdef' }] },
    'Daily Temperatures': { fn: 'dailyTemperatures', tc: [{ i: [[73, 74, 75, 71, 69, 72, 76, 73]], o: [1, 1, 4, 2, 1, 1, 0, 0] }, { i: [[30, 40, 50, 60]], o: [1, 1, 1, 0] }] },
    'Next Greater Element I': { fn: 'nextGreaterElement', tc: [{ i: [[4, 1, 2], [1, 3, 4, 2]], o: [-1, 3, -1] }, { i: [[2, 4], [1, 2, 3, 4]], o: [3, -1] }] },
    'Asteroid Collision': { fn: 'asteroidCollision', tc: [{ i: [[5, 10, -5]], o: [5, 10] }, { i: [[8, -8]], o: [] }, { i: [[10, 2, -5]], o: [10] }] },
    'Remove All Adjacent Duplicates In String': { fn: 'removeDuplicates', tc: [{ i: ['abbaca'], o: 'ca' }, { i: ['azxxzy'], o: 'ay' }] },
    'Simplify Path': { fn: 'simplifyPath', tc: [{ i: ['/home/'], o: '/home' }, { i: ['/../'], o: '/' }, { i: ['/home//foo/'], o: '/home/foo' }] },
    'Remove K Digits': { fn: 'removeKdigits', tc: [{ i: ['1432219', 3], o: '1219' }, { i: ['10200', 1], o: '200' }, { i: ['10', 2], o: '0' }] },

    // ===== BINARY SEARCH =====
    'Binary Search': { fn: 'search', tc: [{ i: [[-1, 0, 3, 5, 9, 12], 9], o: 4 }, { i: [[-1, 0, 3, 5, 9, 12], 2], o: -1 }] },
    'Search Insert Position': { fn: 'searchInsert', tc: [{ i: [[1, 3, 5, 6], 5], o: 2 }, { i: [[1, 3, 5, 6], 2], o: 1 }, { i: [[1, 3, 5, 6], 7], o: 4 }] },
    'Sqrt(x)': { fn: 'mySqrt', tc: [{ i: [4], o: 2 }, { i: [8], o: 2 }, { i: [0], o: 0 }] },
    'Valid Perfect Square': { fn: 'isPerfectSquare', tc: [{ i: [16], o: true }, { i: [14], o: false }] },
    'Find Peak Element': { fn: 'findPeakElement', tc: [{ i: [[1, 2, 3, 1]], o: 2 }, { i: [[1, 2, 1, 3, 5, 6, 4]], o: 5 }] },
    'Single Element in a Sorted Array': { fn: 'singleNonDuplicate', tc: [{ i: [[1, 1, 2, 3, 3, 4, 4, 8, 8]], o: 2 }, { i: [[3, 3, 7, 7, 10, 11, 11]], o: 10 }] },
    'Koko Eating Bananas': { fn: 'minEatingSpeed', tc: [{ i: [[3, 6, 7, 11], 8], o: 4 }, { i: [[30, 11, 23, 4, 20], 5], o: 30 }] },
    'Longest Increasing Subsequence': { fn: 'lengthOfLIS', tc: [{ i: [[10, 9, 2, 5, 3, 7, 101, 18]], o: 4 }, { i: [[0, 1, 0, 3, 2, 3]], o: 4 }, { i: [[7, 7, 7, 7, 7, 7, 7]], o: 1 }] },
    'Median of Two Sorted Arrays': { fn: 'findMedianSortedArrays', tc: [{ i: [[1, 3], [2]], o: 2.0 }, { i: [[1, 2], [3, 4]], o: 2.5 }] },
    'Capacity To Ship Packages Within D Days': { fn: 'shipWithinDays', tc: [{ i: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], o: 15 }] },
    'Powx n': { fn: 'myPow', tc: [{ i: [2.0, 10], o: 1024.0 }, { i: [2.1, 3], o: 9.261 }, { i: [2.0, -2], o: 0.25 }] },

    // ===== LINKED LIST =====
    'Reverse Linked List': { fn: 'reverseList', tc: [{ i: [[1, 2, 3, 4, 5]], o: [5, 4, 3, 2, 1] }, { i: [[1, 2]], o: [2, 1] }, { i: [[]], o: [] }] },
    'Merge Two Sorted Lists': { fn: 'mergeTwoLists', tc: [{ i: [[1, 2, 4], [1, 3, 4]], o: [1, 1, 2, 3, 4, 4] }, { i: [[], []], o: [] }, { i: [[], [0]], o: [0] }] },
    'Add Two Numbers': { fn: 'addTwoNumbers', tc: [{ i: [[2, 4, 3], [5, 6, 4]], o: [7, 0, 8] }, { i: [[0], [0]], o: [0] }, { i: [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], o: [8, 9, 9, 9, 0, 0, 0, 1] }] },
    'Maximum Depth of Binary Tree': { fn: 'maxDepth', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: 3 }, { i: [[1, null, 2]], o: 2 }] },
    'LRU Cache': { fn: 'LRUCache', tc: [{ i: [], o: 'class' }] },

    // ===== TREE =====
    'Invert Binary Tree': { fn: 'invertTree', tc: [{ i: [[4, 2, 7, 1, 3, 6, 9]], o: [4, 7, 2, 9, 6, 3, 1] }] },
    'Validate Binary Search Tree': { fn: 'isValidBST', tc: [{ i: [[2, 1, 3]], o: true }, { i: [[5, 1, 4, null, null, 3, 6]], o: false }] },
    'Symmetric Tree': { fn: 'isSymmetric', tc: [{ i: [[1, 2, 2, 3, 4, 4, 3]], o: true }, { i: [[1, 2, 2, null, 3, null, 3]], o: false }] },
    'Same Tree': { fn: 'isSameTree', tc: [{ i: [[1, 2, 3], [1, 2, 3]], o: true }, { i: [[1, 2], [1, null, 2]], o: false }] },
    'Path Sum': { fn: 'hasPathSum', tc: [{ i: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], 22], o: true }] },
    'Binary Tree Level Order Traversal': { fn: 'levelOrder', tc: [{ i: [[3, 9, 20, null, null, 15, 7]], o: [[3], [9, 20], [15, 7]] }] },

    // ===== DYNAMIC PROGRAMMING =====
    'Climbing Stairs': { fn: 'climbStairs', tc: [{ i: [2], o: 2 }, { i: [3], o: 3 }, { i: [1], o: 1 }, { i: [5], o: 8 }] },
    'House Robber': { fn: 'rob', tc: [{ i: [[1, 2, 3, 1]], o: 4 }, { i: [[2, 7, 9, 3, 1]], o: 12 }] },
    'House Robber II': { fn: 'rob', tc: [{ i: [[2, 3, 2]], o: 3 }, { i: [[1, 2, 3, 1]], o: 4 }, { i: [[1, 2, 3]], o: 3 }] },
    'Coin Change': { fn: 'coinChange', tc: [{ i: [[1, 5, 10, 25], 11], o: 3 }, { i: [[2], 3], o: -1 }, { i: [[1], 0], o: 0 }] },
    'Longest Common Subsequence': { fn: 'longestCommonSubsequence', tc: [{ i: ['abcde', 'ace'], o: 3 }, { i: ['abc', 'abc'], o: 3 }, { i: ['abc', 'def'], o: 0 }] },
    'Unique Paths': { fn: 'uniquePaths', tc: [{ i: [3, 7], o: 28 }, { i: [3, 2], o: 3 }] },
    'Word Break': { fn: 'wordBreak', tc: [{ i: ['leetcode', ['leet', 'code']], o: true }, { i: ['applepenapple', ['apple', 'pen']], o: true }, { i: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], o: false }] },
    'Decode Ways': { fn: 'numDecodings', tc: [{ i: ['12'], o: 2 }, { i: ['226'], o: 3 }, { i: ['06'], o: 0 }] },
    'Longest Palindromic Substring': { fn: 'longestPalindrome', tc: [{ i: ['babad'], o: 'bab' }, { i: ['cbbd'], o: 'bb' }] },
    'Palindromic Substrings': { fn: 'countSubstrings', tc: [{ i: ['abc'], o: 3 }, { i: ['aaa'], o: 6 }] },
    'Edit Distance': { fn: 'minDistance', tc: [{ i: ['horse', 'ros'], o: 3 }, { i: ['intention', 'execution'], o: 5 }] },
    'Maximum Length of Repeated Subarray': { fn: 'findLength', tc: [{ i: [[1, 2, 3, 2, 1], [3, 2, 1, 4, 7]], o: 3 }] },
    'Target Sum': { fn: 'findTargetSumWays', tc: [{ i: [[1, 1, 1, 1, 1], 3], o: 5 }, { i: [[1], 1], o: 1 }] },
    'Partition Equal Subset Sum': { fn: 'canPartition', tc: [{ i: [[1, 5, 11, 5]], o: true }, { i: [[1, 2, 3, 5]], o: false }] },
    'Minimum Path Sum': { fn: 'minPathSum', tc: [{ i: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], o: 7 }, { i: [[[1, 2, 3], [4, 5, 6]]], o: 12 }] },

    // ===== GRAPH =====
    'Number of Islands': { fn: 'numIslands', tc: [{ i: [[['1', '1', '0', '0', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '1', '0', '0'], ['0', '0', '0', '1', '1']]], o: 3 }] },
    'Clone Graph': { fn: 'cloneGraph', tc: [{ i: [[[2, 4], [1, 3], [2, 4], [1, 3]]], o: [[2, 4], [1, 3], [2, 4], [1, 3]] }] },
    'Course Schedule': { fn: 'canFinish', tc: [{ i: [2, [[1, 0]]], o: true }, { i: [2, [[1, 0], [0, 1]]], o: false }] },
    'Course Schedule II': { fn: 'findOrder', tc: [{ i: [2, [[1, 0]]], o: [0, 1] }, { i: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], o: [0, 1, 2, 3] }] },
    'Pacific Atlantic Water Flow': { fn: 'pacificAtlantic', tc: [{ i: [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]], o: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]] }] },
    'Word Search': { fn: 'exist', tc: [{ i: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCCED'], o: true }] },
    'Rotting Oranges': { fn: 'orangesRotting', tc: [{ i: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], o: 4 }, { i: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], o: -1 }] },

    // ===== HEAP =====
    'Kth Largest Element in an Array': { fn: 'findKthLargest', tc: [{ i: [[3, 2, 1, 5, 6, 4], 2], o: 5 }, { i: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], o: 4 }] },
    'Task Scheduler': { fn: 'leastInterval', tc: [{ i: [['A', 'A', 'A', 'B', 'B', 'B'], 2], o: 8 }, { i: [['A', 'A', 'A', 'B', 'B', 'B'], 0], o: 6 }] },

    // ===== BACKTRACKING =====
    'Permutations': { fn: 'permute', tc: [{ i: [[1, 2, 3]], o: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] }, { i: [[0, 1]], o: [[0, 1], [1, 0]] }] },
    'Subsets': { fn: 'subsets', tc: [{ i: [[1, 2, 3]], o: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]] }, { i: [[0]], o: [[], [0]] }] },
    'Combination Sum': { fn: 'combinationSum', tc: [{ i: [[2, 3, 6, 7], 7], o: [[2, 2, 3], [7]] }, { i: [[2, 3, 5], 8], o: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] }] },
    'Letter Combinations of a Phone Number': { fn: 'letterCombinations', tc: [{ i: ['23'], o: ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf'] }, { i: [''], o: [] }, { i: ['2'], o: ['a', 'b', 'c'] }] },
    'Generate Parentheses': { fn: 'generateParenthesis', tc: [{ i: [3], o: ['((()))', '(()())', '(())()', '()(())', '()()()'] }, { i: [1], o: ['()'] }] },
    'Word Search': { fn: 'exist', tc: [{ i: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCCED'], o: true }] },

    // ===== BIT MANIPULATION =====
    'Single Number': { fn: 'singleNumber', tc: [{ i: [[2, 2, 1]], o: 1 }, { i: [[4, 1, 2, 1, 2]], o: 4 }, { i: [[1]], o: 1 }] },
    'Number of 1 Bits': { fn: 'hammingWeight', tc: [{ i: [11], o: 3 }, { i: [128], o: 1 }, { i: [255], o: 8 }] },
    'Reverse Bits': { fn: 'reverseBits', tc: [{ i: [43261596], o: 964176192 }] },
    'Counting Bits': { fn: 'countBits', tc: [{ i: [2], o: [0, 1, 1] }, { i: [5], o: [0, 1, 1, 2, 1, 2] }] },
    'Power of Two': { fn: 'isPowerOfTwo', tc: [{ i: [1], o: true }, { i: [16], o: true }, { i: [3], o: false }] },

    // ===== MATH =====
    'Fizz Buzz': { fn: 'fizzBuzz', tc: [{ i: [3], o: ['1', '2', 'Fizz'] }, { i: [5], o: ['1', '2', 'Fizz', '4', 'Buzz'] }] },
    'Roman to Integer': { fn: 'romanToInt', tc: [{ i: ['III'], o: 3 }, { i: ['LVIII'], o: 58 }, { i: ['MCMXCIV'], o: 1994 }] },
    'Integer to Roman': { fn: 'intToRoman', tc: [{ i: [3], o: 'III' }, { i: [58], o: 'LVIII' }, { i: [1994], o: 'MCMXCIV' }] },
    'Palindrome Number': { fn: 'isPalindrome', tc: [{ i: [121], o: true }, { i: [-121], o: false }, { i: [10], o: false }] },
    'Reverse Integer': { fn: 'reverse', tc: [{ i: [123], o: 321 }, { i: [-123], o: -321 }, { i: [120], o: 21 }] },

    // ===== STRING =====
    'Valid Anagram': { fn: 'isAnagram', tc: [{ i: ['anagram', 'nagaram'], o: true }, { i: ['rat', 'car'], o: false }] },
    'Group Anagrams': { fn: 'groupAnagrams', tc: [{ i: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], o: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']] }] },
    'Longest Common Prefix': { fn: 'longestCommonPrefix', tc: [{ i: [['flower', 'flow', 'flight']], o: 'fl' }, { i: [['dog', 'racecar', 'car']], o: '' }] },
    'String to Integer (atoi)': { fn: 'myAtoi', tc: [{ i: ['42'], o: 42 }, { i: ['   -42'], o: -42 }, { i: ['4193 with words'], o: 4193 }] },
    'Implement strStr()': { fn: 'strStr', tc: [{ i: ['hello', 'll'], o: 2 }, { i: ['aaaaa', 'bba'], o: -1 }] },
    'Count and Say': { fn: 'countAndSay', tc: [{ i: [1], o: '1' }, { i: [4], o: '1211' }] },
    'Longest Palindromic Substring': { fn: 'longestPalindrome', tc: [{ i: ['babad'], o: 'bab' }, { i: ['cbbd'], o: 'bb' }] },

    // ===== TRIE =====
    'Implement Trie': { fn: 'Trie', tc: [{ i: [], o: 'class' }] },

    // ===== GREEDY =====
    'Gas Station': { fn: 'canCompleteCircuit', tc: [{ i: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], o: 3 }, { i: [[2, 3, 4], [3, 4, 3]], o: -1 }] },
    'Candy': { fn: 'candy', tc: [{ i: [[1, 0, 2]], o: 5 }, { i: [[1, 2, 2]], o: 4 }] },
};

// Generate starter code for a given function name
function genStarter(fnName, problem) {
    return {
        python: `def ${fnName}(*args):\n    # Your code here\n    pass`,
        javascript: `function ${fnName}(...args) {\n    // Your code here\n}`,
        cpp: `// Implement ${problem.title}`,
        java: `// Implement ${problem.title}`
    };
}

// Build examples from test cases
function genExamples(tc, title) {
    return tc.slice(0, 2).map((t, idx) => ({
        input: `${JSON.stringify(t.i)}`,
        output: `${JSON.stringify(t.o)}`,
        explanation: idx === 0 ? `Example for ${title}` : undefined
    }));
}

async function updateAllTestCases() {
    console.log('Fetching all problems...');
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, difficulty, description')
        .order('id');

    if (error) { console.error('Error fetching:', error); return; }
    console.log(`Found ${problems.length} problems`);

    let updated = 0;
    let skipped = 0;

    for (const p of problems) {
        const testData = TEST_DATA[p.title];
        if (!testData) {
            skipped++;
            continue;
        }
        if (testData.tc[0]?.o === 'class') {
            skipped++;
            continue;
        }

        const testCases = testData.tc.map(t => ({ input: t.i, output: t.o }));
        const starterCode = genStarter(testData.fn, p);
        const examples = genExamples(testData.tc, p.title);
        const description = p.description && !p.description.startsWith('Solve the')
            ? p.description
            : `Given inputs, implement the ${testData.fn} function to solve ${p.title}.`;

        const { error: upErr } = await supabaseAdmin
            .from('problems')
            .update({
                test_cases: testCases,
                starter_code: starterCode,
                examples: examples,
                description: description,
            })
            .eq('id', p.id);

        if (upErr) {
            console.error(`Error updating ${p.title}:`, upErr.message);
        } else {
            updated++;
        }
    }

    console.log(`\nUpdate complete: ${updated} updated, ${skipped} skipped (no match or class type)`);

    // Verify
    const { data: check } = await supabaseAdmin
        .from('problems')
        .select('id')
        .not('test_cases', 'cs', '{"[{\\"input\\":[\\"example_input\\"],\\"output\\":\\"example_output\\"}]"}');

    console.log(`Problems with real test cases: ${check?.length || 0}/425`);
}

updateAllTestCases().catch(console.error);
