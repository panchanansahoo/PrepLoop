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
 * @returns {{ nextMood: string, reason: string }}
 */
export function computeNextMood(currentMood = MOODS.NEUTRAL, {
  score = 70,
  wordCount = 30,
  cumulativeScores = [],
  consecutiveLowScores = 0,
} = {}) {
  const validMood = Object.values(MOODS).includes(currentMood) ? currentMood : MOODS.NEUTRAL;
  const numScore = Number(score) || 0;
  const words = Number(wordCount) || 0;

  // Very short or empty answer -> quick path to impatient or skeptical
  if (words < 12 || consecutiveLowScores >= 2) {
    if (validMood === MOODS.SKEPTICAL || consecutiveLowScores >= 2) {
      return { nextMood: MOODS.IMPATIENT, reason: 'consecutive_weak_answers_or_short_stalls' };
    }
    return { nextMood: MOODS.SKEPTICAL, reason: 'under_answered_or_stuck' };
  }

  // Outstanding response (85+)
  if (numScore >= 85) {
    if (validMood === MOODS.SKEPTICAL || validMood === MOODS.IMPATIENT) {
      // Rebound: interviewer skepticism gives way to curiosity or neutral first
      return { nextMood: MOODS.CURIOUS, reason: 'strong_rebound_from_skepticism' };
    }
    return { nextMood: MOODS.IMPRESSED, reason: 'high_quality_comprehensive_answer' };
  }

  // Sustained excellence across recent questions
  const recentScores = Array.isArray(cumulativeScores) ? cumulativeScores.slice(-3) : [];
  if (recentScores.length >= 3 && numScore >= 75) {
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    if (avgRecent >= 82 && validMood !== MOODS.IMPATIENT) {
      return { nextMood: MOODS.IMPRESSED, reason: 'sustained_excellence_across_questions' };
    }
  }

  // Solid response (72 - 84)
  if (numScore >= 72) {
    if (validMood === MOODS.IMPRESSED) {
      return { nextMood: MOODS.IMPRESSED, reason: 'maintaining_strong_impression' };
    }
    return { nextMood: MOODS.CURIOUS, reason: 'solid_technical_depth_invites_curiosity' };
  }

  // Moderate response (55 - 71)
  if (numScore >= 55) {
    if (validMood === MOODS.IMPATIENT) {
      return { nextMood: MOODS.NEUTRAL, reason: 'recovery_to_acceptable_depth' };
    }
    if (validMood === MOODS.IMPRESSED) {
      return { nextMood: MOODS.CURIOUS, reason: 'impressed_interviewer_shifts_to_curious' };
    }
    return { nextMood: MOODS.NEUTRAL, reason: 'baseline_moderate_answer' };
  }

  // Poor / struggling response (< 55)
  if (validMood === MOODS.IMPRESSED) {
    return { nextMood: MOODS.SKEPTICAL, reason: 'unexpected_dip_triggers_scrutiny' };
  }
  if (validMood === MOODS.SKEPTICAL) {
    return { nextMood: MOODS.IMPATIENT, reason: 'continued_difficulty_triggers_impatience' };
  }
  return { nextMood: MOODS.SKEPTICAL, reason: 'weak_score_triggers_skepticism' };
}

/**
 * Pick or generate a mood-driven micro-reaction sentence to be spoken
 * before asking the next question.
 *
 * @param {string} mood - Current mood state
 * @param {object} options
 * @param {number} options.seed - Deterministic seed for consistency
 * @param {string} options.customRemark - Model generated micro-reaction if available
 * @returns {string} Single sentence micro-reaction
 */
export function getMicroReaction(mood = MOODS.NEUTRAL, { seed = 0, customRemark = '' } = {}) {
  if (customRemark && typeof customRemark === 'string' && customRemark.trim().length > 0) {
    const cleaned = customRemark.trim();
    // Ensure it's roughly 1 concise sentence
    const firstSentence = cleaned.split(/(?<=[.?!])\s+/)[0] || cleaned;
    return firstSentence.length <= 120 ? firstSentence : firstSentence.substring(0, 117) + '...';
  }

  const profile = MOOD_PROFILES[mood] || MOOD_PROFILES[MOODS.NEUTRAL];
  const pool = profile.microReactions;
  const s = Math.abs(Number(seed) || 0);
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

