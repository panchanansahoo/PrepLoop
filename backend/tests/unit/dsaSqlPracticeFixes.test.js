import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  executeCode: vi.fn(),
  buildTestWrapper: vi.fn(),
  parseTestResults: vi.fn(),
  generateMissingTestCases: vi.fn(),
  applyCoinTransaction: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../../utils/structuredLogger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: mocks.loggerError,
  }),
}));

vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: { from: mocks.from, rpc: mocks.rpc },
}));

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1', email: 'tester@example.com' };
    next();
  },
  optionalAuth: (req, _res, next) => {
    req.user = req.user || null;
    next();
  },
}));

vi.mock('../../middleware/rateLimiter.js', () => ({
  codeExecutionLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../middleware/apiRateLimiter.js', () => ({
  aiEndpointsLimiter: (_req, _res, next) => next(),
}));

vi.mock('../../middleware/usageQuota.ts', () => ({
  usageQuota: () => (_req, _res, next) => next(),
}));

vi.mock('../../utils/cacheManager.js', () => ({
  default: {
    getOrSet: (_key, fn) => Promise.resolve(fn()),
  },
}));

vi.mock('../../services/aiService.js', () => ({
  generateMissingTestCases: mocks.generateMissingTestCases,
}));

vi.mock('../../utils/coinTransactions.js', () => ({
  applyCoinTransaction: mocks.applyCoinTransaction,
}));

vi.mock('../../utils/executeCode.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    executeCode: mocks.executeCode,
    buildTestWrapper: mocks.buildTestWrapper,
    parseTestResults: mocks.parseTestResults,
  };
});

const mockApiClient = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../../../mobile/src/api/apiClient', () => ({ default: mockApiClient }));

import fs from 'node:fs';
import Module from 'node:module';
import { transformSync } from 'esbuild';
import dsaRouter from '../../routes/dsa.js';
import practiceRouter from '../../routes/practice.js';
import { executeSqlite } from '../../utils/executeCode.js';
import { SQL_PROBLEMS } from '@preploop/contracts/sql-problems';
import { sqlApi } from '../../../mobile/src/api/sqlApi.js';

const loadCodeEditorExports = () => {
  const screenPath = new URL('../../../mobile/src/screens/dsa/CodeEditorScreen.js', import.meta.url);
  const source = fs.readFileSync(screenPath, 'utf8');
  const { code } = transformSync(source, { loader: 'jsx', format: 'cjs' });
  const mod = new Module('CodeEditorScreen.cjs');
  const origLoad = Module._load;
  Module._load = (request) => {
    if (request === 'react') return { default: {}, useState: vi.fn(), useRef: vi.fn(), useEffect: vi.fn(), useCallback: vi.fn() };
    if (request === 'react-native') return { View: 'View', Text: 'Text', StyleSheet: { create: (s) => s }, ActivityIndicator: 'ActivityIndicator', TouchableOpacity: 'TouchableOpacity', KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'ios' }, Alert: { alert: vi.fn() }, ScrollView: 'ScrollView' };
    if (request === 'react-native-webview') return { WebView: 'WebView' };
    if (request === 'expo-asset') return { Asset: { fromModule: vi.fn() } };
    if (request === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (request.includes('theme')) return { colors: {}, typography: {}, spacing: {}, borderRadius: {} };
    if (request.includes('Button')) return { Button: 'Button' };
    if (request.includes('dsaApi')) return { dsaApi: {} };
    return {};
  };
  try {
    mod._compile(code, 'CodeEditorScreen.cjs');
  } finally {
    Module._load = origLoad;
  }
  return mod.exports;
};

const { normalizeProblemPayload, evaluateSubmissionResult } = loadCodeEditorExports();

const getHandler = (router, method, path) => {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route?.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack.at(-1).handle;
};

const createMockRes = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  set(name, value) {
    this.headers[name] = value;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const createQueryChain = (result) => {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Bug 12: DSA problem details & starter code payload', () => {
  it('GET /api/dsa/problems/:id returns problem nested under problem with starter_code and sanitized test_cases', async () => {
    const dbProblem = {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Find two numbers that add up to target.',
      starter_code: {
        javascript: 'function twoSum(nums, target) {}',
        python: 'class Solution:\n    def twoSum(self, nums, target): pass',
      },
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
      test_cases: [
        { input: [[2, 7, 11, 15], 9], output: [0, 1], hidden: false },
        { input: [[3, 2, 4], 6], output: [1, 2], hidden: true },
      ],
      extended_test_cases: [],
      patterns: { name: 'Hash Map', category: 'Arrays' },
    };

    mocks.from.mockImplementation((table) => {
      if (table === 'problems') {
        return createQueryChain({ data: dbProblem, error: null });
      }
      return createQueryChain({ data: null, error: null });
    });

    const req = { params: { id: '1' }, user: null };
    const res = createMockRes();
    await getHandler(dsaRouter, 'get', '/problems/:id')(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.problem).toBeDefined();
    expect(res.body.problem.title).toBe('Two Sum');
    expect(res.body.problem.starter_code.javascript).toContain('function twoSum');
    expect(res.body.problem.test_cases).toHaveLength(1);
    expect(res.body.exploration).toBeDefined();
  });
});

