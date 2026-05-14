// Deep Theory Content for DSA Topics — Step-by-step explanations, visuals, code examples

export const DSA_THEORY = {

'arrays-strings': {
  sections: [
    {
      title: '📖 What is an Array?',
      steps: [
        'An array is a contiguous block of memory that stores elements of the same type.',
        'Each element is accessed by its index (0-based), giving O(1) random access.',
        'Arrays have fixed size in most languages (dynamic arrays like ArrayList/vector resize by doubling).',
      ],
      visual: `┌───┬───┬───┬───┬───┬───┐
│ 5 │ 3 │ 8 │ 1 │ 9 │ 2 │   ← Array of 6 elements
└───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5     ← Indices

Memory: [1000][1004][1008][1012][1016][1020]
         Each int = 4 bytes, contiguous in memory
         Address of a[i] = base + i × sizeof(element)`,
    },
    {
      title: '📖 Prefix Sum — Step by Step',
      steps: [
        'Goal: Answer "what is the sum of elements from index L to R?" in O(1) after O(n) preprocessing.',
        'Step 1: Build prefix array where prefix[i] = a[0] + a[1] + ... + a[i]',
        'Step 2: Sum(L, R) = prefix[R] − prefix[L−1] (use prefix[−1] = 0)',
        'This transforms O(n) per query → O(1) per query!',
      ],
      visual: `Original:   [2, 4, 1, 3, 5]
             0  1  2  3  4

Step 1 — Build prefix sum:
prefix[0] = 2
prefix[1] = 2 + 4 = 6
prefix[2] = 6 + 1 = 7
prefix[3] = 7 + 3 = 10
prefix[4] = 10 + 5 = 15

Prefix:     [2, 6, 7, 10, 15]

Step 2 — Query sum(1, 3):
= prefix[3] − prefix[0]   ← (sum of 0..3) − (sum of 0..0)
= 10 − 2 = 8
Verify: a[1]+a[2]+a[3] = 4+1+3 = 8 ✓`,
      code: {
        language: 'javascript',
        title: 'Prefix Sum Implementation',
        code: `function buildPrefix(arr) {
  const prefix = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    prefix[i] = prefix[i - 1] + arr[i];
  }
  return prefix;
}

function rangeSum(prefix, L, R) {
  if (L === 0) return prefix[R];
  return prefix[R] - prefix[L - 1];
}

// Example
const arr = [2, 4, 1, 3, 5];
const prefix = buildPrefix(arr); // [2, 6, 7, 10, 15]
console.log(rangeSum(prefix, 1, 3)); // 8`
      }
    },
    {
      title: '📖 Two Pointers Technique',
      steps: [
        'Use two pointers (left & right) to traverse from opposite ends of a SORTED array.',
        'If sum < target: move left pointer RIGHT (increase sum)',
        'If sum > target: move right pointer LEFT (decrease sum)',
        'If sum == target: found! This gives O(n) vs brute-force O(n²)',
      ],
      visual: `Find pair with sum = 9 in sorted array:

[1, 2, 4, 5, 7, 8]
 L →             ← R

Step 1: a[L]+a[R] = 1+8 = 9 → Found! ✓

Another example, sum = 11:
[1, 2, 4, 5, 7, 8]
 L                R   1+8=9  < 11 → move L
    L             R   2+8=10 < 11 → move L
       L          R   4+8=12 > 11 → move R
       L       R      4+7=11 → Found! ✓`,
      code: {
        language: 'javascript',
        title: 'Two Pointer — Pair Sum',
        code: `function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    else if (sum < target) left++;
    else right--;
  }
  return [-1, -1]; // not found
}`
      }
    },
    {
      title: '📖 Sliding Window — Variable Size',
      steps: [
        'Maintain a "window" [L, R] over the array that satisfies some condition.',
        'Expand: move R right to include more elements.',
        'Shrink: move L right when condition is violated.',
        'Key insight: L and R both only move forward → O(n) total, not O(n²).',
      ],
      visual: `Find longest substring without repeating chars: "abcabcbb"

Window = { }
Step 1: [a]bcabcbb     R=0, window={a}       len=1
Step 2: [ab]cabcbb     R=1, window={a,b}     len=2
Step 3: [abc]abcbb     R=2, window={a,b,c}   len=3
Step 4: a[bca]bcbb     R=3, 'a' exists! → shrink L
         ↑ L moves     window={b,c,a}        len=3
Step 5: a[bcab]cbb     R=4, 'b' exists! → shrink L
          ↑ L moves    window={c,a,b}        len=3
...
Answer: 3 ("abc")

Template:
  L=0
  for R in 0..n-1:
    add arr[R] to window
    while (window invalid):
      remove arr[L], L++
    update answer with (R - L + 1)`,
      code: {
        language: 'javascript',
        title: 'Sliding Window — Longest Unique Substring',
        code: `function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`
      }
    },
  ]
},

'hashing': {
  sections: [
    {
      title: '📖 How Hash Maps Work',
      steps: [
        'A hash map stores key→value pairs using a hash function.',
        'The hash function converts a key into an array index: index = hash(key) % capacity',
        'Collisions (two keys → same index) are handled by chaining (linked lists) or open addressing.',
        'Average case: O(1) for insert, lookup, delete. Worst case: O(n) if all keys collide.',
      ],
      visual: `Hash Map with capacity=5, hash(key) = key % 5

Insert: 7 → hash=2, 12 → hash=2 (collision!), 3 → hash=3

Index │ Bucket
──────┼──────────────
  0   │ [ ]
  1   │ [ ]
  2   │ [7] → [12]     ← Collision! Chained via linked list
  3   │ [3]
  4   │ [ ]

Lookup(12): hash(12)=2 → go to index 2 → check 7≠12 → check 12=12 ✓`,
    },
    {
      title: '📖 Two Sum with Hash Map — Step by Step',
      steps: [
        'Problem: Find two numbers that sum to target. Return their indices.',
        'Brute force: Check all pairs → O(n²). Can we do O(n)?',
        'Insight: For each number x, we need (target - x). Store seen numbers in a map.',
        'For each element: check if complement exists in map → if yes, answer found!',
      ],
      visual: `Array: [2, 7, 11, 15], Target: 9

Step 1: x=2, need 9-2=7, map={}        → 7 not in map → store {2:0}
Step 2: x=7, need 9-7=2, map={2:0}     → 2 IS in map! ✓
        Return [map[2], current] = [0, 1]

map acts as "memory" of what we've seen:
  ┌─────────────────────────┐
  │  Key(value) → Index     │
  │  2 → 0                  │
  │  7 → 1  (found before   │
  │          storing!)       │
  └─────────────────────────┘`,
      code: {
        language: 'javascript',
        title: 'Two Sum — O(n) with Hash Map',
        code: `function twoSum(nums, target) {
  const map = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
      }
    },
    {
      title: '📖 Frequency Counting Pattern',
      steps: [
        'Count how many times each element appears → use a hash map.',
        'Anagram check: two strings are anagrams if they have the same frequency map.',
        'Top-K elements: build frequency map, then sort or use heap.',
      ],
      visual: `String: "banana"

Build frequency map:
  b → 1
  a → 3    ← most frequent
  n → 2

Check anagram("listen", "silent"):
  "listen": {l:1, i:1, s:1, t:1, e:1, n:1}
  "silent": {s:1, i:1, l:1, e:1, n:1, t:1}
  Same frequencies → Anagram ✓`,
      code: {
        language: 'javascript',
        title: 'Frequency Count & Anagram Check',
        code: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const freq = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  for (const c of t) {
    if (!freq[c]) return false;
    freq[c]--;
  }
  return true;
}`
      }
    },
  ]
},

'two-pointers-sliding-window': {
  sections: [
    {
      title: '📖 Converging Two Pointers',
      steps: [
        'Start with one pointer at the beginning (L=0) and one at the end (R=n-1).',
        'Move pointers inward based on a condition until they meet.',
        'Works on SORTED arrays for pair/triple finding, palindrome checking, etc.',
        'Key: each step eliminates at least one element → O(n) total.',
      ],
      visual: `Container With Most Water:
heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]

  8 |   █           █
  7 |   █           █       █
  6 |   █   █       █       █
  5 |   █   █   █   █       █
  4 |   █   █   █ █ █       █
  3 |   █   █   █ █ █   █   █
  2 |   █   █ █ █ █ █   █   █
  1 | █ █   █ █ █ █ █   █   █
    └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴──
      0 1 2 3 4 5 6 7 8
      L →               ← R

area = min(h[L],h[R]) × (R-L)
     = min(1,7) × 8 = 8
h[L] < h[R] → move L right (increase shorter side)`,
    },
    {
      title: '📖 Fixed-Size Sliding Window',
      steps: [
        'Window of exactly size K slides across the array.',
        'Initialize: compute result for first K elements.',
        'Slide: add new right element, remove old left element.',
        'Each slide takes O(1) → total O(n) instead of O(n×K).',
      ],
      visual: `Max sum of subarray of size K=3:
arr = [2, 1, 5, 1, 3, 2]

Window 1: [2, 1, 5] 1  3  2   sum=8
Window 2:  2 [1, 5, 1] 3  2   sum=7   (8 - 2 + 1)
Window 3:  2  1 [5, 1, 3] 2   sum=9 ★ (7 - 1 + 3)
Window 4:  2  1  5 [1, 3, 2]  sum=6   (9 - 5 + 2)

Slide operation:
  new_sum = old_sum - arr[L] + arr[R+1]
  No need to recompute entire window!`,
      code: {
        language: 'javascript',
        title: 'Fixed Sliding Window — Max Sum of K',
        code: `function maxSumSubarray(arr, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];
  let maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // slide
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`
      }
    },
  ]
},

'stacks-queues': {
  sections: [
    {
      title: '📖 Stack — LIFO Principle',
      steps: [
        'Stack = Last In, First Out. Think of a stack of plates.',
        'Operations: push (add to top), pop (remove from top), peek (view top).',
        'All operations are O(1).',
        'Uses: function call stack, undo operations, expression evaluation, DFS.',
      ],
      visual: `Push 1, Push 2, Push 3, Pop, Pop:

Push 1:  Push 2:  Push 3:  Pop:     Pop:
┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
│   │    │   │    │ 3 │ ←  │   │    │   │
│   │    │ 2 │    │ 2 │    │ 2 │ ←  │   │
│ 1 │ ←  │ 1 │    │ 1 │    │ 1 │    │ 1 │ ←
└───┘    └───┘    └───┘    └───┘    └───┘
                  top=3    ret=3    ret=2`,
    },
    {
      title: '📖 Monotonic Stack — Next Greater Element',
      steps: [
        'Problem: For each element, find the NEXT element that is GREATER.',
        'Naive: For each element scan right → O(n²). Can we do O(n)?',
        'Monotonic stack: maintain a stack where elements are in decreasing order.',
        'When current > stack top → stack top\'s "next greater" = current. Pop and record.',
        'Each element is pushed and popped at most once → O(n) total!',
      ],
      visual: `arr = [4, 5, 2, 10, 8]
result = [-1, -1, -1, -1, -1]

Step 1: i=0, val=4
  Stack empty → push 0
  Stack: [4]

Step 2: i=1, val=5
  5 > stack.top(4) → result[0] = 5, pop
  Stack empty → push 1
  Stack: [5]

Step 3: i=2, val=2
  2 < stack.top(5) → just push
  Stack: [5, 2]

Step 4: i=3, val=10
  10 > stack.top(2) → result[2] = 10, pop
  10 > stack.top(5) → result[1] = 10, pop
  Stack empty → push 3
  Stack: [10]

Step 5: i=4, val=8
  8 < stack.top(10) → just push
  Stack: [10, 8]

Remaining in stack → no next greater → -1
result = [5, 10, 10, -1, -1]`,
      code: {
        language: 'javascript',
        title: 'Monotonic Stack — Next Greater Element',
        code: `function nextGreater(arr) {
  const n = arr.length;
  const result = new Array(n).fill(-1);
  const stack = []; // stores indices

  for (let i = 0; i < n; i++) {
    while (stack.length && arr[i] > arr[stack[stack.length - 1]]) {
      result[stack.pop()] = arr[i];
    }
    stack.push(i);
  }
  return result;
}
// [4,5,2,10,8] → [5,10,10,-1,-1]`
      }
    },
  ]
},

'linked-lists': {
  sections: [
    {
      title: '📖 What is a Linked List?',
      steps: [
        'A linked list stores elements in nodes. Each node has: data + pointer to next node.',
        'Unlike arrays, elements are NOT contiguous in memory — connected by pointers.',
        'Insertion/deletion at known position: O(1) (just rearrange pointers).',
        'Random access: O(n) — must traverse from head. This is the tradeoff vs arrays.',
      ],
      visual: `Singly Linked List:

 Head
  ↓
┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
│ 1  ──┼───→│ 2  ──┼───→│ 3  ──┼───→│ 4  ──┼───→ null
└──────┘    └──────┘    └──────┘    └──────┘

Array vs Linked List:
┌────────────┬────────┬─────────────┐
│ Operation  │ Array  │ Linked List │
├────────────┼────────┼─────────────┤
│ Access [i] │  O(1)  │    O(n)     │
│ Insert beg │  O(n)  │    O(1)     │
│ Insert end │  O(1)* │    O(n)**   │
│ Delete mid │  O(n)  │    O(1)***  │
└────────────┴────────┴─────────────┘
 * amortized  ** O(1) with tail  *** if have pointer`,
    },
    {
      title: '📖 Reverse a Linked List — Step by Step',
      steps: [
        'Use three pointers: prev (starts null), curr (starts head), next (temp).',
        'At each step: save next, point curr.next to prev, advance prev and curr.',
        'When curr is null, prev is the new head.',
      ],
      visual: `Reverse: 1 → 2 → 3 → null

Initial:
  prev=null  curr=1 → 2 → 3 → null

Step 1: next = curr.next (save 2)
        curr.next = prev (1 → null)
        prev = curr (prev=1)
        curr = next (curr=2)

  null ← 1    2 → 3 → null
        prev  curr

Step 2: next = 3
        2.next = 1 (2 → 1)
        prev = 2, curr = 3

  null ← 1 ← 2    3 → null
              prev  curr

Step 3: next = null
        3.next = 2 (3 → 2)
        prev = 3, curr = null

  null ← 1 ← 2 ← 3
                  prev  curr=null → DONE!

New head = prev = 3`,
      code: {
        language: 'javascript',
        title: 'Reverse Linked List — Iterative',
        code: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const next = curr.next; // save
    curr.next = prev;       // reverse
    prev = curr;            // advance
    curr = next;
  }
  return prev; // new head
}`
      }
    },
    {
      title: '📖 Floyd\'s Cycle Detection',
      steps: [
        'Use two pointers: slow (moves 1 step) and fast (moves 2 steps).',
        'If there\'s a cycle, fast will eventually "lap" slow and they will meet.',
        'If fast reaches null, there\'s no cycle.',
        'Math proof: if cycle length = C, they meet within C steps after slow enters cycle.',
      ],
      visual: `1 → 2 → 3 → 4 → 5
              ↑           │
              └───────────┘  (cycle: 3→4→5→3)

Step 0: slow=1, fast=1
Step 1: slow=2, fast=3
Step 2: slow=3, fast=5
Step 3: slow=4, fast=4  ← They meet! Cycle detected ✓

No cycle example:
1 → 2 → 3 → null
Step 0: slow=1, fast=1
Step 1: slow=2, fast=3
Step 2: slow=3, fast=null → No cycle`,
      code: {
        language: 'javascript',
        title: 'Floyd\'s Cycle Detection',
        code: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;       // 1 step
    fast = fast.next.next;  // 2 steps
    if (slow === fast) return true;
  }
  return false;
}`
      }
    },
  ]
},

