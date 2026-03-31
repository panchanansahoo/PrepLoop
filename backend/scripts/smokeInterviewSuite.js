import process from 'process';

const BASE_URL = process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000';
const TOKEN = process.env.INTERVIEW_SUITE_SMOKE_TOKEN || '';

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
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
  const targets = [
    { path: '/api/interview-suite/weakness/heatmap', method: 'GET' },
    {
      path: '/api/interview-suite/company/round-simulation-flow',
      method: 'POST',
      body: { company: 'Google', role: 'SDE', skillLevel: 'intermediate' },
    },
    {
      path: '/api/interview-suite/communication/rubric-score',
      method: 'POST',
      body: { answer: 'I would clarify constraints, outline options, then recommend one path.' },
    },
    {
      path: '/api/interview-suite/resume/question-generator',
      method: 'POST',
      body: {
        company: 'Google',
        role: 'SDE',
        skillLevel: 'intermediate',
        resumeText: 'Built a scalable queueing service with retries and observability.',
      },
    },
  ];

  for (const target of targets) {
    const result = await requestJson(target.path, {
      method: target.method,
      body: target.body,
    });
    assert(
      result.status === 401,
      `Expected 401 for ${target.method} ${target.path} without token, got ${result.status}`,
    );
    console.log(`OK unauth ${target.method} ${target.path} -> ${result.status}`);
  }
}

async function runAuthenticatedSmoke() {
  const heatmap = await requestJson('/api/interview-suite/weakness/heatmap');
  assert(heatmap.status === 200, `Expected 200 for weakness/heatmap, got ${heatmap.status}`);
  assert(Array.isArray(heatmap.json?.heatmap), 'weakness/heatmap response missing heatmap array');
  console.log('OK auth GET /api/interview-suite/weakness/heatmap');

  const roadmap = await requestJson('/api/interview-suite/company/round-simulation-flow', {
    method: 'POST',
    body: { company: 'Google', role: 'SDE', skillLevel: 'intermediate' },
  });
  assert(roadmap.status === 200, `Expected 200 for round-simulation-flow, got ${roadmap.status}`);
  assert(Array.isArray(roadmap.json?.rounds), 'round-simulation-flow missing flat rounds array');
  assert(Array.isArray(roadmap.json?.roadmap?.rounds), 'round-simulation-flow missing nested roadmap.rounds array');
  assert(typeof roadmap.json?.skillLevel === 'string', 'round-simulation-flow missing skillLevel');
  console.log('OK auth POST /api/interview-suite/company/round-simulation-flow');

  const rubric = await requestJson('/api/interview-suite/communication/rubric-score', {
    method: 'POST',
    body: {
      answer: 'I would clarify assumptions, propose two options, and pick one with rationale and trade-offs.',
    },
  });
  assert(rubric.status === 200, `Expected 200 for rubric-score, got ${rubric.status}`);
  assert(typeof rubric.json?.overall === 'number', 'rubric-score missing numeric overall');
  assert(rubric.json?.rubric && typeof rubric.json.rubric === 'object', 'rubric-score missing rubric object');
  console.log('OK auth POST /api/interview-suite/communication/rubric-score');

  const resume = await requestJson('/api/interview-suite/resume/question-generator', {
    method: 'POST',
    body: {
      company: 'Google',
      role: 'SDE',
      skillLevel: 'advanced',
      resumeText: 'Built a distributed task execution platform and reduced failure retries by 30%.',
    },
  });
  assert(resume.status === 200, `Expected 200 for resume/question-generator, got ${resume.status}`);
  assert(Array.isArray(resume.json?.projectQuestions), 'resume/question-generator missing projectQuestions');
  assert(Array.isArray(resume.json?.hrQuestions), 'resume/question-generator missing hrQuestions');
  assert(Array.isArray(resume.json?.technicalQuestions), 'resume/question-generator missing technicalQuestions');
  assert(typeof resume.json?.experienceLevel === 'string', 'resume/question-generator missing normalized experienceLevel');
  console.log('OK auth POST /api/interview-suite/resume/question-generator');
}

async function runHealthCheck() {
  const health = await requestJson('/health');
  assert(health.status === 200, `Expected 200 for /health, got ${health.status}`);
  assert(health.json?.status === 'ok', 'Health check payload missing status=ok');
  console.log('OK GET /health');
}

async function main() {
  try {
    console.log(`Smoke test target: ${BASE_URL}`);
    console.log(TOKEN ? 'Mode: AUTHENTICATED' : 'Mode: UNAUTHENTICATED');

    await runHealthCheck();

    if (TOKEN) {
      await runAuthenticatedSmoke();
    } else {
      await runUnauthenticatedSmoke();
    }

    console.log('Interview Suite smoke test passed.');
  } catch (error) {
    console.error(`Interview Suite smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
