import { describe, it, expect } from 'vitest';
import { InterviewGroundingServiceV2 } from '../../services/interviewGroundingService.js';

describe('InterviewGroundingServiceV2 Grounding & RAG Bridge', () => {
  it('retrieves grounded questions, examples, hint patterns, and metadata for specified roles', async () => {
    const service = new InterviewGroundingServiceV2();
    const context = await service.fetchContext({
      company: 'google',
      role: 'SDE',
      difficulty: 'medium',
      stage: 'technical',
      interviewType: 'dsa',
      missingAreas: ['complexity analysis'],
      resumeContext: {
        headline: 'Backend Engineer focused on systems design',
        skills: 'distributed systems,graphql',
      },
      limit: 4,
    });

    expect(Array.isArray(context.retrievedQuestions)).toBe(true);
    expect(Array.isArray(context.retrievedExamples)).toBe(true);
    expect(Array.isArray(context.hintPatterns)).toBe(true);
    expect(typeof context.provider).toBe('string');
    expect(typeof context.retrievalLatencyMs).toBe('number');
    expect(context.query.resumeHeadline).toBe('Backend Engineer focused on systems design');
    expect(context.query.resumeSkills).toEqual(['distributed systems', 'graphql']);
  });

  it('falls back to default questions safely for unknown companies', async () => {
    const service = new InterviewGroundingServiceV2();
    const fallback = await service.fetchContext({
      company: 'unknown-enterprise-xyz',
      role: 'SDE',
      stage: 'technical',
      interviewType: 'dsa',
      limit: 3,
    });

    expect(Array.isArray(fallback.retrievedQuestions)).toBe(true);
    expect(fallback.retrievedQuestions.length).toBeGreaterThan(0);
  });
});
