import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/index.js';
import { ImprovementPlanService } from '../services/improvementPlanService.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('ImprovementPlan-Routes');

/**
 * POST /api/improvement-plan/generate
 * Generate personalized improvement plan based on interview history
 */
router.post('/generate', authenticateToken, async (req, res) => {
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
    logger.error('Improvement plan generation failed', { error: error.message });
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

    const { data: plan, error } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: plan || null
    });
  } catch (error) {
    logger.error('Fetch latest plan failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement plan'
    });
  }
});

/**
 * GET /api/improvement-plan/history
 * Get user's improvement plan history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const { data: plans, error } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: plans || []
    });
  } catch (error) {
    logger.error('Fetch plan history failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plan history'
    });
  }
});

/**
 * POST /api/improvement-plan/:planId/progress
 * Update progress on an improvement plan
 */
router.post('/:planId/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;
    const { completedTasks, notes } = req.body;

    const { data: plan, error: fetchError } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('improvement_plans')
      .update({
        progress: {
          ...(plan.progress || {}),
          completedTasks: completedTasks || [],
          lastUpdated: new Date().toISOString(),
          notes: notes || ''
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('Update plan progress failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

export default router;
