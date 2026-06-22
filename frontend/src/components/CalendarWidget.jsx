import { useState, useMemo } from 'react';
import './CalendarWidget.css';
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Clock, Edit2, Trash2 } from 'lucide-react';
import useCalendarEvents from '../hooks/useCalendarEvents';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_TAGS = [
    { id: 'study', label: 'Study', color: '#a78bfa' },
    { id: 'interview', label: 'Interview', color: '#f472b6' },
    { id: 'contest', label: 'Contest', color: '#fb923c' },
    { id: 'deadline', label: 'Deadline', color: '#ef4444' },
    { id: 'personal', label: 'Personal', color: '#34d399' },
    { id: 'other', label: 'Other', color: '#60a5fa' },
];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getRelativeDay(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((target - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0 && diff <= 7) return `in ${diff} days`;
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CalendarWidget() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', time: '', tag: 'study' });
    const [slideDir, setSlideDir] = useState('');

    const { events, loading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const selKey = dateKey(currentYear, currentMonth, selectedDate);

    const prevMonth = () => {
        setSlideDir('slide-right');
        setTimeout(() => setSlideDir(''), 300);
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
        setSelectedDate(1);
    };

    const nextMonth = () => {
        setSlideDir('slide-left');
        setTimeout(() => setSlideDir(''), 300);
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
        setSelectedDate(1);
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        setSelectedDate(today.getDate());
    };

    const handleAddEvent = async () => {
        if (!newEvent.title.trim()) return;
        await addEvent(selKey, {
            title: newEvent.title.trim(),
            time: newEvent.time,
            tag: newEvent.tag,
        });
        setNewEvent({ title: '', time: '', tag: 'study' });
        setShowAddForm(false);
    };

    const handleUpdateEvent = async () => {
        if (!editingEvent || !newEvent.title.trim()) return;
        await updateEvent(selKey, editingEvent.id, {
            title: newEvent.title.trim(),
            time: newEvent.time,
            tag: newEvent.tag,
        });
        setEditingEvent(null);
        setNewEvent({ title: '', time: '', tag: 'study' });
        setShowAddForm(false);
    };

    const handleDeleteEvent = async (evtId) => {
        await deleteEvent(selKey, evtId);
    };

    const startEdit = (evt) => {
        setEditingEvent(evt);
        setNewEvent({ title: evt.title, time: evt.time || '', tag: evt.tag || 'study' });
        setShowAddForm(true);
    };

    // Build upcoming agenda (next 14 days with events, show max 3)
    const upcoming = useMemo(() => {
        const result = [];
        for (let i = 0; i <= 14 && result.length < 3; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
            if (events[key] && events[key].length > 0) {
                events[key].forEach(evt => {
                    if (result.length < 3) {
                        result.push({ ...evt, dateStr: key, relative: getRelativeDay(key) });
                    }
                });
            }
        }
        return result;
    }, [events, today.toDateString()]);

    const selectedEvents = events[selKey] || [];

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    if (loading) {
        return (
            <div className="cal-widget cal-advanced">
                <div className="cal-header">
                    <div className="cal-title-row">
                        <div className="cal-icon-wrap"><Calendar size={18} /></div>
                        <div>
                            <h3 className="cal-title">Calendar</h3>
                            <p className="cal-subtitle">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cal-widget cal-advanced">
            {/* Header */}
            <div className="cal-header">
                <div className="cal-title-row">
                    <div className="cal-icon-wrap">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <h3 className="cal-title">Calendar</h3>
                        <p className="cal-subtitle">{MONTHS[currentMonth]} {currentYear}</p>
                    </div>
                </div>
                <div className="cal-nav">
                    <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
                    <button className="cal-today-btn" onClick={goToToday}>Today</button>
                    <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
            </div>

            {/* Day headers */}
            <div className="cal-grid cal-day-headers">
                {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            </div>

            {/* Date cells */}
            <div className={`cal-grid cal-dates ${slideDir}`}>
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="cal-cell cal-empty" />;
                    const isToday = isCurrentMonth && day === today.getDate();
                    const isSelected = day === selectedDate;
                    const dayKey = dateKey(currentYear, currentMonth, day);
                    const dayEvents = events[dayKey] || [];
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={day}
                            className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSelected && !isToday ? 'cal-selected' : ''} ${hasEvents ? 'cal-has-events' : ''}`}
                            onClick={() => setSelectedDate(day)}
                        >
                            <span>{day}</span>
                            {hasEvents && (
                                <div className="cal-event-dots">
                                    {dayEvents.slice(0, 3).map((ev, idx) => {
                                        const tag = EVENT_TAGS.find(t => t.id === ev.tag) || EVENT_TAGS[5];
                                        return <span key={idx} className="cal-dot" style={{ background: tag.color }} />;
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Date Events Panel */}
            <div className="cal-events-panel">
                <div className="cal-events-header">
                    <span className="cal-events-date">
                        {MONTHS[currentMonth]} {selectedDate}
                        {selectedEvents.length > 0 && <span className="cal-events-count">{selectedEvents.length}</span>}
                    </span>
                    <button
                        className="cal-add-event-btn"
                        onClick={() => {
                            setEditingEvent(null);
                            setNewEvent({ title: '', time: '', tag: 'study' });
                            setShowAddForm(!showAddForm);
                        }}
                    >
                        {showAddForm ? <X size={14} /> : <Plus size={14} />}
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showAddForm && (
                    <div className="cal-event-form">
                        <input
                            type="text"
                            placeholder="Event title..."
                            value={newEvent.title}
                            onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && (editingEvent ? handleUpdateEvent() : handleAddEvent())}
                            className="cal-event-input"
                            autoFocus
                        />
                        <div className="cal-event-form-row">
                            <input
                                type="time"
                                value={newEvent.time}
                                onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                                className="cal-event-time"
                            />
                            <div className="cal-tag-selector">
                                {EVENT_TAGS.map(tag => (
                                    <button
                                        key={tag.id}
                                        className={`cal-tag-btn ${newEvent.tag === tag.id ? 'active' : ''}`}
                                        style={{
                                            background: newEvent.tag === tag.id ? tag.color : 'transparent',
                                            borderColor: tag.color,
                                            color: newEvent.tag === tag.id ? '#fff' : tag.color
                                        }}
                                        onClick={() => setNewEvent(prev => ({ ...prev, tag: tag.id }))}
                                        title={tag.label}
                                    >
                                        {tag.label.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            className="cal-event-submit"
                            onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                            disabled={!newEvent.title.trim()}
                        >
                            {editingEvent ? 'Update' : 'Add Event'}
                        </button>
                    </div>
                )}

                {/* Event list */}
                <div className="cal-event-list">
                    {selectedEvents.length === 0 && !showAddForm && (
                        <div className="cal-no-events">No events this day</div>
                    )}
                    {selectedEvents.map(evt => {
                        const tag = EVENT_TAGS.find(t => t.id === evt.tag) || EVENT_TAGS[5];
                        return (
                            <div key={evt.id} className="cal-event-item">
                                <div className="cal-event-tag-strip" style={{ background: tag.color }} />
                                <div className="cal-event-info">
                                    <span className="cal-event-title">{evt.title}</span>
                                    {evt.time && <span className="cal-event-time-label"><Clock size={10} /> {evt.time}</span>}
                                </div>
                                <div className="cal-event-actions">
                                    <button onClick={() => startEdit(evt)} className="cal-evt-btn"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteEvent(evt.id)} className="cal-evt-btn cal-evt-del"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Agenda */}
            {upcoming.length > 0 && (
                <div className="cal-agenda">
                    <div className="cal-agenda-title">Upcoming</div>
                    {upcoming.map((evt, i) => {
                        const tag = EVENT_TAGS.find(t => t.id === evt.tag) || EVENT_TAGS[5];
                        return (
                            <div key={i} className="cal-agenda-item">
                                <span className="cal-agenda-dot" style={{ background: tag.color }} />
                                <span className="cal-agenda-text">{evt.title}</span>
                                <span className="cal-agenda-when">{evt.relative}</span>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{getDynamicStyles(isLight)}</style>
        </div>
    );
}

function getDynamicStyles(isLight) {
    return `
        .cal-advanced {
            background: ${isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))'};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: ${isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.05)'};
            border-radius: 20px;
            box-shadow: ${isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 12px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'};
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            color: ${isLight ? '#0f172a' : '#fff'};
        }
        .cal-advanced:hover {
            box-shadow: ${isLight ? '0 16px 48px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)' : '0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)'};
            border-color: ${isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)'};
        }
        .cal-header {
            border-bottom: ${isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)'};
            background: ${isLight ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.02), transparent)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent)'};
        }
        .cal-icon-wrap {
            background: ${isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)'};
            color: ${isLight ? '#4f46e5' : '#818cf8'};
            box-shadow: ${isLight ? '0 0 12px rgba(99, 102, 241, 0.1)' : '0 0 12px rgba(99, 102, 241, 0.2)'};
            border-radius: 10px;
        }
        .cal-today-btn, .cal-nav-btn {
            background: ${isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.05)'};
            border: ${isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)'};
            color: ${isLight ? '#475569' : '#cbd5e1'};
            transition: all 0.2s ease;
        }
        .cal-today-btn:hover, .cal-nav-btn:hover {
            background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.1)'};
            color: ${isLight ? '#0f172a' : '#fff'};
            transform: translateY(-1px);
            box-shadow: ${isLight ? '0 4px 12px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
        }
        .cal-cell {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 12px;
            background: transparent;
            color: ${isLight ? '#334155' : '#e2e8f0'};
        }
        .cal-cell:hover:not(.cal-empty) {
            background: ${isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)'};
            transform: scale(1.05);
        }
        .cal-today {
            background: ${isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)'} !important;
            color: ${isLight ? '#4f46e5' : '#818cf8'} !important;
            font-weight: 800;
            box-shadow: ${isLight ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.2)' : 'inset 0 0 0 1px rgba(99, 102, 241, 0.3)'};
        }
        .cal-selected {
            background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.1)'} !important;
            box-shadow: ${isLight ? 'inset 0 0 0 1px rgba(15, 23, 42, 0.1)' : 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)'};
        }
        .cal-events-panel {
            background: ${isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(0, 0, 0, 0.2)'};
            border-top: ${isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)'};
        }
        .cal-event-item {
            background: ${isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.02)'};
            border: ${isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.03)'};
            border-radius: 12px;
            transition: all 0.3s ease;
            box-shadow: ${isLight ? '0 2px 4px rgba(0,0,0,0.02)' : 'none'};
        }
        .cal-event-item:hover {
            background: ${isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)'};
            border-color: ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            transform: translateX(4px);
            box-shadow: ${isLight ? '0 4px 8px rgba(0,0,0,0.04)' : 'none'};
        }
        .cal-day-header {
            color: ${isLight ? '#64748b' : '#94a3b8'};
        }
        .cal-title {
            color: ${isLight ? '#0f172a' : '#f8fafc'};
        }
        .cal-subtitle {
            color: ${isLight ? '#64748b' : '#94a3b8'};
        }
        .cal-event-title, .cal-agenda-text {
            color: ${isLight ? '#0f172a' : '#e2e8f0'};
        }
        .cal-event-time-label, .cal-agenda-when {
            color: ${isLight ? '#64748b' : '#94a3b8'};
        }
        .cal-events-date {
            color: ${isLight ? '#0f172a' : '#f8fafc'};
        }
        .cal-events-count {
            background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255,255,255,0.1)'};
            color: ${isLight ? '#475569' : '#cbd5e1'};
        }
        .cal-add-event-btn {
            background: ${isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)'};
            color: ${isLight ? '#4f46e5' : '#fff'};
        }
        .cal-add-event-btn:hover {
            background: ${isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.1)'};
        }
        .cal-no-events {
            color: ${isLight ? '#64748b' : '#64748b'};
        }
        .cal-agenda-title {
            color: ${isLight ? '#475569' : '#94a3b8'};
        }
        .cal-event-input {
            background: ${isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.2)'};
            color: ${isLight ? '#0f172a' : '#fff'};
            border: ${isLight ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.1)'};
        }
        .cal-event-input::placeholder {
            color: ${isLight ? '#94a3b8' : '#64748b'};
        }
        .cal-event-time {
            background: ${isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.2)'};
            color: ${isLight ? '#0f172a' : '#fff'};
            border: ${isLight ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.1)'};
        }
        .cal-evt-btn {
            color: ${isLight ? '#64748b' : '#94a3b8'};
        }
        .cal-evt-btn:hover {
            color: ${isLight ? '#0f172a' : '#fff'};
        }
        .cal-evt-del:hover {
            color: #ef4444;
        }
    `;
}
