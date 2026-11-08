/**
 * Multi-Provider LLM Router — Zero-Cost Architecture
 *
 * Implements:
 *  1. Header-Calibrated Rate Limiting:
 *     - Reads `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-tokens`, and `x-ratelimit-remaining-requests`
 *       directly from provider response headers to continuously calibrate the Quota Guard.
 *  2. Model-Specific Tracking:
 *     - 120b and 20b are metered independently, not pooled.
 *  3. Provider Verification:
 *     - Groq: gpt-oss-20b (fast reply & scoring) and gpt-oss-120b (reports).
 *     - Google AI Studio: gemini-3.5-flash-lite without thinking token overhead.
 *     - OpenRouter: meta-llama/llama-3.1-8b-instruct:free & meta-llama/llama-3.3-70b-instruct:free.
 *  4. Free-Tier PII Sanitization:
 *     - Anonymizes candidate names, emails, phone numbers, and sensitive resume snippets before
 *       dispatching to free-tier cloud endpoints.
 *  5. Truncation and Parse-Failure Observability:
 *     - 260 max_tokens headroom for scoring; tracks JSON truncation & parse failure metrics.
 *  6. Candidate Notification:
 *     - Transparently informs the candidate when transitioning to scripted questions in Minimal mode.
 */
import { aiCallWithRetry } from '../utils/aiClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { quotaGuard, DEGRADATION_MODES } from './quotaGuard.js';
import { deferredJobQueue } from './deferredJobQueue.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import {
  createOpenRouterChatCompletion,
  isOpenRouterAvailable,
  OPENROUTER_MODELS,
  stripReasoningTokens,
} from './openRouterService.js';
import { clampToTwoSentences, deterministicPick, safeJsonParse } from '../routes/company-interview/helpers.js';
import { verifyEvidenceQuote, stripAttributionPhrase, getGenericFollowUp } from '../utils/technicalPronunciation.js';

const logger = createLogger('llm-router');

// ── Models ──
export const ROUTER_MODELS = {
  GROQ_20B: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b',
  GROQ_120B: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  GEMINI_FLASH: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  OPENROUTER_8B: OPENROUTER_MODELS.LLAMA_8B_FREE,
  OPENROUTER_70B: OPENROUTER_MODELS.LLAMA_70B_FREE,
};

// Telemetry metrics for parsing, truncation, and fast-reply latency distribution
export const routerMetrics = {
  jsonParseSuccessCount: 0,
  jsonParseFailureCount: 0,
  truncationCount: 0,
  fastReplyLatencies: [],
};

export function recordFastReplyLatency(latencyMs) {
  if (typeof latencyMs === 'number' && latencyMs > 0) {
    routerMetrics.fastReplyLatencies.push(latencyMs);
    if (routerMetrics.fastReplyLatencies.length > 500) {
      routerMetrics.fastReplyLatencies.shift();
    }
  }
}

export function getFastReplyLatencyStats() {
  const l = routerMetrics.fastReplyLatencies;
  if (!l || l.length === 0) return { p50: 0, p95: 0, count: 0 };
  const sorted = [...l].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    count: sorted.length,
  };
}

// Google AI Studio client (dynamic import to remain safe across environments)
let geminiClient = null;
async function getGeminiClient() {
  if (geminiClient) return geminiClient;
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const mod = await import('@google/genai').catch(() => null) ||
                await import('@google/generative-ai').catch(() => null);
    const GoogleGenAI = mod?.GoogleGenAI || mod?.default?.GoogleGenAI || mod?.default;
    if (GoogleGenAI) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  } catch (err) {
    logger.warn('[LLM Router] Failed to initialize Gemini client:', err.message);
  }
  return geminiClient;
}

// Technical keywords and computing concepts protected from accidental name redaction
export const TECHNICAL_WHITELIST = new Set([
  'redis', 'raft', 'paxos', 'kafka', 'zookeeper', 'kraft', 'docker', 'kubernetes', 'k8s',
  'postgres', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'cassandra', 'dynamodb', 'couchdb',
  'react', 'angular', 'vue', 'svelte', 'next', 'nuxt', 'vite', 'webpack', 'babel',
  'node', 'nodejs', 'deno', 'bun', 'express', 'fastify', 'nestjs', 'spring', 'springboot',
  'django', 'flask', 'fastapi', 'rails', 'laravel', 'gin', 'echo', 'actix',
  'python', 'java', 'golang', 'rust', 'c++', 'c#', 'ruby', 'php', 'typescript', 'javascript',
  'aws', 'gcp', 'azure', 'lambda', 'ec2', 's3', 'ecs', 'eks', 'cloudrun', 'bigquery',
  'graphql', 'grpc', 'rest', 'soap', 'websocket', 'webrtc', 'tcp', 'udp', 'http', 'https',
  'oauth', 'jwt', 'saml', 'oidc', 'cors', 'csrf', 'tls', 'ssl',
  'b-tree', 'btree', 'lsm', 'acid', 'base', 'cap', 'mvcc', 'bloom', 'star',
  'linux', 'unix', 'ubuntu', 'debian', 'centos', 'alpine', 'windows', 'macos',
  'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'jenkins', 'argo', 'terraform', 'ansible'
]);

// Session-pinned scorers: Map<sessionId, { provider: 'groq'|'gemini'|'openrouter', model: string, pinnedAt: number }>
export const sessionScorers = new Map();

export function getSessionScorer(sessionId) {
  if (!sessionId) return null;
  return sessionScorers.get(sessionId) || null;
}

/**
 * Persists pinned scorer to in-memory map AND Supabase (session_pinned_scorers table & interview_sessions row)
 * so cold process restarts never reset the assigned scoring model.
 */
