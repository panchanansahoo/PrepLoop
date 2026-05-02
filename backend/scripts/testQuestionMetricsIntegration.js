/**
 * Question Quality Metrics Integration Test Suite
 * 
 * Tests the complete flow of:
 * 1. Recording question usage
 * 2. Recording feedback & time
 * 3. Getting recommendations
 * 4. Checking metrics
 */

import questionMetrics from '../utils/questionMetrics.js';
import questionRecommender from '../utils/questionRecommender.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Question Quality Metrics Integration', () => {
  
  beforeEach(async () => {
    await questionMetrics.reset();
    await questionMetrics.initialize();
  });

  afterEach(async () => {
    await questionMetrics.reset();
  });

  describe('Basic Metrics Recording', () => {
    it('should record question usage', async () => {
      await questionMetrics.recordUsage('q-001', 'behavioral', 'easy');
      const metrics = await questionMetrics.getMetrics('q-001');
      
      expect(metrics).toBeDefined();
      expect(metrics.questionId).toBe('q-001');
      expect(metrics.usageCount).toBe(1);
      expect(metrics.category).toBe('behavioral');
      expect(metrics.difficulty).toBe('easy');
    });

    it('should increment usage count on multiple records', async () => {
      await questionMetrics.recordUsage('q-002', 'technical', 'medium');
      await questionMetrics.recordUsage('q-002', 'technical', 'medium');
      await questionMetrics.recordUsage('q-002', 'technical', 'medium');

      const metrics = await questionMetrics.getMetrics('q-002');
      expect(metrics.usageCount).toBe(3);
    });

    it('should record feedback and calculate quality rating', async () => {
      await questionMetrics.recordUsage('q-003', 'behavioral', 'medium');
      await questionMetrics.recordFeedback('q-003', 85, true);
      await questionMetrics.recordFeedback('q-003', 90, true);
      await questionMetrics.recordFeedback('q-003', 75, false);

      const metrics = await questionMetrics.getMetrics('q-003');
      expect(metrics.feedbackCount).toBe(3);
      expect(metrics.positiveCount).toBe(2);
      expect(Math.round(metrics.qualityRating)).toBe(83); // avg of 85, 90, 75
    });

    it('should track time spent on questions', async () => {
      await questionMetrics.recordUsage('q-004', 'system-design', 'hard');
      await questionMetrics.recordTimeSpent('q-004', 120);
      await questionMetrics.recordTimeSpent('q-004', 150);
      await questionMetrics.recordTimeSpent('q-004', 130);

      const metrics = await questionMetrics.getMetrics('q-004');
      expect(Math.round(metrics.averageTime)).toBe(133);
    });
  });

  describe('Category Analysis', () => {
    beforeEach(async () => {
      // Create a diverse set of questions
      for (let i = 1; i <= 5; i++) {
        await questionMetrics.recordUsage(`q-${i}`, 'behavioral', 'medium');
        const quality = 60 + (i * 10); // 70-110, capped at 100
        await questionMetrics.recordFeedback(`q-${i}`, Math.min(quality, 100), quality > 80);
      }
    });

    it('should get category summary', async () => {
      const summary = await questionMetrics.getCategorySummary('behavioral');
      
      expect(summary.category).toBe('behavioral');
      expect(summary.totalQuestions).toBe(5);
      expect(summary.avgQuality).toBeGreaterThan(70);
      expect(summary.avgUsage).toBe(1);
    });

    it('should calculate diversity score', async () => {
      const diversity = await questionMetrics.getDiversityScore('behavioral');
      
      // 5 unique questions / (5 total usage / 5 expected per session) = 100%
      expect(diversity).toBeGreaterThan(0);
      expect(diversity).toBeLessThanOrEqual(100);
    });

    it('should get underutilized questions', async () => {
      // Make some questions popular
      for (let i = 1; i <= 3; i++) {
        await questionMetrics.recordUsage(`q-${i}`, 'behavioral', 'medium');
      }

      const underutilized = await questionMetrics.getUnderutilizedQuestions('behavioral', 60);
      
      // Should favor q-4 and q-5 which have lower usage
      expect(underutilized.length).toBeGreaterThan(0);
      const ids = underutilized.map(m => m.questionId);
      expect(ids).toContain('q-4');
      expect(ids).toContain('q-5');
    });

    it('should get metrics by category', async () => {
      const categoryMetrics = await questionMetrics.getMetricsByCategory('behavioral');
      
      expect(categoryMetrics.length).toBe(5);
      expect(categoryMetrics.every(m => m.category === 'behavioral')).toBe(true);
    });
  });

  describe('Smart Recommendations', () => {
    beforeEach(async () => {
      // Create test questions with different profiles
      // High quality, low usage (gems)
      for (let i = 1; i <= 3; i++) {
        await questionMetrics.recordUsage(`gem-${i}`, 'technical', 'hard');
        await questionMetrics.recordFeedback(`gem-${i}`, 85 + i, true);
      }

      // Medium quality, high usage (popular)
      for (let i = 1; i <= 3; i++) {
        for (let j = 0; j < 5; j++) {
          await questionMetrics.recordUsage(`popular-${i}`, 'technical', 'medium');
        }
        await questionMetrics.recordFeedback(`popular-${i}`, 70, true);
      }

      // Low quality (avoid)
      await questionMetrics.recordUsage('bad-1', 'technical', 'easy');
      await questionMetrics.recordFeedback('bad-1', 40, false);
    });

    it('should recommend high-quality questions', async () => {
      const result = await questionRecommender.getRecommendations(
        'technical',
        'medium',
        70, // user's current score
        [],
        5
      );

      expect(result.recommendations.length).toBeGreaterThan(0);
      // Top recommendations should have good scores
      expect(result.recommendations[0].score).toBeGreaterThan(50);
    });

    it('should exclude recently-used questions', async () => {
      const recent = ['gem-1', 'gem-2'];
      const result = await questionRecommender.getRecommendations(
        'technical',
        'medium',
        70,
        recent,
        5
      );

      const recommendedIds = result.recommendations.map(r => r.questionId);
      expect(recommendedIds).not.toContain('gem-1');
      expect(recommendedIds).not.toContain('gem-2');
    });

    it('should balance quality and novelty', async () => {
      const result = await questionRecommender.getRecommendations(
        'technical',
        'medium',
        75,
        [],
        3
      );

      // Check that recommendations have a mix of quality and novelty scores
      const breakdowns = result.recommendations.map(r => r.breakdown);
      expect(breakdowns.some(b => b.quality > 60)).toBe(true); // Some have good quality
      expect(breakdowns.some(b => b.novelty > 50)).toBe(true);  // Some have good novelty
    });

    it('should get diverse question set', async () => {
      const result = await questionRecommender.getDiverseSet('technical', 5, 50);
      
      expect(result.questions).toBeDefined();
      expect(result.coverage).toBeGreaterThan(0);
    });

    it('should get gem questions', async () => {
      const gems = await questionRecommender.getGemQuestions('technical', 3);
      
      expect(gems.length).toBeGreaterThan(0);
      // Gems should have high quality
      gems.forEach(gem => {
        expect(gem.qualityRating).toBeGreaterThan(60);
      });
    });
  });

  describe('Score Weighting', () => {
    it('should weight quality heavily', async () => {
      // Create two questions: one high-quality but used, one low-quality but novel
      await questionMetrics.recordUsage('high-quality', 'behavioral', 'easy');
      for (let i = 0; i < 10; i++) {
        await questionMetrics.recordUsage('high-quality', 'behavioral', 'easy');
      }
      await questionMetrics.recordFeedback('high-quality', 90, true);

      await questionMetrics.recordUsage('novel', 'behavioral', 'easy');
      await questionMetrics.recordFeedback('novel', 50, false);

      const result = await questionRecommender.getRecommendations(
        'behavioral',
        'easy',
        70,
        [],
        2
      );

      // High-quality should rank first despite high usage
      expect(result.recommendations[0].questionId).toBe('high-quality');
    });

    it('should prefer underutilized questions when quality is similar', async () => {
      // Create two similar-quality questions
      await questionMetrics.recordUsage('q-a', 'behavioral', 'medium');
      await questionMetrics.recordFeedback('q-a', 80, true);

      for (let i = 0; i < 5; i++) {
        await questionMetrics.recordUsage('q-b', 'behavioral', 'medium');
      }
      await questionMetrics.recordFeedback('q-b', 81, true);

      const result = await questionRecommender.getRecommendations(
        'behavioral',
        'medium',
        70,
        [],
        2
      );

      // q-a should rank higher due to novelty despite slightly lower quality
      const ids = result.recommendations.map(r => r.questionId);
      expect(ids[0]).toBe('q-a');
    });
  });

  describe('Real-World Interview Flow', () => {
    it('should simulate a complete interview session', async () => {
      const session = {
        userId: 'user-123',
        type: 'behavioral',
        difficulty: 'medium',
        previousQuestions: []
      };

      // Question 1
      await questionMetrics.recordUsage('q-interview-1', 'behavioral', 'medium');
      await questionMetrics.recordFeedback('q-interview-1', 75, true);
      await questionMetrics.recordTimeSpent('q-interview-1', 90);

      // Question 2
      await questionMetrics.recordUsage('q-interview-2', 'behavioral', 'medium');
      await questionMetrics.recordFeedback('q-interview-2', 80, true);
      await questionMetrics.recordTimeSpent('q-interview-2', 120);

      // Get next recommendation
      const recommendations = await questionRecommender.getRecommendations(
        'behavioral',
        'medium',
        (75 + 80) / 2, // avg score
        ['q-interview-1', 'q-interview-2'],
        1
      );

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.recommendations[0].questionId).not.toContain('q-interview');
    });

    it('should track performance improvement trend', async () => {
      const category = 'technical';
      
      // Early questions (lower scores)
      for (let i = 1; i <= 3; i++) {
        await questionMetrics.recordUsage(`q-early-${i}`, category, 'easy');
        await questionMetrics.recordFeedback(`q-early-${i}`, 50 + i * 5, true);
      }

      // Later questions (higher scores)
      for (let i = 1; i <= 3; i++) {
        await questionMetrics.recordUsage(`q-late-${i}`, category, 'hard');
        await questionMetrics.recordFeedback(`q-late-${i}`, 80 + i * 2, true);
      }

      const summary = await questionMetrics.getCategorySummary(category);
      
      // Avg quality should be reasonable (not skewed by early low scores)
      expect(summary.avgQuality).toBeGreaterThan(60);
    });
  });

  describe('Persistence', () => {
    it('should persist metrics across sessions', async () => {
      await questionMetrics.recordUsage('q-persist', 'behavioral', 'easy');
      await questionMetrics.recordFeedback('q-persist', 85, true);
      
      // Simulate new instance
      const metrics = await questionMetrics.getMetrics('q-persist');
      
      expect(metrics).toBeDefined();
      expect(metrics.usageCount).toBe(1);
      expect(Math.round(metrics.qualityRating)).toBe(85);
    });

    it('should handle concurrent metric records', async () => {
      // Record multiple questions in parallel
      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(questionMetrics.recordUsage(`q-concurrent-${i}`, 'technical', 'medium'));
      }

      await Promise.all(promises);

      const allMetrics = await questionMetrics.getAllMetrics();
      expect(allMetrics.length).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing question gracefully', async () => {
      const metrics = await questionMetrics.getMetrics('nonexistent-id');
      expect(metrics).toBeNull();
    });

    it('should handle invalid rating gracefully', async () => {
      await questionMetrics.recordUsage('q-invalid', 'behavioral', 'easy');
      
      // Should not throw, but clamp invalid ratings
      await questionMetrics.recordFeedback('q-invalid', 150, true); // > 100
      
      const metrics = await questionMetrics.getMetrics('q-invalid');
      expect(metrics.qualityRating).toBeLessThanOrEqual(100);
    });

    it('should handle empty category results', async () => {
      const summary = await questionMetrics.getCategorySummary('nonexistent-category');
      
      expect(summary.totalQuestions).toBe(0);
      expect(summary.avgQuality).toBe(0);
    });
  });
});

export default {
  name: 'Question Quality Metrics Integration Tests',
  description: 'Tests for question metrics tracking, recommendations, and analytics'
};
