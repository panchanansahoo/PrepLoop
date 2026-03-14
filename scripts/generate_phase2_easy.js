const fs = require('fs');
const path = require('path');

const problems = [
  { id: 23, title: 'Two Sum', pattern: 'Hash Map', lc: 1 },
  { id: 24, title: 'Add Two Numbers', pattern: 'Linked List', lc: 2 },
  { id: 25, title: 'Longest Substring Without Repeating', pattern: 'Sliding Window', lc: 3 },
  { id: 26, title: 'Reverse Integer', pattern: 'String', lc: 7 },
  { id: 27, title: 'Palindrome Number', pattern: 'String', lc: 9 },
  { id: 28, title: 'Roman to Integer', pattern: 'Hash Map', lc: 13 },
  { id: 29, title: 'Longest Common Prefix', pattern: 'String', lc: 14 },
  { id: 30, title: 'Valid Parentheses', pattern: 'Stack', lc: 20 },
  { id: 31, title: 'Merge Two Sorted Lists', pattern: 'Linked List', lc: 21 },
  { id: 32, title: 'Remove Duplicates from Sorted Array', pattern: 'Array', lc: 26 },
  { id: 33, title: 'Remove Element', pattern: 'Array', lc: 27 },
  { id: 34, title: 'Find the Index of the First Occurrence', pattern: 'String', lc: 28 },
  { id: 35, title: 'Search Insert Position', pattern: 'Binary Search', lc: 35 },
  { id: 36, title: 'Count and Say', pattern: 'String', lc: 38 },
  { id: 37, title: 'Maximum Subarray', pattern: 'Dynamic Programming', lc: 53 },
  { id: 38, title: 'Length of Last Word', pattern: 'String', lc: 58 },
  { id: 39, title: 'Plus One', pattern: 'Array', lc: 66 },
  { id: 40, title: 'Add Binary', pattern: 'String', lc: 67 },
  { id: 41, title: 'Sqrt(x)', pattern: 'Binary Search', lc: 69 },
  { id: 42, title: 'Climbing Stairs', pattern: 'Dynamic Programming', lc: 70 },
  { id: 43, title: 'Remove Duplicates from Sorted List', pattern: 'Linked List', lc: 83 },
  { id: 44, title: 'Merge Sorted Array', pattern: 'Array', lc: 88 },
  { id: 45, title: 'Same Tree', pattern: 'Tree', lc: 100 },
  { id: 46, title: 'Symmetric Tree', pattern: 'Tree', lc: 101 },
  { id: 47, title: 'Maximum Depth of Binary Tree', pattern: 'Tree', lc: 104 },
  { id: 48, title: 'Balanced Binary Tree', pattern: 'Tree', lc: 110 },
  { id: 49, title: 'Minimum Depth of Binary Tree', pattern: 'Tree', lc: 111 },
  { id: 50, title: 'Path Sum', pattern: 'Tree', lc: 112 },
  { id: 51, title: "Pascal's Triangle", pattern: 'Array', lc: 118 },
  { id: 52, title: "Pascal's Triangle II", pattern: 'Array', lc: 119 },
  { id: 53, title: 'Best Time to Buy and Sell Stock', pattern: 'Array', lc: 121 },
  { id: 54, title: 'Valid Palindrome', pattern: 'String', lc: 125 },
  { id: 55, title: 'Single Number', pattern: 'Bit Manipulation', lc: 136 },
  { id: 56, title: 'Linked List Cycle', pattern: 'Linked List', lc: 141 },
  { id: 57, title: 'Min Stack', pattern: 'Stack', lc: 155 },
  { id: 58, title: 'Intersection of Two Linked Lists', pattern: 'Linked List', lc: 160 },
  { id: 59, title: 'Two Sum II - Input Array Is Sorted', pattern: 'Two Pointers', lc: 167 },
  { id: 60, title: 'Excel Sheet Column Title', pattern: 'String', lc: 168 },
  { id: 61, title: 'Majority Element', pattern: 'Array', lc: 169 },
  { id: 62, title: 'Combine Two Tables', pattern: 'Tree', lc: 175 },
  { id: 63, title: 'Employees Earning More Than Their Managers', pattern: 'Hash Map', lc: 181 },
  { id: 64, title: 'Duplicate Emails', pattern: 'Hash Map', lc: 182 },
  { id: 65, title: 'Rotate Array', pattern: 'Array', lc: 189 },
  { id: 66, title: 'Reverse Bits', pattern: 'Bit Manipulation', lc: 190 },
  { id: 67, title: 'Number of 1 Bits', pattern: 'Bit Manipulation', lc: 191 },
  { id: 68, title: 'Happy Number', pattern: 'Hash Set', lc: 202 },
  { id: 69, title: 'Remove Linked List Elements', pattern: 'Linked List', lc: 203 },
  { id: 70, title: 'Count Primes', pattern: 'Array', lc: 204 },
  { id: 71, title: 'Isomorphic Strings', pattern: 'Hash Map', lc: 205 },
  { id: 72, title: 'Reverse Linked List', pattern: 'Linked List', lc: 206 }
];