'binary-search': {
  sections: [
    {
      title: '📖 Binary Search — The Core Idea',
      steps: [
        'Binary search works on SORTED data. It eliminates half the search space each step.',
        'Compare middle element with target: go left or right accordingly.',
        'Time complexity: O(log n) — 1 billion elements searched in ~30 steps!',
      ],
      visual: `Find 7 in sorted array:
[1, 3, 5, 7, 9, 11, 13]
 L        M           R

Step 1: mid=7, target=7 → Found! ✓

Find 3:
[1, 3, 5, 7, 9, 11, 13]
 L        M           R   mid=7 > 3 → go LEFT

[1, 3, 5]
 L  M  R                  mid=3 = 3 → Found! ✓

How fast is O(log n)?
n = 1,000,000 → ~20 comparisons
n = 1,000,000,000 → ~30 comparisons`,
      code: {
        language: 'javascript',
        title: 'Classic Binary Search',
        code: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1; // not found
}`
      }
    },
    {
      title: '📖 Binary Search on Answer Space',
      steps: [
        'Instead of searching in an array, search on the ANSWER itself.',
        'Define: can we achieve answer X? → monotonic yes/no function.',
        'Binary search on the range of possible answers to find the minimum/maximum valid one.',
        'Example: "Minimum speed to finish in H hours" → binary search on speed.',
      ],
      visual: `Koko Eating Bananas: piles=[3,6,7,11], H=8

Can she finish at speed K?
  K=1: 3+6+7+11 = 27 hours → NO (>8)
  K=4: 1+2+2+3  =  8 hours → YES
  K=3: 1+2+3+4  = 10 hours → NO
  K=5: 1+2+2+3  =  8 hours → YES
  K=6: 1+1+2+2  =  6 hours → YES

Binary search on K from 1 to max(piles)=11:
  lo=1, hi=11 → mid=6 → YES → hi=6
  lo=1, hi=6  → mid=3 → NO  → lo=4
  lo=4, hi=6  → mid=5 → YES → hi=5
  lo=4, hi=5  → mid=4 → YES → hi=4
  lo=4, hi=4  → Answer = 4`,
      code: {
        language: 'javascript',
        title: 'Binary Search on Answer — Koko Eating Bananas',
        code: `function minEatingSpeed(piles, h) {
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const hours = piles.reduce((s, p) =>
      s + Math.ceil(p / mid), 0);
    if (hours <= h) hi = mid;  // can do, try smaller
    else lo = mid + 1;         // too slow
  }
  return lo;
}`
      }
    },
  ]
},

'recursion-backtracking': {
  sections: [
    {
      title: '📖 Recursion — Think Like a Tree',
      steps: [
        'Recursion = a function calls itself with a smaller input.',
        'Every recursion needs: 1) Base case (stop condition), 2) Recursive case (progress toward base).',
        'Think of it as a tree: each call branches into sub-calls.',
        'The call stack "remembers" where to return after each sub-call completes.',
      ],
      visual: `Factorial(4) call tree:

factorial(4)
  │
  └─ 4 × factorial(3)
           │
           └─ 3 × factorial(2)
                    │
                    └─ 2 × factorial(1)
                             │
                             └─ return 1  ← BASE CASE
                         return 2 × 1 = 2
                    return 3 × 2 = 6
           return 4 × 6 = 24

Call stack (LIFO):
  ┌──────────────┐
  │ factorial(1)  │ ← top (returns first)
  │ factorial(2)  │
  │ factorial(3)  │
  │ factorial(4)  │ ← bottom (called first)
  └──────────────┘`,
    },
    {
      title: '📖 Backtracking — Subsets Example',
      steps: [
        'Backtracking = recursion + choice + undo. At each step, make a choice, explore, then undo.',
        'For subsets: at each element, choose to INCLUDE or EXCLUDE it.',
        'This creates a binary decision tree with 2^n leaves = 2^n subsets.',
      ],
      visual: `Generate all subsets of [1, 2, 3]:

                    []
            ┌───────┴───────┐
         include 1        exclude 1
           [1]              []
        ┌───┴───┐       ┌───┴───┐
      +2      skip    +2      skip
     [1,2]    [1]     [2]      []
     ┌─┴─┐  ┌─┴─┐  ┌─┴─┐  ┌──┴──┐
   +3  skip +3 skip +3 skip +3  skip
  [1,2,3][1,2][1,3][1] [2,3][2] [3] []

Result: [[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]`,
      code: {
        language: 'javascript',
        title: 'Backtracking — Generate All Subsets',
        code: `function subsets(nums) {
  const result = [];
  function backtrack(start, current) {
    result.push([...current]); // add copy
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);     // choose
      backtrack(i + 1, current); // explore
      current.pop();             // undo (backtrack!)
    }
  }
  backtrack(0, []);
  return result;
}`
      }
    },
  ]
},

'sorting-searching': {
  sections: [
    {
      title: '📖 Merge Sort — Divide & Conquer',
      steps: [
        'Split array in half recursively until single elements.',
        'Merge sorted halves back together by comparing heads.',
        'Time: O(n log n) always. Space: O(n). Stable sort.',
      ],
      visual: `Merge Sort [38, 27, 43, 3, 9, 82, 10]:

Split phase:
[38, 27, 43, 3, 9, 82, 10]
[38, 27, 43]    [3, 9, 82, 10]
[38] [27, 43]   [3, 9] [82, 10]
[38] [27] [43]  [3] [9] [82] [10]

Merge phase:
[38] [27] [43]  [3] [9] [82] [10]
[38] [27, 43]   [3, 9] [10, 82]
[27, 38, 43]    [3, 9, 10, 82]
[3, 9, 10, 27, 38, 43, 82]  ✓

Merging [27,43] and [38]:
  Compare: 27 < 38 → take 27
  Compare: 43 > 38 → take 38
  Remaining: take 43
  Result: [27, 38, 43]`,
      code: {
        language: 'javascript',
        title: 'Merge Sort Implementation',
        code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
function merge(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) result.push(a[i++]);
    else result.push(b[j++]);
  }
  return [...result, ...a.slice(i), ...b.slice(j)];
}`
      }
    },
  ]
},

