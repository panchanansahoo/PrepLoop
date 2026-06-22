import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInterviewHistory } from './aiService';

describe('aiService interview history mapping', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('normalizes session_id to sessionId for interview history rows', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'row-1',
            session_id: 'session-123',
            interview_type: 'dsa',
            difficulty_level: 'medium',
            interview_score: 82,
          },
        ],
      }),
    });

    const result = await getInterviewHistory(1, 10);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].sessionId).toBe('session-123');
    expect(result.data[0].session_id).toBe('session-123');
    expect(result.data[0].score).toBe(8.2);
  });
});
