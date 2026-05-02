/**
 * Category Strength Tracker
 * Tracks performance by category and identifies weak areas for adaptive routing
 */

/**
 * Question Categories
 */
const CATEGORIES = {
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  SYSTEM_DESIGN: 'system_design',
  ALGORITHM: 'algorithm',
  DATABASE: 'database',
  ARCHITECTURE: 'architecture',
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DEVOPS: 'devops',
  SOFT_SKILLS: 'soft_skills'
};

/**
 * Category Strength Tracker
 */
class CategoryStrengthTracker {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.categoryScores = {};
    this.categoryAttempts = {};
    this.categoryTrends = {};

    // Initialize all categories
    Object.values(CATEGORIES).forEach(category => {
      this.categoryScores[category] = [];
      this.categoryAttempts[category] = 0;
      this.categoryTrends[category] = { direction: 'stable', momentum: 0 };
    });
  }

  /**
   * Record answer for a category
   */
  recordAnswer(category, score) {
    if (!CATEGORIES[Object.keys(CATEGORIES).find(k => CATEGORIES[k] === category)]) {
      category = CATEGORIES.TECHNICAL;  // Default fallback
    }

    this.categoryScores[category].push({
      score,
      timestamp: Date.now()
    });

    this.categoryAttempts[category]++;
    this.updateTrend(category);
  }

  /**
   * Update trend for category (improving, declining, stable)
   */
  updateTrend(category) {
    const scores = this.categoryScores[category];
    
    if (scores.length < 2) {
      this.categoryTrends[category] = { direction: 'stable', momentum: 0 };
      return;
    }

    // Look at last 3-5 scores to determine trend
    const recentCount = Math.min(5, scores.length);
    const recent = scores.slice(-recentCount);
    
    // Calculate trend
    let improving = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].score > recent[i - 1].score) improving++;
    }

    const direction = improving > recentCount / 2 ? 'improving' : 
                     improving < recentCount / 4 ? 'declining' : 'stable';

    // Calculate momentum (rate of change)
    const firstScore = recent[0].score;
    const lastScore = recent[recent.length - 1].score;
    const momentum = lastScore - firstScore;

    this.categoryTrends[category] = { direction, momentum };
  }

  /**
   * Get average score for category
   */
  getAverageScore(category) {
    const scores = this.categoryScores[category] || [];
    if (scores.length === 0) return null;

    const sum = scores.reduce((acc, s) => acc + s.score, 0);
    return sum / scores.length;
  }

  /**
   * Get score distribution for category
   */
  getScoreDistribution(category) {
    const scores = this.categoryScores[category] || [];
    if (scores.length === 0) return null;

    const sorted = scores.map(s => s.score).sort((a, b) => a - b);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      q1: sorted[Math.floor(sorted.length / 4)],
      q3: sorted[Math.floor((sorted.length * 3) / 4)]
    };
  }

  /**
   * Identify weakest categories
   */
  getWeakestCategories(count = 3) {
    return Object.values(CATEGORIES)
      .map(category => ({
        category,
        average: this.getAverageScore(category) || 0,
        attempts: this.categoryAttempts[category],
        trend: this.categoryTrends[category]
      }))
      .filter(c => c.attempts > 0)
      .sort((a, b) => a.average - b.average)
      .slice(0, count);
  }

  /**
   * Identify strongest categories
   */
  getStrongestCategories(count = 3) {
    return Object.values(CATEGORIES)
      .map(category => ({
        category,
        average: this.getAverageScore(category) || 0,
        attempts: this.categoryAttempts[category],
        trend: this.categoryTrends[category]
      }))
      .filter(c => c.attempts > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, count);
  }

  /**
   * Get categories that need more practice (low score OR improving trend)
   */
  getFocusAreas() {
    return Object.values(CATEGORIES)
      .map(category => ({
        category,
        average: this.getAverageScore(category) || 0,
        attempts: this.categoryAttempts[category],
        trend: this.categoryTrends[category],
        priority: this.calculateFocusPriority(category)
      }))
      .filter(c => c.attempts > 0)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }

  /**
   * Calculate priority for focus (0-100)
   */
  calculateFocusPriority(category) {
    const score = this.getAverageScore(category) || 50;
    const attempts = this.categoryAttempts[category];
    const trend = this.categoryTrends[category];

    // Lower score = higher priority
    let priority = (100 - score);

    // Fewer attempts = should practice more
    if (attempts < 2) priority += 30;
    if (attempts < 5) priority += 15;

    // Declining trend = higher priority
    if (trend.direction === 'declining') priority += 20;
    if (trend.direction === 'improving') priority -= 10;

    return Math.max(0, Math.min(100, priority));
  }

  /**
   * Get category for next question based on performance
   */
  getNextCategory(strategy = 'balanced') {
    const weak = this.getWeakestCategories(3);
    const strong = this.getStrongestCategories(3);
    const untested = Object.values(CATEGORIES).filter(
      c => (this.categoryAttempts[c] || 0) === 0
    );

    // Different strategies
    if (strategy === 'weakness-focused') {
      return weak.length > 0 ? weak[0].category : CATEGORIES.TECHNICAL;
    } else if (strategy === 'balance') {
      // 60% focus on weak, 30% balance, 10% explore new
      const rand = Math.random();
      if (rand < 0.6 && weak.length > 0) return weak[0].category;
      if (rand < 0.9 && untested.length > 0) return untested[Math.floor(Math.random() * untested.length)];
      return strong.length > 0 ? strong[0].category : CATEGORIES.TECHNICAL;
    } else if (strategy === 'round-robin') {
      // Cycle through all categories
      const categories = Object.values(CATEGORIES);
      const leastAttempted = categories.reduce((min, cat) => 
        (this.categoryAttempts[cat] || 0) < (this.categoryAttempts[min] || 0) ? cat : min
      );
      return leastAttempted;
    } else if (strategy === 'strength-focused') {
      return strong.length > 0 ? strong[0].category : CATEGORIES.TECHNICAL;
    }

    // Default: balanced
    return this.getNextCategory('balance');
  }

  /**
   * Check if candidate is ready for next level
   */
  isReadyForAdvanced() {
    const allCategories = Object.values(CATEGORIES);
    const avgScore = allCategories.reduce((sum, cat) => sum + (this.getAverageScore(cat) || 0), 0) / allCategories.length;
    
    // Ready if average > 70 and attempted most categories
    const attemptedCount = allCategories.filter(c => this.categoryAttempts[c] > 0).length;
    return avgScore > 70 && attemptedCount >= 6;
  }

  /**
   * Get strength report
   */
  getStrengthReport() {
    const categories = Object.values(CATEGORIES);
    
    return {
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      summary: {
        totalAttempts: categories.reduce((sum, c) => sum + (this.categoryAttempts[c] || 0), 0),
        overallAverage: Math.round(
          categories.reduce((sum, c) => sum + (this.getAverageScore(c) || 0), 0) / categories.length * 10
        ) / 10,
        categoriesTested: categories.filter(c => this.categoryAttempts[c] > 0).length
      },
      byCategory: categories
        .map(category => ({
          category,
          average: this.getAverageScore(category),
          attempts: this.categoryAttempts[category],
          distribution: this.getScoreDistribution(category),
          trend: this.categoryTrends[category]
        }))
        .sort((a, b) => (b.average || 0) - (a.average || 0)),
      weaknesses: this.getWeakestCategories(5),
      strengths: this.getStrongestCategories(5),
      focusAreas: this.getFocusAreas(),
      readinessLevel: this.isReadyForAdvanced() ? 'advanced' : 'intermediate'
    };
  }

  /**
   * Export tracker state for persistence
   */
  export() {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      categoryScores: this.categoryScores,
      categoryAttempts: this.categoryAttempts,
      categoryTrends: this.categoryTrends,
      timestamp: Date.now()
    };
  }

  /**
   * Import tracker state
   */
  static import(data) {
    const tracker = new CategoryStrengthTracker(data.userId, data.sessionId);
    tracker.categoryScores = data.categoryScores;
    tracker.categoryAttempts = data.categoryAttempts;
    tracker.categoryTrends = data.categoryTrends;
    return tracker;
  }
}

