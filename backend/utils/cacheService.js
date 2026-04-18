import { createLogger } from './structuredLogger.js';

const logger = createLogger('cache-service');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
    this.maxSize = 1000;
  }

  set(key, value, ttlSeconds = 300) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.ttls.delete(firstKey);
    }

    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + ttlSeconds * 1000);
    
    logger.debug('Cache set', { key, ttl: ttlSeconds });
  }

  get(key) {
    const ttl = this.ttls.get(key);
    
    if (!ttl || Date.now() > ttl) {
      this.cache.delete(key);
      this.ttls.delete(key);
      logger.debug('Cache miss or expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
    logger.debug('Cache deleted', { key });
  }

  clear() {
    this.cache.clear();
    this.ttls.clear();
    logger.info('Cache cleared');
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, ttl] of this.ttls.entries()) {
      if (now > ttl) {
        this.cache.delete(key);
        this.ttls.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { cleaned });
    }
  }
}

const cacheService = new CacheService();

// Cleanup expired entries every 5 minutes
setInterval(() => cacheService.cleanup(), 5 * 60 * 1000);

export default cacheService;
