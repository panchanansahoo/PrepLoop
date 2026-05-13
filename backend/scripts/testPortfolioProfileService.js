import {
  buildNormalizedProfile,
  mergeNormalizedProfiles,
  rankGithubRepositories,
  pickFeaturedProjects,
} from '../services/portfolioProfileService.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const empty = buildNormalizedProfile();
  assert(empty.basics && empty.portfolioMeta, 'Normalized profile should contain basics and portfolioMeta');

  const ranked = rankGithubRepositories([
    {
      name: 'alpha',
      stargazers_count: 10,
      pushed_at: new Date().toISOString(),
      description: 'Alpha project',
      homepage: 'https://alpha.dev',
      readmeText: '# Alpha\nSetup\n',
      topics: ['fullstack'],
    },
    {
      name: 'beta',
      stargazers_count: 40,
      pushed_at: '2020-01-01T00:00:00.000Z',
      description: '',
      homepage: '',
      readmeText: '',
      topics: [],
    },
  ]);
  assert(ranked[0].name === 'alpha', 'Ranking should reward demo + readme + recency');

  const featured = pickFeaturedProjects(ranked, 5);
  assert(featured.length >= 1 && featured.length <= 5, 'Featured projects should be capped between 1 and 5');

  const merged = mergeNormalizedProfiles({
    resume: {
      basics: { title: 'Software Engineer', email: 'a@b.com' },
      experience: [{ company: 'A', role: 'Engineer', start: '2022-01' }],
      skills: { languages: ['JavaScript'] },
    },
    linkedin: {
      basics: { title: 'Full Stack Developer', summary: 'Builds products' },
      experience: [{ company: 'A', role: 'Engineer', start: '2022-01' }],
      skills: { frameworks: ['React'] },
    },
    github: {
      socials: { github: 'octocat' },
      projects: [{ name: 'alpha', stack: ['JavaScript'], repoUrl: 'https://github.com/a/alpha' }],
      skills: { languages: ['JavaScript', 'TypeScript'] },
    },
  });

  assert(merged.basics.title, 'Merged profile should include a current title');
  assert(merged.projects.length > 0, 'Merged profile should include projects');
  assert(merged.skills.languages.includes('JavaScript'), 'Merged profile should dedupe and retain skills');

  console.log('Portfolio profile service tests passed.');
}

try {
  run();
} catch (error) {
  console.error(`Portfolio profile service tests failed: ${error.message}`);
  process.exit(1);
}
