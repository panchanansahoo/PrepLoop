/**
 * Advanced Security Middleware
 * Implements threat detection, rate limiting, and security best practices
 */

import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('security');

class SecurityService {
  constructor() {
    this.suspiciousIPs = new Map();
    this.blockedIPs = new Set();
    this.failedAttempts = new Map();
    this.securityEvents = [];
  }

  /**
   * Advanced rate limiting with adaptive thresholds
   */
  createAdaptiveRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000,
      maxRequests = 100,
      skipSuccessfulRequests = false,
    } = options;

    return rateLimit({
      windowMs,
      max: (req) => {
        // Reduce limit for suspicious IPs
        const ip = this.getClientIP(req);
        if (this.isSuspicious(ip)) {
          return Math.floor(maxRequests * 0.5);
        }
        return maxRequests;
      },
      skipSuccessfulRequests,
      handler: (req, res) => {
        const ip = this.getClientIP(req);
        this.recordSecurityEvent('rate_limit_exceeded', { ip, path: req.path });
        
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please slow down and try again later',
          retryAfter: Math.ceil(windowMs / 1000),
        });
      },
    });
  }

  /**
   * Detect and prevent brute force attacks
   */
  bruteForceProtection(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
      const identifier = this.getIdentifier(req);
      const attempts = this.failedAttempts.get(identifier) || { count: 0, firstAttempt: Date.now() };

      // Reset if window expired
      if (Date.now() - attempts.firstAttempt > windowMs) {
        this.failedAttempts.delete(identifier);
        return next();
      }

      // Check if blocked
      if (attempts.count >= maxAttempts) {
        this.recordSecurityEvent('brute_force_blocked', { identifier, path: req.path });
        return res.status(429).json({
          error: 'Too many failed attempts',
          message: 'Account temporarily locked. Please try again later.',
        });
      }

      // Store original send to intercept response
      const originalSend = res.send;
      res.send = function (data) {
        if (res.statusCode === 401 || res.statusCode === 403) {
          attempts.count++;
          attempts.firstAttempt = attempts.firstAttempt || Date.now();
          this.failedAttempts.set(identifier, attempts);

          if (attempts.count >= maxAttempts) {
            this.recordSecurityEvent('brute_force_detected', { identifier, attempts: attempts.count });
          }
        } else if (res.statusCode === 200) {
          // Success - clear attempts
          this.failedAttempts.delete(identifier);
        }

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * SQL Injection detection
   */
  sqlInjectionProtection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(UNION.*SELECT)/gi,
        /(OR\s+1\s*=\s*1)/gi,
        /(--|\#|\/\*|\*\/)/g,
      ];

      const checkValue = (value) => {
        if (typeof value === 'string') {
          return sqlPatterns.some((pattern) => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(checkValue);
        }
        return false;
      };

      const suspicious = 
        checkValue(req.query) ||
        checkValue(req.body) ||
        checkValue(req.params);

      if (suspicious) {
        const ip = this.getClientIP(req);
        this.recordSecurityEvent('sql_injection_attempt', {
          ip,
          path: req.path,
          query: req.query,
          body: req.body,
        });

        this.markSuspicious(ip);

        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request contains potentially malicious content',
        });
      }

      next();
    };
  }

  /**
   * XSS Protection
   */
  xssProtection() {
    return (req, res, next) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
      ];

      const sanitize = (value) => {
        if (typeof value === 'string') {
          return xssPatterns.some((pattern) => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(sanitize);
        }
        return false;
      };

      const hasXSS = 
        sanitize(req.query) ||
        sanitize(req.body) ||
        sanitize(req.params);

      if (hasXSS) {
        const ip = this.getClientIP(req);
        this.recordSecurityEvent('xss_attempt', {
          ip,
          path: req.path,
        });

        this.markSuspicious(ip);

        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request contains potentially malicious content',
        });
      }

      next();
    };
  }

  /**
   * CSRF Token validation
   */
  csrfProtection() {
    return (req, res, next) => {
      // Skip for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;

      if (!token || token !== sessionToken) {
        this.recordSecurityEvent('csrf_violation', {
          ip: this.getClientIP(req),
          path: req.path,
        });

        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'Request rejected for security reasons',
        });
      }

      next();
    };
  }

  /**
   * IP Blocking middleware
   */
  ipBlocker() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);

      if (this.blockedIPs.has(ip)) {
        this.recordSecurityEvent('blocked_ip_access', { ip, path: req.path });
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been blocked',
        });
      }

      next();
    };
  }

  /**
   * Request signature verification
   */
  verifyRequestSignature(secret) {
    return (req, res, next) => {
      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];

      if (!signature || !timestamp) {
        return res.status(401).json({
          error: 'Missing signature',
          message: 'Request must be signed',
        });
      }

      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const requestTime = parseInt(timestamp, 10);
      if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
        return res.status(401).json({
          error: 'Invalid timestamp',
          message: 'Request timestamp is too old',
        });
      }

      // Verify signature
      const expectedSignature = this.generateSignature(req.body, timestamp, secret);
      if (signature !== expectedSignature) {
        this.recordSecurityEvent('invalid_signature', {
          ip: this.getClientIP(req),
          path: req.path,
        });

        return res.status(401).json({
          error: 'Invalid signature',
          message: 'Request signature verification failed',
        });
      }

      next();
    };
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    return (req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // XSS Protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions Policy
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      next();
    };
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const last24h = this.securityEvents.filter(
      (e) => Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const byType = last24h.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: this.securityEvents.length,
      last24h: last24h.length,
      byType,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedIPs: this.blockedIPs.size,
      topThreats: this.getTopThreats(10),
    };
  }

  // Helper methods
  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
  }

  getIdentifier(req) {
    return req.body?.email || req.body?.username || this.getClientIP(req);
  }

  isSuspicious(ip) {
    return this.suspiciousIPs.has(ip);
  }

  markSuspicious(ip) {
    const count = (this.suspiciousIPs.get(ip) || 0) + 1;
    this.suspiciousIPs.set(ip, count);

    // Auto-block after threshold
    if (count >= 10) {
      this.blockIP(ip);
    }
  }

  blockIP(ip) {
    this.blockedIPs.add(ip);
    logger.warn('IP blocked', { ip });
  }

  recordSecurityEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    this.securityEvents.push(event);
    logger.warn('Security event', event);

    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }
  }

  generateSignature(body, timestamp, secret) {
    const crypto = require('crypto');
    const payload = JSON.stringify(body) + timestamp;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  getTopThreats(limit) {
    const counts = this.securityEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }));
  }
}

export default new SecurityService();
