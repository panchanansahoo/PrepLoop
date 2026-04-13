---
description: "Run a one-shot pre-PR readiness checklist for Preploop: lint, test, build, audit, migration notes, and risk summary with clear pass/fail output."
name: "PR Readiness"
argument-hint: "Scope of changes (for example: backend auth routes, frontend editor, db migration)"
agent: "agent"
---
Perform a one-shot PR readiness review for this repository for: ${input:Scope of changes (for example: backend auth routes, frontend editor, db migration)}.

## Objectives
1. Run and report quality gates.
2. Detect migration and rollout risks.
3. Produce a concise go/no-go summary with blockers.

## Execution Checklist
Run these commands from repo root unless scope requires narrower checks:
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run audit`

If backend-only changes are clearly isolated, also run targeted backend checks:
- `npm run lint --prefix backend`
- `npm run test --prefix backend`

If frontend-only changes are clearly isolated, also run targeted frontend checks:
- `npm run lint --prefix frontend`
- `npm run test --prefix frontend`
- `npm run build --prefix frontend`

If database or migration files changed, include migration checks:
- List changed SQL files in `backend/db/`
- Verify sequencing assumptions and any required preconditions
- Identify rollback strategy and data safety concerns

## Output Format
Return exactly these sections:

### PR Readiness Status
- Overall: PASS | FAIL | PASS WITH RISKS
- Scope evaluated

### Gate Results
- Lint: pass/fail + key failures
- Test: pass/fail + key failures
- Build: pass/fail + key failures
- Audit: pass/fail + critical/high findings

### Migration Notes
- Changed migration files
- Required execution order
- Rollback notes
- Post-deploy verification steps

### Risk Summary
- Top risks (up to 5)
- Severity for each risk: high/medium/low
- Mitigations

### Release Recommendation
- Recommended action: merge now | fix blockers first | stage behind verification
- Short rationale
