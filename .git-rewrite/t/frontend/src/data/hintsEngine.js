/**
 * AI Hints Engine
 * ─────────────────────────────────────────────────
 * Provides multi-level progressive hints, code quality analysis,
 * and pattern-specific optimization tips for the ProblemSolver.
 */

import { PROBLEMS } from './problemsDatabase';

/* ──────────────────── HINT LEVELS ──────────────────── */

export const HINT_LEVELS = [
  {
    level: 1,
    label: 'Nudge',
    icon: '💡',
    color: '#4ade80',
    bgColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
    xpCost: 0,
    description: 'A gentle push in the right direction',
  },
  {
    level: 2,
    label: 'Approach',
    icon: '🧭',
    color: '#facc15',
    bgColor: 'rgba(250,204,21,0.08)',
    borderColor: 'rgba(250,204,21,0.2)',
    xpCost: 5,
    description: 'Strategy outline for solving',
  },
  {
    level: 3,
    label: 'Solution Sketch',
    icon: '🗺️',
    color: '#f87171',
    bgColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.2)',
    xpCost: 15,
    description: 'Step-by-step pseudocode walkthrough',
  },
];

/**
 * Get progressive hints for a problem by ID.
 * Returns an array of { level, text } objects.
 */
export function getHintsForProblem(problemId) {
  const numId = typeof problemId === 'string' ? parseInt(problemId) : problemId;
  const problem = PROBLEMS.find(p => p.id === numId);

  if (!problem || !problem.hints || problem.hints.length === 0) {
    return [
      { level: 1, text: 'Think about the data structures that could help solve this efficiently.' },
      { level: 2, text: 'Consider the time and space trade-offs of different approaches.' },
      { level: 3, text: 'Try breaking the problem into smaller sub-problems and solve each one.' },
    ];
  }

  return problem.hints.map((hint, i) => ({
    level: i + 1,
    text: hint,
  }));
}


/* ──────────────────── CODE QUALITY ANALYZER ──────────────────── */

