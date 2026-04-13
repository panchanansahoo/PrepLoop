# Copilot Customizations

This folder contains workspace-scoped Copilot customizations for PrepLoop.

## Available Instructions

### Backend Standards
- File: `instructions/backend-standards.instructions.md`
- Auto-attach scope:
  - `backend/**/*.js`
  - `backend/**/*.sql`
- Use for backend route/middleware/service/migration updates.

### Frontend Standards
- File: `instructions/frontend-standards.instructions.md`
- Auto-attach scope:
  - `frontend/src/**/*.{js,jsx,ts,tsx}`
  - `frontend/vite.config.js`
  - `frontend/eslint.config.js`
- Use for React/Vite component changes, selector strategy, and verification expectations.

## Available Prompt

### /pr-readiness
- File: `prompts/pr-readiness.prompt.md`
- Purpose: one-shot pre-PR checklist runner for lint, test, build, audit, migration notes, and risk summary.
- Example usage:
  - `/pr-readiness backend auth routes + coin migration`

## Available Skill

### /migration-safety
- File: `skills/migration-safety/SKILL.md`
- Purpose: safe migration sequencing, rollback notes, and verification workflow tailored to this repository.
- Example usage:
  - `/migration-safety add unique index to coin_transactions and update API dependencies`

## Suggested Workflow

1. Implement changes in scoped files (instructions auto-attach).
2. Run local checks required by the relevant instruction.
3. Run `/pr-readiness` before opening a PR.
4. If database changes are involved, run `/migration-safety` and include its output in PR notes.
