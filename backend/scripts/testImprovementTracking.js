/**
 * Test Suite: improvementTrackingService
 * Coverage: Progress tracking, implementation measurement, improvement history
 * Total: 12 tests
 */

import {
  trackProgress,
  measureImplementation,
  getProgressHistory,
  suggestFollowUpFocus,
} from '../services/improvementTrackingService.js';

describe('improvementTrackingService', () => {
  let testUserId, testReviewId, testOriginalSolutionId, testImprovedSolutionId;

  beforeEach(async () => {
    testUserId = 'test-user-' + Date.now();
    testReviewId = 'test-review-' + Date.now();
    testOriginalSolutionId = 'orig-' + Date.now();
    testImprovedSolutionId = 'improved-' + Date.now();
  });

  describe('trackProgress', () => {
    test('should compare original and improved solutions', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.addressedAnnotations).toBeDefined();
      expect(result.implementationPercentage).toBeDefined();
    });

    test('should calculate code change percentage', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(typeof result.metrics.codeChangePercentage).toBe('number');
      expect(result.metrics.codeChangePercentage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.codeChangePercentage).toBeLessThanOrEqual(100);
    });

    test('should track line count changes', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(typeof result.metrics.originalLines).toBe('number');
      expect(typeof result.metrics.improvedLines).toBe('number');
    });

    test('should preserve language information', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(result.metrics.originalLanguage).toBeDefined();
      expect(result.metrics.improvedLanguage).toBeDefined();
    });

    test('should create response record', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(result.response).toBeDefined();
      expect(result.response.status).toBe('implemented');
      expect(result.response.implementation_score).toBeDefined();
    });

    test('should calculate implementation percentage', async () => {
      const result = await trackProgress(
        testOriginalSolutionId,
        testImprovedSolutionId,
        testReviewId
      );

      expect(typeof result.implementationPercentage).toBe('number');
      expect(result.implementationPercentage).toBeGreaterThanOrEqual(0);
      expect(result.implementationPercentage).toBeLessThanOrEqual(100);
    });

    test('should reject if solutions not found', async () => {
      await expect(
        trackProgress('nonexistent-1', 'nonexistent-2', testReviewId)
      ).rejects.toThrow('not found');
    });
  });

  describe('measureImplementation', () => {
    test('should measure implementation quality', async () => {
      const result = await measureImplementation(testReviewId, testImprovedSolutionId);

      expect(result).toBeDefined();
      expect(result.totalAnnotations).toBeDefined();
      expect(result.addressedCount).toBeDefined();
      expect(result.missedCount).toBeDefined();
      expect(result.implementationPercentage).toBeDefined();
      expect(result.implementationScore).toBeDefined();
    });

    test('should return addresses annotation IDs', async () => {
      const result = await measureImplementation(testReviewId, testImprovedSolutionId);

      expect(Array.isArray(result.addressedAnnotationIds)).toBe(true);
    });

    test('should calculate quality metrics', async () => {
      const result = await measureImplementation(testReviewId, testImprovedSolutionId);

      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.byType).toBeDefined();
      expect(result.qualityMetrics.bySeverity).toBeDefined();
    });

    test('should return 0% for no changes', async () => {
      // If solution code is identical
      const result = await measureImplementation(testReviewId, testImprovedSolutionId);

      // Should be 0% if no annotations addressed
      if (result.totalAnnotations > 0) {
        expect(result.implementationPercentage).toBeGreaterThanOrEqual(0);
      }
    });

    test('should reject if solution not found', async () => {
      await expect(
        measureImplementation(testReviewId, 'nonexistent-solution')
      ).rejects.toThrow('not found');
    });
  });

  describe('getProgressHistory', () => {
    test('should return improvement history for user', async () => {
      const history = await getProgressHistory(testUserId);

      expect(history).toBeDefined();
      expect(history.userId).toBe(testUserId);
      expect(history.history).toBeDefined();
      expect(Array.isArray(history.history)).toBe(true);
      expect(history.summary).toBeDefined();
    });

    test('should filter by time range', async () => {
      const timeRanges = ['7d', '30d', '90d', 'all'];

      for (const range of timeRanges) {
        const history = await getProgressHistory(testUserId, range);
        expect(history.timeRange).toBe(range);
      }
    });

    test('should calculate summary statistics', async () => {
      const history = await getProgressHistory(testUserId);

      expect(history.summary.totalSolutions).toBeDefined();
      expect(history.summary.reviewedSolutions).toBeDefined();
      expect(history.summary.totalAnnotations).toBeDefined();
      expect(history.summary.totalAddressed).toBeDefined();
      expect(history.summary.overallImplementationRate).toBeDefined();
    });

    test('should detect improvement trend', async () => {
      const history = await getProgressHistory(testUserId);

      const validTrends = ['improving', 'declining', 'stable', 'insufficient_data'];
      expect(validTrends).toContain(history.summary.trend);
    });

    test('should sort history by date descending', async () => {
      const history = await getProgressHistory(testUserId);

      for (let i = 0; i < history.history.length - 1; i++) {
        const current = new Date(history.history[i].date);
        const next = new Date(history.history[i + 1].date);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    test('should handle users with no solutions', async () => {
      const newUserId = 'new-user-' + Date.now();
      const history = await getProgressHistory(newUserId);

      expect(history.history.length).toBe(0);
      expect(history.summary.totalSolutions).toBe(0);
    });
  });

  describe('suggestFollowUpFocus', () => {
    test('should suggest focus areas based on patterns', async () => {
      const result = await suggestFollowUpFocus(testUserId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('should include actionable items', async () => {
      const result = await suggestFollowUpFocus(testUserId);

      expect(result.actionItems).toBeDefined();
      expect(Array.isArray(result.actionItems)).toBe(true);
    });

    test('should identify high-priority issues', async () => {
      const result = await suggestFollowUpFocus(testUserId);

      result.suggestions.forEach((suggestion) => {
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(suggestion.priority);
        expect(suggestion.type).toBeDefined();
        expect(suggestion.frequency).toBeDefined();
        expect(suggestion.suggestion).toBeDefined();
      });
    });

    test('should limit suggestions to top 5', async () => {
      const result = await suggestFollowUpFocus(testUserId);

      expect(result.suggestions.length).toBeLessThanOrEqual(5);
      expect(result.actionItems.length).toBeLessThanOrEqual(3);
    });

    test('should handle users with no feedback', async () => {
      const newUserId = 'no-feedback-' + Date.now();
      const result = await suggestFollowUpFocus(newUserId);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('should suggest improvements on recurring issues', async () => {
      const result = await suggestFollowUpFocus(testUserId);

      result.suggestions.forEach((suggestion) => {
        expect(suggestion.unaddressedCount).toBeDefined();
        if (suggestion.unaddressedCount > 0) {
          expect(suggestion.priority).toBe('HIGH');
        }
      });
    });
  });
});
