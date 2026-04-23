import assert from 'node:assert/strict';
import { InterviewScoringService } from '../services/interviewScoringService.js';
import { InterviewFollowUpRulesService } from '../services/interviewFollowUpRules.js';
import { InterviewPromptService } from '../services/interviewPromptService.js';
import aiService from '../services/aiService.js';

const { analyzeAnswerQualityHeuristic } = aiService;

function runScoringTests() {
  // ── HR rubric should exist ──────────────────────────────────────────
  const hrRubric = InterviewScoringService.buildTypeRubric('hr');
  assert.ok(hrRubric.communication >= 0.45, 'HR should heavily weight communication');
  assert.ok(hrRubric.technical <= 0.25, 'HR should lightly weight technical');
  const sum = hrRubric.communication + hrRubric.decomposition + hrRubric.technical;
  assert.ok(Math.abs(sum - 1) < 0.01, `HR rubric weights should sum to ~1.0, got ${sum}`);

  // ── DSA rubric unchanged ────────────────────────────────────────────
  const dsaRubric = InterviewScoringService.buildTypeRubric('dsa');
  assert.ok(dsaRubric.communication > 0.2, 'DSA should weight communication');
  assert.ok(dsaRubric.technical > 0.2, 'DSA should weight technical');

  // ── Scoring with fresher bonus ──────────────────────────────────────
  const fresherScores = InterviewScoringService.calculateRollingScores(
    { metrics: { communication: 55, problemDecomposition: 50, efficiency: 45 } },
    [{ role: 'candidate' }],
    'dsa',
    'fresher',
  );
  const experiencedScores = InterviewScoringService.calculateRollingScores(
    { metrics: { communication: 55, problemDecomposition: 50, efficiency: 45 } },
    [{ role: 'candidate' }],
    'dsa',
    'experienced',
  );
  assert.ok(
    fresherScores.overall >= experiencedScores.overall,
    `Fresher should get equal or better score: fresher=${fresherScores.overall}, experienced=${experiencedScores.overall}`,
  );

  console.log('✅ Scoring tests passed');
}

function runFollowUpTests() {
  // ── STAR detection for behavioral ───────────────────────────────────
  const starComplete = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 75 },
    interviewContext: { interviewType: 'behavioral' },
    candidateResponse: 'In that situation, my task was to lead the migration. I took the action of creating a runbook, and the result was a 99.9% uptime.',
  });
  assert.ok(
    starComplete.nextAction !== 'star_completion',
    'Complete STAR should not trigger star_completion',
  );

  const starIncomplete = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 70 },
    interviewContext: { interviewType: 'behavioral' },
    candidateResponse: 'In that situation, I worked on the migration project. I think it went well.',
  });
  assert.equal(
    starIncomplete.nextAction, 'star_completion',
    'Incomplete STAR (missing action/result) should trigger star_completion',
  );

  // ── Code-aware branching ────────────────────────────────────────────
  const codeNoErrorHandling = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72 },
    interviewContext: {},
    candidateResponse: 'Here is my solution:\n--- Code ---\ndef solve(arr):\n  return sorted(arr)',
    candidateCode: 'def solve(arr):\n  return sorted(arr)',
  });
  assert.ok(
    codeNoErrorHandling.missedConcepts.includes('missing_error_handling') ||
    codeNoErrorHandling.codeSignals?.hasErrorHandling === false,
    'Code without error handling should be flagged',
  );

  // ── Improvement arc tracking ────────────────────────────────────────
  const improving = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 85 },
    interviewContext: { previousScore: 60 },
    candidateResponse: 'The time complexity is O(n log n) because of the sorting step.',
  });
  assert.ok(
    improving.improvementArc === 'improving' || improving.branchReason !== 'missed_core_concepts',
    'Improving candidate should be acknowledged',
  );

  const declining = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 40 },
    interviewContext: { previousScore: 80 },
    candidateResponse: 'I am not sure about this one.',
  });
  assert.ok(
    declining.improvementArc === 'declining' || declining.confidence === 'low',
    'Declining candidate should be flagged',
  );

  console.log('✅ Follow-up rules tests passed');
}

