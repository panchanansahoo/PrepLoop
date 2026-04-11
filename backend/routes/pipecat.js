import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { PipecatBridgeService } from '../services/pipecatBridgeService.js';

const router = express.Router();

/**
 * GET /api/pipecat/health
 * Check if Pipecat infrastructure is available.
 */
router.get('/health', async (_req, res) => {
  const health = PipecatBridgeService.health();
  const pythonCheck = await PipecatBridgeService.checkPythonAvailability();

  return res.status(200).json({
    success: true,
    data: {
      ...health,
      python: pythonCheck,
    },
  });
});

/**
 * POST /api/pipecat/session
 * Create a new Pipecat session and spawn the voice bot.
 */
router.post(
  '/session',
  optionalAuth,
  body('interviewMode').optional().isIn(['full_realtime']),
  body('company').optional().isString().trim(),
  body('role').optional().isString().trim(),
  body('stage').optional().isString().trim(),
  body('interviewerName').optional().isString().trim(),
  body('interviewerRole').optional().isString().trim(),
  body('gender').optional().isIn(['male', 'female']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('experienceLevel').optional().isString().trim(),
  body('totalQuestions').optional().isInt({ min: 1, max: 20 }),
  body('interviewerPersona').optional().isString().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = PipecatBridgeService.createSession({
      userId: req.user?.id || `guest-${Date.now()}`,
      interviewMode: req.body.interviewMode || 'full_realtime',
      interviewSessionId: req.body.interviewSessionId || null,
      interviewType: req.body.interviewType || null,
      difficulty: req.body.difficulty || null,
      company: req.body.company || null,
      role: req.body.role || null,
      stage: req.body.stage || null,
      interviewerName: req.body.interviewerName || null,
      interviewerRole: req.body.interviewerRole || null,
      gender: req.body.gender || null,
      interviewerPersona: req.body.interviewerPersona || null,
      experienceLevel: req.body.experienceLevel || null,
      totalQuestions: req.body.totalQuestions || 6,
      questions: req.body.questions || [],
      requestId: req.id,
    });

    if (!session.success) {
      return res.status(400).json({
        success: false,
        message: session.message,
        status: session.status,
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  }
);

/**
 * GET /api/pipecat/session/:sessionId
 * Get the status of an existing Pipecat session.
 */
router.get(
  '/session/:sessionId',
  optionalAuth,
  param('sessionId').isUUID(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const session = PipecatBridgeService.getSession(req.params.sessionId, req.user?.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Pipecat session not found or expired.',
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  }
);

/**
 * DELETE /api/pipecat/session/:sessionId
 * Close a Pipecat session and kill the associated bot process.
 */
router.delete(
  '/session/:sessionId',
  optionalAuth,
  param('sessionId').isUUID(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const closed = PipecatBridgeService.closeSession(req.params.sessionId, req.user?.id);
    if (!closed) {
      return res.status(404).json({
        success: false,
        message: 'Pipecat session not found or already closed.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pipecat session closed and bot stopped.',
    });
  }
);

export default router;
