/**
 * Quota Guard & Mode Switching — Zero-Cost Architecture
 *
 * Enforces:
 *  1. Supabase Persistence:
 *     - Daily quota counters, per-model tokens, and user/IP usage persist to `quota_daily_usage`.
 *     - Reloaded on boot so host restarts / idle sleeps never reset consumed tokens to zero.
 *  2. Header-Based Synchronization:
 *     - Syncs remaining tokens directly from Groq response headers:
 *       x-ratelimit-remaining-tokens, x-ratelimit-reset-tokens, x-ratelimit-remaining-requests
 *  3. Model-Specific Limits:
 *     - Separate tracking for Groq 120b vs 20b (they have independent provider limits).
 *  4. In-Progress Interview Protection (Reserve Buffer):
 *     - Reserves the last 15% of the daily budget for active in-progress sessions and their reports.
 *     - Waitlist/Minimal mode triggers for NEW sessions first; active sessions continue cleanly.
 *  5. Shared Network (Campus/Office) Protection:
 *     - Authenticated users are capped by userId (3 interviews / 40 turns).
 *     - IPs have a high abuse ceiling (30 interviews / 300 turns) so campus Wi-Fi is never blocked.
 *     - Unauthenticated guests use a strict guest cap (2 interviews / 20 turns).
 */
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const logger = createLogger('quota-guard');

export const DEGRADATION_MODES = {
  NORMAL: 'normal',
  LITE: 'lite',
  MINIMAL: 'minimal',
  WAITLIST: 'waitlist',
};

// Daily token budget across all free tier providers (~200k tokens/day default)
export const DEFAULT_DAILY_TOKEN_BUDGET = Number(process.env.DAILY_TOKEN_BUDGET) || 200_000;

// Reserve 15% buffer exclusively for in-progress interviews and finishing reports
export const RESERVE_BUFFER_RATIO = 0.15;

// Per-user daily caps (for authenticated users)
export const MAX_USER_DAILY_INTERVIEWS = Number(process.env.MAX_USER_DAILY_INTERVIEWS) || 3;
export const MAX_USER_DAILY_TURNS = Number(process.env.MAX_USER_DAILY_TURNS) || 40;

// High abuse ceiling for shared IPs (campus/office NATs)
export const MAX_IP_DAILY_INTERVIEWS = Number(process.env.MAX_IP_DAILY_INTERVIEWS) || 30;
export const MAX_IP_DAILY_TURNS = Number(process.env.MAX_IP_DAILY_TURNS) || 300;

// Guest / unauthenticated IP cap
export const MAX_GUEST_DAILY_INTERVIEWS = Number(process.env.MAX_GUEST_DAILY_INTERVIEWS) || 2;
export const MAX_GUEST_DAILY_TURNS = Number(process.env.MAX_GUEST_DAILY_TURNS) || 20;

/**
 * Parses Groq duration strings (e.g. '1m26s', '450ms', '12.5s', '1h20m', '86400s')
 * into milliseconds.
 */
export function parseGroqDurationMs(durationStr) {
  if (!durationStr) return 0;
  if (typeof durationStr === 'number') return Math.max(0, durationStr * 1000);

  const str = String(durationStr).trim();
  if (/^\d+(?:\.\d+)?$/.test(str)) {
    return Math.round(parseFloat(str) * 1000);
  }

  let totalMs = 0;
  const hoursMatch = str.match(/(\d+(?:\.\d+)?)h/);
  const minsMatch = str.match(/(\d+(?:\.\d+)?)m(?!s)/);
  const secsMatch = str.match(/(\d+(?:\.\d+)?)s/);
  const msMatch = str.match(/(\d+(?:\.\d+)?)ms/);

  if (hoursMatch) totalMs += parseFloat(hoursMatch[1]) * 3600 * 1000;
  if (minsMatch) totalMs += parseFloat(minsMatch[1]) * 60 * 1000;
  if (secsMatch) totalMs += parseFloat(secsMatch[1]) * 1000;
  if (msMatch) totalMs += parseFloat(msMatch[1]);

  return Math.round(totalMs);
}