'trees': {
  sections: [
    {
      title: '📖 Binary Tree Traversals',
      steps: [
        'Inorder (L-Root-R): visit left subtree, then root, then right. Gives sorted order for BST.',
        'Preorder (Root-L-R): visit root first. Used for serialization/copying.',
        'Postorder (L-R-Root): visit children first. Used for deletion/calculating sizes.',
        'Level-order (BFS): visit level by level using a queue.',
      ],
      visual: `       4
      / \\
     2   6
    / \\ / \\
   1  3 5  7

Inorder  (L-Root-R):  1, 2, 3, 4, 5, 6, 7  ← sorted!
Preorder (Root-L-R):  4, 2, 1, 3, 6, 5, 7
Postorder(L-R-Root):  1, 3, 2, 5, 7, 6, 4
Level-order (BFS):    4 | 2, 6 | 1, 3, 5, 7

DFS Recursion (Inorder):
  inorder(4)
    inorder(2)
      inorder(1) → print 1
      print 2
      inorder(3) → print 3
    print 4
    inorder(6)
      inorder(5) → print 5
      print 6
      inorder(7) → print 7`,
      code: {
        language: 'javascript',
        title: 'Tree Traversals — All Orders',
        code: `function inorder(node, result = []) {
  if (!node) return result;
  inorder(node.left, result);
  result.push(node.val);
  inorder(node.right, result);
  return result;
}
function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const level = [];
    for (let i = queue.length; i > 0; i--) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`
      }
    },
    {
      title: '📖 BST — Validate & Search',
      steps: [
        'BST property: ALL nodes in left subtree < root < ALL nodes in right subtree.',
        'To validate: pass min/max bounds down the tree. Each node must be within bounds.',
        'Search: compare with root → go left if smaller, right if larger. O(h) where h = height.',
      ],
      visual: `Valid BST:          Invalid BST:
     5                    5
    / \\                  / \\
   3   7                3   7
  / \\ / \\              / \\ / \\
 1  4 6  8            1  6 4  8
                         ↑
                      6 > 5 but in left subtree!

Validation with bounds:
  isValid(5, -∞, +∞) → -∞ < 5 < +∞ ✓
    isValid(3, -∞, 5) → -∞ < 3 < 5 ✓
      isValid(1, -∞, 3) ✓
      isValid(4, 3, 5) ✓
    isValid(7, 5, +∞) → 5 < 7 < +∞ ✓
      isValid(6, 5, 7) ✓
      isValid(8, 7, +∞) ✓`,
    },
  ]
},

