import { Cookie, Shield, Settings, CheckCircle2 } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', position: 'relative' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 10, maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
            Cookie <span className="text-gradient">Policy</span>
          </h1>
          <p style={{ color: 'var(--zinc-400)', fontSize: '16px' }}>Last Updated: February 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', padding: '32px', borderRadius: '16px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Cookie size={24} color="#a78bfa" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>1. What Are Cookies?</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', margin: 0 }}>
              Cookies are small text files placed on your computer or mobile device when you browse websites. They are widely used to make websites work efficiently, provide security (like CSRF defense and authentication), and remember your preferences between sessions.
            </p>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '28px', borderRadius: '12px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Shield size={24} color="#34d399" />
              <h2 style={{ fontSize: '22px', margin: 0 }}>2. Cookies We Use</h2>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--zinc-400)' }}>
              <li style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <strong style={{ color: 'var(--color-text-primary)' }}>Strictly Necessary & Security Cookies (Always Active)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Essential for platform security, user login state, and CSRF attack prevention (<code>__csrf_token</code>, <code>preploop_access</code>). These cannot be disabled without breaking application functionality.
                </p>
              </li>

              <li style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} color="#818cf8" />
                  <strong style={{ color: 'var(--color-text-primary)' }}>Preferences & Functional Cookies</strong>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Remember your chosen theme (dark/light mode), code editor font size, layout preferences, and audio input device selections across sessions.
                </p>
              </li>

              <li style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} color="#f472b6" />
                  <strong style={{ color: 'var(--color-text-primary)' }}>Aggregated Performance & Error Diagnostics</strong>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Used strictly for anonymized telemetry to detect client errors, slow API roundtrips, and voice model latency to maintain service quality.
                </p>
              </li>
            </ul>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '28px', borderRadius: '12px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Settings size={24} color="#818cf8" />
              <h2 style={{ fontSize: '22px', margin: 0 }}>3. Managing Your Cookie Choices</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '12px' }}>
              You can adjust your cookie consent settings at any time via the cookie banner or your browser's settings. Most modern browsers allow you to refuse or delete cookies:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--zinc-400)', lineHeight: '1.8' }}>
              <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies</li>
              <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Block all cookies</li>
            </ul>
          </section>

          <section style={{ borderTop: '1px solid var(--zinc-800)', paddingTop: '32px', marginTop: '16px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>4. Inquiries</h2>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
              For questions concerning our cookie handling practices: <br />
              <a href="mailto:support@preploop.me?subject=Cookie%20Policy%20Inquiry" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
                support@preploop.me
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

