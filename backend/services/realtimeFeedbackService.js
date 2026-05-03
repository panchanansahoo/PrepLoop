/**
 * Real-time Feedback Service
 * Provides live feedback during interviews via WebSocket
 * Tracks performance metrics and sends notifications to frontend
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('realtime-feedback');

export class RealtimeFeedbackService {
  constructor(websocketManager) {
    this.ws = websocketManager;
    this.sessionMetrics = new Map(); // sessionId -> { scores, behaviors, hints }
  }

  /**
   * Initialize feedback tracking for an interview session
   */
  initializeSession(sessionId, userId, options = {}) {
    const metrics = {
      sessionId,
      userId,
      questions: [],
      currentQuestion: null,
      overallMetrics: {
        clarity: 0,
        structure: 0,
        engagement: 0,
        confidence: 0,
        technicalDepth: 0,
      },
      behaviorAlerts: [],
      hints: [],
      startTime: Date.now(),
      ...options,
    };

    this.sessionMetrics.set(sessionId, metrics);
    logger.info('Feedback session initialized', { sessionId, userId });
    
    return metrics;
  }

  /**
   * Update real-time metrics during question
   * Called every few seconds as candidate answers
   */
  updateLiveMetrics(sessionId, metricsData) {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return null;

    // Update metrics
    const {
      clarity = 0,
      structure = 0,
      engagement = 0,
      confidence = 0,
      technicalDepth = 0,
      timeSpent = 0,
    } = metricsData;

    // Calculate running average
    const count = (session.currentQuestion?.updateCount || 0) + 1;
    session.currentQuestion = {
      ...session.currentQuestion,
      clarity: ((session.currentQuestion?.clarity || 0) * (count - 1) + clarity) / count,
      structure: ((session.currentQuestion?.structure || 0) * (count - 1) + structure) / count,
      engagement: ((session.currentQuestion?.engagement || 0) * (count - 1) + engagement) / count,
      confidence: ((session.currentQuestion?.confidence || 0) * (count - 1) + confidence) / count,
      technicalDepth: ((session.currentQuestion?.technicalDepth || 0) * (count - 1) + technicalDepth) / count,
      timeSpent,
      updateCount: count,
    };

    return session.currentQuestion;
  }

  /**
   * Send score toast to frontend
   * Appears briefly when candidate completes answer to question
   */
  broadcastScoreFeedback(sessionId, scoreData) {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return;

    const {
      questionNumber = 0,
      score = 0, // 0-100
      performanceLevel = 'average', // excellent, good, average, needs-improvement
      feedback = '',
    } = scoreData;

    // Emit via WebSocket
    this.emitToSession(sessionId, 'score-feedback', {
      questionNumber,
      score,
      performanceLevel,
      feedback,
      timestamp: Date.now(),
    });

    logger.info('Score feedback sent', { sessionId, questionNumber, score });
  }

  /**
   * Detect real-time behaviors and send alerts
   * Examples: hedge words, speaking too fast, too long pause, etc.
   */
  broadcastBehaviorAlert(sessionId, alertData) {
    const {
      type = '', // hedge-words, speaking-fast, long-pause, low-confidence, etc.
      severity = 'low', // low, medium, high
      message = '',
      suggestion = '',
    } = alertData;

    if (!message) return;

    // Only send high/medium severity alerts (avoid overloading user)
    if (severity === 'high' || severity === 'medium') {
      this.emitToSession(sessionId, 'behavior-alert', {
        type,
        severity,
        message,
        suggestion,
        timestamp: Date.now(),
      });

      logger.debug('Behavior alert sent', { sessionId, type, severity });
    }
  }

  /**
   * Send intelligent hints when candidate is stuck
   * Based on performance and question difficulty
   */
  broadcastHint(sessionId, hintData) {
    const {
      hintLevel = 1, // 1-3: from gentle to very explicit
      message = '',
      category = '', // clarification, depth, example, alternative-approach
    } = hintData;

    if (!message) return;

    this.emitToSession(sessionId, 'hint-suggestion', {
      hintLevel,
      message,
      category,
      timestamp: Date.now(),
    });

    logger.info('Hint sent', { sessionId, hintLevel, category });
  }

  /**
   * Send performance indicator update (live metrics display)
   * Updates dashboards in real-time
   */
  broadcastPerformanceIndicator(sessionId, indicatorData) {
    const {
      clarity = 0, // 0-100
      structure = 0,
      engagement = 0,
      confidence = 0,
      technicalDepth = 0,
      overallScore = 0,
    } = indicatorData;

    this.emitToSession(sessionId, 'performance-update', {
      metrics: {
        clarity,
        structure,
        engagement,
        confidence,
        technicalDepth,
        overall: overallScore,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Send confidence indicator (visual cues about performance)
   * Examples: "On track", "Needs work", "Excellent", etc.
   */
  broadcastConfidenceIndicator(sessionId, level) {
    // level: 'strong' (75-100), 'good' (60-75), 'fair' (40-60), 'struggling' (0-40)
    const indicators = {
      strong: { color: 'green', message: 'Strong performance' },
      good: { color: 'blue', message: 'Good progress' },
      fair: { color: 'yellow', message: 'Room for improvement' },
      struggling: { color: 'red', message: 'Consider asking for hints' },
    };

    const indicator = indicators[level] || indicators.fair;

    this.emitToSession(sessionId, 'confidence-indicator', {
      level,
      ...indicator,
      timestamp: Date.now(),
    });
  }

  /**
   * End session and send final summary
   */
  completeSession(sessionId, summaryData = {}) {
    const session = this.sessionMetrics.get(sessionId);
    if (!session) return;

    this.emitToSession(sessionId, 'session-complete', {
      summary: summaryData,
      timestamp: Date.now(),
    });

    // Clean up
    this.sessionMetrics.delete(sessionId);
    logger.info('Feedback session completed', { sessionId });
  }

  /**
   * Emit message to specific session's connected clients
   */
  emitToSession(sessionId, eventType, data) {
    if (!this.ws) {
      logger.warn('WebSocket manager not available');
      return;
    }

    try {
      this.ws.broadcastToRoom(sessionId, {
        type: eventType,
        data,
      });
    } catch (error) {
      logger.error('Failed to emit feedback event', {
        sessionId,
        eventType,
        error: error.message,
      });
    }
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(sessionId) {
    return this.sessionMetrics.get(sessionId);
  }

  /**
   * Clear session metrics
   */
  clearSession(sessionId) {
    this.sessionMetrics.delete(sessionId);
  }
}

export default RealtimeFeedbackService;
