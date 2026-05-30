import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { authFetch } from '../utils/authFetch';
import { ArrowRight, ArrowLeft, CheckCircle, Target, Clock, BookOpen } from 'lucide-react';

const steps = [
    {
        title: 'Experience Level',
        subtitle: 'How would you describe your current skill level?',
        icon: <Target size={24} />,
        options: [
            { value: 'beginner', label: 'Beginner', desc: 'New to DS&A and interviews' },
            { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience, some interview practice' },
            { value: 'advanced', label: 'Advanced', desc: '3+ years, targeting senior roles at top companies' }
        ]
    },
    {
        title: 'Target Companies',
        subtitle: 'What type of companies are you targeting?',
        icon: <Target size={24} />,
        options: [
            { value: 'faang', label: 'FAANG / Big Tech', desc: 'Google, Meta, Amazon, Apple, Microsoft' },
            { value: 'startup', label: 'Startups', desc: 'Fast-paced, product-focused companies' },
            { value: 'enterprise', label: 'Enterprise', desc: 'Large established companies' },
            { value: 'any', label: 'Open to All', desc: 'Exploring all opportunities' }
        ]
    },
    {
        title: 'Preparation Timeline',
        subtitle: 'How much time do you have before your interviews?',
        icon: <Clock size={24} />,
        options: [
            { value: '1month', label: '1 Month', desc: 'Intensive preparation' },
            { value: '3months', label: '3 Months', desc: 'Balanced preparation' },
            { value: '6months', label: '6+ Months', desc: 'Comprehensive preparation' }
        ]
    },
    {
        title: 'Focus Areas',
        subtitle: 'What would you like to focus on? (Select all that apply)',
        icon: <BookOpen size={24} />,
        multi: true,
        options: [
            { value: 'dsa', label: 'Data Structures & Algorithms', desc: 'Core coding problems' },
            { value: 'system-design', label: 'System Design', desc: 'HLD & LLD interviews' },
            { value: 'behavioral', label: 'Behavioral', desc: 'Leadership & culture fit' },
            { value: 'resume', label: 'Resume Optimization', desc: 'ATS-friendly resume' },
            { value: 'ai-ml', label: 'AI & Machine Learning', desc: 'ML concepts & deployment' },
            { value: 'data-science', label: 'Data Science', desc: 'Statistics & analysis' }
        ]
    }
];

export default function Onboarding() {
    const navigate = useNavigate();
    const { _user } = useAuth();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);

    const current = steps[step];
    const isLast = step === steps.length - 1;

    const selectOption = (value) => {
        if (current.multi) {
            const prev = answers[step] || [];
            const updated = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
            setAnswers({ ...answers, [step]: updated });
        } else {
            setAnswers({ ...answers, [step]: value });
        }
    };

    const isSelected = (value) => {
        if (current.multi) return (answers[step] || []).includes(value);
        return answers[step] === value;
    };

    const canProceed = current.multi ? (answers[step] || []).length > 0 : !!answers[step];

    const handleFinish = async () => {
        setSaving(true);
        try {
            await authFetch('/api/user/preferences', {
                method: 'PUT',
                body: JSON.stringify({
                    experienceLevel: answers[0],
                    targetCompanies: answers[1],
                    timeline: answers[2],
                    focusAreas: answers[3]
                })
            });
        } catch (err) {
            console.error('Failed to save preferences:', err);
        }
        navigate('/dashboard');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: 600, width: '100%' }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: i <= step ? 'var(--accent)' : 'var(--border)',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>

                {/* Step Content */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'rgba(108,92,231,0.15)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        {current.icon}
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{current.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{current.subtitle}</p>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {current.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => selectOption(opt.value)}
                            style={{
                                background: isSelected(opt.value) ? 'rgba(108,92,231,0.15)' : 'var(--bg-card)',
                                border: `2px solid ${isSelected(opt.value) ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 12,
                                padding: '16px 20px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 14
                            }}
                        >
                            <div style={{
                                width: 22, height: 22, borderRadius: current.multi ? 6 : '50%',
                                border: `2px solid ${isSelected(opt.value) ? 'var(--accent)' : 'var(--border)'}`,
                                background: isSelected(opt.value) ? 'var(--accent)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {isSelected(opt.value) && <CheckCircle size={14} color="white" />}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{opt.label}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        style={{
                            background: 'transparent', border: '1px solid var(--border)',
                            color: step === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                            cursor: step === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit'
                        }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <button
                        onClick={isLast ? handleFinish : () => setStep(step + 1)}
                        disabled={!canProceed || saving}
                        className="btn-hero-primary"
                        style={{
                            border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                            opacity: canProceed ? 1 : 0.5
                        }}
                    >
                        {saving ? 'Saving...' : isLast ? 'Finish Setup' : 'Continue'} {!saving && <ArrowRight size={16} />}
                    </button>
                </div>

                {/* Skip */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => navigate('/dashboard')} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
                    }}>
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}
