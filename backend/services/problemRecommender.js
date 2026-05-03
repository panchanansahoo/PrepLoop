/**
 * problemRecommender.js
 * 
 * Intelligent problem recommendation engine for adaptive learning.
 * Recommends problems based on:
 * - User weakness areas (low performance patterns)
 * - Problem difficulty relative to skill level
 * - Learning progression (difficulty progression strategy)
 * - Company focus and interview prep goals
 * - Recently solved problems (avoid repetition)
 * 
 * Implements multiple recommendation strategies:
 * - Weakness-based (focus on gaps)
 * - Progression-based (difficulty scaling)
 * - Diversity-based (pattern variety)
 * - Goal-aligned (company/topic focus)
 */

class ProblemRecommender {
  constructor(options = {}) {
    this.options = options;
    this.minConfidenceScore = options.minConfidenceScore || 0.6; // 60% accuracy to consider mastered
  }

  /**
   * Get recommended problems for user
   * @param {Object} userProfile - User skill profile
   * @param {Array} allProblems - Available problems
   * @param {Object} userStats - User submission history and stats
   * @param {Object} options - {limit: number, strategy: string, difficulty?: string}
   * @returns {Array} Recommended problems with scores
   */
  getRecommendations(userProfile, allProblems, userStats, options = {}) {
    const { limit = 5, strategy = 'balanced', difficulty = null } = options;

    // Filter problems based on user preferences
    let candidates = this._filterCandidates(allProblems, userStats, difficulty);

    // Score problems based on strategy
    const scored = candidates.map(problem => ({
      problem,
      score: this._scoreProblems(problem, userProfile, userStats, strategy),
    }));

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ problem, score }) => ({
        ...problem,
        recommendationScore: score,
        reason: this._getRecommendationReason(problem, userProfile, userStats),
      }));
  }

  /**
   * Filter out problems user has already mastered or solved recently
   * @private
   */
  _filterCandidates(allProblems, userStats, difficultyFilter) {
    return allProblems.filter(problem => {
      // Exclude solved/mastered problems
      if (userStats.solvedProblems?.includes(problem.id)) {
        return false;
      }

      // Exclude attempted recently (within 7 days)
      const lastAttempt = userStats.attemptHistory?.[problem.id]?.lastAttemptTime;
      if (lastAttempt) {
        const daysSinceAttempt = (Date.now() - lastAttempt) / (1000 * 60 * 60 * 24);
        if (daysSinceAttempt < 7) {
          return false; // Too recent
        }
      }

      // Filter by difficulty if specified
      if (difficultyFilter && problem.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    });
  }

  /**
   * Score a single problem based on strategy
   * @private
   */
  _scoreProblems(problem, userProfile, userStats, strategy) {
    const scores = {
      weakness: this._scoreWeaknessBased(problem, userProfile, userStats),
      progression: this._scoreProgressionBased(problem, userProfile, userStats),
      diversity: this._scoreDiversityBased(problem, userProfile, userStats),
      balanced: 0, // Computed as weighted average
    };

    if (strategy === 'balanced') {
      scores.balanced =
        scores.weakness * 0.4 + scores.progression * 0.3 + scores.diversity * 0.3;
      return scores.balanced;
    }

    return scores[strategy] || scores.balanced;
  }

  /**
   * Score based on weakness areas (low performance patterns)
   * @private
   */
  _scoreWeaknessBased(problem, userProfile, userStats) {
    const weaknessScore = userProfile.weaknessAreas || {};
    const topic = problem.topic || 'general';

    // Higher score for topics with low performance
    const topicWeakness = weaknessScore[topic] || 0; // 0-1 scale
    const baseScore = topicWeakness * 1.0; // Weighted up to 1.0

    // Bonus for problems matching user's weak topics
    const relevance = problem.keywords?.some(k => k in weaknessScore) ? 0.2 : 0;

    return Math.min(1.0, baseScore + relevance);
  }

  /**
   * Score based on difficulty progression
   * @private
   */
  _scoreProgressionBased(problem, userProfile, userStats) {
    const skillLevel = userProfile.skillLevel || 'beginner'; // beginner, intermediate, advanced
    const solveRate = userStats.solveRate || 0; // 0-1
    const difficultyMap = { easy: 1, medium: 2, hard: 3, expert: 4 };
    const problemDifficulty = difficultyMap[problem.difficulty] || 2;

    // Recommend next difficulty level based on solve rate
    let targetDifficulty;
    if (solveRate < 0.5) {
      targetDifficulty = 1; // Keep it easy
    } else if (solveRate < 0.7) {
      targetDifficulty = 2; // Move to medium
    } else if (solveRate < 0.85) {
      targetDifficulty = 3; // Move to hard
    } else {
      targetDifficulty = 4; // Expert
    }

    // Score based on distance from target
    const diffDelta = Math.abs(problemDifficulty - targetDifficulty);
    return Math.max(0, 1.0 - diffDelta * 0.2);
  }

  /**
   * Score based on pattern/algorithm diversity
   * @private
   */
  _scoreDiversityBased(problem, userProfile, userStats) {
    const recentTopics = userStats.recentTopics || [];
    const patternDiversity = userStats.solvedPatterns || {};

    // Boost score if user hasn't solved many of this pattern
    const patternTopic = problem.topic || 'general';
    const solvedCount = patternDiversity[patternTopic] || 0;

    // Diminishing returns: more solved = lower score
    const diversityScore = 1.0 / (1.0 + solvedCount * 0.5);

    // Penalty if too similar to recently solved
    const similarToRecent = recentTopics.includes(patternTopic) ? 0.3 : 0;

    return diversityScore - similarToRecent;
  }

  /**
   * Generate human-readable reason for recommendation
   * @private
   */
  _getRecommendationReason(problem, userProfile, userStats) {
    const weaknessAreas = userProfile.weaknessAreas || {};
    const topic = problem.topic || 'general';

    if (weaknessAreas[topic] > 0.6) {
      return `Recommended to strengthen your ${topic} skills`;
    }

    const solveRate = userStats.solveRate || 0;
    if (solveRate > 0.8) {
      return `Time to tackle a harder ${topic} problem`;
    }

    const solvedCount = userStats.solvedPatterns?.[topic] || 0;
    if (solvedCount < 3) {
      return `Build foundational ${topic} pattern skills`;
    }

    return `Expand your problem-solving variety`;
  }

  /**
   * Get problems for company-specific prep
   * @param {string} companyName - Target company
   * @param {Array} allProblems - All available problems
   * @param {Object} userStats - User stats
   * @param {number} limit - Number of recommendations
   * @returns {Array} Problems most asked by this company
   */
  getCompanySpecificProblems(companyName, allProblems, userStats, limit = 10) {
    const companyData = {
      google: { topics: ['dynamic-programming', 'trees', 'graphs'], difficulty: ['medium', 'hard'] },
      amazon: { topics: ['arrays', 'strings', 'trees'], difficulty: ['easy', 'medium', 'hard'] },
      meta: { topics: ['graphs', 'arrays', 'strings'], difficulty: ['medium', 'hard'] },
      microsoft: { topics: ['dynamic-programming', 'trees', 'graphs'], difficulty: ['medium', 'hard'] },
      apple: { topics: ['trees', 'graphs', 'arrays'], difficulty: ['medium', 'hard'] },
      default: { topics: [], difficulty: ['easy', 'medium', 'hard'] },
    };

    const company = companyData[companyName.toLowerCase()] || companyData.default;

    // Filter by company's typical topics and difficulty
    const filtered = allProblems.filter(
      p =>
        !userStats.solvedProblems?.includes(p.id) &&
        company.topics.includes(p.topic) &&
        company.difficulty.includes(p.difficulty)
    );

    return filtered.slice(0, limit);
  }

  /**
   * Get learning path: sequence of problems for skill progression
   * @param {Array} allProblems - All problems
   * @param {Object} userStats - User stats
   * @param {string} topic - Topic to learn
   * @param {number} pathLength - Number of problems in path
   * @returns {Array} Ordered problem sequence for learning
   */
  getLearningPath(allProblems, userStats, topic, pathLength = 10) {
    // Filter problems for topic, exclude solved
    const topicProblems = allProblems.filter(
      p =>
        p.topic === topic &&
        !userStats.solvedProblems?.includes(p.id)
    );

    // Sort by difficulty (easy first)
    const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
    topicProblems.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

    // Return first N problems as learning path
    return topicProblems.slice(0, pathLength).map((problem, idx) => ({
      ...problem,
      sequenceNumber: idx + 1,
      expectedDuration: { easy: 15, medium: 30, hard: 60, expert: 90 }[problem.difficulty],
    }));
  }

  /**
   * Analyze user performance and detect weakness areas
   * @param {Object} userStats - User statistics from submissions
   * @returns {Object} Weakness score per topic (0-1)
   */
  analyzeWeaknesses(userStats) {
    const weaknesses = {};
    const topicStats = userStats.topicStats || {};

    for (const [topic, stats] of Object.entries(topicStats)) {
      const accuracy = stats.successfulSubmissions / Math.max(stats.totalSubmissions, 1);

      // Weakness score: inverse of accuracy, with minimum 0
      const weakness = Math.max(0, 1.0 - accuracy);

      // Only consider significant weakness (>20% failure rate)
      if (weakness > 0.2) {
        weaknesses[topic] = weakness;
      }
    }

    return weaknesses;
  }

  /**
   * Calculate overall skill level
   * @param {Object} userStats - User statistics
   * @returns {string} Skill level: beginner, intermediate, advanced, expert
   */
  calculateSkillLevel(userStats) {
    const solveRate = userStats.solveRate || 0;
    const problemsSolved = userStats.totalSolved || 0;

    if (problemsSolved < 10) return 'beginner';
    if (solveRate < 0.5) return 'beginner';
    if (solveRate < 0.7) return 'intermediate';
    if (solveRate < 0.85) return 'advanced';
    return 'expert';
  }

  /**
   * Get problem suggestions after submission
   * @param {Object} submissionResult - Result of code submission
   * @param {Array} allProblems - All problems
   * @param {Object} userStats - User stats
   * @returns {Array} Next problems to try
   */
  getSuggestionsAfterSubmission(submissionResult, allProblems, userStats) {
    if (submissionResult.success) {
      // Problem solved: suggest similar difficulty or next level
      return this.getRecommendations(
        { skillLevel: 'intermediate' },
        allProblems,
        userStats,
        { limit: 3, strategy: 'progression' }
      );
    } else {
      // Problem failed: suggest easier problems on same topic
      const topic = submissionResult.topic;
      const easier = allProblems.filter(
        p =>
          p.topic === topic &&
          !userStats.solvedProblems?.includes(p.id) &&
          p.difficulty === 'easy'
      );

      return easier.slice(0, 3).map(p => ({
        ...p,
        reason: 'Master the basics before tackling harder problems',
      }));
    }
  }
}

export default ProblemRecommender;
