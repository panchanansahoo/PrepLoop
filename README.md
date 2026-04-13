# PrepLoop

PrepLoop is a full-stack interview preparation platform that combines DSA practice, AI-powered coaching, system design preparation, coding playgrounds, company interview question banks, and progress tracking.

## Monorepo Structure

- `frontend/` - React + Vite app
- `backend/` - Node.js + Express API server
- `discord-bot/` - community bot (commands, onboarding, moderation helpers)
- `docs/` - architecture and API references
- `scripts/` - content/data generation helpers
- `Company_Interview/` - company-specific interview datasets
- `Dsa_pattern/` - DSA pattern resources

## Core Features

- DSA problem practice and editor workflows
- AI coaching and interview simulation endpoints
- System design preparation modules
- Community/blog/contact flows
- Notes, activity tracking, and user profile APIs
- Job updates integration
- Payment integration (Razorpay)
- Voice-related routes/services

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router
- Tailwind CSS
- Mantine
- React Flow
- Supabase JS SDK

### Backend

- Node.js (ES Modules)
- Express
- Supabase
- PostgreSQL (`pg`)
- Groq SDK
- Nodemailer
- Razorpay

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project
- (Optional) Groq API key for AI features
- (Optional) Razorpay keys for payments

## Getting Started

### 1) Install dependencies

From the repository root:

```bash
npm run install:all
```

Bootstrap env files and verify setup:

```bash
npm run setup
```

### 2) Configure environment variables

Copy example files first:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Then update values as needed.

Validate setup before starting:

```bash
npm run verify:setup
```

Advanced validation examples:

```bash
# Require specific integration keys
node scripts/verifySetup.js --require=GROQ_API_KEY,RAZORPAY_KEY_ID

# Require all known keys (strict mode)
npm run verify:setup:strict
```

If env files do not exist yet:

```bash
npm run setup:env
```

Create `backend/.env`:

```env
# App
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI
GROQ_API_KEY=your_groq_api_key

# Email (optional, used by auth/contact flows)
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# CAPTCHA (optional)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret

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

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000` (or next free port if 5000 is busy)
- Health check: `http://localhost:5000/health`

## Available Scripts

### Root

- `npm run dev` - starts frontend and backend concurrently
- `npm run start` - alias for `dev`
- `npm run install:all` - installs dependencies across root, backend, and frontend
- `npm run setup:env` - creates missing `backend/.env` and `frontend/.env` from templates
- `npm run setup` - runs setup bootstrap and env verification in one command
- `npm run verify:setup` - validates required env files/keys for local setup
- `npm run verify:setup:strict` - enforces all known env keys as required
- `npm run lint` - runs backend + frontend lint checks
- `npm run test` - runs backend + frontend tests
- `npm run build` - builds frontend for production
- `npm run audit` - audits production dependencies in backend and frontend

### Frontend (`frontend/`)

- `npm run dev` - Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - lint frontend
- `npm run test` - run tests once (Vitest)
- `npm run test:watch` - watch mode tests

### Backend (`backend/`)

- `npm run dev` - run backend with file watching
- `npm run start` - run backend normally
- `npm run setup` - project setup script
- `npm run lint` - syntax checks for key backend entry scripts
- `npm run test` - startup/import smoke verification
- `node backend/diagnose.js` - diagnostic route/module check (non-server mode)
- `node backend/diagnose.js --start` - run diagnostics and then boot server

## Project Documentation

- Main docs index: `docs/README.md`
- System architecture: `docs/ARCHITECTURE.md`
- Backend API quick reference: `docs/BACKEND_API_QUICK_REFERENCE.md`
- AI features API: `docs/AI_FEATURES_API.md`
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

## Architecture

- System architecture overview: `docs/ARCHITECTURE.md`
- Documentation index: `docs/README.md`

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

The backend exposes grouped routes under `/api`, including:

- `/api/auth`
- `/api/dsa`
- `/api/practice`
- `/api/ai`
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

## Troubleshooting

- If `5000` is occupied, the backend retries on the next available ports automatically.
- Confirm CORS by setting `FRONTEND_URL` to your active frontend origin.
- For AI, payment, voice, and jobs features, missing API keys will disable those integrations.

## License

No license file is currently defined in this repository. Add a `LICENSE` file if you plan to distribute this project publicly.
