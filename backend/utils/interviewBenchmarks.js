/**
 * Interview Benchmarks — maps raw scores to human-readable hire-tier labels.
 * Type-specific thresholds reflect that different interview types have different
 * scoring distributions (e.g., behavioral 70 is stronger than DSA 70).
 */

const TYPE_BENCHMARKS = {
  dsa: [
    { min: 85, label: 'Strong Hire', emoji: '🟢', description: 'Exceeds bar at most top-tier companies' },
    { min: 70, label: 'Lean Hire', emoji: '🟡', description: 'Would pass a phone screen; competitive for onsite' },
    { min: 55, label: 'Borderline', emoji: '🟠', description: 'Needs improvement in 1-2 key areas to pass' },
    { min: 0,  label: 'Needs Practice', emoji: '🔴', description: 'Focus on fundamentals before interviewing' },
  ],
  system_design: [
    { min: 80, label: 'Strong Hire', emoji: '🟢', description: 'Demonstrates senior-level design thinking' },
    { min: 65, label: 'Lean Hire', emoji: '🟡', description: 'Solid fundamentals with room for depth' },
    { min: 50, label: 'Borderline', emoji: '🟠', description: 'Architecture instincts are there; needs refinement' },
    { min: 0,  label: 'Needs Practice', emoji: '🔴', description: 'Study system design patterns and capacity planning' },
  ],
  behavioral: [
    { min: 80, label: 'Strong Hire', emoji: '🟢', description: 'Compelling stories with clear impact and ownership' },
    { min: 65, label: 'Lean Hire', emoji: '🟡', description: 'Good stories; strengthen with specific metrics' },
    { min: 50, label: 'Borderline', emoji: '🟠', description: 'Prepare stronger STAR examples with quantified results' },
    { min: 0,  label: 'Needs Practice', emoji: '🔴', description: 'Build a personal story bank with measured outcomes' },
  ],
  hr: [
    { min: 75, label: 'Strong Hire', emoji: '🟢', description: 'Authentic, self-aware, and well-articulated' },
    { min: 60, label: 'Lean Hire', emoji: '🟡', description: 'Genuine answers; add more specificity about career goals' },
    { min: 45, label: 'Borderline', emoji: '🟠', description: 'Practice concise self-presentation and motivation narrative' },
    { min: 0,  label: 'Needs Practice', emoji: '🔴', description: 'Prepare a clear career narrative and research target companies' },
  ],
};

/**
 * Get the hire-tier benchmark for a given score and interview type.
 * @param {number} score - The overall interview score (0-100)
 * @param {string} interviewType - One of 'dsa', 'system_design', 'behavioral', 'hr'
 * @returns {{ label: string, emoji: string, description: string }}
 */
export function getBenchmarkTier(score, interviewType = 'dsa') {
  const normalized = String(interviewType || 'dsa').toLowerCase().replace('system-design', 'system_design');
  const tiers = TYPE_BENCHMARKS[normalized] || TYPE_BENCHMARKS.dsa;
  const numScore = Number(score) || 0;

  for (const tier of tiers) {
    if (numScore >= tier.min) return tier;
  }
  return tiers[tiers.length - 1];
}

/**
 * Generate a per-question breakdown from the interview transcript.
 * @param {Array} transcript - Array of { role, text, timestamp }
 * @param {object} interviewContext - The session's interview_context
 * @returns {Array<{ questionNumber, question, candidateExcerpt, scoreEstimate, keyStrength, keyGap }>}
 */
export function generatePerQuestionBreakdown(transcript = [], interviewContext = {}) {
  const breakdown = [];
  const scoreHistory = Array.isArray(interviewContext.scoreHistory) ? interviewContext.scoreHistory : [];
  let questionIndex = 0;

  for (let i = 0; i < transcript.length; i++) {
    const entry = transcript[i];
    if (entry.role === 'interviewer') {
      const candidateEntry = transcript[i + 1];
      if (candidateEntry && candidateEntry.role === 'candidate') {
        questionIndex++;
        const historyEntry = scoreHistory[questionIndex - 1];
        breakdown.push({
          questionNumber: questionIndex,
          question: String(entry.text || '').slice(0, 200),
          candidateExcerpt: String(candidateEntry.text || '').slice(0, 150),
          scoreEstimate: historyEntry?.score || null,
          keyStrength: historyEntry?.score >= 70 ? 'Structured response' : null,
          keyGap: historyEntry?.score < 60 ? 'Needs more depth or specificity' : null,
        });
      }
    }
  }

  return breakdown;
}

/**
 * Compute average response time from transcript timestamps.
 * @param {Array} transcript
 * @returns {{ avgResponseSeconds: number, totalTurns: number }}
 */
export function computeTimingAnalysis(transcript = []) {
  const responseTimes = [];
  for (let i = 0; i < transcript.length - 1; i++) {
    if (transcript[i].role === 'interviewer' && transcript[i + 1]?.role === 'candidate') {
      const interviewerTime = new Date(transcript[i].timestamp).getTime();
      const candidateTime = new Date(transcript[i + 1].timestamp).getTime();
      if (!isNaN(interviewerTime) && !isNaN(candidateTime)) {
        const delta = (candidateTime - interviewerTime) / 1000;
        if (delta > 0 && delta < 600) responseTimes.push(delta); // Cap at 10 minutes
      }
    }
  }

  const totalTurns = responseTimes.length;
  const avgResponseSeconds = totalTurns > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / totalTurns)
    : 0;

  return { avgResponseSeconds, totalTurns };
}
