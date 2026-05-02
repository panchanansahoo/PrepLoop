/**
 * Question Quality & Recommendations API
 * 
 * Endpoints for accessing:
 * - Question performance metrics (usage, quality, feedback)
 * - Intelligent question recommendations (quality+novelty balance)
 * - Category diversity scores
 * - Admin analytics
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sendError, sendSuccess, ErrorCodes } from '../utils/errorResponseFormatter.js';
import questionMetrics from '../utils/questionMetrics.js';
import questionRecommender from '../utils/questionRecommender.js';

const router = express.Router();

/**
 * GET /api/questions/recommendations
 * Get recommended questions for next interview
 * 
 * Query params:
 *   - category: Question category (required)
 *   - difficulty: Current difficulty level (easy/medium/hard, default: medium)
 *   - currentScore: User's current score (0-100, default: 70)
 *   - limit: Number of recommendations (default: 5)
 *   - recent: Comma-separated list of recently-used question IDs to exclude
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty = 'medium', currentScore = 70, limit = 5, recent = '' } = req.query;

    if (!category) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Category is required');
    }

    const recentIds = recent
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    const result = await questionRecommender.getRecommendations(
      category,
      difficulty,
      parseInt(currentScore) || 70,
      recentIds,
      parseInt(limit) || 5
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch recommendations');
  }
});

/**
 * GET /api/questions/diverse-set
 * Get a diverse set of questions across difficulty levels
 * Useful for comprehensive mock interviews
 */
router.get('/diverse-set', authenticateToken, async (req, res) => {
  try {
    const { category, limit = 5, minQuality = 60 } = req.query;

    if (!category) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Category is required');
    }

    const result = await questionRecommender.getDiverseSet(
      category,
      parseInt(limit) || 5,
      parseInt(minQuality) || 60
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching diverse set:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch diverse question set');
  }
});

/**
 * GET /api/questions/gems
 * Get "gem" questions - high quality but underutilized
 * These are excellent candidates for learning
 */
router.get('/gems', authenticateToken, async (req, res) => {
  try {
    const { category, limit = 3 } = req.query;

    if (!category) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Category is required');
    }

    const result = await questionRecommender.getGemQuestions(
      category,
      parseInt(limit) || 3
    );

    res.json({
      gems: result.map(m => ({
        questionId: m.questionId,
        difficulty: m.difficulty,
        quality: Math.round(m.qualityRating),
        usageCount: m.usageCount,
        averageTime: m.averageTime,
        description: `High-quality ${m.difficulty} ${category} question - used ${m.usageCount} times`
      })),
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching gems:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch gem questions');
  }
});

/**
 * GET /api/questions/category-summary/:category
 * Get statistical summary for a category
 */
router.get('/category-summary/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;

    const summary = await questionMetrics.getCategorySummary(category);

    res.json({
      category,
      ...summary,
      recommendations: {
        focusArea: summary.avgQuality < 60 ? 'Quality needs improvement' : 'Maintain quality',
        diversityStatus: summary.diversity > 70 ? 'Good variety' : 'Increase question variety',
        usagePattern: summary.avgUsage > 5 ? 'Questions well-exercised' : 'More usage needed'
      }
    });
  } catch (error) {
    console.error('Error fetching category summary:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch category summary');
  }
});

/**
 * POST /api/questions/record-usage
 * Record question usage (called when question is asked)
 * 
 * Body:
 *   - questionId: Question identifier
 *   - category: Question category
 *   - difficulty: Question difficulty
 */
router.post('/record-usage', authenticateToken, async (req, res) => {
  try {
    const { questionId, category, difficulty } = req.body;

    if (!questionId || !category || !difficulty) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Missing required fields: questionId, category, difficulty');
    }

    await questionMetrics.recordUsage(questionId, category, difficulty);

    res.json(sendSuccess({
      message: 'Usage recorded',
      questionId,
    }));
  } catch (error) {
    console.error('Error recording usage:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to record question usage');
  }
});

/**
 * POST /api/questions/record-feedback
 * Record quality feedback on a question
 * 
 * Body:
 *   - questionId: Question ID
 *   - rating: Quality rating (0-100)
 *   - positive: Was user feedback positive? (boolean, optional)
 */
