// ══════════════════════════════════════════════════════════════════════
// Granular Array & String Patterns — sub-categorized per user spec
// ══════════════════════════════════════════════════════════════════════

export const dsaPatternsArrayString = [

    // ═══════════════════════════════════════════
    //  A R R A Y  —  S L I D I N G   W I N D O W
    // ═══════════════════════════════════════════

    // ── A1 · Sliding Window — Fixed Size ──
    {
        id: "sw-fixed-size",
        name: "Sliding Window — Fixed Size",
        category: "Array · Sliding Window",
        difficulty: "Easy",
        description: "Maintain a window of exactly size k. Slide it one position at a time, updating the aggregate (sum, max, count) in O(1) per step.",
        theory: `
### Intuition
When the problem says "subarray of size k", think fixed window.  
Compute the first window fully, then **slide**: add the new right element, remove the old left element.

### Template
\`\`\`python
window_sum = sum(arr[:k])
best = window_sum
for i in range(k, n):
    window_sum += arr[i] - arr[i - k]
    best = max(best, window_sum)
return best
\`\`\`

### Key Idea
You never recompute the full window — you **adjust** it in O(1).  
Works for sum, count, XOR, product (with care for zeros).

### When to Use
- "Maximum / minimum sum of subarray of size k"
- "Number of distinct elements in every window of size k"
- "Maximum of every contiguous subarray of size k" (+ monotonic deque)

### Complexity
- Time: O(n) — each element enters and leaves the window once
- Space: O(1) extra for sum; O(k) if you track a frequency map
`,
        examples: [
            "Maximum sum of subarray of size k",
            "First negative in every window of size k",
            "Count distinct elements in every window of size k",
        ],
        problems: [
            { id: "max-avg-subarray", title: "Maximum Average Subarray I", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-average-subarray-i/", link: "/problem/max-avg-subarray" },
            { id: "max-sum-distinct-k", title: "Maximum Sum of Distinct Subarrays With Length K", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/", link: "/problem/max-sum-distinct-k" },
            { id: "grumpy-bookstore", title: "Grumpy Bookstore Owner", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/grumpy-bookstore-owner/", link: "/problem/grumpy-bookstore" },
            { id: "max-points-from-cards", title: "Maximum Points You Can Obtain from Cards", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/", link: "/problem/max-points-from-cards" },
        ],
    },

    // ── A2 · Sliding Window — Variable Size (Expand–Shrink) ──
    {
        id: "sw-variable-expand-shrink",
        name: "Sliding Window — Variable (Expand–Shrink)",
        category: "Array · Sliding Window",
        difficulty: "Medium",
        description: "Grow the right pointer to include more elements; shrink the left pointer when a constraint breaks. Finds the longest/shortest subarray meeting a condition.",
        theory: `
### Intuition
Two pointers [left, right). **Expand** right to satisfy / accumulate.  
**Shrink** left when the window violates the constraint.  
Answer = longest or shortest valid window seen.

### Template — Longest Valid Window
\`\`\`python
left = 0
for right in range(n):
    # expand: add arr[right] to state
    while window_is_invalid():
        # shrink: remove arr[left] from state
        left += 1
    best = max(best, right - left + 1)
\`\`\`

### Template — Shortest Valid Window
\`\`\`python
left = 0
for right in range(n):
    # expand: add arr[right]
    while window_is_valid():
        best = min(best, right - left + 1)
        # shrink: remove arr[left]
        left += 1
\`\`\`

### When to Use
- "Longest subarray with at most k distinct elements"
- "Smallest subarray with sum ≥ target"
- "Longest substring without repeating characters"
- Any problem asking for longest / shortest contiguous segment meeting a rule

### Why It's O(n)
Left pointer only moves forward — each element is added and removed at most once.
`,
        examples: [
            "Longest substring without repeating characters",
            "Minimum size subarray sum ≥ target",
            "Longest subarray with at most k distinct",
            "Fruits into baskets (at most 2 types)",
        ],
        problems: [
            { id: "longest-substr-no-repeat", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", link: "/problem/longest-substr-no-repeat" },
            { id: "min-size-subarray-sum", title: "Minimum Size Subarray Sum", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/minimum-size-subarray-sum/", link: "/problem/min-size-subarray-sum" },
            { id: "fruits-into-baskets", title: "Fruit Into Baskets", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/fruit-into-baskets/", link: "/problem/fruits-into-baskets" },
            { id: "longest-repeating-char-replace", title: "Longest Repeating Character Replacement", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-repeating-character-replacement/", link: "/problem/longest-repeating-char-replace" },
            { id: "max-consecutive-ones-iii", title: "Max Consecutive Ones III", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/max-consecutive-ones-iii/", link: "/problem/max-consecutive-ones-iii" },
        ],
    },

    // ── A3 · Sliding Window — Monotonic Window ──
    {
        id: "sw-monotonic-window",
        name: "Sliding Window — Monotonic Window",
        category: "Array · Sliding Window",
        difficulty: "Hard",
        description: "Combine a sliding window with a monotonic deque to track the running min/max inside the window in O(1) amortized per step.",
        theory: `
### Intuition
A standard window can track sum easily, but min/max in O(1) needs a **monotonic deque**:  
- Maintain decreasing deque for max (front = current max)
- Maintain increasing deque for min (front = current min)
- On slide, pop expired indices from front; pop dominated values from back before push.

### Template — Sliding Window Maximum
\`\`\`python
from collections import deque
dq = deque()              # stores indices
result = []
for i in range(n):
    while dq and dq[0] < i - k + 1:
        dq.popleft()       # expired
    while dq and arr[dq[-1]] <= arr[i]:
        dq.pop()           # dominated
    dq.append(i)
    if i >= k - 1:
        result.append(arr[dq[0]])
\`\`\`

### When to Use
- "Maximum / minimum of every window of size k"
- "Longest subarray where max - min ≤ limit"
- "Shortest subarray with OR at least k" (variant)

### Complexity
Each element enters and leaves the deque at most once → **O(n)** total.
`,
        examples: [
            "Sliding window maximum",
            "Longest subarray with absolute diff ≤ limit",
            "Jump game VI (DP + monotonic deque)",
        ],
        problems: [
            { id: "sw-maximum", title: "Sliding Window Maximum", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/sliding-window-maximum/", link: "/problem/sw-maximum" },
            { id: "longest-subarray-abs-diff", title: "Longest Subarray With Absolute Diff ≤ Limit", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/", link: "/problem/longest-subarray-abs-diff" },
            { id: "jump-game-vi", title: "Jump Game VI", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/jump-game-vi/", link: "/problem/jump-game-vi" },
            { id: "shortest-subarray-sum-k", title: "Shortest Subarray with Sum at Least K", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/", link: "/problem/shortest-subarray-sum-k" },
        ],
    },

    // ═══════════════════════════════════════════
    //  A R R A Y  —  T W O   P O I N T E R
    // ═══════════════════════════════════════════

    // ── A4 · Two Pointer — Opposite Ends (left + right) ──
    {
        id: "tp-opposite-ends",
        name: "Two Pointer — Opposite Ends",
        category: "Array · Two Pointer",
        difficulty: "Easy",
        description: "Start one pointer at the beginning and one at the end, move them toward each other based on a condition — ideal for sorted arrays and pair problems.",
        theory: `
### Intuition
For a **sorted** array, if current pair sum < target → move left pointer right (need bigger).  
If sum > target → move right pointer left (need smaller).  
Converge until they meet.

### Template — Two Sum (sorted)
\`\`\`python
left, right = 0, n - 1
while left < right:
    s = arr[left] + arr[right]
    if s == target: return [left, right]
    elif s < target: left += 1
    else: right -= 1
\`\`\`

### When to Use
- Two sum in sorted array
- Container with most water
- Trapping rain water (two-pointer variant)
- Valid palindrome
- 3Sum (fix one, two-pointer on rest)

### Complexity
O(n) — each pointer moves at most n steps total.
`,
        examples: [
            "Two sum II (sorted input)",
            "Container with most water",
            "Trapping rain water",
            "Valid palindrome",
        ],
        problems: [
            { id: "two-sum-sorted", title: "Two Sum II - Sorted", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", link: "/problem/two-sum-sorted" },
            { id: "container-most-water", title: "Container With Most Water", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/container-with-most-water/", link: "/problem/container-most-water" },
            { id: "trapping-rain-tp", title: "Trapping Rain Water", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/trapping-rain-water/", link: "/problem/trapping-rain-tp" },
            { id: "valid-palindrome-tp", title: "Valid Palindrome", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/valid-palindrome/", link: "/problem/valid-palindrome-tp" },
        ],
    },

    // ── A5 · Two Pointer — Same Direction (Fast & Slow) ──
    {
        id: "tp-fast-slow",
        name: "Two Pointer — Fast & Slow",
        category: "Array · Two Pointer",
        difficulty: "Medium",
        description: "Both pointers start at the same end and move in the same direction at different speeds — used for cycle detection, in-place removal, and partitioning.",
        theory: `
### Intuition
**Slow** pointer marks the "write" position or the tortoise.  
**Fast** pointer scans ahead — the hare.

### Linked List Cycle (Floyd's)
\`\`\`
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast: return True   # cycle!
\`\`\`

### Array — Remove Duplicates In-Place
\`\`\`python
slow = 1
for fast in range(1, n):
    if arr[fast] != arr[fast - 1]:
        arr[slow] = arr[fast]
        slow += 1
return slow
\`\`\`

### When to Use
- Linked list cycle detection and cycle start
- Remove duplicates from sorted array
- Move zeroes to end
- Middle of linked list
- Happy number (cycle in digit-sum sequence)
`,
        examples: [
            "Linked list cycle detection",
            "Remove duplicates from sorted array",
            "Move zeroes",
            "Middle of the linked list",
        ],
        problems: [
            { id: "linked-list-cycle-fs", title: "Linked List Cycle", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/linked-list-cycle/", link: "/problem/linked-list-cycle-fs" },
            { id: "remove-dups-sorted-fs", title: "Remove Duplicates from Sorted Array", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", link: "/problem/remove-dups-sorted-fs" },
            { id: "move-zeroes-fs", title: "Move Zeroes", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/move-zeroes/", link: "/problem/move-zeroes-fs" },
            { id: "middle-linked-list", title: "Middle of the Linked List", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/middle-of-the-linked-list/", link: "/problem/middle-linked-list" },
            { id: "happy-number-fs", title: "Happy Number", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/happy-number/", link: "/problem/happy-number-fs" },
        ],
    },

    // ── A6 · Two Pointer — Partition / Dutch National Flag ──
    {
        id: "tp-partition-dutch-flag",
        name: "Two Pointer — Partition / Dutch Flag",
        category: "Array · Two Pointer",
        difficulty: "Medium",
        description: "Partition an array into 2 or 3 groups in-place using pointer boundaries — the foundation of quicksort's partition step.",
        theory: `
### 2-Way Partition
\`\`\`python
pivot_idx = 0
for i in range(n):
    if arr[i] < pivot:
        swap(arr[pivot_idx], arr[i])
        pivot_idx += 1
\`\`\`

### 3-Way Partition (Dutch National Flag)
Three pointers: low, mid, high.
\`\`\`python
low = mid = 0
high = n - 1
while mid <= high:
    if arr[mid] == 0:
        swap(arr[low], arr[mid]); low += 1; mid += 1
    elif arr[mid] == 1:
        mid += 1
    else:
        swap(arr[mid], arr[high]); high -= 1
\`\`\`

### When to Use
- Sort colors (0, 1, 2)
- Quicksort partition
- Separate negatives and positives
- Segregate even and odd numbers
`,
        examples: [
            "Sort Colors",
            "Move all negatives to one side",
            "Quicksort partition step",
        ],
        problems: [
            { id: "sort-colors-dnf", title: "Sort Colors", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/sort-colors/", link: "/problem/sort-colors-dnf" },
            { id: "sort-array-parity", title: "Sort Array By Parity", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/sort-array-by-parity/", link: "/problem/sort-array-parity" },
            { id: "wiggle-sort-ii", title: "Wiggle Sort II", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/wiggle-sort-ii/", link: "/problem/wiggle-sort-ii" },
        ],
    },

    // ═══════════════════════════════════════════
    //  A R R A Y  —  P R E F I X   B A S E D
    // ═══════════════════════════════════════════

    // ── A7 · Prefix Sum ──
    {
        id: "prefix-sum-array",
        name: "Prefix Sum",
        category: "Array · Prefix Based",
        difficulty: "Easy",
        description: "Precompute cumulative sums so any range sum query [l, r] can be answered in O(1). Combine with hash map for subarray-sum-equals-k type problems.",
        theory: `
### Build
\`\`\`
prefix[0] = 0
prefix[i] = prefix[i-1] + arr[i-1]
sum(l..r) = prefix[r+1] - prefix[l]
\`\`\`

### Subarray Sum Equals K (Prefix + HashMap)
Store frequency of each prefix sum seen so far.  
For each prefix[i], check if (prefix[i] - k) exists in the map.

\`\`\`python
count, curr, seen = 0, 0, {0: 1}
for num in arr:
    curr += num
    count += seen.get(curr - k, 0)
    seen[curr] = seen.get(curr, 0) + 1
\`\`\`

### When to Use
- Range sum queries
- Subarray sum equals k
- Count subarrays with sum divisible by k
- Equilibrium index
`,
        examples: [
            "Range sum query",
            "Subarray sum equals K",
            "Subarray sums divisible by K",
            "Product of array except self",
        ],
        problems: [
            { id: "subarray-sum-k-ps", title: "Subarray Sum Equals K", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/subarray-sum-equals-k/", link: "/problem/subarray-sum-k-ps" },
            { id: "range-sum-immutable", title: "Range Sum Query - Immutable", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/range-sum-query-immutable/", link: "/problem/range-sum-immutable" },
            { id: "subarray-div-k", title: "Subarray Sums Divisible by K", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/subarray-sums-divisible-by-k/", link: "/problem/subarray-div-k" },
            { id: "product-except-self-ps", title: "Product of Array Except Self", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/product-of-array-except-self/", link: "/problem/product-except-self-ps" },
        ],
    },

    // ── A8 · Prefix XOR ──
    {
        id: "prefix-xor",
        name: "Prefix XOR",
        category: "Array · Prefix Based",
        difficulty: "Medium",
        description: "Same idea as prefix sum but using XOR — enables O(1) range XOR queries and finding subarrays with a given XOR.",
        theory: `
### Build
\`\`\`
prefixXor[0] = 0
prefixXor[i] = prefixXor[i-1] ^ arr[i-1]
XOR(l..r) = prefixXor[r+1] ^ prefixXor[l]
\`\`\`

### Subarray with Given XOR
Same hash-map trick as prefix sum.  
For each prefixXor[i], check if (prefixXor[i] ^ target) exists.

### XOR Properties
- a ^ a = 0 (cancellation)
- a ^ 0 = a (identity)
- Associative and commutative

### When to Use
- Count subarrays with XOR equal to k
- Find the original array from prefix XOR
- Maximum XOR subarray (with trie — advanced)
`,
        examples: [
            "Count subarrays with XOR = k",
            "XOR queries of a subarray",
            "Decode XORed array",
        ],
        problems: [
            { id: "xor-queries-subarray", title: "XOR Queries of a Subarray", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/xor-queries-of-a-subarray/", link: "/problem/xor-queries-subarray" },
            { id: "decode-xored-array", title: "Decode XORed Array", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/decode-xored-array/", link: "/problem/decode-xored-array" },
            { id: "count-triplets-xor", title: "Count Triplets That Can Form Two Arrays of Equal XOR", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/count-triplets-that-can-form-two-arrays-of-equal-xor/", link: "/problem/count-triplets-xor" },
        ],
    },

    // ── A9 · 2D Prefix Sum ──
    {
        id: "prefix-2d",
        name: "2D Prefix Sum",
        category: "Array · Prefix Based",
        difficulty: "Medium",
        description: "Extend prefix sums to matrices — precompute a 2D prefix grid to answer any sub-rectangle sum query in O(1).",
        theory: `
### Build
\`\`\`
prefix[i][j] = matrix[i][j]
             + prefix[i-1][j]
             + prefix[i][j-1]
             - prefix[i-1][j-1]
\`\`\`

### Query — Sum of sub-rectangle (r1,c1) to (r2,c2)
\`\`\`
sum = prefix[r2][c2]
    - prefix[r1-1][c2]
    - prefix[r2][c1-1]
    + prefix[r1-1][c1-1]
\`\`\`

### When to Use
- "Sum of sub-matrix"
- "Count sub-matrices with all ones"
- "Maximal square / rectangle in a binary matrix"

### Complexity
Build: O(m × n), Query: O(1)
`,
        examples: [
            "Range sum query 2D",
            "Matrix block sum",
            "Count square submatrices with all ones",
        ],
        problems: [
            { id: "range-sum-2d", title: "Range Sum Query 2D - Immutable", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/range-sum-query-2d-immutable/", link: "/problem/range-sum-2d" },
            { id: "matrix-block-sum", title: "Matrix Block Sum", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/matrix-block-sum/", link: "/problem/matrix-block-sum" },
            { id: "count-square-submatrices", title: "Count Square Submatrices With All Ones", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/count-square-submatrices-with-all-ones/", link: "/problem/count-square-submatrices" },
        ],
    },

    // ═══════════════════════════════════════════
    //  A R R A Y  —  K A D A N E ' S
    // ═══════════════════════════════════════════

    // ── A10 · Kadane's — Max Subarray Sum ──
    {
        id: "kadane-max-sum",
        name: "Kadane's — Maximum Subarray Sum",
        category: "Array · Kadane's / Subarray",
        difficulty: "Medium",
        description: "Find the contiguous subarray with the largest sum in O(n) using Kadane's elegant DP-style greedy approach.",
        theory: `
### Intuition
At each position decide: **extend** the current subarray or **start fresh** here.  
\`current = max(arr[i], current + arr[i])\`

### Template
\`\`\`python
current = best = arr[0]
for i in range(1, n):
    current = max(arr[i], current + arr[i])
    best = max(best, current)
return best
\`\`\`

### Why It Works
If adding arr[i] to the running sum makes it worse than arr[i] alone, discard the prefix.

### Variants
- Return the actual subarray (track start/end indices)
- Circular array: max(normal Kadane, total_sum - min_subarray)
- Maximum sum with at most k elements
`,
        examples: [
            "Maximum subarray (classic Kadane's)",
            "Maximum sum circular subarray",
            "Max subarray sum with at most one deletion",
        ],
        problems: [
            { id: "max-subarray-kadane", title: "Maximum Subarray", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-subarray/", link: "/problem/max-subarray-kadane" },
            { id: "max-sum-circular", title: "Maximum Sum Circular Subarray", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-sum-circular-subarray/", link: "/problem/max-sum-circular" },
            { id: "max-sum-one-deletion", title: "Maximum Subarray Sum With One Deletion", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/", link: "/problem/max-sum-one-deletion" },
        ],
    },

    // ── A11 · Kadane's — Max Product Subarray ──
    {
        id: "kadane-max-product",
        name: "Kadane's — Maximum Product Subarray",
        category: "Array · Kadane's / Subarray",
        difficulty: "Medium",
        description: "Track both running max AND min product (because a negative × negative = positive), updating result at each step.",
        theory: `
### Why Track Min?
A large negative product can become the largest positive when multiplied by another negative.

### Template
\`\`\`python
cur_max = cur_min = result = arr[0]
for i in range(1, n):
    if arr[i] < 0:
        cur_max, cur_min = cur_min, cur_max  # swap!
    cur_max = max(arr[i], cur_max * arr[i])
    cur_min = min(arr[i], cur_min * arr[i])
    result = max(result, cur_max)
return result
\`\`\`

### Edge Cases
- Zeros reset both cur_max and cur_min
- Single negative number → result is that number
- All positives → product of entire array
`,
        examples: [
            "Maximum product subarray",
            "Maximum product of three numbers",
        ],
        problems: [
            { id: "max-product-subarray", title: "Maximum Product Subarray", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-product-subarray/", link: "/problem/max-product-subarray" },
            { id: "max-product-three", title: "Maximum Product of Three Numbers", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-product-of-three-numbers/", link: "/problem/max-product-three" },
        ],
    },

    // ── A12 · Subarray with Given XOR / Sum ──
    {
        id: "subarray-given-xor-sum",
        name: "Subarray with Given XOR / Sum",
        category: "Array · Kadane's / Subarray",
        difficulty: "Medium",
        description: "Count or find subarrays whose XOR or sum equals a target using prefix + hash map in O(n).",
        theory: `
### Core Technique: Prefix + HashMap
For any aggregate \`f\` (sum, XOR), if \`prefix[j] - prefix[i] == target\`, then subarray [i+1..j] has the desired aggregate.  
Store prefix frequencies in a map → for each new prefix, check how many times (prefix - target) appeared.

### Count Subarrays with Sum = K
\`\`\`python
count, curr, seen = 0, 0, {0: 1}
for num in arr:
    curr += num
    count += seen.get(curr - k, 0)
    seen[curr] = seen.get(curr, 0) + 1
\`\`\`

### Count Subarrays with XOR = K
\`\`\`python
count, curr, seen = 0, 0, {0: 1}
for num in arr:
    curr ^= num
    count += seen.get(curr ^ k, 0)
    seen[curr] = seen.get(curr, 0) + 1
\`\`\`

### When to Use
- Count subarrays with sum/xor equal to target
- Longest subarray with sum = 0
- Contiguous array (equal 0s and 1s → treat 0 as -1)
`,
        examples: [
            "Subarray sum equals K",
            "Count subarrays with XOR = K",
            "Contiguous array (equal 0s and 1s)",
            "Longest subarray with sum 0",
        ],
        problems: [
            { id: "subarray-sum-k-map", title: "Subarray Sum Equals K", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/subarray-sum-equals-k/", link: "/problem/subarray-sum-k-map" },
            { id: "contiguous-array-map", title: "Contiguous Array", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/contiguous-array/", link: "/problem/contiguous-array-map" },
            { id: "binary-subarrays-sum", title: "Binary Subarrays With Sum", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/binary-subarrays-with-sum/", link: "/problem/binary-subarrays-sum" },
        ],
    },

    // ── A13 · Binary Search — On Index ──
    {
        id: "bs-on-index",
        name: "Binary Search — On Index",
        category: "Array · Binary Search",
        difficulty: "Easy",
        description: "Classic binary search on a sorted array to find a target, its first/last occurrence, or the insertion point.",
        theory: `
### Template — Standard
\`\`\`python
lo, hi = 0, n - 1
while lo <= hi:
    mid = lo + (hi - lo) // 2
    if arr[mid] == target: return mid
    elif arr[mid] < target: lo = mid + 1
    else: hi = mid - 1
return -1  # not found
\`\`\`

### Lower Bound (first occurrence ≥ target)
\`\`\`python
lo, hi = 0, n
while lo < hi:
    mid = (lo + hi) // 2
    if arr[mid] < target: lo = mid + 1
    else: hi = mid
return lo
\`\`\`

### Variants
- First/last position of target
- Search in rotated sorted array
- Peak element in unsorted array
- Search in nearly sorted array (off by 1)

### Pitfalls
- Integer overflow: use \`lo + (hi - lo) / 2\`
- Off-by-one: know if your interval is [lo, hi] or [lo, hi)
`,
        examples: [
            "Binary search in sorted array",
            "First and last position of element",
            "Search insert position",
            "Search in rotated sorted array",
        ],
        problems: [
            { id: "binary-search-idx", title: "Binary Search", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/binary-search/", link: "/problem/binary-search-idx" },
            { id: "first-last-pos", title: "Find First and Last Position", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", link: "/problem/first-last-pos" },
            { id: "search-insert-pos", title: "Search Insert Position", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/search-insert-position/", link: "/problem/search-insert-pos" },
            { id: "search-rotated-idx", title: "Search in Rotated Sorted Array", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/search-in-rotated-sorted-array/", link: "/problem/search-rotated-idx" },
        ],
    },

    // ── A14 · Binary Search — On Answer ──
    {
        id: "bs-on-answer",
        name: "Binary Search — On Answer",
        category: "Array · Binary Search",
        difficulty: "Medium",
        description: "When asked to minimize the maximum or maximize the minimum, binary search the answer space and check feasibility with a greedy validator.",
        theory: `
### Intuition
The answer lies in a range [lo, hi]. For each candidate \`mid\`, run a O(n) feasibility check.  
- If feasible → try smaller (hi = mid) or note as best
- If not feasible → need bigger (lo = mid + 1)

### Template — Minimize Maximum
\`\`\`python
lo, hi = min_possible, max_possible
while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid):
        hi = mid       # mid works, try smaller
    else:
        lo = mid + 1   # mid too small
return lo
\`\`\`

### When to Use
- "Minimize the maximum" or "maximize the minimum"
- Koko eating bananas (find minimum speed)
- Split array largest sum
- Capacity to ship packages in D days
- Magnetic force between two balls

### Recognize It
The answer is a **number** (not an index), and there's a clear **feasibility function**.
`,
        examples: [
            "Koko eating bananas",
            "Split array largest sum",
            "Capacity to ship packages in D days",
            "Minimum days to make m bouquets",
        ],
        problems: [
            { id: "koko-bananas-bs", title: "Koko Eating Bananas", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/koko-eating-bananas/", link: "/problem/koko-bananas-bs" },
            { id: "split-array-bs", title: "Split Array Largest Sum", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/split-array-largest-sum/", link: "/problem/split-array-bs" },
            { id: "capacity-ship-bs", title: "Capacity To Ship Packages Within D Days", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/", link: "/problem/capacity-ship-bs" },
            { id: "min-days-bouquets", title: "Minimum Number of Days to Make m Bouquets", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/", link: "/problem/min-days-bouquets" },
            { id: "aggressive-cows-bs", title: "Magnetic Force Between Two Balls", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/magnetic-force-between-two-balls/", link: "/problem/aggressive-cows-bs" },
        ],
    },

    // ═══════════════════════════════════════════
    //  S T R I N G  —  S L I D I N G   W I N D O W
    // ═══════════════════════════════════════════

    // ── S1 · String Sliding Window — Longest Substring Without Repeat ──
    {
        id: "str-sw-no-repeat",
        name: "String · Longest Substring Without Repeat",
        category: "String · Sliding Window",
        difficulty: "Medium",
        description: "Use a sliding window with a hash set/map to find the longest substring with all unique characters.",
        theory: `
### Template
\`\`\`python
seen = {}       # char -> last index
left = 0
best = 0
for right in range(n):
    if s[right] in seen and seen[s[right]] >= left:
        left = seen[s[right]] + 1
    seen[s[right]] = right
    best = max(best, right - left + 1)
return best
\`\`\`

### Why Map Over Set?
Storing the **last index** lets you jump left directly instead of shrinking one-by-one.

### Variants
- Longest substring with at most k distinct characters
- Longest substring with same letter after replacement
`,
        examples: [
            "Longest substring without repeating characters",
            "Longest substring with at most K distinct characters",
        ],
        problems: [
            { id: "longest-no-repeat-str", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", link: "/problem/longest-no-repeat-str" },
            { id: "longest-k-distinct", title: "Longest Substring with At Most K Distinct Characters", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/", link: "/problem/longest-k-distinct" },
        ],
    },

    // ── S2 · String Sliding Window — Minimum Window Substring ──
    {
        id: "str-sw-min-window",
        name: "String · Minimum Window Substring",
        category: "String · Sliding Window",
        difficulty: "Hard",
        description: "Find the smallest substring containing all characters of a target string — the classic variable-size shrink-on-valid pattern.",
        theory: `
### Template
\`\`\`python
need = Counter(t)
missing = len(t)
left = start = 0
best = float('inf')
for right, ch in enumerate(s):
    if need[ch] > 0:
        missing -= 1
    need[ch] -= 1
    while missing == 0:  # all chars found → shrink
        if right - left + 1 < best:
            best = right - left + 1
            start = left
        need[s[left]] += 1
        if need[s[left]] > 0:
            missing += 1
        left += 1
return "" if best == float('inf') else s[start:start+best]
\`\`\`

### Key Insight
Track how many characters are still "missing." When missing == 0, try shrinking from the left.
`,
        examples: [
            "Minimum window substring",
            "Smallest window containing all characters",
        ],
        problems: [
            { id: "min-window-substr", title: "Minimum Window Substring", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/minimum-window-substring/", link: "/problem/min-window-substr" },
            { id: "substring-concat-all-words", title: "Substring with Concatenation of All Words", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/substring-with-concatenation-of-all-words/", link: "/problem/substring-concat-all-words" },
        ],
    },

    // ── S3 · String Sliding Window — Anagram / Permutation ──
    {
        id: "str-sw-anagram",
        name: "String · Anagram / Permutation in String",
        category: "String · Sliding Window",
        difficulty: "Medium",
        description: "Fixed-size window (size = pattern length) sliding over the text, matching character frequencies to detect anagrams.",
        theory: `
### Template
\`\`\`python
from collections import Counter
need = Counter(p)
window = Counter()
result = []
for i, ch in enumerate(s):
    window[ch] += 1
    if i >= len(p):  # shrink left
        old = s[i - len(p)]
        window[old] -= 1
        if window[old] == 0: del window[old]
    if window == need:
        result.append(i - len(p) + 1)
return result
\`\`\`

### Optimization
Instead of comparing full counters, track a \`matched\` count of keys where window[key] == need[key]. When matched == len(need), it's an anagram.

### When to Use
- "Find all anagrams in a string"
- "Permutation in string" (boolean version)
`,
        examples: [
            "Find all anagrams in a string",
            "Permutation in string",
        ],
        problems: [
            { id: "find-anagrams-str", title: "Find All Anagrams in a String", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-all-anagrams-in-a-string/", link: "/problem/find-anagrams-str" },
            { id: "permutation-in-str", title: "Permutation in String", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/permutation-in-string/", link: "/problem/permutation-in-str" },
        ],
    },

    // ═══════════════════════════════════════════
    //  S T R I N G  —  T W O   P O I N T E R S
    // ═══════════════════════════════════════════

    // ── S4 · String Two Pointer — Palindrome Check ──
    {
        id: "str-tp-palindrome",
        name: "String · Palindrome Check",
        category: "String · Two Pointers",
        difficulty: "Easy",
        description: "Compare characters from both ends moving inward — the foundational check for palindrome-based problems.",
        theory: `
### Template
\`\`\`python
def is_palindrome(s, lo, hi):
    while lo < hi:
        if s[lo] != s[hi]: return False
        lo += 1; hi -= 1
    return True
\`\`\`

### Variants
- **Valid Palindrome**: skip non-alphanumeric characters
- **Valid Palindrome II**: allow removing at most one character
- **Longest palindromic substring**: expand around center (each char + each gap)
- **Palindrome pairs**: combine with hash map/trie for O(n·k)
`,
        examples: [
            "Valid palindrome",
            "Valid palindrome II (at most 1 removal)",
            "Longest palindromic substring (expand-around-center)",
        ],
        problems: [
            { id: "valid-palindrome-str", title: "Valid Palindrome", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/valid-palindrome/", link: "/problem/valid-palindrome-str" },
            { id: "valid-palindrome-ii", title: "Valid Palindrome II", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/valid-palindrome-ii/", link: "/problem/valid-palindrome-ii" },
            { id: "longest-palindromic-substr", title: "Longest Palindromic Substring", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-palindromic-substring/", link: "/problem/longest-palindromic-substr" },
            { id: "palindromic-substrings", title: "Palindromic Substrings", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/palindromic-substrings/", link: "/problem/palindromic-substrings" },
        ],
    },

    // ── S5 · String Two Pointer — Reverse Words / Characters ──
    {
        id: "str-tp-reverse",
        name: "String · Reverse Words / Characters",
        category: "String · Two Pointers",
        difficulty: "Medium",
        description: "In-place string reversal using two pointers — reverse the whole string then reverse each word individually, or vice versa.",
        theory: `
### Reverse Words in a String
1. Reverse the entire string
2. Reverse each word individually
3. Clean up extra spaces

### Template (in-place)
\`\`\`python
def reverse(s, lo, hi):
    while lo < hi:
        s[lo], s[hi] = s[hi], s[lo]
        lo += 1; hi -= 1
\`\`\`

### Variants
- Reverse words in a string
- Reverse only vowels
- Reverse string II (reverse first k of every 2k)
`,
        examples: [
            "Reverse words in a string",
            "Reverse string",
            "Reverse vowels of a string",
        ],
        problems: [
            { id: "reverse-words-str", title: "Reverse Words in a String", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/reverse-words-in-a-string/", link: "/problem/reverse-words-str" },
            { id: "reverse-string-str", title: "Reverse String", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/reverse-string/", link: "/problem/reverse-string-str" },
            { id: "reverse-vowels", title: "Reverse Vowels of a String", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/reverse-vowels-of-a-string/", link: "/problem/reverse-vowels" },
        ],
    },

    // ── S6 · String Two Pointer — String Compression ──
    {
        id: "str-tp-compression",
        name: "String · String Compression",
        category: "String · Two Pointers",
        difficulty: "Medium",
        description: "Use a read pointer to scan groups of consecutive identical characters and a write pointer to compress in-place.",
        theory: `
### Template
\`\`\`python
write = 0
i = 0
while i < n:
    ch = chars[i]
    count = 0
    while i < n and chars[i] == ch:
        i += 1
        count += 1
    chars[write] = ch
    write += 1
    if count > 1:
        for digit in str(count):
            chars[write] = digit
            write += 1
return write
\`\`\`

### Key Idea
Two pointers moving in the same direction: **read** scans while **write** overwrites.  
The write pointer is always ≤ read, so no data is lost.

### Variants
- Run-length encoding
- Group shifted strings
- Count and say
`,
        examples: [
            "String compression",
            "Count and say",
            "Run-length encoding",
        ],
        problems: [
            { id: "string-compression", title: "String Compression", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/string-compression/", link: "/problem/string-compression" },
            { id: "count-and-say", title: "Count and Say", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/count-and-say/", link: "/problem/count-and-say" },
        ],
    },

    // ═══════════════════════════════════════════
    //  S T R I N G  —  P A T T E R N   M A T C H
    // ═══════════════════════════════════════════

    // ── S7 · KMP (Failure Function) ──
    {
        id: "str-kmp",
        name: "String · KMP (Failure Function)",
        category: "String · Pattern Matching",
        difficulty: "Hard",
        description: "Knuth-Morris-Pratt achieves O(n + m) pattern matching by precomputing a failure function (LPS array) that tells how far to fall back on mismatch.",
        theory: `
### Build LPS (Longest Prefix Suffix)
\`\`\`python
def build_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    return lps
\`\`\`

### KMP Search
\`\`\`python
lps = build_lps(pattern)
i = j = 0
while i < len(text):
    if text[i] == pattern[j]:
        i += 1; j += 1
    if j == len(pattern):
        found at i - j
        j = lps[j - 1]
    elif i < len(text) and text[i] != pattern[j]:
        if j != 0: j = lps[j - 1]
        else: i += 1
\`\`\`

### When to Use
- Exact pattern matching in O(n + m)
- Finding all occurrences
- Shortest palindrome (KMP on reversed + original)
- Repeated substring pattern
`,
        examples: [
            "Implement strStr() / find first occurrence",
            "Repeated substring pattern",
            "Shortest palindrome",
        ],
        problems: [
            { id: "strstr-kmp", title: "Find the Index of the First Occurrence in a String", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/", link: "/problem/strstr-kmp" },
            { id: "repeated-sub-kmp", title: "Repeated Substring Pattern", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/repeated-substring-pattern/", link: "/problem/repeated-sub-kmp" },
            { id: "shortest-palindrome-kmp", title: "Shortest Palindrome", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/shortest-palindrome/", link: "/problem/shortest-palindrome-kmp" },
        ],
    },

    // ── S8 · Rabin-Karp (Rolling Hash) ──
    {
        id: "str-rabin-karp",
        name: "String · Rabin-Karp (Rolling Hash)",
        category: "String · Pattern Matching",
        difficulty: "Hard",
        description: "Use a rolling polynomial hash to check pattern matches in O(1) per window — O(n + m) average, great for multi-pattern search.",
        theory: `
### Idea
Hash the pattern. Slide a window of same size over text, maintaining a rolling hash.  
\`hash = (hash - s[left] * base^(k-1)) * base + s[right]\`

### Template
\`\`\`python
base, mod = 31, 10**9 + 7
pat_hash = 0
for ch in pattern:
    pat_hash = (pat_hash * base + ord(ch)) % mod

win_hash = 0
power = pow(base, len(pattern) - 1, mod)
for i in range(len(text)):
    win_hash = (win_hash * base + ord(text[i])) % mod
    if i >= len(pattern):
        win_hash = (win_hash - ord(text[i-len(pattern)]) * power * base) % mod
    if i >= len(pattern) - 1 and win_hash == pat_hash:
        # verify to avoid hash collision
        if text[i-len(pattern)+1:i+1] == pattern: found!
\`\`\`

### When to Use
- Multiple pattern searches (hash each pattern)
- Longest duplicate substring (binary search + rolling hash)
- Detect repeated DNA sequences

### Caveat
Worst case O(n·m) due to hash collisions — always verify matches.
`,
        examples: [
            "Implement strStr() with rolling hash",
            "Repeated DNA sequences",
            "Longest duplicate substring",
        ],
        problems: [
            { id: "repeated-dna", title: "Repeated DNA Sequences", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/repeated-dna-sequences/", link: "/problem/repeated-dna" },
            { id: "longest-dup-substring", title: "Longest Duplicate Substring", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-duplicate-substring/", link: "/problem/longest-dup-substring" },
        ],
    },

    // ── S9 · Z-Algorithm ──
    {
        id: "str-z-algorithm",
        name: "String · Z-Algorithm",
        category: "String · Pattern Matching",
        difficulty: "Hard",
        description: "Build a Z-array where Z[i] = length of the longest substring starting at i that matches a prefix of the string. O(n) time — a powerful alternative to KMP.",
        theory: `
### Z-Array
Z[i] = length of the longest string starting at position i which is also a prefix of the string.

### Template
\`\`\`python
def z_function(s):
    n = len(s)
    z = [0] * n
    z[0] = n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z
\`\`\`

### Pattern Matching with Z
Concatenate: \`pattern + "$" + text\`. Build Z-array.  
Any Z[i] == len(pattern) means a match starting at position i - len(pattern) - 1 in text.

### When to Use
- All occurrences of pattern in text
- Number of distinct substrings
- String matching without LPS table
`,
        examples: [
            "Pattern matching using Z-array",
            "Count distinct substrings",
        ],
        problems: [
            { id: "str-matching-z", title: "Find the Index of the First Occurrence (Z-algo)", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/", link: "/problem/str-matching-z" },
            { id: "sum-scores-built-strings", title: "Sum of Scores of Built Strings", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/sum-of-scores-of-built-strings/", link: "/problem/sum-scores-built-strings" },
        ],
    },
];
