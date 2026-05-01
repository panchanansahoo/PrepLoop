/**
 * Test: Proxy Validation Middleware
 * 
 * Verifies hardened trust proxy configuration prevents IP spoofing
 */

import { createProxyValidationMiddleware, getClientIp, configureExpressTrustProxy } from '../middleware/proxyValidation.js';
import express from 'express';

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
console.log('Trust Proxy Hardening Tests');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Direct connection (no proxy headers)
console.log('TEST 1: Direct Connection (No Proxy)');
console.log('────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '0';
  process.env.NODE_ENV = 'production';
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '192.168.1.100' },
    headers: {},
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware calls next() for direct connections');
  assert(req.proxyValidation?.trusted === true, 'Direct connection marked as trusted');
  assert(req.proxyValidation?.sourceType === 'socket', 'Client IP from socket');
  assert(req.clientIp === '192.168.1.100', 'Correct client IP extracted');
} catch (err) {
  testsFailed.push(`Direct connection test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 2: X-Forwarded-For without trust proxy enabled
console.log('\nTEST 2: X-Forwarded-For Without Trust Proxy');
console.log('───────────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '0';
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '192.168.1.100' },
    headers: { 'x-forwarded-for': '203.0.113.50' },
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware calls next() even for suspicious headers');
  assert(req.proxyValidation?.trusted === false, 'Proxy headers rejected when trust proxy disabled');
  assert(req.proxyValidation?.reason === 'proxy-headers-without-trust-proxy-enabled', 'Correct rejection reason');
  assert(req.clientIp === '192.168.1.100', 'Falls back to socket IP');
} catch (err) {
  testsFailed.push(`X-Forwarded-For rejection test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 3: Valid proxy headers with trust proxy enabled on loopback
console.log('\nTEST 3: Valid Proxy Headers From Trusted Proxy');
console.log('──────────────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '1'; // Trust immediate upstream
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '127.0.0.1' }, // Loopback = trusted proxy
    headers: { 
      'x-forwarded-for': '203.0.113.50, 192.0.2.10',
      'x-forwarded-proto': 'https'
    },
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {};
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(nextCalled, 'Middleware calls next() for valid proxy');
  assert(req.proxyValidation?.trusted === true, 'Valid proxy headers accepted');
  assert(req.clientIp === '203.0.113.50', 'Extracts correct client IP from X-Forwarded-For');
  assert(req.proxyValidation?.details?.hopCount === 2, 'Correctly counts proxy hops');
} catch (err) {
  testsFailed.push(`Valid proxy test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 4: Proxy headers from untrusted IP
console.log('\nTEST 4: Proxy Headers From Untrusted Source');
console.log('───────────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '1';
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '203.0.113.100' }, // Public IP = untrusted proxy
    headers: { 'x-forwarded-for': '203.0.113.50' },
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware rejects request from untrusted proxy');
  assert(res.statusCode === 403, 'Returns 403 Forbidden');
  assert(req.proxyValidation?.trusted === false, 'Proxy validation failed');
} catch (err) {
  testsFailed.push(`Untrusted proxy test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 5: Invalid IP in X-Forwarded-For
console.log('\nTEST 5: Invalid IP in X-Forwarded-For');
console.log('────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '1';
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '127.0.0.1' },
    headers: { 'x-forwarded-for': '256.256.256.256' }, // Invalid IP
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware rejects invalid IPs');
  assert(res.statusCode === 403, 'Returns 403 Forbidden');
  assert(req.proxyValidation?.reason === 'invalid-ip-in-x-forwarded-for', 'Correct error reason');
} catch (err) {
  testsFailed.push(`Invalid IP test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 6: Too many hops in X-Forwarded-For
console.log('\nTEST 6: Too Many Proxy Hops (Attack)');
console.log('────────────────────────────────────');
try {
  process.env.TRUST_PROXY = '1';
  
  const middleware = createProxyValidationMiddleware();
  
  // Create X-Forwarded-For with 15 IPs (exceeds MAX_HOPS of 10)
  const manyIps = Array.from({ length: 15 }, (_, i) => `192.0.2.${i}`).join(', ');
  
  const req = {
    connection: { remoteAddress: '127.0.0.1' },
    headers: { 'x-forwarded-for': manyIps },
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware rejects excessive proxy hops');
  assert(req.proxyValidation?.reason === 'x-forwarded-for-too-many-hops', 'Detects hop count attack');
} catch (err) {
  testsFailed.push(`Too many hops test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 7: Invalid X-Forwarded-Proto
console.log('\nTEST 7: Invalid X-Forwarded-Proto');
console.log('─────────────────────────────────');
try {
  process.env.TRUST_PROXY = '1';
  
  const middleware = createProxyValidationMiddleware();
  
  const req = {
    connection: { remoteAddress: '127.0.0.1' },
    headers: { 
      'x-forwarded-for': '203.0.113.50',
      'x-forwarded-proto': 'ftp' // Invalid protocol
    },
    method: 'GET',
    path: '/api/test',
  };
  
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  let nextCalled = false;
  
  middleware(req, res, () => { nextCalled = true; });
  
  assert(!nextCalled, 'Middleware rejects invalid X-Forwarded-Proto');
  assert(req.proxyValidation?.reason === 'invalid-x-forwarded-proto', 'Detects invalid proto');
} catch (err) {
  testsFailed.push(`Invalid proto test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 8: Configure Express trust proxy
console.log('\nTEST 8: Express Trust Proxy Configuration');
console.log('─────────────────────────────────────────');
try {
  const app = express();
  
  process.env.TRUST_PROXY = 'false';
  configureExpressTrustProxy(app);
  
  const settings1 = app.get('trust proxy');
  assert(settings1 === false, 'Sets trust proxy to false when TRUST_PROXY=false');
  
  process.env.TRUST_PROXY = '1';
  const app2 = express();
  configureExpressTrustProxy(app2);
  const settings2 = app2.get('trust proxy');
  assert(settings2 === 1, 'Sets trust proxy to 1 when TRUST_PROXY=1');
} catch (err) {
  testsFailed.push(`Express config test: ${err.message}`);
  console.error(`✗ FAILED: ${err.message}`);
}

// Test 9: getClientIp utility function
console.log('\nTEST 9: getClientIp Utility Function');
console.log('────────────────────────────────────');
try {
  const req1 = { clientIp: '203.0.113.50', ip: '192.168.1.100' };
  assert(getClientIp(req1) === '203.0.113.50', 'Returns validated client IP if available');
  
  const req2 = { ip: '192.168.1.100' };
  assert(getClientIp(req2) === '192.168.1.100', 'Falls back to req.ip');
  
  const req3 = { connection: { remoteAddress: '127.0.0.1' } };
  assert(getClientIp(req3) === '127.0.0.1', 'Falls back to socket IP');
  
  const req4 = {};
  assert(getClientIp(req4) === 'unknown', 'Returns unknown if no IP found');
} catch (err) {
  testsFailed.push(`getClientIp test: ${err.message}`);
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
  console.log('\n✅ All trust proxy hardening tests passed!');
  process.exit(0);
}
