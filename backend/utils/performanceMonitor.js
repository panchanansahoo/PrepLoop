import os from 'os';
import crypto from 'crypto';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('performance-monitor');

class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled ?? (process.env.NODE_ENV !== 'test');
    this.slowApiThreshold = options.slowApiThreshold || 500; // ms
    this.slowQueryThreshold = options.slowQueryThreshold || 1000; // ms
    this.metrics = {
      requests: new Map(),
      cache: { hits: 0, misses: 0, sets: 0 },
      errors: 0
    };
    this.startTime = Date.now();
  }

  recordRequest({ id, path, method, duration, status, error }) {
    if (!this.enabled) return;
    try {
      const entry = { id: id || this._genId(), path, method, duration, status, error: !!error, timestamp: Date.now(), slow: duration >= this.slowApiThreshold };
      this.metrics.requests.set(entry.id, entry);
      // keep size bounded
      if (this.metrics.requests.size > 1000) {
        const first = this.metrics.requests.keys().next().value;
        this.metrics.requests.delete(first);
      }
      if (error) this.metrics.errors++;
    } catch (e) {
      logger.debug('recordRequest failure', { err: e.message });
    }
  }

  recordCacheEvent(type, _key) {
    if (!this.enabled) return;
    try {
      if (type === 'hit') this.metrics.cache.hits++;
      if (type === 'miss') this.metrics.cache.misses++;
      if (type === 'set') this.metrics.cache.sets++;
    } catch (e) {
      logger.debug('recordCacheEvent failure', { err: e.message });
    }
  }

  getMetrics() {
    const totalRequests = this.metrics.requests.size;
    const avgResponse = totalRequests > 0 ? Array.from(this.metrics.requests.values()).reduce((s, r) => s + (r.duration || 0), 0) / totalRequests : 0;
    return {
      uptimeMs: Date.now() - this.startTime,
      requests: { total: totalRequests, avgResponseMs: Math.round(avgResponse) },
      cache: this.metrics.cache,
      errors: this.metrics.errors,
      system: {
        cpus: os.cpus().length,
        freeMem: os.freemem(),
        totalMem: os.totalmem()
      }
    };
  }

  _genId() {
    return `pm_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
  }
}

const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.PERF_MONITOR_ENABLED !== 'false'
});

export default performanceMonitor;
export { PerformanceMonitor };
