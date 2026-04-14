/**
 * AI Tutor Content Engine
 * ─────────────────────────────────────────────────
 * Generates structured, guided educational content for
 * DSA patterns, SQL concepts, and Aptitude topics.
 * Uses existing data files — NO external API calls.
 */

import { DSA_TOPICS, DSA_STAGES, TIME_TRACKS } from './dsaLearningPathData';
import { DSA_THEORY } from './dsaTheoryData';
import { PROBLEMS, TOPICS } from './problemsDatabase';
import { FORMULA_SHEETS, APTITUDE_CATEGORIES } from './aptitudeData';
import { SQL_CATEGORIES, SQL_PROBLEMS, SQL_TOPICS } from './sqlProblemsDatabase';
import { SQL_SCHEMAS } from './sqlSchemas';
import { getHintsForProblem, analyzeCodeQuality, getOptimizationTips } from './hintsEngine';

// ═══════════════════════════════════════════════════════
// SECTION A — DSA PATTERN GUIDE
// ═══════════════════════════════════════════════════════

/**
 * Generate a complete pattern guide following the 6-section structure:
 * (1) Intuition, (2) Build-up, (3) Template, (4) Deep Dive,
 * (5) Tricks & Pro Tips, (6) Micro Quiz
 */
export function getDSAPatternGuide(topicId) {
  const topic = DSA_TOPICS.find(t => t.id === topicId);
  if (!topic) return null;

  const theory = DSA_THEORY[topicId];

  return {
    id: topic.id,
    title: topic.title,
    icon: topic.icon,
    color: topic.color,
    difficulty: topic.difficulty,
    estimatedTime: topic.estimatedTime,

    // (1) Intuition
    intuition: {
      heading: '💡 Intuition',
      description: topic.description,
      concepts: topic.concepts.map(c => ({
        title: c.title,
        points: c.points,
      })),
      example: theory?.sections?.[0] ? {
        title: theory.sections[0].title,
        steps: theory.sections[0].steps,
        visual: theory.sections[0].visual || null,
      } : null,
    },

    // (2) Step-by-Step Build-up (brute → optimized)
    buildup: {
      heading: '🔨 From Brute Force to Pattern',
      sections: (theory?.sections || []).slice(0, 3).map(s => ({
        title: s.title,
        steps: s.steps,
        visual: s.visual || null,
        code: s.code || null,
      })),
    },

    // (3) Formal Pattern Template
    template: {
      heading: '📋 Pattern Template',
      whenToApply: topic.thinkingFramework.map(f => ({
        condition: f.condition,
        action: f.action,
      })),
      invariants: topic.invariants,
    },

    // (4) Deep Dive
    deepDive: {
      heading: '🔬 Deep Dive',
      edgeCases: topic.pitfalls,
      thinkingFramework: topic.thinkingFramework,
      variants: topic.concepts.map(c => c.title),
    },

    // (5) Tricks & Pro Tips
    tricks: {
      heading: '⚡ Tricks & Pro Tips',
      items: (topic.tricks || []).map(t => ({
        name: t.name,
        tip: t.tip,
        when: t.when,
        avoid: t.avoid,
      })),
      interviewTips: [
        `Start by stating: "This is a ${topic.title} problem because..."`,
        `Mention the time complexity upfront: typically O(n) or O(n log n) for ${topic.title}`,
        `Walk through invariants: ${topic.invariants?.[0] || 'state the key invariant'}`,
        `Discuss edge cases proactively: ${topic.pitfalls?.[0] || 'empty input, single element'}`,
      ],
    },

    // (6) Micro Quiz & Practice
    practice: {
      heading: '🎯 Practice Problems',
      problems: topic.practiceProblems.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        pattern: p.pattern,
        subPattern: p.pattern,
      })),
    },
  };
}


// ═══════════════════════════════════════════════════════
// DSA PROBLEM ANALYSIS
// ═══════════════════════════════════════════════════════

/**
 * Classify and analyze a DSA problem — topic, pattern, approach, step-by-step plan.
 */
