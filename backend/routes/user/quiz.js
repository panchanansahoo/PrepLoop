import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

const isMissingRelationError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || message.includes('does not exist');
};

const buildDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const computeCurrentStreak = (dateKeys = []) => {
  const uniqueSortedDates = Array.from(new Set(dateKeys.filter(Boolean))).sort().reverse();
  if (!uniqueSortedDates.length) return 0;

  const todayKey = buildDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = buildDateKey(yesterdayDate);

  const mostRecent = uniqueSortedDates[0];
  if (mostRecent !== todayKey && mostRecent !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  const expectedDate = new Date(mostRecent);

  for (const dateKey of uniqueSortedDates) {
    const expectedKey = buildDateKey(expectedDate);
    if (dateKey === expectedKey) {
      streak += 1;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const toDisplayName = (profile) => {
  const fullName = String(profile?.full_name || '').trim();
  if (fullName.length > 0) return fullName;

  const id = String(profile?.id || '').trim();
  if (!id) return 'Anonymous Engineer';

  return `Engineer ${id.slice(0, 6)}`;
};

const QUIZ_TOPICS = new Set([
  'dsa',
  'db',
  'system-design',
  'language',
  'os',
  'cn',
  'oop',
]);

const normalizeQuizTopic = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');

  const aliases = {
    dbms: 'db',
    database: 'db',
    'system-design': 'system-design',
    systemdesign: 'system-design',
    networking: 'cn',
    'computer-networks': 'cn',
    'programming-language': 'language',
    languages: 'language',
  };

  const resolved = aliases[normalized] || normalized;
  return QUIZ_TOPICS.has(resolved) ? resolved : null;
};

const router = express.Router();

router.get('/problem-leaderboard', optionalAuth, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const safeLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 3), 50)
      : 10;

    const candidatesToEvaluate = Math.max(80, safeLimit * 8);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, coins, created_at')
      .order('created_at', { ascending: false })
      .limit(candidatesToEvaluate);

    if (profilesError && (isProfilesAccessBlocked(profilesError) || isMissingRelationError(profilesError) || profilesError.code === '42703')) {
      console.warn('Leaderboard profiles degraded:', profilesError);
      return res.json({ leaderboard: [], currentUserRank: null, degraded: true });
    }

    if (profilesError) throw profilesError;

    const profileRows = Array.isArray(profiles) ? profiles : [];
    const userIds = profileRows.map((row) => row.id).filter(Boolean);

    if (!userIds.length) {
      return res.json({ leaderboard: [], currentUserRank: null });
    }

    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, solved_at, last_attempt')
      .in('user_id', userIds)
      .eq('status', 'solved');

    if (progressError && (isMissingRelationError(progressError) || progressError.code === '42703')) {
      console.warn('Leaderboard user_progress degraded:', progressError);
      // We can continue with empty progressRows
    } else if (progressError) {
      throw progressError;
    }

    const solvedByUser = new Map();
    const solvedDatesByUser = new Map();

    (progressRows || []).forEach((row) => {
      const userId = row.user_id;
      if (!userId) return;

      solvedByUser.set(userId, (solvedByUser.get(userId) || 0) + 1);

      const key = buildDateKey(row.solved_at || row.last_attempt);
      if (!key) return;

      const existing = solvedDatesByUser.get(userId) || [];
      existing.push(key);
      solvedDatesByUser.set(userId, existing);
    });

    const leaderboard = profileRows
      .map((profile) => {
        const solved = solvedByUser.get(profile.id) || 0;
        const streak = computeCurrentStreak(solvedDatesByUser.get(profile.id) || []);
        const coins = Number(profile.coins || 0);

        return {
          userId: profile.id,
          name: toDisplayName(profile),
          avatarUrl: profile.avatar_url || null,
          solved,
          streak,
          coins,
          points: solved * 100 + streak * 20 + Math.round(coins / 10),
        };
      })
      .filter((entry) => entry.solved > 0)
      .sort((left, right) => {
        if (right.solved !== left.solved) return right.solved - left.solved;
        if (right.streak !== left.streak) return right.streak - left.streak;
        if (right.coins !== left.coins) return right.coins - left.coins;
        return left.name.localeCompare(right.name);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    const currentUserRank = req.user?.id
      ? leaderboard.find((entry) => entry.userId === req.user.id)?.rank || null
      : null;

    res.json({
      leaderboard: leaderboard.slice(0, safeLimit),
      currentUserRank,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching problem leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch problem leaderboard' });
  }
});

router.post('/quiz/attempt', authenticateToken, async (req, res) => {
  try {
    const topic = normalizeQuizTopic(req.body?.topic);
    const score = Number.parseInt(String(req.body?.score), 10);
    const totalQuestions = Number.parseInt(String(req.body?.totalQuestions), 10);
    const durationSeconds = Number.parseInt(String(req.body?.durationSeconds || 0), 10);

    if (!topic) {
      return res.status(400).json({ error: 'Valid quiz topic is required' });
    }

    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({ error: 'Score must be a non-negative integer' });
    }

    if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) {
      return res.status(400).json({ error: 'totalQuestions must be a positive integer' });
    }

    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
      return res.status(400).json({ error: 'durationSeconds must be a non-negative integer' });
    }

    const safeScore = Math.min(score, totalQuestions);

    const { error } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        user_id: req.user.id,
        topic,
        score: safeScore,
        total_questions: totalQuestions,
        duration_seconds: durationSeconds,
      });

    if (isMissingRelationError(error)) {
      return res.status(503).json({
        error: 'Quiz feature not initialized. Run migration_quiz_feature.sql first.',
        code: 'QUIZ_TABLE_MISSING',
      });
    }

    if (error) throw error;

    const accuracy = Number(((safeScore / totalQuestions) * 100).toFixed(2));

    res.json({
      success: true,
      attempt: {
        topic,
        score: safeScore,
        totalQuestions,
        durationSeconds,
        accuracy,
        attemptedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ error: 'Failed to save quiz attempt' });
  }
});

