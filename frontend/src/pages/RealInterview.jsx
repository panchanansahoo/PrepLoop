import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, ChevronRight, Star, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RealInterview() {
  const { user } = useAuth();
  const [tab, setTab] = useState('slots'); // 'slots' | 'bookings'
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState(null);

  const getHeaders = () => buildAuthHeaders(user);
  const buildInterviewApiUrl = (path) => buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });

  useEffect(() => {
    loadSlots();
    loadBookings();
  }, []);

  const loadSlots = async (date = '') => {
    setLoading(true);
    try {
      const baseSlotsUrl = buildInterviewApiUrl('/real-interview/slots');
      const url = date ? `${baseSlotsUrl}?date=${encodeURIComponent(date)}` : baseSlotsUrl;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) setSlots(await res.json());
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await fetch(buildInterviewApiUrl('/real-interview/my-bookings'), { headers: getHeaders() });
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const bookSlot = async (slotId) => {
    setBookingSlot(slotId);
    try {
      const res = await fetch(buildInterviewApiUrl('/real-interview/book'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (res.ok) {
        loadSlots(selectedDate);
        loadBookings();
        alert('Interview booked successfully! 🎉');
      } else {
        alert(data.error || 'Failed to book slot');
      }
    } catch (err) {
      alert('Failed to book interview');
    } finally {
      setBookingSlot(null);
    }
  };

  const cancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;
    try {
      const res = await fetch(buildInterviewApiUrl(`/real-interview/cancel/${id}`), {
        method: 'PUT',
        headers: getHeaders(),
      });
      if (res.ok) {
        loadBookings();
        loadSlots(selectedDate);
      }
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour || 12;
    return `${hour12}:${m} ${period}`;
  };

  const statusColors = {
    scheduled: { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', icon: Calendar },
    completed: { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399', icon: CheckCircle },
    cancelled: { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', icon: XCircle },
    no_show: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: AlertCircle },
  };

  return (
    <div className="real-interview-page" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Real HR Interviews
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Practice with real HR professionals. Book a slot and get authentic interview experience.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-tertiary, rgba(255,255,255,0.04))', borderRadius: 12, padding: 4 }}>
        {['slots', 'bookings'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              background: tab === t ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: tab === t ? '#818cf8' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {t === 'slots' ? '📅 Available Slots' : `📋 My Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {tab === 'slots' && (
        <>
          {/* Date Filter */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); loadSlots(e.target.value); }}
              style={{
                background: 'var(--bg-tertiary, rgba(255,255,255,0.04))',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                borderRadius: 10,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
            {selectedDate && (
              <button
                onClick={() => { setSelectedDate(''); loadSlots(); }}
                style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 13 }}
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Slots Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>Loading slots...</div>
          ) : slots.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
              borderRadius: 16,
              border: '1px dashed var(--border, rgba(255,255,255,0.1))',
            }}>
              <Calendar size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                No available slots right now. Check back later!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {slots.map(slot => (
                <div
                  key={slot.id}
                  style={{
                    background: 'var(--bg-secondary, #0f0f13)',
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: 14,
                    padding: 20,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={18} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {formatDate(slot.slot_date)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </div>
                    </div>
                  </div>

                  {slot.hr && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                      padding: '8px 10px', borderRadius: 8,
                      background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
                    }}>
                      <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {slot.hr.full_name || 'HR Professional'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => bookSlot(slot.id)}
                    disabled={bookingSlot === slot.id}
                    style={{
                      width: '100%', padding: '10px 16px',
                      borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: bookingSlot === slot.id ? 0.6 : 1,
                    }}
                  >
                    {bookingSlot === slot.id ? 'Booking...' : (
                      <>Book Interview <ChevronRight size={14} /></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
              borderRadius: 16,
              border: '1px dashed var(--border, rgba(255,255,255,0.1))',
            }}>
              <Video size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                No bookings yet. Book your first real interview!
              </p>
            </div>
          ) : bookings.map(b => {
            const sc = statusColors[b.status] || statusColors.scheduled;
            const StatusIcon = sc.icon;
            return (
              <div
                key={b.id}
                style={{
                  background: 'var(--bg-secondary, #0f0f13)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: sc.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <StatusIcon size={18} style={{ color: sc.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {b.slot
                      ? `${formatDate(b.slot.slot_date)} • ${formatTime(b.slot.start_time)} – ${formatTime(b.slot.end_time)}`
                      : new Date(b.scheduled_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {b.hr?.full_name || 'HR Professional'}
                  </div>
                </div>

                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  background: sc.bg, color: sc.color, textTransform: 'capitalize',
                }}>
                  {b.status.replace('_', ' ')}
                </span>

                {b.rating && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={14} fill={s <= b.rating ? '#fbbf24' : 'transparent'} style={{ color: s <= b.rating ? '#fbbf24' : 'var(--text-secondary)' }} />
                    ))}
                  </div>
                )}

                {b.status === 'scheduled' && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#f87171', fontSize: 12, fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
