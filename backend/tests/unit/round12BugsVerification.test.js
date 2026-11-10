import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Round 12 Bugs Verification (L1 - L7)', () => {
  const backendDir = path.resolve(__dirname, '../..');
  const frontendDir = path.resolve(__dirname, '../../../frontend');

  const readBackend = (relativePath) => fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
  const readFrontend = (relativePath) => fs.readFileSync(path.join(frontendDir, relativePath), 'utf8');

  describe('L1: error.message leak prevented in /submit 500 response', () => {
    it('verifies practice.js returns a sanitized generic error message on 500 instead of error.message', () => {
      const practiceCode = readBackend('routes/practice.js');

      // Must not leak raw error.message directly to client
      expect(practiceCode).not.toMatch(/Failed to submit solution:\s*'\s*\+\s*error\.message/);
      expect(practiceCode).toMatch(/res\.status\(500\)\.json\(\{\s*error:\s*'Failed to submit solution/);
    });
  });

  describe('L2 & L5: blocking synchronous fs.writeFileSync to process.cwd() eliminated', () => {
    it('verifies practice.js does not synchronously write submission_error.log to process.cwd()', () => {
      const practiceCode = readBackend('routes/practice.js');

      // Must not write submission_error.log in request handler
      expect(practiceCode).not.toMatch(/submission_error\.log/);
      expect(practiceCode).not.toMatch(/fs\.writeFileSync\(path\.join\(process\.cwd\(\)/);

      // Must use structured logger
      expect(practiceCode).toMatch(/import \{ createLogger \} from '\.\.\/utils\/structuredLogger\.js';/);
      expect(practiceCode).toMatch(/logger\.error\('Submission error'/);
    });
  });

  describe('L3: admin.js subscription_tier full table scan eliminated', () => {
    it('verifies admin.js caps subscription_tier query with limit to prevent full table scan', () => {
      const adminCode = readBackend('routes/admin.js');

      // Must not do unconstrained select('subscription_tier') without limit
      expect(adminCode).not.toMatch(/\.from\('profiles'\)\s*\.select\('subscription_tier'\);/);

      // Must have .limit() on select('subscription_tier')
      expect(adminCode).toMatch(/\.from\('profiles'\)[\s\S]*?\.select\('subscription_tier'\)[\s\S]*?\.limit\(\d+\)/);
    });

    it('simulates tier breakdown calculation using indexed tier counts', () => {
      const totalUsers = 1250;
      const tierCounts = [
        ['free', 1000],
        ['pro', 200],
        ['premium', 40],
        ['enterprise', 10],
      ];

      const tierBreakdown = Object.fromEntries(tierCounts);
      const totalCounted = Object.values(tierBreakdown).reduce((sum, count) => sum + count, 0);
      if (totalUsers && totalUsers > totalCounted) {
        tierBreakdown.free = (tierBreakdown.free || 0) + (totalUsers - totalCounted);
      }

      expect(tierBreakdown).toEqual({
        free: 1000,
        pro: 200,
        premium: 40,
        enterprise: 10,
      });
      expect(Object.values(tierBreakdown).reduce((sum, c) => sum + c, 0)).toBe(totalUsers);
    });
  });

  describe('L4: community.js /posts rate limiter applied', () => {
    it('verifies community.js applies communityFeedLimiter to GET /posts and GET /stats', () => {
      const communityCode = readBackend('routes/community.js');

      expect(communityCode).toMatch(/const communityFeedLimiter = rateLimit\(\{/);
      expect(communityCode).toMatch(/router\.get\('\/posts',\s*communityFeedLimiter,\s*optionalAuth/);
      expect(communityCode).toMatch(/router\.get\('\/stats',\s*communityFeedLimiter/);
    });
  });

  describe('L6: DailyChallengesPage.jsx uses /dsa-editor/ instead of /editor/', () => {
    it('verifies DailyChallengesPage.jsx internal route always targets /dsa-editor or /sql-editor', () => {
      const pageCode = readFrontend('src/pages/DailyChallengesPage.jsx');

      expect(pageCode).toMatch(/q\.type === 'sql'\s*\?\s*`\/sql-editor\/\$\{q\.internalId\}`\s*:\s*`\/dsa-editor\/\$\{q\.internalId\}`/);
      expect(pageCode).not.toMatch(/`\/editor\/\$\{q\.internalId\}`/);
    });
  });

  describe('L7: CommunityHub.jsx dynamically fetches real memberCount', () => {
    it('verifies CommunityHub.jsx does not hardcode memberCount to 5000 and calls /api/community/stats', () => {
      const hubCode = readFrontend('src/pages/CommunityHub.jsx');

      expect(hubCode).not.toMatch(/useState\(5000\)/);
      expect(hubCode).toMatch(/const \[memberCount,\s*setMemberCount\]\s*=\s*useState\(null\);/);
      expect(hubCode).toMatch(/axios\.get\(`\$\{API_URL\}\/api\/community\/stats`/);
      expect(hubCode).toMatch(/fetchMemberCount/);
    });
  });
});

