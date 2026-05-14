// System Design Learning Path — 20 Topics across 6 Phases
export const SD_PHASES = [
  { id: 'fundamentals', name: 'Phase 1: Fundamentals', color: '#818cf8', icon: '🧱' },
  { id: 'data-apis', name: 'Phase 2: Data & APIs', color: '#34d399', icon: '🔌' },
  { id: 'scalability', name: 'Phase 3: Scalability Patterns', color: '#f59e0b', icon: '📈' },
  { id: 'distributed', name: 'Phase 4: Distributed Systems', color: '#ef4444', icon: '🌐' },
  { id: 'cloud-native', name: 'Phase 5: Cloud-Native', color: '#06b6d4', icon: '☁️' },
  { id: 'ai-native', name: 'Phase 6: AI-Native Systems', color: '#f472b6', icon: '🤖' },
  { id: 'security-trust', name: 'Phase 7: Security & Trust', color: '#f59e0b', icon: '🔒' },
  { id: 'realtime-systems', name: 'Phase 8: Real-Time Systems', color: '#22c55e', icon: '⚡' },
  { id: 'data-pipelines', name: 'Phase 9: Data Pipelines & Storage', color: '#8b5cf6', icon: '🔄' },
  { id: 'design-approaches', name: 'Phase 10: Design Patterns & Approaches', color: '#0ea5e9', icon: '🏗️' },
  { id: 'case-studies', name: 'Phase 11: Case Study Architectures', color: '#e11d48', icon: '📋' },
];

