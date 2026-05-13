import assert from 'assert';
import { normalizeLinkedinPayload, validateLinkedinUrl } from '../services/portfolioLinkedinService.js';

function run() {
  const valid = validateLinkedinUrl('https://www.linkedin.com/in/jane-doe-123/');
  assert.strictEqual(valid.valid, true, 'Expected a valid LinkedIn URL');

  const invalid = validateLinkedinUrl('https://linkedin.com/company/acme');
  assert.strictEqual(invalid.valid, false, 'Company URL should be rejected for profile import');

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

try {
  run();
} catch (error) {
  console.error(`Portfolio LinkedIn service tests failed: ${error.message}`);
  process.exit(1);
}
