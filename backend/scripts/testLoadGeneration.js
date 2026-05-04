/**
 * Load Testing: Plan Generation
 * Simulates 100+ concurrent plan generation requests
 * Measures throughput, latency distribution, and bottlenecks
 */

import { performance } from 'perf_hooks';
import { improvementPlanService } from '../services/improvementPlanService.js';

async function generateMockUserData(count) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `load-test-user-${i}`,
    profile: {
      skillLevel: ['beginner', 'intermediate', 'advanced'][i % 3],
      targetRole: ['Engineer', 'Senior Engineer', 'Architect'][i % 3]
    },
    interviewHistory: Array.from({ length: 5 }, (_, j) => ({
      id: `interview-${i}-${j}`,
      score: 6 + Math.random() * 4,
      timestamp: Date.now() - j * 86400000
    }))
  }));
}

async function runLoadTest(concurrency, duration = 30000) {
  console.log(`\n⚡ LOAD TEST: ${concurrency} Concurrent Requests`);
  console.log('================================================\n');

  const users = await generateMockUserData(concurrency);
  const results = {
    successful: 0,
    failed: 0,
    latencies: [],
    startTime: Date.now(),
    requests: 0
  };

  const startTime = performance.now();

  // Run concurrent requests
  const promises = users.map(async (user) => {
    const reqStart = performance.now();
    try {
      await improvementPlanService.generatePlan(user.userId, {
        focusAreas: ['arrays', 'strings', 'trees'],
        lazyMode: true
      });
      const reqDuration = performance.now() - reqStart;
      results.successful++;
      results.latencies.push(reqDuration);
      results.requests++;
    } catch (err) {
      results.failed++;
      console.error(`User ${user.userId} failed:`, err.message);
    }
  });

  // Wait for all requests to complete
  await Promise.all(promises);

  const totalTime = performance.now() - startTime;

  // Calculate statistics
  const sortedLatencies = results.latencies.sort((a, b) => a - b);
  const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
  const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
  const throughput = (results.successful / (totalTime / 1000)).toFixed(2);

  console.log('📊 Results:');
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Successful: ${results.successful}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Throughput: ${throughput} req/sec`);
  console.log(`\n⏱️ Latency:');
  console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`  P50 (median): ${p50.toFixed(2)}ms`);
  console.log(`  P95: ${p95.toFixed(2)}ms`);
  console.log(`  P99: ${p99.toFixed(2)}ms`);
  console.log(`  Max: ${Math.max(...results.latencies).toFixed(2)}ms`);

  // Health check
  const failureRate = (results.failed / concurrency * 100).toFixed(1);
  const p95Target = 2000; // 2 seconds acceptable for p95
  const status = results.failed === 0 && p95 < p95Target ? '✅ PASS' : '⚠️ WARN';

  console.log(`\n${status}`);
  console.log(`  Failure rate: ${failureRate}%`);
  console.log(`  P95 target: <2000ms - ${p95 < p95Target ? '✅' : '⚠️'}`);

  return {
    concurrency,
    successful: results.successful,
    failed: results.failed,
    throughput,
    avgLatency: avgLatency.toFixed(2),
    p50,
    p95,
    p99,
    status: status.includes('PASS') ? 'pass' : 'warn'
  };
}

async function runAllLoadTests() {
  console.log('\n🚀 LOAD TESTING: IMPROVEMENT PLAN GENERATION');
  console.log('==============================================');

  const testConfigs = [
    { concurrency: 10, name: 'Light Load' },
    { concurrency: 50, name: 'Medium Load' },
    { concurrency: 100, name: 'Heavy Load' }
  ];

  const allResults = [];

  for (const config of testConfigs) {
    console.log(`\n\n${config.name}`);
    console.log('-'.repeat(40));

    const result = await runLoadTest(config.concurrency);
    allResults.push({ ...result, name: config.name });

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n📋 SUMMARY');
  console.log('==========\n');

  allResults.forEach(r => {
    console.log(`${r.name}:`);
    console.log(`  Throughput: ${r.throughput} req/sec`);
    console.log(`  P95 Latency: ${r.p95.toFixed(2)}ms`);
    console.log(`  Failures: ${r.failed}`);
    console.log(`  Status: ${r.status.toUpperCase()}\n`);
  });

  const allPass = allResults.every(r => r.status === 'pass');
  console.log(`\n🎯 Overall: ${allPass ? '✅ PASS' : '⚠️ WARN'}`);

  process.exit(allPass ? 0 : 1);
}

// Run load tests
runAllLoadTests().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
