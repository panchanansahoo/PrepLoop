import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const SignupRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120).optional(),
  name: z.string().trim().min(2).max(120).optional(),
});

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform((v) => v.toLowerCase()),
});

export const ResetPasswordRequestSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required').optional(),
  token: z.string().min(1, 'Reset token is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .optional(),
}).refine(
  (data) => Boolean(data.accessToken || data.token),
  { message: 'Access token or reset token is required', path: ['accessToken'] }
).refine(
  (data) => Boolean(data.newPassword || data.password),
  { message: 'New password is required', path: ['newPassword'] }
);

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
