/**
 * Input Validation & Sanitization Middleware
 * Prevents injection attacks (SQL, NoSQL, XSS)
 *
 * OWASP Top 10 - Mitigates:
 * A03: Injection - Input validation and sanitization
 * A04: Insecure Design - Enforced validation patterns
 * A07: Cross-Site Scripting (XSS) - Output encoding
 */

import validator from 'validator';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Sanitization rules for common input types
 */
const sanitizeRules = {
  email: (value) => {
    if (typeof value !== 'string') return null;
    return validator.isEmail(value) ? validator.normalizeEmail(value) : null;
  },

  password: (value) => {
    // Passwords should not be sanitized, only validated for min length
    if (typeof value !== 'string' || value.length < 8) return null;
    return value; // Return as-is, don't modify
  },

  url: (value) => {
    if (typeof value !== 'string') return null;
    return validator.isURL(value) ? validator.trim(value) : null;
  },

  alphanumeric: (value) => {
    if (typeof value !== 'string') return null;
    // Only allow letters, numbers, hyphens, underscores
    return /^[a-zA-Z0-9_-]+$/.test(value) ? validator.escape(value) : null;
  },

  text: (value) => {
    if (typeof value !== 'string') return null;
    // Remove dangerous characters but allow common punctuation
    return validator.escape(value).substring(0, 1000); // Max 1000 chars
  },

  number: (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },

  boolean: (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return false;
  },

  uuid: (value) => {
    if (typeof value !== 'string') return null;
    return validator.isUUID(value) ? value : null;
  },
};

/**
 * Middleware to sanitize request body
 * @param {Object} schema - Validation schema: { fieldName: 'type', ... }
 * @returns {Function} Express middleware
 */
export const sanitizeRequestBody = (schema = {}) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    try {
      const sanitized = {};
      const errors = [];

      for (const [field, type] of Object.entries(schema)) {
        const value = req.body[field];
        const sanitizer = sanitizeRules[type];

        if (!sanitizer) {
          if (!IS_PRODUCTION) {
            console.warn(`Unknown sanitization type: ${type}`);
          }
          continue;
        }

        const result = sanitizer(value);

        if (value !== undefined && result === null) {
          errors.push({
            field,
            message: `Invalid ${type}: ${field}`,
            value: IS_PRODUCTION ? '[redacted]' : value, // Don't leak values in production
          });
        } else if (value !== undefined) {
          sanitized[field] = result;
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }

      // Replace body with sanitized version
      req.body = { ...req.body, ...sanitized };
      req.sanitized = true;

      next();
    } catch (error) {
      console.error('Sanitization error:', {
        error: error.message,
        path: req.path,
        method: req.method,
      });
      return res.status(400).json({ error: 'Invalid input' });
    }
  };
};

/**
 * Middleware to sanitize query parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export const sanitizeQueryParams = (schema = {}) => {
  return (req, res, next) => {
    if (!req.query || typeof req.query !== 'object') {
      return next();
    }

    try {
      const sanitized = {};
      const errors = [];

      for (const [field, type] of Object.entries(schema)) {
        const value = req.query[field];
        const sanitizer = sanitizeRules[type];

        if (!sanitizer) continue;

        if (value !== undefined) {
          const result = sanitizer(value);

          if (result === null) {
            errors.push({
              field,
              message: `Invalid ${type}: ${field}`,
            });
          } else {
            sanitized[field] = result;
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: errors,
        });
      }

      // Replace query with sanitized version
      req.query = { ...req.query, ...sanitized };

      next();
    } catch (error) {
      console.error('Query sanitization error:', {
        error: error.message,
        path: req.path,
      });
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
};

/**
 * Middleware to prevent common injection attacks
 * Checks for SQL, NoSQL, and XSS patterns
 */
export const preventInjectionAttacks = (req, res, next) => {
  const dangerousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|EVAL)\b)/gi,
    /(<script|javascript:|onerror=|onclick=|<iframe|<embed|<object)/gi,
    /(\$where|\$regex|\$ne|\$gt|\$lt)/gi, // NoSQL injection
  ];

  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return dangerousPatterns.some((pattern) => pattern.test(value));
  };

  const checkObject = (obj) => {
    for (const value of Object.values(obj || {})) {
      if (typeof value === 'string' && checkValue(value)) {
        return true;
      }
      if (typeof value === 'object' && checkObject(value)) {
        return true;
      }
    }
    return false;
  };

  // Check body
  if (req.body && checkObject(req.body)) {
    console.warn('Potential injection attack detected', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  // Check query
  if (req.query && checkObject(req.query)) {
    console.warn('Potential injection attack detected in query', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  next();
};

export default {
  sanitizeRequestBody,
  sanitizeQueryParams,
  preventInjectionAttacks,
};
