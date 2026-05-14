import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    CheckCircle2, Mic, Trophy, Flame, Code2,
    Database, Brain, Clock, ChevronRight, Inbox
} from 'lucide-react';

const ACTIVITY_TYPES = {
    problem_solved: { icon: CheckCircle2, color: '#10b981', label: 'Problem Solved' },
    interview_done: { icon: Mic, color: '#8b5cf6', label: 'Interview Completed' },
    badge_earned: { icon: Trophy, color: '#f59e0b', label: 'Badge Earned' },
    streak_milestone: { icon: Flame, color: '#ef4444', label: 'Streak Milestone' },
    dsa_practice: { icon: Code2, color: '#0ea5e9', label: 'DSA Practice' },
    sql_practice: { icon: Database, color: '#10b981', label: 'SQL Practice' },
    aptitude_quiz: { icon: Brain, color: '#f97316', label: 'Aptitude Quiz' },
};

function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function RecentActivity({ activities }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const items = activities || [];

    const panelBg = isLight 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
        : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))';
    const panelBorder = isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const subTextColor = isLight ? '#64748b' : '#94a3b8';
    
    // Fallback styling for empty state
    const emptyIconColor = isLight ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.15)';
    const emptyTextColor = isLight ? '#64748b' : 'rgba(255,255,255,0.4)';

    if (items.length === 0) {
        return (
            <div className="recent-activity-card premium-activity-card transition-all duration-300">
                <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                    <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
                        <Clock size={20} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight" style={{ color: textColor }}>Recent Activity</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 12 }}>
                    <Inbox size={40} style={{ color: emptyIconColor }} />
                    <div style={{ fontSize: 14, color: emptyTextColor, textAlign: 'center', fontWeight: '500' }}>
                        No activity yet. Start solving problems to see your progress here!
                    </div>
                </div>
                <style>{getDynamicStyles(isLight, panelBg, panelBorder)}</style>
            </div>
        );
    }

    return (
        <div className="recent-activity-card premium-activity-card transition-all duration-300">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
                    <Clock size={20} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                </div>
                <span className="font-extrabold text-xl tracking-tight" style={{ color: textColor }}>Recent Activity</span>
            </div>

            <div className="flex flex-col gap-2 px-4 pb-4">
                {items.map((activity, i) => {
                    const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.dsa_practice;
                    const Icon = config.icon;
                    return (
                        <div key={i} className="recent-activity-item premium-activity-item group" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="premium-activity-icon" style={{ background: `${config.color}${isLight ? '20' : '15'}`, color: config.color, boxShadow: `0 0 12px ${config.color}30` }}>
                                <Icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col justify-center w-full min-w-0">
                                <div className="font-semibold text-[15px] truncate" style={{ color: textColor }}>{activity.title}</div>
                                <div className="flex items-center gap-2 text-xs mt-0.5">
                                    <span style={{ color: config.color, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: 10 }}>{config.label}</span>
                                    <span style={{ color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>·</span>
                                    <span style={{ color: subTextColor, fontWeight: 500 }}>{timeAgo(activity.timestamp)}</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="recent-activity-chevron" />
                        </div>
                    );
                })}
            </div>
            <style>{getDynamicStyles(isLight, panelBg, panelBorder)}</style>
        </div>
    );
}

function getDynamicStyles(isLight, panelBg, panelBorder) {
    return `
        .premium-activity-card {
            background: ${panelBg};
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: ${panelBorder};
            border-radius: 24px;
            box-shadow: ${isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'};
            overflow: hidden;
            animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .premium-activity-card:hover {
            box-shadow: ${isLight ? '0 16px 48px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)' : '0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)'};
        }
        .premium-activity-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 14px 16px;
            border-radius: 16px;
            background: ${isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)'};
            border: 1px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            opacity: 0;
            animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .premium-activity-item:hover {
            background: ${isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)'};
            border-color: ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)'};
            transform: translateX(6px) !important;
            box-shadow: ${isLight ? '0 4px 12px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.2)'};
        }
        .premium-activity-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .premium-activity-item:hover .premium-activity-icon {
            transform: scale(1.1) rotate(5deg);
        }
        .recent-activity-chevron {
            margin-left: auto;
            color: ${isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255,255,255,0.2)'};
            transition: all 0.3s ease;
        }
        .premium-activity-item:hover .recent-activity-chevron {
            color: ${isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255,255,255,0.6)'};
            transform: translateX(2px);
        }
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
}
