/**
 * Curated Assessment Problems
 * High-fidelity, HackerRank / LeetCode authentic problem definitions
 * with precise problem statements, realistic examples, constraints,
 * multi-language starter codes, hints, and approach breakdowns.
 */

export const CURATED_ASSESSMENT_PROBLEMS = {
  'course-schedule': {
    slug: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    topics: ['Graph', 'Topological Sort', 'BFS', 'DFS'],
    points: 100,
    acceptance: 45,
    timeEstimate: 25,
    company: 'Amazon',
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

For example, the pair \`[0, 1]\` indicates that to take course \`0\` you have to first take course \`1\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.`,
    examples: [
      {
        input: 'numCourses = 2, prerequisites = [[1, 0]]',
        output: 'true',
        explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.',
      },
      {
        input: 'numCourses = 2, prerequisites = [[1, 0], [0, 1]]',
        output: 'false',
        explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.',
      },
      {
        input: 'numCourses = 3, prerequisites = [[1, 0], [2, 1]]',
        output: 'true',
        explanation: 'Take course 0 first, then 1, and then course 2. All 3 courses can be completed.',
      },
    ],
    constraints: `1 <= numCourses <= 2000
0 <= prerequisites.length <= 5000
prerequisites[i].length == 2
0 <= ai, bi < numCourses
All the pairs prerequisites[i] are unique.`,
    hints: [
      'This problem is equivalent to detecting whether a cycle exists in a directed graph. If a cycle exists, no valid topological ordering is possible.',
      'Consider using Kahn\'s Algorithm (BFS): count the in-degree of each course. Courses with in-degree 0 can be taken immediately.',
      'Alternatively, perform a DFS cycle check with a 3-state tracking system (0 = unvisited, 1 = visiting/active in recursion stack, 2 = fully visited).',
    ],
    editorial: {
      approach: "Topological Sort via Kahn's Algorithm (BFS)",
      overview: `We model courses as vertices and prerequisites as directed edges. An edge from course B to course A means course B must be completed before course A. A cycle means courses mutually depend on each other and can never be completed.`,
      steps: [
        'Initialize an adjacency list graph and an inDegree array of size numCourses with all zeros.',
        'Populate graph and inDegrees: for each [u, v] in prerequisites, add u to graph[v] and increment inDegree[u].',
        'Add all courses with inDegree == 0 into a BFS queue.',
        'While the queue is non-empty, dequeue a course, increment a completedCourses counter, and decrement the inDegree of all its dependents. If a dependent reaches inDegree == 0, push it to the queue.',
        'Return completedCourses === numCourses.',
      ],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V + E)',
    },
    starter_code: {
      python: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
function canFinish(numCourses, prerequisites) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // Write your solution here
        return true;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        // Write your solution here
        return true;
    }
}
`,
      go: `package main

func canFinish(numCourses int, prerequisites [][]int) bool {
    // Write your solution here
    return true
}
`,
    },
  },

  'lru-cache': {
    slug: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    topics: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
    points: 100,
    acceptance: 42,
    timeEstimate: 25,
    company: 'Amazon',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.`,
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache: {1=1}\nlRUCache.put(2, 2); // cache: {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // evicts key 2, cache: {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // evicts key 1, cache: {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4',
      },
    ],
    constraints: `1 <= capacity <= 3000
0 <= key <= 10^4
0 <= value <= 10^5
At most 2 * 10^5 calls will be made to get and put.`,
    hints: [
      'How do you achieve O(1) key lookups? Use a Hash Table (Map).',
      'How do you achieve O(1) removal and reordering of the least recently used element? Use a Doubly-Linked List with dummy head and tail nodes.',
    ],
    editorial: {
      approach: 'Hash Map + Doubly-Linked List',
      overview: 'A doubly-linked list maintains elements ordered from most recently used (near head) to least recently used (near tail). A hash map stores references to list nodes by key for O(1) access.',
      steps: [
        'Create a Node class containing key, value, prev, and next pointers.',
        'Initialize head and tail dummy sentinel nodes connected to each other.',
        'On get(key): if key exists in map, move the node to the front and return node.val; otherwise return -1.',
        'On put(key, value): if key exists, update value and move node to front. If new key, add to front and insert in map. If size > capacity, remove tail.prev node and delete from map.',
      ],
      timeComplexity: 'O(1) for both get and put',
      spaceComplexity: 'O(capacity)',
    },
    starter_code: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        # Initialize internal storage

    def get(self, key: int) -> int:
        # Return value or -1
        return -1

    def put(self, key: int, value: int) -> None:
        # Insert or update
        pass
