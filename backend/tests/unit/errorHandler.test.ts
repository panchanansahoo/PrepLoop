import { describe, it, expect } from 'vitest';
import { errorHandler, AppError, ErrorCodes } from '../../middleware/errorHandler.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null as any,
    locals: {},
    headers: new Map(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers.set(name, value);
    },
  };
  return res;
}

describe('Centralized Error Handler Middleware', () => {
  it('formats AppError with custom status code, ErrorCode, and requestId', () => {
    const err = new AppError('Resource was not found', 404, ErrorCodes.NOT_FOUND);
    const req = { requestId: 'req_test_123', originalUrl: '/api/resource', method: 'GET' } as any;
    const res = createMockRes();

    errorHandler(err, req, res as any, () => {});

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCodes.NOT_FOUND);
    expect(res.body.message).toBe('Resource was not found');
    expect(res.body.requestId).toBe('req_test_123');
  });

  it('maps Supabase PGRST116 code to NOT_FOUND', () => {
    const err: any = new Error('Row not found');
    err.code = 'PGRST116';
    const req = { requestId: 'req_sb_456', originalUrl: '/api/profile', method: 'GET' } as any;
    const res = createMockRes();

    errorHandler(err, req, res as any, () => {});

    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe(ErrorCodes.NOT_FOUND);
    expect(res.body.message).toBe('Resource not found');
  });

  it('defaults unhandled errors to 500 INTERNAL_ERROR', () => {
    const err = new Error('Unexpected crash in worker');
    const req = { requestId: 'req_unhandled_789', originalUrl: '/api/fail', method: 'POST' } as any;
    const res = createMockRes();

    errorHandler(err, req, res as any, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(res.body.success).toBe(false);
  });
});
