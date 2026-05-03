/**
 * Feedback Analysis Service
 * Analyzes review annotations for patterns, actionability, and improvement areas
 * 
 * Categorizes feedback by type and severity
 * Scores actionability (0-100: how specific and implementable)
 * Detects mentor feedback patterns
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Analyze all annotations in a review
 * Returns categorization, statistics, and actionability metrics
 */
export async function analyzeFeedback(reviewId) {
  // Fetch all annotations
  const { data: annotations, error } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId);

  if (error) {
    throw new Error(`Failed to fetch annotations: ${error.message}`);
  }

  const annos = annotations || [];

  // Categorize by type and severity
  const categories = {
    bug: { high: [], medium: [], low: [] },
    style: { high: [], medium: [], low: [] },
    performance: { high: [], medium: [], low: [] },
    clarity: { high: [], medium: [], low: [] },
    design: { high: [], medium: [], low: [] },
  };

  annos.forEach((anno) => {
    if (categories[anno.suggestion_type]) {
      categories[anno.suggestion_type][anno.severity].push(anno);
    }
  });

  // Calculate statistics
  const stats = {
    totalAnnotations: annos.length,
    byType: {},
    bySeverity: { high: 0, medium: 0, low: 0 },
    avgActionability: 0,
    criticalFeedback: [],
  };

  annos.forEach((anno) => {
    stats.byType[anno.suggestion_type] = (stats.byType[anno.suggestion_type] || 0) + 1;
    stats.bySeverity[anno.severity]++;

    if (anno.severity === 'high') {
      stats.criticalFeedback.push(anno);
    }
  });

  // Calculate average actionability
  const actionability = annos.map((anno) => scoreActionability(anno));
  stats.avgActionability =
    actionability.length > 0
      ? Math.round(actionability.reduce((a, b) => a + b, 0) / actionability.length)
      : 0;

  // Priority ranking (high severity bugs/design first)
  const prioritized = annos.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const typeOrder = { bug: 0, design: 1, performance: 2, clarity: 3, style: 4 };

    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return typeOrder[a.suggestion_type] - typeOrder[b.suggestion_type];
  });

  return {
    categories,
    statistics: stats,
    annotationsByPriority: prioritized,
    summary: generateFeedbackSummary(categories, stats),
  };
}

/**
 * Score actionability of a single annotation (0-100)
 * Higher score = more specific, actionable, implementable
 * Factors: specificity, clarity, completeness
 */
