import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, FileText, Code2, CheckCircle2 } from 'lucide-react';

const DIFF_COLORS = {
    Easy: { text: '#6ee7b7', bg: 'rgba(110,231,183,0.10)', border: 'rgba(110,231,183,0.18)' },
    Medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.18)' },
    Hard: { text: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.18)' },
};

/**
 * Premium ProblemRow renders a single problem inside the expanded table.
 */
export function ProblemRow({
    problem,
    probIdx,
    filteredCount,
    isLight,
    isSolved,
    pattern,
    gc,
    getExplanationSnippet,
    onSolveProblem,
}) {
    const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Medium;
    const isLast = probIdx === filteredCount - 1;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 72px 64px 56px 52px',
                gap: 6,
                padding: '10px 16px',
                alignItems: 'center',
                borderBottom: isLast
                    ? 'none'
                    : isLight
                      ? '1px solid rgba(0,0,0,0.035)'
                      : '1px solid rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = isLight
                    ? 'rgba(0,0,0,0.018)'
                    : 'rgba(255,255,255,0.02)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            {/* Solved accent bar */}
            {isSolved && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 4,
                        bottom: 4,
                        width: 3,
                        borderRadius: '0 3px 3px 0',
                        background: 'linear-gradient(180deg, #6ee7b7, #34d399)',
                        boxShadow: '0 0 8px rgba(110,231,183,0.3)',
                    }}
                />
            )}

            {/* Index / Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSolved ? (
                    <CheckCircle2
                        size={16}
                        color="#6ee7b7"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(110,231,183,0.35))' }}
                    />
                ) : (
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {probIdx + 1}
                    </span>
                )}
            </div>

            {/* Title + Difficulty */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    gap: 3,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12.5,
                            fontWeight: isSolved ? 500 : 600,
                            color: isSolved
                                ? isLight
                                    ? 'rgba(0,0,0,0.35)'
                                    : 'rgba(255,255,255,0.35)'
                                : isLight
                                  ? '#1e293b'
                                  : 'rgba(255,255,255,0.88)',
                            textDecoration: isSolved ? 'line-through' : 'none',
                            textDecorationColor: isSolved
                                ? 'rgba(110,231,183,0.4)'
                                : undefined,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.2s ease',
                        }}
                    >
                        {problem.title}
                    </span>
                    <span
                        style={{
                            fontSize: 8.5,
                            fontWeight: 800,
                            color: dc.text,
                            background: dc.bg,
                            border: `1px solid ${dc.border}`,
                            padding: '1px 7px',
                            borderRadius: 5,
                            flexShrink: 0,
                            letterSpacing: 0.3,
                            textTransform: 'uppercase',
                        }}
                    >
                        {problem.difficulty}
                    </span>
                </div>

                {/* Explanation snippet */}
                {getExplanationSnippet && getExplanationSnippet(problem) && (
                    <span
                        style={{
                            fontSize: 10,
                            color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.3,
                        }}
                    >
                        {getExplanationSnippet(problem)}
                    </span>
                )}
            </div>

            {/* Notes/Editorial */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {problem.editorial ? (
                    <Link
                        to={`/patterns/${pattern.id}/${problem.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 7,
                            fontSize: 9.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06))',
                            border: '1px solid rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.14))';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(59,130,246,0.12)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06))';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <FileText size={10} /> Notes
                    </Link>
                ) : (
                    <span style={{
                        fontSize: 9,
                        color: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)',
                        fontStyle: 'italic',
                    }}>—</span>
                )}
            </div>

            {/* Code / Solve */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {isSolved ? (
                    <span
                        style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            color: '#6ee7b7',
                            background: 'rgba(110,231,183,0.08)',
                            border: '1px solid rgba(110,231,183,0.15)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            letterSpacing: 0.3,
                        }}
                    >
                        Solved
                    </span>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSolveProblem && onSolveProblem(problem.id);
                        }}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 7,
                            fontSize: 9.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${gc.dot}15, ${gc.dot}08)`,
                            border: `1px solid ${gc.dot}25`,
                            color: gc.dot,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${gc.dot}30, ${gc.dot}18)`;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 3px 10px ${gc.dot}15`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${gc.dot}15, ${gc.dot}08)`;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Code2 size={10} /> Solve
                    </button>
                )}
            </div>

            {/* AI hint */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.04))',
                        borderRadius: 6,
                        border: '1px solid rgba(168,85,247,0.12)',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#a78bfa',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(139,92,246,0.12))';
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.04))';
                        e.currentTarget.style.transform = 'none';
                    }}
                    title="AI Hint"
                >
                    <Sparkles size={11} />
                </button>
            </div>

            {/* External link */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {problem.link ? (
                    <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                            border: isLight
                                ? '1px solid rgba(0,0,0,0.06)'
                                : '1px solid rgba(255,255,255,0.05)',
                            color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight
                                ? 'rgba(59,130,246,0.08)'
                                : 'rgba(59,130,246,0.1)';
                            e.currentTarget.style.border = '1px solid rgba(59,130,246,0.2)';
                            e.currentTarget.style.color = '#60a5fa';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight
                                ? 'rgba(0,0,0,0.03)'
                                : 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.border = isLight
                                ? '1px solid rgba(0,0,0,0.06)'
                                : '1px solid rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = isLight
                                ? 'rgba(0,0,0,0.3)'
                                : 'rgba(255,255,255,0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <ExternalLink size={12} />
                    </a>
                ) : (
                    <span style={{
                        fontSize: 9,
                        color: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)',
                    }}>—</span>
                )}
            </div>
        </div>
    );
}
