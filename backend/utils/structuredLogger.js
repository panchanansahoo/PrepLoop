/**
 * Structured Logger
 * 
 * Provides consistent, JSON-formatted logging with:
 * - Context binding (requestId, userId, operation)
 * - Log levels (debug, info, warn, error, critical)
 * - Structured fields for log aggregation
 * - Stack traces for errors
 * - Guaranteed output to stderr for critical logs (even in production)
 * 
 * Usage:
 *   const logger = createLogger('myservice');
 *   logger.info('User logged in', { userId: 123 });
 *   logger.critical('Database connection lost', { retries: 3 }, error);
 */

class StructuredLogger {
  constructor(operationName = 'app') {
    this.operationName = operationName;
  }

  // SECURITY: Scrub PII and sensitive fields from log context
  // Prevents email addresses, tokens, passwords, and API keys from
  // reaching log aggregation systems (Splunk, ELK, CloudWatch, etc.)
  static SENSITIVE_KEYS = new Set([
    'password', 'secret', 'token', 'authorization', 'cookie',
    'apikey', 'api_key', 'accesstoken', 'access_token', 'refreshtoken',
    'refresh_token', 'ssn', 'creditcard', 'credit_card', 'cvv',
  ]);

  static scrubFields(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => StructuredLogger.scrubFields(item, depth + 1));

    const scrubbed = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase().replace(/[-_]/g, '');
      if (StructuredLogger.SENSITIVE_KEYS.has(keyLower)) {
        scrubbed[key] = '[REDACTED]';
      } else if (key === 'email' && typeof value === 'string') {
        // Mask email: show first 2 chars + domain
        const atIdx = value.indexOf('@');
        scrubbed[key] = atIdx > 2 ? value.slice(0, 2) + '***' + value.slice(atIdx) : '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        scrubbed[key] = StructuredLogger.scrubFields(value, depth + 1);
      } else {
        scrubbed[key] = value;
      }
    }
    return scrubbed;
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
      ...StructuredLogger.scrubFields(fields),
    };
  }

  /**
   * Output log to stderr (always visible, even in production)
   * Structured logs bypass the console.log suppression in production
   */
  outputLog(entry) {
    // Always use process.stderr for structured logs to bypass
    // any console.log/console.info filtering in production
    const json = JSON.stringify(entry);
    
    if (entry.level === 'ERROR' || entry.level === 'CRITICAL') {
      process.stderr.write(json + '\n');
    } else {
      // Most logs still go to stderr for structured capture
      // This ensures they're visible in container logs and log aggregation
      process.stderr.write(json + '\n');
    }
  }

  /**
   * Log with context
   */
  log(level, message, context = {}) {
    const entry = this.formatEntry(level, message, context);
    this.outputLog(entry);
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

  /**
   * Critical logs - always logged to stderr, guaranteed visibility in production
   * Use for startup, shutdown, fatal errors, and other essential runtime information
   */
  critical(message, context = {}, error = null) {
    const fields = {
      ...context,
      ...(error && {
        errorType: error.name || 'Error',
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
    this.log('critical', message, fields);
  }
}

/**
 * Create logger factory
 */
export function createLogger(operationName) {
  return new StructuredLogger(operationName);
}

export default StructuredLogger;
