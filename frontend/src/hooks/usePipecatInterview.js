/**
 * usePipecatInterview — React hook for real-time Pipecat voice interaction.
 *
 * Connects to the Pipecat bot via WebSocket, manages audio I/O,
 * and exposes the same interface as useVoiceInterview for drop-in usage.
 *
 * Falls back to the classic useVoiceInterview hook on connection failure.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {Object} PipecatInterviewOptions
 * @property {boolean} speakerMuted - Whether to mute bot audio output
 * @property {Function} getAuthHeaders - Returns auth headers for API calls
 * @property {string} interviewerGender - 'male' or 'female'
 * @property {Function} onAutoSend - Called when silence auto-send triggers
 * @property {Function} onBotTranscript - Called when bot speaks (transcript text)
 * @property {Function} onUserTranscript - Called when user transcript is finalized
 */

// WebSocket message types sent by the Pipecat bot
const MSG_TYPE = {
  BOT_AUDIO: 'bot_audio',
  BOT_TRANSCRIPT: 'bot_transcript',
  USER_TRANSCRIPT: 'user_transcript',
  BOT_STARTED_SPEAKING: 'bot_started_speaking',
  BOT_STOPPED_SPEAKING: 'bot_stopped_speaking',
  ERROR: 'error',
};

export function usePipecatInterview(options = {}) {
  const {
    speakerMuted = false,
    getAuthHeaders,
    interviewerGender,
    onAutoSend,
    onBotTranscript,
    onUserTranscript,
  } = options;

  // ── State ──
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptState] = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // ── Refs ──
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorNodeRef = useRef(null);
  const isListeningRef = useRef(false);
  const isSendingRef = useRef(false);
  const ttsAudioRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const onAutoSendRef = useRef(onAutoSend);
  const silenceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const botAudioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);

  // Keep onAutoSend ref up to date
  useMemo(() => {
    onAutoSendRef.current = onAutoSend;
  }, [onAutoSend]);

  const setTranscript = useCallback((val) => {
    if (typeof val === 'function') {
      setTranscriptState((prev) => {
        const nextVal = val(prev);
        if (!nextVal) finalTranscriptRef.current = '';
        else finalTranscriptRef.current = nextVal;
        return nextVal;
      });
    } else {
      if (!val) finalTranscriptRef.current = '';
      else finalTranscriptRef.current = val;
      setTranscriptState(val);
    }
  }, []);

  // ── Silence Detection ──
  const stopSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(0);
  }, []);

  // ── Audio Playback Queue ──
  const playNextAudio = useCallback(async () => {
    if (isPlayingAudioRef.current) return;
    if (botAudioQueueRef.current.length === 0) return;
    if (speakerMuted) {
      botAudioQueueRef.current = [];
      return;
    }

    isPlayingAudioRef.current = true;
    const audioData = botAudioQueueRef.current.shift();

    try {
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      await new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch {
      // Audio playback failed
    }

    isPlayingAudioRef.current = false;
    // Play next in queue if available
    if (botAudioQueueRef.current.length > 0) {
      playNextAudio();
    }
  }, [speakerMuted]);

  // ── Connect to Pipecat Bot ──
  const connectToBot = useCallback(async (wsUrl) => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setConnectionError(null);
          console.log('[Pipecat] WebSocket connected');
          resolve(true);
        };

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Binary audio data from bot
            botAudioQueueRef.current.push(event.data);
            setAiSpeaking(true);
            playNextAudio();
            return;
          }

          // Text message (JSON)
          try {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
              case MSG_TYPE.BOT_STARTED_SPEAKING:
                setAiSpeaking(true);
                break;

              case MSG_TYPE.BOT_STOPPED_SPEAKING:
                setAiSpeaking(false);
                break;

              case MSG_TYPE.BOT_TRANSCRIPT:
                if (onBotTranscript) onBotTranscript(msg.text);
                break;

              case MSG_TYPE.USER_TRANSCRIPT:
                if (msg.final) {
                  finalTranscriptRef.current += msg.text + ' ';
                  setTranscriptState(finalTranscriptRef.current.trim());
                  if (onUserTranscript) onUserTranscript(msg.text);

                  // Start silence detection after user speaks
                  stopSilenceDetection();
                  if (finalTranscriptRef.current.trim().length > 0) {
                    silenceTimerRef.current = setTimeout(() => {
                      let count = 4;
                      setSilenceCountdown(count);
                      countdownIntervalRef.current = setInterval(() => {
                        count -= 1;
                        if (count > 0) {
                          setSilenceCountdown(count);
                        } else {
                          stopSilenceDetection();
                          if (onAutoSendRef.current) {
                            onAutoSendRef.current();
                          }
                        }
                      }, 1000);
                    }, 2000);
                  }
                } else {
                  // Interim transcript
                  const interim = (finalTranscriptRef.current + msg.text).trim();
                  setTranscriptState(interim);
                }
                break;

              case MSG_TYPE.ERROR:
                console.error('[Pipecat] Bot error:', msg.message);
                break;
            }
          } catch {
            // Non-JSON message, ignore
          }
        };

        ws.onerror = (err) => {
          console.error('[Pipecat] WebSocket error', err);
          setConnectionError('WebSocket connection failed');
          reject(err);
        };

        ws.onclose = () => {
          setConnected(false);
          setIsListening(false);
          isListeningRef.current = false;
          console.log('[Pipecat] WebSocket disconnected');
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [playNextAudio, stopSilenceDetection, onBotTranscript, onUserTranscript]);

  // ── Start Mic Streaming ──
  const startVoiceRecording = useCallback(async () => {
    if (isListeningRef.current) return true;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Use ScriptProcessor for mic audio → WebSocket forwarding
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16
        const buffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        wsRef.current.send(buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      isListeningRef.current = true;
      setIsListening(true);
      return true;
    } catch (err) {
      console.error('[Pipecat] Mic access error:', err);
      return false;
    }
  }, []);

  // ── Stop Mic Streaming ──
  const stopVoiceRecording = useCallback(() => {
    if (processorNodeRef.current) {
      try { processorNodeRef.current.disconnect(); } catch { /* noop */ }
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch { /* noop */ }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* noop */ }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    stopSilenceDetection();
  }, [stopSilenceDetection]);

  // ── Speak Text (sends to bot, or plays locally as fallback) ──
  // In Pipecat mode, the bot handles TTS. This is a no-op for bot-generated speech.
  // But we keep the interface for compatibility with the classic mode.
  const speakInterviewerText = useCallback(async (_text) => {
    // In Pipecat real-time mode, the bot generates and streams audio directly.
    // This function is a no-op — audio comes through the WebSocket.
    return;
  }, []);

  // ── Create Pipecat Session ──
  const createSession = useCallback(async (interviewConfig) => {
    try {
      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};

      const res = await fetch('/api/pipecat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          interviewMode: 'full_realtime',
          ...interviewConfig,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Session creation failed');
      }

      sessionIdRef.current = data.data.sessionId;

      // Wait a moment for the bot to start, then connect
      await new Promise(r => setTimeout(r, 2000));
      await connectToBot(data.data.websocketUrl);

      return data.data;
    } catch (err) {
      setConnectionError(err.message);
      throw err;
    }
  }, [getAuthHeaders, connectToBot]);

  // ── Close Session ──
  const closeSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    // Close WebSocket
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* noop */ }
      wsRef.current = null;
    }

    // Tell backend to kill the bot
    if (sessionId) {
      try {
        const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
        await fetch(`/api/pipecat/session/${sessionId}`, {
          method: 'DELETE',
          headers: { ...headers },
        });
      } catch {
        // Best-effort cleanup
      }
      sessionIdRef.current = null;
    }
  }, [getAuthHeaders]);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    stopVoiceRecording();
    closeSession();
    botAudioQueueRef.current = [];
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch { /* noop */ }
      ttsAudioRef.current = null;
    }
    stopSilenceDetection();
  }, [stopVoiceRecording, closeSession, stopSilenceDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return useMemo(() => ({
    // Same interface as useVoiceInterview
    aiSpeaking,
    setAiSpeaking,
    isListening,
    transcript,
    setTranscript,
    silenceCountdown,
    speakInterviewerText,
    startVoiceRecording,
    stopVoiceRecording,
    isListeningRef,
    isSendingRef,
    ttsAudioRef,
    cleanup,

    // Pipecat-specific
    connected,
    connectionError,
    createSession,
    closeSession,
  }), [
    aiSpeaking,
    isListening,
    transcript,
    silenceCountdown,
    speakInterviewerText,
    startVoiceRecording,
    stopVoiceRecording,
    cleanup,
    connected,
    connectionError,
    createSession,
    closeSession,
  ]);
}

export default usePipecatInterview;
