/**
 * Real-time Collaboration Service (TypeScript)
 * Enables peer-to-peer coding sessions with live code sharing & WebRTC signaling
 */

import { WebSocketServer, type WebSocket } from 'ws';
import { createLogger } from '../utils/structuredLogger.js';
import crypto from 'crypto';
import type { IncomingMessage, Server } from 'http';

const logger = createLogger('collaboration');

export interface CollaborationUser {
  ws: WebSocket | { readyState: number; send: (msg: string) => void };
  userId: string;
  sessionId: string | null;
}

export interface SessionSettings {
  maxParticipants: number;
  allowEditing: boolean;
  requireApproval: boolean;
}

export interface RubricEvaluation {
  submittedBy: string;
  scores: Record<string, number>;
  feedback: string;
  timestamp: number;
}

export interface CollaborationSession {
  id: string;
  host: string;
  participants: Set<string>;
  code: string;
  language: string;
  problem: any | null;
  createdAt: number;
  settings: SessionSettings;
  roles: Record<string, 'interviewer' | 'candidate' | string>;
  evaluation: RubricEvaluation | null;
}

export class CollaborationService {
  sessions: Map<string, CollaborationSession>;
  users: Map<string, CollaborationUser>;
  wss: WebSocketServer | null;

  constructor() {
    this.sessions = new Map<string, CollaborationSession>();
    this.users = new Map<string, CollaborationUser>();
    this.wss = null;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws/collaborate' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    logger.info('Collaboration service initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const userId = this.extractUserId(req);

    if (!userId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    this.users.set(userId, { ws, userId, sessionId: null });

    ws.on('message', (data: Buffer) => {
      this.handleMessage(userId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(userId);
    });

    ws.on('error', (error: Error) => {
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
  handleMessage(userId: string, data: Buffer | string): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'create_session':
          this.createSession(userId, message.data || {});
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

        case 'webrtc_offer':
          this.relayPeerSignal(userId, 'webrtc_offer', message.data);
          break;

        case 'webrtc_answer':
          this.relayPeerSignal(userId, 'webrtc_answer', message.data);
          break;

        case 'ice_candidate':
          this.relayPeerSignal(userId, 'ice_candidate', message.data);
          break;

        case 'set_role':
          this.handleSetRole(userId, message.data);
          break;

        case 'submit_evaluation':
          this.handleEvaluation(userId, message.data);
          break;

        default:
          logger.warn('Unknown message type', { type: message.type });
      }
    } catch (error: any) {
      logger.error('Failed to handle message', { error: error.message });
    }
  }

  /**
   * Create new collaboration session
   */
  createSession(userId: string, data: any = {}): void {
    const sessionId = this.generateSessionId();
    const session: CollaborationSession = {
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
      roles: { [userId]: data.role || 'interviewer' },
      evaluation: null,
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
  joinSession(userId: string, sessionId: string): void {
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

    this.sendToUser(userId, {
      type: 'session_joined',
      session: this.getSessionInfo(session),
    });

    this.broadcastToSession(
      sessionId,
      {
        type: 'participant_joined',
        userId,
      },
      userId
    );

    logger.info('User joined session', { sessionId, userId });
  }

  /**
   * Leave session
   */
  leaveSession(userId: string): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    session.participants.delete(userId);
    user.sessionId = null;

    this.broadcastToSession(session.id, {
      type: 'participant_left',
      userId,
    });

    if (session.participants.size === 0) {
      this.sessions.delete(session.id);
      logger.info('Session deleted', { sessionId: session.id });
    }

    logger.info('User left session', { sessionId: session.id, userId });
  }

  /**
   * Broadcast code changes
   */
  broadcastCodeChange(userId: string, data: any): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    session.code = data.code;

    this.broadcastToSession(
      user.sessionId,
      {
        type: 'code_change',
        userId,
        data: {
          code: data.code,
          changes: data.changes,
          timestamp: Date.now(),
        },
      },
      userId
    );
  }

  /**
   * Broadcast cursor movements
   */
  broadcastCursorMove(userId: string, data: any): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    this.broadcastToSession(
      user.sessionId,
      {
        type: 'cursor_move',
        userId,
        data: {
          line: data.line,
          column: data.column,
        },
      },
      userId
    );
  }

  /**
   * Broadcast chat messages
   */
  broadcastChatMessage(userId: string, data: any): void {
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
  handleControlRequest(userId: string, _data: any): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;

    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    this.sendToUser(session.host, {
      type: 'control_request',
      userId,
    });
  }

  /**
   * Relay WebRTC signaling (offer, answer, ICE candidates)
   */
  relayPeerSignal(senderId: string, signalType: string, data: any = {}): void {
    const user = this.users.get(senderId);
    if (!user || !user.sessionId) return;

    const targetUserId = data.targetUserId;
    if (targetUserId) {
      this.sendToUser(targetUserId, {
        type: signalType,
        senderId,
        data: data.payload || data,
      });
    } else {
      this.broadcastToSession(
        user.sessionId,
        {
          type: signalType,
          senderId,
          data: data.payload || data,
        },
        senderId
      );
    }
  }

  /**
   * Set participant interview role (interviewer vs candidate)
   */
  handleSetRole(userId: string, data: any = {}): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;
    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    if (!session.roles) {
      session.roles = {};
    }
    const targetUserId = data.targetUserId || userId;
    session.roles[targetUserId] = data.role || 'candidate';

    this.broadcastToSession(session.id, {
      type: 'role_updated',
      userId: targetUserId,
      role: data.role || 'candidate',
      roles: session.roles,
    });
  }

  /**
   * Handle rubric evaluation submission
   */
  handleEvaluation(userId: string, data: any = {}): void {
    const user = this.users.get(userId);
    if (!user || !user.sessionId) return;
    const session = this.sessions.get(user.sessionId);
    if (!session) return;

    session.evaluation = {
      submittedBy: userId,
      scores: data.scores || {},
      feedback: data.feedback || '',
      timestamp: Date.now(),
    };

    this.broadcastToSession(session.id, {
      type: 'evaluation_completed',
      evaluation: session.evaluation,
    });
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(userId: string): void {
    this.leaveSession(userId);
    this.users.delete(userId);
    logger.info('User disconnected', { userId });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, message: any): void {
    const user = this.users.get(userId);
    if (user && user.ws && (user.ws as any).readyState === 1) {
      (user.ws as any).send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast to all session participants
   */
  broadcastToSession(sessionId: string, message: any, excludeUserId: string | null = null): void {
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
  getSessionInfo(session: CollaborationSession): any {
    return {
      id: session.id,
      host: session.host,
      participants: Array.from(session.participants),
      code: session.code,
      language: session.language,
      problem: session.problem,
      settings: session.settings,
      roles: session.roles || {},
      evaluation: session.evaluation || null,
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): any[] {
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
  getStatistics(): { activeSessions: number; activeUsers: number; totalParticipants: number } {
    return {
      activeSessions: this.sessions.size,
      activeUsers: this.users.size,
      totalParticipants: Array.from(this.sessions.values()).reduce(
        (sum, s) => sum + s.participants.size,
        0
      ),
    };
  }

  extractUserId(req: IncomingMessage): string | null {
    const url = new URL(req.url || '', 'http://localhost');
    return url.searchParams.get('userId');
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
}

export default new CollaborationService();

