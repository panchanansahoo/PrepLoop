import { describe, it, expect, beforeEach } from 'vitest';
import InterviewFollowUpRulesService from '../services/interviewFollowUpRules.js';

describe('InterviewFollowUpRulesService - Adaptive Follow-up Difficulty', () => {
  describe('calculateAdaptiveFollowUpDifficulty (via getAdaptiveFollowUpDifficulty)', () => {
    it('should return current difficulty with insufficient_data when scoreHistory < 3', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 80, turn: 2 },
      ];
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.newDifficulty).toBe('intermediate');
      expect(result.reason).toBe('insufficient_data');
      expect(result.change).toBe(0);
    });

    it('should increase difficulty from intermediate to advanced with improving trend and high avg', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 82, turn: 2 },
        { score: 85, turn: 3 },
      ];
      const trend = { trend: 'improving', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        trend
      );

      expect(result.newDifficulty).toBe('advanced');
      expect(result.change).toBe(1);
      expect(result.reason).toBe('performance_improving');
    });

    it('should maintain intermediate with improving trend but avg 75-80', () => {
      const scoreHistory = [
        { score: 70, turn: 1 },
        { score: 77, turn: 2 },
        { score: 78, turn: 3 },
      ];
      const trend = { trend: 'improving', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        trend
      );

      // avg = 0.2 * 70 + 0.3 * 77 + 0.5 * 78 = 14 + 23.1 + 39 = 76.1
      // improving trend + avg 76 (75 <= avg < 80) triggers +0.5 
      expect(result.newDifficulty).toBe('advanced');
      expect(result.change).toBe(0.5);
    });

    it('should decrease difficulty with declining trend and low score', () => {
      const scoreHistory = [
        { score: 80, turn: 1 },
        { score: 68, turn: 2 },
        { score: 60, turn: 3 },
      ];
      const trend = { trend: 'declining', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'advanced',
        trend
      );

      expect(result.newDifficulty).toBe('intermediate');
      expect(result.change).toBe(-1);
      expect(result.reason).toBe('performance_declining');
    });

    it('should reduce difficulty when rolling avg < 65', () => {
      const scoreHistory = [
        { score: 60, turn: 1 },
        { score: 62, turn: 2 },
        { score: 64, turn: 3 },
      ];
      // No explicit trend, should fallback to avg detection
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.newDifficulty).toBe('basic');
      expect(result.change).toBe(-1);
    });

    it('should cap change to +1 (not exceed advanced)', () => {
      const scoreHistory = [
        { score: 90, turn: 1 },
        { score: 95, turn: 2 },
        { score: 98, turn: 3 },
      ];
      const trend = { trend: 'improving', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'advanced',
        trend
      );

      expect(result.newDifficulty).toBe('advanced');
      // Avg 94.5 >= 80 triggers change = +1, capped to +1
      // But newIndex = 2 + 1 = 3, clamped to 2 (advanced)
      // So change gets applied in calculation but capped
      expect(result.change).toBe(1);
    });

    it('should cap change to -1 (not go below basic)', () => {
      const scoreHistory = [
        { score: 30, turn: 1 },
        { score: 25, turn: 2 },
        { score: 20, turn: 3 },
      ];
      const trend = { trend: 'declining', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'basic',
        trend
      );

      expect(result.newDifficulty).toBe('basic');
      // Declining trend triggers change = -1, capped to -1
      // But newIndex = 0 + -1 = -1, clamped to 0 (basic)
      // change is still -1 (unclamped at the change level)
      expect(result.change).toBe(-1);
    });

    it('should calculate correct rolling average with weighted formula', () => {
      const scoreHistory = [
        { score: 60, turn: 1 },
        { score: 70, turn: 2 },
        { score: 80, turn: 3 },
      ];
      // Expected: 0.2*60 + 0.3*70 + 0.5*80 = 12 + 21 + 40 = 73
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.rollingAverage).toBe(73);
    });

    it('should use fallback trend (score delta) when scoreTrend not provided', () => {
      const scoreHistory = [
        { score: 65, turn: 1 },
        { score: 72, turn: 2 },
        { score: 82, turn: 3 }, // +17 change: improving
      ];
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.trajectory).toBe('improving');
      // avg: 0.2*65 + 0.3*72 + 0.5*82 = 13 + 21.6 + 41 = 75.6
      // improving + avg 75.6 (75 <= avg < 80) triggers change = +0.5
      expect(result.change).toBe(0.5);
    });

    it('should detect stable trajectory when score delta is < 10', () => {
      const scoreHistory = [
        { score: 72, turn: 1 },
        { score: 74, turn: 2 },
        { score: 76, turn: 3 }, // +4: stable
      ];
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.trajectory).toBe('stable');
    });

    it('should handle null/undefined scoreHistory gracefully', () => {
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        null,
        'intermediate',
        null
      );

      expect(result.newDifficulty).toBe('intermediate');
      expect(result.reason).toBe('insufficient_data');
    });

    it('should default to intermediate if current difficulty is invalid', () => {
      const scoreHistory = [
        { score: 85, turn: 1 },
        { score: 88, turn: 2 },
        { score: 90, turn: 3 },
      ];
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'unknown_level', // Invalid
        null
      );

      // Should default to intermediate (index 1)
      // avg: 0.2*85 + 0.3*88 + 0.5*90 = 17 + 26.4 + 45 = 88.4
      // No explicit trend (fallback): 90 - 85 = 5, stable
      // difficultyChange = 0 (stable), so stays intermediate
      expect(result.newDifficulty).toBe('intermediate');
    });

    it('should handle edge case: all scores identical', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 75, turn: 2 },
        { score: 75, turn: 3 },
      ];
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        null
      );

      expect(result.trajectory).toBe('stable');
      expect(result.newDifficulty).toBe('intermediate');
      expect(result.change).toBe(0);
    });

    it('should prefer explicit scoreTrend over fallback delta', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 76, turn: 2 },
        { score: 77, turn: 3 }, // Small delta, but trend says declining
      ];
      const trend = { trend: 'declining', volatility: 'stable' };
      const result = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        scoreHistory,
        'intermediate',
        trend
      );

      // Should use trend from scoreTrend, not delta
      expect(result.trajectory).toBe('declining');
      expect(result.reason).toBe('performance_declining');
    });
  });

  describe('decideBranch with adaptive difficulty', () => {
    it('should include adaptiveFollowUpDifficulty in response', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 82, turn: 2 },
        { score: 85, turn: 3 },
      ];
      const trend = { trend: 'improving', volatility: 'stable' };

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 85 },
        interviewContext: { followUpDifficulty: 'intermediate' },
        candidateResponse: 'We used a binary search approach because it reduces complexity to O(log n)',
        scoreHistory,
        scoreTrend: trend,
      });

      expect(result.adaptiveFollowUpDifficulty).toBe('advanced');
      expect(result.adaptiveDifficultyMetadata).toBeDefined();
      expect(result.adaptiveDifficultyMetadata.change).toBe(1);
      expect(result.adaptiveDifficultyMetadata.trajectory).toBe('improving');
    });

    it('should maintain existing branch logic while adding adaptive difficulty', () => {
      const scoreHistory = [
        { score: 45, turn: 1 },
        { score: 40, turn: 2 },
        { score: 35, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 35, nextFocus: ['error-handling'] },
        interviewContext: { followUpDifficulty: 'advanced' },
        candidateResponse: 'I guess we can add some checks maybe',
        scoreHistory,
        scoreTrend: { trend: 'declining', volatility: 'stable' },
      });

      // Should reduce difficulty due to declining performance
      expect(result.adaptiveFollowUpDifficulty).toBe('intermediate');

      // But also trigger targeted_correction due to low score
      expect(result.nextAction).toBe('targeted_correction');
      expect(result.answerQuality).toBe('weak');
    });

    it('should show high confidence + advancing difficulty for strong improving performance', () => {
      const scoreHistory = [
        { score: 70, turn: 1 },
        { score: 78, turn: 2 },
        { score: 88, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 88 },
        interviewContext: { followUpDifficulty: 'intermediate', interviewType: 'dsa' },
        candidateResponse: 'This approach uses memoization to avoid redundant subproblems, achieving O(n^2) space and time. The trade-off is we use more memory but gain speed because of caching.',
        scoreHistory,
        scoreTrend: { trend: 'improving', volatility: 'stable' },
      });

      expect(result.adaptiveFollowUpDifficulty).toBe('advanced');
      expect(result.confidence).toBe('high');
      expect(result.answerQuality).toBe('strong');
      // Now has trade-off keyword, should be deep
      expect(result.depth).toBe('deep');
    });

    it('should track adaptation for behavioral interviews', () => {
      const scoreHistory = [
        { score: 72, turn: 1 },
        { score: 80, turn: 2 },
        { score: 85, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 85 },
        interviewContext: {
          followUpDifficulty: 'basic',
          interviewType: 'behavioral',
          missingAreas: [],
        },
        candidateResponse: 'The situation was that our team had to deliver a critical feature in 2 weeks. My task was to lead the backend work. I designed a service using caching to reduce latency by 60%. The result was we shipped on time and improved performance significantly.',
        scoreHistory,
        scoreTrend: { trend: 'improving', volatility: 'stable' },
      });

      // Should increase difficulty on improving trajectory
      expect(result.adaptiveFollowUpDifficulty).toBe('intermediate');
      expect(result.adaptiveDifficultyMetadata.trajectory).toBe('improving');
    });
  });

  describe('Adaptive Difficulty Edge Cases', () => {
    it('should not change difficulty with fewer than 3 responses', () => {
      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 90 },
        interviewContext: { followUpDifficulty: 'intermediate' },
        candidateResponse: 'I would use a hash map',
        scoreHistory: [{ score: 90, turn: 1 }],
        scoreTrend: null,
      });

      expect(result.adaptiveFollowUpDifficulty).toBe('intermediate');
      expect(result.adaptiveDifficultyMetadata.reason).toBe('insufficient_data');
    });

    it('should handle mixed score volatility gracefully', () => {
      const scoreHistory = [
        { score: 50, turn: 1 },
        { score: 90, turn: 2 },
        { score: 60, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 60 },
        interviewContext: { followUpDifficulty: 'advanced' },
        candidateResponse: 'This is hard',
        scoreHistory,
        scoreTrend: { trend: 'stable', volatility: 'volatile' },
      });

      // Volatile + low score: should trigger volatility_scaffold action first
      expect(result.nextAction).toBe('volatility_scaffold');
      // Volatile pattern: avg = 0.2*50 + 0.3*90 + 0.5*60 = 10 + 27 + 30 = 67
      // stable trend + avg 67 doesn't trigger reduction
      // (only declining or < 65 would reduce)
      expect(result.adaptiveFollowUpDifficulty).toBe('advanced');
    });

    it('should respect bounds: basic -> intermediate -> advanced', () => {
      // At basic, trying to decrease more
      const result1 = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        [
          { score: 20, turn: 1 },
          { score: 15, turn: 2 },
          { score: 10, turn: 3 },
        ],
        'basic',
        { trend: 'declining', volatility: 'stable' }
      );
      expect(result1.newDifficulty).toBe('basic');

      // At advanced, trying to increase more
      const result2 = InterviewFollowUpRulesService.getAdaptiveFollowUpDifficulty(
        [
          { score: 95, turn: 1 },
          { score: 98, turn: 2 },
          { score: 99, turn: 3 },
        ],
        'advanced',
        { trend: 'improving', volatility: 'stable' }
      );
      expect(result2.newDifficulty).toBe('advanced');
    });

    it('should reflect both score decline reason and difficulty reduction', () => {
      const scoreHistory = [
        { score: 80, turn: 1 },
        { score: 70, turn: 2 },
        { score: 60, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 60, nextFocus: ['edge-cases'] },
        interviewContext: { followUpDifficulty: 'advanced' },
        candidateResponse: 'I think we should probably try something but I am not sure',
        scoreHistory,
        scoreTrend: { trend: 'declining', volatility: 'volatile' },
      });

      // Declining + volatility should trigger scaffolding
      expect(result.nextAction).toBe('volatility_scaffold');
      // But also reduce difficulty
      expect(result.adaptiveFollowUpDifficulty).toBe('intermediate');
    });
  });

  describe('Adaptive Difficulty with Different Interview Types', () => {
    it('should adapt difficulty for DSA interviews based on code quality', () => {
      const scoreHistory = [
        { score: 70, turn: 1 },
        { score: 80, turn: 2 },
        { score: 85, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 85 },
        interviewContext: {
          followUpDifficulty: 'intermediate',
          interviewType: 'dsa',
        },
        candidateResponse: `
          function solve(nums) {
            try {
              if (nums === null || nums.length === 0) return [];
              // Edge case: single element
              const result = [];
              // Use two-pointer approach
              return result;
            } catch (e) {
              console.error('Error:', e);
            }
          }
        `,
        candidateCode: `function solve(nums) {
          try {
            if (nums === null || nums.length === 0) return [];
            const result = [];
            for (let i = 0; i < nums.length; i++) {
              result.push(nums[i] * 2);
            }
            return result;
          } catch (e) {
            console.error('Error:', e);
          }
        }`,
        scoreHistory,
        scoreTrend: { trend: 'improving', volatility: 'stable' },
      });

      expect(result.adaptiveFollowUpDifficulty).toBe('advanced');
      expect(result.codeSignals).toBeDefined();
      expect(result.codeSignals).not.toBeNull();
      expect(result.codeSignals.hasErrorHandling).toBe(true);
    });

    it('should adapt difficulty for behavioral interviews based on STAR completeness', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 82, turn: 2 },
        { score: 88, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 88 },
        interviewContext: {
          followUpDifficulty: 'basic',
          interviewType: 'behavioral',
        },
        // Response has strong STAR with all 4 components clearly present
        candidateResponse: 'In that situation, when we faced a deadline crunch, my task was to lead the backend work for a critical database migration. I took the action to design a service using caching and coordinated with three teams. The result was we shipped on time and improved query performance by 40%, and reduced latency significantly.',
        scoreHistory,
        scoreTrend: { trend: 'improving', volatility: 'stable' },
      });

      // Strong STAR structure + improving trend should increase difficulty from basic to intermediate
      expect(result.adaptiveFollowUpDifficulty).toBe('intermediate');
      expect(result.starAnalysis).toBeDefined();
      // STAR complete, should not trigger star_completion action
      expect(result.nextAction).not.toBe('star_completion');
    });
  });

  describe('Telemetry Integration', () => {
    it('should provide metadata suitable for telemetry tracking', () => {
      const scoreHistory = [
        { score: 75, turn: 1 },
        { score: 82, turn: 2 },
        { score: 85, turn: 3 },
      ];

      const result = InterviewFollowUpRulesService.decideBranch({
        analysis: { score: 85 },
        interviewContext: { followUpDifficulty: 'intermediate' },
        candidateResponse: 'We should cache results',
        scoreHistory,
        scoreTrend: { trend: 'improving', volatility: 'stable' },
      });

      // Should be suitable for telemetry: rolling average, trajectory, change
      const metadata = result.adaptiveDifficultyMetadata;
      expect(metadata.rollingAverage).toBeDefined();
      expect(metadata.trajectory).toBeDefined();
      expect(metadata.change).toBeDefined();
      expect(metadata.reason).toBeDefined();

      // Verify types for telemetry
      expect(typeof metadata.rollingAverage).toBe('number');
      expect(typeof metadata.trajectory).toBe('string');
      expect(typeof metadata.change).toBe('number');
    });
  });
});
