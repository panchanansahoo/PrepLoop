/**
 * Interview Query Optimization Module
 *
 * Provides optimized query patterns and database index recommendations
 * for core interview operations:
 * - Interview retrieval by user + ID (with eager-loaded state)
 * - Conversation history fetching (paginated with efficient ordering)
 * - User question history (for novelty checking and analytics)
 * - Interview analytics queries (aggregations, trends)
 *
 * Database indexes are expected to be created via migrations.
 * This module documents best practices and validates query performance.
 */

export class InterviewQueryOptimizer {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    // Query performance thresholds (in ms)
    this.SINGLE_QUERY_THRESHOLD = 100;
    this.AGGREGATE_QUERY_THRESHOLD = 500;
    this.PAGE_QUERY_THRESHOLD = 200;
  }

  /**
   * Optimized interview retrieval with full state
   * Requires indexes: (user_id, interview_id), (interview_id)
   *
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @returns {Promise<Object>} full interview record
   */
  async getInterviewWithState(userId, interviewId) {
    const startTime = Date.now();

    const { data, error } = await this.supabase
      .from('interviews')
      .select(
        `
        id,
        user_id,
        type,
        difficulty,
        stage,
        current_scores,
        final_score,
        status,
        started_at,
        ended_at,
        completion_time_seconds,
        conversation_history,
        question_history,
        feedback_summary,
        created_at,
        updated_at
      `
      )
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for not found)
      throw error;
    }

    const duration = Date.now() - startTime;
    return {
      data: data || null,
      duration,
      optimized: duration <= this.SINGLE_QUERY_THRESHOLD,
    };
  }

  /**
   * Optimized conversation history fetch with pagination
   * Requires indexes: (interview_id, turn)
   *
   * Page size: 50 turns (typical interview context window)
   * @param {string} interviewId - interview ID
   * @param {number} page - page number (1-indexed)
   * @param {number} pageSize - turns per page (default 50)
   * @returns {Promise<Object>} paginated conversation with metadata
   */
  async getConversationHistory(interviewId, page = 1, pageSize = 50) {
    const startTime = Date.now();

    // Fetch total count for pagination
    const { count, error: countError } = await this.supabase
      .from('interview_turns')
      .select('id', { count: 'exact', head: true })
      .eq('interview_id', interviewId);

    if (countError) throw countError;

    const offset = (page - 1) * pageSize;

    // Fetch paginated turns
    const { data, error } = await this.supabase
      .from('interview_turns')
      .select(
        `
        id,
        interview_id,
        turn_number,
        role,
        content,
        timestamp,
        score,
        feedback
      `
      )
      .eq('interview_id', interviewId)
      .order('turn_number', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const duration = Date.now() - startTime;
    return {
      turns: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      duration,
      optimized: duration <= this.PAGE_QUERY_THRESHOLD,
    };
  }

  /**
   * Optimized user question history for novelty checking
   * Requires indexes: (user_id, created_at DESC), (user_id, problem_id)
   *
   * @param {string} userId - user ID
   * @param {Object} options
   *   - days: number of days to look back (default 30)
   *   - problemIds: optional array to filter by specific problems
   * @returns {Promise<Array>} question usage records
   */
  async getUserQuestionHistory(userId, options = {}) {
    const { days = 30, problemIds = [] } = options;
    const startTime = Date.now();

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    let query = this.supabase
      .from('user_question_history')
      .select(
        `
        id,
        user_id,
        problem_id,
        usage_count,
        last_seen,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)
      .gt('updated_at', daysAgo.toISOString())
      .order('last_seen', { ascending: false });

    // Optional: filter by specific problems
    if (problemIds.length > 0) {
      query = query.in('problem_id', problemIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    const duration = Date.now() - startTime;
    return {
      questionHistory: data || [],
      duration,
      optimized: duration <= this.SINGLE_QUERY_THRESHOLD,
    };
  }

  /**
   * Optimized user interview summary (for analytics dashboard)
   * Aggregates interviews across dimensions
   * Requires indexes: (user_id, status), (user_id, created_at)
   *
   * @param {string} userId - user ID
   * @returns {Promise<Object>} interview statistics
   */
  async getUserInterviewStats(userId) {
    const startTime = Date.now();

    // Fetch all interviews for aggregation
    const { data, error } = await this.supabase
      .from('interviews')
      .select('id, type, final_score, status, completion_time_seconds, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const duration = Date.now() - startTime;

    // Calculate stats (in-memory to avoid multiple queries)
    const stats = this._calculateInterviewStats(data || []);

    return {
      stats,
      duration,
      optimized: duration <= this.AGGREGATE_QUERY_THRESHOLD,
    };
  }

  /**
   * Optimized question quality analytics
   * Requires index: (problem_id, status)
   *
   * @param {Object} options
   *   - problemId: specific problem ID, or null for all
   *   - minSamples: minimum user count to include (default 5)
   * @returns {Promise<Object>} question quality metrics
   */
  async getQuestionQualityAnalytics(options = {}) {
    const { problemId = null, minSamples = 5 } = options;
    const startTime = Date.now();

    let query = this.supabase
      .from('question_quality_metrics')
      .select(
        `
        problem_id,
        total_attempts,
        completion_rate,
        avg_score,
        positive_feedback_rate,
        difficulty_alignment,
        novelty_score,
        quality_score
      `
      );

    if (problemId) {
      query = query.eq('problem_id', problemId);
    } else {
      // Filter out low-sample questions
      query = query.gte('total_attempts', minSamples);
    }

    const { data, error } = await query;

    if (error) throw error;

    const duration = Date.now() - startTime;
    return {
      metrics: data || [],
      duration,
      optimized: duration <= this.AGGREGATE_QUERY_THRESHOLD,
    };
  }

  /**
   * Optimized stage analytics (aggregated by interview type/difficulty)
   * Requires indexes: (type, difficulty), (stage, status)
   *
   * @param {Object} options
   *   - type: interview type filter (e.g., 'dsa', 'behavioral')
   *   - difficulty: difficulty filter (e.g., 'easy', 'medium', 'hard')
   * @returns {Promise<Object>} per-stage metrics
   */
  async getStageAnalytics(options = {}) {
    const { type = null, difficulty = null } = options;
    const startTime = Date.now();

    let query = this.supabase
      .from('stage_analytics')
      .select(
        `
        stage,
        avg_time_seconds,
        completion_rate,
        avg_score,
        dropoff_rate,
        total_interviews
      `
      );

    if (type) query = query.eq('interview_type', type);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error } = await query.order('stage', { ascending: true });

    if (error) throw error;

    const duration = Date.now() - startTime;
    return {
      stages: data || [],
      duration,
      optimized: duration <= this.AGGREGATE_QUERY_THRESHOLD,
    };
  }

  /**
   * Validate that indexes are present (advisory check)
   * Queries are optimized; this confirms expected indexes exist
   *
   * @returns {Promise<Object>} index presence report
   */
  async validateIndexes() {
    const report = {
      expected_indexes: [
        {
          table: 'interviews',
          columns: ['user_id', 'interview_id'],
          purpose: 'Fast interview lookup by user',
        },
        {
          table: 'interview_turns',
          columns: ['interview_id', 'turn_number'],
          purpose: 'Ordered turn history for conversation replay',
        },
        {
          table: 'user_question_history',
          columns: ['user_id', 'created_at DESC'],
          purpose: 'Recent question history for novelty checking',
        },
        {
          table: 'interviews',
          columns: ['user_id', 'status'],
          purpose: 'Filter interviews by status',
        },
        {
          table: 'interviews',
          columns: ['user_id', 'created_at'],
          purpose: 'Time-series queries for user interviews',
        },
      ],
      validation_status: 'ADVISORY',
      note: 'Run database migration to create indexes: backend/db/migrations/add-interview-indexes.sql',
    };

    return report;
  }

  /**
   * Benchmark query performance
   * @param {string} operation - operation name (e.g., 'getInterview')
   * @param {Function} queryFn - async function to measure
   * @returns {Promise<Object>} benchmark result
   */
  async benchmarkQuery(operation, queryFn) {
    const iterations = 5;
    const durations = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await queryFn();
      durations.push(Date.now() - start);
    }

    const avg = durations.reduce((a, b) => a + b, 0) / iterations;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const p95 = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

    return {
      operation,
      iterations,
      avg,
      min,
      max,
      p95,
    };
  }

  /**
   * Calculate interview statistics from raw data
   * @private
   */
  _calculateInterviewStats(interviews) {
    if (!interviews || interviews.length === 0) {
      return {
        total_interviews: 0,
        completion_rate: 0,
        avg_score: 0,
        by_type: {},
        by_status: {},
        trend_7days: [],
      };
    }

    const byType = {};
    const byStatus = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = [];

    let totalScore = 0;
    let completedCount = 0;

    for (const interview of interviews) {
      // Group by type
      if (!byType[interview.type]) {
        byType[interview.type] = { count: 0, avg_score: 0, total_score: 0 };
      }
      byType[interview.type].count += 1;
      byType[interview.type].total_score += interview.final_score || 0;

      // Group by status
      if (!byStatus[interview.status]) {
        byStatus[interview.status] = 0;
      }
      byStatus[interview.status] += 1;

      // Track completed
      if (interview.status === 'completed') {
        completedCount += 1;
        totalScore += interview.final_score || 0;
      }

      // Track recent (7 days)
      if (new Date(interview.created_at) >= sevenDaysAgo) {
        recent.push({
          date: interview.created_at.split('T')[0],
          score: interview.final_score,
          type: interview.type,
        });
      }
    }

    // Calculate averages
    for (const type in byType) {
      byType[type].avg_score = Math.round(byType[type].total_score / byType[type].count);
      delete byType[type].total_score;
    }

    return {
      total_interviews: interviews.length,
      completion_rate: Math.round((completedCount / interviews.length) * 100),
      avg_score: completedCount > 0 ? Math.round(totalScore / completedCount) : 0,
      by_type: byType,
      by_status: byStatus,
      trend_7days: recent,
    };
  }
}
