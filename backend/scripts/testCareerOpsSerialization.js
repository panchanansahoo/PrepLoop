import { buildCareerOpsHistoryRecord, mapCareerOpsHistoryRow } from '../utils/careerOps.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
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

  assert(record.user_id === 'user-123', 'Expected user_id to be copied into the history row');
  assert(record.company === 'History Test Co', 'Expected company to be copied into the history row');
  assert(Array.isArray(record.candidate_skills), 'Expected candidate_skills to be stored as an array');
  assert(record.candidate_skills.length === 2, 'Expected candidate_skills to preserve the provided skills');
  assert(record.overall_score === 4.2, 'Expected overall_score to be copied into the history row');

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

  assert(response.id === 'row-1', 'Expected response id to be preserved');
  assert(response.result.overallScore === 4.2, 'Expected response to expose overallScore in result');
  assert(response.result.actionPlan.length === 1, 'Expected actionPlan to round-trip through the response mapper');

  console.log('Career Ops serialization test passed.');
}

main();