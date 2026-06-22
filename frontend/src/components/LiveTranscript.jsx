/**
 * LiveTranscript — Real-time scrolling transcript display
 *
 * Shows a stream of text with a blinking cursor, auto-scrolls to bottom.
 * Uses a typewriter effect for AI speech labels.
 *
 * Props:
 *   text        string   — current partial transcript (updates in real-time)
 *   label       string   — speaker label "You" or "Interviewer"
 *   active      boolean  — whether currently being written (shows cursor)
 *   className   string
 */
import { useEffect, useRef } from 'react';
import './LiveTranscript.css';

export default function LiveTranscript({
    text      = '',
    label     = 'You',
    active    = false,
    className = '',
}) {
    const containerRef = useRef(null);

    // Auto-scroll to bottom whenever text updates
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [text]);

    if (!text && !active) return null;

    return (
        <div className={`lt-root ${className}`} ref={containerRef}>
            <span className="lt-label">{label}</span>
            <p className="lt-text">
                {text}
                {active && <span className="lt-cursor" aria-hidden="true" />}
            </p>
        </div>
    );
}
