import assert from 'node:assert/strict';
import { InterviewScoringService } from '../services/interviewScoringService.js';
import { InterviewPromptService } from '../services/interviewPromptService.js';
import aiService from '../services/aiService.js';

const { InterviewSimulatorService } = aiService;

// ══════════════════════════════════════════════════════════════════════
// Component 1: Problem Bank Expansion
// ══════════════════════════════════════════════════════════════════════

async function testProblemBank() {
  // ── All interview types return valid problems ────────────────────────
  for (const type of ['dsa', 'system_design', 'behavioral', 'hr']) {
    for (const diff of ['easy', 'medium', 'hard']) {
      const problem = await InterviewSimulatorService._generateProblemStatement(type, diff);
      assert.ok(problem.statement, `${type}/${diff} should have a statement`);
      assert.ok(problem.statement.length > 10, `${type}/${diff} statement should be non-trivial`);
      assert.ok(problem.requirements, `${type}/${diff} should have requirements`);
    }
  }

  // ── system-design alias works ───────────────────────────────────────
  const sdProblem = await InterviewSimulatorService._generateProblemStatement('system-design', 'medium');
  assert.ok(sdProblem.statement.length > 10, 'system-design alias should resolve to valid problem');

  // ── Unknown type falls back to DSA ──────────────────────────────────
  const fallback = await InterviewSimulatorService._generateProblemStatement('unknown_type', 'medium');
  assert.ok(fallback.statement.length > 10, 'Unknown type should fall back to DSA problem');

  // ── Unknown difficulty falls back to medium ─────────────────────────
  const fallbackDiff = await InterviewSimulatorService._generateProblemStatement('dsa', 'legendary');
  assert.ok(fallbackDiff.statement.length > 10, 'Unknown difficulty should fall back to medium');

  // ── Null inputs don't crash ─────────────────────────────────────────
  const nullProblem = await InterviewSimulatorService._generateProblemStatement(null, null);
  assert.ok(nullProblem.statement, 'Null type/difficulty should still return a problem');

  console.log('✅ Problem bank expansion tests passed');
}

// ══════════════════════════════════════════════════════════════════════
// Component 3: Experience-aware Scoring Calibration
// ══════════════════════════════════════════════════════════════════════

function testFresherRubric() {
  // ── Fresher DSA rubric shifts weight from technical → communication ──
  const fresherDsa = InterviewScoringService.buildTypeRubric('dsa', 'fresher');
  const expDsa = InterviewScoringService.buildTypeRubric('dsa', 'experienced');
  assert.ok(fresherDsa.communication > expDsa.communication,
    `Fresher DSA should weight communication higher: ${fresherDsa.communication} > ${expDsa.communication}`);
  assert.ok(fresherDsa.technical < expDsa.technical,
    `Fresher DSA should weight technical lower: ${fresherDsa.technical} < ${expDsa.technical}`);

  // ── Fresher rubric weights still sum to 1.0 ─────────────────────────
  const fresherSum = fresherDsa.communication + fresherDsa.decomposition + fresherDsa.technical;
  assert.ok(Math.abs(fresherSum - 1) < 0.01, `Fresher DSA weights should sum to ~1.0, got ${fresherSum}`);

  // ── Fresher system_design also gets adjustment ──────────────────────
  const fresherSD = InterviewScoringService.buildTypeRubric('system_design', 'fresher');
  const expSD = InterviewScoringService.buildTypeRubric('system_design');
  assert.ok(fresherSD.communication > expSD.communication,
    `Fresher SD should weight communication higher: ${fresherSD.communication} > ${expSD.communication}`);

  // ── Behavioral and HR should NOT get fresher adjustment (already high comm weight)
  const fresherBehav = InterviewScoringService.buildTypeRubric('behavioral', 'fresher');
  const expBehav = InterviewScoringService.buildTypeRubric('behavioral');
  assert.deepStrictEqual(fresherBehav, expBehav,
    'Behavioral should not change for freshers (already communication-heavy)');

  // ── null experienceLevel should return base rubric ───────────────────
  const nullExp = InterviewScoringService.buildTypeRubric('dsa', null);
  assert.ok(Math.abs(nullExp.communication - 0.34) < 0.01, 'Null experience should return base DSA rubric');

  console.log('✅ Fresher rubric calibration tests passed');
}

