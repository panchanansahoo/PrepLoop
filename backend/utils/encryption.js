/**
 * Field-Level Encryption Utility — AES-256-GCM
 *
 * Provides transparent encrypt-on-write / decrypt-on-read for sensitive fields
 * such as email addresses, phone numbers, and payment information.
 *
 * Key management:
 *   - Master encryption key read from FIELD_ENCRYPTION_KEY env var
 *   - Key must be 64 hex characters (32 bytes)
 *   - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Format: "enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>"
 */

import crypto from 'crypto';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('encryption');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const PREFIX = 'enc:v1:';

let _masterKey = null;

function getMasterKey() {
  if (_masterKey) return _masterKey;

  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    logger.warn(
      'FIELD_ENCRYPTION_KEY not configured or invalid (must be 64 hex chars). ' +
      'Field-level encryption is DISABLED — sensitive data will be stored in plaintext.'
    );
    return null;
  }

  _masterKey = Buffer.from(keyHex, 'hex');
  return _masterKey;
}

/**
 * Encrypt a plaintext string.
 * Returns the encrypted string in the format: "enc:v1:<iv>:<tag>:<ciphertext>"
 * If encryption is not configured, returns the plaintext as-is.
 *
 * @param {string} plaintext
 * @returns {string}
 */
export function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  if (plaintext.startsWith(PREFIX)) return plaintext; // Already encrypted

  const key = getMasterKey();
  if (!key) return plaintext; // Encryption disabled

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string.
 * If the input is not encrypted (no prefix), returns it as-is.
 *
 * @param {string} encryptedText
 * @returns {string}
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!encryptedText.startsWith(PREFIX)) return encryptedText; // Not encrypted

  const key = getMasterKey();
  if (!key) {
    logger.error('Cannot decrypt: FIELD_ENCRYPTION_KEY not configured');
    throw new Error('Encryption key not configured');
  }

  try {
    const payload = encryptedText.slice(PREFIX.length);
    const [ivHex, authTagHex, ciphertext] = payload.split(':');

    if (!ivHex || !authTagHex || !ciphertext) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a value is encrypted.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Encrypt multiple fields of an object.
 * Returns a new object with specified fields encrypted.
 *
 * @param {Object} obj - Source object
 * @param {string[]} fields - Field names to encrypt
 * @returns {Object} New object with encrypted fields
 */
export function encryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypt multiple fields of an object.
 * Returns a new object with specified fields decrypted.
 *
 * @param {Object} obj - Source object
 * @param {string[]} fields - Field names to decrypt
 * @returns {Object} New object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * Check if field-level encryption is properly configured.
 *
 * @returns {{ enabled: boolean, keyConfigured: boolean }}
 */
export function getEncryptionStatus() {
  const key = getMasterKey();
  return {
    enabled: key !== null,
    keyConfigured: !!process.env.FIELD_ENCRYPTION_KEY,
    keyValid: process.env.FIELD_ENCRYPTION_KEY?.length === 64,
  };
}

export default { encrypt, decrypt, isEncrypted, encryptFields, decryptFields, getEncryptionStatus };
