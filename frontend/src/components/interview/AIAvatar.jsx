import { useState, useRef, useEffect } from 'react';

// ─── AI Avatar Canvas Component (Human photo with animated rings) ───
export default function AIAvatar({ speaking, pose = 'neutral', companyColor, companyLogo, size = 'large' }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const phaseRef = useRef(0);
    const imgRef = useRef(null);
    const imgLoadedRef = useRef(false);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;
    const [retryCount, setRetryCount] = useState(0);
    const [loadError, setLoadError] = useState(false);

    // Load image with retry logic
    const loadImage = () => {
        const img = new Image();
        img.src = '/ai-interviewer.webp';
        
        img.onload = () => { 
            imgRef.current = img; 
            imgLoadedRef.current = true;
            retryCountRef.current = 0;
            setRetryCount(0);
            setLoadError(false);
            console.log('✅ AI avatar image loaded successfully');
        };
        
        img.onerror = () => {
            imgLoadedRef.current = false;
            retryCountRef.current += 1;
            setRetryCount(retryCountRef.current);
            
            if (retryCountRef.current < MAX_RETRIES) {
                console.warn(`⚠️ Failed to load AI avatar image (attempt ${retryCountRef.current}/${MAX_RETRIES}), retrying...`);
                // Exponential backoff: 1s, 2s, 4s
                const delayMs = Math.pow(2, retryCountRef.current - 1) * 1000;
                setTimeout(loadImage, delayMs);
            } else {
                console.error('❌ Failed to load AI avatar image after max retries, using fallback');
                setLoadError(true);
            }
        };
    };

    useEffect(() => {
        loadImage();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = size === 'large' ? 280 : 140;
        const h = canvas.height = size === 'large' ? 280 : 140;
        const cx = w / 2, cy = h / 2;

        const draw = () => {
            phaseRef.current += 0.03;
            ctx.clearRect(0, 0, w, h);

            // Background gradient
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
            bg.addColorStop(0, 'rgba(15, 15, 25, 1)');
            bg.addColorStop(1, 'rgba(5, 5, 12, 1)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            const baseRadius = size === 'large' ? 60 : 32;
            const ringCount = speaking ? 5 : 3;

            // Animated rings
            for (let i = ringCount; i >= 0; i--) {
                const pulse = speaking
                    ? Math.sin(phaseRef.current * 2 + i * 0.8) * (8 + i * 3)
                    : Math.sin(phaseRef.current + i * 0.6) * 3;
                const r = baseRadius + i * (size === 'large' ? 18 : 10) + pulse;
                const alpha = speaking
                    ? 0.15 - i * 0.025
                    : 0.06 - i * 0.015;

                ctx.beginPath();
                ctx.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
                ctx.strokeStyle = `${companyColor}${Math.round(Math.max(alpha, 0.01) * 255).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = speaking ? 2.5 : 1.5;
                ctx.stroke();
            }

            // Circular human photo with talking animation
            if (imgLoadedRef.current && imgRef.current) {
                ctx.save();

                // Subtle posture changes so interviewer feels less static.
                const isListeningPose = pose === 'listening';
                const isThinkingPose = pose === 'thinking';
                const isSpeakingPose = speaking || pose === 'speaking';
                const isNotesPose = pose === 'notes';

                if (isListeningPose) {
                    const listenTilt = -0.035 + Math.sin(phaseRef.current * 1.6) * 0.012;
                    ctx.translate(cx, cy);
                    ctx.rotate(listenTilt);
                    ctx.translate(-cx, -cy);
                }

                if (isThinkingPose) {
                    const thinkingTilt = 0.028 + Math.sin(phaseRef.current * 1.2) * 0.01;
                    const thinkingNod = Math.sin(phaseRef.current * 1.8) * (size === 'large' ? 1.4 : 0.8);
                    ctx.translate(cx, cy + thinkingNod);
                    ctx.rotate(thinkingTilt);
                    ctx.translate(-cx, -cy);
                }

                if (isNotesPose) {
                    const notesTilt = 0.085 + Math.sin(phaseRef.current * 1.1) * 0.01;
                    const notesDrop = size === 'large' ? 3.2 : 1.8;
                    ctx.translate(cx, cy + notesDrop);
                    ctx.rotate(notesTilt);
                    ctx.translate(-cx, -cy);
                }

                // Speaking: subtle scale breathing + gentle bounce
                if (isSpeakingPose) {
                    const breathe = 1 + Math.sin(phaseRef.current * 3) * 0.018;
                    const bounceY = Math.sin(phaseRef.current * 2.5) * (size === 'large' ? 1.5 : 0.8);
                    ctx.translate(cx, cy + bounceY);
                    ctx.scale(breathe, breathe);
                    ctx.translate(-cx, -cy);
                }

                // Clip to circle and draw photo
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius - 3, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                const imgSize = (baseRadius - 3) * 2;
                ctx.drawImage(imgRef.current, cx - baseRadius + 3, cy - baseRadius + 3, imgSize, imgSize);

                // Speaking: jaw/mouth area glow to simulate talking
                if (isSpeakingPose) {
                    const mouthOpen = (Math.sin(phaseRef.current * 6) + 1) * 0.5;
                    const jawGlow = ctx.createRadialGradient(cx, cy + baseRadius * 0.35, 2, cx, cy + baseRadius * 0.35, baseRadius * 0.5);
                    jawGlow.addColorStop(0, `rgba(255,255,255,${0.06 + mouthOpen * 0.1})`);
                    jawGlow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = jawGlow;
                    ctx.fillRect(cx - baseRadius, cy, baseRadius * 2, baseRadius);
                }

                ctx.restore();

                // Animated border ring — pulses brighter when speaking
                const borderGlow = isSpeakingPose
                    ? (Math.sin(phaseRef.current * 3) + 1) * 0.3 + 0.4
                    : 0.25;
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius - 2, 0, Math.PI * 2);
                ctx.strokeStyle = `${companyColor}${Math.round(borderGlow * 255).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = size === 'large' ? 3 : 2;
                ctx.stroke();

                // Speaking: outer glow halo
                if (isSpeakingPose) {
                    const haloR = size === 'large' ? 8 : 5;
                    const halo = ctx.createRadialGradient(cx, cy, baseRadius - 2, cx, cy, baseRadius + haloR);
                    halo.addColorStop(0, `${companyColor}18`);
                    halo.addColorStop(1, `${companyColor}00`);
                    ctx.fillStyle = halo;
                    ctx.beginPath();
                    ctx.arc(cx, cy, baseRadius + haloR, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Fallback glow while image loads or on error
                const innerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius);
                innerGlow.addColorStop(0, `${companyColor}30`);
                innerGlow.addColorStop(1, `${companyColor}08`);
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = innerGlow;
                ctx.fill();

                const fontSize = size === 'large' ? 38 : 22;

                // Animated loading/error state indicator
                if (loadError) {
                    // Error state: show X with pulsing background
                    ctx.fillStyle = `${companyColor}40`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Pulsing X indicator
                    const pulse = 0.7 + Math.sin(phaseRef.current * 2) * 0.3;
                    ctx.font = `${fontSize * pulse}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = companyColor;
                    ctx.globalAlpha = 0.7 + Math.sin(phaseRef.current) * 0.3;
                    ctx.fillText('⚠️', cx, cy);
                    ctx.globalAlpha = 1;
                } else {
                    // Loading state: show spinning logo
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(phaseRef.current * 1.5);
                    ctx.translate(-cx, -cy);
                    
                    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = 0.6 + Math.sin(phaseRef.current * 3) * 0.4;
                    ctx.fillText(companyLogo, cx, cy);
                    ctx.globalAlpha = 1;
                    ctx.restore();
                    
                    // Spinning ring indicator
                    const spinnerRadius = baseRadius + (size === 'large' ? 15 : 8);
                    ctx.beginPath();
                    ctx.arc(cx, cy, spinnerRadius, phaseRef.current, phaseRef.current + 1.5);
                    ctx.strokeStyle = `${companyColor}60`;
                    ctx.lineWidth = size === 'large' ? 2 : 1.5;
                    ctx.stroke();
                }
            }

            // Speaking wave bars
            if (speaking || pose === 'speaking') {
                const barCount = 7;
                const barWidth = size === 'large' ? 4 : 2.5;
                const gap = size === 'large' ? 5 : 3;
                const totalW = barCount * barWidth + (barCount - 1) * gap;
                const startX = cx - totalW / 2;
                const barY = cy + baseRadius + (size === 'large' ? 22 : 12);

                for (let b = 0; b < barCount; b++) {
                    const barH = (Math.sin(phaseRef.current * 5 + b * 0.9) + 1) * (size === 'large' ? 10 : 6) + 3;
                    const x = startX + b * (barWidth + gap);
                    ctx.fillStyle = companyColor;
                    ctx.globalAlpha = 0.6 + Math.sin(phaseRef.current * 3 + b) * 0.2;
                    ctx.beginPath();
                    ctx.roundRect(x, barY - barH / 2, barWidth, barH, 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            animRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [speaking, pose, companyColor, companyLogo, size]);

    return (
        <canvas
            ref={canvasRef}
            className="ti-avatar-canvas"
            style={{ width: size === 'large' ? 280 : 140, height: size === 'large' ? 280 : 140 }}
        />
    );
}
