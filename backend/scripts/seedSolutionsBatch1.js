/**
 * Seed solutions batch 1: Sliding Window (pattern 2) + Two Pointers (pattern 7) problems
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

const solutions = {
    // === SLIDING WINDOW (pattern 2) ===
    90: `from collections import deque
def maxSlidingWindow(nums, k):
    dq = deque()
    result = []
    for i, v in enumerate(nums):
        while dq and dq[0] < i - k + 1: dq.popleft()
        while dq and nums[dq[-1]] < v: dq.pop()
        dq.append(i)
        if i >= k - 1: result.append(nums[dq[0]])
    return result`,

    96: `def totalFruit(nums):
    count = {}
    left = result = 0
    for right, v in enumerate(nums):
        count[v] = count.get(v, 0) + 1
        while len(count) > 2:
            count[nums[left]] -= 1
            if count[nums[left]] == 0: del count[nums[left]]
            left += 1
        result = max(result, right - left + 1)
    return result`,

    101: `def numberOfSubarrays(nums, k):
    count = {0: 1}
    prefix = result = 0
    for v in nums:
        prefix += v % 2
        result += count.get(prefix - k, 0)
        count[prefix] = count.get(prefix, 0) + 1
    return result`,

    102: `def maxTurbulenceSize(nums):
    if len(nums) < 2: return len(nums)
    inc = dec = 1
    result = 1
    for i in range(1, len(nums)):
        if nums[i] > nums[i-1]:
            inc = dec + 1; dec = 1
        elif nums[i] < nums[i-1]:
            dec = inc + 1; inc = 1
        else:
            inc = dec = 1
        result = max(result, inc, dec)
    return result`,

    103: `def equalSubstring(s, t, m):
    left = 0
    cost = 0
    result = 0
    for right in range(len(s)):
        cost += abs(ord(s[right]) - ord(t[right]))
        while cost > m:
            cost -= abs(ord(s[left]) - ord(t[left]))
            left += 1
        result = max(result, right - left + 1)
    return result`,

    104: `def maxSatisfied(nums, nums2, m):
    base = sum(c for c, g in zip(nums, nums2) if g == 0)
    window = sum(c * g for c, g in zip(nums[:m], nums2[:m]))
    best = window
    for i in range(m, len(nums)):
        window += nums[i] * nums2[i] - nums[i-m] * nums2[i-m]
        best = max(best, window)
    return base + best`,

    105: `def dietPlanPerformance(nums, k, lower, upper):
    s = sum(nums[:k])
    points = 0
    if s < lower: points -= 1
    elif s > upper: points += 1
    for i in range(k, len(nums)):
        s += nums[i] - nums[i-k]
        if s < lower: points -= 1
        elif s > upper: points += 1
    return points`,

    106: `def numOfSubarrays(nums, k, m):
    s = sum(nums[:k])
    count = 1 if s >= m * k else 0
    for i in range(k, len(nums)):
        s += nums[i] - nums[i-k]
        if s >= m * k: count += 1
    return count`,

    107: `def numSubarraysWithSum(nums, target):
    count = {0: 1}
    prefix = result = 0
    for v in nums:
        prefix += v
        result += count.get(prefix - target, 0)
        count[prefix] = count.get(prefix, 0) + 1
    return result`,

    111: `def solve(s):
    if len(s) < 2: return ""
    for c in set(s):
        if c.swapcase() not in s:
            parts = s.split(c)
            results = [solve(p) for p in parts]
            return max(results, key=len)
    return s`,

    113: `def containsNearbyAlmostDuplicate(nums, k, m):
    if m < 0: return False
    buckets = {}
    w = m + 1
    for i, v in enumerate(nums):
        b = v // w
        if b in buckets: return True
        if b - 1 in buckets and abs(v - buckets[b-1]) <= m: return True
        if b + 1 in buckets and abs(v - buckets[b+1]) <= m: return True
        buckets[b] = v
        if i >= k: del buckets[nums[i-k] // w]
    return False`,

    114: `def longestMountain(nums):
    n = len(nums)
    result = 0
    i = 1
    while i < n - 1:
        if nums[i-1] < nums[i] and nums[i] > nums[i+1]:
            left = i - 1
            while left > 0 and nums[left-1] < nums[left]: left -= 1
            right = i + 1
            while right < n - 1 and nums[right] > nums[right+1]: right += 1
            result = max(result, right - left + 1)
            i = right
        else:
            i += 1
    return result`,

    115: `def largestVariance(s):
    result = 0
    chars = set(s)
    for a in chars:
        for b in chars:
            if a == b: continue
            countA = countB = 0
            hasB = False
            for c in s:
                if c == a: countA += 1
                elif c == b: countB += 1; hasB = True
                if countB > countA: countA = countB = 0; hasB = False
                if hasB: result = max(result, countA - countB)
    return result`,

    116: `def maxScore(nums, k):
    n = len(nums)
    total = sum(nums)
    window = sum(nums[:n-k])
    minWindow = window
    for i in range(n-k, n):
        window += nums[i] - nums[i-(n-k)]
        minWindow = min(minWindow, window)
    return total - minWindow`,

    // === TWO POINTERS (pattern 7) ===
    56: `def removeDuplicates(nums):
    if len(nums) <= 2: return len(nums)
    k = 2
    for i in range(2, len(nums)):
        if nums[i] != nums[k-2]:
            nums[k] = nums[i]
            k += 1
    return k`,

    57: `def deleteDuplicates(nums):
    if not nums: return nums
    head = ListNode(0)
    head.next = __list_to_linked(nums) if isinstance(nums, list) else nums
    prev = head
    cur = head.next
    while cur:
        while cur.next and cur.val == cur.next.val:
            cur = cur.next
        if prev.next == cur:
            prev = prev.next
        else:
            prev.next = cur.next
        cur = cur.next
    return __linked_to_list(head.next)`,

    66: `def numSubseq(nums, k):
    MOD = 10**9 + 7
    nums.sort()
    n = len(nums)
    result = 0
    left, right = 0, n - 1
    power = [1] * n
    for i in range(1, n): power[i] = power[i-1] * 2 % MOD
    while left <= right:
        if nums[left] + nums[right] <= k:
            result = (result + power[right - left]) % MOD
            left += 1
        else:
            right -= 1
    return result`,

    69: `def sortTransformedArray(nums, k, m, val):
    def f(x): return k * x * x + m * x + val
    result = [f(x) for x in nums]
    result.sort()
    return result`,

    71: `import heapq
def trapRainWater(matrix):
    if not matrix or not matrix[0]: return 0
    m, n = len(matrix), len(matrix[0])
    visited = [[False]*n for _ in range(m)]
    heap = []
    for i in range(m):
        for j in range(n):
            if i == 0 or i == m-1 or j == 0 or j == n-1:
                heapq.heappush(heap, (matrix[i][j], i, j))
                visited[i][j] = True
    water = 0
    while heap:
        h, r, c = heapq.heappop(heap)
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < m and 0 <= nc < n and not visited[nr][nc]:
                visited[nr][nc] = True
                water += max(0, h - matrix[nr][nc])
                heapq.heappush(heap, (max(h, matrix[nr][nc]), nr, nc))
    return water`,

    73: `def minPairSum(nums):
    nums.sort()
    return max(nums[i] + nums[len(nums)-1-i] for i in range(len(nums)//2))`,

    80: `def middleNode(nums):
    if isinstance(nums, list):
        return nums[len(nums)//2:]
    slow = fast = nums
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return __linked_to_list(slow)`,

    81: `def isPalindrome(nums):
    if isinstance(nums, list):
        return nums == nums[::-1]
    vals = nums if isinstance(nums, list) else []
    return vals == vals[::-1]`,

    82: `def reorderList(nums):
    if not nums or len(nums) < 3: return nums
    n = len(nums)
    result = []
    left, right = 0, n - 1
    while left <= right:
        result.append(nums[left])
        if left != right: result.append(nums[right])
        left += 1; right -= 1
    return result`,

    83: `def removeNthFromEnd(nums, k):
    n = len(nums)
    if k > n: return nums
    idx = n - k
    return nums[:idx] + nums[idx+1:]`,

    85: `def rotateRight(nums, k):
    if not nums: return nums
    n = len(nums)
    k = k % n
    if k == 0: return nums
    return nums[n-k:] + nums[:n-k]`,
};

async function main() {
    console.log('Seeding solutions batch 1 (Sliding Window + Two Pointers)...');
    let count = 0;
    for (const [id, code] of Object.entries(solutions)) {
        const { data: problem } = await supabase.from('problems').select('solution_code').eq('id', id).single();
        const existing = problem?.solution_code || {};
        existing.python = code;
        const { error } = await supabase.from('problems').update({ solution_code: existing }).eq('id', id);
        if (error) console.log(`  ❌ ID ${id}: ${error.message}`);
        else { console.log(`  ✅ ID ${id}`); count++; }
    }
    console.log(`\nSeeded ${count}/${Object.keys(solutions).length} solutions`);
}

main().catch(console.error);
