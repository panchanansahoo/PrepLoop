import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Trophy,
    Zap,
    Target,
    Flame,
    BookOpen,
    GraduationCap,
    ArrowRight,
    Layers,
    Brain,
    BookMarked,
    Compass,
} from 'lucide-react';
import { LEARNING_TOPICS, getTopicIds } from '../data/learningPathData';
import { getTopicProgress, getOverallProgress, getStreakDays } from '../data/learningPathProgress';
import TopicCard from '../components/TopicCard';
import './LearningPath.css';

const ICON_MAP = { Percent: '📊', Hammer: '🔨', Timer: '⏱️', Hash: '#️⃣', Scale: '⚖️', Calculator: '🧮', Coins: '💰', Beaker: '🧪', Variable: '🔤', Shapes: '📐', Dice: '🎲', BarChart: '📈' };

const STUDY_LENSES = [
    {
        title: 'Theory first',
        description: 'Read the concept, formula, and intuition before shortcuts.',
        icon: <Brain size={16} />,
        color: '#818cf8',
    },
    {
        title: 'See the pattern',
        description: 'Move from examples to quick methods and then to shortcuts.',
        icon: <Compass size={16} />,
        color: '#34d399',
    },
    {
        title: 'Practice with intent',
        description: 'Use timed questions to turn understanding into speed.',
        icon: <Sparkles size={16} />,
        color: '#facc15',
    },
];

