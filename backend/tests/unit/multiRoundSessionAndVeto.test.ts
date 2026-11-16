import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import {
  evaluateBarRaiserDecision,
  getRoundThreshold,
  normalizeRoundType,
  BAR_RAISER_THRESHOLDS
} from '../../services/hiringDecisionService.js';
import multiRoundSessionRouter from '../../routes/company-interview/multiRoundSession.js';

function createMockResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: null as any,
    setHeader(name: string, value: any) {
      headers.set(name, value);
    },
    getHeader(name: string) {
      return headers.get(name);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };
}

describe('Bar-Raiser Veto Evaluation & Multi-Round Logic', () => {
  describe('Round Type & Threshold Normalization', () => {
    it('normalizes round types correctly', () => {
      expect(normalizeRoundType('dsa')).toBe('dsa');
      expect(normalizeRoundType('DSA / Coding')).toBe('dsa');
      expect(normalizeRoundType('algorithm round')).toBe('dsa');
      expect(normalizeRoundType('System Design')).toBe('system-design');
      expect(normalizeRoundType('system_design')).toBe('system-design');
      expect(normalizeRoundType('architecture')).toBe('system-design');
      expect(normalizeRoundType('Behavioral')).toBe('behavioral');
      expect(normalizeRoundType('leadership principles')).toBe('behavioral');
      expect(normalizeRoundType('HR Discussion')).toBe('hr');
      expect(normalizeRoundType('unknown-round')).toBe('default');
    });

    it('enforces mandatory bar-raiser thresholds per competency', () => {
      expect(getRoundThreshold('dsa')).toBe(65);
      expect(getRoundThreshold('System Design')).toBe(60);
      expect(getRoundThreshold('Behavioral')).toBe(60);
      expect(getRoundThreshold('HR')).toBe(55);
      expect(getRoundThreshold('other')).toBe(60);
    });

    it('allows custom threshold overrides', () => {
      expect(getRoundThreshold('dsa', { dsa: 75 })).toBe(75);
    });
  });

  describe('Bar-Raiser Veto Decision Logic', () => {
    it('triggers Bar-Raiser Veto when Technical Coding fails despite high overall average', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 50 }, // Threshold 65 -> VETO
        { roundId: 'system-design', name: 'System Design', score: 90 }, // Threshold 60 -> PASS
        { roundId: 'behavioral', name: 'Behavioral', score: 95 } // Threshold 60 -> PASS
      ];

      // Arithmetic average is (50 + 90 + 95) / 3 = 78.3%, but candidate failed coding!
      const decision = evaluateBarRaiserDecision({ roundScores: rounds, company: 'google', role: 'SDE' });

      expect(decision.vetoTriggered).toBe(true);
      expect(decision.status).toBe('VETOED');
      expect(decision.verdict).toBe('No Hire (Bar-Raiser Veto)');
      expect(decision.badge).toContain('Vetoed');
      expect(decision.color).toBe('#ef4444');
      expect(decision.averageScore).toBe(78);
      expect(decision.vetoReasons.length).toBe(1);
      expect(decision.vetoReasons[0]).toMatch(/DSA \/ Coding.*failed.*threshold of 65%/i);
      expect(decision.recommendation).toContain('Bar-Raiser Veto');
    });

    it('triggers Bar-Raiser Veto when System Design fails threshold', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 85 },
        { roundId: 'system-design', name: 'System Design', score: 55 }, // Threshold 60 -> VETO
        { roundId: 'behavioral', name: 'Behavioral', score: 80 }
      ];

      const decision = evaluateBarRaiserDecision({ roundScores: rounds, company: 'amazon', role: 'SDE-2' });

      expect(decision.vetoTriggered).toBe(true);
      expect(decision.status).toBe('VETOED');
      expect(decision.vetoReasons[0]).toMatch(/System Design.*failed.*threshold of 60%/i);
    });

    it('triggers Bar-Raiser Veto when Behavioral fails threshold', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 90 },
        { roundId: 'system-design', name: 'System Design', score: 85 },
        { roundId: 'behavioral', name: 'Behavioral', score: 50 } // Threshold 60 -> VETO
      ];

      const decision = evaluateBarRaiserDecision({ roundScores: rounds, company: 'meta', role: 'Software Engineer' });

      expect(decision.vetoTriggered).toBe(true);
      expect(decision.status).toBe('VETOED');
      expect(decision.vetoReasons[0]).toMatch(/Behavioral.*failed.*threshold of 60%/i);
    });

    it('awards Strong Hire when all rounds exceed thresholds with top scores', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 92 },
        { roundId: 'system-design', name: 'System Design', score: 88 },
        { roundId: 'behavioral', name: 'Behavioral', score: 85 }
      ];

      const decision = evaluateBarRaiserDecision({ roundScores: rounds, company: 'google', role: 'Staff SDE' });

      expect(decision.vetoTriggered).toBe(false);
      expect(decision.status).toBe('STRONG_HIRE');
      expect(decision.verdict).toContain('Strong Hire');
      expect(decision.color).toBe('#22c55e');
      expect(decision.roundEvaluations.every((r) => r.passed && !r.veto)).toBe(true);
    });

    it('awards Would Advance when all rounds pass with solid scores (>=70%)', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 75 },
        { roundId: 'system-design', name: 'System Design', score: 72 },
        { roundId: 'behavioral', name: 'Behavioral', score: 70 }
      ];

      const decision = evaluateBarRaiserDecision({ roundScores: rounds });

      expect(decision.vetoTriggered).toBe(false);
      expect(decision.status).toBe('HIRE');
      expect(decision.verdict).toContain('Would Advance');
      expect(decision.color).toBe('#3b82f6');
    });

    it('awards Borderline when all rounds meet minimums near margin (60-69%)', () => {
      const rounds = [
        { roundId: 'dsa', name: 'DSA / Coding', score: 65 }, // Exactly at threshold
        { roundId: 'system-design', name: 'System Design', score: 60 }, // Exactly at threshold
        { roundId: 'behavioral', name: 'Behavioral', score: 60 } // Exactly at threshold
      ];

      const decision = evaluateBarRaiserDecision({ roundScores: rounds });

      expect(decision.vetoTriggered).toBe(false);
      expect(decision.status).toBe('BORDERLINE');
      expect(decision.verdict).toContain('Borderline');
      expect(decision.color).toBe('#f59e0b');
    });

    it('handles empty round scores gracefully with PENDING status', () => {
      const decision = evaluateBarRaiserDecision({ roundScores: [] });

      expect(decision.status).toBe('PENDING');
      expect(decision.vetoTriggered).toBe(false);
      expect(decision.averageScore).toBe(0);
    });
  });
});

