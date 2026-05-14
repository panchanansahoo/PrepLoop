import json
import re

count = 0
try:
    with open('c:/tmp/prob.js', 'r', encoding='utf-8') as f:
        text = f.read()
except Exception as e:
    print('Failed to read file:', e)
    exit(1)

updates = {
  "171": {
    "leetcodeLink": "https://leetcode.com/problems/missing-number/",
    "description": "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
    "examples": [{"input": "nums = [3,0,1]", "output": "2"}, {"input": "nums = [0,1]", "output": "2"}, {"input": "nums = [9,6,4,2,3,5,7,0,1]", "output": "8"}],
    "constraints": "n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n\nAll the numbers of nums are unique."
  },
  "172": {
    "leetcodeLink": "https://leetcode.com/problems/single-number-iii/",
    "description": "Given an integer array nums, in which exactly two elements appear only once and all the other elements appear exactly twice. Find the two elements that appear only once. You can return the answer in any order.\n\nYou must write an algorithm that runs in linear runtime complexity and uses only constant extra space.",
    "examples": [{"input": "nums = [1,2,1,3,2,5]", "output": "[3,5]"}, {"input": "nums = [-1,0]", "output": "[-1,0]"}],
    "constraints": "2 <= nums.length <= 3 * 10^4\n-2^31 <= nums[i] <= 2^31 - 1\nEach integer in nums will appear twice, only two integers will appear once."
  },
  "173": {
    "leetcodeLink": "https://leetcode.com/problems/reverse-bits/",
    "description": "Reverse bits of a given 32 bits unsigned integer.",
    "examples": [{"input": "n = 00000010100101000001111010011100", "output": "964176192 (00111001011110000010100101000000)"}],
    "constraints": "The input must be a binary string of length 32"
  },
  "174": {
    "leetcodeLink": "https://leetcode.com/problems/counting-bits/",
    "description": "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.",
    "examples": [{"input": "n = 2", "output": "[0,1,1]", "explanation": "0 --> 0, 1 --> 1, 2 --> 10"}, {"input": "n = 5", "output": "[0,1,1,2,1,2]"}],
    "constraints": "0 <= n <= 10^5"
  },
  "175": {
    "leetcodeLink": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
    "description": "There are n cities connected by some number of flights. You are given an array flights where flights[i] = [fromi, toi, pricei] indicates that there is a flight from city fromi to city toi with cost pricei.\n\nYou are also given three integers src, dst, and k, return the cheapest price from src to dst with at most k stops. If there is no such route, return -1.",
    "examples": [{"input": "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1", "output": "700"}],
    "constraints": "1 <= n <= 100\n0 <= flights.length <= (n * (n - 1) / 2)\nflights[i].length == 3\n0 <= fromi, toi < n\n0 <= pricei <= 10^4\n1 <= k < n\n0 <= src, dst < n"
  },
  "176": {
    "leetcodeLink": "https://leetcode.com/problems/evaluate-division/",
    "description": "You are given an array of variable pairs equations and an array of real numbers values, where equations[i] = [Ai, Bi] and values[i] represent the equation Ai / Bi = values[i]. Each Ai or Bi is a string that represents a single variable.\n\nYou are also given some queries, where queries[j] = [Cj, Dj] represents the jth query where you must find the answer for Cj / Dj = ?.\n\nReturn the answers to all queries. If a single answer cannot be determined, return -1.0.",
    "examples": [{"input": "equations = [[\"a\",\"b\"],[\"b\",\"c\"]], values = [2.0,3.0], queries = [[\"a\",\"c\"],[\"b\",\"a\"],[\"a\",\"e\"],[\"a\",\"a\"],[\"x\",\"x\"]]", "output": "[6.00000,0.50000,-1.00000,1.00000,-1.00000]"}],
    "constraints": "1 <= equations.length <= 20\nequations[i].length == 2\n1 <= values.length <= 20\n1 <= queries.length <= 20\nqueries[i].length == 2"
  },
  "177": {
    "leetcodeLink": "https://leetcode.com/problems/reconstruct-itinerary/",
    "description": "You are given a list of airline tickets where tickets[i] = [fromi, toi] represent the departure and the arrival airports of one flight. Reconstruct the itinerary in order and return it.\n\nAll of the tickets belong to a man who departs from 'JFK', thus, the itinerary must begin with 'JFK'. If there are multiple valid itineraries, you should return the itinerary that has the smallest lexical order when read as a single string.",
    "examples": [{"input": "tickets = [[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]", "output": "[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]"}],
    "constraints": "1 <= tickets.length <= 300\ntickets[i].length == 2\nfromi.length == 3, toi.length == 3"
  },
  "178": {
    "leetcodeLink": "https://leetcode.com/problems/swim-in-rising-water/",
    "description": "You are given an n x n integer matrix grid where each value grid[i][j] represents the elevation at that point (i, j).\n\nThe rain starts to fall. At time t, the depth of the water everywhere is t. You can swim from a square to another 4-directionally adjacent square if and only if the elevation of both squares individually are at most t. You can swim infinite distances in zero time.\n\nReturn the least time until you can reach the bottom right square (n - 1, n - 1) if you start at the top left square (0, 0).",
    "examples": [{"input": "grid = [[0,2],[1,3]]", "output": "3"}, {"input": "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]", "output": "16"}],
    "constraints": "n == grid.length\nn == grid[i].length\n1 <= n <= 50\n0 <= grid[i][j] < n^2\nEach value grid[i][j] is unique."
  },
  "179": {
    "leetcodeLink": "https://leetcode.com/problems/merge-k-sorted-lists/",
    "description": "Given k sorted arrays of integers, merge them into a single sorted array. The elements in each array are sorted in ascending order.",
    "examples": [{"input": "arrays = [[1, 4, 5], [1, 3, 4], [2, 6]]", "output": "[1, 1, 2, 3, 4, 4, 5, 6]"}],
    "constraints": "k <= 10^4\nTotal number of elements in all arrays <= 10^5"
  },
  "180": {
    "leetcodeLink": "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/",
    "description": "You have k lists of sorted integers in non-decreasing order. Find the smallest range that includes at least one number from each of the k lists.\n\nWe define the range [a, b] is smaller than range [c, d] if b - a < d - c or a < c if b - a == d - c.",
    "examples": [{"input": "nums = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]", "output": "[20,24]", "explanation": "List 1: [20, 24] includes 24\nList 2: [20, 24] includes 20\nList 3: [20, 24] includes 22"}],
    "constraints": "nums.length == k\n1 <= k <= 3500\n1 <= nums[i].length <= 50\n-10^5 <= nums[i][j] <= 10^5"
  },
  "181": {
    "leetcodeLink": "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/",
    "description": "You are given two integer arrays nums1 and nums2 sorted in non-decreasing order and an integer k.\n\nDefine a pair (u, v) which consists of one element from the first array and one element from the second array.\n\nReturn the k pairs (u1, v1), (u2, v2), ..., (uk, vk) with the smallest sums.",
    "examples": [{"input": "nums1 = [1,7,11], nums2 = [2,4,6], k = 3", "output": "[[1,2],[1,4],[1,6]]", "explanation": "The first 3 pairs are returned from the sequence: [1,2],[1,4],[1,6],[7,2],[7,4],[11,2],[7,6],[11,4],[11,6]"}],
    "constraints": "1 <= nums1.length, nums2.length <= 10^5\n-10^9 <= nums1[i], nums2[i] <= 10^9\nnums1 and nums2 both are sorted in non-decreasing order.\n1 <= k <= 10^4"
  },
  "182": {
    "leetcodeLink": "https://leetcode.com/problems/search-a-2d-matrix-ii/",
    "description": "Write an efficient algorithm that searches for a value target in an m x n integer matrix matrix. This matrix has the following properties:\n\nIntegers in each row are sorted in ascending from left to right.\nIntegers in each column are sorted in ascending from top to bottom.",
    "examples": [{"input": "matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 5", "output": "true"}, {"input": "matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 20", "output": "false"}],
    "constraints": "m == matrix.length\nn == matrix[i].length\n1 <= n, m <= 300\n-10^9 <= matrix[i][j] <= 10^9\nAll the integers in each row and column are sorted in ascending order."
  },
  "183": {
    "leetcodeLink": "https://leetcode.com/problems/triangle/",
    "description": "Given a triangle array, return the minimum path sum from top to bottom.\n\nFor each step, you may move to an adjacent number of the row below. More formally, if you are on index i on the current row, you may move to either index i or index i + 1 on the next row.",
    "examples": [{"input": "triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]", "output": "11", "explanation": "The minimum path sum from top to bottom is 2 + 3 + 5 + 1 = 11."}, {"input": "triangle = [[-10]]", "output": "-10"}],
    "constraints": "1 <= triangle.length <= 200\ntriangle[0].length == 1\ntriangle[i].length == triangle[i - 1].length + 1\n-10^4 <= triangle[i][j] <= 10^4"
  },
  "184": {
    "leetcodeLink": "https://leetcode.com/problems/game-of-life/",
    "description": "According to Wikipedia's article: 'The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970.'\n\nThe board is made up of an m x n grid of cells, where each cell has an initial state: live (represented by a 1) or dead (represented by a 0). Each cell interacts with its eight neighbors (horizontal, vertical, diagonal) using the following four rules:\nAny live cell with fewer than two live neighbors dies as if caused by under-population.\nAny live cell with two or three live neighbors lives on to the next generation.\nAny live cell with more than three live neighbors dies, as if by over-population.\nAny dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.\nThe next state is created by applying the above rules simultaneously to every cell in the current state, where births and deaths occur simultaneously. Given the current state of the m x n grid board, return the next state.",
    "examples": [{"input": "board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]", "output": "[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]"}],
    "constraints": "m == board.length\nn == board[i].length\n1 <= m, n <= 25\nboard[i][j] is 0 or 1."
  },
  "185": {
    "leetcodeLink": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    "description": "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent. Return the answer in any order.\n\nA mapping of digits to letters (just like on the telephone buttons) is given below. Note that 1 does not map to any letters.",
    "examples": [{"input": "digits = \"23\"", "output": "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]"}, {"input": "digits = \"\"", "output": "[]"}, {"input": "digits = \"2\"", "output": "[\"a\",\"b\",\"c\"]"}],
    "constraints": "0 <= digits.length <= 4\ndigits[i] is a digit in the range ['2', '9']."
  },
  "186": {
    "leetcodeLink": "https://leetcode.com/problems/restore-ip-addresses/",
    "description": "A valid IP address consists of exactly four integers separated by single dots. Each integer is between 0 and 255 (inclusive) and cannot have leading zeros.\n\nFor example, '0.1.2.201' and '192.168.1.1' are valid IP addresses, but '0.011.255.245', '192.168.1.312' and '192.168@1.1' are invalid IP addresses.\nGiven a string s containing only digits, return all possible valid IP addresses that can be formed by inserting dots into s. You are not allowed to reorder or remove any digits in s.",
    "examples": [{"input": "s = \"25525511135\"", "output": "[\"255.255.11.135\",\"255.255.111.35\"]"}, {"input": "s = \"0000\"", "output": "[\"0.0.0.0\"]"}],
    "constraints": "1 <= s.length <= 20\ns consists of digits only."
  },
  "187": {
    "leetcodeLink": "https://leetcode.com/problems/expression-add-operators/",
    "description": "Given a string num that contains only digits and an integer target, return all possibilities to insert the binary operators '+', '-', and/or '*' between the digits of num so that the resultant expression evaluates to the target value.\n\nNote that operands in the returned expressions should not contain leading zeros.",
    "examples": [{"input": "num = \"123\", target = 6", "output": "[\"1*2*3\",\"1+2+3\"]"}, {"input": "num = \"232\", target = 8", "output": "[\"2*3+2\",\"2+3*2\"]"}],
    "constraints": "1 <= num.length <= 10\nnum consists of only digits.\n-2^31 <= target <= 2^31 - 1"
  },
  "188": {
    "leetcodeLink": "https://leetcode.com/problems/beautiful-arrangement/",
    "description": "Suppose you have n integers labeled 1 through n. A permutation of those n integers perm (1-indexed) is considered a beautiful arrangement if for every i (1 <= i <= n), either of the following is true:\n\nperm[i] is divisible by i.\ni is divisible by perm[i].\nGiven an integer n, return the number of the beautiful arrangements that you can construct.",
    "examples": [{"input": "n = 2", "output": "2", "explanation": "The first beautiful arrangement is [1, 2]:\n- perm[1] = 1 is divisible by i = 1\n- perm[2] = 2 is divisible by i = 2\nThe second beautiful arrangement is [2, 1]:\n- perm[1] = 2 is divisible by i = 1\n- i = 2 is divisible by perm[2] = 1"}],
    "constraints": "1 <= n <= 15"
  },
  "189": {
    "leetcodeLink": "https://leetcode.com/problems/lfu-cache/",
    "description": "Design and implement a data structure for a Least Frequently Used (LFU) cache.\n\nImplement the LFUCache class:\nLFUCache(int capacity) Initializes the object with the capacity of the data structure.\nint get(int key) Gets the value of the key if the key exists in the cache. Otherwise, returns -1.\nvoid put(int key, int value) Update the value of the key if present, or inserts the key if not already present. When the cache reaches its capacity, it should invalidate and remove the least frequently used key before inserting a new item. For this problem, when there is a tie (i.e., two or more keys with the same frequency), the least recently used key would be invalidated.",
    "examples": [{"input": "[\"LFUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"get\", \"put\", \"get\", \"get\", \"get\"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]]", "output": "[null, null, null, 1, null, -1, 3, null, -1, 3, 4]"}],
    "constraints": "1 <= capacity <= 10^4\n0 <= key <= 10^5\n0 <= value <= 10^9\nAt most 2 * 10^5 calls will be made to get and put."
  },
  "190": {
    "leetcodeLink": "https://leetcode.com/problems/design-hit-counter/",
    "description": "Design a hit counter which counts the number of hits received in the past 5 minutes (i.e., the past 300 seconds).\n\nYour system should accept a timestamp parameter (in seconds granularity), and you may assume that calls are being made to the system in chronological order (i.e., timestamp is monotonically increasing). Several hits may arrive roughly at the same time.",
    "examples": [{"input": "[\"HitCounter\", \"hit\", \"hit\", \"hit\", \"getHits\", \"hit\", \"getHits\", \"getHits\"]\n[[], [1], [2], [3], [4], [300], [300], [301]]", "output": "[null, null, null, null, 3, null, 4, 3]"}],
    "constraints": "1 <= timestamp <= 2 * 10^9\nAll calls to hit and getHits will use monotonically increasing timestamps."
  },
  "191": {
    "leetcodeLink": "https://leetcode.com/problems/implement-stack-using-queues/",
    "description": "Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).\n\nImplement the MyStack class.",
    "examples": [{"input": "[\"MyStack\", \"push\", \"push\", \"top\", \"pop\", \"empty\"]\n[[], [1], [2], [], [], []]", "output": "[null, null, null, 2, 2, false]"}],
    "constraints": "1 <= x <= 9\nAt most 100 calls will be made to push, pop, top, and empty."
  },
  "192": {
    "leetcodeLink": "https://leetcode.com/problems/happy-number/",
    "description": "Write an algorithm to determine if a number n is happy.\n\nA happy number is a number defined by the following process:\nStarting with any positive integer, replace the number by the sum of the squares of its digits.\nRepeat the process until the number equals 1 (where it will stay), or it loops endlessly in a cycle which does not include 1.\nThose numbers for which this process ends in 1 are happy.",
    "examples": [{"input": "n = 19", "output": "true", "explanation": "1^2 + 9^2 = 82\n8^2 + 2^2 = 68\n6^2 + 8^2 = 100\n1^2 + 0^2 + 0^2 = 1"}, {"input": "n = 2", "output": "false"}],
    "constraints": "1 <= n <= 2^31 - 1"
  },
  "193": {
    "leetcodeLink": "https://leetcode.com/problems/factorial-trailing-zeroes/",
    "description": "Given an integer n, return the number of trailing zeroes in n!.",
    "examples": [{"input": "n = 3", "output": "0", "explanation": "3! = 6, no trailing zero."}, {"input": "n = 5", "output": "1", "explanation": "5! = 120, one trailing zero."}],
    "constraints": "0 <= n <= 10^4"
  },
  "194": {
    "leetcodeLink": "https://leetcode.com/problems/ugly-number-ii/",
    "description": "An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5.\n\nGiven an integer n, return the nth ugly number.",
    "examples": [{"input": "n = 10", "output": "12", "explanation": "[1, 2, 3, 4, 5, 6, 8, 9, 10, 12] is the sequence of the first 10 ugly numbers."}, {"input": "n = 1", "output": "1"}],
    "constraints": "1 <= n <= 1690"
  },
  "195": {
    "leetcodeLink": "https://leetcode.com/problems/integer-to-english-words/",
    "description": "Convert a non-negative integer num to its English words representation.",
    "examples": [{"input": "num = 123", "output": "\"One Hundred Twenty Three\""}, {"input": "num = 12345", "output": "\"Twelve Thousand Three Hundred Forty Five\""}],
    "constraints": "0 <= num <= 2^31 - 1"
  },
  "196": {
    "leetcodeLink": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    "description": "Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.",
    "examples": [{"input": "root = [3,1,4,null,2], k = 1", "output": "1"}, {"input": "root = [5,3,6,2,4,null,null,1], k = 3", "output": "3"}],
    "constraints": "The number of nodes in the tree is n.\n1 <= k <= n <= 10^4\n0 <= Node.val <= 10^4"
  },
  "197": {
    "leetcodeLink": "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",
    "description": "Given the root of a binary tree, flatten the tree into a 'linked list':\n\nThe 'linked list' should use the same TreeNode class where the right child pointer points to the next node in the list and the left child pointer is always null.\nThe 'linked list' should be in the same order as a pre-order traversal of the binary tree.",
    "examples": [{"input": "root = [1,2,5,3,4,null,6]", "output": "[1,null,2,null,3,null,4,null,5,null,6]"}, {"input": "root = []", "output": "[]"}],
    "constraints": "The number of nodes in the tree is in the range [0, 2000].\n-100 <= Node.val <= 100"
  },
  "198": {
    "leetcodeLink": "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/",
    "description": "Given the root of a binary tree, the value of a target node target, and an integer k, return an array of the values of all nodes that have a distance k from the target node.\n\nYou can return the answer in any order.",
    "examples": [{"input": "root = [3,5,1,6,2,0,8,null,null,7,4], target = 5, k = 2", "output": "[7,4,1]"}, {"input": "root = [1], target = 1, k = 3", "output": "[]"}],
    "constraints": "The number of nodes in the tree is in the range [1, 500].\n0 <= Node.val <= 500\nAll the values Node.val are unique.\ntarget is the value of one of the nodes in the tree."
  },
  "199": {
    "leetcodeLink": "https://leetcode.com/problems/binary-tree-cameras/",
    "description": "You are given the root of a binary tree. We install cameras on the tree nodes where each camera at a node can monitor its parent, itself, and its immediate children.\n\nReturn the minimum number of cameras needed to monitor all nodes of the tree.",
    "examples": [{"input": "root = [0,0,null,0,0]", "output": "1", "explanation": "One camera is enough to monitor all nodes if placed correctly."}, {"input": "root = [0,0,null,0,null,0,null,null,0]", "output": "2"}],
    "constraints": "The number of nodes in the tree is in the range [1, 1000].\nNode.val == 0"
  },
  "200": {
    "leetcodeLink": "https://leetcode.com/problems/sum-root-to-leaf-numbers/",
    "description": "You are given the root of a binary tree containing digits from 0 to 9 only.\n\nEach root-to-leaf path in the tree represents a number. For example, the root-to-leaf path 1 -> 2 -> 3 represents the number 123.\n\nReturn the total sum of all root-to-leaf numbers. Test cases are generated so that the answer will fit in a 32-bit integer.",
    "examples": [{"input": "root = [1,2,3]", "output": "25", "explanation": "The root-to-leaf path 1->2 represents the number 12.\nThe root-to-leaf path 1->3 represents the number 13.\nTherefore, sum = 12 + 13 = 25."}],
    "constraints": "The number of nodes in the tree is in the range [1, 1000].\n0 <= Node.val <= 9\nThe depth of the tree will not exceed 10."
  },
  "201": {
    "leetcodeLink": "https://leetcode.com/problems/majority-element/",
    "description": "Given an array nums of size n, return the majority element.\n\nThe majority element is the element that appears more than ⌊n / 2⌋ times. You may assume that the majority element always exists in the array.",
    "examples": [{"input": "nums = [3,2,3]", "output": "3"}, {"input": "nums = [2,2,1,1,1,2,2]", "output": "2"}],
    "constraints": "n == nums.length\n1 <= n <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9"
  },
  "202": {
    "leetcodeLink": "https://leetcode.com/problems/next-permutation/",
    "description": "A permutation of an array of integers is an arrangement of its members into a sequence or linear order.\n\nFor example, for arr = [1,2,3], the following are all the permutations of arr: [1,2,3], [1,3,2], [2, 1, 3], [2, 3, 1], [3,1,2], [3,2,1].\nThe next permutation of an array of integers is the next lexicographically greater permutation of its integer. More formally, if all the permutations of the array are sorted in one container according to their lexicographical order, then the next permutation of that array is the permutation that follows it in the sorted container.",
    "examples": [{"input": "nums = [1,2,3]", "output": "[1,3,2]"}, {"input": "nums = [3,2,1]", "output": "[1,2,3]"}],
    "constraints": "1 <= nums.length <= 100\n0 <= nums[i] <= 100"
  },
  "203": {
    "leetcodeLink": "https://leetcode.com/problems/longest-valid-parentheses/",
    "description": "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    "examples": [{"input": "s = \"(()\"", "output": "2", "explanation": "The longest valid parentheses substring is \"()\"."}, {"input": "s = \")()())\"", "output": "4", "explanation": "The longest valid parentheses substring is \"()()\"."}],
    "constraints": "0 <= s.length <= 3 * 10^4\ns[i] is '(', or ')'."
  },
  "204": {
    "leetcodeLink": "https://leetcode.com/problems/minimum-window-substring/",
    "description": "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string \"\".",
    "examples": [{"input": "s = \"ADOBECODEBANC\", t = \"ABC\"", "output": "\"BANC\""}, {"input": "s = \"a\", t = \"a\"", "output": "\"a\""}],
    "constraints": "m == s.length\nn == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters."
  },
  "205": {
    "leetcodeLink": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "description": "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. For example, the array nums = [0,1,2,4,5,6,7] might become:\n[4,5,6,7,0,1,2] if it was rotated 4 times.\n[0,1,2,4,5,6,7] if it was rotated 7 times.\nNotice that rotating an array [a[0], a[1], a[2], ..., a[n-1]] 1 time results in the array [a[n-1], a[0], a[1], a[2], ..., a[n-2]].\n\nGiven the sorted rotated array nums of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.",
    "examples": [{"input": "nums = [3,4,5,1,2]", "output": "1"}, {"input": "nums = [4,5,6,7,0,1,2]", "output": "0"}],
    "constraints": "n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nAll the integers of nums are unique.\nnums is sorted and rotated between 1 and n times."
  }
}

