---
name: migration-safety
description: 'Safely plan and verify Preploop database migrations. Use when working on SQL migrations, schema changes, Supabase updates, rollout order, rollback notes, or migration-related release risk.'
argument-hint: 'Describe the migration change and affected tables/endpoints'
user-invocable: true
---

# Migration Safety

## When To Use
Use this skill when a task includes any of the following:
- New or modified SQL files in `backend/db/`
- Schema evolution that affects backend routes or frontend payload expectations
- Migration sequencing concerns across environments
- Rollback planning or post-deploy verification requirements

## Goals
- Prevent destructive or out-of-order migration rollout.
- Make migration behavior auditable and reversible at release time.
- Ensure app-level verification is done after migration execution.

## Procedure

### 1) Discover Impact
- Identify changed SQL files in `backend/db/`.
- Identify affected tables/columns/indexes/constraints.
- Map impacted runtime surfaces:
  - backend routes in `backend/routes/`
  - service logic in `backend/services/`
  - frontend API consumers in `frontend/src/api/`

### 2) Validate Sequencing
- Confirm migration order by filename and dependency.
- Check for preconditions (existing tables, indexes, data assumptions).
- Flag risky operations early:
  - column drops/renames
  - wide updates without predicates
  - non-concurrent index operations on large tables
  - implicit data backfills with no guardrails

### 3) Define Rollback Notes
For each migration, produce rollback guidance in PR notes:
- What can be reverted safely
- What is irreversible (for example destructive deletes)
- Required backup/snapshot expectations
- Manual repair path if rollback is partial

### 4) Execute Verification
After applying migrations, verify in layers:
1. Migration-level checks
- Table/index/constraint existence
- Expected row/data transformations

2. Backend checks
- `npm run lint --prefix backend`
- `npm run test --prefix backend`
- Relevant smoke scripts (for example interview suite or AI features)

3. End-to-end contract checks
- Hit affected endpoints and validate response shape
- Confirm frontend paths relying on changed schema still work

### 5) Release Decision
Summarize:
- Migration execution order
- Rollback notes
- Verification evidence
- Residual risks and mitigations
- Go/no-go recommendation

## PrepLoop-Specific Guardrails
- Ask first before major schema changes or new dependency introduction.
- Keep migration SQL in `backend/db/` with descriptive, incremental naming.
- Use app-level verification scripts when available.
- For coin-related migration changes, include coin integration/atomicity checks before merge.

## Output Template
Use this concise output in PR comments:

- Migration files changed:
- Execution order:
- Preconditions:
- Rollback notes:
- Verification commands and outcomes:
- Residual risks:
- Recommendation:
