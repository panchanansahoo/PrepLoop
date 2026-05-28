import process from 'process';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

const BASE_URL = ensureLocalBaseUrl(process.env.DSA_SMOKE_BASE_URL || 'http://localhost:5000');
const TOKEN = process.env.DSA_SMOKE_TOKEN || process.env.TEST_AUTH_TOKEN || '';

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

  return { status: response.status, ok: response.ok, json };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function checkLegacyProblemResolution() {
  const legacy = await requestJson('/api/dsa/problems/1');
  assert(legacy.status === 200, `Expected 200 for /api/dsa/problems/1, got ${legacy.status}`);
  assert(legacy.json?.problem?.title, 'Legacy response missing problem.title');

  const canonical = await requestJson('/api/dsa/problems/two-sum');
  assert(
    canonical.status === 200,
    `Expected 200 for /api/dsa/problems/two-sum, got ${canonical.status}`
  );
  assert(canonical.json?.problem?.title, 'Canonical response missing problem.title');

  const legacyTitle = String(legacy.json.problem.title).trim().toLowerCase();
  const canonicalTitle = String(canonical.json.problem.title).trim().toLowerCase();
  assert(
    legacyTitle === canonicalTitle,
    `Legacy and canonical problem mismatch: ${legacy.json.problem.title} vs ${canonical.json.problem.title}`
  );

  console.log('OK /api/dsa/problems/1 resolves to canonical problem data');
}

async function checkUnauthenticatedPracticeRunIsProtected() {
  const runResult = await requestJson('/api/practice/run', {
    method: 'POST',
    body: {
      problemId: 1,
      language: 'python',
      code: 'print("hello")',
    },
  });

  assert(
    runResult.status === 401,
    `Expected 401 for unauthenticated /api/practice/run, got ${runResult.status}`
  );
  console.log('OK unauth POST /api/practice/run -> 401');
}

async function checkPracticeRunForLegacyId() {
  const pythonTwoSum = [
    'class Solution:',
    '    def twoSum(self, nums, target):',
    '        seen = {}',
    '        for i, n in enumerate(nums):',
    '            diff = target - n',
    '            if diff in seen:',
    '                return [seen[diff], i]',
    '            seen[n] = i',
    '        return []',
  ].join('\n');

  const runResult = await requestJson('/api/practice/run', {
    method: 'POST',
    body: {
      problemId: 1,
      language: 'python',
      code: pythonTwoSum,
    },
  });

  assert(runResult.status === 200, `Expected 200 for /api/practice/run, got ${runResult.status}`);
  assert(runResult.json?.success === true, 'Expected success=true from /api/practice/run');
  assert(typeof runResult.json?.passed === 'number', 'Expected numeric passed count');
  assert(typeof runResult.json?.total === 'number', 'Expected numeric total count');
  assert(
    runResult.json.passed === runResult.json.total,
    `Expected all tests to pass, got ${runResult.json.passed}/${runResult.json.total}`
  );

  const payloadText = JSON.stringify(runResult.json);
  assert(
    !payloadText.includes('takes 2 positional arguments but 3 were given'),
    'Detected Python signature mismatch regression in /api/practice/run output'
  );

  console.log(
    'OK /api/practice/run works with legacy problemId=1 and Python Solution.twoSum signature'
  );
}

async function main() {
  try {
    console.log(`DSA code-editor smoke target: ${BASE_URL}`);
    console.log(TOKEN ? 'Mode: AUTHENTICATED' : 'Mode: UNAUTHENTICATED');

    // Pre-flight: verify the backend is actually responding
    const healthCheck = await fetch(buildLocalEndpoint(BASE_URL, '/health'));
    assert(healthCheck.ok, `Backend health check failed with status ${healthCheck.status}`);
    console.log('OK /health is responsive');

    // Check if we're running against a real Supabase or the CI placeholder
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const isCIPlaceholder = !supabaseUrl || supabaseUrl.includes('example.supabase.co');

    if (isCIPlaceholder) {
      console.log('SKIP DB-dependent checks (SUPABASE_URL is a CI placeholder)');
      console.log('DSA code-editor smoke test passed (health-only mode).');
      return;
    }

    await checkLegacyProblemResolution();
    if (TOKEN) {
      await checkPracticeRunForLegacyId();
    } else {
      await checkUnauthenticatedPracticeRunIsProtected();
    }
    console.log('DSA code-editor smoke test passed.');
  } catch (error) {
    console.error(`DSA code-editor smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();

