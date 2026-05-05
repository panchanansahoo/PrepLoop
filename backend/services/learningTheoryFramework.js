/**
 * learningTheoryFramework.js
 *
 * Defines the pedagogical framework for learning paths.
 * Learning Stages: Theory → Quick Methods → Shortcuts → Practice
 * Each stage builds upon previous knowledge with explicit learning objectives.
 */

export const LEARNING_STAGES = {
  THEORY: {
    id: 'theory',
    name: 'Theory & Foundations',
    description: 'Understand core concepts and theoretical foundations',
    objectives: [
      'Learn fundamental definitions and principles',
      'Understand problem structures and patterns',
      'Build mental models for the topic',
    ],
    estimatedDuration: 0.3, // 30% of total path time
    contentTypes: ['definitions', 'explanations', 'diagrams', 'examples'],
  },
  QUICK_METHODS: {
    id: 'quick_methods',
    name: 'Quick Methods',
    description: 'Learn standard approaches to solve common problems',
    objectives: [
      'Master standard algorithms for this topic',
      'Learn when to apply each method',
      'Practice identifying problem types',
    ],
    estimatedDuration: 0.25, // 25% of total path time
    contentTypes: ['algorithms', 'step_by_step_solutions', 'practice_problems'],
  },
  SHORTCUTS: {
    id: 'shortcuts',
    name: 'Shortcuts & Optimizations',
    description: 'Discover advanced techniques and optimizations',
    objectives: [
      'Learn optimization techniques',
      'Understand trade-offs and constraints',
      'Build intuition for complex problems',
    ],
    estimatedDuration: 0.25, // 25% of total path time
    contentTypes: ['advanced_techniques', 'optimization_tips', 'edge_cases'],
  },
  PRACTICE: {
    id: 'practice',
    name: 'Practice & Mastery',
    description: 'Apply learning through solving diverse problems',
    objectives: [
      'Solve problems of varying difficulty',
      'Build speed and accuracy',
      'Achieve mastery through repetition',
    ],
    estimatedDuration: 0.2, // 20% of total path time
    contentTypes: ['practice_problems', 'mock_interviews', 'competitive_challenges'],
  },
};

export const MASTERY_LEVELS = {
  NOT_STARTED: { level: 0, name: 'Not Started', emoji: '🔒', color: '#525252' },
  LEARNING: { level: 1, name: 'Learning', emoji: '📚', color: '#818cf8' },
  IN_PROGRESS: { level: 2, name: 'In Progress', emoji: '🔥', color: '#facc15' },
  PROFICIENT: { level: 3, name: 'Proficient', emoji: '✨', color: '#34d399' },
  MASTERED: { level: 4, name: 'Mastered', emoji: '✅', color: '#059669' },
};

export const MILESTONE_TYPES = {
  THEORETICAL: 'theoretical',
  PRACTICAL: 'practical',
  CHECKPOINT: 'checkpoint',
};

/**
 * Calculate mastery level based on completion percentage
 */
export function calculateMasteryLevel(completionPercentage) {
  if (completionPercentage === 0) return MASTERY_LEVELS.NOT_STARTED;
  if (completionPercentage < 25) return MASTERY_LEVELS.LEARNING;
  if (completionPercentage < 60) return MASTERY_LEVELS.IN_PROGRESS;
  if (completionPercentage < 90) return MASTERY_LEVELS.PROFICIENT;
  return MASTERY_LEVELS.MASTERED;
}

/**
 * Get learning stage based on progress through milestones
 */
export function getStageFromProgress(completedMilestones, totalMilestones) {
  const progressRatio = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  const stageKeys = Object.keys(LEARNING_STAGES);
  for (let i = 0; i < stageKeys.length; i++) {
    const currentStageKey = stageKeys[i];
    const nextStageKey = stageKeys[i + 1];

    const currentStageStart = stageKeys
      .slice(0, i)
      .reduce((sum, key) => sum + LEARNING_STAGES[key].estimatedDuration, 0);

    const nextStageStart = currentStageStart + LEARNING_STAGES[currentStageKey].estimatedDuration;

    if (progressRatio >= currentStageStart && progressRatio < nextStageStart) {
      return LEARNING_STAGES[currentStageKey];
    }
  }

  return LEARNING_STAGES.PRACTICE; // Default to practice if beyond all stages
}

/**
 * Generate structured learning objectives for a path
 */
export function generatePathObjectives(path) {
  const objectives = [];

  // Add stage-specific objectives
  Object.values(LEARNING_STAGES).forEach((stage) => {
    objectives.push({
      stage: stage.id,
      stageName: stage.name,
      objectives: stage.objectives,
      estimatedDuration: Math.round(path.estimatedHours * stage.estimatedDuration),
    });
  });

  return objectives;
}

/**
 * Create milestone with pedagogical structure
 */
export function createStructuredMilestone(name, problemCount, difficulty, stageId) {
  return {
    name,
    problemCount,
    difficulty,
    stage: stageId,
    completed: 0,
    status: 'not_started',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate that a milestone aligns with learning theory
 */
export function validateMilestoneAlignment(milestone, expectedStage) {
  if (!milestone.stage) {
    throw new Error('Milestone must have a stage attribute');
  }

  if (!LEARNING_STAGES[milestone.stage.toUpperCase()]) {
    throw new Error(`Invalid learning stage: ${milestone.stage}`);
  }

  if (milestone.stage !== expectedStage) {
    console.warn(
      `Milestone stage (${milestone.stage}) does not match expected stage (${expectedStage})`,
    );
  }

  return true;
}