'heaps': {
  sections: [
    {
      title: '📖 How a Heap Works',
      steps: [
        'A heap is a complete binary tree stored as an array.',
        'Min-heap: parent ≤ children. Max-heap: parent ≥ children.',
        'Parent of i: Math.floor((i-1)/2). Children of i: 2i+1, 2i+2.',
        'Insert: add at end, "bubble up" to maintain heap property.',
        'Extract min/max: remove root, move last to root, "bubble down".',
      ],
      visual: `Min-Heap as tree and array:

Tree:         1            Array: [1, 3, 5, 7, 9, 8]
             / \\           Index:  0  1  2  3  4  5
            3   5
           / \\ /           Parent of i: floor((i-1)/2)
          7  9 8           Children of i: 2i+1, 2i+2

Insert 2:
Step 1: Add at end → [1, 3, 5, 7, 9, 8, 2]
Step 2: Bubble up: 2 < parent(5) → swap
        [1, 3, 2, 7, 9, 8, 5]
Step 3: 2 < parent(1)? No → done
        [1, 3, 2, 7, 9, 8, 5]

Extract min (remove 1):
Step 1: Replace root with last → [5, 3, 2, 7, 9, 8]
Step 2: Bubble down: 5 > min-child(2) → swap
        [2, 3, 5, 7, 9, 8]
Step 3: 5 > min-child(8)? No → done`,
      code: {
        language: 'javascript',
        title: 'Min-Heap — Insert & Extract',
        code: `class MinHeap {
  constructor() { this.heap = []; }
  insert(val) {
    this.heap.push(val);
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] =
        [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }
  extractMin() {
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    let i = 0;
    while (true) {
      let smallest = i;
      const l = 2*i+1, r = 2*i+2;
      if (l < this.heap.length &&
          this.heap[l] < this.heap[smallest])
        smallest = l;
      if (r < this.heap.length &&
          this.heap[r] < this.heap[smallest])
        smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] =
        [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
    return min;
  }
}`
      }
    },
  ]
},

