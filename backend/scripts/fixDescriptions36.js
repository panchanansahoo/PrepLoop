/**
 * Fix 36 remaining description mismatches
 * Each problem currently has a description belonging to a different problem.
 * This script writes manually-authored correct descriptions.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

const fixes = {
    25: {
        title: "Pascal's Triangle",
        description: `Given an integer numRows, return the first numRows of Pascal's triangle.

In Pascal's triangle, each number is the sum of the two numbers directly above it.

Example:
Input: numRows = 5
Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]`
    },
    57: {
        title: "Remove Duplicates from Sorted List",
        description: `Given the head of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.

Example:
Input: head = [1,1,2]
Output: [1,2]

Example:
Input: head = [1,1,2,3,3]
Output: [1,2,3]`
    },
    58: {
        title: "Remove Duplicates from Sorted List II",
        description: `Given the head of a sorted linked list, delete all nodes that have duplicate numbers, leaving only distinct numbers from the original list. Return the linked list sorted as well.

Example:
Input: head = [1,2,3,3,4,4,5]
Output: [1,2,5]

Example:
Input: head = [1,1,1,2,3]
Output: [2,3]`
    },
    59: {
        title: "Partition List",
        description: `Given the head of a linked list and a value x, partition it such that all nodes less than x come before nodes greater than or equal to x.

You should preserve the original relative order of the nodes in each of the two partitions.

Example:
Input: head = [1,4,3,2,5,2], x = 3
Output: [1,2,2,4,3,5]`
    },
    60: {
        title: "Sort List",
        description: `Given the head of a linked list, return the list after sorting it in ascending order.

Follow up: Can you sort the linked list in O(n log n) time and O(1) memory (i.e. constant space)?

Example:
Input: head = [4,2,1,3]
Output: [1,2,3,4]`
    },
    84: {
        title: "Remove Nth Node From End of List",
        description: `Given the head of a linked list, remove the nth node from the end of the list and return its head.

Example:
Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]

Example:
Input: head = [1], n = 1
Output: []`
    },
    85: {
        title: "Rotate List",
        description: `Given the head of a linked list, rotate the list to the right by k places.

Example:
Input: head = [1,2,3,4,5], k = 2
Output: [4,5,1,2,3]

Example:
Input: head = [0,1,2], k = 4
Output: [2,0,1]`
    },
    118: {
        title: "Detect Cycle in LinkedList",
        description: `Given head, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.

Return true if there is a cycle in the linked list. Otherwise, return false.

Example:
Input: head = [3,2,0,-4], pos = 1
Output: true
Explanation: There is a cycle where the tail connects to the 1st node (0-indexed).`
    },
    125: {
        title: "Rotate List",
        description: `Given the head of a linked list, rotate the list to the right by k places.

Example:
Input: head = [1,2,3,4,5], k = 2
Output: [4,5,1,2,3]

Example:
Input: head = [0,1,2], k = 4
Output: [2,0,1]`
    },
    126: {
        title: "Delete Middle Node of LinkedList",
        description: `You are given the head of a linked list. Delete the middle node, and return the head of the modified linked list.

The middle node of a linked list of size n is the ⌊n / 2⌋th node from the start using 0-based indexing, where ⌊x⌋ denotes the largest integer less than or equal to x.

Example:
Input: head = [1,3,4,7,1,2,6]
Output: [1,3,4,1,2,6]
Explanation: The middle node with value 7 is removed.`
    },
    156: {
        title: "Sort List",
        description: `Given the head of a linked list, return the list after sorting it in ascending order.

Follow up: Can you sort the linked list in O(n log n) time and O(1) memory (i.e. constant space)?

Example:
Input: head = [4,2,1,3]
Output: [1,2,3,4]

Example:
Input: head = [-1,5,3,4,0]
Output: [-1,0,3,4,5]`
    },
    183: {
        title: "Valid Parenthesis String",
        description: `Given a string s containing only three types of characters: '(', ')' and '*', return true if s is valid.

The following rules define a valid string:
- Any left parenthesis '(' must have a corresponding right parenthesis ')'.
- Any right parenthesis ')' must have a corresponding left parenthesis '('.
- Left parenthesis '(' must go before the corresponding right parenthesis ')'.
- '*' could be treated as a single right parenthesis ')' or a single left parenthesis '(' or an empty string "".

Example:
Input: s = "(*))"
Output: true`
    },
    184: {
        title: "Minimum Add to Make Parentheses Valid",
        description: `A parentheses string is valid if and only if it is the empty string, or it can be written as AB (A concatenated with B) where A and B are valid strings, or it can be written as (A) where A is a valid string.

Given a parentheses string s, return the minimum number of parentheses we must add to make the resulting string valid.

Example:
Input: s = "())"
Output: 1

Example:
Input: s = "((("
Output: 3`
    },
    185: {
        title: "Minimum Remove to Make Valid Parentheses",
        description: `Given a string s of '(', ')' and lowercase English characters, remove the minimum number of parentheses (either '(' or ')') so that the resulting parentheses string is valid and return any valid string.

A valid parentheses string satisfies:
- It is the empty string, contains only lowercase characters, or
- It can be written as AB (A concatenated with B), or
- It can be written as (A), where A is a valid parentheses string.

Example:
Input: s = "lee(t(c)o)de)"
Output: "lee(t(c)o)de"`
    },
    186: {
        title: "Maximum Nesting Depth of Parentheses",
        description: `A string is a valid parentheses string (denoted VPS) if it meets one of the following conditions. Given a VPS represented as string s, return the nesting depth of s.

The nesting depth is the maximum number of nested parentheses.

Example:
Input: s = "(1+(2*3)+((8)/4))+1"
Output: 3
Explanation: Digit 8 is inside of 3 nested parentheses in the string.

Example:
Input: s = "(1)+((2))+(((3)))"
Output: 3`
    },
    218: {
        title: "Find Median from Data Stream",
        description: `The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.

Implement the MedianFinder class:
- MedianFinder() initializes the MedianFinder object.
- void addNum(int num) adds the integer num to the data structure.
- double findMedian() returns the median of all elements so far.

Example:
Input: ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]
[[], [1], [2], [], [3], []]
Output: [null, null, null, 1.5, null, 2.0]`
    },
    220: {
        title: "Powx n",
        description: `Implement pow(x, n), which calculates x raised to the power n (i.e., x^n).

Example:
Input: x = 2.00000, n = 10
Output: 1024.00000

Example:
Input: x = 2.10000, n = 3
Output: 9.26100

Example:
Input: x = 2.00000, n = -2
Output: 0.25000
Explanation: 2^(-2) = 1/2^2 = 1/4 = 0.25`
    },
    232: {
        title: "Path Sum",
        description: `Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum.

A leaf is a node with no children.

Example:
Input: root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22
Output: true
Explanation: The root-to-leaf path 5 -> 4 -> 11 -> 2 sums to 22.`
    },
    233: {
        title: "Path Sum II",
        description: `Given the root of a binary tree and an integer targetSum, return all root-to-leaf paths where the sum of the node values in the path equals targetSum. Each path should be returned as a list of the node values, not node references.

A root-to-leaf path is a path starting from the root and ending at any leaf node.

Example:
Input: root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22
Output: [[5,4,11,2],[5,8,4,5]]`
    },
    236: {
        title: "Sum Root to Leaf Numbers",
        description: `You are given the root of a binary tree containing digits from 0 to 9 only. Each root-to-leaf path in the tree represents a number.

For example, the root-to-leaf path 1 -> 2 -> 3 represents the number 123.

Return the total sum of all root-to-leaf numbers.

Example:
Input: root = [1,2,3]
Output: 25
Explanation: The root-to-leaf path 1->2 represents the number 12. The root-to-leaf path 1->3 represents the number 13. Therefore, sum = 12 + 13 = 25.`
    },
    247: {
        title: "Validate Binary Search Tree",
        description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).

A valid BST is defined as follows:
- The left subtree of a node contains only nodes with keys less than the node's key.
- The right subtree of a node contains only nodes with keys greater than the node's key.
- Both the left and right subtrees must also be binary search trees.

Example:
Input: root = [2,1,3]
Output: true

Example:
Input: root = [5,1,4,null,null,3,6]
Output: false`
    },
    249: {
        title: "Binary Search Tree Iterator",
        description: `Implement the BSTIterator class that represents an iterator over the in-order traversal of a binary search tree (BST):

- BSTIterator(TreeNode root) Initializes an object. The root of the BST is given as part of the constructor. The pointer should be initialized to a non-existent number smaller than any element in the BST.
- boolean hasNext() Returns true if there exists a number in the traversal to the right of the pointer, otherwise returns false.
- int next() Moves the pointer to the right, then returns the number at the pointer.

Example:
Input: ["BSTIterator", "next", "next", "hasNext", "next", "hasNext", "next", "hasNext", "next", "hasNext"]
[[7, 3, 15, null, null, 9, 20]], [], [], [], [], [], [], [], [], []]
Output: [null, 3, 7, true, 9, true, 15, true, 20, false]`
    },
    254: {
        title: "Serialize and Deserialize BST",
        description: `Serialization is converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary search tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a BST can be serialized to a string and this string can be deserialized to the original tree structure.

Example:
Input: root = [2,1,3]
Output: [2,1,3]`
    },
    259: {
        title: "Recover Binary Search Tree",
        description: `You are given the root of a binary search tree (BST), where the values of exactly two nodes of the tree were swapped by mistake. Recover the tree without changing its structure.

Example:
Input: root = [1,3,null,null,2]
Output: [3,1,null,null,2]
Explanation: 3 and 1 are swapped. Swapping them back gives [3,1,null,null,2].

Example:
Input: root = [3,1,4,null,null,2]
Output: [2,1,4,null,null,3]`
    },
    260: {
        title: "Unique Binary Search Trees",
        description: `Given an integer n, return the number of structurally unique BST's (binary search trees) which has exactly n nodes of unique values from 1 to n.

Example:
Input: n = 3
Output: 5

Example:
Input: n = 1
Output: 1`
    },
    261: {
        title: "Unique Binary Search Trees II",
        description: `Given an integer n, return all the structurally unique BST's (binary search trees), which has exactly n nodes of unique values from 1 to n. Return the answer in any order.

Example:
Input: n = 3
Output: [[1,null,2,null,3],[1,null,3,2],[2,1,3],[3,1,null,null,2],[3,2,null,1]]

Example:
Input: n = 1
Output: [[1]]`
    },
    270: {
        title: "Graph Valid Tree",
        description: `You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and a list of edges where edges[i] = [ai, bi] indicates that there is an undirected edge between nodes ai and bi in the graph.

Return true if the edges of the given graph make up a valid tree, and false otherwise.

A valid tree is a connected graph with no cycles and exactly n - 1 edges.

Example:
Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true

Example:
Input: n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false`
    },
    279: {
        title: "Minimum Height Trees",
        description: `A tree is an undirected graph in which any two vertices are connected by exactly one path. Given a tree of n nodes labelled from 0 to n - 1, and an array of n - 1 edges, find all the roots of the Minimum Height Trees (MHTs).

Return a list of all MHTs' root labels. The height of a rooted tree is the number of edges on the longest downward path between the root and a leaf.

Example:
Input: n = 4, edges = [[1,0],[1,2],[1,3]]
Output: [1]

Example:
Input: n = 6, edges = [[3,0],[3,1],[3,2],[3,4],[5,4]]
Output: [3,4]`
    },
    292: {
        title: "Find if Path Exists in Graph",
        description: `There is a bi-directional graph with n vertices, where each vertex is labeled from 0 to n - 1. The edges in the graph are represented as a 2D integer array edges, where each edges[i] = [ui, vi] denotes a bi-directional edge between vertex ui and vertex vi.

Determine if there is a valid path that exists from vertex source to vertex destination.

Example:
Input: n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2
Output: true

Example:
Input: n = 6, edges = [[0,1],[0,2],[3,5],[5,4],[4,3]], source = 0, destination = 5
Output: false`
    },
    294: {
        title: "Shortest Path in Binary Matrix",
        description: `Given an n x n binary matrix grid, return the length of the shortest clear path in the matrix. If there is no clear path, return -1.

A clear path in a binary matrix is a path from the top-left cell (i.e., (0, 0)) to the bottom-right cell (i.e., (n - 1, n - 1)) such that all the visited cells are 0. Adjacent cells are 8-directionally connected (i.e., they are different and share an edge or a corner).

Example:
Input: grid = [[0,1],[1,0]]
Output: 2

Example:
Input: grid = [[0,0,0],[1,1,0],[1,1,0]]
Output: 4`
    },
    316: {
        title: "Palindromic Substrings",
        description: `Given a string s, return the number of palindromic substrings in it.

A string is a palindrome when it reads the same backward as forward. A substring is a contiguous sequence of characters within the string.

Example:
Input: s = "abc"
Output: 3
Explanation: Three palindromic strings: "a", "b", "c".

Example:
Input: s = "aaa"
Output: 6
Explanation: Six palindromic strings: "a", "a", "a", "aa", "aa", "aaa".`
    },
    344: {
        title: "Unique Binary Search Trees",
        description: `Given an integer n, return the number of structurally unique BST's (binary search trees) which has exactly n nodes of unique values from 1 to n.

Example:
Input: n = 3
Output: 5

Example:
Input: n = 1
Output: 1`
    },
    378: {
        title: "Kth Smallest Element in a Sorted Matrix",
        description: `Given an n x n matrix where each of the rows and columns is sorted in ascending order, return the kth smallest element in the matrix.

Note that it is the kth smallest element in the sorted order, not the kth distinct element.

You must find a solution with a memory complexity better than O(n^2).

Example:
Input: matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8
Output: 13
Explanation: The elements in the matrix sorted are [1,5,9,10,11,12,13,13,15], and the 8th smallest is 13.`
    },
    384: {
        title: "Reorganize String",
        description: `Given a string s, rearrange the characters of s so that any two adjacent characters are not the same.

Return any possible rearrangement of s or return "" if not possible.

Example:
Input: s = "aab"
Output: "aba"

Example:
Input: s = "aaab"
Output: ""`
    },
    385: {
        title: "Rearrange String k Distance Apart",
        description: `Given a string s and an integer k, rearrange the string such that the same characters are at least distance k from each other. If it is not possible to rearrange the string, return an empty string "".

Example:
Input: s = "aabbcc", k = 3
Output: "abcabc"
Explanation: The same letters are at least a distance of 3 from each other.

Example:
Input: s = "aaabc", k = 3
Output: ""
Explanation: No way to rearrange to satisfy the distance constraint.`
    },
    412: {
        title: "Jump Game",
        description: `You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Return true if you can reach the last index, or false otherwise.

Example:
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.

Example:
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.`
    },
};

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('   Fix 36 Description Mismatches');
    console.log('═══════════════════════════════════════════════════\n');

    let fixed = 0, errors = 0;

    for (const [idStr, fix] of Object.entries(fixes)) {
        const id = parseInt(idStr);
        const { error } = await sb
            .from('problems')
            .update({ description: fix.description })
            .eq('id', id);

        if (error) {
            console.log(`  ❌ [${id}] ${fix.title}: ${error.message}`);
            errors++;
        } else {
            console.log(`  ✅ [${id}] ${fix.title}`);
            fixed++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`   Done! Fixed: ${fixed}, Errors: ${errors}`);
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
