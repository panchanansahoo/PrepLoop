/**
 * Structured Feedback Generator
 * Converts raw scoring data into granular, user-friendly feedback with:
 * - Component breakdown (communication, decomposition, technical)
 * - Specific examples extracted from user response
 * - Actionable next steps
 * - User-facing summary (jargon-free)
 */

// ─── Feedback Templates by Interview Type ────────────────────────────────

const COMMUNICATION_PHRASES = {
  strong: {
    dsa: 'Explained your approach clearly with concrete examples',
    behavioral: 'Told a compelling, structured story with measurable impact',
    hr: 'Communicated thoughtfully and showed genuine interest',
    system_design: 'Articulated complex architecture in accessible terms',
  },
  medium: {
    dsa: 'Explained most steps, but some details were unclear',
    behavioral: 'Good narrative structure, but impact metrics were vague',
    hr: 'Communicated well overall, with minor clarity gaps',
    system_design: 'Described the system, but some design choices needed clarification',
  },
  weak: {
    dsa: 'Had difficulty explaining your logic clearly',
    behavioral: 'Story lacked structure or clear outcomes',
    hr: 'Communication was unclear or incomplete',
    system_design: 'System design rationale was hard to follow',
  },
};

const DECOMPOSITION_PHRASES = {
  strong: {
    dsa: 'Broke down the problem methodically before coding',
    behavioral: 'Showed strong problem-solving and decision-making',
    hr: 'Demonstrated thoughtful approach to challenges',
    system_design: 'Systematically gathered requirements and designed layers',
  },
  medium: {
    dsa: 'Attempted problem breakdown, but missed some edge cases',
    behavioral: 'Solved the problem, though the approach had gaps',
    hr: 'Addressed the challenge adequately with minor oversights',
    system_design: 'Covered main design elements, some tradeoffs missed',
  },
  weak: {
    dsa: 'Jumped to coding without full problem analysis',
    behavioral: 'Problem-solving approach was unclear or incomplete',
    hr: 'Struggled with structured problem-solving',
    system_design: 'System design lacked systematic breakdown',
  },
};

const TECHNICAL_PHRASES = {
  strong: {
    dsa: 'Code was correct, efficient, and handled edge cases',
    behavioral: 'Technical decisions showed depth of experience',
    hr: 'Demonstrated strong technical judgment',
    system_design: 'Architecture was scalable, reliable, and maintainable',
  },
  medium: {
    dsa: 'Code worked but had efficiency or readability issues',
    behavioral: 'Technical knowledge was generally solid',
    hr: 'Technical foundation was sound with minor gaps',
    system_design: 'Architecture covered core needs with some scalability concerns',
  },
  weak: {
    dsa: 'Code had bugs or significant efficiency problems',
    behavioral: 'Technical approach or knowledge was insufficient',
    hr: 'Technical areas needed more depth',
    system_design: 'Architecture had critical gaps or scaling issues',
  },
};

function getQualityLevel(score) {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'medium';
  return 'weak';
}

/**
 * Extract example phrases from user response
 * Looks for specific patterns and extracts quotes
 */
function extractExamples(response = '', metrics = {}, interviewType = 'dsa') {
  const responseText = String(response || '').toLowerCase();
  const examples = [];

  // Communication examples
  if (responseText.includes('approach') || responseText.includes('algorithm')) {
    const match = response.match(/(?:approach|algorithm)[^.!?]*[.!?]/i);
    if (match) examples.push({ category: 'communication', example: match[0].trim().substring(0, 120) });
  }

  // Decomposition examples (e.g., "first I would", "the key insight")
  if (responseText.includes('first') || responseText.includes('key insight') || responseText.includes('edge case')) {
    const match = response.match(/(?:first|key insight|edge case)[^.!?]*[.!?]/i);
    if (match) examples.push({ category: 'decomposition', example: match[0].trim().substring(0, 120) });
  }

  // Technical examples (code, complexity, specific implementation details)
  if (responseText.includes('time complexity') || responseText.includes('o(') || responseText.includes('loop') || responseText.includes('sort')) {
    const match = response.match(/(?:time complexity|o\([\w\s+*]*\)|loop|sort)[^.!?]*[.!?]/i);
    if (match) examples.push({ category: 'technical', example: match[0].trim().substring(0, 120) });
  }

  return examples.length > 0 ? examples : [];
}

