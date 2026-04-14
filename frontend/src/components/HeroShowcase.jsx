import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Mic, Code2, Map,
  FileText, TrendingUp, Play,
  Building2, Database, Calculator, Eye
} from 'lucide-react';
import './HeroShowcase.css';

/* ── Preview Cards Data ── */
const previewCards = [
  {
    label: 'Interview',
    sublabel: 'AI-Powered',
    items: ['Behavioral Questions', 'Technical Deep-Dives', 'System Design'],
    accent: '#8b5cf6',
  },
  {
    label: 'Code Lab',
    sublabel: 'Real-Time',
    items: ['500+ Problems', 'Multi-Language', 'AI Feedback'],
    accent: '#3b82f6',
  },
  {
    label: 'Analytics',
    sublabel: 'Dashboard',
    items: ['Skill Radar', 'Progress Tracking', 'Readiness Score'],
    accent: '#10b981',
  },
];

/* ── Floating UI Stats ── */
const floatingStats = [
  { value: '95%', label: 'Success Rate' },
  { value: '500+', label: 'Problems' },
  { value: '15K+', label: 'Engineers' },
];

export default function HeroShowcase() {
  const [activePreview, setActivePreview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePreview(i => (i + 1) % previewCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hs-section">
      {/* Ambient background elements */}
      <div className="hs-bg-glow hs-bg-glow-1" />
      <div className="hs-bg-glow hs-bg-glow-2" />
      <div className="hs-grid-overlay" />

      {/* ── Hero Top ── */}
      <div className="hs-hero">
        <div className="hs-badge">
          <Sparkles size={12} />
          <span>Powered by AI</span>
        </div>

        <h2 className="hs-title">
          AI interview prep that
          <br />
          <span className="hs-title-gradient">outperforms your expectations</span>
        </h2>

        <p className="hs-subtitle">
          Practice with adaptive AI interviewers, master DSA patterns with guided paths,
          and get real-time feedback on code and communication.
        </p>

        <div className="hs-cta-row">
          <Link to="/company-interview" className="hs-cta-primary">
            <Play size={16} />
            Try Free Demo
          </Link>
          <Link to="/dsa-path" className="hs-cta-secondary">
            See How It Works
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── MacBook Browser Showcase ── */}
      <div className="hs-macbook">
        <div className="hs-macbook-frame">
          {/* MacBook top bezel / notch */}
          <div className="hs-macbook-notch">
            <div className="hs-macbook-camera" />
          </div>

          {/* Browser window */}
          <div className="hs-macbook-screen">
            {/* Browser chrome / toolbar */}
            <div className="hs-browser-toolbar">
              <div className="hs-browser-dots">
                <span className="hs-dot hs-dot-red" />
                <span className="hs-dot hs-dot-yellow" />
                <span className="hs-dot hs-dot-green" />
              </div>
              <div className="hs-browser-nav">
                <span className="hs-browser-arrow">←</span>
                <span className="hs-browser-arrow">→</span>
              </div>
              <div className="hs-browser-url">
                <svg className="hs-browser-lock" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span>preploop.ai</span>
              </div>
              <div className="hs-browser-actions">
                <span className="hs-browser-action-dot" />
                <span className="hs-browser-action-dot" />
                <span className="hs-browser-action-dot" />
              </div>
            </div>

            {/* App content inside browser */}
            <div className="hs-browser-content">
              <div className="hs-showcase">
                {/* Left Sidebar Panel */}
                <div className="hs-panel hs-panel-sidebar">
                  <div className="hs-panel-header">
                    <div className="hs-panel-logo">P</div>
                    <span className="hs-panel-brand">PrepLoop</span>
                  </div>
                  <div className="hs-panel-search">
                    <Eye size={14} />
                    <span>Search features...</span>
                  </div>
                  <Link to="/company-interview" className="hs-panel-create-btn">
                    <Sparkles size={14} />
                    Start Interview
                  </Link>
                  <div className="hs-panel-menu">
                    <span className="hs-panel-menu-label">MENU</span>
                    {[
                      { icon: <Mic size={14} />, text: 'Mock Interview', active: true },
                      { icon: <Code2 size={14} />, text: 'Code Practice' },
                      { icon: <Map size={14} />, text: 'DSA Path' },
                      { icon: <Database size={14} />, text: 'SQL Mastery' },
                      { icon: <Calculator size={14} />, text: 'Aptitude' },
                      { icon: <Building2 size={14} />, text: 'Company Prep' },
                      { icon: <FileText size={14} />, text: 'Resume Analyzer' },
                    ].map((item, i) => (
                      <div key={i} className={`hs-panel-menu-item ${item.active ? 'active' : ''}`}>
                        {item.icon}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center Content Panel */}
                <div className="hs-panel hs-panel-main">
                  <div className="hs-panel-main-header">
                    <h3>Your Interview Preparation Engine</h3>
                    <p>What will you practice today?</p>
                  </div>

                  <div className="hs-preview-tabs">
                    {previewCards.map((card, i) => (
                      <button
                        key={i}
                        className={`hs-preview-tab ${activePreview === i ? 'active' : ''}`}
                        onClick={() => setActivePreview(i)}
                        style={{ '--tab-accent': card.accent }}
                      >
                        <span className="hs-preview-tab-label">{card.label}</span>
                        <span className="hs-preview-tab-num">{String(i + 1).padStart(2, '0')}</span>
                      </button>
                    ))}
                  </div>

                  <div className="hs-preview-content">
                    {previewCards.map((card, i) => (
                      <div
                        key={i}
                        className={`hs-preview-card ${activePreview === i ? 'active' : ''}`}
                        style={{ '--card-accent': card.accent }}
                      >
                        <div className="hs-preview-card-header">
                          <span className="hs-preview-card-title">{card.label}</span>
                          <span className="hs-preview-card-sub">{card.sublabel}</span>
                        </div>
                        <div className="hs-preview-card-items">
                          {card.items.map((item, j) => (
                            <div key={j} className="hs-preview-card-item">
                              <div className="hs-preview-card-dot" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Chat/AI Panel */}
                <div className="hs-panel hs-panel-chat">
                  <div className="hs-chat-header">
                    <TrendingUp size={14} />
                    <span>AI Assistant</span>
                  </div>
                  <div className="hs-chat-messages">
                    <div className="hs-chat-msg hs-chat-msg-ai">
                      <p>Hi! Ready to practice? Tell me your target company and I'll create a custom plan.</p>
                    </div>
                    <div className="hs-chat-msg hs-chat-msg-user">
                      <p>I'm targeting Google SDE-2. Help me prepare for system design rounds.</p>
                    </div>
                    <div className="hs-chat-msg hs-chat-msg-ai">
                      <p>Great choice! I've created a 30-day plan focusing on distributed systems, scalability patterns, and real Google questions.</p>
                    </div>
                  </div>
                  <div className="hs-chat-prompt">
                    <span>Type your goal...</span>
                    <button className="hs-chat-send">
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="hs-floating-stats">
                    {floatingStats.map((stat, i) => (
                      <div key={i} className="hs-floating-stat">
                        <span className="hs-floating-stat-value">{stat.value}</span>
                        <span className="hs-floating-stat-label">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MacBook bottom body / base */}
          <div className="hs-macbook-base">
            <div className="hs-macbook-indent" />
          </div>
        </div>

        {/* Reflection / shadow */}
        <div className="hs-macbook-shadow" />
      </div>
    </section>
  );
}
