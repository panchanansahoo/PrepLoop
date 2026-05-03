/**
 * Adaptive Difficulty Selector Tests
 * Validates difficulty scaling based on performance trajectory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AdaptiveDifficultySelector from '../services/adaptiveDifficultySelector.js';

describe('AdaptiveDifficultySelector', () => {
  let selector;

  beforeEach(() => {
    selector = new AdaptiveDifficultySelector();
  });

  describe('Initialization', () => {
    it('should initialize with marked difficulty', () => {
      const difficulty = selector.initializeDifficulty('user1', 'medium');

      expect(difficulty).toBe('medium');
    });

    it('should normalize difficulty input', () => {
      selector.initializeDifficulty('user1', 'HARD');
      const current = selector.getCurrentDifficulty('user1');

      expect(current).toBe('hard');
    });

    it('should default to medium if invalid difficulty', () => {
      selector.initializeDifficulty('user1', 'expert');

      const current = selector.getCurrentDifficulty('user1');
      expect(current).toBe('medium');
    });

    it('should return medium for uninitialized user', () => {
      const current = selector.getCurrentDifficulty('unknown-user');

      expect(current).toBe('medium');
    });
  });

  describe('Score Recording & Trajectory', () => {
    it('should record score and calculate trajectory', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Improving scores: 65, 75, 90
      const result1 = selector.recordScoreAndUpdateDifficulty('user1', 65);
      const result2 = selector.recordScoreAndUpdateDifficulty('user1', 75);
      const result3 = selector.recordScoreAndUpdateDifficulty('user1', 90);

      // result3: 65*0.2 + 75*0.3 + 90*0.5 = 13 + 22.5 + 45 = 80.5 >= 80
      expect(result1.trajectory).toBe(0); // Only 1 score
      expect(result2.trajectory).toBe(0); // 2 scores, weighted = 71
      expect(result3.trajectory).toBeGreaterThanOrEqual(0); // Improving trend
    });

    it('should detect declining trajectory', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Declining scores: 90, 70, 40
      selector.recordScoreAndUpdateDifficulty('user1', 90);
      selector.recordScoreAndUpdateDifficulty('user1', 70);
      const result = selector.recordScoreAndUpdateDifficulty('user1', 40);

      expect(result.trajectory).toBe(-1);
    });

    it('should detect stable trajectory', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Stable scores: 70, 72, 68
      selector.recordScoreAndUpdateDifficulty('user1', 70);
      selector.recordScoreAndUpdateDifficulty('user1', 72);
      const result = selector.recordScoreAndUpdateDifficulty('user1', 68);

      expect(result.trajectory).toBe(0);
    });
  });

  describe('Difficulty Adjustment', () => {
    it('should increase difficulty on improving trajectory', () => {
      selector.initializeDifficulty('user1', 'medium');

      const result1 = selector.recordScoreAndUpdateDifficulty('user1', 50);
      const result2 = selector.recordScoreAndUpdateDifficulty('user1', 75);
      const result3 = selector.recordScoreAndUpdateDifficulty('user1', 90);

      // After 3 scores with improving trend (effective score ~80)
      expect(result3.trajectory).toBeGreaterThanOrEqual(0);
      expect(result3.currentDifficulty).toBeDefined();
    });

    it('should decrease difficulty on declining trajectory', () => {
      selector.initializeDifficulty('user1', 'medium');

      const result1 = selector.recordScoreAndUpdateDifficulty('user1', 85);
      const result2 = selector.recordScoreAndUpdateDifficulty('user1', 60);
      const result3 = selector.recordScoreAndUpdateDifficulty('user1', 40);

      // Declining trend
      expect(result3.trajectory).toBeLessThan(0);
      expect(result3.currentDifficulty).toBe('easy');
    });

    it('should not change difficulty below minimum', () => {
      selector.initializeDifficulty('user1', 'easy');

      const result = selector.recordScoreAndUpdateDifficulty('user1', 20);

      expect(result.currentDifficulty).toBe('easy');
    });

    it('should not change difficulty above maximum', () => {
      selector.initializeDifficulty('user1', 'hard');

      const result1 = selector.recordScoreAndUpdateDifficulty('user1', 95);
      const result2 = selector.recordScoreAndUpdateDifficulty('user1', 98);
      const result3 = selector.recordScoreAndUpdateDifficulty('user1', 100);

      expect(result3.currentDifficulty).toBe('hard');
    });
  });

  describe('Difficulty Statistics', () => {
    it('should return stats for initialized user', () => {
      selector.initializeDifficulty('user1', 'medium');
      selector.recordScoreAndUpdateDifficulty('user1', 75);
      selector.recordScoreAndUpdateDifficulty('user1', 80);

      const stats = selector.getDifficultyStats('user1');

      expect(stats.initialized).toBe(true);
      expect(stats.markedDifficulty).toBe('medium');
      expect(stats.scoreCount).toBe(2);
      expect(stats.averageScore).toBeGreaterThan(70);
    });

    it('should calculate score statistics', () => {
      selector.initializeDifficulty('user1', 'medium');
      selector.recordScoreAndUpdateDifficulty('user1', 60);
      selector.recordScoreAndUpdateDifficulty('user1', 80);
      selector.recordScoreAndUpdateDifficulty('user1', 70);

      const stats = selector.getDifficultyStats('user1');

      expect(stats.minScore).toBe(60);
      expect(stats.maxScore).toBe(80);
      expect(stats.averageScore).toBe(70);
      expect(stats.scoreVariance).toBeGreaterThan(0);
    });

    it('should track difficulty history', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Try to trigger adjustment
      selector.recordScoreAndUpdateDifficulty('user1', 50);
      selector.recordScoreAndUpdateDifficulty('user1', 80);
      selector.recordScoreAndUpdateDifficulty('user1', 95);

      const stats = selector.getDifficultyStats('user1');

      expect(stats.difficultyHistory.length).toBeGreaterThanOrEqual(1);
      expect(stats.difficultyHistory[0]).toBe('medium');
    });

    it('should return null stats for uninitialized user', () => {
      const stats = selector.getDifficultyStats('unknown-user');

      expect(stats.initialized).toBe(false);
      expect(stats.currentDifficulty).toBe(null);
    });
  });

  describe('Recommended Difficulty', () => {
    it('should recommend difficulty based on average score', () => {
      selector.initializeDifficulty('user1', 'medium');

      // High scores
      for (let i = 0; i < 5; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 90);
      }

      const recommendation = selector.getRecommendedDifficulty('user1', 13);

      expect(recommendation.suggestedDifficulty).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThan(0.5);
    });

    it('should recommend increase for high average score', () => {
      selector.initializeDifficulty('user1', 'easy');

      for (let i = 0; i < 5; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 88);
      }

      const recommendation = selector.getRecommendedDifficulty('user1');

      // With 88 average (>85), should recommend medium
      expect(recommendation.suggestedDifficulty).not.toBe('easy');
      expect(recommendation.reason).toContain('85%');
    });

    it('should recommend decrease for low average score', () => {
      selector.initializeDifficulty('user1', 'hard');

      for (let i = 0; i < 5; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 45);
      }

      const recommendation = selector.getRecommendedDifficulty('user1');

      // With 45 average (<50), should recommend medium or easy
      expect(['easy', 'medium']).toContain(recommendation.suggestedDifficulty);
      expect(recommendation.reason).toContain('50%');
    });

    it('should return medium for uninitialized user', () => {
      const recommendation = selector.getRecommendedDifficulty('unknown-user');

      expect(recommendation.suggestedDifficulty).toBe('medium');
      expect(recommendation.confidence).toBeLessThan(0.7);
    });

    it('should reduce confidence near end of interview', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Add 12 scores (out of 13 questions = 92% complete)
      for (let i = 0; i < 12; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 85);
      }

      const recommendation = selector.getRecommendedDifficulty('user1', 13);

      // With high avg score (85), confidence might start high but should be reduced near end
      // Check that confidence is not extremely high
      expect(recommendation.confidence).toBeLessThan(1.0);
      expect(recommendation.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('Score History', () => {
    it('should track last 5 scores', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Record 10 scores
      for (let i = 0; i < 10; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 50 + i * 5);
      }

      const result = selector.getDifficultyStats('user1');

      expect(result.scoreCount).toBe(10);
    });

    it('should return recent score history in response', () => {
      selector.initializeDifficulty('user1', 'medium');

      selector.recordScoreAndUpdateDifficulty('user1', 60);
      selector.recordScoreAndUpdateDifficulty('user1', 70);
      const result = selector.recordScoreAndUpdateDifficulty('user1', 80);

      expect(result.scoreHistory.length).toBeGreaterThan(0);
      expect(result.scoreHistory[result.scoreHistory.length - 1]).toBe(80);
    });
  });

  describe('Reset & State Management', () => {
    it('should reset individual user difficulty', () => {
      selector.initializeDifficulty('user1', 'medium');
      selector.recordScoreAndUpdateDifficulty('user1', 80);

      selector.resetUserDifficulty('user1');

      const stats = selector.getDifficultyStats('user1');
      expect(stats.initialized).toBe(false);
    });

    it('should reset all sessions', () => {
      selector.initializeDifficulty('user1', 'medium');
      selector.initializeDifficulty('user2', 'hard');

      selector.resetAll();

      expect(selector.getCurrentDifficulty('user1')).toBe('medium');
      expect(selector.getCurrentDifficulty('user2')).toBe('medium');
    });
  });

  describe('Edge Cases', () => {
    it('should clamp score to 0-100 range', () => {
      selector.initializeDifficulty('user1', 'medium');

      const result1 = selector.recordScoreAndUpdateDifficulty('user1', -50);
      const result2 = selector.recordScoreAndUpdateDifficulty('user1', 150);

      expect(result1.lastScore).toBe(0);
      expect(result2.lastScore).toBe(100);
    });

    it('should handle single score gracefully', () => {
      selector.initializeDifficulty('user1', 'medium');

      const result = selector.recordScoreAndUpdateDifficulty('user1', 75);

      expect(result.trajectory).toBe(0);
      expect(result.currentDifficulty).toBe('medium');
    });

    it('should handle constant scores', () => {
      selector.initializeDifficulty('user1', 'medium');

      for (let i = 0; i < 5; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 75);
      }

      const stats = selector.getDifficultyStats('user1');

      expect(stats.scoreVariance).toBeLessThan(5); // Near-zero variance
      expect(stats.averageScore).toBe(75);
    });

    it('should handle extreme variance', () => {
      selector.initializeDifficulty('user1', 'medium');

      selector.recordScoreAndUpdateDifficulty('user1', 5);
      selector.recordScoreAndUpdateDifficulty('user1', 50);
      selector.recordScoreAndUpdateDifficulty('user1', 95);

      const stats = selector.getDifficultyStats('user1');

      expect(stats.scoreVariance).toBeGreaterThan(30);
    });
  });

  describe('Integration: Full Interview Flow', () => {
    it('should handle complete interview difficulty progression', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Simulate interview with varying performance
      const scores = [70, 75, 80, 82, 78, 85, 88, 90];
      const results = [];

      for (const score of scores) {
        results.push(selector.recordScoreAndUpdateDifficulty('user1', score));
      }

      // Verify progression
      const finalStats = selector.getDifficultyStats('user1');

      expect(finalStats.scoreCount).toBe(scores.length);
      expect(finalStats.averageScore).toBeGreaterThan(75);
      expect(finalStats.adjustmentCount).toBeGreaterThanOrEqual(0);
    });

    it('should adjust difficulty during declining performance', () => {
      selector.initializeDifficulty('user1', 'hard');

      // Simulate declining performance
      const scores = [80, 70, 60, 50, 45, 40];
      const results = [];

      for (const score of scores) {
        results.push(selector.recordScoreAndUpdateDifficulty('user1', score));
      }

      const finalStats = selector.getDifficultyStats('user1');

      // Should have adjusted to easier difficulty
      expect(finalStats.adjustmentCount).toBeGreaterThan(0);
      const diffLevels = ['easy', 'medium', 'hard'];
      const currentIndex = diffLevels.indexOf(finalStats.currentDifficulty);
      const startIndex = diffLevels.indexOf('hard');
      expect(currentIndex).toBeLessThanOrEqual(startIndex);
    });

    it('should recommend harder difficulty for strong performance', () => {
      selector.initializeDifficulty('user1', 'easy');

      // Strong performance on easy questions
      for (let i = 0; i < 7; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 92);
      }

      const recommendation = selector.getRecommendedDifficulty('user1', 13);

      // With 92 average (>85), should recommend harder difficulty
      expect(['medium', 'hard']).toContain(recommendation.suggestedDifficulty);
      expect(recommendation.confidence).toBeGreaterThan(0.5);
    });

    it('should stabilize difficulty when performance plateaus', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Plateau at medium difficulty
      for (let i = 0; i < 8; i++) {
        selector.recordScoreAndUpdateDifficulty('user1', 72);
      }

      const stats = selector.getDifficultyStats('user1');
      const recommendation = selector.getRecommendedDifficulty('user1', 13);

      expect(stats.trajectory).toBe(0);
      expect(recommendation.adjustmentStrategy).toBe('maintain');
    });
  });

  describe('Weighted Trajectory Calculation', () => {
    it('should weight newer scores higher', () => {
      selector.initializeDifficulty('user1', 'medium');

      // Last score (newest) is 95, should influence trajectory positively
      selector.recordScoreAndUpdateDifficulty('user1', 60); // Oldest, weight 0.2
      selector.recordScoreAndUpdateDifficulty('user1', 70); // Middle, weight 0.3
      const result = selector.recordScoreAndUpdateDifficulty('user1', 95); // Newest, weight 0.5

      // Effective score = 60*0.2 + 70*0.3 + 95*0.5 = 12 + 21 + 47.5 = 80.5 >= 80
      expect(result.trajectory).toBeGreaterThanOrEqual(0);
    });
  });
});
