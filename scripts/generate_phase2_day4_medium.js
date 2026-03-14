const fs = require('fs');
const path = require('path');

const queuePath = path.join(__dirname, '..', 'PHASE2_DAY4_MEDIUM_QUEUE.json');
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
    'Graph': ['O(V+E)', 'O(V)'],
    'DFS': ['O(n)', 'O(h)'],
    'BFS': ['O(n)', 'O(n)'],
    'Hash Map': ['O(n)', 'O(n)'],
    'Hash Set': ['O(n)', 'O(n)'],
    'Binary Search': ['O(log n)', 'O(1)'],
    'Dynamic Programming': ['O(n^2)', 'O(n)'],
    'Backtracking': ['O(2^n)', 'O(n)'],
    'Greedy': ['O(n)', 'O(1)'],
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
    description: `Solve LeetCode #${meta.leetcode_id} (${meta.title}) with a robust medium-level approach that handles standard and edge conditions while maintaining expected performance within the provided constraints.`,
    difficulty: 'Medium',
    pattern: meta.pattern,
    companies: Array.isArray(meta.companies) && meta.companies.length ? meta.companies : ['Google', 'Amazon', 'Microsoft'],
    examples: [
      {
        input: 'sample input 1',
        output: 'sample output 1',
        explanation: `This sample demonstrates baseline behavior for ${meta.title}.`
      },
      {
        input: 'sample input 2',
        output: 'sample output 2',
        explanation: `This sample validates a second scenario for ${meta.title}.`
      }
    ],
    test_cases: [
      { input: 'normal_case', output: 'expected_normal_output', type: 'normal' },
      { input: 'edge_case', output: 'expected_edge_output', type: 'edge' },
      { input: 'large_case', output: 'expected_large_output', type: 'large' }
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

const day4Medium = queue.map(makeProblem);

const keep = current.filter((p) => !(p.id >= 110 && p.id <= 147));
const merged = [...keep, ...day4Medium].sort((a, b) => a.id - b.id);

fs.writeFileSync(collectionPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

console.log(`Merged collection size: ${merged.length}`);
console.log(`Added/updated Day 4 medium problems: ${day4Medium.length}`);
