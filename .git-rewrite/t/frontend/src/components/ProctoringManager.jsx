import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield, AlertTriangle, Eye, EyeOff, Monitor } from 'lucide-react';

/**
 * ProctoringManager — Anti-cheat detection for interview sessions
 * 
 * Detects:
 * - Tab switches (visibility change)
 * - Face not detected (from emotion detector metrics)
 * - Multiple faces (future: via MediaPipe/face detection API)
 * - Window blur events
 */
export default function ProctoringManager({
    enabled = true,
    isActive = false, // Only monitor during active interview
    emotionMetrics,
    onViolation,
    violations = []
}) {
    const [latestAlert, setLatestAlert] = useState(null);
    const alertTimeoutRef = useRef(null);
    const tabSwitchCountRef = useRef(0);

    // ── Log a violation ──
    const logViolation = useCallback((type, message) => {
        if (!enabled || !isActive) return;

        const violation = {
            type,
            message,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        onViolation?.(violation);
        setLatestAlert(violation);

        // Clear alert after 3 seconds
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => setLatestAlert(null), 3000);
    }, [enabled, isActive, onViolation]);

    // ── Tab switch / visibility change detection ──
    useEffect(() => {
        if (!enabled || !isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabSwitchCountRef.current++;
                logViolation('tab_switch', `Tab switch detected (#${tabSwitchCountRef.current})`);
            }
        };

        const handleWindowBlur = () => {
            logViolation('window_blur', 'Window lost focus');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            clearTimeout(alertTimeoutRef.current);
        };
    }, [enabled, isActive, logViolation]);

    // ── Face detection monitoring (from EmotionDetector metrics) ──
    const lastFaceCheckRef = useRef(Date.now());
    useEffect(() => {
        if (!enabled || !isActive || !emotionMetrics) return;

        // Only check every 5 seconds to avoid spam
        const now = Date.now();
        if (now - lastFaceCheckRef.current < 5000) return;
        lastFaceCheckRef.current = now;

        // If engagement score is 0 or gaze is off-screen for extended time
        if (emotionMetrics.engagementScore === 0 && emotionMetrics.gazeDirection === 'off-screen') {
            logViolation('face_not_detected', 'Face not detected — please face the camera');
        }
    }, [enabled, isActive, emotionMetrics, logViolation]);

    if (!enabled || !isActive) return null;

    // Determine proctoring status
    const recentViolations = violations.filter(v =>
        Date.now() - new Date(v.timestamp).getTime() < 60000
    );
    const status = recentViolations.length === 0 ? 'good'
        : recentViolations.length <= 2 ? 'warning'
            : 'alert';

    return (
        <>
            {/* Status Bar */}
            <div className="proctoring-bar">
                <div className="proctoring-status">
                    <div className={`proctoring-dot ${status}`} />
                    <Shield size={12} />
                    <span>Proctoring {status === 'good' ? 'Active' : status === 'warning' ? '⚠ Alert' : '🚨 Warning'}</span>
                </div>
                {violations.length > 0 && (
                    <div className="proctoring-violations">
                        <AlertTriangle size={12} />
                        {violations.length} violation{violations.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Alert popup */}
            {latestAlert && (
                <div className="proctor-alert">
                    <AlertTriangle size={16} />
                    {latestAlert.message}
                </div>
            )}
        </>
    );
}
