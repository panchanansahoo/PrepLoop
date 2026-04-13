export class InterviewScoringService {
  static buildTypeRubric(interviewType) {
    const defaults = {
      communication: 0.34,
      decomposition: 0.33,
      technical: 0.33,
    };

    if (interviewType === 'system_design') {
      return { communication: 0.25, decomposition: 0.35, technical: 0.4 };
    }
    if (interviewType === 'behavioral') {
      return { communication: 0.45, decomposition: 0.35, technical: 0.2 };
    }
    if (interviewType === 'mixed') {
      return { communication: 0.35, decomposition: 0.33, technical: 0.32 };
    }

    return defaults;
  }

  static calculateRollingScores(analysis, transcript, interviewType = 'dsa') {
    const metrics = analysis.metrics || {};
    const rubric = this.buildTypeRubric(interviewType);
    const candidateTurns = (Array.isArray(transcript) ? transcript : []).filter((entry) => entry.role === 'candidate').length;
    const engagementBonus = Math.min(5, Math.max(0, candidateTurns - 1));

    const communication = Math.max(0, Math.min(100, Number(metrics.communication || 65)));
    const problemSolving = Math.max(0, Math.min(100, Number(metrics.problemDecomposition || 65)));
    const technicalDepth = Math.max(0, Math.min(100, Number(metrics.efficiency || 65)));

    const overall100 = Math.max(
      0,
      Math.min(
        100,
        Number(
          (
            communication * rubric.communication +
            problemSolving * rubric.decomposition +
            technicalDepth * rubric.technical +
            engagementBonus
          ).toFixed(1)
        )
      )
    );

    return {
      overall: Number((overall100 / 10).toFixed(1)),
      communication: Number((communication / 10).toFixed(1)),
      problem_solving: Number((problemSolving / 10).toFixed(1)),
      technical_depth: Number((technicalDepth / 10).toFixed(1)),
      performance_level: overall100 >= 90 ? 'Excellent' : overall100 >= 75 ? 'Good' : overall100 >= 60 ? 'Fair' : 'Needs Work',
    };
  }

  static deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns) {
    const current = String(currentDifficulty || 'medium').toLowerCase();
    const overall = Number(rollingOverallTen || 0);
    const safeTurns = Number(turns || 0);

    if (safeTurns >= 3 && overall >= 8.2) {
      if (current === 'easy') {
        return { changed: true, previousDifficulty: 'easy', newDifficulty: 'medium', reason: 'Strong consistency, escalating challenge.' };
      }
      if (current === 'medium') {
        return { changed: true, previousDifficulty: 'medium', newDifficulty: 'hard', reason: 'High performance, moving to hard-level probing.' };
      }
    }

    if (safeTurns >= 2 && overall <= 5.5) {
      if (current === 'hard') {
        return { changed: true, previousDifficulty: 'hard', newDifficulty: 'medium', reason: 'Reducing complexity to rebuild momentum.' };
      }
      if (current === 'medium') {
        return { changed: true, previousDifficulty: 'medium', newDifficulty: 'easy', reason: 'Switching to foundational depth before scaling up.' };
      }
    }

    return { changed: false, previousDifficulty: current, newDifficulty: current, reason: 'Difficulty remains stable.' };
  }
}

export default InterviewScoringService;
