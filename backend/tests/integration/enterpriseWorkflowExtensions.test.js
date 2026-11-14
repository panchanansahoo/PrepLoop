import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';

// ─── Lucide-react and Monaco mocks (for importing frontend components) ───
vi.mock('lucide-react', () => ({
  Brain: () => null,
  Code2: () => null,
  MessageSquare: () => null,
  Network: () => null,
  Info: () => null,
  TrendingUp: () => null,
  Award: () => null,
  CheckCircle2: () => null,
  Sliders: () => null,
  Play: () => null,
  AlertCircle: () => null,
  Clock: () => null,
  RotateCcw: () => null,
  Copy: () => null,
  Check: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
  Sparkles: () => null,
  HelpCircle: () => null,
  AlertTriangle: () => null,
  Lightbulb: () => null,
  Loader2: () => null,
  FileText: () => null,
  Terminal: () => null,
  Layers: () => null,
  Plus: () => null,
  Maximize2: () => null,
  Columns: () => null,
  PanelLeft: () => null,
}));

vi.mock('@monaco-editor/react', () => ({
  default: () => null,
}));

// ─── Module Imports Under Test ───
// Pillar 1: Cohort Benchmarking & Competency Radar
import {
  extractScores,
  calculatePercentileRank,
  calculateCohortStatistics,
  generateBellCurveDistribution,
  calculateRelativeScore,
  getCohortTier,
  calculateCohortBenchmark,
} from '../../utils/cohortBenchmark.js';
import {
  calculateCompetencies,
  COMPETENCY_DEFINITIONS,
} from '../../../frontend/src/components/interview/CompetencyRadarChart.jsx';

// Pillar 2 & 3: Coding Sandbox Diagnostics & Proctoring 2.0 (LLM & Second-Voice)
import {
  generateTestRunnerFeedback,
  evaluateTestRunnerResults,
  evaluateAssessmentIntegrity,
  generateExecutiveSummary,
} from '../../services/interviewAnswerEvaluator.js';
import {
  detectAIGeneratedSpeech,
  detectCannedPhrases,
  analyzeBurstinessAndPerplexity,
  detectTeleprompterCadence,
} from '../../utils/llmSpeechDetector.js';
import {
  calculateRms,
  calculateSpectralCentroid,
  detectWhisperSignature,
  detectSecondaryVoiceSignature,
} from '../../../frontend/src/utils/audioProctoringDetector.js';

// Pillar 4: Candidate Self-Scheduling & Feedback Portal
import {
  sanitizeCandidateReport,
  generateCandidateSafeFeedback,
  generateAvailableSlotWindows,
} from '../../routes/interview/feedbackPortal.js';
import feedbackPortalRouter from '../../routes/interview/feedbackPortal.js';
import {
  buildCandidateReminderEmail,
  formatCandidateSmsReminder,
  formatSlackReminderPayload,
  dispatchCandidateReminder,
} from '../../utils/interviewMailer.js';
import * as emailService from '../../services/emailService.js';