function runHeuristicTests() {
  // ── Baseline: no type → standard scoring ────────────────────────────
  const baseline = analyzeAnswerQualityHeuristic(
    'I built a solution using a hash map to solve the two sum problem. The result was O(n) time.',
    'How would you solve two sum?',
  );
  assert.ok(baseline.clarityScore > 0, 'Baseline should produce positive clarity');
  assert.equal(baseline.source, 'heuristic', 'Source should be heuristic');

  // ── DSA boost for complexity/algorithm keywords ─────────────────────
  const dsaAnswer = 'I used binary search which gives O(log n) time complexity. The space complexity is O(1). I considered using dynamic programming as a trade-off but binary search is optimal here.';
  const dsaResult = analyzeAnswerQualityHeuristic(dsaAnswer, 'How do you find an element?', 'dsa');
  const genericResult = analyzeAnswerQualityHeuristic(dsaAnswer, 'How do you find an element?');
  assert.ok(
    dsaResult.specificityScore >= genericResult.specificityScore,
    `DSA type should boost specificity: dsa=${dsaResult.specificityScore} >= generic=${genericResult.specificityScore}`,
  );

  // ── Behavioral boost for STAR components ────────────────────────────
  const behavioralAnswer = 'In that situation, the context was a failing deployment. My task was to coordinate the rollback. I decided to implement a canary deployment strategy, and the result was zero downtime.';
  const behavResult = analyzeAnswerQualityHeuristic(behavioralAnswer, 'Tell me about a time...', 'behavioral');
  const behavGeneric = analyzeAnswerQualityHeuristic(behavioralAnswer, 'Tell me about a time...');
  assert.ok(
    behavResult.specificityScore >= behavGeneric.specificityScore,
    `Behavioral type should boost specificity: behav=${behavResult.specificityScore} >= generic=${behavGeneric.specificityScore}`,
  );

  // ── HR reduced filler penalty ───────────────────────────────────────
  const fillerHeavy = 'So, um, basically I am like really passionate about this role, you know, and I enjoy working with teams and um collaboration is like super important to me.';
  const hrResult = analyzeAnswerQualityHeuristic(fillerHeavy, 'Why this role?', 'hr');
  const dsaFiller = analyzeAnswerQualityHeuristic(fillerHeavy, 'Why this role?', 'dsa');
  assert.ok(
    hrResult.clarityScore > dsaFiller.clarityScore,
    `HR should have lower filler penalty: hr=${hrResult.clarityScore} > dsa=${dsaFiller.clarityScore}`,
  );

  // ── HR motivation boost ─────────────────────────────────────────────
  const hrMotivation = 'I am passionate about growth and learning. I enjoy team collaboration and mentoring junior developers.';
  const hrMotResult = analyzeAnswerQualityHeuristic(hrMotivation, 'Why do you want this role?', 'hr');
  const hrMotGeneric = analyzeAnswerQualityHeuristic(hrMotivation, 'Why do you want this role?');
  assert.ok(
    hrMotResult.specificityScore >= hrMotGeneric.specificityScore,
    `HR motivation keywords should boost specificity: hr=${hrMotResult.specificityScore} >= generic=${hrMotGeneric.specificityScore}`,
  );

  // ── Empty answer returns zero scores regardless of type ─────────────
  const emptyDsa = analyzeAnswerQualityHeuristic('', 'Solve this', 'dsa');
  assert.equal(emptyDsa.clarityScore, 0, 'Empty DSA answer should have 0 clarity');
  assert.equal(emptyDsa.needsFollowUp, true, 'Empty answer should need follow-up');

  console.log('✅ Type-aware heuristic tests passed');
}

