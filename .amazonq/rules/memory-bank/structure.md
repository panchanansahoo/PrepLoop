# PrepLoop - Project Structure

## Monorepo Layout

```
Preploop/
├── frontend/          # React 18 + Vite 5 SPA
├── backend/           # Node.js + Express API server
├── discord-bot/       # Discord.js community bot
├── workers/           # Cloudflare Workers (email-service-worker)
├── docs/              # Architecture and API references
├── scripts/           # Root-level dev/ops utilities
├── Company_Interview/ # Company-specific interview CSV/XLSX datasets
├── Dsa_pattern/       # DSA pattern resources (Excel)
├── infra/             # Azure Bicep IaC templates
├── k8s/               # Kubernetes deployment manifests
├── docker/            # Nginx config for containerized deployment
├── supabase/          # Supabase CLI config and branch state
└── voices/            # Kokoro TTS voice model binaries (.bin)
```

## Frontend (`frontend/src/`)

```
src/
├── api/               # Axios-based API service modules (aiService, libraryService, portfolioService, client)
├── assets/            # Static assets (logo.svg)
├── components/        # Reusable UI components
│   ├── AIFeatures/    # AI hub, code review, interview, analytics components
│   ├── CodeReview/    # Code review display and submission
│   ├── editor/        # Notion-style editor, DSA toolbar, test case panel (TipTap-based)
│   ├── interview/     # AI avatar, chat sidebar, controls, workspace, live captions
│   ├── portfolio/     # Import, review, template selector, publish steps
│   ├── solver/        # Hints panel
│   ├── sql/           # Schema viewer, SQL results panel
│   ├── ui/            # Primitive UI components (button)
│   └── visualizer/    # Array and graph visualizers
├── context/           # React Context providers (AuthContext, CoinContext, ThemeContext)
├── data/              # Static data files: DSA patterns, problems, roadmaps, company questions, themes
├── features/          # Feature-scoped modules
│   ├── dashboard/     # Roadmap view component
│   └── problemExplorer/ # Problem filtering, pattern views, leaderboard, notes modal
├── hooks/             # Custom React hooks
│   ├── useAudioVisualizer.js
│   ├── useRealtimeInterview.js
│   ├── useVoiceAI.js
│   ├── useWebSocket.js
│   ├── useRealTimeJobs.js
│   └── useImprovementPlan.js
├── lib/               # Third-party client setup (supabase.js)
├── pages/             # Route-level page components (80+ pages)
├── styles/            # Global/page-level CSS overrides
├── test/              # Vitest setup and test utilities
├── types/             # TypeScript type definitions (index.ts)
├── utils/             # Frontend utilities (apiClient, authHeaders, lazyLoad, sanitize, wsManager)
├── App.jsx            # Root component with router and layout
└── main.jsx           # Vite entry point
```

## Backend (`backend/`)

```
backend/
├── config/            # App configuration (CORS, DB pool, Redis, env validation)
├── data/              # Static data: DSA problems, learning paths, interview problem bank
├── db/                # Supabase client, schema SQL, migration SQL files, seed scripts
├── middleware/        # Express middleware (auth, rate limiter, error handler, sanitization, monitoring)
├── routes/            # Express route handlers (30+ route files, one per domain)
├── services/          # Business logic services
│   ├── aiService.js                    # Groq LLM integration
│   ├── interviewStateMachine.js        # Interview flow state management
│   ├── interviewScoringService.js      # Scoring rubrics and evaluation
│   ├── interviewFollowUpRulesService.js # Follow-up question rules engine
│   ├── interviewConversationService.js # Conversation orchestration
│   ├── interviewPromptService.js       # Prompt construction
│   ├── interviewTelemetryService.js    # Interview analytics/telemetry
│   ├── voiceService.js                 # TTS/STT pipeline (Kokoro, Deepgram, Groq)
│   ├── realtimeInterviewService.js     # WebSocket real-time bridge
│   ├── improvementPlanService.js       # AI improvement plan generation
│   ├── portfolioGithubService.js       # GitHub data import
│   ├── portfolioLinkedinService.js     # LinkedIn data import
│   └── websocketManager.js             # WebSocket connection management
├── utils/             # Backend utilities (aiClient, cache, coinTransactions, emailVerification, metrics)
├── scripts/           # Migration scripts, smoke tests, integration tests
├── voices/            # Kokoro TTS voice model binaries
└── index.js           # Express app entry point
```

## Key Architectural Patterns

### Frontend Architecture
- **React Router v6** with lazy-loaded routes via `lazyLoad.js` / `lazyWithRecovery.js`
- **Context + Hooks** pattern: global state via AuthContext/CoinContext/ThemeContext, feature state via custom hooks
- **Feature-scoped modules** in `features/` for complex domains (problemExplorer)
- **Co-located tests**: `.test.jsx` / `.test.js` files alongside source files
- **API layer separation**: `src/api/` for service calls, `src/utils/apiClient.js` for Axios instance

### Backend Architecture
- **ES Modules** throughout (`"type": "module"` in package.json)
- **Route → Service → Util** layering: routes handle HTTP, services contain business logic, utils are shared helpers
- **Supabase** as primary database (PostgreSQL with RLS), accessed via `@supabase/supabase-js`
- **Redis** for caching (node-cache + redis client with Upstash support)
- **State Machine pattern** for interview flow (`interviewStateMachine.js`)
- **WebSocket** for real-time interview and job update streams

### Data Flow
```
Frontend (React) → Axios (src/utils/apiClient.js) → Backend Express Routes
                                                    → Services (business logic)
                                                    → Supabase (PostgreSQL)
                                                    → Redis (cache)
                                                    → Groq/Kokoro/Deepgram (AI/Voice)
```

### Deployment
- **Frontend**: Vercel (via `vercel.json`, GitHub Actions `deploy-frontend-vercel.yml`)
- **Backend**: Azure App Service (via `azure.yaml`, Bicep IaC in `infra/`, GitHub Actions `deploy-backend-azure.yml`)
- **Discord Bot**: Standalone Node.js process
- **Email Worker**: Cloudflare Workers (`workers/email-service-worker/`)
- **Containerization**: Docker + docker-compose for local dev; Kubernetes manifests in `k8s/`
