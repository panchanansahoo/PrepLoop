/**
 * learningPathValidationSchemas.js
 *
 * Joi validation schemas for learning path operations.
 * Used for input validation at route boundaries.
 */

import Joi from 'joi';

export const pathIdSchema = Joi.object({
  pathId: Joi.string().required().example('arrays-foundations'),
});

export const userProfileSchema = Joi.object({
  userId: Joi.string().required(),
  skillLevel: Joi.string()
    .valid('beginner', 'intermediate', 'advanced', 'expert')
    .default('beginner'),
  weaknessAreas: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(1)).default({}),
  attemptedTopics: Joi.array().items(Joi.string()).default([]),
  completedPaths: Joi.array().items(Joi.string()).default([]),
  currentRole: Joi.string()
    .valid(
      'junior-developer',
      'mid-level-engineer',
      'senior-engineer',
      'data-scientist',
      'competitive-programmer',
    )
    .default('software-engineer'),
});

export const pathProgressSchema = Joi.object({
  userId: Joi.string().required(),
  pathId: Joi.string().required(),
  completionPercentage: Joi.number().min(0).max(100).default(0),
  totalProblemsSolved: Joi.number().min(0).default(0),
  milestoneProgress: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        stage: Joi.string()
          .valid('THEORY', 'QUICK_METHODS', 'SHORTCUTS', 'PRACTICE')
          .default('PRACTICE'),
        problemCount: Joi.number().min(1).required(),
        completed: Joi.number().min(0).default(0),
        status: Joi.string().valid('not_started', 'in_progress', 'completed').default('not_started'),
      }),
    )
    .required(),
  estimatedHours: Joi.number().min(1).required(),
  masteryLevel: Joi.string()
    .valid('NOT_STARTED', 'LEARNING', 'IN_PROGRESS', 'PROFICIENT', 'MASTERED')
    .default('NOT_STARTED'),
  startedAt: Joi.date().required(),
  completedAt: Joi.date().allow(null),
});

export const updateMilestoneSchema = Joi.object({
  milestoneIndex: Joi.number().min(0).required(),
  problemsSolved: Joi.number().min(0).required(),
});

export const recommendPathsSchema = Joi.object({
  skillLevel: Joi.string()
    .valid('beginner', 'intermediate', 'advanced', 'expert')
    .optional(),
  weaknessAreas: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(1)).optional(),
  attemptedTopics: Joi.array().items(Joi.string()).optional(),
  completedPaths: Joi.array().items(Joi.string()).optional(),
  currentRole: Joi.string().optional(),
});

export const pathSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required().max(100),
  description: Joi.string().required().max(500),
  difficulty: Joi.string().valid('easy', 'medium', 'hard', 'advanced').required(),
  estimatedHours: Joi.number().min(1).required(),
  topics: Joi.array().items(Joi.string()).required(),
  category: Joi.string().required(),
  prerequisites: Joi.array().items(Joi.string()).default([]),
  milestones: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        problems: Joi.number().min(1).required(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard', 'advanced').required(),
        stage: Joi.string().valid('THEORY', 'QUICK_METHODS', 'SHORTCUTS', 'PRACTICE').required(),
      }),
    )
    .min(1)
    .required(),
});

export const performanceGapSchema = Joi.object().pattern(Joi.string(), Joi.number().min(0).max(100));

/**
 * Validate user profile
 */
export function validateUserProfile(data) {
  return userProfileSchema.validate(data);
}

/**
 * Validate path progress
 */
export function validatePathProgress(data) {
  return pathProgressSchema.validate(data);
}

/**
 * Validate milestone update
 */
export function validateMilestoneUpdate(data) {
  return updateMilestoneSchema.validate(data);
}

/**
 * Validate path recommendations request
 */
export function validateRecommendRequest(data) {
  return recommendPathsSchema.validate(data);
}

/**
 * Validate path creation
 */
export function validatePath(data) {
  return pathSchema.validate(data);
}

/**
 * Validate performance gaps
 */
export function validatePerformanceGaps(data) {
  return performanceGapSchema.validate(data);
}

/**
 * Create validation middleware
 */
export function createValidationMiddleware(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      });
    }
    req.validatedData = value;
    next();
  };
}
