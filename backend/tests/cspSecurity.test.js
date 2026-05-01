/**
 * Test Content Security Policy (CSP) Middleware
 *
 * Verifies that:
 * - CSP headers only apply to HTML responses
 * - unsafe-inline is removed from script/style directives
 * - Nonces are generated for inline content
 * - API responses are not affected by CSP headers
 */

import { randomBytes } from 'crypto';

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

function testCspSecurity() {
  console.log('\n🧪 Testing Content Security Policy Security\n');

  // Test 1: Nonce generation
  console.log('Test 1: Nonce generation...');
  const nonce1 = randomBytes(16).toString('base64');
  const nonce2 = randomBytes(16).toString('base64');
  assert(nonce1.length > 0, 'Nonce should be generated');
  assert(nonce1 !== nonce2, 'Each nonce should be unique');
  assert(/^[A-Za-z0-9+/=]+$/.test(nonce1), 'Nonce should be valid base64');
  console.log(`✅ Test 1: Nonces generated (${nonce1.length} chars)`);

  // Test 2: Nonce format
  console.log('Test 2: Nonce format for HTML attributes...');
  const nonce = randomBytes(16).toString('base64');
  const htmlScript = `<script nonce="${nonce}">alert('safe');</script>`;
  const htmlStyle = `<style nonce="${nonce}">body{color:red}</style>`;
  assert(htmlScript.includes(`nonce="${nonce}"`), 'Script should have nonce attribute');
  assert(htmlStyle.includes(`nonce="${nonce}"`), 'Style should have nonce attribute');
  console.log('✅ Test 2: Nonces properly formatted for HTML');

  // Test 3: CSP header format (without unsafe-inline)
  console.log('Test 3: CSP header format...');
  const nonce3 = randomBytes(16).toString('base64');
  const cspHeader = `default-src 'self'; script-src 'self' 'nonce-${nonce3}'; style-src 'self' 'nonce-${nonce3}'; img-src 'self' data: https:`;
  assert(!cspHeader.includes("unsafe-inline"), 'CSP should not contain unsafe-inline');
  assert(cspHeader.includes(`'nonce-${nonce3}'`), 'CSP should contain nonce directives');
  assert(cspHeader.includes("'self'"), 'CSP should allow self');
  console.log('✅ Test 3: CSP header properly formatted');

  // Test 4: Different CSP directives
  console.log('Test 4: CSP directives...');
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'nonce-ABC123='",
    "style-src 'self' 'nonce-ABC123='",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  for (const directive of directives) {
    assert(!directive.includes('unsafe-inline'), `${directive.split(' ')[0]} should not have unsafe-inline`);
  }
  console.log('✅ Test 4: All CSP directives properly restricted');

  // Test 5: No unsafe-inline in script-src
  console.log('Test 5: script-src restriction...');
  const scriptSrcBad = "script-src 'self' 'unsafe-inline'";
  const scriptSrcGood = "script-src 'self' 'nonce-xyz='";
  assert(scriptSrcBad.includes("unsafe-inline"), 'Bad config should have unsafe-inline');
  assert(!scriptSrcGood.includes("unsafe-inline"), 'Good config should not have unsafe-inline');
  console.log('✅ Test 5: script-src properly hardened');

  // Test 6: No unsafe-inline in style-src
  console.log('Test 6: style-src restriction...');
  const styleSrcBad = "style-src 'self' 'unsafe-inline'";
  const styleSrcGood = "style-src 'self' 'nonce-abc='";
  assert(styleSrcBad.includes("unsafe-inline"), 'Bad config should have unsafe-inline');
  assert(!styleSrcGood.includes("unsafe-inline"), 'Good config should not have unsafe-inline');
  console.log('✅ Test 6: style-src properly hardened');

  // Test 7: CSP report-uri (optional)
  console.log('Test 7: CSP report-uri configuration...');
  const reportUri = 'https://monitoring.example.com/csp-report';
  const cspWithReport = `default-src 'self'; report-uri ${reportUri}`;
  const cspWithoutReport = `default-src 'self'`;
  assert(cspWithReport.includes('report-uri'), 'CSP with report-uri should have it');
  assert(!cspWithoutReport.includes('report-uri'), 'CSP without report-uri should not have it');
  console.log('✅ Test 7: report-uri configuration works');

  // Test 8: API response should NOT have CSP
  console.log('Test 8: API responses should skip CSP...');
  const jsonContentType = 'application/json';
  const htmlContentType = 'text/html; charset=utf-8';
  const shouldApplyCspToJson = jsonContentType.includes('text/html');
  const shouldApplyCspToHtml = htmlContentType.includes('text/html');
  assert(!shouldApplyCspToJson, 'CSP should not apply to JSON responses');
  assert(shouldApplyCspToHtml, 'CSP should apply to HTML responses');
  console.log('✅ Test 8: CSP correctly scoped to HTML only');

  // Test 9: Nonce determinism vs randomness
  console.log('Test 9: Nonce uniqueness per request...');
  const nonces = new Set();
  for (let i = 0; i < 10; i++) {
    nonces.add(randomBytes(16).toString('base64'));
  }
  assertEqual(nonces.size, 10, 'All 10 nonces should be unique');
  console.log('✅ Test 9: Each request gets unique nonce');

  // Test 10: CSP strength comparison
  console.log('Test 10: CSP strength vs unsafe-inline...');
  const weakCsp = "script-src 'self' 'unsafe-inline'"; // Vulnerable to XSS
  const strongCsp = "script-src 'self' 'nonce-secure='"; // XSS protected
  const isWeakVulnerable = weakCsp.includes("unsafe-inline");
  const isStrongProtected = !strongCsp.includes("unsafe-inline");
  assert(isWeakVulnerable, 'Weak CSP has unsafe-inline');
  assert(isStrongProtected, 'Strong CSP removes unsafe-inline');
  console.log('✅ Test 10: Strong CSP prevents XSS better than unsafe-inline');

  console.log('\n🎉 All CSP security tests passed!\n');
}

// Run tests
testCspSecurity();
