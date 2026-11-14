import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Send,
  Trash2,
  AtSign,
  Clock,
  User,
  Users,
  Flag,
} from 'lucide-react';

/**
 * Format seconds into mm:ss display string.
 */
export function formatTime(seconds) {
  if (Number.isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parses mm:ss or seconds into numeric seconds.
 */
export function parseTimeToSeconds(timeInput) {
  if (typeof timeInput === 'number') return timeInput;
  if (typeof timeInput === 'string' && timeInput.includes(':')) {
    const [m, s] = timeInput.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  return Number(timeInput) || 0;
}

/**
 * Default team members available for @mentions.
 */
export const TEAM_MEMBERS = [
  { id: 'sarah', name: 'Sarah Chen', handle: 'sarah', role: 'Hiring Manager' },
  { id: 'alex', name: 'Alex Rivera', handle: 'alex', role: 'Staff Engineer' },
  { id: 'priya', name: 'Priya Patel', handle: 'priya', role: 'Tech Lead' },
  { id: 'david', name: 'David Kim', handle: 'david', role: 'Senior Recruiter' },
  { id: 'panel', name: 'Interview Panel', handle: 'panel', role: 'Recruitment Team' },
];

/**
 * AudioTimelinePlayer
 *
 * Interactive waveform timeline player supporting:
 * - Interactive audio playback with waveform scrubbing
 * - AI Flag pins (e.g. 04:15 integrity alerts, probing questions, topic gaps)
 * - Timestamped recruiter comments with clickable time markers
 * - Team member @mentions with autocomplete popover
 */
export function AudioTimelinePlayer({
  audioUrl = null,
  duration = 600, // 10 minutes default
  flags = [],
  initialComments = [],
  candidateName = 'Candidate',
  onAddComment = null,
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null);

  // Recruiter comment composer state
  const [newCommentText, setNewCommentText] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState(null);
  const [selectedFlag, setSelectedFlag] = useState(null);

  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const commentInputRef = useRef(null);
  const simulatedTimerRef = useRef(null);

  const effectiveDuration = Math.max(60, Number(duration) || 600);

  // Normalized AI Flags list
  const normalizedFlags = useMemo(() => {
    const list = Array.isArray(flags) && flags.length > 0
      ? flags
      : [
          {
            id: 'flag-1',
            timestamp: 150, // 02:30
            type: 'ai_probing',
            title: 'AI Probing Triggered',
            description: 'Adaptive probing follow-up generated on omitted caching strategy.',
            severity: 'info',
          },
          {
            id: 'flag-2',
            timestamp: 255, // 04:15
            type: 'anomaly',
            title: 'Focus Shift Anomaly',
            description: 'Off-tab window switch detected during system architecture question.',
            severity: 'warning',
          },
          {
            id: 'flag-3',
            timestamp: 465, // 07:45
            type: 'strong_point',
            title: 'Exceptional Trade-off Analysis',
            description: 'Candidate articulated strong latency vs consistency trade-offs (CAP theorem).',
            severity: 'success',
          },
        ];

    return list.map((f, idx) => ({
      ...f,
      id: f.id || `flag-${idx}`,
      timestampSeconds: parseTimeToSeconds(f.timestamp),
    })).sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }, [flags]);

  // Comments list with initial presets
  const [comments, setComments] = useState(() => {
    if (Array.isArray(initialComments) && initialComments.length > 0) {
      return initialComments.map((c, i) => ({
        ...c,
        id: c.id || `c-${i}`,
        timestampSeconds: parseTimeToSeconds(c.timestampSeconds ?? c.timestamp ?? c.time ?? 0),
      }));
    }
    return [
      {
        id: 'c-1',
        author: 'Alex Rivera',
        role: 'Staff Engineer',
        timestampSeconds: 155, // 02:35
        text: 'Strong depth on the event loop and microtask queue. @sarah note how cleanly they explained Promise scheduling.',
        createdAt: '1 hour ago',
      },
      {
        id: 'c-2',
        author: 'David Kim',
        role: 'Senior Recruiter',
        timestampSeconds: 255, // 04:15
        text: 'Noticed the 04:15 focus change pin. Followed up on code review: appears candidate checked terminal docs. Clean verification.',
        createdAt: '45 mins ago',
      },
    ];
  });

  // Pre-computed waveform amplitude bars (60 bars)
  const waveformBars = useMemo(() => {
    const count = 60;
    const bars = [];
    for (let i = 0; i < count; i++) {
      // Create natural conversational wave pattern with speech cadence
      const wave = Math.sin(i * 0.45) * 0.35 + Math.cos(i * 0.2) * 0.25;
      const noise = ((i * 17 + 23) % 19) / 45;
      const height = Math.min(100, Math.max(18, Math.round((Math.abs(wave) + noise + 0.15) * 85)));
      bars.push(height);
    }
    return bars;
  }, []);

  // Sync with audio element or simulated playback tick
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.muted = isMuted;
    }
  }, [playbackRate, isMuted, audioUrl]);

  // Audio simulation timer for environments without live media files
  useEffect(() => {
    if (isPlaying && (!audioUrl || !audioRef.current)) {
      simulatedTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackRate;
          if (next >= effectiveDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (simulatedTimerRef.current) {
        clearInterval(simulatedTimerRef.current);
        simulatedTimerRef.current = null;
      }
    }

    return () => {
      if (simulatedTimerRef.current) {
        clearInterval(simulatedTimerRef.current);
      }
    };
  }, [isPlaying, audioUrl, playbackRate, effectiveDuration]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Fallback to simulated playback if media play fails
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying, audioUrl]);

  // Seek to specific timestamp
  const seekTo = useCallback((targetSeconds) => {
    const clamped = Math.max(0, Math.min(effectiveDuration, targetSeconds));
    setCurrentTime(clamped);
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = clamped;
    }
  }, [effectiveDuration, audioUrl]);

  // Timeline click / scrubbing
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(percentage * effectiveDuration);
  };

  // Timeline mouse hover for preview
  const handleTimelineMouseMove = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
    setHoverPosition(mouseX);
    setHoverTime(percentage * effectiveDuration);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
    setHoverPosition(null);
  };

  // Skip forward / backward 10s
  const handleSkip = (delta) => {
    seekTo(currentTime + delta);
  };

  // Autocomplete @mention handling in comment textarea
  const handleCommentChange = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    setNewCommentText(text);

    // Look backward from cursor to check if user typed @
    const upToCursor = text.slice(0, cursor);
    const atMatch = upToCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentionMenu(true);
      setMentionQuery(atMatch[1].toLowerCase());
      setMentionCursorPos(atMatch.index);
    } else {
      setShowMentionMenu(false);
    }
  };

  // Select team member from mention popup
  const handleSelectMention = (member) => {
    if (mentionCursorPos === null) return;
    const before = newCommentText.slice(0, mentionCursorPos);
    const after = newCommentText.slice(commentInputRef.current?.selectionStart || mentionCursorPos);
    const updated = `${before}@${member.handle} ${after}`;
    setNewCommentText(updated);
    setShowMentionMenu(false);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Submit recruiter comment
  const handleAddCommentSubmit = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const time = commentTimestamp !== null ? commentTimestamp : Math.round(currentTime);
    const newEntry = {
      id: `c-${Date.now()}`,
      author: 'You (Reviewer)',
      role: 'Recruiter',
      timestampSeconds: time,
      text: newCommentText.trim(),
      createdAt: 'Just now',
    };

    const updated = [...comments, newEntry].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    setComments(updated);
    setNewCommentText('');
    setCommentTimestamp(null);
    setShowMentionMenu(false);

    if (onAddComment) {
      onAddComment(newEntry);
    }
  };

  const handleDeleteComment = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Parse text to render @mentions as styled pills
  const renderCommentText = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              fontWeight: '700',
              fontSize: '11px',
              margin: '0 2px',
            }}
          >
            <AtSign size={10} />
            {part.slice(1)}
          </span>
        );
      }
      return part;
    });
  };

  const progressPercentage = (currentTime / effectiveDuration) * 100;

  return (
    <div
      className={`audio-timeline-player ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px',
        color: '#f8fafc',
      }}
    >
      {/* Hidden real audio element if URL provided */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* ─── Header: Player Title & Meta ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#38bdf8', fontWeight: '800' }}>
            <Sparkles size={13} /> Interactive Audio Timeline & AI Flags
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
            Interview Recording & Team Review
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '4px 0 0' }}>
            Waveform scrubber with AI flag pins (e.g. 04:15 focus change), timestamped recruiter notes, and @mentions.
          </p>
        </div>

        {/* Playback Speed Controls */}
        <div className="print-hide" style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(0, 0, 0, 0.25)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginRight: '4px' }}>Speed:</span>
          {[1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setPlaybackRate(rate)}
              style={{
                background: playbackRate === rate ? '#4f46e5' : 'transparent',
                color: playbackRate === rate ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* ─── Waveform Timeline Container ─── */}
      <div
        style={{
          position: 'relative',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '24px 20px 20px',
          marginBottom: '16px',
        }}
      >
        {/* Interactive Waveform Bars */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          style={{
            position: 'relative',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {waveformBars.map((height, idx) => {
            const barPercent = (idx / (waveformBars.length - 1)) * 100;
            const isPlayed = barPercent <= progressPercentage;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  background: isPlayed
                    ? 'linear-gradient(to top, #6366f1, #38bdf8)'
                    : 'rgba(255, 255, 255, 0.16)',
                  borderRadius: '2px',
                  transition: 'background 0.1s ease',
                }}
              />
            );
          })}

          {/* Current Playhead Line */}
          <div
            style={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: '-6px',
              bottom: '-6px',
              width: '2px',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#38bdf8',
              }}
            />
          </div>

          {/* AI Flag Pins on Timeline Track */}
          {normalizedFlags.map((flag) => {
            const flagPercent = (flag.timestampSeconds / effectiveDuration) * 100;
            const pinColor =
              flag.type === 'anomaly'
                ? '#ef4444'
                : flag.type === 'strong_point'
                  ? '#10b981'
                  : '#818cf8';

            return (
              <div
                key={flag.id}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(flag.timestampSeconds);
                  setSelectedFlag(flag);
                }}
                style={{
                  position: 'absolute',
                  left: `${flagPercent}%`,
                  top: '-12px',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                title={`${formatTime(flag.timestampSeconds)} - ${flag.title}`}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: pinColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 8px ${pinColor}88`,
                    border: '2px solid #0f172a',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Flag size={9} color="#fff" />
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: pinColor,
                    marginTop: '2px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '1px 3px',
                    borderRadius: '3px',
                  }}
                >
                  {formatTime(flag.timestampSeconds)}
                </div>
              </div>
            );
          })}

          {/* Hover Scrubbing Timestamp Tooltip */}
          {hoverTime !== null && hoverPosition !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${hoverPosition}px`,
                top: '-28px',
                transform: 'translateX(-50%)',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                pointerEvents: 'none',
                zIndex: 30,
              }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* ─── Audio Transport Controls Bar ─── */}
        <div
          className="print-hide"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
              title="Skip back 10 seconds"
            >
              <RotateCcw size={14} /> -10s
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              style={{
                background: isPlaying ? '#ef4444' : '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPlaying ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(79, 70, 229, 0.4)',
                transition: 'all 0.15s ease',
              }}
              title={isPlaying ? 'Pause' : 'Play audio'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
              title="Skip forward 10 seconds"
            >
              +10s <RotateCw size={14} />
            </button>

            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginLeft: '6px', fontFamily: 'monospace' }}>
              <span style={{ color: '#38bdf8' }}>{formatTime(currentTime)}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}> / {formatTime(effectiveDuration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              style={{
                background: 'transparent',
                color: isMuted ? '#ef4444' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setCommentTimestamp(Math.round(currentTime));
                if (commentInputRef.current) {
                  commentInputRef.current.focus();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <Clock size={12} /> Pin Note @ {formatTime(currentTime)}
            </button>
          </div>
        </div>
      </div>

      {/* ─── AI Flagged Moments Quick Jump Pills ─── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flag size={12} /> AI Flagged Key Moments ({normalizedFlags.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {normalizedFlags.map((flag) => {
            const isSelected = selectedFlag?.id === flag.id;
            const borderColor =
              flag.type === 'anomaly'
                ? 'rgba(239, 68, 68, 0.4)'
                : flag.type === 'strong_point'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : 'rgba(129, 140, 248, 0.4)';

            const textColor =
              flag.type === 'anomaly'
                ? '#f87171'
                : flag.type === 'strong_point'
                  ? '#34d399'
                  : '#818cf8';

            return (
              <button
                key={flag.id}
                type="button"
                onClick={() => {
                  seekTo(flag.timestampSeconds);
                  setSelectedFlag(flag);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  padding: '5px 10px',
                  color: textColor,
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: '800', fontFamily: 'monospace' }}>
                  {formatTime(flag.timestampSeconds)}
                </span>
                <span>{flag.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Flag Details Drawer */}
        {selectedFlag && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ color: '#fff' }}>[{formatTime(selectedFlag.timestampSeconds)}] {selectedFlag.title}:</strong>{' '}
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{selectedFlag.description}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFlag(null)}
              style={{
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ─── Recruiter Collaborative Notes & @Mentions ─── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818cf8', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} /> Team Recruiter Collaboration & Comments ({comments.length})
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
            Type @ to mention team members
          </span>
        </div>

        {/* Comment Composer Form */}
        <form onSubmit={handleAddCommentSubmit} className="print-hide" style={{ position: 'relative', marginBottom: '18px' }}>
          <div
            style={{
              position: 'relative',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '10px 14px',
            }}
          >
            {commentTimestamp !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', background: '#4f46e5', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  Pinning to {formatTime(commentTimestamp)}
                </span>
                <button
                  type="button"
                  onClick={() => setCommentTimestamp(null)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px' }}
                >
                  Clear time
                </button>
              </div>
            )}

            <textarea
              ref={commentInputRef}
              rows={2}
              value={newCommentText}
              onChange={handleCommentChange}
              placeholder="Add recruiter feedback or note (e.g. 'Strong explanation of Redis. @sarah review this')..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '12.5px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            {/* Team Member Mention Autocomplete Popover */}
            {showMentionMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '-150px',
                  left: '14px',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                  width: '260px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  zIndex: 50,
                  padding: '4px',
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)', padding: '4px 8px', fontWeight: '700' }}>
                  Mention Colleague
                </div>
                {TEAM_MEMBERS.filter((m) =>
                  m.name.toLowerCase().includes(mentionQuery) || m.handle.includes(mentionQuery)
                ).map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMention(member)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{member.name}</strong>
                      <span style={{ color: '#818cf8', marginLeft: '4px', fontSize: '11px' }}>@{member.handle}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>{member.role}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {TEAM_MEMBERS.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMention(m)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    @{m.handle}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!newCommentText.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: newCommentText.trim() ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease',
                }}
              >
                <Send size={12} /> Post Note
              </button>
            </div>
          </div>
        </form>

        {/* Existing Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="dossier-card"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => seekTo(comment.timestampSeconds)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                    title="Click to jump audio to this timestamp"
                  >
                    <Clock size={11} /> {formatTime(comment.timestampSeconds)}
                  </button>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>{comment.author}</strong>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>· {comment.role}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {comment.createdAt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="print-hide"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Delete note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {renderCommentText(comment.text)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AudioTimelinePlayer;