describe('Bug 13: Practice submit & run responses for accepted and failed solutions', () => {
  const sampleProblem = {
    id: 1,
    title: 'Two Sum',
    starter_code: {
      javascript: 'function twoSum(nums, target) {}',
    },
    test_cases: [
      { input: [[2, 7, 11, 15], 9], output: [0, 1] },
      { input: [[3, 2, 4], 6], output: [1, 2] },
    ],
    examples: [],
  };

  function setupPracticeDbMock(submissionStatus = 'accepted', passedCount = 2) {
    const submissionRow = {
      id: 'sub-1',
      problem_id: 1,
      status: submissionStatus,
      test_cases_passed: passedCount,
      total_test_cases: 2,
    };

    mocks.from.mockImplementation((table) => {
      if (table === 'problems') {
        return createQueryChain({ data: sampleProblem, error: null });
      }
      if (table === 'submissions') {
        return createQueryChain({ data: submissionRow, error: null });
      }
      if (table === 'user_progress') {
        const chain = {
          select: vi.fn(() => chain),
          insert: vi.fn(() => chain),
          update: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({
            data: { problem_id: 1, status: submissionStatus === 'accepted' ? 'solved' : 'attempted', attempts: 1 },
            error: null,
          }),
        };
        return chain;
      }
      return createQueryChain({ data: null, error: null });
    });
  }

  it('POST /api/practice/submit returns success=true, status="accepted", and submission.status="accepted" when all tests pass', async () => {
    setupPracticeDbMock('accepted', 2);
    mocks.applyCoinTransaction.mockResolvedValue({
      handled: true,
      success: true,
      applied: true,
      balance: 15,
    });
    mocks.buildTestWrapper.mockReturnValue('// wrapped');
    mocks.executeCode.mockResolvedValue({ success: true, output: 'ok', executionTime: 12 });
    mocks.parseTestResults.mockReturnValue([
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], actual: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2], actual: [1, 2] },
    ]);

    const req = {
      user: { id: 'user-1' },
      body: { problemId: 1, code: 'function twoSum(nums, target) { return [0, 1]; }', language: 'javascript' },
    };
    const res = createMockRes();
    await getHandler(practiceRouter, 'post', '/submit')(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('accepted');
    expect(res.body.submission.status).toBe('accepted');
    expect(res.body.testsPassed).toBe(2);
    expect(res.body.totalTests).toBe(2);
    expect(res.body.message).toBe('All test cases passed!');
  });

  it('POST /api/practice/submit returns success=false and status="wrong_answer" when a test fails', async () => {
    setupPracticeDbMock('wrong_answer', 1);
    mocks.buildTestWrapper.mockReturnValue('// wrapped');
    mocks.executeCode.mockResolvedValue({ success: true, output: 'ok', executionTime: 12 });
    mocks.parseTestResults.mockReturnValue([
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], actual: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2], actual: [0, 0] },
    ]);

    const req = {
      user: { id: 'user-1' },
      body: { problemId: 1, code: 'function twoSum() { return [0, 1]; }', language: 'javascript' },
    };
    const res = createMockRes();
    await getHandler(practiceRouter, 'post', '/submit')(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe('wrong_answer');
    expect(res.body.submission.status).toBe('wrong_answer');
    expect(res.body.testsPassed).toBe(1);
    expect(res.body.totalTests).toBe(2);
  });

  it('POST /api/practice/run returns consistent status, testsPassed/totalTests, and passed/total for full and partial passes', async () => {
    setupPracticeDbMock('accepted', 2);
    mocks.buildTestWrapper.mockReturnValue('// wrapped');
    mocks.executeCode.mockResolvedValue({ success: true, output: 'ok', executionTime: 18 });

    mocks.parseTestResults.mockReturnValueOnce([
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], actual: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2], actual: [1, 2] },
    ]);
    const passReq = {
      user: { id: 'user-1' },
      body: { problemId: 1, code: 'function twoSum() {}', language: 'javascript' },
    };
    const passRes = createMockRes();
    await getHandler(practiceRouter, 'post', '/run')(passReq, passRes);

    expect(passRes.statusCode).toBe(200);
    expect(passRes.body.success).toBe(true);
    expect(passRes.body.status).toBe('accepted');
    expect(passRes.body.passed).toBe(2);
    expect(passRes.body.total).toBe(2);
    expect(passRes.body.testsPassed).toBe(2);
    expect(passRes.body.totalTests).toBe(2);

    mocks.parseTestResults.mockReturnValueOnce([
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], actual: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2], actual: [0, 0] },
    ]);
    const failRes = createMockRes();
    await getHandler(practiceRouter, 'post', '/run')(passReq, failRes);

    expect(failRes.statusCode).toBe(200);
    expect(failRes.body.success).toBe(true);
    expect(failRes.body.status).toBe('wrong_answer');
    expect(failRes.body.passed).toBe(1);
    expect(failRes.body.total).toBe(2);
    expect(failRes.body.testsPassed).toBe(1);
    expect(failRes.body.totalTests).toBe(2);
  });
});

