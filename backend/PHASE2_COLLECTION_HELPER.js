/**
 * Phase 2 Data Collection Helper
 * Quick template for collecting problems following the exact schema
 * 
 * Instructions:
 * 1. Open this file in a text editor or browser
 * 2. For each problem, fill in all fields following the examples below
 * 3. Copy the completed problem to PHASE2_COLLECTED_PROBLEMS.json array
 * 4. Run: node validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json
 */

// ============================================================================
// PROBLEM TEMPLATE - Copy and fill for each new problem
// ============================================================================

const PROBLEM_TEMPLATE = {
  // Unique identifier (use 23, 24, 25... continuing from existing 22)
  "id": 23,
  
  // Problem title (must be unique)
  "title": "Two Sum",
  
  // Full problem description (min 50 characters)
  "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to the target. You may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  
  // Easy, Medium, or Hard
  "difficulty": "Easy",
  
  // Must be one of the 25 approved patterns
  "pattern": "Hash Map",
  
  // Array of companies that ask this question
  "companies": ["Google", "Amazon", "Facebook", "Apple"],
  
  // At least 2 examples with input, output, and explanation
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "nums[0] + nums[1] = 2 + 7 = 9, so we return [0,1]"
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "output": "[1,2]",
      "explanation": "nums[1] + nums[2] = 2 + 4 = 6, so we return [1,2]"
    }
  ],
  
  // At least 3 test cases: normal, edge case, large input
  "test_cases": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "type": "normal"
    },
    {
      "input": "nums = [3,3], target = 6",
      "output": "[0,1]",
      "type": "edge"
    },
    {
      "input": "nums = [1,2,3,4,5,6,7,8,9,10], target = 17",
      "output": "[7,8]",
      "type": "large"
    }
  ],
  
  // Starter code for 4 languages (Python, JavaScript, C++, Java)
  "starter_code": {
    "python": `def twoSum(nums: list[int], target: int) -> list[int]:
    """
    Find two numbers that add up to target.
    Args:
        nums: List of integers
        target: Target sum
    Returns:
        List of two indices
    """
    # TODO: Implement solution
    pass`,
    
    "javascript": `function twoSum(nums, target) {
    /**
     * Find two numbers that add up to target
     * @param {number[]} nums - Array of integers
     * @param {number} target - Target sum
     * @return {number[]} - Array of two indices
     */
    // TODO: Implement solution
}`,
    
    "cpp": `vector<int> twoSum(vector<int>& nums, int target) {
    /**
     * Find two numbers that add up to target
     * @param nums: Vector of integers
     * @param target: Target sum
     * @return: Vector of two indices
     */
    // TODO: Implement solution
    vector<int> result;
    return result;
}`,
    
    "java": `class Solution {
    public int[] twoSum(int[] nums, int target) {
        /**
         * Find two numbers that add up to target
         * @param nums: Array of integers
         * @param target: Target sum
         * @return: Array of two indices
         */
        // TODO: Implement solution
        return new int[2];
    }
}`
  },
  
  // Constraints (at least 2, matching LeetCode format)
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists per input"
  ],
  
  // Function name used across all languages
  "function_name": "twoSum",
  
  // Time complexity in Big O notation
  "time_complexity": "O(n)",
  
  // Space complexity in Big O notation
  "space_complexity": "O(n)"
};

// ============================================================================
// QUICK REFERENCE - 25 APPROVED PATTERNS
// ============================================================================

const APPROVED_PATTERNS = [
  "Array",
  "Linked List",
  "Tree",
  "Binary Tree",
  "Binary Search Tree",
  "Graph",
  "String",
  "Stack",
  "Queue",
  "Heap",
  "Hash Map",
  "Hash Set",
  "Dynamic Programming",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Bit Manipulation",
  "Greedy",
  "Trie",
  "Union Find",
  "Topological Sort",
  "DFS",
  "BFS",
  "Matrix",
  "Backtracking"
];

// ============================================================================
// QUICK REFERENCE - TOP COMPANIES (100+)
// ============================================================================

