import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  fetchPayment: vi.fn(),
  createOrder: vi.fn(),
  cacheDelete: vi.fn().mockResolvedValue(null),
  invalidateCache: vi.fn(),
}));

vi.mock('razorpay', () => ({
  default: class {
    orders = { create: fixtures.createOrder };
    payments = { fetch: fixtures.fetchPayment };
  },
}));
vi.mock('../../db/supabaseClient.js', () => ({ supabaseAdmin: { from: fixtures.from, rpc: fixtures.rpc } }));
vi.mock('../../middleware/auth.ts', () => ({ authenticateToken: vi.fn() }));
vi.mock('../../middleware/apiCache.js', () => ({ invalidateCache: fixtures.invalidateCache }));
vi.mock('../../utils/cacheManager.js', () => ({ default: { delete: fixtures.cacheDelete } }));
vi.mock('../../services/featureGateService.ts', () => ({ DEFAULT_FEATURE_GATES: {}, getUserTier: vi.fn() }));

import router, { getPaymentAmount } from '../../routes/payment.js';

const handler = (routePath) => router.stack.find(layer => layer.route?.path === routePath).route.stack.at(-1).handle;
const makeResponse = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.body = data; return this; },
});

const makeOrderQuery = (existing = []) => {
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => Promise.resolve({ data: existing }),
    insert: vi.fn().mockResolvedValue({}),
  };
  return query;
};

const makeVerifyQuery = (record) => {
  const query = {
    select: () => query,
    eq: () => query,
    single: () => Promise.resolve({ data: record }),
  };
  return query;
};

const user = { id: 'customer-1' };
const captured = { id: 'pay_fixture', order_id: 'order_fixture', status: 'captured', amount: 95040, currency: 'INR', created_at: 1700000000 };
const signature = crypto.createHmac('sha256', 'test-payment-secret').update('order_fixture|pay_fixture').digest('hex');
const proof = { razorpay_order_id: captured.order_id, razorpay_payment_id: captured.id, razorpay_signature: signature };