export function getDSAProblemAnalysis(problemId) {
  // Find the problem in database
  const problem = PROBLEMS?.find(p => p.id === problemId);
  if (!problem) return null;

  // Find which DSA topic(s) this problem belongs to
  const matchingTopics = DSA_TOPICS.filter(t =>
    t.practiceProblems?.some(pp => pp.id === problemId)
  );

  const primaryTopic = matchingTopics[0] || null;
  const practiceProblem = primaryTopic?.practiceProblems?.find(pp => pp.id === problemId);

  // Get hints from hints engine
  const hints = getHintsForProblem(problemId) || [];
  const optimizations = getOptimizationTips(problemId) || [];

  return {
    problem: {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description || '',
    },

    // Classification
    classification: {
      topic: primaryTopic?.title || problem.category || 'Unknown',
      pattern: practiceProblem?.pattern || problem.pattern || 'Unknown',
      relatedTopics: matchingTopics.map(t => t.title),
      topicId: primaryTopic?.id || null,
    },

    // How to recognize the pattern
    recognition: primaryTopic ? {
      heading: '🔍 Pattern Recognition',
      clues: primaryTopic.thinkingFramework
        .filter(f => {
          const lower = (f.action || '').toLowerCase();
          const patternLower = (practiceProblem?.pattern || '').toLowerCase();
          return lower.includes(patternLower.split(' ')[0]) || patternLower.includes(lower.split(' ')[0]);
        })
        .slice(0, 3)
        .map(f => `When you see "${f.condition}" → ${f.action}`),
      generalClues: primaryTopic.thinkingFramework.slice(0, 4).map(f =>
        `"${f.condition}" → ${f.action}`
      ),
    } : null,

    // High-level approach
    approach: {
      heading: '🗺️ Approach',
      pattern: practiceProblem?.pattern || 'Unknown',
      steps: _generateApproachSteps(problem, primaryTopic, practiceProblem),
    },

    // Progressive hints
    hints: hints.map((h, i) => ({
      level: i + 1,
      text: h.text || h,
    })),

    // Optimization tips
    optimizations: optimizations,

    // Related practice problems
    relatedProblems: primaryTopic?.practiceProblems
      ?.filter(pp => pp.id !== problemId)
      ?.slice(0, 4)
      ?.map(pp => ({
        id: pp.id,
        title: pp.title,
        difficulty: pp.difficulty,
        pattern: pp.pattern,
      })) || [],
  };
}

function _generateApproachSteps(problem, topic, practiceProblem) {
  const steps = [];
  const pattern = practiceProblem?.pattern || '';

  steps.push(`Identify this as a "${pattern}" problem within ${topic?.title || 'DSA'}`);

  if (pattern.toLowerCase().includes('two pointer')) {
    steps.push('Sort the array if not already sorted');
    steps.push('Initialize left=0 and right=n-1');
    steps.push('Move pointers based on comparison with target');
  } else if (pattern.toLowerCase().includes('sliding window')) {
    steps.push('Initialize left pointer L=0');
    steps.push('Expand window by moving right pointer R');
    steps.push('Shrink window from left when condition breaks');
    steps.push('Update answer when window is valid');
  } else if (pattern.toLowerCase().includes('hash')) {
    steps.push('Initialize a hash map/set');
    steps.push('Iterate through elements, checking complement/existence');
    steps.push('Store element after checking to handle edge cases');
  } else if (pattern.toLowerCase().includes('dfs') || pattern.toLowerCase().includes('bfs')) {
    steps.push('Build adjacency list or traverse tree recursively');
    steps.push('Use visited set to prevent cycles');
    steps.push('Process each node and recurse/enqueue neighbors');
  } else if (pattern.toLowerCase().includes('dp') || pattern.toLowerCase().includes('knapsack')) {
    steps.push('Define state: what does dp[i] (or dp[i][j]) represent?');
    steps.push('Define transitions: how to compute dp[i] from previous states');
    steps.push('Set base cases');
    steps.push('Fill the table bottom-up or use memoization top-down');
  } else if (pattern.toLowerCase().includes('stack') || pattern.toLowerCase().includes('monotonic')) {
    steps.push('Initialize an empty stack');
    steps.push('Process elements left to right');
    steps.push('While stack top violates monotonic property, pop and process');
    steps.push('Push current element');
  } else if (pattern.toLowerCase().includes('binary search')) {
    steps.push('Define search space: lo and hi bounds');
    steps.push('Compute mid = lo + (hi - lo) / 2');
    steps.push('Check condition at mid and narrow search space');
    steps.push('Return answer when lo meets hi');
  } else {
    steps.push('Understand the input constraints and expected output');
    steps.push('Consider brute force first, then optimize');
    steps.push('Apply the identified pattern to achieve target complexity');
  }

  steps.push(`Handle edge cases: ${topic?.pitfalls?.[0] || 'empty input, single element'}`);
  return steps;
}


// ═══════════════════════════════════════════════════════
// CODE REVIEW
// ═══════════════════════════════════════════════════════

/**
 * Structured code review combining code quality analysis and optimization tips.
 */
export function getCodeReview(code, language = 'python', problemId = null) {
  const issues = analyzeCodeQuality(code, language);
  const optimizations = problemId ? getOptimizationTips(problemId) : [];
  const hints = problemId ? getHintsForProblem(problemId) : [];

  // Identify pattern from code
  const detectedPattern = _detectPatternFromCode(code);

  return {
    heading: '🔎 Code Review',

    // Detected approach
    detected: {
      pattern: detectedPattern,
      language: language,
    },

    // Quality issues
    issues: issues.map(issue => ({
      severity: issue.severity,
      icon: issue.icon,
      title: issue.title,
      message: issue.message,
    })),

    // Complexity analysis
    complexity: _estimateComplexity(code),

    // Optimization suggestions
    optimizations: optimizations.map(opt => ({
      pattern: opt.pattern,
      optimal: opt.optimal,
      tips: opt.tips,
    })),

    // Feedback summary
    summary: _generateFeedbackSummary(issues, detectedPattern),
  };
}

