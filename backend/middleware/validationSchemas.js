/**
 * Input Validation Schemas using Joi
 * Comprehensive validation for all API endpoints
 */

import Joi from 'joi';

// Common patterns
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Authentication Schemas
 */

export const signupSchema = Joi.object({
  email: Joi.string()
    .pattern(emailPattern)
    .required()
    .lowercase()
    .trim()
    .max(254)
    .messages({
      'string.pattern.base': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 254 characters',
    }),
  
  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .min(8)
    .max(128)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
    }),
  
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
    }),
  
  username: Joi.string()
    .pattern(usernamePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores (3-30 characters)',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .pattern(emailPattern)
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.pattern.base': 'Email must be a valid email address',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .pattern(emailPattern)
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.pattern.base': 'Email must be a valid email address',
    }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .min(32)
    .max(512)
    .messages({
      'string.min': 'Invalid reset token',
    }),
  
  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .min(8)
    .max(128)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
    }),
  
  bio: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Bio must not exceed 500 characters',
    }),
  
  location: Joi.string()
    .max(100)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Location must not exceed 100 characters',
    }),
  
  github: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'GitHub URL must be a valid URL',
    }),
  
  linkedin: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'LinkedIn URL must be a valid URL',
    }),
  
  website: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Website URL must be a valid URL',
    }),
}).min(1); // At least one field must be provided

/**
 * Interview Schemas
 */

export const startInterviewSchema = Joi.object({
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .optional()
    .default('medium')
    .messages({
      'any.only': 'Difficulty must be easy, medium, or hard',
    }),
  
  duration: Joi.number()
    .integer()
    .min(15)
    .max(120)
    .optional()
    .default(30)
    .messages({
      'number.min': 'Duration must be at least 15 minutes',
      'number.max': 'Duration must not exceed 120 minutes',
    }),
  
  topics: Joi.array()
    .items(Joi.string().trim())
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'At least one topic is required',
      'array.max': 'Maximum 10 topics allowed',
    }),
  
  company: Joi.string()
    .trim()
    .optional()
    .max(100)
    .messages({
      'string.max': 'Company name must not exceed 100 characters',
    }),
});

export const submitAnswerSchema = Joi.object({
  questionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid question ID',
    }),
  
  answer: Joi.string()
    .min(10)
    .max(10000)
    .required()
    .trim()
    .messages({
      'string.min': 'Answer must be at least 10 characters long',
      'string.max': 'Answer must not exceed 10000 characters',
    }),
  
  timeSpent: Joi.number()
    .integer()
    .min(0)
    .max(7200) // 2 hours max
    .optional()
    .default(0)
    .messages({
      'number.max': 'Time spent cannot exceed 2 hours',
    }),
});

/**
 * Problem/Question Schemas
 */

export const createProblemSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title must not exceed 200 characters',
    }),
  
  description: Joi.string()
    .min(20)
    .max(10000)
    .required()
    .trim()
    .messages({
      'string.min': 'Description must be at least 20 characters long',
      'string.max': 'Description must not exceed 10000 characters',
    }),
  
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard')
    .required()
    .messages({
      'any.only': 'Difficulty must be easy, medium, or hard',
    }),
  
  category: Joi.string()
    .trim()
    .required()
    .max(100)
    .messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
  
  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Maximum 10 tags allowed',
    }),
  
  testCases: Joi.array()
    .items(
      Joi.object({
        input: Joi.string().required(),
        expectedOutput: Joi.string().required(),
      })
    )
    .min(1)
    .max(20)
    .optional()
    .messages({
      'array.min': 'At least one test case is required',
      'array.max': 'Maximum 20 test cases allowed',
    }),
});

/**
 * Job Search Schemas
 */

export const searchJobsSchema = Joi.object({
  query: Joi.string()
    .min(2)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Search query must be at least 2 characters',
      'string.max': 'Search query must not exceed 200 characters',
    }),
  
  location: Joi.string()
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.max': 'Location must not exceed 100 characters',
    }),
  
  experience: Joi.string()
    .valid('fresher', '1-3', '3-5', '5-8', '8+')
    .optional()
    .messages({
      'any.only': 'Experience must be one of: fresher, 1-3, 3-5, 5-8, 8+',
    }),
  
  salary: Joi.object({
    min: Joi.number().integer().min(0).optional(),
    max: Joi.number().integer().min(0).optional(),
  }).optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Page number must be at least 1',
      'number.max': 'Page number must not exceed 100',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 50',
    }),
});

/**
 * Feedback Schemas
 */

export const submitFeedbackSchema = Joi.object({
  type: Joi.string()
    .valid('bug', 'feature', 'improvement', 'other')
    .required()
    .messages({
      'any.only': 'Feedback type must be bug, feature, improvement, or other',
    }),
  
  title: Joi.string()
    .min(5)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must not exceed 200 characters',
    }),
  
  description: Joi.string()
    .min(10)
    .max(5000)
    .trim()
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters',
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional()
    .default('medium')
    .messages({
      'any.only': 'Priority must be low, medium, high, or critical',
    }),
});

/**
 * Pagination Schema (reusable)
 */
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page number must be at least 1',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  
  sortBy: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Sort field must not exceed 50 characters',
    }),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'any.only': 'Order must be asc or desc',
    }),
});

/**
 * Validation Middleware Factory
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    
    if (!data) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [`No ${source} provided`],
      });
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown fields
      convert: true, // Enable type coercion
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }

    // Replace request data with sanitized/validated data
    req[source] = value;
    next();
  };
}

/**
 * Query Parameter Validation
 */
export function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Request Body Validation
 */
export function validateBody(schema) {
  return validate(schema, 'body');
}

/**
 * Request Parameters Validation
 */
export function validateParams(schema) {
  return validate(schema, 'params');
}
