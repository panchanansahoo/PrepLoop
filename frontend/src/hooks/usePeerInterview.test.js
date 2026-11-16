/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePeerInterview, DEFAULT_ICE_SERVERS, getIceServers } from './usePeerInterview';
import { DEFAULT_ICE_SERVERS as ROOM_ICE_SERVERS, getIceServers as roomGetIceServers } from '../pages/PeerInterviewRoom';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-1', user_metadata: { full_name: 'Test Engineer' } },
  }),
}));

describe('WebRTC ICE & STUN/TURN Configuration', () => {
  it('provides comprehensive STUN and fallback TURN configuration', () => {
    expect(DEFAULT_ICE_SERVERS).toBeDefined();
    expect(Array.isArray(DEFAULT_ICE_SERVERS)).toBe(true);

    // Verify STUN servers
    const stunEntry = DEFAULT_ICE_SERVERS.find((entry) =>
      entry.urls?.some((u) => u.startsWith('stun:'))
    );
    expect(stunEntry).toBeDefined();
    expect(stunEntry.urls).toContain('stun:stun.l.google.com:19302');
    expect(stunEntry.urls).toContain('stun:stun.cloudflare.com:3478');

    // Verify fallback TURN servers
    const turnEntry = DEFAULT_ICE_SERVERS.find((entry) =>
      entry.urls?.some((u) => u.startsWith('turn:'))
    );
    expect(turnEntry).toBeDefined();
    expect(turnEntry.urls.some((u) => u.includes('metered.ca'))).toBe(true);
    expect(turnEntry.username).toBe('openrelay');
    expect(turnEntry.credential).toBe('openrelay');
  });

  it('getIceServers respects custom ICE configuration and falls back gracefully', () => {
    const custom = [{ urls: 'stun:custom.stun.org:3478' }];
    expect(getIceServers(custom)).toEqual(custom);

    const defaultList = getIceServers();
    expect(defaultList.length).toBeGreaterThanOrEqual(2);
    expect(defaultList[0].urls[0]).toMatch(/stun:/);
  });

  it('PeerInterviewRoom exports matching fallback STUN/TURN configuration contracts', () => {
    expect(ROOM_ICE_SERVERS).toBe(DEFAULT_ICE_SERVERS);
    expect(roomGetIceServers).toBe(getIceServers);
  });
});

describe('usePeerInterview — iceCandidatesQueue buffering', () => {
  let mockWsInstances;
  let mockPcInstances;

  beforeEach(() => {
    mockWsInstances = [];
    mockPcInstances = [];

    // Mock WebSocket
    class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1; // OPEN
        this.send = vi.fn();
        this.close = vi.fn();
        mockWsInstances.push(this);
      }
    }
    globalThis.WebSocket = MockWebSocket;

    // Mock RTCPeerConnection
    class MockRTCPeerConnection {
      constructor(config) {
        this.config = config;
        this.remoteDescription = null;
        this.localDescription = null;
        this.addIceCandidate = vi.fn().mockImplementation(async (cand) => {
          if (!this.remoteDescription) {
            throw new Error('InvalidStateError: remoteDescription is null');
          }
          return Promise.resolve();
        });
        this.setRemoteDescription = vi.fn().mockImplementation(async (desc) => {
          this.remoteDescription = desc;
          return Promise.resolve();
        });
        this.setLocalDescription = vi.fn().mockImplementation(async (desc) => {
          this.localDescription = desc;
          return Promise.resolve();
        });
        this.createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'dummy-offer' });
        this.createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'dummy-answer' });
        this.addTrack = vi.fn();
        this.close = vi.fn();
        mockPcInstances.push(this);
      }
    }
    globalThis.RTCPeerConnection = MockRTCPeerConnection;
    globalThis.RTCSessionDescription = class {
      constructor(init) { Object.assign(this, init); }
    };
    globalThis.RTCIceCandidate = class {
      constructor(init) { Object.assign(this, init); }
    };

    // Mock navigator.mediaDevices
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn(), enabled: true }],
      getVideoTracks: () => [{ stop: vi.fn(), enabled: true }],
      getAudioTracks: () => [{ stop: vi.fn(), enabled: true }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buffers ICE candidates arriving before setRemoteDescription into iceCandidatesQueue', async () => {
    const { result } = renderHook(() => usePeerInterview({ roomCode: 'test-room-101' }));

    const ws = mockWsInstances[0];
    expect(ws).toBeDefined();

    // Simulate ICE candidate arriving before offer/answer setRemoteDescription
    const earlyCandidate = { candidate: 'candidate:1 1 UDP 2122252543 192.168.1.1 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };

    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'ice_candidate',
          data: earlyCandidate,
        }),
      });
    });

    // The candidate must be buffered in iceCandidatesQueue
    expect(result.current.iceCandidatesQueue.current.length).toBe(1);
    expect(result.current.iceCandidatesQueue.current[0]).toEqual(earlyCandidate);

    // Now simulate webrtc_offer arriving and setRemoteDescription resolving
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'webrtc_offer',
          data: { type: 'offer', sdp: 'v=0...' },
        }),
      });
    });

    const pc = mockPcInstances[0];
    expect(pc).toBeDefined();
    expect(pc.setRemoteDescription).toHaveBeenCalled();

    // Queue must now be drained and candidate added to RTCPeerConnection!
    expect(result.current.iceCandidatesQueue.current.length).toBe(0);
    expect(pc.addIceCandidate).toHaveBeenCalledWith(expect.objectContaining(earlyCandidate));
  });

  it('drains iceCandidatesQueue when webrtc_answer resolves remote description on caller side', async () => {
    const { result } = renderHook(() => usePeerInterview({ roomCode: 'test-room-102' }));

    const ws = mockWsInstances[0];

    // Peer joins -> triggers offer creation
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'participant_joined',
          userId: 'remote-peer-2',
        }),
      });
    });

    const pc = mockPcInstances[0];
    expect(pc).toBeDefined();
    // At this point, remoteDescription is not yet set
    expect(pc.remoteDescription).toBeNull();

    // Early ICE candidate arrives before answer
    const remoteCandidate = { candidate: 'candidate:2 1 UDP 2122252543 10.0.0.2 50001 typ host', sdpMid: '0', sdpMLineIndex: 0 };
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'ice_candidate',
          data: remoteCandidate,
        }),
      });
    });

    expect(result.current.iceCandidatesQueue.current.length).toBe(1);

    // Answer arrives
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'webrtc_answer',
          data: { type: 'answer', sdp: 'v=0...' },
        }),
      });
    });

    // Queue must be flushed into addIceCandidate
    expect(result.current.iceCandidatesQueue.current.length).toBe(0);
    expect(pc.addIceCandidate).toHaveBeenCalledWith(expect.objectContaining(remoteCandidate));
  });

  it('clears iceCandidatesQueue on unmount / cleanup', async () => {
    const { result, unmount } = renderHook(() => usePeerInterview({ roomCode: 'test-room-103' }));

    const ws = mockWsInstances[0];
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: 'ice_candidate',
          data: { candidate: 'candidate:3 ...', sdpMid: '0', sdpMLineIndex: 0 },
        }),
      });
    });

    expect(result.current.iceCandidatesQueue.current.length).toBe(1);

    unmount();
    expect(result.current.iceCandidatesQueue.current.length).toBe(0);
  });
});
