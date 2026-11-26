import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildProfileResponse,
  isProfileCompleteForReward,
  calculateProfileCompletionPercentage,
  isProfilesAccessBlocked,
  normalizeUserSettingsPreferences,
  difficultyToExperienceLevel,
  experienceLevelToDifficulty,
  getUserSettings,
  updateUserSettings,
  deleteUserAccount,
  PROFILE_COMPLETION_COIN_REWARD,
} from '../../services/profileService.ts';
import { supabaseAdmin } from '../../db/supabaseClient.js';

describe('Profile Service & Response Formatter', () => {
  it('correctly calculates profile completion percentage', () => {
    const partialProfile = {
      full_name: 'Alex Mercer',
      designation: 'Software Engineer',
      bio: 'Passionate about distributed systems',
    };
    const completion = calculateProfileCompletionPercentage(partialProfile);
    expect(completion).toBeGreaterThan(0);
    expect(completion).toBeLessThan(100);

    const fullProfile = {
      full_name: 'Alex Mercer',
      designation: 'Software Engineer',
      bio: 'Passionate about distributed systems',
      skills: 'Go, Kubernetes, Postgres',
      education: 'B.S. in Computer Science',
      location: 'San Francisco, CA',
      company: 'Tech Corp',
      github_username: 'alexmercer',
      avatar_url: 'https://images.example.com/avatar.png',
    };
    expect(calculateProfileCompletionPercentage(fullProfile)).toBe(100);
  });

  it('verifies profile eligibility for coin reward', () => {
    expect(isProfileCompleteForReward(null)).toBe(false);

    const incomplete = {
      full_name: 'Incomplete User',
    };
    expect(isProfileCompleteForReward(incomplete)).toBe(false);

    const complete = {
      full_name: 'Complete Candidate',
      designation: 'Backend Architect',
      experience_summary: '5 years building high throughput microservices',
      skills: 'Node.js, TypeScript, Kafka',
      education: 'Master of Technology',
      bio: 'Enthusiastic mentor and builder',
      location: 'Seattle, WA',
      company: 'Cloud Scale Inc.',
    };
    expect(isProfileCompleteForReward(complete)).toBe(true);
    expect(PROFILE_COMPLETION_COIN_REWARD).toBe(20);
  });

  it('builds unified profile response conforming to client expectations', () => {
    const userContext = {
      id: 'usr_test_123',
      email: 'alex@example.com',
      role: 'user',
      user_metadata: { full_name: 'Alex M' },
    };

    const profileRow = {
      id: 'usr_test_123',
      full_name: 'Alex Mercer',
      subscription_tier: 'pro',
      coins: 150,
      social_links: JSON.stringify({ linkedin: 'https://linkedin.com/in/alex' }),
    };

    const response = buildProfileResponse(userContext, profileRow);

    expect(response.user.id).toBe('usr_test_123');
    expect(response.user.email).toBe('alex@example.com');
    expect(response.user.fullName).toBe('Alex Mercer');
    expect(response.user.subscriptionTier).toBe('pro');
    expect(response.user.coins).toBe(150);
    expect(response.user.socialLinks.linkedin).toBe('https://linkedin.com/in/alex');
    expect(response.user.profile).toBeDefined();
  });

  it('detects Supabase RLS recursion policy blockage error codes', () => {
    const rlsError = { code: '42P17', message: 'infinite recursion detected in policy' };
    expect(isProfilesAccessBlocked(rlsError)).toBe(true);

    const otherError = { code: '23505', message: 'unique constraint violation' };
    expect(isProfilesAccessBlocked(otherError)).toBe(false);
  });

  it('does not leak beginner experienceLevel into experience and preserves non-empty social columns', () => {
    const response = buildProfileResponse(
      { id: 'usr_2', email: 'new@example.com' },
      {
        id: 'usr_2',
        experience_level: 'beginner',
        linkedin: 'https://linkedin.com/in/new-user',
        social_links: JSON.stringify({ linkedin: '', twitter: 'newhandle' }),
      },
    );

    expect(response.user.experience).toBe('');
    expect(response.user.experienceLevel).toBe('beginner');
    expect(response.user.socialLinks.linkedin).toBe('https://linkedin.com/in/new-user');
    expect(response.user.socialLinks.twitter).toBe('newhandle');
  });
});

