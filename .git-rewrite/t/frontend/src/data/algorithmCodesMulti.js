// ═══════════════════════════════════════════════════════════
//  Multi-Language Algorithm Code Examples
//  Each algorithm has code in: javascript, python, java, cpp
//  stepToLine is shared (line numbers stay identical across
//  translations by keeping structure aligned)
// ═══════════════════════════════════════════════════════════

export const ALGORITHM_CODES_MULTI = {

  // ━━━━━━━━━━━━━ SORTING ━━━━━━━━━━━━━
  'bubble-sort': {
    javascript: `function bubbleSort(arr) {
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
    python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap adjacent elements
                arr[j], arr[j+1] = arr[j+1], arr[j]

        # Pass complete: largest bubbled up

    return arr  # Sorted!`,
    java: `void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap adjacent elements
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
        // Pass complete: largest bubbled up
    }
    // Sorted!
}`,
    cpp: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap adjacent elements
                swap(arr[j], arr[j+1]);
            }
        }
        // Pass complete: largest bubbled up
    }
    // Sorted!
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
    javascript: `function selectionSort(arr) {
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
    python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j  # New minimum found

        # Swap minimum to position i
        arr[i], arr[min_idx] = arr[min_idx], arr[i]

    return arr  # Sorted!`,
    java: `void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j; // New minimum found
            }
        }
        // Swap minimum to position i
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,
    cpp: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j; // New minimum found
            }
        }
        // Swap minimum to position i
        swap(arr[i], arr[minIdx]);
    }
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
    javascript: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift right
      j--;
    }
    arr[j + 1] = key; // Insert
  }
  return arr; // Sorted!
}`,
    python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]  # Shift right
            j -= 1
        arr[j + 1] = key  # Insert

    return arr  # Sorted!`,
    java: `void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j]; // Shift right
            j--;
        }
        arr[j + 1] = key; // Insert
    }
}`,
    cpp: `void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j]; // Shift right
            j--;
        }
        arr[j + 1] = key; // Insert
    }
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
    javascript: `function mergeSort(arr, l, r) {
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
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,
    python: `def merge_sort(arr, l, r):
    if l < r:
        mid = (l + r) // 2
        merge_sort(arr, l, mid)      # Sort left
        merge_sort(arr, mid + 1, r)  # Sort right
        merge(arr, l, mid, r)        # Merge halves

def merge(arr, l, m, r):
    left = arr[l:m+1]
    right = arr[m+1:r+1]
    i = j = 0; k = l
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: arr[k] = left[i]; i += 1
        else: arr[k] = right[j]; j += 1
        k += 1
    while i < len(left): arr[k] = left[i]; i += 1; k += 1
    while j < len(right): arr[k] = right[j]; j += 1; k += 1`,
    java: `void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int mid = (l + r) / 2;
        mergeSort(arr, l, mid);      // Sort left
        mergeSort(arr, mid + 1, r);  // Sort right
        merge(arr, l, mid, r);       // Merge halves
    }
}
void merge(int[] arr, int l, int m, int r) {
    int[] left = Arrays.copyOfRange(arr, l, m + 1);
    int[] right = Arrays.copyOfRange(arr, m + 1, r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
}`,
    cpp: `void mergeSort(vector<int>& arr, int l, int r) {
    if (l < r) {
        int mid = (l + r) / 2;
        mergeSort(arr, l, mid);      // Sort left
        mergeSort(arr, mid + 1, r);  // Sort right
        merge(arr, l, mid, r);       // Merge halves
    }
}
void merge(vector<int>& arr, int l, int m, int r) {
    vector<int> left(arr.begin()+l, arr.begin()+m+1);
    vector<int> right(arr.begin()+m+1, arr.begin()+r+1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.size()) arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
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
    javascript: `function quickSort(arr, lo, hi) {
  if (lo < hi) {
    let pi = partition(arr, lo, hi);
    quickSort(arr, lo, pi - 1);
    quickSort(arr, pi + 1, hi);
  }
}
function partition(arr, lo, hi) {
  let pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  return i + 1;
}`,
    python: `def quick_sort(arr, lo, hi):
    if lo < hi:
        pi = partition(arr, lo, hi)
        quick_sort(arr, lo, pi - 1)
        quick_sort(arr, pi + 1, hi)

def partition(arr, lo, hi):
    pivot = arr[hi]
    i = lo - 1
    for j in range(lo, hi):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i+1], arr[hi] = arr[hi], arr[i+1]
    return i + 1`,
    java: `void quickSort(int[] arr, int lo, int hi) {
    if (lo < hi) {
        int pi = partition(arr, lo, hi);
        quickSort(arr, lo, pi - 1);
        quickSort(arr, pi + 1, hi);
    }
}
int partition(int[] arr, int lo, int hi) {
    int pivot = arr[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i+1];
    arr[i+1] = arr[hi];
    arr[hi] = temp;
    return i + 1;
}`,
    cpp: `void quickSort(vector<int>& arr, int lo, int hi) {
    if (lo < hi) {
        int pi = partition(arr, lo, hi);
        quickSort(arr, lo, pi - 1);
        quickSort(arr, pi + 1, hi);
    }
}
int partition(vector<int>& arr, int lo, int hi) {
    int pivot = arr[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i+1], arr[hi]);
    return i + 1;
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

  // ━━━━━━━━━━━━━ SEARCHING ━━━━━━━━━━━━━
  'binary-search': {
    javascript: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      lo = mid + 1; // Search right
    } else {
      hi = mid - 1; // Search left
    }
  }
  return -1; // Not found
}`,
    python: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid  # Found!
        elif arr[mid] < target:
            lo = mid + 1  # Search right
        else:
            hi = mid - 1  # Search left

    return -1  # Not found`,
    java: `int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) {
            return mid; // Found!
        } else if (arr[mid] < target) {
            lo = mid + 1; // Search right
        } else {
            hi = mid - 1; // Search left
        }
    }
    return -1; // Not found
}`,
    cpp: `int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) {
            return mid; // Found!
        } else if (arr[mid] < target) {
            lo = mid + 1; // Search right
        } else {
            hi = mid - 1; // Search left
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
    javascript: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found!
    }
    // Not a match, continue
  }
  return -1; // Not found
}`,
    python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i  # Found!
        # Not a match, continue

    return -1  # Not found`,
    java: `int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            return i; // Found!
        }
        // Not a match, continue
    }
    return -1; // Not found
}`,
    cpp: `int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) {
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

  // ━━━━━━━━━━━━━ GRAPH ━━━━━━━━━━━━━
  'bfs': {
    javascript: `function bfs(graph, start) {
  let visited = new Set();
  let queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    let node = queue.shift();
    process(node);
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
    python: `def bfs(graph, start):
    visited = set()
    queue = [start]
    visited.add(start)
    while queue:
        node = queue.pop(0)
        process(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
    java: `void bfs(List<List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    visited.add(start);
    queue.add(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        process(node);
        for (int neighbor : graph.get(node)) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.add(neighbor);
            }
        }
    }
}`,
    cpp: `void bfs(vector<vector<int>>& graph, int start) {
    unordered_set<int> visited;
    queue<int> q;
    visited.insert(start);
    q.push(start);
    while (!q.empty()) {
        int node = q.front(); q.pop();
        process(node);
        for (int neighbor : graph[node]) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
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
    javascript: `function dfs(graph, node, visited) {
  visited.add(node);
  process(node);
  for (let neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
  // Backtrack
}`,
    python: `def dfs(graph, node, visited):
    visited.add(node)
    process(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

    # Backtrack`,
    java: `void dfs(List<List<Integer>> graph, int node,
         Set<Integer> visited) {
    visited.add(node);
    process(node);
    for (int neighbor : graph.get(node)) {
        if (!visited.contains(neighbor)) {
            dfs(graph, neighbor, visited);
        }
    }
    // Backtrack
}`,
    cpp: `void dfs(vector<vector<int>>& graph, int node,
         unordered_set<int>& visited) {
    visited.insert(node);
    process(node);
    for (int neighbor : graph[node]) {
        if (!visited.count(neighbor)) {
            dfs(graph, neighbor, visited);
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

  // ━━━━━━━━━━━━━ TWO POINTERS / SLIDING WINDOW ━━━━━━━━━━━━━
  'two-pointers': {
    javascript: `function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right]; // Found!
    } else if (sum < target) {
      left++;  // Need larger sum
    } else {
      right--; // Need smaller sum
    }
  }
  return [-1, -1]; // No pair
}`,
    python: `def two_sum(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return [left, right]  # Found!
        elif s < target:
            left += 1   # Need larger sum
        else:
            right -= 1  # Need smaller sum

    return [-1, -1]  # No pair`,
    java: `int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;  // Need larger sum
        } else {
            right--; // Need smaller sum
        }
    }
    return new int[]{-1, -1};
}`,
    cpp: `pair<int,int> twoSum(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            return {left, right}; // Found!
        } else if (sum < target) {
            left++;  // Need larger sum
        } else {
            right--; // Need smaller sum
        }
    }
    return {-1, -1}; // No pair
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
    javascript: `function maxSumSubarray(arr, k) {
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
    python: `def max_sum_subarray(arr, k):
    window_sum = 0
    # Build first window
    for i in range(k):
        window_sum += arr[i]

    max_sum = window_sum
    # Slide the window
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)

    return max_sum`,
    java: `int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    // Build first window
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;
    // Slide the window
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}`,
    cpp: `int maxSumSubarray(vector<int>& arr, int k) {
    int windowSum = 0;
    // Build first window
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;
    // Slide the window
    for (int i = k; i < arr.size(); i++) {
        windowSum += arr[i] - arr[i - k];
        maxSum = max(maxSum, windowSum);
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
    javascript: `function mergeIntervals(intervals) {
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
    python: `def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for i in range(1, len(intervals)):
        last = merged[-1]
        if intervals[i][0] <= last[1]:
            # Overlapping: extend end
            last[1] = max(last[1], intervals[i][1])
        else:
            # No overlap: add new interval
            merged.append(intervals[i])

    return merged`,
    java: `int[][] mergeIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a,b) -> a[0] - b[0]);
    List<int[]> merged = new ArrayList<>();
    merged.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = merged.get(merged.size()-1);
        if (intervals[i][0] <= last[1]) {
            // Overlapping: extend end
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            // No overlap: add new interval
            merged.add(intervals[i]);
        }
    }
    return merged.toArray(new int[0][]);
}`,
    cpp: `vector<vector<int>> mergeIntervals(
        vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> merged = {intervals[0]};
    for (int i = 1; i < intervals.size(); i++) {
        auto& last = merged.back();
        if (intervals[i][0] <= last[1]) {
            // Overlapping: extend end
            last[1] = max(last[1], intervals[i][1]);
        } else {
            // No overlap: add new interval
            merged.push_back(intervals[i]);
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

  // ━━━━━━━━━━━━━ KADANE / PREFIX-SUM / MONOTONIC STACK ━━━━━━━━━━━━━
  'kadane': {
    javascript: `function maxSubarraySum(arr) {
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
    python: `def max_subarray_sum(arr):
    max_so_far = arr[0]
    max_ending_here = arr[0]
    for i in range(1, len(arr)):
        # Extend current or start new
        max_ending_here = max(
            arr[i], max_ending_here + arr[i]
        )
        max_so_far = max(max_so_far, max_ending_here)

    return max_so_far`,
    java: `int maxSubarraySum(int[] arr) {
    int maxSoFar = arr[0];
    int maxEndingHere = arr[0];
    for (int i = 1; i < arr.length; i++) {
        // Extend current or start new
        maxEndingHere = Math.max(
            arr[i], maxEndingHere + arr[i]
        );
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}`,
    cpp: `int maxSubarraySum(vector<int>& arr) {
    int maxSoFar = arr[0];
    int maxEndingHere = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        // Extend current or start new
        maxEndingHere = max(
            arr[i], maxEndingHere + arr[i]
        );
        maxSoFar = max(maxSoFar, maxEndingHere);
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
    javascript: `function buildPrefixSum(arr) {
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
    python: `def build_prefix_sum(arr):
    prefix = [0]
    for i in range(len(arr)):
        prefix.append(prefix[i] + arr[i])

    return prefix

# Range sum query: sum(l, r)
def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]`,
    java: `int[] buildPrefixSum(int[] arr) {
    int[] prefix = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i+1] = prefix[i] + arr[i];
    }
    return prefix;
}
// Range sum query: sum(l, r)
int rangeSum(int[] prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}`,
    cpp: `vector<int> buildPrefixSum(vector<int>& arr) {
    vector<int> prefix = {0};
    for (int i = 0; i < arr.size(); i++) {
        prefix.push_back(prefix[i] + arr[i]);
    }
    return prefix;
}
// Range sum query: sum(l, r)
int rangeSum(vector<int>& prefix, int l, int r) {
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
    javascript: `function nextGreaterElement(arr) {
  let result = new Array(arr.length).fill(-1);
  let stack = []; // Monotonic decreasing
  for (let i = 0; i < arr.length; i++) {
    while (stack.length && arr[i] > arr[stack.at(-1)]) {
      let idx = stack.pop();
      result[idx] = arr[i]; // Next greater
    }
    stack.push(i);
  }
  return result;
}`,
    python: `def next_greater_element(arr):
    result = [-1] * len(arr)
    stack = []  # Monotonic decreasing
    for i in range(len(arr)):
        while stack and arr[i] > arr[stack[-1]]:
            idx = stack.pop()
            result[idx] = arr[i]  # Next greater
        stack.append(i)

    return result`,
    java: `int[] nextGreaterElement(int[] arr) {
    int[] result = new int[arr.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < arr.length; i++) {
        while (!stack.isEmpty() && arr[i] > arr[stack.peek()]) {
            int idx = stack.pop();
            result[idx] = arr[i]; // Next greater
        }
        stack.push(i);
    }
    return result;
}`,
    cpp: `vector<int> nextGreaterElement(vector<int>& arr) {
    vector<int> result(arr.size(), -1);
    stack<int> stk; // Monotonic decreasing
    for (int i = 0; i < arr.size(); i++) {
        while (!stk.empty() && arr[i] > arr[stk.top()]) {
            int idx = stk.top(); stk.pop();
            result[idx] = arr[i]; // Next greater
        }
        stk.push(i);
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

  // ━━━━━━━━━━━━━ DYNAMIC PROGRAMMING ━━━━━━━━━━━━━
  'dp-fibonacci': {
    javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let dp = [0, 1, 2];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    // Ways to reach step i
  }
  return dp[n];
}`,
    python: `def climb_stairs(n):
    if n <= 2: return n
    dp = [0, 1, 2]
    for i in range(3, n + 1):
        dp.append(dp[i-1] + dp[i-2])
        # Ways to reach step i

    return dp[n]`,
    java: `int climbStairs(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
        // Ways to reach step i
    }
    return dp[n];
}`,
    cpp: `int climbStairs(int n) {
    if (n <= 2) return n;
    vector<int> dp(n + 1);
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) {
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
    javascript: `function knapsack(weights, values, W) {
  let n = weights.length;
  let dp = Array(n+1).fill(null)
    .map(() => Array(W+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i-1][w]; // Skip
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(dp[i][w],
          dp[i-1][w-weights[i-1]] + values[i-1]
        ); // Include item
      }
    }
  }
  return dp[n][W];
}`,
    python: `def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W+1) for _ in range(n+1)]

    for i in range(1, n+1):
        for w in range(W+1):
            dp[i][w] = dp[i-1][w]  # Skip
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w],
                    dp[i-1][w-weights[i-1]] + values[i-1]
                )  # Include item


    return dp[n][W]`,
    java: `int knapsack(int[] weights, int[] values, int W) {
    int n = weights.length;
    int[][] dp = new int[n+1][W+1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w]; // Skip
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(dp[i][w],
                    dp[i-1][w-weights[i-1]] + values[i-1]
                ); // Include item
            }
        }
    }
    return dp[n][W];
}`,
    cpp: `int knapsack(vector<int>& weights,
             vector<int>& values, int W) {
    int n = weights.size();
    vector<vector<int>> dp(n+1, vector<int>(W+1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w]; // Skip
            if (weights[i-1] <= w) {
                dp[i][w] = max(dp[i][w],
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

  // ━━━━━━━━━━━━━ BACKTRACKING / GREEDY ━━━━━━━━━━━━━
  'backtracking': {
    javascript: `function generateSubsets(nums) {
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
    python: `def generate_subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            current.append(nums[i])  # Choose
            backtrack(i + 1, current) # Explore
            current.pop()             # Un-choose

    backtrack(0, [])
    return result`,
    java: `List<List<Integer>> generateSubsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}
void backtrack(int[] nums, int start,
               List<Integer> current,
               List<List<Integer>> result) {
    result.add(new ArrayList<>(current));
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);         // Choose
        backtrack(nums, i+1, current, result);
        current.remove(current.size()-1); // Un-choose
    }
}`,
    cpp: `vector<vector<int>> generateSubsets(vector<int>& nums) {
    vector<vector<int>> result;
    vector<int> current;
    backtrack(nums, 0, current, result);
    return result;
}
void backtrack(vector<int>& nums, int start,
               vector<int>& current,
               vector<vector<int>>& result) {
    result.push_back(current);
    for (int i = start; i < nums.size(); i++) {
        current.push_back(nums[i]); // Choose
        backtrack(nums, i+1, current, result);
        current.pop_back();          // Un-choose
    }
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
    javascript: `function activitySelection(start, end) {
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
    python: `def activity_selection(start, end):
    activities = sorted(zip(start, end), key=lambda x: x[1])
    selected = [activities[0]]
    last_end = activities[0][1]
    for i in range(1, len(activities)):
        if activities[i][0] >= last_end:
            selected.append(activities[i])
            last_end = activities[i][1]


    return selected`,
    java: `List<int[]> activitySelection(int[] start, int[] end) {
    int[][] acts = new int[start.length][2];
    for (int i = 0; i < start.length; i++)
        acts[i] = new int[]{start[i], end[i]};
    Arrays.sort(acts, (a,b) -> a[1] - b[1]);
    List<int[]> selected = new ArrayList<>();
    selected.add(acts[0]);
    int lastEnd = acts[0][1];
    for (int i = 1; i < acts.length; i++) {
        if (acts[i][0] >= lastEnd) {
            selected.add(acts[i]);
            lastEnd = acts[i][1];
        }
    }
    return selected;
}`,
    cpp: `vector<pair<int,int>> activitySelection(
        vector<int>& start, vector<int>& end) {
    vector<pair<int,int>> acts;
    for (int i = 0; i < start.size(); i++)
        acts.push_back({start[i], end[i]});
    sort(acts.begin(), acts.end(),
         [](auto& a, auto& b){ return a.second < b.second; });
    vector<pair<int,int>> selected = {acts[0]};
    int lastEnd = acts[0].second;
    for (int i = 1; i < acts.size(); i++) {
        if (acts[i].first >= lastEnd) {
            selected.push_back(acts[i]);
            lastEnd = acts[i].second;
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

  // ━━━━━━━━━━━━━ UNION-FIND / TOPOLOGICAL ━━━━━━━━━━━━━
  'union-find': {
    javascript: `class UnionFind {
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
      [px, py] = [py, px];
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py])
      this.rank[px]++;
    return true;
  }
}`,
    python: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]  # Path compression

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True`,
    java: `class UnionFind {
    int[] parent, rank;
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x]; // Path compression
    }
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py])
            { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}`,
    cpp: `class UnionFind {
    vector<int> parent, rank_;
public:
    UnionFind(int n) : parent(n), rank_(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x]; // Path compression
    }
    bool unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank_[px] < rank_[py]) swap(px, py);
        parent[py] = px;
        if (rank_[px] == rank_[py]) rank_[px]++;
        return true;
    }
};`,
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
    javascript: `function topologicalSort(graph, n) {
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
    python: `def topological_sort(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph[u]: in_degree[v] += 1
    queue = []
    for i in range(n):
        if in_degree[i] == 0: queue.append(i)
    order = []
    while queue:
        node = queue.pop(0)
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order`,
    java: `List<Integer> topologicalSort(
        List<List<Integer>> graph, int n) {
    int[] inDegree = new int[n];
    for (int u = 0; u < n; u++)
        for (int v : graph.get(u)) inDegree[v]++;
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++)
        if (inDegree[i] == 0) queue.add(i);
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : graph.get(node)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0)
                queue.add(neighbor);
        }
    }
    return order;
}`,
    cpp: `vector<int> topologicalSort(
        vector<vector<int>>& graph, int n) {
    vector<int> inDegree(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : graph[u]) inDegree[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (inDegree[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int node = q.front(); q.pop();
        order.push_back(node);
        for (int neighbor : graph[node]) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0)
                q.push(neighbor);
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
    javascript: `function countSetBits(n) {
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
    python: `def count_set_bits(n):
    count = 0
    while n > 0:
        count += n & 1  # Check last bit
        n >>= 1         # Shift right

    return count

# Single Number (XOR trick)
def single_number(nums):
    result = 0
    for num in nums:
        result ^= num  # XOR cancels pairs

    return result`,
    java: `int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        count += n & 1;  // Check last bit
        n >>= 1;         // Shift right
    }
    return count;
}
// Single Number (XOR trick)
int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num; // XOR cancels pairs
    }
    return result;
}`,
    cpp: `int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        count += n & 1;  // Check last bit
        n >>= 1;         // Shift right
    }
    return count;
}
// Single Number (XOR trick)
int singleNumber(vector<int>& nums) {
    int result = 0;
    for (int num : nums) {
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

  // ━━━━━━━━━━━━━ ARRAY (NEW) ━━━━━━━━━━━━━
  'move-zeroes': {
    javascript: `function moveZeroes(nums) {
  let w = 0;
  for (let r = 0; r < nums.length; r++) {
    if (nums[r] !== 0) {
      [nums[w], nums[r]] = [nums[r], nums[w]];
      w++;
    }
  }
}`,
    python: `def move_zeroes(nums):
    w = 0
    for r in range(len(nums)):
        if nums[r] != 0:
            nums[w], nums[r] = nums[r], nums[w]
            w += 1`,
    java: `void moveZeroes(int[] nums) {
    int w = 0;
    for (int r = 0; r < nums.length; r++) {
        if (nums[r] != 0) {
            int t = nums[w]; nums[w] = nums[r]; nums[r] = t;
            w++;
        }
    }
}`,
    cpp: `void moveZeroes(vector<int>& nums) {
    int w = 0;
    for (int r = 0; r < nums.size(); r++) {
        if (nums[r] != 0) {
            swap(nums[w], nums[r]);
            w++;
        }
    }
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.swapping) return 5; if (s.comparing) return 4; return 3; }
  },

  'rotate-array': {
    javascript: `function rotate(nums, k) {
  k = k % nums.length;
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
}
function reverse(a, l, r) {
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    l++; r--;
  }
}`,
    python: `def rotate(nums, k):
    k = k % len(nums)
    reverse(nums, 0, len(nums) - 1)
    reverse(nums, 0, k - 1)
    reverse(nums, k, len(nums) - 1)

def reverse(a, l, r):
    while l < r:
        a[l], a[r] = a[r], a[l]
        l += 1; r -= 1`,
    java: `void rotate(int[] nums, int k) {
    k = k % nums.length;
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}
void reverse(int[] a, int l, int r) {
    while (l < r) {
        int t = a[l]; a[l] = a[r]; a[r] = t;
        l++; r--;
    }
}`,
    cpp: `void rotate(vector<int>& nums, int k) {
    k = k % nums.size();
    reverse(nums.begin(), nums.end());
    reverse(nums.begin(), nums.begin() + k);
    reverse(nums.begin() + k, nums.end());
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.swapping) return 9; if (s.message?.includes('Reverse')) return 3; return 2; }
  },

  'remove-duplicates': {
    javascript: `function removeDuplicates(nums) {
  let w = 1;
  for (let r = 1; r < nums.length; r++) {
    if (nums[r] !== nums[r - 1]) {
      nums[w] = nums[r];
      w++;
    }
  }
  return w;
}`,
    python: `def remove_duplicates(nums):
    w = 1
    for r in range(1, len(nums)):
        if nums[r] != nums[r - 1]:
            nums[w] = nums[r]
            w += 1
    return w`,
    java: `int removeDuplicates(int[] nums) {
    int w = 1;
    for (int r = 1; r < nums.length; r++) {
        if (nums[r] != nums[r - 1]) {
            nums[w] = nums[r];
            w++;
        }
    }
    return w;
}`,
    cpp: `int removeDuplicates(vector<int>& nums) {
    int w = 1;
    for (int r = 1; r < nums.size(); r++) {
        if (nums[r] != nums[r - 1]) {
            nums[w] = nums[r];
            w++;
        }
    }
    return w;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('unique')) return 5; if (s.comparing) return 4; return 3; }
  },

  'buy-sell-stock': {
    javascript: `function maxProfit(prices) {
  let minPrice = Infinity, maxProfit = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else {
      maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    }
  }
  return maxProfit;
}`,
    python: `def max_profit(prices):
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        if price < min_price:
            min_price = price
        else:
            max_profit = max(max_profit, price - min_price)
    return max_profit`,
    java: `int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        if (price < minPrice) {
            minPrice = price;
        } else {
            maxProfit = Math.max(maxProfit, price - minPrice);
        }
    }
    return maxProfit;
}`,
    cpp: `int maxProfit(vector<int>& prices) {
    int minPrice = INT_MAX, maxProfit = 0;
    for (int price : prices) {
        if (price < minPrice) {
            minPrice = price;
        } else {
            maxProfit = max(maxProfit, price - minPrice);
        }
    }
    return maxProfit;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('New min')) return 5; if (s.message?.includes('profit')) return 7; return 3; }
  },

  'product-except-self': {
    javascript: `function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }
  return result;
}`,
    python: `def product_except_self(nums):
    n = len(nums)
    result = [1] * n
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result`,
    java: `int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, 1);
    int prefix = 1;
    for (int i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}`,
    cpp: `vector<int> productExceptSelf(vector<int>& nums) {
    int n = nums.size();
    vector<int> result(n, 1);
    int prefix = 1;
    for (int i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('prefix')) return 6; if (s.message?.includes('suffix')) return 11; return 3; }
  },

  'contains-duplicate': {
    javascript: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}`,
    python: `def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen: return True
        seen.add(num)
    return False`,
    java: `boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (seen.contains(num)) return true;
        seen.add(num);
    }
    return false;
}`,
    cpp: `bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int num : nums) {
        if (seen.count(num)) return true;
        seen.insert(num);
    }
    return false;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Duplicate')) return 4; if (s.message?.includes('Add')) return 5; return 3; }
  },

  'majority-element': {
    javascript: `function majorityElement(nums) {
  let candidate = nums[0], count = 1;
  for (let i = 1; i < nums.length; i++) {
    if (count === 0) {
      candidate = nums[i];
    }
    count += nums[i] === candidate ? 1 : -1;
  }
  return candidate;
}`,
    python: `def majority_element(nums):
    candidate, count = nums[0], 1
    for i in range(1, len(nums)):
        if count == 0:
            candidate = nums[i]
        count += 1 if nums[i] == candidate else -1
    return candidate`,
    java: `int majorityElement(int[] nums) {
    int candidate = nums[0], count = 1;
    for (int i = 1; i < nums.length; i++) {
        if (count == 0) candidate = nums[i];
        count += nums[i] == candidate ? 1 : -1;
    }
    return candidate;
}`,
    cpp: `int majorityElement(vector<int>& nums) {
    int candidate = nums[0], count = 1;
    for (int i = 1; i < nums.size(); i++) {
        if (count == 0) candidate = nums[i];
        count += nums[i] == candidate ? 1 : -1;
    }
    return candidate;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('New candidate')) return 5; if (s.message?.includes('count')) return 6; return 3; }
  },

  // ━━━━━━━━━━ MORE ARRAY ━━━━━━━━━━
  'increasing-triplet': {
    javascript: `function increasingTriplet(nums) {
  let first = Infinity, second = Infinity;
  for (const n of nums) {
    if (n <= first) first = n;
    else if (n <= second) second = n;
    else return true;
  }
  return false;
}`,
    python: `def increasing_triplet(nums):
    first = second = float('inf')
    for n in nums:
        if n <= first: first = n
        elif n <= second: second = n
        else: return True
    return False`,
    java: `boolean increasingTriplet(int[] nums) {
    int first = Integer.MAX_VALUE, second = Integer.MAX_VALUE;
    for (int n : nums) {
        if (n <= first) first = n;
        else if (n <= second) second = n;
        else return true;
    }
    return false;
}`,
    cpp: `bool increasingTriplet(vector<int>& nums) {
    int first = INT_MAX, second = INT_MAX;
    for (int n : nums) {
        if (n <= first) first = n;
        else if (n <= second) second = n;
        else return true;
    }
    return false;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('first')) return 4; if (s.message?.includes('second')) return 5; if (s.message?.includes('Found')) return 6; return 3; }
  },

  'first-missing-positive': {
    javascript: `function firstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n
           && nums[nums[i]-1] !== nums[i]) {
      [nums[i], nums[nums[i]-1]] = [nums[nums[i]-1], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}`,
    python: `def first_missing_positive(nums):
    n = len(nums)
    for i in range(n):
        while 0 < nums[i] <= n \\
              and nums[nums[i]-1] != nums[i]:
            nums[nums[i]-1], nums[i] = nums[i], nums[nums[i]-1]
    for i in range(n):
        if nums[i] != i + 1: return i + 1
    return n + 1`,
    java: `int firstMissingPositive(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n
               && nums[nums[i]-1] != nums[i]) {
            int t = nums[i]; nums[i] = nums[t-1]; nums[t-1] = t;
        }
    }
    for (int i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}`,
    cpp: `int firstMissingPositive(vector<int>& nums) {
    int n = nums.size();
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n
               && nums[nums[i]-1] != nums[i])
            swap(nums[i], nums[nums[i]-1]);
    }
    for (int i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.swapping) return 6; if (s.message?.includes('Scan')) return 9; return 4; }
  },

  // ━━━━━━━━━━ STRING ━━━━━━━━━━
  'valid-palindrome': {
    javascript: `function isPalindrome(s) {
  s = s.replace(/[^a-z0-9]/gi,'').toLowerCase();
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}`,
    python: `def is_palindrome(s):
    s = ''.join(c.lower() for c in s if c.isalnum())
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]: return False
        l += 1; r -= 1
    return True`,
    java: `boolean isPalindrome(String s) {
    s = s.replaceAll("[^a-zA-Z0-9]","").toLowerCase();
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++; r--;
    }
    return true;
}`,
    cpp: `bool isPalindrome(string s) {
    string clean;
    for (char c : s) if (isalnum(c)) clean += tolower(c);
    int l = 0, r = clean.size() - 1;
    while (l < r) {
        if (clean[l] != clean[r]) return false;
        l++; r--;
    }
    return true;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Match')) return 5; if (s.message?.includes('Mismatch')) return 5; return 4; }
  },

  'is-subsequence': {
    javascript: `function isSubsequence(s, t) {
  let i = 0;
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}`,
    python: `def is_subsequence(s, t):
    i = 0
    for j in range(len(t)):
        if i < len(s) and s[i] == t[j]:
            i += 1
    return i == len(s)`,
    java: `boolean isSubsequence(String s, String t) {
    int i = 0;
    for (int j = 0; j < t.length() && i < s.length(); j++) {
        if (s.charAt(i) == t.charAt(j)) i++;
    }
    return i == s.length();
}`,
    cpp: `bool isSubsequence(string s, string t) {
    int i = 0;
    for (int j = 0; j < t.size() && i < s.size(); j++) {
        if (s[i] == t[j]) i++;
    }
    return i == s.size();
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Match')) return 4; return 3; }
  },

  'reverse-words': {
    javascript: `function reverseWords(s) {
  return s.trim().split(/\\s+/).reverse().join(' ');
}`,
    python: `def reverse_words(s):
    return ' '.join(s.split()[::-1])`,
    java: `String reverseWords(String s) {
    String[] words = s.trim().split("\\\\s+");
    Collections.reverse(Arrays.asList(words));
    return String.join(" ", words);
}`,
    cpp: `string reverseWords(string s) {
    istringstream iss(s);
    vector<string> words;
    string w;
    while (iss >> w) words.push_back(w);
    reverse(words.begin(), words.end());
    string res;
    for (auto& w : words) res += (res.empty()?"":' ') + w;
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; return 2; }
  },

  'longest-common-prefix': {
    javascript: `function longestCommonPrefix(strs) {
  if (!strs.length) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}`,
    python: `def longest_common_prefix(strs):
    if not strs: return ""
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: return ""
    return prefix`,
    java: `String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) != 0) {
            prefix = prefix.substring(0, prefix.length()-1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`,
    cpp: `string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    string prefix = strs[0];
    for (int i = 1; i < strs.size(); i++) {
        while (strs[i].find(prefix) != 0) {
            prefix = prefix.substr(0, prefix.size()-1);
            if (prefix.empty()) return "";
        }
    }
    return prefix;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Shorten')) return 6; if (s.message?.includes('Match')) return 5; return 4; }
  },

  // ━━━━━━━━━━ HASH TABLE ━━━━━━━━━━
  'ransom-note': {
    javascript: `function canConstruct(ransomNote, magazine) {
  const freq = {};
  for (const c of magazine) freq[c] = (freq[c]||0) + 1;
  for (const c of ransomNote) {
    if (!freq[c]) return false;
    freq[c]--;
  }
  return true;
}`,
    python: `def can_construct(ransom_note, magazine):
    freq = {}
    for c in magazine: freq[c] = freq.get(c, 0) + 1
    for c in ransom_note:
        if not freq.get(c): return False
        freq[c] -= 1
    return True`,
    java: `boolean canConstruct(String r, String m) {
    int[] freq = new int[26];
    for (char c : m.toCharArray()) freq[c-'a']++;
    for (char c : r.toCharArray()) {
        if (freq[c-'a'] == 0) return false;
        freq[c-'a']--;
    }
    return true;
}`,
    cpp: `bool canConstruct(string r, string m) {
    int freq[26] = {};
    for (char c : m) freq[c-'a']++;
    for (char c : r) {
        if (!freq[c-'a']) return false;
        freq[c-'a']--;
    }
    return true;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Build')) return 3; if (s.message?.includes('Check')) return 5; return 4; }
  },

  'group-anagrams': {
    javascript: `function groupAnagrams(strs) {
  const map = {};
  for (const s of strs) {
    const key = [...s].sort().join('');
    (map[key] = map[key] || []).push(s);
  }
  return Object.values(map);
}`,
    python: `def group_anagrams(strs):
    groups = {}
    for s in strs:
        key = ''.join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())`,
    java: `List<List<String>> groupAnagrams(String[] strs) {
    Map<String,List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] ca = s.toCharArray();
        Arrays.sort(ca);
        String key = new String(ca);
        map.computeIfAbsent(key, k->new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}`,
    cpp: `vector<vector<string>> groupAnagrams(vector<string>& strs) {
    unordered_map<string, vector<string>> map;
    for (auto& s : strs) {
        string key = s;
        sort(key.begin(), key.end());
        map[key].push_back(s);
    }
    vector<vector<string>> res;
    for (auto& [k, v] : map) res.push_back(v);
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Sort')) return 4; if (s.message?.includes('Group')) return 5; return 3; }
  },

  'longest-consecutive': {
    javascript: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let len = 1;
      while (set.has(n + len)) len++;
      best = Math.max(best, len);
    }
  }
  return best;
}`,
    python: `def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for n in s:
        if n - 1 not in s:
            length = 1
            while n + length in s: length += 1
            best = max(best, length)
    return best`,
    java: `int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);
    int best = 0;
    for (int n : set) {
        if (!set.contains(n - 1)) {
            int len = 1;
            while (set.contains(n + len)) len++;
            best = Math.max(best, len);
        }
    }
    return best;
}`,
    cpp: `int longestConsecutive(vector<int>& nums) {
    unordered_set<int> s(nums.begin(), nums.end());
    int best = 0;
    for (int n : s) {
        if (!s.count(n - 1)) {
            int len = 1;
            while (s.count(n + len)) len++;
            best = max(best, len);
        }
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Start')) return 5; if (s.message?.includes('Extend')) return 7; return 4; }
  },

  'contains-duplicate-ii': {
    javascript: `function containsNearbyDuplicate(nums, k) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (map.has(nums[i]) && i - map.get(nums[i]) <= k)
      return true;
    map.set(nums[i], i);
  }
  return false;
}`,
    python: `def contains_nearby_duplicate(nums, k):
    seen = {}
    for i, n in enumerate(nums):
        if n in seen and i - seen[n] <= k:
            return True
        seen[n] = i
    return False`,
    java: `boolean containsNearbyDuplicate(int[] nums, int k) {
    Map<Integer,Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        if (map.containsKey(nums[i]) && i - map.get(nums[i]) <= k)
            return true;
        map.put(nums[i], i);
    }
    return false;
}`,
    cpp: `bool containsNearbyDuplicate(vector<int>& nums, int k) {
    unordered_map<int,int> map;
    for (int i = 0; i < nums.size(); i++) {
        if (map.count(nums[i]) && i - map[nums[i]] <= k)
            return true;
        map[nums[i]] = i;
    }
    return false;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Duplicate')) return 4; return 3; }
  },

  'isomorphic-strings': {
    javascript: `function isIsomorphic(s, t) {
  const m1 = {}, m2 = {};
  for (let i = 0; i < s.length; i++) {
    if (m1[s[i]] !== m2[t[i]]) return false;
    m1[s[i]] = i + 1;
    m2[t[i]] = i + 1;
  }
  return true;
}`,
    python: `def is_isomorphic(s, t):
    m1, m2 = {}, {}
    for i in range(len(s)):
        if m1.get(s[i]) != m2.get(t[i]):
            return False
        m1[s[i]] = i + 1
        m2[t[i]] = i + 1
    return True`,
    java: `boolean isIsomorphic(String s, String t) {
    int[] m1 = new int[256], m2 = new int[256];
    for (int i = 0; i < s.length(); i++) {
        if (m1[s.charAt(i)] != m2[t.charAt(i)]) return false;
        m1[s.charAt(i)] = i + 1;
        m2[t.charAt(i)] = i + 1;
    }
    return true;
}`,
    cpp: `bool isIsomorphic(string s, string t) {
    int m1[256]={}, m2[256]={};
    for (int i = 0; i < s.size(); i++) {
        if (m1[s[i]] != m2[t[i]]) return false;
        m1[s[i]] = i + 1;
        m2[t[i]] = i + 1;
    }
    return true;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Map')) return 5; return 4; }
  },

  'good-pairs': {
    javascript: `function numGoodPairs(nums) {
  const freq = {};
  let count = 0;
  for (const n of nums) {
    count += freq[n] || 0;
    freq[n] = (freq[n] || 0) + 1;
  }
  return count;
}`,
    python: `def num_good_pairs(nums):
    freq = {}
    count = 0
    for n in nums:
        count += freq.get(n, 0)
        freq[n] = freq.get(n, 0) + 1
    return count`,
    java: `int numGoodPairs(int[] nums) {
    Map<Integer,Integer> freq = new HashMap<>();
    int count = 0;
    for (int n : nums) {
        count += freq.getOrDefault(n, 0);
        freq.merge(n, 1, Integer::sum);
    }
    return count;
}`,
    cpp: `int numGoodPairs(vector<int>& nums) {
    unordered_map<int,int> freq;
    int count = 0;
    for (int n : nums) {
        count += freq[n];
        freq[n]++;
    }
    return count;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('pairs')) return 5; return 4; }
  },

  // ━━━━━━━━━━ TWO POINTERS (ADDITIONAL) ━━━━━━━━━━
  '3sum': {
    javascript: `function threeSum(nums) {
  nums.sort((a,b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l<r && nums[l]===nums[l+1]) l++;
        l++; r--;
      } else if (s < 0) l++;
      else r--;
    }
  }
  return result;
}`,
    python: `def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                result.append([nums[i], nums[l], nums[r]])
                while l<r and nums[l]==nums[l+1]: l += 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return result`,
    java: `List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int l = i+1, r = nums.length-1;
        while (l < r) {
            int s = nums[i]+nums[l]+nums[r];
            if (s == 0) {
                res.add(Arrays.asList(nums[i],nums[l],nums[r]));
                while (l<r && nums[l]==nums[l+1]) l++;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return res;
}`,
    cpp: `vector<vector<int>> threeSum(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> res;
    for (int i = 0; i < (int)nums.size()-2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int l = i+1, r = nums.size()-1;
        while (l < r) {
            int s = nums[i]+nums[l]+nums[r];
            if (s == 0) {
                res.push_back({nums[i],nums[l],nums[r]});
                while (l<r && nums[l]==nums[l+1]) l++;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Found')) return 10; if (s.message?.includes('Sum')) return 8; return 4; }
  },

  'container-water': {
    javascript: `function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    const area = Math.min(height[l], height[r]) * (r - l);
    best = Math.max(best, area);
    if (height[l] < height[r]) l++;
    else r--;
  }
  return best;
}`,
    python: `def max_area(height):
    l, r, best = 0, len(height)-1, 0
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        best = max(best, area)
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best`,
    java: `int maxArea(int[] h) {
    int l = 0, r = h.length-1, best = 0;
    while (l < r) {
        int area = Math.min(h[l],h[r]) * (r-l);
        best = Math.max(best, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    return best;
}`,
    cpp: `int maxArea(vector<int>& h) {
    int l = 0, r = h.size()-1, best = 0;
    while (l < r) {
        int area = min(h[l],h[r]) * (r-l);
        best = max(best, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('area')) return 4; if (s.message?.includes('Move')) return 6; return 3; }
  },

  'trapping-rain-water': {
    javascript: `function trap(height) {
  let l = 0, r = height.length - 1;
  let lMax = 0, rMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lMax = Math.max(lMax, height[l]);
      water += lMax - height[l];
      l++;
    } else {
      rMax = Math.max(rMax, height[r]);
      water += rMax - height[r];
      r--;
    }
  }
  return water;
}`,
    python: `def trap(height):
    l, r = 0, len(height) - 1
    l_max = r_max = water = 0
    while l < r:
        if height[l] < height[r]:
            l_max = max(l_max, height[l])
            water += l_max - height[l]
            l += 1
        else:
            r_max = max(r_max, height[r])
            water += r_max - height[r]
            r -= 1
    return water`,
    java: `int trap(int[] h) {
    int l = 0, r = h.length-1, lMax = 0, rMax = 0, water = 0;
    while (l < r) {
        if (h[l] < h[r]) {
            lMax = Math.max(lMax, h[l]);
            water += lMax - h[l]; l++;
        } else {
            rMax = Math.max(rMax, h[r]);
            water += rMax - h[r]; r--;
        }
    }
    return water;
}`,
    cpp: `int trap(vector<int>& h) {
    int l = 0, r = h.size()-1, lMax = 0, rMax = 0, water = 0;
    while (l < r) {
        if (h[l] < h[r]) {
            lMax = max(lMax, h[l]);
            water += lMax - h[l]; l++;
        } else {
            rMax = max(rMax, h[r]);
            water += rMax - h[r]; r--;
        }
    }
    return water;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('water')) return 7; if (s.message?.includes('left')) return 5; return 4; }
  },

  'merge-sorted-array': {
    javascript: `function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
    else nums1[k--] = nums2[j--];
  }
  while (j >= 0) nums1[k--] = nums2[j--];
}`,
    python: `def merge(nums1, m, nums2, n):
    i, j, k = m-1, n-1, m+n-1
    while i >= 0 and j >= 0:
        if nums1[i] > nums2[j]: nums1[k] = nums1[i]; i -= 1
        else: nums1[k] = nums2[j]; j -= 1
        k -= 1
    while j >= 0: nums1[k] = nums2[j]; j -= 1; k -= 1`,
    java: `void merge(int[] n1, int m, int[] n2, int n) {
    int i = m-1, j = n-1, k = m+n-1;
    while (i >= 0 && j >= 0) {
        if (n1[i] > n2[j]) n1[k--] = n1[i--];
        else n1[k--] = n2[j--];
    }
    while (j >= 0) n1[k--] = n2[j--];
}`,
    cpp: `void merge(vector<int>& n1, int m, vector<int>& n2, int n) {
    int i = m-1, j = n-1, k = m+n-1;
    while (i >= 0 && j >= 0) {
        if (n1[i] > n2[j]) n1[k--] = n1[i--];
        else n1[k--] = n2[j--];
    }
    while (j >= 0) n1[k--] = n2[j--];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Place')) return 4; return 3; }
  },

  // ━━━━━━━━━━ SLIDING WINDOW / PREFIX SUM (ADDITIONAL) ━━━━━━━━━━
  'subarray-sum-k': {
    javascript: `function subarraySum(nums, k) {
  const map = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    count += map.get(sum - k) || 0;
    map.set(sum, (map.get(sum)||0) + 1);
  }
  return count;
}`,
    python: `def subarray_sum(nums, k):
    prefix = {0: 1}
    total = count = 0
    for n in nums:
        total += n
        count += prefix.get(total - k, 0)
        prefix[total] = prefix.get(total, 0) + 1
    return count`,
    java: `int subarraySum(int[] nums, int k) {
    Map<Integer,Integer> map = new HashMap<>(Map.of(0,1));
    int sum = 0, count = 0;
    for (int n : nums) {
        sum += n;
        count += map.getOrDefault(sum-k, 0);
        map.merge(sum, 1, Integer::sum);
    }
    return count;
}`,
    cpp: `int subarraySum(vector<int>& nums, int k) {
    unordered_map<int,int> map{{0,1}};
    int sum = 0, count = 0;
    for (int n : nums) {
        sum += n;
        count += map[sum-k];
        map[sum]++;
    }
    return count;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Found')) return 6; return 5; }
  },

  'contiguous-array': {
    javascript: `function findMaxLength(nums) {
  const map = new Map([[0, -1]]);
  let count = 0, best = 0;
  for (let i = 0; i < nums.length; i++) {
    count += nums[i] === 1 ? 1 : -1;
    if (map.has(count))
      best = Math.max(best, i - map.get(count));
    else map.set(count, i);
  }
  return best;
}`,
    python: `def find_max_length(nums):
    prefix = {0: -1}
    count = best = 0
    for i, n in enumerate(nums):
        count += 1 if n == 1 else -1
        if count in prefix:
            best = max(best, i - prefix[count])
        else: prefix[count] = i
    return best`,
    java: `int findMaxLength(int[] nums) {
    Map<Integer,Integer> map = new HashMap<>(Map.of(0,-1));
    int count = 0, best = 0;
    for (int i = 0; i < nums.length; i++) {
        count += nums[i] == 1 ? 1 : -1;
        if (map.containsKey(count))
            best = Math.max(best, i - map.get(count));
        else map.put(count, i);
    }
    return best;
}`,
    cpp: `int findMaxLength(vector<int>& nums) {
    unordered_map<int,int> map{{0,-1}};
    int count = 0, best = 0;
    for (int i = 0; i < nums.size(); i++) {
        count += nums[i] == 1 ? 1 : -1;
        if (map.count(count))
            best = max(best, i - map[count]);
        else map[count] = i;
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Update')) return 5; if (s.message?.includes('best')) return 7; return 4; }
  },

  'longest-substring': {
    javascript: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let best = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]))
      left = Math.max(left, map.get(s[right]) + 1);
    map.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    python: `def length_of_longest_substring(s):
    seen = {}
    best = left = 0
    for right, c in enumerate(s):
        if c in seen:
            left = max(left, seen[c] + 1)
        seen[c] = right
        best = max(best, right - left + 1)
    return best`,
    java: `int lengthOfLongestSubstring(String s) {
    Map<Character,Integer> map = new HashMap<>();
    int best = 0, left = 0;
    for (int r = 0; r < s.length(); r++) {
        if (map.containsKey(s.charAt(r)))
            left = Math.max(left, map.get(s.charAt(r))+1);
        map.put(s.charAt(r), r);
        best = Math.max(best, r-left+1);
    }
    return best;
}`,
    cpp: `int lengthOfLongestSubstring(string s) {
    unordered_map<char,int> map;
    int best = 0, left = 0;
    for (int r = 0; r < s.size(); r++) {
        if (map.count(s[r]))
            left = max(left, map[s[r]]+1);
        map[s[r]] = r;
        best = max(best, r-left+1);
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Shrink')) return 6; if (s.message?.includes('best')) return 8; return 4; }
  },

  'permutation-in-string': {
    javascript: `function checkInclusion(s1, s2) {
  const freq = new Array(26).fill(0);
  for (const c of s1) freq[c.charCodeAt(0)-97]++;
  let l = 0, match = 0;
  for (let r = 0; r < s2.length; r++) {
    if (--freq[s2.charCodeAt(r)-97] >= 0) match++;
    if (r - l + 1 > s1.length)
      if (++freq[s2.charCodeAt(l++)-97] > 0) match--;
    if (match === s1.length) return true;
  }
  return false;
}`,
    python: `def check_inclusion(s1, s2):
    from collections import Counter
    freq = Counter(s1)
    window = {}; match = 0; l = 0
    for r, c in enumerate(s2):
        window[c] = window.get(c, 0) + 1
        if window[c] == freq.get(c, 0): match += 1
        if r - l + 1 > len(s1):
            lc = s2[l]; l += 1
            if window[lc] == freq.get(lc, 0): match -= 1
            window[lc] -= 1
        if match == len(freq): return True
    return False`,
    java: `boolean checkInclusion(String s1, String s2) {
    int[] freq = new int[26];
    for (char c : s1.toCharArray()) freq[c-'a']++;
    int l = 0, match = 0;
    for (int r = 0; r < s2.length(); r++) {
        if (--freq[s2.charAt(r)-'a'] >= 0) match++;
        if (r-l+1 > s1.length())
            if (++freq[s2.charAt(l++)-'a'] > 0) match--;
        if (match == s1.length()) return true;
    }
    return false;
}`,
    cpp: `bool checkInclusion(string s1, string s2) {
    int freq[26]={};
    for (char c : s1) freq[c-'a']++;
    int l = 0, match = 0;
    for (int r = 0; r < s2.size(); r++) {
        if (--freq[s2[r]-'a'] >= 0) match++;
        if (r-l+1 > (int)s1.size())
            if (++freq[s2[l++]-'a'] > 0) match--;
        if (match == (int)s1.size()) return true;
    }
    return false;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('match')) return 9; if (s.message?.includes('Slide')) return 7; return 5; }
  },

  'max-consecutive-ones': {
    javascript: `function longestOnes(nums, k) {
  let l = 0, zeros = 0, best = 0;
  for (let r = 0; r < nums.length; r++) {
    if (nums[r] === 0) zeros++;
    while (zeros > k) {
      if (nums[l] === 0) zeros--;
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}`,
    python: `def longest_ones(nums, k):
    l = zeros = best = 0
    for r in range(len(nums)):
        if nums[r] == 0: zeros += 1
        while zeros > k:
            if nums[l] == 0: zeros -= 1
            l += 1
        best = max(best, r - l + 1)
    return best`,
    java: `int longestOnes(int[] nums, int k) {
    int l = 0, zeros = 0, best = 0;
    for (int r = 0; r < nums.length; r++) {
        if (nums[r] == 0) zeros++;
        while (zeros > k) {
            if (nums[l] == 0) zeros--;
            l++;
        }
        best = Math.max(best, r-l+1);
    }
    return best;
}`,
    cpp: `int longestOnes(vector<int>& nums, int k) {
    int l = 0, zeros = 0, best = 0;
    for (int r = 0; r < nums.size(); r++) {
        if (nums[r] == 0) zeros++;
        while (zeros > k) {
            if (nums[l] == 0) zeros--;
            l++;
        }
        best = max(best, r-l+1);
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Shrink')) return 6; if (s.message?.includes('best')) return 8; return 4; }
  },

  'max-product-subarray': {
    javascript: `function maxProduct(nums) {
  let maxP = nums[0], minP = nums[0], result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < 0) [maxP, minP] = [minP, maxP];
    maxP = Math.max(nums[i], maxP * nums[i]);
    minP = Math.min(nums[i], minP * nums[i]);
    result = Math.max(result, maxP);
  }
  return result;
}`,
    python: `def max_product(nums):
    max_p = min_p = result = nums[0]
    for n in nums[1:]:
        if n < 0: max_p, min_p = min_p, max_p
        max_p = max(n, max_p * n)
        min_p = min(n, min_p * n)
        result = max(result, max_p)
    return result`,
    java: `int maxProduct(int[] nums) {
    int maxP = nums[0], minP = nums[0], result = nums[0];
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] < 0) { int t = maxP; maxP = minP; minP = t; }
        maxP = Math.max(nums[i], maxP * nums[i]);
        minP = Math.min(nums[i], minP * nums[i]);
        result = Math.max(result, maxP);
    }
    return result;
}`,
    cpp: `int maxProduct(vector<int>& nums) {
    int maxP = nums[0], minP = nums[0], result = nums[0];
    for (int i = 1; i < nums.size(); i++) {
        if (nums[i] < 0) swap(maxP, minP);
        maxP = max(nums[i], maxP * nums[i]);
        minP = min(nums[i], minP * nums[i]);
        result = max(result, maxP);
    }
    return result;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('product')) return 5; if (s.message?.includes('result')) return 7; return 3; }
  },

  // ━━━━━━━━━━ STACK ━━━━━━━━━━
  'valid-parentheses': {
    javascript: `function isValid(s) {
  const stack = [], map = {')':'(',']':'[','}':'{'};
  for (const c of s) {
    if ('([{'.includes(c)) stack.push(c);
    else if (stack.pop() !== map[c]) return false;
  }
  return stack.length === 0;
}`,
    python: `def is_valid(s):
    stack, m = [], {')':'(',']':'[','}':'{'}
    for c in s:
        if c in '([{': stack.append(c)
        elif not stack or stack.pop() != m[c]: return False
    return len(stack) == 0`,
    java: `boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character,Character> m = Map.of(')','(',']','[','}','{');
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) stack.push(c);
        else if (stack.isEmpty() || stack.pop() != m.get(c)) return false;
    }
    return stack.isEmpty();
}`,
    cpp: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else {
            if (st.empty()) return false;
            char t = st.top(); st.pop();
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return false;
        }
    }
    return st.empty();
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Push')) return 4; if (s.message?.includes('Pop')) return 5; return 3; }
  },

  'daily-temperatures': {
    javascript: `function dailyTemperatures(temps) {
  const res = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack.at(-1)]) {
      const j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}`,
    python: `def daily_temperatures(temps):
    res = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and t > temps[stack[-1]]:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`,
    java: `int[] dailyTemperatures(int[] temps) {
    int[] res = new int[temps.length];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < temps.length; i++) {
        while (!stack.isEmpty() && temps[i] > temps[stack.peek()])
            { int j = stack.pop(); res[j] = i - j; }
        stack.push(i);
    }
    return res;
}`,
    cpp: `vector<int> dailyTemperatures(vector<int>& temps) {
    vector<int> res(temps.size(), 0);
    stack<int> st;
    for (int i = 0; i < temps.size(); i++) {
        while (!st.empty() && temps[i] > temps[st.top()])
            { int j = st.top(); st.pop(); res[j] = i - j; }
        st.push(i);
    }
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Pop')) return 6; if (s.message?.includes('Push')) return 8; return 5; }
  },

  'eval-rpn': {
    javascript: `function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      const b = stack.pop(), a = stack.pop();
      if (t==='+') stack.push(a+b);
      else if (t==='-') stack.push(a-b);
      else if (t==='*') stack.push(a*b);
      else stack.push(Math.trunc(a/b));
    } else stack.push(Number(t));
  }
  return stack[0];
}`,
    python: `def eval_rpn(tokens):
    stack = []
    for t in tokens:
        if t in '+-*/':
            b, a = stack.pop(), stack.pop()
            if t=='+': stack.append(a+b)
            elif t=='-': stack.append(a-b)
            elif t=='*': stack.append(a*b)
            else: stack.append(int(a/b))
        else: stack.append(int(t))
    return stack[0]`,
    java: `int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        if ("+-*/".contains(t)) {
            int b = stack.pop(), a = stack.pop();
            switch(t) { case "+": stack.push(a+b); break;
                case "-": stack.push(a-b); break;
                case "*": stack.push(a*b); break;
                default: stack.push(a/b); }
        } else stack.push(Integer.parseInt(t));
    }
    return stack.peek();
}`,
    cpp: `int evalRPN(vector<string>& tokens) {
    stack<int> st;
    for (auto& t : tokens) {
        if (t=="+"||t=="-"||t=="*"||t=="/") {
            int b = st.top(); st.pop();
            int a = st.top(); st.pop();
            if (t=="+") st.push(a+b);
            else if (t=="-") st.push(a-b);
            else if (t=="*") st.push(a*b);
            else st.push(a/b);
        } else st.push(stoi(t));
    }
    return st.top();
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Apply')) return 6; if (s.message?.includes('Push')) return 10; return 3; }
  },

  'largest-rectangle': {
    javascript: `function largestRectangle(heights) {
  const stack = [-1]; let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i < heights.length ? heights[i] : 0;
    while (stack.length > 1 && h < heights[stack.at(-1)]) {
      const height = heights[stack.pop()];
      const width = i - stack.at(-1) - 1;
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}`,
    python: `def largest_rectangle(heights):
    stack, best = [-1], 0
    for i in range(len(heights) + 1):
        h = heights[i] if i < len(heights) else 0
        while len(stack) > 1 and h < heights[stack[-1]]:
            height = heights[stack.pop()]
            width = i - stack[-1] - 1
            best = max(best, height * width)
        stack.append(i)
    return best`,
    java: `int largestRectangle(int[] h) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(-1); int best = 0;
    for (int i = 0; i <= h.length; i++) {
        int cur = i < h.length ? h[i] : 0;
        while (stack.size() > 1 && cur < h[stack.peek()])
            { int height = h[stack.pop()]; best = Math.max(best, height*(i-stack.peek()-1)); }
        stack.push(i);
    }
    return best;
}`,
    cpp: `int largestRectangle(vector<int>& h) {
    stack<int> st; st.push(-1); int best = 0;
    for (int i = 0; i <= h.size(); i++) {
        int cur = i < h.size() ? h[i] : 0;
        while (st.size() > 1 && cur < h[st.top()])
            { int height = h[st.top()]; st.pop(); best = max(best, height*(i-st.top()-1)); }
        st.push(i);
    }
    return best;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Pop')) return 6; if (s.message?.includes('area')) return 8; return 5; }
  },

  'sliding-window-max': {
    javascript: `function maxSlidingWindow(nums, k) {
  const deque = [], result = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] <= i - k) deque.shift();
    while (deque.length && nums[deque.at(-1)] < nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}`,
    python: `from collections import deque
def max_sliding_window(nums, k):
    dq, result = deque(), []
    for i, n in enumerate(nums):
        while dq and dq[0] <= i - k: dq.popleft()
        while dq and nums[dq[-1]] < n: dq.pop()
        dq.append(i)
        if i >= k - 1: result.append(nums[dq[0]])
    return result`,
    java: `int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] res = new int[nums.length - k + 1]; int ri = 0;
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i-k) dq.pollFirst();
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k-1) res[ri++] = nums[dq.peekFirst()];
    }
    return res;
}`,
    cpp: `vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq; vector<int> res;
    for (int i = 0; i < nums.size(); i++) {
        while (!dq.empty() && dq.front() <= i-k) dq.pop_front();
        while (!dq.empty() && nums[dq.back()] < nums[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k-1) res.push_back(nums[dq.front()]);
    }
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Remove')) return 4; if (s.message?.includes('max')) return 7; return 3; }
  },

  // ━━━━━━━━━━ BINARY SEARCH (ADDITIONAL) ━━━━━━━━━━
  'search-insert': {
    javascript: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return lo;
}`,
    python: `def search_insert(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return lo`,
    java: `int searchInsert(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return lo;
}`,
    cpp: `int searchInsert(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return lo;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.found !== undefined) return 5; if (s.message?.includes('Mid')) return 4; return 3; }
  },

  'search-rotated': {
    javascript: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    python: `def search(nums, target):
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
    java: `int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (target >= nums[lo] && target < nums[mid]) hi = mid-1;
            else lo = mid+1;
        } else {
            if (target > nums[mid] && target <= nums[hi]) lo = mid+1;
            else hi = mid-1;
        }
    }
    return -1;
}`,
    cpp: `int search(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (target >= nums[lo] && target < nums[mid]) hi = mid-1;
            else lo = mid+1;
        } else {
            if (target > nums[mid] && target <= nums[hi]) lo = mid+1;
            else hi = mid-1;
        }
    }
    return -1;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.found !== undefined) return 5; if (s.message?.includes('sorted half')) return 6; return 4; }
  },

  'find-peak': {
    javascript: `function findPeak(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,
    python: `def find_peak(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]: lo = mid + 1
        else: hi = mid
    return lo`,
    java: `int findPeak(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
    cpp: `int findPeak(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('climb')) return 5; if (s.message?.includes('descend')) return 6; return 4; }
  },

  'find-min-rotated': {
    javascript: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}`,
    python: `def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]: lo = mid + 1
        else: hi = mid
    return nums[lo]`,
    java: `int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,
    cpp: `int findMin(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('right half')) return 5; if (s.message?.includes('left half')) return 6; return 4; }
  },

  // ━━━━━━━━━━ BACKTRACKING ━━━━━━━━━━
  'permutations': {
    javascript: `function permute(nums) {
  const res = [];
  function bt(cur, rem) {
    if (!rem.length) { res.push([...cur]); return; }
    for (let i = 0; i < rem.length; i++) {
      cur.push(rem[i]);
      bt(cur, [...rem.slice(0,i),...rem.slice(i+1)]);
      cur.pop();
    }
  }
  bt([], nums); return res;
}`,
    python: `def permute(nums):
    res = []
    def bt(cur, rem):
        if not rem: res.append(cur[:]); return
        for i in range(len(rem)):
            cur.append(rem[i])
            bt(cur, rem[:i]+rem[i+1:])
            cur.pop()
    bt([], nums); return res`,
    java: `List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    bt(res, new ArrayList<>(), nums, new boolean[nums.length]);
    return res;
}
void bt(List<List<Integer>> res, List<Integer> cur, int[] nums, boolean[] used) {
    if (cur.size() == nums.length) { res.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; cur.add(nums[i]);
        bt(res, cur, nums, used);
        cur.remove(cur.size()-1); used[i] = false;
    }
}`,
    cpp: `vector<vector<int>> permute(vector<int>& nums) {
    vector<vector<int>> res;
    sort(nums.begin(), nums.end());
    do { res.push_back(nums); }
    while (next_permutation(nums.begin(), nums.end()));
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Choose')) return 5; if (s.message?.includes('Record')) return 4; return 3; }
  },

  // ━━━━━━━━━━ MATRIX ━━━━━━━━━━
  'spiral-matrix': {
    javascript: `function spiralOrder(matrix) {
  const res = [];
  let t=0, b=matrix.length-1, l=0, r=matrix[0].length-1;
  while (t<=b && l<=r) {
    for (let i=l;i<=r;i++) res.push(matrix[t][i]); t++;
    for (let i=t;i<=b;i++) res.push(matrix[i][r]); r--;
    if (t<=b) { for (let i=r;i>=l;i--) res.push(matrix[b][i]); b--; }
    if (l<=r) { for (let i=b;i>=t;i--) res.push(matrix[i][l]); l++; }
  }
  return res;
}`,
    python: `def spiral_order(matrix):
    res = []; t,b,l,r = 0,len(matrix)-1,0,len(matrix[0])-1
    while t<=b and l<=r:
        for i in range(l,r+1): res.append(matrix[t][i]); t+=1
        for i in range(t,b+1): res.append(matrix[i][r]); r-=1
        if t<=b:
            for i in range(r,l-1,-1): res.append(matrix[b][i]); b-=1
        if l<=r:
            for i in range(b,t-1,-1): res.append(matrix[i][l]); l+=1
    return res`,
    java: `List<Integer> spiralOrder(int[][] m) {
    List<Integer> res = new ArrayList<>();
    int t=0,b=m.length-1,l=0,r=m[0].length-1;
    while (t<=b && l<=r) {
        for (int i=l;i<=r;i++) res.add(m[t][i]); t++;
        for (int i=t;i<=b;i++) res.add(m[i][r]); r--;
        if (t<=b) { for (int i=r;i>=l;i--) res.add(m[b][i]); b--; }
        if (l<=r) { for (int i=b;i>=t;i--) res.add(m[i][l]); l++; }
    }
    return res;
}`,
    cpp: `vector<int> spiralOrder(vector<vector<int>>& m) {
    vector<int> res;
    int t=0,b=m.size()-1,l=0,r=m[0].size()-1;
    while (t<=b && l<=r) {
        for (int i=l;i<=r;i++) res.push_back(m[t][i]); t++;
        for (int i=t;i<=b;i++) res.push_back(m[i][r]); r--;
        if (t<=b) { for (int i=r;i>=l;i--) res.push_back(m[b][i]); b--; }
        if (l<=r) { for (int i=b;i>=t;i--) res.push_back(m[i][l]); l++; }
    }
    return res;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('right')) return 5; if (s.message?.includes('down')) return 6; return 4; }
  },

  'rotate-image': {
    javascript: `function rotate(matrix) {
  const n = matrix.length;
  // Transpose
  for (let i=0;i<n;i++)
    for (let j=i+1;j<n;j++)
      [matrix[i][j],matrix[j][i]]=[matrix[j][i],matrix[i][j]];
  // Reverse each row
  for (let i=0;i<n;i++) matrix[i].reverse();
}`,
    python: `def rotate(matrix):
    n = len(matrix)
    # Transpose
    for i in range(n):
        for j in range(i+1,n):
            matrix[i][j],matrix[j][i]=matrix[j][i],matrix[i][j]
    # Reverse each row
    for row in matrix: row.reverse()`,
    java: `void rotate(int[][] m) {
    int n = m.length;
    for (int i=0;i<n;i++)
        for (int j=i+1;j<n;j++)
            { int t=m[i][j]; m[i][j]=m[j][i]; m[j][i]=t; }
    for (int[] row : m) {
        int l=0,r=n-1;
        while(l<r){int t=row[l];row[l]=row[r];row[r]=t;l++;r--;}
    }
}`,
    cpp: `void rotate(vector<vector<int>>& m) {
    int n = m.size();
    for (int i=0;i<n;i++)
        for (int j=i+1;j<n;j++) swap(m[i][j],m[j][i]);
    for (auto& row : m) reverse(row.begin(),row.end());
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Transpose')) return 4; if (s.message?.includes('Reverse')) return 7; return 3; }
  },

  'set-matrix-zeroes': {
    javascript: `function setZeroes(matrix) {
  const m=matrix.length, n=matrix[0].length;
  const rows=new Set(), cols=new Set();
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++)
      if (matrix[i][j]===0) { rows.add(i); cols.add(j); }
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++)
      if (rows.has(i)||cols.has(j)) matrix[i][j]=0;
}`,
    python: `def set_zeroes(matrix):
    m,n = len(matrix),len(matrix[0])
    rows,cols = set(),set()
    for i in range(m):
        for j in range(n):
            if matrix[i][j]==0: rows.add(i); cols.add(j)
    for i in range(m):
        for j in range(n):
            if i in rows or j in cols: matrix[i][j]=0`,
    java: `void setZeroes(int[][] matrix) {
    int m=matrix.length,n=matrix[0].length;
    Set<Integer> rows=new HashSet<>(),cols=new HashSet<>();
    for (int i=0;i<m;i++)
        for (int j=0;j<n;j++)
            if (matrix[i][j]==0){rows.add(i);cols.add(j);}
    for (int i=0;i<m;i++)
        for (int j=0;j<n;j++)
            if (rows.contains(i)||cols.contains(j)) matrix[i][j]=0;
}`,
    cpp: `void setZeroes(vector<vector<int>>& m) {
    set<int> rows,cols;
    for (int i=0;i<m.size();i++)
        for (int j=0;j<m[0].size();j++)
            if (m[i][j]==0){rows.insert(i);cols.insert(j);}
    for (int i=0;i<m.size();i++)
        for (int j=0;j<m[0].size();j++)
            if (rows.count(i)||cols.count(j)) m[i][j]=0;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('zero')) return 6; if (s.message?.includes('Set')) return 8; return 4; }
  },

  // ━━━━━━━━━━ DP (ADDITIONAL) ━━━━━━━━━━
  'dp-lis': {
    javascript: `function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  for (let i=1;i<nums.length;i++)
    for (let j=0;j<i;j++)
      if (nums[j]<nums[i]) dp[i]=Math.max(dp[i],dp[j]+1);
  return Math.max(...dp);
}`,
    python: `def length_of_lis(nums):
    dp = [1]*len(nums)
    for i in range(1,len(nums)):
        for j in range(i):
            if nums[j]<nums[i]: dp[i]=max(dp[i],dp[j]+1)
    return max(dp)`,
    java: `int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length]; Arrays.fill(dp,1);
    for (int i=1;i<nums.length;i++)
        for (int j=0;j<i;j++)
            if (nums[j]<nums[i]) dp[i]=Math.max(dp[i],dp[j]+1);
    return Arrays.stream(dp).max().getAsInt();
}`,
    cpp: `int lengthOfLIS(vector<int>& nums) {
    vector<int> dp(nums.size(),1);
    for (int i=1;i<nums.size();i++)
        for (int j=0;j<i;j++)
            if (nums[j]<nums[i]) dp[i]=max(dp[i],dp[j]+1);
    return *max_element(dp.begin(),dp.end());
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 5; return 3; }
  },

  'dp-house-robber': {
    javascript: `function rob(nums) {
  let prev2=0, prev1=0;
  for (const n of nums) {
    const cur = Math.max(prev1, prev2 + n);
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}`,
    python: `def rob(nums):
    prev2 = prev1 = 0
    for n in nums:
        cur = max(prev1, prev2 + n)
        prev2, prev1 = prev1, cur
    return prev1`,
    java: `int rob(int[] nums) {
    int prev2=0,prev1=0;
    for (int n:nums){int c=Math.max(prev1,prev2+n);prev2=prev1;prev1=c;}
    return prev1;
}`,
    cpp: `int rob(vector<int>& nums) {
    int prev2=0,prev1=0;
    for (int n:nums){int c=max(prev1,prev2+n);prev2=prev1;prev1=c;}
    return prev1;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 4; return 3; }
  },

  'dp-coin-change': {
    javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount+1).fill(Infinity);
  dp[0] = 0;
  for (let i=1;i<=amount;i++)
    for (const c of coins)
      if (c<=i) dp[i] = Math.min(dp[i], dp[i-c]+1);
  return dp[amount]===Infinity ? -1 : dp[amount];
}`,
    python: `def coin_change(coins, amount):
    dp = [float('inf')]*(amount+1)
    dp[0] = 0
    for i in range(1,amount+1):
        for c in coins:
            if c<=i: dp[i]=min(dp[i],dp[i-c]+1)
    return dp[amount] if dp[amount]!=float('inf') else -1`,
    java: `int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount+1]; Arrays.fill(dp,amount+1);
    dp[0]=0;
    for (int i=1;i<=amount;i++)
        for (int c:coins)
            if (c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
    return dp[amount]>amount?-1:dp[amount];
}`,
    cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount+1,amount+1); dp[0]=0;
    for (int i=1;i<=amount;i++)
        for (int c:coins)
            if (c<=i) dp[i]=min(dp[i],dp[i-c]+1);
    return dp[amount]>amount?-1:dp[amount];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 6; return 4; }
  },

  'dp-lcs': {
    javascript: `function longestCommonSubsequence(s1, s2) {
  const m=s1.length, n=s2.length;
  const dp = Array(m+1).fill(null).map(()=>Array(n+1).fill(0));
  for (let i=1;i<=m;i++)
    for (let j=1;j<=n;j++)
      dp[i][j] = s1[i-1]===s2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}`,
    python: `def lcs(s1, s2):
    m,n = len(s1),len(s2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1,m+1):
        for j in range(1,n+1):
            dp[i][j] = dp[i-1][j-1]+1 if s1[i-1]==s2[j-1] else max(dp[i-1][j],dp[i][j-1])
    return dp[m][n]`,
    java: `int lcs(String s1, String s2) {
    int m=s1.length(),n=s2.length();
    int[][] dp=new int[m+1][n+1];
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=s1.charAt(i-1)==s2.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,
    cpp: `int lcs(string s1, string s2) {
    int m=s1.size(),n=s2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1,0));
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=s1[i-1]==s2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 6; return 4; }
  },

  'dp-edit-distance': {
    javascript: `function minDistance(w1, w2) {
  const m=w1.length, n=w2.length;
  const dp=Array(m+1).fill(null).map((_,i)=>Array(n+1).fill(0).map((_,j)=>i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++)
    for (let j=1;j<=n;j++)
      dp[i][j] = w1[i-1]===w2[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}`,
    python: `def min_distance(w1, w2):
    m,n = len(w1),len(w2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1): dp[i][0]=i
    for j in range(n+1): dp[0][j]=j
    for i in range(1,m+1):
        for j in range(1,n+1):
            dp[i][j]=dp[i-1][j-1] if w1[i-1]==w2[j-1] else 1+min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[m][n]`,
    java: `int minDistance(String w1, String w2) {
    int m=w1.length(),n=w2.length();
    int[][] dp=new int[m+1][n+1];
    for (int i=0;i<=m;i++) dp[i][0]=i;
    for (int j=0;j<=n;j++) dp[0][j]=j;
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=w1.charAt(i-1)==w2.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j],Math.min(dp[i][j-1],dp[i-1][j-1]));
    return dp[m][n];
}`,
    cpp: `int minDistance(string w1, string w2) {
    int m=w1.size(),n=w2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1));
    for (int i=0;i<=m;i++) dp[i][0]=i;
    for (int j=0;j<=n;j++) dp[0][j]=j;
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=w1[i-1]==w2[j-1]?dp[i-1][j-1]:1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});
    return dp[m][n];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 6; return 4; }
  },

  'dp-unique-paths': {
    javascript: `function uniquePaths(m, n) {
  const dp=Array(m).fill(null).map(()=>Array(n).fill(1));
  for (let i=1;i<m;i++)
    for (let j=1;j<n;j++)
      dp[i][j]=dp[i-1][j]+dp[i][j-1];
  return dp[m-1][n-1];
}`,
    python: `def unique_paths(m, n):
    dp = [[1]*n for _ in range(m)]
    for i in range(1,m):
        for j in range(1,n):
            dp[i][j]=dp[i-1][j]+dp[i][j-1]
    return dp[m-1][n-1]`,
    java: `int uniquePaths(int m, int n) {
    int[][] dp=new int[m][n];
    for (int[] r:dp) Arrays.fill(r,1);
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) dp[i][j]=dp[i-1][j]+dp[i][j-1];
    return dp[m-1][n-1];
}`,
    cpp: `int uniquePaths(int m, int n) {
    vector<vector<int>> dp(m,vector<int>(n,1));
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) dp[i][j]=dp[i-1][j]+dp[i][j-1];
    return dp[m-1][n-1];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 5; return 3; }
  },

  'dp-min-path-sum': {
    javascript: `function minPathSum(grid) {
  const m=grid.length, n=grid[0].length;
  for (let i=1;i<m;i++) grid[i][0]+=grid[i-1][0];
  for (let j=1;j<n;j++) grid[0][j]+=grid[0][j-1];
  for (let i=1;i<m;i++)
    for (let j=1;j<n;j++)
      grid[i][j]+=Math.min(grid[i-1][j],grid[i][j-1]);
  return grid[m-1][n-1];
}`,
    python: `def min_path_sum(grid):
    m,n = len(grid),len(grid[0])
    for i in range(1,m): grid[i][0]+=grid[i-1][0]
    for j in range(1,n): grid[0][j]+=grid[0][j-1]
    for i in range(1,m):
        for j in range(1,n):
            grid[i][j]+=min(grid[i-1][j],grid[i][j-1])
    return grid[m-1][n-1]`,
    java: `int minPathSum(int[][] g) {
    int m=g.length,n=g[0].length;
    for (int i=1;i<m;i++) g[i][0]+=g[i-1][0];
    for (int j=1;j<n;j++) g[0][j]+=g[0][j-1];
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) g[i][j]+=Math.min(g[i-1][j],g[i][j-1]);
    return g[m-1][n-1];
}`,
    cpp: `int minPathSum(vector<vector<int>>& g) {
    int m=g.size(),n=g[0].size();
    for (int i=1;i<m;i++) g[i][0]+=g[i-1][0];
    for (int j=1;j<n;j++) g[0][j]+=g[0][j-1];
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) g[i][j]+=min(g[i-1][j],g[i][j-1]);
    return g[m-1][n-1];
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('dp[')) return 7; return 5; }
  },

  // ━━━━━━━━━━ GREEDY ━━━━━━━━━━
  'jump-game-ii': {
    javascript: `function jump(nums) {
  let jumps=0, end=0, farthest=0;
  for (let i=0;i<nums.length-1;i++) {
    farthest = Math.max(farthest, i+nums[i]);
    if (i===end) { jumps++; end=farthest; }
  }
  return jumps;
}`,
    python: `def jump(nums):
    jumps=end=farthest=0
    for i in range(len(nums)-1):
        farthest=max(farthest,i+nums[i])
        if i==end: jumps+=1; end=farthest
    return jumps`,
    java: `int jump(int[] nums) {
    int jumps=0,end=0,farthest=0;
    for (int i=0;i<nums.length-1;i++){
        farthest=Math.max(farthest,i+nums[i]);
        if (i==end){jumps++;end=farthest;}
    }
    return jumps;
}`,
    cpp: `int jump(vector<int>& nums) {
    int jumps=0,end=0,farthest=0;
    for (int i=0;i<nums.size()-1;i++){
        farthest=max(farthest,i+nums[i]);
        if (i==end){jumps++;end=farthest;}
    }
    return jumps;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Jump')) return 5; return 4; }
  },

  'gas-station': {
    javascript: `function canCompleteCircuit(gas, cost) {
  let total=0, tank=0, start=0;
  for (let i=0;i<gas.length;i++) {
    const net = gas[i]-cost[i];
    total += net; tank += net;
    if (tank < 0) { start=i+1; tank=0; }
  }
  return total>=0 ? start : -1;
}`,
    python: `def can_complete_circuit(gas, cost):
    total=tank=start=0
    for i in range(len(gas)):
        net = gas[i]-cost[i]
        total+=net; tank+=net
        if tank<0: start=i+1; tank=0
    return start if total>=0 else -1`,
    java: `int canCompleteCircuit(int[] gas, int[] cost) {
    int total=0,tank=0,start=0;
    for (int i=0;i<gas.length;i++){
        int net=gas[i]-cost[i]; total+=net; tank+=net;
        if (tank<0){start=i+1;tank=0;}
    }
    return total>=0?start:-1;
}`,
    cpp: `int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
    int total=0,tank=0,start=0;
    for (int i=0;i<gas.size();i++){
        int net=gas[i]-cost[i]; total+=net; tank+=net;
        if (tank<0){start=i+1;tank=0;}
    }
    return total>=0?start:-1;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Reset')) return 6; if (s.message?.includes('net')) return 4; return 3; }
  },

  // ━━━━━━━━━━ GRAPH (ADDITIONAL) ━━━━━━━━━━
  'number-of-islands': {
    javascript: `function numIslands(grid) {
  let count = 0;
  for (let i=0;i<grid.length;i++)
    for (let j=0;j<grid[0].length;j++)
      if (grid[i][j]==='1') { count++; dfs(grid,i,j); }
  return count;
}
function dfs(g,i,j) {
  if (i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]!=='1') return;
  g[i][j]='0';
  dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,
    python: `def num_islands(grid):
    count = 0
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j]=='1': count+=1; dfs(grid,i,j)
    return count
def dfs(g,i,j):
    if i<0 or j<0 or i>=len(g) or j>=len(g[0]) or g[i][j]!='1': return
    g[i][j]='0'
    dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1)`,
    java: `int numIslands(char[][] grid) {
    int count = 0;
    for (int i=0;i<grid.length;i++)
        for (int j=0;j<grid[0].length;j++)
            if (grid[i][j]=='1'){count++;dfs(grid,i,j);}
    return count;
}
void dfs(char[][] g,int i,int j){
    if(i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]!='1')return;
    g[i][j]='0';dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,
    cpp: `int numIslands(vector<vector<char>>& grid) {
    int count = 0;
    for (int i=0;i<grid.size();i++)
        for (int j=0;j<grid[0].size();j++)
            if (grid[i][j]=='1'){count++;dfs(grid,i,j);}
    return count;
}
void dfs(vector<vector<char>>& g,int i,int j){
    if(i<0||j<0||i>=g.size()||j>=g[0].size()||g[i][j]!='1')return;
    g[i][j]='0';dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Island')) return 5; if (s.message?.includes('DFS')) return 9; return 3; }
  },

  'rotting-oranges': {
    javascript: `function orangesRotting(grid) {
  const q=[], m=grid.length, n=grid[0].length;
  let fresh=0;
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++) {
      if (grid[i][j]===2) q.push([i,j]);
      if (grid[i][j]===1) fresh++;
    }
  let mins=0;
  while (q.length && fresh) {
    mins++;
    for (let sz=q.length;sz>0;sz--) {
      const [r,c]=q.shift();
      for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr=r+dr,nc=c+dc;
        if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]===1)
          { grid[nr][nc]=2; fresh--; q.push([nr,nc]); }
      }
    }
  }
  return fresh===0?mins:-1;
}`,
    python: `from collections import deque
def oranges_rotting(grid):
    q,m,n,fresh = deque(),len(grid),len(grid[0]),0
    for i in range(m):
        for j in range(n):
            if grid[i][j]==2: q.append((i,j))
            if grid[i][j]==1: fresh+=1
    mins=0
    while q and fresh:
        mins+=1
        for _ in range(len(q)):
            r,c=q.popleft()
            for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr,nc=r+dr,c+dc
                if 0<=nr<m and 0<=nc<n and grid[nr][nc]==1:
                    grid[nr][nc]=2; fresh-=1; q.append((nr,nc))
    return mins if fresh==0 else -1`,
    java: `int orangesRotting(int[][] grid) {
    Queue<int[]> q=new LinkedList<>(); int fresh=0;
    int m=grid.length,n=grid[0].length;
    for (int i=0;i<m;i++) for (int j=0;j<n;j++){
        if (grid[i][j]==2) q.add(new int[]{i,j});
        if (grid[i][j]==1) fresh++; }
    int mins=0; int[][] dirs={{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.isEmpty()&&fresh>0){ mins++;
        for (int sz=q.size();sz>0;sz--){ int[] p=q.poll();
            for (int[] d:dirs){ int nr=p[0]+d[0],nc=p[1]+d[1];
                if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]==1)
                    {grid[nr][nc]=2;fresh--;q.add(new int[]{nr,nc});}}}}
    return fresh==0?mins:-1;
}`,
    cpp: `int orangesRotting(vector<vector<int>>& grid) {
    queue<pair<int,int>> q; int fresh=0;
    int m=grid.size(),n=grid[0].size();
    for (int i=0;i<m;i++) for (int j=0;j<n;j++){
        if (grid[i][j]==2) q.push({i,j});
        if (grid[i][j]==1) fresh++; }
    int mins=0;
    while (!q.empty()&&fresh){ mins++;
        for (int sz=q.size();sz>0;sz--){ auto [r,c]=q.front();q.pop();
            for (auto [dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){
                int nr=r+dr,nc=c+dc;
                if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]==1)
                    {grid[nr][nc]=2;fresh--;q.push({nr,nc});}}}}
    return fresh==0?mins:-1;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('minute')) return 10; if (s.message?.includes('rot')) return 13; return 4; }
  },

  // ━━━━━━━━━━ SORTING (ADDITIONAL) ━━━━━━━━━━
  'heap-sort': {
    javascript: `function heapSort(arr) {
  const n = arr.length;
  for (let i=Math.floor(n/2)-1;i>=0;i--) heapify(arr,n,i);
  for (let i=n-1;i>0;i--) {
    [arr[0],arr[i]]=[arr[i],arr[0]];
    heapify(arr,i,0);
  }
}
function heapify(a,n,i) {
  let largest=i,l=2*i+1,r=2*i+2;
  if (l<n&&a[l]>a[largest]) largest=l;
  if (r<n&&a[r]>a[largest]) largest=r;
  if (largest!==i) { [a[i],a[largest]]=[a[largest],a[i]]; heapify(a,n,largest); }
}`,
    python: `def heap_sort(arr):
    n = len(arr)
    for i in range(n//2-1,-1,-1): heapify(arr,n,i)
    for i in range(n-1,0,-1):
        arr[0],arr[i]=arr[i],arr[0]
        heapify(arr,i,0)
def heapify(a,n,i):
    largest,l,r = i,2*i+1,2*i+2
    if l<n and a[l]>a[largest]: largest=l
    if r<n and a[r]>a[largest]: largest=r
    if largest!=i: a[i],a[largest]=a[largest],a[i]; heapify(a,n,largest)`,
    java: `void heapSort(int[] arr) {
    int n=arr.length;
    for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
    for (int i=n-1;i>0;i--){
        int t=arr[0];arr[0]=arr[i];arr[i]=t;
        heapify(arr,i,0);
    }
}
void heapify(int[] a,int n,int i){
    int lg=i,l=2*i+1,r=2*i+2;
    if (l<n&&a[l]>a[lg]) lg=l; if (r<n&&a[r]>a[lg]) lg=r;
    if (lg!=i){int t=a[i];a[i]=a[lg];a[lg]=t;heapify(a,n,lg);}
}`,
    cpp: `void heapSort(vector<int>& arr) {
    int n=arr.size();
    for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
    for (int i=n-1;i>0;i--){
        swap(arr[0],arr[i]);
        heapify(arr,i,0);
    }
}
void heapify(vector<int>& a,int n,int i){
    int lg=i,l=2*i+1,r=2*i+2;
    if (l<n&&a[l]>a[lg]) lg=l; if (r<n&&a[r]>a[lg]) lg=r;
    if (lg!=i){swap(a[i],a[lg]);heapify(a,n,lg);}
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Heapify')) return 10; if (s.message?.includes('Extract')) return 4; return 3; }
  },

  'counting-sort': {
    javascript: `function countingSort(arr) {
  const max = Math.max(...arr);
  const count = new Array(max+1).fill(0);
  for (const n of arr) count[n]++;
  let idx = 0;
  for (let i=0;i<=max;i++)
    while (count[i]-->0) arr[idx++]=i;
}`,
    python: `def counting_sort(arr):
    mx = max(arr)
    count = [0]*(mx+1)
    for n in arr: count[n]+=1
    idx = 0
    for i in range(mx+1):
        while count[i]>0: arr[idx]=i; idx+=1; count[i]-=1`,
    java: `void countingSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    int[] count = new int[max+1];
    for (int n:arr) count[n]++;
    int idx=0;
    for (int i=0;i<=max;i++) while (count[i]-->0) arr[idx++]=i;
}`,
    cpp: `void countingSort(vector<int>& arr) {
    int mx = *max_element(arr.begin(),arr.end());
    vector<int> count(mx+1,0);
    for (int n:arr) count[n]++;
    int idx=0;
    for (int i=0;i<=mx;i++) while (count[i]-->0) arr[idx++]=i;
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Count')) return 4; if (s.message?.includes('Place')) return 6; return 3; }
  },

  'radix-sort': {
    javascript: `function radixSort(arr) {
  const max = Math.max(...arr);
  for (let exp=1; Math.floor(max/exp)>0; exp*=10) {
    const buckets = Array.from({length:10},()=>[]);
    for (const n of arr) buckets[Math.floor(n/exp)%10].push(n);
    let idx=0;
    for (const b of buckets) for (const n of b) arr[idx++]=n;
  }
}`,
    python: `def radix_sort(arr):
    mx = max(arr); exp = 1
    while mx // exp > 0:
        buckets = [[] for _ in range(10)]
        for n in arr: buckets[(n//exp)%10].append(n)
        idx = 0
        for b in buckets:
            for n in b: arr[idx]=n; idx+=1
        exp *= 10`,
    java: `void radixSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    for (int exp=1;max/exp>0;exp*=10) {
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i=0;i<10;i++) buckets.add(new ArrayList<>());
        for (int n:arr) buckets.get((n/exp)%10).add(n);
        int idx=0;
        for (var b:buckets) for (int n:b) arr[idx++]=n;
    }
}`,
    cpp: `void radixSort(vector<int>& arr) {
    int mx = *max_element(arr.begin(),arr.end());
    for (int exp=1;mx/exp>0;exp*=10) {
        vector<vector<int>> buckets(10);
        for (int n:arr) buckets[(n/exp)%10].push_back(n);
        int idx=0;
        for (auto& b:buckets) for (int n:b) arr[idx++]=n;
    }
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('digit')) return 4; if (s.message?.includes('Collect')) return 6; return 3; }
  },

  'sort-colors': {
    javascript: `function sortColors(nums) {
  let lo=0, mid=0, hi=nums.length-1;
  while (mid <= hi) {
    if (nums[mid]===0) { [nums[lo],nums[mid]]=[nums[mid],nums[lo]]; lo++; mid++; }
    else if (nums[mid]===1) mid++;
    else { [nums[mid],nums[hi]]=[nums[hi],nums[mid]]; hi--; }
  }
}`,
    python: `def sort_colors(nums):
    lo,mid,hi = 0,0,len(nums)-1
    while mid <= hi:
        if nums[mid]==0: nums[lo],nums[mid]=nums[mid],nums[lo]; lo+=1; mid+=1
        elif nums[mid]==1: mid+=1
        else: nums[mid],nums[hi]=nums[hi],nums[mid]; hi-=1`,
    java: `void sortColors(int[] nums) {
    int lo=0,mid=0,hi=nums.length-1;
    while (mid<=hi) {
        if (nums[mid]==0) {int t=nums[lo];nums[lo]=nums[mid];nums[mid]=t;lo++;mid++;}
        else if (nums[mid]==1) mid++;
        else {int t=nums[mid];nums[mid]=nums[hi];nums[hi]=t;hi--;}
    }
}`,
    cpp: `void sortColors(vector<int>& nums) {
    int lo=0,mid=0,hi=nums.size()-1;
    while (mid<=hi) {
        if (nums[mid]==0) swap(nums[lo++],nums[mid++]);
        else if (nums[mid]==1) mid++;
        else swap(nums[mid],nums[hi--]);
    }
}`,
    stepToLine: (s) => { if (!s) return -1; if (s.message?.includes('Swap')) return 4; return 3; }
  },
};

// Supported languages list for the UI dropdown
export const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: 'JS' },
  { id: 'python',     label: 'Python',     icon: 'PY' },
  { id: 'java',       label: 'Java',       icon: 'JV' },
  { id: 'cpp',        label: 'C++',        icon: 'C+' },
];
