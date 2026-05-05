/**
 * Middleware Tests — ETag
 * 
 * Tests the ETag caching middleware that generates weak ETags
 * for GET responses and returns 304 Not Modified when appropriate.
 */

import { describe, it, expect, vi } from 'vitest';
import { etagMiddleware } from '../../middleware/etag.js';

function createMockReq(overrides = {}) {
  return {
    method: 'GET',
    originalUrl: '/api/users',
    headers: {},
    ...overrides,
  };
}

function createMockRes() {
  const headers = {};
  const listeners = {};
  return {
    statusCode: 200,
    _body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    end() {
      this._ended = true;
      return this;
    },
    setHeader(key, value) {
      headers[key] = value;
    },
    getHeader(key) {
      return headers[key];
    },
    on(event, fn) {
      listeners[event] = fn;
    },
    _headers: headers,
    _listeners: listeners,
  };
}

describe('etagMiddleware', () => {
  it('should skip non-GET requests', () => {
    const middleware = etagMiddleware();
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();

    // res.json should remain unmodified
    res.json({ test: true });
    // No ETag should be set
    expect(res._headers['ETag']).toBeUndefined();
  });

  it('should skip excluded paths', () => {
    const middleware = etagMiddleware();
    const req = createMockReq({ originalUrl: '/health' });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should generate ETag for GET JSON responses', () => {
    const middleware = etagMiddleware();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    res.json({ users: [1, 2, 3] });

    expect(res._headers['ETag']).toBeDefined();
    expect(res._headers['ETag']).toMatch(/^W\/"[a-f0-9]+"/);
    expect(res._headers['Cache-Control']).toBe('private, max-age=60, must-revalidate');
  });

  it('should return 304 when If-None-Match matches', () => {
    const middleware = etagMiddleware();
    const body = { users: [1, 2, 3] };

    // First request: get the ETag
    const req1 = createMockReq();
    const res1 = createMockRes();
    middleware(req1, res1, vi.fn());
    res1.json(body);
    const etag = res1._headers['ETag'];

    // Second request: send If-None-Match
    const req2 = createMockReq({ headers: { 'if-none-match': etag } });
    const res2 = createMockRes();
    const middleware2 = etagMiddleware();
    middleware2(req2, res2, vi.fn());
    res2.json(body);

    expect(res2.statusCode).toBe(304);
    expect(res2._ended).toBe(true);
  });

  it('should send full response when If-None-Match does NOT match', () => {
    const middleware = etagMiddleware();
    const req = createMockReq({ headers: { 'if-none-match': 'W/"stale"' } });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    res.json({ data: 'fresh' });

    expect(res.statusCode).toBe(200);
    expect(res._body).toEqual({ data: 'fresh' });
    expect(res._headers['ETag']).toBeDefined();
  });

  it('should skip ETag for error responses', () => {
    const middleware = etagMiddleware();
    const req = createMockReq();
    const res = createMockRes();
    res.statusCode = 404;
    const next = vi.fn();

    middleware(req, res, next);
    res.json({ error: 'Not found' });

    expect(res._headers['ETag']).toBeUndefined();
  });

  it('should produce consistent ETags for same content', () => {
    const body = { answer: 42 };
    const etags = [];

    for (let i = 0; i < 3; i++) {
      const middleware = etagMiddleware();
      const req = createMockReq();
      const res = createMockRes();
      middleware(req, res, vi.fn());
      res.json(body);
      etags.push(res._headers['ETag']);
    }

    expect(etags[0]).toBe(etags[1]);
    expect(etags[1]).toBe(etags[2]);
  });

  it('should respect custom excludePaths', () => {
    const middleware = etagMiddleware({ excludePaths: ['/api/custom'] });
    const req = createMockReq({ originalUrl: '/api/custom/data' });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    res.json({ test: true });

    // Should not have intercepted json since the path is excluded
    expect(res._headers['ETag']).toBeUndefined();
  });
});
