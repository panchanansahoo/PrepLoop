import { describe, it, expect } from 'vitest';
import {
  mergePortfolioProfile,
  scoreRepositoryVisibility,
  selectFeaturedProjects,
} from '../../services/portfolioProfileNormalizerService.js';

describe('Portfolio Profile Normalizer Service', () => {
  it('correctly scores repository visibility based on stars, forks, and freshness', () => {
    const highQualityRepo = {
      stargazers_count: 140,
      forks_count: 25,
      pushed_at: new Date().toISOString(),
      description: 'Production-ready app with docs',
      readme: '# Demo\n\nhttps://example.dev',
      pinned: true,
    };

    const lowQualityRepo = {
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2022-01-01T00:00:00.000Z',
      description: '',
      readme: '',
      pinned: false,
    };

    const highScore = scoreRepositoryVisibility(highQualityRepo);
    const lowScore = scoreRepositoryVisibility(lowQualityRepo);

    expect(highScore).toBeGreaterThan(lowScore);
    expect(highScore).toBeLessThanOrEqual(1);
    expect(highScore).toBeGreaterThanOrEqual(0);
    expect(lowScore).toBeLessThanOrEqual(1);
    expect(lowScore).toBeGreaterThanOrEqual(0);
  });

  it('selects top N featured projects by visibility score', () => {
    const projects = Array.from({ length: 8 }).map((_, i) => ({
      id: `repo-${i + 1}`,
      visibilityScore: (8 - i) / 10,
    }));

    const featured = selectFeaturedProjects(projects, 5);
    expect(featured).toHaveLength(5);
    expect(featured[0].id).toBe('repo-1');
    expect(featured[4].id).toBe('repo-5');
  });

  it('merges resume, LinkedIn, and GitHub profile sources seamlessly', () => {
    const resume = {
      basicInfo: {
        fullName: 'Aman Rao',
        email: 'aman@example.com',
        location: 'Bangalore',
        summary: 'Backend engineer',
      },
      experience: [
        {
          company: 'Acme',
          role: 'Software Engineer',
          startDate: '2023-01-01',
          achievements: ['Built APIs'],
        },
      ],
      skills: {
        languages: ['JavaScript', 'TypeScript'],
        tools: ['Docker'],
      },
    };

    const linkedin = {
      basicInfo: {
        headline: 'Full Stack Developer',
        summary: 'Building products end-to-end',
      },
      experience: [
        {
          company: 'Acme',
          role: 'Software Engineer',
          startDate: '2023-01-01',
          achievements: ['Delivered platform migration'],
        },
        {
          company: 'Beta Corp',
          role: 'Intern',
          startDate: '2022-01-01',
        },
      ],
      skills: ['React', 'TypeScript'],
    };

    const github = {
      username: 'amanrao',
      profile: {
        followers: 10,
      },
      repositories: [
        {
          id: 1,
          name: 'api-platform',
          description: 'Fast API platform',
          html_url: 'https://github.com/amanrao/api-platform',
          homepage: 'https://api.example.dev',
          language: 'TypeScript',
          stargazers_count: 45,
          forks_count: 9,
          pushed_at: new Date().toISOString(),
          readme: '# API Platform',
          pinned: true,
        },
      ],
    };

    const merged = mergePortfolioProfile({ resume, linkedin, github });

    expect(merged.basicInfo.fullName).toBe('Aman Rao');
    expect(merged.basicInfo.headline).toBe('Full Stack Developer');
    expect(merged.experience).toHaveLength(2);
    expect(merged.projects.length).toBeGreaterThanOrEqual(1);
    expect(merged.projects[0].visibilityScore).toBeGreaterThanOrEqual(0);
    expect(merged.projects.some((project: any) => project.featured)).toBe(true);
    expect(merged.metadata.dataQualityScore).toBeGreaterThan(0);
  });
});

