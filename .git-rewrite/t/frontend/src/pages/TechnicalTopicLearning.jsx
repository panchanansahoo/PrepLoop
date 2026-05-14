import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Check, RefreshCw, Lightbulb, Clock } from 'lucide-react';
import { TECHNICAL_TOPICS } from '../data/technicalLearningPathData';
import { TECHNICAL_THEORY } from '../data/technicalTheoryData';
import {
    getTechnicalTopicProgress, markTechTheoryRead, completeTechScenario, masterTechFlashcard
} from '../data/technicalLearningProgress';
import './LearningPath.css';

const TABS = [
    { id: 'theory', label: 'Core Theory', icon: <BookOpen size={15} />, color: '#818cf8' },
    { id: 'flashcards', label: 'Flashcards', icon: <RefreshCw size={15} />, color: '#3b82f6' },
    { id: 'scenarios', label: 'Scenarios', icon: <Layers size={15} />, color: '#f59e0b' },
];

/* ─── Flashcard Widget ─── */
function FlashcardWidget({ flashcards, masteredCards, onMaster }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) return <div style={{ color: '#71717a', padding: 40, textAlign: 'center' }}>No flashcards for this topic.</div>;

    const card = flashcards[currentIndex];
    const isMastered = masteredCards.includes(currentIndex);

    const nextCard = () => { setFlipped(false); setCurrentIndex((prev) => (prev + 1) % flashcards.length); };
    const prevCard = () => { setFlipped(false); setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length); };

    return (
        <div className="lp-topic-flashcard">
            <div className="lp-topic-flashcard-counter">Card {currentIndex + 1} of {flashcards.length}</div>
            {isMastered && (
                <div className="lp-topic-flashcard-mastered"><Check size={14} /> Mastered</div>
            )}

            <div onClick={() => setFlipped(!flipped)}
                className={`lp-topic-flashcard-area ${flipped ? 'lp-topic-flashcard-area--flipped' : ''}`}>
                <h3 style={{ fontSize: 18, color: flipped ? '#059669' : '#fff', fontWeight: flipped ? 500 : 700, lineHeight: 1.5, margin: 0 }}>
                    {flipped ? card.a : card.q}
                </h3>
            </div>

            <div className="lp-topic-flashcard-controls">
                <button onClick={prevCard} className="lp-topic-btn lp-topic-btn--ghost">Prev</button>
                <button onClick={() => setFlipped(!flipped)}
                    className="lp-topic-btn" style={{ background: '#3b82f6', color: '#fff' }}>Flip</button>
                {!isMastered ? (
                    <button onClick={() => onMaster(currentIndex)}
                        className="lp-topic-btn lp-topic-btn--success">Got it!</button>
                ) : (
                    <button disabled className="lp-topic-btn" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', cursor: 'default' }}>✅ Done</button>
                )}
                <button onClick={nextCard} className="lp-topic-btn lp-topic-btn--ghost">Next</button>
            </div>
        </div>
    );
}

