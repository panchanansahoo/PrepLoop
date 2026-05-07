import express from "express";
import { supabaseAdmin } from "../db/supabaseClient.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import dsaLearningPath, {
  getModuleProblems,
  getModuleProgress,
} from "../data/dsaLearningPath.js";
import lldLearningPath from "../data/lldLearningPath.js";
import aiLearningPath from "../data/aiLearningPath.js";
import { applyCoinTransaction } from "../utils/coinTransactions.js";
import { calculateDashboardStreak } from "../utils/dashboardStreak.js";
import { normalizeProfileUpdatePayload } from "../utils/profilePayload.js";
import DataCacheManager from "../services/dataCacheManager.js";

const router = express.Router();
const PROFILE_COMPLETION_COIN_REWARD = 20;

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

const buildProfileResponse = (req, profile) => {
  const fullName = profile?.full_name || req.user?.user_metadata?.full_name || '';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const experienceLevel = profile?.experience_level || 'beginner';
  const role = profile?.role || req.user?.role || 'user';
  const experienceSummary = profile?.experience_summary || '';
  const experienceYears = profile?.experience_years ?? null;

  const flatProfile = {
    id: profile?.id || req.user?.id,
    email: req.user?.email || profile?.email || '',
    fullName,
    full_name: fullName,
    subscriptionTier,
    subscription_tier: subscriptionTier,
    experienceLevel,
    experience_level: experienceLevel,
    role,
    created_at: profile?.created_at || null,
    last_login: profile?.last_login || null,
    bio: profile?.bio || '',
    currentRole: profile?.designation || profile?.current_role || '',
    skills: profile?.skills || '',
    education: profile?.education || '',
    experience: experienceSummary || (experienceYears != null ? String(experienceYears) : experienceLevel),
    experienceSummary,
    experienceYears,
    company: profile?.company || '',
    designation: profile?.designation || '',
    avatar_url: profile?.avatar_url || '',
    githubUsername: profile?.github_username || '',
    github_username: profile?.github_username || '',
    coins: profile?.coins ?? 0,
    
    // New profile fields
    phone: profile?.phone || '',
    location: profile?.location || '',
    website: profile?.website || '',
    yearsOfExperience: profile?.years_of_experience || '',
    specialization: profile?.specialization || '',
    socialLinks: profile?.social_links || {
      twitter: profile?.twitter || '',
      linkedin: profile?.linkedin || '',
      portfolio: profile?.portfolio || '',
      dribbble: profile?.dribbble || ''
    }
  };

  return {
    user: {
      id: flatProfile.id,
      email: flatProfile.email,
      full_name: flatProfile.full_name,
      subscription_tier: flatProfile.subscription_tier,
      experience_level: flatProfile.experience_level,
      created_at: flatProfile.created_at,
      last_login: flatProfile.last_login,
      role: flatProfile.role,
      bio: flatProfile.bio,
      current_role: flatProfile.currentRole,
      skills: flatProfile.skills,
      education: flatProfile.education,
      experience: flatProfile.experience,
      experience_summary: flatProfile.experienceSummary,
      experience_years: flatProfile.experienceYears,
      company: flatProfile.company,
      designation: flatProfile.designation,
      avatar_url: flatProfile.avatar_url,
      github_username: flatProfile.githubUsername,
      githubUsername: flatProfile.githubUsername,
      coins: flatProfile.coins,
      
      // New profile fields
      phone: flatProfile.phone,
      location: flatProfile.location,
      website: flatProfile.website,
      years_of_experience: flatProfile.yearsOfExperience,
      specialization: flatProfile.specialization,
      social_links: flatProfile.socialLinks,
      twitter: flatProfile.socialLinks?.twitter,
      linkedin: flatProfile.socialLinks?.linkedin,
      portfolio: flatProfile.socialLinks?.portfolio,
      dribbble: flatProfile.socialLinks?.dribbble
    },
    profile: flatProfile,
    ...flatProfile,
  };
};

const hasText = (value) => String(value ?? '').trim().length > 0;

const isProfileCompleteForReward = (profile) => {
  const experienceValue =
    profile?.experience_summary ??
    profile?.experience_years ??
    profile?.experience_level ??
    '';

  // Check for basic required fields plus new enhanced fields
  return [
    profile?.full_name,
    profile?.designation,
    experienceValue,
    profile?.skills,
    profile?.education,
    profile?.bio,
    profile?.location,  // New field
    profile?.company   // New field
  ].every(hasText);
};

const awardProfileCompletionCoins = async (userId, profile) => {
  if (!profile || !isProfileCompleteForReward(profile)) {
    return { coinsAwarded: 0, coinBalance: profile?.coins ?? null, applied: false };
  }

  const description = 'Profile completed'.slice(0, 160);
  const referenceKey = `profile_complete:${userId}`;

  const atomicResult = await applyCoinTransaction({
    userId,
    amount: PROFILE_COMPLETION_COIN_REWARD,
    type: 'earn',
    description,
    referenceKey,
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      throw new Error(atomicResult.error || 'Failed to award profile completion coins');
    }

    return {
      coinsAwarded: atomicResult.applied ? PROFILE_COMPLETION_COIN_REWARD : 0,
      coinBalance: atomicResult.balance,
      applied: atomicResult.applied,
    };
  }

  const { data: existingReward, error: existingRewardError } = await supabaseAdmin
    .from('coin_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'earn')
    .eq('description', description)
    .limit(1);

  if (existingRewardError) throw existingRewardError;

  if (existingReward?.length) {
    return {
      coinsAwarded: 0,
      coinBalance: profile?.coins ?? 0,
      applied: false,
    };
  }

  const currentCoins = Number(profile?.coins || 0);
  const newBalance = currentCoins + PROFILE_COMPLETION_COIN_REWARD;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: PROFILE_COMPLETION_COIN_REWARD,
    type: 'earn',
    description,
  });

  return {
    coinsAwarded: PROFILE_COMPLETION_COIN_REWARD,
    coinBalance: newBalance,
    applied: true,
  };
};