export function setSessionScorer(sessionId, provider, model) {
  if (!sessionId) return;
  const entry = { provider, model, pinnedAt: Date.now() };
  sessionScorers.set(sessionId, entry);

  if (supabaseAdmin) {
    Promise.allSettled([
      // 1. Standalone table for rapid session scorer lookup
      supabaseAdmin
        .from('session_pinned_scorers')
        .upsert(
          {
            session_id: sessionId,
            provider,
            model,
            pinned_at: new Date(entry.pinnedAt).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id' }
        ),
      // 2. Persist in interview_sessions row so session row maintains model attribution
      supabaseAdmin
        .from('interview_sessions')
        .update({
          pinned_scorer: entry,
          ai_model_version: `${provider}:${model}`,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId),
    ]).catch((err) => {
      logger.warn('[LLM Router] Supabase session scorer persist skipped:', err.message);
    });
  }
}

/**
 * Loads session-pinned scorer from Supabase on cold start / restart.
 */
export async function loadSessionScorer(sessionId) {
  if (!sessionId) return null;
  if (sessionScorers.has(sessionId)) return sessionScorers.get(sessionId);
  if (!supabaseAdmin) return null;

  try {
    // 1. Check session_pinned_scorers table
    const { data: standalone } = await supabaseAdmin
      .from('session_pinned_scorers')
      .select('provider, model, pinned_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (standalone?.provider && standalone?.model) {
      const entry = {
        provider: standalone.provider,
        model: standalone.model,
        pinnedAt: standalone.pinned_at ? new Date(standalone.pinned_at).getTime() : Date.now(),
      };
      sessionScorers.set(sessionId, entry);
      return entry;
    }

    // 2. Fallback check on interview_sessions row
    const { data: sessRow } = await supabaseAdmin
      .from('interview_sessions')
      .select('pinned_scorer, ai_model_version')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessRow?.pinned_scorer?.provider && sessRow?.pinned_scorer?.model) {
      const entry = {
        provider: sessRow.pinned_scorer.provider,
        model: sessRow.pinned_scorer.model,
        pinnedAt: sessRow.pinned_scorer.pinnedAt || Date.now(),
      };
      sessionScorers.set(sessionId, entry);
      return entry;
    }

    if (sessRow?.ai_model_version && sessRow.ai_model_version.includes(':')) {
      const [prov, mod] = sessRow.ai_model_version.split(':');
      const entry = { provider: prov, model: mod, pinnedAt: Date.now() };
      sessionScorers.set(sessionId, entry);
      return entry;
    }
  } catch (err) {
    logger.warn('[LLM Router] Failed to load session scorer from Supabase:', err.message);
  }
  return null;
}

/**
 * Load spreading: distributes new candidate sessions between Groq 20b and Google AI Studio (Gemini).
 * Prevents Groq 20b RPM exhaustion by sharing candidate load across healthy free providers.
 */
export function selectInitialScorer(sessionId) {
  if (sessionId && sessionId.includes('gemini')) return 'gemini';
  if (sessionId && sessionId.includes('groq')) return 'groq';

  // If Groq is down or in rate-limit cooldown, route directly to Gemini
  const groqOk = quotaGuard.canUseModel(ROUTER_MODELS.GROQ_20B, 400).allowed;
  const geminiOk = Boolean(process.env.GEMINI_API_KEY) && quotaGuard.canUseModel(ROUTER_MODELS.GEMINI_FLASH, 400).allowed;

  if (!groqOk && geminiOk) return 'gemini';
  if (!groqOk && !geminiOk) return 'openrouter';

  // If load spreading is enabled via env var, route a calibrated portion of sessions to Gemini
  const geminiRatio = Number(process.env.GEMINI_SCORING_RATIO) || (process.env.LOAD_SPREAD_GEMINI === 'true' ? 0.3 : 0.25);
  if (geminiRatio > 0 && geminiOk && sessionId) {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0;
    }
    const bucket = (Math.abs(hash) % 100) / 100;
    if (bucket < geminiRatio) {
      return 'gemini';
    }
  }

  return 'groq';
}

export function clearSessionScorer(sessionId) {
  if (!sessionId) return;
  sessionScorers.delete(sessionId);
}

/**
 * PII Sanitizer for Public Free-Tier LLMs (Google AI Studio, OpenRouter free):
 * Strips candidate emails, phone numbers, and full names before sending to external free endpoints.
 * Whitelists technical computing terms so architecture words (e.g. Redis, Raft) are never mangled.
 */
export function sanitizePromptForFreeTier(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    // Replace emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[candidate_email_redacted]')
    // Replace phone numbers (international or local formats)
    .replace(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,6}\b/g, '[phone_redacted]')
    // Replace LinkedIn profiles
    .replace(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi, '[linkedin_url_redacted]')
    // Replace explicit name tags: e.g. "Candidate Name: Alice Smith" or "Applicant: Bob"
    .replace(/\b(?:candidate name|applicant name|applicant)\s*[:=-]\s*([A-Za-z\s]+)/gi, 'Candidate Name: [candidate_name_redacted]')
    // Replace conversational introductions: "My name is Alice Smith" while protecting technical nouns
    .replace(/\b(?:my name is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, (match, name) => {
      const words = name.toLowerCase().split(/\s+/);
      const isTech = words.some((w) => TECHNICAL_WHITELIST.has(w));
      if (isTech) return match;
      return 'my name is [candidate_name_redacted]';
    })
    // Replace explicit candidate identity phrases like "Candidate Alice Smith" while protecting tech
    .replace(/\bCandidate\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, (match, name) => {
      const words = name.toLowerCase().split(/\s+/);
      const isTech = words.some((w) => TECHNICAL_WHITELIST.has(w));
      if (isTech) return match;
      return 'Candidate';
    })
    .trim();
}