`,
      javascript: `/**
 * @param {number} capacity
 */
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
    }

    /** 
     * @param {number} key
     * @return {number}
     */
    get(key) {
        return -1;
    }

    /** 
     * @param {number} key 
     * @param {number} value
     * @return {void}
     */
    put(key, value) {
        
    }
}
`,
      cpp: `#include <unordered_map>
using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        return -1;
    }
    
    void put(int key, int value) {
        
    }
};
`,
      java: `import java.util.*;

class LRUCache {
    public LRUCache(int capacity) {
        
    }
    
    public int get(int key) {
        return -1;
    }
    
    public void put(int key, int value) {
        
    }
}
`,
      go: `package main

type LRUCache struct {
    capacity int
}

func Constructor(capacity int) LRUCache {
    return LRUCache{capacity: capacity}
}

func (this *LRUCache) Get(key int) int {
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    
}
`,
    },
  },

  'number-of-islands': {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    topics: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'],
    points: 100,
    acceptance: 58,
    timeEstimate: 20,
    company: 'Amazon',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      {
        input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
        output: '1',
        explanation: 'All adjacent land cells connect to form 1 single island.',
      },
      {
        input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]',
        output: '3',
        explanation: 'There are 3 disjoint connected land masses.',
      },
    ],
    constraints: `m == grid.length
n == grid[i].length
1 <= m, n <= 300
grid[i][j] is '0' or '1'.`,
    hints: [
      'Treat the grid as an undirected graph where each cell with \'1\' is connected to its 4 cardinal neighbors (up, down, left, right).',
      'Iterate through the grid. When you find a \'1\', increment island count and initiate a BFS/DFS to sink (mark as \'0\') the entire connected island.',
    ],
    editorial: {
      approach: 'Breadth-First Search (BFS) / Depth-First Search (DFS)',
      overview: 'Scan each cell in the matrix. Whenever a cell with value "1" is encountered, it represents the discovery of a new island. We traverse and mark all connected land cells as visited.',
      steps: [
        'Iterate through rows 0 to m-1 and columns 0 to n-1.',
        'If grid[r][c] == "1", increment islandCount by 1.',
        'Trigger dfs(r, c) or bfs(r, c) which marks grid[r][c] = "0" and recursively/iteratively visits valid neighbors (r±1, c) and (r, c±1).',
        'Return islandCount.',
      ],
      timeComplexity: 'O(M × N)',
      spaceComplexity: 'O(M × N) in worst case for recursion stack',
    },
    starter_code: {
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
function numIslands(grid) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Write your solution here
        return 0;
    }
};
`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // Write your solution here
        return 0;
    }
}
`,
      go: `package main

func numIslands(grid [][]byte) int {
    // Write your solution here
    return 0
}
`,
    },
  },

  '3sum': {
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    topics: ['Array', 'Two Pointers', 'Sorting'],
    points: 100,
    acceptance: 34,
    timeEstimate: 25,
    company: 'Meta',
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      {
        input: 'nums = [-1, 0, 1, 2, -1, -4]',
        output: '[[-1, -1, 2], [-1, 0, 1]]',
        explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. Distinct triplets summing to 0 are [-1,-1,2] and [-1,0,1].',
      },
      {
        input: 'nums = [0, 1, 1]',
        output: '[]',
        explanation: 'The only possible triplet does not sum up to 0.',
      },
      {
        input: 'nums = [0, 0, 0]',
        output: '[[0, 0, 0]]',
        explanation: 'The only possible triplet sums up to 0.',
      },
    ],
    constraints: `3 <= nums.length <= 3000
