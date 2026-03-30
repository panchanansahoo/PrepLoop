import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, Target, TrendingUp, ArrowRight, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { CONCEPT_LEARNING_MAP } from '../data/interviewModesData';
import './InterviewRemediationPanel.css';

export default function InterviewRemediationPanel({ failedConcepts = [], onClose }) {
  if (failedConcepts.length === 0) return null;

  const enriched = failedConcepts.map(concept => ({
    ...concept,
    mapping: CONCEPT_LEARNING_MAP[concept.conceptId] || null,
  })).filter(c => c.mapping);

  if (enriched.length === 0) return null;

  const getSeverity = (score) => {
    if (score < 30) return { label: 'Critical', className: 'severity-critical', icon: '🔴' };
    if (score < 50) return { label: 'Needs Work', className: 'severity-warning', icon: '🟡' };
    return { label: 'Review', className: 'severity-review', icon: '🟢' };
  };

  const getEstimatedTime = (score) => {
    if (score < 30) return '30-45 min';
    if (score < 50) return '15-25 min';
    return '10-15 min';
  };

  return (
    <div className="remediation-panel">
      <div className="remediation-header">
        <div className="remediation-header-left">
          <Sparkles size={18} />
          <div>
            <h3>Personalized Study Plan</h3>
            <p>{enriched.length} concept{enriched.length > 1 ? 's' : ''} to review based on your performance</p>
          </div>
        </div>
        {onClose && (
          <button className="remediation-close" onClick={onClose}>×</button>
        )}
      </div>

      <div className="remediation-grid">
        {enriched.map((item, idx) => {
          const severity = getSeverity(item.score);
          const est = getEstimatedTime(item.score);

          return (
            <div key={item.conceptId || idx} className={`remediation-card ${severity.className}`}>
              <div className="remediation-card-header">
                <span className="remediation-severity-badge">{severity.icon} {severity.label}</span>
                <span className="remediation-score">{item.score}/100</span>
              </div>

              <h4>{item.mapping.label}</h4>
              <p className="remediation-category">{item.mapping.category}</p>

              {item.description && (
                <p className="remediation-desc">{item.description}</p>
              )}

              <div className="remediation-score-bar">
                <div className="remediation-score-fill" style={{ width: `${item.score}%` }} />
              </div>

              <div className="remediation-links">
                <Link to={item.mapping.path} className="remediation-link theory">
                  <BookOpen size={14} />
                  <span>Learn Theory</span>
                  <ArrowRight size={12} />
                </Link>

                {item.mapping.practiceIds && item.mapping.practiceIds.length > 0 && (
                  <Link to={`/code-editor/${item.mapping.practiceIds[0]}`} className="remediation-link practice">
                    <Code2 size={14} />
                    <span>Practice Problem</span>
                    <ArrowRight size={12} />
                  </Link>
                )}

                <Link to="/problems" className="remediation-link patterns">
                  <Target size={14} />
                  <span>Related Patterns</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="remediation-meta">
                <Clock size={12} />
                <span>Est. {est} review</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="remediation-footer">
        <Link to="/advanced-learning-path" className="remediation-plan-btn">
          <TrendingUp size={16} />
          Create Full Study Plan from Weak Areas
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
