import { describe, it, expect } from 'vitest';
import {
  ProactiveSuggestionService,
  SILENCE_THRESHOLDS_SEC,
  SILENCE_THRESHOLDS_MS,
  SUGGESTION_TIERS,
} from '../../services/interviewSuggestionService.js';
import {
  computeProgressiveStarGuidance,
  detectStarComponents,
  isStarComplete,
  InterviewFollowUpRulesService,
} from '../../services/interviewFollowUpRulesService.js';
import {
  getWeakestRubricDimension,
  getRubricCoachingCue,
  STAGE_GUIDANCE_RULES,
  InterviewPromptService,
} from '../../services/interviewPromptService.js';
import { InterviewConversationService } from '../../services/interviewConversationService.js';

describe('ProactiveSuggestionService & Progressive Suggestion Architecture', () => {
  describe('Silence Thresholds per Stage', () => {
    it('provides accurate stage-specific silence thresholds in seconds', () => {
      expect(ProactiveSuggestionService.getSilenceThreshold('intake')).toBe(15);
      expect(ProactiveSuggestionService.getSilenceThreshold('warmup')).toBe(12);
      expect(ProactiveSuggestionService.getSilenceThreshold('technical')).toBe(25);
      expect(ProactiveSuggestionService.getSilenceThreshold('followup')).toBe(15);
      expect(ProactiveSuggestionService.getSilenceThreshold('follow-up')).toBe(15);
      expect(ProactiveSuggestionService.getSilenceThreshold('challenge')).toBe(20);
      expect(ProactiveSuggestionService.getSilenceThreshold('feedback')).toBe(10);
    });

    it('provides accurate thresholds in milliseconds when requested', () => {
      expect(ProactiveSuggestionService.getSilenceThreshold('technical', { unit: 'ms' })).toBe(25000);
      expect(ProactiveSuggestionService.getSilenceThreshold('warmup', { unit: 'ms' })).toBe(12000);
    });

    it('correctly evaluates silence threshold exceedance', () => {
      expect(ProactiveSuggestionService.isSilenceThresholdExceeded('technical', 24)).toBe(false);
      expect(ProactiveSuggestionService.isSilenceThresholdExceeded('technical', 25)).toBe(true);
      expect(ProactiveSuggestionService.isSilenceThresholdExceeded('technical', 30)).toBe(true);
      expect(ProactiveSuggestionService.isSilenceThresholdExceeded('warmup', 10)).toBe(false);
      expect(ProactiveSuggestionService.isSilenceThresholdExceeded('warmup', 13)).toBe(true);
    });
  });

  describe('Tier 0: Proactive Thought-Starters', () => {
    it('generates technical DSA thought-starters referencing edge cases or brute-force baseline', () => {
      const thoughtStarter = ProactiveSuggestionService.generateThoughtStarter({
        interviewType: 'dsa',
        stage: 'technical',
        turnNumber: 0,
      });
      expect(typeof thoughtStarter).toBe('string');
      expect(thoughtStarter.length).toBeGreaterThan(15);
    });

    it('generates system design thought-starters focusing on requirements and scale', () => {
      const thoughtStarter = ProactiveSuggestionService.generateThoughtStarter({
        interviewType: 'system_design',
        stage: 'technical',
        turnNumber: 0,
      });
      expect(thoughtStarter).toContain('requirements');
    });

    it('generates stage-specific starters for intake and warmup', () => {
      const intakeStarter = ProactiveSuggestionService.generateThoughtStarter({
        interviewType: 'dsa',
        stage: 'intake',
      });
      expect(intakeStarter).toMatch(/expectations|assumptions|confirm/i);

      const warmupStarter = ProactiveSuggestionService.generateThoughtStarter({
        interviewType: 'dsa',
        stage: 'warmup',
        turnNumber: 0,
      });
      expect(warmupStarter).toMatch(/summary|background|experience/i);
    });
  });

  describe('Tier 2: Approach Options', () => {
    it('generates distinct approach options with trade-offs for DSA', () => {
      const options = ProactiveSuggestionService.generateApproachOptions({
        interviewType: 'dsa',
        stage: 'technical',
      });
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options[0]).toHaveProperty('name');
      expect(options[0]).toHaveProperty('description');
      expect(options[0]).toHaveProperty('tradeOffs');
    });

    it('generates architectural options for system design', () => {
      const options = ProactiveSuggestionService.generateApproachOptions({
        interviewType: 'system-design',
        stage: 'technical',
      });
      expect(options.some((opt) => opt.name.includes('Gateway') || opt.name.includes('Event-Driven'))).toBe(true);
    });
  });

  describe('Tier 3: Step-by-Step Scaffolding', () => {
    it('generates sequential scaffolding steps for technical interviews', () => {
      const steps = ProactiveSuggestionService.generateScaffolding({
        interviewType: 'dsa',
        stage: 'technical',
      });
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps[0]).toMatch(/Step 1/i);
    });

    it('generates STAR scaffolding for behavioral interviews', () => {
      const steps = ProactiveSuggestionService.generateScaffolding({
        interviewType: 'behavioral',
        stage: 'technical',
      });
      expect(steps.some((s) => s.includes('Situation'))).toBe(true);
      expect(steps.some((s) => s.includes('Action'))).toBe(true);
      expect(steps.some((s) => s.includes('Result'))).toBe(true);
    });
  });

  describe('Master Resolver: getProactiveSuggestions & generateTieredSuggestion', () => {
    it('escalates to Tier 2 when silence duration threshold is exceeded', () => {
      const suggestions = ProactiveSuggestionService.getProactiveSuggestions({
        interviewType: 'dsa',
        stage: 'technical',
        silenceDurationSec: 28, // threshold is 25s
      });
      expect(suggestions.isSilenceExceeded).toBe(true);
      expect(suggestions.effectiveTier).toBe(SUGGESTION_TIERS.TIER_2_APPROACH_OPTIONS);
      expect(suggestions.approachOptions.length).toBeGreaterThan(0);
    });

    it('escalates to Tier 3 when stuckLevel is >= 2', () => {
      const suggestions = ProactiveSuggestionService.getProactiveSuggestions({
        interviewType: 'dsa',
        stage: 'technical',
        stuckLevel: 2,
      });
      expect(suggestions.effectiveTier).toBe(SUGGESTION_TIERS.TIER_3_SCAFFOLDING);
      expect(suggestions.scaffolding.length).toBeGreaterThan(0);
    });

    it('generates targeted tiered suggestions on demand', () => {
      const tier0 = ProactiveSuggestionService.generateTieredSuggestion({
        tier: 0,
        interviewType: 'dsa',
        stage: 'technical',
      });
      expect(tier0.type).toBe('thought_starter');
      expect(tier0.tier).toBe(0);

      const tier1 = ProactiveSuggestionService.generateTieredSuggestion({
        tier: 1,
        interviewType: 'dsa',
        stage: 'technical',
        weakestDimension: 'clarity',
      });
      expect(tier1.type).toBe('coaching_cue');
      expect(tier1.content).toContain('concept');

      const tier2 = ProactiveSuggestionService.generateTieredSuggestion({
        tier: 2,
        interviewType: 'dsa',
        stage: 'technical',
      });
      expect(tier2.type).toBe('approach_options');
      expect(tier2.options.length).toBeGreaterThan(0);

      const tier3 = ProactiveSuggestionService.generateTieredSuggestion({
        tier: 3,
        interviewType: 'dsa',
        stage: 'technical',
      });
      expect(tier3.type).toBe('scaffolding');
      expect(tier3.steps.length).toBeGreaterThan(0);
    });
  });
});

