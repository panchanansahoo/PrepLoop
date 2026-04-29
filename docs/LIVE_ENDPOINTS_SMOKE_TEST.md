Live Endpoints Smoke Test
=========================

This document explains the in-process harness and how to run the live-endpoints smoke test locally and in CI.

Files referenced:

- `backend/test-live-endpoints.js` — in-process harness that mounts interview routers, stubs Supabase/admin auth, and exercises representative endpoints. The harness exits with a non-zero code when any endpoint returns an error or non-2xx status.
- `.github/workflows/live-endpoints.yml` — GitHub Actions workflow that runs the harness on push and pull_request for backend changes.

Run locally
```
node backend/test-live-endpoints.js
```

Notes and troubleshooting

- Node version: CI uses Node 20. If you run into `fetch` not available errors on older Node versions, run with `node --experimental-fetch` or install a polyfill such as `node-fetch`.
- The harness stubs the `supabaseAdmin` client and auth flows. It is intentionally non-invasive and only loads the interview router in-process.
- If you edit `backend/test-live-endpoints.js`, please verify the harness exits `0` on success and non-zero on failure so CI will fail on regressions.

CI behavior

- The workflow `.github/workflows/live-endpoints.yml` runs the harness on `pull_request` and `push` for `backend/**` and the workflow file itself. Any non-zero exit will fail the job.

Changelog (summary)

- Add in-process live endpoint smoke harness and a CI workflow to detect runtime regressions in interview endpoints.

Further improvements

- Expand the harness to include more endpoints and representative stub data.
- Add a short unit test that validates the `makeChain()` stubs replicate the supabase fluent/thenable API surface used by handlers.
