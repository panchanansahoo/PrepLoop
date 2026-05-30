import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, Play, Check, AlertTriangle, Lightbulb, Clock } from 'lucide-react';
import { HR_TOPICS } from '../data/hrLearningPathData';
import { HR_THEORY } from '../data/hrTheoryData';
import {
    getHRTopicProgress, markHRTheoryRead, markHRStarSaved, saveHRSimulatorScore
} from '../data/hrLearningProgress';
import './LearningPath.css';

const TABS = [
    { id: 'theory', label: 'Theory & Breakdown', icon: <BookOpen size={15} />, color: '#818cf8' },
    { id: 'simulator', label: 'Situation Simulator', icon: <Play size={15} />, color: '#34d399' },
    { id: 'star', label: 'STAR Builder', icon: <Target size={15} />, color: '#f472b6' }
];

function SimulatorGame({ simulator, onComplete }) {
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    if (!simulator) return <div style={{ color: '#a1a1aa', padding: 20 }}>No simulator available for this topic.</div>;

    const handleSubmit = () => {
        setSubmitted(true);
        if (selectedIdx !== null) {
            const isGood = simulator.options[selectedIdx].isGood;
            onComplete(isGood ? 100 : 50);
        }
    };

    return (
        <div className="lp-topic-glass-card">
            <div className="lp-topic-sim-question">
                <span style={{ fontSize: 24 }}>💬</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>"{simulator.question}"</span>
            </div>

            <h3 style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 16 }}>Choose your response strategy:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {simulator.options.map((opt, idx) => (
                    <div
                        key={idx}
                        onClick={() => !submitted && setSelectedIdx(idx)}
                        className={`lp-topic-sim-option ${selectedIdx === idx ? 'lp-topic-sim-option--selected' : ''} ${submitted && selectedIdx !== idx ? 'lp-topic-sim-option--disabled' : ''}`}
                        style={{
                            cursor: submitted ? 'default' : 'pointer',
                            opacity: submitted && selectedIdx !== idx ? 0.5 : 1
                        }}>
                        <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>"{opt.text}"</div>
                        {submitted && selectedIdx === idx && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                {opt.isGood ? <Check color="#34d399" size={16} /> : <AlertTriangle color="#f59e0b" size={16} />}
                                <span style={{ fontSize: 13, color: opt.isGood ? '#34d399' : '#f59e0b' }}>{opt.feedback}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!submitted ? (
                <button onClick={handleSubmit} disabled={selectedIdx === null}
                    className="lp-topic-btn lp-topic-btn--full"
                    style={{
                        background: selectedIdx !== null ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        color: selectedIdx !== null ? '#fff' : '#71717a',
                        cursor: selectedIdx !== null ? 'pointer' : 'default'
                    }}>Submit Response</button>
            ) : (
                <button onClick={() => { setSubmitted(false); setSelectedIdx(null); }}
                    className="lp-topic-btn lp-topic-btn--ghost lp-topic-btn--full">Try Again</button>
            )}
        </div>
    );
}

function StarBuilder({ prompt, isSaved, onSave }) {
    const [s, setS] = useState('');
    const [t, setT] = useState('');
    const [a, setA] = useState('');
    const [r, setR] = useState('');

    const sections = [
        { key: 's', label: 'S - Situation', color: '#818cf8', placeholder: "Set the scene (e.g., 'At my last job, we were launching a major feature...')", value: s, onChange: e => setS(e.target.value), minH: 60 },
        { key: 't', label: 'T - Task', color: '#f472b6', placeholder: 'What was your specific responsibility?', value: t, onChange: e => setT(e.target.value), minH: 60 },
        { key: 'a', label: 'A - Action', color: '#34d399', placeholder: "What did YOU do to solve it? (Use 'I', not 'We')", value: a, onChange: e => setA(e.target.value), minH: 80 },
        { key: 'r', label: 'R - Result', color: '#facc15', placeholder: 'What was the outcome? Use metrics if possible.', value: r, onChange: e => setR(e.target.value), minH: 60 },
    ];

    return (
        <div className="lp-topic-glass-card">
            <div style={{ fontSize: 14, color: '#d4d4d8', marginBottom: 24, fontStyle: 'italic' }}>{prompt}</div>
            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                {sections.map(sec => (
                    <div key={sec.key} className="lp-topic-star-section">
                        <div className="lp-topic-star-label" style={{ color: sec.color }}>{sec.label}</div>
                        <textarea placeholder={sec.placeholder} value={sec.value} onChange={sec.onChange}
                            className="lp-topic-star-textarea" style={{ minHeight: sec.minH }} />
                    </div>
                ))}
            </div>
            <button onClick={onSave}
                className={`lp-topic-complete-btn lp-topic-btn--full ${isSaved ? 'lp-topic-complete-btn--done' : ''}`}
                style={!isSaved ? { background: '#f472b6', color: '#fff', cursor: 'pointer', width: '100%', justifyContent: 'center' } : { width: '100%', justifyContent: 'center' }}>
                {isSaved ? <><Check size={18} /> Story Saved to Repository</> : 'Save STAR Story to Vault'}
            </button>
        </div>
    );
}

export default function HRTopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('theory');
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => HR_TOPICS.find(t => t.id === topicId), [topicId]);
    const theoryData = useMemo(() => HR_THEORY[topicId] || null, [topicId]);
    const progress = useMemo(() => getHRTopicProgress(topicId), [topicId, refreshKey]);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return (
            <div className="lp-topic-not-found">
                <h2 style={{ fontSize: 24, marginBottom: 16 }}>Topic not found</h2>
                <button onClick={() => navigate('/hr-path')} className="lp-topic-btn lp-topic-btn--primary">
                    Back to HR Path
                </button>
            </div>
        );
    }

    const mastery = progress.masteryPercent;
    const steps = [
        { label: 'Theory', done: progress.theoryRead, tab: 'theory' },
        { label: 'Simulator', done: progress.simulatorDone || (progress.simulatorScore > 0), tab: 'simulator' },
        { label: 'STAR', done: progress.starSaved, tab: 'star' },
    ];

    return (
        <div className="lp-topic-page">
            <div className="lp-topic-container">
                <button onClick={() => navigate('/hr-path')} className="lp-topic-back">
                    <ArrowLeft size={16} /> Back to Storyboard
                </button>

                <div className="lp-topic-hero lp-topic-hero--hr">
                    <div>
                        <div className="lp-topic-hero-icon">{topic.icon}</div>
                        <h1 className="lp-topic-hero-title">{topic.title}</h1>
                        <p className="lp-topic-hero-desc">{topic.description}</p>
                        <div className="lp-topic-badges">
                            <span className="lp-topic-badge" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>HR Interview</span>
                            <span className="lp-topic-badge lp-topic-badge--muted">
                                <Clock size={11} /> 15-20 mins
                            </span>
                        </div>
                    </div>

                    <div className="lp-topic-mastery">
                        <div className="lp-topic-mastery-value" style={{ color: topic.color }}>{mastery}%</div>
                        <div className="lp-topic-mastery-label">Readiness</div>
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
                        <div className="lp-topic-glass-card">
                            <h2 className="lp-topic-heading--lg">{theoryData?.title || 'The Anatomy of a Perfect Answer'}</h2>
                            <p style={{ fontSize: 15, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                                {theoryData?.theory || 'Theory data formatting...'}
                            </p>

                            {theoryData?.exampleAnswers && theoryData.exampleAnswers.length > 0 && (
                                <div style={{ marginTop: 24, marginBottom: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <h3 className="lp-topic-heading">
                                        <Lightbulb size={18} color="#facc15" /> Perfect Answer Examples
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {theoryData.exampleAnswers.map((ex, i) => (
                                            <div key={i} className="lp-topic-example">
                                                <div className="lp-topic-example-question">Q: {ex.question}</div>
                                                <div className="lp-topic-example-answer">"{ex.answer}"</div>
                                                {ex.theory && (
                                                    <div className="lp-topic-example-info lp-topic-example-info--theory">
                                                        <span style={{ fontWeight: 700, color: '#60a5fa', marginRight: 6 }}>Underlying Theory:</span>{ex.theory}
                                                    </div>
                                                )}
                                                <div className="lp-topic-example-info lp-topic-example-info--analysis">
                                                    <span style={{ fontWeight: 700, color: '#34d399', marginRight: 6 }}>Why this works:</span>{ex.analysis}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="lp-topic-complete-wrap">
                                <button onClick={() => { markHRTheoryRead(topicId); refresh(); }} disabled={progress.theoryRead}
                                    className={`lp-topic-complete-btn ${progress.theoryRead ? 'lp-topic-complete-btn--done' : ''}`}
                                    style={!progress.theoryRead ? { background: '#8b5cf6', color: '#fff', cursor: 'pointer' } : {}}>
                                    {progress.theoryRead ? <><Check size={16} /> Theory Internalized</> : 'Mark as Read'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'simulator' && (
                        <SimulatorGame
                            simulator={theoryData?.simulator}
                            onComplete={(score) => { saveHRSimulatorScore(topicId, score); refresh(); }}
                        />
                    )}

                    {activeTab === 'star' && (
                        <StarBuilder
                            prompt={theoryData?.starPrompt || 'Structure your personal story.'}
                            isSaved={progress.starSaved}
                            onSave={() => { markHRStarSaved(topicId); refresh(); }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
