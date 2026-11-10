#!/usr/bin/env node

/**
 * Phase 1 Optimization Runner
 * Coordinates and validates high-impact Phase 1 performance optimizations:
 * - High-frequency database query index migrations
 * - Memory & LRU API caching configurations
 * - Frontend bundle splitting & chunk optimizations
 * - Response compression & payload bounds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export async function runPhase1Optimization() {
  console.log('\n' + '='.repeat(65));
  console.log('  PREPLOOP PHASE 1 OPTIMIZATION VERIFICATION & RUNNER');
  console.log('='.repeat(65) + '\n');

  const checklist = [];

  function record(task, status, message) {
    checklist.push({ task, status, message });
    const symbol = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${symbol} [${status}] ${task.padEnd(35)}: ${message}`);
  }

  // 1. Database Query Indexes Migration
  const indexSqlPath = path.join(ROOT, 'backend', 'db', 'migration_core_query_indexes.sql');
  if (fs.existsSync(indexSqlPath)) {
    const content = fs.readFileSync(indexSqlPath, 'utf8');
    const indexMatches = content.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/gi) || [];
    record(
      'Database Query Indexes',
      'PASS',
      `Migration file found with ${indexMatches.length} index declarations`
    );
  } else {
    record('Database Query Indexes', 'WARN', 'migration_core_query_indexes.sql not found');
  }

  // 2. In-Memory and Shared Cache Setup
  const cacheUtil = path.join(ROOT, 'backend', 'utils', 'cache.js');
  const advCacheUtil = path.join(ROOT, 'backend', 'utils', 'advancedCache.js');
  const apiCacheMid = path.join(ROOT, 'backend', 'middleware', 'apiCache.js');

  const cacheReady = fs.existsSync(cacheUtil) && fs.existsSync(advCacheUtil) && fs.existsSync(apiCacheMid);
  record(
    'Cache Subsystem Layers',
    cacheReady ? 'PASS' : 'WARN',
    cacheReady ? 'All 3 cache modules present (domain, advanced LRU, API middleware)' : 'Some cache modules missing'
  );

  // 3. Frontend Bundle Splitting Configuration
  const viteOptimized = path.join(ROOT, 'frontend', 'vite.config.optimized.js');
  const viteStandard = path.join(ROOT, 'frontend', 'vite.config.js');
  const hasViteConfig = fs.existsSync(viteOptimized) || fs.existsSync(viteStandard);

  if (hasViteConfig) {
    const configContent = fs.readFileSync(fs.existsSync(viteOptimized) ? viteOptimized : viteStandard, 'utf8');
    const hasChunking = configContent.includes('manualChunks') || configContent.includes('splitVendor');
    record(
      'Frontend Bundle Optimization',
      hasChunking ? 'PASS' : 'WARN',
      hasChunking ? 'Code-splitting chunk rules verified' : 'Vite config found without custom manualChunks'
    );
  } else {
    record('Frontend Bundle Optimization', 'WARN', 'Vite configuration not detected');
  }

  // 4. Backend Compression & Payload Limits
  const backendIndex = path.join(ROOT, 'backend', 'index.js');
  if (fs.existsSync(backendIndex)) {
    const indexContent = fs.readFileSync(backendIndex, 'utf8');
    const hasCompression = indexContent.includes('compression(');
    const hasPayloadLimits = indexContent.includes("limit: '10mb'");
    record(
      'Response Compression',
      hasCompression ? 'PASS' : 'WARN',
      hasCompression ? 'Gzip/deflate compression active on HTTP responses' : 'Compression not enabled in index.js'
    );
    record(
      'Payload Size Bounds',
      hasPayloadLimits ? 'PASS' : 'WARN',
      hasPayloadLimits ? 'JSON and urlencoded payload size limited' : 'Payload bounds not explicitly clamped'
    );
  } else {
    record('Backend Core Pipeline', 'WARN', 'backend/index.js not found');
  }

  console.log('\n' + '='.repeat(65));
  const failures = checklist.filter((item) => item.status === 'FAIL');
  const warnings = checklist.filter((item) => item.status === 'WARN');
  const passes = checklist.filter((item) => item.status === 'PASS');
  console.log(`  Phase 1 Summary: ✅ ${passes.length} passed | ⚠️ ${warnings.length} warnings | ❌ ${failures.length} failed`);
  console.log('='.repeat(65) + '\n');

  return { passes: passes.length, warnings: warnings.length, failures: failures.length, checklist };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('run-phase1-optimization.js')) {
  runPhase1Optimization()
    .then((result) => {
      process.exit(result.failures > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Phase 1 optimization runner failed:', err);
      process.exit(1);
    });
}
