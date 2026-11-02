import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validatePasswordStrength,
  COMMON_PASSWORDS,
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
} from '../routes/auth/helpers.js';

test('Password strength validation', async (t) => {
  await t.test('rejects missing or empty passwords', () => {
    assert.match(validatePasswordStrength(''), /Password is required/);
    assert.match(validatePasswordStrength(null), /Password is required/);
  });

  await t.test('rejects short passwords under 8 characters', () => {
    assert.match(validatePasswordStrength('Abc1!'), /at least 8 characters/);
  });

  await t.test('rejects passwords missing uppercase', () => {
    assert.match(validatePasswordStrength('password123!'), /at least one uppercase/);
  });

  await t.test('rejects passwords missing lowercase', () => {
    assert.match(validatePasswordStrength('PASSWORD123!'), /at least one lowercase/);
  });

  await t.test('rejects passwords missing digits', () => {
    assert.match(validatePasswordStrength('PasswordSecure!'), /at least one digit/);
  });

  await t.test('rejects passwords missing special characters', () => {
    assert.match(validatePasswordStrength('Password12345'), /at least one special character/);
  });

  await t.test('rejects passwords in common passwords blocklist', () => {
    assert.ok(COMMON_PASSWORDS.has('password1!'));
    assert.match(validatePasswordStrength('Password1!'), /too common/i);
  });

  await t.test('accepts strong compliant passwords', () => {
    assert.equal(validatePasswordStrength('PrepLoop@2026SecurePass!'), null);
  });
});

test('Account lockout tracking', async (t) => {
  const testEmail = 'lockout.unit.test@example.com';
  const testIp = '192.168.1.100';

  await clearLoginAttempts(testEmail, testIp);

  await t.test('initial state is unlocked', async () => {
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, false);
  });

  await t.test('triggers lockout after exceeding MAX_LOGIN_ATTEMPTS', async () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
      await recordFailedLogin(testEmail, testIp);
    }
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, true);
    assert.ok(status.remainingMinutes > 0);
  });

  await t.test('clearing attempts restores unlocked state', async () => {
    await clearLoginAttempts(testEmail, testIp);
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, false);
  });
});
