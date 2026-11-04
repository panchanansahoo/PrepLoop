import { memo, useEffect, useState } from 'react';
import { CheckCircle, TrendingUp, AlertTriangle, XCircle, Sparkles, ArrowUpRight } from 'lucide-react';

const ICONS = {
    strong: CheckCircle,
    good: TrendingUp,
    fair: AlertTriangle,
    weak: XCircle,
};

/**
 * ScoreCueToast — Animated live feedback badge & micro-coaching card after each answer.
 * Slides in from bottom-right, auto-fades after 4s.
 * Suppressed during the first 2 questions to let candidate settle in.
 *
 * Props:
 *  - cue: { level, text, color, score, strength, improvement, questionIndex } | null
 *  - onDismiss: () => void
 */
function ScoreCueToast({ cue, onDismiss }) {
    const [visible, setVisible] = useState(false);

    const questionNumber = Number(cue?.questionIndex || cue?.turn || 3);
    const shouldSuppress = questionNumber <= 2;

    useEffect(() => {
        if (!cue || shouldSuppress) {
            setVisible(false);
            return;
        }
        // Trigger slide-in
        const showTimer = setTimeout(() => setVisible(true), 50);
        // Auto-dismiss after 4s
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss?.(), 400); // Wait for fade-out animation
        }, 4000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [cue, shouldSuppress, onDismiss]);

    if (!cue || shouldSuppress) return null;

    const Icon = ICONS[cue.level] || TrendingUp;
    const colorMap = {
        green: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', text: '#22c55e', badge: '#15803d' },
        yellow: { bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24', badge: '#b45309' },
        orange: { bg: 'rgba(249,115,22,0.14)', border: 'rgba(249,115,22,0.35)', text: '#f97316', badge: '#c2410c' },
        red: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', text: '#ef4444', badge: '#b91c1c' },
    };
    const colors = colorMap[cue.color] || colorMap.yellow;

    const hasMicroCoaching = Boolean(cue.strength || cue.improvement);

    return (
        <div
            className={`score-cue-toast ${visible ? 'score-cue-toast--visible' : ''}`}
            style={{
                '--cue-bg': colors.bg,
                '--cue-border': colors.border,
                '--cue-text': colors.text,
                display: 'flex',
                flexDirection: 'column',
                gap: hasMicroCoaching ? '6px' : '0',
                maxWidth: '340px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={15} style={{ color: colors.text, flexShrink: 0 }} />
                <span className="score-cue-toast-text" style={{ fontWeight: 600 }}>
                    {cue.text}
                </span>
                {cue.score !== undefined && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: colors.border,
                        color: colors.text
                    }}>
                        {cue.score}/100
                    </span>
                )}
            </div>

            {hasMicroCoaching && (
                <div style={{
                    fontSize: '11px',
                    lineHeight: '1.4',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    color: '#cbd5e1'
                }}>
                    {cue.strength && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <Sparkles size={11} style={{ color: '#4ade80', flexShrink: 0, marginTop: '2px' }} />
                            <span><strong style={{ color: '#86efac' }}>Strength:</strong> {cue.strength}</span>
                        </div>
                    )}
                    {cue.improvement && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <ArrowUpRight size={11} style={{ color: '#facc15', flexShrink: 0, marginTop: '2px' }} />
                            <span><strong style={{ color: '#fde047' }}>Improve:</strong> {cue.improvement}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default memo(ScoreCueToast);
