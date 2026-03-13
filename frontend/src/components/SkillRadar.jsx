import React, { useRef, useEffect, useState } from 'react';
import { Radar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SkillRadar({ data }) {
    const canvasRef = useRef(null);
    const [animProgress, setAnimProgress] = useState(0);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const skillData = data || { dsa: 0, sql: 0, aptitude: 0, systemDesign: 0, behavioral: 0 };

    const skills = [
        { label: 'DSA', value: skillData.dsa },
        { label: 'SQL', value: skillData.sql },
        { label: 'Aptitude', value: skillData.aptitude },
        { label: 'System Design', value: skillData.systemDesign },
        { label: 'Behavioral', value: skillData.behavioral },
    ];

    useEffect(() => {
        let start = null;
        const duration = 1000;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimProgress(eased);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 280;
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
        for (let ring = 1; ring <= 4; ring++) {
            const r = (maxR / 4) * ring;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = startAngle + angleStep * i;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = isLight
                ? `rgba(99, 102, 241, ${ring === 4 ? 0.2 : 0.1})`
                : `rgba(255,255,255,${ring === 4 ? 0.1 : 0.05})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axis lines
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
            ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw value polygon (animated)
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
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.08)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw dots on vertices
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            const r = (skills[i].value / 100) * maxR * animProgress;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#a78bfa';
            ctx.fill();
        }

        // Labels
        for (let i = 0; i < n; i++) {
            const angle = startAngle + angleStep * i;
            const labelR = maxR + 22;
            const x = cx + labelR * Math.cos(angle);
            const y = cy + labelR * Math.sin(angle);

            ctx.fillStyle = isLight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255,255,255,0.6)';
            ctx.font = '600 11px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skills[i].label, x, y);

            ctx.fillStyle = '#a78bfa';
            ctx.font = 'bold 10px system-ui';
            ctx.fillText(`${Math.round(skills[i].value * animProgress)}%`, x, y + 14);
        }

    }, [animProgress, skills, isLight]);

    return (
        <div className="skill-radar-card">
            <div className="skill-radar-header">
                <Radar size={18} style={{ color: '#a78bfa' }} />
                <span>Skill Breakdown</span>
            </div>
            <div className="skill-radar-canvas-wrap">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
