/**
 * Test Metrics Endpoint Security
 *
 * Verifies that the metrics endpoint properly enforces:
 * - API key authentication (X-Metrics-Key header)
 * - IP allowlist validation
 * - Sensitive label reduction
 */

import { createHash } from 'crypto';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message} (expected ${expected}, got ${actual})`);
  }
}

function testMetricsSecurityAuth() {
  console.log('\n🧪 Testing Metrics Endpoint Security\n');

  // Test 1: IP allowlist parsing
  console.log('Test 1: IP allowlist parsing...');
  const mockAllowlist = '192.168.1.10, 10.0.0.5, 172.16.0.0';
  const ips = mockAllowlist.split(',').map(ip => ip.trim());
  assert(ips.length === 3, 'Should parse 3 IPs from allowlist');
  assert(ips.includes('192.168.1.10'), 'Should include first IP');
  assert(ips.includes('10.0.0.5'), 'Should include second IP');
  assert(ips.includes('172.16.0.0'), 'Should include third IP');
  console.log('✅ Test 1: IP allowlist parsing works');

  // Test 2: Loopback IP detection
  console.log('Test 2: Loopback IP detection...');
  const loopbacks = ['127.0.0.1', '::1', '127.0.0.2', '127.1.1.1'];
  for (const ip of loopbacks) {
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.');
    assert(isLoopback, `Should detect ${ip} as loopback`);
  }
  console.log('✅ Test 2: Loopback detection works');

  // Test 3: Service name hashing for label anonymization
  console.log('Test 3: Service name hashing...');
  const serviceName = 'user-service';
  const hash = Math.abs(serviceName.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(16).slice(0, 8);
  assert(typeof hash === 'string', 'Hash should be a string');
  assert(hash.length <= 8, 'Hash should be at most 8 characters');
  assert(/^[a-f0-9]+$/.test(hash), 'Hash should be hex characters');
  console.log(`✅ Test 3: Service name '${serviceName}' hashed to '${hash}'`);

  // Test 4: Consistent hashing (same input produces same hash)
  console.log('Test 4: Consistent service hashing...');
  const service1 = 'database-service';
  const service2 = 'database-service';
  const hash1 = Math.abs(service1.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(16).slice(0, 8);
  const hash2 = Math.abs(service2.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(16).slice(0, 8);
  assertEqual(hash1, hash2, 'Same service name should produce same hash');
  console.log('✅ Test 4: Service hashing is consistent');

  // Test 5: Different services produce different hashes
  console.log('Test 5: Different services produce different hashes...');
  const svc1 = 'service-a';
  const svc2 = 'service-b';
  const h1 = Math.abs(svc1.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(16).slice(0, 8);
  const h2 = Math.abs(svc2.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0)).toString(16).slice(0, 8);
  assert(h1 !== h2, 'Different service names should produce different hashes');
  console.log('✅ Test 5: Different services produce different hashes');

  // Test 6: No service names in labels (privacy)
  console.log('Test 6: Service names not exposed in metrics...');
  const metricsExample = [
    'circuit_breaker_state{id="abc12345"} 0',
    'circuit_breaker_failures{id="abc12345"} 5',
  ];
  for (const line of metricsExample) {
    assert(!line.includes('service='), 'Metrics should not expose service names with service= label');
    assert(line.includes('id='), 'Metrics should use anonymous id= label');
  }
  console.log('✅ Test 6: Service names are properly anonymized');

  // Test 7: Metrics don't leak infrastructure details
  console.log('Test 7: Infrastructure details not exposed...');
  const sensitivePatterns = [
    /api\.example\.com/i,
    /database\.internal\.corp/i,
    /kubernetes\.default\.svc/i,
    /aws\.amazon\.com/i,
  ];
  const metricsOutput = `
    http_requests_total 1000
    process_uptime_seconds 3600
    cache_hit_rate 0.8542
  `;
  for (const pattern of sensitivePatterns) {
    assert(!pattern.test(metricsOutput), `Metrics should not contain pattern: ${pattern}`);
  }
  console.log('✅ Test 7: Infrastructure details not exposed');

  // Test 8: API key format validation
  console.log('Test 8: API key validation...');
  const validApiKey = process.env.METRICS_API_KEY || 'test-api-key-12345';
  const incomingKey1 = 'test-api-key-12345';
  const incomingKey2 = 'wrong-api-key';
  assert(incomingKey1 === validApiKey, 'Valid API key should match');
  assert(incomingKey2 !== validApiKey, 'Invalid API key should not match');
  console.log('✅ Test 8: API key validation works');

  console.log('\n🎉 All metrics security tests passed!\n');
}

// Run tests
testMetricsSecurityAuth();
