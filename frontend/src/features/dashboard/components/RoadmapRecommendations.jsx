import React, { useState } from 'react';
import { ChevronRight, Sparkles, TrendingUp, AlertCircle, Zap, Target, Award } from 'lucide-react';
import './roadmap-recommendations.css';

export default function RoadmapRecommendations({ recommendations, stats, insights, onSelectGuide, isExpanded = true }) {
    const [expanded, setExpanded] = useState(isExpanded);

    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    const getRecommendationIcon = (type) => {
        switch (type) {
            case 'continue':
                return <ChevronRight className="recommendation-icon continue" />;
            case 'natural-progression':
                return <TrendingUp className="recommendation-icon progression" />;
            case 'difficulty-step-up':
                return <Zap className="recommendation-icon step-up" />;
            case 'weak-area':
                return <AlertCircle className="recommendation-icon weak-area" />;
            case 'diversify':
                return <Target className="recommendation-icon diversify" />;
            case 'quick-win':
                return <Award className="recommendation-icon quick-win" />;
            default:
                return <Sparkles className="recommendation-icon" />;
        }
    };

    const getRecommendationColor = (type) => {
        switch (type) {
            case 'continue':
                return 'continue-badge';
            case 'natural-progression':
                return 'progression-badge';
            case 'difficulty-step-up':
                return 'step-up-badge';
            case 'weak-area':
                return 'weak-area-badge';
            case 'diversify':
                return 'diversify-badge';
            case 'quick-win':
                return 'quick-win-badge';
            default:
                return 'default-badge';
        }
    };

    return (
        <div className="roadmap-recommendations-container">
            {/* Header */}
            <div className="recommendations-header" onClick={() => setExpanded(!expanded)}>
                <div className="recommendations-header-left">
                    <Sparkles className="header-icon" />
                    <h3>AI Recommendations</h3>
                    {stats && (
                        <span className="progress-badge">
                            {stats.completedGuides}/{stats.totalGuides} complete
                        </span>
                    )}
                </div>
                <button className={`expand-btn ${expanded ? 'expanded' : ''}`}>
                    <ChevronRight />
                </button>
            </div>

            {/* Expandable Content */}
            {expanded && (
                <div className="recommendations-content">
                    {/* Insights Section */}
                    {insights && insights.length > 0 && (
                        <div className="insights-section">
                            {insights.map((insight, idx) => (
                                <div key={idx} className={`insight-card insight-${insight.type}`}>
                                    <p>{insight.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recommendations List */}
                    <div className="recommendations-list">
                        {recommendations.map((rec, idx) => (
                            <div
                                key={rec.guide.id}
                                className={`recommendation-card recommendation-${rec.type}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="recommendation-header">
                                    <div className="recommendation-icon-wrapper">
                                        {getRecommendationIcon(rec.type)}
                                    </div>
                                    <div className="recommendation-meta">
                                        <h4>{rec.guide.name || rec.guide.label}</h4>
                                        <span className={`recommendation-type-badge ${getRecommendationColor(rec.type)}`}>
                                            {rec.type.replace(/-/g, ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <p className="recommendation-reason">{rec.reason}</p>

                                {rec.guide.difficulty && (
                                    <div className="guide-meta">
                                        <span className={`difficulty-indicator difficulty-${rec.guide.difficulty.toLowerCase()}`}>
                                            {rec.guide.difficulty}
                                        </span>
                                        {rec.guide.totalCount && (
                                            <span className="problem-count">
                                                {rec.guide.totalCount} problems
                                            </span>
                                        )}
                                    </div>
                                )}

                                <button
                                    className="select-guide-btn"
                                    onClick={() => onSelectGuide && onSelectGuide(rec.guide)}
                                >
                                    Start Guide
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Stats Summary */}
                    {stats && (
                        <div className="stats-summary">
                            <div className="stat-box">
                                <span className="stat-label">Overall Progress</span>
                                <span className="stat-value">{stats.overallProgress}%</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">In Progress</span>
                                <span className="stat-value">{stats.inProgressGuides}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Solved</span>
                                <span className="stat-value">{stats.totalSolved}/{stats.totalProblems}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