const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

const LEVELS = [
  { name: 'Novice', minXP: 0 },
  { name: 'Apprentice', minXP: 100 },
  { name: 'Intermediate', minXP: 350 },
  { name: 'Advanced', minXP: 800 },
  { name: 'Expert', minXP: 1800 },
  { name: 'Master', minXP: 4000 },
  { name: 'Grandmaster', minXP: 8000 },
  { name: 'Legend', minXP: 15000 },
];

const DASHBOARD_PATTERN_CACHE_TTL_MS = 10 * 60 * 1000;
let dashboardPatternCatalogCache = {
  fetchedAt: 0,
  patternMap: new Map(),
  problemCountByPatternId: new Map(),
};

const getDashboardPatternCatalog = async () => {
  const now = Date.now();
  if (
    dashboardPatternCatalogCache.fetchedAt &&
    now - dashboardPatternCatalogCache.fetchedAt < DASHBOARD_PATTERN_CACHE_TTL_MS
  ) {
    return dashboardPatternCatalogCache;
  }

  const [patternsResult, problemsResult] = await Promise.all([
    supabaseAdmin.from("patterns").select("id, name"),
    supabaseAdmin.from("problems").select("pattern_id"),
  ]);

  if (patternsResult.error) throw patternsResult.error;
  if (problemsResult.error) throw problemsResult.error;

  // Build fresh Maps — don't mutate the old ones to avoid partial-update races
  const patternMap = new Map();
  (patternsResult.data || []).forEach((pattern) => {
    patternMap.set(pattern.id, pattern);
  });

  const problemCountByPatternId = new Map();
  (problemsResult.data || []).forEach((problem) => {
    const patternId = problem.pattern_id;
    if (!patternId) return;
    problemCountByPatternId.set(
      patternId,
      (problemCountByPatternId.get(patternId) || 0) + 1,
    );
  });

  // Atomic replacement — assign a new object so concurrent readers see a consistent snapshot
  dashboardPatternCatalogCache = {
    fetchedAt: now,
    patternMap,
    problemCountByPatternId,
  };

  return dashboardPatternCatalogCache;
};

const getLevelInfo = (xp) => {
  const safeXP = Number(xp) || 0;

  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (safeXP >= LEVELS[index].minXP) {
      return { ...LEVELS[index], index };
    }
  }

  return { ...LEVELS[0], index: 0 };
};

const getLevelProgressInfo = (xp) => {
  const totalXP = Number(xp) || 0;
  const currentLevel = getLevelInfo(totalXP);
  const nextLevel = LEVELS[currentLevel.index + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      currentXP: totalXP,
      nextLevelXP: totalXP,
      rank: currentLevel.name,
    };
  }

  return {
    currentLevel,
    currentXP: totalXP - currentLevel.minXP,
    nextLevelXP: nextLevel.minXP,
    rank: currentLevel.name,
  };
};

const getWeekRange = (offsetWeeks = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - (offsetWeeks * 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
};

const buildWeeklyStats = (submissions, start, end) => {
  const accepted = (submissions || []).filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submission.status === 'accepted' && submittedAt >= start && submittedAt < end;
  });

  const totals = accepted.reduce((accumulator, submission) => {
    const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
    const executionTime = Number(submission.execution_time) || 0;

    accumulator.problems += 1;
    accumulator.timeHours += executionTime / 3600;
    accumulator.xp += XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy;
    return accumulator;
  }, { problems: 0, timeHours: 0, xp: 0 });

  return {
    problems: totals.problems,
    time: Number(totals.timeHours.toFixed(1)),
    xp: totals.xp,
  };
};

const buildDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const computeCurrentStreak = (dateKeys = []) => {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0;

  const uniqueSorted = [...new Set(dateKeys)]
    .filter(Boolean)
    .sort((left, right) => (left < right ? 1 : -1));

  if (!uniqueSorted.length) return 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);

  if (uniqueSorted[0] !== todayKey && uniqueSorted[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  const cursor = uniqueSorted[0] === yesterdayKey ? new Date(yesterdayDate) : new Date();

  while (true) {
    const expected = cursor.toISOString().slice(0, 10);
    if (!uniqueSorted.includes(expected)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
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

    if (isProfilesAccessBlocked(profilesError)) {
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

    if (progressError) throw progressError;

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

    if (profilesError && !isProfilesAccessBlocked(profilesError)) {
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

const getStableDailySeed = () => {
  const now = new Date();
  return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`);
};

const pickDeterministicItems = (items, count, seed) => {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) return [];

  const used = new Set();
  const result = [];
  let cursor = Math.abs(seed) % items.length;

  while (result.length < count && used.size < items.length) {
    if (!used.has(cursor)) {
      used.add(cursor);
      result.push(items[cursor]);
    }
    cursor = (cursor + 17) % items.length;
  }

  return result;
};

const buildUpcomingItemsFromCalendar = (events = []) => {
  const now = new Date();

  return (events || [])
    .filter((evt) => {
      if (!evt?.event_date) return false;
      const eventDate = new Date(`${evt.event_date}T${evt.event_time || '00:00'}:00`);
      return eventDate >= now;
    })
    .sort((a, b) => {
      const left = new Date(`${a.event_date}T${a.event_time || '00:00'}:00`).getTime();
      const right = new Date(`${b.event_date}T${b.event_time || '00:00'}:00`).getTime();
      return left - right;
    })
    .slice(0, 8)
    .map((evt) => {
      const date = new Date(`${evt.event_date}T${evt.event_time || '00:00'}:00`);
      const rawTag = String(evt.tag || '').toLowerCase();

      let platform = 'PrepLoop';
      let icon = '📌';
      if (rawTag === 'contest') {
        platform = 'Contest';
        icon = '🏆';
      } else if (rawTag === 'interview') {
        platform = 'Interview';
        icon = '🎤';
      } else if (rawTag === 'deadline') {
        platform = 'Deadline';
        icon = '⏳';
      }

      return {
        platform,
        icon,
        name: evt.title,
        date: date.toISOString(),
        duration: evt.event_time || 'Scheduled',
        link: null,
        live: true,
      };
    });
};

const fetchSqlProblemRecommendations = async (limit = 250) => {
  const candidates = [
    { table: 'sql_problems', select: 'id, title, difficulty' },
    { table: 'sql_challenges', select: 'id, title, difficulty' },
    { table: 'sql_questions', select: 'id, title, difficulty' },
    { table: 'problems_sql', select: 'id, title, difficulty' },
  ];

  for (const candidate of candidates) {
    const { data, error } = await supabaseAdmin
      .from(candidate.table)
      .select(candidate.select)
      .limit(limit);

    if (error || !Array.isArray(data) || data.length === 0) {
      continue;
    }

    const normalized = data
      .map((row, index) => ({
        id: row.id ?? index + 1,
        title: String(row.title || '').trim(),
        difficulty: row.difficulty || 'Medium',
      }))
      .filter((row) => row.title.length > 0);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
};

let cachedSqlProblems = null;
let sqlProblemsCacheTime = 0;

const fetchSqlProblemRecommendationsCached = async (limit = 250) => {
  const now = Date.now();
  if (cachedSqlProblems && now - sqlProblemsCacheTime < 10 * 60 * 1000) {
    return cachedSqlProblems;
  }
  const result = await fetchSqlProblemRecommendations(limit);
  if (result && result.length > 0) {
    cachedSqlProblems = result;
    sqlProblemsCacheTime = now;
  }
  return result;
};

let cachedAllProblems = null;
let allProblemsCacheTime = 0;

const fetchAllProblemsCached = async () => {
  const now = Date.now();
  if (cachedAllProblems && now - allProblemsCacheTime < 10 * 60 * 1000) {
    return cachedAllProblems;
  }
  const { data, error } = await supabaseAdmin
    .from("problems")
    .select("id, title, difficulty")
    .order("id", { ascending: true })
    .limit(400);

  if (error || !data) return [];
  cachedAllProblems = data;
  allProblemsCacheTime = now;
  return data;
};


router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Try to get cached profile first
    const cachedProfile = await DataCacheManager.getUserProfile(req.user.id);
    if (cachedProfile) {
      return res.json(buildProfileResponse(req, cachedProfile));
    }

    // If not cached, fetch from database
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: req.user.role || 'user',
        }),
        degraded: true,
      });
    }

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }

    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: req.user.role || 'user',
          
          // New profile fields
          phone: '',
          location: '',
          website: '',
          company: '',
          years_of_experience: '',
          specialization: '',
          social_links: '{}',
          twitter: '',
          linkedin: '',
          portfolio: '',
          dribbble: ''
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.json({
          ...buildProfileResponse(req, {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || '',
            subscription_tier: 'free',
            experience_level: 'beginner',
            role: req.user.role || 'user',
            
            // New profile fields for degraded response
            phone: '',
            location: '',
            website: '',
            company: '',
            years_of_experience: '',
            specialization: '',
            social_links: '{}',
            twitter: '',
            linkedin: '',
            portfolio: '',
            dribbble: ''
          }),
          degraded: true,
        });
      }

      return res.json(buildProfileResponse(req, newProfile));
    }

    return res.json(buildProfileResponse(req, profile));
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: req.user.role || 'user',
          
          // New profile fields for degraded response
          phone: '',
          location: '',
          website: '',
          company: '',
          years_of_experience: '',
          specialization: '',
          social_links: '{}',
          twitter: '',
          linkedin: '',
          portfolio: '',
          dribbble: ''
        }),
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const updates = normalizeProfileUpdatePayload(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Profile update error:', error);
      if (isProfilesAccessBlocked(error)) {
        return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Invalidate profile cache after update
    await DataCacheManager.invalidateUserProfile(req.user.id);

    let rewardResult = { coinsAwarded: 0, coinBalance: data?.coins ?? 0, applied: false };
    let rewardDegraded = false;

    try {
      rewardResult = await awardProfileCompletionCoins(req.user.id, data);
      // Invalidate coins cache after reward
      if (rewardResult.applied) {
        await DataCacheManager.setUserCoins(req.user.id, rewardResult.coinBalance);
      }
    } catch (rewardError) {
      rewardDegraded = true;
      console.error('Profile completion reward error:', rewardError);
    }

    res.json({
      ...buildProfileResponse(req, data),
      coinsAwarded: rewardResult.coinsAwarded,
      coinBalance: rewardResult.coinBalance,
      profileCompletionRewardApplied: rewardResult.applied,
      profileCompletionRewardDegraded: rewardDegraded,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sqlProblemsPromise = fetchSqlProblemRecommendationsCached(250);
    const allProblemsPromise = fetchAllProblemsCached();

    const [
      progressResult,
      submissionsResult,
      interviewsResult,
      resumesResult,
      dailyProblemsResult,
      calendarEventsResult,
      sqlProblems,
      activityResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId),
      supabaseAdmin
        .from("submissions")
        .select("submitted_at, status, problem_id, execution_time, problems(title, difficulty)")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false }),
      supabaseAdmin
        .from("mock_interviews")
        .select("id, interview_type, overall_score, communication_score, technical_score, problem_solving_score, started_at, completed_at")
        .eq("user_id", userId)
        .order("started_at", { ascending: false }),
      supabaseAdmin
        .from("resume_analyses")
        .select("id")
        .eq("user_id", userId),
      allProblemsPromise,
      supabaseAdmin
        .from("user_calendar_events")
        .select("title, event_date, event_time, tag")
        .eq("user_id", userId)
        .order("event_date", { ascending: true }),
      sqlProblemsPromise,
      supabaseAdmin
        .from('user_activity')
        .select('date, seconds_active')
        .eq('user_id', userId)
        .gte('seconds_active', 60),
    ]);

    if (progressResult.error) throw progressResult.error;
    if (submissionsResult.error) throw submissionsResult.error;
    if (interviewsResult.error) throw interviewsResult.error;
    if (resumesResult.error) throw resumesResult.error;
    if (dailyProblemsResult.error) throw dailyProblemsResult.error;

    const progress = progressResult.data || [];
    const subs = submissionsResult.data || [];
    const interviews = interviewsResult.data || [];
    const resumes = resumesResult.data || [];
    const allProblems = dailyProblemsResult || [];
    // Handle calendar events gracefully - if table doesn't exist, use empty array
    const isMissingTableError = (error) => {
      const code = String(error?.code || '').toUpperCase();
      return code === '42P01' || String(error?.message || '').includes('does not exist');
    };
    
    let calendarEvents = [];
    if (!calendarEventsResult.error) {
      calendarEvents = calendarEventsResult.data || [];
    } else if (isMissingTableError(calendarEventsResult.error)) {
      // Table doesn't exist yet - log warning but don't fail
      console.warn('⚠️ user_calendar_events table not found. Run: node scripts/apply_calendar_events_migration.js');
      calendarEvents = [];
    } else {
      // Some other error occurred
      console.error('Error querying calendar events:', calendarEventsResult.error);
      calendarEvents = [];
    }

    const solvedCount = (progress || []).filter(
      (p) => p.status === "solved",
    ).length;

    const completedInterviews = interviews.filter((i) => i.completed_at);

    // ── 5) Streak calculation (consecutive days ending today) ──
    // Combine activity from submissions AND user_activity table

    const activityDates = (activityResult.data || []).map((activity) => activity.date);
    const submissionDates = subs.map((submission) => submission.submitted_at);

    const {
      currentStreak,
      bestStreak,
      weekProgress,
    } = calculateDashboardStreak({
      submissionDateKeys: submissionDates,
      activityDateValues: activityDates,
    });

    // Update profile with latest streak data
    supabaseAdmin
      .from('profiles')
      .update({
        daily_streak: currentStreak,
        best_streak: Math.max(bestStreak, currentStreak),
        last_active_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) console.error('Error updating profile streak:', error);
      });

    // ── 6) Average interview score ──
    let avgScore = 0;
    if (completedInterviews.length > 0) {
      const totalScore = completedInterviews.reduce(
        (sum, i) => sum + (i.overall_score || 0), 0
      );
      avgScore = Math.round(totalScore / completedInterviews.length);
    }

    // ── 7) Total XP (derived from real activity) ──
    const acceptedSubmissions = subs.filter((submission) => submission.status === 'accepted');
    const totalProblemXP = acceptedSubmissions.reduce((sum, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      return sum + (XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy);
    }, 0);
    const totalXP = totalProblemXP + (completedInterviews.length * 50);

    // ── 8) Heatmap data (last 365 days, only accepted submissions grouped by date) ──
    const heatmapData = {};
    let totalSolvedYear = 0;
    let todaySolved = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    subs.forEach((s) => {
      if (s.status !== "accepted") return; // Only count solved problems
      const dateKey = new Date(s.submitted_at).toISOString().split("T")[0];
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = { solved: 0, xp: 0, easy: 0, medium: 0, hard: 0 };
      }
      heatmapData[dateKey].solved++;
      heatmapData[dateKey].xp += 25;
      const diff = s.problems?.difficulty?.toLowerCase();
      if (diff === "easy") heatmapData[dateKey].easy++;
      else if (diff === "medium") heatmapData[dateKey].medium++;
      else if (diff === "hard") heatmapData[dateKey].hard++;
      totalSolvedYear++;
      if (dateKey === todayStr) todaySolved++;
    });

    // ── 9) Skill breakdown (for radar chart) ──
    // Count solved problems by category/tags
    const solvedProblemIds = new Set(
      (progress || []).filter((p) => p.status === "solved").map((p) => p.problem_id)
    );

    const unsolvedProblems = allProblems.filter((problem) => !solvedProblemIds.has(problem.id));
    const dailyPool = unsolvedProblems.length > 0 ? unsolvedProblems : allProblems;
    const dailySeed = getStableDailySeed() + Number(userId?.length || 0);
    const dailyDsa = pickDeterministicItems(dailyPool, 3, dailySeed).map((problem) => ({
      title: problem.title,
      difficulty: problem.difficulty || 'Medium',
      internalId: problem.id,
    }));

    const dailySql = pickDeterministicItems(sqlProblems, 3, dailySeed + 97).map((problem) => ({
      title: problem.title,
      difficulty: problem.difficulty || 'Medium',
      internalId: problem.id,
    }));

    const dailyChallenge = {
      name: 'Personalized DSA Challenge',
      type: 'From Your DB Progress',
      dsa: dailyDsa,
      sql: dailySql,
    };

    const upcomingContests = buildUpcomingItemsFromCalendar(calendarEvents);

    const skillBreakdown = { dsa: 0, sql: 0, aptitude: 0, systemDesign: 0, behavioral: 0 };
    // DSA score based on solved count
    skillBreakdown.dsa = solvedCount > 0 ? Math.min(100, solvedCount) : 0;
    // SQL, aptitude from mock interview types
    const sqlInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("sql")
    );
    const aptitudeInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("aptitude")
    );
    const sysDesignInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("system") || i.interview_type?.toLowerCase().includes("design")
    );
    const behavioralInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("behavioral") || i.interview_type?.toLowerCase().includes("hr")
    );

    if (sqlInterviews.length > 0) {
      skillBreakdown.sql = Math.round(sqlInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sqlInterviews.length);
    }
    if (aptitudeInterviews.length > 0) {
      skillBreakdown.aptitude = Math.round(aptitudeInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / aptitudeInterviews.length);
    }
    if (sysDesignInterviews.length > 0) {
      skillBreakdown.systemDesign = Math.round(sysDesignInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sysDesignInterviews.length);
    }
    if (behavioralInterviews.length > 0) {
      skillBreakdown.behavioral = Math.round(behavioralInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / behavioralInterviews.length);
    }

    // ── 10) Topic progress (solved per pattern/category) ──
    const topicProgressMap = {};
    const patternColors = [
      '#a78bfa', '#38bdf8', '#22c55e', '#f59e0b', '#fb923c',
      '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    const [catalog, solvedProblemPatternsResult] = await Promise.all([
      getDashboardPatternCatalog(),
      solvedProblemIds.size > 0
        ? supabaseAdmin
          .from("problems")
          .select("id, pattern_id")
          .in("id", [...solvedProblemIds])
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (solvedProblemPatternsResult.error) throw solvedProblemPatternsResult.error;

    const solvedCountByPatternId = new Map();
    (solvedProblemPatternsResult.data || []).forEach((problem) => {
      const patternId = problem.pattern_id;
      if (!patternId) return;
      solvedCountByPatternId.set(
        patternId,
        (solvedCountByPatternId.get(patternId) || 0) + 1,
      );
    });

    Array.from(catalog.patternMap.values()).forEach((pattern, idx) => {
      const total = catalog.problemCountByPatternId.get(pattern.id) || 0;
      if (total === 0) return;

      topicProgressMap[pattern.name] = {
        name: pattern.name,
        solved: solvedCountByPatternId.get(pattern.id) || 0,
        total,
        color: patternColors[idx % patternColors.length],
      };
    });

    const topicProgress = Object.values(topicProgressMap);

    // ── 11) Recent activity (merged submissions + interviews) ──
    const recentActivity = [];

    // Recent submissions (max 6)
    subs.slice(0, 6).forEach((s) => {
      recentActivity.push({
        type: s.status === "accepted" ? "problem_solved" : "dsa_practice",
        title: s.problems?.title ? `${s.problems.title} — ${s.status === "accepted" ? "Accepted" : "Attempted"}` : "Problem submission",
        timestamp: s.submitted_at,
      });
    });

    // Recent completed interviews (max 4)
    completedInterviews.slice(0, 4).forEach((i) => {
      recentActivity.push({
        type: "interview_done",
        title: `Mock Interview: ${i.interview_type || "General"} — ${i.overall_score ? i.overall_score + "%" : "Completed"}`,
        timestamp: i.completed_at || i.started_at,
      });
    });

    // Sort by timestamp descending and limit to 6
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivityFinal = recentActivity.slice(0, 6);

    // ── 12) Weekly goals data (solved this week by difficulty) ──
    const thisWeekRange = getWeekRange(0);
    const lastWeekRange = getWeekRange(1);

    const thisWeekAccepted = subs.filter((submission) => {
      const submittedAt = new Date(submission.submitted_at);
      return submission.status === 'accepted' && submittedAt >= thisWeekRange.start && submittedAt < thisWeekRange.end;
    });

    const weeklyByDifficulty = thisWeekAccepted.reduce((accumulator, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      if (difficulty === 'hard') accumulator.hard += 1;
      else if (difficulty === 'medium') accumulator.medium += 1;
      else accumulator.easy += 1;
      return accumulator;
    }, { easy: 0, medium: 0, hard: 0 });

    const thisWeek = buildWeeklyStats(subs, thisWeekRange.start, thisWeekRange.end);
    const lastWeek = buildWeeklyStats(subs, lastWeekRange.start, lastWeekRange.end);

    const levelInfo = getLevelProgressInfo(totalXP);

    // ── 13) Readiness data ──
    const readinessData = {
      practiceCount: solvedCount,
      mockCount: completedInterviews.length,
      streak: currentStreak,
      timedSessions: subs.filter((s) => s.status === "accepted").length,
    };

    const sessionsByDate = {};
    subs.forEach((submission) => {
      if (submission.status !== 'accepted') return;
      const dayKey = new Date(submission.submitted_at).toISOString().split('T')[0];
      sessionsByDate[dayKey] = (sessionsByDate[dayKey] || 0) + 1;
    });

    const pomodoroDates = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      pomodoroDates.push(day.toISOString().split('T')[0]);
    }

    const pomodoroStats = {
      sessionsToday: sessionsByDate[todayStr] || 0,
      sessionsByDate: pomodoroDates.reduce((accumulator, key) => {
        accumulator[key] = sessionsByDate[key] || 0;
        return accumulator;
      }, {}),
    };

    // ── Response ──
    res.json({
      stats: {
        problemsSolved: solvedCount,
        totalSubmissions: subs.length,
        mockInterviews: completedInterviews.length,
        resumesAnalyzed: (resumes || []).length,
      },
      streak: currentStreak,
      bestStreak,
      weekProgress,
      avgScore,
      totalXP,
      heatmapData,
      totalSolvedYear,
      todaySolved,
      skillBreakdown,
      topicProgress,
      recentActivity: recentActivityFinal,
      weeklyGoals: weeklyByDifficulty,
      readinessData,
      thisWeekProblems: thisWeek.problems,
      lastWeekProblems: lastWeek.problems,
      thisWeekTime: thisWeek.time,
      lastWeekTime: lastWeek.time,
      thisWeekXP: thisWeek.xp,
      lastWeekXP: lastWeek.xp,
      currentLevel: levelInfo.currentLevel.index + 1,
      currentXP: levelInfo.currentXP,
      nextLevelXP: levelInfo.nextLevelXP,
      rank: levelInfo.rank,
      dailyChallenge,
      upcomingContests,
      pomodoroStats,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = [];

    // 1) Mock Interviews
    const { data: interviews } = await supabaseAdmin
      .from("mock_interviews")
      .select("id, interview_type, overall_score, started_at, completed_at, company, role")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (interviews) {
      interviews.forEach(i => {
        if (!i.completed_at) return;

        let titleStr = "AI Interview";
        if (i.company && i.role) {
          titleStr = `${i.company} ${i.role} Interview`;
        } else if (i.interview_type) {
          titleStr = `${i.interview_type} Interview`;
        }

        let durationStr = "N/A";
        if (i.started_at && i.completed_at) {
          const ds = new Date(i.started_at);
          const de = new Date(i.completed_at);
          const mins = Math.max(1, Math.round((de - ds) / 60000));
          durationStr = `${mins} min`;
        }

        sessions.push({
          id: `interview_${i.id}`,
          type: "interview",
          title: titleStr,
          date: new Date(i.completed_at).toISOString().split("T")[0],
          timestamp: new Date(i.completed_at).getTime(),
          score: i.overall_score || 0,
          duration: durationStr
        });
      });
    }

    // 2) Code Practice
    const { data: submissions } = await supabaseAdmin
      .from("submissions")
      .select("id, submitted_at, status, problems(title, difficulty)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    if (submissions) {
      submissions.forEach(s => {
        sessions.push({
          id: `practice_${s.id}`,
          type: "practice",
          title: s.problems?.title ? `${s.problems.title} - ${s.status}` : `Practice - ${s.status}`,
          date: new Date(s.submitted_at).toISOString().split("T")[0],
          timestamp: new Date(s.submitted_at).getTime(),
          score: s.status === "accepted" ? 100 : 0,
          duration: "N/A"
        });
      });
    }

    // 3) Resume Analysis
    const { data: resumes } = await supabaseAdmin
      .from("resume_analyses")
      .select("id, created_at, overall_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (resumes) {
      resumes.forEach(r => {
        sessions.push({
          id: `resume_${r.id}`,
          type: "resume",
          title: "Resume ATS Analysis",
          date: new Date(r.created_at).toISOString().split("T")[0],
          timestamp: new Date(r.created_at).getTime(),
          score: Math.round(r.overall_score) || 0,
          duration: "N/A"
        });
      });
    }

    // Sort by timestamp descending
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({ error: "Failed to fetch user history" });
  }
});

router.get("/learning-paths", authenticateToken, async (req, res) => {
  try {
    const paths = [
      {
        id: "array",
        title: "Array Interview Track",
        description:
          "Master array problem-solving patterns with guided practice and IDE workflows",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        modules: [],
      },
      {
        id: "dsa-basics",
        title: "DSA Basics",
        description:
          "Master fundamental data structures and algorithms from scratch",
        duration: "6-8 weeks",
        difficulty: "Beginner",
        modules: [],
      },
      {
        id: "dsa",
        title: "Advanced DSA",
        description:
          "Master advanced algorithms and complex data structures for FAANG interviews",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        modules: [],
      },
      {
        id: "data-science",
        title: "Data Science Interview Prep",
        description:
          "Master statistics, ML algorithms, and Python for data science roles",
        duration: "8-10 weeks",
        difficulty: "Intermediate",
        modules: [],
      },
      {
        id: "ai",
        title: "AI & Machine Learning",
        description: "Deep learning, neural networks, and modern AI techniques",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        modules: [],
      },
      {
        id: "lld",
        title: "Low Level Design",
        description:
          "Master OOP, design patterns, and build clean code architectures",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        modules: [],
      },
      {
        id: "hld",
        title: "High Level Design",
        description:
          "System design for scalable, distributed systems and architectures",
        duration: "8-10 weeks",
        difficulty: "Advanced",
        modules: [],
      },
      {
        id: "beginner",
        title: "Interview Prep Bootcamp",
        description: "Complete beginner-friendly interview preparation path",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        modules: [],
      },
    ];

    res.json({ paths });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    res.status(500).json({ error: "Failed to fetch learning paths" });
  }
});

router.get("/learning-paths/:pathId", authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;

    const pathsData = {
      array: {
        id: "array",
        title: "Array Interview Track",
        description:
          "Master array problem-solving patterns with guided practice and IDE workflows",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        prerequisite: "Basic programming fundamentals",
        outcomes: [
          "Understand array indexing, traversal, and in-place updates",
          "Use two pointers, sliding window, prefix sums, and hash maps confidently",
          "Solve common interview-style array problems with optimized complexity",
          "Practice and debug solutions quickly in an interview-like IDE",
        ],
        modules: [
          {
            id: "array-foundations",
            title: "Array Foundations",
            description: "Core operations, complexity, and baseline techniques",
            topics: [
              "Traversal",
              "Insertion & Deletion",
              "Complexity Analysis",
            ],
            lessons: [
              {
                title: "How arrays work in memory",
                duration: "25 min",
                type: "video",
              },
              {
                title: "Operations and trade-offs",
                duration: "30 min",
                type: "reading",
              },
              {
                title: "Practice set: easy warmup",
                duration: "90 min",
                type: "practice",
              },
            ],
            problems: 12,
            estimatedTime: "4 days",
            unlocked: true,
          },
          {
            id: "array-two-pointers",
            title: "Two Pointers",
            description:
              "Master left-right pointer techniques for sorted and unsorted arrays",
            topics: ["Pair Search", "Deduplication", "In-place Partitioning"],
            lessons: [
              {
                title: "Two pointers pattern",
                duration: "35 min",
                type: "video",
              },
              {
                title: "When to sort and when not to",
                duration: "25 min",
                type: "reading",
              },
              {
                title: "Practice set: two pointers",
                duration: "2 hours",
                type: "practice",
              },
            ],
            problems: 14,
            estimatedTime: "5 days",
            unlocked: true,
          },
          {
            id: "array-sliding-window",
            title: "Sliding Window",
            description:
              "Optimize subarray/substring range problems to linear time",
            topics: ["Fixed Window", "Variable Window", "Frequency Tracking"],
            lessons: [
              {
                title: "Sliding window intuition",
                duration: "35 min",
                type: "video",
              },
              {
                title: "Template and pitfalls",
                duration: "30 min",
                type: "reading",
              },
              {
                title: "Practice set: windows",
                duration: "2.5 hours",
                type: "practice",
              },
            ],
            problems: 15,
            estimatedTime: "1 week",
            unlocked: true,
          },
        ],
      },
      "dsa-basics": {
        id: "dsa-basics",
        title: "DSA Basics",
        description:
          "Master fundamental data structures and algorithms from scratch",
        duration: "6-8 weeks",
        difficulty: "Beginner",
        prerequisite: "Basic programming knowledge",
        outcomes: [
          "Understand core data structures (arrays, linked lists, stacks, queues)",
          "Master basic algorithms and their time complexity",
          "Solve 100+ beginner-friendly problems",
          "Build strong foundation for advanced topics",
        ],
        modules: [],
      },
      dsa: {
        id: "dsa",
        title: "Advanced DSA",
        description:
          "Master advanced algorithms and complex data structures for FAANG interviews",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        prerequisite: "Strong foundation in basic DSA",
        outcomes: [
          "Master advanced data structures (Trees, Graphs, Heaps)",
          "Solve medium to hard LeetCode problems",
          "Understand dynamic programming and greedy algorithms",
          "Ready for top-tier company interviews",
        ],
        modules: [],
      },
      "data-science": {
        id: "data-science",
        title: "Data Science Interview Prep",
        description:
          "Master statistics, ML algorithms, and Python for data science roles",
        duration: "8-10 weeks",
        difficulty: "Intermediate",
        prerequisite: "Python programming, basic statistics",
        outcomes: [
          "Master statistics and probability for DS interviews",
          "Understand ML algorithms and their applications",
          "Practice SQL and data manipulation",
          "Build portfolio projects for interviews",
        ],
        modules: [],
      },
      ai: aiLearningPath,
      lld: {
        id: "lld",
        title: "Low Level Design",
        description:
          "Master OOP, design patterns, and build clean code architectures",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        prerequisite: "OOP concepts, programming experience",
        outcomes: [
          "Master SOLID principles and design patterns",
          "Design scalable and maintainable systems",
          "Practice real-world LLD interview questions",
          "Build clean, modular code architectures",
        ],
        modules: [],
      },
      hld: {
        id: "hld",
        title: "High Level Design",
        description:
          "System design for scalable, distributed systems and architectures",
        duration: "8-10 weeks",
        difficulty: "Advanced",
        prerequisite: "Basic system design concepts, databases",
        outcomes: [
          "Design scalable distributed systems",
          "Master system design patterns and trade-offs",
          "Practice FAANG-level system design interviews",
          "Understand real-world architecture decisions",
        ],
        modules: [],
      },
    };

    const pathData = pathsData[pathId];

    if (!pathData) {
      return res.status(404).json({ error: "Learning path not found" });
    }

    res.json(pathData);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("problem_id, status")
      .eq("user_id", req.user.id);

    if (error) throw error;

    const progress = {};
    (data || []).forEach((row) => {
      progress[`problem_${row.problem_id}`] = {
        solved: row.status === "solved",
        progress: row.status === "solved" ? 100 : 0,
      };
    });

    res.json({ progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Get complete DSA learning path
router.get("/learning-path/dsa", optionalAuth, async (req, res) => {
  try {
    const userProgress = {};

    if (req.user) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", req.user.id);

      (data || []).forEach((row) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    const pathWithProgress = {
      ...dsaLearningPath,
      modules: dsaLearningPath.modules.map((module) => ({
        ...module,
        progress: getModuleProgress(module.slug, userProgress),
        problems: getModuleProblems(module.slug),
      })),
    };

    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching DSA learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

// Get specific module from DSA learning path
router.get(
  "/learning-path/dsa/module/:moduleSlug",
  optionalAuth,
  async (req, res) => {
    try {
      const { moduleSlug } = req.params;

      const module = dsaLearningPath.modules.find((m) => m.slug === moduleSlug);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const userProgress = {};

      if (req.user) {
        const { data } = await supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", req.user.id);

        (data || []).forEach((row) => {
          userProgress[`problem_${row.problem_id}`] = {
            solved: row.status === "solved",
          };
        });
      }

      const problems = getModuleProblems(moduleSlug);
      const progress = getModuleProgress(moduleSlug, userProgress);

      res.json({
        ...module,
        problems,
        progress,
      });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  },
);

// Get complete LLD learning path
router.get("/learning-path/lld", optionalAuth, async (req, res) => {
  try {
    const completedProblems = {};

    if (req.user) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", req.user.id);

      (data || []).forEach((row) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    const pathWithProgress = {
      ...lldLearningPath,
      modules: lldLearningPath.modules.map((module) => {
        const moduleProblems = lldLearningPath.practiceProblems.filter((p) =>
          module.keyProblems?.some((kp) => kp.title === p.title),
        );

        const solved = moduleProblems.filter(
          (p) => completedProblems[p.id],
        ).length;
        const total = module.problemCount;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        return {
          ...module,
          progress: {
            solved,
            total,
            percentage,
          },
        };
      }),
    };

    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching LLD learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

// Get specific module from LLD learning path
router.get(
  "/learning-path/lld/module/:moduleSlug",
  optionalAuth,
  async (req, res) => {
    try {
      const { moduleSlug } = req.params;

      const module = lldLearningPath.modules.find((m) => m.slug === moduleSlug);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const completedProblems = {};

      if (req.user) {
        const { data } = await supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", req.user.id);

        (data || []).forEach((row) => {
          completedProblems[row.problem_id] = row.status === "solved";
        });
      }

      const relatedProblems = lldLearningPath.practiceProblems.filter((p) =>
        module.keyProblems?.some((kp) => kp.title === p.title),
      );

      const solved = relatedProblems.filter(
        (p) => completedProblems[p.id],
      ).length;
      const total = module.problemCount;
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

      res.json({
        ...module,
        relatedProblems,
        progress: {
          solved,
          total,
          percentage,
        },
      });
    } catch (error) {
      console.error("Error fetching LLD module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  },
);

// Get/Update user settings
router.get("/settings", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      settings: {
        full_name: profile.full_name,
        experience_level: profile.experience_level,
        subscription_tier: profile.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const { fullName, experienceLevel } = req.body;
    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      settings: {
        full_name: data.full_name,
        experience_level: data.experience_level,
        subscription_tier: data.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Settings update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Save user preferences (onboarding)
router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    const { experienceLevel, goals, targetCompanies } = req.body;
    const updates = {};
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", req.user.id);

      if (error) throw error;
    }

    res.json({ success: true, message: "Preferences saved" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Preferences update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// ==========================================
// TODO CRUD ENDPOINTS
// ==========================================

// GET /api/user/todos - List user's todos
router.get("/todos", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Transform to match frontend format
    const todos = (data || []).map(t => ({
      id: t.id,
      text: t.text,
      done: t.completed,
      priority: t.priority || 'medium',
      category: (t.category || 'Study').toLowerCase(),
      dueDate: t.due_date,
      createdAt: t.created_at,
      subtasks: t.subtasks || [],
    }));

    res.json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// POST /api/user/todos - Create a todo
router.post("/todos", authenticateToken, async (req, res) => {
  try {
    const { text, priority, category, dueDate, subtasks } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Todo text is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .insert({
        user_id: req.user.id,
        text: text.trim(),
        priority: priority || 'medium',
        category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Study',
        due_date: dueDate || null,
        subtasks: subtasks || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// PUT /api/user/todos/:id - Update a todo
router.put("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority, category, dueDate, subtasks } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (text !== undefined) updates.text = text.trim();
    if (completed !== undefined) updates.completed = completed;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category.charAt(0).toUpperCase() + category.slice(1);
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (subtasks !== undefined) updates.subtasks = subtasks;

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// DELETE /api/user/todos/:id - Delete a todo
router.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// DELETE /api/user/todos - Clear completed todos
router.delete("/todos", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("user_id", req.user.id)
      .eq("completed", true);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing completed todos:", error);
    res.status(500).json({ error: "Failed to clear completed todos" });
  }
});

// ==========================================
// CALENDAR EVENTS CRUD ENDPOINTS
// ==========================================

// GET /api/user/calendar-events - List user's calendar events
router.get("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .select("*")
      .eq("user_id", req.user.id)
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Group events by date key (YYYY-MM-DD)
    const eventsByDate = {};
    (data || []).forEach(evt => {
      const key = evt.event_date;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        id: evt.id,
        title: evt.title,
        time: evt.event_time || '',
        tag: evt.tag || 'study',
      });
    });

    res.json({ events: eventsByDate });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// POST /api/user/calendar-events - Create a calendar event
router.post("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { title, date, time, tag } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Event title is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Event date is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .insert({
        user_id: req.user.id,
        title: title.trim(),
        event_date: date,
        event_time: time || null,
        tag: tag || 'study',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// PUT /api/user/calendar-events/:id - Update a calendar event
router.put("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, time, tag } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (time !== undefined) updates.event_time = time;
    if (tag !== undefined) updates.tag = tag;

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

// DELETE /api/user/calendar-events/:id - Delete a calendar event
router.delete("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

// ==========================================
// DAILY CHALLENGE ENDPOINT
// ==========================================

// GET /api/user/daily-challenge - Get today's daily challenge
router.get("/daily-challenge", optionalAuth, async (req, res) => {
  try {
    // Use a simple seed from today's date to pick a consistent company for the day
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Import daily challenges data dynamically (same data as frontend)
    // We'll return the seed index so frontend can use it
    res.json({
      seed,
      dayOfYear: Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000),
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    res.status(500).json({ error: "Failed to fetch daily challenge" });
  }
});

export default router;
