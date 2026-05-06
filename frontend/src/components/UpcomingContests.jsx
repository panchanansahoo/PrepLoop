import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchAllContests } from '../utils/contestUtils';

const PLATFORM_META = {
    LeetCode: { color: '#f59e0b', icon: '🏆', link: 'https://leetcode.com/contest/' },
    Codeforces: { color: '#ef4444', icon: '⚔️', link: 'https://codeforces.com/contests' },
    CodeChef: { color: '#22c55e', icon: '🍳', link: 'https://www.codechef.com/contests' },
    AtCoder: { color: '#38bdf8', icon: '🎌', link: 'https://atcoder.jp/contests/' },
    GeeksforGeeks: { color: '#10b981', icon: '📗', link: 'https://practice.geeksforgeeks.org/events' },
};

const CACHE_KEY = 'upcoming_contests_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedContests() {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return cache.contests.map(c => ({ ...c, date: new Date(c.date) }));
        }
    } catch { /* ignore */ }
    return null;
}

function setCachedContests(contests) {
    try {
        const serialized = contests.map(c => ({ ...c, date: c.date instanceof Date ? c.date.toISOString() : c.date }));
        localStorage.setItem(CACHE_KEY, JSON.stringify({ contests: serialized, timestamp: Date.now() }));
    } catch { /* ignore */ }
}

// ── Formatting helpers ──

function formatDate(date) {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d)) return '—';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
    } catch { return '—'; }
}

function formatTime(date) {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d)) return '';
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    } catch { return ''; }
}

function getDaysUntil(date) {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d)) return '—';
        const now = new Date();
        const diffMs = d - now;
        if (diffMs < 0) return 'Ongoing';
        const diffH = Math.floor(diffMs / 3600000);
        if (diffH < 1) return 'Starting soon';
        if (diffH < 24) return `${diffH}h left`;
        const diffD = Math.ceil(diffMs / 86400000);
        if (diffD === 1) return 'Tomorrow';
        return `${diffD} days`;
    } catch { return '—'; }
}

