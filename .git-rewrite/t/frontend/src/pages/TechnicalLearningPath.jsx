import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, ChevronRight, Target, Trophy, Clock } from 'lucide-react';
import { TECHNICAL_STAGES, TECHNICAL_TOPICS, getTechnicalTopicIds, getTechnicalTopicsByStage } from '../data/technicalLearningPathData';
import { getTechnicalTopicProgress, getTechOverallProgress } from '../data/technicalLearningProgress';
import './LearningPath.css';

function ProgressRing({ percent, size = 48, strokeWidth = 4, color = '#34d399' }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="lp-progress-ring" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="#fff"
                fontSize={size * 0.22} fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {percent}%
            </text>
        </svg>
    );
}

function BlueprintCard({ topic, onClick }) {
    const progress = getTechnicalTopicProgress(topic.id);
    return (
        <div className="lp-card lp-card--emerald" onClick={onClick}>
            <div className="lp-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="lp-card-icon" style={{ background: `${topic.color}20` }}>{topic.icon}</div>
                    <div>
                        <div className="lp-card-title">{topic.title}</div>
                        <div className="lp-card-desc" style={{ color: topic.color, fontWeight: 600 }}>{topic.difficulty} • {topic.estimatedTime}</div>
                    </div>
                </div>
                <ProgressRing percent={progress.masteryPercent} color={topic.color} size={46} />
            </div>
            <div className="lp-card-desc">{topic.description}</div>
            <div className="lp-card-meta">
                <span className="lp-card-meta-item">{topic.flashcards.length} Flashcards</span>
                <span className="lp-card-meta-item">{topic.scenarios.length} Scenarios</span>
                <span className="lp-card-meta-item" style={{ marginLeft: 'auto' }}>
                    <ChevronRight size={14} />
                </span>
            </div>
        </div>
    );
}

export default function TechnicalLearningPath() {
    const navigate = useNavigate();
    const topicIds = useMemo(() => getTechnicalTopicIds(), []);
    const overall = useMemo(() => getTechOverallProgress(topicIds), [topicIds]);

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero lp-hero--tech">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <Server size={14} /> The Tech Blueprint
                    </div>
                    <h1 className="lp-hero-title">
                        <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}>
                            <Server size={22} />
                        </span>
                        Technical & CS Mastery
                    </h1>
                    <p className="lp-hero-subtitle">
                        Master the architecture of modern applications. Dive into OS, Databases, Networking, and System Design scenarios.
                    </p>

                    <div className="lp-stats">
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                                <Target size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.avgMastery}%</div>
                                <div className="lp-stat-label">Architecture Mastery</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                                <Trophy size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.topicsMastered}/{TECHNICAL_TOPICS.length}</div>
                                <div className="lp-stat-label">Modules Completed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stages */}
            {TECHNICAL_STAGES.map((stage) => {
                const topics = getTechnicalTopicsByStage(stage.id);
                if (topics.length === 0) return null;
                return (
                    <div key={stage.id} className="lp-stage-section">
                        <div className="lp-stage-section-header">
                            <span className="lp-stage-section-icon">{stage.icon}</span>
                            <h2 className="lp-stage-section-title">{stage.name}</h2>
                        </div>
                        <div className="lp-grid">
                            {topics.map(topic => (
                                <BlueprintCard key={topic.id} topic={topic} onClick={() => navigate(`/technical-path/${topic.id}`)} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
