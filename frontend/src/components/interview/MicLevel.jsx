import { useState, useRef, useEffect } from 'react';

// ─── Mic Level Indicator ───
export default function MicLevel({ stream }) {
    const [level, setLevel] = useState(0);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!stream) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setLevel(Math.min(avg / 128, 1));
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();

            return () => {
                cancelAnimationFrame(rafRef.current);
                audioCtx.close();
            };
        } catch { /* AudioContext not available */ }
    }, [stream]);

    return (
        <div className="ti-mic-level">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`ti-mic-bar ${level > (i + 1) * 0.2 ? 'active' : ''}`}
                />
            ))}
        </div>
    );
}
