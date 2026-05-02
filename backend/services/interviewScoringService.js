import { normalizeInterviewType, normalizeExperienceLevel, isFresher as checkIsFresher } from '../utils/typeNormalizer.js';

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
    const normalizedType = normalizeInterviewType(interviewType || 'dsa');
    const isFresherCandidate = checkIsFresher(experienceLevel);

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
    if (isFresherCandidate && (normalizedType === 'dsa' || normalizedType === 'system_design' || normalizedType === 'system-design' || normalizedType === 'mixed')) {
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
   * @param {Array<string>} skillGaps - Areas where the candidate consistently scores low
   * @param {number} avgResponseTimeMs - Average time per response in ms
   */
  static deriveAdaptiveDifficulty(currentDifficulty, rollingOverallTen, turns, scoreTrend = null, experienceLevel = null, skillGaps = [], avgResponseTimeMs = 0) {
    const current = String(currentDifficulty || 'medium').toLowerCase();
    const overall = Number(rollingOverallTen || 0);
    const safeTurns = Number(turns || 0);
    const trend = scoreTrend || { trend: 'stable', volatility: 'stable' };
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';

    if (safeTurns < 2 && trend.trend !== 'declining') {
      return { changed: false, previousDifficulty: current, newDifficulty: current, reason: 'Not enough turns to adapt difficulty.' };
    }

    let difficultyChange = 0;

    // Bonus for sustained performance over many turns
    if (overall >= 8) {
      if (isFresher && safeTurns >= 4) {
        difficultyChange += 0.2;
      } else if (!isFresher && safeTurns >= 3) {
        difficultyChange += 0.1;
      }
    }

    // Adjust based on trend
    if (trend.trend === 'improving' && trend.volatility !== 'volatile') {
      difficultyChange += 0.2;
    } else if (trend.trend === 'declining') {
      difficultyChange -= 0.4;
    }

    // Penalize high volatility
    if (trend.volatility === 'volatile') {
      difficultyChange -= 0.4;
    }
    
    // Adjust based on performance level
    if (overall >= 8) difficultyChange += 0.3;
    else if (overall <= 5.5) difficultyChange -= 0.2;
    
    // Adjust based on skill gaps and time pressure
    if (skillGaps && skillGaps.includes('complexity-analysis')) difficultyChange -= 0.1;
    if (skillGaps && skillGaps.length >= 2) difficultyChange -= 0.2;
    if (avgResponseTimeMs > 120000) difficultyChange -= 0.1; // Penalty for taking too long

    // Freshers need higher thresholds to escalate
    if (isFresher) {
      difficultyChange -= 0.1;
    }

    // Apply change with bounds checking
    // Threshold to actually step up/down is +/- 0.35
    const difficultyLevels = ['easy', 'medium', 'hard'];
    const currentIndex = difficultyLevels.indexOf(current) !== -1 ? difficultyLevels.indexOf(current) : 1;
    
    let step = 0;
    if (difficultyChange >= 0.35) step = 1;
    else if (difficultyChange <= -0.35) step = -1;

    const newIndex = Math.max(0, Math.min(difficultyLevels.length - 1, currentIndex + step));
    const newDifficulty = difficultyLevels[newIndex];

    const changed = current !== newDifficulty;

    return { 
      changed, 
      previousDifficulty: current, 
      newDifficulty: newDifficulty, 
      reason: changed ? 'Adapted based on performance trends, skill gaps, and timing' : 'Difficulty remains stable.' 
    };
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

  static calculateMultiDimensionalScore(analysis, transcript, interviewType, context) {
    const metrics = analysis?.metrics || {};
    const rubric = this.buildTypeRubric(interviewType, context?.experienceLevel);
    
    // Instead of using dummy _assess functions, we use the metrics provided by the LLM analysis
    const dimensions = {
      communication: Math.max(0, Math.min(100, Number(metrics.communication || 65))),
      technical_accuracy: Math.max(0, Math.min(100, Number(metrics.technicalAccuracy || metrics.efficiency || 65))),
      problem_solving: Math.max(0, Math.min(100, Number(metrics.problemDecomposition || 65))),
      completeness: Math.max(0, Math.min(100, Number(metrics.completeness || 60))),
      efficiency: Math.max(0, Math.min(100, Number(metrics.efficiency || 65)))
    };
    
    // Weight based on interview type (normalize our 3-part rubric for 5 dimensions if needed)
    // For simplicity, we use the robust rubric from buildTypeRubric for core parts
    const overallScore = Number((
      (dimensions.communication * rubric.communication) +
      (dimensions.problem_solving * rubric.decomposition) +
      (dimensions.technical_accuracy * rubric.technical)
    ).toFixed(1));
    
    return { ...dimensions, overall: overallScore / 10 }; // Normalize to 10
  }
}

export default InterviewScoringService;
