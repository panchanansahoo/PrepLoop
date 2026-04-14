import process from 'process';
import { resolveLocalBaseUrl } from './utils/resolveBaseUrl.js';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

let BASE_URL = ensureLocalBaseUrl(process.env.FRESHER_TECHNICAL_SMOKE_BASE_URL || 'http://localhost:5000');
const TOKEN = process.env.FRESHER_TECHNICAL_SMOKE_TOKEN || process.env.AI_FEATURES_SMOKE_TOKEN || process.env.TEST_AUTH_TOKEN || '';

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

async function runHealthCheck() {
  const health = await requestJson('/health');
  assert(health.status === 200, `Expected 200 for /health, got ${health.status}`);
  assert(health.json?.status === 'ok', 'Health response missing status=ok');
  console.log('OK GET /health');
}

function assertTechnicalQuestionMeta(response, expectedSequence) {
  assert(response.status === 200, `Expected 200 from fresher technical flow, got ${response.status}`);
  assert(response.json && typeof response.json === 'object', 'Response missing JSON payload');
  assert(response.json.questionSource === 'fresher-technical-hybrid', 'Unexpected questionSource');
  assert(response.json.questionMeta?.track === 'fresher-technical', 'Unexpected question track');
  assert(response.json.questionMeta?.sequence === expectedSequence, `Expected sequence ${expectedSequence}, got ${response.json.questionMeta?.sequence}`);
}

async function runAuthenticatedSmoke() {
  const start = await requestJson('/api/company-interview/start', {
    method: 'POST',
    body: {
      company: 'Preploop',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewMode: 'fresher-hr-tech',
      interviewType: 'Technical',
      totalQuestions: 12,
      experienceLevel: 'fresher',
      advancedOptions: {
        resumeInterviewMode: 'fresher-hr-tech',
        questionCount: 12,
      },
    },
  });

  assertTechnicalQuestionMeta(start, 1);
  assert(typeof start.json.question === 'string' && start.json.question.length > 0, 'Start response missing question text');
  console.log('OK auth POST /api/company-interview/start');

  const q2 = await requestJson('/api/company-interview/follow-up', {
    method: 'POST',
    body: {
      company: 'Preploop',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewMode: 'fresher-hr-tech',
      interviewType: 'Technical',
      questionNumber: 2,
      totalQuestions: 12,
      experienceLevel: 'fresher',
      previousQuestion: start.json.question,
      userAnswer: 'I built a CRUD app with React and Node and learned how the pieces fit together.',
      advancedOptions: {
        resumeInterviewMode: 'fresher-hr-tech',
        questionCount: 12,
      },
    },
  });

  assertTechnicalQuestionMeta(q2, 2);
  assert(q2.json.complete === false, 'Q2 should not complete the interview');
  assert(typeof q2.json.followUpQuestion === 'string' && q2.json.followUpQuestion.length > 0, 'Q2 response missing follow-up question');
  console.log('OK auth POST /api/company-interview/follow-up (Q2)');

  const q11 = await requestJson('/api/company-interview/follow-up', {
    method: 'POST',
    body: {
      company: 'Preploop',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewMode: 'fresher-hr-tech',
      interviewType: 'Technical',
      questionNumber: 11,
      totalQuestions: 12,
      experienceLevel: 'fresher',
      userAnswer: 'Yes, I would like to know about the team and growth opportunities.',
      advancedOptions: {
        resumeInterviewMode: 'fresher-hr-tech',
        questionCount: 12,
      },
    },
  });

  assertTechnicalQuestionMeta(q11, 11);
  assert(q11.json.followUpQuestion === 'Do you have any questions for me about the role, the team, or our company?', 'Unexpected Q11 wrap-up question');
  assert(q11.json.complete === false, 'Q11 should not complete the interview');
  console.log('OK auth POST /api/company-interview/follow-up (Q11)');

  const q12 = await requestJson('/api/company-interview/follow-up', {
    method: 'POST',
    body: {
      company: 'Preploop',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewMode: 'fresher-hr-tech',
      interviewType: 'Technical',
      questionNumber: 12,
      totalQuestions: 12,
      experienceLevel: 'fresher',
      userAnswer: 'No further questions, thank you.',
      advancedOptions: {
        resumeInterviewMode: 'fresher-hr-tech',
        questionCount: 12,
      },
    },
  });

  assertTechnicalQuestionMeta(q12, null);
  assert(q12.json.complete === true, 'Q12 should complete the interview');
  assert(typeof q12.json.closingRemark === 'string' && q12.json.closingRemark.length > 0, 'Q12 response missing closing remark');
  assert(q12.json.followUpQuestion === '', 'Q12 should not return a follow-up question');
  console.log('OK auth POST /api/company-interview/follow-up (Q12)');
}

async function main() {
  try {
    BASE_URL = ensureLocalBaseUrl(await resolveLocalBaseUrl({
      envVarName: 'FRESHER_TECHNICAL_SMOKE_BASE_URL',
      fallback: BASE_URL,
    }));
    console.log(`Fresher technical smoke target: ${BASE_URL}`);
    console.log(TOKEN ? 'Mode: AUTHENTICATED' : 'Mode: UNAUTHENTICATED');

    const strictMode = process.env.FRESHER_TECHNICAL_SMOKE_STRICT === 'true' || process.env.CI === 'true';

    await runHealthCheck();
    if (!TOKEN) {
      const message = 'Missing auth token: set FRESHER_TECHNICAL_SMOKE_TOKEN or AI_FEATURES_SMOKE_TOKEN.';
      if (strictMode) {
        throw new Error(`${message} Strict mode is enabled.`);
      }
      console.log(`Skipping authenticated fresher technical smoke: ${message}`);
      return;
    }
    await runAuthenticatedSmoke();

    console.log('Fresher technical interview smoke test passed.');
  } catch (error) {
    console.error(`Fresher technical interview smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();