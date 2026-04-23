import { createClient } from 'redis';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('redis-cache');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useRedis = process.env.REDIS_URL && process.env.USE_REDIS === 'true';
  }

  async connect() {
    if (!this.useRedis) {
      logger.info('Redis disabled, using in-memory cache');
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (err) {
      logger.error('Failed to connect to Redis', { error: err.message });
      this.useRedis = false;
    }
  }

  async get(key) {
    if (!this.useRedis || !this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug('Redis cache hit', { key });
        return JSON.parse(value);
      }
      logger.debug('Redis cache miss', { key });
      return null;
    } catch (err) {
      logger.error('Redis get error', { key, error: err.message });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 600) {
    if (!this.useRedis || !this.isConnected) return false;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      logger.debug('Redis cache set', { key, ttl: ttlSeconds });
      return true;
    } catch (err) {
      logger.error('Redis set error', { key, error: err.message });
      return false;
    }
  }

  async delete(key) {
    if (!this.useRedis || !this.isConnected) return false;

    try {
      await this.client.del(key);
      logger.debug('Redis cache delete', { key });
      return true;
    } catch (err) {
      logger.error('Redis delete error', { key, error: err.message });
      return false;
    }
  }

  async clear(pattern = '*') {
    if (!this.useRedis || !this.isConnected) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('Redis cache cleared', { pattern, count: keys.length });
        return keys.length;
      }
      return 0;
    } catch (err) {
      logger.error('Redis clear error', { pattern, error: err.message });
      return 0;
    }
  }

  async exists(key) {
    if (!this.useRedis || !this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      logger.error('Redis exists error', { key, error: err.message });
      return false;
    }
  }

  async ttl(key) {
    if (!this.useRedis || !this.isConnected) return -1;

    try {
      return await this.client.ttl(key);
    } catch (err) {
      logger.error('Redis ttl error', { key, error: err.message });
      return -1;
    }
  }

  async increment(key, amount = 1) {
    if (!this.useRedis || !this.isConnected) return null;

    try {
      return await this.client.incrBy(key, amount);
    } catch (err) {
      logger.error('Redis increment error', { key, error: err.message });
      return null;
    }
  }

  async getStats() {
    if (!this.useRedis || !this.isConnected) {
      return { connected: false, mode: 'memory' };
    }

    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbSize();
      
      return {
        connected: true,
        mode: 'redis',
        dbSize,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {})
      };
    } catch (err) {
      logger.error('Redis stats error', { error: err.message });
      return { connected: false, error: err.message };
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }
}

export const redisCache = new RedisCache();

// Initialize on module load
redisCache.connect().catch(err => {
  logger.error('Redis initialization failed', { error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisCache.disconnect();
});

process.on('SIGINT', async () => {
  await redisCache.disconnect();
});

export default redisCache;
