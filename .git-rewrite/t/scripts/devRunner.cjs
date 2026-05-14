const { spawn } = require('node:child_process');

const allowedNodeEnvs = new Set(['development', 'production', 'test', 'staging']);
const currentNodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
if (!allowedNodeEnvs.has(currentNodeEnv)) {
  process.env.NODE_ENV = 'development';
}

function run(name, command) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed to start:`, error.message);
  });

  return child;
}

const backend = run('backend', 'npm run dev --prefix backend');
const frontend = run('frontend', 'npm run dev --prefix frontend');

let shuttingDown = false;

function stopAll(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!backend.killed) {
    backend.kill(signal);
  }
  if (!frontend.killed) {
    frontend.kill(signal);
  }
}

function onChildExit(name, code, signal) {
  const exitCode = code ?? (signal ? 1 : 0);
  if (!shuttingDown) {
    console.error(`[${name}] exited (code=${code}, signal=${signal})`);
    stopAll();
  }
  process.exitCode = exitCode;
}

backend.on('exit', (code, signal) => onChildExit('backend', code, signal));
frontend.on('exit', (code, signal) => onChildExit('frontend', code, signal));

process.on('SIGINT', () => {
  stopAll('SIGINT');
});

process.on('SIGTERM', () => {
  stopAll('SIGTERM');
});
