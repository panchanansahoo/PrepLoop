import Joi from 'joi';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  username: Joi.string().alphanum().min(3).max(30).trim(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Auth validation schemas
 */
export const authSchemas = {
  signup: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    username: commonSchemas.username.required(),
    fullName: Joi.string().min(2).max(100).trim(),
  }),
  
  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),
  
  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password,
  }),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  updateProfile: Joi.object({
    fullName: Joi.string().min(2).max(100).trim(),
    bio: Joi.string().max(500).trim().allow(''),
    location: Joi.string().max(100).trim().allow(''),
    website: Joi.string().uri().allow(''),
    github: Joi.string().uri().allow(''),
    linkedin: Joi.string().uri().allow(''),
    twitter: Joi.string().max(50).trim().allow(''),
    skills: Joi.array().items(Joi.string().max(50)).max(20),
  }),
};

/**
 * DSA validation schemas
 */
export const dsaSchemas = {
  submitSolution: Joi.object({
    problemId: commonSchemas.id,
    code: Joi.string().max(50000).required(),
    language: Joi.string().valid('javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust').required(),
    timeComplexity: Joi.string().max(100).allow(''),
    spaceComplexity: Joi.string().max(100).allow(''),
  }),
};

/**
 * Blog validation schemas
 */
export const blogSchemas = {
  createPost: Joi.object({
    title: Joi.string().min(5).max(200).trim().required(),
    content: Joi.string().min(50).max(100000).required(),
    excerpt: Joi.string().max(500).trim().allow(''),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    published: Joi.boolean().default(false),
  }),
  
  updatePost: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    content: Joi.string().min(50).max(100000),
    excerpt: Joi.string().max(500).trim().allow(''),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    published: Joi.boolean(),
  }),
};

/**
 * Interview validation schemas
 */
export const interviewSchemas = {
  startInterview: Joi.object({
    type: Joi.string().valid('technical', 'behavioral', 'system-design', 'hr').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    duration: Joi.number().integer().min(15).max(120).default(30),
    topics: Joi.array().items(Joi.string().max(50)).max(5),
  }),
  
  submitAnswer: Joi.object({
    interviewId: commonSchemas.id,
    questionId: commonSchemas.id,
    answer: Joi.string().max(10000).required(),
    timeSpent: Joi.number().integer().min(0).max(7200),
  }),
};

/**
 * Contact validation schemas
 */
export const contactSchemas = {
  submitForm: Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    email: commonSchemas.email,
    subject: Joi.string().min(5).max(200).trim().required(),
    message: Joi.string().min(20).max(5000).trim().required(),
  }),
};

/**
 * Validation middleware factory
 */
export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
}

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');
