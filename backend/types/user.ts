/**
 * User Profile and Gamification Types
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  experienceLevel: 'beginner' | 'intermediate' | 'experienced';
  experienceSummary?: string;
  experienceYears?: number | null;
  designation?: string;
  company?: string;
  bio?: string;
  skills?: string;
  avatarUrl?: string;
  coins: number;
  customUrl?: string;
  isPublic: boolean;
  createdAt?: string;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakFreezeCount: number;
  updatedAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  badgeCode: string;
  unlockedAt: string;
}

