import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, ChevronDown, ArrowRight, Sparkles
} from 'lucide-react';
import './Pricing.css';

/* ───── plan data ───── */
const plans = [
  {
    name: 'Free',
    tagline: 'Everything you need to start your prep journey.',
    price: '₹0',
    period: '/ month',
    discount: null,
    features: [
      '5 AI mock interviews per month',
      'Basic code feedback',
      'DSA patterns sheet access',
      'Basic progress tracking',
    ],
    btnText: 'Download Now',
    btnStyle: 'pricing-btn-outline',
    popular: false,
    btnLink: '/signup',
  },
  {
    name: 'Pro',
    tagline: 'Unlock a new level of your personal productivity.',
    price: '₹99',
    period: '/ month',
    discount: '-20%',
    features: [
      'Everything in Free',
      'Unlimited AI mock interviews',
      'Advanced code feedback & optimization',
      'Resume analysis & generation',
      'System design practice',
      'Priority support',
    ],
    addon: { label: 'Include GPT-4', price: '+ ₹49 / month' },
    btnText: 'Get Started',
    btnStyle: 'pricing-btn-primary',
    popular: true,
    btnLink: '/payment?plan=pro',
  },
  {
    name: 'Team',
    tagline: 'Everything you need to supercharge your productivity.',
    price: '₹299',
    period: '/ month',
    discount: '-20%',
    features: [
      'Everything in Free',
      'Unlimited Shared Commands',
      'Unlimited Shared Quicklinks',
      'Unlimited Team Members',
    ],
    btnText: 'Get Started',
    btnStyle: 'pricing-btn-teal',
    popular: false,
    btnLink: '/payment?plan=elite',
  },
];



/* ───── faqs ───── */
const faqs = [
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes. You can upgrade your plan anytime for instant access to new features. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. We use industry-standard encryption and never store your card details on our servers.',
  },
  {
    q: "What's your refund policy?",
    a: 'We offer a 7-day money-back guarantee for all paid subscription plans.',
  },
  {
    q: 'Is the Starter plan really free?',
    a: 'The Free plan is free forever and gives you limited access to AI interviews and code feedback.',
  },
  {
    q: 'How is this different from free platforms?',
    a: 'Free platforms give you problems — we give you a complete system. AI interviewers, instant code feedback, and resume tools. Most users feel interview-ready in 60-90 days.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts or cancellation fees. Cancel from your profile page and retain access until end of billing period.',
  },
];

/* ═══════════════════════════════════════════ */
export default function Pricing() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const resolveLink = (plan) => {
    if ((plan.name === 'Pro' || plan.name === 'Team') && (!user || user.isGuest)) {
      return '/login';
    }
    return plan.btnLink;
  };

  return (
    <div className="pricing-page">

      {/* ── Hero ── */}
      <section className="pricing-hero">
        <h1>
          Choose the Plan<br />
          That's Right for You
        </h1>
        <p>
          The core of Preploop is free, including AI mock interviews. Purchase the
          Pro Plan to unlock a new level of productivity with advanced AI, analytics
          and much more!
        </p>
      </section>

      {/* ── Plans ── */}
      <section className="pricing-plans-section">
        <div className="pricing-plans-grid">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`pricing-plan-card ${plan.popular ? 'pricing-popular' : ''}`}
            >
              <div className="pricing-plan-name">{plan.name}</div>
              <p className="pricing-plan-tagline">{plan.tagline}</p>

              <div className="pricing-price-row">
                <span className="pricing-price-amount">{plan.price}</span>
                <span className="pricing-price-period">{plan.period}</span>
                {plan.discount && (
                  <span className="pricing-price-discount">{plan.discount}</span>
                )}
              </div>

              <div className="pricing-whats-included">What's included</div>

              <ul className="pricing-features-list">
                {plan.features.map((f, j) => (
                  <li key={j}>
                    <span className="pricing-feature-check">
                      <CheckCircle size={13} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.addon && (
                <label className="pricing-addon-row">
                  <input type="checkbox" className="pricing-addon-checkbox" />
                  <span className="pricing-addon-label">{plan.addon.label}</span>
                  <span className="pricing-addon-price">{plan.addon.price}</span>
                </label>
              )}

              <Link
                to={resolveLink(plan)}
                className={`pricing-cta-btn ${plan.btnStyle}`}
              >
                {plan.btnText}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise banner */}
        <div className="pricing-enterprise-banner">
          <p>
            Want enterprise features?{' '}
            <Link to="/contact">
              Contact Us <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pricing-faq-section">
        <div className="pricing-faq-header">
          <h2>Frequently Asked<br />Questions</h2>
          <p>
            Have questions about Preploop? Here are some of the most common
            inquiries we receive from our users. If you don't find the answer
            you're looking for, feel free to contact us.
          </p>
        </div>

        <div className="pricing-faq-list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`pricing-faq-item ${openFaq === i ? 'pricing-faq-open' : ''}`}
            >
              <button
                className="pricing-faq-question-btn"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <ChevronDown size={18} className="pricing-faq-chevron" />
              </button>
              <div
                className={`pricing-faq-answer ${openFaq === i ? 'pricing-faq-answer-open' : ''}`}
              >
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
