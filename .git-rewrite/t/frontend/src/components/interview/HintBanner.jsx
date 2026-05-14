import React, { memo, useEffect, useState } from 'react';
import { Lightbulb, Wrench, BookOpen, X } from 'lucide-react';

const TIER_CONFIG = {
    1: { icon: Lightbulb, label: 'Nudge', color: '#818cf8' },
    2: { icon: Wrench, label: 'Scaffold', color: '#f59e0b' },
    3: { icon: BookOpen, label: 'Guided', color: '#22d3ee' },
};

/**
 * HintBanner — Glassmorphic coach hint displayed when candidate is stuck.
 * Three tiers with escalating specificity.
 *
 * Props:
 *  - hint: { hintTier, hintMessage, isHint } | null
 *  - onDismiss: () => void
 *  - autoHideMs: number (default 8000)
 */
function HintBanner({ hint, onDismiss, autoHideMs = 8000 }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!hint?.isHint) {
            setVisible(false);
            return;
        }
        const showTimer = setTimeout(() => setVisible(true), 80);
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss?.(), 400);
        }, autoHideMs);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [hint, onDismiss, autoHideMs]);

    if (!hint?.isHint) return null;

    const tier = TIER_CONFIG[hint.hintTier] || TIER_CONFIG[1];
    const Icon = tier.icon;

    return (
        <div className={`hint-banner ${visible ? 'hint-banner--visible' : ''}`}>
            <div className="hint-banner-inner" style={{ '--hint-color': tier.color }}>
                <div className="hint-banner-left">
                    <div className="hint-banner-icon" style={{ background: `${tier.color}20`, color: tier.color }}>
                        <Icon size={16} />
                    </div>
                    <div className="hint-banner-content">
                        <div className="hint-banner-tier">
                            💡 Hint — {tier.label}
                        </div>
                        <div className="hint-banner-message">
                            {hint.hintMessage}
                        </div>
                    </div>
                </div>
                <button
                    className="hint-banner-close"
                    onClick={() => {
                        setVisible(false);
                        setTimeout(() => onDismiss?.(), 300);
                    }}
                    aria-label="Dismiss hint"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default memo(HintBanner);
