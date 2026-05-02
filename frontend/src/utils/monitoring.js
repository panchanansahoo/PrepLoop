/**
 * Frontend logging and monitoring utilities
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.level = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 100;
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
      this.addLog('DEBUG', message, data);
    }
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, data);
      this.addLog('INFO', message, data);
    }
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data);
      this.addLog('WARN', message, data);
    }
  }

  /**
   * Log error message
   */
  error(message, error = null, data = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, error, data);
      this.addLog('ERROR', message, { ...data, error: error?.message, stack: error?.stack });
      
      // Send to error tracking service
      this.sendToErrorTracking(message, error, data);
    }
  }

  /**
   * Add log to internal buffer
   */
  addLog(level, message, data) {
    this.logs.push({
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Send error to tracking service
   */
  sendToErrorTracking(message, error, data) {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      // Example: Send to backend logging endpoint
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          error: error?.message,
          stack: error?.stack,
          data,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if logging endpoint is unavailable
      });
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Start performance measurement
   */
  start(name) {
    this.marks.set(name, performance.now());
  }

  /**
   * End performance measurement
   */
  end(name) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn(`Performance mark "${name}" not found`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    const measure = {
      name,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    };

    this.measures.push(measure);
    
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name}`, { duration });
    }

    return measure;
  }

  /**
   * Get all measurements
   */
  getMeasures() {
    return this.measures;
  }

  /**
   * Clear measurements
   */
  clear() {
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Get page load metrics
   */
  getPageLoadMetrics() {
    if (!window.performance || !window.performance.timing) {
      return null;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    return {
      // Navigation timing
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessingTime: timing.domComplete - timing.domLoading,
      loadTime: timing.loadEventEnd - timing.navigationStart,
      
      // Navigation type
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount,
    };
  }

  /**
   * Monitor component render time
   */
  measureRender(componentName, renderFn) {
    this.start(`render:${componentName}`);
    const result = renderFn();
    this.end(`render:${componentName}`);
    return result;
  }
}

/**
 * User interaction tracking
 */
class InteractionTracker {
  constructor() {
    this.interactions = [];
    this.maxInteractions = 50;
  }

  /**
   * Track user interaction
   */
  track(action, data = {}) {
    this.interactions.push({
      action,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

    if (this.interactions.length > this.maxInteractions) {
      this.interactions.shift();
    }

    // Send to analytics service
    this.sendToAnalytics(action, data);
  }

  /**
   * Send to analytics service
   */
  sendToAnalytics(action, data) {
    // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      // Example: Send to backend analytics endpoint
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if analytics endpoint is unavailable
      });
    }
  }

  /**
   * Get all interactions
   */
  getInteractions() {
    return this.interactions;
  }

  /**
   * Clear interactions
   */
  clear() {
    this.interactions = [];
  }
}

// Singleton instances
export const logger = new Logger();
export const performanceMonitor = new PerformanceMonitor();
export const interactionTracker = new InteractionTracker();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise,
  });
});

// Log page load metrics
window.addEventListener('load', () => {
  setTimeout(() => {
    const metrics = performanceMonitor.getPageLoadMetrics();
    if (metrics) {
      logger.info('Page load metrics', metrics);
    }
  }, 0);
});

export default logger;
