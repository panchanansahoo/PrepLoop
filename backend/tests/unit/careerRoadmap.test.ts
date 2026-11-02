import { describe, it, expect } from 'vitest';
import { InterviewAnalyticsService } from '../../services/interviewAnalyticsService.js';

describe('Career Roadmap & Performance Diagnostics', () => {
  it('generates a 4-week structured roadmap with milestones and diagnostics', async () => {
    // When called with an anonymous/empty history user, returns valid structured roadmap with default baseline
    const roadmap = await InterviewAnalyticsService.generatePersonalizedRoadmap('00000000-0000-0000-0000-000000000001', {
      targetRole: 'Full Stack Engineer',
      targetCompany: 'Google',
    });

    expect(roadmap).toBeDefined();
    expect(roadmap.targetRole).toBe('Full Stack Engineer');
    expect(roadmap.targetCompany).toBe('Google');
    expect(roadmap.weeks).toHaveLength(4);

    expect(roadmap.weeks[0].weekNumber).toBe(1);
    expect(roadmap.weeks[0].milestones.length).toBeGreaterThanOrEqual(2);
    expect(roadmap.weeks[3].weekNumber).toBe(4);
    expect(roadmap.diagnostics).toBeDefined();
    expect(roadmap.diagnostics.primaryGaps).toBeInstanceOf(Array);
  });
});
