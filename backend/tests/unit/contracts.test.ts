import { describe, expect, it, vi } from 'vitest';
import {
  LoginRequestSchema,
  SignupRequestSchema,
  StartInterviewRequestSchema,
  CodeSubmissionRequestSchema,
  CreateJobApplicationSchema,
  UpdateJobApplicationSchema,
  ResumeGapAnalysisRequestSchema,
  RecordReviewRequestSchema,
} from '@preploop/contracts';
import { validateBody } from '../../middleware/validateZod.js';

describe('@preploop/contracts shared Zod schemas', () => {
  it('normalizes and validates LoginRequestSchema', () => {
    const parsed = LoginRequestSchema.parse({
      email: '  Alice@Example.COM ',
      password: 'secret',
    });
    expect(parsed).toEqual({
      email: 'alice@example.com',
      password: 'secret',
    });
    expect(() => LoginRequestSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });

  it('enforces password complexity on SignupRequestSchema', () => {
    expect(
      SignupRequestSchema.safeParse({
        email: 'bob@example.com',
        password: 'weak',
      }).success
    ).toBe(false);

    expect(
      SignupRequestSchema.safeParse({
        email: 'bob@example.com',
        password: 'StrongPassword1',
        fullName: 'Bob Builder',
      }).success
    ).toBe(true);
  });

  it('applies defaults on StartInterviewRequestSchema', () => {
    const parsed = StartInterviewRequestSchema.parse({
      role: 'Backend Engineer',
    });
    expect(parsed.mode).toBe('technical');
    expect(parsed.difficulty).toBe('medium');
  });

  it('validates CodeSubmissionRequestSchema', () => {
    expect(
      CodeSubmissionRequestSchema.safeParse({
        problemId: 'two-sum',
        code: 'console.log(1);',
        language: 'javascript',
      }).success
    ).toBe(true);

    expect(
      CodeSubmissionRequestSchema.safeParse({
        problemId: '',
        code: '',
      }).success
    ).toBe(false);
  });

  it('validates job tracker and resume gap schemas', () => {
    const created = CreateJobApplicationSchema.parse({
      company: 'Acme Corp',
      role: 'Software Engineer',
    });
    expect(created.status).toBe('bookmarked');

    expect(UpdateJobApplicationSchema.safeParse({}).success).toBe(false);
    expect(UpdateJobApplicationSchema.safeParse({ status: 'applied' }).success).toBe(true);

    expect(
      ResumeGapAnalysisRequestSchema.safeParse({
        resumeText: 'too short',
        jobDescription: 'also short',
      }).success
    ).toBe(false);
  });

  it('validates SM-2 RecordReviewRequestSchema quality bounds (0..5)', () => {
    expect(RecordReviewRequestSchema.safeParse({ problemId: 'two-sum', quality: 4 }).success).toBe(true);
    expect(RecordReviewRequestSchema.safeParse({ problemId: 'two-sum', quality: 6 }).success).toBe(false);
    expect(RecordReviewRequestSchema.safeParse({ problemId: 'two-sum', quality: -1 }).success).toBe(false);
  });

  it('validateBody middleware returns 400 with details on invalid payload and calls next on valid payload', () => {
    const middleware = validateBody(LoginRequestSchema);
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    middleware({ body: { email: 'bad', password: '' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();

    const req = { body: { email: 'USER@Test.io ', password: 'pw' } };
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.email).toBe('user@test.io');
  });
});
