/**
 * Security Hardening Verification Script
 * Tests all 6 security modules for production readiness
 *
 * Run: npm run verify:security
 * Output: Detailed test report with pass/fail for each security pattern
 */

import crypto from 'crypto';
import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const VERBOSE = process.env.VERBOSE === 'true';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

class SecurityVerificationReport {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  addTest(category, testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;

    this.results.push({
      category,
      testName,
      passed,
      details,
      timestamp: new Date().toISOString(),
    });

    if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }

    if (VERBOSE) {
      console.log(
        `${color}${status}${colors.reset} [${category}] ${testName}${
          details ? ': ' + details : ''
        }`
      );
    }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.passed + this.failed;
    const percentage = ((this.passed / total) * 100).toFixed(1);

    console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.blue}SECURITY VERIFICATION REPORT${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);

    // Group by category
    const byCategory = {};
    this.results.forEach((result) => {
      if (!byCategory[result.category]) {
        byCategory[result.category] = { passed: 0, failed: 0, tests: [] };
      }
      byCategory[result.category].tests.push(result);
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
    });

    // Print results by category
    Object.entries(byCategory).forEach(([category, results]) => {
      const categoryColor = results.failed === 0 ? colors.green : colors.red;
      console.log(
        `${categoryColor}${category}: ${results.passed}/${results.tests.length} passed${colors.reset}`
      );

      results.tests.forEach((test) => {
        const testColor = test.passed ? colors.green : colors.red;
        const status = test.passed ? '✅' : '❌';
        console.log(
          `  ${status} ${testColor}${test.testName}${colors.reset}${
            test.details ? ` (${test.details})` : ''
          }`
        );
      });
      console.log();
    });

    // Overall summary
    const summaryColor = this.failed === 0 ? colors.green : colors.red;
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}`);
    console.log(
      `${summaryColor}TOTAL: ${this.passed}/${total} PASSED (${percentage}%)${colors.reset}`
    );
    console.log(`Duration: ${duration}s`);
    console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);

    if (this.failed === 0) {
      console.log(`${colors.green}✅ ALL SECURITY TESTS PASSED - READY FOR PRODUCTION${colors.reset}\n`);
      return true;
    } else {
      console.log(
        `${colors.red}❌ ${this.failed} SECURITY TEST(S) FAILED - FIX REQUIRED${colors.reset}\n`
      );
      return false;
    }
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        passed: this.passed,
        failed: this.failed,
        total: this.passed + this.failed,
        percentage: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1),
      },
      results: this.results,
    };

    const fs = require('fs');
    fs.writeFileSync('security-verification-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to security-verification-report.json\n');
  }
}

const report = new SecurityVerificationReport();

/**
 * Test 1: Security Headers Verification
 */
async function testSecurityHeaders() {
  console.log(`${colors.blue}Testing Security Headers...${colors.reset}`);

  try {
    const response = await axios.get(`${BASE_URL}/health`, { validateStatus: () => true });
    const headers = response.headers;

    const checks = [
      { name: 'Content-Security-Policy', header: 'content-security-policy' },
      { name: 'Strict-Transport-Security', header: 'strict-transport-security' },
      { name: 'X-Frame-Options', header: 'x-frame-options' },
      { name: 'X-Content-Type-Options', header: 'x-content-type-options' },
      { name: 'Permissions-Policy', header: 'permissions-policy' },
    ];

    checks.forEach((check) => {
      const present = !!headers[check.header];
      report.addTest('Security Headers', `${check.name} present`, present, headers[check.header] || '');
    });

    // Verify specific header values
    const cspHeader = headers['content-security-policy'] || '';
    const cspValid = cspHeader.includes('default-src') && cspHeader.includes("'self'");
    report.addTest('Security Headers', 'CSP contains default-src and self', cspValid);

    const hstsHeader = headers['strict-transport-security'] || '';
    const hstsValid = hstsHeader.includes('max-age');
    report.addTest('Security Headers', 'HSTS max-age configured', hstsValid);

    const frameOptionsHeader = headers['x-frame-options'] || '';
    const frameOptionsValid = frameOptionsHeader === 'DENY';
    report.addTest('Security Headers', 'X-Frame-Options set to DENY', frameOptionsValid);
  } catch (err) {
    report.addTest('Security Headers', 'Server responding', false, err.message);
  }
}

/**
 * Test 2: Input Validation & Injection Prevention
 */
async function testInputValidation() {
  console.log(`${colors.blue}Testing Input Validation...${colors.reset}`);

  const injectionPayloads = [
    { type: 'SQL', payload: "' UNION SELECT * FROM users--", field: 'search' },
    { type: 'XSS', payload: '<script>alert("XSS")</script>', field: 'name' },
    { type: 'NoSQL', payload: '{"$where":"1==1"}', field: 'filter' },
  ];

  for (const injection of injectionPayloads) {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/search?q=${encodeURIComponent(injection.payload)}`,
        { validateStatus: () => true }
      );

      // Injection should be blocked (403 status or error response)
      const blocked = response.status === 403 || response.data.error?.includes('INJECTION');
      report.addTest(
        'Injection Prevention',
        `${injection.type} Injection blocked`,
        blocked,
        `Status: ${response.status}`
      );
    } catch (err) {
      report.addTest('Injection Prevention', `${injection.type} Injection test`, false, err.message);
    }
  }
}

