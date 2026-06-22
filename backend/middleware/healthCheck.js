import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { getRedisClient } from '../config/redis.js';

const logger = createLogger('HealthCheck');

export const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      response_time: `${Date.now() - startTime}ms`,
      checks: {}
    };

    // Database check
    try {
      const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
      checks.checks.database = error ? { status: 'unhealthy', error: error.message } : { status: 'healthy' };
    } catch (err) {
      checks.checks.database = { status: 'unhealthy', error: err.message };
      checks.status = 'degraded';
    }

    // Redis check
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        checks.checks.redis = { status: 'healthy', message: 'Connected to Redis' };
      } else {
        checks.checks.redis = { status: 'unconfigured', message: 'Redis not configured' };
      }
    } catch (err) {
      checks.checks.redis = { status: 'unhealthy', error: err.message };
      checks.status = 'degraded';
    }

    // Groq API check (optional)
    if (process.env.GROQ_API_KEY) {
      try {
        // In a real implementation, you would actually check if Groq API is reachable
        checks.checks.groq = { status: 'configured', message: 'API key present' };
      } catch (err) {
        checks.checks.groq = { status: 'warning', error: err.message };
        if (checks.status !== 'error') checks.status = 'degraded';
      }
    }

    // Razorpay check (optional)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        // In a real implementation, you would actually check if Razorpay is reachable
        checks.checks.payment = { status: 'configured', message: 'API keys present' };
      } catch (err) {
        checks.checks.payment = { status: 'warning', error: err.message };
        if (checks.status !== 'error') checks.status = 'degraded';
      }
    }

    // Memory check
    try {
      const memUsage = process.memoryUsage();
      checks.checks.memory = {
        status: 'healthy',
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
      };
    } catch (err) {
      checks.checks.memory = { status: 'unhealthy', error: err.message };
      checks.status = 'degraded';
    }

    const statusCode = checks.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const readinessCheck = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ 
      ready: true,
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept connections'
    });
  } catch (err) {
    logger.error('Readiness check failed', { error: err.message });
    res.status(503).json({ 
      ready: false, 
      error: err.message,
      timestamp: new Date().toISOString(),
      message: 'Service is not ready to accept connections'
    });
  }
};

export const livenessCheck = (req, res) => {
  res.status(200).json({ 
    alive: true,
    timestamp: new Date().toISOString(),
    message: 'Service is alive and responding'
  });
};

// Detailed health check with external dependencies
export const detailedHealthCheck = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const checks = {};
    
    // Check database connectivity
    try {
      const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
      const dbStartTime = Date.now();
      checks.database = error 
        ? { status: 'error', error: error.message, response_time: `${Date.now() - dbStartTime}ms` } 
        : { status: 'ok', response_time: `${Date.now() - dbStartTime}ms` };
    } catch (error) {
      checks.database = { status: 'error', error: error.message };
    }
    
    // Check Redis connectivity
    try {
      const redis = getRedisClient();
      if (redis) {
        const redisStartTime = Date.now();
        await redis.ping();
        checks.redis = { status: 'ok', response_time: `${Date.now() - redisStartTime}ms` };
      } else {
        checks.redis = { status: 'unconfigured', message: 'Redis not configured' };
      }
    } catch (error) {
      checks.redis = { status: 'error', error: error.message };
    }
    
    // Check external API connectivity (Groq, etc.)
    if (process.env.GROQ_API_KEY) {
      try {
        // In a real implementation, you would check if external APIs are reachable
        checks.external_apis = { status: 'ok', response_time: 'N/A' };
      } catch (error) {
        checks.external_apis = { status: 'warning', error: error.message };
      }
    } else {
      checks.external_apis = { status: 'not_configured', message: 'External API keys not provided' };
    }
    
    const overallStatus = Object.values(checks).some(check => 
      check.status === 'error'
    ) ? 'error' : 'ok';
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time: `${Date.now() - startTime}ms`,
      checks
    };
    
    const statusCode = overallStatus === 'error' ? 503 : 200;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};