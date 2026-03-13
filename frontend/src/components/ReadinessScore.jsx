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
        ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        const angle = Math.PI * 0.75 + (Math.PI * 1.5) * (value / 100);
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.75, angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.fillStyle = isLight ? '#1e293b' : '#fff';
        ctx.font = `bold ${size * 0.22}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}%`, cx, cy - 4);
        ctx.fillStyle = isLight ? 'rgba(71, 85, 105, 0.6)' : 'rgba(255,255,255,0.35)';
        ctx.font = `600 ${size * 0.09}px system-ui`;
        ctx.fillText('Ready', cx, cy + size * 0.14);
    }, [value, size, strokeWidth, color, isLight]);

    return <canvas ref={canvasRef} />;
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

    const getColor = (v) => v >= 70 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444';
    const getLabel = (v) => v >= 80 ? 'Interview Ready! 🎯' : v >= 60 ? 'Almost There 💪' : v >= 30 ? 'Making Progress 📈' : 'Just Getting Started 🌱';

    if (compact) {
        return (
            <div className="rs-compact">
                <div className="rs-compact-gauge">
                    <AnimatedGauge value={score} size={80} strokeWidth={6} color={getColor(score)} isLight={isLight} />
                </div>
                <div className="rs-compact-info">
                    <span className="rs-compact-label">Interview Readiness</span>
                    <span className="rs-compact-status" style={{ color: getColor(score) }}>
                        {getLabel(score)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="rs-card">
            <div className="rs-header">
                <Shield size={18} style={{ color: 'var(--accent)' }} />
                <h3>Interview Readiness {company ? `— ${company}` : ''}</h3>
            </div>

            <div className="rs-gauge-row">
                <AnimatedGauge value={score} size={140} color={getColor(score)} isLight={isLight} />
                <div className="rs-label" style={{ color: getColor(score) }}>
                    {getLabel(score)}
                </div>
            </div>

            <div className="rs-breakdown">
                {[
                    { label: 'Practice', value: breakdown.practice, icon: '📝' },
                    { label: 'Mocks', value: breakdown.mocks, icon: '🎤' },
                    { label: 'Streak', value: breakdown.streak, icon: '🔥' },
                    { label: 'Timed', value: breakdown.timed, icon: '⏱️' },
                ].map(item => (
                    <div key={item.label} className="rs-break-item">
                        <div className="rs-break-header">
                            <span>{item.icon} {item.label}</span>
                            <span style={{ color: getColor(item.value) }}>{item.value}%</span>
                        </div>
                        <div className="rs-break-bar">
                            <div className="rs-break-fill" style={{ width: `${item.value}%`, background: getColor(item.value) }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