// Model-specific limits matching real dashboard tiers
export const MODEL_BUDGETS = {
  'llama-3.1-8b-instant': {
    provider: 'groq',
    label: 'Groq Llama 3.1 8b Instant (Fast Reply & Turn Scoring)',
    maxTokensPerDay: Number(process.env.GROQ_20B_DAILY_TOKEN_LIMIT) || 120_000,
    maxRequestsPerMinute: 30, // Real Groq dashboard limit is 30 RPM
  },
  'llama-3.3-70b-versatile': {
    provider: 'groq',
    label: 'Groq Llama 3.3 70b Versatile (Final Reports & Complex Queries)',
    maxTokensPerDay: Number(process.env.GROQ_120B_DAILY_TOKEN_LIMIT) || 50_000,
    maxRequestsPerMinute: 15,
  },
  'openai/gpt-oss-20b': {
    provider: 'groq',
    label: 'Groq 20b (Fast Reply & Turn Scoring)',
    maxTokensPerDay: Number(process.env.GROQ_20B_DAILY_TOKEN_LIMIT) || 120_000,
    maxRequestsPerMinute: 30, // Real Groq dashboard limit is 30 RPM
  },
  'openai/gpt-oss-120b': {
    provider: 'groq',
    label: 'Groq 120b (Final Reports Only)',
    maxTokensPerDay: Number(process.env.GROQ_120B_DAILY_TOKEN_LIMIT) || 50_000,
    maxRequestsPerMinute: 15,
  },
  'gemini-3.5-flash-lite': {
    provider: 'gemini',
    label: 'Google AI Studio (Gemini 3.5 Flash Lite)',
    maxTokensPerDay: Number(process.env.GEMINI_DAILY_TOKEN_LIMIT) || 50_000,
    maxRequestsPerMinute: 15, // Real Google AI Studio limit is 15 RPM
  },
  'meta-llama/llama-3.1-8b-instruct:free': {
    provider: 'openrouter',
    label: 'OpenRouter 8b:free',
    maxTokensPerDay: Number(process.env.OPENROUTER_8B_DAILY_LIMIT) || 30_000,
    maxRequestsPerMinute: 20, // Real OpenRouter free limit is 20 RPM
  },
  'meta-llama/llama-3.3-70b-instruct:free': {
    provider: 'openrouter',
    label: 'OpenRouter 70b:free',
    maxTokensPerDay: Number(process.env.OPENROUTER_70B_DAILY_LIMIT) || 30_000,
    maxRequestsPerMinute: 20, // Real OpenRouter free limit is 20 RPM
  },
  'nvidia/nemotron-3.5-lightning:free': {
    provider: 'openrouter',
    label: 'OpenRouter Nemotron:free',
    maxTokensPerDay: Number(process.env.OPENROUTER_NEMOTRON_DAILY_LIMIT) || 40_000,
    maxRequestsPerMinute: 20, // Real OpenRouter free limit is 20 RPM
  },
};

export const PROVIDER_BUDGETS = {
  groq: {
    label: 'Groq Free Tier',
    maxTokensPerDay: Number(process.env.GROQ_DAILY_TOKEN_LIMIT) || 150_000,
    maxRequestsPerMinute: 30,
  },
  gemini: {
    label: 'Google AI Studio',
    maxTokensPerDay: Number(process.env.GEMINI_DAILY_TOKEN_LIMIT) || 50_000,
    maxRequestsPerMinute: 15,
  },
  openrouter: {
    label: 'OpenRouter Free Models',
    maxTokensPerDay: Number(process.env.OPENROUTER_DAILY_TOKEN_LIMIT) || 40_000,
    maxRequestsPerMinute: 20,
  },
};

