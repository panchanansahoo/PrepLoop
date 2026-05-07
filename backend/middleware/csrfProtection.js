/**
 * CSRF Protection Middleware
 * Implements secure token-based CSRF protection
 */

import csrf from 'csurf';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('csrf-protection');

/**
 * CSRF Protection Configuration
 * Uses double-submit cookie pattern with token validation
 * For SPA: token provided in response header, sent back in X-CSRF-Token header
 */
const csrfOptions = {
  cookie: {
    httpOnly: true,      // Prevent JavaScript access (secure)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',  // Strict same-site policy prevents cross-origin cookies
    maxAge: 3600000,     // 1 hour
    path: '/',           // Cookie scope
  },
};

/**
 * Create CSRF protection middleware
 */
export function createCsrfProtection() {
  return csrf(csrfOptions);
}

/**
 * CSRF error handler
 */
export function handleCsrfError(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form submission expired or invalid. Please refresh the page and try again.',
    });
  }
  
  next(err);
}

/**
 * Get CSRF token and expose it in response headers
 * Frontend reads from X-CSRF-Token header and includes in subsequent requests
 */
export function getCsrfToken(req, res, next) {
  // Generate/get CSRF token (csurf stores it in req.csrfToken() method)
  if (req.csrfToken && typeof req.csrfToken === 'function') {
    try {
      const token = req.csrfToken();
      
      // Always set token in response header for frontend SPA to read
      res.setHeader('X-CSRF-Token', token);
      
      // For development, also log the token was generated
      if (process.env.NODE_ENV === 'development') {
        logger.debug('CSRF token generated and exposed in header', {
          path: req.path,
          method: req.method,
        });
      }
    } catch (error) {
      // If token generation fails, continue without it
      logger.warn('Failed to generate CSRF token', {
        error: error.message,
        path: req.path,
      });
    }
  }
  
  next();
}

/**
 * CSRF protection for API routes
 * Only applies to state-changing methods (POST, PUT, DELETE, PATCH)
 */
export function apiCsrfProtection(req, res, next) {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For authenticated API requests, check CSRF token in header
  const csrfToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  
  if (!csrfToken) {
    logger.warn('Missing CSRF token', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      error: 'CSRF token required',
      message: 'Please include X-CSRF-Token header with your request',
    });
  }

  // Token will be validated by csurf middleware
  next();
}

/**
 * Skip CSRF protection for specific paths
 * Use this for webhooks, public APIs, etc.
 */
export function skipCsrfForPaths(paths = []) {
  return (req, res, next) => {
    const shouldSkip = paths.some((path) => {
      if (typeof path === 'string') {
        return req.path.startsWith(path);
      }
      if (path instanceof RegExp) {
        return path.test(req.path);
      }
      return false;
    });

    if (shouldSkip) {
      // Skip CSRF validation
      req._skipCsrf = true;
    }

    next();
  };
}

/**
 * Conditional CSRF protection (respects skip flag)
 */
export function conditionalCsrfProtection() {
  const protection = createCsrfProtection();
  
  return (req, res, next) => {
    if (req._skipCsrf) {
      return next();
    }
    
    protection(req, res, (err) => {
      if (err) {
        return handleCsrfError(err, req, res, next);
      }
      
      // Add token to response for subsequent requests
      getCsrfToken(req, res, next);
    });
  };
}

/**
 * Frontend helper: Inject CSRF token into HTML
 */
export function injectCsrfToken(req, res, next) {
  if (req.csrfToken && req.path === '/') {
    const token = req.csrfToken();
    
    // Store in cookie for JavaScript to read
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });
  }
  
  next();
}

/**
 * Verify CSRF token manually (for custom implementations)
 */
export function verifyCsrfToken(token, secret) {
  // This is a simplified version - csurf handles this internally
  // Use this only if you need custom CSRF verification logic
  
  if (!token || !secret) {
    return false;
  }
  
  try {
    // Token format: <random>-<hash>
    const parts = token.split('-');
    if (parts.length !== 2) {
      return false;
    }
    
    // In production, use proper cryptographic verification
    return true;
  } catch (error) {
    logger.error('CSRF token verification error', { error: error.message });
    return false;
  }
}

/**
 * CSRF protection middleware stack for Express app
 */
export function setupCsrfProtection(app, options = {}) {
  const {
    skipPaths = ['/api/webhooks', '/health'],
    apiRoutes = ['/api'],
  } = options;

  // Skip CSRF for specified paths
  app.use(skipCsrfForPaths(skipPaths));

  // Apply CSRF protection
  app.use(conditionalCsrfProtection());

  // Inject token for frontend
  app.use(injectCsrfToken);

  // Error handling
  app.use(handleCsrfError);

  logger.info('CSRF protection configured', {
    skipPaths,
    apiRoutes,
    environment: process.env.NODE_ENV,
  });
}
