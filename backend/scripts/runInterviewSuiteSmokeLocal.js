import process from 'process';
import { spawn } from 'child_process';
import { URL } from 'url';

const BASE_URL = process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000';

function isLocalBaseUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  let json = null;

  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

async function isHealthReady() {
  try {
    const health = await requestJson('/health');
    return health.status === 200 && health.json?.status === 'ok';
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs = 45000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await isHealthReady()) return true;
    await sleep(1000);
  }

  return false;
}

function runSmokeScript() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/smokeInterviewSuite.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`smoke script exited with code ${code}`));
      }
    });
  });
}

async function main() {
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
    const healthy = await isHealthReady();
    if (!healthy && isLocalBaseUrl(BASE_URL)) {
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
        throw new Error(`Backend did not become healthy in time.${detail}`);
      }

      console.log('Local smoke helper started backend server.');
    } else if (!healthy && !isLocalBaseUrl(BASE_URL)) {
      throw new Error(`Backend is not healthy at ${BASE_URL}. Auto-start is only supported for localhost.`);
    } else {
      console.log('Using existing running backend server.');
    }

    await runSmokeScript();
    console.log('Local Interview Suite smoke passed.');
  } catch (error) {
    console.error(`Local Interview Suite smoke failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (startedServer && serverProcess) {
      serverProcess.kill('SIGTERM');
      await sleep(500);
    }
  }
}

main();
