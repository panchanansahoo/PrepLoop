// ─── DSA Code Templates ───
// Algorithm skeletons, data structure boilerplate, and utility snippets
// for Python, JavaScript, C, C++, Java

export const LANGUAGES = [
  { id: 'python', label: 'Python', monacoId: 'python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript', icon: '⚡' },
  { id: 'c', label: 'C', monacoId: 'c', icon: '🧩' },
  { id: 'cpp', label: 'C++', monacoId: 'cpp', icon: '⚙️' },
  { id: 'java', label: 'Java', monacoId: 'java', icon: '☕' },
];

export const ALGORITHM_TEMPLATES = {
  bfs: {
    name: 'BFS (Breadth-First Search)',
    category: 'Graph',
    icon: '🌊',
    complexity: { time: 'O(V+E)', space: 'O(V)' },
    templates: {
      python: `from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return result`,
      javascript: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}`,
      cpp: `#include <vector>
#include <queue>
#include <unordered_set>
using namespace std;

vector<int> bfs(vector<vector<int>>& graph, int start) {
    unordered_set<int> visited;
    queue<int> q;
    vector<int> result;

    visited.insert(start);
    q.push(start);

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        result.push_back(node);

        for (int neighbor : graph[node]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }

    return result;
}`,
      java: `import java.util.*;

public class Solution {
    public List<Integer> bfs(Map<Integer, List<Integer>> graph, int start) {
        Set<Integer> visited = new HashSet<>();
        Queue<Integer> queue = new LinkedList<>();
        List<Integer> result = new ArrayList<>();

        visited.add(start);
        queue.add(start);

        while (!queue.isEmpty()) {
            int node = queue.poll();
            result.add(node);

            for (int neighbor : graph.getOrDefault(node, List.of())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }

        return result;
    }
}`,
      go: `func bfs(graph map[int][]int, start int) []int {
    visited := map[int]bool{start: true}
    queue := []int{start}
    result := []int{}

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        result = append(result, node)

        for _, neighbor := range graph[node] {
            if !visited[neighbor] {
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
    }

    return result
}`,
    },
  },

  dfs: {
    name: 'DFS (Depth-First Search)',
    category: 'Graph',
    icon: '🏊',
    complexity: { time: 'O(V+E)', space: 'O(V)' },
    templates: {
      python: `def dfs(graph, start):
    visited = set()
    result = []

    def helper(node):
        visited.add(node)
        result.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                helper(neighbor)

    helper(start)
    return result`,
      javascript: `function dfs(graph, start) {
  const visited = new Set();
  const result = [];

  function helper(node) {
    visited.add(node);
    result.push(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        helper(neighbor);
      }
    }
  }

  helper(start);
  return result;
}`,
      cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
    void helper(vector<vector<int>>& graph, int node,
                unordered_set<int>& visited, vector<int>& result) {
        visited.insert(node);
        result.push_back(node);
        for (int neighbor : graph[node]) {
            if (visited.find(neighbor) == visited.end()) {
                helper(graph, neighbor, visited, result);
            }
        }
    }
public:
    vector<int> dfs(vector<vector<int>>& graph, int start) {
        unordered_set<int> visited;
        vector<int> result;
        helper(graph, start, visited, result);
        return result;
    }
};`,
      java: `import java.util.*;

public class Solution {
    private void helper(Map<Integer, List<Integer>> graph, int node,
                        Set<Integer> visited, List<Integer> result) {
        visited.add(node);
        result.add(node);
        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                helper(graph, neighbor, visited, result);
            }
        }
    }

    public List<Integer> dfs(Map<Integer, List<Integer>> graph, int start) {
        Set<Integer> visited = new HashSet<>();
        List<Integer> result = new ArrayList<>();
        helper(graph, start, visited, result);
        return result;
    }
}`,
      go: `func dfs(graph map[int][]int, start int) []int {
    visited := map[int]bool{}
    result := []int{}

    var helper func(int)
    helper = func(node int) {
        visited[node] = true
        result = append(result, node)
        for _, neighbor := range graph[node] {
            if !visited[neighbor] {
                helper(neighbor)
            }
        }
    }

    helper(start)
    return result
}`,
    },
  },

  binarySearch: {
    name: 'Binary Search',
    category: 'Searching',
    icon: '🔍',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    templates: {
      python: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1  # Target not found`,
      javascript: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1; // Target not found
}`,
      cpp: `int binarySearch(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1; // Target not found
}`,
      java: `public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1; // Target not found
}`,
      go: `func binarySearch(nums []int, target int) int {
    left, right := 0, len(nums)-1

    for left <= right {
        mid := left + (right-left)/2

        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }

    return -1 // Target not found
}`,
    },
  },

  slidingWindow: {
    name: 'Sliding Window',
    category: 'Array',
    icon: '🪟',
    complexity: { time: 'O(n)', space: 'O(k)' },
    templates: {
      python: `def sliding_window(nums, k):
    """Find maximum sum subarray of size k"""
    n = len(nums)
    if n < k:
        return -1

    window_sum = sum(nums[:k])
    max_sum = window_sum

    for i in range(k, n):
        window_sum += nums[i] - nums[i - k]
        max_sum = max(max_sum, window_sum)

    return max_sum`,
      javascript: `function slidingWindow(nums, k) {
  // Find maximum sum subarray of size k
  if (nums.length < k) return -1;

  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }

  let maxSum = windowSum;

  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}`,
      cpp: `int slidingWindow(vector<int>& nums, int k) {
    int n = nums.size();
    if (n < k) return -1;

    int windowSum = 0;
    for (int i = 0; i < k; i++)
        windowSum += nums[i];

    int maxSum = windowSum;

    for (int i = k; i < n; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = max(maxSum, windowSum);
    }

    return maxSum;
}`,
      java: `public int slidingWindow(int[] nums, int k) {
    int n = nums.length;
    if (n < k) return -1;

    int windowSum = 0;
    for (int i = 0; i < k; i++)
        windowSum += nums[i];

    int maxSum = windowSum;

    for (int i = k; i < n; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }

    return maxSum;
}`,
      go: `func slidingWindow(nums []int, k int) int {
    n := len(nums)
    if n < k {
        return -1
    }

    windowSum := 0
    for i := 0; i < k; i++ {
        windowSum += nums[i]
    }

    maxSum := windowSum

    for i := k; i < n; i++ {
        windowSum += nums[i] - nums[i-k]
        if windowSum > maxSum {
            maxSum = windowSum
        }
    }

    return maxSum
}`,
    },
  },

  twoPointers: {
    name: 'Two Pointers',
    category: 'Array',
    icon: '👆',
    complexity: { time: 'O(n)', space: 'O(1)' },
    templates: {
      python: `def two_pointers(nums, target):
    """Find two numbers that sum to target in sorted array"""
    left, right = 0, len(nums) - 1

    while left < right:
        current_sum = nums[left] + nums[right]

        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1

    return [-1, -1]  # No pair found`,
      javascript: `function twoPointers(nums, target) {
  // Find two numbers that sum to target in sorted array
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }

  return [-1, -1]; // No pair found
}`,
      cpp: `vector<int> twoPointers(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;

    while (left < right) {
        int sum = nums[left] + nums[right];

        if (sum == target) {
            return {left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return {-1, -1}; // No pair found
}`,
      java: `public int[] twoPointers(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int sum = nums[left] + nums[right];

        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return new int[]{-1, -1}; // No pair found
}`,
      go: `func twoPointers(nums []int, target int) []int {
    left, right := 0, len(nums)-1

    for left < right {
        sum := nums[left] + nums[right]

        if sum == target {
            return []int{left, right}
        } else if sum < target {
            left++
        } else {
            right--
        }
    }

    return []int{-1, -1} // No pair found
}`,
    },
  },

  dp: {
    name: 'Dynamic Programming',
    category: 'DP',
    icon: '🧬',
    complexity: { time: 'O(n)', space: 'O(n)' },
    templates: {
      python: `def dp_solution(nums):
    """Dynamic Programming template - bottom-up"""
    n = len(nums)
    if n == 0:
        return 0

    # Initialize DP table
    dp = [0] * n
    dp[0] = nums[0]

    for i in range(1, n):
        # Recurrence relation: modify as needed
        dp[i] = max(dp[i-1] + nums[i], nums[i])

    return max(dp)`,
      javascript: `function dpSolution(nums) {
  // Dynamic Programming template - bottom-up
  const n = nums.length;
  if (n === 0) return 0;

  // Initialize DP table
  const dp = new Array(n).fill(0);
  dp[0] = nums[0];

  for (let i = 1; i < n; i++) {
    // Recurrence relation: modify as needed
    dp[i] = Math.max(dp[i - 1] + nums[i], nums[i]);
  }

  return Math.max(...dp);
}`,
      cpp: `int dpSolution(vector<int>& nums) {
    int n = nums.size();
    if (n == 0) return 0;

    // Initialize DP table
    vector<int> dp(n, 0);
    dp[0] = nums[0];

    for (int i = 1; i < n; i++) {
        // Recurrence relation: modify as needed
        dp[i] = max(dp[i-1] + nums[i], nums[i]);
    }

    return *max_element(dp.begin(), dp.end());
}`,
      java: `public int dpSolution(int[] nums) {
    int n = nums.length;
    if (n == 0) return 0;

    // Initialize DP table
    int[] dp = new int[n];
    dp[0] = nums[0];

    for (int i = 1; i < n; i++) {
        // Recurrence relation: modify as needed
        dp[i] = Math.max(dp[i-1] + nums[i], nums[i]);
    }

    int result = dp[0];
    for (int val : dp) result = Math.max(result, val);
    return result;
}`,
      go: `func dpSolution(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }

    // Initialize DP table
    dp := make([]int, n)
    dp[0] = nums[0]

    for i := 1; i < n; i++ {
        // Recurrence relation: modify as needed
        if dp[i-1]+nums[i] > nums[i] {
            dp[i] = dp[i-1] + nums[i]
        } else {
            dp[i] = nums[i]
        }
    }

    result := dp[0]
    for _, v := range dp {
        if v > result {
            result = v
        }
    }
    return result
}`,
    },
  },

  backtracking: {
    name: 'Backtracking',
    category: 'Recursion',
    icon: '🔄',
    complexity: { time: 'O(2^n)', space: 'O(n)' },
    templates: {
      python: `def backtrack(nums):
    """Generate all subsets using backtracking"""
    result = []

    def helper(start, current):
        result.append(current[:])  # Add copy of current subset

        for i in range(start, len(nums)):
            current.append(nums[i])     # Choose
            helper(i + 1, current)      # Explore
            current.pop()               # Un-choose (backtrack)

    helper(0, [])
    return result`,
      javascript: `function backtrack(nums) {
  // Generate all subsets using backtracking
  const result = [];

  function helper(start, current) {
    result.push([...current]); // Add copy

    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);    // Choose
      helper(i + 1, current);   // Explore
      current.pop();            // Un-choose
    }
  }

  helper(0, []);
  return result;
}`,
      cpp: `class Solution {
    void helper(vector<int>& nums, int start,
                vector<int>& current, vector<vector<int>>& result) {
        result.push_back(current);

        for (int i = start; i < nums.size(); i++) {
            current.push_back(nums[i]);
            helper(nums, i + 1, current, result);
            current.pop_back();
        }
    }
public:
    vector<vector<int>> backtrack(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> current;
        helper(nums, 0, current, result);
        return result;
    }
};`,
      java: `public class Solution {
    private void helper(int[] nums, int start,
                        List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));

        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);
            helper(nums, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    public List<List<Integer>> backtrack(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        helper(nums, 0, new ArrayList<>(), result);
        return result;
    }
}`,
      go: `func backtrack(nums []int) [][]int {
    result := [][]int{}

    var helper func(start int, current []int)
    helper = func(start int, current []int) {
        tmp := make([]int, len(current))
        copy(tmp, current)
        result = append(result, tmp)

        for i := start; i < len(nums); i++ {
            current = append(current, nums[i])
            helper(i+1, current)
            current = current[:len(current)-1]
        }
    }

    helper(0, []int{})
    return result
}`,
    },
  },

  topologicalSort: {
    name: 'Topological Sort',
    category: 'Graph',
    icon: '📐',
    complexity: { time: 'O(V+E)', space: 'O(V)' },
    templates: {
      python: `from collections import deque, defaultdict

def topological_sort(num_courses, prerequisites):
    """Kahn's algorithm for topological sort"""
    graph = defaultdict(list)
    in_degree = [0] * num_courses

    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1

    queue = deque([i for i in range(num_courses) if in_degree[i] == 0])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == num_courses else []`,
      javascript: `function topologicalSort(numCourses, prerequisites) {
  // Kahn's algorithm
  const graph = new Map();
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    if (!graph.has(prereq)) graph.set(prereq, []);
    graph.get(prereq).push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);

    for (const neighbor of (graph.get(node) || [])) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return order.length === numCourses ? order : [];
}`,
      cpp: `vector<int> topologicalSort(int numCourses, vector<vector<int>>& prerequisites) {
    vector<vector<int>> graph(numCourses);
    vector<int> inDegree(numCourses, 0);

    for (auto& p : prerequisites) {
        graph[p[1]].push_back(p[0]);
        inDegree[p[0]]++;
    }

    queue<int> q;
    for (int i = 0; i < numCourses; i++)
        if (inDegree[i] == 0) q.push(i);

    vector<int> order;
    while (!q.empty()) {
        int node = q.front(); q.pop();
        order.push_back(node);
        for (int neighbor : graph[node]) {
            if (--inDegree[neighbor] == 0) q.push(neighbor);
        }
    }

    return order.size() == numCourses ? order : vector<int>();
}`,
      java: `public int[] topologicalSort(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    for (int[] p : prerequisites) {
        graph.get(p[1]).add(p[0]);
        inDegree[p[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++)
        if (inDegree[i] == 0) queue.add(i);

    int[] order = new int[numCourses];
    int idx = 0;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order[idx++] = node;
        for (int neighbor : graph.get(node)) {
            if (--inDegree[neighbor] == 0) queue.add(neighbor);
        }
    }

    return idx == numCourses ? order : new int[0];
}`,
      go: `func topologicalSort(numCourses int, prerequisites [][]int) []int {
    graph := make([][]int, numCourses)
    inDegree := make([]int, numCourses)

    for _, p := range prerequisites {
        graph[p[1]] = append(graph[p[1]], p[0])
        inDegree[p[0]]++
    }

    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }

    order := []int{}
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        order = append(order, node)
        for _, neighbor := range graph[node] {
            inDegree[neighbor]--
            if inDegree[neighbor] == 0 {
                queue = append(queue, neighbor)
            }
        }
    }

    if len(order) == numCourses {
        return order
    }
    return []int{}
}`,
    },
  },

  dijkstra: {
    name: "Dijkstra's Shortest Path",
    category: 'Graph',
    icon: '🛤️',
    complexity: { time: 'O((V+E)logV)', space: 'O(V)' },
    templates: {
      python: `import heapq

def dijkstra(graph, start):
    """Shortest path from start to all nodes"""
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]  # (distance, node)

    while pq:
        curr_dist, node = heapq.heappop(pq)

        if curr_dist > distances[node]:
            continue

        for neighbor, weight in graph[node]:
            distance = curr_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))

    return distances`,
      javascript: `function dijkstra(graph, start) {
  const distances = {};
  for (const node in graph) distances[node] = Infinity;
  distances[start] = 0;

  // Simple priority queue using array
  const pq = [[0, start]]; // [distance, node]

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [currDist, node] = pq.shift();

    if (currDist > distances[node]) continue;

    for (const [neighbor, weight] of (graph[node] || [])) {
      const distance = currDist + weight;
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        pq.push([distance, neighbor]);
      }
    }
  }

  return distances;
}`,
      cpp: `vector<int> dijkstra(vector<vector<pair<int,int>>>& graph, int start) {
    int n = graph.size();
    vector<int> dist(n, INT_MAX);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;

        for (auto& [v, w] : graph[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    return dist;
}`,
      java: `public int[] dijkstra(List<int[]>[] graph, int start) {
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, start});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;

        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }

    return dist;
}`,
      go: `import "container/heap"

type Item struct{ dist, node int }
type PQ []Item
func (pq PQ) Len() int            { return len(pq) }
func (pq PQ) Less(i, j int) bool  { return pq[i].dist < pq[j].dist }
func (pq PQ) Swap(i, j int)       { pq[i], pq[j] = pq[j], pq[i] }
func (pq *PQ) Push(x interface{}) { *pq = append(*pq, x.(Item)) }
func (pq *PQ) Pop() interface{} {
    old := *pq; item := old[len(old)-1]; *pq = old[:len(old)-1]; return item
}

func dijkstra(graph [][][2]int, start int) []int {
    n := len(graph)
    dist := make([]int, n)
    for i := range dist { dist[i] = 1<<31 - 1 }
    dist[start] = 0

    pq := &PQ{{0, start}}
    heap.Init(pq)

    for pq.Len() > 0 {
        curr := heap.Pop(pq).(Item)
        if curr.dist > dist[curr.node] { continue }

        for _, edge := range graph[curr.node] {
            v, w := edge[0], edge[1]
            if dist[curr.node]+w < dist[v] {
                dist[v] = dist[curr.node] + w
                heap.Push(pq, Item{dist[v], v})
            }
        }
    }

    return dist
}`,
    },
  },

  unionFind: {
    name: 'Union Find',
    category: 'Graph',
    icon: '🔗',
    complexity: { time: 'O(α(n))', space: 'O(n)' },
    templates: {
      python: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # Path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False

        # Union by rank
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)`,
      javascript: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    let px = this.find(x), py = this.find(y);
    if (px === py) return false;

    if (this.rank[px] < this.rank[py]) [px, py] = [py, px];
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py]) this.rank[px]++;
    this.components--;
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}`,
      cpp: `class UnionFind {
    vector<int> parent, rank_;
    int components;
public:
    UnionFind(int n) : parent(n), rank_(n, 0), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;

        if (rank_[px] < rank_[py]) swap(px, py);
        parent[py] = px;
        if (rank_[px] == rank_[py]) rank_[px]++;
        components--;
        return true;
    }

    bool connected(int x, int y) { return find(x) == find(y); }
    int count() { return components; }
};`,
      java: `class UnionFind {
    private int[] parent, rank;
    private int components;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;

        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        components--;
        return true;
    }

    public boolean connected(int x, int y) { return find(x) == find(y); }
    public int count() { return components; }
}`,
      go: `type UnionFind struct {
    parent []int
    rank   []int
    count  int
}

func NewUnionFind(n int) *UnionFind {
    parent := make([]int, n)
    for i := range parent { parent[i] = i }
    return &UnionFind{parent, make([]int, n), n}
}

func (uf *UnionFind) Find(x int) int {
    if uf.parent[x] != x {
        uf.parent[x] = uf.Find(uf.parent[x])
    }
    return uf.parent[x]
}

func (uf *UnionFind) Union(x, y int) bool {
    px, py := uf.Find(x), uf.Find(y)
    if px == py { return false }

    if uf.rank[px] < uf.rank[py] { px, py = py, px }
    uf.parent[py] = px
    if uf.rank[px] == uf.rank[py] { uf.rank[px]++ }
    uf.count--
    return true
}`,
    },
  },
};

