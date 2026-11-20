import { describe, it, expect, vi } from 'vitest';
import {
  isStreakAtRisk,
  sendExpoPushNotification,
  sendStreakReminderEmail,
  runStreakReminderJob,
} from '../../../workers/streakReminder.js';

describe('Streak Reminder Worker Optimization Suite', () => {
  describe('isStreakAtRisk', () => {
    it('returns false when user was active today', () => {
      const now = new Date('2026-11-20T19:00:00Z');
      expect(isStreakAtRisk('2026-11-20T10:00:00Z', now)).toBe(false);
    });

    it('returns true when user was active > 20 hours ago on a prior day', () => {
      const now = new Date('2026-11-20T19:00:00Z');
      expect(isStreakAtRisk('2026-11-19T18:00:00Z', now)).toBe(true);
    });

    it('returns false when input is empty or invalid date', () => {
      expect(isStreakAtRisk(null)).toBe(false);
      expect(isStreakAtRisk('invalid-date')).toBe(false);
    });
  });

  describe('sendExpoPushNotification', () => {
    it('skips invalid push tokens without calling fetch', async () => {
      const mockFetch = vi.fn();
      const res = await sendExpoPushNotification({ to: 'invalid_token' }, mockFetch as any);
      expect(res.skipped).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('dispatches valid Expo push tokens to Expo push service', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { status: 'ok' } }),
      });

      const res = await sendExpoPushNotification(
        {
          to: 'ExponentPushToken[mock_token_123]',
          title: 'Keep your streak!',
          body: 'Practice 1 question',
        },
        mockFetch as any
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.data.status).toBe('ok');
    });
  });

  describe('sendStreakReminderEmail', () => {
    it('skips when transporter or recipient is missing', async () => {
      expect(await sendStreakReminderEmail({ transporter: null, to: 'user@test.com', streak: 5 })).toEqual({
        skipped: true,
        reason: 'missing_mailer_or_recipient',
      });
      expect(await sendStreakReminderEmail({ transporter: {} as any, to: '', streak: 5 })).toEqual({
        skipped: true,
        reason: 'missing_mailer_or_recipient',
      });
    });

    it('dispatches email with streak count via transporter', async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
      };

      const result = await sendStreakReminderEmail({
        transporter: mockTransporter as any,
        to: 'user@test.com',
        streak: 7,
        name: 'Ada',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: '🔥 Keep your 7-day PrepLoop streak alive!',
        })
      );
      expect(result.messageId).toBe('msg-123');
    });
  });

  describe('runStreakReminderJob Batched & Concurrency Optimization', () => {
    it('paginates streaks, batch fetches profiles & tokens with .in(), and dispatches reminders concurrently', async () => {
      const mockStreaks = [
        { user_id: 'u1', current_streak: 5, last_active_date: '2026-11-19', last_reminded_date: null },
        { user_id: 'u2', current_streak: 12, last_active_date: '2026-11-19', last_reminded_date: null },
        { user_id: 'u3', current_streak: 3, last_active_date: '2026-11-19', last_reminded_date: '2026-11-20' }, // already reminded today
      ];

      const mockProfiles = [
        { id: 'u1', full_name: 'User One', email: 'u1@example.com' },
        { id: 'u2', full_name: 'User Two', email: 'u2@example.com' },
      ];

      const mockTokens = [
        {
          user_id: 'u1',
          expo_push_token: 'ExponentPushToken[u1_push]',
          push_reminders_enabled: true,
          email_reminders_enabled: true,
          last_reminded_date: null,
        },
        {
          user_id: 'u2',
          expo_push_token: 'ExponentPushToken[u2_push]',
          push_reminders_enabled: true,
          email_reminders_enabled: false, // push only
          last_reminded_date: null,
        },
      ];

      const inCalls: { table: string; column: string; values: string[] }[] = [];
      const updateCalls: { table: string; data: any; userId: string }[] = [];

      const createQueryBuilder = (table: string) => {
        let currentUserId = '';
        const builder: any = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          range: vi.fn().mockImplementation((from: number, to: number) => {
            const chunk = mockStreaks.slice(from, to + 1);
            return Promise.resolve({ data: chunk, error: null });
          }),
          in: vi.fn().mockImplementation((column: string, values: string[]) => {
            inCalls.push({ table, column, values });
            if (table === 'profiles') {
              return Promise.resolve({ data: mockProfiles, error: null });
            }
            if (table === 'user_push_tokens') {
              return Promise.resolve({ data: mockTokens, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
          update: vi.fn().mockImplementation((data: any) => {
            return {
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                updateCalls.push({ table, data, userId: val });
                return Promise.resolve({ error: null });
              }),
            };
          }),
        };
        return builder;
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => createQueryBuilder(table)),
      };

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-batch' }),
      };

      const mockSendPush = vi.fn().mockResolvedValue({ status: 'ok' });

      const results = await runStreakReminderJob({
        supabase: mockSupabase as any,
        transporter: mockTransporter as any,
        sendPush: mockSendPush,
        now: new Date('2026-11-20T19:00:00Z'),
        batchSize: 100,
        concurrencyLimit: 5,
      });

      // Verification of batch fetching
      expect(inCalls.some((c) => c.table === 'profiles' && c.column === 'id')).toBe(true);
      expect(inCalls.some((c) => c.table === 'user_push_tokens' && c.column === 'user_id')).toBe(true);

      // Total evaluated: 3
      expect(results.evaluated).toBe(3);
      // u3 skipped because already reminded today
      expect(results.skipped).toBe(1);

      // u1 received email and push
      // u2 received push only (email_reminders_enabled: false)
      expect(results.emailsSent).toBe(1);
      expect(results.pushesSent).toBe(2);
      expect(results.errors).toBe(0);

      // Both reminded users had their last_reminded_date updated
      expect(updateCalls.filter((c) => c.table === 'user_streaks')).toHaveLength(2);
    });
  });
});
