import { describe, it, expect } from 'vitest';
import {
  validatePasswordStrength,
  COMMON_PASSWORDS,
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
} from '../../routes/auth/helpers.js';

describe('Authentication & Password Security Validation', () => {
  it('rejects missing, empty, or short passwords', () => {
    expect(validatePasswordStrength('')).toMatch(/Password is required/);
    expect(validatePasswordStrength(null)).toMatch(/Password is required/);
    expect(validatePasswordStrength('Abc1!')).toMatch(/at least 8 characters/);
  });

  it('enforces character class diversity: uppercase, lowercase, digit, and special char', () => {
    expect(validatePasswordStrength('password123!')).toMatch(/at least one uppercase/);
    expect(validatePasswordStrength('PASSWORD123!')).toMatch(/at least one lowercase/);
    expect(validatePasswordStrength('PasswordSecure!')).toMatch(/at least one digit/);
    expect(validatePasswordStrength('Password12345')).toMatch(/at least one special character/);
  });

  it('rejects passwords present in common compromised passwords blocklist', () => {
    expect(COMMON_PASSWORDS.has('password1!')).toBe(true);
    expect(validatePasswordStrength('Password1!')).toMatch(/too common/i);
  });

  it('accepts strong compliant passwords', () => {
    expect(validatePasswordStrength('PrepLoop@2026SecurePass!')).toBeNull();
  });

  describe('Account Lockout Tracking Guardrails', () => {
    const testEmail = 'lockout.vitest@example.com';
    const testIp = '192.168.1.100';

    it('manages lockout lifecycle and resets on clear', async () => {
      await clearLoginAttempts(testEmail, testIp);

      const initial = await checkLoginLockout(testEmail, testIp);
      expect(initial.locked).toBe(false);

      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        await recordFailedLogin(testEmail, testIp);
      }

      const lockedStatus = await checkLoginLockout(testEmail, testIp);
      expect(lockedStatus.locked).toBe(true);
      expect(lockedStatus.remainingMinutes).toBeGreaterThan(0);

      await clearLoginAttempts(testEmail, testIp);
      const resetStatus = await checkLoginLockout(testEmail, testIp);
      expect(resetStatus.locked).toBe(false);
    });
  });
});
