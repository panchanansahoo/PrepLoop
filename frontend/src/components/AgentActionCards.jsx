import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Building2,
} from 'lucide-react';

export function AgentThoughtBadge({ thoughts }) {
  const [expanded, setExpanded] = useState(false);

  if (!thoughts || thoughts.length === 0) return null;

  return (
    <div className="agent-thought-container">
      <button
        type="button"
        className="agent-thought-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <Sparkles size={12} className="agent-thought-icon" />
        <span>Agent Plan & Reasoning ({thoughts.length} step{thoughts.length > 1 ? 's' : ''})</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="agent-thought-list">
          {thoughts.map((step, idx) => (
            <div key={idx} className="agent-thought-item">
              <span className="agent-thought-bullet">✓</span>
              <span>{typeof step === 'string' ? step : step.thought || step.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProblemActionCard({ data, onActionClick }) {
  const navigate = useNavigate();
  if (!data) return null;

  const difficultyClass = (data.difficulty || 'medium').toLowerCase();

  const handleSolve = () => {
    if (onActionClick) onActionClick();
    const targetUrl = data.url || `/dsa-editor/${data.id}`;
    navigate(targetUrl);
  };

  return (
    <div className="agent-card agent-problem-card">
      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <Code2 size={16} className="agent-card-icon" />
          <span className="agent-problem-title">{data.title}</span>
        </div>
        <span className={`agent-difficulty-badge ${difficultyClass}`}>
          {data.difficulty || 'Medium'}
        </span>
      </div>

      <div className="agent-card-meta">
        {data.pattern && (
          <span className="agent-pattern-tag">
            <Layers size={11} style={{ marginRight: 4 }} />
            {data.pattern}
          </span>
        )}
        {data.companies && data.companies.length > 0 && (
          <div className="agent-companies-tags">
            {data.companies.slice(0, 3).map((comp, idx) => (
              <span key={idx} className="agent-company-pill">
                {comp}
              </span>
            ))}
          </div>
        )}
      </div>

      {data.reason && <p className="agent-card-reason">{data.reason}</p>}

      <div className="agent-card-actions">
        <button type="button" className="agent-action-btn primary" onClick={handleSolve}>
          <Play size={13} style={{ fill: 'currentColor', marginRight: 4 }} />
          Solve Problem
        </button>
      </div>
    </div>
  );
}

export function InterviewActionCard({ data, onActionClick }) {
  const navigate = useNavigate();
  if (!data) return null;

  const handleLaunch = () => {
    if (onActionClick) onActionClick();
    const targetUrl = data.url || `/company-interview?company=${encodeURIComponent((data.company || 'general').toLowerCase())}`;
    navigate(targetUrl);
  };

  return (
    <div className="agent-card agent-interview-card">
      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <Building2 size={16} className="agent-card-icon accent" />
          <span className="agent-interview-title">{data.title || `${data.company} Mock Interview`}</span>
        </div>
        <span className="agent-stage-badge">{data.stage || 'Technical'}</span>
      </div>

      <p className="agent-card-description">
        {data.description || `Simulated ${data.company} interview session with voice interaction and performance analysis.`}
      </p>

      <div className="agent-card-actions">
        <button type="button" className="agent-action-btn launch" onClick={handleLaunch}>
          <ExternalLink size={13} style={{ marginRight: 4 }} />
          Launch Interview Room
        </button>
      </div>
    </div>
  );
}

export function InteractiveQuizCard({ data }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!data || !data.question || !Array.isArray(data.options)) return null;

  const correctIndex = typeof data.correctIndex === 'number' ? data.correctIndex : 0;
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === correctIndex;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setShowExplanation(true);
  };

  return (
    <div className="agent-card agent-quiz-card">
      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <HelpCircle size={16} className="agent-card-icon quiz" />
          <span className="agent-quiz-topic">{data.topic || 'Quick Assessment'}</span>
        </div>
        <span className="agent-quiz-difficulty">{data.difficulty || 'Medium'}</span>
      </div>

      <p className="agent-quiz-question">{data.question}</p>

      <div className="agent-quiz-options">
        {data.options.map((opt, idx) => {
          let btnClass = 'agent-quiz-option';
          if (isAnswered) {
            if (idx === correctIndex) btnClass += ' correct';
            else if (idx === selectedOption) btnClass += ' wrong';
            else btnClass += ' disabled';
          }

          return (
            <button
              key={idx}
              type="button"
              className={btnClass}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
            >
              <span className="agent-quiz-option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="agent-quiz-option-text">{opt}</span>
              {isAnswered && idx === correctIndex && (
                <CheckCircle2 size={15} className="agent-quiz-status-icon success" />
              )}
              {isAnswered && idx === selectedOption && !isCorrect && (
                <XCircle size={15} className="agent-quiz-status-icon fail" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="agent-quiz-feedback">
          <div className={`agent-quiz-result ${isCorrect ? 'pass' : 'fail'}`}>
            {isCorrect ? '🎉 Correct! Well done.' : '❌ Not quite. Review the explanation below.'}
          </div>

          {data.explanation && (
            <div className="agent-quiz-explanation">
              <strong>Explanation:</strong> {data.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StudyPlanActionCard({ data }) {
  const [expanded, setExpanded] = useState(true);
  if (!data || !Array.isArray(data.milestones)) return null;

  return (
    <div className="agent-card agent-study-card">
      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <Calendar size={16} className="agent-card-icon calendar" />
          <span className="agent-study-title">{data.title || `${data.days}-Day Study Roadmap`}</span>
        </div>
        <button
          type="button"
          className="agent-study-toggle-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="agent-milestones-list">
          {data.milestones.map((milestone, idx) => (
            <div key={idx} className="agent-milestone-item">
              <div className="agent-milestone-header">
                <span className="agent-milestone-range">{milestone.dayRange}</span>
                <span className="agent-milestone-focus">{milestone.focus}</span>
              </div>
              <ul className="agent-milestone-tasks">
                {(milestone.tasks || []).map((task, tIdx) => (
                  <li key={tIdx}>{task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionCardsContainer({ actions, onActionClick }) {
  if (!actions || !Array.isArray(actions) || actions.length === 0) return null;

  return (
    <div className="agent-actions-container">
      {actions.map((action, idx) => {
        switch (action.type) {
          case 'problem_card':
            return <ProblemActionCard key={idx} data={action.data} onActionClick={onActionClick} />;
          case 'interview_launcher':
            return <InterviewActionCard key={idx} data={action.data} onActionClick={onActionClick} />;
          case 'quiz_card':
            return <InteractiveQuizCard key={idx} data={action.data} />;
          case 'study_plan_card':
            return <StudyPlanActionCard key={idx} data={action.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function SuggestionPills({ suggestions, onSelectSuggestion }) {
  if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) return null;

  return (
    <div className="agent-suggestions-container">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          type="button"
          className="agent-suggestion-pill"
          onClick={() => onSelectSuggestion && onSelectSuggestion(suggestion)}
        >
          <Sparkles size={11} style={{ marginRight: 4, opacity: 0.8 }} />
          {suggestion}
        </button>
      ))}
    </div>
  );
}

