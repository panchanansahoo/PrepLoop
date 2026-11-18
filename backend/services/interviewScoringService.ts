import type {
  TypeRubricWeights,
  RollingScoresResult,
  AdaptiveDifficultyResult,
  ScoreHistoryEntry,
  ScoreTrendAnalysis,
} from '../types/interview.ts';

export class InterviewScoringService {
  /**
   * Build scoring rubric weights based on interview type and experience level.
   * Freshers get higher communication weight (evaluated more on clarity than depth)
   * while experienced candidates are held to a higher technical bar.
   */
  static buildTypeRubric(interviewType: string, experienceLevel: string | null = null): TypeRubricWeights {
    const normalizedType = String(interviewType || 'dsa').toLowerCase();
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';

    // Base rubrics by interview type
    const rubrics: Record<string, TypeRubricWeights> = {
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
   */
  static calculateRollingScores(
    analysis: { metrics?: Record<string, any>; score?: number } = {},
    transcript: any[] = [],
    interviewType: string = 'dsa',
    experienceLevel: string | null = null
  ): RollingScoresResult {
    const metrics = analysis?.metrics || {};
    const rubric = this.buildTypeRubric(interviewType, experienceLevel);
    const candidateTurns = (Array.isArray(transcript) ? transcript : []).filter((entry) => entry?.role === 'candidate').length;
    const engagementBonus = Math.min(5, Math.max(0, candidateTurns - 1));

    const commRaw = metrics.communication ?? null;
    const probRaw = (metrics.problemDecomposition ?? metrics.problemSolving) ?? null;
    const techRaw = (metrics.efficiency ?? metrics.technicalDepth) ?? null;

    const commValid = commRaw !== null && commRaw !== undefined && Number.isFinite(Number(commRaw));
    const probValid = probRaw !== null && probRaw !== undefined && Number.isFinite(Number(probRaw));
    const techValid = techRaw !== null && techRaw !== undefined && Number.isFinite(Number(techRaw));

    const validMetricCount = [commValid, probValid, techValid].filter(Boolean).length;
    const scoringConfidence = Number((validMetricCount / 3).toFixed(2));
    const hasAnyMetric = validMetricCount > 0;

    // Replace fallback with null on metric dimensions
    const communication = commValid ? Math.max(0, Math.min(100, Number(commRaw))) : null;
    const problemSolving = probValid ? Math.max(0, Math.min(100, Number(probRaw))) : null;
    const technicalDepth = techValid ? Math.max(0, Math.min(100, Number(techRaw))) : null;

    // Propagate unscored status if dimensions are null
    const allDimensionsNull = communication === null && problemSolving === null && technicalDepth === null;
    const isUnscored = allDimensionsNull || (!hasAnyMetric && !analysis?.score);

    // Fresher bonus: gate on scoringConfidence >= 0.67 (at least 2 valid metrics)
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';
    const fresherBonusApplied = isFresher && validMetricCount >= 2;
    const fresherBonus = fresherBonusApplied ? 3 : 0;

    let overall100: number | null = null;
    if (!isUnscored && hasAnyMetric) {
      const activeWeights =
        (communication !== null ? rubric.communication : 0) +
        (problemSolving !== null ? rubric.decomposition : 0) +
        (technicalDepth !== null ? rubric.technical : 0);

      const weightedScore =
        (communication !== null ? communication * rubric.communication : 0) +
        (problemSolving !== null ? problemSolving * rubric.decomposition : 0) +
        (technicalDepth !== null ? technicalDepth * rubric.technical : 0);

      const normalizedBase = activeWeights > 0 ? weightedScore / activeWeights : 0;
      overall100 = Math.max(
        0,
        Math.min(
          100,
          Number((normalizedBase + engagementBonus + fresherBonus).toFixed(1))
        )
      );
    }

    return {
      overall: overall100 === null ? null : Number((overall100 / 10).toFixed(1)),
      communication: communication === null ? null : Number((communication / 10).toFixed(1)),
      problem_solving: problemSolving === null ? null : Number((problemSolving / 10).toFixed(1)),
      technical_depth: technicalDepth === null ? null : Number((technicalDepth / 10).toFixed(1)),
      performance_level:
        overall100 === null
          ? 'Needs Work'
          : overall100 >= 90
          ? 'Excellent'
          : overall100 >= 75
          ? 'Good'
          : overall100 >= 60
          ? 'Fair'
          : 'Needs Work',
      isUnscored,
      metricsMissing: !hasAnyMetric,
      scoringConfidence,
      fresherBonusApplied,
    };
  }

  /**
   * Derive adaptive difficulty based on performance, trend, and experience level.
   * Freshers get more patience before difficulty escalation (threshold raised).
   */
  static deriveAdaptiveDifficulty(
    currentDifficulty: string,
    rollingOverallTen: number,
    turns: number,
    scoreTrend: ScoreTrendAnalysis | null = null,
    experienceLevel: string | null = null
  ): AdaptiveDifficultyResult {
    const current = String(currentDifficulty || 'medium').toLowerCase();
    const overall = Number(rollingOverallTen || 0);
    const safeTurns = Number(turns || 0);
    const trend = scoreTrend || { mean: 0, stdDev: 0, trend: 'stable' as const, volatility: 'stable' as const, delta: 0 };
    const isFresher = String(experienceLevel || '').toLowerCase() === 'fresher';

    // Block escalation for volatile candidates — they need stability, not harder problems
    const isVolatile = trend.volatility === 'volatile';
    // Also block escalation for declining-trend candidates — one good turn doesn't reverse a decline
    const isDeclining = trend.trend === 'declining';

    // Freshers get more patience: base escalation at turn 4 instead of 3
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
   */
  static buildScoreHistory(
    transcript: any[] = [],
    interviewContext: { scoreHistory?: any[]; totalQuestions?: number } = {},
    windowSize: number = 5
  ): ScoreHistoryEntry[] {
    const history: ScoreHistoryEntry[] = [];
    const totalQ = Number(interviewContext?.totalQuestions || 0);
    const effectiveWindowSize = (totalQ > 0 && windowSize === 5)
      ? Math.max(3, Math.round(totalQ * 0.4))
      : (windowSize || 5);

    // Extract scores from transcript entries that have analysis results
    const entries = Array.isArray(transcript) ? transcript : [];
    let turn = 0;
    for (const entry of entries) {
      if (entry?.role === 'candidate') {
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
    const contextScores = Array.isArray(interviewContext?.scoreHistory)
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
    return history.slice(-effectiveWindowSize);
  }

  /**
   * Compute trend, volatility, and rolling mean from a score history window.
   */
  static calculateTrendFromHistory(scoreHistory: ScoreHistoryEntry[] = []): ScoreTrendAnalysis {
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

    let trend: 'stable' | 'improving' | 'declining' = 'stable';
    if (delta >= 10) trend = 'improving';
    else if (delta <= -10) trend = 'declining';

    // Volatility classification
    let volatility: 'stable' | 'moderate' | 'volatile' = 'stable';
    if (stdDev >= 18) volatility = 'volatile';
    else if (stdDev >= 10) volatility = 'moderate';

    return {
      mean: Number(mean.toFixed(1)),
      stdDev: Number(stdDev.toFixed(1)),
      trend,
      volatility,
      delta: Number(delta.toFixed(1)),
    };
  }

  /**
   * Cross-Session Starting Difficulty Calibration (Horizon 1.2)
   * Calibrates starting difficulty based on candidate's historical performance.
   */
  static deriveStartingDifficulty(
    recentSessions: Array<{
      score?: number;
      overall_score?: number;
      interview_score?: number;
      difficulty?: string;
      difficulty_level?: string;
      interview_type?: string;
      type?: string;
      status?: string;
    }> = [],
    preferredDifficulty: string = 'medium',
    interviewType: string | null = null
  ): string {
    const normPreferred = String(preferredDifficulty || 'medium').toLowerCase();
    const validDifficulties = ['easy', 'medium', 'hard', 'staff', 'staff_architectural'];
    const safePreferred = validDifficulties.includes(normPreferred) ? normPreferred : 'medium';

    if (!Array.isArray(recentSessions) || recentSessions.length === 0) {
      return safePreferred;
    }

    // Helper to safely extract numeric score
    const extractScore = (s: any): number | null => {
      if (!s || typeof s !== 'object') return null;
      if (s.status && (s.status === 'abandoned' || s.status === 'failed')) return null;
      const raw = s.score ?? s.overall_score ?? s.interview_score ?? s.overall ?? null;
      if (raw === null || raw === undefined) return null;
      const num = Number(raw);
      return Number.isFinite(num) ? num : null;
    };

    // Filter completed sessions with valid scores
    const completedWithScores = recentSessions
      .map(s => ({ session: s, score: extractScore(s) }))
      .filter((item): item is { session: any; score: number } => item.score !== null);

    if (completedWithScores.length === 0) {
      return safePreferred;
    }

    // Filter by matching interview type if supplied and matching sessions exist
    let targeted = completedWithScores;
    if (interviewType) {
      const normType = String(interviewType).toLowerCase().replace('system-design', 'system_design');
      const typeMatches = completedWithScores.filter(item => {
        const sType = String(item.session.interview_type || item.session.type || '').toLowerCase().replace('system-design', 'system_design');
        return sType === normType;
      });
      if (typeMatches.length > 0) {
        targeted = typeMatches;
      }
    }

    // Compute average score across targeted sessions
    const totalScore = targeted.reduce((sum, item) => sum + item.score, 0);
    const avgScore = totalScore / targeted.length;

    // Check if sessions were on medium/hard difficulty
    const hasMedOrHardDifficulty = targeted.some(item => {
      const d = String(item.session.difficulty || item.session.difficulty_level || safePreferred).toLowerCase();
      return d === 'medium' || d === 'hard' || d === 'staff' || d === 'staff_architectural';
    });

    // Rule 1: If recent completed sessions average >= 80 on medium/hard difficulty -> return 'hard'
    if (avgScore >= 80 && hasMedOrHardDifficulty) {
      return 'hard';
    }

    // Rule 2: If recent completed sessions average < 50 -> return one tier lower
    if (avgScore < 50) {
      const lowerTierMap: Record<string, string> = {
        hard: 'medium',
        staff: 'hard',
        staff_architectural: 'hard',
        medium: 'easy',
        easy: 'easy',
      };
      // Base lowering on preferredDifficulty, or on recent session difficulty if preferred is default
      const recentDiff = String(targeted[targeted.length - 1]?.session.difficulty || targeted[targeted.length - 1]?.session.difficulty_level || safePreferred).toLowerCase();
      const baseDiff = safePreferred !== 'medium' ? safePreferred : (recentDiff || 'medium');
      return lowerTierMap[baseDiff] || 'easy';
    }

    // Rule 3: Otherwise return preferredDifficulty (default 'medium')
    return safePreferred;
  }
}

export const deriveStartingDifficulty = InterviewScoringService.deriveStartingDifficulty.bind(InterviewScoringService);

export default InterviewScoringService;

