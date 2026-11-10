import cacheManager from '../../utils/cacheManager.js';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const setSessionCookies = (res, session) => {
  if (!session?.access_token || !session?.refresh_token) return;
  res.cookie('preploop_access', session.access_token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('preploop_refresh', session.refresh_token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearSessionCookies = (res) => {
  res.clearCookie('preploop_access', SESSION_COOKIE_OPTIONS);
  res.clearCookie('preploop_refresh', SESSION_COOKIE_OPTIONS);
};

// SECURITY: Common weak passwords blocklist (top entries from breach databases)
export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'abc123', 'monkey', 'master', 'dragon',
  'login', 'princess', 'qwerty123', 'solo', 'passw0rd', 'starwars',
  'admin', 'welcome', 'hello', 'charlie', 'donald', 'football',
  'shadow', 'sunshine', 'trustno1', 'iloveyou', 'batman', 'access',
  'letmein', '696969', 'mustang', 'michael', 'ashley', 'baseball',
  'test123', 'pass123', 'qwerty1', 'welcome1', 'Password1', 'password1!',
]);

/**
 * Validate password meets security requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 * - Not in common passwords list
 * Returns null if valid, or an error message string.
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'This password is too common. Please choose a stronger password';
  }
  return null;
}

export const isMissingEmailVerificationSchema = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  const missingVerificationField = [
    'email_verified',
    'verification_token',
    'token_expires_at',
    'verification_sent_at',
  ].some((field) => message.includes(field));

  return (code === 'PGRST204' || code === '42703') && missingVerificationField;
};

// SECURITY: Account lockout — track failed login attempts per email+IP (multi-tier: Redis + local fallback)
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_ATTEMPT_WINDOW_SEC = 15 * 60; // 900 seconds
export const MAX_LOGIN_ATTEMPTS = 5;

// In-memory fallback in case cacheManager or Redis is warming up/disconnected
const localLoginAttempts = new Map();

export async function getLoginRecord(key) {
  try {
    const cached = await cacheManager.get(`lockout:${key}`);
    if (cached) return cached;
  } catch (err) {
    console.warn('[auth] cacheManager get error, falling back to local memory:', err.message);
  }
  return localLoginAttempts.get(key) || null;
}

export async function setLoginRecord(key, record, ttlSec = LOGIN_ATTEMPT_WINDOW_SEC) {
  localLoginAttempts.set(key, record);
  try {
    await cacheManager.set(`lockout:${key}`, record, ttlSec);
  } catch (err) {
    console.warn('[auth] cacheManager set error:', err.message);
  }
}

export async function removeLoginRecord(key) {
  localLoginAttempts.delete(key);
  try {
    await cacheManager.delete(`lockout:${key}`);
  } catch (err) {
    console.warn('[auth] cacheManager delete error:', err.message);
  }
}

export async function checkLoginLockout(email, ip) {
  if (!email) return { locked: false };
  const normalizedEmail = email.toLowerCase();
  const keys = ip ? [`${normalizedEmail}:${ip}`, `account:${normalizedEmail}`] : [`account:${normalizedEmail}`];

  for (const key of keys) {
    const record = await getLoginRecord(key);
    if (!record) continue;

    // Auto-expire old lockouts
    if (record.lockedUntil && Date.now() > record.lockedUntil) {
      await removeLoginRecord(key);
      continue;
    }

    // Check if currently locked
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const remainingMs = record.lockedUntil - Date.now();
      return { locked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
    }

    // Reset if outside the tracking window
    if (Date.now() - record.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
      await removeLoginRecord(key);
      continue;
    }
  }

  return { locked: false };
}

export async function recordFailedLogin(email, ip) {
  if (!email) return;
  const normalizedEmail = email.toLowerCase();
  const keys = ip ? [`${normalizedEmail}:${ip}`, `account:${normalizedEmail}`] : [`account:${normalizedEmail}`];

  for (const key of keys) {
    const existing = await getLoginRecord(key);
    const record = existing || { count: 0, firstAttempt: Date.now() };

    // Reset if outside the tracking window
    if (Date.now() - record.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
      record.count = 0;
      record.firstAttempt = Date.now();
    }

    record.count += 1;

    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOGIN_ATTEMPT_WINDOW_MS;
    }

    await setLoginRecord(key, record, LOGIN_ATTEMPT_WINDOW_SEC);
  }

  // Prune local memory map if large
  if (localLoginAttempts.size > 5000) {
    const now = Date.now();
    for (const [k, v] of localLoginAttempts) {
      if (now - v.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS * 2) {
        localLoginAttempts.delete(k);
      }
    }
  }
}

export async function clearLoginAttempts(email, ip) {
  if (!email) return;
  const normalizedEmail = email.toLowerCase();
  if (ip) {
    await removeLoginRecord(`${normalizedEmail}:${ip}`);
  }
  await removeLoginRecord(`account:${normalizedEmail}`);
}

