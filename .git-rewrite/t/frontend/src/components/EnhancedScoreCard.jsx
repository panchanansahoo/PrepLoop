import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Sparkles, Target, Eye, MessageSquare, Award } from 'lucide-react';
import './EnhancedScoreCard.css';

export default function EnhancedScoreCard({ data }) {
    const [expanded, setExpanded] = useState(false);

    if (!data || data.score === undefined) return null;

    const getScoreColor = (score) => {
        if (score >= 85) return '#4ade80';
        if (score >= 70) return '#fbbf24';
        if (score >= 50) return '#fb923c';
        return '#f87171';
    };

    const getScoreLabel = (score) => {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Needs Work';
    };

    const mainColor = getScoreColor(data.score);

    return (
        <div className="esc-card" style={{ '--esc-accent': mainColor }}>
            {/* Compact Score Bar */}
            <div className="esc-compact" onClick={() => setExpanded(!expanded)}>
                <div className="esc-score-badge" style={{ background: `${mainColor}15`, borderColor: `${mainColor}30` }}>
                    <span className="esc-score-number" style={{ color: mainColor }}>{data.score}</span>
                    <span className="esc-score-label">{getScoreLabel(data.score)}</span>
                </div>

                <div className="esc-mini-bars">
                    {[
                        { label: 'Structure', value: data.structureScore, icon: Target },
                        { label: 'Clarity', value: data.clarityScore, icon: Eye },
                        { label: 'Depth', value: data.depthScore, icon: BarChart3 },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="esc-mini-bar">
                            <div className="esc-mini-header">
                                <Icon size={10} />
                                <span>{label}</span>
                                <span className="esc-mini-value">{value || '--'}</span>
                            </div>
                            <div className="esc-mini-track">
                                <div
                                    className="esc-mini-fill"
                                    style={{
                                        width: `${value || 0}%`,
                                        background: getScoreColor(value || 0)
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button className="esc-expand-btn">
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="esc-expanded">
                    {/* Model Answer */}
                    {data.modelAnswer && (
                        <div className="esc-model-answer">
                            <div className="esc-model-header">
                                <Award size={14} />
                                <span>Model Answer</span>
                            </div>
                            <p>{data.modelAnswer}</p>
                        </div>
                    )}

                    {/* Tips */}
                    {data.answerTips && data.answerTips.length > 0 && (
                        <div className="esc-tips">
                            <div className="esc-tips-header">
                                <Sparkles size={14} />
                                <span>Improvement Tips</span>
                            </div>
                            <ul>
                                {data.answerTips.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Strengths & Improvements */}
                    <div className="esc-feedback-grid">
                        {data.strengths && data.strengths.length > 0 && (
                            <div className="esc-feedback-col esc-strengths">
                                <span className="esc-feedback-label">✓ Strengths</span>
                                {data.strengths.map((s, i) => (
                                    <span key={i} className="esc-feedback-item">{s}</span>
                                ))}
                            </div>
                        )}
                        {data.improvements && data.improvements.length > 0 && (
                            <div className="esc-feedback-col esc-improvements">
                                <span className="esc-feedback-label">△ Improve</span>
                                {data.improvements.map((imp, i) => (
                                    <span key={i} className="esc-feedback-item">{imp}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