'graphs': {
  sections: [
    {
      title: '📖 Graph Representations',
      steps: [
        'Graph = set of Vertices (nodes) + Edges (connections).',
        'Adjacency List: each vertex stores list of neighbors. Space: O(V+E).',
        'Adjacency Matrix: 2D grid, matrix[i][j]=1 if edge exists. Space: O(V²).',
        'Use list for sparse graphs, matrix for dense graphs.',
      ],
      visual: `Graph:  0 --- 1
        |   / |
        |  /  |
        2 --- 3

Adjacency List:
  0: [1, 2]
  1: [0, 2, 3]
  2: [0, 1, 3]
  3: [1, 2]

Adjacency Matrix:
     0  1  2  3
  0 [0, 1, 1, 0]
  1 [1, 0, 1, 1]
  2 [1, 1, 0, 1]
  3 [0, 1, 1, 0]`,
    },
    {
      title: '📖 BFS vs DFS — Step by Step',
      steps: [
        'BFS (Breadth-First): explore level by level using a QUEUE. Finds shortest path in unweighted.',
        'DFS (Depth-First): explore as deep as possible using a STACK (or recursion). Good for cycles, paths.',
        'Both visit every node once → O(V + E).',
      ],
      visual: `Graph:  0 → 1 → 3
        ↓   ↓
        2   4

BFS from 0 (using queue):
  Queue: [0]     Visit: 0
  Queue: [1,2]   Visit: 1, 2
  Queue: [3,4]   Visit: 3, 4
  Order: 0, 1, 2, 3, 4  (level by level)

DFS from 0 (using stack/recursion):
  Stack: [0]       Visit: 0
  Stack: [2,1]     Visit: 1 (go deep)
  Stack: [2,4,3]   Visit: 3
  Stack: [2,4]     Visit: 4
  Stack: [2]       Visit: 2
  Order: 0, 1, 3, 4, 2  (as deep as possible)`,
      code: {
        language: 'javascript',
        title: 'BFS & DFS Implementation',
        code: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}
function dfs(graph, node, visited = new Set()) {
  visited.add(node);
  const order = [node];
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      order.push(...dfs(graph, neighbor, visited));
    }
  }
  return order;
}`
      }
    },
  ]
},

'greedy': {
  sections: [
    {
      title: '📖 Greedy Strategy — When Does It Work?',
      steps: [
        'Greedy = make the locally optimal choice at each step, hoping for global optimum.',
        'Works when: optimal solution can be built from optimal sub-choices (greedy-choice property).',
        'Does NOT work for: 0/1 Knapsack, finding all paths, many optimization problems (use DP instead).',
        'Common pattern: sort first, then greedily pick/skip elements.',
      ],
      visual: `Activity Selection (sort by end time):

Activities: [(1,4), (3,5), (0,6), (5,7), (3,8), (5,9), (6,10), (8,11)]
Sorted by end: (1,4) (3,5) (0,6) (5,7) (3,8) (5,9) (6,10) (8,11)

Timeline:
0  1  2  3  4  5  6  7  8  9  10  11
   [======]                          pick (1,4) ✓
         [====]                      skip (3,5) — overlaps
   [==========]                      skip (0,6) — overlaps
               [====]               pick (5,7) ✓
                        [======]     skip — overlaps
                           [========] pick (8,11) ✓

Result: 3 activities (greedy = optimal!)`,
    },
  ]
},

'dynamic-programming': {
  sections: [
    {
      title: '📖 What is Dynamic Programming?',
      steps: [
        'DP = recursion + memoization. Solve small subproblems, cache results, build up to answer.',
        'Two properties needed: 1) Overlapping subproblems, 2) Optimal substructure.',
        'Top-down: recursive with cache. Bottom-up: iterative with table.',
        'Key step: DEFINE what dp[i] represents. This is 80% of solving any DP problem.',
      ],
      visual: `Fibonacci — Why DP?

Without DP (pure recursion):
              fib(5)
             /      \\
          fib(4)    fib(3)     ← fib(3) computed TWICE!
          /    \\    /    \\
      fib(3) fib(2) fib(2) fib(1)
      /   \\
  fib(2) fib(1)               Time: O(2^n) 😰

With DP (memoization):
  fib(5) → fib(4) → fib(3) → fib(2) → fib(1) → return 1
                                      → fib(0) → return 0
                              return 1
                     fib(2) → cached! return 1
            return 3
  fib(3) → cached! return 2
  return 5                     Time: O(n) 🚀`,
      code: {
        language: 'javascript',
        title: 'Fibonacci — Top-down vs Bottom-up DP',
        code: `// Top-down (memoization)
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);
  return memo[n];
}

