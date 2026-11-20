import { z } from 'zod';

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().optional(),
});

export const WeekPlanSchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  title: z.string(),
  description: z.string(),
  milestones: z.array(MilestoneSchema).min(1),
});

export const CareerRoadmapSchema = z.object({
  targetRole: z.string(),
  targetCompany: z.string().optional(),
  readinessScore: z.number().min(0).max(100),
  domainScores: z.record(z.string(), z.number()).optional(),
  weeks: z.array(WeekPlanSchema),
});

export type Milestone = z.infer<typeof MilestoneSchema>;
export type WeekPlan = z.infer<typeof WeekPlanSchema>;
export type CareerRoadmap = z.infer<typeof CareerRoadmapSchema>;
