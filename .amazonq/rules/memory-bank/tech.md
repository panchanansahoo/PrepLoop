# PrepLoop - Technology Stack

## Programming Languages & Runtimes

- **JavaScript (ES Modules)**: Primary language for frontend and backend
- **Node.js 22.x**: Backend runtime (specified in engines field)
- **TypeScript**: Limited usage for type definitions (`frontend/src/types/index.ts`)

## Frontend Stack

### Core Framework
- **React 18.2.0**: UI library with hooks and context
- **Vite 5.1.0**: Build tool and dev server
- **React Router DOM 6.22.0**: Client-side routing

### UI Libraries & Components
- **Mantine 8.3.15**: Component library (`@mantine/core`, `@mantine/hooks`)
- **Tailwind CSS 4.1.18**: Utility-first CSS framework
- **Lucide React 0.323.0**: Icon library
- **React Flow 11.11.4**: Node-based graph visualization (system design diagrams)
- **React Three Fiber 8.18.0** + **Drei 9.122.0**: 3D graphics (Three.js wrapper)

### Rich Text Editors
- **TipTap 3.19.0**: Headless editor framework (core, react, starter-kit, extensions)
- **BlockNote 0.46.2**: Notion-style block editor (`@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`)
- **Monaco Editor 4.7.0**: Code editor (`@monaco-editor/react`)

### Data & State Management
- **Supabase JS 2.95.3**: PostgreSQL client and auth
- **Axios 1.6.7**: HTTP client
- **React Context API**: Global state (AuthContext, CoinContext, ThemeContext)

### Testing
- **Vitest 4.0.18**: Unit test runner
- **Playwright 1.59.1**: E2E testing
- **Testing Library**: React testing utilities (`@testing-library/react`, `@testing-library/jest-dom`)

### Build & Dev Tools
- **ESLint 9.22.0**: Linting with `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- **Prettier 3.8.1**: Code formatting
- **PostCSS 8.5.6** + **Autoprefixer 10.4.24**: CSS processing
- **Rollup Plugin Visualizer 7.0.1**: Bundle analysis

## Backend Stack

### Core Framework
- **Express 4.21.2**: Web framework
- **Node.js ES Modules**: `"type": "module"` in package.json

### Database & Caching
- **Supabase JS 2.95.3**: PostgreSQL client (Supabase-hosted)
- **pg 8.18.0**: PostgreSQL driver
- **Redis 5.12.1**: Caching and session storage
- **Upstash Redis 1.37.0**: Serverless Redis client
- **node-cache 5.1.2**: In-memory caching

### AI & Voice Services
- **Groq SDK 0.37.0**: LLM API client (Llama models)
- **Google GenAI 1.50.1**: Gemini API client
- **Kokoro JS 1.2.1**: Local TTS engine (voice model binaries in `voices/`)
- **node-edge-tts 1.2.10**: Microsoft Edge TTS fallback
- **WebSocket (ws 8.20.0)**: Real-time communication

### Security & Middleware
- **Helmet 7.2.0**: Security headers
- **CORS 2.8.5**: Cross-origin resource sharing
- **express-rate-limit 7.5.1**: Rate limiting
- **express-validator 7.0.1**: Input validation
- **bcryptjs 3.0.3**: Password hashing
- **jsonwebtoken 9.0.3**: JWT authentication
- **Joi 18.1.2**: Schema validation
- **ajv 8.12.0** + **ajv-formats 2.1.1**: JSON schema validation

### Utilities
- **compression 1.8.1**: Response compression
- **dotenv 16.3.1**: Environment variable management
- **nodemailer 8.0.4**: Email sending (SMTP)
- **multer 2.0.0**: File upload handling
- **pdf-parse 1.1.1**: PDF parsing (resume analyzer)
- **winston 3.19.0**: Logging

### Payments
- **Razorpay 2.9.6**: Payment gateway integration

## Discord Bot

- **Discord.js** (implied from `discord-bot/src/`)
- **Node.js ES Modules**

## Infrastructure & Deployment

### Cloud Platforms
- **Azure App Service**: Backend hosting (Bicep IaC in `infra/`)
- **Vercel**: Frontend hosting (via `vercel.json`)
- **Cloudflare Workers**: Email service worker (`workers/email-service-worker/`)

### Containerization & Orchestration
- **Docker**: Containerization (`Dockerfile`, `docker-compose.yml`)
- **Kubernetes**: Deployment manifests in `k8s/deployment.yaml`
- **Nginx**: Reverse proxy config in `docker/nginx.conf`

### CI/CD
- **GitHub Actions**: Workflows in `.github/workflows/`
  - `ci-cd-complete.yml`, `deploy-backend-azure.yml`, `deploy-frontend-vercel.yml`
  - `security.yml`, `post-deploy-smoke.yml`

### Monitoring & Observability
- **Winston**: Structured logging (backend)
- **Custom telemetry**: `utils/telemetry.js`, `utils/voiceTelemetry.js`
- **Health checks**: `/health`, `/health/ready`, `/health/live` endpoints

## Development Commands

### Root-Level Commands (from `package.json`)

```bash
# Development
npm run dev                    # Start frontend + backend concurrently
npm run start                  # Alias for npm run dev