function runScoreHistoryTests() {
  // ── buildScoreHistory extracts from transcript ──────────────────────
  const transcript = [
    { role: 'candidate', analysis: { score: 40 } },
    { role: 'interviewer' },
    { role: 'candidate', analysis: { score: 80 } },
    { role: 'candidate', analysis: { score: 30 } },
    { role: 'candidate', analysis: { score: 90 } },
    { role: 'candidate', analysis: { score: 35 } },
  ];
  const history = InterviewScoringService.buildScoreHistory(transcript, {}, 5);
  assert.equal(history.length, 5, 'Should extract 5 candidate scores');
  assert.equal(history[0].score, 40, 'First score should be 40');
  assert.equal(history[4].score, 35, 'Last score should be 35');

  // ── buildScoreHistory with window limiting ──────────────────────────
  const limitedHistory = InterviewScoringService.buildScoreHistory(transcript, {}, 3);
  assert.equal(limitedHistory.length, 3, 'Window=3 should return last 3 scores');
  assert.equal(limitedHistory[0].score, 30, 'Windowed first should be 30');

  // ── calculateTrendFromHistory — volatile ────────────────────────────
  const volatileHistory = [
    { score: 85 }, { score: 30 }, { score: 90 }, { score: 25 }, { score: 80 },
  ];
  const volatileTrend = InterviewScoringService.calculateTrendFromHistory(volatileHistory);
  assert.equal(volatileTrend.volatility, 'volatile', `Erratic scores should be volatile, got ${volatileTrend.volatility} (stdDev=${volatileTrend.stdDev})`);

  // ── calculateTrendFromHistory — improving ───────────────────────────
  const improvingHistory = [
    { score: 30 }, { score: 40 }, { score: 55 }, { score: 65 }, { score: 80 },
  ];
  const improvingTrend = InterviewScoringService.calculateTrendFromHistory(improvingHistory);
  assert.equal(improvingTrend.trend, 'improving', `Steadily rising scores should be improving, got ${improvingTrend.trend}`);

  // ── calculateTrendFromHistory — declining ───────────────────────────
  const decliningHistory = [
    { score: 85 }, { score: 75 }, { score: 60 }, { score: 50 }, { score: 35 },
  ];
  const decliningTrend = InterviewScoringService.calculateTrendFromHistory(decliningHistory);
  assert.equal(decliningTrend.trend, 'declining', `Falling scores should be declining, got ${decliningTrend.trend}`);

  // ── calculateTrendFromHistory — stable ──────────────────────────────
  const stableHistory = [
    { score: 70 }, { score: 72 }, { score: 68 }, { score: 71 }, { score: 69 },
  ];
  const stableTrend = InterviewScoringService.calculateTrendFromHistory(stableHistory);
  assert.equal(stableTrend.trend, 'stable', `Consistent scores should be stable, got ${stableTrend.trend}`);
  assert.equal(stableTrend.volatility, 'stable', `Low deviation should be stable, got ${stableTrend.volatility}`);

  // ── Single score returns stable defaults ────────────────────────────
  const singleTrend = InterviewScoringService.calculateTrendFromHistory([{ score: 50 }]);
  assert.equal(singleTrend.trend, 'stable', 'Single score should default to stable');
  assert.equal(singleTrend.stdDev, 0, 'Single score should have 0 stdDev');

  console.log('✅ Score history and trend tests passed');
}