function testFresherAdaptiveDifficulty() {
  const stableTrend = { mean: 85, stdDev: 4, trend: 'stable', volatility: 'stable', delta: 0 };

  // ── Experienced escalates at turn 3 ─────────────────────────────────
  const expResult = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 3, stableTrend, 'experienced');
  assert.equal(expResult.newDifficulty, 'hard', `Experienced should escalate at turn 3, got ${expResult.newDifficulty}`);

  // ── Fresher does NOT escalate at turn 3 (needs turn 4) ──────────────
  const fresherResult = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 3, stableTrend, 'fresher');
  assert.equal(fresherResult.newDifficulty, 'medium', `Fresher should NOT escalate at turn 3, got ${fresherResult.newDifficulty}`);

  // ── Fresher DOES escalate at turn 4 ─────────────────────────────────
  const fresherTurn4 = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 4, stableTrend, 'fresher');
  assert.equal(fresherTurn4.newDifficulty, 'hard', `Fresher should escalate at turn 4, got ${fresherTurn4.newDifficulty}`);

  // ── Improving fresher fast-tracks to turn 3 (not 2) ─────────────────
  const improvingTrend = { mean: 82, stdDev: 5, trend: 'improving', volatility: 'stable', delta: 14 };
  const fresherImproving = InterviewScoringService.deriveAdaptiveDifficulty('medium', 8.5, 3, improvingTrend, 'fresher');
  assert.equal(fresherImproving.newDifficulty, 'hard', `Improving fresher should escalate at turn 3, got ${fresherImproving.newDifficulty}`);

  console.log('✅ Fresher adaptive difficulty tests passed');
}

// ══════════════════════════════════════════════════════════════════════
// Component 4: Follow-Up Intelligence — Action-specific Modifiers
// ══════════════════════════════════════════════════════════════════════

function testActionSpecificPromptModifiers() {
  // ── volatility_scaffold produces ACTION directive ────────────────────
  const volatilePrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Design an LRU cache',
    transcript: [],
    candidateResponse: 'Use a hash map.',
    interviewType: 'dsa',
    interviewContext: {
      adaptiveFollowUp: { nextAction: 'volatility_scaffold' },
    },
  });
  assert.ok(volatilePrompt.includes('ACTION:'), 'volatility_scaffold should produce ACTION directive');
  assert.ok(volatilePrompt.includes('sub-problems'), 'volatility_scaffold should mention sub-problems');

  // ── star_completion produces STAR-specific action ────────────────────
  const starPrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Tell me about a leadership challenge',
    transcript: [],
    candidateResponse: 'In that situation, I led the team.',
    interviewType: 'behavioral',
    interviewContext: {
      adaptiveFollowUp: {
        nextAction: 'star_completion',
        starAnalysis: { hasSituation: true, hasAction: true, hasResult: false },
      },
    },
  });
  assert.ok(starPrompt.includes('result/impact'), 'star_completion should ask for missing result');

  // ── confidence_rebuild produces acknowledgment directive ─────────────
  const confPrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Find two sum',
    transcript: [],
    candidateResponse: 'I think maybe a hash map.',
    interviewType: 'dsa',
    interviewContext: {
      adaptiveFollowUp: { nextAction: 'confidence_rebuild' },
    },
  });
  assert.ok(confPrompt.includes('simpler variant'), 'confidence_rebuild should suggest simpler variant');
  assert.ok(confPrompt.includes('Acknowledge'), 'confidence_rebuild should acknowledge progress');

  // ── targeted_correction produces correction directive ────────────────
  const corrPrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Design a system',
    transcript: [],
    candidateResponse: 'I would use a single server.',
    interviewType: 'system_design',
    interviewContext: {
      adaptiveFollowUp: { nextAction: 'targeted_correction' },
    },
  });
  assert.ok(corrPrompt.includes('misconception'), 'targeted_correction should mention misconception');

  // ── depth_probe produces why directive ───────────────────────────────
  const depthPrompt = InterviewPromptService.buildFollowUpPrompt({
    problemStatement: 'Binary search',
    transcript: [],
    candidateResponse: 'I chose binary search for efficiency.',
    interviewType: 'dsa',
    interviewContext: {
      adaptiveFollowUp: { nextAction: 'depth_probe' },
    },
  });
  assert.ok(depthPrompt.includes('why'), 'depth_probe should ask why');

  console.log('✅ Action-specific prompt modifier tests passed');
}

// ══════════════════════════════════════════════════════════════════════
// Component 5: Trend Narrative Generation
// ══════════════════════════════════════════════════════════════════════

function testTrendNarrative() {
  // ── Improving + low volatility ──────────────────────────────────────
  const improving = InterviewSimulatorService._generateTrendNarrative(
    { trend: 'improving', volatility: 'stable', mean: 75 }, 75, []
  );
  assert.ok(improving.includes('improved steadily'), `Improving should mention steady improvement, got: ${improving.slice(0, 50)}`);

  // ── Declining ───────────────────────────────────────────────────────
  const declining = InterviewSimulatorService._generateTrendNarrative(
    { trend: 'declining', volatility: 'stable', mean: 55 }, 55, []
  );
  assert.ok(declining.includes('weakened'), `Declining should mention weakening, got: ${declining.slice(0, 50)}`);

  // ── High volatility (overrides improving trend) ─────────────────────
  const volatile = InterviewSimulatorService._generateTrendNarrative(
    { trend: 'improving', volatility: 'high', mean: 65 }, 65, []
  );
  assert.ok(volatile.includes('inconsistent'), `Volatile should mention inconsistency, got: ${volatile.slice(0, 50)}`);

  // ── Stable + high score ─────────────────────────────────────────────
  const stableHigh = InterviewSimulatorService._generateTrendNarrative(
    { trend: 'stable', volatility: 'stable', mean: 80 }, 80, []
  );
  assert.ok(stableHigh.includes('harder challenges'), `Stable+high should suggest harder challenges, got: ${stableHigh.slice(0, 50)}`);

  // ── Stable + low score ──────────────────────────────────────────────
  const stableLow = InterviewSimulatorService._generateTrendNarrative(
    { trend: 'stable', volatility: 'stable', mean: 55 }, 55, ['State time complexity explicitly']
  );
  assert.ok(stableLow.includes('below target'), `Stable+low should mention below target, got: ${stableLow.slice(0, 50)}`);
  assert.ok(stableLow.includes('state time complexity'), `Stable+low should reference top improvement area`);

  // ── Null/empty trend → fallback ─────────────────────────────────────
  const fallback = InterviewSimulatorService._generateTrendNarrative(null, 60, []);
  assert.ok(fallback.includes('Keep practicing'), `Null trend should produce fallback, got: ${fallback.slice(0, 50)}`);

  console.log('✅ Trend narrative tests passed');
}

