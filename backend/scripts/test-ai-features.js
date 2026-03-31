#!/usr/bin/env node

/**
 * AI Features - Comprehensive Endpoint Test Suite
 * Tests all 11 API endpoints with valid/invalid inputs
 * Usage: npm run test:ai-features
 */

const http = require('http');
const assert = require('assert');

// Configuration
const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
const TEST_AUTH_TOKEN = process.env.TEST_TOKEN || 'test-bearer-token-123';
const TIMEOUT = 30000; // 30 seconds

// Test tracking
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Make HTTP request with proper error handling
 */
async function makeRequest(method, path, body = null, token = TEST_AUTH_TOKEN) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: TIMEOUT,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data,
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test runner
 */
async function test(name, testFn) {
  try {
    await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED' });
    console.log(`${colors.green}✓ ${name}${colors.reset}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`${colors.red}✗ ${name}${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
}

/**
 * Test suite execution
 */
async function runTests() {
  console.log(`\n${colors.blue}=== AI Features - Endpoint Test Suite ===${colors.reset}\n`);
  console.log(`Testing API at: ${API_BASE}\n`);

  // ============================================================
  // CODE REVIEW TESTS (4 endpoints)
  // ============================================================
  console.log(`${colors.blue}Code Review Endpoints:${colors.reset}`);

  let reviewId;

  await test('POST /code-review - Submit code for review', async () => {
    const response = await makeRequest('POST', '/ai-features/code-review', {
      problemId: 123,
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
    });

    assert.strictEqual(response.status, 201, `Expected 201, got ${response.status}`);
    assert(response.body.reviewId, 'Response should include reviewId');
    assert(response.body.scores, 'Response should include scores');

    reviewId = response.body.reviewId;
  });

  await test('POST /code-review - Missing required fields (400)', async () => {
    const response = await makeRequest('POST', '/ai-features/code-review', {
      problemId: 123,
      // missing 'code' field
    });

    assert.strictEqual(response.status, 400, `Expected 400, got ${response.status}`);
  });

  await test('GET /code-review/:reviewId - Fetch specific review', async () => {
    if (!reviewId) {
      throw new Error('Skip: No reviewId from previous test');
    }

    const response = await makeRequest('GET', `/ai-features/code-review/${reviewId}`);
    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert.strictEqual(response.body.reviewId, reviewId, 'ReviewId should match');
  });

  await test('GET /code-review/:reviewId - Invalid ID (404)', async () => {
    const response = await makeRequest('GET', `/ai-features/code-review/invalid-id-99999`);
    assert.strictEqual(response.status, 404, `Expected 404, got ${response.status}`);
  });

  await test('GET /code-review/problem/:problemId - Get reviews by problem', async () => {
    const response = await makeRequest('GET', `/ai-features/code-review/problem/123`);
    assert(
      [200, 404].includes(response.status),
      `Expected 200 or 404, got ${response.status}`
    );
    if (response.status === 200) {
      assert(Array.isArray(response.body.reviews), 'Should return reviews array');
    }
  });

  await test('GET /code-review/history - Get user review history', async () => {
    const response = await makeRequest('GET', `/ai-features/code-review/history?page=1&limit=10`);
    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert(Array.isArray(response.body.reviews), 'Should return reviews array');
    assert('pagination' in response.body, 'Should include pagination info');
  });

  // ============================================================
  // INTERVIEW SIMULATION TESTS (5 endpoints)
  // ============================================================
  console.log(`\n${colors.blue}Interview Simulation Endpoints:${colors.reset}`);

  let sessionId;

  await test('POST /interview/start - Initialize new interview', async () => {
    const response = await makeRequest('POST', '/ai-features/interview/start', {
      interviewType: 'DSA',
      difficulty: 'Medium',
      companyFocus: 'Google',
    });

    assert.strictEqual(response.status, 201, `Expected 201, got ${response.status}`);
    assert(response.body.sessionId, 'Response should include sessionId');
    assert(response.body.problem, 'Response should include problem statement');
    assert(response.body.greeting, 'Response should include interviewer greeting');

    sessionId = response.body.sessionId;
  });

  await test('POST /interview/start - Missing fields (400)', async () => {
    const response = await makeRequest('POST', '/ai-features/interview/start', {
      interviewType: 'DSA',
      // missing difficulty
    });

    assert.strictEqual(response.status, 400, `Expected 400, got ${response.status}`);
  });

  await test('POST /interview/:sessionId/respond - Submit response', async () => {
    if (!sessionId) {
      throw new Error('Skip: No sessionId from initialization');
    }

    const response = await makeRequest('POST', `/ai-features/interview/${sessionId}/respond`, {
      response: 'I would use a hash map to track elements we have seen...',
    });

    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert(response.body.followUp, 'Should include interviewer follow-up');
    assert('hints' in response.body, 'Should include hints array');
  });

  await test('POST /interview/:sessionId/respond - Invalid session (404)', async () => {
    const response = await makeRequest('POST', '/ai-features/interview/invalid-session-99999/respond', {
      response: 'some response',
    });

    assert.strictEqual(response.status, 404, `Expected 404, got ${response.status}`);
  });

  await test('GET /interview/:sessionId - Get session details', async () => {
    if (!sessionId) {
      throw new Error('Skip: No sessionId');
    }

    const response = await makeRequest('GET', `/ai-features/interview/${sessionId}`);
    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert.strictEqual(response.body.sessionId, sessionId, 'SessionId should match');
    assert(response.body.transcript, 'Should include transcript');
  });

  await test('POST /interview/:sessionId/complete - Complete interview', async () => {
    if (!sessionId) {
      throw new Error('Skip: No sessionId');
    }

    const response = await makeRequest('POST', `/ai-features/interview/${sessionId}/complete`, {});

    assert(
      [200, 202].includes(response.status),
      `Expected 200 or 202, got ${response.status}`
    );
    assert('scores' in response.body, 'Should include scores');
    assert(response.body.finalAnalysis, 'Should include final analysis');
  });

  await test('GET /interview/history - Get user interview history', async () => {
    const response = await makeRequest('GET', `/ai-features/interview/history?page=1&limit=10`);
    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert(Array.isArray(response.body.sessions), 'Should return sessions array');
    assert('pagination' in response.body, 'Should include pagination info');
  });

  // ============================================================
  // ANALYTICS TESTS (2 endpoints)
  // ============================================================
  console.log(`\n${colors.blue}Analytics Endpoints:${colors.reset}`);

  await test('GET /performance-trends - Get performance analytics', async () => {
    const response = await makeRequest('GET', `/ai-features/performance-trends?type=dsa`);
    assert(
      [200, 404].includes(response.status),
      `Expected 200 or 404, got ${response.status}`
    );
    if (response.status === 200) {
      assert('trends' in response.body, 'Should include trends data');
    }
  });

  await test('GET /stats - Get usage statistics', async () => {
    const response = await makeRequest('GET', `/ai-features/stats`);
    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert('codeReviewsCount' in response.body, 'Should include codeReviewsCount');
    assert('interviewsCount' in response.body, 'Should include interviewsCount');
  });

  // ============================================================
  // AUTHENTICATION TESTS
  // ============================================================
  console.log(`\n${colors.blue}Authentication Tests:${colors.reset}`);

  await test('Missing auth token (401)', async () => {
    const response = await makeRequest('GET', '/ai-features/stats', null, '');
    assert.strictEqual(response.status, 401, `Expected 401, got ${response.status}`);
  });

  await test('Invalid auth token (403)', async () => {
    const response = await makeRequest('GET', '/ai-features/stats', null, 'invalid-token');
    assert.strictEqual(response.status, 403, `Expected 403, got ${response.status}`);
  });

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================
  console.log(`\n${colors.blue}=== Test Results ===${colors.reset}\n`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  console.log(`Total: ${testResults.passed + testResults.failed}\n`);

  if (testResults.failed > 0) {
    console.log(`${colors.red}Failed tests:${colors.reset}`);
    testResults.tests
      .filter((t) => t.status === 'FAILED')
      .forEach((t) => {
        console.log(`  - ${t.name}`);
        if (t.error) console.log(`    ${t.error}`);
      });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});
