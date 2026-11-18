import { describe, it, expect, vi } from 'vitest';
import * as helpers from '../../routes/interview/helpers.js';
import {
  resolveDynamicDifficulty,
  classifyCandidateAnswer,
  getFallbackQuestions,
} from '../../routes/interview/helpers.js';
import sessionRouter, {
  resolveDynamicDifficulty as routerResolveDynamicDifficulty,
  classifyCandidateAnswer as routerClassifyCandidateAnswer,
} from '../../routes/interview/session.js';
import {
  DONT_KNOW_REGEX,
  OFF_TOPIC_REGEX,
} from '../../services/interviewFollowUpRules.ts';

describe('Interview Session Dynamic Difficulty & Answer Classification', () => {
  describe('1. resolveDynamicDifficulty()', () => {
    it('maintains default difficulty when no previous scores are provided', () => {
      expect(resolveDynamicDifficulty('medium', [])).toBe('medium');
      expect(resolveDynamicDifficulty('easy', [])).toBe('easy');
      expect(resolveDynamicDifficulty('hard', [])).toBe('hard');
    });

    it('defaults adaptive mode to medium when no previous scores exist', () => {
      expect(resolveDynamicDifficulty('adaptive', [])).toBe('medium');
    });

    it('steps up difficulty to hard when candidate demonstrates mastery', () => {
      const highScores = [85, 92, 95];
      expect(resolveDynamicDifficulty('medium', highScores)).toBe('hard');
      expect(resolveDynamicDifficulty('adaptive', highScores)).toBe('hard');
    });

    it('steps down difficulty to easy when candidate struggles', () => {
      const lowScores = [40, 48, 50];
      expect(resolveDynamicDifficulty('medium', lowScores)).toBe('easy');
      expect(resolveDynamicDifficulty('adaptive', lowScores)).toBe('easy');
    });

    it('handles previousScores passed as score objects', () => {
      const scoreObjects = [{ score: 88 }, { score: 94 }];
      expect(resolveDynamicDifficulty('medium', scoreObjects)).toBe('hard');
    });

    it('router re-exports the identical helper function', () => {
      expect(routerResolveDynamicDifficulty).toBe(resolveDynamicDifficulty);
      expect(routerClassifyCandidateAnswer).toBe(classifyCandidateAnswer);
    });
  });

  describe('2. classifyCandidateAnswer()', () => {
    it('correctly classifies newly expanded dont_know phrases', () => {
      const dontKnowExamples = [
        "I'm blanking on the name of this design pattern right now.",
        "Honestly drawing a blank on how to implement this.",
        "I would have to look that up in the documentation.",
        "I haven't encountered that distributed caching problem before.",
        "I think I will pass on this question.",
        "I am not sure how to approach this dynamic programming problem.",
      ];

      for (const phrase of dontKnowExamples) {
        const result = classifyCandidateAnswer(phrase);
        expect(result.answerType).toBe('dont_know');
        expect(result.isDontKnow).toBe(true);
      }
    });

    it('correctly classifies improved off_topic phrases', () => {
      const offTopicExamples = [
        'I went hiking in the mountains last weekend and it was great.',
        'The cryptocurrency market has been crazy with dogecoin and bitcoin.',
        'My laptop battery died during the midterm yesterday.',
        'My professor was telling an unrelated anecdote in class.',
      ];

      for (const phrase of offTopicExamples) {
        const result = classifyCandidateAnswer(phrase);
        expect(result.answerType).toBe('off_topic');
        expect(result.isOffTopic).toBe(true);
      }
    });

    it('does not classify technical answers mentioning tech words as off-topic', () => {
      const techAnswer = 'We use a redis cache to reduce latency and protect the postgres database query load.';
      const result = classifyCandidateAnswer(techAnswer);
      expect(result.isOffTopic).toBe(false);
      expect(result.answerType).not.toBe('off_topic');
    });

    it('classifies empty or silence turns as stuck_silence', () => {
      expect(classifyCandidateAnswer('').answerType).toBe('stuck_silence');
      expect(classifyCandidateAnswer('uh umm...').answerType).toBe('stuck_silence');
      expect(classifyCandidateAnswer('...').answerType).toBe('stuck_silence');
    });

    it('classifies clarification requests', () => {
      const result = classifyCandidateAnswer('Could you clarify if the array can contain negative numbers?');
      expect(result.answerType).toBe('clarification');
      expect(result.isClarification).toBe(true);
    });

    it('classifies skipped requests', () => {
      const result = classifyCandidateAnswer('skip');
      expect(result.answerType).toBe('skipped');
      expect(result.isSkipped).toBe(true);
    });

    it('classifies detailed answers with trade-offs as strong_complete', () => {
      const result = classifyCandidateAnswer(
        'We implemented rate limiting using a token bucket algorithm with Redis and Lua scripts to prevent race conditions across distributed API instances with minimal latency overhead.'
      );
      expect(result.answerType).toBe('strong_complete');
    });
  });

  describe('3. DONT_KNOW_REGEX and OFF_TOPIC_REGEX expansions', () => {
    it('verifies DONT_KNOW_REGEX matches all required phrases', () => {
      expect(DONT_KNOW_REGEX.test('blanking on')).toBe(true);
      expect(DONT_KNOW_REGEX.test('drawing a blank')).toBe(true);
      expect(DONT_KNOW_REGEX.test('look that up')).toBe(true);
      expect(DONT_KNOW_REGEX.test("haven't encountered")).toBe(true);
      expect(DONT_KNOW_REGEX.test('have not encountered')).toBe(true);
      expect(DONT_KNOW_REGEX.test('pass on this')).toBe(true);
      expect(DONT_KNOW_REGEX.test('not sure how to approach')).toBe(true);
    });

    it('verifies OFF_TOPIC_REGEX matches expanded patterns', () => {
      expect(OFF_TOPIC_REGEX.test('camping')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('cryptocurrency')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('dogecoin')).toBe(true);
      expect(OFF_TOPIC_REGEX.test('battery died')).toBe(true);
    });
  });

  describe('4. Next Question Dynamic Difficulty Route Handler', () => {
    it('resolves dynamic difficulty before question generation in /next-question', async () => {
      // Find the /next-question handler from the sessionRouter stack
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/next-question'
      );
      expect(layer).toBeDefined();

      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      let responsePayload: any = null;
      let statusCode = 200;

      const req: any = {
        user: { id: 'test-user-id' },
        body: {
          type: 'technical',
          difficulty: 'adaptive',
          previousScores: [88, 92, 95],
          previousTopics: ['binary trees', 'graph algorithms'],
        },
      };

      const res: any = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responsePayload = data;
          return this;
        },
      };

      await mainHandler(req, res);

      expect(statusCode).toBe(200);
      expect(responsePayload).toBeDefined();
      expect(responsePayload.question).toBeDefined();
      // Should have dynamically stepped up to 'hard' due to scores [88, 92, 95]
      expect(responsePayload.difficulty).toBe('hard');
    });

    it('resolves dynamic difficulty to easy when candidate scores are low', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/next-question'
      );
      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      let responsePayload: any = null;
      const req: any = {
        user: { id: 'test-user-id' },
        body: {
          type: 'technical',
          difficulty: 'adaptive',
          previousScores: [35, 42, 48],
          previousResponses: [
            { question: 'Q1', score: 35, topic: 'caching' },
            { question: 'Q2', score: 42, topic: 'indexing' },
          ],
        },
      };

      const res: any = {
        status() { return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(responsePayload).toBeDefined();
      expect(responsePayload.difficulty).toBe('easy');
    });
  });

  describe('5. /classify-answer Endpoint in sessionRouter', () => {
    it('classifies answer turns correctly via the route handler', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/classify-answer'
      );
      expect(layer).toBeDefined();

      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      let responsePayload: any = null;
      const req: any = {
        body: {
          answer: "I'm blanking on the algorithm name right now",
          question: 'What algorithm is used for shortest paths?',
          interviewType: 'technical',
        },
      };

      const res: any = {
        status() { return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(responsePayload).toBeDefined();
      expect(responsePayload.answerType).toBe('dont_know');
      expect(responsePayload.isDontKnow).toBe(true);
    });
  });

  describe('6. Cross-Session Deduplication & Calibrated Difficulty', () => {
    it('/next-question accepts usedProblemIds and returns updated usedProblemIds and problemId', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/next-question'
      );
      expect(layer).toBeDefined();
      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      let responsePayload: any = null;
      const initialUsed = ['prob_existing_1', 'prob_existing_2'];
      const req: any = {
        user: { id: 'test-user-id' },
        body: {
          type: 'technical',
          difficulty: 'medium',
          usedProblemIds: initialUsed,
        },
      };

      const res: any = {
        status() { return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(responsePayload).toBeDefined();
      expect(responsePayload.question).toBeDefined();
      expect(responsePayload.problemId).toBeDefined();
      expect(typeof responsePayload.problemId).toBe('string');
      expect(responsePayload.usedProblemIds).toBeDefined();
      expect(Array.isArray(responsePayload.usedProblemIds)).toBe(true);
      expect(responsePayload.usedProblemIds).toContain('prob_existing_1');
      expect(responsePayload.usedProblemIds).toContain('prob_existing_2');
      expect(responsePayload.usedProblemIds).toContain(responsePayload.problemId);
    });

    it('/start accepts usedProblemIds and returns updated usedProblemIds and problemId', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/start'
      );
      expect(layer).toBeDefined();
      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      // Mock coin deduction to succeed cleanly
      vi.spyOn(helpers, 'spendCoinsForInterviewStart').mockResolvedValueOnce({ ok: true, newBalance: 100 } as any);

      let responsePayload: any = null;
      let statusCode = 200;
      const initialUsed = ['prob_alpha', 'prob_beta'];
      const req: any = {
        user: { id: 'test-user-123' },
        body: {
          type: 'technical',
          difficulty: 'medium',
          usedProblemIds: initialUsed,
        },
      };

      const res: any = {
        status(code: number) { statusCode = code; return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(statusCode).toBe(200);
      expect(responsePayload).toBeDefined();
      expect(responsePayload.problemId).toBeDefined();
      expect(typeof responsePayload.problemId).toBe('string');
      expect(responsePayload.usedProblemIds).toBeDefined();
      expect(responsePayload.usedProblemIds).toContain('prob_alpha');
      expect(responsePayload.usedProblemIds).toContain('prob_beta');
      expect(responsePayload.usedProblemIds).toContain(responsePayload.problemId);
    });

    it('/start calibrates starting difficulty to hard when previous session average >= 80', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/start'
      );
      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      vi.spyOn(helpers, 'spendCoinsForInterviewStart').mockResolvedValueOnce({ ok: true, newBalance: 100 } as any);

      let responsePayload: any = null;
      const req: any = {
        user: { id: 'test-user-123' },
        body: {
          type: 'technical',
          difficulty: 'calibrated',
          recentSessions: [
            { score: 85, difficulty: 'medium', type: 'technical' },
            { score: 92, difficulty: 'medium', type: 'technical' },
          ],
        },
      };

      const res: any = {
        status() { return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(responsePayload).toBeDefined();
      expect(responsePayload.difficulty).toBe('hard');
    });

    it('/start calibrates starting difficulty to easy when previous session average < 50', async () => {
      const layer = sessionRouter.stack.find(
        (l: any) => l.route && l.route.path === '/start'
      );
      const handlers = layer.route.stack;
      const mainHandler = handlers[handlers.length - 1].handle;

      vi.spyOn(helpers, 'spendCoinsForInterviewStart').mockResolvedValueOnce({ ok: true, newBalance: 100 } as any);

      let responsePayload: any = null;
      const req: any = {
        user: { id: 'test-user-123' },
        body: {
          type: 'technical',
          difficulty: 'calibrated',
          recentSessions: [
            { score: 40, difficulty: 'medium', type: 'technical' },
            { score: 45, difficulty: 'medium', type: 'technical' },
          ],
        },
      };

      const res: any = {
        status() { return this; },
        json(data: any) { responsePayload = data; return this; },
      };

      await mainHandler(req, res);

      expect(responsePayload).toBeDefined();
      expect(responsePayload.difficulty).toBe('easy');
    });
  });
});
