import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../../utils/circuitBreaker.js';

describe('Circuit Breaker Resilience Pattern', () => {
  it('initializes in CLOSED state', () => {
    const breaker = new CircuitBreaker('test-init');
    expect(breaker.state).toBe('CLOSED');
  });

  it('stays CLOSED on successful executions', async () => {
    const breaker = new CircuitBreaker('test-success');
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(breaker.state).toBe('CLOSED');
    expect(result).toBe('ok');
  });

  it('transitions to OPEN state after reaching failure threshold', async () => {
    const breaker = new CircuitBreaker('test-failure-threshold', { failureThreshold: 3 });

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // Expected
      }
    }

    expect(breaker.state).toBe('OPEN');
  });

  it('rejects requests immediately when in OPEN state', async () => {
    const breaker = new CircuitBreaker('test-open-reject', { failureThreshold: 1 });
    try {
      await breaker.execute(() => Promise.reject(new Error('fail')));
    } catch {}

    expect(breaker.state).toBe('OPEN');

    let errorThrown = false;
    try {
      await breaker.execute(() => Promise.resolve('should not run'));
    } catch (err: any) {
      errorThrown = true;
      expect(err.message).toMatch(/circuit breaker.*is open/i);
    }
    expect(errorThrown).toBe(true);
  });
});
