import React from 'react';
import { FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';


export default function TermsOfService() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', position: 'relative' }}>


            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 10, maxWidth: '800px' }}>

                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>Terms of <span className="text-gradient">Service</span></h1>
                    <p style={{ color: 'var(--zinc-400)', fontSize: '16px' }}>Last Updated: February 2026</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', padding: '32px', borderRadius: '16px', border: '1px solid var(--zinc-800)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <FileText size={24} color="#a78bfa" />
                            <h2 style={{ fontSize: '24px', margin: 0 }}>1. Agreement to Terms</h2>
                        </div>
                        <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
                            By accessing or using PrepLoop, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <CheckCircle size={24} color="#818cf8" />
                            <h2 style={{ fontSize: '24px', margin: 0 }}>2. Use License</h2>
                        </div>
                        <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '16px' }}>
                            Permission is granted to temporarily download one copy of the materials (information or software) on PrepLoop for personal, non-commercial transitory viewing only.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, color: 'var(--zinc-400)' }}>
                            <li style={{ marginBottom: '8px', paddingLeft: '16px', borderLeft: '2px solid var(--zinc-700)' }}>You must not modify or copy the materials.</li>
                            <li style={{ marginBottom: '8px', paddingLeft: '16px', borderLeft: '2px solid var(--zinc-700)' }}>You must not use the materials for any commercial purpose.</li>
                            <li style={{ marginBottom: '8px', paddingLeft: '16px', borderLeft: '2px solid var(--zinc-700)' }}>You must not attempt to decompile or reverse engineer any software contained on PrepLoop.</li>
                        </ul>
                    </section>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <AlertCircle size={24} color="#f472b6" />
                            <h2 style={{ fontSize: '24px', margin: 0 }}>3. Disclaimer</h2>
                        </div>
                        <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
                            The materials on PrepLoop are provided on an 'as is' basis. PrepLoop makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <HelpCircle size={24} color="#34d399" />
                            <h2 style={{ fontSize: '24px', margin: 0 }}>4. Limitations</h2>
                        </div>
                        <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
                            In no event shall PrepLoop or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PrepLoop.
                        </p>
                    </section>

                    <section style={{ borderTop: '1px solid var(--zinc-800)', paddingTop: '32px', marginTop: '16px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>5. Contact Us</h2>
                        <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
                            If you have any questions about these Terms, please contact us at: <br />
                            <a href="mailto:support@preploop.me" style={{ color: '#a78bfa', textDecoration: 'none' }}>support@preploop.me</a>
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
