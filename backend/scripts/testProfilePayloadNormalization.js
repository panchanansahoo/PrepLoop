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

  const clearedFields = normalizeProfileUpdatePayload({
    fullName: '',
    currentRole: '',
    experienceLevel: '',
  });

  assert(clearedFields.full_name === '', 'An explicit empty name should clear the stored name');
  assert(clearedFields.designation === '', 'An explicit empty role should clear the stored role');
  assert(clearedFields.experience_level === '', 'An explicit empty level should clear the stored level');

  const themeUpdate = normalizeProfileUpdatePayload({ profile_theme: 'MIDNIGHT' });
  assert(themeUpdate.profile_theme === 'midnight', 'Profile themes should be normalized');

  const invalidTheme = normalizeProfileUpdatePayload({ profile_theme: 'neon' });
  assert(
    !Object.prototype.hasOwnProperty.call(invalidTheme, 'profile_theme'),
    'Unsupported profile themes should not be included in updates',
  );

  console.log('Profile payload normalization tests passed.');
}

try {
  run();
} catch (error) {
  console.error(`Profile payload normalization tests failed: ${error.message}`);
  process.exit(1);
}
