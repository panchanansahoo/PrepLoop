<div align="center">
  <h1>🚀 PrepLoop</h1>
  <p><strong>AI-Powered Interview Preparation Platform</strong></p>
  
  <p>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22.x-green.svg" alt="Node.js"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue.svg" alt="React"></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5-purple.svg" alt="Vite"></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth%20%7C%20DB-3ECF8E.svg" alt="Supabase"></a>
    <a href="#-support--license"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"></a>
  </p>
</div>

---

**PrepLoop** is a comprehensive, AI-driven platform tailored for modern interview preparation. We combine real-time voice interviews, in-browser coding playgrounds, curated company question banks, and personalized coaching to help candidates land their dream roles.

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [📂 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Setup](#️-environment-setup)
- [📜 Available Scripts](#-available-scripts)
- [🗺️ API Overview](#️-api-overview)
- [📚 Project Documentation](#-project-documentation)
- [🛠 Troubleshooting](#-troubleshooting)
- [🤝 Support & License](#-support--license)

---

## ✨ Key Features
- **🗣️ Realtime Voice Interviews**: Practice with AI via voice natively in the browser.
- **💻 Coding Playground**: In-browser execution for Data Structures, Algorithms, and System Design.
- **🏢 Company Datasets**: Curated questions for top tech companies.
- **🤖 Personalized Coaching**: Actionable feedback, improvement plans, and detailed transcript analysis.

## 📂 Project Structure
This repository is organized as a monorepo containing everything needed to run PrepLoop:

| Directory | Description |
| --------- | ----------- |
| 🌐 `frontend/` | React + Vite web application |
| ⚙️ `backend/` | Node.js + Express API server |
| 🤖 `discord-bot/`| Discord integration and moderation bot |
| 📖 `docs/` | Architecture and API reference documentation |
| 🛠 `scripts/` | Utility and smoke-test scripts |
| 🏢 `Company_Interview/` | Company-specific question datasets |

---

## 🚀 Quick Start

1. **Install dependencies** across the workspace:
   ```bash
   npm run install:all
   ```
2. **Setup environment variables** (see the [Environment Setup](#️-environment-setup) section below).
3. **Start the development servers**:
   ```bash
   npm run dev
   ```

### Accessing the Platform:
- 🎨 **Frontend**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend**: [http://localhost:5000](http://localhost:5000) *(or the next available port)*
- 🩺 **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## ⚙️ Environment Setup

### 1. Backend Config (`backend/.env`)
Create a `.env` file in the `backend/` directory using `backend/.env.example` as a reference:

```env
# Core
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret

# AI & Voice Features (Optional)
GROQ_API_KEY=your_groq_key             # Disables AI features if missing
DEEPGRAM_API_KEY=your_deepgram_key     # Voice transcription

# Integrations (Optional)
REDIS_URL=redis://localhost:6379       # Falls back to node-cache if missing
RAPIDAPI_KEY=your_rapidapi_key         # Jobs API
ADZUNA_APP_ID=your_adzuna_app_id       # Jobs API
ADZUNA_APP_KEY=your_adzuna_app_key     # Jobs API
RAZORPAY_KEY_ID=your_razorpay_key_id   # Payments
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Database Migrations (Optional)
SUPABASE_DB_PASSWORD=your_supabase_db_password
SUPABASE_KEY=your_supabase_key

# Usage guardrails
AI_DAILY_REQUEST_LIMIT=100
VOICE_DAILY_REQUEST_LIMIT=60
PRO_AI_DAILY_REQUEST_LIMIT=500
PRO_VOICE_DAILY_REQUEST_LIMIT=300
PREMIUM_AI_DAILY_REQUEST_LIMIT=2000
PREMIUM_VOICE_DAILY_REQUEST_LIMIT=1200
```

### 2. Frontend Config (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **💡 Security Note:** We use Supabase Auth + Postgres with Row Level Security (RLS). Missing keys for optional features (like Groq or Razorpay) will gracefully disable the feature without crashing your server.

The backend issues HttpOnly session cookies for legacy email/password authentication. Keep
`FRONTEND_URL` and the production frontend origin in the CORS allowlist when deploying the
frontend and API on separate origins. Apply `backend/db/migration_usage_quotas.sql` before
enabling persistent AI and voice limits in production.

Authenticated AI and voice limits use `profiles.subscription_tier` (`free`, `pro`, or
`premium`) and cache the tier for five minutes. Runtime request latency, slow requests,
provider fallbacks, cache activity, and errors are available from the protected
`/api/monitoring-enhanced` endpoint for dashboard or alert integration.

Frontend CI runs Playwright accessibility checks with axe-core against the public routes
and verifies that those routes do not horizontally overflow at a mobile viewport.

Cookie-authenticated mutations are protected by the double-submit CSRF token at
`/api/csrf-token`. The frontend fetch helper obtains this token automatically. Configure
Redis with `REDIS_URL` in multi-instance production deployments so anonymous quota
guardrails are shared across backend replicas; authenticated quotas use the Supabase RPC.
Run `cleanup_interview_retention` through a scheduled service-role job to remove expired
checkpoints and idempotency keys.

The repository includes a scheduled GitHub Actions workflow at
`.github/workflows/maintenance-retention.yml`. Configure `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` repository secrets before enabling
scheduled maintenance. Monitoring responses include an `alerts` summary controlled by
`MONITORING_ERROR_RATE_THRESHOLD` and `MONITORING_P95_MS_THRESHOLD`.

---

## 📜 Available Scripts

### Workspace Commands
| Command | Action |
| ------- | ------ |
| `npm run dev` | Starts frontend & backend concurrently. |
| `npm run install:all` | Installs all workspace dependencies. |
| `npm run setup:env` | Creates missing `.env` files from templates. |
| `npm run verify:setup` | Validates required env files/keys. |
| `npm run lint` | Runs linters across frontend and backend. |
| `npm run test` | Runs the full test suite (Vitest/Jest). |
| `npm run build` | Builds the frontend for production. |
| `npm run check:bundle --prefix frontend` | Verifies the generated frontend asset size budget. |

### Supported deployment targets

The supported production path is **Vercel for the frontend**, **Render or an equivalent
Node 22 service for the backend**, and **Supabase for Auth/Postgres**. The deployment
workflow validates frontend tests, the production build, the asset budget, and public-route
Playwright smoke tests before deployment. Keep other provider manifests for reference only
unless they are actively maintained and monitored.

### Discord Bot Commands (`discord-bot/`)
| Command | Action |
| ------- | ------ |
| `npm run discord:install` | Installs bot dependencies. |
| `npm run discord:dev` | Starts bot in watch mode. |
| `npm run discord:deploy` | Registers/Deploys slash commands. |
| `npm run discord:doctor` | Environment and runtime diagnostics. |

---

## 🗺️ API Overview
The backend exposes modular, domain-driven routes under `/api`, protected by **Helmet**, **Rate Limiting**, and **JWT** (`authenticateToken`).

<details>
<summary><b>Click to expand the API Route map</b></summary>

- 🔐 **Auth & Users**: `/api/auth`, `/api/user`, `/api/activity`, `/api/admin`
- 🧠 **Interview Prep**: `/api/dsa`, `/api/system-design`, `/api/practice`, `/api/company-interview`, `/api/interview-suite`, `/api/real-interview`
- 🤖 **AI Coaching**: `/api/ai`, `/api/ai-features`, `/api/coach`, `/api/copilot`, `/api/improvement-plan`
- 🎙️ **Specialized Interviews**: `/api/voice`, `/api/hr`, `/api/fresher-interview`
- 💼 **Career Tools**: `/api/resume`, `/api/portfolio`, `/api/jobs`, `/api/career-analytics`
- 👥 **Community**: `/api/community`, `/api/chat`, `/api/contests`, `/api/blog`
- ⚙️ **System & Monitization**: `/api/payment`, `/api/coins`, `/api/monitoring-enhanced`

</details>

---

## 📚 Project Documentation

Explore our dedicated docs directory for deep dives into specific implementations:
- 📖 **[Main Docs Index](docs/README.md)**

---

## 🛠 Troubleshooting

- 🔴 **Port 5000 is occupied**: The backend will automatically retry on the next available port (e.g., 5001).
- 🔴 **CORS Errors**: Ensure your `FRONTEND_URL` environment variable matches your active frontend origin (e.g., `http://localhost:5173`).
- 🔴 **AI Features failing**: Double check your `GROQ_API_KEY` or `DEEPGRAM_API_KEY`. If missing, the features cleanly disable themselves.
- 🔴 **ESM Issues**: The backend uses ECMAScript Modules (`"type": "module"`). Ensure new backend files have `.js` extensions and use `import`/`export`.

---

## 🤝 Support & License

- **Support**: Have a question or issue? Reach out on our Discord community or open an issue on the repository!
- **License**: Released under the **MIT License**.

<br />

<p align="center">
  <b>Made with ❤️ by the PrepLoop Team.</b><br />
  <i>Empowering candidates to ace every interview.</i>
</p>
