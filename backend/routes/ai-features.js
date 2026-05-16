import express from 'express';
import { supabaseAdmin } from '../db/index.js';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { CodeReviewService, InterviewSimulatorService } from '../services/aiService.js';
import { InterviewGroundingService } from '../services/ragInterviewGroundingService.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('AI-Features-Routes');
// AI assistant features are now free - no coin requirement

const INTERVIEW_MODES = ['full_realtime'];

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
      const requestId = req.requestId; // From requestId middleware

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
 * GET /api/ai/interview/modes
 * Return supported interview runtime modes
 */
router.get(
  '/interview/modes',
  authenticateToken,
  async (_req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        defaultMode: process.env.AI_INTERVIEW_MODE || 'full_realtime',
        supportedModes: INTERVIEW_MODES,
        description: {
          full_realtime: 'Optimizes prompts and responses for generic realtime voice runtimes.',
        },
      },
    });
  }
);

/**
 * POST /api/ai/interview/test-grounding
 * Diagnostic endpoint for interview grounding retrieval (no session mutation)
 */
router.post(
  '/interview/test-grounding',
  authenticateToken,
  requireAdmin,
  body('company').optional().isString().trim(),
  body('role').optional().isString().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('stage').optional().isString().trim(),
  body('interviewType').optional().isIn(['dsa', 'system_design', 'behavioral', 'mixed']),
  body('missingAreas').optional().isArray(),
  body('resumeContext').optional().isObject(),
  body('limit').optional().isInt({ min: 1, max: 8 }).toInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        company,
        role,
        difficulty = 'medium',
        stage = 'technical',
        interviewType = 'dsa',
        missingAreas = [],
        resumeContext = {},
        limit = 5,
      } = req.body || {};

      const data = await InterviewGroundingService.fetchGroundingContext({
        company,
        role,
        difficulty,
        stage,
        interviewType,
        missingAreas,
        resumeContext,
        limit,
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Interview grounding test endpoint error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve interview grounding context',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /api/ai/interview/start
 * Initialize a new interview session
 * Body: { interviewType, difficulty, companyFocus?, interviewMode? }
 */
router.post(
  '/interview/start',
  authenticateToken,
  body('interviewType').isIn(['dsa', 'system_design', 'behavioral', 'mixed']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('companyFocus').optional().isString().trim(),
  body('interviewMode').optional().isIn(INTERVIEW_MODES),
  body('totalQuestions').optional().isInt({ min: 3, max: 30 }).toInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        interviewType,
        difficulty = 'medium',
        companyFocus,
        interviewMode = process.env.AI_INTERVIEW_MODE || 'full_realtime',
        totalQuestions = null,
      } = req.body;
      const userId = req.user.id;
      const requestId = req.requestId;

      logger.info('Interview start request', {
        userId,
        interviewType,
        difficulty,
        companyFocus,
        interviewMode,
        requestId
      });

      const interview = await InterviewSimulatorService.initializeInterview(
        userId,
        interviewType,
        difficulty,
        companyFocus,
        requestId,
        interviewMode,
        totalQuestions
      );

      return res.status(200).json({
        success: true,
        data: interview
      });

    } catch (error) {
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
 * Body: { response, interviewMode? }
 */
router.post(
  '/interview/:sessionId/respond',
  authenticateToken,
  param('sessionId').isUUID(),
  body('response').isString().notEmpty().trim(),
  body('interviewMode').optional().isIn(INTERVIEW_MODES),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const {
        response,
        interviewMode = process.env.AI_INTERVIEW_MODE || 'full_realtime',
      } = req.body;
      const userId = req.user.id;
      const requestId = req.requestId;

      logger.info('Interview response', {
        userId,
        sessionId,
        interviewMode,
        responseLength: response.length,
        requestId
      });

      const result = await InterviewSimulatorService.processInterviewResponse(
        sessionId,
        userId,
        response,
        requestId,
        interviewMode
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
      const requestId = req.requestId;

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
 * GET /api/ai/interview/:sessionId/telemetry
 * Get interview telemetry snapshot for a session
 */
router.get(
  '/interview/:sessionId/telemetry',
  authenticateToken,
  param('sessionId').isUUID(),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const interview = await InterviewSimulatorService.getInterviewSession(sessionId, userId);
      const context = interview.interview_context || {};

      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          stage: context.stage || context.interviewState?.stage || 'intake',
          stageLabel: context.stageLabel || context.interviewState?.stageLabel || 'Intake & Setup',
          current_scores: context.currentScores || null,
          telemetry: context.telemetry || {
            totalTurns: Number(context.turns || 0),
            stageTransitions: [],
            groundingHits: 0,
            groundingHitRate: 0,
            lastResponseLatencyMs: 0,
            averageResponseLatencyMs: 0,
            latestAnalysisScore: 0,
            lastUpdatedAt: interview.updated_at || interview.created_at || new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      if (error.message === 'Interview session not found') {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      logger.error('Fetch interview telemetry error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interview telemetry'
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
