import { History } from 'lucide-react';

export function ProblemExplorerInsightsPanels({
    showTopicMastery,
    isLight,
    topicMastery,
    setSelectedTopics,
    setShowTopicMastery,
    showRecentlyViewed,
    recentProblems,
    goToProblem,
    diffColor,
}) {
    return (
        <>
            {showTopicMastery && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 16,
                        borderRadius: 14,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(103,232,249,0.12)',
                    }}
                >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#67e8f9', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Topic Mastery
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {topicMastery.map((masteryItem) => (
                            <button
                                key={masteryItem.topic}
                                onClick={() => {
                                    setSelectedTopics([masteryItem.topic]);
                                    setShowTopicMastery(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.6)' }}>{masteryItem.topic}</span>
                                    <span style={{ fontSize: 10, color: masteryItem.percent === 100 ? '#6ee7b7' : isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                                        {masteryItem.solved}/{masteryItem.total}
                                    </span>
                                </div>
                                <div style={{ width: '100%', height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            width: `${masteryItem.percent}%`,
                                            height: '100%',
                                            borderRadius: 2,
                                            background: masteryItem.percent === 100 ? '#6ee7b7' : masteryItem.percent > 50 ? '#fbbf24' : '#a78bfa',
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showRecentlyViewed && recentProblems.length > 0 && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 16,
                        borderRadius: 14,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(139,92,246,0.12)',
                    }}
                >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <History size={13} /> Recently Viewed
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {recentProblems.map((problem) => (
                            <button
                                key={problem.id}
                                onClick={() => goToProblem(problem.id)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)')}
                            >
                                <span style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)' }}>#{problem.id}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isLight ? '#1e293b' : '#fff' }}>{problem.title}</span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: diffColor(problem.difficulty),
                                        padding: '1px 5px',
                                        borderRadius: 3,
                                        background: `${diffColor(problem.difficulty)}15`,
                                    }}
                                >
                                    {problem.difficulty}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
