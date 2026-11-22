import { memo, useEffect, useState, useMemo } from 'react';
import { Compass, Lightbulb, GitBranch, Wrench, BookOpen, X, ChevronRight } from 'lucide-react';

export const TIER_CONFIG = {
    0: { icon: Compass, label: 'Thought Starter', color: '#94a3b8', badge: 'Tier 0' },
    1: { icon: Lightbulb, label: 'Nudge', color: '#818cf8', badge: 'Tier 1' },
    2: { icon: GitBranch, label: 'Approach Options', color: '#34d399', badge: 'Tier 2' },
    3: { icon: Wrench, label: 'Scaffold', color: '#f59e0b', badge: 'Tier 3' },
    4: { icon: BookOpen, label: 'Guided Solution', color: '#22d3ee', badge: 'Tier 4' },
};

const TIER_ALIAS_MAP = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    thought_starter: 0,
    thoughtstarter: 0,
    starter: 0,
    nudge: 1,
    options: 2,
    approach_options: 2,
    approach: 2,
    scaffold: 3,
    scaffolding: 3,
    guided: 4,
    guided_solution: 4,
    solution: 4,
};

/**
 * Parses markdown-style bullet points or numbered lists from raw hint message
 * if explicit structured options/bullets arrays were not provided.
 */
function parseStructuredBullets(text) {
    if (!text || typeof text !== 'string') return { intro: '', items: [] };
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets = [];
    const introLines = [];

    for (const line of lines) {
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/) || line.match(/^\d+[.)]\s+(.*)$/);
        if (bulletMatch) {
            bullets.push(bulletMatch[1]);
        } else if (bullets.length === 0) {
            introLines.push(line);
        } else {
            // Continuation line after bullets started
            bullets.push(line);
        }
    }

    return {
        intro: introLines.join(' '),
        items: bullets,
    };
}

/**
 * HintBanner — Glassmorphic coach hint displayed when candidate is stuck or thinking.
 * 5-Tier Suggestion Hierarchy:
 *  - Tier 0: Thought Starter (Compass, #94a3b8)
 *  - Tier 1: Nudge (Lightbulb, #818cf8)
 *  - Tier 2: Approach Options (GitBranch, #34d399)
 *  - Tier 3: Scaffold (Wrench, #f59e0b)
 *  - Tier 4: Guided Solution (BookOpen, #22d3ee)
 *
 * Supports structured hint rendering:
 *  - approach options list (strings or objects with title, description, complexity)
 *  - guidance bullets / steps
 *  - pause on hover
 *
 * Props:
 *  - hint: { hintTier, hintMessage, options, bullets, isHint, title } | null
 *  - onDismiss: () => void
 *  - onSelectOption?: (option) => void
 *  - autoHideMs: number (default 10000)
 */
