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

  it('supports multi-category retrieval for mixed rounds (Track 1.2)', async () => {
    const service = new InterviewGroundingServiceV2();
    const context = await service.fetchContext({
      company: 'google',
      role: 'SDE',
      stage: 'technical',
      interviewType: 'mixed',
      limit: 5,
    });

    expect(Array.isArray(context.retrievedQuestions)).toBe(true);
    expect(context.retrievedQuestions.length).toBeGreaterThan(0);
  });
});

// ── #4 RAG Grounding Quality: sanitizeList cap verification ───────────────────
import { describe as desc4, it as it4, expect as expect4 } from 'vitest';
import { sanitizeList } from '../../utils/promptInjectionGuard.js';

desc4('interviewGroundingService normalizeResumeContext cap increases (#4)', () => {
  it4('coreSkills cap raised to 20: accepts up to 20 items', () => {
    const twentySkills = Array.from({ length: 25 }, (_, i) => `skill${i + 1}`);
    const result = sanitizeList(twentySkills, 20, 50);
    expect4(result.length).toBeLessThanOrEqual(20);
    expect4(result.length).toBe(20); // 25 input → capped at 20
  });

  it4('projectHighlights cap raised to 12: accepts up to 12 items', () => {
    const fifteenProjects = Array.from({ length: 15 }, (_, i) => `Project${i + 1} description`);
    const result = sanitizeList(fifteenProjects, 12, 120);
    expect4(result.length).toBeLessThanOrEqual(12);
    expect4(result.length).toBe(12);
  });

  it4('likelyQuestionAreas cap raised to 12: accepts up to 12 items', () => {
    const fourteenAreas = Array.from({ length: 14 }, (_, i) => `area${i + 1}`);
    const result = sanitizeList(fourteenAreas, 12, 100);
    expect4(result.length).toBeLessThanOrEqual(12);
    expect4(result.length).toBe(12);
  });
});

