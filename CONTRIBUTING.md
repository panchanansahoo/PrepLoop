# Contributing

Thanks for contributing to PrepLoop.

## Development Setup

1. Install dependencies:

```bash
npm run install:all
```

1. Configure environment variables:

- `backend/.env`
- `frontend/.env`

See setup details in [README.md](README.md).

1. Start local development:

```bash
npm run setup
npm run dev
```

## Quality Gates

Before opening a pull request, run:

```bash
npm run lint
npm run test
npm run build
npm run audit
```

## Branching

- Create a feature branch from `main` (or active trunk branch).
- Use short, descriptive names, for example:
  - `feat/problem-editor-history`
  - `fix/auth-refresh-flow`

## Commit Guidelines

Use clear, scoped commit messages.

Examples:

- `feat(frontend): add hints reveal tracking`
- `fix(backend): handle missing auth header`
- `docs(repo): add release process guide`

## Pull Request Process

1. Open a PR with a clear summary and rationale.
2. Complete the checklist in `.github/pull_request_template.md`.
3. Ensure CI is green.
4. Request review from code owners.

## Reporting Issues

Use the issue templates in `.github/ISSUE_TEMPLATE/`:

- Bug report
- Feature request
- Documentation request

For security vulnerabilities, use private advisories as described in `.github/ISSUE_TEMPLATE/config.yml`.
