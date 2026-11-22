import { describe, it, expect } from 'vitest';
import {
  computeNextMood,
  getMicroReaction,
  getMoodProfile,
  MOODS,
} from '../../services/interviewerMoodEngine.js';
import { getCompanyInterviewStyle } from '../../data/companyInterviewStyles.js';
import {
  getAdaptiveDifficultyPrompt,
  extractCandidateKeyTopics,
} from '../../routes/company-interview/helpers.js';

describe('Interviewer Mood Engine & Emotional Arc (Phase 1A & 1B)', () => {
  it('transitions to impressed when score is high (85+)', () => {
    const { nextMood, reason } = computeNextMood(MOODS.NEUTRAL, {
      score: 90,
      wordCount: 80,
    });
    expect(nextMood).toBe(MOODS.IMPRESSED);
    expect(reason).toBe('high_quality_comprehensive_answer');
  });

  it('transitions to skeptical on poor scores or under-answering', () => {
    const { nextMood, reason } = computeNextMood(MOODS.NEUTRAL, {
      score: 40,
      wordCount: 5,
    });
    expect(nextMood).toBe(MOODS.SKEPTICAL);
    expect(reason).toBe('under_answered_or_stuck');
  });

  it('escalates from skeptical to impatient on repeated weak answers', () => {
    const { nextMood } = computeNextMood(MOODS.SKEPTICAL, {
      score: 35,
      wordCount: 4,
      consecutiveLowScores: 2,
    });
    expect(nextMood).toBe(MOODS.IMPATIENT);
  });

  it('recovers from skepticism to curious on a strong rebound score', () => {
    const { nextMood } = computeNextMood(MOODS.SKEPTICAL, {
      score: 88,
      wordCount: 65,
    });
    expect(nextMood).toBe(MOODS.CURIOUS);
  });

  it('resets interviewer mood to neutral on topic switch', () => {
    const { nextMood, reason } = computeNextMood(MOODS.IMPATIENT, {
      topicSwitch: true,
    });
    expect(nextMood).toBe(MOODS.NEUTRAL);
    expect(reason).toBe('topic_switch_reset');
  });

  it('recovers from impatience to curious on solid score (>=70)', () => {
    const { nextMood } = computeNextMood(MOODS.IMPATIENT, {
      score: 75,
      wordCount: 50,
    });
    expect(nextMood).toBe(MOODS.CURIOUS);
  });

  it('generates mood-specific micro-reactions', () => {
    const impressedReaction = getMicroReaction(MOODS.IMPRESSED, { seed: 1 });
    expect(typeof impressedReaction).toBe('string');
    expect(impressedReaction.length).toBeGreaterThan(5);

    const skepticalReaction = getMicroReaction(MOODS.SKEPTICAL, { seed: 2 });
    expect(typeof skepticalReaction).toBe('string');
    expect(skepticalReaction.length).toBeGreaterThan(5);

    // Custom model remark should override pool if present
    const customReaction = getMicroReaction(MOODS.CURIOUS, {
      customRemark: 'That is a very clever way to avoid recursion.',
    });
    expect(customReaction).toBe('That is a very clever way to avoid recursion.');
  });

  it('returns valid mood profile with avatar expression and tts prosody', () => {
    const profile = getMoodProfile(MOODS.IMPRESSED);
    expect(profile.expression).toBe('impressed');
    expect(profile.ttsProsody.energy).toBe('warm');
    expect(profile.toneInstruction).toContain('Warm');
  });

  it('incorporates trajectory awareness to accelerate skeptical/impatient or sustain curious', () => {
    // Declining trend accelerates shift to skeptical on mediocre score
    const declining = computeNextMood(MOODS.NEUTRAL, {
      score: 60,
      wordCount: 35,
      trend: 'declining',
    });
    expect(declining.nextMood).toBe(MOODS.SKEPTICAL);
    expect(declining.reason).toBe('declining_trajectory_triggers_skepticism');

    // Improving trend rebounds from skeptical to curious even at 68
    const improving = computeNextMood(MOODS.SKEPTICAL, {
      score: 68,
      wordCount: 40,
      trend: 'improving',
    });
    expect(improving.nextMood).toBe(MOODS.CURIOUS);
    expect(improving.reason).toBe('improving_trajectory_rekindles_curiosity');
  });

  it('deduplicates micro-reactions using a usedReactions set', () => {
    const used = new Set<string>();
    const reaction1 = getMicroReaction(MOODS.NEUTRAL, { seed: 0, usedReactions: used });
    expect(used.has(reaction1)).toBe(true);

    const reaction2 = getMicroReaction(MOODS.NEUTRAL, { seed: 0, usedReactions: used });
    expect(reaction2).not.toBe(reaction1);
    expect(used.size).toBe(2);
  });

  it('rotates gracefully when all micro-reactions in pool have been used', () => {
    const used = new Set<string>();
    // Neutral mood has 4 reactions
    const poolSize = 4;
    for (let i = 0; i < poolSize; i++) {
      getMicroReaction(MOODS.NEUTRAL, { seed: i, usedReactions: used });
    }
    expect(used.size).toBe(poolSize);

    // Next selection should reset pool and pick without getting stuck or throwing
    const recycled = getMicroReaction(MOODS.NEUTRAL, { seed: 0, usedReactions: used });
    expect(typeof recycled).toBe('string');
    expect(recycled.length).toBeGreaterThan(0);
  });

  describe('Mood Inertia & Stage Awareness', () => {
    it('suppresses impatient mood in warmup stage and downgrades to skeptical', () => {
      const result = computeNextMood(MOODS.SKEPTICAL, {
        score: 30,
        wordCount: 5,
        consecutiveLowScores: 2,
        stage: 'warmup',
      });
      expect(result.nextMood).toBe(MOODS.SKEPTICAL);
      expect(result.reason).toBe('warmup_stage_suppresses_impatience');
    });

    it('biases toward skeptical and curious in challenge stage', () => {
      // Score 60 (moderate) normally yields NEUTRAL, in challenge stage biases to SKEPTICAL
      const lowChallenge = computeNextMood(MOODS.NEUTRAL, {
        score: 60,
        wordCount: 30,
        stage: 'challenge',
      });
      expect(lowChallenge.nextMood).toBe(MOODS.SKEPTICAL);
      expect(lowChallenge.reason).toBe('challenge_stage_bias_skeptical_curious');

      // Score 68 (moderate/good) normally yields NEUTRAL, in challenge stage biases to CURIOUS
      const highChallenge = computeNextMood(MOODS.NEUTRAL, {
        score: 68,
        wordCount: 30,
        stage: 'challenge',
      });
      expect(highChallenge.nextMood).toBe(MOODS.CURIOUS);
      expect(highChallenge.reason).toBe('challenge_stage_bias_skeptical_curious');
    });

    it('requires 2 consecutive triggers or significant score drop before transitioning to impatient', () => {
      // Single weak turn with no significant drop from skeptical mood stays skeptical (inertia)
      const singleTrigger = computeNextMood(MOODS.SKEPTICAL, {
        score: 45,
        wordCount: 20,
        consecutiveLowScores: 1,
        cumulativeScores: [50],
      });
      expect(singleTrigger.nextMood).toBe(MOODS.SKEPTICAL);

      // Significant score drop (>= 25 pts) transitions to impatient even on single turn
      const bigDrop = computeNextMood(MOODS.SKEPTICAL, {
        score: 45,
        wordCount: 20,
        consecutiveLowScores: 1,
        cumulativeScores: [80], // 80 - 45 = 35 pt drop
      });
      expect(bigDrop.nextMood).toBe(MOODS.IMPATIENT);

      // 2 consecutive triggers transitions to impatient
      const twoTriggers = computeNextMood(MOODS.SKEPTICAL, {
        score: 45,
        wordCount: 20,
        consecutiveLowScores: 2,
      });
      expect(twoTriggers.nextMood).toBe(MOODS.IMPATIENT);
    });
  });
});

