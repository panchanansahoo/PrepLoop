import rateLimit from 'express-rate-limit';

const isDevOrLocal = (req) => process.env.NODE_ENV === 'development' || req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';


// Critical endpoints rate limiting
export const feedbackStreamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many streaming feedback requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const aiEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const paymentEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const jobsEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many job requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const adminEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { error: 'Too many admin requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const customInterviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many interview requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const customInterviewSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many submission attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const expensiveFeatureLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many expensive requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const voiceTtsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many voice synthesis requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const voiceSttLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many transcription requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many analytics submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevOrLocal,
});

export { uploadEndpointsLimiter } from './uploadProtection.js';
