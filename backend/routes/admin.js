import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, requireAdmin, invalidateUserRole } from '../middleware/auth.ts';
import { normalizeInterviewLimits, generateInterviewToken } from '../utils/privateInterviewAccess.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const adminLogger = createLogger('admin-audit');

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

    // Users by subscription tier (capped with .limit() to prevent full table scan on admin stats load)
    const { data: tierData } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .limit(10000);
    
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
      .order('created_at', { ascending: true })
      .limit(5000);

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
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, subscription_tier, experience_level, created_at, last_login', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (tier) query = query.eq('subscription_tier', tier);
    if (search) query = query.ilike('full_name', `%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

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
      page: parsedPage,
      totalPages: Math.ceil((count || 0) / parsedLimit),
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

    const allowedRoles = ['user', 'admin', 'hr', 'employer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(', ')}` });
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
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Evict cached role immediately to prevent stale permissions
    invalidateUserRole(id);

    adminLogger.info('ADMIN_ROLE_UPDATED', {
      adminId: req.user.id,
      targetUserId: id,
      newRole: role,
      ip: req.ip,
      requestId: req.requestId,
    });

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

    adminLogger.warn('ADMIN_USER_DELETED', {
      adminId: req.user.id,
      targetUserId: id,
      ip: req.ip,
      requestId: req.requestId,
    });

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
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

    if (type === 'posts') {
      const { data: posts, count, error } = await supabaseAdmin
        .from('community_posts')
        .select('id, title, content, tags, likes, replies, created_at, user_id, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parsedLimit - 1);

      if (error) throw error;

      res.json({ items: posts || [], total: count || 0, type: 'posts', page: parsedPage, totalPages: Math.ceil((count || 0) / parsedLimit) });
    } else if (type === 'replies') {
      const { data: replies, count, error } = await supabaseAdmin
        .from('community_replies')
        .select('id, content, likes, created_at, user_id, post_id, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parsedLimit - 1);

      if (error) throw error;

      res.json({ items: replies || [], total: count || 0, type: 'replies', page: parsedPage, totalPages: Math.ceil((count || 0) / parsedLimit) });
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

    adminLogger.warn('ADMIN_CONTENT_DELETED', {
      adminId: req.user.id,
      contentType: type,
      contentId: id,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.json({ message: `${type} deleted successfully` });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// ─── Admin Interview Question Sets ──────────────────────────────

// Generates standard UUID tokens for candidate assessment links (e.g., /app?token=40247bbf-cace-43da-8a0e-87fe703b9f7f)
const generateShareCode = () => generateInterviewToken();

const VALID_INTERVIEW_TYPES = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed', 'hr'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

// ─── Create Question Set ─────────────────────────────────────────
router.post('/question-sets', async (req, res) => {
  try {
    const {
      title, description, interviewType = 'technical',
      difficulty = 'medium', requiresLogin = false,
      questions = [], settings = {}, passcode = '', expiresAt = null, maxAttempts = null,
      allowedEmails = [], role = '', roleName = ''
    } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
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
      if (!q || typeof q.question !== 'string' || !q.question.trim()) {
        throw new Error(`Question ${i + 1} is missing question text`);
      }
      return {
        question: q.question.trim(),
        context: typeof q.context === 'string' ? q.context.trim() : '',
        expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics : [],
        timeLimit: Number(q.timeLimit) || 120,
      };
    });

    const shareCode = generateShareCode();
    const accessLimits = normalizeInterviewLimits({ passcode, expiresAt, maxAttempts, allowedEmails });
    const mergedSettings = { ...settings };
    const rawRoleName = typeof roleName === 'string' && roleName.trim() ? roleName : (typeof role === 'string' ? role : '');
    if (rawRoleName.trim()) {
      mergedSettings.roleName = rawRoleName.trim();
    }
    if (accessLimits.allowed_emails) {
      mergedSettings.allowedEmails = accessLimits.allowed_emails;
    }

    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .insert({
        admin_id: req.user.id,
        title: title.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : null,
        share_code: shareCode,
        interview_type: interviewType,
        difficulty,
        requires_login: requiresLogin,
        questions: validatedQuestions,
        settings: mergedSettings,
        ...accessLimits,
      })
      .select()
      .single();

    if (error) throw error;

    const { passcode_hash: _passcodeHash, ...safeQuestionSet } = data;
    res.status(201).json({ questionSet: safeQuestionSet, shareCode: data.share_code, token: data.share_code });
  } catch (error) {
    console.error('Create question set error:', error);
    const message = /^(Question|Passcode|Expiry|Maximum attempts|Invalid email)/i.test(error.message || '')
      ? error.message
      : 'Failed to create question set';
    res.status(400).json({ error: message });
  }
});

// ─── List Question Sets ──────────────────────────────────────────
router.get('/question-sets', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

    const { data, count, error } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, is_active, questions, settings, passcode_hash, expires_at, max_attempts, attempts_started, allowed_emails, created_at, updated_at', { count: 'exact' })
      .eq('admin_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

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

    const setsWithCounts = (data || []).map(({ passcode_hash: passcodeHash, ...s }) => {
      const allowlist = Array.isArray(s.allowed_emails) && s.allowed_emails.length > 0
        ? s.allowed_emails
        : (Array.isArray(s.settings?.allowedEmails) ? s.settings.allowedEmails : []);

      return {
        ...s,
        has_passcode: Boolean(passcodeHash),
        has_allowlist: allowlist.length > 0,
        allowed_emails: allowlist,
        roleName: s.settings?.roleName || '',
        questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
        submissionCount: submissionCounts[s.id] || 0,
      };
    });

    res.json({
      questionSets: setsWithCounts,
      total: count || 0,
      page: parsedPage,
      totalPages: Math.ceil((count || 0) / parsedLimit),
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
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, is_active, questions, settings, expires_at, max_attempts, attempts_started, allowed_emails, created_at, updated_at, passcode_hash')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const { passcode_hash: passcodeHash, ...safeQuestionSet } = data;
    const allowlist = Array.isArray(safeQuestionSet.allowed_emails) && safeQuestionSet.allowed_emails.length > 0
      ? safeQuestionSet.allowed_emails
      : (Array.isArray(safeQuestionSet.settings?.allowedEmails) ? safeQuestionSet.settings.allowedEmails : []);

    res.json({
      questionSet: {
        ...safeQuestionSet,
        has_passcode: Boolean(passcodeHash),
        has_allowlist: allowlist.length > 0,
        allowed_emails: allowlist,
        roleName: safeQuestionSet.settings?.roleName || '',
      }
    });
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
      requiresLogin, isActive, questions, settings,
      passcode, clearPasscode, expiresAt, maxAttempts,
      allowedEmails, role, roleName
    } = req.body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, passcode_hash, settings')
      .eq('id', req.params.id)
      .eq('admin_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      updates.title = title.trim();
    }
    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string' });
      }
      updates.description = typeof description === 'string' && description.trim() ? description.trim() : null;
    }
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

    const mergedSettings = { ...(existing.settings || {}), ...(settings || {}) };
    if (role !== undefined || roleName !== undefined) {
      const rawRoleName = typeof roleName === 'string' && roleName.trim() ? roleName : (typeof role === 'string' ? role : '');
      mergedSettings.roleName = rawRoleName.trim();
    }
    if (allowedEmails !== undefined) {
      const accessLimits = normalizeInterviewLimits({ allowedEmails }, { isUpdate: true });
      Object.assign(updates, accessLimits);
      if (accessLimits.allowed_emails !== undefined) {
        mergedSettings.allowedEmails = accessLimits.allowed_emails;
      }
    }
    updates.settings = mergedSettings;

    if (clearPasscode === true) {
      updates.passcode_hash = null;
    } else if (passcode !== undefined) {
      Object.assign(updates, normalizeInterviewLimits({ passcode }, { isUpdate: true }));
    }
    if (expiresAt !== undefined || maxAttempts !== undefined) {
      Object.assign(updates, normalizeInterviewLimits({ expiresAt, maxAttempts }, { isUpdate: true }));
    }
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one question is required' });
      }
      if (questions.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 questions per set' });
      }
      updates.questions = questions.map((q, i) => {
        if (!q || typeof q.question !== 'string' || !q.question.trim()) {
          throw new Error(`Question ${i + 1} is missing question text`);
        }
        return {
          question: q.question.trim(),
          context: typeof q.context === 'string' ? q.context.trim() : '',
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

    const { passcode_hash: passcodeHash, ...safeQuestionSet } = data;
    res.json({ questionSet: { ...safeQuestionSet, has_passcode: Boolean(passcodeHash) } });
  } catch (error) {
    console.error('Update question set error:', error);
    const message = /^(Question|Passcode|Expiry|Maximum attempts|Invalid email)/i.test(error.message || '')
      ? error.message
      : 'Failed to update question set';
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
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

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
      .select('id, user_id, user_name, user_email, responses, scores, overall_score, duration, completed_at, created_at', { count: 'exact' })
      .eq('question_set_id', req.params.id)
      .order('completed_at', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

    if (error) throw error;

    res.json({
      questionSetTitle: existing.title,
      submissions: submissions || [],
      total: count || 0,
      page: parsedPage,
      totalPages: Math.ceil((count || 0) / parsedLimit),
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ─── #11 Interview Telemetry Metrics (7-day dashboard) ───────────
router.get('/interview-metrics', async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(req.query.days, 10) || 7));
    const sinceDate = new Date(Date.now() - days * 86400000).toISOString();

    // Query interview sessions within timeframe
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, status, interview_type, difficulty, interview_score, questions_asked, total_duration_seconds, created_at, completed_at, performance_metrics')
      .gte('created_at', sinceDate);

    if (sessionsError) throw sessionsError;

    const sessionList = sessions || [];
    const completedSessions = sessionList.filter(s => s.status === 'completed');

    const totalSessions = sessionList.length;
    const totalCompleted = completedSessions.length;
    const completionRate = totalSessions > 0 ? Number((totalCompleted / totalSessions).toFixed(2)) : 0;

    const scores = completedSessions
      .map(s => Number(s.interview_score))
      .filter(s => Number.isFinite(s));
    const averageScore = scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : null;

    const durations = completedSessions
      .map(s => Number(s.total_duration_seconds))
      .filter(d => Number.isFinite(d) && d > 0);
    const averageDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Type distribution
    const byType = {};
    for (const s of sessionList) {
      const type = s.interview_type || 'unspecified';
      byType[type] = (byType[type] || 0) + 1;
    }

    // Try fetching recent telemetry events for latency and grounding stats
    let telemetryEventsCount = 0;
    let avgTurnLatencyMs = null;
    let groundingHitRate = null;

    try {
      const { data: events, error: telemErr } = await supabaseAdmin
        .from('interview_telemetry_events')
        .select('event_name, payload, created_at')
        .gte('created_at', sinceDate)
        .limit(1000);

      if (!telemErr && Array.isArray(events)) {
        telemetryEventsCount = events.length;
        const latencies = events
          .map(e => Number(e?.payload?.latencyMs))
          .filter(l => Number.isFinite(l) && l > 0);
        if (latencies.length > 0) {
          avgTurnLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
        }
        const groundingEvents = events.filter(e => typeof e?.payload?.groundingHit === 'boolean');
        if (groundingEvents.length > 0) {
          const hits = groundingEvents.filter(e => e.payload.groundingHit).length;
          groundingHitRate = Number((hits / groundingEvents.length).toFixed(2));
        }
      }
    } catch {
      // Telemetry table may not yet be provisioned in all environments
    }

    res.json({
      success: true,
      timeframeDays: days,
      since: sinceDate,
      summary: {
        totalSessions,
        totalCompleted,
        completionRate,
        averageScore,
        averageDurationSeconds,
        telemetryEventsCount,
        avgTurnLatencyMs,
        groundingHitRate,
      },
      byType,
    });
  } catch (error) {
    adminLogger.error('Failed to get interview metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch interview metrics' });
  }
});

export default router;
