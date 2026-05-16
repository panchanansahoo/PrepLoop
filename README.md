## PrepLoop

PrepLoop is an AI-powered interview preparation platform combining realtime voice interviews, in-browser coding playgrounds, curated company question banks, and personalized coaching.

This repository is a monorepo containing frontend, backend, tooling, and docs used to run PrepLoop locally and in staging/production.

Contents
- `frontend/` — React + Vite web app
- `backend/` — Node.js + Express API server
- `discord-bot/` — Discord integration and moderation bot
- `docs/` — Architecture and API reference docs
- `scripts/` — Utility and smoke-test scripts
- `Company_Interview/` — Company-specific question datasets

Quick Start
1. Install dependencies:

```bash
npm run install:all
```

2. Create env files (see `backend/.env.template` and `frontend/.env.template`) and fill required keys.

3. Start dev servers (from repo root):

```bash
npm run dev
```

Useful scripts
- `npm run dev` — start frontend + backend locally (concurrently)
- `npm run lint` — run linters
- `npm test` — run test suites
- `npm run build --prefix frontend` — build frontend

Notes for contributors
- Backend is ESM (`"type": "module"`) — keep new `.js` modules ESM-compatible.
- Add new backend routes by following dynamic import patterns in `backend/index.js`.
- Frontend tests use Vitest; prefer `getByRole` selectors in tests.

Security & Data
- Uses Supabase Auth + Postgres with Row Level Security (RLS).
- Default transcript retention: 30 days; users may opt-in for research retention up to 12 months.

Support
- See `docs/ARCHITECTURE.md`, `docs/AI_FEATURES_API.md`, and `docs/DEPLOYMENT_CHECKLIST.md` for detailed operational guidance.

License
- MIT (please add LICENSE file if required)

---
_Last updated: 2026-05-16_
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

Reference files:

- `backend/.env.example`
- `frontend/.env.example`

### 3) Run the app (frontend + backend)

From root:
>>>>>>> 194857e3611815c67a2631090e2e4dd2b5d66421

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000` (or next free port)
- **Health Check**: `http://localhost:5000/health`

---

## 📜 Available Scripts

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
- `npm run discord:dev` - Starts bot in watch mode.
- `npm run discord:deploy` - Registers/Deploys slash commands.

---

## 🔌 API Overview

The backend exposes grouped routes under `/api`, protected by Helmet, rate limiting, and JWT-based authorization (`authenticateToken`).

<<<<<<< HEAD
- 🔐 **Auth**: `/api/auth` (Login, registration, token refreshes, email verification)
- 👩‍💻 **Practice**: `/api/dsa`, `/api/practice`, `/api/system-design`
- 🤖 **AI & Voice**: `/api/ai`, `/api/ai-features`, `/api/voice`, `/api/voice/realtime`
- 🏢 **Interviews**: `/api/company-interview`, `/api/interview-suite`
- 💬 **Community & Blog**: `/api/community`, `/api/blog`, `/api/contact`
- 💼 **Jobs & Payments**: `/api/jobs`, `/api/payment`
- 📊 **User & Tracking**: `/api/user`, `/api/activity`, `/api/notes`, `/api/resume`

---

## 📚 Extensive Documentation

Dive deeper into specific modules and guides available in the `docs/` folder:
=======
## Project Documentation

- Main docs index: `docs/README.md`
- System architecture: `docs/ARCHITECTURE.md`
- Backend API quick reference: `docs/BACKEND_API_QUICK_REFERENCE.md`
- **Security Guide**: `docs/SECURITY.md`
- **Performance Optimization**: `docs/PERFORMANCE.md`
- AI features API: `docs/AI_FEATURES_API.md`
- **AI Improvement Plan**: `docs/AI_IMPROVEMENT_PLAN.md`
- **Skill-Match Jobs**: `docs/SKILL_MATCH_JOBS.md`
- **Indian Job APIs**: `docs/INDIAN_JOB_APIS.md`
- Interview suite API: `docs/INTERVIEW_SUITE_API.md`
- Library API and admin guides:
  - `docs/LIBRARY_API.md`
  - `docs/ADMIN_LIBRARY_GUIDE.md`
- Email verification guide: `docs/EMAIL_VERIFICATION_GUIDE.md`
- Discord bot command spec: `docs/DISCORD_BOT_COMMAND_SPEC.md`
- Discord community blueprint: `docs/DISCORD_COMMUNITY_BLUEPRINT.md`
- Observability deployment quick guide: `QUICK_START.md`
- Changelog: `CHANGELOG.md`
- Contribution guide: `CONTRIBUTING.md`


- 🏗️ **[System Architecture](docs/ARCHITECTURE.md)**
- 🔒 **[Security Guide](docs/SECURITY.md)**
- ⚡ **[Performance Optimization](docs/PERFORMANCE.md)**
- 🤖 **[AI Features API](docs/AI_FEATURES_API.md)**
- 🗣️ **[Interview Suite API](docs/INTERVIEW_SUITE_API.md)**
- 🌐 **[Discord Community Blueprint](docs/DISCORD_COMMUNITY_BLUEPRINT.md)**

---

<<<<<<< HEAD
## 🛠 Troubleshooting
=======
## Discord Bot Commands

From repository root:

```bash
npm run discord:install
npm run discord:setup-env
npm run discord:bootstrap
npm run discord:dev
```

Additional commands:

- `npm run discord:start` - start bot without watch mode
- `npm run discord:deploy` - register/deploy slash commands
- `npm run discord:doctor` - environment and runtime diagnostics
- `npm run discord:check` - quick validation checks

## API Overview


- If port `5000` is occupied, the backend automatically retries on the next available port.
- Ensure CORS is correctly configured by matching `FRONTEND_URL` in the backend to your active frontend origin.
- Missing API keys (e.g., Groq, Razorpay) will safely disable their respective integrations without crashing the server.

<<<<<<< HEAD
---
=======
- `/api/auth`
- `/api/dsa`
- `/api/practice`
- `/api/ai`
- `/api/ai-features`
- `/api/improvement-plan`
- `/api/system-design`
- `/api/community`
- `/api/contact`
- `/api/blog`
- `/api/activity`
- `/api/company-interview`
- `/api/payment`
- `/api/voice`
- `/api/notes`
- `/api/admin`
- `/api/jobs`


<p align="center">
  Made with ❤️ by the PrepLoop Team.
</p>
