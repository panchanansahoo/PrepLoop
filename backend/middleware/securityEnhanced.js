import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('security-enhanced');

// Track suspicious activity
const suspiciousIPs = new Map();
const requestPatterns = new Map();

const THRESHOLDS = {
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_FAILED_AUTH_ATTEMPTS: 5,
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SUSPICIOUS_PATTERNS: [
        /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
        /(union.*select|insert.*into|drop.*table)/i, // SQL injection
        /(<script|javascript:|onerror=|onload=)/i, // XSS
        /(\.{2}\/|\.{2}\\)/i, // Directory traversal: ../ or ..\ (stateless)
  ],
};

// IP reputation tracking
const trackIPActivity = (ip, action, _severity = 'low') => {
  if (!suspiciousIPs.has(ip)) {
    suspiciousIPs.set(ip, {
      requests: 0,
      failedAuth: 0,
      suspiciousPatterns: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      blocked: false,
    });
  }

  const record = suspiciousIPs.get(ip);
  record.lastSeen = Date.now();
  record.requests++;

  if (action === 'failed_auth') record.failedAuth++;
  if (action === 'suspicious_pattern') record.suspiciousPatterns++;

  // Auto-block if thresholds exceeded
  if (
    record.failedAuth > THRESHOLDS.MAX_FAILED_AUTH_ATTEMPTS ||
    record.suspiciousPatterns > 3
  ) {
    record.blocked = true;
    logger.warn('IP auto-blocked', { ip, record });
  }

  return record;
};

// Check for suspicious patterns in request
const detectSuspiciousPatterns = (req) => {
  // SECURITY (M4): Limit the size of stringified request data before
  // regex testing to prevent ReDoS attacks on very large payloads
  const MAX_CHECK_LENGTH = 10240; // 10KB
  const rawCheckString = JSON.stringify({
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    headers: req.headers,
  });
  const checkString = rawCheckString.length > MAX_CHECK_LENGTH 
    ? rawCheckString.slice(0, MAX_CHECK_LENGTH) 
    : rawCheckString;

  for (const pattern of THRESHOLDS.SUSPICIOUS_PATTERNS) {
    if (pattern.test(checkString)) {
      return pattern.toString();
    }
  }

  return null;
};

// Rate limiting per IP
const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window

  if (!requestPatterns.has(ip)) {
    requestPatterns.set(ip, []);
  }

  const requests = requestPatterns.get(ip);
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  recentRequests.push(now);
  requestPatterns.set(ip, recentRequests);

  return recentRequests.length;
};

export const enhancedSecurity = () => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const requestId = req.requestId || res.locals.requestId;

    // Check if IP is blocked
    const ipRecord = suspiciousIPs.get(ip);
    if (ipRecord?.blocked) {
      logger.error('Blocked IP attempted access', { ip, requestId, url: req.originalUrl });
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      });
    }

    // Rate limiting check
    const requestCount = checkRateLimit(ip);
    if (requestCount > THRESHOLDS.MAX_REQUESTS_PER_MINUTE) {
      trackIPActivity(ip, 'rate_limit_exceeded', 'high');
      logger.warn('Rate limit exceeded', { ip, requestId, count: requestCount });
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'Please slow down and try again later'
      });
    }

    // Detect suspicious patterns
    const suspiciousPattern = detectSuspiciousPatterns(req);
    if (suspiciousPattern) {
      trackIPActivity(ip, 'suspicious_pattern', 'high');
      logger.error('Suspicious pattern detected', { 
        ip, 
        requestId, 
        pattern: suspiciousPattern,
        url: req.originalUrl 
      });
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Request contains suspicious patterns'
      });
    }

    // Validate content-type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      // SECURITY (M5): Accept form-urlencoded in addition to JSON and multipart
      if (!contentType || (
        !contentType.includes('application/json') && 
        !contentType.includes('multipart/form-data') &&
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('text/plain')
      )) {
        logger.warn('Invalid content-type', { ip, requestId, contentType });
        return res.status(415).json({ 
          error: 'Unsupported Media Type',
          message: 'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded'
        });
      }
    }

    // Track normal activity
    trackIPActivity(ip, 'normal', 'low');

    // Add security headers to response
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Allow microphone on same-origin for voice interviews; keep camera and geolocation disabled
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');

    next();
  };
};

// Cleanup old records every hour
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  let cleaned = 0;

  for (const [ip, record] of suspiciousIPs.entries()) {
    if (record.lastSeen < oneHourAgo && !record.blocked) {
      suspiciousIPs.delete(ip);
      cleaned++;
    }
  }

  for (const [ip, requests] of requestPatterns.entries()) {
    if (requests.length === 0 || Math.max(...requests) < oneHourAgo) {
      requestPatterns.delete(ip);
    }
  }

  if (cleaned > 0) {
    logger.info('Security records cleaned', { cleaned, remaining: suspiciousIPs.size });
  }
}, 3600000);

export const getSecurityStats = () => {
  const blocked = Array.from(suspiciousIPs.entries())
    .filter(([_, record]) => record.blocked)
    .map(([ip, record]) => ({ ip, ...record }));

  return {
    totalTracked: suspiciousIPs.size,
    blockedIPs: blocked.length,
    blocked: blocked.slice(0, 10), // Top 10
    activePatterns: requestPatterns.size,
  };
};

export const unblockIP = (ip) => {
  const record = suspiciousIPs.get(ip);
  if (record) {
    record.blocked = false;
    record.failedAuth = 0;
    record.suspiciousPatterns = 0;
    logger.info('IP unblocked', { ip });
    return true;
  }
  return false;
};

export default { enhancedSecurity, getSecurityStats, unblockIP };
