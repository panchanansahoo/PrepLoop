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

        const lastMsg = [...conversation].reverse().find(
            m => m.role === 'interviewer' || m.role === 'candidate' || m.role === 'feedback'
        );

        const currentSpeech = isUserSpeaking
            ? (liveTranscript + (liveInterim ? ' ' + liveInterim : '')).trim()
            : aiSpeaking
                ? (conversation.filter(m => m.role === 'interviewer' || m.role === 'feedback').slice(-1)[0]?.content || 'Thinking...')
                : lastMsg?.content;

        const speakerName = isUserSpeaking
            ? 'You'
            : aiSpeaking
                ? interviewerName
                : lastMsg?.role === 'interviewer'
                    ? interviewerName
                    : lastMsg?.role === 'feedback'
                        ? `${interviewerName} (Feedback)`
                        : lastMsg?.role === 'candidate'
                            ? 'You'
                            : null;

        if (!speakerName) return null;

        // Word-by-word animation
        const displayText = currentSpeech && currentSpeech.length > 200
            ? '...' + currentSpeech.slice(-200)
            : currentSpeech || '';
        const words = displayText.split(/\s+/).filter(Boolean);

        return { isUserSpeaking, liveInterim, speakerName, displayText, words };
    }, [captionsOn, isListening, aiSpeaking, interimText, transcript, conversation, interviewerName]);

    if (!captionData) return null;

    const { isUserSpeaking, liveInterim, speakerName, displayText, words } = captionData;

    return (
        <div className={`ai-vc-captions ${isUserSpeaking ? 'ai-vc-captions--live' : ''}`}>
            <div className="ai-vc-captions-inner">
                <span className={`ai-vc-captions-speaker ${aiSpeaking ? 'ai-vc-captions-speaker--ai' : ''} ${isUserSpeaking ? 'ai-vc-captions-speaker--user-live' : ''}`}>
                    {speakerName}:
                </span>
                <span className="ai-vc-captions-text">
                    {words.map((word, i) => {
                        const isInterimWord = isUserSpeaking && liveInterim && displayText.indexOf(liveInterim) !== -1 && i >= words.length - liveInterim.split(/\s+/).length;
                        return (
                            <span
                                key={`${word}-${i}`}
                                className={`ai-vc-caption-word ${isInterimWord ? 'ai-vc-caption-word--interim' : ''}`}
                                style={{ animationDelay: `${i * 0.06}s` }}
                            >
                                {word}{' '}
                            </span>
                        );
                    })}
                    {isUserSpeaking && <span className="ai-vc-caption-cursor">|</span>}
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
