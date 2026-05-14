# PrepLoop - Development Guidelines

## Code Quality Standards

### Module System
- **ES Modules exclusively** — both frontend and backend use `"type": "module"` in package.json
- Use `import`/`export` syntax everywhere; never use `require()` or `module.exports`
- Named exports and default exports are both used; re-export patterns are common for service wrappers:
  ```js
  // interviewFollowUpRulesService.js — thin re-export wrapper pattern
  import InterviewFollowUpRulesService from './interviewFollowUpRules.js';
  export { InterviewFollowUpRulesService };
  export default InterviewFollowUpRulesService;
  ```

### File Naming Conventions
- **Backend**: `camelCase.js` for all files (services, routes, utils, middleware)
- **Frontend components**: `PascalCase.jsx` for React components
- **Frontend hooks**: `useCamelCase.js` (e.g., `useAudioVisualizer.js`)
- **Frontend data files**: `camelCase.js` (e.g., `editorThemes.js`, `books.js`)
- **Frontend pages**: `PascalCase.jsx` (e.g., `SystemDesignRoadmap.jsx`)
- **CSS modules**: co-located with component, same name (e.g., `Component.css` next to `Component.jsx`)
- **Test files**: co-located with source, `.test.js` or `.test.jsx` suffix

### Formatting
- **Prettier** is configured in both frontend and backend (`.prettierrc.json`)
- Run `npm run format` to auto-format
- 4-space indentation is used in data files and backend; 2-space in some frontend files
- Single quotes for strings in JS/JSX

---

## Frontend Patterns

### React Component Structure
- **Default export** for all page and component files
- **Named exports** for utility functions within data/util files
- Thin page components that delegate to reusable components:
  ```jsx
  // SystemDesignRoadmap.jsx — page as a thin wrapper
  export default function SystemDesignRoadmap() {
    return (
      <RoadmapView
        hierarchy={systemDesignRoadmapHierarchy}
        patterns={systemDesignCatalogPatterns}
        trackKey={roadmapTrackConfigs['system-design'].trackKey}
        // ...spread config props
      />
    );
  }
  ```
- Configuration objects in `src/data/` drive component behavior (roadmapTrackConfigs, editorThemes, etc.)

### Custom Hooks Pattern
- Hooks encapsulate complex stateful logic (Web APIs, WebSocket, audio, etc.)
- Always return a `useMemo`-wrapped object for stable references:
  ```js
  return useMemo(() => ({
    inputBars, outputBars, inputLevel, outputLevel,
    inputActive: inputLevel > 0.08,
    outputActive: outputLevel > 0.05,
  }), [inputBars, outputBars, inputLevel, outputLevel]);
  ```
- Cleanup is always handled in `useEffect` return function:
  ```js
  return () => {
    mounted = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    try { audioContext.close(); } catch { /* no-op */ }
  };
  ```
- Use a `mounted` boolean flag to prevent state updates after unmount
- Wrap Web API access with `typeof window === 'undefined'` guard for SSR safety
- Catch errors from Web APIs silently with `// No-op` or `// no-op` comments

### State Initialization
- Use lazy initializer functions for array state to avoid re-creating on every render:
  ```js
  const [inputBars, setInputBars] = useState(() => Array.from({ length: barCount }, () => 0));
  ```

### Data Files (`src/data/`)
- Static data is exported as named constants (SCREAMING_SNAKE_CASE for arrays/objects):
  ```js
  export const EDITOR_THEMES = [ ... ];
  export const books = [ ... ]; // lowercase also used for simple arrays
  ```
- Data objects use consistent shape with all fields present on every item
- Section comments group related items: `// --- System Design & Architecture ---`
- Utility functions exported alongside data constants:
  ```js
  export function registerAllThemes(monaco) { ... }
  export function getSavedTheme(storageKey = 'editor-theme') { ... }
  export function saveTheme(themeId, storageKey = 'editor-theme') { ... }
  ```
- Default parameter values used for optional arguments

### Routing
- React Router v6 with lazy-loaded routes via `src/utils/lazyLoad.js` / `lazyWithRecovery.js`
- Route-level pages in `src/pages/`, feature-scoped components in `src/features/`

### Context Usage
- Three global contexts: `AuthContext`, `CoinContext`, `ThemeContext`
- Consume via custom hooks or `useContext` directly

---

## Backend Patterns

### Express Route Structure
- All routes registered in `index.js` via dynamic `import()` inside `initializeServer()`
- Route files export a default Express Router
- Routes are grouped by domain under `/api/<domain>`
- Authentication via `authenticateToken` middleware from `middleware/auth.js`