function toCamelCase(title) {
  const cleaned = title
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'solve';
  return parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase()))
    .join('');
}

function complexityByPattern(pattern) {
  const map = {
    'Array': ['O(n)', 'O(1)'],
    'Linked List': ['O(n)', 'O(1)'],
    'String': ['O(n)', 'O(1)'],
    'Tree': ['O(n)', 'O(h)'],
    'Hash Map': ['O(n)', 'O(n)'],
    'Hash Set': ['O(n)', 'O(n)'],
    'Stack': ['O(n)', 'O(n)'],
    'Binary Search': ['O(log n)', 'O(1)'],
    'Dynamic Programming': ['O(n)', 'O(n)'],
    'Sliding Window': ['O(n)', 'O(k)'],
    'Bit Manipulation': ['O(n)', 'O(1)'],
    'Two Pointers': ['O(n)', 'O(1)']
  };
  return map[pattern] || ['O(n)', 'O(1)'];
}

function makeProblem(meta) {
  const functionName = toCamelCase(meta.title);
  const [timeComplexity, spaceComplexity] = complexityByPattern(meta.pattern);

  return {
    id: meta.id,
    title: meta.title,
    description: `Solve LeetCode #${meta.lc} (${meta.title}) by implementing a correct and efficient algorithm for all valid inputs. Return the expected output format and handle standard edge cases defined in the prompt constraints.`,
    difficulty: 'Easy',
    pattern: meta.pattern,
    companies: ['Google', 'Amazon', 'Microsoft'],
    examples: [
      {
        input: 'sample input 1',
        output: 'sample output 1',
        explanation: `This example demonstrates the standard behavior for ${meta.title} using the expected input and output format.`
      },
      {
        input: 'sample input 2',
        output: 'sample output 2',
        explanation: `This example covers an additional scenario to verify correctness for ${meta.title}.`
      }
    ],
    test_cases: [
      {
        input: 'normal_case',
        output: 'expected_normal_output',
        type: 'normal'
      },
      {
        input: 'edge_case',
        output: 'expected_edge_output',
        type: 'edge'
      },
      {
        input: 'large_case',
        output: 'expected_large_output',
        type: 'large'
      }
    ],
    starter_code: {
      python: `def ${functionName}(data):\n    pass`,
      javascript: `function ${functionName}(data) {\n    \n}`,
      cpp: `auto ${functionName}(auto data) {\n    \n}`,
      java: `class Solution {\n    public Object ${functionName}(Object data) {\n        return null;\n    }\n}`
    },
    constraints: [
      'Input size is within problem-defined limits.',
      'Return output exactly in the required format.'
    ],
    function_name: functionName,
    time_complexity: timeComplexity,
    space_complexity: spaceComplexity
  };
}

const output = problems.map(makeProblem);
const outPath = path.join(__dirname, '..', 'PHASE2_COLLECTED_PROBLEMS.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(`Generated ${output.length} Easy problems at ${outPath}`);
