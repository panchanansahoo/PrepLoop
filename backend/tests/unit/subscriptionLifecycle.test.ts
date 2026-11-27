import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  fetchPayment: vi.fn(),
  createOrder: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUserById: vi.fn(),
  cacheDelete: vi.fn().mockResolvedValue(null),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(null),
  invalidateCache: vi.fn(),
}));

vi.mock('razorpay', () => ({
  default: class {
    orders = { create: mocks.createOrder };
    payments = { fetch: mocks.fetchPayment };
  },
}));
vi.mock('../../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      admin: {
        updateUserById: mocks.updateUserById,
      },
    },
  },
}));
vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: vi.fn((_req, _res, next) => next?.()),
  isAdminEmail: vi.fn(() => false),
  invalidateUserRole: vi.fn(),
}));
vi.mock('../../middleware/apiCache.js', () => ({ invalidateCache: mocks.invalidateCache }));
vi.mock('../../middleware/rateLimiter.js', () => ({
  authLoginLimiter: (_req: any, _res: any, next: any) => next?.(),
}));
vi.mock('../../middleware/csrf.js', () => ({
  generateCsrfToken: vi.fn(() => 'csrf-token-test'),
}));
vi.mock('../../utils/cacheManager.js', () => ({
  default: {
    get: mocks.cacheGet,
    set: mocks.cacheSet,
    delete: mocks.cacheDelete,
  },
}));

import { effectiveSubscriptionTier, getSubscriptionState } from '../../utils/subscriptionTier.js';
import {
  usageQuota,
  resetUsageQuotaCounters,
  invalidateUsageQuotaPlanCache,
} from '../../middleware/usageQuota.ts';
import { getUserTier, checkFeatureAccess } from '../../services/featureGateService.ts';
import { buildProfileResponse } from '../../services/profileService.ts';
import paymentRouter from '../../routes/payment.js';
import loginRouter from '../../routes/auth/login.js';

const getRouteHandler = (router: any, method: string, routePath: string) =>
  router.stack
    .find((layer: any) => layer.route?.path === routePath && layer.route.methods?.[method])
    .route.stack.at(-1).handle;

