import { describe, it, expect } from 'vitest';
import {
  buildInitialProfile,
  fillLinkedinBlanks,
  normalizeProfileData,
  buildProfilePayload,
  splitSkillChips,
  calculateProfileCompletion,
  normalizeExternalUrl,
  buildSocialUrl,
  normalizeGithubHandle,
  normalizeLinkedinInput,
  getPlanBadgeMeta,
} from './profileHelpers.js';

describe('Profile Helpers', () => {
  it('fills LinkedIn gaps without replacing existing profile details or social links', () => {
    const profile = { ...buildInitialProfile({ fullName: 'Chosen name' }), location: '  ', socialLinks: { twitter: 'me' } };
    const imported = { fullName: 'LinkedIn name', location: 'Pune', skills: 'React', linkedin: 'https://linkedin.com/in/me' };
    const filled = fillLinkedinBlanks(profile, imported);
    expect(filled).toMatchObject({ fullName: 'Chosen name', location: 'Pune', skills: 'React', socialLinks: { twitter: 'me', linkedin: imported.linkedin } });
    expect(fillLinkedinBlanks(filled, { skills: 'Vue', linkedin: 'different' })).toEqual(filled);
  });

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

  it('normalizes LinkedIn user IDs and profile URLs and rejects invalid values', () => {
    expect(normalizeLinkedinInput('john-doe')).toEqual({
      slug: 'john-doe',
      url: 'https://www.linkedin.com/in/john-doe',
    });
    expect(normalizeLinkedinInput('https://www.linkedin.com/in/jane-doe-123/')).toEqual({
      slug: 'jane-doe-123',
      url: 'https://www.linkedin.com/in/jane-doe-123',
    });
    expect(normalizeLinkedinInput('https://linkedin.com/company/acme')).toBeNull();
    expect(normalizeLinkedinInput('   ')).toBeNull();
  });

  it('preserves subscriptionTier, lifecycle fields, and maps plan badge metadata including elite', () => {
    const normalized = normalizeProfileData({
      subscription_tier: 'elite',
      subscription_billing_cycle: 'annual',
      subscription_status: 'cancelled',
      subscription_expires_at: '2027-01-01T00:00:00.000Z',
      subscription_cancelled_at: '2026-06-01T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      coins: 40,
    });
    expect(normalized.subscriptionTier).toBe('elite');
    expect(normalized.subscriptionBillingCycle).toBe('annual');
    expect(normalized.subscriptionStatus).toBe('cancelled');
    expect(normalized.subscriptionExpiresAt).toBe('2027-01-01T00:00:00.000Z');
    expect(normalized.cancelAtPeriodEnd).toBe(true);
    expect(normalized.coins).toBe(40);
    expect(getPlanBadgeMeta('pro')).toEqual({ tier: 'pro', label: 'Pro', pill: 'PRO', isPaid: true });
    expect(getPlanBadgeMeta('elite')).toEqual({ tier: 'elite', label: 'Elite', pill: 'ELITE', isPaid: true });
    expect(getPlanBadgeMeta('premium')).toEqual({ tier: 'premium', label: 'Premium', pill: 'PREMIUM', isPaid: true });
    expect(getPlanBadgeMeta('free')).toEqual({ tier: 'free', label: 'Explorer (Free)', pill: 'FREE', isPaid: false });
  });
});

