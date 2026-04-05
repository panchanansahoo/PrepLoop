import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PROBLEMS } from '../data/problemsDatabase';
import {
  Search, Bell, Menu, X, ChevronRight, User, LogOut,
  Settings, Sparkles, Crown, Command, TrendingUp,
  Award, ChevronDown, Sun, Moon, ShieldCheck, Briefcase, Home
} from 'lucide-react';

import logo from '../assets/logo.svg';
import { useNotifications } from '../hooks/useNotifications';
import CoinDisplay from './CoinDisplay';

// Page title mapping for breadcrumb
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/roadmap': 'Roadmap',
  '/problems': 'Problem Explorer',
  '/code-editor': 'Code Editor',
  '/playground': 'Playground',
  '/visualizer': 'Algorithm Visualizer',
  '/sql-problems': 'SQL Mastery',
  '/aptitude': 'Aptitude',
  '/dsa-path': 'DSA Learning Path',
  '/learning-path': 'Aptitude Path',
  '/advanced-learning-path': 'AI Advanced Roadmap',
  '/ai-tutor': 'AI Tutor',
  '/company-prep': 'Company Prep',
  '/company-interview': 'AI Interview',
  '/multi-round-interview': 'Full Interview Loop',
  '/interview-analytics': 'Interview Analytics',
  '/interview-history': 'Interview History',
  '/job-updates': 'Job Updates',
  '/profile': 'Profile',
  '/history': 'History',
  '/wallet': 'Coin Wallet',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'Dashboard';
}

function getBreadcrumbItems(pathname) {
  if (pathname === '/roadmap') {
      return [
        { label: 'Home', to: '/dashboard', icon: 'home' },
        { label: 'Roadmap', to: '/roadmap' },
      ];
  }

  if (pathname.startsWith('/roadmap/')) {
    const roadmapLabels = {
      '/roadmap/dsa': 'DSA',
      '/roadmap/language': 'Language',
      '/roadmap/system-design': 'System Design',
      '/roadmap/web-dev': 'Web Dev',
    };

    const currentLabel = roadmapLabels[pathname];
    if (currentLabel) {
      return [
        { label: 'Home', to: '/dashboard', icon: 'home' },
        { label: 'Roadmap', to: '/roadmap' },
        { label: currentLabel, to: pathname },
      ];
    }
  }

  if (pathname === '/advanced-learning-path') {
    return [
      { label: 'Home', to: '/dashboard', icon: 'home' },
      { label: 'Aptitude Path', to: '/learning-path' },
      { label: 'AI Advanced Roadmap', to: '/advanced-learning-path' },
    ];
  }

  return null;
}

