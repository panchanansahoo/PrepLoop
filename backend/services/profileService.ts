import { supabaseAdmin } from '../db/supabaseClient.js';
import cacheManager from '../utils/cacheManager.js';
import { buildAvatarPath, claimCustomUrl } from '../utils/profileUtils.js';
import { normalizeProfileUpdatePayload } from '../utils/profilePayload.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { isAdminEmail, invalidateUserRole } from '../middleware/auth.ts';
import { fetchGithubPortfolioData } from './portfolioGithubService.js';
import { scoreRepositoryVisibility } from './portfolioProfileNormalizerService.js';
import type {
  PublicPortfolio,
  SettingsCodeEditor,
  SettingsDifficulty,
  SettingsLanguage,
  UserSettings,
} from '../types/services.js';

export const PROFILE_COMPLETION_COIN_REWARD = 20;

export interface RawProfile {
  id?: string;
  email?: string;
  full_name?: string;
  subscription_tier?: string;
  experience_level?: string;
  experience_summary?: string;
  experience_years?: number | null;
  role?: string;
  created_at?: string | null;
  last_login?: string | null;
  bio?: string;
  designation?: string;
  current_role?: string;
  skills?: string;
  education?: string;
  qualification?: string;
  company?: string;
  avatar_url?: string;
  github_username?: string;
  coins?: number;
  custom_url?: string;
  is_public?: boolean;
  phone?: string;
  location?: string;
  website?: string;
  years_of_experience?: string;
  specialization?: string;
  profile_theme?: string;
  projects?: any[];
  certifications?: any[];
  social_links?: any;
  twitter?: string;
  linkedin?: string;
  portfolio?: string;
  dribbble?: string;
}

export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

export const hasText = (value: unknown): boolean => String(value ?? '').trim().length > 0;

export const isProfilesAccessBlocked = (error: any): boolean => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

/**
 * Checks whether user profile has all required fields to qualify for coin completion reward
 */
export const isProfileCompleteForReward = (profile: RawProfile | null | undefined): boolean => {
  if (!profile) return false;

  const experienceValue =
    profile.experience_summary ??
    profile.experience_years ??
    profile.experience_level ??
    '';

  return [
    profile.full_name,
    profile.designation,
    experienceValue,
    profile.skills,
    profile.education || profile.qualification,
    profile.bio,
    profile.location,
    profile.company,
  ].every(hasText);
};

/**
 * Computes profile completion percentage (0 - 100)
 */
export const calculateProfileCompletionPercentage = (profile: RawProfile | null | undefined): number => {
  if (!profile) return 0;

  const fields = [
    profile.full_name,
    profile.designation || profile.current_role,
    profile.bio,
    profile.skills,
    profile.education || profile.qualification,
    profile.location,
    profile.company,
    profile.github_username,
    profile.avatar_url,
  ];

  const completed = fields.filter(hasText).length;
  return Math.round((completed / fields.length) * 100);
};

/**
 * Formats database profile row into unified client-facing profile shape
 */
