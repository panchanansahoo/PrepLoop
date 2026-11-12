import { describe, it, expect } from 'vitest';
import { csrfProtection } from '../../middleware/csrf.js';
import { usageQuota } from '../../middleware/usageQuota.ts';

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: null as any,
    setHeader(name: string, value: any) {
      headers.set(name, value);
    },
    getHeader(name: string) {
      return headers.get(name);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
}

describe('Security Hardening & Quota Guardrails', () => {
  it('usage quota permits requests and tracks remaining capacity', async () => {
    const store = new Map();
    const response = createResponse();
    let nextCalls = 0;
    const middleware = usageQuota('ai', {
      limit: 2,
      counterStore: store,
      client: {
        rpc() {
          return { data: [{ allowed: true }], error: null };
        },
      },
    });

    await middleware({ ip: '127.0.0.1', user: { id: 'user-1' } } as any, response as any, () => {
      nextCalls += 1;
    });

    expect(nextCalls).toBe(1);
    expect(response.getHeader('X-Usage-Limit')).toBe(2);
    expect(response.getHeader('X-Usage-Remaining')).toBe(1);
  });

  it('usage quota throttles requests exceeding configured rate window', async () => {
    const store = new Map();
    const middleware = usageQuota('voice', {
      limit: 1,
      counterStore: store,
      client: {
        rpc() {
          return { data: [{ allowed: true }], error: null };
        },
      },
    });

    const res1 = createResponse();
    await middleware({ ip: '127.0.0.1', user: { id: 'user-2' } } as any, res1 as any, () => {});

    const res2 = createResponse();
    let secondNextCalled = false;
    await middleware({ ip: '127.0.0.1', user: { id: 'user-2' } } as any, res2 as any, () => {
      secondNextCalled = true;
    });

    expect(secondNextCalled).toBe(false);
    expect(res2.statusCode).toBe(429);
    expect(res2.body.code).toBe('USAGE_LIMIT_EXCEEDED');
  });

  it('csrfProtection blocks cookie-authenticated state-changing requests missing CSRF token', () => {
    const req = {
      method: 'POST',
      headers: {
        cookie: 'preploop_access=session_cookie_123',
      },
      path: '/api/user/profile',
    };
    const res = createResponse();
    let nextCalled = false;

    csrfProtection(req as any, res as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('csrfProtection passes cookie requests when valid double-submit CSRF token is provided', () => {
    const token = 'valid_csrf_token_secret_32bytes';
    const req = {
      method: 'POST',
      headers: {
        cookie: `preploop_access=session_123; __csrf_token=${token}`,
        'x-csrf-token': token,
      },
      path: '/api/user/profile',
    };
    const res = createResponse();
    let nextCalled = false;

    csrfProtection(req as any, res as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  it('csrfProtection permits safe GET requests without CSRF verification', () => {
    const req = {
      method: 'GET',
      headers: {},
      path: '/api/problems',
    };
    const res = createResponse();
    let nextCalled = false;

    csrfProtection(req as any, res as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  it('csrfProtection skips check when using Bearer auth header', () => {
    const req = {
      method: 'POST',
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
      },
      path: '/api/interview/start',
    };
    const res = createResponse();
    let nextCalled = false;

    csrfProtection(req as any, res as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });
});
