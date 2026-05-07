/**
 * Improvement Tracking Service
 * Measures progress on feedback implementation
 * Tracks improvement over time and suggests focus areas
 * 
 * Compares original solution to improved solution
 * Calculates implementation metrics
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Track progress from original to improved solution
 * Compares code metrics, annotations addressed
 */
export async function trackProgress(originalSolutionId, improvedSolutionId, reviewId) {
  // Fetch both solutions
  const { data: original } = await supabaseAdmin
    .from('solution_submissions')
    .select('*')
    .eq('id', originalSolutionId)
    .single();

  const { data: improved } = await supabaseAdmin
    .from('solution_submissions')
    .select('*')
    .eq('id', improvedSolutionId)
    .single();

  if (!original || !improved) {
    throw new Error('One or both solutions not found');
  }

  // Calculate code metrics
  const metrics = {
    originalLines: original.code?.split('\n').length || 0,
    improvedLines: improved.code?.split('\n').length || 0,
    originalLanguage: original.language,
    improvedLanguage: improved.language,
    codeChangePercentage: calculateCodeChangePercentage(original.code, improved.code),
  };

  // Fetch original review annotations
  const { data: annotations } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId);

  // Check which annotations were addressed
  const addressed = analyzeAddressedAnnotations(annotations || [], original.code, improved.code);

  // Create response record
  const { data: response, error } = await supabaseAdmin
    .from('review_responses')
    .insert({
      review_id: reviewId,
      implementor_id: improved.user_id,
      response_code: improved.code,
      annotations_implemented: addressed.implementedIds,
      status: 'implemented',
      implementation_score: addressed.implementationScore,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to track progress: ${error.message}`);
  }

  return {
    response,
    metrics,
    addressedAnnotations: addressed.count,
    totalAnnotations: (annotations || []).length,
    implementationPercentage: addressed.implementationPercentage,
  };
}

/**
 * Measure implementation quality
 * Calculates what % of suggestions were implemented
 */
export async function measureImplementation(reviewId, responseSolutionId) {
  // Fetch review annotations
  const { data: annotations, error: annoError } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId);

  if (annoError || !annotations) {
    throw new Error('Failed to fetch annotations');
  }

  // Fetch response solution
  const { data: solution } = await supabaseAdmin
    .from('solution_submissions')
    .select('*')
    .eq('id', responseSolutionId)
    .single();

  if (!solution) {
    throw new Error(`Solution not found: ${responseSolutionId}`);
  }

  // Analyze which annotations were addressed
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  const originalCode = review ? await fetchSolutionCode(review.solution_id) : '';
  const addressed = analyzeAddressedAnnotations(annotations, originalCode, solution.code);

  return {
    reviewId,
    totalAnnotations: annotations.length,
    addressedCount: addressed.count,
    missedCount: annotations.length - addressed.count,
    implementationPercentage: addressed.implementationPercentage,
    implementationScore: addressed.implementationScore,
    addressedAnnotationIds: addressed.implementedIds,
    qualityMetrics: calculateQualityMetrics(annotations, addressed),
  };
}

/**
 * Get improvement history for a user
 * Track progress across multiple solutions/reviews over time
 */
export async function getProgressHistory(userId, timeRange = '30d') {
  // Calculate date range
  const now = new Date();
  const since = new Date();

  const rangeMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 365 * 10, // 10 years
  };

  since.setDate(since.getDate() - (rangeMap[timeRange] || 30));

  // Fetch user solutions
  const { data: solutions } = await supabaseAdmin
    .from('solution_submissions')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (!solutions || solutions.length === 0) {
    return { userId, timeRange, history: [], summary: {} };
  }

  // For each solution, fetch reviews and responses
  const history = [];
  let totalAnnotations = 0;
  let totalAddressed = 0;

  for (const solution of solutions) {
    const { data: reviews } = await supabaseAdmin
      .from('mentor_reviews')
      .select('id')
      .eq('solution_id', solution.id)
      .in('status', ['submitted', 'completed']);

    if (reviews && reviews.length > 0) {
      for (const review of reviews) {
        const measurement = await measureImplementation(review.id, solution.id);
        history.push({
          solutionId: solution.id,
          reviewId: review.id,
          date: solution.created_at,
          ...measurement,
        });

        totalAnnotations += measurement.totalAnnotations;
        totalAddressed += measurement.addressedCount;
      }
    }
  }

  const summary = {
    totalSolutions: solutions.length,
    reviewedSolutions: new Set(history.map((h) => h.solutionId)).size,
    totalAnnotations,
    totalAddressed,
    overallImplementationRate: totalAnnotations > 0 ? (totalAddressed / totalAnnotations * 100).toFixed(1) : 0,
    trend: calculateTrend(history),
  };

  return {
    userId,
    timeRange,
    history: history.sort((a, b) => new Date(b.date) - new Date(a.date)),
    summary,
  };
}

/**
 * Suggest focus areas based on feedback patterns
 */
export async function suggestFollowUpFocus(userId) {
  // Get user's recent feedback
  const { data: solutions } = await supabaseAdmin
    .from('solution_submissions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!solutions || solutions.length === 0) {
    return { userId, suggestions: [] };
  }

  // Collect all annotations from recent reviews
  const allAnnotations = [];
  for (const solution of solutions) {
    const { data: reviews } = await supabaseAdmin
      .from('mentor_reviews')
      .select('id')
      .eq('solution_id', solution.id);

    if (reviews) {
      for (const review of reviews) {
        const { data: annos } = await supabaseAdmin
          .from('review_annotations')
          .select('*')
          .eq('review_id', review.id);

        if (annos) {
          allAnnotations.push(...annos);
        }
      }
    }
  }

  // Analyze patterns
  const typeFrequency = {};
  const unaddressedByType = {};

  allAnnotations.forEach((anno) => {
    typeFrequency[anno.suggestion_type] = (typeFrequency[anno.suggestion_type] || 0) + 1;
    if (anno.severity === 'high') {
      unaddressedByType[anno.suggestion_type] = (unaddressedByType[anno.suggestion_type] || 0) + 1;
    }
  });

  // Create suggestions
  const suggestions = Object.entries(typeFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      frequency: count,
      unaddressedCount: unaddressedByType[type] || 0,
      suggestion: getFocusSuggestion(type, count),
      priority: unaddressedByType[type] ? 'HIGH' : 'MEDIUM',
    }));

  return {
    userId,
    suggestions: suggestions.slice(0, 5),
    actionItems: generateActionItems(suggestions),
  };
}

/**
 * Helper: Calculate code change percentage
 */
function calculateCodeChangePercentage(original, improved) {
  const origLines = (original || '').split('\n');
  const implLines = (improved || '').split('\n');

  const totalLines = Math.max(origLines.length, implLines.length);
  if (totalLines === 0) return 0;

  // Simple diff: count different lines
  let changedLines = 0;
  for (let i = 0; i < totalLines; i++) {
    if ((origLines[i] || '') !== (implLines[i] || '')) {
      changedLines++;
    }
  }

  return Math.round((changedLines / totalLines) * 100);
}

/**
 * Helper: Analyze which annotations were addressed
 */
function analyzeAddressedAnnotations(annotations, originalCode, improvedCode) {
  const implementedIds = [];
  let addressedCount = 0;

  (annotations || []).forEach((anno) => {
    // Check if code at this line changed
    const origLines = (originalCode || '').split('\n');
    const implLines = (improvedCode || '').split('\n');

    const lineNum = anno.line_number - 1;
    if (lineNum >= 0 && lineNum < Math.max(origLines.length, implLines.length)) {
      if ((origLines[lineNum] || '') !== (implLines[lineNum] || '')) {
        implementedIds.push(anno.id);
        addressedCount++;
      }
    }
  });

  const total = annotations.length || 1;
  const implementationPercentage = Math.round((addressedCount / total) * 100);
  const implementationScore = calculateImplementationScore(implementationPercentage, annotations);

  return {
    count: addressedCount,
    implementedIds,
    implementationPercentage,
    implementationScore,
  };
}

/**
 * Helper: Calculate implementation score (0-100)
 */
function calculateImplementationScore(percentage, annotations) {
  let score = percentage; // Base on percentage addressed

  // Bonus for addressing high-severity items
  const highSeverityCount = (annotations || []).filter((a) => a.severity === 'high').length;
  if (highSeverityCount > 0) {
    const highSeverityAddressed = (annotations || []).filter(
      (a) => a.severity === 'high' && a.addressed === true
    ).length;
    if (highSeverityAddressed === highSeverityCount) {
      score = Math.min(100, score + 10);
    }
  }

  return Math.round(score);
}

/**
 * Helper: Calculate quality metrics
 */
function calculateQualityMetrics(annotations, addressed) {
  const byType = {};
  const bySeverity = { high: 0, medium: 0, low: 0 };

  (annotations || []).forEach((anno) => {
    byType[anno.suggestion_type] = (byType[anno.suggestion_type] || 0) + 1;
    bySeverity[anno.severity]++;
  });

  return {
    byType,
    bySeverity,
    addressedBySeverity: {
      high: (annotations || []).filter((a) => a.severity === 'high' && addressed.implementedIds.includes(a.id)).length,
      medium: (annotations || []).filter((a) => a.severity === 'medium' && addressed.implementedIds.includes(a.id)).length,
      low: (annotations || []).filter((a) => a.severity === 'low' && addressed.implementedIds.includes(a.id)).length,
    },
  };
}

/**
 * Helper: Fetch solution code
 */
async function fetchSolutionCode(solutionId) {
  const { data: solution } = await supabaseAdmin
    .from('solution_submissions')
    .select('code')
    .eq('id', solutionId)
    .single();

  return solution?.code || '';
}

/**
 * Helper: Calculate trend
 */
function calculateTrend(history) {
  if (history.length < 2) return 'insufficient_data';

  const recent = history.slice(0, Math.ceil(history.length / 2));
  const older = history.slice(Math.ceil(history.length / 2));

  const recentAvg = recent.reduce((sum, h) => sum + h.implementationPercentage, 0) / recent.length;
  const olderAvg = older.reduce((sum, h) => sum + h.implementationPercentage, 0) / older.length;

  if (recentAvg > olderAvg + 10) {
    return 'improving';
  } else if (recentAvg < olderAvg - 10) {
    return 'declining';
  }
  return 'stable';
}

/**
 * Helper: Generate focus suggestion
 */
function getFocusSuggestion(type, count) {
  const suggestions = {
    bug: `You've had ${count} bug-related feedback items. Focus on testing edge cases before submission.`,
    performance: `Performance was mentioned ${count} times. Review time/space complexity before submitting.`,
    style: `Code style feedback appeared ${count} times. Establish consistent formatting patterns.`,
    clarity: `Clarity issues came up ${count} times. Add comments for complex logic.`,
    design: `Design feedback appeared ${count} times. Spend more time on architecture before coding.`,
  };

  return suggestions[type] || `Keep improving on ${type} feedback.`;
}

/**
 * Helper: Generate action items
 */
function generateActionItems(suggestions) {
  return suggestions.slice(0, 3).map((s) => ({
    action: `Reduce ${s.type} issues in next submission`,
    focus: s.suggestion,
    priority: s.priority,
  }));
}
