import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Clock, ArrowRight, CheckCircle, Layers, Target, Trophy } from 'lucide-react';
import { SD_PHASES, SD_TOPICS } from '../data/systemDesignData';
import { getSDPhaseProgress, getSDOverallProgress, isSDTopicComplete } from '../data/systemDesignProgress';
import LearningPathShowcase from '../components/LearningPathShowcase';
import './LearningPath.css';

function ProgressRing({ percent, size = 44, strokeWidth = 4, color = '#10b981' }) {
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

function TopicCard({ topic, onClick }) {
    const complete = isSDTopicComplete(topic.id);
    return (
        <div className={`lp-card ${complete ? 'lp-card--emerald' : 'lp-card--cyan'}`} onClick={onClick}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 28, minWidth: 40, textAlign: 'center' }}>{topic.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="lp-card-title">{topic.title}</span>
                    {complete && <CheckCircle size={16} style={{ color: '#34d399' }} />}
                </div>
                <div className="lp-card-desc" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className="lp-card-badge" style={{ background: `${topic.color}22`, color: topic.color }}>{topic.difficulty}</span>
                    <span className="lp-card-meta-item"><Clock size={11} /> {topic.estimatedTime}</span>
                </div>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
        </div>
    );
}

function buildSDInsights(topics, navigate) {
    return topics.slice(0, 3).map(topic => {
        const complete = isSDTopicComplete(topic.id);
        const firstConcept = topic.concepts?.[0];
        const firstPoint = firstConcept?.points?.[0];
        const keyDesign = topic.keyDesigns?.[0];
        return {
            id: topic.id,
            title: topic.title,
            color: topic.color,
            meta: `${complete ? 'Completed' : 'In progress'} · ${topic.difficulty} · ${topic.estimatedTime}`,
            sectionTitle: firstConcept?.title || 'Architecture core',
            content: firstPoint || topic.description,
            chips: [
                `${topic.concepts?.length || 0} concept blocks`,
                `${topic.keyDesigns?.length || 0} case studies`,
                keyDesign?.title || 'Design tradeoffs',
            ],
            footerHint: `System focus: ${topic.invariants?.[0] || 'Start with scale, latency, and tradeoffs'}`,
            onClick: () => navigate(`/system-design/${topic.id}`),
        };
    });
}

export default function SystemDesignPath() {
    const navigate = useNavigate();
    const [openPhases, setOpenPhases] = useState({ fundamentals: true });
    const overall = useMemo(() => getSDOverallProgress(), []);
    const sdTopics = useMemo(() => {
        return [...SD_TOPICS]
            .map(topic => ({ topic, complete: isSDTopicComplete(topic.id) }))
            .sort((a, b) => Number(a.complete) - Number(b.complete))
            .map(item => item.topic);
    }, []);
    const sdInsights = useMemo(() => buildSDInsights(sdTopics, navigate), [sdTopics, navigate]);
    const toggle = (id) => setOpenPhases(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero lp-hero--sd">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <Layers size={14} /> System Design Mastery
                    </div>
                    <h1 className="lp-hero-title">
                        <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                            <Layers size={22} />
                        </span>
                        System Design Path
                    </h1>
                    <p className="lp-hero-subtitle">
                        Master 20 system design topics — from scalability fundamentals to AI-native systems.
                    </p>

                    <div className="lp-stats">
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                <Target size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.percentage}%</div>
                                <div className="lp-stat-label">Overall Progress</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                                <Trophy size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{overall.completed}/{overall.total}</div>
                                <div className="lp-stat-label">Topics Completed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <LearningPathShowcase
                guideTitle="How to study system design"
                guideSubtitle="Learn the tradeoffs, connect them to real systems, then practice explaining architecture decisions."
                steps={[
                    { step: '01', title: 'Understand the tradeoff', desc: 'Start with scaling, consistency, and latency constraints.' },
                    { step: '02', title: 'Map the components', desc: 'Break systems into storage, cache, compute, and messaging pieces.' },
                    { step: '03', title: 'Practice the narrative', desc: 'Explain why each choice fits the expected traffic and reliability goals.' },
                ]}
                ctaLabel="Open AI Advanced Roadmap"
                onCtaClick={() => navigate('/advanced-learning-path')}
                insightsTitle="Architecture spotlight"
                insightsSubtitle="Preview the theory blocks that anchor system design interviews"
                insights={sdInsights}
            />

            {/* Phase Accordions */}
            {SD_PHASES.map(phase => {
                const isOpen = openPhases[phase.id];
                const topics = SD_TOPICS.filter(t => t.stage === phase.id);
                const phaseProgress = getSDPhaseProgress(phase.id);
                return (
                    <div key={phase.id} className="lp-stage">
                        <button
                            className={`lp-stage-header ${isOpen ? 'lp-stage-header--open' : ''}`}
                            onClick={() => toggle(phase.id)}>
                            <div className="lp-stage-header-left">
                                <span className="lp-stage-icon">{phase.icon}</span>
                                <div>
                                    <div className="lp-stage-name">{phase.name}</div>
                                    <div className="lp-stage-info">{phaseProgress.completed}/{phaseProgress.total} completed</div>
                                </div>
                            </div>
                            <div className="lp-stage-header-right">
                                <ProgressRing percent={phaseProgress.percentage} size={40} strokeWidth={3} color={phase.color} />
                                <ChevronDown size={18} className={`lp-stage-chevron ${isOpen ? 'lp-stage-chevron--open' : ''}`} />
                            </div>
                        </button>

                        {isOpen && (
                            <div className="lp-stage-body" style={{ flexDirection: 'column' }}>
                                {topics.map(topic => (
                                    <TopicCard key={topic.id} topic={topic} onClick={() => navigate(`/system-design/${topic.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
