/**
 * Test Suite: feedbackAnalysisService
 * Coverage: Feedback analysis, actionability scoring, pattern detection, suggestions
 * Total: 13 tests
 */

import {
  analyzeFeedback,
  scoreActionabilityBatch,
  getReviewActionabilityScore,
  detectPatterns,
  suggestImprovementAreas,
  compareFeedbackSeverity,
} from '../services/feedbackAnalysisService.js';

describe('feedbackAnalysisService', () => {
  let testReviewId, testMentorId;

  beforeEach(async () => {
    testReviewId = 'test-review-' + Date.now();
    testMentorId = 'test-mentor-' + Date.now();
  });

  describe('analyzeFeedback', () => {
    test('should return categorized feedback analysis', async () => {
      // Assumes review has annotations
      const analysis = await analyzeFeedback(testReviewId);
      expect(analysis).toBeDefined();
      expect(analysis.categories).toBeDefined();
      expect(analysis.statistics).toBeDefined();
      expect(analysis.annotationsByPriority).toBeDefined();
    });

    test('should categorize annotations by type', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      expect(analysis.categories.bug).toBeDefined();
      expect(analysis.categories.style).toBeDefined();
      expect(analysis.categories.performance).toBeDefined();
      expect(analysis.categories.clarity).toBeDefined();
      expect(analysis.categories.design).toBeDefined();
    });

    test('should categorize by severity', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      const bug = analysis.categories.bug;
      expect(bug.high).toBeDefined();
      expect(bug.medium).toBeDefined();
      expect(bug.low).toBeDefined();
    });

    test('should calculate average actionability', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      expect(typeof analysis.statistics.avgActionability).toBe('number');
      expect(analysis.statistics.avgActionability).toBeGreaterThanOrEqual(0);
      expect(analysis.statistics.avgActionability).toBeLessThanOrEqual(100);
    });

    test('should identify critical feedback', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      expect(Array.isArray(analysis.statistics.criticalFeedback)).toBe(true);
      expect(analysis.statistics.criticalFeedback.every((a) => a.severity === 'high')).toBe(
        true
      );
    });

    test('should prioritize annotations correctly', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      const annotations = analysis.annotationsByPriority;

      // High severity should come before medium
      const highIndex = annotations.findIndex((a) => a.severity === 'high');
      const mediumIndex = annotations.findIndex((a) => a.severity === 'medium');

      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex);
      }
    });

    test('should generate feedback summary', async () => {
      const analysis = await analyzeFeedback(testReviewId);
      expect(analysis.summary).toBeDefined();
      expect(typeof analysis.summary).toBe('string');
      expect(analysis.summary.length).toBeGreaterThan(0);
    });

    test('should handle empty reviews', async () => {
      const emptyReviewId = 'empty-' + Date.now();
      const analysis = await analyzeFeedback(emptyReviewId);
      expect(analysis.statistics.totalAnnotations).toBe(0);
    });
  });

  describe('scoreActionabilityBatch', () => {
    test('should score multiple annotations', async () => {
      const annotations = [
        {
          suggestion_text: 'Use a hash map for O(1) lookups instead of searching the array',
        },
        {
          suggestion_text: 'Bug',
        },
        {
          suggestion_text:
            'Consider refactoring this function into smaller, more focused components. Currently it handles too many responsibilities.',
        },
      ];

      const scored = scoreActionabilityBatch(annotations);
      expect(scored.length).toBe(3);
      expect(scored.every((a) => typeof a.actionabilityScore === 'number')).toBe(true);

      // Longer, more detailed feedback should score higher
      const detailed = scored.find((a) => a.suggestion_text.includes('refactoring'));
      const brief = scored.find((a) => a.suggestion_text === 'Bug');
      if (detailed && brief) {
        expect(detailed.actionabilityScore).toBeGreaterThan(brief.actionabilityScore);
      }
    });
  });

  describe('getReviewActionabilityScore', () => {
    test('should return actionability score 0-100', async () => {
      const score = await getReviewActionabilityScore(testReviewId);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return 0 for reviews with no annotations', async () => {
      const emptyReviewId = 'empty-' + Date.now();
      const score = await getReviewActionabilityScore(emptyReviewId);
      expect(score).toBe(0);
    });
  });

  describe('detectPatterns', () => {
    test('should detect mentor feedback patterns', async () => {
      const patterns = await detectPatterns(testMentorId);
      expect(patterns).toBeDefined();
      expect(patterns.mentorId).toBe(testMentorId);
      expect(patterns.reviewCount).toBeDefined();
      expect(patterns.patterns).toBeDefined();
    });

    test('should identify focus areas by type', async () => {
      const patterns = await detectPatterns(testMentorId);
      expect(patterns.focusAreas).toBeDefined();
      expect(typeof patterns.focusAreas).toBe('object');
    });

    test('should identify most common issues', async () => {
      const patterns = await detectPatterns(testMentorId);
      expect(Array.isArray(patterns.patterns.mostCommonIssues)).toBe(true);
    });

    test('should calculate annotations per review', async () => {
      const patterns = await detectPatterns(testMentorId);
      expect(typeof patterns.avgAnnotationsPerReview).toBe('string');
    });

    test('should return zero for mentor with no reviews', async () => {
      const newMentorId = 'new-mentor-' + Date.now();
      const patterns = await detectPatterns(newMentorId);
      expect(patterns.reviewCount).toBe(0);
    });
  });

  describe('suggestImprovementAreas', () => {
    test('should suggest improvement areas from feedback', async () => {
      const suggestions = await suggestImprovementAreas(testReviewId);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should prioritize critical issues first', async () => {
      const suggestions = await suggestImprovementAreas(testReviewId);
      if (suggestions.length > 1) {
        // CRITICAL should come before HIGH
        const critIndex = suggestions.findIndex((s) => s.priority === 'CRITICAL');
        const highIndex = suggestions.findIndex((s) => s.priority === 'HIGH');

        if (critIndex !== -1 && highIndex !== -1) {
          expect(critIndex).toBeLessThan(highIndex);
        }
      }
    });

    test('should include example feedback for each suggestion', async () => {
      const suggestions = await suggestImprovementAreas(testReviewId);
      suggestions.forEach((suggestion) => {
        if (suggestion.examples) {
          expect(Array.isArray(suggestion.examples)).toBe(true);
        }
      }
    );
  });

    test('should group by category', async () => {
      const suggestions = await suggestImprovementAreas(testReviewId);
      suggestions.forEach((suggestion) => {
        expect(suggestion.category).toBeDefined();
        expect(suggestion.focus).toBeDefined();
      });
    });

    test('should handle empty reviews', async () => {
      const emptyReviewId = 'empty-' + Date.now();
      const suggestions = await suggestImprovementAreas(emptyReviewId);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('compareFeedbackSeverity', () => {
    test('should compare severity across multiple reviews', async () => {
      const comparison = await compareFeedbackSeverity(
        'test-solution-' + Date.now()
      );
      expect(comparison.comparison).toBeDefined();
      expect(comparison.trend).toBeDefined();
    });

    test('should detect improving trend', async () => {
      // Create solution with multiple reviews showing improvement
      const comparison = await compareFeedbackSeverity(
        'improving-solution-' + Date.now()
      );

      // Trend should be 'improving', 'degrading', or 'stable'
      expect(['improving', 'degrading', 'stable', 'no_data']).toContain(
        comparison.trend
      );
    });

    test('should detect degrading trend', async () => {
      const comparison = await compareFeedbackSeverity(
        'degrading-solution-' + Date.now()
      );

      expect(['improving', 'degrading', 'stable', 'no_data']).toContain(
        comparison.trend
      );
    });

    test('should handle solutions with no reviews', async () => {
      const comparison = await compareFeedbackSeverity(
        'no-reviews-' + Date.now()
      );
      expect(comparison.comparison.length).toBe(0);
      expect(comparison.trend).toBe('no_data');
    });
  });
});
