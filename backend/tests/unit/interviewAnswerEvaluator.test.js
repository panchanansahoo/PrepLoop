import { describe, it, expect } from 'vitest';
import {
  evaluateFresherAnswer,
  detectStarBreakdown,
  evaluateAnswerWithSemanticRubric,
  generateExecutiveSummary,
  generateTestRunnerFeedback,
  evaluateTestRunnerResults,
  evaluateAssessmentIntegrity,
  _evaluateFresherAnswer,
} from '../../services/interviewAnswerEvaluator.js';

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
});