const CODE_ISSUES = {
  noEdgeCases: {
    id: 'no-edge-cases',
    severity: 'warning',
    icon: '⚠️',
    title: 'Missing Edge Case Handling',
    message: 'Consider handling edge cases like empty input, single element, or null values.',
    patterns: [
      { lang: 'python', check: (code) => !code.includes('if not ') && !code.includes('if len') && !code.includes('is None') && code.length > 50 },
      { lang: 'javascript', check: (code) => !code.includes('if (!') && !code.includes('.length === 0') && !code.includes('=== null') && !code.includes('=== undefined') && code.length > 50 },
      { lang: 'cpp', check: (code) => !code.includes('if (') && code.length > 50 },
      { lang: 'java', check: (code) => !code.includes('== null') && !code.includes('.isEmpty()') && !code.includes('.length == 0') && code.length > 50 },
    ],
  },
  nestedLoops: {
    id: 'nested-loops',
    severity: 'perf',
    icon: '🐌',
    title: 'Nested Loop Detected',
    message: 'Nested loops may result in O(n²) or worse time complexity. Consider using a hash map or sorting for O(n log n).',
    patterns: [
      { lang: 'python', check: (code) => { const m = code.match(/for .+ in .+:/g); return m && m.length >= 2; } },
      { lang: 'javascript', check: (code) => { const m = code.match(/for\s*\(/g); return m && m.length >= 2; } },
      { lang: 'cpp', check: (code) => { const m = code.match(/for\s*\(/g); return m && m.length >= 2; } },
      { lang: 'java', check: (code) => { const m = code.match(/for\s*\(/g); return m && m.length >= 2; } },
    ],
  },
  bruteForce: {
    id: 'brute-force',
    severity: 'info',
    icon: '💪',
    title: 'Possible Brute Force Approach',
    message: 'This looks like a brute force approach. It works, but consider optimizing with the right data structure.',
    patterns: [
      { lang: 'python', check: (code) => code.includes('.sort()') && code.match(/for .+ in .+:/g)?.length >= 2 },
      { lang: 'javascript', check: (code) => code.includes('.sort(') && (code.match(/for\s*\(/g)?.length >= 2 || code.match(/\.forEach/g)?.length >= 2) },
    ],
  },
  noReturn: {
    id: 'no-return',
    severity: 'error',
    icon: '🔴',
    title: 'Missing Return Statement',
    message: 'Your function may not return a value. Make sure all code paths return the expected result.',
    patterns: [
      { lang: 'python', check: (code) => code.includes('def ') && !code.includes('return ') && !code.includes('pass') },
      { lang: 'javascript', check: (code) => code.includes('function ') && !code.includes('return ') && !code.includes('=>') },
    ],
  },
  magicNumbers: {
    id: 'magic-numbers',
    severity: 'style',
    icon: '✨',
    title: 'Magic Numbers',
    message: 'Consider using named constants instead of hard-coded numbers for better readability.',
    patterns: [
      { lang: 'python', check: (code) => /[^0-9][2-9]\d{2,}/.test(code) && !code.includes('10**') },
      { lang: 'javascript', check: (code) => /[^0-9][2-9]\d{2,}/.test(code) && !code.includes('Math.') },
    ],
  },
  emptyCode: {
    id: 'empty-code',
    severity: 'info',
    icon: '📝',
    title: 'Starter Code Only',
    message: 'You haven\'t written any solution yet. Read the problem carefully and start implementing!',
    patterns: [
      { lang: 'python', check: (code) => code.includes('pass') && code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && l.trim() !== 'pass').length <= 3 },
      { lang: 'javascript', check: (code) => code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*')).length <= 3 },
    ],
  },
  globalVariables: {
    id: 'global-vars',
    severity: 'style',
    icon: '🌍',
    title: 'Potential Global State',
    message: 'Using global/class-level variables for tracking state. Consider passing state as parameters for cleaner, more testable code.',
    patterns: [
      { lang: 'python', check: (code) => code.includes('self.') && code.match(/self\.\w+ =/g)?.length > 3 },
      { lang: 'javascript', check: (code) => code.match(/\bvar\b/g)?.length > 0 },
    ],
  },
  recursionNoBase: {
    id: 'recursion-no-base',
    severity: 'warning',
    icon: '🔄',
    title: 'Recursion Without Clear Base Case',
    message: 'Recursive function detected but base case may be missing. Always define base cases to prevent infinite recursion.',
    patterns: [
      { lang: 'python', check: (code) => {
        const fns = code.match(/def (\w+)/g);
        if (!fns) return false;
        return fns.some(fn => {
          const name = fn.replace('def ', '');
          return code.includes(`${name}(`) && code.split(`${name}(`).length > 2 && !code.includes('if ');
        });
      }},
      { lang: 'javascript', check: (code) => {
        const fns = code.match(/function (\w+)/g);
        if (!fns) return false;
        return fns.some(fn => {
          const name = fn.replace('function ', '');
          return code.split(`${name}(`).length > 2 && !code.includes('if (') && !code.includes('if(');
        });
      }},
    ],
  },
};

/**
 * Analyze user code for common issues.
 * @param {string} code - User's source code
 * @param {string} language - 'python' | 'javascript' | 'cpp' | 'java'
 * @returns {Array<{id, severity, icon, title, message}>}
 */
export function analyzeCodeQuality(code, language = 'python') {
  if (!code || code.trim().length === 0) return [];

  const issues = [];

  for (const [, issue] of Object.entries(CODE_ISSUES)) {
    const langPattern = issue.patterns.find(p => p.lang === language);
    if (!langPattern) {
      // Try all-language fallback
      const anyLang = issue.patterns.find(p => p.check(code));
      if (anyLang) {
        issues.push({ id: issue.id, severity: issue.severity, icon: issue.icon, title: issue.title, message: issue.message });
      }
      continue;
    }

    try {
      if (langPattern.check(code)) {
        issues.push({ id: issue.id, severity: issue.severity, icon: issue.icon, title: issue.title, message: issue.message });
      }
    } catch {
      // Skip check if regex fails
    }
  }

  // Add positive feedback if no issues
  if (code.trim().length > 80 && issues.length === 0) {
    issues.push({
      id: 'looks-good',
      severity: 'success',
      icon: '✅',
      title: 'Code Looks Good!',
      message: 'No obvious anti-patterns detected. Run your code to verify correctness.',
    });
  }

  return issues;
}


/* ──────────────────── OPTIMIZATION TIPS ──────────────────── */

const PATTERN_TIPS = {
  'two-pointers': {
    pattern: 'Two Pointers',
    optimal: { time: 'O(n)', space: 'O(1)' },
    tips: [
      'Sort the array first if not already sorted — this enables the two-pointer technique.',
      'Use one pointer at the start and one at the end. Move based on the comparison result.',
      'For "find pair with sum X" problems, if sum < target move left pointer right, if sum > target move right pointer left.',
    ],
    alternatives: ['Hash Map (O(n) time, O(n) space)', 'Brute Force (O(n²) time, O(1) space)'],
  },
  'sliding-window': {
    pattern: 'Sliding Window',
    optimal: { time: 'O(n)', space: 'O(k)' },
    tips: [
      'Maintain a window with two pointers. Expand right, shrink left based on the condition.',
      'Use a hash map or set to track the window contents efficiently.',
      'For fixed-size windows, slide by removing left element and adding right element.',
    ],
    alternatives: ['Brute Force nested loops (O(n×k))', 'Prefix Sum for sum-based problems'],
  },
  'prefix-sum': {
    pattern: 'Prefix Sum',
    optimal: { time: 'O(n)', space: 'O(n)' },
    tips: [
      'Build a prefix sum array where prefix[i] = sum of elements from 0 to i.',
      'Range sum query: sum(i, j) = prefix[j] - prefix[i-1].',
      'For "subarray sum equals k", use a hash map storing prefix sum frequencies.',
    ],
    alternatives: ['Segment Tree for dynamic updates (O(log n))', 'Brute Force (O(n²))'],
  },
  'monotonic-stack': {
    pattern: 'Monotonic Stack',
    optimal: { time: 'O(n)', space: 'O(n)' },
    tips: [
      'Use a stack that maintains elements in increasing or decreasing order.',
      'For "Next Greater Element", process from right to left with a decreasing stack.',
      'Pop elements from stack that violate the monotonic property.',
    ],
    alternatives: ['Brute Force (O(n²))', 'Segment Tree for range queries'],
  },
  'binary-search': {
    pattern: 'Binary Search',
    optimal: { time: 'O(log n)', space: 'O(1)' },
    tips: [
      'Only works on sorted data. Check if input is sorted or can be sorted.',
      'Be careful with mid calculation: use low + (high - low) / 2 to avoid overflow.',
      'For "first/last occurrence", continue searching after finding a match.',
    ],
    alternatives: ['Linear Search (O(n))', 'Interpolation Search for uniform distribution'],
  },
  'dfs': {
    pattern: 'Depth-First Search',
    optimal: { time: 'O(V + E)', space: 'O(V)' },
    tips: [
      'Use recursion or an explicit stack. Mark nodes as visited to avoid cycles.',
      'For path-finding, track the current path and backtrack on dead ends.',
      'For connected components, run DFS from each unvisited node.',
    ],
    alternatives: ['BFS for shortest path', 'Union-Find for connectivity'],
  },
  'bfs': {
    pattern: 'Breadth-First Search',
    optimal: { time: 'O(V + E)', space: 'O(V)' },
    tips: [
      'Use a queue. BFS guarantees shortest path in unweighted graphs.',
      'Process nodes level by level — useful for "minimum steps" problems.',
      'Track visited nodes before enqueuing, not when dequeuing, for efficiency.',
    ],
    alternatives: ['DFS with memoization', 'Dijkstra for weighted graphs'],
  },
  'dp-fibonacci': {
    pattern: 'Dynamic Programming',
    optimal: { time: 'O(n)', space: 'O(1) with optimization' },
    tips: [
      'Identify the recurrence relation: how does the current state depend on previous states?',
      'Start with recursive solution, then add memoization (top-down), then convert to tabulation (bottom-up).',
      'If dp[i] only depends on dp[i-1] and dp[i-2], you can optimize space to O(1).',
    ],
    alternatives: ['Greedy (if optimal substructure allows)', 'Matrix Exponentiation (O(log n))'],
  },
  'backtracking': {
    pattern: 'Backtracking',
    optimal: { time: 'O(2^n) or O(n!)', space: 'O(n)' },
    tips: [
      'Build solution incrementally and abandon ("prune") branches that can\'t lead to valid solutions.',
      'Use a helper function with current state, choices, and result accumulator.',
      'For permutations use swapping, for subsets use include/exclude pattern.',
    ],
    alternatives: ['Iterative enumeration with bitmask', 'Branch and Bound for optimization'],
  },
  'greedy': {
    pattern: 'Greedy',
    optimal: { time: 'O(n log n)', space: 'O(1)' },
    tips: [
      'Sort by the right criteria first (deadline, end time, profit, etc.).',
      'Make the locally optimal choice at each step — prove it leads to global optimum.',
      'Common pattern: sort by end time for interval scheduling, sort by ratio for knapsack.',
    ],
    alternatives: ['Dynamic Programming (always correct but slower)', 'Brute Force (exponential)'],
  },
  'top-k': {
    pattern: 'Top K Elements',
    optimal: { time: 'O(n log k)', space: 'O(k)' },
    tips: [
      'Use a min-heap of size K for "K largest", max-heap for "K smallest".',
      'QuickSelect gives O(n) average case but O(n²) worst case.',
      'For streaming data, heap approach is ideal.',
    ],
    alternatives: ['Sort the array O(n log n)', 'QuickSelect O(n) average', 'Counting Sort O(n+k) for integers'],
  },
  'cyclic-sort': {
    pattern: 'Cyclic Sort',
    optimal: { time: 'O(n)', space: 'O(1)' },
    tips: [
      'When numbers are in range [1, n], place each number at its correct index (num-1).',
      'Swap until current position has the correct number, then move forward.',
      'After sorting, missing/duplicate numbers are revealed by index-value mismatch.',
    ],
    alternatives: ['Hash Set (O(n) time, O(n) space)', 'Sort and scan (O(n log n))'],
  },
  'fast-slow': {
    pattern: 'Fast & Slow Pointers',
    optimal: { time: 'O(n)', space: 'O(1)' },
    tips: [
      'Slow moves 1 step, fast moves 2 steps. They meet inside a cycle.',
      'To find cycle start: reset one pointer to head, move both 1 step until they meet.',
      'Also useful for finding the middle of a linked list.',
    ],
    alternatives: ['Hash Set to store visited nodes (O(n) space)', 'Mark visited nodes (modifies input)'],
  },
  'k-way-merge': {
    pattern: 'K-Way Merge',
    optimal: { time: 'O(n log k)', space: 'O(k)' },
    tips: [
      'Use a min-heap to always pick the smallest element across K lists.',
      'Push the next element from the same list after extracting the minimum.',
      'Divide-and-conquer: merge pairs of lists recursively.',
    ],
    alternatives: ['Merge all into one array and sort (O(n log n))', 'Sequential merge (O(n×k))'],
  },
  'in-place-reversal': {
    pattern: 'In-Place Reversal',
    optimal: { time: 'O(n)', space: 'O(1)' },
    tips: [
      'Use three pointers: previous, current, next.',
      'Save next node, reverse current link, advance all pointers.',
      'For partial reversal (m to n), connect the boundaries properly.',
    ],
    alternatives: ['Stack-based reversal (O(n) space)', 'Recursive reversal (O(n) call stack)'],
  },
};

/**
 * Get optimization tips for a problem based on its patterns.
 * @param {number|string} problemId
 * @returns {{ pattern, optimal, tips, alternatives }[]}
 */
export function getOptimizationTips(problemId) {
  const numId = typeof problemId === 'string' ? parseInt(problemId) : problemId;
  const problem = PROBLEMS.find(p => p.id === numId);

  if (!problem || !problem.patterns) {
    return [PATTERN_TIPS['two-pointers']]; // Sensible default
  }

  const tips = [];
  for (const patternId of problem.patterns) {
    if (PATTERN_TIPS[patternId]) {
      tips.push(PATTERN_TIPS[patternId]);
    }
  }

  return tips.length > 0 ? tips : [PATTERN_TIPS['two-pointers']];
}

/**
 * Get the severity badge color.
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'error': return { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' };
    case 'warning': return { bg: 'rgba(250,204,21,0.1)', text: '#facc15', border: 'rgba(250,204,21,0.25)' };
    case 'perf': return { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.25)' };
    case 'style': return { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa', border: 'rgba(96,165,250,0.25)' };
    case 'info': return { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' };
    case 'success': return { bg: 'rgba(74,222,128,0.1)', text: '#4ade80', border: 'rgba(74,222,128,0.25)' };
    default: return { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' };
  }
}
