import { useMemo } from 'react';

// ── Pattern matchers for complexity detection ──
const TIME_PATTERNS = [
  // O(1)
  { regex: /^(?!.*for\b)(?!.*while\b)(?!.*\.map\b)(?!.*\.filter\b)(?!.*\.reduce\b)[\s\S]{0,200}$/, complexity: 'O(1)', label: 'Constant', color: '#4ade80', score: 100 },

  // O(log n) — binary search patterns
  { regex: /mid\s*=|lo\s*=|hi\s*=|left\s*=.*right|right\s*=.*left|\/\s*2|>>\s*1/, complexity: 'O(log n)', label: 'Logarithmic', color: '#34d399', score: 95 },

  // O(n) — single loop
  { regex: /(?:for|while)\s*[\(\[](?![\s\S]*(?:for|while)\s*[\(\[])/, complexity: 'O(n)', label: 'Linear', color: '#60a5fa', score: 80 },

  // O(n log n) — sort + loop, or divide and conquer
  { regex: /\.sort\s*\(|merge_sort|mergeSort|quickSort|quick_sort|heapSort|heap_sort/, complexity: 'O(n log n)', label: 'Linearithmic', color: '#a78bfa', score: 70 },

  // O(n²) — nested loops
  { regex: /(?:for|while)\s*[\(\[][\s\S]{0,200}(?:for|while)\s*[\(\[]/, complexity: 'O(n²)', label: 'Quadratic', color: '#fbbf24', score: 40 },

  // O(n³) — triple nested
  { regex: /(?:for|while)\s*[\(\[][\s\S]{0,300}(?:for|while)\s*[\(\[][\s\S]{0,300}(?:for|while)\s*[\(\[]/, complexity: 'O(n³)', label: 'Cubic', color: '#fb923c', score: 20 },

  // O(2^n) — recursion with two calls
  { regex: /return\s+\w+\s*\([\s\S]{0,50}\)\s*[+\-\*]\s*\w+\s*\(|fibonacci|fib\s*\(|subset|powerset/, complexity: 'O(2ⁿ)', label: 'Exponential', color: '#f87171', score: 5 },

  // O(n!) — permutation patterns
  { regex: /permut|factorial|n\s*!/, complexity: 'O(n!)', label: 'Factorial', color: '#ef4444', score: 1 },
];

const SPACE_PATTERNS = [
  { regex: /\[\s*\]|\{\s*\}|new\s+(?:Array|List|HashMap|HashSet|dict|set)\b|defaultdict|Counter\b/, complexity: 'O(n)', label: 'Linear space', color: '#60a5fa' },
  { regex: /dp\s*=\s*\[|memo\s*=\s*\{|cache\s*=|@lru_cache|@cache/, complexity: 'O(n)', label: 'Memoization', color: '#a78bfa' },
  { regex: /dp\s*=\s*\[\s*\[|grid\s*=\s*\[\s*\[|matrix\s*=/, complexity: 'O(n²)', label: 'Quadratic space', color: '#fbbf24' },
  { regex: /def\s+\w+\s*\([\s\S]{0,100}\)\s*:[\s\S]{0,200}return\s+\w+\s*\(|function\s+\w+[\s\S]{0,200}return\s+\w+\s*\(/, complexity: 'O(n)', label: 'Recursive stack', color: '#fb923c' },
];

// ── Detect data structures used ──
function detectDataStructures(code) {
  const ds = [];
  if (/\[\s*\]|list\s*\(|Array\s*\(/.test(code)) ds.push({ name: 'Array', color: '#60a5fa' });
  if (/\{\s*\}|dict\s*\(|HashMap|defaultdict|Counter/.test(code)) ds.push({ name: 'Hash Map', color: '#34d399' });
  if (/set\s*\(|HashSet|new Set/.test(code)) ds.push({ name: 'Hash Set', color: '#a78bfa' });
  if (/deque|queue|Queue/.test(code)) ds.push({ name: 'Queue', color: '#fbbf24' });
  if (/stack|Stack|\.append\(.*\.pop\(\)|push.*pop/.test(code)) ds.push({ name: 'Stack', color: '#fb923c' });
  if (/heapq|heappush|heappop|PriorityQueue|MinHeap|MaxHeap/.test(code)) ds.push({ name: 'Heap', color: '#f472b6' });
  if (/TreeNode|ListNode|Node\s*\(|\.next\s*=|\.left\s*=|\.right\s*=/.test(code)) ds.push({ name: 'Tree/LL', color: '#38bdf8' });
  return ds;
}

// ── Detect patterns used ──
function detectPatterns(code) {
  const patterns = [];
  if (/left\s*=.*0.*right\s*=|two.pointer|twoPointer/.test(code)) patterns.push('Two Pointers');
  if (/window|sliding/.test(code)) patterns.push('Sliding Window');
  if (/mid\s*=|binary.search|binarySearch/.test(code)) patterns.push('Binary Search');
  if (/dp\s*=|memo|cache/.test(code)) patterns.push('Dynamic Programming');
  if (/dfs|bfs|visited|queue|stack/.test(code)) patterns.push('Graph Traversal');
  if (/\.sort\s*\(|sorted\s*\(/.test(code)) patterns.push('Sorting');
  if (/prefix|suffix|cumsum|running/.test(code)) patterns.push('Prefix Sum');
  if (/backtrack|permut|subset/.test(code)) patterns.push('Backtracking');
  return patterns;
}

// ── Main analysis function ──
function analyzeComplexity(code, language) {
  if (!code || code.trim().length < 20) return null;

  const normalized = code.toLowerCase();

  // Time complexity — find the worst matching pattern
  let timeResult = { complexity: 'O(n)', label: 'Linear', color: '#60a5fa', score: 80 };
  for (const p of TIME_PATTERNS.slice().reverse()) { // worst first
    if (p.regex.test(normalized)) {
      timeResult = p;
      break;
    }
  }
  // Re-check from worst to best to find the actual worst case
  for (const p of TIME_PATTERNS) {
    if (p.regex.test(normalized) && p.score < timeResult.score) {
      timeResult = p;
    }
  }

  // Space complexity
  let spaceResult = { complexity: 'O(1)', label: 'Constant space', color: '#4ade80' };
  for (const p of SPACE_PATTERNS) {
    if (p.regex.test(normalized)) {
      spaceResult = p;
      break;
    }
  }

  const dataStructures = detectDataStructures(normalized);
  const patterns = detectPatterns(normalized);

  // Count lines of actual code
  const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).length;

  // Suggestions
  const suggestions = [];
  if (timeResult.complexity === 'O(n²)') {
    suggestions.push({ text: 'Nested loops detected — consider a hash map to reduce to O(n)', severity: 'warn' });
  }
  if (timeResult.complexity === 'O(2ⁿ)' || timeResult.complexity === 'O(n!)') {
    suggestions.push({ text: 'Exponential complexity — add memoization or use DP', severity: 'error' });
  }
  if (spaceResult.complexity === 'O(n²)') {
    suggestions.push({ text: 'High space usage — check if 2D DP can be optimized to 1D', severity: 'warn' });
  }
  if (patterns.includes('Dynamic Programming') && !suggestions.length) {
    suggestions.push({ text: 'DP detected — verify base cases and state transitions', severity: 'info' });
  }
  if (dataStructures.some(d => d.name === 'Hash Map') && timeResult.complexity === 'O(n)') {
    suggestions.push({ text: 'Good use of hash map for O(1) lookups', severity: 'success' });
  }

  return { timeResult, spaceResult, dataStructures, patterns, codeLines, suggestions };
}

export function useComplexityAnalyzer(code, language) {
  return useMemo(() => analyzeComplexity(code, language), [code, language]);
}