// Bottom-up (tabulation)
function fibTab(n) {
  if (n <= 1) return n;
  let prev2 = 0, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}`
      }
    },
    {
      title: '📖 0/1 Knapsack — Classic DP',
      steps: [
        'Given items with weight and value, maximize value within weight capacity W.',
        'For each item: either INCLUDE or EXCLUDE (0/1 choice).',
        'dp[i][w] = max value using first i items with capacity w.',
        'Transition: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])',
      ],
      visual: `Items: [{wt:2, val:3}, {wt:3, val:4}, {wt:4, val:5}]
Capacity W = 5

DP Table:
        w=0  w=1  w=2  w=3  w=4  w=5
item 0:  0    0    3    3    3    3
item 1:  0    0    3    4    4    7  ← take both 0,1
item 2:  0    0    3    4    5    7

dp[1][5] = max(dp[0][5], dp[0][5-3]+4)
         = max(3, dp[0][2]+4)
         = max(3, 3+4) = 7 ✓

Answer: dp[2][5] = 7`,
    },
  ]
},

'advanced': {
  sections: [
    {
      title: '📖 Trie (Prefix Tree)',
      steps: [
        'A tree where each node represents a character. Paths from root = stored words.',
        'Shared prefixes share nodes → memory efficient for dictionaries.',
        'Insert/Search: O(L) where L = word length.',
        'Applications: autocomplete, spell check, IP routing.',
      ],
      visual: `Insert: "app", "apple", "bat", "ball"

           root
          /    \\
         a      b
         |      |
         p      a
         |     / \\
         p    t   l
        / \\   ★   |
       ★   l      l
           |      ★
           e
           ★

