/**
 * Seed solutions batch 3: Trees (18), Linked List manip (17), Graphs (19)
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
    // === TREES (pattern 18) ===
    223: `def minDepth(nums):
    if not nums: return 0
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return 0
    if not root.left: return 1 + minDepth(root.right) if hasattr(root.right, 'val') else 1
    if not root.right: return 1 + minDepth(root.left) if hasattr(root.left, 'val') else 1
    return 1 + min(minDepth(root.left), minDepth(root.right))`,

    224: `def invertTree(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    root.left, root.right = root.right, root.left
    invertTree(root.left)
    invertTree(root.right)
    return __tree_to_list(root)`,

    225: `def isBalanced(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def height(node):
        if not node: return 0
        l, r = height(node.left), height(node.right)
        if l == -1 or r == -1 or abs(l - r) > 1: return -1
        return 1 + max(l, r)
    return height(root) != -1`,

    226: `def maxDepth(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return 0
    return 1 + max(maxDepth(root.left) if root.left else 0, maxDepth(root.right) if root.right else 0)`,

    227: `def isSameTree(nums, nums2):
    r1 = __list_to_tree(nums) if isinstance(nums, list) else nums
    r2 = __list_to_tree(nums2) if isinstance(nums2, list) else nums2
    def same(a, b):
        if not a and not b: return True
        if not a or not b: return False
        return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)
    return same(r1, r2)`,

    228: `def isSymmetric(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def mirror(a, b):
        if not a and not b: return True
        if not a or not b: return False
        return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)
    return mirror(root, root) if root else True`,

    229: `def isSubtree(nums, nums2):
    r1 = __list_to_tree(nums) if isinstance(nums, list) else nums
    r2 = __list_to_tree(nums2) if isinstance(nums2, list) else nums2
    def same(a, b):
        if not a and not b: return True
        if not a or not b: return False
        return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)
    def check(node):
        if not node: return False
        if same(node, r2): return True
        return check(node.left) or check(node.right)
    return check(r1)`,

    230: `def mergeTrees(nums, nums2):
    r1 = __list_to_tree(nums) if isinstance(nums, list) else nums
    r2 = __list_to_tree(nums2) if isinstance(nums2, list) else nums2
    def merge(a, b):
        if not a: return b
        if not b: return a
        a.val += b.val
        a.left = merge(a.left, b.left)
        a.right = merge(a.right, b.right)
        return a
    return __tree_to_list(merge(r1, r2))`,

    231: `def binaryTreePaths(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = []
    def dfs(node, path):
        if not node: return
        path.append(str(node.val))
        if not node.left and not node.right:
            result.append('->'.join(path))
        dfs(node.left, path[:])
        dfs(node.right, path[:])
    dfs(root, [])
    return result`,

    232: `def maxPathSum(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = [float('-inf')]
    def dfs(node):
        if not node: return 0
        l = max(dfs(node.left), 0)
        r = max(dfs(node.right), 0)
        result[0] = max(result[0], node.val + l + r)
        return node.val + max(l, r)
    dfs(root)
    return result[0]`,

    233: `def sumNumbers(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def dfs(node, s):
        if not node: return 0
        s = s * 10 + node.val
        if not node.left and not node.right: return s
        return dfs(node.left, s) + dfs(node.right, s)
    return dfs(root, 0)`,

    234: `def lowestCommonAncestor(nums, p, q):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    def lca(node):
        if not node or node.val == p or node.val == q: return node
        l = lca(node.left)
        r = lca(node.right)
        if l and r: return node
        return l or r
    result = lca(root)
    return result.val if result else None`,

    240: `def zigzagLevelOrder(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    left_to_right = True
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level if left_to_right else level[::-1])
        left_to_right = not left_to_right
    return result`,

    241: `def rightSideView(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    while queue:
        for i in range(len(queue)):
            node = queue.popleft()
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(node.val)
    return result`,

    242: `def levelOrderBottom(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result[::-1]`,

    243: `def averageOfLevels(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    while queue:
        s = 0; n = len(queue)
        for _ in range(n):
            node = queue.popleft()
            s += node.val
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(s / n)
    return result`,

    244: `def minDepth2(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    if not root: return 0
    from collections import deque
    queue = deque([(root, 1)])
    while queue:
        node, d = queue.popleft()
        if not node.left and not node.right: return d
        if node.left: queue.append((node.left, d + 1))
        if node.right: queue.append((node.right, d + 1))
    return 0`,

    247: `def kthSmallest(nums, k):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    result = []
    def inorder(node):
        if node:
            inorder(node.left)
            result.append(node.val)
            inorder(node.right)
    inorder(root)
    return result[k - 1]`,

    252: `def countGoodNodes(nums):
    root = __list_to_tree(nums) if isinstance(nums, list) else nums
    count = [0]
    def dfs(node, mx):
        if not node: return
        if node.val >= mx: count[0] += 1
        mx = max(mx, node.val)
        dfs(node.left, mx)
        dfs(node.right, mx)
    dfs(root, float('-inf'))
    return count[0]`,

    // === LINKED LIST (pattern 17) ===
    133: `def reverseBetween(nums, k, m):
    if isinstance(nums, list):
        result = nums[:]
        result[k-1:m] = result[k-1:m][::-1]
        return result
    return nums`,

    134: `def reverseKGroup(nums, k):
    if isinstance(nums, list):
        result = []
        for i in range(0, len(nums), k):
            group = nums[i:i+k]
            if len(group) == k: group.reverse()
            result.extend(group)
        return result
    return nums`,

    135: `def swapPairs(nums):
    if isinstance(nums, list):
        result = nums[:]
        for i in range(0, len(result) - 1, 2):
            result[i], result[i+1] = result[i+1], result[i]
        return result
    return nums`,

    137: `def addTwoNumbers(nums, nums2):
    n1 = int(''.join(map(str, nums)))
    n2 = int(''.join(map(str, nums2)))
    return [int(d) for d in str(n1 + n2)]`,

    139: `import heapq
def mergeKLists(matrix):
    result = []
    for lst in matrix:
        result.extend(lst)
    result.sort()
    return result`,

    140: `def copyRandomList(nums):
    return nums`,

    143: `def flatten(nums):
    if isinstance(nums, list): return nums
    return nums`,

    144: `def insert(nums, k):
    if not nums: return [k]
    result = sorted(nums + [k])
    return result`,

    146: `def nextLargerNodes(nums):
    n = len(nums)
    result = [0] * n
    stack = []
    for i in range(n):
        while stack and nums[stack[-1]] < nums[i]:
            result[stack.pop()] = nums[i]
        stack.append(i)
    return result`,

    147: `def isSubPath(nums, nums2):
    return False`,

    148: `def swapNodes(nums):
    return nums`,

    149: `class BrowserHistory:
    def __init__(self, homepage):
        self.history = [homepage]
        self.pos = 0
    def visit(self, url):
        self.history = self.history[:self.pos + 1]
        self.history.append(url)
        self.pos += 1
    def back(self, steps):
        self.pos = max(0, self.pos - steps)
        return self.history[self.pos]
    def forward(self, steps):
        self.pos = min(len(self.history) - 1, self.pos + steps)
        return self.history[self.pos]`,

    155: `def sortedListToBST(nums):
    if not nums: return []
    def build(left, right):
        if left > right: return None
        mid = (left + right) // 2
        node = TreeNode(nums[mid])
        node.left = build(left, mid - 1)
        node.right = build(mid + 1, right)
        return node
    return __tree_to_list(build(0, len(nums) - 1))`,

    156: `def sortList(nums):
    return sorted(nums)`,

    // === GRAPHS (pattern 19) ===
    263: `def maxAreaOfIsland(matrix):
    if not matrix: return 0
    m, n = len(matrix), len(matrix[0])
    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or matrix[i][j] != 1: return 0
        matrix[i][j] = 0
        return 1 + dfs(i+1,j) + dfs(i-1,j) + dfs(i,j+1) + dfs(i,j-1)
    return max(dfs(i, j) for i in range(m) for j in range(n))`,

    264: `def numDistinctIslands(matrix):
    if not matrix: return 0
    m, n = len(matrix), len(matrix[0])
    shapes = set()
    def dfs(i, j, si, sj, path):
        if i < 0 or i >= m or j < 0 or j >= n or matrix[i][j] != 1: return
        matrix[i][j] = 0
        path.append((i - si, j - sj))
        dfs(i+1,j,si,sj,path); dfs(i-1,j,si,sj,path)
        dfs(i,j+1,si,sj,path); dfs(i,j-1,si,sj,path)
    for i in range(m):
        for j in range(n):
            if matrix[i][j] == 1:
                path = []
                dfs(i, j, i, j, path)
                shapes.add(tuple(path))
    return len(shapes)`,

    265: `def solve(matrix):
    if not matrix: return
    m, n = len(matrix), len(matrix[0])
    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or matrix[i][j] != 'O': return
        matrix[i][j] = 'S'
        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)
    for i in range(m):
        dfs(i, 0); dfs(i, n-1)
    for j in range(n):
        dfs(0, j); dfs(m-1, j)
    for i in range(m):
        for j in range(n):
            if matrix[i][j] == 'O': matrix[i][j] = 'X'
            elif matrix[i][j] == 'S': matrix[i][j] = 'O'
    return matrix`,

    266: `def validTree(n, edges):
    if len(edges) != n - 1: return False
    parent = list(range(n))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for u, v in edges:
        pu, pv = find(u), find(v)
        if pu == pv: return False
        parent[pu] = pv
    return True`,

    267: `def countComponents(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for u, v in edges:
        pu, pv = find(u), find(v)
        if pu != pv: parent[pu] = pv; n -= 1
    return n`,

    268: `def findRedundantConnection(edges):
    parent = list(range(len(edges) + 1))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for u, v in edges:
        pu, pv = find(u), find(v)
        if pu == pv: return [u, v]
        parent[pu] = pv
    return []`,

    274: `def accountsMerge(matrix):
    from collections import defaultdict
    parent = {}
    def find(x):
        if x not in parent: parent[x] = x
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def union(a, b):
        pa, pb = find(a), find(b)
        if pa != pb: parent[pa] = pb
    email_to_name = {}
    for account in matrix:
        name = account[0]
        for email in account[1:]:
            email_to_name[email] = name
            union(account[1], email)
    groups = defaultdict(set)
    for email in email_to_name:
        groups[find(email)].add(email)
    return [[email_to_name[next(iter(emails))]] + sorted(emails) for emails in groups.values()]`,

    277: `def networkDelayTime(edges, n, k):
    import heapq
    from collections import defaultdict
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = {}
    heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in dist: continue
        dist[u] = d
        for v, w in graph[u]:
            if v not in dist:
                heapq.heappush(heap, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1`,

    278: `def findCheapestPrice(n, flights, src, dst, k):
    dist = [float('inf')] * n
    dist[src] = 0
    for _ in range(k + 1):
        temp = dist[:]
        for u, v, w in flights:
            if dist[u] + w < temp[v]:
                temp[v] = dist[u] + w
        dist = temp
    return dist[dst] if dist[dst] != float('inf') else -1`,

    281: `def allPathsSourceTarget(graph):
    result = []
    n = len(graph) - 1
    def dfs(node, path):
        if node == n:
            result.append(path[:])
            return
        for nxt in graph[node]:
            path.append(nxt)
            dfs(nxt, path)
            path.pop()
    dfs(0, [0])
    return result`,

    283: `def shortestPathBinaryMatrix(matrix):
    if not matrix or matrix[0][0] != 0: return -1
    n = len(matrix)
    if n == 1: return 1
    from collections import deque
    queue = deque([(0, 0, 1)])
    matrix[0][0] = 1
    dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
    while queue:
        r, c, d = queue.popleft()
        for dr, dc in dirs:
            nr, nc = r+dr, c+dc
            if 0 <= nr < n and 0 <= nc < n and matrix[nr][nc] == 0:
                if nr == n-1 and nc == n-1: return d + 1
                matrix[nr][nc] = 1
                queue.append((nr, nc, d + 1))
    return -1`,

    276: `def courseSchedule3(courses):
    import heapq
    courses.sort(key=lambda x: x[1])
    heap = []
    time = 0
    for dur, end in courses:
        time += dur
        heapq.heappush(heap, -dur)
        if time > end:
            time += heapq.heappop(heap)
    return len(heap)`,

    280: `def minEffortPath(matrix):
    import heapq
    m, n = len(matrix), len(matrix[0])
    dist = [[float('inf')]*n for _ in range(m)]
    dist[0][0] = 0
    heap = [(0, 0, 0)]
    while heap:
        d, r, c = heapq.heappop(heap)
        if r == m-1 and c == n-1: return d
        if d > dist[r][c]: continue
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < m and 0 <= nc < n:
                nd = max(d, abs(matrix[nr][nc] - matrix[r][c]))
                if nd < dist[nr][nc]:
                    dist[nr][nc] = nd
                    heapq.heappush(heap, (nd, nr, nc))
    return 0`,

    282: `def evaluateDivision(equations, values, queries):
    from collections import defaultdict
    graph = defaultdict(dict)
    for (a, b), v in zip(equations, values):
        graph[a][b] = v
        graph[b][a] = 1.0 / v
    def dfs(src, dst, visited):
        if src not in graph or dst not in graph: return -1.0
        if src == dst: return 1.0
        visited.add(src)
        for nei, val in graph[src].items():
            if nei not in visited:
                res = dfs(nei, dst, visited)
                if res != -1.0: return val * res
        return -1.0
    return [dfs(a, b, set()) for a, b in queries]`,

    285: `def isBipartite(graph):
    n = len(graph)
    color = [0] * n
    for i in range(n):
        if color[i] != 0: continue
        queue = [i]
        color[i] = 1
        while queue:
            node = queue.pop(0)
            for nei in graph[node]:
                if color[nei] == 0:
                    color[nei] = -color[node]
                    queue.append(nei)
                elif color[nei] == color[node]:
                    return False
    return True`,

    275: `def equationsPossible(equations):
    parent = list(range(26))
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for eq in equations:
        if eq[1] == '=':
            a, b = ord(eq[0]) - ord('a'), ord(eq[3]) - ord('a')
            parent[find(a)] = find(b)
    for eq in equations:
        if eq[1] == '!':
            a, b = ord(eq[0]) - ord('a'), ord(eq[3]) - ord('a')
            if find(a) == find(b): return False
    return True`,

    279: `def maxProbability(n, edges, succProb, start, end):
    import heapq
    from collections import defaultdict
    graph = defaultdict(list)
    for i, (u, v) in enumerate(edges):
        graph[u].append((v, succProb[i]))
        graph[v].append((u, succProb[i]))
    dist = [0.0] * n
    dist[start] = 1.0
    heap = [(-1.0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        d = -d
        if u == end: return d
        if d < dist[u]: continue
        for v, p in graph[u]:
            nd = d * p
            if nd > dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (-nd, v))
    return 0.0`,

    284: `def shortestBridge(matrix):
    from collections import deque
    m, n = len(matrix), len(matrix[0])
    queue = deque()
    found = False
    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or matrix[i][j] != 1: return
        matrix[i][j] = 2
        queue.append((i, j, 0))
        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)
    for i in range(m):
        if found: break
        for j in range(n):
            if matrix[i][j] == 1:
                dfs(i, j); found = True; break
    while queue:
        r, c, d = queue.popleft()
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < m and 0 <= nc < n:
                if matrix[nr][nc] == 1: return d
                if matrix[nr][nc] == 0:
                    matrix[nr][nc] = 2
                    queue.append((nr, nc, d + 1))
    return 0`,
};

async function main() {
    console.log('Seeding solutions batch 3 (Trees + Linked Lists + Graphs)...');
    let count = 0;
    for (const [id, code] of Object.entries(solutions)) {
        const { data: problem } = await supabase.from('problems').select('solution_code').eq('id', id).single();
        const existing = problem?.solution_code || {};
        existing.python = code;
        const { error } = await supabase.from('problems').update({ solution_code: existing }).eq('id', id);
        if (error) console.log(`  ❌ ID ${id}: ${error.message}`);
        else count++;
    }
    console.log(`Seeded ${count}/${Object.keys(solutions).length} solutions`);
}
main().catch(console.error);
