/**
 * Interview Router - Intelligent Question Selection
 * Routes to appropriate questions based on performance, category strengths, and interview progression
 */

import categoryStrengthTracker, { categorizeQuestion, CATEGORIES } from './categoryStrengthTracker.js';
import interviewerPersonality from './interviewerPersonality.js';

/**
 * Interview Router
 */
class InterviewRouter {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.strengthTracker = new categoryStrengthTracker(userId, sessionId);
    this.questionsAsked = [];
    this.currentPhase = 'opening';  // opening → warmup → main → deepening → closing
    this.difficulty = 'medium';    // easy → medium → hard
    this.routingStrategy = 'balanced';  // balanced, weakness-focused, strength-focused
  }

  /**
   * Determine interview phase
   */
  updatePhase() {
    const attemptCount = this.questionsAsked.length;

    if (attemptCount === 0) {
      this.currentPhase = 'opening';
    } else if (attemptCount < 3) {
      this.currentPhase = 'warmup';
    } else if (attemptCount < 8) {
      this.currentPhase = 'main';
    } else if (attemptCount < 12) {
      this.currentPhase = 'deepening';
    } else {
      this.currentPhase = 'closing';
    }
  }

  /**
   * Adjust difficulty based on performance
   */
  updateDifficulty(recentScores) {
    if (recentScores.length < 2) return;

    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    if (avgScore > 80 && this.difficulty !== 'hard') {
      this.difficulty = 'hard';
    } else if (avgScore > 65 && avgScore <= 80 && this.difficulty !== 'medium') {
      this.difficulty = 'medium';
    } else if (avgScore <= 65 && this.difficulty !== 'easy') {
      this.difficulty = 'easy';
    }
  }

  /**
   * Record answered question
   */
  recordQuestion(question, score) {
    const category = categorizeQuestion(question);
    this.strengthTracker.recordAnswer(category, score);
    this.questionsAsked.push({
      question,
      score,
      category,
      timestamp: Date.now()
    });

    // Update phase and difficulty
    this.updatePhase();
    this.updateDifficulty(this.getRecentScores(5));
  }

  /**
   * Get recent scores
   */
  getRecentScores(count = 5) {
    return this.questionsAsked.slice(-count).map(q => q.score);
  }

  /**
   * Select next question category
   */
  selectNextCategory() {
    const phase = this.currentPhase;

    // Different strategies by phase
    if (phase === 'opening' || phase === 'warmup') {
      // Start with easier categories for confidence building
      return this.selectWarmupCategory();
    } else if (phase === 'main') {
      // Focus on balanced coverage with slight weak area focus
      return this.selectMainCategory();
    } else if (phase === 'deepening') {
      // Deep dive into weak areas or explore new categories
      return this.selectDeepeningCategory();
    } else if (phase === 'closing') {
      // Final impression - strength or balanced
      return this.selectClosingCategory();
    }

    return this.selectMainCategory();
  }

  /**
   * Select category for warmup phase (build confidence)
   */
  selectWarmupCategory() {
    // Prefer soft skills and behavioral at start
    const preferredCategories = [CATEGORIES.BEHAVIORAL, CATEGORIES.SOFT_SKILLS, CATEGORIES.FRONTEND];
    
    // Check which are untested
    for (const cat of preferredCategories) {
      if ((this.strengthTracker.categoryAttempts[cat] || 0) === 0) {
        return cat;
      }
    }

    // Otherwise pick strongest to build momentum
    const strongest = this.strengthTracker.getStrongestCategories(1);
    return strongest.length > 0 ? strongest[0].category : CATEGORIES.TECHNICAL;
  }

  /**
   * Select category for main phase (balanced with weakness focus)
   */
  selectMainCategory() {
    const weak = this.strengthTracker.getWeakestCategories(3);
    const tested = Object.values(CATEGORIES).filter(c => (this.strengthTracker.categoryAttempts[c] || 0) > 0);
    const untested = Object.values(CATEGORIES).filter(c => (this.strengthTracker.categoryAttempts[c] || 0) === 0);

    // 60% weak areas, 30% untested, 10% balance
    const rand = Math.random();

    if (rand < 0.6 && weak.length > 0) {
      return weak[0].category;
    } else if (rand < 0.9 && untested.length > 0) {
      return untested[Math.floor(Math.random() * untested.length)];
    } else {
      return tested.length > 0 ? tested[Math.floor(Math.random() * tested.length)] : CATEGORIES.TECHNICAL;
    }
  }

  /**
   * Select category for deepening phase (challenge weak areas)
   */
  selectDeepeningCategory() {
    const focusAreas = this.strengthTracker.getFocusAreas();
    if (focusAreas.length > 0) {
      return focusAreas[0].category;
    }

    const weakest = this.strengthTracker.getWeakestCategories(1);
    return weakest.length > 0 ? weakest[0].category : CATEGORIES.TECHNICAL;
  }

  /**
   * Select category for closing phase (final impression)
   */
  selectClosingCategory() {
    // Give candidate a chance to showcase strength OR final challenge
    const rand = Math.random();

    if (rand < 0.5) {
      // Strength showcase
      const strongest = this.strengthTracker.getStrongestCategories(1);
      return strongest.length > 0 ? strongest[0].category : CATEGORIES.TECHNICAL;
    } else {
      // Final challenge on weakness
      const weakest = this.strengthTracker.getWeakestCategories(1);
      return weakest.length > 0 ? weakest[0].category : CATEGORIES.TECHNICAL;
    }
  }

  /**
   * Get difficulty adjustment for category
   */
  getDifficultyForCategory(category) {
    const avgScore = this.strengthTracker.getAverageScore(category);
    const attempts = this.strengthTracker.categoryAttempts[category] || 0;

    if (attempts === 0) return 'medium';  // First time = medium
    if (avgScore > 75) return 'hard';
    if (avgScore > 60) return 'medium';
    return 'easy';
  }

  /**
   * Determine personality for next question
   */
  selectPersonalityForCategory(category) {
    return interviewerPersonality.selectPersonaForQuestion(
      this.getExampleQuestionForCategory(category),
      category
    );
  }

  /**
   * Get example question for category (for persona selection)
   */
  getExampleQuestionForCategory(category) {
    const examples = {
      [CATEGORIES.BEHAVIORAL]: 'Tell me about a time when you faced conflict',
      [CATEGORIES.TECHNICAL]: 'How would you implement a LRU cache?',
      [CATEGORIES.SYSTEM_DESIGN]: 'Design a scalable chat system',
      [CATEGORIES.ALGORITHM]: 'What is the time complexity of merge sort?',
      [CATEGORIES.DATABASE]: 'Explain database indexing',
      [CATEGORIES.ARCHITECTURE]: 'What is microservices architecture?',
      [CATEGORIES.FRONTEND]: 'How do you optimize React performance?',
      [CATEGORIES.BACKEND]: 'How do you handle authentication?',
      [CATEGORIES.DEVOPS]: 'Explain CI/CD pipeline',
      [CATEGORIES.SOFT_SKILLS]: 'How do you handle failure?'
    };

    return examples[category] || 'Technical question about your experience';
  }

  /**
   * Get routing recommendation (used by question selection service)
   */
  getRoutingRecommendation() {
    this.updatePhase();

    const nextCategory = this.selectNextCategory();
    const difficulty = this.getDifficultyForCategory(nextCategory);
    const persona = this.selectPersonalityForCategory(nextCategory);

    return {
      category: nextCategory,
      difficulty,
      persona,
      phase: this.currentPhase,
      currentDifficulty: this.difficulty,
      reasoning: this.getRoutingReasoning(nextCategory, difficulty)
    };
  }

  /**
   * Get explanation for routing decision
   */
  getRoutingReasoning(category, difficulty) {
    const reasons = [];
    const avgScore = this.strengthTracker.getAverageScore(category);
    const attempts = this.strengthTracker.categoryAttempts[category] || 0;

    if (attempts === 0) {
      reasons.push(`Haven't tested ${category} yet`);
    } else if (avgScore < 50) {
      reasons.push(`${category} is a weak area (${avgScore.toFixed(1)}/100)`);
    } else if (avgScore > 75) {
      reasons.push(`${category} is strong (${avgScore.toFixed(1)}/100)`);
    }

    if (this.currentPhase === 'warmup') {
      reasons.push('Building confidence in warmup phase');
    } else if (this.currentPhase === 'deepening') {
      reasons.push('Probing deeper into capabilities');
    }

    if (difficulty === 'hard') {
      reasons.push('Recent performance warrants challenge');
    } else if (difficulty === 'easy') {
      reasons.push('Building momentum with accessible questions');
    }

    return reasons.join(' • ');
  }

  /**
   * Get full interview analytics
   */
  getAnalytics() {
    return {
      phase: this.currentPhase,
      difficulty: this.difficulty,
      questionsAsked: this.questionsAsked.length,
      strengthReport: this.strengthTracker.getStrengthReport(),
      interviewProgress: {
        questionsAsked: this.questionsAsked.length,
        averageScore: this.questionsAsked.length > 0
          ? Math.round(this.questionsAsked.reduce((sum, q) => sum + q.score, 0) / this.questionsAsked.length)
          : 0,
        recentTrend: this.getRecentTrend()
      }
    };
  }

  /**
   * Calculate recent trend (improving, stable, declining)
   */
  getRecentTrend() {
    const recentScores = this.getRecentScores(3);
    if (recentScores.length < 2) return 'unknown';

    const firstScore = recentScores[0];
    const lastScore = recentScores[recentScores.length - 1];

    if (lastScore > firstScore + 5) return 'improving';
    if (lastScore < firstScore - 5) return 'declining';
    return 'stable';
  }

  /**
   * Export router state
   */
  export() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      questionsAsked: this.questionsAsked,
      currentPhase: this.currentPhase,
      difficulty: this.difficulty,
      strengthTracker: this.strengthTracker.export(),
      timestamp: Date.now()
    };
  }

  /**
   * Import router state
   */
  static import(data) {
    const router = new InterviewRouter(data.userId, data.sessionId);
    router.questionsAsked = data.questionsAsked;
    router.currentPhase = data.currentPhase;
    router.difficulty = data.difficulty;
    router.strengthTracker = categoryStrengthTracker.import(data.strengthTracker);
    return router;
  }
}

export default InterviewRouter;
