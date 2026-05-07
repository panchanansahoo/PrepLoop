import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/leaderboard?type=weekly|alltime&limit=20
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const type = req.query.type === 'alltime' ? 'alltime' : 'weekly';

    const orderCol = type === 'weekly' ? 'weekly_score' : 'coins';
    const query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, avatar_url, coins, streak_count, problems_solved, weekly_score, best_streak')
      .order(orderCol, { ascending: false })
      .limit(limit);

    const { data: users, error } = await query;
    if (error) throw error;

    const leaderboard = (users || []).map((u, idx) => ({
      id: u.id,
      name: u.full_name || u.username || 'Anonymous',
      avatar: (u.full_name || u.username || 'A').slice(0, 2).toUpperCase(),
      avatar_url: u.avatar_url,
      score: type === 'weekly' ? (u.weekly_score || 0) : (u.coins || 0),
      streak: u.streak_count || 0,
      bestStreak: u.best_streak || 0,
      problemsSolved: u.problems_solved || 0,
      rank: idx + 1,
      isCurrentUser: u.id === userId,
    }));

    // Find current user's rank if not in top N
    const currentUserInList = leaderboard.find(u => u.isCurrentUser);
    let currentUserRank = null;
    if (!currentUserInList) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt(orderCol, users.find(u => u.id === userId)?.[orderCol] || 0);
      currentUserRank = (count || 0) + 1;
    }

    res.json({ leaderboard, currentUserRank, type });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/leaderboard/stats — user's own stats for skill radar + readiness
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [profileRes, activityRes, interviewRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('coins, streak_count, problems_solved').eq('id', userId).single(),
      supabaseAdmin.from('user_activity').select('seconds_active').eq('user_id', userId).gte('date', new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]),
      supabaseAdmin.from('interview_sessions').select('interview_type, interview_score, status').eq('user_id', userId).eq('status', 'completed').order('created_at', { ascending: false }).limit(20),
    ]);

    const profile = profileRes.data || {};
    const activity = activityRes.data || [];
    const interviews = interviewRes.data || [];

    const mockCount = interviews.length;
    const avgScore = mockCount > 0 ? Math.round(interviews.reduce((s, i) => s + (i.interview_score || 0), 0) / mockCount) : 0;

    // Skill breakdown by interview type
    const byType = {};
    for (const iv of interviews) {
      if (!byType[iv.interview_type]) byType[iv.interview_type] = [];
      byType[iv.interview_type].push(iv.interview_score || 0);
    }
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 50;

    res.json({
      coins: profile.coins || 0,
      streak: profile.streak_count || 0,
      problemsSolved: profile.problems_solved || 0,
      mockCount,
      avgScore,
      skillRadar: {
        dsa: avg(byType.dsa || []),
        systemDesign: avg(byType.system_design || byType['system-design'] || []),
        behavioral: avg(byType.behavioral || []),
        hr: avg(byType.hr || []),
        sql: 50, // placeholder — no SQL interview type yet
      },
      readiness: {
        practiceCount: profile.problems_solved || 0,
        mockCount,
        streak: profile.streak_count || 0,
        timedSessions: activity.filter(a => a.seconds_active > 1800).length,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/leaderboard/badges — user's earned badges
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all badges + user's earned badges
    const [allBadgesRes, userBadgesRes, profileRes] = await Promise.all([
      supabaseAdmin.from('badges').select('*').order('threshold'),
      supabaseAdmin.from('user_badges').select('badge_id, earned_at').eq('user_id', userId),
      supabaseAdmin.from('profiles').select('streak_count, problems_solved, coins').eq('id', userId).single(),
    ]);

    const allBadges = allBadgesRes.data || [];
    const earnedSet = new Set((userBadgesRes.data || []).map(b => b.badge_id));
    const profile = profileRes.data || {};

    // Auto-award badges based on current stats
    const badgesToAward = [];
    for (const badge of allBadges) {
      if (earnedSet.has(badge.id)) continue;
      let qualifies = false;
      if (badge.category === 'streak') qualifies = (profile.streak_count || 0) >= badge.threshold;
      else if (badge.category === 'problems') qualifies = (profile.problems_solved || 0) >= badge.threshold;
      if (qualifies) badgesToAward.push({ user_id: userId, badge_id: badge.id });
    }

    if (badgesToAward.length > 0) {
      await supabaseAdmin.from('user_badges').upsert(badgesToAward, { onConflict: 'user_id,badge_id' });
      badgesToAward.forEach(b => earnedSet.add(b.badge_id));
    }

    const badges = allBadges.map(b => ({
      ...b,
      earned: earnedSet.has(b.id),
      earnedAt: (userBadgesRes.data || []).find(ub => ub.badge_id === b.id)?.earned_at || null,
    }));

    res.json({ badges, newlyEarned: badgesToAward.length });
  } catch (err) {
    console.error('Badges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;
