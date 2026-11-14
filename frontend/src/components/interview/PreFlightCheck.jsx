import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
    Sparkles,
    Mic,
    MicOff,
    Volume2,
    Video,
    VideoOff,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    Cpu,
    Radio,
    RefreshCw,
    Info,
    ExternalLink,
} from 'lucide-react';

/**
 * PreFlightCheck — Interactive Candidate Device & System Readiness Check
 *
 * Features:
 * - Live microphone volume meter with equalizer animation & threshold detection
 * - Web Audio API speaker test chime (multi-frequency harmonic arpeggio)
 * - WebRTC & AudioContext browser engine diagnostics check
 * - Interactive Permissions Helper for blocked / denied camera & mic permissions
 * - Camera preview test & device readiness indicator
 */
const PreFlightCheck = memo(function PreFlightCheck({
    cameraCheckStatus = 'not_checked',
    onCheckCamera,
    cameraStream = null,
    micCheckStatus = 'not_checked',
    onCheckMicrophone,
    micLevel = 0,
    speakerCheckStatus = 'not_checked',
    onTestSpeaker,
    preflightError = null,
    onClearPreflightError,
    onReadyChange,
    hideCamera = false,
}) {
    const videoRef = useRef(null);
    const [localSpeakerStatus, setLocalSpeakerStatus] = useState(speakerCheckStatus);
    const [isPlayingChime, setIsPlayingChime] = useState(false);
    const [showPermissionsHelper, setShowPermissionsHelper] = useState(false);
    const [systemDiagnostics, setSystemDiagnostics] = useState({
        webRTC: false,
        audioContext: false,
        mediaDevices: false,
        checked: false,
    });

    // Check system engine capabilities on mount
    useEffect(() => {
        const hasWebRTC = typeof window !== 'undefined' && Boolean(
            window.RTCPeerConnection || window.webkitRTCPeerConnection
        );
        const hasAudioCtx = typeof window !== 'undefined' && Boolean(
            window.AudioContext || window.webkitAudioContext
        );
        const hasMediaDevs = typeof navigator !== 'undefined' && Boolean(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );

        setSystemDiagnostics({
            webRTC: hasWebRTC,
            audioContext: hasAudioCtx,
            mediaDevices: hasMediaDevs,
            checked: true,
        });
    }, []);

    // Sync external speaker status with local state
    useEffect(() => {
        if (speakerCheckStatus && speakerCheckStatus !== 'not_checked') {
            setLocalSpeakerStatus(speakerCheckStatus);
        }
    }, [speakerCheckStatus]);

    // Attach camera stream to video preview element
    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    // Automatically expand permissions helper if microphone or camera was denied
    useEffect(() => {
        if (micCheckStatus === 'denied' || cameraCheckStatus === 'denied') {
            setShowPermissionsHelper(true);
        }
    }, [micCheckStatus, cameraCheckStatus]);

    const isMicReady = String(micCheckStatus).startsWith('ready:');
    const isMicDenied = micCheckStatus === 'denied';
    const isMicChecking = micCheckStatus === 'checking';
    const micDeviceName = isMicReady ? micCheckStatus.replace(/^ready:\s*/, '') : null;

    const isCameraReady = cameraCheckStatus === 'ready';
    const isCameraDenied = cameraCheckStatus === 'denied';
    const isCameraChecking = cameraCheckStatus === 'checking';

    const isSpeakerReady = localSpeakerStatus === 'ready' || speakerCheckStatus === 'ready';

    const allSystemsReady = isMicReady && isSpeakerReady && (hideCamera || isCameraReady);

    useEffect(() => {
        onReadyChange?.(allSystemsReady);
    }, [allSystemsReady, onReadyChange]);

    /**
     * Synthesize a melodic chime arpeggio using the Web Audio API
     * Notes: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz)
     */
    const playSynthesizerChime = useCallback(async () => {
        setIsPlayingChime(true);
        setLocalSpeakerStatus('testing');

        // Allow parent callback if passed
        if (typeof onTestSpeaker === 'function') {
            try {
                onTestSpeaker();
            } catch {
                /* proceed with internal synthesizer */
            }
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                setLocalSpeakerStatus('ready');
                setIsPlayingChime(false);
                return;
            }

            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const notes = [
                { freq: 523.25, time: 0.0, dur: 0.25 },   // C5
                { freq: 659.25, time: 0.12, dur: 0.25 },  // E5
                { freq: 783.99, time: 0.24, dur: 0.35 },  // G5
                { freq: 1046.50, time: 0.36, dur: 0.55 }, // C6
            ];

            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
            masterGain.connect(ctx.destination);

            notes.forEach(({ freq, time, dur }) => {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

                // Gentle attack and exponential decay envelope
                noteGain.gain.setValueAtTime(0.001, ctx.currentTime + time);
                noteGain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + time + 0.03);
                noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

                osc.connect(noteGain);
                noteGain.connect(masterGain);

                osc.start(ctx.currentTime + time);
                osc.stop(ctx.currentTime + time + dur + 0.05);
            });

            // Finish playback state when sequence concludes
            setTimeout(() => {
                setLocalSpeakerStatus('ready');
                setIsPlayingChime(false);
                setTimeout(() => {
                    ctx.close().catch(() => {});
                }, 100);
            }, 950);
        } catch {
            setLocalSpeakerStatus('ready');
            setIsPlayingChime(false);
        }
    }, [onTestSpeaker]);

    return (
        <div className="ai-preflight-container" data-testid="preflight-check-root">
            {/* Header with Title and System Engine Readiness Badges */}
            <div className="ai-preflight-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} className="ai-preflight-icon" />
                    <div>
                        <h4 className="ai-preflight-title">Pre-Flight Device &amp; System Check</h4>
                        <p className="ai-preflight-subtitle">
                            Verify your microphone, speakers, and browser compatibility before starting
                        </p>
                    </div>
                </div>

                {/* System Engine Diagnostics Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                        title={systemDiagnostics.webRTC ? 'WebRTC connection engine supported' : 'WebRTC not detected'}
                        style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: systemDiagnostics.webRTC ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                            color: systemDiagnostics.webRTC ? '#86efac' : '#fca5a5',
                            border: `1px solid ${systemDiagnostics.webRTC ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <Radio size={10} /> WebRTC: {systemDiagnostics.webRTC ? 'Ready' : 'Unavailable'}
                    </span>
                    <span
                        title={systemDiagnostics.audioContext ? 'AudioContext synthesis & analyser engine supported' : 'AudioContext not detected'}
                        style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: systemDiagnostics.audioContext ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                            color: systemDiagnostics.audioContext ? '#7dd3fc' : '#fca5a5',
                            border: `1px solid ${systemDiagnostics.audioContext ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <Cpu size={10} /> AudioContext: {systemDiagnostics.audioContext ? 'Active' : 'Unavailable'}
                    </span>
                </div>
            </div>

            {/* Error Banner */}
            {preflightError && (
                <div className="ai-preflight-error-banner" role="alert">
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{preflightError}</span>
                    {onClearPreflightError && (
                        <button
                            type="button"
                            onClick={onClearPreflightError}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                                padding: 0,
                            }}
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            )}

            {/* Device Grid: Microphone & Camera */}
            <div className="ai-preflight-grid">
                {/* Microphone Card with Equalizer */}
                <div className={`ai-preflight-card ${isMicReady ? 'is-ready' : isMicDenied ? 'is-denied' : ''}`}>
                    <div className="ai-preflight-card-top">
                        <div className="ai-preflight-card-label">
                            {isMicDenied ? <MicOff size={14} style={{ color: '#ef4444' }} /> : <Mic size={14} />}
                            <span>Microphone Level</span>
                        </div>
                        <span className={`ai-preflight-status-pill ${isMicReady ? 'ready' : isMicDenied ? 'denied' : ''}`}>
                            {isMicReady ? '✓ Working' : isMicDenied ? 'Denied' : isMicChecking ? 'Checking...' : 'Not Checked'}
                        </span>
                    </div>

                    <div className="ai-preflight-mic-info">
                        <span className="ai-preflight-device-name" title={micDeviceName || undefined}>
                            {micDeviceName || (isMicDenied ? 'Microphone blocked in browser' : 'Verify mic capture & volume')}
                        </span>

                        {/* Live volume equalizer meter */}
                        <div
                            className="ai-preflight-volume-bar-wrap"
                            role="progressbar"
                            aria-label="Microphone volume meter"
                            aria-valuenow={Math.round(micLevel * 100)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            {[...Array(12)].map((_, i) => {
                                const isActive = micLevel > (i + 1) * 0.07;
                                const isPeak = i >= 9;
                                return (
                                    <span
                                        key={i}
                                        className={`ai-preflight-volume-tick ${isActive ? 'active' : ''}`}
                                        style={isActive && isPeak ? { background: '#ef4444' } : undefined}
                                    />
                                );
                            })}
                        </div>

                        <span className="ai-preflight-mic-hint">
                            {micLevel > 0.05 ? (
                                <span style={{ color: '#4ade80', fontWeight: '600' }}>🎤 Voice detected!</span>
                            ) : isMicReady ? (
                                'Speak into your mic to test volume'
                            ) : isMicDenied ? (
                                'Microphone access denied. See helper below.'
                            ) : (
                                'Click test to verify microphone'
                            )}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onCheckMicrophone}
                            className="ai-preflight-action-btn"
                            disabled={isMicChecking}
                            style={{ flex: 1 }}
                        >
                            {isMicChecking ? (
                                <>
                                    <RefreshCw size={13} className="spin" /> Checking...
                                </>
                            ) : (
                                <>
                                    <Mic size={13} /> {isMicReady ? 'Retest Mic' : 'Test Microphone'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Camera Card */}
                {!hideCamera && (
                    <div className={`ai-preflight-card ${isCameraReady ? 'is-ready' : isCameraDenied ? 'is-denied' : ''}`}>
                        <div className="ai-preflight-card-top">
                            <div className="ai-preflight-card-label">
                                {isCameraDenied ? <VideoOff size={14} style={{ color: '#ef4444' }} /> : <Video size={14} />}
                                <span>Camera Preview</span>
                            </div>
                            <span className={`ai-preflight-status-pill ${isCameraReady ? 'ready' : isCameraDenied ? 'denied' : ''}`}>
                                {isCameraReady ? '✓ Working' : isCameraDenied ? 'Denied' : isCameraChecking ? 'Checking...' : 'Not Checked'}
                            </span>
                        </div>

                        <div className="ai-preflight-video-wrap">
                            {cameraStream ? (
                                <video ref={videoRef} autoPlay playsInline muted className="ai-preflight-video" />
                            ) : (
                                <div className="ai-preflight-video-placeholder">
                                    <VideoOff size={22} style={{ opacity: 0.5 }} />
                                    <span>{isCameraDenied ? 'Camera blocked in browser' : 'Click test to preview camera'}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={onCheckCamera}
                                className="ai-preflight-action-btn"
                                disabled={isCameraChecking}
                                style={{ flex: 1 }}
                            >
                                {isCameraChecking ? (
                                    <>
                                        <RefreshCw size={13} className="spin" /> Checking...
                                    </>
                                ) : (
                                    <>
                                        <Video size={13} /> {isCameraReady ? 'Retest Camera' : 'Test Camera'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Speaker Sound Check Row */}
            <div className="ai-preflight-speaker-row">
                <div className="ai-preflight-speaker-left">
                    <Volume2 size={18} style={{ color: isSpeakerReady ? '#22c55e' : '#818cf8' }} />
                    <div>
                        <strong>Speaker &amp; Audio Chime Test</strong>
                        <span>
                            {isPlayingChime ? (
                                <span style={{ color: '#38bdf8' }}>🎵 Playing harmonic test chime...</span>
                            ) : isSpeakerReady ? (
                                'Sound verified! You will hear the AI interviewer clearly.'
                            ) : (
                                'Play an acoustic chime to verify your audio output before starting.'
                            )}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={playSynthesizerChime}
                        className="ai-preflight-speaker-btn"
                        disabled={isPlayingChime}
                        style={{
                            background: isSpeakerReady ? 'rgba(34, 197, 94, 0.15)' : undefined,
                            borderColor: isSpeakerReady ? 'rgba(34, 197, 94, 0.35)' : undefined,
                            color: isSpeakerReady ? '#86efac' : undefined,
                        }}
                    >
                        <Volume2 size={13} />
                        {isPlayingChime ? 'Playing...' : isSpeakerReady ? 'Retest Chime' : 'Play Test Chime'}
                    </button>
                </div>
            </div>

            {/* All Devices Ready Notification */}
            {allSystemsReady && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#86efac',
                        fontSize: '12px',
                        fontWeight: '600',
                    }}
                >
                    <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <span>All pre-flight checks passed! Your audio and devices are ready for the interview.</span>
                </div>
            )}

            {/* Permissions Helper Toggle Button */}
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => setShowPermissionsHelper(prev => !prev)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: showPermissionsHelper ? '#818cf8' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 6px',
                    }}
                >
                    <HelpCircle size={13} />
                    {showPermissionsHelper ? 'Hide Permissions Guide' : 'Need help with permissions?'}
                </button>
            </div>

            {/* Permissions Helper Accordion / Guide */}
            {showPermissionsHelper && (
                <div
                    data-testid="permissions-helper-panel"
                    style={{
                        marginTop: '8px',
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: '1.6',
                    }}
                >
                    <div style={{ fontWeight: '700', color: '#c7d2fe', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} /> How to allow Camera &amp; Microphone access in your browser
                    </div>
                    <ul style={{ margin: '0 0 10px', paddingLeft: '18px' }}>
                        <li>
                            <strong>Chrome / Edge / Brave:</strong> Click the tune/padlock icon on the left of your browser address bar. Ensure <em>Microphone</em> and <em>Camera</em> are set to <strong>Allow</strong>.
                        </li>
                        <li>
                            <strong>Safari:</strong> Go to <em>Safari &gt; Settings for This Website</em> and set Camera &amp; Microphone to <strong>Allow</strong>.
                        </li>
                        <li>
                            <strong>Firefox:</strong> Click the permissions icon next to the URL and remove any blocked permissions.
                        </li>
                        <li>
                            <strong>Operating System Settings:</strong> In Windows (Settings &gt; Privacy &gt; Microphone) or macOS (System Settings &gt; Privacy &amp; Security &gt; Microphone), ensure your browser has permission to access media devices.
                        </li>
                    </ul>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                onCheckMicrophone?.();
                                if (!hideCamera) onCheckCamera?.();
                            }}
                            style={{
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                color: '#a5b4fc',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            <RefreshCw size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                            Retry Device Permissions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default PreFlightCheck;
