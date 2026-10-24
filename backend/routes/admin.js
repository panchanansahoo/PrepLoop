import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

// All admin routes require authentication + admin role
router.use(authenticateToken, requireAdmin);

// ─── Platform Stats ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Users by role
    const { count: adminCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    // New users this week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: newUsersWeek } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    // New users this month
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: newUsersMonth } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo);

    // Total submissions
    const { count: totalSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    // Total interviews
    const { count: totalInterviews } = await supabaseAdmin
      .from('mock_interviews')
      .select('*', { count: 'exact', head: true });

    // Total problems
    const { count: totalProblems } = await supabaseAdmin
      .from('problems')
      .select('*', { count: 'exact', head: true });

    // Total community posts
    const { count: totalPosts } = await supabaseAdmin
      .from('community_posts')
      .select('*', { count: 'exact', head: true });

    // Total resume analyses
    const { count: totalResumes } = await supabaseAdmin
      .from('resume_analyses')
      .select('*', { count: 'exact', head: true });

    // Users by subscription tier
    const { data: tierData } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier');
    
    const tierBreakdown = {};
    (tierData || []).forEach(p => {
      const tier = p.subscription_tier || 'free';
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
    });

    // User growth (last 30 days — daily signups)
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', monthAgo)
      .order('created_at', { ascending: true });

    const growthData = {};
    (recentUsers || []).forEach(u => {
      const day = new Date(u.created_at).toISOString().split('T')[0];
      growthData[day] = (growthData[day] || 0) + 1;
    });

    res.json({
      totalUsers: totalUsers || 0,
      adminCount: adminCount || 0,
      newUsersWeek: newUsersWeek || 0,
      newUsersMonth: newUsersMonth || 0,
      totalSubmissions: totalSubmissions || 0,
      totalInterviews: totalInterviews || 0,
      totalProblems: totalProblems || 0,
      totalPosts: totalPosts || 0,
      totalResumes: totalResumes || 0,
      tierBreakdown,
      growthData,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({
        error: 'Admin stats are temporarily unavailable due to profile access issue',
        degraded: true,
      });
    }
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ─── List Users ──────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, role, tier, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, subscription_tier, experience_level, created_at, last_login', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (tier) query = query.eq('subscription_tier', tier);
    if (search) query = query.ilike('full_name', `%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    const { data: users, count, error } = await query;

    if (error) throw error;

    // Note: N+1 unavoidable — Supabase Auth has no batch endpoint
    const userIds = (users || []).map(u => u.id);
    const authEmailMap = {};
    if (userIds.length > 0) {
      await Promise.all(
        userIds.map(async (id) => {
          try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id);
            authEmailMap[id] = authUser?.email || 'N/A';
          } catch {
            authEmailMap[id] = 'N/A';
          }
        })
      );
    }
    const usersWithEmail = (users || []).map(u => ({ ...u, email: authEmailMap[u.id] || 'N/A' }));

    res.json({
      users: usersWithEmail,
      total: count || 0,
      page: parseInt(page, 10),
      totalPages: Math.ceil((count || 0) / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({
        error: 'User listing is temporarily unavailable due to profile access issue',
        degraded: true,
      });
    }
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── Update User Role ────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' });
    }

    // Prevent self-demotion
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `User role updated to ${role}`, user: data });
  } catch (error) {
    console.error('Update role error:', error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({
        error: 'Role update is temporarily unavailable due to profile access issue',
        degraded: true,
      });
    }
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ─── Delete (Ban) User ───────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Delete from Supabase Auth (cascades to profiles via FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── Content Moderation ──────────────────────────────────────────
router.get('/content', async (req, res) => {
  try {
    const { type = 'posts', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    if (type === 'posts') {
      const { data: posts, count, error } = await supabaseAdmin
        .from('community_posts')
        .select('id, title, content, tags, likes, replies, created_at, user_id, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1);

      if (error) throw error;

      res.json({ items: posts || [], total: count || 0, type: 'posts' });
    } else if (type === 'replies') {
      const { data: replies, count, error } = await supabaseAdmin
        .from('community_replies')
        .select('id, content, likes, created_at, user_id, post_id, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1);

      if (error) throw error;

      res.json({ items: replies || [], total: count || 0, type: 'replies' });
    } else {
      res.status(400).json({ error: 'Invalid content type. Use "posts" or "replies"' });
    }
  } catch (error) {
    console.error('Content moderation error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// ─── Delete Content ──────────────────────────────────────────────
router.delete('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    let table;
    if (type === 'post') table = 'community_posts';
    else if (type === 'reply') table = 'community_replies';
    else return res.status(400).json({ error: 'Invalid type. Use "post" or "reply"' });

    // Fix #12: don't parseInt UUID ids — use the raw string
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: `${type} deleted successfully` });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// ─── Admin Interview Question Sets ──────────────────────────────

const generateShareCode = () => crypto.randomBytes(6).toString('base64url').slice(0, 10);

const VALID_INTERVIEW_TYPES = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed', 'hr'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

// ─── Create Question Set ─────────────────────────────────────────
router.post('/question-sets', async (req, res) => {
  try {
    const {
      title, description, interviewType = 'technical',
      difficulty = 'medium', requiresLogin = true,
      questions = [], settings = {}
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    if (questions.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 questions per set' });
    }

    if (!VALID_INTERVIEW_TYPES.includes(interviewType)) {
      return res.status(400).json({ error: 'Invalid interview type', validTypes: VALID_INTERVIEW_TYPES });
    }

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty', validDifficulties: VALID_DIFFICULTIES });
    }

    // Validate each question has at least a question text
    const validatedQuestions = questions.map((q, i) => {
      if (!q.question || !q.question.trim()) {
        throw new Error(`Question ${i + 1} is missing question text`);
      }
      return {
        question: q.question.trim(),
        context: q.context?.trim() || '',
        expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics : [],
        timeLimit: Number(q.timeLimit) || 120,
      };
    });

    const shareCode = generateShareCode();

    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .insert({
        admin_id: req.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        share_code: shareCode,
        interview_type: interviewType,
        difficulty,
        requires_login: requiresLogin,
        questions: validatedQuestions,
        settings: settings || {},
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ questionSet: data, shareCode: data.share_code });
  } catch (error) {
    console.error('Create question set error:', error);
    const message = error.message?.startsWith('Question') ? error.message : 'Failed to create question set';
    res.status(400).json({ error: message });
  }
});

// ─── List Question Sets ──────────────────────────────────────────
router.get('/question-sets', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { data, count, error } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, is_active, questions, settings, created_at, updated_at', { count: 'exact' })
      .eq('admin_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) throw error;

    // Also get submission counts for each set
    const setIds = (data || []).map(s => s.id);
    const submissionCounts = {};
    if (setIds.length > 0) {
      const { data: countData } = await supabaseAdmin
        .from('admin_interview_submissions')
        .select('question_set_id')
        .in('question_set_id', setIds);

      (countData || []).forEach(s => {
        submissionCounts[s.question_set_id] = (submissionCounts[s.question_set_id] || 0) + 1;
      });
    }

    const setsWithCounts = (data || []).map(s => ({
      ...s,
      questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
      submissionCount: submissionCounts[s.id] || 0,
    }));

    res.json({
      questionSets: setsWithCounts,
      total: count || 0,
      page: parseInt(page, 10),
      totalPages: Math.ceil((count || 0) / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('List question sets error:', error);
    res.status(500).json({ error: 'Failed to fetch question sets' });
  }
});

// ─── Get Question Set Detail ─────────────────────────────────────
router.get('/question-sets/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .select('*')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    res.json({ questionSet: data });
  } catch (error) {
    console.error('Get question set error:', error);
    res.status(500).json({ error: 'Failed to fetch question set' });
  }
});

// ─── Update Question Set ─────────────────────────────────────────
router.put('/question-sets/:id', async (req, res) => {
  try {
    const {
      title, description, interviewType, difficulty,
      requiresLogin, isActive, questions, settings
    } = req.body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (interviewType !== undefined) {
      if (!VALID_INTERVIEW_TYPES.includes(interviewType)) {
        return res.status(400).json({ error: 'Invalid interview type' });
      }
      updates.interview_type = interviewType;
    }
    if (difficulty !== undefined) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty' });
      }
      updates.difficulty = difficulty;
    }
    if (requiresLogin !== undefined) updates.requires_login = requiresLogin;
    if (isActive !== undefined) updates.is_active = isActive;
    if (settings !== undefined) updates.settings = settings;
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one question is required' });
      }
      if (questions.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 questions per set' });
      }
      updates.questions = questions.map((q, i) => {
        if (!q.question || !q.question.trim()) {
          throw new Error(`Question ${i + 1} is missing question text`);
        }
        return {
          question: q.question.trim(),
          context: q.context?.trim() || '',
          expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics : [],
          timeLimit: Number(q.timeLimit) || 120,
        };
      });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ questionSet: data });
  } catch (error) {
    console.error('Update question set error:', error);
    const message = error.message?.startsWith('Question') ? error.message : 'Failed to update question set';
    res.status(400).json({ error: message });
  }
});

// ─── Delete Question Set ─────────────────────────────────────────
router.delete('/question-sets/:id', async (req, res) => {
  try {
    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const { error } = await supabaseAdmin
      .from('admin_question_sets')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Question set deleted successfully' });
  } catch (error) {
    console.error('Delete question set error:', error);
    res.status(500).json({ error: 'Failed to delete question set' });
  }
});

// ─── Get Submissions for a Question Set ──────────────────────────
router.get('/question-sets/:id/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const { data: submissions, count, error } = await supabaseAdmin
      .from('admin_interview_submissions')
      .select('id, user_id, user_name, user_email, scores, overall_score, duration, completed_at, created_at', { count: 'exact' })
      .eq('question_set_id', req.params.id)
      .order('completed_at', { ascending: false })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) throw error;

    res.json({
      questionSetTitle: existing.title,
      submissions: submissions || [],
      total: count || 0,
      page: parseInt(page, 10),
      totalPages: Math.ceil((count || 0) / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default router;
