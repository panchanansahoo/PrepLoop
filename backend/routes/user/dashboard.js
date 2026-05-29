import express from "express";
import { supabaseAdmin } from "../../db/supabaseClient.js";
import { authenticateToken, optionalAuth } from "../../middleware/auth.js";
import multer from 'multer';
import { validateCustomUrl, buildAvatarPath, claimCustomUrl } from '../../utils/profileUtils.js';
import dsaLearningPath, { getModuleProblems, getModuleProgress } from "../../data/dsaLearningPath.js";
import lldLearningPath from "../../data/lldLearningPath.js";
import aiLearningPath from "../../data/aiLearningPath.js";
import { applyCoinTransaction } from "../../utils/coinTransactions.js";
import { calculateDashboardStreak } from "../../utils/dashboardStreak.js";
import { normalizeProfileUpdatePayload } from "../../utils/profilePayload.js";
const router = express.Router();
const PROFILE_COMPLETION_COIN_REWARD = 20;

// Multer memory storage for small avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
const isProfilesAccessBlocked = error => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};
const isMissingRelationError = error => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || message.includes('does not exist');
};
const QUIZ_TOPICS = new Set(['dsa', 'db', 'system-design', 'language', 'os', 'cn', 'oop']);
const normalizeQuizTopic = value => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  const aliases = {
    dbms: 'db',
    database: 'db',
    'system-design': 'system-design',
    systemdesign: 'system-design',
    networking: 'cn',
    'computer-networks': 'cn',
    'programming-language': 'language',
    languages: 'language'
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
    qualification: profile?.qualification || profile?.education || '',
    experience: experienceSummary || (experienceYears != null ? String(experienceYears) : experienceLevel),
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
      social_links: flatProfile.socialLinks,
      twitter: flatProfile.socialLinks?.twitter,
      linkedin: flatProfile.socialLinks?.linkedin,
      portfolio: flatProfile.socialLinks?.portfolio,
      dribbble: flatProfile.socialLinks?.dribbble
    },
    custom_url: flatProfile.custom_url,
    profile: flatProfile,
    ...flatProfile
  };
};
const hasText = value => String(value ?? '').trim().length > 0;
const isProfileCompleteForReward = profile => {
  const experienceValue = profile?.experience_summary ?? profile?.experience_years ?? profile?.experience_level ?? '';

  // Check for basic required fields plus new enhanced fields
  return [profile?.full_name, profile?.designation, experienceValue, profile?.skills, profile?.education || profile?.qualification, profile?.bio, profile?.location,
  // New field
  profile?.company // New field
  ].every(hasText);
};
const awardProfileCompletionCoins = async (userId, profile) => {
  if (!profile || !isProfileCompleteForReward(profile)) {
    return {
      coinsAwarded: 0,
      coinBalance: profile?.coins ?? null,
      applied: false
    };
  }
  const description = 'Profile completed'.slice(0, 160);
  const referenceKey = `profile_complete:${userId}`;
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: PROFILE_COMPLETION_COIN_REWARD,
    type: 'earn',
    description,
    referenceKey
  });
  if (atomicResult.handled) {
    if (!atomicResult.success) {
      throw new Error(atomicResult.error || 'Failed to award profile completion coins');
    }
    return {
      coinsAwarded: atomicResult.applied ? PROFILE_COMPLETION_COIN_REWARD : 0,
      coinBalance: atomicResult.balance,
      applied: atomicResult.applied
    };
  }
  const {
    data: existingReward,
    error: existingRewardError
  } = await supabaseAdmin.from('coin_transactions').select('id').eq('user_id', userId).eq('type', 'earn').eq('description', description).limit(1);
  if (existingRewardError) throw existingRewardError;
  if (existingReward?.length) {
    return {
      coinsAwarded: 0,
      coinBalance: profile?.coins ?? 0,
      applied: false
    };
  }
  const currentCoins = Number(profile?.coins || 0);
  const newBalance = currentCoins + PROFILE_COMPLETION_COIN_REWARD;
  const {
    error: updateError
  } = await supabaseAdmin.from('profiles').update({
    coins: newBalance
  }).eq('id', userId);
  if (updateError) throw updateError;
  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: PROFILE_COMPLETION_COIN_REWARD,
    type: 'earn',
    description
  });
  return {
    coinsAwarded: PROFILE_COMPLETION_COIN_REWARD,
    coinBalance: newBalance,
    applied: true
  };
};
const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50
};
const LEVELS = [{
  name: 'Novice',
  minXP: 0
}, {
  name: 'Apprentice',
  minXP: 100
}, {
  name: 'Intermediate',
  minXP: 350
}, {
  name: 'Advanced',
  minXP: 800
}, {
  name: 'Expert',
  minXP: 1800
}, {
  name: 'Master',
  minXP: 4000
}, {
  name: 'Grandmaster',
  minXP: 8000
}, {
  name: 'Legend',
  minXP: 15000
}];
const DASHBOARD_PATTERN_CACHE_TTL_MS = 10 * 60 * 1000;
let dashboardPatternCatalogCache = {
  fetchedAt: 0,
  patternMap: new Map(),
  problemCountByPatternId: new Map()
};
const getDashboardPatternCatalog = async () => {
  const now = Date.now();
  if (dashboardPatternCatalogCache.fetchedAt && now - dashboardPatternCatalogCache.fetchedAt < DASHBOARD_PATTERN_CACHE_TTL_MS) {
    return dashboardPatternCatalogCache;
  }
  const [patternsResult, problemsResult] = await Promise.all([supabaseAdmin.from("patterns").select("id, name"), supabaseAdmin.from("problems").select("pattern_id")]);
  if (patternsResult.error) throw patternsResult.error;
  if (problemsResult.error) throw problemsResult.error;
  const patternMap = new Map();
  (patternsResult.data || []).forEach(pattern => {
    patternMap.set(pattern.id, pattern);
  });
  const problemCountByPatternId = new Map();
  (problemsResult.data || []).forEach(problem => {
    const patternId = problem.pattern_id;
    if (!patternId) return;
    problemCountByPatternId.set(patternId, (problemCountByPatternId.get(patternId) || 0) + 1);
  });
  dashboardPatternCatalogCache = {
    fetchedAt: now,
    patternMap,
    problemCountByPatternId
  };
  return dashboardPatternCatalogCache;
};
const getLevelInfo = xp => {
  const safeXP = Number(xp) || 0;
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (safeXP >= LEVELS[index].minXP) {
      return {
        ...LEVELS[index],
        index
      };
    }
  }
  return {
    ...LEVELS[0],
    index: 0
  };
};
const getLevelProgressInfo = xp => {
  const totalXP = Number(xp) || 0;
  const currentLevel = getLevelInfo(totalXP);
  const nextLevel = LEVELS[currentLevel.index + 1] || null;
  if (!nextLevel) {
    return {
      currentLevel,
      currentXP: totalXP,
      nextLevelXP: totalXP,
      rank: currentLevel.name
    };
  }
  return {
    currentLevel,
    currentXP: totalXP - currentLevel.minXP,
    nextLevelXP: nextLevel.minXP,
    rank: currentLevel.name
  };
};
const getWeekRange = (offsetWeeks = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - offsetWeeks * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    start,
    end
  };
};
const buildWeeklyStats = (submissions, start, end) => {
  const accepted = (submissions || []).filter(submission => {
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
  }, {
    problems: 0,
    timeHours: 0,
    xp: 0
  });
  return {
    problems: totals.problems,
    time: Number(totals.timeHours.toFixed(1)),
    xp: totals.xp
  };
};
const buildDateKey = value => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};
const computeCurrentStreak = (dateKeys = []) => {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0;
  const uniqueSorted = [...new Set(dateKeys)].filter(Boolean).sort((left, right) => left < right ? 1 : -1);
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
const toDisplayName = profile => {
  const fullName = String(profile?.full_name || '').trim();
  if (fullName.length > 0) return fullName;
  const id = String(profile?.id || '').trim();
  if (!id) return 'Anonymous Engineer';
  return `Engineer ${id.slice(0, 6)}`;
};
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
  return (events || []).filter(evt => {
    if (!evt?.event_date) return false;
    const eventDate = new Date(`${evt.event_date}T${evt.event_time || '00:00'}:00`);
    return eventDate >= now;
  }).sort((a, b) => {
    const left = new Date(`${a.event_date}T${a.event_time || '00:00'}:00`).getTime();
    const right = new Date(`${b.event_date}T${b.event_time || '00:00'}:00`).getTime();
    return left - right;
  }).slice(0, 8).map(evt => {
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
      live: true
    };
  });
};
const fetchSqlProblemRecommendations = async (limit = 250) => {
  const candidates = [{
    table: 'sql_problems',
    select: 'id, title, difficulty'
  }, {
    table: 'sql_challenges',
    select: 'id, title, difficulty'
  }, {
    table: 'sql_questions',
    select: 'id, title, difficulty'
  }, {
    table: 'problems_sql',
    select: 'id, title, difficulty'
  }];
  for (const candidate of candidates) {
    const {
      data,
      error
    } = await supabaseAdmin.from(candidate.table).select(candidate.select).limit(limit);
    if (error || !Array.isArray(data) || data.length === 0) {
      continue;
    }
    const normalized = data.map((row, index) => ({
      id: row.id ?? index + 1,
      title: String(row.title || '').trim(),
      difficulty: row.difficulty || 'Medium'
    })).filter(row => row.title.length > 0);
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
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sqlProblemsPromise = fetchSqlProblemRecommendations(250);
    const [progressResult, submissionsResult, interviewsResult, resumesResult, dailyProblemsResult, calendarEventsResult, sqlProblems] = await Promise.all([supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", userId), supabaseAdmin.from("submissions").select("submitted_at, status, problem_id, execution_time, problems(title, difficulty)").eq("user_id", userId).order("submitted_at", {
      ascending: false
    }), supabaseAdmin.from("mock_interviews").select("id, interview_type, overall_score, communication_score, technical_score, problem_solving_score, started_at, completed_at").eq("user_id", userId).order("started_at", {
      ascending: false
    }), supabaseAdmin.from("resume_analyses").select("id").eq("user_id", userId), supabaseAdmin.from("problems").select("id, title, difficulty").order("id", {
      ascending: true
    }).limit(400), supabaseAdmin.from("user_calendar_events").select("title, event_date, event_time, tag").eq("user_id", userId).order("event_date", {
      ascending: true
    }), sqlProblemsPromise]);
    if (progressResult.error) throw progressResult.error;
    if (submissionsResult.error) throw submissionsResult.error;
    if (interviewsResult.error) throw interviewsResult.error;
    if (resumesResult.error) throw resumesResult.error;
    if (dailyProblemsResult.error) throw dailyProblemsResult.error;
    const progress = progressResult.data || [];
    const subs = submissionsResult.data || [];
    const interviews = interviewsResult.data || [];
    const resumes = resumesResult.data || [];
    const allProblems = dailyProblemsResult.data || [];
    const calendarEvents = calendarEventsResult.error ? [] : calendarEventsResult.data || [];
    const solvedCount = (progress || []).filter(p => p.status === "solved").length;
    const completedInterviews = interviews.filter(i => i.completed_at);

    // ── 5) Streak calculation (consecutive days ending today) ──
    // Combine activity from submissions AND user_activity table
    const activityResult = await supabaseAdmin.from('user_activity').select('date, seconds_active').eq('user_id', userId).gte('seconds_active', 60); // At least 1 minute of activity

    const activityDates = (activityResult.data || []).map(activity => activity.date);
    const submissionDates = subs.map(submission => submission.submitted_at);
    const {
      currentStreak,
      bestStreak,
      weekProgress
    } = calculateDashboardStreak({
      submissionDateKeys: submissionDates,
      activityDateValues: activityDates
    });

    // Update profile with latest streak data
    try {
      await supabaseAdmin.from('profiles').update({
        daily_streak: currentStreak,
        best_streak: Math.max(bestStreak, currentStreak),
        last_active_date: new Date().toISOString().split('T')[0]
      }).eq('id', userId);
    } catch (updateError) {
      console.error('Error updating profile streak:', updateError);
    }

    // ── 6) Average interview score ──
    let avgScore = 0;
    if (completedInterviews.length > 0) {
      const totalScore = completedInterviews.reduce((sum, i) => sum + (i.overall_score || 0), 0);
      avgScore = Math.round(totalScore / completedInterviews.length);
    }

    // ── 7) Total XP (derived from real activity) ──
    const acceptedSubmissions = subs.filter(submission => submission.status === 'accepted');
    const totalProblemXP = acceptedSubmissions.reduce((sum, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      return sum + (XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy);
    }, 0);
    const totalXP = totalProblemXP + completedInterviews.length * 50;

    // ── 8) Heatmap data (last 365 days, only accepted submissions grouped by date) ──
    const heatmapData = {};
    let totalSolvedYear = 0;
    let todaySolved = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    subs.forEach(s => {
      if (s.status !== "accepted") return; // Only count solved problems
      const dateKey = new Date(s.submitted_at).toISOString().split("T")[0];
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = {
          solved: 0,
          xp: 0,
          easy: 0,
          medium: 0,
          hard: 0
        };
      }
      heatmapData[dateKey].solved++;
      heatmapData[dateKey].xp += 25;
      const diff = s.problems?.difficulty?.toLowerCase();
      if (diff === "easy") heatmapData[dateKey].easy++;else if (diff === "medium") heatmapData[dateKey].medium++;else if (diff === "hard") heatmapData[dateKey].hard++;
      totalSolvedYear++;
      if (dateKey === todayStr) todaySolved++;
    });

    // ── 9) Skill breakdown (for radar chart) ──
    // Count solved problems by category/tags
    const solvedProblemIds = new Set((progress || []).filter(p => p.status === "solved").map(p => p.problem_id));
    const unsolvedProblems = allProblems.filter(problem => !solvedProblemIds.has(problem.id));
    const dailyPool = unsolvedProblems.length > 0 ? unsolvedProblems : allProblems;
    const dailySeed = getStableDailySeed() + Number(userId?.length || 0);
    const dailyDsa = pickDeterministicItems(dailyPool, 3, dailySeed).map(problem => ({
      title: problem.title,
      difficulty: problem.difficulty || 'Medium',
      internalId: problem.id
    }));
    const dailySql = pickDeterministicItems(sqlProblems, 3, dailySeed + 97).map(problem => ({
      title: problem.title,
      difficulty: problem.difficulty || 'Medium',
      internalId: problem.id
    }));
    const dailyChallenge = {
      name: 'Personalized DSA Challenge',
      type: 'From Your DB Progress',
      dsa: dailyDsa,
      sql: dailySql
    };
    const upcomingContests = buildUpcomingItemsFromCalendar(calendarEvents);
    let skillBreakdown = {
      dsa: 0,
      sql: 0,
      aptitude: 0,
      systemDesign: 0,
      behavioral: 0
    };
    // DSA score based on solved count
    skillBreakdown.dsa = solvedCount > 0 ? Math.min(100, solvedCount) : 0;
    // SQL, aptitude from mock interview types
    const sqlInterviews = completedInterviews.filter(i => i.interview_type?.toLowerCase().includes("sql"));
    const aptitudeInterviews = completedInterviews.filter(i => i.interview_type?.toLowerCase().includes("aptitude"));
    const sysDesignInterviews = completedInterviews.filter(i => i.interview_type?.toLowerCase().includes("system") || i.interview_type?.toLowerCase().includes("design"));
    const behavioralInterviews = completedInterviews.filter(i => i.interview_type?.toLowerCase().includes("behavioral") || i.interview_type?.toLowerCase().includes("hr"));
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
    const patternColors = ['#a78bfa', '#38bdf8', '#22c55e', '#f59e0b', '#fb923c', '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4'];
    const [catalog, solvedProblemPatternsResult] = await Promise.all([getDashboardPatternCatalog(), solvedProblemIds.size > 0 ? supabaseAdmin.from("problems").select("id, pattern_id").in("id", [...solvedProblemIds]) : Promise.resolve({
      data: [],
      error: null
    })]);
    if (solvedProblemPatternsResult.error) throw solvedProblemPatternsResult.error;
    const solvedCountByPatternId = new Map();
    (solvedProblemPatternsResult.data || []).forEach(problem => {
      const patternId = problem.pattern_id;
      if (!patternId) return;
      solvedCountByPatternId.set(patternId, (solvedCountByPatternId.get(patternId) || 0) + 1);
    });
    Array.from(catalog.patternMap.values()).forEach((pattern, idx) => {
      const total = catalog.problemCountByPatternId.get(pattern.id) || 0;
      if (total === 0) return;
      topicProgressMap[pattern.name] = {
        name: pattern.name,
        solved: solvedCountByPatternId.get(pattern.id) || 0,
        total,
        color: patternColors[idx % patternColors.length]
      };
    });
    const topicProgress = Object.values(topicProgressMap);

    // ── 11) Recent activity (merged submissions + interviews) ──
    const recentActivity = [];

    // Recent submissions (max 6)
    subs.slice(0, 6).forEach(s => {
      recentActivity.push({
        type: s.status === "accepted" ? "problem_solved" : "dsa_practice",
        title: s.problems?.title ? `${s.problems.title} — ${s.status === "accepted" ? "Accepted" : "Attempted"}` : "Problem submission",
        timestamp: s.submitted_at
      });
    });

    // Recent completed interviews (max 4)
    completedInterviews.slice(0, 4).forEach(i => {
      recentActivity.push({
        type: "interview_done",
        title: `Mock Interview: ${i.interview_type || "General"} — ${i.overall_score ? i.overall_score + "%" : "Completed"}`,
        timestamp: i.completed_at || i.started_at
      });
    });

    // Sort by timestamp descending and limit to 6
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivityFinal = recentActivity.slice(0, 6);

    // ── 12) Weekly goals data (solved this week by difficulty) ──
    const thisWeekRange = getWeekRange(0);
    const lastWeekRange = getWeekRange(1);
    const thisWeekAccepted = subs.filter(submission => {
      const submittedAt = new Date(submission.submitted_at);
      return submission.status === 'accepted' && submittedAt >= thisWeekRange.start && submittedAt < thisWeekRange.end;
    });
    const weeklyByDifficulty = thisWeekAccepted.reduce((accumulator, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      if (difficulty === 'hard') accumulator.hard += 1;else if (difficulty === 'medium') accumulator.medium += 1;else accumulator.easy += 1;
      return accumulator;
    }, {
      easy: 0,
      medium: 0,
      hard: 0
    });
    const thisWeek = buildWeeklyStats(subs, thisWeekRange.start, thisWeekRange.end);
    const lastWeek = buildWeeklyStats(subs, lastWeekRange.start, lastWeekRange.end);
    const levelInfo = getLevelProgressInfo(totalXP);

    // ── 13) Readiness data ──
    const readinessData = {
      practiceCount: solvedCount,
      mockCount: completedInterviews.length,
      streak: currentStreak,
      timedSessions: subs.filter(s => s.status === "accepted").length
    };
    const sessionsByDate = {};
    subs.forEach(submission => {
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
      }, {})
    };

    // ── Response ──
    res.json({
      stats: {
        problemsSolved: solvedCount,
        totalSubmissions: subs.length,
        mockInterviews: completedInterviews.length,
        resumesAnalyzed: (resumes || []).length
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
      pomodoroStats
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data"
    });
  }
});
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = [];

    // 1) Mock Interviews
    const {
      data: interviews
    } = await supabaseAdmin.from("mock_interviews").select("id, interview_type, overall_score, started_at, completed_at, company, role").eq("user_id", userId).order("started_at", {
      ascending: false
    });
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
    const {
      data: submissions
    } = await supabaseAdmin.from("submissions").select("id, submitted_at, status, problems(title, difficulty)").eq("user_id", userId).order("submitted_at", {
      ascending: false
    });
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
    const {
      data: resumes
    } = await supabaseAdmin.from("resume_analyses").select("id, created_at, overall_score").eq("user_id", userId).order("created_at", {
      ascending: false
    });
    if (resumes) {
      resumes.forEach(r => {
        sessions.push({
          id: `resume_${r.id}`,
          type: "resume",
          title: "Resume ATS Analysis",
          date: new Date(r.created_at).toISOString().split("T")[0],
          timestamp: new Date(r.created_at).getTime(),
          score: Math.round(r.ats_score) || 0,
          duration: "N/A"
        });
      });
    }

    // Sort by timestamp descending
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    res.json({
      sessions
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({
      error: "Failed to fetch user history"
    });
  }
});
router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const {
      data,
      error
    } = await supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", req.user.id);
    if (error) throw error;
    const progress = {};
    (data || []).forEach(row => {
      progress[`problem_${row.problem_id}`] = {
        solved: row.status === "solved",
        progress: row.status === "solved" ? 100 : 0
      };
    });
    res.json({
      progress
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      error: "Failed to fetch progress"
    });
  }
});

// Get complete DSA learning path

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
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    res.status(500).json({
      error: "Failed to fetch daily challenge"
    });
  }
});
export default router;