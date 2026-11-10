import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Round 13 Bugs Verification (M1 - M9)', () => {
  const backendDir = path.resolve(__dirname, '../..');
  const frontendDir = path.resolve(__dirname, '../../../frontend');

  const readBackend = (relativePath) => fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
  const readFrontend = (relativePath) => fs.readFileSync(path.join(frontendDir, relativePath), 'utf8');

  describe('M1: Raw error.message leak prevented in signup', () => {
    it('verifies register.js does not leak raw Supabase error.message', () => {
      const registerCode = readBackend('routes/auth/register.js');

      // Must not return error.message directly
      expect(registerCode).not.toMatch(/return res\.status\(400\)\.json\(\{\s*error:\s*error\.message\s*\}\);/);
      expect(registerCode).toMatch(/Unable to create account\. Please check your details and try again\./);
    });
  });

  describe('M2 & M3: Rate limiters on study group creation and join', () => {
    it('verifies groupCreationLimiter is applied to POST / and groupJoinLimiter to POST /:id/join', () => {
      const studyGroupsCode = readBackend('routes/study-groups.js');

      expect(studyGroupsCode).toMatch(/const groupCreationLimiter = rateLimit\(\{/);
      expect(studyGroupsCode).toMatch(/const groupJoinLimiter = rateLimit\(\{/);
      expect(studyGroupsCode).toMatch(/router\.post\('\/',\s*authenticateToken,\s*groupCreationLimiter/);
      expect(studyGroupsCode).toMatch(/router\.post\('\/:id\/join',\s*authenticateToken,\s*groupJoinLimiter/);
    });
  });

  describe('M4: member_count decremented and synchronized on leave', () => {
    it('verifies study-groups.js updates member_count when a user leaves', () => {
      const studyGroupsCode = readBackend('routes/study-groups.js');

      expect(studyGroupsCode).toMatch(/router\.post\('\/:id\/leave'/);
      expect(studyGroupsCode).toMatch(/from\('study_groups'\)[\s\S]*?\.update\(\{\s*member_count:\s*updatedCount\s*\}\)[\s\S]*?\.eq\('id',\s*id\)/);
    });
  });

  describe('M5: tags array sanitized for HTML/XSS', () => {
    it('verifies study-groups.js sanitizes tags array items with sanitizeHtml', () => {
      const studyGroupsCode = readBackend('routes/study-groups.js');

      expect(studyGroupsCode).toMatch(/sanitizeHtml\(String\(t\),\s*\{\s*allowedTags:\s*\[\],\s*allowedAttributes:\s*\{\}\s*\}\)/);
    });
  });

  describe('M6: subscription_tier query has .limit() in admin.js', () => {
    it('verifies admin.js has .limit() on SELECT subscription_tier FROM profiles', () => {
      const adminCode = readBackend('routes/admin.js');

      expect(adminCode).toMatch(/\.from\('profiles'\)[\s\S]*?\.select\('subscription_tier'\)[\s\S]*?\.limit\(\d+\)/);
    });
  });

  describe('M7: CAPTCHA verification is enforced when configured', () => {
    it('verifies register.js calls verifyCaptcha(captchaToken) unconditionally', () => {
      const registerCode = readBackend('routes/auth/register.js');

      expect(registerCode).toMatch(/import \{ verifyCaptcha \} from '\.\.\/\.\.\/utils\/captcha\.js';/);
      expect(registerCode).toMatch(/const captchaResult = await verifyCaptcha\(captchaToken\);/);
      expect(registerCode).toMatch(/if \(!captchaResult\.success\) \{\s*return res\.status\(400\)\.json\(\{ error: captchaResult\.error \}\);/);
    });
  });

  describe('M8: emoji and color validation on group creation', () => {
    it('verifies study-groups.js validates emoji (no HTML, length <= 10) and color (valid hex)', () => {
      const studyGroupsCode = readBackend('routes/study-groups.js');

      // Hex color validation
      expect(studyGroupsCode).toMatch(/\/\^#\(\[0-9a-fA-F\]\{3\}\|\[0-9a-fA-F\]\{6\}\)\$\//);
      // Emoji sanitization & validation
      expect(studyGroupsCode).toMatch(/safeEmoji/);
      expect(studyGroupsCode).toMatch(/rawEmoji\.length <= 10/);
    });
  });

  describe('M9: CoinContext fetch calls are AbortController-guarded across all call sites', () => {
    it('verifies CoinContext.jsx wraps in-flight requests in managed AbortControllers and cleans up on unmount', () => {
      const coinContextCode = readFrontend('src/context/CoinContext.jsx');

      expect(coinContextCode).toMatch(/activeControllersRef = useRef\(new Set\(\)\);/);
      expect(coinContextCode).toMatch(/createManagedSignal/);
      expect(coinContextCode).toMatch(/releaseController/);
      expect(coinContextCode).toMatch(/ctrl\.abort\(\)/);
      expect(coinContextCode).toMatch(/fetchBalance:\s*refreshBalance/);
    });
  });
});

