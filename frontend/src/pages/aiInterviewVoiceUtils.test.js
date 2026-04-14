import { describe, expect, it, vi } from 'vitest';

import {
  splitTextForTTS,
  buildAiInterviewTtsPayload,
  buildAiInterviewVoiceApiUrl,
  buildInterviewEndCleanup,
} from './aiInterviewVoiceUtils';

describe('aiInterviewVoiceUtils', () => {
  it('splits long text into bounded TTS chunks', () => {
    const longText = `${'Sentence one. '.repeat(20)}Sentence end.`;
    const chunks = splitTextForTTS(longText, 90);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 90)).toBe(true);
    expect(chunks.join(' ')).toContain('Sentence end.');
  });

  it('builds expected TTS payload for backend /api/voice/tts contract', () => {
    expect(buildAiInterviewTtsPayload({ text: '  Hello\nthere ', interviewerGender: 'male' })).toEqual({
      text: 'Hello there',
      persona: 'interviewer',
      language: 'en',
      gender: 'male',
    });

    expect(buildAiInterviewTtsPayload({ text: 'Hi', interviewerGender: 'unknown' }).gender).toBe('female');
  });

  it('normalizes voice endpoint paths under /api', () => {
    expect(buildAiInterviewVoiceApiUrl('/voice/tts', 'http://localhost:5000')).toBe(
      'http://localhost:5000/api/voice/tts',
    );

    expect(buildAiInterviewVoiceApiUrl('voice/tts', 'http://localhost:5000/api')).toBe(
      'http://localhost:5000/api/voice/tts',
    );
  });

  it('builds end interview cleanup callback with safe optional guards', () => {
    const clearPendingEndTimeout = vi.fn();
    const clearElapsedTimer = vi.fn();
    const stopVoiceRecording = vi.fn();
    const pauseCurrentTts = vi.fn();
    const cancelSpeechSynthesis = vi.fn();
    const setAiSpeaking = vi.fn();
    const setMicOn = vi.fn();
    const setPhase = vi.fn();

    const endInterview = buildInterviewEndCleanup({
      clearPendingEndTimeout,
      clearElapsedTimer,
      stopVoiceRecording,
      pauseCurrentTts,
      cancelSpeechSynthesis,
      setAiSpeaking,
      setMicOn,
      setPhase,
    });

    endInterview();

    expect(clearPendingEndTimeout).toHaveBeenCalledTimes(1);
    expect(clearElapsedTimer).toHaveBeenCalledTimes(1);
    expect(stopVoiceRecording).toHaveBeenCalledTimes(1);
    expect(pauseCurrentTts).toHaveBeenCalledTimes(1);
    expect(cancelSpeechSynthesis).toHaveBeenCalledTimes(1);
    expect(setAiSpeaking).toHaveBeenCalledWith(false);
    expect(setMicOn).toHaveBeenCalledWith(false);
    expect(setPhase).toHaveBeenCalledWith('summary');
  });
});
