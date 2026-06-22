import { supabaseAdmin } from './supabaseClient.js';

const dsaPatterns = [
  {
    name: 'Two Pointers',
    category: 'Array',
    description: 'Use two pointers to traverse array from different directions or speeds',
    difficulty: 'Easy',
    theory: 'Two pointer technique uses two pointers to iterate through an array. This can be useful when we need to find pairs, triplets, or subarrays that satisfy certain conditions.',
    examples: [
      'Finding pairs in sorted array',
      'Container with most water',
      'Remove duplicates from sorted array'
    ]
  },
  {
    name: 'Sliding Window',
    category: 'Array',
    description: 'Maintain a window that slides through the array',
    difficulty: 'Medium',
    theory: 'Sliding window technique involves creating a window which can either be fixed or variable sized and sliding it through the data structure to solve problems efficiently.',
    examples: [
      'Maximum sum subarray of size k',
      'Longest substring without repeating characters',
      'Minimum window substring'
    ]
  },
  {
    name: 'Binary Search',
    category: 'Search',
    description: 'Search in sorted array by repeatedly dividing search interval in half',
    difficulty: 'Medium',
    theory: 'Binary search is an efficient algorithm for finding an item from a sorted list. It works by repeatedly dividing in half the portion of the list that could contain the item.',
    examples: [
      'Search in rotated sorted array',
      'Find peak element',
      'Search in 2D matrix'
    ]
  },
  {
    name: 'Dynamic Programming',
    category: 'Optimization',
    description: 'Break down problems into overlapping subproblems and store results',
    difficulty: 'Hard',
    theory: 'Dynamic programming solves complex problems by breaking them down into simpler subproblems, solving each subproblem only once, and storing their solutions.',
    examples: [
      'Fibonacci sequence',
      'Longest common subsequence',
      'Knapsack problem'
    ]
  },
  {
    name: 'Depth First Search',
    category: 'Graph',
    description: 'Explore as far as possible along each branch before backtracking',
    difficulty: 'Medium',
    theory: 'DFS is an algorithm for traversing or searching tree or graph data structures. It explores as far as possible along each branch before backtracking.',
    examples: [
      'Number of islands',
      'Clone graph',
      'Course schedule'
    ]
  },
  {
    name: 'Breadth First Search',
    category: 'Graph',
    description: 'Explore all neighbors at present depth before moving to next depth',
    difficulty: 'Medium',
    theory: 'BFS is an algorithm for traversing or searching tree or graph data structures. It explores all nodes at the present depth before moving to nodes at the next depth level.',
    examples: [
      'Binary tree level order traversal',
      'Word ladder',
      'Shortest path in unweighted graph'
    ]
  }
];

const problems = [
  {
    pattern_id: 1,
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    difficulty: 'Easy',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }
    ],
    hints: [
      'Use a hash map to store numbers you have seen',
      'For each number, check if target - number exists in the map'
    ],
    solution_approach: 'Use hash map to track complement values',
    starter_code: {
      python: 'def twoSum(nums: List[int], target: int) -> List[int]:\n    # Your code here\n    pass',
      javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}'
    },
    test_cases: [
      { input: [[2,7,11,15], 9], output: [0,1] },
      { input: [[3,2,4], 6], output: [1,2] },
      { input: [[3,3], 6], output: [0,1] }
    ],
    companies: ['Amazon', 'Google', 'Microsoft', 'Facebook'],
    tags: ['array', 'hash-map']
  },
  {
    pattern_id: 2,
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      }
    ],
    hints: [
      'Use sliding window technique',
      'Keep track of characters in current window using a set',
      'Expand window by moving right pointer, shrink by moving left pointer'
    ],
    solution_approach: 'Sliding window with hash set',
    starter_code: {
      python: 'def lengthOfLongestSubstring(s: str) -> int:\n    # Your code here\n    pass',
      javascript: 'function lengthOfLongestSubstring(s) {\n    // Your code here\n}',
      cpp: 'int lengthOfLongestSubstring(string s) {\n    // Your code here\n}'
    },
    test_cases: [
      { input: ['abcabcbb'], output: 3 },
      { input: ['bbbbb'], output: 1 },
      { input: ['pwwkew'], output: 3 }
    ],
    companies: ['Amazon', 'Bloomberg', 'Adobe'],
    tags: ['string', 'sliding-window', 'hash-map']
  },
  {
    pattern_id: 3,
    title: 'Search in Rotated Sorted Array',
    description: 'There is an integer array nums sorted in ascending order. Given the array after rotating and a target value, return the index of target or -1 if not found.',
    difficulty: 'Medium',
    constraints: '1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\nAll values are unique\n-10^4 <= target <= 10^4',
    examples: [
      {
        input: 'nums = [4,5,6,7,0,1,2], target = 0',
        output: '4',
        explanation: '0 is found at index 4'
      }
    ],
    hints: [
      'Use modified binary search',
      'Determine which half is properly sorted',
      'Check if target lies in the sorted half'
    ],
    solution_approach: 'Modified binary search considering rotation',
    starter_code: {
      python: 'def search(nums: List[int], target: int) -> int:\n    # Your code here\n    pass',
      javascript: 'function search(nums, target) {\n    // Your code here\n}',
      cpp: 'int search(vector<int>& nums, int target) {\n    // Your code here\n}'
    },
    test_cases: [
      { input: [[4,5,6,7,0,1,2], 0], output: 4 },
      { input: [[4,5,6,7,0,1,2], 3], output: -1 },
      { input: [[1], 0], output: -1 }
    ],
    companies: ['Facebook', 'LinkedIn', 'Microsoft'],
    tags: ['array', 'binary-search']
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding patterns...');
    for (const pattern of dsaPatterns) {
      const { error } = await supabaseAdmin
        .from('patterns')
        .insert(pattern);
      if (error) {
        console.warn(`  Warning seeding pattern "${pattern.name}":`, error.message);
      }
    }
    
    console.log('🌱 Seeding problems...');
    for (const problem of problems) {
      const { error } = await supabaseAdmin
        .from('problems')
        .insert(problem);
      if (error) {
        console.warn(`  Warning seeding problem "${problem.title}":`, error.message);
      }
    }
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Example of creating a profile with new fields
async function _createExampleProfile() {
  const { data: newProfile, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: 'example-user-id',
      email: 'example@example.com',
      full_name: 'Example User',
      subscription_tier: 'free',
      experience_level: 'intermediate',
      role: 'user',
      
      // New profile fields
      phone: '+1234567890',
      location: 'San Francisco, CA',
      website: 'https://example.com',
      company: 'Tech Corp',
      years_of_experience: '5',
      specialization: 'Frontend Development',
      social_links: {
        twitter: 'example_user',
        linkedin: 'example-user',
        portfolio: 'https://portfolio.example.com',
        dribbble: 'example_user'
      },
      twitter: 'example_user',
      linkedin: 'example-user',
      portfolio: 'https://portfolio.example.com',
      dribbble: 'example_user'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating example profile:', error);
  } else {
    console.log('Example profile created:', newProfile);
  }
}
