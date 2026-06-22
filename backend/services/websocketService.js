import { WebSocketServer } from 'ws';
import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const logger = createLogger('websocket');

const clients = new Map();
const rooms = new Map();

export const initWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    verifyClient: async (info, callback) => {
      try {
        const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
        
        if (!token) {
          callback(false, 401, 'Unauthorized');
          return;
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
          callback(false, 403, 'Invalid token');
          return;
        }

        info.req.user = user;
        callback(true);
      } catch (err) {
        logger.error('WebSocket auth failed', { error: err.message });
        callback(false, 500, 'Internal error');
      }
    }
  });

  wss.on('connection', (ws, req) => {
    const userId = req.user.id;
    const clientId = `${userId}-${Date.now()}`;
    
    clients.set(clientId, { ws, userId, rooms: new Set() });
    
    logger.info('WebSocket connected', { userId, clientId });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (err) {
        logger.error('WebSocket message error', { error: err.message });
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      const client = clients.get(clientId);
      if (client) {
        client.rooms.forEach(roomId => leaveRoom(clientId, roomId));
        clients.delete(clientId);
      }
      logger.info('WebSocket disconnected', { userId, clientId });
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { userId, error: err.message });
    });

    ws.send(JSON.stringify({ type: 'connected', clientId }));
  });

  logger.info('WebSocket server initialized');
  return wss;
};

const handleMessage = (clientId, message) => {
  const { type, payload } = message;

  switch (type) {
    case 'join_room':
      joinRoom(clientId, payload.roomId);
      break;
    
    case 'leave_room':
      leaveRoom(clientId, payload.roomId);
      break;
    
    case 'room_message':
      broadcastToRoom(payload.roomId, {
        type: 'room_message',
        payload: {
          ...payload,
          clientId,
          timestamp: new Date().toISOString()
        }
      }, clientId);
      break;
    
    case 'interview_update':
      broadcastToRoom(payload.sessionId, {
        type: 'interview_update',
        payload
      });
      break;
    
    case 'typing':
      broadcastToRoom(payload.roomId, {
        type: 'typing',
        payload: { userId: clients.get(clientId)?.userId, isTyping: payload.isTyping }
      }, clientId);
      break;
    
    default:
      logger.warn('Unknown message type', { type, clientId });
  }
};

const joinRoom = (clientId, roomId) => {
  const client = clients.get(clientId);
  if (!client) return;

  client.rooms.add(roomId);
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(clientId);

  logger.info('Client joined room', { clientId, roomId });

  broadcastToRoom(roomId, {
    type: 'user_joined',
    payload: { userId: client.userId, roomId }
  });
};

const leaveRoom = (clientId, roomId) => {
  const client = clients.get(clientId);
  if (!client) return;

  client.rooms.delete(roomId);
  
  const room = rooms.get(roomId);
  if (room) {
    room.delete(clientId);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }

  logger.info('Client left room', { clientId, roomId });

  broadcastToRoom(roomId, {
    type: 'user_left',
    payload: { userId: client.userId, roomId }
  });
};

const broadcastToRoom = (roomId, message, excludeClientId = null) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  let sent = 0;

  room.forEach(clientId => {
    if (clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(messageStr);
      sent++;
    }
  });

  logger.debug('Broadcast to room', { roomId, recipients: sent });
};

export const broadcastToUser = (userId, message) => {
  let sent = 0;
  
  clients.forEach((client, _clientId) => {
    if (client.userId === userId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
      sent++;
    }
  });

  logger.debug('Broadcast to user', { userId, connections: sent });
};

export const getActiveConnections = () => {
  return {
    total: clients.size,
    rooms: rooms.size,
    users: new Set([...clients.values()].map(c => c.userId)).size
  };
};