function _detectPatternFromCode(code) {
  const lower = code.toLowerCase();
  if (lower.includes('while') && (lower.includes('left') || lower.includes('lo')) && (lower.includes('right') || lower.includes('hi'))) {
    if (lower.includes('mid')) return 'Binary Search';
    return 'Two Pointers';
  }
  if (lower.includes('window') || (lower.includes('left') && lower.includes('right') && lower.includes('max'))) return 'Sliding Window';
  if (lower.includes('stack') || lower.includes('.push') && lower.includes('.pop')) return 'Stack / Monotonic Stack';
  if (lower.includes('queue') || lower.includes('bfs')) return 'BFS';
  if (lower.includes('dfs') || lower.includes('recursion') || lower.includes('backtrack')) return 'DFS / Backtracking';
  if (lower.includes('dp[') || lower.includes('memo')) return 'Dynamic Programming';
  if (lower.includes('map') || lower.includes('dict') || lower.includes('hash') || lower.includes('set(')) return 'Hash Map / Set';
  if (lower.includes('heap') || lower.includes('priority')) return 'Heap / Priority Queue';
  if (lower.includes('sort(') || lower.includes('.sort')) return 'Sorting';
  return 'General';
}

function _estimateComplexity(code) {
  const lower = code.toLowerCase();
  const forLoops = (lower.match(/for\s/g) || []).length;
  const whileLoops = (lower.match(/while\s/g) || []).length;
  const totalLoops = forLoops + whileLoops;

  // Check for nested loops
  const lines = code.split('\n');
  let maxNesting = 0, currentNesting = 0;
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    if (trimmed === '}' || trimmed === '') {
      if (currentNesting > 0) currentNesting--;
    }
  }

  // Check for recursion without constructing a dynamic regular expression.
  const functionMatch = code.match(/function\s+([A-Za-z_]\w*)/);
  let hasRecursion = false;
  if (functionMatch?.[1]) {
    const declaration = functionMatch[0];
    const fnName = functionMatch[1];
    const declarationIndex = code.indexOf(declaration);
    const bodyStart = declarationIndex >= 0 ? declarationIndex + declaration.length : 0;
    const functionBody = code.slice(bodyStart);
    hasRecursion = functionBody.includes(`${fnName}(`);
  }

  let time = 'O(n)';
  let space = 'O(1)';

  if (maxNesting >= 3) time = 'O(n³)';
  else if (maxNesting >= 2) time = 'O(n²)';
  else if (lower.includes('sort(') || lower.includes('.sort')) time = 'O(n log n)';
  else if (lower.includes('mid') && totalLoops >= 1) time = 'O(log n) or O(n log n)';

  if (lower.includes('dp[') || lower.includes('memo') || lower.includes('new array') || lower.includes('[]')) space = 'O(n)';
  if (lower.includes('dp[') && lower.includes('][')) space = 'O(n²)';
  if (lower.includes('map') || lower.includes('set(') || lower.includes('dict')) space = 'O(n)';

  return {
    time,
    space,
    loops: totalLoops,
    nesting: maxNesting,
    hasRecursion,
    note: maxNesting >= 2
      ? '⚠️ Nested loops detected — consider optimizing with a better data structure'
      : '✅ Loop structure looks good',
  };
}

function _generateFeedbackSummary(issues, pattern) {
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const perfs = issues.filter(i => i.severity === 'perf').length;

  if (errors > 0) return `❌ Found ${errors} error(s) that need fixing. Check return statements and edge cases.`;
  if (perfs > 0) return `⚡ Code works but has ${perfs} performance concern(s). Consider optimizing with ${pattern}.`;
  if (warnings > 0) return `⚠️ ${warnings} warning(s) found. Address edge cases for a more robust solution.`;
  return `✅ Code looks good! Using ${pattern} pattern effectively.`;
}


// ═══════════════════════════════════════════════════════
// SECTION C — SQL TOPIC GUIDE
// ═══════════════════════════════════════════════════════

