/**
 * Sensitive Data Masking Module
 * Prevents PII and credential leakage in logs and error responses
 *
 * OWASP Top 10 - Mitigates:
 * A01: Broken Access Control - PII leakage prevention
 * A02: Cryptographic Failures - Credential masking
 * A04: Insecure Design - Privacy by design
 */

const PII_PATTERNS = {
  // Email addresses - mask everything but first letter and domain
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    mask: (match) => {
      const [local, domain] = match.split('@');
      return `${local[0]}***@${domain}`;
    },
  },

  // Phone numbers - mask middle digits
  phone: {
    pattern: /(\+?1?\s*)?(\()?(\d{3})(\))?[\s.-]?(\d{3})[\s.-]?(\d{4})/g,
    mask: (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length === 10) {
        return `***-***-${digits.slice(-4)}`;
      }
      if (digits.length === 11) {
        return `***-***-${digits.slice(-4)}`;
      }
      return '***-***-****';
    },
  },

  // Credit card numbers - show only last 4 digits
  creditCard: {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    mask: (match) => {
      const digits = match.replace(/\D/g, '');
      return `****-****-****-${digits.slice(-4)}`;
    },
  },

  // Social Security Numbers
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    mask: () => '***-**-****',
  },

  // IP addresses (mask last octet)
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: (match) => {
      const parts = match.split('.');
      parts[3] = '***';
      return parts.join('.');
    },
  },

  // Passport/ID numbers
  idNumber: {
    pattern: /(?:passport|id|license|document)[\s:=#]*([A-Z0-9]{6,20})/gi,
    mask: (match) => {
      const id = match.match(/[A-Z0-9]{6,20}/i)?.[0] || '';
      return `${match.substring(0, match.indexOf(id))}***${id.slice(-2)}`;
    },
  },

  // Bank account numbers (show last 4)
  bankAccount: {
    pattern: /(?:account|acct|number)[\s:=#]*(\d{8,20})/gi,
    mask: (match) => {
      const nums = match.match(/\d+/)?.[0] || '';
      return `${match.substring(0, match.indexOf(nums))}****${nums.slice(-4)}`;
    },
  },

  // URLs with credentials
  credentialUrl: {
    pattern: /(?:https?:\/\/)?([^:]+):([^@]+)@/g,
    mask: (match) => {
      const [username, password] = match
        .replace(/^https?:\/\//, '')
        .replace(/@/, '')
        .split(':');
      return `***:***@`;
    },
  },
};

/**
 * Mask sensitive PII in text
 * @param {string} text - Text containing PII
 * @param {Array<string>} piiTypes - Types of PII to mask (default: all)
 * @returns {string} Masked text
 */
export const maskPII = (text, piiTypes = Object.keys(PII_PATTERNS)) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let masked = text;

  for (const piiType of piiTypes) {
    const config = PII_PATTERNS[piiType];
    if (!config) continue;

    masked = masked.replace(config.pattern, config.mask);
  }

  return masked;
};

/**
 * Mask PII in object recursively
 */
export const maskPIIInObject = (obj, depth = 0) => {
  if (depth > 10) return '[Depth exceeded]'; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return maskPII(obj);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskPIIInObject(item, depth + 1));
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      masked[key] = maskPII(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPIIInObject(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

/**
 * Mask sensitive fields by key name
 * Useful for objects with structured fields
 */
export const maskSensitiveFields = (obj, depth = 0) => {
  if (depth > 10) return '[Depth exceeded]';
  if (obj === null || obj === undefined) return obj;

  const sensitiveFields = [
    'password',
    'email',
    'phone',
    'phoneNumber',
    'phone_number',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'credit_card',
    'bankAccount',
    'bank_account',
    'accountNumber',
    'account_number',
    'passportNumber',
    'passport_number',
    'idNumber',
    'id_number',
    'ipAddress',
    'ip_address',
    'jwt',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'privateKey',
    'private_key',
  ];

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveFields(item, depth + 1));
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = sensitiveFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (isSensitiveKey) {
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = `${value.substring(0, 2)}***${value.slice(-2)}`;
      } else {
        masked[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveFields(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

/**
 * Create sanitized error response
 * Removes internal details while preserving useful context
 */
export const createSafeErrorResponse = (err, isProduction = true) => {
  const response = {
    status: err.status || 500,
    message: err.message || 'An error occurred',
    requestId: err.requestId || undefined,
  };

  // Only include error details in development
  if (!isProduction) {
    response.details = maskSensitiveFields(err.details || {});
    response.stack = err.stack;
  }

  // Never include sensitive details
  const sensitiveWords = [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'auth',
    'database',
    'connection',
    'url',
  ];

  const messageLower = response.message.toLowerCase();
  if (sensitiveWords.some((word) => messageLower.includes(word))) {
    response.message = 'An error occurred processing your request';
  }

  return response;
};

/**
 * Create safe error logger
 * Automatically masks PII and credentials
 */
export const createErrorSafeLogger = (logger, isProduction = true) => {
  return {
    error: (message, error, context = {}) => {
      const safeError = {
        message: maskPII(error?.message || ''),
        stack: isProduction
          ? undefined
          : maskSensitiveFields(error?.stack || ''),
        context: maskSensitiveFields(context),
      };

      logger.error(message, safeError);
    },

    warn: (message, data = {}) => {
      logger.warn(message, maskSensitiveFields(data));
    },

    info: (message, data = {}) => {
      logger.info(message, maskSensitiveFields(data));
    },

    debug: (message, data = {}) => {
      logger.debug(message, maskSensitiveFields(data));
    },
  };
};

/**
 * Audit log - masks sensitive data but preserves action audit trail
 */
export const logAuditEvent = (logger, event) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: event.action,
    userId: event.userId ? '[USER_MASKED]' : undefined,
    resource: event.resource,
    result: event.result,
    ipAddress: event.ipAddress
      ? maskPII(event.ipAddress, ['ipAddress'])
      : undefined,
    userAgent: event.userAgent ? '[USER_AGENT_MASKED]' : undefined,
    details: maskSensitiveFields(event.details || {}),
  };

  logger.info('AUDIT_EVENT', auditEntry);
  return auditEntry;
};

/**
 * Create response wrapper that sanitizes output
 */
export const sanitizeResponse = (data) => {
  return maskSensitiveFields(maskPIIInObject(data));
};

export default {
  maskPII,
  maskPIIInObject,
  maskSensitiveFields,
  createSafeErrorResponse,
  createErrorSafeLogger,
  logAuditEvent,
  sanitizeResponse,
};
