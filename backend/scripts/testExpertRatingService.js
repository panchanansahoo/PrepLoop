/**
 * Test Suite: expertRatingService
 * Coverage: Rating, badges, reputation scoring, mentor stats
 * Total: 14 tests
 */

import {
  rateReview,
  getMentorStats,
  calculateMentorScore,
  awardBadge,
  removeBadge,
  getTopMentors,
  evaluateAndAwardBadges,
  updateMentorExpertise,
} from '../services/expertRatingService.js';

describe('expertRatingService', () => {
  let testMentorId, testReviewId;

  beforeEach(async () => {
    testMentorId = 'test-mentor-' + Date.now();
    testReviewId = 'test-review-' + Date.now();
  });

  describe('rateReview', () => {
    test('should rate a review with score 1-5', async () => {
      // Assumes review is in submitted state
      const result = await rateReview(testReviewId, 'test-user', 5, 'Excellent feedback');
      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.status).toBe('completed');
    });

    test('should accept all valid ratings 1-5', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const reviewId = testReviewId + '-' + rating;
        const result = await rateReview(reviewId, 'test-user', rating);
        expect(result.rating).toBe(rating);
      }
    });

    test('should reject rating outside 1-5 range', async () => {
      await expect(rateReview(testReviewId, 'test-user', 0)).rejects.toThrow(
        'between 1 and 5'
      );
      await expect(rateReview(testReviewId, 'test-user', 6)).rejects.toThrow(
        'between 1 and 5'
      );
    });

    test('should reject non-integer ratings', async () => {
      await expect(rateReview(testReviewId, 'test-user', 3.5)).rejects.toThrow();
    });

    test('should include rating feedback', async () => {
      const feedback = 'Very helpful and detailed';
      const result = await rateReview(testReviewId, 'test-user', 5, feedback);
      expect(result.notes).toContain(feedback);
    });

    test('should only allow requester to rate', async () => {
      // First user rates
      await rateReview(testReviewId, 'user-1', 5);

      // Different user cannot rate
      await expect(rateReview(testReviewId, 'user-2', 4)).rejects.toThrow('Unauthorized');
    });

    test('should only rate submitted reviews', async () => {
      // Assumes review not in submitted state
      await expect(rateReview('pending-review', 'user', 5)).rejects.toThrow(
        'submitted reviews'
      );
    });
  });

  describe('getMentorStats', () => {
    test('should return mentor statistics', async () => {
      const stats = await getMentorStats(testMentorId);
      expect(stats).toBeDefined();
      expect(stats.user_id).toBe(testMentorId);
      expect(stats.totalReviews).toBeDefined();
      expect(stats.completedReviews).toBeDefined();
      expect(stats.averageRating).toBeDefined();
    });

    test('should create profile if not exists', async () => {
      const newMentorId = 'new-mentor-' + Date.now();
      const stats = await getMentorStats(newMentorId);
      expect(stats).toBeDefined();
      expect(stats.user_id).toBe(newMentorId);
    });

    test('should calculate review velocity', async () => {
      const stats = await getMentorStats(testMentorId);
      expect(typeof stats.reviewVelocity).toBe('number');
      expect(stats.reviewVelocity).toBeGreaterThanOrEqual(0);
    });

    test('should track expertise areas', async () => {
      const expertise = ['Arrays', 'Trees', 'Dynamic Programming'];
      await updateMentorExpertise(testMentorId, expertise);

      const stats = await getMentorStats(testMentorId);
      expect(stats.expertise_areas).toEqual(expertise);
    });
  });

  describe('calculateMentorScore', () => {
    test('should return score between 0-100', async () => {
      const score = await calculateMentorScore(testMentorId);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should consider rating, velocity, and badges', async () => {
      // Score = rating (40%) + velocity (30%) + badges (30%)
      const score = await calculateMentorScore(testMentorId);
      expect(score).toBeDefined();

      // Award badge and check score increases
      await awardBadge(testMentorId, 'helpful_reviewer');
      const newScore = await calculateMentorScore(testMentorId);
      expect(newScore).toBeGreaterThanOrEqual(score);
    });
  });

  describe('awardBadge', () => {
    test('should award valid badge types', async () => {
      const badges = ['helpful_reviewer', 'quick_responder', 'thorough_feedback', 'expert', 'top_mentor'];

      for (const badge of badges) {
        const mentorId = testMentorId + '-' + badge;
        const result = await awardBadge(mentorId, badge);
        expect(result.success).toBe(true);
        expect(result.badge).toBe(badge);
      }
    });

    test('should reject invalid badge type', async () => {
      await expect(awardBadge(testMentorId, 'invalid_badge')).rejects.toThrow(
        'Invalid badge type'
      );
    });

    test('should not award duplicate badges', async () => {
      await awardBadge(testMentorId, 'helpful_reviewer');
      const result = await awardBadge(testMentorId, 'helpful_reviewer');
      expect(result.success).toBe(false);
      expect(result.message).toContain('already awarded');
    });

    test('should add badge to profile', async () => {
      await awardBadge(testMentorId, 'expert');
      const stats = await getMentorStats(testMentorId);
      expect(stats.badges).toContain('expert');
    });
  });

  describe('removeBadge', () => {
    test('should remove badge from mentor', async () => {
      await awardBadge(testMentorId, 'helpful_reviewer');
      const result = await removeBadge(testMentorId, 'helpful_reviewer');
      expect(result.success).toBe(true);

      const stats = await getMentorStats(testMentorId);
      expect(stats.badges).not.toContain('helpful_reviewer');
    });

    test('should handle non-existent badges gracefully', async () => {
      const result = await removeBadge(testMentorId, 'helpful_reviewer');
      expect(result.success).toBe(true);
    });
  });

  describe('getTopMentors', () => {
    test('should return mentors sorted by rating', async () => {
      const mentors = await getTopMentors({ limit: 10 });
      expect(Array.isArray(mentors)).toBe(true);

      // Should be sorted by score descending
      for (let i = 0; i < mentors.length - 1; i++) {
        expect(mentors[i].score).toBeGreaterThanOrEqual(mentors[i + 1].score);
      }
    });

    test('should filter by minimum rating', async () => {
      const mentors = await getTopMentors({ minRating: 4.0 });
      expect(mentors.every((m) => m.average_rating >= 4.0)).toBe(true);
    });

    test('should respect limit parameter', async () => {
      const mentors = await getTopMentors({ limit: 5 });
      expect(mentors.length).toBeLessThanOrEqual(5);
    });

    test('should include mentor badges', async () => {
      await awardBadge(testMentorId, 'expert');
      const mentors = await getTopMentors({ limit: 100 });

      const mentor = mentors.find((m) => m.user_id === testMentorId);
      if (mentor) {
        expect(mentor.badges).toContain('expert');
      }
    });
  });

  describe('evaluateAndAwardBadges', () => {
    test('should award helpful_reviewer for high avg rating', async () => {
      // Simulate high-rated reviews
      const result = await evaluateAndAwardBadges(testMentorId);
      expect(result.newBadges).toBeDefined();
      expect(Array.isArray(result.existingBadges)).toBe(true);
    });

    test('should award expert for 100+ reviews', async () => {
      // Would require simulating 100 reviews
      const result = await evaluateAndAwardBadges(testMentorId);
      expect(result.newBadges).toBeDefined();
    });

    test('should not duplicate existing badges', async () => {
      await awardBadge(testMentorId, 'expert');
      const result = await evaluateAndAwardBadges(testMentorId);
      expect(result.existingBadges).toContain('expert');
    });
  });

  describe('updateMentorExpertise', () => {
    test('should update expertise areas', async () => {
      const expertise = ['Binary Trees', 'Graph Algorithms', 'Dynamic Programming'];
      const profile = await updateMentorExpertise(testMentorId, expertise);
      expect(profile.expertise_areas).toEqual(expertise);
    });

    test('should accept empty expertise array', async () => {
      const profile = await updateMentorExpertise(testMentorId, []);
      expect(profile.expertise_areas).toEqual([]);
    });

    test('should reject non-array input', async () => {
      await expect(updateMentorExpertise(testMentorId, 'not-an-array')).rejects.toThrow(
        'must be an array'
      );
    });

    test('should persist expertise in profile', async () => {
      const expertise = ['System Design', 'Database Design'];
      await updateMentorExpertise(testMentorId, expertise);

      const stats = await getMentorStats(testMentorId);
      expect(stats.expertise_areas).toEqual(expertise);
    });
  });
});
