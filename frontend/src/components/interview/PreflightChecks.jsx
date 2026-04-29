import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Mic, Camera, Wifi, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

const INTERVIEW_TIPS = {
  hr: [
    '💡 Use the STAR method: Situation, Task, Action, Result',
    '🎯 Prepare 3-4 stories that highlight your strengths',
    '🗣️ Speak clearly and at a moderate pace',
    '✨ Show enthusiasm for the role and company',
  ],
  technical: [
    '💡 Think out loud — interviewers want to see your thought process',
    '📐 Start with brute force, then optimize',
    '🧪 Walk through test cases before coding',
    '⏱️ Manage your time: ~5 min understand, ~15 min code, ~5 min test',
  ],
  'system-design': [
    '💡 Clarify requirements and constraints first',
    '🏗️ Start with high-level architecture, then drill down',
    '📊 Discuss trade-offs at every decision point',
    '📈 Consider scalability, reliability, and availability',
  ],
  behavioral: [
    '💡 Use the STAR method for every answer',
    '🎯 Be specific with numbers and outcomes',
    '🤝 Highlight collaboration and leadership moments',
    '📚 Prepare stories about failures and what you learned',
  ],
};

/**
 * PreflightChecks — Tests microphone, camera, and network latency
 * before allowing the user to proceed to the interview.
 *
 * Props:
 *  - interviewType: string
 *  - onAllChecksPassed: () => void
 */
