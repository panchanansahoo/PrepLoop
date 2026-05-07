#!/usr/bin/env node

/**
 * Cache Statistics Reporter
 * Displays Redis cache performance metrics and configuration
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('📊 Cache Configuration Check\n');
console.log('=' .repeat(60));

// Check environment variables
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const legacyRedisUrl = process.env.REDIS_URL;

console.log('\n🔍 Environment Variables:');
console.log(`  UPSTASH_REDIS_REST_URL: ${upstashUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  UPSTASH_REDIS_REST_TOKEN: ${upstashToken ? '✅ Set' : '❌ Missing'}`);
console.log(`  REDIS_URL (legacy): ${legacyRedisUrl ? '✅ Set' : '❌ Missing'}`);

if (!upstashUrl && !legacyRedisUrl) {
  console.log('\n⚠️  No Redis configuration found.');
  console.log('   Cache will operate in memory-only mode.');
  console.log('   To enable Redis caching, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  console.log('\n   Get your credentials at: https://upstash.com');
  console.log('\n   Example .env configuration:');
  console.log('   UPSTASH_REDIS_REST_URL=https://your-app.upstash.io');
  console.log('   UPSTASH_REDIS_REST_TOKEN=your-token-here');
} else {
  console.log('\n✅ Redis configuration detected');
  
  // Try to connect and get stats
  try {
    const { default: cacheManager } = await import('../utils/cacheManager.js');
    await cacheManager.connect();
    
    console.log(`\n🔌 Connection Status: ${cacheManager.isConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (cacheManager.isConnected) {
      const stats = await cacheManager.getStats();
      const metrics = cacheManager.getMetrics();
      
      console.log('\n📈 Cache Statistics:');
      console.log(`  Memory Cache Size: ${stats.memoryCache.size}/${stats.memoryCache.maxSize} entries`);
      console.log(`  Redis Connected: ${stats.redis.connected}`);
      console.log(`  Using Upstash: ${stats.redis.isUpstash}`);
      console.log(`  Total Commands: ${stats.redis.commandCount}`);
      
      if (stats.redis.dbSize !== undefined) {
        console.log(`  Database Size: ${stats.redis.dbSize} keys`);
      }
      
      console.log('\n🎯 Performance Metrics:');
      console.log(`  Hit Rate: ${metrics.hitRate}%`);
      console.log(`  Redis Hit Rate: ${metrics.redisHitRate}%`);
      console.log(`  Compression Ratio: ${metrics.compressionRatio}%`);
      console.log(`  Total Hits: ${metrics.hits}`);
      console.log(`  Total Misses: ${metrics.misses}`);
      
      console.log('\n💡 Recommendations:');
      if (metrics.hitRate < 50) {
        console.log('  ⚠️  Low cache hit rate. Consider:');
        console.log('     - Increasing cache TTLs');
        console.log('     - Caching more frequently accessed data');
        console.log('     - Reviewing cache invalidation patterns');
      } else {
        console.log('  ✅ Cache hit rate is healthy');
      }
      
      if (stats.memoryCache.size > stats.memoryCache.maxSize * 0.9) {
        console.log('  ⚠️  Memory cache near capacity. Consider increasing maxMemoryCacheSize');
      }
    } else {
      console.log('\n⚠️  Could not connect to Redis.');
      console.log('   Check your credentials and network connectivity.');
    }
  } catch (error) {
    console.error('\n❌ Error checking cache:', error.message);
    console.log('\n   This is expected if cacheManager module has dependencies issues.');
    console.log('   You can still use the application with memory-only caching.');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Cache check complete!\n');
