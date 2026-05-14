import React, { memo, useCallback, useMemo } from 'react';
import {
    Mic, MicOff, Video, VideoOff, Volume2, VolumeX,
    Play, Pause, Captions, CaptionsOff, MessageSquare,
    Bookmark, Phone,
} from 'lucide-react';

/**
 * InterviewControls — Floating controls bar for the video call.
 *
 * Extracted to prevent re-renders from high-frequency state updates
 * (voice visualization, timer ticks) from touching the control buttons.
 */
function InterviewControls({
    micOn, toggleMic, isListening,
    cameraOn, toggleCamera,
    speakerMuted, setSpeakerMuted,
    isPaused, onTogglePause,
    captionsOn, setCaptionsOn,
    chatOpen, setChatOpen,
    bookmarked, setBookmarked,
    endInterview,
    connectionMode,
}) {
    return (
        <div className="ai-vc-controls">
            <div className="ai-vc-controls-group">
                {/* Mic */}
                <button
                    className={`ai-vc-ctrl ${!micOn ? 'ai-vc-ctrl--off' : ''} ${isListening ? 'ai-vc-ctrl--listening' : ''}`}
                    onClick={toggleMic}
                    title={micOn ? (isListening ? 'Stop listening' : 'Mute') : 'Unmute & start listening'}
                    aria-label={micOn ? (isListening ? 'Microphone on, actively listening. Click to stop.' : 'Microphone on. Click to mute.') : 'Microphone muted. Click to unmute and start listening.'}
                    aria-pressed={micOn}
                >
                    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                    <span className="ai-vc-ctrl-label">{isListening ? 'Listening...' : micOn ? 'Mic' : 'Muted'}</span>
                    {isListening && <span className="ai-vc-listening-dot" />}
                    {isListening && (
                        <span className="ai-vc-conn-mode-badge">
                            {connectionMode === 'websocket' ? 'WS' : connectionMode === 'rest' ? 'REST' : 'OFF'}
                        </span>
                    )}
                    {connectionMode === 'rest' && isListening && (
                        <span className="ai-vc-conn-indicator ai-vc-conn-indicator--rest" title="Using REST fallback (slower transcription)">⚡</span>
                    )}
                </button>

                {/* Camera */}
                <button
                    className={`ai-vc-ctrl ${!cameraOn ? 'ai-vc-ctrl--off' : ''}`}
                    onClick={toggleCamera}
                    title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                    aria-label={cameraOn ? 'Camera on. Click to turn off.' : 'Camera off. Click to turn on.'}
                    aria-pressed={cameraOn}
                >
                    {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                    <span className="ai-vc-ctrl-label">{cameraOn ? 'Camera' : 'Off'}</span>
                </button>

                {/* Speaker */}
                <button
                    className={`ai-vc-ctrl ${speakerMuted ? 'ai-vc-ctrl--off' : ''}`}
                    onClick={() => setSpeakerMuted(p => !p)}
                    title={speakerMuted ? 'Unmute speaker' : 'Mute speaker'}
                    aria-label={speakerMuted ? 'Speaker muted. Click to unmute.' : 'Speaker on. Click to mute.'}
                    aria-pressed={!speakerMuted}
                >
                    {speakerMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    <span className="ai-vc-ctrl-label">{speakerMuted ? 'Speaker Off' : 'Speaker'}</span>
                </button>
            </div>

            <div className="ai-vc-controls-divider" />

            {/* Pause / Resume */}
            <div className="ai-vc-controls-group">
                <button
                    className={`ai-vc-ctrl ${isPaused ? 'ai-vc-ctrl--active' : ''}`}
                    onClick={onTogglePause}
                    title={isPaused ? 'Resume interview' : 'Pause interview'}
                    aria-label={isPaused ? 'Interview paused. Click to resume.' : 'Interview running. Click to pause.'}
                    aria-pressed={isPaused}
                >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    <span className="ai-vc-ctrl-label">{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
            </div>

            <div className="ai-vc-controls-divider" />

            <div className="ai-vc-controls-group">
                {/* Captions */}
                <button
                    className={`ai-vc-ctrl ${captionsOn ? 'ai-vc-ctrl--active' : ''}`}
                    onClick={() => setCaptionsOn(p => !p)}
                    title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
                    aria-label={captionsOn ? 'Captions on. Click to turn off.' : 'Captions off. Click to turn on.'}
                    aria-pressed={captionsOn}
                >
                    {captionsOn ? <Captions size={18} /> : <CaptionsOff size={18} />}
                    <span className="ai-vc-ctrl-label">{captionsOn ? 'CC' : 'CC Off'}</span>
                </button>

                {/* Chat */}
                <button
                    className={`ai-vc-ctrl ${chatOpen ? 'ai-vc-ctrl--active' : ''}`}
                    onClick={() => setChatOpen(p => !p)}
                    title="Chat"
                >
                    <MessageSquare size={18} />
                    <span className="ai-vc-ctrl-label">Chat</span>
                </button>

                {/* Bookmark */}
                <button
                    className={`ai-vc-ctrl ${bookmarked ? 'ai-vc-ctrl--active' : ''}`}
                    onClick={() => setBookmarked(p => !p)}
                    title="Bookmark"
                >
                    <Bookmark size={18} />
                    <span className="ai-vc-ctrl-label">Bookmark</span>
                </button>
            </div>

            <div className="ai-vc-controls-divider" />

            {/* End */}
            <button
                className="ai-vc-ctrl ai-vc-ctrl--end"
                onClick={endInterview}
                title="End"
                aria-label="End the interview session"
            >
                <Phone size={18} style={{ transform: 'rotate(135deg)' }} />
                <span className="ai-vc-ctrl-label">End</span>
            </button>
        </div>
    );
}

export default memo(InterviewControls);
