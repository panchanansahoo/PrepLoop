import { describe, it, expect } from 'vitest';
import {
  buildCareerSearchQuery,
  normalizeProfileSignals,
  scoreJobsAgainstProfile,
} from '../../services/preploopCareerService.js';

describe('PrepLoop Career Service Unit Tests', () => {
  it('normalizes raw profile signals accurately', () => {
    const signals = normalizeProfileSignals({
      skills: 'React, Node.js, TypeScript',
      location: 'Bengaluru',
      qualification: 'B.Tech CSE',
      preferred_role: 'Frontend Developer',
    });

    expect(signals.skills).toEqual(['React', 'Node.js', 'TypeScript']);
    expect(signals.location).toBe('Bengaluru');
    expect(signals.qualification).toBe('B.Tech CSE');
    expect(signals.preferredRole).toBe('Frontend Developer');
  });

  it('builds an expansive career search query with role, location, and qualification', () => {
    const signals = normalizeProfileSignals({
      skills: 'React, Node.js',
      location: 'Bengaluru',
      qualification: 'B.Tech CSE',
      preferred_role: 'Frontend Developer',
    });

    const query = buildCareerSearchQuery(signals);
    expect(query).toMatch(/Frontend Developer/);
    expect(query).toMatch(/Bengaluru/);
    expect(query).toMatch(/B\.Tech CSE/);
  });

  it('ranks jobs matching skills, location, and qualifications higher', () => {
    const signals = normalizeProfileSignals({
      skills: 'React, TypeScript',
      location: 'Bengaluru',
      qualification: 'B.Tech CSE',
      preferred_role: 'Frontend Developer',
    });

    const jobs = scoreJobsAgainstProfile([
      {
        title: 'Frontend Developer',
        company: 'Example Co',
        location: 'Bengaluru, India',
        description: 'Hiring React and TypeScript engineers with B.Tech background.',
        requirements: ['React', 'TypeScript'],
      },
      {
        title: 'Backend Engineer',
        company: 'Example Co',
        location: 'Pune, India',
        description: 'Node.js role for backend services.',
        requirements: ['Node.js'],
      },
    ], signals);

    expect(jobs[0].matchScore).toBeGreaterThanOrEqual(jobs[1].matchScore);
    expect(jobs[0].matchedSkills).toContain('React');
    expect(jobs[0].matchedSignals.some(s => s.includes('Location'))).toBe(true);
    expect(jobs[0].matchedSignals.some(s => s.includes('Qualification'))).toBe(true);
  });

  it('scores jobs with fallback defaults when only location and qualification are present', () => {
    const locationOnly = scoreJobsAgainstProfile([
      {
        title: 'Data Analyst',
        company: 'Example Co',
        location: 'Bengaluru, India',
        description: 'Entry level analytics role.',
        requirements: [],
      },
    ], {
      location: 'Bengaluru',
      qualification: 'MBA',
    });

    expect(locationOnly[0].matchScore).toBeGreaterThanOrEqual(30);
  });
});

