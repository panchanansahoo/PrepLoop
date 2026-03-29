// ══════════════════════════════════════════════════════════════
// DSA Patterns 25–97  (extends the base 24 in dsaPatternsData.js)
// ══════════════════════════════════════════════════════════════

export const dsaPatternsExtended = [

    // ── 25 · Binary Search — Classic ──
    { id:"binary-search-classic", name:"Binary Search — Classic", category:"Binary Search", difficulty:"Easy",
      description:"Divide the search space in half each step to find a target in O(log n). The foundational technique behind dozens of harder problems.",
      theory:`### 1 · Intuition\nBinary search works on **sorted** data. Compare the middle element to the target; discard the half where the target cannot lie. Repeat until found or the range is empty.\n\n### 2 · Template\n\`\`\`\nlo, hi = 0, n-1\nwhile lo <= hi:\n  mid = lo + (hi - lo) // 2\n  if arr[mid] == target: return mid\n  elif arr[mid] < target: lo = mid + 1\n  else: hi = mid - 1\nreturn -1\n\`\`\`\n\n### 3 · When to Use\n- Sorted array, search for a value\n- Minimize/maximize answer (binary search on answer)\n- Finding boundaries (first/last occurrence)\n\n### 4 · Pitfalls\n- Off-by-one errors: use lo <= hi for closed interval\n- Integer overflow in mid: use lo + (hi - lo) / 2\n- Not applicable to unsorted data without modification`,
      examples:["Search in sorted array","First/last position of element","Square root of integer"],
      problems:[
        { id:"binary-search", title:"Binary Search", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-search/", link:"/problem/binary-search" },
        { id:"search-insert-position", title:"Search Insert Position", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/search-insert-position/", link:"/problem/search-insert-position" },
        { id:"guess-number", title:"Guess Number Higher or Lower", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/guess-number-higher-or-lower/", link:"/problem/guess-number" }
      ] },

    // ── 26 · Binary Search — Rotated Array ──
    { id:"rotated-array-search", name:"Search in Rotated Sorted Array", category:"Binary Search", difficulty:"Medium",
      description:"Apply binary search on a rotated sorted array by identifying which half is sorted, then narrowing the search accordingly.",
      theory:`### 1 · Intuition\nA rotated sorted array has two sorted halves. At each step of binary search, **one half is always sorted**. Check if the target lies in the sorted half; if yes, search there, otherwise search the other half.\n\n### 2 · Template\n\`\`\`\nlo, hi = 0, n-1\nwhile lo <= hi:\n  mid = (lo + hi) // 2\n  if arr[mid] == target: return mid\n  if arr[lo] <= arr[mid]:      // left half sorted\n    if arr[lo] <= target < arr[mid]: hi = mid - 1\n    else: lo = mid + 1\n  else:                         // right half sorted\n    if arr[mid] < target <= arr[hi]: lo = mid + 1\n    else: hi = mid - 1\n\`\`\`\n\n### 3 · Variants\n- With duplicates: worst case O(n) when lo == mid == hi\n- Find minimum in rotated array: binary search for the pivot`,
      examples:["Search in rotated sorted array","Find minimum in rotated sorted array"],
      problems:[
        { id:"search-rotated", title:"Search in Rotated Sorted Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/search-in-rotated-sorted-array/", link:"/problem/search-rotated" },
        { id:"find-min-rotated", title:"Find Minimum in Rotated Sorted Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", link:"/problem/find-min-rotated" }
      ] },

    // ── 27 · Binary Search on Answer ──
    { id:"binary-search-answer", name:"Binary Search on Answer", category:"Binary Search", difficulty:"Medium",
      description:"When asked to minimize/maximize a value, binary search the answer space and check feasibility with a greedy or simulation function.",
      theory:`### 1 · Intuition\nInstead of searching an array, search the **answer space** [lo, hi]. For each candidate answer mid, check if it's feasible. Use the feasibility to shrink the range.\n\n### 2 · Template\n\`\`\`\nlo, hi = min_possible, max_possible\nwhile lo < hi:\n  mid = (lo + hi) // 2\n  if feasible(mid): hi = mid\n  else: lo = mid + 1\nreturn lo\n\`\`\`\n\n### 3 · Classic Problems\n- Koko eating bananas (minimize speed)\n- Split array largest sum (minimize max sum)\n- Capacity to ship packages within D days`,
      examples:["Koko eating bananas","Split array largest sum","Ship packages in D days"],
      problems:[
        { id:"koko-bananas", title:"Koko Eating Bananas", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/koko-eating-bananas/", link:"/problem/koko-bananas" },
        { id:"split-array-largest-sum", title:"Split Array Largest Sum", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/split-array-largest-sum/", link:"/problem/split-array-largest-sum" },
        { id:"capacity-to-ship", title:"Capacity To Ship Packages", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/", link:"/problem/capacity-to-ship" }
      ] },

    // ── 28 · Binary Search — 2D Matrix ──
    { id:"search-2d-matrix", name:"Search a 2D Matrix", category:"Binary Search", difficulty:"Medium",
      description:"Treat a row-sorted or fully-sorted matrix as a virtual 1D array and apply binary search in O(log(m*n)).",
      theory:`### 1 · Intuition\nIf each row is sorted and the first element of each row > last element of previous row, the matrix is effectively a sorted 1D array. Map index i to row=i/cols, col=i%cols.\n\n### 2 · Variant — Search Matrix II\nRows sorted left-to-right, columns sorted top-to-bottom (not fully sorted). Start from top-right corner: if target < current, move left; if target > current, move down. O(m+n).`,
      examples:["Search 2D matrix","Search matrix II (staircase search)"],
      problems:[
        { id:"search-2d-matrix", title:"Search a 2D Matrix", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/search-a-2d-matrix/", link:"/problem/search-2d-matrix" },
        { id:"search-2d-matrix-ii", title:"Search a 2D Matrix II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/search-a-2d-matrix-ii/", link:"/problem/search-2d-matrix-ii" }
      ] },

    // ── 29 · Binary Search — Peak Element ──
    { id:"peak-element", name:"Find Peak Element", category:"Binary Search", difficulty:"Medium",
      description:"Use binary search to find a local maximum in an unsorted array by always moving towards the larger neighbor.",
      theory:`### 1 · Intuition\nA peak is an element greater than its neighbors. Even in unsorted arrays, binary search works: compare mid with mid+1. If mid < mid+1, a peak exists on the right; otherwise on the left. O(log n).\n\n### 2 · Key Insight\nThe array boundaries are -∞, so a peak always exists. We're guaranteed to find one by following the "uphill" direction.`,
      examples:["Find peak element in array","Find peak in mountain array"],
      problems:[
        { id:"find-peak-element", title:"Find Peak Element", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-peak-element/", link:"/problem/find-peak-element" },
        { id:"peak-mountain", title:"Peak Index in Mountain Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/peak-index-in-a-mountain-array/", link:"/problem/peak-mountain" }
      ] },

    // ── 30 · Binary Search — First/Last Position ──
    { id:"first-last-position", name:"First & Last Position", category:"Binary Search", difficulty:"Medium",
      description:"Use two binary searches to find the leftmost and rightmost occurrence of a target in a sorted array.",
      theory:`### 1 · Intuition\nStandard binary search finds *any* occurrence. To find the **first**, when arr[mid]==target, keep searching left (hi=mid-1) and record mid. For the **last**, keep searching right (lo=mid+1).\n\n### 2 · Template (Lower Bound)\n\`\`\`\nlo, hi, result = 0, n-1, -1\nwhile lo <= hi:\n  mid = (lo+hi)//2\n  if arr[mid] >= target: hi = mid-1; if arr[mid]==target: result=mid\n  else: lo = mid+1\nreturn result\n\`\`\``,
      examples:["First and last position of element","Count occurrences in sorted array"],
      problems:[
        { id:"first-last-position", title:"Find First and Last Position", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", link:"/problem/first-last-position" },
        { id:"search-range", title:"Search Range", difficulty:"Medium", status:"pending", link:"/problem/search-range" }
      ] },

    // ── 31 · Linked List — Reversal ──
    { id:"linked-list-reversal", name:"Linked List Reversal", category:"Linked List", difficulty:"Easy",
      description:"Reverse a singly linked list iteratively or recursively — the fundamental linked list manipulation pattern.",
      theory:`### 1 · Intuition\nMaintain three pointers: prev, current, next. At each step, point current.next to prev, advance all pointers. O(n) time, O(1) space.\n\n### 2 · Iterative Template\n\`\`\`\nprev = null, curr = head\nwhile curr:\n  next = curr.next\n  curr.next = prev\n  prev = curr\n  curr = next\nreturn prev\n\`\`\`\n\n### 3 · Variants\n- Reverse between positions m and n\n- Reverse in groups of k\n- Check if palindrome (reverse second half, compare)`,
      examples:["Reverse linked list","Reverse between positions m and n","Reverse nodes in k-group"],
      problems:[
        { id:"reverse-linked-list", title:"Reverse Linked List", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/reverse-linked-list/", link:"/problem/reverse-linked-list" },
        { id:"reverse-linked-list-ii", title:"Reverse Linked List II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/reverse-linked-list-ii/", link:"/problem/reverse-linked-list-ii" },
        { id:"reverse-k-group", title:"Reverse Nodes in k-Group", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/reverse-nodes-in-k-group/", link:"/problem/reverse-k-group" }
      ] },

    // ── 32 · Linked List — Merge ──
    { id:"merge-linked-lists", name:"Merge Sorted Lists", category:"Linked List", difficulty:"Easy",
      description:"Merge two or k sorted linked lists using two-pointer comparison or a min-heap for k-way merge.",
      theory:`### 1 · Two Lists\nCompare heads, attach smaller to result, advance that pointer. O(n+m).\n\n### 2 · K Lists\nUse a min-heap of size k. Pop smallest, push its next. O(N log k) where N = total nodes.`,
      examples:["Merge two sorted lists","Merge k sorted lists"],
      problems:[
        { id:"merge-two-sorted", title:"Merge Two Sorted Lists", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/merge-two-sorted-lists/", link:"/problem/merge-two-sorted" },
        { id:"merge-k-sorted", title:"Merge k Sorted Lists", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/merge-k-sorted-lists/", link:"/problem/merge-k-sorted" }
      ] },

    // ── 33 · Linked List — Intersection & Cycle ──
    { id:"linked-list-intersection", name:"Linked List Intersection", category:"Linked List", difficulty:"Easy",
      description:"Find the intersection node of two linked lists using the two-pointer length-equalization technique.",
      theory:`### 1 · Intuition\nTwo pointers start at heads of both lists. When one reaches the end, redirect to the other list's head. They meet at the intersection (or both reach null). O(m+n) time, O(1) space.\n\n### 2 · Why It Works\nPointer A travels: a + c + b. Pointer B travels: b + c + a. Both travel the same distance, so they sync at the intersection node.`,
      examples:["Intersection of two linked lists","Linked list cycle detection"],
      problems:[
        { id:"intersection-two-lists", title:"Intersection of Two Linked Lists", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/intersection-of-two-linked-lists/", link:"/problem/intersection-two-lists" },
        { id:"remove-nth-from-end", title:"Remove Nth Node From End", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/remove-nth-node-from-end-of-list/", link:"/problem/remove-nth-from-end" }
      ] },

    // ── 34 · Linked List — Rearrangement ──
    { id:"linked-list-rearrange", name:"Linked List Rearrangement", category:"Linked List", difficulty:"Medium",
      description:"Reorder, swap, or partition linked list nodes using pointer manipulation patterns.",
      theory:`### 1 · Common Patterns\n- **Swap Pairs**: swap every two adjacent nodes\n- **Odd-Even**: group odd-indexed and even-indexed nodes\n- **Reorder List**: L1→Ln→L2→Ln-1... (find mid, reverse second half, merge)\n- **Partition**: rearrange so all nodes < x come before nodes >= x`,
      examples:["Swap nodes in pairs","Odd-even linked list","Reorder list"],
      problems:[
        { id:"swap-nodes-pairs", title:"Swap Nodes in Pairs", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/swap-nodes-in-pairs/", link:"/problem/swap-nodes-pairs" },
        { id:"odd-even-list", title:"Odd Even Linked List", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/odd-even-linked-list/", link:"/problem/odd-even-list" },
        { id:"reorder-list", title:"Reorder List", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/reorder-list/", link:"/problem/reorder-list" }
      ] },

    // ── 35 · Stack — Basics ──
    { id:"stack-basics", name:"Stack Fundamentals", category:"Stack & Queue", difficulty:"Easy",
      description:"LIFO structure for matching, nesting, and evaluation problems — parentheses, expressions, and undo operations.",
      theory:`### 1 · Core Operations\nPush O(1), Pop O(1), Peek O(1). Perfect for matching pairs and tracking state.\n\n### 2 · Classic Problems\n- **Valid Parentheses**: push openers, pop on closers, check match\n- **Min Stack**: maintain a parallel stack tracking current minimum\n- **Evaluate RPN**: push numbers, pop two on operator, push result`,
      examples:["Valid parentheses","Min stack","Evaluate reverse polish notation"],
      problems:[
        { id:"valid-parentheses", title:"Valid Parentheses", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/valid-parentheses/", link:"/problem/valid-parentheses" },
        { id:"min-stack", title:"Min Stack", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/min-stack/", link:"/problem/min-stack" },
        { id:"eval-rpn", title:"Evaluate Reverse Polish Notation", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/evaluate-reverse-polish-notation/", link:"/problem/eval-rpn" }
      ] },

    // ── 36 · Queue & Deque ──
    { id:"queue-deque", name:"Queue & Deque Patterns", category:"Stack & Queue", difficulty:"Medium",
      description:"FIFO structures and double-ended queues for BFS, sliding window maximum, and task scheduling.",
      theory:`### 1 · Queue Uses\nBFS traversal, task scheduling (round-robin), recent counter.\n\n### 2 · Deque\nAdd/remove from both ends in O(1). Key pattern: **sliding window maximum** — maintain a monotonic decreasing deque of indices.\n\n### 3 · Implement Queue using Stacks\nTwo stacks: push to stack1, pop by transferring to stack2 when stack2 is empty. Amortized O(1).`,
      examples:["Implement queue using stacks","Sliding window maximum","Task scheduler"],
      problems:[
        { id:"queue-using-stacks", title:"Implement Queue using Stacks", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/implement-queue-using-stacks/", link:"/problem/queue-using-stacks" },
        { id:"sliding-window-max", title:"Sliding Window Maximum", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/sliding-window-maximum/", link:"/problem/sliding-window-max" },
        { id:"task-scheduler", title:"Task Scheduler", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/task-scheduler/", link:"/problem/task-scheduler" }
      ] },

    // ── 37 · Monotonic Stack ──
    { id:"monotonic-stack-pattern", name:"Monotonic Stack", category:"Stack & Queue", difficulty:"Medium",
      description:"Maintain a stack in sorted order to find the next greater/smaller element for each position in O(n).",
      theory:`### 1 · Intuition\nProcess elements and maintain a stack that is always increasing or decreasing. When a new element violates the order, pop elements — each popped element has found its "next greater/smaller."\n\n### 2 · Template (Next Greater Element)\n\`\`\`\nresult = [-1] * n\nstack = []\nfor i in range(n):\n  while stack and arr[i] > arr[stack[-1]]:\n    result[stack.pop()] = arr[i]\n  stack.append(i)\n\`\`\`\n\n### 3 · Applications\n- Next greater element (I, II, circular)\n- Daily temperatures\n- Largest rectangle in histogram\n- Trapping rain water`,
      examples:["Next greater element","Daily temperatures","Largest rectangle in histogram"],
      problems:[
        { id:"daily-temperatures", title:"Daily Temperatures", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/daily-temperatures/", link:"/problem/daily-temperatures" },
        { id:"next-greater-element", title:"Next Greater Element I", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/next-greater-element-i/", link:"/problem/next-greater-element" },
        { id:"largest-rectangle-histogram", title:"Largest Rectangle in Histogram", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/largest-rectangle-in-histogram/", link:"/problem/largest-rectangle-histogram" },
        { id:"trapping-rain-water", title:"Trapping Rain Water", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/trapping-rain-water/", link:"/problem/trapping-rain-water" }
      ] },

    // ── 38 · Tree Traversals ──
    { id:"tree-traversals", name:"Tree Traversal Patterns", category:"Tree", difficulty:"Medium",
      description:"Master inorder, preorder, postorder (iterative), level-order, and zigzag traversals of binary trees.",
      theory:`### 1 · Traversal Orders\n- **Inorder** (Left, Root, Right) — gives sorted order for BST\n- **Preorder** (Root, Left, Right) — useful for serialization\n- **Postorder** (Left, Right, Root) — useful for deletion, calculating subtree values\n- **Level-order** — BFS with queue\n\n### 2 · Iterative Inorder Template\n\`\`\`\nstack = []\ncurr = root\nwhile curr or stack:\n  while curr:\n    stack.append(curr)\n    curr = curr.left\n  curr = stack.pop()\n  visit(curr)\n  curr = curr.right\n\`\`\``,
      examples:["Iterative inorder traversal","Zigzag level order","Right side view of binary tree"],
      problems:[
        { id:"inorder-traversal", title:"Binary Tree Inorder Traversal", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-tree-inorder-traversal/", link:"/problem/inorder-traversal" },
        { id:"zigzag-level-order", title:"Zigzag Level Order Traversal", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/", link:"/problem/zigzag-level-order" },
        { id:"right-side-view", title:"Binary Tree Right Side View", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-tree-right-side-view/", link:"/problem/right-side-view" }
      ] },

    // ── 39 · BST Operations ──
    { id:"bst-operations", name:"BST Operations", category:"Tree", difficulty:"Medium",
      description:"Leverage the BST property (left < root < right) for validation, search, insertion, and kth smallest element.",
      theory:`### 1 · Key Property\nFor every node: all left subtree values < node.val < all right subtree values.\n\n### 2 · Validate BST\nPass valid range (min, max) down recursively. Each node must be within its range.\n\n### 3 · Kth Smallest\nInorder traversal visits nodes in sorted order. Count to k during traversal.\n\n### 4 · LCA in BST\nIf both values < root, go left. If both > root, go right. Otherwise, root is the LCA. O(h).`,
      examples:["Validate binary search tree","Kth smallest element in BST","Lowest common ancestor of BST"],
      problems:[
        { id:"validate-bst", title:"Validate Binary Search Tree", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/validate-binary-search-tree/", link:"/problem/validate-bst" },
        { id:"kth-smallest-bst", title:"Kth Smallest Element in BST", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/kth-smallest-element-in-a-bst/", link:"/problem/kth-smallest-bst" },
        { id:"lca-bst", title:"Lowest Common Ancestor of BST", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", link:"/problem/lca-bst" }
      ] },

    // ── 40 · Tree Construction ──
    { id:"tree-construction", name:"Tree Construction & Serialization", category:"Tree", difficulty:"Medium",
      description:"Build trees from traversal sequences, serialize/deserialize trees, and flatten trees to linked lists.",
      theory:`### 1 · Build from Preorder + Inorder\nPreorder first element = root. Find root in inorder → left of it = left subtree, right = right subtree. Recurse.\n\n### 2 · Serialize / Deserialize\nBFS or preorder with null markers. Deserialize by reading tokens in order.\n\n### 3 · Flatten to Linked List\nModified preorder: for each node, flatten left subtree, insert between node and right subtree.`,
      examples:["Construct tree from preorder and inorder","Serialize and deserialize binary tree","Flatten binary tree to linked list"],
      problems:[
        { id:"build-tree-preorder-inorder", title:"Construct Binary Tree from Preorder and Inorder", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", link:"/problem/build-tree-preorder-inorder" },
        { id:"serialize-deserialize", title:"Serialize and Deserialize Binary Tree", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", link:"/problem/serialize-deserialize" },
        { id:"flatten-tree", title:"Flatten Binary Tree to Linked List", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/flatten-binary-tree-to-linked-list/", link:"/problem/flatten-tree" }
      ] },
];
