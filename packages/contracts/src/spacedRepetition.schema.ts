import { z } from 'zod';

export const RecordReviewRequestSchema = z.object({
  problemId: z.string().trim().min(1, 'problemId is required').max(120),
  problemTitle: z.string().trim().max(200).optional(),
  quality: z.number().int().min(0, 'Quality must be between 0 and 5').max(5, 'Quality must be between 0 and 5'),
});

export type RecordReviewRequest = z.infer<typeof RecordReviewRequestSchema>;