describe('Multi-Round Session API Endpoints', () => {
  it('POST /multi-round/session creates a new guest session with UUID and initial state', async () => {
    const postHandler = (multiRoundSessionRouter as any).stack.find(
      (layer: any) => layer.route && layer.route.path === '/multi-round/session' && layer.route.methods.post
    )?.route?.stack?.slice(-1)[0]?.handle;

    expect(postHandler).toBeDefined();

    const req: any = {
      user: null,
      body: {
        company: 'google',
        role: 'SDE',
        selectedRounds: ['dsa', 'system-design']
      }
    };
    const res = createMockResponse();

    await postHandler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.guest).toBe(true);
    expect(res.body.session.company).toBe('google');
    expect(res.body.session.role).toBe('SDE');
    expect(res.body.session.current_round).toBe(0);
    expect(res.body.session.round_scores).toEqual([]);
    expect(res.body.session.status).toBe('in_progress');
    // Session ID is a valid UUID
    expect(res.body.session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('PUT /multi-round/session/:id checkpoints completed round and triggers veto evaluation on loop completion', async () => {
    const putHandler = (multiRoundSessionRouter as any).stack.find(
      (layer: any) => layer.route && layer.route.path === '/multi-round/session/:id' && layer.route.methods.put
    )?.route?.stack?.slice(-1)[0]?.handle;

    expect(putHandler).toBeDefined();

    const testId = crypto.randomUUID();
    const req: any = {
      params: { id: testId },
      user: null,
      body: {
        current_round: 3,
        totalRounds: 3,
        status: 'completed',
        company: 'google',
        role: 'SDE',
        roundScores: [
          { roundId: 'dsa', name: 'DSA / Coding', score: 50 }, // VETO
          { roundId: 'system-design', name: 'System Design', score: 85 },
          { roundId: 'behavioral', name: 'Behavioral', score: 90 }
        ]
      }
    };
    const res = createMockResponse();

    await putHandler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session.status).toBe('completed');
    expect(res.body.hiringDecision).toBeDefined();
    expect(res.body.hiringDecision.vetoTriggered).toBe(true);
    expect(res.body.hiringDecision.status).toBe('VETOED');
    expect(res.body.hiringDecision.verdict).toBe('No Hire (Bar-Raiser Veto)');
  });

  it('PUT /multi-round/session/:id requires valid session id parameter', async () => {
    const putHandler = (multiRoundSessionRouter as any).stack.find(
      (layer: any) => layer.route && layer.route.path === '/multi-round/session/:id' && layer.route.methods.put
    )?.route?.stack?.slice(-1)[0]?.handle;

    const req: any = {
      params: { id: '   ' },
      body: {}
    };
    const res = createMockResponse();

    await putHandler(req, res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/session id is required/i);
  });

  it('GET /multi-round/session/:id returns 404 for nonexistent UUID session', async () => {
    const getHandler = (multiRoundSessionRouter as any).stack.find(
      (layer: any) => layer.route && layer.route.path === '/multi-round/session/:id' && layer.route.methods.get
    )?.route?.stack?.slice(-1)[0]?.handle;

    expect(getHandler).toBeDefined();

    const nonExistentId = crypto.randomUUID();
    const req: any = {
      params: { id: nonExistentId },
      user: null
    };
    const res = createMockResponse();

    await getHandler(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /multi-round/session/:id rejects invalid non-UUID format with 404', async () => {
    const getHandler = (multiRoundSessionRouter as any).stack.find(
      (layer: any) => layer.route && layer.route.path === '/multi-round/session/:id' && layer.route.methods.get
    )?.route?.stack?.slice(-1)[0]?.handle;

    const req: any = {
      params: { id: 'invalid-id' },
      user: null
    };
    const res = createMockResponse();

    await getHandler(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