export const buildProfileResponse = (reqOrUser: any, profile: RawProfile) => {
  const userContext = reqOrUser && 'user' in reqOrUser ? reqOrUser.user : reqOrUser;
  const fullName = profile?.full_name || userContext?.user_metadata?.full_name || '';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const experienceLevel = profile?.experience_level || 'beginner';
  const isUserAdmin = userContext?.role === 'admin' || (userContext?.email ? isAdminEmail(userContext.email) : false) || profile?.role === 'admin';
  const role = isUserAdmin ? 'admin' : (profile?.role || userContext?.role || 'user');
  const experienceSummary = profile?.experience_summary || '';
  const experienceYears = profile?.experience_years ?? null;

  let parsedSocialLinks: Record<string, any> = {};
  if (typeof profile?.social_links === 'string') {
    try { parsedSocialLinks = JSON.parse(profile.social_links); } catch (_e) {}
  } else if (typeof profile?.social_links === 'object' && profile.social_links !== null) {
    parsedSocialLinks = profile.social_links;
  }

  const socialLinks = {
    ...parsedSocialLinks,
    twitter: profile?.twitter || parsedSocialLinks.twitter || '',
    linkedin: profile?.linkedin || parsedSocialLinks.linkedin || '',
    portfolio: profile?.portfolio || parsedSocialLinks.portfolio || '',
    dribbble: profile?.dribbble || parsedSocialLinks.dribbble || '',
  };

  const flatProfile: Record<string, any> = {
    id: profile?.id || userContext?.id,
    email: userContext?.email || profile?.email || '',
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
    experience: experienceSummary || (experienceYears !== null ? String(experienceYears) : ''),
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
    phone: profile?.phone || '',
    location: profile?.location || '',
    website: profile?.website || '',
    yearsOfExperience: profile?.years_of_experience || '',
    specialization: profile?.specialization || '',
    profileTheme: profile?.profile_theme || 'aurora',
    projects: profile?.projects || [],
    certifications: profile?.certifications || [],
    socialLinks,
  };

  const userPayload: Record<string, any> = { ...flatProfile };
  userPayload.social_links = flatProfile.socialLinks;
  userPayload.socialLinks = {
    twitter: flatProfile.socialLinks?.twitter,
    linkedin: flatProfile.socialLinks?.linkedin,
    portfolio: flatProfile.socialLinks?.portfolio,
    dribbble: flatProfile.socialLinks?.dribbble,
  };
  userPayload.profile = flatProfile;

  return {
    user: userPayload,
  };
};

/**
 * Idempotently awards 20 coins upon candidate profile completion
 */
export const awardProfileCompletionCoins = async (userId: string, profile: RawProfile) => {
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

  return {
    coinBalance: (atomicResult as any).balance ?? null,
    coinsAwarded: (atomicResult as any).applied ? PROFILE_COMPLETION_COIN_REWARD : 0,
    applied: Boolean((atomicResult as any).applied),
  };
};

/**
 * Fetches user profile from cache or database, auto-creating a default record if none exists.
 */
