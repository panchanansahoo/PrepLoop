import { z } from 'zod';

export const JobApplicationStatusSchema = z.enum([
  'bookmarked',
  'applied',
  'phone_screen',
  'technical',
  'onsite',
  'offer',
  'rejected',
]);

const JobApplicationBaseSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  role: z.string().trim().min(1, 'Role is required').max(160),
  status: JobApplicationStatusSchema,
  notes: z.string().max(4000),
  jobUrl: z.string().trim().url('Invalid job URL').max(500).or(z.literal('')),
  location: z.string().trim().max(160),
  salaryRange: z.string().trim().max(120),
  appliedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable(),
});

export const CreateJobApplicationSchema = JobApplicationBaseSchema.extend({
  status: JobApplicationStatusSchema.default('bookmarked'),
  notes: z.string().max(4000).optional().default(''),
  jobUrl: z.string().trim().url('Invalid job URL').max(500).optional().or(z.literal('')),
  location: z.string().trim().max(160).optional().default(''),
  salaryRange: z.string().trim().max(120).optional().default(''),
  appliedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
});

export const UpdateJobApplicationSchema = JobApplicationBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const ResumeGapAnalysisRequestSchema = z.object({
  resumeText: z.string().trim().min(30, 'Please provide at least 30 characters of resume text').max(60000),
  jobDescription: z.string().trim().min(30, 'Please provide at least 30 characters of job description').max(60000),
  jobTitle: z.string().trim().max(160).optional(),
  company: z.string().trim().max(120).optional(),
});

export type JobApplicationStatus = z.infer<typeof JobApplicationStatusSchema>;
export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof UpdateJobApplicationSchema>;
export type ResumeGapAnalysisRequest = z.infer<typeof ResumeGapAnalysisRequestSchema>;
