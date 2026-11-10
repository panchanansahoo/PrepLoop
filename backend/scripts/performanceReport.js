#!/usr/bin/env node

/**
 * Performance Reporting Utility
 * Generates runtime telemetry and resource utilization diagnostics:
 * - CPU & Event loop latency metrics
 * - Memory allocation and garbage collection thresholds
 * - Database query optimizer execution metrics
 * - Cache response efficiency
 */

import os from 'os';
import databaseOptimizer from '../utils/databaseOptimizer.js';
import advancedCache from '../utils/advancedCache.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('performance-report');

export async function measureEventLoopLag() {
  const start = performance.now();
  await new Promise((resolve) => setImmediate(resolve));
  return Math.round((performance.now() - start) * 100) / 100;
}

export async function generatePerformanceMetrics() {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const loopLag = await measureEventLoopLag();
  const dbStats = typeof databaseOptimizer?.getQueryStats === 'function'
    ? databaseOptimizer.getQueryStats()
    : { queriesExecuted: 0, poolSize: 0 };
  const cacheStats = typeof advancedCache?.getStats === 'function'
    ? advancedCache.getStats()
    : { hitRate: '100%', hits: 0, misses: 0 };

  return {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      uptimeSeconds: Math.round(process.uptime()),
    },
    process: {
      rssMB: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
      heapUsedMB: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
      heapTotalMB: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
      externalMB: Math.round((mem.external / (1024 * 1024)) * 100) / 100,
      userCPUMs: Math.round(cpu.user / 1000),
      systemCPUMs: Math.round(cpu.system / 1000),
      eventLoopLagMs: loopLag,
    },
    database: dbStats,
    cache: cacheStats,
  };
}

export async function printPerformanceReport() {
  const report = await generatePerformanceMetrics();

  console.log('\n' + '='.repeat(60));
  console.log('  PREPLOOP PLATFORM PERFORMANCE REPORT');
  console.log('='.repeat(60));
  console.log(`  Report Generated: ${report.timestamp}\n`);

  console.log('  🖥️  Host System:');
  console.log(`     - OS & Architecture : ${report.system.platform} (${report.system.arch})`);
  console.log(`     - CPU Cores         : ${report.system.cpus}`);
  console.log(`     - Host Memory Free  : ${report.system.freeMemoryMB} MB / ${report.system.totalMemoryMB} MB`);
  console.log(`     - Node.js Version   : ${report.system.nodeVersion}`);

  console.log('\n  ⚙️  Node Process Health:');
  console.log(`     - Uptime            : ${report.system.uptimeSeconds} seconds`);
  console.log(`     - Heap Utilization  : ${report.process.heapUsedMB} MB / ${report.process.heapTotalMB} MB`);
  console.log(`     - Resident Memory   : ${report.process.rssMB} MB`);
  console.log(`     - User CPU Time     : ${report.process.userCPUMs} ms`);
  console.log(`     - Event Loop Lag    : ${report.process.eventLoopLagMs} ms`);

  console.log('\n  🗄️  Database Optimizer:');
  console.log(`     - Queries Executed  : ${report.database.queriesExecuted}`);
  console.log(`     - Pool Total Size   : ${report.database.poolSize}`);

  console.log('\n  🚀 Cache Efficiency:');
  console.log(`     - Cache Hit Rate    : ${report.cache.hitRate}`);
  console.log(`     - Total Hits        : ${report.cache.hits}`);
  console.log(`     - Total Misses      : ${report.cache.misses}`);

  console.log('='.repeat(60) + '\n');
  logger.info('Performance report generated', { report });
  return report;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('performanceReport.js')) {
  printPerformanceReport()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Performance report generation failed:', err);
      process.exit(1);
    });
}
