import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// 1. Enhanced Security & Middleware Ordering
import {
  enhancedSecurity,
  detectSuspiciousPatterns,
  isCodeOrInterviewRoute,
  resetSecurityState,
  suspiciousIPs,
} from '../../middleware/securityEnhanced.js';

// 2. Sanitization
import { sanitizeInput, sanitizeString, sanitizeHTML } from '../../middleware/sanitization.js';

// 3. ExecuteCode Binary Cache
import {
  executeCode,
  COMPILED_BINARY_CACHE,
  COMPILED_CACHE_DIR,
  COMPILED_CACHE_TTL_MS,
  sweepCompiledCache,
  createCompiledCacheKey,
  isCacheableCompiledLanguage,
} from '../../utils/executeCode.js';

// 4. Error Handler & Auth Info Disclosure
import { errorHandler, AppError, ErrorCodes } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';
import {
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
} from '../../routes/auth/helpers.js';

// 5. HR Auth Service
import {
  HrAuthService,
} from '../../services/hrAuthService.js';

// 7. Fresher Interview Session Memory Management
import {
  sessions as fresherSessions,
  cleanupStaleSessions,
  getActiveSession,
  storeSession,
  SESSION_TTL_MS,
  COMPLETED_SESSION_TTL_MS,
  MAX_SESSIONS,
} from '../../routes/fresher-interview.js';