export default function Navbar({ hasSidebar, onMobileMenuToggle }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        setSearchQuery('');
        setSearchFocused(false);
        setIsDropdownOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when public mobile menu is open.
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search filtering
  const searchResults = searchQuery.trim().length >= 2
    ? PROBLEMS.filter(p => {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q)
        || p.topics.some(t => t.toLowerCase().includes(q))
        || p.difficulty.toLowerCase().includes(q);
    }).slice(0, 8)
    : [];

  const handleSearchSelect = (problem) => {
    setSearchQuery('');
    setSearchFocused(false);
    searchInputRef.current?.blur();
    navigate(`/code-editor/${problem.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return '?';
    const name = user.fullName || user.email || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Define public paths that should show the public navbar
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/blog', '/about', '/contact', '/verify-email', '/dsa-patterns', '/library'];
  const isPublicPage = publicPaths.includes(location.pathname);

  // Render Public Navbar if not logged in OR if on a public page
  if (!user || isPublicPage) {
    return (
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <Link to="/" className="nav-brand">
            <div className="brand-logo">
              <img src={logo} alt="PrepLoop" className="h-8 w-8 object-contain" style={{ width: '32px', height: '32px' }} />
            </div>
            <span className="brand-text">PrepLoop</span>
          </Link>

          {/* Desktop Nav */}
          <div className="nav-links desktop-only">
            <a href="/#features" className="nav-link">Features</a>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/problems" className="nav-link">Problem Explorer</Link>
            <Link to="/company-interview" className="nav-link">AI Mock</Link>
            <Link to="/job-updates" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> Jobs</Link>
            <Link to="/blog" className="nav-link">Blog</Link>
          </div>

          <div className="nav-actions desktop-only">
            <button
              className="icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary glow-effect">
                Go to Dashboard <ChevronRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <Link to="/signup" className="btn btn-primary glow-effect">
                  Get Started <ChevronRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="/#features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <Link to="/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/problems" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Problem Explorer</Link>
            <Link to="/company-interview" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>AI Mock</Link>
            <Link to="/job-updates" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Job Updates</Link>
            <Link to="/blog" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>
    );
  }

  // ─── Premium Dashboard Navbar ───
  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbItems = getBreadcrumbItems(location.pathname);
  const userTier = 'Free'; // or 'Pro'

  return (
    <div className="navbar navbar-dashboard premium-topbar">
      <div className="premium-topbar-inner">

        {/* Left: Mobile menu + Page title */}
          <div className="topbar-left">
            <button
              className="icon-btn mobile-only"
              onClick={onMobileMenuToggle}
            >
            <Menu size={22} />
          </button>

          <div className="topbar-page-info desktop-only">
            {breadcrumbItems ? (
              <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1;
                  return (
                    <React.Fragment key={item.to}>
                      {index > 0 ? <ChevronRight size={13} className="topbar-breadcrumb-separator" /> : null}
                      {isLast ? (
                        <span className="topbar-breadcrumb-current">{item.label}</span>
                      ) : (
                        <Link
                          to={item.to}
                          className={`topbar-breadcrumb-link ${item.icon ? 'is-icon' : ''}`}
                          aria-label={item.label}
                          title={item.label}
                        >
                          {item.icon === 'home' ? <Home size={14} /> : item.label}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            ) : (
              <h2 className="topbar-page-title">{pageTitle}</h2>
            )}
          </div>
        </div>

        {/* Right: All premium actions */}
        <div className="topbar-right">

          {/* Enhanced Search */}
          <div className={`premium-search ${searchFocused ? 'focused' : ''} desktop-only`} ref={searchContainerRef}>
            <Search size={15} className="premium-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search problems, topics..."
              className="premium-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            {!searchQuery && <kbd className="premium-search-kbd">Ctrl K</kbd>}

            {/* Search Results Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="search-results-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map(p => (
                    <div
                      key={p.id}
                      className="search-result-item"
                      onMouseDown={() => handleSearchSelect(p)}
                    >
                      <div className="search-result-main">
                        <span className="search-result-title">{p.title}</span>
                        <span className={`search-result-diff diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                      </div>
                      <div className="search-result-topics">
                        {p.topics.slice(0, 3).map(t => (
                          <span key={t} className="search-result-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-no-results">No problems found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          {/* Coin Balance */}
          <div className="desktop-only">
            <CoinDisplay />
          </div>

          {/* Theme Toggle */}
          <button
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              className="icon-btn notif-btn"
              onClick={() => { setIsNotifOpen(!isNotifOpen); setIsDropdownOpen(false); }}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {isNotifOpen && (
              <div className="premium-dropdown notif-dropdown">
                <div className="premium-dropdown-header">
                  <span>Notifications</span>
                  <button className="premium-dropdown-action" onClick={markAllAsRead}>Mark all read</button>
                </div>
                <div className="notif-list">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.external) {
                            window.open(notif.link, '_blank');
                          } else {
                            navigate(notif.link);
                            setIsNotifOpen(false);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {!notif.isRead && <div className="notif-dot" />}
                        <div>
                          <p className="notif-text">{notif.title}</p>
                          <span className="notif-time">{notif.timeText}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notif-item">
                      <div>
                        <p className="notif-text" style={{ color: 'var(--zinc-500)' }}>No new notifications</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upgrade to Pro */}
          {userTier === 'Free' && (
            <Link to="/pricing" className="upgrade-btn desktop-only">
              <Crown size={14} />
              <span>Upgrade</span>
            </Link>
          )}

          {/* Premium Avatar */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="premium-avatar-btn"
              title={user.fullName}
              onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
            >
              <div className="premium-avatar">
                {getInitials()}
                <span className="avatar-status-dot" />
              </div>
              <ChevronDown size={14} className={`avatar-chevron ${isDropdownOpen ? 'open' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="premium-dropdown user-dropdown">
                {/* User header */}
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    {getInitials()}
                  </div>
                  <div className="user-dropdown-info">
                    <p className="user-dropdown-name">{user.fullName}</p>
                    <p className="user-dropdown-email">{user.email}</p>
                  </div>
                  <span className={`user-tier-badge ${userTier === 'Pro' ? 'pro' : 'free'}`}>
                    {userTier === 'Pro' ? <><Crown size={10} /> Pro</> : 'Free'}
                  </span>
                </div>

                {/* Links */}
                <div className="user-dropdown-links">
                  <Link to="/profile" className="user-dropdown-link">
                    <User size={16} />
                    My Profile
                  </Link>
                  <Link to="/dashboard/analytics" className="user-dropdown-link">
                    <TrendingUp size={16} />
                    Analytics
                  </Link>
                  <Link to="/dashboard/settings" className="user-dropdown-link">
                    <Settings size={16} />
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="user-dropdown-link" style={{ color: 'var(--accent)' }}>
                      <ShieldCheck size={16} />
                      Admin Panel
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <div className="user-dropdown-footer">
                  <button onClick={handleLogout} className="user-dropdown-logout">
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
