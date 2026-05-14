const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Production environment detection
const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.lastMonitoringError = null;
    this.monitoringErrorCount = 0;
    this.maxMonitoringErrors = 5; // Stop trying after N errors
  }

  /**
   * Main logging entry point
   * In production: Only logs ERROR and WARN
   * In development: Logs all levels
   */
  log(level, message, meta = {}) {
    // Production mode: skip non-critical logs
    if (IS_PRODUCTION) {
      const shouldLog = level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN;
      if (!shouldLog) {
        return; // Silently skip INFO/DEBUG in production
      }
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta
    };

    // Console output
    try {
      if (level === LOG_LEVELS.ERROR) {
        console.error(`[${this.context}]`, message, meta);
      } else if (level === LOG_LEVELS.WARN) {
        console.warn(`[${this.context}]`, message, meta);
      } else if (level === LOG_LEVELS.DEBUG && IS_DEVELOPMENT) {
        console.debug(`[${this.context}]`, message, meta);
      } else {
        console.log(`[${this.context}]`, message, meta);
      }
    } catch (err) {
      // Fallback if console is unavailable
      // (shouldn't happen in modern browsers, but defensive coding)
    }

    // Send errors to monitoring service in production
    if (IS_PRODUCTION && level === LOG_LEVELS.ERROR) {
      this.sendToMonitoring(logEntry);
    }
  }

  error(message, meta) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * Send error to monitoring service
   * Uses navigator.sendBeacon when available (more reliable for async operations)
   * With circuit breaker: stops trying after repeated failures
   */
  sendToMonitoring(logEntry) {
    // Circuit breaker: if monitoring service is consistently failing, stop trying
    if (this.monitoringErrorCount >= this.maxMonitoringErrors) {
      return;
    }

    try {
      // Safely access navigator.sendBeacon with optional chaining
      const sendBeacon = window?.navigator?.sendBeacon;
      
      if (typeof sendBeacon === 'function') {
        // sendBeacon is a bound method, must use call/apply
        const blob = new Blob([JSON.stringify(logEntry)], { type: 'application/json' });
        const success = sendBeacon.call(window.navigator, '/api/logs', blob);
        
        if (success) {
          this.monitoringErrorCount = 0; // Reset counter on success
        } else {
          this.monitoringErrorCount++;
        }
      } else {
        // Fallback: try fetch if sendBeacon unavailable
        this.sendToMonitoringViaFetch(logEntry);
      }
    } catch (err) {
      // Monitoring failures should not crash the app
      this.monitoringErrorCount++;
      this.lastMonitoringError = err;
      
      // Only log monitoring errors if we haven't exceeded circuit breaker
      if (this.monitoringErrorCount < this.maxMonitoringErrors) {
        try {
          console.warn('[Logger] Monitoring service error:', err.message);
        } catch {
          // Even warn might fail in edge cases
        }
      }
    }
  }

  /**
   * Fallback: Send via fetch if sendBeacon unavailable
   * Fire-and-forget: doesn't wait for response
   */
  async sendToMonitoringViaFetch(logEntry) {
    try {
      // Use keepalive flag so request completes even if page unloads
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
        keepalive: true, // Important: ensures request completes on page unload
      });
      this.monitoringErrorCount = 0;
    } catch (err) {
      this.monitoringErrorCount++;
      this.lastMonitoringError = err;
      // Silently fail: monitoring service unavailability shouldn't impact app
    }
  }

  /**
   * Get logger diagnostic info (safe for logging/debugging)
   */
  getDebugInfo() {
    return {
      context: this.context,
      mode: IS_PRODUCTION ? 'production' : 'development',
      monitoringStatus: {
        lastError: this.lastMonitoringError?.message || null,
        errorCount: this.monitoringErrorCount,
        circuitBreakerOpen: this.monitoringErrorCount >= this.maxMonitoringErrors,
      },
    };
  }
}

export const createLogger = (context) => new Logger(context);

export default Logger;

