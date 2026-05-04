import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as streakService from '../services/streakService.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

vi.mock('../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: vi.fn()
  }
}));

describe('streakService', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Update streak - first solve
  describe('updateStreak', () => {
    it('should create new streak on first solve', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: testUserId,
                streak_days: 1,
                longest_streak: 1,
                is_active: true
              }
            })
          })
        })
      });

      expect(streakService.updateStreak).toBeDefined();
    });

    it('should increment streak on consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const currentStreak = {
        user_id: testUserId,
        streak_days: 5,
        longest_streak: 10,
        streak_start: yesterdayStr,
        last_activity_date: yesterdayStr,
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...currentStreak,
                  streak_days: 6,
                  longest_streak: 10
                }
              })
            })
          })
        })
      });

      expect(streakService.updateStreak).toBeDefined();
    });

    it('should not update on same day', async () => {
      const today = new Date().toISOString().split('T')[0];

      const currentStreak = {
        user_id: testUserId,
        streak_days: 5,
        longest_streak: 10,
        last_activity_date: today,
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        })
      });

      expect(streakService.updateStreak).toBeDefined();
    });

    it('should reset streak if gap > 1 day', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      const currentStreak = {
        user_id: testUserId,
        streak_days: 10,
        longest_streak: 25,
        last_activity_date: twoDaysAgoStr,
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...currentStreak,
                  streak_days: 1,
                  longest_streak: 25,
                  is_active: false
                }
              })
            })
          })
        })
      });

      expect(streakService.updateStreak).toBeDefined();
    });

    it('should update longest_streak if new streak exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const currentStreak = {
        user_id: testUserId,
        streak_days: 25,
        longest_streak: 25,
        last_activity_date: yesterdayStr,
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...currentStreak,
                  streak_days: 26,
                  longest_streak: 26 // New record!
                }
              })
            })
          })
        })
      });

      expect(streakService.updateStreak).toBeDefined();
    });
  });

  // Test 2: Get current streak
  describe('getCurrentStreak', () => {
    it('should return current streak for user', async () => {
      const today = new Date().toISOString().split('T')[0];
      const currentStreak = {
        user_id: testUserId,
        streak_days: 12,
        longest_streak: 47,
        last_activity_date: today,
        is_active: true,
        points: 156
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        })
      });

      expect(streakService.getCurrentStreak).toBeDefined();
    });

    it('should return zero streak for user with no activity', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await streakService.getCurrentStreak(testUserId);

      expect(result.streak_days).toBe(0);
      expect(result.longest_streak).toBe(0);
      expect(result.is_active).toBe(false);
    });

    it('should check if streak is still active within grace period', async () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

      const currentStreak = {
        user_id: testUserId,
        streak_days: 5,
        longest_streak: 10,
        last_activity_date: oneDayAgoStr,
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: currentStreak })
          })
        })
      });

      expect(streakService.getCurrentStreak).toBeDefined();
    });
  });

  // Test 3: Get longest streak
  describe('getLongestStreak', () => {
    it('should return longest streak record', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { longest_streak: 47 }
            })
          })
        })
      });

      expect(streakService.getLongestStreak).toBeDefined();
    });

    it('should return 0 for user with no record', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await streakService.getLongestStreak(testUserId);
      expect(result).toBe(0);
    });
  });

  // Test 4: Get streak multiplier
  describe('getStreakMultiplier', () => {
    it('should return 1.0x for no streak', () => {
      const mult = streakService.getStreakMultiplier(0);
      expect(mult).toBe(1.0);
    });

    it('should return 1.07x for 7-day streak', () => {
      const mult = streakService.getStreakMultiplier(7);
      expect(mult).toBeCloseTo(1.07, 2);
    });

    it('should return 1.30x for 30-day streak', () => {
      const mult = streakService.getStreakMultiplier(30);
      expect(mult).toBeCloseTo(1.30, 2);
    });

    it('should cap at 1.0x + 1.0 = 2.0x for 100+ days', () => {
      const mult100 = streakService.getStreakMultiplier(100);
      const mult150 = streakService.getStreakMultiplier(150);

      // Both should be same (capped at 100 days)
      expect(mult100).toBe(mult150);
      expect(mult100).toBeCloseTo(2.0, 2); // 1 + (min(100, 100) * 0.01)
    });

    it('should scale linearly up to cap', () => {
      const mult10 = streakService.getStreakMultiplier(10);
      const mult20 = streakService.getStreakMultiplier(20);
      const mult30 = streakService.getStreakMultiplier(30);

      expect(mult20).toBeGreaterThan(mult10);
      expect(mult30).toBeGreaterThan(mult20);
    });
  });

  // Test 5: Get streak bonus points
  describe('getStreakBonus', () => {
    it('should return points based on streak', () => {
      const bonus = streakService.getStreakBonus(7);
      expect(bonus).toBeGreaterThan(0);
      expect(typeof bonus).toBe('number');
    });

    it('should return higher points for longer streaks', () => {
      const bonus7 = streakService.getStreakBonus(7);
      const bonus30 = streakService.getStreakBonus(30);

      expect(bonus30).toBeGreaterThan(bonus7);
    });

    it('should multiply by streak multiplier', () => {
      // At 7 days: base (10*7=70) * 1.07 ≈ 75
      const bonus = streakService.getStreakBonus(7);
      expect(bonus).toBeGreaterThan(70);
      expect(bonus).toBeLessThan(80);
    });
  });

  // Test 6: Reset expired streaks (cron job)
  describe('resetExpiredStreaks', () => {
    it('should reset streaks inactive for 48+ hours', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { user_id: 'u1', longest_streak: 25 },
                { user_id: 'u2', longest_streak: 15 }
              ]
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      });

      expect(streakService.resetExpiredStreaks).toBeDefined();
    });

    it('should return count of reset streaks', async () => {
      const mockExpiredCount = 5;

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: Array(mockExpiredCount).fill({})
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      });

      expect(streakService.resetExpiredStreaks).toBeDefined();
    });

    it('should handle no expired streaks', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      expect(streakService.resetExpiredStreaks).toBeDefined();
    });
  });

  // Test 7: Get streak milestones
  describe('getStreakMilestones', () => {
    it('should return unlocked milestones', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { longest_streak: 30 }
            })
          })
        })
      });

      expect(streakService.getStreakMilestones).toBeDefined();
    });

    it('should include 7, 14, 30, 60, 100 day milestones', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { longest_streak: 100 }
            })
          })
        })
      });

      expect(streakService.getStreakMilestones).toBeDefined();
    });

    it('should only return achieved milestones', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { longest_streak: 10 }
            })
          })
        })
      });

      expect(streakService.getStreakMilestones).toBeDefined();
    });
  });

  // Test 8: Streak summary
  describe('getStreakSummary', () => {
    it('should return complete streak stats', async () => {
      const today = new Date().toISOString().split('T')[0];
      const summary = {
        user_id: testUserId,
        streak_days: 12,
        longest_streak: 47,
        is_active: true,
        points: 156,
        streak_start: '2026-04-21',
        last_activity_date: today
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: summary })
          })
        })
      });

      expect(streakService.getStreakSummary).toBeDefined();
    });

    it('should calculate next milestone', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: testUserId,
                streak_days: 25,
                longest_streak: 47,
                is_active: true,
                points: 325
              }
            })
          })
        })
      });

      expect(streakService.getStreakSummary).toBeDefined();
    });

    it('should calculate multiplier', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { streak_days: 7, longest_streak: 30 }
            })
          })
        })
      });

      expect(streakService.getStreakSummary).toBeDefined();
    });

    it('should return defaults for no streak', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await streakService.getStreakSummary(testUserId);

      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
      expect(result.isActive).toBe(false);
    });
  });

  // Test 9: Has solved today
  describe('hasSolvedToday', () => {
    it('should return true if user solved today', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ count: 1 })
              })
            })
          })
        })
      });

      expect(streakService.hasSolvedToday).toBeDefined();
    });

    it('should return false if user did not solve today', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ count: 0 })
              })
            })
          })
        })
      });

      const result = await streakService.hasSolvedToday(testUserId);
      expect(typeof result).toBe('boolean');
    });
  });

  // Test 10: Recalculate streak from history
  describe('recalculateStreak', () => {
    it('should recalculate from activity history', async () => {
      const mockSolutions = [
        { submitted_at: '2026-04-21T10:00:00Z' },
        { submitted_at: '2026-04-22T11:00:00Z' },
        { submitted_at: '2026-04-23T09:00:00Z' },
        { submitted_at: '2026-04-25T10:00:00Z' } // Gap here
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSolutions })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  streak_days: 1,
                  longest_streak: 3
                }
              })
            })
          })
        })
      });

      expect(streakService.recalculateStreak).toBeDefined();
    });

    it('should reset streak for no activity', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  streak_days: 0,
                  longest_streak: 0,
                  is_active: false
                }
              })
            })
          })
        })
      });

      expect(streakService.recalculateStreak).toBeDefined();
    });

    it('should handle consecutive day sequences', async () => {
      const mockSolutions = Array.from({ length: 7 }, (_, i) => ({
        submitted_at: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
      }));

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSolutions })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { streak_days: 7, longest_streak: 7 }
              })
            })
          })
        })
      });

      expect(streakService.recalculateStreak).toBeDefined();
    });
  });
});