/**
 * Test 3: Password Validation
 */
async function testPasswordValidation() {
  console.log(`${colors.blue}Testing Password Validation...${colors.reset}`);

  const passwordTests = [
    { password: 'weak', shouldFail: true, reason: 'Too short' },
    { password: 'NoNumbers!', shouldFail: true, reason: 'Missing numbers' },
    { password: 'noupppercase123!', shouldFail: true, reason: 'Missing uppercase' },
    { password: 'NOLOWERCASE123!', shouldFail: true, reason: 'Missing lowercase' },
    { password: 'NoSpecialChars123', shouldFail: true, reason: 'Missing special chars' },
    { password: 'StrongPass123!', shouldFail: false, reason: 'Valid password' },
  ];

  for (const test of passwordTests) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/validate-password`,
        { password: test.password },
        { validateStatus: () => true }
      );

      const isFailing = response.status !== 200 || response.data.errors?.length > 0;
      const correct = isFailing === test.shouldFail;

      report.addTest(
        'Password Validation',
        `Password "${test.password}" - ${test.reason}`,
        correct,
        `Expected: ${test.shouldFail ? 'FAIL' : 'PASS'}, Got: ${isFailing ? 'FAIL' : 'PASS'}`
      );
    } catch (err) {
      report.addTest('Password Validation', `Password test: ${test.reason}`, false, err.message);
    }
  }
}

/**
 * Test 4: Account Lockout
 */
async function testAccountLockout() {
  console.log(`${colors.blue}Testing Account Lockout...${colors.reset}`);

  const testEmail = `test-${Date.now()}@example.com`;
  let lockedAfterAttempts = false;

  try {
    // Try 6 failed login attempts (should lock after 5)
    for (let i = 1; i <= 6; i++) {
      const response = await axios.post(
        `${BASE_URL}/api/auth/login`,
        { email: testEmail, password: 'WrongPassword123!' },
        { validateStatus: () => true }
      );

      if (response.status === 429 && i === 6) {
        lockedAfterAttempts = true;
      }
    }

    report.addTest('Account Lockout', 'Account locked after 5 failed attempts', lockedAfterAttempts);
  } catch (err) {
    report.addTest('Account Lockout', 'Account lockout mechanism', false, err.message);
  }
}

/**
 * Test 5: CSRF Token Protection
 */
async function testCSRFProtection() {
  console.log(`${colors.blue}Testing CSRF Protection...${colors.reset}`);

  try {
    // Get CSRF token
    const tokenResponse = await axios.get(`${BASE_URL}/api/csrf-token`, {
      validateStatus: () => true,
    });

    const token = tokenResponse.data?.token;
    const tokenGenerated = !!token && token.length === 64;
    report.addTest('CSRF Protection', 'CSRF token generated', tokenGenerated);

    // Verify token in httpOnly cookie
    const cookies = tokenResponse.headers['set-cookie'] || [];
    const csrfCookie = cookies.find((c) => c.includes('csrf-token'));
    const cookieSecure = csrfCookie?.includes('httpOnly') && csrfCookie?.includes('Secure');
    report.addTest('CSRF Protection', 'CSRF token in httpOnly, Secure cookie', !!cookieSecure);

    // Try POST without token (should fail)
    if (token) {
      const postWithoutToken = await axios.post(
        `${BASE_URL}/api/payment`,
        { amount: 100 },
        { validateStatus: () => true }
      );

      const blocked = postWithoutToken.status === 403;
      report.addTest('CSRF Protection', 'POST without token blocked', blocked);

      // Try POST with valid token (should not be blocked by CSRF)
      const postWithToken = await axios.post(
        `${BASE_URL}/api/payment`,
        { amount: 100 },
        {
          headers: { 'X-CSRF-Token': token },
          validateStatus: () => true,
        }
      );

      const notBlockedByCSRF = postWithToken.status !== 403 || !postWithToken.data?.error?.includes('CSRF');
      report.addTest('CSRF Protection', 'POST with valid token passes CSRF check', notBlockedByCSRF);
    }
  } catch (err) {
    report.addTest('CSRF Protection', 'CSRF protection mechanism', false, err.message);
  }
}

/**
 * Test 6: Rate Limiting
 */
async function testRateLimiting() {
  console.log(`${colors.blue}Testing Rate Limiting...${colors.reset}`);

  try {
    let rateLimited = false;

    // Make rapid requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 300; i++) {
      promises.push(
        axios.get(`${BASE_URL}/health`, { validateStatus: () => true }).catch(() => null)
      );
    }

    const responses = await Promise.all(promises);
    const tooManyRequests = responses.some((r) => r?.status === 429);

    report.addTest('Rate Limiting', 'Rate limiting triggered on excessive requests', tooManyRequests);
  } catch (err) {
    report.addTest('Rate Limiting', 'Rate limiting mechanism', false, err.message);
  }
}

/**
 * Test 7: Token Validation
 */
async function testTokenValidation() {
  console.log(`${colors.blue}Testing Token Validation...${colors.reset}`);

  try {
    const invalidTokens = [
      'invalid.jwt.token',
      'expired.jwt.token.here',
      crypto.randomBytes(32).toString('hex'),
    ];

    for (const invalidToken of invalidTokens) {
      const response = await axios.get(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${invalidToken}` },
        validateStatus: () => true,
      });

      const rejected = response.status === 401;
      report.addTest('Token Validation', `Invalid token rejected`, rejected, `Status: ${response.status}`);
    }
  } catch (err) {
    report.addTest('Token Validation', 'Token validation', false, err.message);
  }
}

