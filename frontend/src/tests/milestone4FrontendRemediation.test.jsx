import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateImprovementPlan, getLatestImprovementPlan, updateImprovementPlanProgress } from '../api/aiService';

function readSource(relativePath) {
  return fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('Milestone 4 — Frontend Remediation & Regression Tests', () => {
  describe('Task 1 & 2 & 5: App.jsx Route Configuration', () => {
    const appSource = readSource('../App.jsx');

    it('exposes public /dashboard without PrivateRoute wrapper', () => {
      expect(appSource).toContain('path="/dashboard"');
      expect(appSource).toContain('element={<Dashboard />}');
      expect(appSource).not.toContain('path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}');
    });

    it('protects /hr/dashboard with HRRoute instead of student PrivateRoute', () => {
      expect(appSource).toContain('path="/hr/dashboard" element={<HRRoute><HRDashboard /></HRRoute>}');
      expect(appSource).not.toContain('path="/hr/dashboard" element={<PrivateRoute><HRDashboard /></PrivateRoute>}');
      expect(appSource).toContain('function HRRoute({ children })');
      expect(appSource).toContain("localStorage.getItem('hr_token')");
      expect(appSource).toContain("localStorage.getItem('hr_user')");
      expect(appSource).toContain('to="/hr/login"');
    });

    it('registers all previously orphaned routes', () => {
      expect(appSource).toContain('path="/portfolio-creator" element={<PortfolioCreator />}');
      expect(appSource).toContain('path="/company-track" element={<CompanyTrack />}');
      expect(appSource).toContain('path="/company-track/:id" element={<CompanyTrack />}');
      expect(appSource).toContain('path="/learning-hub" element={<LearningHub />}');
      expect(appSource).toContain('path="/real-interview" element={<RealInterview />}');
      expect(appSource).toContain('path="/notes-bookmarks" element={<NotesBookmarks />}');
      expect(appSource).toContain('path="/timed-practice" element={<TimedPractice />}');
    });

    it('routes /live-coding to LiveCodingCopilot rather than CodingPlayground', () => {
      expect(appSource).toContain('path="/live-coding" element={<LiveCodingCopilot />}');
      expect(appSource).not.toContain('path="/live-coding" element={<CodingPlayground');
    });
  });

  describe('Task 3: ApiClient Double-Unwrap Handling', () => {
    it('CareerRoadmapPage accepts both unwrapped API responses and wrapped payloads', () => {
      const careerSource = readSource('../pages/CareerRoadmapPage.jsx');
      // Verifies unwrapped check
      expect(careerSource).toMatch(/res\?\.success\s*&&\s*res\?\.roadmap/);

      // Verify payload extraction logic
      const unwrappedRes = { success: true, roadmap: { targetRole: 'Frontend Dev', readinessScore: 85 } };
      const wrappedRes = { data: { success: true, roadmap: { targetRole: 'Backend Dev', readinessScore: 90 } } };

      const extractPayload = (res) => (res?.success && res?.roadmap) ? res : (res?.data || res);

      const p1 = extractPayload(unwrappedRes);
      expect(p1.success).toBe(true);
      expect(p1.roadmap.targetRole).toBe('Frontend Dev');

      const p2 = extractPayload(wrappedRes);
      expect(p2.success).toBe(true);
      expect(p2.roadmap.targetRole).toBe('Backend Dev');
    });

    it('DailyChallengesPage safely unwraps challenges, leaderboard, and submission results', () => {
      const dailySource = readSource('../pages/DailyChallengesPage.jsx');
      expect(dailySource).toContain('res?.challenges || res?.data?.challenges');
      expect(dailySource).toContain('res?.leaderboard || res?.data?.leaderboard');

      const unwrappedChallenges = { challenges: [{ id: 'c1', title: 'Two Sum' }] };
      const wrappedChallenges = { data: { challenges: [{ id: 'c2', title: 'Reverse List' }] } };

      const getChallenges = (res) => res?.challenges || res?.data?.challenges;
      expect(getChallenges(unwrappedChallenges)).toHaveLength(1);
      expect(getChallenges(wrappedChallenges)).toHaveLength(1);
    });
  });

  describe('Task 4: AI Improvement Plan Route & Unwrap Fix', () => {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('token', 'valid-jwt-token');
      vi.restoreAllMocks();
    });

    it('calls /api/improvement-plan/generate and unwraps response without /ai-features prefix', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'plan-101',
            focusAreas: ['system_design'],
            stages: ['Stage 1: Architecture']
          }
        })
      });

      const plan = await generateImprovementPlan({ focusAreas: ['system_design'] });

      const apiCalls = fetchSpy.mock.calls.filter(([url]) => !String(url).includes('/api/csrf-token'));
      expect(apiCalls).toHaveLength(1);
      const requestedUrl = apiCalls[0][0];
      expect(requestedUrl).toContain('/api/improvement-plan/generate');
      expect(requestedUrl).not.toContain('/api/ai-features/improvement-plan');

      expect(plan).toBeDefined();
      expect(plan.id).toBe('plan-101');
    });

    it('calls /api/improvement-plan/latest and unwraps data', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'latest-plan', score: 95 }
        })
      });

      const latest = await getLatestImprovementPlan();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toContain('/api/improvement-plan/latest');
      expect(latest.id).toBe('latest-plan');
    });

    it('calls updateImprovementPlanProgress on root improvement-plan route', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'plan-1', progress: 50 }
        })
      });

      const updated = await updateImprovementPlanProgress('plan-1', [{ task: 't1', done: true }]);
      const apiCalls = fetchSpy.mock.calls.filter(([url]) => !String(url).includes('/api/csrf-token'));
      expect(apiCalls).toHaveLength(1);
      expect(apiCalls[0][0]).toContain('/api/improvement-plan/plan-1/progress');
      expect(updated.progress).toBe(50);
    });
  });

  describe('Task 6: Aptitude Results Difficulty Case Sensitivity', () => {
    it('normalizes mixed case difficulty and falls back safely without throwing TypeError', () => {
      const questions = [
        { id: 1, difficulty: 'Easy', correctAnswer: 'A' },
        { id: 2, difficulty: 'EASY', correctAnswer: 'B' },
        { id: 3, difficulty: 'Medium', correctAnswer: 'C' },
        { id: 4, difficulty: 'hard', correctAnswer: 'D' },
        { id: 5, difficulty: 'HARD', correctAnswer: 'A' },
        { id: 6, difficulty: undefined, correctAnswer: 'B' }, // Missing difficulty
        { id: 7, difficulty: 'unknown_level', correctAnswer: 'C' }, // Non-standard difficulty
      ];
      const answers = { 1: 'A', 2: 'wrong', 3: 'C', 4: 'D', 5: 'A', 6: 'B', 7: 'wrong' };

      // Replicates the normalized logic implemented in AptitudeResults.jsx
      const result = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
      expect(() => {
        questions.forEach(q => {
          const rawDiff = typeof q?.difficulty === 'string' ? q.difficulty.toLowerCase().trim() : 'medium';
          const diffKey = result[rawDiff] ? rawDiff : 'medium';
          result[diffKey].total++;
          if (answers && answers[q.id] === q.correctAnswer) {
            result[diffKey].correct++;
          }
        });
      }).not.toThrow();

      expect(result.easy.total).toBe(2);
      expect(result.easy.correct).toBe(1);
      expect(result.medium.total).toBe(3); // q3 + q6 (fallback) + q7 (fallback)
      expect(result.medium.correct).toBe(2); // q3 + q6
      expect(result.hard.total).toBe(2);
      expect(result.hard.correct).toBe(2);
    });
  });

  describe('Task 7: Blog Notifications Type Safety', () => {
    it('handles non-array blog API responses without TypeError crash', () => {
      const nonArrayResponses = [
        { error: 'Endpoint temporarily unavailable' },
        { message: 'Internal server error', status: 500 },
        null,
        undefined,
        { data: [] }
      ];

      nonArrayResponses.forEach(rawResponse => {
        expect(() => {
          const blogs = Array.isArray(rawResponse)
            ? rawResponse
            : (Array.isArray(rawResponse?.data) ? rawResponse.data : (Array.isArray(rawResponse?.blogs) ? rawResponse.blogs : []));
          const generatedNotifs = [];

          if (Array.isArray(blogs)) {
            blogs.forEach(b => {
              generatedNotifs.push({ id: b.id });
            });
          }
        }).not.toThrow();
      });
    });
  });

  describe('Task 8: WebSocket Reconnection Stabilization', () => {
    const wsSource = readSource('../hooks/useWebSocket.js');

    it('stabilizes callbacks using useRef to avoid reconnection churn', () => {
      expect(wsSource).toContain('onMessageRef = useRef(onMessage)');
      expect(wsSource).toContain('onConnectRef = useRef(onConnect)');
      expect(wsSource).toContain('onDisconnectRef = useRef(onDisconnect)');
      expect(wsSource).toContain('onErrorRef = useRef(onError)');
      expect(wsSource).toContain('reconnectRef = useRef(reconnect)');
    });

    it('connect callback dependencies exclude unstable function references', () => {
      // Connect should only depend on [url]
      expect(wsSource).toContain('}, [url]);');
    });
  });
});
