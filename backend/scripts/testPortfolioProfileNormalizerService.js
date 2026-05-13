import assert from 'assert';
import {
  mergePortfolioProfile,
  scoreRepositoryVisibility,
  selectFeaturedProjects,
} from '../services/portfolioProfileNormalizerService.js';

function testScoreRepositoryVisibility() {
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

  assert(highScore > lowScore, 'High quality repo should score higher than low quality repo');
  assert(highScore <= 1 && highScore >= 0, 'Score must be normalized between 0 and 1');
  assert(lowScore <= 1 && lowScore >= 0, 'Score must be normalized between 0 and 1');
}

function testSelectFeaturedProjects() {
  const projects = Array.from({ length: 8 }).map((_, i) => ({
    id: `repo-${i + 1}`,
    visibilityScore: (8 - i) / 10,
  }));

  const featured = selectFeaturedProjects(projects, 5);
  assert.strictEqual(featured.length, 5, 'Should select only 5 featured projects');
  assert.strictEqual(featured[0].id, 'repo-1', 'Should keep highest score first');
  assert.strictEqual(featured[4].id, 'repo-5', 'Should include top 5 by score');
}

function testMergePortfolioProfile() {
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

  assert.strictEqual(merged.basicInfo.fullName, 'Aman Rao', 'Resume name should be preferred');
  assert.strictEqual(
    merged.basicInfo.headline,
    'Full Stack Developer',
    'LinkedIn headline should be preferred',
  );
  assert.strictEqual(merged.experience.length, 2, 'Experience should be deduplicated and merged');
  assert(merged.projects.length >= 1, 'GitHub repositories should map to projects');
  assert(merged.projects[0].visibilityScore >= 0, 'Project must include visibility score');
  assert(
    merged.projects.some((project) => project.featured),
    'Top projects should be auto-marked as featured',
  );
  assert(merged.metadata.dataQualityScore > 0, 'Merged profile should include data quality score');
}

function run() {
  testScoreRepositoryVisibility();
  testSelectFeaturedProjects();
  testMergePortfolioProfile();
  console.log('Portfolio profile normalizer tests passed.');
}

try {
  run();
} catch (error) {
  console.error(`Portfolio profile normalizer tests failed: ${error.message}`);
  process.exit(1);
}
