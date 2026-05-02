import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllContests } from '../utils/contestUtils';
import { apiFetch } from '../utils/apiFetch';

const NOTIF_CACHE_KEY = 'user_notifications_read';
const LAST_DAILY_CHALLENGE_DATE_KEY = 'last_daily_challenge_date';

export function useNotifications(user) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    // Load read notification IDs from local storage
    const getReadIds = () => {
        try {
            return JSON.parse(localStorage.getItem(NOTIF_CACHE_KEY)) || [];
        } catch {
            return [];
        }
    };

    const markAsRead = (id) => {
        const readIds = getReadIds();
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(readIds));
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        }
    };

    const markAllAsRead = () => {
        const readIds = getReadIds();
        const newReadIds = [...readIds];

        notifications.forEach(n => {
            if (!newReadIds.includes(n.id)) {
                newReadIds.push(n.id);
            }
        });

        localStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(newReadIds));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const fetchNotifications = useCallback(async (signal) => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const generatedNotifs = [];
        const readIds = getReadIds();

        // 1. Daily Challenge Notification
        const todayStr = new Date().toDateString();
        const lastChallengeDate = localStorage.getItem(LAST_DAILY_CHALLENGE_DATE_KEY);

        // Generate one if haven't generated one today
        const dailyId = `daily-${todayStr}`;
        generatedNotifs.push({
            id: dailyId,
            type: 'daily',
            title: '🎯 New daily challenge available!',
            timeText: 'Today',
            isRead: readIds.includes(dailyId) || lastChallengeDate === todayStr,
            link: '/dashboard',
        });

        // 2. Upcoming Contests (starting within 48 hours)
        try {
            const allContests = await fetchAllContests();
            if (signal?.aborted) return;

            const now = new Date();
            const comingSoon = allContests.filter(c => {
                const diffHrs = (c.date - now) / 3600000;
                return diffHrs > 0 && diffHrs <= 48; // starting within 48 hours
            });

            comingSoon.forEach(c => {
                const contestId = `contest-${c.name.replace(/\s+/g, '-')}`;
                generatedNotifs.push({
                    id: contestId,
                    type: 'contest',
                    title: `🏆 ${c.name} on ${c.platform} is starting soon!`,
                    timeText: c.date.toLocaleDateString(),
                    isRead: readIds.includes(contestId),
                    link: c.link,
                    external: true
                });
            });
        } catch (e) {
            console.error('Failed to fetch contests for notifications', e);
        }

        // 3. New Blogs (posted in last 7 days) — uses centralized client for auth+retry
        try {
            if (signal?.aborted) return;
            const blogs = await apiFetch.get('/api/blog', { signal });

            const now = new Date();
            if (Array.isArray(blogs)) {
                blogs.forEach(b => {
                    const blogDate = new Date(b.created_at);
                    const diffDays = (now - blogDate) / (1000 * 60 * 60 * 24);
                    if (diffDays <= 7) {
                        const blogId = `blog-${b.slug || b.id}`;
                        generatedNotifs.push({
                            id: blogId,
                            type: 'blog',
                            title: `📝 New Article: ${b.title}`,
                            timeText: blogDate.toLocaleDateString(),
                            isRead: readIds.includes(blogId),
                            link: `/blog/${b.slug || b.id}`,
                        });
                    }
                });
            }
        } catch (e) {
            // Ignore abort errors
            if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return;
            console.error('Failed to fetch blogs for notifications', e);
        }

        // Sort notifications: unread first, then by type/date logic (currently just leaving as is)
        if (mountedRef.current && !signal?.aborted) {
            setNotifications(generatedNotifs);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        mountedRef.current = true;
        const controller = new AbortController();

        fetchNotifications(controller.signal);

        return () => {
            mountedRef.current = false;
            controller.abort();
        };
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
}
