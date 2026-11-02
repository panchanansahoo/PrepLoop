/**
 * Service Layer Type Definitions
 */

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  topics?: string[];
  duration?: string;
  problemsCount?: number;
  solvedCount?: number;
  progressPercent?: number;
}

export interface LearningPathSummary {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modules?: LearningModule[];
}

export interface LearningPathDetail extends LearningPathSummary {
  prerequisite?: string;
  outcomes?: string[];
  modules: LearningModule[];
}

export interface UserTodo {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  category?: string;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  event_type?: string;
  created_at: string;
}

export interface ProductivitySummary {
  pendingTodosCount: number;
  completedTodosCount: number;
  upcomingEventsCount: number;
}

export interface PublicPortfolioBasics {
  name: string;
  title: string;
  photo: string;
  location: string;
  email: string;
  website: string;
  summary: string;
}

export interface PublicPortfolioSocials {
  github: string;
  linkedin: string;
  twitter: string;
  portfolio: string;
}

export interface PublicPortfolio {
  basics: PublicPortfolioBasics;
  socials: PublicPortfolioSocials;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    domains: string[];
  };
  experience: any[];
  education: any[];
  projects: any[];
  achievements: any[];
  openSource: { totalStars: number; totalRepos: number };
  portfolioMeta: {
    template: string;
    theme: string;
    slug: string;
    visibility: 'public' | 'private';
    isOwner: boolean;
  };
}

export interface UserSettings {
  full_name: string;
  experience_level: string;
  subscription_tier: string;
}


