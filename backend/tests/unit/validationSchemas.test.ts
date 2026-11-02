import { describe, it, expect } from 'vitest';
import {
  createPeerRoomSchema,
  matchPeerRoomSchema,
  peerRoomParamSchema,
  createApiKeySchema,
  createWebhookSchema,
  createQuestionBankSchema,
  challengeSubmissionSchema,
  roadmapQuerySchema,
} from '../../schemas/requestSchemas.js';

describe('Universal Request Validation Schemas', () => {
  describe('Peer Interview Schemas', () => {
    it('accepts valid create peer room payload and defaults language', () => {
      const { error, value } = createPeerRoomSchema.validate({ problemId: 'prob-123' });
      expect(error).toBeUndefined();
      expect(value.language).toBe('javascript');
      expect(value.problemId).toBe('prob-123');
    });

    it('rejects unsupported language in create peer room', () => {
      const { error } = createPeerRoomSchema.validate({ language: 'cobol' });
      expect(error).toBeDefined();
    });

    it('validates peer room code format (PREP-XXXX)', () => {
      const valid = peerRoomParamSchema.validate({ roomCode: 'PREP-ABC123' });
      expect(valid.error).toBeUndefined();

      const invalid = peerRoomParamSchema.validate({ roomCode: 'MALICIOUS--CODE' });
      expect(invalid.error).toBeDefined();
    });

    it('validates peer match queue options', () => {
      const { error, value } = matchPeerRoomSchema.validate({
        role: 'Frontend Architect',
        skillLevel: 'advanced',
        preferredLanguage: 'typescript',
      });
      expect(error).toBeUndefined();
      expect(value.skillLevel).toBe('advanced');
    });
  });

  describe('Employer & API Platform Schemas', () => {
    it('validates API key creation with valid scopes', () => {
      const { error, value } = createApiKeySchema.validate({
        name: 'Production Analytics Bot',
        scopes: ['interviews:read', 'candidates:export'],
      });
      expect(error).toBeUndefined();
      expect(value.scopes).toHaveLength(2);
    });

    it('rejects API key creation with invalid scope or empty name', () => {
      const invalidScope = createApiKeySchema.validate({
        name: 'Test Key',
        scopes: ['admin:root_access'],
      });
      expect(invalidScope.error).toBeDefined();

      const shortName = createApiKeySchema.validate({
        name: 'a',
      });
      expect(shortName.error).toBeDefined();
    });

    it('validates webhook endpoint format', () => {
      const valid = createWebhookSchema.validate({
        targetUrl: 'https://company.internal/api/webhooks',
        events: ['interview.completed'],
      });
      expect(valid.error).toBeUndefined();

      const invalidUrl = createWebhookSchema.validate({
        targetUrl: 'javascript:alert(1)',
      });
      expect(invalidUrl.error).toBeDefined();
    });

    it('validates structured corporate question banks', () => {
      const valid = createQuestionBankSchema.validate({
        title: 'Senior Distributed Systems Track',
        companyName: 'Acme Corp',
        questions: [
          {
            question: 'Explain raft consensus algorithm log compaction.',
            difficulty: 'hard',
          },
        ],
      });
      expect(valid.error).toBeUndefined();

      const emptyQuestions = createQuestionBankSchema.validate({
        title: 'Empty Track',
        questions: [],
      });
      expect(emptyQuestions.error).toBeDefined();
    });
  });

  describe('Community Challenges & Roadmap Schemas', () => {
    it('validates challenge submission source code', () => {
      const valid = challengeSubmissionSchema.validate({
        code: 'function twoSum(nums, target) { return []; }',
        language: 'javascript',
      });
      expect(valid.error).toBeUndefined();

      const emptyCode = challengeSubmissionSchema.validate({
        code: '  ',
      });
      expect(emptyCode.error).toBeDefined();
    });

    it('validates career roadmap query defaults', () => {
      const { error, value } = roadmapQuerySchema.validate({});
      expect(error).toBeUndefined();
      expect(value.targetRole).toBe('Full Stack Engineer');
      expect(value.experienceLevel).toBe('mid');
    });
  });
});

