# PrepLoop Improvement Plan

This plan is based on the repository structure, README, package scripts, and current implementation. It prioritizes making the core interview practice journey dependable before expanding features.

## Product goal

Help a candidate go from choosing a role or company to completing a realistic practice interview, understanding specific gaps, and knowing what to practice next.

## Priority 0: Make the core journey reliable

### 1. Finish and stabilize voice interview sessions

- Consolidate session lifecycle handling across `useInterviewSession`, `useVoiceAI`, and the interview page so start, reconnect, end, and retry have explicit states.
- Make microphone permission failures, network loss, provider errors, and unsupported browsers actionable in the UI.
- Ensure transcript/caption state and interview state stay in sync through reconnects and page navigation.
- Capture safe diagnostics for failed sessions without recording secrets or unnecessary personal data.
- Acceptance: a user can start, complete, reconnect to, and review a voice interview; every failure state offers a clear next action.

### 2. Improve the post-interview feedback loop

- Turn interview feedback into a consistent summary: strengths, prioritized gaps, evidence from the transcript, and recommended next practice.
- Link each recommendation to a relevant question set, coding task, or follow-up interview.
- Preserve feedback and progress across refreshes and devices, with clear loading, empty, and retry states.
- Acceptance: a completed session always leads to a useful review, even when optional AI analysis is unavailable.

### 3. Make account recovery and authentication observable

- Complete recovery-flow coverage from email generation through link redirect and password update across development and production URLs.
- Verify configured frontend redirect URLs and email delivery at startup/deployment; avoid reporting success when a provider error prevented delivery.
- Add user-facing recovery errors for expired links, unsupported email states, and delivery delays while preserving account-enumeration protections.
- Acceptance: users can recover accounts on the deployed domain, and operators can distinguish delivery/configuration failures from valid privacy-preserving responses.

## Priority 1: Reduce operational and security risk

### 4. Establish production service health and alerts

- Define service-level indicators for API availability, p95 latency, AI provider failures, voice session completion, email delivery, and payment webhook processing.
- Connect the existing protected monitoring endpoint and alert thresholds to actual dashboards/notifications.
- Add readiness checks for required dependencies and explicit degraded states for optional providers.
- Document incident runbooks for Supabase, email, AI, Redis, and payment outages.
- Acceptance: operators can detect a user-impacting outage and identify the affected dependency without exposing user data.

### 5. Tighten environment and deployment validation

- Make environment templates match actual required variables, including production frontend URL, Supabase keys, email provider, and callback allowlists.
- Fail deployment checks on missing required production config; warn on missing optional integrations with the feature impact stated.
- Keep one maintained deployment path and remove or label stale manifests and setup instructions.
- Acceptance: a new deployment can be configured from documented steps without guessing which variables are required.

### 6. Review authorization and data retention boundaries

- Audit sensitive routes for ownership checks, role checks, rate limits, and consistent validation.
- Confirm RLS policies and service-role use for profiles, interview transcripts, resumes, billing, and admin actions.
- Set and enforce retention periods for recordings/transcripts and user-generated documents; provide deletion/export paths where needed.
- Acceptance: every sensitive data path has a documented owner, access rule, and retention behavior.

## Priority 2: Improve usability and maintainability

### 7. Simplify the largest UI modules

- Break the largest page components (including company interviews, resume analysis, coding playground, and home) into feature components and hooks.
- Separate data fetching, state transitions, and rendering; keep API contracts close to feature modules.
- Standardize form, loading, empty, error, and success patterns across authentication and practice flows.
- Acceptance: common changes can be made in focused modules without affecting unrelated screens.

### 8. Improve accessibility and responsive behavior

- Extend existing public-route accessibility checks to signed-in practice, interview, feedback, and account pages.
- Add keyboard support, visible focus, accessible labels, and reduced-motion behavior to interactive flows.
- Validate small-screen layouts and error states, especially coding and live interview controls.
- Acceptance: core tasks can be completed with keyboard and screen reader support at mobile and desktop sizes.

### 9. Make performance budgets user-centered

- Track route-level JavaScript size, initial load time, and largest contentful paint; lazy-load heavy editors, 3D views, and nonessential routes.
- Use the existing bundle budget as a guardrail and add route-specific budgets for the largest experiences.
- Measure database query latency and cache hit rates before adding new caching layers.
- Acceptance: the landing page and first practice route load quickly on a mid-range mobile connection without delaying core content for heavy modules.

## Delivery sequence

1. Stabilize the voice interview state machine and failure handling.
2. Improve interview review and next-step recommendations.
3. Finish account recovery and production callback/email checks.
4. Add operational health indicators and deployment validation.
5. Audit authorization, retention, and deletion flows.
6. Refactor large screens, then expand accessibility and performance coverage.

## Measures to track

- Interview start-to-completion rate and failure reason.
- Reconnect success rate and median time to recover.
- Percentage of completed interviews that reach a review page.
- Recovery email delivery rate and successful password reset completion rate.
- API error rate and p95 latency by route and provider.
- Mobile task completion, accessibility violations, and route-level bundle size.

## Working constraints

- Keep changes incremental and focused on a measurable user or operational outcome.
- Do not expand AI features until failure handling, cost limits, and useful fallbacks are in place.
- Preserve the existing product surface while splitting large modules; use behavior-focused checks for high-risk flows.
- Coordinate work in the interview and voice files with the changes already present in the working tree.

## Implementation progress

- **In progress — voice interview reliability:** stale transcription results are ignored after stop/restart; microphone tracks are released when capture stops; failed Whisper transcriptions retain the audio in memory for retry after connectivity returns, with typed-answer fallback.
- **In progress — interview review:** unavailable evaluation is labeled as unscored, unsupported fallback strengths and hiring labels are removed from the results screen, and the server marks heuristic reports so the client does not present them as AI evaluations.
- **In progress — account recovery:** recovery links now pass `redirectTo` in the top-level shape expected by Supabase `generateLink`.
