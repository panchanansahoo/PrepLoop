/**
 * Real-time Collaboration Service
 * Enables peer-to-peer coding sessions with live code sharing
 */

import { WebSocketServer } from 'ws';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('collaboration');

class CollaborationService {
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
    this.wss = null;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/collaborate' });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('Collaboration service initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const userId = this.extractUserId(req);
    
    if (!userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    this.users.set(userId, { ws, userId, sessionId: null });

    ws.on('message', (data) => {
      this.handleMessage(userId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(userId);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', { userId, error: error.message });
    });

    this.sendToUser(userId, {
      type: 'connected',
      userId,
    });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'create_session':
          this.createSession(userId, message.data);
          break;
        
        case 'join_session':
          this.joinSession(userId, message.data.sessionId);
          break;
        
        case 'leave_session':
          this.leaveSession(userId);
          break;
        
        case 'code_change':
          this.broadcastCodeChange(userId, message.data);
          break;
        
        case 'cursor_move':
          this.broadcastCursorMove(userId, message.data);
          break;
        
        case 'chat_message':
          this.broadcastChatMessage(userId, message.data);
          break;
        
        case 'request_control':
          this.handleControlRequest(userId, message.data);
          break;
        
        default:
          logger.warn('Unknown message type', { type: message.type });
      }
    } catch (error) {
      logger.error('Failed to handle message', { error: error.message });
    }
  }

  /**
   * Create new collaboration session
   */
  createSession(userId, data) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      host: userId,
      participants: new Set([userId]),
      code: data.initialCode || '',
      language: data.language || 'javascript',
      problem: data.problem || null,
      createdAt: Date.now(),
      settings: {
        maxParticipants: data.maxParticipants || 4,
        allowEditing: data.allowEditing !== false,
        requireApproval: data.requireApproval || false,
      },
    };

    this.sessions.set(sessionId, session);
    
    const user = this.users.get(userId);
    if (user) {
      user.sessionId = sessionId;
    }

    this.sendToUser(userId, {
      type: 'session_created',
      session: this.getSessionInfo(session),
    });

    logger.info('Session created', { sessionId, userId });
  }

  /**
   * Join existing session
   */
  joinSession(userId, sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      this.sendToUser(userId, {
        type: 'error',
        message: 'Session not found',
      });
      return;
    }

    if (session.participants.size >= session.settings.maxParticipants) {
      this.sendToUser(userId, {
        type: 'error',
        message: 'Session is full',
      });
      return;
    }

    session.participants.add(userId);
    
    const user = this.users.get(userId);
    if (user) {
      user.sessionId = sessionId;
    }

    // Send current state to new participant
    this.sendToUser(userId, {
      type: 'session_joined',
      session: this.getSessionInfo(session),
    });

    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: 'participant_joined',
      userId,
    }, userId);

    logger.info('User joined session', { sessionId, userId });
  }

  /**
   * Leave session
   */
  leaveSession(userId) {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    session.participants.delete(userId);
    user.sessionId = null;

    // Notify other participants
    this.broadcastToSession(session.id, {
      type: 'participant_left',
      userId,
    });

    // Delete session if empty
    if (session.participants.size === 0) {
      this.sessions.delete(session.id);
      logger.info('Session deleted', { sessionId: session.id });
    }

    logger.info('User left session', { sessionId: session.id, userId });
  }

  /**
   * Broadcast code changes
   */
  broadcastCodeChange(userId, data) {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    // Update session code
    session.code = data.code;

    // Broadcast to other participants
    this.broadcastToSession(user.sessionId, {
      type: 'code_change',
      userId,
      data: {
        code: data.code,
        changes: data.changes,
        timestamp: Date.now(),
      },
    }, userId);
  }

  /**
   * Broadcast cursor movements
   */
  broadcastCursorMove(userId, data) {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    this.broadcastToSession(user.sessionId, {
      type: 'cursor_move',
      userId,
      data: {
        line: data.line,
        column: data.column,
      },
    }, userId);
  }

  /**
   * Broadcast chat messages
   */
  broadcastChatMessage(userId, data) {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    this.broadcastToSession(user.sessionId, {
      type: 'chat_message',
      userId,
      data: {
        message: data.message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle control request (for turn-based editing)
   */
  handleControlRequest(userId, data) {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    // Notify host
    this.sendToUser(session.host, {
      type: 'control_request',
      userId,
    });
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(userId) {
    this.leaveSession(userId);
    this.users.delete(userId);
    logger.info('User disconnected', { userId });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, message) {
    const user = this.users.get(userId);
    if (user && user.ws.readyState === 1) {
      user.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast to all session participants
   */
  broadcastToSession(sessionId, message, excludeUserId = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants.forEach((participantId) => {
      if (participantId !== excludeUserId) {
        this.sendToUser(participantId, message);
      }
    });
  }

  /**
   * Get session info (without sensitive data)
   */
  getSessionInfo(session) {
    return {
      id: session.id,
      host: session.host,
      participants: Array.from(session.participants),
      code: session.code,
      language: session.language,
      problem: session.problem,
      settings: session.settings,
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      participants: session.participants.size,
      maxParticipants: session.settings.maxParticipants,
      language: session.language,
      createdAt: session.createdAt,
    }));
  }

  /**
   * Get session statistics
   */
  getStatistics() {
    return {
      activeSessions: this.sessions.size,
      activeUsers: this.users.size,
      totalParticipants: Array.from(this.sessions.values())
        .reduce((sum, s) => sum + s.participants.size, 0),
    };
  }

  // Helper methods
  extractUserId(req) {
    // Extract from query params or headers
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('userId');
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new CollaborationService();
