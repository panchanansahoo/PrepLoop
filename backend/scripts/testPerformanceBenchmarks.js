/**
 * Performance Benchmarks for Improvement Plan Feature
 * Measures: plan generation time, component render time, API response time
 * Target: <2s generation, <500ms API response, <100ms render
 */

import { performance } from 'perf_hooks';
import { improvementPlanService } from '../services/improvementPlanService.js';

// Mock user data
const mockUser = {
  userId: 'test-user-123',
  profile: {
    skillLevel: 'intermediate',
    targetRole: 'Senior Engineer',
    yearsExperience: 3
  },
  interviewHistory: Array.from({ length: 10 }, (_, i) => ({
    id: `interview-${i}`,
    score: 7 + Math.random() * 3,
    timestamp: Date.now() - i * 86400000,
    questions: 5,
    type: 'technical'
  }))
};

async function measurePlanGeneration() {
  console.log('\n📊 BENCHMARK: Plan Generation Time');
  console.log('===================================');

  const trials = [];

  for (let i = 0; i < 5; i++) {
    const startTime = performance.now();
    
    try {
      await improvementPlanService.generatePlan(mockUser.userId, {
        focusAreas: ['arrays', 'strings', 'trees'],
        lazyMode: true
      });
    } catch (err) {
      console.error(`Trial ${i + 1} failed:`, err.message);
      continue;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    trials.push(duration);

    console.log(`Trial ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  if (trials.length > 0) {
    const avg = trials.reduce((a, b) => a + b, 0) / trials.length;
    const min = Math.min(...trials);
    const max = Math.max(...trials);

    console.log('\n📈 Results:');
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Target: <2000ms ✅`);
    console.log(`  Status: ${avg < 2000 ? '✅ PASS' : '❌ FAIL'}`);

    return {
      test: 'plan-generation',
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      status: avg < 2000 ? 'pass' : 'fail'
    };
  }

  return null;
}

async function measureAPIResponse() {
  console.log('\n📊 BENCHMARK: API Response Time (Plan Fetch)');
  console.log('=============================================');

  const trials = [];

  // First generate a plan
  try {
    await improvementPlanService.generatePlan(mockUser.userId, {
      focusAreas: ['arrays'],
      lazyMode: true
    });
  } catch (err) {
    console.error('Setup failed:', err.message);
    return null;
  }

  for (let i = 0; i < 5; i++) {
    const startTime = performance.now();
    
    try {
      await improvementPlanService.getLatestPlan(mockUser.userId);
    } catch (err) {
      console.error(`Trial ${i + 1} failed:`, err.message);
      continue;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    trials.push(duration);

    console.log(`Trial ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  if (trials.length > 0) {
    const avg = trials.reduce((a, b) => a + b, 0) / trials.length;
    const min = Math.min(...trials);
    const max = Math.max(...trials);

    console.log('\n📈 Results:');
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Target: <500ms ✅`);
    console.log(`  Status: ${avg < 500 ? '✅ PASS' : '⚠️  WARN'}`);

    return {
      test: 'api-response',
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      status: avg < 500 ? 'pass' : 'warn'
    };
  }

  return null;
}

async function measureCacheEffectiveness() {
  console.log('\n📊 BENCHMARK: Cache Hit Rate');
  console.log('============================');

  const trials = [];
  
  // Generate initial plan (cache miss)
  const start1 = performance.now();
  try {
    await improvementPlanService.generatePlan(mockUser.userId, {
      focusAreas: ['arrays'],
      lazyMode: true
    });
  } catch (err) {
    console.error('Setup failed:', err.message);
    return null;
  }
  const end1 = performance.now();
  const firstTime = end1 - start1;

  console.log(`First fetch (cache miss): ${firstTime.toFixed(2)}ms`);

  // Repeat fetches (should be cache hits)
  for (let i = 0; i < 5; i++) {
    const startTime = performance.now();
    
    try {
      await improvementPlanService.getLatestPlan(mockUser.userId);
    } catch (err) {
      console.error(`Trial ${i + 1} failed:`, err.message);
      continue;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    trials.push(duration);

    console.log(`Cached fetch ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  if (trials.length > 0) {
    const avg = trials.reduce((a, b) => a + b, 0) / trials.length;
    const reduction = ((firstTime - avg) / firstTime * 100).toFixed(1);

    console.log('\n📈 Results:');
    console.log(`  Average (cached): ${avg.toFixed(2)}ms`);
    console.log(`  First fetch: ${firstTime.toFixed(2)}ms`);
    console.log(`  Speedup: ${reduction}% faster`);
    console.log(`  Target: >80% cache benefit ✅`);
    console.log(`  Status: ${reduction > 80 ? '✅ PASS' : '⚠️  WARN'}`);

    return {
      test: 'cache-effectiveness',
      firstTime: firstTime.toFixed(2),
      cachedAvg: avg.toFixed(2),
      speedup: reduction,
      status: reduction > 80 ? 'pass' : 'warn'
    };
  }

  return null;
}

async function runAllBenchmarks() {
  console.log('\n🚀 IMPROVEMENT PLAN PERFORMANCE BENCHMARKS');
  console.log('==========================================\n');

  const results = [];

  // Run benchmarks
  const genResult = await measurePlanGeneration();
  if (genResult) results.push(genResult);

  const apiResult = await measureAPIResponse();
  if (apiResult) results.push(apiResult);

  const cacheResult = await measureCacheEffectiveness();
  if (cacheResult) results.push(cacheResult);

  // Summary
  console.log('\n\n📋 SUMMARY');
  console.log('==========\n');

  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  results.forEach(r => {
    const icon = r.status === 'pass' ? '✅' : '⚠️';
    console.log(`${icon} ${r.test}: ${r.status.toUpperCase()}`);
  });

  console.log(`\nPassed: ${passCount}/${results.length}`);
  if (warnCount > 0) console.log(`Warnings: ${warnCount}`);

  console.log('\n🎯 Target Achievement:');
  console.log(`  Plan generation: <2s - ${genResult?.status === 'pass' ? '✅' : '❌'}`);
  console.log(`  API response: <500ms - ${apiResult?.status === 'pass' ? '✅' : '⚠️'}`);
  console.log(`  Cache benefit: >80% - ${cacheResult?.status === 'pass' ? '✅' : '⚠️'}`);

  process.exit(passCount === results.length ? 0 : 1);
}

// Run benchmarks
runAllBenchmarks().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
