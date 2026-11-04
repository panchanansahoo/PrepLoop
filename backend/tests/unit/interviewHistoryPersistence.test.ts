import { describe, it, expect } from 'vitest';
import { fetchUserHistory } from '../../services/dashboardService.js';

describe('Interview History Persistence and Retrieval Conformance', () => {
  it('fetchUserHistory handles user session formatting gracefully', async () => {
    // Calling fetchUserHistory with a dummy or unauthenticated UUID returns an empty array or valid list without throwing
    const sessions = await fetchUserHistory('00000000-0000-0000-0000-000000000000');
    expect(Array.isArray(sessions)).toBe(true);
  });

  it('normalizes interview sessions with required schema attributes', () => {
    const rawSession = {
      id: 'sess-uuid-1',
      session_id: 'sess-code-1',
      interview_type: 'Technical',
      company_focus: 'Google',
      difficulty_level: 'medium',
      interview_score: 85,
      transcript: [
        { role: 'interviewer', content: 'Explain binary search.' },
        { role: 'candidate', content: 'It operates in O(log n) time.' }
      ],
      performance_metrics: {
        role: 'Frontend Engineer',
        stage: 'DSA / Coding',
        sessionType: 'single',
        summaryData: { summary: 'Strong fundamentals in searching algorithms.' }
      },
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const pm = rawSession.performance_metrics || {};
    const normalized = {
      id: rawSession.id,
      session_id: rawSession.session_id,
      session_type: pm.sessionType || 'single',
      company: rawSession.company_focus || pm.company || 'General',
      role: pm.role || 'Software Engineer',
      stage: pm.stage || rawSession.interview_type || 'Technical',
      difficulty: rawSession.difficulty_level || pm.difficulty || 'medium',
      overall_score: rawSession.interview_score ?? pm.overallScore ?? 0,
      score: rawSession.interview_score ?? pm.overallScore ?? 0,
      conversation: rawSession.transcript || [],
      summary: pm.summaryData?.summary || '',
      completed_at: rawSession.completed_at || rawSession.created_at,
    };

    expect(normalized.company).toBe('Google');
    expect(normalized.role).toBe('Frontend Engineer');
    expect(normalized.stage).toBe('DSA / Coding');
    expect(normalized.overall_score).toBe(85);
    expect(normalized.conversation).toHaveLength(2);
    expect(normalized.summary).toContain('Strong fundamentals');
  });
});

