import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Map, Server, Users, BookOpen, ArrowRight, Target, Trophy, Zap, Flame, Clock, Sparkles } from 'lucide-react';
import { getDSATopicIds } from '../data/dsaLearningPathData';
import { getDSAOverallProgress } from '../data/dsaLearningProgress';
import { getTechnicalTopicIds } from '../data/technicalLearningPathData';
import { getTechOverallProgress } from '../data/technicalLearningProgress';
import { getHRTopicIds } from '../data/hrLearningPathData';
import { getHROverallProgress } from '../data/hrLearningProgress';
import { getTopicIds } from '../data/learningPathData';
import { getOverallProgress, getStreakDays } from '../data/learningPathProgress';
import './LearningPath.css';

function ProgressRing({ percent, size = 52, strokeWidth = 4, color = '#818cf8' }) {
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

const PATH_CARDS = [
    {
        id: 'dsa',
        title: 'DSA Mastery',
        desc: 'Master 15 DSA topics with pattern-first learning. Concepts → Thinking → Tricks → Practice.',
        path: '/dsa-path',
        icon: '🧩',
        accentColor: '#818cf8',
        bgColor: 'rgba(129, 140, 248, 0.12)',
        cardClass: 'lp-hub-card--dsa',
    },
    {
        id: 'tech',
        title: 'Technical & CS',
        desc: 'Master OS, Databases, Networking, and real-world System Design with blueprint-style learning.',
        path: '/technical-path',
        icon: '⚙️',
        accentColor: '#34d399',
        bgColor: 'rgba(52, 211, 153, 0.12)',
        cardClass: 'lp-hub-card--tech',
    },
    {
        id: 'hr',
        title: 'Behavioral & HR',
        desc: 'Craft perfect STAR stories and navigate situational simulators for soft-skills interviews.',
        path: '/hr-path',
        icon: '🎭',
        accentColor: '#f472b6',
        bgColor: 'rgba(244, 114, 182, 0.12)',
        cardClass: 'lp-hub-card--hr',
    },
    {
        id: 'aptitude',
        title: 'Aptitude & Quant',
        desc: 'Theory → Quick Methods → Tricks → Practice. Master formulas, shortcuts, and time-saving strategies.',
        path: '/learning-path',
        icon: '📐',
        accentColor: '#facc15',
        bgColor: 'rgba(250, 204, 21, 0.10)',
        cardClass: 'lp-hub-card--aptitude',
    },
];

export default function LearningHub() {
    const navigate = useNavigate();

    const dsaIds = useMemo(() => getDSATopicIds(), []);
    const dsaOverall = useMemo(() => getDSAOverallProgress(dsaIds), [dsaIds]);

    const techIds = useMemo(() => getTechnicalTopicIds(), []);
    const techOverall = useMemo(() => getTechOverallProgress(techIds), [techIds]);

    const hrIds = useMemo(() => getHRTopicIds(), []);
    const hrOverall = useMemo(() => getHROverallProgress(hrIds), [hrIds]);

    const aptIds = useMemo(() => getTopicIds(), []);
    const aptOverall = useMemo(() => getOverallProgress(aptIds), [aptIds]);
    const streak = useMemo(() => getStreakDays(), []);

    const pathStats = {
        dsa: dsaOverall,
        tech: techOverall,
        hr: hrOverall,
        aptitude: aptOverall,
    };

    const totalMastery = Math.round(
        (dsaOverall.avgMastery + techOverall.avgMastery + hrOverall.avgMastery + aptOverall.avgMastery) / 4
    );
    const totalTopics = dsaOverall.topicsMastered + techOverall.topicsMastered + hrOverall.topicsMastered + aptOverall.topicsMastered;
    const totalSolved = (dsaOverall.totalSolved || 0) + (aptOverall.totalSolved || 0);

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero">
                <div className="lp-hero-content">
                    <div className="lp-hero-top">
                        <div>
                            <div className="lp-hero-badge">
                                <GraduationCap size={14} /> Learning Command Center
                            </div>
                            <h1 className="lp-hero-title">
                                <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                                    <BookOpen size={22} />
                                </span>
                                Learning Hub
                            </h1>
                            <p className="lp-hero-subtitle">
                                Your structured path to mastering DSA, System Design, CS Fundamentals, Behavioral & Aptitude — all in one place.
                            </p>
                        </div>
                    </div>

                    <div className="lp-stats">
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
                                <Target size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{totalMastery}%</div>
                                <div className="lp-stat-label">Avg Mastery</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                                <Trophy size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{totalTopics}</div>
                                <div className="lp-stat-label">Mastered</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                                <Zap size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{totalSolved}</div>
                                <div className="lp-stat-label">Solved</div>
                            </div>
                        </div>
                        <div className="lp-stat-pill">
                            <div className="lp-stat-icon" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>
                                <Flame size={14} />
                            </div>
                            <div>
                                <div className="lp-stat-value">{streak}</div>
                                <div className="lp-stat-label">Day Streak</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Cards */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                    <Map size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Choose Your Path</h2>
                    <p className="lp-section-subtitle">Pick a track to start or continue your journey</p>
                </div>
            </div>

            <div className="lp-hub-grid">
                {PATH_CARDS.map(card => {
                    const stats = pathStats[card.id];
                    return (
                        <div key={card.id} className={`lp-hub-card ${card.cardClass}`} onClick={() => navigate(card.path)}>
                            <div className="lp-hub-card-icon" style={{ background: card.bgColor }}>
                                {card.icon}
                            </div>
                            <div className="lp-hub-card-title">{card.title}</div>
                            <div className="lp-hub-card-desc">{card.desc}</div>
                            <div className="lp-hub-card-footer">
                                <div>
                                    <div className="lp-hub-card-stat" style={{ color: card.accentColor }}>
                                        {stats.avgMastery}% mastery
                                    </div>
                                    <div className="lp-hub-card-stat-label">
                                        {stats.topicsMastered} topics mastered
                                    </div>
                                </div>
                                <div className="lp-hub-card-arrow">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="lp-section-header" style={{ marginTop: 12 }}>
                <div className="lp-section-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
                    <Sparkles size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Quick Access</h2>
                    <p className="lp-section-subtitle">Jump into specialized tools</p>
                </div>
            </div>

            <div className="lp-grid lp-grid--3">
                {[
                    { label: 'System Design', desc: 'Architecture & scaling mastery', icon: '🏗️', path: '/system-design', color: '#10b981', glow: 'lp-card--emerald' },
                    { label: 'AI Roadmap', desc: 'AI-generated personalized plan', icon: '🗺️', path: '/advanced-learning-path', color: '#38bdf8', glow: 'lp-card--cyan' },
                ].map(item => (
                    <div key={item.label} className={`lp-card ${item.glow}`} onClick={() => navigate(item.path)}>
                        <div className="lp-card-top">
                            <div className="lp-card-icon" style={{ background: `${item.color}18`, fontSize: 20 }}>
                                {item.icon}
                            </div>
                        </div>
                        <div className="lp-card-title">{item.label}</div>
                        <div className="lp-card-desc">{item.desc}</div>
                        <div className="lp-card-meta">
                            <span className="lp-card-meta-item">
                                <ArrowRight size={12} /> Explore
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