const SQL_CONCEPT_GUIDES = {
  joins: {
    title: 'SQL JOINs',
    icon: '🔗',
    description: 'Combine rows from two or more tables based on a related column.',
    whenToUse: 'When you need data from multiple tables that share a common key (e.g., user_id, order_id).',
    syntax: `-- INNER JOIN: Only matching rows
SELECT a.*, b.*
FROM table_a a
INNER JOIN table_b b ON a.id = b.a_id

-- LEFT JOIN: All from left, matching from right
SELECT a.*, b.*
FROM table_a a
LEFT JOIN table_b b ON a.id = b.a_id

-- RIGHT JOIN: All from right, matching from left
-- FULL OUTER JOIN: All rows from both tables`,
    visual: `INNER JOIN:     LEFT JOIN:      FULL OUTER JOIN:
  ┌─────┐         ┌─────┐           ┌─────┐
  │  A  │●──●│ B │   │█████│●──●│ B │     │█████│●──●│█████│
  └─────┘         └─────┘           └─────┘
Only overlap    All A + match B   All A + All B`,
    pitfalls: [
      'Forgetting ON clause → cartesian product (huge result)',
      'NULL handling in joins — NULLs never match in JOIN conditions',
      'Using WHERE instead of ON for LEFT JOIN filters → converts to INNER JOIN',
      'Self-joins: must use different aliases',
    ],
    practicePrompts: [
      { title: 'Find all employees with their department names', difficulty: 'Easy', hint: 'INNER JOIN employees and departments' },
      { title: 'List all departments, even those with no employees', difficulty: 'Medium', hint: 'LEFT JOIN from departments' },
      { title: 'Find employees who have no manager', difficulty: 'Medium', hint: 'Self JOIN or LEFT JOIN with NULL check' },
      { title: 'Find mutual friends between two users', difficulty: 'Hard', hint: 'Self JOIN on friendships table' },
    ],
  },

  'group-by': {
    title: 'GROUP BY & Aggregations',
    icon: '📊',
    description: 'Group rows sharing a value and compute aggregate functions (COUNT, SUM, AVG, MIN, MAX).',
    whenToUse: 'When you need summary statistics per category (e.g., total sales per region, count of orders per user).',
    syntax: `SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5  -- filter groups, not rows
ORDER BY avg_salary DESC`,
    pitfalls: [
      'Selecting non-aggregated columns not in GROUP BY → error in strict mode',
      'Using WHERE for aggregate conditions instead of HAVING',
      'COUNT(*) vs COUNT(column) — COUNT(*) counts all rows, COUNT(col) ignores NULLs',
      'ORDER BY must use aggregate or GROUP BY columns',
    ],
    practicePrompts: [
      { title: 'Count employees per department', difficulty: 'Easy', hint: 'GROUP BY department' },
      { title: 'Find departments with average salary above 50k', difficulty: 'Medium', hint: 'HAVING AVG(salary) > 50000' },
      { title: 'Top 3 products by total revenue', difficulty: 'Medium', hint: 'GROUP BY + ORDER BY + LIMIT' },
      { title: 'Find duplicate emails', difficulty: 'Easy', hint: 'GROUP BY email HAVING COUNT(*) > 1' },
    ],
  },

  'window-functions': {
    title: 'Window Functions',
    icon: '🪟',
    description: 'Perform calculations across a set of rows related to the current row without collapsing them.',
    whenToUse: 'Rankings, running totals, comparing row to group average, LAG/LEAD for previous/next row.',
    syntax: `-- ROW_NUMBER, RANK, DENSE_RANK
SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn,
  RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rnk
FROM employees

-- Running total
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions

-- LAG / LEAD
SELECT date, price,
  LAG(price, 1) OVER (ORDER BY date) AS prev_price,
  price - LAG(price,1) OVER (ORDER BY date) AS daily_change
FROM stock_prices`,
    pitfalls: [
      'Window functions can NOT be used in WHERE — use a subquery/CTE',
      'ROW_NUMBER vs RANK vs DENSE_RANK: ties handled differently',
      'PARTITION BY is optional — omit it for overall window',
      'ORDER BY in OVER is separate from outer ORDER BY',
    ],
    practicePrompts: [
      { title: 'Find the highest paid employee in each department', difficulty: 'Medium', hint: 'ROW_NUMBER() PARTITION BY department' },
      { title: 'Calculate running total of sales', difficulty: 'Medium', hint: 'SUM() OVER (ORDER BY date)' },
      { title: 'Find day-over-day revenue change', difficulty: 'Medium', hint: 'LAG() function' },
      { title: 'Find median salary per department', difficulty: 'Hard', hint: 'PERCENTILE_CONT or ROW_NUMBER trick' },
    ],
  },

  ctes: {
    title: 'CTEs (Common Table Expressions)',
    icon: '📦',
    description: 'Temporary named result sets that exist only within the scope of a single query.',
    whenToUse: 'Breaking complex queries into readable steps, recursive queries, reusing subqueries.',
    syntax: `WITH active_users AS (
  SELECT user_id, COUNT(*) AS order_count
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY user_id
  HAVING COUNT(*) >= 3
),
user_details AS (
  SELECT u.*, au.order_count
  FROM users u
  JOIN active_users au ON u.id = au.user_id
)
SELECT * FROM user_details ORDER BY order_count DESC`,
    pitfalls: [
      'CTE is re-evaluated each time it\'s referenced (not cached like a temp table)',
      'Recursive CTEs need UNION ALL and a termination condition',
      'Cannot reference a CTE before it\'s defined in the WITH clause',
    ],
    practicePrompts: [
      { title: 'Find users with more than 3 orders using a CTE', difficulty: 'Easy', hint: 'Define order counts in CTE, then filter' },
      { title: 'Build an org chart with recursive CTE', difficulty: 'Hard', hint: 'Recursive CTE with manager_id → employee_id' },
      { title: 'Multi-step report: revenue by category by quarter', difficulty: 'Medium', hint: 'Chain multiple CTEs' },
    ],
  },

  subqueries: {
    title: 'Subqueries',
    icon: '🎯',
    description: 'A query nested inside another query, used in SELECT, FROM, WHERE, or HAVING.',
    whenToUse: 'Filtering against aggregated results, EXISTS checks, correlated comparisons.',
    syntax: `-- Scalar subquery in WHERE
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)

-- IN subquery
SELECT * FROM products
WHERE category_id IN (SELECT id FROM categories WHERE active = true)

-- EXISTS
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)

-- Correlated subquery
SELECT e.name, e.salary,
  (SELECT AVG(salary) FROM employees e2
   WHERE e2.department_id = e.department_id) AS dept_avg
FROM employees e`,
    pitfalls: [
      'Correlated subqueries run for EACH row → can be very slow',
      'Use EXISTS instead of IN when subquery returns many rows',
      'NULL in IN clause: WHERE x NOT IN (1, 2, NULL) → always empty!',
    ],
    practicePrompts: [
      { title: 'Find employees earning above average', difficulty: 'Easy', hint: 'Scalar subquery for AVG' },
      { title: 'Find customers who have never ordered', difficulty: 'Medium', hint: 'NOT EXISTS or LEFT JOIN' },
      { title: 'Second highest salary per department', difficulty: 'Medium', hint: 'Correlated subquery with COUNT' },
    ],
  },
};

