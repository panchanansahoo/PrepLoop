const makeProblems = (prefix, problems) =>
    problems.map((problem) => ({
        status: 'pending',
        difficulty: 'Medium',
        ...problem,
        id: `${prefix}-${problem.id}`,
        link: `/problems/${prefix}-${problem.id}`,
    }));

export const webDevRoadmapHierarchy = [
    {
        id: 'frontend-foundations',
        label: 'Frontend Foundations',
        category: 'Root',
        children: [
            { id: 'html-css', label: 'HTML, CSS & Responsive Layout' },
            { id: 'javascript-typescript', label: 'JavaScript / TypeScript Core' },
            { id: 'browser-platform', label: 'DOM, Events, Forms & Accessibility' },
        ],
    },
    {
        id: 'frontend-apps',
        label: 'Frontend Application Engineering',
        category: 'Root',
        children: [
            { id: 'react-state', label: 'State, Components & UI Architecture' },
            { id: 'routing-data-fetching', label: 'Routing, Fetching & Async UI States' },
            { id: 'web-performance', label: 'Performance, Bundling & UX Polish' },
        ],
    },
    {
        id: 'backend-core',
        label: 'Backend Core',
        category: 'Root',
        children: [
            { id: 'api-design-web', label: 'REST, Validation & API Design' },
            { id: 'server-architecture', label: 'Server Structure, Middleware & Services' },
            { id: 'background-jobs', label: 'Queues, Cron & Background Work' },
        ],
    },
    {
        id: 'data-auth',
        label: 'Data & Auth',
        category: 'Root',
        children: [
            { id: 'database-design-web', label: 'Schema Design & Query Patterns' },
            { id: 'auth-sessions', label: 'Auth, Sessions, Tokens & Roles' },
            { id: 'file-storage-web', label: 'Uploads, CDN & Object Storage' },
        ],
    },
    {
        id: 'quality-ops',
        label: 'Quality & Delivery',
        category: 'Root',
        children: [
            { id: 'testing-quality', label: 'Unit, Integration & E2E Testing' },
            { id: 'observability-web', label: 'Logging, Error Tracking & Analytics' },
            { id: 'deployment-ci', label: 'CI/CD, Environments & Hosting' },
        ],
    },
    {
        id: 'fullstack-architecture',
        label: 'Fullstack Architecture',
        category: 'Root',
        children: [
            { id: 'fullstack-product', label: 'Build Product Features End to End' },
            { id: 'security-hardening-web', label: 'Security, Rate Limits & Abuse Protection' },
            { id: 'scaling-web-apps', label: 'Caching, Scaling & Reliability' },
        ],
    },
];

