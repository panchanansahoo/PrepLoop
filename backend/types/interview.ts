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
  changed?: boolean;
  previousDifficulty?: string;
  newDifficulty?: string;
  difficulty?: string;
  direction?: string;
  recommendedDifficulty?: string;
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

export type PerformanceMomentum = 'positive' | 'neutral' | 'negative';

export type FollowUpAction =
  | 'affirm_recovery'
  | 'star_completion'
  | 'volatility_scaffold'
  | 'targeted_correction'
  | 'confidence_rebuild'
  | 'depth_probe'
  | 'deepen'
  | string;

export type FollowUpBranchReason =
  | 'genuine_recovery_detected'
  | 'high_quality_answer'
  | 'volatile_score_pattern'
  | 'missed_core_concepts'
  | 'low_confidence_signal'
  | 'shallow_explanation'
  | string;

export interface FollowUpDecision {
  answerQuality: 'strong' | 'medium' | 'weak';
  missedConcepts: string[];
  confidence: 'high' | 'medium' | 'low';
  depth: 'deep' | 'shallow';
  branchReason: FollowUpBranchReason | string;
  nextAction: FollowUpAction | string;
  improvementArc: string;
  codeSignals: CodeSignals | null;
  starAnalysis: StarAnalysis | null;
  scoreTrend: ScoreTrendAnalysis;
  adaptiveDifficulty?: AdaptiveDifficultyResult;
  momentum: PerformanceMomentum;
  momentumDelta: number;
  recoveryDetected: boolean;
  recoveryPhrase?: string;
  phrasing?: string;
}

export interface FollowUpBranchInput {
  analysis?: {
    score?: number;
    nextFocus?: string[];
    metrics?: Record<string, any>;
    candidateStuck?: boolean;
  };
  interviewContext?: {
    previousScore?: number;
    interviewType?: string;
    missingAreas?: string[];
    currentDifficulty?: string;
    difficulty?: string;
    previousDifficulty?: string;
    lastScoredDifficulty?: string;
    topic?: string;
    currentTopic?: string;
    previousTopic?: string;
    lastInterviewerTopic?: string;
    turns?: number;
    turnNumber?: number;
    stuckCount?: number;
    isSkipped?: boolean;
    isClarification?: boolean;
    answerType?: string;
    turnType?: string;
    sessionId?: string;
    sessionSeed?: number;
    hasPriorScore?: boolean;
    adaptiveFollowUp?: any;
    adaptiveDifficulty?: any;
    [key: string]: any;
  };
  candidateResponse?: string;
  candidateCode?: string;
  scoreHistory?: ScoreHistoryEntry[];
  scoreTrend?: ScoreTrendAnalysis | null;
  turnIndex?: number;
  turnNumber?: number;
  sessionSeed?: number | string;
  phraseIndex?: number;
  forceEnabled?: boolean;
  options?: {
    forceEnabled?: boolean;
    phraseIndex?: number;
    [key: string]: any;
  };
  isSkipped?: boolean;
  isClarification?: boolean;
  answerType?: string;
  turnType?: string;
  difficultyTier?: DifficultyTier | string;
  currentDifficulty?: DifficultyTier | string;
  previousDifficultyTier?: DifficultyTier | string;
  previousDifficulty?: DifficultyTier | string;
  topic?: string;
  previousTopic?: string;
  previousScore?: number;
  hasPreviousTurn?: boolean;
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

export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'staff_architectural';

export type ScaffoldingAction = 'NONE' | 'BREAKDOWN_QUESTION' | 'PROGRESSIVE_HINT';

export interface StageHistoryEntry {
  stage: string;
  atTurn: number;
  reason: string;
}

export interface InterviewStateMachineState {
  interviewType: string;
  difficulty: string;
  companyFocus: string | null;
  totalQuestions: number | null;
  turns: number;
  stagePlan: Array<{ key: string; label: string }>;
  stageIndex: number;
  stage: string;
  stageLabel: string;
  transitionReason: string;
  stageHistory: StageHistoryEntry[];
  consecutiveLowScores: number;
  consecutiveHighScores: number;
  lastScoredDifficulty?: string | null;
  scaffoldingActive: boolean;
  scaffoldingAction: ScaffoldingAction;
  skipChallenge: boolean;
  shouldExtendTechnical: boolean;
  extendedTurnsCount: number;
  isTerminated: boolean;
}

export interface StateMachineAdvanceOptions {
  score?: number | null;
  difficultyTier?: DifficultyTier | string;
  difficulty?: string;
  isSkipped?: boolean;
  isClarification?: boolean;
  answerType?: string;
  turnType?: 'scored' | 'clarification' | 'skipped' | 'unscored' | string;
  isUnscored?: boolean;
  forceEnabled?: boolean;
}

