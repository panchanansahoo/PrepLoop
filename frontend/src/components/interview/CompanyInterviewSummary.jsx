import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Brain,
  Volume2,
  Target,
  Users,
  CheckCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import DetailedReport from './DetailedReport';

export function CompanyInterviewSummary({
  summaryData,
  config,
  companyLogo,
  companyName,
  companyColor,
  elapsed,
  formatTime,
  speechFeedback,
  detailedReportData,
  conversation,
  loading,
  resetInterview,
}) {
  if (!summaryData) return null;

  const scoreColor =
    summaryData.overallScore >= 80
      ? '#22c55e'
      : summaryData.overallScore >= 60
        ? '#f59e0b'
        : '#ef4444';
  const bd = summaryData.detailedBreakdown || {};

  return (
    <div className="ti-summary-page">
      {/* Confetti Animation Layer */}
      {summaryData.overallScore >= 70 && (
        <div className="ti-confetti-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="ti-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b'][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}

      <div className="ti-summary" style={{ position: 'relative', zIndex: 1 }}>
        <div className="ti-summary-header">
          <h1>Interview Complete 🎉</h1>
          <p>
            {companyLogo} {companyName} · {config.role} · {config.stage} ·{' '}
            {formatTime(elapsed)}
          </p>
        </div>

        {/* Verdict badge */}
        {summaryData.verdict && (
          <div
            className="ti-verdict-badge"
            style={{ borderColor: scoreColor, color: scoreColor }}
          >
            <span className="ti-verdict-emoji">
              {summaryData.verdictEmoji || '📋'}
            </span>
            <span className="ti-verdict-text">{summaryData.verdict}</span>
          </div>
        )}

        <div className="ti-score-ring" style={{ '--score-color': scoreColor }}>
          <svg viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={`${summaryData.overallScore * 3.14} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="ti-score-text">
            <span className="ti-score-num">{summaryData.overallScore}</span>
            <span className="ti-score-label">Score</span>
          </div>
        </div>

        <p className="ti-summary-desc">{summaryData.summary}</p>

        {/* Detailed Breakdown Bars */}
        {Object.keys(bd).length > 0 && (
          <div className="ti-breakdown-section">
            <h3>
              <BarChart3 size={16} /> Detailed Breakdown
            </h3>
            <div className="ti-breakdown-bars">
              {[
                {
                  key: 'technicalSkills',
                  label: 'Technical Skills',
                  icon: <Brain size={14} />,
                },
                {
                  key: 'communication',
                  label: 'Communication',
                  icon: <Volume2 size={14} />,
                },
                {
                  key: 'problemSolving',
                  label: 'Problem Solving',
                  icon: <Target size={14} />,
                },
                {
                  key: 'cultureFit',
                  label: 'Culture Fit',
                  icon: <Users size={14} />,
                },
              ]
                .filter((item) => bd[item.key] != null)
                .map((item) => (
                  <div key={item.key} className="ti-breakdown-bar">
                    <div className="ti-breakdown-label">
                      {item.icon} <span>{item.label}</span>
                      <strong>
                        {Math.min(100, Math.max(0, bd[item.key]))}%
                      </strong>
                    </div>
                    <div className="ti-breakdown-track">
                      <div
                        className="ti-breakdown-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, bd[item.key]))}%`,
                          background:
                            bd[item.key] >= 80
                              ? '#22c55e'
                              : bd[item.key] >= 60
                                ? '#f59e0b'
                                : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="ti-summary-grid">
          <div className="ti-summary-card strengths">
            <h3>
              <CheckCircle size={16} /> Strengths
            </h3>
            <ul>
              {(summaryData.strengths || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="ti-summary-card improvements">
            <h3>
              <TrendingUp size={16} /> Areas to Improve
            </h3>
            <ul>
              {(summaryData.improvements || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <div className="ti-topic-links">
              <Link to="/learning-path" className="ti-topic-link">
                DSA Topics
              </Link>
              <Link to="/system-design" className="ti-topic-link">
                System Design
              </Link>
            </div>
          </div>
        </div>

        {summaryData.recommendation && (
          <div className="ti-recommendation">
            <Sparkles size={16} /> <span>{summaryData.recommendation}</span>
          </div>
        )}

        {/* Quick AI Suggestions Preview */}
        {summaryData.suggestedTopics?.length > 0 && (
          <div
            className="ti-ai-suggestions-preview"
            style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 14,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#818cf8',
              }}
            >
              🎯 Focus Areas Based on Your Answers
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {summaryData.suggestedTopics.slice(0, 4).map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <strong
                    style={{
                      color:
                        t.priority === 'high'
                          ? '#ef4444'
                          : t.priority === 'medium'
                            ? '#f59e0b'
                            : '#22c55e',
                    }}
                  >
                    {t.priority === 'high'
                      ? '🔴'
                      : t.priority === 'medium'
                        ? '🟡'
                        : '🟢'}
                  </strong>{' '}
                  {t.topic}
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                marginTop: 10,
              }}
            >
              See full study plan & practice questions in the Detailed Analysis
              below →
            </p>
          </div>
        )}

        {speechFeedback && (
          <div className="ti-speech-card">
            <h3>
              <Volume2 size={16} /> Voice Analysis
            </h3>
            <div className="ti-speech-stats">
              <div className="ti-speech-stat">
                <strong>{speechFeedback.wpm}</strong>
                <span>WPM</span>
              </div>
              <div className="ti-speech-stat">
                <strong>{speechFeedback.totalFillers}</strong>
                <span>Fillers</span>
              </div>
              <div className="ti-speech-stat">
                <strong>{speechFeedback.clarityScore}%</strong>
                <span>Clarity</span>
              </div>
            </div>
            <p>{speechFeedback.paceAssessment}</p>
          </div>
        )}

        {/* Detailed Report */}
        {detailedReportData ? (
          <div style={{ marginTop: 24 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BarChart3 size={16} /> Detailed Analysis
            </h3>
            <DetailedReport
              data={{
                ...detailedReportData,
                suggestedTopics:
                  detailedReportData.suggestedTopics ||
                  summaryData?.suggestedTopics ||
                  [],
                practiceQuestions:
                  detailedReportData.practiceQuestions ||
                  summaryData?.practiceQuestions ||
                  [],
                studyPlan:
                  detailedReportData.studyPlan ||
                  summaryData?.studyPlan ||
                  [],
              }}
              companyName={companyName}
              companyColor={companyColor}
              companyLogo={companyLogo}
              conversation={conversation}
            />
          </div>
        ) : loading ? null : (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 0',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
            }}
          >
            Loading detailed analysis...
          </div>
        )}

        <div className="ti-summary-actions">
          <button className="ti-retry-btn" onClick={resetInterview}>
            <RefreshCw size={16} /> Try Again
          </button>
          <Link to="/company-prep" className="ti-back-btn">
            <ArrowLeft size={16} /> Back to Prep
          </Link>
          <Link to="/dashboard" className="ti-home-btn">
            🏠 Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CompanyInterviewSummary;

