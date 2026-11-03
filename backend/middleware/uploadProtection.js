import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

/**
 * Upload Protection Middleware
 *
 * Enforces magic-byte file signature validation, safe filename generation,
 * path traversal defense, and dedicated upload rate limiting.
 */

// Known binary magic byte signatures
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  zip: [0x50, 0x4b, 0x03, 0x04],       // PK.. (DOCX is a zip container)
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff],
  webm: [0x1a, 0x45, 0xdf, 0xa3],      // Matroska / WebM
  riff: [0x52, 0x49, 0x46, 0x46],      // RIFF header for WAV & WebP
  mp3Id3: [0x49, 0x44, 0x33],          // ID3
};

function matchesBytes(buffer, signature) {
  if (!buffer || buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Inspects a file buffer to identify its true binary type via magic bytes.
 */
export function detectBufferType(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return 'unknown';
  }

  if (matchesBytes(buffer, MAGIC_BYTES.pdf)) return 'pdf';
  if (matchesBytes(buffer, MAGIC_BYTES.zip)) return 'docx'; // ZIP container used by DOCX
  if (matchesBytes(buffer, MAGIC_BYTES.png)) return 'png';
  if (matchesBytes(buffer, MAGIC_BYTES.jpeg)) return 'jpeg';
  if (matchesBytes(buffer, MAGIC_BYTES.webm)) return 'webm';
  if (matchesBytes(buffer, MAGIC_BYTES.mp3Id3)) return 'mp3';

  // RIFF container checks (WAV vs WebP)
  if (matchesBytes(buffer, MAGIC_BYTES.riff) && buffer.length >= 12) {
    const subType = buffer.toString('ascii', 8, 12);
    if (subType === 'WAVE') return 'wav';
    if (subType === 'WEBP') return 'webp';
  }

  // MP3 MPEG sync word check (0xFF followed by 0xFB, 0xF3, or 0xF2)
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'mp3';
  }

  // Check if buffer is plain text (no null bytes or control characters in first 512 bytes)
  const sample = buffer.slice(0, Math.min(512, buffer.length));
  let isText = true;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    // Allow tab, newline, carriage return, and standard printable ASCII/UTF-8
    if (byte === 0x00 || (byte < 0x08 && byte !== 0x00) || (byte > 0x0d && byte < 0x20 && byte !== 0x1b)) {
      isText = false;
      break;
    }
  }
  if (isText) return 'text';

  return 'unknown';
}

/**
 * Validates that an uploaded file buffer matches the declared allowed category.
 */
export function validateFileMagicBytes(buffer, allowedTypes = ['pdf', 'docx', 'text']) {
  const detected = detectBufferType(buffer);

  const typeMap = {
    pdf: ['pdf'],
    docx: ['docx'],
    doc: ['docx', 'text'], // legacy doc or rtf text
    text: ['text'],
    txt: ['text'],
    image: ['png', 'jpeg', 'webp'],
    png: ['png'],
    jpeg: ['jpeg'],
    jpg: ['jpeg'],
    webp: ['webp'],
    audio: ['webm', 'wav', 'mp3'],
    webm: ['webm'],
    wav: ['wav'],
    mp3: ['mp3'],
  };

  const allowedDetectedTypes = new Set(allowedTypes.flatMap((t) => typeMap[t.toLowerCase()] || [t.toLowerCase()]));

  if (!allowedDetectedTypes.has(detected)) {
    return {
      valid: false,
      detectedType: detected,
      error: `File signature mismatch: expected [${allowedTypes.join(', ')}], detected "${detected}". Disguised executable or unsupported binary rejected.`,
    };
  }

  return { valid: true, detectedType: detected };
}

/**
 * Generates a collision-free UUID filename preserving only an approved extension,
 * neutralizing any directory traversal payloads (e.g. "../../../etc/passwd").
 */
export function sanitizeUploadFilename(originalName = '', defaultExt = 'bin') {
  const safeBase = crypto.randomUUID();
  const rawExt = String(originalName || '').split('.').pop() || '';
  const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  const ext = cleanExt || defaultExt;
  return `${safeBase}.${ext}`;
}

/**
 * Express middleware factory enforcing magic-byte inspection on req.file.
 */
export function requireValidFileSignature(allowedTypes = ['pdf', 'docx', 'text']) {
  return (req, res, next) => {
    if (!req.file) return next();

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    const check = validateFileMagicBytes(req.file.buffer, allowedTypes);
    if (!check.valid) {
      return res.status(415).json({
        error: check.error,
        code: 'INVALID_FILE_SIGNATURE',
      });
    }

    // Sanitize filename on the file object
    req.file.safeName = sanitizeUploadFilename(req.file.originalname, check.detectedType);
    next();
  };
}

/**
 * Upload rate limiter: 15 uploads per 15 minutes per IP or user.
 */
export const uploadEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many file uploads. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

export default {
  detectBufferType,
  validateFileMagicBytes,
  sanitizeUploadFilename,
  requireValidFileSignature,
  uploadEndpointsLimiter,
};