// ─── Data Structure Boilerplate ───
export const DATA_STRUCTURE_TEMPLATES = {
  treeNode: {
    name: 'TreeNode (Binary Tree)',
    icon: '🌳',
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`,
      javascript: `class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}`,
      cpp: `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`,
      java: `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}`,
      go: `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}`,
    },
  },

  listNode: {
    name: 'ListNode (Linked List)',
    icon: '🔗',
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`,
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`,
      go: `type ListNode struct {
    Val  int
    Next *ListNode
}`,
    },
  },

  trie: {
    name: 'Trie (Prefix Tree)',
    icon: '🌿',
    templates: {
      python: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end

    def starts_with(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`,
      javascript: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEnd;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return true;
  }
}`,
      cpp: `class Trie {
    struct TrieNode {
        unordered_map<char, TrieNode*> children;
        bool isEnd = false;
    };
    TrieNode* root;
public:
    Trie() : root(new TrieNode()) {}

    void insert(string word) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children.count(c)) node->children[c] = new TrieNode();
            node = node->children[c];
        }
        node->isEnd = true;
    }

    bool search(string word) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return node->isEnd;
    }

    bool startsWith(string prefix) {
        TrieNode* node = root;
        for (char c : prefix) {
            if (!node->children.count(c)) return false;
            node = node->children[c];
        }
        return true;
    }
};`,
      java: `class Trie {
    private class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEnd = false;
    }

    private TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            node.children.putIfAbsent(c, new TrieNode());
            node = node.children.get(c);
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            if (!node.children.containsKey(c)) return false;
            node = node.children.get(c);
        }
        return node.isEnd;
    }

    public boolean startsWith(String prefix) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            if (!node.children.containsKey(c)) return false;
            node = node.children.get(c);
        }
        return true;
    }
}`,
      go: `type TrieNode struct {
    Children map[byte]*TrieNode
    IsEnd    bool
}

