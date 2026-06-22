export const dsaPatterns = [
    {
        id: "two-pointers",
        name: "Two Pointers",
        category: "Array & String",
        difficulty: "Medium",
        description: "A pattern where two pointers iterate through the data structure in tandem until one or both of the pointers hit a certain condition.",
        theory: `
### Intuition
As the name implies, a two-pointer pattern refers to an algorithm that utilizes two pointers. A pointer is a variable that represents an index or position within a data structure, like an array or linked list.

Many algorithms just use a single pointer to iterate. Introducing a **second pointer** opens a new world of possibilities. Most importantly, we can now make **comparisons**. With pointers at two different positions, we can compare the elements at those positions and make decisions.

In many cases, such comparisons might otherwise be made using two nested loops, which takes $O(n^2)$ time. Two pointers allow us to process the data in $O(n)$ time by eliminating the need for nested comparisons.

### Two-pointer Strategies

**1. Inward Traversal**
This approach has pointers starting at opposite ends of the data structure and moving inward toward each other. The pointers move toward the center, adjusting their positions based on comparisons, until they meet or cross. This is ideal for problems like:
- checking for palindromes
- finding a pair that sums to a target in a sorted array
- reversing an array

**2. Unidirectional Traversal**
In this approach, both pointers start at the same end (usually the beginning) and move in the same direction. One pointer might move faster than the other, or they might move at different times.
- **Fast and Slow Pointers**: One moves 1 step, the other 2 steps (e.g., detecting cycles).
- **Read/Write Pointers**: One reads elements, the other writes valid elements (e.g., removing duplicates).

**3. Staged Traversal**
In this approach, we traverse with one pointer, and when it lands on an element that meets a certain condition, we traverse with the second pointer. The first pointer is used to search for something, and once found, a second pointer finds additional information.

### When To Use Two Pointers?
- **Linear Data Structures**: The problem involves an array, linked list, or string.
- **Sorted Arrays**: If the input is sorted, two pointers can often be used to find pairs or conditions in $O(n)$ instead of $O(n^2)$.
- **Pairs/Triplets**: The problem asks for a pair or triplet of values that satisfy a condition.
- **Subarrays**: Finding a subarray with specific properties (often combined with Sliding Window).
- **Palindromes**: Checking for symmetry.

### Real-world Example
**Garbage Collection Algorithms**: In memory compaction, a "scan" pointer traverses the heap to identify live objects, while a "free" pointer keeps track of the next available space. Live objects are shifted to the "free" pointer's position, compacting memory.
        `,
        examples: [
            "Removing duplicates from a sorted array",
            "Checking if a string is a palindrome",
            "Finding two numbers in a sorted array that add up to a target",
            "Container with most water (finding max area)",
            "Trapping rain water",
            "Moving zeros to the end of an array"
        ],
        problems: [
            { id: "valid-palindrome", title: "Valid Palindrome", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/valid-palindrome/", link: "/problem/valid-palindrome" },
            { id: "two-sum-ii", title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", link: "/problem/two-sum-ii" },
            { id: "3sum", title: "3Sum", difficulty: "Medium", status: "pending", link: "/problem/3sum" },
            { id: "container-with-most-water", title: "Container With Most Water", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/container-with-most-water/", link: "/problem/container-with-most-water" },
            { id: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/trapping-rain-water/", link: "/problem/trapping-rain-water" },
            { id: "move-zeroes", title: "Move Zeroes", difficulty: "Easy", status: "pending", link: "/problem/move-zeroes" }
        ]
    },
    {
        id: "sliding-window",
        name: "Sliding Window",
        category: "Array & String",
        difficulty: "Medium",
        description: "A pattern used to perform a required operation on a specific window size of a given array or linked list.",
        theory: `
### Intuition
The Sliding Window pattern is used to perform a required operation on a specific window size of a given array or linked list, such as finding the longest subarray containing all 1s. Sliding Windows start from the 1st element and keep shifting right by one element and adjust the length of the window according to the problem that you are solving.

In some variance, the window size remains constant and in other variance the window grows or shrinks.

### Types of Sliding Windows

**1. Fixed Window Size**
The window size \`k\` is fixed. We slide the window by one element at a time.
Example: *Find the maximum sum of any contiguous subarray of size k.*

**2. Dynamic Window Size**
The window size grows or shrinks based on constraints.
Example: *Find the smallest subarray with a sum greater than or equal to S.*
        `,
        examples: [
             "Longest substring without repeating characters",
             "Minimum size subarray sum",
             "Longest repeating character replacement",
             "Permutation in string"
        ],
        problems: [
            { id: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", status: "pending", link: "/problem/longest-substring" },
            { id: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", status: "pending", link: "/problem/best-time-stock" },
            { id: "longest-repeating-character-replacement", title: "Longest Repeating Character Replacement", difficulty: "Medium", status: "pending", link: "/problem/longest-repeating-char" },
            { id: "minimum-window-substring", title: "Minimum Window Substring", difficulty: "Hard", status: "pending", link: "/problem/min-window-substring" }
        ]
    },
    {
         id: "arrays-hashing",
         name: "Arrays & Hashing",
         category: "Array",
         difficulty: "Easy",
         description: "Foundational techniques for manipulating arrays and using hash maps for efficient lookups.",
         theory: "Basic array manipulation and hashing techniques are the building blocks of most complex algorithms.",
         examples: ["Contains Duplicate", "Valid Anagram", "Two Sum"],
         problems: [
             { id: "contains-duplicate", title: "Contains Duplicate", difficulty: "Easy", status: "solved", link: "/problem/contains-duplicate" },
             { id: "valid-anagram", title: "Valid Anagram", difficulty: "Easy", status: "solved", link: "/problem/valid-anagram" },
             { id: "two-sum", title: "Two Sum", difficulty: "Easy", status: "solved", link: "/problem/two-sum" },
             { id: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", status: "pending", link: "/problem/group-anagrams" },
             { id: "top-k-frequent-elements", title: "Top K Frequent Elements", difficulty: "Medium", status: "pending", link: "/problem/top-k-frequent" },
             { id: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "Medium", status: "pending", link: "/problem/product-array-except-self" }
         ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 4 — Two Pointers (Converging)
    // ─────────────────────────────────────────────
    {
        id: "two-pointers-converging",
        name: "Two Pointers (Converging)",
        category: "Array & String",
        difficulty: "Medium",
        description: "Start pointers at opposite ends of a sorted structure and move them inward, eliminating half the search space at each step.",
        theory: `
### 1 · Intuition
When a dataset is **sorted** (or symmetric), placing one pointer at each end lets you make decisions based on the combined value at both ends. Each comparison eliminates at least one candidate, so the entire array is scanned in a single pass — O(n) instead of O(n²).

The trick is simple: if the aggregate (usually a sum) is too small, advancing the left pointer increases it; if too large, retreating the right pointer decreases it. The sorted order guarantees monotonic behavior in both directions.

### 2 · Step-by-Step Build-up
**Brute Force — O(n²)**
Check every pair (i, j) where i < j. For sum problems this means two nested loops.

**Observation**
In a sorted array, if a[L] + a[R] < target, then a[L] paired with anything < a[R] is also too small → skip them all by doing L++.

**Converging Two Pointers — O(n)**
  L = 0, R = n-1
  while L < R:
    s = a[L] + a[R]
    if s == target → found
    if s < target  → L++
    if s > target  → R--

### 3 · Formal Pattern Template
**When to use**
• Sorted array / string / palindrome checks
• Searching for pairs/triples that satisfy a sum constraint
• Container / area problems (maximize the window while constrained by the shorter side)

**Invariants**
• L always moves right, R always moves left → they never cross without meeting
• At every step the solution cannot lie in the eliminated region (proof by contradiction on sorted order)

**Generic Pseudo-code**
  function converge(arr, target):
    sort(arr)              // if not already sorted
    L ← 0, R ← len-1
    while L < R:
      val ← combine(arr[L], arr[R])
      if val == target: record answer; L++; R--
      elif val < target: L++
      else: R--

### 4 · Deep Dive
**Edge cases**
• Array of length 0 or 1 → immediate return
• All elements identical → your combine function must still terminate (e.g., L++ or R--)
• Multiple valid answers → decide whether to return first or all

**When it fails**
• Unsorted data (pointers lose their monotonic guarantee)
• Need index-based constraints beyond just values (hash map may be better)

**Complexity reasoning**
• Time  O(n) after O(n log n) sort (if needed). Net O(n log n).
• Space O(1) extra — in-place pointer manipulation.

### 5 · Hidden Tricks & Pro Tips
• **3Sum / 4Sum**: sort, fix the outermost element, then converge on the remaining sub-array.
• **Skip duplicates**: after finding a valid pair, while arr[L]==arr[L+1] L++; similarly for R.
• **Container With Most Water**: always move the pointer at the shorter line — moving the taller can never improve area.
• **Trapping Rain Water**: track leftMax and rightMax; advance the side with the smaller max.
• **Valid Palindrome**: L++/R-- are natural since you compare symmetric ends.
• **Sorted Matrix Search**: treat row-end and col-start as a "converging" pair of constraints.
• **Sum-of-three = 0**: reduce to converging two-pointer inside a for-loop → O(n²) vs O(n³).

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. What property of the input makes converging two pointers correct?
  A) Elements are unique  B) Array is sorted  C) Array has even length  D) Array fits in cache

Q2. If a[L] + a[R] > target, which pointer should move?
  A) L forward  B) R backward  C) Both inward  D) Neither

Q3. What is the time complexity of Container With Most Water using two pointers?
  A) O(n²)  B) O(n log n)  C) O(n)  D) O(1)

**Problem Prompts**
1. [Easy]  Valid Palindrome — ignore non-alphanumeric, converging L/R  (subpattern: symmetric check)
2. [Medium] Two Sum II — sorted input, find pair summing to target  (subpattern: pair sum)
3. [Medium] 3Sum — find all unique triplets summing to zero  (subpattern: fix + converge)
4. [Medium] Container With Most Water — maximize area between two lines  (subpattern: area optimization)
5. [Hard]  Trapping Rain Water — compute trapped water using leftMax / rightMax  (subpattern: constrained converge)
        `,
        examples: [
            "Finding a pair summing to a target in a sorted array",
            "Checking if a string reads the same forwards and backwards",
            "Maximizing area between two vertical lines",
            "3Sum — reducing O(n³) to O(n²) by fixing one element and converging",
            "Trapping rain water between elevation bars"
        ],
        problems: [
            { id: "valid-palindrome", title: "Valid Palindrome", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/valid-palindrome/", link: "/problem/valid-palindrome" },
            { id: "two-sum-ii", title: "Two Sum II - Sorted", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", link: "/problem/two-sum-ii" },
            { id: "3sum", title: "3Sum", difficulty: "Medium", status: "pending", link: "/problem/3sum" },
            { id: "container-with-most-water", title: "Container With Most Water", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/container-with-most-water/", link: "/problem/container-with-most-water" },
            { id: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/trapping-rain-water/", link: "/problem/trapping-rain-water" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 5 — Two Pointers (Fast–Slow)
    // ─────────────────────────────────────────────
    {
        id: "fast-slow-pointers",
        name: "Two Pointers (Fast–Slow)",
        category: "Linked List",
        difficulty: "Medium",
        description: "Use two pointers moving at different speeds to detect cycles, find midpoints, or identify structural properties in linear data.",
        theory: `
### 1 · Intuition
Imagine two runners on a circular track — the faster one will always lap the slower one. In a linked-list (or virtual sequence), a **slow** pointer advancing 1 step and a **fast** pointer advancing 2 steps will meet if (and only if) there is a cycle.

Beyond cycle detection, this speed difference is a powerful probe:
• Fast reaches the end → slow is at the midpoint.
• Meeting point math → find the cycle entrance.
• "Hare" jumps detect happy numbers, duplicate values, etc.

### 2 · Step-by-Step Build-up
**Brute Force — cycle detection**
Store every visited node in a hash set → O(n) space.

**Observation**
If fast reaches null, no cycle; if fast meets slow, cycle confirmed — no extra memory needed.

**Floyd's Cycle Detection — O(n) time, O(1) space**
  slow = head, fast = head
  while fast AND fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast → cycle exists

**Finding cycle entrance**
After slow & fast meet, reset one to head. Advance both 1 step at a time — they meet at the cycle start (mathematical proof: the distance from head to cycle start equals the distance from meeting point to cycle start going around).

### 3 · Formal Pattern Template
**When to use**
• Cycle detection in linked lists or implicit sequences
• Finding the middle node in one pass
• Splitting a list into two halves (for merge sort, palindrome check)
• Duplicate detection in constrained arrays (values as "next" pointers)

**Invariants**
• fast moves exactly 2× the speed of slow
• If no cycle, fast reaches null in ⌊n/2⌋ steps
• If cycle of length C, they meet within C steps after slow enters the cycle

**Generic Pseudo-code**
  function hasCycle(head):
    slow ← head, fast ← head
    while fast ≠ null AND fast.next ≠ null:
      slow ← slow.next
      fast ← fast.next.next
      if slow == fast: return true
    return false

  function findMiddle(head):
    slow ← head, fast ← head
    while fast ≠ null AND fast.next ≠ null:
      slow ← slow.next
      fast ← fast.next.next
    return slow    // slow is at the mid (upper-mid for even)

### 4 · Deep Dive
**Edge cases**
• Empty list (head == null) → return immediately
• Single node with self-loop → fast.next == slow on first iteration
• Even vs odd length → slow lands on the "upper" middle for even-length lists; adjust if you need the lower middle

**When it fails**
• Random-access structures (arrays) where you can simply index into the middle
• Doubly linked lists where you can traverse backward — no need for the two-speed trick

**Complexity reasoning**
• Time  O(n): fast traverses at most 2n nodes, slow at most n.
• Space O(1): only two pointers regardless of list size.

### 5 · Hidden Tricks & Pro Tips
• **Palindrome linked list**: find middle (fast-slow), reverse second half in-place, compare node by node, then restore.
• **Reorder list (L0→Ln→L1→Ln-1…)**: find middle, reverse second half, interleave.
• **Happy number**: treat digit-square-sum as "next" — fast-slow on the number sequence detects the cycle.
• **Find the duplicate (Floyd on arrays)**: treat nums[i] as "pointer to index nums[i]". A duplicate value creates a cycle; use phase-2 to locate it in O(1) space.
• **Remove nth from end**: lead fast n steps ahead; when fast reaches null, slow is at (n+1)th from end.
• **Cycle length**: after slow==fast, keep one still and count steps until they meet again.
• **Intersection of two lists**: calculate lengths, align start points, then walk together — a variant of the same "gap" idea.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. If fast moves 3 steps and slow moves 1, will they still meet in a cycle?
  A) Always  B) Only if cycle length is odd  C) Only if cycle length is divisible by 2  D) Never

Q2. When using fast-slow to find the list midpoint, where does slow end up for a list of 6 nodes?
  A) Node 3  B) Node 4  C) Node 2  D) Node 6

Q3. What additional step finds the ENTRANCE of a cycle after detection?
  A) Reverse the list  B) Reset one pointer to head and walk both at speed 1  C) Count total nodes  D) Use a hash set

**Problem Prompts**
1. [Easy]  Detect Cycle in Linked List — classic Floyd's  (subpattern: cycle detection)
2. [Easy]  Find Middle of Linked List — fast reaches end, slow is at mid  (subpattern: midpoint)
3. [Medium] Remove Nth Node From End — fast leads by N  (subpattern: gap technique)
4. [Medium] Reorder List — find mid, reverse, interleave  (subpattern: split & merge)
5. [Medium] Find the Duplicate Number — Floyd on array values  (subpattern: implicit graph cycle)
        `,
        examples: [
            "Detecting a cycle in a linked list without extra memory",
            "Finding the middle node of a linked list in one pass",
            "Checking if a linked list is a palindrome (split, reverse, compare)",
            "Locating the duplicate number in a constrained array",
            "Removing the Nth node from the end in a single traversal"
        ],
        problems: [
            { id: "detect-cycle", title: "Detect Cycle in Linked List", difficulty: "Easy", status: "pending", link: "/problem/detect-cycle" },
            { id: "remove-nth-node-from-end", title: "Remove Nth Node From End", difficulty: "Medium", status: "pending", link: "/problem/remove-nth-node-from-end" },
            { id: "reorder-list", title: "Reorder List", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/reorder-list/", link: "/problem/reorder-list" },
            { id: "find-the-duplicate-number", title: "Find the Duplicate Number", difficulty: "Medium", status: "pending", link: "/problem/find-the-duplicate-number" },
            { id: "palindrome-linked-list", title: "Palindrome Linked List", difficulty: "Easy", status: "pending", link: "/problem/palindrome-linked-list" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 6 — Monotonic Stack
    // ─────────────────────────────────────────────
    {
        id: "monotonic-stack",
        name: "Monotonic Stack",
        category: "Stack",
        difficulty: "Medium",
        description: "Maintain a stack whose elements are always in increasing or decreasing order to answer 'next greater/smaller element' queries in O(n).",
        theory: `
### 1 · Intuition
Many array problems ask: "For each element, what is the **next** (or previous) element that is greater (or smaller)?" A brute-force scan for each element is O(n²). The monotonic stack reduces this to O(n) because every element is pushed and popped **at most once**.

The key insight: if we maintain the stack in **decreasing** order (for "next greater") and a new element is larger than the top, the top has found its answer. We pop and record, then push the new element.

### 2 · Step-by-Step Build-up
**Brute Force — O(n²)**
For each element, scan rightward for the first larger value.

**Observation**
Elements that haven't found their "next greater" yet are waiting. They form a natural decreasing sequence (anything smaller that came later would have already been answered). This is exactly a stack!

**Monotonic Stack — O(n)**
  stack = []
  result = [-1] * n
  for i in 0..n-1:
    while stack not empty AND arr[i] > arr[stack.top]:
      result[stack.pop()] = arr[i]
    stack.push(i)

### 3 · Formal Pattern Template
**When to use**
• "Next Greater Element" / "Next Smaller Element" queries
• "Previous Greater/Smaller Element" queries
• Histogram problems (largest rectangle, trapping rain water)
• Stock span, daily temperatures, subarray min/max contribution

**Invariants**
• Stack elements are always monotonically ordered (increasing or decreasing depending on variant)
• Each element is pushed exactly once and popped at most once → amortized O(1) per element

**Generic Pseudo-code**
  // Next Greater Element (decreasing stack)
  function nextGreater(arr):
    n ← len(arr), result ← [-1]*n, stack ← []
    for i from 0 to n-1:
      while stack and arr[i] > arr[stack.peek()]:
        result[stack.pop()] ← arr[i]
      stack.push(i)
    return result

  // Previous Smaller Element (increasing stack)
  function prevSmaller(arr):
    n ← len(arr), result ← [-1]*n, stack ← []
    for i from 0 to n-1:
      while stack and arr[stack.peek()] >= arr[i]:
        stack.pop()
      if stack: result[i] ← arr[stack.peek()]
      stack.push(i)
    return result

### 4 · Deep Dive
**Edge cases**
• All elements already sorted (ascending) → nothing gets popped until the very end; remaining stack elements have result = -1.
• All elements equal → no element is strictly greater, so the result is all -1.
• Circular arrays (e.g., Next Greater Element II) → iterate 2n times, using i % n.

**When monotonic stack fails**
• When you need the Kth greater element, not just the first.
• When the "greater" relationship depends on a non-local property (e.g., sums of sub-windows).

**Complexity reasoning**
• Time O(n): each index is pushed once and popped at most once.
• Space O(n): stack can hold up to n elements (sorted input).

### 5 · Hidden Tricks & Pro Tips
• **Largest Rectangle in Histogram**: maintain an increasing stack of heights. When a bar shorter than the top appears, pop and compute area using the current index and the new stack top as boundaries.
• **Sum of Subarray Minimums**: for each element, find how many subarrays it is the minimum of using PSE (previous smaller) and NSE (next smaller).
• **Stock Span**: use a decreasing stack; span = current_index − index_of_previous_greater_element.
• **Daily Temperatures**: store indices; when current temp > stack top's temp, the difference in indices is the answer.
• **Circular arrays**: loop from 0 to 2n−1 and use index % n to simulate wrap-around.
• **Combine with prefix sums**: "Shortest Subarray with Sum ≥ K" uses a monotonic deque on prefix sums.
• **Two monotonic stacks**: many "contribution" problems (Sum of Subarray Mins/Maxs) need both previous and next boundaries.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. In a monotonic decreasing stack for "next greater", what order are stack elements in from bottom to top?
  A) Increasing  B) Decreasing  C) Random  D) Same value

Q2. What is the amortized time per element for push + pop operations in a monotonic stack?
  A) O(n)  B) O(log n)  C) O(1)  D) O(n²)

Q3. For "Previous Smaller Element," which type of monotonic stack do you maintain?
  A) Decreasing  B) Increasing  C) Alternating  D) It depends on input size

**Problem Prompts**
1. [Medium] Next Greater Element — classic monotonic decreasing stack  (subpattern: next-greater)
2. [Medium] Daily Temperatures — days until a warmer temperature  (subpattern: next-greater on temps)
3. [Hard]  Largest Rectangle in Histogram — area calculation with increasing stack  (subpattern: boundary finding)
4. [Medium] Stock Span Problem — consecutive days of lower/equal prices  (subpattern: previous-greater)
5. [Medium] Sum of Subarray Minimums — contribution technique with PSE + NSE  (subpattern: contribution counting)
        `,
        examples: [
            "Finding the next greater element for every position in an array",
            "Computing 'days until warmer temperature' in O(n)",
            "Largest rectangle that fits inside a histogram",
            "Stock span — consecutive days of non-higher prices",
            "Sum of minimums across all subarrays"
        ],
        problems: [
            { id: "next-greater-element", title: "Next Greater Element", difficulty: "Medium", status: "pending", link: "/problem/next-greater-element" },
            { id: "daily-temperatures", title: "Daily Temperatures", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/daily-temperatures/", link: "/problem/daily-temperatures" },
            { id: "largest-rectangle-in-histogram", title: "Largest Rectangle in Histogram", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/largest-rectangle-in-histogram/", link: "/problem/largest-rectangle-in-histogram" },
            { id: "stock-span-problem", title: "Stock Span Problem", difficulty: "Medium", status: "pending", link: "/problem/stock-span-problem" },
            { id: "sum-of-subarray-minimums", title: "Sum of Subarray Minimums", difficulty: "Medium", status: "pending", link: "/problem/sum-of-subarray-minimums" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 7 — Binary Search on Answer
    // ─────────────────────────────────────────────
    {
        id: "binary-search-on-answer",
        name: "Binary Search on Answer",
        category: "Binary Search",
        difficulty: "Hard",
        description: "Instead of searching within an array, binary-search on the space of possible answers and use a feasibility check to converge on the optimal one.",
        theory: `
### 1 · Intuition
Classic binary search finds a target in a sorted array. **Binary Search on Answer** takes the same idea but applies it to the answer itself. You define a range [lo, hi] of possible answers, pick the midpoint, and ask: "Is this answer feasible?" If feasibility is **monotonic** (once feasible, always feasible for larger values, or vice versa), binary search halves the range each step.

This unlocks O(log(answer_range) × check_cost) solutions for optimization problems that look nothing like traditional searching.

### 2 · Step-by-Step Build-up
**Brute Force**
Try every possible answer from lo to hi, check feasibility for each → O(range × check).

**Observation**
If answer X is feasible, then X+1 is also feasible (for minimization with "at least" constraint). This monotonic property means we can binary search.

**Binary Search on Answer**
  lo = min_possible, hi = max_possible
  while lo < hi:
    mid = lo + (hi - lo) / 2
    if feasible(mid):
      hi = mid        // try smaller
    else:
      lo = mid + 1    // need bigger
  return lo

### 3 · Formal Pattern Template
**When to use**
• "Minimize the maximum" or "Maximize the minimum" optimization
• Answer space is bounded and feasibility is monotonic
• Direct computation is hard, but checking a candidate is easy
• Examples: minimum speed, maximum distance, minimum days, splitting arrays

**Invariants**
• lo ≤ optimal answer ≤ hi at every iteration
• feasible(hi) is always true (by definition of hi)
• feasible(lo-1) is always false (by definition of lo after convergence)

**Generic Pseudo-code**
  function searchOnAnswer(lo, hi):
    while lo < hi:
      mid ← lo + (hi - lo) / 2
      if canAchieve(mid):     // problem-specific check
        hi ← mid              // mid works, try smaller (minimization)
      else:
        lo ← mid + 1          // mid doesn't work, go bigger
    return lo

  // For MAXIMIZATION (maximize the minimum):
  function searchOnAnswerMax(lo, hi):
    while lo < hi:
      mid ← lo + (hi - lo + 1) / 2    // note: upper-mid to avoid infinite loop
      if canAchieve(mid):
        lo ← mid
      else:
        hi ← mid - 1
    return lo

### 4 · Deep Dive
**Edge cases**
• Answer range of 1 → immediate return
• Floating-point answers → use a fixed number of iterations (e.g., 100) instead of lo < hi
• Off-by-one: when minimizing use lo + (hi-lo)/2; when maximizing use lo + (hi-lo+1)/2 to avoid infinite loops

**When it fails**
• Feasibility is NOT monotonic (e.g., "is there a subarray of sum exactly X?" can be true for some X and false for X+1)
• Check function is as expensive as solving the original problem

**Complexity reasoning**
• Binary search loop: O(log(hi - lo)) iterations
• Each iteration runs the feasibility check: O(n) to O(n log n) typically
• Total: O(n log(range)) — far better than O(n × range) brute force

### 5 · Hidden Tricks & Pro Tips
• **Koko Eating Bananas**: search on speed K. Check: sum of ceil(pile/K) ≤ H hours.
• **Split Array Largest Sum**: search on max-sum. Check: can you split into ≤ m parts each ≤ mid? Greedy scan.
• **Minimum Days to Make Bouquets**: search on day D. Check: are there enough consecutive bloomed flowers by day D?
• **Magnetic Balls (Aggressive Cows)**: search on minimum gap. Check: can you place K balls with at least mid gap? Greedy placement.
• **Capacity to Ship Packages**: search on weight capacity. Check: can all packages ship in ≤ D days?
• **Floating-point variant**: for "minimize the maximum average" style problems, binary search with epsilon precision or fixed iterations.
• **Combine with greedy**: the feasibility check is almost always a **greedy** scan — iterate left to right and greedily assign.
• **Debug tip**: always verify that feasible(hi) == true and feasible(lo-1) == false before trusting your bounds.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. What property must the feasibility function have for binary search on answer to work?
  A) Randomness  B) Monotonicity  C) Commutativity  D) Idempotency

Q2. When minimizing the answer, which half do you discard if mid is feasible?
  A) [lo, mid]  B) [mid+1, hi]  C) [mid, hi]  D) [lo, mid-1]

Q3. What is the typical complexity of binary search on answer with an O(n) check?
  A) O(n²)  B) O(n log n)  C) O(n log R) where R is the answer range  D) O(n)

**Problem Prompts**
1. [Medium] Koko Eating Bananas — search on eating speed  (subpattern: minimize speed)
2. [Hard]  Split Array Largest Sum — minimize the maximum partition sum  (subpattern: minimize maximum)
3. [Medium] Capacity to Ship Packages in D Days — search on ship capacity  (subpattern: minimize capacity)
4. [Hard]  Aggressive Cows / Magnetic Balls — maximize minimum gap  (subpattern: maximize minimum)
5. [Medium] Find Peak Element — binary search exploiting local monotonicity  (subpattern: search on structure)
        `,
        examples: [
            "Finding minimum eating speed to finish all banana piles in H hours",
            "Minimizing the largest sum when splitting an array into m parts",
            "Finding the minimum ship capacity to deliver all packages in D days",
            "Maximizing the minimum distance between placed objects",
            "Finding the minimum number of days to make bouquets"
        ],
        problems: [
            { id: "koko-eating-bananas", title: "Koko Eating Bananas", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/koko-eating-bananas/", link: "/problem/koko-eating-bananas" },
            { id: "split-array-largest-sum", title: "Split Array Largest Sum", difficulty: "Hard", status: "pending", link: "/problem/split-array-largest-sum" },
            { id: "find-peak-element", title: "Find Peak Element", difficulty: "Medium", status: "pending", link: "/problem/find-peak-element" },
            { id: "kth-smallest-element-in-sorted-matrix", title: "Kth Smallest in Sorted Matrix", difficulty: "Medium", status: "pending", link: "/problem/kth-smallest-element-in-sorted-matrix" },
            { id: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", difficulty: "Hard", status: "pending", link: "/problem/median-of-two-sorted-arrays" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 8 — BFS on Grid / Graph
    // ─────────────────────────────────────────────
    {
        id: "bfs-grid-graph",
        name: "BFS on Grid / Graph",
        category: "Graph & Matrix",
        difficulty: "Medium",
        description: "Use a queue to explore nodes level-by-level, guaranteeing shortest-path distances in unweighted graphs and grids.",
        theory: `
### 1 · Intuition
BFS spreads outward from a source like ripples in a pond — every node at distance d is visited before any node at distance d+1. This "level-by-level" property makes BFS the default choice for **shortest path in unweighted graphs** and **minimum steps in grid problems**.

On a 2D grid, treat each cell as a node and its 4 (or 8) neighbors as edges. BFS from one or more sources simultaneously (multi-source BFS) handles problems like "rotten oranges" or "distance to nearest 0."

### 2 · Step-by-Step Build-up
**Brute Force**
Try all possible paths (DFS / backtracking), track the shortest → exponential time.

**Observation**
BFS naturally finds shortest paths in unweighted graphs because it visits nodes in order of increasing distance.

**BFS Template — O(V + E)**
  visited = set()
  queue = [source]
  visited.add(source)
  dist = 0
  while queue:
    for i in range(len(queue)):   // process current level
      node = queue.popleft()
      for neighbor in adj(node):
        if neighbor not in visited:
          visited.add(neighbor)
          queue.append(neighbor)
    dist += 1

### 3 · Formal Pattern Template
**When to use**
• Shortest path in unweighted graph or grid
• Minimum moves/steps/transformations
• Level-order traversal (trees or general graphs)
• Multi-source "spreading" problems (rotten oranges, walls & gates)
• Bi-directional BFS for word ladder / transformation problems

**Invariants**
• Everything in the queue at step d is exactly d edges from source(s)
• Once a node is visited, it's never revisited → O(V+E) total work
• For grids: V = rows × cols, E = 4 × V for 4-directional movement

**Generic Pseudo-code — Grid BFS**
  function bfsGrid(grid, startR, startC):
    rows ← grid.rows, cols ← grid.cols
    visited ← set of (startR, startC)
    queue ← [(startR, startC)]
    dirs ← [(0,1),(0,-1),(1,0),(-1,0)]
    steps ← 0
    while queue:
      for _ in range(len(queue)):
        (r, c) ← queue.popleft()
        if isGoal(r, c): return steps
        for (dr, dc) in dirs:
          nr, nc ← r+dr, c+dc
          if inBounds(nr,nc) AND (nr,nc) not in visited AND passable(nr,nc):
            visited.add((nr,nc))
            queue.append((nr,nc))
      steps += 1
    return -1  // unreachable

**Multi-Source BFS**
  // Initialize queue with ALL sources at once
  queue ← [all rotten oranges]
  visited ← set(queue)
  // BFS as usual — each level = 1 time unit

### 4 · Deep Dive
**Edge cases**
• Source == target → return 0
• No valid path → return -1; check if all cells were reachable
• Grid with all obstacles → nothing to explore
• Disconnected graph → BFS only reaches the connected component

**When BFS fails**
• Weighted graphs → use Dijkstra (BFS assumes all edges cost 1)
• Need to explore ALL paths, not just shortest → DFS/backtracking
• State-space BFS (e.g., puzzle games) can explode without pruning

**Complexity reasoning**
• Time O(V + E): each node enqueued and dequeued once; each edge examined once via adjacency scan.
• For a grid m×n: O(m·n) time, O(m·n) space for visited + queue.
• Multi-source BFS has the same complexity — just multiple starting points.

### 5 · Hidden Tricks & Pro Tips
• **0-1 BFS**: if edges have weight 0 or 1, use a deque. Weight-0 edges push to front, weight-1 to back. Still O(V+E).
• **Bi-directional BFS**: start from both source and target; meet in the middle. Reduces search space from O(b^d) to O(b^(d/2)).
• **Multi-source BFS**: initialize queue with all sources at once (rotten oranges, walls & gates, etc.).
• **State BFS**: expand the "node" to include extra state (e.g., keys collected, walls broken). Visited becomes a set of (position, state).
• **Shortest path with constraint**: BFS on (node, remaining_constraint). E.g., "shortest path with at most K stops."
• **Grid BFS direction array**: const dirs = [[0,1],[0,-1],[1,0],[-1,0]]; → clean loop instead of 4 if-statements.
• **Early termination**: return as soon as you dequeue the goal — no need to process the rest of the level.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. Why does BFS guarantee shortest path in an unweighted graph?
  A) It uses a stack  B) It visits nodes in order of increasing distance  C) It sorts edges  D) It uses recursion

Q2. In multi-source BFS, how do you initialize the queue?
  A) With one random source  B) With all sources at once  C) With the goal node  D) Empty queue

Q3. What data structure does 0-1 BFS use instead of a regular queue?
  A) Stack  B) Priority queue  C) Deque  D) Linked list

**Problem Prompts**
1. [Medium] Number of Islands — BFS from each unvisited land cell  (subpattern: connected components)
2. [Medium] Rotten Oranges — multi-source BFS for minimum time  (subpattern: multi-source spreading)
3. [Medium] Shortest Path in Binary Matrix — BFS with 8-directional movement  (subpattern: grid shortest path)
4. [Hard]  Word Ladder — BFS on word transformations  (subpattern: implicit graph BFS)
5. [Medium] Open the Lock — state-space BFS with 4-digit combinations  (subpattern: state BFS)
        `,
        examples: [
            "Finding the number of islands in a 2D grid",
            "Minimum time for all oranges to rot (multi-source BFS)",
            "Shortest path through a binary matrix",
            "Minimum word transformations in a dictionary (Word Ladder)",
            "Level-order traversal of a binary tree"
        ],
        problems: [
            { id: "number-of-connected-islands", title: "Number of Islands", difficulty: "Medium", status: "pending", link: "/problem/number-of-connected-islands" },
            { id: "rotten-oranges", title: "Rotten Oranges", difficulty: "Medium", status: "pending", link: "/problem/rotten-oranges" },
            { id: "shortest-path-in-binary-matrix", title: "Shortest Path in Binary Matrix", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/shortest-path-in-binary-matrix/", link: "/problem/shortest-path-in-binary-matrix" },
            { id: "word-ladder-transformation", title: "Word Ladder", difficulty: "Hard", status: "pending", link: "/problem/word-ladder-transformation" },
            { id: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/binary-tree-level-order-traversal/", link: "/problem/binary-tree-level-order-traversal" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 9 — 1D Dynamic Programming
    // ─────────────────────────────────────────────
    {
        id: "dp-1d",
        name: "1D Dynamic Programming",
        category: "Dynamic Programming",
        difficulty: "Medium",
        description: "Solve optimization or counting problems by defining dp[i] as a function of previous states along a single dimension.",
        theory: `
### 1 · Intuition
1D DP is the simplest form of dynamic programming: you define a single array dp[] where dp[i] represents the answer to the sub-problem ending at (or considering the first i elements of) the input. Each dp[i] depends on one or more previous entries, so you fill the array left-to-right and the final answer sits at dp[n] or max(dp[]).

The magic: instead of recomputing overlapping sub-problems via recursion, you store each intermediate result once and look it up in O(1).

### 2 · Step-by-Step Build-up
**Brute Force — Fibonacci example**
Recursive fib(n) = fib(n-1) + fib(n-2) recomputes the same values exponentially → O(2^n).

**Top-Down (Memoization)**
Add a cache: if already computed, return it. O(n) time, O(n) space.

**Bottom-Up (Tabulation)**
Fill dp[] iteratively:
  dp[0] = 0, dp[1] = 1
  for i from 2 to n:
    dp[i] = dp[i-1] + dp[i-2]

**Space Optimization**
Often dp[i] only depends on the last 1–2 entries → use two variables instead of an array → O(1) space.

### 3 · Formal Pattern Template
**When to use**
• Overlapping sub-problems + optimal substructure along ONE dimension
• Counting paths / ways (climbing stairs, coin change count)
• Optimization (maximum subarray, house robber, best stock trade)
• Subsequence problems with 1D state (longest increasing subsequence)

**Invariants**
• dp[i] fully determined by dp[0..i-1] (no future dependency)
• Recurrence relationship must be well-defined and acyclic
• Base cases must cover the smallest sub-problems

**Generic Pseudo-code**
  // TEMPLATE 1: dp[i] depends on dp[i-1], dp[i-2]
  dp ← array of size n+1, initialize base cases
  for i from start to n:
    dp[i] ← f(dp[i-1], dp[i-2], ...)
  return dp[n]

  // TEMPLATE 2: dp[i] depends on ALL previous dp[j] where j < i
  dp ← array of size n, all initialized to 1 (or base)
  for i from 1 to n-1:
    for j from 0 to i-1:
      if condition(j, i):
        dp[i] ← optimize(dp[i], dp[j] + cost)
  return aggregate(dp)

### 4 · Deep Dive
**Edge cases**
• n = 0 or n = 1 → base case directly
• All negative values (max subarray) → Kadane still works; the answer is the least negative
• Coin change with impossible target → return -1 (dp[target] stays at Infinity)

**When 1D DP fails**
• Two independent dimensions (e.g., two strings, grid traversal) → need 2D DP
• State has more than one index variable (e.g., position AND remaining capacity) → multi-dimensional DP

**Complexity reasoning**
• Time: O(n) if each state depends on O(1) previous states; O(n²) if each depends on all previous.
• Space: O(n) for the dp array; often reducible to O(1) with rolling variables.

### 5 · Hidden Tricks & Pro Tips
• **Kadane's Algorithm** (max subarray): dp[i] = max(arr[i], dp[i-1] + arr[i]). Only keep "current max ending here" → O(1) space.
• **House Robber**: dp[i] = max(dp[i-1], dp[i-2] + money[i]). The "skip one" recurrence eliminates adjacency conflicts.
• **Climbing Stairs**: identical to Fibonacci. dp[i] = dp[i-1] + dp[i-2]. Classic "ways" problem.
• **Coin Change (min coins)**: dp[amount] = min over all coins c of (dp[amount-c] + 1). Unbounded knapsack flavor.
• **Longest Increasing Subsequence (LIS)**: O(n²) DP, but can be optimized to O(n log n) with patience sorting + binary search.
• **Space trick**: whenever dp[i] depends on only dp[i-1] and dp[i-2], replace the array with two variables: prev1, prev2.
• **State machine DP**: "Best Time to Buy/Sell Stock with Cooldown" → states: hold, sold, rest, each with its own 1D recurrence.
• **Print the solution**: store a "parent" or "choice" array alongside DP to reconstruct the path.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. In Kadane's algorithm, what does dp[i] represent?
  A) Max subarray sum ending at i  B) Max subarray sum in [0..i]  C) Sum of first i elements  D) Length of longest subarray

Q2. For House Robber, why can't you rob adjacent houses?
  A) The DP table would overflow  B) Problem constraint — adjacency triggers alarm  C) Array indices must differ by 2  D) It's a tree

Q3. When can you reduce 1D DP space from O(n) to O(1)?
  A) Always  B) When dp[i] depends only on a constant number of previous states  C) When the array is sorted  D) Never

**Problem Prompts**
1. [Easy]  Climbing Stairs — count ways to reach step n  (subpattern: Fibonacci-style)
2. [Easy]  Maximum Subarray (Kadane) — max contiguous sum  (subpattern: running max)
3. [Medium] House Robber — max sum with no two adjacent  (subpattern: skip recurrence)
4. [Medium] Coin Change — minimum coins to reach amount  (subpattern: unbounded knapsack)
5. [Medium] Longest Increasing Subsequence — length of LIS  (subpattern: all-previous scan)
        `,
        examples: [
            "Counting ways to climb stairs (Fibonacci variant)",
            "Maximum contiguous subarray sum (Kadane's Algorithm)",
            "Maximum robbery without triggering adjacent alarms",
            "Minimum coins to make change for an amount",
            "Longest increasing subsequence length"
        ],
        problems: [
            { id: "climbing-stairs", title: "Climbing Stairs", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/climbing-stairs/", link: "/problem/climbing-stairs" },
            { id: "maximum-subarray", title: "Maximum Subarray", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/maximum-subarray/", link: "/problem/maximum-subarray" },
            { id: "house-robber", title: "House Robber", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/house-robber/", link: "/problem/house-robber" },
            { id: "coin-change", title: "Coin Change", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/coin-change/", link: "/problem/coin-change" },
            { id: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-increasing-subsequence/", link: "/problem/longest-increasing-subsequence" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 10 — 2D Dynamic Programming
    // ─────────────────────────────────────────────
    {
        id: "dp-2d",
        name: "2D Dynamic Programming",
        category: "Dynamic Programming",
        difficulty: "Hard",
        description: "Extend DP to two dimensions — dp[i][j] captures sub-problem states defined by two indices, such as grid position or item-capacity pairs.",
        theory: `
### 1 · Intuition
When a problem has **two independent variables** (grid row & column, knapsack item & capacity, two string indices), a single 1D array is not enough. 2D DP uses a table dp[i][j] where each cell is computed from its neighbors — typically dp[i-1][j], dp[i][j-1], or dp[i-1][j-1].

Think of filling a spreadsheet: each cell's value is a formula referencing cells above, to the left, or diagonally above-left. You fill row by row, left to right, and the answer sits in a corner or as an aggregate.

### 2 · Step-by-Step Build-up
**Brute Force — Grid Paths**
Count all paths from (0,0) to (m-1,n-1) moving only right or down → exponential recursion.

**Observation**
Paths to (i,j) = paths to (i-1,j) + paths to (i,j-1). Overlapping sub-problems!

**2D DP — O(m·n)**
  dp[0][0] = 1
  Fill first row and column with 1
  for i from 1 to m-1:
    for j from 1 to n-1:
      dp[i][j] = dp[i-1][j] + dp[i][j-1]
  return dp[m-1][n-1]

### 3 · Formal Pattern Template
**When to use**
• Grid traversal (unique paths, minimum path sum, dungeon game)
• 0/1 Knapsack and bounded knapsack (items × capacity)
• Two sequences compared element-by-element (LCS, edit distance)
• Interval DP (dp[i][j] = best for subarray[i..j])

**Invariants**
• dp[i][j] is fully determined by cells already computed (left, above, diagonal)
• Row-by-row, column-by-column, or diagonal-by-diagonal fill order
• Base cases: first row, first column, or trivial intervals

**Generic Pseudo-code**
  // Grid DP
  dp ← 2D array [m][n]
  dp[0][0] ← base
  fill first row and first column
  for i from 1 to m-1:
    for j from 1 to n-1:
      dp[i][j] ← combine(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m-1][n-1]

  // Knapsack DP
  dp ← 2D array [n+1][W+1], initialized to 0
  for i from 1 to n:
    for w from 0 to W:
      dp[i][w] ← dp[i-1][w]            // skip item i
      if wt[i] <= w:
        dp[i][w] ← max(dp[i][w], dp[i-1][w-wt[i]] + val[i])  // take item i
  return dp[n][W]

### 4 · Deep Dive
**Edge cases**
• Grid with obstacles → set dp[i][j] = 0 for obstacle cells
• Empty grid (m=0 or n=0) → return 0
• Knapsack with item weight > capacity → skip that item
• All items have the same weight → degenerates to a simpler counting problem

**When 2D DP fails / is overkill**
• If one dimension doesn't affect the state (e.g., order doesn't matter in unbounded knapsack), you can use 1D DP.
• If the 2D table is too large (e.g., 10^5 × 10^5), look for space optimization or a different approach entirely.

**Complexity reasoning**
• Time: O(m·n) to fill the table, where m and n are the sizes of the two dimensions.
• Space: O(m·n) for the full table; often reducible to O(min(m,n)) by keeping only two rows.

### 5 · Hidden Tricks & Pro Tips
• **Space optimization**: if dp[i][j] depends only on row i and row i-1, allocate just two 1D arrays and alternate (or even one array updated in-place from right to left for knapsack).
• **0/1 Knapsack 1D trick**: iterate capacity from HIGH to LOW in a single row to avoid using the same item twice.
• **Minimum Path Sum**: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). Modify grid in-place if allowed.
• **Interval DP**: dp[i][j] = best answer for subarray[i..j]. Iterate by gap length: for len in 2..n, for i in 0..n-len.
• **Matrix Chain Multiplication**: classic interval DP. dp[i][j] = min cost to multiply matrices i through j.
• **Diagonal fill**: some problems (e.g., palindrome partitioning) require filling diagonally or by interval length rather than row-by-row.
• **Reconstruct solution**: store choices in a companion table. Trace back from dp[m-1][n-1] to (0,0).
• **Multiple grids**: sometimes the "2D" is over two separate sequences (LCS) rather than a spatial grid.

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. In the 0/1 Knapsack, what does dp[i][w] represent?
  A) Max value using first i items with capacity w  B) Min weight for value w  C) Number of items  D) Max weight

Q2. How can you reduce 2D DP to 1D for Knapsack?
  A) Use a hash map  B) Iterate capacity from right to left in a single array  C) Sort items  D) Use recursion

Q3. For Unique Paths in a grid with obstacles, what value does dp[i][j] get when grid[i][j] is blocked?
  A) dp[i-1][j] + dp[i][j-1]  B) 1  C) 0  D) -1

**Problem Prompts**
1. [Medium] Unique Paths — count paths from top-left to bottom-right  (subpattern: grid counting)
2. [Medium] Minimum Path Sum — cheapest path through a weighted grid  (subpattern: grid optimization)
3. [Medium] 0/1 Knapsack — maximize value within weight capacity  (subpattern: item-capacity)
4. [Hard]  Dungeon Game — minimum HP to reach princess  (subpattern: reverse grid DP)
5. [Medium] Matrix Chain Multiplication — minimize multiply cost  (subpattern: interval DP)
        `,
        examples: [
            "Counting unique paths through a grid",
            "Finding minimum path sum from top-left to bottom-right",
            "0/1 Knapsack — maximize value within capacity",
            "Matrix chain multiplication order optimization",
            "Cherry pickup across a grid (multiple traversals)"
        ],
        problems: [
            { id: "unique-paths", title: "Unique Paths", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/unique-paths/", link: "/problem/unique-paths" },
            { id: "minimum-path-sum", title: "Minimum Path Sum", difficulty: "Medium", status: "pending", link: "/problem/minimum-path-sum" },
            { id: "0-1-knapsack", title: "0/1 Knapsack", difficulty: "Medium", status: "pending", link: "/problem/0-1-knapsack" },
            { id: "coin-change", title: "Coin Change", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/coin-change/", link: "/problem/coin-change" },
            { id: "maximal-square", title: "Maximal Square", difficulty: "Medium", status: "pending", link: "/problem/maximal-square" }
        ]
    },

    // ─────────────────────────────────────────────
    // PATTERN 11 — DP on Strings
    // ─────────────────────────────────────────────
    {
        id: "dp-strings",
        name: "DP on Strings",
        category: "Dynamic Programming",
        difficulty: "Hard",
        description: "Use 2D DP tables indexed by positions in two strings to solve comparison, transformation, and subsequence matching problems.",
        theory: `
### 1 · Intuition
String DP problems almost always involve **comparing two strings character by character**. You build a 2D table dp[i][j] where i indexes into string A and j into string B. Each cell asks: "What is the answer considering A[0..i-1] and B[0..j-1]?"

The three universal transitions — **match** (diagonal), **insert/skip** (left), **delete/skip** (up) — correspond to aligning characters, adding a gap in one string, or adding a gap in the other. This framework unifies edit distance, LCS, regex matching, interleaving, and more.

### 2 · Step-by-Step Build-up
**Brute Force — LCS**
Try all 2^m subsequences of A, check each against B → O(2^m · n).

**Observation**
If A[i] == B[j], the LCS grows by 1. Otherwise, the answer is the best of skipping A[i] or skipping B[j]. This gives overlapping sub-problems!

**DP — O(m·n)**
  dp[0][j] = 0 for all j  (empty A)
  dp[i][0] = 0 for all i  (empty B)
  for i from 1 to m:
    for j from 1 to n:
      if A[i-1] == B[j-1]:
        dp[i][j] = dp[i-1][j-1] + 1         // match
      else:
        dp[i][j] = max(dp[i-1][j], dp[i][j-1])  // skip

### 3 · Formal Pattern Template
**When to use**
• Longest Common Subsequence (LCS) / Shortest Common Supersequence
• Edit Distance (Levenshtein Distance)
• Wildcard / Regex Matching
• Interleaving Strings
• Palindromic Subsequences / Substrings
• String alignment and diff algorithms

**Invariants**
• dp[i][j] considers only A[0..i-1] and B[0..j-1]
• Base cases: dp[0][j] and dp[i][0] represent one string being empty
• Transitions never look at dp[i+1][*] or dp[*][j+1] → fill left-to-right, top-to-bottom

**Generic Pseudo-code (LCS template)**
  function lcs(A, B):
    m, n ← len(A), len(B)
    dp ← (m+1) × (n+1) table of 0
    for i from 1 to m:
      for j from 1 to n:
        if A[i-1] == B[j-1]:
          dp[i][j] ← dp[i-1][j-1] + 1
        else:
          dp[i][j] ← max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]

**Edit Distance template**
  function editDist(A, B):
    m, n ← len(A), len(B)
    dp[i][0] ← i, dp[0][j] ← j     // base: all insertions/deletions
    for i from 1 to m:
      for j from 1 to n:
        if A[i-1] == B[j-1]:
          dp[i][j] ← dp[i-1][j-1]              // no cost
        else:
          dp[i][j] ← 1 + min(
            dp[i-1][j],       // delete from A
            dp[i][j-1],       // insert into A
            dp[i-1][j-1]      // replace
          )
    return dp[m][n]

### 4 · Deep Dive
**Edge cases**
• One or both strings empty → answer is 0 for LCS, length of the other for edit distance
• Identical strings → LCS = length, edit distance = 0
• Single-character strings → direct comparison

**When string DP fails / needs adaptation**
• Very long strings (m, n > 10^4) → O(m·n) may TLE; look for Hirschberg (O(n) space) or other tricks.
• Wildcards with '*' → each '*' can match 0 or more characters; transitions add complexity.
• Regex with grouping / backrefs → DP alone can't handle these; NFA simulation needed.

**Complexity reasoning**
• Time: O(m·n) — filling an m×n table with O(1) per cell.
• Space: O(m·n), reducible to O(min(m,n)) since each row depends only on the previous row.

### 5 · Hidden Tricks & Pro Tips
• **LCS → LIS reduction**: LCS of two permutations can be computed in O(n log n) by mapping to Longest Increasing Subsequence.
• **Print the LCS**: trace back from dp[m][n] — diagonal = matched character, up/left = skip.
• **Shortest Common Supersequence**: length = m + n - LCS(A,B). Reconstruct by interleaving LCS trace.
• **Palindrome as LCS**: Longest Palindromic Subsequence = LCS(s, reverse(s)).
• **Wildcard Matching**: dp[i][j] = does pattern[0..i-1] match text[0..j-1]? Handle '*' as 0 or more chars.
• **Space optimization**: use two rows (prev[], curr[]). For edit distance, you also need prev[j-1] (save it before overwriting).
• **Rolling hash + DP**: for approximate string matching with mismatches, combine DP with hashing.
• **Longest Palindromic Substring**: expand-around-center O(n²) is simpler than DP, but Manacher's is O(n).

### 6 · Micro Quiz & Practice

**Conceptual MCQs**
Q1. In the LCS DP table, what does a diagonal move from dp[i-1][j-1] to dp[i][j] signify?
  A) Deletion  B) Insertion  C) Character match  D) Replacement

Q2. What are the base cases for Edit Distance?
  A) dp[0][0] = 1  B) dp[i][0] = i, dp[0][j] = j  C) dp[i][0] = 0  D) dp[m][n] = 0

Q3. How can you find the Longest Palindromic Subsequence using LCS?
  A) LCS of string and itself  B) LCS of string and its sorted version  C) LCS of string and its reverse  D) LCS of string and a random string

**Problem Prompts**
1. [Medium] Longest Common Subsequence — classic two-string DP  (subpattern: LCS)
2. [Hard]  Edit Distance — minimum insertions, deletions, replacements  (subpattern: transformation)
3. [Medium] Longest Palindromic Subsequence — LCS with reverse  (subpattern: palindrome matching)
4. [Hard]  Wildcard Matching — pattern with '?' and '*'  (subpattern: matching DP)
5. [Medium] Interleaving String — can s3 be interleaved from s1 and s2  (subpattern: interleave check)
        `,
        examples: [
            "Finding the Longest Common Subsequence of two strings",
            "Computing Edit Distance (minimum operations to transform one string to another)",
            "Longest Palindromic Subsequence via LCS with reverse",
            "Wildcard pattern matching with '?' and '*'",
            "Checking if a string is a valid interleaving of two others"
        ],
        problems: [
            { id: "longest-common-subsequence", title: "Longest Common Subsequence", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/longest-common-subsequence/", link: "/problem/longest-common-subsequence" },
            { id: "edit-distance", title: "Edit Distance", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/edit-distance/", link: "/problem/edit-distance" },
            { id: "longest-palindromic-subsequence", title: "Longest Palindromic Subsequence", difficulty: "Medium", status: "pending", link: "/problem/longest-palindromic-subsequence" },
            { id: "wildcard-matching", title: "Wildcard Matching", difficulty: "Hard", status: "pending", link: "/problem/wildcard-matching" },
            { id: "interleaving-string", title: "Interleaving String", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/interleaving-string/", link: "/problem/interleaving-string" }
        ]
    },

    // ── PATTERN 12 — Prefix Sum ──
    {
        id: "prefix-sum",
        name: "Prefix Sum",
        category: "Array & String",
        difficulty: "Easy",
        description: "Precompute cumulative sums so any subarray sum can be answered in O(1) after O(n) preprocessing.",
        theory: `
### 1 · Intuition
Computing the sum of a subarray arr[L..R] naively requires iterating from L to R — O(n) per query. With **prefix sums**, you precompute a running total: prefix[i] = arr[0] + arr[1] + … + arr[i-1]. Then sum(L,R) = prefix[R+1] − prefix[L] in O(1).

This transforms repeated range-sum queries from O(n) each to O(1) each, after a one-time O(n) build step.

### 2 · Step-by-Step Build-up
**Brute Force** — For each query, loop from L to R summing elements → O(n) per query.

**Prefix Sum Array — O(n) build, O(1) per query**
  prefix[0] = 0
  for i from 0 to n-1:
    prefix[i+1] = prefix[i] + arr[i]
  sum(L, R) = prefix[R+1] - prefix[L]

### 3 · Formal Pattern Template
**When to use**
• Multiple subarray sum queries on a static array
• "Subarray with sum equal to K" → prefix[j] - prefix[i] == K → hash map lookup
• 2D prefix sums for rectangle sum queries on matrices
• Difference arrays for range-update operations

**Invariants**
• prefix[i] = sum of first i elements; prefix[0] = 0
• sum(L,R) = prefix[R+1] - prefix[L] always holds

**Pseudo-code**
  function buildPrefix(arr):
    n ← len(arr)
    prefix ← [0] * (n+1)
    for i from 0 to n-1:
      prefix[i+1] ← prefix[i] + arr[i]
    return prefix

### 4 · Deep Dive
**Edge cases** — Empty array, single element, all zeros, overflow with large sums.
**When it fails** — Dynamic arrays with frequent insertions (use Fenwick/BIT instead).
**Complexity** — Build: O(n), Query: O(1), Space: O(n).

### 5 · Hidden Tricks & Pro Tips
• **Subarray sum equals K**: use hash map of prefix sums. Count prefix[j] - K in map.
• **2D prefix sum**: prefix[i][j] = sum of rectangle (0,0) to (i-1,j-1). Query any rectangle in O(1).
• **Difference array**: for range updates [L,R] += val, do diff[L] += val, diff[R+1] -= val, then prefix-sum the diff array.
• **Running average**: prefix[i]/i gives average of first i elements.
• **XOR prefix**: works for XOR queries the same way sum prefix works for addition.

### 6 · Micro Quiz & Practice
Q1. What is sum(2,5) if prefix = [0,1,3,6,10,15,21]? A) 18  B) 12  C) 15  D) 9
Q2. How do you find "number of subarrays with sum K"? A) Two loops  B) Prefix sum + hash map  C) Sorting  D) Binary search

**Problem Prompts**
1. [Easy] Running Sum of 1D Array  2. [Medium] Subarray Sum Equals K  3. [Medium] Product of Array Except Self  4. [Hard] Count of Range Sum
        `,
        examples: ["Range sum queries in O(1)", "Subarray sum equals K using hash map", "2D rectangle sum queries"],
        problems: [
            { id: "subarray-sum-equals-k", title: "Subarray Sum Equals K", difficulty: "Medium", status: "pending", link: "/problem/subarray-sum-equals-k" },
            { id: "product-of-array-except-self", title: "Product of Array Except Self", difficulty: "Medium", status: "pending", link: "/problem/product-array-except-self" },
            { id: "contiguous-array", title: "Contiguous Array", difficulty: "Medium", status: "pending", link: "/problem/contiguous-array" }
        ]
    },

    // ── PATTERN 13 — DFS on Graph / Tree ──
    {
        id: "dfs-graph-tree",
        name: "DFS on Graph / Tree",
        category: "Graph & Tree",
        difficulty: "Medium",
        description: "Explore as deep as possible before backtracking. DFS is the go-to for connectivity, cycle detection, topological order, and tree traversals.",
        theory: `
### 1 · Intuition
DFS dives deep along one branch before backtracking to explore others. On a tree it visits root → left subtree (fully) → right subtree (fully). On a graph it follows edges greedily, marking nodes as visited, and backtracks when stuck.

DFS is naturally recursive (or uses an explicit stack). It excels at problems needing **complete exploration** of a component, **path existence**, or **ordering** (topological sort, strongly connected components).

### 2 · Step-by-Step Build-up
**Recursive DFS**
  function dfs(node, visited):
    visited.add(node)
    for neighbor in adj(node):
      if neighbor not in visited:
        dfs(neighbor, visited)

**Iterative DFS (stack)**
  stack = [start], visited = set()
  while stack:
    node = stack.pop()
    if node in visited: continue
    visited.add(node)
    for neighbor in adj(node):
      stack.push(neighbor)

### 3 · Formal Pattern Template
**When to use** — Connected components, cycle detection, path finding, tree traversals (pre/in/post order), topological sort (via finish times), flood fill, island counting.

**Invariants** — Each node visited exactly once. Stack depth ≤ longest path (watch for stack overflow on deep graphs — use iterative).

**Complexity** — Time O(V+E), Space O(V) for visited + O(V) stack depth.

### 4 · Deep Dive
**Edge cases** — Disconnected graph (loop over all nodes), self-loops, single node.
**DFS vs BFS** — DFS for exhaustive search / paths; BFS for shortest path in unweighted graph.
**Tree traversals** — Pre-order (root first), In-order (left-root-right, gives sorted BST), Post-order (children first).

### 5 · Hidden Tricks & Pro Tips
• **Cycle detection in directed graphs**: track GRAY (in-progress) nodes. Back-edge to GRAY = cycle.
• **Cycle detection in undirected graphs**: if neighbor is visited AND not parent, cycle found.
• **Connected components**: run DFS from each unvisited node; each run = one component.
• **Tree diameter**: two DFS passes — farthest from any node, then farthest from that node.
• **Flood fill**: DFS/BFS from a cell, mark all connected same-color cells.
• **Iterative post-order**: use two stacks or a flag to simulate post-order without recursion.

### 6 · Micro Quiz & Practice
Q1. DFS uses which data structure? A) Queue  B) Stack  C) Heap  D) Array
Q2. In-order traversal of a BST gives? A) Random order  B) Sorted order  C) Reverse order  D) Level order

**Problem Prompts**
1. [Easy] Max Depth of Binary Tree  2. [Medium] Number of Islands  3. [Medium] Course Schedule (cycle detection)  4. [Medium] Path Sum II  5. [Hard] Serialize & Deserialize Binary Tree
        `,
        examples: ["Tree traversals (pre/in/post order)", "Connected components in a graph", "Cycle detection in directed graph", "Flood fill on a grid"],
        problems: [
            { id: "max-depth-of-binary-tree", title: "Max Depth of Binary Tree", difficulty: "Easy", status: "pending", link: "/problem/max-depth-of-binary-tree" },
            { id: "number-of-connected-islands", title: "Number of Islands", difficulty: "Medium", status: "pending", link: "/problem/number-of-connected-islands" },
            { id: "course-schedule", title: "Course Schedule", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/course-schedule/", link: "/problem/course-schedule" },
            { id: "validate-bst", title: "Validate BST", difficulty: "Medium", status: "pending", link: "/problem/validate-bst" }
        ]
    },

    // ── PATTERN 14 — Backtracking ──
    {
        id: "backtracking",
        name: "Backtracking",
        category: "Recursion",
        difficulty: "Medium",
        description: "Build solutions incrementally, abandoning ('backtracking') a path as soon as it violates constraints — systematic brute force with pruning.",
        theory: `
### 1 · Intuition
Backtracking is **constrained DFS on a decision tree**. At each step you make a choice (pick an element, place a queen, choose a digit). If the choice leads to a dead end (constraint violated), you undo it and try the next option. This prunes large portions of the search space.

Think of solving a maze: go forward, hit a wall, go back to the last fork, try another path.

### 2 · Step-by-Step Build-up
**Template**
  function backtrack(state, choices):
    if isComplete(state):
      results.add(copy(state))
      return
    for choice in choices:
      if isValid(state, choice):
        state.add(choice)        // make choice
        backtrack(state, remaining_choices)
        state.remove(choice)     // undo choice (backtrack)

### 3 · Formal Pattern Template
**When to use** — Permutations, combinations, subsets, N-Queens, Sudoku, word search, partition problems, constraint satisfaction.

**Key decisions**: 1) What are the choices at each step? 2) What constraints eliminate choices? 3) When is the solution complete?

**Complexity** — Often exponential O(k^n) or O(n!), but pruning makes it practical for moderate inputs.

### 4 · Deep Dive
**Pruning strategies** — Sort input to skip duplicates early, check constraints before recursing, use bitmasks for visited tracking.
**Permutations vs Combinations** — Permutations: order matters, use visited array. Combinations: order doesn't matter, use start index.
**Deduplication** — Sort + skip if arr[i] == arr[i-1] and i-1 was not used at this level.

### 5 · Hidden Tricks & Pro Tips
• **Subsets**: at each index, choose to include or exclude → 2^n subsets.
• **N-Queens**: place queens row by row; track columns, diagonals, anti-diagonals in sets.
• **Sudoku**: try digits 1–9 in each empty cell; validate row, col, box constraints.
• **Word Search**: DFS + backtrack on grid; mark cell visited during path, unmark on return.
• **Palindrome Partitioning**: try all cut positions; only recurse if prefix is palindrome.
• **Time limit**: if n ≤ ~15–20, backtracking is usually feasible.

### 6 · Micro Quiz & Practice
Q1. What makes backtracking different from plain DFS? A) Uses BFS  B) Undoes choices  C) Uses DP  D) Sorts first
Q2. For generating all subsets of n elements, how many subsets exist? A) n  B) n²  C) 2^n  D) n!

**Problem Prompts**
1. [Medium] Subsets  2. [Medium] Permutations  3. [Medium] Combination Sum  4. [Hard] N-Queens  5. [Hard] Sudoku Solver
        `,
        examples: ["Generating all permutations/combinations", "N-Queens puzzle", "Sudoku solver", "Word search in a grid"],
        problems: [
            { id: "subsets", title: "Subsets", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/subsets/", link: "/problem/subsets" },
            { id: "permutations", title: "Permutations", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/permutations/", link: "/problem/permutations" },
            { id: "combination-sum", title: "Combination Sum", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/combination-sum/", link: "/problem/combination-sum" },
            { id: "n-queens", title: "N-Queens", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/n-queens/", link: "/problem/n-queens" },
            { id: "word-search", title: "Word Search", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/word-search/", link: "/problem/word-search" }
        ]
    },

    // ── PATTERN 15 — Greedy Algorithms ──
    {
        id: "greedy",
        name: "Greedy Algorithms",
        category: "Greedy",
        difficulty: "Medium",
        description: "Make the locally optimal choice at each step, trusting that it leads to a globally optimal solution — no backtracking needed.",
        theory: `
### 1 · Intuition
Greedy algorithms make the **best immediate choice** without reconsidering. Unlike DP (which explores all states) or backtracking (which undoes choices), greedy commits irrevocably. This works when the problem has the **greedy choice property** — a locally optimal choice is part of some globally optimal solution.

The challenge: proving greedy works (exchange argument, induction). Many problems *look* greedy but aren't.

### 2 · Step-by-Step Build-up
**General Template**
  sort(items by some criterion)
  result = initial
  for item in items:
    if item fits constraints:
      result = update(result, item)
  return result

### 3 · Formal Pattern Template
**When to use** — Interval scheduling (meeting rooms, merge intervals), activity selection, Huffman coding, minimum spanning tree (Kruskal/Prim), shortest path (Dijkstra), fractional knapsack, jump game, task scheduling.

**Proof strategies** — Exchange argument: show swapping any non-greedy choice with the greedy one doesn't worsen the solution. Or: greedy stays ahead — at every step, greedy is at least as good as any alternative.

**Complexity** — Usually O(n log n) dominated by sorting. The greedy scan itself is O(n).

### 4 · Deep Dive
**When greedy fails** — 0/1 Knapsack (need DP), Traveling Salesman, longest path in general graphs.
**Greedy vs DP** — If optimal substructure + greedy choice property → greedy. If only optimal substructure → DP.

### 5 · Hidden Tricks & Pro Tips
• **Activity/Interval Selection**: sort by end time, greedily pick non-overlapping.
• **Jump Game**: track farthest reachable index; if current > farthest, impossible.
• **Gas Station**: if total gas ≥ total cost, solution exists. Find starting point with running sum.
• **Assign Cookies**: sort children & cookies; greedily match smallest cookie to smallest child.
• **Task Scheduler**: calculate idle slots based on max-frequency task.
• **Minimum Platforms**: sort arrivals and departures; sweep-line to track overlaps.

### 6 · Micro Quiz & Practice
Q1. Greedy works when the problem has? A) Overlapping subproblems  B) Greedy choice property  C) Negative cycles  D) Random input
Q2. For interval scheduling, sort by? A) Start time  B) End time  C) Duration  D) Alphabetically

**Problem Prompts**
1. [Easy] Assign Cookies  2. [Medium] Jump Game  3. [Medium] Gas Station  4. [Medium] Task Scheduler  5. [Hard] Minimum Number of Platforms
        `,
        examples: ["Activity selection / interval scheduling", "Jump Game — can you reach the end?", "Gas station circular tour", "Task scheduling with cooldown"],
        problems: [
            { id: "jump-game", title: "Jump Game", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/jump-game/", link: "/problem/jump-game" },
            { id: "gas-station", title: "Gas Station", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/gas-station/", link: "/problem/gas-station" },
            { id: "task-scheduler", title: "Task Scheduler", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/task-scheduler/", link: "/problem/task-scheduler" },
            { id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/merge-intervals/", link: "/problem/merge-intervals" }
        ]
    },

    // ── PATTERN 16 — Topological Sort ──
    {
        id: "topological-sort",
        name: "Topological Sort",
        category: "Graph",
        difficulty: "Medium",
        description: "Order nodes of a DAG so every edge u→v has u before v. Essential for dependency resolution, build systems, and course scheduling.",
        theory: `
### 1 · Intuition
In a **Directed Acyclic Graph (DAG)**, topological sort produces a linear ordering where for every directed edge (u, v), u appears before v. Think: course prerequisites — you must take prerequisite courses first.

Two approaches: **Kahn's BFS** (process nodes with in-degree 0) and **DFS-based** (reverse post-order finish times).

### 2 · Step-by-Step Build-up
**Kahn's Algorithm (BFS)**
  Compute in-degree for all nodes
  queue ← all nodes with in-degree 0
  order ← []
  while queue:
    node ← queue.popleft()
    order.append(node)
    for neighbor in adj(node):
      in_degree[neighbor] -= 1
      if in_degree[neighbor] == 0:
        queue.append(neighbor)
  if len(order) != numNodes: cycle detected!

**DFS-based**
  Run DFS; when a node finishes (all descendants processed), push to stack.
  Pop stack → topological order.

### 3 · Formal Pattern Template
**When to use** — Course scheduling, build order, task dependencies, detecting cycles in directed graphs, alien dictionary, parallel job scheduling.

**Invariants** — Only works on DAGs. If cycle exists, no valid topological order.
**Complexity** — O(V + E) for both Kahn's and DFS approaches.

### 4 · Deep Dive
**Cycle detection** — Kahn's: if order length < V, cycle exists. DFS: back-edge to gray node = cycle.
**Multiple valid orders** — If multiple nodes have in-degree 0 simultaneously, any ordering among them is valid.
**Lexicographically smallest** — Use min-heap instead of queue in Kahn's.

### 5 · Hidden Tricks & Pro Tips
• **Course Schedule II**: Kahn's directly gives the course order.
• **Alien Dictionary**: build graph from adjacent word pairs, then topological sort.
• **Parallel processing**: nodes at the same "level" in Kahn's can run in parallel.
• **Longest path in DAG**: topological sort + DP. Process in topo order, dp[v] = max(dp[u] + weight) for all u→v.
• **Detect all cycles**: DFS with coloring (white/gray/black).

### 6 · Micro Quiz & Practice
Q1. Topological sort requires? A) Undirected graph  B) DAG  C) Complete graph  D) Weighted graph
Q2. In Kahn's algorithm, which nodes start in the queue? A) All nodes  B) Nodes with in-degree 0  C) Random nodes  D) Sink nodes

**Problem Prompts**
1. [Medium] Course Schedule  2. [Medium] Course Schedule II  3. [Hard] Alien Dictionary  4. [Medium] Find All Ancestors in DAG
        `,
        examples: ["Course prerequisite ordering", "Build system dependency resolution", "Alien dictionary character ordering"],
        problems: [
            { id: "course-schedule", title: "Course Schedule", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/course-schedule/", link: "/problem/course-schedule" },
            { id: "course-schedule-ii", title: "Course Schedule II", difficulty: "Medium", status: "pending", link: "/problem/course-schedule-ii" },
            { id: "alien-dictionary", title: "Alien Dictionary", difficulty: "Hard", status: "pending", link: "/problem/alien-dictionary" }
        ]
    },

    // ── PATTERN 17 — Union Find (Disjoint Set) ──
    {
        id: "union-find",
        name: "Union Find (Disjoint Set)",
        category: "Graph",
        difficulty: "Medium",
        description: "Track connected components dynamically using union and find operations with near-O(1) amortized performance via path compression and union by rank.",
        theory: `
### 1 · Intuition
Union-Find (Disjoint Set Union / DSU) maintains a collection of disjoint sets. Two core operations: **find(x)** — which set does x belong to? **union(x, y)** — merge the sets containing x and y. With path compression + union by rank, both operations run in nearly O(1) amortized — O(α(n)) where α is the inverse Ackermann function.

### 2 · Step-by-Step Build-up
**Naive approach** — Adjacency list + DFS for connectivity → O(V+E) per query.
**Union-Find**
  parent[i] = i for all i         // each node is its own root
  rank[i] = 0

  function find(x):
    if parent[x] != x:
      parent[x] = find(parent[x])   // path compression
    return parent[x]

  function union(x, y):
    rx, ry = find(x), find(y)
    if rx == ry: return false        // already connected
    if rank[rx] < rank[ry]: swap(rx, ry)
    parent[ry] = rx                  // union by rank
    if rank[rx] == rank[ry]: rank[rx]++
    return true

### 3 · Formal Pattern Template
**When to use** — Dynamic connectivity, Kruskal's MST, detecting cycles in undirected graphs, connected components count, accounts merge, redundant connections.
**Complexity** — O(α(n)) ≈ O(1) per operation. Space O(n).

### 4 · Deep Dive
**Cycle detection** — If find(u) == find(v) before union(u,v), adding edge u-v creates a cycle.
**Connected components** — Count distinct roots after all unions.
**Weighted union-find** — Track relative weights between nodes for problems like "evaluate division."

### 5 · Hidden Tricks & Pro Tips
• **Kruskal's MST**: sort edges by weight, union endpoints. Skip if already connected.
• **Redundant Connection**: process edges; first edge where find(u)==find(v) is the answer.
• **Number of Connected Components**: start with n components, each successful union decreases by 1.
• **Accounts Merge**: union emails to the same person; group by root.
• **Smallest String With Swaps**: union indices that can swap; sort characters within each component.

### 6 · Micro Quiz & Practice
Q1. Path compression sets parent[x] to? A) x  B) Root of x  C) Parent of parent  D) 0
Q2. Union by rank prevents? A) Cycles  B) Tall trees  C) Duplicates  D) Overflow

**Problem Prompts**
1. [Medium] Number of Connected Components  2. [Medium] Redundant Connection  3. [Medium] Accounts Merge  4. [Hard] Smallest String With Swaps
        `,
        examples: ["Dynamic connectivity queries", "Kruskal's MST edge processing", "Cycle detection in undirected graph", "Merging accounts by email"],
        problems: [
            { id: "number-of-connected-components", title: "Number of Connected Components", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", link: "/problem/number-of-connected-components" },
            { id: "redundant-connection", title: "Redundant Connection", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/redundant-connection/", link: "/problem/redundant-connection" },
            { id: "accounts-merge", title: "Accounts Merge", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/accounts-merge/", link: "/problem/accounts-merge" }
        ]
    },

    // ── PATTERN 18 — Heap / Top-K ──
    {
        id: "heap-top-k",
        name: "Heap / Top-K",
        category: "Heap",
        difficulty: "Medium",
        description: "Use a heap (priority queue) to efficiently track the K largest/smallest elements, medians, or merge K sorted streams.",
        theory: `
### 1 · Intuition
A **heap** gives O(log n) insert and O(1) peek at the min (or max) element. This makes it perfect for problems where you need to repeatedly access the extreme element: K largest items, running median, merge K sorted lists, or scheduling by priority.

**Key insight for Top-K**: maintain a min-heap of size K. Every new element either replaces the heap minimum (if larger) or is discarded. At the end, the heap contains the K largest elements.

### 2 · Step-by-Step Build-up
**Brute Force** — Sort entire array, take top K → O(n log n).
**Heap approach** — Push elements, maintain heap size K → O(n log K).

  heap = MinHeap()
  for num in arr:
    heap.push(num)
    if heap.size > K:
      heap.pop()       // remove smallest
  // heap now has K largest elements

### 3 · Formal Pattern Template
**When to use** — Top K frequent elements, Kth largest/smallest, merge K sorted lists, running median (two heaps), task scheduling by priority.
**Complexity** — O(n log K) for top-K; O(log n) per heap operation.

### 4 · Deep Dive
**Min-heap vs Max-heap** — For K largest: use min-heap of size K. For K smallest: use max-heap of size K.
**Two heaps for median** — Max-heap for lower half, min-heap for upper half. Balance sizes.
**K-way merge** — Push first element of each list. Pop min, push next from that list.

### 5 · Hidden Tricks & Pro Tips
• **Top K Frequent**: count frequencies with hash map, then use min-heap of size K on (freq, element) pairs.
• **Merge K Sorted Lists**: push (value, list_index, element_index) into min-heap. O(N log K) total.
• **Running Median**: maintain two heaps. Max-heap stores smaller half, min-heap stores larger half.
• **Kth Largest in Stream**: maintain min-heap of size K. Kth largest = heap.peek().
• **Reorganize String**: max-heap on char frequencies. Pop top two, append both, push back. Ensures no adjacent duplicates.
• **Meeting Rooms II**: min-heap of end times. For each meeting, if start >= heap.min, pop (room freed).

### 6 · Micro Quiz & Practice
Q1. For Kth largest element, which heap type? A) Max-heap of size K  B) Min-heap of size K  C) Max-heap of size N  D) Hash map
Q2. Two-heap median: the max-heap stores? A) All elements  B) Larger half  C) Smaller half  D) Even-indexed elements

**Problem Prompts**
1. [Medium] Kth Largest Element  2. [Medium] Top K Frequent Elements  3. [Hard] Merge K Sorted Lists  4. [Hard] Find Median from Data Stream
        `,
        examples: ["Finding the Kth largest element", "Top K frequent elements", "Merging K sorted lists", "Running median of a data stream"],
        problems: [
            { id: "kth-largest-element", title: "Kth Largest Element", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/kth-largest-element-in-a-stream/", link: "/problem/kth-largest-element" },
            { id: "top-k-frequent-elements", title: "Top K Frequent Elements", difficulty: "Medium", status: "pending", link: "/problem/top-k-frequent" },
            { id: "merge-k-sorted-lists", title: "Merge K Sorted Lists", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/merge-k-sorted-lists/", link: "/problem/merge-k-sorted-lists" },
            { id: "find-median-from-data-stream", title: "Find Median from Data Stream", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-median-from-data-stream/", link: "/problem/find-median-from-data-stream" }
        ]
    },

    // ── PATTERN 19 — Merge Intervals ──
    {
        id: "merge-intervals",
        name: "Merge Intervals",
        category: "Array & Sorting",
        difficulty: "Medium",
        description: "Sort intervals by start time and merge overlapping ones in a single pass. Foundational for scheduling, calendar, and range problems.",
        theory: `
### 1 · Intuition
Given a list of intervals [start, end], many overlap. Sorting by start time lets you merge greedily: if the current interval overlaps with the last merged one (start ≤ prev.end), extend; otherwise start a new merged interval.

### 2 · Step-by-Step Build-up
  sort intervals by start
  merged = [intervals[0]]
  for interval in intervals[1:]:
    if interval.start <= merged[-1].end:
      merged[-1].end = max(merged[-1].end, interval.end)
    else:
      merged.append(interval)

### 3 · Formal Pattern Template
**When to use** — Merge overlapping intervals, insert interval, meeting rooms (count overlaps), interval intersection, employee free time.
**Complexity** — O(n log n) for sort + O(n) merge pass.

### 4 · Deep Dive
**Variants** — Insert into sorted intervals: find position, merge neighbors. Interval intersection: two-pointer on two sorted interval lists. Count overlaps: sweep line with +1 at start, -1 at end.

### 5 · Hidden Tricks & Pro Tips
• **Insert Interval**: binary search for position, then merge affected neighbors.
• **Meeting Rooms II**: sort starts and ends separately; sweep-line count gives max concurrent meetings.
• **Non-overlapping Intervals**: sort by end; greedily remove intervals that overlap with the last kept one. Count removals.
• **Interval List Intersection**: two pointers, advance the one with smaller end.

### 6 · Micro Quiz & Practice
Q1. Sort intervals by? A) End time only  B) Start time  C) Duration  D) Random
Q2. Two intervals overlap when? A) start1 > end2  B) start1 <= end2 AND start2 <= end1  C) They're equal  D) Never

**Problem Prompts**
1. [Medium] Merge Intervals  2. [Medium] Insert Interval  3. [Medium] Meeting Rooms II  4. [Medium] Non-overlapping Intervals
        `,
        examples: ["Merging overlapping time slots", "Inserting a new interval", "Counting concurrent meetings", "Removing minimum intervals to avoid overlap"],
        problems: [
            { id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/merge-intervals/", link: "/problem/merge-intervals" },
            { id: "insert-interval", title: "Insert Interval", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/insert-interval/", link: "/problem/insert-interval" },
            { id: "non-overlapping-intervals", title: "Non-overlapping Intervals", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/non-overlapping-intervals/", link: "/problem/non-overlapping-intervals" }
        ]
    },

    // ── PATTERN 20 — Cyclic Sort ──
    {
        id: "cyclic-sort",
        name: "Cyclic Sort",
        category: "Array",
        difficulty: "Easy",
        description: "Place each number at its correct index in O(n) time and O(1) space — ideal for finding missing, duplicate, or out-of-place numbers in [1,n] arrays.",
        theory: `
### 1 · Intuition
When an array contains numbers in the range [1, n] (or [0, n-1]), each number x belongs at index x-1 (or x). Cyclic sort iterates through the array: if the current number isn't at its correct position, **swap it there**. After one pass, every number is at its "home" index, and any mismatches reveal missing or duplicate values.

### 2 · Step-by-Step Build-up
  i = 0
  while i < n:
    correct = arr[i] - 1          // where arr[i] should be
    if arr[i] != arr[correct]:
      swap(arr[i], arr[correct])  // put arr[i] at its correct index
    else:
      i++                         // already correct, move on

### 3 · Formal Pattern Template
**When to use** — Find missing number, find all duplicates, find the duplicate, first missing positive, set mismatch.
**Complexity** — O(n) time (each element swapped at most once), O(1) space.

### 4 · Deep Dive
**After sorting**, scan for mismatches: if arr[i] != i+1, then i+1 is missing and arr[i] is duplicate/misplaced.
**First Missing Positive**: ignore numbers ≤ 0 or > n during the cyclic-sort phase.

### 5 · Hidden Tricks & Pro Tips
• **Find Missing Number (1 to n)**: after cyclic sort, the index where arr[i] != i+1 is the answer.
• **Find All Duplicates**: after sort, positions where arr[i] != i+1 hold duplicates.
• **First Missing Positive**: filter to [1,n] range, cyclic sort, scan for first mismatch.
• **Set Mismatch**: cyclic sort reveals both the duplicate and the missing number simultaneously.

### 6 · Micro Quiz & Practice
Q1. Cyclic sort works on arrays with values in range? A) Any range  B) [1,n]  C) Sorted  D) Negative only
Q2. Time complexity of cyclic sort? A) O(n log n)  B) O(n²)  C) O(n)  D) O(1)

**Problem Prompts**
1. [Easy] Missing Number  2. [Medium] Find All Duplicates  3. [Hard] First Missing Positive  4. [Easy] Set Mismatch
        `,
        examples: ["Finding the missing number in [1,n]", "Finding all duplicates in O(1) space", "First missing positive integer"],
        problems: [
            { id: "missing-number", title: "Missing Number", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/missing-number/", link: "/problem/missing-number" },
            { id: "find-all-duplicates", title: "Find All Duplicates", difficulty: "Medium", status: "pending", link: "/problem/find-all-duplicates" },
            { id: "first-missing-positive", title: "First Missing Positive", difficulty: "Hard", status: "pending", link: "/problem/first-missing-positive" }
        ]
    },

    // ── PATTERN 21 — Bit Manipulation ──
    {
        id: "bit-manipulation",
        name: "Bit Manipulation",
        category: "Math & Bits",
        difficulty: "Medium",
        description: "Use bitwise operators (AND, OR, XOR, shifts) to solve problems in O(1) space and often O(n) time — find singles, power checks, counting bits, and more.",
        theory: `
### 1 · Intuition
Every integer is a sequence of bits. Bitwise operations process all bits in parallel in O(1). Key identity: **a XOR a = 0** and **a XOR 0 = a**. This means XOR-ing all elements cancels out pairs, revealing the single unique element.

### 2 · Step-by-Step Build-up
**Single Number**: XOR all elements → pairs cancel, single remains.
  result = 0
  for num in arr:
    result ^= num
  return result

### 3 · Formal Pattern Template
**When to use** — Single number (XOR), power of 2 checks (n & (n-1) == 0), counting set bits (Brian Kernighan's), bit masking for subsets/states, toggling/setting/clearing individual bits.
**Key operations**: AND (&), OR (|), XOR (^), NOT (~), left shift (<<), right shift (>>).

### 4 · Deep Dive
**Common identities**: n & (n-1) clears lowest set bit. n & (-n) isolates lowest set bit. XOR is associative & commutative.
**Counting bits**: Brian Kernighan — while n: n &= (n-1), count++ → O(set bits).

### 5 · Hidden Tricks & Pro Tips
• **Single Number**: XOR all → O(n) time O(1) space.
• **Single Number II (every element appears 3 times except one)**: count bits modulo 3.
• **Two singles**: XOR all gives a^b. Use any set bit to partition into two groups, XOR each group.
• **Power of 2**: n > 0 && (n & (n-1)) == 0.
• **Subsets via bitmask**: for mask in 0 to 2^n-1, bit i set means include element i.
• **Hamming Distance**: XOR two numbers, count set bits in result.
• **Reverse Bits**: swap halves repeatedly (divide & conquer on bit positions).

### 6 · Micro Quiz & Practice
Q1. What is 5 ^ 5? A) 5  B) 10  C) 0  D) 25
Q2. How to check if n is a power of 2? A) n % 2 == 0  B) n & (n-1) == 0  C) n >> 1 == 0  D) n == 2

**Problem Prompts**
1. [Easy] Single Number  2. [Easy] Number of 1 Bits  3. [Easy] Power of Two  4. [Medium] Single Number II  5. [Medium] Counting Bits
        `,
        examples: ["Finding the single non-duplicate element (XOR)", "Checking power of 2 in O(1)", "Counting set bits (Hamming weight)", "Generating subsets via bitmask"],
        problems: [
            { id: "single-number", title: "Single Number", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/single-number/", link: "/problem/single-number" },
            { id: "number-of-1-bits", title: "Number of 1 Bits", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/number-of-1-bits/", link: "/problem/number-of-1-bits" },
            { id: "counting-bits", title: "Counting Bits", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/counting-bits/", link: "/problem/counting-bits" },
            { id: "reverse-bits", title: "Reverse Bits", difficulty: "Easy", status: "pending", leetcodeLink: "https://leetcode.com/problems/reverse-bits/", link: "/problem/reverse-bits" }
        ]
    },

    // ── PATTERN 22 — Trie (Prefix Tree) ──
    {
        id: "trie",
        name: "Trie (Prefix Tree)",
        category: "Tree",
        difficulty: "Medium",
        description: "A tree-shaped data structure where each edge represents a character, enabling O(L) insert, search, and prefix-matching for strings of length L.",
        theory: `
### 1 · Intuition
A **Trie** stores strings character by character along tree edges. All strings sharing a common prefix share the same path from the root. This makes prefix operations — autocomplete, spell check, word search — blazing fast: O(L) per operation where L is the word length, regardless of how many words are stored.

### 2 · Step-by-Step Build-up
  class TrieNode:
    children = {}       // char → TrieNode
    isEnd = false

  class Trie:
    root = TrieNode()

    insert(word):
      node = root
      for ch in word:
        if ch not in node.children:
          node.children[ch] = TrieNode()
        node = node.children[ch]
      node.isEnd = true

    search(word):
      node = traverse(word)
      return node != null AND node.isEnd

    startsWith(prefix):
      return traverse(prefix) != null

### 3 · Formal Pattern Template
**When to use** — Prefix search, autocomplete, spell checker, word search II (backtracking + trie), longest common prefix, counting words with prefix.
**Complexity** — Insert/Search/Prefix: O(L). Space: O(total characters across all words).

### 4 · Deep Dive
**vs Hash Set** — Hash set gives O(L) exact lookup but can't do prefix queries. Trie excels at prefix-based operations.
**Space optimization** — Compressed trie (radix tree) merges single-child chains.

### 5 · Hidden Tricks & Pro Tips
• **Word Search II**: build trie from word list, DFS on grid checking trie paths — far faster than searching each word.
• **Autocomplete**: traverse to prefix node, then DFS to collect all words below.
• **Longest Common Prefix**: insert all strings, follow the path where each node has exactly one child.
• **Magic Dictionary**: for each word, try changing one character and check trie.
• **Map Sum Pairs**: store values at end nodes, sum all values below a prefix.

### 6 · Micro Quiz & Practice
Q1. Trie search time depends on? A) Number of words  B) Word length  C) Alphabet size  D) Tree height
Q2. Every path from root to an isEnd node represents? A) A prefix  B) A complete word  C) A subtree  D) An edge

**Problem Prompts**
1. [Medium] Implement Trie  2. [Hard] Word Search II  3. [Medium] Replace Words  4. [Hard] Palindrome Pairs
        `,
        examples: ["Implementing autocomplete", "Word Search II with trie + backtracking", "Finding longest common prefix", "Spell checker with edit distance on trie"],
        problems: [
            { id: "implement-trie", title: "Implement Trie", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/implement-trie-prefix-tree/", link: "/problem/implement-trie" },
            { id: "word-search-ii", title: "Word Search II", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/word-search-ii/", link: "/problem/word-search-ii" },
            { id: "replace-words", title: "Replace Words", difficulty: "Medium", status: "pending", link: "/problem/replace-words" }
        ]
    },

    // ── PATTERN 23 — Two Heaps ──
    {
        id: "two-heaps",
        name: "Two Heaps",
        category: "Heap",
        difficulty: "Hard",
        description: "Maintain a max-heap for the smaller half and a min-heap for the larger half to efficiently compute running medians and balanced partitions.",
        theory: `
### 1 · Intuition
Some problems need you to track the **median** of a growing stream, or divide elements into two balanced groups. A single heap can't do this — but TWO heaps can. Keep a **max-heap** for the smaller half and a **min-heap** for the larger half. The median is always at one (or both) heap tops.

### 2 · Step-by-Step Build-up
  maxHeap = []   // smaller half (max at top)
  minHeap = []   // larger half (min at top)

  addNum(num):
    push num to maxHeap
    move maxHeap.top to minHeap    // balance
    if minHeap.size > maxHeap.size:
      move minHeap.top to maxHeap  // rebalance

  findMedian():
    if maxHeap.size > minHeap.size:
      return maxHeap.top
    return (maxHeap.top + minHeap.top) / 2

### 3 · Formal Pattern Template
**When to use** — Running median, sliding window median, IPO (maximize capital with k projects), scheduling with profit/capital constraints.
**Invariants** — maxHeap.size >= minHeap.size (differ by at most 1). maxHeap.top <= minHeap.top.
**Complexity** — O(log n) per insert, O(1) median query.

### 4 · Deep Dive
**Sliding window median** — Need lazy deletion: mark removed elements, only actually pop when they appear at heap top.
**IPO problem** — Max-heap for profits, min-heap for capitals. Greedily pick highest profit among affordable projects.

### 5 · Hidden Tricks & Pro Tips
• **Find Median from Data Stream**: classic two-heap setup. Handle odd/even counts via size comparison.
• **Sliding Window Median**: two heaps + lazy deletion hash map for O(n log n) total.
• **Maximize Capital (IPO)**: sort projects by capital, use min-heap. As capital grows, move affordable projects to max-heap (by profit).
• **Balance check**: after every insert, ensure size difference is at most 1.

### 6 · Micro Quiz & Practice
Q1. In two-heap median, the max-heap stores? A) All elements  B) Larger half  C) Smaller half  D) Sorted array
Q2. Time to find median with two heaps? A) O(n)  B) O(log n)  C) O(1)  D) O(n log n)

**Problem Prompts**
1. [Hard] Find Median from Data Stream  2. [Hard] Sliding Window Median  3. [Hard] IPO
        `,
        examples: ["Running median of a number stream", "Sliding window median", "Maximizing capital with project selection"],
        problems: [
            { id: "find-median-from-data-stream", title: "Find Median from Data Stream", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/find-median-from-data-stream/", link: "/problem/find-median-from-data-stream" },
            { id: "sliding-window-median", title: "Sliding Window Median", difficulty: "Hard", status: "pending", link: "/problem/sliding-window-median" }
        ]
    },

    // ── PATTERN 24 — Shortest Path (Dijkstra) ──
    {
        id: "shortest-path",
        name: "Shortest Path (Dijkstra)",
        category: "Graph",
        difficulty: "Hard",
        description: "Find shortest paths in weighted graphs with non-negative edges using a priority queue — the workhorse of graph optimization.",
        theory: `
### 1 · Intuition
BFS finds shortest paths in unweighted graphs. For **weighted** graphs (non-negative weights), **Dijkstra's algorithm** generalizes BFS by using a **min-heap** instead of a queue. Always process the node with the smallest known distance first — this greedy choice guarantees optimality.

### 2 · Step-by-Step Build-up
  dist = [∞] * n
  dist[source] = 0
  minHeap = [(0, source)]     // (distance, node)

  while minHeap:
    (d, u) = minHeap.pop()
    if d > dist[u]: continue   // stale entry
    for (v, weight) in adj(u):
      if dist[u] + weight < dist[v]:
        dist[v] = dist[u] + weight
        minHeap.push((dist[v], v))

### 3 · Formal Pattern Template
**When to use** — Shortest path in weighted graph (non-negative weights), network routing, cheapest flights, path with minimum effort.
**Fails when** — Negative edge weights (use Bellman-Ford instead).
**Complexity** — O((V + E) log V) with binary heap. O(V² + E) with array-based (dense graphs).

### 4 · Deep Dive
**Negative weights** — Dijkstra fails; use Bellman-Ford O(VE) or SPFA.
**All pairs** — Run Dijkstra from each node: O(V(V+E) log V). Or use Floyd-Warshall O(V³).
**0-1 BFS** — Special case with edge weights 0 or 1 → deque-based BFS suffices.

### 5 · Hidden Tricks & Pro Tips
• **Cheapest Flights with K Stops**: modified Dijkstra with state (node, stops_remaining). Or BFS/DP.
• **Network Delay Time**: Dijkstra from source; answer = max(dist[]) if all reachable.
• **Path with Minimum Effort**: Dijkstra where "distance" = max edge weight along the path (modified relaxation).
• **Swim in Rising Water**: Dijkstra on grid; weight = max(elevation_along_path).
• **Stale entries**: when popping from heap, skip if d > dist[u] — faster than decrease-key.
• **Multi-source Dijkstra**: push all sources with dist=0. Same pattern as multi-source BFS.

### 6 · Micro Quiz & Practice
Q1. Dijkstra uses which data structure? A) Stack  B) Queue  C) Min-heap  D) Max-heap
Q2. Dijkstra fails when? A) Graph is dense  B) Edges have negative weights  C) Graph is undirected  D) Graph has cycles

**Problem Prompts**
1. [Medium] Network Delay Time  2. [Medium] Cheapest Flights Within K Stops  3. [Hard] Path with Minimum Effort  4. [Hard] Swim in Rising Water
        `,
        examples: ["Shortest path in a weighted network", "Cheapest flights with at most K stops", "Network delay time (max of shortest paths)", "Path with minimum effort in a grid"],
        problems: [
            { id: "network-delay-time", title: "Network Delay Time", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/network-delay-time/", link: "/problem/network-delay-time" },
            { id: "cheapest-flights", title: "Cheapest Flights Within K Stops", difficulty: "Medium", status: "pending", leetcodeLink: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", link: "/problem/cheapest-flights" },
            { id: "path-with-minimum-effort", title: "Path with Minimum Effort", difficulty: "Hard", status: "pending", leetcodeLink: "https://leetcode.com/problems/path-with-minimum-effort/", link: "/problem/path-with-minimum-effort" }
        ]
    }
];

// ── Import extended pattern batches ──
import { dsaPatternsExtended } from './dsaPatternsExtended.js';
import { dsaPatternsExtended2 } from './dsaPatternsExtended2.js';
import { dsaPatternsExtended3 } from './dsaPatternsExtended3.js';
import { dsaPatternsExtended4 } from './dsaPatternsExtended4.js';
import { dsaPatternsArrayString } from './dsaPatternsArrayString.js';

// ── Unified pattern export (97 base + 23 granular Array & String) ──
export const dsaPatternsAll = [
    ...dsaPatterns,
    ...dsaPatternsExtended,
    ...dsaPatternsExtended2,
    ...dsaPatternsExtended3,
    ...dsaPatternsExtended4,
    ...dsaPatternsArrayString,
];
