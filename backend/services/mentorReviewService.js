/**
 * Mentor Review Service
 * Core CRUD operations for expert code review lifecycle
 * 
 * Lifecycle: pending -> in_review -> submitted -> completed
 * Authorization: Mentors manage reviews, requesters view own reviews
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Request a code review from a mentor
 * Creates a new review record in 'pending' state
 */
export async function requestReview(solutionId, userId, options = {}) {
  const { preferredMentors = [], deadline = null } = options;

  // Validate solution ownership
  const { data: solution, error: solutionError } = await supabaseAdmin
    .from('solution_submissions')
    .select('id, user_id')
    .eq('id', solutionId)
    .single();

  if (solutionError || !solution) {
    throw new Error(`Solution not found: ${solutionId}`);
  }

  if (solution.user_id !== userId) {
    throw new Error('Unauthorized: Can only request reviews for own solutions');
  }

  // Check if review already pending/in_review
  const { data: existing } = await supabaseAdmin
    .from('mentor_reviews')
    .select('id, status')
    .eq('solution_id', solutionId)
    .in('status', ['pending', 'in_review'])
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('A review is already in progress for this solution');
  }

  // Create review record
  const { data: review, error } = await supabaseAdmin
    .from('mentor_reviews')
    .insert({
      solution_id: solutionId,
      requester_id: userId,
      mentor_id: null,
      status: 'pending',
      deadline,
      notes: options.notes || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create review request: ${error.message}`);
  }

  return review;
}

/**
 * Get all reviews for a solution
 * Filters by status and mentor, with pagination
 */
export async function getReviewsForSolution(solutionId, userId, options = {}) {
  const { status = null, mentorId = null, limit = 10, offset = 0 } = options;

  // Verify access: must be solution owner
  const { data: solution, error: solutionError } = await supabaseAdmin
    .from('solution_submissions')
    .select('user_id')
    .eq('id', solutionId)
    .single();

  if (solutionError || solution.user_id !== userId) {
    throw new Error('Unauthorized: Cannot view reviews for this solution');
  }

  let query = supabaseAdmin
    .from('mentor_reviews')
    .select('*, auth.users!mentor_id(id, email)', { count: 'exact' })
    .eq('solution_id', solutionId);

  if (status) {
    query = query.eq('status', status);
  }

  if (mentorId) {
    query = query.eq('mentor_id', mentorId);
  }

  const { data: reviews, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return {
    reviews: reviews || [],
    total: count || 0,
    hasMore: (offset + limit) < (count || 0),
  };
}

/**
 * Get detailed review with annotations
 */
export async function getReviewDetails(reviewId, userId) {
  // Fetch review
  const { data: review, error: reviewError } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  // Check authorization: must be requester or mentor
  if (review.requester_id !== userId && review.mentor_id !== userId) {
    throw new Error('Unauthorized: Cannot view this review');
  }

  // Fetch annotations
  const { data: annotations, error: annoError } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId)
    .order('line_number', { ascending: true });

  if (annoError) {
    throw new Error(`Failed to fetch annotations: ${annoError.message}`);
  }

  // Fetch mentor profile
  let mentorProfile = null;
  if (review.mentor_id) {
    const { data: profile } = await supabaseAdmin
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', review.mentor_id)
      .single();
    mentorProfile = profile;
  }

  // Fetch solution code
  const { data: solution } = await supabaseAdmin
    .from('solution_submissions')
    .select('code, language, problem_id')
    .eq('id', review.solution_id)
    .single();

  return {
    review,
    annotations: annotations || [],
    mentorProfile,
    solution,
  };
}

/**
 * Submit a review (mentor marking as complete)
 * Transitions from in_review -> submitted
 */
export async function submitReview(reviewId, mentorId, feedback = '', feedbackSummary = '') {
  // Fetch current review
  const { data: review, error: reviewError } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  // Verify mentor authorization
  if (review.mentor_id !== mentorId) {
    throw new Error('Unauthorized: Only assigned mentor can submit');
  }

  // Verify status transition
  if (review.status !== 'in_review') {
    throw new Error(`Cannot submit review in '${review.status}' status`);
  }

  // Update review to submitted
  const { data: updated, error } = await supabaseAdmin
    .from('mentor_reviews')
    .update({
      status: 'submitted',
      notes: feedback,
      feedback_summary: feedbackSummary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to submit review: ${error.message}`);
  }

  return updated;
}

