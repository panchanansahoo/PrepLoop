import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';


import VoiceWaveform from '../components/VoiceWaveform';
import InterviewResults from '../components/interview/InterviewResults';
import InterviewLobby from '../components/interview/InterviewLobby';
import InterviewControls from '../components/interview/InterviewControls';
import LiveCaptions from '../components/interview/LiveCaptions';
const InterviewWorkspace = lazy(() => import('../components/interview/InterviewWorkspace'));
import ChatSidebar from '../components/interview/ChatSidebar';
import InterviewTopBar from '../components/interview/InterviewTopBar';
import ScoreCueToast from '../components/interview/ScoreCueToast';
import HintBanner from '../components/interview/HintBanner';
import { Mic, MicOff, Sparkles, MessageSquare, Volume2, Wifi, User, Building2, AlertTriangle, Brain, Keyboard, Send, RotateCcw, HelpCircle } from 'lucide-react';
import {
    BOILERPLATE,
    COMPANY_INTERVIEWERS,
    DEFAULT_INTERVIEWER,
    HR_INTERVIEWER_VIDEOS,
    formatTime,
} from './aiInterviewConfig';
import useInterviewSession from '../hooks/useInterviewSession';
import './AIInterviewPage.css';

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'docx'];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_MB = MAX_RESUME_BYTES / (1024 * 1024);

