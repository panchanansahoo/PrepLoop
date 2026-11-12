import { describe, expect, it } from 'vitest';
import { computeSm2NextReview } from '../../services/spacedRepetitionService.ts';
import { computeDeterministicGapAnalysis } from '../../services/resumeGapAnalysisService.ts';

describe('Phase 2 Features — SM-2 Spaced Repetition & Resume-JD Gap Analysis', () => {
  describe('F2-1: computeSm2NextReview (SM-2)', () => {
    const fixedNow = new Date('2026-11-12T00:00:00.000Z');

    it('progresses intervals 1 -> 6 -> round(6 * EF) on quality >= 4', () => {
      const r1 = computeSm2NextReview({ quality: 5, repetitions: 0, intervalDays: 1, easeFactor: 2.5, now: fixedNow });
      expect(r1.repetitions).toBe(1);
      expect(r1.intervalDays).toBe(1);
      expect(r1.easeFactor).toBe(2.6);
      expect(r1.nextReviewAt).toBe('2026-11-13T00:00:00.000Z');

      const r2 = computeSm2NextReview({ quality: 5, repetitions: r1.repetitions, intervalDays: r1.intervalDays, easeFactor: r1.easeFactor, now: fixedNow });
      expect(r2.repetitions).toBe(2);
      expect(r2.intervalDays).toBe(6);
      expect(r2.nextReviewAt).toBe('2026-11-18T00:00:00.000Z');

      const r3 = computeSm2NextReview({ quality: 4, repetitions: r2.repetitions, intervalDays: r2.intervalDays, easeFactor: r2.easeFactor, now: fixedNow });
      expect(r3.repetitions).toBe(3);
      expect(r3.intervalDays).toBe(Math.round(6 * r3.easeFactor));
    });

    it('resets repetitions to 0 and interval to 1 when quality < 3', () => {
      const reset = computeSm2NextReview({ quality: 2, repetitions: 4, intervalDays: 21, easeFactor: 2.4, now: fixedNow });
      expect(reset.repetitions).toBe(0);
      expect(reset.intervalDays).toBe(1);
      expect(reset.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('enforces easeFactor floor of 1.3 even after repeated blackouts', () => {
      let ef = 1.4;
      for (let i = 0; i < 5; i++) {
        ef = computeSm2NextReview({ quality: 0, easeFactor: ef, now: fixedNow }).easeFactor;
      }
      expect(ef).toBe(1.3);
    });
  });

  describe('F2-2: computeDeterministicGapAnalysis', () => {
    it('identifies matched and missing skills and computes realistic matchScore', () => {
      const result = computeDeterministicGapAnalysis({
        resumeText: 'Senior engineer skilled in JavaScript, TypeScript, React, Node.js, and PostgreSQL with REST APIs.',
        jobDescription: 'Looking for a Full Stack Engineer with React, TypeScript, Node.js, Docker, Kubernetes, and AWS experience.',
        jobTitle: 'Full Stack Engineer',
        company: 'Acme',
      });

      expect(result.source).toBe('deterministic');
      expect(result.matchedSkills).toEqual(expect.arrayContaining(['react', 'typescript', 'node.js']));
      expect(result.missingSkills).toEqual(expect.arrayContaining(['docker', 'kubernetes', 'aws']));
      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.matchScore).toBeLessThan(100);
      expect(result.talkingPoints.length).toBeGreaterThan(0);
      expect(result.practiceQuestions.length).toBeGreaterThan(0);
    });

    it('handles non-technical job descriptions gracefully via word overlap fallback', () => {
      const result = computeDeterministicGapAnalysis({
        resumeText: 'Managed cross-functional product launches, roadmap planning, and stakeholder communication.',
        jobDescription: 'Seeking product manager for roadmap planning, stakeholder communication, and analytics.',
      });

      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
      expect(result.practiceQuestions.length).toBeGreaterThan(0);
    });
  });
});
