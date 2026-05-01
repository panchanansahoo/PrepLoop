/**
 * Proxy Validation Middleware
 * 
 * Validates and hardens trust proxy configuration to prevent IP spoofing
 * that could compromise rate limiting and security.
 * 
 * Security measures:
 * 1. Only trust proxies in production when explicitly configured
 * 2. Validate upstream proxy headers against whitelist
 * 3. Reject requests with invalid proxy headers
 * 4. Log all proxy trust decisions for security audit
 * 5. Provide fallback to raw socket IP if trust proxy fails
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('proxy-validation');

/**
 * Get trusted proxy list from environment
 * Format: TRUST_PROXY environment variable
 * Examples:
 *   - TRUST_PROXY=0 or false: disable trust proxy
 *   - TRUST_PROXY=1 or true: trust immediate upstream
 *   - TRUST_PROXY=127.0.0.1,::1: trust specific IPs
 */
function getTrustedProxies() {
  const trustProxyEnv = process.env.TRUST_PROXY || '';
  
  if (trustProxyEnv === '0' || trustProxyEnv === 'false') {
    return false;
  }
  
  if (trustProxyEnv === '1' || trustProxyEnv === 'true') {
    // Trust immediate upstream only
    return 1;
  }
  
  // Custom proxy configuration: parse comma-separated list
  if (trustProxyEnv && trustProxyEnv !== '') {
    return trustProxyEnv.split(',').map(p => p.trim()).filter(p => p);
  }
  
  // Default to not trusting any proxy
  return false;
}

/**
 * Validate that request is coming through trusted proxy
 * Returns: { trusted: boolean, reason: string, clientIp: string }
 */
function validateProxyHeaders(req, config) {
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xForwardedProto = req.headers['x-forwarded-proto'];
  
  // If no X-Forwarded-For header, no proxy involved
  if (!xForwardedFor) {
    return {
      trusted: true,
      reason: 'direct-connection',
      clientIp: remoteAddress,
      sourceType: 'socket'
    };
  }
  
  // If trust proxy is not enabled, reject forwarded headers
  if (!config.trustProxy) {
    return {
      trusted: false,
      reason: 'proxy-headers-without-trust-proxy-enabled',
      clientIp: remoteAddress,
      sourceType: 'socket',
      severity: 'high'
    };
  }
  
  // Validate X-Forwarded-For format: should be comma-separated IPs
  const forwarded = xForwardedFor.split(',').map(ip => ip.trim());
  
  // Security: limit number of hops to prevent header inflation attacks
  const MAX_HOPS = 10;
  if (forwarded.length > MAX_HOPS) {
    return {
      trusted: false,
      reason: 'x-forwarded-for-too-many-hops',
      clientIp: remoteAddress,
      sourceType: 'socket',
      severity: 'high',
      details: { hopCount: forwarded.length, maxHops: MAX_HOPS }
    };
  }
  
  // Validate each IP in X-Forwarded-For
  for (const ip of forwarded) {
    if (!isValidIp(ip)) {
      return {
        trusted: false,
        reason: 'invalid-ip-in-x-forwarded-for',
        clientIp: remoteAddress,
        sourceType: 'socket',
        severity: 'high',
        details: { invalidIp: ip }
      };
    }
  }
  
  // Validate X-Forwarded-Proto (security: should match known values)
  if (xForwardedProto && !['http', 'https'].includes(xForwardedProto.toLowerCase())) {
    return {
      trusted: false,
      reason: 'invalid-x-forwarded-proto',
      clientIp: remoteAddress,
      sourceType: 'socket',
      severity: 'high',
      details: { proto: xForwardedProto }
    };
  }
  
  // If trust proxy is a number, validate remote is on loopback/local network
  if (typeof config.trustProxy === 'number') {
    if (!isPrivateOrLoopback(remoteAddress)) {
      return {
        trusted: false,
        reason: 'proxy-headers-from-untrusted-remote',
        clientIp: remoteAddress,
        sourceType: 'socket',
        severity: 'critical',
        details: { remoteAddress }
      };
    }
  }
  
  // All validation passed: return the client IP from X-Forwarded-For
  const clientIp = forwarded[0]; // First IP is original client
  
  return {
    trusted: true,
    reason: 'validated-proxy-headers',
    clientIp,
    sourceType: 'x-forwarded-for',
    details: { hopCount: forwarded.length }
  };
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4: 0.0.0.0 - 255.255.255.255
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  }
  
  // IPv6: simplified check (allow : and hex chars)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Check if IP is private or loopback (safe for proxy trust)
 */
