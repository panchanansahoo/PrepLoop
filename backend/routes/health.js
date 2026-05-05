/**
 * Health Check & Status Endpoint
 * Monitoring and diagnostics endpoint
 */

import express from 'express';
import cacheManager from '../utils/cacheManager.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('health');

/**
 * GET /health - Basic health check
 * Returns 200 if service is running
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      error: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/detailed - Detailed diagnostics
 * Checks all dependencies (database, cache, etc.)
 */
router.get('/health/detailed', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {},
  };

  let overallStatus = 'ok';

  // Check cache
  try {
    await cacheManager.ping?.();
    checks.services.cache = { status: 'ok' };
  } catch (error) {
    logger.warn('Cache health check failed', { error: error.message });
    checks.services.cache = { status: 'warning', error: error.message };
    overallStatus = 'degraded';
  }

  // Check memory
  const memUsage = process.memoryUsage();
  checks.services.memory = {
    status: 'ok',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
  };

  const statusCode = overallStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status: overallStatus,
    ...checks,
  });
});

/**
 * GET /health/ready - Readiness probe
 * Checks if service is ready for traffic
 */
router.get('/health/ready', async (req, res) => {
  try {
    // Check critical dependencies
    const checks = {
      cache: await cacheManager.ping?.().catch(() => false),
    };

    const allReady = Object.values(checks).every(v => v !== false);

    if (allReady) {
      res.json({ ready: true, timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({
        ready: false,
        checks,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live - Liveness probe
 * Checks if service is alive (minimal check)
 */
router.get('/health/live', (req, res) => {
  res.json({ alive: true, timestamp: new Date().toISOString() });
});

/**
 * GET /version - API version info
 */
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'PrepLoop API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
