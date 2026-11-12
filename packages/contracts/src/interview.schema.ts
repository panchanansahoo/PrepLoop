import { z } from 'zod';

export const InterviewModeSchema = z.enum([
  'technical',
  'behavioral',
  'hr',
  'system-design',
  'dsa',
  'company',
  'fresher',
  'mixed',
]);

export const InterviewDifficultySchema = z.enum(['easy', 'medium', 'hard', 'adaptive']);

export const StartInterviewRequestSchema = z.object({
  role: z.string().trim().min(1, 'Role is required').max(120),
  company: z.string().trim().max(120).optional(),
  mode: InterviewModeSchema.default('technical'),
  difficulty: InterviewDifficultySchema.default('medium'),
  topics: z.array(z.string().trim().min(1)).max(20).optional(),
  durationMinutes: z.number().int().min(5).max(120).optional(),
  resumeText: z.string().max(50000).optional(),
});

export const EvaluateAnswerRequestSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  question: z.string().trim().min(1, 'Question is required').max(10000),
  answer: z.string().trim().min(1, 'Answer is required').max(30000),
  role: z.string().trim().max(120).optional(),
  mode: InterviewModeSchema.optional(),
  questionIndex: z.number().int().min(0).optional(),
});

export type StartInterviewRequest = z.infer<typeof StartInterviewRequestSchema>;
export type EvaluateAnswerRequest = z.infer<typeof EvaluateAnswerRequestSchema>;