/* ─── Scenario Widget ─── */
function ScenarioWidget({ scenario, isCompleted, onComplete, color }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="lp-topic-scenario" style={{ borderColor: `${color}40` }}>
            <div className="lp-topic-scenario-header"
                onClick={() => setExpanded(!expanded)}
                style={{ background: expanded ? `${color}10` : 'transparent' }}>
                <div>
                    <div className="lp-topic-scenario-type" style={{ color }}>{scenario.type}</div>
                    <div className="lp-topic-scenario-title">{scenario.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isCompleted && <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Completed</span>}
                    <span style={{ fontSize: 20, color: '#a1a1aa' }}>{expanded ? '−' : '+'}</span>
                </div>
            </div>

            {expanded && (
                <div className="lp-topic-scenario-body">
                    <p style={{ fontSize: 14, color: '#d4d4d8', marginBottom: 16, fontStyle: 'italic' }}>{scenario.context}</p>

                    <h4 style={{ fontSize: 13, color: '#fff', marginBottom: 12 }}>System Breakdown:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {scenario.steps.map((s, i) => (
                            <div key={i} className="lp-topic-step-item">
                                <span className="lp-topic-step-num" style={{ background: `${color}15`, color }}>{i + 1}</span>
                                <span className="lp-topic-step-text">{s}</span>
                            </div>
                        ))}
                    </div>

                    {!isCompleted && (
                        <button onClick={() => onComplete(scenario.id)}
                            className="lp-topic-btn" style={{ background: color, color: '#000' }}>
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
    const [activeTab, setActiveTab] = useState('theory');
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => TECHNICAL_TOPICS.find(t => t.id === topicId), [topicId]);
    const theory = useMemo(() => TECHNICAL_THEORY[topicId] || null, [topicId]);
    const progress = useMemo(() => getTechnicalTopicProgress(topicId), [topicId, refreshKey]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return (
            <div className="lp-topic-not-found">
                <h2 style={{ fontSize: 24, marginBottom: 16 }}>Topic not found</h2>
                <button onClick={() => navigate('/technical-path')} className="lp-topic-btn lp-topic-btn--primary">
                    Back to Technical Path
                </button>
            </div>
        );
    }

    const { theoryRead, scenariosCompleted, flashcardsMastered, masteryPercent } = progress;

    const steps = [
        { label: 'Theory', done: theoryRead, tab: 'theory' },
        { label: 'Cards', done: flashcardsMastered.length >= (topic.flashcards?.length || 1), tab: 'flashcards' },
        { label: 'Scenarios', done: scenariosCompleted.length >= (theory?.scenarioBreakdown?.length || 1), tab: 'scenarios' },
    ];

    return (
        <div className="lp-topic-page">
            <div className="lp-topic-container">
                <button onClick={() => navigate('/technical-path')} className="lp-topic-back">
                    <ArrowLeft size={16} /> Back to Blueprint
                </button>

                <div className="lp-topic-hero lp-topic-hero--tech">
                    <div>
                        <div className="lp-topic-hero-icon">{topic.icon}</div>
                        <h1 className="lp-topic-hero-title">{topic.title}</h1>
                        <p className="lp-topic-hero-desc">{topic.description}</p>
                        <div className="lp-topic-badges">
                            <span className="lp-topic-badge" style={{ background: `${topic.color}15`, color: topic.color }}>Technical</span>
                            <span className="lp-topic-badge lp-topic-badge--muted">
                                <Clock size={11} /> 20-30 mins
                            </span>
                        </div>
                    </div>

                    <div className="lp-topic-mastery">
                        <div className="lp-topic-mastery-value" style={{ color: topic.color }}>{masteryPercent}%</div>
                        <div className="lp-topic-mastery-label">Mastery</div>
                        <div className="lp-topic-steps">
                            {steps.map((s, i) => (
                                <div key={i} onClick={() => setActiveTab(s.tab)}
                                    className={`lp-topic-step ${s.done ? 'lp-topic-step--done' : ''}`}
                                    style={s.done ? { background: `${topic.color}12`, borderColor: `${topic.color}25` } : {}}>
                                    <div className="lp-topic-step-icon">{s.done ? '✅' : '○'}</div>
                                    <div className="lp-topic-step-label" style={s.done ? { color: topic.color } : {}}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lp-topic-tabs">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`lp-topic-tab ${activeTab === tab.id ? 'lp-topic-tab--active' : ''}`}
                            style={activeTab === tab.id ? { background: `${tab.color}15`, color: tab.color } : {}}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'theory' && (
                        <div>
                            {theory?.sections ? theory.sections.map((sec, i) => (
                                <div key={i} className="lp-topic-section">
                                    <div className="lp-topic-section-header" style={{ background: `linear-gradient(135deg, ${topic.color}08, transparent)` }}>
                                        <h3 className="lp-topic-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span className="lp-topic-section-number" style={{ background: `${topic.color}18`, color: topic.color }}>{i + 1}</span>
                                            {sec.title}
                                        </h3>
                                    </div>
                                    <div className="lp-topic-section-body">
                                        <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{sec.content}</p>
                                        {sec.diagram && (
                                            <div style={{ marginTop: 16 }}>
                                                <div className="lp-topic-visual-label">
                                                    <span style={{ fontSize: 14 }}>🖼️</span>
                                                    <span>Architecture Diagram</span>
                                                </div>
                                                <div className="lp-topic-visual">
                                                    <pre>{sec.diagram}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : <p style={{ color: '#71717a', textAlign: 'center', padding: 40 }}>Theory data not available.</p>}

                            {theory?.exampleAnswers && theory.exampleAnswers.length > 0 && (
                                <div style={{ marginTop: 24, marginBottom: 16 }}>
                                    <h3 className="lp-topic-heading">
                                        <Lightbulb size={18} color="#facc15" /> Perfect Answer Examples
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {theory.exampleAnswers.map((ex, idx) => (
                                            <div key={idx} className="lp-topic-example">
                                                <div className="lp-topic-example-question">Q: {ex.question}</div>
                                                <div className="lp-topic-example-answer" style={{ borderLeftColor: topic.color }}>
                                                    "{ex.answer}"
                                                </div>
                                                {ex.theory && (
                                                    <div className="lp-topic-example-info lp-topic-example-info--theory">
                                                        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>Underlying Theory:</span>{ex.theory}
                                                    </div>
                                                )}
                                                <div className="lp-topic-example-info lp-topic-example-info--analysis" style={{ background: `linear-gradient(90deg, ${topic.color}15, transparent)`, borderColor: `${topic.color}30` }}>
                                                    <span style={{ fontWeight: 700, color: topic.color, marginRight: 6 }}>Why this works:</span>{ex.analysis}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="lp-topic-complete-wrap">
                                <button onClick={() => { markTechTheoryRead(topicId); refresh(); }} disabled={theoryRead}
                                    className={`lp-topic-complete-btn ${theoryRead ? 'lp-topic-complete-btn--done' : ''}`}
                                    style={!theoryRead ? { background: `${topic.color}20`, color: topic.color, cursor: 'pointer' } : {}}>
                                    {theoryRead ? <><Check size={16} /> Theory Completed</> : 'Mark Theory as Read'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'flashcards' && (
                        <div>
                            <div className="lp-topic-progress" style={{ marginBottom: 20 }}>
                                <span className="lp-topic-progress-label">
                                    {flashcardsMastered.length} / {topic.flashcards?.length || 0} mastered
                                </span>
                                <div className="lp-topic-progress-track">
                                    <div className="lp-topic-progress-fill" style={{
                                        background: '#3b82f6',
                                        width: `${topic.flashcards?.length > 0 ? (flashcardsMastered.length / topic.flashcards.length) * 100 : 0}%`
                                    }} />
                                </div>
                            </div>
                            <FlashcardWidget
                                flashcards={topic.flashcards}
                                masteredCards={flashcardsMastered}
                                onMaster={(idx) => { masterTechFlashcard(topicId, idx); refresh(); }}
                            />
                        </div>
                    )}

                    {activeTab === 'scenarios' && (
                        <div>
                            <div className="lp-topic-progress" style={{ marginBottom: 20 }}>
                                <span className="lp-topic-progress-label">
                                    {scenariosCompleted.length} / {theory?.scenarioBreakdown?.length || 0} completed
                                </span>
                                <div className="lp-topic-progress-track">
                                    <div className="lp-topic-progress-fill" style={{
                                        background: '#f59e0b',
                                        width: `${theory?.scenarioBreakdown?.length > 0 ? (scenariosCompleted.length / theory.scenarioBreakdown.length) * 100 : 0}%`
                                    }} />
                                </div>
                            </div>
                            {theory?.scenarioBreakdown?.map((scen, idx) => (
                                <ScenarioWidget
                                    key={idx}
                                    scenario={scen}
                                    isCompleted={scenariosCompleted.includes(scen.id)}
                                    color={topic.color}
                                    onComplete={(scenId) => { completeTechScenario(topicId, scenId); refresh(); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
