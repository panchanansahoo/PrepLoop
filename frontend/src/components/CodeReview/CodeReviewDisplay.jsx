import { useState } from 'react';
import { CheckCircle, AlertTriangle, Zap, ThumbsUp, MessageSquare, ChevronDown, ChevronRight, TrendingUp, Award, Code } from 'lucide-react';
import './CodeReview.css';

export default function CodeReviewDisplay({ reviewData }) {
  const [expandedIssues, setExpandedIssues] = useState({});

  if (!reviewData) return null;

  const toggleIssue = (index) => {
    setExpandedIssues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const scores = reviewData.scores || {};
  const feedback = reviewData.feedback || {};
  const { overall_score, performance_level, time_complexity, space_complexity } = reviewData;

  const renderProgressBar = (score, label, colorClass) => (
    <div className="cr-score-bar">
      <div className="cr-score-label">
        <span>{label}</span>
        <span>{score}/10</span>
      </div>
      <div className="cr-bar-bg">
        <div 
          className={`cr-bar-fill ${colorClass}`} 
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="cr-display-container">
      {/* Header / Overall Score */}
      <div className="cr-display-header">
        <div className="cr-overall-score">
          <div className="cr-score-circle">
            <span className="cr-score-value">{overall_score}</span>
            <span className="cr-score-max">/10</span>
          </div>
          <div className="cr-score-text">
            <h3>Overall Performance</h3>
            <span className={`cr-badge level-${performance_level?.toLowerCase().replace(/\s+/g, '-')}`}>
              {performance_level}
            </span>
          </div>
        </div>

        <div className="cr-complexity-metrics">
          <div className="cr-metric">
            <Zap size={16} className="text-amber" />
            <div className="cr-metric-details">
              <span>Time Complexity</span>
              <strong>{time_complexity || 'O(?)'}</strong>
            </div>
          </div>
          <div className="cr-metric">
            <Code size={16} className="text-blue" />
            <div className="cr-metric-details">
              <span>Space Complexity</span>
              <strong>{space_complexity || 'O(?)'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="cr-detailed-scores">
        <h4>Score Breakdown</h4>
        <div className="cr-scores-grid">
          {renderProgressBar(scores.correctness, 'Correctness', 'bg-green')}
          {renderProgressBar(scores.efficiency, 'Efficiency', 'bg-amber')}
          {renderProgressBar(scores.readability, 'Readability', 'bg-blue')}
          {renderProgressBar(scores.best_practices, 'Best Practices', 'bg-purple')}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="cr-feedback-grid">
        <div className="cr-feedback-section strengths">
          <h4><ThumbsUp size={16} /> Key Strengths</h4>
          <ul>
            {feedback.strengths?.length > 0 ? (
              feedback.strengths.map((str, i) => <li key={i}>{str}</li>)
            ) : (
              <li className="text-muted">No specific strengths highlighted.</li>
            )}
          </ul>
        </div>

        <div className="cr-feedback-section improvements">
          <h4><TrendingUp size={16} /> Areas for Improvement</h4>
          <ul>
            {feedback.improvements?.length > 0 ? (
              feedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)
            ) : (
              <li className="text-muted">No specific improvements needed!</li>
            )}
          </ul>
        </div>
      </div>

      {/* Suggested Optimizations */}
      {feedback.suggestions?.length > 0 && (
        <div className="cr-suggestions-section">
          <h4><AlertTriangle size={16} /> Optimization Suggestions</h4>
          <div className="cr-suggestions-list">
            {feedback.suggestions.map((suggestion, i) => (
              <div key={i} className="cr-suggestion-card">
                <div 
                  className="cr-suggestion-header"
                  onClick={() => toggleIssue(i)}
                >
                  {expandedIssues[i] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>{suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
