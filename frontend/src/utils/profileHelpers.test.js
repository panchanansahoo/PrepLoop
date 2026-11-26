import { describe, it, expect } from 'vitest';
import {
  buildInitialProfile,
  normalizeProfileData,
  buildProfilePayload,
  splitSkillChips,
  calculateProfileCompletion,
  normalizeExternalUrl,
  buildSocialUrl,
  normalizeGithubHandle,
  getPlanBadgeMeta,
} from './profileHelpers.js';

describe('Profile Helpers', () => {
  it('builds initial profile state from user object', () => {
    const user = { fullName: 'Alex Mercer', email: 'alex@example.com' };
    const profile = buildInitialProfile(user);
    expect(profile.fullName).toBe('Alex Mercer');
    expect(profile.email).toBe('alex@example.com');
    expect(profile.profileTheme).toBe('aurora');
    expect(profile.socialLinks).toBeDefined();
  });

  it('normalizes legacy and snake_case profile data fields', () => {
    const raw = {
      full_name: 'Jordan Lee',
      designation: 'Senior Frontend Engineer',
      experience_level: 'advanced',
      profile_theme: 'neon',
    };
    const normalized = normalizeProfileData(raw);
    expect(normalized.fullName).toBe('Jordan Lee');
    expect(normalized.currentRole).toBe('Senior Frontend Engineer');
    expect(normalized.experienceLevel).toBe('advanced');
    expect(normalized.profileTheme).toBe('neon');
  });

  it('splits and deduplicates skill chips combining explicit and resume skills', () => {
    const explicit = 'React, Node.js, TypeScript';
    const resume = { coreSkills: ['react', 'PostgreSQL', 'Docker'] };
    const chips = splitSkillChips(explicit, resume);
    expect(chips).toEqual(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker']);
  });

  it('calculates profile completion percentage accurately', () => {
    const partial = {
      fullName: 'Jordan Lee',
      bio: 'Software engineer passionate about scalable systems',
      currentRole: 'Backend Engineer',
      skills: 'Go, PostgreSQL',
      education: 'B.S. Computer Science',
      socialLinks: {},
    };
    const pct = calculateProfileCompletion(partial);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('normalizes external and social URLs safely for both handles and full URLs', () => {
    expect(normalizeExternalUrl('example.com')).toBe('https://example.com');
    expect(normalizeExternalUrl('javascript:alert(1)')).toBe('');
    expect(buildSocialUrl('linkedin', 'panchanan')).toBe('https://www.linkedin.com/in/panchanan');
    expect(buildSocialUrl('linkedin', 'https://www.linkedin.com/in/panchanan')).toBe('https://www.linkedin.com/in/panchanan');
    expect(buildSocialUrl('twitter', '@preploop')).toBe('https://x.com/preploop');
    expect(buildSocialUrl('twitter', 'https://twitter.com/preploop')).toBe('https://twitter.com/preploop');
    expect(buildSocialUrl('dribbble', 'designer')).toBe('https://dribbble.com/designer');
  });

  it('normalizes GitHub handles from URLs or @mentions and rejects invalid ones', () => {
    expect(normalizeGithubHandle('https://github.com/octocat/')).toBe('octocat');
    expect(normalizeGithubHandle('@octo-cat')).toBe('octo-cat');
    expect(normalizeGithubHandle('bad user!')).toBeNull();
  });

  it('preserves subscriptionTier and maps plan badge metadata', () => {
    const normalized = normalizeProfileData({ subscription_tier: 'pro', coins: 40 });
    expect(normalized.subscriptionTier).toBe('pro');
    expect(normalized.coins).toBe(40);
    expect(getPlanBadgeMeta('pro')).toEqual({ tier: 'pro', label: 'Pro', pill: 'PRO', isPaid: true });
    expect(getPlanBadgeMeta('premium')).toEqual({ tier: 'premium', label: 'Premium', pill: 'PREMIUM', isPaid: true });
    expect(getPlanBadgeMeta('free')).toEqual({ tier: 'free', label: 'Explorer (Free)', pill: 'FREE', isPaid: false });
  });
});