describe('Company-Specific Interview Styles (Phase 6A)', () => {
  it('retrieves distinct culture profiles for major tech companies', () => {
    const google = getCompanyInterviewStyle('Google');
    expect(google.style).toBe('structured');
    expect(google.focusAreas).toContain('algorithms');
    expect(google.signaturePhrase).toContain('Walk me through your thought process');
    expect(google.warmupLine).toBeDefined();

    const amazon = getCompanyInterviewStyle('Amazon');
    expect(amazon.style).toBe('behavioral-heavy');
    expect(amazon.focusAreas).toContain('leadership principles');
    expect(amazon.warmupLine).toContain('notes');

    const meta = getCompanyInterviewStyle('Meta');
    expect(meta.style).toBe('fast-paced-code');
    expect(meta.warmupLine).toBeDefined();
  });

  it('provides a resilient fallback profile for arbitrary companies', () => {
    const startup = getCompanyInterviewStyle('SomeFastStartup');
    expect(startup.style).toBeDefined();
    expect(startup.focusAreas.length).toBeGreaterThan(0);
    expect(startup.warmupLine).toContain('SomeFastStartup');
  });
});

describe('Adaptive Difficulty Scaling & Continuity Memory (Phase 3A & 6B)', () => {
  it('escalates difficulty when rolling 3-question average is > 80', () => {
    const prompt = getAdaptiveDifficultyPrompt(90, 88, [85, 88, 92], 'Google', 'Technical');
    expect(prompt).toContain('EXCELLING');
    expect(prompt).toContain('ESCALATE difficulty');
    expect(prompt).toContain('Rolling 3-Question Average Score: 88/100');
  });

  it('simplifies difficulty and adds scaffolding when rolling average is < 50', () => {
    const prompt = getAdaptiveDifficultyPrompt(40, 42, [45, 38, 42], 'Amazon', 'Technical');
    expect(prompt).toContain('STRUGGLING');
    expect(prompt).toContain('SIMPLIFY the next question immediately');
    expect(prompt).toContain('Add scaffolding');
  });

  it('maintains depth when rolling average is between 50 and 80', () => {
    const prompt = getAdaptiveDifficultyPrompt(68, 70, [65, 72, 68], 'Meta', 'Behavioral');
    expect(prompt).toContain('BALANCED band');
    expect(prompt).toContain('MAINTAIN current depth');
  });

  it('extracts candidate key technical topics for continuity memory', () => {
    const history = [
      { role: 'candidate', content: 'In my last project, I used React with Redux for state and Redis for caching.' },
      { role: 'interviewer', content: 'Nice, how did you handle cache invalidation?' },
      { role: 'candidate', content: 'We used PostgreSQL as the source of truth and Docker for deployment.' },
    ];
    const extracted = extractCandidateKeyTopics(history, 'I also implemented binary search on sorted logs.');
    expect(extracted).toContain('react');
    expect(extracted).toContain('redis');
    expect(extracted).toContain('postgresql');
    expect(extracted).toContain('binary search');
  });
});
