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
    connectionMode = 'browser',
    inputLevel = 0,
}) {
    // Compute caption content
    const captionData = useMemo(() => {
        if (!captionsOn) return null;

        const liveInterim = isListening && interimText ? interimText : '';
        const liveTranscript = isListening && transcript ? transcript : '';
        const isUserSpeaking = isListening && (liveInterim || liveTranscript);

        // When user is speaking, show their live transcript (final + interim text)
        if (isUserSpeaking) {
            const currentSpeech = [liveTranscript, liveInterim].filter(Boolean).join(' ').trim();
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

        // Keep the submitted answer visible while the next AI response is loading.
        // The session clears this draft when the next listening turn begins.
        if (transcript && transcript.trim()) {
            const currentSpeech = transcript.trim();
            const displayText = currentSpeech.length > 200
                ? '...' + currentSpeech.slice(-200)
                : currentSpeech;
            const words = displayText.split(/\s+/).filter(Boolean);
            return { isUserSpeaking: false, liveInterim: '', speakerName: 'You', displayText, words };
        }

        // When AI is thinking / preparing to speak
        if (aiThinking) {
            return { isUserSpeaking: false, liveInterim: '', speakerName: interviewerName, displayText: 'Thinking...', words: ['Thinking...'] };
        }

        // When mic is active but user hasn't spoken yet — show listening indicator
        if (isListening) {
            const isWhisper = connectionMode === 'whisper';
            return {
                isUserSpeaking: false,
                isWaiting: true,
                isWhisper,
                liveInterim: '',
                speakerName: 'You',
                displayText: silenceCountdown > 0
                    ? `Listening… auto-submitting in ${silenceCountdown}s`
                    : (isWhisper ? 'Listening… speak now' : 'Listening… speak now'),
                words: silenceCountdown > 0
                    ? ['Listening…', `auto-submitting in ${silenceCountdown}s`]
                    : ['Listening…', 'speak', 'now'],
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
    }, [captionsOn, isListening, aiSpeaking, aiThinking, interimText, transcript, conversation, interviewerName, silenceCountdown, connectionMode]);

    if (!captionData) return null;

    const { isUserSpeaking, isWaiting, isWhisper, liveInterim, speakerName, displayText, words } = captionData;

    // Mic-level bars for Whisper mode: 5 bars scaled by inputLevel (0–1)
    const whisperLevelBars = isWhisper && isWaiting ? (
        <span className="ai-vc-captions-mic-level" aria-hidden="true" title={`Mic level: ${Math.round(inputLevel * 100)}%`}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
                <span
                    key={i}
                    className={`ai-vc-captions-mic-bar ${inputLevel >= threshold ? 'ai-vc-captions-mic-bar--active' : ''}`}
                />
            ))}
        </span>
    ) : null;

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
                        <span className="ai-vc-captions-live-dot" /> {isWhisper ? 'LISTENING (WHISPER)' : 'LISTENING'}
                    </span>
                )}
                {isWhisper && isWaiting && whisperLevelBars}
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