export const getOrCreateUserProfile = async (userContext: UserContext) => {
  const userId = userContext.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const cacheKey = `profile:${userId}`;
  let profile = await cacheManager.get(cacheKey).catch(() => null);

  if (profile) {
    if ((userContext.role === 'admin' || isAdminEmail(userContext.email)) && profile.role !== 'admin') {
      profile.role = 'admin';
      (supabaseAdmin as any).from('profiles').update({ role: 'admin' }).eq('id', userId).then(() => {}, () => {});
    }
    cacheManager.set(cacheKey, profile, 60).catch(() => {});
    return buildProfileResponse(userContext, profile);
  }

  const { data: fetchedProfile, error } = await (supabaseAdmin as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  profile = fetchedProfile;

  if (isProfilesAccessBlocked(error)) {
    return {
      ...buildProfileResponse(userContext, {
        id: userId,
        email: userContext.email,
        full_name: userContext.user_metadata?.full_name || '',
        subscription_tier: 'free',
        experience_level: 'beginner',
        role: userContext.role || 'user',
      }),
      degraded: true,
    };
  }

  if (error) {
    throw error;
  }

  if (profile) {
    if ((userContext.role === 'admin' || isAdminEmail(userContext.email)) && profile.role !== 'admin') {
      profile.role = 'admin';
      (supabaseAdmin as any).from('profiles').update({ role: 'admin' }).eq('id', userId).then(() => {}, () => {});
    }
    cacheManager.set(cacheKey, profile, 60).catch(() => {});
    return buildProfileResponse(userContext, profile);
  }

  // Create default profile
  const { data: newProfile, error: createError } = await (supabaseAdmin as any)
    .from('profiles')
    .insert({
      id: userId,
      full_name: userContext.user_metadata?.full_name || '',
      subscription_tier: 'free',
      experience_level: 'beginner',
      role: userContext.role || (isAdminEmail(userContext.email) ? 'admin' : 'user'),
      phone: '',
      location: '',
      website: '',
      company: '',
      years_of_experience: '',
      specialization: '',
      social_links: {},
    })
    .select()
    .single();

  if (createError) {
    return {
      ...buildProfileResponse(userContext, {
        id: userId,
        email: userContext.email,
        full_name: userContext.user_metadata?.full_name || '',
        subscription_tier: 'free',
        experience_level: 'beginner',
        role: userContext.role || 'user',
        phone: '',
        location: '',
        website: '',
        company: '',
        years_of_experience: '',
        specialization: '',
        social_links: {},
      }),
      degraded: true,
    };
  }

  return buildProfileResponse(userContext, newProfile);
};

/**
 * Resolves a public portfolio view by custom URL, UUID, or slugified full name.
 */
export const getPublicPortfolioBySlug = async (rawSlug: string, currentUserId?: string | null): Promise<PublicPortfolio | { notFound?: boolean; isPrivate?: boolean }> => {
  const slug = String(rawSlug || '').trim().toLowerCase();
  if (!slug) {
    return { notFound: true };
  }

  // 1. By custom_url
  const { data: initialProfile } = await (supabaseAdmin as any)
    .from('profiles')
    .select('*')
    .eq('custom_url', slug)
    .maybeSingle();

  let profile = initialProfile;

  // 2. By UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
  if (!profile && isUUID) {
    const byId = await (supabaseAdmin as any).from('profiles').select('*').eq('id', slug).maybeSingle();
    if (!byId.error && byId.data) {
      profile = byId.data;
    }
  }

  // 3. By slugified full_name
  if (!profile) {
    const nameFromSlug = slug.replace(/[-_]+/g, ' ').trim();
    const byName = await (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .ilike('full_name', nameFromSlug)
      .limit(1)
      .maybeSingle();
    if (!byName.error && byName.data) {
      profile = byName.data;
    }
  }

  if (!profile) {
    return { notFound: true };
  }

  const isOwner = Boolean(currentUserId && profile.id === currentUserId);
  if (!profile.is_public && !isOwner) {
    return { isPrivate: true };
  }

  let parsedSocialLinks: Record<string, any> = {};
  if (typeof profile.social_links === 'string') {
    try { parsedSocialLinks = JSON.parse(profile.social_links); } catch (_e) {}
  } else if (typeof profile.social_links === 'object' && profile.social_links !== null) {
    parsedSocialLinks = profile.social_links;
  }

  const skillsList = String(profile.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean);

  let experience: any[] = [];
  if (Array.isArray(profile.experience)) {
    experience = profile.experience;
  } else if (typeof profile.experience === 'string' && profile.experience.trim()) {
    experience = profile.experience.split(/\n|\.|;/).map((s: string) => s.trim()).filter(Boolean);
  } else if (profile.experience_summary) {
    experience = profile.experience_summary.split(/\n|\.|;/).map((s: string) => s.trim()).filter(Boolean);
  }

  let education: any[] = [];
  if (Array.isArray(profile.education)) {
    education = profile.education;
  } else if (profile.education) {
    education = [profile.education];
  }

  let projects: any[] = [];
  if (Array.isArray(profile.projects)) {
    projects = profile.projects;
  } else if (typeof profile.projects === 'string') {
    try { projects = JSON.parse(profile.projects); } catch (_e) {}
  }

  let achievements: any[] = [];
  if (Array.isArray(profile.certifications)) {
    achievements = profile.certifications;
  } else if (typeof profile.certifications === 'string') {
    try { achievements = JSON.parse(profile.certifications); } catch (_e) {}
  }

  return {
    basics: {
      name: profile.full_name || 'PrepLoop Member',
      title: profile.designation || profile.current_role || '',
      photo: profile.avatar_url || '',
      location: profile.location || '',
      email: profile.email || '',
      website: profile.website || '',
      summary: profile.bio || '',
    },
    socials: {
      github: profile.github_username || '',
      linkedin: profile.linkedin || parsedSocialLinks.linkedin || '',
      twitter: profile.twitter || parsedSocialLinks.twitter || '',
      portfolio: profile.portfolio || parsedSocialLinks.portfolio || '',
    },
    skills: { languages: skillsList, frameworks: [], tools: [], domains: [] },
    experience,
    education,
    projects: Array.isArray(projects) ? projects : [],
    achievements: Array.isArray(achievements) ? achievements : [],
    openSource: { totalStars: 0, totalRepos: 0 },
    portfolioMeta: {
      template: 'minimal-professional',
      theme: profile.profile_theme || 'aurora',
      slug: profile.custom_url || slug,
      visibility: profile.is_public ? 'public' : 'private',
      isOwner,
    },
  };
};

/**
 * Updates a user profile, awards coins if newly complete, and clears the cache.
 */
export const updateUserProfile = async (userId: string, userContext: UserContext, bodyPayload: any) => {
  const updates: Record<string, any> = normalizeProfileUpdatePayload(bodyPayload);
  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    throw error;
  }

  updates.updated_at = new Date().toISOString();

  const updateResult = await (supabaseAdmin as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  let data = updateResult.data;
  const { error } = updateResult;

  if (error) {
    if (isProfilesAccessBlocked(error)) {
      const err: any = new Error('Profile update is temporarily unavailable');
      err.status = 503;
      err.degraded = true;
      throw err;
    }
    throw error;
  }

  if (!data) {
    const insertPayload = {
      id: userId,
      email: userContext.email,
      full_name: updates.full_name || userContext.user_metadata?.full_name || '',
      subscription_tier: updates.subscription_tier || 'free',
      experience_level: updates.experience_level || 'beginner',
      role: updates.role || userContext.role || 'user',
      ...updates,
    };
    const createResult = await (supabaseAdmin as any)
      .from('profiles')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (createResult.error) {
      if (isProfilesAccessBlocked(createResult.error)) {
        const err: any = new Error('Profile update is temporarily unavailable');
        err.status = 503;
        err.degraded = true;
        throw err;
      }
      throw createResult.error;
    }
    data = createResult.data;
  }

  if (!data) {
    throw new Error('Failed to save profile');
  }

  let rewardResult = { coinsAwarded: 0, coinBalance: data?.coins ?? 0, applied: false };
  let rewardDegraded = false;

  try {
    rewardResult = await awardProfileCompletionCoins(userId, data);
  } catch (_e) {
    rewardDegraded = true;
  }

  await cacheManager.delete(`profile:${userId}`).catch(() => {});

  return {
    ...buildProfileResponse(userContext, data),
    coinsAwarded: rewardResult.coinsAwarded,
    coinBalance: rewardResult.coinBalance,
    profileCompletionRewardApplied: rewardResult.applied,
    profileCompletionRewardDegraded: rewardDegraded,
  };
};

/**
 * Uploads avatar image buffer to Supabase storage and links URL to profile.
 */
export const uploadUserAvatar = async (userId: string, userContext: UserContext, file: { originalname: string; buffer: Buffer; mimetype: string }) => {
  const filePath = buildAvatarPath(userId, file.originalname);

  const { error: uploadError } = await (supabaseAdmin as any).storage
    .from('avatars')
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = (supabaseAdmin as any).storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = publicData?.publicUrl || null;

  const { error: updateError } = await (supabaseAdmin as any)
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  const { data: profile, error: fetchError } = await (supabaseAdmin as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError || !profile) {
    throw fetchError || new Error('Failed to fetch profile after avatar update');
  }

  await cacheManager.delete(`profile:${userId}`).catch(() => {});
  return buildProfileResponse(userContext, profile);
};

/**
 * Validates and claims a custom URL slug for a user profile.
 */
export const claimUserCustomUrl = async (userId: string, userContext: UserContext, requestedRawUrl: string) => {
  let requested = String(requestedRawUrl || '').trim().toLowerCase();
  requested = requested.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (!requested || requested.length < 3 || requested.length > 30) {
    const error: any = new Error('Custom URL must be between 3 and 30 characters');
    error.status = 400;
    throw error;
  }

  const result = await claimCustomUrl(supabaseAdmin, userId, requested);
  if (!result.success) {
    const error: any = new Error(
      result.error === 'taken' ? 'This custom URL is already taken' :
      result.error === 'reserved' ? 'This custom URL is reserved' : 'Invalid custom_url'
    );
    error.status = result.error === 'taken' ? 409 : 400;
    throw error;
  }

  const profileRow = result.profile || (await (supabaseAdmin as any).from('profiles').select('*').eq('id', userId).maybeSingle()).data;
  await cacheManager.delete(`profile:${userId}`).catch(() => {});
  return buildProfileResponse(userContext, profileRow);
};

const VALID_LANGUAGES = new Set<SettingsLanguage>(['en', 'hi', 'es']);
const VALID_EDITORS = new Set<SettingsCodeEditor>(['vscode', 'sublime', 'vim']);
const VALID_DIFFICULTIES = new Set<SettingsDifficulty>(['easy', 'medium', 'hard']);
const VALID_EXPERIENCE_LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'expert']);

