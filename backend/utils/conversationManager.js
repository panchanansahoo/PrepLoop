/**
 * Conversation Manager
 * Controls natural pacing, pauses, and reactions during interviews
 * Makes interactions feel like real human conversations
 */

import interviewerPersonality from './interviewerPersonality.js';

/**
 * Conversation Context
 */
class ConversationManager {
  constructor(sessionId, personaType = 'professional') {
    this.sessionId = sessionId;
    this.personaType = personaType;
    this.persona = interviewerPersonality.getPersona(personaType);
    this.conversationHistory = [];
    this.turnsCount = 0;
    this.lastAnswerQuality = null;
    this.momentumScore = 0;  // Tracks interview flow (-10 to +10)
  }

  /**
   * Calculate pause length based on context
   */
  calculatePauseLength(context = {}) {
    const {
      isFirstQuestion = false,
      answerLength = 0,
      answerQuality = 75,
      isFollowUp = false
    } = context;

    let baseLength = this.persona.characteristics.pauseLength;

    // Adjust based on answer length
    if (answerLength > 500) {
      baseLength += 300;  // Need more time to absorb longer answers
    } else if (answerLength < 50) {
      baseLength -= 200;  // Shorter answers need less time
    }

    // Adjust based on quality
    if (answerQuality < 50) {
      baseLength += 200;  // Pause longer if answer needs follow-up
    }

    // First question gets more pause
    if (isFirstQuestion) {
      baseLength += 500;
    }

    // Follow-ups are quicker
    if (isFollowUp) {
      baseLength *= 0.7;
    }

    return Math.max(300, Math.min(3000, baseLength));  // Cap between 300ms and 3s
  }

  /**
   * Calculate think-time for thinking phrases
   */
  calculateThinkTime(context = {}) {
    const { complexity = 'medium', personaType = this.personaType } = context;
    const persona = interviewerPersonality.getPersona(personaType);

    // Base think time based on persona warmth
    let baseThink = (10 - persona.characteristics.warmth) * 200;  // More intense = more think time

    // Adjust for complexity
    if (complexity === 'high') {
      baseThink += 800;
    } else if (complexity === 'low') {
      baseThink -= 400;
    }

    return Math.max(200, Math.min(2000, baseThink));
  }

