# 🚀 PrepLoop
> The modern, full-stack tech interview preparation platform featuring AI-powered coaching and realistic interview simulations.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Node](https://img.shields.io/badge/Node.js-ES_Modules-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue)
![Azure](https://img.shields.io/badge/Azure-App_Service-blue)

PrepLoop empowers job seekers in the tech industry with a unified, intelligent platform that seamlessly bridges the gap between raw technical practice (DSA/System Design) and actual interview execution. PrepLoop acts as your personal AI interviewer, coding environment, progress tracker, and community hub.

---
=======
- `frontend/` - React + Vite app
- `backend/` - Node.js + Express API server
- `discord-bot/` - community bot (commands, onboarding, moderation helpers)
- `docs/` - architecture and API references
- `scripts/` - content/data generation helpers
- `Company_Interview/` - company-specific interview datasets
- `Dsa_pattern/` - DSA pattern resources


## ✨ Core Features

<<<<<<< HEAD
### 🧠 Type-Aware AI Interview Simulations
- **Dynamic Scenarios**: Covering DSA, System Design, Behavioral, and HR interviews.
- **Experience-Based Scoring**: Custom rubrics for candidates ranging from Fresher to Experienced.
- **Low-Latency Voice Interactions**: High-performance TTS/STT pipelines using Kokoro (local), Deepgram, and Groq with intelligent provider fallback to maintain sub-800ms latency.
- **Silence & Nuance Detection**: Naturally handles user pauses and interruptions.
=======
- DSA problem practice and editor workflows
- AI coaching and interview simulation endpoints
- **AI Interview Improvement Plans** - Personalized improvement plans based on interview performance
- **Skill-Match Live Job Recommendations** - Real-time job matching based on user skills with auto-refresh
- System design preparation modules
- Community/blog/contact flows
- Notes, activity tracking, and user profile APIs
- Job updates integration
- Payment integration (Razorpay)
- Voice-related routes/services


### 💻 Technical Practice Workflows
- **DSA Playgrounds**: In-browser coding environments with syntax highlighting, execution, and test cases validation.
- **System Design Modules**: Interactive guides and canvases to practice distributed system architecture.
- **Company-Specific Question Banks**: Datasets containing frequently asked questions segmented by top tech companies.

### 📈 AI Improvement Plans & Progress Tracking
- **Personalized Coaching**: Actionable improvement plans based on interview performance.
- **Activity Tracking**: Dashboard displaying completed modules, interview scores, and consistency streaks.
- **Skill-Match Live Job Recommendations**: Real-time job matching based on user skills.

### 🛡️ Enterprise-Grade Security
- **Hardened Infrastructure**: Redis authentication, non-root Docker containers, and robust security middleware.
- **Supabase Auth & RLS**: Secure signup/login with custom SMTP email verification flows and Row Level Security.

---

## 🏗️ Monorepo Architecture

The project is structured as a monorepo containing multiple distinct services and directories:

- 📁 `frontend/` - React + Vite application
- 📁 `backend/` - Node.js + Express API server
- 📁 `discord-bot/` - Community bot (commands, onboarding, moderation helpers)
- 📁 `docs/` - Architecture and API references
- 📁 `scripts/` - Content/data generation helpers
- 📁 `Company_Interview/` - Company-specific interview datasets
- 📁 `Dsa_pattern/` - DSA pattern resources

---

## 🛠️ Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite 5, React Router, Tailwind CSS, Mantine UI, React Flow, Supabase JS |
| **Backend** | Node.js (ES Modules), Express, Supabase (PostgreSQL), Redis, Nodemailer, Razorpay |
| **AI & Voice Layer** | Groq SDK (LLMs), Kokoro & Deepgram (TTS/STT), WebSocket Realtime Bridge |
| **Integrations** | RapidAPI, Adzuna (Jobs), Brevo (SMTP) |
| **Deployment** | Azure App Service |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project
- Redis (Running locally or via Docker)
- (Optional) Groq API key for AI features
- (Optional) Deepgram API key for Voice fallbacks
- (Optional) Razorpay keys for payments

### 1) Install Dependencies

From the repository root:

```bash
npm run install:all
```

Bootstrap env files and verify setup:

```bash
npm run setup
```

### 2) Environment Configuration

Generate or copy environment files:

```bash
npm run setup:env
```

#### `backend/.env`
```env
# App
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173 # Use https://preploop.me for production

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI & Voice
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_key # Optional — Kokoro TTS runs locally

# Integrations (Optional)
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
RAZORPAY_KEY_ID=your_razorpay_key_id
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000 # Use dynamic URL (e.g., https://api.preploop.me) for production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Validate setup before starting:

```bash
npm run verify:setup
```

### 3) Run the Application

<<<<<<< HEAD
From root, start both the frontend and backend concurrently:
=======
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
