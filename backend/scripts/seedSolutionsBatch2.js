/**
 * Seed solutions batch 2: Stacks (16), Binary Search (3), Arrays/FastSlow (13), Linked Lists (17)
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
    // === STACKS (pattern 16) ===
    158: `def longestValidParentheses(s):
    stack = [-1]
    result = 0
    for i, c in enumerate(s):
        if c == '(': stack.append(i)
        else:
            stack.pop()
            if not stack: stack.append(i)
            else: result = max(result, i - stack[-1])
    return result`,

    159: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    def push(self, val):
        self.stack.append(val)
        self.min_stack.append(min(val, self.min_stack[-1] if self.min_stack else val))
    def pop(self):
        self.stack.pop()
        self.min_stack.pop()
    def top(self):
        return self.stack[-1]
    def getMin(self):
        return self.min_stack[-1]`,

    160: `class MaxStack:
    def __init__(self):
        self.stack = []
    def push(self, x):
        self.stack.append(x)
    def pop(self):
        return self.stack.pop()
    def top(self):
        return self.stack[-1]
    def peekMax(self):
        return max(self.stack)
    def popMax(self):
        m = max(self.stack)
        idx = len(self.stack) - 1 - self.stack[::-1].index(m)
        self.stack.pop(idx)
        return m`,

    164: `def calculate(s):
    stack = []
    num = 0
    sign = 1
    result = 0
    for c in s:
        if c.isdigit():
            num = num * 10 + int(c)
        elif c == '+':
            result += sign * num; num = 0; sign = 1
        elif c == '-':
            result += sign * num; num = 0; sign = -1
        elif c == '(':
            stack.append(result); stack.append(sign)
            result = 0; sign = 1
        elif c == ')':
            result += sign * num; num = 0
            result *= stack.pop(); result += stack.pop()
    return result + sign * num`,

    165: `def calculate(s):
    stack = []
    num = 0
    op = '+'
    for i, c in enumerate(s):
        if c.isdigit(): num = num * 10 + int(c)
        if (not c.isdigit() and c != ' ') or i == len(s) - 1:
            if op == '+': stack.append(num)
            elif op == '-': stack.append(-num)
            elif op == '*': stack.append(stack.pop() * num)
            elif op == '/': stack.append(int(stack.pop() / num))
            op = c; num = 0
    return sum(stack)`,

    166: `def calculate(s):
    def helper(it):
        stack = []; num = 0; op = '+'
        while True:
            try: c = next(it)
            except StopIteration: c = None
            if c and c.isdigit(): num = num * 10 + int(c); continue
            if c == '(': num = helper(it)
            if op == '+': stack.append(num)
            elif op == '-': stack.append(-num)
            elif op == '*': stack.append(stack.pop() * num)
            elif op == '/': stack.append(int(stack.pop() / num))
            if c == ')' or c is None: return sum(stack)
            op = c; num = 0
    return helper(iter(s))`,

    169: `def removeDuplicates(s, val):
    stack = []
    for c in s:
        if stack and stack[-1][0] == c:
            stack[-1][1] += 1
            if stack[-1][1] == val: stack.pop()
        else:
            stack.append([c, 1])
    return ''.join(c * n for c, n in stack)`,

    170: `def nextGreaterElement(nums1, nums2):
    stack = []
    mapping = {}
    for v in nums2:
        while stack and stack[-1] < v:
            mapping[stack.pop()] = v
        stack.append(v)
    return [mapping.get(v, -1) for v in nums1]`,

    177: `def nextGreaterElement2(nums):
    n = len(nums)
    result = [-1] * n
    stack = []
    for i in range(2 * n):
        while stack and nums[stack[-1]] < nums[i % n]:
            result[stack.pop()] = nums[i % n]
        if i < n: stack.append(i)
    return result`,

    178: `def nextGreaterElement(n):
    digits = list(str(n))
    i = len(digits) - 2
    while i >= 0 and digits[i] >= digits[i+1]: i -= 1
    if i < 0: return -1
    j = len(digits) - 1
    while digits[j] <= digits[i]: j -= 1
    digits[i], digits[j] = digits[j], digits[i]
    digits[i+1:] = digits[i+1:][::-1]
    result = int(''.join(digits))
    return result if result < 2**31 else -1`,

    179: `def largestRectangleArea(nums):
    stack = []
    result = 0
    nums.append(0)
    for i, h in enumerate(nums):
        while stack and nums[stack[-1]] > h:
            height = nums[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            result = max(result, height * width)
        stack.append(i)
    nums.pop()
    return result`,

    180: `def maximalRectangle(matrix):
    if not matrix: return 0
    n = len(matrix[0])
    heights = [0] * (n + 1)
    result = 0
    for row in matrix:
        for j in range(n):
            heights[j] = heights[j] + 1 if row[j] == '1' or row[j] == 1 else 0
        stack = []
        for i in range(n + 1):
            while stack and heights[stack[-1]] > heights[i]:
                h = heights[stack.pop()]
                w = i if not stack else i - stack[-1] - 1
                result = max(result, h * w)
            stack.append(i)
    return result`,

    182: `def scoreOfParentheses(s):
    stack = [0]
    for c in s:
        if c == '(': stack.append(0)
        else:
            v = stack.pop()
            stack[-1] += max(2 * v, 1)
    return stack[0]`,

    185: `def minRemoveToMakeValid(s):
    s = list(s)
    stack = []
    for i, c in enumerate(s):
        if c == '(': stack.append(i)
        elif c == ')':
            if stack: stack.pop()
            else: s[i] = ''
    for i in stack: s[i] = ''
    return ''.join(s)`,

    186: `def maxDepth(s):
    depth = result = 0
    for c in s:
        if c == '(': depth += 1; result = max(result, depth)
        elif c == ')': depth -= 1
    return result`,

    // === BINARY SEARCH (pattern 3) ===
    189: `def solve(n, k):
    left, right = 1, n
    while left < right:
        mid = (left + right) // 2
        if mid >= k: right = mid
        else: left = mid + 1
    return left`,

    197: `def search(nums, k):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == k: return True
        while left < mid and nums[left] == nums[mid]: left += 1
        if nums[left] <= nums[mid]:
            if nums[left] <= k < nums[mid]: right = mid - 1
            else: left = mid + 1
        else:
            if nums[mid] < k <= nums[right]: left = mid + 1
            else: right = mid - 1
    return False`,

    199: `def findMin(nums):
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > nums[right]: left = mid + 1
        elif nums[mid] < nums[right]: right = mid
        else: right -= 1
    return nums[left]`,

    201: `def findClosestElements(nums, k, m):
    left, right = 0, len(nums) - k
    while left < right:
        mid = (left + right) // 2
        if m - nums[mid] > nums[mid + k] - m: left = mid + 1
        else: right = mid
    return nums[left:left+k]`,

    202: `def kthSmallest(matrix, k):
    import heapq
    return list(heapq.merge(*matrix))[k-1]`,

    203: `def smallestDistancePair(nums, k):
    nums.sort()
    def count_pairs(mid):
        c = j = 0
        for i in range(len(nums)):
            while j < len(nums) and nums[j] - nums[i] <= mid: j += 1
            c += j - i - 1
        return c
    lo, hi = 0, nums[-1] - nums[0]
    while lo < hi:
        mid = (lo + hi) // 2
        if count_pairs(mid) < k: lo = mid + 1
        else: hi = mid
    return lo`,

    205: `def minmaxGasDist(stations, k):
    lo, hi = 0, stations[-1] - stations[0]
    while hi - lo > 1e-6:
        mid = (lo + hi) / 2
        count = sum(int((stations[i+1] - stations[i]) / mid) for i in range(len(stations)-1))
        if count <= k: hi = mid
        else: lo = mid
    return round(hi, 6)`,

    206: `def splitArray(nums, target):
    def can_split(largest):
        pieces = 1; total = 0
        for n in nums:
            total += n
            if total > largest: pieces += 1; total = n
        return pieces <= target
    lo, hi = max(nums), sum(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_split(mid): hi = mid
        else: lo = mid + 1
    return lo`,

    208: `def maximizeSweetness(nums, k):
    def can_divide(min_sweet):
        pieces = total = 0
        for n in nums:
            total += n
            if total >= min_sweet: pieces += 1; total = 0
        return pieces >= k + 1
    lo, hi = min(nums), sum(nums) // (k + 1)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if can_divide(mid): lo = mid
        else: hi = mid - 1
    return lo`,

    209: `def minDays(nums, k, m):
    def can_make(days):
        bouquets = flowers = 0
        for b in nums:
            if b <= days: flowers += 1
            else: flowers = 0
            if flowers == k: bouquets += 1; flowers = 0
        return bouquets >= m
    if k * m > len(nums): return -1
    lo, hi = min(nums), max(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_make(mid): hi = mid
        else: lo = mid + 1
    return lo`,

    210: `def minmaxGasDist2(stations, k):
    lo, hi = 0, stations[-1] - stations[0]
    while hi - lo > 1e-6:
        mid = (lo + hi) / 2
        count = sum(int((stations[i+1] - stations[i]) / mid) for i in range(len(stations)-1))
        if count <= k: hi = mid
        else: lo = mid
    return round(hi, 6)`,

    213: `import bisect
def maxEnvelopes(matrix):
    matrix.sort(key=lambda x: (x[0], -x[1]))
    dp = []
    for _, h in matrix:
        pos = bisect.bisect_left(dp, h)
        if pos == len(dp): dp.append(h)
        else: dp[pos] = h
    return len(dp)`,

    214: `import heapq
class MedianFinder:
    def __init__(self):
        self.lo = []
        self.hi = []
    def addNum(self, num):
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
    def findMedian(self):
        if len(self.lo) > len(self.hi): return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2.0`,

    219: `def countNodes(nums):
    if isinstance(nums, list): return len(nums)
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return 0
    def count(node):
        if not node: return 0
        return 1 + count(node.left) + count(node.right)
    return count(root)`,

    221: `def divide(n, k):
    if k == 0: return 2**31 - 1
    sign = -1 if (n < 0) ^ (k < 0) else 1
    a, b = abs(n), abs(k)
    result = 0
    while a >= b:
        temp, m = b, 1
        while a >= temp << 1:
            temp <<= 1; m <<= 1
        a -= temp; result += m
    result = sign * result
    return min(max(result, -(2**31)), 2**31 - 1)`,

    // === ARRAYS / FAST-SLOW (pattern 13) ===
    122: `def circularArrayLoop(nums):
    n = len(nums)
    for i in range(n):
        slow = fast = i
        forward = nums[i] > 0
        while True:
            slow = (slow + nums[slow]) % n
            if (nums[slow] > 0) != forward: break
            fast = (fast + nums[fast]) % n
            if (nums[fast] > 0) != forward: break
            fast = (fast + nums[fast]) % n
            if (nums[fast] > 0) != forward: break
            if slow == fast:
                if slow == (slow + nums[slow]) % n: break
                return True
            break
    return False`,

    117: `def solve(nums):
    if not nums: return []
    mid = len(nums) // 2
    return nums[mid:]`,

    123: `def isPalindrome2(nums):
    return nums == nums[::-1]`,

    124: `def reorderList2(nums):
    if not nums or len(nums) < 3: return nums
    result = []
    left, right = 0, len(nums) - 1
    while left <= right:
        result.append(nums[left])
        if left != right: result.append(nums[right])
        left += 1; right -= 1
    return result`,

    125: `def rotateRight(nums, k):
    if not nums: return nums
    n = len(nums)
    k = k % n
    return nums[n-k:] + nums[:n-k] if k else nums`,

    126: `def deleteMiddle(nums):
    if not nums or len(nums) <= 1: return []
    mid = len(nums) // 2
    return nums[:mid] + nums[mid+1:]`,

    127: `def pairSum(nums):
    n = len(nums)
    result = 0
    for i in range(n // 2):
        result = max(result, nums[i] + nums[n - 1 - i])
    return result`,

    128: `def oddEvenList(nums):
    if not nums or len(nums) < 3: return nums
    odd = [nums[i] for i in range(0, len(nums), 2)]
    even = [nums[i] for i in range(1, len(nums), 2)]
    return odd + even`,

    131: `def splitListToParts(nums, k):
    n = len(nums)
    base, extra = divmod(n, k)
    result = []
    idx = 0
    for i in range(k):
        sz = base + (1 if i < extra else 0)
        result.append(nums[idx:idx+sz])
        idx += sz
    return result`,
};

async function main() {
    console.log('Seeding solutions batch 2...');
    let count = 0;
    for (const [id, code] of Object.entries(solutions)) {
        const { data: problem } = await supabase.from('problems').select('solution_code').eq('id', id).single();
        const existing = problem?.solution_code || {};
        existing.python = code;
        const { error } = await supabase.from('problems').update({ solution_code: existing }).eq('id', id);
        if (error) console.log(`  ❌ ID ${id}: ${error.message}`);
        else { count++; }
    }
    console.log(`Seeded ${count}/${Object.keys(solutions).length} solutions`);
}
main().catch(console.error);