export const difficultyToExperienceLevel = (difficulty?: string): string => {
  if (difficulty === 'easy') return 'beginner';
  if (difficulty === 'hard') return 'advanced';
  return 'intermediate';
};

export const experienceLevelToDifficulty = (level?: string): SettingsDifficulty => {
  if (level === 'beginner') return 'easy';
  if (level === 'advanced' || level === 'expert') return 'hard';
  return 'medium';
};

export const normalizeUserSettingsPreferences = (
  rawPrefs: Record<string, any> | null | undefined,
  experienceLevel?: string
) => {
  const prefs = rawPrefs && typeof rawPrefs === 'object' ? rawPrefs : {};
  const language = VALID_LANGUAGES.has(prefs.language) ? prefs.language : 'en';
  const codeEditor = VALID_EDITORS.has(prefs.codeEditor) ? prefs.codeEditor : 'vscode';
  const difficulty = VALID_DIFFICULTIES.has(prefs.difficulty)
    ? prefs.difficulty
    : experienceLevelToDifficulty(experienceLevel);

  return {
    emailNotifications: typeof prefs.emailNotifications === 'boolean' ? prefs.emailNotifications : true,
    practiceReminders: typeof prefs.practiceReminders === 'boolean' ? prefs.practiceReminders : true,
    weeklyReport: typeof prefs.weeklyReport === 'boolean' ? prefs.weeklyReport : true,
    language,
    codeEditor,
    difficulty,
  };
};

