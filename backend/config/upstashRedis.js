import { Redis } from '@upstash/redis';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('UpstashRedis');

let upstashClient = null;

/**
 * Get or initialize the Upstash Redis REST client instance.
 * Returns null if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset or initialization fails.
 * @returns {Redis|null}
 */
export const getUpstashRedisClient = () => {
  if (upstashClient) return upstashClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    upstashClient = new Redis({
      url,
      token,
    });
    return upstashClient;
  } catch (err) {
    logger.warn('Failed to initialize Upstash Redis client', { error: err.message });
    return null;
  }
};

/**
 * Reset client (useful for unit testing)
 */
export const resetUpstashClient = () => {
  upstashClient = null;
};

export default {
  getUpstashRedisClient,
  resetUpstashClient,
};
