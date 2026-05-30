## PrepLoop

PrepLoop is an AI-powered interview preparation platform combining realtime voice interviews, in-browser coding playgrounds, curated company question banks, and personalized coaching.

This repository is a monorepo containing frontend, backend, tooling, and docs used to run PrepLoop locally and in staging/production.

### Contents
- `frontend/` — React + Vite web app
- `backend/` — Node.js + Express API server
- `discord-bot/` — Discord integration and moderation bot
- `docs/` — Architecture and API reference docs
- `scripts/` — Utility and smoke-test scripts
- `Company_Interview/` — Company-specific question datasets

### Quick Start
1. Install dependencies:

```bash
npm run install:all
```

2. Create env files (see `backend/.env.template` and `frontend/.env.template`) and fill required keys.

3. Start dev servers (from repo root):

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000` (or next free port)
- **Health Check**: `http://localhost:5000/health`

### Useful Scripts
- `npm run dev` — start frontend + backend locally (concurrently)
- `npm run lint` — run linters
- `npm test` — run test suites
- `npm run build --prefix frontend` — build frontend

### Notes for Contributors
- Backend is ESM (`"type": "module"`) — keep new `.js` modules ESM-compatible.
- Add new backend routes by following dynamic import patterns in `backend/index.js`.
- Frontend tests use Vitest; prefer `getByRole` selectors in tests.

### Environment Setup

Create `backend/.env` (reference: `backend/.env.template`):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret

# Redis (optional — falls back to node-cache)
REDIS_URL=redis://localhost:6379

# Groq AI (optional — disables AI features if missing)
GROQ_API_KEY=your_groq_key

# Voice (optional — Kokoro TTS runs locally, no key needed)
DEEPGRAM_API_KEY=your_deepgram_key

# Jobs integrations (optional)
RAPIDAPI_KEY=your_rapidapi_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Payments (optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Migration utility (optional)
SUPABASE_DB_PASSWORD=your_supabase_db_password
SUPABASE_KEY=your_supabase_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Security & Data
- Uses Supabase Auth + Postgres with Row Level Security (RLS).
- Default transcript retention: 30 days; users may opt-in for research retention up to 12 months.
- Missing API keys (e.g., Groq, Razorpay) will safely disable their respective integrations without crashing the server.

### Support
- See `docs/ARCHITECTURE.md`, `docs/AI_FEATURES_API.md`, and `docs/DEPLOYMENT_CHECKLIST.md` for detailed operational guidance.

### License
- MIT (please add LICENSE file if required)

---

## Available Scripts

### Root Commands
- `npm run dev` or `start` - Starts frontend and backend concurrently.
- `npm run install:all` - Installs all workspace dependencies.
- `npm run setup:env` - Creates missing `.env` files from templates.
- `npm run verify:setup` - Validates required env files/keys.
- `npm run lint` - Runs backend + frontend lint checks.
- `npm run test` - Runs backend + frontend tests.
- `npm run build` - Builds frontend for production.

### Discord Bot (`discord-bot/`)
- `npm run discord:install` - Installs bot dependencies.
- `npm run discord:setup-env` - Sets up bot environment.
- `npm run discord:bootstrap` - Bootstraps bot configuration.
- `npm run discord:dev` - Starts bot in watch mode.
- `npm run discord:start` - Starts bot without watch mode.
- `npm run discord:deploy` - Registers/Deploys slash commands.
- `npm run discord:doctor` - Environment and runtime diagnostics.
- `npm run discord:check` - Quick validation checks.

---

## API Overview

The backend exposes grouped routes under `/api`, protected by Helmet, rate limiting, and JWT-based authorization (`authenticateToken`).

- `/api/auth` - Login, registration, token refreshes, email verification
- `/api/dsa` - DSA coding problems
- `/api/practice` - Practice sessions
- `/api/system-design` - System design interviews
- `/api/ai` - AI features
- `/api/ai-features` - AI-powered coaching
- `/api/improvement-plan` - Improvement plans
- `/api/voice` - Voice interviews
- `/api/company-interview` - Company-specific interview prep
- `/api/interview-suite` - Full interview suite
- `/api/community` - Community features
- `/api/blog` - Blog and content
- `/api/contact` - Contact form
- `/api/jobs` - Job search
- `/api/payment` - Payments (Razorpay)
- `/api/user` - User profile and settings
- `/api/activity` - User activity tracking
- `/api/notes` - User notes
- `/api/resume` - Resume management
- `/api/admin` - Admin operations
- `/api/analytics` - Analytics
- `/api/feedback` - User feedback
- `/api/coins` - Coin economy
- `/api/library` - Learning library
- `/api/portfolio` - Portfolio builder
- `/api/career-analytics` - Career tracking and insights
- `/api/schedule` - Interview scheduling
- `/api/coach` - AI coaching
- `/api/copilot` - AI copilot
- `/api/fresher-interview` - Fresher-specific interviews
- `/api/hr` - HR interview prep
- `/api/real-interview` - Real interview simulations
- `/api/contests` - Coding contests
- `/api/chat` - Chat functionality
- `/api/monitoring-enhanced` - Enhanced monitoring

---

## Project Documentation

- Main docs index: `docs/README.md`
- System architecture: `docs/ARCHITECTURE.md`
- Backend API quick reference: `docs/BACKEND_API_QUICK_REFERENCE.md`
- Security Guide: `docs/SECURITY.md`
- Performance Optimization: `docs/PERFORMANCE.md`
- AI Features API: `docs/AI_FEATURES_API.md`
- AI Improvement Plan: `docs/AI_IMPROVEMENT_PLAN.md`
- Skill-Match Jobs: `docs/SKILL_MATCH_JOBS.md`
- Indian Job APIs: `docs/INDIAN_JOB_APIS.md`
- Interview Suite API: `docs/INTERVIEW_SUITE_API.md`
- Library API: `docs/LIBRARY_API.md`
- Admin Library Guide: `docs/ADMIN_LIBRARY_GUIDE.md`
- Email Verification Guide: `docs/EMAIL_VERIFICATION_GUIDE.md`
- Discord Bot Command Spec: `docs/DISCORD_BOT_COMMAND_SPEC.md`
- Discord Community Blueprint: `docs/DISCORD_COMMUNITY_BLUEPRINT.md`
- Observability Deployment: `docs/QUICK_START.md`
- Changelog: `CHANGELOG.md`
- Contribution Guide: `CONTRIBUTING.md`

---

## Troubleshooting

- If port `5000` is occupied, the backend automatically retries on the next available port.
- Ensure CORS is correctly configured by matching `FRONTEND_URL` in the backend to your active frontend origin.
- Missing API keys (e.g., Groq, Razorpay) will safely disable their respective integrations without crashing the server.

---

<p align="center">
  Made with ❤️ by the PrepLoop Team.
</p>
