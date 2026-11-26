import assert from 'assert';
import {
  parseLinkedinExportText,
  normalizeLinkedinPayload,
  validateLinkedinUrl,
  normalizeLinkedinIdOrUrl,
  normalizeExternalLinkedinRecord,
  fetchLinkedinProfileById,
} from '../services/portfolioLinkedinService.js';

async function run() {
  const valid = validateLinkedinUrl('https://www.linkedin.com/in/jane-doe-123/');
  assert.strictEqual(valid.valid, true, 'Expected a valid LinkedIn URL');

  const invalid = validateLinkedinUrl('https://linkedin.com/company/acme');
  assert.strictEqual(invalid.valid, false, 'Company URL should be rejected for profile import');

  const idNorm = normalizeLinkedinIdOrUrl('panchanan-sahoo');
  assert.strictEqual(idNorm.valid, true);
  assert.strictEqual(idNorm.url, 'https://www.linkedin.com/in/panchanan-sahoo');

  const badIdNorm = normalizeLinkedinIdOrUrl('https://linkedin.com/company/acme');
  assert.strictEqual(badIdNorm.valid, false);

  const ext = normalizeExternalLinkedinRecord({
    full_name: 'Jane Doe',
    headline: 'Staff Engineer',
    summary: 'Distributed systems',
    city: 'Bengaluru',
    country_full_name: 'India',
    experiences: [{ title: 'Staff Engineer', company: 'Acme', starts_at: { year: 2022 } }],
    education: [{ degree_name: 'B.Tech', school: 'NIT' }],
    skills: ['Go', 'TypeScript'],
  }, 'https://www.linkedin.com/in/jane-doe');
  assert.strictEqual(ext.fullName, 'Jane Doe');
  assert.strictEqual(ext.company, 'Acme');
  assert.strictEqual(ext.skills, 'Go, TypeScript');

  const noKeyResult = await fetchLinkedinProfileById('jane-doe');
  assert.strictEqual(noKeyResult.valid, true);
  assert.strictEqual(noKeyResult.linkedinUrl, 'https://www.linkedin.com/in/jane-doe');

  const parsed = parseLinkedinExportText('Jane Doe\nEngineer\nPune, India\nwww.linkedin.com/in/jane\nSummary\nBuilds apps.\nExperience\nDeveloper at Acme\nEducation\nABC University\nSkills\nJavaScript');
  assert.deepStrictEqual(parsed.skills, ['JavaScript']);
  assert.strictEqual(parsed.location, 'Pune, India');
  assert.strictEqual(parsed.linkedin, 'https://www.linkedin.com/in/jane');
  assert.strictEqual(parsed.summary, 'Builds apps.');
  assert.strictEqual(parsed.experience.length, 1);
  assert.strictEqual(parsed.education.length, 1);

  const normalized = normalizeLinkedinPayload({
    url: 'https://linkedin.com/in/jane-doe-123',
    headline: 'Senior Engineer',
    summary: 'Building resilient systems',
    experience: [{ company: 'Acme', role: 'Engineer' }],
    education: [{ institute: 'ABC University' }],
    skills: ['Node.js', 'System Design'],
    fullName: 'Jane Doe',
  });

  assert.strictEqual(normalized.basicInfo.fullName, 'Jane Doe');
  assert.strictEqual(normalized.experience[0].source, 'linkedin');
  assert.strictEqual(normalized.skills.length, 2);

  console.log('Portfolio LinkedIn service tests passed.');
}

run().catch((error) => {
  console.error(`Portfolio LinkedIn service tests failed: ${error.message}`);
  process.exit(1);
});
