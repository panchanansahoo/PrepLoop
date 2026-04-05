import express from 'express';
import { supabaseAdmin } from '../db/index.js';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { CodeReviewService, InterviewSimulatorService } from '../services/aiService.js';
import { createLogger } from '../utils/structuredLogger.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const router = express.Router();
const logger = createLogger('AI-Features-Routes');
const INTERVIEW_START_COIN_COST = Number(process.env.AI_INTERVIEW_COIN_COST || 5);

const spendCoinsForInterviewStart = async (userId, cost, referenceKey = null) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'spend',
    description: 'AI interview session start',
    referenceKey,
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      return { ok: false, currentCoins: atomicResult.balance };
    }
    return { ok: true, newBalance: atomicResult.balance };
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentCoins = profile?.coins || 0;
  if (currentCoins < cost) {
    return { ok: false, currentCoins };
  }

  const newBalance = currentCoins - cost;
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: cost,
    type: 'spend',
    description: 'AI interview session start',
  });

  return { ok: true, newBalance };
};

const refundCoinsForInterviewStartFailure = async (userId, cost, referenceKey = null) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'earn',
    description: 'AI interview refund (start failed)',
    referenceKey,
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      throw new Error(atomicResult.error || 'Failed to refund interview coins');
    }
    return atomicResult.balance;
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentCoins = profile?.coins || 0;
  const refundedBalance = currentCoins + cost;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: refundedBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: cost,
    type: 'earn',
    description: 'AI interview refund (start failed)',
  });

  return refundedBalance;
};

const isMissingPerformanceTrendSchema = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (message.includes('interview_performance_trends') && message.includes('not found')) ||
    (message.includes('relation') && message.includes('interview_performance_trends'))
  );
};

// ============ CODE REVIEW ENDPOINTS ============

/**
 * POST /api/ai/code-review
 * Submit code for AI review
 * Body: { problemId, code, language }
 */
router.post(
  '/code-review',
  authenticateToken,
  body('problemId').isInt().toInt(),
  body('code').isString().notEmpty().trim(),
  body('language').optional().isString().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code, problemId, language = 'javascript' } = req.body;
      const userId = req.user.id;
      const requestId = req.id; // From requestId middleware

      logger.info('Code review request', {
        userId,
        problemId,
        language,
        requestId
      });

      const review = await CodeReviewService.analyzeCode(
        userId,
        problemId,
        code,
        language,
        requestId
      );

      return res.status(200).json({
        success: true,
        data: review
      });

    } catch (error) {
      logger.error('Code review error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to process code review',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/ai/code-review/:reviewId
 * Get specific code review
 */
router.get(
  '/code-review/:reviewId',
  authenticateToken,
  param('reviewId').isUUID(),
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const { data: review, error } = await supabaseAdmin
        .from('code_review_sessions')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', userId)
        .single();

      if (error || !review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: review
      });

    } catch (error) {
      logger.error('Fetch review error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch review'
      });
    }
  }
);

/**
 * GET /api/ai/code-review/problem/:problemId
 * Get all reviews for a specific problem by current user
 */
router.get(
  '/code-review/problem/:problemId',
  authenticateToken,
  param('problemId').isInt().toInt(),
  async (req, res) => {
    try {
      const { problemId } = req.params;
      const userId = req.user.id;

      const { data: reviews, error } = await supabaseAdmin
        .from('code_review_sessions')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length
      });

    } catch (error) {
      logger.error('Fetch problem reviews error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }
  }
);

/**
 * GET /api/ai/code-review/history
 * Get user's code review history with pagination
 */
router.get(
  '/code-review/history',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, parseInt(req.query.limit) || 10);
      const offset = (page - 1) * limit;

      const { data: reviews, error, count } = await supabaseAdmin
        .from('code_review_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      logger.error('Fetch review history error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch review history'
      });
    }
  }
);

// ============ INTERVIEW SIMULATION ENDPOINTS ============

/**
 * POST /api/ai/interview/start
 * Initialize a new interview session
 * Body: { interviewType, difficulty, companyFocus? }
 */