class QuotaGuard {
  constructor() {
    this.dailyBudget = DEFAULT_DAILY_TOKEN_BUDGET;
    this.currentDateKey = this._getTodayKey();
    this.totalTokensToday = 0;
    this.totalInterviewsToday = 0;
    this.totalTurnsToday = 0;

    // Model-specific usage counters
    this.modelCounters = {};
    // Provider-specific usage counters
    this.providerCounters = {};
    // Per-user tracking: Map<userId, { interviews, turns, dateKey }>
    this.userCounters = new Map();
    // Per-IP tracking: Map<ip, { interviews, turns, dateKey }>
    this.ipCounters = new Map();

    // Provider server reset telemetry: { remainingTokens, limitTokens, remainingRequests, resetTokens, resetRequests, lastSyncAt }
    this.serverRateLimitState = {};

    // Circuit breaker / failure status of providers
    this.failingProviders = new Set();
    this.failingExpiry = new Map(); // key -> expiration timestamp (ms)

    // Debounced Supabase sync timer (15s batching window prevents Supabase write exhaustion)
    this._syncTimer = null;
    this.isSyncing = false;

    // Manual test override
    this.modeOverride = null;

    this._initializeCounters();
    this.loadFromSupabase().catch((err) => {
      logger.warn('[QuotaGuard] Initial boot load from Supabase skipped:', err.message);
    });
  }

  _getTodayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  _initializeCounters() {
    for (const model of Object.keys(MODEL_BUDGETS)) {
      this.modelCounters[model] = {
        dailyTokens: 0,
        minuteWindow: [],
      };
    }
    for (const provider of Object.keys(PROVIDER_BUDGETS)) {
      this.providerCounters[provider] = {
        dailyTokens: 0,
        minuteWindow: [],
      };
    }
  }

  _checkRollover() {
    const today = this._getTodayKey();
    if (this.currentDateKey !== today) {
      logger.info(`[QuotaGuard] Daily rollover from ${this.currentDateKey} to ${today}`);
      this.currentDateKey = today;
      this.totalTokensToday = 0;
      this.totalInterviewsToday = 0;
      this.totalTurnsToday = 0;
      this._initializeCounters();
      this.userCounters.clear();
      this.ipCounters.clear();
      this.failingProviders.clear();
      this.serverRateLimitState = {};
    }
  }

  /**
   * Persists current daily quota state to Supabase Postgres.
   */
  async syncToSupabase() {
    if (!supabaseAdmin) return;
    try {
      const today = this.currentDateKey;
      const userUsageObj = {};
      for (const [k, v] of this.userCounters.entries()) {
        if (v.dateKey === today) userUsageObj[k] = { interviews: v.interviews, turns: v.turns };
      }
      const ipUsageObj = {};
      for (const [k, v] of this.ipCounters.entries()) {
        if (v.dateKey === today) ipUsageObj[k] = { interviews: v.interviews, turns: v.turns };
      }

      const modelTokensObj = {};
      for (const [k, v] of Object.entries(this.modelCounters)) {
        modelTokensObj[k] = v.dailyTokens;
      }
      const providerTokensObj = {};
      for (const [k, v] of Object.entries(this.providerCounters)) {
        providerTokensObj[k] = v.dailyTokens;
      }

      const { error } = await supabaseAdmin
        .from('quota_daily_usage')
        .upsert(
          {
            date_key: today,
            total_tokens_used: this.totalTokensToday,
            model_tokens: modelTokensObj,
            provider_tokens: providerTokensObj,
            user_usage: userUsageObj,
            ip_usage: ipUsageObj,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'date_key' }
        );
      if (error) {
        logger.warn(`[QuotaGuard] Failed to sync state to Supabase: ${error.message} (table migration may need to be applied in Supabase SQL editor)`);
      } else {
        logger.debug(`[QuotaGuard] Synced state to Supabase for ${today} (${this.totalTokensToday} tokens)`);
      }
    } catch (err) {
      logger.warn('[QuotaGuard] Failed to sync state to Supabase:', err.message);
    }
  }

  _queueSync() {
    if (this._syncTimer) return;
    this._syncTimer = setTimeout(async () => {
      this._syncTimer = null;
      await this.syncToSupabase();
    }, 15_000); // 15s batching window prevents Supabase free-tier write exhaustion
    if (this._syncTimer.unref) this._syncTimer.unref();
  }

