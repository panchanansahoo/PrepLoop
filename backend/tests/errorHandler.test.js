import assert from 'node:assert/strict';
import test from 'node:test';
import { errorHandler, AppError, ErrorCodes } from '../middleware/errorHandler.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    locals: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test('Centralized error handler middleware', async (t) => {
  await t.test('formats AppError with custom status code and ErrorCode', () => {
    const err = new AppError('Resource was not found', 404, ErrorCodes.NOT_FOUND);
    const req = { requestId: 'req_test_123', originalUrl: '/api/resource', method: 'GET' };
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, ErrorCodes.NOT_FOUND);
    assert.equal(res.body.message, 'Resource was not found');
    assert.equal(res.body.requestId, 'req_test_123');
  });

  await t.test('maps Supabase PGRST116 code to NOT_FOUND', () => {
    const err = new Error('Row not found');
    err.code = 'PGRST116';
    const req = { requestId: 'req_sb_456', originalUrl: '/api/profile', method: 'GET' };
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, ErrorCodes.NOT_FOUND);
  });

  await t.test('defaults unhandled errors to 500 INTERNAL_ERROR', () => {
    const err = new Error('Unexpected crash');
    const req = { requestId: 'req_unhandled', originalUrl: '/api/fail', method: 'POST' };
    const res = createMockRes();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.code, ErrorCodes.INTERNAL_ERROR);
    assert.equal(res.body.success, false);
  });
});