/**
 * Get a structured SQL topic guide.
 */
export function getSQLTopicGuide(topicKey) {
  const guide = SQL_CONCEPT_GUIDES[topicKey];
  if (!guide) {
    // Return list of available topics
    return {
      available: Object.keys(SQL_CONCEPT_GUIDES).map(k => ({
        key: k,
        title: SQL_CONCEPT_GUIDES[k].title,
        icon: SQL_CONCEPT_GUIDES[k].icon,
      })),
    };
  }
  return guide;
}

/**
 * Get SQL query building guidance for a specific problem.
 */
export function getSQLQueryHelp(problemId) {
  const problem = SQL_PROBLEMS?.find(p => p.id === problemId);
  if (!problem) return null;

  const schema = problem.schemaId ? SQL_SCHEMAS?.[problem.schemaId] : null;

  // Determine which SQL concepts are relevant
  const relevantConcepts = [];
  const topics = problem.topics || [];
  if (topics.some(t => t.includes('JOIN'))) relevantConcepts.push('joins');
  if (topics.includes('GROUP BY') || topics.includes('HAVING')) relevantConcepts.push('group-by');
  if (topics.some(t => ['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'NTILE', 'PERCENT_RANK'].includes(t))) relevantConcepts.push('window-functions');
  if (topics.includes('CTE') || topics.includes('WITH')) relevantConcepts.push('ctes');
  if (topics.includes('Subquery') || topics.includes('EXISTS') || topics.includes('IN')) relevantConcepts.push('subqueries');

  return {
    problem: {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description,
      category: problem.category,
    },

    schema: schema ? {
      tables: Object.keys(schema).map(tableName => ({
        name: tableName,
        columns: schema[tableName]?.columns || [],
      })),
    } : null,

    approach: {
      heading: '🗺️ Query Building Steps',
      requirement: problem.description || problem.title,
      concepts: relevantConcepts.map(key => SQL_CONCEPT_GUIDES[key]?.title || key),
      steps: _generateSQLSteps(problem, relevantConcepts),
    },

    hints: (problem.hints || []).map((h, i) => ({
      level: i + 1,
      text: h,
    })),

    explanation: problem.explanation || null,
  };
}

function _generateSQLSteps(problem, concepts) {
  const steps = [];
  steps.push(`Restate: "${problem.title}" — understand what output is expected`);

  if (concepts.includes('joins')) {
    steps.push('Identify which tables need to be joined and on which key');
    steps.push('Choose the right JOIN type (INNER vs LEFT vs FULL)');
  }
  if (concepts.includes('group-by')) {
    steps.push('Determine GROUP BY columns — what are you aggregating by?');
    steps.push('Apply aggregate functions (COUNT, SUM, AVG, etc.)');
    steps.push('Use HAVING for aggregate-level filters (not WHERE)');
  }
  if (concepts.includes('window-functions')) {
    steps.push('Decide window function: ROW_NUMBER, RANK, SUM, LAG, LEAD');
    steps.push('Define PARTITION BY (groups) and ORDER BY (sort within groups)');
  }
  if (concepts.includes('subqueries') || concepts.includes('ctes')) {
    steps.push('Break the problem into sub-problems. Build inner query first.');
    steps.push('Consider using CTE for readability if query is complex');
  }

  steps.push('Add ORDER BY, LIMIT if needed');
  steps.push('Test with edge cases: NULLs, empty joins, boundary conditions');
  return steps;
}


// ═══════════════════════════════════════════════════════
// SECTION D — APTITUDE GUIDE
// ═══════════════════════════════════════════════════════

/**
 * Get aptitude topic guide: formulas, shortcuts, examples.
 */
export function getAptitudeTopicGuide(categoryKey) {
  const category = APTITUDE_CATEGORIES[categoryKey];
  if (!category) return null;

  // Find relevant formula sheets
  const formulaKeys = _getFormulaKeysForCategory(categoryKey);
  const formulas = {};
  formulaKeys.forEach(key => {
    if (FORMULA_SHEETS[key]) {
      formulas[key] = FORMULA_SHEETS[key];
    }
  });

  // Get subcategories
  const subcats = Object.entries(category.subcategories || {}).map(([key, sub]) => ({
    key,
    title: sub.title || key,
    questionCount: sub.questions?.length || 0,
    icon: sub.icon || '📝',
  }));

  return {
    id: categoryKey,
    title: category.title,
    icon: category.icon,
    color: category.color,
    description: category.description,

    // (1) Formulas
    formulas: {
      heading: '📐 Key Formulas',
      sheets: Object.entries(formulas).map(([key, list]) => ({
        topic: _formatTopicName(key),
        formulas: list,
      })),
    },

    // (2) Quick solve methods
    quickMethods: {
      heading: '⚡ How to Solve Quickly',
      tips: _getQuickMethodsForCategory(categoryKey),
    },

    // (3) Subcategories to practice
    subcategories: {
      heading: '📚 Practice Areas',
      items: subcats,
    },

    // (4) General shortcuts
    shortcuts: {
      heading: '💡 Tricks & Shortcuts',
      tips: _getShortcutsForCategory(categoryKey),
    },
  };
}

function _getFormulaKeysForCategory(catKey) {
  if (catKey === 'quantitative') {
    return ['numberSystems', 'percentages', 'ratioAndProportion', 'averages',
            'timeAndWork', 'timeSpeedDistance', 'interestProblems', 'probabilityAndPC',
            'mixtures', 'clockCalendar'];
  }
  return [];
}

function _formatTopicName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace('And', '&');
}

function _getQuickMethodsForCategory(catKey) {
  if (catKey === 'quantitative') {
    return [
      { method: 'Percentage → Fraction', tip: '12.5% = 1/8, 33.33% = 1/3, 16.67% = 1/6. Memorize common fractions for speed.' },
      { method: 'Work Rate', tip: 'Convert "A does work in X days" → rate = 1/X. Add rates for combined work.' },
      { method: 'Average Shortcut', tip: 'New average = Old average + (New value − Old average) / (n + 1)' },
      { method: 'TSD Ratio', tip: 'If speed ratio is a:b, time ratio is b:a (for same distance)' },
      { method: 'Rule of 72', tip: 'Money doubles in approximately 72/R years at R% compound interest' },
    ];
  }
  if (catKey === 'reasoning') {
    return [
      { method: 'Blood Relations', tip: 'Draw family trees. Use "+" for male, "−" for female at each node.' },
      { method: 'Direction Sense', tip: 'Draw on paper. Start from origin, track N/S/E/W carefully.' },
      { method: 'Coding-Decoding', tip: 'Check if pattern is: letter shift, reverse, position-based, or symbol substitution.' },
      { method: 'Syllogisms', tip: 'Use Venn diagrams. "All A are B" = A circle inside B. Test each conclusion.' },
    ];
  }
  if (catKey === 'verbal') {
    return [
      { method: 'Sentence Correction', tip: 'Check subject-verb agreement first, then tense consistency, then pronoun reference.' },
      { method: 'Reading Comprehension', tip: 'Read questions FIRST, then scan passage for answers. Don\'t read entire passage first.' },
      { method: 'Para Jumbles', tip: 'Find opening sentence (general statement), then trace logical connectors: "However", "Moreover", "Therefore".' },
    ];
  }
  return [];
}

function _getShortcutsForCategory(catKey) {
  if (catKey === 'quantitative') {
    return [
      '11² = 121, 12² = 144, 13² = 169, 14² = 196, 15² = 225 — memorize squares up to 30',
      'For successive discounts d1% and d2%: effective = d1 + d2 − (d1×d2)/100',
      'Speed in km/hr × 5/18 = speed in m/s',
      'If a pipe fills in X hrs and empties in Y hrs, net fill rate = 1/X − 1/Y',
      'For CI, Amount = P(1 + R/100)^n. For 2 years difference from SI = P(R/100)²',
    ];
  }
  if (catKey === 'reasoning') {
    return [
      'In seating arrangements, always fix one person first, then place others relative',
      'For number series: check differences, then differences of differences',
      'In clock problems: minute hand gains 5.5° per minute over hour hand',
    ];
  }
  if (catKey === 'verbal') {
    return [
      'Commonly confused: affect/effect, principal/principle, complement/compliment',
      'Eliminate obviously wrong answers first, then compare remaining options',
      'For analogies: identify the relationship (synonym, antonym, part-whole, degree)',
    ];
  }
  return [];
}

/**
 * Get help for a specific aptitude question.
 */
export function getAptitudeProblemHelp(question) {
  if (!question) return null;

  return {
    heading: '📝 Step-by-Step Solution',

    interpretation: {
      heading: '🔍 Understanding the Question',
      text: `This question asks: "${question.question || question.text || ''}"`,
      type: question.type || 'multiple-choice',
    },

    approach: {
      heading: '🗺️ Approach',
      formula: _getRelevantFormula(question),
      steps: _generateAptitudeSteps(question),
    },

    answer: {
      heading: '✅ Answer',
      correct: question.answer || question.correctAnswer || null,
      explanation: question.explanation || question.solution || 'Work through the steps above to arrive at the answer.',
    },
  };
}

function _getRelevantFormula(question) {
  const text = (question.question || question.text || '').toLowerCase();
  if (text.includes('percent') || text.includes('profit') || text.includes('discount')) return 'Profit% = (Profit/CP) × 100; SP = CP(1 + P/100)';
  if (text.includes('speed') || text.includes('distance') || text.includes('train')) return 'Speed = Distance / Time; Relative speed for same direction = |S₁ − S₂|';
  if (text.includes('interest') || text.includes('compound') || text.includes('simple')) return 'SI = PRT/100; CI = P(1+R/100)^n − P';
  if (text.includes('work') || text.includes('days') || text.includes('pipe')) return 'Rate = 1/Time; Combined rate = 1/A + 1/B; Time = AB/(A+B)';
  if (text.includes('ratio') || text.includes('proportion')) return 'a:b and b:c → a:b:c; Direct: a₁/b₁ = a₂/b₂';
  if (text.includes('average') || text.includes('mean')) return 'Average = Sum/Count; New avg = (n×old + new)/(n+1)';
  if (text.includes('probability') || text.includes('combination') || text.includes('permutation')) return 'P = Favorable/Total; nCr = n!/r!(n-r)!; nPr = n!/(n-r)!';
  return null;
}

function _generateAptitudeSteps(question) {
  const text = (question.question || question.text || '').toLowerCase();
  const steps = ['Read the question carefully and identify what is being asked.'];

  if (text.includes('percent') || text.includes('profit')) {
    steps.push('Identify: CP (Cost Price), SP (Selling Price), or MP (Marked Price)');
    steps.push('Apply the relevant formula: Profit% = (SP − CP)/CP × 100');
    steps.push('Calculate step by step, keeping units consistent');
  } else if (text.includes('speed') || text.includes('distance')) {
    steps.push('Identify: Distance, Speed, and Time values');
    steps.push('Check units (km/hr vs m/s) and convert if needed');
    steps.push('Apply: Speed = Distance/Time or rearrange as needed');
  } else if (text.includes('interest')) {
    steps.push('Identify: Principal, Rate, Time');
    steps.push('Determine if SI or CI');
    steps.push('Apply formula and calculate');
  } else if (text.includes('work') || text.includes('pipe')) {
    steps.push('Convert "done in X days" → rate = 1/X per day');
    steps.push('Add rates for combined work');
    steps.push('Time = 1 / combined rate');
  } else {
    steps.push('Identify the type of problem and relevant formula');
    steps.push('Plug in the given values');
    steps.push('Compute step by step');
  }

  steps.push('Verify by plugging the answer back or using approximation');
  return steps;
}


// ═══════════════════════════════════════════════════════
// LEARNING PATH GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate a structured learning path.
 */
export function generateLearningPath(days = 60, level = 'intermediate') {
  const track = TIME_TRACKS[days] || TIME_TRACKS[60];
  const topicIds = track.topics || DSA_TOPICS.map(t => t.id);
  const topics = topicIds.map(id => DSA_TOPICS.find(t => t.id === id)).filter(Boolean);

  const topicsPerWeek = Math.ceil(topics.length / Math.ceil(days / 7));
  const weeks = [];
  let topicIndex = 0;

  for (let week = 1; topicIndex < topics.length; week++) {
    const weekTopics = topics.slice(topicIndex, topicIndex + topicsPerWeek);
    topicIndex += topicsPerWeek;

    const problemsPerDay = level === 'beginner' ? '2–3' : level === 'advanced' ? '5–8' : '3–5';
    const mix = level === 'beginner' ? '70% Easy, 30% Medium' :
                level === 'advanced' ? '20% Easy, 50% Medium, 30% Hard' :
                '40% Easy, 40% Medium, 20% Hard';

    weeks.push({
      week,
      label: `Week ${week}`,
      topics: weekTopics.map(t => ({
        id: t.id,
        title: t.title,
        icon: t.icon,
        difficulty: t.difficulty,
        estimatedTime: t.estimatedTime,
        problemCount: t.practiceProblems?.length || 0,
      })),
      dailyGoal: `Learn 1 pattern + solve ${problemsPerDay} problems`,
      difficultyMix: mix,
      stage: weekTopics[0]?.stage || 'fundamentals',
    });
  }

  return {
    heading: `📅 ${track.label} Learning Path`,
    description: track.desc,
    level,
    days,
    dailyPlan: track.perDay,
    totalTopics: topics.length,
    weeks,
    tips: [
      'Focus on understanding patterns, not memorizing solutions',
      'After solving, always analyze: "What pattern did I use? Where else does it apply?"',
      'Review yesterday\'s problems before starting today\'s',
      level === 'beginner' ? 'Don\'t skip Easy problems — they build intuition' :
      level === 'advanced' ? 'Spend extra time on Hard problems — they\'re interview differentiators' :
      'Balance speed and understanding — aim for 15-30 min per Medium problem',
    ],
  };
}


// ═══════════════════════════════════════════════════════
// TUTOR QUICK ACTIONS (context-aware)
// ═══════════════════════════════════════════════════════

/**
 * Get available quick actions based on the current context.
 */
export function getTutorActions(mode, contextData = {}) {
  switch (mode) {
    case 'dsa-learn':
      return [
        { id: 'teach-pattern', label: '🎓 Teach me this pattern', icon: '🎓' },
        { id: 'show-template', label: '📋 Show pattern template', icon: '📋' },
        { id: 'deep-dive', label: '🔬 Deep dive', icon: '🔬' },
        { id: 'tricks', label: '⚡ Show tricks & tips', icon: '⚡' },
        { id: 'practice', label: '🎯 Give me practice problems', icon: '🎯' },
        { id: 'path', label: '📅 Generate learning path', icon: '📅' },
      ];

    case 'dsa-code':
      return [
        { id: 'analyze-code', label: '🔎 Analyze my code', icon: '🔎' },
        { id: 'show-approach', label: '🗺️ Show approach', icon: '🗺️' },
        { id: 'what-pattern', label: '❓ What pattern is this?', icon: '❓' },
        { id: 'hint', label: '💡 Give me a hint', icon: '💡' },
        { id: 'optimize', label: '⚡ How to optimize?', icon: '⚡' },
        { id: 'edge-cases', label: '⚠️ Check edge cases', icon: '⚠️' },
      ];

    case 'sql':
      return [
        { id: 'sql-help', label: '🔧 Help with this query', icon: '🔧' },
        { id: 'sql-concept', label: '📖 Explain SQL concept', icon: '📖' },
        { id: 'sql-optimize', label: '⚡ Optimize query', icon: '⚡' },
        { id: 'sql-schema', label: '🗃️ Show schema', icon: '🗃️' },
      ];

    case 'aptitude':
      return [
        { id: 'show-formulas', label: '📐 Show formulas', icon: '📐' },
        { id: 'walk-through', label: '📝 Walk me through', icon: '📝' },
        { id: 'shortcut', label: '⚡ Show shortcut', icon: '⚡' },
        { id: 'similar', label: '🔄 Similar problems', icon: '🔄' },
      ];

    default:
      return [
        { id: 'dsa', label: '🧠 DSA Patterns', icon: '🧠' },
        { id: 'sql', label: '🗄️ SQL Practice', icon: '🗄️' },
        { id: 'aptitude', label: '📐 Aptitude', icon: '📐' },
        { id: 'path', label: '📅 Learning Path', icon: '📅' },
      ];
  }
}

// ═══════════════════════════════════════════════════════
// AVAILABLE SQL CONCEPT KEYS (for UI dropdowns)
// ═══════════════════════════════════════════════════════

export function getAvailableSQLConcepts() {
  return Object.keys(SQL_CONCEPT_GUIDES).map(k => ({
    key: k,
    title: SQL_CONCEPT_GUIDES[k].title,
    icon: SQL_CONCEPT_GUIDES[k].icon,
  }));
}

export function getAvailableDSATopics() {
  return DSA_TOPICS.map(t => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
    color: t.color,
    stage: t.stage,
    difficulty: t.difficulty,
  }));
}

export function getAvailableAptitudeCategories() {
  return Object.entries(APTITUDE_CATEGORIES).map(([key, cat]) => ({
    key,
    title: cat.title,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
  }));
}
