import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, Lightbulb, Target, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { SD_TOPICS } from '../data/systemDesignData';
import { SD_THEORY } from '../data/systemDesignTheoryData';
import { getSDTopicProgress, setSDTopicProgress } from '../data/systemDesignProgress';

const tabs = [
    { id: 'theory', label: 'Theory', icon: BookOpen, color: '#60a5fa' },
    { id: 'concepts', label: 'Concepts', icon: Brain, color: '#818cf8' },
    { id: 'thinking', label: 'Thinking', icon: Lightbulb, color: '#f59e0b' },
    { id: 'tricks', label: 'Tricks & Pitfalls', icon: Target, color: '#ef4444' },
];

function TheorySection({ topic, isLight }) {
    const theory = SD_THEORY[topic.id];
    if (!theory) return <div style={{ color: 'var(--zinc-500)', padding: '32px', textAlign: 'center' }}>Theory content coming soon for this topic.</div>;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {theory.sections.map((section, i) => (
                <div key={i} style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '24px' }}>
                    <h3 style={{ color: isLight ? '#1e293b' : '#fff', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>{section.title}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: section.visual ? '20px' : 0 }}>
                        {section.steps.map((step, j) => (
                            <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '14px', minWidth: '22px' }}>{j + 1}.</span>
                                <span style={{ color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.6' }}>{step}</span>
                            </div>
                        ))}
                    </div>
                    {section.visual && (
                        <div style={{ background: isLight ? '#f1f5f9' : '#0a0a0a', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', padding: '20px', overflow: 'auto' }}>
                            <pre style={{ color: isLight ? '#334155' : '#d4d4d8', fontFamily: '"Fira Code", "JetBrains Mono", monospace', fontSize: '12px', lineHeight: '1.5', margin: 0, whiteSpace: 'pre' }}>{section.visual}</pre>
                        </div>
                    )}
                    {section.code && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ background: isLight ? '#f8fafc' : '#111', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 600 }}>{section.code.title}</span>
                                    <span style={{ color: 'var(--zinc-600)', fontSize: '11px' }}>{section.code.language}</span>
                                </div>
                                <pre style={{ padding: '16px', color: isLight ? '#334155' : '#d4d4d8', fontFamily: '"Fira Code", "JetBrains Mono", monospace', fontSize: '12px', lineHeight: '1.6', margin: 0, overflow: 'auto' }}>{section.code.code}</pre>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ConceptsTab({ topic, isLight }) {
    const [openIdx, setOpenIdx] = useState(0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topic.concepts.map((concept, i) => (
                <div key={i} style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', overflow: 'hidden' }}>
                    <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)} style={{
                        width: '100%', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'transparent', border: 'none'
                    }}>
                        <span style={{ color: topic.color, fontWeight: 700, fontSize: '16px' }}>{concept.title}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--zinc-500)' }}>{openIdx === i ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                    </button>
                    {openIdx === i && (
                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {concept.points.map((point, j) => (
                                <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: topic.color, fontSize: '8px', marginTop: '7px' }}>●</span>
                                    <span style={{ color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.6' }}>{point}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {topic.invariants && topic.invariants.length > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '14px', padding: '20px', marginTop: '8px' }}>
                    <h4 style={{ color: '#fbbf24', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>🔑 Key Invariants</h4>
                    {topic.invariants.map((inv, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ color: '#fbbf24', fontSize: '8px', marginTop: '7px' }}>◆</span>
                            <span style={{ color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.5' }}>{inv}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ThinkingTab({ topic, isLight }) {
    return (
        <div>
            <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ padding: '14px 20px', fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>WHEN YOU SEE…</div>
                    <div style={{ padding: '14px 20px', fontWeight: 700, color: '#10b981', fontSize: '13px' }}>THINK…</div>
                </div>
                {topic.thinkingFramework.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < topic.thinkingFramework.length - 1 ? `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` : 'none' }}>
                        <div style={{ padding: '14px 20px', color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.5', borderRight: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>{item.condition}</div>
                        <div style={{ padding: '14px 20px', color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.5' }}>{item.action}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TricksTab({ topic, isLight }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topic.tricks && topic.tricks.length > 0 && (
                <>
                    <h3 style={{ color: '#10b981', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>💡 Pro Tips</h3>
                    {topic.tricks.map((trick, i) => (
                        <div key={i} style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ color: '#10b981', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>{trick.name}</div>
                            <p style={{ color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px 0' }}>{trick.tip}</p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                                <span style={{ color: '#34d399' }}>✓ Use when: {trick.when}</span>
                                {trick.avoid && trick.avoid !== 'N/A' && <span style={{ color: '#f87171' }}>✗ Avoid: {trick.avoid}</span>}
                            </div>
                        </div>
                    ))}
                </>
            )}
            {topic.pitfalls && topic.pitfalls.length > 0 && (
                <>
                    <h3 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>⚠️ Common Pitfalls</h3>
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '20px' }}>
                        {topic.pitfalls.map((pitfall, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < topic.pitfalls.length - 1 ? '12px' : 0 }}>
                                <span style={{ color: '#ef4444', fontSize: '14px' }}>✗</span>
                                <span style={{ color: 'var(--zinc-300)', fontSize: '14px', lineHeight: '1.5' }}>{pitfall}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {topic.keyDesigns && topic.keyDesigns.length > 0 && (
                <>
                    <h3 style={{ color: '#818cf8', fontSize: '16px', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>🎯 Practice Designs</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                        {topic.keyDesigns.map((design, i) => (
                            <div key={i} style={{
                                background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
                                borderRadius: '12px', padding: '16px'
                            }}>
                                <div style={{ color: isLight ? '#1e293b' : '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{design.title}</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: design.difficulty === 'Easy' ? 'rgba(52,211,153,0.15)' : design.difficulty === 'Medium' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)', color: design.difficulty === 'Easy' ? '#34d399' : design.difficulty === 'Medium' ? '#fbbf24' : '#f87171' }}>{design.difficulty}</span>
                                    <span style={{ color: 'var(--zinc-500)', fontSize: '12px' }}>{design.focus}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function SystemDesignTopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [activeTab, setActiveTab] = useState('theory');
    const topic = useMemo(() => SD_TOPICS.find(t => t.id === topicId), [topicId]);
    const progress = useMemo(() => getSDTopicProgress(topicId), [topicId]);

    if (!topic) return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
            <h2 style={{ color: isLight ? '#1e293b' : '#fff' }}>Topic not found</h2>
            <button onClick={() => navigate('/system-design')} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginTop: '16px' }}>← Back to System Design Path</button>
        </div>
    );

    const markDone = (field) => {
        setSDTopicProgress(topicId, field, true);
        window.location.reload();
    };

    const doneField = { theory: 'theoryDone', concepts: 'conceptsDone', thinking: 'thinkingDone', tricks: 'tricksDone' }[activeTab];
    const isDone = progress[doneField];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 80px' }}>
            {/* Back + Header */}
            <button onClick={() => navigate('/system-design')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--zinc-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: 0 }}>
                <ArrowLeft size={18} /> Back to System Design
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>{topic.icon}</span>
                <h1 style={{ color: isLight ? '#1e293b' : '#fff', fontSize: '26px', fontWeight: 700, margin: 0 }}>{topic.title}</h1>
            </div>
            <p style={{ color: 'var(--zinc-400)', fontSize: '14px', marginBottom: '28px' }}>{topic.description}</p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                            background: active ? `${tab.color}18` : 'transparent',
                            border: `1px solid ${active ? `${tab.color}44` : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)')}`,  
                            color: active ? tab.color : 'var(--zinc-400)', fontSize: '13px', fontWeight: active ? 600 : 400,
                            whiteSpace: 'nowrap', transition: 'all 0.2s'
                        }}>
                            <Icon size={15} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'theory' && <TheorySection topic={topic} isLight={isLight} />}
            {activeTab === 'concepts' && <ConceptsTab topic={topic} isLight={isLight} />}
            {activeTab === 'thinking' && <ThinkingTab topic={topic} isLight={isLight} />}
            {activeTab === 'tricks' && <TricksTab topic={topic} isLight={isLight} />}

            {/* Mark Complete */}
            {doneField && (
                <div style={{ marginTop: '28px', textAlign: 'center' }}>
                    {isDone ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontWeight: 600, fontSize: '14px' }}>
                            <CheckCircle size={18} /> Section completed!
                        </div>
                    ) : (
                        <button onClick={() => markDone(doneField)} style={{
                            padding: '12px 28px', borderRadius: '10px', background: `${topic.color}22`, border: `1px solid ${topic.color}55`,
                            color: topic.color, cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
                        }}>
                            ✓ Mark as Complete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
