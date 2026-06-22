import process from 'process';
import assert from 'assert';
import { resolveLocalBaseUrl } from './utils/resolveBaseUrl.js';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

let BASE_URL = ensureLocalBaseUrl(process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000');
const TOKEN = process.env.INTERVIEW_SUITE_SMOKE_TOKEN || '';

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

  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

async function runUnauthenticatedSmoke() {
  // Try to create an interview session without token
  const sessionFail = await requestJson('/api/company-interview/save-session', {
    method: 'POST',
    body: { type: 'dsa', context: {} }
  });
  
  assert(sessionFail.status === 401 || sessionFail.status === 403, `Expected 401/403 for unauth session save, got ${sessionFail.status}`);
  console.log('OK unauth POST /api/company-interview/save-session -> 401');
  
  const interactionFail = await requestJson('/api/company-interview/sessions/invalid_id', {
    method: 'GET'
  });
  assert(interactionFail.status === 401 || interactionFail.status === 403, `Expected 401/403 for unauth interaction, got ${interactionFail.status}`);
  console.log('OK unauth GET /api/company-interview/sessions/invalid_id -> 401');
}

async function main() {
  try {
    BASE_URL = ensureLocalBaseUrl(await resolveLocalBaseUrl({
      envVarName: 'INTERVIEW_SUITE_BASE_URL',
      fallback: BASE_URL,
    }));
    console.log(`Interview Flows smoke test target: ${BASE_URL}`);

    // Verify /health works
    const health = await requestJson('/health');
    assert(health.status === 200, `Expected 200 for /health, got ${health.status}`);

    // If we have a token, we could run auth flows here. For CI, we generally test unauth boundary validation.
    if (!TOKEN) {
      await runUnauthenticatedSmoke();
    } else {
      console.log('Skipping advanced mock tests as auth token provided (real backend test mode).');
    }

    console.log('Interview Flows smoke test passed.');
  } catch (error) {
    console.error(`Interview Flows smoke test failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
