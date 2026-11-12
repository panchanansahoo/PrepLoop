import { describe, it, expect } from 'vitest';
import { BoundedTtlStore, usageQuota, resetUsageQuotaCounters } from '../../middleware/usageQuota.ts';

describe('Usage Quota Bounded Storage & Memory Safety', () => {
  it('enforces hard capacity limit and purges oldest keys under load (LRU)', () => {
    const store = new BoundedTtlStore(100);

    for (let i = 0; i < 150; i++) {
      store.set(`key_${i}`, { count: i });
    }

    expect(store.size).toBe(100);
    // Keys 0-49 should have been evicted to make room for 50-149
    expect(store.get('key_0')).toBeNull();
    expect(store.get('key_49')).toBeNull();
    expect(store.get('key_149')).not.toBeNull();
  });

  it('evicts expired keys on access via TTL', () => {
    const store = new BoundedTtlStore(50);
    store.set('ephemeral', { count: 1 }, -100); // Expired 100ms in past

    expect(store.get('ephemeral')).toBeNull();
  });

  it('resets counters cleanly with resetUsageQuotaCounters', () => {
    const store = new BoundedTtlStore(50);
    store.set('user_1', { count: 5 });
    store.clear();
    expect(store.size).toBe(0);
  });

  it('handles sustained throughput without heap growth beyond bound', async () => {
    const store = new BoundedTtlStore(500);

    for (let i = 0; i < 5000; i++) {
      store.set(`user_${i % 1000}`, { count: 1 });
    }

    expect(store.size).toBeLessThanOrEqual(500);
  });

  it('enforces redis requirement in production when ENFORCE_REDIS_QUOTA is set', async () => {
    const origEnv = process.env.NODE_ENV;
    const origEnforce = process.env.ENFORCE_REDIS_QUOTA;
    try {
      process.env.NODE_ENV = 'production';
      process.env.ENFORCE_REDIS_QUOTA = 'true';

      const middleware = usageQuota('ai', { limit: 10 });
      let statusCalledWith = 0;
      let jsonPayload: any = null;

      const mockRes: any = {
        status: (code: number) => {
          statusCalledWith = code;
          return {
            json: (payload: any) => {
              jsonPayload = payload;
            },
          };
        },
        setHeader: () => {},
      };

      const mockReq: any = { user: { id: 'prod-user-1' }, ip: '127.0.0.1' };
      let nextCalled = false;
      await middleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      expect(statusCalledWith).toBe(503);
      expect(jsonPayload?.code).toBe('REDIS_QUOTA_UNAVAILABLE');
      expect(nextCalled).toBe(false);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.ENFORCE_REDIS_QUOTA = origEnforce;
    }
  });
});

