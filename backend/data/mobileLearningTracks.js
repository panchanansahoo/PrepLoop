export const MOBILE_LEARNING_TRACKS = {
  hr: {
    id: 'hr',
    title: 'HR Learning Path',
    modules: [
      {
        id: 'hr1',
        title: 'Introduction to HR Interviews',
        description: 'Understand the purpose and structure of behavioral interviews.',
        total_topics: 2,
        content: [
          'HR and behavioral interviews evaluate how you collaborate, communicate under pressure, and align with a team culture.',
          '1. Interview Structure: Expect an introduction ("Tell me about yourself"), 2-4 behavioral deep-dives, motivation/culture questions, and your questions for the interviewer.',
          '2. Personal Elevator Pitch (Present -> Past -> Future): Summarize your current role and signature impact, highlight 1-2 relevant past experiences, and connect them to why this role is your next step.',
          '3. Key Signals Evaluated: Ownership, clarity, self-awareness, structured thinking, and genuine curiosity about the product and team.',
        ].join('\n\n'),
        code_example: [
          'Elevator Pitch Template (60-90 seconds):',
          '- Present: "I currently build ... and recently improved ... by X%."',
          '- Past:    "Before that, I worked on ... where I learned ..."' ,
          '- Future:  "I am excited about this team because ..."' ,
        ].join('\n'),
      },
      {
        id: 'hr2',
        title: 'The STAR Method',
        description: 'Learn how to structure your answers using Situation, Task, Action, Result.',
        total_topics: 3,
        content: [
          'The STAR framework keeps behavioral answers concise, evidence-based, and focused on your personal contribution.',
          '• Situation (15%): Set the context briefly—project, stakes, and constraints.',
          '• Task (15%): Clarify what you specifically owned or needed to solve.',
          '• Action (50%): Walk through the decisions you made, trade-offs weighed, and how you unblocked others. Use "I", not just "we".',
          '• Result (20%): Share measurable outcomes (latency, revenue, adoption, hours saved) and one concrete lesson learned.',
        ].join('\n\n'),
        code_example: [
          'STAR Story Bank Checklist:',
          '1. Conflict / Disagreement with a teammate',
          '2. Tight deadline or production incident',
          '3. Ambiguous requirement you clarified and shipped',
          '4. Mistake you owned and fixed permanently',
        ].join('\n'),
      },
      {
        id: 'hr3',
        title: 'Common HR Questions',
        description: 'Tell me about yourself, strengths/weaknesses, and conflict resolution.',
        total_topics: 6,
        content: [
          'Prepare crisp, authentic stories for the highest-frequency HR prompts rather than memorizing robotic scripts.',
          '• Greatest Strength: Pick a role-relevant strength backed by a verifiable metric or project outcome.',
          '• Greatest Weakness: Share a real growth area (not a disguised humblebrag), the concrete habit you adopted to address it, and recent evidence of improvement.',
          '• Conflict Resolution: Focus on listening first, aligning on shared user/business goals, evaluating data objectively, and preserving trust.',
          '• Failure & Ownership: Own the mistake without blaming teammates and explain the guardrail or process change you put in place.',
        ].join('\n\n'),
        code_example: [
          'Weakness Framing Pattern:',
          '[Real Gap] -> [Trigger/Awareness] -> [Concrete System You Built] -> [Measurable Improvement]',
        ].join('\n'),
      },
      {
        id: 'hr4',
        title: 'Company Research & Culture Fit',
        description: 'How to research a company and show alignment with their values.',
        total_topics: 3,
        content: [
          'Strong candidates connect their own engineering values to the company’s stage, product bets, and operating principles.',
          '1. Product & Architecture: Try the product, read recent engineering blog posts, and note 1-2 technical challenges the team likely faces.',
          '2. Mission & Values: Translate company principles (e.g. customer obsession, bias for action, craftsmanship) into real examples from your work.',
          '3. Thoughtful Questions: Ask about engineering trade-offs, onboarding expectations in the first 90 days, and how success is measured.',
        ].join('\n\n'),
        code_example: [
          'High-Signal Questions to Ask Interviewers:',
          '- "What is the biggest technical bottleneck the team is tackling this quarter?"',
          '- "What differentiates someone who ramps up well in their first 90 days here?"',
        ].join('\n'),
      },
      {
        id: 'hr5',
        title: 'Salary Negotiation & Closing',
        description: 'Professional etiquette, asking questions, and negotiating offers.',
        total_topics: 4,
        content: [
          'Negotiation is a collaborative discussion about total compensation, scope, and mutual fit.',
          '1. Delay Anchoring Early: When asked for expectations early, share that you are focused on role fit and learning the full compensation band.',
          '2. Evaluate Total Compensation: Compare base salary, sign-on bonus, equity/vesting, performance bonus, and growth trajectory.',
          '3. Anchor with Market Data: Express enthusiasm for the offer first, then present a clear, data-backed target range with calm professionalism.',
        ].join('\n\n'),
        code_example: [
          'Negotiation Script:',
          '"I am really excited about joining the team. Based on my scope and market benchmarks',
          'for this level, I was targeting a total package closer to [X]. Is there flexibility',
          'on base salary or sign-on to bridge that gap?"',
        ].join('\n'),
      },
    ],
  },
  'system-design': {
    id: 'system-design',
    title: 'System Design Path',
    modules: [
      {
        id: 'sd1',
        title: 'Introduction to System Design',
        description: 'Learn the basics of scalability, availability, and reliability.',
        total_topics: 3,
        content: [
          'System design interviews evaluate how you translate ambiguous product goals into scalable, fault-tolerant architectures.',
          '1. Clarify Requirements: Separate functional requirements (core APIs & user flows) from non-functional requirements (QPS, latency SLA, durability, consistency).',
          '2. Scalability: Vertical scaling adds CPU/RAM to one host (simple, bounded); horizontal scaling distributes stateless traffic across multiple nodes behind a load balancer.',
          '3. Availability vs Reliability: Availability measures uptime percentage (99.9% = ~8.76h downtime/yr); reliability measures correctness and resilience over time.',
        ].join('\n\n'),
        code_example: [
          'Back-of-the-Envelope Reference:',
          '1M DAU * 10 req/day = 10M req/day (~115 avg QPS, ~350+ peak QPS)',
          'RAM read: ~100 ns | SSD random read: ~16 us | Same-DC RPC: ~0.5 ms',
        ].join('\n'),
      },
      {
        id: 'sd2',
        title: 'Networking & Communication',
        description: 'TCP/IP, UDP, WebSockets, Long Polling, and Server-Sent Events.',
        total_topics: 4,
        content: [
          'Choosing the right transport and API protocol determines latency, connection overhead, and scalability.',
          '• TCP vs UDP: TCP guarantees ordered, reliable delivery (HTTP, DBs); UDP trades reliability for minimal latency (video calls, gaming, DNS).',
          '• REST vs gRPC vs GraphQL: REST is ubiquitous and cache-friendly; gRPC uses HTTP/2 + Protobuf for low-latency internal microservices; GraphQL avoids over-fetching on complex UIs.',
          '• Real-time Patterns: Short polling (simple, wasteful), Long polling (holds request open), SSE (unidirectional server->client stream over HTTP), WebSockets (full-duplex persistent connection).',
        ].join('\n\n'),
        code_example: [
          'Protocol Selection Guide:',
          '- Live chat / multiplayer state  -> WebSockets',
          '- Live feeds / AI token streams -> Server-Sent Events (SSE)',
          '- Internal service-to-service   -> gRPC over HTTP/2',
        ].join('\n'),
      },
      {
        id: 'sd3',
        title: 'Databases & Storage',
        description: 'Relational vs NoSQL, Sharding, Replication, and CAP Theorem.',
        total_topics: 5,
        content: [
          'Data storage decisions shape consistency guarantees, read/write throughput, and operational complexity.',
          '• SQL vs NoSQL: Choose relational DBs (PostgreSQL/MySQL) for ACID transactions and complex joins; choose NoSQL (key-value, wide-column, document) for massive write scale or flexible schemas.',
          '• Replication: Primary-replica improves read scalability and failover; watch out for replication lag on read-after-write flows.',
          '• Sharding (Horizontal Partitioning): Split large tables by shard key (hash/range/consistent hashing). Choose a high-cardinality shard key to avoid hot partitions.',
          '• CAP Theorem: Under a network partition (P), a distributed store trades off linearizable Consistency (CP) vs Availability (AP).',
        ].join('\n\n'),
        code_example: [
          'Consistent Hashing Ring:',
          '- Hash both nodes and keys onto [0, 2^32 - 1]',
          '- Use virtual nodes to keep key distribution balanced',
          '- Adding/removing a node only moves ~1/N keys',
        ].join('\n'),
      },
      {
        id: 'sd4',
        title: 'Caching & Content Delivery',
        description: 'Redis, Memcached, CDNs, and caching strategies.',
        total_topics: 3,
        content: [
          'Caching eliminates redundant database and origin work, dramatically reducing P99 latency.',
          '• Cache-Aside (Lazy Loading): App checks cache first; on miss, reads DB and populates cache with a TTL.',
          '• Write-Through vs Write-Back: Write-through keeps cache and DB synchronous; write-back batches async DB writes for high throughput at the risk of data loss on crash.',
          '• Common Pitfalls: Cache stampede (mitigate with request coalescing/locking), hot keys, and stale invalidation. Pair with CDNs for static assets and edge caching.',
        ].join('\n\n'),
        code_example: [
          'Cache-Aside Read Pattern:',
          'val = redis.get(key)',
          'if (val == null) {',
          '  val = db.query(...)',
          '  redis.set(key, val, { EX: 300 })',
          '}',
          'return val',
        ].join('\n'),
      },
      {
        id: 'sd5',
        title: 'System Design Case Studies',
        description: 'Design URL Shortener, Twitter, WhatsApp, and Netflix.',
        total_topics: 8,
        content: [
          'Apply building blocks to classic end-to-end interview case studies:',
          '1. URL Shortener: Base62 encoding or counter service + Redis cache + 301/302 redirect trade-offs + async click analytics.',
          '2. News Feed (Twitter): Fan-out-on-write for regular users, fan-out-on-read (hybrid) for celebrities to prevent write amplification.',
          '3. Chat System (WhatsApp): Gateway WebSocket servers, session routing registry, message queue for offline delivery, and per-conversation sequence IDs.',
          '4. Video Streaming (Netflix): Object storage + async transcoding DAG (HLS/DASH chunks) + multi-tier CDN distribution.',
        ].join('\n\n'),
        code_example: [
          '4-Step Interview Cadence (45 min):',
          '1. Requirements & Scale Estimates (5 min)',
          '2. High-Level API & Data Model (10 min)',
          '3. Core Architecture & Deep Dives (20 min)',
          '4. Bottlenecks, Failure Modes & Monitoring (10 min)',
        ].join('\n'),
      },
    ],
  },
  technical: {
    id: 'technical',
    title: 'Technical Learning Path',
    modules: [
      {
        id: 'tech1',
        title: 'Operating Systems',
        description: 'Processes, Threads, Memory Management, and Concurrency.',
        total_topics: 5,
        content: [
          'Operating Systems fundamentals explain how code executes on CPUs, shares memory, and avoids concurrency hazards.',
          '• Process vs Thread: Processes have isolated virtual address spaces (heavyweight IPC); threads share heap/code within a process and have independent stacks/registers.',
          '• Deadlock (4 Coffman Conditions): Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Break any one condition (e.g. lock ordering) to prevent deadlock.',
          '• Synchronization: Mutexes enforce single-owner mutual exclusion; semaphores track a resource count across threads.',
          '• Virtual Memory & Paging: Maps virtual pages to physical frames via page tables + TLB; excessive page faults lead to thrashing.',
        ].join('\n\n'),
        code_example: [
          'Deadlock Prevention via Total Lock Ordering:',
          'function transfer(fromAcc, toAcc, amount) {',
          '  const [first, second] = fromAcc.id < toAcc.id ? [fromAcc, toAcc] : [toAcc, fromAcc];',
          '  lock(first); lock(second);',
          '  // safe transfer',
          '}',
        ].join('\n'),
      },
      {
        id: 'tech2',
        title: 'Database Management Systems',
        description: 'Normalization, Transactions, ACID properties, and Indexing.',
        total_topics: 6,
        content: [
          'DBMS mastery helps you design clean schemas, diagnose slow queries, and reason about concurrent transactions.',
          '• ACID Properties: Atomicity (all-or-nothing), Consistency (valid invariants), Isolation (concurrent safety), Durability (persisted via WAL).',
          '• Normalization: 1NF (atomic columns), 2NF (no partial dependency on composite keys), 3NF (no transitive dependencies), BCNF (every determinant is a candidate key).',
          '• Indexing: B+ Trees support range scans and equality lookups in O(log N); watch composite index leftmost-prefix order and write amplification.',
          '• Isolation Levels: Read Uncommitted, Read Committed, Repeatable Read (MVCC snapshots), Serializable (prevents phantom reads/write skew).',
        ].join('\n\n'),
        code_example: [
          'Composite Index Leftmost Prefix Rule:',
          'CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);',
          '-- Uses index: WHERE user_id = 42 AND created_at > ...',
          '-- Skips index: WHERE created_at > ... (missing leading user_id)',
        ].join('\n'),
      },
      {
        id: 'tech3',
        title: 'Computer Networks',
        description: 'OSI Model, TCP/IP, Routing, and Application Protocols.',
        total_topics: 4,
        content: [
          'Networking knowledge explains what happens from typing a URL in a browser to receiving a backend response.',
          '• Request Lifecycle: DNS resolution -> TCP 3-way handshake (SYN, SYN-ACK, ACK) -> TLS handshake -> HTTP request/response.',
          '• OSI vs TCP/IP Layers: Application (HTTP/DNS), Transport (TCP/UDP ports), Network (IP routing/CIDR), Link/Physical (Ethernet/ARP/MAC).',
          '• Congestion & Flow Control: TCP sliding window (receiver capacity) vs congestion window (network capacity, slow start, AIMD).',
          '• HTTP Evolution: HTTP/1.1 keep-alive (head-of-line blocking), HTTP/2 multiplexed streams, HTTP/3 over QUIC (UDP-based).',
        ].join('\n\n'),
        code_example: [
          'TCP 3-Way Handshake:',
          'Client  --- SYN (seq=x) -----------> Server',
          'Client  <-- SYN-ACK (seq=y, ack=x+1) Server',
          'Client  --- ACK (ack=y+1) ---------> Server',
        ].join('\n'),
      },
      {
        id: 'tech4',
        title: 'Object Oriented Programming',
        description: 'Inheritance, Polymorphism, Encapsulation, and Design Patterns.',
        total_topics: 5,
        content: [
          'Object-Oriented Design focuses on clean abstractions, low coupling, and extensible interfaces.',
          '• 4 Pillars: Encapsulation (hide internal invariants), Abstraction (expose contracts), Inheritance (is-a reuse), Polymorphism (swap implementations behind a shared interface).',
          '• Composition over Inheritance: Prefer composing small, focused behaviors to avoid fragile deep class hierarchies.',
          '• SOLID Principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
        ].join('\n\n'),
        code_example: [
          'Strategy Pattern (Open/Closed + Composition):',
          'class PaymentProcessor {',
          '  constructor(gateway) { this.gateway = gateway; }',
          '  pay(amount) { return this.gateway.charge(amount); }',
          '}',
        ].join('\n'),
      },
    ],
  },
};

/**
 * @param {string} trackId
 */
export function getMobileTrack(trackId) {
  return MOBILE_LEARNING_TRACKS[String(trackId || '').toLowerCase()] || null;
}

/**
 * @param {string} topicId
 * @param {string | null} [trackId]
 */
export function findMobileTrackModule(topicId, trackId = null) {
  const normalizedId = String(topicId || '').trim();
  if (!normalizedId) return null;

  if (trackId) {
    const track = getMobileTrack(trackId);
    if (!track) return null;
    const mod = track.modules.find((m) => String(m.id) === normalizedId);
    return mod ? { trackId: track.id, module: mod } : null;
  }

  for (const track of Object.values(MOBILE_LEARNING_TRACKS)) {
    const mod = track.modules.find((m) => String(m.id) === normalizedId);
    if (mod) return { trackId: track.id, module: mod };
  }
  return null;
}
