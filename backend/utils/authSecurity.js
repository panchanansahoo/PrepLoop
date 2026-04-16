/**
 * Authentication Hardening Module
 * Implements production-grade authentication security patterns
 *
 * OWASP Top 10 - Mitigates:
 * A01: Broken Access Control - Token validation
 * A02: Cryptographic Failures - Secure password handling
 * A04: Insecure Design - Authentication patterns
 * A07: Identification and Authentication Failures - Session security
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Validate password strength
 * Ensures passwords meet production requirements
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters (recommended 16+)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  // Check for common patterns
  const commonPatterns = [
    /^12345/,
    /^qwerty/i,
    /^password/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    errors.push('Password contains common patterns');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

/**
 * Calculate password strength score (0-5)
 */
function calculatePasswordStrength(password) {
  let score = 0;

  if (!password) return 0;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  return Math.min(score, 5);
}

/**
 * Hash password with bcrypt
 * Uses production-grade parameters
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  try {
    // Use 14 rounds for production (higher is more secure but slower)
    const salt = await bcrypt.genSalt(14);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password, hash) => {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error.message);
    return false;
  }
};

/**
 * Generate cryptographically secure token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex-encoded token
 */
export const generateSecureToken = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

/**
 * Verify JWT token claims for security
 * Additional validation beyond standard JWT verification
 */
export const validateTokenClaims = (decoded) => {
  if (!decoded) {
    return { valid: false, error: 'Token is required' };
  }

  // Validate required claims
  const requiredClaims = ['sub', 'iat'];
  for (const claim of requiredClaims) {
    if (!decoded[claim]) {
      return { valid: false, error: `Missing claim: ${claim}` };
    }
  }

  // Check token age (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 hours

  if (typeof decoded.iat === 'number' && now - decoded.iat > maxAge) {
    return { valid: false, error: 'Token is too old' };
  }

  // Validate user ID is string/UUID
  if (typeof decoded.sub !== 'string' || decoded.sub.length === 0) {
    return { valid: false, error: 'Invalid user ID in token' };
  }

  return { valid: true };
};

/**
 * Generate session token with metadata
 */
export const createSessionToken = (userId, metadata = {}) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID is required');
  }

  return {
    token: generateSecureToken(),
    userId,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    ...metadata,
  };
};

/**
 * Sanitize user credentials for logging
 * Prevents accidental credential exposure
 */
export const sanitizeCredentials = (credentials) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(credentials || {})) {
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('key')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Rate limiter state for account lockout
 * Prevents brute force attacks
 */
export class AccountLockoutManager {
  constructor() {
    this.attempts = new Map(); // { email: { count, lastAttempt, lockedUntil } }
    this.config = {
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      resetAfter: 60 * 60 * 1000, // 1 hour
    };
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(email) {
    const key = email.toLowerCase();
    const current = this.attempts.get(key) || {
      count: 0,
      lastAttempt: Date.now(),
    };

    // Reset if lockout expired
    if (
      current.lockedUntil &&
      Date.now() > current.lockedUntil
    ) {
      current.count = 0;
      current.lockedUntil = null;
    }

    // Reset if too much time has passed
    if (Date.now() - current.lastAttempt > this.config.resetAfter) {
      current.count = 0;
    }

    current.count++;
    current.lastAttempt = Date.now();

    if (current.count >= this.config.maxAttempts) {
      current.lockedUntil =
        Date.now() + this.config.lockoutDuration;
    }

    this.attempts.set(key, current);
    return current;
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(email) {
    const key = email.toLowerCase();
    const entry = this.attempts.get(key);

    if (!entry || !entry.lockedUntil) {
      return false;
    }

    if (Date.now() > entry.lockedUntil) {
      this.attempts.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get lockout status
   */
  getStatus(email) {
    const key = email.toLowerCase();
    const entry = this.attempts.get(key);

    if (!entry) {
      return { locked: false, attempts: 0, remaining: this.config.maxAttempts };
    }

    const locked = this.isAccountLocked(key);
    return {
      locked,
      attempts: entry.count,
      remaining: Math.max(0, this.config.maxAttempts - entry.count),
      lockedUntil: entry.lockedUntil,
    };
  }

  /**
   * Clear attempts for account
   */
  clearAttempts(email) {
    this.attempts.delete(email.toLowerCase());
  }
}

export default {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validateTokenClaims,
  createSessionToken,
  sanitizeCredentials,
  AccountLockoutManager,
};
