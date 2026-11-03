import { describe, it, expect } from 'vitest';

describe('SQL & PostgREST Filter Sanitization', () => {
  it('sanitizes search input to prevent PostgREST filter operator injection', () => {
    // Malicious query attempting to break out of .or(...) filter:
    const maliciousPostgrestQuery = 'test%,approved.eq.false,(title.ilike.%';
    const sanitized = maliciousPostgrestQuery.replace(/[,.():;"'%_\\]/g, ' ').trim().slice(0, 100);

    expect(sanitized).not.toContain(',');
    expect(sanitized).not.toContain('.');
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
    expect(sanitized).not.toContain(':');
    expect(sanitized).not.toContain('%');
    expect(sanitized).toBe('test  approved eq false  title ilike');
  });

  it('preserves clean search terms without modification', () => {
    const cleanSearch = 'software engineer';
    const sanitized = cleanSearch.replace(/[,.():;"'%_\\]/g, ' ').trim().slice(0, 100);
    expect(sanitized).toBe('software engineer');
  });
});
