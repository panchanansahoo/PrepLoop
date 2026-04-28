// @validate: structured
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Monitoring');

// Metrics store - in production, this would connect to Prometheus or similar
let requestMetrics = {
  totalRequests: 0,
  responseTimes: [],
  errorCount: 0,
  endpointStats: {},
  startTime: Date.now()
};

// Monitoring middleware to track request metrics
export const requestMetricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture the original res.end to calculate response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding, callback) {
    const responseTime = Date.now() - startTime;
    
    // Update metrics
    requestMetrics.totalRequests++;
    requestMetrics.responseTimes.push(responseTime);
    
    // Keep response times array manageable
    if (requestMetrics.responseTimes.length > 1000) {
      requestMetrics.responseTimes.shift();
    }
    
    // Track endpoint-specific metrics
    const endpoint = `${req.method} ${req.path}`;
    if (!requestMetrics.endpointStats[endpoint]) {
      requestMetrics.endpointStats[endpoint] = {
        count: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        errorCount: 0
      };
    }
    
    requestMetrics.endpointStats[endpoint].count++;
    requestMetrics.endpointStats[endpoint].totalResponseTime += responseTime;
    requestMetrics.endpointStats[endpoint].avgResponseTime = 
      requestMetrics.endpointStats[endpoint].totalResponseTime / 
      requestMetrics.endpointStats[endpoint].count;
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};

// Monitoring endpoint to expose metrics
export const metricsEndpoint = async (req, res) => {
  try {
    // Calculate metrics
    const uptime = Date.now() - requestMetrics.startTime;
    const avgResponseTime = requestMetrics.responseTimes.length 
      ? requestMetrics.responseTimes.reduce((a, b) => a + b, 0) / requestMetrics.responseTimes.length 
      : 0;
      
    const p95ResponseTime = requestMetrics.responseTimes.length
      ? getPercentile(requestMetrics.responseTimes.sort((a, b) => a - b), 0.95)
      : 0;
    
    const metrics = {
      // System metrics
      uptime_ms: uptime,
      timestamp: new Date().toISOString(),
      
      // Request metrics
      total_requests: requestMetrics.totalRequests,
      avg_response_time: parseFloat(avgResponseTime.toFixed(2)),
      p95_response_time: p95ResponseTime,
      active_requests: 0, // Would track this differently in a real implementation
      
      // Error metrics
      error_count: requestMetrics.errorCount,
      error_rate: requestMetrics.totalRequests 
        ? parseFloat(((requestMetrics.errorCount / requestMetrics.totalRequests) * 100).toFixed(2)) 
        : 0,
        
      // Top endpoints by request count
      top_endpoints: Object.entries(requestMetrics.endpointStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([endpoint, stats]) => ({
          endpoint,
          count: stats.count,
          avg_response_time: parseFloat(stats.avgResponseTime.toFixed(2)),
          error_count: stats.errorCount
        }))
    };

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(generatePrometheusMetrics(metrics));
  } catch (error) {
    logger.error('Metrics endpoint error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
};

// Helper function to calculate percentiles
function getPercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const index = Math.ceil(percentile * arr.length) - 1;
  return arr[Math.min(index, arr.length - 1)];
}

// Generate Prometheus-compatible metrics format
function generatePrometheusMetrics(metrics) {
  let prometheusMetrics = '';
  
  // System metrics
  prometheusMetrics += `# HELP preploop_uptime_ms Application uptime in milliseconds\n`;
  prometheusMetrics += `# TYPE preploop_uptime_ms gauge\n`;
  prometheusMetrics += `preploop_uptime_ms ${metrics.uptime_ms}\n\n`;
  
  prometheusMetrics += `# HELP preploop_total_requests Total number of requests\n`;
  prometheusMetrics += `# TYPE preploop_total_requests counter\n`;
  prometheusMetrics += `preploop_total_requests ${metrics.total_requests}\n\n`;
  
  prometheusMetrics += `# HELP preploop_avg_response_time Average response time in ms\n`;
  prometheusMetrics += `# TYPE preploop_avg_response_time gauge\n`;
  prometheusMetrics += `preploop_avg_response_time ${metrics.avg_response_time}\n\n`;
  
  prometheusMetrics += `# HELP preploop_p95_response_time 95th percentile response time in ms\n`;
  prometheusMetrics += `# TYPE preploop_p95_response_time gauge\n`;
  prometheusMetrics += `preploop_p95_response_time ${metrics.p95_response_time}\n\n`;
  
  prometheusMetrics += `# HELP preploop_error_count Total number of errors\n`;
  prometheusMetrics += `# TYPE preploop_error_count counter\n`;
  prometheusMetrics += `preploop_error_count ${metrics.error_count}\n\n`;
  
  prometheusMetrics += `# HELP preploop_error_rate Error rate as percentage\n`;
  prometheusMetrics += `# TYPE preploop_error_rate gauge\n`;
  prometheusMetrics += `preploop_error_rate ${metrics.error_rate}\n\n`;
  
  return prometheusMetrics;
}

// Error tracking middleware
export const errorTrackingMiddleware = (err, req, res, next) => {
  requestMetrics.errorCount++;
  
  // Track error in endpoint stats
  const endpoint = `${req.method} ${req.path}`;
  if (requestMetrics.endpointStats[endpoint]) {
    requestMetrics.endpointStats[endpoint].errorCount++;
  }
  
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  next(err);
};