import { describe, it, expect } from 'vitest';
import { buildCareerOpsHistoryRecord, mapCareerOpsHistoryRow } from '../../utils/careerOps.js';

describe('Career Ops Serialization & History Mapping', () => {
  it('correctly serializes candidate history record with skills and scores', () => {
    const record = buildCareerOpsHistoryRecord('user-123', {
      company: 'History Test Co',
      role: 'Backend Engineer',
      jobDescription: 'Build APIs with Node.js and PostgreSQL.',
      generatedAt: '2026-04-11T12:00:00.000Z',
      candidateProfile: {
        headline: 'Backend Engineer',
        summary: 'Built production APIs.',
        coreSkills: ['Node.js', 'PostgreSQL'],
      },
      overallScore: 4.2,
      scoreBand: 'Strong Match',
      dimensions: [{ id: 'skill-overlap', label: 'Skill Overlap', score: 4 }],
      topMatches: ['Relevant keyword match: Node.js'],
      gaps: ['Missing or weak signal for: docker'],
      actionPlan: ['Tailor the top 3 resume bullets to mirror this JD language before applying.'],
    });

    expect(record.user_id).toBe('user-123');
    expect(record.company).toBe('History Test Co');
    expect(Array.isArray(record.candidate_skills)).toBe(true);
    expect(record.candidate_skills).toHaveLength(2);
    expect(record.overall_score).toBe(4.2);
  });

  it('maps database career ops history row to structured client response', () => {
    const response = mapCareerOpsHistoryRow({
      id: 'row-1',
      user_id: 'user-123',
      company: 'History Test Co',
      role: 'Backend Engineer',
      job_description: 'Build APIs with Node.js and PostgreSQL.',
      candidate_headline: 'Backend Engineer',
      candidate_summary: 'Built production APIs.',
      candidate_skills: ['Node.js', 'PostgreSQL'],
      overall_score: 4.2,
      score_band: 'Strong Match',
      dimensions: [{ id: 'skill-overlap', label: 'Skill Overlap', score: 4 }],
      top_matches: ['Relevant keyword match: Node.js'],
      gaps: ['Missing or weak signal for: docker'],
      action_plan: ['Tailor the top 3 resume bullets to mirror this JD language before applying.'],
      created_at: '2026-04-11T12:00:00.000Z',
    });

    expect(response.id).toBe('row-1');
    expect(response.result.overallScore).toBe(4.2);
    expect(response.result.actionPlan).toHaveLength(1);
    expect(response.company).toBe('History Test Co');
  });
});

