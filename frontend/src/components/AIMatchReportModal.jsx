import { useState } from 'react';
import {
  X, Gauge, CheckCircle, TrendingUp, Lightbulb, Bot, Sparkles, Medal, ArrowRight, ExternalLink
} from 'lucide-react';
import './AIMatchReportModal.css';

const STEPS = [
  { id: 'overview',     title: 'Match Overview',   desc: 'Overall compatibility score.',       icon: Gauge },
  { id: 'skills',       title: 'Skills Analysis',  desc: 'Keywords & tools comparison.',       icon: CheckCircle },
  { id: 'experience',   title: 'Experience Match', desc: 'Seniority & gap analysis.',          icon: TrendingUp },
  { id: 'optimization', title: 'Optimization',     desc: 'Actionable resume steps.',           icon: Lightbulb },
  { id: 'risk',         title: 'AI Risk Analysis', desc: 'Future-proofing your career.',       icon: Bot },
];

export default function AIMatchReportModal({ jobMatch, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!jobMatch) return null;

  const score = jobMatch.matchScore ?? 85;
  const step = STEPS[activeIdx];

  const goNext = () => setActiveIdx(i => Math.min(i + 1, STEPS.length - 1));
  const goPrev = () => setActiveIdx(i => Math.max(i - 1, 0));

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="match-modal-header">
          <div className="match-header-left">
            <div className="match-header-icon"><Sparkles size={16} /></div>
            <div className="match-header-text">
              <h2 className="match-job-title">{jobMatch.title} ({jobMatch.company})</h2>
              <p className="match-subtitle">AI MATCH REPORT</p>
            </div>
          </div>
          <button className="match-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="match-modal-body">

          {/* Sidebar */}
          <div className="match-sidebar">
            <h3 className="match-sidebar-title">ANALYSIS STEPS</h3>
            <div className="match-steps-list">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className={`match-step-item ${activeIdx === idx ? 'active' : ''}`}
                    onClick={() => setActiveIdx(idx)}
                  >
                    <div className="match-step-icon-wrapper"><Icon size={16} className="match-step-icon" /></div>
                    <div className="match-step-text">
                      <h4 className="match-step-title">{s.title}</h4>
                      <p className="match-step-desc">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
              <div className="match-step-line" />
            </div>
          </div>

          {/* Content */}
          <div className="match-content">

            {step.id === 'overview' && (
              <div className="match-overview-view">
                <h1 className="match-content-title">Score Overview</h1>
                <p className="match-content-subtitle">AI analysis of how well your profile matches this role.</p>
                <div className="match-score-visual">
                  <div className="match-score-ring">
                    <svg viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#27272a" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="transparent"
                        stroke="url(#score-gradient)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * score) / 100}
                        style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)', transition: 'stroke-dashoffset 1.5s ease-out' }}
                      />
                    </svg>
                    <div className="match-score-number">{score}<span>%</span></div>
                  </div>
                </div>
                <div className="match-insight-card">
                  <div className="match-insight-header">
                    <Medal size={16} className="match-insight-icon" />
                    <span className="match-insight-title">{score >= 75 ? 'Strong Match' : score >= 50 ? 'Potential Match' : 'Low Match'}</span>
                  </div>
                  <p className="match-insight-text">
                    {score >= 75
                      ? 'You are highly competitive for this role. Prepare for technical deep dives!'
                      : score >= 50
                        ? 'You have relevant skills. Strengthen your profile to improve your chances.'
                        : 'Consider building more relevant skills before applying to this role.'}
                  </p>
                </div>
                {jobMatch.apply_link && (
                  <a href={jobMatch.apply_link} target="_blank" rel="noopener noreferrer" className="match-apply-link">
                    Apply Now <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}

            {step.id === 'skills' && (
              <div className="match-other-view">
                <h1 className="match-content-title">Skills Analysis</h1>
                <p className="match-content-subtitle">How your skills align with this role's requirements.</p>
                <div className="match-insight-card">
                  <div className="match-insight-header">
                    <CheckCircle size={16} className="match-insight-icon" />
                    <span className="match-insight-title">Skill Match Score: {score}%</span>
                  </div>
                  <p className="match-insight-text">
                    {score >= 75
                      ? 'Your skills closely match what this role requires. Highlight them prominently in your resume.'
                      : 'Add more relevant skills to your profile to improve your match score for this role.'}
                  </p>
                </div>
                <div className="match-insight-card" style={{ marginTop: 12 }}>
                  <p className="match-insight-text" style={{ margin: 0 }}>
                    <strong>Tip:</strong> Tailor your resume skills section to mirror the exact keywords used in this job description.
                  </p>
                </div>
              </div>
            )}

            {step.id === 'experience' && (
              <div className="match-other-view">
                <h1 className="match-content-title">Experience Match</h1>
                <p className="match-content-subtitle">Seniority alignment and experience gap analysis.</p>
                <div className="match-insight-card">
                  <div className="match-insight-header">
                    <TrendingUp size={16} className="match-insight-icon" />
                    <span className="match-insight-title">Experience Fit</span>
                  </div>
                  <p className="match-insight-text">
                    Complete your profile's "Years of Experience" and "Experience Details" fields to get a precise experience gap analysis for <strong>{jobMatch.title}</strong> at <strong>{jobMatch.company}</strong>.
                  </p>
                </div>
              </div>
            )}

            {step.id === 'optimization' && (
              <div className="match-other-view">
                <h1 className="match-content-title">Optimization Tips</h1>
                <p className="match-content-subtitle">Actionable steps to improve your application.</p>
                {[
                  'Tailor your resume summary to mention this role and company by name.',
                  'Add 2–3 quantified achievements (e.g. "Reduced load time by 40%").',
                  'Mirror the exact skill keywords from the job description.',
                  'Prepare a STAR-format story for your most relevant project.',
                  'Write a targeted cover letter referencing the company\'s recent work.',
                ].map((tip, i) => (
                  <div key={i} className="match-insight-card" style={{ marginBottom: 10 }}>
                    <p className="match-insight-text" style={{ margin: 0 }}>
                      <strong>{i + 1}.</strong> {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {step.id === 'risk' && (
              <div className="match-other-view">
                <h1 className="match-content-title">AI Risk Analysis</h1>
                <p className="match-content-subtitle">Future-proofing your career trajectory.</p>
                <div className="match-insight-card">
                  <div className="match-insight-header">
                    <Bot size={16} className="match-insight-icon" />
                    <span className="match-insight-title">Career Outlook</span>
                  </div>
                  <p className="match-insight-text">
                    Roles like <strong>{jobMatch.title}</strong> are evolving with AI tooling. Candidates who combine domain expertise with AI-assisted workflows have a strong competitive edge.
                  </p>
                </div>
                <div className="match-insight-card" style={{ marginTop: 12 }}>
                  <p className="match-insight-text" style={{ margin: 0 }}>
                    <strong>Recommendation:</strong> Build familiarity with AI coding assistants and automation tools relevant to this role to stay ahead of the curve.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="match-modal-footer">
          <div className="match-footer-left">
            <button className="match-nav-btn" onClick={goPrev} disabled={activeIdx === 0}>Previous</button>
            <button className="match-nav-btn" onClick={goNext} disabled={activeIdx === STEPS.length - 1}>Next</button>
          </div>
          <div className="match-footer-right">
            {jobMatch.apply_link && (
              <a href={jobMatch.apply_link} target="_blank" rel="noopener noreferrer" className="match-action-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Apply Now <ArrowRight size={16} />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