  /**
   * Immediately flushes any queued state to Supabase without waiting for the batch timer.
   */
  async flushSync() {
    if (this._syncTimer) {
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
    }
    await this.syncToSupabase();
  }

  /**
   * Loads today's persisted counters from Supabase upon server startup/restart.
   */
  async loadFromSupabase() {
    if (!supabaseAdmin) return;
    try {
      const today = this._getTodayKey();
      const { data, error } = await supabaseAdmin
        .from('quota_daily_usage')
        .select('*')
        .eq('date_key', today)
        .single();

      if (error || !data) return;

      this.currentDateKey = today;
      this.totalTokensToday = Number(data.total_tokens_used) || 0;

      if (data.model_tokens && typeof data.model_tokens === 'object') {
        for (const [m, tokens] of Object.entries(data.model_tokens)) {
          if (!this.modelCounters[m]) this.modelCounters[m] = { dailyTokens: 0, minuteWindow: [] };
          this.modelCounters[m].dailyTokens = Number(tokens) || 0;
        }
      }

      if (data.provider_tokens && typeof data.provider_tokens === 'object') {
        for (const [p, tokens] of Object.entries(data.provider_tokens)) {
          if (!this.providerCounters[p]) this.providerCounters[p] = { dailyTokens: 0, minuteWindow: [] };
          this.providerCounters[p].dailyTokens = Number(tokens) || 0;
        }
      }

      if (data.user_usage && typeof data.user_usage === 'object') {
        for (const [u, val] of Object.entries(data.user_usage)) {
          this.userCounters.set(u, {
            interviews: val.interviews || 0,
            turns: val.turns || 0,
            dateKey: today,
          });
        }
      }

      if (data.ip_usage && typeof data.ip_usage === 'object') {
        for (const [ip, val] of Object.entries(data.ip_usage)) {
          this.ipCounters.set(ip, {
            interviews: val.interviews || 0,
            turns: val.turns || 0,
            dateKey: today,
          });
        }
      }

      logger.info(`[QuotaGuard] Successfully restored state from Supabase for ${today}: ${this.totalTokensToday} tokens loaded.`);
    } catch (err) {
      logger.warn('[QuotaGuard] Boot state restore skipped:', err.message);
    }
  }

  /**
   * Synchronizes actual remaining token and reset metrics from provider HTTP response headers.
   */
  syncProviderHeaders(provider, model, headers = {}) {
    if (!provider || !headers) return;
    this._checkRollover();

    const remainingTokens = headers['x-ratelimit-remaining-tokens'] || headers.get?.('x-ratelimit-remaining-tokens');
    const limitTokens = headers['x-ratelimit-limit-tokens'] || headers.get?.('x-ratelimit-limit-tokens');
    const resetTokens = headers['x-ratelimit-reset-tokens'] || headers.get?.('x-ratelimit-reset-tokens');
    const remainingRequests = headers['x-ratelimit-remaining-requests'] || headers.get?.('x-ratelimit-remaining-requests');
    const resetRequests = headers['x-ratelimit-reset-requests'] || headers.get?.('x-ratelimit-reset-requests');

    const resetTokensMs = parseGroqDurationMs(resetTokens);
    const resetRequestsMs = parseGroqDurationMs(resetRequests);
    const parsedRemainingTokens = remainingTokens !== null && remainingTokens !== undefined ? Number(remainingTokens) : null;

    const key = model ? `${provider}:${model}` : provider;
    this.serverRateLimitState[key] = {
      remainingTokens: parsedRemainingTokens,
      limitTokens: limitTokens ? Number(limitTokens) : null,
      resetTokensRaw: resetTokens || null,
      resetTokensMs,
      resetTokensDate: resetTokensMs ? Date.now() + resetTokensMs : null,
      remainingRequests: remainingRequests ? Number(remainingRequests) : null,
      resetRequestsRaw: resetRequests || null,
      resetRequestsMs,
      lastSyncAt: Date.now(),
    };

    // If provider server reports < 400 tokens remaining, immediately throttle model with exact reset cooldown
    if (parsedRemainingTokens !== null && parsedRemainingTokens < 400) {
      const cooldown = resetTokensMs || 60_000;
      logger.warn(`[QuotaGuard] Server header indicates critical tokens on ${key}: ${parsedRemainingTokens} remaining (resets in ${resetTokens || `${cooldown}ms`})`);
      this.markProviderFailing(key, cooldown);
      if (model) this.markProviderFailing(model, cooldown);
    }
  }

