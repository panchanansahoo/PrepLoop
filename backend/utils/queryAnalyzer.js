/**
 * Query Performance Analyzer
 * Tracks and identifies slow database queries for optimization
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('QueryAnalyzer');

class QueryPerformanceAnalyzer {
  constructor(options = {}) {
    this.enabled = options.enabled ?? (process.env.NODE_ENV !== 'test');
    this.slowQueryThreshold = options.slowQueryThreshold || 1000; // ms
    this.queries = [];
    this.maxQueries = options.maxQueries || 1000;
  }

  /**
   * Record query execution timing
   */
  recordQuery(query) {
    if (!this.enabled) return;

    try {
      const {
        table,
        operation, // 'select', 'insert', 'update', 'delete'
        filters = [], // e.g., ['user_id', 'status', 'created_at DESC']
        durationMs,
        timestamp = Date.now(),
        slow = durationMs >= this.slowQueryThreshold,
      } = query;

      const entry = {
        id: `q_${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
        table,
        operation,
        filters,
        durationMs,
        timestamp,
        slow,
      };

      this.queries.push(entry);

      // Keep array bounded
      if (this.queries.length > this.maxQueries) {
        this.queries.shift();
      }

      // Log slow queries immediately
      if (slow) {
        logger.warn(`SLOW QUERY: ${table} ${operation}`, {
          filters,
          durationMs,
          threshold: this.slowQueryThreshold,
        });
      }
    } catch (error) {
      logger.error('Failed to record query', { error: error.message });
    }
  }

  /**
   * Get slow queries grouped by table
   */
  getSlowQueriesByTable() {
    const slowQueries = this.queries.filter(q => q.slow);
    const grouped = {};

    slowQueries.forEach(query => {
      if (!grouped[query.table]) {
        grouped[query.table] = [];
      }
      grouped[query.table].push(query);
    });

    return grouped;
  }

  /**
   * Get slow queries grouped by operation
   */
  getSlowQueriesByOperation() {
    const slowQueries = this.queries.filter(q => q.slow);
    const grouped = {};

    slowQueries.forEach(query => {
      if (!grouped[query.operation]) {
        grouped[query.operation] = [];
      }
      grouped[query.operation].push(query);
    });

    return grouped;
  }

  /**
   * Get most common slow query patterns
   */
  getMostCommonSlowPatterns(limit = 10) {
    const slowQueries = this.queries.filter(q => q.slow);
    const patterns = {};

    slowQueries.forEach(query => {
      const pattern = `${query.table}:${query.operation}:${query.filters.join(',')}`;
      if (!patterns[pattern]) {
        patterns[pattern] = {
          pattern,
          table: query.table,
          operation: query.operation,
          filters: query.filters,
          count: 0,
          avgDurationMs: 0,
          maxDurationMs: 0,
          minDurationMs: Infinity,
        };
      }

      patterns[pattern].count++;
      patterns[pattern].avgDurationMs = 
        (patterns[pattern].avgDurationMs * (patterns[pattern].count - 1) + query.durationMs) / 
        patterns[pattern].count;
      patterns[pattern].maxDurationMs = Math.max(patterns[pattern].maxDurationMs, query.durationMs);
      patterns[pattern].minDurationMs = Math.min(patterns[pattern].minDurationMs, query.durationMs);
    });

    return Object.values(patterns)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get average query duration by table
   */
  getAverageDurationByTable() {
    const byTable = {};

    this.queries.forEach(query => {
      if (!byTable[query.table]) {
        byTable[query.table] = {
          table: query.table,
          count: 0,
          totalMs: 0,
          avgMs: 0,
          maxMs: 0,
        };
      }

      byTable[query.table].count++;
      byTable[query.table].totalMs += query.durationMs;
      byTable[query.table].maxMs = Math.max(byTable[query.table].maxMs, query.durationMs);
    });

    // Calculate averages
    Object.values(byTable).forEach(stats => {
      stats.avgMs = Math.round(stats.totalMs / stats.count);
    });

    return Object.values(byTable)
      .sort((a, b) => b.avgMs - a.avgMs);
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const patterns = this.getMostCommonSlowPatterns();
    const tableStats = this.getAverageDurationByTable();

    // Recommend indexes for frequent slow queries
    patterns.slice(0, 5).forEach(pattern => {
      if (pattern.filters.length > 0 && pattern.count > 5) {
        recommendations.push({
          type: 'index',
          table: pattern.table,
          columns: pattern.filters,
          reason: `Frequent slow query: ${pattern.count} occurrences, avg ${Math.round(pattern.avgDurationMs)}ms`,
          priority: pattern.count > 20 ? 'high' : 'medium',
        });
      }
    });

    // Recommend query optimization for slow tables
    tableStats.slice(0, 5).forEach(stats => {
      if (stats.avgMs > this.slowQueryThreshold * 2) {
        recommendations.push({
          type: 'query',
          table: stats.table,
          reason: `Table has high average query time: ${stats.avgMs}ms (threshold: ${this.slowQueryThreshold}ms)`,
          priority: 'high',
        });
      }
    });

    return recommendations;
  }

  /**
   * Get detailed analytics
   */
  getAnalytics() {
    const totalQueries = this.queries.length;
    const slowQueries = this.queries.filter(q => q.slow).length;
    const avgDuration = totalQueries > 0
      ? Math.round(this.queries.reduce((sum, q) => sum + q.durationMs, 0) / totalQueries)
      : 0;

    return {
      totalQueries,
      slowQueries,
      slowQueryPercentage: totalQueries > 0 ? Math.round((slowQueries / totalQueries) * 100) : 0,
      avgDurationMs: avgDuration,
      slowQueryThreshold: this.slowQueryThreshold,
      byTable: this.getAverageDurationByTable().slice(0, 10),
      commonPatterns: this.getMostCommonSlowPatterns(5),
      recommendations: this.getOptimizationRecommendations(),
    };
  }

  /**
   * Reset analytics
   */
  reset() {
    this.queries = [];
  }
}

const analyzer = new QueryPerformanceAnalyzer({
  enabled: process.env.QUERY_ANALYZER_ENABLED !== 'false',
  slowQueryThreshold: Number(process.env.SLOW_QUERY_THRESHOLD_MS || 1000),
});

export default analyzer;
export { QueryPerformanceAnalyzer };
