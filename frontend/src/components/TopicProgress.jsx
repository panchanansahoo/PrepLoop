import React from 'react';
import { Inbox } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TopicProgress({ topics }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const items = topics || [];

    const c = {
        bg: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.03)',
        border: isLight ? '1px solid rgba(99,102,241,0.1)' : '1px solid rgba(255,255,255,0.06)',
        title: isLight ? '#1a1d2e' : '#fff',
        sub: isLight ? '#64748b' : 'rgba(255,255,255,0.35)',
        topicName: isLight ? '#334155' : 'rgba(255,255,255,0.7)',
        topicCount: isLight ? '#64748b' : 'rgba(255,255,255,0.35)',
        barTrack: isLight ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.06)',
        emptyIcon: isLight ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.12)',
        emptyText: isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)',
    };

    if (items.length === 0) {
        return (
            <div style={{
                background: c.bg, borderRadius: 16, border: c.border, padding: '20px 24px',
                backdropFilter: isLight ? 'blur(12px)' : 'none',
                boxShadow: isLight ? '0 2px 12px rgba(99,102,241,0.04)' : 'none',
            }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.title, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📊 Topic Progress
                </div>
                <div style={{ fontSize: 12, color: c.sub, marginBottom: 18 }}>DSA roadmap completion</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8 }}>
                    <Inbox size={28} style={{ color: c.emptyIcon }} />
                    <div style={{ fontSize: 12, color: c.emptyText, textAlign: 'center' }}>
                        No topic progress yet. Start solving problems to track your progress!
                    </div>
                </div>
            </div>
        );
    }

    const totalSolved = items.reduce((s, t) => s + t.solved, 0);
    const totalProblems = items.reduce((s, t) => s + t.total, 0);

    return (
        <div style={{
            background: c.bg, borderRadius: 16, border: c.border, padding: '20px 24px',
            backdropFilter: isLight ? 'blur(12px)' : 'none',
            boxShadow: isLight ? '0 2px 12px rgba(99,102,241,0.04)' : 'none',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.title, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                        📊 Topic Progress
                    </div>
                    <div style={{ fontSize: 12, color: c.sub }}>DSA roadmap completion</div>
                </div>
                <div style={{
                    padding: '4px 12px', borderRadius: 99, background: 'rgba(139, 92, 246, 0.12)',
                    color: '#a78bfa', fontSize: 12, fontWeight: 700,
                }}>
                    {totalSolved}/{totalProblems}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((topic, i) => {
                    const pct = topic.total > 0 ? Math.round((topic.solved / topic.total) * 100) : 0;
                    return (
                        <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span style={{ fontSize: 13, color: c.topicName, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: topic.color, display: 'inline-block', flexShrink: 0 }} />
                                    {topic.name}
                                </span>
                                <span style={{ fontSize: 11, color: c.topicCount, fontWeight: 600 }}>
                                    {topic.solved}/{topic.total} · {pct}%
                                </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: c.barTrack, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${pct}%`, height: '100%', borderRadius: 3,
                                    background: `linear-gradient(90deg, ${topic.color}, ${topic.color}dd)`,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
