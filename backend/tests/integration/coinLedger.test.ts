import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { applyCoinTransaction } from '../../utils/coinTransactions.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import coinRouter from '../../routes/coins.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'usr_test_coin_123', email: 'testcoin@preploop.com', role: 'user' };
    next();
  },
  isAdminEmail: () => false,
}));

describe('Coin Ledger & Transaction Atomicity', () => {
  const testUserId = 'usr_test_coin_123';
  let app: express.Application;
  let server: Server | null = null;
  let baseUrl = '';

  beforeEach(async () => {
    vi.restoreAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/coins', coinRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = null;
    }
  });

  describe('applyCoinTransaction utility', () => {
    it('successfully processes transaction via atomic RPC', async () => {
      vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: [{ success: true, new_balance: 150, applied: true }],
        error: null,
      } as any);

      const result = await applyCoinTransaction({
        userId: testUserId,
        amount: 25,
        type: 'earn',
        description: 'Test problem solved',
        referenceKey: 'problem_solve:usr_test_coin_123:42',
      });

      expect(result.handled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.balance).toBe(150);
      expect(result.applied).toBe(true);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('coin_apply_transaction', {
        user_id_input: testUserId,
        amount_input: 25,
        txn_type_input: 'earn',
        description_input: 'Test problem solved',
        reference_key_input: 'problem_solve:usr_test_coin_123:42',
      });
    });

    it('enforces idempotency and skips duplicate awards when referenceKey has already been applied', async () => {
      vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: { success: true, new_balance: 150, applied: false },
        error: null,
      } as any);

      const result = await applyCoinTransaction({
        userId: testUserId,
        amount: 25,
        type: 'earn',
        description: 'Test duplicate submission',
        referenceKey: 'problem_solve:usr_test_coin_123:42',
      });

      expect(result.handled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.applied).toBe(false);
      expect(result.balance).toBe(150);
    });

    it('returns failure when account balance is insufficient for spend operation', async () => {
      vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: { success: false, new_balance: 5, error: 'Insufficient coin balance' },
        error: null,
      } as any);

      const result = await applyCoinTransaction({
        userId: testUserId,
        amount: 35,
        type: 'spend',
        description: 'Unlock AI interview boost',
      });

      expect(result.handled).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient coin balance');
      expect(result.balance).toBe(5);
    });

    it('gracefully signals unhandled fallback when atomic RPC function is absent (PGRST202)', async () => {
      vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'function coin_apply_transaction does not exist' },
      } as any);

      const result = await applyCoinTransaction({
        userId: testUserId,
        amount: 10,
        type: 'earn',
      });

      expect(result.handled).toBe(false);
    });
  });

  describe('Coin Endpoints Contract & Validation', () => {
    it('GET /api/coins/balance retrieves current wallet balance', async () => {
      vi.spyOn(supabaseAdmin, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { coins: 85 }, error: null }),
      } as any);

      const res = await fetch(`${baseUrl}/api/coins/balance`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.coins).toBe(85);
    });

    it('POST /api/coins/earn validates limits and rejects negative or out-of-range amounts', async () => {
      const res = await fetch(`${baseUrl}/api/coins/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: -10, source: 'manual' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Amount must be an integer between 1 and 100');
    });

    it('POST /api/coins/earn rejects unauthorized/invalid earn sources', async () => {
      const res = await fetch(`${baseUrl}/api/coins/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15, source: 'unauthorized_hack' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid earn source');
    });

    it('POST /api/coins/earn processes valid earn with atomic execution', async () => {
      vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: { success: true, new_balance: 100, applied: true },
        error: null,
      } as any);

      const res = await fetch(`${baseUrl}/api/coins/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15, source: 'problem_solved', sourceRef: 'prob_456' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.coins).toBe(100);
      expect(data.earned).toBe(15);
      expect(data.applied).toBe(true);
    });

    it('POST /api/coins/spend rejects invalid amounts exceeding spend limit', async () => {
      const res = await fetch(`${baseUrl}/api/coins/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Amount must be an integer between 1 and 50');
    });

    it('GET /api/coins/redeem-options lists available catalog items', async () => {
      const res = await fetch(`${baseUrl}/api/coins/redeem-options`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.options)).toBe(true);
      expect(data.options.some((opt: any) => opt.id === 'ai_tutor_pass')).toBe(true);
      expect(data.options.some((opt: any) => opt.id === 'interview_boost')).toBe(true);
      expect(data.options.some((opt: any) => opt.id === 'resume_review_credit')).toBe(true);
    });
  });
});
