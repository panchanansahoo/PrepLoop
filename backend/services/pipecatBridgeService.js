import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Pipecat-Bridge-Service');
const activeSessions = new Map();
const activeBotProcesses = new Map();

const FULL_REALTIME_MODE = 'full_realtime';
const DEFAULT_SESSION_TTL_MINUTES = Number.parseInt(process.env.PIPECAT_SESSION_TTL_MINUTES || '30', 10);
const BOT_BASE_PORT = Number.parseInt(process.env.PIPECAT_BOT_BASE_PORT || '7860', 10);

const isExpired = (session) => {
  if (!session?.expiresAt) return false;
  return Date.now() >= new Date(session.expiresAt).getTime();
};

/**
 * Find an available port for a new bot instance.
 * Cycles through BOT_BASE_PORT + offset based on active sessions.
 */
const getNextPort = () => {
  const usedPorts = new Set([...activeBotProcesses.values()].map(p => p.port));
  for (let offset = 0; offset < 100; offset++) {
    const port = BOT_BASE_PORT + offset;
    if (!usedPorts.has(port)) return port;
  }
  return BOT_BASE_PORT + activeBotProcesses.size;
};

/**
 * Spawn the Python Pipecat bot process for a session.
 */
const spawnBot = (sessionId, port, config) => {
  const pythonPath = process.env.PIPECAT_PYTHON_PATH || 'python';
  const botScript = new URL('../../pipecat-bot/bot.py', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

  const configJson = JSON.stringify(config);

  logger.info('Spawning Pipecat bot', { sessionId, port, pythonPath, botScript });

  const child = spawn(pythonPath, [
    botScript,
    '--port', String(port),
    '--session-id', sessionId,
    '--config', configJson,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    windowsHide: true,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      logger.info(`[Bot:${sessionId.slice(0, 8)}] ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      logger.warn(`[Bot:${sessionId.slice(0, 8)}] ${line}`);
    }
  });

  child.on('exit', (code) => {
    logger.info(`Bot process exited`, { sessionId, code });
    activeBotProcesses.delete(sessionId);
  });

  child.on('error', (err) => {
    logger.error(`Bot process error`, { sessionId, error: err.message });
    activeBotProcesses.delete(sessionId);
  });

  activeBotProcesses.set(sessionId, { process: child, port, startedAt: Date.now() });
  return { pid: child.pid, port };
};

/**
 * Kill a running bot process.
 */
const killBot = (sessionId) => {
  const bot = activeBotProcesses.get(sessionId);
  if (!bot) return false;

  try {
    bot.process.kill('SIGTERM');
    // Force kill after 5 seconds
    setTimeout(() => {
      try { bot.process.kill('SIGKILL'); } catch { /* already dead */ }
    }, 5000);
  } catch (err) {
    logger.warn('Error killing bot process', { sessionId, error: err.message });
  }

  activeBotProcesses.delete(sessionId);
  return true;
};

export class PipecatBridgeService {
  /**
   * Create a new Pipecat session and spawn the bot process.
   */
  static createSession({
    userId,
    interviewMode,
    interviewSessionId = null,
    interviewType = null,
    difficulty = null,
    requestId = null,
    company = null,
    role = null,
    stage = null,
    interviewerName = null,
    interviewerRole = null,
    gender = null,
    interviewerPersona = null,
    experienceLevel = null,
    totalQuestions = 6,
    questions = [],
    systemPromptOverride = null,
  }) {
    if (interviewMode !== FULL_REALTIME_MODE) {
      return {
        success: false,
        status: 'mode_not_supported',
        message: 'Pipecat bridge sessions are only available for full_realtime mode.',
      };
    }

    const sessionId = randomUUID();
    const port = getNextPort();
    const ttlMinutes = Number.isFinite(DEFAULT_SESSION_TTL_MINUTES) ? DEFAULT_SESSION_TTL_MINUTES : 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    // Build config for the Python bot
    const botConfig = {
      company: company || 'Google',
      role: role || 'Software Engineer',
      stage: stage || 'Technical',
      interviewerName: interviewerName || 'Ryan Mitchell',
      interviewerRole: interviewerRole || 'Senior Software Engineer',
      difficulty: difficulty || 'medium',
      experienceLevel: experienceLevel || 'mid',
      gender: gender || 'male',
      interviewerPersona: interviewerPersona || 'auto',
      totalQuestions,
      questions,
    };

    // Spawn the bot process
    let botInfo;
    try {
      botInfo = spawnBot(sessionId, port, botConfig);
    } catch (err) {
      logger.error('Failed to spawn bot', { sessionId, error: err.message });
      return {
        success: false,
        status: 'bot_spawn_failed',
        message: `Failed to start Pipecat bot: ${err.message}`,
      };
    }

    const websocketUrl = `ws://localhost:${port}/ws`;

    const session = {
      sessionId,
      userId,
      interviewMode,
      interviewSessionId,
      interviewType,
      difficulty,
      status: 'bot_running',
      transport: 'websocket',
      websocketUrl,
      botPort: port,
      botPid: botInfo.pid,
      expiresAt,
      createdAt: new Date().toISOString(),
      runtime: {
        mode: FULL_REALTIME_MODE,
        realtime: true,
        strategy: 'pipecat_realtime',
        transport: 'websocket',
        bridgeConfigured: true,
        targetFirstAudioMs: 800,
      },
      requestId,
    };

    activeSessions.set(sessionId, session);

    logger.info('Created Pipecat session with bot', {
      sessionId,
      userId,
      port,
      pid: botInfo.pid,
    });

    return {
      success: true,
      ...session,
    };
  }

  static getSession(sessionId, userId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // If session is a guest session and requester has no userId, allow it
    const isGuestSession = String(session.userId).startsWith('guest-');
    if (isGuestSession && !userId) {
      return session;
    }

    if (String(session.userId) !== String(userId)) {
      return null;
    }

    if (isExpired(session)) {
      this.closeSession(sessionId, userId);
      return null;
    }

    return session;
  }

  static closeSession(sessionId, userId) {
    const session = activeSessions.get(sessionId);
    if (!session) return false;

    const isGuestSession = String(session.userId).startsWith('guest-');
    if (userId && !isGuestSession && String(session.userId) !== String(userId)) {
      return false;
    }

    // Kill the bot process
    killBot(sessionId);
    activeSessions.delete(sessionId);

    logger.info('Closed Pipecat session', { sessionId });
    return true;
  }

  static health() {
    // Check if Python is available
    const pythonPath = process.env.PIPECAT_PYTHON_PATH || 'python';

    return {
      configured: true,
      pythonPath,
      activeSessionCount: activeSessions.size,
      activeBotCount: activeBotProcesses.size,
      sessionTtlMinutes: Number.isFinite(DEFAULT_SESSION_TTL_MINUTES) ? DEFAULT_SESSION_TTL_MINUTES : 30,
      modeSupport: [FULL_REALTIME_MODE],
      basePort: BOT_BASE_PORT,
    };
  }

  /**
   * Check if Python + pipecat-ai are available.
   */
  static async checkPythonAvailability() {
    const pythonPath = process.env.PIPECAT_PYTHON_PATH || 'python';
    return new Promise((resolve) => {
      const child = spawn(pythonPath, ['-c', 'import pipecat; print("ok")'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
        windowsHide: true,
      });

      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.on('exit', (code) => {
        resolve({
          available: code === 0 && output.trim() === 'ok',
          pythonPath,
        });
      });
      child.on('error', () => {
        resolve({ available: false, pythonPath, error: 'Python not found' });
      });
    });
  }
}
