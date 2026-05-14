import React, { useState, useRef } from 'react';

import { API_URL } from '../utils/safeApiUrl';

export default function SimpleVoiceTest() {
    const [status, setStatus] = useState('Ready');
    const [transcript, setTranscript] = useState('');
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null);

    const testMicrophone = async () => {
        try {
            setStatus('Requesting microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setStatus('✓ Microphone granted! Click "Record & Transcribe" to test');
        } catch (err) {
            setStatus(`✗ Microphone error: ${err.message}`);
        }
    };

    const testTTS = async () => {
        try {
            setStatus('Testing TTS...');
            const res = await fetch(`${API_URL}/api/voice/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: 'Hello, this is a test of the voice system.',
                    persona: 'friendly',
                    gender: 'female'
                })
            });

            if (import.meta.env.DEV) console.log('TTS Response:', res.status, res.headers.get('content-type'));

            if (!res.ok) {
                setStatus(`✗ TTS failed: ${res.status}`);
                return;
            }

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('audio')) {
                const blob = await res.blob();
                if (import.meta.env.DEV) console.log('Audio blob:', blob.size, 'bytes');
                setStatus(`✓ Got audio: ${blob.size} bytes. Playing...`);
                
                const url = URL.createObjectURL(blob);
                if (!audioRef.current) audioRef.current = new Audio();
                audioRef.current.src = url;
                
                audioRef.current.onended = () => {
                    URL.revokeObjectURL(url);
                    setStatus('✓ TTS playback complete');
                };
                
                audioRef.current.onerror = (e) => {
                    console.error('Audio error:', e);
                    setStatus('✗ Audio playback failed');
                };
                
                await audioRef.current.play();
            } else {
                const data = await res.json();
                setStatus(`✗ TTS returned fallback: ${JSON.stringify(data)}`);
            }
        } catch (err) {
            console.error('TTS error:', err);
            setStatus(`✗ TTS error: ${err.message}`);
        }
    };

    const testSTT = async () => {
        if (!streamRef.current) {
            setStatus('✗ Please test microphone first');
            return;
        }

        try {
            setStatus('Recording for 5 seconds...');
            const recorder = new MediaRecorder(streamRef.current);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                if (import.meta.env.DEV) console.log('Recorded blob:', blob.size, 'bytes');
                setStatus(`Recorded ${blob.size} bytes. Transcribing...`);

                const formData = new FormData();
                formData.append('audio', blob, 'test.webm');
                formData.append('mimeType', 'audio/webm');

                try {
                    const res = await fetch(`${API_URL}/api/voice/stt-chunk`, {
                        method: 'POST',
                        body: formData
                    });

                    if (import.meta.env.DEV) console.log('STT Response:', res.status);
                    const data = await res.json();
                    if (import.meta.env.DEV) console.log('STT Data:', data);

                    if (data.transcript) {
                        setTranscript(data.transcript);
                        setStatus(`✓ Transcribed! Confidence: ${Math.round(data.confidence * 100)}%`);
                    } else {
                        setStatus(`✗ No transcript: ${JSON.stringify(data)}`);
                    }
                } catch (err) {
                    console.error('STT error:', err);
                    setStatus(`✗ STT error: ${err.message}`);
                }
            };

            recorder.start();
            setTimeout(() => recorder.stop(), 5000);

        } catch (err) {
            console.error('Recording error:', err);
            setStatus(`✗ Recording error: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: 40, background: '#1a1a1a', minHeight: '100vh', color: '#fff', fontFamily: 'Arial' }}>
            <h1>Simple Voice Test</h1>
            
            <div style={{ padding: 20, background: '#2a2a2a', borderRadius: 8, marginBottom: 20 }}>
                <strong>Status:</strong> {status}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={testMicrophone} style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>
                    1. Test Microphone
                </button>
                <button onClick={testTTS} style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>
                    2. Test TTS (AI Voice)
                </button>
                <button onClick={testSTT} style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>
                    3. Record & Transcribe (5s)
                </button>
            </div>

            {transcript && (
                <div style={{ padding: 20, background: '#2a2a2a', borderRadius: 8 }}>
                    <strong>Transcript:</strong><br />
                    {transcript}
                </div>
            )}

            <div style={{ marginTop: 40, padding: 20, background: '#2a2a2a', borderRadius: 8, fontSize: 14 }}>
                <strong>Instructions:</strong>
                <ol>
                    <li>Click "Test Microphone" - Allow permission when prompted</li>
                    <li>Click "Test TTS" - You should hear AI voice</li>
                    <li>Click "Record & Transcribe" - Speak for 5 seconds</li>
                </ol>
                <p>Open browser console (F12) to see detailed logs.</p>
            </div>
        </div>
    );
}
