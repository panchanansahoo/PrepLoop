function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => normalizeString(item)).filter(Boolean);
  }

  return normalizeString(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function buildCareerOpsHistoryRecord(userId, evaluation = {}) {
  return {
    user_id: userId,
    company: normalizeString(evaluation.company) || null,
    role: normalizeString(evaluation.role) || null,
    job_description: normalizeString(evaluation.jobDescription),
    candidate_headline: normalizeString(evaluation.candidateProfile?.headline || evaluation.candidateHeadline),
    candidate_summary: normalizeString(evaluation.candidateProfile?.summary || evaluation.candidateSummary),
    candidate_skills: normalizeArray(evaluation.candidateProfile?.coreSkills || evaluation.candidateSkills),
    overall_score: Number(evaluation.overallScore || 0),
    score_band: normalizeString(evaluation.scoreBand) || 'Unknown',
    dimensions: Array.isArray(evaluation.dimensions) ? evaluation.dimensions : [],
    top_matches: Array.isArray(evaluation.topMatches) ? evaluation.topMatches : [],
    gaps: Array.isArray(evaluation.gaps) ? evaluation.gaps : [],
    action_plan: Array.isArray(evaluation.actionPlan) ? evaluation.actionPlan : [],
    metadata: evaluation.metadata || {},
    created_at: evaluation.generatedAt || new Date().toISOString(),
  };
}

export function mapCareerOpsHistoryRow(row = {}) {
  return {
    id: row.id,
    company: row.company || null,
    role: row.role || null,
    jobDescription: row.job_description || '',
    candidateHeadline: row.candidate_headline || '',
    candidateSummary: row.candidate_summary || '',
    candidateSkills: Array.isArray(row.candidate_skills) ? row.candidate_skills.join(', ') : '',
    result: {
      overallScore: Number(row.overall_score || 0),
      scoreBand: row.score_band || 'Unknown',
      dimensions: Array.isArray(row.dimensions) ? row.dimensions : [],
      topMatches: Array.isArray(row.top_matches) ? row.top_matches : [],
      gaps: Array.isArray(row.gaps) ? row.gaps : [],
      actionPlan: Array.isArray(row.action_plan) ? row.action_plan : [],
      metadata: row.metadata || {},
      generatedAt: row.created_at || null,
    },
  };
}
