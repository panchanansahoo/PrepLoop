import React from 'react';
import { Link } from 'react-router-dom';
import {
    Mic, Code2, Database,
    Building2, Calculator, CalendarDays
} from 'lucide-react';

const actions = [
    {
        label: 'Mock Interview',
        description: 'AI-powered practice',
        icon: Mic,
        color: '#a78bfa',
        glow: 'rgba(167, 139, 250, 0.12)',
        path: '/company-interview'
    },
    {
        label: 'Practice DSA',
        description: 'Code challenges',
        icon: Code2,
        color: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.12)',
        path: '/problems'
    },
    {
        label: 'SQL Challenge',
        description: 'Database queries',
        icon: Database,
        color: '#34d399',
        glow: 'rgba(52, 211, 153, 0.12)',
        path: '/sql-problems'
    },
    {
        label: 'Advanced Planner',
        description: 'Date-wise roadmap',
        icon: CalendarDays,
        color: '#e84f2e',
        glow: 'rgba(232, 79, 46, 0.14)',
        path: '/advanced-learning-path'
    },
    {
        label: 'Company Prep',
        description: 'Real Q&A by company',
        icon: Building2,
        color: '#fb923c',
        glow: 'rgba(251, 146, 60, 0.12)',
        path: '/company-prep'
    },
    {
        label: 'Aptitude Quiz',
        description: 'Quant & reasoning',
        icon: Calculator,
        color: '#f472b6',
        glow: 'rgba(244, 114, 182, 0.12)',
        path: '/aptitude'
    }
];

export default function QuickActions() {
    return (
        <div className="quick-actions-section">
            <div className="quick-actions-header">
                <span className="quick-actions-title">⚡ Quick Actions</span>
                <span className="quick-actions-subtitle">Jump straight into practice</span>
            </div>
            <div className="quick-actions-grid">
                {actions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            to={action.path}
                            className="quick-action-card"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className="quick-action-icon" style={{ background: action.glow }}>
                                <Icon size={22} style={{ color: action.color }} />
                            </div>
                            <div className="quick-action-text">
                                <div className="quick-action-label">{action.label}</div>
                                <div className="quick-action-desc">{action.description}</div>
                            </div>
                            <div className="quick-action-arrow">→</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
