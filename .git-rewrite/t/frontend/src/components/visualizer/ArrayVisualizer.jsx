import { useMemo, useEffect, useRef, useState, useCallback } from 'react';

// ─── Premium color palette with richer tones ───
const COLORS = {
  default: '#fbbf24',
  comparing: '#60a5fa',
  swapping: '#f43f5e',
  sorted: '#22c55e',
  pivot: '#f97316',
  found: '#22d3ee',
  eliminated: 'rgba(255,255,255,0.06)',
  range: 'rgba(34,197,94,0.15)',
  checked: 'rgba(255,255,255,0.08)',
  minIndex: '#f472b6',
};

// Gradient fills for bars — gives them rich, dimensional look
const BAR_GRADIENTS = {
  default: 'linear-gradient(180deg, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.08) 100%)',
  comparing: 'linear-gradient(180deg, rgba(96,165,250,0.35) 0%, rgba(96,165,250,0.10) 100%)',
  swapping: 'linear-gradient(180deg, rgba(244,63,94,0.40) 0%, rgba(244,63,94,0.12) 100%)',
  sorted: 'linear-gradient(180deg, rgba(34,197,94,0.30) 0%, rgba(34,197,94,0.08) 100%)',
  pivot: 'linear-gradient(180deg, rgba(249,115,22,0.35) 0%, rgba(249,115,22,0.10) 100%)',
  found: 'linear-gradient(180deg, rgba(34,211,238,0.40) 0%, rgba(34,211,238,0.12) 100%)',
  eliminated: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  checked: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  minIndex: 'linear-gradient(180deg, rgba(244,114,182,0.35) 0%, rgba(244,114,182,0.10) 100%)',
};

// Inner shine overlay for 3D depth
const BAR_SHINE = {
  default: 'rgba(251,191,36,0.12)',
  comparing: 'rgba(96,165,250,0.15)',
  swapping: 'rgba(244,63,94,0.18)',
  sorted: 'rgba(34,197,94,0.12)',
  pivot: 'rgba(249,115,22,0.15)',
  found: 'rgba(34,211,238,0.18)',
  eliminated: 'transparent',
  checked: 'transparent',
  minIndex: 'rgba(244,114,182,0.15)',
};

const STATE_ICONS = {
  default: '',
  comparing: '👀',
  swapping: '🔄',
  sorted: '✓',
  pivot: '📌',
  found: '🎯',
  eliminated: '',
  checked: '',
  minIndex: '↓',
};

const STATE_GLOW = {
  default: 'none',
  comparing: '0 0 20px rgba(96,165,250,0.35), 0 4px 30px rgba(96,165,250,0.12)',
  swapping: '0 0 28px rgba(244,63,94,0.45), 0 4px 30px rgba(244,63,94,0.15)',
  sorted: '0 0 16px rgba(34,197,94,0.3), 0 4px 20px rgba(34,197,94,0.1)',
  pivot: '0 0 22px rgba(249,115,22,0.4), 0 4px 25px rgba(249,115,22,0.12)',
  found: '0 0 30px rgba(34,211,238,0.5), 0 0 60px rgba(34,211,238,0.2)',
  eliminated: 'none',
  checked: 'none',
  minIndex: '0 0 18px rgba(244,114,182,0.35), 0 4px 25px rgba(244,114,182,0.1)',
};

const STATE_LABELS = {
  default: '',
  comparing: 'CMP',
  swapping: 'SWAP',
  sorted: 'DONE',
  pivot: 'PIV',
  found: 'FOUND',
  eliminated: '',
  checked: '',
  minIndex: 'MIN',
};