describe('Enterprise Workflow Extensions Integration Test Suite (Pillars 1 - 5)', () => {
  let app;
  let server = null;
  let baseUrl = '';

  beforeEach(async () => {
    vi.restoreAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/interview', feedbackPortalRouter);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server?.close(() => resolve()));
      server = null;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: COHORT BENCHMARKING & RELATIVE SCORING INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 1: Cohort Benchmarking & Relative Scoring Intelligence', () => {
    const sampleCohort = [
      48, 55, 62, 65, 68, 70, 72, 74, 75, 78,
      80, 82, 85, 87, 88, 90, 92, 94, 96, 99
    ];

    it('extracts and normalizes raw scores from numeric lists and submission objects', () => {
      const mixedInput = [
        85,
        { overall_score: 92 },
        { scores: { serverOverallScore: 78 } },
        { scores: { score: 64 } },
        { score: 55 },
        'invalid',
        null,
        105, // clamps to 100
        -10, // clamps to 0
      ];

      const extracted = extractScores(mixedInput);
      expect(extracted).toEqual([0, 55, 64, 78, 85, 92, 100]);
    });

    it('calculates cohort descriptive statistics (mean, median, stdDev, IQR, percentiles)', () => {
      const stats = calculateCohortStatistics(sampleCohort);

      expect(stats.count).toBe(20);
      expect(stats.min).toBe(48);
      expect(stats.max).toBe(99);
      expect(stats.mean).toBeGreaterThanOrEqual(76);
      expect(stats.mean).toBeLessThanOrEqual(80);
      expect(stats.median).toBe(79); // Average of 78 and 80
      expect(stats.stdDev).toBeGreaterThan(10);
      expect(stats.p25).toBeLessThan(stats.median);
      expect(stats.p75).toBeGreaterThan(stats.median);
      expect(stats.iqr).toBe(Number((stats.p75 - stats.p25).toFixed(1)));
    });

    it('handles empty and singleton cohorts gracefully without throwing', () => {
      const emptyStats = calculateCohortStatistics([]);
      expect(emptyStats.count).toBe(0);
      expect(emptyStats.mean).toBe(0);
      expect(emptyStats.stdDev).toBe(0);

      const singleRank = calculatePercentileRank(85, []);
      expect(singleRank.percentile).toBe(50);
      expect(singleRank.rank).toBe(1);
    });

    it('accurately computes percentile rank and top percentage across the cohort distribution', () => {
      // Candidate scoring 96 in sampleCohort
      const topCandidate = calculatePercentileRank(96, sampleCohort);
      expect(topCandidate.percentile).toBeGreaterThanOrEqual(90);
      expect(topCandidate.topPercentage).toBeLessThanOrEqual(10);
      expect(topCandidate.rank).toBeLessThanOrEqual(3);

      // Median candidate scoring 79 in sampleCohort
      const medianCandidate = calculatePercentileRank(79, sampleCohort);
      expect(medianCandidate.percentile).toBeGreaterThanOrEqual(45);
      expect(medianCandidate.percentile).toBeLessThanOrEqual(55);

      // Bottom candidate scoring 50
      const bottomCandidate = calculatePercentileRank(50, sampleCohort);
      expect(bottomCandidate.percentile).toBeLessThanOrEqual(15);
      expect(bottomCandidate.topPercentage).toBeGreaterThanOrEqual(85);
    });

    it('generates 10-bucket bell curve distribution with candidate bucket highlighting', () => {
      const candidateScore = 85;
      const distribution = generateBellCurveDistribution(sampleCohort, candidateScore, 10);

      expect(distribution.length).toBe(10);
      let totalCount = 0;
      let candidateBucketFound = false;

      for (const bucket of distribution) {
        expect(bucket).toHaveProperty('bucketIndex');
        expect(bucket).toHaveProperty('label');
        expect(bucket).toHaveProperty('count');
        expect(bucket).toHaveProperty('percentage');
        expect(bucket).toHaveProperty('normalDensity');
        totalCount += bucket.count;

        if (bucket.isCandidateBucket) {
          candidateBucketFound = true;
          expect(candidateScore).toBeGreaterThanOrEqual(bucket.min);
          expect(candidateScore).toBeLessThanOrEqual(bucket.max);
        }
      }

      expect(totalCount).toBe(sampleCohort.length);
      expect(candidateBucketFound).toBe(true);
    });

    it('calculates relative standing (deltaFromMean, deltaFromMedian, zScore) and tier badge', () => {
      const candidateScore = 92;
      const relative = calculateRelativeScore(candidateScore, sampleCohort);

      expect(relative.deltaFromMean).toBeGreaterThan(0);
      expect(relative.deltaFromMedian).toBeGreaterThan(0);
      expect(relative.zScore).toBeGreaterThan(0.8);
      expect(relative.rank).toBeGreaterThanOrEqual(1);

      const rankData = calculatePercentileRank(candidateScore, sampleCohort);
      const tier = getCohortTier(rankData.percentile, candidateScore);
      expect(['Top 10%', 'Top 25%', 'Above Median']).toContain(tier.tier);
      expect(['Exceptional Performer', 'Strong Performer', 'Solid Competence']).toContain(tier.label);
      expect(tier).toHaveProperty('variant');
      expect(tier).toHaveProperty('badgeColor');

      // Comprehensive coordinator benchmark wrapper
      const fullBenchmark = calculateCohortBenchmark(candidateScore, sampleCohort);
      expect(fullBenchmark).toHaveProperty('percentile');
      expect(fullBenchmark).toHaveProperty('stats');
      expect(fullBenchmark).toHaveProperty('distribution');
      expect(fullBenchmark).toHaveProperty('tier');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: WEIGHTED COMPETENCY RADAR & MULTI-DIMENSIONAL SKILL MAPPING
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 1B: Weighted Competency Radar & Multi-Dimensional Rubric', () => {
    it('verifies standard competency definitions across 4 core dimensions', () => {
      const keys = Object.keys(COMPETENCY_DEFINITIONS);
      expect(keys).toContain('problem_solving');
      expect(keys).toContain('technical_depth');
      expect(keys).toContain('communication');
      expect(keys).toContain('system_architecture');

      const totalWeight = keys.reduce((acc, k) => acc + COMPETENCY_DEFINITIONS[k].defaultWeight, 0);
      expect(totalWeight).toBe(100);

      for (const key of keys) {
        const def = COMPETENCY_DEFINITIONS[key];
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(Array.isArray(def.keywords)).toBe(true);
        expect(def.keywords.length).toBeGreaterThanOrEqual(10);
      }
    });

    it('maps question evaluation items and topics to competencies dynamically', () => {
      const questionBreakdown = [
        {
          question: 'Implement an optimal LRU cache in JavaScript with O(1) operations',
          score: 88,
          coveredTopics: ['algorithm', 'hash map', 'complexity', 'doubly linked list'],
        },
        {
          question: 'Explain React 18 concurrent mode, fiber reconciliation, and useId hook',
          score: 92,
          coveredTopics: ['react', 'hook', 'fiber', 'concurrency'],
        },
        {
          question: 'Describe how you resolved a major engineering deadline dispute using STAR',
          score: 84,
          coveredTopics: ['behavioral', 'star', 'collaboration', 'trade-off'],
        },
        {
          question: 'Design a globally distributed rate limiter with Redis and sliding window',
          score: 82,
          coveredTopics: ['system design', 'redis', 'sliding window', 'distributed'],
        },
      ];

      const competencies = calculateCompetencies({
        breakdown: questionBreakdown,
        overallScore: 86,
        targetPassingScore: 70,
      });

      expect(competencies.length).toBe(4);
      const ps = competencies.find((c) => c.key === 'problem_solving');
      const td = competencies.find((c) => c.key === 'technical_depth');
      const comm = competencies.find((c) => c.key === 'communication');
      const sa = competencies.find((c) => c.key === 'system_architecture');

      expect(ps.score).toBeGreaterThanOrEqual(80);
      expect(td.score).toBeGreaterThanOrEqual(80);
      expect(comm.score).toBeGreaterThanOrEqual(80);
      expect(sa.score).toBeGreaterThanOrEqual(80);

      for (const comp of competencies) {
        expect(comp.deltaVsTarget).toBeGreaterThanOrEqual(0);
        expect(['Mastery / Advanced', 'Proficient', 'Developing']).toContain(comp.level);
        expect(comp.weight).toBeGreaterThan(0);
      }
    });

    it('honors explicit custom rubric scores and custom weights when specified', () => {
      const customScores = {
        problem_solving: 95,
        technical_depth: 90,
        communication: 72,
        system_architecture: 85,
      };

      const customWeights = {
        problem_solving: 40,
        technical_depth: 30,
        communication: 15,
        system_architecture: 15,
      };

      const competencies = calculateCompetencies({
        customScores,
        weights: customWeights,
        targetPassingScore: 80,
      });

      const ps = competencies.find((c) => c.key === 'problem_solving');
      const comm = competencies.find((c) => c.key === 'communication');

      expect(ps.score).toBe(95);
      expect(ps.weight).toBe(40);
      expect(ps.deltaVsTarget).toBe(15); // 95 - 80

      expect(comm.score).toBe(72);
      expect(comm.weight).toBe(15);
      expect(comm.deltaVsTarget).toBe(-8); // 72 - 80, below target
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: CODING SANDBOX EXECUTION DIAGNOSTICS & AI FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 2: Technical Coding Sandbox Execution Diagnostics', () => {
    it('diagnoses Time Limit Exceeded (TLE) / timeouts and generates optimization hints', () => {
      const timeoutResults = {
        success: false,
        passed: 1,
        total: 4,
        error: 'Execution timed out after 3000ms: Time limit exceeded (SIGTERM)',
        code: `
          function twoSum(nums, target) {
            for (let i = 0; i < nums.length; i++) {
              for (let j = 0; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) return [i, j];
              }
            }
          }
        `,
        testResults: [
          { passed: true, input: '[2,7,11,15], 9', expected: '[0,1]', actual: '[0,1]' },
          { passed: false, input: 'Large Array (100,000 items)', error: 'Time limit exceeded' },
        ],
      };

      const feedback = generateTestRunnerFeedback(timeoutResults, {
        problemTitle: 'Two Sum',
        timeLimitMs: 3000,
      });

      expect(feedback.category).toBe('timeout');
      expect(feedback.summary).toMatch(/timed? out|time limit/i);
      expect(feedback.timeComplexityObservation).toMatch(/O\(N\^2\)|quadratic|nested loop/i);
      expect(feedback.actionableHints.length).toBeGreaterThan(0);
      expect(feedback.actionableHints.some((h) => /hash map|linear|O\(N\)|two-pointer/i.test(h))).toBe(true);
      expect(feedback.interviewerQuestionCue).toMatch(/complexity|redundant|times out/i);
    });

    it('identifies boundary and edge-case failures (empty array, null input, negative values)', () => {
      const edgeCaseResults = {
        success: false,
        passed: 2,
        total: 4,
        testResults: [
          { passed: true, input: '[1,2,3]', expected: '6', actual: '6' },
          { passed: true, input: '[4,5,6]', expected: '15', actual: '15' },
          { passed: false, input: '[]', expected: '0', actual: 'undefined' },
          { passed: false, input: '[-5, -10]', expected: '-15', actual: '0' },
        ],
      };

      const feedback = generateTestRunnerFeedback(edgeCaseResults, {
        problemTitle: 'Array Accumulator',
      });

      expect(feedback.category).toBe('edge_case_failure');
      expect(feedback.edgeCasesDetected.length).toBeGreaterThanOrEqual(1);

      const emptyInputCase = feedback.edgeCasesDetected.find((e) => e.type === 'empty_or_null_input');
      expect(emptyInputCase).toBeDefined();
      expect(emptyInputCase.hint).toMatch(/guard clause|empty/i);
    });

    it('diagnoses runtime exceptions with syntax/exception categorization', () => {
      const exceptionResults = {
        success: false,
        passed: 0,
        total: 3,
        error: 'TypeError: Cannot read properties of undefined (reading "length")',
        testResults: [
          { passed: false, error: 'TypeError: Cannot read properties of undefined' },
        ],
      };

      const feedback = generateTestRunnerFeedback(exceptionResults, {
        problemTitle: 'String Parsing',
      });

      expect(feedback.category).toBe('runtime_error');
      expect(feedback.summary).toMatch(/TypeError|exception/i);
      expect(feedback.actionableHints.some((h) => /null|undefined|guard/i.test(h))).toBe(true);
    });

    it('evaluates 100% all-passed solutions with complexity analysis and interviewer depth probes', () => {
      const allPassedResults = {
        success: true,
        passed: 5,
        total: 5,
        code: `
          function hasCycle(head) {
            let slow = head;
            let fast = head;
            while (fast && fast.next) {
              slow = slow.next;
              fast = fast.next.next;
              if (slow === fast) return true;
            }
            return false;
          }
        `,
        testResults: [
          { passed: true }, { passed: true }, { passed: true }, { passed: true }, { passed: true }
        ],
      };

      const feedback = evaluateTestRunnerResults(allPassedResults, {
        problemTitle: 'Linked List Cycle',
      });

      expect(feedback.category).toBe('all_passed');
      expect(feedback.summary).toMatch(/All 5 test cases completed successfully/i);
      expect(feedback.timeComplexityObservation).toMatch(/linear|logarithmic/i);
      expect(feedback.spaceComplexityObservation).toMatch(/O\(1\)|in-place/i);
      expect(feedback.interviewerQuestionCue).toMatch(/exceed available memory|unbounded stream|scale/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: PROCTORING 2.0 (LLM SPEECH & SECOND-VOICE ACOUSTIC INTEGRITY)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 3: Next-Gen Anti-Cheat & Proctoring 2.0 Acoustic Engine', () => {
    it('detects canned robotic AI formulas and opening boilerplate', () => {
      const cannedAnswer = `
        Certainly! In order to effectively design a fault-tolerant distributed system,
        first and foremost, it is important to delve into the multifaceted trade-offs.
        By doing so, we ensure that high availability is preserved.
      `;

      const detected = detectCannedPhrases(cannedAnswer);
      expect(detected.detected).toBe(true);
      expect(detected.matches.length).toBeGreaterThanOrEqual(2);
      expect(detected.score).toBeGreaterThan(0.5);
      expect(detected.categoryBreakdown).toHaveProperty('affirmation');
    });

    it('analyzes sentence length burstiness and flags unnaturally uniform AI speech', () => {
      // 4 sentences with exact equal length of ~14 words each (very low CV)
      const uniformAiAnswer = `
        Distributed databases require consistent hashing in order to balance loads across multiple clusters.
        Replication factors determine how many copies of each partition exist across different availability zones.
        Eventual consistency allows high write throughput while accepting temporary data divergence between nodes.
        Consensus protocols like Raft ensure that leader election occurs safely during sudden network partitions.
      `;

      const burstiness = analyzeBurstinessAndPerplexity(uniformAiAnswer);
      expect(burstiness.sentenceCount).toBe(4);
      expect(burstiness.isUnnaturallyUniform).toBe(true);
      expect(burstiness.burstinessCV).toBeLessThan(0.24);
      expect(burstiness.score).toBeGreaterThan(0.3);
    });

    it('detects teleprompter reading cadence without conversational disfluencies', () => {
      const teleprompterScript = `
        The event loop in Node.js contains six distinct phases executed in a continuous cycle.
        These phases include timers, pending callbacks, idle prepare, poll, check, and close callbacks.
        Microtasks consisting of Promise callbacks and process.nextTick are drained between every single phase.
        This architecture prevents worker thread blocking and maximizes single-threaded I/O efficiency.
      `;

      const teleprompter = detectTeleprompterCadence(teleprompterScript, {
        timestamps: { durationSeconds: 22, pauseDurations: [0.35, 0.36, 0.34, 0.35] },
      });

      expect(teleprompter.detected).toBe(true);
      expect(teleprompter.metrics.disfluencyCount).toBe(0);
      expect(teleprompter.score).toBeGreaterThanOrEqual(0.45);
      expect(teleprompter.reasons.length).toBeGreaterThan(0);
    });

    it('synthesizes overall AI-generated speech risk assessment with composite scoring', () => {
      const compositeAiTranscript = `
        Certainly! In order to scale this microservice, first and foremost, it is crucial to understand caching.
        Redis provides an in-memory key-value data structure store used as a distributed cache.
        Memcached provides a high-performance multithreaded architecture for simple key-value string pairs.
        By doing so, we ensure that database read throughput is reduced by eighty percent.
      `;

      const result = detectAIGeneratedSpeech(compositeAiTranscript);
      expect(result.isAIGenerated).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(['high', 'critical']).toContain(result.riskLevel);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('verifies acoustic audio frequency analysis (whisper & secondary voice detection)', () => {
      // 1. RMS amplitude calculation
      const silentData = new Uint8Array(128).fill(128);
      expect(calculateRms(silentData)).toBe(0);

      const loudData = new Uint8Array(128).fill(255);
      expect(calculateRms(loudData)).toBeCloseTo(0.99, 1);

      // 2. Spectral centroid calculation
      const lowFreqSpectrum = new Array(256).fill(0);
      lowFreqSpectrum[2] = 200; // Low frequency fundamental
      const lowCentroid = calculateSpectralCentroid(lowFreqSpectrum, 44100, 512);

      const highFreqSpectrum = new Array(256).fill(0);
      highFreqSpectrum[100] = 200; // High frequency whisper
      const highCentroid = calculateSpectralCentroid(highFreqSpectrum, 44100, 512);

      expect(highCentroid).toBeGreaterThan(lowCentroid);

      // 3. Whisper signature detector (passing frequency data array with whisper band energy)
      const whisperSpectrum = new Array(512).fill(5);
      // Elevate whisper band (bins 84 - 250 corresponding to ~1.8kHz - 5.5kHz)
      for (let i = 85; i <= 250; i++) {
        whisperSpectrum[i] = 150;
      }
      const whisperResult = detectWhisperSignature(whisperSpectrum, {
        sampleRate: 44100,
        fftSize: 1024,
        ambientFloor: 10,
        sensitivity: 0.8,
      });
      expect(whisperResult.isWhisper).toBe(true);
      expect(whisperResult.confidence).toBeGreaterThan(0.5);

      // 4. Secondary voice during candidate think-time
      const voiceSpectrum = new Array(512).fill(5);
      // Elevate voice vocal fundamental & formants (bins 4 - 70)
      for (let i = 4; i <= 70; i++) {
        voiceSpectrum[i] = 180;
      }
      const secondVoiceResult = detectSecondaryVoiceSignature(voiceSpectrum, {
        isThinkTime: true,
        ambientFloor: 10,
        sampleRate: 44100,
        fftSize: 1024,
      });
      expect(secondVoiceResult.detected).toBe(true);
      expect(secondVoiceResult.type).toBe('think_time_voice');
      expect(secondVoiceResult.confidence).toBeGreaterThan(0.6);
    });

    it('unifies telemetry into evaluateAssessmentIntegrity and updates executive summary', () => {
      const telemetry = {
        tabSwitchCount: 2,
        pasteCount: 1,
        secondaryVoiceDetected: true,
        secondVoiceCount: 2,
        whisperDetected: true,
        whisperCount: 1,
        llmSpeechDetected: true,
        llmSpeechConfidence: 0.85,
        llmSpeechRiskLevel: 'high',
      };

      const integrity = evaluateAssessmentIntegrity(telemetry);
      expect(integrity.flagged).toBe(true);
      expect(integrity.integrityScore).toBeLessThan(50);
      expect(integrity.violations.length).toBeGreaterThanOrEqual(3);
      expect(integrity.violations.some((v) => v.type === 'secondary_voice')).toBe(true);
      expect(integrity.violations.some((v) => v.type === 'ai_generated_speech')).toBe(true);

      // Verify generateExecutiveSummary integrates proctoring alerts
      const execSummary = generateExecutiveSummary(
        {
          breakdown: [{ score: 90, question: 'Alg', coveredTopics: ['algorithms'] }],
          integrity,
          overallScore: 88,
          passingScore: 70,
        }
      );

      expect(execSummary.hiringRecommendation).toMatch(/Integrity Alert|Do Not Proceed|flagged elevated/i);
      expect(execSummary.hiringRecommendation).toContain('secondary voice');
      expect(execSummary.hiringRecommendation).toContain('AI-generated speech');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: CANDIDATE SELF-SCHEDULING & MULTI-CHANNEL COUNTDOWN REMINDERS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 4: Candidate Self-Scheduling & Multi-Channel Reminders', () => {
    it('generates dynamic daylight availability slot windows excluding weekends', () => {
      const slots = generateAvailableSlotWindows(new Date('2026-11-16T08:00:00Z'), 7);

      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) {
        expect(slot).toHaveProperty('slotId');
        expect(slot).toHaveProperty('date');
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('utcTimestamp');
        expect(slot.available).toBe(true);

        const slotDate = new Date(slot.utcTimestamp);
        // Weekend check: 0 is Sunday, 6 is Saturday
        expect(slotDate.getUTCDay()).not.toBe(0);
        expect(slotDate.getUTCDay()).not.toBe(6);
      }
    });

    it('serves available scheduling slots via GET /api/interview/feedback-portal/schedule/:token', async () => {
      const response = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_token`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.scheduling).toBeDefined();
      expect(data.scheduling.durationMinutes).toBe(45);
      expect(Array.isArray(data.scheduling.availableSlots)).toBe(true);
      expect(data.scheduling.availableSlots.length).toBeGreaterThan(0);
    });

    it('books a valid future slot and returns RFC 5545 .ics calendar data', async () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_token/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotTimestamp: futureDate,
          candidateTimezone: 'America/New_York',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.booking.scheduledAt).toBe(futureDate);
      expect(data.booking.candidateTimezone).toBe('America/New_York');
      expect(data.booking.calendarIcs).toContain('BEGIN:VCALENDAR');
      expect(data.booking.calendarIcs).toContain('BEGIN:VEVENT');
      expect(data.booking.calendarIcs).toContain('END:VCALENDAR');
    });

    it('rejects slot booking in the past with 400 error', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const response = await fetch(`${baseUrl}/api/interview/feedback-portal/schedule/demo_schedule_token/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotTimestamp: pastDate,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/Cannot book a slot in the past/i);
    });

    it('formats multi-channel reminder notifications for 24h and 1h countdown pings', () => {
      const reminderParams = {
        questionSetTitle: 'Senior Full-Stack Engineer',
        candidateEmail: 'alex.dev@example.com',
        candidateName: 'Alex Rivera',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        joinUrl: 'https://preploop.com/ai-interview?token=inv_test123',
        companyName: 'Acme Corp',
        countdown: '24h',
      };

      // 1. Email template
      const email = buildCandidateReminderEmail(reminderParams);
      expect(email.subject).toMatch(/Reminder:.*in 24 Hours/i);
      expect(email.html).toContain('24 HOURS REMINDER');
      expect(email.html).toContain(reminderParams.joinUrl);
      expect(email.text).toContain(reminderParams.candidateName);

      // 2. 1-hour countdown email template
      const email1h = buildCandidateReminderEmail({ ...reminderParams, countdown: '1h' });
      expect(email1h.subject).toMatch(/Starting in 1 Hour|1 Hour/i);
      expect(email1h.html).toContain('1 HOUR COUNTDOWN');

      // 3. SMS reminder
      const sms = formatCandidateSmsReminder(reminderParams);
      expect(sms.length).toBeLessThanOrEqual(200);
      expect(sms.text).toContain('PrepLoop Reminder');
      expect(sms.text).toContain(reminderParams.joinUrl);

      // 4. Recruiter Slack alert card
      const slack = formatSlackReminderPayload(reminderParams);
      expect(slack.text).toMatch(/\[Reminder Sent - .*Countdown\]/i);
      expect(slack.text).toContain('Alex Rivera was pinged');
      expect(Array.isArray(slack.blocks)).toBe(true);
    });

    it('simulates candidate reminder dispatch and logs audit trail', async () => {
      vi.spyOn(emailService, 'isEmailConfigured').mockReturnValue(false);

      const report = await dispatchCandidateReminder({
        questionSet: { id: 'qs_123', title: 'Backend Node.js Interview' },
        candidateEmail: 'candidate@example.com',
        candidateName: 'Jordan Lee',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        joinUrl: 'https://preploop.com/ai-interview?token=inv_live',
        countdown: '1h',
      });

      expect(report.status).toBe('simulated');
      expect(report.countdown).toBe('1h');
      expect(report.email).toBe('candidate@example.com');
      expect(report.joinUrl).toContain('token=inv_');
    });

    it('dispatches candidate reminder when email provider is configured', async () => {
      vi.spyOn(emailService, 'isEmailConfigured').mockReturnValue(true);
      vi.spyOn(emailService, 'sendEmail').mockResolvedValue({ id: 'msg_test_999', provider: 'resend' });

      const report = await dispatchCandidateReminder({
        questionSet: { id: 'qs_123', title: 'Backend Node.js Interview' },
        candidateEmail: 'candidate@example.com',
        candidateName: 'Jordan Lee',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        joinUrl: 'https://preploop.com/ai-interview?token=inv_live',
        countdown: '1h',
      });

      expect(report.status).toBe('sent');
      expect(report.messageId).toBe('msg_test_999');
      expect(report.countdown).toBe('1h');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: CANDIDATE-SAFE FEEDBACK PORTAL & ZERO-LEAKAGE DEFENSE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pillar 4B: Candidate-Safe Feedback Portal & Strict Anti-Leakage Defense', () => {
    it('strictly sanitizes internal recruiter rubrics, passing cutoffs, and proctoring telemetry', () => {
      const sensitiveInternalSubmission = {
        id: 'sub_xyz123',
        user_name: 'Taylor Swift',
        user_email: 'taylor@example.com',
        scores: {
          score: 82,
          passingScore: 75,
          decision: 'HIRE_STRONG',
          cheatConfidence: 0.05,
          tabSwitchCount: 0,
          pasteCount: 0,
          secondaryVoiceDetected: false,
          recruiterComments: 'Strong culture fit. Offer recommend.',
          internalNotes: 'Target salary band: $160k-$180k',
          rubricWeights: { technical: 50, behavioral: 50 },
          executiveSummary: {
            keyStrengths: 'Deep understanding of microservice caching.',
            growthAreas: 'Elaborate more on automated integration test suites.',
            hiringRecommendation: 'Recommend immediate onsite interview.',
          },
        },
      };

      const sanitized = sanitizeCandidateReport(sensitiveInternalSubmission);

      // Sensitive fields must be stripped
      expect(sanitized.scores.decision).toBeUndefined();
      expect(sanitized.scores.passingScore).toBeUndefined();
      expect(sanitized.scores.cheatConfidence).toBeUndefined();
      expect(sanitized.scores.tabSwitchCount).toBeUndefined();
      expect(sanitized.scores.pasteCount).toBeUndefined();
      expect(sanitized.scores.recruiterComments).toBeUndefined();
      expect(sanitized.scores.internalNotes).toBeUndefined();
      expect(sanitized.scores.rubricWeights).toBeUndefined();

      // Safe fields preserved
      expect(sanitized.user_name).toBe('Taylor Swift');
      expect(sanitized.scores.executiveSummary.keyStrengths).toBeTruthy();
    });

    it('generates constructive candidate feedback report without internal rubric leakage', () => {
      const rawSubmission = {
        id: 'sub_999',
        user_name: 'Dev Candidate',
        scores: {
          breakdown: {
            algorithms: 85,
            systemDesign: 75,
            communication: 90,
          },
          executiveSummary: {
            keyStrengths: 'Clear explanation of distributed cache invalidation.',
            growthAreas: 'Explore boundary cases in concurrency locks.',
          },
        },
      };

      const candidateReport = generateCandidateSafeFeedback(rawSubmission, {
        title: 'Full Stack Engineer Evaluation',
      });

      expect(candidateReport).toHaveProperty('reportId');
      expect(candidateReport.candidateName).toBe('Dev Candidate');
      expect(candidateReport.evaluationSummary.strengths.length).toBeGreaterThan(0);
      expect(candidateReport.evaluationSummary.growthTips.length).toBeGreaterThan(0);
      expect(candidateReport.evaluationSummary.topicBreakdown.length).toBe(3);
      expect(candidateReport.recommendedResources.length).toBeGreaterThanOrEqual(2);

      // Verify no sensitive keys leaked into report structure
      const reportStr = JSON.stringify(candidateReport);
      expect(reportStr).not.toContain('"decision"');
      expect(reportStr).not.toContain('"passingScore"');
      expect(reportStr).not.toContain('"cheatConfidence"');
      expect(reportStr).not.toContain('"tabSwitchCount"');
    });

    it('serves candidate-safe feedback report via public endpoint GET /api/interview/feedback-portal/:token', async () => {
      const response = await fetch(`${baseUrl}/api/interview/feedback-portal/cfb_test_token_123`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.reportId).toMatch(/^cfr_/);
      expect(data.report.candidateName).toBe('Jordan Lee');
      expect(data.report.evaluationSummary.strengths.length).toBeGreaterThan(0);
      expect(data.report.evaluationSummary.growthTips.length).toBeGreaterThan(0);
      expect(data.report.recommendedResources.length).toBeGreaterThanOrEqual(1);

      // Strict security verification on HTTP response payload
      const payloadString = JSON.stringify(data);
      expect(payloadString).not.toContain('"decision"');
      expect(payloadString).not.toContain('"passingScore"');
      expect(payloadString).not.toContain('"tabSwitchCount"');
      expect(payloadString).not.toContain('REDACTED_INTERNAL_DO_NOT_SHOW');
    });

    it('returns 400 when requesting feedback portal without a token', async () => {
      const response = await fetch(`${baseUrl}/api/interview/feedback-portal?token=`);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/token is required/i);
    });
  });
});
