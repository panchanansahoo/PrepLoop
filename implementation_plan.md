# Implementation Plan

[Overview]
PrepLoop is a monorepo (React/Vite frontend, Node/Express backend, Expo mobile, Supabase/PostgreSQL) with passing backend lint/type checks and 160 backend Vitest tests. The investigation found the application builds successfully, but there are concrete runtime, security, and maintainability gaps: HR authentication issues custom JWTs that the Supabase-based `authenticateToken` middleware cannot validate; dependency advisories in backend and frontend; frontend test execution can hang; mobile lint is not runnable in a clean checkout; backend environment templates include frontend-only variables; and several large bundles/UI modules need splitting. The plan prioritizes fixing functional auth and security defects first, then stabilizing CI/tests, then performance and maintainability improvements.

[Types]
- `HRTokenPayload`: `{ userId: string; email: string; role: 'hr'; iat?: number; exp?: number }` used by HR JWT signing and verification.
- `HRPrincipal`: `{ id: string; email: string; role: 'hr'; fullName?: string }` attached to `req.hrUser` by the new HR authentication middleware.
- `RuntimeValidationResult`: `{ errors: string[]; warnings: string[] }` shared shape for backend startup and frontend runtime validators.
- `ApiRetryState`: `{ _retry?: boolean; _retryCount?: number; _csrfRetry?: boolean; _authRefresh?: boolean }` to replace overloaded retry flags in the frontend Axios client.

[Files]
New files:
- `backend/middleware/hrAuth.js`: verify HR JWTs with `JWT_SECRET`, attach `req.hrUser`, and enforce HR/admin role.
- `backend/services/hrAuthService.js`: encapsulate HR register/login, password hashing, JWT issue, and optional Supabase profile synchronization.
- `backend/types/hr.ts`: TypeScript types for HR auth payloads and middleware contracts.
- `docs/RUNBOOK.md`: incident and deployment troubleshooting for Supabase, email, Redis, AI, payment, and HR auth.
- `frontend/vitest.setup.js`: global test setup/timeouts to prevent hung suites.

Existing files to modify:
- `backend/routes/hr.js`: replace direct `pg` + `jsonwebtoken` route logic with `hrAuthService`; use `hrAuth` middleware for protected HR endpoints; return consistent error codes.
- `backend/middleware/auth.js`: export a reusable token verifier hook or keep Supabase auth separate; document that custom HR tokens are not Supabase tokens.
- `backend/.env` and `backend/.env.example`: remove frontend-only `VITE_*` variables from backend templates; document `DATABASE_URL`, `JWT_SECRET`, `HR_*` if introduced.
- `frontend/.env.example`: ensure `VITE_API_URL` and Supabase values are documented and non-placeholder in deployment templates.
- `frontend/src/api/client.js`: separate network retry, 401 refresh, and CSRF retry flags; avoid recursive interceptor loops.
- `frontend/vite.config.js`: keep manual chunks but add bundle budget checks for `vendor-editor` and `vendor-three-core`.
- `frontend/package.json`: update vulnerable dependencies and add `test:ci` script with explicit timeout/reporter.
- `backend/package.json`: update vulnerable dependencies and add `test:ci`.
- `mobile/package.json`: add ESLint as a dev dependency or remove lint from CI if not installed.
- `.github/workflows/ci.yml`: install mobile dependencies only when lockfile exists; add frontend test timeout; run `npm audit` as non-blocking advisory.
- `docs/api-spec.json` / `docs/api-spec.html`: regenerate after HR route changes.

Files to delete or move:
- Remove stale deployment manifests only after confirming `render.yaml` and `vercel.json` are the active paths; otherwise label them as legacy in documentation.

[Functions]
New functions:
- `hrAuthService.registerHR(payload)`: validate input, hash password, insert HR user, issue JWT.
- `hrAuthService.loginHR(email, password)`: verify credentials and issue JWT.
- `hrAuthService.verifyHRToken(token)`: verify and decode HR JWT, return `HRPrincipal`.
- `hrAuth(req, res, next)`: middleware that extracts bearer token, verifies it, and attaches `req.hrUser`.
- `requireHRRole(req, res, next)`: role guard for HR-only routes.

Modified functions:
- `authenticateToken` in `backend/middleware/auth.js`: keep Supabase behavior; improve 401 vs 403 semantics and token-expired detection.
- `isOriginAllowed` in `backend/config/cors.js`: escape production domain safely and reject malformed regex input.
- `getProductionEnvValidationErrors` in `backend/config/startupEnvValidation.js`: distinguish required vs optional HR/database configuration.
- `validateFrontendRuntimeConfig` in `frontend/src/utils/runtimeConfig.js`: validate API URL and Supabase config consistently.
- `getCsrfToken` and response interceptor in `frontend/src/api/client.js`: make retry state explicit and prevent infinite retries.

Removed functions:
- Inline HR SQL/JWT logic in `backend/routes/hr.js` should be removed after migration to `hrAuthService`.

[Classes]
New classes:
- `HrAuthService` (`backend/services/hrAuthService.js`): owns HR identity persistence and token lifecycle; methods `register`, `login`, `verifyToken`, `toPublicUser`.
- `RuntimeConfigValidator` (optional refactor in `backend/config/startupEnvValidation.js` and `frontend/src/utils/runtimeConfig.js`): centralizes required/optional environment checks.

Modified classes:
- None in current code are class-based except services; service modules should remain function-export based unless a class improves testability.

Removed classes:
- None.

[Dependencies]
Backend:
- Run `npm audit fix` and verify `follow-redirects`, `joi`, `protobufjs`, and `qs` are updated.
- Keep `jsonwebtoken` for HR auth; add tests for token verification.
- Consider `zod` for HR request validation instead of ad-hoc checks.

Frontend:
- Run `npm audit fix`; resolve `react-router`/`react-router-dom` advisories without breaking React Router v6 APIs.
- Update `follow-redirects` transitively via axios lockfile refresh.
- Add Vitest coverage reporter configuration if coverage gates are desired.

Mobile:
- Add `eslint` and React Native ESLint config to `devDependencies`, or remove lint from CI if not installed.

[Testing]
- Add `backend/tests/unit/hrAuth.test.ts` and `backend/tests/integration/hrFlow.test.ts` covering registration, login, protected slot creation, invalid token, and expired token.
- Add frontend tests for Axios interceptor retry behavior and CSRF refresh.
- Add a Vitest setup file with a global timeout and cleanup to avoid hung jsdom suites.
- Add mobile ESLint smoke test in CI after dependencies are installed.
- Extend smoke tests to verify HR endpoints and frontend build bundle budgets.
- Keep existing 160 backend Vitest tests and frontend build passing.

[Implementation Order]
1. Fix HR authentication by introducing `hrAuthService` and `hrAuth` middleware; update `backend/routes/hr.js`.
2. Unify environment templates and remove frontend-only variables from backend configuration.
3. Update backend and frontend dependencies using `npm audit fix`; run lint, type check, and tests.
4. Add frontend interceptor retry-state fixes and tests.
5. Add Vitest setup/timeouts and stabilize frontend test execution.
6. Install or gate mobile lint and run mobile unit tests.
7. Update CI workflow to install dependencies reliably and enforce timeouts.
8. Add bundle budget checks and split oversized frontend chunks.
9. Add incident runbook and deployment validation documentation.
10. Run full backend/frontend/mobile test and build matrix before release.
