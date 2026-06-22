import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Brain, X, ChevronDown, ChevronUp, Target, Sparkles,
    MessageSquare, Zap, Lightbulb, AlertCircle, Loader2, Eye, EyeOff
} from 'lucide-react';
import './AICopilot.css';
import { authFetch } from '../utils/authFetch';

import { API_URL } from '../config/api.js';

export default function AICopilot({ isOpen, onToggle, currentQuestion, partialAnswer, stage, company, role, getAuthHeaders, jdContext }) {
    const [copilotData, setCopilotData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        star: true, keywords: true, followUp: false, gaps: true
    });
    const [showHints, setShowHints] = useState(true);
    const [liveNudge, setLiveNudge] = useState(null);
    const lastFetchedRef = useRef('');
    const debounceRef = useRef(null);
    const nudgeTimerRef = useRef(null);
    const lastNudgeFetchRef = useRef(0);

    // Debounced fetch — only call API when user pauses typing for 2s and has 30+ chars
    const fetchSuggestions = useCallback(async (question, answer) => {
        if (!question) return;
        const cacheKey = `${question}::${answer?.substring(0, 100)}`;
        if (cacheKey === lastFetchedRef.current) return;
        lastFetchedRef.current = cacheKey;

        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/company-interview/copilot-suggest`, {
                method: 'POST',
                body: JSON.stringify({
                    currentQuestion: question,
                    partialAnswer: answer,
                    stage, company, role,
                    jobDescription: jdContext || ''
                })
            });
            if (res.ok) {
                const data = await res.json();
                setCopilotData(data);
            }
        } catch {
            // silence — copilot is a non-critical feature
        }
        setLoading(false);
    }, [stage, company, role, getAuthHeaders, jdContext]);

    // Auto re-fetch when question changes
    useEffect(() => {
        if (currentQuestion && isOpen) {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                fetchSuggestions(currentQuestion, partialAnswer);
            }, 1000);
        }
        return () => clearTimeout(debounceRef.current);
    }, [currentQuestion, isOpen]);

    // Debounced re-fetch when answer changes significantly
    useEffect(() => {
        if (partialAnswer && partialAnswer.length > 30 && isOpen) {
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                fetchSuggestions(currentQuestion, partialAnswer);
            }, 2500);
        }
        return () => clearTimeout(debounceRef.current);
    }, [partialAnswer]);

    // Throttled nudge fetcher — every 8s while answering
    useEffect(() => {
        if (!isOpen || !partialAnswer || partialAnswer.length < 30) return;
        const now = Date.now();
        if (now - lastNudgeFetchRef.current < 8000) return;

        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = setTimeout(async () => {
            lastNudgeFetchRef.current = Date.now();
            try {
                const res = await authFetch(`${API_URL}/api/company-interview/nudge`, {
                    method: 'POST',
                    body: JSON.stringify({
                        partialAnswer,
                        currentQuestion,
                        stage,
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.nudge) {
                        setLiveNudge(data);
                        setTimeout(() => setLiveNudge(null), 6000);
                    }
                }
            } catch { /* nudge is non-critical */ }
        }, 3000);

        return () => clearTimeout(nudgeTimerRef.current);
    }, [partialAnswer, isOpen, currentQuestion, stage, getAuthHeaders]);

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) {
        return (
            <button className="copilot-fab" onClick={onToggle} title="AI Copilot">
                <Brain size={20} />
                <span className="copilot-fab-label">Copilot</span>
            </button>
        );
    }

    return (
        <div className="copilot-panel">
            {/* Header */}
            <div className="copilot-header">
                <div className="copilot-header-left">
                    <Brain size={18} className="copilot-icon" />
                    <span className="copilot-title">AI Copilot</span>
                    {loading && <Loader2 size={14} className="copilot-spinner" />}
                </div>
                <div className="copilot-header-actions">
                    <button
                        className="copilot-toggle-hints"
                        onClick={() => setShowHints(!showHints)}
                        title={showHints ? 'Hide hints' : 'Show hints'}
                    >
                        {showHints ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button className="copilot-close" onClick={onToggle}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="copilot-content">
                {!copilotData && !loading && (
                    <div className="copilot-empty">
                        <Sparkles size={24} />
                        <p>Your AI assistant will provide real-time suggestions as the interview progresses.</p>
                        <button onClick={() => fetchSuggestions(currentQuestion, partialAnswer)} className="copilot-refresh">
                            <Zap size={14} /> Get Suggestions
                        </button>
                    </div>
                )}

                {copilotData && showHints && (
                    <>
                        {/* STAR Framework */}
                        {copilotData.starPrompts && (
                            <div className="copilot-section">
                                <button className="copilot-section-header" onClick={() => toggleSection('star')}>
                                    <div className="copilot-section-title">
                                        <Target size={14} />
                                        STAR Framework
                                    </div>
                                    {expandedSections.star ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expandedSections.star && (
                                    <div className="copilot-section-body">
                                        {Object.entries(copilotData.starPrompts).map(([key, prompt]) => (
                                            <div key={key} className="copilot-star-item">
                                                <span className={`copilot-star-label ${key}`}>
                                                    {key.charAt(0).toUpperCase()}
                                                </span>
                                                <div className="copilot-star-content">
                                                    <span className="copilot-star-key">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                                    <p>{prompt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Suggested Keywords */}
                        {copilotData.keywords && copilotData.keywords.length > 0 && (
                            <div className="copilot-section">
                                <button className="copilot-section-header" onClick={() => toggleSection('keywords')}>
                                    <div className="copilot-section-title">
                                        <Sparkles size={14} />
                                        Keywords to Include
                                    </div>
                                    {expandedSections.keywords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expandedSections.keywords && (
                                    <div className="copilot-section-body">
                                        <div className="copilot-keywords">
                                            {copilotData.keywords.map((kw, i) => (
                                                <span key={i} className="copilot-keyword-chip">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Answer Gaps */}
                        {copilotData.gapIndicators && copilotData.gapIndicators.length > 0 && (
                            <div className="copilot-section">
                                <button className="copilot-section-header" onClick={() => toggleSection('gaps')}>
                                    <div className="copilot-section-title">
                                        <AlertCircle size={14} />
                                        Strengthen Your Answer
                                    </div>
                                    {expandedSections.gaps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expandedSections.gaps && (
                                    <div className="copilot-section-body">
                                        <ul className="copilot-gap-list">
                                            {copilotData.gapIndicators.map((gap, i) => (
                                                <li key={i} className="copilot-gap-item">
                                                    <Lightbulb size={12} />
                                                    {gap}
                                                </li>
                                            ))}
                                        </ul>
                                        {copilotData.strengthIndicators && copilotData.strengthIndicators.length > 0 && (
                                            <div className="copilot-strengths">
                                                <span className="copilot-strengths-label">✓ Doing well:</span>
                                                {copilotData.strengthIndicators.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Structure Suggestion */}
                        {copilotData.structureSuggestion && (
                            <div className="copilot-structure-hint">
                                <Zap size={13} />
                                <span>{copilotData.structureSuggestion}</span>
                            </div>
                        )}

                        {/* Follow-up Predictions */}
                        {copilotData.followUpPredictions && copilotData.followUpPredictions.length > 0 && (
                            <div className="copilot-section">
                                <button className="copilot-section-header" onClick={() => toggleSection('followUp')}>
                                    <div className="copilot-section-title">
                                        <MessageSquare size={14} />
                                        Likely Follow-ups
                                    </div>
                                    {expandedSections.followUp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expandedSections.followUp && (
                                    <div className="copilot-section-body">
                                        <ul className="copilot-followup-list">
                                            {copilotData.followUpPredictions.map((q, i) => (
                                                <li key={i}>{q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Live Nudge Bar */}
                {liveNudge && showHints && (
                    <div className={`copilot-nudge-bar copilot-nudge-${liveNudge.type || 'structure'}`}>
                        <Lightbulb size={13} />
                        <span>{liveNudge.nudge}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
