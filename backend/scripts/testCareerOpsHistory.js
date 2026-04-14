import process from 'process';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

const BASE_URL = ensureLocalBaseUrl(process.env.CAREER_OPS_BASE_URL || 'http://localhost:5000');
const TOKEN = process.env.CAREER_OPS_SMOKE_TOKEN || process.env.TEST_AUTH_TOKEN || '';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(buildLocalEndpoint(BASE_URL, path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

async function main() {
  try {
    assert(TOKEN, 'CAREER_OPS_SMOKE_TOKEN or TEST_AUTH_TOKEN is required');

    const evaluate = await requestJson('/api/jobs/career-ops/evaluate', {
      method: 'POST',
      body: {
        company: 'History Test Co',
        role: 'Backend Engineer',
        jobDescription: 'Hiring a backend engineer to build Node.js APIs, work with PostgreSQL, and ship production features.',
        candidateProfile: {
          headline: 'Backend Engineer',
          summary: 'Built APIs and data-heavy systems with Node.js and PostgreSQL.',
          coreSkills: ['Node.js', 'PostgreSQL', 'Express'],
          projectHighlights: ['Built a production API for a student platform'],
        },
      },
    });

    assert(evaluate.status === 200, `Expected 200 from evaluate, got ${evaluate.status}`);

    const history = await requestJson('/api/jobs/career-ops/history?limit=5');
    assert(history.status === 200, `Expected 200 from history endpoint, got ${history.status}`);
    assert(Array.isArray(history.json?.data), 'Expected history response data array');
    assert(history.json.data.length > 0, 'Expected at least one Career Ops history entry');

    console.log('Career Ops history smoke test passed.');
  } catch (error) {
    console.error(`Career Ops history smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();