import express from 'express';
import crypto from 'crypto';
import { optionalAuth } from '../../middleware/auth.ts';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { evaluateBarRaiserDecision } from '../../services/hiringDecisionService.js';

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val.trim());
}

/**
 * POST /api/company-interview/multi-round/session
 * Create or resume a multi-round database session.
 */
router.post('/multi-round/session', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const {
      company = 'General',
      role = 'Software Engineer',
      sessionId = null,
      resume = false,
      _selectedRounds = []
    } = req.body || {};

    // 1. If resume requested, try to retrieve existing in-progress session
    if (resume) {
      if (sessionId && isValidUUID(sessionId)) {
        const { data: existing, error: findError } = await supabaseAdmin
          .from('multi_round_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (existing && !findError) {
          return res.json({
            success: true,
            resumed: true,
            session: existing
          });
        }
      } else if (userId) {
        // Find latest active session for this user and company
        const { data: latestActive, error: activeErr } = await supabaseAdmin
          .from('multi_round_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('company', company)
          .eq('status', 'in_progress')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestActive && !activeErr) {
          return res.json({
            success: true,
            resumed: true,
            session: latestActive
          });
        }
      }
    }

    // 2. Generate or validate session UUID
    const finalSessionId = isValidUUID(sessionId) ? sessionId : crypto.randomUUID();
    const now = new Date().toISOString();

    const sessionPayload = {
      id: finalSessionId,
      user_id: userId,
      company: String(company).trim(),
      role: String(role).trim(),
      current_round: 0,
      round_scores: [],
      status: 'in_progress',
      hiring_decision: null,
      created_at: now,
      updated_at: now
    };

    // If unauthenticated / guest user
    if (!userId) {
      return res.status(200).json({
        success: true,
        guest: true,
        created: true,
        session: sessionPayload,
        message: 'Guest session initialized'
      });
    }

    // 3. Save to database for authenticated user
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('multi_round_sessions')
      .insert(sessionPayload)
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn('[multi-round] DB insert warning, falling back to payload:', insertError.message);
      return res.status(200).json({
        success: true,
        created: true,
        session: sessionPayload,
        dbSync: false,
        warning: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      created: true,
      session: inserted || sessionPayload
    });
  } catch (err) {
    console.error('[multi-round] Error initializing session:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create or resume multi-round session',
      details: err?.message
    });
  }
});

/**
 * PUT /api/company-interview/multi-round/session/:id
 * Checkpoint completed round, save round score and feedback,
 * and execute Bar-Raiser veto evaluation upon loop completion.
 */
router.put('/multi-round/session/:id', optionalAuth, async (req, res) => {
  try {
    const sessionId = String(req.params.id || '').trim();
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const userId = req.user?.id || null;
    const {
      roundScore,
      roundScores,
      current_round,
      currentRound,
      status,
      completed,
      totalRounds,
      company,
      role
    } = req.body || {};

    // 1. Fetch existing session if stored in DB
    let existingSession = null;
    if (isValidUUID(sessionId)) {
      const { data, error } = await supabaseAdmin
        .from('multi_round_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (!error && data) {
        existingSession = data;
      }
    }

    // 2. Aggregate updated round scores
    let updatedScores = [];
    if (Array.isArray(roundScores)) {
      updatedScores = roundScores;
    } else if (roundScore && typeof roundScore === 'object') {
      const prev = Array.isArray(existingSession?.round_scores) ? existingSession.round_scores : [];
      updatedScores = [...prev, roundScore];
    } else if (Array.isArray(existingSession?.round_scores)) {
      updatedScores = existingSession.round_scores;
    }

    // 3. Compute next current_round
    const nextRound = current_round !== undefined
      ? Number(current_round)
      : (currentRound !== undefined ? Number(currentRound) : updatedScores.length);

    // 4. Determine completion & Bar-Raiser veto decision
    const totalRoundsNum = Number(totalRounds);
    const isCompleted = status === 'completed' ||
      completed === true ||
      (Number.isInteger(totalRoundsNum) && totalRoundsNum > 0 && nextRound >= totalRoundsNum);

    const finalStatus = isCompleted ? 'completed' : (status || existingSession?.status || 'in_progress');

    let hiringDecision = existingSession?.hiring_decision || null;
    if (isCompleted || updatedScores.length > 0) {
      hiringDecision = evaluateBarRaiserDecision({
        roundScores: updatedScores,
        company: company || existingSession?.company || '',
        role: role || existingSession?.role || ''
      });
    }

    const now = new Date().toISOString();
    const updatePayload = {
      current_round: nextRound,
      round_scores: updatedScores,
      status: finalStatus,
      hiring_decision: hiringDecision,
      updated_at: now
    };

    // If session exists in DB and user is authenticated
    if (existingSession && userId) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('multi_round_sessions')
        .update(updatePayload)
        .eq('id', sessionId)
        .select()
        .maybeSingle();

      if (!updateError && updated) {
        return res.json({
          success: true,
          session: updated,
          hiringDecision
        });
      }
    }

    // Guest, offline, or fallback response
    return res.json({
      success: true,
      guest: !userId,
      session: {
        id: sessionId,
        user_id: userId,
        company: company || existingSession?.company || 'General',
        role: role || existingSession?.role || 'Software Engineer',
        ...updatePayload
      },
      hiringDecision
    });
  } catch (err) {
    console.error('[multi-round] Error updating session checkpoint:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to checkpoint multi-round session',
      details: err?.message
    });
  }
});

/**
 * GET /api/company-interview/multi-round/session/:id
 * Retrieve session state and current scores/hiring decision.
 */
router.get('/multi-round/session/:id', optionalAuth, async (req, res) => {
  try {
    const sessionId = String(req.params.id || '').trim();
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    if (!isValidUUID(sessionId)) {
      return res.status(404).json({ success: false, error: 'Multi-round session not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('multi_round_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST205' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist')
      ) {
        return res.status(404).json({ success: false, error: 'Multi-round session not found' });
      }
      console.error('[multi-round] DB query error on session retrieval:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to retrieve multi-round session' });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Multi-round session not found' });
    }

    // Optional user authorization check: if user_id is set, ensure matching user
    if (data.user_id && req.user?.id && data.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied to multi-round session' });
    }

    return res.json({
      success: true,
      session: data
    });
  } catch (err) {
    console.error('[multi-round] Error fetching session:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve multi-round session',
      details: err?.message
    });
  }
});

export default router;
