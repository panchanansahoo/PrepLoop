import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Sparkles, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';
import { authFetch } from '../utils/authFetch';

import { API_URL } from '../config/api.js';
const CHAT_QUERY_COST = Number(import.meta.env.VITE_AI_CHAT_COIN_COST ?? 0);

export default function ChatAssistant() {
  const { user } = useAuth();
  const { coins, refreshBalance } = useCoins();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await authFetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
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
    }
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
      {/* Floating Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(!open)}
        title="AI Assistant"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
        {!open && <span className="chat-fab-pulse" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-panel-header">
            <div className="chat-panel-title">
              <Sparkles size={16} />
              <span>PrepLoop AI</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: '#fbbf24' }}>
                Cost: {CHAT_QUERY_COST > 0 ? `${CHAT_QUERY_COST} coins` : 'Free'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="chat-clear-btn" onClick={clearChat} title="Clear chat">
                <Trash2 size={14} />
              </button>
              <button className="chat-close-btn" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-panel-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <Bot size={32} style={{ opacity: 0.3 }} />
                <p>Hi! I'm your PrepLoop AI assistant.</p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>Ask me about DSA, interview tips, or coding help.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="chat-msg-icon">
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className="chat-msg-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-msg-icon"><Bot size={14} /></div>
                <div className="chat-msg-content chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-panel-input">
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
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.3s ease;
        }
        .chat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(99, 102, 241, 0.5);
        }
        .chat-fab-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.5);
          animation: chatPulse 2s infinite;
        }
        @keyframes chatPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .chat-panel {
          position: fixed;
          bottom: 88px;
          right: 24px;
          z-index: 9998;
          width: 380px;
          max-height: 520px;
          background: var(--bg-secondary, #0f0f13);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.4);
          animation: chatSlideUp 0.3s ease;
          overflow: hidden;
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-secondary, #0f0f13);
        }
        .chat-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #fff);
        }
        .chat-panel-title svg { color: #8b5cf6; }
        .chat-close-btn, .chat-clear-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }
        .chat-close-btn:hover, .chat-clear-btn:hover {
          background: var(--bg-tertiary, rgba(255,255,255,0.05));
        }

        .chat-panel-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 280px;
          max-height: 360px;
        }
        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--text-secondary, #888);
          gap: 8px;
          font-size: 13px;
        }

        .chat-msg {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          animation: chatMsgIn 0.2s ease;
        }
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-msg-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .chat-msg.user .chat-msg-icon {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }
        .chat-msg.assistant .chat-msg-icon {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        .chat-msg-content {
          background: var(--bg-tertiary, rgba(255,255,255,0.04));
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-primary, #e5e7eb);
          max-width: 280px;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .chat-msg.user .chat-msg-content {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .chat-typing span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--text-secondary, #888);
          border-radius: 50%;
          margin-right: 4px;
          animation: chatDot 1.4s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .chat-panel-input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-secondary, #0f0f13);
        }
        .chat-panel-input textarea {
          flex: 1;
          background: var(--bg-tertiary, rgba(255,255,255,0.04));
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text-primary, #e5e7eb);
          font-size: 13px;
          resize: none;
          outline: none;
          font-family: inherit;
          max-height: 80px;
        }
        .chat-panel-input textarea:focus {
          border-color: rgba(99, 102, 241, 0.4);
        }
        .chat-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .chat-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-fab {
            right: 12px;
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          }

          .chat-panel {
            right: 8px;
            left: 8px;
            width: auto;
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            max-height: min(70vh, 540px);
          }

          .chat-panel-messages {
            min-height: 220px;
          }

          .chat-msg-content {
            max-width: min(100%, calc(100vw - 120px));
          }
        }
      `}</style>
    </>
  );
}
