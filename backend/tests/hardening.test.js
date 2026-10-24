import assert from 'node:assert/strict';
import test from 'node:test';

import { apiCacheMiddleware } from '../middleware/apiCache.js';
import { csrfProtection } from '../middleware/csrf.js';
import { usageQuota } from '../middleware/usageQuota.js';

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      headers.set(name, value);
    },
    getHeader(name) {
      return headers.get(name);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('usage quota permits requests and exposes remaining capacity', async () => {
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

  await middleware({ ip: '127.0.0.1', user: { id: 'user-1' } }, response, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(response.getHeader('X-Usage-Limit'), 2);
  assert.equal(response.getHeader('X-Usage-Remaining'), 1);
});

test('usage quota rejects requests after the local limit', async () => {
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
  const request = { ip: '127.0.0.2' };
  const firstResponse = createResponse();
  const secondResponse = createResponse();
  let nextCalls = 0;

  await middleware(request, firstResponse, () => {
    nextCalls += 1;
  });
  await middleware(request, secondResponse, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(secondResponse.statusCode, 429);
  assert.equal(secondResponse.body.code, 'USAGE_LIMIT_EXCEEDED');
  assert.ok(Number(secondResponse.getHeader('Retry-After')) >= 1);
});

test('persistent quota denial is enforced for authenticated users', async () => {
  const response = createResponse();
  let nextCalls = 0;
  const middleware = usageQuota('ai', {
    limit: 10,
    counterStore: new Map(),
    client: {
      rpc() {
        return { data: [{ allowed: false }], error: null };
      },
    },
  });

  test('plan-aware quota uses the authenticated subscription tier', async () => {
    const store = new Map();
    const response = createResponse();
    const middleware = usageQuota('ai', {
      counterStore: store,
      client: {
        from() {
          return {
            select() {
              return {
                eq() {
                  return {
                    maybeSingle() {
                      return Promise.resolve({ data: { subscription_tier: 'pro' }, error: null });
                    },
                  };
                },
              };
            },
          };
        },
        rpc() {
          return Promise.resolve({ data: [{ allowed: true }], error: null });
        },
      },
    });

    await middleware({ ip: '127.0.0.4', user: { id: `plan-test-${Date.now()}` } }, response, () => {});
    assert.equal(response.getHeader('X-Usage-Limit'), 500);
  });

  await middleware({ ip: '127.0.0.3', user: { id: 'user-2' } }, response, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 0);
  assert.equal(response.statusCode, 429);
  assert.equal(response.body.code, 'USAGE_LIMIT_EXCEEDED');
});

test('authenticated cache requests bypass the anonymous cache', () => {
  const middleware = apiCacheMiddleware({ ttl: 60_000 });
  const request = {
    method: 'GET',
    originalUrl: '/api/profile',
    headers: { authorization: 'Bearer token' },
  };
  const response = createResponse();
  let nextCalls = 0;

  middleware(request, response, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(response.getHeader('X-Cache'), undefined);
});

test('anonymous cache requests reuse successful responses', () => {
  const middleware = apiCacheMiddleware({ ttl: 60_000 });
  const request = {
    method: 'GET',
    originalUrl: '/api/public-health',
    headers: {},
  };
  const firstResponse = createResponse();
  let firstNextCalls = 0;

  middleware(request, firstResponse, () => {
    firstNextCalls += 1;
    firstResponse.json({ ok: true });
  });

  test('CSRF protection skips bearer and anonymous requests', () => {
    const bearerResponse = createResponse();
    const anonymousResponse = createResponse();
    let bearerNext = 0;
    let anonymousNext = 0;

    csrfProtection(
      { method: 'POST', headers: { authorization: 'Bearer token' } },
      bearerResponse,
      () => { bearerNext += 1; },
    );
    csrfProtection(
      { method: 'POST', headers: {} },
      anonymousResponse,
      () => { anonymousNext += 1; },
    );

    assert.equal(bearerNext, 1);
    assert.equal(anonymousNext, 1);
  });

  test('CSRF protection rejects authenticated cookie mutations without a matching token', () => {
    const response = createResponse();
    let nextCalls = 0;
    csrfProtection(
      {
        method: 'POST',
        headers: { cookie: 'preploop_access=session-token; __csrf_token=expected' },
      },
      response,
      () => { nextCalls += 1; },
    );

    assert.equal(nextCalls, 0);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.code, 'CSRF_TOKEN_MISSING');
  });

  const secondResponse = createResponse();
  let secondNextCalls = 0;
  middleware(request, secondResponse, () => {
    secondNextCalls += 1;
  });

  assert.equal(firstNextCalls, 1);
  assert.equal(secondNextCalls, 0);
  assert.deepEqual(secondResponse.body, { ok: true });
  assert.equal(secondResponse.getHeader('X-Cache'), 'HIT');
});
