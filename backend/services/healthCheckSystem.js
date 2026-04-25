import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('health-checks');

/**
 * Comprehensive Health Check System
 * 
 * Provides:
 * - Liveness probe (is app running?)
 * - Readiness probe (can app serve traffic?)
 * - Startup probe (has app finished starting?)
 * - Detailed component health
 */

class HealthCheckSystem {
  constructor() {
    this.checks = new Map();
    this.startTime = Date.now();
    this.isReady = false;
    this.isLive = true;
    
    this.registerDefaultChecks();
  }

  /**
   * Register default health checks
   */
  registerDefaultChecks() {
    // Database check
    this.registerCheck('database', async () => {
      try {
        const { getPoolStats } = await import('../config/db.js');
        const stats = getPoolStats();
        
        if (!stats) {
          return { healthy: false, message: 'Database pool not initialized' };
        }

        const utilizationPercent = (stats.total / stats.max) * 100;
        
        return {
          healthy: stats.total < stats.max,
          message: utilizationPercent > 90 
            ? 'Database connection pool near capacity'
            : 'Database connection pool healthy',
          details: {
            total: stats.total,
            idle: stats.idle,
            waiting: stats.waiting,
            max: stats.max,
            utilization: `${utilizationPercent.toFixed(2)}%`,
          },
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Database check failed: ${error.message}`,
        };
      }
    }, { critical: true, timeout: 5000 });

    // Cache check
    this.registerCheck('cache', async () => {
      try {
        const cacheManager = await import('../utils/cacheManager.js');
        const stats = await cacheManager.default.getStats();
        
        return {
          healthy: true,
          message: 'Cache system operational',
          details: stats,
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Cache check failed: ${error.message}`,
        };
      }
    }, { critical: false, timeout: 3000 });

    // Memory check
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      
      return {
        healthy: heapUsedPercent < 90,
        message: heapUsedPercent > 90 
          ? 'Memory usage critical'
          : 'Memory usage normal',
        details: {
          heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
          external: `${Math.round(usage.external / 1024 / 1024)}MB`,
          utilization: `${heapUsedPercent.toFixed(2)}%`,
        },
      };
    }, { critical: true, timeout: 1000 });

    // Disk check
    this.registerCheck('disk', async () => {
      try {
        const { execSync } = await import('child_process');
        const output = execSync('df -h .', { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        
        if (lines.length < 2) {
          return { healthy: true, message: 'Disk check skipped' };
        }

        const parts = lines[1].split(/\s+/);
        const usagePercent = parseInt(parts[4]);
        
        return {
          healthy: usagePercent < 90,
          message: usagePercent > 90 
            ? 'Disk usage critical'
            : 'Disk usage normal',
          details: {
            used: parts[2],
            available: parts[3],
            utilization: parts[4],
          },
        };
      } catch (error) {
        return {
          healthy: true,
          message: 'Disk check skipped (not available)',
        };
      }
    }, { critical: false, timeout: 2000 });

    // External services check
    this.registerCheck('external-services', async () => {
      const services = [];
      
      // Check Supabase
      if (process.env.SUPABASE_URL) {
        try {
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000),
          });
          services.push({
            name: 'Supabase',
            healthy: response.ok,
            status: response.status,
          });
        } catch (error) {
          services.push({
            name: 'Supabase',
            healthy: false,
            error: error.message,
          });
        }
      }

      const allHealthy = services.every(s => s.healthy);
      
      return {
        healthy: allHealthy,
        message: allHealthy 
          ? 'All external services reachable'
          : 'Some external services unreachable',
        details: { services },
      };
    }, { critical: false, timeout: 5000 });

    // AI Budget check (free-tier quota monitoring)
    this.registerCheck('ai-budget', async () => {
      try {
        const { getBudgetStats } = await import('../utils/rateLimitBudget.js');
        const stats = getBudgetStats();
        
        // Check if any provider is critically close to exhaustion
        const geminiUsage = stats.gemini?.daily?.used || 0;
        const geminiLimit = stats.gemini?.daily?.limit || 230;
        const geminiUtilization = (geminiUsage / geminiLimit) * 100;
        
        return {
          healthy: geminiUtilization < 95,
          message: geminiUtilization >= 95
            ? 'Gemini free-tier daily budget nearly exhausted'
            : geminiUtilization >= 80
            ? 'Gemini free-tier budget at warning level'
            : 'AI budget healthy',
          details: stats,
        };
      } catch (error) {
        return {
          healthy: true,
          message: `AI budget check skipped: ${error.message}`,
        };
      }
    }, { critical: false, timeout: 1000 });
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFn, options = {}) {
    this.checks.set(name, {
      name,
      checkFn,
      critical: options.critical !== false,
      timeout: options.timeout || 5000,
      lastCheck: null,
      lastResult: null,
    });
    
    logger.info('Health check registered', { name, critical: options.critical });
  }

  /**
   * Run a single health check
   */
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
      );

      const result = await Promise.race([
        check.checkFn(),
        timeoutPromise,
      ]);

      check.lastCheck = new Date().toISOString();
      check.lastResult = {
        ...result,
        duration: Date.now() - startTime,
        timestamp: check.lastCheck,
      };

      return check.lastResult;
    } catch (error) {
      check.lastCheck = new Date().toISOString();
      check.lastResult = {
        healthy: false,
        message: error.message,
        duration: Date.now() - startTime,
        timestamp: check.lastCheck,
      };

      return check.lastResult;
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const results = {};
    const promises = [];

    for (const [name, check] of this.checks.entries()) {
      promises.push(
        this.runCheck(name)
          .then(result => ({ name, result }))
          .catch(error => ({
            name,
            result: {
              healthy: false,
              message: error.message,
            },
          }))
      );
    }

    const checkResults = await Promise.all(promises);
    
    for (const { name, result } of checkResults) {
      results[name] = result;
    }

    return results;
  }

  /**
   * Liveness probe - is the application running?
   */
  async liveness() {
    return {
      status: this.isLive ? 'alive' : 'dead',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - can the application serve traffic?
   */
  async readiness() {
    const results = await this.runAllChecks();
    
    // Check critical components
    const criticalChecks = Array.from(this.checks.values())
      .filter(check => check.critical);
    
    const allCriticalHealthy = criticalChecks.every(check => 
      check.lastResult?.healthy !== false
    );

    this.isReady = allCriticalHealthy;

    return {
      status: this.isReady ? 'ready' : 'not-ready',
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Startup probe - has the application finished starting?
   */
  async startup() {
    const uptime = Date.now() - this.startTime;
    const minStartupTime = 5000; // 5 seconds minimum
    
    if (uptime < minStartupTime) {
      return {
        status: 'starting',
        uptime: Math.floor(uptime / 1000),
        message: 'Application still starting up',
        timestamp: new Date().toISOString(),
      };
    }

    const readiness = await this.readiness();
    
    return {
      status: readiness.status === 'ready' ? 'started' : 'starting',
      uptime: Math.floor(uptime / 1000),
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Comprehensive health report
   */
  async getHealthReport() {
    const [liveness, readiness, checks] = await Promise.all([
      this.liveness(),
      this.readiness(),
      this.runAllChecks(),
    ]);

    const criticalIssues = Object.entries(checks)
      .filter(([name, result]) => {
        const check = this.checks.get(name);
        return check.critical && !result.healthy;
      })
      .map(([name, result]) => ({
        component: name,
        message: result.message,
      }));

    return {
      status: readiness.status === 'ready' ? 'healthy' : 'unhealthy',
      liveness: liveness.status,
      readiness: readiness.status,
      uptime: liveness.uptime,
      checks,
      criticalIssues,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Mark application as not live (for graceful shutdown)
   */
  markNotLive() {
    this.isLive = false;
    logger.warn('Application marked as not live');
  }

  /**
   * Mark application as not ready (for maintenance)
   */
  markNotReady() {
    this.isReady = false;
    logger.warn('Application marked as not ready');
  }
}

// Singleton instance
let healthCheckSystem = null;

export function initializeHealthCheckSystem() {
  if (healthCheckSystem) {
    return healthCheckSystem;
  }

  healthCheckSystem = new HealthCheckSystem();
  logger.info('Health check system initialized');
  return healthCheckSystem;
}

export function getHealthCheckSystem() {
  if (!healthCheckSystem) {
    healthCheckSystem = initializeHealthCheckSystem();
  }
  return healthCheckSystem;
}

/**
 * Express middleware for health endpoints
 */
export function healthCheckMiddleware() {
  const system = getHealthCheckSystem();

  return {
    // GET /health - comprehensive health check
    health: async (req, res) => {
      try {
        const report = await system.getHealthReport();
        const statusCode = report.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(report);
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    },

    // GET /health/live - liveness probe
    liveness: async (req, res) => {
      try {
        const result = await system.liveness();
        const statusCode = result.status === 'alive' ? 200 : 503;
        res.status(statusCode).json(result);
      } catch (error) {
        res.status(503).json({
          status: 'dead',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    },

    // GET /health/ready - readiness probe
    readiness: async (req, res) => {
      try {
        const result = await system.readiness();
        const statusCode = result.status === 'ready' ? 200 : 503;
        res.status(statusCode).json(result);
      } catch (error) {
        res.status(503).json({
          status: 'not-ready',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    },

    // GET /health/startup - startup probe
    startup: async (req, res) => {
      try {
        const result = await system.startup();
        const statusCode = result.status === 'started' ? 200 : 503;
        res.status(statusCode).json(result);
      } catch (error) {
        res.status(503).json({
          status: 'starting',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };
}

export default {
  initializeHealthCheckSystem,
  getHealthCheckSystem,
  healthCheckMiddleware,
  HealthCheckSystem,
};
