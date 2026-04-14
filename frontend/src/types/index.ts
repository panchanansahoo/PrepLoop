// Core types for PrepLoop application

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'hr';
  coins?: number;
  name?: string;
  avatar_url?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: Example[];
  constraints: string[];
  tags: string[];
  companies?: string[];
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodeSubmission {
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'c';
  problemId: string;
}

export interface CodeReview {
  overall_score: number;
  performance_level: string;
  scores: {
    correctness: number;
    efficiency: number;
    readability: number;
    best_practices: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    code_snippets: Record<string, any>;
  };
}

export interface InterviewSession {
  sessionId: string;
  session_id: string;
  stagePlan: StageItem[];
  interviewMode: string;
  runtime: string | null;
  status: string;
  interviewer: string;
  initial_question: string;
}

export interface StageItem {
  key: string;
  label: string;
}

export interface InterviewScores {
  overall: number;
  communication: number;
  problem_solving: number;
  technical_depth: number;
  performance_level: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}
