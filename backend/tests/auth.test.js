import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  validatePasswordStrength,
  COMMON_PASSWORDS,
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
  AUTH_ERROR_CODES,
  isDuplicateEmailError,
} from '../routes/auth/helpers.js';

describe('Password strength validation', () => {
  it('rejects missing or empty passwords', () => {
    assert.match(validatePasswordStrength(''), /Password is required/);
    assert.match(validatePasswordStrength(null), /Password is required/);
  });

  it('rejects short passwords under 8 characters', () => {
    assert.match(validatePasswordStrength('Abc1!'), /at least 8 characters/);
  });

  it('rejects passwords missing uppercase', () => {
    assert.match(validatePasswordStrength('password123!'), /at least one uppercase/);
  });

  it('rejects passwords missing lowercase', () => {
    assert.match(validatePasswordStrength('PASSWORD123!'), /at least one lowercase/);
  });

  it('rejects passwords missing digits', () => {
    assert.match(validatePasswordStrength('PasswordSecure!'), /at least one digit/);
  });

  it('rejects passwords missing special characters', () => {
    assert.match(validatePasswordStrength('Password12345'), /at least one special character/);
  });

  it('rejects passwords in common passwords blocklist', () => {
    assert.ok(COMMON_PASSWORDS.has('password1!'));
    assert.match(validatePasswordStrength('Password1!'), /too common/i);
  });

  it('accepts strong compliant passwords', () => {
    assert.equal(validatePasswordStrength('PrepLoop@2026SecurePass!'), null);
  });
});

describe('Account lockout tracking', () => {
  const testEmail = 'lockout.unit.test@example.com';
  const testIp = '192.168.1.100';

  it('initial state is unlocked', async () => {
    await clearLoginAttempts(testEmail, testIp);
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, false);
  });

  it('triggers lockout after exceeding MAX_LOGIN_ATTEMPTS', async () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
      await recordFailedLogin(testEmail, testIp);
    }
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, true);
    assert.ok(status.remainingMinutes > 0);
  });

  it('clearing attempts restores unlocked state', async () => {
    await clearLoginAttempts(testEmail, testIp);
    const status = await checkLoginLockout(testEmail, testIp);
    assert.equal(status.locked, false);
  });
});

describe('Duplicate email error detection', () => {
  it('detects Supabase and Postgres duplicate email error messages', () => {
    assert.equal(isDuplicateEmailError({ message: 'User already registered' }), true);
    assert.equal(isDuplicateEmailError({ message: 'A user with this email address has already been registered' }), true);
    assert.equal(isDuplicateEmailError({ message: 'duplicate key value violates unique constraint' }), true);
    assert.equal(isDuplicateEmailError({ code: 'user_already_exists' }), true);
    assert.equal(isDuplicateEmailError({ code: '23505' }), true);
    assert.equal(isDuplicateEmailError({ message: 'Password is too weak' }), false);
    assert.equal(isDuplicateEmailError(null), false);
  });

  it('exposes EMAIL_ALREADY_EXISTS code', () => {
    assert.equal(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS, 'EMAIL_ALREADY_EXISTS');
  });
});

