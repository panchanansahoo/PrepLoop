import { z } from 'zod';

export const CodeReviewSchema = z.object({
  overall_score: z.number().min(0).max(10).nullable(),
  performance_level: z.string(),
  scores: z.object({
    correctness: z.number().min(0).max(10),
    efficiency: z.number().min(0).max(10),
    readability: z.number().min(0).max(10),
    best_practices: z.number().min(0).max(10)
  }),
  feedback: z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    suggestions: z.array(z.string()),
    code_snippets: z.record(z.any())
  })
});

export const InterviewSessionSchema = z.object({
  sessionId: z.string(),
  session_id: z.string(),
  stagePlan: z.array(z.object({
    key: z.string(),
    label: z.string()
  })),
  interviewMode: z.string(),
  runtime: z.string().nullable(),
  status: z.string(),
  interviewer: z.string(),
  initial_question: z.string()
});

export const InterviewScoresSchema = z.object({
  overall: z.number().min(0).max(10),
  communication: z.number().min(0).max(10),
  problem_solving: z.number().min(0).max(10),
  technical_depth: z.number().min(0).max(10),
  performance_level: z.string()
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'hr']).optional(),
  coins: z.number().int().min(0).optional()
});

export const validateResponse = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Response validation failed:', error);
    throw new Error('Invalid API response format');
  }
};

export const safeValidate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('Validation warning:', result.error);
    return null;
  }
  return result.data;
};
