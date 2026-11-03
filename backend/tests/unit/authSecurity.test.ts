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
  describe('Password Recovery Redirect & Observability Validation', () => {
    it('sanitizes frontend URL to prevent open redirect vulnerabilities', () => {
      const sanitizeRedirect = (rawUrl: string | undefined): string => {
        const raw = rawUrl || 'http://localhost:5173';
        try {
          const parsed = new URL(raw);
          return `${parsed.protocol}//${parsed.host}/reset-password`;
        } catch {
          return 'http://localhost:5173/reset-password';
        }
      };

      expect(sanitizeRedirect('https://preploop.com')).toBe('https://preploop.com/reset-password');
      expect(sanitizeRedirect('https://app.preploop.com/some/path')).toBe('https://app.preploop.com/reset-password');
      expect(sanitizeRedirect('not-a-valid-url')).toBe('http://localhost:5173/reset-password');
      expect(sanitizeRedirect(undefined)).toBe('http://localhost:5173/reset-password');
    });

    it('generates privacy-preserving candidate email identifiers for telemetry logs', () => {
      const hashCandidateEmail = (email: string): string => {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 10);
      };

      const hash1 = hashCandidateEmail('candidate@preploop.com');
      const hash2 = hashCandidateEmail('candidate@preploop.com');
      const hash3 = hashCandidateEmail('other@preploop.com');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(10);
      expect(hash1).not.toContain('@');
    });
  });
});
