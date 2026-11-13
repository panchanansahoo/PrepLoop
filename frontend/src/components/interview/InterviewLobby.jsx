import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, ArrowRight, CheckCircle, Sparkles, Users,
    FileText, Search, Star, Code2, MessageSquare, X,
    GraduationCap, Briefcase, RefreshCw, Zap, Mic, Volume2, KeyRound, User, Video, VideoOff, AlertTriangle,
    Calendar, Clock, Timer, Download,
} from 'lucide-react';

// ─── Static data (hoisted outside component to avoid recreation) ───
const TOPIC_PILLS = [
    { id: 'hr', label: 'HR Round' },
    { id: 'technical', label: 'Technical Round' },
    { id: 'peer', label: 'Peer 1-on-1 Round' },
];

const SETUP_STEPS = [
    'Experience',
    'Interview Type',
    'Resume',
    'Target Role',
    'Company',
    'Start',
];

const STEP_DESCRIPTIONS = [
    'Are you a fresher or an experienced professional?',
    'Choose the type of interview you want to practice',
    'Upload your resume for personalized questions',
    'Enter your target role for tailored preparation',
    'Choose the target company for your interview',
    'Review your setup and start your interview',
];

const COMPANIES = [
    { name: 'Google', industry: 'Technology', icon: '🔍', category: 'faang', starred: true },
    { name: 'Apple', industry: 'Technology', icon: '🍎', category: 'faang' },
    { name: 'Meta', industry: 'Social Media', icon: '📘', category: 'faang' },
    { name: 'Amazon', industry: 'E-Commerce', icon: '📦', category: 'faang' },
    { name: 'Netflix', industry: 'Entertainment', icon: '🎬', category: 'faang' },
    { name: 'Microsoft', industry: 'Technology', icon: '🪟', category: 'faang' },
    { name: 'Infosys', industry: 'IT Services', icon: '💼', category: 'indian' },
    { name: 'TCS', industry: 'IT Services', icon: '🏢', category: 'indian' },
    { name: 'Wipro', industry: 'IT Services', icon: '🔧', category: 'indian' },
    { name: 'Flipkart', industry: 'E-Commerce', icon: '🛒', category: 'indian' },
    { name: 'Razorpay', industry: 'Fintech', icon: '💳', category: 'indian' },
    { name: 'Swiggy', industry: 'Food Delivery', icon: '🍔', category: 'indian' },
    { name: 'Zomato', industry: 'Food Delivery', icon: '🍕', category: 'indian' },
    { name: 'Paytm', industry: 'Fintech', icon: '💰', category: 'indian' },
    { name: 'Meesho', industry: 'E-Commerce', icon: '🛍️', category: 'indian' },
    { name: 'Dream11', industry: 'Gaming', icon: '🎮', category: 'indian' },
    { name: 'PhonePe', industry: 'Fintech', icon: '📱', category: 'indian' },
    { name: 'CRED', industry: 'Fintech', icon: '💎', category: 'indian' },
    { name: 'Spotify', industry: 'Music', icon: '🎵', category: 'global' },
    { name: 'Airbnb', industry: 'Travel', icon: '🏠', category: 'global' },
    { name: 'Uber', industry: 'Transport', icon: '🚗', category: 'global' },
    { name: 'Stripe', industry: 'Fintech', icon: '💳', category: 'global' },
    { name: 'Salesforce', industry: 'CRM', icon: '☁️', category: 'global' },
    { name: 'Adobe', industry: 'Software', icon: '🎨', category: 'global' },
    { name: 'Oracle', industry: 'Database', icon: '🗄️', category: 'global' },
    { name: 'IBM', industry: 'Technology', icon: '💻', category: 'global' },
    { name: 'Twitter / X', industry: 'Social Media', icon: '🐦', category: 'global' },
    { name: 'LinkedIn', industry: 'Professional', icon: '🔗', category: 'global' },
    { name: 'Nvidia', industry: 'Hardware', icon: '🟢', category: 'global' },
    { name: 'Tesla', industry: 'Automotive', icon: '⚡', category: 'global' },
];

const SUGGESTED_COMPANIES = ['Amazon', 'Google', 'Netflix', 'Spotify', 'Airbnb'];

const COMPANY_TABS = [
    { id: 'all', label: `All (${COMPANIES.length})` },
    { id: 'faang', label: `FAANG (${COMPANIES.filter(c => c.category === 'faang').length})` },
    { id: 'indian', label: `Indian (${COMPANIES.filter(c => c.category === 'indian').length})` },
    { id: 'global', label: `Global (${COMPANIES.filter(c => c.category === 'global').length})` },
];

/**
 * InterviewLobby — Multi-step setup wizard for interview configuration.
 *
 * Props:
 *  - setupStep / setSetupStep
 *  - experienceLevel / setExperienceLevel
 *  - interviewType / setInterviewType
 *  - interviewerGender / setInterviewerGender
 *  - targetRole / setTargetRole
 *  - targetCompany / setTargetCompany
 *  - companySearch / setCompanySearch
 *  - companyTab / setCompanyTab
 *  - resumeFile
 *  - loading
 *  - savedSession
 *  - interviewer          { name, role }
 *  - formatTime           (seconds) => string
 *  - onStartInterview     () => void
 *  - onRestoreSession     (session) => void
 *  - onClearSavedSession  () => void
 *  - onResumeDragOver     (e) => void
 *  - onResumeDragLeave    (e) => void
 *  - onResumeDrop         (e) => void
 *  - onResumeFileChange   (e) => void
 */