/**
 * Token-Saving History Compressor:
 * Sends only the last 2 turns (4 messages: user + assistant) plus a 1-sentence running summary.
 */
export function buildTokenSavingHistory(history = [], runningSummary = '') {
  if (!Array.isArray(history) || history.length === 0) {
    return runningSummary ? `Context Summary: ${runningSummary}` : '';
  }

  // Max 2 turns = 4 messages (1 user, 1 assistant per turn)
  const recent = history.slice(-4);
  const formattedRecent = recent
    .map((msg) => `${msg.role === 'candidate' || msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${String(msg.content || '').substring(0, 300)}`)
    .join('\n');

  if (runningSummary && history.length > 4) {
    return `Context Summary: ${runningSummary}\n\nRecent Turns:\n${formattedRecent}`;
  }

  return formattedRecent;
}

// ── Provider Execution Wrappers ──

async function executeGroqCompletion(options = {}, estimatedTokens = 400) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const model = options.model || ROUTER_MODELS.GROQ_20B;

  // Enforce model-specific limits (120b vs 20b are checked independently)
  const check = quotaGuard.canUseModel(model, estimatedTokens);
  if (!check.allowed) {
    throw new Error(`Groq model ${model} quota blocked: ${check.reason}`);
  }

  const { signal, userId = null, ip = null, ...params } = options;
  if (params.model?.includes('gpt-oss')) {
    params.reasoning_effort = 'low';
  }

  // Native fetch allows reading actual response headers for rate limit synchronization
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(params),
    signal,
  });

  // Extract rate-limit headers to calibrate Quota Guard with server ground truth
  quotaGuard.syncProviderHeaders('groq', model, res.headers);

  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch { errBody = { message: await res.text() }; }
    const errMsg = errBody.error?.message || errBody.message || res.statusText;
    const err = new Error(`Groq HTTP ${res.status}: ${errMsg}`);
    err.status = res.status;
    err.code = errBody.error?.code || `HTTP_${res.status}`;
    throw err;
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || '';
  const cleanContent = stripReasoningTokens(rawText);

  // Check truncation
  if (data.choices?.[0]?.finish_reason === 'length') {
    routerMetrics.truncationCount++;
    logger.warn(`[LLM Router] Groq response truncated (finish_reason=length) for model ${model}`);
  }

  quotaGuard.recordUsage({
    provider: 'groq',
    model,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    totalTokens: data.usage?.total_tokens,
    userId,
    ip,
  });

  return {
    content: cleanContent,
    rawText,
    modelUsed: model,
    provider: 'groq',
    usage: data.usage,
  };
}

async function executeGeminiCompletion(prompt, systemInstruction = '', maxTokens = 260, estimatedTokens = 400, { userId = null, ip = null } = {}) {
  const modelName = ROUTER_MODELS.GEMINI_FLASH;
  const check = quotaGuard.canUseModel(modelName, estimatedTokens);
  if (!check.allowed) {
    throw new Error(`Gemini quota blocked: ${check.reason}`);
  }

  const client = await getGeminiClient();
  if (!client) throw new Error('Google AI Studio (Gemini) client not available');

  // Sanitize PII before sending to free tier public model
  const sanitizedPrompt = sanitizePromptForFreeTier(prompt);
  const sanitizedInstruction = sanitizePromptForFreeTier(systemInstruction);

  const config = {
    maxOutputTokens: maxTokens,
    temperature: 0.2,
    responseMimeType: 'application/json',
  };
  if (sanitizedInstruction) {
    config.systemInstruction = sanitizedInstruction;
  }

  const response = await aiCallWithRetry({
    operation: () =>
      client.models.generateContent({
        model: modelName,
        contents: sanitizedPrompt,
        config,
      }),
    timeoutMs: 14000,
    maxRetries: 2,
    serviceName: 'gemini',
  });

  const rawText = response.text || '';
  const cleanContent = stripReasoningTokens(rawText);

  quotaGuard.recordUsage({
    provider: 'gemini',
    model: modelName,
    totalTokens: estimatedTokens,
    userId,
    ip,
  });

  return {
    content: cleanContent,
    rawText,
    modelUsed: modelName,
    provider: 'gemini',
  };
}

async function executeOpenRouterCompletion(options = {}, estimatedTokens = 400) {
  if (!isOpenRouterAvailable()) throw new Error('OpenRouter not configured');
  const model = options.model || ROUTER_MODELS.OPENROUTER_8B;
  const check = quotaGuard.canUseModel(model, estimatedTokens);
  if (!check.allowed) {
    throw new Error(`OpenRouter quota blocked: ${check.reason}`);
  }

  const { userId = null, ip = null, ...openRouterOptions } = options;

  // Sanitize message content for free tier privacy
  const sanitizedOptions = {
    ...openRouterOptions,
    messages: (openRouterOptions.messages || []).map((m) => ({
      ...m,
      content: sanitizePromptForFreeTier(m.content),
    })),
  };

  const res = await createOpenRouterChatCompletion(sanitizedOptions);
  const rawText = res.choices?.[0]?.message?.content || '';
  const cleanContent = stripReasoningTokens(rawText);

  quotaGuard.recordUsage({
    provider: 'openrouter',
    model: res._modelUsed || model,
    promptTokens: res.usage?.prompt_tokens,
    completionTokens: res.usage?.completion_tokens,
    totalTokens: res.usage?.total_tokens,
    userId,
    ip,
  });

  return {
    content: cleanContent,
    rawText,
    modelUsed: res._modelUsed || model,
    provider: 'openrouter',
    usage: res.usage,
  };
}

// ── Deterministic Instant Fallbacks ──
const FALLBACK_MICRO_REACTIONS = [
  'Makes total sense.',
  'Clear trade-off there.',
  'Understood, good context.',
  'Fair point on that approach.',
  'Got it, clear direction.',
];

