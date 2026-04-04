import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
};

export default function useDashboardData() {
    const { user } = useAuth();
    const [data, setData] = useState(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = user?.id || null;
    const isGuest = Boolean(user?.isGuest);

    useEffect(() => {
        if (!userId || isGuest) {
            setData(EMPTY_DATA);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const cacheKey = `dashboard:${userId}`;
        const now = Date.now();

        const fromMemory = dashboardMemoryCache.get(cacheKey);
        let hasFreshCache = false;

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

        const controller = new AbortController();

        const fetchDashboard = async () => {
            try {
                if (!hasFreshCache) setLoading(true);
                setError(null);
                const res = await axios.get('/api/user/dashboard', {
                    timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
                    signal: controller.signal,
                });
                if (!cancelled) {
                    const nextData = { ...EMPTY_DATA, ...res.data };
                    const payload = { data: nextData, timestamp: Date.now() };
                    setData(nextData);
                    dashboardMemoryCache.set(cacheKey, payload);
                    sessionStorage.setItem(cacheKey, JSON.stringify(payload));
                }
            } catch (err) {
                if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') {
                    return;
                }
                console.error('Dashboard fetch error:', err);
                if (!cancelled) {
                    setError(err.message || 'Failed to load dashboard');
                    if (!hasFreshCache) {
                        setData(EMPTY_DATA);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDashboard();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [userId, isGuest]);

    return { data, loading, error };
}