  /**
   * Generate natural thinking phrases
   */
  generateThinkingPhrase(personaType = this.personaType) {
    const thinkingPhrases = {
      professional: [
        'Let me think about that...',
        'Interesting point. Let me consider...',
        'That requires some analysis...'
      ],
      friendly: [
        'Hmm, that\'s interesting!',
        'Let me think about how to approach that...',
        'Interesting perspective. Let me consider...'
      ],
      intense: [
        'Interesting. Let me dig into that...',
        'That needs examination...',
        'Let me think through the implications...'
      ],
      academic: [
        'That\'s an interesting approach. Let me consider the theoretical implications...',
        'Fascinating. Let me think through this systematically...',
        'That raises some interesting questions...'
      ],
      behavioral: [
        'I appreciate that. Let me think about what that tells me...',
        'That\'s valuable context. Let me reflect on that...',
        'That\'s insightful. Let me consider...'
      ]
    };

    const phrases = thinkingPhrases[personaType] || thinkingPhrases.professional;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Generate reaction to answer
   */
  generateReaction(qualityScore, gapCount = 0) {
    const reaction = interviewerPersonality.getReaction(this.personaType, qualityScore, gapCount);
    
    return {
      text: reaction,
      delay: this.persona.characteristics.reactionDelay,
      type: qualityScore >= 75 ? 'positive' : qualityScore >= 50 ? 'neutral' : 'negative'
    };
  }

  /**
   * Generate transition phrase to next question
   */
  generateTransition(isFollowUp = false) {
    if (isFollowUp) {
      return interviewerPersonality.getFollowUpPhrase(this.personaType);
    } else {
      return interviewerPersonality.getIntroPhrase(this.personaType);
    }
  }

  /**
   * Add turn to conversation history
   */
  recordTurn(turn) {
    const {
      question,
      answer,
      answerQuality,
      answerLength = answer?.length || 0,
      isFollowUp = false,
      personaReaction = null
    } = turn;

    this.turnsCount++;
    this.lastAnswerQuality = answerQuality;

    // Update momentum based on answer quality trend
    if (this.conversationHistory.length > 0) {
      const prevQuality = this.conversationHistory[this.conversationHistory.length - 1].answerQuality || 50;
      const qualityChange = answerQuality - prevQuality;
      
      if (qualityChange > 10) {
        this.momentumScore = Math.min(10, this.momentumScore + 2);  // Building momentum
      } else if (qualityChange < -10) {
        this.momentumScore = Math.max(-10, this.momentumScore - 2);  // Losing momentum
      }
    }

    this.conversationHistory.push({
      turnNumber: this.turnsCount,
      question,
      answer,
      answerQuality,
      answerLength,
      isFollowUp,
      personaReaction,
      timestamp: Date.now(),
      momentumScore: this.momentumScore
    });
  }

  /**
   * Get conversation natural flow metadata
   */
  getFlowMetadata() {
    return {
      turnsCount: this.turnsCount,
      momentumScore: this.momentumScore,
      lastAnswerQuality: this.lastAnswerQuality,
      persona: this.personaType,
      conversationPhase: this.getConversationPhase(),
      paceAdjustment: this.persona.characteristics.paceMultiplier,
      warmthLevel: this.persona.characteristics.warmth
    };
  }

  /**
   * Determine which phase of conversation we're in
   */
  getConversationPhase() {
    if (this.turnsCount === 0) return 'opening';
    if (this.turnsCount < 3) return 'warmup';
    if (this.turnsCount < 8) return 'main';
    if (this.turnsCount < 12) return 'deepening';
    return 'closing';
  }

  /**
   * Calculate cumulative pause needed based on momentum
   */
  getMomentumAdjustedPause(basePause) {
    // Positive momentum = less pause (keep energy up)
    // Negative momentum = more pause (reset energy)
    const adjustment = (this.momentumScore / 10) * -200;  // -200 to +200
    return Math.max(300, basePause + adjustment);
  }

  /**
   * Generate complete response package
   */
  generateResponse(question, answerQuality, context = {}) {
    const {
      answerLength = 0,
      includeReaction = true,
      isFollowUp = false,
      gapCount = 0
    } = context;

    // Calculate timing
    const pauseLength = this.calculatePauseLength({
      answerLength,
      answerQuality,
      isFollowUp
    });

    const thinkTime = this.calculateThinkTime({
      complexity: isFollowUp ? 'low' : 'medium'
    });

    const adjustedPause = this.getMomentumAdjustedPause(pauseLength);

    // Generate components
    const response = {
      thinking: this.generateThinkingPhrase(),
      thinkingDelay: thinkTime,
      pause: adjustedPause
    };

    // Add reaction if quality warrants it
    if (includeReaction && this.turnsCount > 0) {
      response.reaction = this.generateReaction(answerQuality, gapCount);
    }

    // Add transition to next
    response.transition = this.generateTransition(isFollowUp);
    response.transitionDelay = 300;

    return response;
  }

  /**
   * Get conversation summary for debugging
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      personaType: this.personaType,
      turnsCount: this.turnsCount,
      momentumScore: this.momentumScore,
      averageQuality: this.conversationHistory.length > 0
        ? Math.round(
            this.conversationHistory.reduce((sum, turn) => sum + (turn.answerQuality || 0), 0) /
            this.conversationHistory.length
          )
        : 0,
      phase: this.getConversationPhase(),
      lastTurns: this.conversationHistory.slice(-3).map(turn => ({
        question: turn.question?.substring(0, 50),
        quality: turn.answerQuality,
        follow: turn.isFollowUp
      }))
    };
  }

  /**
   * Reset conversation for new interview
   */
  reset() {
    this.conversationHistory = [];
    this.turnsCount = 0;
    this.momentumScore = 0;
    this.lastAnswerQuality = null;
  }
}

/**
 * Calculate natural delay between speaker segments
 */
export function calculateNaturalDelay(context = {}) {
  const {
    previousAction = 'question',  // 'question', 'answer', 'thinking', 'reaction'
    currentAction = 'thinking',
    personaWarmth = 6,            // 0-10 scale
    momentumScore = 0             // -10 to +10
  } = context;

  // Base delays between actions
  const transitionDelays = {
    'question-thinking': 300,
    'thinking-reaction': 200,
    'reaction-answer': 400,
    'answer-pause': 800,
    'pause-transition': 300,
    'transition-next-question': 500
  };

  const key = `${previousAction}-${currentAction}`;
  let delay = transitionDelays[key] || 500;

  // Adjust for warmth (more warm = faster transitions)
  delay *= (1 - (personaWarmth - 5) * 0.05);  // ±25% adjustment

  // Adjust for momentum (positive = faster, negative = slower)
  delay *= (1 - (momentumScore / 10) * 0.1);  // ±10% adjustment

  return Math.max(100, Math.min(2000, Math.round(delay)));
}

export default ConversationManager;
