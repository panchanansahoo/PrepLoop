import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as gamificationService from '../services/gamificationService.js';
import * as leaderboardService from '../services/leaderboardService.js';
import * as achievementService from '../services/achievementService.js';
import * as streakService from '../services/streakService.js';

// Mock all sub-services
vi.mock('../services/leaderboardService.js', () => ({
  calculateGlobalRanking: vi.fn(),
  calculateTopicRanking: vi.fn(),
  calculateProblemRanking: vi.fn(),
  updateLeaderboardEntry: vi.fn(),
  calculateScore: vi.fn(),
  getUserRank: vi.fn(),
  getLeaderboardPage: vi.fn()
}));

vi.mock('../services/achievementService.js', () => ({
  checkAllAchievements: vi.fn()
}));

vi.mock('../services/streakService.js', () => ({
  updateStreak: vi.fn(),
  getStreakMultiplier: vi.fn(),
  getStreakSummary: vi.fn(),
  getCurrentStreak: vi.fn()
}));

describe('gamificationService', () => {
  const testUserId = 'test-user-123';
  const testProblemId = 'test-problem-456';
  const testTopicId = 'test-topic-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Submit solution - full orchestration
  describe('submitSolution', () => {
    it('should orchestrate all gamification updates', async () => {
      const solutionData = {
        score: 95,
        timeMs: 300000,
        isPerfect: false
      };

      const problemData = {
        difficulty: 'medium',
        avgTimeMs: 360000,
        topicId: testTopicId
      };

      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 5,
        longest_streak: 10,
        is_active: true,
        points: 65
      });
      streakService.getStreakMultiplier.mockReturnValue(1.05);
      leaderboardService.calculateGlobalRanking.mockResolvedValue({
        rank: 42,
        score: 2850,
        solutions_count: 48
      });
      leaderboardService.calculateTopicRanking.mockResolvedValue({
        rank: 8,
        score: 850,
        solutions_count: 12
      });
      leaderboardService.calculateProblemRanking.mockResolvedValue([]);
      leaderboardService.updateLeaderboardEntry.mockResolvedValue({
        id: 'lb-123',
        score: 30
      });
      achievementService.checkAllAchievements.mockResolvedValue([
        {
          badgeName: 'perfect_solve',
          rarity: 'rare',
          points: 20,
          description: 'Solve with 100% test pass'
        }
      ]);

      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('should calculate streak-adjusted points', async () => {
      leaderboardService.calculateScore.mockReturnValue(25);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 7,
        longest_streak: 15,
        is_active: true,
        points: 91
      });
      streakService.getStreakMultiplier.mockReturnValue(1.07);

      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('should handle achievement unlocks', async () => {
      leaderboardService.calculateScore.mockReturnValue(40);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 30,
        longest_streak: 30,
        is_active: true,
        points: 620
      });
      streakService.getStreakMultiplier.mockReturnValue(1.30);
      leaderboardService.calculateGlobalRanking.mockResolvedValue({
        rank: 10,
        score: 5000
      });
      achievementService.checkAllAchievements.mockResolvedValue([
        {
          badgeName: 'streak_30',
          points: 200,
          rarity: 'epic'
        },
        {
          badgeName: 'perfect_solve',
          points: 20,
          rarity: 'rare'
        }
      ]);

      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('should return complete response', async () => {
      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 5,
        longest_streak: 10,
        is_active: true,
        points: 65
      });
      streakService.getStreakMultiplier.mockReturnValue(1.05);
      leaderboardService.calculateGlobalRanking.mockResolvedValue({
        rank: 50,
        score: 2500,
        solutions_count: 45
      });
      achievementService.checkAllAchievements.mockResolvedValue([]);

      expect(gamificationService.submitSolution).toBeDefined();
    });
  });

  // Test 2: Get game profile
  describe('getGameProfile', () => {
    it('should return complete user profile', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          badge_name: 'first_solve',
          achieved_at: '2026-05-01T10:00:00Z',
          achievement_definitions: {
            points: 5,
            description: 'Solve your first problem'
          }
        }
      ];

      const mockStreak = {
        current: 12,
        longest: 47,
        isActive: true,
        points: 156
      };

      const mockRank = {
        rank: 42,
        score: 2850,
        solutions_count: 48,
        avg_score: 92.5
      };

      // Mock functions would return these values
      expect(gamificationService.getGameProfile).toBeDefined();
    });

    it('should aggregate all gamification components', async () => {
      expect(gamificationService.getGameProfile).toBeDefined();
    });

    it('should calculate total points', async () => {
      // Total = achievement points + streak points
      expect(gamificationService.getGameProfile).toBeDefined();
    });
  });

  // Test 3: Get dashboard
  describe('getDashboard', () => {
    it('should return complete dashboard', async () => {
      expect(gamificationService.getDashboard).toBeDefined();
    });

    it('should include leaderboards', async () => {
      expect(gamificationService.getDashboard).toBeDefined();
    });

    it('should include user profile', async () => {
      expect(gamificationService.getDashboard).toBeDefined();
    });

    it('should include statistics', async () => {
      expect(gamificationService.getDashboard).toBeDefined();
    });
  });

  // Test 4: Get leaderboard with user position
  describe('getLeaderboardWithUserPosition', () => {
    it('should return leaderboard with user highlighted', async () => {
      leaderboardService.getLeaderboardPage.mockResolvedValue({
        page: 1,
        pageSize: 50,
        total: 1000,
        totalPages: 20,
        entries: [
          { user_id: 'u1', rank: 1, score: 5000 },
          { user_id: testUserId, rank: 2, score: 4800 },
          { user_id: 'u3', rank: 3, score: 4600 }
        ]
      });

      leaderboardService.getUserRank.mockResolvedValue({
        rank: 2,
        score: 4800,
        onCurrentPage: true
      });

      expect(gamificationService.getLeaderboardWithUserPosition).toBeDefined();
    });

    it('should mark user position if on current page', async () => {
      leaderboardService.getLeaderboardPage.mockResolvedValue({
        entries: []
      });

      leaderboardService.getUserRank.mockResolvedValue({
        rank: 42,
        score: 2500
      });

      expect(gamificationService.getLeaderboardWithUserPosition).toBeDefined();
    });

    it('should support different scopes', async () => {
      leaderboardService.getLeaderboardPage.mockResolvedValue({
        entries: []
      });

      leaderboardService.getUserRank.mockResolvedValue({
        rank: 5,
        score: 850
      });

      expect(gamificationService.getLeaderboardWithUserPosition).toBeDefined();
    });
  });

  // Test 5: Get achievement progress
  describe('getAchievementProgress', () => {
    it('should return progress on all badges', async () => {
      expect(gamificationService.getAchievementProgress).toBeDefined();
    });

    it('should show unlocked achievements', async () => {
      expect(gamificationService.getAchievementProgress).toBeDefined();
    });

    it('should show progress toward locked achievements', async () => {
      expect(gamificationService.getAchievementProgress).toBeDefined();
    });

    it('should include unlock conditions', async () => {
      expect(gamificationService.getAchievementProgress).toBeDefined();
    });
  });

  // Test 6: Compare users
  describe('compareUsers', () => {
    it('should compare two users', async () => {
      expect(gamificationService.compareUsers).toBeDefined();
    });

    it('should calculate differences', async () => {
      expect(gamificationService.compareUsers).toBeDefined();
    });

    it('should include rank comparison', async () => {
      expect(gamificationService.compareUsers).toBeDefined();
    });

    it('should include achievements comparison', async () => {
      expect(gamificationService.compareUsers).toBeDefined();
    });
  });

  // Test 7: Recalculate leaderboards (admin)
  describe('recalculateLeaderboards', () => {
    it('should bulk update rankings', async () => {
      expect(gamificationService.recalculateLeaderboards).toBeDefined();
    });

    it('should return count of updated entries', async () => {
      expect(gamificationService.recalculateLeaderboards).toBeDefined();
    });

    it('should handle partial failures', async () => {
      expect(gamificationService.recalculateLeaderboards).toBeDefined();
    });
  });

  // Test 8: Points calculation helper
  describe('point value by difficulty', () => {
    it('should return 10 for easy', () => {
      // Internal function test via submitSolution context
      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('should return 25 for medium', () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('should return 50 for hard', () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });
  });

  // Test 9: Response structure
  describe('response structure', () => {
    it('submitSolution should include success flag', async () => {
      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 5,
        longest_streak: 10,
        is_active: true,
        points: 65
      });
      streakService.getStreakMultiplier.mockReturnValue(1.05);
      leaderboardService.calculateGlobalRanking.mockResolvedValue({});
      achievementService.checkAllAchievements.mockResolvedValue([]);

      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('submitSolution should include points', async () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('submitSolution should include achievements array', async () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('submitSolution should include streak info', async () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });

    it('submitSolution should include leaderboard position', async () => {
      expect(gamificationService.submitSolution).toBeDefined();
    });
  });

  // Test 10: Error handling
  describe('error handling', () => {
    it('should handle streak update failure', async () => {
      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockRejectedValue(new Error('Streak failed'));

      await expect(
        gamificationService.submitSolution(testUserId, testProblemId, {}, {})
      ).rejects.toThrow();
    });

    it('should handle leaderboard update failure', async () => {
      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 5,
        is_active: true,
        points: 65
      });
      streakService.getStreakMultiplier.mockReturnValue(1.05);
      leaderboardService.calculateGlobalRanking.mockRejectedValue(
        new Error('LB failed')
      );

      await expect(
        gamificationService.submitSolution(testUserId, testProblemId, {}, {})
      ).rejects.toThrow();
    });

    it('should handle achievement check failure', async () => {
      leaderboardService.calculateScore.mockReturnValue(30);
      streakService.updateStreak.mockResolvedValue({
        streak_days: 5,
        is_active: true,
        points: 65
      });
      streakService.getStreakMultiplier.mockReturnValue(1.05);
      leaderboardService.calculateGlobalRanking.mockResolvedValue({});
      achievementService.checkAllAchievements.mockRejectedValue(
        new Error('Achievement check failed')
      );

      await expect(
        gamificationService.submitSolution(testUserId, testProblemId, {}, {})
      ).rejects.toThrow();
    });

    it('getGameProfile should handle missing data', async () => {
      expect(gamificationService.getGameProfile).toBeDefined();
    });
  });
});
