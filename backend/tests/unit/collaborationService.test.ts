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
});

