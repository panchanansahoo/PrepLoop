import { describe, it, expect } from 'vitest';
import {
  buildProfileResponse,
  isProfileCompleteForReward,
  calculateProfileCompletionPercentage,
  isProfilesAccessBlocked,
  PROFILE_COMPLETION_COIN_REWARD,
} from '../../services/profileService.js';

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
    expect(response.user.full_name).toBe('Alex Mercer');
    expect(response.user.subscription_tier).toBe('pro');
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
});