function scoreActionability(annotation) {
  let score = 50; // Base score

  const { suggestion_text: text } = annotation;

  if (!text) {
    return 0;
  }

  // Specificity: mentions code patterns, variables, etc.
  const hasCodeReference = /`[^`]+`|function|method|variable|class|interface/.test(text);
  if (hasCodeReference) {
    score += 15;
  }

  // Action-oriented language
  const hasActionItems = /change|replace|rename|refactor|use|add|remove|consider|try|avoid/.test(text.toLowerCase());
  if (hasActionItems) {
    score += 15;
  }

  // Provides rationale
  const hasExplanation = /because|since|it's|this|that|which|leads to|causes|results in/.test(text.toLowerCase());
  if (hasExplanation) {
    score += 10;
  }

  // Suggests alternative
  const suggestsAlternative = /instead|alternatively|try using|consider using|could use/.test(text.toLowerCase());
  if (suggestsAlternative) {
    score += 10;
  }

  // Quality indicators (long, detailed feedback)
  const words = text.split(/\s+/).length;
  if (words > 10) {
    score += 10;
  } else if (words < 5) {
    score -= 10; // Too brief
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Batch score actionability for multiple annotations
 */
export function scoreActionabilityBatch(annotations) {
  return annotations.map((anno) => ({
    ...anno,
    actionabilityScore: scoreActionability(anno),
  }));
}

/**
 * Get actionability score for entire review
 */
export async function getReviewActionabilityScore(reviewId) {
  const analysis = await analyzeFeedback(reviewId);
  return analysis.statistics.avgActionability;
}

/**
 * Detect patterns in mentor's feedback
 * Returns common themes, focus areas, and feedback style
 */
export async function detectPatterns(mentorId) {
  // Fetch all reviews by this mentor
  const { data: reviews } = await supabaseAdmin
    .from('mentor_reviews')
    .select('id')
    .eq('mentor_id', mentorId);

  if (!reviews || reviews.length === 0) {
    return { mentorId, patterns: {}, focusAreas: {}, reviewCount: 0 };
  }

  // Aggregate all annotations
  const allAnnotations = [];
  for (const review of reviews) {
    const { data: annos } = await supabaseAdmin
      .from('review_annotations')
      .select('*')
      .eq('review_id', review.id);

    if (annos) {
      allAnnotations.push(...annos);
    }
  }

  // Analyze patterns
  const patterns = {
    byType: {},
    bySeverity: { high: 0, medium: 0, low: 0 },
    mostCommonIssues: [],
  };

  allAnnotations.forEach((anno) => {
    patterns.byType[anno.suggestion_type] = (patterns.byType[anno.suggestion_type] || 0) + 1;
    patterns.bySeverity[anno.severity]++;
  });

  // Find most common issues (top keywords in feedback)
  const keywords = {};
  allAnnotations.forEach((anno) => {
    const words = anno.suggestion_text.toLowerCase().split(/\W+/);
    const importantWords = words.filter((w) => w.length > 4 && !isCommonWord(w));
    importantWords.forEach((word) => {
      keywords[word] = (keywords[word] || 0) + 1;
    });
  });

  patterns.mostCommonIssues = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, frequency: count }));

  return {
    mentorId,
    reviewCount: reviews.length,
    annotationCount: allAnnotations.length,
    avgAnnotationsPerReview: (allAnnotations.length / reviews.length).toFixed(2),
    patterns,
    focusAreas: patterns.byType,
  };
}

/**
 * Suggest improvement areas from annotations
 * Priority ranking based on severity, frequency, impact
 */
export async function suggestImprovementAreas(reviewId) {
  const analysis = await analyzeFeedback(reviewId);
  const { annotationsByPriority, categories } = analysis;

  const improvements = [];

  // Group by category for recommendations
  Object.entries(categories).forEach(([type, severities]) => {
    const highSeverity = severities.high;
    const mediumSeverity = severities.medium;

    if (highSeverity.length > 0) {
      improvements.push({
        priority: 'CRITICAL',
        category: type,
        count: highSeverity.length,
        focus: `Fix ${highSeverity.length} ${type} issue(s)`,
        examples: highSeverity.slice(0, 2).map((a) => a.suggestion_text),
      });
    } else if (mediumSeverity.length > 0) {
      improvements.push({
        priority: 'HIGH',
        category: type,
        count: mediumSeverity.length,
        focus: `Improve ${mediumSeverity.length} ${type} issue(s)`,
        examples: mediumSeverity.slice(0, 2).map((a) => a.suggestion_text),
      });
    }
  });

  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return improvements;
}

/**
 * Generate a human-readable summary of feedback
 */
function generateFeedbackSummary(categories, stats) {
  const parts = [];

  // Overall tone
  if (stats.avgActionability > 80) {
    parts.push('🎯 Highly actionable feedback');
  } else if (stats.avgActionability > 60) {
    parts.push('✅ Generally clear feedback');
  } else {
    parts.push('⚠️ Feedback could be more specific');
  }

  // Critical issues
  if (stats.bySeverity.high > 0) {
    parts.push(`⚡ ${stats.bySeverity.high} critical issue(s) to address`);
  }

  // Focus areas
  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  if (topTypes.length > 0) {
    parts.push(`Focus areas: ${topTypes.join(', ')}`);
  }

  return parts.join(' • ');
}

/**
 * Common English words to filter out when finding patterns
 */
function isCommonWord(word) {
  const common = new Set([
    'the', 'and', 'that', 'this', 'with', 'from', 'have', 'will', 'your',
    'should', 'could', 'would', 'more', 'also', 'just', 'even', 'very',
  ]);
  return common.has(word);
}

/**
 * Compare feedback severity across multiple reviews
 */
export async function compareFeedbackSeverity(solutionId) {
  // Fetch all reviews for a solution
  const { data: reviews } = await supabaseAdmin
    .from('mentor_reviews')
    .select('id, created_at, mentor_id')
    .eq('solution_id', solutionId)
    .order('created_at', { ascending: true });

  if (!reviews || reviews.length === 0) {
    return { comparison: [], trend: 'no_data' };
  }

  // Analyze each review
  const comparison = [];
  for (const review of reviews) {
    const analysis = await analyzeFeedback(review.id);
    comparison.push({
      reviewId: review.id,
      date: review.created_at,
      statistics: analysis.statistics,
      avgActionability: analysis.statistics.avgActionability,
    });
  }

  // Detect trend
  let trend = 'stable';
  if (comparison.length > 1) {
    const first = comparison[0].statistics.bySeverity.high;
    const last = comparison[comparison.length - 1].statistics.bySeverity.high;
    if (last < first) {
      trend = 'improving';
    } else if (last > first) {
      trend = 'degrading';
    }
  }

  return { comparison, trend };
}
