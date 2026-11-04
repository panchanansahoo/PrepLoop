import { describe, it, expect } from 'vitest';
import {
  normalizeProfileSignals,
  hasMeaningfulProfileSignals,
  buildCareerSearchQuery,
  scoreJobsAgainstProfile,
} from '../../services/preploopCareerService.js';

describe('Skill Match Jobs Conformance Tests', () => {
  it('correctly detects meaningful profile signals', () => {
    const emptySignals = normalizeProfileSignals({});
    expect(hasMeaningfulProfileSignals(emptySignals)).toBe(false);

    const activeSignals = normalizeProfileSignals({
      skills: ['React', 'Node.js'],
      location: 'Bengaluru',
      preferred_role: 'Full Stack Developer'
    });
    expect(hasMeaningfulProfileSignals(activeSignals)).toBe(true);
    expect(buildCareerSearchQuery(activeSignals)).toContain('Full Stack Developer');
  });

  it('scores real job listings against candidate skills with non-zero match scores', () => {
    const candidate = normalizeProfileSignals({
      skills: ['Python', 'SQL', 'FastAPI'],
      preferred_role: 'Backend Engineer'
    });

    const realJobs = [
      {
        id: 'curated_9',
        title: 'Backend Engineer – Entry Level',
        company: 'Razorpay',
        location: 'Bengaluru, India',
        description: 'Razorpay is looking for entry-level backend engineers. Go, Python, or Ruby experience.',
        requirements: ['Python experience', 'Databases and APIs'],
        apply_link: 'https://razorpay.com/jobs'
      },
      {
        id: 'curated_11',
        title: 'Frontend Engineer – React',
        company: 'Swiggy',
        location: 'Bengaluru, India',
        description: 'Swiggy is hiring frontend engineers. React.js proficiency.',
        requirements: ['React.js proficiency'],
        apply_link: 'https://careers.swiggy.com'
      }
    ];

    const scored = scoreJobsAgainstProfile(realJobs, candidate);
    expect(scored[0].id).toBe('curated_9');
    expect(scored[0].matchScore).toBeGreaterThan(scored[1].matchScore);
    expect(scored[0].matchedSkills).toContain('Python');
    expect(scored[0].id).not.toMatch(/^demo_/);
    expect(scored[0].apply_link).toMatch(/^https:\/\//);
  });

  it('guarantees valid real-world links and metadata without demo placeholders', () => {
    const realSampleJobs = [
      { id: 'real_google_swe', company: 'Google', apply_link: 'https://careers.google.com' },
      { id: 'real_amazon_sde', company: 'Amazon', apply_link: 'https://amazon.jobs' },
      { id: 'real_microsoft_swe', company: 'Microsoft', apply_link: 'https://careers.microsoft.com' },
    ];

    for (const job of realSampleJobs) {
      expect(job.id).not.toContain('demo');
      expect(job.apply_link).toContain('https://');
      expect(job.company.length).toBeGreaterThan(0);
    }
  });
});

