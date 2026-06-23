import React, { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, Target } from 'lucide-react';
import { ProblemExplorerAllQuestionsView } from './ProblemExplorerAllQuestionsView';

export function ProblemExplorerStudyPlansView({
    viewMode,
    isLight,
    studyPlans,
    activePlan,
    setActivePlan,
    solvedSet,
    problems,
    filteredProblems,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    onSolveProblem,
    getExplanationSnippet,
    navigate
}) {
    if (viewMode !== 'plans') return null;

    // Grid View
    if (!activePlan) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20,
                padding: '8px 0',
            }}>
                {studyPlans.map(plan => {
                    // Calculate progress based on all problems (not just filtered ones)
                    const planProblems = problems.filter(plan.filter);
                    if (plan.limit) {
                        planProblems.splice(plan.limit);
                    }
                    const total = planProblems.length;
                    const solved = planProblems.filter(p => solvedSet.has(String(p.id)) || p.status === 'solved').length;
                    const progress = total > 0 ? Math.round((solved / total) * 100) : 0;
                    const isCompleted = progress === 100 && total > 0;

                    return (
                        <div
                            key={plan.id}
                            onClick={() => setActivePlan(plan.id)}
                            style={{
                                background: isLight
                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.6))'
                                    : 'linear-gradient(135deg, rgba(25,25,35,0.6), rgba(20,20,30,0.4))',
                                border: isLight ? `1px solid rgba(0,0,0,0.06)` : `1px solid rgba(255,255,255,0.05)`,
                                borderRadius: 20,
                                padding: 24,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isLight 
                                    ? '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)'
                                    : '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = isLight 
                                    ? '0 12px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
                                    : '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = plan.border;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = isLight 
                                    ? '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)'
                                    : '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)';
                                e.currentTarget.style.borderColor = isLight ? `rgba(0,0,0,0.06)` : `rgba(255,255,255,0.05)`;
                            }}
                        >
                            {/* Decorative background glow */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0, width: 150, height: 150,
                                background: plan.gradient, filter: 'blur(40px)', opacity: 0.6,
                                borderRadius: '50%', transform: 'translate(30%, -30%)', zIndex: 0,
                            }} />

                            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${plan.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}>
                                        {plan.icon}
                                    </div>
                                    {isCompleted && (
                                        <div style={{
                                            padding: '4px 10px', borderRadius: 20,
                                            background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))',
                                            border: '1px solid rgba(52,211,153,0.3)',
                                            color: '#34d399', fontSize: 11, fontWeight: 800,
                                            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 0.5
                                        }}>
                                            <CheckCircle2 size={12} strokeWidth={3} /> COMPLETED
                                        </div>
                                    )}
                                </div>
                                <h3 style={{
                                    fontSize: 18, fontWeight: 800, margin: '0 0 8px 0',
                                    color: isLight ? '#0f172a' : '#f8fafc',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {plan.label}
                                </h3>
                                <p style={{
                                    fontSize: 13, color: isLight ? '#64748b' : 'rgba(255,255,255,0.5)',
                                    lineHeight: 1.5, margin: 0, minHeight: 40
                                }}>
                                    {plan.desc}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ position: 'relative', zIndex: 1, marginTop: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: isLight ? '#475569' : 'rgba(255,255,255,0.6)' }}>
                                        Progress
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: plan.textLight }}>
                                        {solved} / {total}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6, borderRadius: 3, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                        width: `${progress}%`,
                                        background: plan.gradient,
                                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Detail View
    const plan = studyPlans.find(p => p.id === activePlan);
    if (!plan) return null;

    // Filter problems specifically for this plan, regardless of other global filters
    const planProblems = problems.filter(plan.filter).slice(0, plan.limit || 9999);
    const total = planProblems.length;
    const solved = planProblems.filter(p => solvedSet.has(String(p.id)) || p.status === 'solved').length;
    const progress = total > 0 ? Math.round((solved / total) * 100) : 0;

    return (
        <div style={{
            animation: 'fade-in 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{
                padding: '32px', borderRadius: 24, marginBottom: 24,
                background: plan.gradient,
                border: `1px solid ${plan.border}`,
                boxShadow: isLight 
                    ? '0 8px 32px rgba(0,0,0,0.04)'
                    : '0 12px 40px rgba(0,0,0,0.2)',
                position: 'relative', overflow: 'hidden'
            }}>
                <button
                    onClick={() => setActivePlan(null)}
                    style={{
                        position: 'absolute', top: 24, left: 24, zIndex: 10,
                        background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)',
                        border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 12px', borderRadius: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: plan.textLight, fontSize: 13, fontWeight: 700,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)'}
                >
                    <ArrowLeft size={14} /> Back to Plans
                </button>

                <div style={{
                    display: 'flex', gap: 32, alignItems: 'center', marginTop: 32, position: 'relative', zIndex: 1
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 20,
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 40, boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }}>
                        {plan.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            fontSize: 32, fontWeight: 900, margin: '0 0 8px 0',
                            color: plan.textLight, letterSpacing: '-0.02em',
                        }}>
                            {plan.label}
                        </h2>
                        <p style={{
                            fontSize: 15, color: plan.textLight, opacity: 0.8,
                            margin: '0 0 20px 0', maxWidth: 600, lineHeight: 1.5,
                        }}>
                            {plan.desc}
                        </p>
                        
                        {/* Auto-jump Action Button */}
                        {(() => {
                            const firstUnsolvedProblem = planProblems.find(p => !solvedSet.has(String(p.id)) && p.status !== 'solved');
                            if (!firstUnsolvedProblem) {
                                return (
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '8px 16px', borderRadius: 10,
                                        background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
                                        color: '#34d399', fontSize: 14, fontWeight: 700
                                    }}>
                                        <CheckCircle2 size={16} strokeWidth={3} /> Plan Completed
                                    </div>
                                );
                            }
                            return (
                                <button
                                    onClick={() => onSolveProblem(firstUnsolvedProblem.id)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                                        background: isLight ? 'rgba(0,0,0,0.8)' : '#ffffff',
                                        color: isLight ? '#ffffff' : '#0f172a',
                                        border: 'none', fontSize: 14, fontWeight: 700,
                                        boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(255,255,255,0.2)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = isLight ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 20px rgba(255,255,255,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(255,255,255,0.2)';
                                    }}
                                >
                                    <Target size={16} /> 
                                    {progress === 0 ? 'Start Plan' : 'Continue Plan'}
                                </button>
                            );
                        })()}
                    </div>
                    <div style={{
                        background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(8px)',
                        padding: '20px 24px', borderRadius: 16,
                        border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120,
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: plan.textLight, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            {solved} <span style={{ fontSize: 14, opacity: 0.6 }}>/ {total}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: plan.textLight, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                            Completed
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Problems - Rendered using AllQuestionsView for consistency */}
            <div style={{
                background: isLight ? '#ffffff' : 'rgba(20,20,30,0.5)',
                borderRadius: 20, padding: 2,
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
            }}>
                <ProblemExplorerAllQuestionsView
                    viewMode="all"
                    isLight={isLight}
                    filteredProblems={planProblems}
                    solvedSet={solvedSet}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    setSortBy={setSortBy}
                    setSortDir={setSortDir}
                    onSolveProblem={onSolveProblem}
                    getExplanationSnippet={getExplanationSnippet}
                />
            </div>
            
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
