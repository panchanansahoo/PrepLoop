import { describe, expect, it } from 'vitest';
import {
  AUTO_SUBMIT_DELAY_MS,
  SILENCE_TO_NEXT_QUESTION_MS,
  VOICE_INPUT_COMMIT_DELAY_MS,
  buildVoiceAnswerSnapshot,
  formatInterviewDuration,
} from './companyInterviewTiming';

describe('companyInterviewTiming', () => {
  it('uses the interview timing thresholds for pause submit and silence advance', () => {
    expect(AUTO_SUBMIT_DELAY_MS).toBe(4000);
    expect(SILENCE_TO_NEXT_QUESTION_MS).toBe(10000);
    expect(VOICE_INPUT_COMMIT_DELAY_MS).toBe(180);
  });

  it('formats interview duration as mm:ss', () => {
    expect(formatInterviewDuration(0)).toBe('00:00');
    expect(formatInterviewDuration(367)).toBe('06:07');
  });

  it('builds answer snapshot from typed input first', () => {
    expect(buildVoiceAnswerSnapshot({
      userInput: '  typed response  ',
      accumulatedTranscript: 'spoken final',
      interimText: 'interim words',
    })).toBe('typed response');
  });

  it('falls back to committed + interim voice text when typed input is empty', () => {
    expect(buildVoiceAnswerSnapshot({
      userInput: '   ',
      accumulatedTranscript: 'spoken final',
      interimText: 'plus interim',
    })).toBe('spoken final plus interim');
  });

  it('returns empty string when no voice text exists', () => {
    expect(buildVoiceAnswerSnapshot({
      userInput: '',
      accumulatedTranscript: ' ',
      interimText: '',
    })).toBe('');
  });
});
