---
description: "Use when editing Preploop frontend React/Vite code. Covers component conventions, Vite integration, Testing Library selector strategy, and lint/test/build verification expectations."
name: "Frontend Standards"
applyTo:
  - "frontend/src/**/*.{js,jsx,ts,tsx}"
  - "frontend/vite.config.js"
  - "frontend/eslint.config.js"
---
# Frontend Standards

## Scope
Apply these rules for React components, routes, API client usage, hooks, and frontend build tooling.

## React And Vite Patterns
- Follow existing React 18 + Vite architecture and route structure already present in `frontend/src`.
- Prefer small, composable components and keep business logic in services/hooks when possible.
- Preserve existing Vite proxy/build behavior in `frontend/vite.config.js` unless the task explicitly requires changing it.
- Keep styling aligned with current Tailwind + component patterns already in the project.

## Testing Selectors
- Prefer user-centric Testing Library queries in this order when practical:
  - `getByRole` / `findByRole`
  - `getByPlaceholderText`
  - `getByText`
- Avoid relying on `getByLabelText` when form controls are not reliably `htmlFor`-associated in current UI.
- Add or update tests for behavior changes, not visual-only assumptions.

## API And Error Handling
- Reuse existing frontend API service patterns from `frontend/src/api`.
- Keep user-facing error handling explicit for failed async flows.
- Do not silently swallow API failures in UI state transitions.

## Verification Expectations
- Minimum checks after frontend changes:
  - `npm run lint --prefix frontend`
  - `npm run test --prefix frontend`
  - `npm run build --prefix frontend`
- If changes are cross-cutting, run root gates before PR:
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Documentation Touchpoints
- If frontend behavior or user flows change materially, update relevant docs in `docs/` instead of embedding long notes in component files.
