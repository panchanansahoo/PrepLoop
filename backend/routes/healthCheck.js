import express from 'express';
import { supabase } from '../db/supabaseClient.js';
import redis from '../config/redis.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('health-check');

const router = express.Router();

// Enhanced health check with dependencies
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    const dbStartTime = Date.now();
    const { error: dbError } = await supabase.from('health_check').select('id').limit(1);
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Check Redis connectivity
    const redisStartTime = Date.now();
    await redis.ping();
    const redisResponseTime = Date.now() - redisStartTime;
    
    // Check external services (if applicable)
    const externalChecks = {};
    
    // Overall response time
    const totalResponseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      checks: {
        database: {
          status: dbError ? 'unhealthy' : 'healthy',
          responseTime: dbResponseTime,
          ...(dbError && { error: dbError.message })
        },
        redis: {
          status: 'healthy',
          responseTime: redisResponseTime
        },
        external: externalChecks
      }
    };

    // Log health check for monitoring
    logger.info('Health check performed', {
      responseTime: totalResponseTime,
      status: healthStatus.status
    });

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: { status: 'unknown' },
        redis: { status: 'unknown' }
      }
    });
  }
});

export default router;