describe('Enhanced STAR Detection & Progressive STAR Coaching', () => {
  it('detects missing situation/task and guides scene setting (Phase 1)', () => {
    // Only action and result provided
    const text = 'I implemented the caching layer and as a result latency reduced by 40%.';
    const star = detectStarComponents(text);
    expect(star.hasAction).toBe(true);
    expect(star.hasResult).toBe(true);
    expect(star.hasSituation).toBe(false);

    const guidance = computeProgressiveStarGuidance(star);
    expect(guidance.phase).toBe('scene_setting');
    expect(guidance.cue).toContain('set the scene');
    expect(guidance.missingElements).toContain('situation');
    expect(guidance.suggestedTier).toBe(1);
  });

  it('detects missing action and probes personal contribution (Phase 2)', () => {
    // Situation, task, and result provided, but no personal action
    const text = 'At my previous company our team had a major outage. My goal was to restore service and we achieved 99.9% uptime.';
    const star = detectStarComponents(text);
    expect(star.hasSituation).toBe(true);
    expect(star.hasTask).toBe(true);
    expect(star.hasAction).toBe(false);
    expect(star.hasResult).toBe(true);

    const guidance = computeProgressiveStarGuidance(star);
    expect(guidance.phase).toBe('personal_contribution');
    expect(guidance.cue).toContain('actions did you personally take');
    expect(guidance.missingElements).toEqual(['action']);
  });

  it('detects missing result and probes outcome/metrics (Phase 3)', () => {
    // Situation, task, and action provided, but no result
    const text = 'In that situation we were facing database bottlenecks. My task was to optimize queries. I refactored the index strategy.';
    const star = detectStarComponents(text);
    expect(star.hasSituation).toBe(true);
    expect(star.hasTask).toBe(true);
    expect(star.hasAction).toBe(true);
    expect(star.hasResult).toBe(false);

    const guidance = computeProgressiveStarGuidance(star);
    expect(guidance.phase).toBe('outcome_metrics');
    expect(guidance.cue).toContain('concrete outcome or measurable impact');
    expect(guidance.missingElements).toEqual(['result']);
  });

  it('identifies complete STAR and initiates depth probe (Phase 4)', () => {
    const text = 'In that situation we were facing bottlenecks. My role was to optimize it. I implemented Redis caching, and as a result latency reduced by 50%.';
    const star = detectStarComponents(text);
    expect(isStarComplete(star)).toBe(true);

    const guidance = computeProgressiveStarGuidance(star);
    expect(guidance.phase).toBe('depth_probe');
    expect(guidance.cue).toContain('obstacle or trade-off');
    expect(guidance.missingElements).toHaveLength(0);
  });

  it('embeds suggestion tier and progressive coaching payload in decideBranch', () => {
    const decision = InterviewFollowUpRulesService.decideBranch({
      analysis: { score: 70 },
      interviewContext: {
        interviewType: 'behavioral',
        turns: 1,
      },
      candidateResponse: 'I decided to lead the migration and we finished quickly.',
    });

    expect(decision.nextAction).toBe('star_completion');
    expect(decision.suggestionTier).toBe(1);
    expect(decision.progressiveCoaching).toBeDefined();
    expect(decision.progressiveCoaching?.phase).toBe('scene_setting');
  });
});

