import { describe, it, expect } from 'vitest';
import { redactTranscriptText, redactTranscriptTurns } from '../../services/resumeRedactor.js';

describe('Transcript PII Redaction Engine (Track 3.3)', () => {
  it('redacts phone numbers, emails, and links from candidate transcript text', () => {
    const raw = 'You can reach me at john.doe@example.com or +1 415-555-1234, or my portfolio at https://johndoe.dev';
    const redacted = redactTranscriptText(raw);

    expect(redacted).not.toContain('john.doe@example.com');
    expect(redacted).not.toContain('415-555-1234');
    expect(redacted).not.toContain('https://johndoe.dev');
    expect(redacted).toContain('[REDACTED_EMAIL]');
    expect(redacted).toContain('[REDACTED_PHONE]');
    expect(redacted).toContain('[REDACTED_LINK]');
  });

  it('redacts government ID / SSN patterns if candidate speaks them', () => {
    const raw = 'My verification ID was 123-45-6789 during the background check';
    const redacted = redactTranscriptText(raw);
    expect(redacted).not.toContain('123-45-6789');
    expect(redacted).toContain('[REDACTED_SSN]');
  });

  it('preserves clean technical transcript text without false positives', () => {
    const technical = 'I used binary search over 2020-2024 data to optimize cache lookups with O(log n) time complexity.';
    const redacted = redactTranscriptText(technical);
    expect(redacted).toBe(technical);
  });

  it('redacts turn arrays recursively before database persistence', () => {
    const turns = [
      { role: 'interviewer', text: 'Tell me about yourself.' },
      { role: 'candidate', text: 'I am Alice at alice@gmail.com and my phone is 555-234-5678.', candidateResponse: 'alice@gmail.com' },
    ];
    const scrubbed = redactTranscriptTurns(turns);
    expect(scrubbed[1].text).toContain('[REDACTED_EMAIL]');
    expect(scrubbed[1].text).toContain('[REDACTED_PHONE]');
    expect(scrubbed[1].candidateResponse).toContain('[REDACTED_EMAIL]');
  });
});

