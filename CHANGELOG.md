# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added

- CI workflow for lint, test, build, and audit checks.
- Dependabot configuration for root, backend, and frontend npm dependencies.
- PR template and issue templates.
- CODEOWNERS file for review routing.
- Root-level quality scripts (`lint`, `test`, `build`, `audit`).
- Shared backend coin transaction utility for atomic RPC usage (`backend/utils/coinTransactions.js`).
- Idempotent coin transaction migration with `reference_key` support (`backend/db/migration_coin_transaction_idempotency.sql`).

### Changed

- Backend diagnose script now runs non-blocking by default and supports `--start` to boot server.
- Frontend lint setup improved and scoped to `frontend/src`.
- Frontend and backend quality checks standardized.

### Fixed

- Hook-order and lint-breaking issues in editor/visualizer and aptitude pages.
- Backend audit vulnerabilities resolved in production dependencies.
- Coin charge/reward race-condition exposure reduced by routing `chat`, `coins`, and first-solve practice rewards through atomic coin RPC paths.
- Community feed reply counts now computed from replies table for returned posts, improving count consistency.
