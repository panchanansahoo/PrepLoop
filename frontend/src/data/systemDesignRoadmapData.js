const makeProblems = (prefix, problems) =>
    problems.map((problem) => ({
        status: 'pending',
        difficulty: 'Medium',
        ...problem,
        id: `${prefix}-${problem.id}`,
        link: `/problems/${prefix}-${problem.id}`,
    }));

export const systemDesignRoadmapHierarchy = [
    {
        id: 'requirements-estimation',
        label: 'Requirements & Estimation',
        category: 'Root',
        children: [
            { id: 'functional-scope', label: 'Functional vs Non-Functional Requirements' },
            { id: 'capacity-planning', label: 'Traffic, QPS & Storage Estimation' },
            { id: 'sla-slo', label: 'Latency, Availability & SLOs' },
        ],
    },
    {
        id: 'api-boundaries',
        label: 'APIs & Service Boundaries',
        category: 'Root',
        children: [
            { id: 'api-design', label: 'API Contracts & Idempotency' },
            { id: 'service-decomposition', label: 'Service Boundaries & Ownership' },
            { id: 'communication-patterns', label: 'Sync vs Async Communication' },
        ],
    },
    {
        id: 'data-layer',
        label: 'Data Layer',
        category: 'Root',
        children: [
            { id: 'storage-modeling', label: 'SQL, NoSQL & Data Modeling' },
            { id: 'indexing-partitioning', label: 'Indexing, Sharding & Partitioning' },
            { id: 'consistency-tradeoffs', label: 'Consistency, Replication & Transactions' },
        ],
    },
    {
        id: 'scale-reliability',
        label: 'Scale & Reliability',
        category: 'Root',
        children: [
            { id: 'load-balancing', label: 'Load Balancing & Horizontal Scale' },
            { id: 'caching-cdn', label: 'Caching, CDN & Hot Path Optimization' },
            { id: 'reliability-patterns', label: 'Retries, Timeouts & Circuit Breakers' },
        ],
    },
    {
        id: 'async-systems',
        label: 'Async & Distributed Systems',
        category: 'Root',
        children: [
            { id: 'messaging-queues', label: 'Queues, Streams & Event-Driven Flows' },
            { id: 'background-workflows', label: 'Batch Jobs, Workers & Sagas' },
            { id: 'distributed-coordination', label: 'Locks, Consensus & Leader Election' },
        ],
    },
    {
        id: 'operations-security',
        label: 'Operations & Security',
        category: 'Root',
        children: [
            { id: 'observability-slos', label: 'Metrics, Logs, Traces & On-Call' },
            { id: 'security-authz', label: 'Authentication, Authorization & Secrets' },
            { id: 'deployments-recovery', label: 'Deployments, Rollbacks & DR' },
        ],
    },
    {
        id: 'case-studies',
        label: 'Applied Case Studies',
        category: 'Root',
        children: [
            { id: 'timeline-feed', label: 'Design a Timeline / Feed' },
            { id: 'chat-notifications', label: 'Design Chat & Notifications' },
            { id: 'file-storage-media', label: 'Design File Storage / Media Pipeline' },
        ],
    },
];