// ── Answer Classification Types (Part A Section 3) ──
export const VALID_ANSWER_TYPES = [
  'strong_complete',
  'partial',
  'wrong',
  'dont_know',
  'off_topic',
  'clarification',
  'stuck_silence',
];

export function detectDeterministicAnswerType(userAnswer = '', _previousQuestion = '') {
  const text = String(userAnswer || '').trim();
  if (
    !text ||
    text.length < 5 ||
    /^(\.|\?|-|uh|um|umm|\s)+$/i.test(text) ||
    /^(?:i am|i'm|uh|um)\s*[.\s]*(?:uh|um|umm)*$/i.test(text)
  ) {
    return 'stuck_silence';
  }
  const lower = text.toLowerCase();
  // Clarification
  if (
    /^(?:could you|can you|can we|are we|should this|does the|can it|do you mean|what do you mean|would you|repeat)\b/i.test(lower) ||
    (lower.endsWith('?') && lower.length < 90 && !lower.includes('because'))
  ) {
    return 'clarification';
  }
  // Don't know
  if (
    /\b(?:i don'?t know|not sure|no idea|haven'?t used|don'?t remember|can'?t recall|no clue|not familiar|haven'?t implemented)\b/i.test(lower)
  ) {
    return 'dont_know';
  }
  // Off-topic personal stories / unrelated hobbies
  if (
    /\b(?:hiking|crypto|bitcoin|ethereum|laptop battery|professor was|vacation|weather)\b/i.test(lower) &&
    !/\b(?:algorithm|database|cache|redis|postgres|query|index|latency|throughput|tree|graph)\b/i.test(lower)
  ) {
    return 'off_topic';
  }
  // Wrong technical claims
  if (
    /\b(?:unsorted.*o\(1\)|o\(1\).*unsorted|hash map.*ascending sorted|get requests are never idempotent|delete messages immediately as soon as one consumer reads|udp is used when packet ordering is required|distributes javascript execution threads|secondary indexes always speeds up|strictly volatile ram-only|atomic writes for all 64-bit)\b/i.test(lower)
  ) {
    return 'wrong';
  }
  // Strong complete: mentions multiple concepts, trade-offs, eviction, mitigation, or patterns
  if (
    /\b(?:base62|singleflight|xfetch|confluent schema registry|avro|protobuf|eviction|ttl|circuit breaker|two-phase commit|saga pattern|compensating|token bucket|lua scripts|median-of-three|partitioned.*customer id)\b/i.test(lower) ||
    (text.length > 120 && /\b(?:trade-offs?|mitigate|consistency|latency|worst case|partitioned)\b/i.test(lower))
  ) {
    return 'strong_complete';
  }
  return 'partial';
}

export function normalizeAnswerType(val, userAnswer = '', previousQuestion = '') {
  const norm = String(val || '').toLowerCase().trim();
  if (VALID_ANSWER_TYPES.includes(norm)) return norm;
  return detectDeterministicAnswerType(userAnswer, previousQuestion);
}

function processFastReplyParsed(parsed, rawUserAnswer, startTime, completion, currentMode, safeQuestionNumber = 0, previousQuestion = '') {
  routerMetrics.jsonParseSuccessCount++;
  const answerType = normalizeAnswerType(parsed?.answerType, rawUserAnswer, previousQuestion);
  const rawQuote = parsed?.evidenceQuote ? String(parsed.evidenceQuote).trim() : '';
  const verification = verifyEvidenceQuote(rawQuote, rawUserAnswer);

  let followUp = clampToTwoSentences(String(parsed?.followUpQuestion || '').trim());
  if (!verification.verified && followUp) {
    // Drop unverified attribution (e.g. "As you said, X...", "You mentioned [something], ...")
    followUp = stripAttributionPhrase(followUp, safeQuestionNumber);
  }

  const latencyMs = Date.now() - startTime;
  recordFastReplyLatency(latencyMs);

  return {
    answerType,
    evidenceQuote: verification.quote,
    quoteVerified: verification.verified,
    microReaction: parsed?.microReaction || 'Got it, makes sense.',
    followUpQuestion: followUp || getGenericFollowUp(safeQuestionNumber),
    complete: false,
    thinkTime: 40,
    latencyMs,
    modelUsed: completion?.modelUsed || 'unknown',
    provider: completion?.provider || 'unknown',
    mode: currentMode,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FAST REPLY ROUTER
// Groq 20b -> Google AI Studio -> OpenRouter 8b:free -> deterministic
// ─────────────────────────────────────────────────────────────────────────────
export async function callFastReply({
  previousQuestion = '',
  userAnswer = '',
  company = 'Tech Company',
  role = 'Software Engineer',
  stage = 'Technical',
  questionNumber = 2,
  _totalQuestions = 8,
  adaptivePrompt = '',
  history = [],
  runningSummary = '',
  signal,
  _userId = null,
  _ip = null,
}) {
  const startTime = Date.now();
  const safeQuestionNumber = Math.max(1, Number(questionNumber) || 2);
  const currentMode = quotaGuard.getCurrentMode({ isNewSession: false });

  // In WAITLIST or MINIMAL mode, trigger instant deterministic scripted question (0ms)
  // Transparently notify the candidate so it does not feel like the AI stopped listening.
  if (currentMode === DEGRADATION_MODES.WAITLIST || currentMode === DEGRADATION_MODES.MINIMAL) {
    const microReaction = deterministicPick(FALLBACK_MICRO_REACTIONS, safeQuestionNumber);
    const followUpQuestion = getGenericFollowUp(safeQuestionNumber);
    const latencyMs = Date.now() - startTime;
    recordFastReplyLatency(latencyMs);
    return {
      answerType: detectDeterministicAnswerType(userAnswer, previousQuestion),
      evidenceQuote: '',
      quoteVerified: false,
      microReaction,
      followUpQuestion,
      complete: false,
      thinkTime: 30,
      latencyMs,
      modelUsed: 'scripted-minimal',
      provider: 'deterministic-fallback',
      mode: currentMode,
      isScriptedMode: true,
      interviewerNotice: 'Operating in offline interview mode with structured questions to conserve network bandwidth.',
    };
  }

  // Token-saving context: only last 2 turns + summary
  const historySnippet = buildTokenSavingHistory(history, runningSummary);

  const fastReplySystemPrompt = `You are an expert interviewer at ${company} conducting a ${stage} interview for ${role}.
Always respond strictly with a valid JSON object matching the requested schema. Do not output anything outside JSON.`;

  const fastReplyUserPrompt = `Previous Question was: "${previousQuestion}"
Candidate Answer: "${userAnswer ? String(userAnswer).substring(0, 800) : ''}"
${historySnippet ? `\n${historySnippet}\n` : ''}
${adaptivePrompt}

STEP 1 — CLASSIFY CANDIDATE'S ANSWER (into exact answerType):
- strong_complete: Thorough and complete. Explains internal mechanisms AND discusses trade-offs, edge cases, failure mitigations, or scaling limits. Merely naming an algorithm/tool (e.g. just saying "binary search" or "add an index") without explaining how it works or its trade-offs is NOT strong_complete.
- partial: Right core direction or concept, but superficial or missing essential depth, implementation details, edge cases, or trade-offs (e.g. just naming "binary search", "an index", or "Redis" without explaining how it's implemented, failure modes, or trade-offs). Action: Probe the specific gap.
- wrong: Incorrect technical premise or flawed claim (e.g. claiming linear search is O(1) or hash maps are sorted). Action: Provide a neutral conceptual nudge without being judgmental. NEVER say "wrong", "incorrect", or reveal scores.
- dont_know: Candidate says "I don't know", "not sure", or passes. Action: Reassure warmly, offer a simpler angle or move on.
- off_topic: Rambling or tangential personal story unrelated to the question. Action: Gently redirect back to the core question.
- clarification: Candidate asks a clarifying question or asks to repeat. Action: Answer or repeat clearly without penalty.
- stuck_silence: Very short (<5 words), blank, or stuck after extended silence. Action: Offer a gentle starting hint.

STEP 2 — SPOKEN STYLE & PROSODY RULES:
1. Speak like a friendly senior engineer in a call, not like a document.
2. STRICT LENGTH: The follow-up question MUST be 1 or 2 sentences MAX (12-25 words).
3. Micro-reaction: 2 to 5 words max. Vary openers (e.g. "Okay,", "Right,", "Interesting,", "Fair enough,"). Never repeat the same opener consecutively.
4. EVIDENCE REFERENCE: The follow-up MUST reference one specific thing the candidate said (e.g. "You mentioned a hash map, what happens on collisions?").
5. TOPIC LIMIT: Maximum 2 follow-ups on the same topic, then pivot to the next topic or high-level architecture. Never re-ask something already covered in history.
6. Tone: End with a single clear question mark '?'. Use contractions ("that's", "let's", "we've"). No markdown, bullets, or symbols. Spell out symbols ("O of n" for O(n)).
7. "evidenceQuote" RULE: MUST be a 2 to 5 word VERBATIM exact snippet from Candidate Answer (or empty string if none). Do NOT paraphrase.

Respond strictly in valid JSON format:
{
  "answerType": "strong_complete|partial|wrong|dont_know|off_topic|clarification|stuck_silence",
  "evidenceQuote": "Exact 2-5 word snippet copied verbatim from Candidate Answer (or empty string)",
  "microReaction": "Crisp 2-5 word natural reaction.",
  "followUpQuestion": "Spoken follow-up referencing candidate's answer (12-25 words, 1-2 sentences MAX)."
}`;

  // 1. Try Groq 20b
  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        executeGroqCompletion(
          {
            model: ROUTER_MODELS.GROQ_20B,
            messages: [
              { role: 'system', content: fastReplySystemPrompt },
              { role: 'user', content: fastReplyUserPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.65,
            max_tokens: 300,
            signal,
          },
          300
        ),
      timeoutMs: 8000,
      maxRetries: 1,
      serviceName: 'groq',
    });

    const parsed = safeJsonParse(completion.content);
    if (parsed && (parsed.followUpQuestion || parsed.microReaction)) {
      return processFastReplyParsed(parsed, userAnswer, startTime, completion, currentMode, safeQuestionNumber, previousQuestion);
    }
    routerMetrics.jsonParseFailureCount++;
  } catch (err) {
    logger.warn('[Fast Reply] Groq 20b failed, cascading:', err.message?.substring(0, 100));
    quotaGuard.markProviderFailing('groq');
  }

  // 2. Try Google AI Studio (Gemini 3.5 Flash Lite)
  try {
    const completion = await executeGeminiCompletion(
      fastReplyUserPrompt,
      fastReplySystemPrompt,
      300,
      300
    );
    const parsed = safeJsonParse(completion.content);
    if (parsed && (parsed.followUpQuestion || parsed.microReaction)) {
      return processFastReplyParsed(parsed, userAnswer, startTime, completion, currentMode, safeQuestionNumber, previousQuestion);
    }
    routerMetrics.jsonParseFailureCount++;
  } catch (err) {
    logger.warn('[Fast Reply] Gemini failed, cascading to OpenRouter 8b:', err.message?.substring(0, 100));
    quotaGuard.markProviderFailing('gemini');
  }

  // 4. Try OpenRouter 8b:free
  try {
    const completion = await executeOpenRouterCompletion(
      {
        model: ROUTER_MODELS.OPENROUTER_8B,
        messages: [
          { role: 'system', content: fastReplySystemPrompt },
          { role: 'user', content: fastReplyUserPrompt },
        ],
        temperature: 0.65,
        max_tokens: 300,
        signal,
      },
      300
    );
    const parsed = safeJsonParse(completion.content);
    if (parsed && (parsed.followUpQuestion || parsed.microReaction)) {
      return processFastReplyParsed(parsed, userAnswer, startTime, completion, currentMode, safeQuestionNumber, previousQuestion);
    }
    routerMetrics.jsonParseFailureCount++;
  } catch (err) {
    logger.warn('[Fast Reply] OpenRouter 8b failed:', err.message?.substring(0, 100));
    quotaGuard.markProviderFailing('openrouter');
  }

  // 5. Deterministic fallback question (instant 0ms)
  const microReaction = deterministicPick(FALLBACK_MICRO_REACTIONS, safeQuestionNumber);
  const followUpQuestion = getGenericFollowUp(safeQuestionNumber);
  const latencyMs = Date.now() - startTime;
  recordFastReplyLatency(latencyMs);
  return {
    answerType: detectDeterministicAnswerType(userAnswer, previousQuestion),
    evidenceQuote: '',
    quoteVerified: false,
    microReaction,
    followUpQuestion,
    complete: false,
    thinkTime: 40,
    latencyMs,
    modelUsed: 'deterministic-fallback',
    provider: 'deterministic-fallback',
    mode: currentMode,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TURN SCORING ROUTER
// Groq 20b -> Google AI Studio -> OpenRouter 70b:free -> Queue / Estimated Fallback
// ─────────────────────────────────────────────────────────────────────────────
export async function callTurnScoring({
  previousQuestion = '',
  userAnswer = '',
  code = '',
  codeLanguage = '',
  company = 'Tech Company',
  role = 'Software Engineer',
  stage = 'Technical',
  questionNumber = 2,
  difficultyTag = 'medium',
  sessionId = null,
  signal,
  userId = null,
  ip = null,
}) {
  const startTime = Date.now();
  const currentMode = quotaGuard.getCurrentMode({ isNewSession: false });
  let turnRecorded = false;

  // In MINIMAL mode, defer scoring to Job Queue to protect budget if sessionId is present
  if (currentMode === DEGRADATION_MODES.MINIMAL && sessionId) {
    if (userId || ip) {
      quotaGuard.recordUserTurn({ userId, ip });
      turnRecorded = true;
    }
    const job = deferredJobQueue.enqueueScoreTurn({
      sessionId,
      userId,
      questionNumber,
      previousQuestion,
      userAnswer,
      company,
      role,
      stage,
      difficultyTag,
    });
    return {
      score: null,
      status: 'pending_evaluation',
      displayScore: 'pending',
      isEstimated: true,
      isDeferred: true,
      jobId: job.jobId,
      evalModelUsed: 'deferred-queue',
      evalProvider: 'deferred-queue',
      feedback: 'Turn scoring queued for background processing.',
      strengths: ['Spoken delivery recorded'],
      improvements: [],
      interviewerReaction: 'neutral',
      latencyMs: Date.now() - startTime,
      mode: currentMode,
      turnRecorded,
    };
  }

  // Expanded max_tokens headroom (280 tokens) prevents JSON truncation when models wrap answers
  const prompt = `You are a calibrated technical & behavioral evaluator at ${company} scoring a live spoken turn for ${role} (${stage}).
Difficulty: ${difficultyTag} (easy | medium | hard | staff_architectural)
Question: "${previousQuestion}"
Candidate Spoken Answer: "${String(userAnswer || '').substring(0, 1000)}"
${code ? `Submitted Code (${codeLanguage}):\n${String(code).substring(0, 600)}\n` : ''}

EVALUATION PRINCIPLES:
1. Judge technical content, problem solving, and engineering reasoning ONLY.
2. Do NOT evaluate or penalize candidate accent, vocal fluency, English proficiency, filler words, or pauses.
3. Weight by difficulty (${difficultyTag}):
   - easy: foundational correctness and basic clarity
   - medium: trade-offs, edge cases, and complexity
   - hard / staff: architectural trade-offs, concurrency, scaling, and fault tolerance
4. Include a short direct evidence quote from candidate's answer supporting the evaluation.

Rate across 3 dimensions on a 1.0 - 5.0 scale (0.5 increments):
- correctness (1.0 - 5.0): accuracy and complexity
- depth (1.0 - 5.0): trade-offs and mechanics
- communication (1.0 - 5.0): structure and conciseness

Respond as compact JSON:
{
  "dimensions": { "correctness": 1.0-5.0, "depth": 1.0-5.0, "communication": 1.0-5.0 },
  "evidenceQuote": "Short candidate quote justifying this rating",
  "feedback": "Crisp 1-2 sentence evaluation",
  "strengths": ["Specific strength"],
  "improvements": ["Specific improvement"],
  "reaction": "encouraging|probing|neutral"
}`;

  let parsed = null;
  let modelUsed = ROUTER_MODELS.GROQ_20B;
  let providerUsed = 'groq';

  // One-Scorer-Per-Session: Check in-memory map first, then restore from Supabase if container restarted
  const pinnedScorer = sessionId ? (getSessionScorer(sessionId) || await loadSessionScorer(sessionId)) : null;
  // Load spread across sessions: distributes new sessions 50/50 between Groq 20b and Gemini Flash Lite
  const preferredProvider = pinnedScorer?.provider || selectInitialScorer(sessionId);

  const candidateProviders = preferredProvider === 'gemini'
    ? ['gemini', 'groq', 'openrouter']
    : ['groq', 'gemini', 'openrouter'];

  for (const candidate of candidateProviders) {
    if (parsed) break;
    if (quotaGuard.isProviderFailing(candidate)) continue;

    // 1. Groq 20b
    if (candidate === 'groq') {
      try {
        const completion = await aiCallWithRetry({
          operation: () =>
            executeGroqCompletion(
              {
                model: ROUTER_MODELS.GROQ_20B,
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 260,
                signal,
                userId,
                ip,
              },
              400
            ),
          timeoutMs: 12000,
          maxRetries: 1,
          serviceName: 'groq',
        });
        parsed = safeJsonParse(completion.content);
        if (parsed) {
          routerMetrics.jsonParseSuccessCount++;
          modelUsed = completion.modelUsed;
          providerUsed = completion.provider;
          turnRecorded = Boolean(userId || ip);
          if (sessionId) setSessionScorer(sessionId, providerUsed, modelUsed);
          break;
        } else {
          routerMetrics.jsonParseFailureCount++;
        }
      } catch (err) {
        logger.warn('[Turn Scoring] Groq 20b failed, cascading down:', err.message?.substring(0, 100));
        quotaGuard.markProviderFailing('groq');
      }
    }

    // 2. Google AI Studio (Gemini 3.5 Flash Lite)
    if (candidate === 'gemini') {
      try {
        const completion = await executeGeminiCompletion(prompt, '', 260, 400, { userId, ip });
        parsed = safeJsonParse(completion.content);
        if (parsed) {
          routerMetrics.jsonParseSuccessCount++;
          modelUsed = completion.modelUsed;
          providerUsed = completion.provider;
          turnRecorded = Boolean(userId || ip);
          if (sessionId) setSessionScorer(sessionId, providerUsed, modelUsed);
          break;
        } else {
          routerMetrics.jsonParseFailureCount++;
        }
      } catch (err) {
        logger.warn('[Turn Scoring] Gemini failed, cascading down:', err.message?.substring(0, 100));
        quotaGuard.markProviderFailing('gemini');
      }
    }

    // 3. OpenRouter 70b:free
    if (candidate === 'openrouter' && isOpenRouterAvailable()) {
      try {
        const completion = await executeOpenRouterCompletion(
          {
            model: ROUTER_MODELS.OPENROUTER_70B,
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.1,
            max_tokens: 260,
            signal,
            userId,
            ip,
          },
          400
        );
        parsed = safeJsonParse(completion.content);
        if (parsed) {
          routerMetrics.jsonParseSuccessCount++;
          modelUsed = completion.modelUsed;
          providerUsed = completion.provider;
          turnRecorded = Boolean(userId || ip);
          if (sessionId) setSessionScorer(sessionId, providerUsed, modelUsed);
          break;
        } else {
          routerMetrics.jsonParseFailureCount++;
        }
      } catch (err) {
        logger.warn('[Turn Scoring] OpenRouter 70b failed:', err.message?.substring(0, 100));
        quotaGuard.markProviderFailing('openrouter');
      }
    }
  }

  // 4. Heuristic Fallback — Explicitly labeled as "estimated", never passed off as official numeric score
  if (!parsed) {
    if (sessionId) setSessionScorer(sessionId, 'heuristic-estimated', 'heuristic-estimated');
    if (!turnRecorded && (userId || ip)) {
      quotaGuard.recordUserTurn({ userId, ip });
      turnRecorded = true;
    }

    return {
      score: null, // Set null so estimated turns are excluded from report average and UI shows "estimated"
      displayScore: 'estimated',
      isEstimated: true,
      status: 'estimated',
      dimensions: { correctness: null, depth: null, communication: null, rawWeighted: null },
      evalModelUsed: 'heuristic-estimated',
      evalProvider: 'heuristic-estimated',
      isFallbackModel: true,
      feedback: 'Estimated answer recording (AI evaluation temporarily unavailable).',
      strengths: ['Spoken delivery recorded'],
      improvements: ['Detailed rubric evaluation queued'],
      interviewerReaction: 'neutral',
      latencyMs: Date.now() - startTime,
      mode: currentMode,
      turnRecorded,
    };
  }

  // Continuous piecewise scoring
  const c = Math.max(1, Math.min(5, Number(parsed?.dimensions?.correctness) || 3));
  const d = Math.max(1, Math.min(5, Number(parsed?.dimensions?.depth) || 3));
  const comm = Math.max(1, Math.min(5, Number(parsed?.dimensions?.communication) || 3));

  const raw = 0.50 * c + 0.35 * d + 0.15 * comm;
  let resolvedScore;
  if (raw <= 2.0) {
    resolvedScore = Math.round(15 + (raw - 1.0) * 30);
  } else if (raw <= 3.0) {
    resolvedScore = Math.round(45 + (raw - 2.0) * 20);
  } else if (raw <= 4.0) {
    resolvedScore = Math.round(65 + (raw - 3.0) * 17);
  } else {
    resolvedScore = Math.round(82 + (raw - 4.0) * 14);
  }

  if (difficultyTag === 'easy') resolvedScore = Math.min(72, resolvedScore);
  else if (difficultyTag === 'medium') resolvedScore = Math.min(88, resolvedScore);
  resolvedScore = Math.max(0, Math.min(100, resolvedScore));

  const isCascade = Boolean(pinnedScorer && pinnedScorer.provider !== providerUsed && pinnedScorer.provider !== 'heuristic-estimated');
  const isFallback = providerUsed !== 'groq' || isCascade;

  return {
    score: resolvedScore,
    isEstimated: false,
    dimensions: { correctness: c, depth: d, communication: comm, rawWeighted: Number(raw.toFixed(2)) },
    evalModelUsed: modelUsed,
    evalProvider: providerUsed,
    isFallbackModel: isFallback,
    isCascadeMidSession: isCascade,
    originalScorer: pinnedScorer?.provider || providerUsed,
    evidenceQuote: parsed?.evidenceQuote ? String(parsed.evidenceQuote).trim() : null,
    feedback: parsed?.feedback || 'Answer recorded.',
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : ['Structured response'],
    improvements: Array.isArray(parsed?.improvements) ? parsed.improvements : [],
    interviewerReaction: parsed?.reaction || 'neutral',
    latencyMs: Date.now() - startTime,
    mode: currentMode,
    turnRecorded,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERVIEW REPORT ROUTER
// Groq 120b (Normal) -> Groq 20b (Lite / 120b rate-limited) -> OpenRouter 70b -> Queue
// ─────────────────────────────────────────────────────────────────────────────
export async function callInterviewReport({
  company = 'Tech Company',
  role = 'Software Engineer',
  stage = 'Technical',
  qaPairs = [],
  sessionScores = [],
  _speechHistory = [],
  signal,
  sessionId = null,
  userId = null,
}) {
  const currentMode = quotaGuard.getCurrentMode({ isNewSession: false });

  // In Minimal mode: Enqueue report to Job Queue so user can see "Report Pending" in dashboard
  if (currentMode === DEGRADATION_MODES.MINIMAL) {
    const job = deferredJobQueue.enqueueReportGeneration({
      sessionId,
      userId,
      company,
      role,
      stage,
      qaPairs,
      sessionScores,
    });
    return {
      isDeferred: true,
      reportStatus: 'pending',
      jobId: job.jobId,
      mode: currentMode,
    };
  }

  // Model selection: Groq 120b in Normal mode; Groq 20b in Lite mode to save tokens
  const targetModel = currentMode === DEGRADATION_MODES.LITE
    ? ROUTER_MODELS.GROQ_20B
    : ROUTER_MODELS.GROQ_120B;

  // Build condensed evidence quotes from per-turn scores
  const evidenceSummary = qaPairs
    .map((qa, i) => {
      const q = String(qa.question || '').substring(0, 150);
      const a = String(qa.answer || '').substring(0, 300);
      const s = qa.inlineScore ?? sessionScores[i] ?? 'N/A';
      return `Q${i + 1} [Score: ${s}]: "${q}"\nCandidate: "${a}"`;
    })
    .join('\n\n');

  const systemPrompt = `You are a calibrated senior interview panelist at ${company} generating the final interview evaluation report for ${role} (${stage}).
Ground every judgment in the actual transcript quotes provided.

Return valid JSON with this shape:
{
  "overallScore": 0-100,
  "summary": "3-4 sentence evaluation summary tied to candidate speech",
  "verdict": "Strong Hire / Would Advance / Borderline / Would Not Advance",
  "verdictEmoji": "🌟 or 👍 or 🤔 or 👎",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "recommendation": "One practical next recommendation",
  "categoryScores": {
    "technicalSkills": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "cultureFit": 0-100
  }
}`;

  // 1. Try Target Groq Model (120b or 20b)
  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        executeGroqCompletion(
          {
            model: targetModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Analyze this interview transcript:\n\n${evidenceSummary}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.25,
            max_tokens: 1200,
            signal,
          },
          1500
        ),
      timeoutMs: 35000,
      maxRetries: 1,
      serviceName: 'groq',
    });

    const parsed = safeJsonParse(completion.content);
    if (parsed) {
      routerMetrics.jsonParseSuccessCount++;
      return {
        ...parsed,
        reportModelUsed: completion.modelUsed,
        reportProvider: completion.provider,
        mode: currentMode,
      };
    }
    routerMetrics.jsonParseFailureCount++;
  } catch (err) {
    logger.warn(`[Report Router] Model ${targetModel} failed, trying 20b fallback:`, err.message?.substring(0, 100));
    quotaGuard.markProviderFailing('groq');
  }

  // 2. If 120b failed in Normal mode, fall back to Groq 20b
  if (targetModel !== ROUTER_MODELS.GROQ_20B) {
    try {
      const completion = await executeGroqCompletion(
        {
          model: ROUTER_MODELS.GROQ_20B,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this interview transcript:\n\n${evidenceSummary}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.25,
          max_tokens: 1000,
          signal,
        },
        1200
      );
      const parsed = safeJsonParse(completion.content);
      if (parsed) {
        routerMetrics.jsonParseSuccessCount++;
        return {
          ...parsed,
          reportModelUsed: completion.modelUsed,
          reportProvider: completion.provider,
          mode: currentMode,
        };
      }
      routerMetrics.jsonParseFailureCount++;
    } catch (err) {
      logger.warn('[Report Router] Groq 20b fallback failed:', err.message?.substring(0, 100));
    }
  }

  // 3. Fallback to OpenRouter 70b
  if (isOpenRouterAvailable()) {
    try {
      const completion = await executeOpenRouterCompletion(
        {
          model: ROUTER_MODELS.OPENROUTER_70B,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this interview transcript:\n\n${evidenceSummary}` },
          ],
          temperature: 0.25,
          max_tokens: 1000,
          signal,
        },
        1200
      );
      const parsed = safeJsonParse(completion.content);
      if (parsed) {
        routerMetrics.jsonParseSuccessCount++;
        return {
          ...parsed,
          reportModelUsed: completion.modelUsed,
          reportProvider: completion.provider,
          mode: currentMode,
        };
      }
      routerMetrics.jsonParseFailureCount++;
    } catch (err) {
      logger.warn('[Report Router] OpenRouter 70b fallback failed:', err.message?.substring(0, 100));
    }
  }

  return null;
}

export default {
  callFastReply,
  callTurnScoring,
  callInterviewReport,
  buildTokenSavingHistory,
  sanitizePromptForFreeTier,
  ROUTER_MODELS,
  routerMetrics,
  getFastReplyLatencyStats,
};
