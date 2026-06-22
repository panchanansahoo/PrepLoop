// ══════════════════════════════════════════════════════════════
// DSA Patterns 61–80
// ══════════════════════════════════════════════════════════════

export const dsaPatternsExtended3 = [

    // ── 61 · KMP String Matching ──
    { id:"kmp-matching", name:"KMP String Matching", category:"String", difficulty:"Hard",
      description:"Knuth-Morris-Pratt algorithm for pattern matching in O(n+m) using a failure function (LPS array).",
      theory:`### Build LPS Array\nLPS[i] = length of longest proper prefix of pattern[0..i] that is also a suffix. Build in O(m).\n\n### Matching\nTwo pointers: i on text, j on pattern. On mismatch, j = LPS[j-1] (skip already matched). On match, advance both. Full match when j == m.`,
      examples:["Implement strStr","Repeated substring pattern","Shortest palindrome"],
      problems:[
        { id:"strstr", title:"Find the Index of the First Occurrence", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/", link:"/problem/strstr" },
        { id:"repeated-substring", title:"Repeated Substring Pattern", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/repeated-substring-pattern/", link:"/problem/repeated-substring" }
      ] },

    // ── 62 · DP — 0/1 Knapsack ──
    { id:"dp-knapsack-01", name:"DP — 0/1 Knapsack", category:"Dynamic Programming", difficulty:"Medium",
      description:"Choose items with given weights and values to maximize value within a weight capacity — the classic DP problem.",
      theory:`### Recurrence\ndp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])\n\n### Space Optimization\nUse 1D array, iterate weights in reverse to avoid overwriting needed values.\n\n### Variants\n- Subset sum (target sum possible?)\n- Partition equal subset sum\n- Target sum (+ and - assignments)`,
      examples:["Partition equal subset sum","Target sum","Last stone weight II"],
      problems:[
        { id:"partition-equal-subset", title:"Partition Equal Subset Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/partition-equal-subset-sum/", link:"/problem/partition-equal-subset" },
        { id:"target-sum", title:"Target Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/target-sum/", link:"/problem/target-sum" },
        { id:"last-stone-weight-ii", title:"Last Stone Weight II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/last-stone-weight-ii/", link:"/problem/last-stone-weight-ii" }
      ] },

    // ── 63 · DP — Unbounded Knapsack ──
    { id:"dp-knapsack-unbounded", name:"DP — Unbounded Knapsack", category:"Dynamic Programming", difficulty:"Medium",
      description:"Items can be chosen multiple times — coin change, rod cutting, and unlimited supply problems.",
      theory:`### Recurrence\ndp[w] = max/min over all items i: dp[w - wt[i]] + val[i]\n\n### Key Difference from 0/1\nIterate weights forward (not reverse), allowing items to be reused.\n\n### Coin Change Template\n\`\`\`\ndp = [inf] * (amount+1)\ndp[0] = 0\nfor coin in coins:\n  for a in range(coin, amount+1):\n    dp[a] = min(dp[a], dp[a-coin]+1)\n\`\`\``,
      examples:["Coin change","Coin change II (combinations)","Perfect squares"],
      problems:[
        { id:"coin-change", title:"Coin Change", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/coin-change/", link:"/problem/coin-change" },
        { id:"coin-change-ii", title:"Coin Change II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/coin-change-ii/", link:"/problem/coin-change-ii" },
        { id:"perfect-squares", title:"Perfect Squares", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/perfect-squares/", link:"/problem/perfect-squares" }
      ] },

    // ── 64 · DP — LIS ──
    { id:"dp-lis", name:"DP — Longest Increasing Subsequence", category:"Dynamic Programming", difficulty:"Medium",
      description:"Find the longest strictly increasing subsequence using DP in O(n²) or binary search in O(n log n).",
      theory:`### O(n²) DP\ndp[i] = length of LIS ending at index i. dp[i] = max(dp[j]+1) for all j < i where arr[j] < arr[i].\n\n### O(n log n) Patience Sort\nMaintain tails array. For each element, binary search for its position in tails. Length of tails = LIS length.\n\n### Variants\n- Number of longest increasing subsequences\n- Longest non-decreasing subsequence\n- Maximum sum increasing subsequence`,
      examples:["Longest increasing subsequence","Russian doll envelopes","Longest string chain"],
      problems:[
        { id:"lis", title:"Longest Increasing Subsequence", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-increasing-subsequence/", link:"/problem/lis" },
        { id:"russian-doll", title:"Russian Doll Envelopes", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/russian-doll-envelopes/", link:"/problem/russian-doll" },
        { id:"longest-string-chain", title:"Longest String Chain", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-string-chain/", link:"/problem/longest-string-chain" }
      ] },

    // ── 65 · DP — LCS ──
    { id:"dp-lcs", name:"DP — Longest Common Subsequence", category:"Dynamic Programming", difficulty:"Medium",
      description:"Find the longest subsequence common to two strings using 2D DP — foundation for edit distance and diff algorithms.",
      theory:`### Recurrence\nif s1[i]==s2[j]: dp[i][j] = dp[i-1][j-1]+1\nelse: dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n\n### Edit Distance Variant\nInsert: dp[i][j-1]+1, Delete: dp[i-1][j]+1, Replace: dp[i-1][j-1]+1.`,
      examples:["Longest common subsequence","Edit distance","Delete operation for two strings"],
      problems:[
        { id:"lcs", title:"Longest Common Subsequence", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-common-subsequence/", link:"/problem/lcs" },
        { id:"edit-distance", title:"Edit Distance", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/edit-distance/", link:"/problem/edit-distance" },
        { id:"min-ascii-delete", title:"Minimum ASCII Delete Sum for Two Strings", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/", link:"/problem/min-ascii-delete" }
      ] },

    // ── 66 · DP — Palindrome ──
    { id:"dp-palindrome", name:"DP — Palindrome Patterns", category:"Dynamic Programming", difficulty:"Medium",
      description:"Longest palindromic substring/subsequence, palindrome partitioning, and minimum insertions for palindrome.",
      theory:`### Longest Palindromic Substring\nExpand around center for each position. O(n²). Manacher's for O(n).\n\n### Longest Palindromic Subsequence\ndp[i][j] = length of LPS of s[i..j]. If s[i]==s[j]: dp[i-1][j-1]+2. Else: max(dp[i+1][j], dp[i][j-1]).\n\n### Palindrome Partitioning\nDFS with backtracking. For each prefix that is a palindrome, recurse on suffix.`,
      examples:["Longest palindromic substring","Longest palindromic subsequence","Palindrome partitioning"],
      problems:[
        { id:"longest-palindromic-sub", title:"Longest Palindromic Substring", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-palindromic-substring/", link:"/problem/longest-palindromic-sub" },
        { id:"lps", title:"Longest Palindromic Subsequence", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/longest-palindromic-subsequence/", link:"/problem/lps" },
        { id:"palindrome-partition", title:"Palindrome Partitioning", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/palindrome-partitioning/", link:"/problem/palindrome-partition" }
      ] },

    // ── 67 · DP — Matrix Path ──
    { id:"dp-matrix-path", name:"DP — Matrix Path Problems", category:"Dynamic Programming", difficulty:"Medium",
      description:"Find unique paths, minimum cost paths, and maximum values in grid traversal using DP.",
      theory:`### Unique Paths\ndp[i][j] = dp[i-1][j] + dp[i][j-1]. Only moving right/down. O(m*n).\n\n### Min Path Sum\ndp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).\n\n### With Obstacles\nIf grid[i][j] is blocked, dp[i][j] = 0.`,
      examples:["Unique paths","Minimum path sum","Unique paths II (with obstacles)"],
      problems:[
        { id:"unique-paths", title:"Unique Paths", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/unique-paths/", link:"/problem/unique-paths" },
        { id:"min-path-sum", title:"Minimum Path Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/minimum-path-sum/", link:"/problem/min-path-sum" },
        { id:"triangle", title:"Triangle", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/triangle/", link:"/problem/triangle" }
      ] },

    // ── 68 · DP — State Machine ──
    { id:"dp-state-machine", name:"DP — State Machine", category:"Dynamic Programming", difficulty:"Hard",
      description:"Model DP transitions as state machines — best for stock trading, string editing, and game theory problems.",
      theory:`### Stock Trading\nStates: holding, not_holding, cooldown. Transitions:\n- hold[i] = max(hold[i-1], rest[i-1] - price[i])\n- sold[i] = hold[i-1] + price[i]\n- rest[i] = max(rest[i-1], sold[i-1])\n\n### Variants\n- At most k transactions: add transaction count dimension\n- With cooldown: add cooldown state\n- With transaction fee: subtract fee on sell`,
      examples:["Best time to buy/sell stock I-IV","Best time with cooldown","Best time with transaction fee"],
      problems:[
        { id:"stock-ii", title:"Best Time to Buy and Sell Stock II", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/", link:"/problem/stock-ii" },
        { id:"stock-cooldown", title:"Best Time with Cooldown", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", link:"/problem/stock-cooldown" },
        { id:"stock-fee", title:"Best Time with Transaction Fee", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/", link:"/problem/stock-fee" }
      ] },

    // ── 69 · DP — Word Break ──
    { id:"dp-word-break", name:"DP — Word Break Pattern", category:"Dynamic Programming", difficulty:"Medium",
      description:"Determine if a string can be segmented into dictionary words using bottom-up DP or memoized recursion.",
      theory:`### Template\ndp[i] = true if s[0..i] can be segmented.\nFor each i, check all j < i: if dp[j] and s[j..i] in dict → dp[i] = true.\n\n### Word Break II (all decompositions)\nUse backtracking with memoization. Build solutions recursively and cache results.`,
      examples:["Word break","Word break II"],
      problems:[
        { id:"word-break", title:"Word Break", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/word-break/", link:"/problem/word-break" },
        { id:"word-break-ii", title:"Word Break II", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/word-break-ii/", link:"/problem/word-break-ii" }
      ] },

    // ── 70 · DP — Bitmask DP ──
    { id:"dp-bitmask", name:"DP — Bitmask DP", category:"Dynamic Programming", difficulty:"Hard",
      description:"Use bitmasks to represent subsets as DP states — solving assignment, TSP, and matching problems.",
      theory:`### Idea\nState dp[mask] where mask is a bitmask of visited/chosen items. For n items, 2^n states.\n\n### TSP Template\ndp[mask][i] = min cost to visit cities in mask, ending at city i.\nTransition: dp[mask | (1<<j)][j] = min(dp[mask][i] + dist[i][j])\n\n### Complexity\nO(2^n * n) states, each with O(n) transitions → O(2^n * n²). Feasible for n ≤ 20.`,
      examples:["Traveling salesman","Partition to k equal sum subsets","Shortest path visiting all nodes"],
      problems:[
        { id:"partition-k-equal", title:"Partition to K Equal Sum Subsets", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/partition-to-k-equal-sum-subsets/", link:"/problem/partition-k-equal" },
        { id:"shortest-path-all-nodes", title:"Shortest Path Visiting All Nodes", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/shortest-path-visiting-all-nodes/", link:"/problem/shortest-path-all-nodes" }
      ] },

    // ── 71 · Segment Tree ──
    { id:"segment-tree", name:"Segment Tree", category:"Advanced Data Structures", difficulty:"Hard",
      description:"Tree structure for O(log n) range queries (sum, min, max) with point or range updates.",
      theory:`### Structure\nComplete binary tree with 4n space. Each node stores aggregate of a range.\n\n### Operations\n- Build: O(n)\n- Point update: O(log n) — update leaf, propagate up\n- Range query: O(log n) — combine relevant segments\n- Lazy propagation: O(log n) range updates`,
      examples:["Range sum query mutable","Count of smaller numbers after self"],
      problems:[
        { id:"range-sum-mutable", title:"Range Sum Query - Mutable", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/range-sum-query-mutable/", link:"/problem/range-sum-mutable" },
        { id:"count-smaller-after", title:"Count of Smaller Numbers After Self", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/count-of-smaller-numbers-after-self/", link:"/problem/count-smaller-after" }
      ] },

    // ── 72 · Binary Indexed Tree (Fenwick) ──
    { id:"fenwick-tree", name:"Binary Indexed Tree (Fenwick)", category:"Advanced Data Structures", difficulty:"Hard",
      description:"Space-efficient O(log n) prefix sum queries and point updates — simpler to implement than segment tree.",
      theory:`### Operations\n- Update i: add delta to i, then i += i & (-i)\n- Query prefix sum [1..i]: sum, then i -= i & (-i)\n\n### Range Sum\nsum(l, r) = query(r) - query(l-1)\n\n### Key Advantage\nSimpler code than segment tree. Perfect for prefix-sum + update problems.`,
      examples:["Range sum query mutable","Count inversions"],
      problems:[
        { id:"range-sum-fenwick", title:"Range Sum Query - Mutable (BIT)", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/range-sum-query-mutable/", link:"/problem/range-sum-fenwick" },
        { id:"count-inversions", title:"Global and Local Inversions", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/global-and-local-inversions/", link:"/problem/count-inversions" }
      ] },

    // ── 73 · LRU / LFU Cache ──
    { id:"lru-lfu-cache", name:"LRU / LFU Cache Design", category:"Design", difficulty:"Medium",
      description:"Implement least-recently-used and least-frequently-used caches with O(1) get and put operations.",
      theory:`### LRU Cache\nHashMap + Doubly Linked List. Map stores key → node. List maintains access order. On access, move to front. On eviction, remove from back.\n\n### LFU Cache\nHashMap + frequency-to-DoublyLinkedList map. Track min frequency. On access, increase freq and move node. O(1) per operation.`,
      examples:["LRU cache","LFU cache"],
      problems:[
        { id:"lru-cache", title:"LRU Cache", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/lru-cache/", link:"/problem/lru-cache" },
        { id:"lfu-cache", title:"LFU Cache", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/lfu-cache/", link:"/problem/lfu-cache" }
      ] },

    // ── 74 · Design — Iterator ──
    { id:"design-iterator", name:"Design Iterator Patterns", category:"Design", difficulty:"Medium",
      description:"Implement custom iterators: flatten nested lists, zigzag, peeking — common in system design interviews.",
      theory:`### Flatten Nested List\nUse a stack. Push elements in reverse. On next(), if top is integer return it, else flatten and push its children. Call hasNext() to prepare.\n\n### Peeking Iterator\nCache the next element. peek() returns cache without advancing. next() returns cache and refreshes it.`,
      examples:["Flatten nested list iterator","Peeking iterator","Zigzag iterator"],
      problems:[
        { id:"flatten-nested-list", title:"Flatten Nested List Iterator", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/flatten-nested-list-iterator/", link:"/problem/flatten-nested-list" },
        { id:"peeking-iterator", title:"Peeking Iterator", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/peeking-iterator/", link:"/problem/peeking-iterator" }
      ] },

    // ── 75 · Design — Data Structure ──
    { id:"design-data-structure", name:"Design Data Structures", category:"Design", difficulty:"Hard",
      description:"Design Twitter, hit counter, time-based key-value store — combining multiple data structures.",
      theory:`### Approach\n1. Identify the operations and their frequency\n2. Choose data structures optimizing for the most frequent operations\n3. Combine: HashMap + Heap, HashMap + TreeMap, HashMap + List\n\n### Time-Based Key-Value Store\nHashMap where each key maps to a sorted list of (timestamp, value). Binary search on get(key, timestamp).`,
      examples:["Design Twitter","Time-based key-value store","Design hit counter"],
      problems:[
        { id:"design-twitter", title:"Design Twitter", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/design-twitter/", link:"/problem/design-twitter" },
        { id:"time-based-kv", title:"Time Based Key-Value Store", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/time-based-key-value-store/", link:"/problem/time-based-kv" }
      ] },

    // ── 76 · Sliding Window — Variable Size ──
    { id:"sliding-window-variable", name:"Sliding Window — Variable Size", category:"Array & String", difficulty:"Medium",
      description:"Expand/shrink a window to find the smallest or largest substring/subarray meeting a condition.",
      theory:`### Template\n\`\`\`\nleft = 0\nfor right in range(n):\n  add arr[right] to window\n  while window violates condition:\n    remove arr[left] from window\n    left++\n  update answer with current window size\n\`\`\`\n\n### Key: Shrink When Invalid\nExpand right to include more. Shrink left to restore validity. Answer = window at valid points.`,
      examples:["Minimum window substring","Smallest subarray with sum ≥ target"],
      problems:[
        { id:"min-window-substring", title:"Minimum Window Substring", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/minimum-window-substring/", link:"/problem/min-window-substring" },
        { id:"min-size-subarray", title:"Minimum Size Subarray Sum", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/minimum-size-subarray-sum/", link:"/problem/min-size-subarray" }
      ] },

    // ── 77 · Sliding Window — With Map ──
    { id:"sliding-window-map", name:"Sliding Window with Frequency Map", category:"Array & String", difficulty:"Medium",
      description:"Sliding window combined with hash map for character/element frequency tracking.",
      theory:`### Pattern\nMaintain a frequency map within the window. Track how many characters are "satisfied." When all satisfied, try to shrink. When condition breaks, expand.\n\n### Permutation in String\nFixed-size window matching target frequency. Slide and compare frequencies.`,
      examples:["Permutation in string","Find all anagrams","Longest substring without repeating characters"],
      problems:[
        { id:"permutation-in-string", title:"Permutation in String", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/permutation-in-string/", link:"/problem/permutation-in-string" },
        { id:"find-all-anagrams", title:"Find All Anagrams in a String", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-all-anagrams-in-a-string/", link:"/problem/find-all-anagrams" }
      ] },

    // ── 78 · Cyclic Sort ──
    { id:"cyclic-sort", name:"Cyclic Sort", category:"Array & String", difficulty:"Easy",
      description:"When array contains numbers in range [1, n], place each number at its correct index to find missing/duplicate numbers.",
      theory:`### Algorithm\nIterate array. If arr[i] != i+1 and arr[arr[i]-1] != arr[i], swap arr[i] with arr[arr[i]-1]. After sorting, positions where arr[i] != i+1 reveal missing numbers.\n\n### Applications\n- Find missing number\n- Find all duplicates\n- Find first missing positive\n- Set mismatch`,
      examples:["Find missing number","Find all duplicates","First missing positive"],
      problems:[
        { id:"missing-number", title:"Missing Number", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/missing-number/", link:"/problem/missing-number" },
        { id:"find-all-duplicates", title:"Find All Duplicates in an Array", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/find-all-duplicates-in-an-array/", link:"/problem/find-all-duplicates" },
        { id:"first-missing-positive", title:"First Missing Positive", difficulty:"Hard", status:"pending", leetcodeLink:"https://leetcode.com/problems/first-missing-positive/", link:"/problem/first-missing-positive" }
      ] },

    // ── 79 · Dutch National Flag ──
    { id:"dutch-national-flag", name:"Dutch National Flag / 3-Way Partition", category:"Array & String", difficulty:"Medium",
      description:"Partition array into three groups in O(n) using three pointers — sort colors, segregate negatives/positives.",
      theory:`### Algorithm\nThree pointers: low, mid, high. Elements before low = 0, after high = 2, between = 1.\n\`\`\`\nlow = mid = 0, high = n-1\nwhile mid <= high:\n  if arr[mid] == 0: swap(arr[low], arr[mid]); low++; mid++\n  elif arr[mid] == 1: mid++\n  else: swap(arr[mid], arr[high]); high--\n\`\`\``,
      examples:["Sort colors","Move zeroes","Segregate 0s, 1s, 2s"],
      problems:[
        { id:"sort-colors", title:"Sort Colors", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/sort-colors/", link:"/problem/sort-colors" },
        { id:"move-zeroes", title:"Move Zeroes", difficulty:"Easy", status:"pending", leetcodeLink:"https://leetcode.com/problems/move-zeroes/", link:"/problem/move-zeroes" }
      ] },

    // ── 80 · Reservoir Sampling ──
    { id:"reservoir-sampling", name:"Reservoir Sampling", category:"Math", difficulty:"Medium",
      description:"Randomly select k items from an unknown-size stream with equal probability — O(n) time, O(k) space.",
      theory:`### Algorithm (k=1)\nKeep first item. For ith item, replace with probability 1/i. Each item has equal 1/n probability.\n\n### General (k items)\nKeep first k items. For ith item (i>k), pick random j in [0,i). If j<k, replace reservoir[j] with item[i].`,
      examples:["Linked list random node","Random pick index"],
      problems:[
        { id:"random-node", title:"Linked List Random Node", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/linked-list-random-node/", link:"/problem/random-node" },
        { id:"random-pick-index", title:"Random Pick Index", difficulty:"Medium", status:"pending", leetcodeLink:"https://leetcode.com/problems/random-pick-index/", link:"/problem/random-pick-index" }
      ] },
];
