/**
 * GDPR Compliance Routes
 *
 * Implements data subject rights as required by GDPR:
 *   - Right to access (data export)
 *   - Right to erasure (data deletion)
 *   - Consent management
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = Router();
const logger = createLogger('gdpr');

// All GDPR routes require authentication
router.use(authenticateToken);

/**
 * GET /api/gdpr/export
 * Right to access — Export all user data as JSON
 */
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;

    // Gather all user data from every table
    const [
      profile,
      activity,
      interviews,
      coinTransactions,
      improvementPlans,
      notes,
      blogPosts,
      communityPosts,
    ] = await Promise.allSettled([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('user_activity').select('*').eq('user_id', userId),
      supabaseAdmin.from('interview_history').select('*').eq('user_id', userId),
      supabaseAdmin.from('coin_transactions').select('*').eq('user_id', userId),
      supabaseAdmin.from('improvement_plans').select('*').eq('user_id', userId),
      supabaseAdmin.from('notes').select('*').eq('user_id', userId),
      supabaseAdmin.from('blog_posts').select('*').eq('author_id', userId),
      supabaseAdmin.from('community_posts').select('*').eq('user_id', userId),
    ]);

    const extractData = (result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        return result.value.data;
      }
      return null;
    };

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      email: req.user.email,
      profile: extractData(profile),
      activity: extractData(activity),
      interviews: extractData(interviews),
      coinTransactions: extractData(coinTransactions),
      improvementPlans: extractData(improvementPlans),
      notes: extractData(notes),
      blogPosts: extractData(blogPosts),
      communityPosts: extractData(communityPosts),
    };

    // Audit the export
    await auditLog(req, 'data_export', 'user', userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="preploop-data-export-${userId.slice(0, 8)}.json"`);
    return res.json(exportData);
  } catch (error) {
    logger.error('Data export failed', { userId: req.user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * DELETE /api/gdpr/delete
 * Right to erasure — Soft-delete user account
 * Data is marked for deletion and hard-deleted after 30 days
 */
router.delete('/delete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_DATA') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Send { "confirmation": "DELETE_MY_DATA" } to proceed',
      });
    }

    // Soft-delete: set deleted_at timestamp on profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        // Anonymize PII immediately
        display_name: '[Deleted User]',
        bio: null,
        avatar_url: null,
        phone: null,
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Soft-delete profile failed', { userId, error: updateError.message });
      return res.status(500).json({ error: 'Failed to process deletion request' });
    }

    // Record the deletion request
    await supabaseAdmin
      .from('data_export_requests')
      .insert({
        user_id: userId,
        request_type: 'deletion',
        status: 'pending',
        scheduled_hard_delete: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    // Audit the deletion
    await auditLog(req, 'data_delete', 'user', userId);

    return res.json({
      success: true,
      message: 'Your account has been scheduled for deletion. Data will be permanently removed within 30 days. You can contact support to cancel this request.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    logger.error('Data deletion failed', { userId: req.user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

/**
 * GET /api/gdpr/consent
 * Get user's consent preferences
 */
router.get('/consent', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('consent_preferences')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // Default consent preferences
    const defaults = {
      analytics: true,
      marketing_emails: false,
      third_party_sharing: false,
      performance_tracking: true,
      updated_at: null,
    };

    return res.json({
      consent: profile?.consent_preferences || defaults,
    });
  } catch (error) {
    logger.error('Failed to get consent', { userId: req.user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve consent preferences' });
  }
});

/**
 * PUT /api/gdpr/consent
 * Update user's consent preferences
 */
router.put('/consent', async (req, res) => {
  try {
    const { analytics, marketing_emails, third_party_sharing, performance_tracking } = req.body;

    const preferences = {
      analytics: analytics ?? true,
      marketing_emails: marketing_emails ?? false,
      third_party_sharing: third_party_sharing ?? false,
      performance_tracking: performance_tracking ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ consent_preferences: preferences })
      .eq('id', req.user.id);

    if (error) throw error;

    // Audit the consent change
    await auditLog(req, 'consent_update', 'user', req.user.id, preferences);

    return res.json({ success: true, consent: preferences });
  } catch (error) {
    logger.error('Failed to update consent', { userId: req.user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to update consent preferences' });
  }
});

export default router;
