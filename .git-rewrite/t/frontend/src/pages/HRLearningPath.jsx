import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Target, Trophy, Play, Check } from 'lucide-react';
import { HR_STAGES, HR_TOPICS, getHRTopicIds, getHRTopicsByStage } from '../data/hrLearningPathData';
import { getHRTopicProgress, getHROverallProgress } from '../data/hrLearningProgress';
import './LearningPath.css';

function StoryboardNode({ topic, index, isLast, onClick }) {
    const progress = getHRTopicProgress(topic.id);
    const isMastered = progress.masteryPercent >= 90;

    return (
        <div className="lp-timeline-node">
            {/* Timeline dot */}
            <div className={`lp-timeline-dot ${isMastered ? 'lp-timeline-dot--done' : ''}`}
                style={{ borderColor: isMastered ? '#34d399' : topic.color }}>
                {isMastered ? <Check size={18} color="#34d399" /> : <span style={{ fontSize: 20 }}>{topic.icon}</span>}
            </div>

            {/* Content Card */}
            <div className="lp-timeline-card" onClick={onClick}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div className="lp-timeline-episode" style={{ color: topic.color }}>
                            Episode {index + 1}
                        </div>
                        <div className="lp-timeline-title">{topic.title}</div>
                        <div className="lp-timeline-desc">{topic.description}</div>
                    </div>
                    <div className="lp-timeline-mastery">
                        <div className="lp-timeline-mastery-value" style={{ color: isMastered ? '#34d399' : '#fff' }}>
                            {progress.masteryPercent}%
                        </div>
                        <div className="lp-timeline-mastery-label">Mastery</div>
                    </div>
                </div>

                <div className="lp-timeline-tags">
                    <span className="lp-timeline-tag"><Target size={12} /> STAR Builder</span>
                    <span className="lp-timeline-tag"><Play size={12} /> Simulator</span>
                </div>
            </div>
        </div>
    );
}

export default function HRLearningPath() {
    const navigate = useNavigate();
    const topicIds = useMemo(() => getHRTopicIds(), []);
    const overall = useMemo(() => getHROverallProgress(topicIds), [topicIds]);

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero lp-hero--hr">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <Users size={14} /> The Behavioral Storyboard
                    </div>
                    <h1 className="lp-hero-title">
                        <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899)' }}>
                            <Users size={22} />
                        </span>
                        Behavioral & HR Mastery
                    </h1>
                    <p className="lp-hero-subtitle">
                        HR rounds test empathy, leadership, and conflict resolution. Craft perfect STAR stories and navigate tricky situational simulators.
                    </p>

                    <div className="lp-stats">
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>
                                <Target size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.avgMastery}%</div>
                                <div className="lp-stat-label">Interview Polish</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                                <Trophy size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.topicsMastered}/{HR_TOPICS.length}</div>
                                <div className="lp-stat-label">Stories Prepared</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Storyboard Timeline */}
            {HR_STAGES.map((stage) => {
                const topics = getHRTopicsByStage(stage.id);
                if (topics.length === 0) return null;
                return (
                    <div key={stage.id} className="lp-stage-section">
                        <div className="lp-stage-section-header">
                            <span className="lp-stage-section-icon" style={{ fontSize: 22 }}>{stage.icon || '🎭'}</span>
                            <h2 className="lp-stage-section-title" style={{ color: stage.color }}>{stage.name}</h2>
                        </div>

                        <div className="lp-timeline">
                            <div className="lp-timeline-line" />
                            {topics.map((topic, idx) => (
                                <StoryboardNode
                                    key={topic.id}
                                    topic={topic}
                                    index={idx}
                                    isLast={idx === topics.length - 1}
                                    onClick={() => navigate(`/hr-path/${topic.id}`)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
