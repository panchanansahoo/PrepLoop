import { performance } from 'perf_hooks';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('performance-test');

class PerformanceTest {
  constructor(name) {
    this.name = name;
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = performance.now();
    logger.info(`Test started: ${this.name}`);
  }

  end() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    logger.info(`Test completed: ${this.name}`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }

  addResult(operation, duration, success = true, metadata = {}) {
    this.results.push({
      operation,
      duration,
      success,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  getStats() {
    const durations = this.results.map(r => r.duration);
    const successful = this.results.filter(r => r.success);
    
    return {
      name: this.name,
      totalOperations: this.results.length,
      successfulOperations: successful.length,
      failedOperations: this.results.length - successful.length,
      successRate: this.results.length > 0 
        ? ((successful.length / this.results.length) * 100).toFixed(2) + '%'
        : '0%',
      avgDuration: durations.length > 0 
        ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms'
        : '0ms',
      minDuration: durations.length > 0 ? Math.min(...durations).toFixed(2) + 'ms' : '0ms',
      maxDuration: durations.length > 0 ? Math.max(...durations).toFixed(2) + 'ms' : '0ms',
      p50: this.getPercentile(durations, 0.5),
      p95: this.getPercentile(durations, 0.95),
      p99: this.getPercentile(durations, 0.99),
      totalDuration: this.endTime && this.startTime 
        ? (this.endTime - this.startTime).toFixed(2) + 'ms'
        : 'N/A',
    };
  }

  getPercentile(arr, percentile) {
    if (arr.length === 0) return '0ms';
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index].toFixed(2) + 'ms';
  }

  getResults() {
    return this.results;
  }
}

/**
 * Test database query performance
 */
export async function testDatabasePerformance() {
  const test = new PerformanceTest('Database Performance');
  test.start();

  try {
    const { supabaseAdmin } = await import('../db/supabaseClient.js');

    // Test 1: Simple select
    let start = performance.now();
    const { data: patterns } = await supabaseAdmin
      .from('patterns')
      .select('id, name')
      .limit(10);
    test.addResult('Simple SELECT (10 rows)', performance.now() - start, true, { rows: patterns?.length });

    // Test 2: Join query
    start = performance.now();
    const { data: problems } = await supabaseAdmin
      .from('problems')
      .select('*, patterns(name)')
      .limit(20);
    test.addResult('JOIN query (20 rows)', performance.now() - start, true, { rows: problems?.length });

    // Test 3: Aggregation
    start = performance.now();
    const { data: stats } = await supabaseAdmin
      .from('problems')
      .select('difficulty')
      .limit(100);
    test.addResult('Aggregation query (100 rows)', performance.now() - start, true, { rows: stats?.length });

    // Test 4: Complex filter
    start = performance.now();
    const { data: filtered } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('difficulty', 'Medium')
      .limit(50);
    test.addResult('Filtered query (50 rows)', performance.now() - start, true, { rows: filtered?.length });

  } catch (error) {
    logger.error('Database performance test failed', { error: error.message });
    test.addResult('Database test', 0, false, { error: error.message });
  }

  test.end();
  return test.getStats();
}

/**
 * Test API endpoint performance
 */
export async function testAPIPerformance(baseUrl = 'http://localhost:5000') {
  const test = new PerformanceTest('API Performance');
  test.start();

  const endpoints = [
    { path: '/health', method: 'GET', name: 'Health check' },
    { path: '/api/dsa/patterns', method: 'GET', name: 'DSA patterns' },
    { path: '/api/jobs?limit=10', method: 'GET', name: 'Jobs list' },
    { path: '/api/blog', method: 'GET', name: 'Blog posts' },
  ];

  for (const endpoint of endpoints) {
    try {
      const start = performance.now();
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
      });
      const duration = performance.now() - start;
      
      const success = response.ok;
      test.addResult(
        endpoint.name,
        duration,
        success,
        { status: response.status, cached: response.headers.get('X-Cache') }
      );
    } catch (error) {
      test.addResult(endpoint.name, 0, false, { error: error.message });
    }
  }

  test.end();
  return test.getStats();
}

/**
 * Test cache performance
 */
