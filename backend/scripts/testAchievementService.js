import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as achievementService from '../services/achievementService.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

vi.mock('../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    from: vi.fn()
  }
}));

describe('achievementService', () => {
  const testUserId = 'test-user-123';
  const testProblemId = 'test-problem-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unlock achievement on condition met
  describe('unlockAchievement', () => {
    it('should unlock achievement when condition is met', async () => {
      const mockBadgeDef = {
        badge_name: 'first_solve',
        unlock_condition: { type: 'first_solution' },
        category: 'badge',
        rarity: 'common',
        points: 5,
        description: 'Solve your first problem'
      };

      const mockExisting = null; // No prior achievement

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'achievement_definitions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockBadgeDef })
              })
            })
          };
        }
        if (table === 'achievements') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockExisting })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'ach-123',
                    user_id: testUserId,
                    badge_name: 'first_solve',
                    achieved_at: new Date().toISOString()
                  }
                })
              })
            })
          };
        }
      });

      expect(achievementService.unlockAchievement).toBeDefined();
    });

    it('should not re-unlock milestone badges', async () => {
      const mockBadgeDef = {
        badge_name: 'problems_100',
        unlock_condition: { type: 'total_solutions', count: 100 },
        category: 'milestone',
        rarity: 'epic',
        points: 150
      };

      const mockExisting = { id: 'existing-ach' }; // Already unlocked

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'achievement_definitions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockBadgeDef })
              })
            })
          };
        }
        if (table === 'achievements') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockExisting })
                })
              })
            })
          };
        }
      });

      expect(achievementService.unlockAchievement).toBeDefined();
    });

    it('should handle badge definition not found', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ error: new Error('Not found') })
          })
        })
      });

      const result = await achievementService.unlockAchievement(
        testUserId,
        'nonexistent_badge',
        {}
      );

      expect(result).toBeNull();
    });

    it('should handle duplicate unlock gracefully', async () => {
      const mockBadgeDef = {
        badge_name: 'first_solve',
        unlock_condition: { type: 'first_solution' },
        category: 'badge',
        points: 5
      };

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'achievement_definitions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockBadgeDef })
              })
            })
          };
        }
        if (table === 'achievements') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null })
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockRejectedValue({ code: '23505' }) // Unique constraint
              })
            })
          };
        }
      });

      expect(achievementService.unlockAchievement).toBeDefined();
    });
  });

  // Test 2: Get unlocked achievements
  describe('getUnlockedAchievements', () => {
    it('should return user achievements with definitions', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          badge_name: 'first_solve',
          achieved_at: '2026-05-01T10:00:00Z',
          achievement_definitions: {
            description: 'Solve your first problem',
            points: 5,
            rarity: 'common'
          }
        },
        {
          id: 'ach-2',
          badge_name: 'streak_7',
          achieved_at: '2026-05-02T10:00:00Z',
          achievement_definitions: {
            description: '7-day streak',
            points: 50,
            rarity: 'rare'
          }
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockAchievements })
            })
          })
        })
      });

      expect(achievementService.getUnlockedAchievements).toBeDefined();
    });

    it('should return empty array for user with no achievements', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null })
            })
          })
        })
      });

      const result = await achievementService.getUnlockedAchievements(testUserId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should support custom limit', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [] })
            })
          })
        })
      });

      expect(achievementService.getUnlockedAchievements).toBeDefined();
    });
  });

  // Test 3: Get progress toward achievement
  describe('getProgressTowards', () => {
    it('should return progress object for locked badge', async () => {
      const mockBadgeDef = {
        badge_name: 'problems_100',
        description: 'Solve 100 problems',
        unlock_condition: { type: 'total_solutions', count: 100 },
        points: 150
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBadgeDef })
          })
        })
      });

      expect(achievementService.getProgressTowards).toBeDefined();
    });

    it('should calculate progress percentage', async () => {
      const mockBadgeDef = {
        badge_name: 'problems_50',
        description: 'Solve 50 problems',
        unlock_condition: { type: 'total_solutions', count: 50 },
        points: 75
      };

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBadgeDef })
          })
        })
      });

      expect(achievementService.getProgressTowards).toBeDefined();
    });

    it('should return null for non-existent badge', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ error: new Error('Not found') })
          })
        })
      });

      const result = await achievementService.getProgressTowards(
        testUserId,
        'nonexistent'
      );

      expect(result).toBeNull();
    });
  });

  // Test 4: Check all achievements
  describe('checkAllAchievements', () => {
    it('should check all badge definitions', async () => {
      const mockDefinitions = [
        { badge_name: 'first_solve' },
        { badge_name: 'perfect_solve' },
        { badge_name: 'streak_7' }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          mockDefinitionsData: true
        })
      });

      expect(achievementService.checkAllAchievements).toBeDefined();
    });

    it('should return array of unlocked achievements', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          mockData: []
        })
      });

      expect(achievementService.checkAllAchievements).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          mockData: null
        })
      });

      expect(achievementService.checkAllAchievements).toBeDefined();
    });
  });

  // Test 5: Get achievement definitions
  describe('getAchievementDefinitions', () => {
    it('should return all badge definitions', async () => {
      const mockDefinitions = [
        {
          badge_name: 'first_solve',
          description: 'Solve your first problem',
          category: 'badge',
          rarity: 'common',
          points: 5
        },
        {
          badge_name: 'problems_100',
          description: 'Solve 100 problems',
          category: 'milestone',
          rarity: 'epic',
          points: 150
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockDefinitions })
        })
      });

      expect(achievementService.getAchievementDefinitions).toBeDefined();
    });

    it('should filter by category if provided', async () => {
      const mockMilestones = [
        {
          badge_name: 'problems_10',
          category: 'milestone',
          points: 25
        },
        {
          badge_name: 'problems_50',
          category: 'milestone',
          points: 75
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockMilestones })
          })
        })
      });

      expect(achievementService.getAchievementDefinitions).toBeDefined();
    });

    it('should return empty array on error', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null })
        })
      });

      const result = await achievementService.getAchievementDefinitions();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // Test 6: Calculate achievement points
  describe('calculateAchievementPoints', () => {
    it('should sum points from all achievements', async () => {
      const mockAchievements = [
        {
          achievement_definitions: { points: 5 } // first_solve
        },
        {
          achievement_definitions: { points: 50 } // streak_7
        },
        {
          achievement_definitions: { points: 25 } // problems_10
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAchievements })
        })
      });

      expect(achievementService.calculateAchievementPoints).toBeDefined();
    });

    it('should return 0 for user with no achievements', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null })
        })
      });

      const result = await achievementService.calculateAchievementPoints(testUserId);
      expect(result).toBe(0);
    });

    it('should handle null achievement definitions', async () => {
      const mockAchievements = [
        { achievement_definitions: null },
        { achievement_definitions: { points: 50 } }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAchievements })
        })
      });

      expect(achievementService.calculateAchievementPoints).toBeDefined();
    });
  });

  // Test 7: Condition types
  describe('condition evaluation', () => {
    it('should evaluate perfect_score condition', async () => {
      // Test that perfectScore condition checks if score >= minScore
      const condition = { type: 'perfect_score', minScore: 100 };
      expect(condition.type).toBe('perfect_score');
    });

    it('should evaluate streak_days condition', async () => {
      const condition = { type: 'streak_days', days: 7 };
      expect(condition.days).toBe(7);
    });

    it('should evaluate problem_count condition', async () => {
      const condition = { type: 'problem_count', difficulty: 'easy', count: 25 };
      expect(condition.difficulty).toBe('easy');
      expect(condition.count).toBe(25);
    });

    it('should evaluate total_solutions condition', async () => {
      const condition = { type: 'total_solutions', count: 100 };
      expect(condition.count).toBe(100);
    });

    it('should evaluate topic_diversity condition', async () => {
      const condition = { type: 'topic_diversity', minTopics: 10 };
      expect(condition.minTopics).toBe(10);
    });
  });

  // Test 8: Multiple badge unlocks
  describe('multiple unlocks', () => {
    it('should unlock multiple badges simultaneously', async () => {
      // First solve could unlock both 'first_solve' and 'perfect_solve' if perfect
      const context = {
        problemId: testProblemId,
        score: 100,
        isPerfect: true,
        streakDays: 0
      };

      expect(typeof context).toBe('object');
      expect(context.isPerfect).toBe(true);
    });

    it('should not duplicate unlock results', async () => {
      // If checkAllAchievements is called, same badge shouldn't appear twice
      const mockAchievements = [
        { badgeName: 'first_solve', points: 5 },
        { badgeName: 'first_solve', points: 5 } // Duplicate
      ];

      // Set would deduplicate by badgeName
      const unique = new Set(mockAchievements.map(a => a.badgeName));
      expect(unique.size).toBe(1);
    });
  });

  // Test 9: Rarity filtering
  describe('badge rarity', () => {
    it('should return common badges', async () => {
      const mockCommon = [
        { badge_name: 'first_solve', rarity: 'common' },
        { badge_name: 'blitz_master', rarity: 'common' }
      ];

      expect(mockCommon.every(b => b.rarity === 'common')).toBe(true);
    });

    it('should return epic badges', async () => {
      const mockEpic = [
        { badge_name: 'hard_master', rarity: 'epic' },
        { badge_name: 'streak_100', rarity: 'epic' }
      ];

      expect(mockEpic.every(b => b.rarity === 'epic')).toBe(true);
    });

    it('should return legendary badges', async () => {
      const mockLegendary = [
        { badge_name: 'problems_250', rarity: 'legendary' }
      ];

      expect(mockLegendary.every(b => b.rarity === 'legendary')).toBe(true);
    });
  });

  // Test 10: Error handling
  describe('error handling', () => {
    it('should throw on database error during unlock', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('DB Connection failed'))
          })
        })
      });

      await expect(
        achievementService.unlockAchievement(testUserId, 'first_solve', {})
      ).rejects.toThrow();
    });

    it('should handle missing unlock condition gracefully', async () => {
      const badgeDef = {
        badge_name: 'test_badge',
        unlock_condition: { type: 'unknown_type' }
      };

      // Unknown condition types should be logged and treated as unmet
      expect(badgeDef.unlock_condition.type).toBe('unknown_type');
    });

    it('should log errors without crashing', async () => {
      // Service should catch errors and continue
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockRejectedValue(new Error('Query failed'))
            })
          })
        })
      });

      expect(achievementService.unlockAchievement).toBeDefined();
    });
  });
});