export const webDevPatterns = [
    {
        id: 'html-css',
        name: 'HTML, CSS & Responsive Layout',
        category: 'Browser Foundations',
        difficulty: 'Easy',
        roadmapPath: '/roadmap/web-dev',
        description: 'Build accessible, semantic, responsive interfaces with modern CSS layout primitives.',
        theory: `The web platform starts with semantics and layout.

Great frontend work comes from understanding how the browser lays out documents, how accessibility tools interpret markup, and how to build flexible UI without brittle hacks.`,
        examples: [
            'Use semantic tags and accessible form markup',
            'Build responsive layouts with flexbox and grid',
            'Create reusable spacing and typography systems',
        ],
        problems: makeProblems('html-css', [
            { id: 'landing-page', title: 'Build a responsive landing page', difficulty: 'Easy' },
            { id: 'dashboard-layout', title: 'Create a responsive dashboard shell', difficulty: 'Medium' },
            { id: 'accessible-form', title: 'Implement an accessible form flow', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'javascript-typescript',
        name: 'JavaScript / TypeScript Core',
        category: 'Browser Foundations',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Understand the language that powers the browser and write safer app logic with modern TypeScript.',
        theory: `Modern web apps live on JavaScript runtime behavior.

Closures, async control flow, modules, and type systems are what let you build interfaces that are maintainable instead of fragile.`,
        examples: [
            'Model UI data safely with TypeScript types',
            'Reason about async code and promise lifecycles',
            'Use modules and objects to organize browser logic',
        ],
        problems: makeProblems('javascript-typescript', [
            { id: 'async-flow', title: 'Refactor callback logic into async flows', difficulty: 'Medium' },
            { id: 'typed-api', title: 'Type a frontend API client', difficulty: 'Medium' },
            { id: 'state-machine', title: 'Model a UI state machine with TypeScript', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'browser-platform',
        name: 'DOM, Events, Forms & Accessibility',
        category: 'Browser Foundations',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Learn the browser event model, form behavior, focus management, and keyboard/screen-reader support.',
        theory: `Frameworks sit on top of the browser, not instead of it.

When you understand events, default behavior, focus, and accessible names, UI bugs become far easier to diagnose and prevent.`,
        examples: [
            'Handle keyboard interactions correctly',
            'Build robust forms with validation and feedback',
            'Debug event bubbling, capturing, and default behavior',
        ],
        problems: makeProblems('browser-platform', [
            { id: 'modal-focus', title: 'Implement accessible modal focus trapping', difficulty: 'Hard' },
            { id: 'form-validation', title: 'Build a validated multi-step form', difficulty: 'Medium' },
            { id: 'event-debug', title: 'Fix an event propagation bug', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'react-state',
        name: 'State, Components & UI Architecture',
        category: 'Frontend Systems',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Structure component trees, state ownership, and reusable UI patterns in a modern frontend app.',
        theory: `Component architecture is mostly a state-ownership problem.

The right question is always: who owns this state, who reads it, and how expensive is it when it changes? Clear answers lead to calm UIs.`,
        examples: [
            'Lift or localize state deliberately',
            'Separate presentational and data-aware components',
            'Design components that stay readable as features grow',
        ],
        problems: makeProblems('react-state', [
            { id: 'wizard-flow', title: 'Build a multi-step onboarding wizard', difficulty: 'Medium' },
            { id: 'shared-state', title: 'Refactor prop-drilling into clearer state ownership', difficulty: 'Medium' },
            { id: 'component-library', title: 'Design reusable card and form primitives', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'routing-data-fetching',
        name: 'Routing, Fetching & Async UI States',
        category: 'Frontend Systems',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Handle navigation, loaders, mutations, optimistic updates, and failure states without confusing the user.',
        theory: `Data fetching is UI design in disguise.

Loading, empty, stale, success, and error states are not edge cases. They are the product. Routing decisions also shape what data should load where and when.`,
        examples: [
            'Model async states explicitly',
            'Prefetch and cache data for smoother navigation',
            'Use optimistic updates carefully and reversibly',
        ],
        problems: makeProblems('routing-data-fetching', [
            { id: 'detail-page', title: 'Build a detail page with loading and error states', difficulty: 'Medium' },
            { id: 'optimistic-toggle', title: 'Implement an optimistic toggle with rollback', difficulty: 'Hard' },
            { id: 'route-prefetch', title: 'Improve route transitions with prefetching', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'web-performance',
        name: 'Performance, Bundling & UX Polish',
        category: 'Frontend Systems',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/web-dev',
        description: 'Reduce bundle cost, speed up rendering, and tune UX around real user performance constraints.',
        theory: `Performance is cumulative.

You have network cost, parse cost, hydration cost, rendering cost, and interaction cost. The best optimizations come from measuring which one is actually hurting the experience.`,
        examples: [
            'Split bundles around route boundaries',
            'Reduce unnecessary rerenders',
            'Optimize images, fonts, and expensive interactions',
        ],
        problems: makeProblems('web-performance', [
            { id: 'bundle-audit', title: 'Shrink an oversized JavaScript bundle', difficulty: 'Hard' },
            { id: 'render-hotspot', title: 'Diagnose and fix a rerender hotspot', difficulty: 'Hard' },
            { id: 'core-web-vitals', title: 'Improve a page for Core Web Vitals', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'api-design-web',
        name: 'REST, Validation & API Design',
        category: 'Backend Services',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Build backend endpoints with clean contracts, validation, pagination, and predictable error behavior.',
        theory: `Backend APIs should be boring in the best way.

Clients move faster when contracts are stable, validation is consistent, and error responses are actionable. Good API design reduces frontend guesswork and future migration pain.`,
        examples: [
            'Validate data at the boundary',
            'Use consistent response and error shapes',
            'Design endpoints around real frontend workflows',
        ],
        problems: makeProblems('api-design-web', [
            { id: 'crud-api', title: 'Build a validated CRUD API', difficulty: 'Medium' },
            { id: 'pagination-api', title: 'Add cursor-based pagination to a list endpoint', difficulty: 'Medium' },
            { id: 'rate-limited-endpoint', title: 'Protect a public API endpoint with limits', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'server-architecture',
        name: 'Server Structure, Middleware & Services',
        category: 'Backend Services',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Organize server code into routes, services, repositories, jobs, and shared infrastructure.',
        theory: `Most backend maintenance cost comes from structure, not syntax.

Clear layering helps isolate business rules from transport and infrastructure details. That makes testing easier and future rewrites less painful.`,
        examples: [
            'Separate HTTP handlers from domain logic',
            'Centralize cross-cutting concerns in middleware',
            'Use service boundaries to keep code navigable',
        ],
        problems: makeProblems('server-architecture', [
            { id: 'layered-refactor', title: 'Refactor an API into layered modules', difficulty: 'Medium' },
            { id: 'middleware-stack', title: 'Add auth, logging, and validation middleware', difficulty: 'Medium' },
            { id: 'service-extraction', title: 'Extract payment logic into a service layer', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'database-design-web',
        name: 'Schema Design & Query Patterns',
        category: 'Data and Identity',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Design schemas, indexes, relations, and query patterns that support real product usage.',
        theory: `A web app database should reflect access patterns, not just nouns in the product brief.

If your schema and query layer match the read and write paths well, features stay fast and simpler to evolve.`,
        examples: [
            'Model users, teams, permissions, and activity cleanly',
            'Use indexes around the hottest lookups',
            'Avoid N+1 and unbounded query patterns',
        ],
        problems: makeProblems('database-design-web', [
            { id: 'team-schema', title: 'Design a team membership schema', difficulty: 'Medium' },
            { id: 'activity-feed-query', title: 'Optimize activity feed queries', difficulty: 'Hard' },
            { id: 'index-review', title: 'Choose indexes for a reporting screen', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'auth-sessions',
        name: 'Auth, Sessions, Tokens & Roles',
        category: 'Data and Identity',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Implement login, session management, roles, protected routes, and secure identity flows.',
        theory: `Authentication proves identity. Authorization decides access. Session strategy determines how often the rest of your app has to think about both.

The more explicit your auth model is, the fewer hidden security bugs you ship.`,
        examples: [
            'Protect pages and API routes consistently',
            'Choose between session cookies and token flows',
            'Model roles and permissions clearly',
        ],
        problems: makeProblems('auth-sessions', [
            { id: 'session-auth', title: 'Implement session-based login', difficulty: 'Medium' },
            { id: 'rbac-routes', title: 'Protect admin routes with RBAC', difficulty: 'Medium' },
            { id: 'token-refresh', title: 'Add refresh token rotation safely', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'testing-quality',
        name: 'Unit, Integration & E2E Testing',
        category: 'Delivery Quality',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Test frontend and backend behavior across components, services, and full user journeys.',
        theory: `Web testing works best as a layered strategy.

Fast unit tests keep logic safe, integration tests protect boundaries, and E2E tests cover critical user flows. Each layer should catch a different class of failure.`,
        examples: [
            'Test forms, loaders, and mutations at the UI layer',
            'Verify API boundaries with integration tests',
            'Protect signup, checkout, and dashboard flows end to end',
        ],
        problems: makeProblems('testing-quality', [
            { id: 'component-tests', title: 'Write component tests for a search form', difficulty: 'Easy' },
            { id: 'api-integration', title: 'Test an API with database fixtures', difficulty: 'Medium' },
            { id: 'critical-e2e', title: 'Automate the primary user journey end to end', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'deployment-ci',
        name: 'CI/CD, Environments & Hosting',
        category: 'Delivery Quality',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/web-dev',
        description: 'Ship changes safely through preview environments, CI checks, production deploys, and rollback strategies.',
        theory: `Deployment quality is product quality.

Teams with good environment hygiene and CI discipline catch issues earlier, recover faster, and spend less time debugging "works on my machine" failures.`,
        examples: [
            'Use environment-specific config safely',
            'Automate build, test, and deploy checks',
            'Ship previews before production rollouts',
        ],
        problems: makeProblems('deployment-ci', [
            { id: 'preview-env', title: 'Set up preview deployments for pull requests', difficulty: 'Medium' },
            { id: 'pipeline-gates', title: 'Add quality gates to CI', difficulty: 'Medium' },
            { id: 'rollback-plan', title: 'Prepare a rollback plan for production deploys', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'fullstack-product',
        name: 'Build Product Features End to End',
        category: 'Product Architecture',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/web-dev',
        description: 'Connect UX, APIs, data, auth, and operations into features that feel cohesive in production.',
        theory: `Fullstack skill is synthesis.

You need enough frontend, backend, data, and operational judgment to make product tradeoffs quickly without building brittle systems.`,
        examples: [
            'Ship a feature from schema to UI polish',
            'Balance delivery speed with maintainability',
            'Anticipate edge cases across the stack',
        ],
        problems: makeProblems('fullstack-product', [
            { id: 'team-invite-flow', title: 'Build a team invite feature end to end', difficulty: 'Hard' },
            { id: 'billing-settings', title: 'Implement billing settings across UI and API', difficulty: 'Hard' },
            { id: 'admin-audit-log', title: 'Ship an admin audit log feature', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'security-hardening-web',
        name: 'Security, Rate Limits & Abuse Protection',
        category: 'Product Architecture',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/web-dev',
        description: 'Protect web apps from common attacks with validation, output safety, rate limits, and secure defaults.',
        theory: `Web security is mostly disciplined design.

Validate input, escape output, scope permissions tightly, and make abusive traffic expensive. Security is easiest to maintain when the defaults are already safe.`,
        examples: [
            'Prevent XSS and injection through safe rendering and validation',
            'Apply rate limits to sensitive public endpoints',
            'Audit auth and privilege boundaries in admin flows',
        ],
        problems: makeProblems('security-hardening-web', [
            { id: 'login-abuse', title: 'Protect login against brute-force abuse', difficulty: 'Hard' },
            { id: 'xss-review', title: 'Audit and fix unsafe rendering paths', difficulty: 'Hard' },
            { id: 'upload-guard', title: 'Secure a file upload endpoint', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'scaling-web-apps',
        name: 'Caching, Scaling & Reliability',
        category: 'Product Architecture',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/web-dev',
        description: 'Prepare web apps for growth with caching, async work, horizontal scale, and graceful failure handling.',
        theory: `A successful web app becomes a distributed systems problem sooner than most teams expect.

Scaling well means identifying hotspots, moving expensive work off the request path, and designing for partial failure instead of pretending it will not happen.`,
        examples: [
            'Cache expensive read paths',
            'Move heavy work into background jobs',
            'Degrade gracefully under traffic spikes',
        ],
        problems: makeProblems('scaling-web-apps', [
            { id: 'feed-caching', title: 'Scale a personalized feed with caching', difficulty: 'Hard' },
            { id: 'job-offload', title: 'Offload image processing from the request path', difficulty: 'Medium' },
            { id: 'spike-plan', title: 'Plan for a sudden traffic spike on launch day', difficulty: 'Hard' },
        ]),
    },
];
