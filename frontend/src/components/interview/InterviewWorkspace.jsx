import React, { memo, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
    Code2, Palette, FileText, ChevronDown, CheckCircle,
    Sparkles, RotateCcw, Mic, MicOff, Send,
} from 'lucide-react';
import DesignCanvas from './DesignCanvas';

/**
 * WORKSPACE_OPTIONS — Static array hoisted outside component to prevent
 * re-creation on every render.
 */
const WORKSPACE_OPTIONS = [
    { id: 'code', label: 'Code Editor', icon: <Code2 size={14} /> },
    { id: 'design', label: 'Design Canvas', icon: <Palette size={14} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
];

/**
 * LANGUAGES — Programming language options for the code editor.
 */
const LANGUAGES = [
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'java', label: 'Java', icon: '☕' },
    { id: 'cpp', label: 'C++', icon: '⚡' },
    { id: 'typescript', label: 'TypeScript', icon: '🔷' },
    { id: 'go', label: 'Go', icon: '🐹' },
    { id: 'rust', label: 'Rust', icon: '🦀' },
    { id: 'swift', label: 'Swift', icon: '🍎' },
];

/**
 * InterviewWorkspace — Right-side panel with code editor, design canvas,
 * notes, and the answer input bar.
 *
 * Extracted to isolate Monaco Editor and tab state from the video call
 * re-renders. The workspace only needs to re-render when its own props change.
 */
function InterviewWorkspace({
    activeTab, setActiveTab,
    workspaceDropdownOpen, setWorkspaceDropdownOpen,
    language, onLanguageChange,
    code, setCode,
    canSubmitCode = false,
    onReset,
    notes, setNotes,
    isListening, transcript,
    silenceCountdown,
    onVoiceInput,
    userInput, setUserInput, setTranscript,
    onSendAnswer,
    loading,
    onCanvasChange,
    broadcastEvent,
}) {
    // Monaco editor options — stable reference
    const editorOptions = useMemo(() => ({
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        wordWrap: 'on',
        tabSize: 4,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        suggestOnTriggerCharacters: true,
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        lineHeight: 20,
    }), []);

    return (
        <div className="ai-vc-workspace">
            {/* Workspace Dropdown Header */}
            <div className="ai-vc-ws-header">
                <div className="ai-vc-ws-dropdown" onClick={() => setWorkspaceDropdownOpen(p => !p)}>
                    <div className="ai-vc-ws-dropdown-selected">
                        {activeTab === 'code' && <><Code2 size={14} /> Code Editor</>}
                        {activeTab === 'design' && <><Palette size={14} /> Design Canvas</>}
                        {activeTab === 'notes' && <><FileText size={14} /> Notes</>}
                    </div>
                    <ChevronDown size={14} className={`ai-vc-ws-chevron ${workspaceDropdownOpen ? 'ai-vc-ws-chevron--open' : ''}`} />
                </div>
                {workspaceDropdownOpen && (
                    <div className="ai-vc-ws-dropdown-menu">
                        {WORKSPACE_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                className={`ai-vc-ws-dropdown-item ${activeTab === opt.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(opt.id); setWorkspaceDropdownOpen(false); }}
                            >
                                {opt.icon}
                                {opt.label}
                                {activeTab === opt.id && <CheckCircle size={12} className="ai-vc-ws-check" />}
                            </button>
                        ))}
                    </div>
                )}
                <div className="ai-vc-ws-header-right">
                    <div className="ai-live-sync">
                        <span className="ai-live-sync-dot" />
                        <Sparkles size={11} />
                        Synced
                    </div>
                </div>
            </div>

            {/* Workspace Content */}
            <div className="ai-vc-ws-content">
                {activeTab === 'code' && (
                    <div className="ai-vc-ws-editor">
                        <div className="ai-editor-toolbar">
                            <div className="ai-editor-toolbar-left">
                                <div className="ai-lang-icon"><Code2 size={12} /></div>
                                <select
                                    className="ai-lang-selector"
                                    value={language}
                                    onChange={(e) => {
                                        const newLang = e.target.value;
                                        onLanguageChange(newLang);
                                        if (broadcastEvent) {
                                            broadcastEvent('interview_update', { event: 'code_update', data: { language: newLang, code } });
                                        }
                                    }}
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.icon} {lang.label}
                                        </option>
                                    ))}
                                </select>
                                <button className="ai-reset-btn" onClick={onReset}>
                                    <RotateCcw size={12} /> Reset
                                </button>
                            </div>
                        </div>
                        <div className="ai-editor-body">
                            <Editor
                                height="100%"
                                language={language === 'cpp' ? 'cpp' : language}
                                value={code}
                                onChange={(value) => {
                                    const newVal = value || '';
                                    setCode(newVal);
                                    if (broadcastEvent) {
                                        broadcastEvent('interview_update', { event: 'code_update', data: { language, code: newVal } });
                                    }
                                }}
                                theme="vs-dark"
                                options={editorOptions}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'design' && (
                    <DesignCanvas onCanvasChange={onCanvasChange} />
                )}

                {activeTab === 'notes' && (
                    <div className="ai-notes-panel">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={"Take notes during the interview...\n\n• Key points to mention\n• Edge cases to consider\n• Time/space complexity analysis"}
                        />
                    </div>
                )}
            </div>

            {/* Voice transcript indicator */}
            {isListening && transcript && (
                <div className="ai-ws-transcript-indicator">
                    <span className="ai-ws-transcript-dot" />
                    <span className="ai-ws-transcript-text">🎙️ "{transcript}"</span>
                </div>
            )}

            {/* Text input for chat at bottom of workspace */}
            <div className="ai-vc-ws-input">
                <button
                    className={`ai-vc-ws-voice ${isListening ? 'ai-vc-ws-voice--active' : ''}`}
                    onClick={onVoiceInput}
                    title={isListening ? 'Stop listening' : 'Speak your answer'}
                >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    {isListening && <span className="ai-ws-voice-pulse" />}
                </button>

                {/* Auto-send silence countdown indicator */}
                {isListening && silenceCountdown > 0 && (
                    <div className="ai-ws-silence-countdown">
                        <svg width="18" height="18" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15"
                                fill="none" stroke="#fbbf24" strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${(silenceCountdown / 4) * 94.2} 94.2`}
                                transform="rotate(-90 18 18)"
                                style={{ transition: 'stroke-dasharray 0.3s ease' }}
                            />
                        </svg>
                        <span>Sending in {silenceCountdown}s</span>
                    </div>
                )}

                <input
                    type="text"
                    value={userInput || transcript}
                    onChange={(e) => { setUserInput(e.target.value); setTranscript(''); }}
                    placeholder={isListening
                        ? (silenceCountdown > 0 ? `Auto-sending in ${silenceCountdown}s...` : "Listening... speak now")
                        : "Type or speak your response..."}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSendAnswer(); }}
                />
                <button
                    className="ai-vc-ws-send"
                    onClick={onSendAnswer}
                    disabled={(!userInput.trim() && !transcript.trim() && !canSubmitCode) || loading}
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
}

export default memo(InterviewWorkspace);
