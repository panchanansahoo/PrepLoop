// DSA Learning Path Data — 15 Topics across 4 Stages
export const DSA_STAGES = [
  { id: 'fundamentals', name: 'Stage 1: Fundamentals', color: '#818cf8', icon: '🧱' },
  { id: 'core', name: 'Stage 2: Core Structures', color: '#34d399', icon: '🔗' },
  { id: 'trees-graphs', name: 'Stage 3: Trees & Graphs', color: '#f59e0b', icon: '🌳' },
  { id: 'optimization', name: 'Stage 4: Optimization', color: '#f472b6', icon: '🚀' },
];

export const TIME_TRACKS = {
  30: { label: '30-Day Crash', desc: 'High-yield patterns only', perDay: '1 pattern + 3–5 problems', topics: ['arrays-strings','hashing','two-pointers-sliding-window','stacks-queues','binary-search','trees','graphs','dynamic-programming'] },
  60: { label: '60-Day Standard', desc: 'Full coverage up to medium DP', perDay: '1 pattern + 5–8 problems', topics: ['arrays-strings','hashing','two-pointers-sliding-window','stacks-queues','linked-lists','binary-search','recursion-backtracking','sorting-searching','trees','heaps','graphs','greedy','dynamic-programming'] },
  90: { label: '90-Day Master', desc: 'All topics + advanced', perDay: 'Learn 20min + 5–8 problems + review', topics: null },
};

