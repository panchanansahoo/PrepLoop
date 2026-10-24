#!/usr/bin/env node

import('./scan-secrets.mjs').catch((error) => {
  console.error(`Secret scan failed to start: ${error.message}`);
  process.exitCode = 1;
});
