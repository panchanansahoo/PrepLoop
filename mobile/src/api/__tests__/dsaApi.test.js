const test = require('node:test');
const assert = require('node:assert/strict');

// DSA API contract helpers
function validateSubmissionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }
  const { problemId, code, language } = payload;
  if (!problemId) throw new Error('Missing problemId');
  if (typeof code !== 'string' || !code.trim()) throw new Error('Missing code');
  const allowedLanguages = new Set(['javascript', 'python', 'java', 'cpp', 'typescript']);
  if (!language || !allowedLanguages.has(String(language).toLowerCase())) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return {
    problemId: String(problemId),
    code: code.trim(),
    language: String(language).toLowerCase(),
  };
}

function extractPatternProblems(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const list = response.problems || response.data || [];
  return Array.isArray(list) ? list : [];
}

test('validateSubmissionPayload accepts valid code submissions', () => {
  const valid = validateSubmissionPayload({
    problemId: 'two-sum',
    code: 'function twoSum(nums, target) { return []; }',
    language: 'JavaScript',
  });

  assert.equal(valid.problemId, 'two-sum');
  assert.equal(valid.language, 'javascript');
  assert.ok(valid.code.includes('twoSum'));
});

test('validateSubmissionPayload rejects invalid languages or empty code', () => {
  assert.throws(() => {
    validateSubmissionPayload({
      problemId: 'two-sum',
      code: '',
      language: 'javascript',
    });
  }, /Missing code/);

  assert.throws(() => {
    validateSubmissionPayload({
      problemId: 'two-sum',
      code: 'print(1)',
      language: 'brainfuck',
    });
  }, /Unsupported language/);
});

test('extractPatternProblems unwraps nested envelopes and lists cleanly', () => {
  const directList = [{ id: 'p1', title: 'Problem 1' }];
  assert.deepEqual(extractPatternProblems(directList), directList);

  const envelope = { pattern: { id: 'pat1' }, problems: [{ id: 'p2', title: 'Problem 2' }] };
  assert.deepEqual(extractPatternProblems(envelope), [{ id: 'p2', title: 'Problem 2' }]);

  assert.deepEqual(extractPatternProblems(null), []);
});

