import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';


import VoiceWaveform from '../components/VoiceWaveform';
import InterviewResults from '../components/interview/InterviewResults';
import InterviewLobby from '../components/interview/InterviewLobby';
import InterviewControls from '../components/interview/InterviewControls';
import LiveCaptions from '../components/interview/LiveCaptions';
import InterviewWorkspace from '../components/interview/InterviewWorkspace';
import ChatSidebar from '../components/interview/ChatSidebar';
import InterviewTopBar from '../components/interview/InterviewTopBar';
import ScoreCueToast from '../components/interview/ScoreCueToast';
import HintBanner from '../components/interview/HintBanner';
import { Mic, MicOff, Sparkles, MessageSquare, Volume2, Wifi, User, Building2, AlertTriangle, Brain, Code2, Shield, Keyboard } from 'lucide-react';
import {
    BOILERPLATE,
    COMPANY_INTERVIEWERS,
    DEFAULT_INTERVIEWER,
    HR_INTERVIEWER_VIDEOS,
    formatTime,
} from './aiInterviewConfig';
import useInterviewSession from '../hooks/useInterviewSession';
import './AIInterviewPage.css';

export default function AIInterviewPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        state, refs, actions,
        voiceAI, intelligence, isListening,
    } = useInterviewSession();

    const {
        phase, interviewType, realtimeMode, interviewerGender, activeTab,
        language, code, _lineCount, elapsed, isPaused,_totalPauseTimee,
        questionElapsed, _currentQuestion, questionIndex, totalQuestions,
        stageLabel, stagePlan, loading, _consecutiveSilentQuestions,
        scoreCue, activeHint, analysisLoading, cameraOn, bookmarked,
        speakerMuted, micOn, interviewerVideoReady, interviewerVisibleMode,
        aiSpeaking, transcript, silenceCountdown, chatOpen, conversation,
        userInput, interviewerStatus, _silenceStage, notes, savedSession,
        setupStep, experienceLevel, targetRole, targetCompany, companySearch,
        companyTab, resumeFile, _activeResumeContext,_resultTabb, analysisResult,
        _expandedMoment, captionsOn, workspacePanelOpen, workspaceDropdownOpen,
        cameraError, showEndConfirm, awaitingAnswer,
    } = state;

    const {
        _sendAnswerRef, chatEndRef,_ttsAudioReff,
        _streamRef, interviewerSpeakingVideoRef, interviewerListeningVideoRef,
        interviewerTargetModeRef, videoRef,
    } = refs;

    const {
        setPhase, setInterviewType, setRealtimeMode, setInterviewerGender,
        setActiveTab, setLanguage, setCode, setNotes,
        _setIsPaused,_setCurrentQuestionn, setQuestionIndex,
        _setTotalQuestions,_setStageLabell_setStagePlanan,
        _setLoading, setScoreCue, setActiveHint,
        _setCameraOn, setBookmarked, setSpeakerMuted,
        setChatOpen, setConversation, setUserInput, _setInterviewerStatus,
        setSetupStep, setExperienceLevel, setTargetRole, setTargetCompany,
        setCompanySearch, setCompanyTab, setResumeFile, _setActiveResumeContext,
        _setResultTab, setAnalysisResult,_setExpandedMomentt,
        setCaptionsOn, setWorkspacePanelOpen, setWorkspaceDropdownOpen,
        _setSavedSession,_setMicOnn, setElapsed,
        clearSavedSession, restoreSession, setTranscript,
        handleLanguageChange, handleReset, startInterview, sendAnswer,
        endInterview, togglePause, toggleMic, toggleCamera,
        handleVoiceInput, _startVoiceRecording,_stopVoiceRecordingg,
        _speakInterviewerText,_speakSequencee_stopSilenceHandlingng,
        handleInterviewerTimeUpdate, handleInterviewerLoadedMetadata,
        handleInterviewerCanPlay,
        setShowEndConfirm, _setCameraError,_setAwaitingAnswerr,
        handleAskQuestion, startAnswer,
    } = actions;

    const handleSpeakingLoadedMetadata = React.useCallback(() => handleInterviewerLoadedMetadata('speaking'), [handleInterviewerLoadedMetadata]);
    const handleSpeakingTimeUpdate = React.useCallback(() => handleInterviewerTimeUpdate('speaking'), [handleInterviewerTimeUpdate]);
    const handleSpeakingCanPlay = React.useCallback(() => handleInterviewerCanPlay('speaking'), [handleInterviewerCanPlay]);
    const handleListeningLoadedMetadata = React.useCallback(() => handleInterviewerLoadedMetadata('listening'), [handleInterviewerLoadedMetadata]);
    const handleListeningTimeUpdate = React.useCallback(() => handleInterviewerTimeUpdate('listening'), [handleInterviewerTimeUpdate]);
    const handleListeningCanPlay = React.useCallback(() => handleInterviewerCanPlay('listening'), [handleInterviewerCanPlay]);

    const handleToggleMic = useCallback(() => {
        if (awaitingAnswer) {
            startAnswer();
            return;
        }
        toggleMic();
    }, [awaitingAnswer, toggleMic, startAnswer]);

    const handleResumeDragOver = React.useCallback((e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }, []);
    const handleResumeDragLeave = React.useCallback((e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }, []);
    const handleResumeDrop = React.useCallback((e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) setResumeFile(e.dataTransfer.files[0]);
    }, [setResumeFile]);
    const handleResumeFileChange = React.useCallback((e) => {
        if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
    }, [setResumeFile]);

    const companyPool = targetCompany && COMPANY_INTERVIEWERS[targetCompany]
        ? COMPANY_INTERVIEWERS[targetCompany]
        : DEFAULT_INTERVIEWER;
    const interviewerVideos = HR_INTERVIEWER_VIDEOS[interviewerGender] || HR_INTERVIEWER_VIDEOS.female;
    const INTERVIEWER = {
        ...(companyPool[interviewerGender] || companyPool.female),
        company: targetCompany || 'Google',
        avatar: '/interviewer-avatar.png',
    };

    const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

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
            if (keyboardHelpOpen) return;
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
    }, [phase, handleToggleMic, toggleCamera, togglePause, keyboardHelpOpen, setShowEndConfirm, aiSpeaking, loading]);

    const handleEndClick = useCallback(() => {
        setShowEndConfirm(true);
    }, [setShowEndConfirm]);

    const confirmEnd = useCallback(() => {
        setShowEndConfirm(false);
        endInterview();
    }, [endInterview, setShowEndConfirm]);

    const cancelEnd = useCallback(() => {
        setShowEndConfirm(false);
    }, [setShowEndConfirm]);

    const userName = user?.user_metadata?.full_name || 'Panchanan Sahoo';
    const userInitial = userName[0]?.toUpperCase() || 'P';

    if (phase === 'lobby') {
        return (
            <InterviewLobby
                setupStep={setupStep} setSetupStep={setSetupStep}
                experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
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
                onStartInterview={startInterview}
                onRestoreSession={restoreSession}
                onClearSavedSession={clearSavedSession}
                onResumeDragOver={handleResumeDragOver}
                onResumeDragLeave={handleResumeDragLeave}
                onResumeDrop={handleResumeDrop}
                onResumeFileChange={handleResumeFileChange}
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
                        <div className="ai-connect-steps">
                            <div className="ai-connect-step ai-connect-step--active">
                                <div className="ai-connect-step-icon"><Sparkles size={14} /></div>
                                <div className="ai-connect-step-label">Generating first question</div>
                            </div>
                            <div className="ai-connect-step ai-connect-step--active">
                                <div className="ai-connect-step-icon"><Volume2 size={14} /></div>
                                <div className="ai-connect-step-label">Pre-generating audio</div>
                            </div>
                            <div className="ai-connect-step ai-connect-step--pending">
                                <div className="ai-connect-step-icon"><Mic size={14} /></div>
                                <div className="ai-connect-step-label">Preparing microphone</div>
                            </div>
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
                connectionMode={voiceAI.connectionMode}
                connectionHealth={voiceAI.connectionHealth}
                workspacePanelOpen={workspacePanelOpen}
                setWorkspacePanelOpen={setWorkspacePanelOpen}
                endInterview={endInterview}
                onNavigateBack={() => navigate('/interview-suite')}
            />

            <div className="ai-vc-body">
                <div className={`ai-vc-video-area ${!workspacePanelOpen ? 'ai-vc-video-area--full' : ''}`}>
                    <div className={`ai-vc-tile ai-vc-tile--interviewer ${aiSpeaking ? 'ai-vc-tile--speaking' : ''}`}>
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
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="ai-vc-lipsync-bar" style={{ animationDelay: `${i * 0.12}s`, height: `${6 + (voiceAI.outputBars?.[i * 2] || 0) * 18}px` }} />
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
                            ) : loading ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking"><Brain size={12} /> Evaluating...</div>
                            ) : awaitingAnswer ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(34, 197, 94, 0.9)' }}>
                                    <Mic size={12} /> Click mic or press M to answer
                                </div>
                            ) : interviewerStatus ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(245, 158, 11, 0.9)' }}><MessageSquare size={12} /> {interviewerStatus}</div>
                            ) : voiceAI.errorMessage ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(239, 68, 68, 0.9)' }}><AlertTriangle size={12} /> {voiceAI.errorMessage}</div>
                            ) : cameraError ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(239, 68, 68, 0.9)' }}><AlertTriangle size={12} /> {cameraError}</div>
                            ) : null}
                        </div>
                    </div>

                    <div className="ai-vc-tile ai-vc-tile--user">
                        {cameraOn ? (
                            <video ref={videoRef} autoPlay playsInline muted className="ai-vc-user-video" />
                        ) : (
                            <div className="ai-vc-user-off">
                                <div className="ai-vc-user-off-avatar">{userInitial}</div>
                            </div>
                        )}
                        <div className="ai-vc-tile-badge ai-vc-tile-badge--user">
                            <span className="ai-vc-tile-badge-name">You</span>
                            {!micOn && <MicOff size={11} className="ai-vc-muted-icon" />}
                        </div>
                    </div>

                    <LiveCaptions
                        captionsOn={captionsOn} isListening={isListening} aiSpeaking={aiSpeaking}
                        interimText={voiceAI.interimText} transcript={transcript}
                        conversation={conversation} interviewerName={INTERVIEWER.name}
                        silenceCountdown={voiceAI.silenceCountdown}
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
                        onKeyboardHelp={() => setKeyboardHelpOpen(prev => !prev)}
                        onAskQuestion={handleAskQuestion}
                        awaitingAnswer={awaitingAnswer}
                    />
                </div>

                {workspacePanelOpen && (
                    <InterviewWorkspace
                        activeTab={activeTab} setActiveTab={setActiveTab}
                        workspaceDropdownOpen={workspaceDropdownOpen} setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
                        language={language} onLanguageChange={handleLanguageChange}
                        code={code} setCode={setCode} onReset={handleReset}
                        notes={notes} setNotes={setNotes}
                        isListening={isListening} transcript={transcript}
                        silenceCountdown={silenceCountdown}
                        onVoiceInput={handleVoiceInput}
                        userInput={userInput} setUserInput={setUserInput} setTranscript={setTranscript}
                        onSendAnswer={sendAnswer} loading={loading}
                    />
                )}

                {chatOpen && (
                    <ChatSidebar
                        conversation={conversation} interviewerName={INTERVIEWER.name}
                        loading={loading} userInput={userInput} setUserInput={setUserInput}
                        onSendAnswer={sendAnswer} onClose={() => setChatOpen(false)}
                        chatEndRef={chatEndRef} code={code}
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
                                <div className="ai-vc-shortcut-row"><kbd>M</kbd><span>Toggle microphone / Start answering</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>V</kbd><span>Toggle camera</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>P</kbd><span>Pause / Resume interview</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>Esc</kbd><span>End interview</span></div>
                                <div className="ai-vc-shortcut-row"><kbd>?</kbd><span>Toggle this help overlay</span></div>
                            </div>
                        </div>
                    </div>
                )}

                <ScoreCueToast cue={scoreCue} onDismiss={() => setScoreCue(null)} />
                <HintBanner hint={activeHint} onDismiss={() => setActiveHint(null)} />
            </div>
        </div>
    );
}
