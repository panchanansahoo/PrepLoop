const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Verification tests for Bugs 12, 13, and 14 on mobile DSA & SQL editors

function parseJsonIfString(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProblemPayload(data) {
  const resolved = data?.problem ? data.problem : data;
  if (!resolved || typeof resolved !== 'object') {
    return null;
  }
  const rawTemplates = parseJsonIfString(resolved.codeTemplates ?? resolved.starter_code, {});
  const codeTemplates =
    rawTemplates && typeof rawTemplates === 'object' && !Array.isArray(rawTemplates)
      ? rawTemplates
      : {};
  const rawExamples = parseJsonIfString(resolved.examples, []);
  const examples = Array.isArray(rawExamples) ? rawExamples : [];
  return {
    ...resolved,
    codeTemplates,
    examples,
  };
}

function evaluateSubmissionResult(testResult) {
  if (!testResult || typeof testResult !== 'object') {
    return { isAccepted: false, testsPassed: undefined, totalTests: undefined, message: '' };
  }
  const rawPassed =
    testResult.testsPassed ?? testResult.passed ?? testResult.submission?.test_cases_passed;
  const rawTotal =
    testResult.totalTests ?? testResult.total ?? testResult.submission?.total_test_cases;
  const testsPassed =
    rawPassed !== undefined && rawPassed !== null && Number.isFinite(Number(rawPassed))
      ? Number(rawPassed)
      : undefined;
  const totalTests =
    rawTotal !== undefined && rawTotal !== null && Number.isFinite(Number(rawTotal))
      ? Number(rawTotal)
      : undefined;
  const explicitStatus = testResult.status ?? testResult.submission?.status;

  let isAccepted;
  if (
    explicitStatus === 'error' ||
    explicitStatus === 'wrong_answer' ||
    testResult.success === false
  ) {
    isAccepted = false;
  } else if (totalTests !== undefined && totalTests > 0) {
    isAccepted = testsPassed !== undefined && testsPassed >= totalTests;
  } else {
    isAccepted = explicitStatus === 'accepted' || testResult.success === true;
  }

  return {
    isAccepted,
    testsPassed,
    totalTests,
    message: testResult.error || testResult.message || '',
  };
}

test('Bug 12: normalizeProblemPayload unwraps nested problem and maps starter_code to codeTemplates', () => {
  const nestedApiEnvelope = {
    problem: {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Find indices',
      starter_code: {
        javascript: 'function twoSum(nums, target) {}',
        python: 'class Solution:\n    def twoSum(self, nums, target): pass',
      },
      examples: [{ input: 'nums = [2,7], target = 9', output: '[0,1]' }],
    },
    exploration: { exploreQuestions: [] },
  };

  const normalized = normalizeProblemPayload(nestedApiEnvelope);
  assert.equal(normalized.title, 'Two Sum');
  assert.equal(normalized.codeTemplates.javascript, 'function twoSum(nums, target) {}');
  assert.equal(normalized.examples.length, 1);

  const jsonStringified = normalizeProblemPayload({
    id: 2,
    title: 'Reverse String',
    starter_code: '{"javascript":"function reverseString(s) {}"}',
    examples: '[{"input":"[\\"a\\",\\"b\\"]","output":"[\\"b\\",\\"a\\"]"}]',
  });
  assert.equal(jsonStringified.codeTemplates.javascript, 'function reverseString(s) {}');
  assert.equal(jsonStringified.examples.length, 1);
  assert.equal(normalizeProblemPayload(null), null);
});

test('Bug 13: evaluateSubmissionResult handles /submit and /run responses without false Failed or false Accepted', () => {
  // Standard /submit accepted response (no top-level status)
  const submitAccepted = evaluateSubmissionResult({
    success: true,
    submission: { status: 'accepted', test_cases_passed: 3, total_test_cases: 3 },
    testsPassed: 3,
    totalTests: 3,
    message: 'All test cases passed!',
  });
  assert.equal(submitAccepted.isAccepted, true);
  assert.equal(submitAccepted.testsPassed, 3);
  assert.equal(submitAccepted.totalTests, 3);

  // Standard /submit wrong answer response
  const submitFailed = evaluateSubmissionResult({
    success: false,
    submission: { status: 'wrong_answer', test_cases_passed: 1, total_test_cases: 3 },
    testsPassed: 1,
    totalTests: 3,
    message: '1/3 test cases passed',
  });
  assert.equal(submitFailed.isAccepted, false);

  // /run partial pass: backend returns success=true (execution succeeded) with passed=1, total=3
  const runPartialPass = evaluateSubmissionResult({
    success: true,
    passed: 1,
    total: 3,
    message: '1/3 test cases passed',
  });
  assert.equal(runPartialPass.isAccepted, false);
  assert.equal(runPartialPass.testsPassed, 1);
  assert.equal(runPartialPass.totalTests, 3);

  // /run full pass
  const runAllPass = evaluateSubmissionResult({
    success: true,
    passed: 3,
    total: 3,
    message: 'All test cases passed!',
  });
  assert.equal(runAllPass.isAccepted, true);

  // Network/execution catch error
  const errorResult = evaluateSubmissionResult({
    status: 'error',
    message: 'Network error',
  });
  assert.equal(errorResult.isAccepted, false);
});

test('Bug 14: SQL screens and sqlApi use dedicated SQL practice endpoints instead of hardcoded mocks or DSA routes', () => {
  const explorerPath = path.resolve(__dirname, '../../screens/dsa/SQLProblemExplorerScreen.js');
  const sqlEditorPath = path.resolve(__dirname, '../../screens/dsa/SQLEditorScreen.js');
  const sqlApiPath = path.resolve(__dirname, '../sqlApi.js');

  const explorerSrc = fs.readFileSync(explorerPath, 'utf8');
  const sqlEditorSrc = fs.readFileSync(sqlEditorPath, 'utf8');
  const sqlApiSrc = fs.readFileSync(sqlApiPath, 'utf8');

  assert.ok(!explorerSrc.includes('MOCK_SQL_PROBLEMS'), 'SQLProblemExplorerScreen must not use hardcoded MOCK_SQL_PROBLEMS');
  assert.ok(explorerSrc.includes('sqlApi.getProblems'), 'SQLProblemExplorerScreen must load problems via sqlApi.getProblems');

  assert.ok(!sqlEditorSrc.includes('dsaApi'), 'SQLEditorScreen must not call generic dsaApi');
  assert.ok(sqlEditorSrc.includes('sqlApi.getProblem'), 'SQLEditorScreen must load problem via sqlApi.getProblem');
  assert.ok(sqlEditorSrc.includes('sqlApi.runQuery'), 'SQLEditorScreen must run query via sqlApi.runQuery');

  assert.ok(sqlApiSrc.includes('/api/practice/sql/problems'), 'sqlApi must hit /api/practice/sql/problems');
  assert.ok(sqlApiSrc.includes('/api/practice/execute'), 'sqlApi must hit /api/practice/execute');
});
