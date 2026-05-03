/**
 * Test Suite: mentorReviewService
 * Coverage: Core review lifecycle, authorization, state transitions
 * Total: 20 tests
 */

import {
  requestReview,
  getReviewsForSolution,
  getReviewDetails,
  submitReview,
  updateReviewStatus,
  getMentorAssignedReviews,
  getReviewHistory,
  cancelReview,
} from '../services/mentorReviewService.js';

describe('mentorReviewService', () => {
  let testSolutionId, testUserId, testMentorId, testReviewId;

  beforeEach(async () => {
    // Setup: Create test data
    testUserId = 'test-user-' + Date.now();
    testMentorId = 'test-mentor-' + Date.now();
    testSolutionId = 'test-solution-' + Date.now();

    // Create test solution (mocked)
    // In real scenario, would use supabaseAdmin
  });

  describe('requestReview', () => {
    test('should create a new review request in pending status', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      expect(review).toBeDefined();
      expect(review.status).toBe('pending');
      expect(review.solution_id).toBe(testSolutionId);
      expect(review.requester_id).toBe(testUserId);
      expect(review.mentor_id).toBeNull();

      testReviewId = review.id;
    });

    test('should set deadline when provided', async () => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);

      const review = await requestReview(testSolutionId, testUserId, { deadline });
      expect(review.deadline).toBeDefined();
    });

    test('should reject if user is not solution owner', async () => {
      const otherUserId = 'other-user-' + Date.now();
      await expect(requestReview(testSolutionId, otherUserId)).rejects.toThrow(
        'Unauthorized: Can only request reviews for own solutions'
      );
    });

    test('should reject if review already in progress', async () => {
      // Create first review
      await requestReview(testSolutionId, testUserId);

      // Try to create another
      await expect(requestReview(testSolutionId, testUserId)).rejects.toThrow(
        'A review is already in progress'
      );
    });

    test('should reject if solution does not exist', async () => {
      await expect(requestReview('nonexistent-id', testUserId)).rejects.toThrow(
        'Solution not found'
      );
    });

    test('should include notes when provided', async () => {
      const notes = 'Please focus on edge cases';
      const review = await requestReview(testSolutionId, testUserId, { notes });
      expect(review.notes).toBe(notes);
    });
  });

  describe('getReviewsForSolution', () => {
    test('should return all reviews for a solution', async () => {
      // Create two reviews
      const review1 = await requestReview(testSolutionId, testUserId);
      testReviewId = review1.id;

      const result = await getReviewsForSolution(testSolutionId, testUserId);
      expect(result.reviews).toBeDefined();
      expect(result.reviews.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    test('should filter by status', async () => {
      const result = await getReviewsForSolution(testSolutionId, testUserId, {
        status: 'pending',
      });
      expect(result.reviews.every((r) => r.status === 'pending')).toBe(true);
    });

    test('should return pagination info', async () => {
      const result = await getReviewsForSolution(testSolutionId, testUserId, {
        limit: 10,
        offset: 0,
      });
      expect(result.hasMore).toBeDefined();
      expect(typeof result.total).toBe('number');
    });

    test('should reject unauthorized access', async () => {
      const otherUserId = 'other-user-' + Date.now();
      await expect(getReviewsForSolution(testSolutionId, otherUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('getReviewDetails', () => {
    test('should return full review with annotations and mentor profile', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      const details = await getReviewDetails(testReviewId, testUserId);
      expect(details.review).toBeDefined();
      expect(details.annotations).toBeDefined();
      expect(Array.isArray(details.annotations)).toBe(true);
      expect(details.solution).toBeDefined();
    });

    test('should allow mentor to view review', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      // Mentor accepts review
      await updateReviewStatus(testReviewId, testMentorId, 'in_review');

      // Mentor should be able to view
      const details = await getReviewDetails(testReviewId, testMentorId);
      expect(details.review).toBeDefined();
    });

    test('should reject unauthorized access', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const otherUserId = 'other-' + Date.now();

      await expect(getReviewDetails(review.id, otherUserId)).rejects.toThrow('Unauthorized');
    });

    test('should return null mentor profile for unassigned reviews', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const details = await getReviewDetails(review.id, testUserId);
      expect(details.mentorProfile).toBeNull();
    });
  });

  describe('updateReviewStatus', () => {
    test('should allow mentor to transition pending -> in_review', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      const updated = await updateReviewStatus(testReviewId, testMentorId, 'in_review');
      expect(updated.status).toBe('in_review');
      expect(updated.mentor_id).toBe(testMentorId);
    });

    test('should allow mentor to transition in_review -> submitted', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      await updateReviewStatus(testReviewId, testMentorId, 'in_review');
      const updated = await updateReviewStatus(testReviewId, testMentorId, 'submitted');
      expect(updated.status).toBe('submitted');
    });

    test('should allow requester to transition submitted -> completed', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      await updateReviewStatus(testReviewId, testMentorId, 'in_review');
      await updateReviewStatus(testReviewId, testMentorId, 'submitted');

      const updated = await updateReviewStatus(testReviewId, testUserId, 'completed');
      expect(updated.status).toBe('completed');
    });

    test('should reject invalid state transitions', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      // Try pending -> submitted (skip in_review)
      await expect(updateReviewStatus(testReviewId, testMentorId, 'submitted')).rejects.toThrow(
        'Invalid transition'
      );
    });

    test('should reject unauthorized status updates', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const otherMentorId = 'other-mentor-' + Date.now();

      // Try to assign to different mentor
      await updateReviewStatus(review.id, testMentorId, 'in_review');
      await expect(updateReviewStatus(review.id, otherMentorId, 'submitted')).rejects.toThrow();
    });

    test('should prevent reassing already assigned review', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const mentor2 = 'mentor-2-' + Date.now();

      await updateReviewStatus(review.id, testMentorId, 'in_review');

      // Try to reassign
      await expect(updateReviewStatus(review.id, mentor2, 'in_review')).rejects.toThrow(
        'already assigned'
      );
    });
  });

  describe('submitReview', () => {
    test('should transition from in_review to submitted', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      await updateReviewStatus(testReviewId, testMentorId, 'in_review');

      const submitted = await submitReview(testReviewId, testMentorId, 'Great work!', 'Very clean code');
      expect(submitted.status).toBe('submitted');
      expect(submitted.notes).toBe('Great work!');
      expect(submitted.feedback_summary).toBe('Very clean code');
    });

    test('should reject if not assigned mentor', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const otherMentorId = 'other-' + Date.now();

      await expect(submitReview(review.id, otherMentorId, '', '')).rejects.toThrow('Unauthorized');
    });

    test('should reject if review not in in_review status', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      // Try to submit without accepting
      await expect(submitReview(testReviewId, testMentorId, '', '')).rejects.toThrow(
        `Cannot submit review in 'pending' status`
      );
    });
  });

  describe('getMentorAssignedReviews', () => {
    test('should return reviews assigned to mentor', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      await updateReviewStatus(testReviewId, testMentorId, 'in_review');

      const result = await getMentorAssignedReviews(testMentorId);
      expect(result.reviews).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    test('should filter by status', async () => {
      const result = await getMentorAssignedReviews(testMentorId, {
        status: 'in_review',
      });
      expect(result.reviews.every((r) => r.status === 'in_review')).toBe(true);
    });

    test('should return empty list for mentor with no reviews', async () => {
      const newMentorId = 'new-mentor-' + Date.now();
      const result = await getMentorAssignedReviews(newMentorId);
      expect(result.reviews.length).toBe(0);
    });
  });

  describe('getReviewHistory', () => {
    test('should return completed reviews for a solution', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      testReviewId = review.id;

      await updateReviewStatus(testReviewId, testMentorId, 'in_review');
      await submitReview(testReviewId, testMentorId, '', '');

      const history = await getReviewHistory(testSolutionId, testUserId);
      expect(Array.isArray(history)).toBe(true);
    });

    test('should reject unauthorized access', async () => {
      const otherUserId = 'other-' + Date.now();
      await expect(getReviewHistory(testSolutionId, otherUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('cancelReview', () => {
    test('should cancel pending review', async () => {
      const review = await requestReview(testSolutionId, testUserId);

      const cancelled = await cancelReview(review.id, testUserId);
      expect(cancelled.status).toBe('cancelled');
    });

    test('should reject if not requester', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      const otherUserId = 'other-' + Date.now();

      await expect(cancelReview(review.id, otherUserId)).rejects.toThrow(
        'Only requester can cancel'
      );
    });

    test('should reject if review not pending', async () => {
      const review = await requestReview(testSolutionId, testUserId);
      await updateReviewStatus(review.id, testMentorId, 'in_review');

      await expect(cancelReview(review.id, testUserId)).rejects.toThrow(
        `Cannot cancel review in 'in_review' status`
      );
    });
  });
});
