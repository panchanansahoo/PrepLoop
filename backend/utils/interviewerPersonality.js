/**
 * Interviewer Personality Manager
 * Defines and manages 5 distinct interviewer personas for realistic interactions
 * Each persona has unique patterns for questioning, pacing, and feedback
 */

/**
 * Interviewer Personas
 */
const PERSONAS = {
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  INTENSE: 'intense',
  ACADEMIC: 'academic',
  BEHAVIORAL: 'behavioral'
};

/**
 * Persona Definitions
 */
const PERSONA_CONFIGS = {
  [PERSONAS.PROFESSIONAL]: {
    name: 'Professional Interviewer',
    description: 'Structured, objective, focus on technical skills',
    characteristics: {
      paceMultiplier: 1.0,           // Normal pace
      pauseLength: 1000,             // 1s pause after answers
      reactionDelay: 500,            // 0.5s to react
      followUpDepth: 'moderate',     // Some follow-ups
      warmth: 6,                     // 0-10 scale
      technicalFocus: 9,
      personalConnectivity: 5
    },
    voiceCharacteristics: {
      speed: 1.0,
      pitch: 1.0,
      tone: 'neutral'
    },
    questionPatterns: {
      introPhrase: [
        'Let\'s move to the next topic.',
        'I\'d like to understand more about',
        'Can you walk me through',
        'Let\'s discuss'
      ],
      followUpTriggers: [
        'Could you explain that further?',
        'What was your specific role?',
        'How did you handle the challenges?',
        'What metrics did you use?'
      ],
      concludingPhrases: [
        'That\'s helpful context.',
        'I see. Let\'s move on.',
        'Understood. Next question.'
      ]
    },
    reactionPatterns: {
      positive: ['That\'s a strong answer.', 'Good insight.', 'I appreciate that detail.'],
      neutral: ['Interesting perspective.', 'I see.', 'Got it.'],
      negative: ['Let me dig deeper here.', 'Can you add more detail?', 'I\'d like to understand better.']
    }
  },

  [PERSONAS.FRIENDLY]: {
    name: 'Friendly Interviewer',
    description: 'Conversational, encouraging, focus on soft skills and culture fit',
    characteristics: {
      paceMultiplier: 0.85,          // Slightly slower, more natural
      pauseLength: 1500,             // 1.5s pause for thoughtfulness
      reactionDelay: 800,            // Longer reaction time
      followUpDepth: 'deep',         // Many follow-ups, building rapport
      warmth: 9,
      technicalFocus: 6,
      personalConnectivity: 9
    },
    voiceCharacteristics: {
      speed: 0.95,
      pitch: 1.05,
      tone: 'warm'
    },
    questionPatterns: {
      introPhrase: [
        'Tell me about a time when',
        'I\'d love to hear about',
        'Walk me through your experience with',
        'So what happened with'
      ],
      followUpTriggers: [
        'That sounds interesting! What was that like?',
        'How did that make you feel?',
        'What was the most challenging part?',
        'Did you learn anything from that?'
      ],
      concludingPhrases: [
        'That\'s a great story!',
        'Really appreciate you sharing that.',
        'That tells me a lot about you.'
      ]
    },
    reactionPatterns: {
      positive: ['I really like your approach!', 'That shows great initiative!', 'I can see the impact there.'],
      neutral: ['That makes sense.', 'Interesting way to think about it.', 'Thanks for that perspective.'],
      negative: ['What would you do differently?', 'Challenging situation! How did you navigate it?', 'That\'s a learning opportunity.']
    }
  },

  [PERSONAS.INTENSE]: {
    name: 'Intense Interviewer',
    description: 'Demanding, critical, probes for depth and edge cases',
    characteristics: {
      paceMultiplier: 1.2,           // Faster pace
      pauseLength: 500,              // Brief pause, keeps pressure
      reactionDelay: 300,            // Quick reactions
      followUpDepth: 'extreme',      // Many challenging follow-ups
      warmth: 3,
      technicalFocus: 10,
      personalConnectivity: 2
    },
    voiceCharacteristics: {
      speed: 1.15,
      pitch: 0.95,
      tone: 'firm'
    },
    questionPatterns: {
      introPhrase: [
        'Let\'s dig into',
        'I want to understand exactly how you',
        'Walk me through your exact approach to',
        'Here\'s a challenging scenario'
      ],
      followUpTriggers: [
        'What if that approach failed?',
        'What\'s the worst case scenario?',
        'Why didn\'t you choose X instead?',
        'What would have happened if constraints changed?'
      ],
      concludingPhrases: [
        'Interesting. But did you consider edge cases?',
        'That\'s the happy path. What about failures?',
        'Let\'s stress test that approach.'
      ]
    },
    reactionPatterns: {
      positive: ['Solid technical understanding.', 'You thought through the edge cases.', 'That\'s thorough.'],
      neutral: ['That\'s one perspective.', 'Okay, but what about...', 'I see where you\'re going.'],
      negative: ['I don\'t think that scales.', 'Have you considered failure modes?', 'That seems incomplete.']
    }
  },

  [PERSONAS.ACADEMIC]: {
    name: 'Academic Interviewer',
    description: 'Theoretical, asks about concepts and trade-offs, Socratic method',
    characteristics: {
      paceMultiplier: 0.9,           // Thoughtful pace
      pauseLength: 2000,             // 2s pause for reflection
      reactionDelay: 1200,           // Takes time to absorb
      followUpDepth: 'philosophical', // Questions the fundamentals
      warmth: 7,
      technicalFocus: 8,
      personalConnectivity: 6
    },
    voiceCharacteristics: {
      speed: 0.9,
      pitch: 0.98,
      tone: 'contemplative'
    },
    questionPatterns: {
      introPhrase: [
        'From a systems perspective, how would you',
        'What are the trade-offs in',
        'Let\'s examine the fundamentals of',
        'How would you design a solution for'
      ],
      followUpTriggers: [
        'What principles guided that decision?',
        'How do these trade-offs compare to alternatives?',
        'What\'s the theoretical underpinning?',
        'How would this scale mathematically?'
      ],
      concludingPhrases: [
        'That\'s an interesting theoretical perspective.',
        'I see the logic in that approach.',
        'That aligns with established principles.'
      ]
    },
    reactionPatterns: {
      positive: ['That\'s theoretically sound.', 'Excellent systems thinking.', 'I appreciate that nuanced view.'],
      neutral: ['An interesting hypothesis.', 'That\'s one framework for thinking about it.', 'Reasonable approach.'],
      negative: ['I\'d challenge that assumption.', 'What\'s the theoretical basis for that?', 'Let me play devil\'s advocate.']
    }
  },

  [PERSONAS.BEHAVIORAL]: {
    name: 'Behavioral Interviewer',
    description: 'Focuses on soft skills, teamwork, growth mindset, and conflict resolution',
    characteristics: {
      paceMultiplier: 0.95,
      pauseLength: 1800,             // 1.8s pause
      reactionDelay: 1000,           // Empathetic response time
      followUpDepth: 'emotional',    // Probes feelings and learning
      warmth: 8,
      technicalFocus: 4,
      personalConnectivity: 10
    },
    voiceCharacteristics: {
      speed: 0.92,
      pitch: 1.02,
      tone: 'empathetic'
    },
    questionPatterns: {
      introPhrase: [
        'Tell me about a time you had to work with',
        'Describe a situation where you faced',
        'Can you share an example of when you',
        'Walk me through a moment when you had to'
      ],
      followUpTriggers: [
        'How did that make you feel?',
        'What did you learn from that experience?',
        'How did you handle the emotions?',
        'What would you do differently today?'
      ],
      concludingPhrases: [
        'I can see how that shaped your approach.',
        'That shows real growth and self-awareness.',
        'I appreciate your reflection on that.'
      ]
    },
    reactionPatterns: {
      positive: ['That shows great emotional intelligence.', 'I respect your accountability.', 'That\'s mature self-reflection.'],
      neutral: ['I understand your perspective.', 'That makes sense given the circumstances.', 'Thanks for sharing that.'],
      negative: ['What would you handle differently now?', 'How did you grow from that?', 'What did you learn about yourself?']
    }
  }
};

