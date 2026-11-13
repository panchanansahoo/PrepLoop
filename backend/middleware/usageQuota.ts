import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { getRedisClient } from '../config/redis.ts';

const logger = createLogger('usage-quota');

export interface CacheEntry<T = any> {
  expiresAt: number;
  [key: string]: any;
}

export interface QuotaEntry {
  startedAt: number;
  count: number;
  expiresAt?: number;
}

export class BoundedTtlStore<T = any> {
  private maxEntries: number;
  private map: Map<string, T & { expiresAt?: number }>;

  constructor(maxEntries: number = 5000) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  get(key: string): (T & { expiresAt?: number }) | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry;
  }

  set(key: string, value: T, ttlMs: number = 86400000): T & { expiresAt: number } {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) this.map.delete(oldestKey);
    }
    const entry: any = typeof value === 'object' && value !== null
      ? { ...value, expiresAt: Date.now() + ttlMs }
      : { val: value, expiresAt: Date.now() + ttlMs };
    this.map.set(key, entry);
    return entry;
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  [Symbol.iterator](): IterableIterator<[string, T & { expiresAt?: number }]> {
    return this.map[Symbol.iterator]();
  }

  keys(): IterableIterator<string> {
    return this.map.keys();
  }
}

const defaultCounterStore = new BoundedTtlStore<QuotaEntry>(5000);
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface QuotaLimits {
  [category: string]: number;
}

const limits: QuotaLimits = {
  ai: Number.parseInt(process.env.AI_DAILY_REQUEST_LIMIT || '100', 10),
  voice: Number.parseInt(process.env.VOICE_DAILY_REQUEST_LIMIT || '60', 10),
};

const planLimits: Record<string, QuotaLimits> = {
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

const planCache = new BoundedTtlStore<{ plan: string }>(2000);
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

const getPlanLimit = async (userId: string, category: string, client: any): Promise<number> => {
  const cached = planCache.get(userId);
  if (cached?.plan) return planLimits[cached.plan]?.[category] || limits[category] || 100;
  try {
    const { data, error } = await client.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle();
    const plan = !error && data?.subscription_tier ? String(data.subscription_tier).toLowerCase() : 'free';
    planCache.set(userId, { plan }, PLAN_CACHE_TTL_MS);
    return planLimits[plan]?.[category] || limits[category] || 100;
  } catch {
    return limits[category] || 100;
  }
};

export const resetUsageQuotaCounters = (): void => {
  defaultCounterStore.clear();
  planCache.clear();
};

const getClientKey = (req: Request, category: string): string => {
  const identity = req.user?.id || req.ip || 'anonymous';
  return `${category}:${identity}`;
};

export interface UsageQuotaOptions {
  limit?: number;
  windowMs?: number;
  counterStore?: BoundedTtlStore<QuotaEntry>;
  now?: () => number;
  client?: any;
}

export const usageQuota = (category: string, options: UsageQuotaOptions = {}) => {
  const configuredLimit = typeof options.limit === 'number' && Number.isFinite(options.limit)
    ? options.limit
    : limits[category] || 100;
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const counterStore = options.counterStore || defaultCounterStore;
  const nowProvider = options.now || Date.now;
  const quotaClient = options.client || supabaseAdmin;

  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const limit = req.user?.id && (!options.limit || !Number.isFinite(options.limit))
      ? await getPlanLimit(req.user.id, category, quotaClient)
      : configuredLimit;
    const key = getClientKey(req, category);
    const now = nowProvider();

    // 1. Distributed Redis quota
    const redis = getRedisClient();
    if (process.env.NODE_ENV === 'production' && !redis && !options.counterStore) {
      logger.error('CRITICAL: Redis is required in production for distributed usage quota counters. In-memory fallback active.');
      if (process.env.ENFORCE_REDIS_QUOTA === 'true') {
        return res.status(503).json({
          error: 'Rate limiting service unavailable. Distributed Redis required in production.',
          code: 'REDIS_QUOTA_UNAVAILABLE',
        });
      }
    }
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

        if (req.user?.id) {
          const windowStartedAt = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
          try {
            const { data, error } = await quotaClient.rpc('consume_usage_quota', {
              user_id_input: req.user.id,
              category_input: category,
              window_started_at_input: windowStartedAt,
              limit_input: limit,
            });
            const rpcResult = Array.isArray(data) ? data[0] : data;
            if (!error && rpcResult && rpcResult.allowed === false) {
              return res.status(429).json({
                error: `${category} usage limit reached. Please try again later.`,
                code: 'USAGE_LIMIT_EXCEEDED',
              });
            }
          } catch (error: any) {
            logger.warn('Persistent usage quota unavailable; using distributed redis guardrail', {
              category,
              error: error?.message,
            });
          }
        }

        res.setHeader('X-Usage-Limit', limit);
        res.setHeader('X-Usage-Remaining', Math.max(0, limit - redisCount));
        return next();
      } catch (error: any) {
        logger.warn('Distributed usage quota unavailable; using local guardrail', {
          category,
          error: error?.message,
        });
      }
    }

    // 2. Local bounded in-memory fallback
    const current = counterStore.get(key);
    const entry: QuotaEntry = current && now - current.startedAt < windowMs
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
        const rpcResult = Array.isArray(data) ? data[0] : data;
        if (!error && rpcResult && rpcResult.allowed === false) {
          return res.status(429).json({
            error: `${category} usage limit reached. Please try again later.`,
            code: 'USAGE_LIMIT_EXCEEDED',
          });
        }
      } catch (error: any) {
        logger.warn('Persistent usage quota unavailable; using local guardrail', {
          category,
          error: error?.message,
        });
      }
    }

    logger.debug('Usage quota consumed', { category, remaining: limit - entry.count });
    return next();
  };
};

