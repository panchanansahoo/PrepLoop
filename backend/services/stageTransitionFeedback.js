/**
 * Stage Transition Feedback Service
 *
 * Provides guided, micro-feedback between interview stages.
 * Keeps users informed of progress while providing encouragement and guidance.
 *
 * Features:
 * - Stage-to-stage summaries (performance, strength areas)
 * - Explicit "Ready to proceed?" checkpoints
 * - Progress indicators (X/6 stages complete)
 * - Performance warnings (don't advance if scoring low)
 * - Contextual guidance for next stage
 */

export class StageTransitionFeedback {
  constructor() {
    // Stage labels and descriptions
    this.stageMetadata = {
      intake: {
        ordinal: 1,
        label: 'Intake & Setup',
        description: 'Introduction and problem clarification',
        duration_minutes: 1,
      },
      warmup: {
        ordinal: 2,
        label: 'Warmup',
        description: 'Build confidence with easier questions',
        duration_minutes: 2,
      },
      technical: {
        ordinal: 3,
        label: 'Core Round',
        description: 'Deep technical problem-solving',
        duration_minutes: 3,
      },
      followup: {
        ordinal: 4,
        label: 'Follow-up Probing',
        description: 'Clarify thinking and explore edge cases',
        duration_minutes: 2,
      },
      challenge: {
        ordinal: 5,
        label: 'Challenge Round',
        description: 'Advanced scenarios and pressure testing',
        duration_minutes: 2,
      },
      feedback: {
        ordinal: 6,
        label: 'Feedback & Wrap-up',
        description: 'Performance summary and improvement guidance',
        duration_minutes: 1,
      },
    };
  }

  /**
   * Generate stage completion summary
   * @param {Object} options
   *   - currentStage: string ('intake', 'warmup', etc.)
   *   - questionsAnswered: number
   *   - scoresInStage: array of scores [60, 75, 85]
   *   - timeSpentSeconds: number
   *   - strengthAreas: array of strings (e.g., ['logic', 'clarity'])
   *   - weekAreas: array of strings (e.g., ['edge cases'])
   * @returns {Object} summary object
   */
  generateStageSummary(options = {}) {
    const {
      currentStage = 'intake',
      questionsAnswered = 0,
      scoresInStage = [],
      timeSpentSeconds = 0,
      strengthAreas = [],
      weakAreas = [],
    } = options;

    const metadata = this.stageMetadata[currentStage] || { label: 'Unknown Stage' };

    // Calculate statistics
    const avgScore = scoresInStage.length > 0
      ? Math.round(scoresInStage.reduce((a, b) => a + b, 0) / scoresInStage.length)
      : 0;

    const minScore = scoresInStage.length > 0 ? Math.min(...scoresInStage) : 0;
    const maxScore = scoresInStage.length > 0 ? Math.max(...scoresInStage) : 0;

    // Performance assessment
    let performanceLevel = 'needs improvement';
    if (avgScore >= 85) performanceLevel = 'excellent';
    else if (avgScore >= 70) performanceLevel = 'good';
    else if (avgScore >= 55) performanceLevel = 'fair';

    // Time assessment
    const timeMinutes = Math.round(timeSpentSeconds / 60);
    const suggestedTime = metadata.duration_minutes || 2;
    let paceAssessment = 'good pace';
    if (timeMinutes <= suggestedTime * 0.5) paceAssessment = 'rushed';
    else if (timeMinutes >= suggestedTime * 2) paceAssessment = 'taking your time';

    return {
      stage: currentStage,
      stageLabel: metadata.label,
      questionsAnswered,
      averageScore: avgScore,
      scoreRange: { min: minScore, max: maxScore },
      performanceLevel,
      timeSpentMinutes: timeMinutes,
      suggestedTimeMinutes: suggestedTime,
      paceAssessment,
      strengthAreas,
      weakAreas,
      completionSummary: this._buildCompletionSummary(
        currentStage,
        avgScore,
        timeMinutes,
        strengthAreas,
        weakAreas
      ),
    };
  }

