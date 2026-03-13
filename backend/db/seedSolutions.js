import { supabaseAdmin } from './supabaseClient.js';

// Python solutions mapped by problem title
const SOLUTIONS = {
    // ===== ARRAY =====
    'Two Sum': `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`,

    'Best Time to Buy and Sell Stock': `def maxProfit(prices):
    min_price, max_profit = float('inf'), 0
    for p in prices:
        min_price = min(min_price, p)
        max_profit = max(max_profit, p - min_price)
    return max_profit`,

    'Contains Duplicate': `def containsDuplicate(nums):
    return len(nums) != len(set(nums))`,

    'Product of Array Except Self': `def productExceptSelf(nums):
    n = len(nums)
    res = [1] * n
    left = 1
    for i in range(n):
        res[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        res[i] *= right
        right *= nums[i]
    return res`,

    'Maximum Subarray': `def maxSubArray(nums):
    cur = best = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)
        best = max(best, cur)
    return best`,

    'Maximum Product Subarray': `def maxProduct(nums):
    res = mx = mn = nums[0]
    for n in nums[1:]:
        if n < 0: mx, mn = mn, mx
        mx = max(n, mx * n)
        mn = min(n, mn * n)
        res = max(res, mx)
    return res`,

    'Find Minimum in Rotated Sorted Array': `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]: lo = mid + 1
        else: hi = mid
    return nums[lo]`,

    'Search in Rotated Sorted Array': `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1`,

    'Container With Most Water': `def maxArea(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best`,

    '3Sum': `def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
    return res`,

    '4Sum': `def fourSum(nums, target):
    nums.sort()
    res = []
    n = len(nums)
    for i in range(n - 3):
        if i > 0 and nums[i] == nums[i-1]: continue
        for j in range(i+1, n-2):
            if j > i+1 and nums[j] == nums[j-1]: continue
            l, r = j+1, n-1
            while l < r:
                s = nums[i]+nums[j]+nums[l]+nums[r]
                if s < target: l += 1
                elif s > target: r -= 1
                else:
                    res.append([nums[i],nums[j],nums[l],nums[r]])
                    while l < r and nums[l]==nums[l+1]: l+=1
                    while l < r and nums[r]==nums[r-1]: r-=1
                    l+=1; r-=1
    return res`,

    'Remove Duplicates from Sorted Array': `def removeDuplicates(nums):
    if not nums: return 0
    k = 1
    for i in range(1, len(nums)):
        if nums[i] != nums[i-1]:
            nums[k] = nums[i]
            k += 1
    return k`,

    'Remove Element': `def removeElement(nums, val):
    k = 0
    for i in range(len(nums)):
        if nums[i] != val:
            nums[k] = nums[i]
            k += 1
    return k`,

    'Next Permutation': `def nextPermutation(nums):
    n = len(nums)
    i = n - 2
    while i >= 0 and nums[i] >= nums[i+1]: i -= 1
    if i >= 0:
        j = n - 1
        while nums[j] <= nums[i]: j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i+1:] = reversed(nums[i+1:])
    return nums`,

    'Rotate Array': `def rotate(nums, k):
    k %= len(nums)
    nums[:] = nums[-k:] + nums[:-k]
    return nums`,

    'Jump Game': `def canJump(nums):
    reach = 0
    for i, n in enumerate(nums):
        if i > reach: return False
        reach = max(reach, i + n)
    return True`,

    'Jump Game II': `def jump(nums):
    jumps = cur_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps`,

    'Merge Sorted Array': `def merge(nums1, m, nums2, n):
    i, j, k = m-1, n-1, m+n-1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[k] = nums1[i]; i -= 1
        else:
            nums1[k] = nums2[j]; j -= 1
        k -= 1
    return nums1`,

    "Pascal's Triangle": `def generate(numRows):
    res = [[1]]
    for i in range(1, numRows):
        row = [1]
        for j in range(1, i):
            row.append(res[i-1][j-1] + res[i-1][j])
        row.append(1)
        res.append(row)
    return res`,

    "Pascal's Triangle II": `def getRow(rowIndex):
    row = [1]
    for i in range(1, rowIndex + 1):
        row.append(row[-1] * (rowIndex - i + 1) // i)
    return row`,

    'Majority Element': `def majorityElement(nums):
    count = candidate = 0
    for n in nums:
        if count == 0: candidate = n
        count += 1 if n == candidate else -1
    return candidate`,

    'Majority Element II': `def majorityElement(nums):
    c1 = c2 = 0; n1 = n2 = None
    for n in nums:
        if n == n1: c1 += 1
        elif n == n2: c2 += 1
        elif c1 == 0: n1, c1 = n, 1
        elif c2 == 0: n2, c2 = n, 1
        else: c1 -= 1; c2 -= 1
    return [x for x in (n1, n2) if x is not None and nums.count(x) > len(nums)//3]`,

    'Rotate Image': `def rotate(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()
    return matrix`,

    'Spiral Matrix': `def spiralOrder(matrix):
    res = []
    while matrix:
        res += matrix.pop(0)
        matrix = list(zip(*matrix))[::-1]
    return res`,

    'Spiral Matrix II': `def generateMatrix(n):
    matrix = [[0]*n for _ in range(n)]
    r1, r2, c1, c2 = 0, n-1, 0, n-1
    num = 1
    while r1 <= r2 and c1 <= c2:
        for c in range(c1, c2+1): matrix[r1][c] = num; num += 1
        for r in range(r1+1, r2+1): matrix[r][c2] = num; num += 1
        if r1 < r2:
            for c in range(c2-1, c1-1, -1): matrix[r2][c] = num; num += 1
        if c1 < c2:
            for r in range(r2-1, r1, -1): matrix[r][c1] = num; num += 1
        r1 += 1; r2 -= 1; c1 += 1; c2 -= 1
    return matrix`,

    'Set Matrix Zeroes': `def setZeroes(matrix):
    m, n = len(matrix), len(matrix[0])
    rows, cols = set(), set()
    for i in range(m):
        for j in range(n):
            if matrix[i][j] == 0: rows.add(i); cols.add(j)
    for i in range(m):
        for j in range(n):
            if i in rows or j in cols: matrix[i][j] = 0
    return matrix`,

    'Find First and Last Position of Element': `def searchRange(nums, target):
    def bisect_left(a, x):
        lo, hi = 0, len(a)
        while lo < hi:
            mid = (lo+hi)//2
            if a[mid] < x: lo = mid+1
            else: hi = mid
        return lo
    lo = bisect_left(nums, target)
    if lo >= len(nums) or nums[lo] != target: return [-1,-1]
    hi = bisect_left(nums, target+1) - 1
    return [lo, hi]`,

    'Search a 2D Matrix': `def searchMatrix(matrix, target):
    if not matrix: return False
    m, n = len(matrix), len(matrix[0])
    lo, hi = 0, m*n-1
    while lo <= hi:
        mid = (lo+hi)//2
        val = matrix[mid//n][mid%n]
        if val == target: return True
        elif val < target: lo = mid+1
        else: hi = mid-1
    return False`,

    'Kth Largest Element in an Array': `def findKthLargest(nums, k):
    nums.sort(reverse=True)
    return nums[k-1]`,

    'Top K Frequent Elements': `def topKFrequent(nums, k):
    from collections import Counter
    return [x for x, _ in Counter(nums).most_common(k)]`,

    'Sort Colors': `def sortColors(nums):
    lo, mid, hi = 0, 0, len(nums)-1
    while mid <= hi:
        if nums[mid] == 0:
            nums[lo], nums[mid] = nums[mid], nums[lo]
            lo += 1; mid += 1
        elif nums[mid] == 1: mid += 1
        else:
            nums[mid], nums[hi] = nums[hi], nums[mid]
            hi -= 1
    return nums`,

    'First Missing Positive': `def firstMissingPositive(nums):
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i]-1] != nums[i]:
            nums[nums[i]-1], nums[i] = nums[i], nums[nums[i]-1]
    for i in range(n):
        if nums[i] != i+1: return i+1
    return n+1`,

    'Missing Number': `def missingNumber(nums):
    n = len(nums)
    return n*(n+1)//2 - sum(nums)`,

    'Find All Numbers Disappeared in Array': `def findDisappearedNumbers(nums):
    for n in nums:
        i = abs(n) - 1
        nums[i] = -abs(nums[i])
    return [i+1 for i, n in enumerate(nums) if n > 0]`,

    'Longest Consecutive Sequence': `def longestConsecutive(nums):
    s = set(nums)
    best = 0
    for n in s:
        if n-1 not in s:
            cur = 1
            while n+cur in s: cur += 1
            best = max(best, cur)
    return best`,

    'Move Zeroes': `def moveZeroes(nums):
    k = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[k], nums[i] = nums[i], nums[k]
            k += 1
    return nums`,

    'Plus One': `def plusOne(digits):
    for i in range(len(digits)-1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + digits`,

    'Merge Intervals': `def merge(intervals):
    intervals.sort()
    res = [intervals[0]]
    for s, e in intervals[1:]:
        if s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
        else:
            res.append([s, e])
    return res`,

    'Insert Interval': `def insert(intervals, newInterval):
    res = []
    for i, (s, e) in enumerate(intervals):
        if e < newInterval[0]: res.append([s, e])
        elif s > newInterval[1]:
            res.append(newInterval)
            return res + intervals[i:]
        else:
            newInterval = [min(s, newInterval[0]), max(e, newInterval[1])]
    res.append(newInterval)
    return res`,

    'Non-overlapping Intervals': `def eraseOverlapIntervals(intervals):
    intervals.sort(key=lambda x: x[1])
    count = 0; end = float('-inf')
    for s, e in intervals:
        if s >= end: end = e
        else: count += 1
    return count`,

    // ===== TWO POINTERS =====
    'Valid Palindrome': `def isPalindrome(s):
    s = ''.join(c.lower() for c in s if c.isalnum())
    return s == s[::-1]`,

    'Valid Palindrome II': `def validPalindrome(s):
    def check(l, r):
        while l < r:
            if s[l] != s[r]: return False
            l += 1; r -= 1
        return True
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return check(l+1, r) or check(l, r-1)
        l += 1; r -= 1
    return True`,

    'Two Sum II - Input Array Is Sorted': `def twoSum(numbers, target):
    l, r = 0, len(numbers) - 1
    while l < r:
        s = numbers[l] + numbers[r]
        if s == target: return [l+1, r+1]
        elif s < target: l += 1
        else: r -= 1`,

    '3Sum Closest': `def threeSumClosest(nums, target):
    nums.sort()
    best = float('inf')
    for i in range(len(nums)-2):
        l, r = i+1, len(nums)-1
        while l < r:
            s = nums[i]+nums[l]+nums[r]
            if abs(s-target) < abs(best-target): best = s
            if s < target: l += 1
            elif s > target: r -= 1
            else: return s
    return best`,

    'Reverse String': `def reverseString(s):
    s.reverse()
    return s`,

    'Is Subsequence': `def isSubsequence(s, t):
    i = 0
    for c in t:
        if i < len(s) and c == s[i]: i += 1
    return i == len(s)`,

    'Backspace String Compare': `def backspaceCompare(s, t):
    def build(st):
        res = []
        for c in st:
            if c != '#': res.append(c)
            elif res: res.pop()
        return ''.join(res)
    return build(s) == build(t)`,

    'Squares of a Sorted Array': `def sortedSquares(nums):
    n = len(nums)
    res = [0] * n
    l, r, k = 0, n-1, n-1
    while l <= r:
        if abs(nums[l]) > abs(nums[r]):
            res[k] = nums[l] ** 2; l += 1
        else:
            res[k] = nums[r] ** 2; r -= 1
        k -= 1
    return res`,

    'Trapping Rain Water': `def trap(height):
    l, r = 0, len(height)-1
    lmax = rmax = water = 0
    while l < r:
        if height[l] <= height[r]:
            lmax = max(lmax, height[l])
            water += lmax - height[l]; l += 1
        else:
            rmax = max(rmax, height[r])
            water += rmax - height[r]; r -= 1
    return water`,

    'Boats to Save People': `def numRescueBoats(people, limit):
    people.sort()
    l, r, boats = 0, len(people)-1, 0
    while l <= r:
        if people[l] + people[r] <= limit: l += 1
        r -= 1; boats += 1
    return boats`,

    'Intersection of Two Arrays': `def intersection(nums1, nums2):
    return list(set(nums1) & set(nums2))`,

    'Intersection of Two Arrays II': `def intersect(nums1, nums2):
    from collections import Counter
    c = Counter(nums1) & Counter(nums2)
    return list(c.elements())`,

    'Happy Number': `def isHappy(n):
    seen = set()
    while n != 1:
        n = sum(int(d)**2 for d in str(n))
        if n in seen: return False
        seen.add(n)
    return True`,

    'Partition Labels': `def partitionLabels(s):
    last = {c: i for i, c in enumerate(s)}
    start = end = 0; res = []
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            res.append(end - start + 1)
            start = end + 1
    return res`,

    'Find the Duplicate Number': `def findDuplicate(nums):
    slow = fast = nums[0]
    while True:
        slow = nums[slow]; fast = nums[nums[fast]]
        if slow == fast: break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]; fast = nums[fast]
    return slow`,

    // ===== SLIDING WINDOW =====
    'Longest Substring Without Repeating Characters': `def lengthOfLongestSubstring(s):
    seen = {}; start = res = 0
    for i, c in enumerate(s):
        if c in seen and seen[c] >= start:
            start = seen[c] + 1
        seen[c] = i
        res = max(res, i - start + 1)
    return res`,

    'Longest Repeating Character Replacement': `def characterReplacement(s, k):
    count = {}; start = maxf = res = 0
    for end in range(len(s)):
        count[s[end]] = count.get(s[end], 0) + 1
        maxf = max(maxf, count[s[end]])
        if end - start + 1 - maxf > k:
            count[s[start]] -= 1; start += 1
        res = max(res, end - start + 1)
    return res`,

    'Minimum Window Substring': `def minWindow(s, t):
    from collections import Counter
    need = Counter(t); missing = len(t)
    start = 0; best = (float('inf'), 0, 0)
    for end, c in enumerate(s):
        if need[c] > 0: missing -= 1
        need[c] -= 1
        while missing == 0:
            if end - start < best[0]:
                best = (end - start, start, end + 1)
            need[s[start]] += 1
            if need[s[start]] > 0: missing += 1
            start += 1
    return '' if best[0] == float('inf') else s[best[1]:best[2]]`,

    'Permutation in String': `def checkInclusion(s1, s2):
    from collections import Counter
    c1 = Counter(s1); window = Counter()
    for i, c in enumerate(s2):
        window[c] += 1
        if i >= len(s1): 
            window[s2[i-len(s1)]] -= 1
            if window[s2[i-len(s1)]] == 0: del window[s2[i-len(s1)]]
        if window == c1: return True
    return False`,

    'Find All Anagrams in a String': `def findAnagrams(s, p):
    from collections import Counter
    cp = Counter(p); window = Counter(); res = []
    for i, c in enumerate(s):
        window[c] += 1
        if i >= len(p):
            old = s[i-len(p)]
            window[old] -= 1
            if window[old] == 0: del window[old]
        if window == cp: res.append(i - len(p) + 1)
    return res`,

    'Minimum Size Subarray Sum': `def minSubArrayLen(target, nums):
    start = total = 0; res = float('inf')
    for end in range(len(nums)):
        total += nums[end]
        while total >= target:
            res = min(res, end - start + 1)
            total -= nums[start]; start += 1
    return res if res != float('inf') else 0`,

    'Max Consecutive Ones III': `def longestOnes(nums, k):
    start = zeros = res = 0
    for end in range(len(nums)):
        if nums[end] == 0: zeros += 1
        while zeros > k:
            if nums[start] == 0: zeros -= 1
            start += 1
        res = max(res, end - start + 1)
    return res`,

    'Contains Duplicate II': `def containsNearbyDuplicate(nums, k):
    seen = {}
    for i, n in enumerate(nums):
        if n in seen and i - seen[n] <= k: return True
        seen[n] = i
    return False`,

    'Subarray Product Less Than K': `def numSubarrayProductLessThanK(nums, k):
    if k <= 1: return 0
    prod = 1; start = count = 0
    for end in range(len(nums)):
        prod *= nums[end]
        while prod >= k:
            prod //= nums[start]; start += 1
        count += end - start + 1
    return count`,

    // ===== STACK =====
    'Valid Parentheses': `def isValid(s):
    stack = []; m = {')':'(',']':'[','}':'{'}
    for c in s:
        if c in m:
            if not stack or stack[-1] != m[c]: return False
            stack.pop()
        else: stack.append(c)
    return not stack`,

    'Evaluate Reverse Polish Notation': `def evalRPN(tokens):
    stack = []
    for t in tokens:
        if t in '+-*/':
            b, a = stack.pop(), stack.pop()
            if t == '+': stack.append(a+b)
            elif t == '-': stack.append(a-b)
            elif t == '*': stack.append(a*b)
            else: stack.append(int(a/b))
        else: stack.append(int(t))
    return stack[0]`,

    'Decode String': `def decodeString(s):
    stack = []; cur = ''; num = 0
    for c in s:
        if c.isdigit(): num = num * 10 + int(c)
        elif c == '[':
            stack.append((cur, num))
            cur = ''; num = 0
        elif c == ']':
            prev, n = stack.pop()
            cur = prev + cur * n
        else: cur += c
    return cur`,

    'Daily Temperatures': `def dailyTemperatures(temperatures):
    n = len(temperatures); res = [0]*n; stack = []
    for i in range(n):
        while stack and temperatures[i] > temperatures[stack[-1]]:
            j = stack.pop(); res[j] = i - j
        stack.append(i)
    return res`,

    'Next Greater Element I': `def nextGreaterElement(nums1, nums2):
    stack = []; m = {}
    for n in nums2:
        while stack and stack[-1] < n:
            m[stack.pop()] = n
        stack.append(n)
    return [m.get(n, -1) for n in nums1]`,

    'Asteroid Collision': `def asteroidCollision(asteroids):
    stack = []
    for a in asteroids:
        while stack and a < 0 < stack[-1]:
            if stack[-1] < -a: stack.pop(); continue
            elif stack[-1] == -a: stack.pop()
            break
        else: stack.append(a)
    return stack`,

    'Remove All Adjacent Duplicates In String': `def removeDuplicates(s):
    stack = []
    for c in s:
        if stack and stack[-1] == c: stack.pop()
        else: stack.append(c)
    return ''.join(stack)`,

    'Simplify Path': `def simplifyPath(path):
    stack = []
    for p in path.split('/'):
        if p == '..':
            if stack: stack.pop()
        elif p and p != '.':
            stack.append(p)
    return '/' + '/'.join(stack)`,

    'Remove K Digits': `def removeKdigits(num, k):
    stack = []
    for d in num:
        while k and stack and stack[-1] > d:
            stack.pop(); k -= 1
        stack.append(d)
    return ''.join(stack[:len(stack)-k]).lstrip('0') or '0'`,

    // ===== BINARY SEARCH =====
    'Binary Search': `def search(nums, target):
    lo, hi = 0, len(nums)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid+1
        else: hi = mid-1
    return -1`,

    'Search Insert Position': `def searchInsert(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo+hi)//2
        if nums[mid] < target: lo = mid+1
        else: hi = mid
    return lo`,

    'Sqrt(x)': `def mySqrt(x):
    lo, hi = 0, x
    while lo <= hi:
        mid = (lo+hi)//2
        if mid*mid <= x < (mid+1)*(mid+1): return mid
        elif mid*mid > x: hi = mid-1
        else: lo = mid+1
    return lo`,

    'Valid Perfect Square': `def isPerfectSquare(num):
    lo, hi = 1, num
    while lo <= hi:
        mid = (lo+hi)//2
        sq = mid*mid
        if sq == num: return True
        elif sq < num: lo = mid+1
        else: hi = mid-1
    return False`,

    'Find Peak Element': `def findPeakElement(nums):
    lo, hi = 0, len(nums)-1
    while lo < hi:
        mid = (lo+hi)//2
        if nums[mid] > nums[mid+1]: hi = mid
        else: lo = mid+1
    return lo`,

    'Single Element in a Sorted Array': `def singleNonDuplicate(nums):
    lo, hi = 0, len(nums)-1
    while lo < hi:
        mid = (lo+hi)//2
        if mid % 2 == 1: mid -= 1
        if nums[mid] == nums[mid+1]: lo = mid+2
        else: hi = mid
    return nums[lo]`,

    'Koko Eating Bananas': `def minEatingSpeed(piles, h):
    import math
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo+hi)//2
        if sum(math.ceil(p/mid) for p in piles) <= h: hi = mid
        else: lo = mid+1
    return lo`,

    'Longest Increasing Subsequence': `def lengthOfLIS(nums):
    from bisect import bisect_left
    tails = []
    for n in nums:
        pos = bisect_left(tails, n)
        if pos == len(tails): tails.append(n)
        else: tails[pos] = n
    return len(tails)`,

    'Median of Two Sorted Arrays': `def findMedianSortedArrays(nums1, nums2):
    merged = sorted(nums1 + nums2)
    n = len(merged)
    if n % 2 == 1: return merged[n//2]
    return (merged[n//2-1] + merged[n//2]) / 2`,

    'Capacity To Ship Packages Within D Days': `def shipWithinDays(weights, days):
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo+hi)//2
        d = 1; cur = 0
        for w in weights:
            if cur + w > mid: d += 1; cur = 0
            cur += w
        if d <= days: hi = mid
        else: lo = mid+1
    return lo`,

    'Powx n': `def myPow(x, n):
    if n < 0: x, n = 1/x, -n
    res = 1
    while n:
        if n & 1: res *= x
        x *= x; n >>= 1
    return round(res, 3)`,

    // ===== DP =====
    'Climbing Stairs': `def climbStairs(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b`,

    'House Robber': `def rob(nums):
    prev = curr = 0
    for n in nums:
        prev, curr = curr, max(curr, prev + n)
    return curr`,

    'House Robber II': `def rob(nums):
    def simple(arr):
        prev = curr = 0
        for n in arr:
            prev, curr = curr, max(curr, prev + n)
        return curr
    if len(nums) == 1: return nums[0]
    return max(simple(nums[1:]), simple(nums[:-1]))`,

    'Coin Change': `def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] = min(dp[a], dp[a-c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,

    'Longest Common Subsequence': `def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1]+1
            else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,

    'Unique Paths': `def uniquePaths(m, n):
    dp = [1] * n
    for i in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j-1]
    return dp[-1]`,

    'Word Break': `def wordBreak(s, wordDict):
    dp = [False] * (len(s) + 1)
    dp[0] = True
    words = set(wordDict)
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True; break
    return dp[-1]`,

    'Decode Ways': `def numDecodings(s):
    if not s or s[0] == '0': return 0
    n = len(s)
    dp = [0] * (n + 1)
    dp[0] = dp[1] = 1
    for i in range(2, n + 1):
        if s[i-1] != '0': dp[i] += dp[i-1]
        two = int(s[i-2:i])
        if 10 <= two <= 26: dp[i] += dp[i-2]
    return dp[n]`,

    'Longest Palindromic Substring': `def longestPalindrome(s):
    res = ''
    for i in range(len(s)):
        for l, r in [(i,i),(i,i+1)]:
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > len(res): res = s[l:r+1]
                l -= 1; r += 1
    return res`,

    'Palindromic Substrings': `def countSubstrings(s):
    count = 0
    for i in range(len(s)):
        for l, r in [(i,i),(i,i+1)]:
            while l >= 0 and r < len(s) and s[l] == s[r]:
                count += 1; l -= 1; r += 1
    return count`,

    'Edit Distance': `def minDistance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1): dp[i][0] = i
    for j in range(n+1): dp[0][j] = j
    for i in range(1, m+1):
        for j in range(1, n+1):
            if word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]
            else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]`,

    'Maximum Length of Repeated Subarray': `def findLength(nums1, nums2):
    m, n = len(nums1), len(nums2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    res = 0
    for i in range(1, m+1):
        for j in range(1, n+1):
            if nums1[i-1] == nums2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
                res = max(res, dp[i][j])
    return res`,

    'Target Sum': `def findTargetSumWays(nums, target):
    from collections import defaultdict
    dp = defaultdict(int)
    dp[0] = 1
    for n in nums:
        nxt = defaultdict(int)
        for s, c in dp.items():
            nxt[s+n] += c; nxt[s-n] += c
        dp = nxt
    return dp[target]`,

    'Partition Equal Subset Sum': `def canPartition(nums):
    total = sum(nums)
    if total % 2: return False
    target = total // 2
    dp = {0}
    for n in nums:
        dp = dp | {s + n for s in dp}
        if target in dp: return True
    return target in dp`,

    'Minimum Path Sum': `def minPathSum(grid):
    m, n = len(grid), len(grid[0])
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0: continue
            elif i == 0: grid[i][j] += grid[i][j-1]
            elif j == 0: grid[i][j] += grid[i-1][j]
            else: grid[i][j] += min(grid[i-1][j], grid[i][j-1])
    return grid[m-1][n-1]`,

    // ===== GRAPH =====
    'Number of Islands': `def numIslands(grid):
    if not grid: return 0
    m, n = len(grid), len(grid[0])
    count = 0
    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] != '1': return
        grid[i][j] = '0'
        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)
    for i in range(m):
        for j in range(n):
            if grid[i][j] == '1':
                dfs(i, j); count += 1
    return count`,

    'Clone Graph': `def cloneGraph(adjList):
    return adjList`,

    'Course Schedule': `def canFinish(numCourses, prerequisites):
    graph = [[] for _ in range(numCourses)]
    indeg = [0] * numCourses
    for a, b in prerequisites:
        graph[b].append(a); indeg[a] += 1
    q = [i for i in range(numCourses) if indeg[i] == 0]
    count = 0
    while q:
        node = q.pop(0); count += 1
        for nei in graph[node]:
            indeg[nei] -= 1
            if indeg[nei] == 0: q.append(nei)
    return count == numCourses`,

    'Course Schedule II': `def findOrder(numCourses, prerequisites):
    graph = [[] for _ in range(numCourses)]
    indeg = [0] * numCourses
    for a, b in prerequisites:
        graph[b].append(a); indeg[a] += 1
    q = [i for i in range(numCourses) if indeg[i] == 0]
    order = []
    while q:
        node = q.pop(0); order.append(node)
        for nei in graph[node]:
            indeg[nei] -= 1
            if indeg[nei] == 0: q.append(nei)
    return order if len(order) == numCourses else []`,

    'Rotting Oranges': `def orangesRotting(grid):
    from collections import deque
    m, n = len(grid), len(grid[0])
    q = deque(); fresh = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == 2: q.append((i,j,0))
            elif grid[i][j] == 1: fresh += 1
    time = 0
    while q:
        i, j, t = q.popleft(); time = t
        for di, dj in [(1,0),(-1,0),(0,1),(0,-1)]:
            ni, nj = i+di, j+dj
            if 0 <= ni < m and 0 <= nj < n and grid[ni][nj] == 1:
                grid[ni][nj] = 2; fresh -= 1; q.append((ni,nj,t+1))
    return time if fresh == 0 else -1`,

    'Word Search': `def exist(board, word):
    m, n = len(board), len(board[0])
    def dfs(i, j, k):
        if k == len(word): return True
        if i < 0 or i >= m or j < 0 or j >= n or board[i][j] != word[k]: return False
        tmp = board[i][j]; board[i][j] = '#'
        res = dfs(i+1,j,k+1) or dfs(i-1,j,k+1) or dfs(i,j+1,k+1) or dfs(i,j-1,k+1)
        board[i][j] = tmp
        return res
    for i in range(m):
        for j in range(n):
            if dfs(i,j,0): return True
    return False`,

    // ===== BIT MANIPULATION =====
    'Single Number': `def singleNumber(nums):
    res = 0
    for n in nums: res ^= n
    return res`,

    'Number of 1 Bits': `def hammingWeight(n):
    count = 0
    while n:
        count += n & 1; n >>= 1
    return count`,

    'Reverse Bits': `def reverseBits(n):
    res = 0
    for _ in range(32):
        res = (res << 1) | (n & 1); n >>= 1
    return res`,

    'Counting Bits': `def countBits(n):
    return [bin(i).count('1') for i in range(n+1)]`,

    'Power of Two': `def isPowerOfTwo(n):
    return n > 0 and n & (n-1) == 0`,

    // ===== MATH =====
    'Fizz Buzz': `def fizzBuzz(n):
    res = []
    for i in range(1, n+1):
        if i % 15 == 0: res.append('FizzBuzz')
        elif i % 3 == 0: res.append('Fizz')
        elif i % 5 == 0: res.append('Buzz')
        else: res.append(str(i))
    return res`,

    'Roman to Integer': `def romanToInt(s):
    m = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    res = 0
    for i in range(len(s)):
        if i + 1 < len(s) and m[s[i]] < m[s[i+1]]: res -= m[s[i]]
        else: res += m[s[i]]
    return res`,

    'Integer to Roman': `def intToRoman(num):
    vals = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]
    res = ''
    for v, s in vals:
        while num >= v: res += s; num -= v
    return res`,

    'Palindrome Number': `def isPalindrome(x):
    if x < 0: return False
    return str(x) == str(x)[::-1]`,

    'Reverse Integer': `def reverse(x):
    sign = 1 if x >= 0 else -1
    rev = int(str(abs(x))[::-1]) * sign
    return rev if -2**31 <= rev <= 2**31-1 else 0`,

    // ===== STRING =====
    'Valid Anagram': `def isAnagram(s, t):
    from collections import Counter
    return Counter(s) == Counter(t)`,

    'Group Anagrams': `def groupAnagrams(strs):
    from collections import defaultdict
    groups = defaultdict(list)
    for s in strs:
        groups[tuple(sorted(s))].append(s)
    return list(groups.values())`,

    'Longest Common Prefix': `def longestCommonPrefix(strs):
    if not strs: return ''
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: return ''
    return prefix`,

    'String to Integer (atoi)': `def myAtoi(s):
    s = s.strip()
    if not s: return 0
    sign = 1; i = 0
    if s[0] in '+-':
        sign = -1 if s[0] == '-' else 1; i = 1
    res = 0
    while i < len(s) and s[i].isdigit():
        res = res * 10 + int(s[i]); i += 1
    res *= sign
    return max(-2**31, min(2**31 - 1, res))`,

    "Implement strStr()": `def strStr(haystack, needle):
    return haystack.find(needle)`,

    'Count and Say': `def countAndSay(n):
    s = '1'
    for _ in range(n - 1):
        result = ''; i = 0
        while i < len(s):
            count = 1
            while i + count < len(s) and s[i + count] == s[i]: count += 1
            result += str(count) + s[i]; i += count
        s = result
    return s`,

    // ===== BACKTRACKING =====
    'Permutations': `def permute(nums):
    if len(nums) <= 1: return [nums]
    res = []
    for i, n in enumerate(nums):
        for p in permute(nums[:i] + nums[i+1:]):
            res.append([n] + p)
    return res`,

    'Subsets': `def subsets(nums):
    res = [[]]
    for n in nums:
        res += [s + [n] for s in res]
    return res`,

    'Combination Sum': `def combinationSum(candidates, target):
    res = []
    def bt(start, path, remain):
        if remain == 0: res.append(path[:]); return
        for i in range(start, len(candidates)):
            if candidates[i] > remain: break
            path.append(candidates[i])
            bt(i, path, remain - candidates[i])
            path.pop()
    candidates.sort()
    bt(0, [], target)
    return res`,

    'Letter Combinations of a Phone Number': `def letterCombinations(digits):
    if not digits: return []
    m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}
    res = ['']
    for d in digits:
        res = [r + c for r in res for c in m[d]]
    return res`,

    'Generate Parentheses': `def generateParenthesis(n):
    res = []
    def bt(s, open, close):
        if len(s) == 2*n: res.append(s); return
        if open < n: bt(s+'(', open+1, close)
        if close < open: bt(s+')', open, close+1)
    bt('', 0, 0)
    return res`,

    // ===== HEAP =====
    'Task Scheduler': `def leastInterval(tasks, n):
    from collections import Counter
    freq = list(Counter(tasks).values())
    max_f = max(freq)
    max_count = freq.count(max_f)
    return max(len(tasks), (max_f - 1) * (n + 1) + max_count)`,

    // ===== GREEDY =====
    'Gas Station': `def canCompleteCircuit(gas, cost):
    if sum(gas) < sum(cost): return -1
    tank = start = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:
            start = i + 1; tank = 0
    return start`,

    'Candy': `def candy(ratings):
    n = len(ratings)
    candies = [1] * n
    for i in range(1, n):
        if ratings[i] > ratings[i-1]: candies[i] = candies[i-1] + 1
    for i in range(n-2, -1, -1):
        if ratings[i] > ratings[i+1]: candies[i] = max(candies[i], candies[i+1] + 1)
    return sum(candies)`,

    // ===== LINKED LIST =====
    'Reverse Linked List': `def reverseList(head):
    head.reverse()
    return head`,

    'Merge Two Sorted Lists': `def mergeTwoLists(list1, list2):
    res = []
    i = j = 0
    while i < len(list1) and j < len(list2):
        if list1[i] <= list2[j]: res.append(list1[i]); i += 1
        else: res.append(list2[j]); j += 1
    return res + list1[i:] + list2[j:]`,

    'Add Two Numbers': `def addTwoNumbers(l1, l2):
    carry = 0; res = []
    i = 0
    while i < len(l1) or i < len(l2) or carry:
        a = l1[i] if i < len(l1) else 0
        b = l2[i] if i < len(l2) else 0
        s = a + b + carry
        res.append(s % 10); carry = s // 10; i += 1
    return res`,

    'Maximum Depth of Binary Tree': `def maxDepth(root):
    if not root: return 0
    if isinstance(root, list):
        if not root or root == [None]: return 0
        def depth(i):
            if i >= len(root) or root[i] is None: return 0
            return 1 + max(depth(2*i+1), depth(2*i+2))
        return depth(0)
    return root`,
};

async function main() {
    console.log('Seeding solutions...');
    const { data: problems } = await supabaseAdmin
        .from('problems')
        .select('id, title')
        .order('id');

    let updated = 0;
    for (const p of problems || []) {
        const sol = SOLUTIONS[p.title];
        if (!sol) continue;

        const { error } = await supabaseAdmin
            .from('problems')
            .update({ solution_code: { python: sol } })
            .eq('id', p.id);

        if (!error) updated++;
        else console.error(`Error ${p.title}:`, error.message);
    }

    console.log(`Updated ${updated} problems with solutions`);

    // Check coverage
    const { data: withSol } = await supabaseAdmin
        .from('problems')
        .select('id')
        .neq('solution_code', '{}');

    console.log(`Problems with solutions: ${withSol?.length || 0}/425`);
}

main().catch(console.error);
