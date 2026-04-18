import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('rate-limiter-advanced');

/**
 * Token Bucket implementation for rate limiting
 */
class TokenBucket {
  constructor(capacity, refillRate, refillInterval = 1000) {
    this.capacity = capacity; // Maximum tokens
    this.tokens = capacity; // Current tokens
    this.refillRate = refillRate; // Tokens added per interval
    this.refillInterval = refillInterval; // Interval in ms
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const intervalsElapsed = Math.floor(timePassed / this.refillInterval);

    if (intervalsElapsed > 0) {
      const tokensToAdd = intervalsElapsed * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(tokens = 1) {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return {
        allowed: true,
        remaining: this.tokens,
        resetIn: Math.ceil((this.capacity - this.tokens) / this.refillRate * this.refillInterval / 1000),
      };
    }

    return {
      allowed: false,
      remaining: this.tokens,
      resetIn: Math.ceil((tokens - this.tokens) / this.refillRate * this.refillInterval / 1000),
    };
  }

  getStatus() {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      percentage: ((this.tokens / this.capacity) * 100).toFixed(2) + '%',
    };
  }
}

/**
 * Rate limiter with user tiers
 */
class AdvancedRateLimiter {
  constructor() {
    this.buckets = new Map();
    this.tiers = {
      free: {
        capacity: 100,
        refillRate: 10,
        refillInterval: 60000, // 1 minute
        costMultiplier: 1,
      },
      basic: {
        capacity: 500,
        refillRate: 50,
        refillInterval: 60000,
        costMultiplier: 0.8,
      },
      premium: {
        capacity: 2000,
        refillRate: 200,
        refillInterval: 60000,
        costMultiplier: 0.5,
      },
      admin: {
        capacity: 10000,
        refillRate: 1000,
        refillInterval: 60000,
        costMultiplier: 0.1,
      },
    };

    // Endpoint costs (in tokens)
    this.endpointCosts = {
      'GET': 1,
      'POST': 2,
      'PUT': 2,
      'DELETE': 2,
      'PATCH': 2,
    };

    // Special endpoint costs
    this.specialCosts = {
      '/api/ai': 10,
      '/api/ai-features': 10,
      '/api/jobs/ai-search': 15,
      '/api/jobs/career-ops/evaluate': 5,
      '/api/voice': 8,
      '/api/payment': 3,
    };

    // Cleanup old buckets every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  getBucket(identifier, tier = 'free') {
    const key = `${identifier}_${tier}`;
    
    if (!this.buckets.has(key)) {
      const tierConfig = this.tiers[tier] || this.tiers.free;
      this.buckets.set(key, {
        bucket: new TokenBucket(
          tierConfig.capacity,
          tierConfig.refillRate,
          tierConfig.refillInterval
        ),
        tier,
        lastAccess: Date.now(),
      });
    }

    const entry = this.buckets.get(key);
    entry.lastAccess = Date.now();
    return entry;
  }

  calculateCost(req) {
    const method = req.method;
    let cost = this.endpointCosts[method] || 1;

    // Check for special endpoints
    for (const [path, specialCost] of Object.entries(this.specialCosts)) {
      if (req.path.startsWith(path)) {
        cost = specialCost;
        break;
      }
    }

    return cost;
  }

  consume(identifier, tier, cost) {
    const entry = this.getBucket(identifier, tier);
    const adjustedCost = Math.ceil(cost * entry.tier.costMultiplier || cost);
    return entry.bucket.consume(adjustedCost);
  }

  getStatus(identifier, tier) {
    const entry = this.buckets.get(`${identifier}_${tier}`);
    if (!entry) {
      const tierConfig = this.tiers[tier] || this.tiers.free;
      return {
        tokens: tierConfig.capacity,
        capacity: tierConfig.capacity,
        percentage: '100%',
      };
    }
    return entry.bucket.getStatus();
  }

