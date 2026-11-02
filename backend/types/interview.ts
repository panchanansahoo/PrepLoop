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

export interface TypeRubricWeights {
  communication: number;
  decomposition: number;
  technical: number;
}

export interface RollingScoresResult {
  overall: number;
  communication: number;
  problem_solving: number;
  technical_depth: number;
  performance_level: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
}

export interface AdaptiveDifficultyResult {
  changed: boolean;
  previousDifficulty: string;
  newDifficulty: string;
  reason: string;
}

export interface ScoreHistoryEntry {
  score: number;
  turn: number;
}

export interface ScoreTrendAnalysis {
  mean: number;
  stdDev: number;
  trend: 'stable' | 'improving' | 'declining';
  volatility: 'stable' | 'moderate' | 'volatile';
  delta: number;
}

export interface CandidateTelemetry {
  speakingRateWpm?: number;
  fillerWordCount?: number;
  pauseDurationSec?: number;
  confidenceScore?: number;
  sentimentPolarity?: number;
  latencyMs?: number;
  turnIndex?: number;
  audioDurationSeconds?: number;
  recordedAt?: string;
}

export interface CodeSignals {
  hasErrorHandling: boolean;
  hasEdgeCases: boolean;
  hasComments: boolean;
  hasFunctions: boolean;
  lineCount: number;
}

export interface StarAnalysis {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
}

export interface FollowUpDecision {
  answerQuality: 'strong' | 'medium' | 'weak';
  missedConcepts: string[];
  confidence: 'high' | 'medium' | 'low';
  depth: 'deep' | 'shallow';
  branchReason: string;
  nextAction: string;
  improvementArc: string;
  codeSignals: CodeSignals | null;
  starAnalysis: StarAnalysis | null;
  scoreTrend: ScoreTrendAnalysis;
}

export interface FollowUpBranchInput {
  analysis?: {
    score?: number;
    nextFocus?: string[];
    metrics?: Record<string, any>;
  };
  interviewContext?: {
    previousScore?: number;
    interviewType?: string;
    missingAreas?: string[];
  };
  candidateResponse?: string;
  candidateCode?: string;
  scoreHistory?: ScoreHistoryEntry[];
  scoreTrend?: ScoreTrendAnalysis | null;
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
  telemetry?: CandidateTelemetry[];
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
