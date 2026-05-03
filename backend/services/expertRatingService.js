/**
 * Expert Rating Service
 * Manages mentor reputation, badges, and scoring
 * 
 * Badges: helpful_reviewer, quick_responder, thorough_feedback, expert, top_mentor
 * Score = (avg_rating * 0.4) + (review_velocity * 0.3) + (badge_count * 0.3)
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Rate a review (by the requester/solution owner)
 * Rating: 1-5
 */
export async function rateReview(reviewId, userId, rating, ratingFeedback = '') {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  // Fetch review
  const { data: review } = await supabaseAdmin
    .from('mentor_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (!review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  // Verify authorization: only requester can rate
  if (review.requester_id !== userId) {
    throw new Error('Unauthorized: Only the requester can rate this review');
  }

  // Can only rate submitted reviews
  if (review.status !== 'submitted') {
    throw new Error('Can only rate submitted reviews');
  }

  // Update review rating
  const { data: updated, error } = await supabaseAdmin
    .from('mentor_reviews')
    .update({
      rating,
      notes: ratingFeedback || review.notes,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to rate review: ${error.message}`);
  }

  // Update mentor profile stats
  if (review.mentor_id) {
    await updateMentorStats(review.mentor_id);
  }

  return updated;
}

/**
 * Get mentor statistics
 */
export async function getMentorStats(mentorId) {
  // Fetch mentor profile
  const { data: profile } = await supabaseAdmin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', mentorId)
    .single();

  if (!profile) {
    // Create profile if doesn't exist
    return await createMentorProfile(mentorId);
  }

  // Calculate additional metrics
  const { data: reviews } = await supabaseAdmin
    .from('mentor_reviews')
    .select('status, rating, created_at')
    .eq('mentor_id', mentorId);

  const completedReviews = (reviews || []).filter((r) => r.status === 'completed');
  const averageRating =
    completedReviews.length > 0
      ? completedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / completedReviews.length
      : 0;

  // Calculate review velocity (reviews per week)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReviews = (reviews || []).filter((r) => new Date(r.created_at) > thirtyDaysAgo);
  const reviewVelocity = (recentReviews.length / 4.3).toFixed(2); // ~weeks in 30 days

  return {
    ...profile,
    totalReviews: reviews?.length || 0,
    completedReviews: completedReviews.length,
    averageRating: parseFloat(averageRating.toFixed(2)),
    reviewVelocity: parseFloat(reviewVelocity),
  };
}

/**
 * Calculate overall mentor score (reputation)
 * Score = (avg_rating * 0.4) + (review_velocity * 0.3) + (badge_count * 0.3)
 */
export async function calculateMentorScore(mentorId) {
  const stats = await getMentorStats(mentorId);

  // Normalize values to 0-100 scale
  const ratingScore = (stats.averageRating / 5) * 100;
  const velocityScore = Math.min(stats.reviewVelocity * 10, 100); // Cap at 10 reviews/week = 100 points
  const badgeScore = (stats.badges?.length || 0) * 20; // Each badge worth 20 points, max 100

  const totalScore = ratingScore * 0.4 + velocityScore * 0.3 + badgeScore * 0.3;

  return Math.min(Math.round(totalScore), 100);
}

/**
 * Award a badge to a mentor
 * Badge types: helpful_reviewer, quick_responder, thorough_feedback, expert, top_mentor
 */
export async function awardBadge(mentorId, badgeType) {
  const validBadges = ['helpful_reviewer', 'quick_responder', 'thorough_feedback', 'expert', 'top_mentor'];

  if (!validBadges.includes(badgeType)) {
    throw new Error(`Invalid badge type: ${badgeType}`);
  }

  // Get mentor profile
  let { data: profile } = await supabaseAdmin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', mentorId)
    .single();

  if (!profile) {
    profile = await createMentorProfile(mentorId);
  }

  // Check if badge already exists
  const badges = profile.badges || [];
  if (badges.includes(badgeType)) {
    return { success: false, message: 'Badge already awarded' };
  }

  // Add badge
  badges.push(badgeType);

  const { data: updated, error } = await supabaseAdmin
    .from('mentor_profiles')
    .update({
      badges,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', mentorId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to award badge: ${error.message}`);
  }

  return { success: true, badge: badgeType, updated };
}

/**
 * Remove a badge from a mentor
 */
export async function removeBadge(mentorId, badgeType) {
  const { data: profile } = await supabaseAdmin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', mentorId)
    .single();

  if (!profile) {
    throw new Error(`Mentor profile not found: ${mentorId}`);
  }

  const badges = (profile.badges || []).filter((b) => b !== badgeType);

  const { data: updated, error } = await supabaseAdmin
    .from('mentor_profiles')
    .update({
      badges,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', mentorId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to remove badge: ${error.message}`);
  }

  return { success: true, updated };
}

/**
 * Get top mentors by rating
 */
export async function getTopMentors(options = {}) {
  const { limit = 10, minRating = 3.5 } = options;

  const { data: profiles, error } = await supabaseAdmin
    .from('mentor_profiles')
    .select('user_id, average_rating, review_count, badges')
    .gte('average_rating', minRating)
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch top mentors: ${error.message}`);
  }

  // Calculate scores for each
  const mentors = await Promise.all(
    (profiles || []).map(async (profile) => {
      const score = await calculateMentorScore(profile.user_id);
      return { ...profile, score };
    })
  );

  return mentors.sort((a, b) => b.score - a.score);
}

/**
 * Evaluate and auto-award badges based on metrics
 */
export async function evaluateAndAwardBadges(mentorId) {
  const stats = await getMentorStats(mentorId);
  const { data: profile } = await supabaseAdmin
    .from('mentor_profiles')
    .select('*')
    .eq('user_id', mentorId)
    .single();

  const existingBadges = profile?.badges || [];
  const newBadges = [];

  // Helpful Reviewer: avg rating > 4.5
  if (stats.averageRating > 4.5 && !existingBadges.includes('helpful_reviewer')) {
    await awardBadge(mentorId, 'helpful_reviewer');
    newBadges.push('helpful_reviewer');
  }

  // Quick Responder: avg response time < 24h
  // (This would require tracking response times; simplified for MVP)
  if (stats.completedReviews > 10 && !existingBadges.includes('quick_responder')) {
    // Assume fast if completed many reviews
    const { data: reviews } = await supabaseAdmin
      .from('mentor_reviews')
      .select('created_at, updated_at')
      .eq('mentor_id', mentorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviews && reviews.length > 0) {
      const avgHours = reviews
        .map((r) => (new Date(r.updated_at) - new Date(r.created_at)) / (1000 * 60 * 60))
        .reduce((a, b) => a + b, 0) / reviews.length;

      if (avgHours < 24 && !existingBadges.includes('quick_responder')) {
        await awardBadge(mentorId, 'quick_responder');
        newBadges.push('quick_responder');
      }
    }
  }

  // Thorough Feedback: avg 5+ annotations per review
  // (Would require analysis of annotations per review)
  if (stats.completedReviews > 5 && !existingBadges.includes('thorough_feedback')) {
    // Simplified: assume thorough if high ratings and many reviews
    if (stats.averageRating >= 4.0) {
      await awardBadge(mentorId, 'thorough_feedback');
      newBadges.push('thorough_feedback');
    }
  }

  // Expert: 100+ reviews
  if (stats.totalReviews >= 100 && !existingBadges.includes('expert')) {
    await awardBadge(mentorId, 'expert');
    newBadges.push('expert');
  }

  return { newBadges, existingBadges };
}

/**
 * Update mentor profile stats
 * Called after each review rating
 */
async function updateMentorStats(mentorId) {
  const { data: reviews } = await supabaseAdmin
    .from('mentor_reviews')
    .select('rating')
    .eq('mentor_id', mentorId)
    .eq('status', 'completed');

  const completedReviews = reviews || [];
  const avgRating =
    completedReviews.length > 0
      ? (completedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / completedReviews.length).toFixed(2)
      : 0;

  await supabaseAdmin
    .from('mentor_profiles')
    .update({
      average_rating: parseFloat(avgRating),
      review_count: completedReviews.length,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', mentorId);

  // Evaluate badges
  await evaluateAndAwardBadges(mentorId);
}

/**
 * Create a mentor profile
 */
async function createMentorProfile(mentorId) {
  const { data: profile, error } = await supabaseAdmin
    .from('mentor_profiles')
    .insert({
      user_id: mentorId,
      expertise_areas: [],
      badges: [],
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create mentor profile: ${error.message}`);
  }

  return profile;
}

/**
 * Update mentor expertise areas
 */
export async function updateMentorExpertise(mentorId, expertiseAreas) {
  if (!Array.isArray(expertiseAreas)) {
    throw new Error('Expertise areas must be an array');
  }

  const { data: profile, error } = await supabaseAdmin
    .from('mentor_profiles')
    .update({
      expertise_areas: expertiseAreas,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', mentorId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update expertise: ${error.message}`);
  }

  return profile;
}