function getLastRefreshLabel(timestamp) {
    if (!timestamp) return '';
    const ago = Math.floor((Date.now() - timestamp) / 60000);
    if (ago < 1) return 'Just now';
    if (ago < 60) return `${ago}m ago`;
    const hours = Math.floor(ago / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ── Main component ──

export default function UpcomingContests({ contests: contestsFromDashboard }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const hasDashboardContests = Array.isArray(contestsFromDashboard) && contestsFromDashboard.length > 0;

    const fetchAll = useCallback(async (force = false) => {
        if (!force) {
            const cached = getCachedContests();
            if (cached) {
                setContests(cached);
                setLoading(false);
                try {
                    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
                    setLastRefresh(c?.timestamp);
                } catch { /* ignore */ }
                return;
            }
        }

        setLoading(true);
        try {
            const all = await fetchAllContests();
            const sorted = all.slice(0, 8);
            setContests(sorted);
            setCachedContests(sorted);
            setLastRefresh(Date.now());
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (hasDashboardContests) {
            setContests(contestsFromDashboard.map((item) => ({
                ...item,
                date: item.date instanceof Date ? item.date : new Date(item.date),
            })));
            setLoading(false);
            setLastRefresh(Date.now());
            return undefined;
        }

        fetchAll();
        const interval = setInterval(() => {
            const cache = getCachedContests();
            if (!cache) fetchAll(true);
        }, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAll, hasDashboardContests, contestsFromDashboard]);

    const handleRefresh = () => {
        if (hasDashboardContests) return;
        localStorage.removeItem(CACHE_KEY);
        fetchAll(true);
    };

    // Theme-aware colors
    const colors = isLight ? {
        cardBg: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
        cardBorder: '1px solid rgba(15, 23, 42, 0.08)',
        titleColor: '#1a1d2e',
        subtitleColor: '#8b8fa6',
        itemBg: 'rgba(255,255,255,0.6)',
        itemBorder: '1px solid rgba(15, 23, 42, 0.05)',
        itemHoverBg: 'rgba(255,255,255,1)',
        itemHoverBorder: 'rgba(99,102,241,0.25)',
        nameColor: '#1a1d2e',
        metaColor: '#6b7089',
        dateColor: '#8b8fa6',
        btnBg: 'rgba(99,102,241,0.06)',
        btnBorder: '1px solid rgba(99,102,241,0.12)',
        btnColor: '#5c6078',
        btnHoverBg: 'rgba(99,102,241,0.1)',
        btnHoverColor: '#4f46e5',
        skeletonBg: 'rgba(99,102,241,0.06)',
        liveBg: 'rgba(34,197,94,0.1)',
        liveColor: '#059669',
        apiBg: 'rgba(239,68,68,0.08)',
        apiColor: '#dc2626',
        scrollThumb: 'rgba(99,102,241,0.12)',
        scrollThumbHover: 'rgba(99,102,241,0.2)',
    } : {
        cardBg: 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        cardBorder: '1px solid rgba(255, 255, 255, 0.08)',
        titleColor: '#fff',
        subtitleColor: 'rgba(255,255,255,0.4)',
        itemBg: 'rgba(255,255,255,0.02)',
        itemBorder: '1px solid rgba(255,255,255,0.03)',
        itemHoverBg: 'rgba(255,255,255,0.06)',
        itemHoverBorder: 'rgba(255,255,255,0.15)',
        nameColor: '#fff',
        metaColor: 'rgba(255,255,255,0.4)',
        dateColor: 'rgba(255,255,255,0.3)',
        btnBg: 'rgba(255,255,255,0.05)',
        btnBorder: '1px solid rgba(255,255,255,0.08)',
        btnColor: 'rgba(255,255,255,0.5)',
        btnHoverBg: 'rgba(255,255,255,0.1)',
        btnHoverColor: '#fff',
        skeletonBg: 'rgba(255,255,255,0.03)',
        liveBg: 'rgba(34,197,94,0.15)',
        liveColor: '#22c55e',
        apiBg: 'rgba(239,68,68,0.15)',
        apiColor: '#ef4444',
        scrollThumb: 'rgba(255,255,255,0.1)',
        scrollThumbHover: 'rgba(255,255,255,0.2)',
    };

    return (
        <div style={{
            background: colors.cardBg, borderRadius: 24,
            border: colors.cardBorder, padding: '24px 28px',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.titleColor, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🏅 Upcoming Contests
                        <span style={{
                            fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                            background: colors.liveBg, color: colors.liveColor, letterSpacing: 0.5,
                        }}>LIVE</span>
                    </div>
                    <div style={{ fontSize: 11, color: colors.subtitleColor }}>
                        Auto-updates daily · {lastRefresh ? `Refreshed ${getLastRefreshLabel(lastRefresh)}` : 'Loading...'}
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading || hasDashboardContests}
                    title="Refresh contests"
                    style={{
                        background: colors.btnBg, border: colors.btnBorder,
                        borderRadius: 8, padding: '6px 10px', cursor: loading ? 'not-allowed' : 'pointer',
                        color: colors.btnColor, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!loading && !hasDashboardContests) { e.currentTarget.style.background = colors.btnHoverBg; e.currentTarget.style.color = colors.btnHoverColor; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = colors.btnBg; e.currentTarget.style.color = colors.btnColor; }}
                >
                    <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
                    {hasDashboardContests ? 'DB Data' : (loading ? 'Updating…' : 'Refresh')}
                </button>
            </div>

            {/* Loading skeleton */}
            {loading && contests.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            height: 56, borderRadius: 12, background: colors.skeletonBg,
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            )}

            {/* Contest List */}
            {contests.length > 0 && (
                <div className="contests-scroll" style={{
                    display: 'flex', flexDirection: 'column', gap: 10,
                    maxHeight: 5 * 66 + 4 * 10,
                    overflowY: 'auto',
                    paddingRight: contests.length > 5 ? 4 : 0,
                }}>
                    {contests.map((contest, i) => {
                        const meta = PLATFORM_META[contest.platform] || { color: '#94a3b8', icon: '📌', link: '#' };
                        const contestRowStyle = {
                                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                                borderRadius: 16, background: colors.itemBg,
                                border: colors.itemBorder, textDecoration: 'none',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer', flexShrink: 0,
                            };

                        const onEnter = (e) => { 
                            e.currentTarget.style.background = colors.itemHoverBg; 
                            e.currentTarget.style.borderColor = colors.itemHoverBorder; 
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = isLight ? '0 8px 24px rgba(0,0,0,0.06)' : '0 12px 32px rgba(0,0,0,0.3)';
                        };
                        const onLeave = (e) => { 
                            e.currentTarget.style.background = colors.itemBg; 
                            e.currentTarget.style.borderColor = colors.itemBorder.split(' ').pop(); 
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                        };

                        if (!contest.link) {
                            return (
                                <div key={i} style={contestRowStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                                    {/* Platform Icon */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                        background: `${meta.color}15`, flexShrink: 0,
                                    }}>{meta.icon}</div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 600, color: colors.nameColor, marginBottom: 2,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            {contest.name}
                                            {contest.live && (
                                                <span style={{
                                                    fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                                    background: colors.apiBg, color: colors.apiColor, letterSpacing: 0.3,
                                                }}>API</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: colors.metaColor }}>
                                            {contest.platform} · {contest.duration} · {formatTime(contest.date)}
                                        </div>
                                    </div>

                                    {/* Countdown */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{getDaysUntil(contest.date)}</div>
                                        <div style={{ fontSize: 10, color: colors.dateColor, marginTop: 1 }}>{formatDate(contest.date)}</div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <a key={i} href={contest.link} target="_blank" rel="noreferrer" style={contestRowStyle}
                                onMouseEnter={onEnter}
                                onMouseLeave={onLeave}
                            >
                                {/* Platform Icon */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                    background: `${meta.color}15`, flexShrink: 0,
                                }}>{meta.icon}</div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600, color: colors.nameColor, marginBottom: 2,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        {contest.name}
                                        {contest.live && (
                                            <span style={{
                                                fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                                background: colors.apiBg, color: colors.apiColor, letterSpacing: 0.3,
                                            }}>API</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 11, color: colors.metaColor }}>
                                        {contest.platform} · {contest.duration} · {formatTime(contest.date)}
                                    </div>
                                </div>

                                {/* Countdown */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{getDaysUntil(contest.date)}</div>
                                    <div style={{ fontSize: 10, color: colors.dateColor, marginTop: 1 }}>{formatDate(contest.date)}</div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.15; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .contests-scroll::-webkit-scrollbar { width: 4px; }
                .contests-scroll::-webkit-scrollbar-track { background: transparent; }
                .contests-scroll::-webkit-scrollbar-thumb { background: ${colors.scrollThumb}; border-radius: 4px; }
                .contests-scroll::-webkit-scrollbar-thumb:hover { background: ${colors.scrollThumbHover}; }
            `}</style>
        </div>
    );
}
