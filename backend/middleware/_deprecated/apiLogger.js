import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('api-logger');

// Request logs storage
const requestLogs = [];
const MAX_LOGS = 10000;

// Analytics data
const analytics = {
  totalRequests: 0,
  requestsByEndpoint: new Map(),
  requestsByMethod: new Map(),
  requestsByStatus: new Map(),
  requestsByUser: new Map(),
  errorsByEndpoint: new Map(),
  slowRequests: [],
  recentRequests: [],
};

/**
 * Log request details
 */
function logRequest(req, res, duration, error = null) {
  const log = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration.toFixed(2)}ms`,
    durationMs: duration,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || null,
    requestId: req.requestId || res.locals.requestId,
    query: Object.keys(req.query).length > 0 ? req.query : null,
    body: shouldLogBody(req) ? sanitizeBody(req.body) : null,
    headers: sanitizeHeaders(req.headers),
    responseSize: res.getHeader('content-length') || null,
    cached: res.getHeader('x-cache') || null,
    error: error ? {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    } : null,
  };

  // Add to logs
  requestLogs.push(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift();
  }

  // Update analytics
  updateAnalytics(log);

  // Log based on status
  if (res.statusCode >= 500) {
    logger.error('Server error', log);
  } else if (res.statusCode >= 400) {
    logger.warn('Client error', log);
  } else if (duration > 1000) {
    logger.warn('Slow request', log);
  } else {
    logger.debug('Request completed', log);
  }

  return log;
}

/**
 * Update analytics
 */
function updateAnalytics(log) {
  analytics.totalRequests++;

  // By endpoint
  const endpoint = `${log.method} ${log.path}`;
  analytics.requestsByEndpoint.set(
    endpoint,
    (analytics.requestsByEndpoint.get(endpoint) || 0) + 1
  );

  // By method
  analytics.requestsByMethod.set(
    log.method,
    (analytics.requestsByMethod.get(log.method) || 0) + 1
  );

  // By status
  const statusGroup = `${Math.floor(log.statusCode / 100)}xx`;
  analytics.requestsByStatus.set(
    statusGroup,
    (analytics.requestsByStatus.get(statusGroup) || 0) + 1
  );

  // By user
  if (log.userId) {
    analytics.requestsByUser.set(
      log.userId,
      (analytics.requestsByUser.get(log.userId) || 0) + 1
    );
  }

  // Errors by endpoint
  if (log.statusCode >= 400) {
    analytics.errorsByEndpoint.set(
      endpoint,
      (analytics.errorsByEndpoint.get(endpoint) || 0) + 1
    );
  }

  // Slow requests
  if (log.durationMs > 1000) {
    analytics.slowRequests.push(log);
    if (analytics.slowRequests.length > 100) {
      analytics.slowRequests.shift();
    }
  }

  // Recent requests
  analytics.recentRequests.push(log);
  if (analytics.recentRequests.length > 100) {
    analytics.recentRequests.shift();
  }
}

/**
 * Check if request body should be logged
 */
function shouldLogBody(req) {
  // Don't log sensitive endpoints
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/reset-password',
    '/api/payment',
  ];

  return !sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
}

/**
 * Sanitize request body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize headers
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Generate unique log ID
 */
function generateLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * API Logger Middleware
 */
export const apiLogger = (options = {}) => {
  const {
    logBody = true,
    logHeaders = false,
    slowRequestThreshold = 1000,
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();

    // Capture original methods
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    let responseBody = null;

    // Override send
    res.send = function(data) {
      responseBody = data;
      return originalSend(data);
    };

    // Override json
    res.json = function(data) {
      responseBody = data;
      return originalJson(data);
    };

    // Log on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logRequest(req, res, duration);
    });

    // Log on error
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      logRequest(req, res, duration, error);
    });

    next();
  };
};

/**
 * Get request logs
 */
export function getRequestLogs(filters = {}) {
  let logs = [...requestLogs];

  // Filter by method
  if (filters.method) {
    logs = logs.filter(log => log.method === filters.method);
  }

  // Filter by status
  if (filters.status) {
    logs = logs.filter(log => log.statusCode === parseInt(filters.status));
  }

  // Filter by user
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }

  // Filter by path
  if (filters.path) {
    logs = logs.filter(log => log.path.includes(filters.path));
  }

  // Filter by time range
  if (filters.startTime) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startTime));
  }

  if (filters.endTime) {
    logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endTime));
  }

  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit results
  const limit = parseInt(filters.limit) || 100;
  return logs.slice(0, limit);
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  // Top endpoints
  const topEndpoints = Array.from(analytics.requestsByEndpoint.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Top error endpoints
  const topErrorEndpoints = Array.from(analytics.errorsByEndpoint.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Top users
  const topUsers = Array.from(analytics.requestsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }));

  // Status distribution
  const statusDistribution = Object.fromEntries(analytics.requestsByStatus);

  // Method distribution
  const methodDistribution = Object.fromEntries(analytics.requestsByMethod);

  return {
    totalRequests: analytics.totalRequests,
    topEndpoints,
    topErrorEndpoints,
    topUsers,
    statusDistribution,
    methodDistribution,
    slowRequestsCount: analytics.slowRequests.length,
    recentRequestsCount: analytics.recentRequests.length,
  };
}

/**
 * Get slow requests
 */
export function getSlowRequests(limit = 50) {
  return analytics.slowRequests
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, limit);
}

/**
 * Get error logs
 */
export function getErrorLogs(limit = 50) {
  return requestLogs
    .filter(log => log.statusCode >= 400)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Get user activity
 */
export function getUserActivity(userId, limit = 50) {
  return requestLogs
    .filter(log => log.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Generate audit report
 */
export function generateAuditReport(startDate, endDate) {
  const logs = requestLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });

  const report = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary: {
      totalRequests: logs.length,
      uniqueUsers: new Set(logs.map(l => l.userId).filter(Boolean)).size,
      successRate: logs.filter(l => l.statusCode < 400).length / logs.length * 100,
      avgResponseTime: logs.reduce((sum, l) => sum + l.durationMs, 0) / logs.length,
    },
    byEndpoint: {},
    byUser: {},
    errors: logs.filter(l => l.statusCode >= 400),
  };

  // Group by endpoint
  for (const log of logs) {
    const endpoint = `${log.method} ${log.path}`;
    if (!report.byEndpoint[endpoint]) {
      report.byEndpoint[endpoint] = {
        count: 0,
        errors: 0,
        avgDuration: 0,
      };
    }
    report.byEndpoint[endpoint].count++;
    if (log.statusCode >= 400) {
      report.byEndpoint[endpoint].errors++;
    }
  }

  // Group by user
  for (const log of logs) {
    if (!log.userId) continue;
    if (!report.byUser[log.userId]) {
      report.byUser[log.userId] = {
        count: 0,
        errors: 0,
      };
    }
    report.byUser[log.userId].count++;
    if (log.statusCode >= 400) {
      report.byUser[log.userId].errors++;
    }
  }

  return report;
}

/**
 * Clear old logs
 */
export function clearOldLogs(olderThanHours = 24) {
  const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
  const initialLength = requestLogs.length;

  for (let i = requestLogs.length - 1; i >= 0; i--) {
    if (new Date(requestLogs[i].timestamp).getTime() < cutoffTime) {
      requestLogs.splice(i, 1);
    }
  }

  const removed = initialLength - requestLogs.length;
  logger.info('Old logs cleared', { removed, remaining: requestLogs.length });
  return removed;
}

/**
 * Reset analytics
 */
export function resetAnalytics() {
  analytics.totalRequests = 0;
  analytics.requestsByEndpoint.clear();
  analytics.requestsByMethod.clear();
  analytics.requestsByStatus.clear();
  analytics.requestsByUser.clear();
  analytics.errorsByEndpoint.clear();
  analytics.slowRequests = [];
  analytics.recentRequests = [];
  logger.info('Analytics reset');
}

// Cleanup old logs every hour
setInterval(() => {
  clearOldLogs(24);
}, 3600000);

export default {
  apiLogger,
  getRequestLogs,
  getAnalyticsSummary,
  getSlowRequests,
  getErrorLogs,
  getUserActivity,
  generateAuditReport,
  clearOldLogs,
  resetAnalytics,
};
