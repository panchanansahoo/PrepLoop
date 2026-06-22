import process from 'process';
import assert from 'assert';

// Fallback to simple fetch if utils are missing in this environment
const BASE_URL = process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000';

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

async function runAuthSmoke() {
  console.log(`Running Auth smoke tests against ${BASE_URL}...`);

  // Test 1: Empty payload to /api/auth/signup should fail
  const regFail = await requestJson('/api/auth/signup', {
    method: 'POST',
    body: {}
  });
  assert(regFail.status === 400, `Expected 400 for empty signup, got ${regFail.status}`);
  console.log('OK /api/auth/signup validation');

  // Test 2: Empty payload to /api/auth/login should fail
  const loginFail = await requestJson('/api/auth/login', {
    method: 'POST',
    body: {}
  });
  assert(loginFail.status === 400, `Expected 400 for empty login, got ${loginFail.status}`);
  console.log('OK /api/auth/login validation');

  // Test 3: Unauthorized token access to a protected endpoint should fail
  const meFail = await fetch(`${BASE_URL}/api/user/profile`, {
    headers: { 'Authorization': 'Bearer INVALID_TOKEN_123' }
  });
  assert(meFail.status === 401 || meFail.status === 403 || meFail.status === 404, `Expected 401/403/404 for invalid token, got ${meFail.status}`);
  console.log('OK protected endpoint token validation');

  console.log('Auth smoke tests passed.');
}

runAuthSmoke().catch(err => {
  console.error('Auth smoke failed:', err.message);
  process.exitCode = 1;
});
