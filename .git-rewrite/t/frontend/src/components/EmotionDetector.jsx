import React, { useEffect, useRef, useState, useCallback } from 'react';
import './emotionDetector.css';

/**
 * EmotionDetector — MediaPipe FaceMesh-based emotion & body language analysis
 * Detects: gaze direction, smile score, eye openness, head pose, engagement score
 * 
 * Loads MediaPipe via CDN scripts (no npm install needed)
 * Gracefully degrades if MediaPipe fails or browser is unsupported
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe';

export default function EmotionDetector({ videoRef, enabled = true, onMetricsUpdate }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);
    const metricsHistoryRef = useRef([]);
    const intervalRef = useRef(null);
    const scriptLoadedRef = useRef(false);

    // ── Load MediaPipe scripts from CDN ──
    const loadScript = useCallback((src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }, []);

    // ── Distance helper ──
    const dist = (a, b) => Math.sqrt(
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2
    );

    // ── Analyze face landmarks ──
    const analyzeFace = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 468) return null;

        // Smile detection: ratio of mouth width to mouth height
        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        const mouthWidth = dist(leftMouth, rightMouth);
        const mouthHeight = dist(topLip, bottomLip);
        const smileRatio = mouthWidth / Math.max(mouthHeight, 0.001);
        const smileScore = Math.min(100, Math.max(0, (smileRatio - 2.5) * 25));

        // Eye openness (left eye)
        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];
        const leftEyeWidth = dist(landmarks[33], landmarks[133]);
        const leftEyeHeight = dist(leftEyeTop, leftEyeBottom);
        const leftEyeRatio = leftEyeHeight / Math.max(leftEyeWidth, 0.001);

        // Eye openness (right eye)
        const rightEyeTop = landmarks[386];
        const rightEyeBottom = landmarks[374];
        const rightEyeWidth = dist(landmarks[362], landmarks[263]);
        const rightEyeHeight = dist(rightEyeTop, rightEyeBottom);
        const rightEyeRatio = rightEyeHeight / Math.max(rightEyeWidth, 0.001);

        const avgEyeOpenness = (leftEyeRatio + rightEyeRatio) / 2;
        const eyeOpennessScore = Math.min(100, Math.max(0, avgEyeOpenness * 250));

        // Gaze direction (simplified: distance of iris from eye center)
        // Left iris center: landmark 468, Right iris center: landmark 473
        const leftIris = landmarks[468] || landmarks[159];
        const rightIris = landmarks[473] || landmarks[386];
        const leftEyeCenter = {
            x: (landmarks[33].x + landmarks[133].x) / 2,
            y: (landmarks[33].y + landmarks[133].y) / 2
        };
        const rightEyeCenter = {
            x: (landmarks[362].x + landmarks[263].x) / 2,
            y: (landmarks[362].y + landmarks[263].y) / 2
        };

        const leftGazeOffset = dist(leftIris, leftEyeCenter);
        const rightGazeOffset = dist(rightIris, rightEyeCenter);
        const avgGazeOffset = (leftGazeOffset + rightGazeOffset) / 2;
        const lookingAtCamera = avgGazeOffset < 0.025;
        const gazeScore = lookingAtCamera ? 100 : Math.max(0, 100 - avgGazeOffset * 2000);

        // Head pose (yaw from nose tip vs face center)
        const noseTip = landmarks[1];
        const faceCenter = {
            x: (landmarks[234].x + landmarks[454].x) / 2,
            y: (landmarks[10].y + landmarks[152].y) / 2
        };
        const yawOffset = Math.abs(noseTip.x - faceCenter.x);
        const pitchOffset = Math.abs(noseTip.y - faceCenter.y);
        const headPoseScore = Math.max(0, 100 - (yawOffset + pitchOffset) * 500);

        // Engagement score (composite)
        const engagement = Math.round(
            gazeScore * 0.35 +
            smileScore * 0.20 +
            eyeOpennessScore * 0.20 +
            headPoseScore * 0.25
        );

        return {
            smileScore: Math.round(smileScore),
            gazeScore: Math.round(gazeScore),
            eyeOpennessScore: Math.round(eyeOpennessScore),
            headPoseScore: Math.round(headPoseScore),
            lookingAtCamera,
            engagementScore: Math.min(100, Math.max(0, engagement))
        };
    }, []);

    // ── Initialize MediaPipe FaceMesh ──
    useEffect(() => {
        if (!enabled || !videoRef?.current) return;

        let cancelled = false;

        async function init() {
            try {
                // Load MediaPipe scripts
                await loadScript(`${CDN_BASE}/face_mesh@0.4.1633559619/face_mesh.js`);
                await loadScript(`${CDN_BASE}/camera_utils@0.3.1640029074/camera_utils.js`);

                if (cancelled) return;

                // Access global MediaPipe objects
                const { FaceMesh } = window;
                const { Camera } = window;

                if (!FaceMesh || !Camera) {
                    setError('MediaPipe not available');
                    return;
                }

                const faceMesh = new FaceMesh({
                    locateFile: (file) => `${CDN_BASE}/face_mesh@0.4.1633559619/${file}`
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results) => {
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const faceMetrics = analyzeFace(results.multiFaceLandmarks[0]);
                        if (faceMetrics) {
                            metricsHistoryRef.current.push(faceMetrics);
                            // Keep last 30 frames (~2 seconds at 15fps)
                            if (metricsHistoryRef.current.length > 30) {
                                metricsHistoryRef.current.shift();
                            }
                        }
                    }
                });

                faceMeshRef.current = faceMesh;

                // Camera feed
                const video = videoRef.current;
                if (video && video.srcObject) {
                    const camera = new Camera(video, {
                        onFrame: async () => {
                            if (faceMeshRef.current) {
                                await faceMeshRef.current.send({ image: video });
                            }
                        },
                        width: 320,
                        height: 240,
                    });
                    camera.start();
                    cameraRef.current = camera;
                }

                if (!cancelled) {
                    setLoaded(true);
                    scriptLoadedRef.current = true;
                }

            } catch (err) {
                console.warn('EmotionDetector: MediaPipe init failed:', err);
                if (!cancelled) setError(err.message);
            }
        }

        init();

        return () => {
            cancelled = true;
            cameraRef.current?.stop();
            faceMeshRef.current?.close();
        };
    }, [enabled, videoRef, loadScript, analyzeFace]);

    // ── Report aggregated metrics every 2 seconds ──
    useEffect(() => {
        if (!loaded) return;

        intervalRef.current = setInterval(() => {
            const history = metricsHistoryRef.current;
            if (history.length === 0) return;

            const avg = {
                smileScore: Math.round(history.reduce((s, m) => s + m.smileScore, 0) / history.length),
                gazeScore: Math.round(history.reduce((s, m) => s + m.gazeScore, 0) / history.length),
                eyeOpennessScore: Math.round(history.reduce((s, m) => s + m.eyeOpennessScore, 0) / history.length),
                headPoseScore: Math.round(history.reduce((s, m) => s + m.headPoseScore, 0) / history.length),
                lookingAtCamera: history.filter(m => m.lookingAtCamera).length > history.length / 2,
                engagementScore: Math.round(history.reduce((s, m) => s + m.engagementScore, 0) / history.length),
            };

            setMetrics(avg);
            onMetricsUpdate?.(avg);
        }, 2000);

        return () => clearInterval(intervalRef.current);
    }, [loaded, onMetricsUpdate]);

    // ── Render ──
    if (!enabled) return null;

    if (error) {
        return (
            <div className="ed-badge ed-error">
                <span className="ed-badge-icon">⚠️</span>
                <span>Body language unavailable</span>
            </div>
        );
    }

    if (!loaded) {
        return (
            <div className="ed-badge ed-loading">
                <span className="ed-badge-icon">🔄</span>
                <span>Loading face analysis...</span>
            </div>
        );
    }

    if (!metrics) return null;

    const getEngagementEmoji = (score) => {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        return '🔴';
    };

    return (
        <div className="ed-overlay">
            <div className="ed-badge-row">
                <div className={`ed-metric ${metrics.lookingAtCamera ? 'ed-good' : 'ed-warn'}`}>
                    <span className="ed-metric-icon">👁</span>
                    <span>{metrics.lookingAtCamera ? 'Eye Contact ✓' : 'Look at Camera'}</span>
                </div>

                {metrics.smileScore > 30 && (
                    <div className="ed-metric ed-good">
                        <span className="ed-metric-icon">😊</span>
                        <span>Smiling</span>
                    </div>
                )}

                <div className={`ed-metric ${metrics.engagementScore >= 70 ? 'ed-good' : metrics.engagementScore >= 50 ? 'ed-ok' : 'ed-warn'}`}>
                    <span className="ed-metric-icon">{getEngagementEmoji(metrics.engagementScore)}</span>
                    <span>{metrics.engagementScore}%</span>
                </div>
            </div>
        </div>
    );
}
