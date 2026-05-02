import React, { useState, useEffect, useRef, Suspense } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
import { useAuth } from '../context/AuthContext';
import {
  Brain, Code2, MessageSquare, FileText, TrendingUp, BookOpen,
  CheckCircle, ChevronDown, ArrowRight, Users, Star, Shield,
  Zap, Clock, Target, Award, Play, Sparkles, Database, Calculator, Map,
  Building2, Mic, Globe, BarChart3, Bot, Layers, GitBranch,
  GraduationCap, Trophy, Rocket, ChevronRight, ChevronLeft, Quote, Activity,
  PenTool, Eye, Gauge, UserCheck, Timer, Flame, Crown, BadgeCheck,
  Briefcase, MapPin, ExternalLink, Calendar, Mail
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { lazyWithRecovery } from '../utils/lazyWithRecovery';

const Hero3DScene = lazyWithRecovery(() => import('../components/Hero3DScene'), 1);
import HeroShowcase from '../components/HeroShowcase';

/* ═══════════════════════════════════════════════ */
/*                    DATA                         */
/* ═══════════════════════════════════════════════ */

const features = [
  {
    icon: <Zap size={24} />,
    bg: 'rgba(139, 92, 246, 0.12)',
    color: '#a78bfa',
    title: 'Intelligent Code Studio',
    desc: 'Write production-grade code with an environment that critiques your style, efficiency, and edge cases.',
    link: '/code-practice',
    tag: 'Most Used'
  },
  {
    icon: <Database size={24} />,
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#60a5fa',
    title: 'SQL Mastery',
    desc: 'Master database queries with 100+ real-world SQL problems across joins, subqueries, window functions & more.',
    link: '/sql-problems',
    tag: '100+ Problems'
  },
  {
    icon: <Calculator size={24} />,
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    title: 'Aptitude Mastery',
    desc: 'Practice 200+ problems across quantitative aptitude, logical reasoning & verbal ability.',
    link: '/aptitude',
    tag: '200+ Problems'
  },
  {
    icon: <Map size={24} />,
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    title: 'DSA Learning Path',
    desc: 'Master 15 DSA topics with pattern-first learning, thinking frameworks, and curated problems.',
    link: '/dsa-path',
    tag: '15 Topics'
  },
  {
    icon: <Building2 size={24} />,
    bg: 'rgba(236, 72, 153, 0.12)',
    color: '#f472b6',
    title: 'Company Prep Hub',
    desc: 'Practice real interview questions from top companies — filtered by role, stage & frequency.',
    link: '/company-prep',
    tag: '50+ Companies'
  },
  {
    icon: <Mic size={24} />,
    bg: 'rgba(6, 182, 212, 0.12)',
    color: '#22d3ee',
    title: 'AI Interview Simulator',
    desc: 'Simulate real interviews with AI follow-ups. Includes voice practice with pace & filler analysis.',
    link: '/company-interview',
    tag: 'AI Powered'
  },
];

const howItWorks = [
  {
    step: '01',
    icon: <UserCheck size={28} />,
    title: 'Set Your Goal',
    desc: 'Tell us your target company, role, and timeline, and our AI will build a personalized roadmap for you.',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    glowColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  {
    step: '02',
    icon: <Flame size={28} />,
    title: 'Practice Daily',
    desc: 'Solve DSA, SQL, aptitude, and mock interviews. Get instant AI feedback on every attempt.',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  {
    step: '03',
    icon: <Trophy size={28} />,
    title: 'Land Your Dream Job',
    desc: 'Track your readiness score, fix weak areas, and walk into interviews with unstoppable confidence.',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  }
];

const testimonials = [
  {
    name: 'Rohan Sharma',
    role: 'SDE-2 at Amazon',
    text: 'I struggled with system design rounds for months. Preploop\'s AI interviewer gave me real-time actionable feedback on my architecture choices. Passed the loop on my next attempt.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RS&backgroundColor=6366f1'
  },
  {
    name: 'Anjali Desai',
    role: 'Frontend Engineer at Swiggy',
    text: 'Preploop\'s resume scanner changed the game for me. It bumped my ATS match score from 40% to 85% by fixing missing keywords. I finally started getting callbacks from top product companies.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=a855f7'
  },
  {
    name: 'Varun Iyer',
    role: 'Data Engineer at Flipkart',
    text: 'The prep wasn\'t just a generic grind. It pulled questions based on the actual company and role I was targeting. One of the exact SQL scenarios came up word for word in my onsite round.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=VI&backgroundColor=3b82f6'
  },
  {
    name: 'Sneha Patel',
    role: 'Backend Developer at Atlassian',
    text: 'The AI mock interviews felt incredibly realistic. It actually pressed me on edge cases and time complexities in my code, just like a real engineering manager would. That pressure testing was invaluable.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SP&backgroundColor=ec4899'
  },
  {
    name: 'Aditya Nath',
    role: 'DevOps Engineer',
    text: 'Transitioning from IT support to DevOps was tough. I used the tailored prep paths here to master Kubernetes and CI/CD interview patterns. Landed my first core engineering role two months later.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AN&backgroundColor=14b8a6'
  },
  {
    name: 'Karthik Nair',
    role: 'Full Stack Developer at Zomato',
    text: 'I kept failing React practical rounds because I was slow. The timed assessments on Preploop trained me to write clean components under pressure. Boosted my speed by 2x.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=KN&backgroundColor=f97316'
  },
  {
    name: 'Pooja Menon',
    role: 'ML Engineer at Microsoft',
    text: 'The machine learning system design questions are so niche, but Preploop had them. I got to practice scaling recommendation systems with the AI, which completely saved my final round.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=PM&backgroundColor=8b5cf6'
  },
  {
    name: 'Siddharth Rao',
    role: 'iOS Developer at Cred',
    text: 'It\'s hard to find good iOS interview prep. Preploop\'s mobile engineering tracks had exactly the kind of deep dive questions on memory management and protocol-oriented programming that I faced.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SR&backgroundColor=0ea5e9'
  },
  {
    name: 'Neha Kapoor',
    role: 'QA Automation Engineer',
    text: 'I wanted to move from manual QA to SDET. The automation testing practice tracks helped me master Selenium and Cypress concepts intuitively. I secured a 60% hike with my new role.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=NK&backgroundColor=d946ef'
  },
  {
    name: 'Arjun Verma',
    role: 'SDE-1 at Ola',
    text: 'The behavioral interview modules were a lifesaver. The AI analyzed my tone and structure, teaching me how to frame my past projects using the STAR method perfectly.',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AV&backgroundColor=22c55e'
  }
];

const liveActivities = [
  { text: 'Priya just completed a Google mock interview', time: '2m ago', icon: <Mic size={12} /> },
  { text: 'Rahul solved "Merge K Sorted Lists" in 12 min', time: '5m ago', icon: <Code2 size={12} /> },
  { text: 'Ananya achieved SQL Expert badge', time: '8m ago', icon: <Award size={12} /> },
  { text: 'Vikram scored 95/100 on System Design', time: '11m ago', icon: <Layers size={12} /> },
  { text: 'Neha unlocked the DSA Master achievement', time: '15m ago', icon: <Trophy size={12} /> },
  { text: 'Arjun completed 30-day coding streak 🔥', time: '18m ago', icon: <Flame size={12} /> },
];

const stats = [
  { value: 15000, suffix: '+', label: 'Active Engineers', icon: <Users size={20} /> },
  { value: 95, suffix: '%', label: 'Interview Success Rate', icon: <Target size={20} /> },
  { value: 500, suffix: '+', label: 'Practice Problems', icon: <Code2 size={20} /> },
  { value: 50, suffix: '+', label: 'Partner Companies', icon: <Building2 size={20} /> },
];

const pricingPlans = [
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
      'Priority support',
      'Progress analytics dashboard'
    ],
    btnText: 'Get Pro',
    btnClass: 'btn-primary',
    popular: true,
    btnLink: '/payment?plan=pro'
  },
  {
    name: 'Premium',
    price: '₹299',
    pricePer: '/mo',
    priceSub: 'Billed monthly · Save 20% annually',
    features: [
      'Everything in Pro, plus:',
      'Extended interview time limits',
      'Behavioral interview coaching',
      'Custom study plan generation',
      'Early access to new features',
      'Priority support & mentorship',
      'Exclusive Discord channel'
    ],
    btnText: 'Get Premium',
    btnClass: 'btn-primary',
    popular: false,
    btnLink: '/payment?plan=premium'
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

/* ═══════════════════════════════════════════════ */
/*               SUB-COMPONENTS                    */
/* ═══════════════════════════════════════════════ */

function FloatingCard({ children, style, className = '' }) {
  return (
    <div className={`hero-float-card ${className}`} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      backdropFilter: 'blur(20px)',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      ...style
    }}>
      {children}
    </div>
  );
}

/* Animated counter hook */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
}

