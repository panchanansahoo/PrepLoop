/**
 * Industry-standard question set presets for PrepLoop Recruiter Platform.
 * Each preset includes curated questions, evaluation contexts, expected topics,
 * and calibrated time limits.
 */

export const QUESTION_SET_TEMPLATES = [
  {
    id: 'frontend-react',
    title: 'Frontend Engineer (React & TypeScript)',
    description: 'Industry-standard technical evaluation for Frontend Engineers focusing on React 18/19 internals, state management, render lifecycle, DOM performance, and TypeScript contracts.',
    interviewType: 'technical',
    difficulty: 'medium',
    roleName: 'Frontend React Engineer',
    customInstructions: 'Assess candidate understanding of React concurrent features, hooks lifecycle, re-render avoidance, virtual DOM reconciliation, and modern state architectures. Look for concrete code examples and mental models.',
    probingMode: true,
    passingScore: 70,
    questions: [
      {
        question: "How does React's Reconciliation and Virtual DOM diffing algorithm work, specifically comparing React 16+ Fiber architecture with the legacy stack reconciler?",
        context: 'Evaluate knowledge of incremental rendering, work loop, fiber node structure, and priority lanes.',
        expectedTopics: ['Fiber Architecture', 'Reconciliation Algorithm', 'Priority Lanes', 'Work Loop', 'Commit Phase', 'Render Phase'],
        timeLimit: 120
      },
      {
        question: 'Explain the differences between useCallback, useMemo, and React.memo. When can over-memoizing actually hurt frontend performance?',
        context: 'Look for practical memory overhead considerations and dependency array stability.',
        expectedTopics: ['useMemo', 'useCallback', 'React.memo', 'Memory Overhead', 'Dependency Arrays', 'Referential Equality'],
        timeLimit: 90
      },
      {
        question: 'How would you diagnose and resolve a severe performance drop causing main-thread stuttering during high-frequency user input in a React dashboard?',
        context: 'Check for profiling techniques, debounce/throttle, useTransition, useDeferredValue, virtualization.',
        expectedTopics: ['React DevTools Profiler', 'useTransition', 'useDeferredValue', 'Windowing / Virtualization', 'Debounce / Throttle', 'Layout Thrashing'],
        timeLimit: 120
      },
      {
        question: 'Compare state management approaches in modern React (e.g. Zustand, Redux Toolkit, Context API + useReducer). What criteria guide your choice?',
        context: 'Examine scalability, re-render isolation, boilerplate, server state vs client state.',
        expectedTopics: ['Context API', 'Zustand', 'Redux Toolkit', 'Server State (React Query/SWR)', 'Unnecessary Re-renders', 'Atomic State'],
        timeLimit: 120
      },
      {
        question: 'How do you ensure accessibility (a11y) and keyboard navigation compliance in complex custom components like modals and comboboxes?',
        context: 'Look for ARIA attributes, focus trapping, screen reader announcements, semantic HTML.',
        expectedTopics: ['WAI-ARIA', 'Focus Management', 'Keyboard Navigation (Tab, Esc)', 'Screen Readers', 'Semantic HTML', 'Live Regions'],
        timeLimit: 90
      }
    ]
  },
  {
    id: 'backend-nodejs',
    title: 'Backend Engineer (Node.js & Distributed Systems)',
    description: 'Production-grade assessment for Backend Developers covering Node.js event loop internals, asynchronous concurrency, stream processing, database transaction isolation, and microservice resilience.',
    interviewType: 'technical',
    difficulty: 'medium',
    roleName: 'Backend Node.js Engineer',
    customInstructions: 'Probe for core Node.js runtime mechanics, libuv threading, stream backpressure, error handling boundaries, and database query optimization.',
    probingMode: true,
    passingScore: 70,
    questions: [
      {
        question: 'Walk through the phases of the Node.js Event Loop (Timers, Pending Callbacks, Poll, Check, Close). Where do process.nextTick and Promise microtasks execute?',
        context: 'Focus on libuv thread pool vs single-threaded loop and microtask starvation.',
        expectedTopics: ['Event Loop Phases', 'libuv', 'process.nextTick', 'Microtask Queue', 'Timers & setImmediate', 'Thread Pool'],
        timeLimit: 120
      },
      {
        question: 'How does Node.js handle memory leaks? Describe how you would analyze an out-of-memory crash using heap snapshots in a production Kubernetes pod.',
        context: 'Look for V8 memory limits, chrome-inspect, heapdump, closures, uncleaned timers/event listeners.',
        expectedTopics: ['V8 Heap Limit', 'Heap Snapshot', 'Memory Leaks', 'Event Emitter Listeners', 'Closures', 'GC Profiling'],
        timeLimit: 120
      },
      {
        question: 'Explain Node.js Streams and backpressure. How do you stream a 10GB file upload to S3 or a database without blowing up server RAM?',
        context: 'Evaluate pipe, pipeline, stream backpressure signals, highWaterMark, and chunked transfer.',
        expectedTopics: ['Readable / Writable Streams', 'Backpressure', 'pipeline() utility', 'highWaterMark', 'Buffer Management', 'Chunked Encoding'],
        timeLimit: 120
      },
      {
        question: 'How do you design database transactions with proper ACID guarantees and row-level locking to prevent race conditions during a double-booking or wallet deduction scenario?',
        context: 'Check knowledge of SELECT FOR UPDATE, optimistic concurrency control, transaction isolation levels.',
        expectedTopics: ['ACID Properties', 'SELECT FOR UPDATE', 'Optimistic Locking', 'Isolation Levels', 'Idempotency Keys', 'Rollbacks'],
        timeLimit: 120
      },
      {
        question: 'What strategies do you employ for API error handling, graceful shutdown (SIGTERM), and health check readiness in Node.js services?',
        context: 'Look for unhandledRejection, uncaughtException, draining in-flight requests, Kubernetes probes.',
        expectedTopics: ['Graceful Shutdown (SIGTERM)', 'Connection Draining', 'Centralized Error Middleware', 'Kubernetes Liveness / Readiness', 'Crash-only Architecture'],
        timeLimit: 90
      }
    ]
  },
  {
    id: 'system-design',
    title: 'System Design & Distributed Architecture',
    description: 'Comprehensive architectural interview assessing high-scale system design: horizontal scaling, CAP theorem trade-offs, caching tiers, asynchronous message queues, and fault tolerance.',
    interviewType: 'system-design',
    difficulty: 'hard',
    roleName: 'Systems Architect',
    customInstructions: 'Evaluate candidate ability to drive architectural trade-offs, estimate scale/throughput, decompose monoliths, design resilient databases, and implement rate limiters/caching.',
    probingMode: true,
    passingScore: 75,
    questions: [
      {
        question: 'Design a globally distributed URL Shortener (like TinyURL or Bitly) handling 100M new URLs per month and 10B clicks per month. Walk through the key generation service (KGS), storage schema, and latency optimizations.',
        context: 'Evaluate scale estimation, base62 encoding, pre-generated keys, cache eviction, and read-heavy replication.',
        expectedTopics: ['Scale Estimation', 'Key Generation Service (KGS)', 'Base62 Encoding', 'Redis Cache / LRU', 'Database Sharding', 'CDN Routing'],
        timeLimit: 150
      },
      {
        question: 'How would you design a distributed, multi-region Rate Limiter capable of handling 500,000 requests per second with sub-5ms overhead?',
        context: 'Look for sliding window counter, token bucket, Redis cluster with Lua scripts, or local memory with gossiping.',
        expectedTopics: ['Token Bucket / Leaky Bucket', 'Sliding Window Log / Counter', 'Redis + Lua Scripting', 'Distributed Concurrency', 'Local Cache Synchronization', 'Race Conditions'],
        timeLimit: 150
      },
      {
        question: 'Discuss the CAP theorem and PACELC trade-offs when choosing between Cassandra, DynamoDB, PostgreSQL, and CockroachDB for a real-time financial ledger vs an IoT analytics platform.',
        context: 'Assess consistency models: strong vs eventual, quorum reads/writes, two-phase commits.',
        expectedTopics: ['CAP Theorem', 'PACELC', 'Eventual vs Strong Consistency', 'Quorum Reads/Writes', 'Two-Phase Commit (2PC)', 'Saga Pattern'],
        timeLimit: 150
      },
      {
        question: 'How do you architect an idempotent payment processing pipeline utilizing message queues (Kafka/RabbitMQ) that guarantees exactly-once processing semantics?',
        context: 'Probe outbox pattern, consumer offset management, deduplication keys, dead letter queues.',
        expectedTopics: ['Transactional Outbox Pattern', 'Idempotency Keys', 'Dead Letter Queues (DLQ)', 'At-least-once Delivery', 'Consumer Group Offsets', 'Distributed Locks'],
        timeLimit: 150
      }
    ]
  },
  {
    id: 'behavioral-star',
    title: 'Behavioral Leadership & Engineering Collaboration (STAR)',
    description: 'Rigorous behavioral assessment following the STAR framework (Situation, Task, Action, Result) measuring conflict resolution, ownership, mentorship, and navigating technical disagreements.',
    interviewType: 'behavioral',
    difficulty: 'medium',
    roleName: 'Senior / Staff Software Engineer',
    customInstructions: 'Probe candidates for concrete STAR storytelling: clear ownership (use of I vs we), measurable outcomes, constructive conflict handling, and accountability for failures.',
    probingMode: true,
    passingScore: 70,
    questions: [
      {
        question: 'Tell me about a time when you strongly disagreed with a senior engineer or tech lead architectural decision. What was the situation, how did you present your case, and what was the outcome?',
        context: 'Look for data-driven disagreement, respectful communication, disagree-and-commit, and STAR structure.',
        expectedTopics: ['Constructive Conflict', 'Data-Driven Persuasion', 'Disagree and Commit', 'Technical Trade-offs', 'STAR Method', 'Diplomacy'],
        timeLimit: 120
      },
      {
        question: 'Describe a catastrophic production incident or critical bug that you were responsible for or led the resolution of. How did you triage, resolve it, and implement preventive measures?',
        context: 'Assess blameless post-mortem mindset, calmness under pressure, root cause analysis (5 Whys).',
        expectedTopics: ['Incident Triage & Mitigation', 'Blameless Post-Mortem', 'Root Cause Analysis (5 Whys)', 'Monitoring & Alerting Prevention', 'Ownership & Transparency'],
        timeLimit: 120
      },
      {
        question: 'Can you share an experience where you had to lead a cross-functional project with ambiguous requirements and tight deadlines? How did you align stakeholders and prioritize scope?',
        context: 'Check communication across disciplines, MVP scoping, agile iterations, risk management.',
        expectedTopics: ['Stakeholder Management', 'Ambiguity Resolution', 'MVP Scoping', 'Milestone Tracking', 'Risk Mitigation', 'Prioritization'],
        timeLimit: 120
      },
      {
        question: 'Tell me about a time you mentored a junior engineer or helped an underperforming teammate improve their technical capabilities and output.',
        context: 'Look for empathy, tailored feedback loops, pair programming, psychological safety, measurable progress.',
        expectedTopics: ['Mentorship & Coaching', 'Actionable Feedback', 'Empathy & Patience', 'Pair Programming', 'Growth Mindset', 'Measurable Improvement'],
        timeLimit: 120
      },
      {
        question: 'Give an example of a technical debt compromise you had to make to deliver a critical business initiative on time. How did you advocate for paying down that debt later?',
        context: 'Assess pragmatic balance between velocity and code quality, tracking debt in backlog, business impact.',
        expectedTopics: ['Pragmatic Engineering', 'Technical Debt vs Business Value', 'Backlog Tracking', 'Refactoring Advocacy', 'Measurable ROI'],
        timeLimit: 120
      }
    ]
  }
];

export function getTemplateById(id) {
  return QUESTION_SET_TEMPLATES.find(template => template.id === id) || null;
}

export default QUESTION_SET_TEMPLATES;
