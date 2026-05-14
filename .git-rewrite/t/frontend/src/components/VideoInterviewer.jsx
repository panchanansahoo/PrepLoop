/**
 * VideoInterviewer — Advanced AI interviewer video component
 * Features: Lip-sync, emotion detection, smooth state transitions
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, Mic, Brain, Sparkles } from 'lucide-react';
import './VideoInterviewer.css';

const VideoInterviewer = ({
  name = 'Hannah Chen',
  role = 'Senior Software Engineer',
  company = 'Google',
  gender = 'female',
  state = 'listening', // listening | speaking | thinking
  audioLevel = 0,
  onVideoReady,
  className = '',
}) => {
  const [videoReady, setVideoReady] = useState({ speaking: false, listening: false });
  const [visibleMode, setVisibleMode] = useState('listening');
  const [emotion, setEmotion] = useState('neutral'); // neutral | encouraging | focused
  
  const speakingVideoRef = useRef(null);
  const listeningVideoRef = useRef(null);
  const playbackPositionRef = useRef({ speaking: 0, listening: 0 });

  // Video sources based on gender
  const videos = {
    male: {
      speaking: '/malespeaking.mp4',
      listening: '/malelisrning.mp4',
    },
    female: {
      speaking: '/HannahChenSpeaking.mp4',
      listening: '/HannahChenListening.mp4',
    },
  };

  const videoSources = videos[gender] || videos.female;

  // Handle video loaded
  const handleVideoLoaded = useCallback((mode) => {
    setVideoReady(prev => ({ ...prev, [mode]: true }));
    if (onVideoReady) {
      onVideoReady(mode);
    }
  }, [onVideoReady]);

  // Handle time update (save position for smooth resume)
  const handleTimeUpdate = useCallback((mode) => {
    const video = mode === 'speaking' ? speakingVideoRef.current : listeningVideoRef.current;
    if (video) {
      playbackPositionRef.current[mode] = video.currentTime;
    }
  }, []);

  // Sync video with state
  useEffect(() => {
    const targetMode = state === 'speaking' ? 'speaking' : 'listening';
    const activeVideo = targetMode === 'speaking' ? speakingVideoRef.current : listeningVideoRef.current;
    const inactiveVideo = targetMode === 'speaking' ? listeningVideoRef.current : speakingVideoRef.current;

    if (!activeVideo || !inactiveVideo) return;

    // Smooth transition
    if (videoReady[targetMode]) {
      setVisibleMode(targetMode);
    }

    // Play active, pause inactive
    inactiveVideo.pause();
    activeVideo.play().catch(() => {});

    // Update emotion based on state
    if (state === 'speaking') {
      setEmotion('focused');
    } else if (state === 'thinking') {
      setEmotion('neutral');
    } else {
      setEmotion('encouraging');
    }

    return () => {
      playbackPositionRef.current[targetMode] = activeVideo.currentTime || 0;
    };
  }, [state, videoReady]);

  // Lip-sync bars (visual indicator during speech)
  const lipSyncBars = Array.from({ length: 5 }, (_, i) => {
    const height = state === 'speaking' ? 4 + audioLevel * 20 + Math.random() * 8 : 4;
    return (
      <div
        key={i}
        className="video-interviewer-lipsync-bar"
        style={{
          height: `${height}px`,
          animationDelay: `${i * 0.1}s`,
        }}
      />
    );
  });

  return (
    <div className={`video-interviewer ${className}`} data-state={state} data-emotion={emotion}>
      {/* Video layers */}
      <div className="video-interviewer-video-container">
        <video
          ref={speakingVideoRef}
          src={videoSources.speaking}
          className={`video-interviewer-video video-interviewer-video--speaking ${visibleMode === 'speaking' ? 'active' : 'inactive'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => handleVideoLoaded('speaking')}
          onTimeUpdate={() => handleTimeUpdate('speaking')}
        />
        <video
          ref={listeningVideoRef}
          src={videoSources.listening}
          className={`video-interviewer-video video-interviewer-video--listening ${visibleMode === 'listening' ? 'active' : 'inactive'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => handleVideoLoaded('listening')}
          onTimeUpdate={() => handleTimeUpdate('listening')}
        />

        {/* Speaking glow effect */}
        {state === 'speaking' && (
          <div className="video-interviewer-speaking-glow" />
        )}

        {/* Speaking ring animation */}
        {state === 'speaking' && (
          <div className="video-interviewer-speaking-ring">
            <div className="video-interviewer-speaking-ring-inner" />
          </div>
        )}
      </div>

      {/* Name badge */}
      <div className="video-interviewer-badge">
        <div className="video-interviewer-badge-dot" data-state={state} />
        <div className="video-interviewer-badge-info">
          <div className="video-interviewer-badge-name">{name}</div>
          <div className="video-interviewer-badge-role">{role} · {company}</div>
        </div>
      </div>

      {/* State indicator */}
      <div className="video-interviewer-state-indicator">
        {state === 'speaking' && (
          <div className="video-interviewer-state-pill video-interviewer-state-pill--speaking">
            <Volume2 size={12} />
            Speaking...
          </div>
        )}
        {state === 'thinking' && (
          <div className="video-interviewer-state-pill video-interviewer-state-pill--thinking">
            <Brain size={12} />
            Thinking...
          </div>
        )}
        {state === 'listening' && (
          <div className="video-interviewer-state-pill video-interviewer-state-pill--listening">
            <Mic size={12} />
            Listening...
          </div>
        )}
      </div>

      {/* Lip-sync visualization */}
      {state === 'speaking' && (
        <div className="video-interviewer-lipsync">
          {lipSyncBars}
        </div>
      )}

      {/* AI badge */}
      <div className="video-interviewer-ai-badge">
        <Sparkles size={10} />
        AI Powered
      </div>
    </div>
  );
};

export default VideoInterviewer;
