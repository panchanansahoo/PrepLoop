import { useState } from 'react';
import { Bot, Sparkles, Send, Command } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function AIJobCopilotWidget() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(250, 250, 250, 0.9))' : 'linear-gradient(135deg, rgba(23, 20, 38, 0.7), rgba(15, 15, 24, 0.5))',
        border: isLight ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(139, 92, 246, 0.15)',
        shadow: isLight ? '0 12px 32px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        title: isLight ? '#312e81' : '#e0e7ff',
        muted: isLight ? '#6366f1' : '#818cf8',
        inputBg: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)',
        inputBorder: isLight ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(139, 92, 246, 0.3)',
    };

    const handleAsk = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate('/copilot', { state: { initialQuery: query } });
        } else {
            navigate('/copilot');
        }
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
            height: '100%'
        }}>
            {/* Glowing Orb Background */}
            <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '120px',
                height: '120px',
                background: isLight ? 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(20px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                    }}>
                        <Bot size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            AI Job Copilot <Sparkles size={14} color="#a855f7" />
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500, opacity: 0.9 }}>Your personal career strategist</p>
                    </div>
                </div>
            </div>

            {/* Content & Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1, flex: 1, justifyContent: 'flex-end' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: isLight ? '#4f46e5' : '#c7d2fe', fontWeight: 500 }}>
                    Stuck on a tricky behavioral question or need quick negotiation tips? Ask Copilot!
                </p>

                <form onSubmit={handleAsk} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: '14px', color: c.muted, display: 'flex', alignItems: 'center' }}>
                        <Command size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. Help me answer 'Why Google?'"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 48px 14px 40px',
                            background: c.inputBg,
                            border: c.inputBorder,
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: c.title,
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#8b5cf6';
                            e.target.style.boxShadow = '0 0 0 4px rgba(139,92,246,0.1), inset 0 2px 4px rgba(0,0,0,0.02)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = c.inputBorder.split(' ')[2];
                            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            position: 'absolute',
                            right: '6px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: query.trim() ? 'linear-gradient(135deg, #6366f1, #a855f7)' : (isLight ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.2)'),
                            border: 'none',
                            color: query.trim() ? 'white' : c.muted,
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: query.trim() ? '0 2px 8px rgba(139,92,246,0.4)' : 'none'
                        }}
                    >
                        <Send size={14} style={{ marginLeft: query.trim() ? '2px' : '0' }} />
                    </button>
                </form>
            </div>
        </div>
    );
}
