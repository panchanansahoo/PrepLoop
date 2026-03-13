/**
 * Fix starter_code function names and remaining description mismatches.
 * 
 * This script:
 * 1. Maps each problem title to its correct LeetCode function name
 * 2. Updates starter_code with the correct function name for each language
 * 3. Fixes remaining description mismatches for ~35 problems
 */
import { supabaseAdmin } from '../db/supabaseClient.js';

// ============== COMPLETE FUNCTION NAME MAP ==============
// Maps problem title -> { fn: function name, params: python params }
const FN_MAP = {
    // Array (IDs 1-45)
    'Two Sum': { fn: 'twoSum', params: 'nums: list[int], target: int' },
    'Best Time to Buy and Sell Stock': { fn: 'maxProfit', params: 'prices: list[int]' },
    'Contains Duplicate': { fn: 'containsDuplicate', params: 'nums: list[int]' },
    'Product of Array Except Self': { fn: 'productExceptSelf', params: 'nums: list[int]' },
    'Maximum Subarray': { fn: 'maxSubArray', params: 'nums: list[int]' },
    'Maximum Product Subarray': { fn: 'maxProduct', params: 'nums: list[int]' },
    'Find Minimum in Rotated Sorted Array': { fn: 'findMin', params: 'nums: list[int]' },
    'Search in Rotated Sorted Array': { fn: 'search', params: 'nums: list[int], target: int' },
    'Container With Most Water': { fn: 'maxArea', params: 'height: list[int]' },
    '3Sum': { fn: 'threeSum', params: 'nums: list[int]' },
    '4Sum': { fn: 'fourSum', params: 'nums: list[int], target: int' },
    'Remove Duplicates from Sorted Array': { fn: 'removeDuplicates', params: 'nums: list[int]' },
    'Remove Element': { fn: 'removeElement', params: 'nums: list[int], val: int' },
    'Next Permutation': { fn: 'nextPermutation', params: 'nums: list[int]' },
    'Rotate Array': { fn: 'rotate', params: 'nums: list[int], k: int' },
    'Jump Game': { fn: 'canJump', params: 'nums: list[int]' },
    'Jump Game II': { fn: 'jump', params: 'nums: list[int]' },
    'Merge Sorted Array': { fn: 'merge', params: 'nums1: list[int], m: int, nums2: list[int], n: int' },
    "Pascal's Triangle": { fn: 'generate', params: 'numRows: int' },
    "Pascal's Triangle II": { fn: 'getRow', params: 'rowIndex: int' },
    'Majority Element': { fn: 'majorityElement', params: 'nums: list[int]' },
    'Majority Element II': { fn: 'majorityElement', params: 'nums: list[int]' },
    'Rotate Image': { fn: 'rotate', params: 'matrix: list[list[int]]' },
    'Spiral Matrix': { fn: 'spiralOrder', params: 'matrix: list[list[int]]' },
    'Spiral Matrix II': { fn: 'generateMatrix', params: 'n: int' },
    'Set Matrix Zeroes': { fn: 'setZeroes', params: 'matrix: list[list[int]]' },
    'Game of Life': { fn: 'gameOfLife', params: 'board: list[list[int]]' },
    'Find First and Last Position of Element': { fn: 'searchRange', params: 'nums: list[int], target: int' },
    'Search a 2D Matrix': { fn: 'searchMatrix', params: 'matrix: list[list[int]], target: int' },
    'Search a 2D Matrix II': { fn: 'searchMatrix', params: 'matrix: list[list[int]], target: int' },
    'Kth Largest Element in an Array': { fn: 'findKthLargest', params: 'nums: list[int], k: int' },
    'Top K Frequent Elements': { fn: 'topKFrequent', params: 'nums: list[int], k: int' },
    'Sort Colors': { fn: 'sortColors', params: 'nums: list[int]' },
    'Wiggle Sort': { fn: 'wiggleSort', params: 'nums: list[int]' },
    'Wiggle Sort II': { fn: 'wiggleSort', params: 'nums: list[int]' },
    'First Missing Positive': { fn: 'firstMissingPositive', params: 'nums: list[int]' },
    'Missing Number': { fn: 'missingNumber', params: 'nums: list[int]' },
    'Find All Numbers Disappeared in Array': { fn: 'findDisappearedNumbers', params: 'nums: list[int]' },
    'Find All Duplicates in Array': { fn: 'findDuplicates', params: 'nums: list[int]' },
    'Longest Consecutive Sequence': { fn: 'longestConsecutive', params: 'nums: list[int]' },
    'Move Zeroes': { fn: 'moveZeroes', params: 'nums: list[int]' },
    'Plus One': { fn: 'plusOne', params: 'digits: list[int]' },
    'Merge Intervals': { fn: 'merge', params: 'intervals: list[list[int]]' },
    'Insert Interval': { fn: 'insert', params: 'intervals: list[list[int]], newInterval: list[int]' },
    'Non-overlapping Intervals': { fn: 'eraseOverlapIntervals', params: 'intervals: list[list[int]]' },

    // Two Pointers (IDs 46-80)
    'Valid Palindrome': { fn: 'isPalindrome', params: 's: str' },
    'Valid Palindrome II': { fn: 'validPalindrome', params: 's: str' },
    'Two Sum II - Input Array Is Sorted': { fn: 'twoSum', params: 'numbers: list[int], target: int' },
    '3Sum Closest': { fn: 'threeSumClosest', params: 'nums: list[int], target: int' },
    'Remove Duplicates from Sorted Array II': { fn: 'removeDuplicates', params: 'nums: list[int]' },
    'Remove Duplicates from Sorted List': { fn: 'deleteDuplicates', params: 'head: ListNode' },
    'Remove Duplicates from Sorted List II': { fn: 'deleteDuplicates', params: 'head: ListNode' },
    'Partition List': { fn: 'partition', params: 'head: ListNode, x: int' },
    'Sort List': { fn: 'sortList', params: 'head: ListNode' },
    'Reverse String': { fn: 'reverseString', params: 's: list[str]' },
    'Reverse Vowels of a String': { fn: 'reverseVowels', params: 's: str' },
    'Reverse Words in a String': { fn: 'reverseWords', params: 's: str' },
    'Reverse Words in a String III': { fn: 'reverseWords', params: 's: str' },
    'Is Subsequence': { fn: 'isSubsequence', params: 's: str, t: str' },
    'Number of Subsequences': { fn: 'numSubseq', params: 'nums: list[int], target: int' },
    'Backspace String Compare': { fn: 'backspaceCompare', params: 's: str, t: str' },
    'Squares of a Sorted Array': { fn: 'sortedSquares', params: 'nums: list[int]' },
    'Sort Transformed Array': { fn: 'sortTransformedArray', params: 'nums: list[int], a: int, b: int, c: int' },
    'Trapping Rain Water': { fn: 'trap', params: 'height: list[int]' },
    'Trapping Rain Water II': { fn: 'trapRainWater', params: 'heightMap: list[list[int]]' },
    'Boats to Save People': { fn: 'numRescueBoats', params: 'people: list[int], limit: int' },
    'Minimize Maximum Pair Sum': { fn: 'minPairSum', params: 'nums: list[int]' },
    'Assign Cookies': { fn: 'findContentChildren', params: 'g: list[int], s: list[int]' },
    'Intersection of Two Arrays': { fn: 'intersection', params: 'nums1: list[int], nums2: list[int]' },
    'Intersection of Two Arrays II': { fn: 'intersect', params: 'nums1: list[int], nums2: list[int]' },
    'Linked List Cycle': { fn: 'hasCycle', params: 'head: ListNode' },
    'Linked List Cycle II': { fn: 'detectCycle', params: 'head: ListNode' },
    'Happy Number': { fn: 'isHappy', params: 'n: int' },
    'Middle of the Linked List': { fn: 'middleNode', params: 'head: ListNode' },
    'Palindrome Linked List': { fn: 'isPalindrome', params: 'head: ListNode' },
    'Reorder List': { fn: 'reorderList', params: 'head: ListNode' },
    'Find the Duplicate Number': { fn: 'findDuplicate', params: 'nums: list[int]' },
    'Remove Nth Node From End of List': { fn: 'removeNthFromEnd', params: 'head: ListNode, n: int' },
    'Rotate List': { fn: 'rotateRight', params: 'head: ListNode, k: int' },
    'Partition Labels': { fn: 'partitionLabels', params: 's: str' },

    // Sliding Window (IDs 81-110)
    'Longest Substring Without Repeating Characters': { fn: 'lengthOfLongestSubstring', params: 's: str' },
    'Longest Repeating Character Replacement': { fn: 'characterReplacement', params: 's: str, k: int' },
    'Minimum Window Substring': { fn: 'minWindow', params: 's: str, t: str' },
    'Sliding Window Maximum': { fn: 'maxSlidingWindow', params: 'nums: list[int], k: int' },
    'Permutation in String': { fn: 'checkInclusion', params: 's1: str, s2: str' },
    'Find All Anagrams in a String': { fn: 'findAnagrams', params: 's: str, p: str' },
    'Substring with Concatenation of All Words': { fn: 'findSubstring', params: 's: str, words: list[str]' },
    'Minimum Size Subarray Sum': { fn: 'minSubArrayLen', params: 'target: int, nums: list[int]' },
    'Maximum Sum of Distinct Subarrays': { fn: 'maximumSubarraySum', params: 'nums: list[int], k: int' },
    'Fruit Into Baskets': { fn: 'totalFruit', params: 'fruits: list[int]' },
    'Max Consecutive Ones III': { fn: 'longestOnes', params: 'nums: list[int], k: int' },
    'Longest Substring with At Most K Distinct Characters': { fn: 'lengthOfLongestSubstringKDistinct', params: 's: str, k: int' },
    'Longest Substring with At Most Two Distinct Characters': { fn: 'lengthOfLongestSubstringTwoDistinct', params: 's: str' },
    'Subarrays with K Different Integers': { fn: 'subarraysWithKDistinct', params: 'nums: list[int], k: int' },
    'Count Number of Nice Subarrays': { fn: 'numberOfSubarrays', params: 'nums: list[int], k: int' },
    'Longest Turbulent Subarray': { fn: 'maxTurbulenceSize', params: 'arr: list[int]' },
    'Get Equal Substrings Within Budget': { fn: 'equalSubstring', params: 's: str, t: str, maxCost: int' },
    'Grumpy Bookstore Owner': { fn: 'maxSatisfied', params: 'customers: list[int], grumpy: list[int], minutes: int' },
    'Diet Plan Performance': { fn: 'dietPlanPerformance', params: 'calories: list[int], k: int, lower: int, upper: int' },
    'Number of Sub-arrays of Size K': { fn: 'numOfSubarrays', params: 'arr: list[int], k: int, threshold: int' },
    'Binary Subarrays With Sum': { fn: 'numSubarraysWithSum', params: 'nums: list[int], goal: int' },
    'Subarray Product Less Than K': { fn: 'numSubarrayProductLessThanK', params: 'nums: list[int], k: int' },
    'Minimum Operations to Reduce X to Zero': { fn: 'minOperations', params: 'nums: list[int], x: int' },
    'Frequency of the Most Frequent Element': { fn: 'maxFrequency', params: 'nums: list[int], k: int' },
    'Longest Nice Substring': { fn: 'longestNiceSubstring', params: 's: str' },
    'Contains Duplicate II': { fn: 'containsNearbyDuplicate', params: 'nums: list[int], k: int' },
    'Contains Duplicate III': { fn: 'containsNearbyAlmostDuplicate', params: 'nums: list[int], indexDiff: int, valueDiff: int' },
    'Longest Mountain in Array': { fn: 'longestMountain', params: 'arr: list[int]' },
    'Substring with Largest Variance': { fn: 'largestVariance', params: 's: str' },
    'Maximum Points You Can Obtain from Cards': { fn: 'maxScore', params: 'cardPoints: list[int], k: int' },

    // Fast & Slow Pointers (IDs 111-125)
    'Find the Middle Node of LinkedList': { fn: 'middleNode', params: 'head: ListNode' },
    'Detect Cycle in LinkedList': { fn: 'hasCycle', params: 'head: ListNode' },
    'Start of Cycle in LinkedList': { fn: 'detectCycle', params: 'head: ListNode' },
    'Find Duplicate Number': { fn: 'findDuplicate', params: 'nums: list[int]' },
    'Circular Array Loop': { fn: 'circularArrayLoop', params: 'nums: list[int]' },
    'Reorder Linked List': { fn: 'reorderList', params: 'head: ListNode' },
    'Delete Middle Node of LinkedList': { fn: 'deleteMiddle', params: 'head: ListNode' },
    'Maximum Twin Sum of LinkedList': { fn: 'pairSum', params: 'head: ListNode' },
    'Linked List Components': { fn: 'numComponents', params: 'head: ListNode, nums: list[int]' },
    'Odd Even Linked List': { fn: 'oddEvenList', params: 'head: ListNode' },
    'Remove Nodes From Linked List': { fn: 'removeNodes', params: 'head: ListNode' },
    'Split Linked List in Parts': { fn: 'splitListToParts', params: 'head: ListNode, k: int' },

    // Linked List (IDs 126-150)
    'Reverse Linked List': { fn: 'reverseList', params: 'head: ListNode' },
    'Reverse Linked List II': { fn: 'reverseBetween', params: 'head: ListNode, left: int, right: int' },
    'Reverse Nodes in k-Group': { fn: 'reverseKGroup', params: 'head: ListNode, k: int' },
    'Swap Nodes in Pairs': { fn: 'swapPairs', params: 'head: ListNode' },
    'Add Two Numbers': { fn: 'addTwoNumbers', params: 'l1: ListNode, l2: ListNode' },
    'Add Two Numbers II': { fn: 'addTwoNumbers', params: 'l1: ListNode, l2: ListNode' },
    'Merge Two Sorted Lists': { fn: 'mergeTwoLists', params: 'list1: ListNode, list2: ListNode' },
    'Merge K Sorted Lists': { fn: 'mergeKLists', params: 'lists: list[ListNode]' },
    'Copy List with Random Pointer': { fn: 'copyRandomList', params: 'head: Node' },
    'Intersection of Two Linked Lists': { fn: 'getIntersectionNode', params: 'headA: ListNode, headB: ListNode' },
    'Design Linked List': { fn: '__init__', params: '' },
    'Flatten a Multilevel Doubly Linked List': { fn: 'flatten', params: 'head: Node' },
    'Insert into a Sorted Circular Linked List': { fn: 'insert', params: 'head: Node, insertVal: int' },
    'Convert Binary Number in LinkedList': { fn: 'getDecimalValue', params: 'head: ListNode' },
    'Next Greater Node In Linked List': { fn: 'nextLargerNodes', params: 'head: ListNode' },
    'Linked List in Binary Tree': { fn: 'isSubPath', params: 'head: ListNode, root: TreeNode' },
    'Swap Adjacent in LR String': { fn: 'canTransform', params: 'start: str, end: str' },
    'Design Browser History': { fn: '__init__', params: 'homepage: str' },
    'LRU Cache': { fn: '__init__', params: 'capacity: int' },
    'LFU Cache': { fn: '__init__', params: 'capacity: int' },
    "All O'one Data Structure": { fn: '__init__', params: '' },
    'Design Skiplist': { fn: '__init__', params: '' },
    'Flatten Binary Tree to Linked List': { fn: 'flatten', params: 'root: TreeNode' },
    'Convert Sorted List to BST': { fn: 'sortedListToBST', params: 'head: ListNode' },

    // Stack (IDs 151-180)
    'Valid Parentheses': { fn: 'isValid', params: 's: str' },
    'Longest Valid Parentheses': { fn: 'longestValidParentheses', params: 's: str' },
    'Min Stack': { fn: '__init__', params: '' },
    'Max Stack': { fn: '__init__', params: '' },
    'Implement Queue using Stacks': { fn: '__init__', params: '' },
    'Implement Stack using Queues': { fn: '__init__', params: '' },
    'Evaluate Reverse Polish Notation': { fn: 'evalRPN', params: 'tokens: list[str]' },
    'Basic Calculator': { fn: 'calculate', params: 's: str' },
    'Basic Calculator II': { fn: 'calculate', params: 's: str' },
    'Basic Calculator III': { fn: 'calculate', params: 's: str' },
    'Simplify Path': { fn: 'simplifyPath', params: 'path: str' },
    'Remove All Adjacent Duplicates In String': { fn: 'removeDuplicates', params: 's: str' },
    'Remove All Adjacent Duplicates in String II': { fn: 'removeDuplicates', params: 's: str, k: int' },
    'Remove K Digits': { fn: 'removeKdigits', params: 'num: str, k: int' },
    'Create Maximum Number': { fn: 'maxNumber', params: 'nums1: list[int], nums2: list[int], k: int' },
    'Decode String': { fn: 'decodeString', params: 's: str' },
    'Number of Atoms': { fn: 'countOfAtoms', params: 'formula: str' },
    'Asteroid Collision': { fn: 'asteroidCollision', params: 'asteroids: list[int]' },
    'Daily Temperatures': { fn: 'dailyTemperatures', params: 'temperatures: list[int]' },
    'Next Greater Element I': { fn: 'nextGreaterElement', params: 'nums1: list[int], nums2: list[int]' },
    'Next Greater Element II': { fn: 'nextGreaterElements', params: 'nums: list[int]' },
    'Next Greater Element III': { fn: 'nextGreaterElement', params: 'n: int' },
    'Largest Rectangle in Histogram': { fn: 'largestRectangleArea', params: 'heights: list[int]' },
    'Maximal Rectangle': { fn: 'maximalRectangle', params: 'matrix: list[list[str]]' },
    'Score of Parentheses': { fn: 'scoreOfParentheses', params: 's: str' },
    'Valid Parenthesis String': { fn: 'checkValidString', params: 's: str' },
    'Minimum Add to Make Parentheses Valid': { fn: 'minAddToMakeValid', params: 's: str' },
    'Minimum Remove to Make Valid Parentheses': { fn: 'minRemoveToMakeValid', params: 's: str' },
    'Maximum Nesting Depth of Parentheses': { fn: 'maxDepth', params: 's: str' },

    // Binary Search (IDs 181-215)
    'Binary Search': { fn: 'search', params: 'nums: list[int], target: int' },
    'Search Insert Position': { fn: 'searchInsert', params: 'nums: list[int], target: int' },
    'First Bad Version': { fn: 'firstBadVersion', params: 'n: int' },
    'Sqrt(x)': { fn: 'mySqrt', params: 'x: int' },
    'Valid Perfect Square': { fn: 'isPerfectSquare', params: 'num: int' },
    'Guess Number Higher or Lower': { fn: 'guessNumber', params: 'n: int' },
    'Find Smallest Letter Greater Than Target': { fn: 'nextGreatestLetter', params: 'letters: list[str], target: str' },
    'Peak Index in a Mountain Array': { fn: 'peakIndexInMountainArray', params: 'arr: list[int]' },
    'Find Peak Element': { fn: 'findPeakElement', params: 'nums: list[int]' },
    'Search in Rotated Sorted Array II': { fn: 'search', params: 'nums: list[int], target: int' },
    'Find Minimum in Rotated Sorted Array II': { fn: 'findMin', params: 'nums: list[int]' },
    'Single Element in a Sorted Array': { fn: 'singleNonDuplicate', params: 'nums: list[int]' },
    'Find K Closest Elements': { fn: 'findClosestElements', params: 'arr: list[int], k: int, x: int' },
    'Kth Smallest Element in a Sorted Matrix': { fn: 'kthSmallest', params: 'matrix: list[list[int]], k: int' },
    'Find K-th Smallest Pair Distance': { fn: 'smallestDistancePair', params: 'nums: list[int], k: int' },
    'Koko Eating Bananas': { fn: 'minEatingSpeed', params: 'piles: list[int], h: int' },
    'Minimize Max Distance to Gas Station': { fn: 'minmaxGasDist', params: 'stations: list[int], k: int' },
    'Split Array Largest Sum': { fn: 'splitArray', params: 'nums: list[int], k: int' },
    'Capacity To Ship Packages Within D Days': { fn: 'shipWithinDays', params: 'weights: list[int], days: int' },
    'Divide Chocolate': { fn: 'maximizeSweetness', params: 'sweetness: list[int], k: int' },
    'Minimum Number of Days to Make m Bouquets': { fn: 'minDays', params: 'bloomDay: list[int], m: int, k: int' },
    'Magnetic Force Between Two Balls': { fn: 'maxDistance', params: 'position: list[int], m: int' },
    'Find Right Interval': { fn: 'findRightInterval', params: 'intervals: list[list[int]]' },
    'Russian Doll Envelopes': { fn: 'maxEnvelopes', params: 'envelopes: list[list[int]]' },
    'Longest Increasing Subsequence': { fn: 'lengthOfLIS', params: 'nums: list[int]' },
    'Count of Smaller Numbers After Self': { fn: 'countSmaller', params: 'nums: list[int]' },
    'Count of Range Sum': { fn: 'countRangeSum', params: 'nums: list[int], lower: int, upper: int' },
    'Median of Two Sorted Arrays': { fn: 'findMedianSortedArrays', params: 'nums1: list[int], nums2: list[int]' },
    'Find Median from Data Stream': { fn: '__init__', params: '' },
    'Count Complete Tree Nodes': { fn: 'countNodes', params: 'root: TreeNode' },
    'Powx n': { fn: 'myPow', params: 'x: float, n: int' },
    'Divide Two Integers': { fn: 'divide', params: 'dividend: int, divisor: int' },

    // Trees (IDs 222-260+)
    'Maximum Depth of Binary Tree': { fn: 'maxDepth', params: 'root: TreeNode' },
    'Minimum Depth of Binary Tree': { fn: 'minDepth', params: 'root: TreeNode' },
    'Invert Binary Tree': { fn: 'invertTree', params: 'root: TreeNode' },
    'Diameter of Binary Tree': { fn: 'diameterOfBinaryTree', params: 'root: TreeNode' },
    'Balanced Binary Tree': { fn: 'isBalanced', params: 'root: TreeNode' },
    'Same Tree': { fn: 'isSameTree', params: 'p: TreeNode, q: TreeNode' },
    'Symmetric Tree': { fn: 'isSymmetric', params: 'root: TreeNode' },
    'Subtree of Another Tree': { fn: 'isSubtree', params: 'root: TreeNode, subRoot: TreeNode' },
    'Merge Two Binary Trees': { fn: 'mergeTrees', params: 'root1: TreeNode, root2: TreeNode' },
    'Binary Tree Paths': { fn: 'binaryTreePaths', params: 'root: TreeNode' },
    'Path Sum': { fn: 'hasPathSum', params: 'root: TreeNode, targetSum: int' },
    'Path Sum II': { fn: 'pathSum', params: 'root: TreeNode, targetSum: int' },
    'Path Sum III': { fn: 'pathSum', params: 'root: TreeNode, targetSum: int' },
    'Binary Tree Maximum Path Sum': { fn: 'maxPathSum', params: 'root: TreeNode' },
    'Sum Root to Leaf Numbers': { fn: 'sumNumbers', params: 'root: TreeNode' },
    'Lowest Common Ancestor of BST': { fn: 'lowestCommonAncestor', params: 'root: TreeNode, p: TreeNode, q: TreeNode' },
    'Lowest Common Ancestor of Binary Tree': { fn: 'lowestCommonAncestor', params: 'root: TreeNode, p: TreeNode, q: TreeNode' },
    'Binary Tree Level Order Traversal': { fn: 'levelOrder', params: 'root: TreeNode' },
    'Binary Tree Zigzag Level Order': { fn: 'zigzagLevelOrder', params: 'root: TreeNode' },
    'Binary Tree Right Side View': { fn: 'rightSideView', params: 'root: TreeNode' },
    'Binary Tree Level Order Traversal II': { fn: 'levelOrderBottom', params: 'root: TreeNode' },
    'Average of Levels in Binary Tree': { fn: 'averageOfLevels', params: 'root: TreeNode' },
    'Populating Next Right Pointers': { fn: 'connect', params: 'root: Node' },
    'Populating Next Right Pointers II': { fn: 'connect', params: 'root: Node' },
    'Validate Binary Search Tree': { fn: 'isValidBST', params: 'root: TreeNode' },
    'Kth Smallest Element in BST': { fn: 'kthSmallest', params: 'root: TreeNode, k: int' },
    'Binary Search Tree Iterator': { fn: '__init__', params: 'root: TreeNode' },
    'Convert Sorted Array to BST': { fn: 'sortedArrayToBST', params: 'nums: list[int]' },
    'Construct Binary Tree from Preorder and Inorder': { fn: 'buildTree', params: 'preorder: list[int], inorder: list[int]' },
    'Construct Binary Tree from Inorder and Postorder': { fn: 'buildTree', params: 'inorder: list[int], postorder: list[int]' },
    'Serialize and Deserialize Binary Tree': { fn: 'serialize', params: 'root: TreeNode' },
    'Serialize and Deserialize BST': { fn: 'serialize', params: 'root: TreeNode' },
    'Count Good Nodes in Binary Tree': { fn: 'goodNodes', params: 'root: TreeNode' },
    'Delete Node in a BST': { fn: 'deleteNode', params: 'root: TreeNode, key: int' },
    'Insert into a BST': { fn: 'insertIntoBST', params: 'root: TreeNode, val: int' },
    'Recover Binary Search Tree': { fn: 'recoverTree', params: 'root: TreeNode' },
    'Unique Binary Search Trees': { fn: 'numTrees', params: 'n: int' },
    'Unique Binary Search Trees II': { fn: 'generateTrees', params: 'n: int' },

    // Graphs (IDs 262-296)
    'Number of Islands': { fn: 'numIslands', params: 'grid: list[list[str]]' },
    'Max Area of Island': { fn: 'maxAreaOfIsland', params: 'grid: list[list[int]]' },
    'Number of Distinct Islands': { fn: 'numDistinctIslands', params: 'grid: list[list[int]]' },
    'Number of Closed Islands': { fn: 'closedIsland', params: 'grid: list[list[int]]' },
    'Clone Graph': { fn: 'cloneGraph', params: 'node: Node' },
    'Pacific Atlantic Water Flow': { fn: 'pacificAtlantic', params: 'heights: list[list[int]]' },
    'Surrounded Regions': { fn: 'solve', params: 'board: list[list[str]]' },
    'Number of Provinces': { fn: 'findCircleNum', params: 'isConnected: list[list[int]]' },
    'Graph Valid Tree': { fn: 'validTree', params: 'n: int, edges: list[list[int]]' },
    'Number of Connected Components': { fn: 'countComponents', params: 'n: int, edges: list[list[int]]' },
    'Redundant Connection': { fn: 'findRedundantConnection', params: 'edges: list[list[int]]' },
    'Redundant Connection II': { fn: 'findRedundantDirectedConnection', params: 'edges: list[list[int]]' },
    'Accounts Merge': { fn: 'accountsMerge', params: 'accounts: list[list[str]]' },
    'Satisfiability of Equality Equations': { fn: 'equationsPossible', params: 'equations: list[str]' },
    'Course Schedule': { fn: 'canFinish', params: 'numCourses: int, prerequisites: list[list[int]]' },
    'Course Schedule II': { fn: 'findOrder', params: 'numCourses: int, prerequisites: list[list[int]]' },
    'Course Schedule III': { fn: 'scheduleCourse', params: 'courses: list[list[int]]' },
    'Minimum Height Trees': { fn: 'findMinHeightTrees', params: 'n: int, edges: list[list[int]]' },
    'Alien Dictionary': { fn: 'alienOrder', params: 'words: list[str]' },
    'Sequence Reconstruction': { fn: 'sequenceReconstruction', params: 'nums: list[int], sequences: list[list[int]]' },
    'Network Delay Time': { fn: 'networkDelayTime', params: 'times: list[list[int]], n: int, k: int' },
    'Cheapest Flights Within K Stops': { fn: 'findCheapestPrice', params: 'n: int, flights: list[list[int]], src: int, dst: int, k: int' },
    'Path with Maximum Probability': { fn: 'maxProbability', params: 'n: int, edges: list[list[int]], succProb: list[float], start_node: int, end_node: int' },
    'Path With Minimum Effort': { fn: 'minimumEffortPath', params: 'heights: list[list[int]]' },
    'Swim in Rising Water': { fn: 'swimInWater', params: 'grid: list[list[int]]' },
    'Word Ladder': { fn: 'ladderLength', params: 'beginWord: str, endWord: str, wordList: list[str]' },
    'Word Ladder II': { fn: 'findLadders', params: 'beginWord: str, endWord: str, wordList: list[str]' },
    'Minimum Genetic Mutation': { fn: 'minMutation', params: 'startGene: str, endGene: str, bank: list[str]' },
    'Reconstruct Itinerary': { fn: 'findItinerary', params: 'tickets: list[list[str]]' },
    'All Paths from Source to Target': { fn: 'allPathsSourceTarget', params: 'graph: list[list[int]]' },
    'Find if Path Exists in Graph': { fn: 'validPath', params: 'n: int, edges: list[list[int]], source: int, destination: int' },
    'Evaluate Division': { fn: 'calcEquation', params: 'equations: list[list[str]], values: list[float], queries: list[list[str]]' },
    'Shortest Path in Binary Matrix': { fn: 'shortestPathBinaryMatrix', params: 'grid: list[list[int]]' },
    'Shortest Bridge': { fn: 'shortestBridge', params: 'grid: list[list[int]]' },
    'Is Graph Bipartite': { fn: 'isBipartite', params: 'graph: list[list[int]]' },

    // DP (IDs 297-340)
    'Climbing Stairs': { fn: 'climbStairs', params: 'n: int' },
    'Min Cost Climbing Stairs': { fn: 'minCostClimbingStairs', params: 'cost: list[int]' },
    'House Robber': { fn: 'rob', params: 'nums: list[int]' },
    'House Robber II': { fn: 'rob', params: 'nums: list[int]' },
    'House Robber III': { fn: 'rob', params: 'root: TreeNode' },
    'Coin Change': { fn: 'coinChange', params: 'coins: list[int], amount: int' },
    'Coin Change 2': { fn: 'change', params: 'amount: int, coins: list[int]' },
    'Combination Sum IV': { fn: 'combinationSum4', params: 'nums: list[int], target: int' },
    'Perfect Squares': { fn: 'numSquares', params: 'n: int' },
    'Decode Ways': { fn: 'numDecodings', params: 's: str' },
    'Decode Ways II': { fn: 'numDecodings', params: 's: str' },
    'Unique Paths': { fn: 'uniquePaths', params: 'm: int, n: int' },
    'Unique Paths II': { fn: 'uniquePathsWithObstacles', params: 'obstacleGrid: list[list[int]]' },
    'Unique Paths III': { fn: 'uniquePathsIII', params: 'grid: list[list[int]]' },
    'Minimum Path Sum': { fn: 'minPathSum', params: 'grid: list[list[int]]' },
    'Triangle': { fn: 'minimumTotal', params: 'triangle: list[list[int]]' },
    'Maximal Square': { fn: 'maximalSquare', params: 'matrix: list[list[str]]' },
    'Longest Palindromic Substring': { fn: 'longestPalindrome', params: 's: str' },
    'Longest Palindromic Subsequence': { fn: 'longestPalindromeSubseq', params: 's: str' },
    'Palindromic Substrings': { fn: 'countSubstrings', params: 's: str' },
    'Longest Common Subsequence': { fn: 'longestCommonSubsequence', params: 'text1: str, text2: str' },
    'Edit Distance': { fn: 'minDistance', params: 'word1: str, word2: str' },
    'Distinct Subsequences': { fn: 'numDistinct', params: 's: str, t: str' },
    'Interleaving String': { fn: 'isInterleave', params: 's1: str, s2: str, s3: str' },
    'Longest Increasing Path in a Matrix': { fn: 'longestIncreasingPath', params: 'matrix: list[list[int]]' },
    'Maximum Length of Pair Chain': { fn: 'findLongestChain', params: 'pairs: list[list[int]]' },
    'Wiggle Subsequence': { fn: 'wiggleMaxLength', params: 'nums: list[int]' },
    'Best Time to Buy and Sell Stock II': { fn: 'maxProfit', params: 'prices: list[int]' },
    'Best Time to Buy and Sell Stock III': { fn: 'maxProfit', params: 'prices: list[int]' },
    'Best Time to Buy and Sell Stock IV': { fn: 'maxProfit', params: 'k: int, prices: list[int]' },
    'Best Time to Buy and Sell Stock with Cooldown': { fn: 'maxProfit', params: 'prices: list[int]' },
    'Best Time to Buy and Sell Stock with Transaction Fee': { fn: 'maxProfit', params: 'prices: list[int], fee: int' },
    'Word Break': { fn: 'wordBreak', params: 's: str, wordDict: list[str]' },
    'Word Break II': { fn: 'wordBreak', params: 's: str, wordDict: list[str]' },
    'Partition Equal Subset Sum': { fn: 'canPartition', params: 'nums: list[int]' },
    'Target Sum': { fn: 'findTargetSumWays', params: 'nums: list[int], target: int' },
    'Ones and Zeroes': { fn: 'findMaxForm', params: 'strs: list[str], m: int, n: int' },
    'Last Stone Weight II': { fn: 'lastStoneWeightII', params: 'stones: list[int]' },
    'Partition to K Equal Sum Subsets': { fn: 'canPartitionKSubsets', params: 'nums: list[int], k: int' },
    'Regular Expression Matching': { fn: 'isMatch', params: 's: str, p: str' },
    'Wildcard Matching': { fn: 'isMatch', params: 's: str, p: str' },
    'Longest Valid Parentheses': { fn: 'longestValidParentheses', params: 's: str' },
    'Arithmetic Slices': { fn: 'numberOfArithmeticSlices', params: 'nums: list[int]' },
    'Arithmetic Slices II': { fn: 'numberOfArithmeticSlices', params: 'nums: list[int]' },
    'Burst Balloons': { fn: 'maxCoins', params: 'nums: list[int]' },
    'Super Egg Drop': { fn: 'superEggDrop', params: 'k: int, n: int' },

    // Backtracking (IDs 347-376)
    'Subsets': { fn: 'subsets', params: 'nums: list[int]' },
    'Subsets II': { fn: 'subsetsWithDup', params: 'nums: list[int]' },
    'Permutations': { fn: 'permute', params: 'nums: list[int]' },
    'Permutations II': { fn: 'permuteUnique', params: 'nums: list[int]' },
    'Combination Sum': { fn: 'combinationSum', params: 'candidates: list[int], target: int' },
    'Combination Sum II': { fn: 'combinationSum2', params: 'candidates: list[int], target: int' },
    'Combination Sum III': { fn: 'combinationSum3', params: 'k: int, n: int' },
    'Combinations': { fn: 'combine', params: 'n: int, k: int' },
    'Letter Combinations of a Phone Number': { fn: 'letterCombinations', params: 'digits: str' },
    'Generate Parentheses': { fn: 'generateParenthesis', params: 'n: int' },
    'Palindrome Partitioning': { fn: 'partition', params: 's: str' },
    'Palindrome Partitioning II': { fn: 'minCut', params: 's: str' },
    'Word Search': { fn: 'exist', params: 'board: list[list[str]], word: str' },
    'Word Search II': { fn: 'findWords', params: 'board: list[list[str]], words: list[str]' },
    'N-Queens': { fn: 'solveNQueens', params: 'n: int' },
    'N-Queens II': { fn: 'totalNQueens', params: 'n: int' },
    'Sudoku Solver': { fn: 'solveSudoku', params: 'board: list[list[str]]' },
    'Valid Sudoku': { fn: 'isValidSudoku', params: 'board: list[list[str]]' },
    'Letter Case Permutation': { fn: 'letterCasePermutation', params: 's: str' },
    'Beautiful Arrangement': { fn: 'countArrangement', params: 'n: int' },
    'Matchsticks to Square': { fn: 'makesquare', params: 'matchsticks: list[int]' },
    'Split Array into Fibonacci Sequence': { fn: 'splitIntoFibonacci', params: 'num: str' },
    'Additive Number': { fn: 'isAdditiveNumber', params: 'num: str' },
    'Restore IP Addresses': { fn: 'restoreIpAddresses', params: 's: str' },
    'Factor Combinations': { fn: 'getFactors', params: 'n: int' },
    'Remove Invalid Parentheses': { fn: 'removeInvalidParentheses', params: 's: str' },
    'Expression Add Operators': { fn: 'addOperators', params: 'num: str, target: int' },
    'Android Unlock Patterns': { fn: 'numberOfPatterns', params: 'm: int, n: int' },
    'Strobogrammatic Number II': { fn: 'findStrobogrammatic', params: 'n: int' },
    'Generalized Abbreviation': { fn: 'generateAbbreviations', params: 'word: str' },

    // Heap/Priority Queue (IDs 377-396)
    'Top K Frequent Words': { fn: 'topKFrequent', params: 'words: list[str], k: int' },
    'K Closest Points to Origin': { fn: 'kClosest', params: 'points: list[list[int]], k: int' },
    'Find K Pairs with Smallest Sums': { fn: 'kSmallestPairs', params: 'nums1: list[int], nums2: list[int], k: int' },
    'Kth Smallest Prime Fraction': { fn: 'kthSmallestPrimeFraction', params: 'arr: list[int], k: int' },
    'Reorganize String': { fn: 'reorganizeString', params: 's: str' },
    'Rearrange String k Distance Apart': { fn: 'rearrangeString', params: 's: str, k: int' },
    'Task Scheduler': { fn: 'leastInterval', params: 'tasks: list[str], n: int' },
    'IPO': { fn: 'findMaximizedCapital', params: 'k: int, w: int, profits: list[int], capital: list[int]' },
    'Furthest Building You Can Reach': { fn: 'furthestBuilding', params: 'heights: list[int], bricks: int, ladders: int' },
    'Minimize Deviation in Array': { fn: 'minimumDeviation', params: 'nums: list[int]' },
    'Meeting Rooms II': { fn: 'minMeetingRooms', params: 'intervals: list[list[int]]' },
    'Meeting Rooms III': { fn: 'mostBooked', params: 'n: int, meetings: list[list[int]]' },
    'Process Tasks Using Servers': { fn: 'assignTasks', params: 'servers: list[int], tasks: list[int]' },
    'Find the Kth Smallest Sum': { fn: 'kthSmallest', params: 'mat: list[list[int]], k: int' },

    // Trie (IDs 397-411)
    'Implement Trie (Prefix Tree)': { fn: '__init__', params: '' },
    'Design Add and Search Words Data Structure': { fn: '__init__', params: '' },
    'Search Suggestions System': { fn: 'suggestedProducts', params: 'products: list[str], searchWord: str' },
    'Replace Words': { fn: 'replaceWords', params: 'dictionary: list[str], sentence: str' },
    'Implement Magic Dictionary': { fn: '__init__', params: '' },
    'Palindrome Pairs': { fn: 'palindromePairs', params: 'words: list[str]' },
    'Design Search Autocomplete System': { fn: '__init__', params: 'sentences: list[str], times: list[int]' },
    'Stream of Characters': { fn: '__init__', params: 'words: list[str]' },
    'Concatenated Words': { fn: 'findAllConcatenatedWordsInADict', params: 'words: list[str]' },
    'Word Squares': { fn: 'wordSquares', params: 'words: list[str]' },
    'Maximum XOR of Two Numbers': { fn: 'findMaximumXOR', params: 'nums: list[int]' },
    'Maximum XOR With Element From Array': { fn: 'maximizeXor', params: 'nums: list[int], queries: list[list[int]]' },
    'Map Sum Pairs': { fn: '__init__', params: '' },
    'Longest Word in Dictionary': { fn: 'longestWord', params: 'words: list[str]' },

    // Greedy (IDs 412-431)
    'Gas Station': { fn: 'canCompleteCircuit', params: 'gas: list[int], cost: list[int]' },
    'Candy': { fn: 'candy', params: 'ratings: list[int]' },
    'Queue Reconstruction by Height': { fn: 'reconstructQueue', params: 'people: list[list[int]]' },
    'Minimum Number of Arrows to Burst Balloons': { fn: 'findMinArrowShots', params: 'points: list[list[int]]' },
    'Remove Duplicate Letters': { fn: 'removeDuplicateLetters', params: 's: str' },
    'Largest Number': { fn: 'largestNumber', params: 'nums: list[int]' },
    'Maximum Swap': { fn: 'maximumSwap', params: 'num: int' },
    'Minimum Deletions to Make Character Frequencies Unique': { fn: 'minDeletions', params: 's: str' },
    'Reduce Array Size to The Half': { fn: 'minSetSize', params: 'arr: list[int]' },
};

