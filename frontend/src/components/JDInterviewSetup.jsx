import React, { useState } from 'react';
import {
    FileText, Sparkles, Loader2, X, ChevronRight, Target,
    AlertCircle, CheckCircle, Brain, Clipboard, Zap
} from 'lucide-react';
import './JDInterviewSetup.css';
import { authFetch } from '../utils/authFetch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function JDInterviewSetup({ onStartWithJD, getAuthHeaders, onClose }) {
    const [jdText, setJdText] = useState('');
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedRound, setSelectedRound] = useState('');

    const handleParseJD = async () => {
        if (jdText.trim().length < 50) {
            setError('Please paste a job description with at least 50 characters.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_URL}/api/company-interview/jd-questions`, {
                method: 'POST',
                body: JSON.stringify({ jobDescription: jdText })
            });
            if (!res.ok) throw new Error('Failed to parse JD');
            const data = await res.json();
            setParsedData(data);
            if (data.parsed?.rounds?.length > 0) {
                setSelectedRound(data.parsed.rounds[0]);
            }
        } catch (err) {
            setError('Failed to analyze the job description. Please try again.');
        }
        setLoading(false);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setJdText(text);
        } catch {
            // clipboard API not available
        }
    };

    const handleStart = () => {
        if (parsedData) {
            const roundQuestions = parsedData.questions.filter(q =>
                q.round.toLowerCase() === selectedRound.toLowerCase()
            );
            onStartWithJD({
                company: parsedData.parsed.company || 'Custom',
                role: parsedData.parsed.role || 'SDE',
                questions: roundQuestions.length > 0 ? roundQuestions : parsedData.questions,
                stage: selectedRound || 'Technical',
                jdContext: jdText.substring(0, 500),
                parsedSkills: parsedData.parsed.skills || [],
            });
        }
    };

    return (
        <div className="jd-setup-overlay">
            <div className="jd-setup-modal">
                {/* Header */}
                <div className="jd-header">
                    <div className="jd-header-left">
                        <div className="jd-header-icon">
                            <FileText size={22} />
                        </div>
                        <div>
                            <h2>JD-Based Interview</h2>
                            <p>Paste a job description to get tailored interview questions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="jd-close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="jd-content">
                    {!parsedData ? (
                        /* Step 1: Paste JD */
                        <div className="jd-paste-step">
                            <div className="jd-textarea-wrap">
                                <textarea
                                    value={jdText}
                                    onChange={(e) => setJdText(e.target.value)}
                                    placeholder="Paste the full job description here...&#10;&#10;Include details like role title, requirements, qualifications, and responsibilities for the best results."
                                    className="jd-textarea"
                                    rows={12}
                                />
                                <div className="jd-textarea-footer">
                                    <span className="jd-char-count">
                                        {jdText.length} characters
                                        {jdText.length < 50 && jdText.length > 0 && (
                                            <span className="jd-min-warning"> (min 50)</span>
                                        )}
                                    </span>
                                    <button onClick={handlePaste} className="jd-paste-btn">
                                        <Clipboard size={14} /> Paste
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="jd-error">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleParseJD}
                                disabled={loading || jdText.trim().length < 50}
                                className="jd-analyze-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Analyzing JD with AI...
                                    </>
                                ) : (
                                    <>
                                        <Brain size={18} />
                                        Analyze & Generate Questions
                                    </>
                                )}
                            </button>

                            <div className="jd-tips">
                                <div className="jd-tip">
                                    <Zap size={14} />
                                    Copy the full JD from LinkedIn, Naukri, or the company careers page
                                </div>
                                <div className="jd-tip">
                                    <Target size={14} />
                                    The AI will extract skills, experience, and generate role-specific questions
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: View parsed results */
                        <div className="jd-results-step">
                            {/* Parsed Summary */}
                            <div className="jd-parsed-summary">
                                <div className="jd-parsed-header">
                                    <CheckCircle size={18} className="jd-success-icon" />
                                    <span>JD Analyzed Successfully</span>
                                </div>
                                <div className="jd-parsed-grid">
                                    <div className="jd-parsed-item">
                                        <span className="jd-parsed-label">Company</span>
                                        <span className="jd-parsed-value">{parsedData.parsed.company}</span>
                                    </div>
                                    <div className="jd-parsed-item">
                                        <span className="jd-parsed-label">Role</span>
                                        <span className="jd-parsed-value">{parsedData.parsed.role}</span>
                                    </div>
                                    <div className="jd-parsed-item">
                                        <span className="jd-parsed-label">Experience</span>
                                        <span className="jd-parsed-value">{parsedData.parsed.experience}</span>
                                    </div>
                                </div>
                                <div className="jd-skills-wrap">
                                    <span className="jd-parsed-label">Key Skills</span>
                                    <div className="jd-skills-chips">
                                        {(parsedData.parsed.skills || []).map((skill, i) => (
                                            <span key={i} className="jd-skill-chip">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Round Selector */}
                            {parsedData.parsed.rounds && parsedData.parsed.rounds.length > 0 && (
                                <div className="jd-round-selector">
                                    <span className="jd-parsed-label">Select Round</span>
                                    <div className="jd-round-chips">
                                        {parsedData.parsed.rounds.map((round, i) => (
                                            <button
                                                key={i}
                                                className={`jd-round-chip ${selectedRound === round ? 'active' : ''}`}
                                                onClick={() => setSelectedRound(round)}
                                            >
                                                {round}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Questions Preview */}
                            <div className="jd-questions-preview">
                                <h4>
                                    <Sparkles size={16} />
                                    Generated Questions ({parsedData.questions.length})
                                </h4>
                                <div className="jd-questions-list">
                                    {parsedData.questions.slice(0, 6).map((q, i) => (
                                        <div key={i} className="jd-question-item">
                                            <div className="jd-q-number">{i + 1}</div>
                                            <div className="jd-q-content">
                                                <p className="jd-q-text">{q.question}</p>
                                                <div className="jd-q-meta">
                                                    <span className={`jd-q-difficulty ${q.difficulty?.toLowerCase()}`}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span className="jd-q-topic">{q.topic}</span>
                                                    <span className="jd-q-round">{q.round}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="jd-actions">
                                <button onClick={() => setParsedData(null)} className="jd-back-btn">
                                    Edit JD
                                </button>
                                <button onClick={handleStart} className="jd-start-btn">
                                    Start Interview
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
