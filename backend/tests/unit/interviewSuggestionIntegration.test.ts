import { describe, it, expect, vi } from 'vitest';
import sessionRouter from '../../routes/interview/session.js';
import sessionIndexRouter from '../../routes/interview/index.js';
import { RealtimeInterviewService } from '../../services/realtimeInterviewService.js';
import { ProactiveSuggestionService } from '../../services/interviewSuggestionService.js';

describe('Interview Suggestion Endpoints & WebSocket Integration', () => {
  describe('REST Endpoints: /suggestion & /tiered-hint', () => {
    it('finds /suggestion and /tiered-hint registered in session router', () => {
      const routes = sessionRouter.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const suggestionRoute = routes.find((r: any) => r.path === '/suggestion');
      expect(suggestionRoute).toBeDefined();
      expect(suggestionRoute?.methods).toContain('post');

      const tieredHintRoute = routes.find((r: any) => r.path === '/tiered-hint');
      expect(tieredHintRoute).toBeDefined();
      expect(tieredHintRoute?.methods).toContain('post');
    });

    it('correctly handles POST /suggestion payload and returns suggestion response', async () => {
      const suggestionLayer = sessionRouter.stack.find(
        (layer: any) => layer.route && layer.route.path === '/suggestion'
      );
      expect(suggestionLayer).toBeDefined();

      const handlers = suggestionLayer.route.stack.map((s: any) => s.handle);
      const mainHandler = handlers[handlers.length - 1];

      const req: any = {
        body: {
          interviewType: 'dsa',
          stage: 'technical',
          silenceDurationSec: 30,
          missingAreas: ['edge cases'],
        },
        headers: {},
      };

      let jsonResult: any = null;
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          jsonResult = data;
        }),
      };

      await mainHandler(req, res);

      expect(jsonResult).toBeDefined();
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.silenceThresholdSec).toBe(25);
      expect(jsonResult.isSilenceExceeded).toBe(true);
      expect(jsonResult.suggestions).toBeDefined();
      expect(jsonResult.suggestions.effectiveTier).toBe(2);
      expect(jsonResult.suggestions.approachOptions.length).toBeGreaterThan(0);
    });

    it('correctly handles POST /tiered-hint payload for tier 1 coaching cue', async () => {
      const hintLayer = sessionRouter.stack.find(
        (layer: any) => layer.route && layer.route.path === '/tiered-hint'
      );
      expect(hintLayer).toBeDefined();

      const handlers = hintLayer.route.stack.map((s: any) => s.handle);
      const mainHandler = handlers[handlers.length - 1];

      const req: any = {
        body: {
          tier: 1,
          interviewType: 'dsa',
          stage: 'technical',
          weakestDimension: 'clarity',
        },
        headers: {},
      };

      let jsonResult: any = null;
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          jsonResult = data;
        }),
      };

      await mainHandler(req, res);

      expect(jsonResult).toBeDefined();
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.tier).toBe(1);
      expect(jsonResult.hint).toBeDefined();
      expect(jsonResult.hint.type).toBe('coaching_cue');
      expect(jsonResult.hint.content).toContain('concept');
    });
  });

  describe('WebSocket Integration: RealtimeInterviewService handleSuggestion', () => {
    it('dispatches proactive suggestions to websocket client on silence_detected', () => {
      const service = new RealtimeInterviewService({} as any);
      const sentMessages: any[] = [];

      const mockWs: any = {
        readyState: 1, // OPEN
        send: vi.fn((payload: string) => {
          sentMessages.push(JSON.parse(payload));
        }),
      };

      const session: any = {
        ws: mockWs,
        context: {
          interviewType: 'dsa',
          stage: 'technical',
          problemStatement: 'Reverse linked list',
          turns: 2,
          consecutiveLowScores: 0,
        },
      };

      service.handleSuggestion(session, {
        type: 'silence_detected',
        silenceDurationSec: 28,
      });

      expect(sentMessages).toHaveLength(1);
      const msg = sentMessages[0];
      expect(msg.type).toBe('proactive_suggestion');
      expect(msg.silenceThresholdSec).toBe(25);
      expect(msg.isSilenceExceeded).toBe(true);
      expect(msg.suggestions).toBeDefined();
      expect(msg.suggestions.approachOptions.length).toBeGreaterThan(0);
    });
  });
});