function StatCard({ value, suffix, label, icon }) {
  const [count, ref] = useCountUp(value);
  return (
    <div ref={ref} className="stat-card-animate" style={{
      textAlign: 'center',
      padding: '32px 24px',
      flex: '1 1 200px',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px', fontFamily: "'Instrument Sans', sans-serif" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

/* Gradient divider */
function GradientDivider() {
  return (
    <div style={{
      height: '1px',
      background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
      margin: '0 auto',
      maxWidth: '800px'
    }} />
  );
}

/* Live Activity Ticker */
function ActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % liveActivities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activity = liveActivities[currentIndex];

  return (
    <div className="activity-ticker" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '99px',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      width: 'min(100%, 420px)',
      maxWidth: '100%',
      height: '38px'
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'pulse-dot 2s infinite' }} />
      <span className="ticker-text" key={currentIndex} style={{ whiteSpace: 'nowrap', animation: 'fadeSlideUp 0.4s ease', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {activity.icon} {activity.text}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>{activity.time}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*              JOB UPDATES PREVIEW                */
/* ═══════════════════════════════════════════════ */

function JobUpdatesPreview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  // Lazy-load: only fetch jobs when the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let fetched = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetched) {
          fetched = true;
          observer.disconnect();
          const fetchJobs = async () => {
            try {
              const data = await apiFetch.get('/api/jobs?limit=3');
              setJobs(data.jobs || []);
            } catch (err) {
              console.error('Failed to fetch jobs preview:', err);
            } finally {
              setLoading(false);
            }
          };
          fetchJobs();
        }
      },
      { rootMargin: '200px' } // Start fetching 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Color palette for company initials
  const gradients = [
    { bg: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))', color: '#c4b5fd' },
    { bg: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.1))', color: '#93c5fd' },
    { bg: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,63,94,0.1))', color: '#f9a8d4' },
    { bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(20,184,166,0.1))', color: '#6ee7b7' },
    { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,179,8,0.1))', color: '#fcd34d' },
    { bg: 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(239,68,68,0.1))', color: '#fca5a5' },
  ];

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffHrs = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  if (loading) {
    return (
      <section ref={sectionRef} style={{ padding: '80px 0', position: 'relative', zIndex: 10 }} id="jobs">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Loading latest jobs...</div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} style={{ padding: '80px 0', position: 'relative', zIndex: 10 }} id="jobs">
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '99px', fontSize: '11px', color: '#a78bfa',
            background: 'rgba(139, 92, 246, 0.08)', marginBottom: '20px',
            textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700'
          }}>
            <Briefcase size={12} /> Live Opportunities
          </div>
          <h2 style={{ fontSize: '40px', marginBottom: '16px', fontWeight: 'bold' }}>
            Latest <span className="text-gradient">Career Opportunities</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '17px', maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' }}>
            Fresher jobs, internships, off-campus drives & company hiring announcements — auto-fetched from top job portals
          </p>
        </div>

        {jobs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '16px', marginBottom: '48px' }}>
            {jobs.map((job, i) => {
              const grad = gradients[i % gradients.length];
              const initials = (job.company || 'C').split(/[\s&]+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
              const posted = getTimeAgo(job.created_at);
              const cleanDesc = (job.description || '')
                .replace(/Job Requisition ID\s*\S+/gi, '')
                .replace(/Position Overview\s*/gi, '')
                .trim();
              const typeBadge = { 'full-time': '#6366f1', 'internship': '#8b5cf6', 'contract': '#f59e0b', 'part-time': '#10b981' };
              const badgeColor = typeBadge[job.type] || '#6366f1';

              return (
                <div key={job.id || i} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '24px',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.05)';
                  e.currentTarget.querySelector('.card-accent').style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.querySelector('.card-accent').style.opacity = '0';
                }}
                >
                  {/* Gradient top accent */}
                  <div className="card-accent" style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6)',
                    opacity: 0, transition: 'opacity 0.35s ease'
                  }} />

                  {/* Header: Company + Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    {job.logo_url ? (
                      <img src={job.logo_url} alt={job.company} style={{
                        width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover',
                        border: '1px solid var(--border)', flexShrink: 0
                      }} />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                        background: grad.bg, color: grad.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: '800',
                        border: '1px solid var(--border)'
                      }}>
                        {initials}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: '1.35',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>{job.title}</h3>
                      <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '500' }}>{job.company}</span>
                    </div>
                  </div>

                  {/* Meta chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    {job.location && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)', border: '1px solid var(--border)'
                      }}>
                        <MapPin size={12} /> {job.location}
                      </span>
                    )}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                      color: badgeColor, textTransform: 'capitalize',
                      background: `${badgeColor}18`, border: `1px solid ${badgeColor}30`
                    }}>
                      {(job.type || 'full-time').replace(/-/g, ' ')}
                    </span>
                    {posted && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)', border: '1px solid var(--border)'
                      }}>
                        <Clock size={12} /> {posted}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '13px', lineHeight: '1.65', color: 'var(--text-muted)',
                    margin: '0 0 18px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {cleanDesc.length > 160 ? cleanDesc.substring(0, 160) + '...' : cleanDesc}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '16px', borderTop: '1px solid var(--border)'
                  }}>
                    {(job.source === 'adzuna' || job.source === 'remotive' || job.source === 'jsearch') && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', fontWeight: '500', padding: '3px 10px', borderRadius: '6px',
                        background: 'rgba(16,185,129,0.08)', color: '#34d399',
                        border: '1px solid rgba(16,185,129,0.15)'
                      }}>
                        <Globe size={11} /> Live
                      </span>
                    )}
                    {job.apply_link && (
                      <a href={job.apply_link} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '9px 20px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff', fontSize: '13px', fontWeight: '600',
                        textDecoration: 'none', transition: 'all 0.3s ease',
                        boxShadow: '0 2px 12px rgba(139,92,246,0.25)', marginLeft: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.4)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(139,92,246,0.25)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      >
                        Apply Now <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '20px', marginBottom: '40px'
          }}>
            <Briefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '4px' }}>No job listings yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Check back soon for the latest opportunities!</p>
          </div>
        )}

        {/* View All CTA */}
        <div style={{ textAlign: 'center' }}>
          <Button asChild size="lg" variant="outline" className="h-[48px] px-8 text-base">
            <Link to="/job-updates">
              View All Job Updates <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════ */
