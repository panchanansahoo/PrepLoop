import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Brain, BookOpen,
    Grid3X3, FileText, Code, Users,
    ChevronLeft, ChevronRight, Sparkles,
    CalendarDays, BarChart3, Clock, Settings, User,
    PanelLeftClose, PanelLeftOpen, Calculator, Server,
    Trophy, ListFilter, Play, Database, GraduationCap, Map,
    Building2, Mic, Terminal, Network, ShieldCheck, Briefcase
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import FeedbackModal from './FeedbackModal';

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
            { path: '/quiz-arena', label: 'Quiz Arena', subtitle: 'Topic quizzes and leaderboard', icon: Trophy },
            { path: '/playground', label: 'Playground', subtitle: 'Free-form coding sandbox', icon: Terminal },
            { path: '/visualizer', label: 'Algorithm Visualizer', subtitle: 'Watch algorithms in action', icon: Play },
            { path: '/system-design-sim', label: 'Design Simulator', subtitle: 'Build architectures visually', icon: Network },
            { path: '/sql-problems', label: 'SQL Mastery', subtitle: 'Database & query challenges', icon: Database },
            { path: '/aptitude', label: 'Aptitude', subtitle: 'Quant, reasoning & verbal', icon: Calculator },
            { path: '/exam-hub', label: 'Exam Practice', subtitle: 'TCS NQT, Cognizant & more', icon: FileText },
            { path: '/daily-challenges', label: 'Daily Challenges', subtitle: 'Company-wise daily problems', icon: Trophy },
        ]
    },
    {
        category: 'AI Features',
        items: [
            { path: '/advanced-learning-path', label: 'AI Advanced Roadmap', subtitle: 'Timeline planner & exports', icon: Sparkles },
        ]
    },
    {
        category: 'Learning',
        items: [
            { path: '/dsa-path', label: 'DSA Learning Path', subtitle: 'DSA roadmap & patterns', icon: GraduationCap },
            { path: '/technical-path', label: 'Technical Path', subtitle: 'CS & System Design', icon: Server },
            { path: '/library', label: 'Library', subtitle: 'Books, guides & resources', icon: BookOpen },
            { path: '/hr-path', label: 'HR Path', subtitle: 'Behavioral & Soft Skills', icon: Users },
            { path: '/learning-path', label: 'Aptitude Path', subtitle: 'Formulas & shortcuts', icon: GraduationCap },
            { path: '/ai-tutor', label: 'AI Tutor', subtitle: 'Guided DSA, SQL & aptitude', icon: Sparkles },
            { path: '/system-design', label: 'System Design Mastery', subtitle: 'Architecture & scaling', icon: Network },
        ]
    },
    {
        category: 'Interview',
        items: [
            { path: '/interview-hub', label: 'Interview Hub', subtitle: 'All-in-one interview suite', icon: Grid3X3 },
            { path: '/company-prep', label: 'Company Prep', subtitle: 'Real interview Q&A by company', icon: Building2 },
            { path: '/company-interview', label: 'AI Interview', subtitle: 'Mock interviews with AI', icon: Mic },
            { path: '/resume-analyzer', label: 'Resume Analysis', subtitle: 'ATS score and resume feedback', icon: FileText },
            { path: '/multi-round-interview', label: 'Full Interview Loop', subtitle: 'Multi-round simulation', icon: Play },
            { path: '/interview-analytics', label: 'Interview Analytics', subtitle: 'Performance trends', icon: BarChart3 },
            { path: '/interview-history', label: 'Interview History', subtitle: 'Past sessions & replays', icon: Clock },
        ]
    },
    {
        category: 'Career',
        items: [
            { path: '/job-updates', label: 'Job Updates', subtitle: 'Latest jobs & internships', icon: Briefcase },
            { path: '/community', label: 'Community Hub', subtitle: 'Connect & discuss', icon: MessageSquare },
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
    const { user, isAdmin } = useAuth();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const isCollapsed = collapsed && !mobileOpen;
    const userName = user?.fullName || user?.name || 'Engineer';
    const userEmail = user?.email || '';

    // Build nav sections dynamically based on role
    const sections = [...navSections];
    if (isAdmin) {
        // Insert Admin section before Account
        sections.splice(sections.length - 1, 0, {
            category: 'Admin',
            items: [
                { path: '/admin', label: 'Admin Dashboard', subtitle: 'Manage users & content', icon: ShieldCheck },
                { path: '/admin/library', label: 'Library Manager', subtitle: 'Manage library books', icon: BookOpen },
            ]
        });
    }

    return (
        <>
            <div
                className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
                onClick={onMobileClose}
            />
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-brand">
                        <span className="brand-icon">
                            <img src={logo} alt="PrepLoop" className="h-8 w-8 object-contain" />
                        </span>
                        {!isCollapsed && <span>PrepLoop</span>}
                    </Link>
                    {!isCollapsed && (
                        <button className="sidebar-toggle desktop-only" onClick={onToggle} title="Collapse Sidebar">
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                    {isCollapsed && (
                        <button className="sidebar-toggle desktop-only" onClick={onToggle} title="Expand Sidebar" style={{ marginLeft: 0 }}>
                            <PanelLeftOpen size={20} />
                        </button>
                    )}
                    <button className="sidebar-toggle mobile-only" onClick={onMobileClose} title="Close Menu">
                        <PanelLeftClose size={20} />
                    </button>
                </div>



                <nav className="sidebar-nav">
                    {sections.map((section, sIdx) => (
                        <div key={section.category} className="sidebar-section">
                            {(!isCollapsed || mobileOpen) && (
                                <div className="sidebar-section-label">{section.category}</div>
                            )}
                            {isCollapsed && !mobileOpen && sIdx > 0 && (
                                <div className="sidebar-section-divider" />
                            )}
                            {section.items.map(item => {
                                if (item.roles && !item.roles.includes(user?.role)) {
                                    return null;
                                }

                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        title={isCollapsed ? item.label : undefined}
                                        onClick={() => mobileOpen && onMobileClose()}
                                    >
                                        <span className="nav-icon">
                                            <Icon size={20} />
                                        </span>
                                        {(!isCollapsed || mobileOpen) && (
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

                <div className="sidebar-footer" style={{ padding: isCollapsed && !mobileOpen ? '16px 8px' : '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: 'auto' }}>
                    <div onClick={() => setIsFeedbackModalOpen(true)} style={{ textDecoration: 'none', display: 'block' }}>
                        <div 
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: isCollapsed && !mobileOpen ? '8px 0' : '8px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '2px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))';
                                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            {isCollapsed && !mobileOpen ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%' }}>
                                    <MessageSquare size={16} color="#38bdf8" />
                                    <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 600 }}>+10</span>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                        <MessageSquare size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, lineHeight: 1 }}>
                                            Help us improve PrepLoop (30s)
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', paddingLeft: '20px' }}>
                                        <span style={{ fontSize: '10px', color: '#eab308', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1 }}>
                                            +10 coins
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
        </>
    );
}