describe('Rubric-Aware Coaching & Stage Guidance in Prompt and Conversation Services', () => {
  it('correctly extracts weakest dimension from rubric history', () => {
    const rubricHistory = [
      { turn: 1, clarity: 9, depth: 4, correctness: 8 },
      { turn: 2, clarity: 8, depth: 5, correctness: 9 },
    ];
    const weakestInfo = getWeakestRubricDimension(rubricHistory);
    expect(weakestInfo.weakest).toBe('depth');
    expect(weakestInfo.cue).toContain('technical depth');
  });

  it('includes stage guidance and weakest rubric dimension in prompt builder', () => {
    const prompt = InterviewPromptService.buildFollowUpPrompt({
      problemStatement: 'Invert a binary tree.',
      transcript: [],
      candidateResponse: 'Swap left and right recursively.',
      interviewType: 'dsa',
      interviewContext: {
        stage: 'technical',
        weakestDimension: 'clarity',
        adaptiveFollowUp: {
          suggestionTier: 1,
          progressiveCoaching: {
            phase: 'scene_setting',
            cue: 'Clarify the inputs and base cases first.',
          },
        },
      },
    });

    expect(prompt).toContain('Stage guidance: Focus on core algorithmic');
    expect(prompt).toContain('Weakest rubric dimension: clarity');
    expect(prompt).toContain('PROGRESSIVE STAR COACHING (scene_setting)');
    expect(prompt).toContain('SUGGESTION TIER: Tier 1');
  });

  it('buildFallbackFollowUp incorporates rubric coaching cue and progressive coaching', () => {
    const fallback = InterviewConversationService.buildFallbackFollowUp(
      'full_realtime',
      'dsa',
      ['edge cases'],
      [],
      {
        weakestDimension: 'correctness',
        suggestionTier: 2,
      }
    );

    expect(fallback.suggestionTier).toBe(2);
    expect(fallback.coachingCue).toContain('correctness');
    expect(fallback.hints[0]).toContain('correctness');
  });

  it('normalizeFollowUp preserves coachingCue and suggestionTier', () => {
    const normalized = InterviewConversationService.normalizeFollowUp({
      content: JSON.stringify({
        message: 'Could you walk through the edge case when the array is empty?',
        coachingCue: 'Pay attention to boundary checks.',
        suggestionTier: 1,
      }),
      interviewMode: 'full_realtime',
      interviewType: 'dsa',
    });

    expect(normalized.parseSuccess).toBe(true);
    expect(normalized.followUp.message).toContain('edge case');
    expect(normalized.followUp.coachingCue).toBe('Pay attention to boundary checks.');
    expect(normalized.followUp.suggestionTier).toBe(1);
  });
});
