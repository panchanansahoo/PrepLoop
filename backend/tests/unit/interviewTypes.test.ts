import { describe, it, expect } from 'vitest';
import type { InterviewSession, RubricScore, PeerInterviewRoom } from '../../types/interview.js';

describe('Interview System TypeScript Contracts', () => {
  it('creates valid RubricScore structures', () => {
    const score: RubricScore = {
      communication: 8.5,
      decomposition: 7.0,
      technical: 9.0,
      totalScore: 8.2,
      feedback: 'Good problem breakdown and code clarity.',
      strengths: ['Identified optimal two-pointer strategy quickly'],
      areasForImprovement: ['Handle empty array edge case earlier']
    };

    expect(score.communication).toBeGreaterThanOrEqual(0);
    expect(score.communication).toBeLessThanOrEqual(10);
    expect(score.totalScore).toBeCloseTo(8.2);
    expect(score.strengths).toHaveLength(1);
  });

  it('validates PeerInterviewRoom configuration contract', () => {
    const room: PeerInterviewRoom = {
      id: 'room-1234',
      roomCode: 'PREP-9921',
      interviewerId: 'user-interviewer-1',
      candidateId: 'user-candidate-2',
      problemId: 42,
      status: 'active',
      codeSnapshot: 'function solution() { return true; }',
      language: 'javascript',
      createdAt: new Date().toISOString()
    };

    expect(room.roomCode).toBe('PREP-9921');
    expect(room.status).toBe('active');
    expect(room.language).toBe('javascript');
  });
});

