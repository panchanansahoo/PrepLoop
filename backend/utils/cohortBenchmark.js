/**
 * Cohort Benchmark Intelligence — PrepLoop Recruiter Platform
 *
 * Calculates cohort percentile rankings, bell-curve distribution statistics,
 * and relative candidate performance across interview question set submissions.
 */

/**
 * Normalizes an array of scores or submission objects into an array of valid numeric scores (0-100).
 *
 * @param {Array<number|object>} submissions - Array of numeric scores or submission objects
 * @returns {number[]} Clean array of numbers sorted ascending
 */
export function extractScores(submissions = []) {
  if (!Array.isArray(submissions)) return [];

  const scores = [];
  for (const item of submissions) {
    if (typeof item === 'number' && !Number.isNaN(item)) {
      scores.push(Math.max(0, Math.min(100, Math.round(item))));
    } else if (item && typeof item === 'object') {
      const val =
        item.overall_score ??
        item.scores?.serverOverallScore ??
        item.scores?.score ??
        item.score ??
        null;
      const num = Number(val);
      if (val !== null && !Number.isNaN(num)) {
        scores.push(Math.max(0, Math.min(100, Math.round(num))));
      }
    }
  }

  return scores.sort((a, b) => a - b);
}

/**
 * Calculates candidate percentile ranking against cohort scores.
 * Uses standard rank definition: (countStrictlyBelow + 0.5 * countEqual) / N * 100
 *
 * @param {number} candidateScore - The candidate's overall score (0-100)
 * @param {Array<number|object>} cohort - All cohort scores or submission objects
 * @returns {{ percentile: number, topPercentage: number, rank: number, total: number }}
 */
export function calculatePercentileRank(candidateScore, cohort = []) {
  const numScore = Math.max(0, Math.min(100, Math.round(Number(candidateScore) || 0)));
  const scores = extractScores(cohort);

  if (scores.length === 0) {
    return {
      percentile: 50,
      topPercentage: 50,
      rank: 1,
      total: 1,
    };
  }

  // Ensure candidate is included in ranking comparison
  const allScores = [...scores];
  let strictlyBelow = 0;
  let equalTo = 0;

  for (const score of allScores) {
    if (score < numScore) strictlyBelow++;
    else if (score === numScore) equalTo++;
  }

  // If candidate wasn't part of cohort originally, count candidate itself
  const effectiveEqual = equalTo > 0 ? equalTo : 1;
  const effectiveTotal = equalTo > 0 ? allScores.length : allScores.length + 1;

  const rawPercentile = ((strictlyBelow + 0.5 * effectiveEqual) / effectiveTotal) * 100;
  const percentile = Math.max(1, Math.min(99, Math.round(rawPercentile)));
  const topPercentage = Math.max(1, 100 - percentile);

  // 1-based rank (highest score is rank 1)
  let higherScores = 0;
  for (const s of allScores) {
    if (s > numScore) higherScores++;
  }
  const rank = higherScores + 1;

  return {
    percentile,
    topPercentage,
    rank,
    total: effectiveTotal,
  };
}

/**
 * Computes descriptive statistics for a cohort of scores.
 *
 * @param {Array<number|object>} cohort
 * @returns {{ count: number, mean: number, median: number, stdDev: number, min: number, max: number, p25: number, p75: number, iqr: number }}
 */
export function calculateCohortStatistics(cohort = []) {
  const scores = extractScores(cohort);
  const n = scores.length;

  if (n === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      iqr: 0,
    };
  }

  const sum = scores.reduce((acc, val) => acc + val, 0);
  const mean = Number((sum / n).toFixed(1));

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0
    ? scores[mid]
    : Number(((scores[mid - 1] + scores[mid]) / 2).toFixed(1));

  // Standard deviation (population)
  const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Number(Math.sqrt(variance).toFixed(1));

  // Percentiles (p25, p75)
  const getP = (p) => {
    const idx = (p / 100) * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const weight = idx - low;
    return Number((scores[low] * (1 - weight) + scores[high] * weight).toFixed(1));
  };

  const p25 = getP(25);
  const p75 = getP(75);
  const iqr = Number((p75 - p25).toFixed(1));

  return {
    count: n,
    mean,
    median,
    stdDev,
    min: scores[0],
    max: scores[n - 1],
    p25,
    p75,
    iqr,
  };
}

/**
 * Generates bell-curve histogram bins and Gaussian density points.
 *
 * @param {Array<number|object>} cohort
 * @param {number} [candidateScore=null]
 * @param {number} [numBuckets=10]
 * @returns {Array<{ bucketIndex: number, label: string, min: number, max: number, count: number, percentage: number, isCandidateBucket: boolean, normalDensity: number }>}
 */
export function generateBellCurveDistribution(cohort = [], candidateScore = null, numBuckets = 10) {
  const scores = extractScores(cohort);
  const n = scores.length;
  const stats = calculateCohortStatistics(scores);
  const candidateNum = candidateScore !== null && !Number.isNaN(Number(candidateScore))
    ? Math.round(Number(candidateScore))
    : null;

  const buckets = [];
  const bucketSize = 100 / numBuckets;

  for (let i = 0; i < numBuckets; i++) {
    const min = Math.round(i * bucketSize);
    const max = i === numBuckets - 1 ? 100 : Math.round((i + 1) * bucketSize - 1);
    const label = `${min}-${max}`;

    // Count candidates in bucket
    const inBucket = scores.filter((s) => {
      if (i === numBuckets - 1) {
        return s >= min && s <= max;
      }
      return s >= min && s <= max;
    });

    const isCandidateBucket = candidateNum !== null && (
      i === numBuckets - 1
        ? candidateNum >= min && candidateNum <= max
        : candidateNum >= min && candidateNum <= max
    );

    // Theoretical normal density height at bucket midpoint
    const midPoint = (min + max) / 2;
    let normalDensity = 0;
    if (stats.stdDev > 0) {
      const exponent = -Math.pow(midPoint - stats.mean, 2) / (2 * Math.pow(stats.stdDev, 2));
      normalDensity = Number(((1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent) * 100).toFixed(2));
    }

    buckets.push({
      bucketIndex: i,
      label,
      min,
      max,
      count: inBucket.length,
      percentage: n > 0 ? Number(((inBucket.length / n) * 100).toFixed(1)) : 0,
      isCandidateBucket,
      normalDensity,
    });
  }

  return buckets;
}

