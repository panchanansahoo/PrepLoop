import { useState } from 'react';
import { X, Send, MessageSquare, Bug, Lightbulb, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';

export default function FeedbackModal({ isOpen, onClose }) {
    const { _user } = useAuth();
    const { refreshBalance } = useCoins();
    const [feedbackType, setFeedbackType] = useState('feedback'); // 'feedback', 'bug', 'idea'
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/feedback`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    feedback_type: feedbackType,
                    message: message.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            // We can also trigger context update for coins if response indicates success
            // but for now, we just show success state.
            const data = await response.json();
            if (data.coinsAwarded) {
                refreshBalance();
            }
            
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setMessage('');
                setFeedbackType('feedback');
            }, 2500);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeOptions = [
        { id: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'var(--color-accent-cyan, #38bdf8)' },
        { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'var(--color-danger, #ef4444)' },
        { id: 'idea', label: 'Feature Idea', icon: Lightbulb, color: 'var(--color-warning, #eab308)' }
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .feedback-type-btn {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-bg-card);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .feedback-type-btn:hover {
                    background: var(--color-bg-tertiary);
                }
                .feedback-type-btn.active {
                    background: var(--color-accent-glow);
                    border-color: var(--color-accent-secondary);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px var(--color-accent-glow);
                }
                .feedback-textarea {
                    width: 100%;
                    min-height: 120px;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-bg-card);
                    border-radius: 12px;
                    padding: 16px;
                    color: var(--color-text-primary);
                    font-size: 14px;
                    resize: vertical;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .feedback-textarea:focus {
                    outline: none;
                    border-color: var(--color-accent-secondary);
                    background: var(--color-bg-primary);
                    box-shadow: 0 0 0 2px var(--color-accent-glow);
                }
                .feedback-textarea::placeholder {
                    color: var(--color-text-muted);
                }
                .feedback-submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: var(--color-accent-secondary);
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .feedback-submit-btn:hover:not(:disabled) {
                    background: var(--color-accent-primary);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px var(--color-accent-glow);
                }
                .feedback-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                `}
            </style>

            <div className="glass-panel" style={{
                background: 'var(--color-bg-primary)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '500px',
                position: 'relative',
                overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--color-bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-bg-tertiary)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star size={20} color="var(--color-warning)" />
                            Help Us Improve
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Share your thoughts or report issues. You'll earn <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>+10 coins</span>!
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'var(--color-bg-card)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg-card)';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {isSuccess ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 0',
                            animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                <Send size={32} color="var(--color-success)" />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--color-text-primary)', fontWeight: 600 }}>Thank You!</h3>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', textAlign: 'center', fontSize: '14px', maxWidth: '300px' }}>
                                Your feedback has been received. <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>+10 coins</span> have been added to your wallet!
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Type Selection */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                    What would you like to share?
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {typeOptions.map(option => {
                                        const Icon = option.icon;
                                        const isActive = feedbackType === option.id;
                                        return (
                                            <div 
                                                key={option.id}
                                                className={`feedback-type-btn ${isActive ? 'active' : ''}`}
                                                onClick={() => setFeedbackType(option.id)}
                                            >
                                                <Icon size={20} color={isActive ? option.color : 'var(--color-text-muted)'} />
                                                <span style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: 500,
                                                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                                                }}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Message Area */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                    Your message
                                </label>
                                <textarea
                                    className="feedback-textarea"
                                    placeholder={
                                        feedbackType === 'bug' ? "Describe the issue you encountered and how to reproduce it..." :
                                        feedbackType === 'idea' ? "What new feature or improvement would you love to see?" :
                                        "Share your thoughts on how we can improve..."
                                    }
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                className="feedback-submit-btn"
                                disabled={!message.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div style={{ 
                                            width: '18px', 
                                            height: '18px', 
                                            border: '2px solid rgba(255,255,255,0.3)', 
                                            borderTopColor: 'white', 
                                            borderRadius: '50%', 
                                            animation: 'spin 1s linear infinite' 
                                        }} />
                                        <style>
                                            {`@keyframes spin { to { transform: rotate(360deg); } }`}
                                        </style>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

