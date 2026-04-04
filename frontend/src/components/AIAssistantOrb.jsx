import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, Sparkles, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const CHAT_QUERY_COST = 5;

export default function AIAssistantOrb() {
  const { user } = useAuth();
  const { coins, refreshBalance } = useCoins();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hovered, setHovered] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

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
      const res = await fetch(`${API_URL}/api/chat/history`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map(m => ({ role: m.role, content: m.content })));
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setIsListening(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
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
      setTimeout(() => setIsListening(false), 500);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${API_URL}/api/chat/clear`, { method: 'DELETE', headers: getHeaders() });
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
              <span>PrepLoop AI</span>
              <span className="orb-chat-cost">{CHAT_QUERY_COST} coins</span>
            </div>
            <div className="orb-chat-actions">
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
                <p className="orb-chat-empty-title">Hi! I'm your AI assistant.</p>
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
              className="orb-chat-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
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
          overflow: hidden;
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
        }

        .orb-chat-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          color: #f0e6ff;
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
        }
        .orb-chat-action-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
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

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
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
