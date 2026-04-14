import process from 'process';
import { spawn } from 'child_process';
import { fileURLToPath, URL } from 'url';
import path from 'path';
import { isHealthReady, resolveLocalBaseUrl } from './utils/resolveBaseUrl.js';

const DEFAULT_BASE_URL = process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(SCRIPT_DIR, '..');
const SMOKE_SCRIPT_PATH = path.resolve(SCRIPT_DIR, 'smokeInterviewSuite.js');
const BACKEND_ENTRY_PATH = path.resolve(BACKEND_ROOT, 'index.js');

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

async function waitForHealth(baseUrl, timeoutMs = 45000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await isHealthReady(baseUrl)) return true;
    await sleep(1000);
  }

  return false;
}

function runSmokeScript(baseUrl) {
  return new Promise((resolve, reject) => {
    const childEnv = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PATH: process.env.PATH || '',
      SystemRoot: process.env.SystemRoot || '',
      COMSPEC: process.env.COMSPEC || '',
      PATHEXT: process.env.PATHEXT || '',
      HOME: process.env.HOME || process.env.USERPROFILE || '',
      USERPROFILE: process.env.USERPROFILE || '',
      TEMP: process.env.TEMP || '',
      TMP: process.env.TMP || '',
      INTERVIEW_SUITE_BASE_URL: baseUrl,
    };

    const child = spawn('node', [SMOKE_SCRIPT_PATH], {
      cwd: BACKEND_ROOT,
      stdio: 'inherit',
      shell: false,
      env: childEnv,
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

async function resolveBaseUrl() {
  return resolveLocalBaseUrl({
    envVarName: 'INTERVIEW_SUITE_BASE_URL',
    fallback: DEFAULT_BASE_URL,
  });
}

async function main() {
  let serverProcess = null;
  let startedServer = false;
  const serverLogs = [];
  let baseUrl = DEFAULT_BASE_URL;

  const appendLog = (chunk, stream) => {
    const text = chunk.toString('utf8').trim();
    if (!text) return;
    serverLogs.push(`[${stream}] ${text}`);
    if (serverLogs.length > 30) serverLogs.shift();
  };

  try {
    baseUrl = await resolveBaseUrl();
    const healthy = await isHealthReady(baseUrl);
    if (!healthy && isLocalBaseUrl(baseUrl)) {
      serverProcess = spawn('node', [BACKEND_ENTRY_PATH], {
        cwd: BACKEND_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
      startedServer = true;

      serverProcess.stdout.on('data', (chunk) => appendLog(chunk, 'stdout'));
      serverProcess.stderr.on('data', (chunk) => appendLog(chunk, 'stderr'));

      const ready = await waitForHealth(baseUrl);
      if (!ready) {
        const logTail = serverLogs.slice(-8).join('\n');
        const detail = logTail ? `\nRecent backend logs:\n${logTail}` : '';
        throw new Error(`Backend did not become healthy in time.${detail}`);
      }

      console.log('Local smoke helper started backend server.');
    } else if (!healthy && !isLocalBaseUrl(baseUrl)) {
      throw new Error(`Backend is not healthy at ${baseUrl}. Auto-start is only supported for localhost.`);
    } else {
      console.log(`Using existing running backend server at ${baseUrl}.`);
    }

    await runSmokeScript(baseUrl);
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