function runVolatilityBranchTests() {
  // ── Volatile pattern triggers volatility_scaffold ───────────────────
  const volatileScoreHistory = [
    { score: 85 }, { score: 30 }, { score: 90 }, { score: 25 }, { score: 80 },
  ];
  const volatileTrend = InterviewScoringService.calculateTrendFromHistory(volatileScoreHistory);

  const volatileResult = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 80 },
    interviewContext: { interviewType: 'dsa' },
    candidateResponse: 'The time complexity is O(n) because we iterate once.',
    scoreHistory: volatileScoreHistory,
    scoreTrend: volatileTrend,
  });
  assert.equal(volatileResult.nextAction, 'volatility_scaffold', `Volatile pattern should trigger volatility_scaffold, got ${volatileResult.nextAction}`);
  assert.equal(volatileResult.branchReason, 'volatile_score_pattern', 'Branch reason should be volatile_score_pattern');
  assert.equal(volatileResult.scoreTrend.volatility, 'volatile', 'scoreTrend should be returned in result');

  // ── Improving trend uses trend-based arc ────────────────────────────
  const improvingHistory = [
    { score: 30 }, { score: 40 }, { score: 55 }, { score: 65 }, { score: 80 },
  ];
  const improvingTrend = InterviewScoringService.calculateTrendFromHistory(improvingHistory);

  const improvingResult = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 80 },
    interviewContext: { interviewType: 'dsa', previousScore: 65 },
    candidateResponse: 'The time complexity is O(n log n) because of the sorting.',
    scoreHistory: improvingHistory,
    scoreTrend: improvingTrend,
  });
  assert.equal(improvingResult.improvementArc, 'improving', `Trend-based improving arc, got ${improvingResult.improvementArc}`);

  // ── Backward compat: no scoreHistory still works ────────────────────
  const backCompat = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 85 },
    interviewContext: { previousScore: 60 },
    candidateResponse: 'I used dynamic programming because of the overlapping subproblems.',
  });
  assert.equal(backCompat.improvementArc, 'improving', `Backward compat: single previousScore should still work, got ${backCompat.improvementArc}`);

  // ── Stable scores should NOT trigger volatility ─────────────────────
  const stableHistory = [
    { score: 70 }, { score: 72 }, { score: 68 }, { score: 71 }, { score: 69 },
  ];
  const stableTrend = InterviewScoringService.calculateTrendFromHistory(stableHistory);

  const stableResult = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 70 },
    interviewContext: { interviewType: 'dsa' },
    candidateResponse: 'The time complexity is O(n) because of the hash map lookup.',
    scoreHistory: stableHistory,
    scoreTrend: stableTrend,
  });
  assert.notEqual(stableResult.nextAction, 'volatility_scaffold', 'Stable scores should NOT trigger volatility_scaffold');

  console.log('✅ Volatility branch tests passed');
}

function runAdaptiveDifficultyTests() {
  // ── Volatile candidate should NOT be escalated ──────────────────────
  const volatileTrend = { mean: 70, stdDev: 22, trend: 'stable', volatility: 'volatile', delta: 0 };
  const noEscalate = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 4, volatileTrend);
  assert.equal(noEscalate.newDifficulty, 'medium', `Volatile candidate should stay at medium, got ${noEscalate.newDifficulty}`);

  // ── Same candidate without volatility SHOULD escalate ───────────────
  const stableTrend = { mean: 85, stdDev: 4, trend: 'stable', volatility: 'stable', delta: 0 };
  const escalates = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 4, stableTrend);
  assert.equal(escalates.newDifficulty, 'hard', `Stable high-performer should escalate to hard, got ${escalates.newDifficulty}`);

  // ── Declining trend should de-escalate sooner ───────────────────────
  const decliningTrend = { mean: 55, stdDev: 8, trend: 'declining', volatility: 'stable', delta: -12 };
  const earlyDrop = InterviewScoringService.deriveAdaptiveDifficulty('hard', 5.8, 1, decliningTrend);
  assert.equal(earlyDrop.newDifficulty, 'medium', `Declining trend should de-escalate at turn 1, got ${earlyDrop.newDifficulty}`);

  // ── Without declining trend, turn 1 should NOT de-escalate ──────────
  const noTrend = InterviewScoringService.deriveAdaptiveDifficulty('hard', 5.4, 1, null);
  assert.equal(noTrend.newDifficulty, 'hard', `Without declining trend, turn 1 should stay at hard, got ${noTrend.newDifficulty}`);

  // ── Volatile candidate at hard should de-escalate ───────────────────
  const volatileHard = InterviewScoringService.deriveAdaptiveDifficulty('hard', 7.0, 3, volatileTrend);
  assert.equal(volatileHard.newDifficulty, 'medium', `Volatile at hard should drop to medium, got ${volatileHard.newDifficulty}`);

  // ── Declining trend should block escalation even with high score ──────
  const decliningHighScore = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.8, 4, decliningTrend);
  assert.equal(decliningHighScore.newDifficulty, 'medium', `Declining trend should block escalation, got ${decliningHighScore.newDifficulty}`);

  // ── Improving trend fast-tracks escalation at turn 2 ────────────────
  const improvingTrend = { mean: 82, stdDev: 5, trend: 'improving', volatility: 'stable', delta: 14 };
  const fastTrack = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 2, improvingTrend);
  assert.equal(fastTrack.newDifficulty, 'hard', `Improving trend should fast-track at turn 2, got ${fastTrack.newDifficulty}`);

  // ── Same score at turn 2 WITHOUT improving trend should NOT escalate ──
  const noFastTrack = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 2, stableTrend);
  assert.equal(noFastTrack.newDifficulty, 'medium', `Stable trend at turn 2 should not escalate, got ${noFastTrack.newDifficulty}`);

  console.log('✅ Adaptive difficulty trend tests passed');
}