export const SD_TOPICS = [
  // ═══════════════ PHASE 1: FUNDAMENTALS ═══════════════
  {
    id: 'scalability-basics', title: 'Scalability & Performance', stage: 'fundamentals',
    icon: '📊', color: '#818cf8', difficulty: 'Beginner', estimatedTime: '2–3 hours',
    description: 'Vertical vs horizontal scaling, latency, throughput, P99, and performance fundamentals.',
    concepts: [
      { title: 'Scaling Approaches', points: ['Vertical scaling (scale up): add more CPU/RAM to one machine', 'Horizontal scaling (scale out): add more machines behind a load balancer', 'Vertical has a ceiling; horizontal is theoretically unlimited but adds complexity', 'Stateless services scale horizontally easily; stateful services need special handling'] },
      { title: 'Performance Metrics', points: ['Latency: time for one request (P50 = median, P95, P99 = tail)', 'Throughput: requests per second (RPS) the system handles', 'Availability: uptime percentage (99.9% = 8.7h downtime/year)', 'Durability: probability data is not lost (11 nines for S3)'] },
    ],
    invariants: ['Horizontal scaling requires stateless design or distributed state', 'P99 latency matters more than P50 for user experience', '99.99% availability = 4.3 minutes downtime per month'],
    thinkingFramework: [
      { condition: 'Traffic growing 10x', action: 'Think horizontal scaling + load balancer' },
      { condition: 'Single server bottleneck', action: 'Scale vertically first (cheaper), then horizontally' },
      { condition: 'Latency-sensitive path', action: 'Add caching, reduce network hops, use CDN' },
      { condition: 'Need high availability', action: 'Redundancy + failover + health checks' },
    ],
    tricks: [
      { name: 'Start Simple', tip: 'Scale vertically first. Don\'t prematurely distribute — it adds massive complexity.', when: 'Early stage, traffic < 10K RPS', avoid: 'When already on max instance size' },
      { name: 'Amdahl\'s Law', tip: 'Parallelizing only helps the parallelizable portion. 5% serial code limits overall speedup to 20x max.', when: 'Discussing scaling limits', avoid: 'N/A' },
    ],
    pitfalls: ['Over-engineering for scale before you need it', 'Ignoring tail latency (P99)', 'Not measuring before optimizing', 'Forgetting that network is unreliable'],
    keyDesigns: [
      { title: 'URL Shortener', difficulty: 'Easy', focus: 'Read-heavy, simple scaling' },
      { title: 'Paste Bin', difficulty: 'Easy', focus: 'Object storage, TTL, CDN' },
    ]
  },
  {
    id: 'cap-consistency', title: 'CAP Theorem & Consistency', stage: 'fundamentals',
    icon: '⚖️', color: '#a78bfa', difficulty: 'Beginner', estimatedTime: '2 hours',
    description: 'CAP theorem, PACELC, consistency models (strong, eventual, causal), and real-world tradeoffs.',
    concepts: [
      { title: 'CAP Theorem', points: ['In a distributed system, during a network partition, you must choose:', 'CP (Consistency + Partition tolerance): reject requests rather than serve stale data', 'AP (Availability + Partition tolerance): serve stale data rather than reject', 'CA is impossible in truly distributed systems (partition always possible)', 'Examples: CP = HBase, MongoDB (default), Spanner | AP = Cassandra, DynamoDB, CouchDB'] },
      { title: 'PACELC Extension', points: ['When Partitioned: choose A or C (same as CAP)', 'Else (no partition): choose Latency or Consistency', 'PA/EL = DynamoDB (availability + low latency, eventual consistency)', 'PC/EC = traditional RDBMS (consistency always, accept higher latency)'] },
    ],
    invariants: ['You cannot have all three of C, A, P simultaneously during a partition', 'Most real systems offer tunable consistency per operation', 'Strong consistency ≠ immediate — it means linearizable reads'],
    thinkingFramework: [
      { condition: 'Financial transactions', action: 'Choose CP — cannot tolerate inconsistent balances' },
      { condition: 'Social media feed', action: 'Choose AP — eventual consistency is fine, availability matters' },
      { condition: 'User sessions / shopping cart', action: 'AP with conflict resolution (last-writer-wins or merge)' },
      { condition: 'Inventory / booking systems', action: 'CP for critical paths (stock check), AP for reads (catalog)' },
    ],
    tricks: [
      { name: 'Tunable Consistency', tip: 'Many databases offer per-query consistency levels. Use strong only where needed.', when: 'Designing multi-region systems', avoid: 'N/A' },
    ],
    pitfalls: ['Thinking CAP means you always lose one of C/A/P — it only applies during partitions', 'Confusing consistency in CAP (linearizability) with consistency in ACID (data integrity)', 'Assuming eventual consistency means "will be consistent soon" — it means "eventually"'],
    keyDesigns: [
      { title: 'Distributed Key-Value Store', difficulty: 'Medium', focus: 'Consistency vs availability tradeoffs' },
    ]
  },
  {
    id: 'load-balancing', title: 'Load Balancing & Reverse Proxy', stage: 'fundamentals',
    icon: '⚡', color: '#22d3ee', difficulty: 'Beginner', estimatedTime: '2 hours',
    description: 'L4 vs L7 load balancing, algorithms (round-robin, least connections, consistent hashing), health checks.',
    concepts: [
      { title: 'Load Balancer Types', points: ['L4 (Transport): routes based on IP/port, fast, protocol-agnostic', 'L7 (Application): routes based on HTTP headers/URL/cookies, smarter', 'Hardware LB: F5, Citrix — expensive, high throughput', 'Software LB: Nginx, HAProxy, AWS ALB/NLB — flexible, scalable'] },
      { title: 'Algorithms', points: ['Round Robin: simple rotation, works when servers are equal', 'Weighted Round Robin: assign weights based on server capacity', 'Least Connections: send to server with fewest active connections', 'IP Hash: same client always goes to same server (session affinity)', 'Consistent Hashing: minimize re-mapping when servers join/leave'] },
    ],
    invariants: ['LB is a single point of failure → use active-passive LB pair', 'Health checks must be fast and accurate to avoid routing to dead servers', 'Session affinity breaks horizontal scaling — prefer stateless + external session store'],
    thinkingFramework: [
      { condition: 'Simple stateless API', action: 'Round robin behind ALB/NLB' },
      { condition: 'WebSocket / long-lived connections', action: 'Least connections algorithm' },
      { condition: 'Need session stickiness', action: 'IP hash or cookie-based routing (but prefer stateless)' },
      { condition: 'Cache servers / distributed hash table', action: 'Consistent hashing to minimize cache misses on scale events' },
    ],
    tricks: [
      { name: 'DNS-based LB', tip: 'Use DNS Round Robin for global distribution, then L7 LB per region for server-level distribution.', when: 'Multi-region deployments', avoid: 'Latency-sensitive single-region apps' },
    ],
    pitfalls: ['Not setting up health checks → routing traffic to dead servers', 'Session affinity creating hotspots', 'Forgetting that the LB itself needs to be redundant'],
    keyDesigns: [
      { title: 'Rate Limiter', difficulty: 'Medium', focus: 'Distributed rate limiting across LB fleet' },
    ]
  },
  {
    id: 'caching-strategies', title: 'Caching Strategies', stage: 'fundamentals',
    icon: '💾', color: '#fb923c', difficulty: 'Beginner–Medium', estimatedTime: '3 hours',
    description: 'Cache-aside, write-through, write-back, read-through, cache invalidation, TTL, eviction policies.',
    concepts: [
      { title: 'Caching Patterns', points: ['Cache-Aside (Lazy): app checks cache → miss → read DB → populate cache', 'Read-Through: cache itself fetches from DB on miss (transparent to app)', 'Write-Through: write to cache + DB synchronously (consistent but slower writes)', 'Write-Back (Write-Behind): write to cache, async flush to DB (fast writes, risk of data loss)', 'Write-Around: write directly to DB, cache only on read (avoids cache pollution)'] },
      { title: 'Cache Levels', points: ['L1: In-process cache (HashMap, Guava) — fastest, per-instance', 'L2: Distributed cache (Redis, Memcached) — shared across instances', 'CDN: Edge cache for static assets — closest to user', 'Browser cache: HTTP cache headers (Cache-Control, ETag)'] },
    ],
    invariants: ['Cache invalidation is one of the two hard problems in CS', 'TTL provides eventual consistency between cache and source of truth', 'Cache hit ratio > 90% means caching is effective; < 70% means rethink strategy'],
    thinkingFramework: [
      { condition: 'Read-heavy, rarely updated data', action: 'Cache-aside with long TTL' },
      { condition: 'Need strong consistency', action: 'Write-through or no cache on the write path' },
      { condition: 'High write throughput needed', action: 'Write-back with async flush (accept some data loss risk)' },
      { condition: 'Static assets (images, JS, CSS)', action: 'CDN with cache busting (versioned URLs)' },
      { condition: 'User session data', action: 'Redis with TTL matching session timeout' },
    ],
    tricks: [
      { name: 'Cache Stampede Prevention', tip: 'Use mutex/lock so only one request fetches from DB on cache miss; others wait. Or use stale-while-revalidate.', when: 'High traffic on popular keys', avoid: 'Low-traffic systems' },
      { name: 'Hot Key Solution', tip: 'Replicate hot keys across multiple cache shards or add local in-process cache as L1.', when: 'Celebrity post, viral content', avoid: 'Uniform access patterns' },
    ],
    pitfalls: ['Caching mutable data without invalidation strategy', 'Cache avalanche — all TTLs expire at same time (use jittered TTL)', 'Not considering cache warmup on cold start', 'Over-caching — adding cache for data that changes every request'],
    keyDesigns: [
      { title: 'Twitter Timeline', difficulty: 'Medium', focus: 'Fan-out, timeline caching' },
      { title: 'Leaderboard System', difficulty: 'Medium', focus: 'Redis sorted sets, cache invalidation' },
    ]
  },
  // ═══════════════ PHASE 2: DATA & APIs ═══════════════
  {
    id: 'database-fundamentals', title: 'Database Fundamentals', stage: 'data-apis',
    icon: '🗄️', color: '#34d399', difficulty: 'Beginner–Medium', estimatedTime: '3–4 hours',
    description: 'SQL vs NoSQL, ACID vs BASE, normalization, indexing, transactions, and choosing the right database.',
    concepts: [
      { title: 'SQL vs NoSQL', points: ['SQL (Relational): structured schema, ACID, joins, mature tooling — Postgres, MySQL', 'NoSQL Document: flexible schema, nested data, horizontal scaling — MongoDB, DynamoDB', 'NoSQL Key-Value: ultra-fast lookups, simple model — Redis, Memcached', 'NoSQL Column-Family: wide columns, time-series — Cassandra, HBase', 'NoSQL Graph: relationships first-class — Neo4j, Amazon Neptune'] },
      { title: 'ACID vs BASE', points: ['ACID: Atomicity, Consistency, Isolation, Durability — strong guarantees', 'BASE: Basically Available, Soft state, Eventual consistency — scalable', 'ACID for financial/critical data; BASE for social/analytics/logs', 'Trade-off: ACID limits horizontal scaling; BASE enables it'] },
    ],
    invariants: ['B-tree index: O(log n) lookup, great for range queries', 'Denormalization trades write complexity for read performance', 'Connection pooling is essential — creating connections is expensive (1-10ms each)'],
    thinkingFramework: [
      { condition: 'Complex relationships, joins, transactions', action: 'Relational DB (Postgres)' },
      { condition: 'Flexible schema, rapid iteration', action: 'Document DB (MongoDB)' },
      { condition: 'Ultra-low latency lookups, caching', action: 'Key-Value (Redis)' },
      { condition: 'High write throughput, time-series', action: 'Column-Family (Cassandra)' },
      { condition: 'Relationship-heavy queries (social graph)', action: 'Graph DB (Neo4j)' },
    ],
    tricks: [
      { name: 'EXPLAIN ANALYZE', tip: 'Always analyze query plans before optimizing. The database might not be using your index.', when: 'Every slow query investigation', avoid: 'N/A' },
      { name: 'Composite Index Order', tip: 'Put equality columns first, then range columns. Index on (status, created_at) not (created_at, status).', when: 'Multi-column queries', avoid: 'N/A' },
    ],
    pitfalls: ['Choosing NoSQL because it is "trendy" when SQL fits better', 'Not adding indexes on frequently queried columns', 'N+1 query problem — use JOINs or batch fetches', 'Not using connection pooling'],
    keyDesigns: [
      { title: 'E-Commerce Product Catalog', difficulty: 'Medium', focus: 'Schema design, indexing, search' },
    ]
  },
  {
    id: 'api-design', title: 'API Design (REST, gRPC, GraphQL)', stage: 'data-apis',
    icon: '🔌', color: '#60a5fa', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'RESTful API design, gRPC for microservices, GraphQL for flexible queries, pagination, versioning.',
    concepts: [
      { title: 'REST', points: ['Resource-oriented: /users, /users/123, /users/123/posts', 'HTTP verbs: GET (read), POST (create), PUT (replace), PATCH (update), DELETE', 'Stateless: each request contains all info needed', 'Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error'] },
      { title: 'gRPC vs GraphQL', points: ['gRPC: binary protocol (Protobuf), strongly typed, fast — ideal for service-to-service', 'GraphQL: client specifies exactly what data it needs — reduces over/under-fetching', 'REST: simple, cacheable, widely understood — ideal for public APIs', 'Use REST for external APIs, gRPC for internal microservices, GraphQL for complex frontends'] },
    ],
    invariants: ['Idempotent operations (GET, PUT, DELETE) are safe to retry', 'POST is not idempotent — use idempotency keys for critical operations', 'Pagination prevents unbounded response sizes'],
    thinkingFramework: [
      { condition: 'Public API for third parties', action: 'REST with versioning (v1, v2)' },
      { condition: 'Internal service-to-service communication', action: 'gRPC for speed + type safety' },
      { condition: 'Mobile app with variable data needs', action: 'GraphQL to avoid over-fetching' },
      { condition: 'Real-time data streaming', action: 'WebSocket or gRPC bidirectional streaming' },
    ],
    tricks: [
      { name: 'Cursor Pagination', tip: 'Use cursor-based pagination (after=<lastId>) instead of offset. Offset is O(n) on the DB.', when: 'Large datasets, infinite scroll', avoid: 'Small fixed datasets where offset is fine' },
      { name: 'Idempotency Key', tip: 'For POST endpoints (payments, orders), accept an idempotency key header. Return cached result on retry.', when: 'Any non-idempotent mutation', avoid: 'N/A' },
    ],
    pitfalls: ['Not versioning your API', 'Returning entire objects when clients need 2 fields (over-fetching)', 'Not implementing rate limiting on public APIs', 'Deeply nested GraphQL queries causing DB performance issues'],
    keyDesigns: [
      { title: 'Social Media Feed API', difficulty: 'Medium', focus: 'Pagination, fan-out, API design' },
    ]
  },
  // ═══════════════ PHASE 3: SCALABILITY PATTERNS ═══════════════
  {
    id: 'db-sharding', title: 'Database Sharding & Partitioning', stage: 'scalability',
    icon: '🔀', color: '#f59e0b', difficulty: 'Medium–Hard', estimatedTime: '3 hours',
    description: 'Horizontal partitioning, shard keys, consistent hashing, rebalancing, cross-shard queries.',
    concepts: [
      { title: 'Partitioning Strategies', points: ['Range-based: shard by range (A-M → shard1, N-Z → shard2) — good for range queries, risk of hotspots', 'Hash-based: shard = hash(key) % N — uniform distribution, no range queries', 'Consistent hashing: minimize data movement when adding/removing shards', 'Directory-based: lookup table maps keys to shards — flexible but adds latency'] },
      { title: 'Shard Key Selection', points: ['High cardinality: many unique values (user_id good, country bad)', 'Even distribution: avoid hotspots (don\'t shard by celebrity_id)', 'Query pattern alignment: shard by the field you query most', 'Compound shard key: (tenant_id, user_id) for multi-tenant systems'] },
    ],
    invariants: ['Cross-shard queries are expensive — design to avoid them', 'Re-sharding is painful — choose shard key carefully upfront', 'Consistent hashing: adding a node only moves K/N keys (K=keys, N=nodes)'],
    thinkingFramework: [
      { condition: 'Single DB hitting write limits', action: 'Shard by the most queried field (usually user_id)' },
      { condition: 'Need range queries on sharded data', action: 'Range-based partitioning or composite key' },
      { condition: 'Servers frequently added/removed', action: 'Consistent hashing with virtual nodes' },
      { condition: 'Multi-tenant SaaS', action: 'Shard by tenant_id (tenant isolation + even distribution)' },
    ],
    tricks: [
      { name: 'Virtual Nodes', tip: 'Map each physical server to 100-200 virtual nodes on the hash ring for better distribution.', when: 'Consistent hashing with few servers', avoid: 'When server count is already large' },
    ],
    pitfalls: ['Choosing low-cardinality shard key → hotspots', 'Not planning for re-sharding (use logical shards > physical shards)', 'Cross-shard joins killing performance', 'Not considering shard-local secondary indexes vs global secondary indexes'],
    keyDesigns: [
      { title: 'Instagram/Photo Sharing at Scale', difficulty: 'Hard', focus: 'Sharding strategy, fan-out' },
    ]
  },
  {
    id: 'db-replication', title: 'Database Replication', stage: 'scalability',
    icon: '📋', color: '#eab308', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'Leader-follower, leader-leader, replication lag, failover, read replicas.',
    concepts: [
      { title: 'Replication Topologies', points: ['Leader-Follower (Master-Slave): one writer, multiple readers — simple, good for read-heavy', 'Leader-Leader (Multi-Master): multiple writers — complex conflict resolution', 'Leaderless (Dynamo-style): write to W nodes, read from R nodes, W+R > N for consistency', 'Synchronous: follower confirms before leader acknowledges — consistent but slow', 'Asynchronous: leader acknowledges immediately — fast but eventual consistency'] },
      { title: 'Failover', points: ['Automatic failover: health check detects leader failure, promotes follower', 'Split-brain risk: two nodes think they are leader → data divergence', 'Fencing: use STONITH or epoch numbers to prevent split-brain', 'Recovery: new follower copies snapshot + replays WAL from leader'] },
    ],
    invariants: ['Replication lag = delay between leader write and follower having it', 'Quorum: W + R > N guarantees reading up-to-date data', 'CAP tradeoff: synchronous replication = CP, asynchronous = AP'],
    thinkingFramework: [
      { condition: 'Read-heavy workload (10:1 read:write)', action: 'Leader-follower with read replicas' },
      { condition: 'Multi-region writes needed', action: 'Leader-leader or leaderless (accept conflict resolution complexity)' },
      { condition: 'Need strong consistency', action: 'Synchronous replication (or quorum reads/writes)' },
      { condition: 'Need low latency writes', action: 'Asynchronous replication (accept replication lag)' },
    ],
    tricks: [
      { name: 'Read-Your-Writes', tip: 'After writing, read from leader (or from follower only after replication_lag_ms). Prevents user seeing stale own data.', when: 'User-facing write-then-read flows', avoid: 'Analytics/batch reads' },
    ],
    pitfalls: ['Not monitoring replication lag', 'Split-brain after failover without fencing', 'Reading from follower immediately after write → stale data', 'Not testing failover in production-like environment'],
    keyDesigns: [
      { title: 'Multi-Region Chat System', difficulty: 'Hard', focus: 'Replication, conflict resolution, latency' },
    ]
  },
  {
    id: 'cdn-edge', title: 'CDNs & Edge Computing', stage: 'scalability',
    icon: '🌍', color: '#14b8a6', difficulty: 'Medium', estimatedTime: '1.5 hours',
    description: 'Content delivery networks, edge caching, cache invalidation, push vs pull CDN.',
    concepts: [
      { title: 'CDN Architecture', points: ['Edge servers (PoPs) cache content close to users globally', 'Pull CDN: edge fetches from origin on first request, caches for TTL', 'Push CDN: you upload content to CDN proactively (good for large, infrequent files)', 'CDN reduces latency (closer to user) and load on origin server'] },
      { title: 'Cache Control', points: ['Cache-Control header: max-age, s-maxage, no-cache, no-store', 'ETag / Last-Modified: conditional requests (304 Not Modified)', 'Cache busting: versioned URLs (app.v2.js) for instant invalidation', 'Purge API: manually invalidate cached content on CDN'] },
    ],
    invariants: ['CDN hit ratio > 95% for static assets is the target', 'TTL tradeoff: longer = better performance, shorter = fresher content', 'Dynamic content at edge needs edge compute (Cloudflare Workers, Lambda@Edge)'],
    thinkingFramework: [
      { condition: 'Static assets (images, JS, CSS)', action: 'CDN with long TTL + cache busting' },
      { condition: 'API responses that are cacheable', action: 'CDN with short TTL or stale-while-revalidate' },
      { condition: 'Personalized content', action: 'Cannot CDN-cache (unless using edge compute with cookies)' },
      { condition: 'Video streaming', action: 'CDN with adaptive bitrate (HLS/DASH)' },
    ],
    tricks: [
      { name: 'Stale-While-Revalidate', tip: 'Serve stale content immediately while fetching fresh copy in background. Best of both worlds.', when: 'Content that can be slightly stale', avoid: 'Real-time critical data' },
    ],
    pitfalls: ['Caching authenticated/personalized responses on CDN', 'Not purging CDN after deployment (users see old version)', 'Over-relying on CDN without monitoring hit ratios'],
    keyDesigns: [
      { title: 'YouTube Video Delivery', difficulty: 'Hard', focus: 'CDN, adaptive streaming, storage' },
    ]
  },
  {
    id: 'rate-limiting', title: 'Rate Limiting & Throttling', stage: 'scalability',
    icon: '🚦', color: '#f43f5e', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'Token bucket, sliding window, fixed window, distributed rate limiting, API throttling.',
    concepts: [
      { title: 'Algorithms', points: ['Token Bucket: tokens added at fixed rate, request consumes token — allows bursts', 'Leaky Bucket: requests processed at fixed rate, queue overflow dropped — smooth output', 'Fixed Window: count requests in fixed time windows (e.g., 100 req/min) — boundary burst issue', 'Sliding Window Log: track timestamp of each request, count in sliding window — accurate but memory-heavy', 'Sliding Window Counter: hybrid — weighted count from current + previous window — efficient approximation'] },
      { title: 'Implementation', points: ['Single server: in-memory counter with atomic operations', 'Distributed: Redis INCR + EXPIRE for shared counter across instances', 'Client identification: API key, user ID, IP address, or combination', 'Response: HTTP 429 Too Many Requests, Retry-After header'] },
    ],
    invariants: ['Token bucket allows bursts up to bucket size; leaky bucket does not', 'Distributed rate limiter needs atomic operations (Redis EVAL with Lua)', 'Rate limiting at multiple levels: API gateway → service → database'],
    thinkingFramework: [
      { condition: 'API with burst-friendly clients', action: 'Token bucket (allows short bursts)' },
      { condition: 'Need smooth, constant rate processing', action: 'Leaky bucket' },
      { condition: 'Simple per-user limit', action: 'Sliding window counter with Redis' },
      { condition: 'Multi-tier protection', action: 'Rate limit at API gateway + per-service limits' },
    ],
    tricks: [
      { name: 'Graceful Degradation', tip: 'Instead of hard reject (429), consider degrading service quality (serve cached data, lower resolution).', when: 'User-facing endpoints under load', avoid: 'API endpoints where strict limits are needed' },
    ],
    pitfalls: ['Fixed window allowing 2x burst at window boundaries', 'Not rate-limiting internal services (cascading failures)', 'Race conditions in distributed counter without atomic ops', 'Not including Retry-After header in 429 responses'],
    keyDesigns: [
      { title: 'API Rate Limiter', difficulty: 'Medium', focus: 'Distributed counting, Redis, algorithms' },
    ]
  },
  // ═══════════════ PHASE 4: DISTRIBUTED SYSTEMS ═══════════════
  {
    id: 'message-queues', title: 'Message Queues & Async', stage: 'distributed',
    icon: '📬', color: '#ef4444', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'RabbitMQ, SQS, async processing, producer-consumer, dead letter queues, backpressure.',
    concepts: [
      { title: 'Why Queues?', points: ['Decouple producers from consumers — they don\'t need to be online simultaneously', 'Buffer traffic spikes — smooth out bursty load', 'Enable async processing — respond to user immediately, process later', 'Reliability — messages persist even if consumer crashes (at-least-once delivery)'] },
      { title: 'Queue Patterns', points: ['Point-to-Point: one message consumed by exactly one consumer (work queue)', 'Pub-Sub: one message delivered to all subscribers (fan-out)', 'Request-Reply: async request with correlation ID for matching response', 'Dead Letter Queue (DLQ): failed messages sent to DLQ after max retries for investigation'] },
    ],
    invariants: ['At-least-once: message may be delivered multiple times — consumer must be idempotent', 'At-most-once: message may be lost — acceptable for metrics/logs', 'Exactly-once: very hard — usually achieved via idempotent consumer + at-least-once delivery'],
    thinkingFramework: [
      { condition: 'User action triggers slow background work', action: 'Queue the task, respond immediately (email sending, image processing)' },
      { condition: 'Multiple services need same event', action: 'Pub-Sub (fan-out) pattern' },
      { condition: 'Need to smooth traffic spikes', action: 'Queue as buffer between API and workers' },
      { condition: 'Critical messages that must not be lost', action: 'Persistent queue + DLQ + alerting + idempotent consumer' },
    ],
    tricks: [
      { name: 'Idempotency Key', tip: 'Store processed message IDs. Before processing, check if already done. This makes at-least-once effectively exactly-once.', when: 'Any queue consumer for critical operations', avoid: 'N/A' },
    ],
    pitfalls: ['Not handling poison messages (message that always fails → infinite retry loop)', 'Queue growing unbounded without backpressure or alerting', 'Not making consumers idempotent with at-least-once delivery', 'Coupling business logic to queue implementation details'],
    keyDesigns: [
      { title: 'Notification System', difficulty: 'Medium', focus: 'Fan-out, priority, multi-channel delivery' },
      { title: 'Order Processing Pipeline', difficulty: 'Medium', focus: 'Async workflow, DLQ, retries' },
    ]
  },
  {
    id: 'microservices', title: 'Microservices Architecture', stage: 'distributed',
    icon: '🧩', color: '#f97316', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'Service decomposition, bounded contexts, service communication, data ownership, API gateway.',
    concepts: [
      { title: 'Decomposition Principles', points: ['Single Responsibility: each service owns one business capability', 'Bounded Context (DDD): service boundary = domain boundary', 'Data Ownership: each service owns and manages its own database', 'Independence: services deploy, scale, and fail independently'] },
      { title: 'Communication', points: ['Synchronous: REST/gRPC — simple but creates coupling and cascading failures', 'Asynchronous: message queue/events — decoupled but complex to debug', 'API Gateway: single entry point, handles routing, auth, rate limiting', 'Service Mesh: sidecar proxy handles service-to-service networking (Istio, Linkerd)'] },
    ],
    invariants: ['Database per service — no shared databases (violates independence)', 'Services communicate via APIs, never by sharing database tables', 'If service A can\'t function without service B, they might be one service'],
    thinkingFramework: [
      { condition: 'Monolith getting too large for one team', action: 'Decompose by business domain (users, orders, payments, inventory)' },
      { condition: 'One component needs different scaling', action: 'Extract as separate service with dedicated resources' },
      { condition: 'Cross-service data query needed', action: 'API composition, CQRS, or event-driven data sync' },
      { condition: 'New startup / small team', action: 'Start monolith, extract services when needed (monolith-first)' },
    ],
    tricks: [
      { name: 'Strangler Fig Pattern', tip: 'Migrate monolith to microservices incrementally. Route new features to new service, gradually move old features.', when: 'Decomposing existing monolith', avoid: 'Greenfield projects (just start right)' },
    ],
    pitfalls: ['Premature decomposition (distributed monolith is worse than a monolith)', 'Shared database between services — breaks independence', 'Not implementing circuit breakers → cascading failures', 'Distributed transactions are much harder than local transactions'],
    keyDesigns: [
      { title: 'E-Commerce System', difficulty: 'Hard', focus: 'Service decomposition, event-driven, saga' },
    ]
  },
  {
    id: 'distributed-transactions', title: 'Distributed Transactions (Saga)', stage: 'distributed',
    icon: '🔄', color: '#dc2626', difficulty: 'Hard', estimatedTime: '3 hours',
    description: 'Two-phase commit, saga pattern (choreography vs orchestration), compensating transactions, idempotency.',
    concepts: [
      { title: '2PC vs Sagas', points: ['Two-Phase Commit (2PC): coordinator asks all to prepare, then commit — blocking, fragile', 'Saga: sequence of local transactions, each with a compensating action for rollback', 'Choreography saga: services emit events, next service reacts — decoupled but hard to trace', 'Orchestration saga: central orchestrator directs the flow — easier to understand, single point of failure'] },
      { title: 'Compensating Transactions', points: ['Each step has an "undo" action: create order → cancel order, charge card → refund card', 'Not true rollback — it\'s a new transaction that semantically reverses the effect', 'Must handle partial failures: step 3 fails → compensate steps 2 and 1 in reverse', 'Compensating actions must be idempotent (may be called multiple times)'] },
    ],
    invariants: ['2PC blocks all participants if coordinator crashes — avoid in distributed systems', 'Saga guarantees eventual consistency, not immediate consistency', 'Every saga step needs a compensating transaction defined upfront'],
    thinkingFramework: [
      { condition: 'Cross-service transaction (order + payment + inventory)', action: 'Saga pattern (prefer orchestration for clarity)' },
      { condition: 'Need strict ACID across services', action: 'Consider merging into one service if possible' },
      { condition: 'Simple two-service coordination', action: 'Choreography saga with events' },
      { condition: 'Complex multi-step workflow', action: 'Orchestration saga with state machine' },
    ],
    tricks: [
      { name: 'Saga State Machine', tip: 'Model each saga as a state machine. States = (STARTED, PAYMENT_DONE, INVENTORY_RESERVED, COMPLETED, COMPENSATING). Makes debugging easy.', when: 'Orchestration sagas', avoid: 'Simple 2-step flows' },
    ],
    pitfalls: ['Not defining compensating transactions for every step', 'Not handling the case where compensation itself fails', 'Using 2PC in microservices (it doesn\'t scale)', 'Not making saga steps idempotent (duplicate events cause duplicate charges)'],
    keyDesigns: [
      { title: 'Ride-Sharing Booking System', difficulty: 'Hard', focus: 'Saga, payment, driver matching, compensation' },
      { title: 'Hotel Booking System', difficulty: 'Hard', focus: 'Reservation saga, overbooking, cancellation' },
    ]
  },
  {
    id: 'service-resilience', title: 'Circuit Breakers & Resilience', stage: 'distributed',
    icon: '🛡️', color: '#b91c1c', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'Circuit breaker pattern, retries with backoff, bulkhead, timeout, service discovery, health checks.',
    concepts: [
      { title: 'Circuit Breaker', points: ['Closed state: requests flow normally, failures counted', 'Open state: after threshold failures, all requests fail-fast (no call to downstream)', 'Half-Open state: after cooldown, allow one test request — if success → close, if fail → open', 'Prevents cascading failures when downstream service is unhealthy'] },
      { title: 'Resilience Patterns', points: ['Retry with exponential backoff: 1s, 2s, 4s, 8s... + jitter', 'Bulkhead: isolate resources per service (separate thread pools) — failure in one doesn\'t drain all', 'Timeout: always set timeouts on outbound calls — never wait forever', 'Fallback: return cached/default data when downstream is down'] },
    ],
    invariants: ['Retry without backoff amplifies load on failing service (retry storm)', 'Circuit breaker threshold must balance between sensitivity and stability', 'Timeouts must be set at every layer: HTTP client, DB connection, queue consumer'],
    thinkingFramework: [
      { condition: 'Downstream service intermittently failing', action: 'Retry with exponential backoff + jitter (max 3 retries)' },
      { condition: 'Downstream service completely down', action: 'Circuit breaker → fail fast → return fallback' },
      { condition: 'One slow service affecting all others', action: 'Bulkhead (isolate thread pools per dependency)' },
      { condition: 'Need graceful degradation', action: 'Fallback: serve cached data or simplified response' },
    ],
    tricks: [
      { name: 'Add Jitter', tip: 'Add random jitter to backoff timing. Without jitter, all retries align (thundering herd). backoff = min(base * 2^n + random(0, base), max_delay)', when: 'Every retry implementation', avoid: 'N/A' },
    ],
    pitfalls: ['Retrying non-idempotent operations (double-charging)', 'No timeout → thread pool exhaustion → cascading failure', 'Circuit breaker threshold too low (flaps open/closed) or too high (doesn\'t protect)'],
    keyDesigns: [
      { title: 'Payment Processing System', difficulty: 'Hard', focus: 'Idempotency, circuit breakers, retry logic' },
    ]
  },
  // ═══════════════ PHASE 5: CLOUD-NATIVE ═══════════════
  {
    id: 'event-driven', title: 'Event-Driven Architecture', stage: 'cloud-native',
    icon: '⚡', color: '#06b6d4', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'Kafka, event sourcing, CQRS, stream processing, event schemas, exactly-once semantics.',
    concepts: [
      { title: 'Kafka Fundamentals', points: ['Topic: named log of events (messages), partitioned for parallelism', 'Partition: ordered, immutable sequence of records — unit of parallelism', 'Consumer Group: group of consumers that share partitions — each partition read by exactly one consumer in group', 'Offset: position in partition — consumers track their offset for resuming', 'Retention: messages kept for configurable period (days/weeks), not deleted on consume'] },
      { title: 'Event Sourcing & CQRS', points: ['Event Sourcing: store events (OrderCreated, OrderShipped) not state — rebuild state by replaying events', 'CQRS: separate write model (commands) from read model (queries) — optimize each independently', 'Event Store: append-only log of domain events', 'Projection: read model built from events (can rebuild anytime from event log)'] },
    ],
    invariants: ['Kafka partition ordering: messages within a partition are strictly ordered', 'Consumer parallelism limited by partition count (max consumers = partitions)', 'Event sourcing: source of truth is the event log, current state is derived'],
    thinkingFramework: [
      { condition: 'Multiple services react to same business event', action: 'Kafka topic with multiple consumer groups' },
      { condition: 'Need audit trail / history of changes', action: 'Event sourcing' },
      { condition: 'Read and write patterns are very different', action: 'CQRS — optimize read/write models separately' },
      { condition: 'Real-time data processing (aggregations, alerts)', action: 'Kafka Streams or Flink for stream processing' },
    ],
    tricks: [
      { name: 'Partition Key = Entity ID', tip: 'Use entity ID as partition key. All events for one entity go to same partition → ordering guaranteed for that entity.', when: 'Any Kafka producer', avoid: 'When you need global ordering (use single partition, but limits throughput)' },
    ],
    pitfalls: ['Too few partitions → can\'t scale consumers', 'Too many partitions → overhead on brokers, slower rebalancing', 'Not handling schema evolution (use Avro + Schema Registry)', 'Event sourcing without snapshots → slow state rebuilds for long-lived entities'],
    keyDesigns: [
      { title: 'Real-time Analytics Pipeline', difficulty: 'Hard', focus: 'Kafka, stream processing, dashboards' },
      { title: 'Activity Feed (LinkedIn/Facebook)', difficulty: 'Hard', focus: 'Fan-out, real-time delivery, CQRS' },
    ]
  },
  {
    id: 'containers-orchestration', title: 'Containers & Orchestration', stage: 'cloud-native',
    icon: '🐳', color: '#0ea5e9', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'Docker, Kubernetes (pods, services, deployments), scaling, rolling updates, infra-as-code.',
    concepts: [
      { title: 'Docker', points: ['Container: lightweight isolated process with its own filesystem, network, process space', 'Image: blueprint for container — built from Dockerfile, layered filesystem', 'Registry: stores images (Docker Hub, ECR, GCR)', 'Multi-stage build: separate build and runtime stages for smaller production images'] },
      { title: 'Kubernetes', points: ['Pod: smallest unit — one or more containers sharing network and storage', 'Deployment: manages pod replicas, rolling updates, rollbacks', 'Service: stable network endpoint for a set of pods (ClusterIP, NodePort, LoadBalancer)', 'HPA: Horizontal Pod Autoscaler — scales pods based on CPU/memory/custom metrics', 'Namespace: logical cluster subdivision for multi-tenancy'] },
    ],
    invariants: ['Containers are ephemeral — never store state in a container (use volumes or external DB)', 'One process per container (log to stdout, let orchestrator handle log collection)', 'Pods can be killed and rescheduled anytime — design for this'],
    thinkingFramework: [
      { condition: 'Need reproducible deployments', action: 'Docker + container registry + orchestrator' },
      { condition: 'Auto-scale based on load', action: 'Kubernetes HPA + metrics server' },
      { condition: 'Zero-downtime deployments', action: 'Rolling update strategy (maxSurge, maxUnavailable)' },
      { condition: 'Managing infrastructure as code', action: 'Terraform for infra, Helm charts for K8s deployments' },
    ],
    tricks: [
      { name: 'Health + Readiness Probes', tip: 'Liveness probe: restart crashed pods. Readiness probe: don\'t send traffic until ready (DB connected, cache warmed).', when: 'Every K8s deployment', avoid: 'N/A' },
    ],
    pitfalls: ['Running containers as root (security risk)', 'Not setting resource limits (noisy neighbor problem)', 'Not configuring probes → traffic sent to unready pods', 'Over-engineering K8s when a simple PaaS (Railway, Fly.io) suffices'],
    keyDesigns: [
      { title: 'CI/CD Pipeline System', difficulty: 'Medium', focus: 'Containers, orchestration, artifact management' },
    ]
  },
  {
    id: 'observability', title: 'Observability (Logs, Metrics, Traces)', stage: 'cloud-native',
    icon: '📡', color: '#8b5cf6', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Three pillars of observability, structured logging, metric types, distributed tracing, alerting.',
    concepts: [
      { title: 'Three Pillars', points: ['Logs: discrete events with timestamp + context (structured JSON preferred)', 'Metrics: numeric measurements over time (counters, gauges, histograms) — Prometheus/Grafana', 'Traces: follow a request across multiple services — see where time is spent (OpenTelemetry/Jaeger)'] },
      { title: 'Best Practices', points: ['Structured logging: JSON with request_id, user_id, service_name — enables querying', 'RED method for services: Rate (RPS), Errors (error rate), Duration (latency)', 'USE method for resources: Utilization, Saturation, Errors', 'Correlation ID: pass unique ID through all services for end-to-end tracing'] },
    ],
    invariants: ['Without observability, debugging production issues is impossible at scale', 'Alert on symptoms (error rate, latency) not causes (CPU usage) — causes change, symptoms don\'t', 'Sampling: at high throughput, trace 1-10% of requests to reduce overhead'],
    thinkingFramework: [
      { condition: 'Debugging slow requests', action: 'Distributed tracing (find which service/step is slow)' },
      { condition: 'Monitoring system health', action: 'Metrics dashboard (RED method for each service)' },
      { condition: 'Investigating specific errors', action: 'Search structured logs by request_id' },
      { condition: 'Capacity planning', action: 'USE method metrics for infrastructure resources' },
    ],
    tricks: [
      { name: 'Correlation IDs', tip: 'Generate a unique request_id at the API gateway, pass it in headers through every service. Include in all logs and traces.', when: 'Every microservices architecture', avoid: 'N/A' },
    ],
    pitfalls: ['Unstructured logs (grep-based debugging doesn\'t scale)', 'Too many alerts → alert fatigue → ignoring real alerts', 'Not sampling traces → metrics pipeline overwhelmed', 'Alerting on causes instead of symptoms'],
    keyDesigns: [
      { title: 'Monitoring & Alerting System', difficulty: 'Medium', focus: 'Time-series DB, alerting rules, dashboards' },
    ]
  },
  // ═══════════════ PHASE 6: AI-NATIVE SYSTEMS ═══════════════
  {
    id: 'ai-native', title: 'AI-Native Systems (LLMs)', stage: 'ai-native',
    icon: '🤖', color: '#f472b6', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'LLMs in production, streaming responses, model routing, cost optimization, guardrails, safety.',
    concepts: [
      { title: 'LLM Architecture', points: ['Inference latency: 500ms–5s for generation (much slower than DB queries)', 'Streaming: send tokens as generated (SSE/WebSocket) for perceived speed', 'Model routing: cheap model for simple queries, expensive model for hard ones', 'Token budgets: input + output tokens determine cost — truncate context wisely'] },
      { title: 'Production Concerns', points: ['Guardrails: input filtering (prompt injection defense), output filtering (harmful content)', 'Caching: cache identical prompt→response pairs (semantic caching for similar prompts)', 'Cost management: set token limits per user/request, monitor spend', 'Fallback: if LLM provider is down, fall back to cached responses or simpler model', 'Evaluation: automated eval metrics (relevance, faithfulness, hallucination rate)'] },
    ],
    invariants: ['LLM responses are non-deterministic — same prompt may give different answers', 'Prompt injection is a real attack vector — never trust user input in system prompts without sanitization', 'Cost scales with usage — need per-user and per-request token budgets'],
    thinkingFramework: [
      { condition: 'User-facing conversational AI', action: 'Stream responses, add guardrails, implement fallback' },
      { condition: 'High-volume LLM usage', action: 'Model routing (small model for easy queries) + response caching' },
      { condition: 'Need factual accuracy', action: 'RAG pipeline (retrieve context from your data, not just LLM knowledge)' },
      { condition: 'Handling prompt injection', action: 'Input sanitization + output filtering + separate system/user prompt handling' },
    ],
    tricks: [
      { name: 'Streaming + Skeleton UI', tip: 'Show a loading skeleton while first tokens arrive, then stream text. Makes 2s latency feel instant.', when: 'Any user-facing LLM feature', avoid: 'Batch/background LLM calls' },
    ],
    pitfalls: ['Not setting token limits → unexpected $1000 bills', 'Trusting LLM output without validation for critical decisions', 'Not implementing rate limiting on AI endpoints (expensive DoS)', 'Hardcoding prompts instead of using versioned prompt management'],
    keyDesigns: [
      { title: 'AI Chatbot Platform', difficulty: 'Hard', focus: 'Streaming, guardrails, multi-model, cost' },
    ]
  },
  {
    id: 'rag-vectors', title: 'RAG & Vector Databases', stage: 'ai-native',
    icon: '🔍', color: '#ec4899', difficulty: 'Hard', estimatedTime: '3 hours',
    description: 'Retrieval-Augmented Generation, embedding models, vector similarity, chunking strategies, hybrid search.',
    concepts: [
      { title: 'RAG Pipeline', points: ['Ingest: chunk documents → embed chunks → store in vector DB', 'Retrieve: embed user query → find top-K similar chunks via ANN search', 'Augment: inject retrieved chunks into LLM prompt as context', 'Generate: LLM generates answer grounded in your data (reduces hallucination)'] },
      { title: 'Vector Database', points: ['Embedding: convert text → dense vector (1536 dims for OpenAI ada-002)', 'ANN (Approximate Nearest Neighbor): HNSW, IVF — fast similarity search', 'Options: Pinecone, Weaviate, Qdrant, pgvector (Postgres extension), Chroma', 'Hybrid search: combine vector similarity + keyword (BM25) for better recall'] },
    ],
    invariants: ['Chunking strategy directly impacts retrieval quality — too large = diluted, too small = missing context', 'Embedding model must match for indexing and querying (same model, same dimensions)', 'RAG reduces hallucination but doesn\'t eliminate it — still need validation'],
    thinkingFramework: [
      { condition: 'LLM needs to answer from your proprietary docs', action: 'RAG pipeline with vector DB' },
      { condition: 'Simple structured data lookup', action: 'Don\'t use RAG — use SQL query + template response' },
      { condition: 'Need both semantic and keyword matching', action: 'Hybrid search (vector + BM25 with reciprocal rank fusion)' },
      { condition: 'Large document corpus (millions of docs)', action: 'Managed vector DB (Pinecone) + metadata filtering for pre-filtering' },
    ],
    tricks: [
      { name: 'Chunk Overlap', tip: 'Use 10-20% overlap between chunks so context isn\'t lost at chunk boundaries. E.g., 500 char chunks with 100 char overlap.', when: 'Document chunking for any RAG pipeline', avoid: 'N/A' },
      { name: 'Re-ranking', tip: 'Retrieve top-20 with vector search, then re-rank to top-5 with a cross-encoder model for better precision.', when: 'Quality-critical RAG applications', avoid: 'When latency budget is very tight' },
    ],
    pitfalls: ['Using too large chunk sizes → retrieved context is not focused', 'Not including metadata in chunks (source, page number) for attribution', 'Not refreshing embeddings when source documents change', 'Sending too much context to LLM → exceeding token limits and higher cost'],
    keyDesigns: [
      { title: 'Enterprise Knowledge Search', difficulty: 'Hard', focus: 'RAG, vector DB, access control, chunking' },
    ]
  },
  {
    id: 'sd-interview-framework', title: 'System Design Interview Framework', stage: 'ai-native',
    icon: '🎯', color: '#a855f7', difficulty: 'All Levels', estimatedTime: '2 hours',
    description: 'The 4-step framework for acing any system design interview: requirements, estimation, design, deep dive.',
    concepts: [
      { title: 'The 4-Step Framework', points: ['Step 1 (3-5 min): Clarify Requirements — functional + non-functional (scale, latency, availability)', 'Step 2 (3-5 min): Back-of-Envelope Estimation — users, QPS, storage, bandwidth', 'Step 3 (15-20 min): High-Level Design — draw components, data flow, APIs', 'Step 4 (10-15 min): Deep Dive — scale bottlenecks, handle failures, optimize hot paths'] },
      { title: 'Communication Tips', points: ['Think out loud — interviewer wants to see your thought process', 'State tradeoffs explicitly: "I chose X over Y because..."', 'Draw as you talk — architecture diagrams are essential', 'Ask clarifying questions — don\'t assume (users? geography? SLA?)'] },
    ],
    invariants: ['Never start designing without clarifying requirements — it\'s a trap', 'Estimation doesn\'t need to be exact — order of magnitude is fine', 'Always discuss tradeoffs — there is no single right answer'],
    thinkingFramework: [
      { condition: 'Starting any design problem', action: 'Step 1: "What are the functional requirements? What are the non-functional requirements?"' },
      { condition: 'After requirements', action: 'Step 2: "Let me estimate the scale — DAU, QPS, storage needed"' },
      { condition: 'Drawing the design', action: 'Step 3: Start with client → LB → API servers → DB, then add components as needed' },
      { condition: 'Time for deep dive', action: 'Step 4: Pick the most interesting bottleneck and go deep (caching, sharding, consistency)' },
    ],
    tricks: [
      { name: 'Numbers to Remember', tip: 'QPS: 1M DAU ≈ 12 QPS avg (86400s/day). Storage: 1M users × 1KB = 1GB. Bandwidth: QPS × response_size.', when: 'Back-of-envelope estimation', avoid: 'N/A' },
      { name: 'Start Simple, Then Scale', tip: 'Draw the simplest possible design first (single server). Then identify bottlenecks and add: cache, LB, DB replicas, sharding, CDN.', when: 'Every design problem', avoid: 'N/A' },
    ],
    pitfalls: ['Jumping into implementation details without clarifying requirements', 'Not managing time (spending 20 min on requirements, no time for design)', 'Only discussing happy path (what about failures? data loss? network partition?)', 'Not drawing anything — interviewers need visual structure'],
    keyDesigns: [
      { title: 'Design Twitter', difficulty: 'Medium', focus: 'Feed generation, fan-out, caching at scale' },
      { title: 'Design Uber', difficulty: 'Hard', focus: 'Location matching, real-time, geospatial' },
      { title: 'Design WhatsApp', difficulty: 'Hard', focus: 'Messaging, presence, read receipts, E2E encryption' },
      { title: 'Design YouTube', difficulty: 'Hard', focus: 'Video upload, transcoding, CDN, recommendations' },
      { title: 'Design Google Search', difficulty: 'Hard', focus: 'Web crawler, inverted index, ranking, scale' },
    ]
  },
  // ═══════════════ PHASE 7: SECURITY & TRUST ═══════════════
  {
    id: 'auth-systems', title: 'Authentication & Authorization', stage: 'security-trust',
    icon: '🔐', color: '#f59e0b', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'OAuth2, JWT, session management, RBAC, SSO, multi-factor auth, token refresh, and zero-trust architecture.',
    concepts: [
      { title: 'Authentication Methods', points: ['Session-based: server stores session in Redis/DB, client holds session cookie — stateful, simple', 'Token-based (JWT): server issues signed token, client sends in header — stateless, scalable', 'OAuth2: delegate auth to provider (Google, GitHub) — Authorization Code flow for web, PKCE for SPAs', 'API Keys: simple for server-to-server — not for user auth (no expiry management)', 'MFA: something you know (password) + something you have (TOTP/SMS) + something you are (biometric)'] },
      { title: 'Authorization Patterns', points: ['RBAC (Role-Based): roles = admin, editor, viewer — each role has permissions', 'ABAC (Attribute-Based): policies based on user attributes, resource attributes, environment', 'ACL (Access Control List): explicit list of who can do what on each resource', 'Policy-as-Code: OPA (Open Policy Agent) — define auth rules in Rego, decouple from app', 'Zero Trust: never trust, always verify — authenticate every request even on internal network'] },
    ],
    invariants: ['Never store passwords in plaintext — bcrypt/scrypt/argon2 with salt', 'JWT has no revocation mechanism — use short expiry + refresh tokens', 'RBAC is simpler to audit than ABAC — prefer RBAC unless complex policies needed'],
    thinkingFramework: [
      { condition: 'Public API for third parties', action: 'OAuth2 with API keys + rate limiting' },
      { condition: 'SPA/mobile app', action: 'JWT (short-lived access + long-lived refresh token) with PKCE' },
      { condition: 'Internal microservices', action: 'mTLS + service mesh identity (Istio/SPIFFE)' },
      { condition: 'Enterprise SSO', action: 'SAML 2.0 or OIDC (OpenID Connect) with IdP (Okta, Auth0)' },
      { condition: 'Need instant token revocation', action: 'Session-based auth or JWT deny-list in Redis' },
    ],
    tricks: [
      { name: 'Token Rotation', tip: 'Access token: 15 min expiry. Refresh token: 7 days, single-use (rotate on each use). Detect stolen refresh tokens by tracking token families.', when: 'Any JWT-based auth system', avoid: 'N/A' },
      { name: 'Scoped Tokens', tip: 'Issue tokens with minimal scopes (read:user, write:post). Validate scope on each endpoint. Principle of least privilege.', when: 'API authorization', avoid: 'N/A' },
    ],
    pitfalls: ['Storing JWT in localStorage (XSS vulnerable) — use httpOnly cookies', 'Not implementing token refresh → users logged out frequently', 'Using symmetric JWTs (HS256) across multiple services — use asymmetric (RS256)', 'Not rate-limiting login attempts → brute force attacks'],
    keyDesigns: [
      { title: 'SSO Platform (Okta/Auth0)', difficulty: 'Hard', focus: 'Multi-tenant auth, federation, token management' },
      { title: 'API Gateway Auth', difficulty: 'Medium', focus: 'Token validation, rate limiting, scope enforcement' },
    ]
  },
  {
    id: 'api-security', title: 'API Security & DDoS Protection', stage: 'security-trust',
    icon: '🛡️', color: '#d97706', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'OWASP API Top 10, input validation, CORS, CSRF, DDoS mitigation, WAF, bot protection.',
    concepts: [
      { title: 'OWASP API Top 10', points: ['Broken Object Level Auth (BOLA/IDOR): can user A access user B\'s data?', 'Broken Authentication: weak password policy, credential stuffing, no brute-force protection', 'Excessive Data Exposure: API returns more data than client needs → filter server-side', 'Rate Limiting absence: no throttling → abuse, scraping, DoS', 'Mass Assignment: API accepts fields it shouldn\'t (e.g., isAdmin in user update)'] },
      { title: 'Defense Layers', points: ['WAF (Web Application Firewall): filter malicious requests (SQL injection, XSS)', 'DDoS Protection: Cloudflare/AWS Shield — absorb volumetric attacks at the edge', 'Input Validation: whitelist allowed characters, validate format (not just client-side)', 'CORS: restrict which origins can call your API — don\'t use wildcard (*) in production', 'CSRF Tokens: prevent cross-site request forgery for cookie-based auth'] },
    ],
    invariants: ['Never trust client-side validation — always validate on the server', 'Defense in depth: multiple security layers, not one silver bullet', 'Principle of least privilege: API should expose minimum data and operations needed'],
    thinkingFramework: [
      { condition: 'Public-facing API', action: 'WAF + rate limiting + input validation + auth at gateway' },
      { condition: 'DDoS risk', action: 'CDN/Cloudflare for L3-L4, WAF for L7 application attacks' },
      { condition: 'Handling sensitive data (PII)', action: 'Encrypt in transit (TLS) + at rest (AES-256) + mask in logs' },
      { condition: 'Multi-tenant SaaS', action: 'Tenant isolation — validate tenant_id on every query' },
    ],
    tricks: [
      { name: 'Request Signing', tip: 'Sign API requests with HMAC — prevents tampering. Include timestamp to prevent replay attacks (reject if > 5 min old).', when: 'Webhook receivers, payment callbacks', avoid: 'Simple read-only public APIs' },
    ],
    pitfalls: ['Returning stack traces in production error responses', 'Not sanitizing user input before database queries (SQL injection)', 'Using CORS wildcard (*) with credentials', 'Not logging security events for forensic analysis'],
    keyDesigns: [
      { title: 'Secure Payment Gateway', difficulty: 'Hard', focus: 'PCI compliance, encryption, tokenization' },
    ]
  },
  {
    id: 'data-protection', title: 'Data Encryption & Privacy', stage: 'security-trust',
    icon: '🔏', color: '#ca8a04', difficulty: 'Medium–Hard', estimatedTime: '2–3 hours',
    description: 'Encryption at rest/transit, key management, data masking, GDPR compliance, backup strategies.',
    concepts: [
      { title: 'Encryption', points: ['In Transit: TLS 1.3 for all connections (HTTP, DB, queue) — certificate management', 'At Rest: AES-256 for stored data — full disk encryption, column-level encryption', 'End-to-End (E2E): only sender and receiver can read — used in messaging (Signal protocol)', 'Envelope Encryption: encrypt data with data key, encrypt data key with master key (KMS)', 'Hashing: one-way transformation — bcrypt/argon2 for passwords, SHA-256 for integrity'] },
      { title: 'Privacy & Compliance', points: ['GDPR: right to access, right to erasure, data minimization, consent management', 'Data Masking: replace sensitive data with realistic but fake data in non-prod environments', 'PII Detection: automated scanning for personally identifiable information in logs/databases', 'Data Residency: store data in the region required by law (EU data stays in EU)', 'Audit Logs: immutable record of who accessed/modified sensitive data'] },
    ],
    invariants: ['Never log sensitive data (passwords, credit cards, SSNs)', 'Key rotation must be automated — manual rotation is forgotten', 'Backups must be encrypted and tested (untested backup = no backup)'],
    thinkingFramework: [
      { condition: 'Healthcare data (HIPAA)', action: 'Encryption everywhere + access audit log + BAA with cloud provider' },
      { condition: 'EU users (GDPR)', action: 'Consent management + right to erasure + data minimization' },
      { condition: 'Credit card processing', action: 'PCI DSS compliance — tokenize cards, never store raw numbers' },
      { condition: 'Multi-tenant data isolation', action: 'Separate encryption keys per tenant + row-level security' },
    ],
    tricks: [
      { name: 'Crypto Shredding', tip: 'To "delete" encrypted data without touching every record, just delete the encryption key. Data becomes unreadable. Useful for GDPR right to erasure at scale.', when: 'Large-scale data deletion requirements', avoid: 'When you need selective deletion' },
    ],
    pitfalls: ['Hardcoding encryption keys in source code', 'Using outdated encryption (MD5, SHA-1, DES)', 'Not rotating keys on a schedule', 'Encrypting data but storing the key next to it'],
    keyDesigns: [
      { title: 'End-to-End Encrypted Messaging', difficulty: 'Hard', focus: 'Signal protocol, key exchange, forward secrecy' },
      { title: 'GDPR-Compliant User Data Platform', difficulty: 'Hard', focus: 'Consent, erasure, portability, audit' },
    ]
  },
  // ═══════════════ PHASE 8: REAL-TIME SYSTEMS ═══════════════
  {
    id: 'websocket-realtime', title: 'WebSockets & Real-Time Communication', stage: 'realtime-systems',
    icon: '🔌', color: '#22c55e', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'WebSocket protocol, Server-Sent Events (SSE), long polling, Socket.IO, scaling WebSocket connections.',
    concepts: [
      { title: 'Real-Time Protocols', points: ['WebSocket: full-duplex, persistent connection — client and server push messages anytime', 'Server-Sent Events (SSE): server pushes to client only (one-way) — simpler, auto-reconnect', 'Long Polling: client sends request, server holds until data available — fallback, higher overhead', 'HTTP Streaming: server never closes response, sends data chunks — good for streaming logs'] },
      { title: 'Scaling WebSockets', points: ['Challenge: WebSocket is stateful — client connected to specific server', 'Sticky sessions: LB routes same client to same server (breaks horizontal scaling)', 'Pub/Sub backbone: Redis Pub/Sub or Kafka — server publishes, all servers with connected clients receive', 'Connection gateway: dedicated WebSocket servers separate from API servers', 'Connection limit: one server handles ~50K-100K concurrent WebSocket connections'] },
    ],
    invariants: ['WebSocket connections are stateful — need session awareness at LB level', 'Heartbeat/ping-pong required to detect dead connections', 'Reconnection with exponential backoff is essential for reliability'],
    thinkingFramework: [
      { condition: 'Two-way real-time (chat, gaming)', action: 'WebSocket with Pub/Sub backend (Redis)' },
      { condition: 'Server → client only (notifications, feeds)', action: 'SSE — simpler, auto-reconnect, works with HTTP/2' },
      { condition: 'Scaling to millions of connections', action: 'Dedicated connection gateway + Pub/Sub fanout + horizontal scaling' },
      { condition: 'Browser compatibility concerns', action: 'Socket.IO — WebSocket with fallback to long polling' },
    ],
    tricks: [
      { name: 'Room-Based Pub/Sub', tip: 'Group users into "rooms" (chat rooms, document editors). Only publish to the room, not broadcast to all connections. Drastically reduces fan-out.', when: 'Chat, collaborative editing, group features', avoid: 'Global broadcasts' },
      { name: 'Connection Draining', tip: 'During deployment, stop accepting new connections on old server, wait for existing to migrate. Prevents dropping active users.', when: 'Deploying WebSocket servers', avoid: 'N/A' },
    ],
    pitfalls: ['Not implementing heartbeat → zombie connections consuming resources', 'Broadcasting to all connections instead of targeted rooms → O(N) fan-out', 'Not handling reconnection gracefully → user sees disconnected state', 'Using WebSocket for everything — REST is simpler for request-response'],
    keyDesigns: [
      { title: 'Real-Time Chat System', difficulty: 'Medium', focus: 'WebSocket, rooms, presence, message ordering' },
      { title: 'Collaborative Document Editor', difficulty: 'Hard', focus: 'OT/CRDT, cursor sync, conflict resolution' },
    ]
  },
  {
    id: 'location-systems', title: 'Location & Geospatial Systems', stage: 'realtime-systems',
    icon: '📍', color: '#16a34a', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'Geospatial indexing (Geohash, QuadTree, S2), proximity search, real-time location tracking, ETA calculation.',
    concepts: [
      { title: 'Geospatial Indexing', points: ['Geohash: encode lat/lng into string — "9q8yyk" — prefix search for proximity', 'QuadTree: recursive 2D partitioning — split cells when they have too many points', 'S2 Geometry (Google): map Earth to unit sphere, divide into cells — hierarchical, efficient', 'R-tree: balanced tree for spatial data — good for range queries and nearest neighbor', 'PostGIS / MongoDB 2dsphere: built-in geospatial indexes and query support'] },
      { title: 'Real-Time Location', points: ['Driver/rider location updates: every 3-5 seconds via WebSocket or MQTT', 'Grid-based matching: divide city into cells, only search nearby cells for matches', 'ETA calculation: precomputed graph (road network) + real-time traffic overlay', 'Geofencing: trigger events when user enters/exits a geographic boundary', 'Historical trajectory: time-series of positions for route analysis'] },
    ],
    invariants: ['Geohash edge problem: nearby points can have very different geohashes at cell boundaries', 'Location data is high-write, high-read — need write-optimized store + read cache', 'Privacy: location data is extremely sensitive — encrypt, limit retention, anonymize'],
    thinkingFramework: [
      { condition: 'Find nearby restaurants/stores', action: 'Geohash in Redis (sorted set by geohash prefix) or PostGIS' },
      { condition: 'Real-time ride matching (Uber)', action: 'Grid-based matching + WebSocket for live updates + Redis for driver positions' },
      { condition: 'Delivery ETA', action: 'Pre-built road graph (OSRM/GraphHopper) + live traffic weights' },
      { condition: 'Large-scale geofencing (millions of fences)', action: 'S2 cells + event-driven fence check on location update' },
    ],
    tricks: [
      { name: 'Multi-Resolution Geohash', tip: 'Use shorter geohash for wide searches (4 chars ≈ 39km), longer for precise (7 chars ≈ 153m). Start wide, filter down.', when: 'Variable-radius proximity search', avoid: 'Fixed-radius queries with PostGIS' },
    ],
    pitfalls: ['Geohash boundary issue — always query neighboring cells too', 'Storing raw lat/lng without spatial index → full table scan for proximity', 'Not accounting for Earth being a sphere — Euclidean distance is wrong at scale', 'Sending location updates too frequently → bandwidth and battery drain'],
    keyDesigns: [
      { title: 'Uber/Ola Ride Matching', difficulty: 'Hard', focus: 'Real-time location, matching algorithm, ETA' },
      { title: 'Yelp/Zomato Nearby Search', difficulty: 'Medium', focus: 'Geospatial indexing, search ranking, caching' },
    ]
  },
  {
    id: 'notification-system', title: 'Notification & Push Systems', stage: 'realtime-systems',
    icon: '🔔', color: '#15803d', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Push notifications (FCM/APNs), email delivery, SMS, in-app notifications, priority queues, user preferences.',
    concepts: [
      { title: 'Notification Channels', points: ['Push (Mobile): FCM (Android), APNs (iOS) — fire-and-forget, no guarantee of delivery', 'Email: SMTP via SendGrid/SES — async, trackable (open/click), templates', 'SMS: Twilio/SNS — expensive, use for critical alerts (OTP, account security)', 'In-App: WebSocket/SSE for real-time, API polling for non-critical — always delivered if user is online', 'Webhook: HTTP callback to external systems — retry with exponential backoff'] },
      { title: 'Architecture', points: ['Event → Notification Service → Channel Router → Delivery Workers', 'Priority Queue: critical (OTP) > high (order update) > low (marketing) — separate queues', 'User Preferences: opt-in/out per channel, quiet hours, frequency capping', 'Deduplication: prevent sending same notification twice (idempotency key)', 'Template Engine: dynamic content injection, i18n, A/B testing'] },
    ],
    invariants: ['Push notifications are not guaranteed — FCM/APNs are best-effort', 'Rate limiting per user is essential — notification fatigue drives uninstalls', 'Always have an unsubscribe mechanism — legal requirement (CAN-SPAM, GDPR)'],
    thinkingFramework: [
      { condition: 'Time-sensitive (OTP, security alert)', action: 'SMS + Push simultaneously, highest priority queue' },
      { condition: 'Transactional (order confirmation)', action: 'Email + In-App, medium priority' },
      { condition: 'Marketing/engagement', action: 'Push + Email with frequency cap, lowest priority, respect preferences' },
      { condition: 'System alerting', action: 'Webhook + PagerDuty/Slack, with escalation policy' },
    ],
    tricks: [
      { name: 'Fan-Out per Channel', tip: 'One notification event → route to 3+ channels in parallel. Each channel has its own worker pool and retry logic. Failure in one channel doesn\'t block others.', when: 'Multi-channel notification system', avoid: 'Single-channel systems' },
    ],
    pitfalls: ['Not implementing user preference management → compliance violations', 'Sending all notifications through one queue → OTP delayed behind marketing batch', 'Not tracking delivery status → no visibility into notification failures', 'Not rate-limiting → sending 50 notifications in 1 minute to same user'],
    keyDesigns: [
      { title: 'Notification Platform (like Firebase)', difficulty: 'Hard', focus: 'Multi-channel, priorities, preferences, templates' },
    ]
  },
  // ═══════════════ PHASE 9: DATA PIPELINES & STORAGE ═══════════════
  {
    id: 'data-pipeline-etl', title: 'ETL & Batch Processing', stage: 'data-pipelines',
    icon: '⚙️', color: '#8b5cf6', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'Extract-Transform-Load pipelines, Apache Spark, data warehousing, batch vs micro-batch, data quality.',
    concepts: [
      { title: 'ETL Pipeline', points: ['Extract: pull data from sources (databases, APIs, files, event streams)', 'Transform: clean, validate, enrich, aggregate, denormalize for analytics', 'Load: write to target (data warehouse, data lake, analytics DB)', 'ELT (modern): load raw data first into warehouse, transform there (Snowflake, BigQuery)', 'Orchestration: Airflow, Prefect, Dagster — DAG-based scheduling and dependency management'] },
      { title: 'Batch Processing', points: ['Apache Spark: distributed compute — map-reduce style, in-memory processing', 'Batch window: nightly/hourly jobs — process accumulated data in bulk', 'Micro-batch: small batches every few minutes — compromise between batch and streaming', 'Data Quality: schema validation, null checks, deduplication, anomaly detection', 'Idempotent pipelines: re-running should produce same result (handle duplicates)'] },
    ],
    invariants: ['ETL should be idempotent — re-running must not create duplicates', 'Data quality checks must run before loading to production tables', 'Backfilling historical data must not impact production pipeline'],
    thinkingFramework: [
      { condition: 'Business analytics/reporting', action: 'Nightly ETL to data warehouse (Snowflake/BigQuery)' },
      { condition: 'Near-real-time dashboards (< 5 min delay)', action: 'Micro-batch with Spark Structured Streaming' },
      { condition: 'ML model training data', action: 'Feature pipeline: raw data → feature store → training dataset' },
      { condition: 'Multiple data sources needing consolidation', action: 'Airflow-orchestrated multi-source ETL with data quality gates' },
    ],
    tricks: [
      { name: 'Incremental Processing', tip: 'Don\'t process all data every run. Use watermarks/timestamps to process only new/changed data. Reduces compute by 10-100x.', when: 'Any recurring batch job', avoid: 'When full reprocessing is cheap' },
    ],
    pitfalls: ['Non-idempotent pipelines → duplicate data on retry', 'Not monitoring pipeline freshness → stale data in dashboards', 'Giant monolithic pipeline → one step fails, everything fails', 'No data quality checks → garbage in, garbage out'],
    keyDesigns: [
      { title: 'Analytics Data Warehouse', difficulty: 'Medium', focus: 'Star schema, ETL, query optimization' },
      { title: 'ML Feature Pipeline', difficulty: 'Hard', focus: 'Feature store, training/serving consistency' },
    ]
  },
  {
    id: 'stream-processing', title: 'Stream Processing', stage: 'data-pipelines',
    icon: '🌊', color: '#7c3aed', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'Apache Kafka Streams, Flink, windowing (tumbling, sliding, session), exactly-once processing, watermarks.',
    concepts: [
      { title: 'Stream Processing Engines', points: ['Kafka Streams: library (not cluster) — runs in your app, scales with Kafka partitions', 'Apache Flink: distributed engine — powerful windowing, exactly-once, checkpointing', 'Spark Structured Streaming: micro-batch streaming — good if you already use Spark', 'AWS Kinesis / GCP Dataflow: managed streaming — less operational overhead'] },
      { title: 'Windowing', points: ['Tumbling Window: fixed, non-overlapping (every 5 min) — simple aggregations', 'Sliding Window: overlapping (5 min window, slides every 1 min) — smoothed aggregations', 'Session Window: grouped by activity — gap of inactivity closes the window', 'Watermarks: track event-time progress — handle late-arriving events', 'Exactly-once: checkpoint + idempotent writes — Kafka transactions + Flink checkpoints'] },
    ],
    invariants: ['Event time ≠ processing time — always use event timestamps for windowing', 'Late data is inevitable — watermark defines how long to wait before closing window', 'Exactly-once in streaming is achieved by combining at-least-once delivery + idempotent writes'],
    thinkingFramework: [
      { condition: 'Real-time fraud detection', action: 'Stream processing with session windows + ML model inference' },
      { condition: 'Live dashboard metrics (count, sum)', action: 'Tumbling windows in Kafka Streams or Flink' },
      { condition: 'Real-time recommendations', action: 'Stream processing enriched with user profile data (stream-table join)' },
      { condition: 'IoT sensor data aggregation', action: 'Flink with watermarks for late data + tumbling windows' },
    ],
    tricks: [
      { name: 'Stream-Table Join', tip: 'Enrich events with user/product data by joining stream with a compacted topic or database. Example: order_event JOIN user_profile → enriched order.', when: 'Need context for stream events', avoid: 'When enrichment data changes very frequently' },
    ],
    pitfalls: ['Using processing time instead of event time → incorrect aggregations', 'Not handling late data → dropped or double-counted events', 'Too many stateful operations → large state, slow checkpoints', 'Not monitoring consumer lag → processing falling behind, data getting stale'],
    keyDesigns: [
      { title: 'Real-Time Fraud Detection', difficulty: 'Hard', focus: 'Stream processing, ML, low-latency alerting' },
      { title: 'Live Dashboard Analytics', difficulty: 'Medium', focus: 'Windowed aggregations, materialized views' },
    ]
  },
  {
    id: 'data-lakes-warehouse', title: 'Data Lakes & Data Warehouses', stage: 'data-pipelines',
    icon: '🏗️', color: '#6d28d9', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'Data lake (S3/ADLS), data warehouse (Snowflake/BigQuery), lakehouse (Delta Lake/Iceberg), schema-on-read vs write.',
    concepts: [
      { title: 'Data Lake vs Warehouse', points: ['Data Lake: store everything raw in cheap storage (S3). Schema-on-read. Flexible but chaotic.', 'Data Warehouse: structured, optimized for SQL analytics. Schema-on-write. Fast queries.', 'Lakehouse (modern): combines both — open format (Parquet) + warehouse features (Delta Lake, Iceberg)', 'Medallion Architecture: Bronze (raw) → Silver (cleaned) → Gold (business-ready) layers', 'Data Catalog: metadata management — what data exists, schema, ownership, lineage'] },
      { title: 'Storage Formats', points: ['Parquet: columnar, compressed — best for analytics (100x faster than CSV for scans)', 'Avro: row-based, schema evolution — good for Kafka messages', 'ORC: columnar, Hive optimized — similar to Parquet', 'Delta Lake / Iceberg: table format on top of Parquet — ACID transactions, time travel, upserts', 'Partitioning: organize by date/region for faster queries — avoid small file problem'] },
    ],
    invariants: ['Data lake without governance = data swamp — catalog, lineage, and quality are essential', 'Columnar formats (Parquet) are 10-100x faster for analytics than row formats (CSV/JSON)', 'Schema evolution must be backward compatible — don\'t break downstream consumers'],
    thinkingFramework: [
      { condition: 'Ad-hoc analytics, uncertain queries', action: 'Data lake (S3 + Parquet) with Athena/Presto' },
      { condition: 'Business intelligence, dashboards', action: 'Data warehouse (Snowflake/BigQuery) with star/snowflake schema' },
      { condition: 'Need both flexibility and performance', action: 'Lakehouse (Delta Lake on S3 + Spark SQL)' },
      { condition: 'ML training data at scale', action: 'Data lake with feature store overlay' },
    ],
    tricks: [
      { name: 'Medallion Architecture', tip: 'Bronze = raw ingestion (append-only). Silver = cleaned, deduplicated, typed. Gold = aggregated, business-ready tables. Each layer is independent and reprocessable.', when: 'Any production data platform', avoid: 'N/A' },
    ],
    pitfalls: ['Data lake without catalog → nobody knows what data exists', 'Too many small files → slow queries, high metadata overhead', 'Not partitioning correctly → full scans on every query', 'Schema changes breaking downstream consumers (use schema registry)'],
    keyDesigns: [
      { title: 'Enterprise Data Platform', difficulty: 'Hard', focus: 'Lakehouse, governance, self-service analytics' },
    ]
  },
  // ═══════════════ PHASE 10: DESIGN PATTERNS & APPROACHES ═══════════════
  {
    id: 'proxy-gateway-patterns', title: 'Proxy, Gateway & Sidecar Patterns', stage: 'design-approaches',
    icon: '🚪', color: '#0ea5e9', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'API Gateway pattern, BFF (Backend for Frontend), Sidecar/Service Mesh, Ambassador, reverse proxy.',
    concepts: [
      { title: 'API Gateway Pattern', points: ['Single entry point for all clients — handles auth, rate limiting, routing, SSL termination', 'Request routing: path-based routing to appropriate microservice', 'Protocol translation: REST from client → gRPC to internal services', 'Aggregation: combine responses from multiple services into one for the client', 'Examples: Kong, AWS API Gateway, Nginx, Envoy, Apigee'] },
      { title: 'Advanced Patterns', points: ['BFF (Backend for Frontend): separate gateway per client type (mobile, web, IoT)', 'Sidecar Pattern: deploy helper container alongside main app (logging, auth proxy)', 'Service Mesh: sidecar proxies on every service handle networking (Istio/Linkerd)', 'Ambassador Pattern: sidecar specifically for outbound connections (circuit breaker, retries)', 'Strangler Fig: route traffic gradually from monolith to microservices via gateway'] },
    ],
    invariants: ['API Gateway is a single point of failure — deploy redundantly', 'BFF prevents one API serving all client needs poorly — separate concerns per client', 'Service mesh adds latency (1-3ms per hop) — worth it for large microservices, overhead for small systems'],
    thinkingFramework: [
      { condition: 'Multiple clients (web, mobile, IoT)', action: 'BFF pattern — one gateway per client type' },
      { condition: 'Microservices needing consistent auth/logging', action: 'API Gateway with middleware for cross-cutting concerns' },
      { condition: '10+ microservices needing resilience', action: 'Service mesh (Istio) for automatic retries, circuit breakers, mTLS' },
      { condition: 'Migrating from monolith', action: 'Strangler fig — route new features to new services via gateway' },
    ],
    tricks: [
      { name: 'Gateway as Rate Limiter', tip: 'Apply rate limits at the gateway before requests reach services. Different limits per API key/user tier. Protects all downstream services.', when: 'Public-facing APIs', avoid: 'Internal-only services' },
    ],
    pitfalls: ['Too much logic in gateway → becomes a performance bottleneck', 'Gateway as monolith — keep it thin, delegate to services', 'Not monitoring gateway latency → silent degradation', 'Over-engineering with service mesh for 3-4 services'],
    keyDesigns: [
      { title: 'API Gateway Platform', difficulty: 'Medium', focus: 'Routing, auth, rate limiting, aggregation' },
      { title: 'Service Mesh Implementation', difficulty: 'Hard', focus: 'Sidecar, mTLS, traffic management' },
    ]
  },
  {
    id: 'domain-driven-design', title: 'Domain-Driven Design (DDD)', stage: 'design-approaches',
    icon: '🎯', color: '#0284c7', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'Bounded contexts, aggregates, entities, value objects, domain events, ubiquitous language, context mapping.',
    concepts: [
      { title: 'Strategic DDD', points: ['Bounded Context: a boundary within which a specific domain model is defined and applicable', 'Ubiquitous Language: shared vocabulary between developers and domain experts', 'Context Map: visual representation of relationships between bounded contexts', 'Subdomain Types: Core (competitive advantage), Supporting (necessary), Generic (commodity)', 'Anti-Corruption Layer (ACL): adapter between your model and external/legacy system'] },
      { title: 'Tactical DDD', points: ['Entity: has identity, lifecycle (e.g., User, Order) — identity persists even if attributes change', 'Value Object: defined by attributes, immutable, no identity (e.g., Money, Address)', 'Aggregate: cluster of entities/VOs with a root entity — transaction boundary', 'Domain Event: something that happened (OrderPlaced, PaymentCompleted) — drives decoupling', 'Repository: abstraction for data access — one repository per aggregate root'] },
    ],
    invariants: ['One aggregate = one transaction boundary — never modify two aggregates in one transaction', 'Aggregates communicate via domain events, not direct calls', 'Bounded context should align with team boundaries (Conway\'s Law)'],
    thinkingFramework: [
      { condition: 'Complex business domain with many rules', action: 'Apply DDD — model the domain first, then build' },
      { condition: 'Multiple teams working on overlapping domains', action: 'Define bounded contexts aligned with team ownership' },
      { condition: 'Legacy system integration', action: 'Anti-corruption layer to translate between models' },
      { condition: 'Need cross-aggregate consistency', action: 'Domain events + eventual consistency (saga if needed)' },
    ],
    tricks: [
      { name: 'Event Storming', tip: 'Workshop technique: put domain events on sticky notes, group by aggregate, discover bounded contexts. Best way to start DDD in a new domain.', when: 'Starting a new project or restructuring', avoid: 'N/A' },
    ],
    pitfalls: ['Applying DDD to simple CRUD applications (over-engineering)', 'Making aggregates too large → performance and locking issues', 'Ignoring ubiquitous language → developers and business speak different languages', 'Not aligning bounded contexts with team boundaries → coordination overhead'],
    keyDesigns: [
      { title: 'E-Commerce Domain Model', difficulty: 'Hard', focus: 'Order, Inventory, Payment aggregates, domain events' },
      { title: 'Banking System', difficulty: 'Hard', focus: 'Account aggregate, transaction events, regulatory compliance' },
    ]
  },
  {
    id: 'twelve-factor-app', title: '12-Factor App & Cloud Principles', stage: 'design-approaches',
    icon: '📐', color: '#0369a1', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'The twelve-factor methodology, cloud-native principles, immutable infrastructure, config management.',
    concepts: [
      { title: 'The 12 Factors', points: ['1. Codebase: one repo per service, many deploys (dev, staging, prod)', '2. Dependencies: explicitly declare (package.json, requirements.txt), never rely on system packages', '3. Config: store in environment variables, not in code (no hardcoded URLs/keys)', '4. Backing Services: treat DB, cache, queue as attached resources — swap without code changes', '5. Build, Release, Run: strict separation — build once, configure per environment, run immutably', '6. Processes: stateless, share-nothing — store state in external services (DB, Redis)'] },
      { title: '12 Factors (continued)', points: ['7. Port Binding: app self-contains its web server — exports HTTP on a port', '8. Concurrency: scale by running more processes (horizontal), not bigger processes (vertical)', '9. Disposability: fast startup, graceful shutdown — can be killed and restarted anytime', '10. Dev/Prod Parity: keep environments as similar as possible — use containers', '11. Logs: treat as event streams — write to stdout, let platform collect and aggregate', '12. Admin Processes: run one-off tasks (migrations, scripts) as the same codebase, same environment'] },
    ],
    invariants: ['Stateless processes = horizontal scaling. State belongs in backing services.', 'Config ≠ code — anything that varies between deploys is config', 'Dev/prod parity reduces "works on my machine" bugs — containers help'],
    thinkingFramework: [
      { condition: 'Deploying to cloud / Kubernetes', action: 'Follow all 12 factors — they are designed for this' },
      { condition: 'Config management', action: 'Environment variables for secrets, config files for structure (not secrets!)' },
      { condition: 'Application logging', action: 'Log to stdout, use Fluentd/Logstash/CloudWatch for collection' },
      { condition: 'Database migrations', action: 'Run as admin process with same codebase, not manual SQL scripts' },
    ],
    tricks: [
      { name: 'Feature Flags over Config', tip: 'Use feature flags (LaunchDarkly, Unleash) for runtime config changes instead of redeploying. Separate deployment from release.', when: 'Gradual rollouts, A/B testing', avoid: 'Simple on/off config' },
    ],
    pitfalls: ['Storing secrets in code or config files committed to git', 'Stateful processes that lose data on restart', 'Different tools/versions between dev and prod environments', 'Not implementing graceful shutdown → dropped requests during deploy'],
    keyDesigns: [
      { title: 'Cloud-Native Microservice Template', difficulty: 'Medium', focus: '12-factor compliance, containerization, CI/CD' },
    ]
  },
  // ═══════════════ PHASE 11: CASE STUDY ARCHITECTURES ═══════════════
  {
    id: 'case-netflix', title: 'Case Study: Netflix Architecture', stage: 'case-studies',
    icon: '🎬', color: '#e11d48', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'Netflix\'s microservices, content delivery, recommendation engine, chaos engineering, and global failover.',
    concepts: [
      { title: 'Core Architecture', points: ['700+ microservices on AWS — Zuul (API gateway), Eureka (service discovery), Ribbon (LB)', 'Open Connect CDN: Netflix\'s own CDN — caches content on ISP networks for ultra-low latency', 'Personalization: ML-powered recommendations — 80% of watched content is recommended', 'Encoding pipeline: one movie encoded into 1,200+ streams (resolutions, devices, codecs)', 'Global failover: active-active across 3 AWS regions — redirect traffic in minutes'] },
      { title: 'Key Innovations', points: ['Chaos Engineering: Chaos Monkey (kill instances), Chaos Kong (kill regions) — test resilience in production', 'Eventually consistent: user profile synced across regions with eventual consistency — accept stale reads', 'Adaptive streaming: ABR (Adaptive Bitrate) — client switches quality based on bandwidth', 'Data pipeline: Keystone (real-time event processing) — 500B events/day for analytics and recommendations', 'Cache warming: pre-populate CDN caches before new content launches (Friday night surge)'] },
    ],
    invariants: ['Single region failure must not take down Netflix — design for multi-region active-active', 'Content must start playing in < 3 seconds — CDN + edge caching critical', 'Personalization drives 80% of engagement — recommendation system is core business'],
    thinkingFramework: [
      { condition: 'Design a video streaming platform', action: 'Focus on: encode pipeline → CDN → adaptive streaming → recommendation' },
      { condition: 'How to handle 200M+ concurrent users', action: 'Microservices + regional deployment + CDN at ISP level' },
      { condition: 'Ensuring reliability at scale', action: 'Chaos engineering + circuit breakers + multi-region failover' },
      { condition: 'Content recommendation', action: 'Collaborative filtering + content-based + real-time signals (what you watched today)' },
    ],
    tricks: [
      { name: 'Predictive CDN Caching', tip: 'Predict which shows will be popular on Friday night, pre-cache at edge PoPs. ML models predict demand per region. Prevents origin overload on launch night.', when: 'Content platforms with predictable demand spikes', avoid: 'Uniform access patterns' },
    ],
    pitfalls: ['Not encoding in multiple resolutions → poor experience on slow networks', 'Single-region architecture → one outage takes down everything', 'Not investing in recommendations → user churn (can\'t find content to watch)', 'Over-trusting CDN → not having origin fallback for cache misses'],
    keyDesigns: [
      { title: 'Design Netflix', difficulty: 'Hard', focus: 'Video pipeline, CDN, recommendations, adaptive streaming' },
      { title: 'Design Disney+/Hotstar', difficulty: 'Hard', focus: 'Live streaming + on-demand, spike handling (IPL/Super Bowl)' },
    ]
  },
  {
    id: 'case-uber', title: 'Case Study: Uber Architecture', stage: 'case-studies',
    icon: '🚗', color: '#be123c', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'Uber\'s real-time dispatch, geospatial matching, surge pricing, ETA prediction, and global architecture.',
    concepts: [
      { title: 'Core Components', points: ['Dispatch System: match riders to nearest available drivers in real-time (< 10 sec)', 'Geospatial Index: city divided into cells (Google S2) — only search nearby cells for drivers', 'Driver Location Service: 4M drivers updating positions every 4 seconds = 1M location updates/sec', 'Surge Pricing: dynamic pricing based on supply-demand in each zone — ML-driven', 'ETA Engine: graph-based routing on road network + real-time traffic data'] },
      { title: 'Architecture Decisions', points: ['Schemaless: Uber\'s custom storage layer on top of MySQL — append-only, versioned', 'Ringpop: consistent hashing-based routing for stateful services', 'Kafka: backbone for event streaming (trip events, driver locations, payments)', 'H3: Uber\'s hexagonal geospatial indexing system — each hex cell is ~0.7 km²', 'Multi-tenancy: same platform serves UberX, UberPool, Uber Eats — shared infra, different business logic'] },
    ],
    invariants: ['Driver location must be updated in near real-time (< 5 sec) — stale location = bad matching', 'Trip state machine (REQUESTED → MATCHED → STARTED → COMPLETED) must be consistent', 'Payment processing must be exactly-once — double-charging or lost payments are critical bugs'],
    thinkingFramework: [
      { condition: 'Design a ride-hailing app', action: 'Focus on: location tracking → matching algorithm → trip lifecycle → payment' },
      { condition: 'Matching riders to drivers', action: 'Geospatial index (S2/H3) + nearest-available search + ETA-based ranking' },
      { condition: 'Handling peak demand', action: 'Surge pricing to balance supply-demand + queue for requests when no drivers' },
      { condition: 'Scaling globally', action: 'City-specific deployments + shared platform services + data sovereignty' },
    ],
    tricks: [
      { name: 'ETA as Ranking', tip: 'Don\'t just find the nearest driver by distance — find the driver with the shortest ETA (considers traffic, road network). A driver 2 km away on a highway may arrive faster than one 500m away in traffic.', when: 'Any routing/matching system', avoid: 'Simple proximity (Euclidean distance)' },
    ],
    pitfalls: ['Using Euclidean distance instead of road network distance for matching', 'Not handling driver going offline/unavailable during matching', 'Surge pricing without transparency → user trust issues', 'Not considering multi-stop trips or shared rides (UberPool complexity)'],
    keyDesigns: [
      { title: 'Design Uber/Ola', difficulty: 'Hard', focus: 'Real-time matching, geospatial, surge pricing, trip lifecycle' },
      { title: 'Design Uber Eats/Swiggy', difficulty: 'Hard', focus: 'Three-sided marketplace (user, restaurant, delivery)' },
    ]
  },
  {
    id: 'case-whatsapp', title: 'Case Study: WhatsApp Architecture', stage: 'case-studies',
    icon: '💬', color: '#9f1239', difficulty: 'Hard', estimatedTime: '3–4 hours',
    description: 'WhatsApp\'s messaging, end-to-end encryption, media handling, group chat, presence, and 2B user scale.',
    concepts: [
      { title: 'Messaging Architecture', points: ['Erlang/BEAM VM: WhatsApp\'s core — 2.5M connections per server, excellent for concurrency', 'Message storage: messages stored only until delivered (not permanently on server)', 'Delivery receipt: sent → delivered (two checks) → read (blue ticks) — state machine per message', 'Group messaging: server fans out to each group member — each gets individual delivery', 'Media: separate upload/download flow — upload to CDN, send URL+key in message'] },
      { title: 'End-to-End Encryption', points: ['Signal Protocol: Double Ratchet algorithm — new key for every message (forward secrecy)', 'Key exchange: pre-keys uploaded to server during registration — async key exchange', 'Server never sees plaintext — only encrypted blobs pass through', 'Group encryption: Sender Keys protocol — one shared key per sender in the group', 'Media encryption: AES-256 encrypted before upload, key sent in the message'] },
    ],
    invariants: ['Messages must be delivered exactly once and in order per conversation', 'End-to-end encryption means server cannot read messages — zero knowledge', 'Message ordering uses vector clocks / logical timestamps — not server wall clock'],
    thinkingFramework: [
      { condition: 'Design a chat application', action: 'Focus on: connection (WebSocket) → message routing → delivery guarantees → storage' },
      { condition: 'Ensuring message ordering', action: 'Sequence numbers per conversation + server-side ordering + client-side reordering' },
      { condition: 'Group messaging at scale', action: 'Fan-out on send: sender → server → each group member. Limit group size for performance.' },
      { condition: 'End-to-end encryption', action: 'Signal protocol — key exchange, double ratchet, per-message keys, forward secrecy' },
    ],
    tricks: [
      { name: 'Message Queue per User', tip: 'Each user has a personal message queue. When user is offline, messages queue up. On reconnect, drain queue. If queue is full or outdated, messages expire.', when: 'Messaging with offline delivery', avoid: 'Systems where all users are always online' },
    ],
    pitfalls: ['Not handling out-of-order message delivery → confusing conversations', 'Storing messages permanently on server → privacy and storage issues', 'Not implementing read receipts atomically → inconsistent blue ticks', 'Group fan-out without limits → 10K group = 10K messages per message sent'],
    keyDesigns: [
      { title: 'Design WhatsApp/Telegram', difficulty: 'Hard', focus: 'Messaging, E2E encryption, delivery guarantees, presence' },
      { title: 'Design Slack', difficulty: 'Hard', focus: 'Workspaces, channels, threads, search, integrations' },
    ]
  },
];

export const getSDTopicIds = () => SD_TOPICS.map(t => t.id);
export const getSDTopicsByStage = (stageId) => SD_TOPICS.filter(t => t.stage === stageId);

