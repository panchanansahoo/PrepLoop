import { InterviewCacheManager } from './interviewCacheManager.js';
import { InterviewSimulatorService } from './aiService.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('CachedInterviewService');

/**
 * Cached Interview Service
 * Wraps the InterviewSimulatorService with caching functionality
 */
export class CachedInterviewService {
  /**
   * Get interview session with caching
   */
  static async getInterviewSession(sessionId, userId, requestId = null) {
    const cacheKey = `interview_session_${sessionId}`;
    
    // Try to get from cache first
    let cachedSession = await InterviewCacheManager.get(cacheKey);
    
    if (cachedSession && cachedSession.user_id === userId) {
      logger.info('Cache hit for interview session', { sessionId, userId, requestId });
      return cachedSession;
    }
    
    logger.info('Cache miss for interview session, fetching from DB', { sessionId, userId, requestId });
    // If not in cache, get from the original service
    const session = await InterviewSimulatorService.getInterviewSession(sessionId, userId);
    
    // Cache the result
    if (session) {
      await InterviewCacheManager.set(cacheKey, session);
    }
    
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
    
    await InterviewCacheManager.set(cacheKey, sessionMetadata);
    logger.info('Cached new interview session', { sessionId: result.sessionId, userId, requestId });
    
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
      
      await InterviewCacheManager.set(cacheKey, sessionMetadata);
      logger.info('Updated cached interview session after response', { sessionId, userId, requestId, stage: result.stage });
      
      return result;
    } catch (error) {
      logger.error('Error processing interview response', { error: error.message, sessionId, userId, requestId });
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
   * Complete interview and update cache
   */
  static async completeInterview(sessionId, userId, requestId = null) {
    const result = await InterviewSimulatorService.completeInterview(sessionId, userId, requestId);
    
    const cacheKey = `interview_session_${sessionId}`;
    // Instead of deleting, we update with the completed state to trigger longer TTL
    const cachedSession = await InterviewCacheManager.get(cacheKey);
    if (cachedSession) {
      cachedSession.stage = 'completed';
      cachedSession.continueInterview = false;
      await InterviewCacheManager.set(cacheKey, cachedSession);
      logger.info('Marked cached interview session as completed (extended TTL)', { sessionId, userId, requestId });
    }
    
    return result;
  }
  
  /**
   * Get cached session if available
   */
  static async getCachedSession(sessionId) {
    return await InterviewCacheManager.get(`interview_session_${sessionId}`);
  }
  
  /**
   * Clear session from cache
   */
  static async clearCachedSession(sessionId) {
    const cacheKey = `interview_session_${sessionId}`;
    logger.info('Explicitly clearing cached session', { sessionId });
    return await InterviewCacheManager.del(cacheKey);
  }
}