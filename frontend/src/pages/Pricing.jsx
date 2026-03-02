import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, ChevronDown, ArrowRight, Zap, BookOpen, Star, Sparkles } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: 'Free',
        pricePer: '',
        priceSub: 'Free forever',
        features: [
            '5 AI mock interviews per month',
            'Basic code feedback',
            'DSA patterns sheet access',


            'Basic progress tracking'
        ],
        btnText: 'Get Started',
        btnClass: 'btn-outline',
        popular: false,
        btnLink: '/signup'
    },
    {
        name: 'Pro',
        price: '₹99',
        pricePer: '/mo',
        priceSub: 'Billed monthly · Save 20% annually',
        features: [
            'Unlimited AI mock interviews',
            'Advanced code feedback & optimization',
            'Full DSA patterns with solutions',

            'Resume analysis & generation',
            'System design practice',
            'Priority support',
            'Progress analytics dashboard'
        ],
        btnText: 'Get Pro',
        btnClass: 'btn-primary',
        popular: true,
        btnLink: '/payment?plan=pro'
    },
    {
        name: 'Elite',
        price: '₹299',
        pricePer: '/mo',
        priceSub: 'Billed monthly · Save 20% annually',
        features: [
            'Everything in Pro, plus:',

            'Extended interview time limits',
            'Behavioral interview coaching',

            'Early access to new features',
            'Priority support & mentorship',

        ],
        btnText: 'Get Elite',
        btnClass: 'btn-primary',
        popular: false,
        btnLink: '/payment?plan=elite'
    }
];

const faqs = [

    { q: "Can I upgrade or downgrade my plan?", a: "Yes. You can upgrade your plan anytime for instant access to new features. Downgrades take effect at the end of your current billing cycle." },

    { q: "Is my payment information secure?", a: "Yes. We use industry-standard encryption and never store your card details on our servers." },
    { q: "What's your refund policy?", a: "We offer a 7-day money-back guarantee for all paid subscription plans." },
    { q: "Is the Starter plan really free?", a: "The Starter plan is free forever and gives you limited access to AI interviews and code feedback." },
    { q: "How is this different from free platforms?", a: "Free platforms give you problems — we give you a complete system. AI interviewers, instant code feedback, and resume tools. Most users feel interview-ready in 60-90 days." },
    { q: "Can I cancel anytime?", a: "Yes. No contracts or cancellation fees. Cancel from your profile page and retain access until end of billing period." }
];

export default function Pricing() {
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div style={{ paddingTop: 40 }}>
            {/* Hero */}
            <section className="container" style={{ textAlign: 'center', marginBottom: 80 }}>
                <div className="badge badge-popular" style={{ marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} />
                    Unlock Your Potential
                </div>
                <h1 style={{ fontSize: '56px', marginBottom: '24px', lineHeight: 1.1 }}>
                    Pick the Path that <br />
                    <span className="text-gradient">Gets You Hired Faster</span>
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    AI-powered prep tailored to your timeline and career goals. Whether you need a structured daily plan or flexible practice, we have you covered.
                </p>
            </section>

            {/* Plans */}
            <section className="container" id="plans">
                <div className="pricing-grid">
                    {plans.map((plan, i) => (
                        <div key={i} className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.popular ? 'glow-effect' : ''}`}>
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute',
                                    top: -12,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 0 10px var(--accent-glow)'
                                }}>MOST POPULAR</div>
                            )}
                            <h3>{plan.name}</h3>
                            <div className="price-tag">
                                {plan.price}<span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 400 }}>{plan.pricePer}</span>
                            </div>
                            <div className="price-sub">{plan.priceSub}</div>
                            <ul className="feature-list">
                                {plan.features.map((f, j) => (
                                    <li key={j}><CheckCircle size={16} /> {f}</li>
                                ))}
                            </ul>
                            <Link to={(plan.name === 'Pro' || plan.name === 'Elite') && (!user || user.isGuest) ? '/login' : plan.btnLink} className={`btn ${plan.btnClass}`} style={{ width: '100%' }}>
                                {plan.btnText}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>



            {/* FAQ */}
            <section className="container" style={{ margin: '120px auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontSize: '32px' }}>Frequently Asked Questions</h2>
                </div>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} className="faq-item">
                            <button
                                className="faq-question"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                {faq.q}
                                <ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                            </button>
                            <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container" style={{ marginBottom: 100 }}>
                <div className="glass-panel glow-effect" style={{
                    borderRadius: '24px',
                    padding: '80px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 20, 25, 0.6) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <h2 style={{ fontSize: '40px', marginBottom: '16px' }}>Ready to get started?</h2>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Join thousands of engineers who are crushing technical interviews.</p>
                    <Link to="/signup" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '18px' }}>
                        Start Free Trial <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
