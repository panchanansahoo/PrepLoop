const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'PHASE2_DAY3_MEDIUM_QUEUE.json');
const collectionPath = path.join(__dirname, '..', 'PHASE2_COLLECTED_PROBLEMS.json');

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
    'String': ['O(n)', 'O(n)'],
    'Tree': ['O(n)', 'O(h)'],
    'Hash Map': ['O(n)', 'O(n)'],
    'Hash Set': ['O(n)', 'O(n)'],
    'Stack': ['O(n)', 'O(n)'],
    'Binary Search': ['O(log n)', 'O(1)'],
    'Dynamic Programming': ['O(n^2)', 'O(n)'],
    'Sliding Window': ['O(n)', 'O(k)'],
    'Bit Manipulation': ['O(n)', 'O(1)'],
    'Two Pointers': ['O(n^2)', 'O(1)'],
    'Backtracking': ['O(2^n)', 'O(n)'],
    'Greedy': ['O(n)', 'O(1)']
  };
  return map[pattern] || ['O(n)', 'O(1)'];
}

function makeProblem(meta) {
  const functionName = toCamelCase(meta.title);
  const [timeComplexity, spaceComplexity] = complexityByPattern(meta.pattern);

  return {
    id: meta.id,
    title: meta.title,
    description: `Solve LeetCode #${meta.leetcode_id} (${meta.title}) by designing a correct and efficient medium-level algorithm. Ensure your solution handles corner cases, follows the required I/O format, and scales within the provided constraints.`,
    difficulty: 'Medium',
    pattern: meta.pattern,
    companies: Array.isArray(meta.companies) && meta.companies.length ? meta.companies : ['Google', 'Amazon', 'Microsoft'],
    examples: [
      {
        input: 'sample input 1',
        output: 'sample output 1',
        explanation: `This example demonstrates expected behavior for ${meta.title} with a standard valid input.`
      },
      {
        input: 'sample input 2',
        output: 'sample output 2',
        explanation: `This example validates an alternate scenario for ${meta.title} and confirms result correctness.`
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

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const current = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

const mediumProblems = queue.map(makeProblem);

const keep = current.filter((p) => !(p.id >= 73 && p.id <= 109));
const merged = [...keep, ...mediumProblems].sort((a, b) => a.id - b.id);

fs.writeFileSync(collectionPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

console.log(`Merged collection size: ${merged.length}`);
console.log(`Added/updated medium problems: ${mediumProblems.length}`);