/**
 * Get persona configuration by type
 */
export function getPersona(personaType) {
  return PERSONA_CONFIGS[personaType] || PERSONA_CONFIGS[PERSONAS.PROFESSIONAL];
}

/**
 * Get all available personas
 */
export function getAllPersonas() {
  return Object.values(PERSONAS);
}

/**
 * Select persona based on question type or category
 */
export function selectPersonaForQuestion(question, category = null) {
  const questionLower = question.toLowerCase();

  // Behavioral questions → Behavioral persona
  if (/tell me about|describe|experience|conflict|failure|team|worked|challenge/.test(questionLower)) {
    return PERSONAS.BEHAVIORAL;
  }

  // System design → Academic persona
  if (/design|architecture|trade-off|scalable|system/.test(questionLower)) {
    return PERSONAS.ACADEMIC;
  }

  // Algorithm/technical → Intense persona
  if (/algorithm|complexity|optimize|edge case|corner case/.test(questionLower)) {
    return PERSONAS.INTENSE;
  }

  // General technical → Professional persona
  if (/technical|how would you|implement|code/.test(questionLower)) {
    return PERSONAS.PROFESSIONAL;
  }

  // Default: Professional
  return PERSONAS.PROFESSIONAL;
}

/**
 * Get reaction based on answer quality and persona
 */
export function getReaction(personaType, qualityScore, gapCount = 0) {
  const persona = getPersona(personaType);
  const reactions = persona.reactionPatterns;

  if (qualityScore >= 75) {
    return reactions.positive[Math.floor(Math.random() * reactions.positive.length)];
  } else if (qualityScore >= 50) {
    return reactions.neutral[Math.floor(Math.random() * reactions.neutral.length)];
  } else {
    return reactions.negative[Math.floor(Math.random() * reactions.negative.length)];
  }
}

/**
 * Get intro phrase for next question
 */
export function getIntroPhrase(personaType) {
  const persona = getPersona(personaType);
  const phrases = persona.questionPatterns.introPhrase;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Get follow-up trigger phrase
 */
export function getFollowUpPhrase(personaType) {
  const persona = getPersona(personaType);
  const phrases = persona.questionPatterns.followUpTriggers;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Get concluding phrase
 */
export function getConcludingPhrase(personaType) {
  const persona = getPersona(personaType);
  const phrases = persona.questionPatterns.concludingPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Calculate pacing adjustment based on persona
 */
export function calculatePaceMultiplier(personaType, baseDelay = 1000) {
  const persona = getPersona(personaType);
  // For pacing: multiplier > 1 means slower (more time), < 1 means faster (less time)
  // So we invert the paceMultiplier: intense (1.2 paceMultiplier) = 1000/1.2 = 833ms (faster)
  return baseDelay / persona.characteristics.paceMultiplier;
}

/**
 * Export persona constants
 */
export default {
  PERSONAS,
  PERSONA_CONFIGS,
  getPersona,
  getAllPersonas,
  selectPersonaForQuestion,
  getReaction,
  getIntroPhrase,
  getFollowUpPhrase,
  getConcludingPhrase,
  calculatePaceMultiplier
};
