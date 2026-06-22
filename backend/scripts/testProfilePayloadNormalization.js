import { normalizeProfileUpdatePayload } from '../utils/profilePayload.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const whitespaceOnly = normalizeProfileUpdatePayload({
    fullName: '   ',
    currentRole: '   ',
    experienceLevel: '   ',
  });

  assert(Object.keys(whitespaceOnly).length === 0, 'Whitespace-only values should not produce updates');

  const githubFromUrl = normalizeProfileUpdatePayload({
    githubUsername: 'https://github.com/octocat/',
  });

  assert(githubFromUrl.github_username === 'octocat', 'GitHub URL should be normalized to username');

  const githubFromHandle = normalizeProfileUpdatePayload({
    github_username: '@octo-cat',
  });

  assert(githubFromHandle.github_username === 'octo-cat', 'GitHub @handle should be normalized');

  const invalidGithub = normalizeProfileUpdatePayload({
    githubUsername: 'not valid username!',
  });

  assert(
    !Object.prototype.hasOwnProperty.call(invalidGithub, 'github_username'),
    'Invalid GitHub username should not be included in updates',
  );

  const experienceNumeric = normalizeProfileUpdatePayload({
    experience: '3.5',
  });

  assert(experienceNumeric.experience_years === 3.5, 'Numeric experience should map to experience_years');
  assert(experienceNumeric.experience_summary === null, 'Numeric experience should clear experience_summary');

  const experienceSummary = normalizeProfileUpdatePayload({
    experience_summary: 'Built APIs and improved latency',
  });

  assert(
    experienceSummary.experience_summary === 'Built APIs and improved latency',
    'Text experience should map to experience_summary',
  );

  console.log('Profile payload normalization tests passed.');
}

try {
  run();
} catch (error) {
  console.error(`Profile payload normalization tests failed: ${error.message}`);
  process.exit(1);
}
