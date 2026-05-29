/**
 * Circuit Breaker Tests
 * 
 * Usage: npm run test:circuit-breaker
 * Or: npx node backend/tests/circuitBreaker.test.js
 */

import { CircuitBreaker, CircuitBreakerOpenError, breakers } from '../utils/circuitBreaker.js';

const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, title, message) {
  console.log(`${color}${title}${colors.reset} ${message}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(colors.green, '✓', name);
    return true;
  } catch (error) {
    log(colors.red, '✗', name);
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ─── Test Suite ───
let passed = 0;
let failed = 0;

// Test 1: Circuit breaker initializes in CLOSED state
if (await test('Should initialize in CLOSED state', async () => {
  const breaker = new CircuitBreaker('test-1');
  assert(breaker.state === STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
})) passed++; else failed++;

// Test 2: Circuit breaker stays CLOSED on success
if (await test('Should stay CLOSED on successful execution', async () => {
  const breaker = new CircuitBreaker('test-2');
  const result = await breaker.execute(() => Promise.resolve('success'));
  assert(breaker.state === STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
  assert(result === 'success', `Expected 'success', got ${result}`);
})) passed++; else failed++;

// Test 3: Circuit breaker opens after reaching failure threshold
if (await test('Should open after reaching failure threshold', async () => {
  const breaker = new CircuitBreaker('test-3', { failureThreshold: 3 });
  
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected failures
    }
  }
  
  assert(breaker.state === STATES.OPEN, `Expected OPEN, got ${breaker.state}`);
})) passed++; else failed++;

// Test 4: Circuit breaker rejects requests when OPEN
if (await test('Should reject requests when OPEN', async () => {
  const breaker = new CircuitBreaker('test-4', { failureThreshold: 1 });
  
  try {
    await breaker.execute(() => Promise.reject(new Error('Failed')));
  } catch {
    // Expected
  }
  
  assert(breaker.state === STATES.OPEN, 'Circuit should be OPEN');
  
  try {
    await breaker.execute(() => Promise.resolve('success'));
    throw new Error('Should have thrown CircuitBreakerOpenError');
  } catch (error) {
    assert(error.isCircuitBreakerError === true, 'Error should be CircuitBreakerOpenError');
  }
})) passed++; else failed++;

// Test 5: Circuit breaker transitions to HALF_OPEN after timeout
if (await test('Should transition to HALF_OPEN after reset timeout', async () => {
  const breaker = new CircuitBreaker('test-5', { 
    failureThreshold: 1, 
    resetTimeout: 100 // 100ms for testing
  });
  
  try {
    await breaker.execute(() => Promise.reject(new Error('Failed')));
  } catch {
    // Expected
  }
  
  assert(breaker.state === STATES.OPEN, 'Circuit should be OPEN');
  
  // Wait for reset timeout
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Next execution attempt should transition to HALF_OPEN
  try {
    await breaker.execute(() => Promise.resolve('recovered'));
  } catch {
    // May fail, but state should change
  }
  
  assert(breaker.state === STATES.HALF_OPEN, `Expected HALF_OPEN, got ${breaker.state}`);
})) passed++; else failed++;

// Test 6: Circuit breaker closes after successful recovery
if (await test('Should close after successful recovery in HALF_OPEN', async () => {
  const breaker = new CircuitBreaker('test-6', { 
    failureThreshold: 1,
    resetTimeout: 100,
    halfOpenMaxAttempts: 2
  });
  
  // Open the circuit
  try {
    await breaker.execute(() => Promise.reject(new Error('Failed')));
  } catch {
    // Expected
  }
  
  // Wait for recovery window
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Transition to HALF_OPEN and succeed
  try {
    await breaker.execute(() => Promise.resolve('success'));
    // First success in HALF_OPEN
    
    // Need another success to fully close
    if (breaker.state === STATES.HALF_OPEN) {
      await breaker.execute(() => Promise.resolve('success'));
    }
  } catch {
    // May fail once, but should eventually recover
  }
  
  assert(breaker.state === STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
})) passed++; else failed++;

// Test 7: Failure count resets on success
if (await test('Should reset failure count on success', async () => {
  const breaker = new CircuitBreaker('test-7', { failureThreshold: 3 });
  
  // Add 2 failures
  for (let i = 0; i < 2; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected
    }
  }
  assert(breaker.failureCount === 2, `Expected 2 failures, got ${breaker.failureCount}`);
  
  // Success should reset
  await breaker.execute(() => Promise.resolve('success'));
  assert(breaker.failureCount === 0, `Expected 0 failures after success, got ${breaker.failureCount}`);
})) passed++; else failed++;

// Test 8: Get metrics
if (await test('Should provide accurate metrics', async () => {
  const breaker = new CircuitBreaker('test-8');
  
  await breaker.execute(() => Promise.resolve('test'));
  
  const status = breaker.getStatus();
  assert(status.name === 'test-8', 'Name should be test-8');
  assert(status.state === STATES.CLOSED, 'State should be CLOSED');
  assert(status.successCount > 0, 'Success count should be > 0');
})) passed++; else failed++;

// Test 9: Manual reset
if (await test('Should reset circuit manually', async () => {
  const breaker = new CircuitBreaker('test-9', { failureThreshold: 1 });
  
  try {
    await breaker.execute(() => Promise.reject(new Error('Failed')));
  } catch {
    // Expected
  }
  
  assert(breaker.state === STATES.OPEN, 'Circuit should be OPEN');
  breaker.reset();
  assert(breaker.state === STATES.CLOSED, 'Circuit should be CLOSED after reset');
})) passed++; else failed++;

// Test 10: Pre-configured breakers exist
if (await test('Should have pre-configured breakers', async () => {
  assert(breakers.gemini !== undefined, 'gemini breaker not found');
  assert(breakers.groq !== undefined, 'groq breaker not found');
  assert(breakers.elevenLabs !== undefined, 'elevenLabs breaker not found');
  assert(breakers.razorpay !== undefined, 'razorpay breaker not found');
})) passed++; else failed++;

// Test 11: Error propagation
if (await test('Should propagate underlying errors', async () => {
  const breaker = new CircuitBreaker('test-11');
  const testError = new Error('Test error');
  
  try {
    await breaker.execute(() => Promise.reject(testError));
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error === testError, 'Should propagate original error');
  }
})) passed++; else failed++;

// Test 12: Concurrent requests during CLOSED state
if (await test('Should handle concurrent requests in CLOSED state', async () => {
  const breaker = new CircuitBreaker('test-12');
  
  const promises = Array(5).fill(null).map(() => 
    breaker.execute(() => Promise.resolve('success'))
  );
  
  const results = await Promise.all(promises);
  assert(results.length === 5, 'Should complete all requests');
  assert(breaker.state === STATES.CLOSED, 'Circuit should remain CLOSED');
})) passed++; else failed++;

// Summary
console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}`);
log(colors.blue, '  Results:', `${passed} passed, ${failed} failed`);
console.log(`${colors.blue}═══════════════════════════════════${colors.reset}\n`);

if (failed > 0) {
  process.exit(1);
}
