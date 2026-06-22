// ═══════════════════════════════════════════════════
//  Algorithm Code Examples — shown in CodePanel
//  Each key matches an algorithm ID from ALGORITHMS
//  `code` = the source, `lineMap` maps step→highlighted line
// ═══════════════════════════════════════════════════

export const ALGORITHM_CODES = {
  'bubble-sort': {
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap adjacent elements
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
    // Pass complete: largest bubbled up
  }
  return arr; // Sorted!
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.swapping) return 7;
      if (step.comparing) return 5;
      if (step.message?.includes('Pass')) return 10;
      if (step.message?.includes('fully sorted')) return 12;
      return 3;
    }
  },

  'selection-sort': {
    code: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j; // New minimum found
      }
    }
    // Swap minimum to position i
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr; // Sorted!
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.swapping) return 11;
      if (step.message?.includes('New minimum')) return 7;
      if (step.comparing) return 6;
      if (step.message?.includes('fully sorted')) return 13;
      return 4;
    }
  },

  'insertion-sort': {
    code: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift right
      j--;
    }
    arr[j + 1] = key; // Insert at correct position
  }
  return arr; // Sorted!
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.comparing) return 6;
      if (step.message?.includes('Inserted')) return 9;
      if (step.message?.includes('Picking')) return 3;
      if (step.message?.includes('fully sorted')) return 11;
      return 2;
    }
  },

  'merge-sort': {
    code: `function mergeSort(arr, l, r) {
  if (l < r) {
    const mid = Math.floor((l + r) / 2);
    mergeSort(arr, l, mid);     // Sort left
    mergeSort(arr, mid + 1, r); // Sort right
    merge(arr, l, mid, r);      // Merge halves
  }
}
function merge(arr, l, m, r) {
  let left = arr.slice(l, m + 1);
  let right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  // Copy remaining elements
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Dividing')) return 3;
      if (step.message?.includes('Merging')) return 10;
      if (step.message?.includes('Merged result')) return 14;
      if (step.message?.includes('fully sorted')) return 6;
      return 1;
    }
  },

  'quick-sort': {
    code: `function quickSort(arr, lo, hi) {
  if (lo < hi) {
    let pi = partition(arr, lo, hi);
    quickSort(arr, lo, pi - 1);
    quickSort(arr, pi + 1, hi);
  }
}
function partition(arr, lo, hi) {
  let pivot = arr[hi]; // Choose last as pivot
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  return i + 1; // Pivot's final position
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Pivot selected')) return 9;
      if (step.swapping) return 14;
      if (step.comparing) return 12;
      if (step.message?.includes('placed at final')) return 17;
      if (step.message?.includes('fully sorted')) return 3;
      return 1;
    }
  },

  'binary-search': {
    code: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      lo = mid + 1; // Search right half
    } else {
      hi = mid - 1; // Search left half
    }
  }
  return -1; // Not found
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.found !== undefined) return 6;
      if (step.message?.includes('eliminate left')) return 8;
      if (step.message?.includes('eliminate right')) return 10;
      if (step.message?.includes('Mid =')) return 4;
      if (step.message?.includes('not found')) return 13;
      return 2;
    }
  },

  'linear-search': {
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found!
    }
    // Not a match, continue
  }
  return -1; // Not found
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.found !== undefined) return 4;
      if (step.message?.includes('moving on')) return 6;
      if (step.message?.includes('not found')) return 8;
      return 2;
    }
  },

  'bfs': {
    code: `function bfs(graph, start) {
  let visited = new Set();
  let queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    let node = queue.shift(); // Dequeue
    process(node);
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor); // Enqueue
      }
    }
  }
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Adding node')) return 11;
      if (step.exploring !== undefined) return 9;
      if (step.message?.includes('Visiting')) return 6;
      if (step.message?.includes('complete')) return 7;
      return 3;
    }
  },

  'dfs': {
    code: `function dfs(graph, node, visited) {
  visited.add(node);
  process(node);
  for (let neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited); // Go deeper
    }
  }
  // Backtrack
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Going deeper')) return 6;
      if (step.message?.includes('Backtracking')) return 9;
      if (step.message?.includes('Visiting')) return 3;
      if (step.message?.includes('complete')) return 2;
      return 1;
    }
  },

  'two-pointers': {
    code: `function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right]; // Found pair!
    } else if (sum < target) {
      left++;  // Need larger sum
    } else {
      right--; // Need smaller sum
    }
  }
  return [-1, -1]; // No pair found
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.found) return 6;
      if (step.message?.includes('Too small')) return 8;
      if (step.message?.includes('Too large')) return 10;
      if (step.message?.includes('Sum =')) return 4;
      if (step.message?.includes('No pair')) return 13;
      return 2;
    }
  },

  'sliding-window': {
    code: `function maxSumSubarray(arr, k) {
  let windowSum = 0;
  // Build first window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;
  // Slide the window
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Building')) return 4;
      if (step.message?.includes('Sliding')) return 10;
      if (step.message?.includes('New max')) return 11;
      if (step.message?.includes('Result')) return 13;
      return 2;
    }
  },

  'merge-intervals': {
    code: `function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    let last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      // Overlapping: extend end
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      // No overlap: add new interval
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Overlap')) return 8;
      if (step.message?.includes('No overlap')) return 11;
      if (step.message?.includes('Comparing')) return 6;
      if (step.message?.includes('Result')) return 14;
      return 2;
    }
  },

  'kadane': {
    code: `function maxSubarraySum(arr) {
  let maxSoFar = arr[0];
  let maxEndingHere = arr[0];
  for (let i = 1; i < arr.length; i++) {
    // Extend current or start new
    maxEndingHere = Math.max(
      arr[i], maxEndingHere + arr[i]
    );
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }
  return maxSoFar;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Extend')) return 6;
      if (step.message?.includes('Start new')) return 7;
      if (step.message?.includes('New global')) return 9;
      if (step.message?.includes('Result')) return 11;
      return 4;
    }
  },

  'prefix-sum': {
    code: `function buildPrefixSum(arr) {
  let prefix = [0];
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[i] + arr[i]);
  }
  return prefix;
}
// Range sum query: sum(l, r)
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('prefix[')) return 4;
      if (step.message?.includes('Range query')) return 10;
      if (step.message?.includes('Complete')) return 6;
      return 3;
    }
  },

  'monotonic-stack': {
    code: `function nextGreaterElement(arr) {
  let result = new Array(arr.length).fill(-1);
  let stack = []; // Monotonic decreasing
  for (let i = 0; i < arr.length; i++) {
    while (stack.length && arr[i] > arr[stack.at(-1)]) {
      let idx = stack.pop();
      result[idx] = arr[i]; // Found next greater
    }
    stack.push(i);
  }
  return result;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Found next greater')) return 7;
      if (step.message?.includes('Pop')) return 6;
      if (step.message?.includes('Push')) return 9;
      if (step.message?.includes('Complete')) return 11;
      return 5;
    }
  },

  'dp-fibonacci': {
    code: `function climbStairs(n) {
  if (n <= 2) return n;
  let dp = [0, 1, 2];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    // Ways to reach step i
  }
  return dp[n];
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('dp[')) return 5;
      if (step.message?.includes('Base')) return 3;
      if (step.message?.includes('Result')) return 8;
      return 4;
    }
  },

  'dp-knapsack': {
    code: `function knapsack(weights, values, W) {
  let n = weights.length;
  let dp = Array(n+1).fill(null)
    .map(() => Array(W+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i-1][w]; // Skip item
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(
          dp[i][w],
          dp[i-1][w-weights[i-1]] + values[i-1]
        ); // Include item
      }
    }
  }
  return dp[n][W];
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Include')) return 9;
      if (step.message?.includes('Skip')) return 7;
      if (step.message?.includes('Result')) return 17;
      return 6;
    }
  },

  'backtracking': {
    code: `function generateSubsets(nums) {
  let result = [];
  function backtrack(start, current) {
    result.push([...current]);
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]); // Choose
      backtrack(i + 1, current); // Explore
      current.pop();          // Un-choose
    }
  }
  backtrack(0, []);
  return result;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Choose')) return 6;
      if (step.message?.includes('Explore')) return 7;
      if (step.message?.includes('Un-choose') || step.message?.includes('Backtrack')) return 8;
      if (step.message?.includes('Record')) return 4;
      if (step.message?.includes('Complete')) return 12;
      return 3;
    }
  },

  'greedy': {
    code: `function activitySelection(start, end) {
  // Sort by end time
  let activities = start.map((s, i) => [s, end[i]])
    .sort((a, b) => a[1] - b[1]);
  let selected = [activities[0]];
  let lastEnd = activities[0][1];
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      selected.push(activities[i]);
      lastEnd = activities[i][1];
    }
  }
  return selected;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Select')) return 9;
      if (step.message?.includes('Skip') || step.message?.includes('Overlap')) return 8;
      if (step.message?.includes('Sort')) return 3;
      if (step.message?.includes('Result')) return 13;
      return 7;
    }
  },

  'union-find': {
    code: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]);
    return this.parent[x]; // Path compression
  }
  union(x, y) {
    let px = this.find(x), py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py])
      [px, py] = [py, px]; // Union by rank
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py])
      this.rank[px]++;
    return true;
  }
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Find')) return 7;
      if (step.message?.includes('Path compression')) return 8;
      if (step.message?.includes('Union')) return 16;
      if (step.message?.includes('Same set')) return 13;
      if (step.message?.includes('Init')) return 3;
      return 11;
    }
  },

  'topological-sort': {
    code: `function topologicalSort(graph, n) {
  let inDegree = new Array(n).fill(0);
  for (let u = 0; u < n; u++)
    for (let v of graph[u]) inDegree[v]++;
  let queue = [];
  for (let i = 0; i < n; i++)
    if (inDegree[i] === 0) queue.push(i);
  let order = [];
  while (queue.length > 0) {
    let node = queue.shift();
    order.push(node);
    for (let neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0)
        queue.push(neighbor);
    }
  }
  return order;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Enqueue')) return 15;
      if (step.message?.includes('Decrement')) return 13;
      if (step.message?.includes('Process')) return 10;
      if (step.message?.includes('In-degree 0')) return 7;
      if (step.message?.includes('Complete')) return 18;
      return 4;
    }
  },

  'bit-manipulation': {
    code: `function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    count += n & 1;  // Check last bit
    n >>= 1;         // Shift right
  }
  return count;
}
// Single Number (XOR trick)
function singleNumber(nums) {
  let result = 0;
  for (let num of nums) {
    result ^= num; // XOR cancels pairs
  }
  return result;
}`,
    stepToLine: (step) => {
      if (!step) return -1;
      if (step.message?.includes('Bit is 1')) return 4;
      if (step.message?.includes('Shift')) return 5;
      if (step.message?.includes('XOR')) return 14;
      if (step.message?.includes('Result')) return 7;
      return 3;
    }
  },
};
