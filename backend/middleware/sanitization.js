import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('sanitization');

/**
 * Simple XSS pattern detection (no external dependencies)
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<iframe\b[^>]*>/gi,
  /<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<object\b[^>]*>/gi,
  /<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  /<svg\b[^>]*>/gi,
  /<\/svg>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /on\w+\s*=/gi,
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

const ALLOWED_HTML_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr', 'span'
]);

const ALLOWED_HTML_ATTRS = new Set(['href', 'target', 'rel', 'title', 'class']);
const SAFE_URL_PATTERN = /^(?:https?:|mailto:|\/|#)/i;

const HTML_DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<iframe\b[^>]*>/gi,
  /<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<object\b[^>]*>/gi,
  /<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<applet\b[^>]*>/gi,
  /<\/applet>/gi,
  /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  /<svg\b[^>]*>/gi,
  /<\/svg>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /expression\s*\(/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
];

/**
 * Sanitize HTML content (for rich text editors)
 * Filters tags and attributes against an allowlist while stripping XSS vectors.
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  // 1. Strip outright dangerous tags (scripts, styles, embed, etc.)
  for (const pattern of HTML_DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 2. Filter HTML tags against the allowlist and clean attributes
  const tagRegex = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;

  sanitized = sanitized.replace(tagRegex, (match, tagName, rawAttrs) => {
    const lowerTag = tagName.toLowerCase();

    // Strip unallowed tags completely
    if (!ALLOWED_HTML_TAGS.has(lowerTag)) {
      return '';
    }

    // Clean closing tag
    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // Process attributes for allowed opening tags
    const cleanAttrs = [];
    let hasTargetBlank = false;
    let relValue = null;

    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      if (!ALLOWED_HTML_ATTRS.has(attrName)) {
        continue;
      }

      if (attrName === 'href') {
        const trimmed = attrVal.trim();
        // Disallow dangerous URI schemes (javascript:, vbscript:, data:, etc.)
        if (!SAFE_URL_PATTERN.test(trimmed)) {
          continue;
        }
        cleanAttrs.push(`href="${trimmed.replace(/"/g, '&quot;')}"`);
      } else if (attrName === 'target') {
        if (attrVal === '_blank') {
          hasTargetBlank = true;
          cleanAttrs.push('target="_blank"');
        } else if (attrVal === '_self') {
          cleanAttrs.push('target="_self"');
        }
      } else if (attrName === 'rel') {
        relValue = attrVal.replace(/"/g, '&quot;');
      } else {
        cleanAttrs.push(`${attrName}="${attrVal.replace(/"/g, '&quot;')}"`);
      }
    }

    if (hasTargetBlank) {
      cleanAttrs.push('rel="noopener noreferrer"');
    } else if (relValue) {
      cleanAttrs.push(`rel="${relValue}"`);
    }

    const attrString = cleanAttrs.length > 0 ? ` ${cleanAttrs.join(' ')}` : '';
    const isSelfClosing = match.endsWith('/>') && (lowerTag === 'br' || lowerTag === 'hr');

    return isSelfClosing ? `<${lowerTag}${attrString} />` : `<${lowerTag}${attrString}>`;
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
      if (!res.headersSent) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      return next(error);
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
