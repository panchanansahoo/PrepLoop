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
router.get("/learning-paths", authenticateToken, async (req, res) => {
  try {
    const paths = [{
      id: "array",
      title: "Array Interview Track",
      description: "Master array problem-solving patterns with guided practice and IDE workflows",
      duration: "4-6 weeks",
      difficulty: "Beginner",
      modules: []
    }, {
      id: "dsa-basics",
      title: "DSA Basics",
      description: "Master fundamental data structures and algorithms from scratch",
      duration: "6-8 weeks",
      difficulty: "Beginner",
      modules: []
    }, {
      id: "dsa",
      title: "Advanced DSA",
      description: "Master advanced algorithms and complex data structures for FAANG interviews",
      duration: "10-12 weeks",
      difficulty: "Advanced",
      modules: []
    }, {
      id: "data-science",
      title: "Data Science Interview Prep",
      description: "Master statistics, ML algorithms, and Python for data science roles",
      duration: "8-10 weeks",
      difficulty: "Intermediate",
      modules: []
    }, {
      id: "ai",
      title: "AI & Machine Learning",
      description: "Deep learning, neural networks, and modern AI techniques",
      duration: "10-12 weeks",
      difficulty: "Advanced",
      modules: []
    }, {
      id: "lld",
      title: "Low Level Design",
      description: "Master OOP, design patterns, and build clean code architectures",
      duration: "6-8 weeks",
      difficulty: "Intermediate",
      modules: []
    }, {
      id: "hld",
      title: "High Level Design",
      description: "System design for scalable, distributed systems and architectures",
      duration: "8-10 weeks",
      difficulty: "Advanced",
      modules: []
    }, {
      id: "beginner",
      title: "Interview Prep Bootcamp",
      description: "Complete beginner-friendly interview preparation path",
      duration: "4-6 weeks",
      difficulty: "Beginner",
      modules: []
    }];
    res.json({
      paths
    });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    res.status(500).json({
      error: "Failed to fetch learning paths"
    });
  }
});
router.get("/learning-paths/:pathId", authenticateToken, async (req, res) => {
  try {
    const {
      pathId
    } = req.params;
    const pathsData = {
      array: {
        id: "array",
        title: "Array Interview Track",
        description: "Master array problem-solving patterns with guided practice and IDE workflows",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        prerequisite: "Basic programming fundamentals",
        outcomes: ["Understand array indexing, traversal, and in-place updates", "Use two pointers, sliding window, prefix sums, and hash maps confidently", "Solve common interview-style array problems with optimized complexity", "Practice and debug solutions quickly in an interview-like IDE"],
        modules: [{
          id: "array-foundations",
          title: "Array Foundations",
          description: "Core operations, complexity, and baseline techniques",
          topics: ["Traversal", "Insertion & Deletion", "Complexity Analysis"],
          lessons: [{
            title: "How arrays work in memory",
            duration: "25 min",
            type: "video"
          }, {
            title: "Operations and trade-offs",
            duration: "30 min",
            type: "reading"
          }, {
            title: "Practice set: easy warmup",
            duration: "90 min",
            type: "practice"
          }],
          problems: 12,
          estimatedTime: "4 days",
          unlocked: true
        }, {
          id: "array-two-pointers",
          title: "Two Pointers",
          description: "Master left-right pointer techniques for sorted and unsorted arrays",
          topics: ["Pair Search", "Deduplication", "In-place Partitioning"],
          lessons: [{
            title: "Two pointers pattern",
            duration: "35 min",
            type: "video"
          }, {
            title: "When to sort and when not to",
            duration: "25 min",
            type: "reading"
          }, {
            title: "Practice set: two pointers",
            duration: "2 hours",
            type: "practice"
          }],
          problems: 14,
          estimatedTime: "5 days",
          unlocked: true
        }, {
          id: "array-sliding-window",
          title: "Sliding Window",
          description: "Optimize subarray/substring range problems to linear time",
          topics: ["Fixed Window", "Variable Window", "Frequency Tracking"],
          lessons: [{
            title: "Sliding window intuition",
            duration: "35 min",
            type: "video"
          }, {
            title: "Template and pitfalls",
            duration: "30 min",
            type: "reading"
          }, {
            title: "Practice set: windows",
            duration: "2.5 hours",
            type: "practice"
          }],
          problems: 15,
          estimatedTime: "1 week",
          unlocked: true
        }]
      },
      "dsa-basics": {
        id: "dsa-basics",
        title: "DSA Basics",
        description: "Master fundamental data structures and algorithms from scratch",
        duration: "6-8 weeks",
        difficulty: "Beginner",
        prerequisite: "Basic programming knowledge",
        outcomes: ["Understand core data structures (arrays, linked lists, stacks, queues)", "Master basic algorithms and their time complexity", "Solve 100+ beginner-friendly problems", "Build strong foundation for advanced topics"],
        modules: []
      },
      dsa: {
        id: "dsa",
        title: "Advanced DSA",
        description: "Master advanced algorithms and complex data structures for FAANG interviews",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        prerequisite: "Strong foundation in basic DSA",
        outcomes: ["Master advanced data structures (Trees, Graphs, Heaps)", "Solve medium to hard LeetCode problems", "Understand dynamic programming and greedy algorithms", "Ready for top-tier company interviews"],
        modules: []
      },
      "data-science": {
        id: "data-science",
        title: "Data Science Interview Prep",
        description: "Master statistics, ML algorithms, and Python for data science roles",
        duration: "8-10 weeks",
        difficulty: "Intermediate",
        prerequisite: "Python programming, basic statistics",
        outcomes: ["Master statistics and probability for DS interviews", "Understand ML algorithms and their applications", "Practice SQL and data manipulation", "Build portfolio projects for interviews"],
        modules: []
      },
      ai: aiLearningPath,
      lld: {
        id: "lld",
        title: "Low Level Design",
        description: "Master OOP, design patterns, and build clean code architectures",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        prerequisite: "OOP concepts, programming experience",
        outcomes: ["Master SOLID principles and design patterns", "Design scalable and maintainable systems", "Practice real-world LLD interview questions", "Build clean, modular code architectures"],
        modules: []
      },
      hld: {
        id: "hld",
        title: "High Level Design",
        description: "System design for scalable, distributed systems and architectures",
        duration: "8-10 weeks",
        difficulty: "Advanced",
        prerequisite: "Basic system design concepts, databases",
        outcomes: ["Design scalable distributed systems", "Master system design patterns and trade-offs", "Practice FAANG-level system design interviews", "Understand real-world architecture decisions"],
        modules: []
      }
    };
    const pathData = pathsData[pathId];
    if (!pathData) {
      return res.status(404).json({
        error: "Learning path not found"
      });
    }
    res.json(pathData);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({
      error: "Failed to fetch learning path"
    });
  }
});
// Get complete DSA learning path
router.get("/learning-path/dsa", optionalAuth, async (req, res) => {
  try {
    let userProgress = {};
    if (req.user) {
      const {
        data
      } = await supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", req.user.id);
      (data || []).forEach(row => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved"
        };
      });
    }
    const pathWithProgress = {
      ...dsaLearningPath,
      modules: dsaLearningPath.modules.map(module => ({
        ...module,
        progress: getModuleProgress(module.slug, userProgress),
        problems: getModuleProblems(module.slug)
      }))
    };
    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching DSA learning path:", error);
    res.status(500).json({
      error: "Failed to fetch learning path"
    });
  }
});

