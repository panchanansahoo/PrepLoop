import crypto from 'crypto';

const PASSCODE_MIN_LENGTH = 4;
const PASSCODE_MAX_LENGTH = 64;

export function normalizeInterviewLimits({ passcode, expiresAt, maxAttempts, allowedEmails } = {}, { isUpdate = false } = {}) {
  const result = {};
  if (passcode !== undefined) {
    const normalized = String(passcode || '').trim();
    if (normalized) {
      if (normalized.length < PASSCODE_MIN_LENGTH || normalized.length > PASSCODE_MAX_LENGTH) {
        throw new Error(`Passcode must be ${PASSCODE_MIN_LENGTH}-${PASSCODE_MAX_LENGTH} characters`);
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const digest = crypto.scryptSync(normalized, salt, 64).toString('hex');
      result.passcode_hash = `${salt}:${digest}`;
    } else if (!isUpdate) {
      result.passcode_hash = null;
    }
  }

  if (expiresAt !== undefined) {
    if (!expiresAt) {
      result.expires_at = null;
    } else {
      const timestamp = new Date(expiresAt);
      if (Number.isNaN(timestamp.getTime()) || timestamp.getTime() <= Date.now()) {
        throw new Error('Expiry must be a valid date and time in the future');
      }
      result.expires_at = timestamp.toISOString();
    }
  }

  if (maxAttempts !== undefined) {
    if (maxAttempts === '' || maxAttempts === null) {
      result.max_attempts = null;
    } else {
      const limit = Number(maxAttempts);
      if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
        throw new Error('Maximum attempts must be between 1 and 5000, or blank for unlimited');
      }
      result.max_attempts = limit;
    }
  }

  if (allowedEmails !== undefined) {
    if (!allowedEmails || (Array.isArray(allowedEmails) && allowedEmails.length === 0)) {
      result.allowed_emails = [];
      result.allowedEmails = [];
    } else {
      const rawList = Array.isArray(allowedEmails)
        ? allowedEmails
        : String(allowedEmails).split(/[\n,;]+/);
      const emailList = rawList.map(s => String(s || '').trim()).filter(Boolean);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = emailList.filter(e => !emailRegex.test(e));
      if (invalid.length > 0) {
        throw new Error(`Invalid email address in allowlist: ${invalid.slice(0, 2).join(', ')}`);
      }
      const cleanList = [...new Set(emailList.map(e => e.toLowerCase()))];
      result.allowed_emails = cleanList;
      result.allowedEmails = cleanList;
    }
  } else if (!isUpdate) {
    result.allowed_emails = [];
    result.allowedEmails = [];
  }

  return result;
}

export function verifyInterviewPasscode(passcode, storedHash) {
  if (!storedHash) return true;
  if (typeof passcode !== 'string' || passcode.length < PASSCODE_MIN_LENGTH || passcode.length > PASSCODE_MAX_LENGTH) {
    return false;
  }
  const [salt, expectedHex] = String(storedHash).split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const actual = crypto.scryptSync(passcode, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return crypto.timingSafeEqual(actual, expected);
}

export function verifyInterviewInviteeEmail(email, allowedEmails) {
  if (!Array.isArray(allowedEmails) || allowedEmails.length === 0) return true;
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return allowedEmails.some(item => String(item).trim().toLowerCase() === normalized);
}

export function isInterviewLinkExpired(expiresAt) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function generateInterviewToken() {
  return crypto.randomUUID();
}

export function isValidInterviewToken(token) {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.length >= 5 && trimmed.length <= 64;
}
