import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, Sparkles, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';
import { authFetch } from '../utils/authFetch';

import { API_URL } from '../config/api.js';
const CHAT_QUERY_COST = Number(import.meta.env.VITE_AI_CHAT_COIN_COST ?? 0);
const VOICE_MODE_STORAGE_KEY = 'pg-ai-assistant-voice-enabled';
const VOICE_AUTO_SEND_STORAGE_KEY = 'pg-ai-assistant-voice-auto-send';
const WAKE_WORD_MODE_STORAGE_KEY = 'pg-ai-assistant-wake-word-enabled';
const WAKE_WORD_LIST = ['hi prep', 'hey prep', 'hello prep'];
const WAKE_WORD_PREFIX_REGEX = /^\s*(hi|hey|hello)\s+prep\s*/i;
const readVoiceModeDefault = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(VOICE_MODE_STORAGE_KEY) === '1';
};
const readVoiceAutoSendDefault = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(VOICE_AUTO_SEND_STORAGE_KEY) === '1';
};
const readWakeWordDefault = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WAKE_WORD_MODE_STORAGE_KEY) === '1';
};

export default function AIAssistantOrb() {
  const { user } = useAuth();
  const { coins, refreshBalance } = useCoins();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(readVoiceModeDefault);
  const [voiceAutoSend, setVoiceAutoSend] = useState(readVoiceAutoSendDefault);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(readWakeWordDefault);
  const [wakeWordArmed, setWakeWordArmed] = useState(false);
  const [wakeWordStatus, setWakeWordStatus] = useState('');
  const [wakeWordBlocked, setWakeWordBlocked] = useState(false);
  const [wakeNeedsTap, setWakeNeedsTap] = useState(false);
  const [speechInputSupported, setSpeechInputSupported] = useState(false);
  const [speechOutputSupported, setSpeechOutputSupported] = useState(false);
  const [hovered, setHovered] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const wakeRecognitionRef = useRef(null);

  // Load chat history on open
  useEffect(() => {
    if (open && user && messages.length === 0) {
      loadHistory();
    }
  }, [open, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    const hasSpeechOutput = typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && 'SpeechSynthesisUtterance' in window;
    const hasSpeechInput = typeof window !== 'undefined'
      && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    setSpeechOutputSupported(hasSpeechOutput);
    setSpeechInputSupported(hasSpeechInput);

    return () => {
      if (hasSpeechOutput) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
      if (wakeRecognitionRef.current) {
        try {
          wakeRecognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(VOICE_MODE_STORAGE_KEY, voiceEnabled ? '1' : '0');
    if (!voiceEnabled && speechOutputSupported) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled, speechOutputSupported]);

  useEffect(() => {
    localStorage.setItem(VOICE_AUTO_SEND_STORAGE_KEY, voiceAutoSend ? '1' : '0');
  }, [voiceAutoSend]);

  useEffect(() => {
    localStorage.setItem(WAKE_WORD_MODE_STORAGE_KEY, wakeWordEnabled ? '1' : '0');
  }, [wakeWordEnabled]);

  const stopWakeWordRecognition = () => {
    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.onend = null;
        wakeRecognitionRef.current.stop();
      } catch {
        // no-op
      }
      wakeRecognitionRef.current = null;
    }
    setWakeWordArmed(false);
    setWakeWordStatus('');
    setWakeWordBlocked(false);
    setWakeNeedsTap(false);
  };

  const primeWakeWordPermission = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      setWakeWordBlocked(true);
      setWakeWordStatus('Allow microphone access to use "Hi Prep" wake mode.');
      return false;
    }
  };

  const speakAssistantResponse = (text) => {
    if (!voiceEnabled || !speechOutputSupported || !text?.trim() || wakeWordEnabled) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Gracefully degrade if browser voice playback fails.
    }
  };

  // Canvas animation for the orb's inner glow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    let time = 0;

    const animate = () => {
      time += 0.008;
      ctx.clearRect(0, 0, size, size);

      // Draw multiple animated gradient blobs
      const blobs = [
        { x: size * 0.35 + Math.sin(time * 1.2) * 20, y: size * 0.55 + Math.cos(time * 0.8) * 15, r: 55, color1: 'rgba(139, 92, 246, 0.9)', color2: 'rgba(139, 92, 246, 0)' },
        { x: size * 0.65 + Math.cos(time * 0.9) * 18, y: size * 0.45 + Math.sin(time * 1.1) * 20, r: 50, color1: 'rgba(236, 72, 153, 0.85)', color2: 'rgba(236, 72, 153, 0)' },
        { x: size * 0.45 + Math.sin(time * 0.7) * 25, y: size * 0.65 + Math.cos(time * 1.3) * 12, r: 60, color1: 'rgba(6, 182, 212, 0.8)', color2: 'rgba(6, 182, 212, 0)' },
        { x: size * 0.55 + Math.cos(time * 1.5) * 15, y: size * 0.35 + Math.sin(time * 0.6) * 22, r: 45, color1: 'rgba(239, 68, 68, 0.7)', color2: 'rgba(239, 68, 68, 0)' },
        { x: size * 0.5 + Math.sin(time * 0.5) * 10, y: size * 0.5 + Math.cos(time * 0.9) * 10, r: 40, color1: 'rgba(52, 211, 153, 0.6)', color2: 'rgba(52, 211, 153, 0)' },
      ];

      // Apply circular clipping for the orb shape
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.clip();

      // Dark base
      ctx.fillStyle = 'rgba(10, 5, 20, 0.6)';
      ctx.fillRect(0, 0, size, size);

      // Render blobs with additive-like blending
      ctx.globalCompositeOperation = 'screen';
      blobs.forEach(blob => {
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        grad.addColorStop(0, blob.color1);
        grad.addColorStop(1, blob.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      });

      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/chat/history`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map(m => ({ role: m.role, content: m.content })));
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const sendUserMessage = async (userMsg, { clearInput = true } = {}) => {
    if (!userMsg?.trim() || loading) return;

    if (clearInput) {
      setInput('');
    }

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // no-op
      }
      setIsListening(false);
    }

    try {
      const res = await authFetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        speakAssistantResponse(data.response);
        refreshBalance();
      } else {
        const data = await res.json().catch(() => ({}));
        const errorText = data?.error === 'Insufficient coins'
          ? `You need ${data.required || CHAT_QUERY_COST} coins to use chat. Current balance: ${data.coins ?? coins}.`
          : (data?.error || 'Sorry, something went wrong. Please try again.');
        setMessages(prev => [...prev, { role: 'assistant', content: errorText }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendUserMessage(input.trim(), { clearInput: true });
  };

  const handleWakeWordResult = (transcriptRaw) => {
    const transcript = (transcriptRaw || '').toLowerCase().trim();
    if (!transcript) return;

    const matchedWake = WAKE_WORD_LIST.some((phrase) => transcript.includes(phrase));
    const cleanedImmediateCommand = (transcriptRaw || '')
      .replace(WAKE_WORD_PREFIX_REGEX, '')
      .replace(/^\s*prep\s*/i, '')
      .trim();

    if (!wakeWordArmed && matchedWake) {
      if (cleanedImmediateCommand) {
        setOpen(true);
        setWakeWordStatus('Sending your request...');
        sendUserMessage(cleanedImmediateCommand, { clearInput: true });
        setTimeout(() => {
          setWakeWordStatus(wakeWordEnabled ? 'Listening for "Hi Prep"...' : '');
        }, 1200);
        return;
      }

      setWakeWordArmed(true);
      setWakeWordStatus('Prep is listening...');
      setOpen(true);
      return;
    }

    if (!wakeWordArmed) return;

    const cleaned = transcriptRaw
      .replace(WAKE_WORD_PREFIX_REGEX, '')
      .replace(/^\s*prep\s*/i, '')
      .trim();

    if (!cleaned) {
      setWakeWordStatus('Say your command for Prep.');
      return;
    }

    setWakeWordStatus('Sending your request...');
    sendUserMessage(cleaned, { clearInput: true });
    setWakeWordArmed(false);
    setTimeout(() => {
      setWakeWordStatus(wakeWordEnabled ? 'Listening for "Hi Prep"...' : '');
    }, 1200);
  };

  const startWakeWordRecognition = () => {
    if (!speechInputSupported || !wakeWordEnabled || wakeWordBlocked) return;
    if (wakeRecognitionRef.current) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      setWakeWordStatus('Listening for "Hi Prep"...');
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          handleWakeWordResult(event.results[i][0].transcript || '');
        }
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error || '';
      if (code === 'no-speech' || code === 'aborted') {
        return;
      }

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setWakeWordBlocked(true);
        setWakeWordStatus('Wake mode blocked. Please allow microphone access.');
        return;
      }

      if (code === 'network') {
        setWakeWordStatus('Wake mode temporary network issue. Retrying...');
      } else {
        setWakeWordStatus('Wake mode unavailable. Retrying...');
      }
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      if (!wakeWordEnabled || wakeWordBlocked) return;
      // Keep wake-word mode alive after natural pauses.
      setTimeout(() => {
        if (wakeWordEnabled && !wakeWordBlocked) {
          startWakeWordRecognition();
        }
      }, 300);
    };

    wakeRecognitionRef.current = recognition;
    try {
      recognition.start();
      setWakeNeedsTap(false);
    } catch {
      wakeRecognitionRef.current = null;
      setWakeNeedsTap(true);
      setWakeWordStatus('Tap wake button again to start listening.');
    }
  };

  const startWakeWordFlow = async () => {
    setWakeWordBlocked(false);
    const granted = await primeWakeWordPermission();
    if (granted) {
      startWakeWordRecognition();
    }
  };

  const toggleWakeWordMode = () => {
    if (wakeWordEnabled) {
      if (wakeNeedsTap || wakeWordBlocked || !wakeRecognitionRef.current) {
        startWakeWordFlow();
        return;
      }

      setWakeWordEnabled(false);
      stopWakeWordRecognition();
      return;
    }

    // Wake mode implies voice interaction intent.
    setVoiceEnabled(true);
    setWakeWordEnabled(true);
    startWakeWordFlow();
  };

  useEffect(() => {
    if (!wakeWordEnabled) {
      stopWakeWordRecognition();
      return;
    }

    if (!speechInputSupported) {
      setWakeWordStatus('Wake word needs browser speech input support.');
      return;
    }

    // Stop manual recognition when wake mode is enabled.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
    }

    if (speechOutputSupported) {
      window.speechSynthesis.cancel();
    }

    if (!wakeRecognitionRef.current && !wakeWordBlocked) {
      setWakeNeedsTap(true);
      setWakeWordStatus('Wake mode on. Tap wake button to start listening.');
    }

    return () => {
      stopWakeWordRecognition();
    };
  }, [wakeWordEnabled, speechInputSupported, speechOutputSupported]);

  const toggleSpeechInput = () => {
    if (!speechInputSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // no-op
      }
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      if (speechOutputSupported) {
        window.speechSynthesis.cancel();
      }
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = '';
      let hasFinalResult = false;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          hasFinalResult = true;
        }
      }

      const cleaned = transcript.trim();
      setInput(cleaned);

      if (voiceEnabled && voiceAutoSend && hasFinalResult && cleaned && !loading) {
        sendUserMessage(cleaned, { clearInput: true });
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const clearChat = async () => {
    try {
      await authFetch(`${API_URL}/api/chat/clear`, { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* ─── ORB FAB ─── */}
      <div
        className={`orb-container ${hovered ? 'hovered' : ''} ${isListening ? 'listening' : ''} ${loading ? 'thinking' : ''}`}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="AI Assistant"
      >
        {/* Ambient glow behind orb */}
        <div className="orb-ambient-glow" />

        {/* The orb itself */}
        <div className="orb-sphere">
          {/* Canvas with animated gradient blobs */}
          <canvas ref={canvasRef} className="orb-canvas" />

          {/* Glass overlay for refraction effect */}
          <div className="orb-glass-overlay" />

          {/* Specular highlight */}
          <div className="orb-highlight" />

          {/* Eyes */}
          <div className="orb-eyes">
            <div className="orb-eye left" />
            <div className="orb-eye right" />
          </div>
        </div>



        {/* Particle ring */}
        <div className="orb-particles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="orb-particle" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      {/* ─── CHAT PANEL ─── */}
      {open && (
        <div className="orb-chat-panel">
          {/* Header */}
          <div className="orb-chat-header">
            <div className="orb-chat-title">
              <div className="orb-chat-title-icon">
                <Sparkles size={14} />
              </div>
              <span>Prep</span>
              <span className="orb-chat-cost">{CHAT_QUERY_COST > 0 ? `${CHAT_QUERY_COST} coins` : 'Free'}</span>
            </div>
            <div className="orb-chat-actions">
              <button
                className={`orb-chat-action-btn ${voiceEnabled ? 'active' : ''}`}
                onClick={() => setVoiceEnabled(prev => !prev)}
                title={voiceEnabled ? 'Voice mode on (click to disable)' : 'Voice mode off (click to enable)'}
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                className={`orb-chat-action-btn ${voiceAutoSend ? 'active' : ''}`}
                onClick={() => setVoiceAutoSend(prev => !prev)}
                title={voiceAutoSend ? 'Auto-send after speech is on' : 'Auto-send after speech is off'}
              >
                <Send size={14} />
              </button>
              <button
                className={`orb-chat-action-btn ${wakeWordEnabled ? 'active' : ''}`}
                onClick={toggleWakeWordMode}
                title={wakeWordEnabled
                  ? (wakeNeedsTap || wakeWordBlocked || !wakeRecognitionRef.current
                    ? 'Wake phrase "Hi Prep" is on (tap to start listening)'
                    : 'Wake phrase "Hi Prep" is on (tap to turn off)')
                  : 'Wake phrase "Hi Prep" is off'}
              >
                <Bot size={14} />
              </button>
              <button className="orb-chat-action-btn" onClick={clearChat} title="Clear chat">
                <Trash2 size={14} />
              </button>
              <button className="orb-chat-action-btn" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="orb-chat-messages">
            {messages.length === 0 && (
              <div className="orb-chat-empty">
                <div className="orb-chat-empty-icon">
                  <Bot size={36} />
                </div>
                <p className="orb-chat-empty-title">Hi! I'm Prep, your AI assistant.</p>
                <p className="orb-chat-empty-sub">Ask me about DSA, interview tips, or coding help.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`orb-chat-msg ${msg.role}`}>
                <div className="orb-chat-msg-avatar">
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>
                <div className="orb-chat-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="orb-chat-msg assistant">
                <div className="orb-chat-msg-avatar"><Bot size={13} /></div>
                <div className="orb-chat-msg-bubble orb-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="orb-chat-input-area">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              disabled={loading}
            />
            <button
              className={`orb-chat-mic ${isListening ? 'active' : ''}`}
              onClick={toggleSpeechInput}
              disabled={!speechInputSupported || loading || wakeWordEnabled}
              title={speechInputSupported ? (isListening ? 'Stop voice input' : 'Use voice input') : 'Voice input not supported on this browser'}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button
              className="orb-chat-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </div>
          <div className="orb-chat-voice-status" aria-live="polite">
            {wakeWordEnabled && wakeWordStatus
              ? wakeWordStatus
              : wakeWordEnabled
              ? (wakeNeedsTap ? 'Tap wake button again to start listening.' : 'Wake mode on. Listening for "Hi Prep"...')
              : !speechInputSupported || !speechOutputSupported
              ? 'Voice features are limited in this browser.'
              : isListening
                ? 'Listening... Speak now.'
                : voiceEnabled
                  ? `Voice mode enabled${voiceAutoSend ? ' (auto-send on).' : '.'}`
                  : 'Voice mode disabled.'}
          </div>
          <div className="orb-chat-wake-hint">
            Tip: enable wake phrase, tap once to arm listening, then say "Hi Prep".
          </div>
        </div>
      )}

      <style>{`
        /* ════════════════════════════════════════
           ORB CONTAINER
           ════════════════════════════════════════ */
        .orb-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          width: 80px;
          height: 80px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .orb-container.hovered {
          transform: scale(1.08);
        }
        .orb-container.listening {
          animation: orbPulseScale 1s ease-in-out infinite;
        }

        @keyframes orbPulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }

        /* ── AMBIENT GLOW ── */
        .orb-ambient-glow {
          position: absolute;
          width: 140%;
          height: 140%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%);
          filter: blur(12px);
          animation: orbGlowPulse 3s ease-in-out infinite;
          pointer-events: none;
        }
        .orb-container.hovered .orb-ambient-glow {
          background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(6, 182, 212, 0.15) 40%, transparent 70%);
        }
        .orb-container.thinking .orb-ambient-glow {
          background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(236, 72, 153, 0.15) 40%, transparent 70%);
          animation: orbGlowPulse 1s ease-in-out infinite;
        }

        @keyframes orbGlowPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* ── SPHERE ── */
        .orb-sphere {
          position: relative;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow:
            0 0 20px rgba(139, 92, 246, 0.3),
            0 0 60px rgba(139, 92, 246, 0.15),
            inset 0 0 30px rgba(0, 0, 0, 0.4);
          animation: orbFloat 4s ease-in-out infinite;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .orb-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        /* ── GLASS OVERLAY ── */
        .orb-glass-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: 
            radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(0, 0, 0, 0.2) 0%, transparent 50%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          pointer-events: none;
        }

        /* ── SPECULAR HIGHLIGHT ── */
        .orb-highlight {
          position: absolute;
          top: 8%;
          left: 18%;
          width: 35%;
          height: 25%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
          transform: rotate(-20deg);
          pointer-events: none;
          animation: orbHighlightShimmer 5s ease-in-out infinite;
        }

        @keyframes orbHighlightShimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* ── EYES ── */
        .orb-eyes {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          gap: 12px;
          z-index: 2;
        }

        .orb-eye {
          width: 5px;
          height: 16px;
          background: white;
          border-radius: 3px;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.9), 0 0 24px rgba(255, 255, 255, 0.5);
          animation: orbBlink 4s ease-in-out infinite;
        }
        .orb-eye.right {
          animation-delay: 0.1s;
        }

        .orb-container.thinking .orb-eye {
          animation: orbThinkEye 0.8s ease-in-out infinite alternate;
        }

        @keyframes orbBlink {
          0%, 42%, 44%, 100% { transform: scaleY(1); }
          43% { transform: scaleY(0.1); }
        }

        @keyframes orbThinkEye {
          0% { height: 16px; opacity: 1; }
          100% { height: 8px; opacity: 0.6; }
        }

        /* ── SPEECH BUBBLE ── */
        .orb-speech-bubble {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.95);
          color: #1a1a2e;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 10px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          animation: orbBubbleFloat 3s ease-in-out infinite;
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
        }
        .orb-speech-bubble.hidden {
          opacity: 0;
          transform: translateX(-50%) translateY(8px);
        }

        .orb-speech-tail {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(255, 255, 255, 0.95);
        }

        @keyframes orbBubbleFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }

        /* ── PARTICLES ── */
        .orb-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .orb-particle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
          animation: orbParticleOrbit 6s linear infinite;
          animation-delay: calc(var(--i) * -0.75s);
          opacity: 0;
        }
        .orb-container.hovered .orb-particle {
          opacity: 1;
        }

        @keyframes orbParticleOrbit {
          0% {
            transform: rotate(calc(var(--i) * 45deg)) translateX(44px) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: rotate(calc(var(--i) * 45deg + 36deg)) translateX(44px) scale(1);
          }
          90% {
            opacity: 0.6;
            transform: rotate(calc(var(--i) * 45deg + 324deg)) translateX(44px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: rotate(calc(var(--i) * 45deg + 360deg)) translateX(44px) scale(0);
          }
        }

        /* ════════════════════════════════════════
           CHAT PANEL
           ════════════════════════════════════════ */
        .orb-chat-panel {
          position: fixed;
          bottom: 116px;
          right: 24px;
          z-index: 9998;
          width: 400px;
          max-height: 540px;
          background: rgba(12, 10, 22, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 8px 40px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: orbChatSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: visible;
        }

        @keyframes orbChatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── HEADER ── */
        .orb-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          overflow: visible;
        }

        .orb-chat-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          color: #f0e6ff;
          min-width: 0;
          flex: 1;
        }

        .orb-chat-title-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c084fc;
        }

        .orb-chat-cost {
          font-size: 10px;
          font-weight: 500;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid rgba(251, 191, 36, 0.15);
        }

        .orb-chat-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          overflow-x: auto;
          overflow-y: visible;
          scrollbar-width: none;
          max-width: 52%;
          padding-bottom: 2px;
        }
        .orb-chat-actions::-webkit-scrollbar {
          display: none;
        }

        .orb-chat-action-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }
        .orb-chat-action-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
        }
        .orb-chat-action-btn.active {
          color: #a78bfa;
          background: rgba(139, 92, 246, 0.15);
        }

        /* ── MESSAGES ── */
        .orb-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 300px;
          max-height: 370px;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.2) transparent;
        }
        .orb-chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .orb-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
        }

        .orb-chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          gap: 8px;
        }
        .orb-chat-empty-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(139, 92, 246, 0.5);
          margin-bottom: 8px;
        }
        .orb-chat-empty-title {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .orb-chat-empty-sub {
          color: rgba(255, 255, 255, 0.35);
          font-size: 12px;
          margin: 0;
        }

        /* ── MESSAGE BUBBLES ── */
        .orb-chat-msg {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          animation: orbMsgIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes orbMsgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .orb-chat-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .orb-chat-msg.user .orb-chat-msg-avatar {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        .orb-chat-msg.assistant .orb-chat-msg-avatar {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(52, 211, 153, 0.15));
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.15);
        }

        .orb-chat-msg-bubble {
          background: rgba(255, 255, 255, 0.04);
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          max-width: 290px;
          word-break: break-word;
          white-space: pre-wrap;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .orb-chat-msg.user .orb-chat-msg-bubble {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
          border-color: rgba(139, 92, 246, 0.15);
        }

        /* ── TYPING ── */
        .orb-chat-typing span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: rgba(139, 92, 246, 0.6);
          border-radius: 50%;
          margin-right: 5px;
          animation: orbTypingDot 1.4s infinite ease-in-out;
        }
        .orb-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .orb-chat-typing span:nth-child(3) { animation-delay: 0.4s; margin-right: 0; }

        @keyframes orbTypingDot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        /* ── INPUT ── */
        .orb-chat-input-area {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }

        .orb-chat-input-area textarea {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 14px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          resize: none;
          outline: none;
          font-family: inherit;
          max-height: 80px;
          transition: border-color 0.3s;
        }
        .orb-chat-input-area textarea::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .orb-chat-input-area textarea:focus {
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08);
        }

        .orb-chat-send {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        .orb-chat-send:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
        }
        .orb-chat-send:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          box-shadow: none;
        }

        .orb-chat-voice-status {
          padding: 0 16px 12px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          line-height: 1.4;
          text-align: left;
        }

        .orb-chat-wake-hint {
          padding: 0 16px 14px;
          color: rgba(255, 255, 255, 0.38);
          font-size: 10px;
          line-height: 1.4;
        }

        .orb-chat-mic {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .orb-chat-mic:hover:not(:disabled) {
          border-color: rgba(139, 92, 246, 0.5);
          color: #c4b5fd;
        }
        .orb-chat-mic.active {
          color: #fca5a5;
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(248, 113, 113, 0.1);
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
        }
        .orb-chat-mic:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .orb-chat-header {
            gap: 8px;
          }

          .orb-chat-actions {
            max-width: 58%;
          }

          .orb-chat-panel {
            right: 8px;
            left: 8px;
            width: auto;
            bottom: calc(88px + env(safe-area-inset-bottom, 0px));
            max-height: min(70vh, 560px);
          }

          .orb-chat-msg-bubble {
            max-width: min(100%, calc(100vw - 120px));
          }

          .orb-container {
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            right: 12px;
          }
        }

        @media (max-width: 480px) {
          .orb-chat-panel {
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
          }

          .orb-container {
            bottom: 16px;
            right: 16px;
            width: 64px;
            height: 64px;
          }
          .orb-sphere {
            width: 54px;
            height: 54px;
          }
        }
      `}</style>
    </>
  );
}
