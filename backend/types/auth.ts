/**
 * Authentication and Authorization Type Definitions
 */

export type UserRole = 'user' | 'admin' | 'interviewer' | 'hr' | 'employer';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'premium';

export interface AuthUser {
  id: string;
  email?: string | null;
  role: UserRole;
  subscription_tier?: SubscriptionTier;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: AuthUser;
  userId?: string;
  token?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userId?: string;
      token?: string;
    }
  }
}


