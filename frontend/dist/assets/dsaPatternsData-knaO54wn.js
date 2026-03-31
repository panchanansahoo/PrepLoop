const e=[{id:"binary-search-classic",name:"Binary Search — Classic",category:"Binary Search",difficulty:"Easy",description:"Divide the search space in half each step to find a target in O(log n). The foundational technique behind dozens of harder problems.",theory:`### 1 · Intuition
Binary search works on **sorted** data. Compare the middle element to the target; discard the half where the target cannot lie. Repeat until found or the range is empty.

### 2 · Template
\`\`\`
lo, hi = 0, n-1
while lo <= hi:
  mid = lo + (hi - lo) // 2
  if arr[mid] == target: return mid
  elif arr[mid] < target: lo = mid + 1
  else: hi = mid - 1
return -1
\`\`\`

### 3 · When to Use
- Sorted array, search for a value
- Minimize/maximize answer (binary search on answer)
- Finding boundaries (first/last occurrence)

### 4 · Pitfalls
- Off-by-one errors: use lo <= hi for closed interval
- Integer overflow in mid: use lo + (hi - lo) / 2
- Not applicable to unsorted data without modification`,examples:["Search in sorted array","First/last position of element","Square root of integer"],problems:[{id:"binary-search",title:"Binary Search",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-search/",link:"/problem/binary-search"},{id:"search-insert-position",title:"Search Insert Position",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-insert-position/",link:"/problem/search-insert-position"},{id:"guess-number",title:"Guess Number Higher or Lower",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/guess-number-higher-or-lower/",link:"/problem/guess-number"}]},{id:"rotated-array-search",name:"Search in Rotated Sorted Array",category:"Binary Search",difficulty:"Medium",description:"Apply binary search on a rotated sorted array by identifying which half is sorted, then narrowing the search accordingly.",theory:`### 1 · Intuition
A rotated sorted array has two sorted halves. At each step of binary search, **one half is always sorted**. Check if the target lies in the sorted half; if yes, search there, otherwise search the other half.

### 2 · Template
\`\`\`
lo, hi = 0, n-1
while lo <= hi:
  mid = (lo + hi) // 2
  if arr[mid] == target: return mid
  if arr[lo] <= arr[mid]:      // left half sorted
    if arr[lo] <= target < arr[mid]: hi = mid - 1
    else: lo = mid + 1
  else:                         // right half sorted
    if arr[mid] < target <= arr[hi]: lo = mid + 1
    else: hi = mid - 1
\`\`\`

### 3 · Variants
- With duplicates: worst case O(n) when lo == mid == hi
- Find minimum in rotated array: binary search for the pivot`,examples:["Search in rotated sorted array","Find minimum in rotated sorted array"],problems:[{id:"search-rotated",title:"Search in Rotated Sorted Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-in-rotated-sorted-array/",link:"/problem/search-rotated"},{id:"find-min-rotated",title:"Find Minimum in Rotated Sorted Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",link:"/problem/find-min-rotated"}]},{id:"binary-search-answer",name:"Binary Search on Answer",category:"Binary Search",difficulty:"Medium",description:"When asked to minimize/maximize a value, binary search the answer space and check feasibility with a greedy or simulation function.",theory:`### 1 · Intuition
Instead of searching an array, search the **answer space** [lo, hi]. For each candidate answer mid, check if it's feasible. Use the feasibility to shrink the range.

### 2 · Template
\`\`\`
lo, hi = min_possible, max_possible
while lo < hi:
  mid = (lo + hi) // 2
  if feasible(mid): hi = mid
  else: lo = mid + 1
return lo
\`\`\`

### 3 · Classic Problems
- Koko eating bananas (minimize speed)
- Split array largest sum (minimize max sum)
- Capacity to ship packages within D days`,examples:["Koko eating bananas","Split array largest sum","Ship packages in D days"],problems:[{id:"koko-bananas",title:"Koko Eating Bananas",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/koko-eating-bananas/",link:"/problem/koko-bananas"},{id:"split-array-largest-sum",title:"Split Array Largest Sum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/split-array-largest-sum/",link:"/problem/split-array-largest-sum"},{id:"capacity-to-ship",title:"Capacity To Ship Packages",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",link:"/problem/capacity-to-ship"}]},{id:"search-2d-matrix",name:"Search a 2D Matrix",category:"Binary Search",difficulty:"Medium",description:"Treat a row-sorted or fully-sorted matrix as a virtual 1D array and apply binary search in O(log(m*n)).",theory:`### 1 · Intuition
If each row is sorted and the first element of each row > last element of previous row, the matrix is effectively a sorted 1D array. Map index i to row=i/cols, col=i%cols.

### 2 · Variant — Search Matrix II
Rows sorted left-to-right, columns sorted top-to-bottom (not fully sorted). Start from top-right corner: if target < current, move left; if target > current, move down. O(m+n).`,examples:["Search 2D matrix","Search matrix II (staircase search)"],problems:[{id:"search-2d-matrix",title:"Search a 2D Matrix",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-a-2d-matrix/",link:"/problem/search-2d-matrix"},{id:"search-2d-matrix-ii",title:"Search a 2D Matrix II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-a-2d-matrix-ii/",link:"/problem/search-2d-matrix-ii"}]},{id:"peak-element",name:"Find Peak Element",category:"Binary Search",difficulty:"Medium",description:"Use binary search to find a local maximum in an unsorted array by always moving towards the larger neighbor.",theory:`### 1 · Intuition
A peak is an element greater than its neighbors. Even in unsorted arrays, binary search works: compare mid with mid+1. If mid < mid+1, a peak exists on the right; otherwise on the left. O(log n).

### 2 · Key Insight
The array boundaries are -∞, so a peak always exists. We're guaranteed to find one by following the "uphill" direction.`,examples:["Find peak element in array","Find peak in mountain array"],problems:[{id:"find-peak-element",title:"Find Peak Element",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-peak-element/",link:"/problem/find-peak-element"},{id:"peak-mountain",title:"Peak Index in Mountain Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/peak-index-in-a-mountain-array/",link:"/problem/peak-mountain"}]},{id:"first-last-position",name:"First & Last Position",category:"Binary Search",difficulty:"Medium",description:"Use two binary searches to find the leftmost and rightmost occurrence of a target in a sorted array.",theory:`### 1 · Intuition
Standard binary search finds *any* occurrence. To find the **first**, when arr[mid]==target, keep searching left (hi=mid-1) and record mid. For the **last**, keep searching right (lo=mid+1).

### 2 · Template (Lower Bound)
\`\`\`
lo, hi, result = 0, n-1, -1
while lo <= hi:
  mid = (lo+hi)//2
  if arr[mid] >= target: hi = mid-1; if arr[mid]==target: result=mid
  else: lo = mid+1
return result
\`\`\``,examples:["First and last position of element","Count occurrences in sorted array"],problems:[{id:"first-last-position",title:"Find First and Last Position",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",link:"/problem/first-last-position"},{id:"search-range",title:"Search Range",difficulty:"Medium",status:"pending",link:"/problem/search-range"}]},{id:"linked-list-reversal",name:"Linked List Reversal",category:"Linked List",difficulty:"Easy",description:"Reverse a singly linked list iteratively or recursively — the fundamental linked list manipulation pattern.",theory:`### 1 · Intuition
Maintain three pointers: prev, current, next. At each step, point current.next to prev, advance all pointers. O(n) time, O(1) space.

### 2 · Iterative Template
\`\`\`
prev = null, curr = head
while curr:
  next = curr.next
  curr.next = prev
  prev = curr
  curr = next
return prev
\`\`\`

### 3 · Variants
- Reverse between positions m and n
- Reverse in groups of k
- Check if palindrome (reverse second half, compare)`,examples:["Reverse linked list","Reverse between positions m and n","Reverse nodes in k-group"],problems:[{id:"reverse-linked-list",title:"Reverse Linked List",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-linked-list/",link:"/problem/reverse-linked-list"},{id:"reverse-linked-list-ii",title:"Reverse Linked List II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-linked-list-ii/",link:"/problem/reverse-linked-list-ii"},{id:"reverse-k-group",title:"Reverse Nodes in k-Group",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-nodes-in-k-group/",link:"/problem/reverse-k-group"}]},{id:"merge-linked-lists",name:"Merge Sorted Lists",category:"Linked List",difficulty:"Easy",description:"Merge two or k sorted linked lists using two-pointer comparison or a min-heap for k-way merge.",theory:`### 1 · Two Lists
Compare heads, attach smaller to result, advance that pointer. O(n+m).

### 2 · K Lists
Use a min-heap of size k. Pop smallest, push its next. O(N log k) where N = total nodes.`,examples:["Merge two sorted lists","Merge k sorted lists"],problems:[{id:"merge-two-sorted",title:"Merge Two Sorted Lists",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-two-sorted-lists/",link:"/problem/merge-two-sorted"},{id:"merge-k-sorted",title:"Merge k Sorted Lists",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-k-sorted-lists/",link:"/problem/merge-k-sorted"}]},{id:"linked-list-intersection",name:"Linked List Intersection",category:"Linked List",difficulty:"Easy",description:"Find the intersection node of two linked lists using the two-pointer length-equalization technique.",theory:`### 1 · Intuition
Two pointers start at heads of both lists. When one reaches the end, redirect to the other list's head. They meet at the intersection (or both reach null). O(m+n) time, O(1) space.

### 2 · Why It Works
Pointer A travels: a + c + b. Pointer B travels: b + c + a. Both travel the same distance, so they sync at the intersection node.`,examples:["Intersection of two linked lists","Linked list cycle detection"],problems:[{id:"intersection-two-lists",title:"Intersection of Two Linked Lists",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/intersection-of-two-linked-lists/",link:"/problem/intersection-two-lists"},{id:"remove-nth-from-end",title:"Remove Nth Node From End",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/remove-nth-node-from-end-of-list/",link:"/problem/remove-nth-from-end"}]},{id:"linked-list-rearrange",name:"Linked List Rearrangement",category:"Linked List",difficulty:"Medium",description:"Reorder, swap, or partition linked list nodes using pointer manipulation patterns.",theory:`### 1 · Common Patterns
- **Swap Pairs**: swap every two adjacent nodes
- **Odd-Even**: group odd-indexed and even-indexed nodes
- **Reorder List**: L1→Ln→L2→Ln-1... (find mid, reverse second half, merge)
- **Partition**: rearrange so all nodes < x come before nodes >= x`,examples:["Swap nodes in pairs","Odd-even linked list","Reorder list"],problems:[{id:"swap-nodes-pairs",title:"Swap Nodes in Pairs",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/swap-nodes-in-pairs/",link:"/problem/swap-nodes-pairs"},{id:"odd-even-list",title:"Odd Even Linked List",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/odd-even-linked-list/",link:"/problem/odd-even-list"},{id:"reorder-list",title:"Reorder List",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reorder-list/",link:"/problem/reorder-list"}]},{id:"stack-basics",name:"Stack Fundamentals",category:"Stack & Queue",difficulty:"Easy",description:"LIFO structure for matching, nesting, and evaluation problems — parentheses, expressions, and undo operations.",theory:`### 1 · Core Operations
Push O(1), Pop O(1), Peek O(1). Perfect for matching pairs and tracking state.

### 2 · Classic Problems
- **Valid Parentheses**: push openers, pop on closers, check match
- **Min Stack**: maintain a parallel stack tracking current minimum
- **Evaluate RPN**: push numbers, pop two on operator, push result`,examples:["Valid parentheses","Min stack","Evaluate reverse polish notation"],problems:[{id:"valid-parentheses",title:"Valid Parentheses",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-parentheses/",link:"/problem/valid-parentheses"},{id:"min-stack",title:"Min Stack",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/min-stack/",link:"/problem/min-stack"},{id:"eval-rpn",title:"Evaluate Reverse Polish Notation",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/evaluate-reverse-polish-notation/",link:"/problem/eval-rpn"}]},{id:"queue-deque",name:"Queue & Deque Patterns",category:"Stack & Queue",difficulty:"Medium",description:"FIFO structures and double-ended queues for BFS, sliding window maximum, and task scheduling.",theory:`### 1 · Queue Uses
BFS traversal, task scheduling (round-robin), recent counter.

### 2 · Deque
Add/remove from both ends in O(1). Key pattern: **sliding window maximum** — maintain a monotonic decreasing deque of indices.

### 3 · Implement Queue using Stacks
Two stacks: push to stack1, pop by transferring to stack2 when stack2 is empty. Amortized O(1).`,examples:["Implement queue using stacks","Sliding window maximum","Task scheduler"],problems:[{id:"queue-using-stacks",title:"Implement Queue using Stacks",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/implement-queue-using-stacks/",link:"/problem/queue-using-stacks"},{id:"sliding-window-max",title:"Sliding Window Maximum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sliding-window-maximum/",link:"/problem/sliding-window-max"},{id:"task-scheduler",title:"Task Scheduler",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/task-scheduler/",link:"/problem/task-scheduler"}]},{id:"monotonic-stack-pattern",name:"Monotonic Stack",category:"Stack & Queue",difficulty:"Medium",description:"Maintain a stack in sorted order to find the next greater/smaller element for each position in O(n).",theory:`### 1 · Intuition
Process elements and maintain a stack that is always increasing or decreasing. When a new element violates the order, pop elements — each popped element has found its "next greater/smaller."

### 2 · Template (Next Greater Element)
\`\`\`
result = [-1] * n
stack = []
for i in range(n):
  while stack and arr[i] > arr[stack[-1]]:
    result[stack.pop()] = arr[i]
  stack.append(i)
\`\`\`

### 3 · Applications
- Next greater element (I, II, circular)
- Daily temperatures
- Largest rectangle in histogram
- Trapping rain water`,examples:["Next greater element","Daily temperatures","Largest rectangle in histogram"],problems:[{id:"daily-temperatures",title:"Daily Temperatures",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/daily-temperatures/",link:"/problem/daily-temperatures"},{id:"next-greater-element",title:"Next Greater Element I",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/next-greater-element-i/",link:"/problem/next-greater-element"},{id:"largest-rectangle-histogram",title:"Largest Rectangle in Histogram",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/largest-rectangle-in-histogram/",link:"/problem/largest-rectangle-histogram"},{id:"trapping-rain-water",title:"Trapping Rain Water",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/trapping-rain-water/",link:"/problem/trapping-rain-water"}]},{id:"tree-traversals",name:"Tree Traversal Patterns",category:"Tree",difficulty:"Medium",description:"Master inorder, preorder, postorder (iterative), level-order, and zigzag traversals of binary trees.",theory:`### 1 · Traversal Orders
- **Inorder** (Left, Root, Right) — gives sorted order for BST
- **Preorder** (Root, Left, Right) — useful for serialization
- **Postorder** (Left, Right, Root) — useful for deletion, calculating subtree values
- **Level-order** — BFS with queue

### 2 · Iterative Inorder Template
\`\`\`
stack = []
curr = root
while curr or stack:
  while curr:
    stack.append(curr)
    curr = curr.left
  curr = stack.pop()
  visit(curr)
  curr = curr.right
\`\`\``,examples:["Iterative inorder traversal","Zigzag level order","Right side view of binary tree"],problems:[{id:"inorder-traversal",title:"Binary Tree Inorder Traversal",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-inorder-traversal/",link:"/problem/inorder-traversal"},{id:"zigzag-level-order",title:"Zigzag Level Order Traversal",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",link:"/problem/zigzag-level-order"},{id:"right-side-view",title:"Binary Tree Right Side View",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-right-side-view/",link:"/problem/right-side-view"}]},{id:"bst-operations",name:"BST Operations",category:"Tree",difficulty:"Medium",description:"Leverage the BST property (left < root < right) for validation, search, insertion, and kth smallest element.",theory:`### 1 · Key Property
For every node: all left subtree values < node.val < all right subtree values.

### 2 · Validate BST
Pass valid range (min, max) down recursively. Each node must be within its range.

### 3 · Kth Smallest
Inorder traversal visits nodes in sorted order. Count to k during traversal.

### 4 · LCA in BST
If both values < root, go left. If both > root, go right. Otherwise, root is the LCA. O(h).`,examples:["Validate binary search tree","Kth smallest element in BST","Lowest common ancestor of BST"],problems:[{id:"validate-bst",title:"Validate Binary Search Tree",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/validate-binary-search-tree/",link:"/problem/validate-bst"},{id:"kth-smallest-bst",title:"Kth Smallest Element in BST",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/kth-smallest-element-in-a-bst/",link:"/problem/kth-smallest-bst"},{id:"lca-bst",title:"Lowest Common Ancestor of BST",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",link:"/problem/lca-bst"}]},{id:"tree-construction",name:"Tree Construction & Serialization",category:"Tree",difficulty:"Medium",description:"Build trees from traversal sequences, serialize/deserialize trees, and flatten trees to linked lists.",theory:`### 1 · Build from Preorder + Inorder
Preorder first element = root. Find root in inorder → left of it = left subtree, right = right subtree. Recurse.

### 2 · Serialize / Deserialize
BFS or preorder with null markers. Deserialize by reading tokens in order.

### 3 · Flatten to Linked List
Modified preorder: for each node, flatten left subtree, insert between node and right subtree.`,examples:["Construct tree from preorder and inorder","Serialize and deserialize binary tree","Flatten binary tree to linked list"],problems:[{id:"build-tree-preorder-inorder",title:"Construct Binary Tree from Preorder and Inorder",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",link:"/problem/build-tree-preorder-inorder"},{id:"serialize-deserialize",title:"Serialize and Deserialize Binary Tree",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",link:"/problem/serialize-deserialize"},{id:"flatten-tree",title:"Flatten Binary Tree to Linked List",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/flatten-binary-tree-to-linked-list/",link:"/problem/flatten-tree"}]}],t=[{id:"lca-binary-tree",name:"Lowest Common Ancestor (Binary Tree)",category:"Tree",difficulty:"Medium",description:"Find the deepest node that is an ancestor of both target nodes using post-order recursion.",theory:`### Intuition
Recurse left and right. If both return non-null, current node is the LCA. If only one side returns non-null, propagate that result upward. Base case: node is null or matches p or q.`,examples:["LCA of a binary tree","LCA with parent pointers"],problems:[{id:"lca-bt",title:"Lowest Common Ancestor of a Binary Tree",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",link:"/problem/lca-bt"},{id:"lca-deepest-leaves",title:"LCA of Deepest Leaves",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-deepest-leaves/",link:"/problem/lca-deepest-leaves"}]},{id:"tree-diameter-path",name:"Tree Diameter & Path Sum",category:"Tree",difficulty:"Medium",description:"Calculate the diameter of a tree and find maximum path sums using post-order DFS.",theory:`### Diameter
For each node, diameter through it = left_height + right_height. Track global max. O(n).

### Max Path Sum
Similar but track max sum through each node. A path can "turn" at any node. Return max single-arm to parent.`,examples:["Diameter of binary tree","Binary tree maximum path sum","Path sum I, II, III"],problems:[{id:"diameter-bt",title:"Diameter of Binary Tree",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/diameter-of-binary-tree/",link:"/problem/diameter-bt"},{id:"max-path-sum",title:"Binary Tree Maximum Path Sum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-maximum-path-sum/",link:"/problem/max-path-sum"},{id:"path-sum-iii",title:"Path Sum III",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/path-sum-iii/",link:"/problem/path-sum-iii"}]},{id:"heap-priority-queue",name:"Heap / Priority Queue",category:"Heap",difficulty:"Medium",description:"Use min-heap and max-heap to efficiently access min/max elements — essential for top-k, merge, and scheduling.",theory:`### 1 · Operations
- Insert: O(log n), Extract-min/max: O(log n), Peek: O(1)

### 2 · Top K Pattern
Maintain a min-heap of size k. If new element > heap top, pop and push. Final heap = top k elements.

### 3 · K-Way Merge
Push first element from each list into min-heap. Pop smallest, push next from its list. O(N log k).`,examples:["Kth largest element","Top k frequent elements","Find median from data stream"],problems:[{id:"kth-largest",title:"Kth Largest Element in an Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/kth-largest-element-in-an-array/",link:"/problem/kth-largest"},{id:"top-k-frequent",title:"Top K Frequent Elements",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/top-k-frequent-elements/",link:"/problem/top-k-frequent"},{id:"find-median-stream",title:"Find Median from Data Stream",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/",link:"/problem/find-median-stream"}]},{id:"two-heaps",name:"Two Heaps Pattern",category:"Heap",difficulty:"Hard",description:"Use a max-heap for the lower half and min-heap for the upper half to maintain a running median or balanced partition.",theory:`### Intuition
Split numbers into two halves: smaller half in max-heap, larger half in min-heap. Balance sizes so they differ by at most 1. Median = top of the larger heap, or average of both tops if equal sizes.

### Template
\`\`\`
add(num):
  maxHeap.push(num)
  minHeap.push(maxHeap.pop())
  if len(minHeap) > len(maxHeap):
    maxHeap.push(minHeap.pop())
\`\`\``,examples:["Find median from data stream","Sliding window median"],problems:[{id:"find-median",title:"Find Median from Data Stream",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/",link:"/problem/find-median"},{id:"sliding-window-median",title:"Sliding Window Median",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sliding-window-median/",link:"/problem/sliding-window-median"}]},{id:"interval-merge",name:"Interval Merge & Insert",category:"Intervals",difficulty:"Medium",description:"Sort intervals by start time and merge overlapping ones. Insert new intervals by finding overlap boundaries.",theory:`### Merge Intervals
Sort by start. Iterate: if current overlaps with last merged, extend end. Otherwise, add new interval. O(n log n).

### Insert Interval
Three phases: add all intervals ending before new one, merge all overlapping, add all remaining.`,examples:["Merge intervals","Insert interval","Meeting rooms"],problems:[{id:"merge-intervals",title:"Merge Intervals",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-intervals/",link:"/problem/merge-intervals"},{id:"insert-interval",title:"Insert Interval",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/insert-interval/",link:"/problem/insert-interval"},{id:"meeting-rooms-ii",title:"Meeting Rooms II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/meeting-rooms-ii/",link:"/problem/meeting-rooms-ii"}]},{id:"interval-scheduling",name:"Interval Scheduling & Minimum Removal",category:"Intervals",difficulty:"Medium",description:"Greedy selection of maximum non-overlapping intervals — the classic activity selection / minimum removal problem.",theory:`### Intuition
Sort by end time. Greedily select intervals that end earliest and don't overlap the last selected. The number removed = total - selected.

### Why End Time?
Choosing the earliest-ending interval leaves maximum room for future intervals.`,examples:["Non-overlapping intervals","Minimum arrows to burst balloons"],problems:[{id:"non-overlapping",title:"Non-overlapping Intervals",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/non-overlapping-intervals/",link:"/problem/non-overlapping"},{id:"burst-balloons-arrows",title:"Minimum Number of Arrows to Burst Balloons",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/",link:"/problem/burst-balloons-arrows"}]},{id:"greedy-basics",name:"Greedy Fundamentals",category:"Greedy",difficulty:"Medium",description:"Make locally optimal choices at each step to reach a globally optimal solution — when greedy works and how to prove it.",theory:`### When Greedy Works
1. **Optimal substructure**: optimal solution contains optimal sub-solutions
2. **Greedy choice property**: locally optimal choices lead to globally optimal

### Proof Techniques
- Exchange argument: show swapping any choice with the greedy choice doesn't worsen the solution
- Stays-ahead argument: show greedy stays at least as good at every step`,examples:["Jump game I & II","Gas station","Assign cookies"],problems:[{id:"jump-game",title:"Jump Game",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/jump-game/",link:"/problem/jump-game"},{id:"jump-game-ii",title:"Jump Game II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/jump-game-ii/",link:"/problem/jump-game-ii"},{id:"gas-station",title:"Gas Station",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/gas-station/",link:"/problem/gas-station"}]},{id:"greedy-partition",name:"Greedy Partitioning",category:"Greedy",difficulty:"Medium",description:"Partition strings or arrays into minimum segments using greedy tracking of last occurrences or constraints.",theory:`### Partition Labels
For each character, track its last occurrence. Extend the current partition to include the farthest last occurrence. When current index == partition end, cut.

### Hand of Straights
Sort, use a map to greedily form groups of consecutive numbers.`,examples:["Partition labels","Hand of straights","Reorganize string"],problems:[{id:"partition-labels",title:"Partition Labels",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/partition-labels/",link:"/problem/partition-labels"},{id:"hand-of-straights",title:"Hand of Straights",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/hand-of-straights/",link:"/problem/hand-of-straights"},{id:"reorganize-string",title:"Reorganize String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reorganize-string/",link:"/problem/reorganize-string"}]},{id:"hashmap-counting",name:"Hash Map Counting Patterns",category:"Hash Map",difficulty:"Easy",description:"Use hash maps for frequency counting, anagram detection, grouping, and subarray sum problems.",theory:`### 1 · Frequency Count
Count occurrences of elements. O(n) time, O(k) space where k = unique elements.

### 2 · Anagram Detection
Two strings are anagrams if their frequency maps match. Group anagrams by sorted key or frequency signature.

### 3 · Two Sum Pattern
Store complement (target - num) in map. On each number, check if its complement exists. O(n).`,examples:["Two sum","Group anagrams","Valid anagram","Ransom note"],problems:[{id:"two-sum",title:"Two Sum",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/two-sum/",link:"/problem/two-sum"},{id:"group-anagrams",title:"Group Anagrams",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/group-anagrams/",link:"/problem/group-anagrams"},{id:"ransom-note",title:"Ransom Note",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/ransom-note/",link:"/problem/ransom-note"}]},{id:"prefix-sum",name:"Prefix Sum",category:"Hash Map",difficulty:"Medium",description:"Precompute cumulative sums to answer range sum queries in O(1) and find subarrays with target sum using hash maps.",theory:`### 1 · Build
prefix[i] = sum(arr[0..i]). Range sum [l, r] = prefix[r] - prefix[l-1]. O(n) precompute, O(1) query.

### 2 · Subarray Sum Equals K
Store prefix sum frequencies in a hash map. For each prefix[i], check if prefix[i] - k exists. O(n).

### 3 · 2D Prefix Sum
prefix[i][j] = sum of rectangle from (0,0) to (i,j). Use inclusion-exclusion for sub-rectangle queries.`,examples:["Subarray sum equals k","Range sum query","Contiguous array (equal 0s and 1s)"],problems:[{id:"subarray-sum-k",title:"Subarray Sum Equals K",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subarray-sum-equals-k/",link:"/problem/subarray-sum-k"},{id:"range-sum-query",title:"Range Sum Query - Immutable",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/range-sum-query-immutable/",link:"/problem/range-sum-query"},{id:"contiguous-array",title:"Contiguous Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/contiguous-array/",link:"/problem/contiguous-array"}]},{id:"trie-pattern",name:"Trie (Prefix Tree)",category:"Trie",difficulty:"Medium",description:"A tree-like data structure for efficient prefix matching, autocomplete, and word search in O(L) per operation.",theory:`### 1 · Structure
Each node has up to 26 children (for lowercase English). A boolean marks word endings.

### 2 · Operations
- **Insert**: traverse/create nodes for each character, mark last as word end
- **Search**: traverse nodes, return true if end is reached and marked
- **StartsWith**: traverse nodes, return true if path exists (no end-mark needed)

### 3 · Applications
- Autocomplete / typeahead
- Word search in grid (DFS + trie)
- Longest common prefix`,examples:["Implement trie","Word search II","Replace words"],problems:[{id:"implement-trie",title:"Implement Trie",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/implement-trie-prefix-tree/",link:"/problem/implement-trie"},{id:"word-search-ii",title:"Word Search II",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-search-ii/",link:"/problem/word-search-ii"},{id:"replace-words",title:"Replace Words",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/replace-words/",link:"/problem/replace-words"}]},{id:"union-find-pattern",name:"Union-Find (Disjoint Set)",category:"Graph",difficulty:"Medium",description:"Efficiently track connected components with union-by-rank and path compression — O(α(n)) per operation.",theory:`### 1 · Structure
parent[] array where parent[i] = i initially (self-loop). Two operations:
- **Find(x)**: follow parent pointers to root, compress path
- **Union(x,y)**: merge smaller tree under larger tree's root

### 2 · Template
\`\`\`
find(x): if parent[x] != x: parent[x] = find(parent[x]); return parent[x]
union(x,y): px, py = find(x), find(y); if rank[px] < rank[py]: swap; parent[py] = px
\`\`\`

### 3 · Applications
- Number of connected components
- Redundant connection (detect cycle)
- Accounts merge`,examples:["Number of provinces","Redundant connection","Accounts merge"],problems:[{id:"num-provinces",title:"Number of Provinces",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/number-of-provinces/",link:"/problem/num-provinces"},{id:"redundant-connection",title:"Redundant Connection",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/redundant-connection/",link:"/problem/redundant-connection"},{id:"accounts-merge",title:"Accounts Merge",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/accounts-merge/",link:"/problem/accounts-merge"}]},{id:"topological-sort-adv",name:"Topological Sort — Advanced",category:"Graph",difficulty:"Hard",description:"Kahn's algorithm and DFS-based topological ordering for dependency resolution and cycle detection in DAGs.",theory:`### Kahn's Algorithm (BFS)
1. Compute in-degree for all nodes
2. Add all zero in-degree nodes to queue
3. Process queue: for each node, reduce neighbors' in-degree; add new zeros
4. If processed count < total nodes → cycle exists

### DFS-Based
Run DFS, push node to stack after all descendants processed. Stack gives reverse topological order.`,examples:["Course schedule I & II","Alien dictionary","Parallel courses"],problems:[{id:"course-schedule",title:"Course Schedule",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/course-schedule/",link:"/problem/course-schedule"},{id:"course-schedule-ii",title:"Course Schedule II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/course-schedule-ii/",link:"/problem/course-schedule-ii"},{id:"alien-dictionary",title:"Alien Dictionary",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/alien-dictionary/",link:"/problem/alien-dictionary"}]},{id:"graph-bipartite",name:"Graph Coloring & Bipartite Check",category:"Graph",difficulty:"Medium",description:"2-color a graph with BFS/DFS to check bipartiteness — used for conflict detection and scheduling.",theory:`### Bipartite Check
Try to 2-color the graph using BFS. If any neighbor has the same color, graph is not bipartite.

### Applications
- Is graph bipartite?
- Possible bipartition (odd-length cycle detection)
- Task/exam scheduling without conflicts`,examples:["Is graph bipartite","Possible bipartition"],problems:[{id:"is-bipartite",title:"Is Graph Bipartite?",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/is-graph-bipartite/",link:"/problem/is-bipartite"},{id:"possible-bipartition",title:"Possible Bipartition",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/possible-bipartition/",link:"/problem/possible-bipartition"}]},{id:"bit-manipulation-basics",name:"Bit Manipulation Basics",category:"Bit Manipulation",difficulty:"Easy",description:"Master AND, OR, XOR, shifts, and bit masks for counting bits, finding singles, and power-of-2 checks.",theory:`### Key Operations
- n & (n-1): clears lowest set bit (count bits)
- n & (-n): isolates lowest set bit
- x ^ x = 0: XOR of identical numbers cancels
- x ^ 0 = x: identity

### Single Number
XOR all elements. Pairs cancel, leaving the single one. O(n) time, O(1) space.`,examples:["Single number","Number of 1 bits","Power of two"],problems:[{id:"single-number",title:"Single Number",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/single-number/",link:"/problem/single-number"},{id:"number-of-1-bits",title:"Number of 1 Bits",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/number-of-1-bits/",link:"/problem/number-of-1-bits"},{id:"counting-bits",title:"Counting Bits",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/counting-bits/",link:"/problem/counting-bits"}]},{id:"bit-manipulation-adv",name:"Bit Manipulation — Advanced",category:"Bit Manipulation",difficulty:"Medium",description:"XOR tricks for finding two missing numbers, subset enumeration via bitmasks, and bitwise DP.",theory:`### Two Single Numbers
XOR all → result is a^b. Find a set bit (differentiating bit). Partition numbers by that bit → XOR each group separately.

### Subset Enumeration
For n elements, iterate masks 0 to 2^n - 1. Bit i set → include element i.

### Bitwise DP
Use bitmask as DP state to represent visited/chosen subsets. Common in traveling salesman, assignment problems.`,examples:["Single number III","Subsets via bitmask","Maximum AND of pair"],problems:[{id:"single-number-iii",title:"Single Number III",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/single-number-iii/",link:"/problem/single-number-iii"},{id:"subsets-bitmask",title:"Subsets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subsets/",link:"/problem/subsets-bitmask"},{id:"reverse-bits",title:"Reverse Bits",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-bits/",link:"/problem/reverse-bits"}]},{id:"math-number-theory",name:"Math & Number Theory",category:"Math",difficulty:"Medium",description:"GCD, prime sieve, modular arithmetic, and combinatorics patterns used in competitive programming.",theory:`### GCD (Euclidean)
gcd(a,b) = gcd(b, a%b). Base: gcd(a,0) = a.

### Sieve of Eratosthenes
Mark multiples of each prime starting from 2. O(n log log n).

### Modular Arithmetic
(a+b)%m = ((a%m)+(b%m))%m. Fast power: a^n mod m in O(log n).`,examples:["Count primes","GCD of strings","Power(x,n)"],problems:[{id:"count-primes",title:"Count Primes",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-primes/",link:"/problem/count-primes"},{id:"gcd-strings",title:"Greatest Common Divisor of Strings",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/greatest-common-divisor-of-strings/",link:"/problem/gcd-strings"},{id:"pow-x-n",title:"Pow(x, n)",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/powx-n/",link:"/problem/pow-x-n"}]},{id:"matrix-traversal",name:"Matrix Traversal Patterns",category:"Matrix",difficulty:"Medium",description:"Spiral order, diagonal traversal, rotation, and layer-by-layer processing of 2D matrices.",theory:`### Spiral Traversal
Maintain four boundaries: top, bottom, left, right. Traverse top row → right col → bottom row → left col, shrinking boundaries.

### Rotate 90°
Transpose (swap [i][j] and [j][i]), then reverse each row.

### Diagonal Traversal
Group elements by i+j (same diagonal). Reverse alternating diagonals.`,examples:["Spiral matrix","Rotate image","Diagonal traverse"],problems:[{id:"spiral-matrix",title:"Spiral Matrix",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/spiral-matrix/",link:"/problem/spiral-matrix"},{id:"rotate-image",title:"Rotate Image",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/rotate-image/",link:"/problem/rotate-image"},{id:"set-matrix-zeroes",title:"Set Matrix Zeroes",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/set-matrix-zeroes/",link:"/problem/set-matrix-zeroes"}]},{id:"grid-dfs-bfs",name:"Grid DFS & BFS",category:"Matrix",difficulty:"Medium",description:"Flood fill, island counting, shortest path in grid using DFS/BFS with 4-directional movement.",theory:`### Pattern
For each unvisited cell matching criteria, start DFS/BFS exploring 4 neighbors. Mark visited. Count components or measure distances.

### BFS for Shortest Path
Use queue with (row, col, distance). First time reaching target = shortest path.

### Multi-source BFS
Add all sources to queue initially. Expand level by level. Used for "nearest" problems (01 matrix, rotting oranges).`,examples:["Number of islands","Rotting oranges","Shortest path in binary matrix"],problems:[{id:"num-islands",title:"Number of Islands",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/number-of-islands/",link:"/problem/num-islands"},{id:"rotting-oranges",title:"Rotting Oranges",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/rotting-oranges/",link:"/problem/rotting-oranges"},{id:"shortest-path-binary-matrix",title:"Shortest Path in Binary Matrix",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/shortest-path-in-binary-matrix/",link:"/problem/shortest-path-binary-matrix"}]},{id:"string-manipulation",name:"String Manipulation Patterns",category:"String",difficulty:"Medium",description:"Reverse, encode/decode, palindrome check, and string matching patterns.",theory:`### Key Patterns
- **Reverse words**: split, reverse list, join
- **Encode/Decode**: length-prefixed encoding for lists of strings
- **Palindrome check**: two pointers from both ends
- **String matching**: KMP or Rabin-Karp for O(n+m) matching`,examples:["Reverse words in a string","Valid palindrome","Longest common prefix"],problems:[{id:"reverse-words",title:"Reverse Words in a String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-words-in-a-string/",link:"/problem/reverse-words"},{id:"valid-palindrome",title:"Valid Palindrome",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome/",link:"/problem/valid-palindrome"},{id:"longest-common-prefix",title:"Longest Common Prefix",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-common-prefix/",link:"/problem/longest-common-prefix"}]}],i=[{id:"kmp-matching",name:"KMP String Matching",category:"String",difficulty:"Hard",description:"Knuth-Morris-Pratt algorithm for pattern matching in O(n+m) using a failure function (LPS array).",theory:`### Build LPS Array
LPS[i] = length of longest proper prefix of pattern[0..i] that is also a suffix. Build in O(m).

### Matching
Two pointers: i on text, j on pattern. On mismatch, j = LPS[j-1] (skip already matched). On match, advance both. Full match when j == m.`,examples:["Implement strStr","Repeated substring pattern","Shortest palindrome"],problems:[{id:"strstr",title:"Find the Index of the First Occurrence",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",link:"/problem/strstr"},{id:"repeated-substring",title:"Repeated Substring Pattern",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/repeated-substring-pattern/",link:"/problem/repeated-substring"}]},{id:"dp-knapsack-01",name:"DP — 0/1 Knapsack",category:"Dynamic Programming",difficulty:"Medium",description:"Choose items with given weights and values to maximize value within a weight capacity — the classic DP problem.",theory:`### Recurrence
dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])

### Space Optimization
Use 1D array, iterate weights in reverse to avoid overwriting needed values.

### Variants
- Subset sum (target sum possible?)
- Partition equal subset sum
- Target sum (+ and - assignments)`,examples:["Partition equal subset sum","Target sum","Last stone weight II"],problems:[{id:"partition-equal-subset",title:"Partition Equal Subset Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/partition-equal-subset-sum/",link:"/problem/partition-equal-subset"},{id:"target-sum",title:"Target Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/target-sum/",link:"/problem/target-sum"},{id:"last-stone-weight-ii",title:"Last Stone Weight II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/last-stone-weight-ii/",link:"/problem/last-stone-weight-ii"}]},{id:"dp-knapsack-unbounded",name:"DP — Unbounded Knapsack",category:"Dynamic Programming",difficulty:"Medium",description:"Items can be chosen multiple times — coin change, rod cutting, and unlimited supply problems.",theory:`### Recurrence
dp[w] = max/min over all items i: dp[w - wt[i]] + val[i]

### Key Difference from 0/1
Iterate weights forward (not reverse), allowing items to be reused.

### Coin Change Template
\`\`\`
dp = [inf] * (amount+1)
dp[0] = 0
for coin in coins:
  for a in range(coin, amount+1):
    dp[a] = min(dp[a], dp[a-coin]+1)
\`\`\``,examples:["Coin change","Coin change II (combinations)","Perfect squares"],problems:[{id:"coin-change",title:"Coin Change",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/coin-change/",link:"/problem/coin-change"},{id:"coin-change-ii",title:"Coin Change II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/coin-change-ii/",link:"/problem/coin-change-ii"},{id:"perfect-squares",title:"Perfect Squares",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/perfect-squares/",link:"/problem/perfect-squares"}]},{id:"dp-lis",name:"DP — Longest Increasing Subsequence",category:"Dynamic Programming",difficulty:"Medium",description:"Find the longest strictly increasing subsequence using DP in O(n²) or binary search in O(n log n).",theory:`### O(n²) DP
dp[i] = length of LIS ending at index i. dp[i] = max(dp[j]+1) for all j < i where arr[j] < arr[i].

### O(n log n) Patience Sort
Maintain tails array. For each element, binary search for its position in tails. Length of tails = LIS length.

### Variants
- Number of longest increasing subsequences
- Longest non-decreasing subsequence
- Maximum sum increasing subsequence`,examples:["Longest increasing subsequence","Russian doll envelopes","Longest string chain"],problems:[{id:"lis",title:"Longest Increasing Subsequence",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-increasing-subsequence/",link:"/problem/lis"},{id:"russian-doll",title:"Russian Doll Envelopes",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/russian-doll-envelopes/",link:"/problem/russian-doll"},{id:"longest-string-chain",title:"Longest String Chain",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-string-chain/",link:"/problem/longest-string-chain"}]},{id:"dp-lcs",name:"DP — Longest Common Subsequence",category:"Dynamic Programming",difficulty:"Medium",description:"Find the longest subsequence common to two strings using 2D DP — foundation for edit distance and diff algorithms.",theory:`### Recurrence
if s1[i]==s2[j]: dp[i][j] = dp[i-1][j-1]+1
else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])

### Edit Distance Variant
Insert: dp[i][j-1]+1, Delete: dp[i-1][j]+1, Replace: dp[i-1][j-1]+1.`,examples:["Longest common subsequence","Edit distance","Delete operation for two strings"],problems:[{id:"lcs",title:"Longest Common Subsequence",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-common-subsequence/",link:"/problem/lcs"},{id:"edit-distance",title:"Edit Distance",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/edit-distance/",link:"/problem/edit-distance"},{id:"min-ascii-delete",title:"Minimum ASCII Delete Sum for Two Strings",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/",link:"/problem/min-ascii-delete"}]},{id:"dp-palindrome",name:"DP — Palindrome Patterns",category:"Dynamic Programming",difficulty:"Medium",description:"Longest palindromic substring/subsequence, palindrome partitioning, and minimum insertions for palindrome.",theory:`### Longest Palindromic Substring
Expand around center for each position. O(n²). Manacher's for O(n).

### Longest Palindromic Subsequence
dp[i][j] = length of LPS of s[i..j]. If s[i]==s[j]: dp[i-1][j-1]+2. Else: max(dp[i+1][j], dp[i][j-1]).

### Palindrome Partitioning
DFS with backtracking. For each prefix that is a palindrome, recurse on suffix.`,examples:["Longest palindromic substring","Longest palindromic subsequence","Palindrome partitioning"],problems:[{id:"longest-palindromic-sub",title:"Longest Palindromic Substring",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-palindromic-substring/",link:"/problem/longest-palindromic-sub"},{id:"lps",title:"Longest Palindromic Subsequence",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-palindromic-subsequence/",link:"/problem/lps"},{id:"palindrome-partition",title:"Palindrome Partitioning",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/palindrome-partitioning/",link:"/problem/palindrome-partition"}]},{id:"dp-matrix-path",name:"DP — Matrix Path Problems",category:"Dynamic Programming",difficulty:"Medium",description:"Find unique paths, minimum cost paths, and maximum values in grid traversal using DP.",theory:`### Unique Paths
dp[i][j] = dp[i-1][j] + dp[i][j-1]. Only moving right/down. O(m*n).

### Min Path Sum
dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).

### With Obstacles
If grid[i][j] is blocked, dp[i][j] = 0.`,examples:["Unique paths","Minimum path sum","Unique paths II (with obstacles)"],problems:[{id:"unique-paths",title:"Unique Paths",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/unique-paths/",link:"/problem/unique-paths"},{id:"min-path-sum",title:"Minimum Path Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-path-sum/",link:"/problem/min-path-sum"},{id:"triangle",title:"Triangle",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/triangle/",link:"/problem/triangle"}]},{id:"dp-state-machine",name:"DP — State Machine",category:"Dynamic Programming",difficulty:"Hard",description:"Model DP transitions as state machines — best for stock trading, string editing, and game theory problems.",theory:`### Stock Trading
States: holding, not_holding, cooldown. Transitions:
- hold[i] = max(hold[i-1], rest[i-1] - price[i])
- sold[i] = hold[i-1] + price[i]
- rest[i] = max(rest[i-1], sold[i-1])

### Variants
- At most k transactions: add transaction count dimension
- With cooldown: add cooldown state
- With transaction fee: subtract fee on sell`,examples:["Best time to buy/sell stock I-IV","Best time with cooldown","Best time with transaction fee"],problems:[{id:"stock-ii",title:"Best Time to Buy and Sell Stock II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",link:"/problem/stock-ii"},{id:"stock-cooldown",title:"Best Time with Cooldown",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",link:"/problem/stock-cooldown"},{id:"stock-fee",title:"Best Time with Transaction Fee",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/",link:"/problem/stock-fee"}]},{id:"dp-word-break",name:"DP — Word Break Pattern",category:"Dynamic Programming",difficulty:"Medium",description:"Determine if a string can be segmented into dictionary words using bottom-up DP or memoized recursion.",theory:`### Template
dp[i] = true if s[0..i] can be segmented.
For each i, check all j < i: if dp[j] and s[j..i] in dict → dp[i] = true.

### Word Break II (all decompositions)
Use backtracking with memoization. Build solutions recursively and cache results.`,examples:["Word break","Word break II"],problems:[{id:"word-break",title:"Word Break",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-break/",link:"/problem/word-break"},{id:"word-break-ii",title:"Word Break II",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-break-ii/",link:"/problem/word-break-ii"}]},{id:"dp-bitmask",name:"DP — Bitmask DP",category:"Dynamic Programming",difficulty:"Hard",description:"Use bitmasks to represent subsets as DP states — solving assignment, TSP, and matching problems.",theory:`### Idea
State dp[mask] where mask is a bitmask of visited/chosen items. For n items, 2^n states.

### TSP Template
dp[mask][i] = min cost to visit cities in mask, ending at city i.
Transition: dp[mask | (1<<j)][j] = min(dp[mask][i] + dist[i][j])

### Complexity
O(2^n * n) states, each with O(n) transitions → O(2^n * n²). Feasible for n ≤ 20.`,examples:["Traveling salesman","Partition to k equal sum subsets","Shortest path visiting all nodes"],problems:[{id:"partition-k-equal",title:"Partition to K Equal Sum Subsets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/partition-to-k-equal-sum-subsets/",link:"/problem/partition-k-equal"},{id:"shortest-path-all-nodes",title:"Shortest Path Visiting All Nodes",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/shortest-path-visiting-all-nodes/",link:"/problem/shortest-path-all-nodes"}]},{id:"segment-tree",name:"Segment Tree",category:"Advanced Data Structures",difficulty:"Hard",description:"Tree structure for O(log n) range queries (sum, min, max) with point or range updates.",theory:`### Structure
Complete binary tree with 4n space. Each node stores aggregate of a range.

### Operations
- Build: O(n)
- Point update: O(log n) — update leaf, propagate up
- Range query: O(log n) — combine relevant segments
- Lazy propagation: O(log n) range updates`,examples:["Range sum query mutable","Count of smaller numbers after self"],problems:[{id:"range-sum-mutable",title:"Range Sum Query - Mutable",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/range-sum-query-mutable/",link:"/problem/range-sum-mutable"},{id:"count-smaller-after",title:"Count of Smaller Numbers After Self",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-of-smaller-numbers-after-self/",link:"/problem/count-smaller-after"}]},{id:"fenwick-tree",name:"Binary Indexed Tree (Fenwick)",category:"Advanced Data Structures",difficulty:"Hard",description:"Space-efficient O(log n) prefix sum queries and point updates — simpler to implement than segment tree.",theory:`### Operations
- Update i: add delta to i, then i += i & (-i)
- Query prefix sum [1..i]: sum, then i -= i & (-i)

### Range Sum
sum(l, r) = query(r) - query(l-1)

### Key Advantage
Simpler code than segment tree. Perfect for prefix-sum + update problems.`,examples:["Range sum query mutable","Count inversions"],problems:[{id:"range-sum-fenwick",title:"Range Sum Query - Mutable (BIT)",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/range-sum-query-mutable/",link:"/problem/range-sum-fenwick"},{id:"count-inversions",title:"Global and Local Inversions",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/global-and-local-inversions/",link:"/problem/count-inversions"}]},{id:"lru-lfu-cache",name:"LRU / LFU Cache Design",category:"Design",difficulty:"Medium",description:"Implement least-recently-used and least-frequently-used caches with O(1) get and put operations.",theory:`### LRU Cache
HashMap + Doubly Linked List. Map stores key → node. List maintains access order. On access, move to front. On eviction, remove from back.

### LFU Cache
HashMap + frequency-to-DoublyLinkedList map. Track min frequency. On access, increase freq and move node. O(1) per operation.`,examples:["LRU cache","LFU cache"],problems:[{id:"lru-cache",title:"LRU Cache",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/lru-cache/",link:"/problem/lru-cache"},{id:"lfu-cache",title:"LFU Cache",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/lfu-cache/",link:"/problem/lfu-cache"}]},{id:"design-iterator",name:"Design Iterator Patterns",category:"Design",difficulty:"Medium",description:"Implement custom iterators: flatten nested lists, zigzag, peeking — common in system design interviews.",theory:`### Flatten Nested List
Use a stack. Push elements in reverse. On next(), if top is integer return it, else flatten and push its children. Call hasNext() to prepare.

### Peeking Iterator
Cache the next element. peek() returns cache without advancing. next() returns cache and refreshes it.`,examples:["Flatten nested list iterator","Peeking iterator","Zigzag iterator"],problems:[{id:"flatten-nested-list",title:"Flatten Nested List Iterator",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/flatten-nested-list-iterator/",link:"/problem/flatten-nested-list"},{id:"peeking-iterator",title:"Peeking Iterator",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/peeking-iterator/",link:"/problem/peeking-iterator"}]},{id:"design-data-structure",name:"Design Data Structures",category:"Design",difficulty:"Hard",description:"Design Twitter, hit counter, time-based key-value store — combining multiple data structures.",theory:`### Approach
1. Identify the operations and their frequency
2. Choose data structures optimizing for the most frequent operations
3. Combine: HashMap + Heap, HashMap + TreeMap, HashMap + List

### Time-Based Key-Value Store
HashMap where each key maps to a sorted list of (timestamp, value). Binary search on get(key, timestamp).`,examples:["Design Twitter","Time-based key-value store","Design hit counter"],problems:[{id:"design-twitter",title:"Design Twitter",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/design-twitter/",link:"/problem/design-twitter"},{id:"time-based-kv",title:"Time Based Key-Value Store",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/time-based-key-value-store/",link:"/problem/time-based-kv"}]},{id:"sliding-window-variable",name:"Sliding Window — Variable Size",category:"Array & String",difficulty:"Medium",description:"Expand/shrink a window to find the smallest or largest substring/subarray meeting a condition.",theory:`### Template
\`\`\`
left = 0
for right in range(n):
  add arr[right] to window
  while window violates condition:
    remove arr[left] from window
    left++
  update answer with current window size
\`\`\`

### Key: Shrink When Invalid
Expand right to include more. Shrink left to restore validity. Answer = window at valid points.`,examples:["Minimum window substring","Smallest subarray with sum ≥ target"],problems:[{id:"min-window-substring",title:"Minimum Window Substring",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-window-substring/",link:"/problem/min-window-substring"},{id:"min-size-subarray",title:"Minimum Size Subarray Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-size-subarray-sum/",link:"/problem/min-size-subarray"}]},{id:"sliding-window-map",name:"Sliding Window with Frequency Map",category:"Array & String",difficulty:"Medium",description:"Sliding window combined with hash map for character/element frequency tracking.",theory:`### Pattern
Maintain a frequency map within the window. Track how many characters are "satisfied." When all satisfied, try to shrink. When condition breaks, expand.

### Permutation in String
Fixed-size window matching target frequency. Slide and compare frequencies.`,examples:["Permutation in string","Find all anagrams","Longest substring without repeating characters"],problems:[{id:"permutation-in-string",title:"Permutation in String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/permutation-in-string/",link:"/problem/permutation-in-string"},{id:"find-all-anagrams",title:"Find All Anagrams in a String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-all-anagrams-in-a-string/",link:"/problem/find-all-anagrams"}]},{id:"cyclic-sort",name:"Cyclic Sort",category:"Array & String",difficulty:"Easy",description:"When array contains numbers in range [1, n], place each number at its correct index to find missing/duplicate numbers.",theory:`### Algorithm
Iterate array. If arr[i] != i+1 and arr[arr[i]-1] != arr[i], swap arr[i] with arr[arr[i]-1]. After sorting, positions where arr[i] != i+1 reveal missing numbers.

### Applications
- Find missing number
- Find all duplicates
- Find first missing positive
- Set mismatch`,examples:["Find missing number","Find all duplicates","First missing positive"],problems:[{id:"missing-number",title:"Missing Number",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/missing-number/",link:"/problem/missing-number"},{id:"find-all-duplicates",title:"Find All Duplicates in an Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-all-duplicates-in-an-array/",link:"/problem/find-all-duplicates"},{id:"first-missing-positive",title:"First Missing Positive",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/first-missing-positive/",link:"/problem/first-missing-positive"}]},{id:"dutch-national-flag",name:"Dutch National Flag / 3-Way Partition",category:"Array & String",difficulty:"Medium",description:"Partition array into three groups in O(n) using three pointers — sort colors, segregate negatives/positives.",theory:`### Algorithm
Three pointers: low, mid, high. Elements before low = 0, after high = 2, between = 1.
\`\`\`
low = mid = 0, high = n-1
while mid <= high:
  if arr[mid] == 0: swap(arr[low], arr[mid]); low++; mid++
  elif arr[mid] == 1: mid++
  else: swap(arr[mid], arr[high]); high--
\`\`\``,examples:["Sort colors","Move zeroes","Segregate 0s, 1s, 2s"],problems:[{id:"sort-colors",title:"Sort Colors",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/sort-colors/",link:"/problem/sort-colors"},{id:"move-zeroes",title:"Move Zeroes",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/move-zeroes/",link:"/problem/move-zeroes"}]},{id:"reservoir-sampling",name:"Reservoir Sampling",category:"Math",difficulty:"Medium",description:"Randomly select k items from an unknown-size stream with equal probability — O(n) time, O(k) space.",theory:`### Algorithm (k=1)
Keep first item. For ith item, replace with probability 1/i. Each item has equal 1/n probability.

### General (k items)
Keep first k items. For ith item (i>k), pick random j in [0,i). If j<k, replace reservoir[j] with item[i].`,examples:["Linked list random node","Random pick index"],problems:[{id:"random-node",title:"Linked List Random Node",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/linked-list-random-node/",link:"/problem/random-node"},{id:"random-pick-index",title:"Random Pick Index",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/random-pick-index/",link:"/problem/random-pick-index"}]}],n=[{id:"mst-kruskal-prim",name:"Minimum Spanning Tree",category:"Graph",difficulty:"Hard",description:"Build minimum cost spanning tree using Kruskal's (sort edges + union-find) or Prim's (min-heap greedy) algorithm.",theory:`### Kruskal's
Sort edges by weight. Add each edge if it doesn't form a cycle (union-find). O(E log E).

### Prim's
Start from any node. Greedily add the cheapest edge connecting a new node. Use min-heap. O(E log V).`,examples:["Minimum cost to connect all points","Min cost spanning tree"],problems:[{id:"min-cost-connect",title:"Min Cost to Connect All Points",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/min-cost-to-connect-all-points/",link:"/problem/min-cost-connect"},{id:"connecting-cities",title:"Connecting Cities With Minimum Cost",difficulty:"Medium",status:"pending",link:"/problem/connecting-cities"}]},{id:"bellman-ford",name:"Bellman-Ford Algorithm",category:"Graph",difficulty:"Hard",description:"Single-source shortest paths with negative weights and negative cycle detection in O(V*E).",theory:`### Algorithm
Relax all edges V-1 times. If any edge can still be relaxed, negative cycle exists.

### When to Use
- Negative edge weights (Dijkstra fails)
- Need negative cycle detection
- Cheapest flights within K stops (run K+1 relaxations)`,examples:["Network delay time (negative weights)","Cheapest flights within K stops"],problems:[{id:"cheapest-flights-k",title:"Cheapest Flights Within K Stops",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/cheapest-flights-within-k-stops/",link:"/problem/cheapest-flights-k"}]},{id:"floyd-warshall",name:"Floyd-Warshall All-Pairs Shortest Path",category:"Graph",difficulty:"Hard",description:"Compute shortest paths between all pairs of vertices in O(V³) — used when you need the full distance matrix.",theory:`### Algorithm
For each intermediate vertex k, for each pair (i,j): dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j]).

### When to Use
- Small graphs (V ≤ 400)
- Need all pairwise distances
- Transitive closure of a graph`,examples:["Network delay (all pairs)","Find the city with fewest reachable neighbors"],problems:[{id:"find-city-threshold",title:"Find the City With the Smallest Number of Neighbors",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/",link:"/problem/find-city-threshold"}]},{id:"strongly-connected",name:"Strongly Connected Components",category:"Graph",difficulty:"Hard",description:"Find all SCCs in a directed graph using Tarjan's algorithm (single DFS) or Kosaraju's (two-pass DFS).",theory:`### Tarjan's Algorithm
DFS with discovery time and low-link values. Maintain a stack. When disc[u]==low[u], pop SCC from stack. O(V+E).

### Kosaraju's
1. Run DFS on original graph, record finish order
2. Build reverse graph
3. Run DFS on reverse graph in reverse finish order — each DFS tree = one SCC`,examples:["Critical connections in a network","Strongly connected components"],problems:[{id:"critical-connections",title:"Critical Connections in a Network",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/critical-connections-in-a-network/",link:"/problem/critical-connections"}]},{id:"monotonic-queue",name:"Monotonic Queue",category:"Stack & Queue",difficulty:"Hard",description:"A deque maintaining monotonic order for O(1) min/max queries in sliding windows.",theory:`### Pattern
For sliding window maximum: maintain a decreasing deque of indices. Front = max. On slide, pop front if out of window. On new element, pop all smaller from back.

### Complexity
Each element enters and leaves deque at most once → O(n) total.`,examples:["Sliding window maximum","Longest subarray with limit"],problems:[{id:"max-sliding-window",title:"Sliding Window Maximum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sliding-window-maximum/",link:"/problem/max-sliding-window"},{id:"longest-subarray-limit",title:"Longest Continuous Subarray With Absolute Diff ≤ Limit",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/",link:"/problem/longest-subarray-limit"}]},{id:"calculator-pattern",name:"Basic Calculator / Expression Evaluation",category:"Stack & Queue",difficulty:"Hard",description:"Parse and evaluate mathematical expressions with +, -, *, /, and parentheses using stack-based approach.",theory:`### Approach
Use a stack for numbers and handle operators with precedence.
1. Number: accumulate digits
2. +/-: push previous result, start new
3. Parentheses: recurse or use stack to save/restore state
4. End: return sum of stack`,examples:["Basic calculator","Basic calculator II","Evaluate expression"],problems:[{id:"basic-calculator",title:"Basic Calculator",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/basic-calculator/",link:"/problem/basic-calculator"},{id:"basic-calculator-ii",title:"Basic Calculator II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/basic-calculator-ii/",link:"/problem/basic-calculator-ii"}]},{id:"digit-dp",name:"DP — Digit DP",category:"Dynamic Programming",difficulty:"Hard",description:"Count numbers in range [L, R] satisfying digit-level constraints using memoized recursion on digits.",theory:`### Framework
Process number digit by digit. State: (position, tight_bound, started, custom_state).
- tight: is current prefix equal to the bound? Limits choices.
- started: handles leading zeros.
Memoize on (pos, tight, started, custom).`,examples:["Numbers at most N given digit set","Count numbers with unique digits"],problems:[{id:"numbers-at-most",title:"Numbers At Most N Given Digit Set",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/numbers-at-most-n-given-digit-set/",link:"/problem/numbers-at-most"},{id:"count-unique-digits",title:"Count Numbers with Unique Digits",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-numbers-with-unique-digits/",link:"/problem/count-unique-digits"}]},{id:"interval-dp",name:"DP — Interval DP",category:"Dynamic Programming",difficulty:"Hard",description:"Solve problems on contiguous subarrays/substrings by combining solutions of smaller intervals.",theory:`### Template
\`\`\`
for length from 2 to n:
  for i from 0 to n-length:
    j = i + length - 1
    for k from i to j-1:  // split point
      dp[i][j] = optimize(dp[i][k] + dp[k+1][j] + cost)
\`\`\`

### Applications
- Matrix chain multiplication
- Burst balloons
- Minimum cost to merge stones`,examples:["Burst balloons","Minimum cost to merge stones","Strange printer"],problems:[{id:"burst-balloons",title:"Burst Balloons",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/burst-balloons/",link:"/problem/burst-balloons"},{id:"strange-printer",title:"Strange Printer",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/strange-printer/",link:"/problem/strange-printer"}]},{id:"tree-dp",name:"DP — Tree DP",category:"Dynamic Programming",difficulty:"Hard",description:"Dynamic programming on trees — compute optimal values for subtrees using post-order DFS.",theory:`### Pattern
For each node, compute DP values by combining children's DP values. Process leaves first (post-order).

### Examples
- House robber III: rob[node] = max(rob children, skip + rob grandchildren)
- Longest path: for each node, combine two best child paths`,examples:["House robber III","Binary tree cameras","Longest path in tree"],problems:[{id:"house-robber-iii",title:"House Robber III",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/house-robber-iii/",link:"/problem/house-robber-iii"},{id:"binary-tree-cameras",title:"Binary Tree Cameras",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-cameras/",link:"/problem/binary-tree-cameras"}]},{id:"backtrack-subsets-perms",name:"Backtracking — Subsets & Permutations",category:"Backtracking",difficulty:"Medium",description:"Generate all subsets, permutations, and combinations using systematic backtracking with pruning.",theory:`### Subsets
At each index, choose to include or exclude. Or iterate and recursively add remaining.

### Permutations
Swap current position with each remaining position, recurse, un-swap.

### With Duplicates
Sort first. Skip elements where nums[i]==nums[i-1] and i-1 was not used in current path.`,examples:["Subsets I & II","Permutations I & II","Combination sum"],problems:[{id:"subsets-bt",title:"Subsets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subsets/",link:"/problem/subsets-bt"},{id:"permutations",title:"Permutations",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/permutations/",link:"/problem/permutations"},{id:"combination-sum",title:"Combination Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/combination-sum/",link:"/problem/combination-sum"}]},{id:"backtrack-constraint",name:"Backtracking — Constraint Satisfaction",category:"Backtracking",difficulty:"Hard",description:"Solve constraint satisfaction problems like N-Queens, Sudoku, and crossword puzzles with backtracking and pruning.",theory:`### N-Queens
Place queens row by row. For each row, try each column. Check column, diagonal, anti-diagonal conflicts. Backtrack on conflict.

### Sudoku
For each empty cell, try 1-9. Validate row, column, and 3×3 box. Backtrack on conflict.

### Pruning is Critical
Without pruning, complexity is exponential. Good constraint checking makes backtracking practical.`,examples:["N-Queens","Sudoku solver","Word search"],problems:[{id:"n-queens",title:"N-Queens",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/n-queens/",link:"/problem/n-queens"},{id:"sudoku-solver",title:"Sudoku Solver",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sudoku-solver/",link:"/problem/sudoku-solver"},{id:"word-search",title:"Word Search",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-search/",link:"/problem/word-search"}]},{id:"three-sum-pattern",name:"Three Sum / K Sum",category:"Array & String",difficulty:"Medium",description:"Fix one element and use two pointers on the sorted remainder — generalizable to k-sum problems.",theory:`### Three Sum Template
Sort array. For each i, use two pointers (left=i+1, right=n-1). Skip duplicates for unique triplets.

### K Sum
Reduce to 2-sum by fixing k-2 elements with nested loops, then apply two-pointer 2-sum.`,examples:["3Sum","3Sum closest","4Sum"],problems:[{id:"three-sum",title:"3Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/3sum/",link:"/problem/three-sum"},{id:"three-sum-closest",title:"3Sum Closest",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/3sum-closest/",link:"/problem/three-sum-closest"},{id:"four-sum",title:"4Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/4sum/",link:"/problem/four-sum"}]},{id:"in-place-array",name:"In-Place Array Manipulation",category:"Array & String",difficulty:"Medium",description:"Modify arrays without extra space: remove duplicates, remove elements, and compact arrays in O(1) space.",theory:`### Read-Write Pointer
read pointer scans forward, write pointer marks valid position. Copy valid elements to write position.

### Applications
- Remove duplicates from sorted array
- Remove element
- Move zeroes (write non-zeros, fill rest with 0)`,examples:["Remove duplicates from sorted array","Remove element","Move zeroes"],problems:[{id:"remove-duplicates",title:"Remove Duplicates from Sorted Array",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/remove-duplicates-from-sorted-array/",link:"/problem/remove-duplicates"},{id:"remove-element",title:"Remove Element",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/remove-element/",link:"/problem/remove-element"}]},{id:"divide-conquer",name:"Divide and Conquer",category:"Sorting & Searching",difficulty:"Hard",description:"Divide problem into subproblems, solve recursively, combine results — merge sort, quicksort, closest pair.",theory:`### Pattern
1. Divide: split into smaller subproblems
2. Conquer: solve subproblems recursively
3. Combine: merge subproblem solutions

### Merge Sort Inversion Count
During merge step, count inversions when right element is smaller. O(n log n).

### Quick Select
Partition around pivot. If pivot is at position k, done. Otherwise recurse on correct half. O(n) average.`,examples:["Merge sort with count","Kth largest (quickselect)","Majority element"],problems:[{id:"merge-sort-count",title:"Count of Smaller Numbers After Self",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-of-smaller-numbers-after-self/",link:"/problem/merge-sort-count"},{id:"majority-element",title:"Majority Element",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/majority-element/",link:"/problem/majority-element"}]},{id:"sorting-algorithms",name:"Sorting Algorithm Patterns",category:"Sorting & Searching",difficulty:"Medium",description:"Master merge sort, quick sort, counting sort, radix sort — knowing when to use which.",theory:`### Comparison-Based (O(n log n))
- Merge sort: stable, O(n) space, great for linked lists
- Quick sort: in-place, O(log n) space, cache-friendly
- Heap sort: in-place, O(1) space, not stable

### Non-Comparison (O(n+k))
- Counting sort: when range is small
- Radix sort: for integers, sort by each digit
- Bucket sort: for uniformly distributed data`,examples:["Sort an array","Sort characters by frequency","Largest number"],problems:[{id:"sort-array",title:"Sort an Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/sort-an-array/",link:"/problem/sort-array"},{id:"sort-characters-freq",title:"Sort Characters By Frequency",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/sort-characters-by-frequency/",link:"/problem/sort-characters-freq"},{id:"largest-number",title:"Largest Number",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/largest-number/",link:"/problem/largest-number"}]},{id:"simulation-pattern",name:"Simulation Problems",category:"Math",difficulty:"Medium",description:"Implement exact rules described in the problem — game of life, robot movements, and process simulation.",theory:`### Approach
1. Read rules carefully — every detail matters
2. Implement state transitions exactly as described
3. Handle edge cases: boundaries, wrap-around, termination

### Common Patterns
- Use copy of state for simultaneous updates (Game of Life)
- Track position + direction for movement (robot simulation)
- Use encoding for in-place state transitions (0→2 for died, 1→3 for born)`,examples:["Game of Life","Robot bounded in circle","Spiral matrix"],problems:[{id:"game-of-life",title:"Game of Life",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/game-of-life/",link:"/problem/game-of-life"},{id:"robot-bounded",title:"Robot Bounded In Circle",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/robot-bounded-in-circle/",link:"/problem/robot-bounded"}]},{id:"multi-source-bfs",name:"Multi-Source BFS",category:"Graph",difficulty:"Medium",description:"Start BFS from multiple sources simultaneously — for 'nearest', 'farthest', and 'as far as possible' problems.",theory:`### Pattern
Add all source nodes to queue at level 0. Process level by level. First visit to any cell = shortest distance from nearest source.

### Applications
- 01 Matrix: distance from each cell to nearest 0
- Walls and Gates: distance from each room to nearest gate
- Rotting Oranges: time for all oranges to rot
- As Far from Land as Possible: max distance from any water cell to nearest land`,examples:["01 Matrix","Walls and gates","As far from land as possible"],problems:[{id:"01-matrix",title:"01 Matrix",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/01-matrix/",link:"/problem/01-matrix"},{id:"as-far-land",title:"As Far from Land as Possible",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/as-far-from-land-as-possible/",link:"/problem/as-far-land"}]}],r=[{id:"sw-fixed-size",name:"Sliding Window — Fixed Size",category:"Array · Sliding Window",difficulty:"Easy",description:"Maintain a window of exactly size k. Slide it one position at a time, updating the aggregate (sum, max, count) in O(1) per step.",theory:`
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
`,examples:["Maximum sum of subarray of size k","First negative in every window of size k","Count distinct elements in every window of size k"],problems:[{id:"max-avg-subarray",title:"Maximum Average Subarray I",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-average-subarray-i/",link:"/problem/max-avg-subarray"},{id:"max-sum-distinct-k",title:"Maximum Sum of Distinct Subarrays With Length K",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/",link:"/problem/max-sum-distinct-k"},{id:"grumpy-bookstore",title:"Grumpy Bookstore Owner",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/grumpy-bookstore-owner/",link:"/problem/grumpy-bookstore"},{id:"max-points-from-cards",title:"Maximum Points You Can Obtain from Cards",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/",link:"/problem/max-points-from-cards"}]},{id:"sw-variable-expand-shrink",name:"Sliding Window — Variable (Expand–Shrink)",category:"Array · Sliding Window",difficulty:"Medium",description:"Grow the right pointer to include more elements; shrink the left pointer when a constraint breaks. Finds the longest/shortest subarray meeting a condition.",theory:`
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
`,examples:["Longest substring without repeating characters","Minimum size subarray sum ≥ target","Longest subarray with at most k distinct","Fruits into baskets (at most 2 types)"],problems:[{id:"longest-substr-no-repeat",title:"Longest Substring Without Repeating Characters",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-substring-without-repeating-characters/",link:"/problem/longest-substr-no-repeat"},{id:"min-size-subarray-sum",title:"Minimum Size Subarray Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-size-subarray-sum/",link:"/problem/min-size-subarray-sum"},{id:"fruits-into-baskets",title:"Fruit Into Baskets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/fruit-into-baskets/",link:"/problem/fruits-into-baskets"},{id:"longest-repeating-char-replace",title:"Longest Repeating Character Replacement",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-repeating-character-replacement/",link:"/problem/longest-repeating-char-replace"},{id:"max-consecutive-ones-iii",title:"Max Consecutive Ones III",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/max-consecutive-ones-iii/",link:"/problem/max-consecutive-ones-iii"}]},{id:"sw-monotonic-window",name:"Sliding Window — Monotonic Window",category:"Array · Sliding Window",difficulty:"Hard",description:"Combine a sliding window with a monotonic deque to track the running min/max inside the window in O(1) amortized per step.",theory:`
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
`,examples:["Sliding window maximum","Longest subarray with absolute diff ≤ limit","Jump game VI (DP + monotonic deque)"],problems:[{id:"sw-maximum",title:"Sliding Window Maximum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sliding-window-maximum/",link:"/problem/sw-maximum"},{id:"longest-subarray-abs-diff",title:"Longest Subarray With Absolute Diff ≤ Limit",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/",link:"/problem/longest-subarray-abs-diff"},{id:"jump-game-vi",title:"Jump Game VI",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/jump-game-vi/",link:"/problem/jump-game-vi"},{id:"shortest-subarray-sum-k",title:"Shortest Subarray with Sum at Least K",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/",link:"/problem/shortest-subarray-sum-k"}]},{id:"tp-opposite-ends",name:"Two Pointer — Opposite Ends",category:"Array · Two Pointer",difficulty:"Easy",description:"Start one pointer at the beginning and one at the end, move them toward each other based on a condition — ideal for sorted arrays and pair problems.",theory:`
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
`,examples:["Two sum II (sorted input)","Container with most water","Trapping rain water","Valid palindrome"],problems:[{id:"two-sum-sorted",title:"Two Sum II - Sorted",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",link:"/problem/two-sum-sorted"},{id:"container-most-water",title:"Container With Most Water",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/container-with-most-water/",link:"/problem/container-most-water"},{id:"trapping-rain-tp",title:"Trapping Rain Water",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/trapping-rain-water/",link:"/problem/trapping-rain-tp"},{id:"valid-palindrome-tp",title:"Valid Palindrome",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome/",link:"/problem/valid-palindrome-tp"}]},{id:"tp-fast-slow",name:"Two Pointer — Fast & Slow",category:"Array · Two Pointer",difficulty:"Medium",description:"Both pointers start at the same end and move in the same direction at different speeds — used for cycle detection, in-place removal, and partitioning.",theory:`
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
`,examples:["Linked list cycle detection","Remove duplicates from sorted array","Move zeroes","Middle of the linked list"],problems:[{id:"linked-list-cycle-fs",title:"Linked List Cycle",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/linked-list-cycle/",link:"/problem/linked-list-cycle-fs"},{id:"remove-dups-sorted-fs",title:"Remove Duplicates from Sorted Array",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/remove-duplicates-from-sorted-array/",link:"/problem/remove-dups-sorted-fs"},{id:"move-zeroes-fs",title:"Move Zeroes",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/move-zeroes/",link:"/problem/move-zeroes-fs"},{id:"middle-linked-list",title:"Middle of the Linked List",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/middle-of-the-linked-list/",link:"/problem/middle-linked-list"},{id:"happy-number-fs",title:"Happy Number",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/happy-number/",link:"/problem/happy-number-fs"}]},{id:"tp-partition-dutch-flag",name:"Two Pointer — Partition / Dutch Flag",category:"Array · Two Pointer",difficulty:"Medium",description:"Partition an array into 2 or 3 groups in-place using pointer boundaries — the foundation of quicksort's partition step.",theory:`
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
`,examples:["Sort Colors","Move all negatives to one side","Quicksort partition step"],problems:[{id:"sort-colors-dnf",title:"Sort Colors",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/sort-colors/",link:"/problem/sort-colors-dnf"},{id:"sort-array-parity",title:"Sort Array By Parity",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/sort-array-by-parity/",link:"/problem/sort-array-parity"},{id:"wiggle-sort-ii",title:"Wiggle Sort II",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/wiggle-sort-ii/",link:"/problem/wiggle-sort-ii"}]},{id:"prefix-sum-array",name:"Prefix Sum",category:"Array · Prefix Based",difficulty:"Easy",description:"Precompute cumulative sums so any range sum query [l, r] can be answered in O(1). Combine with hash map for subarray-sum-equals-k type problems.",theory:`
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
`,examples:["Range sum query","Subarray sum equals K","Subarray sums divisible by K","Product of array except self"],problems:[{id:"subarray-sum-k-ps",title:"Subarray Sum Equals K",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subarray-sum-equals-k/",link:"/problem/subarray-sum-k-ps"},{id:"range-sum-immutable",title:"Range Sum Query - Immutable",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/range-sum-query-immutable/",link:"/problem/range-sum-immutable"},{id:"subarray-div-k",title:"Subarray Sums Divisible by K",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subarray-sums-divisible-by-k/",link:"/problem/subarray-div-k"},{id:"product-except-self-ps",title:"Product of Array Except Self",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/product-of-array-except-self/",link:"/problem/product-except-self-ps"}]},{id:"prefix-xor",name:"Prefix XOR",category:"Array · Prefix Based",difficulty:"Medium",description:"Same idea as prefix sum but using XOR — enables O(1) range XOR queries and finding subarrays with a given XOR.",theory:`
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
`,examples:["Count subarrays with XOR = k","XOR queries of a subarray","Decode XORed array"],problems:[{id:"xor-queries-subarray",title:"XOR Queries of a Subarray",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/xor-queries-of-a-subarray/",link:"/problem/xor-queries-subarray"},{id:"decode-xored-array",title:"Decode XORed Array",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/decode-xored-array/",link:"/problem/decode-xored-array"},{id:"count-triplets-xor",title:"Count Triplets That Can Form Two Arrays of Equal XOR",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-triplets-that-can-form-two-arrays-of-equal-xor/",link:"/problem/count-triplets-xor"}]},{id:"prefix-2d",name:"2D Prefix Sum",category:"Array · Prefix Based",difficulty:"Medium",description:"Extend prefix sums to matrices — precompute a 2D prefix grid to answer any sub-rectangle sum query in O(1).",theory:`
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
`,examples:["Range sum query 2D","Matrix block sum","Count square submatrices with all ones"],problems:[{id:"range-sum-2d",title:"Range Sum Query 2D - Immutable",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/range-sum-query-2d-immutable/",link:"/problem/range-sum-2d"},{id:"matrix-block-sum",title:"Matrix Block Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/matrix-block-sum/",link:"/problem/matrix-block-sum"},{id:"count-square-submatrices",title:"Count Square Submatrices With All Ones",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-square-submatrices-with-all-ones/",link:"/problem/count-square-submatrices"}]},{id:"kadane-max-sum",name:"Kadane's — Maximum Subarray Sum",category:"Array · Kadane's / Subarray",difficulty:"Medium",description:"Find the contiguous subarray with the largest sum in O(n) using Kadane's elegant DP-style greedy approach.",theory:`
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
`,examples:["Maximum subarray (classic Kadane's)","Maximum sum circular subarray","Max subarray sum with at most one deletion"],problems:[{id:"max-subarray-kadane",title:"Maximum Subarray",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-subarray/",link:"/problem/max-subarray-kadane"},{id:"max-sum-circular",title:"Maximum Sum Circular Subarray",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-sum-circular-subarray/",link:"/problem/max-sum-circular"},{id:"max-sum-one-deletion",title:"Maximum Subarray Sum With One Deletion",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/",link:"/problem/max-sum-one-deletion"}]},{id:"kadane-max-product",name:"Kadane's — Maximum Product Subarray",category:"Array · Kadane's / Subarray",difficulty:"Medium",description:"Track both running max AND min product (because a negative × negative = positive), updating result at each step.",theory:`
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
`,examples:["Maximum product subarray","Maximum product of three numbers"],problems:[{id:"max-product-subarray",title:"Maximum Product Subarray",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-product-subarray/",link:"/problem/max-product-subarray"},{id:"max-product-three",title:"Maximum Product of Three Numbers",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-product-of-three-numbers/",link:"/problem/max-product-three"}]},{id:"subarray-given-xor-sum",name:"Subarray with Given XOR / Sum",category:"Array · Kadane's / Subarray",difficulty:"Medium",description:"Count or find subarrays whose XOR or sum equals a target using prefix + hash map in O(n).",theory:`
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
`,examples:["Subarray sum equals K","Count subarrays with XOR = K","Contiguous array (equal 0s and 1s)","Longest subarray with sum 0"],problems:[{id:"subarray-sum-k-map",title:"Subarray Sum Equals K",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subarray-sum-equals-k/",link:"/problem/subarray-sum-k-map"},{id:"contiguous-array-map",title:"Contiguous Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/contiguous-array/",link:"/problem/contiguous-array-map"},{id:"binary-subarrays-sum",title:"Binary Subarrays With Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-subarrays-with-sum/",link:"/problem/binary-subarrays-sum"}]},{id:"bs-on-index",name:"Binary Search — On Index",category:"Array · Binary Search",difficulty:"Easy",description:"Classic binary search on a sorted array to find a target, its first/last occurrence, or the insertion point.",theory:`
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
`,examples:["Binary search in sorted array","First and last position of element","Search insert position","Search in rotated sorted array"],problems:[{id:"binary-search-idx",title:"Binary Search",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-search/",link:"/problem/binary-search-idx"},{id:"first-last-pos",title:"Find First and Last Position",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",link:"/problem/first-last-pos"},{id:"search-insert-pos",title:"Search Insert Position",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-insert-position/",link:"/problem/search-insert-pos"},{id:"search-rotated-idx",title:"Search in Rotated Sorted Array",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/search-in-rotated-sorted-array/",link:"/problem/search-rotated-idx"}]},{id:"bs-on-answer",name:"Binary Search — On Answer",category:"Array · Binary Search",difficulty:"Medium",description:"When asked to minimize the maximum or maximize the minimum, binary search the answer space and check feasibility with a greedy validator.",theory:`
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
`,examples:["Koko eating bananas","Split array largest sum","Capacity to ship packages in D days","Minimum days to make m bouquets"],problems:[{id:"koko-bananas-bs",title:"Koko Eating Bananas",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/koko-eating-bananas/",link:"/problem/koko-bananas-bs"},{id:"split-array-bs",title:"Split Array Largest Sum",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/split-array-largest-sum/",link:"/problem/split-array-bs"},{id:"capacity-ship-bs",title:"Capacity To Ship Packages Within D Days",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",link:"/problem/capacity-ship-bs"},{id:"min-days-bouquets",title:"Minimum Number of Days to Make m Bouquets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/",link:"/problem/min-days-bouquets"},{id:"aggressive-cows-bs",title:"Magnetic Force Between Two Balls",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/magnetic-force-between-two-balls/",link:"/problem/aggressive-cows-bs"}]},{id:"str-sw-no-repeat",name:"String · Longest Substring Without Repeat",category:"String · Sliding Window",difficulty:"Medium",description:"Use a sliding window with a hash set/map to find the longest substring with all unique characters.",theory:`
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
`,examples:["Longest substring without repeating characters","Longest substring with at most K distinct characters"],problems:[{id:"longest-no-repeat-str",title:"Longest Substring Without Repeating Characters",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-substring-without-repeating-characters/",link:"/problem/longest-no-repeat-str"},{id:"longest-k-distinct",title:"Longest Substring with At Most K Distinct Characters",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/",link:"/problem/longest-k-distinct"}]},{id:"str-sw-min-window",name:"String · Minimum Window Substring",category:"String · Sliding Window",difficulty:"Hard",description:"Find the smallest substring containing all characters of a target string — the classic variable-size shrink-on-valid pattern.",theory:`
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
`,examples:["Minimum window substring","Smallest window containing all characters"],problems:[{id:"min-window-substr",title:"Minimum Window Substring",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/minimum-window-substring/",link:"/problem/min-window-substr"},{id:"substring-concat-all-words",title:"Substring with Concatenation of All Words",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/substring-with-concatenation-of-all-words/",link:"/problem/substring-concat-all-words"}]},{id:"str-sw-anagram",name:"String · Anagram / Permutation in String",category:"String · Sliding Window",difficulty:"Medium",description:"Fixed-size window (size = pattern length) sliding over the text, matching character frequencies to detect anagrams.",theory:`
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
`,examples:["Find all anagrams in a string","Permutation in string"],problems:[{id:"find-anagrams-str",title:"Find All Anagrams in a String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-all-anagrams-in-a-string/",link:"/problem/find-anagrams-str"},{id:"permutation-in-str",title:"Permutation in String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/permutation-in-string/",link:"/problem/permutation-in-str"}]},{id:"str-tp-palindrome",name:"String · Palindrome Check",category:"String · Two Pointers",difficulty:"Easy",description:"Compare characters from both ends moving inward — the foundational check for palindrome-based problems.",theory:`
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
`,examples:["Valid palindrome","Valid palindrome II (at most 1 removal)","Longest palindromic substring (expand-around-center)"],problems:[{id:"valid-palindrome-str",title:"Valid Palindrome",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome/",link:"/problem/valid-palindrome-str"},{id:"valid-palindrome-ii",title:"Valid Palindrome II",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome-ii/",link:"/problem/valid-palindrome-ii"},{id:"longest-palindromic-substr",title:"Longest Palindromic Substring",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-palindromic-substring/",link:"/problem/longest-palindromic-substr"},{id:"palindromic-substrings",title:"Palindromic Substrings",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/palindromic-substrings/",link:"/problem/palindromic-substrings"}]},{id:"str-tp-reverse",name:"String · Reverse Words / Characters",category:"String · Two Pointers",difficulty:"Medium",description:"In-place string reversal using two pointers — reverse the whole string then reverse each word individually, or vice versa.",theory:`
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
`,examples:["Reverse words in a string","Reverse string","Reverse vowels of a string"],problems:[{id:"reverse-words-str",title:"Reverse Words in a String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-words-in-a-string/",link:"/problem/reverse-words-str"},{id:"reverse-string-str",title:"Reverse String",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-string/",link:"/problem/reverse-string-str"},{id:"reverse-vowels",title:"Reverse Vowels of a String",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-vowels-of-a-string/",link:"/problem/reverse-vowels"}]},{id:"str-tp-compression",name:"String · String Compression",category:"String · Two Pointers",difficulty:"Medium",description:"Use a read pointer to scan groups of consecutive identical characters and a write pointer to compress in-place.",theory:`
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
`,examples:["String compression","Count and say","Run-length encoding"],problems:[{id:"string-compression",title:"String Compression",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/string-compression/",link:"/problem/string-compression"},{id:"count-and-say",title:"Count and Say",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/count-and-say/",link:"/problem/count-and-say"}]},{id:"str-kmp",name:"String · KMP (Failure Function)",category:"String · Pattern Matching",difficulty:"Hard",description:"Knuth-Morris-Pratt achieves O(n + m) pattern matching by precomputing a failure function (LPS array) that tells how far to fall back on mismatch.",theory:`
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
`,examples:["Implement strStr() / find first occurrence","Repeated substring pattern","Shortest palindrome"],problems:[{id:"strstr-kmp",title:"Find the Index of the First Occurrence in a String",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",link:"/problem/strstr-kmp"},{id:"repeated-sub-kmp",title:"Repeated Substring Pattern",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/repeated-substring-pattern/",link:"/problem/repeated-sub-kmp"},{id:"shortest-palindrome-kmp",title:"Shortest Palindrome",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/shortest-palindrome/",link:"/problem/shortest-palindrome-kmp"}]},{id:"str-rabin-karp",name:"String · Rabin-Karp (Rolling Hash)",category:"String · Pattern Matching",difficulty:"Hard",description:"Use a rolling polynomial hash to check pattern matches in O(1) per window — O(n + m) average, great for multi-pattern search.",theory:`
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
`,examples:["Implement strStr() with rolling hash","Repeated DNA sequences","Longest duplicate substring"],problems:[{id:"repeated-dna",title:"Repeated DNA Sequences",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/repeated-dna-sequences/",link:"/problem/repeated-dna"},{id:"longest-dup-substring",title:"Longest Duplicate Substring",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-duplicate-substring/",link:"/problem/longest-dup-substring"}]},{id:"str-z-algorithm",name:"String · Z-Algorithm",category:"String · Pattern Matching",difficulty:"Hard",description:"Build a Z-array where Z[i] = length of the longest substring starting at i that matches a prefix of the string. O(n) time — a powerful alternative to KMP.",theory:`
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
`,examples:["Pattern matching using Z-array","Count distinct substrings"],problems:[{id:"str-matching-z",title:"Find the Index of the First Occurrence (Z-algo)",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",link:"/problem/str-matching-z"},{id:"sum-scores-built-strings",title:"Sum of Scores of Built Strings",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/sum-of-scores-of-built-strings/",link:"/problem/sum-scores-built-strings"}]}],a=[{id:"two-pointers",name:"Two Pointers",category:"Array & String",difficulty:"Medium",description:"A pattern where two pointers iterate through the data structure in tandem until one or both of the pointers hit a certain condition.",theory:`
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
        `,examples:["Removing duplicates from a sorted array","Checking if a string is a palindrome","Finding two numbers in a sorted array that add up to a target","Container with most water (finding max area)","Trapping rain water","Moving zeros to the end of an array"],problems:[{id:"valid-palindrome",title:"Valid Palindrome",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome/",link:"/problem/valid-palindrome"},{id:"two-sum-ii",title:"Two Sum II - Input Array Is Sorted",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",link:"/problem/two-sum-ii"},{id:"3sum",title:"3Sum",difficulty:"Medium",status:"pending",link:"/problem/3sum"},{id:"container-with-most-water",title:"Container With Most Water",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/container-with-most-water/",link:"/problem/container-with-most-water"},{id:"trapping-rain-water",title:"Trapping Rain Water",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/trapping-rain-water/",link:"/problem/trapping-rain-water"},{id:"move-zeroes",title:"Move Zeroes",difficulty:"Easy",status:"pending",link:"/problem/move-zeroes"}]},{id:"sliding-window",name:"Sliding Window",category:"Array & String",difficulty:"Medium",description:"A pattern used to perform a required operation on a specific window size of a given array or linked list.",theory:`
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
        `,examples:["Longest substring without repeating characters","Minimum size subarray sum","Longest repeating character replacement","Permutation in string"],problems:[{id:"longest-substring-without-repeating-characters",title:"Longest Substring Without Repeating Characters",difficulty:"Medium",status:"pending",link:"/problem/longest-substring"},{id:"best-time-to-buy-and-sell-stock",title:"Best Time to Buy and Sell Stock",difficulty:"Easy",status:"pending",link:"/problem/best-time-stock"},{id:"longest-repeating-character-replacement",title:"Longest Repeating Character Replacement",difficulty:"Medium",status:"pending",link:"/problem/longest-repeating-char"},{id:"minimum-window-substring",title:"Minimum Window Substring",difficulty:"Hard",status:"pending",link:"/problem/min-window-substring"}]},{id:"arrays-hashing",name:"Arrays & Hashing",category:"Array",difficulty:"Easy",description:"Foundational techniques for manipulating arrays and using hash maps for efficient lookups.",theory:"Basic array manipulation and hashing techniques are the building blocks of most complex algorithms.",examples:["Contains Duplicate","Valid Anagram","Two Sum"],problems:[{id:"contains-duplicate",title:"Contains Duplicate",difficulty:"Easy",status:"solved",link:"/problem/contains-duplicate"},{id:"valid-anagram",title:"Valid Anagram",difficulty:"Easy",status:"solved",link:"/problem/valid-anagram"},{id:"two-sum",title:"Two Sum",difficulty:"Easy",status:"solved",link:"/problem/two-sum"},{id:"group-anagrams",title:"Group Anagrams",difficulty:"Medium",status:"pending",link:"/problem/group-anagrams"},{id:"top-k-frequent-elements",title:"Top K Frequent Elements",difficulty:"Medium",status:"pending",link:"/problem/top-k-frequent"},{id:"product-of-array-except-self",title:"Product of Array Except Self",difficulty:"Medium",status:"pending",link:"/problem/product-array-except-self"}]},{id:"two-pointers-converging",name:"Two Pointers (Converging)",category:"Array & String",difficulty:"Medium",description:"Start pointers at opposite ends of a sorted structure and move them inward, eliminating half the search space at each step.",theory:`
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
        `,examples:["Finding a pair summing to a target in a sorted array","Checking if a string reads the same forwards and backwards","Maximizing area between two vertical lines","3Sum — reducing O(n³) to O(n²) by fixing one element and converging","Trapping rain water between elevation bars"],problems:[{id:"valid-palindrome",title:"Valid Palindrome",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/valid-palindrome/",link:"/problem/valid-palindrome"},{id:"two-sum-ii",title:"Two Sum II - Sorted",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",link:"/problem/two-sum-ii"},{id:"3sum",title:"3Sum",difficulty:"Medium",status:"pending",link:"/problem/3sum"},{id:"container-with-most-water",title:"Container With Most Water",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/container-with-most-water/",link:"/problem/container-with-most-water"},{id:"trapping-rain-water",title:"Trapping Rain Water",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/trapping-rain-water/",link:"/problem/trapping-rain-water"}]},{id:"fast-slow-pointers",name:"Two Pointers (Fast–Slow)",category:"Linked List",difficulty:"Medium",description:"Use two pointers moving at different speeds to detect cycles, find midpoints, or identify structural properties in linear data.",theory:`
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
        `,examples:["Detecting a cycle in a linked list without extra memory","Finding the middle node of a linked list in one pass","Checking if a linked list is a palindrome (split, reverse, compare)","Locating the duplicate number in a constrained array","Removing the Nth node from the end in a single traversal"],problems:[{id:"detect-cycle",title:"Detect Cycle in Linked List",difficulty:"Easy",status:"pending",link:"/problem/detect-cycle"},{id:"remove-nth-node-from-end",title:"Remove Nth Node From End",difficulty:"Medium",status:"pending",link:"/problem/remove-nth-node-from-end"},{id:"reorder-list",title:"Reorder List",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/reorder-list/",link:"/problem/reorder-list"},{id:"find-the-duplicate-number",title:"Find the Duplicate Number",difficulty:"Medium",status:"pending",link:"/problem/find-the-duplicate-number"},{id:"palindrome-linked-list",title:"Palindrome Linked List",difficulty:"Easy",status:"pending",link:"/problem/palindrome-linked-list"}]},{id:"monotonic-stack",name:"Monotonic Stack",category:"Stack",difficulty:"Medium",description:"Maintain a stack whose elements are always in increasing or decreasing order to answer 'next greater/smaller element' queries in O(n).",theory:`
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
        `,examples:["Finding the next greater element for every position in an array","Computing 'days until warmer temperature' in O(n)","Largest rectangle that fits inside a histogram","Stock span — consecutive days of non-higher prices","Sum of minimums across all subarrays"],problems:[{id:"next-greater-element",title:"Next Greater Element",difficulty:"Medium",status:"pending",link:"/problem/next-greater-element"},{id:"daily-temperatures",title:"Daily Temperatures",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/daily-temperatures/",link:"/problem/daily-temperatures"},{id:"largest-rectangle-in-histogram",title:"Largest Rectangle in Histogram",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/largest-rectangle-in-histogram/",link:"/problem/largest-rectangle-in-histogram"},{id:"stock-span-problem",title:"Stock Span Problem",difficulty:"Medium",status:"pending",link:"/problem/stock-span-problem"},{id:"sum-of-subarray-minimums",title:"Sum of Subarray Minimums",difficulty:"Medium",status:"pending",link:"/problem/sum-of-subarray-minimums"}]},{id:"binary-search-on-answer",name:"Binary Search on Answer",category:"Binary Search",difficulty:"Hard",description:"Instead of searching within an array, binary-search on the space of possible answers and use a feasibility check to converge on the optimal one.",theory:`
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
        `,examples:["Finding minimum eating speed to finish all banana piles in H hours","Minimizing the largest sum when splitting an array into m parts","Finding the minimum ship capacity to deliver all packages in D days","Maximizing the minimum distance between placed objects","Finding the minimum number of days to make bouquets"],problems:[{id:"koko-eating-bananas",title:"Koko Eating Bananas",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/koko-eating-bananas/",link:"/problem/koko-eating-bananas"},{id:"split-array-largest-sum",title:"Split Array Largest Sum",difficulty:"Hard",status:"pending",link:"/problem/split-array-largest-sum"},{id:"find-peak-element",title:"Find Peak Element",difficulty:"Medium",status:"pending",link:"/problem/find-peak-element"},{id:"kth-smallest-element-in-sorted-matrix",title:"Kth Smallest in Sorted Matrix",difficulty:"Medium",status:"pending",link:"/problem/kth-smallest-element-in-sorted-matrix"},{id:"median-of-two-sorted-arrays",title:"Median of Two Sorted Arrays",difficulty:"Hard",status:"pending",link:"/problem/median-of-two-sorted-arrays"}]},{id:"bfs-grid-graph",name:"BFS on Grid / Graph",category:"Graph & Matrix",difficulty:"Medium",description:"Use a queue to explore nodes level-by-level, guaranteeing shortest-path distances in unweighted graphs and grids.",theory:`
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
        `,examples:["Finding the number of islands in a 2D grid","Minimum time for all oranges to rot (multi-source BFS)","Shortest path through a binary matrix","Minimum word transformations in a dictionary (Word Ladder)","Level-order traversal of a binary tree"],problems:[{id:"number-of-connected-islands",title:"Number of Islands",difficulty:"Medium",status:"pending",link:"/problem/number-of-connected-islands"},{id:"rotten-oranges",title:"Rotten Oranges",difficulty:"Medium",status:"pending",link:"/problem/rotten-oranges"},{id:"shortest-path-in-binary-matrix",title:"Shortest Path in Binary Matrix",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/shortest-path-in-binary-matrix/",link:"/problem/shortest-path-in-binary-matrix"},{id:"word-ladder-transformation",title:"Word Ladder",difficulty:"Hard",status:"pending",link:"/problem/word-ladder-transformation"},{id:"binary-tree-level-order-traversal",title:"Binary Tree Level Order Traversal",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/binary-tree-level-order-traversal/",link:"/problem/binary-tree-level-order-traversal"}]},{id:"dp-1d",name:"1D Dynamic Programming",category:"Dynamic Programming",difficulty:"Medium",description:"Solve optimization or counting problems by defining dp[i] as a function of previous states along a single dimension.",theory:`
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
        `,examples:["Counting ways to climb stairs (Fibonacci variant)","Maximum contiguous subarray sum (Kadane's Algorithm)","Maximum robbery without triggering adjacent alarms","Minimum coins to make change for an amount","Longest increasing subsequence length"],problems:[{id:"climbing-stairs",title:"Climbing Stairs",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/climbing-stairs/",link:"/problem/climbing-stairs"},{id:"maximum-subarray",title:"Maximum Subarray",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/maximum-subarray/",link:"/problem/maximum-subarray"},{id:"house-robber",title:"House Robber",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/house-robber/",link:"/problem/house-robber"},{id:"coin-change",title:"Coin Change",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/coin-change/",link:"/problem/coin-change"},{id:"longest-increasing-subsequence",title:"Longest Increasing Subsequence",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-increasing-subsequence/",link:"/problem/longest-increasing-subsequence"}]},{id:"dp-2d",name:"2D Dynamic Programming",category:"Dynamic Programming",difficulty:"Hard",description:"Extend DP to two dimensions — dp[i][j] captures sub-problem states defined by two indices, such as grid position or item-capacity pairs.",theory:`
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
        `,examples:["Counting unique paths through a grid","Finding minimum path sum from top-left to bottom-right","0/1 Knapsack — maximize value within capacity","Matrix chain multiplication order optimization","Cherry pickup across a grid (multiple traversals)"],problems:[{id:"unique-paths",title:"Unique Paths",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/unique-paths/",link:"/problem/unique-paths"},{id:"minimum-path-sum",title:"Minimum Path Sum",difficulty:"Medium",status:"pending",link:"/problem/minimum-path-sum"},{id:"0-1-knapsack",title:"0/1 Knapsack",difficulty:"Medium",status:"pending",link:"/problem/0-1-knapsack"},{id:"coin-change",title:"Coin Change",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/coin-change/",link:"/problem/coin-change"},{id:"maximal-square",title:"Maximal Square",difficulty:"Medium",status:"pending",link:"/problem/maximal-square"}]},{id:"dp-strings",name:"DP on Strings",category:"Dynamic Programming",difficulty:"Hard",description:"Use 2D DP tables indexed by positions in two strings to solve comparison, transformation, and subsequence matching problems.",theory:`
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
        `,examples:["Finding the Longest Common Subsequence of two strings","Computing Edit Distance (minimum operations to transform one string to another)","Longest Palindromic Subsequence via LCS with reverse","Wildcard pattern matching with '?' and '*'","Checking if a string is a valid interleaving of two others"],problems:[{id:"longest-common-subsequence",title:"Longest Common Subsequence",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/longest-common-subsequence/",link:"/problem/longest-common-subsequence"},{id:"edit-distance",title:"Edit Distance",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/edit-distance/",link:"/problem/edit-distance"},{id:"longest-palindromic-subsequence",title:"Longest Palindromic Subsequence",difficulty:"Medium",status:"pending",link:"/problem/longest-palindromic-subsequence"},{id:"wildcard-matching",title:"Wildcard Matching",difficulty:"Hard",status:"pending",link:"/problem/wildcard-matching"},{id:"interleaving-string",title:"Interleaving String",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/interleaving-string/",link:"/problem/interleaving-string"}]},{id:"prefix-sum",name:"Prefix Sum",category:"Array & String",difficulty:"Easy",description:"Precompute cumulative sums so any subarray sum can be answered in O(1) after O(n) preprocessing.",theory:`
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
        `,examples:["Range sum queries in O(1)","Subarray sum equals K using hash map","2D rectangle sum queries"],problems:[{id:"subarray-sum-equals-k",title:"Subarray Sum Equals K",difficulty:"Medium",status:"pending",link:"/problem/subarray-sum-equals-k"},{id:"product-of-array-except-self",title:"Product of Array Except Self",difficulty:"Medium",status:"pending",link:"/problem/product-array-except-self"},{id:"contiguous-array",title:"Contiguous Array",difficulty:"Medium",status:"pending",link:"/problem/contiguous-array"}]},{id:"dfs-graph-tree",name:"DFS on Graph / Tree",category:"Graph & Tree",difficulty:"Medium",description:"Explore as deep as possible before backtracking. DFS is the go-to for connectivity, cycle detection, topological order, and tree traversals.",theory:`
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
        `,examples:["Tree traversals (pre/in/post order)","Connected components in a graph","Cycle detection in directed graph","Flood fill on a grid"],problems:[{id:"max-depth-of-binary-tree",title:"Max Depth of Binary Tree",difficulty:"Easy",status:"pending",link:"/problem/max-depth-of-binary-tree"},{id:"number-of-connected-islands",title:"Number of Islands",difficulty:"Medium",status:"pending",link:"/problem/number-of-connected-islands"},{id:"course-schedule",title:"Course Schedule",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/course-schedule/",link:"/problem/course-schedule"},{id:"validate-bst",title:"Validate BST",difficulty:"Medium",status:"pending",link:"/problem/validate-bst"}]},{id:"backtracking",name:"Backtracking",category:"Recursion",difficulty:"Medium",description:"Build solutions incrementally, abandoning ('backtracking') a path as soon as it violates constraints — systematic brute force with pruning.",theory:`
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
        `,examples:["Generating all permutations/combinations","N-Queens puzzle","Sudoku solver","Word search in a grid"],problems:[{id:"subsets",title:"Subsets",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/subsets/",link:"/problem/subsets"},{id:"permutations",title:"Permutations",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/permutations/",link:"/problem/permutations"},{id:"combination-sum",title:"Combination Sum",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/combination-sum/",link:"/problem/combination-sum"},{id:"n-queens",title:"N-Queens",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/n-queens/",link:"/problem/n-queens"},{id:"word-search",title:"Word Search",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-search/",link:"/problem/word-search"}]},{id:"greedy",name:"Greedy Algorithms",category:"Greedy",difficulty:"Medium",description:"Make the locally optimal choice at each step, trusting that it leads to a globally optimal solution — no backtracking needed.",theory:`
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
        `,examples:["Activity selection / interval scheduling","Jump Game — can you reach the end?","Gas station circular tour","Task scheduling with cooldown"],problems:[{id:"jump-game",title:"Jump Game",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/jump-game/",link:"/problem/jump-game"},{id:"gas-station",title:"Gas Station",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/gas-station/",link:"/problem/gas-station"},{id:"task-scheduler",title:"Task Scheduler",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/task-scheduler/",link:"/problem/task-scheduler"},{id:"merge-intervals",title:"Merge Intervals",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-intervals/",link:"/problem/merge-intervals"}]},{id:"topological-sort",name:"Topological Sort",category:"Graph",difficulty:"Medium",description:"Order nodes of a DAG so every edge u→v has u before v. Essential for dependency resolution, build systems, and course scheduling.",theory:`
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
        `,examples:["Course prerequisite ordering","Build system dependency resolution","Alien dictionary character ordering"],problems:[{id:"course-schedule",title:"Course Schedule",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/course-schedule/",link:"/problem/course-schedule"},{id:"course-schedule-ii",title:"Course Schedule II",difficulty:"Medium",status:"pending",link:"/problem/course-schedule-ii"},{id:"alien-dictionary",title:"Alien Dictionary",difficulty:"Hard",status:"pending",link:"/problem/alien-dictionary"}]},{id:"union-find",name:"Union Find (Disjoint Set)",category:"Graph",difficulty:"Medium",description:"Track connected components dynamically using union and find operations with near-O(1) amortized performance via path compression and union by rank.",theory:`
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
        `,examples:["Dynamic connectivity queries","Kruskal's MST edge processing","Cycle detection in undirected graph","Merging accounts by email"],problems:[{id:"number-of-connected-components",title:"Number of Connected Components",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",link:"/problem/number-of-connected-components"},{id:"redundant-connection",title:"Redundant Connection",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/redundant-connection/",link:"/problem/redundant-connection"},{id:"accounts-merge",title:"Accounts Merge",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/accounts-merge/",link:"/problem/accounts-merge"}]},{id:"heap-top-k",name:"Heap / Top-K",category:"Heap",difficulty:"Medium",description:"Use a heap (priority queue) to efficiently track the K largest/smallest elements, medians, or merge K sorted streams.",theory:`
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
        `,examples:["Finding the Kth largest element","Top K frequent elements","Merging K sorted lists","Running median of a data stream"],problems:[{id:"kth-largest-element",title:"Kth Largest Element",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/kth-largest-element-in-a-stream/",link:"/problem/kth-largest-element"},{id:"top-k-frequent-elements",title:"Top K Frequent Elements",difficulty:"Medium",status:"pending",link:"/problem/top-k-frequent"},{id:"merge-k-sorted-lists",title:"Merge K Sorted Lists",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-k-sorted-lists/",link:"/problem/merge-k-sorted-lists"},{id:"find-median-from-data-stream",title:"Find Median from Data Stream",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/",link:"/problem/find-median-from-data-stream"}]},{id:"merge-intervals",name:"Merge Intervals",category:"Array & Sorting",difficulty:"Medium",description:"Sort intervals by start time and merge overlapping ones in a single pass. Foundational for scheduling, calendar, and range problems.",theory:`
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
        `,examples:["Merging overlapping time slots","Inserting a new interval","Counting concurrent meetings","Removing minimum intervals to avoid overlap"],problems:[{id:"merge-intervals",title:"Merge Intervals",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/merge-intervals/",link:"/problem/merge-intervals"},{id:"insert-interval",title:"Insert Interval",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/insert-interval/",link:"/problem/insert-interval"},{id:"non-overlapping-intervals",title:"Non-overlapping Intervals",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/non-overlapping-intervals/",link:"/problem/non-overlapping-intervals"}]},{id:"cyclic-sort",name:"Cyclic Sort",category:"Array",difficulty:"Easy",description:"Place each number at its correct index in O(n) time and O(1) space — ideal for finding missing, duplicate, or out-of-place numbers in [1,n] arrays.",theory:`
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
        `,examples:["Finding the missing number in [1,n]","Finding all duplicates in O(1) space","First missing positive integer"],problems:[{id:"missing-number",title:"Missing Number",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/missing-number/",link:"/problem/missing-number"},{id:"find-all-duplicates",title:"Find All Duplicates",difficulty:"Medium",status:"pending",link:"/problem/find-all-duplicates"},{id:"first-missing-positive",title:"First Missing Positive",difficulty:"Hard",status:"pending",link:"/problem/first-missing-positive"}]},{id:"bit-manipulation",name:"Bit Manipulation",category:"Math & Bits",difficulty:"Medium",description:"Use bitwise operators (AND, OR, XOR, shifts) to solve problems in O(1) space and often O(n) time — find singles, power checks, counting bits, and more.",theory:`
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
        `,examples:["Finding the single non-duplicate element (XOR)","Checking power of 2 in O(1)","Counting set bits (Hamming weight)","Generating subsets via bitmask"],problems:[{id:"single-number",title:"Single Number",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/single-number/",link:"/problem/single-number"},{id:"number-of-1-bits",title:"Number of 1 Bits",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/number-of-1-bits/",link:"/problem/number-of-1-bits"},{id:"counting-bits",title:"Counting Bits",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/counting-bits/",link:"/problem/counting-bits"},{id:"reverse-bits",title:"Reverse Bits",difficulty:"Easy",status:"pending",leetcodeLink:"https://leetcode.com/problems/reverse-bits/",link:"/problem/reverse-bits"}]},{id:"trie",name:"Trie (Prefix Tree)",category:"Tree",difficulty:"Medium",description:"A tree-shaped data structure where each edge represents a character, enabling O(L) insert, search, and prefix-matching for strings of length L.",theory:`
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
        `,examples:["Implementing autocomplete","Word Search II with trie + backtracking","Finding longest common prefix","Spell checker with edit distance on trie"],problems:[{id:"implement-trie",title:"Implement Trie",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/implement-trie-prefix-tree/",link:"/problem/implement-trie"},{id:"word-search-ii",title:"Word Search II",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/word-search-ii/",link:"/problem/word-search-ii"},{id:"replace-words",title:"Replace Words",difficulty:"Medium",status:"pending",link:"/problem/replace-words"}]},{id:"two-heaps",name:"Two Heaps",category:"Heap",difficulty:"Hard",description:"Maintain a max-heap for the smaller half and a min-heap for the larger half to efficiently compute running medians and balanced partitions.",theory:`
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
        `,examples:["Running median of a number stream","Sliding window median","Maximizing capital with project selection"],problems:[{id:"find-median-from-data-stream",title:"Find Median from Data Stream",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/",link:"/problem/find-median-from-data-stream"},{id:"sliding-window-median",title:"Sliding Window Median",difficulty:"Hard",status:"pending",link:"/problem/sliding-window-median"}]},{id:"shortest-path",name:"Shortest Path (Dijkstra)",category:"Graph",difficulty:"Hard",description:"Find shortest paths in weighted graphs with non-negative edges using a priority queue — the workhorse of graph optimization.",theory:`
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
        `,examples:["Shortest path in a weighted network","Cheapest flights with at most K stops","Network delay time (max of shortest paths)","Path with minimum effort in a grid"],problems:[{id:"network-delay-time",title:"Network Delay Time",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/network-delay-time/",link:"/problem/network-delay-time"},{id:"cheapest-flights",title:"Cheapest Flights Within K Stops",difficulty:"Medium",status:"pending",leetcodeLink:"https://leetcode.com/problems/cheapest-flights-within-k-stops/",link:"/problem/cheapest-flights"},{id:"path-with-minimum-effort",title:"Path with Minimum Effort",difficulty:"Hard",status:"pending",leetcodeLink:"https://leetcode.com/problems/path-with-minimum-effort/",link:"/problem/path-with-minimum-effort"}]}],s=[...a,...e,...t,...i,...n,...r];export{s as d};