export const systemDesignPatterns = [
    {
        id: 'requirements-estimation',
        name: 'Requirements & Estimation',
        category: 'System Design Foundations',
        difficulty: 'Easy',
        roadmapPath: '/roadmap/system-design',
        description: 'Start designs by clarifying product goals, constraints, scale assumptions, and success metrics.',
        theory: `Strong system design starts before architecture diagrams.

If you miss the workload shape, latency goals, durability needs, or product constraints, even elegant designs can be wrong. Estimation gives you the rough order of magnitude needed to choose sane components.`,
        examples: [
            'Estimate requests per second and storage growth',
            'Clarify read-heavy versus write-heavy behavior',
            'Translate product expectations into engineering constraints',
        ],
        problems: makeProblems('requirements-estimation', [
            { id: 'photo-app', title: 'Estimate scale for a photo sharing app', difficulty: 'Easy' },
            { id: 'bottleneck-guess', title: 'Identify likely bottlenecks from traffic assumptions', difficulty: 'Medium' },
            { id: 'slo-draft', title: 'Draft an SLO sheet for a core user journey', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'api-design',
        name: 'API Contracts & Idempotency',
        category: 'Service Interfaces',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Design APIs that are explicit, evolvable, and safe under retries and partial failures.',
        theory: `APIs are long-lived promises between systems.

Good API design covers resource modeling, pagination, versioning, and validation. These details matter most when clients retry, fail halfway through, or evolve independently.`,
        examples: [
            'Design safe create endpoints with idempotency keys',
            'Choose stable response contracts and pagination models',
            'Model errors and retry semantics clearly',
        ],
        problems: makeProblems('api-design', [
            { id: 'payments-api', title: 'Design an idempotent payments API', difficulty: 'Medium' },
            { id: 'pagination', title: 'Compare cursor and offset pagination', difficulty: 'Medium' },
            { id: 'versioning', title: 'Plan an API version migration', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'service-decomposition',
        name: 'Service Boundaries & Ownership',
        category: 'Service Interfaces',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Split systems into components that align with business capabilities, team ownership, and failure isolation.',
        theory: `Service boundaries should reflect change patterns, ownership, and data coupling.

Over-splitting creates operational drag. Under-splitting slows teams and couples deployments. The right boundary is the one that localizes change and keeps contracts manageable.`,
        examples: [
            'Separate billing from user profile concerns',
            'Define clear ownership between teams',
            'Reduce cross-service chatty calls',
        ],
        problems: makeProblems('service-decomposition', [
            { id: 'monolith-cut', title: 'Propose service boundaries for a monolith split', difficulty: 'Medium' },
            { id: 'shared-schema', title: 'Untangle a shared-database ownership problem', difficulty: 'Hard' },
            { id: 'team-topology', title: 'Align service ownership to team structure', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'storage-modeling',
        name: 'SQL, NoSQL & Data Modeling',
        category: 'Storage Systems',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Choose storage engines and data models based on access patterns, scale, consistency needs, and product constraints.',
        theory: `Database choice is query-shape choice.

Relational systems shine where integrity and rich querying matter. NoSQL systems trade some flexibility or consistency for scale, throughput, or simpler access patterns. Model for reads and writes you actually need.`,
        examples: [
            'Map entities and relationships to product flows',
            'Choose normalized versus denormalized data models',
            'Balance transaction needs against scale requirements',
        ],
        problems: makeProblems('storage-modeling', [
            { id: 'catalog-schema', title: 'Model data for an ecommerce catalog', difficulty: 'Medium' },
            { id: 'timeline-store', title: 'Pick storage for a social feed timeline', difficulty: 'Hard' },
            { id: 'audit-log', title: 'Store append-only audit data efficiently', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'consistency-tradeoffs',
        name: 'Consistency, Replication & Transactions',
        category: 'Storage Systems',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/system-design',
        description: 'Reason about eventual consistency, quorum behavior, replication lag, and transactional guarantees.',
        theory: `Distributed data systems force tradeoffs.

You rarely get perfect latency, availability, and consistency all at once. The right answer depends on which incorrect behavior the product can tolerate and for how long.`,
        examples: [
            'Choose eventual consistency for non-critical counters',
            'Protect critical writes with stronger guarantees',
            'Explain replication lag impact on user experience',
        ],
        problems: makeProblems('consistency-tradeoffs', [
            { id: 'inventory-reservation', title: 'Design inventory reservation with consistency guarantees', difficulty: 'Hard' },
            { id: 'replica-read', title: 'Handle stale reads from replicas', difficulty: 'Medium' },
            { id: 'cross-service-transaction', title: 'Compare saga and transactional outbox approaches', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'load-balancing',
        name: 'Load Balancing & Horizontal Scale',
        category: 'Traffic & Reliability',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Distribute traffic across instances and regions while keeping latency, utilization, and availability under control.',
        theory: `Scaling out is more than adding servers.

You need a plan for session affinity, health checks, failover, and bottleneck movement. Every scaled layer shifts pressure somewhere else.`,
        examples: [
            'Move state out of app servers for easier scaling',
            'Use health checks and graceful draining during deploys',
            'Reason about regional versus zonal balancing',
        ],
        problems: makeProblems('load-balancing', [
            { id: 'session-state', title: 'Scale a stateful web tier safely', difficulty: 'Medium' },
            { id: 'regional-failover', title: 'Plan traffic failover between regions', difficulty: 'Hard' },
            { id: 'balancer-choice', title: 'Choose L4 versus L7 balancing for a service', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'caching-cdn',
        name: 'Caching, CDN & Hot Path Optimization',
        category: 'Traffic & Reliability',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Reduce latency and database pressure by caching the right data at the right layer.',
        theory: `Caching works when you are honest about invalidation and freshness.

Browser caches, CDNs, application caches, and database caches solve different problems. Pick the layer closest to the repeated work you want to avoid.`,
        examples: [
            'Use CDN for static and media-heavy assets',
            'Cache read-heavy API responses with explicit TTLs',
            'Prevent stampedes with locking or jittered refresh',
        ],
        problems: makeProblems('caching-cdn', [
            { id: 'product-page', title: 'Design caching for a product detail page', difficulty: 'Medium' },
            { id: 'cache-invalidation', title: 'Handle invalidation after admin updates', difficulty: 'Hard' },
            { id: 'stampede', title: 'Protect a hot key from cache stampede', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'reliability-patterns',
        name: 'Retries, Timeouts & Circuit Breakers',
        category: 'Traffic & Reliability',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/system-design',
        description: 'Contain failures with backoff, deadlines, bulkheads, graceful degradation, and resilient client behavior.',
        theory: `Distributed failures are normal, not exceptional.

Reliability patterns prevent one failing dependency from collapsing everything else. The subtle part is making retries safe and knowing when to stop retrying.`,
        examples: [
            'Bound retry storms with timeouts and budgets',
            'Degrade non-critical features during incidents',
            'Prevent dependency failure cascades',
        ],
        problems: makeProblems('reliability-patterns', [
            { id: 'retry-policy', title: 'Define a safe retry policy for an external API', difficulty: 'Hard' },
            { id: 'breaker-rollout', title: 'Add a circuit breaker to a flaky dependency', difficulty: 'Medium' },
            { id: 'degraded-mode', title: 'Design graceful degradation for recommendations', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'messaging-queues',
        name: 'Queues, Streams & Event-Driven Flows',
        category: 'Distributed Workflows',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/system-design',
        description: 'Use asynchronous pipelines to decouple producers and consumers and smooth bursty workloads.',
        theory: `Queues and streams turn time into a design tool.

They help absorb spikes, isolate failures, and enable independent scaling, but they also introduce ordering, duplication, and observability concerns.`,
        examples: [
            'Buffer background work behind queues',
            'Publish domain events for downstream consumers',
            'Design for at-least-once delivery semantics',
        ],
        problems: makeProblems('messaging-queues', [
            { id: 'email-pipeline', title: 'Design a reliable email delivery pipeline', difficulty: 'Medium' },
            { id: 'event-ordering', title: 'Handle ordering-sensitive consumer logic', difficulty: 'Hard' },
            { id: 'dead-letter', title: 'Build a dead-letter and retry strategy', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'observability-slos',
        name: 'Observability, Metrics & On-Call',
        category: 'Operations Readiness',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Measure what matters with logs, metrics, traces, dashboards, alerting, and service-level objectives.',
        theory: `You cannot operate what you cannot see.

Observability is not just instrumentation volume. It is about mapping signals to user-impacting questions so incidents are diagnosable under pressure.`,
        examples: [
            'Define SLIs for latency and availability',
            'Use traces to isolate cross-service bottlenecks',
            'Alert on symptoms users feel, not every internal spike',
        ],
        problems: makeProblems('observability-slos', [
            { id: 'checkout-sli', title: 'Define SLIs for a checkout service', difficulty: 'Medium' },
            { id: 'trace-gap', title: 'Close an observability gap in a multi-service flow', difficulty: 'Medium' },
            { id: 'alert-tuning', title: 'Tune noisy alerts with SLO thinking', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'security-authz',
        name: 'Authentication, Authorization & Secrets',
        category: 'Operations Readiness',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Protect services with strong identity, least privilege, secure secret handling, and layered controls.',
        theory: `Security architecture is easiest to get right when it is part of the design from day one.

Identity, authorization boundaries, key rotation, and auditability should shape the architecture, not be bolted on later.`,
        examples: [
            'Separate authentication from fine-grained authorization',
            'Store secrets outside application code',
            'Protect internal services with least-privilege credentials',
        ],
        problems: makeProblems('security-authz', [
            { id: 'rbac-design', title: 'Design RBAC for an admin platform', difficulty: 'Medium' },
            { id: 'secret-rotation', title: 'Rotate secrets without downtime', difficulty: 'Medium' },
            { id: 'service-auth', title: 'Secure service-to-service calls', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'deployments-recovery',
        name: 'Deployments, Rollbacks & Disaster Recovery',
        category: 'Operations Readiness',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/system-design',
        description: 'Ship safely with blue-green or canary strategies, rollback plans, backups, and recovery drills.',
        theory: `Deployment is part of design because operational risk changes architecture decisions.

Recovery readiness means more than backups. You need tested restore paths, clear rollback signals, and the ability to limit blast radius during change.`,
        examples: [
            'Use progressive rollout for risky releases',
            'Validate rollback paths before incidents',
            'Plan backup and restore around RPO and RTO targets',
        ],
        problems: makeProblems('deployments-recovery', [
            { id: 'canary-plan', title: 'Draft a canary rollout plan for a core API', difficulty: 'Medium' },
            { id: 'restore-drill', title: 'Plan a database restore exercise', difficulty: 'Hard' },
            { id: 'multi-region-dr', title: 'Design disaster recovery for regional outage', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'case-study-design',
        name: 'Applied Design Case Studies',
        category: 'Design Synthesis',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/system-design',
        description: 'Bring the concepts together by designing real systems such as feeds, chat, search, and media pipelines.',
        theory: `Case studies test synthesis.

The hardest part is not knowing individual components; it is combining them under constraints, justifying tradeoffs, and communicating a design clearly.`,
        examples: [
            'Walk from requirements through component choices',
            'Identify the likely bottleneck for each architecture',
            'Defend tradeoffs instead of chasing perfect systems',
        ],
        problems: makeProblems('case-study-design', [
            { id: 'news-feed', title: 'Design a social news feed end to end', difficulty: 'Hard' },
            { id: 'chat-system', title: 'Design real-time chat with presence and delivery', difficulty: 'Hard' },
            { id: 'media-processing', title: 'Design an upload and media processing pipeline', difficulty: 'Hard' },
        ]),
    },
];
