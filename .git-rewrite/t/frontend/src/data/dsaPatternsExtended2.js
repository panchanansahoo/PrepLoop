// ══════════════════════════════════════════════════════════════
// DSA Patterns 41–60
// ══════════════════════════════════════════════════════════════

export const dsaPatternsExtended2 = [

    // ── 41 · Lowest Common Ancestor ──
    { id:"lca-binary-tree", name:"Lowest Common Ancestor (Binary Tree)", category:"Tree", difficulty:"Medium",
      description:"Find the deepest node that is an ancestor of both target nodes using post-order recursion.",
      theory:`### Intuition\nRecurse left and right. If both return non-null, current node is the LCA. If only one side returns non-null, propagate that result upward. Base case: node is null or matches p or q.`,
      examples:["LCA of a binary tree","LCA with parent pointers"],
      problems:[
        { id:"lca-bt", title:"Lowest Common Ancestor of a Binary Tree", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", link:"/problem/lca-bt" },
        { id:"lca-deepest-leaves", title:"LCA of Deepest Leaves", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/lowest-common-ancestor-of-deepest-leaves/", link:"/problem/lca-deepest-leaves" }
      ] },

    // ── 42 · Tree Diameter & Path Sum ──
    { id:"tree-diameter-path", name:"Tree Diameter & Path Sum", category:"Tree", difficulty:"Medium",
      description:"Calculate the diameter of a tree and find maximum path sums using post-order DFS.",
      theory:`### Diameter\nFor each node, diameter through it = left_height + right_height. Track global max. O(n).\n\n### Max Path Sum\nSimilar but track max sum through each node. A path can "turn" at any node. Return max single-arm to parent.`,
      examples:["Diameter of binary tree","Binary tree maximum path sum","Path sum I, II, III"],
      problems:[
        { id:"diameter-bt", title:"Diameter of Binary Tree", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/diameter-of-binary-tree/", link:"/problem/diameter-bt" },
        { id:"max-path-sum", title:"Binary Tree Maximum Path Sum", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-tree-maximum-path-sum/", link:"/problem/max-path-sum" },
        { id:"path-sum-iii", title:"Path Sum III", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/path-sum-iii/", link:"/problem/path-sum-iii" }
      ] },

    // ── 43 · Heap / Priority Queue ──
    { id:"heap-priority-queue", name:"Heap / Priority Queue", category:"Heap", difficulty:"Medium",
      description:"Use min-heap and max-heap to efficiently access min/max elements — essential for top-k, merge, and scheduling.",
      theory:`### 1 · Operations\n- Insert: O(log n), Extract-min/max: O(log n), Peek: O(1)\n\n### 2 · Top K Pattern\nMaintain a min-heap of size k. If new element > heap top, pop and push. Final heap = top k elements.\n\n### 3 · K-Way Merge\nPush first element from each list into min-heap. Pop smallest, push next from its list. O(N log k).`,
      examples:["Kth largest element","Top k frequent elements","Find median from data stream"],
      problems:[
        { id:"kth-largest", title:"Kth Largest Element in an Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/kth-largest-element-in-an-array/", link:"/problem/kth-largest" },
        { id:"top-k-frequent", title:"Top K Frequent Elements", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/top-k-frequent-elements/", link:"/problem/top-k-frequent" },
        { id:"find-median-stream", title:"Find Median from Data Stream", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/", link:"/problem/find-median-stream" }
      ] },

    // ── 44 · Two Heaps ──
    { id:"two-heaps", name:"Two Heaps Pattern", category:"Heap", difficulty:"Hard",
      description:"Use a max-heap for the lower half and min-heap for the upper half to maintain a running median or balanced partition.",
      theory:`### Intuition\nSplit numbers into two halves: smaller half in max-heap, larger half in min-heap. Balance sizes so they differ by at most 1. Median = top of the larger heap, or average of both tops if equal sizes.\n\n### Template\n\`\`\`\nadd(num):\n  maxHeap.push(num)\n  minHeap.push(maxHeap.pop())\n  if len(minHeap) > len(maxHeap):\n    maxHeap.push(minHeap.pop())\n\`\`\``,
      examples:["Find median from data stream","Sliding window median"],
      problems:[
        { id:"find-median", title:"Find Median from Data Stream", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-median-from-data-stream/", link:"/problem/find-median" },
        { id:"sliding-window-median", title:"Sliding Window Median", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/sliding-window-median/", link:"/problem/sliding-window-median" }
      ] },

    // ── 45 · Intervals — Merge & Insert ──
    { id:"interval-merge", name:"Interval Merge & Insert", category:"Intervals", difficulty:"Medium",
      description:"Sort intervals by start time and merge overlapping ones. Insert new intervals by finding overlap boundaries.",
      theory:`### Merge Intervals\nSort by start. Iterate: if current overlaps with last merged, extend end. Otherwise, add new interval. O(n log n).\n\n### Insert Interval\nThree phases: add all intervals ending before new one, merge all overlapping, add all remaining.`,
      examples:["Merge intervals","Insert interval","Meeting rooms"],
      problems:[
        { id:"merge-intervals", title:"Merge Intervals", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/merge-intervals/", link:"/problem/merge-intervals" },
        { id:"insert-interval", title:"Insert Interval", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/insert-interval/", link:"/problem/insert-interval" },
        { id:"meeting-rooms-ii", title:"Meeting Rooms II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/meeting-rooms-ii/", link:"/problem/meeting-rooms-ii" }
      ] },

    // ── 46 · Intervals — Non-Overlapping ──
    { id:"interval-scheduling", name:"Interval Scheduling & Minimum Removal", category:"Intervals", difficulty:"Medium",
      description:"Greedy selection of maximum non-overlapping intervals — the classic activity selection / minimum removal problem.",
      theory:`### Intuition\nSort by end time. Greedily select intervals that end earliest and don't overlap the last selected. The number removed = total - selected.\n\n### Why End Time?\nChoosing the earliest-ending interval leaves maximum room for future intervals.`,
      examples:["Non-overlapping intervals","Minimum arrows to burst balloons"],
      problems:[
        { id:"non-overlapping", title:"Non-overlapping Intervals", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/non-overlapping-intervals/", link:"/problem/non-overlapping" },
        { id:"burst-balloons-arrows", title:"Minimum Number of Arrows to Burst Balloons", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/", link:"/problem/burst-balloons-arrows" }
      ] },

    // ── 47 · Greedy — Basics ──
    { id:"greedy-basics", name:"Greedy Fundamentals", category:"Greedy", difficulty:"Medium",
      description:"Make locally optimal choices at each step to reach a globally optimal solution — when greedy works and how to prove it.",
      theory:`### When Greedy Works\n1. **Optimal substructure**: optimal solution contains optimal sub-solutions\n2. **Greedy choice property**: locally optimal choices lead to globally optimal\n\n### Proof Techniques\n- Exchange argument: show swapping any choice with the greedy choice doesn't worsen the solution\n- Stays-ahead argument: show greedy stays at least as good at every step`,
      examples:["Jump game I & II","Gas station","Assign cookies"],
      problems:[
        { id:"jump-game", title:"Jump Game", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/jump-game/", link:"/problem/jump-game" },
        { id:"jump-game-ii", title:"Jump Game II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/jump-game-ii/", link:"/problem/jump-game-ii" },
        { id:"gas-station", title:"Gas Station", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/gas-station/", link:"/problem/gas-station" }
      ] },

    // ── 48 · Greedy — Partitioning ──
    { id:"greedy-partition", name:"Greedy Partitioning", category:"Greedy", difficulty:"Medium",
      description:"Partition strings or arrays into minimum segments using greedy tracking of last occurrences or constraints.",
      theory:`### Partition Labels\nFor each character, track its last occurrence. Extend the current partition to include the farthest last occurrence. When current index == partition end, cut.\n\n### Hand of Straights\nSort, use a map to greedily form groups of consecutive numbers.`,
      examples:["Partition labels","Hand of straights","Reorganize string"],
      problems:[
        { id:"partition-labels", title:"Partition Labels", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/partition-labels/", link:"/problem/partition-labels" },
        { id:"hand-of-straights", title:"Hand of Straights", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/hand-of-straights/", link:"/problem/hand-of-straights" },
        { id:"reorganize-string", title:"Reorganize String", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/reorganize-string/", link:"/problem/reorganize-string" }
      ] },

    // ── 49 · Hash Map Counting ──
    { id:"hashmap-counting", name:"Hash Map Counting Patterns", category:"Hash Map", difficulty:"Easy",
      description:"Use hash maps for frequency counting, anagram detection, grouping, and subarray sum problems.",
      theory:`### 1 · Frequency Count\nCount occurrences of elements. O(n) time, O(k) space where k = unique elements.\n\n### 2 · Anagram Detection\nTwo strings are anagrams if their frequency maps match. Group anagrams by sorted key or frequency signature.\n\n### 3 · Two Sum Pattern\nStore complement (target - num) in map. On each number, check if its complement exists. O(n).`,
      examples:["Two sum","Group anagrams","Valid anagram","Ransom note"],
      problems:[
        { id:"two-sum", title:"Two Sum", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/two-sum/", link:"/problem/two-sum" },
        { id:"group-anagrams", title:"Group Anagrams", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/group-anagrams/", link:"/problem/group-anagrams" },
        { id:"ransom-note", title:"Ransom Note", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/ransom-note/", link:"/problem/ransom-note" }
      ] },

    // ── 50 · Prefix Sum ──
    { id:"prefix-sum", name:"Prefix Sum", category:"Hash Map", difficulty:"Medium",
      description:"Precompute cumulative sums to answer range sum queries in O(1) and find subarrays with target sum using hash maps.",
      theory:`### 1 · Build\nprefix[i] = sum(arr[0..i]). Range sum [l, r] = prefix[r] - prefix[l-1]. O(n) precompute, O(1) query.\n\n### 2 · Subarray Sum Equals K\nStore prefix sum frequencies in a hash map. For each prefix[i], check if prefix[i] - k exists. O(n).\n\n### 3 · 2D Prefix Sum\nprefix[i][j] = sum of rectangle from (0,0) to (i,j). Use inclusion-exclusion for sub-rectangle queries.`,
      examples:["Subarray sum equals k","Range sum query","Contiguous array (equal 0s and 1s)"],
      problems:[
        { id:"subarray-sum-k", title:"Subarray Sum Equals K", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/subarray-sum-equals-k/", link:"/problem/subarray-sum-k" },
        { id:"range-sum-query", title:"Range Sum Query - Immutable", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/range-sum-query-immutable/", link:"/problem/range-sum-query" },
        { id:"contiguous-array", title:"Contiguous Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/contiguous-array/", link:"/problem/contiguous-array" }
      ] },

    // ── 51 · Trie ──
    { id:"trie-pattern", name:"Trie (Prefix Tree)", category:"Trie", difficulty:"Medium",
      description:"A tree-like data structure for efficient prefix matching, autocomplete, and word search in O(L) per operation.",
      theory:`### 1 · Structure\nEach node has up to 26 children (for lowercase English). A boolean marks word endings.\n\n### 2 · Operations\n- **Insert**: traverse/create nodes for each character, mark last as word end\n- **Search**: traverse nodes, return true if end is reached and marked\n- **StartsWith**: traverse nodes, return true if path exists (no end-mark needed)\n\n### 3 · Applications\n- Autocomplete / typeahead\n- Word search in grid (DFS + trie)\n- Longest common prefix`,
      examples:["Implement trie","Word search II","Replace words"],
      problems:[
        { id:"implement-trie", title:"Implement Trie", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/implement-trie-prefix-tree/", link:"/problem/implement-trie" },
        { id:"word-search-ii", title:"Word Search II", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/word-search-ii/", link:"/problem/word-search-ii" },
        { id:"replace-words", title:"Replace Words", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/replace-words/", link:"/problem/replace-words" }
      ] },

    // ── 52 · Union Find ──
    { id:"union-find-pattern", name:"Union-Find (Disjoint Set)", category:"Graph", difficulty:"Medium",
      description:"Efficiently track connected components with union-by-rank and path compression — O(α(n)) per operation.",
      theory:`### 1 · Structure\nparent[] array where parent[i] = i initially (self-loop). Two operations:\n- **Find(x)**: follow parent pointers to root, compress path\n- **Union(x,y)**: merge smaller tree under larger tree's root\n\n### 2 · Template\n\`\`\`\nfind(x): if parent[x] != x: parent[x] = find(parent[x]); return parent[x]\nunion(x,y): px, py = find(x), find(y); if rank[px] < rank[py]: swap; parent[py] = px\n\`\`\`\n\n### 3 · Applications\n- Number of connected components\n- Redundant connection (detect cycle)\n- Accounts merge`,
      examples:["Number of provinces","Redundant connection","Accounts merge"],
      problems:[
        { id:"num-provinces", title:"Number of Provinces", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/number-of-provinces/", link:"/problem/num-provinces" },
        { id:"redundant-connection", title:"Redundant Connection", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/redundant-connection/", link:"/problem/redundant-connection" },
        { id:"accounts-merge", title:"Accounts Merge", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/accounts-merge/", link:"/problem/accounts-merge" }
      ] },

    // ── 53 · Topological Sort — Advanced ──
    { id:"topological-sort-adv", name:"Topological Sort — Advanced", category:"Graph", difficulty:"Hard",
      description:"Kahn's algorithm and DFS-based topological ordering for dependency resolution and cycle detection in DAGs.",
      theory:`### Kahn's Algorithm (BFS)\n1. Compute in-degree for all nodes\n2. Add all zero in-degree nodes to queue\n3. Process queue: for each node, reduce neighbors' in-degree; add new zeros\n4. If processed count < total nodes → cycle exists\n\n### DFS-Based\nRun DFS, push node to stack after all descendants processed. Stack gives reverse topological order.`,
      examples:["Course schedule I & II","Alien dictionary","Parallel courses"],
      problems:[
        { id:"course-schedule", title:"Course Schedule", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/course-schedule/", link:"/problem/course-schedule" },
        { id:"course-schedule-ii", title:"Course Schedule II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/course-schedule-ii/", link:"/problem/course-schedule-ii" },
        { id:"alien-dictionary", title:"Alien Dictionary", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/alien-dictionary/", link:"/problem/alien-dictionary" }
      ] },

    // ── 54 · Graph Coloring / Bipartite ──
    { id:"graph-bipartite", name:"Graph Coloring & Bipartite Check", category:"Graph", difficulty:"Medium",
      description:"2-color a graph with BFS/DFS to check bipartiteness — used for conflict detection and scheduling.",
      theory:`### Bipartite Check\nTry to 2-color the graph using BFS. If any neighbor has the same color, graph is not bipartite.\n\n### Applications\n- Is graph bipartite?\n- Possible bipartition (odd-length cycle detection)\n- Task/exam scheduling without conflicts`,
      examples:["Is graph bipartite","Possible bipartition"],
      problems:[
        { id:"is-bipartite", title:"Is Graph Bipartite?", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/is-graph-bipartite/", link:"/problem/is-bipartite" },
        { id:"possible-bipartition", title:"Possible Bipartition", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/possible-bipartition/", link:"/problem/possible-bipartition" }
      ] },

    // ── 55 · Bit Manipulation — Basics ──
    { id:"bit-manipulation-basics", name:"Bit Manipulation Basics", category:"Bit Manipulation", difficulty:"Easy",
      description:"Master AND, OR, XOR, shifts, and bit masks for counting bits, finding singles, and power-of-2 checks.",
      theory:`### Key Operations\n- n & (n-1): clears lowest set bit (count bits)\n- n & (-n): isolates lowest set bit\n- x ^ x = 0: XOR of identical numbers cancels\n- x ^ 0 = x: identity\n\n### Single Number\nXOR all elements. Pairs cancel, leaving the single one. O(n) time, O(1) space.`,
      examples:["Single number","Number of 1 bits","Power of two"],
      problems:[
        { id:"single-number", title:"Single Number", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/single-number/", link:"/problem/single-number" },
        { id:"number-of-1-bits", title:"Number of 1 Bits", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/number-of-1-bits/", link:"/problem/number-of-1-bits" },
        { id:"counting-bits", title:"Counting Bits", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/counting-bits/", link:"/problem/counting-bits" }
      ] },

    // ── 56 · Bit Manipulation — Advanced ──
    { id:"bit-manipulation-adv", name:"Bit Manipulation — Advanced", category:"Bit Manipulation", difficulty:"Medium",
      description:"XOR tricks for finding two missing numbers, subset enumeration via bitmasks, and bitwise DP.",
      theory:`### Two Single Numbers\nXOR all → result is a^b. Find a set bit (differentiating bit). Partition numbers by that bit → XOR each group separately.\n\n### Subset Enumeration\nFor n elements, iterate masks 0 to 2^n - 1. Bit i set → include element i.\n\n### Bitwise DP\nUse bitmask as DP state to represent visited/chosen subsets. Common in traveling salesman, assignment problems.`,
      examples:["Single number III","Subsets via bitmask","Maximum AND of pair"],
      problems:[
        { id:"single-number-iii", title:"Single Number III", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/single-number-iii/", link:"/problem/single-number-iii" },
        { id:"subsets-bitmask", title:"Subsets", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/subsets/", link:"/problem/subsets-bitmask" },
        { id:"reverse-bits", title:"Reverse Bits", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/reverse-bits/", link:"/problem/reverse-bits" }
      ] },

    // ── 57 · Math & Number Theory ──
    { id:"math-number-theory", name:"Math & Number Theory", category:"Math", difficulty:"Medium",
      description:"GCD, prime sieve, modular arithmetic, and combinatorics patterns used in competitive programming.",
      theory:`### GCD (Euclidean)\ngcd(a,b) = gcd(b, a%b). Base: gcd(a,0) = a.\n\n### Sieve of Eratosthenes\nMark multiples of each prime starting from 2. O(n log log n).\n\n### Modular Arithmetic\n(a+b)%m = ((a%m)+(b%m))%m. Fast power: a^n mod m in O(log n).`,
      examples:["Count primes","GCD of strings","Power(x,n)"],
      problems:[
        { id:"count-primes", title:"Count Primes", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/count-primes/", link:"/problem/count-primes" },
        { id:"gcd-strings", title:"Greatest Common Divisor of Strings", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/greatest-common-divisor-of-strings/", link:"/problem/gcd-strings" },
        { id:"pow-x-n", title:"Pow(x, n)", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/powx-n/", link:"/problem/pow-x-n" }
      ] },

    // ── 58 · Matrix Traversal ──
    { id:"matrix-traversal", name:"Matrix Traversal Patterns", category:"Matrix", difficulty:"Medium",
      description:"Spiral order, diagonal traversal, rotation, and layer-by-layer processing of 2D matrices.",
      theory:`### Spiral Traversal\nMaintain four boundaries: top, bottom, left, right. Traverse top row → right col → bottom row → left col, shrinking boundaries.\n\n### Rotate 90°\nTranspose (swap [i][j] and [j][i]), then reverse each row.\n\n### Diagonal Traversal\nGroup elements by i+j (same diagonal). Reverse alternating diagonals.`,
      examples:["Spiral matrix","Rotate image","Diagonal traverse"],
      problems:[
        { id:"spiral-matrix", title:"Spiral Matrix", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/spiral-matrix/", link:"/problem/spiral-matrix" },
        { id:"rotate-image", title:"Rotate Image", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/rotate-image/", link:"/problem/rotate-image" },
        { id:"set-matrix-zeroes", title:"Set Matrix Zeroes", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/set-matrix-zeroes/", link:"/problem/set-matrix-zeroes" }
      ] },

    // ── 59 · Grid DFS / BFS ──
    { id:"grid-dfs-bfs", name:"Grid DFS & BFS", category:"Matrix", difficulty:"Medium",
      description:"Flood fill, island counting, shortest path in grid using DFS/BFS with 4-directional movement.",
      theory:`### Pattern\nFor each unvisited cell matching criteria, start DFS/BFS exploring 4 neighbors. Mark visited. Count components or measure distances.\n\n### BFS for Shortest Path\nUse queue with (row, col, distance). First time reaching target = shortest path.\n\n### Multi-source BFS\nAdd all sources to queue initially. Expand level by level. Used for "nearest" problems (01 matrix, rotting oranges).`,
      examples:["Number of islands","Rotting oranges","Shortest path in binary matrix"],
      problems:[
        { id:"num-islands", title:"Number of Islands", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/number-of-islands/", link:"/problem/num-islands" },
        { id:"rotting-oranges", title:"Rotting Oranges", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/rotting-oranges/", link:"/problem/rotting-oranges" },
        { id:"shortest-path-binary-matrix", title:"Shortest Path in Binary Matrix", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/shortest-path-in-binary-matrix/", link:"/problem/shortest-path-binary-matrix" }
      ] },

    // ── 60 · String Manipulation ──
    { id:"string-manipulation", name:"String Manipulation Patterns", category:"String", difficulty:"Medium",
      description:"Reverse, encode/decode, palindrome check, and string matching patterns.",
      theory:`### Key Patterns\n- **Reverse words**: split, reverse list, join\n- **Encode/Decode**: length-prefixed encoding for lists of strings\n- **Palindrome check**: two pointers from both ends\n- **String matching**: KMP or Rabin-Karp for O(n+m) matching`,
      examples:["Reverse words in a string","Valid palindrome","Longest common prefix"],
      problems:[
        { id:"reverse-words", title:"Reverse Words in a String", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/reverse-words-in-a-string/", link:"/problem/reverse-words" },
        { id:"valid-palindrome", title:"Valid Palindrome", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/valid-palindrome/", link:"/problem/valid-palindrome" },
        { id:"longest-common-prefix", title:"Longest Common Prefix", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-common-prefix/", link:"/problem/longest-common-prefix" }
      ] },
];
