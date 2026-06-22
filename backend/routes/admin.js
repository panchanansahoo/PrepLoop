import express from 'express';
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

export default router;
