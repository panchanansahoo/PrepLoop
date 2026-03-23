import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Users, MessagesSquare, Target, Check, Play, BookOpen } from 'lucide-react';
import { HR_STAGES, HR_TOPICS, getHRTopicIds, getHRTopicsByStage } from '../data/hrLearningPathData';
import { getHRTopicProgress, getHROverallProgress } from '../data/hrLearningProgress';

function StoryboardNode({ topic, index, isLast, onClick, isLight }) {
    const progress = getHRTopicProgress(topic.id);
    const isMastered = progress.masteryPercent >= 90;

    return (
        <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
            {/* Timeline Line */}
            {!isLast && (
                <div style={{
                    position: 'absolute', left: 24, top: 48, bottom: -24, width: 2,
                    background: isMastered ? '#34d399' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'), zIndex: 0
                }} />
            )}

            {/* Icon Node */}
            <div style={{
                width: 50, height: 50, borderRadius: '50%', background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                border: `2px solid ${isMastered ? '#34d399' : topic.color}`, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                boxShadow: isMastered ? '0 0 15px rgba(52,211,153,0.3)' : 'none'
            }}>
                {isMastered ? <Check color="#34d399" /> : topic.icon}
            </div>

            {/* Content Card */}
            <div onClick={onClick} style={{
                flex: 1, background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,25,0.9)', border: `1px solid ${isMastered ? 'rgba(52,211,153,0.3)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)')}`,
                borderRadius: 16, padding: 24, marginBottom: 32, cursor: 'pointer',
                transition: 'all 0.3s', position: 'relative'
            }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = topic.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = isMastered ? 'rgba(52,211,153,0.3)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)'); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 12, color: topic.color, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Episode {index + 1}
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 8 }}>{topic.title}</h3>
                        <p style={{ fontSize: 14, color: isLight ? '#64748b' : '#a1a1aa', margin: 0, lineHeight: 1.5, maxWidth: 500 }}>{topic.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isMastered ? '#34d399' : (isLight ? '#1e293b' : '#fff') }}>{progress.masteryPercent}%</div>
                        <div style={{ fontSize: 11, color: '#525252' }}>Mastery</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <span style={{ fontSize: 11, padding: '4px 10px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: 6, color: isLight ? '#475569' : '#d4d4d8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Target size={12} /> STAR Builder
                    </span>
                    <span style={{ fontSize: 11, padding: '4px 10px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: 6, color: isLight ? '#475569' : '#d4d4d8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Play size={12} /> Simulator Map
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function HRLearningPath() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const topicIds = useMemo(() => getHRTopicIds(), []);
    const overall = useMemo(() => getHROverallProgress(topicIds), []);

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#050507', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>

            {/* Hero Section */}
            <section style={{ padding: '60px 24px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99,
                    background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', fontSize: 13, color: '#f472b6', marginBottom: 24
                }}>
                    <Users size={14} /> The Behavioral Storyboard
                </div>
                <h1 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
                    Nail the <br />
                    <span style={{ color: '#f472b6' }}>"Soft Skills" Interview</span>
                </h1>
                <p style={{ fontSize: 16, color: '#a1a1aa', maxWidth: 650, margin: '0 auto 40px', lineHeight: 1.6 }}>
                    HR rounds test your empathy, leadership, and conflict resolution. Craft perfect STAR stories and navigate tricky situational simulators.
                </p>

                {/* Overall Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, maxWidth: 500, margin: '0 auto' }}>
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '20px' }}>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#f472b6' }}>{overall.avgMastery}%</div>
                        <div style={{ fontSize: 12, color: isLight ? '#64748b' : '#a1a1aa', marginTop: 4 }}>Interview Polish</div>
                    </div>
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '20px' }}>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#818cf8' }}>{overall.topicsMastered}/{HR_TOPICS.length}</div>
                        <div style={{ fontSize: 12, color: isLight ? '#64748b' : '#a1a1aa', marginTop: 4 }}>Stories Prepared</div>
                    </div>
                </div>
            </section>

            {/* Storyboard Timeline */}
            <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
                {HR_STAGES.map((stage) => {
                    const topics = getHRTopicsByStage(stage.id);
                    if (topics.length === 0) return null;
                    return (
                        <div key={stage.id} style={{ marginBottom: 40 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: stage.color, marginBottom: 24, paddingLeft: 14 }}>
                                {stage.name}
                            </h2>
                            <div>
                                {topics.map((topic, idx) => (
                                    <StoryboardNode
                                        key={topic.id}
                                        topic={topic}
                                        index={idx}
                                        isLast={idx === topics.length - 1}
                                        isLight={isLight}
                                        onClick={() => navigate(`/hr-path/${topic.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>

        </div>
    );
}
