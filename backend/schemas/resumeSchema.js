import { z } from 'zod';

/**
 * Standardized Canonical Resume JSON Schema (Cross-Domain)
 * 
 * Enforces:
 * - Flexible skill groups [{ group, items[] }] for tech, healthcare, finance, legal, etc.
 * - Optional 'additional' section [{ title, items[] }] for awards, publications, volunteering.
 * - Lenient date formatting (supports 'YYYY', 'YYYY-MM', 'Month YYYY', 'Present', partial dates).
 * - Read-only factual core architecture for AI safety.
 */

export const ContactSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  linkedin: z.string().default(''),
  portfolio: z.string().default(''),
  github: z.string().default(''),
}).default({});

export const SkillGroupSchema = z.object({
  group: z.string().min(1, 'Skill group name is required'),
  items: z.array(z.string().trim()).default([]),
});

export const ExperienceEntrySchema = z.object({
  id: z.string().optional(),
  company: z.string().default(''),
  title: z.string().default(''),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default('Present'),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim()).default([]),
});

export const ProjectEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  role: z.string().optional().default(''),
  tech: z.array(z.string()).default([]),
  link: z.string().optional().default(''),
  dates: z.string().optional().default(''),
  bullets: z.array(z.string().trim()).default([]),
});

export const EducationEntrySchema = z.object({
  id: z.string().optional(),
  institution: z.string().default(''),
  degree: z.string().default(''),
  location: z.string().default(''),
  graduationDate: z.string().default(''),
  gpa: z.string().optional().default(''),
  highlights: z.array(z.string()).default([]),
});

export const CertificationEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
});

export const AdditionalSectionSchema = z.object({
  title: z.string().min(1, 'Additional section title required'),
  items: z.array(z.string().trim()).default([]),
});

export const ResumeJsonSchema = z.object({
  id: z.string().optional(),
  version: z.number().int().default(1),
  title: z.string().default('Resume'),
  updatedAt: z.string().optional(),
  contact: ContactSchema,
  summary: z.string().default(''),
  skills: z.array(SkillGroupSchema).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  certifications: z.array(CertificationEntrySchema).default([]),
  additional: z.array(AdditionalSectionSchema).optional().default([]),
});

/**
 * Validates and normalizes raw object into canonical ResumeJSON
 */
export function validateAndNormalizeResumeJson(raw = {}) {
  const result = ResumeJsonSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      data: null,
    };
  }
  return {
    success: true,
    errors: [],
    data: result.data,
  };
}
