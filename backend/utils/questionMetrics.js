/**
 * Question Metrics Tracker — Track usage, quality, and diversity metrics
 * 
 * Maintains real-time statistics on question performance to enable:
 * - Underutilized question recommendations
 * - Quality-novelty balance
 * - Diversity scoring across categories
 */

import cacheManager from './cacheManager.js';

const METRICS_CACHE_KEY = 'question-metrics:all';
const METRICS_TTL = 7 * 24 * 60 * 60; // 7 days retention

class QuestionMetricsTracker {
  constructor() {
    this.metrics = new Map(); // Local cache during session
    this.initialized = false;
  }

  /**
   * Initialize metrics from cache on startup
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      const cached = await cacheManager.getJSON(METRICS_CACHE_KEY);
      if (cached && typeof cached === 'object') {
        this.metrics = new Map(Object.entries(cached));
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[QuestionMetrics] Init failed, starting fresh:', err.message?.substring(0, 100));
      this.initialized = true;
    }
  }

  /**
   * Record a question usage
   * @param {string} questionId - Unique question identifier
   * @param {string} category - Question category (behavioral, technical, system-design, etc.)
   * @param {string} difficulty - difficulty level (easy, medium, hard)
   */
  async recordUsage(questionId, category, difficulty) {
    await this.initialize();
    
    if (!this.metrics.has(questionId)) {
      this.metrics.set(questionId, {
        questionId,
        category,
        difficulty,
        usageCount: 0,
        lastUsed: null,
        qualityRating: 0,
        feedbackCount: 0,
        positiveCount: 0,
        averageTime: 0, // avg seconds user spent
        timeReadings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const metric = this.metrics.get(questionId);
    metric.usageCount += 1;
    metric.lastUsed = new Date().toISOString();
    metric.updatedAt = new Date().toISOString();

    await this.persist();
  }

  /**
   * Record quality feedback on a question
   * @param {string} questionId - Question ID
   * @param {number} rating - Rating 0-100 (quality/relevance)
   * @param {boolean} positive - True if user feedback was positive
   */
  async recordFeedback(questionId, rating, positive = null) {
    await this.initialize();
    
    if (!this.metrics.has(questionId)) return;

    const metric = this.metrics.get(questionId);
    const oldRating = metric.qualityRating;
    const oldCount = metric.feedbackCount;

    metric.feedbackCount += 1;
    metric.qualityRating = (oldRating * oldCount + rating) / metric.feedbackCount;
    metric.updatedAt = new Date().toISOString();

    if (positive !== null) {
      metric.positiveCount += positive ? 1 : 0;
    }

    await this.persist();
  }

  /**
   * Record time spent on a question (for engagement metrics)
   * @param {string} questionId - Question ID
   * @param {number} seconds - Time spent in seconds
   */
  async recordTimeSpent(questionId, seconds) {
    await this.initialize();
    
    if (!this.metrics.has(questionId)) return;

    const metric = this.metrics.get(questionId);
    metric.timeReadings.push(seconds);

    // Keep only last 50 readings to avoid memory bloat
    if (metric.timeReadings.length > 50) {
      metric.timeReadings = metric.timeReadings.slice(-50);
    }

    metric.averageTime = metric.timeReadings.reduce((a, b) => a + b, 0) / metric.timeReadings.length;
    metric.updatedAt = new Date().toISOString();

    await this.persist();
  }

  /**
   * Get metrics for a specific question
   */
  async getMetrics(questionId) {
    await this.initialize();
    return this.metrics.get(questionId) || null;
  }

  /**
   * Get all metrics
   */
  async getAllMetrics() {
    await this.initialize();
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics by category
   */
  async getMetricsByCategory(category) {
    await this.initialize();
    return Array.from(this.metrics.values())
      .filter(m => m.category === category);
  }

  /**
   * Calculate diversity score (0-100)
   * Lower score = fewer unique questions used; higher = better variety
   * 
   * Formula:
   * - Track distinct questions per category
   * - Score = (distinct / total) * 100 within recent window
   * - Within each difficulty tier
   */
  async getDiversityScore(category) {
    await this.initialize();
    
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.category === category);

    if (metrics.length === 0) return 0;

    // Calculate unique questions as percentage of total usage
    const totalUsage = metrics.reduce((sum, m) => sum + m.usageCount, 0);
    if (totalUsage === 0) return 100; // New category

    const uniqueQuestions = metrics.length;
    const diversityRatio = Math.min(uniqueQuestions / (totalUsage / 5), 1); // Expect ~5 uses per unique per session
    
    return Math.round(diversityRatio * 100);
  }

  /**
   * Get underutilized questions (low usage relative to quality)
   * These are good candidates for next question selection
   */
  async getUnderutilizedQuestions(category, minQuality = 50) {
    await this.initialize();
    
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.category === category && m.qualityRating >= minQuality);

    const avgUsage = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.usageCount, 0) / metrics.length
      : 0;

    // Questions with below-average usage but decent quality
    return metrics
      .filter(m => m.usageCount < avgUsage)
      .sort((a, b) => {
        // Prioritize: high quality + low usage + long time since used
        const scoreA = (a.qualityRating * 100) / (a.usageCount + 1) / (Date.now() - new Date(a.lastUsed).getTime());
        const scoreB = (b.qualityRating * 100) / (b.usageCount + 1) / (Date.now() - new Date(b.lastUsed).getTime());
        return scoreB - scoreA;
      });
  }

  /**
   * Get trending questions (recently good feedback, increasing usage)
   */
  async getTrendingQuestions(category, limit = 5) {
    await this.initialize();
    
    const now = Date.now();
    const recentWindow = 24 * 60 * 60 * 1000; // Last 24 hours

    const metrics = Array.from(this.metrics.values())
      .filter(m => m.category === category)
      .filter(m => m.lastUsed && (now - new Date(m.lastUsed).getTime()) < recentWindow)
      .sort((a, b) => {
        // Sort by: quality * recency * usage
        const scoreA = a.qualityRating * a.usageCount;
        const scoreB = b.qualityRating * b.usageCount;
        return scoreB - scoreA;
      });

    return metrics.slice(0, limit);
  }

  /**
   * Get statistical summary for a category
   */
  async getCategorySummary(category) {
    await this.initialize();
    
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.category === category);

    if (metrics.length === 0) {
      return {
        category,
        totalQuestions: 0,
        avgQuality: 0,
        avgUsage: 0,
        avgPositiveRate: 0,
        totalUsages: 0,
      };
    }

    const totalUsages = metrics.reduce((sum, m) => sum + m.usageCount, 0);
    const avgQuality = metrics.reduce((sum, m) => sum + m.qualityRating, 0) / metrics.length;
    const avgUsage = totalUsages / metrics.length;
    const avgPositiveRate = metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + m.positiveCount, 0) / metrics.reduce((sum, m) => sum + m.feedbackCount, 0)) * 100
      : 0;

    return {
      category,
      totalQuestions: metrics.length,
      avgQuality: Math.round(avgQuality),
      avgUsage: Math.round(avgUsage),
      avgPositiveRate: Math.isFinite(avgPositiveRate) ? Math.round(avgPositiveRate) : 0,
      totalUsages,
      diversity: await this.getDiversityScore(category),
    };
  }

  /**
   * Reset metrics for testing
   */
  async reset() {
    this.metrics.clear();
    await cacheManager.delete(METRICS_CACHE_KEY);
  }

  /**
   * Persist metrics to cache
   */
  async persist() {
    try {
      const data = Object.fromEntries(this.metrics);
      await cacheManager.setJSON(METRICS_CACHE_KEY, data, METRICS_TTL);
    } catch (err) {
      console.warn('[QuestionMetrics] Persist failed (non-blocking):', err.message?.substring(0, 100));
    }
  }
}

const tracker = new QuestionMetricsTracker();

export default {
  recordUsage: (qid, cat, diff) => tracker.recordUsage(qid, cat, diff),
  recordFeedback: (qid, rating, positive) => tracker.recordFeedback(qid, rating, positive),
  recordTimeSpent: (qid, seconds) => tracker.recordTimeSpent(qid, seconds),
  getMetrics: (qid) => tracker.getMetrics(qid),
  getAllMetrics: () => tracker.getAllMetrics(),
  getMetricsByCategory: (cat) => tracker.getMetricsByCategory(cat),
  getDiversityScore: (cat) => tracker.getDiversityScore(cat),
  getUnderutilizedQuestions: (cat, minQual) => tracker.getUnderutilizedQuestions(cat, minQual),
  getTrendingQuestions: (cat, limit) => tracker.getTrendingQuestions(cat, limit),
  getCategorySummary: (cat) => tracker.getCategorySummary(cat),
  initialize: () => tracker.initialize(),
  reset: () => tracker.reset(),
};