-10^5 <= nums[i] <= 10^5`,
    hints: [
      'Sorting the array makes duplicate detection and two-pointer narrowing straightforward.',
      'Fix the first element nums[i]. Then the problem reduces to finding two numbers that sum to -nums[i] using two pointers.',
      'Skip duplicate values of nums[i], nums[left], and nums[right] to avoid duplicate triplets.',
    ],
    editorial: {
      approach: 'Sort + Two Pointers',
      overview: 'By sorting nums first, we can lock in index i from 0 to n-3 and use two pointers (left = i + 1, right = n - 1) to find complementary pairs in O(n) per fixed index.',
      steps: [
        'Sort nums in non-decreasing order.',
        'Iterate i from 0 to n-1. If i > 0 and nums[i] == nums[i-1], continue to avoid duplicates.',
        'Set left = i + 1, right = n - 1.',
        'Compute sum = nums[i] + nums[left] + nums[right]. If sum == 0, record triplet and advance both pointers skipping duplicate values.',
        'If sum < 0, increment left; if sum > 0, decrement right.',
      ],
      timeComplexity: 'O(N²)',
      spaceComplexity: 'O(1) auxiliary space (excluding output)',
    },
    starter_code: {
      python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        // Write your solution here
        return {};
    }
};
`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // Write your solution here
        return new ArrayList<>();
    }
}
`,
      go: `package main

func threeSum(nums []int) [][]int {
    // Write your solution here
    return [][]int{}
}
`,
    },
  },

  'product-of-array-except-self': {
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    topics: ['Array', 'Prefix Sum'],
    points: 100,
    acceptance: 66,
    timeEstimate: 20,
    company: 'Meta',
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
    examples: [
      {
        input: 'nums = [1, 2, 3, 4]',
        output: '[24, 12, 8, 6]',
        explanation: 'answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, answer[2] = 1*2*4 = 8, answer[3] = 1*2*3 = 6.',
      },
      {
        input: 'nums = [-1, 1, 0, -3, 3]',
        output: '[0, 0, 9, 0, 0]',
        explanation: 'Zero elements produce 0 for all positions except index 2.',
      },
    ],
    constraints: `2 <= nums.length <= 10^5
-30 <= nums[i] <= 30
The product of any prefix or suffix of nums fits in a 32-bit integer.`,
    hints: [
      'Think about splitting the product for each element into two parts: the product of all elements to its left, and the product of all elements to its right.',
      'You can construct the left prefix products in one forward pass, and multiply by the right suffix products in a backward pass.',
    ],
    editorial: {
      approach: 'Prefix and Suffix Running Products',
      overview: 'Each result element answer[i] is prefix[i-1] * suffix[i+1]. We can achieve O(1) auxiliary space by accumulating directly into the output array.',
      steps: [
        'Initialize answer array of length n with 1s.',
        'Forward pass: maintain a running leftPrefix product and set answer[i] = leftPrefix; then leftPrefix *= nums[i].',
        'Backward pass: maintain a running rightSuffix product starting at 1. Multiply answer[i] *= rightSuffix; then rightSuffix *= nums[i].',
        'Return answer.',
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1) extra space (output array does not count toward complexity)',
    },
    starter_code: {
      python: `class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        // Write your solution here
        return {};
    }
};
`,
      java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        // Write your solution here
        return new int[]{};
    }
}
`,
      go: `package main

func productExceptSelf(nums []int) []int {
    // Write your solution here
    return nil
}
`,
    },
  },

  'two-sum': {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topics: ['Array', 'Hash Table'],
    points: 50,
    acceptance: 52,
    timeEstimate: 15,
    company: 'Google',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'nums[1] + nums[2] == 2 + 4 == 6.',
      },
      {
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] == 3 + 3 == 6.',
      },
    ],
    constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
    hints: [
      'A brute force O(N²) approach tests every pair. Can we do it in a single pass?',
      'As you iterate, use a Hash Table to store the complement (target - nums[i]) mapped to its index.',
    ],
    editorial: {
      approach: 'One-Pass Hash Map',
      overview: 'For each number x at index i, check if complement (target - x) is in our hash map. If yes, return [map[complement], i]. Otherwise, record map[x] = i.',
      steps: [
        'Create an empty map.',
        'Iterate i from 0 to nums.length - 1.',
        'Calculate complement = target - nums[i].',
        'If complement is in map, return [map[complement], i].',
        'Set map[nums[i]] = i.',
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
    },
    starter_code: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}