router.get('/quiz-leaderboard', optionalAuth, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const safeLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 3), 50)
      : 10;

    const topicFilter = req.query.topic ? normalizeQuizTopic(req.query.topic) : null;
    if (req.query.topic && !topicFilter) {
      return res.status(400).json({ error: 'Invalid topic filter' });
    }

    let query = supabaseAdmin
      .from('quiz_attempts')
      .select('user_id, topic, score, total_questions, duration_seconds, attempted_at')
      .order('attempted_at', { ascending: false })
      .limit(5000);

    if (topicFilter) {
      query = query.eq('topic', topicFilter);
    }

    const { data: attempts, error: attemptsError } = await query;

    if (isMissingRelationError(attemptsError)) {
      return res.json({ leaderboard: [], currentUserRank: null, degraded: true });
    }

    if (attemptsError) throw attemptsError;

    const attemptRows = Array.isArray(attempts) ? attempts : [];
    const statsByUser = new Map();

    attemptRows.forEach((attempt) => {
      const userId = attempt.user_id;
      if (!userId) return;

      const score = Number(attempt.score || 0);
      const total = Math.max(1, Number(attempt.total_questions || 1));
      const duration = Math.max(0, Number(attempt.duration_seconds || 0));
      const accuracy = score / total;

      const current = statsByUser.get(userId) || {
        userId,
        attempts: 0,
        bestScore: 0,
        bestTotal: total,
        bestAccuracy: 0,
        quickestDuration: Number.POSITIVE_INFINITY,
        lastAttemptAt: null,
      };

      current.attempts += 1;

      const isBetterScore = score > current.bestScore;
      const isBetterAccuracyAtSameScore = score === current.bestScore && accuracy > current.bestAccuracy;
      const isFasterAtSameResult =
        score === current.bestScore &&
        accuracy === current.bestAccuracy &&
        duration < current.quickestDuration;

      if (isBetterScore || isBetterAccuracyAtSameScore || isFasterAtSameResult) {
        current.bestScore = score;
        current.bestTotal = total;
        current.bestAccuracy = accuracy;
        current.quickestDuration = duration;
      }

      if (!current.lastAttemptAt || new Date(attempt.attempted_at) > new Date(current.lastAttemptAt)) {
        current.lastAttemptAt = attempt.attempted_at;
      }

      statsByUser.set(userId, current);
    });

    const userIds = [...statsByUser.keys()];
    if (!userIds.length) {
      return res.json({ leaderboard: [], currentUserRank: null, topic: topicFilter || 'all' });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError && (isProfilesAccessBlocked(profilesError) || isMissingRelationError(profilesError) || profilesError.code === '42703')) {
      console.warn('Quiz leaderboard profiles degraded:', profilesError);
    } else if (profilesError) {
      throw profilesError;
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

    const leaderboard = userIds
      .map((userId) => {
        const stats = statsByUser.get(userId);
        const profile = profileMap.get(userId) || {};

        return {
          userId,
          name: toDisplayName({ id: userId, full_name: profile.full_name }),
          avatarUrl: profile.avatar_url || null,
          bestScore: stats.bestScore,
          totalQuestions: stats.bestTotal,
          accuracy: Number((stats.bestAccuracy * 100).toFixed(2)),
          attempts: stats.attempts,
          quickestDuration: Number.isFinite(stats.quickestDuration) ? stats.quickestDuration : null,
          lastAttemptAt: stats.lastAttemptAt,
        };
      })
      .sort((left, right) => {
        if (right.bestScore !== left.bestScore) return right.bestScore - left.bestScore;
        if (right.accuracy !== left.accuracy) return right.accuracy - left.accuracy;

        const leftDuration = Number.isFinite(left.quickestDuration) ? left.quickestDuration : Number.MAX_SAFE_INTEGER;
        const rightDuration = Number.isFinite(right.quickestDuration) ? right.quickestDuration : Number.MAX_SAFE_INTEGER;
        if (leftDuration !== rightDuration) return leftDuration - rightDuration;

        if (right.attempts !== left.attempts) return right.attempts - left.attempts;
        return left.name.localeCompare(right.name);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    const currentUserRank = req.user?.id
      ? leaderboard.find((entry) => entry.userId === req.user.id)?.rank || null
      : null;

    res.json({
      leaderboard: leaderboard.slice(0, safeLimit),
      currentUserRank,
      topic: topicFilter || 'all',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch quiz leaderboard' });
  }
});

export default router;
