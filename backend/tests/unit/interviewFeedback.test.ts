import { describe, it, expect } from 'vitest';
import { normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';

describe('Interview Feedback Normalization & Diagnostics', () => {
  it('normalizes technical stage feedback and generates action items', () => {
    const technicalFeedback = normalizeInterviewFeedback(
      {
        feedback: 'Great response!',
        strengths: ['Clear communication'],
        improvements: ['Add more specifics'],
        hint: 'Try breaking the problem into smaller parts',
      },
      {
        stage: 'Technical',
        question: 'How would you optimize this service for scale?',
        answer: 'I would improve it.',
      }
    );

    expect(technicalFeedback.feedback).toMatch(/technical interview|implementation detail|trade-off/i);
    expect(technicalFeedback.strengths).toEqual(['Clear communication']);
    expect(technicalFeedback.improvements).toEqual(['Add more specifics']);
    expect(technicalFeedback.hint).toMatch(/implementation detail|trade-off|concrete example/i);
  });

  it('normalizes behavioral stage feedback and enforces STAR structure guidance', () => {
    const behavioralFeedback = normalizeInterviewFeedback(
      { feedback: 'Nice', strengths: [], improvements: [], hint: '' },
      {
        stage: 'Behavioral',
        question: 'Tell me about a time you handled conflict on a team.',
        answer: 'I helped the team finish the project by talking through the issues.',
      }
    );

    expect(behavioralFeedback.feedback).toMatch(/STAR|result|impact/i);
    expect(behavioralFeedback.strengths.length).toBeGreaterThanOrEqual(1);
    expect(behavioralFeedback.improvements.length).toBeGreaterThanOrEqual(1);
    expect(behavioralFeedback.hint).toMatch(/STAR|result|outcome/i);
  });
});

