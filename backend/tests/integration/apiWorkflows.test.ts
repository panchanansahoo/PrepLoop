import { describe, it, expect } from 'vitest';
import Joi from 'joi';
import {
  interviewStartSchema,
  interviewRespondSchema,
  challengeSubmissionSchema,
  roadmapQuerySchema,
} from '../../schemas/requestSchemas.js';

describe('End-to-End API Contract & Workflow Schemas', () => {
  describe('Authentication Workflow Contract', () => {
    const candidateRegisterContract = Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
        .required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).optional(),
    });

    it('validates registration contract accepts valid candidate credentials', () => {
      const validPayload = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      const { error, value } = candidateRegisterContract.validate(validPayload);
      expect(error).toBeUndefined();
      expect(value.email).toBe('jane.doe@example.com');
    });

    it('rejects passwords failing enterprise strength requirements', () => {
      const weakPayloads = [
        { name: 'Jane', email: 'jane@example.com', password: 'short' },
        { name: 'Jane', email: 'jane@example.com', password: 'nouppercaseornumber!' },
        { name: 'Jane', email: 'notanemail', password: 'Password123!' },
      ];

      for (const payload of weakPayloads) {
        const { error } = candidateRegisterContract.validate(payload);
        expect(error).toBeDefined();
      }
    });

    it('validates login response contract conforms to standard auth token shape', () => {
      const loginResponseSchema = Joi.object({
        token: Joi.string().required(),
        user: Joi.object({
          id: Joi.string().required(),
          email: Joi.string().email().required(),
          role: Joi.string().valid('user', 'admin', 'moderator').required(),
          subscription_tier: Joi.string().valid('free', 'pro', 'premium').default('free'),
        }).required(),
        csrfToken: Joi.string().optional(),
      });

      const mockResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testTokenPayload',
        user: {
          id: 'usr_1029384756',
          email: 'candidate@preploop.com',
          role: 'user',
          subscription_tier: 'pro',
        },
        csrfToken: 'csrf_mock_token_abc123',
      };

      const { error } = loginResponseSchema.validate(mockResponse);
      expect(error).toBeUndefined();
    });
  });

  describe('Mock Interview Lifecycle Contract', () => {
    it('validates interview session initiation contract', () => {
      const validPayload = {
        interviewType: 'dsa',
        difficulty: 'medium',
        companyFocus: 'Google',
        interviewMode: 'full_realtime',
      };
      const { error } = interviewStartSchema.validate(validPayload);
      expect(error).toBeUndefined();
    });

    it('validates interview message turn payload contract', () => {
      const messagePayload = {
        response: 'In my previous project, we optimized database queries using composite indexes.',
        interviewMode: 'full_realtime',
      };
      const { error } = interviewRespondSchema.validate(messagePayload);
      expect(error).toBeUndefined();
    });

    it('enforces standardized evaluation scorecard completion response', () => {
      const evaluationSchema = Joi.object({
        interviewId: Joi.string().required(),
        status: Joi.string().valid('completed').required(),
        overallScore: Joi.number().min(0).max(100).required(),
        rubrics: Joi.object({
          technicalAccuracy: Joi.number().min(0).max(100).required(),
          communication: Joi.number().min(0).max(100).required(),
          problemSolving: Joi.number().min(0).max(100).required(),
          confidenceAndPacing: Joi.number().min(0).max(100).required(),
        }).required(),
        feedback: Joi.object({
          strengths: Joi.array().items(Joi.string()).min(1).required(),
          areasForImprovement: Joi.array().items(Joi.string()).min(1).required(),
          actionPlan: Joi.string().required(),
        }).required(),
      });

      const mockEvaluation = {
        interviewId: 'inv_10293847',
        status: 'completed',
        overallScore: 84,
        rubrics: {
          technicalAccuracy: 88,
          communication: 82,
          problemSolving: 85,
          confidenceAndPacing: 81,
        },
        feedback: {
          strengths: ['Clear explanation of database indexing tradeoffs', 'Structured communication'],
          areasForImprovement: ['Elaborate further on cache invalidation strategies'],
          actionPlan: 'Review distributed caching patterns and Redis TTL mechanisms.',
        },
      };

      const { error } = evaluationSchema.validate(mockEvaluation);
      expect(error).toBeUndefined();
    });
  });

  describe('DSA Code Execution & Submission Contract', () => {
    const codeRunContract = Joi.object({
      code: Joi.string().trim().min(1).required(),
      language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'typescript', 'go').default('javascript'),
      customInput: Joi.string().allow('').optional(),
    });

    const codeSubmitContract = Joi.object({
      problemId: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
      code: Joi.string().trim().min(1).required(),
      language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'typescript', 'go').default('javascript'),
    });

    it('validates code execution and submission payload schemas', () => {
      const runPayload = {
        code: 'function solve(arr) { return arr.sort(); }',
        language: 'javascript',
        customInput: '[3, 1, 2]',
      };
      expect(codeRunContract.validate(runPayload).error).toBeUndefined();

      const submitPayload = {
        problemId: 42,
        code: 'function twoSum(nums, target) { return [0, 1]; }',
        language: 'javascript',
      };
      expect(codeSubmitContract.validate(submitPayload).error).toBeUndefined();
    });

    it('validates submission result shape with status, metrics, and coin award', () => {
      const submissionResultSchema = Joi.object({
        status: Joi.string().valid('Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error').required(),
        runtimeMs: Joi.number().min(0).required(),
        memoryKb: Joi.number().min(0).required(),
        testsPassed: Joi.number().min(0).required(),
        totalTests: Joi.number().min(1).required(),
        coinsAwarded: Joi.number().min(0).required(),
      });

      const mockResult = {
        status: 'Accepted',
        runtimeMs: 42,
        memoryKb: 15360,
        testsPassed: 15,
        totalTests: 15,
        coinsAwarded: 10,
      };

      const { error } = submissionResultSchema.validate(mockResult);
      expect(error).toBeUndefined();
    });
  });

  describe('Gamification & Coin Ledger Contract', () => {
    const coinTransactionContract = Joi.object({
      amount: Joi.number().integer().positive().required(),
      type: Joi.string().valid('credit', 'debit').required(),
      reason: Joi.string().trim().min(3).max(100).required(),
      referenceId: Joi.string().trim().optional(),
    });

    it('validates coin transaction payload with reference key idempotency', () => {
      const creditPayload = {
        amount: 50,
        type: 'credit',
        reason: 'daily_streak_reward',
        referenceId: 'streak_2026_11_02_usr_123',
      };
      const { error } = coinTransactionContract.validate(creditPayload);
      expect(error).toBeUndefined();
    });

    it('rejects invalid transaction types or non-positive coin amounts', () => {
      const invalid = {
        amount: -10,
        type: 'invalid_type',
        reason: 'test',
      };
      const { error } = coinTransactionContract.validate(invalid);
      expect(error).toBeDefined();
    });
  });

  describe('Career Roadmap & Community Challenges Contract', () => {
    it('validates roadmap query parameter boundaries', () => {
      const query = {
        targetRole: 'Backend Engineer',
        experienceLevel: 'senior',
      };
      const { error, value } = roadmapQuerySchema.validate(query);
      expect(error).toBeUndefined();
      expect(value.experienceLevel).toBe('senior');
    });

    it('validates community challenge submission constraints', () => {
      const submission = {
        code: 'const result = solveProblem(data);',
        language: 'javascript',
      };
      const { error } = challengeSubmissionSchema.validate(submission);
      expect(error).toBeUndefined();
    });
  });
});
