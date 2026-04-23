/**
 * lazyWithRecovery — Consolidated lazy loading utility with chunk error recovery.
 *
 * After deployments, stale chunk URLs cause ChunkLoadError. This utility:
 *   1. Retries the import once after a short delay (new deployment may have invalidated the hash)
 *   2. Forces a full page reload as a last resort (only once per session to avoid loops)
 *
 * Previously duplicated in App.jsx and Home.jsx — now a single shared utility.
 */
import { lazy } from 'react';

/**
 * @param {() => Promise<any>} importFn - Dynamic import function
 * @param {number} retries - Number of retry attempts (default 1)
 * @returns {React.LazyExoticComponent} Lazy-loaded component with recovery
 */
export function lazyWithRecovery(importFn, retries = 1) {
  return lazy(() =>
    new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              // Avoid infinite reload loop: check sessionStorage flag
              const reloaded = sessionStorage.getItem('chunk_reload');
              if (!reloaded) {
                sessionStorage.setItem('chunk_reload', '1');
                window.location.reload();
              }
              reject(error);
              return;
            }

            // Wait 500ms before retry — gives CDN time to propagate new chunks
            setTimeout(() => attemptImport(retriesLeft - 1), 500);
          });
      };

      attemptImport(retries);
    })
  );
}

export default lazyWithRecovery;
