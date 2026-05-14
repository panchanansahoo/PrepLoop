import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

function SortHeader({ label, sortKey, sortBy, sortDir, onSort, isLight }) {
    const active = sortBy === sortKey;
    return (
        <button onClick={() => onSort(sortKey)} style={{
            display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: active ? '#c084fc' : (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'), fontWeight: 700,
            padding: 0, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
            {label}
            {active && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
        </button>
    );
}

export function ProblemExplorerAllQuestionsView({
    viewMode,
    isLight,
    filteredProblems,
    solvedSet,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    onSolveProblem,
    getExplanationSnippet,
}) {
    if (viewMode !== 'all') {
        return null;
    }

    const onSort = (key) => {
        setSortBy(key);
        setSortDir((currentDirection) => {
            if (sortBy === key) {
                return currentDirection === 'asc' ? 'desc' : 'asc';
            }
            return 'asc';
        });
    };

    return (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{
                display: 'grid', gridTemplateColumns: '50px 1fr 140px 100px 80px 70px',
                gap: 8, padding: '10px 20px',
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
            }}>
                <SortHeader label="#" sortKey="id" sortBy={sortBy} sortDir={sortDir} isLight={isLight} onSort={onSort} />
                <SortHeader label="Problem" sortKey="title" sortBy={sortBy} sortDir={sortDir} isLight={isLight} onSort={onSort} />
                <span style={{ fontSize: 10, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Company</span>
                <SortHeader label="Difficulty" sortKey="difficulty" sortBy={sortBy} sortDir={sortDir} isLight={isLight} onSort={onSort} />
                <SortHeader label="Acceptance" sortKey="acceptance" sortBy={sortBy} sortDir={sortDir} isLight={isLight} onSort={onSort} />
                <span style={{ fontSize: 10, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Code</span>
            </div>

            {filteredProblems.map((problem, idx) => {
                const isSolved = solvedSet.has(problem.id);
                const dc = problem.difficulty === 'Easy' ? '#6ee7b7' : problem.difficulty === 'Medium' ? '#fbbf24' : '#f87171';
                const dbg = problem.difficulty === 'Easy' ? 'rgba(110,231,183,0.12)' : problem.difficulty === 'Medium' ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';

                return (
                    <div key={problem.id} style={{
                        display: 'grid', gridTemplateColumns: '50px 1fr 140px 100px 80px 70px',
                        gap: 8, padding: '10px 20px', alignItems: 'center',
                        borderBottom: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.03)',
                        background: isSolved ? 'rgba(110,231,183,0.025)' : idx % 2 === 0 ? (isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.008)') : 'transparent',
                        transition: 'background 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = isSolved ? 'rgba(110,231,183,0.025)' : idx % 2 === 0 ? (isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.008)') : 'transparent'}
                    >
                        <span style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{idx + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            {isSolved && <CheckCircle2 size={13} color="#6ee7b7" style={{ flexShrink: 0 }} />}
                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{
                                    fontSize: 13, fontWeight: 500, color: isSolved ? (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)') : (isLight ? '#1e293b' : '#fff'),
                                    textDecoration: isSolved ? 'line-through' : 'none',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{problem.title}</span>
                                <span style={{
                                    fontSize: 10,
                                    color: isLight ? 'rgba(30,41,59,0.55)' : 'rgba(255,255,255,0.45)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{getExplanationSnippet(problem)}</span>
                            </div>
                            {(problem.topics || []).slice(0, 2).map(t => (
                                <span key={t} style={{
                                    fontSize: 9, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
                                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 3,
                                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                                }}>{t}</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', overflow: 'hidden' }}>
                            {(problem.companies || []).slice(0, 2).map(c => (
                                <span key={c} style={{
                                    fontSize: 9, fontWeight: 600, color: 'rgba(59,130,246,0.7)',
                                    background: 'rgba(59,130,246,0.08)', padding: '1px 6px', borderRadius: 3,
                                    border: '1px solid rgba(59,130,246,0.12)', flexShrink: 0, whiteSpace: 'nowrap',
                                }}>{c}</span>
                            ))}
                            {(problem.companies || []).length > 2 && (
                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)' }}>+{problem.companies.length - 2}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: dc, background: dbg,
                                padding: '2px 10px', borderRadius: 5, border: `1px solid ${dc}25`,
                            }}>{problem.difficulty}</span>
                        </div>
                        <span style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                            {problem.acceptance || '—'}
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button onClick={() => onSolveProblem(problem.id)} style={{
                                padding: '4px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))',
                                border: 'none', color: '#fff', cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.2)'; }}
                            >Solve</button>
                        </div>
                    </div>
                );
            })}

            {filteredProblems.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}>No problems match your filters.</div>
            )}
        </div>
    );
}
