const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor(context = 'app') {
    this.context = context;
  }

  log(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta
    };

    if (level === LOG_LEVELS.ERROR) {
      console.error(`[${this.context}]`, message, meta);
    } else if (level === LOG_LEVELS.WARN) {
      console.warn(`[${this.context}]`, message, meta);
    } else if (level === LOG_LEVELS.DEBUG && import.meta.env.DEV) {
      console.debug(`[${this.context}]`, message, meta);
    } else {
      console.log(`[${this.context}]`, message, meta);
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD && level === LOG_LEVELS.ERROR) {
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

  sendToMonitoring(logEntry) {
    // Placeholder for monitoring service integration
    // Could send to Sentry, LogRocket, etc.
    if (window.navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(logEntry)], { type: 'application/json' });
      window.navigator.sendBeacon('/api/logs', blob);
    }
  }
}

export const createLogger = (context) => new Logger(context);

export default Logger;
