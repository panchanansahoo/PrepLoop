import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildProfileResponse,
  isProfileCompleteForReward,
  calculateProfileCompletionPercentage,
  isProfilesAccessBlocked,
  normalizeUserSettingsPreferences,
  difficultyToExperienceLevel,
  experienceLevelToDifficulty,
  getPublicPortfolioBySlug,
  claimUserCustomUrl,
  getUserSettings,
  updateUserSettings,
  deleteUserAccount,
  PROFILE_COMPLETION_COIN_REWARD,
} from '../../services/profileService.ts';
import { claimCustomUrl } from '../../utils/profileUtils.js';
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

  it('prefers a saved LinkedIn link and honors explicit removal of a legacy link', () => {
    const context = { id: 'usr_1', email: 'member@example.com' };
    const row = { id: 'usr_1', linkedin: 'https://linkedin.com/in/old' };
    expect(buildProfileResponse(context, { ...row, social_links: { linkedin: 'https://linkedin.com/in/new' } }).user.socialLinks.linkedin)
      .toBe('https://linkedin.com/in/new');
    expect(buildProfileResponse(context, { ...row, social_links: { linkedin: null } }).user.socialLinks.linkedin)
      .toBe('');
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

describe('Public Profile Links & Custom URL Privacy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockProfilesQueries({ byCustomUrl = null, byId = null, byName = [] } = {}) {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => ({
      select: () => ({
        eq: (column: string, _value: any) => ({
          maybeSingle: async () => ({
            data: column === 'custom_url' ? byCustomUrl : column === 'id' ? byId : null,
            error: null,
          }),
        }),
        ilike: () => ({
          limit: async () => ({
            data: byName,
            error: null,
          }),
        }),
      }),
    }) as any);
  }

  it('resolves public profile by UUID even with punctuation or non-Latin display names', async () => {
    const uuid = '11111111-2222-4333-8444-555555555555';
    mockProfilesQueries({
      byId: {
        id: uuid,
        full_name: "José O'Connor · 田中太郎",
        is_public: true,
        profile_theme: 'midnight',
      },
    });

    const result = await getPublicPortfolioBySlug(uuid);
    expect('basics' in result).toBe(true);
    if ('basics' in result) {
      expect(result.basics.name).toBe("José O'Connor · 田中太郎");
      expect(result.portfolioMeta.slug).toBe(uuid);
      expect(result.portfolioMeta.theme).toBe('midnight');
    }
  });

  it('returns notFound when display-name fallback matches multiple duplicate profiles', async () => {
    mockProfilesQueries({
      byName: [
        { id: 'u1', full_name: 'John Doe', is_public: true },
        { id: 'u2', full_name: 'John Doe', is_public: true },
      ],
    });

    const result = await getPublicPortfolioBySlug('john-doe');
    expect(result).toEqual({ notFound: true });
  });

  it('does not leak private profiles via display-name guessing, while allowing owner UUID preview', async () => {
    const uuid = '11111111-2222-4333-8444-555555555555';
    mockProfilesQueries({
      byName: [{ id: uuid, full_name: 'Private Person', is_public: false }],
    });

    expect(await getPublicPortfolioBySlug('private-person')).toEqual({ notFound: true });

    mockProfilesQueries({
      byId: { id: uuid, full_name: 'Private Person', is_public: false },
    });
    expect(await getPublicPortfolioBySlug(uuid, 'other-user')).toEqual({ isPrivate: true });

    const ownerPreview = await getPublicPortfolioBySlug(uuid, uuid);
    expect('portfolioMeta' in ownerPreview).toBe(true);
    if ('portfolioMeta' in ownerPreview) {
      expect(ownerPreview.portfolioMeta.isOwner).toBe(true);
      expect(ownerPreview.portfolioMeta.visibility).toBe('private');
    }
  });

  it('claimCustomUrl saves custom_url without forcing is_public to true', async () => {
    const updatePayloads: any[] = [];
    const mockClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
        update: (payload: any) => {
          updatePayloads.push(payload);
          return {
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: { id: 'usr_1', custom_url: 'my-slug', is_public: false },
                  error: null,
                }),
              }),
            }),
          };
        },
      }),
    };

    const res = await claimCustomUrl(mockClient, 'usr_1', 'my-slug');
    expect(res.success).toBe(true);
    expect(updatePayloads[0]).toMatchObject({ custom_url: 'my-slug' });
    expect(updatePayloads[0]).not.toHaveProperty('is_public');
  });

  it('claimUserCustomUrl preserves private visibility on returned profile', async () => {
    vi.spyOn(supabaseAdmin, 'from').mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => ({
              data: { id: 'usr_1', custom_url: 'my-slug', is_public: false },
              error: null,
            }),
          }),
        }),
      }),
    }) as any);

    const res = await claimUserCustomUrl('usr_1', { id: 'usr_1', email: 'u@example.com' }, 'my-slug');
    expect(res.user.custom_url).toBe('my-slug');
    expect(res.user.is_public).toBe(false);
  });
});


