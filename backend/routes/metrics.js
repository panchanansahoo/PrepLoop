/**
 * Prometheus-format Metrics Endpoint
 *
 * Exposes application metrics in Prometheus text format.
 * Protected by API key authentication (not JWT).
 */

import { Router } from 'express';
import os from 'os';
import performanceMonitor from '../utils/performanceMonitor.js';
import cacheManager from '../utils/cacheManager.js';
import { getAllCircuitBreakerStatus } from '../utils/circuitBreaker.js';
import jobQueue from '../utils/simpleJobQueue.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = Router();
const logger = createLogger('metrics');

// Simple API key auth for metrics endpoint
function metricsAuth(req, res, next) {
  const rawApiKey = req.headers['x-metrics-key'];
  const apiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
  const expectedKey = process.env.METRICS_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

/**
 * GET /metrics
 * Returns Prometheus-compatible text metrics
 */
router.get('/', metricsAuth, async (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    const queueStats = jobQueue.getStats();
    let cacheStats = {};
    try { cacheStats = await cacheManager.getStats(); } catch (e) { /* noop */ }

    let cbStatuses = [];
    try { cbStatuses = getAllCircuitBreakerStatus(); } catch (e) { /* noop */ }

    const lines = [];

    // --- Process metrics ---
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(metrics.uptimeMs / 1000)}`);

    lines.push('# HELP process_memory_bytes Process memory usage');
    lines.push('# TYPE process_memory_bytes gauge');
    const mem = process.memoryUsage();
    lines.push(`process_memory_bytes{type="rss"} ${mem.rss}`);
    lines.push(`process_memory_bytes{type="heapUsed"} ${mem.heapUsed}`);
    lines.push(`process_memory_bytes{type="heapTotal"} ${mem.heapTotal}`);

    lines.push('# HELP system_cpu_count Number of CPUs');
    lines.push('# TYPE system_cpu_count gauge');
    lines.push(`system_cpu_count ${os.cpus().length}`);

    lines.push('# HELP system_memory_bytes System memory');
    lines.push('# TYPE system_memory_bytes gauge');
    lines.push(`system_memory_bytes{type="free"} ${os.freemem()}`);
    lines.push(`system_memory_bytes{type="total"} ${os.totalmem()}`);

    // --- HTTP metrics ---
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${metrics.requests.total}`);

    lines.push('# HELP http_response_time_avg_ms Average response time');
    lines.push('# TYPE http_response_time_avg_ms gauge');
    lines.push(`http_response_time_avg_ms ${metrics.requests.avgResponseMs}`);

    lines.push('# HELP http_errors_total Total HTTP errors');
    lines.push('# TYPE http_errors_total counter');
    lines.push(`http_errors_total ${metrics.errors}`);

    // --- Cache metrics ---
    lines.push('# HELP cache_operations Cache operations');
    lines.push('# TYPE cache_operations counter');
    lines.push(`cache_operations{type="hit"} ${metrics.cache.hits}`);
    lines.push(`cache_operations{type="miss"} ${metrics.cache.misses}`);
    lines.push(`cache_operations{type="set"} ${metrics.cache.sets}`);

    if (metrics.cache.hits + metrics.cache.misses > 0) {
      const hitRate = metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses);
      lines.push('# HELP cache_hit_rate Cache hit rate');
      lines.push('# TYPE cache_hit_rate gauge');
      lines.push(`cache_hit_rate ${hitRate.toFixed(4)}`);
    }

    // --- Job queue metrics ---
    lines.push('# HELP job_queue_size Current queue size');
    lines.push('# TYPE job_queue_size gauge');
    lines.push(`job_queue_size{state="pending"} ${queueStats.pending}`);
    lines.push(`job_queue_size{state="active"} ${queueStats.active}`);
    lines.push(`job_queue_size{state="dead_letter"} ${queueStats.deadLetter}`);

    lines.push('# HELP job_queue_processed_total Total processed jobs');
    lines.push('# TYPE job_queue_processed_total counter');
    lines.push(`job_queue_processed_total ${queueStats.processed}`);

    lines.push('# HELP job_queue_failed_total Total failed jobs');
    lines.push('# TYPE job_queue_failed_total counter');
    lines.push(`job_queue_failed_total ${queueStats.failed}`);

    // --- Circuit breaker metrics ---
    lines.push('# HELP circuit_breaker_state Circuit breaker state (0=closed, 1=open, 2=half_open)');
    lines.push('# TYPE circuit_breaker_state gauge');
    for (const cb of cbStatuses) {
      const stateNum = cb.state === 'CLOSED' ? 0 : cb.state === 'OPEN' ? 1 : 2;
      lines.push(`circuit_breaker_state{service="${cb.name}"} ${stateNum}`);
      lines.push(`circuit_breaker_failures{service="${cb.name}"} ${cb.failureCount}`);
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(lines.join('\n') + '\n');
  } catch (error) {
    logger.error('Failed to generate metrics', { error: error.message });
    res.status(500).send('# Error generating metrics\n');
  }
});

export default router;