### Middleware Stack Order (index.js)
1. `enhancedSecurity()` — custom security headers
2. `helmet()` — standard security headers with CSP
3. `compression()` — gzip response compression
4. `cors(corsOptions)` — CORS with config from `config/cors.js`
5. `express.json()` / `express.urlencoded()` — body parsing (10mb limit)
6. `requestIdMiddleware` — request ID tracing
7. `sanitizeInput()` — input sanitization
8. Rate limiters per endpoint group (auth, AI, payment, jobs, admin, global)
9. `apiCacheMiddleware()` — response caching

### Service Layer
- Services are classes or objects with methods, imported as default exports
- Complex domains have multiple service files (interview has 8+ service files)
- Services use `async/await` throughout
- Error handling: services throw errors, routes catch and respond

### Environment & Configuration
- `config/env.js` loaded first in `index.js`
- `validateEnvironment()` and `validateStartupEnv()` called at startup
- Missing optional keys (Groq, Razorpay) disable features gracefully without crashing
- Environment-specific behavior: `process.env.NODE_ENV === 'production'` guards

### Error Handling
- Global `errorHandler` middleware registered last in Express
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` registered
- Production: exit on unhandled rejection; development: log and continue
- Port conflict: retry up to 10 times in dev, exit immediately in production

### Logging
- `createLogger(namespace)` from `utils/structuredLogger.js` for named loggers
- `utils/productionLogger.js` disables `console.log` in production
- Winston used for structured logging

### Graceful Shutdown
- `setupGracefulShutdown(server, { shutdownTimeout, forceExitTimeout })` from `utils/gracefulShutdown.js`
- Configurable via `SHUTDOWN_TIMEOUT` and `FORCE_EXIT_TIMEOUT` env vars

---

## Security Practices

- **JWT authentication** on all protected routes via `authenticateToken` middleware
- **Rate limiting** per endpoint category (auth: 30/15min, AI: stricter, global: 250/15min)
- **Input sanitization** on all routes except payment webhooks
- **Helmet** with strict CSP, HSTS with preload
- **CORS** configured from `config/cors.js` matching `FRONTEND_URL` env var
- **Razorpay webhook** uses raw body parser (`express.raw`) for signature verification
- **Redis** requires authentication (`REDIS_PASSWORD`)
- **Supabase RLS** enforced at database level

---

## Testing Conventions

### Backend
- Test scripts in `backend/scripts/` named `test*.js` or `smoke*.js`
- No test framework — plain Node.js scripts with `console.log` assertions
- Smoke tests hit live endpoints; unit tests test service logic directly
- Run via `npm run test` (chains multiple test scripts with `&&`)

### Frontend
- **Vitest** for unit tests, **Playwright** for E2E
- Test files co-located with source: `Component.test.jsx`, `hook.test.js`
- Test setup in `src/test/setup.js`
- Test utilities in `src/test/testUtils.js` and `src/utils/testUtils.jsx`
- E2E tests in `frontend/tests/e2e/`

---

## Naming Conventions Summary

| Context | Convention | Example |
|---------|-----------|---------|
| Backend files | camelCase | `interviewScoringService.js` |
| Frontend components | PascalCase | `SystemDesignRoadmap.jsx` |
| Frontend hooks | useCamelCase | `useAudioVisualizer.js` |
| Frontend data constants | SCREAMING_SNAKE_CASE | `EDITOR_THEMES` |
| React component functions | PascalCase | `function SystemDesignRoadmap()` |
| Hook functions | useCamelCase | `function useAudioVisualizer()` |
| Utility functions | camelCase | `normalizeBars()`, `registerAllThemes()` |
| CSS classes | kebab-case (Tailwind) | `bg-gray-900`, `flex-col` |
| Environment variables | SCREAMING_SNAKE_CASE | `GROQ_API_KEY`, `REDIS_URL` |
| Vite env vars | VITE_ prefix | `VITE_API_URL`, `VITE_SUPABASE_URL` |

---

## Common Idioms

### Frontend: Safe Web API Access
```js
if (typeof window === 'undefined') return undefined;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
```

### Frontend: requestAnimationFrame Loop with Cleanup
```js
const rafRef = useRef(null);
rafRef.current = requestAnimationFrame(tick);
// cleanup:
if (rafRef.current) cancelAnimationFrame(rafRef.current);
```

### Frontend: Silent Error Handling for Web APIs
```js
try {
  source.disconnect();
} catch { /* no-op */ }
```

### Backend: Dynamic Route Loading
```js
const authRoutes = (await import('./routes/auth.js')).default;
app.use('/api/auth', authRoutes);
```

### Backend: Port Retry in Development
```js
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
    startServer(port + 1, attempt + 1);
  }
});
```

### Data: Consistent Object Shape
```js
// Every item in a data array has the same fields
{ id, title, author, cover, rating, pages, link, tags }
```

### Service Re-export Wrapper
```js
// Thin wrapper providing both named and default export
import ServiceClass from './serviceImpl.js';
export { ServiceClass };
export default ServiceClass;
```