export async function testCachePerformance() {
  const test = new PerformanceTest('Cache Performance');
  test.start();

  try {
    const cacheManager = await import('../utils/cacheManager.js');

    // Test 1: Cache write
    let start = performance.now();
    await cacheManager.default.set('test_key_1', { data: 'test' }, 60);
    test.addResult('Cache write', performance.now() - start, true);

    // Test 2: Cache read (hit)
    start = performance.now();
    const hit = await cacheManager.default.get('test_key_1');
    test.addResult('Cache read (hit)', performance.now() - start, !!hit);

    // Test 3: Cache read (miss)
    start = performance.now();
    const miss = await cacheManager.default.get('nonexistent_key');
    test.addResult('Cache read (miss)', performance.now() - start, !miss);

    // Test 4: Bulk write
    start = performance.now();
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(cacheManager.default.set(`bulk_key_${i}`, { index: i }, 60));
    }
    await Promise.all(promises);
    test.addResult('Bulk cache write (100 keys)', performance.now() - start, true);

    // Test 5: Bulk read
    start = performance.now();
    const readPromises = [];
    for (let i = 0; i < 100; i++) {
      readPromises.push(cacheManager.default.get(`bulk_key_${i}`));
    }
    await Promise.all(readPromises);
    test.addResult('Bulk cache read (100 keys)', performance.now() - start, true);

  } catch (error) {
    logger.error('Cache performance test failed', { error: error.message });
    test.addResult('Cache test', 0, false, { error: error.message });
  }

  test.end();
  return test.getStats();
}

/**
 * Test concurrent request handling
 */
export async function testConcurrentRequests(baseUrl = 'http://localhost:5000', concurrency = 10) {
  const test = new PerformanceTest(`Concurrent Requests (${concurrency})`);
  test.start();

  const endpoint = `${baseUrl}/api/dsa/patterns`;
  const promises = [];

  for (let i = 0; i < concurrency; i++) {
    const start = performance.now();
    const promise = fetch(endpoint)
      .then(response => {
        const duration = performance.now() - start;
        test.addResult(
          `Request ${i + 1}`,
          duration,
          response.ok,
          { status: response.status }
        );
      })
      .catch(error => {
        test.addResult(`Request ${i + 1}`, 0, false, { error: error.message });
      });
    promises.push(promise);
  }

  await Promise.all(promises);
  test.end();
  return test.getStats();
}

/**
 * Test memory usage
 */
export function testMemoryUsage() {
  const test = new PerformanceTest('Memory Usage');
  test.start();

  const usage = process.memoryUsage();
  
  test.addResult('Heap Used', usage.heapUsed / 1024 / 1024, true, { unit: 'MB' });
  test.addResult('Heap Total', usage.heapTotal / 1024 / 1024, true, { unit: 'MB' });
  test.addResult('RSS', usage.rss / 1024 / 1024, true, { unit: 'MB' });
  test.addResult('External', usage.external / 1024 / 1024, true, { unit: 'MB' });

  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  test.addResult('Heap Usage %', heapUsedPercent, heapUsedPercent < 90, { threshold: '90%' });

  test.end();
  return test.getStats();
}

/**
 * Run all performance tests
 */
export async function runAllTests(baseUrl = 'http://localhost:5000') {
  logger.info('Starting comprehensive performance tests');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Run tests sequentially to avoid interference
  results.tests.database = await testDatabasePerformance();
  results.tests.api = await testAPIPerformance(baseUrl);
  results.tests.cache = await testCachePerformance();
  results.tests.concurrent = await testConcurrentRequests(baseUrl, 10);
  results.tests.memory = testMemoryUsage();

  // Calculate overall score
  const allTests = Object.values(results.tests);
  const avgSuccessRate = allTests.reduce((sum, test) => {
    const rate = parseFloat(test.successRate);
    return sum + rate;
  }, 0) / allTests.length;

  results.summary = {
    totalTests: allTests.length,
    avgSuccessRate: avgSuccessRate.toFixed(2) + '%',
    status: avgSuccessRate >= 95 ? 'Excellent' : avgSuccessRate >= 80 ? 'Good' : 'Needs Improvement',
  };

  logger.info('Performance tests completed', results.summary);
  return results;
}

/**
 * Generate performance report
 */
export function generateReport(results) {
  let report = '\n';
  report += '═══════════════════════════════════════════════════════\n';
  report += '           PERFORMANCE TEST REPORT\n';
  report += '═══════════════════════════════════════════════════════\n\n';
  report += `Timestamp: ${results.timestamp}\n`;
  report += `Overall Status: ${results.summary.status}\n`;
  report += `Average Success Rate: ${results.summary.avgSuccessRate}\n\n`;

  for (const [testName, testResults] of Object.entries(results.tests)) {
    report += `\n${testName.toUpperCase()} TEST\n`;
    report += '─────────────────────────────────────────────────────\n';
    report += `Total Operations: ${testResults.totalOperations}\n`;
    report += `Success Rate: ${testResults.successRate}\n`;
    report += `Avg Duration: ${testResults.avgDuration}\n`;
    report += `Min Duration: ${testResults.minDuration}\n`;
    report += `Max Duration: ${testResults.maxDuration}\n`;
    report += `P50: ${testResults.p50}\n`;
    report += `P95: ${testResults.p95}\n`;
    report += `P99: ${testResults.p99}\n`;
  }

  report += '\n═══════════════════════════════════════════════════════\n';
  return report;
}

export default {
  testDatabasePerformance,
  testAPIPerformance,
  testCachePerformance,
  testConcurrentRequests,
  testMemoryUsage,
  runAllTests,
  generateReport,
};
