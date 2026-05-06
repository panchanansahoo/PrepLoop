import Joi from 'joi';

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Alias for the same validation function
export const validateRequestBody = validate;

// Common schemas
export const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required()
  }),
  
  interviewSubmission: Joi.object({
    interviewId: Joi.number().integer().required(),
    answers: Joi.array().items(Joi.object({
      questionId: Joi.number().integer().required(),
      answer: Joi.string().max(5000).required(),
      duration: Joi.number().positive().optional()
    })).required()
  }),
  
  jobPreference: Joi.object({
    skills: Joi.array().items(Joi.string()).min(1).max(20),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'director'),
    location: Joi.string().max(100),
    remoteOnly: Joi.boolean(),
    salaryExpectation: Joi.number().integer().min(0)
  })
};