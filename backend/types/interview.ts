/**
 * Interview System Type Definitions
 */

export type InterviewType = 'dsa' | 'system_design' | 'behavioral' | 'hr' | 'mixed';

export type InterviewStage = 
  | 'intake' 
  | 'warmup' 
  | 'technical' 
  | 'followup' 
  | 'challenge' 
  | 'feedback';

export type InterviewStatus = 'created' | 'in_progress' | 'completed' | 'abandoned';

export interface InterviewMessage {
  role: 'system' | 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  stage?: InterviewStage;
  audioUrl?: string;
}

export interface RubricScore {
  communication: number; // 0-10 or 0-100
  decomposition: number;
  technical: number;
  totalScore: number;
  feedback?: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  interviewType: InterviewType;
  difficulty: 'easy' | 'medium' | 'hard';
  currentStage: InterviewStage;
  turnCount: number;
  totalQuestions: number;
  transcript: InterviewMessage[];
  scores?: RubricScore;
  startedAt: string;
  completedAt?: string;
  status: InterviewStatus;
}

export interface PeerInterviewRoom {
  id: string;
  roomCode: string;
  interviewerId: string;
  candidateId?: string;
  problemId?: string | number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  codeSnapshot?: string;
  language: string;
  scores?: Partial<RubricScore>;
  feedbackNotes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

