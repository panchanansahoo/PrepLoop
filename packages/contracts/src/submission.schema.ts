import { z } from 'zod';

export const SupportedLanguageSchema = z.enum([
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'go',
  'rust',
  'sql',
]);

export const CodeRunRequestSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100000, 'Code exceeds maximum length'),
  language: SupportedLanguageSchema.default('javascript'),
  stdin: z.string().max(50000).optional(),
  problemId: z.union([z.string(), z.number()]).optional(),
});

export const CodeSubmissionRequestSchema = CodeRunRequestSchema.extend({
  problemId: z.union([z.string().min(1), z.number().int().positive()]),
  problemTitle: z.string().trim().max(200).optional(),
  timeTakenSeconds: z.number().min(0).max(86400).optional(),
});

export type CodeRunRequest = z.infer<typeof CodeRunRequestSchema>;
export type CodeSubmissionRequest = z.infer<typeof CodeSubmissionRequestSchema>;
