import React, { memo, _useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, Sparkles,
    FileText, Search, Star, Code2, MessageSquare, X,
    GraduationCap, Briefcase, RefreshCw, Zap,
} from 'lucide-react';

// ─── Static data (hoisted outside component to avoid recreation) ───
const TOPIC_PILLS = [
    { id: 'hr', label: 'HR Round' },
    { id: 'technical', label: 'Technical Round' },
];

const SETUP_STEPS = [
    'Experience',
    'Interview Type',
    'Resume',
    'Target Role',
    'Company',
    'Start',
];

const STEP_DESCRIPTIONS = [
    'Are you a fresher or an experienced professional?',
    'Choose the type of interview you want to practice',
    'Upload your resume for personalized questions',
    'Enter your target role for tailored preparation',
    'Choose the target company for your interview',
    'Review your setup and start your interview',
];

const COMPANIES = [
    { name: 'Google', industry: 'Technology', icon: '🔍', category: 'faang', starred: true },
    { name: 'Apple', industry: 'Technology', icon: '🍎', category: 'faang' },
    { name: 'Meta', industry: 'Social Media', icon: '📘', category: 'faang' },
    { name: 'Amazon', industry: 'E-Commerce', icon: '📦', category: 'faang' },
    { name: 'Netflix', industry: 'Entertainment', icon: '🎬', category: 'faang' },
    { name: 'Microsoft', industry: 'Technology', icon: '🪟', category: 'faang' },
    { name: 'Infosys', industry: 'IT Services', icon: '💼', category: 'indian' },
    { name: 'TCS', industry: 'IT Services', icon: '🏢', category: 'indian' },
    { name: 'Wipro', industry: 'IT Services', icon: '🔧', category: 'indian' },
    { name: 'Flipkart', industry: 'E-Commerce', icon: '🛒', category: 'indian' },
    { name: 'Razorpay', industry: 'Fintech', icon: '💳', category: 'indian' },
    { name: 'Swiggy', industry: 'Food Delivery', icon: '🍔', category: 'indian' },
    { name: 'Zomato', industry: 'Food Delivery', icon: '🍕', category: 'indian' },
    { name: 'Paytm', industry: 'Fintech', icon: '💰', category: 'indian' },
    { name: 'Meesho', industry: 'E-Commerce', icon: '🛍️', category: 'indian' },
    { name: 'Dream11', industry: 'Gaming', icon: '🎮', category: 'indian' },
    { name: 'PhonePe', industry: 'Fintech', icon: '📱', category: 'indian' },
    { name: 'CRED', industry: 'Fintech', icon: '💎', category: 'indian' },
    { name: 'Spotify', industry: 'Music', icon: '🎵', category: 'global' },
    { name: 'Airbnb', industry: 'Travel', icon: '🏠', category: 'global' },
    { name: 'Uber', industry: 'Transport', icon: '🚗', category: 'global' },
    { name: 'Stripe', industry: 'Fintech', icon: '💳', category: 'global' },
    { name: 'Salesforce', industry: 'CRM', icon: '☁️', category: 'global' },
    { name: 'Adobe', industry: 'Software', icon: '🎨', category: 'global' },
    { name: 'Oracle', industry: 'Database', icon: '🗄️', category: 'global' },
    { name: 'IBM', industry: 'Technology', icon: '💻', category: 'global' },
    { name: 'Twitter / X', industry: 'Social Media', icon: '🐦', category: 'global' },
    { name: 'LinkedIn', industry: 'Professional', icon: '🔗', category: 'global' },
    { name: 'Nvidia', industry: 'Hardware', icon: '🟢', category: 'global' },
    { name: 'Tesla', industry: 'Automotive', icon: '⚡', category: 'global' },
];

const SUGGESTED_COMPANIES = ['Amazon', 'Google', 'Netflix', 'Spotify', 'Airbnb'];

const COMPANY_TABS = [
    { id: 'all', label: `All (${COMPANIES.length})` },
    { id: 'faang', label: `FAANG (${COMPANIES.filter(c => c.category === 'faang').length})` },
    { id: 'indian', label: `Indian (${COMPANIES.filter(c => c.category === 'indian').length})` },
    { id: 'global', label: `Global (${COMPANIES.filter(c => c.category === 'global').length})` },
];