export default function ArrayVisualizer({ step, algorithmId }) {
  const safeStep = step || {};
  const {
    array = [],
    highlights = [],
    sorted = [],
    swapping,
    comparing,
    found,
    left,
    right,
    mid,
    eliminated = [],
    checked = [],
    pivot,
    partitionBoundary,
    minIndex,
    windowStart,
    windowEnd,
  } = safeStep;

  const isSearchAlgo = algorithmId?.includes('search');
  const isTwoPointers = algorithmId === 'two-pointers';
  const isSlidingWindow = algorithmId === 'sliding-window';
  const isAllNumbers = array.every(v => typeof v === 'number');

  // Track swap animation positions & value changes
  const prevArrayRef = useRef(array);
  const prevStepRef = useRef(null);
  const [swapAnim, setSwapAnim] = useState(null);
  const [changedIndices, setChangedIndices] = useState(new Set());

  useEffect(() => {
    // Detect value changes for flash animation
    if (prevArrayRef.current && prevArrayRef.current.length === array.length) {
      const changed = new Set();
      for (let i = 0; i < array.length; i++) {
        if (prevArrayRef.current[i] !== array[i]) changed.add(i);
      }
      if (changed.size > 0) {
        setChangedIndices(changed);
        const timer = setTimeout(() => setChangedIndices(new Set()), 600);
        return () => clearTimeout(timer);
      }
    }

    if (swapping && highlights.length === 2) {
      setSwapAnim({ a: highlights[0], b: highlights[1] });
      const timer = setTimeout(() => setSwapAnim(null), 550);
      return () => clearTimeout(timer);
    }
    prevArrayRef.current = [...array];
    prevStepRef.current = step;
  }, [step]);

  const getState = useCallback((index) => {
    if (found !== undefined && found === index) return 'found';
    if (swapping && highlights.includes(index)) return 'swapping';
    if (comparing && highlights.includes(index)) return 'comparing';
    if (pivot !== undefined && pivot === index) return 'pivot';
    if (minIndex !== undefined && minIndex === index) return 'minIndex';
    if (highlights.includes(index)) return 'comparing';
    if (sorted.includes(index)) return 'sorted';
    if (eliminated.includes(index)) return 'eliminated';
    if (checked.includes(index)) return 'checked';
    return 'default';
  }, [found, swapping, comparing, pivot, minIndex, highlights, sorted, eliminated, checked]);

  if (array.length === 0) return null;

  // Layout
  const maxVal = isAllNumbers ? Math.max(...array.map(Math.abs)) : 1;
  const count = array.length;
  const barWidth = Math.max(36, Math.min(76, Math.floor(700 / count) - 8));
  const fontSize = barWidth > 52 ? 15 : barWidth > 40 ? 13 : 11;
  const maxBarH = 200;

  // Pointers (for search / two-pointer algos)
  const pointers = [];
  if (isSearchAlgo || isTwoPointers) {
    if (left !== undefined) pointers.push({ idx: left, label: 'L', color: '#22c55e' });
    if (right !== undefined) pointers.push({ idx: right, label: 'R', color: '#ef4444' });
    if (mid !== undefined) pointers.push({ idx: mid, label: 'M', color: '#22d3ee' });
  }
  if (isSlidingWindow && windowStart !== undefined && windowEnd !== undefined) {
    pointers.push({ idx: windowStart, label: 'start', color: '#22c55e' });
    pointers.push({ idx: windowEnd, label: 'end', color: '#ef4444' });
  }

  return (
    <div className="av-root">
      {/* Animated grid background */}
      <div className="av-grid-bg" />

      {/* Search / Window range overlay */}
      {(isSearchAlgo || isSlidingWindow) && left !== undefined && right !== undefined && (
        <div className="av-range-overlay" style={{
          left: `calc(${left} * (${barWidth}px + 10px))`,
          width: `calc(${(right - left + 1)} * (${barWidth}px + 10px) - 10px)`,
        }}>
          <span className="av-range-tag">{isSlidingWindow ? 'Window' : 'Search Range'}</span>
        </div>
      )}

      {/* ═══ Premium Bar Visualization ═══ */}
      <div className="av-unified-chart" style={{ gap: 10 }}>
        {array.map((val, i) => {
          const state = getState(i);
          const color = COLORS[state];
          const gradient = BAR_GRADIENTS[state];
          const shine = BAR_SHINE[state];
          const barH = maxVal > 0 ? Math.max(16, (Math.abs(val) / maxVal) * maxBarH) : 16;
          const isSwpA = swapAnim && swapAnim.a === i;
          const isSwpB = swapAnim && swapAnim.b === i;
          const isSwapping = isSwpA || isSwpB;
          const isChanged = changedIndices.has(i);

          // Calculate swap offset for crossover animation
          let swapOffset = 0;
          if (swapAnim && isSwapping) {
            const dist = Math.abs(swapAnim.b - swapAnim.a) * (barWidth + 10);
            swapOffset = isSwpA ? dist : -dist;
          }

          const stateLabel = STATE_LABELS[state];

          return (
            <div
              key={i}
              className={`av-bar-unit ${state !== 'default' ? 'av-bar-unit--' + state : ''} ${isSwapping ? 'av-bar-unit--swapping' : ''} ${isChanged ? 'av-bar-unit--changed' : ''}`}
              style={{
                width: barWidth,
                '--bar-color': color,
                '--bar-gradient': gradient,
                '--bar-shine': shine,
                '--bar-glow': STATE_GLOW[state],
                '--swap-offset': isSwapping ? `${swapOffset}px` : '0px',
                animationDelay: sorted.includes(i) ? `${sorted.indexOf(i) * 60}ms` : '0ms',
              }}
            >
              {/* State micro-badge with text */}
              {stateLabel && (
                <span className={`av-state-tag av-state-tag--${state}`}>
                  {stateLabel}
                </span>
              )}

              {/* Emoji badge */}
              {state !== 'default' && state !== 'eliminated' && state !== 'checked' && (
                <span className="av-bar-badge">{STATE_ICONS[state]}</span>
              )}

              {/* Value label above bar */}
              <span className={`av-bar-val ${isChanged ? 'av-val-flash' : ''}`} style={{ color, fontSize }}>
                {val}
              </span>

              {/* The premium bar with inner shine */}
              <div className="av-bar-rect" style={{ height: barH }}>
                <div className="av-bar-inner-shine" />
                {/* Sorted particle burst */}
                {state === 'sorted' && (
                  <div className="av-sorted-particles">
                    {[...Array(6)].map((_, pi) => (
                      <span key={pi} className="av-particle" style={{
                        '--p-angle': `${pi * 60}deg`,
                        '--p-delay': `${pi * 50}ms`,
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Index chip below */}
              <span className={`av-bar-idx ${state === 'sorted' ? 'av-bar-idx--sorted' : ''}`}>{i}</span>

              {/* Sorted checkmark badge */}
              {state === 'sorted' && (
                <span className="av-sorted-check">✓</span>
              )}

              {/* Pointer label if any */}
              {pointers.filter(p => p.idx === i).map((ptr, pi) => (
                <div key={pi} className="av-ptr" style={{ '--ptr-color': ptr.color }}>
                  <span className="av-ptr-arrow">▲</span>
                  <span className="av-ptr-lbl">{ptr.label}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Partition boundary line */}
      {partitionBoundary !== undefined && partitionBoundary >= 0 && (
        <div className="av-partition-line" style={{
          left: `calc(50% - ${(count * (barWidth + 10)) / 2}px + ${(partitionBoundary + 1) * (barWidth + 10) - 5}px)`,
        }}>
          <span className="av-partition-label">partition</span>
        </div>
      )}

      {/* Premium legend */}
      <div className="av-legend">
        {!isSearchAlgo ? (
          <>
            <LegendDot color={COLORS.default} label="Default" />
            <LegendDot color={COLORS.comparing} label="Comparing" tag="CMP" />
            <LegendDot color={COLORS.swapping} label="Swapping" tag="SWAP" />
            <LegendDot color={COLORS.sorted} label="Sorted" tag="✓" />
            {algorithmId === 'quick-sort' && <LegendDot color={COLORS.pivot} label="Pivot" tag="PIV" />}
            {algorithmId === 'selection-sort' && <LegendDot color={COLORS.minIndex} label="Min" tag="MIN" />}
          </>
        ) : (
          <>
            <LegendDot color={COLORS.default} label="Unchecked" />
            <LegendDot color={COLORS.comparing} label="Checking" tag="CMP" />
            <LegendDot color={COLORS.found} label="Found" tag="🎯" />
            <LegendDot color={COLORS.eliminated} label="Eliminated" />
          </>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label, tag }) {
  return (
    <div className="av-legend-item">
      <div className="av-legend-swatch" style={{
        background: `linear-gradient(135deg, ${color}40, ${color}15)`,
        border: `1.5px solid ${color}60`,
        boxShadow: `0 0 8px ${color}20`,
      }} />
      <span>{label}</span>
      {tag && <span className="av-legend-tag" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>{tag}</span>}
    </div>
  );
}
