import React, { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function AnimatedGauge({ value, size = 140, strokeWidth = 10, color = 'var(--accent)', isLight = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const cx = size / 2;
        const cy = size / 2;
        const r = (size - strokeWidth * 2) / 2;

        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        const angle = Math.PI * 0.75 + (Math.PI * 1.5) * (value / 100);
        ctx.beginPath();
        // Inner shadow glow effect calculation isn't possible directly with pure strokes cleanly, but we can do a line glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.arc(cx, cy, r, Math.PI * 0.75, angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.shadowBlur = 0; // reset

        ctx.fillStyle = isLight ? '#0f172a' : '#fff';
        ctx.font = `bold ${size * 0.22}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}%`, cx, cy - 4);
        ctx.fillStyle = isLight ? '#64748b' : 'rgba(255,255,255,0.45)';
        ctx.font = `700 ${size * 0.09}px system-ui`;
        ctx.fillText('READY', cx, cy + size * 0.14);
    }, [value, size, strokeWidth, color, isLight]);

    return <canvas ref={canvasRef} aria-hidden="true" style={{ animation: 'bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }} />;
}

export default function ReadinessScore({ data, company = null, compact = false }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const rd = data || { practiceCount: 0, mockCount: 0, streak: 0, timedSessions: 0 };

    // Calculate sub-scores (0-100 each)
    const practiceScore = Math.min(100, Math.round((rd.practiceCount / 50) * 100));
    const mockScore = Math.min(100, Math.round((rd.mockCount / 5) * 100));
    const streakScore = Math.min(100, Math.round((rd.streak / 14) * 100));
    const timedScore = Math.min(100, Math.round((rd.timedSessions / 10) * 100));

    // Weighted average
    const score = Math.round(
        practiceScore * 0.35 +
        mockScore * 0.25 +
        streakScore * 0.20 +
        timedScore * 0.20
    );

    const breakdown = {
        practice: practiceScore,
        mocks: mockScore,
        streak: streakScore,
        timed: timedScore,
    };

    const getColor = (v) => v >= 70 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444';
    const getGlow = (v) => v >= 70 ? 'rgba(16, 185, 129, 0.15)' : v >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const getLabel = (v) => v >= 80 ? 'Interview Ready! 🎯' : v >= 60 ? 'Almost There 💪' : v >= 30 ? 'Making Progress 📈' : 'Getting Started 🌱';

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
        title: isLight ? '#0f172a' : '#f8fafc',
        muted: isLight ? '#94a3b8' : '#64748b',
    };

    if (compact) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <AnimatedGauge value={score} size={70} strokeWidth={6} color={getColor(score)} isLight={isLight} />
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: c.title, marginBottom: '2px' }}>Interview Readiness</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: getColor(score) }}>{getLabel(score)}</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: '24px 28px',
            background: c.bg,
            borderRadius: '24px',
            border: c.border,
            boxShadow: c.shadow,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.85); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .rs-breakdown-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-top: 24px;
                }
            `}</style>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', 
                    background: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.12)', 
                    border: '1px solid rgba(34, 197, 94, 0.18)' 
                }}>
                    <Shield size={18} style={{ color: '#22c55e' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Readiness Score {company ? `— ${company}` : ''}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Your overall interview preparedness</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: getGlow(score), filter: 'blur(30px)', borderRadius: '50%', zIndex: 0 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <AnimatedGauge value={score} size={150} color={getColor(score)} isLight={isLight} strokeWidth={12} />
                    </div>
                </div>
                <div style={{ 
                    marginTop: '20px', fontSize: '14px', fontWeight: 700, 
                    color: getColor(score), background: getGlow(score), 
                    padding: '8px 16px', borderRadius: '24px', letterSpacing: '0.2px' 
                }}>
                    {getLabel(score)}
                </div>
            </div>

            <div className="rs-breakdown-grid">
                {[
                    { label: 'Practice', value: breakdown.practice, icon: '📝' },
                    { label: 'Mocks', value: breakdown.mocks, icon: '🎤' },
                    { label: 'Streak', value: breakdown.streak, icon: '🔥' },
                    { label: 'Timed', value: breakdown.timed, icon: '⏱️' },
                ].map(item => (
                    <div key={item.label} style={{
                        background: c.cardBg,
                        padding: '14px',
                        borderRadius: '12px',
                        border: c.cardBorder,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: c.title }}>{item.icon} {item.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: getColor(item.value) }}>{item.value}%</span>
                        </div>
                        <div style={{ 
                            height: '6px', borderRadius: '3px', background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)', overflow: 'hidden' 
                        }}>
                            <div style={{ 
                                height: '100%', width: `${item.value}%`, background: getColor(item.value), 
                                borderRadius: '3px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' 
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
