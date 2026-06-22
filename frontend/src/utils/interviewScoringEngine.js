// ─── Interview Scoring Engine ───────────────────────────────────────────────
// Shared heuristic analysis utilities for all interview modules.
// Runs entirely client-side — no backend dependency.

import { CONCEPT_LEARNING_MAP } from '../data/interviewModesData';

// ─── Code Quality Analysis ──────────────────────────────────────────────────
export function analyzeCodeQuality(code, _language = 'python') {
  if (!code || code.trim().length === 0) return { score: 0, issues: [], details: {} };

  const lines = code.split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  const issues = [];
  let score = 100;

  // 1. Variable naming quality
  const singleCharVars = (code.match(/\b[a-z]\s*=/g) || []).length;
  const meaningfulVars = (code.match(/\b[a-z][a-zA-Z0-9]{2,}\s*=/g) || []).length;
  const namingRatio = meaningfulVars / Math.max(1, meaningfulVars + singleCharVars);
  if (namingRatio < 0.5 && singleCharVars > 2) {
    issues.push('Too many single-character variable names — use descriptive names');
    score -= 10;
  }

  // 2. Function length
  const funcBodies = code.match(/(?:def |function |=>|{)[^}]*/gs) || [];
  const longFuncs = funcBodies.filter(f => f.split('\n').length > 30).length;
  if (longFuncs > 0) {
    issues.push(`${longFuncs} function(s) exceed 30 lines — consider breaking them down`);
    score -= 8 * longFuncs;
  }

  // 3. Comment density
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('#') || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*');
  }).length;
  const commentRatio = commentLines / Math.max(1, nonEmpty.length);
  if (commentRatio < 0.05 && nonEmpty.length > 10) {
    issues.push('Very few comments — add explanatory comments for complex logic');
    score -= 5;
  }

  // 4. Bracket / indentation consistency
  const openBrackets = (code.match(/[([{]/g) || []).length;
  const closeBrackets = (code.match(/[})\]]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push('Mismatched brackets detected');
    score -= 15;
  }

  // 5. Magic numbers
  const magicNums = (code.match(/(?<![a-zA-Z_.])\b\d{2,}\b(?!\s*[=:])/g) || []).length;
  if (magicNums > 3) {
    issues.push('Multiple magic numbers — consider using named constants');
    score -= 5;
  }

  // 6. Error handling
  const hasTryCatch = /try\s*[:{]/.test(code) || /except|catch/.test(code);
  if (!hasTryCatch && nonEmpty.length > 15) {
    issues.push('No error handling detected in substantial code');
    score -= 8;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    details: {
      namingRatio: Math.round(namingRatio * 100),
      commentRatio: Math.round(commentRatio * 100),
      lineCount: nonEmpty.length,
      hasErrorHandling: hasTryCatch,
      longFunctions: longFuncs,
    },
  };
}

// ─── Complexity Estimation ──────────────────────────────────────────────────
export function analyzeComplexity(code) {
  if (!code || code.trim().length === 0) return { score: 0, estimated: 'N/A', details: {} };

  let score = 80;
  const details = {};

  // Detect nested loops
  const forWhile = /\b(for|while)\b/g;
  const loopMatches = code.match(forWhile) || [];
  const loopCount = loopMatches.length;

  // Detect nesting depth via indentation levels at loop keywords
  const lines = code.split('\n');
  let maxNesting = 0;
  let currentNesting = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/\b(for|while)\b/.test(trimmed)) {
      const indent = line.length - line.trimStart().length;
      currentNesting = Math.floor(indent / 2); // rough heuristic
      maxNesting = Math.max(maxNesting, currentNesting);
    }
  }

  // Detect recursion
  const funcNames = code.match(/(?:def |function )\s*(\w+)/g) || [];
  let hasRecursion = false;
  for (const fn of funcNames) {
    const name = fn.replace(/(?:def |function )\s*/, '');
    const callPattern = new RegExp(`\\b${name}\\s*\\(`, 'g');
    const calls = code.match(callPattern) || [];
    if (calls.length > 1) hasRecursion = true;
  }

  // Detect hash map usage (usually indicates O(n) optimization)
  const usesHashMap = /\b(dict|Map|HashMap|{}\s*;|set\(\)|new Set|HashSet|unordered_map|defaultdict)\b/.test(code);

  // Estimate complexity
  let estimated = 'O(n)';
  if (maxNesting >= 2 || loopCount >= 3) {
    estimated = 'O(n²) or worse';
    score -= 20;
  } else if (loopCount >= 2 && !usesHashMap) {
    estimated = 'O(n log n) or O(n²)';
    score -= 10;
  } else if (usesHashMap && loopCount <= 1) {
    estimated = 'O(n)';
    score += 10;
  }

  if (hasRecursion && !usesHashMap) {
    estimated += ' (recursive — check for memoization)';
    score -= 5;
  } else if (hasRecursion && usesHashMap) {
    estimated += ' (memoized recursion)';
    score += 5;
  }

  // Sort detection
  if (/\.sort\(|sorted\(|Arrays\.sort|Collections\.sort/.test(code)) {
    if (estimated === 'O(n)') estimated = 'O(n log n)';
    details.usesSort = true;
  }

  details.loopCount = loopCount;
  details.maxNesting = maxNesting;
  details.hasRecursion = hasRecursion;
  details.usesHashMap = usesHashMap;

  return {
    score: Math.max(0, Math.min(100, score)),
    estimated,
    details,
  };
}

// ─── Test Discipline ────────────────────────────────────────────────────────
export function scoreTestDiscipline(code) {
  if (!code || code.trim().length === 0) return { score: 0, issues: [], details: {} };

  let score = 60; // start at 60 — tests need to be positive
  const issues = [];
  const details = {};

  // Check for test patterns
  const hasAssert = /\bassert\b/.test(code);
  const hasExpect = /\bexpect\b/.test(code);
  const hasConsoleLog = /console\.log|print\(|System\.out\.print|fmt\.Print/.test(code);
  const hasTestFunc = /\btest\b|\bit\(|\bdescribe\(|\bdef test_/.test(code);
  const hasEdgeCases = /\bnull\b|\bNone\b|\bempty\b|\b\[\]|\b0\b.*test|edge|boundary/i.test(code);

  details.hasAssert = hasAssert;
  details.hasExpect = hasExpect;
  details.hasConsoleLog = hasConsoleLog;
  details.hasTestFunc = hasTestFunc;
  details.hasEdgeCases = hasEdgeCases;

  if (hasAssert || hasExpect) {
    score += 20;
  } else if (hasConsoleLog) {
    score += 5;
    issues.push('Uses print/console.log instead of proper assertions');
  } else {
    issues.push('No testing or verification of output detected');
    score -= 20;
  }

  if (hasTestFunc) {
    score += 10;
  }

  if (hasEdgeCases) {
    score += 10;
  } else {
    issues.push('No edge case testing detected (empty, null, zero)');
  }

  // Count test cases
  const testCaseCount = (code.match(/assert|expect\(|console\.log\(.*result|print\(.*solve/g) || []).length;
  details.testCaseCount = testCaseCount;

  if (testCaseCount >= 3) score += 10;
  else if (testCaseCount >= 1) score += 5;
  else {
    issues.push('No test case invocations found');
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    details,
  };
}

// ─── Debugging Behavior ─────────────────────────────────────────────────────
export function analyzeDebuggingBehavior(code) {
  if (!code || code.trim().length === 0) return { score: 50, issues: [], details: {} };

  let score = 50;
  const issues = [];
  const details = {};

  // Strategic logging
  const logCount = (code.match(/console\.log|print\(|System\.out|fmt\.Print/g) || []).length;
  details.logCount = logCount;

  if (logCount >= 2 && logCount <= 6) {
    score += 15;
    details.strategicLogging = true;
  } else if (logCount > 6) {
    score -= 5;
    issues.push('Excessive logging — focus on strategic debug points');
    details.strategicLogging = false;
  } else {
    details.strategicLogging = false;
  }

  // Error handling patterns
  const hasTryCatch = /try|except|catch|finally/.test(code);
  if (hasTryCatch) {
    score += 15;
    details.hasErrorHandling = true;
  } else {
    details.hasErrorHandling = false;
  }

  // Input validation
  const hasInputValidation = /if\s*.*(?:null|None|undefined|!|\.length|\.size|\.isEmpty)/.test(code);
  if (hasInputValidation) {
    score += 10;
    details.hasInputValidation = true;
  } else {
    details.hasInputValidation = false;
    issues.push('No input validation detected');
  }

  // Boundary checks
  const hasBoundaryCheck = /(?:<=?\s*0|>=?\s*len|\.length\s*-\s*1|bounds|overflow|underflow)/i.test(code);
  if (hasBoundaryCheck) {
    score += 10;
    details.hasBoundaryCheck = true;
  } else {
    details.hasBoundaryCheck = false;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    details,
  };
}

// ─── Build Feedback Report ──────────────────────────────────────────────────
export function buildFeedbackReport(scores, rubric) {
  const axes = rubric.axes.map(axis => {
    const axisScore = scores[axis.id] || { score: 0, issues: [], details: {} };
    return {
      ...axis,
      score: axisScore.score,
      issues: axisScore.issues || [],
      details: axisScore.details || {},
    };
  });

  const totalWeightedScore = axes.reduce((sum, axis) => {
    return sum + (axis.score * axis.weight);
  }, 0);

  const overallScore = Math.round(totalWeightedScore);

  const failedConcepts = axes
    .filter(a => a.score < 50)
    .map(a => ({
      conceptId: a.id,
      score: a.score,
      label: a.label,
      description: a.description,
    }));

  let grade = 'A';
  if (overallScore < 40) grade = 'F';
  else if (overallScore < 55) grade = 'D';
  else if (overallScore < 65) grade = 'C';
  else if (overallScore < 75) grade = 'B';
  else if (overallScore < 85) grade = 'A-';

  return {
    overallScore,
    grade,
    axes,
    failedConcepts,
    timestamp: new Date().toISOString(),
  };
}

// ─── Map Failed Concepts to Learning Links ──────────────────────────────────
export function mapFailedConcepts(failedConcepts = []) {
  return failedConcepts.map(concept => {
    const mapping = CONCEPT_LEARNING_MAP[concept.conceptId];
    return {
      ...concept,
      learningLink: mapping || null,
    };
  }).filter(c => c.learningLink);
}

// ─── Full Live Coding Analysis (debounced caller should use this) ───────────
export function runFullAnalysis(code, language = 'python') {
  const syntax = analyzeCodeQuality(code, language);
  const complexity = analyzeComplexity(code);
  const testDiscipline = scoreTestDiscipline(code);
  const debugging = analyzeDebuggingBehavior(code);

  return {
    syntax,
    testDiscipline,
    complexity,
    debugging,
  };
}

// ─── Debugging Challenge Scorer ─────────────────────────────────────────────
export function scoreDebuggingAttempt(challenge, userFix, userExplanation) {
  const result = { bugId: 0, fixQuality: 0, optimization: 0, explanation: 0 };

  // Bug identification — check if explanation mentions key concepts
  const keyTerms = challenge.explanation.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const explanationLower = (userExplanation || '').toLowerCase();
  const matchedTerms = keyTerms.filter(t => explanationLower.includes(t));
  result.bugId = Math.min(100, Math.round((matchedTerms.length / Math.max(1, keyTerms.length)) * 120));

  // Fix quality — compare with model answer (simple diff)
  if (userFix && challenge.fixedCode) {
    const fixLines = userFix.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const modelLines = challenge.fixedCode.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const commonLines = fixLines.filter(l => modelLines.includes(l));
    const similarity = commonLines.length / Math.max(1, modelLines.length);
    result.fixQuality = Math.round(similarity * 100);
  }

  // Optimization — did they improve beyond the fix?
  const optimizationPatterns = /memo|cache|hash|set\(|Map\(|O\(|time complexity|space complexity/i;
  if (optimizationPatterns.test(userFix || '') || optimizationPatterns.test(userExplanation || '')) {
    result.optimization = 70;
  } else {
    result.optimization = 40;
  }

  // Explanation clarity
  const wordCount = (userExplanation || '').split(/\s+/).filter(Boolean).length;
  if (wordCount > 50) result.explanation = 80;
  else if (wordCount > 20) result.explanation = 60;
  else if (wordCount > 5) result.explanation = 40;
  else result.explanation = 10;

  // Wrap as score objects for buildFeedbackReport
  return {
    bugId: { score: result.bugId, issues: result.bugId < 50 ? ['Did not identify the root cause clearly'] : [], details: {} },
    fixQuality: { score: result.fixQuality, issues: result.fixQuality < 50 ? ['Fix does not match expected solution'] : [], details: {} },
    optimization: { score: result.optimization, issues: [], details: {} },
    explanation: { score: result.explanation, issues: result.explanation < 50 ? ['Explanation was too brief'] : [], details: {} },
  };
}

// ─── Code Review Scorer ─────────────────────────────────────────────────────
export function scoreCodeReview(scenario, userFoundIssues = []) {
  const totalIssues = scenario.issues.length;
  const criticalTotal = scenario.issues.filter(i => i.severity === 'critical').length;
  const _majorTotal = scenario.issues.filter(i => i.severity === 'major').length;

  const foundCount = userFoundIssues.length;
  const coverageScore = Math.min(100, Math.round((foundCount / Math.max(1, totalIssues)) * 100));

  // Check if user found critical issues
  const foundCriticals = userFoundIssues.filter(f =>
    scenario.issues.some(i => i.severity === 'critical' && (
      f.toLowerCase().includes(i.type) ||
      f.toLowerCase().includes(i.description.substring(0, 20).toLowerCase())
    ))
  ).length;
  const severityScore = Math.min(100, Math.round((foundCriticals / Math.max(1, criticalTotal)) * 100));

  return {
    coverage: { score: coverageScore, issues: coverageScore < 50 ? [`Found only ${foundCount}/${totalIssues} issues`] : [], details: { found: foundCount, total: totalIssues } },
    severity: { score: severityScore, issues: severityScore < 50 ? ['Missed critical security/performance issues'] : [], details: { criticalFound: foundCriticals, criticalTotal } },
    communication: { score: 65, issues: [], details: {} }, // set by UI based on chat
    depth: { score: 60, issues: [], details: {} }, // set by UI based on follow-up answers
  };
}
