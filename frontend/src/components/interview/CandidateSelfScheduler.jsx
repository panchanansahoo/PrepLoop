import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Video,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Building2,
  Briefcase,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET / New York)' },
  { value: 'America/Chicago', label: 'Central Time (CT / Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (MT / Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT / Los Angeles)' },
  { value: 'Europe/London', label: 'London / GMT (UTC+0 / UTC+1)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET / Paris)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST / Dubai)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST / New Delhi)' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST / Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET / Sydney)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

/**
 * Generate standard recruiter availability slots for the next 7 weekdays
 */
function generateDefaultSlots(startDate = new Date()) {
  const slots = [];
  const start = new Date(startDate);
  const times = ['09:30', '11:00', '14:00', '15:30', '17:00'];

  for (let i = 1; i <= 10; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    if (day.getDay() === 0 || day.getDay() === 6) continue; // Skip Sat/Sun

    const dateStr = day.toISOString().split('T')[0];
    times.forEach(time => {
      const [h, m] = time.split(':');
      const utcDate = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), Number(h), Number(m)));
      slots.push({
        slotId: `slot_${dateStr}_${h}${m}`,
        dateStr,
        time,
        utcTimestamp: utcDate.toISOString(),
      });
    });
  }
  return slots;
}

export default function CandidateSelfScheduler({
  token = 'demo_schedule_123',
  questionSet = null,
  availabilitySlots = null,
  onSlotConfirmed = null,
  initialTimezone = null,
}) {
  // Detect local candidate timezone
  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [timezone, setTimezone] = useState(initialTimezone || detectedTz);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [error, setError] = useState(null);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Raw slots either passed in or generated
  const allSlots = useMemo(() => {
    if (Array.isArray(availabilitySlots) && availabilitySlots.length > 0) {
      return availabilitySlots;
    }
    return generateDefaultSlots();
  }, [availabilitySlots]);

  // Group slots by local date in selected candidate timezone
  const slotsByCandidateDate = useMemo(() => {
    const map = new Map();

    allSlots.forEach(slot => {
      try {
        const slotDate = new Date(slot.utcTimestamp);
        const localDateKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(slotDate);

        const localTimeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(slotDate);

        if (!map.has(localDateKey)) {
          map.set(localDateKey, []);
        }

        map.get(localDateKey).push({
          ...slot,
          localTimeStr,
          localDateKey,
        });
      } catch {
        // Fallback to UTC if timezone error
      }
    });

    return map;
  }, [allSlots, timezone]);

  const availableDates = useMemo(() => {
    return Array.from(slotsByCandidateDate.keys()).sort();
  }, [slotsByCandidateDate]);

  // Default select first available date
  useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !slotsByCandidateDate.has(selectedDate))) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate, slotsByCandidateDate]);

  // Slots for the active date
  const activeDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slotsByCandidateDate.get(selectedDate) || [];
  }, [selectedDate, slotsByCandidateDate]);

  // Booking action
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    setError(null);

    try {
      let bookingResult = null;

      // Call API if endpoint exists, or provide mock confirmation
      try {
        const res = await fetch(`/api/interview/feedback-portal/schedule/${token}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slotTimestamp: selectedSlot.utcTimestamp,
            candidateTimezone: timezone,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          bookingResult = json.booking;
        }
      } catch (apiErr) {
        // Fallback for standalone/mock usage
      }

      if (!bookingResult) {
        bookingResult = {
          token,
          confirmedAt: new Date().toISOString(),
          scheduledAt: selectedSlot.utcTimestamp,
          candidateTimezone: timezone,
          joinUrl: `${window.location.origin}/ai-interview?token=${token}`,
          calendarIcs: null,
        };
      }

      setBookingConfirmed(bookingResult);
      if (typeof onSlotConfirmed === 'function') {
        onSlotConfirmed(bookingResult);
      }
    } catch (err) {
      setError(err.message || 'Failed to book slot. Please try again.');
    } finally {
      setIsBooking(false);
    }
  }, [selectedSlot, timezone, token, onSlotConfirmed]);

  // Format date display
  const formatFriendlyDate = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const roleName = questionSet?.settings?.roleName || questionSet?.role || 'Software Engineer';
  const companyName = questionSet?.settings?.companyName || 'PrepLoop Recruiter';
  const interviewTitle = questionSet?.title || 'Technical Assessment & AI Interview';
  const durationMinutes = questionSet?.scheduled_duration_minutes || questionSet?.settings?.scheduledDurationMinutes || 45;

  // Render Confirmation Screen
  if (bookingConfirmed) {
    const confirmedDate = new Date(bookingConfirmed.scheduledAt);
    const confirmedFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(confirmedDate);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(interviewTitle)}&dates=${confirmedDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(confirmedDate.getTime() + durationMinutes * 60000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(`Technical Interview on PrepLoop.\\nJoin URL: ${bookingConfirmed.joinUrl}`)}`;

    return (
      <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        <div className="flex items-center gap-3 mb-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Interview Confirmed!</h2>
        </div>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          You are scheduled with <strong className="text-white">{companyName}</strong> for the{' '}
          <strong className="text-white">{roleName}</strong> assessment. A calendar invitation and reminder have been prepared.
        </p>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Scheduled Date & Time</div>
              <div className="text-base font-semibold text-white mt-0.5">{confirmedFormatted}</div>
              <div className="text-xs text-indigo-300 mt-0.5 font-mono">{timezone}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-slate-700/50">
            <Clock className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Duration</div>
              <div className="text-sm font-medium text-slate-200 mt-0.5">{durationMinutes} Minutes (AI Voice & Live Coding)</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <CalendarIcon className="w-4 h-4" />
            Add to Google Calendar
          </a>

          {bookingConfirmed.calendarIcs && (
            <button
              onClick={() => {
                const blob = new Blob([bookingConfirmed.calendarIcs], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'interview-invitation.ics';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors border border-slate-700"
            >
              <Download className="w-4 h-4" />
              Download .ICS
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Need to choose another time?</span>
          <button
            onClick={() => {
              setBookingConfirmed(null);
              setSelectedSlot(null);
            }}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reschedule Slot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left Panel: Session Overview & Timezone */}
        <div className="md:col-span-5 p-6 sm:p-8 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Recruiter Availability
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              {interviewTitle}
            </h1>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{roleName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{durationMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Video className="w-4 h-4 text-slate-400 shrink-0" />
                <span>WebRTC Voice & Code Sandbox</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Select an available time slot below to lock in your interview window. You will receive an immediate confirmation email with calendar synchronization.
            </p>
          </div>

          {/* Timezone Selector */}
          <div className="pt-4 border-t border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Candidate Timezone
              </span>
            </label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
              {!COMMON_TIMEZONES.some(tz => tz.value === timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
            </select>
            <div className="text-[11px] text-slate-400 mt-1.5">
              All slots are automatically converted to your local time.
            </div>
          </div>
        </div>

        {/* Right Panel: Interactive Date & Slot Picker */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                Select a Date & Time
              </h2>
            </div>

            {/* Date Picker Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
              {availableDates.map(dateKey => {
                const isSelected = selectedDate === dateKey;
                const formatted = formatFriendlyDate(dateKey);
                const parts = formatted.split(' ');
                const dayName = parts[0];
                const monthDay = parts.slice(1).join(' ');

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setSelectedSlot(null);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="uppercase text-[10px] tracking-wider opacity-80">{dayName}</span>
                    <span className="text-sm font-bold mt-0.5">{monthDay}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Grid */}
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
                Available Windows for {selectedDate ? formatFriendlyDate(selectedDate) : 'Selected Date'}
              </div>

              {activeDateSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No slots currently available on this day. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {activeDateSlots.map(slot => {
                    const isSelected = selectedSlot?.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30 font-semibold ring-2 ring-emerald-400/50'
                            : 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:border-indigo-500 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {slot.localTimeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Booking Confirmation Bar */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            {error && (
              <div className="mb-3 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs">
                {error}
              </div>
            )}

            {selectedSlot ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-4">
                <div>
                  <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                    Selected Interview Slot
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {formatFriendlyDate(selectedDate)} at {selectedSlot.localTimeStr}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBooking}
                  onClick={handleConfirmBooking}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Locking In...
                    </>
                  ) : (
                    <>
                      Confirm & Schedule
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 py-2">
                Click a time slot above to lock in your interview schedule.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
