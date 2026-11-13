import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.ts';
import { createLogger } from '../utils/structuredLogger.js';
import { GamificationService } from '../services/gamificationService.ts';
import { WebhookDispatcher } from '../services/webhookDispatcher.ts';
import { validateRequest } from '../middleware/validation.js';
import { createPeerRoomSchema, matchPeerRoomSchema, peerRoomParamSchema } from '../schemas/requestSchemas.js';

const router = express.Router();
const logger = createLogger('peer-interview');

export const MAX_CODE_SNAPSHOT_LENGTH = 50000;
export const MAX_FEEDBACK_NOTES_LENGTH = 5000;

export function sanitizePeerInterviewScores(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const sanitized = {};
  for (const [key, val] of Object.entries(input)) {
    if (typeof key === 'string' && key.length <= 30 && /^[a-zA-Z0-9_]+$/.test(key)) {
      const num = Number(val);
      if (!isNaN(num) && Number.isFinite(num)) {
        sanitized[key] = Math.max(0, Math.min(100, Math.round(num * 10) / 10));
      }
    }
  }
  return sanitized;
}

function generateRoomCode() {
  return `PREP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * POST /api/peer-interview/create
 * Creates a new peer interview session room
 */
router.post('/create', authenticateToken, validateRequest({ body: createPeerRoomSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId = null, language = 'javascript' } = req.body;
    const roomCode = generateRoomCode();

    const { data: room, error } = await supabaseAdmin
      .from('peer_interview_rooms')
      .insert({
        room_code: roomCode,
        interviewer_id: userId,
        problem_id: problemId ? String(problemId) : null,
        language,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      // In local/test mode where the Supabase table may not be migrated yet, fallback gracefully
      logger.warn('Failed to insert peer room in DB, using ephemeral room', { error: error.message });
      return res.status(201).json({
        success: true,
        room: {
          id: `room_${Date.now()}`,
          room_code: roomCode,
          interviewer_id: userId,
          problem_id: problemId,
          language,
          status: 'waiting',
        },
      });
    }

    logger.info('Peer interview room created', { roomId: room.id, roomCode, userId });
    return res.status(201).json({ success: true, room });
  } catch (err) {
    logger.error('Error creating peer room', { error: err.message });
    return res.status(500).json({ error: 'Failed to create peer interview room' });
  }
});

/**
 * GET /api/peer-interview/:roomCode
 * Fetches room details by room code
 */
router.get('/:roomCode', authenticateToken, validateRequest({ params: peerRoomParamSchema }), async (req, res) => {
  try {
    const { roomCode } = req.params;

    const { data: room, error } = await supabaseAdmin
      .from('peer_interview_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (error || !room) {
      return res.status(404).json({ error: 'Peer interview room not found' });
    }

    return res.json({ success: true, room });
  } catch (err) {
    logger.error('Error fetching peer room', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch peer interview room' });
  }
});

/**
 * POST /api/peer-interview/:roomCode/join
 * Joins a peer interview room as candidate
 */
router.post('/:roomCode/join', authenticateToken, validateRequest({ params: peerRoomParamSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomCode } = req.params;

    const { data: room, error: fetchError } = await supabaseAdmin
      .from('peer_interview_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (fetchError || !room) {
      return res.status(404).json({ error: 'Peer interview room not found' });
    }

    if (room.status === 'completed' || room.status === 'cancelled') {
      return res.status(400).json({ error: 'This interview room is closed' });
    }

    // Set candidate if not set
    let updatedRoom = room;
    if (!room.candidate_id && room.interviewer_id !== userId) {
      const { data, error: updateError } = await supabaseAdmin
        .from('peer_interview_rooms')
        .update({
          candidate_id: userId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', room.id)
        .select()
        .single();

      if (!updateError && data) {
        updatedRoom = data;
      }
    }

    logger.info('User joined peer room', { roomCode, userId });
    return res.json({ success: true, room: updatedRoom });
  } catch (err) {
    logger.error('Error joining peer room', { error: err.message });
    return res.status(500).json({ error: 'Failed to join peer interview room' });
  }
});

/**
 * POST /api/peer-interview/:roomCode/complete
 * Completes the peer interview with score rubrics and feedback
 */
router.post('/:roomCode/complete', authenticateToken, validateRequest({ params: peerRoomParamSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomCode } = req.params;
    const { scores = {}, feedbackNotes = '', codeSnapshot = '' } = req.body;

    const { data: room, error: fetchError } = await supabaseAdmin
      .from('peer_interview_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (fetchError || !room) {
      return res.status(404).json({ error: 'Peer interview room not found' });
    }

    // Ownership check: must be a participant (interviewer or candidate) or an admin
    if (room.interviewer_id !== userId && room.candidate_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to complete this interview' });
    }

    const safeCodeSnapshot = typeof codeSnapshot === 'string' ? codeSnapshot.slice(0, MAX_CODE_SNAPSHOT_LENGTH) : '';
    const safeFeedbackNotes = typeof feedbackNotes === 'string' ? feedbackNotes.slice(0, MAX_FEEDBACK_NOTES_LENGTH) : '';
    const safeScores = sanitizePeerInterviewScores(scores);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('peer_interview_rooms')
      .update({
        status: 'completed',
        scores: safeScores,
        feedback_notes: safeFeedbackNotes,
        code_snapshot: safeCodeSnapshot,
        completed_at: new Date().toISOString(),
      })
      .eq('id', room.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to finalize peer interview' });
    }

    logger.info('Peer interview completed', { roomCode, userId, scores: safeScores });
    try {
      await GamificationService.recordActivity(userId, 'peer_interview');
      if (room.candidate_id && room.candidate_id !== userId) {
        await GamificationService.recordActivity(room.candidate_id, 'peer_interview');
      }
    } catch (gamificationErr) {
      logger.warn('Failed to record gamification activity', { error: gamificationErr.message });
    }

    // Dispatch webhook to subscribers
    try {
      await WebhookDispatcher.dispatchEvent('interview.completed', {
        type: 'peer_interview',
        roomCode,
        interviewerId: room.interviewer_id,
        candidateId: room.candidate_id,
        scores: safeScores,
        completedAt: updated.completed_at,
      }, userId);
    } catch (webhookErr) {
      logger.warn('Failed to dispatch webhook event', { error: webhookErr.message });
    }

    return res.json({ success: true, room: updated });
  } catch (err) {
    logger.error('Error completing peer room', { error: err.message });
    return res.status(500).json({ error: 'Failed to complete peer interview' });
  }
});


/**
 * POST /api/peer-interview/match
 * Match user into an existing open room or create a new waiting room
 */
router.post('/match', authenticateToken, validateRequest({ body: matchPeerRoomSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { language = 'javascript', problemId = null } = req.body;

    // 1. Search for an available waiting room
    const { data: openRooms, error: searchError } = await supabaseAdmin
      .from('peer_interview_rooms')
      .select('*')
      .eq('status', 'waiting')
      .neq('interviewer_id', userId)
      .is('candidate_id', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!searchError && openRooms && openRooms.length > 0) {
      const targetRoom = openRooms[0];
      const { data: joinedRoom, error: joinError } = await supabaseAdmin
        .from('peer_interview_rooms')
        .update({
          candidate_id: userId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', targetRoom.id)
        .is('candidate_id', null)
        .eq('status', 'waiting')
        .select()
        .single();

      if (!joinError && joinedRoom) {
        logger.info('User matched into open peer room', { roomId: joinedRoom.id, roomCode: joinedRoom.room_code, userId });
        return res.json({
          success: true,
          matched: true,
          role: 'candidate',
          room: joinedRoom,
        });
      }
    }

    // 2. No open room: create waiting room
    const roomCode = generateRoomCode();
    const { data: newRoom, error: createError } = await supabaseAdmin
      .from('peer_interview_rooms')
      .insert({
        room_code: roomCode,
        interviewer_id: userId,
        problem_id: problemId ? String(problemId) : null,
        language,
        status: 'waiting',
      })
      .select()
      .single();

    if (createError) {
      logger.warn('Failed to insert peer room in DB for match, using fallback', { error: createError.message });
      return res.status(201).json({
        success: true,
        matched: false,
        role: 'interviewer',
        room: {
          id: `room_${Date.now()}`,
          room_code: roomCode,
          interviewer_id: userId,
          problem_id: problemId,
          language,
          status: 'waiting',
        },
      });
    }

    logger.info('Match queue initialized new room', { roomId: newRoom.id, roomCode, userId });
    return res.status(201).json({
      success: true,
      matched: false,
      role: 'interviewer',
      room: newRoom,
    });
  } catch (err) {
    logger.error('Error during peer interview matching', { error: err.message });
    return res.status(500).json({ error: 'Failed to find or create peer interview match' });
  }
});

/**
 * POST /api/peer-interview/:roomCode/cancel
 * Cancels a waiting room if user leaves the lobby
 */
router.post('/:roomCode/cancel', authenticateToken, validateRequest({ params: peerRoomParamSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomCode } = req.params;

    const { data: updated, error } = await supabaseAdmin
      .from('peer_interview_rooms')
      .update({ status: 'cancelled' })
      .eq('room_code', roomCode)
      .eq('interviewer_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Could not cancel room' });
    }

    return res.json({ success: true, room: updated });
  } catch (err) {
    logger.error('Error cancelling peer room', { error: err.message });
    return res.status(500).json({ error: 'Failed to cancel peer room' });
  }
});

export default router;