  /**
   * Calculates current degradation mode.
   * If isNewSession is true, applies the 15% reserve buffer to prevent launching sessions when budget is near exhaustion.
   */
  getCurrentMode({ isNewSession = false } = {}) {
    this._checkRollover();

    if (this.modeOverride) {
      return this.modeOverride;
    }

    const envOverride = process.env.DEGRADATION_MODE_OVERRIDE;
    if (envOverride && Object.values(DEGRADATION_MODES).includes(envOverride.toLowerCase())) {
      return envOverride.toLowerCase();
    }

    const utilization = this.totalTokensToday / this.dailyBudget;

    // Hard cap: 100% budget exhausted
    if (utilization >= 1.0) {
      return DEGRADATION_MODES.WAITLIST;
    }

    // In-Progress Protection:
    // If this is a request to START a NEW session, trigger Waitlist if within the 15% reserve buffer (utilization >= 85%)!
    if (isNewSession && utilization >= (1.0 - RESERVE_BUFFER_RATIO)) {
      return DEGRADATION_MODES.WAITLIST;
    }

    // Check if primary providers are failing
    const primaryProviders = ['groq', 'gemini', 'openrouter'];
    const allPrimariesFailing = primaryProviders.every((p) => this.isProviderFailing(p));
    if (allPrimariesFailing || utilization >= 0.90) {
      return DEGRADATION_MODES.MINIMAL;
    }

    if (utilization >= 0.60) {
      return DEGRADATION_MODES.LITE;
    }

    return DEGRADATION_MODES.NORMAL;
  }

  isSpeculationAllowed() {
    return this.getCurrentMode() === DEGRADATION_MODES.NORMAL;
  }

  getMaxHistoryTurns() {
    const mode = this.getCurrentMode();
    if (mode === DEGRADATION_MODES.NORMAL) return 4;
    return 2;
  }

  _normalizeUserArg(arg) {
    if (typeof arg === 'string') return { userId: arg, ip: null };
    return arg || {};
  }

