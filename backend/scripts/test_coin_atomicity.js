/**
 * Regression Test: Verify atomic coin transactions eliminate race conditions
 * 
 * This test simulates concurrent problem submissions by the same user
 * to verify that coin awards are not duplicated.
 * 
 * Expected: Two concurrent first-solve submissions should award 10 coins total (not 20)
 * Idempotency Key: problem_solve:userId:problemId prevents duplicate awards
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test data
const authToken = process.env.TEST_AUTH_TOKEN;
const testUserId = process.env.TEST_USER_ID;
const testProblemId = 1; // Used the seeded problem 1 (Two Sum)

const TIMEOUT_MS = 5000;
const CONCURRENT_REQUESTS = 2;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate a concurrent problem submission request
 */
async function submitProblem(requestId) {
  try {
    const response = await Promise.race([
      fetch(`${API_BASE}/api/practice/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Request-ID': `concurrent-test-${Date.now()}-${requestId}`, // Unique per request
        },
        body: JSON.stringify({
          problemId: testProblemId,
          code: 'function twoSum(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { const c = target - nums[i]; if (m.has(c)) return [m.get(c), i]; m.set(nums[i], i); } }',
          language: 'javascript',
        }),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      ),
    ]);

    let data = {};
    try {
      data = await response.json();
    } catch {
      const bodyText = await response.text();
      return {
        requestId,
        success: false,
        status: response.status,
        coinsAwarded: 0,
        currentCoins: null,
        error: `Non-JSON response (status ${response.status}): ${bodyText.slice(0, 120)}`,
      };
    }

    return {
      requestId,
      success: response.ok,
      status: response.status,
      coinsAwarded: data.coinsAwarded || 0,
      currentCoins: data.currentCoins || null,
      error: data.error || null,
    };
  } catch (error) {
    return {
      requestId,
      success: false,
      error: error.message,
      coinsAwarded: 0,
    };
  }
}

/**
 * Fetch current user coin balance
 */
async function getUserBalance() {
  try {
    const response = await fetch(`${API_BASE}/api/coins/balance`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    return data.coins || 0;
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    return null;
  }
}

/**
 * Main test suite
 */
async function runRegressionTests() {
  console.log('🧪 Atomic Coin Transaction Regression Tests\n');
  console.log(`Configuration:`);
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Test Problem ID: ${testProblemId}`);
  console.log(`  Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`  Timeout: ${TIMEOUT_MS}ms\n`);

  if (!authToken || !testUserId) {
    console.warn('⚠️  TEST_AUTH_TOKEN or TEST_USER_ID not set. Please set environment variables:');
    console.warn('   export TEST_AUTH_TOKEN="your_bearer_token"');
    console.warn('   export TEST_USER_ID="your_user_id"');
    console.warn('\nSkipping tests. To run:');
    console.warn('   TEST_AUTH_TOKEN="token" TEST_USER_ID="id" node backend/scripts/test_coin_atomicity.js\n');
    process.exit(0);
  }

  try {
    // Check API health
    console.log('1️⃣  Checking API health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (!healthResponse.ok) {
      console.error('❌ API not responding. Ensure backend is running on port 5000.');
      process.exit(1);
    }
    console.log('✅ API is healthy.\n');

    // Get initial balance
    console.log('2️⃣  Recording initial balance...');
    const initialBalance = await getUserBalance();
    if (initialBalance === null) {
      console.error('❌ Failed to fetch initial balance. Check auth token.');
      process.exit(1);
    }
    console.log(`✅ Initial balance: ${initialBalance} coins\n`);

    // Run concurrent submissions
    console.log(`3️⃣  Submitting ${CONCURRENT_REQUESTS} concurrent problem solutions...`);
    const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
      submitProblem(i + 1)
    );
    
    // Fire all requests simultaneously
    const results = await Promise.all(requests);
    
    console.log('\nResults:');
    results.forEach((result, idx) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  Request ${result.requestId}: ${status} Coins awarded: ${result.coinsAwarded}`);
      if (result.error) console.log(`           Error: ${result.error}`);
    });

    // Get final balance
    await sleep(500); // Brief delay to allow DB to catch up
    console.log('\n4️⃣  Checking final balance...');
    const finalBalance = await getUserBalance();
    console.log(`✅ Final balance: ${finalBalance} coins`);

    // Validate idempotency
    console.log('\n5️⃣  Validating atomic transaction behavior...');
    const coinsAdded = finalBalance - initialBalance;
    const totalAwarded = results.reduce((sum, r) => sum + r.coinsAwarded, 0);

    console.log(`\n📊 Analysis:`);
    console.log(`   Initial balance:     ${initialBalance} coins`);
    console.log(`   Final balance:       ${finalBalance} coins`);
    console.log(`   Coins added:         ${coinsAdded} coins`);
    console.log(`   Sum of awards:       ${totalAwarded} coins`);

    // Expected: 10 coins (one first-solve, one duplicate skipped due to idempotency)
    const EXPECTED_FIRST_SOLVE_REWARD = 10;
    
    if (coinsAdded === EXPECTED_FIRST_SOLVE_REWARD) {
      console.log(`\n✅ SUCCESS: Atomic transactions working correctly!`);
      console.log(`   Race condition prevented: Only ${EXPECTED_FIRST_SOLVE_REWARD} coins awarded (not ${EXPECTED_FIRST_SOLVE_REWARD * CONCURRENT_REQUESTS})`);
      console.log(`   Idempotency verification: reference_key prevented duplicate awards`);
      process.exit(0);
    } else if (coinsAdded === EXPECTED_FIRST_SOLVE_REWARD * CONCURRENT_REQUESTS) {
      console.error(`\n❌ FAILURE: Race condition still present!`);
      console.error(`   Expected: ${EXPECTED_FIRST_SOLVE_REWARD} coins`);
      console.error(`   Got: ${coinsAdded} coins (duplicate awards detected)`);
      console.error(`\n⚠️  Migration may not be applied. Run migration in Supabase SQL editor first.`);
      process.exit(1);
    } else {
      console.warn(`\n⚠️  Unexpected result:`);
      console.warn(`   Expected: ${EXPECTED_FIRST_SOLVE_REWARD} coins`);
      console.warn(`   Got: ${coinsAdded} coins`);
      console.warn(`   This may indicate a partial failure or retry logic.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runRegressionTests();
