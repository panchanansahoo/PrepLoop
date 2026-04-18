import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('query-analyzer');

// Query statistics
const queryStats = {
  totalQueries: 0,
  slowQueries: [],
  queryPatterns: new Map(),
  nPlusOneDetected: [],
  avgQueryTime: 0,
  totalQueryTime: 0,
};

const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10);
const N_PLUS_ONE_THRESHOLD = 10; // Number of similar queries in short time
const MAX_SLOW_QUERIES_STORED = 100;

/**
 * Analyze query for potential issues
 */
function analyzeQuery(query, duration, params = []) {
  const analysis = {
    isSlow: duration > SLOW_QUERY_THRESHOLD,
    hasSelect: /SELECT/i.test(query),
    hasJoin: /JOIN/i.test(query),
    hasWhere: /WHERE/i.test(query),
    hasIndex: /USING INDEX/i.test(query),
    hasLimit: /LIMIT/i.test(query),
    hasOrderBy: /ORDER BY/i.test(query),
    isFullTableScan: /SELECT.*FROM.*(?!WHERE)/i.test(query) && !/LIMIT/i.test(query),
    paramCount: params.length,
  };

  // Generate suggestions
  const suggestions = [];

  if (analysis.isSlow) {
    suggestions.push('Query exceeds slow query threshold');
  }

  if (analysis.isFullTableScan) {
    suggestions.push('Potential full table scan detected - consider adding WHERE clause or LIMIT');
  }

  if (analysis.hasSelect && !analysis.hasLimit && !analysis.hasWhere) {
    suggestions.push('SELECT without WHERE or LIMIT - may return too many rows');
  }

  if (analysis.hasJoin && !analysis.hasIndex) {
    suggestions.push('JOIN without index hint - ensure proper indexes exist');
  }

  if (analysis.hasOrderBy && !analysis.hasIndex) {
    suggestions.push('ORDER BY without index - may cause slow sorting');
  }

  return { analysis, suggestions };
}

/**
 * Detect N+1 query problems
 */
function detectNPlusOne(query, timestamp) {
  // Normalize query (remove specific values)
  const normalizedQuery = query
    .replace(/\d+/g, '?')
    .replace(/'[^']*'/g, '?')
    .replace(/\$\d+/g, '?')
    .trim();

  const pattern = queryStats.queryPatterns.get(normalizedQuery) || {
    count: 0,
    timestamps: [],
    originalQuery: query,
  };

  pattern.count++;
  pattern.timestamps.push(timestamp);

  // Keep only recent timestamps (last 5 seconds)
  const fiveSecondsAgo = timestamp - 5000;
  pattern.timestamps = pattern.timestamps.filter(t => t > fiveSecondsAgo);

  queryStats.queryPatterns.set(normalizedQuery, pattern);

  // Check if N+1 detected
  if (pattern.timestamps.length >= N_PLUS_ONE_THRESHOLD) {
    const nPlusOne = {
      query: normalizedQuery,
      count: pattern.timestamps.length,
      timeWindow: '5s',
      detectedAt: new Date(timestamp).toISOString(),
      suggestion: 'Consider using JOIN or batch loading to avoid N+1 queries',
    };

    // Add to detected list if not already there
    const exists = queryStats.nPlusOneDetected.some(
      n => n.query === normalizedQuery && timestamp - new Date(n.detectedAt).getTime() < 60000
    );

    if (!exists) {
      queryStats.nPlusOneDetected.push(nPlusOne);
      logger.warn('N+1 query detected', nPlusOne);
    }

    return nPlusOne;
  }

  return null;
}

/**
 * Track query execution
 */
export function trackQuery(query, duration, params = [], metadata = {}) {
  const timestamp = Date.now();

  queryStats.totalQueries++;
  queryStats.totalQueryTime += duration;
  queryStats.avgQueryTime = queryStats.totalQueryTime / queryStats.totalQueries;

  // Analyze query
  const { analysis, suggestions } = analyzeQuery(query, duration, params);

  // Detect N+1
  const nPlusOne = detectNPlusOne(query, timestamp);

  // Track slow queries
  if (analysis.isSlow) {
    const slowQuery = {
      query: query.substring(0, 500), // Truncate long queries
      duration: `${duration.toFixed(2)}ms`,
      params: params.slice(0, 10), // Limit params
      timestamp: new Date(timestamp).toISOString(),
      suggestions,
      metadata,
    };

    queryStats.slowQueries.push(slowQuery);

    // Keep only recent slow queries
    if (queryStats.slowQueries.length > MAX_SLOW_QUERIES_STORED) {
      queryStats.slowQueries.shift();
    }

    logger.warn('Slow query detected', slowQuery);
  }

  return {
    duration,
    analysis,
    suggestions,
    nPlusOne,
  };
}

/**
 * Wrap database query function with tracking
 */
export function wrapQueryWithTracking(queryFn) {
  return async function(query, params = []) {
    const start = Date.now();
    let error = null;

    try {
      const result = await queryFn(query, params);
      const duration = Date.now() - start;

      trackQuery(query, duration, params, {
        rowCount: result.rowCount || result.rows?.length || 0,
        success: true,
      });

      return result;
    } catch (err) {
      error = err;
      const duration = Date.now() - start;

      trackQuery(query, duration, params, {
        success: false,
        error: err.message,
      });

      throw err;
    }
  };
}

/**
 * Get query statistics
 */
