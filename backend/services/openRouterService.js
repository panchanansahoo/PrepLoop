/**
 * OpenRouter Service — Multi-model LLM Gateway & Failover Provider
 * Supports free models:
 *   - meta-llama/llama-3.3-70b-instruct:free (Turn Scoring & Feedback)
 *   - meta-llama/llama-3.1-8b-instruct:free  (Fast Reply Fallback)
 *   - qwen/qwen-2.5-coder-32b-instruct:free (Technical / DSA Scoring)
 *   - google/gemini-2.0-flash-exp:free      (Fast Explanations)
 */
import { aiCallWithRetry } from '../utils/aiClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('openrouter');

export const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

export const OPENROUTER_MODELS = {
  // Free tier models (dynamically active on OpenRouter gateway)
  LLAMA_70B_FREE: process.env.OPENROUTER_EVAL_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  LLAMA_8B_FREE: process.env.OPENROUTER_FAST_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  QWEN_CODER_FREE: process.env.OPENROUTER_CODING_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  GEMINI_FLASH_FREE: 'google/gemini-2.0-flash-exp:free',

  // Configured defaults
  DEFAULT_EVAL: process.env.OPENROUTER_EVAL_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  DEFAULT_FAST: process.env.OPENROUTER_FAST_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  DEFAULT_CODING: process.env.OPENROUTER_CODING_MODEL || 'nvidia/nemotron-3.5-lightning:free',
};

/**
 * Checks whether an OpenRouter API key is configured and valid.
 */
export function isOpenRouterAvailable() {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 0 &&
    !key.toLowerCase().includes('your_') &&
    !key.toLowerCase().includes('placeholder')
  );
}

/**
 * Strips reasoning tokens (<think>...</think>) from reasoning models
 * to ensure downstream JSON and text parsers receive clean outputs.
 */
export function stripReasoningTokens(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Creates a chat completion via OpenRouter API using native fetch.
 * Returns an OpenAI-compatible response object matching Groq's SDK format.
 */
export async function createOpenRouterChatCompletion(options = {}, requestOptions = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!isOpenRouterAvailable()) {
    throw new Error('OPENROUTER_API_KEY is not configured or contains placeholder value');
  }

  const { signal: optionsSignal, timeoutMs, ...bodyOptions } = options;
  const signal = optionsSignal || requestOptions.signal;

  const model = bodyOptions.model || OPENROUTER_MODELS.DEFAULT_EVAL;
  const payload = {
    ...bodyOptions,
    model,
  };

  // Enforce sensible max_tokens boundaries
  if (payload.max_tokens !== undefined) {
    payload.max_tokens = Math.max(Number(payload.max_tokens) || 600, 150);
  }

  const operation = async () => {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://preploop.com',
        'X-Title': 'PrepLoop AI Interview Platform',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      let errorBody;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = { message: await res.text() };
      }

      const errMsg = errorBody.error?.message || errorBody.message || res.statusText;
      logger.warn(`OpenRouter request failed with HTTP ${res.status}`, { error: errMsg, model });
      const err = new Error(`OpenRouter HTTP ${res.status}: ${errMsg}`);
      err.status = res.status;
      err.code = errorBody.error?.code || `HTTP_${res.status}`;
      throw err;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const cleanContent = stripReasoningTokens(rawContent);

    return {
      id: data.id || `or-${Date.now()}`,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: cleanContent,
          },
          finish_reason: data.choices?.[0]?.finish_reason || 'stop',
        },
      ],
      usage: data.usage || null,
      _modelUsed: model,
      _provider: 'openrouter',
    };
  };

  const result = await aiCallWithRetry({
    operation,
    serviceName: 'openrouter',
    timeoutMs: timeoutMs || Number.parseInt(process.env.OPENROUTER_TIMEOUT_MS || '14000', 10),
    maxRetries: 2,
  });
  return result;
}

/**
 * Lightweight test probe to check API key validity and quota against OpenRouter.
 */
export async function testOpenRouterConnection() {
  if (!isOpenRouterAvailable()) {
    return { ok: false, error: 'OPENROUTER_API_KEY is not configured' };
  }
  try {
    const res = await createOpenRouterChatCompletion({
      model: OPENROUTER_MODELS.DEFAULT_FAST,
      messages: [{ role: 'user', content: 'Respond with exactly: OK' }],
      max_tokens: 10,
      temperature: 0,
      timeoutMs: 8000,
    });
    return {
      ok: true,
      modelUsed: res._modelUsed,
      reply: res.choices[0]?.message?.content,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default {
  isOpenRouterAvailable,
  createOpenRouterChatCompletion,
  testOpenRouterConnection,
  stripReasoningTokens,
  OPENROUTER_MODELS,
};

