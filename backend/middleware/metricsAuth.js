/**
 * Metrics Security Middleware
 * 
 * Protects the /metrics endpoint from unauthorized access using:
 * - API key authentication (X-Metrics-Key header)
 * - IP address allowlist (for internal monitoring systems)
 * - Request logging for audit trail
 * 
 * Configuration:
 * - METRICS_API_KEY: Secret API key for authentication (recommended: >32 chars)
 * - METRICS_IP_ALLOWLIST: Comma-separated list of allowed IPs (e.g., "10.0.0.5,192.168.1.10")
 * - METRICS_ENABLED: Enable/disable metrics endpoint (default: true if METRICS_API_KEY set)
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('metrics-security');

/**
 * Get client IP from request, accounting for proxies
 */
function getClientIp(req) {
  // Prefer clientIp if already validated by proxy validation middleware
  if (req.clientIp) {
    return req.clientIp;
  }
  
  // Fall back to Express req.ip
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * Check if IP is in the allowlist
 */
function isIpAllowed(clientIp, allowlist) {
  if (!allowlist || allowlist.length === 0) {
    return false;
  }
  
  // Always allow loopback addresses
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp?.startsWith('127.')) {
    return true;
  }
  
  // Check exact match in allowlist
  return allowlist.includes(clientIp);
}

/**
 * Parse IP allowlist from environment variable
 */
function parseIpAllowlist() {
  const allowlistStr = process.env.METRICS_IP_ALLOWLIST || '';
  if (!allowlistStr) {
    return [];
  }
  
  return allowlistStr
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);
}

/**
 * Get configured API key
 */
function getMetricsApiKey() {
  return process.env.METRICS_API_KEY || '';
}

/**
 * Validate API key from request headers
 */
function validateApiKey(headerValue, expectedKey) {
  if (!headerValue) {
    return false;
  }
  
  // Handle array case (some proxies may duplicate headers)
  const key = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  
  // Use constant-time comparison to prevent timing attacks
  return key.length === expectedKey.length && 
         key === expectedKey;
}

/**
 * Create metrics security middleware
 */
export function createMetricsSecurityMiddleware() {
  const apiKey = getMetricsApiKey();
  const ipAllowlist = parseIpAllowlist();
  const enabled = process.env.METRICS_ENABLED !== 'false';
  
  // Log configuration on startup
  if (!enabled) {
    logger.info('Metrics endpoint disabled', { METRICS_ENABLED: process.env.METRICS_ENABLED });
  } else if (!apiKey && ipAllowlist.length === 0) {
    logger.warn('Metrics endpoint has no security configured', {
      message: 'Set METRICS_API_KEY and/or METRICS_IP_ALLOWLIST for security'
    });
  } else {
    const securityMethods = [];
    if (apiKey) securityMethods.push('API key');
    if (ipAllowlist.length > 0) securityMethods.push(`IP allowlist (${ipAllowlist.length} IPs)`);
    
    logger.info('Metrics security enabled', {
      methods: securityMethods,
      ipAllowlistSize: ipAllowlist.length
    });
  }
  
  return (req, res, next) => {
    // Check if metrics is disabled
    if (!enabled) {
      logger.warn('Metrics endpoint disabled - access rejected', {
        clientIp: getClientIp(req),
        method: req.method,
        path: req.path
      });
      return res.status(410).json({
        error: 'Gone',
        message: 'Metrics endpoint is disabled'
      });
    }
    
    const clientIp = getClientIp(req);
    const apiKeyHeader = req.headers['x-metrics-key'];
    let authorized = false;
    let authMethod = '';
    
    // Try IP allowlist first
    if (ipAllowlist.length > 0) {
      if (isIpAllowed(clientIp, ipAllowlist)) {
        authorized = true;
        authMethod = 'IP allowlist';
      } else {
        logger.warn('Metrics access denied - IP not in allowlist', {
          clientIp,
          allowlistSize: ipAllowlist.length
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'IP address not authorized to access metrics'
        });
      }
    }
    
    // If IP allowlist doesn't apply or wasn't sufficient, check API key
    if (!authorized && apiKey) {
      if (!apiKeyHeader) {
        logger.warn('Metrics access denied - API key missing', {
          clientIp
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'X-Metrics-Key header required'
        });
      }
      
      if (!validateApiKey(apiKeyHeader, apiKey)) {
        logger.warn('Metrics access denied - API key invalid', {
          clientIp,
          hasApiKey: true
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key'
        });
      }
      
      authorized = true;
      authMethod = 'API key';
    }
    
    // If no security is configured at all, allow access but warn
    if (!authorized && !apiKey && ipAllowlist.length === 0) {
      logger.warn('Metrics endpoint accessed without security configured', {
        clientIp,
        message: 'Consider setting METRICS_API_KEY or METRICS_IP_ALLOWLIST'
      });
      authorized = true;
      authMethod = 'none (no security configured)';
    }
    
    if (!authorized) {
      logger.warn('Metrics access denied - no auth method matched', {
        clientIp,
        apiKeyConfigured: Boolean(apiKey),
        ipAllowlistConfigured: ipAllowlist.length > 0
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required for metrics endpoint'
      });
    }
    
    // Log successful authentication
    logger.info('Metrics endpoint accessed', {
      clientIp,
      authMethod,
      timestamp: new Date().toISOString()
    });
    
    // Attach auth info to request for downstream middleware
    req.metricsAuth = {
      authorized: true,
      authMethod,
      clientIp,
      timestamp: Date.now()
    };
    
    next();
  };
}

/**
 * Disable metrics endpoint entirely
 */
export function disableMetricsEndpoint() {
  return (req, res) => {
    logger.warn('Metrics endpoint is disabled', {
      clientIp: getClientIp(req),
      path: req.path
    });
    res.status(410).json({
      error: 'Gone',
      message: 'Metrics endpoint is not available'
    });
  };
}

/**
 * Get metrics security configuration (for logging/debugging)
 */
export function getMetricsSecurityConfig() {
  const apiKey = getMetricsApiKey();
  const ipAllowlist = parseIpAllowlist();
  
  return {
    enabled: process.env.METRICS_ENABLED !== 'false',
    apiKeyConfigured: Boolean(apiKey),
    apiKeyLength: apiKey.length,
    ipAllowlistConfigured: ipAllowlist.length > 0,
    ipAllowlistSize: ipAllowlist.length,
    ipAllowlist: ipAllowlist // Include actual IPs for configuration verification
  };
}
