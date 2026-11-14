import { describe, it, expect } from 'vitest';
import { generateFallbackQuestionsFromJd } from '../../routes/admin.js';

describe('Admin Question Set Generator (JD AI & Fallback)', () => {
  it('generates React frontend questions when given React JD', () => {
    const jd = `
      We are looking for a Senior React Engineer to join our team.
      Requirements:
      - Deep expertise in React 18, React Fiber, Hooks, and TypeScript.
      - Experience optimizing frontend web performance, virtual DOM diffing, and bundle size.
      - State management with Zustand or Redux Toolkit.
    `;

    const result = generateFallbackQuestionsFromJd({
      jobDescription: jd,
      roleName: 'Senior React Engineer',
      interviewType: 'technical',
      difficulty: 'medium',
      count: 4,
    });

    expect(result.roleName).toBe('Senior React Engineer');
    expect(result.questions).toHaveLength(4);
    for (const q of result.questions) {
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(15);
      expect(typeof q.context).toBe('string');
      expect(Array.isArray(q.expectedTopics)).toBe(true);
      expect(q.expectedTopics.length).toBeGreaterThan(0);
      expect(typeof q.timeLimit).toBe('number');
      expect(q.timeLimit).toBeGreaterThanOrEqual(60);
    }
  });

  it('generates Node.js backend questions when given Node backend JD', () => {
    const jd = `
      Backend Engineer needed with Node.js, microservices, and database optimization.
      Must have strong knowledge of event loop internals, streams, and ACID transactions.
    `;

    const result = generateFallbackQuestionsFromJd({
      jobDescription: jd,
      count: 3,
    });

    expect(result.roleName).toBe('Backend Node.js Engineer');
    expect(result.questions).toHaveLength(3);
    const hasEventLoopOrStreams = result.questions.some(q => 
      q.question.toLowerCase().includes('event loop') || 
      q.question.toLowerCase().includes('stream') || 
      q.question.toLowerCase().includes('transaction')
    );
    expect(hasEventLoopOrStreams).toBe(true);
  });

  it('generates System Design questions for distributed architecture JD', () => {
    const jd = `
      Staff Systems Architect to design distributed, high-throughput caching and rate-limiting services.
      Experience with Redis, Kafka, CAP theorem trade-offs, and horizontal scalability.
    `;

    const result = generateFallbackQuestionsFromJd({
      jobDescription: jd,
      interviewType: 'system-design',
      count: 3,
    });

    expect(result.questions).toHaveLength(3);
    expect(result.questions.some(q => q.expectedTopics.some(t => t.toLowerCase().includes('rate') || t.toLowerCase().includes('cap') || t.toLowerCase().includes('redis')))).toBe(true);
  });

  it('generates STAR behavioral questions for leadership JD', () => {
    const jd = `
      Engineering Manager / Lead with strong behavioral competencies.
      Must navigate conflicts, mentor engineers, and manage critical incidents.
    `;

    const result = generateFallbackQuestionsFromJd({
      jobDescription: jd,
      interviewType: 'behavioral',
      count: 3,
    });

    expect(result.questions).toHaveLength(3);
    expect(result.questions.some(q => q.question.toLowerCase().includes('disagreed') || q.question.toLowerCase().includes('incident') || q.question.toLowerCase().includes('mentor'))).toBe(true);
  });
});
