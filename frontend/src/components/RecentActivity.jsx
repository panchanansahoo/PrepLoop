import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    CheckCircle2, Mic, Trophy, Flame, Code2,
    Database, Brain, Clock, ChevronRight, Inbox
} from 'lucide-react';

const ACTIVITY_TYPES = {
    problem_solved: { icon: CheckCircle2, color: '#22c55e', label: 'Problem Solved' },
    interview_done: { icon: Mic, color: '#a78bfa', label: 'Interview Completed' },
    badge_earned: { icon: Trophy, color: '#f59e0b', label: 'Badge Earned' },
    streak_milestone: { icon: Flame, color: '#ef4444', label: 'Streak Milestone' },
    dsa_practice: { icon: Code2, color: '#38bdf8', label: 'DSA Practice' },
    sql_practice: { icon: Database, color: '#34d399', label: 'SQL Practice' },
    aptitude_quiz: { icon: Brain, color: '#fb923c', label: 'Aptitude Quiz' },
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

    const emptyIconColor = isLight ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.15)';
    const emptyTextColor = isLight ? '#8b8fa6' : 'rgba(255,255,255,0.35)';

    if (items.length === 0) {
        return (
            <div className="recent-activity-card">
                <div className="recent-activity-header">
                    <div className="recent-activity-title">
                        <Clock size={18} style={{ color: '#a78bfa' }} />
                        <span>Recent Activity</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 8 }}>
                    <Inbox size={32} style={{ color: emptyIconColor }} />
                    <div style={{ fontSize: 13, color: emptyTextColor, textAlign: 'center' }}>
                        No activity yet. Start solving problems to see your progress here!
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="recent-activity-card">
            <div className="recent-activity-header">
                <div className="recent-activity-title">
                    <Clock size={18} style={{ color: '#a78bfa' }} />
                    <span>Recent Activity</span>
                </div>
            </div>

            <div className="recent-activity-list">
                {items.map((activity, i) => {
                    const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.dsa_practice;
                    const Icon = config.icon;
                    return (
                        <div key={i} className="recent-activity-item" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="recent-activity-icon" style={{ background: `${config.color}15`, color: config.color }}>
                                <Icon size={16} />
                            </div>
                            <div className="recent-activity-info">
                                <div className="recent-activity-item-title">{activity.title}</div>
                                <div className="recent-activity-meta">
                                    <span style={{ color: config.color, fontSize: 11, fontWeight: 600 }}>{config.label}</span>
                                    <span>·</span>
                                    <span>{timeAgo(activity.timestamp)}</span>
                                </div>
                            </div>
                            <ChevronRight size={14} className="recent-activity-chevron" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
