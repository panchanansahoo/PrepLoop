const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const apiCalls = [];
const mockState = {
  apiHandler: async () => ({
    data: {
      score: 85,
      verdict: 'strong',
      feedback: ['Identified SQL injection and plaintext password storage.'],
      interviewId: 'iv-123',
      saved: true,
    },
  }),
};

globalThis.__icsApi = async (method, url, payload) => {
  apiCalls.push({ method, url, payload });
  return mockState.apiHandler(method, url, payload);
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './apiClient' || specifier.endsWith('/api/apiClient')) {
      return { shortCircuit: true, url: 'mock://ics-api-client' };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://ics-api-client') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            async get(url, config) { return globalThis.__icsApi('GET', url, config); },
            async post(url, body, config) { return globalThis.__icsApi('POST', url, { body, config }); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

test.beforeEach(() => {
  apiCalls.length = 0;
});

test('Bug #1: interviewApi.submitDebugCodeReview posts challenge response for evaluation & persistence', async () => {
  const { interviewApi } = await import('../interviewApi.js');

  const result = await interviewApi.submitDebugCodeReview({
    mode: 'review',
    title: 'Review PR #42',
    challengePrompt: 'Review auth middleware',
    candidateResponse: 'SQL injection vulnerability on query',
    submittedCode: 'app.post(...)',
    durationSeconds: 95,
  });

  assert.equal(apiCalls.length, 1);
  assert.equal(apiCalls[0].method, 'POST');
  assert.equal(apiCalls[0].url, '/api/interview-suite/debug-code-review/evaluate');
  assert.deepEqual(apiCalls[0].payload.body, {
    mode: 'review',
    title: 'Review PR #42',
    challengePrompt: 'Review auth middleware',
    candidateResponse: 'SQL injection vulnerability on query',
    submittedCode: 'app.post(...)',
    durationSeconds: 95,
  });
  assert.equal(result.score, 85);
  assert.equal(result.interviewId, 'iv-123');
});

test('Bug #1: CodeReviewInterviewScreen and DebuggingInterviewScreen submit responses instead of discarding via goBack', () => {
  const codeReviewSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/interview/CodeReviewInterviewScreen.js'),
    'utf8'
  );
  const debuggingSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/interview/DebuggingInterviewScreen.js'),
    'utf8'
  );

  assert.match(codeReviewSrc, /interviewApi\.submitDebugCodeReview/);
  assert.match(codeReviewSrc, /onPress=\{handleSubmit\}/);
  assert.doesNotMatch(codeReviewSrc, /onPress=\{\(\)\s*=>\s*navigation\.goBack\(\)\}[\s\S]{0,80}Submit Review/);

  assert.match(debuggingSrc, /interviewApi\.submitDebugCodeReview/);
  assert.match(debuggingSrc, /onPress=\{handleSubmit\}/);
  assert.doesNotMatch(debuggingSrc, /onPress=\{\(\)\s*=>\s*navigation\.goBack\(\)\}[\s\S]{0,80}Submit Analysis/);
});

test('Bug #8: DebuggingInterviewScreen prompt does not reveal BUG comments for negative numbers or out-of-bounds', () => {
  const debuggingSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/interview/DebuggingInterviewScreen.js'),
    'utf8'
  );

  assert.doesNotMatch(debuggingSrc, /BUG:/i);
  assert.doesNotMatch(debuggingSrc, /What if all numbers are negative/i);
  assert.doesNotMatch(debuggingSrc, /Out of bounds/i);
});
