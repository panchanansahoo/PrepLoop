const { spawn } = require('node:child_process');

const allowedNodeEnvs = new Set(['development', 'production', 'test', 'staging']);
const currentNodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
if (!allowedNodeEnvs.has(currentNodeEnv)) {
  process.env.NODE_ENV = 'development';
}

let shuttingDown = false;
const processes = {};

function startProcess(name, command) {
  if (shuttingDown) return null;

  console.log(`[devRunner] Starting ${name}...`);
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`[${name}] process error:`, error.message);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.warn(`[${name}] process stopped (code=${code}, signal=${signal}). Restarting in 1.5s...`);
    setTimeout(() => {
      if (!shuttingDown) {
        processes[name] = startProcess(name, command);
      }
    }, 1500);
  });

  processes[name] = child;
  return child;
}

startProcess('backend', 'npm run dev --prefix backend');
startProcess('frontend', 'npm run dev --prefix frontend');

function stopAll(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[devRunner] Shutting down all processes with ${signal}...`);

  for (const [name, child] of Object.entries(processes)) {
    if (child && !child.killed) {
      try {
        child.kill(signal);
      } catch {}
    }
  }
  process.exit(0);
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

// Keep event loop active
setInterval(() => {}, 1000 * 60);