const TOP_COMPANIES = {
  "Tier 1 - Tech Giants": [
    "Google", "Amazon", "Facebook", "Apple", "Microsoft",
    "Netflix", "Meta", "Tesla", "Oracle", "IBM"
  ],
  "Tier 2 - Big Tech": [
    "Adobe", "Airbnb", "Uber", "Lyft", "Twitter",
    "LinkedIn", "Slack", "Stripe", "Dropbox", "Spotify"
  ],
  "Tier 3 - Finance/Trading": [
    "Goldman Sachs", "JP Morgan", "Morgan Stanley", "Citadel",
    "Two Sigma", "Renaissance Technologies", "D.E. Shaw", "Fidelity"
  ],
  "Tier 4 - Startups/Growth": [
    "Airbnb", "Snap", "Yelp", "Pinterest", "DoorDash",
    "Robinhood", "Canva", "Figma", "Notion"
  ],
  "Tier 5 - Hardware/Robotics": [
    "Tesla", "SpaceX", "Nvidia", "AMD", "Qualcomm",
    "Intel", "ARM", "Broadcom"
  ]
};

// ============================================================================
// QUALITY CHECKLIST - VERIFY FOR EACH PROBLEM
// ============================================================================

const QUALITY_CHECKLIST = {
  "1. Uniqueness": "✓ Title not duplicate, problem not already in 22 existing",
  "2. Description": "✓ Complete (50+ chars), explains problem clearly",
  "3. Pattern": "✓ Correct pattern selected from 25 approved",
  "4. Difficulty": "✓ Easy/Medium/Hard matches actual complexity",
  "5. Companies": "✓ At least 1 company, all valid company names",
  "6. Examples": "✓ At least 2, each with input/output/explanation",
  "7. Test Cases": "✓ At least 3 (normal, edge, large)",
  "8. Starter Code": "✓ All 4 languages present and syntactically valid",
  "9. Constraints": "✓ At least 2 constraints matching problem scope",
  "10. Complexity": "✓ Both time and space complexity provided",
  "11. Function Name": "✓ Valid for all 4 languages, matches examples",
  "12. Valid JSON": "✓ All JSON valid, no syntax errors"
};

// ============================================================================
// QUICK START - FIRST 5 PROBLEMS TO COLLECT
// ============================================================================

const QUICK_START_PROBLEMS = [
  {
    title: "Two Sum",
    source: "LeetCode #1",
    difficulty: "Easy",
    pattern: "Hash Map",
    companiesCount: 10,
    hint: "Use a hash map to store values and complements"
  },
  {
    title: "Add Two Numbers",
    source: "LeetCode #2",
    difficulty: "Medium",
    pattern: "Linked List",
    companiesCount: 8,
    hint: "Traverse both lists, handle carry-over"
  },
  {
    title: "Longest Substring Without Repeating Characters",
    source: "LeetCode #3",
    difficulty: "Medium",
    pattern: "Sliding Window",
    companiesCount: 12,
    hint: "Use sliding window with hash map"
  },
  {
    title: "Median of Two Sorted Arrays",
    source: "LeetCode #4",
    difficulty: "Hard",
    pattern: "Binary Search",
    companiesCount: 10,
    hint: "Binary search on smaller array"
  },
  {
    title: "Longest Palindromic Substring",
    source: "LeetCode #5",
    difficulty: "Medium",
    pattern: "String",
    companiesCount: 9,
    hint: "Expand around center or dynamic programming"
  }
];

// ============================================================================
// COLLECTION SOURCES
// ============================================================================

const COLLECTION_SOURCES = {
  "LeetCode": {
    url: "https://leetcode.com/problems",
    pros: "Comprehensive, industry-standard, well-formatted",
    pattern: "LeetCode #[number] - [title]",
    coverage: "Best for all patterns except some specialized ones"
  },
  "HackerRank": {
    url: "https://www.hackerrank.com/challenges",
    pros: "Good for interview prep, clear problem statements",
    pattern: "HackerRank - [title]",
    coverage: "Good coverage of core patterns"
  },
  "GeeksforGeeks": {
    url: "https://www.geeksforgeeks.org/tag/data-structures",
    pros: "Educational, good explanations, diverse problems",
    pattern: "GFG - [title]",
    coverage: "All patterns covered"
  },
  "InterviewBit": {
    url: "https://www.interviewbit.com/problems",
    pros: "Interview-focused, good variety",
    pattern: "IB - [title]",
    coverage: "Core interview patterns"
  },
  "CodeSignal": {
    url: "https://codesignal.com",
    pros: "Real-world problems, good difficulty scaling",
    pattern: "CodeSignal - [title]",
    coverage: "Application-focused problems"
  }
};