function HintBanner({ hint, onDismiss, onSelectOption, autoHideMs = 10000 }) {
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!hint?.isHint) {
            setVisible(false);
            return;
        }
        const showTimer = setTimeout(() => setVisible(true), 80);

        let hideTimer = null;
        if (!isHovered && autoHideMs > 0) {
            hideTimer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => onDismiss?.(), 400);
            }, autoHideMs);
        }

        return () => {
            clearTimeout(showTimer);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [hint, onDismiss, autoHideMs, isHovered]);

    const structuredData = useMemo(() => {
        if (!hint) return { introText: '', approachOptions: [], guidanceBullets: [] };

        const explicitOptions = Array.isArray(hint.options)
            ? hint.options
            : Array.isArray(hint.approachOptions)
            ? hint.approachOptions
            : null;

        const explicitBullets = Array.isArray(hint.bullets)
            ? hint.bullets
            : Array.isArray(hint.guidanceBullets)
            ? hint.guidanceBullets
            : Array.isArray(hint.guidance)
            ? hint.guidance
            : null;

        const rawMessage = hint.hintMessage || hint.message || '';

        if (!explicitOptions && !explicitBullets && rawMessage.includes('\n')) {
            const parsed = parseStructuredBullets(rawMessage);
            if (parsed.items.length > 0) {
                return {
                    introText: parsed.intro || rawMessage,
                    approachOptions: [],
                    guidanceBullets: parsed.items,
                };
            }
        }

        return {
            introText: rawMessage,
            approachOptions: explicitOptions || [],
            guidanceBullets: explicitBullets || [],
        };
    }, [hint]);

    if (!hint?.isHint) return null;

    const rawTierKey = hint.hintTier ?? hint.tier ?? 1;
    const resolvedTierIndex =
        rawTierKey in TIER_CONFIG
            ? Number(rawTierKey)
            : TIER_ALIAS_MAP[String(rawTierKey).toLowerCase()] ?? 1;

    const tier = TIER_CONFIG[resolvedTierIndex] || TIER_CONFIG[1];
    const Icon = tier.icon;
    const displayTitle = hint.title || tier.label;

    return (
        <div
            className={`hint-banner ${visible ? 'hint-banner--visible' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="region"
            aria-live="polite"
            aria-label={`Interview Suggestion: ${displayTitle}`}
        >
            <div className="hint-banner-inner" style={{ '--hint-color': tier.color }}>
                <div className="hint-banner-left">
                    <div
                        className="hint-banner-icon"
                        style={{
                            background: `${tier.color}20`,
                            color: tier.color,
                            boxShadow: `0 0 12px ${tier.color}30`,
                        }}
                    >
                        <Icon size={16} />
                    </div>
                    <div className="hint-banner-content">
                        <div className="hint-banner-header">
                            <span className="hint-banner-tier" style={{ color: tier.color }}>
                                {tier.badge} · {tier.label}
                            </span>
                        </div>

                        {structuredData.introText && (
                            <div className="hint-banner-message">
                                {structuredData.introText}
                            </div>
                        )}

                        {/* Structured Approach Options (Tier 2 or explicit options) */}
                        {structuredData.approachOptions.length > 0 && (
                            <div className="hint-banner-options" role="list">
                                {structuredData.approachOptions.map((opt, idx) => {
                                    const isObj = typeof opt === 'object' && opt !== null;
                                    const optTitle = isObj ? (opt.title || opt.name || `Option ${idx + 1}`) : opt;
                                    const optDesc = isObj ? opt.description : null;
                                    const optComplexity = isObj ? opt.complexity : null;
                                    const badgeLetter = String.fromCharCode(65 + idx);

                                    return (
                                        <div
                                            key={idx}
                                            className={`hint-banner-option ${onSelectOption ? 'hint-banner-option--clickable' : ''}`}
                                            onClick={() => onSelectOption?.(opt)}
                                            role="listitem"
                                            tabIndex={onSelectOption ? 0 : undefined}
                                            onKeyDown={(e) => {
                                                if (onSelectOption && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    onSelectOption(opt);
                                                }
                                            }}
                                        >
                                            <div className="hint-banner-option-header">
                                                <span className="hint-banner-option-badge" style={{ color: tier.color, borderColor: `${tier.color}40` }}>
                                                    {badgeLetter}
                                                </span>
                                                <span className="hint-banner-option-title">{optTitle}</span>
                                                {optComplexity && (
                                                    <span className="hint-banner-option-complexity">{optComplexity}</span>
                                                )}
                                                {onSelectOption && (
                                                    <ChevronRight size={13} className="hint-banner-option-arrow" />
                                                )}
                                            </div>
                                            {optDesc && (
                                                <div className="hint-banner-option-desc">{optDesc}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Structured Guidance Bullets */}
                        {structuredData.guidanceBullets.length > 0 && (
                            <ul className="hint-banner-bullets">
                                {structuredData.guidanceBullets.map((bullet, idx) => (
                                    <li key={idx} className="hint-banner-bullet">
                                        <span
                                            className="hint-banner-bullet-dot"
                                            style={{ background: tier.color }}
                                        />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
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
