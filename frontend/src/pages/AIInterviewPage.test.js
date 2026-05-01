import { describe, it, expect } from 'vitest';
import { getThinkingDelayMs, getQuestionTimeLimit } from './aiInterviewTiming';
import { shouldAutoSubmitAnswer, getAdaptiveSilenceMs } from '../hooks/useVoiceAI';

describe('AI interview timing helpers', () => {
  it('caps thinking delay at a realistic but responsive pause', () => {
    expect(getThinkingDelayMs('a'.repeat(1000))).toBe(1800);
  });

  it('returns known stage timing', () => {
    expect(getQuestionTimeLimit('Technical')).toBe(90);
  });
});

describe('voice autosubmit helpers', () => {
  it('autsubmits when utterance ended and transcript long enough', () => {
    expect(shouldAutoSubmitAnswer({ transcriptLength: 20, inputLevel: 0.01, utteranceEnded: true })).toBe(true);
  });

  it('does not autosubmit while user still speaking', () => {
    expect(shouldAutoSubmitAnswer({ transcriptLength: 20, inputLevel: 0.2, utteranceEnded: true })).toBe(false);
  });

  it('adaptive silence decreases for longer answers', () => {
    expect(getAdaptiveSilenceMs(20)).toBeGreaterThan(getAdaptiveSilenceMs(200));
  });
});
