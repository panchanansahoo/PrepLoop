/**
 * interviewerMoodEngine.js
 *
 * Dynamic Interviewer Mood State Engine
 * Tracks the emotional arc of an interviewer throughout a session:
 *   neutral -> impressed -> skeptical -> curious -> impatient
 *
 * Transitions are driven by:
 * - Answer score
 * - Answer completeness / brevity (word count)
 * - Score trends & consecutive performance
 *
 * Each mood influences:
 * - Prompt demeanor instructions
 * - Spoken micro-reactions
 * - Avatar expression tag
 * - TTS prosody recommendations
 */

export const MOODS = {
  NEUTRAL: 'neutral',
  IMPRESSED: 'impressed',
  SKEPTICAL: 'skeptical',
  CURIOUS: 'curious',
  IMPATIENT: 'impatient',
};

export const MOOD_PROFILES = {
  [MOODS.NEUTRAL]: {
    expression: 'neutral',
    avatarOverlay: 'attentive',
    ttsProsody: { rate: '1.0', pitch: '0st', energy: 'normal' },
    toneInstruction:
      'Professional, objective, observant, and measured. Maintain an open and neutral disposition.',
    microReactions: [
      'Makes sense.',
      'Got it, thank you.',
      'Understood.',
      'Right, let us keep moving.',
      'Noted.',
      'Okay, clear enough.',
    ],
  },
  [MOODS.IMPRESSED]: {
    expression: 'impressed',
    avatarOverlay: 'warm_smile',
    ttsProsody: { rate: '1.03', pitch: '+1st', energy: 'warm' },
    toneInstruction:
      'Warm, engaged, encouraging, and visibly impressed by the candidate depth. Lean into their strength while challenging them to reach even higher.',
    microReactions: [
      "That is a really solid breakdown.",
      "Spot on approach — I like how you framed that.",
      "Very thoughtful consideration of the trade-offs.",
      "Great clarity there, exactly what I was hoping to hear.",
      "Nicely done. That demonstrates strong architectural sense.",
      "That is a mature engineering decision.",
    ],
  },
  [MOODS.SKEPTICAL]: {
    expression: 'skeptical',
    avatarOverlay: 'raised_eyebrow',
    ttsProsody: { rate: '0.96', pitch: '-1st', energy: 'deliberate' },
    toneInstruction:
      'Analytical, probing, slightly unconvinced, and challenging. Push back on unstated assumptions, edge cases, and hand-wavy claims.',
    microReactions: [
      "Hmm, let me push back a bit on that.",
      "Are you certain that holds up under edge cases?",
      "That might work on paper, but what about at scale?",
      "I am not entirely convinced by that trade-off.",
      "Let us look a little closer at that assumption.",
      "Wait, walk me through why that would not fail under contention.",
    ],
  },
  [MOODS.CURIOUS]: {
    expression: 'curious',
    avatarOverlay: 'tilted_head',
    ttsProsody: { rate: '1.01', pitch: '+0.5st', energy: 'engaged' },
    toneInstruction:
      'Intrigued, inquisitive, genuinely fascinated by their direction, and eager to explore why they chose this specific path.',
    microReactions: [
      "Interesting angle — why choose that path specifically?",
      "Oh interesting, I see where you are going with that.",
      "That is an unusual approach, let us explore that a bit.",
      "Fascinating choice. What led you to prioritize that?",
      "Tell me more about how you arrived at that structure.",
    ],
  },
  [MOODS.IMPATIENT]: {
    expression: 'impatient',
    avatarOverlay: 'direct_stare',
    ttsProsody: { rate: '1.06', pitch: '-0.5st', energy: 'brisk' },
    toneInstruction:
      'Direct, time-conscious, and brisk. Wants concrete technical answers without fluff, rambling, or dodging the core question.',
    microReactions: [
      "Let us cut right to the core of the problem.",
      "Okay, but what is the concrete implementation here?",
      "Let us tighten our focus and keep the pacing up.",
      "I need a more specific technical answer on this one.",
      "Let us get specific — what is the exact data structure or mechanism?",
    ],
  },
};

/**
 * Determine the next mood state based on candidate performance.
 *
 * @param {string} currentMood - Existing mood state
 * @param {object} params
 * @param {number} params.score - Latest score (0-100)
 * @param {number} params.wordCount - Number of words in user answer
 * @param {number[]} params.cumulativeScores - Historical scores
 * @param {number} params.consecutiveLowScores - Count of consecutive sub-50 answers
 * @param {string} params.stage - Current interview stage (warmup, challenge, technical, etc.)
 * @param {number} params.scoreDrop - Explicit score drop from previous turn
 * @param {number} params.consecutiveTriggers - Number of consecutive negative triggers
 * @returns {{ nextMood: string, reason: string }}
 */
