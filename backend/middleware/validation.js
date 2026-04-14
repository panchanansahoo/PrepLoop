import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

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

    req.body = value;
    next();
  };
};

export const schemas = {
  signup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  codeSubmission: Joi.object({
    code: Joi.string().max(50000).required(),
    language: Joi.string().valid('python', 'javascript', 'java', 'cpp', 'c').required(),
    problemId: Joi.string().required()
  }),

  interviewStart: Joi.object({
    problemId: Joi.string().required(),
    interviewMode: Joi.string().valid('full_realtime', 'guided', 'quick').optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional()
  }),

  interviewResponse: Joi.object({
    sessionId: Joi.string().required(),
    message: Joi.string().max(10000).required(),
    code: Joi.string().max(50000).optional()
  }),

  noteCreate: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().max(100000).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
  }),

  blogPost: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(50).max(100000).required(),
    excerpt: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    published: Joi.boolean().optional()
  }),

  contactForm: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(5000).required()
  }),

  profileUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional(),
    avatar_url: Joi.string().uri().optional(),
    github_url: Joi.string().uri().optional(),
    linkedin_url: Joi.string().uri().optional()
  })
};
