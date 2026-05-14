/**
 * VoiceWaveform — Animated equalizer-style waveform bar visualization
 *
 * Props:
 *   bars      number[]   — 0..1 normalized amplitude per bar
 *   color     string     — CSS color for bars (can be gradient via CSS var)
 *   height    number     — container height in px (default 48)
 *   active    boolean    — when false, shows idle breathing animation
 *   voiceState string    — 'idle' | 'listening' | 'speaking' | 'processing'
 *   className string     — extra class names
 */
import React from 'react';
import './VoiceWaveform.css';

const IDLE_PATTERN = [0.15, 0.25, 0.35, 0.25, 0.15, 0.25, 0.35, 0.25];

const STATE_COLORS = {
    idle:       'var(--waveform-idle, #6366f1)',
    listening:  'var(--waveform-listening, #22c55e)',
    speaking:   'var(--waveform-speaking, #8b5cf6)',
    processing: 'var(--waveform-processing, #f59e0b)',
};

export default function VoiceWaveform({
    bars       = IDLE_PATTERN,
    color      = null,
    height     = 48,
    active     = false,
    state      = null,
    voiceState = 'idle',
    className  = '',
}) {
    const resolvedState = state || voiceState || 'idle';
    const normalizedBars = bars.map(b => {
        const v = typeof b === 'number' ? b : 0;
        return v > 1 ? v / 100 : Math.max(0, Math.min(1, v));
    });

    const resolvedColor = color || STATE_COLORS[resolvedState] || STATE_COLORS.idle;
    const stateClass = `vw-${resolvedState}`;

    return (
        <div
            className={`vw-root ${active ? 'vw-active' : 'vw-idle'} ${stateClass} ${className}`}
            style={{ height, '--waveform-color': resolvedColor }}
            role="img"
            aria-label={`Voice ${resolvedState}: ${active ? 'active' : 'idle'}`}
            data-state={resolvedState}
        >
            {normalizedBars.map((level, i) => (
                <span
                    key={i}
                    className="vw-bar"
                    style={{
                        height: `${Math.max(8, Math.round(level * 100))}%`,
                        animationDelay: `${i * 0.07}s`,
                        transitionDuration: voiceState === 'speaking' ? '80ms' : '150ms',
                    }}
                />
            ))}
        </div>
    );
}
