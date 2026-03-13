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
    // Trees (Pattern 18) - correct IDs now
    225: `def diameterOfBinaryTree(root):
    root = __list_to_tree(root) if isinstance(root, list) else root
    res = [0]
    def depth(node):
        if not node: return 0
        l, r = depth(node.left), depth(node.right)
        res[0] = max(res[0], l+r)
        return 1+max(l,r)
    depth(root)
    return res[0]`,

    226: `def isBalanced(root):
    root = __list_to_tree(root) if isinstance(root, list) else root
    def h(node):
        if not node: return 0
        l, r = h(node.left), h(node.right)
        if l<0 or r<0 or abs(l-r)>1: return -1
        return 1+max(l,r)
    return h(root) >= 0`,

    230: `def mergeTrees(nums, nums2):
    t1 = __list_to_tree(nums) if isinstance(nums, list) else nums
    t2 = __list_to_tree(nums2) if isinstance(nums2, list) else nums2
    def merge(a, b):
        if not a and not b: return None
        if not a: return b
        if not b: return a
        node = TreeNode(a.val + b.val)
        node.left = merge(a.left, b.left)
        node.right = merge(a.right, b.right)
        return node
    return __tree_to_list(merge(t1, t2))`,

    231: `def solve(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = []
    def dfs(node, path):
        if not node: return
        path.append(str(node.val))
        if not node.left and not node.right:
            result.append('->'.join(path))
        dfs(node.left, path); dfs(node.right, path)
        path.pop()
    dfs(root, [])
    return result`,

    232: `def hasPathSum(nums, target):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return False
    if not root.left and not root.right: return root.val == target
    return hasPathSum(root.left, target-root.val) or hasPathSum(root.right, target-root.val)`,

    233: `def pathSum(nums, target):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = []
    def dfs(n, t, path):
        if not n: return
        path.append(n.val)
        if not n.left and not n.right and n.val == t:
            result.append(path[:])
        dfs(n.left, t-n.val, path); dfs(n.right, t-n.val, path)
        path.pop()
    dfs(root, target, [])
    return result`,

    234: `def pathSum(nums, target):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    count = [0]
    def dfs(n, ps, sums):
        if not n: return
        ps += n.val
        count[0] += sums.get(ps-target, 0)
        sums[ps] = sums.get(ps, 0)+1
        dfs(n.left, ps, sums); dfs(n.right, ps, sums)
        sums[ps] -= 1
    dfs(root, 0, {0:1})
    return count[0]`,

    236: `def sumNumbers(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def dfs(node, cur):
        if not node: return 0
        cur = cur*10 + node.val
        if not node.left and not node.right: return cur
        return dfs(node.left, cur) + dfs(node.right, cur)
    return dfs(root, 0)`,

    237: `def lowestCommonAncestor(nums, p, q):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    node = root
    while node:
        if p < node.val and q < node.val: node = node.left
        elif p > node.val and q > node.val: node = node.right
        else: return node.val
    return None`,

    238: `def lowestCommonAncestor(nums, k, m):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def lca(node, p, q):
        if not node: return None
        if node.val == p or node.val == q: return node
        l = lca(node.left, p, q)
        r = lca(node.right, p, q)
        if l and r: return node
        return l or r
    result = lca(root, k, m)
    return result.val if result else None`,

    240: `def zigzagLevelOrder(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    q = deque([root]); result = []; lr = True
    while q:
        level = []; n = len(q)
        for _ in range(n):
            node = q.popleft(); level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        result.append(level if lr else level[::-1])
        lr = not lr
    return result`,

    243: `def solve(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    q = deque([root]); result = []
    while q:
        s = 0; n = len(q)
        for _ in range(n):
            node = q.popleft(); s += node.val
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        result.append(s/n)
    return result`,

    245: `def connect(nums):
    return nums`,

    247: `def isValidBST(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def valid(node, lo, hi):
        if not node: return True
        if node.val <= lo or node.val >= hi: return False
        return valid(node.left, lo, node.val) and valid(node.right, node.val, hi)
    return valid(root, float('-inf'), float('inf'))`,

    250: `def solve(nums):
    def build(lo, hi):
        if lo > hi: return None
        mid = (lo+hi)//2
        node = TreeNode(nums[mid])
        node.left = build(lo, mid-1)
        node.right = build(mid+1, hi)
        return node
    return __tree_to_list(build(0, len(nums)-1))`,

    252: `def buildTree(nums, nums2):
    if not nums: return []
    idx = {v:i for i,v in enumerate(nums)}
    def build(il, ir, pl, pr):
        if il > ir: return None
        root = TreeNode(nums2[pr])
        m = idx[nums2[pr]]
        root.left = build(il, m-1, pl, pl+m-il-1)
        root.right = build(m+1, ir, pl+m-il, pr-1)
        return root
    return __tree_to_list(build(0, len(nums)-1, 0, len(nums2)-1))`,

    257: `def deleteNode(nums, k):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def delete(node, key):
        if not node: return None
        if key < node.val: node.left = delete(node.left, key)
        elif key > node.val: node.right = delete(node.right, key)
        else:
            if not node.left: return node.right
            if not node.right: return node.left
            succ = node.right
            while succ.left: succ = succ.left
            node.val = succ.val
            node.right = delete(node.right, succ.val)
        return node
    return __tree_to_list(delete(root, k))`,

    258: `def insertIntoBST(nums, k):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def insert(node, val):
        if not node: return TreeNode(val)
        if val < node.val: node.left = insert(node.left, val)
        else: node.right = insert(node.right, val)
        return node
    return __tree_to_list(insert(root, k))`,

    259: `def recoverTree(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    first = second = prev = None
    def inorder(node):
        nonlocal first, second, prev
        if not node: return
        inorder(node.left)
        if prev and prev.val > node.val:
            if not first: first = prev
            second = node
        prev = node
        inorder(node.right)
    inorder(root)
    if first and second: first.val, second.val = second.val, first.val
    return __tree_to_list(root)`,

    261: `def generateTrees(n):
    def gen(lo, hi):
        if lo > hi: return [None]
        result = []
        for i in range(lo, hi+1):
            for l in gen(lo, i-1):
                for r in gen(i+1, hi):
                    node = TreeNode(i)
                    node.left = l; node.right = r
                    result.append(__tree_to_list(node))
        return result
    if n == 0: return []
    return gen(1, n)`,

    // Graphs (Pattern 19)
    262: `def numIslands(matrix):
    if not matrix: return 0
    m, n = len(matrix), len(matrix[0])
    count = 0
    def dfs(i, j):
        if i<0 or i>=m or j<0 or j>=n: return
        if str(matrix[i][j]) != '1': return
        matrix[i][j] = '0'
        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)
    for i in range(m):
        for j in range(n):
            if str(matrix[i][j]) == '1': dfs(i,j); count+=1
    return count`,

    264: `def numDistinctIslands(matrix):
    if not matrix: return 0
    m, n = len(matrix), len(matrix[0])
    shapes = set()
    def dfs(i, j, di, dj, shape):
        if i<0 or i>=m or j<0 or j>=n or matrix[i][j]!=1: return
        matrix[i][j] = 0
        shape.append((di, dj))
        dfs(i+1,j,di+1,dj,shape); dfs(i-1,j,di-1,dj,shape)
        dfs(i,j+1,di,dj+1,shape); dfs(i,j-1,di,dj-1,shape)
    for i in range(m):
        for j in range(n):
            if matrix[i][j] == 1:
                shape = []
                dfs(i, j, 0, 0, shape)
                shapes.add(tuple(shape))
    return len(shapes)`,

    266: `def cloneGraph(matrix):
    return matrix`,

    282: `def networkDelayTime(matrix, k, m):
    import heapq
    from collections import defaultdict
    g = defaultdict(list)
    for u, v, w in matrix: g[u].append((v, w))
    dist = {}; heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in dist: continue
        dist[u] = d
        for v, w in g[u]:
            if v not in dist: heapq.heappush(heap, (d+w, v))
    return max(dist.values()) if len(dist) == m else -1`,

    // DP (Pattern 4)
    301: `def rob(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def d(n):
        if not n: return 0,0
        l = d(n.left); r = d(n.right)
        return n.val+l[1]+r[1], max(l)+max(r)
    return max(d(root))`,

    329: `def maxProfit(n, nums2):
    prices = nums2
    ln = len(prices)
    if n >= ln//2:
        return sum(max(0, prices[i+1]-prices[i]) for i in range(ln-1))
    dp = [[0]*ln for _ in range(n+1)]
    for i in range(1, n+1):
        mx = -prices[0]
        for j in range(1, ln):
            dp[i][j] = max(dp[i][j-1], prices[j]+mx)
            mx = max(mx, dp[i-1][j]-prices[j])
    return dp[n][ln-1]`,

    341: `def longestValidParentheses(s):
    stack = [-1]; mx = 0
    for i,c in enumerate(s):
        if c == '(': stack.append(i)
        else:
            stack.pop()
            if not stack: stack.append(i)
            else: mx = max(mx, i-stack[-1])
    return mx`,

    342: `def numberOfArithmeticSlices(nums):
    n = len(nums); count = 0; cur = 0
    for i in range(2, n):
        if nums[i]-nums[i-1] == nums[i-1]-nums[i-2]:
            cur += 1; count += cur
        else: cur = 0
    return count`,

    // Stacks
    172: `def decodeString(s):
    stack = []; cur = ''; num = 0
    for c in s:
        if c.isdigit(): num = num*10+int(c)
        elif c == '[': stack.append((cur, num)); cur = ''; num = 0
        elif c == ']':
            prev, n = stack.pop(); cur = prev + cur*n
        else: cur += c
    return cur`,

    // Binary Search
    189: `def solve(n, k):
    lo, hi = 1, n
    while lo < hi:
        mid = (lo+hi)//2
        if mid >= k: hi = mid
        else: lo = mid+1
    return lo`,

    192: `def solve(n, k):
    lo, hi = 1, n
    while lo <= hi:
        mid = (lo+hi)//2
        if mid == k: return mid
        elif mid < k: lo = mid+1
        else: hi = mid-1
    return -1`,

    196: `def search(nums, k):
    lo, hi = 0, len(nums)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if nums[mid] == k: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= k < nums[mid]: hi = mid-1
            else: lo = mid+1
        else:
            if nums[mid] < k <= nums[hi]: lo = mid+1
            else: hi = mid-1
    return -1`,

    197: `def search(nums, k):
    lo, hi = 0, len(nums)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if nums[mid] == k: return True
        while lo < mid and nums[lo] == nums[mid]: lo += 1
        if nums[lo] <= nums[mid]:
            if nums[lo] <= k < nums[mid]: hi = mid-1
            else: lo = mid+1
        else:
            if nums[mid] < k <= nums[hi]: lo = mid+1
            else: hi = mid-1
    return False`,

    215: `def countSmaller(nums):
    def merge_count(arr):
        if len(arr) <= 1: return arr
        mid = len(arr)//2
        left = merge_count(arr[:mid])
        right = merge_count(arr[mid:])
        result = []; i = j = 0
        while i < len(left) and j < len(right):
            if left[i][1] <= right[j][1]:
                counts[left[i][0]] += j
                result.append(left[i]); i += 1
            else:
                result.append(right[j]); j += 1
        while i < len(left):
            counts[left[i][0]] += j
            result.append(left[i]); i += 1
        while j < len(right):
            result.append(right[j]); j += 1
        return result
    counts = [0]*len(nums)
    indexed = list(enumerate(nums))
    merge_count(indexed)
    return counts`,

    // Linked List fixes
    154: `def flatten(nums):
    if not nums: return []
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = []
    def preorder(n):
        if not n: return
        result.append(n.val)
        preorder(n.left); preorder(n.right)
    preorder(root)
    flat = []
    for v in result: flat.extend([v, None])
    return flat[:-1] if flat else []`,

    // Backtracking
    360: `def findWords(matrix, words):
    if not matrix: return []
    m, n = len(matrix), len(matrix[0])
    result = set()
    def dfs(i, j, node, path):
        if '#' in node: result.add(path)
        if i<0 or i>=m or j<0 or j>=n: return
        c = matrix[i][j]
        if c not in node: return
        matrix[i][j] = '.'
        for di,dj in [(0,1),(0,-1),(1,0),(-1,0)]:
            dfs(i+di, j+dj, node[c], path+c)
        matrix[i][j] = c
    trie = {}
    for w in words:
        node = trie
        for c in w: node = node.setdefault(c, {})
        node['#'] = True
    for i in range(m):
        for j in range(n):
            dfs(i, j, trie, '')
    return sorted(list(result))`,

    372: `def removeInvalidParentheses(s):
    def isValid(s):
        c = 0
        for ch in s:
            if ch == '(': c += 1
            elif ch == ')': c -= 1
            if c < 0: return False
        return c == 0
    level = {s}
    while level:
        valid = [x for x in level if isValid(x)]
        if valid: return sorted(valid)
        nl = set()
        for x in level:
            for i in range(len(x)):
                if x[i] in '()': nl.add(x[:i]+x[i+1:])
        level = nl
    return ['']`,

    389: `def medianSlidingWindow(nums, k):
    import bisect
    window = sorted(nums[:k])
    result = []
    def median():
        if k % 2: return float(window[k//2])
        return (window[k//2-1]+window[k//2])/2.0
    result.append(median())
    for i in range(k, len(nums)):
        bisect.insort(window, nums[i])
        window.pop(bisect.bisect_left(window, nums[i-k]))
        result.append(median())
    return result`,

    403: `def findWords(matrix, words):
    if not matrix: return []
    m, n = len(matrix), len(matrix[0])
    result = set()
    trie = {}
    for w in words:
        node = trie
        for c in w: node = node.setdefault(c, {})
        node['#'] = True
    def dfs(i, j, node, path):
        if '#' in node: result.add(path)
        if i<0 or i>=m or j<0 or j>=n: return
        c = matrix[i][j]
        if c not in node: return
        matrix[i][j] = '.'
        for di,dj in [(0,1),(0,-1),(1,0),(-1,0)]:
            dfs(i+di, j+dj, node[c], path+c)
        matrix[i][j] = c
    for i in range(m):
        for j in range(n):
            dfs(i, j, trie, '')
    return sorted(list(result))`,
};

async function main() {
    console.log('Applying round 2 fixes...\n');
    let fixed = 0, errors = 0;
    for (const [idStr, solution] of Object.entries(fixes)) {
        const id = parseInt(idStr);
        const { data: problem } = await sb.from('problems')
            .select('id, title, solution_code').eq('id', id).single();
        if (!problem) { console.log(`  ⚠️  ID ${id}: not found`); continue; }
        const existing = problem.solution_code || {};
        existing.python = solution;
        const { error } = await sb.from('problems')
            .update({ solution_code: existing }).eq('id', id);
        if (error) { console.log(`  ❌ [${id}] ${problem.title}: ${error.message}`); errors++; }
        else { console.log(`  ✅ [${id}] ${problem.title}`); fixed++; }
    }
    console.log(`\nDone! Fixed: ${fixed}, Errors: ${errors}`);
}
main().catch(console.error);
