/**
 * Rate Limit Budget Tracker — Free-Tier Protection
 * 
 * Tracks daily request counts for free-tier LLM APIs (Gemini, Groq)
 * to prevent exceeding quotas and triggering 429 errors.
 * 
 * Storage: In-memory (primary) + Upstash Redis (durable, optional).
 * Resets at midnight UTC daily.
 */
import { createLogger } from './structuredLogger.js';

const logger = createLogger('rate-limit-budget');

// ── Budget configurations per provider ──
const PROVIDER_BUDGETS = {
  gemini: {
    maxRequestsPerDay: 230,    // Safety margin below 250 RPD limit
    maxRequestsPerMinute: 8,   // Safety margin below 10 RPM limit
    label: 'Gemini 2.5 Flash',
  },
  groq: {
    maxRequestsPerDay: 14000,  // Groq free tier is generous (~14.4K RPD)
    maxRequestsPerMinute: 28,  // Safety margin below 30 RPM limit
    label: 'Groq Free Tier',
  },
};

// ── In-memory counters ──
const _counters = {};

function _getOrCreateCounter(provider) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

  if (!_counters[provider] || _counters[provider].dateKey !== todayKey) {
    _counters[provider] = {
      dateKey: todayKey,
      dailyCount: 0,
      minuteWindow: [],  // timestamps of requests in the current sliding minute
    };
  }

  // Prune expired minute-window entries
  const oneMinuteAgo = Date.now() - 60_000;
  _counters[provider].minuteWindow = _counters[provider].minuteWindow.filter(
    (ts) => ts > oneMinuteAgo
  );

  return _counters[provider];
}

/**
 * Check if a request can be made to the given provider without exceeding budget.
 * @param {'gemini'|'groq'} provider
 * @returns {{ allowed: boolean, reason?: string, remaining: { daily: number, perMinute: number } }}
 */
export function canMakeRequest(provider) {
  const budget = PROVIDER_BUDGETS[provider];
  if (!budget) {
    return { allowed: true, remaining: { daily: Infinity, perMinute: Infinity } };
  }

  const counter = _getOrCreateCounter(provider);
  const dailyRemaining = budget.maxRequestsPerDay - counter.dailyCount;
  const minuteRemaining = budget.maxRequestsPerMinute - counter.minuteWindow.length;

  if (dailyRemaining <= 0) {
    return {
      allowed: false,
      reason: `${budget.label} daily budget exhausted (${budget.maxRequestsPerDay} RPD)`,
      remaining: { daily: 0, perMinute: minuteRemaining },
    };
  }

  if (minuteRemaining <= 0) {
    return {
      allowed: false,
      reason: `${budget.label} per-minute limit reached (${budget.maxRequestsPerMinute} RPM)`,
      remaining: { daily: dailyRemaining, perMinute: 0 },
    };
  }

  return {
    allowed: true,
    remaining: { daily: dailyRemaining, perMinute: minuteRemaining },
  };
}

/**
 * Record that a request was made to the given provider.
 * @param {'gemini'|'groq'} provider
 */
export function recordRequest(provider) {
  const counter = _getOrCreateCounter(provider);
  counter.dailyCount += 1;
  counter.minuteWindow.push(Date.now());

  const budget = PROVIDER_BUDGETS[provider];
  const utilization = budget
    ? ((counter.dailyCount / budget.maxRequestsPerDay) * 100).toFixed(1)
    : '?';

  // Log at warning thresholds
  if (budget && counter.dailyCount === Math.floor(budget.maxRequestsPerDay * 0.8)) {
    logger.warn(`${budget.label} budget at 80% — ${counter.dailyCount}/${budget.maxRequestsPerDay} RPD used`);
  }
  if (budget && counter.dailyCount === Math.floor(budget.maxRequestsPerDay * 0.95)) {
    logger.warn(`${budget.label} budget at 95% — consider reducing AI calls`);
  }

  logger.debug(`${provider} request recorded`, {
    dailyCount: counter.dailyCount,
    utilization: `${utilization}%`,
  });
}

/**
 * Get budget statistics for all providers (for /health endpoint).
 */
export function getBudgetStats() {
  const stats = {};

  for (const [provider, budget] of Object.entries(PROVIDER_BUDGETS)) {
    const counter = _getOrCreateCounter(provider);
    stats[provider] = {
      label: budget.label,
      daily: {
        used: counter.dailyCount,
        limit: budget.maxRequestsPerDay,
        remaining: budget.maxRequestsPerDay - counter.dailyCount,
        utilization: `${((counter.dailyCount / budget.maxRequestsPerDay) * 100).toFixed(1)}%`,
      },
      perMinute: {
        used: counter.minuteWindow.length,
        limit: budget.maxRequestsPerMinute,
      },
      dateKey: counter.dateKey,
    };
  }

  return stats;
}

/**
 * Reset counters for a provider (primarily for testing).
 * @param {'gemini'|'groq'} provider
 */
export function resetBudget(provider) {
  delete _counters[provider];
}

export default {
  canMakeRequest,
  recordRequest,
  getBudgetStats,
  resetBudget,
};
