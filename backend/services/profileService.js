import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { isAdminEmail } from '../middleware/auth.js';

export const PROFILE_COMPLETION_COIN_REWARD = 20;

export const hasText = (value) => String(value ?? '').trim().length > 0;

/**
 * Checks whether user profile has all required fields to qualify for coin completion reward
 */
export const isProfileCompleteForReward = (profile) => {
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
export const calculateProfileCompletionPercentage = (profile) => {
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
export const buildProfileResponse = (reqOrUser, profile) => {
  const userContext = reqOrUser && 'user' in reqOrUser ? reqOrUser.user : reqOrUser;
  const fullName = profile?.full_name || userContext?.user_metadata?.full_name || '';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const experienceLevel = profile?.experience_level || 'beginner';
  const isUserAdmin = userContext?.role === 'admin' || (userContext?.email ? isAdminEmail(userContext.email) : false) || profile?.role === 'admin';
  const role = isUserAdmin ? 'admin' : (profile?.role || userContext?.role || 'user');
  const experienceSummary = profile?.experience_summary || '';
  const experienceYears = profile?.experience_years ?? null;

  let parsedSocialLinks = {};
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

  const flatProfile = {
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

  const userPayload = { ...flatProfile };
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
export const awardProfileCompletionCoins = async (userId, profile) => {
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
    coinBalance: atomicResult.balance ?? null,
    coinsAwarded: atomicResult.applied ? PROFILE_COMPLETION_COIN_REWARD : 0,
    applied: Boolean(atomicResult.applied),
  };
};

export default {
  hasText,
  isProfileCompleteForReward,
  calculateProfileCompletionPercentage,
  buildProfileResponse,
  awardProfileCompletionCoins,
  PROFILE_COMPLETION_COIN_REWARD,
};
