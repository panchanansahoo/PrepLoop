import { supabaseAdmin } from '../db/supabaseClient.js';
import cacheManager from '../utils/cacheManager.js';
import { buildAvatarPath, claimCustomUrl } from '../utils/profileUtils.js';
import { normalizeProfileUpdatePayload } from '../utils/profilePayload.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { isAdminEmail } from '../middleware/auth.js';
import type { PublicPortfolio, UserSettings } from '../types/services.js';

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
    twitter: profile?.twitter || parsedSocialLinks.twitter || '',
    linkedin: profile?.linkedin || parsedSocialLinks.linkedin || '',
    portfolio: profile?.portfolio || parsedSocialLinks.portfolio || '',
    dribbble: profile?.dribbble || parsedSocialLinks.dribbble || '',
    ...parsedSocialLinks,
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
      (supabaseAdmin as any).from('profiles').update({ role: 'admin' }).eq('id', userId).catch(() => {});
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
      (supabaseAdmin as any).from('profiles').update({ role: 'admin' }).eq('id', userId).catch(() => {});
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
    const byName = await (supabaseAdmin as any).from('profiles').select('*').ilike('full_name', nameFromSlug).maybeSingle();
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

/**
 * Retrieves user account settings.
 */
export const getUserSettings = async (userId: string, userContext: UserContext): Promise<{ settings: UserSettings; degraded?: boolean }> => {
  const { data: profile, error } = await (supabaseAdmin as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (isProfilesAccessBlocked(error)) {
    return {
      settings: {
        full_name: userContext.user_metadata?.full_name || '',
        experience_level: 'beginner',
        subscription_tier: 'free',
      },
      degraded: true,
    };
  }

  if (error || !profile) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return {
    settings: {
      full_name: profile.full_name || '',
      experience_level: profile.experience_level || 'beginner',
      subscription_tier: profile.subscription_tier || 'free',
    },
  };
};

/**
 * Updates user account settings.
 */
export const updateUserSettings = async (userId: string, updates: { fullName?: string; experienceLevel?: string }) => {
  const dbUpdates: Record<string, any> = {};
  if (updates.fullName) dbUpdates.full_name = updates.fullName;
  if (updates.experienceLevel) dbUpdates.experience_level = updates.experienceLevel;

  if (Object.keys(dbUpdates).length === 0) {
    const err: any = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  const { data, error } = await (supabaseAdmin as any)
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (isProfilesAccessBlocked(error)) {
      const err: any = new Error('Settings update is temporarily unavailable');
      err.status = 503;
      err.degraded = true;
      throw err;
    }
    throw error;
  }

  await cacheManager.delete(`profile:${userId}`).catch(() => {});

  return {
    settings: {
      full_name: data.full_name,
      experience_level: data.experience_level,
      subscription_tier: data.subscription_tier,
    },
  };
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
  PROFILE_COMPLETION_COIN_REWARD,
};