router.post(
  '/interview/start',
  authenticateToken,
  body('interviewType').isIn(['dsa', 'system_design', 'behavioral', 'mixed']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('companyFocus').optional().isString().trim(),
  async (req, res) => {
    let didCharge = false;
    let spendResult = { ok: true, newBalance: null };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { interviewType, difficulty = 'medium', companyFocus } = req.body;
      const userId = req.user.id;
      const requestId = req.id;

      logger.info('Interview start request', {
        userId,
        interviewType,
        difficulty,
        companyFocus,
        requestId
      });

      spendResult = await spendCoinsForInterviewStart(
        userId,
        INTERVIEW_START_COIN_COST,
        requestId ? `ai-interview-start:${requestId}` : null
      );

      if (!spendResult.ok) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient coins',
          error: 'Insufficient coins',
          required: INTERVIEW_START_COIN_COST,
          coins: spendResult.currentCoins,
        });
      }
      didCharge = true;

      const interview = await InterviewSimulatorService.initializeInterview(
        userId,
        interviewType,
        difficulty,
        companyFocus,
        requestId
      );

      return res.status(200).json({
        success: true,
        data: {
          ...interview,
          coinsRemaining: spendResult.newBalance,
        }
      });

    } catch (error) {
      if (didCharge) {
        try {
          await refundCoinsForInterviewStartFailure(
            req.user?.id,
            INTERVIEW_START_COIN_COST,
            req.id ? `ai-interview-refund:${req.id}` : null
          );
        } catch (refundError) {
          logger.error('Interview refund error', { error: refundError.message, requestId: req.id });
        }
      }
      logger.error('Interview start error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to start interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/ai/interview/:sessionId/respond
 * Process candidate response in interview
 * Body: { response }
 */
router.post(
  '/interview/:sessionId/respond',
  authenticateToken,
  param('sessionId').isUUID(),
  body('response').isString().notEmpty().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const { response } = req.body;
      const userId = req.user.id;
      const requestId = req.id;

      logger.info('Interview response', {
        userId,
        sessionId,
        responseLength: response.length,
        requestId
      });

      const result = await InterviewSimulatorService.processInterviewResponse(
        sessionId,
        userId,
        response,
        requestId
      );

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Interview response error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to process response',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/ai/interview/:sessionId/complete
 * End interview and get final analysis
 */
router.post(
  '/interview/:sessionId/complete',
  authenticateToken,
  param('sessionId').isUUID(),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const requestId = req.id;

      logger.info('Interview completion', {
        userId,
        sessionId,
        requestId
      });

      const completedInterview = await InterviewSimulatorService.completeInterview(
        sessionId,
        userId,
        requestId
      );

      return res.status(200).json({
        success: true,
        data: completedInterview
      });

    } catch (error) {
      logger.error('Interview completion error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to complete interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/ai/interview/:sessionId
 * Get interview session details
 */
router.get(
  '/interview/:sessionId',
  authenticateToken,
  (req, res, next) => {
    if (req.params.sessionId === 'history') {
      return next('route');
    }
    return next();
  },
  param('sessionId').isUUID(),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const interview = await InterviewSimulatorService.getInterviewSession(sessionId, userId);

      return res.status(200).json({
        success: true,
        data: interview
      });

    } catch (error) {
      if (error.message === 'Interview session not found') {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }
      logger.error('Fetch interview error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interview'
      });
    }
  }
);

/**
 * GET /api/ai/interview/history
 * Get user's interview history with pagination
 */
router.get(
  '/interview/history',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, parseInt(req.query.limit) || 10);
      const offset = (page - 1) * limit;
      const status = req.query.status; // Filter by status (completed, in_progress, abandoned)

      let query = supabaseAdmin
        .from('interview_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: interviews, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: interviews,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      logger.error('Fetch interview history error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interview history'
      });
    }
  }
);

/**
 * GET /api/ai/performance-trends
 * Get user's performance trends across interviews
 */
router.get(
  '/performance-trends',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const interviewType = req.query.type; // Optional filter by type

      let query = supabaseAdmin
        .from('interview_performance_trends')
        .select('*')
        .eq('user_id', userId);

      if (interviewType) {
        query = query.eq('interview_type', interviewType);
      }

      const { data: trends, error } = await query;

      if (error) {
        if (isMissingPerformanceTrendSchema(error)) {
          logger.warn('Performance trends schema missing; returning empty trends', {
            userId,
            interviewType,
            code: error.code,
          });
          return res.status(200).json({
            success: true,
            data: [],
            trends: [],
            schemaMissing: true,
          });
        }
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: trends,
        trends,
      });

    } catch (error) {
      logger.error('Fetch performance trends error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch performance trends'
      });
    }
  }
);

// ============ UTILITY ENDPOINTS ============

/**
 * GET /api/ai/stats
 * Get overall AI feature usage stats for current user
 */
router.get(
  '/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const { count: codeReviewsCount } = await supabaseAdmin
        .from('code_review_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: interviewsCount } = await supabaseAdmin
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: completedInterviewsCount } = await supabaseAdmin
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      return res.status(200).json({
        success: true,
        data: {
          codeReviewsSubmitted: codeReviewsCount || 0,
          interviewsStarted: interviewsCount || 0,
          interviewsCompleted: completedInterviewsCount || 0
        },
        codeReviewsCount: codeReviewsCount || 0,
        interviewsCount: interviewsCount || 0,
        completedInterviewsCount: completedInterviewsCount || 0,
      });

    } catch (error) {
      logger.error('Fetch stats error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stats'
      });
    }
  }
);

export default router;
