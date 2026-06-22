/**
 * useWebRTCVideo — Advanced WebRTC video streaming hook
 * Handles camera, screen sharing, and video quality optimization
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const VIDEO_CONSTRAINTS = {
  hd: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  sd: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
  low: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
};

export function useWebRTCVideo({ quality = 'sd', autoStart = false } = {}) {
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const streamRef = useRef(null);
  const videoRef = useRef(null);

  // Enumerate video devices
  const enumerateDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('[WebRTC] Device enumeration failed:', err);
    }
  }, [selectedDevice]);

  // Start video stream
  const start = useCallback(async (deviceId = selectedDevice) => {
    try {
      const constraints = {
        video: {
          ...VIDEO_CONSTRAINTS[quality],
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: 'user',
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return mediaStream;
    } catch (err) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Camera access denied'
        : err.name === 'NotFoundError'
        ? 'No camera found'
        : `Camera error: ${err.message}`;
      setError(errorMsg);
      setIsActive(false);
      return null;
    }
  }, [quality, selectedDevice]);

  // Stop video stream
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async (deviceId) => {
    stop();
    setSelectedDevice(deviceId);
    await start(deviceId);
  }, [start, stop]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      enumerateDevices().then(() => start());
    }
    return () => stop();
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stream,
    isActive,
    error,
    devices,
    selectedDevice,
    videoRef,
    start,
    stop,
    switchCamera,
    enumerateDevices,
  };
}

export default useWebRTCVideo;
