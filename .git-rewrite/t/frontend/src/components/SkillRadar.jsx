import React, { useRef, useEffect, useState } from 'react';
import { Radar, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function SkillRadar({ data }) {
    const canvasRef = useRef(null);
    const [animProgress, setAnimProgress] = useState(0);
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const navigate = useNavigate();

    const skillData = data || { dsa: 65, sql: 80, aptitude: 45, systemDesign: 30, behavioral: 90 };

    const skills = [
        { label: 'DSA', value: skillData.dsa },
        { label: 'SQL', value: skillData.sql },
        { label: 'Aptitude', value: skillData.aptitude },
        { label: 'Sys Design', value: skillData.systemDesign },
        { label: 'Behavioral', value: skillData.behavioral },
    ];

    useEffect(() => {
        let start = null;
        const duration = 1200;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out
            setAnimProgress(eased);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 2; // high res
        const size = 320;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const cx = size / 2;
        const cy = size / 2;
        const maxR = size * 0.35;
        const n = skills.length;
        const angleStep = (Math.PI * 2) / n;
        const startAngle = -Math.PI / 2;

        ctx.clearRect(0, 0, size, size);

        // Draw grid rings
        for (let ring = 1; ring <= 5; ring++) {
            const r = (maxR / 5) * ring;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = startAngle + angleStep * i;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            if (ring === 5) {
                ctx.strokeStyle = isLight ? 'rgba(79, 70, 229, 0.3)' : 'rgba(139, 92, 246, 0.4)';
                ctx.lineWidth = 1.5;
            } else {
                ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 1;
            }
            ctx.stroke();
        }

        // Draw axis lines
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
            ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw animated polygon
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const idx = i % n;
            const angle = startAngle + angleStep * idx;
            const r = (skills[idx].value / 100) * maxR * animProgress;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        gradient.addColorStop(0, isLight ? 'rgba(79, 70, 229, 0.6)' : 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(139, 92, 246, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = isLight ? '#4f46e5' : '#a855f7';
        ctx.lineWidth = 2.5;
        // Outer glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = isLight ? 'rgba(79, 70, 229, 0.4)' : 'rgba(168, 85, 247, 0.6)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw vertices
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            const r = (skills[i].value / 100) * maxR * animProgress;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? '#4f46e5' : '#a855f7';
            ctx.fill();
        }

        // Draw Labels
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            const labelR = maxR + 32;
            const x = cx + labelR * Math.cos(angle);
            const y = cy + labelR * Math.sin(angle);

            ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
            ctx.font = '700 13px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skills[i].label, x, y - 8);

            ctx.fillStyle = isLight ? '#4f46e5' : '#a855f7';
            ctx.font = '800 12px system-ui';
            ctx.fillText(`${Math.round(skills[i].value * animProgress)}%`, x, y + 8);
        }

    }, [animProgress, skills, isLight]);

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(250, 250, 250, 0.9))' : 'linear-gradient(135deg, rgba(23, 20, 38, 0.7), rgba(15, 15, 24, 0.5))',
        border: isLight ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(139, 92, 246, 0.15)',
        shadow: isLight ? '0 12px 32px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        title: isLight ? '#312e81' : '#e0e7ff',
        muted: isLight ? '#6366f1' : '#818cf8',
    };

    return (
        <div style={{
            padding: '24px 28px',
            background: c.bg,
            borderRadius: '28px',
            border: c.border,
            boxShadow: c.shadow,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                    }}>
                        <Radar size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>
                            Skill Breakdown
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Overall competency map</p>
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div style={{
                flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1,
                position: 'relative'
            }}>
                {/* Background glow behind canvas */}
                <div style={{ 
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 150, height: 150, borderRadius: '50%',
                    background: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(168, 85, 247, 0.15)',
                    filter: 'blur(40px)', zIndex: 0
                }} />
                <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'relative', zIndex: 1 }} />
            </div>

            {/* Footer action */}
            <button style={{
                marginTop: '12px',
                width: '100%',
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)',
                border: isLight ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(139,92,246,0.3)',
                padding: '12px',
                borderRadius: '14px',
                color: c.title,
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                zIndex: 1
            }}
            onClick={() => navigate('/analytics')}
            onMouseEnter={e => {
                e.currentTarget.style.background = isLight ? '#fff' : 'rgba(0,0,0,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isLight ? '0 8px 24px rgba(99,102,241,0.1)' : '0 8px 24px rgba(139,92,246,0.2)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
            >
                View Analytics Dashboard <ChevronRight size={16} color={c.title} />
            </button>
        </div>
    );
}