/**
 * Update review status
 * Valid transitions:
 * - pending -> in_review (mentor accepting)
 * - submitted -> completed (requester reviewing)
 */
export async function updateReviewStatus(reviewId, userId, newStatus) {
  // Fetch current review
  const { data: review, error: reviewError } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (reviewError || !review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  // Validate state transition
  const validTransitions = {
    'pending': ['in_review'],
    'in_review': ['submitted'],
    'submitted': ['completed'],
    'completed': [],
  };

  if (!validTransitions[review.status]?.includes(newStatus)) {
    throw new Error(`Invalid transition: '${review.status}' -> '${newStatus}'`);
  }

  // Validate authorization
  if (newStatus === 'in_review' && review.mentor_id !== userId) {
    // Mentor assigning to self
    if (review.mentor_id !== null) {
      throw new Error('Review already assigned to another mentor');
    }
  } else if (newStatus === 'completed' && review.requester_id !== userId) {
    throw new Error('Unauthorized: Only requester can mark completed');
  }

  // Update status
  const updates = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // If transitioning to in_review, assign mentor
  if (newStatus === 'in_review' && !review.mentor_id) {
    updates.mentor_id = userId;
  }

  const { data: updated, error } = await supabaseAdmin
    .from('mentor_reviews')
    .update(updates)
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update review status: ${error.message}`);
  }

  return updated;
}

/**
 * Get reviews assigned to a mentor
 * For mentor dashboard
 */
export async function getMentorAssignedReviews(mentorId, options = {}) {
  const { status = null, limit = 20, offset = 0 } = options;

  let query = supabaseAdmin
    .from('mentor_reviews')
    .select('*, solution_submissions!solution_id(id, problem_id, created_at)', { count: 'exact' })
    .eq('mentor_id', mentorId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: reviews, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch assigned reviews: ${error.message}`);
  }

  return {
    reviews: reviews || [],
    total: count || 0,
    hasMore: (offset + limit) < (count || 0),
  };
}

/**
 * Get review history for a solution
 * All past reviews (completed or rejected)
 */
export async function getReviewHistory(solutionId, userId) {
  // Verify solution ownership
  const { data: solution } = await supabaseAdmin
    .from('solution_submissions')
    .select('user_id')
    .eq('id', solutionId)
    .single();

  if (solution?.user_id !== userId) {
    throw new Error('Unauthorized: Cannot view history for this solution');
  }

  const { data: reviews, error } = await supabaseAdmin
    .from('mentor_reviews')
    .select('id, status, rating, feedback_summary, created_at, mentor_profiles!mentor_id(bio)')
    .eq('solution_id', solutionId)
    .in('status', ['submitted', 'completed'])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch review history: ${error.message}`);
  }

  return reviews || [];
}

/**
 * Delete a review (soft delete via status = 'cancelled')
 * Only pending reviews can be deleted
 */
export async function cancelReview(reviewId, userId) {
  // Fetch review
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (!review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  // Only requester can cancel, only pending reviews
  if (review.requester_id !== userId) {
    throw new Error('Unauthorized: Only requester can cancel');
  }

  if (review.status !== 'pending') {
    throw new Error(`Cannot cancel review in '${review.status}' status`);
  }

  // Update status to indicate cancelled (use a new status value)
  const { data: updated, error } = await supabaseAdmin
    .from('mentor_reviews')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to cancel review: ${error.message}`);
  }

  return updated;
}