describe('Checkout activation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RAZORPAY_KEY_ID', 'test-key-id');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-payment-secret');
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'test-webhook-secret');
  });

  afterEach(() => vi.unstubAllEnvs());

  describe('Bug 1: Billing cycle pricing and order creation', () => {
    it('computes monthly and annual amounts accurately and rejects invalid inputs', () => {
      expect(getPaymentAmount('pro', 'monthly')).toBe(9900);
      expect(getPaymentAmount('pro', 'annual')).toBe(95040);
      expect(getPaymentAmount('elite', 'monthly')).toBe(29900);
      expect(getPaymentAmount('elite', 'annual')).toBe(287040);
      expect(getPaymentAmount('free', 'monthly')).toBeNull();
      expect(getPaymentAmount('pro', 'weekly')).toBeNull();
    });

    it('creates and records an annual pro order for twelve months with the 20% discount', async () => {
      const query = makeOrderQuery();
      fixtures.from.mockReturnValue(query);
      fixtures.createOrder.mockResolvedValue({ id: 'order_fixture' });

      const res = makeResponse();
      await handler('/create-order')({ user, body: { plan: 'pro', billingCycle: 'annual' } }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(95040);
      expect(res.body.currency).toBe('INR');
      expect(fixtures.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        amount: 95040,
        currency: 'INR',
        notes: expect.objectContaining({ plan: 'pro', billing_cycle: 'annual' }),
      }));
      expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ billing_cycle: 'annual', amount: 95040 }));
    });

    it('creates an annual elite order and normalizes case/whitespace on billingCycle', async () => {
      const query = makeOrderQuery();
      fixtures.from.mockReturnValue(query);
      fixtures.createOrder.mockResolvedValue({ id: 'order_elite_annual' });

      const res = makeResponse();
      await handler('/create-order')({ user, body: { plan: ' ELITE ', billingCycle: ' Annual ' } }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.amount).toBe(287040);
      expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
        plan: 'elite',
        billing_cycle: 'annual',
        amount: 287040,
      }));
    });

    it('defaults omitted billingCycle to monthly and rejects invalid billingCycle or plan with 400', async () => {
      const query = makeOrderQuery();
      fixtures.from.mockReturnValue(query);
      fixtures.createOrder.mockResolvedValue({ id: 'order_monthly' });

      const defaultRes = makeResponse();
      await handler('/create-order')({ user, body: { plan: 'pro' } }, defaultRes);
      expect(defaultRes.statusCode).toBe(200);
      expect(defaultRes.body.amount).toBe(9900);

      const badCycleRes = makeResponse();
      await handler('/create-order')({ user, body: { plan: 'pro', billingCycle: 'quarterly' } }, badCycleRes);
      expect(badCycleRes.statusCode).toBe(400);
      expect(badCycleRes.body.error).toMatch(/invalid billing cycle/i);

      const badPlanRes = makeResponse();
      await handler('/create-order')({ user, body: { plan: 'enterprise', billingCycle: 'annual' } }, badPlanRes);
      expect(badPlanRes.statusCode).toBe(400);
    });
  });

  describe('Bug 2: Atomic activation, non-degraded failure, and retry recovery', () => {
    it('verifies an already-paid order and retries a failed activation without returning success on failure', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id, status: 'paid' }));
      fixtures.fetchPayment.mockResolvedValue(captured);
      fixtures.rpc.mockResolvedValueOnce({ error: { message: 'Database temporarily unavailable' } })
        .mockResolvedValueOnce({ data: { userId: user.id, plan: 'pro', paymentId: captured.id } });

      const failure = makeResponse();
      await handler('/verify')({ user, body: proof }, failure);
      expect(failure.statusCode).toBe(500);
      expect(failure.body.success).toBeUndefined();
      expect(failure.body.degraded).toBeUndefined();

      const retry = makeResponse();
      await handler('/verify')({ user, body: proof }, retry);
      expect(retry.statusCode).toBe(200);
      expect(retry.body).toMatchObject({ success: true, plan: 'pro', paymentId: captured.id });
      expect(fixtures.rpc).toHaveBeenCalledWith('activate_captured_payment', expect.objectContaining({
        captured_order: captured.order_id,
        captured_amount: captured.amount,
      }));
    });

    it('returns 400 when captured payment fails SQL order-integrity check (22023)', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id }));
      fixtures.fetchPayment.mockResolvedValue(captured);
      fixtures.rpc.mockResolvedValueOnce({ error: { code: '22023', message: 'Captured payment does not match the saved order' } });

      const res = makeResponse();
      await handler('/verify')({ user, body: proof }, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBeUndefined();
    });

    it('reports an authorized payment as pending until the provider captures it', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id, status: 'created' }));
      fixtures.fetchPayment.mockResolvedValue({ ...captured, status: 'authorized' });

      const res = makeResponse();
      await handler('/verify')({ user, body: proof }, res);
      expect(res.statusCode).toBe(202);
      expect(res.body.pending).toBe(true);
      expect(fixtures.rpc).not.toHaveBeenCalled();
    });

    it('reports a provider-declined payment with 422 paymentFailed', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id, status: 'created' }));
      fixtures.fetchPayment.mockResolvedValue({ ...captured, status: 'failed' });

      const res = makeResponse();
      await handler('/verify')({ user, body: proof }, res);
      expect(res.statusCode).toBe(422);
      expect(res.body.paymentFailed).toBe(true);
      expect(fixtures.rpc).not.toHaveBeenCalled();
    });

    it('returns a retryable 503 on temporary webhook activation failure and 400 on order mismatch', async () => {
      const body = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: captured } } }));
      const digest = crypto.createHmac('sha256', 'test-webhook-secret').update(body).digest('hex');

      fixtures.rpc.mockResolvedValueOnce({ error: { message: 'Database temporarily unavailable' } });
      const transientRes = makeResponse();
      await handler('/webhook')({ body, headers: { 'x-razorpay-signature': digest } }, transientRes);
      expect(transientRes.statusCode).toBe(503);

      fixtures.rpc.mockResolvedValueOnce({ error: { code: '22023', message: 'Captured payment does not match the saved order' } });
      const mismatchRes = makeResponse();
      await handler('/webhook')({ body, headers: { 'x-razorpay-signature': digest } }, mismatchRes);
      expect(mismatchRes.statusCode).toBe(400);
    });

    it('does not overwrite already-paid orders on payment.failed webhook', async () => {
      const neq = vi.fn().mockResolvedValue({ error: null });
      const eq = vi.fn(() => ({ neq }));
      const update = vi.fn(() => ({ eq }));
      fixtures.from.mockReturnValue({ update });

      const body = Buffer.from(JSON.stringify({
        event: 'payment.failed',
        payload: { payment: { entity: { id: 'pay_fail', order_id: 'order_fixture' } } },
      }));
      const digest = crypto.createHmac('sha256', 'test-webhook-secret').update(body).digest('hex');

      const res = makeResponse();
      await handler('/webhook')({ body, headers: { 'x-razorpay-signature': digest } }, res);
      expect(res.statusCode).toBe(200);
      expect(update).toHaveBeenCalledWith({ status: 'failed' });
      expect(eq).toHaveBeenCalledWith('razorpay_order_id', 'order_fixture');
      expect(neq).toHaveBeenCalledWith('status', 'paid');
    });

    it('defines atomic activate_captured_payment migration gating on activated_at and locking profile', () => {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const sql = fs.readFileSync(path.resolve(__dirname, '../../db/migration_payment_activation.sql'), 'utf8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.activate_captured_payment');
      expect(sql).toContain('FOR UPDATE');
      expect(sql).toContain('IF saved.activated_at IS NULL THEN');
      expect(sql).toContain('UPDATE public.profiles SET subscription_tier = saved.plan');
      expect(sql).toContain('activated_at = now()');
    });
  });

  describe('Bug 3: Webhook-first idempotency and verification security', () => {
    it('returns 200 success (never 409) when webhook already activated the order before /verify runs', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id }));
      fixtures.fetchPayment.mockResolvedValue(captured);
      fixtures.rpc.mockResolvedValue({ data: { userId: user.id, plan: 'pro', paymentId: captured.id } });

      const webhookBody = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: captured } } }));
      const webhookDigest = crypto.createHmac('sha256', 'test-webhook-secret').update(webhookBody).digest('hex');
      const webhookRes = makeResponse();
      await handler('/webhook')({ body: webhookBody, headers: { 'x-razorpay-signature': webhookDigest } }, webhookRes);
      expect(webhookRes.statusCode).toBe(200);

      const verifyRes = makeResponse();
      await handler('/verify')({ user, body: proof }, verifyRes);
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body).toEqual({ success: true, plan: 'pro', paymentId: captured.id });
      expect(fixtures.cacheDelete).toHaveBeenCalledWith(`profile:${user.id}`);
      expect(fixtures.invalidateCache).toHaveBeenCalledWith('/api/user');
      expect(fixtures.invalidateCache).toHaveBeenCalledWith('/api/payment');
    });

    it('enforces order ownership, valid HMAC signature, and matching Razorpay order_id on /verify', async () => {
      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: 'other-user' }));

      const forbiddenRes = makeResponse();
      await handler('/verify')({ user, body: proof }, forbiddenRes);
      expect(forbiddenRes.statusCode).toBe(403);

      fixtures.from.mockReturnValue(makeVerifyQuery({ user_id: user.id }));
      const badSigRes = makeResponse();
      await handler('/verify')({ user, body: { ...proof, razorpay_signature: 'not-valid-hex!' } }, badSigRes);
      expect(badSigRes.statusCode).toBe(400);

      fixtures.fetchPayment.mockResolvedValueOnce({ ...captured, order_id: 'order_different' });
      const mismatchOrderRes = makeResponse();
      await handler('/verify')({ user, body: proof }, mismatchOrderRes);
      expect(mismatchOrderRes.statusCode).toBe(400);
    });
  });
});
