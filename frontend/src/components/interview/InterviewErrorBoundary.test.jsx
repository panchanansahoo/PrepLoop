import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearInterviewSessionStorage,
  INTERVIEW_SESSION_STORAGE_KEYS,
} from './InterviewErrorBoundary';

describe('InterviewErrorBoundary session cleanup', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clears all interview session storage keys on reset', () => {
    INTERVIEW_SESSION_STORAGE_KEYS.forEach((key) => {
      window.localStorage.setItem(key, 'stale-session-value');
    });

    clearInterviewSessionStorage();

    INTERVIEW_SESSION_STORAGE_KEYS.forEach((key) => {
      expect(window.localStorage.getItem(key)).toBeNull();
    });
  });
});
