import express from "express";
import { supabaseAdmin } from "../../db/supabaseClient.js";
import { authenticateToken, optionalAuth as _optionalAuth } from "../../middleware/auth.js";
import multer from 'multer';
import { validateCustomUrl as _validateCustomUrl, buildAvatarPath, claimCustomUrl } from "../../utils/profileUtils.js";
import _dsaLearningPath, {
  getModuleProblems as _getModuleProblems,
  getModuleProgress as _getModuleProgress,
} from "../../data/dsaLearningPath.js";
import _lldLearningPath from "../../data/lldLearningPath.js";
import _aiLearningPath from "../../data/aiLearningPath.js";
import { applyCoinTransaction } from "../../utils/coinTransactions.js";
import { calculateDashboardStreak as _calculateDashboardStreak } from "../../utils/dashboardStreak.js";
import { normalizeProfileUpdatePayload } from "../../utils/profilePayload.js";


const PROFILE_COMPLETION_COIN_REWARD = 20;

// Multer memory storage for small avatar uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

const _isMissingRelationError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || message.includes('does not exist');
};

const _QUIZ_TOPICS = new Set([
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
  return _QUIZ_TOPICS.has(resolved) ? resolved : null;
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

const _XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

const _LEVELS = [
  { name: 'Novice', minXP: 0 },
  { name: 'Apprentice', minXP: 100 },
  { name: 'Intermediate', minXP: 350 },
  { name: 'Advanced', minXP: 800 },
  { name: 'Expert', minXP: 1800 },
  { name: 'Master', minXP: 4000 },
  { name: 'Grandmaster', minXP: 8000 },
  { name: 'Legend', minXP: 15000 },
];

const _DASHBOARD_PATTERN_CACHE_TTL_MS = 10 * 60 * 1000;
let _dashboardPatternCatalogCache = {
  fetchedAt: 0,
  patternMap: new Map(),
  problemCountByPatternId: new Map(),
};

const _getDashboardPatternCatalog = async () => {
  const now = Date.now();
  if (
    _dashboardPatternCatalogCache.fetchedAt &&
    now - _dashboardPatternCatalogCache.fetchedAt < _DASHBOARD_PATTERN_CACHE_TTL_MS
  ) {
    return _dashboardPatternCatalogCache;
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

  _dashboardPatternCatalogCache = {
    fetchedAt: now,
    patternMap,
    problemCountByPatternId,
  };

  return _dashboardPatternCatalogCache;
};

const _getLevelInfo = (xp) => {
  const safeXP = Number(xp) || 0;

  for (let index = _LEVELS.length - 1; index >= 0; index -= 1) {
    if (safeXP >= _LEVELS[index].minXP) {
      return { ..._LEVELS[index], index };
    }
  }

  return { ..._LEVELS[0], index: 0 };
};

const _getLevelProgressInfo = (xp) => {
  const totalXP = Number(xp) || 0;
  const currentLevel = _getLevelInfo(totalXP);
  const nextLevel = _LEVELS[currentLevel.index + 1] || null;

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
    accumulator.xp += _XP_BY_DIFFICULTY[difficulty] || _XP_BY_DIFFICULTY.easy;
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

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

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

router.get('/portfolio/public/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug required' });

    // Try by custom_url first
    const { data: profileQuery, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('custom_url', slug)
      .maybeSingle();

    let profile = profileQuery;

    if (error) {
      console.error('Error fetching public profile by custom_url:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!profile) {
      // Fallback: try by id
      const byId = await supabaseAdmin.from('profiles').select('*').eq('id', slug).maybeSingle();
      if (byId.error) {
        console.error('Error fetching public profile by id:', byId.error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      profile = byId.data || null;
    }

    if (!profile) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!profile.is_public) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    // Build a lightweight portfolio object expected by frontend
    const basics = {
      name: profile.full_name || profile.fullName || '',
      title: profile.designation || profile.current_role || profile.currentRole || '',
      photo: profile.avatar_url || profile.avatarUrl || '',
      location: profile.location || '',
      email: profile.email || '',
      website: profile.website || '',
      summary: profile.bio || ''
    };

    const socials = {
      github: profile.github_username || profile.githubUsername || '',
      linkedin: profile.linkedin || (profile.social_links && profile.social_links.linkedin) || '',
      twitter: profile.twitter || (profile.social_links && profile.social_links.twitter) || '',
      portfolio: profile.portfolio || (profile.social_links && profile.social_links.portfolio) || ''
    };

    const skills = {
      list: (String(profile.skills || '')).split(',').map(s => s.trim()).filter(Boolean)
    };

    const experience = (String(profile.experience || profile.experience_summary || '')).split(/\n|\.|;/).map(s => s.trim()).filter(Boolean);
    const education = profile.education ? [profile.education] : [];

    const portfolio = {
      basics,
      socials,
      skills: { languages: skills.list, frameworks: [], tools: [], domains: [] },
      experience,
      education,
      projects: [],
      achievements: [],
      openSource: { totalStars: 0, totalRepos: 0 },
      portfolioMeta: { template: 'minimal-professional', sectionVisibility: {} }
    };

    res.json({ portfolio });
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
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

    let rewardResult = { coinsAwarded: 0, coinBalance: data?.coins ?? 0, applied: false };
    let rewardDegraded = false;

    try {
      rewardResult = await awardProfileCompletionCoins(req.user.id, data);
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

router.post('/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = buildAvatarPath(req.user.id, file.originalname);

    // Upload to Supabase storage (requires a bucket named 'avatars')
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }

    // Get public URL
    const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl || null;

    // Update profile record
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Profile avatar update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile avatar' });
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch profile after avatar update:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    return res.json(buildProfileResponse(req, profile));
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.post('/profile/claim-url', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated' });

    const requested = String(req.body?.custom_url || '').trim().toLowerCase();
    if (!requested) return res.status(400).json({ error: 'custom_url is required' });

    // Validate: 3-30 chars, lowercase letters, numbers, and dashes
    if (!/^[a-z0-9-]{3,30}$/.test(requested)) {
      return res.status(400).json({ error: 'Invalid custom_url format. Use 3-30 chars: a-z, 0-9, -' });
    }

    try {
      const result = await claimCustomUrl(supabaseAdmin, req.user.id, requested);
      if (!result.success) {
        if (result.error === 'taken') return res.status(409).json({ error: 'custom_url already taken' });
        return res.status(400).json({ error: 'Invalid custom_url' });
      }

      const profileRow = result.profile || (await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).maybeSingle()).data;
      return res.json(buildProfileResponse(req, profileRow));
    } catch (err) {
      console.error('Claim URL error:', err);
      return res.status(500).json({ error: 'Failed to claim custom_url' });
    }
  } catch (error) {
    console.error('Claim URL error:', error);
    res.status(500).json({ error: 'Failed to claim custom_url' });
  }
});

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

router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    const { experienceLevel, goals: _goals, targetCompanies: _targetCompanies } = req.body;
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

export default router;
