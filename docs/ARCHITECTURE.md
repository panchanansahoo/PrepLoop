# PrepLoop Architecture

## Monorepo Layout

- `frontend/`: React + Vite client application
- `backend/`: Express API and integrations
- `scripts/`: content generation and maintenance helpers
- `Company_Interview/`: raw interview datasets used by ingestion/feature flows

## Runtime Topology

### Frontend

- Runs on Vite dev server (`http://localhost:5173` by default).
- Uses Supabase client SDK directly for auth/session flows.
- Calls backend APIs through `VITE_API_URL`.

### Backend

- Runs on Express (`http://localhost:5000` by default, auto-retries next ports when occupied).
- Loads configuration from `backend/.env` via `backend/config/env.js`.
- Exposes health endpoint at `/health`.
- Serves grouped APIs under `/api/*`.

## Backend API Route Groups

Configured in `backend/index.js`:

- `/api/auth`
- `/api/dsa`
- `/api/practice`
- `/api/ai`
- `/api/user`
- `/api/resume`
- `/api/system-design`
- `/api/community`
- `/api/ai/coach`
- `/api/ai/interview`
- `/api/ai/interview/v2`
- `/api/contact`
- `/api/blog`
- `/api/activity`
- `/api/company-interview`
- `/api/payment`
- `/api/voice`
- `/api/notes`
- `/api/admin`
- `/api/jobs`  
  - Job search surface and Career Ops evaluation/history endpoints.

## Security and Platform Middleware

- `helmet` for secure defaults.
- CORS allow-list based on `FRONTEND_URL` plus local dev origins.
- JSON and URL-encoded payload limits (`10mb`).
- Rate limiting:
  - Global `/api/*` limiter.
  - Stricter `/api/auth` limiter to reduce brute-force risk.

## Data and External Services

### Supabase

- Backend uses Supabase for data operations via service and anon keys.
- Frontend uses Supabase browser client with public URL and anon key.

### Optional Integrations

- Groq for AI coaching/interview/content features.
- SMTP for auth/contact mail delivery.
- Razorpay for payment workflows.
- Deepgram/ElevenLabs for voice-related routes.
- RapidAPI/Adzuna for jobs aggregation.
- Supabase persistence for resume, interview, and Career Ops history.

## Local Development Flow

1. Install dependencies from root with `npm run install:all`.
2. Create env files from examples:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
3. Start both apps using `npm run dev`.
4. Validate server health at `/health` and UI at frontend origin.

## Quality Gates

From repo root:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run audit`

CI (`.github/workflows/ci.yml`) runs lint/test/build on pushes and pull requests, and runs production dependency audit on `main`/`master`.
