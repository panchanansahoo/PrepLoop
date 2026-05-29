import crypto from 'crypto';

/**
 * CSRF protection using the double-submit cookie pattern.
 * 
 * For API routes using Bearer token auth, CSRF is not a concern
 * (browsers don't auto-attach Authorization headers).
 * This middleware protects any cookie-authenticated endpoints.
 * 
 * Usage:
 *   app.use('/api/auth', csrfProtection);  // only on cookie-auth routes
 * 
 * NOTE: Parses cookies manually from the Cookie header to avoid
 * requiring the cookie-parser dependency.
 */

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Parse cookies from the raw Cookie header string.
 * Returns an object of { name: value } pairs.
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const name = pair.substring(0, idx).trim();
    const value = pair.substring(idx + 1).trim();
    cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

export function generateCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,  // JS needs to read it to send in header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000,  // 1 hour
    path: '/',
  });
  return token;
}

export function csrfProtection(req, res, next) {
  // Skip safe methods
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }
  
  // Skip if using Bearer token auth (naturally CSRF-resistant)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  // For cookie-based auth, verify CSRF token
  // Use req.cookies if cookie-parser is loaded, otherwise parse manually
  const cookies = req.cookies || parseCookies(req.headers.cookie);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];
  
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      code: 'CSRF_TOKEN_MISMATCH'
    });
  }
  
  next();
}

/**
 * Constant-time string comparison.
 * Falls back to crypto.timingSafeEqual with Buffer conversion.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// Endpoint to get a fresh CSRF token
export function csrfTokenEndpoint(req, res) {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
}
