import { Shield, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', position: 'relative' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 10, maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>Privacy <span className="text-gradient">Policy</span></h1>
          <p style={{ color: 'var(--zinc-400)', fontSize: '16px' }}>Last Updated: February 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', padding: '32px', borderRadius: '16px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Shield size={24} color="#a78bfa" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>1. Introduction</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
              Welcome to PrepLoop ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
              This policy explains how we collect, use, and safeguard your data when you use our AI-powered interview preparation platform.
            </p>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Database size={24} color="#818cf8" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>2. Information We Collect</h2>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--zinc-400)' }}>
              <li style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Account Information</strong>
                Name, email address, and password provided during registration.
              </li>
              <li style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Performance Data</strong>
                Code submissions, mock interview responses, and progress metrics to provide personalized AI feedback.
              </li>
              <li style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Usage Data</strong>
                Information about how you interact with our platform to improve user experience.
              </li>
            </ul>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Eye size={24} color="#34d399" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>3. How We Use Your Data</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '16px' }}>
              We use your data exclusively to power the PrepLoop experience:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 style={{ fontSize: '16px', color: '#34d399', marginBottom: '8px' }}>AI Personalization</h3>
                <p style={{ fontSize: '14px', color: 'var(--zinc-400)', margin: 0 }}>Tailoring questions and study plans to your skill level.</p>
              </div>
              <div style={{ background: 'rgba(96, 165, 250, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                <h3 style={{ fontSize: '16px', color: '#60a5fa', marginBottom: '8px' }}>Service Improvement</h3>
                <p style={{ fontSize: '14px', color: 'var(--zinc-400)', margin: 0 }}>Analyzing aggregate usage to fix bugs and enhance features.</p>
              </div>
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Lock size={24} color="#f472b6" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>4. Data Security</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
              We implement industry-standard security measures, including encryption in transit and at rest, to protect your personal information.
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', padding: '32px', borderRadius: '16px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Shield size={24} color="#38bdf8" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>5. Speech Recognition & AI Inference Services</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '14px' }}>
              To provide real-time interactive voice interviews, data is processed in transit by specific external providers:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--zinc-400)', margin: 0 }}>
              <li style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Browser Speech Recognition (STT)</strong>
                Voice transcription relies on your browser's native Web Speech API, where Google (on Chrome) or Apple (on Safari) processes the spoken voice. We don't store audio.
              </li>
              <li style={{ background: 'rgba(167, 139, 250, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.15)' }}>
                <strong style={{ color: '#a78bfa', display: 'block', marginBottom: '4px' }}>Third-Party AI Inference Partners</strong>
                Transcripts are sent to third-party AI inference providers (including Groq, Google AI Studio, and OpenRouter) with emails, phone numbers, and self-introduced names removed on a best-effort basis. Providers’ own data policies apply.
              </li>
              <li style={{ background: 'rgba(52, 211, 153, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>Testing Pilot Notice</strong>
                During evaluation pilots, technical performance data, latency metrics, and anonymized transcripts are collected to evaluate voice responsiveness and scoring accuracy with explicit candidate consent.
              </li>
              <li style={{ background: 'rgba(244, 114, 182, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(244, 114, 182, 0.15)' }}>
                <strong style={{ color: '#f472b6', display: 'block', marginBottom: '4px' }}>Data Retention &amp; 14-Day Automatic Deletion</strong>
                Interview session recordings, audio snippets, and pilot evaluation files are retained for a maximum of 14 days and then automatically deleted from our servers.
              </li>
            </ul>
          </section>

          <section style={{ borderTop: '1px solid var(--zinc-800)', paddingTop: '32px', marginTop: '16px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>6. Contact Us</h2>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
              If you have any questions about this Privacy Policy, please contact us at: <br />
              <a href="mailto:support@preploop.me" style={{ color: '#a78bfa', textDecoration: 'none' }}>support@preploop.me</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