# Setup & Verification
npm run install:all            # Install all workspace dependencies
npm run setup:env              # Generate .env files from templates
npm run setup                  # Bootstrap setup with verification
npm run verify:setup           # Validate env files and keys
npm run verify:setup:strict    # Strict validation (all keys required)

# Discord Bot
npm run discord:install        # Install bot dependencies
npm run discord:dev            # Start bot in watch mode
npm run discord:deploy         # Register slash commands
npm run discord:doctor         # Environment diagnostics

# Testing
npm run test                   # Run backend + frontend tests
npm run test:e2e               # Run Playwright E2E tests
npm run test:improvements      # Test improvement features
npm run lint                   # Lint backend + frontend
npm run lint:fix               # Auto-fix linting issues

# Build & Deploy
npm run build                  # Build frontend for production
npm run docker:build           # Build Docker images
npm run docker:up              # Start Docker containers
npm run k8s:deploy             # Deploy to Kubernetes

# Utilities
npm run scan:secrets           # Scan for exposed secrets
npm run redis:guardrails       # Validate Redis config
npm run backup:db              # Backup Supabase database
npm run cache:clear            # Clear Redis cache
npm run docs:api               # Generate API documentation
```

### Backend Commands (from `backend/package.json`)

```bash
npm run start                  # Start server (production)
npm run dev                    # Start server with --watch (hot reload)
npm run setup                  # Run setup script

# Testing
npm run test                   # Run all unit tests
npm run test:voice:unit        # Test voice service
npm run test:interview:*       # Test interview subsystems
npm run smoke:interview-suite  # Smoke test interview suite
npm run smoke:ai-features      # Smoke test AI features
npm run test:coins             # Test coin transaction system

# Migrations
npm run migrate:coin:real-data # Apply coin data sync migration
npm run migrate:quiz-feature   # Apply quiz feature migration
npm run verify:migration       # Verify AI features migration

# Linting
npm run lint                   # Check syntax with node --check
npm run format                 # Format with Prettier
```

### Frontend Commands (from `frontend/package.json`)

```bash
npm run dev                    # Start Vite dev server (port 5173)
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing
npm run test                   # Run Vitest unit tests
npm run test:watch             # Run Vitest in watch mode
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run Playwright with UI
npm run test:e2e:report        # Show Playwright report

# Linting
npm run lint                   # Lint with ESLint
npm run lint:fix               # Auto-fix ESLint issues
npm run format                 # Format with Prettier
```

## Environment Variables

### Backend (`.env`)
```env
NODE_ENV=development|production
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# AI
GROQ_API_KEY=

# Email
SMTP_USER=
SMTP_PASS=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Key Dependencies Summary

| Category | Frontend | Backend |
|----------|----------|---------|
| **Framework** | React 18, Vite 5 | Express 4, Node 22 |
| **Database** | Supabase JS | Supabase JS, pg, Redis |
| **AI/Voice** | - | Groq SDK, Kokoro JS, Google GenAI |
| **UI** | Mantine, Tailwind, React Flow | - |
| **Editors** | TipTap, BlockNote, Monaco | - |
| **Testing** | Vitest, Playwright | Node --check, custom scripts |
| **Security** | - | Helmet, bcryptjs, JWT, rate-limit |
| **Build** | Vite, Rollup | - |
