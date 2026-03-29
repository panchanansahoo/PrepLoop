# Release Process

This document describes how to prepare and publish a release for PrepLoop.

## Release Readiness Checklist

1. Pull latest changes from default branch.
1. Ensure all CI checks pass.
1. Run local verification:

```bash
npm run lint
npm run test
npm run build
npm run audit
```

1. Confirm critical flows manually:

- Authentication (login/signup/reset)
- DSA editor and submission flow
- Interview simulation flow
- Payment flow (if enabled in environment)
- Admin and dashboard pages

## Versioning

Use semantic versioning:

- Patch: bug fixes (`x.y.Z`)
- Minor: backward-compatible features (`x.Y.z`)
- Major: breaking changes (`X.y.z`)

## Release Steps

1. Update changelog in `CHANGELOG.md`.
1. Create a release PR if needed.
1. Merge to default branch.
1. Tag the release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

1. Publish GitHub Release notes from `CHANGELOG.md`.

## Rollback Plan

If a release is unstable:

1. Revert the release commit(s) or deploy previous known-good tag.
1. Validate core flows quickly.
1. Open a follow-up incident/fix issue.

## Ownership

Code ownership and review routing are defined in `.github/CODEOWNERS`.