function runBranchTypeTests() {
  // ── HR candidate saying "I think" should NOT get confidence_rebuild ──
  const hrBranch = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'hr', previousScore: 70 },
    candidateResponse: 'I think this role is a good fit because I enjoy team collaboration and maybe I can contribute to mentoring.',
  });
  assert.notEqual(hrBranch.nextAction, 'confidence_rebuild', `HR should not trigger confidence_rebuild, got ${hrBranch.nextAction}`);

  // ── Same response for DSA SHOULD get confidence_rebuild ──────────────
  const dsaBranch = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'dsa', previousScore: 70 },
    candidateResponse: 'I think maybe we could use a hash map, not sure if that is optimal, probably O(n) time.',
  });
  assert.equal(dsaBranch.nextAction, 'confidence_rebuild', `DSA hedging should trigger confidence_rebuild, got ${dsaBranch.nextAction}`);
  // ── Behavioral candidate with impact words should NOT be flagged shallow ──
  const behavDepth = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'behavioral', previousScore: 70 },
    candidateResponse: 'The outcome was a 30% improvement in deployment speed and it impacted the entire team.',
  });
  assert.equal(behavDepth.depth, 'deep', `Behavioral with impact should be 'deep', got ${behavDepth.depth}`);

  // ── DSA candidate without DSA depth terms SHOULD be flagged shallow ──
  const dsaShallow = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'dsa', previousScore: 70 },
    candidateResponse: 'I would use a hash map to store values.',
  });
  assert.equal(dsaShallow.depth, 'shallow', `DSA without depth terms should be 'shallow', got ${dsaShallow.depth}`);

  // ── HR candidate should NOT get missing_error_handling in missedConcepts ──
  const hrCode = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'hr', previousScore: 70 },
    candidateResponse: 'I enjoy working with teams.',
    candidateCode: 'console.log("hello")',
  });
  const hasCodeGap = hrCode.missedConcepts.some(c => c === 'missing_error_handling' || c === 'missing_edge_cases');
  assert.ok(!hasCodeGap, `HR should not inject code gaps, got: ${hrCode.missedConcepts.join(', ')}`);

  // ── DSA candidate SHOULD get missing_error_handling ───────────────
  const dsaCode = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'dsa', previousScore: 70 },
    candidateResponse: 'I would use a hash map.',
    candidateCode: 'const map = new Map(); for (let i = 0; i < arr.length; i++) { map.set(arr[i], i); }',
  });
  const hasDsaCodeGap = dsaCode.missedConcepts.some(c => c === 'missing_error_handling');
  assert.ok(hasDsaCodeGap, `DSA without error handling should inject gap, got: ${dsaCode.missedConcepts.join(', ')}`);

  // ── Low-score behavioral candidate with incomplete STAR should still get star_completion ──
  const lowScoreStar = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 40, nextFocus: [] },
    interviewContext: { interviewType: 'behavioral', previousScore: 45 },
    candidateResponse: 'In that situation, I had to handle things differently.',
  });
  assert.equal(lowScoreStar.nextAction, 'star_completion', `Low-score behavioral should still get star_completion, got ${lowScoreStar.nextAction}`);

  // ── Behavioral confidence should NOT be 'low' even with hedging words ──
  const behavConf = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'behavioral', previousScore: 70 },
    candidateResponse: 'I think maybe the outcome was that we improved by 30%.',
  });
  assert.notEqual(behavConf.confidence, 'low', `Behavioral confidence should not be 'low' despite hedging, got ${behavConf.confidence}`);

  // ── DSA confidence SHOULD be 'low' with hedging words ─────────────
  const dsaConf = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 72, nextFocus: [] },
    interviewContext: { interviewType: 'dsa', previousScore: 70 },
    candidateResponse: 'I think maybe we could use binary search, not sure if optimal.',
  });
  assert.equal(dsaConf.confidence, 'low', `DSA confidence should be 'low' with hedging, got ${dsaConf.confidence}`);

  // ── HR confidence override works ──────────────────────────────────
  const hrConf = InterviewFollowUpRulesService.decideBranch({
    analysis: { score: 65, nextFocus: [] },
    interviewContext: { interviewType: 'hr', previousScore: 60 },
    candidateResponse: 'I think maybe this role is a good fit for my goals.',
  });
  assert.notEqual(hrConf.confidence, 'low', `HR confidence should not be 'low' despite hedging, got ${hrConf.confidence}`);

  console.log('✅ Branch type-awareness tests passed');
}


