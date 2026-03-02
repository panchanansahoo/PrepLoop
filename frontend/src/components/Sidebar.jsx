import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Brain, BookOpen,
    Grid3X3, FileText, Code, Users,
    ChevronLeft, ChevronRight, Sparkles,
    CalendarDays, BarChart3, Clock, Settings, User,
    PanelLeftClose, PanelLeftOpen, Calculator, Server,
    Trophy, ListFilter, Play, Database, GraduationCap, Map,
    Building2, Mic, Terminal, Network
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';

const navSections = [
    {
        category: 'Overview',
        items: [
            { path: '/dashboard', label: 'Dashboard', subtitle: 'Overview & quick start', icon: LayoutDashboard },
        ]
    },
    {
        category: 'Practice',
        items: [
            { path: '/problems', label: 'Problem Explorer', subtitle: 'Browse & filter problems', icon: ListFilter },
            { path: '/playground', label: 'Playground', subtitle: 'Free-form coding sandbox', icon: Terminal },
            { path: '/visualizer', label: 'Algorithm Visualizer', subtitle: 'Watch algorithms in action', icon: Play },
            { path: '/sql-problems', label: 'SQL Mastery', subtitle: 'Database & query challenges', icon: Database },
            { path: '/aptitude', label: 'Aptitude', subtitle: 'Quant, reasoning & verbal', icon: Calculator },
        ]
    },
    {
        category: 'Learning',
        items: [
            { path: '/dsa-path', label: 'DSA Learning Path', subtitle: 'DSA roadmap & patterns', icon: Map },
            { path: '/technical-path', label: 'Technical Path', subtitle: 'CS & System Design', icon: Server },
            { path: '/hr-path', label: 'HR Path', subtitle: 'Behavioral & Soft Skills', icon: Users },
            { path: '/learning-path', label: 'Aptitude Path', subtitle: 'Formulas & shortcuts', icon: GraduationCap },
            { path: '/ai-tutor', label: 'AI Tutor', subtitle: 'Guided DSA, SQL & aptitude', icon: Sparkles },
            { path: '/system-design', label: 'System Design Mastery', subtitle: 'Architecture & scaling', icon: Network },
        ]
    },
    {
        category: 'Interview',
        items: [
            { path: '/company-prep', label: 'Company Prep', subtitle: 'Real interview Q&A by company', icon: Building2 },
            { path: '/company-interview', label: 'AI Interview', subtitle: 'Mock interviews with AI', icon: Mic },
            { path: '/multi-round-interview', label: 'Full Interview Loop', subtitle: 'Multi-round simulation', icon: Play },
            { path: '/interview-analytics', label: 'Interview Analytics', subtitle: 'Performance trends', icon: BarChart3 },
            { path: '/interview-history', label: 'Interview History', subtitle: 'Past sessions & replays', icon: Clock },
        ]
    },
    {
        category: 'Account',
        items: [
            { path: '/dashboard/analytics', label: 'Analytics', subtitle: 'Track your progress', icon: BarChart3 },
            { path: '/history', label: 'History', subtitle: 'Past sessions & scores', icon: Clock },
            { path: '/profile', label: 'Profile', subtitle: 'Account & preferences', icon: User },
            { path: '/dashboard/settings', label: 'Settings', subtitle: 'App configuration', icon: Settings },
        ]
    },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
    const location = useLocation();
    const { user } = useAuth();
    const userName = user?.fullName || user?.name || 'Engineer';
    const userEmail = user?.email || '';

    return (
        <>
            <div
                className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
                onClick={onMobileClose}
            />
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-brand">
                        <span className="brand-icon">
                            <img src={logo} alt="PrepLoop" className="h-6 w-6 object-contain" />
                        </span>
                        {!collapsed && <span>PrepLoop</span>}
                    </Link>
                    {!collapsed && (
                        <button className="sidebar-toggle desktop-only" onClick={onToggle} title="Collapse Sidebar">
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                    {collapsed && (
                        <button className="sidebar-toggle desktop-only" onClick={onToggle} title="Expand Sidebar" style={{ marginLeft: 0 }}>
                            <PanelLeftOpen size={20} />
                        </button>
                    )}
                    <button className="sidebar-toggle mobile-only" onClick={onMobileClose} title="Close Menu">
                        <PanelLeftClose size={20} />
                    </button>
                </div>



                <nav className="sidebar-nav">
                    {navSections.map((section, sIdx) => (
                        <div key={section.category} className="sidebar-section">
                            {(!collapsed || mobileOpen) && (
                                <div className="sidebar-section-label">{section.category}</div>
                            )}
                            {collapsed && !mobileOpen && sIdx > 0 && (
                                <div className="sidebar-section-divider" />
                            )}
                            {section.items.map(item => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        title={collapsed ? item.label : undefined}
                                        onClick={() => mobileOpen && onMobileClose()}
                                    >
                                        <span className="nav-icon">
                                            <Icon size={20} />
                                        </span>
                                        {(!collapsed || mobileOpen) && (
                                            <div>
                                                <div className="nav-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {item.label}
                                                    {isActive && <ChevronRight size={14} />}
                                                </div>
                                                <div className="nav-subtitle">{item.subtitle}</div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
