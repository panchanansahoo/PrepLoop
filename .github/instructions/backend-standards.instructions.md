---
description: "Use when editing backend routes, middleware, services, or SQL migrations in Preploop. Covers Express route patterns, middleware ordering, backend smoke tests, and migration-safe updates."
name: "Backend Standards"
applyTo:
  - "backend/**/*.js"
  - "backend/**/*.sql"
---
# Backend Standards

## Scope
Apply these rules for changes in the backend API, middleware, services, scripts, and database migrations.

## Route And Handler Patterns
- Keep backend modules in ESM style (`import`/`export`) to match `backend/package.json`.
- Prefer async handlers and centralized try/catch behavior already used in existing routes.
- Validate input at boundaries before invoking service/database calls.
- Preserve existing route grouping conventions under `/api/*`.
- When adding a route module, ensure it is mounted in `backend/index.js`.

## Middleware Patterns
- Keep security middleware active (`helmet`, CORS, rate limiters) unless explicitly required otherwise.
- Preserve middleware order in `backend/index.js`; do not move auth or request-id behavior casually.
- Reuse existing auth middleware patterns from `backend/middleware/auth.js` rather than introducing parallel auth logic.

## Database And Migration Safety
- For schema or migration work, ask first before introducing destructive or broad changes.
- Place SQL migrations in `backend/db/` with descriptive names matching existing style.
- Add forward-only SQL and include rollback notes in PR descriptions.
- If migration impacts behavior, include an app-level verification path (script or endpoint checks).

## Testing And Verification
- Minimum checks after backend changes:
  - `npm run lint --prefix backend`
  - `npm run test --prefix backend`
- For route-heavy or interview-suite changes, also run targeted smoke checks when relevant:
  - `npm run smoke:interview-suite:local --prefix backend`
  - `npm run smoke:ai-features --prefix backend`
  - `npm run smoke:fresher-technical --prefix backend`
- If coin logic is touched, run:
  - `npm run test:coins --prefix backend`

## Docs And Contracts
- Update API docs when endpoint contracts or payload shapes change:
  - `docs/BACKEND_API_QUICK_REFERENCE.md`
  - `docs/AI_FEATURES_API.md`
  - `docs/INTERVIEW_SUITE_API.md`
- Link to docs instead of duplicating large spec text in code comments.
