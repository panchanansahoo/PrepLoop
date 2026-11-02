import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRequest, Joi } from '../middleware/validation.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
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

test('Universal validateRequest middleware', async (t) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('developer', 'designer', 'manager').default('developer'),
  });

  await t.test('passes valid request body and sets sanitized values', () => {
    const req = {
      body: { email: 'test@example.com', role: 'developer', extraUnknown: 'dropped' },
      query: {},
      params: {},
    };
    const res = createMockRes();
    let nextCalled = false;

    const middleware = validateRequest({ body: schema });
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.body.email, 'test@example.com');
    assert.equal(req.body.extraUnknown, undefined); // stripped
  });

  await t.test('rejects invalid request body with VALIDATION_ERROR code', () => {
    const req = {
      body: { email: 'not-an-email', role: 'invalid_role' },
      query: {},
      params: {},
      originalUrl: '/test',
      method: 'POST',
    };
    const res = createMockRes();
    let nextCalled = false;

    const middleware = validateRequest({ body: schema });
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.includes('email'));
  });
});

