/**
 * Content Security Policy (CSP) Middleware
 *
 * Implements strict CSP headers that:
 * - Only apply to HTML responses (not APIs)
 * - Remove unsafe-inline from styleSrc and scriptSrc
 * - Use nonce-based inline scripts/styles when needed
 * - Prevent XSS attacks and content injection
 *
 * SECURITY:
 *   - unsafe-inline disabled: Mitigates inline script/style XSS
 *   - Nonce-based: Allows legitimate inline content with cryptographic proof
 *   - Scoped to HTML: Avoids breaking API responses
 *   - Strict defaults: defaultSrc only allows 'self'
 */

import { createHash, randomBytes } from 'crypto';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('csp');

/**
 * Generate cryptographically random nonce for inline scripts/styles
 */
function generateNonce() {
  return randomBytes(16).toString('base64');
}

/**
 * Calculate SHA-256 hash for inline script/style (for fallback support)
 */
function hashContent(content) {
  return `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
}

/**
 * CSP middleware that only applies to HTML responses
 */
export function cspMiddleware(options = {}) {
  const reportUri = options.reportUri || process.env.CSP_REPORT_URI;

  return (req, res, next) => {
    // Store nonce on request object for template use
    const nonce = generateNonce();
    req.cspNonce = nonce;

    // Wrap res.json to avoid CSP on API responses
    const originalJson = res.json;
    res.json = function(data) {
      // Don't set CSP headers for JSON responses
      return originalJson.call(this, data);
    };

    // Wrap res.send to check content type
    const originalSend = res.send;
    res.send = function(data) {
      const contentType = res.getHeader('content-type') || '';
      
      // Only apply strict CSP to HTML responses
      if (contentType.includes('text/html')) {
        const cspDirectives = {
          'default-src': ["'self'"],
          'script-src': ["'self'", `'nonce-${nonce}'`],
          'style-src': ["'self'", `'nonce-${nonce}'`],
          'img-src': ["'self'", 'data:', 'https:'],
          'font-src': ["'self'"],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
        };

        // Add report-uri if configured
        if (reportUri) {
          cspDirectives['report-uri'] = [reportUri];
        }

        // Convert directives object to CSP header string
        const cspHeader = Object.entries(cspDirectives)
          .map(([key, values]) => `${key} ${values.join(' ')}`)
          .join('; ');

        res.setHeader('Content-Security-Policy', cspHeader);
        logger.debug('CSP header set for HTML response', { 
          nonce: nonce.slice(0, 8) + '...',
          directives: Object.keys(cspDirectives).length 
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Helper function to generate HTML with nonce-protected inline scripts/styles
 *
 * Usage:
 *   const html = generateHtmlWithNonce(nonce, `
 *     <style nonce="${nonce}">
 *       body { font-family: sans-serif; }
 *     </style>
 *   `);
 */
export function generateHtmlWithNonce(nonce, content) {
  return content.replace(/nonce=""/g, `nonce="${nonce}"`);
}

/**
 * Generate CSP header value with nonce for inline content
 *
 * Usage:
 *   const cspHeader = generateCspHeader(req.cspNonce);
 */
export function generateCspHeader(nonce, options = {}) {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    ...options.customDirectives,
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${Array.isArray(values) ? values.join(' ') : values}`)
    .join('; ');
}

export default cspMiddleware;
