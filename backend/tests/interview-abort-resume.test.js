import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InterviewAbortResumeManager } from '../services/interviewAbortResumeManager.js';

describe('InterviewAbortResumeManager', () => {
  let manager;
  let redisClient;

  beforeEach(() => {
    // Mock Redis client
    const storage = new Map();
    redisClient = {
      set: vi.fn(async (key, value, mode, ttl) => {
        storage.set(key, value);
        return 'OK';
      }),
      get: vi.fn(async (key) => {
        return storage.get(key) || null;
      }),
      del: vi.fn(async (key) => {
        return storage.delete(key) ? 1 : 0;
      }),
      scan: vi.fn(async (cursor, ...args) => {
        const pattern = args[1];
        const patternRegex = new RegExp(pattern.replace('*', '.*'));
        const keys = Array.from(storage.keys()).filter((k) => patternRegex.test(k));
        return ['0', keys]; // cursor, keys
      }),
      __storage: storage, // For test inspection
    };

    manager = new InterviewAbortResumeManager(redisClient);
  });

  describe('Save Abort State', () => {
    it('should save interview state on abort', async () => {
      const userId = 'user123';
      const interviewId = 'interview456';
      const state = {
        stage: 'technical',
        turns: 5,
        scores: [75, 80, 85],
        totalQuestions: 12,
        conversation: [{ role: 'user', text: 'hello' }],
        strengthAreas: ['logic'],
        weakAreas: ['optimization'],
      };

      const result = await manager.saveAbortState(userId, interviewId, state);

      expect(result.status).toBe('aborted');
      expect(result.checkpoint).toBeDefined();
      expect(result.checkpoint.user_id).toBe(userId);
      expect(result.checkpoint.interview_id).toBe(interviewId);
      expect(result.checkpoint.state.stage).toBe('technical');
      expect(result.checkpoint.state.turns).toBe(5);
      expect(result.can_resume_until).toBeDefined();
    });

    it('should include all state fields in abort checkpoint', async () => {
      const state = {
        stage: 'warmup',
        turns: 3,
        scores: [70, 75],
        totalQuestions: 13,
        conversation: [{ role: 'ai', text: 'question' }],
        strengthAreas: ['communication'],
        weakAreas: ['edge cases'],
        feedbackReceived: ['work on recursion'],
        interviewType: 'dsa',
      };

      const result = await manager.saveAbortState('user1', 'interview1', state);
      const checkpoint = result.checkpoint;

      expect(checkpoint.state.stage).toBe('warmup');
      expect(checkpoint.state.turns).toBe(3);
      expect(checkpoint.state.current_scores).toEqual([70, 75]);
      expect(checkpoint.state.total_questions).toBe(13);
      expect(checkpoint.state.strength_areas).toContain('communication');
      expect(checkpoint.state.weakness_areas).toContain('edge cases');
      expect(checkpoint.state.interview_type).toBe('dsa');
    });

    it('should generate checksum for tampering detection', async () => {
      const state = { stage: 'technical', turns: 5, scores: [80, 85] };

      const result1 = await manager.saveAbortState('user1', 'int1', state);
      const result2 = await manager.saveAbortState('user1', 'int1', state);

      expect(result1.checkpoint.checksum).toBe(result2.checkpoint.checksum);
    });

    it('should include resume indicator message', async () => {
      const state = {
        stage: 'followup',
        turns: 7,
        scores: [75, 80, 85, 78, 82, 80, 88], // avg = 81
      };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.resume_indicator).toContain('followup');
      expect(result.checkpoint.resume_indicator).toContain('7');
      expect(result.checkpoint.resume_indicator).toContain('81'); // Avg of scores
    });

    it('should set 7-day TTL on abort state', async () => {
      const state = { stage: 'technical', turns: 1 };
      await manager.saveAbortState('user1', 'int1', state);

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('interview:abort:'),
        expect.any(String),
        'EX',
        7 * 24 * 60 * 60
      );
    });
  });

  describe('Get Abort State', () => {
    it('should retrieve saved abort state', async () => {
      const userId = 'user123';
      const interviewId = 'interview456';
      const state = { stage: 'technical', turns: 5, scores: [80, 85] };

      await manager.saveAbortState(userId, interviewId, state);
      const retrieved = await manager.getAbortState(userId, interviewId);

      expect(retrieved).toBeDefined();
      expect(retrieved.state.stage).toBe('technical');
      expect(retrieved.state.turns).toBe(5);
    });

    it('should return null for non-existent abort state', async () => {
      const result = await manager.getAbortState('user123', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should parse JSON correctly', async () => {
      const state = {
        stage: 'warmup',
        turns: 3,
        conversation: [{ role: 'user', text: 'hello' }],
      };

      await manager.saveAbortState('user1', 'int1', state);
      const retrieved = await manager.getAbortState('user1', 'int1');

      expect(retrieved.state.conversation).toEqual([{ role: 'user', text: 'hello' }]);
      expect(typeof retrieved.timestamp).toBe('number');
    });
  });

  describe('Resume from Abort', () => {
    it('should restore interview state from abort', async () => {
      const state = { stage: 'technical', turns: 5, scores: [75, 80, 85] };

      await manager.saveAbortState('user1', 'int1', state);
      const restored = await manager.resumeFromAbort('user1', 'int1');

      expect(restored.stage).toBe('technical');
      expect(restored.turns).toBe(5);
      expect(restored.current_scores).toEqual([75, 80, 85]);
      expect(restored.is_resumed).toBe(true);
    });

    it('should throw error if abort state not found', async () => {
      await expect(manager.resumeFromAbort('user1', 'nonexistent')).rejects.toThrow(
        'No saved abort state found'
      );
    });

    it('should validate checksum on resume', async () => {
      const state = { stage: 'technical', turns: 5, scores: [75, 80] };

      await manager.saveAbortState('user1', 'int1', state);

      // Manually corrupt the state in Redis
      const key = `interview:abort:user1:int1`;
      const stored = redisClient.__storage.get(key);
      const corrupted = JSON.parse(stored);
      corrupted.state.turns = 10; // Modify state
      redisClient.__storage.set(key, JSON.stringify(corrupted));

      // Resume should fail due to checksum
      await expect(manager.resumeFromAbort('user1', 'int1')).rejects.toThrow(
        'checksum mismatch'
      );
    });

    it('should add resumed metadata', async () => {
      const state = { stage: 'followup', turns: 7, scores: [80, 85] };

      await manager.saveAbortState('user1', 'int1', state);
      const restored = await manager.resumeFromAbort('user1', 'int1');

      expect(restored.resumed_at).toBeDefined();
      expect(typeof restored.resumed_at).toBe('number');
      expect(restored.resumed_from_stage).toBe('followup');
      expect(restored.resume_indicator).toBeDefined();
    });
  });

  describe('Validate Resume Integrity', () => {
    it('should validate untampered state', async () => {
      const state = { stage: 'technical', turns: 5, scores: [75, 80] };

      const abortState = await manager.saveAbortState('user1', 'int1', state);
      const isValid = manager.validateResumeIntegrity(abortState.checkpoint);

      expect(isValid).toBe(true);
    });

    it('should reject tampered turn count', async () => {
      const state = { stage: 'technical', turns: 5, scores: [75, 80] };

      const abortState = await manager.saveAbortState('user1', 'int1', state);
      const tampered = { ...abortState.checkpoint };
      tampered.state.turns = 10; // Change turns

      const isValid = manager.validateResumeIntegrity(tampered);
      expect(isValid).toBe(false);
    });

    it('should reject tampered scores', async () => {
      const state = { stage: 'technical', turns: 5, scores: [75, 80] };

      const abortState = await manager.saveAbortState('user1', 'int1', state);

      // Try to resume with modified scores
      const modifiedResume = { current_scores: [95, 99] };
      const isValid = manager.validateResumeIntegrity(abortState.checkpoint, modifiedResume);

      expect(isValid).toBe(false);
    });

    it('should reject null abort state', () => {
      const isValid = manager.validateResumeIntegrity(null);
      expect(isValid).toBe(false);
    });
  });

  describe('Generate Post-Interview Snapshot', () => {
    it('should create immutable snapshot on completion', async () => {
      const finalState = {
        stage: 'feedback',
        finalScore: 82,
        completionStatus: 'completed',
        completionTimeSeconds: 1200,
        turns: 12,
        totalQuestions: 13,
        interviewType: 'dsa',
        conversation: [{ role: 'user', text: 'answer' }],
        scoreBreakdown: { logic: 85, communication: 80 },
      };

      const result = await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);

      expect(result.status).toBe('snapshot_created');
      expect(result.snapshot_id).toBeDefined();
      expect(result.snapshot_id).toContain('snapshot_');
      expect(result.immutable_until).toBeDefined();
    });

    it('should include all final state fields in snapshot', async () => {
      const finalState = {
        stage: 'feedback',
        finalScore: 85,
        completionStatus: 'completed',
        completionTimeSeconds: 1500,
        turns: 10,
        totalQuestions: 12,
        interviewType: 'behavioral',
        conversation: [{ role: 'ai', text: 'question' }],
        feedback: ['good communication'],
      };

      await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);
      const snapshot = redisClient.__storage.get(`interview:snapshot:user1:int1`);
      const parsed = JSON.parse(snapshot);

      expect(parsed.final_stage).toBe('feedback');
      expect(parsed.final_score).toBe(85);
      expect(parsed.completion_status).toBe('completed');
      expect(parsed.total_turns).toBe(10);
      expect(parsed.interview_type).toBe('behavioral');
      expect(parsed.metadata.is_completed).toBe(true);
    });

    it('should set 30-day TTL on snapshot', async () => {
      const finalState = { stage: 'feedback', finalScore: 80 };

      await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('interview:snapshot:'),
        expect.any(String),
        'EX',
        30 * 24 * 60 * 60
      );
    });

    it('should track resume and abort history in metadata', async () => {
      const finalState = {
        stage: 'feedback',
        finalScore: 80,
        isResumed: true,
        abortCount: 2,
      };

      await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);
      const snapshot = redisClient.__storage.get(`interview:snapshot:user1:int1`);
      const parsed = JSON.parse(snapshot);

      expect(parsed.metadata.was_resumed).toBe(true);
      expect(parsed.metadata.had_aborts).toBe(2);
    });

    it('should generate immutable checksum', async () => {
      const finalState = { stage: 'feedback', finalScore: 80 };

      await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);
      const snapshot = redisClient.__storage.get(`interview:snapshot:user1:int1`);
      const parsed = JSON.parse(snapshot);

      expect(parsed.checksum).toBeDefined();
      expect(typeof parsed.checksum).toBe('string');
      expect(parsed.checksum.length).toBeGreaterThan(20); // SHA256 hex
    });
  });

  describe('Get Post-Interview Snapshot', () => {
    it('should retrieve snapshot for analytics', async () => {
      const finalState = {
        stage: 'feedback',
        finalScore: 85,
        completion_time_seconds: 1200,
      };

      await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);
      const snapshot = await manager.getPostInterviewSnapshot('user1', 'int1');

      expect(snapshot).toBeDefined();
      expect(snapshot.final_score).toBe(85);
      expect(snapshot.interview_id).toBe('int1');
    });

    it('should return null if snapshot not found', async () => {
      const result = await manager.getPostInterviewSnapshot('user1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('Clear Abort State', () => {
    it('should delete abort state after resume', async () => {
      const state = { stage: 'technical', turns: 5 };

      await manager.saveAbortState('user1', 'int1', state);
      let retrieved = await manager.getAbortState('user1', 'int1');
      expect(retrieved).toBeDefined();

      const cleared = await manager.clearAbortState('user1', 'int1');
      expect(cleared).toBe(true);

      retrieved = await manager.getAbortState('user1', 'int1');
      expect(retrieved).toBeNull();
    });

    it('should return false if state not found', async () => {
      const cleared = await manager.clearAbortState('user1', 'nonexistent');
      expect(cleared).toBe(false);
    });
  });

  describe('List Resumable Interviews', () => {
    it('should list all resumable interviews for user', async () => {
      const state = { stage: 'technical', turns: 5 };

      await manager.saveAbortState('user1', 'int1', state);
      await manager.saveAbortState('user1', 'int2', state);
      await manager.saveAbortState('user1', 'int3', state);

      const resumable = await manager.listResumableInterviews('user1');

      expect(resumable).toHaveLength(3);
      expect(resumable.map((r) => r.interview_id)).toContain('int1');
      expect(resumable.map((r) => r.interview_id)).toContain('int2');
      expect(resumable.map((r) => r.interview_id)).toContain('int3');
    });

    it('should include resume indicator for each interview', async () => {
      const state = { stage: 'warmup', turns: 3, scores: [70, 75, 80] };

      await manager.saveAbortState('user1', 'int1', state);

      const resumable = await manager.listResumableInterviews('user1');

      expect(resumable[0].resume_indicator).toBeDefined();
      expect(resumable[0].resume_indicator).toContain('warmup');
    });

    it('should return empty array if no resumable interviews', async () => {
      const resumable = await manager.listResumableInterviews('user_with_no_aborts');
      expect(resumable).toEqual([]);
    });

    it('should not list resumable interviews for different user', async () => {
      const state = { stage: 'technical', turns: 5 };

      await manager.saveAbortState('user1', 'int1', state);

      const resumable = await manager.listResumableInterviews('user2');
      expect(resumable).toEqual([]);
    });
  });

  describe('Resume Indicator Messages', () => {
    it('should format resume indicator correctly', async () => {
      const state = {
        stage: 'technical',
        turns: 8,
        scores: [76, 77, 78, 79, 80, 81, 82, 79], // avg = 79
      };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.resume_indicator).toContain('Stage technical');
      expect(result.checkpoint.resume_indicator).toContain('79%'); // Average
      expect(result.checkpoint.resume_indicator).toContain('8 questions');
    });

    it('should use singular "question" for single question', async () => {
      const state = { stage: 'intake', turns: 1, scores: [85] };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.resume_indicator).toContain('1 question');
      expect(result.checkpoint.resume_indicator).not.toContain('questions');
    });

    it('should handle missing scores gracefully', async () => {
      const state = { stage: 'warmup', turns: 2 };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.resume_indicator).toBeDefined();
      expect(result.checkpoint.resume_indicator).toContain('0%');
    });
  });

  describe('TTL Management', () => {
    it('should use different TTLs for abort vs snapshot', () => {
      expect(manager.ABORT_STATE_TTL).toBe(7 * 24 * 60 * 60); // 7 days
      expect(manager.SNAPSHOT_TTL).toBe(30 * 24 * 60 * 60); // 30 days
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation history', async () => {
      const state = { stage: 'technical', turns: 0, conversation: [] };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.state.conversation).toEqual([]);
    });

    it('should handle very long interview', async () => {
      const scores = Array(50).fill(0).map((_, i) => 70 + (i % 20));
      const state = {
        stage: 'feedback',
        turns: 50,
        scores,
        totalQuestions: 50,
      };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.state.turns).toBe(50);
      expect(result.checkpoint.state.current_scores).toHaveLength(50);
    });

    it('should handle undefined fields', async () => {
      const state = { stage: undefined, turns: undefined };

      const result = await manager.saveAbortState('user1', 'int1', state);

      expect(result.checkpoint.state.stage).toBe('unknown');
      expect(result.checkpoint.state.turns).toBe(0);
    });

    it('should generate different checksums for different states', async () => {
      const state1 = { stage: 'technical', turns: 5, scores: [75, 80] };
      const state2 = { stage: 'technical', turns: 6, scores: [75, 80] };

      const result1 = await manager.saveAbortState('user1', 'int1', state1);
      const result2 = await manager.saveAbortState('user1', 'int2', state2);

      expect(result1.checkpoint.checksum).not.toBe(result2.checkpoint.checksum);
    });
  });

  describe('Full Resume Workflow', () => {
    it('should support complete abort and resume cycle', async () => {
      // User starts interview and reaches midpoint
      const initialState = {
        stage: 'technical',
        turns: 5,
        scores: [75, 80, 85, 78, 82],
        totalQuestions: 12,
        interviewType: 'dsa',
      };

      // User aborts
      const abortResult = await manager.saveAbortState('user1', 'int1', initialState);
      expect(abortResult.status).toBe('aborted');

      // Check if resumable
      const resumable = await manager.listResumableInterviews('user1');
      expect(resumable).toHaveLength(1);
      expect(resumable[0].interview_id).toBe('int1');

      // Resume interview
      const restored = await manager.resumeFromAbort('user1', 'int1');
      expect(restored.stage).toBe('technical');
      expect(restored.is_resumed).toBe(true);

      // Clear abort state
      await manager.clearAbortState('user1', 'int1');
      const stillResumable = await manager.listResumableInterviews('user1');
      expect(stillResumable).toHaveLength(0);

      // Complete interview and create snapshot
      const finalState = {
        ...initialState,
        stage: 'feedback',
        finalScore: 85,
        completionStatus: 'completed',
        completionTimeSeconds: 1500,
      };

      const snapshotResult = await manager.generatePostInterviewSnapshot('user1', 'int1', finalState);
      expect(snapshotResult.status).toBe('snapshot_created');

      // Retrieve snapshot for analytics
      const snapshot = await manager.getPostInterviewSnapshot('user1', 'int1');
      expect(snapshot.final_score).toBe(85);
    });
  });
});
