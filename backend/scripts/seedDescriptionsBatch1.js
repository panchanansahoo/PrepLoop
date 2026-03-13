// Batch 1: Array pattern problems — real descriptions & constraints
import { supabaseAdmin } from '../db/supabaseClient.js';

const updates = [
    {
        id: 12,
        title: 'Maximum Product Subarray',
        description: `Given an integer array nums, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a 32-bit integer.

A subarray is a contiguous non-empty sequence of elements within an array.`,
        constraints: `1 <= nums.length <= 2 * 10^4
-10 <= nums[i] <= 10
The product of any subarray of nums is guaranteed to fit in a 32-bit integer.`
    },
    {
        id: 13,
        title: 'Find Minimum in Rotated Sorted Array',
        description: `Suppose an array of length n sorted in ascending order is rotated between 1 and n times. For example, the array nums = [0,1,2,4,5,6,7] might become [4,5,6,7,0,1,2] if it was rotated 4 times.

Given the sorted rotated array nums of unique elements, return the minimum element of this array.

You must write an algorithm that runs in O(log n) time.`,
        constraints: `n == nums.length
1 <= n <= 5000
-5000 <= nums[i] <= 5000
All the integers of nums are unique.
nums is sorted and rotated between 1 and n times.`
    },
    {
        id: 17,
        title: '4Sum',
        description: `Given an array nums of n integers, return an array of all the unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that:

- 0 <= a, b, c, d < n
- a, b, c, and d are distinct.
- nums[a] + nums[b] + nums[c] + nums[d] == target

You may return the answer in any order.`,
        constraints: `1 <= nums.length <= 200
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9`
    },
    {
        id: 18,
        title: 'Remove Duplicates from Sorted Array',
        description: `Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in nums.

Consider the number of unique elements of nums to be k. To get accepted, you need to do the following things:
- Change the array nums such that the first k elements of nums contain the unique elements in the order they were present in nums initially.
- The remaining elements of nums are not important as well as the size of nums.
- Return k.`,
        constraints: `1 <= nums.length <= 3 * 10^4
-100 <= nums[i] <= 100
nums is sorted in non-decreasing order.`
    },
    {
        id: 19,
        title: 'Remove Element',
        description: `Given an integer array nums and an integer val, remove all occurrences of val in nums in-place. The order of the elements may be changed. Then return the number of elements in nums which are not equal to val.

Consider the number of elements in nums which are not equal to val be k. To get accepted, you need to:
- Change the array nums such that the first k elements of nums contain the elements which are not equal to val.
- The remaining elements of nums are not important as well as the size of nums.
- Return k.`,
        constraints: `0 <= nums.length <= 100
0 <= nums[i] <= 50
0 <= val <= 100`
    },
    {
        id: 20,
        title: 'Next Permutation',
        description: `A permutation of an array of integers is an arrangement of its members into a sequence or linear order.

The next permutation of an array of integers is the next lexicographically greater permutation of its integer. If such arrangement is not possible, the array must be rearranged as the lowest possible order (i.e., sorted in ascending order).

The replacement must be in place and use only constant extra memory.

For example:
- For arr = [1,2,3], the next permutation is [1,3,2].
- For arr = [3,2,1], the next permutation is [1,2,3].
- For arr = [1,1,5], the next permutation is [1,5,1].`,
        constraints: `1 <= nums.length <= 100
0 <= nums[i] <= 100`
    },
    {
        id: 21,
        title: 'Rotate Array',
        description: `Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.

You should modify the array in-place with O(1) extra space.`,
        constraints: `1 <= nums.length <= 10^5
-2^31 <= nums[i] <= 2^31 - 1
0 <= k <= 10^5`
    },
    {
        id: 22,
        title: 'Jump Game',
        description: `You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Return true if you can reach the last index, or false otherwise.`,
        constraints: `1 <= nums.length <= 10^4
0 <= nums[i] <= 10^5`
    },
    {
        id: 23,
        title: 'Jump Game II',
        description: `You are given a 0-indexed array of integers nums of length n. You are initially positioned at nums[0].

Each element nums[i] represents the maximum length of a forward jump from index i. In other words, if you are at nums[i], you can jump to any nums[i + j] where 0 <= j <= nums[i] and i + j < n.

Return the minimum number of jumps to reach nums[n - 1]. The test cases are generated such that you can reach nums[n - 1].`,
        constraints: `1 <= nums.length <= 10^4
0 <= nums[i] <= 1000
It's guaranteed that you can reach nums[n - 1].`
    },
    {
        id: 24,
        title: 'Merge Sorted Array',
        description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.

Merge nums1 and nums2 into a single array sorted in non-decreasing order.

The final sorted array should not be returned by the function, but instead be stored inside the array nums1. To accommodate this, nums1 has a length of m + n, where the first m elements denote the elements that should be merged, and the last n elements are set to 0 and should be ignored. nums2 has a length of n.`,
        constraints: `nums1.length == m + n
nums2.length == n
0 <= m, n <= 200
1 <= m + n <= 200
-10^9 <= nums1[i], nums2[j] <= 10^9`
    },
    {
        id: 25,
        title: "Pascal's Triangle",
        description: `Given an integer numRows, return the first numRows of Pascal's triangle.

In Pascal's triangle, each number is the sum of the two numbers directly above it.`,
        constraints: `1 <= numRows <= 30`
    },
    {
        id: 26,
        title: "Pascal's Triangle II",
        description: `Given an integer rowIndex, return the rowIndex-th (0-indexed) row of Pascal's triangle.

In Pascal's triangle, each number is the sum of the two numbers directly above it.

Could you optimize your algorithm to use only O(rowIndex) extra space?`,
        constraints: `0 <= rowIndex <= 33`
    },
    {
        id: 27,
        title: 'Majority Element',
        description: `Given an array nums of size n, return the majority element.

The majority element is the element that appears more than ⌊n / 2⌋ times. You may assume that the majority element always exists in the array.

Follow up: Could you solve the problem in linear time and in O(1) space?`,
        constraints: `n == nums.length
1 <= n <= 5 * 10^4
-10^9 <= nums[i] <= 10^9`
    },
    {
        id: 28,
        title: 'Majority Element II',
        description: `Given an integer array of size n, find all elements that appear more than ⌊n/3⌋ times.

Follow up: Could you solve the problem in linear time and in O(1) space?`,
        constraints: `1 <= nums.length <= 5 * 10^4
-10^9 <= nums[i] <= 10^9`
    },
    {
        id: 29,
        title: 'Rotate Image',
        description: `You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).

You have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.`,
        constraints: `n == matrix.length == matrix[i].length
1 <= n <= 20
-1000 <= matrix[i][j] <= 1000`
    },
    {
        id: 30,
        title: 'Spiral Matrix',
        description: `Given an m x n matrix, return all elements of the matrix in spiral order.

Starting from the top-left corner, traverse the matrix in a clockwise spiral pattern: right across the top row, down the right column, left across the bottom row, and up the left column, then repeating inward.`,
        constraints: `m == matrix.length
n == matrix[i].length
1 <= m, n <= 10
-100 <= matrix[i][j] <= 100`
    },
    {
        id: 31,
        title: 'Spiral Matrix II',
        description: `Given a positive integer n, generate an n x n matrix filled with elements from 1 to n^2 in spiral order.

Starting from the top-left corner, fill in elements clockwise in a spiral pattern.`,
        constraints: `1 <= n <= 20`
    },
    {
        id: 32,
        title: 'Set Matrix Zeroes',
        description: `Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0's.

You must do it in place.

Follow up:
- A straightforward solution using O(mn) space is probably a bad idea.
- A simple improvement uses O(m + n) space, but still not the best solution.
- Could you devise a constant space solution?`,
        constraints: `m == matrix.length
n == matrix[0].length
1 <= m, n <= 200
-2^31 <= matrix[i][j] <= 2^31 - 1`
    },
    {
        id: 33,
        title: 'Game of Life',
        description: `The Board of the Game of Life is made up of an m x n grid of cells, where each cell has an initial state: live (represented by a 1) or dead (represented by a 0). Each cell interacts with its eight neighbors using the following four rules:

1. Any live cell with fewer than two live neighbors dies as if caused by under-population.
2. Any live cell with two or three live neighbors lives on to the next generation.
3. Any live cell with more than three live neighbors dies, as if by over-population.
4. Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.

The next state is created by applying the above rules simultaneously to every cell in the current state, where births and deaths occur simultaneously. Given the current state of the m x n grid board, return the next state.`,
        constraints: `m == board.length
n == board[i].length
1 <= m, n <= 25
board[i][j] is 0 or 1.`
    },
    {
        id: 34,
        title: 'Find First and Last Position of Element',
        description: `Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value.

If target is not found in the array, return [-1, -1].

You must write an algorithm with O(log n) runtime complexity.`,
        constraints: `0 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9
nums is a non-decreasing array.
-10^9 <= target <= 10^9`
    },
    {
        id: 35,
        title: 'Search a 2D Matrix',
        description: `You are given an m x n integer matrix matrix with the following two properties:

- Each row is sorted in non-decreasing order.
- The first integer of each row is greater than the last integer of the previous row.

Given an integer target, return true if target is in matrix or false otherwise.

You must write a solution in O(log(m * n)) time complexity.`,
        constraints: `m == matrix.length
n == matrix[i].length
1 <= m, n <= 100
-10^4 <= matrix[i][j], target <= 10^4`
    },
    {
        id: 36,
        title: 'Search a 2D Matrix II',
        description: `Write an efficient algorithm that searches for a value target in an m x n integer matrix matrix. This matrix has the following properties:

- Integers in each row are sorted in ascending from left to right.
- Integers in each column are sorted in ascending from top to bottom.`,
        constraints: `m == matrix.length
n == matrix[i].length
1 <= n, m <= 300
-10^9 <= matrix[i][j] <= 10^9
All the integers in each row are sorted in ascending order.
All the integers in each column are sorted in ascending order.
-10^9 <= target <= 10^9`
    },
    {
        id: 37,
        title: 'Kth Largest Element in an Array',
        description: `Given an integer array nums and an integer k, return the kth largest element in the array.

Note that it is the kth largest element in the sorted order, not the kth distinct element.

Can you solve it without sorting?`,
        constraints: `1 <= k <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4`
    },
    {
        id: 38,
        title: 'Top K Frequent Elements',
        description: `Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

Follow up: Your algorithm's time complexity must be better than O(n log n), where n is the array's size.`,
        constraints: `1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4
k is in the range [1, the number of unique elements in the array].
It is guaranteed that the answer is unique.`
    },
    {
        id: 39,
        title: 'Sort Colors',
        description: `Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue.

We will use the integers 0, 1, and 2 to represent the color red, white, and blue, respectively.

You must solve this problem without using the library's sort function.

Follow up: Could you come up with a one-pass algorithm using only constant extra space?`,
        constraints: `n == nums.length
1 <= n <= 300
nums[i] is either 0, 1, or 2.`
    },
    {
        id: 40,
        title: 'Wiggle Sort',
        description: `Given an integer array nums, reorder it such that nums[0] <= nums[1] >= nums[2] <= nums[3]....

In other words, every odd-indexed element should be greater than or equal to its adjacent elements.`,
        constraints: `1 <= nums.length <= 5000
0 <= nums[i] <= 10^4`
    },
    {
        id: 41,
        title: 'Wiggle Sort II',
        description: `Given an integer array nums, reorder it such that nums[0] < nums[1] > nums[2] < nums[3]....

You may assume the input array always has a valid answer.

Follow up: Can you do it in O(n) time and/or in-place with O(1) extra space?`,
        constraints: `1 <= nums.length <= 5 * 10^4
0 <= nums[i] <= 5000
It is guaranteed that there will be an answer for the given input nums.`
    },
    {
        id: 42,
        title: 'First Missing Positive',
        description: `Given an unsorted integer array nums, return the smallest positive integer that is not present in nums.

You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.`,
        constraints: `1 <= nums.length <= 10^5
-2^31 <= nums[i] <= 2^31 - 1`
    },
    {
        id: 44,
        title: 'Find All Numbers Disappeared in Array',
        description: `Given an array nums of n integers where nums[i] is in the range [1, n], return an array of all the integers in the range [1, n] that do not appear in nums.

Follow up: Could you do it without extra space and in O(n) runtime? You may assume the returned list does not count as extra space.`,
        constraints: `n == nums.length
1 <= n <= 10^5
1 <= nums[i] <= n`
    },
    {
        id: 45,
        title: 'Find All Duplicates in Array',
        description: `Given an integer array nums of length n where all the integers of nums are in the range [1, n] and each integer appears once or twice, return an array of all the integers that appear twice.

You must write an algorithm that runs in O(n) time and uses only constant extra space.`,
        constraints: `n == nums.length
1 <= n <= 10^5
1 <= nums[i] <= n
Each element in nums appears once or twice.`
    },
    {
        id: 46,
        title: 'Longest Consecutive Sequence',
        description: `Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in O(n) time.

A consecutive sequence is a sequence of numbers where each number is exactly 1 more than the previous number (e.g., [1, 2, 3, 4]).`,
        constraints: `0 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9`
    },
    {
        id: 48,
        title: 'Plus One',
        description: `You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's.

Increment the large integer by one and return the resulting array of digits.`,
        constraints: `1 <= digits.length <= 100
0 <= digits[i] <= 9
digits does not contain any leading 0's.`
    },
    {
        id: 50,
        title: 'Insert Interval',
        description: `You are given an array of non-overlapping intervals intervals where intervals[i] = [starti, endi] represent the start and the end of the ith interval and intervals is sorted in ascending order by starti. You are also given an interval newInterval = [start, end] that represents the start and end of another interval.

Insert newInterval into intervals such that intervals is still sorted in ascending order by starti and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).

Return intervals after the insertion.

Note that you don't need to modify intervals in-place. You can make a new array and return it.`,
        constraints: `0 <= intervals.length <= 10^4
intervals[i].length == 2
0 <= starti <= endi <= 10^5
intervals is sorted by starti in ascending order.
newInterval.length == 2
0 <= start <= end <= 10^5`
    },
    {
        id: 51,
        title: 'Non-overlapping Intervals',
        description: `Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

Note that intervals which only touch at a point are non-overlapping. For example, [1, 2] and [2, 3] are non-overlapping.`,
        constraints: `1 <= intervals.length <= 10^5
intervals[i].length == 2
-5 * 10^4 <= starti < endi <= 5 * 10^4`
    }
];

async function seedBatch1() {
    console.log('Batch 1: Updating Array pattern problems...');
    let updated = 0, failed = 0;

    for (const item of updates) {
        const { error } = await supabaseAdmin
            .from('problems')
            .update({
                description: item.description,
                constraints: item.constraints
            })
            .eq('id', item.id);

        if (error) {
            console.error('FAIL [' + item.id + '] ' + item.title + ': ' + error.message);
            failed++;
        } else {
            console.log('OK [' + item.id + '] ' + item.title);
            updated++;
        }
    }

    console.log('\nBatch 1 complete: ' + updated + ' updated, ' + failed + ' failed\n');
}

seedBatch1().catch(console.error);
