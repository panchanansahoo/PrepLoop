import process from 'process';
import { spawn } from 'child_process';
import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

const BASE_URL = ensureLocalBaseUrl(process.env.STARTUP_TEST_BASE_URL || 'http://localhost:5000');
const HEALTH_PATH = '/health';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildLocalEndpoint(BASE_URL, path), options);
  let json;

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

async function isHealthReady() {
  try {
    const health = await requestJson(HEALTH_PATH);
    return health.status === 200 && health.json?.status === 'ok';
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs = 45000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthReady()) return true;
    await sleep(1000);
  }

  return false;
}

async function run() {
  let serverProcess = null;
  let startedServer = false;
  const serverLogs = [];

  const appendLog = (chunk, stream) => {
    const text = chunk.toString('utf8').trim();
    if (!text) return;
    serverLogs.push(`[${stream}] ${text}`);
    if (serverLogs.length > 30) serverLogs.shift();
  };

  try {
    const alreadyUp = await isHealthReady();

    if (!alreadyUp) {
      serverProcess = spawn('node', ['index.js'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
      startedServer = true;

      serverProcess.stdout.on('data', (chunk) => appendLog(chunk, 'stdout'));
      serverProcess.stderr.on('data', (chunk) => appendLog(chunk, 'stderr'));

      const ready = await waitForHealth();
      if (!ready) {
        const logTail = serverLogs.slice(-8).join('\n');
        const detail = logTail ? `\nRecent backend logs:\n${logTail}` : '';
        throw new Error(`Server failed to become healthy within timeout${detail}`);
      }
      console.log('OK startup /health reached');
    } else {
      console.log('OK existing server /health reached');
    }

    const health = await requestJson('/health');
    assert(health.status === 200, `Expected 200 for /health, got ${health.status}`);
    assert(health.json?.status === 'ok', 'Expected /health payload status=ok');

    const protectedTargets = [
      { path: '/api/interview-suite/weakness/heatmap', method: 'GET' },
      {
        path: '/api/interview-suite/company/round-simulation-flow',
        method: 'POST',
        body: {
          company: 'Google',
          role: 'SDE',
          skillLevel: 'intermediate',
        },
      },
      {
        path: '/api/interview-suite/communication/rubric-score',
        method: 'POST',
        body: {
          answer: 'I clarify assumptions, outline options, and recommend one path.',
        },
      },
      {
        path: '/api/interview-suite/resume/question-generator',
        method: 'POST',
        body: {
          company: 'Google',
          role: 'SDE',
          skillLevel: 'intermediate',
          resumeText: 'Built a scalable backend service with retries and monitoring.',
        },
      },
    ];

    for (const target of protectedTargets) {
      const result = await requestJson(target.path, {
        method: target.method,
        headers: { 'Content-Type': 'application/json' },
        body: target.body ? JSON.stringify(target.body) : undefined,
      });

      assert(
        result.status === 401,
        `Expected 401 for ${target.method} ${target.path} without token, got ${result.status}`,
      );

      console.log(`OK auth-gate ${target.method} ${target.path} -> ${result.status}`);
    }

    console.log('Startup test passed.');
  } catch (error) {
    console.error(`Startup test failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (startedServer && serverProcess) {
      serverProcess.kill('SIGTERM');
      await sleep(500);
    }
  }
}

run();
