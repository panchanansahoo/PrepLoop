import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  evaluateFresherAnswer,
  detectStarBreakdown,
  evaluateAnswerWithSemanticRubric,
  isHybridScoringEnabled,
  generateExecutiveSummary,
  generateTestRunnerFeedback,
  evaluateTestRunnerResults,
  evaluateAssessmentIntegrity,
  _evaluateFresherAnswer,
  evaluateAnswerLength,
  detectComplexityMismatch,
  pickImprovements,
  generateFeedbackSummary,
} from '../../services/interviewAnswerEvaluator.js';

vi.mock('../../services/llmRouter.js', () => ({
  callTurnScoring: vi.fn().mockResolvedValue({
    score: 85,
    evalProvider: 'mock-llm',
    evalModelUsed: 'mock-model',
    dimensions: { communication: 4, depth: 4, correctness: 4 },
    strengths: ['Clear explanation'],
    improvements: ['Consider edge cases'],
    feedback: 'Good structured answer with solid depth.',
    nextStep: 'Practice drill: Review advanced edge cases.',
    reaction: 'impressed',
  }),
}));

describe('interviewAnswerEvaluator (Track 1.3 Semantic Rubrics)', () => {
  it('evaluates empty answer with minimal score and valid rubric structure', () => {
    const result = evaluateFresherAnswer('', 'Technical');
    expect(result.score).toBe(25);
    expect(result.rubric).toBeDefined();
    expect(result.rubric.clarity).toBeGreaterThanOrEqual(1);
    expect(result.rubric.depth).toBeGreaterThanOrEqual(1);
    expect(result.rubric.correctness).toBeGreaterThanOrEqual(1);
    expect(result.rubric.starStructure).toBeGreaterThanOrEqual(1);
    expect(result.rubric.specificity).toBeGreaterThanOrEqual(1);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(typeof result.feedbackSummary).toBe('string');
  });

  it('correctly scores detailed technical answers with complexity and trade-offs', () => {
    const detailedAnswer = `
      In our project, we were facing heavy database query latency. My task was to optimize the indexing strategy.
      I decided to implement a compound index on the primary key and foreign key columns and introduced Redis caching.
      Because of this approach, we reduced latency by 45% and improved throughput to 2500 qps.
      The time complexity of lookups dropped from O(n) table scans to O(1) cache hits, with an O(log n) database fallback.
    `;
    const result = evaluateFresherAnswer(detailedAnswer, 'Technical');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.rubric.depth).toBeGreaterThanOrEqual(7);
    expect(result.rubric.specificity).toBeGreaterThanOrEqual(7);
    expect(result.rubric.starStructure).toBeGreaterThanOrEqual(8);
    expect(result.strengths.some((s) => s.toLowerCase().includes('complexity') || s.toLowerCase().includes('impact'))).toBe(true);
  });

  it('detects STAR components accurately in behavioral answers', () => {
    const starText = `
      At that time, our team was falling behind the sprint deadline.
      My role was to unblock the backend authentication integration.
      I organized a pair-programming session and built a mock server to unblock frontend developers.
      As a result, we delivered the feature 2 days early with 99.9% uptime.
    `;
    const star = detectStarBreakdown(starText);
    expect(star.situation).toBe(true);
    expect(star.task).toBe(true);
    expect(star.action).toBe(true);
    expect(star.result).toBe(true);
    expect(star.isComplete).toBe(true);
    expect(star.score).toBe(10);
  });

  it('provides backwards-compatible alias _evaluateFresherAnswer', () => {
    const res1 = evaluateFresherAnswer('I created a class for inheritance.', 'Technical');
    const res2 = _evaluateFresherAnswer('I created a class for inheritance.', 'Technical');
    expect(res1.score).toBe(res2.score);
  });

  it('asynchronously evaluates answer using evaluateAnswerWithSemanticRubric with robust fallback', async () => {
    const res = await evaluateAnswerWithSemanticRubric({
      userAnswer: 'I implemented binary search with O(log n) time complexity.',
      stage: 'Technical',
      question: 'How does binary search work?',
      difficultyTag: 'medium',
    });
    expect(res.score).toBeGreaterThanOrEqual(25);
    expect(res.rubric).toBeDefined();
    expect(res.rubric.clarity).toBeGreaterThanOrEqual(1);
  });

  describe('evaluateAnswerWithSemanticRubric feature flags & hybrid scoring', () => {
    const originalFlag1 = process.env.FEATURE_FLAG_HYBRID_SCORING;
    const originalFlag2 = process.env.FEATURE_AI_INTERVIEW_HYBRID_SCORING;

    beforeEach(() => {
      delete process.env.FEATURE_FLAG_HYBRID_SCORING;
      delete process.env.FEATURE_AI_INTERVIEW_HYBRID_SCORING;
    });

    afterEach(() => {
      if (originalFlag1 !== undefined) process.env.FEATURE_FLAG_HYBRID_SCORING = originalFlag1;
      else delete process.env.FEATURE_FLAG_HYBRID_SCORING;
      if (originalFlag2 !== undefined) process.env.FEATURE_AI_INTERVIEW_HYBRID_SCORING = originalFlag2;
      else delete process.env.FEATURE_AI_INTERVIEW_HYBRID_SCORING;
    });

    it('returns baseEvaluation with evalProvider: "disabled" when feature flag is disabled', async () => {
      const res = await evaluateAnswerWithSemanticRubric({
        userAnswer: 'I implemented binary search with O(log n) time complexity.',
        stage: 'Technical',
        question: 'How does binary search work?',
        difficultyTag: 'medium',
      });
      expect(res.evalProvider).toBe('disabled');
      expect(res.score).toBeGreaterThanOrEqual(25);
      expect(res.rubric).toBeDefined();
    });

    it('enables hybrid scoring via FEATURE_FLAG_HYBRID_SCORING="true"', async () => {
      process.env.FEATURE_FLAG_HYBRID_SCORING = 'true';
      expect(isHybridScoringEnabled()).toBe(true);

      const res = await evaluateAnswerWithSemanticRubric({
        userAnswer: 'I implemented binary search with O(log n) time complexity.',
        stage: 'Technical',
        question: 'How does binary search work?',
        difficultyTag: 'medium',
      });
      expect(res.evalProvider).not.toBe('disabled');
    });

    it('enables hybrid scoring via alias FEATURE_AI_INTERVIEW_HYBRID_SCORING="1"', async () => {
      process.env.FEATURE_AI_INTERVIEW_HYBRID_SCORING = '1';
      expect(isHybridScoringEnabled()).toBe(true);

      const res = await evaluateAnswerWithSemanticRubric({
        userAnswer: 'I implemented binary search with O(log n) time complexity.',
        stage: 'Technical',
        question: 'How does binary search work?',
        difficultyTag: 'medium',
      });
      expect(res.evalProvider).not.toBe('disabled');
    });

    it('allows options.forceEnabled to override feature flag state', async () => {
      // Force enabled when flag is off
      delete process.env.FEATURE_FLAG_HYBRID_SCORING;
      expect(isHybridScoringEnabled({ forceEnabled: true })).toBe(true);

      // Force disabled when flag is on
      process.env.FEATURE_FLAG_HYBRID_SCORING = 'true';
      expect(isHybridScoringEnabled({ forceEnabled: false })).toBe(false);

      const res = await evaluateAnswerWithSemanticRubric({
        userAnswer: 'I implemented binary search with O(log n) time complexity.',
        stage: 'Technical',
        question: 'How does binary search work?',
        difficultyTag: 'medium',
        options: { forceEnabled: false },
      });
      expect(res.evalProvider).toBe('disabled');
    });
  });

  describe('generateExecutiveSummary (Stage 4 Recruiter Intelligence)', () => {
    it('produces structured 3-bullet summary with Key Strengths, Growth Areas, and Hiring Recommendation', () => {
      const breakdown = [
        {
          questionIndex: 1,
          question: 'Explain how Node.js handles async I/O',
          score: 85,
          coveredTopics: ['event loop', 'libuv', 'callbacks'],
          missedTopics: ['thread pool'],
        },
        {
          questionIndex: 2,
          question: 'How do you structure microservices?',
          score: 80,
          coveredTopics: ['api gateway', 'database per service'],
          missedTopics: [],
        },
      ];

      const summary = generateExecutiveSummary({
        overallScore: 82,
        passingScore: 70,
        decision: 'qualified',
        breakdown,
        integrity: { flagged: false, tabSwitchCount: 0, pasteCount: 0 },
      });

      expect(summary).toBeDefined();
      expect(summary.bullets).toHaveLength(3);
      expect(summary.bullets[0]).toMatch(/^Key Strengths:/i);
      expect(summary.bullets[1]).toMatch(/^Growth Areas:/i);
      expect(summary.bullets[2]).toMatch(/^Hiring Recommendation:/i);
      expect(summary.keyStrengths).toContain('event loop');
      expect(summary.growthAreas).toContain('thread pool');
      expect(summary.hiringRecommendation).toMatch(/hire|advance/i);
      expect(summary.text).toContain('• Key Strengths:');
    });

    it('flags integrity alerts in hiring recommendation when telemetry indicates off-tab activity', () => {
      const summary = generateExecutiveSummary({
        overallScore: 90,
        passingScore: 70,
        integrity: { flagged: true, tabSwitchCount: 5, pasteCount: 4 },
        breakdown: [],
      });

      expect(summary.hiringRecommendation).toMatch(/integrity alert|do not proceed/i);
      expect(summary.bullets[2]).toMatch(/integrity alert|do not proceed/i);
    });

    it('adapts recommendation when candidate falls below passing threshold or needs review', () => {
      const reviewNeeded = generateExecutiveSummary({
        overallScore: 65,
        passingScore: 70,
        breakdown: [],
      });
      expect(reviewNeeded.hiringRecommendation).toMatch(/review needed|borderline/i);

      const rejected = generateExecutiveSummary({
        overallScore: 40,
        passingScore: 70,
        breakdown: [],
      });
      expect(rejected.hiringRecommendation).toMatch(/do not advance/i);
    });
  });

  describe('generateTestRunnerFeedback (Pillar 2 Contextual AI Feedback)', () => {
    it('detects timeout and suggests algorithmic complexity improvements', () => {
      const timeoutResult = {
        success: false,
        error: 'Execution timed out after 3000ms',
        executionTime: 3100,
        code: `
          function twoSum(nums, target) {
            for (let i = 0; i < nums.length; i++) {
              for (let j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) return [i, j];
              }
            }
          }
        `,
        testResults: [
          { input: '[1,2,3...100000]', expected: '[99998, 99999]', actual: 'Timed out', passed: false, error: 'timed out' },
        ],
      };

      const feedback = generateTestRunnerFeedback(timeoutResult, { problemTitle: 'Two Sum' });
      expect(feedback.category).toBe('timeout');
      expect(feedback.status).toBe('timeout');
      expect(feedback.headline).toMatch(/time limit exceeded/i);
      expect(feedback.timeComplexityObservation).toMatch(/quadratic|O\(N²\)/i);
      expect(feedback.actionableHints.some((h) => h.includes('hash map') || h.includes('O(N)'))).toBe(true);
      expect(feedback.interviewerQuestionCue).toMatch(/time complexity|nested loops/i);
    });

    it('identifies edge case failures such as empty arrays and negative numbers', () => {
      const edgeCaseResult = {
        success: false,
        testResults: [
          { input: '[2, 7, 11, 15]', expected: '[0, 1]', actual: '[0, 1]', passed: true },
          { input: '[]', expected: 'null', actual: 'undefined', passed: false },
          { input: '[-5, -2, 0]', expected: '[0, 1]', actual: '[-5, -2]', passed: false },
        ],
        code: 'function solve(arr) { return [arr[0], arr[1]]; }',
      };

      const feedback = generateTestRunnerFeedback(edgeCaseResult);
      expect(feedback.category).toBe('edge_case_failure');
      expect(feedback.status).toBe('failed');
      expect(feedback.edgeCasesDetected.length).toBeGreaterThan(0);
      expect(feedback.edgeCasesDetected.some((ec) => ec.type === 'empty_or_null_input')).toBe(true);
      expect(feedback.actionableHints.some((h) => h.includes('guard clause') || h.includes('length'))).toBe(true);
      expect(feedback.interviewerQuestionCue).toMatch(/edge|boundary/i);
    });

    it('diagnoses runtime exceptions with targeted fixes', () => {
      const runtimeErrorResult = {
        success: false,
        error: 'TypeError: Cannot read properties of undefined (reading "length")',
        testResults: [
          { input: 'null', expected: '0', actual: 'TypeError', passed: false, error: 'TypeError: Cannot read properties of undefined' },
        ],
        code: 'function count(items) { return items.length; }',
      };

      const feedback = generateTestRunnerFeedback(runtimeErrorResult);
      expect(feedback.category).toBe('runtime_error');
      expect(feedback.status).toBe('error');
      expect(feedback.headline).toMatch(/runtime exception/i);
      expect(feedback.recommendedFix).toMatch(/null checks|guard/i);
    });

    it('celebrates 100% test pass rate with complexity insights and follow-up scaling questions', () => {
      const allPassedResult = {
        success: true,
        passed: 4,
        total: 4,
        executionTime: 42,
        code: `
          function twoSum(nums, target) {
            const map = new Map();
            for (let i = 0; i < nums.length; i++) {
              const diff = target - nums[i];
              if (map.has(diff)) return [map.get(diff), i];
              map.set(nums[i], i);
            }
            return [];
          }
        `,
        testResults: [
          { input: '[2,7,11,15], 9', expected: '[0,1]', actual: '[0,1]', passed: true },
          { input: '[3,2,4], 6', expected: '[1,2]', actual: '[1,2]', passed: true },
          { input: '[3,3], 6', expected: '[0,1]', actual: '[0,1]', passed: true },
          { input: '[], 0', expected: '[]', actual: '[]', passed: true },
        ],
      };

      const feedback = generateTestRunnerFeedback(allPassedResult, { problemTitle: 'Two Sum' });
      expect(feedback.category).toBe('all_passed');
      expect(feedback.status).toBe('passed');
      expect(feedback.passRate).toBe(1.0);
      expect(feedback.headline).toContain('100%');
      expect(feedback.spaceComplexityObservation).toContain('O(N)');
      expect(feedback.interviewerQuestionCue).toMatch(/stream|memory|unbounded/i);
    });

    it('supports evaluateTestRunnerResults backwards-compatible alias', () => {
      const res1 = generateTestRunnerFeedback({ passed: 1, total: 1 });
      const res2 = evaluateTestRunnerResults({ passed: 1, total: 1 });
      expect(res1.category).toBe(res2.category);
      expect(res1.status).toBe(res2.status);
    });
  });

  describe('Pillar 3 Next-Gen Anti-Cheat & Proctoring 2.0 Integration', () => {
    it('flags secondary voice interference during candidate think-time', () => {
      const result = evaluateAssessmentIntegrity({
        tabSwitchCount: 0,
        pasteCount: 0,
        secondaryVoiceDetected: true,
        secondVoiceCount: 2,
      });

      expect(result.flagged).toBe(true);
      expect(result.integrityRating).toBe('flagged');
      expect(result.secondaryVoiceDetected).toBe(true);
      expect(result.secondVoiceCount).toBe(2);
      expect(result.integrityScore).toBeLessThanOrEqual(75);
      expect(result.violations.some((v) => v.type === 'secondary_voice')).toBe(true);
      expect(result.flagsSummary).toContain('Secondary voice (2)');
    });

    it('evaluates whispering detection and flags repeated incidents', () => {
      const result = evaluateAssessmentIntegrity({
        tabSwitchCount: 0,
        pasteCount: 0,
        whisperDetected: true,
        whisperCount: 2,
      });

      expect(result.flagged).toBe(true);
      expect(result.integrityRating).toBe('flagged');
      expect(result.whisperDetected).toBe(true);
      expect(result.whisperCount).toBe(2);
      expect(result.violations.some((v) => v.type === 'whispering')).toBe(true);
    });

    it('flags AI-generated speech patterns and deducts integrity score', () => {
      const result = evaluateAssessmentIntegrity({
        tabSwitchCount: 0,
        pasteCount: 0,
        llmSpeechDetected: true,
        llmSpeechConfidence: 0.92,
        llmSpeechRiskLevel: 'critical',
      });

      expect(result.flagged).toBe(true);
      expect(result.integrityRating).toBe('flagged');
      expect(result.llmSpeechDetected).toBe(true);
      expect(result.llmSpeechConfidence).toBe(0.92);
      expect(result.llmSpeechRiskLevel).toBe('critical');
      expect(result.integrityScore).toBeLessThanOrEqual(60);
      expect(result.violations.some((v) => v.type === 'ai_generated_speech')).toBe(true);
    });

    it('automatically analyzes unanalyzed candidate answer for AI generation if transcript provided', () => {
      const chatGptTranscript = 'Certainly! In order to solve this, first and foremost, it is important to implement Redis.';
      const result = evaluateAssessmentIntegrity({
        tabSwitchCount: 0,
        pasteCount: 0,
        transcript: chatGptTranscript,
      });

      expect(result.llmSpeechDetected).toBe(true);
      expect(result.flagged).toBe(true);
      expect(result.integrityRating).toBe('flagged');
      expect(result.llmSpeechConfidence).toBeGreaterThanOrEqual(0.6);
    });

    it('synthesizes multi-anomaly integrity alerts in executive summary', () => {
      const summary = generateExecutiveSummary({
        overallScore: 88,
        passingScore: 70,
        integrity: {
          flagged: true,
          tabSwitchCount: 1,
          pasteCount: 2,
          secondaryVoiceDetected: true,
          secondVoiceCount: 2,
          llmSpeechDetected: true,
          llmSpeechConfidence: 0.89,
        },
        breakdown: [],
      });

      expect(summary.hiringRecommendation).toMatch(/integrity alert|do not proceed/i);
      expect(summary.hiringRecommendation).toContain('secondary voice interference');
      expect(summary.hiringRecommendation).toContain('AI-generated speech patterns');
      expect(summary.bullets[2]).toContain('Do Not Proceed (Integrity Alert)');
    });
  });

  describe('Phase B Improvements (Track B.1 - B.5)', () => {
    describe('Stage-Aware & Type-Aware Length Scoring (B.5)', () => {
      const makeWords = (n) => Array(n).fill('word').join(' ');

      it('scores Technical and DSA stages using 5-point tiers', () => {
        expect(evaluateAnswerLength(makeWords(65), 'Technical')).toBe(5);
        expect(evaluateAnswerLength(makeWords(45), 'DSA / Coding')).toBe(4);
        expect(evaluateAnswerLength(makeWords(25), 'Technical')).toBe(3);
        expect(evaluateAnswerLength(makeWords(12), 'DSA / Coding')).toBe(2);
        expect(evaluateAnswerLength(makeWords(5), 'Technical')).toBe(1);
      });

      it('rewards structured long answers in HR, Behavioral, and System Design with up to 7 points', () => {
        expect(evaluateAnswerLength(makeWords(160), 'Behavioral')).toBe(7);
        expect(evaluateAnswerLength(makeWords(110), 'HR')).toBe(6);
        expect(evaluateAnswerLength(makeWords(65), 'System Design')).toBe(5);
        expect(evaluateAnswerLength(makeWords(45), 'Behavioral')).toBe(4);
        expect(evaluateAnswerLength(makeWords(25), 'HR')).toBe(3);
        expect(evaluateAnswerLength(makeWords(12), 'System Design')).toBe(2);
        expect(evaluateAnswerLength(makeWords(5), 'Behavioral')).toBe(1);
      });

      it('respects interviewType parameter for stage/type override', () => {
        expect(evaluateAnswerLength(makeWords(155), 'Technical', 'system-design')).toBe(7);
        expect(evaluateAnswerLength(makeWords(105), 'Technical', 'behavioral')).toBe(6);
        expect(evaluateAnswerLength(makeWords(155), 'Technical', 'dsa')).toBe(5);
      });
    });

    describe('Complexity Mismatch & Misconceptions (B.1)', () => {
      it('detects complexity mismatch when candidate claims inferior complexity', () => {
        const answer = 'I implemented a nested loop solution which takes O(n^2) time complexity.';
        const mismatch = detectComplexityMismatch(answer, {
          problemRequirements: 'Expected time complexity: O(n)',
        });
        expect(mismatch).not.toBeNull();
        expect(mismatch.expected).toBe('O(n)');
        expect(mismatch.actual).toBe('O(n^2)');
      });

      it('records misconception in misconceptionsDetected and deducts 2 points on correctness', () => {
        const answer = 'I solved this problem with two loops resulting in O(n^2) runtime complexity.';
        const resultWithoutReq = evaluateFresherAnswer(answer, 'Technical');
        const resultWithReq = evaluateFresherAnswer(answer, 'Technical', '', {
          problemRequirements: { expectedComplexity: 'O(n)' },
        });

        expect(resultWithReq.misconceptionsDetected.length).toBeGreaterThan(0);
        expect(resultWithReq.misconceptionsDetected[0]).toContain('Complexity mismatch');
        expect(resultWithReq.rubric.correctness).toBe(Math.max(1, resultWithoutReq.rubric.correctness - 2));
      });

      it('does not record misconception when candidate achieves expected or better complexity', () => {
        const answer = 'I used two pointers achieving O(n) linear time complexity.';
        const result = evaluateFresherAnswer(answer, 'Technical', '', {
          problemRequirements: 'Expected time complexity: O(n)',
        });
        expect(result.misconceptionsDetected).toEqual([]);
      });
    });

    describe('Question-Linked Improvements (B.2)', () => {
      it('generates targeted improvement advice for missing tags', () => {
        const answer = 'We can build a microservice architecture and use a relational database.';
        const improvements = pickImprovements(answer, 'System Design', {
          tags: ['caching', 'rate-limiting', 'sharding'],
        });

        expect(improvements.some((imp) => imp.includes('caching') || imp.includes('rate-limiting') || imp.includes('sharding'))).toBe(true);
      });

      it('advises targeting expected complexity when requirements specify it', () => {
        const answer = 'I can iterate through the list with nested loops.';
        const improvements = pickImprovements(answer, 'Technical', {
          problemRequirements: 'Expected time complexity: O(n)',
        });
        expect(improvements.some((imp) => imp.toLowerCase().includes('complexity'))).toBe(true);
      });
    });

    describe('Actionable NextStep & generateFeedbackSummary (B.3)', () => {
      it('constructs an actionable nextStep practice directive in generateFeedbackSummary', () => {
        const feedback = generateFeedbackSummary(
          72,
          ['Good structure'],
          ['State time and space complexity explicitly'],
          'Technical'
        );
        expect(feedback.summary).toContain('Solid attempt');
        expect(typeof feedback.nextStep).toBe('string');
        expect(feedback.nextStep).toContain('Practice drill:');
        expect(feedback.nextStep).toContain('State time and space complexity explicitly');
      });

      it('returns nextStep and misconceptionsDetected on evaluateFresherAnswer return object', () => {
        const result = evaluateFresherAnswer('We can use binary search with O(log n) complexity.', 'Technical');
        expect(typeof result.nextStep).toBe('string');
        expect(result.nextStep.length).toBeGreaterThan(0);
        expect(Array.isArray(result.misconceptionsDetected)).toBe(true);
      });

      it('applies anti-inflation depth penalty when jargon keywords are stuffed into short answers (<50 words)', () => {
        // Answer is short (15 words) but packed with keywords
        const stuffedShortAnswer = 'We use hashmap trie binary search dynamic programming graph algorithm with linear time complexity O(n).';
        const result = evaluateFresherAnswer(stuffedShortAnswer, 'Technical');
        // Unpenalized depth would be >= 9 from 5+ tech keywords + complexity, penalized by 0.75
        expect(result.rubric.depth).toBeLessThanOrEqual(7);
      });
    });
  });
});


