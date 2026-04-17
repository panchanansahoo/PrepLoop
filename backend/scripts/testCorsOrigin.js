import assert from 'node:assert/strict';
import { isAllowedCorsOrigin } from '../middleware/corsOrigin.js';

function run() {
  const configuredOrigins = ['https://preploop-frontend.vercel.app'];

  // SSR/CLI requests without Origin should remain allowed.
  assert.equal(isAllowedCorsOrigin(undefined, configuredOrigins), true);

  // Explicit configured origins should be allowed.
  assert.equal(isAllowedCorsOrigin('https://preploop-frontend.vercel.app', configuredOrigins), true);

  // Local development origins should remain allowed.
  assert.equal(isAllowedCorsOrigin('http://localhost:5173', configuredOrigins), true);
  assert.equal(isAllowedCorsOrigin('http://127.0.0.1:4173', configuredOrigins), true);

  // Vercel production and deployment aliases for this app should be allowed.
  assert.equal(
    isAllowedCorsOrigin('https://preploop-frontend.vercel.app', configuredOrigins),
    true,
  );
  assert.equal(
    isAllowedCorsOrigin('https://preploop-frontend-96mm5rwpu-panchanan-sahoos-projects.vercel.app', configuredOrigins),
    true,
  );
  assert.equal(isAllowedCorsOrigin('https://preploop.me', configuredOrigins), true);
  assert.equal(isAllowedCorsOrigin('https://www.preploop.me', configuredOrigins), true);

  // Unrelated origins should remain blocked.
  assert.equal(isAllowedCorsOrigin('https://evil.vercel.app', configuredOrigins), false);
  assert.equal(isAllowedCorsOrigin('https://example.com', configuredOrigins), false);

  console.log('testCorsOrigin: all assertions passed');
}

run();