type Trie struct {
    Root *TrieNode
}

func NewTrie() *Trie {
    return &Trie{&TrieNode{Children: map[byte]*TrieNode{}}}
}

func (t *Trie) Insert(word string) {
    node := t.Root
    for i := 0; i < len(word); i++ {
        if _, ok := node.Children[word[i]]; !ok {
            node.Children[word[i]] = &TrieNode{Children: map[byte]*TrieNode{}}
        }
        node = node.Children[word[i]]
    }
    node.IsEnd = true
}`,
    },
  },

  minHeap: {
    name: 'Min Heap',
    icon: '⛰️',
    templates: {
      python: `import heapq

# Python heapq is a min-heap by default
heap = []
heapq.heappush(heap, value)      # Insert
smallest = heapq.heappop(heap)    # Remove min
peek = heap[0]                     # Peek min

# For max-heap, negate values:
heapq.heappush(heap, -value)
largest = -heapq.heappop(heap)`,
      javascript: `class MinHeap {
  constructor() { this.heap = []; }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  peek() { return this.heap[0]; }
  size() { return this.heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l] < this.heap[smallest]) smallest = l;
      if (r < n && this.heap[r] < this.heap[smallest]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}`,
      cpp: `// C++ STL priority_queue is max-heap by default
// For min-heap:
priority_queue<int, vector<int>, greater<int>> minHeap;