// Get specific module from DSA learning path
router.get("/learning-path/dsa/module/:moduleSlug", optionalAuth, async (req, res) => {
  try {
    const {
      moduleSlug
    } = req.params;
    const module = dsaLearningPath.modules.find(m => m.slug === moduleSlug);
    if (!module) {
      return res.status(404).json({
        error: "Module not found"
      });
    }
    let userProgress = {};
    if (req.user) {
      const {
        data
      } = await supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", req.user.id);
      (data || []).forEach(row => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved"
        };
      });
    }
    const problems = getModuleProblems(moduleSlug);
    const progress = getModuleProgress(moduleSlug, userProgress);
    res.json({
      ...module,
      problems,
      progress
    });
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({
      error: "Failed to fetch module"
    });
  }
});

// Get complete LLD learning path
router.get("/learning-path/lld", optionalAuth, async (req, res) => {
  try {
    let completedProblems = {};
    if (req.user) {
      const {
        data
      } = await supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", req.user.id);
      (data || []).forEach(row => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }
    const pathWithProgress = {
      ...lldLearningPath,
      modules: lldLearningPath.modules.map(module => {
        const moduleProblems = lldLearningPath.practiceProblems.filter(p => module.keyProblems?.some(kp => kp.title === p.title));
        const solved = moduleProblems.filter(p => completedProblems[p.id]).length;
        const total = module.problemCount;
        const percentage = total > 0 ? Math.round(solved / total * 100) : 0;
        return {
          ...module,
          progress: {
            solved,
            total,
            percentage
          }
        };
      })
    };
    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching LLD learning path:", error);
    res.status(500).json({
      error: "Failed to fetch learning path"
    });
  }
});

// Get specific module from LLD learning path
router.get("/learning-path/lld/module/:moduleSlug", optionalAuth, async (req, res) => {
  try {
    const {
      moduleSlug
    } = req.params;
    const module = lldLearningPath.modules.find(m => m.slug === moduleSlug);
    if (!module) {
      return res.status(404).json({
        error: "Module not found"
      });
    }
    let completedProblems = {};
    if (req.user) {
      const {
        data
      } = await supabaseAdmin.from("user_progress").select("problem_id, status").eq("user_id", req.user.id);
      (data || []).forEach(row => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }
    const relatedProblems = lldLearningPath.practiceProblems.filter(p => module.keyProblems?.some(kp => kp.title === p.title));
    const solved = relatedProblems.filter(p => completedProblems[p.id]).length;
    const total = module.problemCount;
    const percentage = total > 0 ? Math.round(solved / total * 100) : 0;
    res.json({
      ...module,
      relatedProblems,
      progress: {
        solved,
        total,
        percentage
      }
    });
  } catch (error) {
    console.error("Error fetching LLD module:", error);
    res.status(500).json({
      error: "Failed to fetch module"
    });
  }
});

// Get/Update user settings

export default router;