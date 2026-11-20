import { z } from 'zod';

export const ApiErrorIssueSchema = z.object({
  path: z.string().optional(),
  message: z.string(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.array(ApiErrorIssueSchema).optional(),
  requestId: z.string().optional(),
});

export const ApiHealthResponseSchema = z.object({
  status: z.enum(['ok', 'healthy', 'degraded']),
  timestamp: z.string().optional(),
  uptime: z.number().optional(),
  version: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiHealthResponse = z.infer<typeof ApiHealthResponseSchema>;
