import express from 'express';
import { getPoolStats } from '../config/dbPoolUnified.js';
import { getCacheStats } from '../middleware/apiCache.js';
import { getSecurityStats } from '../middleware/securityEnhanced.js';
import cacheManager from '../utils/cacheManager.js';
import { createLogger } from '../utils/structuredLogger.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('monitoring');

// System metrics tracking
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
  },
  performance: {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    responseTimes: [],
  },
  errors: {
    total: 0,
    byType: new Map(),
    recent: [],
  },
};

// Track request metrics
export const trackRequest = (req, res, duration) => {
  metrics.requests.total++;
  
  if (res.statusCode >= 200 && res.statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  // Track by endpoint
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  const endpointStats = metrics.requests.byEndpoint.get(endpoint) || { count: 0, avgTime: 0 };
  endpointStats.count++;
  endpointStats.avgTime = (endpointStats.avgTime * (endpointStats.count - 1) + duration) / endpointStats.count;
  metrics.requests.byEndpoint.set(endpoint, endpointStats);

  // Track response times
  metrics.performance.responseTimes.push(duration);
  if (metrics.performance.responseTimes.length > 1000) {
    metrics.performance.responseTimes.shift();
  }

  // Calculate percentiles
  const sorted = [...metrics.performance.responseTimes].sort((a, b) => a - b);
  metrics.performance.avgResponseTime = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  metrics.performance.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
  metrics.performance.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
};

// Track errors
export const trackError = (error, context = {}) => {
  metrics.errors.total++;
  
  const errorType = error.name || 'UnknownError';
  const count = metrics.errors.byType.get(errorType) || 0;
  metrics.errors.byType.set(errorType, count + 1);

  metrics.errors.recent.push({
    type: errorType,
    message: error.message,
    timestamp: new Date().toISOString(),
    context,
  });

  if (metrics.errors.recent.length > 50) {
    metrics.errors.recent.shift();
  }

  logger.error('Error tracked', { error: error.message, context });
};

// GET /api/monitoring/health - Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {},
    };

    // Database health
    try {
      const dbStats = getPoolStats();
      health.checks.database = {
        status: dbStats ? 'healthy' : 'unavailable',
        stats: dbStats,
      };
    } catch (err) {
      health.checks.database = { status: 'unhealthy', error: err.message };
      health.status = 'degraded';
    }

    // Cache health
    try {
      const cacheStats = await cacheManager.getStats();
      health.checks.cache = {
        status: 'healthy',
        stats: cacheStats,
      };
    } catch (err) {
      health.checks.cache = { status: 'unhealthy', error: err.message };
      health.status = 'degraded';
    }

    // Memory health
    const memUsage = process.memoryUsage();
    const memHealthy = memUsage.heapUsed / memUsage.heapTotal < 0.9;
    health.checks.memory = {
      status: memHealthy ? 'healthy' : 'warning',
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    if (!memHealthy) health.status = 'degraded';

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/monitoring/metrics - Performance metrics
router.get('/metrics', authenticateToken, requireAdmin, (req, res) => {
  try {
    const topEndpoints = Array.from(metrics.requests.byEndpoint.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }));

    const errorsByType = Array.from(metrics.errors.byType.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      requests: {
        total: metrics.requests.total,
        success: metrics.requests.success,
        errors: metrics.requests.errors,
        successRate: metrics.requests.total > 0 
          ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        topEndpoints,
      },
      performance: {
        avgResponseTime: `${Math.round(metrics.performance.avgResponseTime)}ms`,
        p95ResponseTime: `${Math.round(metrics.performance.p95ResponseTime)}ms`,
        p99ResponseTime: `${Math.round(metrics.performance.p99ResponseTime)}ms`,
      },
      errors: {
        total: metrics.errors.total,
        byType: errorsByType,
        recent: metrics.errors.recent.slice(-10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Metrics retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// GET /api/monitoring/security - Security statistics
router.get('/security', authenticateToken, requireAdmin, (req, res) => {
  try {
    const securityStats = getSecurityStats();
    res.json({
      ...securityStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Security stats retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve security stats' });
  }
});

// GET /api/monitoring/cache - Cache statistics
router.get('/cache', authenticateToken, requireAdmin, (req, res) => {
  try {
    const apiCacheStats = getCacheStats();
    res.json({
      apiCache: apiCacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache stats retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve cache stats' });
  }
});

// POST /api/monitoring/reset - Reset metrics (admin only)
router.post('/reset', authenticateToken, requireAdmin, (req, res) => {
  metrics.requests = {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
  };
  metrics.performance = {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    responseTimes: [],
  };
  metrics.errors = {
    total: 0,
    byType: new Map(),
    recent: [],
  };

  logger.info('Metrics reset');
  res.json({ message: 'Metrics reset successfully' });
});

export default router;