function truncate(text, limit = 120) {
    if (!text) return '';
    return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

function getTheoryPreview(topic) {
    const firstSection = topic.theory?.sections?.[0];
    const firstFormula = firstSection?.formulas?.[0];
    const secondFormula = firstSection?.formulas?.[1];
    const firstContent = firstSection?.content?.[0] || topic.description;
    const shortcut = topic.shortcuts?.[0];

    return {
        sectionTitle: firstSection?.title || 'Core theory',
        content: truncate(firstContent, 150),
        formulas: [firstFormula?.formula, secondFormula?.formula].filter(Boolean),
        shortcut: shortcut?.name,
    };
}

function getMasteryBadge(p) {
    if (p >= 90) return { label: 'Mastered', emoji: '✅', color: '#34d399' };
    if (p >= 50) return { label: 'In Progress', emoji: '🔥', color: '#facc15' };
    if (p > 0) return { label: 'Learning', emoji: '📚', color: '#818cf8' };
    return { label: 'Not Started', emoji: '🔒', color: '#525252' };
}

export default function LearningPath() {
    const navigate = useNavigate();
    const topicIds = useMemo(() => getTopicIds(), []);
    const overall = useMemo(() => getOverallProgress(topicIds), [topicIds]);
    const streak = useMemo(() => getStreakDays(), []);
    const topicInsights = useMemo(() => {
        return LEARNING_TOPICS
            .map(topic => {
                const progress = getTopicProgress(topic.id);
                const theorySections = topic.theory?.sections?.length || 0;
                const theoryFormulas = (topic.theory?.sections || []).reduce(
                    (count, section) => count + (section.formulas?.length || 0),
                    0
                );

                return {
                    topic,
                    progress,
                    theorySections,
                    theoryFormulas,
                    preview: getTheoryPreview(topic),
                };
            })
            .sort((a, b) => a.progress.masteryPercent - b.progress.masteryPercent || b.theoryFormulas - a.theoryFormulas)
            .slice(0, 3);
    }, []);

    const learningSignals = useMemo(() => {
        const totals = LEARNING_TOPICS.reduce(
            (acc, topic) => {
                acc.theorySections += topic.theory?.sections?.length || 0;
                acc.theoryFormulas += (topic.theory?.sections || []).reduce(
                    (count, section) => count + (section.formulas?.length || 0),
                    0
                );
                acc.shortcuts += topic.shortcuts?.length || 0;
                acc.practice += topic.practice?.length || 0;
                return acc;
            },
            { theorySections: 0, theoryFormulas: 0, shortcuts: 0, practice: 0 }
        );

        return [
            { label: 'Theory sections', value: totals.theorySections, icon: <BookMarked size={14} />, color: '#818cf8' },
            { label: 'Formula anchors', value: totals.theoryFormulas, icon: <Layers size={14} />, color: '#34d399' },
            { label: 'Shortcut patterns', value: totals.shortcuts, icon: <Sparkles size={14} />, color: '#facc15' },
            { label: 'Practice sets', value: totals.practice, icon: <Zap size={14} />, color: '#f472b6' },
        ];
    }, []);

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero lp-hero--aptitude">
                <div className="lp-hero-content">
                    <div className="lp-hero-grid">
                        <div>
                            <div className="lp-hero-badge">
                                <GraduationCap size={14} /> Structured Learning
                            </div>
                            <h1 className="lp-hero-title">
                                <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>
                                    <BookOpen size={22} />
                                </span>
                                Aptitude & Quant Path
                            </h1>
                            <p className="lp-hero-subtitle">
                                Master each topic with deep theory, worked examples, memory shortcuts, and timed practice.
                            </p>

                            <div className="lp-hero-lenses">
                                {STUDY_LENSES.map(lens => (
                                    <div key={lens.title} className="lp-hero-lens">
                                        <div className="lp-hero-lens-icon" style={{ color: lens.color, background: `${lens.color}15` }}>
                                            {lens.icon}
                                        </div>
                                        <div>
                                            <div className="lp-hero-lens-title">{lens.title}</div>
                                            <div className="lp-hero-lens-desc">{lens.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lp-hero-panel">
                            <div className="lp-hero-panel-header">
                                <div>
                                    <div className="lp-hero-panel-kicker">Learning compass</div>
                                    <div className="lp-hero-panel-title">Theory depth at a glance</div>
                                </div>
                                <div className="lp-hero-panel-icon">
                                    <Layers size={16} />
                                </div>
                            </div>

                            <div className="lp-hero-signal-grid">
                                {learningSignals.map(signal => (
                                    <div key={signal.label} className="lp-hero-signal">
                                        <div className="lp-hero-signal-icon" style={{ color: signal.color, background: `${signal.color}15` }}>
                                            {signal.icon}
                                        </div>
                                        <div className="lp-hero-signal-value">{signal.value}</div>
                                        <div className="lp-hero-signal-label">{signal.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="lp-hero-panel-note">
                                Each topic opens with intuition, then formulas, then speed techniques, so users build depth before speed.
                            </div>
                        </div>
                    </div>

                    <div className="lp-stats">
                        {[
                            { label: 'Avg Mastery', value: `${overall.avgMastery}%`, icon: <Target size={14} />, color: '#facc15' },
                            { label: 'Mastered', value: overall.topicsMastered, icon: <Trophy size={14} />, color: '#34d399' },
                            { label: 'Solved', value: overall.totalSolved, icon: <Zap size={14} />, color: '#818cf8' },
                            { label: 'Streak', value: `${streak}d`, icon: <Flame size={14} />, color: '#f472b6' },
                        ].map((s, i) => (
                            <div key={i} className="lp-stat-pill">
                                <div className="lp-stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                                <div>
                                    <div className="lp-stat-value">{s.value}</div>
                                    <div className="lp-stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Study guide */}
            <div className="lp-study-guide">
                <div className="lp-study-guide__left">
                    <div className="lp-section-header lp-section-header--compact">
                        <div className="lp-section-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h2 className="lp-section-title">How to use this path</h2>
                            <p className="lp-section-subtitle">A theory-first loop that keeps depth and speed balanced</p>
                        </div>
                    </div>

                    <div className="lp-study-guide__steps">
                        {[
                            { step: '01', title: 'Read theory', desc: 'Start with the concept, then study the formula and example.' },
                            { step: '02', title: 'Learn the shortcut', desc: 'See how the same idea becomes faster through method and trick.' },
                            { step: '03', title: 'Solve timed practice', desc: 'Use questions to build accuracy, then speed, then recall.' },
                        ].map(item => (
                            <div key={item.step} className="lp-study-step">
                                <div className="lp-study-step__number">{item.step}</div>
                                <div>
                                    <div className="lp-study-step__title">{item.title}</div>
                                    <p className="lp-study-step__desc">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/advanced-learning-path')}
                    className="lp-study-guide__cta"
                >
                    <Sparkles size={16} />
                    <span>Open AI Advanced Roadmap</span>
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* Theory depth spotlight */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                    <Brain size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Theory Depth Spotlight</h2>
                    <p className="lp-section-subtitle">A preview of the concepts, formulas, and shortcuts inside each topic</p>
                </div>
            </div>

            <div className="lp-insight-grid">
                {topicInsights.map(({ topic, progress, preview, theorySections, theoryFormulas }) => (
                    <button
                        key={topic.id}
                        type="button"
                        className="lp-insight-card"
                        onClick={() => navigate(`/learning-path/${topic.id}`)}
                    >
                        <div className="lp-insight-card__top">
                            <div>
                                <div className="lp-insight-topic" style={{ color: topic.color }}>
                                    {topic.title}
                                </div>
                                <div className="lp-insight-meta">
                                    {progress.masteryPercent}% mastery · {theorySections} theory blocks · {theoryFormulas} formulas
                                </div>
                            </div>
                            <div className="lp-insight-badge" style={{ background: `${topic.color}18`, color: topic.color }}>
                                Depth
                            </div>
                        </div>

                        <div className="lp-insight-section">{preview.sectionTitle}</div>
                        <p className="lp-insight-copy">{preview.content}</p>

                        <div className="lp-insight-formulas">
                            {preview.formulas.map((formula, index) => (
                                <span key={index} className="lp-insight-chip">
                                    {truncate(formula, 42)}
                                </span>
                            ))}
                        </div>

                        <div className="lp-insight-footer">
                            <span className="lp-insight-footer__hint">Shortcut focus: {preview.shortcut || 'Practice first'}</span>
                            <span className="lp-insight-footer__action">Open topic →</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Topic Cards */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                    <BookOpen size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Topics</h2>
                    <p className="lp-section-subtitle">{LEARNING_TOPICS.length} topics to master</p>
                </div>
            </div>

            <div className="lp-grid">
                {LEARNING_TOPICS.map(topic => {
                    const progress = getTopicProgress(topic.id);
                    const badge = getMasteryBadge(progress.masteryPercent);
                    const steps = [
                        { label: 'Theory', done: progress.theoryComplete },
                        { label: 'Methods', done: progress.methodsLearned.length >= 3 },
                        { label: 'Shortcuts', done: progress.shortcutsLearned.length >= 4 },
                        { label: 'Practice', done: progress.accuracy >= 80 && progress.problemsSolved >= 5 },
                    ];

                    return (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            progress={progress}
                            badge={badge}
                            steps={steps}
                            icon={ICON_MAP[topic.icon] || '📖'}
                            color={topic.color || '#818cf8'}
                            estimatedTime={topic.estimatedTime || '4-6 weeks'}
                            onClick={() => navigate(`/learning-path/${topic.id}`)}
                        />
                    );
                })}
            </div>

            {/* 4-Step Methodology */}
            <div className="lp-section-header" style={{ marginTop: 36 }}>
                <div className="lp-section-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#a5b4fc' }}>
                    <Target size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">4-Step Methodology</h2>
                    <p className="lp-section-subtitle">Our proven approach to mastering each topic</p>
                </div>
            </div>
            <div className="lp-methodology">
                {[
                    { step: '1', title: 'Theory & Formulas', desc: 'Build intuition with definitions, formulas, and examples.', icon: <BookOpen size={18} />, color: '#818cf8' },
                    { step: '2', title: 'Quick Methods', desc: 'Compare solution paths and learn the fastest one.', icon: <Zap size={18} />, color: '#34d399' },
                    { step: '3', title: 'Tricks & Shortcuts', desc: 'Store memory hooks and when-to-use rules.', icon: <Sparkles size={18} />, color: '#f472b6' },
                    { step: '4', title: 'Practice', desc: 'Convert understanding into speed through timed sets.', icon: <Target size={18} />, color: '#facc15' },
                ].map(m => (
                    <div key={m.step} className="lp-methodology-card">
                        <div className="lp-methodology-icon" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
                        <div className="lp-methodology-step" style={{ color: m.color }}>STEP {m.step}</div>
                        <div className="lp-methodology-title">{m.title}</div>
                        <p className="lp-methodology-desc">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