/**
 * Generate actionable next steps based on weak areas
 */
function generateNextSteps(communicationScore, decompositionScore, technicalScore, interviewType = 'dsa') {
  const steps = [];

  // Communication improvements
  if (communicationScore < 70) {
    if (interviewType === 'behavioral') {
      steps.push({
        area: 'Communication',
        action: 'Practice STAR structure (Situation, Task, Action, Result) to make impact measurable',
        priority: 'high',
      });
    } else if (interviewType === 'system_design') {
      steps.push({
        area: 'Communication',
        action: 'Use diagrams and walk through system flow step-by-step for clarity',
        priority: 'high',
      });
    } else {
      steps.push({
        area: 'Communication',
        action: 'Explain your thinking aloud before and after coding for better clarity',
        priority: 'high',
      });
    }
  }

  // Decomposition improvements
  if (decompositionScore < 70) {
    steps.push({
      area: 'Problem Solving',
      action: 'Spend 1-2 minutes understanding the problem fully before attempting a solution',
      priority: 'high',
    });

    if (interviewType === 'dsa') {
      steps.push({
        area: 'Problem Solving',
        action: 'List out edge cases explicitly (empty input, single element, duplicates, etc.)',
        priority: 'medium',
      });
    }
  }

  // Technical improvements
  if (technicalScore < 70) {
    if (interviewType === 'dsa') {
      steps.push({
        area: 'Technical Skills',
        action: 'Practice implementing solutions without bugs on first try (focus on correctness)',
        priority: 'high',
      });
      steps.push({
        area: 'Technical Skills',
        action: 'Study time/space complexity analysis—be able to explain tradeoffs',
        priority: 'medium',
      });
    } else if (interviewType === 'system_design') {
      steps.push({
        area: 'Technical Skills',
        action: 'Deepen knowledge of distributed systems: consistency, availability, scalability',
        priority: 'high',
      });
    }
  }

  return steps;
}

export class StructuredFeedbackService {
  /**
   * Generate structured feedback from scoring data
   * 
   * @param {object} scoringData - { communicationScore, decompositionScore, technicalScore, overallScore }
   * @param {string} userResponse - The full user response text
   * @param {object} metrics - Analysis metrics from LLM
   * @param {string} interviewType - Type of interview (dsa, behavioral, system_design, hr)
   * @returns {object} Structured feedback object
   */
  static generateStructuredFeedback(scoringData = {}, userResponse = '', metrics = {}, interviewType = 'dsa') {
    const communicationScore = Number(scoringData.communicationScore || 65);
    const decompositionScore = Number(scoringData.decompositionScore || 65);
    const technicalScore = Number(scoringData.technicalScore || 65);
    const overallScore = Number(scoringData.overallScore || 65);

    const normType = String(interviewType || 'dsa').toLowerCase();

    // Determine quality levels
    const commQuality = getQualityLevel(communicationScore);
    const decompQuality = getQualityLevel(decompositionScore);
    const techQuality = getQualityLevel(technicalScore);

    // Extract examples from response
    const examples = extractExamples(userResponse, metrics, normType);

    // Generate component feedback
    const componentFeedback = [
      {
        component: 'Communication',
        score: communicationScore,
        quality: commQuality,
        feedback: COMMUNICATION_PHRASES[commQuality]?.[normType] || COMMUNICATION_PHRASES[commQuality]?.dsa || 'Your communication could be improved',
        example: examples.find(e => e.category === 'communication')?.example || null,
      },
      {
        component: 'Problem Solving',
        score: decompositionScore,
        quality: decompQuality,
        feedback: DECOMPOSITION_PHRASES[decompQuality]?.[normType] || DECOMPOSITION_PHRASES[decompQuality]?.dsa || 'Your problem-solving approach could be more structured',
        example: examples.find(e => e.category === 'decomposition')?.example || null,
      },
      {
        component: 'Technical Depth',
        score: technicalScore,
        quality: techQuality,
        feedback: TECHNICAL_PHRASES[techQuality]?.[normType] || TECHNICAL_PHRASES[techQuality]?.dsa || 'Your technical execution needs improvement',
        example: examples.find(e => e.category === 'technical')?.example || null,
      },
    ];

    // Generate next steps
    const nextSteps = generateNextSteps(communicationScore, decompositionScore, technicalScore, normType);

    // User-facing summary (avoid jargon, be encouraging)
    const summary = this.generateUserSummary(
      overallScore,
      { communication: commQuality, decomposition: decompQuality, technical: techQuality },
      normType
    );

    return {
      overallScore: Number(overallScore.toFixed(1)),
      summary,
      components: componentFeedback,
      nextSteps,
      strengths: componentFeedback
        .filter(c => c.quality === 'strong')
        .map(c => c.component),
      areasForImprovement: componentFeedback
        .filter(c => c.quality === 'weak')
        .map(c => c.component),
      // Telemetry data
      metadata: {
        interviewType: normType,
        generatedAt: new Date().toISOString(),
        componentScores: {
          communication: communicationScore,
          decomposition: decompositionScore,
          technical: technicalScore,
        },
      },
    };
  }

