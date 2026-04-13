import { describe, expect, it, beforeEach } from 'vitest';
import { buildInterviewAuthInit, shouldInjectInterviewAuth } from './interviewRequestAuth';

describe('interviewRequestAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('injects auth for company interview endpoints', () => {
    localStorage.setItem('token', 'test-token');

    const nextInit = buildInterviewAuthInit('/api/company-interview/follow-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(nextInit.headers.Authorization).toBe('Bearer test-token');
  });

  it('injects auth for deepgram token endpoint', () => {
    sessionStorage.setItem('token', 'session-token');

    const nextInit = buildInterviewAuthInit('/api/voice/deepgram-token', { method: 'GET' });

    expect(nextInit.headers.Authorization).toBe('Bearer session-token');
  });

  it('does not inject auth for unrelated endpoints', () => {
    localStorage.setItem('token', 'test-token');

    const init = { method: 'GET', headers: { Accept: 'application/json' } };
    const nextInit = buildInterviewAuthInit('/api/health', init);

    expect(nextInit).toBe(init);
    expect(nextInit.headers.Authorization).toBeUndefined();
  });

  it('detects auth injection for absolute URLs on same origin', () => {
    expect(shouldInjectInterviewAuth('http://localhost:5173/api/company-interview/start')).toBe(true);
    expect(shouldInjectInterviewAuth('http://localhost:5173/api/voice/deepgram-token')).toBe(true);
  });
});
