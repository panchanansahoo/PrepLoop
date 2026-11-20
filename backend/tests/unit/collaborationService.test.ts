import { describe, it, expect, beforeEach } from 'vitest';
import collaborationService from '../../services/collaborationService.ts';

describe('CollaborationService Peer Interview & WebRTC Signaling', () => {
  beforeEach(() => {
    collaborationService.sessions.clear();
    collaborationService.users.clear();
  });

  it('creates an interview session with roles and default evaluation state', () => {
    const hostId = 'user-host-1';
    const mockWs = { readyState: 1, send: () => {} };
    collaborationService.users.set(hostId, { ws: mockWs, userId: hostId, sessionId: null });

    collaborationService.createSession(hostId, {
      language: 'python',
      initialCode: 'def solution(): pass',
      role: 'interviewer'
    });

    const user = collaborationService.users.get(hostId);
    expect(user?.sessionId).toBeDefined();

    const session = collaborationService.sessions.get(user!.sessionId!);
    expect(session).toBeDefined();
    expect(session?.roles[hostId]).toBe('interviewer');
    expect(session?.evaluation).toBeNull();
  });

  it('updates participant roles and sets rubric evaluation', () => {
    const hostId = 'user-host-1';
    const candidateId = 'user-candidate-2';
    const sentMessages: string[] = [];

    const mockHostWs = { readyState: 1, send: (msg: string) => sentMessages.push(msg) };
    const mockCandidateWs = { readyState: 1, send: (msg: string) => sentMessages.push(msg) };

    collaborationService.users.set(hostId, { ws: mockHostWs, userId: hostId, sessionId: null });
    collaborationService.users.set(candidateId, { ws: mockCandidateWs, userId: candidateId, sessionId: null });

    collaborationService.createSession(hostId, { role: 'interviewer' });
    const sessionId = collaborationService.users.get(hostId)!.sessionId!;
    collaborationService.joinSession(candidateId, sessionId);

    // Set role
    collaborationService.handleSetRole(hostId, { targetUserId: candidateId, role: 'candidate' });
    const session = collaborationService.sessions.get(sessionId)!;
    expect(session.roles[candidateId]).toBe('candidate');

    // Submit evaluation
    collaborationService.handleEvaluation(hostId, {
      scores: { communication: 9, decomposition: 8, technical: 8.5 },
      feedback: 'Excellent problem solving approach.'
    });

    expect(session.evaluation).not.toBeNull();
    expect(session.evaluation?.submittedBy).toBe(hostId);
    expect(session.evaluation?.scores.communication).toBe(9);
  });

  it('relays WebRTC signaling between participants and handles control requests', () => {
    const hostId = 'user-host-1';
    const candidateId = 'user-candidate-2';
    const receivedByHost: any[] = [];
    const receivedByCandidate: any[] = [];

    const mockHostWs = {
      readyState: 1,
      send: (msg: string) => receivedByHost.push(JSON.parse(msg)),
    };
    const mockCandidateWs = {
      readyState: 1,
      send: (msg: string) => receivedByCandidate.push(JSON.parse(msg)),
    };

    collaborationService.users.set(hostId, { ws: mockHostWs as any, userId: hostId, sessionId: null });
    collaborationService.users.set(candidateId, { ws: mockCandidateWs as any, userId: candidateId, sessionId: null });

    collaborationService.createSession(hostId, { role: 'interviewer' });
    const sessionId = collaborationService.users.get(hostId)!.sessionId!;
    collaborationService.joinSession(candidateId, sessionId);

    // Relay WebRTC offer targeted to candidate
    collaborationService.relayPeerSignal(hostId, 'webrtc_offer', {
      targetUserId: candidateId,
      payload: { sdp: 'fake-offer-sdp', type: 'offer' },
    });

    const offerMsg = receivedByCandidate.find((m) => m.type === 'webrtc_offer');
    expect(offerMsg).toBeDefined();
    expect(offerMsg.senderId).toBe(hostId);
    expect(offerMsg.data.sdp).toBe('fake-offer-sdp');

    // Candidate requests editor control
    collaborationService.handleControlRequest(candidateId, {});
    const controlMsg = receivedByHost.find((m) => m.type === 'control_request');
    expect(controlMsg).toBeDefined();
    expect(controlMsg.userId).toBe(candidateId);
  });

  it('safeSend prevents exceptions when delivering messages to closed sockets', () => {
    const closedWs = {
      readyState: 3, // CLOSED
      send: () => {
        throw new Error('WebSocket is not open: readyState 3 (CLOSED)');
      },
    };
    const openWs = {
      readyState: 1, // OPEN
      sent: [] as string[],
      send(data: string) {
        this.sent.push(data);
      },
    };

    const userClosed = 'user-closed';
    const userOpen = 'user-open';
    collaborationService.users.set(userClosed, { ws: closedWs as any, userId: userClosed, sessionId: null });
    collaborationService.users.set(userOpen, { ws: openWs as any, userId: userOpen, sessionId: null });

    // Should gracefully return without throwing
    expect(() => collaborationService.sendToUser(userClosed, { type: 'test' })).not.toThrow();
    collaborationService.sendToUser(userOpen, { type: 'test' });
    expect(openWs.sent).toHaveLength(1);
  });

  it('promotes the next oldest active participant to host when the current host disconnects', () => {
    const hostId = 'user-host-1';
    const peer1Id = 'user-peer-2';
    const peer2Id = 'user-peer-3';

    const receivedByPeer1: any[] = [];
    const receivedByPeer2: any[] = [];

    const mockHostWs = { readyState: 1, send: () => {} };
    const mockPeer1Ws = { readyState: 1, send: (msg: string) => receivedByPeer1.push(JSON.parse(msg)) };
    const mockPeer2Ws = { readyState: 1, send: (msg: string) => receivedByPeer2.push(JSON.parse(msg)) };

    collaborationService.users.set(hostId, { ws: mockHostWs as any, userId: hostId, sessionId: null });
    collaborationService.users.set(peer1Id, { ws: mockPeer1Ws as any, userId: peer1Id, sessionId: null });
    collaborationService.users.set(peer2Id, { ws: mockPeer2Ws as any, userId: peer2Id, sessionId: null });

    collaborationService.createSession(hostId);
    const sessionId = collaborationService.users.get(hostId)!.sessionId!;
    collaborationService.joinSession(peer1Id, sessionId);
    collaborationService.joinSession(peer2Id, sessionId);

    const session = collaborationService.sessions.get(sessionId)!;
    expect(session.host).toBe(hostId);

    // Host disconnects
    collaborationService.handleDisconnect(hostId);

    // peer1 should be promoted since it joined before peer2
    expect(session.host).toBe(peer1Id);
    expect(session.participants.has(hostId)).toBe(false);

    const hostChangeMsgPeer1 = receivedByPeer1.find((m) => m.type === 'host_changed');
    expect(hostChangeMsgPeer1).toBeDefined();
    expect(hostChangeMsgPeer1.newHost).toBe(peer1Id);
    expect(hostChangeMsgPeer1.previousHost).toBe(hostId);

    const hostChangeMsgPeer2 = receivedByPeer2.find((m) => m.type === 'host_changed');
    expect(hostChangeMsgPeer2).toBeDefined();
    expect(hostChangeMsgPeer2.newHost).toBe(peer1Id);
  });
});