/**
 * InterviewLobby — Multi-step setup wizard for interview configuration.
 *
 * Props:
 *  - setupStep / setSetupStep
 *  - experienceLevel / setExperienceLevel
 *  - interviewType / setInterviewType
 *  - interviewerGender / setInterviewerGender
 *  - targetRole / setTargetRole
 *  - targetCompany / setTargetCompany
 *  - companySearch / setCompanySearch
 *  - companyTab / setCompanyTab
 *  - resumeFile
 *  - loading
 *  - savedSession
 *  - interviewer          { name, role }
 *  - formatTime           (seconds) => string
 *  - onStartInterview     () => void
 *  - onRestoreSession     (session) => void
 *  - onClearSavedSession  () => void
 *  - onResumeDragOver     (e) => void
 *  - onResumeDragLeave    (e) => void
 *  - onResumeDrop         (e) => void
 *  - onResumeFileChange   (e) => void
 */
function InterviewLobby({
    setupStep, setSetupStep,
    experienceLevel, setExperienceLevel,
    interviewType, setInterviewType,
    interviewerGender, setInterviewerGender,
    targetRole, setTargetRole,
    targetCompany, setTargetCompany,
    companySearch, setCompanySearch,
    companyTab, setCompanyTab,
    resumeFile,
    loading,
    savedSession,
    interviewer,
    formatTime,
    onStartInterview,
    onRestoreSession,
    onClearSavedSession,
    onResumeDragOver,
    onResumeDragLeave,
    onResumeDrop,
    onResumeFileChange,
    questionSetCode,
    customQuestionSet,
    questionSetLoading,
    questionSetError,
    resumeParseError,
}) {
    const navigate = useNavigate();

    // Derived: filtered companies
    const filteredCompanies = useMemo(() => COMPANIES.filter(c => {
        const matchTab = companyTab === 'all' || c.category === companyTab;
        const matchSearch = !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase());
        return matchTab && matchSearch;
    }), [companyTab, companySearch]);

    // Stable hover handlers for session recovery banner
    const onResumeMouseEnter = useCallback((e) => { e.currentTarget.style.opacity = '0.85'; }, []);
    const onResumeMouseLeave = useCallback((e) => { e.currentTarget.style.opacity = '1'; }, []);
    const onDiscardMouseEnter = useCallback((e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
        e.currentTarget.style.color = '#ef4444';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
    }, []);
    const onDiscardMouseLeave = useCallback((e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }, []);

    // ─── Custom Admin Question Set View ───
    if (questionSetCode) {
        if (questionSetLoading) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-modal" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '500px' }}>
                            <RefreshCw size={36} className="spin" style={{ color: '#818cf8', margin: '0 auto 16px', display: 'block' }} />
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Loading Custom Interview...</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>Preparing your assigned questions and environment.</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (questionSetError) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-modal" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '500px' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <X size={28} style={{ color: '#ef4444' }} />
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Interview Unavailable</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>{questionSetError}</p>
                            <button className="ai-setup-nav-btn ai-setup-nav-btn--next" onClick={() => navigate('/interview-suite')} style={{ margin: '0 auto' }}>
                                Go to Interview Suite
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (customQuestionSet) {
            return (
                <div className="ai-interview-page">
                    <div className="ai-setup-backdrop">
                        <div className="ai-setup-glow ai-setup-glow--purple" />
                        <div className="ai-setup-glow ai-setup-glow--blue" />

                        <div className="ai-setup-modal" style={{ maxWidth: '640px', padding: '36px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#a5b4fc', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Sparkles size={14} /> Assigned Interview
                                </div>
                                <button className="ai-setup-close" onClick={() => navigate('/interview-suite')} title="Close">
                                    <X size={20} />
                                </button>
                            </div>

                            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                                {customQuestionSet.title}
                            </h1>
                            {customQuestionSet.description && (
                                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                                    {customQuestionSet.description}
                                </p>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Company</div>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.settings?.companyName || 'Assigned'}</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Target Role</div>
                                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.settings?.roleName || 'Software Engineer'}</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Questions</div>
                                    <div style={{ color: '#818cf8', fontWeight: '700', fontSize: '14px' }}>{customQuestionSet.questionCount} Fixed Qs</div>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Difficulty</div>
                                    <div style={{ color: '#34d399', fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{customQuestionSet.difficulty || 'Medium'}</div>
                                </div>
                            </div>

                            {customQuestionSet.settings?.customInstructions && (
                                <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
                                        <Sparkles size={15} /> Instructions from Interviewer
                                    </div>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                        {customQuestionSet.settings.customInstructions}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> AI Voice & Video Interviewer
                                </span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> Real-time Speech & Analysis
                                </span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={13} style={{ color: '#22c55e' }} /> Detailed Score Breakdown
                                </span>
                            </div>

                            <button
                                className="ai-setup-nav-btn ai-setup-nav-btn--next"
                                onClick={onStartInterview}
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: '16px', fontWeight: '700', borderRadius: '12px' }}
                            >
                                {loading ? 'Starting Interview...' : 'Begin Interview'}
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="ai-interview-page">
            <div className="ai-setup-backdrop">
                <div className="ai-setup-glow ai-setup-glow--purple" />
                <div className="ai-setup-glow ai-setup-glow--blue" />

                <div className="ai-setup-modal ai-setup-modal--wizard">
                    {/* Header */}
                    <div className="ai-setup-header">
                        <div>
                            <h1 className="ai-setup-title">Interview Setup</h1>
                            <p className="ai-setup-subtitle">{STEP_DESCRIPTIONS[setupStep]}</p>
                        </div>
                        <button className="ai-setup-close" onClick={() => navigate('/interview-suite')} title="Close">
                            <X size={20} />
                        </button>
                    </div>

                    {/* I9: Session Recovery Banner */}
                    {savedSession && (
                        <div className="ai-session-recovery ai-lobby-recovery-banner">
                            <div className="ai-lobby-recovery-icon">
                                <RefreshCw size={18} style={{ color: '#818cf8' }} />
                            </div>
                            <div className="ai-lobby-recovery-info">
                                <div className="ai-lobby-recovery-title">
                                    Resume Previous Session
                                </div>
                                <div className="ai-lobby-recovery-meta">
                                    {savedSession.interviewType} · Q{savedSession.questionIndex}/{savedSession.totalQuestions} · {formatTime(savedSession.elapsed || 0)} elapsed
                                </div>
                            </div>
                            <button
                                className="ai-lobby-recovery-resume-btn"
                                onClick={() => onRestoreSession(savedSession)}
                                onMouseEnter={onResumeMouseEnter}
                                onMouseLeave={onResumeMouseLeave}
                            >
                                Resume
                            </button>
                            <button
                                className="ai-lobby-recovery-discard-btn"
                                onClick={onClearSavedSession}
                                onMouseEnter={onDiscardMouseEnter}
                                onMouseLeave={onDiscardMouseLeave}
                            >
                                Discard
                            </button>
                        </div>
                    )}

                    {/* Stepper */}
                    <div className="ai-wizard-stepper">
                        {SETUP_STEPS.map((step, i) => (
                            <React.Fragment key={i}>
                                <div
                                    className={`ai-wizard-step ${i < setupStep ? 'completed' : ''} ${i === setupStep ? 'active' : ''}`}
                                    onClick={() => i <= setupStep && setSetupStep(i)}
                                >
                                    {i < setupStep ? <CheckCircle size={22} /> : <span>{i + 1}</span>}
                                </div>
                                {i < SETUP_STEPS.length - 1 && (
                                    <div className={`ai-wizard-connector ${i < setupStep ? 'completed' : ''}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="ai-wizard-content">
                        {/* ─── Step 0: Experience Level ─── */}
                        {setupStep === 0 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-experience-grid">
                                    <button
                                        className={`ai-setup-experience-card ${experienceLevel === 'fresher' ? 'selected' : ''}`}
                                        onClick={() => setExperienceLevel('fresher')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                            <GraduationCap size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Fresher</span>
                                            <span className="ai-setup-experience-desc">Fresh graduate or 0–1 years of experience. Questions focus on fundamentals, aptitude, and college projects.</span>
                                        </div>
                                        {experienceLevel === 'fresher' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        className={`ai-setup-experience-card ${experienceLevel === 'experienced' ? 'selected' : ''}`}
                                        onClick={() => setExperienceLevel('experienced')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                            <Briefcase size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Experienced</span>
                                            <span className="ai-setup-experience-desc">1+ years of industry experience. Questions focus on system design, leadership, and real-world problem solving.</span>
                                        </div>
                                        {experienceLevel === 'experienced' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 1: Interview Type ─── */}
                        {setupStep === 1 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-experience-grid">
                                    <button
                                        className={`ai-setup-experience-card ${interviewType === 'hr' ? 'selected' : ''}`}
                                        onClick={() => setInterviewType('hr')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                            <MessageSquare size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">HR Round</span>
                                            <span className="ai-setup-experience-desc">Behavioral and situational questions. Focus on culture fit, teamwork, and leadership.</span>
                                        </div>
                                        {interviewType === 'hr' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                    <button
                                        className={`ai-setup-experience-card ${interviewType === 'technical' ? 'selected' : ''}`}
                                        onClick={() => setInterviewType('technical')}
                                    >
                                        <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                            <Code2 size={32} />
                                        </div>
                                        <div className="ai-setup-experience-info">
                                            <span className="ai-setup-experience-title">Technical Round</span>
                                            <span className="ai-setup-experience-desc">Core technical skills, data structures, algorithms, and system design concepts.</span>
                                        </div>
                                        {interviewType === 'technical' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 2: Resume Upload ─── */}
                        {setupStep === 2 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-setup-resume-section ai-setup-resume-section--open">
                                    <div className="ai-setup-resume-toggle" style={{ pointerEvents: 'none' }}>
                                        <div className="ai-setup-resume-left">
                                            <div className="ai-setup-resume-icon">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <div className="ai-setup-resume-title">
                                                    Add your resume
                                                    <span className="ai-setup-badge-rec">recommended</span>
                                                </div>
                                                <div className="ai-setup-resume-desc">
                                                    Personalizes questions to your background & projects
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ai-setup-resume-body expanded">
                                        <div
                                            className={`ai-setup-drop-zone ${resumeFile ? 'has-file' : ''}`}
                                            onClick={() => document.getElementById('resume-file-input')?.click()}
                                            onDragOver={onResumeDragOver}
                                            onDragLeave={onResumeDragLeave}
                                            onDrop={onResumeDrop}
                                        >
                                            {resumeFile ? (
                                                <>
                                                    <CheckCircle size={28} className="ai-setup-drop-icon" style={{ color: '#22c55e' }} />
                                                    <p className="ai-setup-drop-text" style={{ color: '#22c55e' }}>{resumeFile.name}</p>
                                                    <p className="ai-setup-drop-hint">Click to replace</p>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText size={28} className="ai-setup-drop-icon" />
                                                    <p className="ai-setup-drop-text">Drop your resume here or <span>browse files</span></p>
                                                    <p className="ai-setup-drop-hint">PDF or DOCX up to 5MB</p>
                                                </>
                                            )}
                                            {resumeParseError && (
                                                <div role="status" style={{ color: '#fbbf24', fontSize: '12px', marginTop: '10px' }}>
                                                    {resumeParseError}
                                                </div>
                                            )}
                                            <input
                                                id="resume-file-input"
                                                type="file"
                                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                style={{ display: 'none' }}
                                                onChange={onResumeFileChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 3: Target Role ─── */}
                        {setupStep === 3 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-wizard-field">
                                    <label className="ai-wizard-label">
                                        <span className="ai-wizard-label-dot" />
                                        Target Role
                                        <span className="ai-wizard-label-optional">(optional but Recommended)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="ai-wizard-input"
                                        placeholder="e.g. Senior Software Engineer, Backend Developer, Data Scientist..."
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* ─── Step 4: Company & Interviewer Preference ─── */}
                        {setupStep === 4 && (
                            <div className="ai-wizard-step-body">
                                {/* Gender Preference */}
                                <div className="ai-wizard-gender-picker">
                                    <span className="ai-wizard-gender-label">Interviewer Preference</span>
                                    <div className="ai-wizard-gender-toggle">
                                        <button
                                            className={`ai-wizard-gender-btn ${interviewerGender === 'male' ? 'selected' : ''}`}
                                            onClick={() => setInterviewerGender('male')}
                                        >
                                            <span className="ai-wizard-gender-emoji">👨‍💼</span>
                                            Male
                                        </button>
                                        <button
                                            className={`ai-wizard-gender-btn ${interviewerGender === 'female' ? 'selected' : ''}`}
                                            onClick={() => setInterviewerGender('female')}
                                        >
                                            <span className="ai-wizard-gender-emoji">👩‍💼</span>
                                            Female
                                        </button>
                                    </div>
                                </div>

                                {/* Suggested pills */}
                                <div className="ai-wizard-suggested">
                                    <span className="ai-wizard-suggested-label">Suggested for this problem</span>
                                    <div className="ai-wizard-suggested-pills">
                                        {SUGGESTED_COMPANIES.map((name) => (
                                            <button
                                                key={name}
                                                className={`ai-wizard-company-pill ${targetCompany === name ? 'selected' : ''}`}
                                                onClick={() => setTargetCompany(name)}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="ai-wizard-search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search companies..."
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                    />
                                </div>

                                {/* Tabs */}
                                <div className="ai-wizard-tabs">
                                    {COMPANY_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            className={`ai-wizard-tab ${companyTab === tab.id ? 'active' : ''}`}
                                            onClick={() => setCompanyTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Company grid */}
                                <div className="ai-wizard-company-grid">
                                    {filteredCompanies.map((company) => (
                                        <button
                                            key={company.name}
                                            className={`ai-wizard-company-card ${targetCompany === company.name ? 'selected' : ''}`}
                                            onClick={() => setTargetCompany(company.name)}
                                        >
                                            <div className="ai-wizard-company-top">
                                                <span className="ai-wizard-company-icon">{company.icon}</span>
                                                <span className="ai-wizard-company-name">{company.name}</span>
                                                {company.starred && <Star size={14} className="ai-wizard-company-star" />}
                                            </div>
                                            <span className="ai-wizard-company-industry">{company.industry}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ─── Step 5: Review & Start ─── */}
                        {setupStep === 5 && (
                            <div className="ai-wizard-step-body">
                                <div className="ai-wizard-review">
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Experience</span>
                                        <span className="ai-wizard-review-value">
                                            {experienceLevel === 'fresher' ? '🎓 Fresher' : '💼 Experienced'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Interview Type</span>
                                        <span className="ai-wizard-review-value">
                                            {TOPIC_PILLS.find(t => t.id === interviewType)?.label || 'Technical Round'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Resume</span>
                                        <span className="ai-wizard-review-value">
                                            {resumeFile ? resumeFile.name : '—  Not uploaded'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Target Role</span>
                                        <span className="ai-wizard-review-value">
                                            {targetRole || '—  Not specified'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Target Company</span>
                                        <span className="ai-wizard-review-value">
                                            {targetCompany || '—  Not specified'}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row">
                                        <span className="ai-wizard-review-label">Interviewer</span>
                                        <span className="ai-wizard-review-value">
                                            {interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'} {interviewer.name} · {interviewer.role}
                                        </span>
                                    </div>
                                    <div className="ai-wizard-review-row ai-lobby-review-divider">
                                        <span className="ai-wizard-review-label ai-lobby-realtime-label">
                                            <Zap size={14} className="ai-lobby-realtime-icon" /> Real-Time Voice
                                            <span className="ai-lobby-beta-badge">COMING SOON</span>
                                        </span>
                                        <span className="ai-lobby-realtime-status">Classic voice enabled</span>
                                    </div>
                                    <div className="ai-lobby-realtime-desc">
                                        Real-time voice infrastructure is being finalized. Your interview will use the reliable classic voice flow.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Bar */}
                    <div className="ai-wizard-nav">
                        <button
                            className="ai-wizard-nav-btn ai-wizard-nav-btn--back"
                            onClick={() => setSetupStep(s => Math.max(0, s - 1))}
                            disabled={setupStep === 0}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="ai-wizard-nav-right">
                            {setupStep < 5 && (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--skip"
                                    onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                >
                                    Skip
                                </button>
                            )}
                            {setupStep < 5 ? (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--next"
                                    onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    className="ai-wizard-nav-btn ai-wizard-nav-btn--next ai-setup-start-btn"
                                    onClick={onStartInterview}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Sparkles size={18} className="ai-setup-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>Start Interview <ArrowRight size={16} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="ai-setup-privacy">
                        🔒 Your data is encrypted and never shared. Sessions are private.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default memo(InterviewLobby);
