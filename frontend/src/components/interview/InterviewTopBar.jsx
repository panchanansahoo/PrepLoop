import React, { memo, useMemo } from 'react';
import { Clock, Timer, Sparkles, Phone, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { getQuestionTimeLimit } from '../../pages/aiInterviewTiming';

/**
 * STAGE_MAP — Maps internal interview types to display-friendly stage names.
 * Hoisted outside render to avoid re-creation.
 */
const STAGE_MAP = {
    coding: 'DSA / Coding',
    dsa: 'DSA / Coding',
    'system-design': 'System Design',
    behavioral: 'Behavioral',
    technical: 'Technical',
    hr: 'HR',
};

/**
 * formatTime — Formats seconds into MM:SS string.
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/**
 * InterviewTopBar — Minimal header for the interview phase.
 *
 * Extracted to:
 * 1. Eliminate two duplicate IIFEs from the render path
 * 2. Memoize stage resolution + timer computations via useMemo
 * 3. Migrate inline styles to CSS classes
 */
function InterviewTopBar({
    interviewType,
    totalQuestions,
    questionIndex,
    elapsed,
    questionElapsed,
    isPaused,
    stageLabel,
    stagePlan,
    targetCompany,
    connectionMode,
    workspacePanelOpen,
    setWorkspacePanelOpen,
    endInterview,
    onNavigateBack,
}) {
    const resolvedStage = STAGE_MAP[interviewType] || 'Technical';

    // Global timer — remaining time for entire interview
    const globalRemaining = useMemo(() => {
        const totalBudget = totalQuestions * getQuestionTimeLimit(resolvedStage);
        return formatTime(Math.max(0, totalBudget - elapsed));
    }, [totalQuestions, resolvedStage, elapsed]);

    // Per-question timer
    const questionTimer = useMemo(() => {
        const limit = getQuestionTimeLimit(resolvedStage);
        const remaining = Math.max(0, limit - questionElapsed);
        return {
            remaining,
            formatted: formatTime(remaining),
            isWarning: remaining <= 30 && remaining > 0,
            isExpired: remaining <= 0,
        };
    }, [resolvedStage, questionElapsed]);

    // Timer tier CSS class
    const timerTier = questionTimer.isExpired
        ? 'ai-vc-q-timer--expired'
        : questionTimer.isWarning
            ? 'ai-vc-q-timer--warning'
            : '';

    return (
        <header className="ai-vc-topbar">
            <div className="ai-vc-topbar-left">
                <div className="ai-vc-logo" onClick={onNavigateBack}>
                    <Sparkles size={16} />
                    <span>PrepLoop</span>
                </div>
                <div className="ai-vc-separator" />
                <div className="ai-mode-badge">
                    🎙️ Interview Mode
                </div>
            </div>
            <div className="ai-vc-topbar-center">
                <div className="ai-vc-timer">
                    <div className={`ai-vc-timer-dot ${isPaused ? 'ai-vc-timer-dot--paused' : ''}`} />
                    <Clock size={13} />
                    {globalRemaining}
                    {isPaused && <span className="ai-vc-paused-badge">PAUSED</span>}
                </div>

                {/* Per-Question Timer */}
                <div className={`ai-vc-q-timer ${timerTier}`}>
                    <Timer size={11} />
                    Q{questionIndex}: {questionTimer.formatted}
                </div>

                <div className="ai-vc-progress">
                    {Array.from({ length: totalQuestions }).map((_, i) => (
                        <div
                            key={i}
                            className={`ai-vc-progress-pip ${i < questionIndex - 1 ? 'done' : i === questionIndex - 1 ? 'active' : ''}`}
                        />
                    ))}
                    <span className="ai-vc-progress-label">Q{questionIndex}/{totalQuestions}</span>
                </div>
                {/* Stage Stepper or fallback badge */}
                {stagePlan && stagePlan.length > 0 ? (
                    <div className="ai-vc-stage-stepper">
                        {stagePlan.map((stage, i) => (
                            <div key={i} className="ai-vc-stage-step">
                                <div className={`ai-vc-stage-dot ${
                                    stage.status === 'completed' ? 'ai-vc-stage-dot--completed' :
                                    stage.status === 'active' ? 'ai-vc-stage-dot--active' : ''
                                }`} />
                                <span className={`ai-vc-stage-label ${
                                    stage.status === 'active' ? 'ai-vc-stage-label--active' :
                                    stage.status === 'completed' ? 'ai-vc-stage-label--completed' : ''
                                }`}>{stage.label || stage.name}</span>
                                {i < stagePlan.length - 1 && (
                                    <div className={`ai-vc-stage-line ${
                                        stage.status === 'completed' ? 'ai-vc-stage-line--completed' : ''
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                ) : stageLabel ? (
                    <div className="ai-vc-stage-badge" title={`Current stage: ${stageLabel}`}>
                        {stageLabel}
                    </div>
                ) : null}
                {/* Company persona badge */}
                {targetCompany && (
                    <div className="ai-vc-persona-badge">
                        🎭 {targetCompany}-style
                    </div>
                )}
                {/* Connection health badge */}
                {connectionMode && connectionMode !== 'offline' && (
                    <div className={`ai-vc-connection-badge ai-vc-connection-badge--${connectionMode}`}
                         title={connectionMode === 'websocket' ? 'Streaming mode (best quality)' : 'REST fallback mode'}>
                        <span className="ai-vc-connection-dot" />
                        {connectionMode === 'websocket' ? 'Live' : 'REST'}
                    </div>
                )}
            </div>
            <div className="ai-vc-topbar-right">
                <button
                    className="ai-vc-panel-toggle"
                    onClick={() => setWorkspacePanelOpen(p => !p)}
                    title={workspacePanelOpen ? 'Hide workspace' : 'Show workspace'}
                >
                    {workspacePanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    <span>{workspacePanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
                </button>
                <button className="ai-vc-end-btn" onClick={endInterview}>
                    <Phone size={14} style={{ transform: 'rotate(135deg)' }} />
                    End Interview
                </button>
            </div>
        </header>
    );
}

export default memo(InterviewTopBar);
