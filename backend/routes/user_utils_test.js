import _express from "express";
import { supabaseAdmin } from "../db/supabaseClient.js";
import { authenticateToken as _authenticateToken, optionalAuth as _optionalAuth } from "../middleware/auth.js";
import multer from 'multer';
import { validateCustomUrl as _validateCustomUrl, buildAvatarPath as _buildAvatarPath, claimCustomUrl as _claimCustomUrl } from '../utils/profileUtils.js';
import _dsaLearningPath, {
  getModuleProblems as _getModuleProblems,
  getModuleProgress as _getModuleProgress,
} from "../data/dsaLearningPath.js";
import _lldLearningPath from "../data/lldLearningPath.js";
import _aiLearningPath from "../data/aiLearningPath.js";
import { applyCoinTransaction } from "../utils/coinTransactions.js";
import { calculateDashboardStreak as _calculateDashboardStreak } from "../utils/dashboardStreak.js";
import { normalizeProfileUpdatePayload as _normalizeProfileUpdatePayload } from "../utils/profilePayload.js";


const PROFILE_COMPLETION_COIN_REWARD = 20;

// Multer memory storage for small avatar uploads
const _upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const _isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

const _isMissingRelationError = (error) => {
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

const _normalizeQuizTopic = (value) => {
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

const _buildProfileResponse = (req, profile) => {
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
    qualification: profile?.qualification || profile?.education || '',
    experience: experienceSummary || (experienceYears !== null ? String(experienceYears) : experienceLevel),
    experienceSummary,
    experienceYears,
    company: profile?.company || '',
    designation: profile?.designation || '',
    avatar_url: profile?.avatar_url || '',
    githubUsername: profile?.github_username || '',
    github_username: profile?.github_username || '',
    coins: profile?.coins ?? 0,
    custom_url: profile?.custom_url || '',
    is_public: profile?.is_public ?? false,

    // New profile fields
    phone: profile?.phone || '',
    location: profile?.location || '',
    website: profile?.website || '',
    yearsOfExperience: profile?.years_of_experience || '',
    specialization: profile?.specialization || '',
    projects: profile?.projects || [],
    certifications: profile?.certifications || [],
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
      qualification: flatProfile.qualification,
      experience: flatProfile.experience,
      experience_summary: flatProfile.experienceSummary,
      experience_years: flatProfile.experienceYears,
      company: flatProfile.company,
      designation: flatProfile.designation,
      avatar_url: flatProfile.avatar_url,
      github_username: flatProfile.githubUsername,
      githubUsername: flatProfile.githubUsername,
      coins: flatProfile.coins,
      is_public: flatProfile.is_public,

      // New profile fields
      phone: flatProfile.phone,
      location: flatProfile.location,
      website: flatProfile.website,
      years_of_experience: flatProfile.yearsOfExperience,
      specialization: flatProfile.specialization,
      projects: flatProfile.projects,
      certifications: flatProfile.certifications,
      social_links: flatProfile.socialLinks,
      twitter: flatProfile.socialLinks?.twitter,
      linkedin: flatProfile.socialLinks?.linkedin,
      portfolio: flatProfile.socialLinks?.portfolio,
      dribbble: flatProfile.socialLinks?.dribbble
    },
    custom_url: flatProfile.custom_url,
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
    profile?.education || profile?.qualification,
    profile?.bio,
    profile?.location,  // New field
    profile?.company   // New field
  ].every(hasText);
};

const _awardProfileCompletionCoins = async (userId, profile) => {
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

const _getDashboardPatternCatalog = async () => {
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

const _getLevelProgressInfo = (xp) => {
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

const _getWeekRange = (offsetWeeks = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - (offsetWeeks * 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
};

const _buildWeeklyStats = (submissions, start, end) => {
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

const _buildDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const _computeCurrentStreak = (dateKeys = []) => {
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

const _toDisplayName = (profile) => {
  const fullName = String(profile?.full_name || '').trim();
  if (fullName.length > 0) return fullName;

  const id = String(profile?.id || '').trim();
  if (!id) return 'Anonymous Engineer';

  return `Engineer ${id.slice(0, 6)}`;
};










const _getStableDailySeed = () => {
  const now = new Date();
  return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`);
};

const _pickDeterministicItems = (items, count, seed) => {
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

const _buildUpcomingItemsFromCalendar = (events = []) => {
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

const _fetchSqlProblemRecommendations = async (limit = 250) => {
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




// Public portfolio by slug (custom_url) or id





// POST /api/user/profile/avatar - Upload avatar image and update profile.avatar_url



// POST /api/user/profile/claim-url - Claim a custom public profile URL


















// Get complete DSA learning path



// Get specific module from DSA learning path

// Get complete LLD learning path



// Get specific module from LLD learning path

// Get/Update user settings






// Save user preferences (onboarding)



// ==========================================
// TODO CRUD ENDPOINTS
// ==========================================

// GET /api/user/todos - List user's todos



// POST /api/user/todos - Create a todo



// PUT /api/user/todos/:id - Update a todo



// DELETE /api/user/todos/:id - Delete a todo



// DELETE /api/user/todos - Clear completed todos



// ==========================================
// CALENDAR EVENTS CRUD ENDPOINTS
// ==========================================

// GET /api/user/calendar-events - List user's calendar events



// POST /api/user/calendar-events - Create a calendar event



// PUT /api/user/calendar-events/:id - Update a calendar event



// DELETE /api/user/calendar-events/:id - Delete a calendar event



// ==========================================
// DAILY CHALLENGE ENDPOINT
// ==========================================

// GET /api/user/daily-challenge - Get today's daily challenge




