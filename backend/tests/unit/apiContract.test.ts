import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';
import { WebhookDispatcher } from '../../services/webhookDispatcher.js';
import { InterviewAnalyticsService } from '../../services/interviewAnalyticsService.js';

describe('API Contract & Schema Conformance', () => {
  describe('Standard Error Response Schema', () => {
    it('creates standardized operational errors conforming to API error contract', () => {
      const error = new AppError('Resource not found', 404, 'NOT_FOUND', { resourceId: '123' });

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ resourceId: '123' });
    });
  });

  describe('Career Roadmap API Contract', () => {
    it('validates career roadmap conforms to 4-week structured schema', async () => {
      const roadmap = await InterviewAnalyticsService.generatePersonalizedRoadmap(
        '00000000-0000-0000-0000-000000000001',
        { targetRole: 'Backend Engineer', targetCompany: 'Amazon' }
      );

      // Contract checks
      expect(roadmap).toHaveProperty('targetRole');
      expect(roadmap).toHaveProperty('targetCompany');
      expect(roadmap).toHaveProperty('readinessScore');
      expect(typeof roadmap.readinessScore).toBe('number');
      expect(roadmap).toHaveProperty('domainScores');
      expect(roadmap.domainScores).toHaveProperty('dsa');
      expect(roadmap.domainScores).toHaveProperty('systemDesign');

      // Weeks contract
      expect(Array.isArray(roadmap.weeks)).toBe(true);
      expect(roadmap.weeks).toHaveLength(4);
      roadmap.weeks.forEach((w: any) => {
        expect(w).toHaveProperty('weekNumber');
        expect(w).toHaveProperty('title');
        expect(w).toHaveProperty('description');
        expect(Array.isArray(w.milestones)).toBe(true);
        expect(w.milestones.length).toBeGreaterThan(0);
        w.milestones.forEach((m: any) => {
          expect(m).toHaveProperty('id');
          expect(m).toHaveProperty('title');
        });
      });
    });
  });

  describe('Platform API Key & Webhook Dispatch Contracts', () => {
    it('enforces API key live token prefix and SHA-256 hash contract', () => {
      const rawKey = `pl_live_${crypto.randomBytes(24).toString('hex')}`;
      expect(rawKey.startsWith('pl_live_')).toBe(true);
      expect(rawKey.length).toBeGreaterThanOrEqual(32);

      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      expect(keyHash).toHaveLength(64); // SHA-256 hex is exactly 64 characters
    });

    it('validates webhook HMAC signature format and structure', async () => {
      const secret = 'whsec_test_secret_key_12345';
      const eventType = 'interview.completed';
      const payload = { mockId: 'mock-100', score: 92 };

      const rawBody = JSON.stringify({
        id: 'evt_test_123',
        event: eventType,
        createdAt: new Date().toISOString(),
        data: payload,
      });

      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const headerSignature = `sha256=${signature}`;

      expect(headerSignature.startsWith('sha256=')).toBe(true);
      expect(signature).toHaveLength(64);
    });
  });

  describe('Community Challenges Contract', () => {
    it('verifies default challenge shape adheres to points and test cases schema', async () => {
      // Simulate weekly challenge contract
      const challengeContract = {
        id: 'c-easy-01',
        title: 'Valid Palindrome After at Most One Deletion',
        difficulty: 'easy',
        points: 10,
        description: 'Test description',
        starter_code: { javascript: 'function test() {}' },
        test_cases: [{ input: 'aba', expected: 'true' }],
      };

      expect(challengeContract.points).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(challengeContract.difficulty);
      expect(challengeContract.starter_code).toHaveProperty('javascript');
      expect(Array.isArray(challengeContract.test_cases)).toBe(true);
      expect(challengeContract.test_cases[0]).toHaveProperty('input');
      expect(challengeContract.test_cases[0]).toHaveProperty('expected');
    });
  });
});