router.post('/record-feedback', authenticateToken, async (req, res) => {
  try {
    const { questionId, rating, positive } = req.body;

    if (!questionId || rating === undefined) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Missing required fields: questionId, rating');
    }

    const normalizedRating = Math.max(0, Math.min(100, parseInt(rating) || 50));

    await questionMetrics.recordFeedback(questionId, normalizedRating, positive);

    res.json(sendSuccess({
      message: 'Feedback recorded',
      questionId,
      rating: normalizedRating,
    }));
  } catch (error) {
    console.error('Error recording feedback:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to record question feedback');
  }
});

/**
 * POST /api/questions/record-time
 * Record time spent on a question
 * 
 * Body:
 *   - questionId: Question ID
 *   - seconds: Time spent in seconds
 */
router.post('/record-time', authenticateToken, async (req, res) => {
  try {
    const { questionId, seconds } = req.body;

    if (!questionId || seconds === undefined) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Missing required fields: questionId, seconds');
    }

    await questionMetrics.recordTimeSpent(questionId, parseInt(seconds) || 0);

    res.json(sendSuccess({
      message: 'Time recorded',
      questionId,
      seconds: parseInt(seconds),
    }));
  } catch (error) {
    console.error('Error recording time:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to record question time');
  }
});

/**
 * GET /api/questions/metrics/:questionId
 * Get detailed metrics for a specific question
 */
router.get('/metrics/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;

    const metrics = await questionMetrics.getMetrics(questionId);

    if (!metrics) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Question metrics not found');
    }

    res.json({
      questionId,
      ...metrics,
      positiveRate: metrics.feedbackCount > 0
        ? Math.round((metrics.positiveCount / metrics.feedbackCount) * 100)
        : null,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch question metrics');
  }
});

/**
 * GET /api/questions/trending/:category
 * Get trending questions in a category
 */
router.get('/trending/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 5 } = req.query;

    const trending = await questionMetrics.getTrendingQuestions(category, parseInt(limit) || 5);

    res.json({
      category,
      trending: trending.map(m => ({
        questionId: m.questionId,
        difficulty: m.difficulty,
        quality: Math.round(m.qualityRating),
        usageCount: m.usageCount,
        positiveRate: m.feedbackCount > 0 ? Math.round((m.positiveCount / m.feedbackCount) * 100) : 0,
      })),
      count: trending.length,
    });
  } catch (error) {
    console.error('Error fetching trending questions:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch trending questions');
  }
});

/**
 * GET /api/questions/analytics/health
 * Get overall question pool health analytics
 * (Admin only)
 */
router.get('/analytics/health', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || req.user?.email?.endsWith('@admin.com');
    if (!isAdmin) {
      return sendError(res, ErrorCodes.UNAUTHORIZED, 'Admin access required');
    }

    const allMetrics = await questionMetrics.getAllMetrics();

    if (allMetrics.length === 0) {
      return res.json({
        health: 'no-data',
        message: 'No question metrics available yet',
      });
    }

    const avgQuality = allMetrics.reduce((sum, m) => sum + m.qualityRating, 0) / allMetrics.length;
    const avgUsage = allMetrics.reduce((sum, m) => sum + m.usageCount, 0) / allMetrics.length;
    const totalUsages = allMetrics.reduce((sum, m) => sum + m.usageCount, 0);
    const ratedQuestions = allMetrics.filter(m => m.feedbackCount > 0).length;

    res.json({
      totalQuestions: allMetrics.length,
      ratedQuestions,
      ratingCoverage: Math.round((ratedQuestions / allMetrics.length) * 100),
      avgQuality: Math.round(avgQuality),
      avgUsage: Math.round(avgUsage),
      totalUsages,
      health: avgQuality > 70 && ratedQuestions / allMetrics.length > 0.5 ? 'healthy' : 'needs-attention',
      recommendations: [
        avgQuality < 60 ? '⚠️  Average question quality is low' : '✓ Question quality is good',
        ratedQuestions / allMetrics.length < 0.5 ? '⚠️  Need more user feedback' : '✓ Good feedback coverage',
        avgUsage < 2 ? '⚠️  Questions underutilized' : '✓ Questions well-used',
      ].filter(r => r.startsWith('⚠️'))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch analytics');
  }
});

export default router;