function runVoiceCompressionTests() {
  const { InterviewSimulatorService } = aiService;

  // ── Short messages pass through unchanged ───────────────────────────
  const short = InterviewSimulatorService._compressForRealtimeVoice('Good start. Tell me more.', 'full_realtime');
  assert.equal(short, 'Good start. Tell me more.', 'Short messages should pass through unchanged');

  // ── Non-realtime mode passes through unchanged ──────────────────────
  const longNonRealtime = InterviewSimulatorService._compressForRealtimeVoice(
    'This is a very long message that would normally be truncated but since we are not in realtime mode it should pass through completely without any modification at all even though it exceeds the word limit significantly',
    'text_chat'
  );
  assert.ok(longNonRealtime.length > 100, 'Non-realtime should not truncate');

  // ── Long realtime messages get truncated ─────────────────────────────
  const long = InterviewSimulatorService._compressForRealtimeVoice(
    'That is a solid foundation. Now walk me through how you would handle the edge case where the input array is empty. Also consider what happens when there are duplicate values and the hash map collides repeatedly causing degraded performance in the worst case scenario.',
    'full_realtime'
  );
  assert.ok(long.split(' ').length <= 36, `Realtime should be truncated to ~35 words, got ${long.split(' ').length}`);

  // ── Empty message gets fallback ─────────────────────────────────────
  const empty = InterviewSimulatorService._compressForRealtimeVoice('', 'full_realtime');
  assert.ok(empty.length > 10, 'Empty message should produce a fallback');

  console.log('✅ Voice compression tests passed');
}