/**
 * Map question to category
 */
export function categorizeQuestion(question) {
  const qLower = question.toLowerCase();

  if (/tell me about|describe|experience|conflict|failure|worked|team|collaboration/.test(qLower)) {
    return CATEGORIES.BEHAVIORAL;
  }
  if (/system design|architecture|scale|scaling|cache|caching|distributed|load balance|redundancy/.test(qLower)) {
    return CATEGORIES.SYSTEM_DESIGN;
  }
  if (/algorithm|sort|search|graph|tree|dynamic programming/.test(qLower)) {
    return CATEGORIES.ALGORITHM;
  }
  if (/database|sql|query|index|transaction|mongodb|nosql|relational/.test(qLower)) {
    return CATEGORIES.DATABASE;
  }
  if (/microservices|design pattern|solid|oop|inheritance|polymorphism/.test(qLower)) {
    return CATEGORIES.ARCHITECTURE;
  }
  if (/react|vue|angular|frontend|ui|css|javascript|html|dom/.test(qLower)) {
    return CATEGORIES.FRONTEND;
  }
  if (/node|express|backend|api|server|python|java|c\+\+|golang/.test(qLower)) {
    return CATEGORIES.BACKEND;
  }
  if (/devops|docker|kubernetes|ci|cd|deployment|jenkins|terraform/.test(qLower)) {
    return CATEGORIES.DEVOPS;
  }
  if (/communication|leadership|conflict|growth|learning|mentoring|feedback/.test(qLower)) {
    return CATEGORIES.SOFT_SKILLS;
  }

  return CATEGORIES.TECHNICAL;
}

export default CategoryStrengthTracker;
export { CATEGORIES };
