import { describe, it, expect } from 'vitest';
import {
  buildInitialProfile,
  normalizeProfileData,
  buildProfilePayload,
  splitSkillChips,
  calculateProfileCompletion,
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
});

