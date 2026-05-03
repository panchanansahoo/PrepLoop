import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/peer-interview/slots — create availability slot
router.post('/slots', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, difficulty, scheduledAt, durationMinutes } = req.body;

    if (!topic || !scheduledAt) {
      return res.status(400).json({ error: 'Topic and scheduledAt are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('peer_interview_slots')
      .insert({
        user_id: userId,
        topic,
        difficulty: difficulty || 'medium',
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes || 45,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create peer slot error:', err);
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

// GET /api/peer-interview/slots — browse available slots
router.get('/slots', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const topic = req.query.topic;
    const difficulty = req.query.difficulty;

    let query = supabaseAdmin
      .from('peer_interview_slots')
      .select(`
        id, topic, difficulty, scheduled_at, duration_minutes, status, created_at,
        user_id, matched_user_id
      `)
      .or(`status.eq.open,user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (topic) query = query.eq('topic', topic);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with user names
    const userIds = [...new Set((data || []).flatMap(s => [s.user_id, s.matched_user_id].filter(Boolean)))];
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const enriched = (data || []).map(slot => ({
      ...slot,
      creator: profileMap[slot.user_id] ? {
        name: profileMap[slot.user_id].full_name || profileMap[slot.user_id].username || 'Anonymous',
        avatar_url: profileMap[slot.user_id].avatar_url,
      } : null,
      partner: slot.matched_user_id && profileMap[slot.matched_user_id] ? {
        name: profileMap[slot.matched_user_id].full_name || profileMap[slot.matched_user_id].username || 'Anonymous',
        avatar_url: profileMap[slot.matched_user_id].avatar_url,
      } : null,
      isOwn: slot.user_id === userId,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Browse peer slots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// POST /api/peer-interview/match — match with a slot
router.post('/match', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { slotId } = req.body;

    if (!slotId) return res.status(400).json({ error: 'slotId is required' });

    // Check slot is open and not own
    const { data: slot, error: fetchErr } = await supabaseAdmin
      .from('peer_interview_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (fetchErr || !slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.user_id === userId) return res.status(400).json({ error: 'Cannot match with your own slot' });
    if (slot.status !== 'open') return res.status(400).json({ error: 'Slot is no longer available' });

    const { data, error } = await supabaseAdmin
      .from('peer_interview_slots')
      .update({ matched_user_id: userId, status: 'matched' })
      .eq('id', slotId)
      .eq('status', 'open')
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Match peer slot error:', err);
    res.status(500).json({ error: 'Failed to match' });
  }
});

// POST /api/peer-interview/feedback — submit mutual feedback
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { slotId, toUserId, role, communicationScore, technicalScore, problemSolvingScore, overallScore, comments } = req.body;

    if (!slotId || !toUserId || !role) {
      return res.status(400).json({ error: 'slotId, toUserId, and role are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('peer_interview_feedback')
      .insert({
        slot_id: slotId,
        from_user_id: userId,
        to_user_id: toUserId,
        role,
        communication_score: communicationScore || 0,
        technical_score: technicalScore || 0,
        problem_solving_score: problemSolvingScore || 0,
        overall_score: overallScore || 0,
        comments: comments || '',
      })
      .select()
      .single();

    if (error) throw error;

    // Mark slot as completed if both have given feedback
    const { data: allFeedback } = await supabaseAdmin
      .from('peer_interview_feedback')
      .select('from_user_id')
      .eq('slot_id', slotId);

    if ((allFeedback || []).length >= 2) {
      await supabaseAdmin
        .from('peer_interview_slots')
        .update({ status: 'completed' })
        .eq('id', slotId);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Peer feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/peer-interview/my-feedback — user's received feedback
router.get('/my-feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('peer_interview_feedback')
      .select('*')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('My feedback error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;
