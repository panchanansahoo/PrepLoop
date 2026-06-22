import { memo } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

/**
 * FeedbackCard — Single feedback message with score, strengths, improvements.
 * Migrated from inline styles to CSS classes.
 */
function FeedbackCard({ msg }) {
    const tier = msg.score >= 80 ? 'excellent' : msg.score >= 60 ? 'good' : 'needs-work';
    const emoji = msg.score >= 80 ? '🌟' : msg.score >= 60 ? '👍' : '📝';
    const label = msg.score >= 80 ? 'Excellent' : msg.score >= 60 ? 'Good' : 'Needs Work';

    const ensureArray = (val) => Array.isArray(val) ? val : (typeof val === 'string' && val.trim().length > 0 ? [val] : []);

    return (
        <div className={`ai-chat-feedback-card ai-chat-feedback-card--${tier}`}>
            {/* Score Badge */}
            <div className="ai-chat-feedback-header">
                <div className="ai-chat-feedback-score">
                    {emoji}
                    <span>Score: {msg.score}%</span>
                </div>
                <div className="ai-chat-feedback-label">
                    {label}
                </div>
            </div>
            {/* Feedback Text */}
            <div className="ai-chat-feedback-text">{msg.content}</div>
            {/* Strengths */}
            {ensureArray(msg.strengths).length > 0 && (
                <div className="ai-chat-feedback-section">
                    <div className="ai-chat-feedback-section-title ai-chat-feedback-section-title--strength">✓ Strengths</div>
                    {ensureArray(msg.strengths).map((s, i) => (
                        <div key={i} className="ai-chat-feedback-item ai-chat-feedback-item--strength">• {s}</div>
                    ))}
                </div>
            )}
            {/* Improvements */}
            {ensureArray(msg.improvements).length > 0 && (
                <div className="ai-chat-feedback-section">
                    <div className="ai-chat-feedback-section-title ai-chat-feedback-section-title--improve">⬆ Improve</div>
                    {ensureArray(msg.improvements).map((s, i) => (
                        <div key={i} className="ai-chat-feedback-item ai-chat-feedback-item--improve">• {s}</div>
                    ))}
                </div>
            )}
            {/* Hint */}
            {msg.hint && (
                <div className="ai-chat-feedback-hint">
                    💡 Hint: {msg.hint}
                </div>
            )}
        </div>
    );
}

/**
 * ChatSidebar — Togglable chat overlay showing the full conversation
 * with feedback cards and a text input.
 *
 * Extracted to isolate the expensive feedback card rendering from the
 * main video call area. Only re-renders when conversation or input changes.
 */
function ChatSidebar({
    conversation,
    interviewerName,
    loading,
    userInput, setUserInput,
    onSendAnswer,
    onClose,
    chatEndRef,
    code,
}) {
    return (
        <div className="ai-vc-chat-overlay">
            <div className="ai-chat-header">
                <h3><MessageSquare size={14} /> Live Chat</h3>
                <button className="ai-topbar-icon-btn" onClick={onClose}>
                    <X size={14} />
                </button>
            </div>
            <div className="ai-chat-messages">
                {conversation.map((msg, idx) => {
                    if (msg.role === 'feedback') {
                        return <FeedbackCard key={idx} msg={msg} />;
                    }
                    if (msg.role === 'clarification') {
                        return (
                            <div key={idx} className="ai-chat-msg ai-chat-msg--clarification">
                                <div className="msg-sender">
                                    ℹ️ {interviewerName} (clarification)
                                </div>
                                {msg.content}
                            </div>
                        );
                    }
                    return (
                        <div key={idx} className={`ai-chat-msg ${msg.role === 'interviewer' ? 'interviewer' : 'candidate'}`}>
                            <div className="msg-sender">
                                {msg.role === 'interviewer' ? interviewerName : 'You'}
                            </div>
                            {msg.content}
                        </div>
                    );
                })}
                {loading && (
                    <div className="ai-typing-indicator">
                        <span /><span /><span />
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="ai-chat-input-area">
                <input
                    type="text"
                    className="ai-chat-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your answer..."
                    onKeyDown={(e) => { if (e.key === 'Enter') onSendAnswer(); }}
                />
                <button
                    className="ai-chat-send-btn"
                    onClick={onSendAnswer}
                    disabled={(!userInput.trim() && !code.trim()) || loading}
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
}

export default memo(ChatSidebar);