  /**
   * Checks user cap with IP abuse ceiling protection.
   * Campus / office NAT networks are protected via high ceiling IP limits.
   */
  checkUserCap(userOrOptions = {}) {
    this._checkRollover();
    const { userId = null, ip = null } = this._normalizeUserArg(userOrOptions);
    const today = this.currentDateKey;

    // 1. Authenticated User Check (userId)
    if (userId) {
      const user = this.userCounters.get(userId);
      if (user && user.dateKey === today) {
        if (user.interviews >= MAX_USER_DAILY_INTERVIEWS) {
          return {
            allowed: false,
            reason: `Daily interview cap reached (${MAX_USER_DAILY_INTERVIEWS} per day). Check back tomorrow!`,
            interviewsRemaining: 0,
            turnsRemaining: Math.max(0, MAX_USER_DAILY_TURNS - user.turns),
          };
        }
        if (user.turns >= MAX_USER_DAILY_TURNS) {
          return {
            allowed: false,
            reason: `Daily question cap reached (${MAX_USER_DAILY_TURNS} turns per day). Check back tomorrow!`,
            interviewsRemaining: Math.max(0, MAX_USER_DAILY_INTERVIEWS - user.interviews),
            turnsRemaining: 0,
          };
        }
      }
    }

    // 2. IP Abuse Limiter (High ceiling for shared campus / corporate Wi-Fi)
    if (ip) {
      const ipEntry = this.ipCounters.get(ip);
      if (ipEntry && ipEntry.dateKey === today) {
        // If unauthenticated guest, use guest ceiling
        const maxInterviewsForIp = userId ? MAX_IP_DAILY_INTERVIEWS : MAX_GUEST_DAILY_INTERVIEWS;
        const maxTurnsForIp = userId ? MAX_IP_DAILY_TURNS : MAX_GUEST_DAILY_TURNS;

        if (ipEntry.interviews >= maxInterviewsForIp) {
          return {
            allowed: false,
            reason: userId
              ? `Shared network request threshold reached (${maxInterviewsForIp} interviews/day on this IP). Please try mobile data or retry tomorrow.`
              : `Guest interview limit reached. Sign in to access your daily candidate interview quota!`,
            interviewsRemaining: 0,
            turnsRemaining: Math.max(0, maxTurnsForIp - ipEntry.turns),
          };
        }

        if (ipEntry.turns >= maxTurnsForIp) {
          return {
            allowed: false,
            reason: userId
              ? `Shared network question threshold reached (${maxTurnsForIp} turns/day on this IP). Please try mobile data or retry tomorrow.`
              : `Guest question limit reached. Sign in to access your daily candidate question quota!`,
            interviewsRemaining: Math.max(0, maxInterviewsForIp - ipEntry.interviews),
            turnsRemaining: 0,
          };
        }
      }
    }

    const currentUser = userId ? this.userCounters.get(userId) : null;
    const interviewsUsed = (currentUser && currentUser.dateKey === today) ? currentUser.interviews : 0;
    const turnsUsed = (currentUser && currentUser.dateKey === today) ? currentUser.turns : 0;

    return {
      allowed: true,
      interviewsRemaining: Math.max(0, MAX_USER_DAILY_INTERVIEWS - interviewsUsed),
      turnsRemaining: Math.max(0, MAX_USER_DAILY_TURNS - turnsUsed),
    };
  }

  recordUserInterview(userOrOptions = {}) {
    this._checkRollover();
    this.totalInterviewsToday++;
    const { userId = null, ip = null } = this._normalizeUserArg(userOrOptions);
    const today = this.currentDateKey;

    if (userId) {
      const user = this.userCounters.get(userId) || { interviews: 0, turns: 0, dateKey: today };
      if (user.dateKey !== today) { user.interviews = 0; user.turns = 0; user.dateKey = today; }
      user.interviews++;
      this.userCounters.set(userId, user);
    }

    if (ip) {
      const ipEntry = this.ipCounters.get(ip) || { interviews: 0, turns: 0, dateKey: today };
      if (ipEntry.dateKey !== today) { ipEntry.interviews = 0; ipEntry.turns = 0; ipEntry.dateKey = today; }
      ipEntry.interviews++;
      this.ipCounters.set(ip, ipEntry);
    }

    this._queueSync();
  }

  recordUserTurn(userOrOptions = {}) {
    this._checkRollover();
    this.totalTurnsToday++;
    const { userId = null, ip = null } = this._normalizeUserArg(userOrOptions);
    const today = this.currentDateKey;

    if (userId) {
      const user = this.userCounters.get(userId) || { interviews: 0, turns: 0, dateKey: today };
      if (user.dateKey !== today) { user.interviews = 0; user.turns = 0; user.dateKey = today; }
      user.turns++;
      this.userCounters.set(userId, user);
    }

    if (ip) {
      const ipEntry = this.ipCounters.get(ip) || { interviews: 0, turns: 0, dateKey: today };
      if (ipEntry.dateKey !== today) { ipEntry.interviews = 0; ipEntry.turns = 0; ipEntry.dateKey = today; }
      ipEntry.turns++;
      this.ipCounters.set(ip, ipEntry);
    }

    this._queueSync();
  }

