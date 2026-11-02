import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { getRedisClient } from '../config/redis.js';

const logger = createLogger('usage-quota');
const counters = new Map();
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

const limits = {
  ai: Number.parseInt(process.env.AI_DAILY_REQUEST_LIMIT || '100', 10),
  voice: Number.parseInt(process.env.VOICE_DAILY_REQUEST_LIMIT || '60', 10),
};

const planLimits = {
  free: {
    ai: Number.parseInt(process.env.FREE_AI_DAILY_REQUEST_LIMIT || '100', 10),
    voice: Number.parseInt(process.env.FREE_VOICE_DAILY_REQUEST_LIMIT || '60', 10),
  },
  pro: {
    ai: Number.parseInt(process.env.PRO_AI_DAILY_REQUEST_LIMIT || '500', 10),
    voice: Number.parseInt(process.env.PRO_VOICE_DAILY_REQUEST_LIMIT || '300', 10),
  },
  premium: {
    ai: Number.parseInt(process.env.PREMIUM_AI_DAILY_REQUEST_LIMIT || '2000', 10),
    voice: Number.parseInt(process.env.PREMIUM_VOICE_DAILY_REQUEST_LIMIT || '1200', 10),
  },
};
const planCache = new Map();
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;

const cleanupExpiredPlanCache = (now) => {
  if (planCache.size > MAX_CACHE_ENTRIES) {
    for (const [userId, entry] of planCache) {
      if (entry.expiresAt <= now) planCache.delete(userId);
    }
    if (planCache.size > MAX_CACHE_ENTRIES) {
      const keysToDelete = Array.from(planCache.keys()).slice(0, 1000);
      for (const k of keysToDelete) planCache.delete(k);
    }
  }
};

const getPlanLimit = async (userId, category, client) => {
  const now = Date.now();
  const cached = planCache.get(userId);
  if (cached && cached.expiresAt > now) return planLimits[cached.plan]?.[category] || limits[category];
  cleanupExpiredPlanCache(now);
  try {
    const { data, error } = await client.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle();
    const plan = !error && data?.subscription_tier ? String(data.subscription_tier).toLowerCase() : 'free';
    planCache.set(userId, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
    return planLimits[plan]?.[category] || limits[category];
  } catch {
    return limits[category];
  }
};

export const resetUsageQuotaCounters = () => {
  counters.clear();
  planCache.clear();
};

const getClientKey = (req, category) => {
  const identity = req.user?.id || req.ip || 'anonymous';
  return `${category}:${identity}`;
};

export const usageQuota = (category, options = {}) => {
  const configuredLimit = Number.isFinite(options.limit) ? options.limit : limits[category];
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const counterStore = options.counterStore || counters;
  const nowProvider = options.now || Date.now;
  const quotaClient = options.client || supabaseAdmin;

  return async (req, res, next) => {
    const limit = req.user?.id && !Number.isFinite(options.limit)
      ? await getPlanLimit(req.user.id, category, quotaClient)
      : configuredLimit;
    const key = getClientKey(req, category);
    const now = nowProvider();

    // 1. Distributed Redis quota (primary path when Redis is configured and no mock counterStore is provided)
    const redis = getRedisClient();
    if (redis && !options.counterStore) {
      try {
        const redisKey = req.user?.id
          ? `usage:user:${req.user.id}:${category}:${Math.floor(now / windowMs)}`
          : `usage:${key}:${Math.floor(now / windowMs)}`;
        const redisCount = await redis.incr(redisKey);
        if (redisCount === 1) await redis.expire(redisKey, Math.ceil(windowMs / 1000));
        if (redisCount > limit) {
          const retryAfter = Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1000));
          res.setHeader('Retry-After', retryAfter);
          return res.status(429).json({
            error: `${category} usage limit reached. Please try again later.`,
            code: 'USAGE_LIMIT_EXCEEDED',
            retryAfter,
          });
        }

        // For authenticated users, verify against persistent Supabase RPC quota
        if (req.user?.id) {
          const windowStartedAt = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
          try {
            const { data, error } = await quotaClient.rpc('consume_usage_quota', {
              user_id_input: req.user.id,
              category_input: category,
              window_started_at_input: windowStartedAt,
              limit_input: limit,
            });
            if (!error && data?.[0] && !data[0].allowed) {
              return res.status(429).json({
                error: `${category} usage limit reached. Please try again later.`,
                code: 'USAGE_LIMIT_EXCEEDED',
              });
            }
          } catch (error) {
            logger.warn('Persistent usage quota unavailable; using distributed redis guardrail', {
              category,
              error: error.message,
            });
          }
        }

        res.setHeader('X-Usage-Limit', limit);
        res.setHeader('X-Usage-Remaining', Math.max(0, limit - redisCount));
        return next();
      } catch (error) {
        logger.warn('Distributed usage quota unavailable; using local guardrail', {
          category,
          error: error.message,
        });
      }
    }

    // 2. Local bounded in-memory fallback (offline / tests / Redis outage)
    const current = counterStore.get(key);
    const entry = current && now - current.startedAt < windowMs
      ? current
      : { startedAt: now, count: 0 };

    if (entry.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.startedAt + windowMs - now) / 1000));
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `${category} usage limit reached. Please try again later.`,
        code: 'USAGE_LIMIT_EXCEEDED',
        retryAfter,
      });
    }

    entry.count += 1;
    counterStore.set(key, entry);
    res.setHeader('X-Usage-Limit', limit);
    res.setHeader('X-Usage-Remaining', Math.max(0, limit - entry.count));

    // Active eviction: cap maximum in-memory store size to 1,000 entries
    // to strictly prevent memory leaks under sustained traffic
    if (counterStore.size > 1000) {
      for (const [counterKey, counter] of counterStore) {
        if (now - counter.startedAt >= windowMs) counterStore.delete(counterKey);
      }
      if (counterStore.size > 1000) {
        const excessKeys = Array.from(counterStore.keys()).slice(0, 200);
        for (const k of excessKeys) {
          counterStore.delete(k);
        }
      }
    }

    if (req.user?.id) {
      const windowStartedAt = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
      try {
        const { data, error } = await quotaClient.rpc('consume_usage_quota', {
          user_id_input: req.user.id,
          category_input: category,
          window_started_at_input: windowStartedAt,
          limit_input: limit,
        });
        if (!error && data?.[0] && !data[0].allowed) {
          return res.status(429).json({
            error: `${category} usage limit reached. Please try again later.`,
            code: 'USAGE_LIMIT_EXCEEDED',
          });
        }
      } catch (error) {
        logger.warn('Persistent usage quota unavailable; using local guardrail', {
          category,
          error: error.message,
        });
      }
    }

    logger.debug('Usage quota consumed', { category, remaining: limit - entry.count });
    return next();
  };
};
