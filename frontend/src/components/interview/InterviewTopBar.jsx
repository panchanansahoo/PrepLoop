import { memo, useMemo } from 'react';
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
    customTimeLimit,
    customQuestionSet,
    connectionMode,
    connectionHealth,
    workspacePanelOpen,
    setWorkspacePanelOpen,
    endInterview,
    onNavigateBack,
}) {
    const resolvedStage = STAGE_MAP[interviewType] || 'Technical';

    const totalScheduleBudget = useMemo(() => {
        if (Number(customQuestionSet?.scheduledDurationMinutes) > 0) {
            return Number(customQuestionSet.scheduledDurationMinutes) * 60;
        }
        if (Array.isArray(customQuestionSet?.questions) && customQuestionSet.questions.length > 0) {
            return customQuestionSet.questions.reduce((acc, q) => acc + (Number(q.timeLimit) || 60), 0);
        }
        return totalQuestions * getQuestionTimeLimit(resolvedStage);
    }, [customQuestionSet, totalQuestions, resolvedStage]);

    // Global timer — remaining time for entire interview
    const globalRemaining = useMemo(() => {
        return formatTime(Math.max(0, totalScheduleBudget - elapsed));
    }, [totalScheduleBudget, elapsed]);

    const schedulePercent = Math.min(100, Math.max(0, Math.round((elapsed / Math.max(1, totalScheduleBudget)) * 100)));

    // Per-question timer
    const questionTimer = useMemo(() => {
        const limit = Number(customTimeLimit) > 0 ? Number(customTimeLimit) : getQuestionTimeLimit(resolvedStage);
        const remaining = Math.max(0, limit - questionElapsed);
        return {
            remaining,
            formatted: formatTime(remaining),
            isWarning: remaining <= 30 && remaining > 0,
            isExpired: remaining <= 0,
        };
    }, [resolvedStage, questionElapsed, customTimeLimit]);

    // Timer tier CSS class
    const timerTier = questionTimer.isExpired
        ? 'ai-vc-q-timer--expired'
        : questionTimer.isWarning
            ? 'ai-vc-q-timer--warning'
            : '';

    return (
        <header className="ai-vc-topbar" style={{ position: 'relative' }}>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '2px',
                    width: `${schedulePercent}%`,
                    background: schedulePercent > 90 ? '#ef4444' : schedulePercent > 75 ? '#f59e0b' : '#38bdf8',
                    transition: 'width 1s linear',
                    zIndex: 10,
                }}
                title={`Fixed Session Schedule: ${schedulePercent}% elapsed`}
            />
            <div className="ai-vc-topbar-left">
                <div className="ai-vc-logo" onClick={onNavigateBack}>
                    <Sparkles size={16} />
                    <span>PrepLoop</span>
                </div>
                <div className="ai-vc-separator" />
                <div className="ai-mode-badge" title={customQuestionSet ? `Private Session: ${customQuestionSet.title} (${customQuestionSet.scheduledDurationMinutes || 45}m)` : undefined}>
                    {customQuestionSet
                        ? `🔒 ${customQuestionSet.title || 'Private Session'}${customQuestionSet.scheduledDurationMinutes ? ` (${customQuestionSet.scheduledDurationMinutes}m)` : ''}`
                        : '🎙️ Interview Mode'}
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
                    <div className={`ai-vc-connection-badge ai-vc-connection-badge--${connectionHealth || 'good'}`}
                         title={
                             connectionHealth === 'fallback' ? 'Using browser voice (TTS server unreachable)' :
                             connectionHealth === 'degraded' ? 'Reconnecting to voice server...' :
                             'Voice pipeline active'
                         }>
                        <span className="ai-vc-connection-dot" />
                        {connectionHealth === 'fallback' ? 'Browser Voice' :
                         connectionHealth === 'degraded' ? 'Reconnecting' : 'Live'}
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
