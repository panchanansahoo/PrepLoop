import { describe, it, expect } from 'vitest';
import {
  normalizeInterviewLimits,
  verifyInterviewInviteeEmail,
  generateInterviewToken,
  isValidInterviewToken,
} from '../../utils/privateInterviewAccess.js';
import nvidiaVoiceService from '../../services/nvidiaVoiceService.js';

describe('NVIDIA VoiceChat & Private Interview Access Unit Tests', () => {
  it('properly formats and lowercases email allowlists', () => {
    const normalizedEmpty = normalizeInterviewLimits({});
    expect(normalizedEmpty.allowedEmails).toEqual([]);

    const normalizedLimits = normalizeInterviewLimits({
      allowedEmails: [' Alice@Example.com ', 'BOB@work.co', ''],
    });
    expect(normalizedLimits.allowedEmails).toEqual(['alice@example.com', 'bob@work.co']);
  });

  it('enforces invitee access permissions accurately', () => {
    expect(verifyInterviewInviteeEmail('anyone@test.com', [])).toBe(true);
    expect(verifyInterviewInviteeEmail('ALICE@example.com', ['alice@example.com', 'bob@work.co'])).toBe(true);
    expect(verifyInterviewInviteeEmail(null, ['alice@example.com'])).toBe(false);
    expect(verifyInterviewInviteeEmail('eve@intruder.com', ['alice@example.com'])).toBe(false);
  });

  it('reports configuration and security status from nvidiaVoiceService', () => {
    const status = nvidiaVoiceService.getStatus();
    expect(typeof status.available).toBe('boolean');
    expect(status.provider).toBe('NVIDIA Nemotron VoiceChat');
    expect(status.model).toBe('nvidia/llama-3.1-nemotron-70b-instruct');
    expect(status.transcriptPolicy).toBe('dual-track-retained');
    expect(status.backendProtected).toBe(true);
  });

  it('gracefully returns null from transition generation when service is unconfigured', async () => {
    const originalApiKey = nvidiaVoiceService.apiKey;
    try {
      nvidiaVoiceService.apiKey = '';
      const transitionResult = await nvidiaVoiceService.generateInterviewerTransition({
        currentQuestion: 'What is React fiber?',
        candidateAnswer: 'It is a reconciliation engine that allows incremental rendering.',
        nextQuestion: 'Explain virtual DOM diffing.',
      });
      expect(transitionResult).toBeNull();
    } finally {
      nvidiaVoiceService.apiKey = originalApiKey;
    }
  });

  it('generates valid RFC 4122 v4 UUID tokens and parses URL links', () => {
    const token = generateInterviewToken();
    expect(typeof token).toBe('string');
    expect(token).toHaveLength(36);
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    expect(isValidInterviewToken(token)).toBe(true);
    expect(isValidInterviewToken('40247bbf-cace-43da-8a0e-87fe703b9f7f')).toBe(true);
    expect(isValidInterviewToken('legacy-share-code')).toBe(true);
    expect(isValidInterviewToken('')).toBe(false);
    expect(isValidInterviewToken('123')).toBe(false);

    const sampleCandidateUrl = `https://preploop.com/app?token=${token}`;
    const parsedUrl = new URL(sampleCandidateUrl);
    expect(parsedUrl.pathname).toBe('/app');
    expect(parsedUrl.searchParams.get('token')).toBe(token);
  });
});

