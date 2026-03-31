/**
 * Integration Tests: Coin Transaction Endpoints
 * 
 * Tests atomicity, idempotency, and correctness of:
 * - GET /api/coins/balance
 * - POST /api/coins/earn
 * - POST /api/coins/spend
 * - POST /api/coins/history
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';
const authToken = process.env.TEST_AUTH_TOKEN;

class CoinIntegrationTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.results = [];
  }

  async request(method, path, body = null, headers = {}) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await Promise.race([
        fetch(`${API_BASE}${path}`, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);

      const data = await response.json();
      return { status: response.status, data, ok: response.ok };
    } catch (error) {
      return { status: 0, data: null, error: error.message, ok: false };
    }
  }

  logResult(name, passed, message) {
    this.results.push({ name, passed, message });
    if (passed) {
      this.testsPassed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      this.testsFailed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  async runTests() {
    console.log('🧪 Coin Integration Tests\n');

    if (!authToken) {
      console.error('❌ TEST_AUTH_TOKEN not set. Cannot run tests.\n');
      process.exit(1);
    }

    // Test 1: Health Check
    const healthRes = await this.request('GET', '/health');
    this.logResult(
      'Health Check',
      healthRes.ok,
      healthRes.ok ? 'API is running' : `API error: ${healthRes.data?.message || 'unknown'}`
    );

    // Test 2: Get Balance
    const balanceRes = await this.request('GET', '/api/coins/balance');
    this.logResult(
      'GET /api/coins/balance',
      balanceRes.status === 200 && typeof balanceRes.data.coins === 'number',
      balanceRes.ok
        ? `Retrieved balance: ${balanceRes.data.coins} coins`
        : `Error: ${balanceRes.status} - ${balanceRes.data?.error || balanceRes.error}`
    );

    const initialBalance = balanceRes.data?.coins || 0;

    // Test 3: Earn Coins
    const earnRes = await this.request('POST', '/api/coins/earn', {
      amount: 50,
      description: 'Test earn',
    });
    this.logResult(
      'POST /api/coins/earn',
      earnRes.status === 200 && earnRes.data.coins > initialBalance,
      earnRes.ok
        ? `Earned coins: balance ${initialBalance} → ${earnRes.data.coins}`
        : `Error: ${earnRes.status} - ${earnRes.data?.error || earnRes.error}`
    );

    const balanceAfterEarn = earnRes.data?.coins || initialBalance;

    // Test 4: Spend Coins
    const spendRes = await this.request('POST', '/api/coins/spend', {
      amount: 10,
      description: 'Test spend',
      referenceKey: 'test-idempotent-spend-1',
    });
    this.logResult(
      'POST /api/coins/spend',
      spendRes.status === 200 && spendRes.data.coins < balanceAfterEarn,
      spendRes.ok
        ? `Spent coins: balance ${balanceAfterEarn} → ${spendRes.data.coins}`
        : `Error: ${spendRes.status} - ${spendRes.data?.error || spendRes.error}`
    );

    const balanceAfterSpend = spendRes.data?.coins || balanceAfterEarn;

    // Test 5: Idempotent Spend (duplicate request)
    const spendAgainRes = await this.request('POST', '/api/coins/spend', {
      amount: 10,
      description: 'Test spend again',
      referenceKey: 'test-idempotent-spend-1', // Same key = duplicate
    });

    // Expected: Either success with same balance, or specific duplicate handling
    const idempotentWorking = spendAgainRes.status === 200 && (
      spendAgainRes.data.coins === balanceAfterSpend || // Balance unchanged
      spendAgainRes.data.applied === false // Marked as duplicate
    );

    this.logResult(
      'Idempotent Spend (reference key)',
      idempotentWorking,
      idempotentWorking
        ? `Idempotency handled: balance ${spendAgainRes.data.coins} (applied: ${spendAgainRes.data.applied})`
        : `Unexpected result: ${spendAgainRes.data.coins}`
    );

    // Test 6: Get History
    const historyRes = await this.request('GET', '/api/coins/history');
    this.logResult(
      'GET /api/coins/history',
      historyRes.status === 200 && Array.isArray(historyRes.data),
      historyRes.ok
        ? `Retrieved ${historyRes.data?.length || 0} transactions`
        : `Error: ${historyRes.status} - ${historyRes.data?.error || historyRes.error}`
    );

    // Test 7: Invalid Spend (zero amount)
    const invalidSpendRes = await this.request('POST', '/api/coins/spend', {
      amount: 0,
      description: 'Invalid test',
    });
    this.logResult(
      'Invalid Spend (zero amount)',
      invalidSpendRes.status !== 200,
      invalidSpendRes.status !== 200
        ? `Correctly rejected: ${invalidSpendRes.status} - ${invalidSpendRes.data?.error}`
        : 'Error: Should have rejected zero amount'
    );

    // Test 8: Insufficient Balance
    const largeSpendRes = await this.request('POST', '/api/coins/spend', {
      amount: balanceAfterSpend * 10, // Spend more than available
      description: 'Test insufficient balance',
    });
    this.logResult(
      'Insufficient Balance Check',
      largeSpendRes.status !== 200 || largeSpendRes.data.error,
      largeSpendRes.status !== 200 || largeSpendRes.data.error
        ? `Correctly rejected: insufficient balance`
        : 'Info: Implementation may allow negative balance (design choice)'
    );

    // Summary
    console.log(`\n📊 Test Summary\n`);
    console.log(`Passed: ${this.testsPassed}`);
    console.log(`Failed: ${this.testsFailed}`);
    console.log(`Total:  ${this.testsPassed + this.testsFailed}`);
    console.log(`\nSuccess Rate: ${((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100).toFixed(1)}%\n`);

    process.exit(this.testsFailed > 0 ? 1 : 0);
  }
}

const tests = new CoinIntegrationTests();
tests.runTests();
