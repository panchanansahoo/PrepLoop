/**
 * Structured Logger
 * 
 * Provides consistent, JSON-formatted logging with:
 * - Context binding (requestId, userId, operation)
 * - Log levels (debug, info, warn, error)
 * - Structured fields for log aggregation
 * - Stack traces for errors
 */

class StructuredLogger {
  constructor(operationName = 'app') {
    this.operationName = operationName;
  }

  /**
   * Format log entry as structured JSON
   */
  formatEntry(level, message, fields = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      operation: this.operationName,
      message,
      ...fields,
    };
  }

  /**
   * Log with context
   */
  log(level, message, context = {}) {
    const entry = this.formatEntry(level, message, context);
    
    if (level === 'error' || level === 'warn') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message, context = {}) {
    if (process.env.DEBUG === 'true') {
      this.log('debug', message, context);
    }
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  error(message, context = {}, error = null) {
    const fields = {
      ...context,
      ...(error && {
        errorType: error.name || 'Error',
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
    this.log('error', message, fields);
  }
}

/**
 * Create logger factory
 */
export function createLogger(operationName) {
  return new StructuredLogger(operationName);
}

export default StructuredLogger;