function PreflightChecks({ interviewType, onAllChecksPassed }) {
  const [micStatus, setMicStatus] = useState('pending'); // pending | testing | pass | fail
  const [camStatus, setCamStatus] = useState('pending');
  const [netStatus, setNetStatus] = useState('pending');
  const [micLevel, setMicLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const tips = INTERVIEW_TIPS[interviewType] || INTERVIEW_TIPS.technical;

  // ── Microphone RMS test ──
  const testMicrophone = useCallback(async () => {
    setMicStatus('testing');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxRms = 0;
      let frames = 0;
      const MAX_FRAMES = 60; // ~1 second of sampling at 60fps

      const checkLevel = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalized = Math.min(1, rms * 5); // Amplify for visual
        setMicLevel(normalized);
        if (rms > maxRms) maxRms = rms;
        frames++;

        if (frames < MAX_FRAMES) {
          animFrameRef.current = requestAnimationFrame(checkLevel);
        } else {
          // Cleanup audio
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close().catch(() => {});

          if (maxRms > 0.01) {
            setMicStatus('pass');
          } else {
            setMicStatus('pass'); // Accept even if quiet — mic is accessible
          }
        }
      };
      animFrameRef.current = requestAnimationFrame(checkLevel);
    } catch (err) {
      setMicStatus('fail');
      setErrorMsg(`Microphone: ${err.name === 'NotAllowedError' ? 'Permission denied. Please allow microphone access.' : err.message}`);
    }
  }, []);

  // ── Camera test ──
  const testCamera = useCallback(async () => {
    setCamStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCamStatus('pass');
    } catch (err) {
      setCamStatus('fail');
      setErrorMsg(prev => prev ? `${prev}\nCamera: ${err.message}` : `Camera: ${err.message}`);
    }
  }, []);

  // ── Network latency test ──
  const testNetwork = useCallback(async () => {
    setNetStatus('testing');
    try {
      const start = performance.now();
      await fetch('/health', { method: 'GET', cache: 'no-store' });
      const latency = Math.round(performance.now() - start);
      if (latency < 2000) {
        setNetStatus('pass');
      } else {
        setNetStatus('fail');
        setErrorMsg(prev => prev ? `${prev}\nHigh latency: ${latency}ms` : `High latency: ${latency}ms`);
      }
    } catch {
      setNetStatus('fail');
      setErrorMsg(prev => prev ? `${prev}\nNetwork: Could not reach server` : 'Network: Could not reach server');
    }
  }, []);

  // Run all checks on mount
  useEffect(() => {
    testMicrophone();
    testCamera();
    testNetwork();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [testMicrophone, testCamera, testNetwork]);

  // Notify parent when all pass
  const allPassed = micStatus === 'pass' && camStatus === 'pass' && netStatus === 'pass';
  useEffect(() => {
    if (allPassed && onAllChecksPassed) onAllChecksPassed();
  }, [allPassed, onAllChecksPassed]);

  const StatusIcon = ({ status }) => {
    if (status === 'pending') return <div className="preflight-icon preflight-icon--pending" />;
    if (status === 'testing') return <Loader size={18} className="preflight-icon preflight-icon--testing preflight-spin" />;
    if (status === 'pass') return <CheckCircle size={18} className="preflight-icon preflight-icon--pass" />;
    return <XCircle size={18} className="preflight-icon preflight-icon--fail" />;
  };

  return (
    <div className="preflight-checks">
      <h3 className="preflight-title">Pre-flight Checks</h3>
      <p className="preflight-subtitle">Verifying your setup before the interview</p>

      <div className="preflight-items">
        {/* Mic */}
        <div className={`preflight-item ${micStatus}`}>
          <Mic size={20} />
          <div className="preflight-item-info">
            <span className="preflight-item-label">Microphone</span>
            <span className="preflight-item-status">
              {micStatus === 'testing' && 'Testing...'}
              {micStatus === 'pass' && 'Working'}
              {micStatus === 'fail' && 'Not detected'}
              {micStatus === 'pending' && 'Waiting...'}
            </span>
          </div>
          <StatusIcon status={micStatus} />
          {micStatus === 'testing' && (
            <div className="preflight-mic-bar">
              <div className="preflight-mic-level" style={{ width: `${micLevel * 100}%` }} />
            </div>
          )}
        </div>

        {/* Camera */}
        <div className={`preflight-item ${camStatus}`}>
          <Camera size={20} />
          <div className="preflight-item-info">
            <span className="preflight-item-label">Camera</span>
            <span className="preflight-item-status">
              {camStatus === 'testing' && 'Testing...'}
              {camStatus === 'pass' && 'Working'}
              {camStatus === 'fail' && 'Not detected'}
              {camStatus === 'pending' && 'Waiting...'}
            </span>
          </div>
          <StatusIcon status={camStatus} />
        </div>

        {/* Network */}
        <div className={`preflight-item ${netStatus}`}>
          <Wifi size={20} />
          <div className="preflight-item-info">
            <span className="preflight-item-label">Network</span>
            <span className="preflight-item-status">
              {netStatus === 'testing' && 'Testing...'}
              {netStatus === 'pass' && 'Connected'}
              {netStatus === 'fail' && 'Connection issue'}
              {netStatus === 'pending' && 'Waiting...'}
            </span>
          </div>
          <StatusIcon status={netStatus} />
        </div>
      </div>

      {/* Camera preview */}
      {camStatus === 'pass' && (
        <div className="preflight-camera-preview">
          <video
            ref={videoPreviewRef}
            autoPlay
            muted
            playsInline
            className="preflight-video"
          />
        </div>
      )}

      {/* Error messages */}
      {errorMsg && (
        <div className="preflight-error">
          <AlertTriangle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interview Tips */}
      <div className="preflight-tips">
        <h4 className="preflight-tips-title">
          💡 Tips for your {interviewType === 'hr' ? 'HR' : 'Technical'} interview
        </h4>
        <ul className="preflight-tips-list">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Status summary */}
      <div className={`preflight-summary ${allPassed ? 'preflight-summary--ready' : ''}`}>
        {allPassed ? (
          <>
            <CheckCircle size={16} /> All systems ready — you're good to go!
          </>
        ) : (
          <>
            <Loader size={16} className="preflight-spin" /> Checking your setup...
          </>
        )}
      </div>
    </div>
  );
}

export default memo(PreflightChecks);
