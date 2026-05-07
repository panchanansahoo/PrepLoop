import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './styles/new-features.css'
import './light-mode-aggressive.css'
import './light-theme-pages.css'
import App from './App.jsx'
import axios from 'axios';
import { buildInterviewAuthInit } from './utils/interviewRequestAuth';
import { getConfiguredApiOrigin, routeApiRequestInput } from './utils/apiRequestRouting';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import { registerDynamicImportErrorRecovery } from './utils/importErrorRecovery';
import ErrorBoundary from './components/ErrorBoundary';
import performanceMonitor from './utils/performanceMonitor';
import analytics from './utils/analytics';

import { validateFrontendRuntimeConfig } from './utils/runtimeConfig';

// Validate configuration first - fail immediately if invalid
try {
  validateFrontendRuntimeConfig();
} catch (error) {
  console.error('Application initialization failed:', error.message);
  document.body.innerHTML = `
    <div style="
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1a1a1a;
      color: #fff;
      padding: 20px;
    ">
      <div style="
        max-width: 600px;
        text-align: center;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 40px;
      ">
        <h1 style="margin: 0 0 20px; color: #ff6b6b;">⚠️ Configuration Error</h1>
        <p style="margin: 0; color: #ccc; line-height: 1.6;">
          The application cannot start due to missing or invalid configuration.<br/>
          Check the browser console for detailed error information.
        </p>
        <p style="margin: 20px 0 0; font-family: monospace; color: #888; font-size: 12px;">
          Error: ${error.message}
        </p>
      </div>
    </div>
  `;
  throw error;
}

if (typeof window !== 'undefined' && !window.__preploopInterviewFetchPatched) {
  const apiOrigin = getConfiguredApiOrigin();

  if (apiOrigin) {
    axios.defaults.baseURL = apiOrigin;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const routedInput = routeApiRequestInput(input, apiOrigin);
    const patchedInit = buildInterviewAuthInit(routedInput, init);
    return nativeFetch(routedInput, patchedInit);
  };
  window.__preploopInterviewFetchPatched = true;
}

// Handle stale deploy chunks once by reloading the app.
registerDynamicImportErrorRecovery();

// Register service worker for offline support
registerServiceWorker();

// Initialize performance monitoring
performanceMonitor.init();

// Initialize analytics
analytics.init({
  trackPageViews: true,
  trackClicks: true,
  trackErrors: true,
});




createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
