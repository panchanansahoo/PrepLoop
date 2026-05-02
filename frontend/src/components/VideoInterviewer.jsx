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

  // Video sources based on gender with multi-format support
  // Prioritizes VP9 WebM for 40% compression, falls back to H.265, then H.264
  const getVideoSources = (mode) => {
    let baseName;
    if (gender === 'male') {
      baseName = mode === 'speaking' ? 'malespeaking' : 'malelisrning';
    } else {
      baseName = mode === 'speaking' ? 'HannahChenSpeaking' : 'HannahChenListening';
    }

    // Return array of sources with fallbacks
    // Browser will use first format it supports
    return [
      // Primary: VP9 WebM (40% smaller, supported in Chrome, Firefox, Edge)
      { src: `/${baseName}.webm`, type: 'video/webm; codecs=vp9' },
      // Secondary: H.265 MP4 (50% smaller, supported in Safari 13+, Edge 18+)
      { src: `/${baseName}.h265.mp4`, type: 'video/mp4; codecs="hev1.1.6.L120"' },
      // Fallback: Original H.264 MP4 (universal compatibility)
      { src: `/${baseName}.mp4`, type: 'video/mp4' },
    ];
  };

  const videos = {
    male: {
      speaking: getVideoSources('speaking'),
      listening: getVideoSources('listening'),
    },
    female: {
      speaking: getVideoSources('speaking'),
      listening: getVideoSources('listening'),
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

  // Fix BUG #11: Cleanup video elements on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (speakingVideoRef.current) {
        speakingVideoRef.current.pause();
        speakingVideoRef.current.src = '';
      }
      if (listeningVideoRef.current) {
        listeningVideoRef.current.pause();
        listeningVideoRef.current.src = '';
      }
    };
  }, []);

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
          className={`video-interviewer-video video-interviewer-video--speaking ${visibleMode === 'speaking' ? 'active' : 'inactive'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => handleVideoLoaded('speaking')}
          onTimeUpdate={() => handleTimeUpdate('speaking')}
        >
          {videoSources.speaking.map((source, idx) => (
            <source key={idx} src={source.src} type={source.type} />
          ))}
          Your browser doesn't support HTML5 video.
        </video>
        <video
          ref={listeningVideoRef}
          className={`video-interviewer-video video-interviewer-video--listening ${visibleMode === 'listening' ? 'active' : 'inactive'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => handleVideoLoaded('listening')}
          onTimeUpdate={() => handleTimeUpdate('listening')}
        >
          {videoSources.listening.map((source, idx) => (
            <source key={idx} src={source.src} type={source.type} />
          ))}
          Your browser doesn't support HTML5 video.
        </video>

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
