import process from 'process';
import { resolveLocalBaseUrl } from './utils/resolveBaseUrl.js';

let BASE_URL = process.env.INTERVIEW_BASE_URL || 'http://localhost:5000';
const TOKEN = process.env.TEST_AUTH_TOKEN || process.env.INTERVIEW_SMOKE_TOKEN || '';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
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

async function runGuestSmoke() {
  const startPayload = {
    company: 'Google',
    role: 'Software Engineer',
    stage: 'Technical',
    interviewRuntimeMode: 'full_realtime',
    experienceLevel: 'fresher',
    totalQuestions: 6,
  };

  const startResult = await requestJson('/api/company-interview/start', {
    method: 'POST',
    body: startPayload,
  });

  assert(startResult.status === 200, `Expected 200 from guest /start, got ${startResult.status}`);
  assert(typeof startResult.json?.question === 'string' && startResult.json.question.length > 0, 'Expected start question in guest /start response');
  assert(startResult.json?.interviewRuntimeMode, 'Expected interviewRuntimeMode in guest /start response');
  assert(startResult.json?.telemetry, 'Expected telemetry in guest /start response');
  assert(Number.isFinite(Number(startResult.json?.telemetry?.totalTurns)), 'Expected numeric telemetry.totalTurns in guest /start response');

  const followUpPayload = {
    company: 'Google',
    role: 'Software Engineer',
    stage: 'Technical',
    interviewRuntimeMode: startResult.json.interviewRuntimeMode,
    previousQuestion: startResult.json.question,
    userAnswer: 'I would clarify constraints, discuss an optimal approach, and analyze time-space complexity.',
    questionNumber: 2,
    totalQuestions: 6,
    experienceLevel: 'fresher',
  };

  const followUpResult = await requestJson('/api/company-interview/follow-up', {
    method: 'POST',
    body: followUpPayload,
  });

  assert(followUpResult.status === 200, `Expected 200 from guest /follow-up, got ${followUpResult.status}`);
  assert(followUpResult.json?.interviewRuntimeMode, 'Expected interviewRuntimeMode in guest /follow-up response');
  assert(followUpResult.json?.telemetry, 'Expected telemetry in guest /follow-up response');
  assert(Number.isFinite(Number(followUpResult.json?.telemetry?.totalTurns)), 'Expected numeric telemetry.totalTurns in guest /follow-up response');
  assert(
    typeof followUpResult.json?.nextQuestion === 'string' || followUpResult.json?.complete === true,
    'Expected nextQuestion or complete=true in guest /follow-up response'
  );

  console.log('Guest company interview smoke test passed.');
}

async function main() {
  try {
    BASE_URL = await resolveLocalBaseUrl({
      envVarName: 'INTERVIEW_BASE_URL',
      fallback: BASE_URL,
    });

    await runGuestSmoke();

    if (!TOKEN) {
      console.log('Skipping authenticated company interview smoke: set TEST_AUTH_TOKEN or INTERVIEW_SMOKE_TOKEN.');
      return;
    }

    const startPayload = {
      company: 'Google',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewRuntimeMode: 'full_realtime',
      experienceLevel: 'fresher',
      totalQuestions: 6,
    };

    const startResult = await requestJson('/api/company-interview/start', {
      method: 'POST',
      body: startPayload,
    });

    assert(startResult.status === 200, `Expected 200 from /start, got ${startResult.status}`);
    assert(typeof startResult.json?.question === 'string' && startResult.json.question.length > 0, 'Expected start question in /start response');
    assert(startResult.json?.interviewRuntimeMode, 'Expected interviewRuntimeMode in /start response');
    assert(startResult.json?.telemetry, 'Expected telemetry in /start response');
    assert(Number.isFinite(Number(startResult.json?.telemetry?.totalTurns)), 'Expected numeric telemetry.totalTurns in /start response');

    const followUpPayload = {
      company: 'Google',
      role: 'Software Engineer',
      stage: 'Technical',
      interviewRuntimeMode: startResult.json.interviewRuntimeMode,
      previousQuestion: startResult.json.question,
      userAnswer: 'I would clarify constraints, discuss an optimal approach, and analyze time-space complexity.',
      questionNumber: 2,
      totalQuestions: 6,
      experienceLevel: 'fresher',
    };

    const followUpResult = await requestJson('/api/company-interview/follow-up', {
      method: 'POST',
      body: followUpPayload,
    });

    assert(followUpResult.status === 200, `Expected 200 from /follow-up, got ${followUpResult.status}`);
    assert(followUpResult.json?.interviewRuntimeMode, 'Expected interviewRuntimeMode in /follow-up response');
    assert(followUpResult.json?.telemetry, 'Expected telemetry in /follow-up response');
    assert(Number.isFinite(Number(followUpResult.json?.telemetry?.totalTurns)), 'Expected numeric telemetry.totalTurns in /follow-up response');
    assert(
      typeof followUpResult.json?.nextQuestion === 'string' || followUpResult.json?.complete === true,
      'Expected nextQuestion or complete=true in /follow-up response'
    );

    console.log('Authenticated company interview smoke test passed.');
  } catch (error) {
    console.error(`Authenticated company interview smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
