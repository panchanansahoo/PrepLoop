import { describe, it, expect } from 'vitest';
import { getPredictivePromptCandidates } from './aiInterviewPrefetch';

describe('getPredictivePromptCandidates', () => {
  it('returns coding-focused prompts for dsa interviews', () => {
    const candidates = getPredictivePromptCandidates({
      interviewType: 'dsa',
      answerDraft: 'I can optimize complexity with a hashmap and discuss trade off.',
    });

    expect(candidates).toContain('Can you walk through the time and space complexity?');
    expect(candidates).toContain('Good direction. What trade-off did you choose and why?');
  });

  it('returns behavioral-focused prompts for behavioral interviews', () => {
    const candidates = getPredictivePromptCandidates({
      interviewType: 'behavioral',
      answerDraft: 'I led the project and coordinated stakeholders.',
    });

    expect(candidates).toContain('What did you learn from that experience?');
    expect(candidates).not.toContain('Can you walk through the time and space complexity?');
  });

  it('deduplicates prompts while preserving order', () => {
    const candidates = getPredictivePromptCandidates({
      interviewType: 'system-design',
      answerDraft: 'Edge case and complexity were key edge case concerns.',
    });

    const deduped = Array.from(new Set(candidates));
    expect(candidates).toEqual(deduped);
  });

  it('adds stage-aware prompt during intro discovery', () => {
    const candidates = getPredictivePromptCandidates({
      interviewType: 'behavioral',
      answerDraft: 'I started by understanding the context and team priorities.',
      telemetryStage: 'intro',
    });

    expect(candidates).toContain('What constraints did you clarify before starting?');
  });

  it('adds concise-followup prompt when response latency is high', () => {
    const candidates = getPredictivePromptCandidates({
      interviewType: 'coding',
      answerDraft: 'I would first compare brute force with an indexed approach.',
      averageResponseLatencyMs: 12000,
    });

    expect(candidates).toContain('Can you summarize your approach in one sentence before details?');
  });
});
