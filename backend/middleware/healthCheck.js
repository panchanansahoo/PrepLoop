import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('health');

export const healthCheck = async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  // Database check
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch (err) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Groq API check (optional)
  if (process.env.GROQ_API_KEY) {
    checks.checks.groq = 'configured';
  }

  // Razorpay check (optional)
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    checks.checks.payment = 'configured';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
};

export const readinessCheck = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ ready: true });
  } catch (err) {
    logger.error('Readiness check failed', { error: err.message });
    res.status(503).json({ ready: false, error: err.message });
  }
};

export const livenessCheck = (req, res) => {
  res.status(200).json({ alive: true });
};
