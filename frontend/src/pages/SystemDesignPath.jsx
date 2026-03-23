import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Clock, ArrowRight, CheckCircle, Layers } from 'lucide-react';
import { SD_PHASES, SD_TOPICS } from '../data/systemDesignData';
import { getSDPhaseProgress, getSDOverallProgress, isSDTopicComplete } from '../data/systemDesignProgress';

function ProgressRing({ progress, size = 44, stroke = 4, color = '#818cf8', isLight = false }) {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (progress / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={isLight ? '#1e293b' : 'white'} fontSize="11" fontWeight="bold" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{progress}%</text>
        </svg>
    );
}

function TopicCard({ topic, onClick, isLight = false }) {
    const complete = isSDTopicComplete(topic.id);
    return (
        <button onClick={onClick} style={{
            background: complete ? 'rgba(52,211,153,0.08)' : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
            border: `1px solid ${complete ? 'rgba(52,211,153,0.3)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)')}`,
            borderRadius: '14px', padding: '20px', textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '16px', width: '100%',
            transition: 'all 0.2s ease'
        }}>
            <div style={{ fontSize: '28px', minWidth: '40px', textAlign: 'center' }}>{topic.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ color: isLight ? '#1e293b' : '#fff', fontWeight: 600, fontSize: '15px' }}>{topic.title}</span>
                    {complete && <CheckCircle size={16} style={{ color: '#34d399' }} />}
                </div>
                <p style={{ color: 'var(--zinc-500)', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.description}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: `${topic.color}22`, color: topic.color }}>{topic.difficulty}</span>
                    <span style={{ fontSize: '11px', color: 'var(--zinc-500)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} />{topic.estimatedTime}</span>
                </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--zinc-600)', flexShrink: 0 }} />
        </button>
    );
}

export default function SystemDesignPath() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [openPhases, setOpenPhases] = useState({ fundamentals: true });
    const overall = useMemo(() => getSDOverallProgress(), []);

    const toggle = (id) => setOpenPhases(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 80px' }}>
            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Layers size={28} style={{ color: '#10b981' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: isLight ? '#1e293b' : '#fff', margin: 0 }}>System Design Mastery</h1>
                </div>
                <p style={{ color: 'var(--zinc-400)', fontSize: '15px', margin: 0 }}>
                    Master 20 system design topics — from scalability fundamentals to AI-native systems.
                </p>
            </div>

            {/* Overall Progress */}
            <div style={{
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '16px', padding: '24px', marginBottom: '32px',
                display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap'
            }}>
                <ProgressRing progress={overall.percentage} size={64} stroke={5} color="#10b981" isLight={isLight} />
                <div>
                    <div style={{ color: isLight ? '#1e293b' : '#fff', fontWeight: 600, fontSize: '17px' }}>{overall.completed} / {overall.total} topics completed</div>
                    <div style={{ color: 'var(--zinc-500)', fontSize: '13px', marginTop: '4px' }}>Keep going — consistency beats intensity!</div>
                </div>
            </div>

            {/* Phases */}
            {SD_PHASES.map(phase => {
                const isOpen = openPhases[phase.id];
                const topics = SD_TOPICS.filter(t => t.stage === phase.id);
                const phaseProgress = getSDPhaseProgress(phase.id);
                return (
                    <div key={phase.id} style={{ marginBottom: '16px' }}>
                        <button onClick={() => toggle(phase.id)} style={{
                            width: '100%', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: isOpen ? '14px 14px 0 0' : '14px', padding: '18px 20px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s'
                        }}>
                            <span style={{ fontSize: '24px' }}>{phase.icon}</span>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ color: isLight ? '#1e293b' : '#fff', fontWeight: 600, fontSize: '16px' }}>{phase.name}</div>
                                <div style={{ color: 'var(--zinc-500)', fontSize: '12px', marginTop: '2px' }}>{phaseProgress.completed}/{phaseProgress.total} completed</div>
                            </div>
                            <ProgressRing progress={phaseProgress.percentage} size={40} stroke={3} color={phase.color} isLight={isLight} />
                            {isOpen ? <ChevronDown size={20} style={{ color: 'var(--zinc-500)' }} /> : <ChevronRight size={20} style={{ color: 'var(--zinc-500)' }} />}
                        </button>
                        {isOpen && (
                            <div style={{
                                background: isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`, borderTop: 'none',
                                borderRadius: '0 0 14px 14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                {topics.map(topic => (
                                    <TopicCard key={topic.id} topic={topic} isLight={isLight} onClick={() => navigate(`/system-design/${topic.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