async function getAuthUserMeta(userId: string, userContext?: UserContext) {
  let userMetadata: Record<string, any> = { ...(userContext?.user_metadata || {}) };
  let authProvider: string | undefined;

  try {
    const adminApi = (supabaseAdmin as any)?.auth?.admin;
    if (adminApi && typeof adminApi.getUserById === 'function') {
      const { data, error } = await adminApi.getUserById(userId);
      if (!error && data?.user) {
        userMetadata = { ...userMetadata, ...(data.user.user_metadata || {}) };
        authProvider = data.user.app_metadata?.provider || data.user.identities?.[0]?.provider;
      }
    }
  } catch {
    // Non-fatal fallback to JWT user_metadata
  }

  return { userMetadata, authProvider };
}

/**
 * Retrieves user account settings.
 */
export const getUserSettings = async (
  userId: string,
  userContext: UserContext
): Promise<{ settings: UserSettings; degraded?: boolean }> => {
  const [{ data: profile, error }, { userMetadata, authProvider }] = await Promise.all([
    (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),
    getAuthUserMeta(userId, userContext),
  ]);

  if (isProfilesAccessBlocked(error)) {
    const expLevel = 'beginner';
    return {
      settings: {
        full_name: userContext.user_metadata?.full_name || '',
        experience_level: expLevel,
        subscription_tier: 'free',
        ...normalizeUserSettingsPreferences(userMetadata?.settings, expLevel),
        ...(authProvider ? { authProvider } : {}),
      },
      degraded: true,
    };
  }

  if (error) {
    throw error;
  }

  if (!profile && !userContext?.id) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const experienceLevel = profile?.experience_level || 'beginner';

  return {
    settings: {
      full_name: profile?.full_name || userMetadata?.full_name || '',
      experience_level: experienceLevel,
      subscription_tier: profile?.subscription_tier || 'free',
      ...normalizeUserSettingsPreferences(userMetadata?.settings, experienceLevel),
      ...(authProvider ? { authProvider } : {}),
    },
  };
};

