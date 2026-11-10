import { describe, it, expect } from 'vitest';
import { InterviewAnalyticsService } from '../../services/interviewAnalyticsService.js';

describe('InterviewAnalyticsService (Track 2.2 Skill Deltas & Tracking)', () => {
  it('returns insufficient comparison data when fewer than 2 interviews exist', () => {
    const single = [{ id: 's1', interview_score: 80, started_at: '2026-11-01' }];
    const deltas = InterviewAnalyticsService.calculateSkillDeltas(single);
    expect(deltas.hasComparison).toBe(false);
    expect(deltas.overallDelta).toBe(0);
  });

  it('calculates session-over-session overall and skill deltas correctly', () => {
    const sessions = [
      {
        id: 'session_newer',
        interview_score: 88,
        communication_clarity_score: 85,
        problem_solving_score: 90,
        technical_depth_score: 89,
        started_at: '2026-11-05T10:00:00Z',
        status: 'completed',
      },
      {
        id: 'session_older',
        interview_score: 76,
        communication_clarity_score: 73,
        problem_solving_score: 80,
        technical_depth_score: 75,
        started_at: '2026-11-01T10:00:00Z',
        status: 'completed',
      },
    ];

    const deltas = InterviewAnalyticsService.calculateSkillDeltas(sessions);
    expect(deltas.hasComparison).toBe(true);
    expect(deltas.overallDelta).toBe(12);
    expect(deltas.overallTrend).toBe('improving');
    expect(deltas.skills.communication.delta).toBe(12);
    expect(deltas.skills.communication.trend).toBe('improving');
    expect(deltas.skills.problemSolving.delta).toBe(10);
    expect(deltas.skills.technicalDepth.delta).toBe(14);
  });

  it('provides safe baseline analytics when user has no interviews', () => {
    const baseline = InterviewAnalyticsService.getDefaultAnalytics();
    expect(baseline.totalInterviews).toBe(0);
    expect(baseline.completedInterviews).toBe(0);
    expect(Array.isArray(baseline.skillGaps)).toBe(true);
  });
});

