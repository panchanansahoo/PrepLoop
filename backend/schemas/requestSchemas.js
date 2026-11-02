import Joi from 'joi';

/**
 * Peer Interview Schemas
 */
export const createPeerRoomSchema = Joi.object({
  problemId: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null).optional(),
  language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'typescript', 'go').default('javascript'),
});

export const matchPeerRoomSchema = Joi.object({
  role: Joi.string().max(100).default('Software Engineer'),
  skillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
  topic: Joi.string().max(100).default('Data Structures & Algorithms'),
  preferredLanguage: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'typescript', 'go').default('javascript'),
});

export const peerRoomParamSchema = Joi.object({
  roomCode: Joi.string().trim().regex(/^PREP-[A-Z0-9]+$/i).required(),
});

/**
 * Employer & Platform API Schemas
 */
export const createApiKeySchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  scopes: Joi.array()
    .items(Joi.string().valid('interviews:read', 'interviews:write', 'candidates:read', 'candidates:export', 'reports:read'))
    .min(1)
    .default(['interviews:read']),
});

export const createWebhookSchema = Joi.object({
  targetUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  events: Joi.array()
    .items(Joi.string().valid('interview.completed', 'candidate.scored', 'challenge.solved'))
    .min(1)
    .default(['interview.completed']),
  secret: Joi.string().min(8).max(128).optional(),
});

export const createQuestionBankSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  companyName: Joi.string().trim().max(100).default('Enterprise Partner'),
  role: Joi.string().trim().max(100).default('Software Engineer'),
  questions: Joi.array().items(
    Joi.object({
      id: Joi.string().optional(),
      question: Joi.string().required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
      category: Joi.string().default('Technical'),
      rubric: Joi.object().optional(),
    })
  ).min(1).required(),
});

/**
 * Community Challenges Schemas
 */
export const challengeSubmissionSchema = Joi.object({
  code: Joi.string().trim().min(5).max(50000).required(),
  language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'typescript', 'go').default('javascript'),
});

/**
 * Career Roadmap Query Schemas
 */
export const roadmapQuerySchema = Joi.object({
  targetRole: Joi.string().trim().max(100).default('Full Stack Engineer'),
  experienceLevel: Joi.string().valid('junior', 'mid', 'senior', 'lead').default('mid'),
});

/**
 * AI Features & Interview Simulator Schemas
 */
export const codeReviewSchema = Joi.object({
  problemId: Joi.number().integer().required(),
  code: Joi.string().trim().min(1).required(),
  language: Joi.string().trim().default('javascript'),
});

export const reviewIdParamSchema = Joi.object({
  reviewId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
});

export const problemIdParamSchema = Joi.object({
  problemId: Joi.number().integer().required(),
});

export const interviewSessionParamSchema = Joi.object({
  sessionId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
});

export const groundingTestSchema = Joi.object({
  company: Joi.string().trim().optional(),
  role: Joi.string().trim().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  stage: Joi.string().trim().default('technical'),
  interviewType: Joi.string().valid('dsa', 'system_design', 'behavioral', 'mixed').default('dsa'),
  missingAreas: Joi.array().items(Joi.string()).default([]),
  resumeContext: Joi.object().default({}),
  limit: Joi.number().integer().min(1).max(8).default(5),
});

export const interviewStartSchema = Joi.object({
  interviewType: Joi.string().valid('dsa', 'system_design', 'behavioral', 'mixed').required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  companyFocus: Joi.string().trim().optional().allow(null, ''),
  interviewMode: Joi.string().valid('full_realtime').default('full_realtime'),
  totalQuestions: Joi.number().integer().min(3).max(30).optional().allow(null),
});

export const interviewRespondSchema = Joi.object({
  response: Joi.string().trim().min(1).required(),
  interviewMode: Joi.string().valid('full_realtime').default('full_realtime'),
});


