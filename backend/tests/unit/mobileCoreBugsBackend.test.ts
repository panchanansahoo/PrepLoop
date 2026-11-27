import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import coinRouter from '../../routes/coins.js';
import { calculateDashboardStreak } from '../../utils/dashboardStreak.js';

vi.mock('../../middleware/auth.ts', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'usr_mobile_core_1', email: 'core@preploop.com', role: 'user' };
    next();
  },
  isAdminEmail: () => false,
}));

describe('Mobile Core Bugs Backend Contracts (#10 & #12)', () => {
  describe('Bug #10: calculateDashboardStreak consecutive & timezone rules', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-27T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('counts only consecutive active days ending today or yesterday', () => {
      const scattered = calculateDashboardStreak({
        activityDateValues: ['2026-11-27', '2026-11-25', '2026-11-23'],
      });
      expect(scattered.currentStreak).toBe(1);
      expect(scattered.bestStreak).toBe(1);

      const endingYesterday = calculateDashboardStreak({
        activityDateValues: ['2026-11-26', '2026-11-25', '2026-11-24'],
      });
      expect(endingYesterday.currentStreak).toBe(3);

      const staleEndedTwoDaysAgo = calculateDashboardStreak({
        activityDateValues: ['2026-11-25', '2026-11-24', '2026-11-23'],
      });
      expect(staleEndedTwoDaysAgo.currentStreak).toBe(0);
    });

    it('normalizes timezone-offset timestamps to UTC day and ignores future dates', () => {
      const tzResult = calculateDashboardStreak({
        // 2026-11-27T01:30+05:30 is 2026-11-26T20:00Z (yesterday), plus 2026-11-25
        // and a future local date 2026-11-28 that should be ignored
        submissionDateKeys: ['2026-11-27T01:30:00+05:30', '2026-11-28'],
        activityDateValues: ['2026-11-25'],
      });
      expect(tzResult.currentStreak).toBe(2);
    });
  });

  describe('Bug #12: GET /api/coins/history?detailed=1 returns full earned/spent/redeemed summary', () => {
    let server: Server | null = null;
    let baseUrl = '';

    beforeEach(async () => {
      vi.restoreAllMocks();
      const app = express();
      app.use(express.json());
      app.use('/api/coins', coinRouter);
      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server?.address();
          if (addr && typeof addr === 'object') {
            baseUrl = `http://127.0.0.1:${addr.port}`;
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

    it('aggregates totalEarned, totalSpent, and totalRedeemed across paginated batches', async () => {
      const pageRows = [
        { id: 10, amount: 50, type: 'earn', description: 'Problem solved', created_at: '2026-11-27T00:00:00Z' },
        { id: 9, amount: 20, type: 'spend', description: 'Redeem: AI Tutor Pass x1', created_at: '2026-11-26T00:00:00Z' },
        { id: 8, amount: 15, type: 'spend', description: 'AI assistant query', created_at: '2026-11-25T00:00:00Z' },
      ];

      let callCount = 0;
      vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          // buildHistoryQuery
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: pageRows, error: null, count: 3 }),
          } as any;
        }
        // Summary batch query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: pageRows, error: null }),
        } as any;
      });

      const res = await fetch(`${baseUrl}/api/coins/history?detailed=1&limit=30`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(3);
      expect(data.summary).toEqual({
        totalEarned: 50,
        totalSpent: 15,
        totalRedeemed: 20,
      });
    });
  });
});
