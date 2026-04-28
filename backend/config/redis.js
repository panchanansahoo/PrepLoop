import { createClient } from 'redis';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Redis-Config');

let redisClient = null;

/**
 * Initialize and connect to Redis
 * @returns {Promise<RedisClient>} Connected Redis client
 */
export const initializeRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL
      });

      redisClient.on('error', (err) => {
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
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    redisClient = null;
  }

  return redisClient;
};

/**
 * Get the Redis client instance
 * @returns {RedisClient|null} Redis client or null if not initialized
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Gracefully close the Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message });
    }
  }
};

export default {
  initializeRedis,
  getRedisClient,
  closeRedis
};