import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, requireEmployerOrAdmin } from '../middleware/auth.ts';
import { createLogger } from '../utils/structuredLogger.js';
import { WebhookDispatcher } from '../services/webhookDispatcher.ts';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createApiKeySchema, createWebhookSchema, createQuestionBankSchema } from '../schemas/requestSchemas.js';
import { validateOutboundUrl } from '../utils/ssrfGuard.js';

const router = express.Router();
const logger = createLogger('employer-portal');

// Enforce authentication and employer/admin role across all employer endpoints
router.use(authenticateToken, requireEmployerOrAdmin);

/**
 * GET /api/employer/candidates
 * Retrieve candidate screening pipeline and completed assessment reports
 */
router.get('/candidates', authenticateToken, async (req, res) => {
  try {
    let { data: candidates, error } = await supabaseAdmin
      .from('mock_interviews')
      .select(`
        id,
        user_id,
        interview_type,
        overall_score,
        completed_at,
        started_at,
        profiles!mock_interviews_user_id_fkey(full_name, email, skills, designation)
      `)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(50);

    // Fallback if the foreign key relation constraint name is not explicitly defined in some environments
    if (error && error.message && error.message.includes('mock_interviews_user_id_fkey')) {
      const fallback = await supabaseAdmin
        .from('mock_interviews')
        .select(`
          id,
          user_id,
          interview_type,
          overall_score,
          completed_at,
          started_at,
          profiles(full_name, email, skills, designation)
        `)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(50);
      if (!fallback.error) {
        candidates = fallback.data;
        error = null;
      }
    }

    if (error) {
      logger.warn('Failed to query candidate pipeline, returning empty list', { error: error.message });
      return res.json({ success: true, candidates: [] });
    }

    const formatted = (candidates || []).map((c) => ({
      interviewId: c.id,
      candidateId: c.user_id,
      name: c.profiles?.full_name || 'Anonymous Candidate',
      email: c.profiles?.email || null,
      skills: c.profiles?.skills || [],
      roleApplied: c.interview_type || c.role || 'Software Engineer',
      overallScore: c.overall_score ?? c.score ?? 75,
      completedAt: c.completed_at || c.started_at || c.created_at || null,
    }));

    return res.json({ success: true, count: formatted.length, candidates: formatted });
  } catch (err) {
    logger.error('Error fetching candidate pipeline', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch candidate pipeline' });
  }
});

/**
 * POST /api/employer/question-banks
 * Create corporate question set for structured screening rounds
 */
router.post('/question-banks', authenticateToken, validateRequest({ body: createQuestionBankSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, companyName = 'Enterprise Partner', role = 'Software Engineer', questions = [] } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Title and questions array are required' });
    }

    const { data: set, error } = await supabaseAdmin
      .from('custom_question_sets')
      .insert({
        title,
        company: companyName,
        role,
        questions,
        created_by: userId,
        is_published: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to save corporate question set' });
    }

    logger.info('Corporate question set published', { setId: set.id, title, userId });
    return res.status(201).json({ success: true, questionSet: set });
  } catch (err) {
    logger.error('Error creating question set', { error: err.message });
    return res.status(500).json({ error: 'Failed to create question set' });
  }
});

/**
 * GET /api/employer/question-banks
 * List corporate question sets created by the current employer
 */
router.get('/question-banks', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: questionSets, error } = await supabaseAdmin
      .from('custom_question_sets')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn('Failed to fetch custom question sets from DB', { error: error.message });
      return res.json({ success: true, questionSets: [] });
    }

    return res.json({ success: true, questionSets: questionSets || [] });
  } catch (err) {
    logger.error('Error fetching question sets', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch question sets' });
  }
}));

/**
 * POST /api/employer/webhooks
 * Register a webhook endpoint for candidate completion telemetry
 */
