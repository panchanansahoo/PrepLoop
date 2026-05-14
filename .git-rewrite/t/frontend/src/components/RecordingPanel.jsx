import React, { useState, useRef, useEffect } from 'react';
import { Video, Mic, Square, Play, Pause, RotateCcw, Download, X } from 'lucide-react';

export default function RecordingPanel({ onClose }) {
    const [recording, setRecording] = useState(false);
    const [paused, setPaused] = useState(false);
    const [mediaBlob, setMediaBlob] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [recordingType, setRecordingType] = useState(null); // 'video' | 'audio'
    const [permissionError, setPermissionError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const previewRef = useRef(null);
    const timerRef = useRef(null);

    const startRecording = async (type) => {
        try {
            setPermissionError(null);
            const constraints = type === 'video'
                ? { video: true, audio: true }
                : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            setRecordingType(type);
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream, {
                mimeType: type === 'video' ? 'video/webm' : 'audio/webm',
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: type === 'video' ? 'video/webm' : 'audio/webm',
                });
                setMediaBlob(blob);
                setMediaUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setRecording(true);
            setPaused(false);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            setPermissionError('Camera/microphone access denied. Please allow permissions.');
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;
        if (paused) {
            mediaRecorderRef.current.resume();
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
        } else {
            mediaRecorderRef.current.pause();
            clearInterval(timerRef.current);
        }
        setPaused(!paused);
    };

    const resetRecording = () => {
        if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        setMediaBlob(null);
        setMediaUrl(null);
        setDuration(0);
        setRecording(false);
        setRecordingType(null);
    };

    const downloadRecording = () => {
        if (!mediaBlob) return;
        const ext = recordingType === 'video' ? 'webm' : 'webm';
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = `preploop-${recordingType}-${Date.now()}.${ext}`;
        a.click();
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        };
    }, []);

    return (
        <div className="rec-panel">
            <div className="rec-header">
                <h3><Video size={16} /> Recording Studio</h3>
                {onClose && (
                    <button className="rec-close" onClick={onClose}><X size={16} /></button>
                )}
            </div>

            {permissionError && (
                <div className="rec-error">{permissionError}</div>
            )}

            {/* Idle — Choose type */}
            {!recording && !mediaUrl && (
                <div className="rec-type-select">
                    <button className="rec-type-btn" onClick={() => startRecording('video')}>
                        <Video size={20} />
                        <span>Record Video</span>
                    </button>
                    <button className="rec-type-btn" onClick={() => startRecording('audio')}>
                        <Mic size={20} />
                        <span>Record Audio</span>
                    </button>
                </div>
            )}

            {/* Recording active */}
            {recording && (
                <div className="rec-active">
                    <div className="rec-indicator">
                        <span className="rec-dot" />
                        <span>{paused ? 'Paused' : 'Recording'}</span>
                        <span className="rec-timer">{formatTime(duration)}</span>
                    </div>
                    <div className="rec-controls">
                        <button className="rec-ctrl-btn" onClick={togglePause}>
                            {paused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button className="rec-ctrl-btn rec-stop" onClick={stopRecording}>
                            <Square size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Playback */}
            {mediaUrl && !recording && (
                <div className="rec-playback">
                    {recordingType === 'video' ? (
                        <video ref={previewRef} src={mediaUrl} controls className="rec-video" />
                    ) : (
                        <audio src={mediaUrl} controls className="rec-audio" />
                    )}
                    <div className="rec-playback-info">
                        <span>Duration: {formatTime(duration)}</span>
                        <span>Type: {recordingType}</span>
                    </div>

                    {/* AI Analysis placeholder */}
                    <div className="rec-ai-badge">
                        <span>🤖 AI Speech Analysis</span>
                        <span className="rec-ai-coming">Coming Soon</span>
                    </div>

                    <div className="rec-playback-actions">
                        <button className="rec-action-btn" onClick={downloadRecording}>
                            <Download size={14} /> Download
                        </button>
                        <button className="rec-action-btn rec-reset" onClick={resetRecording}>
                            <RotateCcw size={14} /> Record Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
