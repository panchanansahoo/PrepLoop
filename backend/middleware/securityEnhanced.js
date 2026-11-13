import { createLogger } from '../utils/structuredLogger.js';
import cacheManager from '../utils/cacheManager.js';

const logger = createLogger('security-enhanced');

const MAX_TRACKED_IPS = 10000;
const IP_BLOCK_TTL_SEC = 3600;

// Track suspicious activity (L1 bounded map + L2 distributed Redis blocklist)
const suspiciousIPs = new Map();
const requestPatterns = new Map();

function enforceMapCapacity(map, maxEntries = MAX_TRACKED_IPS) {
  while (map.size >= maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

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
    enforceMapCapacity(suspiciousIPs);
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
    if (ip) {
      cacheManager.set(`security:blocked:${ip}`, { blocked: true, at: record.lastSeen }, IP_BLOCK_TTL_SEC).catch(() => {});
    }
  }

  return record;
};

export const CODE_AND_INTERVIEW_ROUTE_PREFIXES = [
  '/api/code',
  '/api/practice',
  '/api/interview',
  '/api/interview-enhanced',
  '/api/interview-suite',
  '/api/company-interview',
  '/api/companyInterview',
  '/api/fresher-interview',
  '/api/peer-interview',
  '/api/peerInterview',
  '/api/real-interview',
  '/api/system-design',
  '/api/submissions',
  '/api/dsa',
  '/api/playground',
  '/code',
  '/practice',
  '/interview',
  '/submissions',
];

export const isCodeOrInterviewRoute = (req, customSkipRoutes = []) => {
  const target = req.originalUrl || req.url || req.path || '';
  const allPrefixes = [...CODE_AND_INTERVIEW_ROUTE_PREFIXES, ...customSkipRoutes];
  return allPrefixes.some(prefix => target.startsWith(prefix) || target.includes(prefix));
};

// Check for suspicious patterns in request
export const detectSuspiciousPatterns = (req, customSkipRoutes = []) => {
  // SECURITY (M4): Limit the size of stringified request data before
  // regex testing to prevent ReDoS attacks on very large payloads
  const MAX_CHECK_LENGTH = 10240; // 10KB
  const isCodeRoute = isCodeOrInterviewRoute(req, customSkipRoutes);

  // For coding practice and technical interview routes, user submissions legitimately
  // contain SQL queries or JavaScript handlers. Do not inspect request body on these routes
  // to prevent false-positive auto-blocking of legitimate candidates/students.
  const payloadToInspect = isCodeRoute
    ? {
        url: req.originalUrl || req.url,
        query: req.query,
      }
    : {
        url: req.originalUrl || req.url,
        query: req.query,
        body: req.body,
      };

  const rawCheckString = JSON.stringify(payloadToInspect);
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
    enforceMapCapacity(requestPatterns);
    requestPatterns.set(ip, []);
  }

  const requests = requestPatterns.get(ip);
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  recentRequests.push(now);
  requestPatterns.set(ip, recentRequests);

  return recentRequests.length;
};

export const enhancedSecurity = (options = {}) => {
  const customSkipRoutes = Array.isArray(options.skipBodyRoutes) ? options.skipBodyRoutes : [];
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const requestId = req.requestId || res?.locals?.requestId || 'unknown';

    // Check if IP is blocked
    const ipRecord = suspiciousIPs.get(ip);
    if (ipRecord?.blocked) {
      logger.error('Blocked IP attempted access', { ip, requestId, url: req.originalUrl });
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      });
    }

    const continueSecurityChecks = () => {
      // Rate limiting check
      const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' || ip === 'localhost' || process.env.NODE_ENV === 'development';
      const maxRequests = isLocalhost ? 5000 : THRESHOLDS.MAX_REQUESTS_PER_MINUTE;
      const requestCount = checkRateLimit(ip);
      if (requestCount > maxRequests) {
        trackIPActivity(ip, 'rate_limit_exceeded', 'high');
        logger.warn('Rate limit exceeded', { ip, requestId, count: requestCount });
        return res.status(429).json({ 
          error: 'Too many requests',
          message: 'Please slow down and try again later'
        });
      }

      // Detect suspicious patterns
      const suspiciousPattern = detectSuspiciousPatterns(req, customSkipRoutes);
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

      return next();
    };

    if (ip && cacheManager.isConnected) {
      return cacheManager.get(`security:blocked:${ip}`)
        .then((remoteBlocked) => {
          if (remoteBlocked?.blocked) {
            enforceMapCapacity(suspiciousIPs);
            suspiciousIPs.set(ip, {
              requests: 1,
              failedAuth: 0,
              suspiciousPatterns: 0,
              firstSeen: Date.now(),
              lastSeen: Date.now(),
              blocked: true,
            });
            logger.error('Blocked IP attempted access (Redis blocklist)', { ip, requestId, url: req.originalUrl });
            return res.status(403).json({
              error: 'Access denied',
              message: 'Your IP has been temporarily blocked due to suspicious activity'
            });
          }
          return continueSecurityChecks();
        })
        .catch(() => continueSecurityChecks());
    }

    return continueSecurityChecks();
  };
};

// Cleanup old records every hour
const securityCleanupInterval = setInterval(() => {
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
securityCleanupInterval.unref();

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
  if (ip) {
    cacheManager.delete(`security:blocked:${ip}`).catch(() => {});
  }
  if (record) {
    record.blocked = false;
    record.failedAuth = 0;
    record.suspiciousPatterns = 0;
    logger.info('IP unblocked', { ip });
    return true;
  }
  return false;
};

export const resetSecurityState = () => {
  suspiciousIPs.clear();
  requestPatterns.clear();
};

export { suspiciousIPs, requestPatterns, THRESHOLDS, trackIPActivity };

export default { enhancedSecurity, getSecurityStats, unblockIP, resetSecurityState };