export function computeNextMood(currentMood = MOODS.NEUTRAL, {
  score = 70,
  wordCount = 30,
  cumulativeScores = [],
  consecutiveLowScores = 0,
  topicSwitch = false,
  isTopicSwitch = false,
  trend = null,
  scoreTrend = null,
  stage = null,
  interviewStage = null,
  scoreDrop = null,
  consecutiveTriggers = 0,
  impatientTriggers = 0,
} = {}) {
  // Topic switch resets mood to neutral baseline
  if (topicSwitch || isTopicSwitch) {
    return { nextMood: MOODS.NEUTRAL, reason: 'topic_switch_reset' };
  }

  const validMood = Object.values(MOODS).includes(currentMood) ? currentMood : MOODS.NEUTRAL;
  const numScore = Number(score) || 0;
  const words = Number(wordCount) || 0;
  const trajectory = String(trend || scoreTrend?.trend || '').toLowerCase();
  const currentStage = String(stage || interviewStage || '').toLowerCase();

  // Mood inertia: calculate score drop from previous session scores
  let drop = 0;
  if (scoreDrop !== null && Number.isFinite(Number(scoreDrop))) {
    drop = Number(scoreDrop);
  } else if (Array.isArray(cumulativeScores) && cumulativeScores.length >= 1) {
    const prevScore = (cumulativeScores.length >= 2 && cumulativeScores[cumulativeScores.length - 1] === numScore)
      ? Number(cumulativeScores[cumulativeScores.length - 2])
      : Number(cumulativeScores[cumulativeScores.length - 1]);
    if (Number.isFinite(prevScore)) {
      drop = Math.max(0, prevScore - numScore);
    }
  }

  const hasSignificantDrop = drop >= 25;
  const hasConsecutiveTriggers = consecutiveLowScores >= 2
    || Number(consecutiveTriggers) >= 2
    || Number(impatientTriggers) >= 2;
  const canTransitionToImpatient = hasConsecutiveTriggers || hasSignificantDrop;

  // Helper to enforce stage-awareness (warmup suppression and challenge bias)
  const finalizeMood = (nextMood, reason) => {
    // In warmup stage, suppress impatient mood -> downgrade to skeptical
    if (currentStage === 'warmup' && nextMood === MOODS.IMPATIENT) {
      return { nextMood: MOODS.SKEPTICAL, reason: 'warmup_stage_suppresses_impatience' };
    }

    // In challenge stage, bias toward skeptical and curious
    if (currentStage === 'challenge') {
      if (nextMood === MOODS.NEUTRAL) {
        return {
          nextMood: numScore >= 65 ? MOODS.CURIOUS : MOODS.SKEPTICAL,
          reason: 'challenge_stage_bias_skeptical_curious',
        };
      }
    }

    return { nextMood, reason };
  };

  // Very short or empty answer -> path to impatient (requires 2 triggers or drop) or skeptical
  if (words < 12 || consecutiveLowScores >= 2) {
    if (validMood === MOODS.IMPATIENT) {
      return finalizeMood(MOODS.IMPATIENT, 'consecutive_weak_answers_or_short_stalls');
    }
    if ((canTransitionToImpatient || validMood === MOODS.SKEPTICAL) && (validMood === MOODS.SKEPTICAL || consecutiveLowScores >= 2)) {
      return finalizeMood(MOODS.IMPATIENT, 'consecutive_weak_answers_or_short_stalls');
    }
    return finalizeMood(MOODS.SKEPTICAL, 'under_answered_or_stuck');
  }

  // Trajectory acceleration: declining trend accelerates push toward skeptical or impatient
  if (trajectory === 'declining') {
    if (validMood === MOODS.SKEPTICAL && numScore < 72) {
      if (canTransitionToImpatient) {
        return finalizeMood(MOODS.IMPATIENT, 'declining_trajectory_triggers_impatience');
      }
      return finalizeMood(MOODS.SKEPTICAL, 'declining_trajectory_triggers_skepticism');
    }
    if (validMood === MOODS.NEUTRAL && numScore < 65) {
      return finalizeMood(MOODS.SKEPTICAL, 'declining_trajectory_triggers_skepticism');
    }
  }

  // Trajectory boost: improving trend sustains curious mood and facilitates rebound
  if (trajectory === 'improving' && numScore >= 65) {
    if (validMood === MOODS.SKEPTICAL || validMood === MOODS.IMPATIENT) {
      return finalizeMood(MOODS.CURIOUS, 'improving_trajectory_rekindles_curiosity');
    }
    if (validMood === MOODS.CURIOUS) {
      return finalizeMood(MOODS.CURIOUS, 'improving_trajectory_sustains_curiosity');
    }
  }

  // Outstanding response (85+)
  if (numScore >= 85) {
    if (validMood === MOODS.SKEPTICAL || validMood === MOODS.IMPATIENT) {
      // Rebound: interviewer skepticism gives way to curiosity or neutral first
      return finalizeMood(MOODS.CURIOUS, 'strong_rebound_from_skepticism');
    }
    return finalizeMood(MOODS.IMPRESSED, 'high_quality_comprehensive_answer');
  }

  // Sustained excellence across recent questions
  const recentScores = Array.isArray(cumulativeScores) ? cumulativeScores.slice(-3) : [];
  if (recentScores.length >= 3 && numScore >= 75) {
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    if (avgRecent >= 82 && validMood !== MOODS.IMPATIENT) {
      return finalizeMood(MOODS.IMPRESSED, 'sustained_excellence_across_questions');
    }
  }

  // Solid response (72 - 84)
  if (numScore >= 72) {
    if (validMood === MOODS.IMPATIENT) {
      return finalizeMood(MOODS.CURIOUS, 'recovery_reignites_curiosity');
    }
    if (validMood === MOODS.IMPRESSED) {
      return finalizeMood(MOODS.IMPRESSED, 'maintaining_strong_impression');
    }
    return finalizeMood(MOODS.CURIOUS, 'solid_technical_depth_invites_curiosity');
  }

  // Moderate response (55 - 71)
  if (numScore >= 55) {
    if (validMood === MOODS.IMPATIENT) {
      return finalizeMood(
        numScore >= 70 ? MOODS.CURIOUS : MOODS.NEUTRAL,
        numScore >= 70 ? 'recovery_reignites_curiosity' : 'recovery_to_acceptable_depth'
      );
    }
    if (validMood === MOODS.IMPRESSED) {
      return finalizeMood(MOODS.CURIOUS, 'impressed_interviewer_shifts_to_curious');
    }
    return finalizeMood(MOODS.NEUTRAL, 'baseline_moderate_answer');
  }

  // Poor / struggling response (< 55)
  if (validMood === MOODS.IMPRESSED) {
    return finalizeMood(MOODS.SKEPTICAL, 'unexpected_dip_triggers_scrutiny');
  }
  if (validMood === MOODS.SKEPTICAL || validMood === MOODS.IMPATIENT) {
    if (canTransitionToImpatient || validMood === MOODS.IMPATIENT) {
      return finalizeMood(MOODS.IMPATIENT, 'continued_difficulty_triggers_impatience');
    }
    return finalizeMood(MOODS.SKEPTICAL, 'weak_score_triggers_skepticism');
  }
  return finalizeMood(MOODS.SKEPTICAL, 'weak_score_triggers_skepticism');
}

