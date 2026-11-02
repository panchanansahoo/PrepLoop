const test = require('node:test');
const assert = require('node:assert/strict');

// Contract normalizers for mobile Auth API
function parseAuthResponse(response) {
  if (!response) throw new Error('Empty auth response');
  const user = response.user || {};
  return {
    token: response.token || null,
    refreshToken: response.refreshToken || null,
    user: {
      id: user.id || null,
      email: user.email || null,
      fullName: user.fullName || user.full_name || null,
      role: user.role || 'user',
      subscriptionTier: user.subscriptionTier || user.subscription_tier || 'free',
      emailVerified: Boolean(user.emailVerified ?? user.email_verified ?? false),
    },
  };
}

function classifyAuthError(status, errorPayload) {
  const code = errorPayload?.code || errorPayload?.error;
  if (status === 401) {
    if (code === 'TOKEN_EXPIRED') return 'TOKEN_EXPIRED';
    return 'INVALID_CREDENTIALS';
  }
  if (status === 403 && (code === 'EMAIL_NOT_VERIFIED' || /verify your email/i.test(errorPayload?.error || ''))) {
    return 'EMAIL_NOT_VERIFIED';
  }
  if (status === 429) {
    return 'ACCOUNT_LOCKED_OR_RATE_LIMITED';
  }
  return 'GENERIC_AUTH_ERROR';
}

test('parseAuthResponse maps camelCase and snake_case user profiles seamlessly', () => {
  const rawSnake = {
    token: 'jwt.token.abc',
    refreshToken: 'refresh.token.xyz',
    user: {
      id: 'usr-123',
      email: 'alex@example.com',
      full_name: 'Alex Turner',
      role: 'admin',
      subscription_tier: 'pro',
      email_verified: true,
    },
  };

  const parsed = parseAuthResponse(rawSnake);
  assert.equal(parsed.token, 'jwt.token.abc');
  assert.equal(parsed.refreshToken, 'refresh.token.xyz');
  assert.equal(parsed.user.fullName, 'Alex Turner');
  assert.equal(parsed.user.subscriptionTier, 'pro');
  assert.equal(parsed.user.role, 'admin');
  assert.equal(parsed.user.emailVerified, true);
});

test('parseAuthResponse handles minimal login payloads with defaults', () => {
  const minimal = {
    token: 'jwt.minimal',
    user: { id: 'usr-456', email: 'test@preploop.me' },
  };

  const parsed = parseAuthResponse(minimal);
  assert.equal(parsed.token, 'jwt.minimal');
  assert.equal(parsed.refreshToken, null);
  assert.equal(parsed.user.role, 'user');
  assert.equal(parsed.user.subscriptionTier, 'free');
  assert.equal(parsed.user.emailVerified, false);
});

test('classifyAuthError accurately categorizes authentication error states', () => {
  assert.equal(classifyAuthError(401, { code: 'TOKEN_EXPIRED' }), 'TOKEN_EXPIRED');
  assert.equal(classifyAuthError(401, { error: 'Invalid password' }), 'INVALID_CREDENTIALS');
  assert.equal(classifyAuthError(403, { code: 'EMAIL_NOT_VERIFIED' }), 'EMAIL_NOT_VERIFIED');
  assert.equal(classifyAuthError(403, { error: 'Please verify your email before logging in' }), 'EMAIL_NOT_VERIFIED');
  assert.equal(classifyAuthError(429, { error: 'Too many requests' }), 'ACCOUNT_LOCKED_OR_RATE_LIMITED');
  assert.equal(classifyAuthError(500, { error: 'Database error' }), 'GENERIC_AUTH_ERROR');
});

