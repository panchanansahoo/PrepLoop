import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeInterviewService } from '../../services/realtimeInterviewService.js';
import { InterviewStateMachineService } from '../../services/interviewStateMachine.js';
import { InterviewScoringService } from '../../services/interviewScoringService.ts';
import { InterviewMoodEngine, MOODS } from '../../services/interviewerMoodEngine.js';
import InterviewFollowUpRulesService from '../../services/interviewFollowUpRulesService.js';
import * as llmRouter from '../../services/llmRouter.js';

describe('RealtimeInterviewService Intelligence Stack Integration', () => {
  let service: RealtimeInterviewService;

  beforeEach(() => {
    service = new RealtimeInterviewService();
    vi.restoreAllMocks();
  });

  describe('Session State Tracking', () => {
    it('initializes session state tracking turns, scoreHistory, consecutiveLowScores, consecutiveHighScores, currentDifficulty, and mood', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {},
        state: 'idle',
      };

      vi.spyOn(service, 'generateQuestion').mockResolvedValue('What is a B-Tree?');

      await service.handleStart(session, {
        type: 'start',
        company: 'Google',
        role: 'SRE',
        difficulty: 'hard',
        stage: 'Technical',
        totalQuestions: 10,
      });

      expect(session.context.turns).toBe(0);
      expect(session.context.scoreHistory).toEqual([]);
      expect(session.context.consecutiveLowScores).toBe(0);
      expect(session.context.consecutiveHighScores).toBe(0);
      expect(session.context.currentDifficulty).toBe('hard');
      expect(session.context.difficulty).toBe('hard');
      expect(session.context.mood).toBe(MOODS.NEUTRAL);
      expect(session.context.moodState).toBe(MOODS.NEUTRAL);

      expect(session.turns).toBe(0);
      expect(session.consecutiveLowScores).toBe(0);
      expect(session.consecutiveHighScores).toBe(0);
      expect(session.currentDifficulty).toBe('hard');
      expect(session.mood).toBe(MOODS.NEUTRAL);

      const sent = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sent.type).toBe('question');
      expect(sent.difficulty).toBe('hard');
      expect(sent.currentDifficulty).toBe('hard');
      expect(sent.mood).toBe(MOODS.NEUTRAL);
      expect(sent.consecutiveLowScores).toBe(0);
      expect(sent.consecutiveHighScores).toBe(0);
    });

    it('preserves all state tracking metrics across disconnect and resume', async () => {
      const targetId = 'session_persist_state_test';
      const mockWs = { send: vi.fn() };

      service.disconnectedSessions.set(targetId, {
        context: {
          turns: 3,
          scoreHistory: [{ score: 85, turn: 1 }, { score: 90, turn: 2 }, { score: 88, turn: 3 }],
          consecutiveLowScores: 0,
          consecutiveHighScores: 2,
          currentDifficulty: 'hard',
          difficulty: 'hard',
          mood: MOODS.IMPRESSED,
          moodState: MOODS.IMPRESSED,
          stage: 'technical',
          conversation: [],
        },
        state: 'active_question',
        disconnectedAt: Date.now(),
        timeoutTimer: setTimeout(() => {}, 60000),
      });

      const tempSession = {
        ws: mockWs,
        context: {},
        state: 'idle',
      };
      service.sessions.set('temp_id', tempSession);

      await service.handleResume('temp_id', tempSession, {
        type: 'resume',
        targetSessionId: targetId,
      });

      const resumed = service.sessions.get(targetId);
      expect(resumed).toBeDefined();
      expect(resumed?.context.turns).toBe(3);
      expect(resumed?.context.scoreHistory.length).toBe(3);
      expect(resumed?.context.consecutiveHighScores).toBe(2);
      expect(resumed?.context.currentDifficulty).toBe('hard');
      expect(resumed?.context.mood).toBe(MOODS.IMPRESSED);

      const sentPayload = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentPayload.type).toBe('resumed');
      expect(sentPayload.context.consecutiveHighScores).toBe(2);
      expect(sentPayload.context.currentDifficulty).toBe('hard');
      expect(sentPayload.context.mood).toBe(MOODS.IMPRESSED);
    });
  });

  describe('Intelligence Stack Integration in handleAnswer', () => {
    it('integrates InterviewStateMachineService, InterviewScoringService, InterviewMoodEngine, and InterviewFollowUpRulesService', async () => {
      const advanceStateSpy = vi.spyOn(InterviewStateMachineService, 'advanceState');
      const deriveAdaptiveDifficultySpy = vi.spyOn(InterviewScoringService, 'deriveAdaptiveDifficulty');
      const transitionMoodSpy = vi.spyOn(InterviewMoodEngine, 'transitionMood');
      const decideBranchSpy = vi.spyOn(InterviewFollowUpRulesService, 'decideBranch');

      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {
          company: 'Netflix',
          role: 'Senior Backend Engineer',
          stage: 'Technical',
          difficulty: 'medium',
          currentDifficulty: 'medium',
          totalQuestions: 10,
          questionIndex: 1,
          turns: 0,
          scoreHistory: [],
          consecutiveLowScores: 0,
          consecutiveHighScores: 0,
          mood: MOODS.NEUTRAL,
          moodState: MOODS.NEUTRAL,
          conversation: [
            { role: 'interviewer', content: 'Explain cache invalidation strategies and trade-offs.' },
          ],
        },
        state: 'active_question',
      };

      vi.spyOn(llmRouter, 'callTurnScoring').mockResolvedValue({
        score: 90,
        isEstimated: false,
        dimensions: { correctness: 5, depth: 4.5, communication: 4.5, rawWeighted: 4.7 },
        evalModelUsed: 'llama-3.3-70b-versatile',
        evalProvider: 'groq',
        feedback: 'Superb breakdown of write-through, write-back, and TTL invalidation trade-offs.',
        strengths: ['Clear concurrency explanation', 'Thorough cache stampede mitigation'],
        improvements: [],
        evidenceQuote: 'Write-through ensures consistency at the cost of write latency.',
      } as any);

      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('How would you scale Redis across regions?');

      await service.handleAnswer(session, {
        answer: 'Write-through ensures consistency at the cost of write latency. We can use lease-based keys to mitigate cache stampedes.',
        code: '',
        language: 'text',
      });

      // 1. Verify InterviewScoringService.deriveAdaptiveDifficulty was called
      expect(deriveAdaptiveDifficultySpy).toHaveBeenCalledWith(
        'medium',
        9, // 90 / 10
        1, // turns
        expect.anything(),
        undefined
      );

      // 2. Verify InterviewFollowUpRulesService.decideBranch was called
      expect(decideBranchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.objectContaining({ score: 90 }),
          candidateResponse: expect.stringContaining('Write-through ensures consistency'),
          turnNumber: 1,
        })
      );

      // 3. Verify InterviewMoodEngine.transitionMood was called
      expect(transitionMoodSpy).toHaveBeenCalledWith(
        MOODS.NEUTRAL,
        expect.objectContaining({
          score: 90,
        })
      );

      // 4. Verify InterviewStateMachineService.advanceState was called
      expect(advanceStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          turns: 1,
          stage: 'Technical',
          currentDifficulty: expect.any(String),
        }),
        expect.objectContaining({
          score: 90,
          rawScore: 90,
          turnType: 'scored',
        })
      );

      // 5. Verify tracked state on session
      expect(session.context.turns).toBe(1);
      expect(session.context.scoreHistory.length).toBe(1);
      expect(session.context.scoreHistory[0].score).toBe(90);
      expect(session.context.mood).toBe(MOODS.IMPRESSED);
      expect(session.turns).toBe(1);
      expect(session.mood).toBe(MOODS.IMPRESSED);

      // 6. Verify WebSocket feedback payload contains all intelligence fields
      const payloads = mockWs.send.mock.calls.map(([raw]: [string]) => JSON.parse(raw));
      const feedbackMsg = payloads.find((p: any) => p.type === 'feedback');
      expect(feedbackMsg).toBeDefined();
      expect(feedbackMsg.score).toBe(90);
      expect(feedbackMsg.rubric.correctness).toBe(5);
      expect(feedbackMsg.adaptiveDifficulty).toBeDefined();
      expect(feedbackMsg.followUpDecision).toBeDefined();
      expect(feedbackMsg.followUpDecision.nextAction).toBeDefined();
      expect(feedbackMsg.mood.state).toBe(MOODS.IMPRESSED);
      expect(feedbackMsg.consecutiveLowScores).toBe(0);
      expect(feedbackMsg.consecutiveHighScores).toBeGreaterThanOrEqual(1);

      // 7. Verify WebSocket question payload contains difficulty, mood, and followUpAction
      const questionMsg = payloads.find((p: any) => p.type === 'question');
      expect(questionMsg).toBeDefined();
      expect(questionMsg.question).toBe('How would you scale Redis across regions?');
      expect(questionMsg.questionIndex).toBe(2);
      expect(questionMsg.mood).toBe(MOODS.IMPRESSED);
      expect(questionMsg.followUpAction).toBeDefined();

      // 8. Verify rubricHistory tracking
      expect(session.context.rubricHistory).toBeDefined();
      expect(session.context.rubricHistory.length).toBe(1);
      expect(session.context.rubricHistory[0]).toEqual(
        expect.objectContaining({
          turn: 1,
          score: 90,
          correctness: 5,
        })
      );
      expect(session.rubricHistory).toBe(session.context.rubricHistory);
      expect(feedbackMsg.rubricHistory).toEqual(session.context.rubricHistory);
    });

    it('tracks consecutiveLowScores correctly across multiple weak turns', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {
          company: 'Acme',
          role: 'Junior Engineer',
          stage: 'Technical',
          difficulty: 'medium',
          currentDifficulty: 'medium',
          totalQuestions: 10,
          questionIndex: 1,
          turns: 0,
          scoreHistory: [],
          consecutiveLowScores: 0,
          consecutiveHighScores: 0,
          mood: MOODS.NEUTRAL,
          moodState: MOODS.NEUTRAL,
          conversation: [],
        },
        state: 'active_question',
      };

      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('Next question?');

      // Turn 1: weak answer (score < 40)
      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Needs much more depth.',
        score: 30,
        rubric: { correctness: 1.5, depth: 1.0, communication: 2.0, rawWeighted: 1.5 },
        strengths: [],
        improvements: ['Explain fundamentals'],
      } as any);

      await service.handleAnswer(session, { answer: 'i do not know', code: '', language: 'text' });
      expect(session.context.consecutiveLowScores).toBe(1);
      expect(session.context.consecutiveHighScores).toBe(0);
      expect(session.context.moodState).toBe(MOODS.SKEPTICAL);

      // Turn 2: another weak answer (score < 40)
      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Still struggling.',
        score: 35,
        rubric: { correctness: 1.5, depth: 1.5, communication: 2.0, rawWeighted: 1.6 },
        strengths: [],
        improvements: ['Review basic data structures'],
      } as any);

      await service.handleAnswer(session, { answer: 'blanking on this too', code: '', language: 'text' });
      expect(session.context.consecutiveLowScores).toBe(2);
      expect(session.context.consecutiveHighScores).toBe(0);
      expect(session.context.moodState).toBe(MOODS.IMPATIENT);
    });

    it('guides question generation with followUpDecision when Groq fallback applies', async () => {
      const context = {
        company: 'Stripe',
        role: 'Staff Engineer',
        stage: 'Technical',
        currentDifficulty: 'hard',
        difficulty: 'hard',
        turns: 2,
        questionIndex: 2,
        conversation: [
          { role: 'interviewer', content: 'Explain distributed locks.' },
          { role: 'candidate', content: 'Use Redlock with Redis.' },
        ],
      };

      const followUpDecision = {
        nextAction: 'affirm_recovery',
        recoveryPhrase: 'Much clearer breakdown this time — that shows strong adaptability.',
        recoveryDetected: true,
        branchReason: 'genuine_recovery_detected',
      };

      const question = await service.generateNextQuestion(context, followUpDecision);
      expect(question).toContain('Much clearer breakdown this time — that shows strong adaptability.');
    });

    it('caps rubricHistory at 10 turns and propagates nextStep and misconceptionsDetected in feedback', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {
          company: 'Amazon',
          role: 'Backend Engineer',
          stage: 'Technical',
          difficulty: 'medium',
          currentDifficulty: 'medium',
          problemStatement: 'Reverse linked list in O(n) time and O(1) space',
          problemRequirements: ['O(n) time', 'O(1) space'],
          tags: ['linked-list', 'in-place'],
          turns: 10,
          rubricHistory: Array.from({ length: 10 }, (_, i) => ({
            turn: i + 1,
            score: 70 + i,
            clarity: 3,
            depth: 3,
            correctness: 3,
          })),
          scoreHistory: [],
          conversation: [],
        },
        state: 'active_question',
      };

      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('Next follow-up?');
      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Candidate approached with recursion but space complexity is O(n).',
        score: 65,
        rubric: { correctness: 3, depth: 3, communication: 3, rawWeighted: 3 },
        strengths: ['Correct pointer manipulation'],
        improvements: ['Reduce auxiliary stack memory to O(1)'],
        nextStep: 'Practice iterative 3-pointer reversal (prev, curr, next) on LeetCode #206.',
        misconceptionsDetected: ['Recursive call stack violates O(1) space requirement'],
      } as any);

      await service.handleAnswer(session, {
        answer: 'I can solve this recursively by calling reverse(head.next).',
        code: 'function reverse(head) { return head ? reverse(head.next) : null; }',
        language: 'javascript',
      });

      // 1. Capped at 10 turns
      expect(session.context.rubricHistory.length).toBe(10);
      expect(session.context.rubricHistory[9].turn).toBe(11);
      expect(session.context.rubricHistory[9].score).toBe(65);
      expect(session.rubricHistory).toBe(session.context.rubricHistory);

      // 2. Broadcast feedback includes nextStep and misconceptionsDetected
      const payloads = mockWs.send.mock.calls.map(([raw]: [string]) => JSON.parse(raw));
      const feedbackMsg = payloads.find((p: any) => p.type === 'feedback');
      expect(feedbackMsg).toBeDefined();
      expect(feedbackMsg.nextStep).toBe('Practice iterative 3-pointer reversal (prev, curr, next) on LeetCode #206.');
      expect(feedbackMsg.misconceptionsDetected).toContain('Recursive call stack violates O(1) space requirement');
      expect(feedbackMsg.rubricHistory.length).toBe(10);
    });

    it('passes question metadata into callTurnScoring in generateFeedback', async () => {
      const scoringSpy = vi.spyOn(llmRouter, 'callTurnScoring').mockResolvedValue({
        score: 85,
        feedback: 'Good approach',
        dimensions: { correctness: 4, depth: 4, communication: 4, rawWeighted: 4 },
        nextStep: 'Analyze cache eviction policies',
        misconceptionsDetected: [],
      } as any);

      const context = {
        company: 'Stripe',
        role: 'Staff Engineer',
        stage: 'Technical',
        difficulty: 'hard',
        currentDifficulty: 'hard',
        turns: 1,
        problemStatement: 'Design a distributed rate limiter',
        problemRequirements: ['Sliding window counter', 'Sub-millisecond latency'],
        tags: ['distributed-systems', 'redis'],
        conversation: [{ role: 'interviewer', content: 'How would you design a distributed rate limiter?' }],
      };

      const result = await service.generateFeedback(context, 'I would use Redis Sorted Sets with timestamps.', {
        code: '',
        language: '',
        sessionId: 'session_stripe_1',
        userId: 'user_stripe_1',
      });

      expect(scoringSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          problemStatement: 'Design a distributed rate limiter',
          problemRequirements: ['Sliding window counter', 'Sub-millisecond latency'],
          tags: ['distributed-systems', 'redis'],
        })
      );
      expect(result.nextStep).toBe('Analyze cache eviction policies');
    });

    it('tracks usedProblemIds across start and answer turns and broadcasts them', async () => {
      const mockWs = { send: vi.fn() };
      const session = {
        ws: mockWs,
        context: {},
        state: 'idle',
      };

      vi.spyOn(service, 'generateQuestion').mockResolvedValue('What is a Trie?');

      await service.handleStart(session, {
        type: 'start',
        company: 'Google',
        role: 'Software Engineer',
        difficulty: 'medium',
        stage: 'Technical',
        usedProblemIds: ['q_initial_123'],
      });

      expect(session.context.usedProblemIds).toBeDefined();
      expect(session.context.usedProblemIds).toContain('q_initial_123');
      expect(session.context.usedProblemIds.length).toBe(2); // initial + new problem
      const initialProblemId = session.context.problemId;
      expect(session.context.usedProblemIds).toContain(initialProblemId);
      expect(session.usedProblemIds).toBe(session.context.usedProblemIds);

      // Verify question message sent over ws contains usedProblemIds
      const startPayload = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(startPayload.type).toBe('question');
      expect(startPayload.usedProblemIds).toEqual(session.context.usedProblemIds);
      expect(startPayload.problemId).toBe(initialProblemId);

      // Now answer and verify nextQuestion receives a new problemId and updates usedProblemIds
      vi.spyOn(service, 'generateFeedback').mockResolvedValue({
        comment: 'Good definition of prefix tree.',
        score: 82,
        rubric: { correctness: 4, depth: 4, communication: 4, rawWeighted: 4 },
      } as any);
      vi.spyOn(service, 'generateNextQuestion').mockResolvedValue('How would you implement autocomplete using this Trie?');

      await service.handleAnswer(session, {
        answer: 'A Trie is a tree-like data structure used to store a dynamic set of strings where keys are usually strings.',
        code: '',
        language: 'text',
      });

      expect(session.context.usedProblemIds.length).toBe(3);
      const secondProblemId = session.context.problemId;
      expect(secondProblemId).not.toBe(initialProblemId);
      expect(session.context.usedProblemIds).toContain(secondProblemId);

      const sentCalls = mockWs.send.mock.calls.map(([raw]: [string]) => JSON.parse(raw));
      const feedbackMsg = sentCalls.find((p: any) => p.type === 'feedback');
      expect(feedbackMsg.usedProblemIds).toEqual(session.context.usedProblemIds);

      const nextQuestionMsg = sentCalls.filter((p: any) => p.type === 'question')[1];
      expect(nextQuestionMsg.problemId).toBe(secondProblemId);
      expect(nextQuestionMsg.usedProblemIds).toEqual(session.context.usedProblemIds);
    });

    it('getFallbackQuestion filters out already used problems', () => {
      const context = {
        stage: 'Technical',
        interviewType: 'technical',
        questionIndex: 0,
        usedProblemIds: [],
      };

      const q1 = service.getFallbackQuestion(context);
      expect(typeof q1).toBe('string');

      // Hash q1 and mark as used
      const crypto = require('crypto');
      const q1Id = `q_${crypto.createHash('md5').update(q1).digest('hex').slice(0, 10)}`;
      context.usedProblemIds = [q1Id];

      const q2 = service.getFallbackQuestion(context);
      expect(q2).not.toBe(q1);
    });

    it('safeSend handles closed sockets gracefully without throwing', () => {
      const closedWs = {
        readyState: 3,
        send: () => {
          throw new Error('WebSocket is not open: readyState 3 (CLOSED)');
        },
      };

      const { safeSend } = require('../../services/realtimeInterviewService.js');
      expect(() => safeSend(closedWs, { type: 'test' })).not.toThrow();
      expect(safeSend(closedWs, { type: 'test' })).toBe(false);
    });

    it('close cleans up heartbeat interval and active sessions', () => {
      service.heartbeatInterval = setInterval(() => {}, 10000);
      service.sessions.set('s1', { ws: {} } as any);
      service.close();
      expect(service.heartbeatInterval).toBeNull();
      expect(service.sessions.size).toBe(0);
    });
  });
});