★ = end of word marker

Search "app":  root→a→p→p → ★ found → TRUE
Search "ap":   root→a→p → no ★ → FALSE (prefix exists, not a word)
StartsWith "ap": root→a→p → node exists → TRUE`,
      code: {
        language: 'javascript',
        title: 'Trie Implementation',
        code: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let node = this.root;
    for (const c of word) {
      if (!node.children[c])
        node.children[c] = new TrieNode();
      node = node.children[c];
    }
    node.isEnd = true;
  }
  search(word) {
    let node = this.root;
    for (const c of word) {
      if (!node.children[c]) return false;
      node = node.children[c];
    }
    return node.isEnd;
  }
  startsWith(prefix) {
    let node = this.root;
    for (const c of prefix) {
      if (!node.children[c]) return false;
      node = node.children[c];
    }
    return true;
  }
}`
      }
    },
    {
      title: '📖 Union-Find (Disjoint Set Union)',
      steps: [
        'Tracks which elements belong to the same group/component.',
        'Two operations: find(x) = which group is x in? union(x,y) = merge groups.',
        'Path compression: make every node point directly to root → nearly O(1).',
        'Union by rank: attach shorter tree under taller → keeps tree flat.',
      ],
      visual: `Initially: each element is its own group
{0} {1} {2} {3} {4}

union(0,1): 0─1    {0,1} {2} {3} {4}
union(2,3): 2─3    {0,1} {2,3} {4}
union(0,2):
  find(0)=0, find(2)=2
  Merge: 0─1     {0,1,2,3} {4}
         |
         2─3

Path compression on find(3):
  Before: 3→2→0 (root)
  After:  3→0   (direct to root!)`,
    },
  ]
},

};
