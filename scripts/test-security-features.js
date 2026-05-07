#!/usr/bin/env node
/**
 * Interactive Security Feature Testing Script
 * Tests all Phase 2 security features with real API calls
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('🔐 Phase 2 Security Features - Interactive Test Suite\n');
console.log('=' .repeat(70));
console.log(`Testing against: ${BASE_URL}\n`);

let testsPassed = 0;
let testsFailed = 0;

async function test(description, fn) {
  try {
    console.log(`\n🧪 ${description}`);
    await fn();
    console.log(`   ✅ PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Input Validation - Invalid Email
await test('Input Validation: Reject invalid email', async () => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email',
      password: 'WeakPass1!',
      name: 'Test User',
      username: 'testuser',
    }),
  });

  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }

  const data = await response.json();
  if (!data.error && !data.errors) {
    throw new Error('Expected validation error message');
  }

  console.log(`   Status: ${response.status}`);
  console.log(`   Error: ${data.error || JSON.stringify(data.errors)}`);
});

// Test 2: Input Validation - Weak Password
await test('Input Validation: Reject weak password', async () => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'weak',
      name: 'Test User',
      username: 'testuser',
    }),
  });

  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }

  const data = await response.json();
  console.log(`   Status: ${response.status}`);
  console.log(`   Error: ${data.error || JSON.stringify(data.errors)}`);
});

// Test 3: Input Validation - Missing Required Fields
await test('Input Validation: Reject missing fields', async () => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      // Missing password, name, username
    }),
  });

  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }

  console.log(`   Status: ${response.status}`);
});

// Test 4: Rate Limiting Check (Info only - won't trigger limit)
await test('Rate Limiting: Check auth endpoint headers', async () => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent@test.com',
      password: 'TestPass123!',
    }),
  });

  const rateLimitHeaders = {
    'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
    'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
    'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
  };

  console.log(`   Status: ${response.status}`);
  console.log(`   Rate Limit Headers:`);
  console.log(`     Limit: ${rateLimitHeaders['x-ratelimit-limit'] || 'Not set'}`);
  console.log(`     Remaining: ${rateLimitHeaders['x-ratelimit-remaining'] || 'Not set'}`);
  console.log(`     Reset: ${rateLimitHeaders['x-ratelimit-reset'] || 'Not set'}`);

  if (!rateLimitHeaders['x-ratelimit-limit']) {
    console.log(`   ⚠️  Warning: Rate limit headers not present`);
  }
});

// Test 5: Health Check (Should work without auth)
await test('Health Check: Public endpoint accessible', async () => {
  const response = await fetch(`${BASE_URL}/health`);

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json();
  console.log(`   Status: ${response.status}`);
  console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
});

// Test 6: Protected Endpoint (Should require auth)
await test('Authentication: Protected endpoint rejects unauthenticated', async () => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    headers: {
      'Authorization': 'Bearer invalid-token',
    },
  });

  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`);
  }

  console.log(`   Status: ${response.status}`);
  console.log(`   Correctly rejected invalid token`);
});

// Test 7: CORS Headers Check
await test('CORS: Check CORS headers', async () => {
  const response = await fetch(`${BASE_URL}/health`, {
    headers: {
      'Origin': 'http://localhost:5173',
    },
  });

  const corsHeaders = {
    'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
    'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
    'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
  };

  console.log(`   Status: ${response.status}`);
  console.log(`   CORS Headers:`);
  console.log(`     Allow-Origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`);
  console.log(`     Allow-Methods: ${corsHeaders['access-control-allow-methods'] || 'Not set'}`);
  console.log(`     Allow-Headers: ${corsHeaders['access-control-allow-headers'] || 'Not set'}`);
});

// Test 8: Security Headers Check
await test('Security Headers: Check Helmet headers', async () => {
  const response = await fetch(`${BASE_URL}/health`);

  const securityHeaders = {
    'x-dns-prefetch-control': response.headers.get('x-dns-prefetch-control'),
    'x-frame-options': response.headers.get('x-frame-options'),
    'strict-transport-security': response.headers.get('strict-transport-security'),
    'x-content-type-options': response.headers.get('x-content-type-options'),
  };

  console.log(`   Status: ${response.status}`);
  console.log(`   Security Headers:`);
  console.log(`     X-DNS-Prefetch-Control: ${securityHeaders['x-dns-prefetch-control'] || 'Not set'}`);
  console.log(`     X-Frame-Options: ${securityHeaders['x-frame-options'] || 'Not set'}`);
  console.log(`     Strict-Transport-Security: ${securityHeaders['strict-transport-security'] || 'Not set'}`);
  console.log(`     X-Content-Type-Options: ${securityHeaders['x-content-type-options'] || 'Not set'}`);
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📝 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(70));

if (testsFailed === 0) {
  console.log('\n🎉 All security tests passed!');
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the results above.`);
}

console.log('\n💡 Next Steps:');
console.log('1. Test in browser at http://localhost:5173');
console.log('2. Try theme toggle (Phase 3 UX feature)');
console.log('3. Test toast notifications: window.toast.success("Works!")');
console.log('4. Verify loading skeletons appear during navigation');
console.log('5. Press Tab to see skip link (accessibility)');

process.exit(testsFailed > 0 ? 1 : 0);
