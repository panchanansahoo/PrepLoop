/**
 * VoiceWaveform — Animated equalizer-style waveform bar visualization
 *
 * Optimized with React.memo to prevent re-renders when props don't change.
 * This is critical during STT capture where parent components may re-render
 * frequently due to other state changes (timers, UI updates, etc).
 *
 * Props:
 *   bars      number[]   — 0..1 normalized amplitude per bar
 *   color     string     — CSS color for bars (can be gradient via CSS var)
 *   height    number     — container height in px (default 48)
 *   active    boolean    — when false, shows idle breathing animation
 *   voiceState string    — 'idle' | 'listening' | 'speaking' | 'processing'
 *   className string     — extra class names
 */
import React, { useMemo } from 'react';
import './VoiceWaveform.css';

const IDLE_PATTERN = [0.15, 0.25, 0.35, 0.25, 0.15, 0.25, 0.35, 0.25];

const STATE_COLORS = {
    idle:       'var(--waveform-idle, #6366f1)',
    listening:  'var(--waveform-listening, #22c55e)',
    speaking:   'var(--waveform-speaking, #8b5cf6)',
    processing: 'var(--waveform-processing, #f59e0b)',
};

function VoiceWaveformComponent({
    bars       = IDLE_PATTERN,
    color      = null,
    height     = 48,
    active     = false,
    state      = null,
    voiceState = 'idle',
    className  = '',
}) {
    const resolvedState = state || voiceState || 'idle';
    
    // Memoize normalized bars calculation to prevent recalculation on every render
    const normalizedBars = useMemo(() => {
        return bars.map(b => {
            const v = typeof b === 'number' ? b : 0;
            return v > 1 ? v / 100 : Math.max(0, Math.min(1, v));
        });
    }, [bars]);

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

// Memoize component with custom comparison for array props
const VoiceWaveform = React.memo(VoiceWaveformComponent, (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    // Custom comparison for bars array to do shallow comparison instead of reference check
    const barsChanged = 
        prevProps.bars?.length !== nextProps.bars?.length ||
        (prevProps.bars && nextProps.bars && 
         prevProps.bars.some((val, idx) => val !== nextProps.bars[idx]));
    
    if (barsChanged) return false; // Props changed, re-render
    
    // For other props, use reference equality
    return (
        prevProps.color === nextProps.color &&
        prevProps.height === nextProps.height &&
        prevProps.active === nextProps.active &&
        prevProps.state === nextProps.state &&
        prevProps.voiceState === nextProps.voiceState &&
        prevProps.className === nextProps.className
    );
});

VoiceWaveform.displayName = 'VoiceWaveform';

export default VoiceWaveform;
