import { describe, it, expect } from 'vitest';
import { getThinkingDelayMs, getQuestionTimeLimit } from './aiInterviewTiming';
import { shouldAutoSubmitAnswer, getAdaptiveSilenceMs } from '../hooks/useDeepgramVoice';

describe('AI interview timing helpers', () => {
  it('caps thinking delay at 2s', () => {
    expect(getThinkingDelayMs('a'.repeat(1000))).toBe(2000);
  });

  it('returns known stage timing', () => {
    expect(getQuestionTimeLimit('Technical')).toBe(240);
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