export interface UpdateUserSettingsInput {
  fullName?: string;
  experienceLevel?: string;
  emailNotifications?: boolean;
  practiceReminders?: boolean;
  weeklyReport?: boolean;
  language?: string;
  codeEditor?: string;
  difficulty?: string;
}

/**
 * Updates user account settings and preferences.
 */
export const updateUserSettings = async (
  userId: string,
  updates: UpdateUserSettingsInput = {},
  userContext?: UserContext
): Promise<{ settings: UserSettings; degraded?: boolean }> => {
  const dbUpdates: Record<string, any> = {};
  const prefUpdates: Record<string, any> = {};

  if (typeof updates.fullName === 'string' && updates.fullName.trim().length > 0) {
    dbUpdates.full_name = updates.fullName.trim().slice(0, 120);
  }

  if (typeof updates.difficulty === 'string') {
    if (!VALID_DIFFICULTIES.has(updates.difficulty as SettingsDifficulty)) {
      const err: any = new Error('Invalid difficulty preference');
      err.status = 400;
      throw err;
    }
    prefUpdates.difficulty = updates.difficulty;
  }

  if (typeof updates.experienceLevel === 'string' && updates.experienceLevel.trim().length > 0) {
    const normalizedExp = updates.experienceLevel.trim().toLowerCase();
    if (!VALID_EXPERIENCE_LEVELS.has(normalizedExp)) {
      const err: any = new Error('Invalid experience level');
      err.status = 400;
      throw err;
    }
    dbUpdates.experience_level = normalizedExp;
  } else if (prefUpdates.difficulty) {
    dbUpdates.experience_level = difficultyToExperienceLevel(prefUpdates.difficulty);
  }

  if (typeof updates.emailNotifications === 'boolean') {
    prefUpdates.emailNotifications = updates.emailNotifications;
  }
  if (typeof updates.practiceReminders === 'boolean') {
    prefUpdates.practiceReminders = updates.practiceReminders;
  }
  if (typeof updates.weeklyReport === 'boolean') {
    prefUpdates.weeklyReport = updates.weeklyReport;
  }

  if (typeof updates.language === 'string') {
    if (!VALID_LANGUAGES.has(updates.language as SettingsLanguage)) {
      const err: any = new Error('Unsupported language preference');
      err.status = 400;
      throw err;
    }
    prefUpdates.language = updates.language;
  }

  if (typeof updates.codeEditor === 'string') {
    if (!VALID_EDITORS.has(updates.codeEditor as SettingsCodeEditor)) {
      const err: any = new Error('Unsupported code editor preference');
      err.status = 400;
      throw err;
    }
    prefUpdates.codeEditor = updates.codeEditor;
  }

  if (Object.keys(dbUpdates).length === 0 && Object.keys(prefUpdates).length === 0) {
    const err: any = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  let profileRow: RawProfile | null = null;
  let profileDegraded = false;

  if (Object.keys(dbUpdates).length > 0) {
    dbUpdates.updated_at = new Date().toISOString();
    const { data, error } = await (supabaseAdmin as any)
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      if (isProfilesAccessBlocked(error)) {
        profileDegraded = true;
      } else {
        throw error;
      }
    } else if (data) {
      profileRow = data;
    } else {
      const { data: inserted, error: insertErr } = await (supabaseAdmin as any)
        .from('profiles')
        .insert({
          id: userId,
          full_name: dbUpdates.full_name || userContext?.user_metadata?.full_name || '',
          experience_level: dbUpdates.experience_level || 'beginner',
          subscription_tier: 'free',
          role: userContext?.role || 'user',
        })
        .select()
        .maybeSingle();

      if (insertErr) {
        if (isProfilesAccessBlocked(insertErr)) {
          profileDegraded = true;
        } else {
          throw insertErr;
        }
      } else {
        profileRow = inserted;
      }
    }
  } else {
    const { data, error } = await (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (isProfilesAccessBlocked(error)) {
        profileDegraded = true;
      } else {
        throw error;
      }
    } else {
      profileRow = data;
    }
  }

  const { userMetadata, authProvider } = await getAuthUserMeta(userId, userContext);
  const resolvedExpLevel =
    profileRow?.experience_level ||
    dbUpdates.experience_level ||
    'beginner';

  const mergedPrefs = normalizeUserSettingsPreferences(
    {
      ...(userMetadata?.settings || {}),
      ...prefUpdates,
    },
    resolvedExpLevel
  );

  if (Object.keys(prefUpdates).length > 0) {
    const adminApi = (supabaseAdmin as any)?.auth?.admin;
    if (adminApi && typeof adminApi.updateUserById === 'function') {
      const { error: metaError } = await adminApi.updateUserById(userId, {
        user_metadata: {
          ...userMetadata,
          settings: mergedPrefs,
        },
      });
      if (metaError) {
        throw metaError;
      }
    }
  }

  await cacheManager.delete(`profile:${userId}`).catch(() => {});

  return {
    settings: {
      full_name: profileRow?.full_name || dbUpdates.full_name || userMetadata?.full_name || '',
      experience_level: resolvedExpLevel,
      subscription_tier: profileRow?.subscription_tier || 'free',
      ...mergedPrefs,
      ...(authProvider ? { authProvider } : {}),
    },
    ...(profileDegraded ? { degraded: true } : {}),
  };
};

