/**
 * Follow-Up Context Builder
 * Analyzes user answers and builds context for follow-up questions
 * Extracts concepts, identifies gaps, and builds prompts
 */

/**
 * Extract key concepts from user answer
 */
export function extractConcepts(answer, maxConcepts = 10) {
  if (!answer || typeof answer !== 'string') return [];
  
  // Normalize text
  const text = answer
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim();
  
  // Stop words to filter
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
    'the', 'to', 'was', 'will', 'with', 'you', 'your', 'this', 'these',
    'would', 'could', 'should', 'might', 'can', 'may', 'must', 'i', 'we',
    'they', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'there'
  ]);
  
  // Split into words and filter
  const words = text
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, maxConcepts);
  
  return words;
}

/**
 * Identify gaps in the answer
 * Returns areas where more explanation is needed
 */
export function identifyGaps(answer, question, answerLength = null) {
  if (!answer || typeof answer !== 'string') {
    return {
      gaps: ['incomplete-answer'],
      confidence: 'high'
    };
  }
  
  const actualLength = answerLength || answer.length;
  const gaps = [];
  const lowerAnswer = answer.toLowerCase();
  
  // Gap: Very short answer (likely incomplete)
  if (actualLength < 50) {
    gaps.push('too-brief');
  }
  
  // Gap: No explanation of reasoning
  if (!lowerAnswer.match(/because|reason|since|due to|caused by|result of/)) {
    gaps.push('missing-reasoning');
  }
  
  // Gap: No examples or evidence
  if (!lowerAnswer.match(/example|for instance|like|such as|specifically|case/)) {
    gaps.push('no-examples');
  }
  
  // Gap: No mention of alternatives or considerations
  if (!lowerAnswer.match(/alternatively|instead|however|but|consider|tradeoff/)) {
    gaps.push('no-alternatives');
  }
  
  // Gap: No mention of edge cases or limitations
  if (!lowerAnswer.match(/edge case|exception|limitation|special|corner|note that/)) {
    gaps.push('no-edge-cases');
  }
  
  // Gap: No mention of complexity/performance (if technical)
  if (question && question.toLowerCase().match(/algorithm|data structure|performance|complexity|time|space/)) {
    if (!lowerAnswer.match(/o\(|complexity|time|space|efficient|optimize|scale/)) {
      gaps.push('missing-complexity-analysis');
    }
  }
  
  return {
    gaps: gaps.length > 0 ? gaps : ['unknown'],
    gapCount: gaps.length,
    answerLength: actualLength,
    hasReasoning: lowerAnswer.match(/because|reason|since|due to/) !== null,
    hasExamples: lowerAnswer.match(/example|for instance/) !== null,
    hasAlternatives: lowerAnswer.match(/alternatively|instead|however/) !== null
  };
}

/**
 * Detect answer quality indicators
 */
export function analyzeQuality(answer) {
  if (!answer || typeof answer !== 'string') {
    return {
      quality: 'very-poor',
      score: 0,
      indicators: ['no-answer']
    };
  }
  
  const indicators = [];
  const length = answer.length;
  
  // Length check
  if (length < 50) {
    indicators.push('very-short');
  } else if (length < 150) {
    indicators.push('short');
  } else if (length > 1000) {
    indicators.push('verbose');
  } else {
    indicators.push('appropriate-length');
  }
  
  // Structure check
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    indicators.push('well-structured');
  }
  
  // Technical depth
  const lower = answer.toLowerCase();
  const technicalKeywords = (lower.match(/algorithm|complexity|data|structure|optimize|cache|distributed|transaction|consistency/g) || []).length;
  if (technicalKeywords > 3) {
    indicators.push('technical-depth');
  }
  
  // Professional language
  if (lower.match(/specifically|furthermore|however|regarding|approach/)) {
    indicators.push('professional-tone');
  }
  
  // Confidence indicators
  if (lower.match(/confident|clear|certain|definitely/)) {
    indicators.push('confident');
  } else if (lower.match(/uncertain|might|perhaps|could be/)) {
    indicators.push('uncertain');
  }
  
  // Calculate quality score
  let score = 50;  // Base score
  score += indicators.includes('appropriate-length') ? 15 : 0;
  score += indicators.includes('well-structured') ? 10 : 0;
  score += indicators.includes('technical-depth') ? 15 : 0;
  score += indicators.includes('professional-tone') ? 5 : 0;
  score -= indicators.includes('very-short') ? 20 : 0;
  score -= indicators.includes('verbose') ? 10 : 0;
  
  let quality = 'poor';
  if (score < 30) quality = 'very-poor';
  else if (score < 50) quality = 'poor';
  else if (score < 70) quality = 'fair';
  else if (score < 85) quality = 'good';
  else quality = 'excellent';
  
  return {
    quality,
    score: Math.min(100, Math.max(0, score)),
    indicators,
    length,
    sentenceCount: sentences.length
  };
}

/**
 * Build follow-up context from question and answer
 */
