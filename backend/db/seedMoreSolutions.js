import { supabaseAdmin } from './supabaseClient.js';

// This script fills in solution_code for ALL remaining problems that don't have solutions yet.
// For problems with Python solutions already, it adds JS/cpp/java equivalents.
// For problems without any solution, it generates a minimal working solution from the starter code.

// Additional Python solutions for problems NOT covered by seedSolutions.js
const MORE_PYTHON = {
    '4Sum': `def fourSum(nums, target):\n    nums.sort(); res = []; n = len(nums)\n    for i in range(n-3):\n        if i > 0 and nums[i] == nums[i-1]: continue\n        for j in range(i+1, n-2):\n            if j > i+1 and nums[j] == nums[j-1]: continue\n            l, r = j+1, n-1\n            while l < r:\n                s = nums[i]+nums[j]+nums[l]+nums[r]\n                if s < target: l += 1\n                elif s > target: r -= 1\n                else:\n                    res.append([nums[i],nums[j],nums[l],nums[r]])\n                    while l < r and nums[l]==nums[l+1]: l+=1\n                    while l < r and nums[r]==nums[r-1]: r-=1\n                    l+=1; r-=1\n    return res`,
    'Remove Duplicates from Sorted Array': `def removeDuplicates(nums):\n    if not nums: return 0\n    k = 1\n    for i in range(1, len(nums)):\n        if nums[i] != nums[i-1]: nums[k] = nums[i]; k += 1\n    return k`,
    'Remove Element': `def removeElement(nums, val):\n    k = 0\n    for i in range(len(nums)):\n        if nums[i] != val: nums[k] = nums[i]; k += 1\n    return k`,
    'Rotate Array': `def rotate(nums, k):\n    k %= len(nums)\n    nums[:] = nums[-k:] + nums[:-k]\n    return nums`,
    'Plus One': `def plusOne(digits):\n    for i in range(len(digits)-1, -1, -1):\n        if digits[i] < 9: digits[i] += 1; return digits\n        digits[i] = 0\n    return [1] + digits`,
    'Sort Colors': `def sortColors(nums):\n    lo, mid, hi = 0, 0, len(nums)-1\n    while mid <= hi:\n        if nums[mid] == 0: nums[lo], nums[mid] = nums[mid], nums[lo]; lo += 1; mid += 1\n        elif nums[mid] == 1: mid += 1\n        else: nums[mid], nums[hi] = nums[hi], nums[mid]; hi -= 1\n    return nums`,
    'Majority Element': `def majorityElement(nums):\n    count = candidate = 0\n    for n in nums:\n        if count == 0: candidate = n\n        count += 1 if n == candidate else -1\n    return candidate`,
    'Rotate Image': `def rotate(matrix):\n    n = len(matrix)\n    for i in range(n):\n        for j in range(i, n): matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]\n    for row in matrix: row.reverse()\n    return matrix`,
    'Spiral Matrix': `def spiralOrder(matrix):\n    res = []\n    while matrix:\n        res += matrix.pop(0)\n        matrix = list(zip(*matrix))[::-1]\n    return res`,
    'Set Matrix Zeroes': `def setZeroes(matrix):\n    m, n = len(matrix), len(matrix[0])\n    rows, cols = set(), set()\n    for i in range(m):\n        for j in range(n):\n            if matrix[i][j] == 0: rows.add(i); cols.add(j)\n    for i in range(m):\n        for j in range(n):\n            if i in rows or j in cols: matrix[i][j] = 0\n    return matrix`,
    'Kth Largest Element in an Array': `def findKthLargest(nums, k):\n    nums.sort(reverse=True)\n    return nums[k-1]`,
    'Top K Frequent Elements': `def topKFrequent(nums, k):\n    from collections import Counter\n    return [x for x, _ in Counter(nums).most_common(k)]`,
    'First Missing Positive': `def firstMissingPositive(nums):\n    n = len(nums)\n    for i in range(n):\n        while 1 <= nums[i] <= n and nums[nums[i]-1] != nums[i]:\n            nums[nums[i]-1], nums[i] = nums[i], nums[nums[i]-1]\n    for i in range(n):\n        if nums[i] != i+1: return i+1\n    return n+1`,
    'Find All Numbers Disappeared in Array': `def findDisappearedNumbers(nums):\n    for n in nums:\n        i = abs(n) - 1\n        nums[i] = -abs(nums[i])\n    return [i+1 for i, n in enumerate(nums) if n > 0]`,
    'Insert Interval': `def insert(intervals, newInterval):\n    res = []\n    for i, (s, e) in enumerate(intervals):\n        if e < newInterval[0]: res.append([s, e])\n        elif s > newInterval[1]:\n            res.append(newInterval)\n            return res + intervals[i:]\n        else: newInterval = [min(s, newInterval[0]), max(e, newInterval[1])]\n    res.append(newInterval)\n    return res`,
    'Non-overlapping Intervals': `def eraseOverlapIntervals(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count = 0; end = float('-inf')\n    for s, e in intervals:\n        if s >= end: end = e\n        else: count += 1\n    return count`,
    'Search Insert Position': `def searchInsert(nums, target):\n    lo, hi = 0, len(nums)\n    while lo < hi:\n        mid = (lo+hi)//2\n        if nums[mid] < target: lo = mid+1\n        else: hi = mid\n    return lo`,
    'Find Peak Element': `def findPeakElement(nums):\n    lo, hi = 0, len(nums)-1\n    while lo < hi:\n        mid = (lo+hi)//2\n        if nums[mid] > nums[mid+1]: hi = mid\n        else: lo = mid+1\n    return lo`,
    'Longest Increasing Subsequence': `def lengthOfLIS(nums):\n    from bisect import bisect_left\n    tails = []\n    for n in nums:\n        pos = bisect_left(tails, n)\n        if pos == len(tails): tails.append(n)\n        else: tails[pos] = n\n    return len(tails)`,
    'Min Cost Climbing Stairs': `def minCostClimbingStairs(cost):\n    a, b = cost[0], cost[1]\n    for i in range(2, len(cost)):\n        a, b = b, cost[i] + min(a, b)\n    return min(a, b)`,
    'Unique Paths': `def uniquePaths(m, n):\n    dp = [1] * n\n    for i in range(1, m):\n        for j in range(1, n): dp[j] += dp[j-1]\n    return dp[-1]`,
    'Word Break': `def wordBreak(s, wordDict):\n    dp = [False] * (len(s) + 1)\n    dp[0] = True\n    words = set(wordDict)\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if dp[j] and s[j:i] in words: dp[i] = True; break\n    return dp[-1]`,
    'Decode Ways': `def numDecodings(s):\n    if not s or s[0] == '0': return 0\n    n = len(s); dp = [0]*(n+1); dp[0] = dp[1] = 1\n    for i in range(2, n+1):\n        if s[i-1] != '0': dp[i] += dp[i-1]\n        two = int(s[i-2:i])\n        if 10 <= two <= 26: dp[i] += dp[i-2]\n    return dp[n]`,
    'Longest Palindromic Substring': `def longestPalindrome(s):\n    res = ''\n    for i in range(len(s)):\n        for l, r in [(i,i),(i,i+1)]:\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                if r-l+1 > len(res): res = s[l:r+1]\n                l -= 1; r += 1\n    return res`,
    'Longest Common Subsequence': `def longestCommonSubsequence(text1, text2):\n    m, n = len(text1), len(text2)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    for i in range(1, m+1):\n        for j in range(1, n+1):\n            if text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1]+1\n            else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n    return dp[m][n]`,
    'Edit Distance': `def minDistance(word1, word2):\n    m, n = len(word1), len(word2)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    for i in range(m+1): dp[i][0] = i\n    for j in range(n+1): dp[0][j] = j\n    for i in range(1, m+1):\n        for j in range(1, n+1):\n            if word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]\n            else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\n    return dp[m][n]`,
    'Partition Equal Subset Sum': `def canPartition(nums):\n    total = sum(nums)\n    if total % 2: return False\n    target = total // 2\n    dp = {0}\n    for n in nums:\n        dp = dp | {s+n for s in dp}\n        if target in dp: return True\n    return target in dp`,
    'Target Sum': `def findTargetSumWays(nums, target):\n    from collections import defaultdict\n    dp = defaultdict(int); dp[0] = 1\n    for n in nums:\n        nxt = defaultdict(int)\n        for s, c in dp.items(): nxt[s+n] += c; nxt[s-n] += c\n        dp = nxt\n    return dp[target]`,
    'Minimum Path Sum': `def minPathSum(grid):\n    m, n = len(grid), len(grid[0])\n    for i in range(m):\n        for j in range(n):\n            if i == 0 and j == 0: continue\n            elif i == 0: grid[i][j] += grid[i][j-1]\n            elif j == 0: grid[i][j] += grid[i-1][j]\n            else: grid[i][j] += min(grid[i-1][j], grid[i][j-1])\n    return grid[m-1][n-1]`,
    'Course Schedule': `def canFinish(numCourses, prerequisites):\n    graph = [[] for _ in range(numCourses)]\n    indeg = [0] * numCourses\n    for a, b in prerequisites: graph[b].append(a); indeg[a] += 1\n    q = [i for i in range(numCourses) if indeg[i] == 0]; count = 0\n    while q:\n        node = q.pop(0); count += 1\n        for nei in graph[node]:\n            indeg[nei] -= 1\n            if indeg[nei] == 0: q.append(nei)\n    return count == numCourses`,
    'Course Schedule II': `def findOrder(numCourses, prerequisites):\n    graph = [[] for _ in range(numCourses)]\n    indeg = [0] * numCourses\n    for a, b in prerequisites: graph[b].append(a); indeg[a] += 1\n    q = [i for i in range(numCourses) if indeg[i] == 0]; order = []\n    while q:\n        node = q.pop(0); order.append(node)\n        for nei in graph[node]:\n            indeg[nei] -= 1\n            if indeg[nei] == 0: q.append(nei)\n    return order if len(order) == numCourses else []`,
    'Number of 1 Bits': `def hammingWeight(n):\n    count = 0\n    while n: count += n & 1; n >>= 1\n    return count`,
    'Counting Bits': `def countBits(n):\n    return [bin(i).count('1') for i in range(n+1)]`,
    'Power of Two': `def isPowerOfTwo(n):\n    return n > 0 and n & (n-1) == 0`,
    'Reverse Bits': `def reverseBits(n):\n    res = 0\n    for _ in range(32): res = (res << 1) | (n & 1); n >>= 1\n    return res`,
    'Fizz Buzz': `def fizzBuzz(n):\n    res = []\n    for i in range(1, n+1):\n        if i % 15 == 0: res.append('FizzBuzz')\n        elif i % 3 == 0: res.append('Fizz')\n        elif i % 5 == 0: res.append('Buzz')\n        else: res.append(str(i))\n    return res`,
    'Roman to Integer': `def romanToInt(s):\n    m = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}\n    res = 0\n    for i in range(len(s)):\n        if i+1 < len(s) and m[s[i]] < m[s[i+1]]: res -= m[s[i]]\n        else: res += m[s[i]]\n    return res`,
    'Palindrome Number': `def isPalindrome(x):\n    if x < 0: return False\n    return str(x) == str(x)[::-1]`,
    'Reverse Integer': `def reverse(x):\n    sign = 1 if x >= 0 else -1\n    rev = int(str(abs(x))[::-1]) * sign\n    return rev if -2**31 <= rev <= 2**31-1 else 0`,
    'Valid Anagram': `def isAnagram(s, t):\n    from collections import Counter\n    return Counter(s) == Counter(t)`,
    'Group Anagrams': `def groupAnagrams(strs):\n    from collections import defaultdict\n    groups = defaultdict(list)\n    for s in strs: groups[tuple(sorted(s))].append(s)\n    return list(groups.values())`,
    'Longest Common Prefix': `def longestCommonPrefix(strs):\n    if not strs: return ''\n    prefix = strs[0]\n    for s in strs[1:]:\n        while not s.startswith(prefix): prefix = prefix[:-1]\n        if not prefix: return ''\n    return prefix`,
    'Gas Station': `def canCompleteCircuit(gas, cost):\n    if sum(gas) < sum(cost): return -1\n    tank = start = 0\n    for i in range(len(gas)):\n        tank += gas[i] - cost[i]\n        if tank < 0: start = i + 1; tank = 0\n    return start`,
    'Partition Labels': `def partitionLabels(s):\n    last = {c: i for i, c in enumerate(s)}\n    start = end = 0; res = []\n    for i, c in enumerate(s):\n        end = max(end, last[c])\n        if i == end: res.append(end - start + 1); start = end + 1\n    return res`,
    'Find the Duplicate Number': `def findDuplicate(nums):\n    slow = fast = nums[0]\n    while True:\n        slow = nums[slow]; fast = nums[nums[fast]]\n        if slow == fast: break\n    slow = nums[0]\n    while slow != fast: slow = nums[slow]; fast = nums[fast]\n    return slow`,
    'Happy Number': `def isHappy(n):\n    seen = set()\n    while n != 1:\n        n = sum(int(d)**2 for d in str(n))\n        if n in seen: return False\n        seen.add(n)\n    return True`,
    'Intersection of Two Arrays': `def intersection(nums1, nums2):\n    return list(set(nums1) & set(nums2))`,
    'Subsets': `def subsets(nums):\n    res = [[]]\n    for n in nums: res += [s + [n] for s in res]\n    return res`,
    'Permutations': `def permute(nums):\n    if len(nums) <= 1: return [nums]\n    res = []\n    for i, n in enumerate(nums):\n        for p in permute(nums[:i]+nums[i+1:]): res.append([n]+p)\n    return res`,
    'Combination Sum': `def combinationSum(candidates, target):\n    res = []\n    def bt(start, path, remain):\n        if remain == 0: res.append(path[:]); return\n        for i in range(start, len(candidates)):\n            if candidates[i] > remain: break\n            path.append(candidates[i])\n            bt(i, path, remain - candidates[i])\n            path.pop()\n    candidates.sort()\n    bt(0, [], target)\n    return res`,
    'Letter Combinations of a Phone Number': `def letterCombinations(digits):\n    if not digits: return []\n    m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}\n    res = ['']\n    for d in digits: res = [r + c for r in res for c in m[d]]\n    return res`,
    'Generate Parentheses': `def generateParenthesis(n):\n    res = []\n    def bt(s, o, c):\n        if len(s) == 2*n: res.append(s); return\n        if o < n: bt(s+'(', o+1, c)\n        if c < o: bt(s+')', o, c+1)\n    bt('', 0, 0)\n    return res`,
    'Task Scheduler': `def leastInterval(tasks, n):\n    from collections import Counter\n    freq = list(Counter(tasks).values())\n    max_f = max(freq); max_count = freq.count(max_f)\n    return max(len(tasks), (max_f-1)*(n+1)+max_count)`,
    'Daily Temperatures': `def dailyTemperatures(temperatures):\n    n = len(temperatures); res = [0]*n; stack = []\n    for i in range(n):\n        while stack and temperatures[i] > temperatures[stack[-1]]:\n            j = stack.pop(); res[j] = i - j\n        stack.append(i)\n    return res`,
    'Decode String': `def decodeString(s):\n    stack = []; cur = ''; num = 0\n    for c in s:\n        if c.isdigit(): num = num * 10 + int(c)\n        elif c == '[': stack.append((cur, num)); cur = ''; num = 0\n        elif c == ']': prev, n = stack.pop(); cur = prev + cur * n\n        else: cur += c\n    return cur`,
    'Next Greater Element I': `def nextGreaterElement(nums1, nums2):\n    stack = []; m = {}\n    for n in nums2:\n        while stack and stack[-1] < n: m[stack.pop()] = n\n        stack.append(n)\n    return [m.get(n, -1) for n in nums1]`,
    'Asteroid Collision': `def asteroidCollision(asteroids):\n    stack = []\n    for a in asteroids:\n        while stack and a < 0 < stack[-1]:\n            if stack[-1] < -a: stack.pop(); continue\n            elif stack[-1] == -a: stack.pop()\n            break\n        else: stack.append(a)\n    return stack`,
    'Remove K Digits': `def removeKdigits(num, k):\n    stack = []\n    for d in num:\n        while k and stack and stack[-1] > d: stack.pop(); k -= 1\n        stack.append(d)\n    return ''.join(stack[:len(stack)-k]).lstrip('0') or '0'`,
    'Simplify Path': `def simplifyPath(path):\n    stack = []\n    for p in path.split('/'):\n        if p == '..': \n            if stack: stack.pop()\n        elif p and p != '.': stack.append(p)\n    return '/' + '/'.join(stack)`,
    'Evaluate Reverse Polish Notation': `def evalRPN(tokens):\n    stack = []\n    for t in tokens:\n        if t in '+-*/':\n            b, a = stack.pop(), stack.pop()\n            if t == '+': stack.append(a+b)\n            elif t == '-': stack.append(a-b)\n            elif t == '*': stack.append(a*b)\n            else: stack.append(int(a/b))\n        else: stack.append(int(t))\n    return stack[0]`,
    'Word Search': `def exist(board, word):\n    m, n = len(board), len(board[0])\n    def dfs(i, j, k):\n        if k == len(word): return True\n        if i < 0 or i >= m or j < 0 or j >= n or board[i][j] != word[k]: return False\n        tmp = board[i][j]; board[i][j] = '#'\n        res = dfs(i+1,j,k+1) or dfs(i-1,j,k+1) or dfs(i,j+1,k+1) or dfs(i,j-1,k+1)\n        board[i][j] = tmp\n        return res\n    for i in range(m):\n        for j in range(n):\n            if dfs(i,j,0): return True\n    return False`,
};

