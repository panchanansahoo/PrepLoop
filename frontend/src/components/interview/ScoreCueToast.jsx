import { memo, useEffect, useState } from 'react';
import { CheckCircle, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';

const ICONS = {
    strong: CheckCircle,
    good: TrendingUp,
    fair: AlertTriangle,
    weak: XCircle,
};

/**
 * ScoreCueToast — Animated live feedback badge after each answer.
 * Slides in from bottom-right, auto-fades after 3.5s.
 *
 * Props:
 *  - cue: { level, text, color } | null
 *  - onDismiss: () => void
 */
function ScoreCueToast({ cue, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!cue) {
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
    }, [cue, onDismiss]);

    if (!cue) return null;

    const Icon = ICONS[cue.level] || TrendingUp;
    const colorMap = {
        green: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
        yellow: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
        orange: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
        red: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
    };
    const colors = colorMap[cue.color] || colorMap.yellow;

    return (
        <div
            className={`score-cue-toast ${visible ? 'score-cue-toast--visible' : ''}`}
            style={{
                '--cue-bg': colors.bg,
                '--cue-border': colors.border,
                '--cue-text': colors.text,
            }}
        >
            <Icon size={14} style={{ color: colors.text, flexShrink: 0 }} />
            <span className="score-cue-toast-text">{cue.text}</span>
        </div>
    );
}

export default memo(ScoreCueToast);
