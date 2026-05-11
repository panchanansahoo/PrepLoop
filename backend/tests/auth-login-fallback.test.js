import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  selectSingle: vi.fn(),
  upsert: vi.fn(),
  listUsers: vi.fn(),
}));

vi.mock('../db/supabaseClient.js', () => ({
  supabaseAdmin: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      admin: {
        listUsers: mocks.listUsers,
      },
    },
    from: vi.fn((table) => {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            single: mocks.selectSingle,
          }),
        }),
        upsert: (...args) => mocks.upsert(...args),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    }),
  },
}));

vi.mock('../middleware/rateLimiter.js', () => ({
  authLoginLimiter: (_req, _res, next) => next(),
  forgotPasswordLimiter: (_req, _res, next) => next(),
  verificationLimiter: (_req, _res, next) => next(),
  isEmailCoolingDown: () => false,
  markEmailSent: () => {},
}));

vi.mock('../middleware/validationSchemas.js', () => ({
  validateBody: () => (_req, _res, next) => next(),
  signupSchema: {},
  loginSchema: {},
  forgotPasswordSchema: {},
  resetPasswordSchema: {},
}));

vi.mock('../middleware/refreshTokenRotation.js', () => ({
  rotateRefreshToken: vi.fn(),
  validateRefreshToken: vi.fn(),
  revokeAllUserTokens: vi.fn(),
}));

import authRouter from '../routes/auth.js';

describe('auth login fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows login when the profile row is missing', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          user_metadata: { full_name: 'New User' },
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    });

    mocks.selectSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    });

    mocks.upsert.mockResolvedValue({ error: null });

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newuser@example.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: 'user-123',
      email: 'newuser@example.com',
      fullName: 'New User',
      subscriptionTier: 'free',
      experienceLevel: 'beginner',
      role: 'user',
      emailVerified: true,
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        full_name: 'New User',
        subscription_tier: 'free',
        experience_level: 'beginner',
        role: 'user',
        email_verified: true,
      }),
      expect.objectContaining({ onConflict: 'id' })
    );
  });

  it('prompts for verification when credentials are invalid but the auth user is unverified', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-456',
            email: 'unverified@example.com',
            email_confirmed_at: null,
          },
        ],
      },
      error: null,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'Aa1!bcde' });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      error: 'Please verify your email before logging in',
      code: 'EMAIL_NOT_VERIFIED',
      email: 'unverified@example.com',
    });
  });
});