  /**
   * Build narrative summary of stage performance
   * @private
   */
  _buildCompletionSummary(stage, avgScore, timeMin, strengths, weaknesses) {
    const parts = [];

    // Opening
    parts.push(`Great job completing the ${this.stageMetadata[stage]?.label || 'stage'}!`);

    // Performance
    if (avgScore >= 80) {
      parts.push(`You scored ${avgScore}% on average - excellent work.`);
    } else if (avgScore >= 60) {
      parts.push(`You scored ${avgScore}% on average - solid performance.`);
    } else {
      parts.push(`You scored ${avgScore}% on average - keep practicing these concepts.`);
    }

    // Strengths
    if (strengths.length > 0) {
      parts.push(`Strengths: ${strengths.join(', ')}.`);
    }

    // Weaknesses
    if (weaknesses.length > 0) {
      parts.push(`Focus areas: ${weaknesses.join(', ')}.`);
    }

    // Pace
    if (timeMin < 60) {
      parts.push(`You completed this in ${timeMin} minutes - good pace.`);
    } else {
      parts.push(`You spent ${timeMin} minutes on this stage.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate readiness checkpoint before advancing
   * @param {Object} options
   *   - fromStage: string
   *   - toStage: string
   *   - averageScore: number (0-100)
   *   - trajectory: number (-1, 0, 1)
   *   - questionsAnswered: number
   * @returns {Object} checkpoint with warning, recommendation, canProceed
   */
  generateReadinessCheckpoint(options = {}) {
    const {
      fromStage = 'warmup',
      toStage = 'technical',
      averageScore = 50,
      trajectory = 0,
      questionsAnswered = 2,
    } = options;

    const fromMeta = this.stageMetadata[fromStage] || {};
    const toMeta = this.stageMetadata[toStage] || {};

    // Warning levels
    let warning = null;
    let warningLevel = 'none'; // 'none', 'caution', 'concern'

    if (averageScore < 40) {
      warning = `Your average score (${averageScore}%) is quite low. Review concepts before continuing?`;
      warningLevel = 'concern';
    } else if (averageScore < 55 && trajectory < 0) {
      warning = `Your performance is declining (${averageScore}% average). Would you like more practice?`;
      warningLevel = 'caution';
    } else if (averageScore < 60) {
      warning = `Your average (${averageScore}%) could be stronger. Ready to try the next stage anyway?`;
      warningLevel = 'caution';
    }

    // Recommendation
    let recommendation = `Ready to move from ${fromMeta.label} to ${toMeta.label}?`;
    if (trajectory > 0 && averageScore >= 75) {
      recommendation = `Excellent progress! Ready to take on the ${toMeta.label}?`;
    } else if (trajectory < 0) {
      recommendation = `Let's move to the next stage. It might feel easier with fresh questions!`;
    }

    return {
      fromStage,
      toStage,
      fromLabel: fromMeta.label,
      toLabel: toMeta.label,
      averageScore,
      trajectory,
      warning,
      warningLevel,
      recommendation,
      explicitCheckpoint: `Are you ready to proceed to ${toMeta.label}?`,
      canProceed: true, // User can always proceed with warning
    };
  }

  /**
   * Generate progress indicator
   * @param {Object} options
   *   - completedStages: array of strings (['intake', 'warmup'])
   *   - currentStage: string
   *   - totalStages: number (default 6)
   * @returns {Object} progress information
   */
  generateProgressIndicator(options = {}) {
    const {
      completedStages = [],
      currentStage = 'technical',
      totalStages = 6,
    } = options;

    const stageOrder = ['intake', 'warmup', 'technical', 'followup', 'challenge', 'feedback'];
    const completed = completedStages.length;
    const currentIndex = stageOrder.indexOf(currentStage);
    const completionPercent = Math.round((completed / totalStages) * 100);

    // Visual progress bar (text-based)
    const barLength = 10;
    const filled = Math.round((completed / totalStages) * barLength);
    const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    return {
      completed,
      total: totalStages,
      currentStage,
      currentOrdinal: currentIndex + 1,
      completionPercent,
      progressBar, // ██████░░░░
      description: `${currentIndex + 1} of ${totalStages} stages`,
      stagesList: stageOrder.map((stage, idx) => ({
        stage,
        ordinal: idx + 1,
        label: this.stageMetadata[stage]?.label,
        isCompleted: completedStages.includes(stage),
        isCurrent: stage === currentStage,
      })),
    };
  }

  /**
   * Generate guidance for next stage
   * @param {Object} options
   *   - nextStage: string
   *   - interviewType: string ('dsa', 'behavioral', 'hr', etc.)
   *   - userWeaknesses: array (e.g., ['recursion', 'graphs'])
   * @returns {Object} guidance with tips and focus areas
   */
  generateNextStagGuidance(options = {}) {
    const {
      nextStage = 'technical',
      interviewType = 'dsa',
      userWeaknesses = [],
    } = options;

    const metadata = this.stageMetadata[nextStage];
    const guidance = this._getStageGuidance(nextStage, interviewType, userWeaknesses);

    return {
      stage: nextStage,
      label: metadata?.label || nextStage,
      description: metadata?.description,
      expectedDuration: metadata?.duration_minutes,
      focusAreas: guidance.focusAreas,
      tips: guidance.tips,
      commonChallenges: guidance.commonChallenges,
      mindsetSuggestion: guidance.mindset,
    };
  }

  /**
   * Get stage-specific guidance
   * @private
   */
  _getStageGuidance(stage, interviewType, weaknesses) {
    const baseGuidance = {
      intake: {
        focusAreas: ['Understanding requirements', 'Asking clarifying questions'],
        tips: [
          'Take time to understand the problem completely',
          'Ask about edge cases and constraints upfront',
          'Clarify time and space complexity expectations',
        ],
        commonChallenges: ['Rushing through problem statement', 'Missing key requirements'],
        mindset: 'Slow down and listen. A clear understanding saves time later.',
      },
      warmup: {
        focusAreas: ['Building confidence', 'Simple problem-solving'],
        tips: [
          'Walk through your thought process step-by-step',
          'Verify your solution before moving on',
          'This stage is about building momentum!',
        ],
        commonChallenges: ['Over-complicating simple problems', 'Being uncertain in explanation'],
        mindset: 'You got this. Use this stage to find your rhythm.',
      },
      technical: {
        focusAreas: ['Deep problem-solving', 'Handling complexity'],
        tips: [
          'Break down the problem into smaller parts',
          'Consider multiple approaches and their tradeoffs',
          'Implement a working solution first, then optimize',
        ],
        commonChallenges: ['Jumping to solution without planning', 'Implementation errors'],
        mindset: 'Think before you code. Your approach matters as much as your code.',
      },
      followup: {
        focusAreas: ['Edge cases', 'Optimization', 'Communication'],
        tips: [
          'Listen carefully to interviewer feedback',
          'Handle edge cases systematically',
          'Explain your optimizations clearly',
        ],
        commonChallenges: ['Missing edge cases', 'Defensive about feedback'],
        mindset: 'This is collaboration. Show you can adapt and improve.',
      },
      challenge: {
        focusAreas: ['Advanced concepts', 'Pressure handling', 'Real-world scenarios'],
        tips: [
          'Stay calm under pressure - take a moment to think',
          'Remember: difficult questions are normal',
          'Show your reasoning, even if you\'re uncertain',
        ],
        commonChallenges: ['Panic when stuck', 'Giving up too quickly'],
        mindset: 'You\'ve made it far. Treat this as learning, not judgment.',
      },
      feedback: {
        focusAreas: ['Reflection', 'Learning from mistakes'],
        tips: [
          'Listen to feedback without defensiveness',
          'Ask clarifying questions about what you struggled with',
          'Create an action plan for next time',
        ],
        commonChallenges: ['Dismissing feedback', 'Not learning from mistakes'],
        mindset: 'Every interview is a learning opportunity. You\'ve grown today.',
      },
    };

    let guidance = baseGuidance[stage] || baseGuidance.technical;

    // Add weakness-specific guidance
    if (weaknesses.length > 0 && stage === 'technical') {
      guidance = {
        ...guidance,
        focusAreas: [
          ...guidance.focusAreas,
          `Review: ${weaknesses.join(', ')}`,
        ],
      };
    }

    return guidance;
  }

  /**
   * Generate stage transition message (concise)
   * @param {Object} options
   *   - fromStage: string
   *   - toStage: string
   *   - performanceLevel: string ('excellent', 'good', 'fair', 'needs improvement')
   * @returns {string} transition message
   */
  generateTransitionMessage(options = {}) {
    const {
      fromStage = 'warmup',
      toStage = 'technical',
      performanceLevel = 'good',
    } = options;

    const toMeta = this.stageMetadata[toStage] || {};

    const messages = {
      excellent: [
        `Fantastic work in the ${this.stageMetadata[fromStage]?.label}! You're ready to challenge yourself in the ${toMeta.label}.`,
        `Excellent performance! Let's move to the ${toMeta.label} and test your skills further.`,
        `You're doing great! Time to step up to the ${toMeta.label}.`,
      ],
      good: [
        `Good job! Ready to move to the ${toMeta.label}?`,
        `Solid progress. Let's continue with the ${toMeta.label}.`,
        `You've got this! Moving to the ${toMeta.label} next.`,
      ],
      fair: [
        `You're making progress. The ${toMeta.label} might feel different - let's see how you do.`,
        `Ready for the next stage? The ${toMeta.label} will be a good test.`,
      ],
      'needs improvement': [
        `Let's move on to the ${toMeta.label}. Fresh questions often help clarify concepts.`,
        `Time to try a new topic in the ${toMeta.label}. You'll do better here.`,
      ],
    };

    const messageList = messages[performanceLevel] || messages.good;
    return messageList[Math.floor(Math.random() * messageList.length)];
  }

  /**
   * Generate checkpoint summary for state machine integration
   * @param {Object} stateBeforeTransition
   *   - currentStage, questionsAnswered, recentScores, etc.
   * @returns {Object} complete transition checkpoint
   */
  generateTransitionCheckpoint(stateBeforeTransition = {}) {
    const {
      currentStage = 'warmup',
      nextStage = 'technical',
      questionsInStage = 2,
      scoresInStage = [],
      timeElapsedSeconds = 120,
      strengthAreas = [],
      weakAreas = [],
      averageScore = 70,
      trajectory = 0,
    } = stateBeforeTransition;

    const stageSummary = this.generateStageSummary({
      currentStage,
      questionsAnswered: questionsInStage,
      scoresInStage,
      timeSpentSeconds: timeElapsedSeconds,
      strengthAreas,
      weakAreas,
    });

    const checkpoint = this.generateReadinessCheckpoint({
      fromStage: currentStage,
      toStage: nextStage,
      averageScore,
      trajectory,
      questionsAnswered: questionsInStage,
    });

    const guidance = this.generateNextStagGuidance({
      nextStage,
      userWeaknesses: weakAreas,
    });

    const transitionMessage = this.generateTransitionMessage({
      fromStage: currentStage,
      toStage: nextStage,
      performanceLevel: stageSummary.performanceLevel,
    });

    return {
      timestamp: new Date().toISOString(),
      stageSummary,
      checkpoint,
      transitionMessage,
      nextStageGuidance: guidance,
      readyToAdvance: checkpoint.canProceed,
    };
  }
}

// Export singleton
export const stageTransitionFeedback = new StageTransitionFeedback();