// ══════════════════════════════════════════════════════════════════════
// Component 2: Dynamic Follow-Up & Recommendations
// ══════════════════════════════════════════════════════════════════════

function testDynamicFollowUps() {
  // ── DSA with complexity gap → optimization follow-up ─────────────────
  const dsaFollowUps = InterviewSimulatorService._generateDynamicFollowUps(
    'dsa', ['State time and space complexity explicitly'], []
  );
  assert.ok(dsaFollowUps.length >= 1, 'Should generate at least 1 follow-up');
  assert.ok(dsaFollowUps[0].title.toLowerCase().includes('complexity') || dsaFollowUps[0].title.toLowerCase().includes('o(n'),
    `DSA complexity gap should produce relevant follow-up, got: ${dsaFollowUps[0].title}`);

  // ── Behavioral with strong STAR → harder scenario ────────────────────
  const behavFollowUps = InterviewSimulatorService._generateDynamicFollowUps(
    'behavioral', [], ['Completed STAR stories with measurable outcomes']
  );
  assert.ok(behavFollowUps.some(f => f.title.toLowerCase().includes('conflict') || f.title.toLowerCase().includes('cross-functional')),
    `Strong STAR candidate should get harder scenario, got: ${behavFollowUps.map(f => f.title).join(', ')}`);

  // ── No gaps → returns default follow-up ──────────────────────────────
  const noGapsFollowUps = InterviewSimulatorService._generateDynamicFollowUps('dsa', [], []);
  assert.ok(noGapsFollowUps.length >= 1, 'No gaps should still return at least 1 default follow-up');

  // ── Max 3 follow-ups ────────────────────────────────────────────────
  const manyGaps = InterviewSimulatorService._generateDynamicFollowUps(
    'dsa', ['complexity', 'edge cases', 'trade-offs', 'optimization'], []
  );
  assert.ok(manyGaps.length <= 3, `Should cap at 3 follow-ups, got ${manyGaps.length}`);

  console.log('✅ Dynamic follow-up tests passed');
}

function testDynamicRecommendations() {
  // ── With gaps → actionable advice ───────────────────────────────────
  const dsaRec = InterviewSimulatorService._generateDynamicRecommendations(
    'dsa', ['State time complexity explicitly', 'Cover edge cases'], []
  );
  assert.ok(dsaRec.includes('Next session'), `DSA with gaps should produce actionable advice, got: ${dsaRec.slice(0, 60)}`);
  assert.ok(dsaRec.includes('complexity'), 'Recommendation should reference the actual gap');

  // ── Behavioral with gaps ────────────────────────────────────────────
  const behavRec = InterviewSimulatorService._generateDynamicRecommendations(
    'behavioral', ['Quantify outcomes'], []
  );
  assert.ok(behavRec.includes('STAR stories'), `Behavioral with gaps should mention STAR, got: ${behavRec.slice(0, 60)}`);

  // ── No gaps → next-level advice ─────────────────────────────────────
  const noGapsRec = InterviewSimulatorService._generateDynamicRecommendations('dsa', [], []);
  assert.ok(noGapsRec.includes('Push further') || noGapsRec.includes('hard-level'),
    `No gaps should suggest next level, got: ${noGapsRec.slice(0, 60)}`);

  // ── Unknown type falls back gracefully ──────────────────────────────
  const unknownRec = InterviewSimulatorService._generateDynamicRecommendations('unknown', ['improve'], []);
  assert.ok(unknownRec.length > 10, 'Unknown type should still produce a recommendation');

  console.log('✅ Dynamic recommendations tests passed');
}

// ══════════════════════════════════════════════════════════════════════
// Run all tests
// ══════════════════════════════════════════════════════════════════════

testProblemBank();
testFresherRubric();
testFresherAdaptiveDifficulty();
testActionSpecificPromptModifiers();
testTrendNarrative();
testDynamicFollowUps();
testDynamicRecommendations();

console.log('\n🎉 All AI interview improvement tests passed!');
