import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: fixtures.from,
    rpc: fixtures.rpc,
  },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = req.user || { id: 'user-1' };
    next();
  },
  optionalAuth: (req, _res, next) => next(),
}));

vi.mock('../../middleware/rateLimiter.js', () => ({
  codeExecutionLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../services/aiService.js', () => ({
  generateMissingTestCases: vi.fn(),
}));

vi.mock('../../utils/coinTransactions.js', () => ({
  applyCoinTransaction: vi.fn(),
}));

import practiceRouter, { selectTimedSessionProblems } from '../../routes/practice.js';
import interviewSuiteRouter from '../../routes/interview-suite.js';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function getRouteHandler(router, method, path) {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function makeChain(result) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe('Timed Practice & Debug/Code-Review backend regressions (#1, #3, #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Bug #3: POST /timed-session returns 404 when problem bank is empty', async () => {
    fixtures.from.mockImplementation((table) => {
      if (table === 'problems') return makeChain({ data: [], error: null });
      return makeChain({ data: [], error: null });
    });

    const handler = getRouteHandler(practiceRouter, 'post', '/timed-session');
    const res = createResponse();
    await handler(
      { user: { id: 'user-1' }, body: { difficulty: 'all', duration: 10, count: 5 } },
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/no practice problems/i);
  });

  it('Bug #4: selectTimedSessionProblems prioritizes attempted/failed and weak-pattern problems for last-day mode', () => {
    const problems = [
      { id: 'solved-1', title: 'Solved Easy', difficulty: 'easy', pattern_id: 'pat-arrays' },
      { id: 'solved-2', title: 'Solved Medium', difficulty: 'medium', pattern_id: 'pat-arrays' },
      { id: 'weak-attempted', title: 'Failed DP Problem', difficulty: 'medium', pattern_id: 'pat-dp' },
      { id: 'weak-pattern-unsolved', title: 'Other DP Problem', difficulty: 'hard', pattern_id: 'pat-dp' },
      { id: 'other-unsolved', title: 'Graph Problem', difficulty: 'medium', pattern_id: 'pat-graphs' },
    ];
    const userProgressRows = [
      { problem_id: 'solved-1', status: 'solved', attempts: 1 },
      { problem_id: 'solved-2', status: 'solved', attempts: 1 },
      { problem_id: 'weak-attempted', status: 'attempted', attempts: 3 },
    ];
    const submissionRows = [
      { problem_id: 'weak-attempted', status: 'wrong_answer' },
      { problem_id: 'weak-attempted', status: 'wrong_answer' },
    ];

    const picked = selectTimedSessionProblems({
      problems,
      count: 3,
      isWeakAreaMode: true,
      userProgressRows,
      submissionRows,
      randomInt: () => 0,
    });

    expect(picked.map((p) => p.id)).toEqual([
      'weak-attempted',
      'weak-pattern-unsolved',
      'other-unsolved',
    ]);
  });

  it('Bug #4: POST /timed-session with mode=last-day queries user progress/submissions and uses weak-areas strategy', async () => {
    fixtures.from.mockImplementation((table) => {
      if (table === 'problems') {
        return makeChain({
          data: [
            { id: 'p-solved', title: 'Solved One', difficulty: 'easy', pattern_id: 'pat-1', patterns: { name: 'Arrays' } },
            { id: 'p-weak', title: 'Weak One', difficulty: 'medium', pattern_id: 'pat-2', patterns: { name: 'DP' } },
          ],
          error: null,
        });
      }
      if (table === 'user_progress') {
        return makeChain({
          data: [
            { problem_id: 'p-solved', status: 'solved', attempts: 1 },
            { problem_id: 'p-weak', status: 'attempted', attempts: 4 },
          ],
          error: null,
        });
      }
      if (table === 'submissions') {
        return makeChain({
          data: [{ problem_id: 'p-weak', status: 'wrong_answer' }],
          error: null,
        });
      }
      return makeChain({ data: [], error: null });
    });

    const handler = getRouteHandler(practiceRouter, 'post', '/timed-session');
    const res = createResponse();
    await handler(
      {
        user: { id: 'user-1' },
        body: { difficulty: 'all', duration: 20, count: 1, mode: 'last-day', focus: 'weak-areas' },
      },
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.selectionStrategy).toBe('weak-areas');
    expect(res.body.problems).toHaveLength(1);
    expect(res.body.problems[0].id).toBe('p-weak');
    expect(res.body.problems[0].pattern).toBe('DP');
  });

  it('Bug #1: POST /debug-code-review/evaluate rejects blank answers and persists valid submissions', async () => {
    const handler = getRouteHandler(interviewSuiteRouter, 'post', '/debug-code-review/evaluate');

    const emptyRes = createResponse();
    await handler(
      { user: { id: 'user-1' }, body: { mode: 'review', candidateResponse: '   ', submittedCode: '' } },
      emptyRes
    );
    expect(emptyRes.statusCode).toBe(400);

    let insertedRow = null;
    fixtures.from.mockImplementation((table) => {
      if (table === 'mock_interviews') {
        const chain = {
          insert: vi.fn((payload) => {
            insertedRow = payload;
            return chain;
          }),
          select: vi.fn(() => chain),
          single: vi.fn(() => Promise.resolve({ data: { id: 'iv-99' }, error: null })),
        };
        return chain;
      }
      return makeChain({ data: [], error: null });
    });

    const okRes = createResponse();
    await handler(
      {
        user: { id: 'user-1' },
        body: {
          mode: 'review',
          title: 'Review PR #42',
          challengePrompt: 'Review auth middleware',
          candidateResponse: 'Root cause is SQL injection via string interpolation; fix with parameterized queries and password hashing.',
          submittedCode: 'app.post(...)',
          durationSeconds: 120,
        },
      },
      okRes
    );

    expect(okRes.statusCode).toBe(200);
    expect(okRes.body.interviewId).toBe('iv-99');
    expect(okRes.body.saved).toBe(true);
    expect(okRes.body.score).toBeGreaterThan(0);
    expect(insertedRow).toMatchObject({
      user_id: 'user-1',
      interview_type: 'coding',
      duration: 120,
    });
  });
});