router.post('/webhooks', authenticateToken, validateRequest({ body: createWebhookSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, events = ['interview.completed'] } = req.body;

    const urlValidation = validateOutboundUrl(url, { requireHttps: true });
    if (!urlValidation.safe) {
      return res.status(400).json({ error: urlValidation.error || 'A secure, valid public HTTPS URL is required for webhook deliveries' });
    }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const { data: sub, error } = await supabaseAdmin
      .from('webhook_subscriptions')
      .insert({
        user_id: userId,
        url,
        events,
        secret,
        is_active: true,
      })
      .select('id, url, events, is_active, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to register webhook subscription' });
    }

    logger.info('Registered webhook subscription', { subId: sub.id, url, userId });
    return res.status(201).json({
      success: true,
      subscription: sub,
      signingSecret: secret, // Shown only once upon registration
    });
  } catch (err) {
    logger.error('Error registering webhook', { error: err.message });
    return res.status(500).json({ error: 'Failed to register webhook' });
  }
});

/**
 * GET /api/employer/webhooks
 * List registered webhooks and recent deliveries
 */
router.get('/webhooks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: subscriptions } = await supabaseAdmin
      .from('webhook_subscriptions')
      .select('id, url, events, is_active, created_at')
      .eq('user_id', userId);

    return res.json({ success: true, subscriptions: subscriptions || [] });
  } catch (err) {
    logger.error('Error fetching webhooks', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

/**
 * POST /api/employer/api-keys
 * Generate platform API key for external integrations
 */
router.post('/api-keys', authenticateToken, validateRequest({ body: createApiKeySchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name = 'Default API Key', scopes = ['interviews:read'] } = req.body;

    const rawKey = `pl_live_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawKey.slice(0, 10);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const { data: apiKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        prefix,
        scopes,
        is_active: true,
      })
      .select('id, name, prefix, scopes, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to generate API Key' });
    }

    return res.status(201).json({
      success: true,
      apiKey: {
        ...apiKey,
        key: rawKey, // Only shown once
      },
    });
  } catch (err) {
    logger.error('Error generating API key', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate API Key' });
  }
});


/**
 * GET /api/employer/api-keys
 * List active platform API keys for external integrations
 */
router.get('/api-keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, prefix, scopes, is_active, last_used_at, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to retrieve API keys' });
    }

    return res.json({ success: true, apiKeys: keys || [] });
  } catch (err) {
    logger.error('Error fetching API keys', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * DELETE /api/employer/api-keys/:id
 * Revoke/deactivate an API key
 */
router.delete('/api-keys/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'API key not found or already revoked' });
    }

    logger.info('API key revoked', { keyId: id, userId });
    return res.json({ success: true, message: 'API key successfully revoked' });
  } catch (err) {
    logger.error('Error revoking API key', { error: err.message });
    return res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/**
 * DELETE /api/employer/webhooks/:id
 * Delete a webhook subscription
 */
router.delete('/webhooks/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('webhook_subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    logger.info('Webhook subscription deleted', { webhookId: id, userId });
    return res.json({ success: true, message: 'Webhook subscription deleted' });
  } catch (err) {
    logger.error('Error deleting webhook', { error: err.message });
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * POST /api/employer/webhooks/:id/test
 * Send a test webhook event to verify external endpoint receipt
 */
router.post('/webhooks/:id/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: sub, error } = await supabaseAdmin
      .from('webhook_subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !sub) {
      return res.status(404).json({ error: 'Webhook subscription not found' });
    }

    const testPayload = {
      mockInterviewId: `mock_${Date.now()}`,
      candidateEmail: 'candidate.test@example.com',
      role: 'Software Engineer',
      overallScore: 88,
      completedAt: new Date().toISOString(),
      testPing: true,
    };

    const deliveryResult = await WebhookDispatcher.deliverToSubscription(sub, 'interview.completed', testPayload);

    return res.json({
      success: true,
      message: 'Test webhook dispatched',
      delivery: deliveryResult,
    });
  } catch (err) {
    logger.error('Error testing webhook', { error: err.message });
    return res.status(500).json({ error: 'Failed to dispatch test webhook' });
  }
});

export default router;

