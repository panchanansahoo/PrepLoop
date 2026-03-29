import React, { useState, useCallback } from 'react';
import { Brain, Sparkles, Code, Database, Calculator, Map, ArrowRight, ChevronDown, Zap } from 'lucide-react';
import AITutorPanel from '../components/AITutorPanel';
import { getAvailableDSATopics, getAvailableSQLConcepts, getAvailableAptitudeCategories } from '../data/tutorEngine';
import { useCoins } from '../context/CoinContext';

const TABS = [
    { id: 'dsa', label: 'DSA Patterns', icon: <Brain size={18} />, color: '#818cf8', gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' },
    { id: 'sql', label: 'SQL Concepts', icon: <Database size={18} />, color: '#60a5fa', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' },
    { id: 'aptitude', label: 'Aptitude', icon: <Calculator size={18} />, color: '#34d399', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
    { id: 'path', label: 'Learning Path', icon: <Map size={18} />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
];

export default function AITutorHub() {
    const AI_TUTOR_COST = 5;
    const { coins, spendCoins } = useCoins();
    const [activeTab, setActiveTab] = useState('dsa');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pathDays, setPathDays] = useState(60);
    const [pathLevel, setPathLevel] = useState('intermediate');
    const [showTutor, setShowTutor] = useState(false);
    const [tutorContext, setTutorContext] = useState({});
    const [tutorMode, setTutorMode] = useState('hub');
    const [coinError, setCoinError] = useState('');

    const dsaTopics = getAvailableDSATopics();
    const sqlConcepts = getAvailableSQLConcepts();
    const aptitudeCategories = getAvailableAptitudeCategories();

    const stageGroups = {};
    dsaTopics.forEach(t => {
        if (!stageGroups[t.stage]) stageGroups[t.stage] = [];
        stageGroups[t.stage].push(t);
    });

    const stageNames = {
        fundamentals: '🧱 Stage 1: Fundamentals',
        core: '🔗 Stage 2: Core Structures',
        'trees-graphs': '🌳 Stage 3: Trees & Graphs',
        optimization: '🚀 Stage 4: Optimization',
    };

    const launchTutor = useCallback((mode, context, autoAction = null) => {
        setTutorMode(mode);
        setTutorContext(context);
        setShowTutor(true);
    }, []);

    const launchTutorWithCoins = useCallback(async (mode, context, description) => {
        setCoinError('');
        const result = await spendCoins(AI_TUTOR_COST, description || 'AI Tutor query');
        if (!result?.success) {
            setCoinError(`You need ${AI_TUTOR_COST} coins for AI Tutor. Current balance: ${coins}.`);
            return;
        }
        launchTutor(mode, context);
    }, [AI_TUTOR_COST, coins, spendCoins, launchTutor]);

    const handleDSATopicClick = (topic) => {
        setSelectedTopic(topic);
        launchTutorWithCoins('dsa-learn', { topicId: topic.id }, `AI Tutor: DSA topic ${topic.id}`);
    };

    const handleSQLConceptClick = (concept) => {
        setSelectedConcept(concept);
        launchTutorWithCoins('sql', { sqlConcept: concept.key }, `AI Tutor: SQL concept ${concept.key}`);
    };

    const handleAptitudeClick = (cat) => {
        setSelectedCategory(cat);
        launchTutorWithCoins('aptitude', { category: cat.key }, `AI Tutor: Aptitude category ${cat.key}`);
    };

    const handlePathGenerate = () => {
        launchTutorWithCoins('hub', { days: pathDays, level: pathLevel }, 'AI Tutor: Learning path generation');
    };

    return (
        <div className="tutor-hub-page">
            {/* Hero */}
            <div className="tutor-hub-hero">
                <div className="tutor-hub-hero-glow" />
                <Brain size={48} className="tutor-hub-hero-icon" />
                <h1 className="tutor-hub-title">
                    AI Tutor
                    <span className="tutor-hub-badge">✨ Beta</span>
                </h1>
                <p className="tutor-hub-subtitle">
                    Your personal guide for DSA patterns, SQL mastery, and aptitude preparation.
                    Learn step-by-step with structured content and practice.
                </p>
            </div>

            {/* Tabs */}
            <div className="tutor-hub-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tutor-hub-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.id); setShowTutor(false); }}
                        style={activeTab === tab.id ? { background: tab.gradient, color: '#fff' } : {}}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="tutor-hub-content">
                {coinError && (
                    <div style={{
                        marginBottom: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(248,113,113,0.4)',
                        color: '#fca5a5',
                        background: 'rgba(239,68,68,0.1)',
                        fontSize: 13,
                    }}>
                        {coinError}
                    </div>
                )}

                {/* DSA Tab */}
                {activeTab === 'dsa' && !showTutor && (
                    <div className="tutor-hub-grid-section">
                        <h2><Brain size={22} /> Choose a DSA Pattern to Learn</h2>
                        <p className="tutor-hub-desc">Select any topic below. The AI Tutor will teach you the pattern with intuition, templates, tricks, and practice problems.</p>
                        {Object.entries(stageGroups).map(([stage, topics]) => (
                            <div key={stage} className="tutor-hub-stage">
                                <h3>{stageNames[stage] || stage}</h3>
                                <div className="tutor-hub-card-grid">
                                    {topics.map(t => (
                                        <button
                                            key={t.id}
                                            className="tutor-hub-card"
                                            onClick={() => handleDSATopicClick(t)}
                                            style={{ '--card-color': t.color }}
                                        >
                                            <span className="tutor-hub-card-icon">{t.icon}</span>
                                            <div>
                                                <div className="tutor-hub-card-title">{t.title}</div>
                                                <div className="tutor-hub-card-meta">
                                                    <span className={`diff-badge ${t.difficulty.toLowerCase().replace('–', '-')}`}>{t.difficulty}</span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="tutor-hub-card-arrow" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SQL Tab */}
                {activeTab === 'sql' && !showTutor && (
                    <div className="tutor-hub-grid-section">
                        <h2><Database size={22} /> SQL Concept Guides</h2>
                        <p className="tutor-hub-desc">Master essential SQL concepts with syntax, examples, pitfalls, and practice prompts.</p>
                        <div className="tutor-hub-card-grid">
                            {sqlConcepts.map(c => (
                                <button
                                    key={c.key}
                                    className="tutor-hub-card"
                                    onClick={() => handleSQLConceptClick(c)}
                                    style={{ '--card-color': '#60a5fa' }}
                                >
                                    <span className="tutor-hub-card-icon">{c.icon}</span>
                                    <div>
                                        <div className="tutor-hub-card-title">{c.title}</div>
                                    </div>
                                    <ArrowRight size={16} className="tutor-hub-card-arrow" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Aptitude Tab */}
                {activeTab === 'aptitude' && !showTutor && (
                    <div className="tutor-hub-grid-section">
                        <h2><Calculator size={22} /> Aptitude & Reasoning</h2>
                        <p className="tutor-hub-desc">Formulas, shortcuts, and quick-solve methods for quantitative, reasoning, and verbal aptitude.</p>
                        <div className="tutor-hub-card-grid">
                            {aptitudeCategories.map(cat => (
                                <button
                                    key={cat.key}
                                    className="tutor-hub-card"
                                    onClick={() => handleAptitudeClick(cat)}
                                    style={{ '--card-color': cat.color }}
                                >
                                    <span className="tutor-hub-card-icon">{cat.icon === 'Calculator' ? '🔢' : cat.icon === 'Brain' ? '🧠' : '📖'}</span>
                                    <div>
                                        <div className="tutor-hub-card-title">{cat.title}</div>
                                        <div className="tutor-hub-card-desc">{cat.description}</div>
                                    </div>
                                    <ArrowRight size={16} className="tutor-hub-card-arrow" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Learning Path Tab */}
                {activeTab === 'path' && !showTutor && (
                    <div className="tutor-hub-grid-section">
                        <h2><Map size={22} /> Generate Your Study Plan</h2>
                        <p className="tutor-hub-desc">Get a personalized, week-by-week learning path tailored to your timeline and level.</p>
                        <div className="tutor-path-config">
                            <div className="tutor-path-option">
                                <label>Duration</label>
                                <div className="tutor-path-buttons">
                                    {[30, 60, 90].map(d => (
                                        <button
                                            key={d}
                                            className={`tutor-path-btn ${pathDays === d ? 'active' : ''}`}
                                            onClick={() => setPathDays(d)}
                                        >
                                            {d} Days
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="tutor-path-option">
                                <label>Level</label>
                                <div className="tutor-path-buttons">
                                    {['beginner', 'intermediate', 'advanced'].map(l => (
                                        <button
                                            key={l}
                                            className={`tutor-path-btn ${pathLevel === l ? 'active' : ''}`}
                                            onClick={() => setPathLevel(l)}
                                        >
                                            {l.charAt(0).toUpperCase() + l.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="tutor-generate-btn" onClick={handlePathGenerate}>
                                <Zap size={18} />
                                Generate {pathDays}-Day Plan ({pathLevel})
                            </button>
                        </div>
                    </div>
                )}

                {/* Tutor Panel (shown when topic/concept selected) */}
                {showTutor && (
                    <div className="tutor-hub-panel-wrapper">
                        <button className="tutor-hub-back" onClick={() => setShowTutor(false)}>
                            ← Back to {activeTab === 'dsa' ? 'Topics' : activeTab === 'sql' ? 'Concepts' : activeTab === 'aptitude' ? 'Categories' : 'Config'}
                        </button>
                        <AITutorPanel
                            mode={tutorMode}
                            contextData={tutorContext}
                            visible={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