for pid, u in updates.items():
    idx = text.find('id: ' + pid + ',')
    if idx == -1: 
        print(f"id {pid} not found")
        continue
    
    nxt = text.find('id: ' + str(int(pid)+1) + ',')
    if nxt == -1: nxt = len(text)
    
    chunk = text[idx:nxt]
    
    m = re.search(r"leetcodeLink:\s*'([^']*)'", chunk)
    if m: chunk = chunk[:m.start(1)] + u['leetcodeLink'] + chunk[m.end(1):]
    
    m = re.search(r"description:\s*'(.*?)',\s*examples:\s*\[", chunk, re.DOTALL)
    if m: chunk = chunk[:m.start(1)] + u['description'].replace("'", "\\'") + chunk[m.end(1):]
    
    m = re.search(r"constraints:\s*'(.*?)'\s*(?:,|})", chunk, re.DOTALL)
    if m: chunk = chunk[:m.start(1)] + u['constraints'].replace("'", "\\'") + chunk[m.end(1):]
    
    m = re.search(r"examples:\s*\[(.*?)\],\s*constraints:\s*", chunk, re.DOTALL)
    if m: 
        ex_str = json.dumps(u['examples']).replace("'", "\\'")
        chunk = chunk[:m.start(1)-1] + ex_str + chunk[m.end(1)+1:]

    text = text[:idx] + chunk + text[nxt:]
    count += 1

with open('c:/Users/panch/Desktop/careerloop/frontend/src/data/problemsDatabase.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('done', count)
