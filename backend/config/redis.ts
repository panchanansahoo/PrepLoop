import { createClient, type RedisClientType } from 'redis';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Redis-Config');

let redisClient: RedisClientType | null = null;

/**
 * Initialize and connect to Redis
 * @returns Connected Redis client or null
 */
export const initializeRedis = async (): Promise<RedisClientType | null> => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL,
      }) as RedisClientType;

      redisClient.on('error', (err: Error) => {
        logger.error('Redis Client Error', { error: err.message });
      });

      redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
      });

      redisClient.on('ready', () => {
        logger.info('Redis Client Ready');
      });

      await redisClient.connect();
      logger.info('Redis initialized successfully');
    } else {
      logger.warn('REDIS_URL not found, caching will be disabled');
    }
  } catch (error: any) {
    logger.error('Failed to initialize Redis', { error: error.message });
    redisClient = null;
  }

  return redisClient;
};

/**
 * Get the Redis client instance
 * @returns Redis client or null if not initialized
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Gracefully close the Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error: any) {
      logger.error('Error closing Redis connection', { error: error.message });
    } finally {
      redisClient = null;
    }
  }
};

/**
 * Check if Redis is connected and healthy
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  if (!redisClient) return false;
  try {
    const ping = await redisClient.ping();
    return ping === 'PONG';
  } catch {
    return false;
  }
};

