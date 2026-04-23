import { createLogger } from './structuredLogger.js';

const logger = createLogger('db-optimizer');

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  constructor() {
    this.slowQueryThreshold = Number(process.env.SLOW_QUERY_THRESHOLD_MS || 1000);
    this.queries = [];
    this.maxQueriesTracked = 100;
  }

  /**
   * Track query execution
   */
  async trackQuery(queryName, queryFn, params = {}) {
    const startTime = Date.now();
    let error = null;
    let result = null;

    try {
      result = await queryFn();
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      const queryLog = {
        name: queryName,
        duration,
        timestamp: new Date().toISOString(),
        params: this.sanitizeParams(params),
        error: error ? error.message : null,
      };

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', queryLog);
      }

      // Track queries for analysis
      this.queries.push(queryLog);
      if (this.queries.length > this.maxQueriesTracked) {
        this.queries.shift();
      }
    }
  }

  /**
   * Sanitize query parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Get query statistics
   */
  getStats() {
    if (this.queries.length === 0) {
      return { message: 'No queries tracked yet' };
    }

    const durations = this.queries.map(q => q.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const slowQueries = this.queries.filter(q => q.duration > this.slowQueryThreshold);

    return {
      totalQueries: this.queries.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      slowQueriesCount: slowQueries.length,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
    };
  }

  /**
   * Clear tracked queries
   */
  clear() {
    this.queries = [];
  }
}

/**
 * Database connection pool optimizer
 */
export class PoolOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.checkInterval = null;
  }

  /**
   * Start monitoring pool health
   */
  startMonitoring(intervalMs = 60000) {
    this.checkInterval = setInterval(() => {
      this.checkPoolHealth();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check pool health and log warnings
   */
  async checkPoolHealth() {
    try {
      const stats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      };

      logger.debug('Database pool stats', stats);

      // Warn if pool is exhausted
      if (stats.waitingCount > 0) {
        logger.warn('Database pool exhausted', {
          ...stats,
          recommendation: 'Consider increasing pool size',
        });
      }

      // Warn if too many idle connections
      if (stats.idleCount > stats.totalCount * 0.8) {
        logger.warn('Too many idle database connections', {
          ...stats,
          recommendation: 'Consider reducing pool size',
        });
      }
    } catch (error) {
      logger.error('Failed to check pool health', { error: error.message });
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

/**
 * Query builder helpers for common patterns
 */
export const QueryHelpers = {
  /**
   * Build pagination query
   */
  paginate(baseQuery, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
  },

  /**
   * Build search query with full-text search
   */
  buildSearchQuery(table, searchFields, searchTerm) {
    const conditions = searchFields
      .map(field => `${field} ILIKE $1`)
      .join(' OR ');
    return `SELECT * FROM ${table} WHERE ${conditions}`;
  },

  /**
   * Build batch insert query
   */
  buildBatchInsert(table, columns, rowCount) {
    const placeholders = [];
    let paramIndex = 1;

    for (let i = 0; i < rowCount; i++) {
      const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    return `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
  },

  /**
   * Build upsert query
   */
  buildUpsert(table, columns, conflictColumn) {
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const updates = columns
      .filter(col => col !== conflictColumn)
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    return `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${conflictColumn})
      DO UPDATE SET ${updates}
      RETURNING *
    `;
  },
};

/**
 * Transaction helper with automatic retry
 */
export async function withTransaction(pool, callback, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      lastError = error;

      // Retry on serialization errors
      if (error.code === '40001' && attempt < maxRetries) {
        logger.warn(`Transaction serialization error, retrying (${attempt}/${maxRetries})`, {
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }

      throw error;
    } finally {
      client.release();
    }
  }

  throw lastError;
}

// Singleton query monitor
export const queryMonitor = new QueryMonitor();
