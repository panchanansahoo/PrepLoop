import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isOpenRouterAvailable,
  stripReasoningTokens,
  createOpenRouterChatCompletion,
  OPENROUTER_MODELS,
} from '../../services/openRouterService.js';
import { createGroqChatCompletion } from '../../routes/company-interview/helpers.js';

describe('OpenRouter Service & Fallback Architecture', () => {
  const originalEnv = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENROUTER_API_KEY = originalEnv;
    } else {
      delete process.env.OPENROUTER_API_KEY;
    }
  });

  describe('Configuration & Availability', () => {
    it('returns false when OPENROUTER_API_KEY is not set or empty', () => {
      delete process.env.OPENROUTER_API_KEY;
      expect(isOpenRouterAvailable()).toBe(false);

      process.env.OPENROUTER_API_KEY = '   ';
      expect(isOpenRouterAvailable()).toBe(false);
    });

    it('returns false when OPENROUTER_API_KEY is a placeholder', () => {
      process.env.OPENROUTER_API_KEY = 'your_openrouter_api_key_here';
      expect(isOpenRouterAvailable()).toBe(false);
    });

    it('returns true when a valid key is provided', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-abc1234567890';
      expect(isOpenRouterAvailable()).toBe(true);
    });

    it('exposes well-known free models for evaluation and fast-reply', () => {
      expect(OPENROUTER_MODELS.LLAMA_70B_FREE).toBeDefined();
      expect(OPENROUTER_MODELS.LLAMA_8B_FREE).toBeDefined();
      expect(OPENROUTER_MODELS.QWEN_CODER_FREE).toBeDefined();
      expect(OPENROUTER_MODELS.DEFAULT_EVAL).toBeTruthy();
    });
  });

  describe('Reasoning Token Stripping', () => {
    it('strips <think> blocks from reasoning model output', () => {
      const raw = '<think>I need to analyze this candidate answer carefully...</think>{"score": 85, "feedback": "Good"}';
      expect(stripReasoningTokens(raw)).toBe('{"score": 85, "feedback": "Good"}');
    });

    it('leaves standard text untouched', () => {
      const plain = '{"clarityScore": 4, "depthScore": 4}';
      expect(stripReasoningTokens(plain)).toBe(plain);
    });
  });

  describe('Chat Completion Formatting', () => {
    it('throws error when attempting call without key', async () => {
      delete process.env.OPENROUTER_API_KEY;
      await expect(
        createOpenRouterChatCompletion({
          messages: [{ role: 'user', content: 'hello' }],
        })
      ).rejects.toThrow(/OPENROUTER_API_KEY is not configured/);
    });

    it('formats OpenAI-compatible headers and payload', async () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-mock-test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'gen-12345',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: '<think>internal</think>That sounds like a solid approach.',
              },
              finish_reason: 'stop',
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const res = await createOpenRouterChatCompletion({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: 'How would you scale Redis?' }],
        temperature: 0.3,
        max_tokens: 300,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, req] = mockFetch.mock.calls[0];
      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(req.headers['Authorization']).toBe('Bearer sk-or-v1-mock-test-key');
      expect(req.headers['HTTP-Referer']).toBe('https://preploop.com');
      expect(req.headers['X-Title']).toBe('PrepLoop AI Interview Platform');

      const parsedBody = JSON.parse(req.body);
      expect(parsedBody.model).toBe('meta-llama/llama-3.1-8b-instruct:free');
      expect(parsedBody.messages).toHaveLength(1);

      // Verify response structure and thinking token removal
      expect(res.choices[0].message.content).toBe('That sounds like a solid approach.');
      expect(res._modelUsed).toBe('meta-llama/llama-3.1-8b-instruct:free');
      expect(res._provider).toBe('openrouter');
    });
  });
});

