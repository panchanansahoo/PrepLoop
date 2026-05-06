import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/index.js';
import { ImprovementPlanService } from '../services/improvementPlanService.js';
import { createLogger } from '../utils/structuredLogger.js';
import { validateRequestBody } from '../middleware/validation.js';

const router = express.Router();
const logger = createLogger('ImprovementPlan-Routes');

/**
 * POST /api/improvement-plan/generate
 * Generate personalized improvement plan based on interview history
 */
router.post('/generate', authenticateToken, validateRequestBody({
  type: 'object',
  properties: {
    sessionIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      maxItems: 20
    },
    focusAreas: {
      type: 'array',
      items: { 
        type: 'string',
        enum: [
          'communication', 'problem_solving', 'technical_depth', 'complexity_analysis',
          'edge_case_handling', 'system_design', 'behavioral_storytelling',
          'code_quality', 'debugging', 'confidence'
        ]
      }
    },
    timeframe: { type: 'number', minimum: 1, maximum: 30 }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionIds, focusAreas, timeframe = 7 } = req.body;

    logger.info('Generating improvement plan', { userId, sessionIds, focusAreas, timeframe });

    const plan = await ImprovementPlanService.generatePlan(userId, {
      sessionIds,
      focusAreas,
      timeframe
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Improvement plan generation failed', { userId: req.user.id, error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate improvement plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/improvement-plan/latest
 * Get user's latest improvement plan
 */
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const plan = await ImprovementPlanService.getLatestPlan(userId);

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Fetch latest plan failed', { userId: req.user.id, error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement plan'
    });
  }
});

/**
 * GET /api/improvement-plan/history
 * Get user's improvement plan history with pagination and caching
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const result = await ImprovementPlanService.getPlanHistory(userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.plans,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Fetch plan history failed', { userId: req.user.id, error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plan history'
    });
  }
});

/**
 * GET /api/improvement-plan/analysis/full
 * Get comprehensive analysis of all 10 skill areas (on-demand)
 * Cached for 4 hours. Used when users want deep dive beyond top 5 areas.
 */
router.get('/analysis/full', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionIds = req.query.sessionIds ? JSON.parse(req.query.sessionIds) : null;

    const fullAnalysis = await ImprovementPlanService.analyzeFullWeaknesses(userId, sessionIds);

    return res.status(200).json({
      success: true,
      data: fullAnalysis,
      mode: 'comprehensive',
      cachedTTL: 4 * 60 * 60
    });
  } catch (error) {
    logger.error('Full analysis failed', { userId: req.user.id, error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate full analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/improvement-plan/:planId/stats
 * Get statistics for a specific improvement plan
 */
router.get('/:planId/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    const { data: plan, error } = await supabaseAdmin
      .from('improvement_plans')
      .select('progress, plan_data')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const progress = plan.progress || {};
    const dailyPlan = plan.plan_data?.dailyPlan || [];
    
    const totalTasks = dailyPlan.reduce((count, day) => count + day.tasks.length, 0);
    const completedTaskCount = progress.completedTasks ? progress.completedTasks.length : 0;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTaskCount / totalTasks) * 100) 
      : 0;
    
    const stats = {
      totalTasks,
      completedTasks: completedTaskCount,
      completionPercentage,
      daysActive: [...new Set(progress.completedTasks?.map(t => t.day) || [])].length,
      lastUpdated: progress.lastUpdated,
      notes: progress.notes ? progress.notes.length > 0 : false
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Fetch plan stats failed', { userId: req.user.id, planId: req.params.planId, error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plan statistics'
    });
  }
});

/**
 * GET /api/improvement-plan/:planId
 * Get specific improvement plan by ID
 */
router.get('/:planId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    const plan = await ImprovementPlanService.getPlanById(planId, userId);

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Fetch plan by ID failed', { userId: req.user.id, planId: req.params.planId, error: error.message, stack: error.stack });
    
    if (error.message.includes('Plan not found')) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement plan'
    });
  }
});

/**
 * POST /api/improvement-plan/:planId/progress
 * Update progress on an improvement plan
 */
router.post('/:planId/progress', authenticateToken, validateRequestBody({
  type: 'object',
  required: [],
  properties: {
    completedTasks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['day', 'taskIndex'],
        properties: {
          day: { type: 'number' },
          taskIndex: { type: 'number' },
          completedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    notes: { type: 'string', maxLength: 1000 }
  }
}), async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;
    const { completedTasks, notes } = req.body;

    const updatedPlan = await ImprovementPlanService.updatePlanProgress(
      planId, 
      userId, 
      { completedTasks, notes }
    );

    return res.status(200).json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    logger.error('Update plan progress failed', { userId: req.user.id, planId: req.params.planId, error: error.message, stack: error.stack });
    
    if (error.message === 'Plan not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

/**
 * POST /api/improvement-plan/:planId/complete
 * Mark an improvement plan as completed
 */
router.post('/:planId/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    const completedPlan = await ImprovementPlanService.markPlanCompleted(planId, userId);

    return res.status(200).json({
      success: true,
      data: completedPlan
    });
  } catch (error) {
    logger.error('Mark plan as completed failed', { userId: req.user.id, planId: req.params.planId, error: error.message, stack: error.stack });
    
    if (error.message.includes('Plan not found')) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to mark plan as completed'
    });
  }
});

export default router;
