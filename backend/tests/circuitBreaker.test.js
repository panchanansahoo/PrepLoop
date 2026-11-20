import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { CircuitBreaker, breakers } from '../utils/circuitBreaker.js';

const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

describe('Circuit Breaker Resilience Suite', () => {
  it('Should initialize in CLOSED state', () => {
    const breaker = new CircuitBreaker('test-1');
    assert.equal(breaker.state, STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
  });

  it('Should stay CLOSED on successful execution', async () => {
    const breaker = new CircuitBreaker('test-2');
    const result = await breaker.execute(() => Promise.resolve('success'));
    assert.equal(breaker.state, STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
    assert.equal(result, 'success', `Expected 'success', got ${result}`);
  });

  it('Should open after reaching failure threshold', async () => {
    const breaker = new CircuitBreaker('test-3', { failureThreshold: 3 });

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Failed')));
      } catch {
        // Expected failures
      }
    }

    assert.equal(breaker.state, STATES.OPEN, `Expected OPEN, got ${breaker.state}`);
  });

  it('Should reject requests when OPEN', async () => {
    const breaker = new CircuitBreaker('test-4', { failureThreshold: 1 });

    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected
    }

    assert.equal(breaker.state, STATES.OPEN, 'Circuit should be OPEN');

    try {
      await breaker.execute(() => Promise.resolve('success'));
      throw new Error('Should have thrown CircuitBreakerOpenError');
    } catch (error) {
      assert.equal(error.isCircuitBreakerError, true, 'Error should be CircuitBreakerOpenError');
    }
  });

  it('Should transition to HALF_OPEN after reset timeout', async () => {
    const breaker = new CircuitBreaker('test-5', {
      failureThreshold: 1,
      resetTimeout: 100, // 100ms for testing
    });

    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected
    }

    assert.equal(breaker.state, STATES.OPEN, 'Circuit should be OPEN');

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Next execution attempt should transition to HALF_OPEN
    try {
      await breaker.execute(() => Promise.resolve('recovered'));
    } catch {
      // May fail, but state should change
    }

    assert.equal(breaker.state, STATES.HALF_OPEN, `Expected HALF_OPEN, got ${breaker.state}`);
  });

  it('Should close after successful recovery in HALF_OPEN', async () => {
    const breaker = new CircuitBreaker('test-6', {
      failureThreshold: 1,
      resetTimeout: 100,
      halfOpenMaxAttempts: 2,
    });

    // Open the circuit
    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected
    }

    // Wait for recovery window
    await new Promise((resolve) => setTimeout(resolve, 150));

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

    assert.equal(breaker.state, STATES.CLOSED, `Expected CLOSED, got ${breaker.state}`);
  });

  it('Should reset failure count on success', async () => {
    const breaker = new CircuitBreaker('test-7', { failureThreshold: 3 });

    // Add 2 failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Failed')));
      } catch {
        // Expected
      }
    }
    assert.equal(breaker.failureCount, 2, `Expected 2 failures, got ${breaker.failureCount}`);

    // Success should reset
    await breaker.execute(() => Promise.resolve('success'));
    assert.equal(breaker.failureCount, 0, `Expected 0 failures after success, got ${breaker.failureCount}`);
  });

  it('Should provide accurate metrics', async () => {
    const breaker = new CircuitBreaker('test-8');

    await breaker.execute(() => Promise.resolve('test'));

    const status = breaker.getStatus();
    assert.equal(status.name, 'test-8', 'Name should be test-8');
    assert.equal(status.state, STATES.CLOSED, 'State should be CLOSED');
    assert.ok(status.successCount > 0, 'Success count should be > 0');
  });

  it('Should reset circuit manually', async () => {
    const breaker = new CircuitBreaker('test-9', { failureThreshold: 1 });

    try {
      await breaker.execute(() => Promise.reject(new Error('Failed')));
    } catch {
      // Expected
    }

    assert.equal(breaker.state, STATES.OPEN, 'Circuit should be OPEN');
    breaker.reset();
    assert.equal(breaker.state, STATES.CLOSED, 'Circuit should be CLOSED after reset');
  });

  it('Should have pre-configured breakers', () => {
    assert.ok(breakers.gemini !== undefined, 'gemini breaker not found');
    assert.ok(breakers.groq !== undefined, 'groq breaker not found');
    assert.ok(breakers.elevenLabs !== undefined, 'elevenLabs breaker not found');
    assert.ok(breakers.razorpay !== undefined, 'razorpay breaker not found');
  });

  it('Should propagate underlying errors', async () => {
    const breaker = new CircuitBreaker('test-11');
    const testError = new Error('Test error');

    try {
      await breaker.execute(() => Promise.reject(testError));
      throw new Error('Should have thrown');
    } catch (error) {
      assert.equal(error, testError, 'Should propagate original error');
    }
  });

  it('Should handle concurrent requests in CLOSED state', async () => {
    const breaker = new CircuitBreaker('test-12');

    const promises = Array(5)
      .fill(null)
      .map(() => breaker.execute(() => Promise.resolve('success')));

    const results = await Promise.all(promises);
    assert.equal(results.length, 5, 'Should complete all requests');
    assert.equal(breaker.state, STATES.CLOSED, 'Circuit should remain CLOSED');
  });
});