export const DSA_TOPICS = [
  // ═══════════════ STAGE 1: FUNDAMENTALS ═══════════════
  {
    id: 'arrays-strings', title: 'Arrays & Strings', stage: 'fundamentals',
    icon: '📊', color: '#818cf8', difficulty: 'Easy–Medium', estimatedTime: '3–4 hours',
    description: 'Traversal, prefix sums, frequency arrays, and foundational manipulation techniques.',
    concepts: [
      { title: 'Core Operations', points: ['Traversal & indexing', 'Prefix sum: pref[i] = a[0]+…+a[i]; range sum [l,r] = pref[r]−pref[l−1]', 'Difference array for range updates: diff[l]+=x, diff[r+1]-=x, then prefix sum', 'Frequency arrays (size 26/128/256) for character counting'] },
      { title: 'Key Patterns', points: ['Prefix Sum — precompute cumulative sums for O(1) range queries', 'Difference Array — batch range updates in O(1) each', 'Two Pointers on sorted data', 'Sliding Window for contiguous subarrays/substrings', 'Hashing for frequency/index lookups'] },
    ],
    invariants: ['pref[i] = a[0]+…+a[i]; range [l,r] = pref[r]−pref[l−1]', 'Difference array: diff[l]+=x, diff[r+1]-=x → prefix to get updated array', 'Anagram condition: same character frequency', 'Palindrome condition: reads same forwards and backwards'],
    thinkingFramework: [
      { condition: 'n ≤ 1e5', action: 'Need O(n) or O(n log n) solution' },
      { condition: 'Many range sum queries', action: 'Use prefix sum array' },
      { condition: '"Subarray with property X"', action: 'Try prefix sum or sliding window' },
      { condition: '"Pair/triple with target"', action: 'Sort + two pointers or hash map' },
      { condition: '"Count frequency / unique"', action: 'Hash map or hash set' },
      { condition: 'Sum/length condition, all positives', action: 'Sliding window' },
      { condition: 'Need min/max index range', action: 'Two pointers or binary search on answer' },
    ],
    tricks: [
      { name: 'Sorted vs Unsorted Check', tip: 'Sorted → two pointers / binary search. Unsorted → map / set.', when: 'First thing to check', avoid: 'N/A' },
      { name: 'Subarray Sum = K', tip: 'All positives → sliding window. With negatives → prefix sum + hash map (store first occurrence).', when: 'Sum-based subarray problems', avoid: 'Don\'t use sliding window with negatives' },
      { name: 'Subsequence vs Substring', tip: 'Subarray/substring = contiguous. Subsequence = can skip elements. Different approaches needed.', when: 'Reading the problem statement', avoid: 'N/A' },
      { name: 'Overflow Prevention', tip: 'Use 64-bit (BigInt/long long) for large prefix sums to avoid overflow.', when: 'Large values or n > 1e4', avoid: 'N/A' },
    ],
    pitfalls: ['Off-by-one in prefix sum indexing', 'Forgetting to handle empty arrays', 'Integer overflow with large sums', 'Confusing subarray (contiguous) with subsequence'],
    practiceProblems: [
      { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', pattern: 'Hash Map' },
      { id: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy & Sell Stock', difficulty: 'Easy', pattern: 'Single Pass' },
      { id: 'valid-anagram', title: 'Valid Anagram', difficulty: 'Easy', pattern: 'Frequency Count' },
      { id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', pattern: 'Hash Set' },
      { id: '3sum', title: '3Sum', difficulty: 'Medium', pattern: 'Two Pointers' },
      { id: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'Medium', pattern: 'Two Pointers' },
      { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating', difficulty: 'Medium', pattern: 'Sliding Window' },
      { id: 'subarray-sum-equals-k', title: 'Subarray Sum Equals K', difficulty: 'Medium', pattern: 'Prefix Sum + Map' },
      { id: 'minimum-window-substring', title: 'Minimum Window Substring', difficulty: 'Hard', pattern: 'Sliding Window' },
      { id: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'Hard', pattern: 'Two Pointers / Prefix Max' },
    ]
  },
  {
    id: 'hashing', title: 'Hashing (Maps & Sets)', stage: 'fundamentals',
    icon: '#️⃣', color: '#a78bfa', difficulty: 'Easy–Medium', estimatedTime: '2–3 hours',
    description: 'Hash maps, hash sets, frequency counting, and O(1) lookup techniques.',
    concepts: [
      { title: 'Core Concepts', points: ['Hash Map: key→value store with O(1) average lookup', 'Hash Set: unique element store with O(1) membership test', 'Collision handling basics (chaining, open addressing)', 'Load factor and rehashing'] },
      { title: 'Key Patterns', points: ['Frequency Count — count occurrences of elements', '"Seen before?" — use set to track visited elements', 'Pair Complements — for each element, check if complement exists', 'Index Mapping — store element→index for quick lookup', 'Group by Key — group elements sharing a property'] },
    ],
    invariants: ['Hash map: O(1) avg, O(n) worst for lookup/insert/delete', 'Set membership: O(1) average', 'Two sum pattern: for each x, check if (target-x) in map'],
    thinkingFramework: [
      { condition: '"Check if seen before"', action: 'Use a hash set' },
      { condition: '"Map index or count"', action: 'Use a hash map' },
      { condition: '"Find pair with sum = target"', action: 'Hash map with complement lookup' },
      { condition: '"Group elements by property"', action: 'Hash map with property as key' },
      { condition: '"Find duplicates"', action: 'Hash set, check before insert' },
    ],
    tricks: [
      { name: 'Sorted Key for Grouping', tip: 'Sort characters of string as key for anagram grouping', when: 'Group Anagrams-type problems', avoid: 'Large strings (use frequency array as key instead)' },
      { name: 'Default Values', tip: 'Use map.get(key) || 0 for safe frequency counting', when: 'Always with frequency maps', avoid: 'N/A' },
    ],
    pitfalls: ['Forgetting that hash map order is not guaranteed', 'Not handling missing keys gracefully', 'Using mutable objects as keys'],
    practiceProblems: [
      { id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', pattern: 'Hash Set' },
      { id: 'valid-anagram', title: 'Valid Anagram', difficulty: 'Easy', pattern: 'Frequency Count' },
      { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', pattern: 'Complement Map' },
      { id: 'group-anagrams', title: 'Group Anagrams', difficulty: 'Medium', pattern: 'Group by Key' },
      { id: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'Medium', pattern: 'Frequency + Bucket Sort' },
      { id: 'longest-consecutive-sequence', title: 'Longest Consecutive Sequence', difficulty: 'Medium', pattern: 'Hash Set + Expansion' },
    ]
  },
  {
    id: 'two-pointers-sliding-window', title: 'Two Pointers & Sliding Window', stage: 'fundamentals',
    icon: '👆', color: '#22d3ee', difficulty: 'Medium', estimatedTime: '3–4 hours',
    description: 'Converging pointers, fast-slow pointers, fixed and variable-size windows.',
    concepts: [
      { title: 'Two Pointers', points: ['Inward traversal: pointers at both ends, move toward center', 'Unidirectional: both start at same end, different speeds', 'Fast-slow: cycle detection, finding middle', 'Read-write: in-place modification (removing duplicates)'] },
      { title: 'Sliding Window', points: ['Fixed window: size k, slide by 1 each step', 'Variable window: expand R, shrink L when condition breaks', 'Template: L=0; for R in range(n): add a[R]; while(invalid): remove a[L], L++; update answer'] },
    ],
    invariants: ['Two pointers on sorted: if sum < target move left++, if sum > target move right--', 'Variable window: window always moves right; if condition breaks, move left', 'Window state maintained incrementally (add right, remove left)'],
    thinkingFramework: [
      { condition: 'Sorted array + pair/triple target', action: 'Two converging pointers' },
      { condition: 'Palindrome check', action: 'Two pointers from ends' },
      { condition: '"Longest/shortest subarray with property"', action: 'Sliding window (variable)' },
      { condition: '"Max sum of size k"', action: 'Sliding window (fixed)' },
      { condition: 'Substring with at most K distinct chars', action: 'Variable sliding window + frequency map' },
    ],
    tricks: [
      { name: 'Never Shrink Unless Invalid', tip: 'In variable window, only move L when condition is broken', when: 'All sliding window problems', avoid: 'N/A' },
      { name: 'Longest vs Shortest', tip: 'Longest: update answer when valid. Shortest: update answer when just became valid.', when: 'Window optimization problems', avoid: 'N/A' },
    ],
    pitfalls: ['Moving both pointers in wrong direction', 'Not maintaining window state properly when shrinking', 'Off-by-one when window size matters'],
    practiceProblems: [
      { id: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'Easy', pattern: 'Two Pointers' },
      { id: 'move-zeroes', title: 'Move Zeroes', difficulty: 'Easy', pattern: 'Read-Write Pointers' },
      { id: 'two-sum-ii', title: 'Two Sum II - Sorted', difficulty: 'Medium', pattern: 'Converging Pointers' },
      { id: '3sum', title: '3Sum', difficulty: 'Medium', pattern: 'Sort + Two Pointers' },
      { id: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'Medium', pattern: 'Converging Pointers' },
      { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating', difficulty: 'Medium', pattern: 'Variable Window' },
      { id: 'longest-repeating-character-replacement', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', pattern: 'Variable Window' },
      { id: 'minimum-window-substring', title: 'Minimum Window Substring', difficulty: 'Hard', pattern: 'Variable Window' },
      { id: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'Hard', pattern: 'Two Pointers' },
    ]
  },
  {
    id: 'stacks-queues', title: 'Stacks & Queues', stage: 'fundamentals',
    icon: '📚', color: '#fb923c', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Monotonic stacks, parentheses validation, expression evaluation, sliding window max.',
    concepts: [
      { title: 'Stack Patterns', points: ['LIFO — Last In First Out', 'Monotonic Stack: maintain strictly increasing/decreasing order', 'Parentheses matching: push open, pop on close, check match', 'Expression evaluation: operator precedence with two stacks'] },
      { title: 'Queue Patterns', points: ['FIFO — First In First Out', 'BFS traversal uses queue', 'Deque for sliding window maximum/minimum', 'Queue via two stacks (push to one, pop from other)'] },
    ],
    invariants: ['Monotonic stack: each element pushed/popped at most once → O(n)', 'Valid parentheses: stack empty at end = balanced', 'Deque max: front always has current window max index'],
    thinkingFramework: [
      { condition: '"Next greater/smaller element"', action: 'Monotonic stack' },
      { condition: '"Valid parentheses/brackets"', action: 'Stack matching' },
      { condition: '"Sliding window max/min"', action: 'Monotonic deque' },
      { condition: '"Evaluate expression"', action: 'Two stacks (values + operators)' },
      { condition: '"Largest rectangle in histogram"', action: 'Monotonic stack' },
    ],
    tricks: [
      { name: 'Sentinel Element', tip: 'Push -1 or 0 to stack initially to avoid empty stack checks', when: 'Histogram / next greater problems', avoid: 'When sentinel value conflicts with data' },
      { name: 'Process on Pop', tip: 'The key computation happens when you POP from monotonic stack, not when you push', when: 'All monotonic stack problems', avoid: 'N/A' },
    ],
    pitfalls: ['Empty stack access (always check before pop/peek)', 'Wrong monotonic direction (increasing vs decreasing)', 'Forgetting to process remaining elements after main loop'],
    practiceProblems: [
      { id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy', pattern: 'Stack Matching' },
      { id: 'min-stack', title: 'Min Stack', difficulty: 'Medium', pattern: 'Auxiliary Stack' },
      { id: 'daily-temperatures', title: 'Daily Temperatures', difficulty: 'Medium', pattern: 'Monotonic Stack' },
      { id: 'next-greater-element', title: 'Next Greater Element', difficulty: 'Medium', pattern: 'Monotonic Stack' },
      { id: 'evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', pattern: 'Stack Evaluation' },
      { id: 'sliding-window-maximum', title: 'Sliding Window Maximum', difficulty: 'Hard', pattern: 'Monotonic Deque' },
      { id: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', pattern: 'Monotonic Stack' },
    ]
  },
  // ═══════════════ STAGE 2: CORE STRUCTURES ═══════════════
  {
    id: 'linked-lists', title: 'Linked Lists', stage: 'core',
    icon: '🔗', color: '#34d399', difficulty: 'Easy–Medium', estimatedTime: '2–3 hours',
    description: 'Singly/doubly linked lists, fast-slow pointers, in-place reversal, merge techniques.',
    concepts: [
      { title: 'Core Operations', points: ['Singly linked: next pointer only, O(1) insert at head', 'Doubly linked: next + prev pointers', 'Traversal, insertion, deletion in O(1) with pointer'] },
      { title: 'Key Patterns', points: ['Fast-Slow (Floyd\'s): cycle detection, find middle', 'Fixed Gap: Nth node from end — advance one by N, then move both', 'In-place Reverse: prev=null, curr=head, reverse links while traversing', 'Merge: compare heads, build result list', 'Dummy Node: simplify edge cases with sentinel head'] },
    ],
    invariants: ['Floyd\'s cycle: fast moves 2x, slow 1x; they meet inside cycle', 'Reverse: prev→curr→next becomes prev←curr next', 'Dummy node eliminates null head edge cases'],
    thinkingFramework: [
      { condition: '"Detect cycle"', action: 'Fast-slow pointers' },
      { condition: '"Find middle"', action: 'Fast-slow (when fast reaches end, slow is at middle)' },
      { condition: '"Kth from end"', action: 'Two pointers with K gap' },
      { condition: '"Reverse list"', action: 'Iterative 3-pointer (prev, curr, next)' },
      { condition: '"Merge sorted lists"', action: 'Dummy node + compare heads' },
    ],
    tricks: [
      { name: 'Dummy Node', tip: 'Create a dummy node before head to simplify insertion/merge logic', when: 'Merge, partition, or insertion problems', avoid: 'N/A' },
      { name: 'Draw It Out', tip: 'Always draw pointer diagrams before coding linked list operations', when: 'Any linked list modification', avoid: 'N/A' },
    ],
    pitfalls: ['Losing reference to next node during reversal', 'Not handling null/empty list', 'Infinite loop in cycle problems', 'Modifying pointers in wrong order'],
    practiceProblems: [
      { id: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'Easy', pattern: 'In-place Reverse' },
      { id: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'Easy', pattern: 'Merge + Dummy' },
      { id: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'Easy', pattern: 'Floyd\'s Algorithm' },
      { id: 'remove-nth-node-from-end', title: 'Remove Nth Node from End', difficulty: 'Medium', pattern: 'Fixed Gap' },
      { id: 'reorder-list', title: 'Reorder List', difficulty: 'Medium', pattern: 'Find Middle + Reverse + Merge' },
      { id: 'copy-list-with-random-pointer', title: 'Copy List with Random Pointer', difficulty: 'Medium', pattern: 'Hash Map Clone' },
    ]
  },
  {
    id: 'binary-search', title: 'Binary Search', stage: 'core',
    icon: '🔍', color: '#60a5fa', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Search on index, search on answer space, rotated arrays, boundary finding.',
    concepts: [
      { title: 'Core Variants', points: ['Classic: find target in sorted array — O(log n)', 'First/Last occurrence: find boundaries with continued search', 'Search on answer: binary search on the answer space (min feasible X)', 'Rotated array: modified binary search with pivot detection'] },
      { title: 'Key Insight', points: ['Answer space must be monotonic: if X works, all > X (or < X) also work', 'Binary search = eliminating half the search space each step', 'Can apply to any decision problem with monotonic property'] },
    ],
    invariants: ['lo ≤ hi (or lo < hi depending on template)', 'If f(mid) is true and f is monotonic, answer is in [lo, mid]', 'Rotated array: one half is always sorted'],
    thinkingFramework: [
      { condition: 'Sorted array + find element', action: 'Classic binary search' },
      { condition: '"First/last position of X"', action: 'Binary search with boundary tracking' },
      { condition: '"Minimum X such that condition holds"', action: 'Binary search on answer space' },
      { condition: '"Search in rotated sorted array"', action: 'Modified binary search with pivot' },
      { condition: '"Koko eating bananas" / "Ship packages"', action: 'Binary search on answer' },
    ],
    tricks: [
      { name: 'Avoid Overflow', tip: 'Use mid = lo + (hi - lo) / 2 instead of (lo + hi) / 2', when: 'Always', avoid: 'N/A' },
      { name: 'Template Choice', tip: 'lo < hi with lo=mid+1/hi=mid for leftmost; lo <= hi with lo=mid+1/hi=mid-1 for exact', when: 'Choose based on boundary vs exact search', avoid: 'Mixing templates' },
    ],
    pitfalls: ['Infinite loop from wrong mid calculation or update', 'Off-by-one in lo/hi updates', 'Not identifying the monotonic property correctly'],
    practiceProblems: [
      { id: 'binary-search', title: 'Binary Search', difficulty: 'Easy', pattern: 'Classic' },
      { id: 'first-last-position', title: 'First and Last Position', difficulty: 'Medium', pattern: 'Boundary Search' },
      { id: 'search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', pattern: 'Rotated Search' },
      { id: 'koko-eating-bananas', title: 'Koko Eating Bananas', difficulty: 'Medium', pattern: 'Search on Answer' },
      { id: 'find-minimum-in-rotated-sorted-array', title: 'Find Min in Rotated Sorted Array', difficulty: 'Medium', pattern: 'Rotated Search' },
      { id: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', pattern: 'Binary Search on Partition' },
    ]
  },
  {
    id: 'recursion-backtracking', title: 'Recursion & Backtracking', stage: 'core',
    icon: '🔄', color: '#c084fc', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'Decision trees, include/exclude patterns, permutations, combinations, constraint satisfaction.',
    concepts: [
      { title: 'Recursion', points: ['Base case + recursive case', 'Call stack and stack overflow awareness', 'Tail recursion optimization', 'Memoization to avoid recomputation'] },
      { title: 'Backtracking', points: ['Decision tree: at each step, make a choice → recurse → undo choice', 'Include/Exclude pattern for subsets', 'Permutation: swap-based or used-array approach', 'Pruning: skip invalid branches early to optimize'] },
    ],
    invariants: ['Every recursive call must move toward base case', 'Backtrack = undo the choice after exploring that branch', 'Total subsets = 2^n, total permutations = n!'],
    thinkingFramework: [
      { condition: '"Generate all subsets"', action: 'Include/exclude recursion or bit manipulation' },
      { condition: '"Generate all permutations"', action: 'Swap-based or used-array backtracking' },
      { condition: '"Combination sum / coin change (all combos)"', action: 'Backtracking with start index' },
      { condition: '"N-Queens / Sudoku"', action: 'Constraint-based backtracking with pruning' },
      { condition: '"Partition into groups"', action: 'Backtracking with constraint checking' },
    ],
    tricks: [
      { name: 'Start Index for Combos', tip: 'Pass startIndex to avoid duplicates in combinations (don\'t revisit earlier elements)', when: 'Combination problems', avoid: 'Permutation problems (need all elements)' },
      { name: 'Sort to Skip Duplicates', tip: 'Sort input, then skip duplicate values at each level of recursion', when: 'Problems saying "no duplicate results"', avoid: 'When order matters' },
    ],
    pitfalls: ['Missing base case → infinite recursion', 'Not undoing the choice (backtrack step)', 'Generating duplicates without dedup logic', 'Stack overflow on deep recursion'],
    practiceProblems: [
      { id: 'subsets', title: 'Subsets', difficulty: 'Medium', pattern: 'Include/Exclude' },
      { id: 'permutations', title: 'Permutations', difficulty: 'Medium', pattern: 'Swap Backtracking' },
      { id: 'combination-sum', title: 'Combination Sum', difficulty: 'Medium', pattern: 'Backtracking + Start Index' },
      { id: 'letter-combinations-of-a-phone-number', title: 'Letter Combinations of Phone Number', difficulty: 'Medium', pattern: 'Backtracking' },
      { id: 'word-search', title: 'Word Search', difficulty: 'Medium', pattern: 'Grid Backtracking' },
      { id: 'n-queens', title: 'N-Queens', difficulty: 'Hard', pattern: 'Constraint Backtracking' },
      { id: 'sudoku-solver', title: 'Sudoku Solver', difficulty: 'Hard', pattern: 'Constraint Backtracking' },
    ]
  },
  {
    id: 'sorting-searching', title: 'Sorting & Searching', stage: 'core',
    icon: '📈', color: '#fbbf24', difficulty: 'Easy–Medium', estimatedTime: '2 hours',
    description: 'Classic sorting algorithms, their complexities, and search applications.',
    concepts: [
      { title: 'Sorting Algorithms', points: ['Merge Sort: O(n log n), stable, divide & conquer', 'Quick Sort: O(n log n) avg, O(n²) worst, in-place', 'Heap Sort: O(n log n), in-place, not stable', 'Counting/Radix Sort: O(n+k), for limited range integers'] },
      { title: 'Applications', points: ['Sort + two pointers for pair problems', 'Sort + binary search for lookup', 'Custom comparators for special ordering', 'Merge sort for count inversions'] },
    ],
    invariants: ['Comparison-based sort lower bound: O(n log n)', 'Stable sort preserves order of equal elements', 'In-place sort uses O(1) extra space'],
    thinkingFramework: [
      { condition: 'Need stable sort', action: 'Merge sort' },
      { condition: 'Need in-place + good average', action: 'Quick sort with random pivot' },
      { condition: 'Limited range integers', action: 'Counting sort / radix sort' },
      { condition: '"Count inversions"', action: 'Modified merge sort' },
      { condition: '"Kth largest element"', action: 'Quick select O(n) avg' },
    ],
    tricks: [
      { name: 'Quick Select', tip: 'For Kth element, use partition (like quicksort) but only recurse on one side → O(n) average', when: 'Kth largest/smallest problems', avoid: 'When you need full sorted order' },
    ],
    pitfalls: ['Quicksort worst case O(n²) on sorted input — use random pivot', 'Not considering stability requirements', 'Off-by-one in merge boundaries'],
    practiceProblems: [
      { id: 'sort-an-array', title: 'Sort an Array', difficulty: 'Medium', pattern: 'Merge/Quick Sort' },
      { id: 'kth-largest-element', title: 'Kth Largest Element', difficulty: 'Medium', pattern: 'Quick Select' },
      { id: 'merge-intervals', title: 'Merge Intervals', difficulty: 'Medium', pattern: 'Sort + Sweep' },
      { id: 'sort-colors', title: 'Sort Colors', difficulty: 'Medium', pattern: 'Dutch National Flag' },
    ]
  },
  // ═══════════════ STAGE 3: TREES & GRAPHS ═══════════════
  {
    id: 'trees', title: 'Trees (BT & BST)', stage: 'trees-graphs',
    icon: '🌳', color: '#4ade80', difficulty: 'Medium', estimatedTime: '4–5 hours',
    description: 'Binary trees, BSTs, traversals, DFS/BFS, and recursive tree algorithms.',
    concepts: [
      { title: 'Tree Basics', points: ['Binary Tree: each node has ≤ 2 children', 'BST: left < root < right for all subtrees', 'Traversals: preorder (root-L-R), inorder (L-root-R), postorder (L-R-root)', 'Level-order: BFS using queue'] },
      { title: 'Key Patterns', points: ['DFS recursion template: process node, recurse left, recurse right', 'Return multiple values: (height, balanced), (sum, count)', 'BST search: go left if target < node, right if target > node', 'LCA: if split found, current node is LCA'] },
    ],
    invariants: ['BST inorder traversal gives sorted order', 'Height of balanced tree = O(log n)', 'Full binary tree with n nodes has (n+1)/2 leaves'],
    thinkingFramework: [
      { condition: '"Max depth / height"', action: 'DFS returning height' },
      { condition: '"Path sum / diameter"', action: 'DFS passing accumulated value' },
      { condition: '"Level-order traversal"', action: 'BFS with queue' },
      { condition: '"Validate BST"', action: 'Inorder traversal (check sorted) or pass min/max bounds' },
      { condition: '"Lowest Common Ancestor"', action: 'Recursive split detection' },
      { condition: '"Serialize/deserialize"', action: 'Preorder with null markers' },
    ],
    tricks: [
      { name: 'Inorder for BST', tip: 'BST inorder = sorted array. Use this for validation and Kth smallest.', when: 'BST problems', avoid: 'General binary tree problems' },
      { name: 'Return Pair from DFS', tip: 'Return (value, isValid) tuples to carry multiple pieces of info up the recursion', when: 'Balanced tree, diameter, path sum', avoid: 'Simple traversal' },
    ],
    pitfalls: ['Confusing BT and BST properties', 'Not handling null nodes in recursion', 'Wrong traversal order', 'Forgetting that BST property must hold for ALL descendants, not just direct children'],
    practiceProblems: [
      { id: 'maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', pattern: 'DFS' },
      { id: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'Easy', pattern: 'DFS' },
      { id: 'same-tree', title: 'Same Tree', difficulty: 'Easy', pattern: 'DFS Comparison' },
      { id: 'binary-tree-level-order-traversal', title: 'Level Order Traversal', difficulty: 'Medium', pattern: 'BFS' },
      { id: 'validate-binary-search-tree', title: 'Validate BST', difficulty: 'Medium', pattern: 'DFS + Bounds' },
      { id: 'diameter-of-binary-tree', title: 'Diameter of Binary Tree', difficulty: 'Medium', pattern: 'DFS Return Pair' },
      { id: 'lowest-common-ancestor', title: 'Lowest Common Ancestor', difficulty: 'Medium', pattern: 'Recursive Split' },
      { id: 'binary-tree-maximum-path-sum', title: 'Binary Tree Max Path Sum', difficulty: 'Hard', pattern: 'DFS + Global Max' },
      { id: 'serialize-deserialize-binary-tree', title: 'Serialize & Deserialize', difficulty: 'Hard', pattern: 'Preorder + Null Markers' },
    ]
  },
  {
    id: 'heaps', title: 'Heaps / Priority Queue', stage: 'trees-graphs',
    icon: '⛰️', color: '#f59e0b', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Min/max heaps, top-K problems, merge K sorted, median maintenance.',
    concepts: [
      { title: 'Heap Basics', points: ['Complete binary tree stored as array', 'Min-heap: parent ≤ children; Max-heap: parent ≥ children', 'Insert: O(log n), Extract min/max: O(log n), Peek: O(1)', 'Heapify array: O(n)'] },
      { title: 'Key Patterns', points: ['Top-K: use min-heap of size K for top K largest', 'Merge K sorted: min-heap of K elements, extract min and push next', 'Running median: max-heap for lower half + min-heap for upper half', 'Greedy + heap: always pick optimal next element'] },
    ],
    invariants: ['Min-heap of size K always contains K largest elements seen so far', 'For median: |maxHeap.size - minHeap.size| ≤ 1', 'Parent at index i, children at 2i+1 and 2i+2'],
    thinkingFramework: [
      { condition: '"Top K / Kth largest"', action: 'Min-heap of size K' },
      { condition: '"Merge K sorted lists/arrays"', action: 'Min-heap with (value, list index)' },
      { condition: '"Running median"', action: 'Two heaps (max-heap lower + min-heap upper)' },
      { condition: '"Schedule / greedy with priorities"', action: 'Priority queue' },
    ],
    tricks: [
      { name: 'Opposite Heap', tip: 'For K largest, use MIN-heap (counterintuitive). For K smallest, use MAX-heap.', when: 'Top-K problems', avoid: 'N/A' },
    ],
    pitfalls: ['Using wrong heap type (min vs max)', 'Forgetting to maintain heap size = K', 'Not rebalancing two heaps for median'],
    practiceProblems: [
      { id: 'kth-largest-element', title: 'Kth Largest Element in Array', difficulty: 'Medium', pattern: 'Min-Heap / Quick Select' },
      { id: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'Medium', pattern: 'Min-Heap + Freq Map' },
      { id: 'task-scheduler', title: 'Task Scheduler', difficulty: 'Medium', pattern: 'Max-Heap + Greedy' },
      { id: 'merge-k-sorted-lists', title: 'Merge K Sorted Lists', difficulty: 'Hard', pattern: 'Min-Heap Merge' },
      { id: 'find-median-from-data-stream', title: 'Find Median from Data Stream', difficulty: 'Hard', pattern: 'Two Heaps' },
    ]
  },
  {
    id: 'graphs', title: 'Graphs', stage: 'trees-graphs',
    icon: '🕸️', color: '#ef4444', difficulty: 'Medium–Hard', estimatedTime: '5–6 hours',
    description: 'BFS, DFS, connected components, topological sort, shortest paths, MST.',
    concepts: [
      { title: 'Representations', points: ['Adjacency list: space O(V+E), lookup O(degree)', 'Adjacency matrix: space O(V²), lookup O(1)', 'Edge list: useful for Kruskal\'s MST'] },
      { title: 'Algorithms', points: ['BFS: level-order, shortest path in unweighted graphs — O(V+E)', 'DFS: explore as deep as possible, detect cycles — O(V+E)', 'Topological Sort: Kahn\'s (BFS + indegree) or DFS post-order', 'Dijkstra: shortest path with non-negative weights — O((V+E)log V)', 'Union-Find: connected components, cycle detection in undirected'] },
    ],
    invariants: ['BFS guarantees shortest path in unweighted graphs', 'DAG ↔ topological ordering exists ↔ no cycles', 'Dijkstra requires non-negative edge weights'],
    thinkingFramework: [
      { condition: '"Number of islands" / grid traversal', action: 'BFS or DFS on matrix (4 directions)' },
      { condition: '"Shortest path, unweighted"', action: 'BFS' },
      { condition: '"Shortest path, weighted"', action: 'Dijkstra' },
      { condition: '"Course schedule / ordering"', action: 'Topological sort (Kahn\'s BFS)' },
      { condition: '"Detect cycle in directed graph"', action: 'DFS with 3 colors (white/gray/black)' },
      { condition: '"Connected components"', action: 'DFS/BFS or Union-Find' },
      { condition: '"Bipartite check"', action: 'BFS/DFS 2-coloring' },
    ],
    tricks: [
      { name: 'Grid as Graph', tip: 'Treat grid cells as nodes, 4-directional neighbors as edges. Use visited matrix.', when: 'Grid traversal problems', avoid: 'N/A' },
      { name: 'Kahn\'s for Topo Sort', tip: 'Start with all indegree-0  nodes, process BFS-style. If result size < V, cycle exists.', when: 'Ordering / dependency problems', avoid: 'N/A' },
    ],
    pitfalls: ['Not marking nodes as visited → infinite loop', 'Wrong direction array for grid problems', 'Dijkstra with negative weights', 'Forgetting to handle disconnected components'],
    practiceProblems: [
      { id: 'number-of-islands', title: 'Number of Islands', difficulty: 'Medium', pattern: 'BFS/DFS on Grid' },
      { id: 'clone-graph', title: 'Clone Graph', difficulty: 'Medium', pattern: 'BFS + HashMap' },
      { id: 'course-schedule', title: 'Course Schedule', difficulty: 'Medium', pattern: 'Topological Sort' },
      { id: 'rotting-oranges', title: 'Rotting Oranges', difficulty: 'Medium', pattern: 'Multi-source BFS' },
      { id: 'pacific-atlantic-water-flow', title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', pattern: 'Reverse BFS/DFS' },
      { id: 'graph-valid-tree', title: 'Graph Valid Tree', difficulty: 'Medium', pattern: 'Union-Find / DFS' },
      { id: 'network-delay-time', title: 'Network Delay Time', difficulty: 'Medium', pattern: 'Dijkstra' },
      { id: 'alien-dictionary', title: 'Alien Dictionary', difficulty: 'Hard', pattern: 'Topological Sort' },
    ]
  },
  // ═══════════════ STAGE 4: OPTIMIZATION ═══════════════
  {
    id: 'greedy', title: 'Greedy Algorithms', stage: 'optimization',
    icon: '💰', color: '#10b981', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Activity selection, interval scheduling, local optimum strategies.',
    concepts: [
      { title: 'Core Idea', points: ['Make the locally optimal choice at each step', 'Greedy works when local optimum leads to global optimum', 'Often requires sorting by a specific key first', 'Proof technique: exchange argument or greedy stays ahead'] },
      { title: 'Common Patterns', points: ['Interval scheduling: sort by end time, pick non-overlapping', 'Merge intervals: sort by start, merge overlapping', 'Jump game: track farthest reachable position', 'Fractional knapsack: sort by value/weight ratio'] },
    ],
    invariants: ['Activity selection: sorted by end time → greedy picks max non-overlapping', 'Jump game: if farthest ≥ last index, reachable'],
    thinkingFramework: [
      { condition: '"Non-overlapping intervals / activity selection"', action: 'Sort by end time, greedy pick' },
      { condition: '"Merge intervals"', action: 'Sort by start, merge overlapping' },
      { condition: '"Can reach end?" / Jump Game', action: 'Track farthest reachable' },
      { condition: '"Minimum platforms / meeting rooms"', action: 'Sort events, sweep line' },
      { condition: '"Gas station / circular route"', action: 'Track cumulative surplus' },
    ],
    tricks: [
      { name: 'Sort First', tip: 'Most greedy problems require sorting by a specific criteria before applying greedy logic', when: 'Almost always', avoid: 'N/A' },
    ],
    pitfalls: ['Applying greedy when DP is needed (greedy doesn\'t work for 0/1 knapsack)', 'Sorting by wrong criteria', 'Not proving greedy correctness'],
    practiceProblems: [
      { id: 'jump-game', title: 'Jump Game', difficulty: 'Medium', pattern: 'Greedy Reachability' },
      { id: 'jump-game-ii', title: 'Jump Game II', difficulty: 'Medium', pattern: 'Greedy Min Jumps' },
      { id: 'merge-intervals', title: 'Merge Intervals', difficulty: 'Medium', pattern: 'Sort + Merge' },
      { id: 'non-overlapping-intervals', title: 'Non-overlapping Intervals', difficulty: 'Medium', pattern: 'Activity Selection' },
      { id: 'gas-station', title: 'Gas Station', difficulty: 'Medium', pattern: 'Cumulative Surplus' },
      { id: 'partition-labels', title: 'Partition Labels', difficulty: 'Medium', pattern: 'Last Occurrence + Greedy' },
    ]
  },
  {
    id: 'dynamic-programming', title: 'Dynamic Programming', stage: 'optimization',
    icon: '🧩', color: '#ec4899', difficulty: 'Medium–Hard', estimatedTime: '6–8 hours',
    description: 'Overlapping subproblems, optimal substructure, 1D/2D DP, knapsack, DP on strings.',
    concepts: [
      { title: 'Core Principles', points: ['Overlapping subproblems: same subproblem solved multiple times', 'Optimal substructure: optimal solution built from optimal sub-solutions', 'Memoization (top-down): cache recursive results', 'Tabulation (bottom-up): fill table iteratively'] },
      { title: 'Sub-patterns', points: ['1D DP: dp[i] depends on previous states (climb stairs, house robber)', '2D Grid DP: dp[i][j] for paths, min cost in grid', 'Knapsack: choose/skip item at capacity (0/1 or unbounded)', 'DP on Strings: LCS, edit distance, palindromes — dp[i][j] for s1[0..i] vs s2[0..j]', 'DP on Trees: post-order DFS, dp at each node'] },
    ],
    invariants: ['dp[i] must be fully defined before computing dp[i+1]', '0/1 Knapsack: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])', 'LCS: dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j], dp[i][j-1])'],
    thinkingFramework: [
      { condition: '"Count ways to reach X"', action: '1D DP (like climbing stairs)' },
      { condition: '"Min/max cost path in grid"', action: '2D DP' },
      { condition: '"Choose items with weight limit"', action: '0/1 or unbounded knapsack' },
      { condition: '"Longest common subsequence / edit distance"', action: 'DP on strings — 2D table' },
      { condition: '"Partition into equal subsets"', action: 'Subset sum (knapsack variant)' },
      { condition: '"Longest increasing subsequence"', action: '1D DP or patience sorting O(n log n)' },
      { condition: '"Min coins to make amount"', action: 'Unbounded knapsack / coin change' },
    ],
    tricks: [
      { name: 'State Definition First', tip: 'Before coding, clearly define what dp[i] or dp[i][j] represents. This is 80% of the work.', when: 'Every DP problem', avoid: 'N/A' },
      { name: 'Space Optimization', tip: 'If dp[i] only depends on dp[i-1], use two variables or rolling array instead of full table', when: 'After getting basic solution working', avoid: 'When you need to reconstruct the path' },
      { name: 'Draw the Table', tip: 'For 2D DP, draw the table on paper to visualize transitions', when: 'String DP, grid DP', avoid: 'N/A' },
    ],
    pitfalls: ['Wrong state definition → wrong recurrence', 'Wrong base cases', 'Not considering all transitions', 'Integer overflow in counting problems', 'Confusing 0-indexed and 1-indexed DP'],
    practiceProblems: [
      { id: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'Easy', pattern: '1D DP' },
      { id: 'house-robber', title: 'House Robber', difficulty: 'Medium', pattern: '1D DP' },
      { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', pattern: 'Unbounded Knapsack' },
      { id: 'longest-increasing-subsequence', title: 'Longest Increasing Subsequence', difficulty: 'Medium', pattern: '1D DP / Patience Sort' },
      { id: 'unique-paths', title: 'Unique Paths', difficulty: 'Medium', pattern: '2D Grid DP' },
      { id: 'word-break', title: 'Word Break', difficulty: 'Medium', pattern: '1D DP + Set' },
      { id: 'longest-common-subsequence', title: 'Longest Common Subsequence', difficulty: 'Medium', pattern: 'String DP' },
      { id: 'partition-equal-subset-sum', title: 'Partition Equal Subset Sum', difficulty: 'Medium', pattern: '0/1 Knapsack' },
      { id: 'edit-distance', title: 'Edit Distance', difficulty: 'Medium', pattern: 'String DP' },
      { id: 'longest-palindromic-subsequence', title: 'Longest Palindromic Subsequence', difficulty: 'Medium', pattern: 'String DP' },
    ]
  },
  {
    id: 'advanced', title: 'Advanced Topics', stage: 'optimization',
    icon: '🔬', color: '#8b5cf6', difficulty: 'Hard', estimatedTime: '4–5 hours',
    description: 'Tries, segment trees, disjoint set union, bit manipulation, and advanced techniques.',
    concepts: [
      { title: 'Trie', points: ['Prefix tree for string storage/search', 'Each node has children mapped by character', 'O(L) insert/search where L = word length', 'Autocomplete, spell check, prefix matching'] },
      { title: 'Union-Find (DSU)', points: ['Track connected components efficiently', 'Union by rank + path compression → near O(1) per operation', 'Cycle detection in undirected graphs', 'Kruskal\'s MST algorithm'] },
      { title: 'Bit Manipulation', points: ['XOR properties: a^a=0, a^0=a', 'Check bit: n & (1<<i)', 'Set/clear/toggle bits', 'Count set bits, power of 2 check: n & (n-1) == 0'] },
    ],
    invariants: ['Trie: shared prefixes share nodes', 'Union-Find with rank+compression: amortized O(α(n)) ≈ O(1)', 'XOR of all elements: duplicates cancel out'],
    thinkingFramework: [
      { condition: '"Prefix search / autocomplete"', action: 'Trie' },
      { condition: '"Connected components with dynamic edges"', action: 'Union-Find' },
      { condition: '"Find single number among duplicates"', action: 'XOR all elements' },
      { condition: '"MST (minimum spanning tree)"', action: 'Kruskal + Union-Find or Prim + Heap' },
      { condition: '"Range queries with updates"', action: 'Segment tree or BIT' },
    ],
    tricks: [
      { name: 'XOR for Unique', tip: 'XOR all elements — duplicates cancel, leaving the unique one', when: 'Single number problems', avoid: 'When more than one unique element' },
    ],
    pitfalls: ['Trie memory usage can be high for large alphabets', 'Union-Find without rank/compression degrades to O(n)', 'Bit manipulation: sign bit issues with negative numbers'],
    practiceProblems: [
      { id: 'implement-trie', title: 'Implement Trie', difficulty: 'Medium', pattern: 'Trie' },
      { id: 'word-search-ii', title: 'Word Search II', difficulty: 'Hard', pattern: 'Trie + Backtracking' },
      { id: 'single-number', title: 'Single Number', difficulty: 'Easy', pattern: 'XOR' },
      { id: 'counting-bits', title: 'Counting Bits', difficulty: 'Easy', pattern: 'Bit DP' },
      { id: 'number-of-connected-components', title: 'Connected Components', difficulty: 'Medium', pattern: 'Union-Find' },
      { id: 'redundant-connection', title: 'Redundant Connection', difficulty: 'Medium', pattern: 'Union-Find Cycle' },
    ]
  },
];

export const getDSATopicIds = () => DSA_TOPICS.map(t => t.id);
export const getDSATopicsByStage = (stageId) => DSA_TOPICS.filter(t => t.stage === stageId);