// ============================================================================
// COLLECTION WORKFLOW
// ============================================================================

/*
STEP-BY-STEP WORKFLOW FOR EACH PROBLEM:

1. FIND THE PROBLEM
   - Browse LeetCode/HackerRank/GFG for a suitable problem
   - Check it hasn't already been collected (compare title with existing 22)
   - Note: Difficulty, pattern match, companies asking

2. EXTRACT BASIC INFO
   - Copy title, full description (minimum 50 characters)
   - Select appropriate difficulty (Easy/Medium/Hard)
   - Map to one of the 25 approved patterns
   - List 1+ companies that ask this question

3. CREATE EXAMPLES
   - Find or create 2+ examples with clear input/output
   - Write explanation for each example
   - Examples should cover basic and edge cases

4. GENERATE TEST CASES
   - Create minimum 3 test cases:
     * Normal: Standard example
     * Edge: Boundary condition (empty, single, repeated values)
     * Large: Bigger dataset showing scalability
   - Each test case needs input and expected output

5. WRITE STARTER CODE
   - Write function signatures for all 4 languages
   - Python: Include docstring with type hints
   - JavaScript: Include JSDoc comments
   - C++: Include vector/pointer handling
   - Java: Include proper class definition
   - Code should compile but have TODO placeholder

6. ADD CONSTRAINTS
   - Minimum 2 constraints (following LeetCode format)
   - Examples: array size bounds, value bounds, time/space limits

7. CALCULATE COMPLEXITY
   - Determine optimal time complexity (Big O)
   - Determine space complexity (Big O)
   - Consider best solution, not brute force

8. VERIFY QUALITY
   - Run through the 12-point quality checklist
   - Validate JSON structure manually or with validatePhase2Problems.js
   - Check for duplicate titles
   - Ensure all 4 languages present

9. ADD TO COLLECTION
   - Append problem to PHASE2_COLLECTED_PROBLEMS.json
   - Maintain array structure: [{ id, title, ...}, {...}, ...]
   - Continue to next problem

10. TRACK PROGRESS
    - Update PHASE2_DATA_COLLECTION_PLAN.md daily tracker
    - Mark off completed problems
    - Note any issues encountered

TIMING TARGETS:
- Easy problems: ~1.5 minutes average per problem
- Medium problems: ~2 minutes average per problem
- Hard problems: ~2.5 minutes average per problem
- Day 1-2: 50 Easy = ~75 minutes of collection work
- Day 3-4: 75 Medium = ~150 minutes of collection work
- Day 5-6: 50 Hard = ~125 minutes of collection work
- Day 7: Validation and quality assurance = ~60 minutes
- TOTAL: ~410 minutes (~7 hours total work for 175 problems)
*/

// ============================================================================
// TO USE THIS HELPER:
// ============================================================================

/*
1. Start collecting problems from LeetCode or HackerRank
2. For each problem, fill in the PROBLEM_TEMPLATE above
3. Store in PHASE2_COLLECTED_PROBLEMS.json as an array
4. Periodically validate with:
   node validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json

Example PHASE2_COLLECTED_PROBLEMS.json structure:
[
  { id: 1, title: "Problem 1", ... },
  { id: 2, title: "Problem 2", ... },
  { id: 23, title: "Two Sum", ... }  ← New ones starting at 23
]

Then continue collecting until you reach 175 new problems (197 total).
*/

console.log('✅ Phase 2 Collection Helper Loaded');
console.log('📖 Copy the PROBLEM_TEMPLATE above for each new problem');
console.log('🔗 Refer to sources at https://leetcode.com and https://www.hackerrank.com');
console.log('✔️  Validate with: node validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json');
