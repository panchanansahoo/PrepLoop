import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getProductionEnvValidationErrors, validateStartupEnv } from '../../config/startupEnvValidation.js';
import { stripControlCharacters } from '../../services/resumeTextExtractor.js';
import aiFeaturesRouter from '../../routes/ai-features.js';

describe('Round 15 Verification Suite (P0 - P4 Bug Fixes)', () => {
  const backendDir = path.resolve(__dirname, '../..');
  const readBackend = (relativePath) => fs.readFileSync(path.join(backendDir, relativePath), 'utf8');

  describe('P0: Auth Signup emailDelivery scoping and reference safety', () => {
    it('verifies emailDelivery is hoisted before shouldRequireVerification check in register.js', () => {
      const registerCode = readBackend('routes/auth/register.js');

      // Verify emailDelivery is declared at handler scope with safe defaults
      expect(registerCode).toMatch(/let emailDelivery = \{\s*sent:\s*false,\s*status:\s*['"]skipped['"],\s*warning:\s*null\s*\};/);

      // Verify the declaration precedes the verification block
      const hoistedIndex = registerCode.indexOf("let emailDelivery = { sent: false, status: 'skipped', warning: null };");
      const ifBlockIndex = registerCode.indexOf("if (shouldRequireVerification && !legacyMode) {");
      expect(hoistedIndex).toBeGreaterThan(0);
      expect(ifBlockIndex).toBeGreaterThan(hoistedIndex);

      // Verify inside the if block it assigns without re-declaring (no "let emailDelivery =")
      const afterIfBlock = registerCode.slice(ifBlockIndex);
      expect(afterIfBlock).not.toMatch(/let emailDelivery\s*=/);
      expect(afterIfBlock).toMatch(/emailDelivery\s*=\s*\{\s*sent:\s*false,\s*status:\s*['"]unconfigured['"]/);
    });
  });

  describe('P1: PostgREST .range(offset, offset + limit - 1) pagination conformance', () => {
    it('verifies study-groups.js GET / uses .range instead of .limit', () => {
      const code = readBackend('routes/study-groups.js');
      expect(code).toMatch(/\.from\(['"]study_groups['"]\)[\s\S]*?\.range\(offset,\s*offset\s*\+\s*limit\s*-\s*1\)/);
    });

    it('verifies study-groups.js GET /:id/members uses .range instead of .limit', () => {
      const code = readBackend('routes/study-groups.js');
      expect(code).toMatch(/\.from\(['"]study_group_members['"]\)[\s\S]*?\.range\(offset,\s*offset\s*\+\s*limit\s*-\s*1\)/);
    });

    it('verifies ai-features.js GET /code-review/problem/:problemId and /code-review/:problemId/reviews use .range', () => {
      const code = readBackend('routes/ai-features.js');
      expect(code).toMatch(/code-review\/problem\/:problemId[\s\S]*?\.range\(offset,\s*offset\s*\+\s*limit\s*-\s*1\)/);
    });

    it('verifies ai-features router registers both problem review paths and performance trends paths', () => {
      const registeredPaths = aiFeaturesRouter.stack
        .filter(l => l.route)
        .map(l => l.route.path);

      const reviewRoute = registeredPaths.find(p => Array.isArray(p) && p.includes('/code-review/:problemId/reviews'));
      expect(reviewRoute).toBeDefined();
      expect(reviewRoute).toContain('/code-review/problem/:problemId');
      expect(reviewRoute).toContain('/code-review/:problemId/reviews');

      const trendsRoute = registeredPaths.find(p => Array.isArray(p) && p.includes('/interview/performance-trends'));
      expect(trendsRoute).toBeDefined();
      expect(trendsRoute).toContain('/performance-trends');
      expect(trendsRoute).toContain('/interview/performance-trends');
    });

    it('verifies notes.js GET /bookmarks uses .range and applies filters before pagination', () => {
      const code = readBackend('routes/notes.js');
      expect(code).toMatch(/\.from\(["']bookmarks["']\)[\s\S]*?\.range\(offset,\s*offset\s*\+\s*limit\s*-\s*1\)/);
      // Filter must be applied before range pagination
      const eqIndex = code.indexOf('.eq("question_type", type)');
      const rangeIndex = code.indexOf('.range(offset, offset + limit - 1)');
      expect(eqIndex).toBeGreaterThan(0);
      expect(rangeIndex).toBeGreaterThan(eqIndex);
    });

    it('verifies pagination offset calculation across boundary cases', () => {
      const calcPagination = (queryPage, queryLimit) => {
        const page = Math.max(parseInt(queryPage, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(queryLimit, 10) || 50, 1), 100);
        const offset = (page - 1) * limit;
        return { page, limit, offset, rangeStart: offset, rangeEnd: offset + limit - 1 };
      };

      // Page 1 default
      expect(calcPagination(1, 50)).toEqual({ page: 1, limit: 50, offset: 0, rangeStart: 0, rangeEnd: 49 });
      // Page 2
      expect(calcPagination(2, 50)).toEqual({ page: 2, limit: 50, offset: 50, rangeStart: 50, rangeEnd: 99 });
      // Page 3, limit 20
      expect(calcPagination(3, 20)).toEqual({ page: 3, limit: 20, offset: 40, rangeStart: 40, rangeEnd: 59 });
      // Negative / zero / invalid page should default to 1
      expect(calcPagination(0, 50)).toEqual({ page: 1, limit: 50, offset: 0, rangeStart: 0, rangeEnd: 49 });
      expect(calcPagination(-5, 50)).toEqual({ page: 1, limit: 50, offset: 0, rangeStart: 0, rangeEnd: 49 });
      expect(calcPagination('invalid', 50)).toEqual({ page: 1, limit: 50, offset: 0, rangeStart: 0, rangeEnd: 49 });
      // Limit capped at max 100
      expect(calcPagination(1, 500)).toEqual({ page: 1, limit: 100, offset: 0, rangeStart: 0, rangeEnd: 99 });
      expect(calcPagination(1, -10)).toEqual({ page: 1, limit: 1, offset: 0, rangeStart: 0, rangeEnd: 0 });
    });
  });

  describe('P2: Clean code, zero ESLint control regex suppression, and valid text cleanup', () => {
    it('verifies stripControlCharacters cleans ASCII/C0/C1 control characters without regex suppression', () => {
      // Test string with null, bell, backspace, vertical tab, formfeed, shift-out, unit separator, del, and non-printable C1
      const dirty = 'Resume\x00Title\x07\x08Section\x0B\x0C\x0E\x1FContent\x7F\x80\x9FEnd';
      const cleaned = stripControlCharacters(dirty);
      expect(cleaned).toBe('Resume Title  Section    Content   End');

      // Preserves tabs, newlines, and carriage returns
      const formatted = 'Header\tName\nPhone\r\nSkills: JavaScript';
      expect(stripControlCharacters(formatted)).toBe(formatted);
    });

    it('verifies resumeTextExtractor does NOT use eslint-disable-next-line no-control-regex', () => {
      const extractorCode = readBackend('services/resumeTextExtractor.js');
      expect(extractorCode).not.toContain('eslint-disable-next-line no-control-regex');
    });
  });

  describe('P3: Frontend bundle analyzer gating in vite.config.js', () => {
    it('verifies visualizer plugin is gated strictly behind ANALYZE === "true"', () => {
      const frontendViteConfig = fs.readFileSync(path.join(backendDir, '../frontend/vite.config.js'), 'utf8');
      expect(frontendViteConfig).toMatch(/process\.env\.ANALYZE\s*===\s*['"]true['"]\s*\?\s*\[\s*visualizer/);
      expect(frontendViteConfig).not.toMatch(/!\s*isTest\s*\?\s*\[\s*visualizer/);
    });
  });

  describe('P4: Missing DATABASE_URL non-fatal handling in development mode', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.SUPABASE_URL = 'https://valid.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'valid-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';
      process.env.JWT_SECRET = 'super-secret-random-jwt-key-minimum-32-chars-long';
      process.env.FRONTEND_URL = 'http://localhost:5173';
      process.env.HR_AUTH_ENABLED = 'true';
      delete process.env.DATABASE_URL;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('does NOT push fatal DATABASE_URL error when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const errors = getProductionEnvValidationErrors();
      const hasDbUrlError = errors.some(err => err.includes('DATABASE_URL'));
      expect(hasDbUrlError).toBe(false);
      expect(() => validateStartupEnv()).not.toThrow();
    });

    it('does NOT push fatal DATABASE_URL error when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const errors = getProductionEnvValidationErrors();
      const hasDbUrlError = errors.some(err => err.includes('DATABASE_URL'));
      expect(hasDbUrlError).toBe(false);
      expect(() => validateStartupEnv()).not.toThrow();
    });

    it('DOES push fatal DATABASE_URL error when NODE_ENV is production and HR_AUTH_ENABLED is true', () => {
      process.env.NODE_ENV = 'production';
      const errors = getProductionEnvValidationErrors();
      const hasDbUrlError = errors.some(err => err.includes('DATABASE_URL is required when HR_AUTH_ENABLED=true'));
      expect(hasDbUrlError).toBe(true);
      expect(() => validateStartupEnv()).toThrow(/Startup validation failed/);
    });
  });
});
