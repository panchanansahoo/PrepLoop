import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../utils/authSecurity.js';

describe('password policy', () => {
  it('allows 8-character passwords that meet complexity rules', () => {
    const result = validatePasswordStrength('Aa1!bcde');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePasswordStrength('Aa1!bcd');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters (recommended 12+)');
  });
});
