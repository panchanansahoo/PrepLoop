import NodeCache from 'node-cache';
import { InterviewSimulatorService } from './aiService.js';

// Initialize cache with 10 minute TTL for interview data
const interviewCache = new NodeCache({ stdTTL: 600, checkperiod: 630 });

/**
 * Cached Interview Service
 * Wraps the InterviewSimulatorService with caching functionality
 */
export class CachedInterviewService {
  /**
   * Get interview session with caching
   */
  static async getInterviewSession(sessionId, userId) {
    // Try to get from cache first
    const cacheKey = `interview_session_${sessionId}`;
    const cachedSession = interviewCache.get(cacheKey);
    
    if (cachedSession && cachedSession.user_id === userId) {
      return cachedSession;
    }
    
    // If not in cache, get from the original service
    const session = await InterviewSimulatorService.getInterviewSession(sessionId, userId);
    
    // Cache the result
    interviewCache.set(cacheKey, session);
    
    return session;
  }
  
  /**
   * Initialize interview with caching
   */
  static async initializeInterview(
    userId,
    interviewType = 'dsa',
    difficulty = 'medium',
    companyFocus = null,
    requestId = null,
    interviewMode = null,
    totalQuestions = null
  ) {
    const result = await InterviewSimulatorService.initializeInterview(
      userId,
      interviewType,
      difficulty,
      companyFocus,
      requestId,
      interviewMode,
      totalQuestions
    );
    
    // Cache the new session
    const cacheKey = `interview_session_${result.sessionId}`;
    // We'll cache the session metadata for quick lookup
    const sessionMetadata = {
      sessionId: result.sessionId,
      userId,
      interviewType,
      difficulty,
      companyFocus,
      stage: result.stage,
      stageLabel: result.stageLabel
    };
    
    interviewCache.set(cacheKey, sessionMetadata);
    
    return result;
  }
  
  /**
   * Process interview response with caching
   */
  static async processInterviewResponse(sessionId, userId, candidateResponse, requestId = null, interviewMode = null) {
    try {
      const result = await InterviewSimulatorService.processInterviewResponse(
        sessionId, 
        userId, 
        candidateResponse, 
        requestId, 
        interviewMode
      );
      
      // Update cache with latest session state
      const cacheKey = `interview_session_${sessionId}`;
      const sessionMetadata = {
        sessionId,
        userId,
        stage: result.stage,
        stageLabel: result.stageLabel,
        current_scores: result.current_scores,
        continueInterview: result.continueInterview
      };
      
      interviewCache.set(cacheKey, sessionMetadata);
      
      return result;
    } catch (_error) {
      // Return graceful fallback response
      return {
        interviewerMessage: "I'm having trouble processing your response. Could you rephrase?",
        feedback: 'Response processing temporarily unavailable. Please try again.',
        clarifications: [],
        hints: [],
        encouragement: 'No worries, let\'s try again.',
        continueInterview: true,
        fallback: true,
        error: true
      };
    }
  }
  
  /**
   * Complete interview and remove from cache
   */
  static async completeInterview(sessionId, userId, requestId = null) {
    const result = await InterviewSimulatorService.completeInterview(sessionId, userId, requestId);
    
    // Remove from cache since interview is completed
    const cacheKey = `interview_session_${sessionId}`;
    interviewCache.del(cacheKey);
    
    return result;
  }
  
  /**
   * Get cached session if available
   */
  static getCachedSession(sessionId) {
    return interviewCache.get(`interview_session_${sessionId}`);
  }
  
  /**
   * Clear session from cache
   */
  static clearCachedSession(sessionId) {
    const cacheKey = `interview_session_${sessionId}`;
    return interviewCache.del(cacheKey);
  }
}