async function runTypeAwareAnalysisTests() {
  const { InterviewSimulatorService } = aiService;

  // ── Behavioral response should NOT get 'complexity analysis' in nextFocus ──
  const behavioralAnalysis = await InterviewSimulatorService._analyzeInterviewResponse(
    'In that situation, my task was to lead the team migration. I decided to create a runbook and the result was improved uptime.',
    'Tell me about a leadership challenge',
    'behavioral',
    { turns: 3 }
  );
  const hasDsaFocus = behavioralAnalysis.nextFocus.some(f => f === 'complexity analysis' || f === 'edge cases');
  assert.ok(!hasDsaFocus, `Behavioral nextFocus should NOT include DSA signals, got: ${behavioralAnalysis.nextFocus.join(', ')}`);

  // ── DSA response SHOULD get 'complexity analysis' when missing ──────
  const dsaAnalysis = await InterviewSimulatorService._analyzeInterviewResponse(
    'I would use a hash map to store the values and iterate through the array once.',
    'Find two numbers that sum to target',
    'dsa',
    { turns: 2 }
  );
  const hasDsa = dsaAnalysis.nextFocus.some(f => f === 'complexity analysis');
  assert.ok(hasDsa, `DSA nextFocus should include 'complexity analysis', got: ${dsaAnalysis.nextFocus.join(', ')}`);

  // ── HR response should get 'career motivation' when missing ─────────
  const hrAnalysis = await InterviewSimulatorService._analyzeInterviewResponse(
    'I like working with teams and learning new technologies.',
    'Tell me about yourself',
    'hr',
    { turns: 1 }
  );
  const hasMotivation = hrAnalysis.nextFocus.some(f => f === 'career motivation');
  assert.ok(hasMotivation, `HR nextFocus should include 'career motivation', got: ${hrAnalysis.nextFocus.join(', ')}`);

  // ── System design should check scalability ──────────────────────────
  const sdAnalysis = await InterviewSimulatorService._analyzeInterviewResponse(
    'I would use a monolithic architecture with a single PostgreSQL database to keep things simple.',
    'Design a URL shortener',
    'system_design',
    { turns: 2 }
  );
  const hasScale = sdAnalysis.nextFocus.some(f => f === 'scalability discussion');
  assert.ok(hasScale, `System design nextFocus should include 'scalability discussion', got: ${sdAnalysis.nextFocus.join(', ')}`);

  // ── HR short answer should NOT trigger candidateStuck ─────────────
  const hrShort = await InterviewSimulatorService._analyzeInterviewResponse(
    'I value growth and mentorship opportunities within team settings.',
    'What motivates you?',
    'hr',
    { turns: 1 }
  );
  assert.ok(!hrShort.candidateStuck, `HR short answer should NOT be stuck, got candidateStuck=${hrShort.candidateStuck}`);

  // ── DSA short answer SHOULD trigger candidateStuck ──────────────
  const dsaShort = await InterviewSimulatorService._analyzeInterviewResponse(
    'Use a hash map.',
    'Find two sum',
    'dsa',
    { turns: 1 }
  );
  assert.ok(dsaShort.candidateStuck, `DSA very short answer SHOULD be stuck, got candidateStuck=${dsaShort.candidateStuck}`);

  console.log('✅ Type-aware analysis tests passed');
}

function runPromptConsistencyTests() {
  // ── Prompt missingAreas should include all 5 items ──────────────────
  const prompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Test problem',
    transcript: [],
    candidateResponse: 'Test answer',
    interviewType: 'dsa',
    interviewContext: {
      missingAreas: ['complexity analysis', 'edge cases', 'trade-offs', 'code quality', 'optimization'],
      turns: 1,
    },
  });
  // All 5 should be present in the prompt
  assert.ok(prompt.includes('optimization'), 'Prompt should include 5th missing area');

  // With 6 items, 6th should be excluded
  const prompt6 = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Test',
    transcript: [],
    candidateResponse: 'Test',
    interviewType: 'dsa',
    interviewContext: {
      missingAreas: ['a-area', 'b-area', 'c-area', 'd-area', 'e-area', 'f-area'],
      turns: 1,
    },
  });
  assert.ok(prompt6.includes('e-area'), 'Prompt should include 5th missing area');
  assert.ok(!prompt6.includes('f-area'), 'Prompt should NOT include 6th missing area (capped at 5)');

  console.log('✅ Prompt consistency tests passed');
}

runScoringTests();
runFollowUpTests();
runHeuristicTests();
runScoreHistoryTests();
runVolatilityBranchTests();
runAdaptiveDifficultyTests();
runVoiceCompressionTests();
runTypeAwareAnalysisTests();
runBranchTypeTests();
runPromptConsistencyTests();
