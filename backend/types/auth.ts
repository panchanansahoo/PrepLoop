/**
 * Authentication and Authorization Type Definitions
 */

export type UserRole = 'user' | 'admin' | 'interviewer';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  subscription_tier: SubscriptionTier;
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