/**
 * Permanently deletes a user account and clears cached state.
 */
export const deleteUserAccount = async (userId: string): Promise<{ success: boolean }> => {
  if (!userId) {
    const err: any = new Error('User not authenticated');
    err.status = 401;
    throw err;
  }

  const adminApi = (supabaseAdmin as any)?.auth?.admin;
  if (!adminApi || typeof adminApi.deleteUser !== 'function') {
    throw new Error('Account deletion service unavailable');
  }

  const { error } = await adminApi.deleteUser(userId);
  if (error) {
    throw error;
  }

  invalidateUserRole(userId);
  await cacheManager.delete(`profile:${userId}`).catch(() => {});
  return { success: true };
};

/**
 * Updates user practice preferences.
 */
export const updateUserPreferences = async (userId: string, preferences: { experienceLevel?: string }) => {
  const dbUpdates: Record<string, any> = {};
  if (preferences.experienceLevel) dbUpdates.experience_level = preferences.experienceLevel;

  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await (supabaseAdmin as any)
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      if (isProfilesAccessBlocked(error)) {
        const err: any = new Error('Preferences update is temporarily unavailable');
        err.status = 503;
        err.degraded = true;
        throw err;
      }
      throw error;
    }
  }

  await cacheManager.delete(`profile:${userId}`).catch(() => {});
  return { success: true, message: 'Preferences saved' };
};

/**
 * Fetches public GitHub profile & top repositories to auto-fill blank user profile fields.
 */