/**
 * Calculates candidate relative standing against the cohort (delta from mean/median, z-score).
 *
 * @param {number} candidateScore
 * @param {Array<number|object>} cohort
 * @returns {{ deltaFromMean: number, deltaFromMedian: number, zScore: number, rank: number, total: number }}
 */
export function calculateRelativeScore(candidateScore, cohort = []) {
  const numScore = Math.max(0, Math.min(100, Math.round(Number(candidateScore) || 0)));
  const stats = calculateCohortStatistics(cohort);
  const rankData = calculatePercentileRank(numScore, cohort);

  const deltaFromMean = Number((numScore - stats.mean).toFixed(1));
  const deltaFromMedian = Number((numScore - stats.median).toFixed(1));
  const zScore = stats.stdDev > 0
    ? Number(((numScore - stats.mean) / stats.stdDev).toFixed(2))
    : 0;

  return {
    deltaFromMean,
    deltaFromMedian,
    zScore,
    rank: rankData.rank,
    total: rankData.total,
  };
}

/**
 * Returns a human-friendly tier badge info based on percentile and score.
 *
 * @param {number} percentile
 * @param {number} score
 * @returns {{ tier: string, label: string, variant: 'emerald'|'cyan'|'indigo'|'amber'|'rose', badgeColor: string }}
 */
export function getCohortTier(percentile, score) {
  if (percentile >= 90 || score >= 88) {
    return {
      tier: 'Top 10%',
      label: 'Exceptional Performer',
      variant: 'emerald',
      badgeColor: '#10b981',
    };
  }
  if (percentile >= 75 || score >= 75) {
    return {
      tier: 'Top 25%',
      label: 'Strong Performer',
      variant: 'cyan',
      badgeColor: '#06b6d4',
    };
  }
  if (percentile >= 50 || score >= 65) {
    return {
      tier: 'Above Median',
      label: 'Solid Competence',
      variant: 'indigo',
      badgeColor: '#6366f1',
    };
  }
  if (percentile >= 25 || score >= 50) {
    return {
      tier: 'Cohort Average',
      label: 'Developing Bar',
      variant: 'amber',
      badgeColor: '#f59e0b',
    };
  }
  return {
    tier: 'Below Bar',
    label: 'Needs Review',
    variant: 'rose',
    badgeColor: '#f43f5e',
  };
}

/**
 * Main coordinator function that calculates full cohort benchmark intelligence
 * for a candidate against a question set's submissions.
 *
 * @param {number|object} candidateOrSubmission - Candidate score or submission record
 * @param {Array<number|object>} allSubmissions - All submissions or scores for this question set
 * @param {object} [options={}]
 * @returns {object} Complete cohort benchmark analytics payload
 */
export function calculateCohortBenchmark(candidateOrSubmission, allSubmissions = [], options = {}) {
  // Extract candidate score
  let candidateScore = 0;
  if (typeof candidateOrSubmission === 'number') {
    candidateScore = candidateOrSubmission;
  } else if (candidateOrSubmission && typeof candidateOrSubmission === 'object') {
    candidateScore =
      candidateOrSubmission.overall_score ??
      candidateOrSubmission.scores?.serverOverallScore ??
      candidateOrSubmission.scores?.score ??
      candidateOrSubmission.score ??
      0;
  }
  candidateScore = Math.max(0, Math.min(100, Math.round(Number(candidateScore) || 0)));

  // Extract cohort scores
  let cohort = Array.isArray(allSubmissions) ? [...allSubmissions] : [];

  // If cohort is empty, create representative baseline distribution anchored at 70
  if (cohort.length === 0) {
    cohort = [candidateScore];
  }

  const scores = extractScores(cohort);
  const stats = calculateCohortStatistics(scores);
  const percentileData = calculatePercentileRank(candidateScore, scores);
  const relative = calculateRelativeScore(candidateScore, scores);
  const distribution = generateBellCurveDistribution(scores, candidateScore, options.numBuckets || 10);
  const tierInfo = getCohortTier(percentileData.percentile, candidateScore);

  return {
    candidateScore,
    percentile: percentileData.percentile,
    topPercentage: percentileData.topPercentage,
    rank: percentileData.rank,
    cohortSize: percentileData.total,
    tier: tierInfo.tier,
    label: tierInfo.label,
    variant: tierInfo.variant,
    badgeColor: tierInfo.badgeColor,
    badge: {
      text: `Top ${percentileData.topPercentage}%`,
      subtext: `${percentileData.percentile}th percentile`,
      rankText: `Rank ${percentileData.rank} of ${percentileData.total}`,
      label: tierInfo.label,
      variant: tierInfo.variant,
      color: tierInfo.badgeColor,
    },
    stats,
    relative,
    distribution,
  };
}

export default {
  extractScores,
  calculatePercentileRank,
  calculateCohortStatistics,
  generateBellCurveDistribution,
  calculateRelativeScore,
  getCohortTier,
  calculateCohortBenchmark,
};