/**
 * Test 8: Sensitive Data Masking (Log-based)
 */
async function testDataMasking() {
  console.log(`${colors.blue}Testing Sensitive Data Masking...${colors.reset}`);

  try {
    // Test that error responses don't leak sensitive information
    const response = await axios.post(
      `${BASE_URL}/api/auth/login`,
      { email: 'test@example.com', password: 'wrong' },
      { validateStatus: () => true }
    );

    const errorMessage = JSON.stringify(response.data);
    const hasSecrets = errorMessage.includes('password') || errorMessage.includes('DATABASE');
    report.addTest('Data Masking', 'Error responses don\'t leak secrets', !hasSecrets);

    // Check that PII is not exposed in responses
    const hasPII = errorMessage.match(/\b\d{3}-\d{2}-\d{4}\b/) || errorMessage.includes('email@');
    report.addTest('Data Masking', 'Error responses don\'t leak PII', !hasPII);
  } catch (err) {
    report.addTest('Data Masking', 'Data masking verification', false, err.message);
  }
}

/**
 * Run all verification tests
 */
async function runAllTests() {
  console.log(`\n${colors.blue}🔐 SECURITY HARDENING VERIFICATION${colors.reset}\n`);
  console.log(`Testing: ${BASE_URL}\n`);

  await testSecurityHeaders();
  await testInputValidation();
  await testPasswordValidation();
  await testAccountLockout();
  await testCSRFProtection();
  await testRateLimiting();
  await testTokenValidation();
  await testDataMasking();

  // Print summary and save report
  const allPassed = report.printSummary();
  report.saveReport();

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((err) => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});

export { SecurityVerificationReport };
