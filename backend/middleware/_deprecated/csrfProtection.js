/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks using token validation
 *
 * OWASP Top 10 - Mitigates:
 * A01: Broken Access Control - CSRF prevention
 * A12: Cross-Site Request Forgery - Primary mitigation
 *
 * Strategy: Double-submit cookie + synchronizer token pattern
 * - Generate unique token per request
 * - Store in httpOnly cookie (for validation)
 * - Require in request header or body for state-changing operations
 * - Validate token matches on server
 */

import crypto from 'crypto';

// Store tokens for additional validation (optional - for high-security needs)
const activeTokens = new Map();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate CSRF token
 * Uses crypto for secure random generation
 * @returns {string} CSRF token (64 character hex)
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token
 * @param {string} tokenFromRequest - Token from request header or body
 * @param {string} tokenFromCookie - Token from httpOnly cookie
 * @returns {boolean} Token validity
 */
export const validateCSRFToken = (tokenFromRequest, tokenFromCookie) => {
  if (!tokenFromRequest || !tokenFromCookie) {
    return false;
  }

  // Timing-safe string comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromRequest),
    Buffer.from(tokenFromCookie)
  );
};

/**
 * CSRF Token Middleware
 * Generates token on GET requests, validates on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
  const METHOD = req.method.toUpperCase();
  const CSRF_HEADER = 'x-csrf-token';
  const CSRF_COOKIE = 'csrf-token';
  const CSRF_PARAM = '_csrf';

  // Safe methods - generate token but don't require validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(METHOD)) {
    const token = generateCSRFToken();

    // Set httpOnly cookie (can't be accessed by JavaScript)
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY_MS,
    });

    // Make token available for form submissions
    res.locals.csrfToken = token;

    return next();
  }

  // State-changing methods - validate token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(METHOD)) {
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers?.[CSRF_HEADER];
    const bodyToken = req.body?.[CSRF_PARAM];

    const requestToken = headerToken || bodyToken;

    if (!cookieToken) {
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token not found in cookies',
      });
    }

    if (!requestToken) {
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token not found in request',
      });
    }

    try {
      if (!validateCSRFToken(requestToken, cookieToken)) {
        return res.status(403).json({
          error: 'CSRF_TOKEN_INVALID',
          message: 'CSRF token validation failed',
        });
      }
    } catch (err) {
      return res.status(403).json({
        error: 'CSRF_TOKEN_VALIDATION_ERROR',
        message: 'Error validating CSRF token',
      });
    }

    // Token valid - continue
    next();
  }
};

/**
 * Exemption helper for internal API calls or webhooks
 * Use sparingly and only for trusted sources
 */
export const exemptFromCSRF = (req, res, next) => {
  // Whitelist specific internal endpoints
  const exemptPaths = [
    '/api/webhooks', // Webhook endpoints
    '/api/health', // Health checks
    '/api/metrics', // Metrics endpoints
  ];

  const isExempt = exemptPaths.some((path) => req.path.startsWith(path));

  if (isExempt) {
    req.csrfExempt = true;
    return next();
  }

  // Otherwise apply CSRF protection
  csrfProtection(req, res, next);
};

/**
 * Middleware for endpoints that bypass CSRF validation
 * Should be used ONLY for webhooks that can't send CSRF tokens
 * Requires additional authentication (webhook signature verification)
 */
export const webhookProtection = (webhookSignatureVerifier) => {
  return (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (!signature || !timestamp) {
      return res.status(401).json({
        error: 'WEBHOOK_SIGNATURE_MISSING',
        message: 'Webhook signature verification required',
      });
    }

    // Verify timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 5 * 60 * 1000) {
      return res.status(401).json({
        error: 'WEBHOOK_TIMESTAMP_INVALID',
        message: 'Webhook request is too old',
      });
    }

    // Verify signature
    const isValid = webhookSignatureVerifier(req, signature, timestamp);
    if (!isValid) {
      return res.status(401).json({
        error: 'WEBHOOK_SIGNATURE_INVALID',
        message: 'Webhook signature verification failed',
      });
    }

    next();
  };
};

/**
 * Encode CSRF token for use in forms
 */
export const renderCSRFField = (token) => {
  return `<input type="hidden" name="_csrf" value="${token}">`;
};

/**
 * Get CSRF token for JSON requests
 * Used by frontend to fetch token before making POST requests
 */
export const getCSRFTokenHandler = (req, res) => {
  const token = generateCSRFToken();

  // Set httpOnly cookie
  res.cookie('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  // Return token (frontend will include in X-CSRF-Token header)
  res.json({ token });
};

/**
 * Validate origin and referer to prevent CSRF
 * Additional layer of protection
 */
export const validateOrigin = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // For state-changing requests, validate origin/referer
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      if (allowedOrigins.length > 0) {
        if (origin && !allowedOrigins.includes(origin)) {
          return res.status(403).json({
            error: 'INVALID_ORIGIN',
            message: 'Origin not allowed',
          });
        }

        if (referer) {
          const refererOrigin = new URL(referer).origin;
          if (!allowedOrigins.includes(refererOrigin)) {
            return res.status(403).json({
              error: 'INVALID_REFERER',
              message: 'Referer not allowed',
            });
          }
        }
      }
    }

    next();
  };
};

/**
 * Middleware composition: CSRF + Origin validation
 */
export const csrfProtectionWithOriginValidation = (allowedOrigins = []) => {
  return [validateOrigin(allowedOrigins), csrfProtection];
};

export default {
  generateCSRFToken,
  validateCSRFToken,
  csrfProtection,
  exemptFromCSRF,
  webhookProtection,
  renderCSRFField,
  getCSRFTokenHandler,
  validateOrigin,
  csrfProtectionWithOriginValidation,
};
