import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_PLAYGROUND_CODE_LENGTH,
  MAX_PLAYGROUND_PROMPT_LENGTH,
  MAX_HISTORY_CONTENT_LENGTH,
} from '../../routes/ai.js';
import {
  MAX_CODE_SNAPSHOT_LENGTH,
  MAX_FEEDBACK_NOTES_LENGTH,
  sanitizePeerInterviewScores,
} from '../../routes/peerInterview.js';
import { hrRegisterLimiter } from '../../middleware/rateLimiter.js';
import {
  HrAuthService,
  MAX_HR_FULL_NAME_LENGTH,
  MAX_HR_COMPANY_LENGTH,
  MAX_HR_DESIGNATION_LENGTH,
} from '../../services/hrAuthService.js';
import { MAX_FOLLOW_UP_HISTORY_ENTRIES } from '../../routes/company-interview/interaction.js';

describe('Round 14 Bugs Verification (N1 - N8)', () => {
  const backendDir = path.resolve(__dirname, '../..');
  const readBackend = (relativePath) => fs.readFileSync(path.join(backendDir, relativePath), 'utf8');

  describe('N1 & N2: /playground-assist code, prompt & history length caps', () => {
    it('verifies length constants are exported with safe bounds', () => {
      expect(MAX_PLAYGROUND_CODE_LENGTH).toBe(50000);
      expect(MAX_PLAYGROUND_PROMPT_LENGTH).toBe(2000);
      expect(MAX_HISTORY_CONTENT_LENGTH).toBe(4000);
    });

    it('verifies routes/ai.js caps code, prompt and history content', () => {
      const aiRouteCode = readBackend('routes/ai.js');

      expect(aiRouteCode).toMatch(/code\.slice\(0,\s*MAX_PLAYGROUND_CODE_LENGTH\)/);
      expect(aiRouteCode).toMatch(/prompt\.slice\(0,\s*MAX_PLAYGROUND_PROMPT_LENGTH\)/);
      expect(aiRouteCode).toMatch(/msg\.content\.slice\(0,\s*MAX_HISTORY_CONTENT_LENGTH\)/);
      expect(aiRouteCode).toMatch(/recentHistory\s*=\s*history\.slice\(-6\)/);
    });
  });

  describe('N3: Peer interview completion ownership check', () => {
    it('verifies /:roomCode/complete enforces room participant or admin check', () => {
      const peerCode = readBackend('routes/peerInterview.js');

      expect(peerCode).toMatch(/room\.interviewer_id\s*!==\s*userId\s*&&\s*room\.candidate_id\s*!==\s*userId\s*&&\s*req\.user\.role\s*!==\s*'admin'/);
      expect(peerCode).toMatch(/return res\.status\(403\)\.json\(\{\s*error:\s*'You are not authorized to complete this interview'/);
    });
  });

  describe('N4: Peer interview codeSnapshot and feedbackNotes length caps', () => {
    it('verifies constants and slicing of codeSnapshot and feedbackNotes', () => {
      expect(MAX_CODE_SNAPSHOT_LENGTH).toBe(50000);
      expect(MAX_FEEDBACK_NOTES_LENGTH).toBe(5000);

      const peerCode = readBackend('routes/peerInterview.js');
      expect(peerCode).toMatch(/codeSnapshot\.slice\(0,\s*MAX_CODE_SNAPSHOT_LENGTH\)/);
      expect(peerCode).toMatch(/feedbackNotes\.slice\(0,\s*MAX_FEEDBACK_NOTES_LENGTH\)/);
    });
  });

  describe('N5: HR register rate limiter', () => {
    it('verifies hrRegisterLimiter is defined and applied to POST /register in routes/hr.js', () => {
      expect(hrRegisterLimiter).toBeDefined();

      const hrCode = readBackend('routes/hr.js');
      expect(hrCode).toMatch(/router\.post\('\/register',\s*hrRegisterLimiter,/);
    });
  });

  describe('N6: HR registration input length guards', () => {
    it('verifies max length constants are defined', () => {
      expect(MAX_HR_FULL_NAME_LENGTH).toBe(100);
      expect(MAX_HR_COMPANY_LENGTH).toBe(150);
      expect(MAX_HR_DESIGNATION_LENGTH).toBe(100);
    });

    it('rejects oversized fullName, company, designation, email, and password', async () => {
      const mockPool = {
        query: vi.fn(),
      };
      const hrService = new HrAuthService(mockPool);

      // Oversized fullName (>100 chars)
      await expect(
        hrService.register({
          fullName: 'A'.repeat(101),
          email: 'valid@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(/Full name must not exceed 100 characters/);

      // Oversized company (>150 chars)
      await expect(
        hrService.register({
          fullName: 'Alice Smith',
          email: 'valid@example.com',
          password: 'Password123!',
          company: 'C'.repeat(151),
        })
      ).rejects.toThrow(/Company name must not exceed 150 characters/);

      // Oversized designation (>100 chars)
      await expect(
        hrService.register({
          fullName: 'Alice Smith',
          email: 'valid@example.com',
          password: 'Password123!',
          designation: 'D'.repeat(101),
        })
      ).rejects.toThrow(/Designation must not exceed 100 characters/);

      // Oversized email (>255 chars)
      await expect(
        hrService.register({
          fullName: 'Alice Smith',
          email: `${'e'.repeat(250)}@example.com`,
          password: 'Password123!',
        })
      ).rejects.toThrow(/Email must not exceed 255 characters/);

      // Oversized password (>128 chars)
      await expect(
        hrService.register({
          fullName: 'Alice Smith',
          email: 'valid@example.com',
          password: 'P'.repeat(129),
        })
      ).rejects.toThrow(/Password must not exceed 128 characters/);
    });
  });

  describe('N7: Peer interview scores schema validation and clamping', () => {
    it('sanitizes and clamps score values, strips non-numeric and nested objects', () => {
      const dirtyScores = {
        communication: 85,
        technical: 120, // should clamp to 100
        problemSolving: -10, // should clamp to 0
        overall: '92.5', // parses string to float 92.5
        nestedEvil: { $where: '1=1' }, // rejected (not finite number)
        hackScript: '<script>alert(1)</script>', // rejected
        'very_long_illegal_key_name_that_exceeds_thirty_chars': 99, // rejected
        decomposition: 75.333, // rounded to 1 decimal place: 75.3
      };

      const clean = sanitizePeerInterviewScores(dirtyScores);

      expect(clean).toEqual({
        communication: 85,
        technical: 100,
        problemSolving: 0,
        overall: 92.5,
        decomposition: 75.3,
      });

      // Handles null, non-object, and array inputs gracefully
      expect(sanitizePeerInterviewScores(null)).toEqual({});
      expect(sanitizePeerInterviewScores('not an object')).toEqual({});
      expect(sanitizePeerInterviewScores([1, 2, 3])).toEqual({});
    });
  });

  describe('N8: /follow-up conversationHistory element count cap', () => {
    it('verifies MAX_FOLLOW_UP_HISTORY_ENTRIES is 50 and routes/company-interview/interaction.js slices history', () => {
      expect(MAX_FOLLOW_UP_HISTORY_ENTRIES).toBe(50);

      const interactionCode = readBackend('routes/company-interview/interaction.js');
      expect(interactionCode).toMatch(/rawConversationHistory\.slice\(-MAX_FOLLOW_UP_HISTORY_ENTRIES\)/);
      expect(interactionCode).toMatch(/content:\s*typeof item\?\.content === 'string'/);
    });
  });
});