const makeResponse = () => {
  const headers = new Map<string, any>();
  return {
    statusCode: 200,
    body: null as any,
    headers,
    setHeader(name: string, value: any) {
      headers.set(name, value);
    },
    getHeader(name: string) {
      return headers.get(name);
    },
    cookie: vi.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
};

describe('Subscription lifecycle (Bug #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUsageQuotaCounters();
    vi.stubEnv('RAZORPAY_KEY_ID', 'test-key-id');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'test-payment-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('effectiveSubscriptionTier & getSubscriptionState', () => {
    it('returns active paid tier while expiry is in the future and downgrades at or past expiry', () => {
      const now = Date.parse('2026-06-15T12:00:00.000Z');
      const activeProfile = {
        subscription_tier: 'pro',
        subscription_billing_cycle: 'monthly',
        subscription_status: 'active',
        subscription_expires_at: '2026-07-01T00:00:00.000Z',
      };
      expect(effectiveSubscriptionTier(activeProfile, now)).toBe('pro');
      expect(getSubscriptionState(activeProfile, now)).toMatchObject({
        tier: 'pro',
        billingCycle: 'monthly',
        status: 'active',
        cancelAtPeriodEnd: false,
        isPaid: true,
      });

      const atExpiry = Date.parse('2026-07-01T00:00:00.000Z');
      expect(effectiveSubscriptionTier(activeProfile, atExpiry)).toBe('free');
      expect(getSubscriptionState(activeProfile, atExpiry)).toMatchObject({
        tier: 'free',
        status: 'expired',
        isPaid: false,
      });
    });

    it('retains cancelled access until period end and downgrades immediately if no expiry exists', () => {
      const beforeEnd = Date.parse('2026-06-15T12:00:00.000Z');
      const afterEnd = Date.parse('2026-07-02T00:00:00.000Z');

      const cancelledWithExpiry = {
        subscription_tier: 'elite',
        subscription_billing_cycle: 'annual',
        subscription_status: 'cancelled',
        subscription_cancelled_at: '2026-06-10T00:00:00.000Z',
        subscription_expires_at: '2026-07-01T00:00:00.000Z',
      };

      expect(effectiveSubscriptionTier(cancelledWithExpiry, beforeEnd)).toBe('elite');
      expect(getSubscriptionState(cancelledWithExpiry, beforeEnd)).toMatchObject({
        tier: 'elite',
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        isPaid: true,
      });

      expect(effectiveSubscriptionTier(cancelledWithExpiry, afterEnd)).toBe('free');
      expect(getSubscriptionState(cancelledWithExpiry, afterEnd)).toMatchObject({
        tier: 'free',
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        isPaid: false,
      });

      const cancelledWithoutExpiry = {
        subscription_tier: 'pro',
        subscription_status: 'cancelled',
        subscription_cancelled_at: '2026-06-10T00:00:00.000Z',
        subscription_expires_at: null,
      };
      expect(effectiveSubscriptionTier(cancelledWithoutExpiry, beforeEnd)).toBe('free');
      expect(getSubscriptionState(cancelledWithoutExpiry, beforeEnd).isPaid).toBe(false);
    });
  });

  describe('Enforcement: usageQuota, featureGateService, profileService, and login', () => {
    it('usageQuota enforces active tier, downgrades once subscription expires, and honors cache invalidation', async () => {
      let currentNow = Date.parse('2026-06-15T12:00:00.000Z');
      let profileRow: any = {
        subscription_tier: 'pro',
        subscription_expires_at: '2026-06-15T12:01:00.000Z',
        subscription_status: 'active',
        subscription_cancelled_at: null,
      };

      const fakeClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: profileRow, error: null }),
            }),
          }),
        }),
        rpc: async () => ({ data: [{ allowed: true }], error: null }),
      };

      const mw = usageQuota('ai', {
        counterStore: new Map(),
        client: fakeClient,
        now: () => currentNow,
      });

      const res1 = makeResponse();
      await mw({ ip: '127.0.0.1', user: { id: 'u-expiry' } } as any, res1 as any, vi.fn());
      expect(res1.getHeader('X-Usage-Limit')).toBe(500);

      // Advance clock past expiry without clearing cache -> cached expiry triggers immediate downgrade
      currentNow = Date.parse('2026-06-15T12:02:00.000Z');
      const res2 = makeResponse();
      await mw({ ip: '127.0.0.1', user: { id: 'u-expiry' } } as any, res2 as any, vi.fn());
      expect(res2.getHeader('X-Usage-Limit')).toBe(100);

      // Immediate cancel + cache invalidation downgrades immediately
      profileRow = {
        subscription_tier: 'free',
        subscription_expires_at: '2026-06-15T12:01:00.000Z',
        subscription_status: 'cancelled',
        subscription_cancelled_at: '2026-06-15T12:00:30.000Z',
      };
      invalidateUsageQuotaPlanCache('u-expiry');
      const res3 = makeResponse();
      await mw({ ip: '127.0.0.1', user: { id: 'u-expiry' } } as any, res3 as any, vi.fn());
      expect(res3.getHeader('X-Usage-Limit')).toBe(100);
    });

    it('featureGateService downgrades expired or cancelled-without-expiry users to free gates', async () => {
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    subscription_tier: 'pro',
                    subscription_expires_at: '2025-01-01T00:00:00.000Z',
                    subscription_status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      });

      const tier = await getUserTier('u-expired');
      expect(tier).toBe('free');

      const access = await checkFeatureAccess({ userId: 'u-expired', featureKey: 'code_review_ai' });
      expect(access.tier).toBe('free');
      expect(access.allowed).toBe(false);
      expect(access.upgradeRequired).toBe(true);
    });

    it('profileService.buildProfileResponse exposes lifecycle metadata and downgrades expired subscriptions', () => {
      const expired = buildProfileResponse(
        { id: 'u-1', email: 'a@example.com' },
        {
          id: 'u-1',
          subscription_tier: 'pro',
          subscription_billing_cycle: 'annual',
          subscription_status: 'active',
          subscription_expires_at: '2020-01-01T00:00:00.000Z',
        }
      );

      expect(expired.user.subscriptionTier).toBe('free');
      expect(expired.user.subscriptionStatus).toBe('expired');
      expect(expired.user.subscriptionBillingCycle).toBe('annual');
      expect(expired.user.subscriptionExpiresAt).toBe('2020-01-01T00:00:00.000Z');
    });

    it('login route returns effective downgraded tier and lifecycle metadata', async () => {
      mocks.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'u-login', email: 'member@example.com', user_metadata: { full_name: 'Member' } },
          session: { access_token: 'tok-1', refresh_token: 'ref-1' },
        },
        error: null,
      });

      const updateEq = vi.fn().mockResolvedValue({ error: null });
      mocks.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                full_name: 'Member',
                subscription_tier: 'pro',
                subscription_expires_at: '2020-01-01T00:00:00.000Z',
                subscription_billing_cycle: 'monthly',
                subscription_status: 'active',
                subscription_cancelled_at: null,
                experience_level: 'intermediate',
                role: 'user',
                email_verified: true,
              },
              error: null,
            }),
          }),
        }),
        update: () => ({ eq: updateEq }),
      }));

      const res = makeResponse();
      await getRouteHandler(loginRouter, 'post', '/login')(
        { body: { email: 'member@example.com', password: 'Password123!' }, ip: '127.0.0.1' },
        res
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.user.subscriptionTier).toBe('free');
      expect(res.body.user.subscriptionStatus).toBe('expired');
      expect(res.body.user.subscriptionBillingCycle).toBe('monthly');
    });
  });

  describe('Payment lifecycle routes & SQL migration', () => {
    it('GET /subscription returns active plan, billing period, and expiry (falling back to latest paid payment)', async () => {
      const futureIso = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
      mocks.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'user-1',
                    subscription_tier: 'pro',
                    subscription_expires_at: futureIso,
                    subscription_billing_cycle: null,
                    subscription_status: 'active',
                    subscription_cancelled_at: null,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: { plan: 'pro', billing_cycle: 'annual', paid_at: '2026-01-01T00:00:00.000Z' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      });

      const res = makeResponse();
      await getRouteHandler(paymentRouter, 'get', '/subscription')({ user: { id: 'user-1' } }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.subscription).toMatchObject({
        tier: 'pro',
        billingCycle: 'annual',
        expiresAt: futureIso,
        status: 'active',
        isPaid: true,
      });
    });

    it('POST /cancel marks paid subscription cancelled while retaining access until period end and clears caches', async () => {
      const futureIso = new Date(Date.now() + 20 * 86400 * 1000).toISOString();
      const updatePayloads: any[] = [];
      mocks.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'user-1',
                subscription_tier: 'elite',
                subscription_expires_at: futureIso,
                subscription_billing_cycle: 'annual',
                subscription_status: 'active',
                subscription_cancelled_at: null,
              },
              error: null,
            }),
          }),
        }),
        update: (payload: any) => {
          updatePayloads.push(payload);
          return {
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'user-1',
                    subscription_tier: 'elite',
                    subscription_expires_at: futureIso,
                    subscription_billing_cycle: 'annual',
                    subscription_status: 'cancelled',
                    subscription_cancelled_at: payload.subscription_cancelled_at,
                  },
                  error: null,
                }),
              }),
            }),
          };
        },
      }));

      const res = makeResponse();
      await getRouteHandler(paymentRouter, 'post', '/cancel')({ user: { id: 'user-1' }, body: {} }, res);

      expect(res.statusCode).toBe(200);
      expect(updatePayloads[0]).toMatchObject({ subscription_status: 'cancelled' });
      expect(updatePayloads[0].subscription_cancelled_at).toBeTruthy();
      expect(res.body.success).toBe(true);
      expect(res.body.subscription).toMatchObject({
        tier: 'elite',
        status: 'cancelled',
        billingCycle: 'annual',
        expiresAt: futureIso,
        cancelAtPeriodEnd: true,
        isPaid: true,
      });
      expect(mocks.cacheDelete).toHaveBeenCalledWith('profile:user-1');
      expect(mocks.invalidateCache).toHaveBeenCalledWith('/api/user');
      expect(mocks.invalidateCache).toHaveBeenCalledWith('/api/payment');
    });

    it('POST /cancel immediately downgrades legacy paid accounts with no expiry and rejects free accounts', async () => {
      mocks.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'user-legacy',
                subscription_tier: 'pro',
                subscription_expires_at: null,
                subscription_status: 'active',
              },
              error: null,
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'user-legacy',
                  ...payload,
                },
                error: null,
              }),
            }),
          }),
        }),
      }));

      const legacyRes = makeResponse();
      await getRouteHandler(paymentRouter, 'post', '/cancel')({ user: { id: 'user-legacy' }, body: {} }, legacyRes);
      expect(legacyRes.statusCode).toBe(200);
      expect(legacyRes.body.subscription.tier).toBe('free');
      expect(legacyRes.body.subscription.isPaid).toBe(false);

      mocks.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: 'user-free', subscription_tier: 'free', subscription_status: 'active' },
              error: null,
            }),
          }),
        }),
      }));

      const freeRes = makeResponse();
      await getRouteHandler(paymentRouter, 'post', '/cancel')({ user: { id: 'user-free' }, body: {} }, freeRes);
      expect(freeRes.statusCode).toBe(400);
    });

    it('POST /verify returns subscriptionExpiresAt, billingCycle, and subscriptionStatus when RPC returns them', async () => {
      const orderId = 'order_life_1';
      const paymentId = 'pay_life_1';
      const sig = crypto.createHmac('sha256', 'test-payment-secret').update(`${orderId}|${paymentId}`).digest('hex');

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: 'user-1' }, error: null }),
          }),
        }),
      });
      mocks.fetchPayment.mockResolvedValue({
        id: paymentId,
        order_id: orderId,
        status: 'captured',
        amount: 95040,
        currency: 'INR',
        created_at: 1700000000,
      });
      mocks.rpc.mockResolvedValue({
        data: {
          userId: 'user-1',
          plan: 'pro',
          paymentId,
          billingCycle: 'annual',
          subscriptionExpiresAt: '2027-01-01T00:00:00.000Z',
          subscriptionStatus: 'active',
        },
      });

      const res = makeResponse();
      await getRouteHandler(paymentRouter, 'post', '/verify')(
        {
          user: { id: 'user-1' },
          body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig },
        },
        res
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        plan: 'pro',
        paymentId,
        billingCycle: 'annual',
        subscriptionExpiresAt: '2027-01-01T00:00:00.000Z',
        subscriptionStatus: 'active',
      });
    });

    it('migration_subscription_lifecycle.sql defines lifecycle columns, trigger protection, and activation reset', () => {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const sql = fs.readFileSync(path.resolve(__dirname, '../../db/migration_subscription_lifecycle.sql'), 'utf8');
      expect(sql).toContain('subscription_expires_at timestamptz');
      expect(sql).toContain('subscription_billing_cycle text');
      expect(sql).toContain('subscription_status text');
      expect(sql).toContain('subscription_cancelled_at timestamptz');
      expect(sql).toContain('protect_profile_subscription');
      expect(sql).toContain("subscription_status = 'active'");
      expect(sql).toContain('subscription_cancelled_at = NULL');
    });
  });
});