describe('Settings Preferences & Account Actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes settings preferences and maps difficulty <-> experience level', () => {
    expect(difficultyToExperienceLevel('easy')).toBe('beginner');
    expect(difficultyToExperienceLevel('medium')).toBe('intermediate');
    expect(difficultyToExperienceLevel('hard')).toBe('advanced');

    expect(experienceLevelToDifficulty('beginner')).toBe('easy');
    expect(experienceLevelToDifficulty('intermediate')).toBe('medium');
    expect(experienceLevelToDifficulty('advanced')).toBe('hard');
    expect(experienceLevelToDifficulty('expert')).toBe('hard');

    const normalized = normalizeUserSettingsPreferences(
      {
        emailNotifications: false,
        language: 'hi',
        codeEditor: 'vim',
        difficulty: 'invalid',
      },
      'advanced'
    );

    expect(normalized).toEqual({
      emailNotifications: false,
      practiceReminders: true,
      weeklyReport: true,
      language: 'hi',
      codeEditor: 'vim',
      difficulty: 'hard',
    });
  });

  it('retrieves merged profile and auth metadata settings', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              full_name: 'Maya Lin',
              experience_level: 'advanced',
              subscription_tier: 'pro',
            },
            error: null,
          }),
        }),
      }),
    } as any);

    (supabaseAdmin.auth.admin as any).getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          app_metadata: { provider: 'email' },
          user_metadata: {
            settings: {
              emailNotifications: false,
              practiceReminders: false,
              weeklyReport: true,
              language: 'es',
              codeEditor: 'sublime',
              difficulty: 'hard',
            },
          },
        },
      },
      error: null,
    });

    const res = await getUserSettings('usr_1', { id: 'usr_1', email: 'maya@example.com' });
    expect(res.settings).toEqual({
      full_name: 'Maya Lin',
      experience_level: 'advanced',
      subscription_tier: 'pro',
      emailNotifications: false,
      practiceReminders: false,
      weeklyReport: true,
      language: 'es',
      codeEditor: 'sublime',
      difficulty: 'hard',
      authProvider: 'email',
    });
  });

  it('updates preference-only settings without requiring fullName', async () => {
    const updateUserByIdMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    (supabaseAdmin.auth.admin as any).getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          app_metadata: { provider: 'email' },
          user_metadata: { existingKey: 'keep-me' },
        },
      },
      error: null,
    });
    (supabaseAdmin.auth.admin as any).updateUserById = updateUserByIdMock;

    vi.spyOn(supabaseAdmin, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              full_name: 'Maya Lin',
              experience_level: 'intermediate',
              subscription_tier: 'pro',
            },
            error: null,
          }),
        }),
      }),
    } as any);

    const result = await updateUserSettings('usr_1', {
      emailNotifications: false,
      language: 'hi',
      codeEditor: 'vim',
    });

    expect(result.settings.emailNotifications).toBe(false);
    expect(result.settings.language).toBe('hi');
    expect(result.settings.codeEditor).toBe('vim');
    expect(result.settings.full_name).toBe('Maya Lin');
    expect(updateUserByIdMock).toHaveBeenCalledWith('usr_1', {
      user_metadata: {
        existingKey: 'keep-me',
        settings: {
          emailNotifications: false,
          practiceReminders: true,
          weeklyReport: true,
          language: 'hi',
          codeEditor: 'vim',
          difficulty: 'medium',
        },
      },
    });
  });

  it('rejects invalid settings input and deletes account via supabaseAdmin', async () => {
    await expect(updateUserSettings('usr_1', {})).rejects.toMatchObject({ status: 400 });
    await expect(updateUserSettings('usr_1', { language: 'fr' })).rejects.toMatchObject({ status: 400 });

    const deleteUserMock = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabaseAdmin.auth.admin as any).deleteUser = deleteUserMock;

    const delRes = await deleteUserAccount('usr_1');
    expect(delRes.success).toBe(true);
    expect(deleteUserMock).toHaveBeenCalledWith('usr_1');
  });
});