/**
 * Pick or generate a mood-driven micro-reaction sentence to be spoken
 * before asking the next question.
 *
 * @param {string} mood - Current mood state
 * @param {object} options
 * @param {number} options.seed - Deterministic seed for consistency
 * @param {string} options.customRemark - Model generated micro-reaction if available
 * @param {Set<string>|string[]} options.usedReactions - Already used micro-reactions for deduplication
 * @returns {string} Single sentence micro-reaction
 */
export function getMicroReaction(mood = MOODS.NEUTRAL, { seed = 0, customRemark = '', usedReactions = null } = {}) {
  if (customRemark && typeof customRemark === 'string' && customRemark.trim().length > 0) {
    const cleaned = customRemark.trim();
    // Ensure it's roughly 1 concise sentence
    const firstSentence = cleaned.split(/(?<=[.?!])\s+/)[0] || cleaned;
    return firstSentence.length <= 120 ? firstSentence : firstSentence.substring(0, 117) + '...';
  }

  const profile = MOOD_PROFILES[mood] || MOOD_PROFILES[MOODS.NEUTRAL];
  const pool = profile.microReactions;
  const s = Math.abs(Number(seed) || 0);

  if (usedReactions && (usedReactions instanceof Set || Array.isArray(usedReactions))) {
    const isUsed = (r) => (usedReactions instanceof Set ? usedReactions.has(r) : usedReactions.includes(r));
    let available = pool.filter((r) => !isUsed(r));
    if (available.length === 0) {
      if (usedReactions instanceof Set) {
        pool.forEach((r) => usedReactions.delete(r));
      } else if (Array.isArray(usedReactions)) {
        for (let i = usedReactions.length - 1; i >= 0; i--) {
          if (pool.includes(usedReactions[i])) usedReactions.splice(i, 1);
        }
      }
      available = pool;
    }
    const selectionPool = available.length > 0 ? available : pool;
    const chosen = selectionPool[s % selectionPool.length];
    if (usedReactions instanceof Set) {
      usedReactions.add(chosen);
    } else {
      usedReactions.push(chosen);
    }
    return chosen;
  }

  const idx = s % pool.length;
  return pool[idx];
}

/**
 * Retrieve complete mood profile descriptor.
 */
export function getMoodProfile(mood = MOODS.NEUTRAL) {
  const key = Object.values(MOODS).includes(mood) ? mood : MOODS.NEUTRAL;
  return {
    mood: key,
    ...MOOD_PROFILES[key],
  };
}

export const transitionMood = computeNextMood;

export class InterviewMoodEngine {
  static transitionMood(currentMood = MOODS.NEUTRAL, params = {}) {
    return computeNextMood(currentMood, params);
  }
  static computeNextMood(currentMood = MOODS.NEUTRAL, params = {}) {
    return computeNextMood(currentMood, params);
  }
  static getMicroReaction(mood, options) {
    return getMicroReaction(mood, options);
  }
  static getMoodProfile(mood) {
    return getMoodProfile(mood);
  }
}

export default InterviewMoodEngine;


