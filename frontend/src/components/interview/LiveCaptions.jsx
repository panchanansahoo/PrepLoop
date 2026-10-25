import { memo, useMemo } from 'react';

/**
 * LiveCaptions — Real-time captions overlay for the video call.
 *
 * Extracted to isolate the word-by-word animation logic from the
 * high-frequency parent renders. The IIFE that was in the JSX render
 * path is now a proper component with stable props.
 */
function LiveCaptions({
    captionsOn,
    isListening,
    aiSpeaking,
    aiThinking,
    interimText,
    transcript,
    conversation,
    interviewerName,
    silenceCountdown = 0,
}) {
    // Compute caption content
    const captionData = useMemo(() => {
        if (!captionsOn) return null;

        const liveInterim = isListening && interimText ? interimText : '';
        const liveTranscript = isListening && transcript ? transcript : '';
        const isUserSpeaking = isListening && (liveInterim || liveTranscript);

        // When user is speaking, show their live transcript
        if (isUserSpeaking) {
            const currentSpeech = (liveTranscript + (liveInterim ? ' ' + liveInterim : '')).trim();
            const displayText = currentSpeech && currentSpeech.length > 200
                ? '...' + currentSpeech.slice(-200)
                : currentSpeech || '';
            const words = displayText.split(/\s+/).filter(Boolean);
            return { isUserSpeaking: true, liveInterim, speakerName: 'You', displayText, words };
        }

        // When AI is actually speaking (audio playing), show the interviewer's text
        if (aiSpeaking) {
            const aiMsg = conversation.filter(m => m.role === 'interviewer' || m.role === 'feedback').slice(-1)[0];
            const currentSpeech = aiMsg?.content || '';
            const displayText = currentSpeech.length > 200
                ? '...' + currentSpeech.slice(-200)
                : currentSpeech;
            const words = displayText.split(/\s+/).filter(Boolean);
            return { isUserSpeaking: false, liveInterim: '', speakerName: interviewerName, displayText, words };
        }

        // When AI is thinking / preparing to speak
        if (aiThinking) {
            return { isUserSpeaking: false, liveInterim: '', speakerName: interviewerName, displayText: 'Thinking...', words: ['Thinking...'] };
        }

        // When mic is active but user hasn't spoken yet — show listening indicator
        if (isListening) {
            return {
                isUserSpeaking: false,
                isWaiting: true,
                liveInterim: '',
                speakerName: 'You',
                displayText: 'Listening... speak now',
                words: ['Listening...', 'speak', 'now'],
            };
        }

        // When neither speaking — show the last message as static caption (already spoken)
        const lastMsg = [...conversation].reverse().find(
            m => m.role === 'interviewer' || m.role === 'candidate' || m.role === 'feedback'
        );
        if (!lastMsg) return null;

        const speakerName = lastMsg.role === 'interviewer'
            ? interviewerName
            : lastMsg.role === 'feedback'
                ? `${interviewerName} (Feedback)`
                : lastMsg.role === 'candidate'
                    ? 'You'
                    : null;
        if (!speakerName) return null;

        const displayText = lastMsg.content && lastMsg.content.length > 200
            ? '...' + lastMsg.content.slice(-200)
            : lastMsg.content || '';
        const words = displayText.split(/\s+/).filter(Boolean);

        return { isUserSpeaking: false, liveInterim: '', speakerName, displayText, words };
    }, [captionsOn, isListening, aiSpeaking, aiThinking, interimText, transcript, conversation, interviewerName, silenceCountdown]);

    if (!captionData) return null;

    const { isUserSpeaking, isWaiting, liveInterim, speakerName, displayText, words } = captionData;

    return (
    <div
        className={`ai-vc-captions ${isUserSpeaking ? 'ai-vc-captions--live' : ''} ${isWaiting ? 'ai-vc-captions--waiting' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={`${speakerName} caption`}
    >
        <div className="ai-vc-captions-inner">
            <div className="ai-vc-captions-meta">
                <span className={`ai-vc-captions-speaker ${aiSpeaking ? 'ai-vc-captions-speaker--ai' : ''} ${isUserSpeaking ? 'ai-vc-captions-speaker--user-live' : ''}`}>
                    {speakerName}
                </span>
                {isUserSpeaking && (
                    <span className="ai-vc-captions-live-badge">
                        <span className="ai-vc-captions-live-dot" /> LIVE TRANSCRIPT
                    </span>
                )}
                {isWaiting && (
                    <span className="ai-vc-captions-live-badge ai-vc-captions-live-badge--waiting">
                        <span className="ai-vc-captions-live-dot" /> LISTENING
                    </span>
                )}
                {!isUserSpeaking && !isWaiting && aiSpeaking && <span className="ai-vc-captions-live-badge">AI SPEAKING</span>}
            </div>
            <span className="ai-vc-captions-text">
                {words.map((word, i) => {
                    const interimWordCount = liveInterim ? liveInterim.split(/\s+/).filter(Boolean).length : 0;
                    const isInterimWord = isUserSpeaking && interimWordCount > 0 && i >= words.length - interimWordCount;
                    return (
                        <span
                            key={`${word}-${i}`}
                            className={`ai-vc-caption-word ${isInterimWord ? 'ai-vc-caption-word--interim' : ''} ${isWaiting ? 'ai-vc-caption-word--waiting' : ''}`}
                        >
                            {word}{' '}
                        </span>
                    );
                })}
                {(isUserSpeaking || isWaiting) && <span className="ai-vc-caption-cursor">|</span>}
                {silenceCountdown > 0 && isListening && !aiSpeaking && (
                    <span className="ai-vc-silence-countdown">
                        submitting in {silenceCountdown}s...
                    </span>
                )}
            </span>
        </div>
    </div>
    );
}

export default memo(LiveCaptions);
