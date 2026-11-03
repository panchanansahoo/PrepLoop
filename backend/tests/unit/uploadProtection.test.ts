import { describe, it, expect } from 'vitest';
import {
  detectBufferType,
  validateFileMagicBytes,
  sanitizeUploadFilename,
  requireValidFileSignature,
} from '../../middleware/uploadProtection.js';

describe('Upload Protection Middleware', () => {
  describe('detectBufferType & validateFileMagicBytes', () => {
    it('accurately identifies genuine PDF binary signature', () => {
      const pdfBuffer = Buffer.from('%PDF-1.7 header content here');
      expect(detectBufferType(pdfBuffer)).toBe('pdf');

      const check = validateFileMagicBytes(pdfBuffer, ['pdf']);
      expect(check.valid).toBe(true);
      expect(check.detectedType).toBe('pdf');
    });

    it('accurately identifies DOCX (ZIP container) binary signature', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      expect(detectBufferType(docxBuffer)).toBe('docx');

      const check = validateFileMagicBytes(docxBuffer, ['docx']);
      expect(check.valid).toBe(true);
    });

    it('accurately identifies PNG and JPEG image signatures', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(detectBufferType(pngBuffer)).toBe('png');
      expect(validateFileMagicBytes(pngBuffer, ['image']).valid).toBe(true);

      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(detectBufferType(jpegBuffer)).toBe('jpeg');
      expect(validateFileMagicBytes(jpegBuffer, ['image']).valid).toBe(true);
    });

    it('accurately identifies audio signatures (WebM, WAV, MP3)', () => {
      const webmBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f]);
      expect(detectBufferType(webmBuffer)).toBe('webm');
      expect(validateFileMagicBytes(webmBuffer, ['audio']).valid).toBe(true);

      const wavBuffer = Buffer.from('RIFF....WAVEfmt ');
      expect(detectBufferType(wavBuffer)).toBe('wav');
      expect(validateFileMagicBytes(wavBuffer, ['audio']).valid).toBe(true);

      const mp3Buffer = Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00');
      expect(detectBufferType(mp3Buffer)).toBe('mp3');
      expect(validateFileMagicBytes(mp3Buffer, ['audio']).valid).toBe(true);
    });

    it('rejects disguised executables and shell scripts spoofed as PDF', () => {
      // ELF binary header: 0x7F, 'ELF'
      const elfExecutable = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01]);
      const check = validateFileMagicBytes(elfExecutable, ['pdf']);

      expect(check.valid).toBe(false);
      expect(check.error).toContain('File signature mismatch');
    });

    it('rejects empty or corrupt buffers', () => {
      expect(validateFileMagicBytes(Buffer.alloc(0), ['pdf']).valid).toBe(false);
    });
  });

  describe('sanitizeUploadFilename', () => {
    it('neutralizes directory traversal patterns', () => {
      const traversalName = '../../../../etc/passwd.pdf';
      const safe = sanitizeUploadFilename(traversalName, 'pdf');

      expect(safe).not.toContain('..');
      expect(safe).not.toContain('/');
      expect(safe).not.toContain('\\');
      expect(safe.endsWith('.pdf')).toBe(true);
      expect(safe.length).toBeGreaterThan(36); // UUID + .pdf
    });

    it('generates unique collision-resistant UUIDs', () => {
      const name1 = sanitizeUploadFilename('resume.pdf');
      const name2 = sanitizeUploadFilename('resume.pdf');
      expect(name1).not.toBe(name2);
    });
  });

  describe('requireValidFileSignature middleware', () => {
    it('allows valid PDF files through to next()', () => {
      const middleware = requireValidFileSignature(['pdf']);
      const req: any = {
        file: {
          originalname: 'my_resume.pdf',
          buffer: Buffer.from('%PDF-1.7 valid content'),
        },
      };
      let nextCalled = false;
      const res: any = {};

      middleware(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(req.file.safeName).toBeDefined();
      expect(req.file.safeName.endsWith('.pdf')).toBe(true);
    });

    it('blocks spoofed file with HTTP 415', () => {
      const middleware = requireValidFileSignature(['pdf']);
      const req: any = {
        file: {
          originalname: 'malware.pdf',
          buffer: Buffer.from('MZ\x90\x00\x03\x00\x00\x00 Windows executable'),
        },
      };
      let nextCalled = false;
      let statusCode = 0;
      let jsonPayload: any = null;
      const res: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          jsonPayload = data;
          return this;
        },
      };

      middleware(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(415);
      expect(jsonPayload?.code).toBe('INVALID_FILE_SIGNATURE');
    });
  });
});