/*                 MAIN COMPONENT                  */
/* ═══════════════════════════════════════════════ */

export default function Home() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // Track window resize for responsive 3D toggle
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextTestimonial = () => setActiveTestimonial((i) => (i + 1) % testimonials.length);
  const prevTestimonial = () => setActiveTestimonial((i) => (i - 1 + testimonials.length) % testimonials.length);

  const getVisibleTestimonials = () => {
    const len = testimonials.length;
    const current = activeTestimonial;
    const prev = (current - 1 + len) % len;
    const next = (current + 1) % len;
    return [prev, current, next];
  };

  // Optional: Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(i => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      overflowX: 'hidden',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      width: '100%'
    }}>

      {/* Ambient gradient orbs - Enhanced for a premium feel */}
      <div style={{
        position: 'fixed', top: '10%', left: '-10%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 15s ease-in-out infinite alternate', filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'fixed', bottom: '5%', right: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 18s ease-in-out infinite alternate-reverse', filter: 'blur(50px)'
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '40%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 22s linear infinite', filter: 'blur(80px)'
      }} />



      {/* ═══════════════════════════════════════════════ */}
      {/*                   HERO SECTION                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="home-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', textAlign: 'left', paddingTop: '120px', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '64px', alignItems: 'center' }}>

            {/* Left Content */}
            <div style={{ zIndex: 10, position: 'relative' }}>

              {/* Live Activity Ticker */}
              <div style={{ marginBottom: '24px' }}>
                <ActivityTicker />
              </div>

              <h1 style={{ fontSize: 'clamp(34px, 8vw, 80px)', lineHeight: '1.05', fontWeight: '600', marginBottom: '32px', letterSpacing: '-0.03em' }}>
                Accelerate Your <br />
                <span className="text-gradient">Career Growth</span>
              </h1>

              <p style={{ fontSize: 'clamp(16px, 3.8vw, 20px)', lineHeight: '1.6', color: 'var(--zinc-400)', maxWidth: '540px', marginBottom: '48px' }}>
                Master technical interviews with AI-driven mock sessions and personalized feedback.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '0.15em', fontWeight: '700', color: '#888', marginBottom: '16px', textTransform: 'uppercase' }}>
                    LAUNCHED ON
                  </span>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Fazier Badge */}
                    <a href="https://fazier.com/launches/www.preploop.me" target="_blank" rel="noopener noreferrer" 
                      style={{ display: 'inline-block', transition: 'transform 0.2s' }} 
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} 
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width="120" alt="Fazier badge" />
                    </a>

                    {/* Product Hunt Badge */}
                    <a href="https://www.producthunt.com/products/preploop?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-preploop" target="_blank" rel="noopener noreferrer" 
                      style={{ display: 'inline-block', transition: 'transform 0.2s' }} 
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} 
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1127272&theme=light&t=1776597903520" width="250" height="54" alt="PrepLoop - All‑in‑one AI platform for tech interview prep | Product Hunt" />
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                  <Link to="/signup" className="btn-hero-primary" style={{
                    position: 'relative',
                    borderRadius: '999px',
                    padding: '16px 36px',
                    fontSize: '16px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}>
                    Start for free
                  </Link>
                  
                  <a href="#features" className="btn-hero-outline" style={{
                    position: 'relative',
                    borderRadius: '999px',
                    padding: '16px 36px',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}>
                    Watch Video <ChevronRight size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Visual — 3D Interactive Scene (Desktop Only) */}
            {!isMobileView && (
              <div style={{ position: 'relative', zIndex: 10, minHeight: '480px' }} className="hero-visual-container">
                {/* 3D Scene Background */}
                <Suspense fallback={null}>
                  <Hero3DScene />
                </Suspense>
              </div>
            )}

            {/* Mobile Fallback — Static Hero Showcase */}
            {isMobileView && (
              <div style={{
                position: 'relative', zIndex: 10, minHeight: '380px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))',
                borderRadius: '24px', border: '1px solid rgba(139,92,246,0.2)', padding: '40px 20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Sparkles size={48} style={{ color: '#a78bfa', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>AI Interview Studio</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 auto', maxWidth: '280px', lineHeight: '1.5' }}>
                    Master your interview skills with AI-powered feedback and real-time insights
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*        FROM ZERO TO INTERVIEW READY (SHOWCASE)  */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '60px 0', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <HeroShowcase />
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*               HOW IT WORKS                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', position: 'relative', zIndex: 10 }} id="how-it-works">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', border: '1px solid var(--border)',
              borderRadius: '99px', fontSize: '12px', color: 'var(--text-secondary)',
              background: 'var(--accent-glow)', marginBottom: '20px',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600'
            }}>
              <Rocket size={12} /> How It Works
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5.5vw, 40px)', marginBottom: '16px', fontWeight: 'bold' }}>
              Your Path to <span className="text-gradient">Interview Success</span>
            </h2>
            <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              A proven 3-step system that takes you from zero to interview-ready in weeks, not months.
            </p>
          </div>

          <div className="hiw-grid">
            {howItWorks.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div className="hiw-connector">
                    <div className="hiw-connector-line" />
                    <div className="hiw-connector-pulse" />
                    <ChevronRight size={18} className="hiw-connector-arrow" />
                  </div>
                )}
                <div className="hiw-card">
                  <div className="hiw-card-glow" style={{ background: item.glowColor }} />
                  <div className="hiw-step-badge" style={{ background: item.gradient }}>
                    {item.step}
                  </div>
                  <div className="hiw-icon-wrap" style={{
                    borderColor: item.borderColor,
                    background: `linear-gradient(135deg, ${item.glowColor}, transparent)`
                  }}>
                    <div className="hiw-icon-inner" style={{ background: item.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {React.cloneElement(item.icon, { style: { color: 'inherit' }, color: undefined })}
                    </div>
                    <div style={{ position: 'absolute', color: '#e4e4e7' }}>{item.icon}</div>
                  </div>
                  <h3 className="hiw-title">{item.title}</h3>
                  <p className="hiw-desc">{item.desc}</p>
                  <div className="hiw-accent-line" style={{ background: item.gradient }} />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*                  STATS BAR                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '60px 0', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '24px', backdropFilter: 'blur(20px)', padding: '20px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}>
            {stats.map((s, i) => (
              <StatCard key={i} value={s.value} suffix={s.suffix} label={s.label} icon={s.icon} />
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*                    FEATURES                     */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: 'transparent', position: 'relative', zIndex: 10 }} id="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', border: '1px solid var(--border)',
              borderRadius: '99px', fontSize: '12px', color: 'var(--text-secondary)',
              background: 'var(--accent-glow)', marginBottom: '20px',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600'
            }}>
              <Layers size={12} /> Platform Features
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5.5vw, 40px)', marginBottom: '16px', fontWeight: 'bold' }}>
              Everything you need to <span className="text-gradient">Crack the Interview</span>
            </h2>
            <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              A complete, AI-powered ecosystem designed to fast-track your engineering career.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <Link to={f.link} key={i} className="card feature-card-hover" style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border)',
                padding: '40px',
                display: 'block',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = f.color;
                e.currentTarget.style.boxShadow = `0 12px 40px ${f.color}30, inset 0 0 0 1px ${f.color}20`;
                e.currentTarget.querySelector('.feature-icon-wrapper').style.transform = 'scale(1.1) rotate(5deg)';
                e.currentTarget.querySelector('.feature-arrow').style.transform = 'translateX(6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                e.currentTarget.querySelector('.feature-icon-wrapper').style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.querySelector('.feature-arrow').style.transform = 'translateX(0)';
              }}
              >
                {/* Tag */}
                {f.tag && (
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    padding: '6px 12px', borderRadius: '99px',
                    background: `${f.color}15`, border: `1px solid ${f.color}30`,
                    fontSize: '11px', fontWeight: '700', color: f.color,
                    letterSpacing: '0.04em', textTransform: 'uppercase'
                  }}>{f.tag}</div>
                )}
                {/* Hover gradient orb */}
                <div style={{
                  position: 'absolute', bottom: '-40px', right: '-40px',
                  width: '180px', height: '180px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${f.color}20, transparent 70%)`,
                  transition: 'opacity 0.3s', opacity: 1, pointerEvents: 'none'
                }} />
                <div className="feature-icon-wrapper" style={{
                  marginBottom: '28px', color: f.color,
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  border: `1px solid ${f.color}40`,
                  boxShadow: `0 8px 24px ${f.color}20`
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '8px' }}>{f.desc}</p>
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: f.color, fontWeight: '600' }}>
                  Explore <ChevronRight size={16} className="feature-arrow" style={{ transition: 'transform 0.3s ease' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*               LATEST JOB UPDATES                */}
      {/* ═══════════════════════════════════════════════ */}
      <JobUpdatesPreview />

      {/* ═══════════════════════════════════════════════ */}
      {/*              TRUSTED BY / LOGO STRIP            */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="logo-strip-section" style={{ padding: '48px 0 56px', position: 'relative', zIndex: 10, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Join <strong style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>70,000+ Developers</strong>
              <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
              Trusted with <strong style={{ color: 'var(--text-secondary)', fontWeight: 700, borderBottom: '1px dashed var(--border)', paddingBottom: '1px' }}>9,000+ app Installs</strong>
            </p>
          </div>
          <div className="logo-marquee-wrapper">
            <div className="logo-marquee-track">
              {[...Array(3)].flatMap((_, rep) =>
                [
                  { name: 'Stripe', slug: 'stripe', color: '635BFF' },
                  { name: 'Shopify', slug: 'shopify', color: '7AB55C' },
                  { name: 'Google', slug: 'google', color: '4285F4' },
                  { name: 'GitHub', slug: 'github', color: 'ffffff' },
                  { name: 'Uber', slug: 'uber', color: 'ffffff' },
                  { name: 'Meta', slug: 'meta', color: '0081FB' },
                  { name: 'Apple', slug: 'apple', color: 'ffffff' },
                  { name: 'Netflix', slug: 'netflix', color: 'E50914' },
                  { name: 'Spotify', slug: 'spotify', color: '1DB954' },
                  { name: 'Figma', slug: 'figma', color: 'F24E1E' },
                  { name: 'PayPal', slug: 'paypal', color: '00457C' },
                  { name: 'Tesla', slug: 'tesla', color: 'E82127' },
                  { name: 'Notion', slug: 'notion', color: 'ffffff' },
                  { name: 'Dropbox', slug: 'dropbox', color: '0061FF' },
                ].map((brand, i) => (
                  <div key={`${rep}-${i}`} className="logo-marquee-item" title={brand.name}>
                    <img
                      src={`https://cdn.simpleicons.org/${brand.slug}/${brand.color}`}
                      alt={brand.name}
                      loading="lazy"
                      style={{ height: '28px', width: 'auto', display: 'block' }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*                  PRICING PLANS                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="container" id="pricing" style={{ padding: 'clamp(64px, 10vw, 100px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', border: '1px solid var(--border)',
            borderRadius: '99px', fontSize: '12px', color: 'var(--text-secondary)',
            background: 'var(--accent-glow)', marginBottom: '20px',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600'
          }}>
            <Sparkles size={12} /> Pricing
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 7vw, 48px)', marginBottom: '24px', lineHeight: 1.1 }}>
            Pick the Path that <br />
            <span className="text-gradient">Gets You Hired Faster</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            AI-powered prep tailored to your timeline and career goals.
          </p>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.popular ? 'glow-effect' : ''}`}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                  background: '#6366f1', color: '#ffffff',
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800',
                  letterSpacing: '0.5px', boxShadow: '0 0 20px var(--accent-glow)',
                  zIndex: 10, border: '1px solid var(--border)', whiteSpace: 'nowrap'
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
              <Button asChild variant={plan.btnClass === 'btn-primary' ? 'default' : 'outline'} className="w-[calc(100%-3rem)] mx-auto mb-2" style={plan.btnClass !== 'btn-primary' ? { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' } : {}}>
                <Link to={(plan.name === 'Pro' || plan.name === 'Premium') && (!user || user.isGuest) ? '/login' : plan.btnLink}>{plan.btnText}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*                  TESTIMONIALS                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '40px', marginBottom: '16px', fontWeight: 'bold' }}>
              Developer <span style={{ color: '#fbbf24' }}>Success</span> Stories
            </h2>
            <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              Hear from tech professionals who have transformed their careers with Preploop.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', maxWidth: '1100px', margin: '0 auto', flexWrap: 'wrap' }}>
            {getVisibleTestimonials().map((index, i) => {
              const isCenter = i === 1;
              const testm = testimonials[index];
              return (
                <div key={index} style={{
                  flex: isCenter ? '1 1 400px' : '1 1 300px',
                  opacity: isCenter ? 1 : 0.4,
                  transform: isCenter ? 'scale(1)' : 'scale(0.9)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isCenter ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: isCenter ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border)',
                  boxShadow: isCenter ? '0 20px 40px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(139,92,246,0.1)' : 'none',
                  borderRadius: '24px',
                  padding: isCenter ? '40px' : '30px',
                  position: 'relative',
                  backdropFilter: 'blur(20px)',
                  zIndex: isCenter ? 10 : 1,
                  filter: isCenter ? 'none' : 'blur(2px)'
                }}>
                  {isCenter && (
                    <div style={{
                      position: 'absolute', top: '-1px', left: '10%', right: '10%', height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)'
                    }} />
                  )}
                  <Quote size={isCenter ? 32 : 24} style={{ color: isCenter ? '#a78bfa' : 'var(--zinc-600)', marginBottom: '20px', opacity: 0.5 }} />
                  <p style={{
                    fontSize: isCenter ? '18px' : '15px',
                    lineHeight: '1.6',
                    color: isCenter ? 'var(--text-primary)' : 'var(--zinc-400)',
                    marginBottom: '24px',
                    fontStyle: 'italic',
                    fontWeight: isCenter ? '500' : '400'
                  }}>
                    "{testm.text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={testm.avatar} alt={testm.name} loading="lazy" style={{
                      width: isCenter ? '48px' : '40px',
                      height: isCenter ? '48px' : '40px',
                      borderRadius: '50%',
                      border: isCenter ? '2px solid #a78bfa' : '1px solid var(--border)',
                      padding: '2px'
                    }} />
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px' }}>{testm.name}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--zinc-400)', margin: 0 }}>{testm.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
            <button onClick={prevTestimonial} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: 'var(--bg-card)', border: '1px solid var(--border)', 
              color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-card)'}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextTestimonial} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: 'var(--bg-card)', border: '1px solid var(--border)', 
              color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-card)'}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════════════════════════════════════════ */}
      {/*           COMMUNITY HUB SECTION                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', position: 'relative', zIndex: 10 }} id="community-hub">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', border: '1px solid var(--border)',
              borderRadius: '99px', fontSize: '12px', color: 'var(--text-secondary)',
              background: 'var(--accent-glow)', marginBottom: '20px',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600'
            }}>
              <Users size={12} /> Community Hub
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5.2vw, 36px)', marginBottom: '16px', fontWeight: 'bold' }}>
              Join Our <span className="text-gradient">Developer Network</span>
            </h2>
            <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              Connect, learn, and grow with a supportive community of engineers preparing for their next big role.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* Discord & Community CTA */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '20px',
              padding: '40px 32px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(124, 58, 237, 0.15) 100%)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)';
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#a78bfa" style={{ margin: '0 auto', marginBottom: '16px' }}>
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10h-6v2h6v-2zm0-4h-6v2h6V8z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
                Join Our Discord
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
                Connect with 5,000+ engineers
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>5K+</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>24/7</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                </div>
              </div>
              <a href="https://discord.gg/preploop" target="_blank" rel="noopener noreferrer" style={{
                display: 'block',
                width: '100%',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
              }} onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)'; e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'; }} onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)'; e.target.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)'; }}>
                Join Discord
              </a>
            </div>

            {/* Quick Links Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              gridColumn: 'span 1'
            }}>
              {/* Study Groups Link */}
              <Link to="/community" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                cursor: 'pointer'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}>
                <Users size={28} style={{ marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto', color: '#8b5cf6' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Study Groups</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>6 active</div>
              </Link>

              {/* Leaderboard Link */}
              <Link to="/community" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                cursor: 'pointer'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}>
                <Trophy size={28} style={{ marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto', color: '#fbbf24' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Leaderboard</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Top 100</div>
              </Link>

              {/* Events Link */}
              <Link to="/community" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                cursor: 'pointer'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}>
                <Calendar size={28} style={{ marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto', color: '#f472b6' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Events</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upcoming</div>
              </Link>

              {/* Discussions Link */}
              <Link to="/community" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                cursor: 'pointer'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}>
                <MessageSquare size={28} style={{ marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto', color: '#60a5fa' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Discussions</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active</div>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════ */}
      {/*                      FAQ                        */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="container" style={{ margin: '120px auto', position: 'relative', zIndex: 10, scrollMarginTop: '100px' }} id="faq">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '64px',
          alignItems: 'flex-start'
        }}>
          {/* Left Side: Header & CTA */}
          <div style={{ position: 'sticky', top: '120px', overflow: 'visible' }}>
            <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Questions</span> <br />
              <span style={{ color: 'var(--text-muted)' }}>& Answers</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '400px' }}>
              Find answers to commonly asked questions about our platform. Still need help?
            </p>
            <a href="mailto:support@preploop.me" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '99px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <Mail size={18} /> support@preploop.me
            </a>
            
            {/* Background 'FAQ' Watermark */}
            <div style={{
              position: 'absolute',
              top: '200px',
              left: '-20px',
              fontSize: 'clamp(120px, 15vw, 240px)',
              fontWeight: '900',
              background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              pointerEvents: 'none',
              zIndex: -1,
              userSelect: 'none',
              letterSpacing: '-0.05em',
              transform: 'rotate(-5deg)'
            }}>
              FAQ
            </div>
          </div>

          {/* Right Side: FAQ Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, i) => {
              const num = (i + 1).toString().padStart(2, '0');
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: `1px solid var(--border)`,
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isOpen ? '0 8px 32px rgba(139,92,246,0.1), inset 0 0 0 1px rgba(139,92,246,0.05)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }
                }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)', 
                      fontFamily: 'var(--font-mono, monospace)',
                      width: '28px'
                    }}>
                      {num}
                    </span>
                    <span style={{ 
                      flex: 1, 
                      fontSize: '18px', 
                      fontWeight: '500', 
                      lineHeight: '1.4',
                      color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {faq.q}
                    </span>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: isOpen ? 'var(--border)' : 'transparent',
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                      transition: 'all 0.3s ease'
                    }}>
                      <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                    </div>
                  </button>
                  <div style={{
                    maxHeight: isOpen ? '400px' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isOpen ? 1 : 0
                  }}>
                    <p style={{
                      padding: '0 20px 20px 72px',
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '16px',
                      lineHeight: '1.7'
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