  /**
   * Generate a brief, encouraging user-facing summary
   */
  static generateUserSummary(overallScore, qualities = {}, interviewType = 'dsa') {
    const { communication, decomposition, technical } = qualities;

    let performance = '';
    if (overallScore >= 85) {
      performance = 'Excellent performance. You demonstrated strong expertise.';
    } else if (overallScore >= 75) {
      performance = 'Good job! You showed solid skills with room for growth.';
    } else if (overallScore >= 65) {
      performance = 'You covered the basics well. With practice, you will improve significantly.';
    } else {
      performance = 'You have potential. Focus on the areas below to level up your interview readiness.';
    }

    // Add type-specific encouragement
    let typeHint = '';
    if (interviewType === 'behavioral') {
      typeHint = ' Practice telling structured stories to make your impact clear.';
    } else if (interviewType === 'system_design') {
      typeHint = ' Work on breaking down complex systems step by step.';
    } else if (interviewType === 'dsa') {
      typeHint = ' Solve more coding problems to build confidence.';
    }

    return `${performance}${typeHint}`;
  }

  /**
   * Compare two feedback results to show improvement
   * Useful for progress tracking across multiple attempts
   */
  static compareFeedback(previousFeedback = {}, currentFeedback = {}) {
    const prevScore = previousFeedback.overallScore || 0;
    const currScore = currentFeedback.overallScore || 0;
    const delta = currScore - prevScore;

    return {
      previousScore: prevScore,
      currentScore: currScore,
      improvement: Number(delta.toFixed(1)),
      improvementPercentage: prevScore > 0 ? Number(((delta / prevScore) * 100).toFixed(1)) : 0,
      comparisionSummary: delta > 0 
        ? `Great progress! You improved by ${delta.toFixed(1)} points.`
        : delta < 0
          ? `Score declined slightly. Review the feedback and try again.`
          : 'Similar performance. Keep practicing!',
      componentComparison: {
        communication: {
          previous: previousFeedback.components?.[0]?.score || 0,
          current: currentFeedback.components?.[0]?.score || 0,
        },
        problemSolving: {
          previous: previousFeedback.components?.[1]?.score || 0,
          current: currentFeedback.components?.[1]?.score || 0,
        },
        technicalDepth: {
          previous: previousFeedback.components?.[2]?.score || 0,
          current: currentFeedback.components?.[2]?.score || 0,
        },
      },
    };
  }
}

export default StructuredFeedbackService;
