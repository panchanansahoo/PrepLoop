/**
 * Interview Analytics & Insights (Phase 6.3)
 *
 * Provides comprehensive analytics dashboards and actionable insights
 * for users, questions, stages, and aggregate trends.
 *
 * Dashboards:
 * - Per-user: Interview history, performance trends, weakness areas
 * - Per-question: Quality rating, user feedback, difficulty alignment
 * - Per-stage: Avg time, completion rate, score distribution
 * - Aggregate: Insights about user cohorts and trending content
 * - Trend detection: User improving/declining over time
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewAnalytics');

class InterviewAnalytics {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;

    // Performance thresholds
    this.QUERY_TIMEOUTS = {
      SINGLE_DASHBOARD: 500, // Per-user dashboard
      AGGREGATE_DASHBOARD: 500, // Aggregate insights
      TREND_ANALYSIS: 500, // Trend detection
    };

    // Trend detection thresholds
    this.TREND_THRESHOLDS = {
      IMPROVING: 10, // +10 points over baseline
      DECLINING: -10, // -10 points from baseline
      STAGNANT: 5, // Within ±5 points
      MINIMUM_INTERVIEWS: 3, // Need at least 3 for trend
    };

    // Weakness area thresholds
    this.WEAKNESS_THRESHOLDS = {
      CRITICAL: 60, // Score < 60 = critical weakness
      CONCERN: 70, // Score 60-70 = concern area
      STRENGTH: 80, // Score >= 80 = strength
    };
  }

  /**
   * User Dashboard: Interview history, performance trends, weakness areas
   * Queries: User interviews, stats, question history
   */
  async getUserDashboard(userId) {
    const startTime = performance.now();

    try {
      // Get recent interviews (last 20)
      const { data: interviews, error: interviewError } = await this.supabase
        .from('interviews')
        .select('id, type, stage, final_score, status, created_at, completion_time_seconds')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (interviewError) throw interviewError;

      // Get weakness areas (questions user struggled with)
      const { data: weakAreas, error: weakError } = await this.supabase
        .from('interview_responses')
        .select('question_id, score, feedback')
        .in('interview_id', interviews?.map((i) => i.id) || [])
        .order('score', { ascending: true })
        .limit(10);

      if (weakError && interviewError) throw weakError;

      const duration = performance.now() - startTime;
      const optimized = duration < this.QUERY_TIMEOUTS.SINGLE_DASHBOARD;

      return {
        user_id: userId,
        interview_history: interviews || [],
        weakness_areas: this._identifyWeaknesses(weakAreas || []),
        performance_trend: this._calculateTrend(interviews || []),
        stats: this._calculateUserStats(interviews || []),
        duration,
        optimized,
      };
    } catch (error) {
      logger.error('User dashboard query error', { error: error.message, userId });
      return {
        user_id: userId,
        interview_history: [],
        weakness_areas: [],
        performance_trend: null,
        stats: null,
        error: error.message,
      };
    }
  }

  /**
   * Question Analytics: Quality rating, user feedback, difficulty alignment
   * Queries: Question usage, completion rate, feedback distribution
   */
  async getQuestionAnalytics(questionId) {
    const startTime = performance.now();

    try {
      // Get question responses and feedback
      const { data: responses, error: responseError } = await this.supabase
        .from('interview_responses')
        .select('id, user_id, score, feedback, created_at')
        .eq('question_id', questionId);

      if (responseError) throw responseError;

      const duration = performance.now() - startTime;
      const optimized = duration < this.QUERY_TIMEOUTS.SINGLE_DASHBOARD;

      return {
        question_id: questionId,
        total_attempts: responses?.length || 0,
        completion_rate: this._calculateCompletionRate(responses || []),
        avg_score: this._calculateAverageScore(responses || []),
        feedback_sentiment: this._analyzeFeedbackSentiment(responses || []),
        difficulty_alignment: this._assessDifficultyAlignment(responses || []),
        quality_metrics: this._calculateQualityMetrics(responses || []),
        duration,
        optimized,
      };
    } catch (error) {
      logger.error('Question analytics query error', { error: error.message, questionId });
      return {
        question_id: questionId,
        total_attempts: 0,
        completion_rate: 0,
        avg_score: 0,
        error: error.message,
      };
    }
  }

  /**
   * Stage Analytics: Avg time per stage, completion rate, score distribution
   * Queries: Interview stage tracking, time spent per stage
   */
  async getStageAnalytics(interviewType = null) {
    const startTime = performance.now();

    try {
      // Get interviews with stage tracking
      let query = this.supabase
        .from('interviews')
        .select('id, stage, final_score, status, completion_time_seconds, created_at');

      if (interviewType) {
        query = query.eq('type', interviewType);
      }

      const { data: interviews, error: interviewError } = await query.order('created_at', {
        ascending: false,
      });

      if (interviewError) throw interviewError;

      const duration = performance.now() - startTime;
      const optimized = duration < this.QUERY_TIMEOUTS.SINGLE_DASHBOARD;

      return {
        interview_type: interviewType || 'all',
        stage_analytics: this._analyzeStages(interviews || []),
        completion_rates: this._calculateStageCompletion(interviews || []),
        score_distribution: this._analyzeScoreDistribution(interviews || []),
        time_metrics: this._analyzeTimeSpent(interviews || []),
        duration,
        optimized,
      };
    } catch (error) {
      logger.error('Stage analytics query error', { error: error.message, interviewType });
      return {
        interview_type: interviewType,
        stage_analytics: [],
        error: error.message,
      };
    }
  }

  /**
   * Aggregate Insights: Trending topics, common weaknesses, user cohorts
   * Queries: Aggregate stats across users, trending patterns
   */
  async getAggregateInsights() {
    const startTime = performance.now();

    try {
      // Get recent interviews for trending analysis
      const { data: recentInterviews, error: interviewError } = await this.supabase
        .from('interviews')
        .select('id, type, final_score, status, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (interviewError) throw interviewError;

      // Get question difficulties to identify trending hard topics
      const { data: questionStats, error: questionError } = await this.supabase
        .from('questions_viewed')
        .select('question_id, difficulty, feedback_score')
        .order('feedback_score', { ascending: true })
        .limit(50);

      if (questionError && interviewError) throw questionError;

      const duration = performance.now() - startTime;
      const optimized = duration < this.QUERY_TIMEOUTS.AGGREGATE_DASHBOARD;

      return {
        time_period: '30_days',
        total_interviews: recentInterviews?.length || 0,
        avg_completion_rate: this._calculateAggregateCompletion(recentInterviews || []),
        avg_score: this._calculateAggregateScore(recentInterviews || []),
        trending_weak_areas: this._identifyTrendingWeaknesses(questionStats || []),
        user_cohorts: this._analyzeUserCohorts(recentInterviews || []),
        insights: this._generateInsights(recentInterviews || [], questionStats || []),
        duration,
        optimized,
      };
    } catch (error) {
      logger.error('Aggregate insights query error', { error: error.message });
      return {
        time_period: '30_days',
        insights: [],
        error: error.message,
      };
    }
  }

  /**
   * Trend Detection: Is user improving or declining over time?
   * Returns: trend_direction (improving/stagnant/declining), confidence score
   */
  async getUserTrend(userId) {
    const startTime = performance.now();

    try {
      // Get last 10 completed interviews
      const { data: interviews, error: interviewError } = await this.supabase
        .from('interviews')
        .select('id, final_score, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (interviewError) throw interviewError;

      if (!interviews || interviews.length < this.TREND_THRESHOLDS.MINIMUM_INTERVIEWS) {
        const duration = performance.now() - startTime;
        return {
          user_id: userId,
          trend_direction: 'insufficient_data',
          confidence: 0,
          interviews_analyzed: interviews?.length || 0,
          message: `Need at least ${this.TREND_THRESHOLDS.MINIMUM_INTERVIEWS} completed interviews`,
          duration,
        };
      }

      const trend = this._analyzeTrend(interviews);
      const duration = performance.now() - startTime;

      return {
        user_id: userId,
        trend_direction: trend.direction,
        confidence: trend.confidence,
        interviews_analyzed: interviews.length,
        score_delta: trend.delta,
        recommendation: trend.recommendation,
        duration,
      };
    } catch (error) {
      logger.error('Trend detection error', { error: error.message, userId });
      return {
        user_id: userId,
        trend_direction: 'error',
        confidence: 0,
        error: error.message,
      };
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  _identifyWeaknesses(responses) {
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return [];
    }

    const grouped = {};

    responses.forEach((r) => {
      if (!r.question_id) return;
      if (!grouped[r.question_id]) {
        grouped[r.question_id] = { scores: [] };
      }
      grouped[r.question_id].scores.push(r.score || 0);
    });

    const weaknesses = Object.entries(grouped)
      .map(([qId, data]) => ({
        question_id: qId,
        avg_score: Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length),
        attempts: data.scores.length,
        severity: this._getSeverity(data.scores.reduce((a, b) => a + b) / data.scores.length),
      }))
      .sort((a, b) => a.avg_score - b.avg_score);

    return weaknesses;
  }

  _calculateTrend(interviews) {
    if (!interviews || interviews.length < 2) {
      return null;
    }

    const recentScores = interviews.slice(0, 5).map((i) => i.final_score || 0);
    const olderScores = interviews.slice(5, 10).map((i) => i.final_score || 0);

    if (recentScores.length === 0 || olderScores.length === 0) {
      return null;
    }

    const recentAvg = recentScores.reduce((a, b) => a + b) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b) / olderScores.length;
    const delta = recentAvg - olderAvg;

    let direction;
    if (Math.abs(delta) <= this.TREND_THRESHOLDS.STAGNANT) {
      direction = 'stagnant';
    } else if (delta > this.TREND_THRESHOLDS.STAGNANT) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return {
      direction,
      recent_avg: Math.round(recentAvg),
      older_avg: Math.round(olderAvg),
      delta: Math.round(delta),
    };
  }

  _calculateUserStats(interviews) {
    if (!interviews || interviews.length === 0) {
      return {
        total_interviews: 0,
        completed: 0,
        completion_rate: 0,
        avg_score: 0,
        highest_score: 0,
        lowest_score: 0,
      };
    }

    const completed = interviews.filter((i) => i.status === 'completed').length;
    const scores = interviews.filter((i) => i.final_score).map((i) => i.final_score);

    return {
      total_interviews: interviews.length,
      completed,
      completion_rate: Math.round((completed / interviews.length) * 100),
      avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
    };
  }

  _calculateCompletionRate(responses) {
    if (!responses || responses.length === 0) return 0;

    const completed = responses.filter((r) => r.feedback).length;
    return Math.round((completed / responses.length) * 100);
  }

  _calculateAverageScore(responses) {
    if (!responses || responses.length === 0) return 0;

    const scores = responses.filter((r) => r.score).map((r) => r.score);
    if (scores.length === 0) return 0;

    return Math.round(scores.reduce((a, b) => a + b) / scores.length);
  }

  _analyzeFeedbackSentiment(responses) {
    if (!responses || responses.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    let positive = 0,
      neutral = 0,
      negative = 0;

    responses.forEach((r) => {
      if (!r.feedback) return;

      const feedback = r.feedback.toLowerCase();
      if (feedback.includes('excellent') || feedback.includes('great') || feedback.includes('well')) {
        positive++;
      } else if (feedback.includes('improve') || feedback.includes('work on')) {
        negative++;
      } else {
        neutral++;
      }
    });

    const total = positive + neutral + negative;
    if (total === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    const pos = Math.round((positive / total) * 100);
    const neu = Math.round((neutral / total) * 100);
    const neg = 100 - pos - neu; // Ensure they sum to 100

    return {
      positive: pos,
      neutral: neu,
      negative: neg,
    };
  }

  _assessDifficultyAlignment(responses) {
    // Check if question difficulty matches user performance
    if (!responses || responses.length === 0) {
      return { aligned: true, difficulty_gap: 0 };
    }

    const avgScore = this._calculateAverageScore(responses);

    // Expected score by difficulty would be ~75 for medium
    const difficultyGap = Math.abs(avgScore - 75);

    return {
      aligned: difficultyGap < 15,
      difficulty_gap: difficultyGap,
      recommendation: avgScore > 85 ? 'increase_difficulty' : avgScore < 60 ? 'decrease_difficulty' : 'keep_current',
    };
  }

  _calculateQualityMetrics(responses) {
    const completion = this._calculateCompletionRate(responses);
    const avgScore = this._calculateAverageScore(responses);
    const sentiment = this._analyzeFeedbackSentiment(responses);

    return {
      overall_quality: Math.round((completion * 0.3 + avgScore * 0.4 + sentiment.positive * 0.3) / 100),
      completion_rate: completion,
      avg_score: avgScore,
      positive_feedback_pct: sentiment.positive,
    };
  }

  _analyzeStages(interviews) {
    const stageData = {};

    interviews.forEach((i) => {
      if (!stageData[i.stage]) {
        stageData[i.stage] = { count: 0, scores: [], times: [] };
      }
      stageData[i.stage].count++;
      if (i.final_score) stageData[i.stage].scores.push(i.final_score);
      if (i.completion_time_seconds) stageData[i.stage].times.push(i.completion_time_seconds);
    });

    return Object.entries(stageData).map(([stage, data]) => ({
      stage,
      interview_count: data.count,
      avg_score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length) : 0,
      avg_time_seconds: data.times.length > 0 ? Math.round(data.times.reduce((a, b) => a + b) / data.times.length) : 0,
    }));
  }

  _calculateStageCompletion(interviews) {
    const stages = ['intake', 'warmup', 'technical', 'followup', 'challenge', 'feedback'];
    const completion = {};

    stages.forEach((stage) => {
      const stageInterviews = interviews.filter((i) => i.stage === stage);
      const completed = stageInterviews.filter((i) => i.status === 'completed').length;

      completion[stage] = stageInterviews.length > 0 ? Math.round((completed / stageInterviews.length) * 100) : 0;
    });

    return completion;
  }

  _analyzeScoreDistribution(interviews) {
    const scores = interviews && interviews.filter((i) => i.final_score).map((i) => i.final_score);

    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    if (!scores || scores.length === 0) {
      return ranges;
    }

    scores.forEach((s) => {
      if (s <= 20) ranges['0-20']++;
      else if (s <= 40) ranges['21-40']++;
      else if (s <= 60) ranges['41-60']++;
      else if (s <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    });

    return ranges;
  }

  _analyzeTimeSpent(interviews) {
    const times = interviews.filter((i) => i.completion_time_seconds).map((i) => i.completion_time_seconds);

    if (times.length === 0) {
      return { avg_seconds: 0, median_seconds: 0 };
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const sorted = times.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      avg_seconds: Math.round(avg),
      median_seconds: Math.round(median),
      min_seconds: Math.round(Math.min(...times)),
      max_seconds: Math.round(Math.max(...times)),
    };
  }

  _calculateAggregateCompletion(interviews) {
    if (!interviews || interviews.length === 0) return 0;

    const completed = interviews.filter((i) => i.status === 'completed').length;
    return Math.round((completed / interviews.length) * 100);
  }

  _calculateAggregateScore(interviews) {
    const scores = interviews.filter((i) => i.final_score).map((i) => i.final_score);
    if (scores.length === 0) return 0;

    return Math.round(scores.reduce((a, b) => a + b) / scores.length);
  }

  _identifyTrendingWeaknesses(questionStats) {
    return questionStats
      .filter((q) => q.feedback_score < 60)
      .slice(0, 5)
      .map((q) => ({
        question_id: q.question_id,
        difficulty: q.difficulty,
        feedback_score: q.feedback_score,
        recommendation: 'provide_additional_resources',
      }));
  }

  _analyzeUserCohorts(interviews) {
    // Segment users by performance tier
    const scores = interviews.map((i) => i.final_score).filter((s) => s);
    if (scores.length === 0) {
      return { high_performers: 0, average: 0, low_performers: 0 };
    }

    const avg = scores.reduce((a, b) => a + b) / scores.length;

    return {
      high_performers: scores.filter((s) => s >= avg + 10).length,
      average: scores.filter((s) => s >= avg - 10 && s < avg + 10).length,
      low_performers: scores.filter((s) => s < avg - 10).length,
    };
  }

  _generateInsights(interviews, questionStats) {
    const insights = [];

    const completionRate = this._calculateAggregateCompletion(interviews);
    if (completionRate < 50) {
      insights.push('Low completion rate detected. Consider making interviews shorter or easier.');
    }

    const avgScore = this._calculateAggregateScore(interviews);
    if (avgScore > 85) {
      insights.push('Interviews are too easy. Consider increasing difficulty.');
    } else if (avgScore < 60) {
      insights.push('Interviews are too hard. Consider providing more guidance or reducing difficulty.');
    }

    return insights;
  }

  _getSeverity(score) {
    if (score < this.WEAKNESS_THRESHOLDS.CRITICAL) return 'critical';
    if (score < this.WEAKNESS_THRESHOLDS.CONCERN) return 'concern';
    return 'watch';
  }

  _analyzeTrend(interviews) {
    const recent = interviews.slice(0, 5).map((i) => i.final_score);
    const older = interviews.slice(5, 10).map((i) => i.final_score);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b) / older.length : recentAvg;

    const delta = recentAvg - olderAvg;
    let direction, confidence, recommendation;

    if (Math.abs(delta) <= this.TREND_THRESHOLDS.STAGNANT) {
      direction = 'stagnant';
      confidence = 50;
      recommendation = 'Try practicing different problem types or difficulty levels.';
    } else if (delta >= this.TREND_THRESHOLDS.IMPROVING) {
      direction = 'improving';
      confidence = Math.min(100, 50 + delta * 3); // Confidence increases with positive delta
      recommendation = 'Maintain your current practice strategy - it\'s working!';
    } else if (delta <= this.TREND_THRESHOLDS.DECLINING) {
      direction = 'declining';
      confidence = Math.min(100, 50 + Math.abs(delta) * 3);
      recommendation = 'Consider changing your approach. Focus on your weak areas.';
    } else {
      direction = 'stagnant';
      confidence = 50;
      recommendation = 'Try practicing different problem types or difficulty levels.';
    }

    return {
      direction,
      confidence: Math.round(confidence),
      delta: Math.round(delta),
      recommendation,
    };
  }
}

export default InterviewAnalytics;
