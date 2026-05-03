import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/interview-experiences?company=Google&role=SDE&page=1
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { company, role, difficulty, page = 1 } = req.query;
    const limit = 10;
    const offset = (parseInt(page) - 1) * limit;

    let query = supabaseAdmin
      .from('interview_experiences')
      .select('id, company, role, difficulty, round_type, experience_text, outcome, yoe, created_at, upvotes, profiles(full_name, username)', { count: 'exact' })
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (company) query = query.ilike('company', `%${company}%`);
    if (role) query = query.ilike('role', `%${role}%`);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ experiences: data || [], total: count || 0, page: parseInt(page), hasMore: offset + limit < (count || 0) });
  } catch (err) {
    console.error('Interview experiences error:', err);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

// POST /api/interview-experiences — submit a new experience
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { company, role, difficulty, round_type, experience_text, outcome, yoe, is_anonymous = true } = req.body;

    if (!company || !role || !experience_text || experience_text.length < 50) {
      return res.status(400).json({ error: 'company, role, and experience_text (min 50 chars) are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('interview_experiences')
      .insert({
        user_id: req.user.id,
        company: company.trim(),
        role: role.trim(),
        difficulty: difficulty || 'medium',
        round_type: round_type || 'technical',
        experience_text: experience_text.trim(),
        outcome: outcome || 'unknown',
        yoe: parseInt(yoe) || 0,
        is_anonymous,
        is_approved: true, // auto-approve; add moderation later
        upvotes: 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Submit experience error:', err);
    res.status(500).json({ error: 'Failed to submit experience' });
  }
});

// POST /api/interview-experiences/:id/upvote
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already upvoted
    const { data: existing } = await supabaseAdmin
      .from('experience_upvotes')
      .select('id')
      .eq('experience_id', id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Remove upvote
      await supabaseAdmin.from('experience_upvotes').delete().eq('experience_id', id).eq('user_id', userId);
      await supabaseAdmin.rpc('decrement_experience_upvotes', { exp_id: id });
      return res.json({ upvoted: false });
    }

    await supabaseAdmin.from('experience_upvotes').insert({ experience_id: id, user_id: userId });
    await supabaseAdmin.rpc('increment_experience_upvotes', { exp_id: id });
    res.json({ upvoted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

export default router;
