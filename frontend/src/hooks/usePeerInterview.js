import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function usePeerInterview({ roomCode, initialRole = 'candidate', initialLanguage = 'javascript' } = {}) {
  const { user } = useAuth();
  const anonIdRef = useRef(`anon_${Math.random().toString(36).substring(2, 9)}`);
  const userId = user?.id || anonIdRef.current;

  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(initialRole);
  const [code, setCode] = useState('// Start typing or paste problem solution here...\n');
  const [language, setLanguage] = useState(initialLanguage);
  const [chatMessages, setChatMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initializing connection...');

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize WebRTC Peer Connection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            data: { payload: event.candidate },
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatusMessage('Peer connected via WebRTC');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatusMessage('Peer video disconnected');
      }
    };

    // Attach local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pcRef.current = pc;
    return pc;
  }, []);

  // Initialize Local Media (Camera + Mic)
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (pcRef.current) {
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
        });
      }
    } catch (err) {
      console.warn('Camera/mic access unavailable, falling back to code-only mode:', err);
      setStatusMessage('Audio/Video disabled - Running in Code-Only mode');
    }
  }, []);

  // Initialize Local Media on mount
  useEffect(() => {
    startMedia();
  }, [startMedia]);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const token = localStorage.getItem('token') || '';
    let wsBase = `${protocol}//${import.meta.env.PROD ? window.location.host : `${host}:5000`}`;
    if (API_URL) {
      try {
        const parsedApi = new URL(API_URL, window.location.origin);
        const wsProto = parsedApi.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBase = `${wsProto}//${parsedApi.host}`;
      } catch {
        // Keep fallback wsBase
      }
    }
    const wsUrl = import.meta.env.VITE_WS_URL || `${wsBase}/ws/collaborate?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatusMessage('Connected to room signaling server');

      // If roomCode provided, join existing; else create new
      if (roomCode) {
        ws.send(JSON.stringify({
          type: 'join_session',
          data: { sessionId: roomCode },
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'create_session',
          data: {
            initialCode: code,
            language,
            role: initialRole,
          },
        }));
      }
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'session_created':
          case 'session_joined': {
            setSession(message.session);
            if (message.session.code) setCode(message.session.code);
            if (message.session.language) setLanguage(message.session.language);
            if (message.session.evaluation) setEvaluation(message.session.evaluation);
            setStatusMessage(`In session: ${message.session.id}`);

            // Start media after session joined
            await startMedia();
            break;
          }

          case 'participant_joined': {
            setStatusMessage(`A peer has joined the room!`);
            // Host creates WebRTC offer
            const pc = createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({
              type: 'webrtc_offer',
              data: { payload: offer },
            }));
            break;
          }

          case 'webrtc_offer': {
            const pc = createPeerConnection();
            await pc.setRemoteDescription(new RTCSessionDescription(message.data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({
              type: 'webrtc_answer',
              data: { payload: answer },
            }));
            break;
          }

          case 'webrtc_answer': {
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
            }
            break;
          }

          case 'ice_candidate': {
            if (pcRef.current && message.data) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(message.data));
              } catch (e) {
                console.warn('Error adding ICE candidate:', e);
              }
            }
            break;
          }

          case 'code_change': {
            if (message.data?.code !== undefined) {
              setCode(message.data.code);
            }
            break;
          }

          case 'chat_message': {
            setChatMessages((prev) => [...prev, message.data]);
            break;
          }

          case 'role_updated': {
            if (message.userId === userId) {
              setRole(message.role);
            }
            break;
          }

          case 'evaluation_completed': {
            setEvaluation(message.evaluation);
            setStatusMessage('Interview evaluation finalized!');
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing incoming WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setStatusMessage('Disconnected from room');
    };

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave_session' }));
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomCode, userId]);

  // Sync Code Changes
  const updateCode = useCallback((newCode) => {
    setCode(newCode);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'code_change',
          data: { code: newCode },
        })
      );
    }
  }, []);

  // Send Chat Message
  const sendChatMessage = useCallback((text) => {
    if (!text.trim()) return;
    const msg = {
      senderId: userId,
      senderName: user?.user_metadata?.full_name || 'Engineer',
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          data: msg,
        })
      );
    }
  }, [userId, user]);

  // Submit Rubric Evaluation
  const submitEvaluation = useCallback((scores, feedback) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'submit_evaluation',
          data: { scores, feedback },
        })
      );
    }
  }, []);

  // Toggle Mute
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, []);

  return {
    connected,
    session,
    role,
    setRole,
    code,
    updateCode,
    language,
    setLanguage,
    chatMessages,
    sendChatMessage,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    startMedia,
    evaluation,
    submitEvaluation,
    statusMessage,
  };
}

