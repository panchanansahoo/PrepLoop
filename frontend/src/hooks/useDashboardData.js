import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

    useEffect(() => {
        if (!user || user.isGuest) {
            setData(EMPTY_DATA);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axios.get('/api/user/dashboard');
                if (!cancelled) {
                    setData({ ...EMPTY_DATA, ...res.data });
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                if (!cancelled) {
                    setError(err.message || 'Failed to load dashboard');
                    setData(EMPTY_DATA);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDashboard();

        return () => { cancelled = true; };
    }, [user]);

    return { data, loading, error };
}
