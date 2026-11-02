import { describe, it, expect } from 'vitest';

describe('Voice Service Unit Tests', () => {
  describe('Language Allowlist & Normalization', () => {
    const ALLOWED_LANGUAGES = new Set(['en', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ar']);

    function normalizeLang(language: any): string {
      const normalizedLang = String(language || 'en').toLowerCase().slice(0, 2);
      return ALLOWED_LANGUAGES.has(normalizedLang) ? normalizedLang : 'en';
    }

    it('accepts known supported languages', () => {
      expect(normalizeLang('en')).toBe('en');
      expect(normalizeLang('hi')).toBe('hi');
      expect(normalizeLang('es')).toBe('es');
      expect(normalizeLang('ja')).toBe('ja');
    });

    it('handles case-insensitivity cleanly', () => {
      expect(normalizeLang('HI')).toBe('hi');
      expect(normalizeLang('EN')).toBe('en');
      expect(normalizeLang('Es')).toBe('es');
    });

    it('defaults invalid, empty, or nil values to English (en)', () => {
      expect(normalizeLang('xx')).toBe('en');
      expect(normalizeLang('')).toBe('en');
      expect(normalizeLang(null)).toBe('en');
      expect(normalizeLang(undefined)).toBe('en');
    });

    it('neutralizes path traversal and script injection attempts', () => {
      expect(normalizeLang('../../etc/passwd')).toBe('en');
      expect(normalizeLang('<script>alert(1)</script>')).toBe('en');
    });

    it('normalizes longer descriptive prefixes to two-letter code', () => {
      expect(normalizeLang('hindi')).toBe('hi');
      expect(normalizeLang('english-us')).toBe('en');
    });
  });

  describe('Kokoro Retry & Cooldown Management', () => {
    const KOKORO_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
    let kokoroInitFailed = false;
    let kokoroFailedAt = 0;

    function shouldRetryKokoro(): boolean {
      if (kokoroInitFailed) {
        if (Date.now() - kokoroFailedAt < KOKORO_RETRY_COOLDOWN_MS) return false;
        kokoroInitFailed = false;
        return true;
      }
      return true;
    }

    it('permits retry when never failed', () => {
      kokoroInitFailed = false;
      expect(shouldRetryKokoro()).toBe(true);
    });

    it('suppresses immediate retries during cooldown period', () => {
      kokoroInitFailed = true;
      kokoroFailedAt = Date.now();
      expect(shouldRetryKokoro()).toBe(false);
    });

    it('resets failure flag and allows retry once cooldown period has elapsed', () => {
      kokoroInitFailed = true;
      kokoroFailedAt = Date.now() - KOKORO_RETRY_COOLDOWN_MS - 1;
      expect(shouldRetryKokoro()).toBe(true);
      expect(kokoroInitFailed).toBe(false);
    });
  });

  describe('Virtual Session TTL & Capacity Eviction', () => {
    const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
    const SESSION_MAX_SIZE = 3;

    function evictSessions(sessions: Map<string, { _createdAt?: number }>): number {
      const now = Date.now();
      let evicted = 0;
      for (const [key, session] of sessions) {
        if (now - (session._createdAt || 0) > SESSION_TTL_MS) {
          sessions.delete(key);
          evicted++;
        }
      }
      if (sessions.size > SESSION_MAX_SIZE) {
        const sorted = [...sessions.entries()]
          .sort((a, b) => (a[1]._createdAt || 0) - (b[1]._createdAt || 0));
        const toRemove = sorted.slice(0, sessions.size - SESSION_MAX_SIZE);
        for (const [key] of toRemove) {
          sessions.delete(key);
          evicted++;
        }
      }
      return evicted;
    }

    it('evicts expired sessions past the TTL window', () => {
      const sessions = new Map();
      sessions.set('old', { _createdAt: Date.now() - SESSION_TTL_MS - 1000 });
      sessions.set('new', { _createdAt: Date.now() });

      const evicted = evictSessions(sessions);
      expect(evicted).toBe(1);
      expect(sessions.has('old')).toBe(false);
      expect(sessions.has('new')).toBe(true);
    });

    it('enforces maximum session capacity by removing oldest active sessions', () => {
      const sessions = new Map();
      for (let i = 0; i < 5; i++) {
        sessions.set(`s${i}`, { _createdAt: Date.now() - i * 1000 });
      }

      const evicted = evictSessions(sessions);
      expect(sessions.size).toBe(SESSION_MAX_SIZE);
      expect(evicted).toBe(2);
      expect(sessions.has('s4')).toBe(false); // Oldest
      expect(sessions.has('s3')).toBe(false);
      expect(sessions.has('s0')).toBe(true);  // Newest
    });
  });

  describe('Deepgram Key Exposure Prevention', () => {
    function isDeepgramAvailable(providers: Record<string, any>): boolean {
      return Boolean(providers.deepgram);
    }

    it('returns boolean availability without exposing internal api keys', () => {
      expect(isDeepgramAvailable({ deepgram: 'sk-secret-key-123' })).toBe(true);
      expect(isDeepgramAvailable({ deepgram: false })).toBe(false);
      expect(typeof isDeepgramAvailable({ deepgram: 'sk-secret-key-123' })).toBe('boolean');
    });
  });
});
