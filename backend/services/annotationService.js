/**
 * Annotation Service
 * Manages line-level code feedback on reviews
 * 
 * Severity levels: low, medium, high
 * Suggestion types: bug, style, performance, clarity, design
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Add a single annotation to a review
 */
export async function addAnnotation(reviewId, mentorId, annotation) {
  const { lineNumber, codeSnippet, suggestionType, suggestionText, severity = 'medium' } = annotation;

  // Validate annotation structure
  if (!lineNumber || !suggestionType || !suggestionText) {
    throw new Error('Missing required annotation fields: lineNumber, suggestionType, suggestionText');
  }

  if (!['bug', 'style', 'performance', 'clarity', 'design'].includes(suggestionType)) {
    throw new Error('Invalid suggestionType');
  }

  if (!['low', 'medium', 'high'].includes(severity)) {
    throw new Error('Invalid severity level');
  }

  // Verify mentor authorization
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('mentor_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.mentor_id !== mentorId) {
    throw new Error('Unauthorized: Only assigned mentor can add annotations');
  }

  // Insert annotation
  const { data: anno, error } = await supabaseAdmin
    .from('review_annotations')
    .insert({
      review_id: reviewId,
      line_number: lineNumber,
      code_snippet: codeSnippet || null,
      suggestion_type: suggestionType,
      suggestion_text: suggestionText,
      severity,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to add annotation: ${error.message}`);
  }

  return anno;
}

/**
 * Get all annotations for a review
 * Options: sortBy ('line'|'severity'|'type'|'created'), filter severity/type
 */
export async function getAnnotations(reviewId, userId, options = {}) {
  const { sortBy = 'line', filterSeverity = null, filterType = null } = options;

  // Verify access
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('requester_id, mentor_id')
    .eq('id', reviewId)
    .single();

  if (!review || (review.requester_id !== userId && review.mentor_id !== userId)) {
    throw new Error('Unauthorized: Cannot view annotations for this review');
  }

  let query = supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId);

  if (filterSeverity) {
    query = query.eq('severity', filterSeverity);
  }

  if (filterType) {
    query = query.eq('suggestion_type', filterType);
  }

  // Determine sort order
  let orderBy = 'line_number';
  let ascending = true;
  if (sortBy === 'severity') {
    orderBy = 'severity';
    ascending = false;
  } else if (sortBy === 'type') {
    orderBy = 'suggestion_type';
  } else if (sortBy === 'created') {
    orderBy = 'created_at';
    ascending = false;
  }

  const { data: annotations, error } = await query
    .order(orderBy, { ascending });

  if (error) {
    throw new Error(`Failed to fetch annotations: ${error.message}`);
  }

  return annotations || [];
}

/**
 * Update an annotation
 */
export async function updateAnnotation(annotationId, mentorId, updates) {
  // Fetch annotation
  const { data: anno } = await supabaseAdmin
    .from('review_annotations')
    .select('review_id')
    .eq('id', annotationId)
    .single();

  if (!anno) {
    throw new Error(`Annotation not found: ${annotationId}`);
  }

  // Verify mentor authorization
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('mentor_id')
    .eq('id', anno.review_id)
    .single();

  if (!review || review.mentor_id !== mentorId) {
    throw new Error('Unauthorized: Only assigned mentor can update annotations');
  }

  // Validate updates
  const allowedFields = ['suggestion_text', 'severity', 'suggestion_type'];
  const sanitized = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = value;
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error('No valid fields to update');
  }

  sanitized.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabaseAdmin
    .from('review_annotations')
    .update(sanitized)
    .eq('id', annotationId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update annotation: ${error.message}`);
  }

  return updated;
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId, mentorId) {
  // Fetch annotation
  const { data: anno } = await supabaseAdmin
    .from('review_annotations')
    .select('review_id')
    .eq('id', annotationId)
    .single();

  if (!anno) {
    throw new Error(`Annotation not found: ${annotationId}`);
  }

  // Verify mentor authorization
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('mentor_id')
    .eq('id', anno.review_id)
    .single();

  if (!review || review.mentor_id !== mentorId) {
    throw new Error('Unauthorized: Only assigned mentor can delete annotations');
  }

  const { error } = await supabaseAdmin
    .from('review_annotations')
    .delete()
    .eq('id', annotationId);

  if (error) {
    throw new Error(`Failed to delete annotation: ${error.message}`);
  }

  return { success: true };
}

/**
 * Add multiple annotations in bulk
 */
export async function bulkAddAnnotations(reviewId, mentorId, annotations) {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    throw new Error('Annotations must be a non-empty array');
  }

  // Verify mentor authorization
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('mentor_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.mentor_id !== mentorId) {
    throw new Error('Unauthorized: Only assigned mentor can add annotations');
  }

  // Validate and prepare all annotations
  const prepared = annotations.map((anno) => {
    if (!anno.lineNumber || !anno.suggestionType || !anno.suggestionText) {
      throw new Error('Each annotation must have lineNumber, suggestionType, suggestionText');
    }

    if (!['bug', 'style', 'performance', 'clarity', 'design'].includes(anno.suggestionType)) {
      throw new Error(`Invalid suggestionType: ${anno.suggestionType}`);
    }

    if (!['low', 'medium', 'high'].includes(anno.severity || 'medium')) {
      throw new Error(`Invalid severity: ${anno.severity}`);
    }

    return {
      review_id: reviewId,
      line_number: anno.lineNumber,
      code_snippet: anno.codeSnippet || null,
      suggestion_type: anno.suggestionType,
      suggestion_text: anno.suggestionText,
      severity: anno.severity || 'medium',
    };
  });

  // Insert all at once
  const { data: inserted, error } = await supabaseAdmin
    .from('review_annotations')
    .insert(prepared)
    .select('*');

  if (error) {
    throw new Error(`Failed to bulk add annotations: ${error.message}`);
  }

  return {
    inserted: inserted || [],
    count: (inserted || []).length,
  };
}

/**
 * Get annotation statistics for a review
 */
export async function getAnnotationStats(reviewId) {
  const { data: annotations, error } = await supabaseAdmin
    .from('review_annotations')
    .select('severity, suggestion_type')
    .eq('review_id', reviewId);

  if (error) {
    throw new Error(`Failed to fetch annotations: ${error.message}`);
  }

  const stats = {
    total: annotations?.length || 0,
    byType: {},
    bySeverity: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  (annotations || []).forEach((anno) => {
    // Count by type
    stats.byType[anno.suggestion_type] = (stats.byType[anno.suggestion_type] || 0) + 1;

    // Count by severity
    stats.bySeverity[anno.severity]++;
  });

  return stats;
}

/**
 * Get the highest severity annotation for a review
 */
export async function getMaxSeverityAnnotation(reviewId) {
  const { data: annotations } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId)
    .order('severity', { ascending: false })
    .limit(1);

  return annotations?.[0] || null;
}
