// DSA Learning Path - Complete Curriculum with all patterns and study materials
import { all425Problems } from './allProblems.js';

export const dsaLearningPath = {
  id: 'dsa',
  title: 'Complete DSA Mastery Path',
  slug: 'dsa',
  description: 'Master Data Structures & Algorithms with 425 curated problems across 14 patterns',
  duration: '12-16 weeks',
  difficulty: 'All Levels',
  totalProblems: 425,
  totalModules: 14,
  color: '#3b82f6',
  icon: 'Code',
  
  overview: {
    objectives: [
      'Master all fundamental data structures and algorithms',
      'Solve 425 hand-picked interview problems',
      'Learn 14 essential problem-solving patterns',
      'Build confidence for technical interviews',
      'Understand time and space complexity analysis',
      'Practice with real FAANG interview questions'
    ],
    prerequisites: [
      'Basic programming knowledge in any language',
      'Understanding of variables, loops, and functions',
      'Familiarity with object-oriented concepts (helpful but not required)'
    ],
    outcomes: [
      'Solve complex algorithmic problems efficiently',
      'Identify patterns in interview questions quickly',
      'Write clean, optimized code under pressure',
      'Ace technical interviews at top tech companies',
      'Build scalable software solutions',
      'Think algorithmically about real-world problems'
    ],
    skillsGained: [
      'Problem Solving',
      'Algorithm Design',
      'Complexity Analysis',
      'Pattern Recognition',
      'Code Optimization',
      'Technical Communication',
      'Debugging Skills',
      'System Thinking'
    ]
  },

  studyPlan: {
    beginner: {
      duration: '16 weeks',
      hoursPerWeek: '10-12 hours',
      approach: 'Start with Easy problems, focus on understanding concepts deeply',
      weeklyGoals: 'Complete 1 pattern per week, solve 15-20 problems'
    },
    intermediate: {
      duration: '12 weeks',
      hoursPerWeek: '12-15 hours',
      approach: 'Mix of Easy and Medium problems, focus on pattern recognition',
      weeklyGoals: 'Complete 1-2 patterns per week, solve 25-30 problems'
    },
    advanced: {
      duration: '8 weeks',
      hoursPerWeek: '15-20 hours',
      approach: 'Focus on Medium and Hard problems, optimize solutions',
      weeklyGoals: 'Complete 2 patterns per week, solve 35-40 problems'
    }
  },

  modules: [
    {
      id: 1,
      slug: 'array',
      title: 'Array Fundamentals',
      description: 'Master array manipulation, traversal, and problem-solving techniques',
      difficulty: 'Beginner to Advanced',
      estimatedTime: '1-2 weeks',
      problemCount: 45,
      topics: [
        'Array Basics & Operations',
        'Two Pointers Technique',
        'Sliding Window',
        'Prefix Sum & Difference Array',
        'Matrix Manipulation',
        'Array Sorting & Searching',
        'Kadane\'s Algorithm',
        'Dutch National Flag'
      ],
      theory: {
        fundamentals: `
Arrays are contiguous blocks of memory storing elements of the same type. They provide O(1) access to any element via index.

MEMORY LAYOUT:
- Arrays allocate consecutive memory addresses
- First element at base address, subsequent at base + (index × element_size)
- This enables instant access: address[i] = base_address + i × sizeof(element)

TIME COMPLEXITY:
- Access: O(1) - Direct memory access
- Search: O(n) - Linear scan needed
- Insertion: O(n) - May need to shift elements
- Deletion: O(n) - May need to shift elements

SPACE COMPLEXITY:
- Storage: O(n) for n elements
- In-place operations: O(1) extra space
        `,
        techniques: {
          twoPointers: `
CONCEPT: Use two pointers to iterate through array, one from start and one from end (or same direction with different speeds).

WHEN TO USE:
- Sorted arrays - enables binary search properties
- Palindrome checking
- Container problems (trapping water)
- Merging sorted arrays
- Cycle detection in linked lists

PATTERNS:
1. Opposite Ends: Left pointer at start, right at end
   - Converge when condition met
   - Check elements before moving pointers
   
2. Same Direction: Both pointers moving forward
   - One moves faster (multiplier speed)
   - Useful for cycle detection (Floyd's algorithm)
   
EXAMPLE - Two Sum in Sorted Array:
function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null; // Not found
}
          `,
          slidingWindow: `
CONCEPT: Maintain a window of elements and slide it through the array to solve subarray/substring problems.

TYPES:
1. Fixed Window Size K:
   - Compute result for first k elements
   - Slide window: remove leftmost, add rightmost
   - Each result takes O(1) to update
   
2. Variable Window Size:
   - Expand window: add right element
   - Shrink window: remove from left when condition breaks
   - Track maximum/minimum window while valid

PATTERN:
1. Initialize window and pointers (left=0, right=0)
2. Expand window by moving right pointer
3. When invalid, shrink from left
4. Update result at each valid window

EXAMPLE - Longest Substring Without Repeating:
function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0, left = 0;
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char)) {
      left = Math.max(left, map.get(char) + 1);
    }
    map.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

TIME: O(n) - right pointer goes through each element once, left only moves right
          `
        },
        algorithms: {
          kadanes: `
CONCEPT: Find maximum sum contiguous subarray by maintaining max_current and max_global.

IDEA:
- At each position, decide: extend current subarray or start new one
- Extend if adding current element increases max_current
- Otherwise, start fresh from current element
- Track global maximum seen so far

ALGORITHM:
max_current = 0, max_global = INT_MIN
for each element x in array:
  max_current = max(x, max_current + x)
  max_global = max(max_global, max_current)

WHY IT WORKS:
- If max_current becomes negative, starting fresh is better
- We only keep cumulative sum while it's beneficial
- Subarray problem solved with single pass

EXAMPLE:
arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Trace:
  x=-2: max_current=-2, max_global=-2
  x=1:  max_current=1,  max_global=1
  x=-3: max_current=-2, max_global=1
  x=4:  max_current=4,  max_global=4
  x=-1: max_current=3,  max_global=4
  x=2:  max_current=5,  max_global=5
  x=1:  max_current=6,  max_global=6
Result: 6 (subarray [4,-1,2,1])

TIME: O(n), SPACE: O(1)
          `,
          dutchFlag: `
CONCEPT: Partition array into 3 sections by value with single pass.

PROBLEM: Given array with 3 values (0, 1, 2), sort in-place in one pass.

ALGORITHM:
- Maintain 3 pointers: low, mid, high
- low=0: [0...low-1] contains 0s
- mid=0: [low...mid-1] contains 1s  
- high=n-1: [high+1...n-1] contains 2s
- [mid...high] is unknown region

PROCESS:
while mid <= high:
  if arr[mid] == 0: swap(arr[low], arr[mid]), low++, mid++
  if arr[mid] == 1: mid++
  if arr[mid] == 2: swap(arr[mid], arr[high]), high--

EXAMPLE:
arr = [2, 0, 2, 1, 1, 0]
Initial: low=0, mid=0, high=5
  arr[mid]=2: swap with high, high=4 -> [0,0,2,1,1,2], mid=0
  arr[mid]=0: swap with low, low=1, mid=1 -> [0,0,2,1,1,2]
  arr[mid]=0: skip, mid=2 -> no change
  arr[mid]=2: swap, high=3 -> [0,0,1,1,2,2], mid=2
  arr[mid]=1: mid=3
  mid > high: done
Result: [0,0,1,1,2,2]

TIME: O(n), SPACE: O(1)
          `
        }
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Array Data Structure Deep Dive',
          duration: '45 min',
          description: 'Comprehensive overview of arrays, memory layout, and operations',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Two Pointers Pattern Explained',
          duration: '30 min',
          description: 'Learn when and how to use the two pointers technique',
          difficulty: 'Beginner'
        },
        {
          type: 'video',
          title: 'Sliding Window Technique',
          duration: '40 min',
          description: 'Master the sliding window pattern for subarray problems',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Advanced Array Algorithms',
          duration: '50 min',
          description: 'Kadane\'s algorithm, Dutch National Flag, and more',
          difficulty: 'Advanced'
        },
        {
          type: 'interactive',
          title: 'Array Visualization Tool',
          duration: '20 min',
          description: 'Interactive tool to visualize array operations',
          difficulty: 'All Levels'
        }
      ],
      keyProblems: [
        { id: 1, title: 'Two Sum', difficulty: 'Easy', mustSolve: true },
        { id: 5, title: 'Maximum Subarray', difficulty: 'Easy', mustSolve: true },
        { id: 4, title: 'Product of Array Except Self', difficulty: 'Medium', mustSolve: true },
        { id: 9, title: 'Container With Most Water', difficulty: 'Medium', mustSolve: true },
        { id: 36, title: 'First Missing Positive', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Start with Easy problems to build confidence. Focus on understanding different traversal patterns before moving to optimization.',
      commonMistakes: [
        'Not considering edge cases (empty array, single element)',
        'Forgetting about index boundaries',
        'Inefficient nested loops when better solutions exist',
        'Not handling negative numbers correctly'
      ],
      tips: [
        'Always check if the array is sorted - it opens up binary search',
        'Draw out examples before coding',
        'Consider using hash maps for O(1) lookups',
        'Think about whether you need extra space or can modify in-place'
      ]
    },
    {
      id: 2,
      slug: 'two-pointers',
      title: 'Two Pointers Pattern',
      description: 'Master the two pointers technique for efficient array and linked list problems',
      difficulty: 'Beginner to Intermediate',
      estimatedTime: '1 week',
      problemCount: 35,
      topics: [
        'Opposite Direction Pointers',
        'Same Direction Pointers',
        'Fast & Slow Pointers',
        'Collision Detection',
        'Palindrome Checking',
        'Array Partitioning',
        'Merging Sorted Arrays',
        'Cycle Detection'
      ],
      theory: {
        fundamental: `
TWO POINTERS TECHNIQUE FUNDAMENTALS:

Core Idea: Use two pointers to process array/list from different positions simultaneously.

ADVANTAGES:
- Eliminates nested loops in many cases
- Reduces time complexity from O(n²) to O(n)
- Enables single-pass solutions
- Efficient space usage O(1) extra space

WHEN TO USE:
1. Sorted arrays with pair/triplet problems
2. Partitioning arrays (separation problems)
3. Collision/meeting point detection
4. Palindrome validation
5. Removing/moving elements in-place

KEY INSIGHT:
Since array is sorted, moving pointers maintain monotonic property:
- Moving left pointer right increases values
- Moving right pointer left decreases values
- This eliminates intermediate values from consideration
        `,
        patterns: {
          oppositeDirection: `
PATTERN: One pointer at start, one at end. Move towards center.

TERMINATION: pointers meet or variables satisfy condition

USE CASE: Finding pairs with target sum

ALGORITHM:
1. Initialize: left = 0, right = n-1
2. While left < right:
   - Calculate result from arr[left] and arr[right]
   - If result matches target: found
   - If result < target: left++ (need larger sum)
   - If result > target: right-- (need smaller sum)

EXAMPLE - Container With Most Water:
Area = min(height[left], height[right]) × (right - left)
Move pointer with smaller height (might find taller one)

function maxArea(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;
  
  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    maxArea = Math.max(maxArea, area);
    
    // Move pointer with smaller height
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxArea;
}

TIME: O(n), SPACE: O(1)
          `,
          sameDirection: `
PATTERN: Both pointers move in same direction, different speeds.

USE CASE: Cycle detection, finding middle element

SPEEDS:
- Slow: moves 1 step
- Fast: moves 2 steps (or more)

MATHEMATICAL BASIS (Cycle Detection):
If cycle exists, fast pointer will catch slow pointer.
- Distance fast travels: 2d
- Distance slow travels: d
- From point slow enters cycle: fast moving 2 steps, slow 1 step
- Will meet when: (2d) - d = cycle_length
- Always meets if cycle exists

EXAMPLE - Cycle Detection in Linked List:
function hasCycle(head) {
  let slow = head, fast = head;
  
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

FINDING CYCLE START:
After detecting cycle, reset slow to head.
Move both slow and fast 1 step until they meet.
Meeting point is cycle start.

TIME: O(n), SPACE: O(1)
          `
        },
        edgeCases: `
CRITICAL EDGE CASES FOR TWO POINTERS:

1. Array Length:
   - Empty array: return early
   - Single element: often valid answer
   - Two elements: pointers might meet/cross immediately

2. Duplicate Values:
   - Opposite direction: skip duplicates carefully
   - May need to move both pointers past duplicates safely

3. Pointer Crossing:
   - Ensure left < right before accessing arr[left], arr[right]
   - Crossing is termination condition, not error

4. Off-by-One Errors:
   - Check boundary conditions: left <= right vs left < right
   - Verify last pair is processed

5. In-place Modifications:
   - Track what pointer positions mean
   - Ensure invariant maintained throughout

VALIDATION CHECKLIST:
- Test with arrays of size 0, 1, 2
- Test with all same values
- Test with negative numbers
- Test when answer is first/last element
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Two Pointers Masterclass',
          duration: '35 min',
          description: 'Complete guide to two pointers with multiple examples',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'When to Use Two Pointers',
          duration: '25 min',
          description: 'Pattern recognition guide for two pointer problems',
          difficulty: 'Beginner'
        },
        {
          type: 'video',
          title: 'Fast & Slow Pointers for Cycle Detection',
          duration: '30 min',
          description: 'Floyd\'s algorithm and its applications',
          difficulty: 'Intermediate'
        },
        {
          type: 'practice',
          title: '15 Must-Solve Two Pointer Problems',
          duration: '4 hours',
          description: 'Curated problem set covering all variations',
          difficulty: 'Mixed'
        }
      ],
      keyProblems: [
        { id: 46, title: 'Valid Palindrome', difficulty: 'Easy', mustSolve: true },
        { id: 9, title: 'Container With Most Water', difficulty: 'Medium', mustSolve: true },
        { id: 64, title: 'Trapping Rain Water', difficulty: 'Hard', mustSolve: true },
        { id: 71, title: 'Linked List Cycle', difficulty: 'Easy', mustSolve: true },
        { id: 77, title: 'Find the Duplicate Number', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Understand when pointers move together vs opposite directions. Practice visualizing pointer movement.',
      commonMistakes: [
        'Moving pointers incorrectly based on conditions',
        'Not handling the meeting point correctly',
        'Infinite loops due to wrong termination conditions',
        'Off-by-one errors in pointer positions'
      ],
      tips: [
        'Draw pointer positions at each step',
        'Check if the problem involves pairs or triplets',
        'Consider if sorting would help',
        'Use two pointers when you need O(1) space'
      ]
    },
    {
      id: 3,
      slug: 'sliding-window',
      title: 'Sliding Window Technique',
      description: 'Learn to solve subarray and substring problems efficiently',
      difficulty: 'Intermediate',
      estimatedTime: '1 week',
      problemCount: 30,
      topics: [
        'Fixed Window Size',
        'Variable Window Size',
        'Window with Conditions',
        'Maximum/Minimum in Window',
        'Substring Problems',
        'Frequency Counter in Window',
        'Longest/Shortest Subarray',
        'K-distinct Elements'
      ],
      theory: {
        concept: `
SLIDING WINDOW FUNDAMENTALS:

CORE IDEA: Maintain a contiguous window of elements and slide it through array.
At each position, window [left...right] contains elements relevant to current computation.

OPTIMIZATION PRINCIPLE:
- Instead of recalculating result for each window from scratch: O(n×k)
- Update result incrementally by removing left element, adding right element: O(n)

WHEN TO USE:
1. Subarray/substring problems
2. Contiguous elements with condition
3. K elements/window problems
4. Two string/array problems
5. Any O(n) linear scan after O(n) or O(n²) brute force

TYPES:
1. FIXED SIZE: Window always has k elements
   - Easier: just slide without shrinking
   - Initial window setup, then slide

2. VARIABLE SIZE: Window grows/shrinks based on condition
   - Complex: balance expand and shrink
   - Maintain invariant: current window always satisfies/violates condition
        `,
        fixedWindow: `
FIXED WINDOW PATTERN (Size K):

ALGORITHM:
1. Calculate initial sum/result for first k elements: O(k)
2. Store as current_sum = sum of arr[0...k-1]
3. For each position i from k to n:
   - Remove leftmost: current_sum -= arr[i-k]
   - Add rightmost: current_sum += arr[i]
   - Update result with current_sum

EXAMPLE - Maximum Sum of K Consecutive Elements:
function maxSumSubarray(arr, k) {
  let windowSum = 0;
  
  // Initial window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;
  
  // Slide window
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i-k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}

TRACE: arr=[1,3,-1,-3,5,3,6,7], k=3
i=0: [1,3,-1], sum=3
i=1: [3,-1,-3], sum=-1
i=2: [-1,-3,5], sum=1
i=3: [-3,5,3], sum=5
i=4: [5,3,6], sum=14
i=5: [3,6,7], sum=16 (max)

TIME: O(n), SPACE: O(1)
        `,
        variableWindow: `
VARIABLE WINDOW PATTERN:

ALGORITHM:
1. Initialize: left=0, right=0, window_state
2. EXPAND: Add arr[right] to window
3. While window violated condition:
   - SHRINK: Remove arr[left] from window
   - Move left++
4. Update result with valid window
5. Move right++

KEY INSIGHT: At any point, window [left...right] is MAXIMAL valid window ending at right

EXAMPLE - Longest Substring Without Repeating Characters:
function lengthOfLongestSubstring(s) {
  const charIndex = new Map();
  let maxLen = 0, left = 0;
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    
    // If duplicate exists in window, shrink from left
    if (charIndex.has(char) && charIndex.get(char) >= left) {
      left = charIndex.get(char) + 1;
    }
    
    charIndex.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

TRACE: s = "abcabcbb"
right=0, char='a': left=0, map={a:0}, len=1, maxLen=1
right=1, char='b': left=0, map={a:0,b:1}, len=2, maxLen=2
right=2, char='c': left=0, map={a:0,b:1,c:2}, len=3, maxLen=3
right=3, char='a': duplicate at 0 >= 0, left=1, map={a:3,b:1,c:2}, len=3
right=4, char='b': duplicate at 1 >= 1, left=2, map={a:3,b:4,c:2}, len=3
right=5, char='c': duplicate at 2 >= 2, left=3, map={a:3,b:4,c:5}, len=3
right=6, char='b': duplicate at 4 >= 3, left=5, map={a:3,b:6,c:5}, len=2
right=7, char='b': duplicate at 6 >= 5, left=7, map={a:3,b:7,c:5}, len=1

Result: 3 (for "abc")

TIME: O(n), SPACE: O(min(alphabet_size, n))
        `,
        techniques: `
IMPORTANT WINDOW TECHNIQUES:

1. FREQUENCY TRACKING:
   - Keep hash map of character/element frequencies in window
   - Update frequency when adding/removing from window
   - Common: Find substrings with k distinct characters

2. SLIDING CONDITIONS:
   - Count condition: window contains exactly k elements
   - Sum condition: window sum >= target
   - Frequency condition: all chars appear with required frequency
   - Match conditions: window contains all elements from pattern

3. RIGHT POINTER DRIVEN:
   - Right pointer expands to explore new elements
   - When condition breaks, left pointer shrinks
   - Always process [left...right] window

4. CONSTRAINT MANAGEMENT:
   - Keep counters/maps for window properties
   - When adding element, increment its counter
   - When removing element, decrement its counter
   - Check condition based on current counters
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Sliding Window Pattern Deep Dive',
          duration: '50 min',
          description: 'Complete guide to fixed and variable window problems',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Template for Sliding Window Problems',
          duration: '35 min',
          description: 'Reusable template that works for most window problems',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Sliding Window Techniques',
          duration: '45 min',
          description: 'Handle complex conditions and multiple pointers',
          difficulty: 'Advanced'
        },
        {
          type: 'interactive',
          title: 'Window Visualization Tool',
          duration: '15 min',
          description: 'See how the window expands and contracts',
          difficulty: 'All Levels'
        }
      ],
      keyProblems: [
        { id: 81, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', mustSolve: true },
        { id: 83, title: 'Minimum Window Substring', difficulty: 'Hard', mustSolve: true },
        { id: 91, title: 'Max Consecutive Ones III', difficulty: 'Medium', mustSolve: true },
        { id: 88, title: 'Minimum Size Subarray Sum', difficulty: 'Medium', mustSolve: true },
        { id: 86, title: 'Find All Anagrams in a String', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Master the template first. Identify when window should expand vs contract. Use hash maps for frequency tracking.',
      commonMistakes: [
        'Not knowing when to expand vs shrink the window',
        'Incorrectly updating the frequency map',
        'Missing edge cases with empty strings',
        'Not resetting window state properly'
      ],
      tips: [
        'Keep a frequency map to track window contents',
        'Window should always be valid or actively fixing itself',
        'Use while loop to shrink window when condition breaks',
        'Track both window bounds carefully'
      ]
    },
    {
      id: 4,
      slug: 'fast-slow-pointers',
      title: 'Fast & Slow Pointers',
      description: 'Master Floyd\'s cycle detection and linked list problems',
      difficulty: 'Intermediate',
      estimatedTime: '3-4 days',
      problemCount: 15,
      topics: [
        'Cycle Detection (Floyd\'s Algorithm)',
        'Finding Middle Element',
        'Palindrome Detection',
        'Cycle Start Point',
        'LinkedList Intersection',
        'Reordering Lists',
        'Finding Nth Node from End',
        'Happy Number Problem'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Floyd\'s Cycle Detection Algorithm',
          duration: '40 min',
          description: 'Mathematical proof and implementation',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Fast & Slow Pointers Applications',
          duration: '30 min',
          description: 'All use cases of the tortoise and hare algorithm',
          difficulty: 'Intermediate'
        },
        {
          type: 'interactive',
          title: 'Cycle Detection Visualizer',
          duration: '20 min',
          description: 'See pointers moving through linked lists',
          difficulty: 'All Levels'
        }
      ],
      keyProblems: [
        { id: 112, title: 'Detect Cycle in LinkedList', difficulty: 'Easy', mustSolve: true },
        { id: 113, title: 'Start of Cycle in LinkedList', difficulty: 'Medium', mustSolve: true },
        { id: 111, title: 'Find the Middle Node', difficulty: 'Easy', mustSolve: true },
        { id: 117, title: 'Palindrome Linked List', difficulty: 'Easy', mustSolve: true },
        { id: 115, title: 'Happy Number', difficulty: 'Easy', mustSolve: true }
      ],
      practiceStrategy: 'Understand why fast pointer moves twice as fast. Draw diagrams to visualize pointer movements in cycles.',
      commonMistakes: [
        'Not handling null pointers correctly',
        'Wrong speed ratio for pointers',
        'Not finding cycle start correctly',
        'Modifying the list when it should be preserved'
      ],
      tips: [
        'Fast moves 2x, slow moves 1x for cycle detection',
        'To find middle, fast moves 2x until end',
        'After cycle detected, reset one pointer to start',
        'Always check for null before accessing next'
      ]
    },
    {
      id: 5,
      slug: 'linked-list',
      title: 'Linked List Mastery',
      description: 'Master all linked list operations and patterns',
      difficulty: 'Beginner to Advanced',
      estimatedTime: '1 week',
      problemCount: 25,
      topics: [
        'List Reversal',
        'Merging Lists',
        'List Reordering',
        'Detecting Cycles',
        'List Intersection',
        'Removing Nodes',
        'Copying Lists',
        'Doubly Linked Lists'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Linked List Fundamentals',
          duration: '45 min',
          description: 'Singly and doubly linked lists from scratch',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Pointer Manipulation Techniques',
          duration: '40 min',
          description: 'Master the art of pointer updates',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Linked List Problems',
          duration: '55 min',
          description: 'LRU Cache, skip lists, and more',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { id: 126, title: 'Reverse Linked List', difficulty: 'Easy', mustSolve: true },
        { id: 128, title: 'Reverse Nodes in k-Group', difficulty: 'Hard', mustSolve: true },
        { id: 133, title: 'Merge K Sorted Lists', difficulty: 'Hard', mustSolve: true },
        { id: 134, title: 'Copy List with Random Pointer', difficulty: 'Medium', mustSolve: true },
        { id: 144, title: 'LRU Cache', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Draw out the pointer changes before coding. Practice reversing lists until it becomes second nature.',
      commonMistakes: [
        'Losing reference to nodes during reversal',
        'Not handling edge cases (empty, single node)',
        'Memory leaks in languages without garbage collection',
        'Not updating all necessary pointers'
      ],
      tips: [
        'Use dummy node to simplify edge cases',
        'Draw the pointer changes on paper first',
        'Keep track of prev, curr, and next',
        'Test with lists of length 0, 1, and 2'
      ]
    },
    {
      id: 6,
      slug: 'stack',
      title: 'Stack & Monotonic Stack',
      description: 'Master stack-based solutions and monotonic stack pattern',
      difficulty: 'Beginner to Advanced',
      estimatedTime: '1 week',
      problemCount: 30,
      topics: [
        'Basic Stack Operations',
        'Parentheses Matching',
        'Expression Evaluation',
        'Monotonic Stack',
        'Next Greater Element',
        'Histogram Problems',
        'Stack-based Parsing',
        'Min/Max Stack'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Stack Data Structure Complete Guide',
          duration: '40 min',
          description: 'LIFO principle and common applications',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Monotonic Stack Pattern',
          duration: '45 min',
          description: 'The secret weapon for many hard problems',
          difficulty: 'Advanced'
        },
        {
          type: 'video',
          title: 'Expression Evaluation Using Stacks',
          duration: '50 min',
          description: 'Infix, postfix, and calculator problems',
          difficulty: 'Intermediate'
        }
      ],
      keyProblems: [
        { id: 151, title: 'Valid Parentheses', difficulty: 'Easy', mustSolve: true },
        { id: 153, title: 'Min Stack', difficulty: 'Easy', mustSolve: true },
        { id: 169, title: 'Daily Temperatures', difficulty: 'Medium', mustSolve: true },
        { id: 173, title: 'Largest Rectangle in Histogram', difficulty: 'Hard', mustSolve: true },
        { id: 166, title: 'Decode String', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Recognize when you need to track "most recent" or "waiting for match" - that\'s when stack shines.',
      commonMistakes: [
        'Not checking if stack is empty before pop',
        'Wrong order when building result from stack',
        'Not maintaining auxiliary information in stack',
        'Using stack when simpler solution exists'
      ],
      tips: [
        'Stack for "most recent unmatched" elements',
        'Monotonic stack for "next greater/smaller"',
        'Check stack.isEmpty() before stack.pop()',
        'Use stack to reverse order efficiently'
      ]
    },
    {
      id: 7,
      slug: 'binary-search',
      title: 'Binary Search & Its Variants',
      description: 'Master binary search template and all its applications',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '1-2 weeks',
      problemCount: 35,
      topics: [
        'Classic Binary Search',
        'Search in Rotated Array',
        'First/Last Occurrence',
        'Binary Search on Answer',
        'Peak Finding',
        'Search in 2D Matrix',
        'Capacity Problems',
        'Minimum Maximum Problems'
      ],
      theory: {
        fundamentals: `
BINARY SEARCH FUNDAMENTALS:

CORE REQUIREMENT: Search space must be MONOTONIC
- Monotonic: property is true for a range, false for rest
- Example: sorted array, valid capacity threshold, feasible time

DIVIDE AND CONQUER:
- Eliminate half of search space with each comparison
- O(log n) time complexity

COMPARISON TREE:
- Each node represents comparison with mid element
- Worst case depth: log₂(n)
- For n=1,000,000: log₂(1,000,000) ≈ 20 comparisons

WHY BINARY SEARCH:
Linear search: 1 million comparisons
Binary search: 20 comparisons
THAT'S 50,000X FASTER!

KEY INSIGHT:
If sorted array, ALWAYS consider binary search before O(n) solutions
        `,
        template: `
UNIVERSAL BINARY SEARCH TEMPLATE:

This template handles ALL binary search variations:

function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  
  while (left <= right) {
    // Prevent overflow: left + (right - left) / 2
    const mid = left + Math.floor((right - left) / 2);
    
    if (arr[mid] === target) {
      return mid; // Found
    } else if (arr[mid] < target) {
      left = mid + 1; // Search right
    } else {
      right = mid - 1; // Search left
    }
  }
  
  return -1; // Not found
}

INVARIANT:
- [left...right] contains target if it exists
- left: first element where condition might be true
- right: last element where condition might be true
- When left > right: search space exhausted

WHY left + (right - left) / 2:
- Avoids integer overflow: left + right might exceed max int
- Equivalent to (left + right) / 2 but safer

TEMPLATE VARIATIONS:

1. LEFTMOST OCCURRENCE (First position of target):
   if (arr[mid] >= target) right = mid - 1;
   else left = mid + 1;
   // After loop, left is answer

2. RIGHTMOST OCCURRENCE (Last position of target):
   if (arr[mid] <= target) left = mid + 1;
   else right = mid - 1;
   // After loop, right is answer

3. BINARY SEARCH ON ANSWER:
   while (left < right):
     mid = left + (right - left) / 2
     if (canAchieve(mid)): right = mid
     else: left = mid + 1
   // After loop, left is minimum feasible answer
        `,
        searchOnAnswer: `
BINARY SEARCH ON ANSWER PATTERN:

PROBLEM: Find minimum/maximum value satisfying condition (not searching in array)

APPROACH:
1. Define search space [minValue...maxValue]
2. Define feasibility check: canAchieve(value) -> boolean
3. Binary search to find optimal value

PATTERN:
- Feasibility is MONOTONIC
  Example: canReadBooks(hours = 10) = True, canReadBooks(hours = 20) = True
  If x hours is feasible, then x+1 hours is also feasible
  
- Find MINIMUM feasible value: search right when feasible
- Find MAXIMUM feasible value: search left when feasible

EXAMPLE - Koko Eating Bananas:
Koko eats from piles at speed k bananas/hour.
Find minimum speed k to finish all piles in h hours.

function minEatingSpeed(piles, h) {
  let left = 1, right = Math.max(...piles);
  
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    
    // Calculate hours needed at speed mid
    const hoursNeeded = piles.reduce((sum, p) => 
      sum + Math.ceil(p / mid), 0);
    
    if (hoursNeeded <= h) {
      // Can finish in time, try slower speed
      right = mid;
    } else {
      // Can't finish, need faster speed
      left = mid + 1;
    }
  }
  return left;
}

SEARCH SPACE:
- Minimum speed: 1 banana/hour
- Maximum speed: max(piles) - beyond this is wasteful

FEASIBILITY IS MONOTONIC:
- If can finish at speed k, can also finish at k+1
- Binary search to find minimum feasible speed

TIME: O(n log(max_pile))
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Binary Search From Scratch',
          duration: '35 min',
          description: 'The algorithm that every developer must know',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Binary Search Template',
          duration: '40 min',
          description: 'One template to rule them all - handles all edge cases',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Binary Search on Answer Space',
          duration: '50 min',
          description: 'Advanced technique for optimization problems',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { id: 181, title: 'Binary Search', difficulty: 'Easy', mustSolve: true },
        { id: 190, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', mustSolve: true },
        { id: 198, title: 'Koko Eating Bananas', difficulty: 'Medium', mustSolve: true },
        { id: 200, title: 'Split Array Largest Sum', difficulty: 'Hard', mustSolve: true },
        { id: 211, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Master the template first. Learn to identify search space and feasibility function.',
      commonMistakes: [
        'Off-by-one errors in boundary conditions',
        'Infinite loops from wrong mid calculation',
        'Not handling duplicate elements',
        'Wrong return value for "not found" case'
      ],
      tips: [
        'Use left + (right - left) / 2 to avoid overflow',
        'Think about invariants: what does [left, right] represent',
        'For "binary search on answer", define feasibility check',
        'Always test with arrays of size 0, 1, 2'
      ]
    },
    {
      id: 8,
      slug: 'tree',
      title: 'Binary Trees & BST',
      description: 'Master tree traversals, BST operations, and tree-based algorithms',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '2 weeks',
      problemCount: 40,
      topics: [
        'Tree Traversals (Inorder, Preorder, Postorder)',
        'Level Order Traversal (BFS)',
        'BST Operations',
        'Path Problems',
        'Tree Construction',
        'Lowest Common Ancestor',
        'Serialization',
        'Tree DP'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Binary Trees Complete Course',
          duration: '60 min',
          description: 'Everything about binary trees in one video',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Tree Traversal Patterns',
          duration: '45 min',
          description: 'When to use which traversal',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Tree Algorithms',
          duration: '55 min',
          description: 'LCA, serialization, and tree DP',
          difficulty: 'Advanced'
        },
        {
          type: 'interactive',
          title: 'Tree Visualizer',
          duration: '20 min',
          description: 'Visualize traversals and operations',
          difficulty: 'All Levels'
        }
      ],
      keyProblems: [
        { id: 216, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', mustSolve: true },
        { id: 233, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', mustSolve: true },
        { id: 232, title: 'Lowest Common Ancestor of Binary Tree', difficulty: 'Medium', mustSolve: true },
        { id: 241, title: 'Validate Binary Search Tree', difficulty: 'Medium', mustSolve: true },
        { id: 229, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Master recursion first. Understand when to use DFS vs BFS. Practice drawing recursion trees.',
      commonMistakes: [
        'Confusing left and right subtrees',
        'Not handling null nodes properly',
        'Wrong base case in recursion',
        'Forgetting to return values from recursive calls'
      ],
      tips: [
        'Use recursion for most tree problems',
        'BFS (level order) for level-based problems',
        'For BST, inorder gives sorted order',
        'Post-order for bottom-up calculations'
      ]
    },
    {
      id: 9,
      slug: 'graph',
      title: 'Graph Algorithms',
      description: 'Master graph traversals, shortest paths, and advanced graph algorithms',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '2 weeks',
      problemCount: 35,
      topics: [
        'Graph Representation',
        'DFS & BFS',
        'Cycle Detection',
        'Topological Sort',
        'Union Find',
        'Shortest Path (Dijkstra, Bellman-Ford)',
        'Minimum Spanning Tree',
        'Graph Coloring'
      ],
      theory: {
        fundamentals: `
GRAPH FUNDAMENTALS:

DEFINITION:
Graph G = (V, E) where V = vertices, E = edges connecting vertices

TYPES:
1. DIRECTED: Edges have direction (u → v)
2. UNDIRECTED: Edges bidirectional (u ↔ v)
3. WEIGHTED: Each edge has weight/cost
4. UNWEIGHTED: All edges equal weight

REPRESENTATIONS:
1. ADJACENCY LIST: 
   - Each vertex stores list of adjacent vertices
   - Space: O(V + E)
   - Best for sparse graphs
   - JavaScript: Map or array of arrays

2. ADJACENCY MATRIX:
   - 2D array, matrix[i][j] = edge weight
   - Space: O(V²)
   - Best for dense graphs
   - Fast edge lookup: O(1)

DENSITY:
- Sparse: E ≈ V (E << V²) - use adjacency list
- Dense: E ≈ V² - use adjacency matrix
        `,
        traversal: `
GRAPH TRAVERSAL: DFS VS BFS

DFS (DEPTH-FIRST SEARCH):
ALGORITHM:
1. Start from vertex
2. Explore one branch fully before backtracking
3. Use STACK (recursive or explicit)

Process:
- Visit vertex, mark as visited
- Recursively visit unvisited neighbors
- Backtrack when no unvisited neighbors

CODE:
function dfs(graph, vertex, visited = new Set()) {
  visited.add(vertex);
  console.log(vertex);
  
  for (let neighbor of graph[vertex]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}

USE CASES:
- Topological sorting
- Cycle detection (undirected/directed)
- Path finding
- Backtracking problems

PROPERTIES:
- Time: O(V + E)
- Space: O(V) for recursion stack
- Order: Not guaranteed

BFS (BREADTH-FIRST SEARCH):
ALGORITHM:
1. Start from vertex
2. Visit all neighbors at current depth
3. Then move to next depth level
4. Use QUEUE

CODE:
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  
  while (queue.length) {
    const vertex = queue.shift();
    console.log(vertex);
    
    for (let neighbor of graph[vertex]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}

USE CASES:
- Shortest path (unweighted)
- Level-order traversal
- Connected components
- Social network distance

PROPERTIES:
- Time: O(V + E)
- Space: O(V) for queue
- Order: Level-by-level
- Finds shortest unweighted path
        `,
        advanced: `
ADVANCED GRAPH ALGORITHMS:

UNION-FIND (DISJOINT SET UNION):
Data structure for connectivity queries.

OPERATIONS:
- find(x): Which set does x belong to?
- union(x, y): Merge sets containing x and y

USE CASES:
- Connected components
- Cycle detection in undirected graphs
- Minimum spanning tree (Kruskal's)

IMPLEMENTATION:
class UnionFind {
  constructor(n) {
    this.parent = Array(n).fill(0).map((_, i) => i);
    this.rank = Array(n).fill(0);
  }
  
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }
  
  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false; // Already connected
    
    // Union by rank
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
    return true;
  }
}

DIJKSTRA'S ALGORITHM:
Find shortest path from source to all vertices.
Requires non-negative edge weights.

ALGORITHM:
1. Initialize distances: dist[source] = 0, others = ∞
2. Use min-heap priority queue
3. Extract minimum distance vertex
4. Relax edges: if dist[u] + weight(u,v) < dist[v], update

TIME: O((V + E) log V) with binary heap

TOPOLOGICAL SORT:
Linear ordering of vertices in a DAG.
For each edge u → v, u comes before v in ordering.

ALGORITHM (DFS-based):
1. DFS from unvisited vertices
2. Push to stack after visiting all descendants
3. Stack contains topological order (reverse)

USE CASES:
- Task scheduling with dependencies
- Build systems
- Course prerequisites
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Graph Theory Fundamentals',
          duration: '50 min',
          description: 'Complete introduction to graphs',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'DFS vs BFS - When to Use Which',
          duration: '35 min',
          description: 'Complete guide to graph traversals',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Graph Algorithms',
          duration: '70 min',
          description: 'Dijkstra, Union-Find, and more',
          difficulty: 'Advanced'
        },
        {
          type: 'interactive',
          title: 'Graph Algorithm Visualizer',
          duration: '25 min',
          description: 'See algorithms in action',
          difficulty: 'All Levels'
        }
      ],
      keyProblems: [
        { id: 256, title: 'Number of Islands', difficulty: 'Medium', mustSolve: true },
        { id: 260, title: 'Clone Graph', difficulty: 'Medium', mustSolve: true },
        { id: 270, title: 'Course Schedule', difficulty: 'Medium', mustSolve: true },
        { id: 276, title: 'Network Delay Time', difficulty: 'Medium', mustSolve: true },
        { id: 281, title: 'Word Ladder', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Start with DFS/BFS mastery. Learn to model problems as graphs. Practice Union-Find separately.',
      commonMistakes: [
        'Not marking visited nodes',
        'Wrong graph representation choice',
        'Not handling disconnected components',
        'Inefficient visited tracking'
      ],
      tips: [
        'Use adjacency list for sparse graphs',
        'DFS for paths, BFS for shortest paths',
        'Mark visited to avoid infinite loops',
        'Union-Find for connectivity problems'
      ]
    },
    {
      id: 10,
      slug: 'dynamic-programming',
      title: 'Dynamic Programming',
      description: 'Master the art of breaking problems into subproblems',
      difficulty: 'Advanced',
      estimatedTime: '3-4 weeks',
      problemCount: 50,
      topics: [
        'DP Fundamentals',
        '1D DP',
        '2D DP',
        'Knapsack Problems',
        'LCS & Edit Distance',
        'DP on Strings',
        'DP on Trees',
        'State Machine DP',
        'Digit DP',
        'Bitmask DP'
      ],
      theory: {
        fundamentals: `
DYNAMIC PROGRAMMING FUNDAMENTALS:

WHAT IS DP?
Technique for solving optimization problems by breaking them into overlapping subproblems
and storing results to avoid recomputation.

TWO KEY PROPERTIES:
1. OPTIMAL SUBSTRUCTURE:
   Optimal solution to problem contains optimal solutions to subproblems
   Example: Longest path in a DAG uses longest paths of child problems
   
2. OVERLAPPING SUBPROBLEMS:
   Same subproblem solved multiple times in naive recursion
   Example: fib(5) calls fib(3) twice, fib(2) three times

WITHOUT DP (Exponential):
fib(5) = fib(4) + fib(3)
fib(4) = fib(3) + fib(2)
fib(3) = fib(2) + fib(1) (computed 2+ times!)
Time: O(2^n)

WITH DP (Polynomial):
Store results: dp[1]=1, dp[2]=1
dp[3] = dp[2] + dp[1] = 2
dp[4] = dp[3] + dp[2] = 3
dp[5] = dp[4] + dp[3] = 5
Time: O(n)

WHEN TO USE DP:
- Find optimal value (max/min/count)
- Problem has overlapping subproblems
- Problem has optimal substructure
        `,
        approaches: `
THREE APPROACHES TO DP:

1. MEMOIZATION (Top-Down):
   - Start with recursive solution
   - Add cache to store results
   - Before recursion, check cache
   
   Example:
   memo = {}
   function fib(n):
     if n in memo: return memo[n]
     if n <= 1: return n
     memo[n] = fib(n-1) + fib(n-2)
     return memo[n]

   Advantages:
   - Natural recursive thinking
   - Only compute needed subproblems
   - Intuitive code flow
   
2. TABULATION (Bottom-Up):
   - Create table for all subproblems
   - Fill table iteratively from base cases
   - Answer in final cell
   
   Example:
   dp[0] = 0, dp[1] = 1
   for i from 2 to n:
     dp[i] = dp[i-1] + dp[i-2]
   return dp[n]

   Advantages:
   - Avoids recursion overhead
   - Can optimize space
   - Iterative (no stack overflow)
   
3. SPACE OPTIMIZATION:
   - Recognize which previous states needed
   - Use only required variables instead of table
   
   Example:
   prev, curr = 0, 1
   for i from 2 to n:
     next = prev + curr
     prev, curr = curr, next
   return curr

   Advantages:
   - O(1) space instead of O(n)
   - Best performance
        `,
        patterns: {
          linear1D: `
LINEAR 1D DP (Array DP):

STATE DEFINITION:
dp[i] = optimal value considering elements up to index i

PATTERN:
1. Define what dp[i] represents
2. Write recurrence relation: dp[i] = f(dp[0..i-1])
3. Identify base case(s): dp[0], dp[1], etc
4. Fill table iteratively

EXAMPLE - House Robber:
Cannot rob adjacent houses, maximize total robbed.

dp[i] = max money robbing houses [0...i]
dp[i] = max(dp[i-1], nums[i] + dp[i-2])
- Option 1: Don't rob house i, take dp[i-1]
- Option 2: Rob house i, add to dp[i-२]

BASE: dp[0] = nums[0], dp[1] = max(nums[0], nums[1])

Example: nums = [1,2,3,1]
dp[0] = 1
dp[1] = max(1, 2) = 2
dp[2] = max(2, 3+1) = 4
dp[3] = max(4, 1+2) = 4
Result: 4 (houses 0 and 2)

TIME: O(n), SPACE: O(n) or O(1) with optimization
          `,
          linear2D: `
2D DP (Matrix Problems):

STATE DEFINITION:
dp[i][j] = optimal value considering first i rows, j columns
Or: dp[i][j] = optimal value at position (i,j)

PATTERN:
1. Define dp[i][j] clearly
2. Write recurrence: dp[i][j] = f(dp[i-1][j], dp[i][j-1], ...)
3. Initialize first row and column
4. Fill table iteratively

EXAMPLE - Minimum Path Sum:
Find minimum sum path from top-left to bottom-right.
Can only move right or down.

dp[i][j] = minimum sum to reach (i,j)
dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])

BASE: 
dp[0][0] = grid[0][0]
dp[0][j] = dp[0][j-1] + grid[0][j] (only from left)
dp[i][0] = dp[i-1][0] + grid[i][0] (only from top)

Example: grid = [[1,3,1], [1,5,1], [4,2,1]]
   1  3  4      (going right: 1+3+1)
   2  7  5      (going down: 1+5, right: 1+1)
   6  8  5      (min path: 1+1+1+1+1 = 5)

TIME: O(m×n), SPACE: O(m×n) or O(min(m,n)) with optimization
          `,
          knapsack: `
KNAPSACK DP PROBLEMS:

0/1 KNAPSACK:
Given items with weight and value, maximize value with weight limit W.

STATE:
dp[i][w] = max value using items [0...i-1] with weight limit w

RECURRENCE:
For item i with weight[i] and value[i]:
- Don't take: dp[i][w] = dp[i-1][w]
- Take (if weight[i] <= w): value[i] + dp[i-1][w-weight[i]]
dp[i][w] = max(both options)

Example: items = [(w:2,v:3), (w:3,v:4), (w:4,v:5)], capacity = 5
    0  1  2  3  4  5
0   0  0  0  0  0  0
1   0  0  3  3  3  3  (item 0, w=2, v=3)
2   0  0  3  4  4  7  (item 1, w=３, v=4)
3   0  0  3  4  5  7  (item 2, w=4, v=5)

Best: Take items 0,1: weight=5, value=7

UNBOUNDED KNAPSACK (coins, combinations):
Can use each item multiple times.

dp[w] = min coins to make amount w
dp[w] = min(dp[w], 1 + dp[w-coin]) for each coin

TIME: O(n×W), SPACE: O(W)
          `
        }
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Dynamic Programming from Scratch',
          duration: '90 min',
          description: 'Complete DP course - from basics to advanced',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'DP Pattern Recognition Guide',
          duration: '60 min',
          description: 'Learn to identify DP problems and choose approach',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced DP Techniques',
          duration: '75 min',
          description: 'State optimization, dimension reduction, and more',
          difficulty: 'Advanced'
        },
        {
          type: 'practice',
          title: 'DP Problem Set - 50 Essential Problems',
          duration: '40 hours',
          description: 'Curated set covering all DP patterns',
          difficulty: 'Mixed'
        }
      ],
      keyProblems: [
        { id: 291, title: 'Climbing Stairs', difficulty: 'Easy', mustSolve: true },
        { id: 293, title: 'House Robber', difficulty: 'Medium', mustSolve: true },
        { id: 296, title: 'Coin Change', difficulty: 'Medium', mustSolve: true },
        { id: 302, title: 'Unique Paths', difficulty: 'Medium', mustSolve: true },
        { id: 308, title: 'Longest Palindromic Substring', difficulty: 'Medium', mustSolve: true },
        { id: 311, title: 'Longest Common Subsequence', difficulty: 'Medium', mustSolve: true },
        { id: 312, title: 'Edit Distance', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Start with 1D DP, then 2D. Learn to write recurrence relations. Practice converting recursion to DP.',
      commonMistakes: [
        'Not identifying overlapping subproblems',
        'Wrong state definition',
        'Off-by-one errors in array indexing',
        'Not considering base cases carefully'
      ],
      tips: [
        'Write recursive solution first, then memoize',
        'Clearly define what dp[i] or dp[i][j] represents',
        'Draw state transition diagram',
        'Consider if you can optimize space'
      ]
    },
    {
      id: 11,
      slug: 'backtracking',
      title: 'Backtracking',
      description: 'Master recursive exploration and constraint satisfaction problems',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '1-2 weeks',
      problemCount: 30,
      topics: [
        'Backtracking Fundamentals',
        'Permutations & Combinations',
        'Subset Generation',
        'Constraint Satisfaction',
        'Pruning Techniques',
        'N-Queens Problem',
        'Sudoku Solver',
        'Word Search'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Backtracking Algorithm Explained',
          duration: '45 min',
          description: 'Learn the decision tree approach',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Backtracking Template',
          duration: '35 min',
          description: 'Universal template for backtracking problems',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Backtracking & Pruning',
          duration: '50 min',
          description: 'Optimize your backtracking solutions',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { id: 341, title: 'Subsets', difficulty: 'Medium', mustSolve: true },
        { id: 343, title: 'Permutations', difficulty: 'Medium', mustSolve: true },
        { id: 345, title: 'Combination Sum', difficulty: 'Medium', mustSolve: true },
        { id: 355, title: 'N-Queens', difficulty: 'Hard', mustSolve: true },
        { id: 357, title: 'Sudoku Solver', difficulty: 'Hard', mustSolve: true }
      ],
      practiceStrategy: 'Draw decision trees. Understand the choose-explore-unchoose pattern. Practice identifying when to prune.',
      commonMistakes: [
        'Not backtracking (not undoing choices)',
        'Modifying shared state incorrectly',
        'Not handling duplicate elements',
        'Inefficient pruning or no pruning at all'
      ],
      tips: [
        'Draw the decision tree first',
        'Remember to backtrack (undo changes)',
        'Use visited set or array to track state',
        'Add pruning conditions early'
      ]
    },
    {
      id: 12,
      slug: 'heap',
      title: 'Heap & Priority Queue',
      description: 'Master heap operations and priority queue patterns',
      difficulty: 'Intermediate',
      estimatedTime: '1 week',
      problemCount: 20,
      topics: [
        'Min Heap & Max Heap',
        'Heap Operations',
        'K-th Largest/Smallest',
        'Top K Elements',
        'Merge K Sorted',
        'Median Maintenance',
        'Scheduling Problems',
        'Meeting Rooms'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Heap Data Structure Complete Guide',
          duration: '40 min',
          description: 'Binary heap implementation and operations',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'When to Use a Heap',
          duration: '30 min',
          description: 'Pattern recognition for heap problems',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Heap Applications',
          duration: '45 min',
          description: 'Two heaps, lazy deletion, and more',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { id: 371, title: 'Kth Largest Element in an Array', difficulty: 'Medium', mustSolve: true },
        { id: 375, title: 'K Closest Points to Origin', difficulty: 'Medium', mustSolve: true },
        { id: 381, title: 'Merge K Sorted Lists', difficulty: 'Hard', mustSolve: true },
        { id: 382, title: 'Find Median from Data Stream', difficulty: 'Hard', mustSolve: true },
        { id: 380, title: 'Task Scheduler', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Understand heap invariant. Learn when min heap vs max heap. Practice two heap pattern for median.',
      commonMistakes: [
        'Using wrong heap type (min vs max)',
        'Not maintaining heap property',
        'Inefficient heap operations',
        'Not considering custom comparators'
      ],
      tips: [
        'Use heap when you need min/max repeatedly',
        'Two heaps for median problems',
        'Heap size K for "top K" problems',
        'Consider lazy deletion for efficiency'
      ]
    },
    {
      id: 13,
      slug: 'trie',
      title: 'Trie (Prefix Tree)',
      description: 'Master trie data structure for string problems',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '3-4 days',
      problemCount: 15,
      topics: [
        'Trie Construction',
        'Prefix Search',
        'Word Search',
        'Autocomplete',
        'XOR Trie',
        'Suffix Trie',
        'Word Break Problems',
        'Dictionary Problems'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Trie Data Structure Explained',
          duration: '35 min',
          description: 'Implementation and common operations',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Trie Applications',
          duration: '30 min',
          description: 'When and why to use a trie',
          difficulty: 'Intermediate'
        },
        {
          type: 'video',
          title: 'Advanced Trie Algorithms',
          duration: '40 min',
          description: 'XOR trie, compressed trie, and more',
          difficulty: 'Advanced'
        }
      ],
      keyProblems: [
        { id: 391, title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', mustSolve: true },
        { id: 392, title: 'Design Add and Search Words', difficulty: 'Medium', mustSolve: true },
        { id: 397, title: 'Word Search II', difficulty: 'Hard', mustSolve: true },
        { id: 402, title: 'Maximum XOR of Two Numbers', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Understand trie structure. Practice building trie from scratch. Learn XOR trie for bit manipulation problems.',
      commonMistakes: [
        'Memory inefficiency in implementation',
        'Not handling word endings correctly',
        'Wrong traversal logic',
        'Not considering space optimization'
      ],
      tips: [
        'Each node represents a character',
        'Mark word endings with a flag',
        'Use DFS for word search problems',
        'Consider space-time tradeoffs'
      ]
    },
    {
      id: 14,
      slug: 'greedy',
      title: 'Greedy Algorithms',
      description: 'Master greedy choice property and optimization problems',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '1 week',
      problemCount: 20,
      topics: [
        'Greedy Fundamentals',
        'Activity Selection',
        'Interval Problems',
        'Jump Game',
        'Gas Station',
        'Task Scheduling',
        'Huffman Coding',
        'Fractional Knapsack'
      ],
      studyMaterials: [
        {
          type: 'video',
          title: 'Greedy Algorithms Masterclass',
          duration: '50 min',
          description: 'When greedy works and when it doesn\'t',
          difficulty: 'Intermediate'
        },
        {
          type: 'article',
          title: 'Proving Greedy Correctness',
          duration: '40 min',
          description: 'Learn to verify your greedy approach',
          difficulty: 'Advanced'
        },
        {
          type: 'practice',
          title: '15 Classic Greedy Problems',
          duration: '6 hours',
          description: 'Essential greedy problem patterns',
          difficulty: 'Mixed'
        }
      ],
      keyProblems: [
        { id: 406, title: 'Jump Game', difficulty: 'Medium', mustSolve: true },
        { id: 407, title: 'Jump Game II', difficulty: 'Medium', mustSolve: true },
        { id: 408, title: 'Gas Station', difficulty: 'Medium', mustSolve: true },
        { id: 411, title: 'Partition Labels', difficulty: 'Medium', mustSolve: true },
        { id: 412, title: 'Non-overlapping Intervals', difficulty: 'Medium', mustSolve: true }
      ],
      practiceStrategy: 'Learn to identify greedy choice property. Practice proving correctness. Compare with DP solutions.',
      commonMistakes: [
        'Applying greedy when it doesn\'t work',
        'Wrong sorting criteria',
        'Not considering all edge cases',
        'Not proving correctness'
      ],
      tips: [
        'Sort the input first (often)',
        'Make locally optimal choice',
        'Verify greedy works with small examples',
        'If greedy feels wrong, try DP'
      ]
    }
  ],

    theoryCompanion: {
    problemSolvingFramework: `
  DSA PROBLEM-SOLVING FRAMEWORK:

  STEP 1 - CLASSIFY THE PROBLEM:
  - Data domain: array, string, tree, graph, interval, stream
  - Objective: optimize, count, search, validate, transform
  - Constraints: n size, value bounds, updates, memory limits

  STEP 2 - BASELINE FIRST:
  - Write brute-force approach for correctness clarity
  - Use brute-force as oracle for testing optimized solution

  STEP 3 - IDENTIFY PATTERN SIGNALS:
  - Sorted + search target -> binary search family
  - Contiguous range optimization -> sliding window/prefix sums
  - Overlapping subproblems -> dynamic programming
  - Dependencies and reachability -> graph traversal/topological

  STEP 4 - PROVE OR JUSTIFY:
  - Invariants for loops/pointers
  - Exchange argument for greedy
  - Recurrence + base cases for DP

  STEP 5 - OPTIMIZE WITH TRADE-OFFS:
  - Time vs space (hash map, prefix arrays, memoization)
  - Preprocessing vs query latency
  - In-place mutation vs immutability safety
    `,
    complexityMastery: `
  TIME/SPACE COMPLEXITY MASTERY:

  1. BIG-O, THETA, OMEGA:
  - O: upper bound, worst-case growth
  - Theta: tight bound
  - Omega: lower bound

  2. AMORTIZED ANALYSIS:
  - Occasional expensive operations can still yield cheap average cost
  - Example: dynamic array resize has O(1) amortized append

  3. INPUT-SENSITIVE COMPLEXITY:
  - Distinguish by dimensions (n, m, k) instead of merging blindly
  - Graph often O(V + E), not O(n^2) by default

  4. HIDDEN COSTS:
  - Recursion stack depth
  - Hash collisions and rehashing
  - Sorting prerequisites cost O(n log n)

  5. MEMORY LOCALITY:
  - Arrays often outperform linked structures due to cache behavior
  - Consider practical runtime, not just asymptotics
    `,
    dataStructureSelection: `
  DATA STRUCTURE SELECTION GUIDE:

  ARRAY:
  - Best for index access and contiguous scans
  - Poor for frequent middle insert/delete

  HASH MAP / SET:
  - O(1) average lookup/update
  - Ideal for frequency maps and deduplication

  HEAP:
  - Best for repeated min/max extraction and top-K queries

  BALANCED BST:
  - Ordered operations and range queries

  TRIE:
  - Prefix and dictionary lookups on string sets

  UNION-FIND:
  - Dynamic connectivity and component merge queries

  SELECTION RULE:
  Choose based on dominant operation frequency and required ordering guarantees.
    `,
    correctnessAndTesting: `
  CORRECTNESS AND TESTING STRATEGY:

  1. LOOP INVARIANTS:
  - Define condition that remains true each iteration
  - Use it to reason about termination correctness

  2. EDGE-CASE CHECKLIST:
  - Empty input
  - Single element
  - Duplicates/all-equal values
  - Negative values and zero
  - Maximum constraints

  3. DIFFERENTIAL TESTING:
  - Compare optimized implementation with brute-force on random small inputs

  4. PROPERTY TESTING IDEAS:
  - Sorting output is monotonic and permutation-preserving
  - Shortest path distances satisfy triangle inequality constraints

  5. FAILURE ANALYSIS:
  - Off-by-one errors
  - Overflow in mid calculation or cumulative sums
  - Mutable shared state in recursion/backtracking
    `,
    interviewBlueprint: `
  DSA INTERVIEW BLUEPRINT:

  1. Clarify input/output and constraints
  2. State brute-force and complexity
  3. Derive optimized pattern from constraints
  4. Explain core invariant or recurrence
  5. Write clean implementation with naming clarity
  6. Dry run with representative and edge examples
  7. Provide time/space complexity with justification
  8. Mention alternate approaches and trade-offs

  COMMUNICATION TIP:
  Narrate decisions and discarded options briefly; interviewers value reasoning, not just final code.
    `,
    advancedTechniques: `
  ADVANCED TECHNIQUE OVERVIEW:

  1. MONOTONIC DATA STRUCTURES:
  - Monotonic stack/queue for next greater/smaller and sliding extrema

  2. PREFIX + DIFFERENCE ARRAYS:
  - Fast range update/query transformations

  3. BINARY SEARCH ON ANSWER:
  - Feasibility monotonicity over answer space

  4. TREE EULER TOUR + LCA:
  - Convert subtree problems to range queries

  5. BITMASKING:
  - Compact subset state representation for DP/search

  6. MEET-IN-THE-MIDDLE:
  - Split exponential search to reduce complexity from O(2^n) to O(2^(n/2))
    `,
    antiPatterns: `
  COMMON DSA ANTI-PATTERNS:

  1. Pattern forcing without validating assumptions
  2. Premature micro-optimization before correctness
  3. Ignoring integer overflow and language limits
  4. Overusing recursion without stack-depth awareness
  5. Complex code with poor variable naming and no structure
  6. Not validating algorithm against adversarial cases
    `
    },

  resources: {
    books: [
      {
        title: 'Introduction to Algorithms (CLRS)',
        author: 'Cormen, Leiserson, Rivest, Stein',
        difficulty: 'Advanced',
        topics: ['All DSA Topics'],
        description: 'The definitive computer science textbook'
      },
      {
        title: 'Cracking the Coding Interview',
        author: 'Gayle Laakmann McDowell',
        difficulty: 'Intermediate',
        topics: ['Interview Preparation'],
        description: '189 programming questions and solutions'
      },
      {
        title: 'Elements of Programming Interviews',
        author: 'Aziz, Lee, Prakash',
        difficulty: 'Advanced',
        topics: ['Interview Problems'],
        description: 'Comprehensive interview preparation'
      },
      {
        title: 'Algorithm Design Manual',
        author: 'Steven Skiena',
        difficulty: 'Intermediate',
        topics: ['Algorithm Design'],
        description: 'Practical approach to algorithms'
      }
    ],
    websites: [
      {
        name: 'LeetCode',
        url: 'https://leetcode.com',
        type: 'Practice Platform',
        description: 'Best platform for interview preparation'
      },
      {
        name: 'GeeksforGeeks',
        url: 'https://www.geeksforgeeks.org',
        type: 'Tutorials',
        description: 'Comprehensive tutorials and articles'
      },
      {
        name: 'Visualgo',
        url: 'https://visualgo.net',
        type: 'Visualization',
        description: 'Algorithm visualizations'
      },
      {
        name: 'Big-O Cheat Sheet',
        url: 'https://www.bigocheatsheet.com',
        type: 'Reference',
        description: 'Time and space complexity reference'
      }
    ],
    videos: [
      {
        title: 'MIT 6.006 Introduction to Algorithms',
        platform: 'YouTube',
        instructor: 'MIT OpenCourseWare',
        duration: '24 lectures',
        difficulty: 'Advanced'
      },
      {
        title: 'CS50 Algorithms',
        platform: 'YouTube',
        instructor: 'Harvard University',
        duration: '10 lectures',
        difficulty: 'Beginner'
      }
    ]
  },

  tips: {
    general: [
      'Solve problems consistently every day',
      'Focus on understanding patterns, not memorizing solutions',
      'Always analyze time and space complexity',
      'Start with brute force, then optimize',
      'Practice explaining your solution out loud',
      'Review problems you couldn\'t solve',
      'Track your progress and weak areas'
    ],
    beforeInterview: [
      'Review key patterns one week before',
      'Do mock interviews with peers',
      'Practice on a whiteboard or paper',
      'Time yourself while solving',
      'Prepare questions to ask interviewers',
      'Sleep well the night before'
    ],
    duringInterview: [
      'Ask clarifying questions',
      'Explain your thought process',
      'Start with brute force',
      'Consider edge cases',
      'Test with examples',
      'Communicate complexity analysis'
    ]
  },

  faqs: [
    {
      question: 'How long will it take to complete this path?',
      answer: 'Typically 12-16 weeks with 10-15 hours per week. However, it depends on your experience level and pace.'
    },
    {
      question: 'Do I need to solve all 425 problems?',
      answer: 'Focus on understanding patterns first. Solve the "must-solve" problems in each module, then practice more based on your needs.'
    },
    {
      question: 'What programming language should I use?',
      answer: 'Use the language you\'re most comfortable with. Python, Java, and C++ are most common for interviews.'
    },
    {
      question: 'How do I know if I\'m ready for interviews?',
      answer: 'When you can solve most Medium problems in 30-45 minutes and identify patterns quickly, you\'re ready.'
    },
    {
      question: 'Should I learn all patterns or focus on a few?',
      answer: 'Master the first 8 patterns thoroughly. They cover 80% of interview problems.'
    }
  ]
};

// Function to get problems for a specific module
export const getModuleProblems = (moduleSlug) => {
  const module = dsaLearningPath.modules.find(m => m.slug === moduleSlug);
  if (!module) return [];
  
  return all425Problems.filter(p => {
    const pattern = p.pattern.toLowerCase().replace(/[&\s]/g, '-');
    return pattern.includes(moduleSlug) || moduleSlug.includes(pattern);
  });
};

// Function to get progress for a module
export const getModuleProgress = (moduleSlug, userProgress) => {
  const problems = getModuleProblems(moduleSlug);
  const solved = problems.filter(p => userProgress[`problem_${p.id}`]?.solved).length;
  
  return {
    total: problems.length,
    solved,
    percentage: problems.length > 0 ? Math.round((solved / problems.length) * 100) : 0
  };
};

export default dsaLearningPath;
