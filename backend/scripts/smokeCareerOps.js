import process from 'process';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

const BASE_URL = ensureLocalBaseUrl(process.env.CAREER_OPS_BASE_URL || 'http://localhost:5000');
const TOKEN = process.env.CAREER_OPS_SMOKE_TOKEN || process.env.TEST_AUTH_TOKEN || '';

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(buildLocalEndpoint(BASE_URL, path), {
    method,
    headers: buildHeaders(),
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runUnauthenticatedSmoke() {
  const result = await requestJson('/api/jobs/career-ops/evaluate', {
    method: 'POST',
    body: {
      jobDescription: 'Backend engineer role focused on Node.js and PostgreSQL.',
      candidateProfile: {
        headline: 'Backend Engineer',
        coreSkills: ['Node.js', 'PostgreSQL', 'Express'],
      },
    },
  });

  assert(result.status === 401, `Expected 401 for unauthenticated request, got ${result.status}`);
  console.log('OK unauth POST /api/jobs/career-ops/evaluate -> 401');
}

async function runAuthenticatedSmoke() {
  const badRequest = await requestJson('/api/jobs/career-ops/evaluate', {
    method: 'POST',
    body: {
      candidateProfile: {
        headline: 'Backend Engineer',
        coreSkills: ['Node.js'],
      },
    },
  });

  assert(badRequest.status === 400, `Expected 400 for missing jobDescription, got ${badRequest.status}`);
  console.log('OK auth validation /api/jobs/career-ops/evaluate -> 400');

  const goodRequest = await requestJson('/api/jobs/career-ops/evaluate', {
    method: 'POST',
    body: {
      jobDescription: 'Hiring an SDE to build APIs with Node.js, PostgreSQL, and Docker. Must have DSA and communication skills.',
      candidateProfile: {
        headline: 'Backend Developer with 2 years experience',
        summary: 'Built Express APIs and optimized PostgreSQL queries in production systems.',
        coreSkills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'REST API'],
        projectHighlights: ['Reduced API latency by 35% using indexing and query refactors'],
      },
      company: 'Sample Company',
      role: 'Software Engineer',
    },
  });

  assert(goodRequest.status === 200, `Expected 200 for valid request, got ${goodRequest.status}`);
  assert(typeof goodRequest.json?.overallScore === 'number', 'Expected numeric overallScore in response');
  assert(Array.isArray(goodRequest.json?.topMatches), 'Expected topMatches array in response');
  assert(Array.isArray(goodRequest.json?.gaps), 'Expected gaps array in response');
  assert(Array.isArray(goodRequest.json?.actionPlan), 'Expected actionPlan array in response');
  console.log('OK auth POST /api/jobs/career-ops/evaluate -> 200');
}

async function main() {
  try {
    console.log(`Career Ops smoke target: ${BASE_URL}`);
    console.log(TOKEN ? 'Mode: AUTHENTICATED' : 'Mode: UNAUTHENTICATED');

    if (TOKEN) {
      await runAuthenticatedSmoke();
    } else {
      await runUnauthenticatedSmoke();
    }

    console.log('Career Ops smoke test passed.');
  } catch (error) {
    console.error(`Career Ops smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
