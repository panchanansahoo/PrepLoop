/**
 * Database Query Optimizer
 * Provides query caching, performance monitoring, and optimization hints
 */

import advancedCache from './advancedCache.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('db-optimizer');

class DatabaseOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Execute query with caching and performance monitoring
   */
  async executeQuery(db, query, params = [], options = {}) {
    const {
      cache = false,
      cacheTTL = 300,
      cacheKey = null,
      timeout = 30000,
    } = options;

    const startTime = Date.now();
    const queryHash = this._hashQuery(query, params);

    try {
      // Try cache first
      if (cache && cacheKey) {
        const cached = await advancedCache.get(cacheKey);
        if (cached) {
          logger.debug('Query cache hit', { cacheKey });
          return cached;
        }
      }

      // Execute query with timeout
      const result = await this._executeWithTimeout(db, query, params, timeout);
      
      const duration = Date.now() - startTime;
      this._recordQueryStats(queryHash, duration, query);

      // Cache result
      if (cache && cacheKey && result.rows) {
        await advancedCache.set(cacheKey, result.rows, cacheTTL);
      }

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: query.substring(0, 200),
          duration,
          params: params.length,
        });
      }

      return result.rows || result;
    } catch (error) {
      logger.error('Query execution failed', {
        error: error.message,
        query: query.substring(0, 200),
      });
      throw error;
    }
  }

  /**
   * Batch query execution with transaction support
   */
  async executeBatch(db, queries, options = {}) {
    const { transaction = true } = options;
    const client = await db.query('BEGIN');

    try {
      const results = [];
      for (const { query, params } of queries) {
        const result = await this.executeQuery(db, query, params, { cache: false });
        results.push(result);
      }

      if (transaction) {
        await db.query('COMMIT');
      }

      return results;
    } catch (error) {
      if (transaction) {
        await db.query('ROLLBACK');
      }
      throw error;
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = [];
    for (const [hash, data] of this.queryStats.entries()) {
      stats.push({
        query: data.query.substring(0, 100),
        executions: data.count,
        avgDuration: (data.totalDuration / data.count).toFixed(2),
        maxDuration: data.maxDuration,
        minDuration: data.minDuration,
      });
    }

    return stats.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 20);
  }

  /**
   * Clear query statistics
   */
  clearStats() {
    this.queryStats.clear();
  }

  // Private methods
  async _executeWithTimeout(db, query, params, timeout) {
    return Promise.race([
      db.query(query, params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      ),
    ]);
  }

  _hashQuery(query, params) {
    return `${query}_${JSON.stringify(params)}`.substring(0, 100);
  }

  _recordQueryStats(hash, duration, query) {
    if (!this.queryStats.has(hash)) {
      this.queryStats.set(hash, {
        query,
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
      });
    }

    const stats = this.queryStats.get(hash);
    stats.count++;
    stats.totalDuration += duration;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);
  }
}

export default new DatabaseOptimizer();
