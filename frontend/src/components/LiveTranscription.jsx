/**
 * LiveTranscription — Real-time transcription overlay
 * Features: Word-by-word animation, speaker identification, interim text
 */
import { useMemo } from 'react';
import { User, Sparkles } from 'lucide-react';
import './LiveTranscription.css';

const LiveTranscription = ({
  text = '',
  interimText = '',
  speaker = 'interviewer', // interviewer | candidate
  interviewerName = 'Interviewer',
  isLive = false,
  maxLength = 200,
  className = '',
}) => {
  // Truncate text if too long
  const displayText = useMemo(() => {
    const fullText = text + (interimText ? ' ' + interimText : '');
    if (fullText.length > maxLength) {
      return '...' + fullText.slice(-maxLength);
    }
    return fullText;
  }, [text, interimText, maxLength]);

  // Split into words for animation
  const words = useMemo(() => {
    return displayText.split(/\s+/).filter(Boolean);
  }, [displayText]);

  // Determine which words are interim (unfinished)
  const interimWordCount = useMemo(() => {
    if (!interimText) return 0;
    return interimText.split(/\s+/).filter(Boolean).length;
  }, [interimText]);

  if (!displayText) return null;

  const speakerName = speaker === 'interviewer' ? interviewerName : 'You';
  const speakerIcon = speaker === 'interviewer' ? Sparkles : User;
  const SpeakerIcon = speakerIcon;

  return (
    <div className={`live-transcription ${className}`} data-speaker={speaker} data-live={isLive}>
      <div className="live-transcription-inner">
        <div className="live-transcription-speaker">
          <SpeakerIcon size={12} />
          {speakerName}:
        </div>
        <div className="live-transcription-text">
          {words.map((word, i) => {
            const isInterim = i >= words.length - interimWordCount;
            return (
              <span
                key={`${word}-${i}`}
                className={`live-transcription-word ${isInterim ? 'live-transcription-word--interim' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {word}{' '}
              </span>
            );
          })}
          {isLive && <span className="live-transcription-cursor">|</span>}
        </div>
      </div>
    </div>
  );
};

export default LiveTranscription;
