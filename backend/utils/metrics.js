class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0 },
      responseTime: [],
      activeConnections: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  recordRequest(success = true) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }
  }

  recordResponseTime(ms) {
    this.metrics.responseTime.push(ms);
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  recordCacheHit(hit = true) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;

    return {
      ...this.metrics,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: this.metrics.requests.total > 0
        ? (this.metrics.requests.errors / this.metrics.requests.total * 100).toFixed(2)
        : 0,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2)
        : 0,
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0 },
      responseTime: [],
      activeConnections: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

export const metrics = new MetricsCollector();

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordRequest(res.statusCode < 400);
    metrics.recordResponseTime(duration);
  });
  
  next();
};
