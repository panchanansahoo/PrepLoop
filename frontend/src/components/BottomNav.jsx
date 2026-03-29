import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Code, Mic, BarChart3, User } from 'lucide-react';
import './BottomNav.css';

const tabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/problems', label: 'Practice', icon: Code },
    { path: '/company-interview', label: 'Interview', icon: Mic },
    { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
    const location = useLocation();

    // Map sections to their tab
    const getActiveTab = () => {
        const path = location.pathname;
        // Practice section
        if (['/problems', '/code-editor', '/visualizer', '/sql-problems', '/aptitude', '/dsa-path', '/learning-path', '/advanced-learning-path', '/ai-tutor']
            .some(p => path.startsWith(p))) return '/problems';
        // Interview section
        if (['/company-prep', '/company-interview']
            .some(p => path.startsWith(p))) return '/company-interview';
        // Account / Progress section
        if (['/gamification', '/dashboard/analytics', '/history', '/profile', '/dashboard/settings']
            .some(p => path.startsWith(p))) return '/profile';
        // Home
        return '/dashboard';
    };

    const activeTab = getActiveTab();

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.path;
                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`bottom-nav-tab ${isActive ? 'active' : ''}`}
                    >
                        <span className="bottom-nav-icon">
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                        </span>
                        <span className="bottom-nav-label">{tab.label}</span>
                        {isActive && <span className="bottom-nav-indicator" />}
                    </Link>
                );
            })}
        </nav>
    );
}
