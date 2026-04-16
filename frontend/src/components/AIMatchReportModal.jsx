import React, { useState } from 'react';
import { 
  X, Gauge, CheckCircle, TrendingUp, Lightbulb, Bot, Sparkles, Medal, ArrowRight
} from 'lucide-react';
import './AIMatchReportModal.css';

const steps = [
  {
    id: 'overview',
    title: 'Match Overview',
    desc: 'Overall compatibility score.',
    icon: Gauge,
  },
  {
    id: 'skills',
    title: 'Skills Analysis',
    desc: 'Keywords & tools comparison.',
    icon: CheckCircle,
  },
  {
    id: 'experience',
    title: 'Experience Match',
    desc: 'Seniority & gap analysis.',
    icon: TrendingUp,
  },
  {
    id: 'optimization',
    title: 'Optimization',
    desc: 'Actionable resume steps.',
    icon: Lightbulb,
  },
  {
    id: 'risk',
    title: 'AI Risk Analysis',
    desc: 'Future-proofing your career.',
    icon: Bot,
  }
];

export default function AIMatchReportModal({ jobMatch, onClose }) {
  const [activeStep, setActiveStep] = useState('overview');

  if (!jobMatch) return null;

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* ─── Header ─── */}
        <div className="match-modal-header">
          <div className="match-header-left">
            <div className="match-header-icon">
              <Sparkles size={16} />
            </div>
            <div className="match-header-text">
              <h2 className="match-job-title">{jobMatch.title || 'Software Engineer Trainee'} ({jobMatch.company || 'Roku'})</h2>
              <p className="match-subtitle">AI MATCH REPORT</p>
            </div>
          </div>
          <button className="match-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ─── Body Layout ─── */}
        <div className="match-modal-body">
          
          {/* Left Sidebar */}
          <div className="match-sidebar">
            <h3 className="match-sidebar-title">ANALYSIS STEPS</h3>
            <div className="match-steps-list">
              {steps.map((step, idx) => {
                const isActive = activeStep === step.id;
                const Icon = step.icon;
                return (
                  <div 
                    key={step.id} 
                    className={`match-step-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className="match-step-icon-wrapper">
                      <Icon size={16} className="match-step-icon" />
                    </div>
                    <div className="match-step-text">
                      <h4 className="match-step-title">{step.title}</h4>
                      <p className="match-step-desc">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
              <div className="match-step-line" />
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="match-content">
            {activeStep === 'overview' && (
              <div className="match-overview-view">
                <h1 className="match-content-title">Score Overview</h1>
                <p className="match-content-subtitle">
                  AI analysis of how well your resume matches this role's requirements.
                </p>

                <div className="match-score-visual">
                  <div className="match-score-ring">
                    <svg viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      {/* Track */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#27272a" 
                        strokeWidth="8" 
                      />
                      {/* Progress Line */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="url(#score-gradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * (jobMatch.matchScore || 85)) / 100}
                        style={{
                          transformOrigin: '50% 50%',
                          transform: 'rotate(-90deg)',
                          transition: 'stroke-dashoffset 1.5s ease-out'
                        }}
                      />
                    </svg>
                    <div className="match-score-number">
                      {jobMatch.matchScore || 85}<span>%</span>
                    </div>
                  </div>
                </div>

                <div className="match-insight-card">
                  <div className="match-insight-header">
                    <Medal size={16} className="match-insight-icon" />
                    <span className="match-insight-title">Strong Match</span>
                  </div>
                  <p className="match-insight-text">
                    You are highly competitive for this role. Prepare for technical deep dives!
                  </p>
                </div>
              </div>
            )}

            {activeStep !== 'overview' && (
              <div className="match-other-view">
                <h1 className="match-content-title">{steps.find(s => s.id === activeStep)?.title}</h1>
                <p className="match-content-subtitle">Detailed analysis view coming soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="match-modal-footer">
          <div className="match-footer-left">
            <button className="match-nav-btn">Previous</button>
            <button className="match-nav-btn">Next</button>
          </div>
          <div className="match-footer-right">
            <button className="match-action-secondary">Mock Interview Prep</button>
            <button className="match-action-primary">
              Cover Letter <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
