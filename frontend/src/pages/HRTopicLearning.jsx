import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, BookOpen, Target, Play, Check, Navigation, AlertTriangle, Lightbulb } from 'lucide-react';
import { HR_TOPICS } from '../data/hrLearningPathData';
import { HR_THEORY } from '../data/hrTheoryData';
import {
    getHRTopicProgress, markHRTheoryRead, markHRStarSaved, saveHRSimulatorScore
} from '../data/hrLearningProgress';

const TABS = [
    { id: 'theory', label: 'Theory & Breakdown', icon: <BookOpen size={16} /> },
    { id: 'simulator', label: 'Situation Simulator', icon: <Play size={16} /> },
    { id: 'star', label: 'STAR Builder', icon: <Target size={16} /> }
];

function SimulatorGame({ simulator, onComplete, isLight }) {
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    if (!simulator) return <div style={{ color: '#a1a1aa', padding: 20 }}>No simulator available for this topic.</div>;

    const handleSubmit = () => {
        setSubmitted(true);
        if (selectedIdx !== null) {
            const isGood = simulator.options[selectedIdx].isGood;
            onComplete(isGood ? 100 : 50); // Give partial mapping points just for trying
        }
    };

    return (
        <div style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,25,0.8)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: 32 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12 }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', fontStyle: 'italic' }}>"{simulator.question}"</span>
            </div>

            <h3 style={{ fontSize: 14, color: isLight ? '#64748b' : '#a1a1aa', marginBottom: 16 }}>Choose your response strategy:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {simulator.options.map((opt, idx) => (
                    <div
                        key={idx}
                        onClick={() => !submitted && setSelectedIdx(idx)}
                        style={{
                            padding: '16px 20px', borderRadius: 12, cursor: submitted ? 'default' : 'pointer',
                            border: selectedIdx === idx ? '1px solid #3b82f6' : `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                            background: selectedIdx === idx ? 'rgba(59,130,246,0.1)' : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)'),
                            transition: 'all 0.2s', opacity: submitted && selectedIdx !== idx ? 0.5 : 1
                        }}>
                        <div style={{ fontSize: 14, color: isLight ? '#1e293b' : '#fff', lineHeight: 1.5 }}>"{opt.text}"</div>

                        {submitted && selectedIdx === idx && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                {opt.isGood ? <Check color="#34d399" size={16} /> : <AlertTriangle color="#f59e0b" size={16} />}
                                <span style={{ fontSize: 13, color: opt.isGood ? '#34d399' : '#f59e0b' }}>
                                    {opt.feedback}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!submitted ? (
                <button onClick={handleSubmit} disabled={selectedIdx === null} style={{
                    background: selectedIdx !== null ? '#3b82f6' : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'), color: selectedIdx !== null ? '#fff' : (isLight ? '#1e293b' : '#fff'),
                    border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: selectedIdx !== null ? 'pointer' : 'default', width: '100%'
                }}>Submit Response</button>
            ) : (
                <button onClick={() => { setSubmitted(false); setSelectedIdx(null); }} style={{
                    background: 'transparent', border: `1px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`, color: isLight ? '#1e293b' : '#fff',
                    padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', width: '100%'
                }}>Try Again</button>
            )}
        </div>
    );
}

function StarBuilder({ prompt, isSaved, onSave, isLight }) {
    const [s, setS] = useState('');
    const [t, setT] = useState('');
    const [a, setA] = useState('');
    const [r, setR] = useState('');

    return (
        <div style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,25,0.8)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 14, color: '#d4d4d8', marginBottom: 24, fontStyle: 'italic' }}>{prompt}</div>

            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>S - Situation</div>
                    <textarea placeholder="Set the scene (e.g., 'At my last job, we were launching a major feature...')" value={s} onChange={e => setS(e.target.value)} style={{ width: '100%', minHeight: 60, background: 'transparent', border: 'none', color: isLight ? '#1e293b' : '#fff', resize: 'vertical', outline: 'none' }} />
                </div>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f472b6', marginBottom: 8 }}>T - Task</div>
                    <textarea placeholder="What was your specific responsibility?" value={t} onChange={e => setT(e.target.value)} style={{ width: '100%', minHeight: 60, background: 'transparent', border: 'none', color: isLight ? '#1e293b' : '#fff', resize: 'vertical', outline: 'none' }} />
                </div>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 8 }}>A - Action</div>
                    <textarea placeholder="What did YOU do to solve it? (Use 'I', not 'We')" value={a} onChange={e => setA(e.target.value)} style={{ width: '100%', minHeight: 80, background: 'transparent', border: 'none', color: isLight ? '#1e293b' : '#fff', resize: 'vertical', outline: 'none' }} />
                </div>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 12, border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#facc15', marginBottom: 8 }}>R - Result</div>
                    <textarea placeholder="What was the outcome? Use metrics if possible." value={r} onChange={e => setR(e.target.value)} style={{ width: '100%', minHeight: 60, background: 'transparent', border: 'none', color: isLight ? '#1e293b' : '#fff', resize: 'vertical', outline: 'none' }} />
                </div>
            </div>

            <button onClick={onSave} style={{
                background: isSaved ? 'rgba(52,211,153,0.2)' : '#f472b6', color: isSaved ? '#34d399' : '#fff', border: 'none',
                padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
                {isSaved ? <><Check size={18} /> Story Saved to Repository</> : 'Save STAR Story to Vault'}
            </button>
        </div>
    );
}

export default function HRTopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [activeTab, setActiveTab] = useState('theory');
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => HR_TOPICS.find(t => t.id === topicId), [topicId]);
    const theoryData = useMemo(() => HR_THEORY[topicId] || null, [topicId]);
    const progress = useMemo(() => getHRTopicProgress(topicId), [topicId, refreshKey]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLight ? '#1e293b' : '#fff' }}><h2>Topic not found</h2></div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#050507', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 0' }}>
                <button onClick={() => navigate('/hr-path')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: '#71717a', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0
                }}>
                    <ArrowLeft size={16} /> Back to Storyboard
                </button>

                <div style={{
                    background: `linear-gradient(135deg, ${topic.color}15, transparent)`,
                    border: `1px solid ${topic.color}30`, borderRadius: 16, padding: '30px', marginBottom: 30,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{topic.icon}</div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: isLight ? '#1e293b' : '#fff' }}>{topic.title}</h1>
                        <p style={{ fontSize: 14, color: isLight ? '#64748b' : '#a1a1aa', margin: 0 }}>{topic.description}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: topic.color }}>{progress.masteryPercent}%</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>Readiness Focus</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 12 }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === t.id ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)') : 'transparent',
                            color: activeTab === t.id ? (isLight ? '#1e293b' : '#fff') : '#71717a',
                            fontWeight: activeTab === t.id ? 600 : 500, fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                        }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'theory' && (
                        <div style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,25,0.8)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: 32 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16 }}>{theoryData?.title || 'The Anatomy of a Perfect Answer'}</h2>
                            <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                                {theoryData?.theory || 'Theory data formatting...'}
                            </p>

                            {theoryData?.exampleAnswers && theoryData.exampleAnswers.length > 0 && (
                                <div style={{ marginTop: 24, marginBottom: 24, paddingTop: 24, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Lightbulb size={18} color="#facc15" /> Perfect Answer Examples
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {theoryData.exampleAnswers.map((ex, i) => (
                                            <div key={i} style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: 20 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: 12 }}>Q: {ex.question}</div>
                                                <div style={{ fontSize: 14, color: isLight ? '#1e293b' : '#fff', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic', paddingLeft: 12, borderLeft: `2px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}` }}>
                                                    "{ex.answer}"
                                                </div>
                                                {ex.theory && (
                                                    <div style={{ marginBottom: 16, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#d4d4d8' }}>
                                                        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>Underlying Theory:</span>{ex.theory}
                                                    </div>
                                                )}
                                                <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#d4d4d8' }}>
                                                    <span style={{ fontWeight: 700, color: '#34d399', marginRight: 6 }}>Why this works:</span>{ex.analysis}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={() => { markHRTheoryRead(topicId); refresh(); }} disabled={progress.theoryRead} style={{
                                background: progress.theoryRead ? 'rgba(52,211,153,0.15)' : '#8b5cf6', color: progress.theoryRead ? '#34d399' : '#fff',
                                border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: progress.theoryRead ? 'default' : 'pointer'
                            }}>
                                {progress.theoryRead ? 'Theory Internalized ✓' : 'Mark as Read'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'simulator' && (
                        <SimulatorGame
                            simulator={theoryData?.simulator}
                            isLight={isLight}
                            onComplete={(score) => { saveHRSimulatorScore(topicId, score); refresh(); }}
                        />
                    )}

                    {activeTab === 'star' && (
                        <StarBuilder
                            prompt={theoryData?.starPrompt || 'Structure your personal story.'}
                            isSaved={progress.starSaved}
                            isLight={isLight}
                            onSave={() => { markHRStarSaved(topicId); refresh(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