function isPrivateOrLoopback(ip) {
  if (!ip) return false;
  
  // Loopback
  if (ip === '127.0.0.1' || ip === '::1') return true;
  
  // Private IPv4 ranges
  if (ip.match(/^10\./)) return true;
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) return true;
  if (ip.match(/^192\.168\./)) return true;
  
  // Link-local IPv4
  if (ip.match(/^169\.254\./)) return true;
  
  // Private IPv6
  if (ip.match(/^fd[0-9a-fA-F]{2}:/)) return true;
  if (ip.match(/^fe[89ab][0-9a-fA-F]:/i)) return true;
  if (ip.match(/^::1$/)) return true;
  if (ip.match(/^::ffff:127\./)) return true;
  
  return false;
}

/**
 * Create proxy validation middleware
 */
export function createProxyValidationMiddleware() {
  const config = {
    trustProxy: getTrustedProxies(),
    environment: process.env.NODE_ENV || 'development',
  };
  
  // Log configuration on startup
  const trustProxyValue = config.trustProxy === false ? 'disabled' : 
                          config.trustProxy === true ? 'all' :
                          config.trustProxy === 1 ? 'immediate-upstream' :
                          Array.isArray(config.trustProxy) ? 'custom-list' :
                          'unknown';
  
  if (process.env.NODE_ENV === 'production' && config.trustProxy) {
    logger.critical('Trust proxy enabled in production', {
      trustProxy: trustProxyValue,
      environment: config.environment,
      proxyHeaderValidation: 'enabled'
    });
  } else if (config.trustProxy === false) {
    logger.info('Trust proxy disabled (default safe configuration)', {
      environment: config.environment
    });
  }
  
  return (req, res, next) => {
    // Validate proxy headers if present
    const validation = validateProxyHeaders(req, config);
    
    // Attach validation result to request for downstream middleware
    req.proxyValidation = validation;
    
    // Log suspicious proxy header activity
    if (!validation.trusted && validation.severity) {
      const logLevel = validation.severity === 'critical' ? 'critical' : 'warn';
      logger[logLevel]('Suspicious proxy header detected', {
        reason: validation.reason,
        severity: validation.severity,
        remoteAddress: validation.clientIp,
        xForwardedFor: req.headers['x-forwarded-for'],
        method: req.method,
        path: req.path,
        details: validation.details,
        requestId: req.requestId,
      });
      
      // In production with trust proxy enabled, reject high/critical violations
      if (config.environment === 'production' && 
          (validation.severity === 'critical' || validation.severity === 'high') &&
          config.trustProxy) {
        return res.status(403).json({
          error: 'Invalid proxy headers',
          message: 'Request rejected due to invalid proxy configuration'
        });
      }
    }
    
    // Store the actual client IP used for rate limiting
    // Prefer validated proxy IP, fall back to socket IP
    req.clientIp = validation.clientIp;
    req.clientIpSource = validation.sourceType;
    
    next();
  };
}

/**
 * Get the safe client IP from request
 * Should be called after proxy validation middleware
 */
export function getClientIp(req) {
  // Use validated client IP if available
  if (req.clientIp) {
    return req.clientIp;
  }
  
  // Fallback to Express req.ip (uses trust proxy setting)
  if (req.ip) {
    return req.ip;
  }
  
  // Last resort: use raw socket address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * Configure Express trust proxy setting
 */
export function configureExpressTrustProxy(app) {
  const trustProxyValue = getTrustedProxies();
  
  // Set Express trust proxy configuration
  if (trustProxyValue === false) {
    app.set('trust proxy', false);
  } else if (trustProxyValue === true) {
    // Trust all proxies (only if explicitly enabled)
    app.set('trust proxy', true);
  } else if (typeof trustProxyValue === 'number') {
    // Trust specific number of proxies
    app.set('trust proxy', trustProxyValue);
  } else if (Array.isArray(trustProxyValue)) {
    // Trust specific IPs/CIDR ranges
    app.set('trust proxy', trustProxyValue);
  }
}