export function getQueryStats() {
  // Get top slow queries
  const topSlowQueries = [...queryStats.slowQueries]
    .sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration))
    .slice(0, 10);

  // Get most frequent query patterns
  const topPatterns = Array.from(queryStats.queryPatterns.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([query, data]) => ({
      query: query.substring(0, 200),
      count: data.count,
      recentExecutions: data.timestamps.length,
    }));

  return {
    totalQueries: queryStats.totalQueries,
    avgQueryTime: `${queryStats.avgQueryTime.toFixed(2)}ms`,
    slowQueriesCount: queryStats.slowQueries.length,
    nPlusOneDetectedCount: queryStats.nPlusOneDetected.length,
    topSlowQueries,
    topPatterns,
    nPlusOneDetected: queryStats.nPlusOneDetected.slice(-10),
  };
}

/**
 * Get query recommendations
 */
export function getQueryRecommendations() {
  const recommendations = [];

  // Analyze slow queries
  if (queryStats.slowQueries.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      issue: `${queryStats.slowQueries.length} slow queries detected`,
      recommendation: 'Review and optimize slow queries, add indexes where needed',
      affectedQueries: queryStats.slowQueries.length,
    });
  }

  // Analyze N+1 problems
  if (queryStats.nPlusOneDetected.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'n+1',
      issue: `${queryStats.nPlusOneDetected.length} N+1 query patterns detected`,
      recommendation: 'Use JOIN or batch loading instead of multiple individual queries',
      affectedQueries: queryStats.nPlusOneDetected.length,
    });
  }

  // Analyze query patterns
  const highFrequencyPatterns = Array.from(queryStats.queryPatterns.entries())
    .filter(([_, data]) => data.count > 100);

  if (highFrequencyPatterns.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'caching',
      issue: `${highFrequencyPatterns.length} high-frequency query patterns`,
      recommendation: 'Consider caching results for frequently executed queries',
      affectedQueries: highFrequencyPatterns.length,
    });
  }

  // Check average query time
  if (queryStats.avgQueryTime > 500) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      issue: `Average query time is ${queryStats.avgQueryTime.toFixed(2)}ms`,
      recommendation: 'Overall query performance needs improvement - review indexes and query patterns',
    });
  }

  return recommendations;
}

/**
 * Reset query statistics
 */
export function resetQueryStats() {
  queryStats.totalQueries = 0;
  queryStats.slowQueries = [];
  queryStats.queryPatterns.clear();
  queryStats.nPlusOneDetected = [];
  queryStats.avgQueryTime = 0;
  queryStats.totalQueryTime = 0;
  logger.info('Query statistics reset');
}

/**
 * Generate query performance report
 */
export function generateQueryReport() {
  const stats = getQueryStats();
  const recommendations = getQueryRecommendations();

  let report = '\n';
  report += '═══════════════════════════════════════════════════════\n';
  report += '           DATABASE QUERY ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════\n\n';
  report += `Total Queries: ${stats.totalQueries}\n`;
  report += `Average Query Time: ${stats.avgQueryTime}\n`;
  report += `Slow Queries: ${stats.slowQueriesCount}\n`;
  report += `N+1 Patterns Detected: ${stats.nPlusOneDetectedCount}\n\n`;

  if (stats.topSlowQueries.length > 0) {
    report += 'TOP 10 SLOW QUERIES\n';
    report += '─────────────────────────────────────────────────────\n';
    stats.topSlowQueries.forEach((q, i) => {
      report += `${i + 1}. Duration: ${q.duration}\n`;
      report += `   Query: ${q.query.substring(0, 100)}...\n`;
      report += `   Suggestions: ${q.suggestions.join(', ')}\n\n`;
    });
  }

  if (stats.nPlusOneDetected.length > 0) {
    report += 'N+1 QUERY PATTERNS\n';
    report += '─────────────────────────────────────────────────────\n';
    stats.nPlusOneDetected.forEach((n, i) => {
      report += `${i + 1}. Count: ${n.count} in ${n.timeWindow}\n`;
      report += `   Query: ${n.query.substring(0, 100)}...\n`;
      report += `   Suggestion: ${n.suggestion}\n\n`;
    });
  }

  if (recommendations.length > 0) {
    report += 'RECOMMENDATIONS\n';
    report += '─────────────────────────────────────────────────────\n';
    recommendations.forEach((r, i) => {
      report += `${i + 1}. [${r.priority.toUpperCase()}] ${r.category}\n`;
      report += `   Issue: ${r.issue}\n`;
      report += `   Recommendation: ${r.recommendation}\n\n`;
    });
  }

  report += '═══════════════════════════════════════════════════════\n';
  return report;
}

/**
 * Middleware to track all database queries
 */
export const queryAnalyzerMiddleware = () => {
  return (req, res, next) => {
    // Add query tracking to request context
    req.queryTracker = {
      queries: [],
      startTime: Date.now(),
    };

    // Override res.json to log query stats
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const totalTime = Date.now() - req.queryTracker.startTime;
      
      if (req.queryTracker.queries.length > 0) {
        res.setHeader('X-Query-Count', req.queryTracker.queries.length);
        res.setHeader('X-Query-Time', `${totalTime}ms`);
      }

      return originalJson(data);
    };

    next();
  };
};

// Cleanup old query patterns every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  let cleaned = 0;

  for (const [query, data] of queryStats.queryPatterns.entries()) {
    const recentTimestamps = data.timestamps.filter(t => t > oneHourAgo);
    if (recentTimestamps.length === 0) {
      queryStats.queryPatterns.delete(query);
      cleaned++;
    } else {
      data.timestamps = recentTimestamps;
    }
  }

  if (cleaned > 0) {
    logger.info('Query patterns cleaned', { cleaned, remaining: queryStats.queryPatterns.size });
  }
}, 3600000);

export default {
  trackQuery,
  wrapQueryWithTracking,
  getQueryStats,
  getQueryRecommendations,
  resetQueryStats,
  generateQueryReport,
  queryAnalyzerMiddleware,
};
