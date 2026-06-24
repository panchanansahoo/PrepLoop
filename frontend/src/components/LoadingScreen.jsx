import { useState, useEffect, useRef } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onFinished, minimumDuration = 400 }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('entering'); // entering, loading, exiting, done
  const [tipIndex, setTipIndex] = useState(0);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const tips = [
    'Preparing your coding arena...',
    'Loading DSA patterns & algorithms...',
    'Powering up AI interview engine...',
    'Syncing your learning progress...',
    'Almost there...',
  ];

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const PARTICLE_COUNT = 60;

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() > 0.5 ? 280 : 190; // purple or cyan
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    // Draw connecting lines between nearby particles
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 130, 255, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawConnections();
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Progress simulation
  useEffect(() => {
    const startTime = Date.now();
    let frame;
    let beginTimer;
    let finishTimer;
    let exitTimer;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setProgress(100);
      setPhase('exiting');
      exitTimer = setTimeout(() => {
        setPhase('done');
        onFinishedRef.current?.();
      }, 700);
    };

    const tick = () => {
      if (done) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / minimumDuration, 1);
      // Easing: fast start, slow middle, fast end
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    // Start "entering" phase, then begin loading
    beginTimer = setTimeout(() => {
      setPhase('loading');
      frame = requestAnimationFrame(tick);
    }, 400);

    // Fallback: ensure loader always completes even if RAF is throttled.
    finishTimer = setTimeout(() => {
      finish();
    }, minimumDuration + 1200);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(beginTimer);
      clearTimeout(finishTimer);
      clearTimeout(exitTimer);
    };
  }, [minimumDuration]);

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`loading-screen ${phase}`}>
      <canvas ref={canvasRef} className="loading-particles" />

      {/* Ambient glow effects */}
      <div className="loading-ambient">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      <div className="loading-content">
        {/* Animated Logo */}
        <div className="loading-logo-wrapper">
          <div className="logo-glow-ring" />
          <div className="logo-glow-ring logo-glow-ring-2" />
          <svg
            className="loading-logo-svg"
            width="90"
            height="90"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="l-cyan-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00FFFF" />
                <stop offset="100%" stopColor="#0022FF" />
              </linearGradient>
              <linearGradient id="l-magenta-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF00AA" />
                <stop offset="100%" stopColor="#FF0033" />
              </linearGradient>
              <linearGradient id="l-purple-fade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7700FF" />
                <stop offset="100%" stopColor="#D500F9" />
              </linearGradient>
            </defs>
            {/* Purple Tail */}
            <path
              className="logo-path logo-path-3"
              d="M 200,320 L 200,390 C 200,470 280,470 320,470 L 430,470 C 470,470 470,390 430,390 L 320,390 C 290,390 280,370 280,350 L 280,320 Z"
              fill="url(#l-purple-fade)"
            />
            {/* Cyan Pillar */}
            <path
              className="logo-path logo-path-1"
              d="M 240,100 C 150,100 120,150 120,240 L 120,400 C 120,450 200,450 200,400 L 200,240 C 200,190 210,180 240,180 Z"
              fill="url(#l-cyan-blue)"
            />
            {/* Magenta Loop */}
            <path
              className="logo-path logo-path-2"
              d="M 240,100 C 380,100 430,140 430,210 C 430,280 360,320 120,320 L 120,240 C 310,240 350,230 350,210 C 350,180 300,180 240,180 Z"
              fill="url(#l-magenta-red)"
            />
          </svg>
        </div>

        {/* Brand name */}
        <h1 className="loading-brand">
          <span className="brand-letter" style={{ animationDelay: '0.1s' }}>P</span>
          <span className="brand-letter" style={{ animationDelay: '0.15s' }}>r</span>
          <span className="brand-letter" style={{ animationDelay: '0.2s' }}>e</span>
          <span className="brand-letter" style={{ animationDelay: '0.25s' }}>p</span>
          <span className="brand-letter" style={{ animationDelay: '0.3s' }}>L</span>
          <span className="brand-letter" style={{ animationDelay: '0.35s' }}>o</span>
          <span className="brand-letter" style={{ animationDelay: '0.4s' }}>o</span>
          <span className="brand-letter" style={{ animationDelay: '0.45s' }}>p</span>
        </h1>

        {/* Progress section */}
        <div className="loading-progress-section">
          <div className="loading-progress-track">
            <div
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="loading-progress-glow"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="loading-progress-info">
            <span className="loading-tip" key={tipIndex}>{tips[tipIndex]}</span>
            <span className="loading-percent">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
