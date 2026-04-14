import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { CalendarPlus, Clock3, Trash2 } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';

const API_URL = import.meta.env.VITE_API_URL || '';

function buildScheduleApiUrl(path) {
  return buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });
}

const initialSlot = { date: '', startTime: '', endTime: '' };

export default function InterviewScheduler() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(initialSlot);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canManageSchedule = useMemo(
    () => user?.role === 'hr' || user?.role === 'admin',
    [user?.role],
  );

  const getHeaders = () => buildAuthHeaders(user);

  const loadSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildScheduleApiUrl('/schedule/my-slots'), {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load slots');
      }
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageSchedule) {
      loadSlots();
    }
  }, [canManageSchedule]);

  const validateSlot = () => {
    if (!slot.date || !slot.startTime || !slot.endTime) {
      return 'Date, start time and end time are required';
    }
    if (slot.endTime <= slot.startTime) {
      return 'End time must be after start time';
    }
    return '';
  };

  const onCreateSlot = async (e) => {
    e.preventDefault();
    const validationError = validateSlot();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(buildScheduleApiUrl('/schedule/slots'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ slots: [slot] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create slot');
      }
      setSlot(initialSlot);
      await loadSlots();
    } catch (err) {
      setError(err.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteSlot = async (id) => {
    setError('');
    try {
      const res = await fetch(buildScheduleApiUrl(`/schedule/slots/${id}`), {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete slot');
      }
      await loadSlots();
    } catch (err) {
      setError(err.message || 'Failed to delete slot');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    const d = new Date(`${value}T00:00:00`);
    return d.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return '--';
    const [h, m] = String(value).split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalized = hour % 12 || 12;
    return `${normalized}:${m || '00'} ${suffix}`;
  };

  if (!canManageSchedule) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Interview Scheduler</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Add your available interview slots. Learners can book only unreserved slots.
      </p>

      {error && (
        <div style={{
          marginBottom: 16,
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(248,113,113,0.4)',
          color: '#fca5a5',
          background: 'rgba(239,68,68,0.1)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={onCreateSlot} style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Date</span>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => setSlot((prev) => ({ ...prev, date: e.target.value }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Start Time</span>
            <input
              type="time"
              value={slot.startTime}
              onChange={(e) => setSlot((prev) => ({ ...prev, startTime: e.target.value }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>End Time</span>
            <input
              type="time"
              value={slot.endTime}
              onChange={(e) => setSlot((prev) => ({ ...prev, endTime: e.target.value }))}
              required
              style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            fontWeight: 600,
            cursor: 'pointer',
            color: 'white',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          }}
        >
          <CalendarPlus size={14} />
          {submitting ? 'Creating...' : 'Create Slot'}
        </button>
      </form>

      <section style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          fontWeight: 600,
        }}>
          Your Upcoming Slots
        </div>

        {loading ? (
          <div style={{ padding: 14, color: 'var(--text-secondary)' }}>Loading slots...</div>
        ) : slots.length === 0 ? (
          <div style={{ padding: 14, color: 'var(--text-secondary)' }}>No slots available yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 0 }}>
            {slots.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{formatDate(item.slot_date)}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Clock3 size={12} />
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    {item.is_booked ? ' • Booked' : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteSlot(item.id)}
                  disabled={item.is_booked}
                  title={item.is_booked ? 'Booked slots cannot be deleted' : 'Delete slot'}
                  style={{
                    border: '1px solid rgba(248,113,113,0.4)',
                    background: item.is_booked ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.1)',
                    color: item.is_booked ? 'var(--text-secondary)' : '#fca5a5',
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: item.is_booked ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
