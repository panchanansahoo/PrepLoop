/**
 * interviewSounds.js
 *
 * Synthetic audio cues for interview turn-taking and notifications using Web Audio API.
 * Requires zero external audio files (.mp3/.wav), works completely offline,
 * and produces zero 404 network requests.
 */

let audioCtx = null;

function getAudioContext() {
    try {
        if (!audioCtx && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    } catch {
        return null;
    }
}

/**
 * Play a gentle, crisp two-tone chime signaling it's the candidate's turn to speak.
 * Frequencies: 523.25 Hz (C5) -> 659.25 Hz (E5)
 */
export function playTurnChime(muted = false) {
    if (muted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        gainNode.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.setValueAtTime(659.25, now + 0.12);
        osc1.connect(gainNode);

        osc1.start(now);
        osc1.stop(now + 0.35);
    } catch {
        // Audio synthesis fallback: fail silently
    }
}

/**
 * Play a subtle confirmation tone when the candidate's answer is captured/submitted.
 */
export function playSentChime(muted = false) {
    if (muted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        osc.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.22);
    } catch {
        // Audio synthesis fallback
    }
}

/**
 * Play a subtle soft reminder when 30s remain on a question timer.
 */
export function playWarningChime(muted = false) {
    if (muted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.05, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.25);
    } catch {
        // Audio synthesis fallback
    }
}

