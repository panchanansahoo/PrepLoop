import { useEffect, useState } from 'react';
import { AreaChart, Activity, Play, BarChart2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function AlgorithmVisualizerWidget() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const navigate = useNavigate();
    const [bars, setBars] = useState([30, 45, 20, 60, 80, 25, 50, 70, 40]);
    const [activeIdx, setActiveIdx] = useState(-1);

    // Simple sorting animation effect
    useEffect(() => {
        let timer;
        const animate = () => {
            const randomIdx = Math.floor(Math.random() * bars.length);
            setActiveIdx(randomIdx);
            
            // Randomly shuffle heights slightly to simulate algorithm running
            setBars(prev => {
                const next = [...prev];
                const i = Math.floor(Math.random() * next.length);
                const j = Math.floor(Math.random() * next.length);
                // Swap
                [next[i], next[j]] = [next[j], next[i]];
                return next;
            });
            
            timer = setTimeout(animate, 600);
        };
        timer = setTimeout(animate, 600);
        return () => clearTimeout(timer);
    }, [bars.length]);

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(248, 250, 252, 0.9))' : 'linear-gradient(135deg, rgba(8, 26, 21, 0.7), rgba(15, 20, 24, 0.5))',
        border: isLight ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(16, 185, 129, 0.2)',
        shadow: isLight ? '0 12px 32px rgba(16, 185, 129, 0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        title: isLight ? '#064e3b' : '#d1fae5',
        muted: isLight ? '#059669' : '#34d399',
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
            gap: '20px',
            height: '100%',
            cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={() => navigate('/visualizer')}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isLight ? '0 16px 40px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = c.shadow;
        }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                    }}>
                        <AreaChart size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Visualizer <Activity size={14} color="#10b981" />
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>See algorithms in action</p>
                    </div>
                </div>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', placeItems: 'center', justifyContent: 'center',
                    color: '#10b981'
                }}>
                    <Play size={14} fill="currentColor" />
                </div>
            </div>

            {/* Animation Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '8px',
                height: '80px',
                padding: '10px 0'
            }}>
                {bars.map((height, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: '16px',
                            height: `${height}%`,
                            background: idx === activeIdx ? '#10b981' : (isLight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)'),
                            borderRadius: '4px',
                            transition: 'all 0.3s ease',
                            boxShadow: idx === activeIdx ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
                        }}
                    />
                ))}
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <BarChart2 size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Launch Array Visualization
            </div>
        </div>
    );
}