`,
      go: `package main

func twoSum(nums []int, target int) []int {
    // Write your solution here
    return nil
}
`,
    },
  },

  'valid-parentheses': {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topics: ['String', 'Stack'],
    points: 50,
    acceptance: 40,
    timeEstimate: 15,
    company: 'Meta',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    constraints: `1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'.`,
    hints: [
      'Use a stack to keep track of open brackets.',
      'Whenever you encounter a closing bracket, verify that it matches the top of the stack and pop it.',
    ],
    editorial: {
      approach: 'Stack-Based Matching',
      overview: 'Push corresponding closing brackets onto a stack when opening brackets are encountered. For a closing bracket, pop from the stack and verify a match.',
      steps: [
        'Initialize an empty stack.',
        'Iterate through each character in s.',
        'If char is "(", push ")"; if "{", push "}"; if "[", push "]".',
        'Otherwise, if stack is empty or stack.pop() !== char, return false.',
        'After loop, return stack.length === 0.',
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
    },
    starter_code: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your solution here
}
`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}
`,
      go: `package main

func isValid(s string) bool {
    // Write your solution here
    return false
}
`,
    },
  },

  'longest-substring-without-repeating-characters': {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topics: ['Hash Table', 'String', 'Sliding Window'],
    points: 100,
    acceptance: 34,
    timeEstimate: 20,
    company: 'Meta',
    description: `Given a string \`s\`, find the length of the longest substring without duplicate characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Note that "pwke" is a subsequence and not a substring.',
      },
    ],
    constraints: `0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.`,
    hints: [
      'Maintain a sliding window [left, right] of characters.',
      'Use a Map to track the last seen index of each character so you can immediately jump the left pointer forward.',
    ],
    editorial: {
      approach: 'Sliding Window with Index Map',
      overview: 'As right scans from 0 to n-1, if s[right] was previously seen at or after left, advance left to map[s[right]] + 1.',
      steps: [
        'Initialize left = 0, maxLength = 0, and a charMap.',
        'Iterate right from 0 to s.length - 1.',
        'If s[right] is in charMap and charMap[s[right]] >= left, set left = charMap[s[right]] + 1.',
        'Update charMap[s[right]] = right.',
        'Update maxLength = Math.max(maxLength, right - left + 1).',
        'Return maxLength.',
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(min(N, M)) where M is alphabet size',
    },
    starter_code: {
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your solution here
}
`,
      cpp: `#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution here
        return 0;
    }
};
`,
      java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        return 0;
    }
}
`,
      go: `package main

func lengthOfLongestSubstring(s string) int {
    // Write your solution here
    return 0
}
`,
    },
  },

  'trapping-rain-water': {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    points: 150,
    acceptance: 61,
    timeEstimate: 30,
    company: 'Amazon',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are trapped.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
      },
    ],
    constraints: `n == height.length
1 <= n <= 2 * 10^4
0 <= height[i] <= 10^5`,
    hints: [
      'For each element at index i, water trapped is min(maxLeft, maxRight) - height[i].',
      'Instead of precomputing prefix and suffix max arrays, you can use two pointers moving from outside inward.',
    ],
    editorial: {
      approach: 'Two Pointers (Optimal O(1) Space)',
      overview: 'Maintain left and right pointers with leftMax and rightMax. Move the pointer on the smaller max side inward.',
      steps: [
        'Set left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, totalWater = 0.',
        'While left < right: if height[left] < height[right], if height[left] >= leftMax, update leftMax; else add leftMax - height[left] to totalWater; left++.',
        'Else: if height[right] >= rightMax, update rightMax; else add rightMax - height[right] to totalWater; right--.',
        'Return totalWater.',
      ],
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
    starter_code: {
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your solution here
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        // Write your solution here
        return 0;
    }
};
`,
      java: `class Solution {
    public int trap(int[] height) {
        // Write your solution here
        return 0;
    }
}
`,
      go: `package main

func trap(height []int) int {
    // Write your solution here
    return 0
}
`,
    },
  },
};
