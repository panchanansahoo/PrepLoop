import { describe, it, expect } from 'vitest';
import {
  maybeAddNaturalPrefix,
  NATURAL_PREFIXES,
  deterministicHash,
  STAGE_WORD_LIMITS,
  resolveStageWordLimit,
  buildConversationSummary,
  buildRubricTrendSection,
  InterviewPromptService,
} from '../../services/interviewPromptService.js';

describe('InterviewPromptService & maybeAddNaturalPrefix', () => {
  describe('maybeAddNaturalPrefix', () => {
    it('returns short messages (< 20 chars) untouched', () => {
      const shortMsg = 'What is recursion?';
      expect(shortMsg.length).toBeLessThan(20);
      expect(maybeAddNaturalPrefix(shortMsg)).toBe(shortMsg);
      expect(maybeAddNaturalPrefix('Too short')).toBe('Too short');
      expect(maybeAddNaturalPrefix('')).toBe('');
    });

    it('returns non-string or falsy input untouched', () => {
      expect(maybeAddNaturalPrefix(null)).toBe(null);
      expect(maybeAddNaturalPrefix(undefined)).toBe(undefined);
      expect(maybeAddNaturalPrefix(123 as any)).toBe(123);
    });

    it('guards against messages already prefixed with natural pool prefix', () => {
      for (const prefix of NATURAL_PREFIXES) {
        const message = `${prefix}could you explain how the binary search works with negative numbers?`;
        expect(maybeAddNaturalPrefix(message)).toBe(message);
      }
    });

    it('guards against messages already starting with conversational acknowledgments', () => {
      const msgs = [
        'Yes, let us dive into the time complexity of that algorithm.',
        'Great, can you walk me through your memory allocation approach?',
        'Good, how would this scale across multiple distributed nodes?',
        'Understood, what happens when the network connection times out?',
        'Noted, let us consider what edge cases might arise here.',
        'Thank you, could you now implement the delete operation?',
        'I see, what trade-offs did you consider for consistency?',
        'Well, how would you handle deadlock in this scenario?',
      ];

      for (const msg of msgs) {
        expect(maybeAddNaturalPrefix(msg)).toBe(msg);
      }
    });

    it('is deterministic for identical input strings', () => {
      const input = 'Could you elaborate on how your caching layer handles cache invalidation?';
      const result1 = maybeAddNaturalPrefix(input);
      const result2 = maybeAddNaturalPrefix(input);
      expect(result1).toBe(result2);
    });

    it('injects natural prefix when hash qualifies at 30% rate or options.rate: 1.0', () => {
      const input = 'Could you elaborate on how your caching layer handles cache invalidation?';
      const forcedInjected = maybeAddNaturalPrefix(input, { rate: 1.0 });
      expect(forcedInjected).not.toBe(input);
      const startsWithAnyPrefix = NATURAL_PREFIXES.some((p) => forcedInjected.startsWith(p));
      expect(startsWithAnyPrefix).toBe(true);

      const forcedSkipped = maybeAddNaturalPrefix(input, { rate: 0.0 });
      expect(forcedSkipped).toBe(input);
    });

    it('formats first letter to lowercase when prefix is injected and sentence starts with capitalized word', () => {
      const input = 'Could you explain how the event loop processes microtasks in Node.js?';
      const forced = maybeAddNaturalPrefix(input, { rate: 1.0 });
      const matchedPrefix = NATURAL_PREFIXES.find((p) => forced.startsWith(p));
      expect(matchedPrefix).toBeDefined();
      const remainder = forced.slice(matchedPrefix!.length);
      expect(remainder.startsWith('could you')).toBe(true);
    });

    it('injects prefix at approximately 30% rate over sample messages', () => {
      let injectedCount = 0;
      const total = 50;

      for (let i = 0; i < total; i++) {
        const testMsg = `Candidate question sequence test probe variation number ${i} regarding system scalability.`;
        const result = maybeAddNaturalPrefix(testMsg);
        if (result !== testMsg) {
          injectedCount++;
        }
      }

      // Over 50 pseudorandom inputs, injection count should be reasonable (e.g. 15-45%)
      expect(injectedCount).toBeGreaterThan(5);
      expect(injectedCount).toBeLessThan(35);
    });
  });

  describe('Stage-Aware Word Limits (A.5)', () => {
    it('resolves correct word limits per stage for realtime and default modes', () => {
      expect(resolveStageWordLimit('intake', 'full_realtime')).toBe(45);
      expect(resolveStageWordLimit('intake', 'standard')).toBe(50);

      expect(resolveStageWordLimit('warmup', 'full_realtime')).toBe(30);
      expect(resolveStageWordLimit('warmup', 'standard')).toBe(35);

      expect(resolveStageWordLimit('technical', 'full_realtime')).toBe(35);
      expect(resolveStageWordLimit('technical', 'standard')).toBe(40);

      expect(resolveStageWordLimit('followup', 'full_realtime')).toBe(30);
      expect(resolveStageWordLimit('followup', 'standard')).toBe(35);

      expect(resolveStageWordLimit('challenge', 'full_realtime')).toBe(50);
      expect(resolveStageWordLimit('challenge', 'standard')).toBe(60);

      expect(resolveStageWordLimit('feedback', 'full_realtime')).toBe(55);
      expect(resolveStageWordLimit('feedback', 'standard')).toBe(70);

      // Fallback for unknown stage
      expect(resolveStageWordLimit('unknown_stage', 'full_realtime')).toBe(35);
      expect(resolveStageWordLimit('unknown_stage', 'standard')).toBe(40);
    });

    it('applies stage-aware word limits directly inside generated prompts', () => {
      const challengePrompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Scale an in-memory counter.',
        transcript: [],
        candidateResponse: 'I will partition by key hash.',
        interviewType: 'system-design',
        interviewMode: 'full_realtime',
        interviewContext: { stage: 'challenge' },
      });
      expect(challengePrompt).toContain('max 50 words');

      const warmupPrompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Tell me about yourself.',
        transcript: [],
        candidateResponse: 'I am a CS student passionate about backend.',
        interviewType: 'hr',
        interviewMode: 'standard',
        interviewContext: { stage: 'warmup' },
      });
      expect(warmupPrompt).toContain('max 35 words');
    });
  });

  describe('Transcript Memory & Rolling Summary (A.4)', () => {
    it('includes last 3 exchanges (6 transcript items) in prompt history', () => {
      const transcript = [
        { role: 'interviewer', text: 'Q1' },
        { role: 'candidate', text: 'A1' },
        { role: 'interviewer', text: 'Q2' },
        { role: 'candidate', text: 'A2' },
        { role: 'interviewer', text: 'Q3' },
        { role: 'candidate', text: 'A3' },
        { role: 'interviewer', text: 'Q4' },
        { role: 'candidate', text: 'A4' },
      ];

      const prompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Binary search tree validation.',
        transcript,
        candidateResponse: 'Traverse in-order and check monotonicity.',
        interviewType: 'dsa',
        interviewContext: { stage: 'technical' },
      });

      expect(prompt).toContain('INTERVIEW HISTORY (last 3 exchanges):');
      // Should not contain earliest exchange Q1/A1
      expect(prompt).not.toContain('interviewer: Q1');
      expect(prompt).not.toContain('candidate: A1');
      // Should contain last 6 items: Q2, A2, Q3, A3, Q4, A4
      expect(prompt).toContain('interviewer: Q2');
      expect(prompt).toContain('candidate: A2');
      expect(prompt).toContain('interviewer: Q4');
      expect(prompt).toContain('candidate: A4');
    });

    it('expands rolling turn summaries cap to 8 in buildConversationSummary', () => {
      const summaries = [
        'Turn 1 claim', 'Turn 2 claim', 'Turn 3 claim', 'Turn 4 claim',
        'Turn 5 claim', 'Turn 6 claim', 'Turn 7 claim', 'Turn 8 claim',
        'Turn 9 claim',
      ];
      const summaryText = buildConversationSummary(summaries, ['arrays']);
      expect(summaryText).toContain('KEY CLAIMS FROM EARLIER TURNS:');
      // Earliest (Turn 1) should be dropped by slice(-8)
      expect(summaryText).not.toContain('Turn 1 claim');
      expect(summaryText).toContain('Turn 2 claim');
      expect(summaryText).toContain('Turn 9 claim');
    });
  });

  describe('Rubric Trend Prompt Directive (B.4)', () => {
    it('formats recent rubric history and cues LLM to target weakest dimension', () => {
      const rubricHistory = [
        { turn: 1, clarity: 8, depth: 3, correctness: 7 },
        { turn: 2, clarity: 7, depth: 4, correctness: 6 },
        { turn: 3, clarity: 8, depth: 4, correctness: 8 },
      ];

      const section = buildRubricTrendSection(rubricHistory);
      expect(section).toContain('RUBRIC TREND (recent turns):');
      expect(section).toContain('Turn 1: Clarity=8/10, Depth=3/10, Correctness=7/10');
      expect(section).toContain('Turn 2: Clarity=7/10, Depth=4/10, Correctness=6/10');
      expect(section).toContain('Turn 3: Clarity=8/10, Depth=4/10, Correctness=8/10');
      expect(section).toContain('TARGET WEAKEST DIMENSION (DEPTH)');
      expect(section).toContain('Candidate has struggled with technical depth');
    });

    it('correctly targets clarity or correctness when they are weakest', () => {
      const clarityWeak = [
        { turn: 1, clarity: 3, depth: 8, correctness: 8 },
      ];
      expect(buildRubricTrendSection(clarityWeak)).toContain('TARGET WEAKEST DIMENSION (CLARITY)');

      const correctnessWeak = [
        { turn: 1, clarity: 9, depth: 9, correctness: 4 },
      ];
      expect(buildRubricTrendSection(correctnessWeak)).toContain('TARGET WEAKEST DIMENSION (CORRECTNESS)');
    });

    it('integrates rubric trend section into buildFollowUpPrompt when rubricHistory exists', () => {
      const prompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Design rate limiter.',
        transcript: [],
        candidateResponse: 'Use sliding window counter.',
        interviewType: 'system_design',
        interviewContext: {
          stage: 'technical',
          rubricHistory: [
            { turn: 1, clarity: 7, depth: 4, correctness: 7 },
            { turn: 2, clarity: 8, depth: 5, correctness: 8 },
          ],
        },
      });

      expect(prompt).toContain('RUBRIC TREND (recent turns):');
      expect(prompt).toContain('TARGET WEAKEST DIMENSION (DEPTH)');
    });

    it('omits rubric trend section when rubricHistory is empty or not provided', () => {
      const prompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Design rate limiter.',
        transcript: [],
        candidateResponse: 'Use sliding window counter.',
        interviewType: 'system_design',
        interviewContext: {
          stage: 'technical',
          rubricHistory: [],
        },
      });

      expect(prompt).not.toContain('RUBRIC TREND');
    });
  });

  describe('InterviewPromptService.buildFollowUpPrompt', () => {
    it('builds follow up prompt with type rules and interviewer persona', () => {
      const prompt = InterviewPromptService.buildFollowUpPrompt({
        problemStatement: 'Design a distributed rate limiter.',
        transcript: [
          { role: 'candidate', text: 'I would use a token bucket algorithm with Redis.' },
        ],
        candidateResponse: 'We can use Redis with Lua scripts to ensure atomicity.',
        interviewType: 'system-design',
        interviewContext: {
          turns: 2,
          currentDifficulty: 'medium',
        },
      });

      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('Design a distributed rate limiter');
      expect(prompt).toContain('Redis');
      expect(prompt).toContain('system-design');
    });
  });
});

