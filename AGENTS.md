# PrepLoop — Agent Guide

## Repo structure
- `backend/` — Node.js 22 ESM (`"type": "module"`), Express, dynamic route loading in `backend/index.js:215-249`
- `frontend/` — React 18 + Vite 5 + Vitest + ESLint
- `discord-bot/` — separate package
- `scripts/` — root util scripts (some `.cjs` — not ESM)

## Essential commands (run from root)
| Command | What |
|---|---|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run lint` | Backend `node --check` on specific files + frontend ESLint |
| `npm test` | Backend test scripts + frontend Vitest |
| `npm run build` | Frontend Vite build only |
| `npm run audit` | `npm audit` for both backend and frontend |

### Focused commands
- Backend lint: `npm run lint --prefix backend` (node --check on explicit file list)
- Frontend lint: `npm run lint --prefix frontend` (ESLint)
- Frontend tests: `npm run test --prefix frontend` (Vitest)
- Single frontend test: `npx vitest run --reporter=verbose src/pages/AIInterviewPage.test.js` (from `frontend/`)
- Frontend build: `npm run build --prefix frontend`
- Backend smoke tests: `npm run smoke:interview-suite:local --prefix backend`, `smoke:ai-features`, `smoke:fresher-technical`, `smoke:dsa-editor`
- Coin tests: `npm run test:coins --prefix backend`

## ESLint quirks (frontend)
The eslint config disables these by default:
- `no-unused-vars` — won't catch dead variables
- `no-empty` — empty catch blocks pass lint
- `react-hooks/exhaustive-deps` — missing useEffect deps not flagged

Manual review needed for all three. Lint output of "no errors" does NOT mean these patterns are absent.

## Backend quirks
- Backend "lint" is `node --check` on an explicit file list in `backend/package.json` — if you add a new file, it won't be checked unless you add it to that script
- Backend has NO ESLint — only Node.js syntax validation
- Backend tests run via individual node scripts, not a test framework — check `backend/package.json` `"test"` script for the full list
- `backend/index.js` lazy-loads all routes via dynamic `import()` inside `initializeServer()` — new route modules must be added both as an import and a `app.use()` mount there

## Known gotchas
- `req.id` is always `undefined` — use `req.requestId` (set by `requestIdMiddleware`)
- `supabaseAdmin.raw()` does NOT exist in Supabase JS v2 — use `supabase.rpc()` or manual increment
- `.single()` throws on empty results — prefer `.maybeSingle()` when the row may not exist
- Never use `Math.random()` for filenames or tokens — use `crypto.randomBytes()` instead
- Frontend proxies `/api` → `localhost:5000` in dev via `vite.config.js`
- Backend `"type": "module"` is required for all `.js` files in `backend/` — some root `scripts/` use `.cjs` intentionally
- Prefer token-in-query-string for WebSocket auth (browser limitation), never in production-visible URLs where proxies log them

## Testing priorities
- Unit > integration > e2e (lowest level that captures behavior)
- Frontend test selectors: `getByRole` > `getByPlaceholderText` > `getByText`
- Avoid `getByLabelText` unless controls use `htmlFor` reliably
- Bug fixes: write a failing test first (Prove-It pattern)

## Architecture notes
- Frontend route definitions: `frontend/src/App.jsx` with lazy imports via `lazyWithRecovery()`
- All pages in `frontend/src/pages/`, all route components lazy-loaded
- Backend mounts at `/api/*`, health checks at `/health`, `/health/ready`, `/health/live`
- Public paths defined in `PUBLIC_PATHS` constant in `frontend/src/App.jsx`
- `.env.template` files exist in `backend/` and `frontend/` — copy to `.env` for local dev