minHeap.push(value);        // Insert
int smallest = minHeap.top(); // Peek
minHeap.pop();               // Remove min`,
      java: `// Java PriorityQueue is min-heap by default
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

minHeap.offer(value);           // Insert
int smallest = minHeap.peek();  // Peek
int removed = minHeap.poll();   // Remove min

// For max-heap:
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());`,
      go: `import "container/heap"

type IntHeap []int
func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() interface{} {
    old := *h; n := len(old); x := old[n-1]; *h = old[:n-1]; return x
}

// Usage:
// h := &IntHeap{}
// heap.Init(h)
// heap.Push(h, value)
// smallest := heap.Pop(h).(int)`,
    },
  },
};

// ─── All templates grouped for dropdown ───
export const ALL_TEMPLATES = [
  { group: 'Algorithm Patterns', items: Object.entries(ALGORITHM_TEMPLATES).map(([k, v]) => ({ id: k, ...v })) },
  { group: 'Data Structures', items: Object.entries(DATA_STRUCTURE_TEMPLATES).map(([k, v]) => ({ id: k, ...v })) },
];

// ─── Pattern recognition keywords ───
export const PATTERN_HINTS = {
  'sliding window': { name: 'Sliding Window', templateId: 'slidingWindow', keywords: ['subarray', 'substring', 'window', 'consecutive', 'contiguous'] },
  'two pointers': { name: 'Two Pointers', templateId: 'twoPointers', keywords: ['sorted', 'pair', 'sum', 'palindrome', 'reverse'] },
  'binary search': { name: 'Binary Search', templateId: 'binarySearch', keywords: ['sorted', 'search', 'find', 'position', 'minimum', 'maximum', 'rotated'] },
  'bfs': { name: 'BFS', templateId: 'bfs', keywords: ['shortest path', 'level', 'layer', 'breadth', 'tree level', 'connected'] },
  'dfs': { name: 'DFS', templateId: 'dfs', keywords: ['path', 'cycle', 'connected', 'islands', 'depth', 'traversal', 'permutations'] },
  'dynamic programming': { name: 'Dynamic Programming', templateId: 'dp', keywords: ['optimize', 'maximum', 'minimum', 'count ways', 'combinations', 'subsequence'] },
  'backtracking': { name: 'Backtracking', templateId: 'backtracking', keywords: ['permutation', 'combination', 'subset', 'generate', 'all possible', 'n-queens'] },
  'topological sort': { name: 'Topological Sort', templateId: 'topologicalSort', keywords: ['prerequisite', 'dependency', 'ordering', 'course', 'schedule'] },
  'union find': { name: 'Union Find', templateId: 'unionFind', keywords: ['connected', 'components', 'redundant', 'groups', 'merge'] },
  'greedy': { name: 'Greedy', templateId: null, keywords: ['interval', 'schedule', 'overlap', 'merge', 'local optimal'] },
};
