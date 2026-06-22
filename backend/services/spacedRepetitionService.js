/**
 * Spaced Repetition System (SRS)
 * Implements SM-2 algorithm for optimal problem review scheduling
 */

class SpacedRepetitionSystem {
  constructor() {
    // SM-2 algorithm constants
    this.MIN_EASINESS = 1.3;
    this.DEFAULT_EASINESS = 2.5;
    this.EASINESS_MODIFIER = 0.1;
  }

  /**
   * Calculate next review date based on performance
   * @param {Object} card - Problem card with review history
   * @param {number} quality - Performance rating (0-5)
   * @returns {Object} Updated card with new review date
   */
  calculateNextReview(card, quality) {
    const {
      easinessFactor = this.DEFAULT_EASINESS,
      repetitions = 0,
      interval = 0,
    } = card;

    let newRepetitions;
    let newInterval;

    // Update easiness factor
    const newEasiness = Math.max(
      this.MIN_EASINESS,
      easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Calculate new interval
    if (quality < 3) {
      // Failed - reset
      newRepetitions = 0;
      newInterval = 1;
    } else {
      // Passed
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEasiness);
      }
      newRepetitions = repetitions + 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      ...card,
      easinessFactor: newEasiness,
      repetitions: newRepetitions,
      interval: newInterval,
      nextReview: nextReviewDate.toISOString(),
      lastReview: new Date().toISOString(),
      quality,
    };
  }

  /**
   * Get problems due for review
   * @param {Array} cards - All problem cards
   * @returns {Array} Problems due for review, sorted by priority
   */
  getDueProblems(cards) {
    const now = new Date();
    
    const dueCards = cards.filter((card) => {
      if (!card.nextReview) return true; // Never reviewed
      return new Date(card.nextReview) <= now;
    });

    // Sort by priority: overdue first, then by difficulty
    return dueCards.sort((a, b) => {
      const aOverdue = this.getDaysOverdue(a.nextReview);
      const bOverdue = this.getDaysOverdue(b.nextReview);
      
      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue; // More overdue first
      }

      // Then by easiness (harder problems first)
      return (a.easinessFactor || this.DEFAULT_EASINESS) - 
             (b.easinessFactor || this.DEFAULT_EASINESS);
    });
  }

  /**
   * Get recommended daily problems
   * @param {Array} cards - All problem cards
   * @param {number} targetCount - Target number of problems per day
   * @returns {Array} Recommended problems for today
   */
  getDailyRecommendations(cards, targetCount = 5) {
    const dueProblems = this.getDueProblems(cards);
    
    // Mix of due problems and new problems
    const dueCount = Math.min(dueProblems.length, Math.ceil(targetCount * 0.7));
    const newCount = targetCount - dueCount;

    const recommendations = dueProblems.slice(0, dueCount);

    // Add new problems if needed
    if (newCount > 0) {
      const newProblems = cards
        .filter((card) => !card.lastReview)
        .slice(0, newCount);
      recommendations.push(...newProblems);
    }

    return recommendations;
  }

  /**
   * Calculate retention rate
   * @param {Array} cards - Problem cards with review history
   * @returns {Object} Retention statistics
   */
  calculateRetention(cards) {
    const reviewedCards = cards.filter((card) => card.lastReview);
    
    if (reviewedCards.length === 0) {
      return { rate: 0, total: 0, mastered: 0 };
    }

    const mastered = reviewedCards.filter(
      (card) => card.repetitions >= 3 && card.easinessFactor >= 2.5
    ).length;

    return {
      rate: ((mastered / reviewedCards.length) * 100).toFixed(2),
      total: reviewedCards.length,
      mastered,
      inProgress: reviewedCards.length - mastered,
    };
  }

  /**
   * Get learning statistics
   * @param {Array} cards - All problem cards
   * @returns {Object} Comprehensive learning stats
   */
  getStatistics(cards) {
    const _now = new Date();
    const dueToday = this.getDueProblems(cards).length;
    const retention = this.calculateRetention(cards);

    const byDifficulty = cards.reduce((acc, card) => {
      const difficulty = this.getDifficultyLevel(card.easinessFactor);
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    const reviewedLast7Days = cards.filter((card) => {
      if (!card.lastReview) return false;
      const daysSince = this.getDaysSince(card.lastReview);
      return daysSince <= 7;
    }).length;

    return {
      total: cards.length,
      dueToday,
      retention,
      byDifficulty,
      reviewedLast7Days,
      averageEasiness: this.calculateAverageEasiness(cards),
    };
  }

  /**
   * Predict future workload
   * @param {Array} cards - All problem cards
   * @param {number} days - Number of days to predict
   * @returns {Array} Predicted daily workload
   */
  predictWorkload(cards, days = 30) {
    const predictions = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);

      const dueCount = cards.filter((card) => {
        if (!card.nextReview) return i === 0; // New cards on day 0
        const reviewDate = new Date(card.nextReview);
        return reviewDate.toDateString() === targetDate.toDateString();
      }).length;

      predictions.push({
        date: targetDate.toISOString().split('T')[0],
        count: dueCount,
      });
    }

    return predictions;
  }

  // Helper methods
  getDaysOverdue(nextReview) {
    if (!nextReview) return 0;
    const now = new Date();
    const review = new Date(nextReview);
    const diff = now - review;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  getDaysSince(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getDifficultyLevel(easinessFactor) {
    if (easinessFactor >= 2.5) return 'easy';
    if (easinessFactor >= 2.0) return 'medium';
    return 'hard';
  }

  calculateAverageEasiness(cards) {
    const reviewed = cards.filter((card) => card.easinessFactor);
    if (reviewed.length === 0) return this.DEFAULT_EASINESS;

    const sum = reviewed.reduce((acc, card) => acc + card.easinessFactor, 0);
    return (sum / reviewed.length).toFixed(2);
  }
}

export default new SpacedRepetitionSystem();
