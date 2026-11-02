import { describe, it, expect } from 'vitest';
import { normalizeProfileUpdatePayload } from '../../utils/profilePayload.js';

describe('Profile Payload Normalization Unit Tests', () => {
  it('does not produce updates for whitespace-only values', () => {
    const whitespaceOnly = normalizeProfileUpdatePayload({
      fullName: '   ',
      currentRole: '   ',
      experienceLevel: '   ',
    });
    expect(Object.keys(whitespaceOnly).length).toBe(0);
  });

  it('normalizes GitHub URL to username', () => {
    const githubFromUrl = normalizeProfileUpdatePayload({
      githubUsername: 'https://github.com/octocat/',
    });
    expect(githubFromUrl.github_username).toBe('octocat');
  });

  it('normalizes GitHub @handle', () => {
    const githubFromHandle = normalizeProfileUpdatePayload({
      github_username: '@octo-cat',
    });
    expect(githubFromHandle.github_username).toBe('octo-cat');
  });

  it('excludes invalid GitHub usernames', () => {
    const invalidGithub = normalizeProfileUpdatePayload({
      githubUsername: 'not valid username!',
    });
    expect(Object.prototype.hasOwnProperty.call(invalidGithub, 'github_username')).toBe(false);
  });

  it('maps numeric experience to experience_years and clears experience_summary', () => {
    const experienceNumeric = normalizeProfileUpdatePayload({
      experience: '3.5',
    });
    expect(experienceNumeric.experience_years).toBe(3.5);
    expect(experienceNumeric.experience_summary).toBeNull();
  });

  it('maps text experience to experience_summary', () => {
    const experienceSummary = normalizeProfileUpdatePayload({
      experience_summary: 'Built APIs and improved latency',
    });
    expect(experienceSummary.experience_summary).toBe('Built APIs and improved latency');
  });

  it('clears stored fields when explicit empty strings are passed', () => {
    const clearedFields = normalizeProfileUpdatePayload({
      fullName: '',
      currentRole: '',
      experienceLevel: '',
    });
    expect(clearedFields.full_name).toBe('');
    expect(clearedFields.designation).toBe('');
    expect(clearedFields.experience_level).toBe('');
  });

  it('normalizes valid profile themes and ignores invalid ones', () => {
    const themeUpdate = normalizeProfileUpdatePayload({ profile_theme: 'MIDNIGHT' });
    expect(themeUpdate.profile_theme).toBe('midnight');

    const invalidTheme = normalizeProfileUpdatePayload({ profile_theme: 'neon' });
    expect(Object.prototype.hasOwnProperty.call(invalidTheme, 'profile_theme')).toBe(false);
  });
});

