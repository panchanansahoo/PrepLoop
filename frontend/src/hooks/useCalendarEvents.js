import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../utils/safeApiUrl';

const STORAGE_KEY = 'preploop_calendar_events';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function buildCalendarApiUrl(path) {
  return buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveToStorage(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export default function useCalendarEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoggedIn = !!user;
  const initialLoadDone = useRef(false);

  // Fetch events on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setEvents(loadFromStorage());
        setLoading(false);
        initialLoadDone.current = true;
        return;
      }

      try {
        const res = await axios.get(buildCalendarApiUrl('/user/calendar-events'));
        if (!cancelled) {
          setEvents(res.data.events || {});
          initialLoadDone.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
        if (!cancelled) {
          setError('Calendar events couldn\'t be loaded. Please try again.');
          setEvents(loadFromStorage());
          initialLoadDone.current = true;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  // Sync to localStorage for guest mode
  useEffect(() => {
    if (!isLoggedIn && initialLoadDone.current) {
      saveToStorage(events);
    }
  }, [events, isLoggedIn]);

  const addEvent = useCallback(async (dateKey, eventData) => {
    const { title, time, tag } = eventData;
    if (!title || !title.trim()) return;

    if (!isLoggedIn) {
      const newEvt = {
        id: Date.now(),
        title: title.trim(),
        time: time || '',
        tag: tag || 'study',
      };
      setEvents(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newEvt]
      }));
      return newEvt;
    }

    try {
      const res = await axios.post(buildCalendarApiUrl('/user/calendar-events'), {
        title: title.trim(),
        date: dateKey,
        time: time || '',
        tag: tag || 'study',
      });
      const newEvt = res.data.event;
      setEvents(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), {
          id: newEvt.id,
          title: newEvt.title,
          time: newEvt.time,
          tag: newEvt.tag,
        }]
      }));
      return newEvt;
    } catch (err) {
      console.error('Failed to add event:', err);
      // Optimistic fallback
      const newEvt = {
        id: Date.now(),
        title: title.trim(),
        time: time || '',
        tag: tag || 'study',
      };
      setEvents(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newEvt]
      }));
      return newEvt;
    }
  }, [isLoggedIn]);

  const updateEvent = useCallback(async (dateKey, eventId, updates) => {
    // Optimistic update
    setEvents(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(e =>
        e.id === eventId ? { ...e, ...updates } : e
      )
    }));

    if (isLoggedIn) {
      try {
        await axios.put(buildCalendarApiUrl(`/user/calendar-events/${eventId}`), updates);
      } catch (err) {
        console.error('Failed to update event:', err);
      }
    }
  }, [isLoggedIn]);

  const deleteEvent = useCallback(async (dateKey, eventId) => {
    const prev = events;
    setEvents(p => ({
      ...p,
      [dateKey]: (p[dateKey] || []).filter(e => e.id !== eventId)
    }));

    if (isLoggedIn) {
      try {
        await axios.delete(buildCalendarApiUrl(`/user/calendar-events/${eventId}`));
      } catch (err) {
        console.error('Failed to delete event:', err);
        setEvents(prev);
      }
    }
  }, [isLoggedIn, events]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    setEvents,
  };
}
