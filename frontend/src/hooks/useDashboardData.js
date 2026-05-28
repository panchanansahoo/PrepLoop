import { useState, useEffect, useCallback } from 'react';
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
    dailyChallenge: { name: '', type: '', dsa: [], sql: [] },
    upcomingContests: [],
    pomodoroStats: { sessionsToday: 0, sessionsByDate: {} },
};

export default function useDashboardData() {
    const { user } = useAuth();
    const [data, setData] = useState(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const userId = user?.id || null;
    const isGuest = Boolean(user?.isGuest);

    const refresh = useCallback(() => {
        if (!userId) return;
        const cacheKey = `dashboard:${userId}`;
        dashboardMemoryCache.delete(cacheKey);
        try { sessionStorage.removeItem(cacheKey); } catch { /* no-op */ }
        setRefreshTick(t => t + 1);
    }, [userId]);

    useEffect(() => {
        if (!userId || isGuest) {
            // Provide demo data so guests see a populated dashboard
            const demoHeatmap = {};
            const today = new Date();
            for (let i = 0; i < 90; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                // Vary activity: recent days more active, some gaps
                if (i % 7 === 6) continue; // skip some Sundays
                demoHeatmap[key] = Math.max(0, Math.floor(Math.random() * 5) + (i < 15 ? 2 : 0));
            }

            setData({
                stats: { problemsSolved: 147, totalSubmissions: 312, mockInterviews: 12, resumesAnalyzed: 3 },
                streak: 15,
                bestStreak: 28,
                avgScore: 78,
                totalXP: 4250,
                heatmapData: demoHeatmap,
                skillBreakdown: { dsa: 72, sql: 58, aptitude: 65, systemDesign: 45, behavioral: 80 },
                topicProgress: [
                    { topic: 'Arrays', solved: 28, total: 40 },
                    { topic: 'Trees', solved: 15, total: 30 },
                    { topic: 'Dynamic Programming', solved: 10, total: 35 },
                    { topic: 'Graphs', solved: 8, total: 25 },
                ],
                recentActivity: [
                    { type: 'problem', title: 'Two Sum', difficulty: 'Easy', score: 100, timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { type: 'interview', title: 'Google Frontend Mock', difficulty: 'Medium', score: 82, timestamp: new Date(Date.now() - 86400000).toISOString() },
                    { type: 'problem', title: 'LRU Cache', difficulty: 'Hard', score: 90, timestamp: new Date(Date.now() - 172800000).toISOString() },
                    { type: 'quiz', title: 'JavaScript Fundamentals', difficulty: 'Medium', score: 88, timestamp: new Date(Date.now() - 259200000).toISOString() },
                ],
                weeklyGoals: { easy: 5, medium: 3, hard: 1 },
                readinessData: { practiceCount: 147, mockCount: 12, streak: 15, timedSessions: 34 },
                thisWeekProblems: 18,
                lastWeekProblems: 14,
                thisWeekTime: 720,
                lastWeekTime: 540,
                thisWeekXP: 450,
                lastWeekXP: 380,
                currentLevel: 8,
                currentXP: 4250,
                nextLevelXP: 5000,
                rank: 'Silver',
                dailyChallenge: {
                    name: 'Amazon',
                    type: 'company',
                    dsa: [
                        { title: 'Maximum Subarray', difficulty: 'Medium', slug: 'maximum-subarray' },
                        { title: 'Merge Intervals', difficulty: 'Medium', slug: 'merge-intervals' },
                    ],
                    sql: [
                        { title: 'Department Highest Salary', difficulty: 'Medium', slug: 'department-highest-salary' },
                    ],
                },
                upcomingContests: [
                    { platform: 'LeetCode', name: 'Weekly Contest 412', startTime: new Date(Date.now() + 172800000).toISOString(), url: '#' },
                    { platform: 'Codeforces', name: 'Codeforces Round #920', startTime: new Date(Date.now() + 345600000).toISOString(), url: '#' },
                ],
                pomodoroStats: { sessionsToday: 3, sessionsByDate: {} },
            });
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
    }, [userId, isGuest, refreshTick]);

    return { data, loading, error, refresh };
}
