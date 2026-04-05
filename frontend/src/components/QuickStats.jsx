import React, { useState, useEffect, useRef } from 'react';
import { Flame, CheckCircle2, Target, Zap } from 'lucide-react';

function AnimatedCounter({ end, duration = 1200, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = 0;
                const startTime = performance.now();
                const animate = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.round(start + (end - start) * eased));
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
}

export default function QuickStats({ data }) {
    const stats = data || { streak: 0, problemsSolved: 0, avgScore: 0, attendInterview: 0 };
    const hasActivity = [stats.streak, stats.problemsSolved, stats.avgScore, stats.attendInterview].some((value) => value > 0);

    const cards = [
        {
            label: 'Day Streak',
            value: stats.streak,
            icon: Flame,
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))',
            borderGlow: 'rgba(245, 158, 11, 0.2)',
            suffix: '',
            activeHint: 'Keep it alive today',
            emptyHint: 'Your streak starts with one solve'
        },
        {
            label: 'Problems Solved',
            value: stats.problemsSolved,
            icon: CheckCircle2,
            color: '#22c55e',
            gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.03))',
            borderGlow: 'rgba(34, 197, 94, 0.2)',
            suffix: '',
            activeHint: 'Practice sessions completed',
            emptyHint: 'No sessions logged yet'
        },
        {
            label: 'Avg Score',
            value: stats.avgScore,
            icon: Target,
            color: '#a78bfa',
            gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.03))',
            borderGlow: 'rgba(167, 139, 250, 0.2)',
            suffix: '%',
            activeHint: 'Your rolling performance average',
            emptyHint: 'Score appears after your first review'
        },
        {
            label: 'Attend Interview',
            value: stats.attendInterview,
            icon: Zap,
            color: '#38bdf8',
            gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.03))',
            borderGlow: 'rgba(56, 189, 248, 0.2)',
            suffix: '',
            activeHint: 'Completed mock interviews',
            emptyHint: 'Start your first mock interview'
        }
    ];

    return (
        <section className="quick-stats-shell">
            <div className="quick-stats-grid">
            {cards.map((card) => {
                const Icon = card.icon;
                const isEmpty = !hasActivity && card.value === 0;
                const displayValue = card.suffix === '%' ? `${card.value}%` : card.value;
                return (
                    <div
                        key={card.label}
                        className={`quick-stat-card ${isEmpty ? 'quick-stat-card-empty' : ''}`}
                        style={{ background: card.gradient, borderColor: card.borderGlow }}
                    >
                        <div className="quick-stat-top-row">
                            <div className="quick-stat-icon" style={{ background: `${card.color}20` }}>
                                <Icon size={20} style={{ color: card.color }} />
                            </div>
                            <div className="quick-stat-label">{card.label}</div>
                        </div>
                        <div className={`quick-stat-value ${isEmpty ? 'quick-stat-value-empty' : ''}`} style={{ color: card.color }}>
                            {card.value > 0 ? (
                                <AnimatedCounter end={card.value} suffix={card.suffix} />
                            ) : (
                                <span>{displayValue}</span>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </section>
    );
}
