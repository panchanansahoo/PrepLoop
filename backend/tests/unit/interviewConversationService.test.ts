import { describe, it, expect } from 'vitest';
import { InterviewPromptService } from '../../services/interviewPromptService.js';
import { InterviewConversationService } from '../../services/interviewConversationService.js';

describe('InterviewConversationService & Prompt Generation', () => {
  describe('buildFollowUpPrompt', () => {
    it('builds follow up prompt containing problem statement and stage context', () => {
      const prompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Design an LRU cache.',
        transcript: [
          { role: 'interviewer', text: 'How would you design it?' },
          { role: 'candidate', text: 'I will use a hashmap.' },
        ],
        candidateResponse: 'I would use hashmap + doubly linked list.',
        interviewType: 'dsa',
        interviewContext: {
          turns: 2,
          stage: 'technical',
          missingAreas: ['edge cases'],
        },
        interviewMode: 'full_realtime',
        ragContext: {
          retrievedQuestions: [{ question: 'How do you evict least recently used key?' }],
          hintPatterns: ['Call out edge cases clearly.'],
        },
      });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('Current stage: technical');
    });

    it('injects scaffolding instructions and high volatility warnings when performance fluctuates', () => {
      const volatilePrompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Implement a linked list.',
        transcript: [
          { role: 'interviewer', text: 'Can you implement a linked list?' },
          { role: 'candidate', text: 'I will use a class with next pointers.' },
        ],
        candidateResponse: 'I can add and remove nodes.',
        interviewType: 'dsa',
        interviewContext: {
          turns: 5,
          stage: 'technical',
          missingAreas: [],
          adaptiveFollowUp: {
            nextAction: 'volatility_scaffold',
            improvementArc: 'stable',
            scoreTrend: { mean: 62, stdDev: 25, trend: 'stable', volatility: 'volatile', delta: -3 },
          },
        },
        interviewMode: 'full_realtime',
      });

      expect(volatilePrompt).toContain('ACTION:');
      expect(volatilePrompt).toContain('sub-problems');
      expect(volatilePrompt).toContain('Score volatility: HIGH');
    });

    it('injects trend signals when candidate performance is improving', () => {
      const improvingPrompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Explain REST vs GraphQL.',
        transcript: [
          { role: 'interviewer', text: 'Compare REST and GraphQL.' },
          { role: 'candidate', text: 'REST uses endpoints, GraphQL uses queries.' },
        ],
        candidateResponse: 'GraphQL has a single endpoint with flexible queries.',
        interviewType: 'system-design',
        interviewContext: {
          turns: 4,
          stage: 'technical',
          missingAreas: [],
          adaptiveFollowUp: {
            nextAction: 'deepen',
            improvementArc: 'improving',
            scoreTrend: { mean: 72, stdDev: 6, trend: 'improving', volatility: 'stable', delta: 15 },
          },
        },
        interviewMode: 'full_realtime',
      });

      expect(improvingPrompt).toContain('Score trend: IMPROVING');
      expect(improvingPrompt).toContain('Candidate trend: improving');
    });
  });

  describe('buildFallbackFollowUp', () => {
    it('returns concise realtime fallback message', () => {
      const fallback = InterviewConversationService.buildFallbackFollowUp('full_realtime');
      expect(typeof fallback.message).toBe('string');
      expect(fallback.message.length).toBeGreaterThan(0);
      expect(fallback.message.split(/\s+/).length).toBeLessThanOrEqual(24);
    });

    it('delivers behavioral fallbacks emphasizing outcomes without technical complexity', () => {
      const behavioralFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'behavioral');
      expect(behavioralFallback.message.toLowerCase()).toContain('outcome');
      expect(behavioralFallback.message.toLowerCase()).not.toContain('complexity');
    });

    it('delivers HR fallbacks probing candidate direction', () => {
      const hrFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'hr');
      expect(hrFallback.message.toLowerCase()).toContain('direction');
    });

    it('delivers system design fallbacks probing architectural scaling', () => {
      const sysDesignFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'system-design');
      expect(sysDesignFallback.message.toLowerCase()).toContain('scale');
    });

    it('delivers DSA fallbacks probing algorithmic complexity and defaults unknown types to DSA', () => {
      const dsaFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'dsa');
      expect(dsaFallback.message.toLowerCase()).toContain('complexity');

      const unknownFallback = InterviewConversationService.buildFallbackFollowUp('full_realtime', 'unknown_domain');
      expect(unknownFallback.message).toBe(dsaFallback.message);
    });
  });

  describe('parseFollowUpContent', () => {
    it('extracts embedded JSON payload cleanly from noisy AI response text', () => {
      const parsed = InterviewConversationService.parseFollowUpContent(
        'prefix notes {"message":"test question","isFollowUp":true,"clarifications":[],"hints":[],"encouragement":"ok","continueInterview":true} closing notes'
      );
      expect(parsed.message).toBe('test question');
      expect(parsed.isFollowUp).toBe(true);
    });
  });
});
