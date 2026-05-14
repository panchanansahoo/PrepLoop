# PrepLoop - Product Overview

## Purpose & Value Proposition

PrepLoop is a full-stack tech interview preparation platform that bridges the gap between raw technical practice and actual interview execution. It acts as a personal AI interviewer, coding environment, progress tracker, and community hub for job seekers in the tech industry.

## Target Users

- **Freshers**: Entry-level candidates preparing for their first tech job
- **Experienced Engineers**: Professionals targeting senior/staff roles at top tech companies
- **Career Switchers**: Individuals transitioning into software engineering roles

## Core Features

### AI Interview Simulations
- Dynamic interview scenarios: DSA, System Design, Behavioral, and HR rounds
- Experience-based scoring with custom rubrics (Fresher → Experienced)
- Low-latency voice interactions via Kokoro (local TTS), Deepgram, and Groq with intelligent provider fallback targeting sub-800ms latency
- Silence and nuance detection for natural conversation flow
- Real-time WebSocket-based interview bridge

### Technical Practice Workflows
- **DSA Playgrounds**: In-browser coding environments with syntax highlighting, execution, and test case validation
- **System Design Modules**: Interactive guides and React Flow canvases for distributed system architecture
- **Company-Specific Question Banks**: Datasets for Adobe, Airbnb, Amazon, Apple, Google, Meta, Netflix, Nvidia, OpenAI, Uber, and more

### AI Improvement Plans & Progress Tracking
- Personalized coaching plans generated from interview performance analysis
- Activity dashboard: completed modules, interview scores, consistency streaks
- Skill-Match Live Job Recommendations with real-time matching and auto-refresh
- Integration with Adzuna and RapidAPI for Indian and global job listings

### Community & Content
- Blog platform with admin management
- Community discussion boards with likes
- Discord bot integration for community engagement, daily posts, and onboarding
- Notes system for personal study tracking

### Portfolio Generator
- GitHub and LinkedIn data import
- Resume parsing (PDF)
- Portfolio rendering and publishing with short links

### Payments & Monetization
- Razorpay payment integration
- Coin/credit system with atomic transactions and streak rewards

### Security & Infrastructure
- Supabase Auth with Row Level Security (RLS)
- Custom SMTP email verification flows (Brevo/Nodemailer)
- Redis caching with authentication
- Helmet, rate limiting, and sanitization middleware
- Non-root Docker containers
- Azure App Service deployment with CI/CD via GitHub Actions

## Key Differentiators

1. **Voice-first AI interviews** with multiple TTS/STT provider fallback
2. **Company-specific question banks** with curated datasets
3. **Unified platform** — practice, simulate, track, and apply in one place
4. **Monorepo architecture** enabling coordinated frontend/backend/bot development