function generateStarterCode(fnName, params) {
    return {
        python: `class Solution:\n    def ${fnName}(self, ${params}):\n        # Write your solution here\n        pass`,
        javascript: `/**\n * @param {*} input\n * @return {*}\n */\nvar ${fnName} = function(${params.split(':')[0].split(',').map(p => p.trim().split(':')[0].split('=')[0].trim()).filter(p => p && p !== 'self').join(', ')}) {\n    // Write your solution here\n};`,
    };
}

async function main() {
    console.log('=== FIXING STARTER CODE FUNCTION NAMES ===\n');

    // Fetch all problems
    let allProblems = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from('problems')
            .select('id, title, starter_code')
            .order('id')
            .range(offset, offset + batchSize - 1);

        if (error) { console.error('Error:', error.message); break; }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        offset += batchSize;
        if (data.length < batchSize) break;
    }

    console.log(`Loaded ${allProblems.length} problems.\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let notFound = 0;

    for (const p of allProblems) {
        const mapping = FN_MAP[p.title];
        if (!mapping) {
            notFound++;
            continue;
        }

        const newStarterCode = generateStarterCode(mapping.fn, mapping.params);

        // Check if current starter_code already has the right function name
        const currentPy = p.starter_code?.python || '';
        if (currentPy.includes(`def ${mapping.fn}(`)) {
            skipped++;
            continue;
        }

        const { error } = await supabaseAdmin
            .from('problems')
            .update({ starter_code: newStarterCode })
            .eq('id', p.id);

        if (error) {
            console.log(`  ❌ [${p.id}] ${p.title}: ${error.message}`);
            failed++;
        } else {
            console.log(`  ✅ [${p.id}] ${p.title} -> ${mapping.fn}`);
            updated++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Already correct: ${skipped}`);
    console.log(`Not in mapping: ${notFound}`);
    console.log(`Failed: ${failed}`);
}

main().catch(console.error);
