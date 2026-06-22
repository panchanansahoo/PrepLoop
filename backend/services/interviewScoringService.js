export class InterviewScoringService {
  /**
   * Build scoring rubric weights based on interview type and experience level.
   * Freshers get higher communication weight (evaluated more on clarity than depth)
   * while experienced candidates are held to a higher technical bar.
   * @param {string} interviewType - Interview type key
   * @param {string} experienceLevel - 'fresher' or 'experienced' (optional)
   * @returns {{ communication: number, decomposition: number, technical: number }}
   */
  static buildTypeRubric(interviewType, experienceLevel = null) {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';

    // Base rubrics by interview type
    const rubrics = {
      dsa:            { communication: 0.34, decomposition: 0.33, technical: 0.33 },
      system_design:  { communication: 0.25, decomposition: 0.35, technical: 0.40 },
      'system-design': { communication: 0.25, decomposition: 0.35, technical: 0.40 },
      behavioral:     { communication: 0.45, decomposition: 0.35, technical: 0.20 },
      hr:             { communication: 0.50, decomposition: 0.30, technical: 0.20 },
      mixed:          { communication: 0.35, decomposition: 0.33, technical: 0.32 },
    };

    const base = rubrics[normalizedType] || rubrics.dsa;

    // Fresher adjustment: shift weight from technical → communication
    // Freshers are evaluated more on clarity and structure than raw depth
    if (isFresher && (normalizedType === 'dsa' || normalizedType === 'system_design' || normalizedType === 'system-design' || normalizedType === 'mixed')) {
      return {
        communication: Math.min(0.50, base.communication + 0.06),
        decomposition: base.decomposition,
        technical: Math.max(0.15, base.technical - 0.06),
      };
    }

    return { ...base };
  }

  /**
   * Calculate rolling scores with optional fresher bonus.
   * @param {object} analysis - Analysis result with metrics
   * @param {Array} transcript - Interview transcript entries
   * @param {string} interviewType - Interview type key
   * @param {string} experienceLevel - 'fresher' or 'experienced'
   */
  static calculateRollingScores(analysis, transcript, interviewType = 'dsa', experienceLevel = null) {
    const metrics = analysis.metrics || {};
    const rubric = this.buildTypeRubric(interviewType);
    const candidateTurns = (Array.isArray(transcript) ? transcript : []).filter((entry) => entry.role === 'candidate').length;
    const engagementBonus = Math.min(5, Math.max(0, candidateTurns - 1));

    const communication = Math.max(0, Math.min(100, Number(metrics.communication || 65)));
    const problemSolving = Math.max(0, Math.min(100, Number(metrics.problemDecomposition || 65)));
    const technicalDepth = Math.max(0, Math.min(100, Number(metrics.efficiency || 65)));

    // Fresher bonus: +3 base points for attempting structure, even if depth is shallow.
    // This prevents freshers from scoring artificially low compared to experienced candidates
    // who simply use more keywords but don't necessarily demonstrate better understanding.
    const fresherBonus = String(experienceLevel || '').toLowerCase() === 'fresher' ? 3 : 0;

    const overall100 = Math.max(
      0,
      Math.min(
        100,
        Number(
          (
            communication * rubric.communication +
            problemSolving * rubric.decomposition +
            technicalDepth * rubric.technical +
            engagementBonus +
            fresherBonus
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

  /**
   * Derive adaptive difficulty based on performance, trend, and experience level.
   * Freshers get more patience before difficulty escalation (threshold raised).
   * @param {string} currentDifficulty - Current difficulty level
   * @param {number} rollingOverallTen - Rolling overall score (0-10 scale)
   * @param {number} turns - Number of turns completed
   * @param {object} scoreTrend - Trend data from calculateTrendFromHistory
   * @param {string} experienceLevel - 'fresher' or 'experienced' (optional)
   */
  static deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend = null, experienceLevel = null) {
    const current = String(currentDifficulty || 'medium').toLowerCase();
    const overall = Number(rollingOverallTen || 0);
    const safeTurns = Number(turns || 0);
    const trend = scoreTrend || { trend: 'stable', volatility: 'stable' };
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';

    // Block escalation for volatile candidates — they need stability, not harder problems
    const isVolatile = trend.volatility === 'volatile';
    // Also block escalation for declining-trend candidates — one good turn doesn't reverse a decline
    const isDeclining = trend.trend === 'declining';

    // Freshers get more patience: base escalation at turn 4 instead of 3
    // Improving-trend candidates still get fast-tracked
    const baseEscalateTurns = isFresher ? 4 : 3;
    const escalateTurns = trend.trend === 'improving' ? Math.max(2, baseEscalateTurns - 1) : baseEscalateTurns;

    if (safeTurns >= escalateTurns && overall >= 8.2 && !isVolatile && !isDeclining) {
      if (current === 'easy') {
        return { changed: true, previousDifficulty: 'easy', newDifficulty: 'medium', reason: 'Strong consistency, escalating challenge.' };
      }
      if (current === 'medium') {
        return { changed: true, previousDifficulty: 'medium', newDifficulty: 'hard', reason: 'High performance, moving to hard-level probing.' };
      }
    }

    // De-escalate sooner when trend is declining (lower threshold)
    const deescalateThreshold = trend.trend === 'declining' ? 6.0 : 5.5;
    const deescalateTurns = trend.trend === 'declining' ? 1 : 2;

    if (safeTurns >= deescalateTurns && overall <= deescalateThreshold) {
      if (current === 'hard') {
        return { changed: true, previousDifficulty: 'hard', newDifficulty: 'medium', reason: 'Reducing complexity to rebuild momentum.' };
      }
      if (current === 'medium') {
        return { changed: true, previousDifficulty: 'medium', newDifficulty: 'easy', reason: 'Switching to foundational depth before scaling up.' };
      }
    }

    // Volatile candidate with medium+ difficulty — consider de-escalation to stabilize
    if (isVolatile && current === 'hard' && safeTurns >= 2) {
      return { changed: true, previousDifficulty: 'hard', newDifficulty: 'medium', reason: 'Volatile performance detected, reducing difficulty to stabilize.' };
    }

    return { changed: false, previousDifficulty: current, newDifficulty: current, reason: 'Difficulty remains stable.' };
  }

  /**
   * Extract the most recent N scores from the interview transcript / context.
   * Each entry in scoreHistory should be { score: number, turn: number }.
   * @param {Array} transcript - Interview transcript entries
   * @param {object} interviewContext - Current interview context
   * @param {number} windowSize - Number of recent scores to return
   * @returns {Array<{score: number, turn: number}>}
   */
  static buildScoreHistory(transcript = [], interviewContext = {}, windowSize = 5) {
    const history = [];

    // Extract scores from transcript entries that have analysis results
    const entries = Array.isArray(transcript) ? transcript : [];
    let turn = 0;
    for (const entry of entries) {
      if (entry.role === 'candidate') {
        turn++;
        const entryScore = Number(
          entry.analysis?.score ??
          entry.score ??
          entry.analysis?.overall ??
          0
        );
        if (entryScore > 0) {
          history.push({ score: entryScore, turn });
        }
      }
    }

    // Also include scores from context if they weren't in transcript
    const contextScores = Array.isArray(interviewContext.scoreHistory)
      ? interviewContext.scoreHistory
      : [];
    for (const item of contextScores) {
      const s = Number(item?.score || 0);
      const t = Number(item?.turn || 0);
      if (s > 0 && !history.some(h => h.turn === t)) {
        history.push({ score: s, turn: t });
      }
    }

    // Sort by turn ascending and return last N
    history.sort((a, b) => a.turn - b.turn);
    return history.slice(-windowSize);
  }

  /**
   * Compute trend, volatility, and rolling mean from a score history window.
   * @param {Array<{score: number}>} scoreHistory - Recent scores
   * @returns {{ mean: number, stdDev: number, trend: string, volatility: string, delta: number }}
   */
  static calculateTrendFromHistory(scoreHistory = []) {
    const scores = (scoreHistory || []).map(h => Number(h?.score || 0)).filter(s => s > 0);

    if (scores.length < 2) {
      return {
        mean: scores[0] || 0,
        stdDev: 0,
        trend: 'stable',
        volatility: 'stable',
        delta: 0,
      };
    }

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Trend: compare first half average to second half average
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid);
    const secondHalf = scores.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const delta = secondAvg - firstAvg;

    let trend = 'stable';
    if (delta >= 10) trend = 'improving';
    else if (delta <= -10) trend = 'declining';

    // Volatility classification
    let volatility = 'stable';
    if (stdDev >= 18) volatility = 'volatile';
    else if (stdDev >= 10) volatility = 'moderate';

    return { mean: Number(mean.toFixed(1)), stdDev: Number(stdDev.toFixed(1)), trend, volatility, delta: Number(delta.toFixed(1)) };
  }
}

export default InterviewScoringService;
