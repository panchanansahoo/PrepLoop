import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 12000;
const dashboardMemoryCache = new Map();

const EMPTY_DATA = {
    stats: { problemsSolved: 0, totalSubmissions: 0, mockInterviews: 0, resumesAnalyzed: 0 },
    streak: 0,
    bestStreak: 0,
    avgScore: 0,
    totalXP: 0,
    heatmapData: {},
    skillBreakdown: { dsa: 0, sql: 0, aptitude: 0, systemDesign: 0, behavioral: 0 },
    topicProgress: [],
    recentActivity: [],
    weeklyGoals: { easy: 0, medium: 0, hard: 0 },
    readinessData: { practiceCount: 0, mockCount: 0, streak: 0, timedSessions: 0 },
    thisWeekProblems: 0,
    lastWeekProblems: 0,
    thisWeekTime: 0,
    lastWeekTime: 0,
    thisWeekXP: 0,
    lastWeekXP: 0,
    currentLevel: 0,
    currentXP: 0,
    nextLevelXP: 0,
    rank: '',
    dailyChallenge: { name: '', type: '', dsa: [], sql: [] },
    upcomingContests: [],
    pomodoroStats: { sessionsToday: 0, sessionsByDate: {} },
};

export default function useDashboardData() {
    const { user } = useAuth();
    const [data, setData] = useState(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = user?.id || null;
    const isGuest = Boolean(user?.isGuest);

    const fetchDashboard = async (force = false) => {
        if (!userId || isGuest) {
            setData(EMPTY_DATA);
            setLoading(false);
            return;
        }

        const cacheKey = `dashboard:${userId}`;
        const now = Date.now();
        let hasFreshCache = false;

        if (!force) {
            const fromMemory = dashboardMemoryCache.get(cacheKey);
            if (fromMemory && now - fromMemory.timestamp < DASHBOARD_CACHE_TTL_MS) {
                setData(fromMemory.data);
                setLoading(false);
                hasFreshCache = true;
            } else {
                try {
                    const raw = sessionStorage.getItem(cacheKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed?.data && now - (parsed.timestamp || 0) < DASHBOARD_CACHE_TTL_MS) {
                            setData(parsed.data);
                            setLoading(false);
                            dashboardMemoryCache.set(cacheKey, parsed);
                            hasFreshCache = true;
                        }
                    }
                } catch {
                    // Ignore corrupt session cache and refetch from API.
                }
            }
        }

        if (hasFreshCache && !force) return () => {};

        const controller = new AbortController();
        
        try {
            if (!hasFreshCache) setLoading(true);
            setError(null);
            const responseData = await apiFetch.get('/api/user/dashboard', {
                timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
                signal: controller.signal,
            });
            const nextData = { ...EMPTY_DATA, ...responseData };
            const payload = { data: nextData, timestamp: Date.now() };
            setData(nextData);
            dashboardMemoryCache.set(cacheKey, payload);
            sessionStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch (err) {
            if (err?.code === 'ERR_CANCELED') {
                return () => {};
            }
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
            if (!hasFreshCache && !force) {
                setData(EMPTY_DATA);
            }
        } finally {
            setLoading(false);
        }
        
        return () => controller.abort();
    };

    useEffect(() => {
        let abortFetch = fetchDashboard();
        return () => {
            abortFetch.then(abort => {
                if (typeof abort === 'function') abort();
            });
        };
    }, [userId, isGuest]);

    const refetch = () => {
        fetchDashboard(true);
    };

    return { data, loading, error, refetch };
}