export const getGithubAutofillProfile = async (rawHandle: string) => {
  let handle = String(rawHandle || '').trim();
  if (/^https?:\/\//i.test(handle) || handle.includes('github.com')) {
    try {
      const parsed = new URL(/^https?:\/\//i.test(handle) ? handle : `https://${handle}`);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) handle = parts[0];
    } catch (_e) {
      // fallback to trimmed string
    }
  }
  handle = handle.replace(/^@+/, '');

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(handle)) {
    const error: any = new Error('Please enter a valid GitHub username or profile URL.');
    error.status = 400;
    throw error;
  }

  let githubData: any;
  try {
    githubData = await fetchGithubPortfolioData(handle, { includeReadmes: false, perPage: 30 });
  } catch (err: any) {
    const msg = String(err?.message || '');
    const status = msg.includes('(404)') ? 404 : 502;
    const error: any = new Error(
      status === 404
        ? `GitHub user "${handle}" was not found.`
        : 'Could not fetch GitHub profile details right now.'
    );
    error.status = status;
    throw error;
  }

  const ghProfile = githubData?.profile || {};
  const repos = Array.isArray(githubData?.repositories) ? githubData.repositories : [];

  const nonForkRepos = repos.filter((r: any) => !r.fork);
  const candidateRepos = nonForkRepos.length > 0 ? nonForkRepos : repos;

  const rankedProjects = candidateRepos
    .map((repo: any) => ({
      id: String(repo.id || repo.name),
      name: repo.name,
      description: repo.description || '',
      stack: Array.from(new Set([repo.language, ...(Array.isArray(repo.topics) ? repo.topics : [])].filter(Boolean))).slice(0, 5),
      repoUrl: repo.html_url || '',
      liveUrl: repo.homepage || '',
      visibilityScore: scoreRepositoryVisibility(repo),
      metrics: {
        stars: Number(repo.stargazers_count || 0),
        forks: Number(repo.forks_count || 0),
      },
    }))
    .sort((a: any, b: any) => b.visibilityScore - a.visibilityScore)
    .slice(0, 6);

  const skillCounts = new Map<string, number>();
  for (const repo of candidateRepos) {
    if (repo.language) {
      const lang = String(repo.language).trim();
      skillCounts.set(lang, (skillCounts.get(lang) || 0) + 2);
    }
    if (Array.isArray(repo.topics)) {
      for (const topic of repo.topics) {
        const cleanTopic = String(topic || '').trim();
        if (cleanTopic) {
          skillCounts.set(cleanTopic, (skillCounts.get(cleanTopic) || 0) + 1);
        }
      }
    }
  }
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => name);

  const cleanCompany = String(ghProfile.company || '').trim().replace(/^@+/, '');
  const rawWebsite = String(ghProfile.blog || '').trim();
  const website = rawWebsite && !/^https?:\/\//i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite;

  return {
    githubUsername: ghProfile.login || handle,
    profileData: {
      githubUsername: ghProfile.login || handle,
      fullName: String(ghProfile.name || '').trim(),
      bio: String(ghProfile.bio || '').trim(),
      company: cleanCompany,
      location: String(ghProfile.location || '').trim(),
      website,
      avatar_url: String(ghProfile.avatar_url || '').trim(),
      twitter: String(ghProfile.twitter_username || '').trim(),
      skills: topSkills.join(', '),
      projects: rankedProjects,
    },
    openSource: {
      publicRepos: Number(ghProfile.public_repos || repos.length || 0),
      followers: Number(ghProfile.followers || 0),
      stars: repos.reduce((sum: number, repo: any) => sum + Number(repo.stargazers_count || 0), 0),
    },
  };
};

export default {
  hasText,
  isProfilesAccessBlocked,
  isProfileCompleteForReward,
  calculateProfileCompletionPercentage,
  buildProfileResponse,
  awardProfileCompletionCoins,
  getOrCreateUserProfile,
  getPublicPortfolioBySlug,
  updateUserProfile,
  uploadUserAvatar,
  claimUserCustomUrl,
  getUserSettings,
  updateUserSettings,
  updateUserPreferences,
  getGithubAutofillProfile,
  deleteUserAccount,
  PROFILE_COMPLETION_COIN_REWARD,
};