  canUseModel(model, estimatedTokens = 400) {
    this._checkRollover();
    const budget = MODEL_BUDGETS[model];
    if (!budget) return { allowed: true };

    const providerKey = budget.provider;
    const providerCheck = this.canUseProvider(providerKey, estimatedTokens);
    if (!providerCheck.allowed) {
      return providerCheck;
    }

    const combinedKey = `${providerKey}:${model}`;
    if (
      this.isProviderFailing(providerKey) ||
      this.isProviderFailing(model) ||
      this.isProviderFailing(combinedKey)
    ) {
      return { allowed: false, reason: `${model} is currently in failure cooldown` };
    }

    const serverState = this.serverRateLimitState[combinedKey] || this.serverRateLimitState[model];
    if (serverState && typeof serverState.remainingTokens === 'number' && serverState.remainingTokens < estimatedTokens) {
      return {
        allowed: false,
        reason: `${model} server rate limit header indicates only ${serverState.remainingTokens} tokens remaining (resets in ${serverState.resetTokens || 'soon'})`,
      };
    }

    const counter = this.modelCounters[model] || { dailyTokens: 0, minuteWindow: [] };
    const oneMinuteAgo = Date.now() - 60_000;
    counter.minuteWindow = counter.minuteWindow.filter((ts) => ts > oneMinuteAgo);

    if (counter.dailyTokens + estimatedTokens > budget.maxTokensPerDay) {
      return { allowed: false, reason: `${budget.label} daily token limit (${budget.maxTokensPerDay}) reached` };
    }

    if (counter.minuteWindow.length >= budget.maxRequestsPerMinute) {
      return { allowed: false, reason: `${budget.label} per-minute limit (${budget.maxRequestsPerMinute} RPM) reached` };
    }

    return { allowed: true };
  }

  canUseProvider(provider, estimatedTokens = 400) {
    this._checkRollover();
    const budget = PROVIDER_BUDGETS[provider];
    if (!budget) return { allowed: true, reason: 'unmetered' };

    if (this.isProviderFailing(provider)) {
      return { allowed: false, reason: `${provider} is currently in failure cooldown` };
    }

    const counter = this.providerCounters[provider] || { dailyTokens: 0, minuteWindow: [] };
    const oneMinuteAgo = Date.now() - 60_000;
    counter.minuteWindow = counter.minuteWindow.filter((ts) => ts > oneMinuteAgo);

    if (counter.dailyTokens + estimatedTokens > budget.maxTokensPerDay) {
      return { allowed: false, reason: `${budget.label} daily token limit exceeded` };
    }

    if (counter.minuteWindow.length >= budget.maxRequestsPerMinute) {
      return { allowed: false, reason: `${budget.label} per-minute limit reached` };
    }

    return { allowed: true };
  }

  recordUsage({ provider, model, promptTokens = 0, completionTokens = 0, totalTokens = null, userId = null, ip = null }) {
    this._checkRollover();
    const sumTokens = promptTokens + completionTokens;
    const consumed = totalTokens ?? (sumTokens > 0 ? sumTokens : 350);

    this.totalTokensToday += consumed;

    if (model) {
      if (!this.modelCounters[model]) this.modelCounters[model] = { dailyTokens: 0, minuteWindow: [] };
      this.modelCounters[model].dailyTokens += consumed;
      this.modelCounters[model].minuteWindow.push(Date.now());
      this.clearProviderFailure(model);
    }

    if (provider) {
      if (!this.providerCounters[provider]) this.providerCounters[provider] = { dailyTokens: 0, minuteWindow: [] };
      this.providerCounters[provider].dailyTokens += consumed;
      this.providerCounters[provider].minuteWindow.push(Date.now());
      this.clearProviderFailure(provider);
    }

    if (userId || ip) {
      this.recordUserTurn({ userId, ip });
    }

    this._queueSync();

    const mode = this.getCurrentMode();
    const pct = ((this.totalTokensToday / this.dailyBudget) * 100).toFixed(1);
    logger.debug(`[QuotaGuard] Recorded ${consumed} tokens (${provider}:${model}). Total: ${this.totalTokensToday}/${this.dailyBudget} (${pct}%) Mode: ${mode}`);
  }

  markProviderFailing(key, cooldownMs = null) {
    if (key) {
      this.failingProviders.add(key);
      const expiry = cooldownMs ? Date.now() + cooldownMs : Date.now() + 60_000;
      this.failingExpiry.set(key, expiry);
      logger.warn(`[QuotaGuard] Provider/Model ${key} marked failing / rate-limited (cooldown until ${new Date(expiry).toISOString()})`);
    }
  }