export function buildFollowUpContext(question, answer, options = {}) {
  if (!question || !answer) {
    return {
      error: 'question and answer required',
      context: null
    };
  }
  
  const concepts = extractConcepts(answer);
  const gaps = identifyGaps(answer, question);
  const quality = analyzeQuality(answer);
  
  // Determine follow-up strategy
  let strategy = 'clarification';  // Default
  
  if (gaps.gapCount > 2) {
    strategy = 'depth';  // Need more depth
  } else if (quality.score < 50) {
    strategy = 'rephrase';  // Ask them to explain better
  } else if (quality.indicators.includes('uncertain')) {
    strategy = 'confidence';  // Push for more certainty
  } else if (gaps.gaps.includes('no-examples')) {
    strategy = 'examples';  // Ask for examples
  }
  
  const context = {
    originalQuestion: question.substring(0, 200),
    answerQuality: quality,
    identifiedGaps: gaps,
    keyTopics: concepts.slice(0, 5),
    suggestedStrategy: strategy,
    followUpFocus: determineFocus(gaps, quality),
    answerMetrics: {
      length: answer.length,
      wordCount: answer.split(/\s+/).length,
      hasExamples: gaps.hasExamples,
      hasReasoning: gaps.hasReasoning,
      hasAlternatives: gaps.hasAlternatives
    }
  };
  
  return { success: true, context };
}

/**
 * Determine where to focus follow-up
 */
function determineFocus(gaps, quality) {
  const focus = [];
  
  if (gaps.gaps.includes('too-brief')) {
    focus.push('expand-answer');
  }
  
  if (gaps.gaps.includes('missing-reasoning')) {
    focus.push('explain-why');
  }
  
  if (gaps.gaps.includes('no-examples')) {
    focus.push('provide-examples');
  }
  
  if (gaps.gaps.includes('no-alternatives')) {
    focus.push('discuss-tradeoffs');
  }
  
  if (gaps.gaps.includes('missing-complexity-analysis')) {
    focus.push('analyze-complexity');
  }
  
  if (quality.score < 50) {
    focus.push('improve-clarity');
  }
  
  return focus.length > 0 ? focus : ['general-probe'];
}

/**
 * Generate follow-up prompt based on context
 */
export function generateFollowUpPrompt(context, difficulty = 'medium') {
  if (!context || !context.context) {
    return {
      error: 'context required',
      prompt: null
    };
  }
  
  const ctx = context.context;
  const strategy = ctx.suggestedStrategy;
  
  let prompt = '';
  
  switch (strategy) {
    case 'depth':
      prompt = `You mentioned "${ctx.keyTopics[0] || 'this'}". Can you dive deeper into how this works and why it matters?`;
      break;
      
    case 'examples':
      if (ctx.followUpFocus.includes('provide-examples')) {
        prompt = `Good start! Now give me a specific example of how you would implement this. Walk me through the steps.`;
      } else {
        prompt = `That makes sense. Can you give me a concrete example from your experience?`;
      }
      break;
      
    case 'rephrase':
      prompt = `Let me push back a bit. Can you explain this in a different way? What's the core idea here?`;
      break;
      
    case 'confidence':
      prompt = `You seem uncertain. Take a moment and tell me again - what's your confident answer to this problem?`;
      break;
      
    case 'clarification':
    default:
      if (ctx.followUpFocus.includes('explain-why')) {
        prompt = `Good. But WHY would you choose that approach? What are the trade-offs?`;
      } else if (ctx.followUpFocus.includes('analyze-complexity')) {
        prompt = `Now, what's the time and space complexity of your solution? Can you optimize it?`;
      } else {
        prompt = `Interesting. Can you elaborate on that? What else should I know?`;
      }
  }
  
  // Adjust for difficulty
  if (difficulty === 'hard') {
    prompt += ` Also, consider edge cases and potential bottlenecks.`;
  } else if (difficulty === 'easy') {
    prompt = prompt.replace(/complexity|optimize|tradeoffs/gi, (m) => {
      const easy = {
        'complexity': 'efficiency',
        'optimize': 'improve',
        'tradeoffs': 'pros and cons'
      };
      return easy[m.toLowerCase()] || m;
    });
  }
  
  return {
    success: true,
    prompt,
    strategy,
    difficulty
  };
}

/**
 * Get follow-up recommendation with reasoning
 */
export function getFollowUpRecommendation(question, answer, difficulty = 'medium') {
  const contextResult = buildFollowUpContext(question, answer);
  
  if (!contextResult.success) {
    return {
      canFollowUp: false,
      reason: contextResult.error
    };
  }
  
  const context = contextResult.context;
  const qualityScore = context.answerQuality.score;
  
  // Determine if follow-up is warranted
  let shouldFollowUp = true;
  let followUpCount = 1;  // How many follow-ups to ask
  
  if (qualityScore > 85) {
    shouldFollowUp = false;  // Answer is already excellent
  } else if (qualityScore > 70) {
    followUpCount = 1;
  } else if (qualityScore > 50) {
    followUpCount = 2;
  } else {
    followUpCount = 1;  // Ask to rephrase
  }
  
  const promptResult = generateFollowUpPrompt(contextResult, difficulty);
  
  return {
    canFollowUp: shouldFollowUp,
    followUpCount: shouldFollowUp ? followUpCount : 0,
    prompt: shouldFollowUp ? promptResult.prompt : null,
    reasoning: {
      answerQuality: context.answerQuality.quality,
      identifiedGaps: context.identifiedGaps.gaps.slice(0, 3),
      suggestedFocus: context.followUpFocus
    }
  };
}

export default {
  extractConcepts,
  identifyGaps,
  analyzeQuality,
  buildFollowUpContext,
  generateFollowUpPrompt,
  getFollowUpRecommendation
};
