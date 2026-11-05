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

  // SECURITY: Scrub PII and sensitive fields from log context
  // Prevents email addresses, tokens, passwords, API keys, and sensitive documents
  // from reaching log aggregation systems (Splunk, ELK, CloudWatch, etc.)
  static SENSITIVE_KEYS = new Set([
    'password', 'secret', 'token', 'authorization', 'cookie',
    'apikey', 'api_key', 'accesstoken', 'access_token', 'refreshtoken',
    'refresh_token', 'jwtsecret', 'jwt_secret', 'keysecret', 'key_secret',
    'servicerole', 'service_role', 'servicerolekey', 'service_role_key',
    'privatekey', 'private_key', 'ssn', 'creditcard', 'credit_card', 'cvv',
    'resumetext', 'resume_text', 'extractedtext', 'extracted_text',
    'documentcontent', 'document_content', 'transcript', 'rawtext', 'raw_text',
    'filebuffer', 'file_buffer', 'resetlink', 'reset_link', 'recoverylink', 'recovery_link'
  ]);

  static sanitizeStringValue(str) {
    if (typeof str !== 'string') return str;
    // Redact JWT tokens
    let sanitized = str.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
    // Redact API key tokens
    sanitized = sanitized.replace(/(?:whsec_|pl_live_|re_|gsk_|AIza)[a-zA-Z0-9_-]{12,}/g, '[REDACTED_KEY]');
    // Redact reset / recovery link tokens in URLs
    sanitized = sanitized.replace(/([?&](?:token|code|recovery_token)=)[^&\s]+/gi, '$1[REDACTED_TOKEN]');
    return sanitized;
  }

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
      } else if (typeof value === 'string') {
        scrubbed[key] = StructuredLogger.sanitizeStringValue(value);
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
    const safeFields = (typeof fields === 'object' && fields !== null && !Array.isArray(fields))
      ? fields
      : (fields !== undefined && fields !== null && fields !== '') ? { detail: String(fields) } : {};
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      operation: this.operationName,
      message: StructuredLogger.sanitizeStringValue(message),
      ...StructuredLogger.scrubFields(safeFields),
    };
  }

  /**
   * Log with context
   */
  log(level, message, context = {}) {
    if (process.env.NODE_ENV === 'test' && process.env.TEST_LOGS !== 'true') {
      return;
    }

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