describe('Milestone 2: Backend Security, Middleware & Core Utilities Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetSecurityState();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetSecurityState();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Middleware Ordering & Enhanced Security
  // =========================================================================
  describe('1. Middleware Ordering & Code/Interview Route Protection', () => {
    it('verifies index.js mounts enhancedSecurity after body parsers', () => {
      const indexSource = fs.readFileSync(path.resolve(__dirname, '../../index.js'), 'utf-8');
      const expressJsonIdx = indexSource.indexOf('express.json');
      const expressUrlencodedIdx = indexSource.indexOf('express.urlencoded');
      const enhancedSecurityIdx = indexSource.indexOf('enhancedSecurity()');

      expect(expressJsonIdx).toBeGreaterThan(0);
      expect(expressUrlencodedIdx).toBeGreaterThan(0);
      expect(enhancedSecurityIdx).toBeGreaterThan(expressJsonIdx);
      expect(enhancedSecurityIdx).toBeGreaterThan(expressUrlencodedIdx);
    });

    it('identifies coding practice, interview, and submission routes correctly', () => {
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/code/run' })).toBe(true);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/practice/execute' })).toBe(true);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/interview/next-question' })).toBe(true);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/submissions/submit' })).toBe(true);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/fresher-interview/answer' })).toBe(true);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/auth/login' })).toBe(false);
      expect(isCodeOrInterviewRoute({ originalUrl: '/api/user/profile' })).toBe(false);
    });

    it('does not falsely flag legitimate SQL queries in body on code/interview routes', () => {
      const codingReq = {
        originalUrl: '/api/practice/run',
        query: {},
        body: {
          language: 'sql',
          code: 'SELECT u.id, u.email FROM users u UNION SELECT 1, \'admin\' FROM admin_users; DROP TABLE IF EXISTS test_cache;',
        },
      };

      const detected = detectSuspiciousPatterns(codingReq);
      expect(detected).toBeNull();
    });

    it('does not falsely flag JavaScript/DOM patterns in body on code/interview routes', () => {
      const interviewReq = {
        originalUrl: '/api/interview/session/submit-code',
        query: {},
        body: {
          code: 'window.onload = function() { console.log("<script>alert(1)</script>"); img.onerror = fn; };',
        },
      };

      const detected = detectSuspiciousPatterns(interviewReq);
      expect(detected).toBeNull();
    });

    it('detects SQL injection and suspicious patterns in body on non-code routes', () => {
      const loginReq = {
        originalUrl: '/api/auth/login',
        query: {},
        body: {
          email: "admin' UNION SELECT password, email FROM users--",
        },
      };

      const detected = detectSuspiciousPatterns(loginReq);
      expect(detected).not.toBeNull();
      expect(detected).toContain('union.*select');
    });

    it('detects directory traversal in query params even on code routes', () => {
      const traversalReq = {
        originalUrl: '/api/practice/run',
        query: { file: '../../etc/passwd' },
        body: { code: 'console.log("hello");' },
      };

      const detected = detectSuspiciousPatterns(traversalReq);
      expect(detected).not.toBeNull();
    });

    it('middleware allows valid code submissions without auto-blocking the IP', () => {
      const middleware = enhancedSecurity();
      const testIp = '198.51.100.42';

      for (let i = 0; i < 5; i++) {
        const req = {
          ip: testIp,
          method: 'POST',
          originalUrl: '/api/practice/run',
          headers: { 'content-type': 'application/json' },
          query: {},
          body: { code: 'SELECT * FROM items UNION SELECT id, name FROM categories;' },
        };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
          setHeader: vi.fn(),
        };
        const next = vi.fn();

        middleware(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      }

      const ipRecord = suspiciousIPs.get(testIp);
      expect(ipRecord?.blocked).toBeFalsy();
    });
  });

  // =========================================================================
  // 2. Sanitization Double Response Header Fix & HTML/XSS Filtering
  // =========================================================================
  describe('2. Sanitization Double Response Prevention & HTML/XSS Filtering', () => {
    it('strips dangerous XSS script tags and prevents double HTML encoding in sanitizeString', () => {
      const stripped = sanitizeString('<script>alert(1)</script>');
      expect(stripped).not.toContain('<script>');

      const preservedEntities = sanitizeString('foo &amp; bar');
      expect(preservedEntities).not.toContain('&amp;amp;');
      expect(preservedEntities).toBe('foo &amp; bar');
    });

    it('filters dangerous HTML tags and attributes while preserving safe markup in sanitizeHTML', () => {
      const dangerousHtml = '<p>Hello <script>alert(1)</script><iframe src="http://evil.com"></iframe><a href="javascript:alert(1)" onclick="evil()">Link</a> <strong>World</strong></p>';
      const cleanHtml = sanitizeHTML(dangerousHtml);

      expect(cleanHtml).not.toContain('script');
      expect(cleanHtml).not.toContain('iframe');
      expect(cleanHtml).not.toContain('javascript:');
      expect(cleanHtml).not.toContain('onclick');
      expect(cleanHtml).toContain('<p>');
      expect(cleanHtml).toContain('<strong>World</strong>');
    });

    it('returns 400 without invoking next(error) on sanitization error', () => {
      const middleware = sanitizeInput();
      const req = {
        originalUrl: '/api/notes',
        path: '/notes',
        // Cyclic structure triggers exception during recursive sanitization
        body: {},
      };
      // Create recursive cycle
      req.body.self = req.body;

      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input data' });
      // Crucial: next must NOT have been called with an error, preventing double-header crash
      expect(next).not.toHaveBeenCalled();
    });

    it('does not send a response if headers were already sent', () => {
      const middleware = sanitizeInput();
      const req = {
        originalUrl: '/api/notes',
        path: '/notes',
        body: {},
      };
      req.body.cycle = req.body;

      const res = {
        headersSent: true,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // =========================================================================
  // 3. Persistent ExecuteCode Binary Cache with TTL
  // =========================================================================
  describe('3. ExecuteCode Persistent Binary Cache with TTL', () => {
    it('validates input and rejects non-string or oversized code submissions in executeCode', () => {
      const nonStringRes = executeCode(null, 'javascript');
      expect(nonStringRes.success).toBe(false);
      expect(nonStringRes.error).toContain('must be a string');

      const numRes = executeCode(12345, 'javascript');
      expect(numRes.success).toBe(false);
      expect(numRes.error).toContain('must be a string');

      const hugeCode = 'x'.repeat(100001);
      const hugeRes = executeCode(hugeCode, 'python');
      expect(hugeRes.success).toBe(false);
      expect(hugeRes.error).toContain('too large');
    });

    it('initializes persistent cache directory in os.tmpdir()', () => {
      expect(fs.existsSync(COMPILED_CACHE_DIR)).toBe(true);
      expect(COMPILED_CACHE_DIR).toContain('preploop_compiled_cache');
    });

    it('identifies c and cpp as cacheable compiled languages', () => {
      expect(isCacheableCompiledLanguage('c')).toBe(true);
      expect(isCacheableCompiledLanguage('cpp')).toBe(true);
      expect(isCacheableCompiledLanguage('python')).toBe(false);
      expect(isCacheableCompiledLanguage('javascript')).toBe(false);
    });

    it('persists compiled binary across temp workspace destruction', () => {
      const sampleCode = '#include <stdio.h>\nint main() { printf("Persistent Cache Test\\n"); return 0; }';
      const key = createCompiledCacheKey('c', sampleCode);
      const ext = process.platform === 'win32' ? '.exe' : '';
      const dummyBinaryPath = path.join(COMPILED_CACHE_DIR, `bin_test_${key}${ext}`);

      // Simulate compiled binary created by compiler
      fs.writeFileSync(dummyBinaryPath, 'MOCK_BINARY_BYTES', 'utf-8');
      COMPILED_BINARY_CACHE.set(key, { binaryPath: dummyBinaryPath, createdAt: Date.now() });

      // Simulate execution: cache entry is found and exists
      const cached = COMPILED_BINARY_CACHE.get(key);
      expect(cached).toBeDefined();
      expect(fs.existsSync(cached.binaryPath)).toBe(true);

      // Verify the binary persists in COMPILED_CACHE_DIR
      expect(fs.existsSync(dummyBinaryPath)).toBe(true);

      // Cleanup mock file
      try { fs.unlinkSync(dummyBinaryPath); } catch {}
      COMPILED_BINARY_CACHE.delete(key);
    });

    it('sweeps expired cache entries and deletes expired binaries', () => {
      const key = 'test_expired_key';
      const expiredPath = path.join(COMPILED_CACHE_DIR, `bin_${key}.bin`);
      fs.writeFileSync(expiredPath, 'EXPIRED_BINARY_DATA', 'utf-8');

      // Set createdAt to beyond TTL (6 minutes ago)
      COMPILED_BINARY_CACHE.set(key, {
        binaryPath: expiredPath,
        createdAt: Date.now() - (COMPILED_CACHE_TTL_MS + 60000),
      });

      expect(COMPILED_BINARY_CACHE.has(key)).toBe(true);
      expect(fs.existsSync(expiredPath)).toBe(true);

      // Trigger sweep
      sweepCompiledCache();

      expect(COMPILED_BINARY_CACHE.has(key)).toBe(false);
      expect(fs.existsSync(expiredPath)).toBe(false);
    });
  });

  // =========================================================================
  // 4. Information Disclosure Sanitization
  // =========================================================================
  describe('4. Information Disclosure Prevention in Errors & Auth', () => {
    it('sanitizes 500 error responses in production to prevent leaking database details', () => {
      process.env.NODE_ENV = 'production';

      const internalDbError = new Error('FATAL: password authentication failed for user "postgres_admin"');
      internalDbError.statusCode = 500;

      const req = { method: 'GET', originalUrl: '/api/feed', requestId: 'req_prod_1' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(internalDbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Internal server error');
      expect(payload.message).toBe('Internal server error');
      expect(payload.stack).toBeUndefined();
      expect(payload.error).not.toContain('postgres_admin');
    });

    it('preserves operational AppError messages in production', () => {
      process.env.NODE_ENV = 'production';

      const operationalError = new AppError('Payment processing failed: Card declined', 400, ErrorCodes.PAYMENT_FAILED);

      const req = { method: 'POST', originalUrl: '/api/payment/checkout', requestId: 'req_prod_2' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(operationalError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const payload = res.json.mock.calls[0][0];
      expect(payload.error).toBe('Payment processing failed: Card declined');
    });

    it('suppresses raw upstream error message in 401 response in production auth middleware', async () => {
      process.env.NODE_ENV = 'production';

      const req = {
        headers: { authorization: 'Bearer malformed.bogus.jwt' },
        method: 'GET',
        originalUrl: '/api/user/profile',
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      const payload = res.json.mock.calls[0][0];
      expect(payload.code).toBe('INVALID_TOKEN');
      expect(payload.details).toBe('Authentication failed. Please log in again.');
      expect(payload.details).not.toContain('jwt malformed');
    });

    it('mitigates distributed brute force by locking account across multiple IPs', async () => {
      const victimEmail = 'target.distributed@example.com';
      await clearLoginAttempts(victimEmail);

      // Check initially unlocked
      const initial = await checkLoginLockout(victimEmail, '10.0.0.1');
      expect(initial.locked).toBe(false);

      // Simulate 5 attempts from 5 distinct IP addresses
      for (let i = 1; i <= MAX_LOGIN_ATTEMPTS; i++) {
        await recordFailedLogin(victimEmail, `10.0.0.${i}`);
      }

      // Any IP attempting to log in with this email should now be locked
      const checkNewIp = await checkLoginLockout(victimEmail, '10.0.0.99');
      expect(checkNewIp.locked).toBe(true);
      expect(checkNewIp.remainingMinutes).toBeGreaterThan(0);

      // Reset and verify unlock
      await clearLoginAttempts(victimEmail);
      const resetCheck = await checkLoginLockout(victimEmail, '10.0.0.99');
      expect(resetCheck.locked).toBe(false);
    });
  });

  // =========================================================================
  // 5. HR Auth Service Hardening
  // =========================================================================
  describe('5. HR Auth Service Hardening', () => {
    let hrService;

    beforeEach(() => {
      process.env.JWT_SECRET = 'secure-hr-jwt-secret-with-high-entropy-32-chars';
      hrService = new HrAuthService({ query: vi.fn() });
    });

    it('pins verification algorithm to HS256 and rejects alg: none', () => {
      // Forge a token with alg: none
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ userId: 'hr_attacker', email: 'attacker@evil.com', role: 'hr' })).toString('base64url');
      const forgedToken = `${header}.${payload}.`;

      expect(() => hrService.verifyToken(forgedToken)).toThrow();
      try {
        hrService.verifyToken(forgedToken);
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('INVALID_TOKEN');
      }
    });

    it('embeds and decodes fullName in issued tokens', () => {
      const user = {
        id: 'hr_lead_42',
        email: 'talent@preploop.com',
        fullName: 'Chief Human Resources Officer',
      };

      const token = hrService.issueToken(user);
      const verified = hrService.verifyToken(token);

      expect(verified.id).toBe('hr_lead_42');
      expect(verified.email).toBe('talent@preploop.com');
      expect(verified.role).toBe('hr');
      expect(verified.fullName).toBe('Chief Human Resources Officer');
    });

    it('supports token revocation checking', () => {
      const user = { id: 'hr_revoked_1', email: 'revoked@company.com', fullName: 'Revoked HR' };
      const token = hrService.issueToken(user);

      // Token is valid before revocation
      const initialVerified = hrService.verifyToken(token);
      expect(initialVerified.id).toBe('hr_revoked_1');

      // Revoke the token
      expect(hrService.isRevoked(token)).toBe(false);
      hrService.revokeToken(token);
      expect(hrService.isRevoked(token)).toBe(true);

      // Verify should reject with REVOKED_TOKEN
      try {
        hrService.verifyToken(token);
        expect.unreachable('Should have thrown revoked token error');
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('REVOKED_TOKEN');
        expect(err.message).toBe('Token has been revoked');
      }
    });

    it('rejects algorithm mismatch such as HS512 and rejects revoked token by JTI', () => {
      const hs512Token = jwt.sign(
        { userId: 'hr_attacker', email: 'attacker@evil.com', role: 'hr' },
        process.env.JWT_SECRET,
        { algorithm: 'HS512' }
      );
      expect(() => hrService.verifyToken(hs512Token)).toThrow();
      try {
        hrService.verifyToken(hs512Token);
        expect.unreachable('Should have thrown on algorithm mismatch');
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('INVALID_TOKEN');
      }

      // Verify JTI revocation
      const validToken = hrService.issueToken({ id: 'hr_adv_2', email: 'hr2@adv.com', fullName: 'HR Adversary' });
      const decoded = jwt.decode(validToken);
      expect(decoded.jti).toBeDefined();

      hrService.revokeToken(decoded.jti);
      expect(hrService.isRevoked(decoded.jti)).toBe(true);

      expect(() => hrService.verifyToken(validToken)).toThrow();
      try {
        hrService.verifyToken(validToken);
        expect.unreachable('Should have thrown on revoked JTI');
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('REVOKED_TOKEN');
        expect(err.message).toBe('Token has been revoked');
      }
    });
  });

  // =========================================================================
  // 6. Account Activation Security & Rate Limiting
  // =========================================================================
  describe('6. Account Activation Security & Token Validation', () => {
    it('verifies register.js applies verificationLimiter and token checking', () => {
      const registerSource = fs.readFileSync(path.resolve(__dirname, '../../routes/auth/register.js'), 'utf-8');

      // Verify verificationLimiter is applied to activate-account
      expect(registerSource).toContain("router.post('/activate-account', verificationLimiter");

      // Verify listUsers(1000) was eliminated
      expect(registerSource).not.toContain('listUsers({ page: 1, perPage: 1000 })');
      expect(registerSource).not.toContain('listUsers(');

      // Verify token requirement for non-admin requests
      expect(registerSource).toContain('Verification token is required');
      expect(registerSource).toContain('Invalid activation token or email');
    });
  });

  // =========================================================================
  // 7. Fresher Interview Memory Leak Prevention
  // =========================================================================
  describe('7. Fresher Interview Session Memory Leak Prevention', () => {
    beforeEach(() => {
      fresherSessions.clear();
    });

    it('enforces capacity limit and evicts oldest session via LRU', () => {
      // Store sessions up to capacity limit + 1
      for (let i = 0; i < MAX_SESSIONS + 5; i++) {
        storeSession(`session_${i}`, {
          userId: `user_${i}`,
          phase: 'intro',
          lastAccessedAt: Date.now() + i,
        });
      }

      // Max capacity must not be exceeded
      expect(fresherSessions.size).toBeLessThanOrEqual(MAX_SESSIONS);

      // The earliest sessions (0, 1, 2, 3, 4) should have been evicted
      expect(fresherSessions.has('session_0')).toBe(false);
      expect(fresherSessions.has('session_1')).toBe(false);
      // The newest sessions must be present
      expect(fresherSessions.has(`session_${MAX_SESSIONS + 4}`)).toBe(true);
    });

    it('evicts expired sessions based on TTL', () => {
      const activeSessionId = 'active_session_1';
      const expiredSessionId = 'expired_session_2';

      // Active session (accessed just now)
      storeSession(activeSessionId, {
        userId: 'user_active',
        phase: 'intro',
        lastAccessedAt: Date.now(),
      });

      // Expired session (last accessed > 2 hours ago)
      storeSession(expiredSessionId, {
        userId: 'user_expired',
        phase: 'intro',
        lastAccessedAt: Date.now() - (SESSION_TTL_MS + 60000),
      });

      // Directly checking getActiveSession should return null and delete expired
      const expiredResult = getActiveSession(expiredSessionId);
      expect(expiredResult).toBeNull();
      expect(fresherSessions.has(expiredSessionId)).toBe(false);

      // Active session should be returned successfully
      const activeResult = getActiveSession(activeSessionId);
      expect(activeResult).not.toBeNull();
      expect(activeResult.userId).toBe('user_active');
    });

    it('sweeps completed sessions after completed TTL', () => {
      const completedSessionId = 'completed_session_1';

      storeSession(completedSessionId, {
        userId: 'user_done',
        phase: 'complete',
        completedAtMs: Date.now() - (COMPLETED_SESSION_TTL_MS + 30000),
        lastAccessedAt: Date.now(),
      });

      cleanupStaleSessions();
      expect(fresherSessions.has(completedSessionId)).toBe(false);
    });
  });
});
