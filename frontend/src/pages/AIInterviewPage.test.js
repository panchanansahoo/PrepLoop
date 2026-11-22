import { describe, it, expect } from 'vitest';
import { getThinkingDelayMs, getQuestionTimeLimit, evaluateSpeakingPace } from './aiInterviewTiming';
import { shouldAutoSubmitAnswer, getAdaptiveSilenceMs } from '../hooks/useVoiceAI';

describe('AI interview timing helpers', () => {
  it('caps thinking delay at 800ms (with ±30% jitter)', () => {
    const result = getThinkingDelayMs('a'.repeat(1000));
    expect(result).toBeGreaterThanOrEqual(560);
    expect(result).toBeLessThanOrEqual(1000);
  });

  it('returns known stage timing', () => {
    expect(getQuestionTimeLimit('Technical')).toBe(90);
  });
});

describe('Real-time Speaking Pace Coach evaluation', () => {
  it('returns null if not listening or under minimum 3 seconds', () => {
    expect(evaluateSpeakingPace({ isListening: false })).toBeNull();
    expect(evaluateSpeakingPace({ durationSecs: 2, isListening: true })).toBeNull();
  });

  it('detects optimal speaking pace (120-160 WPM)', () => {
    // 70 words in 30 seconds = 140 WPM
    const coach = evaluateSpeakingPace({ wordCount: 70, durationSecs: 30, isListening: true });
    expect(coach).toBeDefined();
    expect(coach.status).toBe('good');
    expect(coach.label).toBe('Optimal pace');
    expect(coach.wpm).toBe(140);
  });

  it('detects fast speaking pace (>165 WPM) and offers gentle slowing nudge', () => {
    // 100 words in 30 seconds = 200 WPM
    const coach = evaluateSpeakingPace({ wordCount: 100, durationSecs: 30, isListening: true });
    expect(coach).toBeDefined();
    expect(coach.status).toBe('fast');
    expect(coach.message).toMatch(/slow down slightly/i);
  });

  it('detects slow speaking pace (<100 WPM) and offers gentle momentum nudge', () => {
    // 25 words in 20 seconds = 75 WPM
    const coach = evaluateSpeakingPace({ wordCount: 25, durationSecs: 20, isListening: true });
    expect(coach).toBeDefined();
    expect(coach.status).toBe('slow');
    expect(coach.message).toMatch(/pick up momentum/i);
  });

  it('detects sparse/terse responses (>10s active with <=7 words) and nudges elaboration', () => {
    const coach = evaluateSpeakingPace({ wordCount: 4, durationSecs: 14, isListening: true });
    expect(coach).toBeDefined();
    expect(coach.status).toBe('sparse');
    expect(coach.label).toBe('Elaborate');
    expect(coach.message).toMatch(/elaborate with an example/i);
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
