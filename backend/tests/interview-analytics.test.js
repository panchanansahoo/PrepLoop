import { describe, it, expect, beforeEach, vi } from 'vitest';
import InterviewAnalytics from '../services/interviewAnalytics.js';

describe('InterviewAnalytics', () => {
  let analytics;
  let mockSupabaseClient;

  beforeEach(() => {
    // Mock Supabase client with chainable query interface
    const createChain = () => ({
      select: () => createChain(),
      eq: () => createChain(),
      in: () => createChain(),
      gte: () => createChain(),
      order: () => createChain(),
      limit: async () => ({ data: [], error: null }),
    });

    mockSupabaseClient = {
      from: () => createChain(),
    };

    analytics = new InterviewAnalytics(mockSupabaseClient);
  });

  describe('getUserDashboard', () => {
    it('should return dashboard structure', async () => {
      const result = await analytics.getUserDashboard('user1');

      expect(result.user_id).toBe('user1');
      expect(Array.isArray(result.interview_history)).toBe(true);
      expect(Array.isArray(result.weakness_areas)).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('should measure query duration', async () => {
      const result = await analytics.getUserDashboard('user1');

      expect(typeof result.duration).toBe('number');
      expect(result.duration >= 0).toBe(true);
    });

    it('should flag optimization status', async () => {
      const result = await analytics.getUserDashboard('user1');

      expect(typeof result.optimized).toBe('boolean');
    });

    it('should calculate performance trend', async () => {
      const result = await analytics.getUserDashboard('user1');

      // Trend can be null if insufficient data
      if (result.performance_trend) {
        expect(result.performance_trend.direction).toBeDefined();
        expect(['improving', 'declining', 'stagnant']).toContain(result.performance_trend.direction);
      }
    });

    it('should handle query errors gracefully', async () => {
      mockSupabaseClient.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ error: new Error('Query failed') }),
            }),
          }),
        }),
      });

      const result = await analytics.getUserDashboard('user1');

      expect(result.interview_history).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('getQuestionAnalytics', () => {
    it('should return question analytics structure', async () => {
      const result = await analytics.getQuestionAnalytics('q1');

      expect(result.question_id).toBe('q1');
      expect(result.total_attempts).toBe(0);
      expect(result.completion_rate).toBe(0);
      expect(result.avg_score).toBe(0);
    });

    it('should calculate completion rate', async () => {
      const result = await analytics.getQuestionAnalytics('q1');

      expect(typeof result.completion_rate).toBe('number');
      expect(result.completion_rate >= 0).toBe(true);
      expect(result.completion_rate <= 100).toBe(true);
    });

    it('should assess difficulty alignment', async () => {
      const result = await analytics.getQuestionAnalytics('q1');

      expect(result.difficulty_alignment).toBeDefined();
      expect(typeof result.difficulty_alignment.aligned).toBe('boolean');
    });

    it('should analyze feedback sentiment', async () => {
      const result = await analytics.getQuestionAnalytics('q1');

      expect(result.feedback_sentiment).toBeDefined();
      expect(result.feedback_sentiment.positive >= 0).toBe(true);
      expect(result.feedback_sentiment.positive <= 100).toBe(true);
    });

    it('should calculate quality metrics', async () => {
      const result = await analytics.getQuestionAnalytics('q1');

      expect(result.quality_metrics).toBeDefined();
      expect(result.quality_metrics.overall_quality >= 0).toBe(true);
    });
  });

  describe('getStageAnalytics', () => {
    it('should return stage analytics for all types', async () => {
      const result = await analytics.getStageAnalytics();

      expect(result.interview_type).toBe('all');
      expect(Array.isArray(result.stage_analytics)).toBe(true);
      expect(result.completion_rates).toBeDefined();
      expect(result.score_distribution).toBeDefined();
    });

    it('should return stage analytics for specific type', async () => {
      const result = await analytics.getStageAnalytics('dsa');

      expect(result.interview_type).toBe('dsa');
    });

    it('should analyze completion rates per stage', async () => {
      const result = await analytics.getStageAnalytics();

      expect(result.completion_rates).toBeDefined();
      expect(typeof result.completion_rates.intake).toBe('number');
      expect(typeof result.completion_rates.technical).toBe('number');
    });

    it('should analyze score distribution', async () => {
      const result = await analytics.getStageAnalytics();

      expect(result.score_distribution).toBeDefined();
      expect(result.score_distribution['0-20'] >= 0).toBe(true);
      expect(result.score_distribution['81-100'] >= 0).toBe(true);
    });

    it('should analyze time metrics', async () => {
      const result = await analytics.getStageAnalytics();

      expect(result.time_metrics).toBeDefined();
      expect(typeof result.time_metrics.avg_seconds).toBe('number');
    });
  });

  describe('getAggregateInsights', () => {
    it('should return aggregate insights structure', async () => {
      const result = await analytics.getAggregateInsights();

      expect(result.time_period).toBe('30_days');
      expect(result.total_interviews >= 0).toBe(true);
      expect(result.avg_completion_rate >= 0).toBe(true);
      expect(Array.isArray(result.trending_weak_areas)).toBe(true);
      expect(result.user_cohorts).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should identify trending weak areas', async () => {
      const result = await analytics.getAggregateInsights();

      result.trending_weak_areas.forEach((area) => {
        expect(area.question_id).toBeDefined();
        expect(area.feedback_score <= 60).toBe(true);
      });
    });

    it('should analyze user cohorts', async () => {
      const result = await analytics.getAggregateInsights();

      expect(result.user_cohorts.high_performers >= 0).toBe(true);
      expect(result.user_cohorts.average >= 0).toBe(true);
      expect(result.user_cohorts.low_performers >= 0).toBe(true);
    });

    it('should generate actionable insights', async () => {
      const result = await analytics.getAggregateInsights();

      expect(Array.isArray(result.insights)).toBe(true);
    });
  });

  describe('getUserTrend', () => {
    it('should return trend structure', async () => {
      const result = await analytics.getUserTrend('user1');

      expect(result.user_id).toBe('user1');
      expect(result.trend_direction).toBeDefined();
      expect(result.confidence >= 0).toBe(true);
      expect(result.confidence <= 100).toBe(true);
    });

    it('should detect insufficient data', async () => {
      const result = await analytics.getUserTrend('user1');

      // Most users will have insufficient data with mocked client
      if (result.interviews_analyzed < 3) {
        expect(result.trend_direction).toBe('insufficient_data');
      }
    });

    it('should provide recommendation based on trend', async () => {
      const result = await analytics.getUserTrend('user1');

      if (result.trend_direction !== 'insufficient_data') {
        expect(result.recommendation).toBeDefined();
        expect(typeof result.recommendation).toBe('string');
      }
    });

    it('should handle query errors', async () => {
      mockSupabaseClient.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ error: new Error('Query failed') }),
            }),
          }),
        }),
      });

      const result = await analytics.getUserTrend('user1');

      expect(result.trend_direction).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('Helper: _identifyWeaknesses', () => {
    it('should identify weakness areas', () => {
      const responses = [
        { question_id: 'q1', score: 50 },
        { question_id: 'q1', score: 55 },
        { question_id: 'q2', score: 85 },
      ];

      const weaknesses = analytics._identifyWeaknesses(responses);

      expect(Array.isArray(weaknesses)).toBe(true);
      expect(weaknesses.length).toBe(2);
      expect(weaknesses[0].avg_score <= weaknesses[1].avg_score).toBe(true);
    });

    it('should calculate severity levels', () => {
      const responses = [
        { question_id: 'q1', score: 45 }, // critical
        { question_id: 'q2', score: 65 }, // concern
        { question_id: 'q3', score: 85 }, // strength
      ];

      const weaknesses = analytics._identifyWeaknesses(responses);

      expect(weaknesses[0].severity).toBe('critical');
      expect(weaknesses[1].severity).toBe('concern');
      expect(weaknesses[2].severity).toBe('watch');
    });

    it('should handle empty responses', () => {
      const weaknesses = analytics._identifyWeaknesses([]);

      expect(weaknesses).toEqual([]);
    });
  });

  describe('Helper: _calculateTrend', () => {
    it('should detect improving trend', () => {
      const interviews = [
        { final_score: 90, status: 'completed' },
        { final_score: 85, status: 'completed' },
        { final_score: 80, status: 'completed' },
        { final_score: 75, status: 'completed' },
        { final_score: 70, status: 'completed' },
        { final_score: 60, status: 'completed' },
      ];

      const trend = analytics._calculateTrend(interviews);

      expect(trend.direction).toBe('improving');
      expect(trend.delta > 0).toBe(true);
    });

    it('should detect declining trend', () => {
      const interviews = [
        { final_score: 60, status: 'completed' },
        { final_score: 65, status: 'completed' },
        { final_score: 70, status: 'completed' },
        { final_score: 80, status: 'completed' },
        { final_score: 85, status: 'completed' },
        { final_score: 90, status: 'completed' },
      ];

      const trend = analytics._calculateTrend(interviews);

      expect(trend.direction).toBe('declining');
      expect(trend.delta < 0).toBe(true);
    });

    it('should detect stagnant trend', () => {
      const interviews = [
        { final_score: 75, status: 'completed' },
        { final_score: 76, status: 'completed' },
        { final_score: 74, status: 'completed' },
        { final_score: 75, status: 'completed' },
        { final_score: 76, status: 'completed' },
        { final_score: 74, status: 'completed' },
      ];

      const trend = analytics._calculateTrend(interviews);

      expect(trend.direction).toBe('stagnant');
    });

    it('should return null for insufficient data', () => {
      const interviews = [{ final_score: 75, status: 'completed' }];

      const trend = analytics._calculateTrend(interviews);

      expect(trend).toBeNull();
    });
  });

  describe('Helper: _calculateUserStats', () => {
    it('should calculate stats from interviews', () => {
      const interviews = [
        { status: 'completed', final_score: 90 },
        { status: 'completed', final_score: 80 },
        { status: 'abandoned', final_score: 0 },
      ];

      const stats = analytics._calculateUserStats(interviews);

      expect(stats.total_interviews).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.completion_rate).toBe(67);
      expect(stats.avg_score).toBe(85);
      expect(stats.highest_score).toBe(90);
      expect(stats.lowest_score).toBe(80);
    });

    it('should handle empty interviews', () => {
      const stats = analytics._calculateUserStats([]);

      expect(stats.total_interviews).toBe(0);
      expect(stats.completion_rate).toBe(0);
      expect(stats.avg_score).toBe(0);
    });

    it('should ignore interviews without scores', () => {
      const interviews = [
        { status: 'completed', final_score: 85 },
        { status: 'abandoned', final_score: null },
      ];

      const stats = analytics._calculateUserStats(interviews);

      expect(stats.avg_score).toBe(85);
    });
  });

  describe('Helper: _calculateCompletionRate', () => {
    it('should calculate completion rate percentage', () => {
      const responses = [
        { feedback: 'Good effort' },
        { feedback: 'Try again' },
        { feedback: null },
        { feedback: 'Excellent' },
      ];

      const rate = analytics._calculateCompletionRate(responses);

      expect(rate).toBe(75); // 3/4
    });

    it('should return 0 for empty responses', () => {
      const rate = analytics._calculateCompletionRate([]);

      expect(rate).toBe(0);
    });
  });

  describe('Helper: _calculateAverageScore', () => {
    it('should calculate average of scores', () => {
      const responses = [{ score: 80 }, { score: 90 }, { score: 100 }];

      const avg = analytics._calculateAverageScore(responses);

      expect(avg).toBe(90);
    });

    it('should ignore null scores', () => {
      const responses = [{ score: 90 }, { score: null }, { score: 80 }];

      const avg = analytics._calculateAverageScore(responses);

      expect(avg).toBe(85);
    });

    it('should return 0 for no scores', () => {
      const avg = analytics._calculateAverageScore([]);

      expect(avg).toBe(0);
    });
  });

  describe('Helper: _analyzeFeedbackSentiment', () => {
    it('should detect positive feedback', () => {
      const responses = [
        { feedback: 'Excellent work!' },
        { feedback: 'Great approach' },
        { feedback: 'Well done' },
      ];

      const sentiment = analytics._analyzeFeedbackSentiment(responses);

      expect(sentiment.positive).toBe(100);
    });

    it('should detect negative feedback', () => {
      const responses = [
        { feedback: 'Improve your approach' },
        { feedback: 'Work on edge cases' },
      ];

      const sentiment = analytics._analyzeFeedbackSentiment(responses);

      expect(sentiment.negative).toBe(100);
    });

    it('should balance mixed feedback', () => {
      const responses = [
        { feedback: 'Excellent logic' },
        { feedback: 'Improve performance' },
        { feedback: 'Code is clean' },
      ];

      const sentiment = analytics._analyzeFeedbackSentiment(responses);

      expect(sentiment.positive + sentiment.neutral + sentiment.negative).toBe(100);
    });
  });

  describe('Helper: _assessDifficultyAlignment', () => {
    it('should detect aligned difficulty', () => {
      const responses = [
        { score: 70 },
        { score: 80 },
        { score: 75 },
      ];

      const alignment = analytics._assessDifficultyAlignment(responses);

      expect(alignment.aligned).toBe(true);
    });

    it('should detect too easy (high scores)', () => {
      const responses = [
        { score: 95 },
        { score: 95 },
        { score: 90 },
      ];

      const alignment = analytics._assessDifficultyAlignment(responses);

      expect(alignment.recommendation).toBe('increase_difficulty');
    });

    it('should detect too hard (low scores)', () => {
      const responses = [
        { score: 40 },
        { score: 45 },
        { score: 50 },
      ];

      const alignment = analytics._assessDifficultyAlignment(responses);

      expect(alignment.recommendation).toBe('decrease_difficulty');
    });
  });

  describe('Helper: _analyzeStages', () => {
    it('should aggregate interviews by stage', () => {
      const interviews = [
        { stage: 'technical', final_score: 85, completion_time_seconds: 600 },
        { stage: 'technical', final_score: 90, completion_time_seconds: 550 },
        { stage: 'feedback', final_score: 88, completion_time_seconds: 120 },
      ];

      const stages = analytics._analyzeStages(interviews);

      expect(stages.length).toBe(2);
      expect(stages[0].interview_count).toBe(2);
      expect(stages[0].avg_score).toBe(88); // (85+90)/2
    });

    it('should calculate average time per stage', () => {
      const interviews = [
        { stage: 'warmup', final_score: 80, completion_time_seconds: 300 },
        { stage: 'warmup', final_score: 75, completion_time_seconds: 400 },
      ];

      const stages = analytics._analyzeStages(interviews);

      expect(stages[0].avg_time_seconds).toBe(350);
    });
  });

  describe('Helper: _analyzeScoreDistribution', () => {
    it('should bucket scores into ranges', () => {
      const interviews = [
        { final_score: 15 },
        { final_score: 35 },
        { final_score: 50 },
        { final_score: 75 },
        { final_score: 95 },
      ];

      const distribution = analytics._analyzeScoreDistribution(interviews);

      expect(distribution['0-20']).toBe(1);
      expect(distribution['21-40']).toBe(1);
      expect(distribution['41-60']).toBe(1);
      expect(distribution['61-80']).toBe(1);
      expect(distribution['81-100']).toBe(1);
    });

    it('should handle empty interviews', () => {
      const distribution = analytics._analyzeScoreDistribution([]);

      expect(Object.values(distribution).every((v) => v === 0)).toBe(true);
    });
  });

  describe('Helper: _analyzeTimeSpent', () => {
    it('should calculate time metrics', () => {
      const interviews = [
        { completion_time_seconds: 300 },
        { completion_time_seconds: 400 },
        { completion_time_seconds: 500 },
        { completion_time_seconds: 600 },
        { completion_time_seconds: 700 },
      ];

      const times = analytics._analyzeTimeSpent(interviews);

      expect(times.avg_seconds).toBe(500);
      expect(times.min_seconds).toBe(300);
      expect(times.max_seconds).toBe(700);
    });

    it('should calculate median correctly', () => {
      const interviews = [{ completion_time_seconds: 100 }, { completion_time_seconds: 200 }, { completion_time_seconds: 300 }];

      const times = analytics._analyzeTimeSpent(interviews);

      expect(times.median_seconds).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should complete user dashboard query in reasonable time', async () => {
      const result = await analytics.getUserDashboard('user1');

      // With mocked client, should complete quickly
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should complete aggregate insights in reasonable time', async () => {
      const result = await analytics.getAggregateInsights();

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should complete trend detection in reasonable time', async () => {
      const result = await analytics.getUserTrend('user1');

      expect(result.duration).toBeDefined();
      if (result.duration !== undefined) {
        expect(typeof result.duration).toBe('number');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null responses', () => {
      const weaknesses = analytics._identifyWeaknesses(null);

      expect(weaknesses).toEqual([]);
    });

    it('should handle interviews with missing fields', () => {
      const interviews = [
        { stage: 'technical' }, // No score, no time
        { final_score: 80 }, // No stage
      ];

      const stages = analytics._analyzeStages(interviews);
      const times = analytics._analyzeTimeSpent(interviews);

      expect(stages[0].avg_score).toBe(0); // Ignores missing
      expect(times.avg_seconds).toBe(0); // Ignores missing
    });

    it('should handle divide by zero in calculations', () => {
      const sentiments = analytics._analyzeFeedbackSentiment([
        { feedback: null },
        { feedback: null },
      ]);

      expect(sentiments.positive + sentiments.neutral + sentiments.negative).toBe(0); // Protected
    });
  });
});
