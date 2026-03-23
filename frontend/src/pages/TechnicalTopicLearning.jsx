import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, BookOpen, Layers, Cpu, Check, TerminalSquare, RefreshCw, Lightbulb } from 'lucide-react';
import { TECHNICAL_TOPICS } from '../data/technicalLearningPathData';
import { TECHNICAL_THEORY } from '../data/technicalTheoryData';
import {
    getTechnicalTopicProgress, markTechTheoryRead, completeTechScenario, masterTechFlashcard
} from '../data/technicalLearningProgress';

function FlashcardWidget({ flashcards, masteredCards, onMaster, isLight }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) return <div>No flashcards for this topic.</div>;

    const card = flashcards[currentIndex];
    const isMastered = masteredCards.includes(currentIndex);

    const nextCard = () => {
        setFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    };
    const prevCard = () => {
        setFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    };

    return (
        <div style={{
            background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(20,20,25,0.8)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16, padding: '30px', textAlign: 'center', position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 12, color: isLight ? '#64748b' : '#a1a1aa' }}>
                Card {currentIndex + 1} of {flashcards.length}
            </div>
            {isMastered && (
                <div style={{ position: 'absolute', top: 20, right: 20, color: '#34d399', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> Mastered
                </div>
            )}

            <div
                onClick={() => setFlipped(!flipped)}
                style={{
                    minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: flipped ? 'rgba(52,211,153,0.05)' : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'),
                    border: `2px dashed ${flipped ? 'rgba(52,211,153,0.3)' : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)')}`,
                    borderRadius: 12, cursor: 'pointer', padding: 30, marginBottom: 24,
                    transition: 'all 0.3s'
                }}>
                <h3 style={{ fontSize: 18, color: flipped ? '#059669' : (isLight ? '#1e293b' : '#fff'), fontWeight: flipped ? 500 : 700, lineHeight: 1.5 }}>
                    {flipped ? card.a : card.q}
                </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <button onClick={prevCard} style={{ background: 'transparent', border: `1px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`, color: isLight ? '#1e293b' : '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Prev</button>
                <button onClick={() => { setFlipped(!flipped); }} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Flip</button>
                {!isMastered ? (
                    <button onClick={() => onMaster(currentIndex)} style={{ background: '#10b981', border: 'none', color: '#000', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Got it!</button>
                ) : (
                    <button disabled style={{ background: 'rgba(16,185,129,0.2)', border: 'none', color: '#10b981', padding: '8px 16px', borderRadius: 8 }}>✅ Done</button>
                )}
                <button onClick={nextCard} style={{ background: 'transparent', border: `1px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`, color: isLight ? '#1e293b' : '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Next</button>
            </div>
        </div>
    );
}

function ScenarioWidget({ scenario, isCompleted, onComplete, color, isLight }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{
            background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.4)', border: `1px solid ${color}40`,
            borderRadius: 12, overflow: 'hidden', marginBottom: 16
        }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded ? `${color}10` : 'transparent' }}>
                <div>
                    <div style={{ fontSize: 11, color: color, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>{scenario.type}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: isLight ? '#1e293b' : '#fff' }}>{scenario.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isCompleted && <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Completed</span>}
                    <span style={{ fontSize: 20, color: '#a1a1aa' }}>{expanded ? '−' : '+'}</span>
                </div>
            </div>

            {expanded && (
                <div style={{ padding: '20px', borderTop: `1px solid ${color}20` }}>
                    <p style={{ fontSize: 14, color: '#d4d4d8', marginBottom: 16, fontStyle: 'italic' }}>{scenario.context}</p>

                    <h4 style={{ fontSize: 13, color: '#fff', marginBottom: 12 }}>System Breakdown:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {scenario.steps.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                <span style={{ color: color, fontWeight: 700 }}>{i + 1}.</span>
                                <span style={{ color: '#d4d4d8', fontSize: 13, lineHeight: 1.5 }}>{s}</span>
                            </div>
                        ))}
                    </div>

                    {!isCompleted && (
                        <button onClick={() => onComplete(scenario.id)} style={{
                            background: color, color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                        }}>
                            Mark Scenario Understood
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TechnicalTopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => TECHNICAL_TOPICS.find(t => t.id === topicId), [topicId]);
    const theory = useMemo(() => TECHNICAL_THEORY[topicId] || null, [topicId]);
    const progress = useMemo(() => getTechnicalTopicProgress(topicId), [topicId, refreshKey]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLight ? '#1e293b' : '#fff' }}><h2>Topic not found</h2></div>;
    }

    const { theoryRead, scenariosCompleted, flashcardsMastered, masteryPercent } = progress;

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#050505', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 0' }}>
                <button onClick={() => navigate('/technical-path')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: '#71717a', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0
                }}>
                    <ArrowLeft size={16} /> Back to Blueprint
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
                        <div style={{ fontSize: 36, fontWeight: 800, color: topic.color }}>{masteryPercent}%</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>Mastery</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

                    {/* LEFT COL: Core Theory nodes */}
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={20} color={topic.color} /> Core Architecture Concepts
                        </h2>
                        {theory?.sections ? theory.sections.map((sec, i) => (
                            <div key={i} style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,25,0.6)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, color: isLight ? '#1e293b' : '#fff', marginBottom: 12 }}>{sec.title}</h3>
                                <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sec.content}</p>
                                {sec.diagram && (
                                    <div style={{ marginTop: 16, padding: 16, background: isLight ? '#f1f5f9' : '#000', borderRadius: 8, border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                                        <pre style={{ fontSize: 12, color: isLight ? '#047857' : '#6ee7b7', margin: 0, fontFamily: 'monospace' }}>{sec.diagram}</pre>
                                    </div>
                                )}
                            </div>
                        )) : <p>Theory data not available.</p>}

                        {theory?.exampleAnswers && theory?.exampleAnswers.length > 0 && (
                            <div style={{ marginTop: 24, marginBottom: 16, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Lightbulb size={18} color="#facc15" /> Perfect Answer Examples
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {theory.exampleAnswers.map((ex, idx) => (
                                        <div key={idx} style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.4)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 20 }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>Q: {ex.question}</div>
                                            <div style={{ fontSize: 14, color: isLight ? '#1e293b' : '#fff', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic', paddingLeft: 12, borderLeft: `2px solid ${topic.color}` }}>
                                                "{ex.answer}"
                                            </div>
                                            {ex.theory && (
                                                <div style={{ marginBottom: 16, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#d4d4d8' }}>
                                                    <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>Underlying Theory:</span>{ex.theory}
                                                </div>
                                            )}
                                            <div style={{ background: `linear-gradient(90deg, ${topic.color}15, transparent)`, border: `1px solid ${topic.color}30`, padding: '12px 16px', borderRadius: 8, fontSize: 13, color: '#d4d4d8' }}>
                                                <span style={{ fontWeight: 700, color: topic.color, marginRight: 6 }}>Why this works:</span>{ex.analysis}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 20 }}>
                            <button onClick={() => { markTechTheoryRead(topicId); refresh(); }} disabled={theoryRead} style={{
                                background: theoryRead ? 'rgba(52,211,153,0.15)' : `${topic.color}20`,
                                color: theoryRead ? '#34d399' : topic.color,
                                border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: theoryRead ? 'default' : 'pointer'
                            }}>
                                {theoryRead ? 'Theory Completed ✓' : 'Mark Theory as Read'}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Flashcards */}
                    <div style={{ paddingTop: 20, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RefreshCw size={20} color="#3b82f6" /> Rapid Recall Flashcards
                        </h2>
                        <FlashcardWidget
                            flashcards={topic.flashcards}
                            masteredCards={flashcardsMastered}
                            isLight={isLight}
                            onMaster={(idx) => { masterTechFlashcard(topicId, idx); refresh(); }}
                        />
                    </div>

                    {/* Architectural Scenarios */}
                    <div style={{ paddingTop: 20, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={20} color="#f59e0b" /> Real-World Scenarios
                        </h2>
                        {theory?.scenarioBreakdown?.map((scen, idx) => (
                            <ScenarioWidget
                                key={idx}
                                scenario={scen}
                                isCompleted={scenariosCompleted.includes(scen.id)}
                                color={topic.color}
                                isLight={isLight}
                                onComplete={(scenId) => { completeTechScenario(topicId, scenId); refresh(); }}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
