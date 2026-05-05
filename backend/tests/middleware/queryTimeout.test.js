/**
 * Middleware Tests — queryTimeout
 * 
 * Tests the per-request timeout middleware that protects
 * against runaway queries and slow AI operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryTimeout } from '../../middleware/queryTimeout.js';

function createMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    originalUrl: '/api/test',
    headers: {},
    ...overrides,
  };
}

function createMockRes() {
  const listeners = {};
  return {
    headersSent: false,
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    on(event, fn) {
      listeners[event] = fn;
    },
    emit(event) {
      if (listeners[event]) listeners[event]();
    },
    _listeners: listeners,
  };
}

describe('queryTimeout middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should call next immediately for normal requests', () => {
    const middleware = queryTimeout();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should skip health check paths', () => {
    const middleware = queryTimeout();
    const req = createMockReq({ path: '/health' });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should skip websocket upgrades', () => {
    const middleware = queryTimeout();
    const req = createMockReq({ headers: { upgrade: 'websocket' } });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should return 504 after default timeout', () => {
    const middleware = queryTimeout({ timeoutMs: 1000 });
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    // Advance past timeout
    vi.advanceTimersByTime(1100);

    expect(res.statusCode).toBe(504);
    expect(res._body.error).toBe('Request timeout');
  });

  it('should use longer timeout for AI paths', () => {
    const middleware = queryTimeout({ timeoutMs: 1000, longTimeoutMs: 5000 });
    const req = createMockReq({ originalUrl: '/api/ai/generate' });
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    // After default timeout, should NOT have timed out
    vi.advanceTimersByTime(1100);
    expect(res._body).toBeUndefined();

    // After long timeout, should time out
    vi.advanceTimersByTime(4000);
    expect(res.statusCode).toBe(504);
  });

  it('should not send timeout if response already sent', () => {
    const middleware = queryTimeout({ timeoutMs: 1000 });
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    // Simulate response already sent
    res.headersSent = true;
    vi.advanceTimersByTime(1100);

    expect(res._body).toBeUndefined(); // No timeout response set
  });

  it('should clear timeout on response finish', () => {
    const middleware = queryTimeout({ timeoutMs: 1000 });
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    // Emit 'finish' before timeout
    res.emit('finish');

    vi.advanceTimersByTime(1100);
    expect(res._body).toBeUndefined(); // Timeout was cleared
  });
});
