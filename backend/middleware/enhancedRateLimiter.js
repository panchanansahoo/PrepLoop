/**
 * Enhanced Rate Limiter
 * User-based adaptive rate limiting with violation tracking
 */

import rateLimit from 'express-rate-limit';
import cacheManager from '../utils/cacheManager.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('rate-limiter');

// Rate limit configurations by subscription tier
const TIER_LIMITS = {
  free: {
    standard: 100,      // requests per window
    upload: 10,         // file uploads per hour
    ai: 20,             // AI requests per hour
    windowMs: 15 * 60 * 1000,  // 15 minutes
  },
  premium: {
    standard: 500,
    upload: 50,
    ai: 100,
    windowMs: 15 * 60 * 1000,
  },
  enterprise: {
    standard: 2000,
    upload: 200,
    ai: 500,
    windowMs: 15 * 60 * 1000,
  },
};

/**
 * Get user's subscription tier
 */
async function getUserTier(userId) {
  try {
    const profile = await cacheManager.get(`profile:${userId}`);
    return profile?.subscription_tier || 'free';
  } catch (error) {
    logger.error('Error fetching user tier', { userId, error: error.message });
    return 'free'; // Default to free tier on error
  }
}

/**
 * Create adaptive rate limiter based on user tier
 */
export function createAdaptiveLimiter(options = {}) {
  const {
    type = 'standard', // standard, upload, ai
    message = 'Too many requests, please try again later.',
    statusCode = 429,
  } = options;

  return async (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const isAnonymous = !req.user?.id;

    // For anonymous users, use IP-based limiting with stricter limits
    if (isAnonymous) {
      const ipLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50, // Strict limit for unauthenticated users
        message: { error: message },
        statusCode,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (request) => request.ip,
      });
      return ipLimiter(req, res, next);
    }

    // Get user's tier
    const tier = await getUserTier(userId);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const maxRequests = limits[type] || limits.standard;

    // Track violations for escalation
    const violationKey = `rate_violation:${userId}:${type}`;
    const violations = await cacheManager.get(violationKey) || 0;

    // Escalate limits for repeat violators (stricter)
    let effectiveMax = maxRequests;
    if (violations > 5) {
      effectiveMax = Math.floor(maxRequests * 0.5); // 50% reduction
      logger.warn('Rate limit escalation applied', { userId, tier, violations });
    } else if (violations > 10) {
      effectiveMax = Math.floor(maxRequests * 0.25); // 75% reduction
      logger.warn('Severe rate limit escalation applied', { userId, tier, violations });
    }

    // Create user-specific rate limiter
    const userLimiter = rateLimit({
      windowMs: limits.windowMs,
      max: effectiveMax,
      message: { 
        error: message,
        retryAfter: Math.ceil(limits.windowMs / 1000),
        tier,
        limit: effectiveMax,
      },
      statusCode,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (request) => userId,
      
      // Handler for when limit is exceeded
      handler: async (request, response) => {
        // Increment violation counter
        await cacheManager.set(violationKey, violations + 1, { ttl: 3600 }); // 1 hour
        
        logger.warn('Rate limit exceeded', {
          userId,
          tier,
          type,
          violations: violations + 1,
          ip: request.ip,
        });

        response.status(statusCode).json({
          error: message,
          retryAfter: Math.ceil(limits.windowMs / 1000),
          tier,
          limit: effectiveMax,
        });
      },
    });

    return userLimiter(req, res, next);
  };
}

/**
 * Pre-configured limiters for common use cases
 */

// Standard API endpoints
export const standardLimiter = createAdaptiveLimiter({
  type: 'standard',
  message: 'Too many API requests. Please slow down.',
});

// File upload endpoints
export const uploadLimiter = createAdaptiveLimiter({
  type: 'upload',
  message: 'Too many file uploads. Please wait before uploading more files.',
});

// AI/LLM endpoints (expensive operations)
export const aiLimiter = createAdaptiveLimiter({
  type: 'ai',
  message: 'AI request limit reached. Please try again later or upgrade your plan.',
});

// Authentication endpoints (very strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts. Please try again later.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip,
});

// Password reset endpoint (extremely strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: { error: 'Too many password reset attempts. Please try again in an hour.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip,
});

/**
 * Reset violation counter for a user (after good behavior)
 */
export async function resetViolations(userId) {
  const keys = ['standard', 'upload', 'ai'];
  for (const type of keys) {
    await cacheManager.delete(`rate_violation:${userId}:${type}`);
  }
  logger.info('Rate violations reset', { userId });
}

/**
 * Get rate limit status for a user
 */
export async function getRateLimitStatus(userId) {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const status = {};
  for (const type of ['standard', 'upload', 'ai']) {
    const violations = await cacheManager.get(`rate_violation:${userId}:${type}`) || 0;
    status[type] = {
      limit: limits[type],
      violations,
      escalated: violations > 5,
    };
  }

  return {
    tier,
    limits: status,
  };
}