// ─── Device Preflight Component (Camera, Mic & Sound) ───
const DevicePreflightCheck = memo(function DevicePreflightCheck({
    cameraCheckStatus = 'not_checked',
    onCheckCamera,
    cameraStream,
    micCheckStatus = 'not_checked',
    onCheckMicrophone,
    micLevel = 0,
    speakerCheckStatus = 'not_checked',
    onTestSpeaker,
    preflightError,
}) {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    const isMicReady = String(micCheckStatus).startsWith('ready:');
    const isCameraReady = cameraCheckStatus === 'ready';

    return (
        <div className="ai-preflight-container">
            <div className="ai-preflight-header">
                <Sparkles size={16} className="ai-preflight-icon" />
                <div>
                    <h4 className="ai-preflight-title">Device & Readiness Check</h4>
                    <p className="ai-preflight-subtitle">Confirm your camera and microphone are working before entering</p>
                </div>
            </div>

            {preflightError && (
                <div className="ai-preflight-error-banner" role="alert">
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{preflightError}</span>
                </div>
            )}

            <div className="ai-preflight-grid">
                {/* Camera Card */}
                <div className={`ai-preflight-card ${isCameraReady ? 'is-ready' : cameraCheckStatus === 'denied' ? 'is-denied' : ''}`}>
                    <div className="ai-preflight-card-top">
                        <div className="ai-preflight-card-label">
                            <Video size={14} />
                            <span>Camera Preview</span>
                        </div>
                        <span className={`ai-preflight-status-pill ${isCameraReady ? 'ready' : cameraCheckStatus === 'denied' ? 'denied' : ''}`}>
                            {isCameraReady ? '✓ Working' : cameraCheckStatus === 'denied' ? 'Denied' : cameraCheckStatus === 'checking' ? 'Checking...' : 'Not Checked'}
                        </span>
                    </div>

                    <div className="ai-preflight-video-wrap">
                        {cameraStream ? (
                            <video ref={videoRef} autoPlay playsInline muted className="ai-preflight-video" />
                        ) : (
                            <div className="ai-preflight-video-placeholder">
                                <VideoOff size={22} style={{ opacity: 0.5 }} />
                                <span>{cameraCheckStatus === 'denied' ? 'Camera blocked in browser' : 'Click test to preview camera'}</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onCheckCamera}
                        className="ai-preflight-action-btn"
                        disabled={cameraCheckStatus === 'checking'}
                    >
                        <Video size={13} /> {isCameraReady ? 'Retest Camera' : 'Test Camera'}
                    </button>
                </div>

                {/* Microphone Card */}
                <div className={`ai-preflight-card ${isMicReady ? 'is-ready' : micCheckStatus === 'denied' ? 'is-denied' : ''}`}>
                    <div className="ai-preflight-card-top">
                        <div className="ai-preflight-card-label">
                            <Mic size={14} />
                            <span>Microphone Level</span>
                        </div>
                        <span className={`ai-preflight-status-pill ${isMicReady ? 'ready' : micCheckStatus === 'denied' ? 'denied' : ''}`}>
                            {isMicReady ? '✓ Working' : micCheckStatus === 'denied' ? 'Denied' : micCheckStatus === 'checking' ? 'Checking...' : 'Not Checked'}
                        </span>
                    </div>

                    <div className="ai-preflight-mic-info">
                        <span className="ai-preflight-device-name">
                            {isMicReady ? micCheckStatus.slice(6) : micCheckStatus === 'denied' ? 'Microphone blocked in browser' : 'Verify mic capture & volume'}
                        </span>

                        {/* Live volume equalizer meter */}
                        <div className="ai-preflight-volume-bar-wrap">
                            {[...Array(10)].map((_, i) => (
                                <span
                                    key={i}
                                    className={`ai-preflight-volume-tick ${micLevel > (i + 1) * 0.08 ? 'active' : ''}`}
                                />
                            ))}
                        </div>

                        <span className="ai-preflight-mic-hint">
                            {micLevel > 0.05 ? '🎙️ Voice detected!' : (isMicReady ? 'Speak to test volume' : 'Click test to verify mic')}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onCheckMicrophone}
                        className="ai-preflight-action-btn"
                        disabled={micCheckStatus === 'checking'}
                    >
                        <Mic size={13} /> {isMicReady ? 'Retest Mic' : 'Test Microphone'}
                    </button>
                </div>
            </div>

            {/* Speaker Sound Check Row */}
            <div className="ai-preflight-speaker-row">
                <div className="ai-preflight-speaker-left">
                    <Volume2 size={16} />
                    <div>
                        <strong>Speaker & Sound Check</strong>
                        <span>{speakerCheckStatus === 'ready' ? 'Sound ready! You will hear interviewer questions clearly.' : 'Test your audio output before starting.'}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onTestSpeaker}
                    className="ai-preflight-speaker-btn"
                    disabled={speakerCheckStatus === 'testing'}
                >
                    <Volume2 size={13} /> {speakerCheckStatus === 'ready' ? 'Retest sound' : 'Test speakers'}
                </button>
            </div>
        </div>
    );
});

