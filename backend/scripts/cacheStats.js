#!/usr/bin/env node

/**
 * Cache Statistics Utility
 * Collects and reports performance metrics across all backend caching layers:
 * - API Middleware L1 Cache
 * - Domain entity caches (Problems, Companies, System Design)
 * - Advanced LRU/TTL Cache
 */

import { problemCache, companyCache, systemDesignCache } from '../utils/cache.js';
import advancedCache from '../utils/advancedCache.js';
import { getCacheStats as getApiCacheStats } from '../middleware/apiCache.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('cache-stats');

export async function collectCacheStats() {
  const memoryUsage = process.memoryUsage();

  const domainCaches = {
    problems: {
      size: typeof problemCache?.size === 'function' ? problemCache.size() : 0,
      maxSize: problemCache?.maxSize || 1000,
      ttlMs: problemCache?.ttlMs || 300000,
    },
    companies: {
      size: typeof companyCache?.size === 'function' ? companyCache.size() : 0,
      maxSize: companyCache?.maxSize || 1000,
      ttlMs: companyCache?.ttlMs || 300000,
    },
    systemDesign: {
      size: typeof systemDesignCache?.size === 'function' ? systemDesignCache.size() : 0,
      maxSize: systemDesignCache?.maxSize || 1000,
      ttlMs: systemDesignCache?.ttlMs || 300000,
    },
  };

  const advStats = typeof advancedCache?.getStats === 'function'
    ? advancedCache.getStats()
    : { hits: 0, misses: 0, hitRate: '100%', keys: 0 };

  const apiStatsRaw = typeof getApiCacheStats === 'function' ? getApiCacheStats() : { local: { size: 0 } };
  const sharedStats = await Promise.resolve(apiStatsRaw.shared).catch(() => ({}));

  return {
    timestamp: new Date().toISOString(),
    processMemory: {
      rssMB: Math.round(memoryUsage.rss / (1024 * 1024) * 100) / 100,
      heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024) * 100) / 100,
      heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024) * 100) / 100,
    },
    domainCaches,
    advancedCache: advStats,
    apiCache: {
      localSize: apiStatsRaw.local?.size || 0,
      sharedStatus: sharedStats?.status || 'active',
    },
  };
}

export async function printCacheStatsReport() {
  const stats = await collectCacheStats();

  console.log('\n' + '='.repeat(60));
  console.log('  PREPLOOP CACHE STATISTICS REPORT');
  console.log('='.repeat(60));
  console.log(`  Timestamp: ${stats.timestamp}\n`);

  console.log('  📦 Domain Memory Caches:');
  for (const [name, info] of Object.entries(stats.domainCaches)) {
    console.log(`     - ${name.padEnd(14)}: ${info.size} / ${info.maxSize} entries (TTL: ${info.ttlMs / 1000}s)`);
  }

  console.log('\n  ⚡ Advanced LRU/TTL Cache:');
  console.log(`     - Cached Keys  : ${stats.advancedCache.keys}`);
  console.log(`     - Cache Hits   : ${stats.advancedCache.hits}`);
  console.log(`     - Cache Misses : ${stats.advancedCache.misses}`);
  console.log(`     - Hit Rate     : ${stats.advancedCache.hitRate}`);

  console.log('\n  🌐 API Route Cache:');
  console.log(`     - Local Entries: ${stats.apiCache.localSize}`);
  console.log(`     - Shared Status: ${stats.apiCache.sharedStatus}`);

  console.log('\n  💾 Process Memory:');
  console.log(`     - RSS          : ${stats.processMemory.rssMB} MB`);
  console.log(`     - Heap Used    : ${stats.processMemory.heapUsedMB} MB / ${stats.processMemory.heapTotalMB} MB`);

  console.log('='.repeat(60) + '\n');
  logger.info('Cache statistics collected successfully', { stats });
  return stats;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cacheStats.js')) {
  printCacheStatsReport()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to generate cache stats:', err);
      process.exit(1);
    });
}
