# PrepLoop

PrepLoop is a full-stack interview preparation platform that combines DSA practice, AI-powered coaching, system design preparation, coding playgrounds, company interview question banks, and progress tracking.

## Monorepo Structure

- `frontend/` - React + Vite app
- `backend/` - Node.js + Express API server
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

### 2) Configure environment variables

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

# Voice (optional)
ELEVENLABS_API_KEY=your_elevenlabs_key
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