function InterviewLobby({
    setupStep, setSetupStep,
    experienceLevel, setExperienceLevel,
    pacingMode = 'realistic', setPacingMode = () => {},
    realisticJitter = false, setRealisticJitter = () => {},
    interviewType, setInterviewType,
    interviewerGender, setInterviewerGender,
    targetRole, setTargetRole,
    targetCompany, setTargetCompany,
    companySearch, setCompanySearch,
    companyTab, setCompanyTab,
    resumeFile,
    activeResumeContext = null,
    onClearResumeContext = () => {},
    loading,
    savedSession,
    interviewer,
    formatTime,
    onStartInterview,
    onRestoreSession,
    onClearSavedSession,
    onResumeDragOver,
    onResumeDragLeave,
    onResumeDrop,
    onResumeFileChange,
    questionSetCode,
    customQuestionSet,
    questionSetLoading,
    questionSetError,
    questionSetAccessError,
    questionSetPasscode = '',
    onQuestionSetPasscodeChange,
    candidateEmail = '',
    onCandidateEmailChange,
    candidateName = '',
    onCandidateNameChange,
    resumeParseError,
    micCheckStatus = 'not_checked', onCheckMicrophone,
    cameraCheckStatus = 'not_checked', onCheckCamera,
    cameraStream = null, micLevel = 0, preflightError = null, onClearPreflightError,
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [speakerCheckStatus, setSpeakerCheckStatus] = React.useState('not_checked');
    const [lobbyNow, setLobbyNow] = React.useState(Date.now());

    React.useEffect(() => {
        if (!customQuestionSet?.scheduledAt) return;
        const timer = setInterval(() => setLobbyNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [customQuestionSet?.scheduledAt]);

    const scheduledStartTime = customQuestionSet?.scheduledAt ? new Date(customQuestionSet.scheduledAt).getTime() : null;
    const scheduledDurationMins = Number(customQuestionSet?.scheduledDurationMinutes) || 45;
    const earlyCheckinBufferMs = 10 * 60 * 1000;
    const sessionWindowEndTime = scheduledStartTime ? scheduledStartTime + (scheduledDurationMins + 30) * 60 * 1000 : null;

    const isUpcomingSchedule = Boolean(scheduledStartTime && lobbyNow < (scheduledStartTime - earlyCheckinBufferMs));
    const isScheduleExpired = Boolean(sessionWindowEndTime && lobbyNow > sessionWindowEndTime);
    const isScheduleOpen = Boolean(scheduledStartTime && !isUpcomingSchedule && !isScheduleExpired);

    const msUntilScheduled = scheduledStartTime ? Math.max(0, scheduledStartTime - lobbyNow) : 0;
    const hoursRemaining = Math.floor(msUntilScheduled / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msUntilScheduled % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((msUntilScheduled % (1000 * 60)) / 1000);
    const formattedCountdown = `${String(hoursRemaining).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsRemaining).padStart(2, '0')}`;

    const candidateTimezone = React.useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
        } catch {
            return 'Local Time';
        }
    }, []);

    const formattedScheduledDate = React.useMemo(() => {
        if (!scheduledStartTime) return '';
        try {
            return new Intl.DateTimeFormat(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            }).format(new Date(scheduledStartTime));
        } catch {
            return new Date(scheduledStartTime).toLocaleString();
        }
    }, [scheduledStartTime]);

    const googleCalendarUrl = React.useMemo(() => {
        if (!scheduledStartTime) return null;
        try {
            const start = new Date(scheduledStartTime);
            const end = new Date(start.getTime() + (scheduledDurationMins || 45) * 60 * 1000);
            const formatGCal = (d) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
            const dates = `${formatGCal(start)}/${formatGCal(end)}`;
            const joinUrl = typeof window !== 'undefined' ? window.location.href : '';
            const details = `Private Interview Session: ${customQuestionSet?.title || 'PrepLoop Assessment'}\nRole: ${customQuestionSet?.settings?.roleName || 'Candidate'}\nJoin Link: ${joinUrl}`;
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(customQuestionSet?.title || 'Private Interview')}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(joinUrl)}`;
        } catch {
            return null;
        }
    }, [scheduledStartTime, scheduledDurationMins, customQuestionSet?.title, customQuestionSet?.settings?.roleName]);

    const handleDownloadIcs = useCallback(() => {
        if (!scheduledStartTime) return;
        try {
            const start = new Date(scheduledStartTime);
            const end = new Date(start.getTime() + (scheduledDurationMins || 45) * 60 * 1000);
            const formatIcs = (d) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
            const joinUrl = typeof window !== 'undefined' ? window.location.href : '';
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//PrepLoop//Private Interview Session//EN',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'BEGIN:VEVENT',
                `SUMMARY:${customQuestionSet?.title || 'Private Interview Assessment'}`,
                `DESCRIPTION:Private Interview Session\\nRole: ${customQuestionSet?.settings?.roleName || 'Candidate'}\\nJoin URL: ${joinUrl}`,
                `LOCATION:${joinUrl}`,
                `DTSTART:${formatIcs(start)}`,
                `DTEND:${formatIcs(end)}`,
                `DTSTAMP:${formatIcs(new Date())}`,
                `UID:${Date.now()}@preploop.com`,
                'STATUS:CONFIRMED',
                'END:VEVENT',
                'END:VCALENDAR',
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${(customQuestionSet?.title || 'interview').replace(/[^a-z0-9]/gi, '_')}.ics`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch { /* empty */ }
    }, [scheduledStartTime, scheduledDurationMins, customQuestionSet?.title, customQuestionSet?.settings?.roleName]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const params = new URLSearchParams(window.location.search);
            const paramEmail = params.get('email');
            const paramName = params.get('name');
            if (paramEmail && !candidateEmail) {
                onCandidateEmailChange?.(paramEmail.trim());
            }
            if (paramName && !candidateName) {
                onCandidateNameChange?.(paramName.trim());
            }
        } catch { /* empty */ }
    }, [candidateEmail, candidateName, onCandidateEmailChange, onCandidateNameChange]);

    const isEmailPreFilledFromUrl = React.useMemo(() => {
        if (typeof window === 'undefined') return false;
        try {
            return Boolean(new URLSearchParams(window.location.search).get('email'));
        } catch {
            return false;
        }
    }, []);

    const handleTestSpeaker = useCallback(() => {
        setSpeakerCheckStatus('testing');
        try {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance('Audio check passed. Your speakers are ready for this voice interview.');
                utterance.rate = 1.0;
                utterance.onend = () => setSpeakerCheckStatus('ready');
                utterance.onerror = () => setSpeakerCheckStatus('ready');
                window.speechSynthesis.speak(utterance);
            } else {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
                setSpeakerCheckStatus('ready');
            }
        } catch {
            setSpeakerCheckStatus('ready');
        }
    }, []);

    // Derived: filtered companies
    const filteredCompanies = useMemo(() => COMPANIES.filter(c => {
        const matchTab = companyTab === 'all' || c.category === companyTab;
        const matchSearch = !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase());
        return matchTab && matchSearch;
    }), [companyTab, companySearch]);

    // Stable hover handlers for session recovery banner
    const onResumeMouseEnter = useCallback((e) => { e.currentTarget.style.opacity = '0.85'; }, []);
    const onResumeMouseLeave = useCallback((e) => { e.currentTarget.style.opacity = '1'; }, []);
    const onDiscardMouseEnter = useCallback((e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
        e.currentTarget.style.color = '#ef4444';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
    }, []);
    const onDiscardMouseLeave = useCallback((e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }, []);

    // ─── Custom Admin Question Set View ───
    if (questionSetCode) {
        if (questionSetLoading) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-modal" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '500px' }}>
                            <RefreshCw size={36} className="spin" style={{ color: '#818cf8', margin: '0 auto 16px', display: 'block' }} />
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Loading Custom Interview...</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>Preparing your assigned questions and environment.</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (questionSetError) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-modal" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '500px' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <X size={28} style={{ color: '#ef4444' }} />
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Interview Unavailable</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>{questionSetError}</p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button className="ai-setup-nav-btn ai-setup-nav-btn--prev" onClick={() => navigate('/app')}>
                                    Enter Different Token
                                </button>
                                <button className="ai-setup-nav-btn ai-setup-nav-btn--next" onClick={() => navigate('/')}>
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (customQuestionSet) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-glow ai-setup-glow--purple" />
                        <div className="ai-setup-glow ai-setup-glow--blue" />

                        <div className="ai-setup-modal" style={{ maxWidth: '640px', padding: '36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#a5b4fc', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <Sparkles size={14} /> Candidate Assessment
                                    </div>
                                    {(customQuestionSet.token || customQuestionSet.shareCode) && (
                                        <span style={{ color: '#38bdf8', fontSize: '11px', background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.2)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                            Token: {((customQuestionSet.token || customQuestionSet.shareCode).length > 16) ? `${(customQuestionSet.token || customQuestionSet.shareCode).slice(0, 8)}...` : (customQuestionSet.token || customQuestionSet.shareCode)}
                                        </span>
                                    )}
                                </div>
                                <button className="ai-setup-close" onClick={() => navigate('/interview-suite')} title="Close">
                                    <X size={20} />
                                </button>
                            </div>

                            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                                {customQuestionSet.title}
                            </h1>
                            {customQuestionSet.description && (
                                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                                    {customQuestionSet.description}
                                </p>
                            )}

                            {(customQuestionSet.requiresPasscode || customQuestionSet.expiresAt || customQuestionSet.remainingAttempts !== null || customQuestionSet.scheduledAt) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {customQuestionSet.scheduledAt && (
                                        <span style={{ color: '#38bdf8', fontSize: '12px', background: 'rgba(56,189,248,.1)', border: '1px solid rgba(56,189,248,.25)', padding: '6px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={13} /> Scheduled: {formattedScheduledDate} ({scheduledDurationMins}m)
                                        </span>
                                    )}
                                    {customQuestionSet.expiresAt && <span style={{ color: '#fbbf24', fontSize: '12px', background: 'rgba(251,191,36,.08)', padding: '6px 9px', borderRadius: '8px' }}>Link expires {new Date(customQuestionSet.expiresAt).toLocaleString()}</span>}
                                    {customQuestionSet.remainingAttempts !== null && <span style={{ color: '#a5b4fc', fontSize: '12px', background: 'rgba(129,140,248,.08)', padding: '6px 9px', borderRadius: '8px' }}>{customQuestionSet.remainingAttempts} attempt{customQuestionSet.remainingAttempts === 1 ? '' : 's'} remaining</span>}
                                </div>
                            )}

                            {/* Scheduled Interview Waiting Room or Active Schedule Banner */}
                            {isUpcomingSchedule && (
                                <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.08))', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '14px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                        <Clock size={16} /> Scheduled Session Waiting Room
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '30px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '1px', margin: '6px 0 8px' }}>
                                        {formattedCountdown}
                                    </div>
                                    <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', lineHeight: '1.5' }}>
                                        This private interview is scheduled for <strong>{formattedScheduledDate}</strong> ({candidateTimezone}).
                                    </div>
                                    <div style={{ color: '#93c5fd', fontSize: '12px', marginTop: '6px' }}>
                                        Please complete your camera, microphone, and speaker preflight checks below while waiting. The interview will unlock automatically at the scheduled time.
                                    </div>
                                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        {googleCalendarUrl && (
                                            <a
                                                href={googleCalendarUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(56, 189, 248, 0.15)',
                                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                                    color: '#7dd3fc',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                }}
                                                title="Add this scheduled session to your Google Calendar"
                                            >
                                                <Calendar size={13} /> Google Calendar
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleDownloadIcs}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                background: 'rgba(99, 102, 241, 0.15)',
                                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                                color: '#a5b4fc',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                            }}
                                            title="Download Outlook / Apple Calendar (.ics) file"
                                        >
                                            <Download size={13} /> Download .ics
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isScheduleOpen && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    <div style={{ fontSize: '13px', color: '#86efac' }}>
                                        <strong>Session Open:</strong> Scheduled for {new Date(scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({candidateTimezone}, {scheduledDurationMins} min fixed session). You may begin now.
                                    </div>
                                </div>
                            )}

                            {isScheduleExpired && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
                                    ⚠️ This scheduled interview session window has concluded. Please contact your interview organizer to reschedule.
                                </div>
                            )}

                            {customQuestionSet.requiresPasscode && (
                                <div className="form-group" style={{ marginBottom: '14px' }}>
                                    <label htmlFor="private-interview-passcode" style={{ color: '#e4e4e7', display: 'block', marginBottom: '6px' }}>Interview passcode</label>
                                    <input
                                        id="private-interview-passcode"
                                        type="password"
                                        autoComplete="current-password"
                                        value={questionSetPasscode}
                                        onChange={(event) => onQuestionSetPasscodeChange?.(event.target.value)}
                                        placeholder="Enter the passcode shared by the interviewer"
                                        maxLength={64}
                                        style={{ width: '100%' }}
                                    />
                                    {questionSetAccessError && <span role="alert" style={{ color: '#fca5a5', display: 'block', fontSize: '12px', marginTop: '6px' }}>{questionSetAccessError}</span>}
                                </div>
                            )}

                            {/* Candidate Identity Section */}
                            {user ? (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={15} style={{ color: '#818cf8' }} />
                                        <span style={{ fontSize: '13px', color: '#e4e4e7' }}>
                                            Taking assessment as <strong style={{ color: '#fff' }}>{user.user_metadata?.full_name || user.email}</strong>
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                        Verified
                                    </span>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                        Candidate Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label htmlFor="candidate-name" style={{ color: '#e4e4e7', display: 'block', marginBottom: '6px', fontSize: '12px' }}>
                                                Your Full Name
                                            </label>
                                            <input
                                                id="candidate-name"
                                                type="text"
                                                autoComplete="name"
                                                value={candidateName}
                                                onChange={(event) => onCandidateNameChange?.(event.target.value)}
                                                placeholder="e.g. Alex Johnson"
                                                maxLength={100}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label htmlFor="candidate-email" style={{ color: '#e4e4e7', display: 'block', marginBottom: '6px', fontSize: '12px' }}>
                                                Your Email Address {customQuestionSet.requiresEmailAllowlist && '*'}
                                                {isEmailPreFilledFromUrl && customQuestionSet.requiresEmailAllowlist && (
                                                    <span style={{ color: '#38bdf8', marginLeft: '6px', fontWeight: 'normal' }}>
                                                        (🔒 Locked from invite link)
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                id="candidate-email"
                                                type="email"
                                                autoComplete="email"
                                                value={candidateEmail}
                                                disabled={isEmailPreFilledFromUrl && customQuestionSet.requiresEmailAllowlist}
                                                onChange={(event) => onCandidateEmailChange?.(event.target.value)}
                                                placeholder={customQuestionSet.requiresEmailAllowlist ? 'Authorized invitee email' : 'e.g. alex@example.com'}
                                                maxLength={120}
                                                style={{
                                                    width: '100%',
                                                    opacity: (isEmailPreFilledFromUrl && customQuestionSet.requiresEmailAllowlist) ? 0.75 : 1,
                                                    cursor: (isEmailPreFilledFromUrl && customQuestionSet.requiresEmailAllowlist) ? 'not-allowed' : 'text',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {customQuestionSet.requiresEmailAllowlist && (
                                        <span style={{ color: '#f59e0b', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                                            This interview is restricted to pre-authorized invitee emails.
                                        </span>
                                    )}
                                    {questionSetAccessError && !customQuestionSet.requiresPasscode && (
                                        <span role="alert" style={{ color: '#fca5a5', display: 'block', fontSize: '12px', marginTop: '6px' }}>
                                            {questionSetAccessError}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div style={{ marginBottom: '18px' }}>
                                <DevicePreflightCheck
                                    cameraCheckStatus={cameraCheckStatus}
                                    onCheckCamera={onCheckCamera}
                                    cameraStream={cameraStream}
                                    micCheckStatus={micCheckStatus}
                                    onCheckMicrophone={onCheckMicrophone}
                                    micLevel={micLevel}
                                    speakerCheckStatus={speakerCheckStatus}
                                    onTestSpeaker={handleTestSpeaker}
                                    preflightError={preflightError}
                                />
                            </div>

                            {questionSetAccessError && !customQuestionSet.requiresPasscode && !customQuestionSet.requiresEmailAllowlist && <p role="alert" style={{ color: '#fca5a5', fontSize: '12px', margin: '10px 0 0' }}>{questionSetAccessError}</p>}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Company</div>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.settings?.companyName || 'Assigned'}</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Target Role</div>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.settings?.roleName || 'Software Engineer'}</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Questions</div>
                                    <div style={{ color: '#818cf8', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.questionCount} Fixed Qs</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Difficulty</div>
                                    <div style={{ color: '#34d399', fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{customQuestionSet.difficulty || 'Medium'}</div>
                                </div>
                            </div>

                            {customQuestionSet.settings?.customInstructions && (
                                <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
                                        <Sparkles size={15} /> Instructions from Interviewer
                                    </div>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                        {customQuestionSet.settings.customInstructions}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> AI Voice & Video Interviewer
                                </span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> Real-time Speech & Analysis
                                </span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> Detailed Score Breakdown
                                </span>
                            </div>

                            <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '11px', lineHeight: 1.5, margin: '14px 0 0', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                                🔒 <strong>Privacy &amp; Data Notice:</strong> Speech is processed using your browser's speech recognition vendor (Google/Apple/Microsoft) or Groq Whisper. Interview analysis is performed by AI providers (Groq / Google Gemini) with best-effort PII redaction. Any session audio and temporary artifacts are automatically deleted after 14 days.
                            </div>

                            <button
                                className="ai-setup-nav-btn ai-setup-nav-btn--next"
                                onClick={onStartInterview}
                                disabled={loading || isUpcomingSchedule || isScheduleExpired || !micCheckStatus.startsWith('ready:') || (customQuestionSet.requiresPasscode && !questionSetPasscode.trim()) || (customQuestionSet.requiresEmailAllowlist && !candidateEmail.trim()) || customQuestionSet.remainingAttempts === 0}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '16px 24px',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    opacity: (isUpcomingSchedule || isScheduleExpired) ? 0.65 : 1,
                                    cursor: (isUpcomingSchedule || isScheduleExpired) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isUpcomingSchedule ? (
                                    <>
                                        <Clock size={18} />
                                        Session Unlocks in {formattedCountdown}
                                    </>
                                ) : isScheduleExpired ? (
                                    <>
                                        <AlertTriangle size={18} />
                                        Scheduled Window Concluded
                                    </>
                                ) : loading ? (
                                    'Starting Interview...'
                                ) : (
                                    <>
                                        Begin Interview
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="ai-interview-page">
            <div className="ai-setup-backdrop">
                <div className="ai-setup-glow ai-setup-glow--purple" />
                <div className="ai-setup-glow ai-setup-glow--blue" />

                <div className="ai-setup-modal ai-setup-modal--wizard">
                    {/* Header */}
                    <div className="ai-setup-header">
                        <div>
                            <h1 className="ai-setup-title">Interview Setup</h1>
                            <p className="ai-setup-subtitle">{STEP_DESCRIPTIONS[setupStep]}</p>
                        </div>
                        <button className="ai-setup-close" onClick={() => navigate('/interview-suite')} title="Close">
                            <X size={20} />
                        </button>
                    </div>

                    {/* I9: Session Recovery Banner */}
                    {savedSession && (
                        <div className="ai-session-recovery ai-lobby-recovery-banner">
                            <div className="ai-lobby-recovery-icon">
                                <RefreshCw size={18} style={{ color: '#818cf8' }} />
                            </div>
                            <div className="ai-lobby-recovery-info">
                                <div className="ai-lobby-recovery-title">
                                    Resume Previous Session
                                </div>
                                <div className="ai-lobby-recovery-meta">
                                    {savedSession.interviewType} · Q{savedSession.questionIndex}/{savedSession.totalQuestions} · {formatTime(savedSession.elapsed || 0)} elapsed
                                </div>
                            </div>
                            <button
                                className="ai-lobby-recovery-resume-btn"
                                onClick={() => onRestoreSession(savedSession)}
                                onMouseEnter={onResumeMouseEnter}
                                onMouseLeave={onResumeMouseLeave}
                            >
                                Resume
                            </button>
                            <button
                                className="ai-lobby-recovery-discard-btn"
                                onClick={onClearSavedSession}
                                onMouseEnter={onDiscardMouseEnter}
                                onMouseLeave={onDiscardMouseLeave}
                            >
                                Discard
                            </button>
                        </div>
                    )}

                    {/* Candidate Token Quick Entry */}
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <KeyRound size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: '500' }}>
                                Have an interview link or token?
                            </span>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const val = (e.currentTarget.elements.assessmentToken?.value || '').trim();
                                if (!val) return;
                                let token = val;
                                try {
                                    if (val.includes('token=')) {
                                        const parsed = new URL(val.startsWith('http') ? val : `https://preploop.com/${val}`);
                                        token = parsed.searchParams.get('token') || val;
                                    } else if (val.includes('set=')) {
                                        const parsed = new URL(val.startsWith('http') ? val : `https://preploop.com/${val}`);
                                        token = parsed.searchParams.get('set') || val;
                                    }
                                } catch (err) {
                                    if (import.meta.env.DEV) console.warn('[token parse]', err);
                                }
                                navigate(`/app?token=${encodeURIComponent(token.trim())}`);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <input
                                name="assessmentToken"
                                placeholder="Paste token or link (e.g. 40247bbf-...)"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '8px',
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    color: '#fff',
                                    outline: 'none',
                                    width: '210px',
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Enter
                            </button>
                        </form>
                    </div>

                    {/* Stepper */}
                    <div className="ai-wizard-stepper">
                        {SETUP_STEPS.map((step, i) => (
                            <React.Fragment key={i}>
                                <div
                                    className={`ai-wizard-step ${i < setupStep ? 'completed' : ''} ${i === setupStep ? 'active' : ''}`}
                                    onClick={() => i <= setupStep && setSetupStep(i)}
                                >
                                    {i < setupStep ? <CheckCircle size={22} /> : <span>{i + 1}</span>}
                                </div>
                                {i < SETUP_STEPS.length - 1 && (
                                    <div className={`ai-wizard-connector ${i < setupStep ? 'completed' : ''}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="ai-wizard-content">
                        {/* ─── Step 0: Experience Level ─── */}
                        {setupStep === 0 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-experience-grid">
                                    <button
                                        className={`ai-setup-experience-card ${experienceLevel === 'fresher' ? 'selected' : ''}`}
                                        onClick={() => setExperienceLevel('fresher')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                            <GraduationCap size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Fresher</span>
                                            <span className="ai-setup-experience-desc">Fresh graduate or 0–1 years of experience. Questions focus on fundamentals, aptitude, and college projects.</span>
                                        </div>
                                        {experienceLevel === 'fresher' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        className={`ai-setup-experience-card ${experienceLevel === 'experienced' ? 'selected' : ''}`}
                                        onClick={() => setExperienceLevel('experienced')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                            <Briefcase size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Experienced</span>
                                            <span className="ai-setup-experience-desc">1+ years of industry experience. Questions focus on system design, leadership, and real-world problem solving.</span>
                                        </div>
                                        {experienceLevel === 'experienced' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                </div>
                                <div className="ai-setup-step-header" style={{ marginTop: '28px', marginBottom: '14px' }}>
                                    <h2 className="ai-setup-step-title" style={{ fontSize: '18px' }}>Interview Pacing</h2>
                                    <p className="ai-setup-step-subtitle" style={{ fontSize: '13px' }}>
                                        Choose how the AI interviewer adapts to pauses and think time
                                    </p>
                                </div>
                                <div className="ai-setup-experience-grid">
                                    <button
                                        type="button"
                                        className={`ai-setup-experience-card ${pacingMode === 'realistic' ? 'selected' : ''}`}
                                        onClick={() => setPacingMode('realistic')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                            <span style={{ fontSize: '20px' }}>⏱️</span>
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Realistic (Timed)</span>
                                            <span className="ai-setup-experience-desc">Company interview cadence. 12s nudge, 25s check-in, 3.5s auto-submit.</span>
                                        </div>
                                        {pacingMode === 'realistic' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        type="button"
                                        className={`ai-setup-experience-card ${pacingMode === 'relaxed' ? 'selected' : ''}`}
                                        onClick={() => setPacingMode('relaxed')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                            <span style={{ fontSize: '20px' }}>🌱</span>
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Relaxed (Practice)</span>
                                            <span className="ai-setup-experience-desc">Generous think time. 20s nudge, 40s check-in, 5s auto-submit. Ideal for practice.</span>
                                        </div>
                                        {pacingMode === 'relaxed' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                </div>
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px 14px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>Authentic Video Call Latency</div>
                                        <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Simulates realistic remote interview delays (500–1000ms latency & natural clarifies)</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRealisticJitter(!realisticJitter)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: realisticJitter ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                                            color: realisticJitter ? '#fff' : '#a1a1aa',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {realisticJitter ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 1: Interview Type ─── */}
                        {setupStep === 1 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-experience-grid">
                                    <button
                                        className={`ai-setup-experience-card ${interviewType === 'hr' ? 'selected' : ''}`}
                                        onClick={() => setInterviewType('hr')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                            <MessageSquare size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">HR Round</span>
                                            <span className="ai-setup-experience-desc">Behavioral and situational questions. Focus on culture fit, teamwork, and leadership.</span>
                                        </div>
                                        {interviewType === 'hr' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        className={`ai-setup-experience-card ${interviewType === 'technical' ? 'selected' : ''}`}
                                        onClick={() => setInterviewType('technical')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                            <Code2 size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Technical Round</span>
                                            <span className="ai-setup-experience-desc">Core technical skills, data structures, algorithms, and system design concepts.</span>
                                        </div>
                                        {interviewType === 'technical' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        className={`ai-setup-experience-card ${interviewType === 'peer' ? 'selected' : ''}`}
                                        onClick={() => setInterviewType('peer')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                            <Users size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Peer 1-on-1 Round</span>
                                            <span className="ai-setup-experience-desc">Collaborative live coding & interview practice with another peer in real-time.</span>
                                        </div>
                                        {interviewType === 'peer' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 2: Resume Upload ─── */}
                        {setupStep === 2 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-resume-section ai-setup-resume-section--open">
                                    <div className="ai-setup-resume-toggle" style={{ pointerEvents: 'none' }}>
                                        <div className="ai-setup-resume-left">
                                            <div className="ai-setup-resume-icon">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <div className="ai-setup-resume-title">
                                                    Add your resume
                                                    <span className="ai-setup-badge-rec">recommended</span>
                                                </div>
                                                <div className="ai-setup-resume-desc">
                                                    Personalizes questions to your background & projects
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ai-setup-resume-body expanded">
                                        <div
                                            className={`ai-setup-drop-zone ${resumeFile ? 'has-file' : ''}`}
                                            onClick={() => document.getElementById('resume-file-input')?.click()}
                                            onDragOver={onResumeDragOver}
                                            onDragLeave={onResumeDragLeave}
                                            onDrop={onResumeDrop}
                                        >
                                            {resumeFile ? (
                                                <>
                                                    <CheckCircle size={28} className="ai-setup-drop-icon" style={{ color: '#22c55e' }} />
                                                    <p className="ai-setup-drop-text" style={{ color: '#22c55e' }}>{resumeFile.name}</p>
                                                    <p className="ai-setup-drop-hint">Click to replace</p>
                                                </>
                                            ) : activeResumeContext ? (
                                                <>
                                                    <CheckCircle size={28} className="ai-setup-drop-icon" style={{ color: '#38bdf8' }} />
                                                    <p className="ai-setup-drop-text" style={{ color: '#38bdf8' }}>
                                                        {activeResumeContext.candidateHeadline || 'Linked Resume Profile Active'}
                                                    </p>
                                                    <p className="ai-setup-drop-hint">
                                                        Linked from ATS Analyzer {activeResumeContext.coreSkills?.length ? `(${activeResumeContext.coreSkills.slice(0, 3).join(', ')})` : ''} • Click to replace with new file
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onClearResumeContext();
                                                        }}
                                                        style={{
                                                            marginTop: 6,
                                                            padding: '3px 10px',
                                                            borderRadius: 6,
                                                            border: '1px solid rgba(255,255,255,0.15)',
                                                            background: 'rgba(255,255,255,0.08)',
                                                            color: '#94a3b8',
                                                            fontSize: 11,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Remove linked resume
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText size={28} className="ai-setup-drop-icon" />
                                                    <p className="ai-setup-drop-text">Drop your resume here or <span>browse files</span></p>
                                                    <p className="ai-setup-drop-hint">PDF or DOCX up to 5MB</p>
                                                </>
                                            )}
                                            {resumeParseError && (
                                                <div role="status" style={{ color: '#fbbf24', fontSize: '12px', marginTop: '10px' }}>
                                                    {resumeParseError}
                                                </div>
                                            )}
                                            <input
                                                id="resume-file-input"
                                                type="file"
                                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                style={{ display: 'none' }}
                                                onChange={onResumeFileChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 3: Target Role ─── */}
                        {setupStep === 3 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-wizard-field">
                                    <label className="ai-wizard-label">
                                        <span className="ai-wizard-label-dot" />
                                        Target Role
                                        <span className="ai-wizard-label-optional">(optional but Recommended)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="ai-wizard-input"
                                        placeholder="e.g. Senior Software Engineer, Backend Developer, Data Scientist..."
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* ─── Step 4: Company & Interviewer Preference ─── */}
                        {setupStep === 4 && (
                            <div className="ai-wizard-step-body">
                                {/* Gender Preference */}
                                <div className="ai-wizard-gender-picker">
                                    <span className="ai-wizard-gender-label">Interviewer Preference</span>
                                    <div className="ai-wizard-gender-toggle">
                                        <button
                                            className={`ai-wizard-gender-btn ${interviewerGender === 'male' ? 'selected' : ''}`}
                                            onClick={() => setInterviewerGender('male')}
                                        >
                                            <span className="ai-wizard-gender-emoji">👨‍💼</span>
                                            Male
                                        </button>
                                        <button
                                            className={`ai-wizard-gender-btn ${interviewerGender === 'female' ? 'selected' : ''}`}
                                            onClick={() => setInterviewerGender('female')}
                                        >
                                            <span className="ai-wizard-gender-emoji">👩‍💼</span>
                                            Female
                                        </button>
                                    </div>
                                </div>

                                {/* Suggested pills */}
                                <div className="ai-wizard-suggested">
                                    <span className="ai-wizard-suggested-label">Suggested for this problem</span>
                                    <div className="ai-wizard-suggested-pills">
                                        {SUGGESTED_COMPANIES.map((name) => (
                                            <button
                                                key={name}
                                                className={`ai-wizard-company-pill ${targetCompany === name ? 'selected' : ''}`}
                                                onClick={() => setTargetCompany(name)}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="ai-wizard-search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search companies..."
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                    />
                                </div>

                                {/* Tabs */}
                                <div className="ai-wizard-tabs">
                                    {COMPANY_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            className={`ai-wizard-tab ${companyTab === tab.id ? 'active' : ''}`}
                                            onClick={() => setCompanyTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Company grid */}
                                <div className="ai-wizard-company-grid">
                                    {filteredCompanies.map((company) => (
                                        <button
                                            key={company.name}
                                            className={`ai-wizard-company-card ${targetCompany === company.name ? 'selected' : ''}`}
                                            onClick={() => setTargetCompany(company.name)}
                                        >
                                            <div className="ai-wizard-company-top">
                                                <span className="ai-wizard-company-icon">{company.icon}</span>
                                                <span className="ai-wizard-company-name">{company.name}</span>
                                                {company.starred && <Star size={14} className="ai-wizard-company-star" />}
                                            </div>
                                            <span className="ai-wizard-company-industry">{company.industry}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─── Step 5: Review & Start ─── */}
                        {setupStep === 5 && (
                            <div className="ai-wizard-step-body">
                                <DevicePreflightCheck
                                        cameraCheckStatus={cameraCheckStatus}
                                        onCheckCamera={onCheckCamera}
                                        cameraStream={cameraStream}
                                        micCheckStatus={micCheckStatus}
                                        onCheckMicrophone={onCheckMicrophone}
                                        micLevel={micLevel}
                                        speakerCheckStatus={speakerCheckStatus}
                                        onTestSpeaker={handleTestSpeaker}
                                        preflightError={preflightError}
                                    />
                                <div className="ai-wizard-review">
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Experience</span>
                                        <span className="ai-wizard-review-value">
                                            {experienceLevel === 'fresher' ? '🎓 Fresher' : '💼 Experienced'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Pacing</span>
                                        <span className="ai-wizard-review-value">
                                            {pacingMode === 'relaxed' ? '🌱 Relaxed (Practice)' : '⏱️ Realistic (Timed)'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Interview Type</span>
                                        <span className="ai-wizard-review-value">
                                            {TOPIC_PILLS.find(t => t.id === interviewType)?.label || 'Technical Round'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Resume</span>
                                        <span className="ai-wizard-review-value">
                                            {resumeFile ? resumeFile.name : (activeResumeContext ? (activeResumeContext.candidateHeadline || 'Linked ATS Resume Profile') : '—  Not uploaded')}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Target Role</span>
                                        <span className="ai-wizard-review-value">
                                            {targetRole || '—  Not specified'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Target Company</span>
                                        <span className="ai-wizard-review-value">
                                            {targetCompany || '—  Not specified'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Interviewer</span>
                                        <span className="ai-wizard-review-value">
                                            {interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'} {interviewer.name} · {interviewer.role}
                                        </span>
                                    </div>
                                    
                                    <div className="ai-wizard-review-row ai-lobby-review-divider">
                                        <span className="ai-wizard-review-label ai-lobby-realtime-label">
                                            <Zap size={14} className="ai-lobby-realtime-icon" /> Real-Time Voice
                                            <span className="ai-lobby-beta-badge">COMING SOON</span>
                                        </span>
                                        <span className="ai-lobby-realtime-status">Classic voice enabled</span>
                                    </div>
                                    <div className="ai-lobby-realtime-desc">
                                        Real-time voice infrastructure is being finalized. Your interview will use the reliable classic voice flow.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar */}
                    <div className="ai-wizard-nav">
                        <button
                            className="ai-wizard-nav-btn ai-wizard-nav-btn--back"
                            onClick={() => setSetupStep(s => Math.max(0, s - 1))}
                            disabled={setupStep === 0}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="ai-wizard-nav-right">
                            {setupStep < 5 && (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--skip"
                                    onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                >
                                    Skip
                                </button>
                            )}
                            {setupStep < 5 ? (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--next"
                                    onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--next ai-setup-start-btn"
                                    onClick={onStartInterview}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Sparkles size={18} className="ai-setup-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>Start Interview <ArrowRight size={16} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="ai-setup-privacy" style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: '1.4' }}>
                        🔒 <strong>Privacy:</strong> Speech processed via browser speech vendors or Groq Whisper. AI evaluation (Groq / Gemini) uses best-effort redaction. Session recordings deleted after 14 days.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(InterviewLobby);
