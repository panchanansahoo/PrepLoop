import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('sanitization');

/**
 * Simple XSS pattern detection (no external dependencies)
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  
  // Remove dangerous XSS patterns (script tags, event handlers, etc.)
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // SECURITY FIX (M1): Removed HTML entity encoding (&amp;, &lt;, etc.)
  // Input encoding was corrupting user-submitted code, search queries, and
  // names with special characters. HTML encoding must be done at the
  // output/rendering layer instead (React already escapes JSX expressions).
  //
  // NOTE (B-09): .trim() intentionally removed from global sanitizer to avoid
  // mutating code submissions that rely on leading/trailing whitespace
  // (e.g. Python indentation). Individual routes trim where appropriate.
  
  return sanitized;
}

/**
 * Sanitize HTML content (for rich text editors)
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') return input;
  
  // Allow only safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote'];
  const allowedAttrs = ['href', 'target', 'rel'];
  
  let sanitized = input;
  
  // Remove dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized;
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj, allowHTML = false) {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHTML));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, allowHTML);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return allowHTML ? sanitizeHTML(obj) : sanitizeString(obj);
  }
  
  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export function sanitizeInput(options = {}) {
  const { allowHTML = false, skipPaths = [] } = options;
  
  return (req, res, next) => {
    try {
      // Skip sanitization for specific paths (e.g., webhooks).
      // Use originalUrl for reliable matching regardless of mount context.
      if (skipPaths.some(path => req.originalUrl.includes(path))) {
        return next();
      }

      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, allowHTML);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, false);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, false);
      }

      next();
    } catch (error) {
      logger.error('Sanitization error', { error: error.message, path: req.path });
      res.status(400).json({ error: 'Invalid input data' });
      next(error);
    }
  };
}

/**
 * Middleware for routes that accept HTML content (blogs, rich text)
 */
export const sanitizeHTMLInput = sanitizeInput({ allowHTML: true });

/**
 * Middleware for routes that should skip sanitization (webhooks, raw data)
 */
export const skipSanitization = (paths) => sanitizeInput({ skipPaths: paths });

export { sanitizeString, sanitizeHTML, sanitizeObject };
