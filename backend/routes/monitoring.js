import express from 'express';
import { getPoolStats } from '../config/dbPool.js';
import { getActiveConnections } from '../services/websocketService.js';
import { problemCache, companyCache, systemDesignCache } from '../utils/cache.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`
    },
    cpu: process.cpuUsage(),
    database: getPoolStats(),
    websocket: getActiveConnections(),
    cache: {
      problems: {
        size: problemCache.size(),
        maxSize: problemCache.maxSize
      },
      companies: {
        size: companyCache.size(),
        maxSize: companyCache.maxSize
      },
      systemDesign: {
        size: systemDesignCache.size(),
        maxSize: systemDesignCache.maxSize
      }
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV
    }
  };

  res.json(stats);
});

router.get('/health/detailed', authenticateToken, requireAdmin, async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Database check
  try {
    const { query } = await import('../config/dbPool.js');
    await query('SELECT 1');
    checks.checks.database = { status: 'healthy', latency: 0 };
  } catch (err) {
    checks.checks.database = { status: 'unhealthy', error: err.message };
    checks.status = 'degraded';
  }

  // Cache check
  checks.checks.cache = {
    status: 'healthy',
    problems: problemCache.size(),
    companies: companyCache.size(),
    systemDesign: systemDesignCache.size()
  };

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  checks.checks.memory = {
    status: heapUsedPercent > 90 ? 'warning' : 'healthy',
    heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
  };

  // WebSocket check
  const wsStats = getActiveConnections();
  checks.checks.websocket = {
    status: 'healthy',
    connections: wsStats.total,
    rooms: wsStats.rooms,
    users: wsStats.users
  };

  res.json(checks);
});

router.post('/cache/clear', authenticateToken, requireAdmin, (req, res) => {
  const { target = 'all' } = req.body;

  const caches = {
    problems: problemCache,
    companies: companyCache,
    systemDesign: systemDesignCache
  };

  if (target === 'all') {
    let totalCleared = 0;
    for (const cache of Object.values(caches)) {
      totalCleared += cache.size();
      cache.clear();
    }
    res.json({ message: 'All caches cleared', entriesCleared: totalCleared });
  } else if (caches[target]) {
    const cleared = caches[target].size();
    caches[target].clear();
    res.json({ message: `${target} cache cleared`, entriesCleared: cleared });
  } else {
    res.status(400).json({ error: 'Invalid cache target' });
  }
});

router.get('/metrics', authenticateToken, requireAdmin, (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    database: getPoolStats(),
    websocket: getActiveConnections(),
    cache: {
      problems: problemCache.size(),
      companies: companyCache.size(),
      systemDesign: systemDesignCache.size()
    }
  };

  // Prometheus format
  if (req.query.format === 'prometheus') {
    const lines = [
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds ${metrics.process.uptime}`,
      ``,
      `# HELP process_memory_heap_used_bytes Heap memory used`,
      `# TYPE process_memory_heap_used_bytes gauge`,
      `process_memory_heap_used_bytes ${metrics.process.memory.heapUsed}`,
      ``,
      `# HELP db_pool_total Total database connections`,
      `# TYPE db_pool_total gauge`,
      `db_pool_total ${metrics.database.total}`,
      ``,
      `# HELP db_pool_idle Idle database connections`,
      `# TYPE db_pool_idle gauge`,
      `db_pool_idle ${metrics.database.idle}`,
      ``,
      `# HELP websocket_connections Active WebSocket connections`,
      `# TYPE websocket_connections gauge`,
      `websocket_connections ${metrics.websocket.total}`,
      ``,
      `# HELP cache_size Cache entries count`,
      `# TYPE cache_size gauge`,
      `cache_size{cache="problems"} ${metrics.cache.problems}`,
      `cache_size{cache="companies"} ${metrics.cache.companies}`,
      `cache_size{cache="systemDesign"} ${metrics.cache.systemDesign}`
    ];

    res.set('Content-Type', 'text/plain');
    res.send(lines.join('\n'));
  } else {
    res.json(metrics);
  }
});

export default router;
