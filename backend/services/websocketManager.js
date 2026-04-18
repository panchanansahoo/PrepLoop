import { WebSocketServer } from 'ws';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('websocket-manager');

/**
 * WebSocket Connection Manager
 * Handles real-time connections with automatic reconnection, heartbeat, and message queuing
 */
class WebSocketManager {
  constructor(server, options = {}) {
    this.wss = new WebSocketServer({ 
      server,
      path: options.path || '/ws',
      clientTracking: true,
    });

    this.connections = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of userIds
    this.messageQueue = new Map(); // userId -> Array of queued messages
    
    this.options = {
      heartbeatInterval: options.heartbeatInterval || 30000, // 30s
      maxMessageQueueSize: options.maxMessageQueueSize || 100,
      maxConnectionsPerUser: options.maxConnectionsPerUser || 5,
      ...options,
    };

    this.setupWebSocketServer();
    this.startHeartbeat();
    
    logger.info('WebSocket manager initialized', {
      path: this.options.path,
      heartbeatInterval: this.options.heartbeatInterval,
    });
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', { error: error.message });
    });
  }

  handleConnection(ws, req) {
    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.isAlive = true;
    ws.userId = null;
    ws.rooms = new Set();

    logger.info('WebSocket connection established', { connectionId });

    // Heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket connection error', {
        connectionId,
        error: error.message,
      });
    });

    // Send welcome message
    this.sendToConnection(ws, {
      type: 'connected',
      connectionId,
      timestamp: new Date().toISOString(),
    });
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          this.handleAuth(ws, message);
          break;
        case 'join':
          this.handleJoinRoom(ws, message);
          break;
        case 'leave':
          this.handleLeaveRoom(ws, message);
          break;
        case 'message':
          this.handleUserMessage(ws, message);
          break;
        case 'ping':
          this.sendToConnection(ws, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          logger.warn('Unknown message type', { type: message.type });
      }
    } catch (error) {
      logger.error('Failed to handle message', { error: error.message });
      this.sendToConnection(ws, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  }

  handleAuth(ws, message) {
    const { userId, token } = message;

    // In production, verify token here
    // For now, simple validation
    if (!userId) {
      this.sendToConnection(ws, {
        type: 'auth_error',
        message: 'User ID required',
      });
      return;
    }

    // Check max connections per user
    const userConnections = this.connections.get(userId) || new Set();
    if (userConnections.size >= this.options.maxConnectionsPerUser) {
      this.sendToConnection(ws, {
        type: 'auth_error',
        message: 'Maximum connections reached',
      });
      ws.close();
      return;
    }

    ws.userId = userId;
    userConnections.add(ws);
    this.connections.set(userId, userConnections);

    logger.info('User authenticated', { userId, connectionId: ws.connectionId });

    // Send queued messages
    this.sendQueuedMessages(userId, ws);

    this.sendToConnection(ws, {
      type: 'auth_success',
      userId,
      connectionId: ws.connectionId,
    });
  }

  handleJoinRoom(ws, message) {
    const { roomId } = message;

    if (!ws.userId) {
      this.sendToConnection(ws, {
        type: 'error',
        message: 'Authentication required',
      });
      return;
    }

    ws.rooms.add(roomId);
    
    const room = this.rooms.get(roomId) || new Set();
    room.add(ws.userId);
    this.rooms.set(roomId, room);

    logger.info('User joined room', { userId: ws.userId, roomId });

    // Notify room
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId: ws.userId,
      roomId,
      timestamp: new Date().toISOString(),
    }, ws.userId);

    this.sendToConnection(ws, {
      type: 'room_joined',
      roomId,
      members: Array.from(room),
    });
  }

  handleLeaveRoom(ws, message) {
    const { roomId } = message;

    if (!ws.userId) return;

    ws.rooms.delete(roomId);
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(ws.userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    logger.info('User left room', { userId: ws.userId, roomId });

    // Notify room
    this.broadcastToRoom(roomId, {
      type: 'user_left',
      userId: ws.userId,
      roomId,
      timestamp: new Date().toISOString(),
    });

    this.sendToConnection(ws, {
      type: 'room_left',
      roomId,
    });
  }

  handleUserMessage(ws, message) {
    const { roomId, content, to } = message;

    if (!ws.userId) {
      this.sendToConnection(ws, {
        type: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const messageData = {
      type: 'message',
      from: ws.userId,
      content,
      timestamp: new Date().toISOString(),
    };

    if (to) {
      // Direct message
      this.sendToUser(to, messageData);
    } else if (roomId) {
      // Room message
      this.broadcastToRoom(roomId, messageData, ws.userId);
    }
  }

  handleDisconnection(ws) {
    logger.info('WebSocket connection closed', { 
      connectionId: ws.connectionId,
      userId: ws.userId,
    });

    // Remove from user connections
    if (ws.userId) {
      const userConnections = this.connections.get(ws.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.connections.delete(ws.userId);
        }
      }

      // Leave all rooms
      for (const roomId of ws.rooms) {
        const room = this.rooms.get(roomId);
        if (room) {
          room.delete(ws.userId);
          if (room.size === 0) {
            this.rooms.delete(roomId);
          } else {
            // Notify room
            this.broadcastToRoom(roomId, {
              type: 'user_disconnected',
              userId: ws.userId,
              roomId,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  sendToConnection(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendToUser(userId, data) {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      // Queue message if user is offline
      this.queueMessage(userId, data);
      return false;
    }

    let sent = false;
    for (const ws of userConnections) {
      if (ws.readyState === ws.OPEN) {
        this.sendToConnection(ws, data);
        sent = true;
      }
    }

    return sent;
  }

  broadcastToRoom(roomId, data, excludeUserId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const userId of room) {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, { ...data, roomId });
      }
    }
  }

  broadcast(data, excludeUserId = null) {
    for (const [userId, connections] of this.connections.entries()) {
      if (userId !== excludeUserId) {
        for (const ws of connections) {
          this.sendToConnection(ws, data);
        }
      }
    }
  }

  queueMessage(userId, data) {
    const queue = this.messageQueue.get(userId) || [];
    
    if (queue.length >= this.options.maxMessageQueueSize) {
      queue.shift(); // Remove oldest message
    }

    queue.push({
      data,
      timestamp: Date.now(),
    });

    this.messageQueue.set(userId, queue);
    logger.debug('Message queued', { userId, queueSize: queue.length });
  }

  sendQueuedMessages(userId, ws) {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) return;

    logger.info('Sending queued messages', { userId, count: queue.length });

    for (const { data } of queue) {
      this.sendToConnection(ws, {
        ...data,
        queued: true,
      });
    }

    this.messageQueue.delete(userId);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.warn('Terminating inactive connection', { 
            connectionId: ws.connectionId,
            userId: ws.userId,
          });
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.options.heartbeatInterval);
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      authenticatedUsers: this.connections.size,
      activeRooms: this.rooms.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce(
        (sum, queue) => sum + queue.length,
        0
      ),
      connectionsByUser: Array.from(this.connections.entries()).map(
        ([userId, connections]) => ({
          userId,
          connections: connections.size,
        })
      ).slice(0, 10),
    };
  }

  close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    logger.info('WebSocket manager closed');
  }
}

// Singleton instance
let wsManager = null;

export function initializeWebSocketManager(server, options) {
  if (wsManager) {
    logger.warn('WebSocket manager already initialized');
    return wsManager;
  }

  wsManager = new WebSocketManager(server, options);
  return wsManager;
}

export function getWebSocketManager() {
  if (!wsManager) {
    throw new Error('WebSocket manager not initialized');
  }
  return wsManager;
}

export default {
  initializeWebSocketManager,
  getWebSocketManager,
  WebSocketManager,
};
