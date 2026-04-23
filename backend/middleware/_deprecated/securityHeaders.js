/**
 * Enhanced Security Headers Middleware
 * Implements production-grade security headers beyond helmet defaults
 *
 * OWASP Top 10 - Mitigates:
 * A01: Broken Access Control - CORS validation
 * A02: Cryptographic Failures - HSTS enforcement
 * A03: Injection - CSP and X-Content-Type-Options
 * A05: Security Misconfiguration - Multiple security headers
 * A07: Cross-Site Scripting (XSS) - CSP and X-Frame-Options
 */

import helmet from 'helmet';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Create enhanced security headers middleware
 * @param {Object} options - Configuration options
 * @param {string} options.frontendUrl - Frontend URL for CSP
 * @param {Array<string>} options.trustedOrigins - Trusted origins for CSP
 * @returns {Function} Express middleware
 */
export const createSecurityHeaders = (options = {}) => {
  const { frontendUrl, trustedOrigins = [] } = options;

  return [
    // ═════════════════════════════════════════════════════════════════════
    // HELMET: Core security headers
    // ═════════════════════════════════════════════════════════════════════
    helmet({
      // Content Security Policy - Prevents XSS and data exfiltration
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Unsafe-inline only if necessary (consider removing)
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            'https://api.groq.com',
            'https://api.openai.com',
            ...(frontendUrl ? [frontendUrl] : []),
            ...trustedOrigins,
          ],
          frameSrc: ["'none'"], // Prevent clickjacking
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
        reportUri: process.env.CSP_REPORT_URI, // Optional: Send CSP violations to monitoring
      },

      // Strict-Transport-Security - Force HTTPS
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: IS_PRODUCTION, // Enable HSTS preload list (production only)
      },

      // X-Frame-Options - Prevent clickjacking
      frameguard: {
        action: 'deny', // Prevent embedding in any frame
      },

      // X-Content-Type-Options - Prevent MIME sniffing
      noSniff: true,

      // X-XSS-Protection - Legacy XSS filter (deprecated but still useful for old browsers)
      xssFilter: true,

      // Referrer-Policy - Control referrer information
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },

      // Permissions-Policy - Restrict browser features
      permissionsPolicy: {
        features: {
          geolocation: ['()'], // Deny all
          microphone: ['()'],
          camera: ['()'],
          payment: ['()'],
          usb: ['()'],
          accelerometer: ['()'],
          gyroscope: ['()'],
          magnetometer: ['()'],
        },
      },

      // Remove powered-by header
      hidePoweredBy: true,
    }),

    // ═════════════════════════════════════════════════════════════════════
    // CUSTOM: Additional production-grade headers
    // ═════════════════════════════════════════════════════════════════════
    (req, res, next) => {
      // X-Permitted-Cross-Domain-Policies - Adobe Flash/PDF security
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

      // Remove Server header
      res.removeHeader('Server');

      // X-DNS-Prefetch-Control - Disable DNS prefetching to privacy
      res.setHeader('X-DNS-Prefetch-Control', 'off');

      // Cross-Origin-Embedder-Policy - Require explicit CORS
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

      // Cross-Origin-Opener-Policy - Isolate browsing context
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

      // Cross-Origin-Resource-Policy - Control resource embedding
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Expect-CT - Enforce certificate transparency (production only)
      if (IS_PRODUCTION) {
        res.setHeader('Expect-CT', 'max-age=86400, enforce');
      }

      next();
    },
  ];
};

export default createSecurityHeaders;
