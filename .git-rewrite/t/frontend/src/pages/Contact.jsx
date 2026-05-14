import React, { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, Linkedin, Github, Twitter, Loader } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../utils/safeApiUrl';


export default function Contact() {
    const FORM_LABELS = {
        name: 'Name',
        email: 'Email',
        subject: 'Subject',
        message: 'Message',
    };

    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSubmitted(true);
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                alert("Your message couldn't be sent. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("We're having trouble sending your message. Please check your connection.");
        } finally {
            setSending(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#020203', color: isLight ? '#1e293b' : 'white', position: 'relative' }}>


            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Let's <span className="text-gradient">Connect</span></h1>
                    <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Have a question about the platform? Want to partner up? Or just want to talk about AI and System Design? We'd love to hear from you.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '64px', alignItems: 'start' }}>

                    {/* Contact Info Side */}
                    <div>
                        <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', border: isLight ? '1px solid #e2e8f0' : '1px solid var(--zinc-800)' }}>
                            <h3 style={{ fontSize: '24px', marginBottom: '32px' }}>Contact Information</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Email Us</h4>
                                        <a href="mailto:support@preploop.me" style={{ color: 'var(--zinc-400)', textDecoration: 'none', fontSize: '15px', transition: 'color 0.2s' }} className="hover:text-white">
                                            support@preploop.me
                                        </a>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
                                        <Linkedin size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Connect on LinkedIn</h4>
                                        <a href="https://www.linkedin.com/in/panchanansahoo/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--zinc-400)', textDecoration: 'none', fontSize: '15px' }} className="hover:text-white">
                                            Panchanan Sahoo
                                        </a>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Location</h4>
                                        <p style={{ color: 'var(--zinc-400)', fontSize: '15px', margin: 0 }}>
                                            Bangalore, India
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--zinc-800)' }}>
                                <p style={{ color: 'var(--zinc-500)', fontSize: '14px', marginBottom: '16px' }}>Follow our journey</p>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <a href="#" className="icon-btn" style={{ width: 40, height: 40, borderRadius: '50%', background: isLight ? '#f1f5f9' : 'var(--zinc-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLight ? '#334155' : 'white', border: isLight ? '1px solid #e2e8f0' : '1px solid var(--zinc-800)' }}><Twitter size={18} /></a>
                                    <a href="#" className="icon-btn" style={{ width: 40, height: 40, borderRadius: '50%', background: isLight ? '#f1f5f9' : 'var(--zinc-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLight ? '#334155' : 'white', border: isLight ? '1px solid #e2e8f0' : '1px solid var(--zinc-800)' }}><Github size={18} /></a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(10,10,10,0.6)', padding: '48px', borderRadius: '24px', border: isLight ? '1px solid #e2e8f0' : '1px solid var(--zinc-800)', backdropFilter: 'blur(10px)' }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#34d399' }}>
                                    <MessageSquare size={40} />
                                </div>
                                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Message Sent!</h3>
                                <p style={{ color: 'var(--zinc-400)', marginBottom: '32px' }}>
                                    Thanks for reaching out. We'll get back to you at <strong>{formData.email}</strong> as soon as possible.
                                </p>
                                <button onClick={() => setSubmitted(false)} className="btn btn-outline">Send another message</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3 style={{ fontSize: '24px', marginBottom: '32px' }}>Send a Message</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--zinc-400)', fontSize: '14px' }}>{FORM_LABELS.name}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '12px 16px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid #cbd5e1' : '1px solid var(--zinc-800)', borderRadius: '8px', color: isLight ? '#1e293b' : 'white', outline: 'none' }}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--zinc-400)', fontSize: '14px' }}>{FORM_LABELS.email}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '12px 16px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid #cbd5e1' : '1px solid var(--zinc-800)', borderRadius: '8px', color: isLight ? '#1e293b' : 'white', outline: 'none' }}
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--zinc-400)', fontSize: '14px' }}>{FORM_LABELS.subject}</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '12px 16px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid #cbd5e1' : '1px solid var(--zinc-800)', borderRadius: '8px', color: isLight ? '#1e293b' : 'white', outline: 'none' }}
                                        placeholder="Collaboration / Inquiry"
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--zinc-400)', fontSize: '14px' }}>{FORM_LABELS.message}</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '12px 16px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid #cbd5e1' : '1px solid var(--zinc-800)', borderRadius: '8px', color: isLight ? '#1e293b' : 'white', outline: 'none', minHeight: '150px', resize: 'vertical' }}
                                        placeholder="Tell us more..."
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={sending}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                                >
                                    {sending ? <Loader size={20} className="animate-spin" /> : <>Send Message <Send size={18} /></>}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