describe('Bug 14: Dedicated SQL practice routes & SQLite execution', () => {
  it('GET /api/practice/sql/problems returns the full SQL catalog from @preploop/contracts/sql-problems', async () => {
    const req = {};
    const res = createMockRes();
    await getHandler(practiceRouter, 'get', '/sql/problems')(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.problems)).toBe(true);
    expect(res.body.problems).toHaveLength(SQL_PROBLEMS.length);
    expect(res.body.problems[0]).toMatchObject({
      id: 'sql-1',
      title: 'Select All Customers',
      difficulty: 'Easy',
    });
  });

  it('GET /api/practice/sql/problems/:id returns problem with schema tables/columns and supports sql-1 or 1 without leaking expectedQuery', async () => {
    const res1 = createMockRes();
    await getHandler(practiceRouter, 'get', '/sql/problems/:id')({ params: { id: 'sql-1' } }, res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.problem.id).toBe('sql-1');
    expect(res1.body.problem.schemaId).toBe('ecommerce');
    expect(res1.body.problem.schema.length).toBeGreaterThan(0);
    expect(res1.body.problem.schema[0]).toHaveProperty('tableName');
    expect(res1.body.problem.schema[0].columns[0]).toHaveProperty('isPrimaryKey');
    expect(res1.body.problem.expectedQuery).toBeUndefined();

    const res2 = createMockRes();
    await getHandler(practiceRouter, 'get', '/sql/problems/:id')({ params: { id: '1' } }, res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.problem.id).toBe('sql-1');

    const res404 = createMockRes();
    await getHandler(practiceRouter, 'get', '/sql/problems/:id')({ params: { id: 'sql-9999' } }, res404);
    expect(res404.statusCode).toBe(404);
  });

  it('POST /api/practice/execute executes SQL queries against explicit schemaId', async () => {
    mocks.executeCode.mockImplementation((code, lang, opts) => executeSqlite(code, opts));

    const okRes = createMockRes();
    await getHandler(practiceRouter, 'post', '/execute')(
      { body: { code: "SELECT first_name FROM customers WHERE country = 'USA';", language: 'sql', schemaId: 'ecommerce' } },
      okRes
    );
    expect(okRes.statusCode).toBe(200);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.columns).toEqual(['first_name']);
    expect(okRes.body.rows).toEqual([['Alice']]);

    const badRes = createMockRes();
    await getHandler(practiceRouter, 'post', '/execute')(
      { body: { code: 'SELECT * FORM customers;', language: 'sql', schemaId: 'ecommerce' } },
      badRes
    );
    expect(badRes.statusCode).toBe(200);
    expect(badRes.body.success).toBe(false);
    expect(badRes.body.error).toBeTruthy();
  });
});

describe('Mobile CodeEditorScreen & sqlApi real module verification', () => {
  it('CodeEditorScreen normalizeProblemPayload unwraps nested problem and parses starter_code', () => {
    const normalized = normalizeProblemPayload({
      problem: {
        id: 42,
        title: 'Trapping Rain Water',
        starter_code: '{"javascript":"function trap(height) {}"}',
        examples: [{ input: 'height = [0,1,0]', output: '0' }],
      },
    });
    expect(normalized.title).toBe('Trapping Rain Water');
    expect(normalized.codeTemplates.javascript).toBe('function trap(height) {}');
    expect(normalized.examples).toHaveLength(1);
  });

  it('CodeEditorScreen evaluateSubmissionResult evaluates /submit and /run accurately', () => {
    expect(
      evaluateSubmissionResult({
        success: true,
        testsPassed: 2,
        totalTests: 2,
        message: 'All test cases passed!',
      }).isAccepted
    ).toBe(true);

    expect(
      evaluateSubmissionResult({
        success: true,
        passed: 1,
        total: 3,
        message: '1/3 test cases passed',
      }).isAccepted
    ).toBe(false);

    expect(
      evaluateSubmissionResult({
        status: 'accepted',
      }).isAccepted
    ).toBe(true);
  });

  it('sqlApi calls dedicated SQL routes and unwraps responses', async () => {
    mockApiClient.get.mockResolvedValueOnce({ data: { problems: [{ id: 'sql-1', title: 'Select All Customers' }] } });
    const list = await sqlApi.getProblems();
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/practice/sql/problems');
    expect(list).toHaveLength(1);

    mockApiClient.get.mockResolvedValueOnce({ data: { problem: { id: 'sql-1', schemaId: 'ecommerce' } } });
    const detail = await sqlApi.getProblem('sql-1');
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/practice/sql/problems/sql-1');
    expect(detail.schemaId).toBe('ecommerce');

    mockApiClient.post.mockResolvedValueOnce({ data: { success: true, columns: ['id'], rows: [[1]] } });
    const execResult = await sqlApi.runQuery('SELECT 1 AS id;', 'ecommerce');
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/practice/execute', {
      code: 'SELECT 1 AS id;',
      language: 'sql',
      schemaId: 'ecommerce',
    });
    expect(execResult.success).toBe(true);
  });
});
