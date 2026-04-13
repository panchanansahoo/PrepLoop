import process from 'process';

const BASE_URL = process.env.AI_FEATURES_BASE_URL || 'http://localhost:5000';
const TOKEN = process.env.AI_FEATURES_SMOKE_TOKEN || process.env.TEST_AUTH_TOKEN || '';

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

function resolvePayload(result) {
  return result?.json?.data || result?.json || null;
}

function assertStagePlan(stagePlan, pathLabel) {
  assert(Array.isArray(stagePlan), `${pathLabel} missing stagePlan array`);
  assert(stagePlan.length > 0, `${pathLabel} stagePlan should not be empty`);
  const first = stagePlan[0];
  if (typeof first === 'string') {
    assert(first === 'intake', `${pathLabel} stagePlan should start at intake`);
    return;
  }

  assert(typeof first?.key === 'string', `${pathLabel} stagePlan should contain key/label objects`);
  assert(first.key === 'intake', `${pathLabel} stagePlan should start at intake`);
}

async function runHealthCheck() {
  const health = await requestJson('/health');
  assert(health.status === 200, `Expected 200 for /health, got ${health.status}`);
  assert(health.json?.status === 'ok', 'Health response missing status=ok');
  console.log('OK GET /health');
}

async function runUnauthenticatedSmoke() {
  const targets = [
    { path: '/api/ai-features/stats', method: 'GET' },
    { path: '/api/ai-features/code-review/history', method: 'GET' },
    {
      path: '/api/ai-features/code-review',
      method: 'POST',
      body: { problemId: 1, code: 'function x(){return 1;}', language: 'javascript' },
    },
    {
      path: '/api/ai-features/interview/start',
      method: 'POST',
      body: { interviewType: 'dsa', difficulty: 'easy' },
    },
    { path: '/api/ai-features/interview/history', method: 'GET' },
    { path: '/api/ai-features/performance-trends', method: 'GET' },
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
  const stats = await requestJson('/api/ai-features/stats');
  assert(stats.status === 200, `Expected 200 for /stats, got ${stats.status}`);
  assert(stats.json && typeof stats.json === 'object', 'stats response missing object payload');
  console.log('OK auth GET /api/ai-features/stats');

  const trends = await requestJson('/api/ai-features/performance-trends');
  assert(trends.status === 200, `Expected 200 for /performance-trends, got ${trends.status}`);
  console.log('OK auth GET /api/ai-features/performance-trends');

  const interviewStart = await requestJson('/api/ai-features/interview/start', {
    method: 'POST',
    body: { interviewType: 'dsa', difficulty: 'easy' },
  });
  assert(interviewStart.status === 200, `Expected 200 for /interview/start, got ${interviewStart.status}`);
  const interviewStartPayload = resolvePayload(interviewStart);
  const sessionId =
    interviewStart.json?.session_id ||
    interviewStart.json?.sessionId ||
    interviewStart.json?.data?.session_id ||
    interviewStart.json?.data?.sessionId;
  assert(typeof sessionId === 'string' && sessionId.length > 0, 'interview/start missing session id');
  assert(typeof interviewStartPayload?.stage === 'string', 'interview/start missing stage');
  assert(typeof interviewStartPayload?.stageLabel === 'string', 'interview/start missing stageLabel');
  assertStagePlan(interviewStartPayload?.stagePlan, '/api/ai-features/interview/start');
  assert(
    typeof interviewStartPayload?.initialQuestion === 'string' || typeof interviewStartPayload?.initial_question === 'string',
    'interview/start missing initial question',
  );
  console.log('OK auth POST /api/ai-features/interview/start');

  const interviewRespond = await requestJson(`/api/ai-features/interview/${sessionId}/respond`, {
    method: 'POST',
    body: { response: 'I would first clarify constraints and outline a brute-force baseline.' },
  });
  assert(
    interviewRespond.status === 200,
    `Expected 200 for /interview/${sessionId}/respond, got ${interviewRespond.status}`,
  );
  const interviewRespondPayload = resolvePayload(interviewRespond);
  assert(
    typeof interviewRespondPayload?.interviewerMessage === 'string' && interviewRespondPayload.interviewerMessage.length > 0,
    'interview/respond missing interviewerMessage',
  );
  assert(typeof interviewRespondPayload?.continueInterview === 'boolean', 'interview/respond missing continueInterview boolean');
  assert(typeof interviewRespondPayload?.stage === 'string', 'interview/respond missing stage');
  assert(typeof interviewRespondPayload?.stageLabel === 'string', 'interview/respond missing stageLabel');
  assertStagePlan(interviewRespondPayload?.stagePlan, '/api/ai-features/interview/:sessionId/respond');
  assert(interviewRespondPayload?.current_scores && typeof interviewRespondPayload.current_scores === 'object', 'interview/respond missing current_scores object');
  assert(interviewRespondPayload?.adaptive_update && typeof interviewRespondPayload.adaptive_update === 'object', 'interview/respond missing adaptive_update object');
  assert(interviewRespondPayload?.telemetry && typeof interviewRespondPayload.telemetry === 'object', 'interview/respond missing telemetry object');
  console.log('OK auth POST /api/ai-features/interview/:sessionId/respond');

  const interviewComplete = await requestJson(`/api/ai-features/interview/${sessionId}/complete`, {
    method: 'POST',
  });
  assert(
    interviewComplete.status === 200,
    `Expected 200 for /interview/${sessionId}/complete, got ${interviewComplete.status}`,
  );
  const interviewCompletePayload = resolvePayload(interviewComplete);
  assert(
    interviewCompletePayload?.status === 'completed',
    'interview/complete should mark status as completed',
  );
  assert(
    typeof interviewCompletePayload?.interview_score === 'number' || typeof interviewCompletePayload?.overall_performance === 'number',
    'interview/complete missing numeric final score fields',
  );
  console.log('OK auth POST /api/ai-features/interview/:sessionId/complete');

  const review = await requestJson('/api/ai-features/code-review', {
    method: 'POST',
    body: {
      problemId: 1,
      code: 'function twoSum(nums,target){const m=new Map();for(let i=0;i<nums.length;i++){const c=target-nums[i];if(m.has(c)) return [m.get(c),i];m.set(nums[i],i);}return [];}',
      language: 'javascript',
    },
  });
  assert(review.status === 200, `Expected 200 for /code-review, got ${review.status}`);
  console.log('OK auth POST /api/ai-features/code-review');
}

async function main() {
  try {
    console.log(`AI Features smoke target: ${BASE_URL}`);
    console.log(TOKEN ? 'Mode: AUTHENTICATED' : 'Mode: UNAUTHENTICATED');

    await runHealthCheck();
    if (TOKEN) {
      await runAuthenticatedSmoke();
    } else {
      await runUnauthenticatedSmoke();
    }

    console.log('AI Features smoke test passed.');
  } catch (error) {
    console.error(`AI Features smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