  cleanup() {
    const oneHourAgo = Date.now() - 3600000;
    let cleaned = 0;

    for (const [key, entry] of this.buckets.entries()) {
      if (entry.lastAccess < oneHourAgo) {
        this.buckets.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Rate limiter cleanup', { cleaned, remaining: this.buckets.size });
    }
  }

  getStats() {
    const stats = {
      totalBuckets: this.buckets.size,
      byTier: {},
    };

    for (const [key, entry] of this.buckets.entries()) {
      const tier = entry.tier;
      if (!stats.byTier[tier]) {
        stats.byTier[tier] = 0;
      }
      stats.byTier[tier]++;
    }

    return stats;
  }
}

const rateLimiter = new AdvancedRateLimiter();

/**
 * Get user tier from request
 */
function getUserTier(req) {
  if (!req.user) return 'free';
  
  // Check user role
  if (req.user.role === 'admin') return 'admin';
  
  // Check subscription tier (if available)
  if (req.user.subscription_tier) {
    return req.user.subscription_tier;
  }

  // Check user metadata
  if (req.user.user_metadata?.tier) {
    return req.user.user_metadata.tier;
  }

  return 'free';
}

/**
 * Advanced rate limiting middleware
 */
export const advancedRateLimiter = (options = {}) => {
  const {
    skipPaths = ['/health', '/api/monitoring'],
    keyGenerator = (req) => req.user?.id || req.ip || 'anonymous',
  } = options;

  return (req, res, next) => {
    // Skip certain paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const identifier = keyGenerator(req);
    const tier = getUserTier(req);
    const cost = rateLimiter.calculateCost(req);

    const result = rateLimiter.consume(identifier, tier, cost);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimiter.tiers[tier].capacity);
    res.setHeader('X-RateLimit-Remaining', Math.floor(result.remaining));
    res.setHeader('X-RateLimit-Reset', result.resetIn);
    res.setHeader('X-RateLimit-Cost', cost);
    res.setHeader('X-RateLimit-Tier', tier);

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        tier,
        cost,
        remaining: result.remaining,
        resetIn: result.resetIn,
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${result.resetIn} seconds.`,
        retryAfter: result.resetIn,
        tier,
        limit: rateLimiter.tiers[tier].capacity,
        cost,
      });
    }

    // Log if running low on tokens
    if (result.remaining < rateLimiter.tiers[tier].capacity * 0.1) {
      logger.debug('Rate limit running low', {
        identifier,
        tier,
        remaining: result.remaining,
      });
    }

    next();
  };
};

/**
 * Get rate limit status for user
 */
export function getRateLimitStatus(req, res) {
  const identifier = req.user?.id || req.ip || 'anonymous';
  const tier = getUserTier(req);
  const status = rateLimiter.getStatus(identifier, tier);

  res.json({
    tier,
    ...status,
    limits: rateLimiter.tiers[tier],
  });
}

/**
 * Get rate limiter statistics (admin only)
 */
export function getRateLimiterStats(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const stats = rateLimiter.getStats();
  res.json(stats);
}

/**
 * Reset rate limit for user (admin only)
 */
export function resetRateLimit(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId } = req.params;
  const { tier } = req.body;

  const key = `${userId}_${tier || 'free'}`;
  const deleted = rateLimiter.buckets.delete(key);

  if (deleted) {
    logger.info('Rate limit reset', { userId, tier });
    res.json({ message: 'Rate limit reset successfully' });
  } else {
    res.status(404).json({ error: 'Rate limit not found' });
  }
}

/**
 * Upgrade user tier (admin only)
 */
export function upgradeUserTier(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId, newTier } = req.body;

  if (!rateLimiter.tiers[newTier]) {
    return res.status(400).json({ 
      error: 'Invalid tier',
      availableTiers: Object.keys(rateLimiter.tiers),
    });
  }

  // In production, update user's tier in database
  // For now, just acknowledge
  logger.info('User tier upgraded', { userId, newTier });

  res.json({
    message: 'User tier upgraded successfully',
    userId,
    newTier,
    limits: rateLimiter.tiers[newTier],
  });
}

export default {
  advancedRateLimiter,
  getRateLimitStatus,
  getRateLimiterStats,
  resetRateLimit,
  upgradeUserTier,
  rateLimiter,
};