export default function AIInterviewPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [micCheckStatus, setMicCheckStatus] = useState('not_checked');
    const [cameraCheckStatus, setCameraCheckStatus] = useState('not_checked');
    const [lobbyMicStream, setLobbyMicStream] = useState(null);
    const [lobbyCameraStream, setLobbyCameraStream] = useState(null);
    const [lobbyMicLevel, setLobbyMicLevel] = useState(0);
    const [preflightError, setPreflightError] = useState(null);

    const checkMicrophone = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicCheckStatus('unsupported');
            return false;
        }
        setMicCheckStatus('checking');
        setPreflightError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const track = stream.getAudioTracks()[0];
            const deviceName = track?.label || 'Microphone';
            setLobbyMicStream(stream);
            setMicCheckStatus(`ready:${deviceName}`);
            return true;
        } catch (error) {
            const status = error.name === 'NotAllowedError' ? 'denied' : 'unavailable';
            setMicCheckStatus(status);
            setPreflightError(status === 'denied'
                ? 'Microphone permission was denied. Please allow microphone access in your browser settings to continue.'
                : 'Could not access your microphone. Please make sure it is plugged in and not in use by another app.');
            return false;
        }
    }, []);

    const checkCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraCheckStatus('unsupported');
            return false;
        }
        setCameraCheckStatus('checking');
        setPreflightError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 480 }, height: { ideal: 360 } }
            });
            setLobbyCameraStream(stream);
            setCameraCheckStatus('ready');
            return true;
        } catch (error) {
            setCameraCheckStatus(error.name === 'NotAllowedError' ? 'denied' : 'unavailable');
            return false;
        }
    }, []);

    // Monitor microphone stream volume in the lobby
    useEffect(() => {
        if (!lobbyMicStream) {
            setLobbyMicLevel(0);
            return;
        }
        let audioCtx;
        let animId;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaStreamSource(lobbyMicStream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setLobbyMicLevel(Math.min(1, avg / 60));
                animId = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            /* ignore audio context failure */
        }
        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (audioCtx) audioCtx.close().catch(() => {});
        };
    }, [lobbyMicStream]);


    const tokenParam = searchParams.get('token')?.trim();
    const questionSetCode = tokenParam || searchParams.get('set')?.trim();
    const voiceOnlyInterview = Boolean(questionSetCode);
    const focusArea = searchParams.get('focus') || '';
    const {
        state, refs, actions,
        voiceAI, intelligence, isListening,
    } = useInterviewSession({ questionSetCode, token: tokenParam, focusArea });

    const {
        phase, interviewType, realtimeMode, interviewerGender, activeTab,
        language, code, elapsed, isPaused,
        questionElapsed, questionIndex, totalQuestions,
        stageLabel, stagePlan, loading,
        scoreCue, activeHint, analysisLoading, cameraOn, bookmarked,
        speakerMuted, micOn, interviewerVideoReady, interviewerVisibleMode,
        aiSpeaking, transcript, silenceCountdown, chatOpen, conversation,
        userInput, interviewerStatus, notes, savedSession,
        pacingMode, needAMomentCount, maxNeedAMoment, checkInActive, wrapUpWarning,
        setupStep, experienceLevel, targetRole, targetCompany, companySearch,
        companyTab, resumeFile, analysisResult,
        captionsOn, workspacePanelOpen, workspaceDropdownOpen,
        cameraError, showEndConfirm, awaitingAnswer, isOnline,
        customQuestionSet, questionSetLoading, questionSetError, questionSetAccessError, questionSetPasscode, candidateEmail, candidateName, submissionStatus, resumeParseError,
        answerReview,
    } = state;

    const {
        chatEndRef,
        interviewerSpeakingVideoRef, interviewerListeningVideoRef,
        interviewerTargetModeRef, videoRef,
    } = refs;

    const {
        setPhase, setInterviewType, setRealtimeMode, setInterviewerGender,
        setActiveTab, setLanguage, setCode, setNotes,
        setQuestionIndex,
        setScoreCue, setActiveHint,
        setBookmarked, setSpeakerMuted,
        setChatOpen, setConversation, setUserInput,
        setSetupStep, setExperienceLevel, setTargetRole, setTargetCompany,
        setCompanySearch, setCompanyTab, setResumeFile, setResumeParseError,
        setAnalysisResult,
        setCaptionsOn, setWorkspacePanelOpen, setWorkspaceDropdownOpen,
        setElapsed,
        retryCustomSubmission,
        setQuestionSetPasscode, setCandidateEmail, setCandidateName, setQuestionSetAccessError,
        clearSavedSession, restoreSession, setTranscript,
        handleLanguageChange, handleReset, startInterview, sendAnswer,
        endInterview, togglePause, toggleMic, toggleCamera,
        handleVoiceInput,
        setPacingMode, requestNeedAMoment, repeatCurrentQuestion,
        skipCurrentQuestion, handleDoneAnswering, setCheckInActive,
        handleInterviewerTimeUpdate, handleInterviewerLoadedMetadata,
        handleInterviewerCanPlay,
        setShowEndConfirm,
        handleAskQuestion, startAnswer,
        continueAnswer,
    } = actions;

    // Pre-flight verified start interview
    const handleStartWithPreflight = useCallback(async () => {
        setPreflightError(null);
        // 1. Verify microphone
        let micOk = micCheckStatus.startsWith('ready:');
        if (!micOk) {
            micOk = await checkMicrophone();
        }
        if (!micOk) {
            setPreflightError('Microphone permission is required to speak with the AI interviewer. Please grant microphone access to begin.');
            return;
        }

        // 2. Check camera if not checked
        if (cameraCheckStatus === 'not_checked') {
            await checkCamera();
        }

        // 3. Clean up lobby preview streams so devices are released for the interview session
        if (lobbyMicStream) {
            lobbyMicStream.getTracks().forEach((t) => t.stop());
            setLobbyMicStream(null);
        }
        if (lobbyCameraStream) {
            lobbyCameraStream.getTracks().forEach((t) => t.stop());
            setLobbyCameraStream(null);
        }

        // 4. Begin interview (or navigate to peer interview)
        if (interviewType === 'peer') {
            navigate('/peer-interview');
            return;
        }
        startInterview();
    }, [micCheckStatus, cameraCheckStatus, checkMicrophone, checkCamera, lobbyMicStream, lobbyCameraStream, startInterview]);
    const hasTranscriptDraft = Boolean(transcript.trim());
    const reviewingTranscript = answerReview || hasTranscriptDraft;

    const handleSpeakingLoadedMetadata = React.useCallback(() => handleInterviewerLoadedMetadata('speaking'), [handleInterviewerLoadedMetadata]);
    const handleSpeakingTimeUpdate = React.useCallback(() => handleInterviewerTimeUpdate('speaking'), [handleInterviewerTimeUpdate]);
    const handleSpeakingCanPlay = React.useCallback(() => handleInterviewerCanPlay('speaking'), [handleInterviewerCanPlay]);
    const handleListeningLoadedMetadata = React.useCallback(() => handleInterviewerLoadedMetadata('listening'), [handleInterviewerLoadedMetadata]);
    const handleListeningTimeUpdate = React.useCallback(() => handleInterviewerTimeUpdate('listening'), [handleInterviewerTimeUpdate]);
    const handleListeningCanPlay = React.useCallback(() => handleInterviewerCanPlay('listening'), [handleInterviewerCanPlay]);

    const handleToggleMic = useCallback(() => {
        if (awaitingAnswer && !isListening) {
            startAnswer();
            return;
        }
        toggleMic();
    }, [awaitingAnswer, isListening, toggleMic, startAnswer]);

    const acceptResumeFile = React.useCallback((file) => {
        if (!file) return;
        const extension = String(file.name || '').split('.').pop()?.toLowerCase();
        if (!ALLOWED_RESUME_EXTENSIONS.includes(extension)) {
            setResumeParseError('Please upload a PDF or DOCX file.');
            return;
        }
        if (file.size > MAX_RESUME_BYTES) {
            setResumeParseError(`Resume must be ${MAX_RESUME_MB}MB or smaller.`);
            return;
        }
        setResumeParseError(null);
        setResumeFile(file);
    }, [setResumeFile, setResumeParseError]);

    const handleResumeDragOver = React.useCallback((e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }, []);
    const handleResumeDragLeave = React.useCallback((e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }, []);
    const handleResumeDrop = React.useCallback((e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) acceptResumeFile(e.dataTransfer.files[0]);
    }, [acceptResumeFile]);
    const handleResumeFileChange = React.useCallback((e) => {
        acceptResumeFile(e.target.files?.[0]);
    }, [acceptResumeFile]);

    const customCompany = customQuestionSet?.settings?.companyName || targetCompany;
    const customRole = customQuestionSet?.settings?.roleName || targetRole;
    const companyPool = customCompany && COMPANY_INTERVIEWERS[customCompany]
        ? COMPANY_INTERVIEWERS[customCompany]
        : DEFAULT_INTERVIEWER;
    const interviewerVideos = HR_INTERVIEWER_VIDEOS[interviewerGender] || HR_INTERVIEWER_VIDEOS.female;
    const INTERVIEWER = {
        ...(companyPool[interviewerGender] || companyPool.female),
        company: customCompany || 'PrepLoop',
        role: customRole ? `${customRole} Interviewer` : (companyPool[interviewerGender] || companyPool.female).role,
        avatar: '/interviewer-avatar.png',
    };

    const activeQuestion = customQuestionSet?.questions?.[questionIndex - 1];
    const activeQuestionTimeLimit = activeQuestion?.timeLimit;
    const activeQuestionContext = activeQuestion?.context;

    const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
    const [evaluatingStep, setEvaluatingStep] = useState(0);

    const EVAL_THINKING_STEPS = [
        'Reviewing your approach...',
        'Jotting down notes...',
        'Synthesizing feedback...',
        'Formulating follow-up question...',
    ];

    useEffect(() => {
        if (!loading && voiceAI.state !== 'processing') {
            setEvaluatingStep(0);
            return;
        }
        const interval = setInterval(() => {
            setEvaluatingStep((prev) => (prev + 1) % EVAL_THINKING_STEPS.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [loading, voiceAI.state]);

    useEffect(() => {
        if (phase !== 'interview') return;
        const handler = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
            if (document.activeElement?.classList?.contains('inputarea')) return;
            if (e.key === '?' || (e.key.toLowerCase() === 'h' && e.shiftKey)) {
                setKeyboardHelpOpen(prev => !prev);
                return;
            }
            if (e.code === 'Space' || e.key === ' ') {
                if (isListening || awaitingAnswer || (!aiSpeaking && !loading && !isPaused)) {
                    e.preventDefault();
                    handleToggleMic();
                    return;
                }
            }
            switch (e.key.toLowerCase()) {
                case 'm': handleToggleMic(); break;
                case 'v': toggleCamera(); break;
                case 'p': togglePause(); break;
                case 'escape':
                    if (!aiSpeaking && !loading) setShowEndConfirm(true);
                    break;
                default: break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, handleToggleMic, toggleCamera, togglePause, keyboardHelpOpen, setShowEndConfirm, aiSpeaking, loading, isListening, awaitingAnswer]);

    // Guard against accidentally closing/refreshing the tab mid-interview.
    // In-app navigation is handled by the logo/End actions below.
    useEffect(() => {
        if (phase !== 'interview') return undefined;
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [phase]);

    const handleEndClick = useCallback(() => {
        setShowEndConfirm(true);
    }, [setShowEndConfirm]);

    // Stable dismiss handlers: the page re-renders every second (timers), and
    // inline callbacks would reset the toast/banner auto-hide timers.
    const dismissScoreCue = useCallback(() => setScoreCue(null), [setScoreCue]);
    const dismissHint = useCallback(() => setActiveHint(null), [setActiveHint]);
    const closeChat = useCallback(() => setChatOpen(false), [setChatOpen]);
    const toggleKeyboardHelp = useCallback(() => setKeyboardHelpOpen((prev) => !prev), []);

    const confirmEnd = useCallback(() => {
        setShowEndConfirm(false);
        endInterview();
    }, [endInterview, setShowEndConfirm]);

    const cancelEnd = useCallback(() => {
        setShowEndConfirm(false);
    }, [setShowEndConfirm]);

    const userName = user?.fullName || user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate';
    const userInitial = userName[0]?.toUpperCase() || 'C';

    if (phase === 'lobby') {
        return (
            <InterviewLobby
                setupStep={setupStep} setSetupStep={setSetupStep}
                experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
                pacingMode={pacingMode} setPacingMode={setPacingMode}
                interviewType={interviewType} setInterviewType={setInterviewType}
                interviewerGender={interviewerGender} setInterviewerGender={setInterviewerGender}
                targetRole={targetRole} setTargetRole={setTargetRole}
                targetCompany={targetCompany} setTargetCompany={setTargetCompany}
                companySearch={companySearch} setCompanySearch={setCompanySearch}
                companyTab={companyTab} setCompanyTab={setCompanyTab}
                resumeFile={resumeFile}
                realtimeMode={realtimeMode} setRealtimeMode={setRealtimeMode}
                loading={loading}
                savedSession={savedSession}
                interviewer={INTERVIEWER}
                formatTime={formatTime}
                onStartInterview={handleStartWithPreflight}
                onRestoreSession={restoreSession}
                onClearSavedSession={clearSavedSession}
                onResumeDragOver={handleResumeDragOver}
                onResumeDragLeave={handleResumeDragLeave}
                onResumeDrop={handleResumeDrop}
                onResumeFileChange={handleResumeFileChange}
                questionSetCode={questionSetCode}
                customQuestionSet={customQuestionSet}
                questionSetLoading={questionSetLoading}
                questionSetError={questionSetError}
                questionSetAccessError={questionSetAccessError}
                questionSetPasscode={questionSetPasscode}
                onQuestionSetPasscodeChange={(value) => { setQuestionSetPasscode(value); setQuestionSetAccessError(null); }}
                candidateEmail={candidateEmail}
                onCandidateEmailChange={(value) => { setCandidateEmail(value); setQuestionSetAccessError(null); }}
                candidateName={candidateName}
                onCandidateNameChange={(value) => { setCandidateName(value); setQuestionSetAccessError(null); }}
                resumeParseError={resumeParseError}
                micCheckStatus={micCheckStatus}
                onCheckMicrophone={checkMicrophone}
                cameraCheckStatus={cameraCheckStatus}
                onCheckCamera={checkCamera}
                cameraStream={lobbyCameraStream}
                micLevel={lobbyMicLevel}
                preflightError={preflightError}
                onClearPreflightError={() => setPreflightError(null)}
            />
        );
    }

    if (phase === 'connecting') {
        return (
            <div className="ai-interview-page">
                <div className="ai-connect-backdrop">
                    <div className="ai-connect-glow ai-connect-glow--left" />
                    <div className="ai-connect-glow ai-connect-glow--right" />
                    <div className="ai-connect-container">
                        <div className="ai-connect-status-text">
                            <Wifi size={18} className="ai-connect-wifi-icon" />
                            Connecting to your interviewer
                        </div>

                        <div className="ai-connect-matchup">
                            <div className="ai-connect-card ai-connect-card--candidate">
                                <div className="ai-connect-avatar">
                                    <div className="ai-connect-avatar-ring" />
                                    <div className="ai-connect-avatar-inner"><User size={28} /></div>
                                </div>
                                <div className="ai-connect-name">{userName}</div>
                                <div className="ai-connect-role">Candidate</div>
                            </div>
                            <div className="ai-connect-bridge">
                                <div className="ai-connect-line">
                                    <div className="ai-connect-dot ai-connect-dot--1" />
                                    <div className="ai-connect-dot ai-connect-dot--2" />
                                    <div className="ai-connect-dot ai-connect-dot--3" />
                                </div>
                                <div className="ai-connect-pulse-ring" />
                            </div>
                            <div className="ai-connect-card ai-connect-card--interviewer">
                                <div className="ai-connect-avatar ai-connect-avatar--ai">
                                    <div className="ai-connect-avatar-ring ai-connect-avatar-ring--ai" />
                                    <div className="ai-connect-avatar-inner ai-connect-avatar-inner--ai"><Sparkles size={28} /></div>
                                </div>
                                <div className="ai-connect-name">{INTERVIEWER.name}</div>
                                <div className="ai-connect-role">{INTERVIEWER.role}</div>
                                <div className="ai-connect-company"><Building2 size={12} />{INTERVIEWER.company}</div>
                            </div>
                        </div>
                        <div className="ai-connect-progress"><div className="ai-connect-progress-bar" /></div>
                        <p className="ai-connect-hint">Setting up your personalized session...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'summary') {
        return (
            <InterviewResults
                analysisResult={analysisResult}
                analysisLoading={analysisLoading}
                interviewer={INTERVIEWER}
                interviewType={interviewType}
                conversation={conversation}
                submissionStatus={submissionStatus}
                onRetrySubmission={retryCustomSubmission}
                onStartNew={() => {
                    setPhase('lobby');
                    setSetupStep(0);
                    setElapsed(0);
                    setConversation([]);
                    setQuestionIndex(0);
                    setAnalysisResult(null);
                    setInterviewerGender('female');
                    setExperienceLevel('fresher');
                    setCode(BOILERPLATE.python);
                    setLanguage('python');
                }}
            />
        );
    }

    return (
        <div className="ai-interview-page ai-interview-page--videocall">
            <InterviewTopBar
                interviewType={interviewType}
                totalQuestions={totalQuestions}
                questionIndex={questionIndex}
                elapsed={elapsed}
                questionElapsed={questionElapsed}
                isPaused={isPaused}
                stageLabel={stageLabel}
                stagePlan={stagePlan}
                targetCompany={targetCompany}
                customTimeLimit={activeQuestionTimeLimit}
                customQuestionSet={customQuestionSet}
                connectionMode={voiceAI.connectionMode}
                connectionHealth={voiceAI.connectionHealth}
                workspacePanelOpen={workspacePanelOpen}
                setWorkspacePanelOpen={setWorkspacePanelOpen}
                endInterview={handleEndClick}
                onNavigateBack={handleEndClick}
            />

            <div className="ai-vc-body">
                <div className={`ai-vc-video-area ${!workspacePanelOpen ? 'ai-vc-video-area--full' : ''}`}>
                    <div className={`ai-vc-tile ai-vc-tile--interviewer ${aiSpeaking ? 'ai-vc-tile--speaking' : ''}`}>
                        {activeQuestionContext && (
                            <div className="ai-vc-q-context-pill" style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                maxWidth: '80%',
                                background: 'rgba(15, 23, 42, 0.88)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(129, 140, 248, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#e2e8f0',
                                zIndex: 10,
                                lineHeight: 1.4,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                <HelpCircle size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                                <span><strong style={{ color: '#a5b4fc' }}>Context:</strong> {activeQuestionContext}</span>
                            </div>
                        )}
                        <div className="ai-vc-tile-bg">
                            <video
                                ref={interviewerSpeakingVideoRef}
                                src={interviewerVideos.speaking}
                                className={`ai-vc-ai-video ai-vc-ai-video--layer ai-vc-ai-video--speaking ${interviewerVisibleMode === 'speaking' ? 'is-active' : 'is-inactive'} ${interviewerTargetModeRef.current === 'speaking' && !interviewerVideoReady.speaking ? 'is-pending' : ''}`}
                                autoPlay loop muted playsInline preload="auto"
                                onLoadedMetadata={handleSpeakingLoadedMetadata}
                                onTimeUpdate={handleSpeakingTimeUpdate}
                                onCanPlay={handleSpeakingCanPlay}
                            />
                            <video
                                ref={interviewerListeningVideoRef}
                                src={interviewerVideos.listening}
                                className={`ai-vc-ai-video ai-vc-ai-video--layer ai-vc-ai-video--listening ${interviewerVisibleMode === 'listening' ? 'is-active' : 'is-inactive'} ${interviewerTargetModeRef.current === 'listening' && !interviewerVideoReady.listening ? 'is-pending' : ''}`}
                                autoPlay loop muted playsInline preload="auto"
                                onLoadedMetadata={handleListeningLoadedMetadata}
                                onTimeUpdate={handleListeningTimeUpdate}
                                onCanPlay={handleListeningCanPlay}
                            />
                            {aiSpeaking && <div className="ai-vc-video-speaking-glow" />}
                            {aiSpeaking && (
                                <div className="ai-vc-speaking-ring"><div className="ai-vc-speaking-ring-inner" /></div>
                            )}
                            {aiSpeaking && (
                                <div className="ai-vc-lipsync">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="ai-vc-lipsync-bar"
                                            style={{
                                                animationDelay: `${i * 0.08}s`,
                                                height: `${6 + (voiceAI.outputBars?.[i] || voiceAI.outputBars?.[i * 2] || 0.25) * 20}px`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="ai-vc-tile-badge">
                            <div className="ai-vc-tile-badge-dot" />
                            <span className="ai-vc-tile-badge-name">{INTERVIEWER.name}</span>
                            <span className="ai-vc-tile-badge-role">{INTERVIEWER.role}</span>
                        </div>
                        {aiSpeaking ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform bars={voiceAI.outputBars} active={voiceAI.outputActive} color="#a78bfa" height={36} />
                            </div>
                        ) : isListening ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform bars={voiceAI.inputBars} active={voiceAI.inputActive} color="#34d399" height={36} />
                            </div>
                        ) : (loading || voiceAI.state === 'processing') ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform bars={[0.3, 0.6, 0.45, 0.7, 0.5, 0.35]} active={true} color="#818cf8" height={28} />
                            </div>
                        ) : null}
                        {isListening && intelligence.totalFillers > 0 && (
                            <div className="ai-vc-filler-badge" title="Filler words detected">
                                <AlertTriangle size={11} /><span>{intelligence.totalFillers}</span>
                            </div>
                        )}
                        {isListening && (
                            <div className="ai-vc-confidence-meter" title={`Confidence: ${intelligence.confidenceScore}%`}>
                                <div className="ai-vc-confidence-meter-fill" style={{ width: `${intelligence.confidenceScore}%` }} />
                            </div>
                        )}
                        <div className="ai-vc-status-overlay">
                            {aiSpeaking ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--speaking"><Volume2 size={12} /> Speaking...</div>
                            ) : (loading || voiceAI.state === 'processing') ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking">
                                    <Brain size={12} className="ai-spin-slow" /> {EVAL_THINKING_STEPS[evaluatingStep]}
                                </div>
                            ) : !isOnline ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(239, 68, 68, 0.9)' }}>
                                    <Wifi size={12} /> Connection lost — we'll retry when you're back online
                                </div>
                            ) : awaitingAnswer ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(34, 197, 94, 0.9)' }}>
                                    <Mic size={12} /> Your turn — start speaking (or press Space)
                                </div>
                            ) : interviewerStatus ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(245, 158, 11, 0.9)' }}><MessageSquare size={12} /> {interviewerStatus}</div>
                            ) : cameraError ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(239, 68, 68, 0.9)' }}><AlertTriangle size={12} /> {cameraError}</div>
                            ) : null}
                        </div>
                    </div>

                    <div className={`ai-vc-tile ai-vc-tile--user ${isListening && (voiceAI.inputActive || voiceAI.inputBars?.some((b) => b > 0.12)) ? 'is-speaking' : ''}`}>
                        {cameraOn ? (
                            <video ref={videoRef} autoPlay playsInline muted className="ai-vc-user-video" />
                        ) : (
                            <div className="ai-vc-user-off">
                                <div className="ai-vc-user-off-avatar">{userInitial}</div>
                            </div>
                        )}
                        <div className="ai-vc-tile-badge ai-vc-tile-badge--user">
                            <span className="ai-vc-tile-badge-name">You</span>
                            {!micOn ? (
                                <MicOff size={11} className="ai-vc-muted-icon" />
                            ) : isListening ? (
                                <div className="ai-vc-user-audio-meter" title="Mic active">
                                    <span className="ai-vc-user-audio-bar" style={{ height: `${4 + (voiceAI.inputBars?.[0] || 0) * 12}px` }} />
                                    <span className="ai-vc-user-audio-bar" style={{ height: `${4 + (voiceAI.inputBars?.[1] || 0) * 12}px` }} />
                                    <span className="ai-vc-user-audio-bar" style={{ height: `${4 + (voiceAI.inputBars?.[2] || 0) * 12}px` }} />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {(answerReview || voiceAI.state === 'error') && (
                        <div className="ai-vc-answer-review" role="region" aria-label="Review your answer">
                            <div className="ai-vc-answer-review-heading">
                                <strong>{reviewingTranscript ? 'Review your answer' : 'Microphone needs attention'}</strong>
                                <span>{reviewingTranscript ? (answerReview ? (voiceOnlyInterview ? 'Your spoken answer is transcribed below. Send it or keep speaking.' : 'Review the transcript, send it, or keep speaking.') : `${voiceAI.errorMessage || 'Transcription failed.'} Your partial transcript is shown below.`) : (voiceAI.errorMessage || 'Retry the saved recording or record your answer again.')}</span>
                            </div>
                            {reviewingTranscript && (
                                <textarea
                                    value={transcript}
                                    onChange={voiceOnlyInterview ? undefined : (event) => setTranscript(event.target.value)}
                                    readOnly={voiceOnlyInterview}
                                    placeholder="Your recognized answer…"
                                    rows={3}
                                />
                            )}
                            <div className="ai-vc-answer-review-actions">
                                {reviewingTranscript ? (
                                    <>
                                        {answerReview && <button type="button" onClick={continueAnswer}><Mic size={14} /> Continue speaking</button>}
                                        {!answerReview && voiceAI.hasPendingTranscription && (
                                            <button type="button" onClick={voiceAI.retryTranscription} disabled={!isOnline}>
                                                <RotateCcw size={14} /> Retry saved audio
                                            </button>
                                        )}
                                        <button type="button" className="primary" onClick={() => sendAnswer(false, transcript)} disabled={!transcript.trim() || loading}><Send size={14} /> {voiceOnlyInterview ? 'Send spoken answer' : 'Send answer'}</button>
                                    </>
                                ) : (
                                    <>
                                        {voiceAI.hasPendingTranscription ? (
                                            <button type="button" onClick={voiceAI.retryTranscription} disabled={!isOnline}>
                                                <RotateCcw size={14} /> Retry saved audio
                                            </button>
                                        ) : (
                                            <button type="button" onClick={() => { setTranscript(''); voiceAI.start(); }}>
                                                <RotateCcw size={14} /> Try microphone again
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <LiveCaptions
                        captionsOn={captionsOn} isListening={isListening} aiSpeaking={aiSpeaking}
                        aiThinking={loading || voiceAI.state === 'loading' || voiceAI.state === 'processing'}
                        interimText={voiceAI.interimText} transcript={transcript}
                        conversation={conversation} interviewerName={INTERVIEWER.name}
                        silenceCountdown={voiceAI.silenceCountdown}
                        connectionMode={voiceAI.connectionMode}
                    />

                    <InterviewControls
                        micOn={micOn} toggleMic={handleToggleMic} isListening={isListening}
                        cameraOn={cameraOn} toggleCamera={toggleCamera}
                        speakerMuted={speakerMuted} setSpeakerMuted={setSpeakerMuted}
                        isPaused={isPaused} onTogglePause={togglePause}
                        captionsOn={captionsOn} setCaptionsOn={setCaptionsOn}
                        chatOpen={chatOpen} setChatOpen={setChatOpen}
                        bookmarked={bookmarked} setBookmarked={setBookmarked}
                        endInterview={handleEndClick}
                        connectionMode={voiceAI.connectionMode}
                        onKeyboardHelp={toggleKeyboardHelp}
                        onAskQuestion={handleAskQuestion}
                        awaitingAnswer={awaitingAnswer}
                        voiceOnly={voiceOnlyInterview}
                    />
                </div>

                {workspacePanelOpen && (
                  <Suspense fallback={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--zinc-400)' }}>
                      Loading workspace...
                    </div>
                  }>
                    <InterviewWorkspace
                        activeTab={activeTab} setActiveTab={setActiveTab}
                        workspaceDropdownOpen={workspaceDropdownOpen} setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
                        language={language} onLanguageChange={handleLanguageChange}
                        code={code} setCode={setCode} onReset={handleReset}
                        notes={notes} setNotes={setNotes}
                        isListening={isListening} transcript={transcript} interimText={voiceAI.interimText}
                        silenceCountdown={silenceCountdown}
                        onVoiceInput={handleVoiceInput}
                        voiceOnly={voiceOnlyInterview}
                        userInput={userInput} setUserInput={setUserInput} setTranscript={setTranscript}
                        onSendAnswer={sendAnswer} loading={loading}
                        pacingMode={pacingMode}
                        needAMomentCount={needAMomentCount}
                        maxNeedAMoment={maxNeedAMoment}
                        checkInActive={checkInActive}
                        wrapUpWarning={wrapUpWarning}
                        micWarning={voiceAI.micWarning}
                        isThinking={voiceAI.isThinking}
                        onRequestNeedAMoment={requestNeedAMoment}
                        onRepeatQuestion={repeatCurrentQuestion}
                        onSkipQuestion={skipCurrentQuestion}
                        onDoneAnswering={handleDoneAnswering}
                        onDismissCheckIn={() => setCheckInActive(false)}
                    />
                  </Suspense>
                )}

                {chatOpen && (
                    <ChatSidebar
                        conversation={conversation} interviewerName={INTERVIEWER.name}
                        loading={loading} userInput={userInput} setUserInput={setUserInput}
                        onSendAnswer={sendAnswer} onClose={closeChat}
                        chatEndRef={chatEndRef} code={code}
                        voiceOnly={voiceOnlyInterview}
                    />
                )}

                {showEndConfirm && (
                    <div className="ai-vc-overlay" onClick={cancelEnd}>
                        <div className="ai-vc-confirm-dialog" onClick={e => e.stopPropagation()}>
                            <h3>End Interview?</h3>
                            <p>Your progress will be saved and you will see your results.</p>
                            <div className="ai-vc-confirm-actions">
                                <button className="ai-vc-confirm-btn ai-vc-confirm-btn--cancel" onClick={cancelEnd}>Cancel</button>
                                <button className="ai-vc-confirm-btn ai-vc-confirm-btn--confirm" onClick={confirmEnd}>End Interview</button>
                            </div>
                        </div>
                    </div>
                )}

                {keyboardHelpOpen && (
                    <div className="ai-vc-overlay" onClick={() => setKeyboardHelpOpen(false)}>
                        <div className="ai-vc-keyboard-help" onClick={e => e.stopPropagation()}>
                            <div className="ai-vc-keyboard-help-header">
                                <Keyboard size={16} />
                                <span>Keyboard Shortcuts</span>
                                <button className="ai-vc-keyboard-close" onClick={() => setKeyboardHelpOpen(false)}>×</button>
                            </div>
                            <div className="ai-vc-keyboard-help-body">
                                <div className="ai-vc-shortcut-row"><kbd>Space</kbd><span>Start speaking / finish recording</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>M</kbd><span>Toggle microphone / Start answering</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>V</kbd><span>Toggle camera</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>P</kbd><span>Pause / Resume interview</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>Esc</kbd><span>End interview</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>?</kbd><span>Toggle this help overlay</span></div>
                            </div>
                        </div>
                    </div>
                )}

                <ScoreCueToast cue={scoreCue} onDismiss={dismissScoreCue} />
                <HintBanner hint={activeHint} onDismiss={dismissHint} />
            </div>
        </div>
    );
}