  isProviderFailing(key) {
    if (!key || !this.failingProviders.has(key)) return false;
    const expiry = this.failingExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.failingProviders.delete(key);
      this.failingExpiry.delete(key);
      logger.info(`[QuotaGuard] Provider/Model ${key} cooldown expired, restoring`);
      return false;
    }
    return true;
  }

  clearProviderFailure(key) {
    if (key) {
      this.failingProviders.delete(key);
      this.failingExpiry.delete(key);
    }
  }

  getStatus() {
    this._checkRollover();
    const mode = this.getCurrentMode();
    const utilizationPct = Math.min(100, Number(((this.totalTokensToday / this.dailyBudget) * 100).toFixed(1)));
    const remainingTokens = Math.max(0, this.dailyBudget - this.totalTokensToday);

    const modelStats = {};
    for (const [key, cfg] of Object.entries(MODEL_BUDGETS)) {
      const ctr = this.modelCounters[key] || { dailyTokens: 0, minuteWindow: [] };
      modelStats[key] = {
        label: cfg.label,
        usedTokens: ctr.dailyTokens,
        maxTokens: cfg.maxTokensPerDay,
        activeRpm: ctr.minuteWindow.length,
        maxRpm: cfg.maxRequestsPerMinute,
        isFailing: this.failingProviders.has(key) || this.failingProviders.has(cfg.provider),
      };
    }

    return {
      mode,
      dateKey: this.currentDateKey,
      totalTokensToday: this.totalTokensToday,
      dailyBudget: this.dailyBudget,
      remainingTokens,
      utilizationPct,
      reserveBufferActive: utilizationPct >= (1.0 - RESERVE_BUFFER_RATIO) * 100,
      speculationAllowed: this.isSpeculationAllowed(),
      maxHistoryTurns: this.getMaxHistoryTurns(),
      candidateDataNotice: 'Candidate Privacy: Speech processed via browser speech vendors or Groq Whisper. AI evaluation uses best-effort redaction. Session recordings deleted after 14 days.',
      models: modelStats,
      serverRateLimitState: this.serverRateLimitState,
      userCapConfig: {
        maxInterviewsPerUser: MAX_USER_DAILY_INTERVIEWS,
        maxTurnsPerUser: MAX_USER_DAILY_TURNS,
        maxInterviewsPerIp: MAX_IP_DAILY_INTERVIEWS,
        maxTurnsPerIp: MAX_IP_DAILY_TURNS,
      },
    };
  }

  reset() {
    this.currentDateKey = this._getTodayKey();
    this.totalTokensToday = 0;
    this.totalInterviewsToday = 0;
    this.totalTurnsToday = 0;
    this._initializeCounters();
    this.userCounters.clear();
    this.ipCounters.clear();
    this.failingProviders.clear();
    this.failingExpiry.clear();
    this.serverRateLimitState = {};
    this.modeOverride = null;
  }
}

export const quotaGuard = new QuotaGuard();

/**
 * Express middleware to enforce daily quota limits on AI routes.
 */
export function createQuotaMiddleware(options = {}) {
  return function quotaMiddleware(req, res, next) {
    const userId = req.user?.id || req.user?.userId || null;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const isNewSession = Boolean(req.body?.isNewSession || options.isNewSession);

    const capCheck = quotaGuard.checkUserCap({ userId, ip });
    if (!capCheck.allowed) {
      const isTurnExhausted = capCheck.turnsRemaining === 0;
      return res.status(429).json({
        error: isTurnExhausted ? 'Daily AI turn quota reached' : 'Daily interview quota reached',
        code: isTurnExhausted ? 'TURN_QUOTA_EXCEEDED' : 'QUOTA_EXCEEDED',
        reason: capCheck.reason,
        mode: quotaGuard.getCurrentMode({ isNewSession }),
        cap: capCheck,
      });
    }

    req.quotaMode = quotaGuard.getCurrentMode({ isNewSession });
    next();
  };
}

export default quotaGuard;
