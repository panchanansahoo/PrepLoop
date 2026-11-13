import { describe, it, expect, beforeEach } from 'vitest';
import { createDistributedRateLimitStore } from '../../config/rateLimitStore.js';

describe('Distributed Rate Limit Store (Redis / Upstash / Memory Fallback)', () => {
  let store: any;

  beforeEach(() => {
    store = createDistributedRateLimitStore({
      prefix: 'test-rl:',
      windowMs: 5000,
    });
  });

  it('increments hits and tracks resetTime accurately in memory fallback', async () => {
    const key = 'user-123';
    const first = await store.increment(key);
    expect(first.totalHits).toBe(1);
    expect(first.resetTime).toBeInstanceOf(Date);
    expect(first.resetTime.getTime()).toBeGreaterThan(Date.now());

    const second = await store.increment(key);
    expect(second.totalHits).toBe(2);
    expect(second.resetTime.getTime()).toBe(first.resetTime.getTime());
  });

  it('decrements hits appropriately', async () => {
    const key = 'user-456';
    await store.increment(key);
    await store.increment(key);
    await store.decrement(key);

    const check = await store.increment(key);
    expect(check.totalHits).toBe(2);
  });

  it('resets key completely', async () => {
    const key = 'user-789';
    await store.increment(key);
    await store.increment(key);
    await store.resetKey(key);

    const fresh = await store.increment(key);
    expect(fresh.totalHits).toBe(1);
  });

  it('supports distinct keys without collision', async () => {
    const k1 = 'user-a';
    const k2 = 'user-b';

    await store.increment(k1);
    await store.increment(k1);
    await store.increment(k2);

    const res1 = await store.increment(k1);
    const res2 = await store.increment(k2);

    expect(res1.totalHits).toBe(3);
    expect(res2.totalHits).toBe(2);
  });
});