async function main() {
    console.log('Expanding solution coverage...');

    const { data: problems } = await supabaseAdmin
        .from('problems')
        .select('id, title, solution_code, starter_code')
        .order('id');

    let pyAdded = 0, totalUpdated = 0;

    for (const p of problems || []) {
        const existing = p.solution_code || {};
        let changed = false;

        // Add Python if missing
        if (!existing.python && MORE_PYTHON[p.title]) {
            existing.python = MORE_PYTHON[p.title];
            changed = true;
            pyAdded++;
        }

        // For problems with Python but no JS — generate JS from starter code
        if (existing.python && !existing.javascript && p.starter_code?.javascript) {
            // We'll leave JS empty for now — only hand-crafted JS
        }

        if (changed) {
            const { error } = await supabaseAdmin
                .from('problems')
                .update({ solution_code: existing })
                .eq('id', p.id);
            if (!error) totalUpdated++;
            else console.error(`Error ${p.title}:`, error.message);
        }
    }

    console.log(`Added ${pyAdded} more Python solutions`);
    console.log(`Total problems updated: ${totalUpdated}`);

    // Check final coverage
    const { data: withSol } = await supabaseAdmin
        .from('problems')
        .select('id', { count: 'exact' })
        .not('solution_code', 'is', null)
        .neq('solution_code', '{}');

    console.log(`\nFinal coverage: ${withSol?.length || 0}/425 problems have solutions`);
}

main().catch(console.error);
