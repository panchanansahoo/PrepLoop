import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Plus, Trash2, Users, Briefcase,
  LogOut, ChevronRight, CheckCircle, X, Building,
  Video, Star, MapPin, DollarSign, Link as LinkIcon, FileText,
} from 'lucide-react';
import { buildApiUrl } from '../utils/safeApiUrl';

const API_URL = import.meta.env.VITE_API_URL || '';

function buildHrApiUrl(path) {
  return buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const [hrUser, setHrUser] = useState(null);
  const [tab, setTab] = useState('slots'); // 'slots' | 'bookings' | 'jobs'
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slot creation form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({ slotDate: '', startTime: '', endTime: '', maxBookings: 1 });

  // Job creation form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '', company: '', location: '', type: 'Full-time',
    salary: '', description: '', requirements: '', applyUrl: '',
  });

  const getHeaders = () => {
    const token = localStorage.getItem('hr_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const user = localStorage.getItem('hr_user');
    if (!user) {
      navigate('/hr/login');
      return;
    }
    setHrUser(JSON.parse(user));
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSlots(), loadBookings(), loadJobs()]);
    setLoading(false);
  };

  const loadSlots = async () => {
    try {
      const res = await fetch(buildHrApiUrl('/hr/my-slots'), { headers: getHeaders() });
      if (res.ok) setSlots(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadBookings = async () => {
    try {
      const res = await fetch(buildHrApiUrl('/hr/my-bookings'), { headers: getHeaders() });
      if (res.ok) setBookings(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch(buildHrApiUrl('/hr/my-jobs'), { headers: getHeaders() });
      if (res.ok) setJobs(await res.json());
    } catch (err) { console.error(err); }
  };

  const createSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(buildHrApiUrl('/hr/slots'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(slotForm),
      });
      if (res.ok) {
        setShowSlotForm(false);
        setSlotForm({ slotDate: '', startTime: '', endTime: '', maxBookings: 1 });
        loadSlots();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create slot');
      }
    } catch (err) { alert('Failed to create slot'); }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Delete this slot?')) return;
    try {
      await fetch(buildHrApiUrl(`/hr/slots/${id}`), { method: 'DELETE', headers: getHeaders() });
      loadSlots();
    } catch (err) { alert('Failed to delete'); }
  };

  const completeInterview = async (bookingId) => {
    const rating = prompt('Rate the interview (1-5):');
    if (!rating) return;
    const feedback = prompt('Any feedback for the student?') || '';
    try {
      await fetch(buildHrApiUrl(`/hr/complete/${bookingId}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rating: parseInt(rating), feedback }),
      });
      loadBookings();
    } catch (err) { alert('Failed to complete'); }
  };

  const createJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(buildHrApiUrl('/hr/jobs'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jobForm),
      });
      if (res.ok) {
        setShowJobForm(false);
        setJobForm({ title: '', company: '', location: '', type: 'Full-time', salary: '', description: '', requirements: '', applyUrl: '' });
        loadJobs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to post job');
      }
    } catch (err) { alert('Failed to post job'); }
  };

  const deleteJob = async (id) => {
    if (!confirm('Delete this job posting?')) return;
    try {
      await fetch(buildHrApiUrl(`/hr/jobs/${id}`), { method: 'DELETE', headers: getHeaders() });
      loadJobs();
    } catch (err) { alert('Failed to delete'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    navigate('/hr/login');
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const cardStyle = {
    background: 'var(--bg-secondary, #0f0f13)',
    border: '1px solid var(--border, rgba(255,255,255,0.08))',
    borderRadius: 14,
    padding: 20,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-tertiary, rgba(255,255,255,0.04))',
    border: '1px solid var(--border, rgba(255,255,255,0.08))',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  };

  if (!hrUser) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #050507)',
      color: 'var(--text-primary)',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--bg-secondary, #0f0f13)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building size={18} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{hrUser.fullName}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>HR Dashboard</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13,
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Slots', value: slots.length, icon: Calendar, color: '#818cf8' },
            { label: 'Interviews', value: bookings.length, icon: Video, color: '#34d399' },
            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: CheckCircle, color: '#fbbf24' },
            { label: 'Jobs Posted', value: jobs.length, icon: Briefcase, color: '#f472b6' },
          ].map(stat => (
            <div key={stat.label} style={{
              ...cardStyle, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${stat.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--bg-tertiary, rgba(255,255,255,0.04))',
          borderRadius: 12, padding: 4,
        }}>
          {[
            { key: 'slots', label: '📅 Interview Slots' },
            { key: 'bookings', label: '👥 Booked Interviews' },
            { key: 'jobs', label: '💼 Job Postings' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                background: tab === t.key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: tab === t.key ? '#818cf8' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* SLOTS TAB */}
        {tab === 'slots' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Your Interview Slots</h2>
              <button
                onClick={() => setShowSlotForm(!showSlotForm)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} /> Add Slot
              </button>
            </div>

            {showSlotForm && (
              <form onSubmit={createSlot} style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Date *</label>
                    <input type="date" required value={slotForm.slotDate} onChange={e => setSlotForm(p => ({ ...p, slotDate: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Max Bookings</label>
                    <input type="number" min="1" value={slotForm.maxBookings} onChange={e => setSlotForm(p => ({ ...p, maxBookings: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Start Time *</label>
                    <input type="time" required value={slotForm.startTime} onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>End Time *</label>
                    <input type="time" required value={slotForm.endTime} onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowSlotForm(false)} style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                  }}>Cancel</button>
                  <button type="submit" style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  }}>Create Slot</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, ...cardStyle, borderStyle: 'dashed' }}>
                  <Calendar size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No slots created yet.</p>
                </div>
              ) : slots.map(s => (
                <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} style={{ color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(s.slot_date)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(16, 185, 129, 0.1)', color: '#34d399',
                  }}>
                    <Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {s.booked_count || 0}/{s.max_bookings}
                  </span>
                  <button onClick={() => deleteSlot(s.id)} style={{
                    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 8, padding: '6px 10px', color: '#f87171', cursor: 'pointer',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Booked Interviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, ...cardStyle, borderStyle: 'dashed' }}>
                  <Video size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No bookings yet.</p>
                </div>
              ) : bookings.map(b => (
                <div key={b.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} style={{ color: '#34d399' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.student_name || 'Student'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDate(b.slot_date)} • {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.student_email}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: b.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    color: b.status === 'completed' ? '#34d399' : '#818cf8',
                    textTransform: 'capitalize',
                  }}>
                    {b.status}
                  </span>
                  {b.status === 'scheduled' && (
                    <button onClick={() => completeInterview(b.id)} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      background: 'rgba(16, 185, 129, 0.12)', color: '#34d399',
                      fontWeight: 500, cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <CheckCircle size={14} /> Complete
                    </button>
                  )}
                  {b.rating && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} fill={s <= b.rating ? '#fbbf24' : 'transparent'} style={{ color: s <= b.rating ? '#fbbf24' : '#555' }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* JOBS TAB */}
        {tab === 'jobs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Your Job Postings</h2>
              <button
                onClick={() => setShowJobForm(!showJobForm)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} /> Post Job
              </button>
            </div>

            {showJobForm && (
              <form onSubmit={createJob} style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Job Title *</label>
                    <input required value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Software Engineer" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Company *</label>
                    <input required value={jobForm.company} onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Location</label>
                    <input value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Bangalore, Remote" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Job Type</label>
                    <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Salary Range</label>
                    <input value={jobForm.salary} onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 8-12 LPA" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea rows={3} value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Requirements</label>
                    <textarea rows={2} value={jobForm.requirements} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))} placeholder="Skills, experience, qualifications..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Apply URL</label>
                    <input value={jobForm.applyUrl} onChange={e => setJobForm(p => ({ ...p, applyUrl: e.target.value }))} placeholder="https://careers.company.com/apply" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowJobForm(false)} style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                  }}>Cancel</button>
                  <button type="submit" style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  }}>Post Job</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, ...cardStyle, borderStyle: 'dashed' }}>
                  <Briefcase size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No jobs posted yet.</p>
                </div>
              ) : jobs.map(j => (
                <div key={j.id} style={{ ...cardStyle }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{j.title}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} /> {j.company}</span>
                        {j.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {j.location}</span>}
                        {j.salary_range && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={12} /> {j.salary_range}</span>}
                        <span style={{
                          padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
                        }}>{j.job_type}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteJob(j.id)} style={{
                      background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 8, padding: '6px 10px', color: '#f87171', cursor: 'pointer', flexShrink: 0,
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {j.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                      {j.description.length > 200 ? j.description.substring(0, 200) + '...' : j.description}
                    </p>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Posted {new Date(j.created_at).toLocaleDateString()}
                    {j.apply_url && (
                      <span> • <a href={j.apply_url} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>Apply Link ↗</a></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
