import { supabaseAdmin } from './supabaseClient.js';

// Pattern name -> pattern_id mapping (will be fetched dynamically)
const PATTERN_MAP = {};

async function loadPatternMap() {
    const { data } = await supabaseAdmin.from('patterns').select('id, name');
    for (const p of data || []) PATTERN_MAP[p.name] = p.id;
    // Add aliases for fuzzy matching from dsaProblems.js
    PATTERN_MAP['Two Pointers'] = PATTERN_MAP['Two Pointers'];
    PATTERN_MAP['Sliding Window'] = PATTERN_MAP['Sliding Window'];
    console.log(`Loaded ${Object.keys(PATTERN_MAP).length} patterns`);
}

function getPatternId(patternName) {
    if (PATTERN_MAP[patternName]) return PATTERN_MAP[patternName];
    // Fuzzy match
    for (const [name, id] of Object.entries(PATTERN_MAP)) {
        if (name.toLowerCase().includes(patternName.toLowerCase()) ||
            patternName.toLowerCase().includes(name.toLowerCase())) return id;
    }
    return PATTERN_MAP['Array'] || 13; // default
}

// ── Top 50 problems with hand-crafted test cases ──
const PROBLEM_DATA = [
    {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'Easy', pattern: 'Array',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
        companies: ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple'],
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        test_cases: [
            { input: [[2, 7, 11, 15], 9], output: [0, 1] },
            { input: [[3, 2, 4], 6], output: [1, 2] },
            { input: [[3, 3], 6], output: [0, 1] }
        ],
        starter_code: {
            python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
            javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
            cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}',
            java: 'public int[] twoSum(int[] nums, int target) {\n    // Your code here\n}'
        },
        solution_code: {
            python: `class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for index, num in enumerate(nums):\n            complement = target - num\n            if complement in seen:\n                return [seen[complement], index]\n            seen[num] = index\n        return []`,
            javascript: `class Solution {\n  twoSum(nums, target) {\n    const seen = new Map();\n    for (let index = 0; index < nums.length; index++) {\n      const complement = target - nums[index];\n      if (seen.has(complement)) {\n        return [seen.get(complement), index];\n      }\n      seen.set(nums[index], index);\n    }\n    return [];\n  }\n}`,
            cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int index = 0; index < nums.size(); index++) {\n            int complement = target - nums[index];\n            if (seen.count(complement)) {\n                return {seen[complement], index};\n            }\n            seen[nums[index]] = index;\n        }\n        return {};\n    }\n};`,
            java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int index = 0; index < nums.length; index++) {\n            int complement = target - nums[index];\n            if (seen.containsKey(complement)) {\n                return new int[] { seen.get(complement), index };\n            }\n            seen.put(nums[index], index);\n        }\n        return new int[0];\n    }\n}`
        },
        fn_name: 'twoSum'
    },
    {
        title: 'Best Time to Buy and Sell Stock',
        description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Maximize profit by choosing a single day to buy and a different day in the future to sell.',
        difficulty: 'Easy', pattern: 'Array',
        constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
        companies: ['Amazon', 'Microsoft', 'Facebook', 'Bloomberg'],
        examples: [
            { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 5.' },
            { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No transactions, max profit = 0.' }
        ],
        test_cases: [
            { input: [[7, 1, 5, 3, 6, 4]], output: 5 },
            { input: [[7, 6, 4, 3, 1]], output: 0 },
            { input: [[1, 2]], output: 1 },
            { input: [[2, 4, 1]], output: 2 }
        ],
        starter_code: {
            python: 'def maxProfit(prices):\n    # Your code here\n    pass',
            javascript: 'function maxProfit(prices) {\n    // Your code here\n}',
            cpp: 'int maxProfit(vector<int>& prices) {\n    // Your code here\n}',
            java: 'public int maxProfit(int[] prices) {\n    // Your code here\n}'
        },
        fn_name: 'maxProfit'
    },
    {
        title: 'Contains Duplicate',
        description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
        difficulty: 'Easy', pattern: 'Array',
        constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
        companies: ['Google', 'Amazon', 'Apple'],
        examples: [
            { input: 'nums = [1,2,3,1]', output: 'true' },
            { input: 'nums = [1,2,3,4]', output: 'false' }
        ],
        test_cases: [
            { input: [[1, 2, 3, 1]], output: true },
            { input: [[1, 2, 3, 4]], output: false },
            { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], output: true }
        ],
        starter_code: {
            python: 'def containsDuplicate(nums):\n    # Your code here\n    pass',
            javascript: 'function containsDuplicate(nums) {\n    // Your code here\n}',
            cpp: 'bool containsDuplicate(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public boolean containsDuplicate(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'containsDuplicate'
    },
    {
        title: 'Product of Array Except Self',
        description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements except nums[i]. You must write an algorithm that runs in O(n) time without using division.',
        difficulty: 'Medium', pattern: 'Array',
        constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30',
        companies: ['Facebook', 'Amazon', 'Microsoft', 'Apple'],
        examples: [
            { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
            { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' }
        ],
        test_cases: [
            { input: [[1, 2, 3, 4]], output: [24, 12, 8, 6] },
            { input: [[-1, 1, 0, -3, 3]], output: [0, 0, 9, 0, 0] },
            { input: [[2, 3]], output: [3, 2] }
        ],
        starter_code: {
            python: 'def productExceptSelf(nums):\n    # Your code here\n    pass',
            javascript: 'function productExceptSelf(nums) {\n    // Your code here\n}',
            cpp: 'vector<int> productExceptSelf(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public int[] productExceptSelf(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'productExceptSelf'
    },
    {
        title: 'Maximum Subarray',
        description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
        difficulty: 'Easy', pattern: 'Array',
        constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
        companies: ['Amazon', 'Microsoft', 'LinkedIn', 'Bloomberg'],
        examples: [
            { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'Subarray [4,-1,2,1] has the largest sum 6.' }
        ],
        test_cases: [
            { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], output: 6 },
            { input: [[1]], output: 1 },
            { input: [[5, 4, -1, 7, 8]], output: 23 },
            { input: [[-1]], output: -1 }
        ],
        starter_code: {
            python: 'def maxSubArray(nums):\n    # Your code here\n    pass',
            javascript: 'function maxSubArray(nums) {\n    // Your code here\n}',
            cpp: 'int maxSubArray(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public int maxSubArray(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'maxSubArray'
    },
    {
        title: 'Valid Palindrome',
        description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
        difficulty: 'Easy', pattern: 'Two Pointers',
        constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
        companies: ['Facebook', 'Microsoft', 'Amazon'],
        examples: [
            { input: 's = "A man, a plan, a canal: Panama"', output: 'true' },
            { input: 's = "race a car"', output: 'false' }
        ],
        test_cases: [
            { input: ['A man, a plan, a canal: Panama'], output: true },
            { input: ['race a car'], output: false },
            { input: [' '], output: true }
        ],
        starter_code: {
            python: 'def isPalindrome(s):\n    # Your code here\n    pass',
            javascript: 'function isPalindrome(s) {\n    // Your code here\n}',
            cpp: 'bool isPalindrome(string s) {\n    // Your code here\n}',
            java: 'public boolean isPalindrome(String s) {\n    // Your code here\n}'
        },
        fn_name: 'isPalindrome'
    },
    {
        title: 'Valid Parentheses',
        description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. Open brackets must be closed in the correct order.',
        difficulty: 'Easy', pattern: 'Stack',
        constraints: '1 <= s.length <= 10^4',
        companies: ['Amazon', 'Facebook', 'Google', 'Bloomberg'],
        examples: [
            { input: 's = "()"', output: 'true' },
            { input: 's = "()[]{}"', output: 'true' },
            { input: 's = "(]"', output: 'false' }
        ],
        test_cases: [
            { input: ['()'], output: true },
            { input: ['()[]{}'], output: true },
            { input: ['(]'], output: false },
            { input: ['([)]'], output: false },
            { input: ['{[]}'], output: true }
        ],
        starter_code: {
            python: 'def isValid(s):\n    # Your code here\n    pass',
            javascript: 'function isValid(s) {\n    // Your code here\n}',
            cpp: 'bool isValid(string s) {\n    // Your code here\n}',
            java: 'public boolean isValid(String s) {\n    // Your code here\n}'
        },
        fn_name: 'isValid'
    },
    {
        title: 'Merge Two Sorted Lists',
        description: 'Merge two sorted linked lists and return it as a sorted list.',
        difficulty: 'Easy', pattern: 'Linked List',
        constraints: 'The number of nodes in both lists is in range [0, 50].',
        companies: ['Amazon', 'Microsoft', 'Apple'],
        examples: [
            { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }
        ],
        test_cases: [
            { input: [[1, 2, 4], [1, 3, 4]], output: [1, 1, 2, 3, 4, 4] },
            { input: [[], []], output: [] },
            { input: [[], [0]], output: [0] }
        ],
        starter_code: {
            python: 'def mergeTwoLists(list1, list2):\n    # Your code here\n    pass',
            javascript: 'function mergeTwoLists(list1, list2) {\n    // Your code here\n}',
            cpp: 'ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {\n    // Your code here\n}',
            java: 'public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n    // Your code here\n}'
        },
        fn_name: 'mergeTwoLists'
    },
    {
        title: 'Reverse Linked List',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        difficulty: 'Easy', pattern: 'Linked List',
        constraints: 'The number of nodes in the list is in range [0, 5000].',
        companies: ['Amazon', 'Microsoft', 'Apple', 'Bloomberg'],
        examples: [
            { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }
        ],
        test_cases: [
            { input: [[1, 2, 3, 4, 5]], output: [5, 4, 3, 2, 1] },
            { input: [[1, 2]], output: [2, 1] },
            { input: [[]], output: [] }
        ],
        starter_code: {
            python: 'def reverseList(head):\n    # Your code here\n    pass',
            javascript: 'function reverseList(head) {\n    // Your code here\n}',
            cpp: 'ListNode* reverseList(ListNode* head) {\n    // Your code here\n}',
            java: 'public ListNode reverseList(ListNode head) {\n    // Your code here\n}'
        },
        fn_name: 'reverseList'
    },
    {
        title: 'Maximum Depth of Binary Tree',
        description: 'Given the root of a binary tree, return its maximum depth.',
        difficulty: 'Easy', pattern: 'Tree',
        constraints: 'The number of nodes is in range [0, 10^4].',
        companies: ['Amazon', 'Microsoft', 'LinkedIn'],
        examples: [
            { input: 'root = [3,9,20,null,null,15,7]', output: '3' }
        ],
        test_cases: [
            { input: [[3, 9, 20, null, null, 15, 7]], output: 3 },
            { input: [[1, null, 2]], output: 2 },
            { input: [[]], output: 0 }
        ],
        starter_code: {
            python: 'def maxDepth(root):\n    # Your code here\n    pass',
            javascript: 'function maxDepth(root) {\n    // Your code here\n}',
            cpp: 'int maxDepth(TreeNode* root) {\n    // Your code here\n}',
            java: 'public int maxDepth(TreeNode root) {\n    // Your code here\n}'
        },
        fn_name: 'maxDepth'
    },
    {
        title: 'Climbing Stairs',
        description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb?',
        difficulty: 'Easy', pattern: 'Dynamic Programming',
        constraints: '1 <= n <= 45',
        companies: ['Amazon', 'Google', 'Microsoft'],
        examples: [
            { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
            { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }
        ],
        test_cases: [
            { input: [2], output: 2 },
            { input: [3], output: 3 },
            { input: [1], output: 1 },
            { input: [5], output: 8 }
        ],
        starter_code: {
            python: 'def climbStairs(n):\n    # Your code here\n    pass',
            javascript: 'function climbStairs(n) {\n    // Your code here\n}',
            cpp: 'int climbStairs(int n) {\n    // Your code here\n}',
            java: 'public int climbStairs(int n) {\n    // Your code here\n}'
        },
        fn_name: 'climbStairs'
    },
    {
        title: 'Single Number',
        description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. Must use O(1) space.',
        difficulty: 'Easy', pattern: 'Bit Manipulation',
        constraints: '1 <= nums.length <= 3 * 10^4',
        companies: ['Amazon', 'Google'],
        examples: [
            { input: 'nums = [2,2,1]', output: '1' },
            { input: 'nums = [4,1,2,1,2]', output: '4' }
        ],
        test_cases: [
            { input: [[2, 2, 1]], output: 1 },
            { input: [[4, 1, 2, 1, 2]], output: 4 },
            { input: [[1]], output: 1 }
        ],
        starter_code: {
            python: 'def singleNumber(nums):\n    # Your code here\n    pass',
            javascript: 'function singleNumber(nums) {\n    // Your code here\n}',
            cpp: 'int singleNumber(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public int singleNumber(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'singleNumber'
    },
    {
        title: 'Longest Substring Without Repeating Characters',
        description: 'Given a string s, find the length of the longest substring without repeating characters.',
        difficulty: 'Medium', pattern: 'Sliding Window',
        constraints: '0 <= s.length <= 5 * 10^4',
        companies: ['Amazon', 'Facebook', 'Microsoft', 'Bloomberg'],
        examples: [
            { input: 's = "abcabcbb"', output: '3', explanation: 'Longest is "abc"' },
            { input: 's = "bbbbb"', output: '1' }
        ],
        test_cases: [
            { input: ['abcabcbb'], output: 3 },
            { input: ['bbbbb'], output: 1 },
            { input: ['pwwkew'], output: 3 },
            { input: [''], output: 0 }
        ],
        starter_code: {
            python: 'def lengthOfLongestSubstring(s):\n    # Your code here\n    pass',
            javascript: 'function lengthOfLongestSubstring(s) {\n    // Your code here\n}',
            cpp: 'int lengthOfLongestSubstring(string s) {\n    // Your code here\n}',
            java: 'public int lengthOfLongestSubstring(String s) {\n    // Your code here\n}'
        },
        fn_name: 'lengthOfLongestSubstring'
    },
    {
        title: 'Search in Rotated Sorted Array',
        description: 'Given a rotated sorted array nums and a target, return the index of target or -1.',
        difficulty: 'Medium', pattern: 'Binary Search',
        constraints: '1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4',
        companies: ['Facebook', 'Amazon', 'LinkedIn', 'Bloomberg'],
        examples: [
            { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' }
        ],
        test_cases: [
            { input: [[4, 5, 6, 7, 0, 1, 2], 0], output: 4 },
            { input: [[4, 5, 6, 7, 0, 1, 2], 3], output: -1 },
            { input: [[1], 0], output: -1 }
        ],
        starter_code: {
            python: 'def search(nums, target):\n    # Your code here\n    pass',
            javascript: 'function search(nums, target) {\n    // Your code here\n}',
            cpp: 'int search(vector<int>& nums, int target) {\n    // Your code here\n}',
            java: 'public int search(int[] nums, int target) {\n    // Your code here\n}'
        },
        fn_name: 'search'
    },
    {
        title: '3Sum',
        description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.',
        difficulty: 'Medium', pattern: 'Two Pointers',
        constraints: '3 <= nums.length <= 3000',
        companies: ['Facebook', 'Amazon', 'Microsoft', 'Bloomberg'],
        examples: [
            { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' }
        ],
        test_cases: [
            { input: [[-1, 0, 1, 2, -1, -4]], output: [[-1, -1, 2], [-1, 0, 1]] },
            { input: [[0, 1, 1]], output: [] },
            { input: [[0, 0, 0]], output: [[0, 0, 0]] }
        ],
        starter_code: {
            python: 'def threeSum(nums):\n    # Your code here\n    pass',
            javascript: 'function threeSum(nums) {\n    // Your code here\n}',
            cpp: 'vector<vector<int>> threeSum(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public List<List<Integer>> threeSum(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'threeSum'
    },
    {
        title: 'Container With Most Water',
        description: 'Given n non-negative integers a1, a2, ..., an where each represents a point at coordinate (i, ai). Find two lines that together with the x-axis form a container that holds the most water.',
        difficulty: 'Medium', pattern: 'Two Pointers',
        constraints: 'n >= 2\n0 <= height[i] <= 10^4',
        companies: ['Amazon', 'Google', 'Bloomberg'],
        examples: [
            { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' }
        ],
        test_cases: [
            { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], output: 49 },
            { input: [[1, 1]], output: 1 },
            { input: [[4, 3, 2, 1, 4]], output: 16 }
        ],
        starter_code: {
            python: 'def maxArea(height):\n    # Your code here\n    pass',
            javascript: 'function maxArea(height) {\n    // Your code here\n}',
            cpp: 'int maxArea(vector<int>& height) {\n    // Your code here\n}',
            java: 'public int maxArea(int[] height) {\n    // Your code here\n}'
        },
        fn_name: 'maxArea'
    },
    {
        title: 'Merge Intervals',
        description: 'Given an array of intervals, merge all overlapping intervals.',
        difficulty: 'Medium', pattern: 'Array',
        constraints: '1 <= intervals.length <= 10^4',
        companies: ['Facebook', 'Amazon', 'Google', 'Microsoft'],
        examples: [
            { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' }
        ],
        test_cases: [
            { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], output: [[1, 6], [8, 10], [15, 18]] },
            { input: [[[1, 4], [4, 5]]], output: [[1, 5]] }
        ],
        starter_code: {
            python: 'def merge(intervals):\n    # Your code here\n    pass',
            javascript: 'function merge(intervals) {\n    // Your code here\n}',
            cpp: 'vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    // Your code here\n}',
            java: 'public int[][] merge(int[][] intervals) {\n    // Your code here\n}'
        },
        fn_name: 'merge'
    },
    {
        title: 'Number of Islands',
        description: 'Given an m x n 2D binary grid, return the number of islands (connected 1s).',
        difficulty: 'Medium', pattern: 'Graph',
        constraints: 'm == grid.length\nn == grid[i].length',
        companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Facebook'],
        examples: [
            { input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', output: '2' }
        ],
        test_cases: [
            { input: [[['1', '1', '0'], ['1', '1', '0'], ['0', '0', '1']]], output: 2 },
            { input: [[['1', '0', '0'], ['0', '0', '0'], ['0', '0', '1']]], output: 2 }
        ],
        starter_code: {
            python: 'def numIslands(grid):\n    # Your code here\n    pass',
            javascript: 'function numIslands(grid) {\n    // Your code here\n}',
            cpp: 'int numIslands(vector<vector<char>>& grid) {\n    // Your code here\n}',
            java: 'public int numIslands(char[][] grid) {\n    // Your code here\n}'
        },
        fn_name: 'numIslands'
    },
    {
        title: 'Move Zeroes',
        description: 'Given an integer array nums, move all 0s to the end while maintaining the order of non-zero elements. Must do this in-place.',
        difficulty: 'Easy', pattern: 'Array',
        constraints: '1 <= nums.length <= 10^4',
        companies: ['Facebook', 'Amazon', 'Bloomberg'],
        examples: [
            { input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]' }
        ],
        test_cases: [
            { input: [[0, 1, 0, 3, 12]], output: [1, 3, 12, 0, 0] },
            { input: [[0]], output: [0] },
            { input: [[1, 2, 3]], output: [1, 2, 3] }
        ],
        starter_code: {
            python: 'def moveZeroes(nums):\n    # Your code here\n    pass',
            javascript: 'function moveZeroes(nums) {\n    // Your code here\n}',
            cpp: 'void moveZeroes(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public void moveZeroes(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'moveZeroes'
    },
    {
        title: 'Missing Number',
        description: 'Given an array nums containing n distinct numbers in [0, n], return the one number missing.',
        difficulty: 'Easy', pattern: 'Bit Manipulation',
        constraints: 'n == nums.length\n0 <= nums[i] <= n',
        companies: ['Amazon', 'Microsoft', 'Bloomberg'],
        examples: [
            { input: 'nums = [3,0,1]', output: '2' },
            { input: 'nums = [0,1]', output: '2' }
        ],
        test_cases: [
            { input: [[3, 0, 1]], output: 2 },
            { input: [[0, 1]], output: 2 },
            { input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], output: 8 }
        ],
        starter_code: {
            python: 'def missingNumber(nums):\n    # Your code here\n    pass',
            javascript: 'function missingNumber(nums) {\n    // Your code here\n}',
            cpp: 'int missingNumber(vector<int>& nums) {\n    // Your code here\n}',
            java: 'public int missingNumber(int[] nums) {\n    // Your code here\n}'
        },
        fn_name: 'missingNumber'
    }
];

// Generate generic test data for remaining problems
function generateGenericProblemData(title, pattern, difficulty, companies) {
    const fnName = title.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toLowerCase());
    return {
        title,
        description: `Solve the ${title} problem using the ${pattern} pattern.`,
        difficulty,
        pattern,
        constraints: 'See problem description for constraints.',
        companies: companies || [],
        examples: [
            { input: `See problem description`, output: `Expected output` }
        ],
        test_cases: [
            { input: ['example_input'], output: 'example_output' }
        ],
        starter_code: {
            python: `def solve():\n    # Implement ${title}\n    pass`,
            javascript: `function solve() {\n    // Implement ${title}\n}`,
            cpp: `// Implement ${title}`,
            java: `// Implement ${title}`
        },
        fn_name: fnName
    };
}

async function seedProblems() {
    console.log('Starting problem seeding...');
    await loadPatternMap();

    // First, delete existing problems to avoid duplicates
    const { error: delError } = await supabaseAdmin.from('problems').delete().gte('id', 1);
    if (delError) console.error('Error clearing problems:', delError.message);

    // Import all problems from DSA data files
    const { dsaProblems } = await import('../data/dsaProblems.js');
    const { extendedDsaProblems } = await import('../data/dsaProblemsExtended.js');
    const allLocalProblems = [...dsaProblems, ...extendedDsaProblems];

    console.log(`Found ${allLocalProblems.length} problems from local data`);
    console.log(`Found ${PROBLEM_DATA.length} problems with hand-crafted test cases`);

    // Create a map of hand-crafted data by title
    const handCraftedMap = {};
    for (const p of PROBLEM_DATA) {
        handCraftedMap[p.title.toLowerCase()] = p;
    }

    // Build all problems for insertion
    const problemsToInsert = [];
    for (const localP of allLocalProblems) {
        const handCrafted = handCraftedMap[localP.title.toLowerCase()];
        const patternId = getPatternId(localP.pattern);

        if (handCrafted) {
            problemsToInsert.push({
                title: localP.title,
                description: handCrafted.description,
                difficulty: localP.difficulty,
                pattern_id: patternId,
                constraints: handCrafted.constraints,
                examples: handCrafted.examples,
                test_cases: handCrafted.test_cases,
                starter_code: handCrafted.starter_code,
                companies: localP.companies || [],
                tags: [localP.pattern, localP.difficulty],
                hints: [],
            });
        } else {
            const generic = generateGenericProblemData(localP.title, localP.pattern, localP.difficulty, localP.companies);
            problemsToInsert.push({
                title: localP.title,
                description: generic.description,
                difficulty: localP.difficulty,
                pattern_id: patternId,
                constraints: generic.constraints,
                examples: generic.examples,
                test_cases: generic.test_cases,
                starter_code: generic.starter_code,
                companies: localP.companies || [],
                tags: [localP.pattern, localP.difficulty],
                hints: [],
            });
        }
    }

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    let inserted = 0;
    for (let i = 0; i < problemsToInsert.length; i += BATCH_SIZE) {
        const batch = problemsToInsert.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabaseAdmin.from('problems').insert(batch).select('id');
        if (error) {
            console.error(`Error inserting batch ${i}-${i + batch.length}:`, error.message);
        } else {
            inserted += (data || []).length;
            console.log(`Inserted ${inserted}/${problemsToInsert.length} problems`);
        }
    }

    console.log(`\nSeeding complete! ${inserted} problems inserted.`);
}

seedProblems().catch(console.error);
