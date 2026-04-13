export class InterviewFollowUpRulesService {
  static decideBranch({ analysis = {}, interviewContext = {}, candidateResponse = '' } = {}) {
    const score = Number(analysis.score || 0);
    const missedConcepts = Array.isArray(analysis.nextFocus)
      ? analysis.nextFocus
      : Array.isArray(interviewContext.missingAreas)
        ? interviewContext.missingAreas
        : [];

    const responseText = String(candidateResponse || '').toLowerCase();
    const lowConfidenceSignals = /(not sure|i think|maybe|probably|guess|uncertain|not fully sure)/.test(responseText);
    const depthSignals = /(because|therefore|trade.?off|complexity|edge case|example)/.test(responseText);

    let nextAction = 'deepen';
    let branchReason = 'high_quality_answer';

    if (score < 60 || missedConcepts.length > 1) {
      nextAction = 'targeted_correction';
      branchReason = 'missed_core_concepts';
    } else if (lowConfidenceSignals) {
      nextAction = 'confidence_rebuild';
      branchReason = 'low_confidence_signal';
    } else if (!depthSignals) {
      nextAction = 'depth_probe';
      branchReason = 'shallow_explanation';
    }

    const answerQuality = score >= 80 ? 'strong' : score >= 65 ? 'medium' : 'weak';
    const confidence = lowConfidenceSignals ? 'low' : score >= 75 ? 'high' : 'medium';
    const depth = depthSignals ? 'deep' : 'shallow';

    return {
      answerQuality,
      missedConcepts,
      confidence,
      depth,
      branchReason,
      nextAction,
    };
  }
}

export default InterviewFollowUpRulesService;
