// ══════════════════════════════════════════════════════════════
// DSA Patterns 81–97
// ══════════════════════════════════════════════════════════════

export const dsaPatternsExtended4 = [

    // ── 81 · Graph — MST (Kruskal / Prim) ──
    { id:"mst-kruskal-prim", name:"Minimum Spanning Tree", category:"Graph", difficulty:"Hard",
      description:"Build minimum cost spanning tree using Kruskal's (sort edges + union-find) or Prim's (min-heap greedy) algorithm.",
      theory:`### Kruskal's\nSort edges by weight. Add each edge if it doesn't form a cycle (union-find). O(E log E).\n\n### Prim's\nStart from any node. Greedily add the cheapest edge connecting a new node. Use min-heap. O(E log V).`,
      examples:["Minimum cost to connect all points","Min cost spanning tree"],
      problems:[
        { id:"min-cost-connect", title:"Min Cost to Connect All Points", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/min-cost-to-connect-all-points/", link:"/problem/min-cost-connect" },
        { id:"connecting-cities", title:"Connecting Cities With Minimum Cost", difficulty:"Medium", status:"pending", link:"/problem/connecting-cities" }
      ] },

    // ── 82 · Graph — Bellman-Ford ──
    { id:"bellman-ford", name:"Bellman-Ford Algorithm", category:"Graph", difficulty:"Hard",
      description:"Single-source shortest paths with negative weights and negative cycle detection in O(V*E).",
      theory:`### Algorithm\nRelax all edges V-1 times. If any edge can still be relaxed, negative cycle exists.\n\n### When to Use\n- Negative edge weights (Dijkstra fails)\n- Need negative cycle detection\n- Cheapest flights within K stops (run K+1 relaxations)`,
      examples:["Network delay time (negative weights)","Cheapest flights within K stops"],
      problems:[
        { id:"cheapest-flights-k", title:"Cheapest Flights Within K Stops", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/cheapest-flights-within-k-stops/", link:"/problem/cheapest-flights-k" }
      ] },

    // ── 83 · Graph — Floyd-Warshall ──
    { id:"floyd-warshall", name:"Floyd-Warshall All-Pairs Shortest Path", category:"Graph", difficulty:"Hard",
      description:"Compute shortest paths between all pairs of vertices in O(V³) — used when you need the full distance matrix.",
      theory:`### Algorithm\nFor each intermediate vertex k, for each pair (i,j): dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j]).\n\n### When to Use\n- Small graphs (V ≤ 400)\n- Need all pairwise distances\n- Transitive closure of a graph`,
      examples:["Network delay (all pairs)","Find the city with fewest reachable neighbors"],
      problems:[
        { id:"find-city-threshold", title:"Find the City With the Smallest Number of Neighbors", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/", link:"/problem/find-city-threshold" }
      ] },

    // ── 84 · Graph — SCC (Tarjan / Kosaraju) ──
    { id:"strongly-connected", name:"Strongly Connected Components", category:"Graph", difficulty:"Hard",
      description:"Find all SCCs in a directed graph using Tarjan's algorithm (single DFS) or Kosaraju's (two-pass DFS).",
      theory:`### Tarjan's Algorithm\nDFS with discovery time and low-link values. Maintain a stack. When disc[u]==low[u], pop SCC from stack. O(V+E).\n\n### Kosaraju's\n1. Run DFS on original graph, record finish order\n2. Build reverse graph\n3. Run DFS on reverse graph in reverse finish order — each DFS tree = one SCC`,
      examples:["Critical connections in a network","Strongly connected components"],
      problems:[
        { id:"critical-connections", title:"Critical Connections in a Network", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/critical-connections-in-a-network/", link:"/problem/critical-connections" }
      ] },

    // ── 85 · Monotonic Queue ──
    { id:"monotonic-queue", name:"Monotonic Queue", category:"Stack & Queue", difficulty:"Hard",
      description:"A deque maintaining monotonic order for O(1) min/max queries in sliding windows.",
      theory:`### Pattern\nFor sliding window maximum: maintain a decreasing deque of indices. Front = max. On slide, pop front if out of window. On new element, pop all smaller from back.\n\n### Complexity\nEach element enters and leaves deque at most once → O(n) total.`,
      examples:["Sliding window maximum","Longest subarray with limit"],
      problems:[
        { id:"max-sliding-window", title:"Sliding Window Maximum", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/sliding-window-maximum/", link:"/problem/max-sliding-window" },
        { id:"longest-subarray-limit", title:"Longest Continuous Subarray With Absolute Diff ≤ Limit", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/", link:"/problem/longest-subarray-limit" }
      ] },

    // ── 86 · Stack — Calculator ──
    { id:"calculator-pattern", name:"Basic Calculator / Expression Evaluation", category:"Stack & Queue", difficulty:"Hard",
      description:"Parse and evaluate mathematical expressions with +, -, *, /, and parentheses using stack-based approach.",
      theory:`### Approach\nUse a stack for numbers and handle operators with precedence.\n1. Number: accumulate digits\n2. +/-: push previous result, start new\n3. Parentheses: recurse or use stack to save/restore state\n4. End: return sum of stack`,
      examples:["Basic calculator","Basic calculator II","Evaluate expression"],
      problems:[
        { id:"basic-calculator", title:"Basic Calculator", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/basic-calculator/", link:"/problem/basic-calculator" },
        { id:"basic-calculator-ii", title:"Basic Calculator II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/basic-calculator-ii/", link:"/problem/basic-calculator-ii" }
      ] },

    // ── 87 · DP — Digit DP ──
    { id:"digit-dp", name:"DP — Digit DP", category:"Dynamic Programming", difficulty:"Hard",
      description:"Count numbers in range [L, R] satisfying digit-level constraints using memoized recursion on digits.",
      theory:`### Framework\nProcess number digit by digit. State: (position, tight_bound, started, custom_state).\n- tight: is current prefix equal to the bound? Limits choices.\n- started: handles leading zeros.\nMemoize on (pos, tight, started, custom).`,
      examples:["Numbers at most N given digit set","Count numbers with unique digits"],
      problems:[
        { id:"numbers-at-most", title:"Numbers At Most N Given Digit Set", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/numbers-at-most-n-given-digit-set/", link:"/problem/numbers-at-most" },
        { id:"count-unique-digits", title:"Count Numbers with Unique Digits", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/count-numbers-with-unique-digits/", link:"/problem/count-unique-digits" }
      ] },

    // ── 88 · DP — Interval DP ──
    { id:"interval-dp", name:"DP — Interval DP", category:"Dynamic Programming", difficulty:"Hard",
      description:"Solve problems on contiguous subarrays/substrings by combining solutions of smaller intervals.",
      theory:`### Template\n\`\`\`\nfor length from 2 to n:\n  for i from 0 to n-length:\n    j = i + length - 1\n    for k from i to j-1:  // split point\n      dp[i][j] = optimize(dp[i][k] + dp[k+1][j] + cost)\n\`\`\`\n\n### Applications\n- Matrix chain multiplication\n- Burst balloons\n- Minimum cost to merge stones`,
      examples:["Burst balloons","Minimum cost to merge stones","Strange printer"],
      problems:[
        { id:"burst-balloons", title:"Burst Balloons", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/burst-balloons/", link:"/problem/burst-balloons" },
        { id:"strange-printer", title:"Strange Printer", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/strange-printer/", link:"/problem/strange-printer" }
      ] },

    // ── 89 · DP — Tree DP ──
    { id:"tree-dp", name:"DP — Tree DP", category:"Dynamic Programming", difficulty:"Hard",
      description:"Dynamic programming on trees — compute optimal values for subtrees using post-order DFS.",
      theory:`### Pattern\nFor each node, compute DP values by combining children's DP values. Process leaves first (post-order).\n\n### Examples\n- House robber III: rob[node] = max(rob children, skip + rob grandchildren)\n- Longest path: for each node, combine two best child paths`,
      examples:["House robber III","Binary tree cameras","Longest path in tree"],
      problems:[
        { id:"house-robber-iii", title:"House Robber III", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/house-robber-iii/", link:"/problem/house-robber-iii" },
        { id:"binary-tree-cameras", title:"Binary Tree Cameras", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/binary-tree-cameras/", link:"/problem/binary-tree-cameras" }
      ] },

    // ── 90 · Backtracking — Subsets & Permutations ──
    { id:"backtrack-subsets-perms", name:"Backtracking — Subsets & Permutations", category:"Backtracking", difficulty:"Medium",
      description:"Generate all subsets, permutations, and combinations using systematic backtracking with pruning.",
      theory:`### Subsets\nAt each index, choose to include or exclude. Or iterate and recursively add remaining.\n\n### Permutations\nSwap current position with each remaining position, recurse, un-swap.\n\n### With Duplicates\nSort first. Skip elements where nums[i]==nums[i-1] and i-1 was not used in current path.`,
      examples:["Subsets I & II","Permutations I & II","Combination sum"],
      problems:[
        { id:"subsets-bt", title:"Subsets", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/subsets/", link:"/problem/subsets-bt" },
        { id:"permutations", title:"Permutations", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/permutations/", link:"/problem/permutations" },
        { id:"combination-sum", title:"Combination Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/combination-sum/", link:"/problem/combination-sum" }
      ] },

    // ── 91 · Backtracking — N-Queens & Sudoku ──
    { id:"backtrack-constraint", name:"Backtracking — Constraint Satisfaction", category:"Backtracking", difficulty:"Hard",
      description:"Solve constraint satisfaction problems like N-Queens, Sudoku, and crossword puzzles with backtracking and pruning.",
      theory:`### N-Queens\nPlace queens row by row. For each row, try each column. Check column, diagonal, anti-diagonal conflicts. Backtrack on conflict.\n\n### Sudoku\nFor each empty cell, try 1-9. Validate row, column, and 3×3 box. Backtrack on conflict.\n\n### Pruning is Critical\nWithout pruning, complexity is exponential. Good constraint checking makes backtracking practical.`,
      examples:["N-Queens","Sudoku solver","Word search"],
      problems:[
        { id:"n-queens", title:"N-Queens", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/n-queens/", link:"/problem/n-queens" },
        { id:"sudoku-solver", title:"Sudoku Solver", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/sudoku-solver/", link:"/problem/sudoku-solver" },
        { id:"word-search", title:"Word Search", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/word-search/", link:"/problem/word-search" }
      ] },

    // ── 92 · Two Pointers — Three Sum ──
    { id:"three-sum-pattern", name:"Three Sum / K Sum", category:"Array & String", difficulty:"Medium",
      description:"Fix one element and use two pointers on the sorted remainder — generalizable to k-sum problems.",
      theory:`### Three Sum Template\nSort array. For each i, use two pointers (left=i+1, right=n-1). Skip duplicates for unique triplets.\n\n### K Sum\nReduce to 2-sum by fixing k-2 elements with nested loops, then apply two-pointer 2-sum.`,
      examples:["3Sum","3Sum closest","4Sum"],
      problems:[
        { id:"three-sum", title:"3Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/3sum/", link:"/problem/three-sum" },
        { id:"three-sum-closest", title:"3Sum Closest", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/3sum-closest/", link:"/problem/three-sum-closest" },
        { id:"four-sum", title:"4Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/4sum/", link:"/problem/four-sum" }
      ] },

    // ── 93 · Array — In-Place Manipulation ──
    { id:"in-place-array", name:"In-Place Array Manipulation", category:"Array & String", difficulty:"Medium",
      description:"Modify arrays without extra space: remove duplicates, remove elements, and compact arrays in O(1) space.",
      theory:`### Read-Write Pointer\nread pointer scans forward, write pointer marks valid position. Copy valid elements to write position.\n\n### Applications\n- Remove duplicates from sorted array\n- Remove element\n- Move zeroes (write non-zeros, fill rest with 0)`,
      examples:["Remove duplicates from sorted array","Remove element","Move zeroes"],
      problems:[
        { id:"remove-duplicates", title:"Remove Duplicates from Sorted Array", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/remove-duplicates-from-sorted-array/", link:"/problem/remove-duplicates" },
        { id:"remove-element", title:"Remove Element", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/remove-element/", link:"/problem/remove-element" }
      ] },

    // ── 94 · Divide and Conquer ──
    { id:"divide-conquer", name:"Divide and Conquer", category:"Sorting & Searching", difficulty:"Hard",
      description:"Divide problem into subproblems, solve recursively, combine results — merge sort, quicksort, closest pair.",
      theory:`### Pattern\n1. Divide: split into smaller subproblems\n2. Conquer: solve subproblems recursively\n3. Combine: merge subproblem solutions\n\n### Merge Sort Inversion Count\nDuring merge step, count inversions when right element is smaller. O(n log n).\n\n### Quick Select\nPartition around pivot. If pivot is at position k, done. Otherwise recurse on correct half. O(n) average.`,
      examples:["Merge sort with count","Kth largest (quickselect)","Majority element"],
      problems:[
        { id:"merge-sort-count", title:"Count of Smaller Numbers After Self", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/count-of-smaller-numbers-after-self/", link:"/problem/merge-sort-count" },
        { id:"majority-element", title:"Majority Element", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/majority-element/", link:"/problem/majority-element" }
      ] },

    // ── 95 · Sorting Algorithms ──
    { id:"sorting-algorithms", name:"Sorting Algorithm Patterns", category:"Sorting & Searching", difficulty:"Medium",
      description:"Master merge sort, quick sort, counting sort, radix sort — knowing when to use which.",
      theory:`### Comparison-Based (O(n log n))\n- Merge sort: stable, O(n) space, great for linked lists\n- Quick sort: in-place, O(log n) space, cache-friendly\n- Heap sort: in-place, O(1) space, not stable\n\n### Non-Comparison (O(n+k))\n- Counting sort: when range is small\n- Radix sort: for integers, sort by each digit\n- Bucket sort: for uniformly distributed data`,
      examples:["Sort an array","Sort characters by frequency","Largest number"],
      problems:[
        { id:"sort-array", title:"Sort an Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/sort-an-array/", link:"/problem/sort-array" },
        { id:"sort-characters-freq", title:"Sort Characters By Frequency", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/sort-characters-by-frequency/", link:"/problem/sort-characters-freq" },
        { id:"largest-number", title:"Largest Number", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/largest-number/", link:"/problem/largest-number" }
      ] },

    // ── 96 · Simulation ──
    { id:"simulation-pattern", name:"Simulation Problems", category:"Math", difficulty:"Medium",
      description:"Implement exact rules described in the problem — game of life, robot movements, and process simulation.",
      theory:`### Approach\n1. Read rules carefully — every detail matters\n2. Implement state transitions exactly as described\n3. Handle edge cases: boundaries, wrap-around, termination\n\n### Common Patterns\n- Use copy of state for simultaneous updates (Game of Life)\n- Track position + direction for movement (robot simulation)\n- Use encoding for in-place state transitions (0→2 for died, 1→3 for born)`,
      examples:["Game of Life","Robot bounded in circle","Spiral matrix"],
      problems:[
        { id:"game-of-life", title:"Game of Life", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/game-of-life/", link:"/problem/game-of-life" },
        { id:"robot-bounded", title:"Robot Bounded In Circle", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/robot-bounded-in-circle/", link:"/problem/robot-bounded" }
      ] },

    // ── 97 · Multi-Source BFS ──
    { id:"multi-source-bfs", name:"Multi-Source BFS", category:"Graph", difficulty:"Medium",
      description:"Start BFS from multiple sources simultaneously — for 'nearest', 'farthest', and 'as far as possible' problems.",
      theory:`### Pattern\nAdd all source nodes to queue at level 0. Process level by level. First visit to any cell = shortest distance from nearest source.\n\n### Applications\n- 01 Matrix: distance from each cell to nearest 0\n- Walls and Gates: distance from each room to nearest gate\n- Rotting Oranges: time for all oranges to rot\n- As Far from Land as Possible: max distance from any water cell to nearest land`,
      examples:["01 Matrix","Walls and gates","As far from land as possible"],
      problems:[
        { id:"01-matrix", title:"01 Matrix", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/01-matrix/", link:"/problem/01-matrix" },
        { id:"as-far-land", title:"As Far from Land as Possible", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/as-far-from-land-as-possible/", link:"/problem/as-far-land" }
      ] },
];
