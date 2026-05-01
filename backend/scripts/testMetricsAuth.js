/**
 * Test: Metrics Security Middleware
 * 
 * Verifies metrics endpoint protection with:
 * - API key authentication
 * - IP allowlist validation
 * - Proper error responses
 * - Audit logging
 */

import { createMetricsSecurityMiddleware, getMetricsSecurityConfig, disableMetricsEndpoint } from '../middleware/metricsAuth.js';

const testsPassed = [];
const testsFailed = [];

function assert(condition, message) {
  if (!condition) {
    testsFailed.push(message);
    console.error(`✗ FAILED: ${message}`);
  } else {
    testsPassed.push(message);
    console.log(`✓ PASSED: ${message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('Metrics Security Middleware Tests');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Metrics disabled
console.log('TEST 1: Metrics Disabled');
console.log('───────────────────────');
try {
  process.env.METRICS_ENABLED = 'false';
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '127.0.0.1',
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware does not call next() when metrics disabled');
  assert(res.statusCode === 410, 'Returns 410 Gone when metrics disabled');
  assert(res.jsonData?.error === 'Gone', 'Error type is Gone');
} catch (err) {
  testsFailed.push(`Metrics disabled test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 2: Metrics enabled, no security configured
console.log('\nTEST 2: Metrics Enabled, No Security');
console.log('────────────────────────────────────');
try {
  delete process.env.METRICS_ENABLED;
  delete process.env.METRICS_API_KEY;
  delete process.env.METRICS_IP_ALLOWLIST;
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100',
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware calls next() with no security configured (warning logged)');
} catch (err) {
  testsFailed.push(`No security configured test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 3: API key authentication - missing header
console.log('\nTEST 3: API Key Auth - Missing Header');
console.log('─────────────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'super-secret-key-12345';
  delete process.env.METRICS_IP_ALLOWLIST;
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100',
    headers: {}, // No X-Metrics-Key header
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware does not call next() when API key missing');
  assert(res.statusCode === 401, 'Returns 401 Unauthorized');
  assert(res.jsonData?.error === 'Unauthorized', 'Error is Unauthorized');
} catch (err) {
  testsFailed.push(`Missing API key test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 4: API key authentication - invalid key
console.log('\nTEST 4: API Key Auth - Invalid Key');
console.log('───────────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'super-secret-key-12345';
  delete process.env.METRICS_IP_ALLOWLIST;
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100',
    headers: { 'x-metrics-key': 'wrong-key' },
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware does not call next() with invalid API key');
  assert(res.statusCode === 401, 'Returns 401 Unauthorized');
  assert(res.jsonData?.error === 'Unauthorized', 'Error is Unauthorized');
} catch (err) {
  testsFailed.push(`Invalid API key test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 5: API key authentication - valid key
console.log('\nTEST 5: API Key Auth - Valid Key');
console.log('─────────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'super-secret-key-12345';
  delete process.env.METRICS_IP_ALLOWLIST;
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100',
    headers: { 'x-metrics-key': 'super-secret-key-12345' },
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware calls next() with valid API key');
  assert(req.metricsAuth?.authorized === true, 'Request marked as authorized');
  assert(req.metricsAuth?.authMethod === 'API key', 'Auth method recorded as API key');
} catch (err) {
  testsFailed.push(`Valid API key test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 6: API key from array header (some proxies duplicate headers)
console.log('\nTEST 6: API Key - Array Header');
console.log('──────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'super-secret-key-12345';
  delete process.env.METRICS_IP_ALLOWLIST;
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100',
    headers: { 'x-metrics-key': ['super-secret-key-12345', 'duplicate'] }, // Array
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware handles API key in array format');
} catch (err) {
  testsFailed.push(`Array header test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 7: IP allowlist - denied
console.log('\nTEST 7: IP Allowlist - Denied');
console.log('─────────────────────────────');
try {
  delete process.env.METRICS_API_KEY;
  process.env.METRICS_IP_ALLOWLIST = '10.0.0.5,192.168.1.10';
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '203.0.113.100', // Not in allowlist
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware rejects IP not in allowlist');
  assert(res.statusCode === 403, 'Returns 403 Forbidden');
  assert(res.jsonData?.error === 'Forbidden', 'Error is Forbidden');
} catch (err) {
  testsFailed.push(`IP allowlist denied test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 8: IP allowlist - allowed (exact match)
console.log('\nTEST 8: IP Allowlist - Allowed');
console.log('──────────────────────────────');
try {
  delete process.env.METRICS_API_KEY;
  process.env.METRICS_IP_ALLOWLIST = '10.0.0.5,192.168.1.10';
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '10.0.0.5', // In allowlist
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware allows IP in allowlist');
  assert(req.metricsAuth?.authMethod === 'IP allowlist', 'Auth method recorded');
} catch (err) {
  testsFailed.push(`IP allowlist allowed test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 9: Loopback always allowed
console.log('\nTEST 9: Loopback Always Allowed');
console.log('───────────────────────────────');
try {
  delete process.env.METRICS_API_KEY;
  process.env.METRICS_IP_ALLOWLIST = '10.0.0.5'; // Specific allowlist
  
  const middleware = createMetricsSecurityMiddleware();
  
  const req = {
    ip: '127.0.0.1', // Loopback
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Loopback allowed even with restricted allowlist');
  assert(req.metricsAuth?.authMethod === 'IP allowlist', 'Auth method is IP allowlist');
} catch (err) {
  testsFailed.push(`Loopback allowed test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 10: Combined API key + IP allowlist
console.log('\nTEST 10: Combined API Key + IP Allowlist');
console.log('────────────────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'secret-key';
  process.env.METRICS_IP_ALLOWLIST = '10.0.0.5';
  
  const middleware = createMetricsSecurityMiddleware();
  
  // Test with matching IP (should succeed)
  const req1 = {
    ip: '10.0.0.5',
    headers: {},
    method: 'GET',
    path: '/metrics',
  };
  
  const res1 = {};
  let next1Called = false;
  middleware(req1, res1, () => { next1Called = true; });
  assert(next1Called, 'Allows request from allowlisted IP');
  
  // Test with non-allowlisted IP but valid API key (should fail - IP check first)
  const req2 = {
    ip: '203.0.113.100',
    headers: { 'x-metrics-key': 'secret-key' },
    method: 'GET',
    path: '/metrics',
  };
  
  const res2 = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  let next2Called = false;
  middleware(req2, res2, () => { next2Called = true; });
  assert(!next2Called, 'Denies non-allowlisted IP even with valid API key');
  assert(res2.statusCode === 403, 'Returns 403 when IP not allowed');
} catch (err) {
  testsFailed.push(`Combined auth test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 11: Disable metrics endpoint function
console.log('\nTEST 11: Disable Metrics Endpoint');
console.log('─────────────────────────────────');
try {
  const disabledHandler = disableMetricsEndpoint();
  
  const req = {
    ip: '127.0.0.1',
    headers: { 'x-metrics-key': 'valid-key' },
    method: 'GET',
    path: '/metrics',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  
  disabledHandler(req, res);
  
  assert(res.statusCode === 410, 'Disabled endpoint returns 410 Gone');
  assert(res.jsonData?.error === 'Gone', 'Error is Gone');
} catch (err) {
  testsFailed.push(`Disable endpoint test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 12: Get security config
console.log('\nTEST 12: Get Security Config');
console.log('────────────────────────────');
try {
  process.env.METRICS_API_KEY = 'secret-key-123';
  process.env.METRICS_IP_ALLOWLIST = '10.0.0.5,192.168.1.10';
  
  const config = getMetricsSecurityConfig();
  
  assert(config.enabled === true, 'Config shows metrics enabled');
  assert(config.apiKeyConfigured === true, 'Config shows API key configured');
  assert(config.apiKeyLength === 'secret-key-123'.length, 'API key length correct');
  assert(config.ipAllowlistConfigured === true, 'Config shows IP allowlist configured');
  assert(config.ipAllowlistSize === 2, 'IP allowlist size correct');
} catch (err) {
  testsFailed.push(`Security config test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('Test Summary');
console.log('═══════════════════════════════════════════════════════');
console.log(`✓ Passed: ${testsPassed.length}`);
console.log(`✗ Failed: ${testsFailed.length}`);

if (testsFailed.length > 0) {
  console.log('\nFailed Tests:');
  testsFailed.forEach(test => console.log(`  - ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ All metrics security tests passed!');
  process.exit(0);
}
