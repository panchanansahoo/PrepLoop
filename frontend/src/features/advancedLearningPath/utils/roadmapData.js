const TRACK_LABELS = {
  dsa: 'DSA',
  apt: 'Aptitude',
  sql: 'SQL',
  sys: 'System Design',
};

const TRACK_ACCENTS = {
  dsa: '#1D9E75',
  apt: '#BA7517',
  sql: '#185FA5',
  sys: '#533AB7',
};

const TRACK_ACCENTS_CSS = {
  dsa: 'var(--dsa)',
  apt: 'var(--apt)',
  sql: 'var(--sql)',
  sys: 'var(--sys)',
};

const TRACK_COLORS = {
  dsa: { bg: 'rgba(29, 158, 117, 0.1)', border: 'rgba(29, 158, 117, 0.3)', text: '#1D9E75' },
  apt: { bg: 'rgba(186, 117, 23, 0.1)', border: 'rgba(186, 117, 23, 0.3)', text: '#BA7517' },
  sql: { bg: 'rgba(24, 95, 165, 0.1)', border: 'rgba(24, 95, 165, 0.3)', text: '#185FA5' },
  sys: { bg: 'rgba(83, 58, 183, 0.1)', border: 'rgba(83, 58, 183, 0.3)', text: '#533AB7' },
};

const trackEmojis = {
  dsa: '\uD83E\uDDE0',
  apt: '\u26A1',
  sql: '\uD83D\uDCC4',
  sys: '\uD83C\uDFD7\uFE0F',
};

const DIFFICULTY = {
  Easy: { bg: 'rgba(29, 158, 117, 0.15)', color: '#1D9E75' },
  Medium: { bg: 'rgba(186, 117, 23, 0.15)', color: '#BA7517' },
  Hard: { bg: 'rgba(24, 95, 165, 0.15)', color: '#185FA5' },
  Expert: { bg: 'rgba(83, 58, 183, 0.15)', color: '#533AB7' },
};

const COMPANY_PRESETS = [
  { id: 'balanced', label: 'Balanced', desc: 'All-round preparation' },
  { id: 'faang', label: 'FAANG', desc: 'DSA + System Design heavy' },
  { id: 'data', label: 'Data Roles', desc: 'SQL + Aptitude focus' },
  { id: 'product', label: 'Product', desc: 'DSA + SQL + System Design' },
];

const TRACKS = {
  dsa: {
    color: 'var(--dsa)', light: 'var(--dsa-l)', dark: 'var(--dsa-d)',
    subs: {
      fundamentals: [
        { id: 'dsa-1', icon: '\uD83D\uDCE6', title: 'Arrays & Strings', diff: 'Medium', subtopics: ['Two-pointer technique', 'Sliding window', 'Prefix sum', 'Kadane\'s algorithm', 'Matrix traversal'], problems: ['Longest substring without repeat', 'Trapping rain water', 'Spiral matrix', 'Subarray sum equals k'] },
        { id: 'dsa-2', icon: '\uD83D\uDD17', title: 'Linked Lists', diff: 'Medium', subtopics: ['Floyd\'s cycle detection', 'Merge sorted lists', 'Reverse in groups', 'LRU Cache impl.', 'Skip list concept'], problems: ['Copy list with random pointer', 'Merge k sorted lists', 'Flatten multi-level list'] },
        { id: 'dsa-3', icon: '\uD83D\uDCDA', title: 'Stacks & Queues', diff: 'Medium', subtopics: ['Monotonic stack', 'Next greater element', 'Evaluate expressions', 'Sliding window maximum', 'Priority queues'], problems: ['Largest rectangle in histogram', 'Basic calculator II', 'Task scheduler'] },
        { id: 'dsa-4', icon: '\uD83C\uDF33', title: 'Trees & BST', diff: 'Hard', subtopics: ['AVL / Red-Black tree', 'Segment tree', 'Fenwick tree', 'Trie', 'LCA algorithms'], problems: ['Serialize/deserialize tree', 'Vertical order traversal', 'Count of smaller after self'] },
      ],
      advanced: [
        { id: 'dsa-5', icon: '\uD83D\uDD78\uFE0F', title: 'Graph Algorithms', diff: 'Hard', subtopics: ['Dijkstra / Bellman-Ford', 'Floyd-Warshall', 'Tarjan SCC', 'Euler path/circuit', 'Network flow max-flow'], problems: ['Critical connections', 'Alien dictionary', 'Word ladder II'] },
        { id: 'dsa-6', icon: '\uD83D\uDCA1', title: 'Dynamic Programming', diff: 'Hard', subtopics: ['Bitmask DP', 'Interval DP', 'DP on trees', 'Digit DP', 'Probability DP'], problems: ['Burst balloons', 'Strange printer', 'Largest divisible subset'] },
        { id: 'dsa-7', icon: '\uD83D\uDD04', title: 'Divide & Conquer', diff: 'Hard', subtopics: ['Merge sort variants', 'Closest pair points', 'Matrix exponentiation', 'FFT basics', 'Karatsuba mult.'], problems: ['Count inversions', 'Median of medians', 'K-th largest element'] },
      ],
      competitive: [
        { id: 'dsa-8', icon: '\uD83C\uDFC6', title: 'Advanced Data Structures', diff: 'Expert', subtopics: ['Sparse table', 'Persistent segment tree', 'Suffix array', 'Heavy-light decomp.', 'Link-cut tree'], problems: ['Range minimum query', 'Suffix automaton', 'K-th smallest in BST'] },
        { id: 'dsa-9', icon: '\uD83C\uDFB2', title: 'Randomized Algorithms', diff: 'Expert', subtopics: ['Reservoir sampling', 'Bloom filters', 'Skip lists', 'Treap / Splay tree', 'Monte Carlo methods'], problems: ['Random pick with weight', 'Shuffle array', 'Online stock span'] },
        { id: 'dsa-10', icon: '\uD83D\uDD22', title: 'Number Theory & Math', diff: 'Expert', subtopics: ['Sieve of Eratosthenes', 'Modular arithmetic', 'Chinese remainder theorem', 'Fast power', 'Combinatorics mod p'], problems: ['Count primes', 'Ugly number III', 'Nth digit in sequence'] },
      ],
    },
  },
  apt: {
    color: 'var(--apt)', light: 'var(--apt-l)', dark: 'var(--apt-d)',
    subs: {
      quant: [
        { id: 'apt-1', icon: '\uD83D\uDD22', title: 'Number Systems & HCF/LCM', diff: 'Medium', subtopics: ['Divisibility rules', 'HCF & LCM tricks', 'Remainders', 'Cyclicity of powers', 'Digit problems'], problems: ['Find last 2 digits of large powers', 'LCM of first N naturals', 'Remainder theorems'] },
        { id: 'apt-2', icon: '\uD83D\uDCD0', title: 'Algebra & Equations', diff: 'Hard', subtopics: ['Quadratic / polynomial', 'Ratio-proportion', 'Mixtures & alligation', 'Variation types', 'Inequality chains'], problems: ['Profit-loss chains', 'Age-based word problems', 'Work & time with fractions'] },
        { id: 'apt-3', icon: '\uD83D\uDCCA', title: 'Permutation & Probability', diff: 'Hard', subtopics: ['Circular arrangements', 'Derangements', 'Conditional probability', 'Bayes theorem', 'Expected value'], problems: ['Card draw problems', 'Dice combinatorics', 'Urn models'] },
        { id: 'apt-4', icon: '\uD83D\uDCCF', title: 'Geometry & Mensuration', diff: 'Medium', subtopics: ['Coordinate geometry', 'Circles & tangents', 'Solid geometry', 'Trigonometry ratios', 'Clock / Calendar'], problems: ['Area of polygon from coords', 'Angle in circle', '3D surface area'] },
      ],
      logical: [
        { id: 'apt-5', icon: '\uD83E\uDDE0', title: 'Logical Deductions', diff: 'Hard', subtopics: ['Syllogisms (Venn)', 'Statement-conclusion', 'Blood relations', 'Coding-decoding', 'Direction sense'], problems: ['3-step syllogisms', 'Family tree puzzles', 'Complex direction problems'] },
        { id: 'apt-6', icon: '\uD83D\uDD23', title: 'Series & Patterns', diff: 'Medium', subtopics: ['Number series logic', 'Letter series', 'Matrix patterns', 'Analogy types', 'Odd one out'], problems: ['Missing number in series', 'Figure matrix', 'Verbal analogies'] },
        { id: 'apt-7', icon: '\uD83E\uDDE9', title: 'Puzzles & Data Sufficiency', diff: 'Hard', subtopics: ['Scheduling puzzles', 'Data sufficiency rules', 'Input-output machines', 'Seating arrangements', 'Grid puzzles'], problems: ['Circular seating 8 people', 'Input machine 5 steps', 'Linear arrangement constraints'] },
      ],
      verbal: [
        { id: 'apt-8', icon: '\uD83D\uDCDD', title: 'Reading Comprehension', diff: 'Hard', subtopics: ['Inference questions', 'Tone & attitude', 'Critical reasoning', 'Para-jumbles', 'Sentence correction'], problems: ['Strengthen / weaken argument', 'Bold-faced CR questions', 'RC with 5 questions'] },
        { id: 'apt-9', icon: '\uD83D\uDD24', title: 'Vocabulary & Grammar', diff: 'Medium', subtopics: ['Root words & etymology', 'Idioms & phrases', 'Fill in blanks', 'Error spotting', 'Antonyms/Synonyms'], problems: ['GRE-level vocabulary', 'One-word substitution', 'Double blank sentences'] },
      ],
    },
  },
  sql: {
    color: 'var(--sql)', light: 'var(--sql-l)', dark: 'var(--sql-d)',
    subs: {
      core: [
        { id: 'sql-1', icon: '\uD83D\uDDC4', title: 'SELECT Mastery', diff: 'Medium', subtopics: ['DISTINCT & filtering', 'Aggregate functions', 'GROUP BY + HAVING', 'CASE expressions', 'String functions'], problems: ['Second highest salary', 'Department top earners', 'Consecutive seats'] },
        { id: 'sql-2', icon: '\uD83D\uDD00', title: 'Joins & Subqueries', diff: 'Hard', subtopics: ['LEFT / RIGHT / FULL outer', 'SELF JOIN patterns', 'Correlated subqueries', 'EXISTS vs IN', 'LATERAL join'], problems: ['Employees not in any project', 'Overlapping date ranges', 'Bill of materials recursive'] },
        { id: 'sql-3', icon: '\uD83E\uDE9F', title: 'Window Functions', diff: 'Hard', subtopics: ['ROW_NUMBER / RANK / DENSE_RANK', 'LEAD & LAG', 'NTILE & PERCENT_RANK', 'Running totals', 'Frame specifications'], problems: ['Moving average 7-day', 'Previous row comparison', 'Top-3 per category'] },
      ],
      advanced: [
        { id: 'sql-4', icon: '\uD83D\uDD04', title: 'CTEs & Recursive Queries', diff: 'Hard', subtopics: ['WITH clause chaining', 'Recursive CTE', 'Hierarchical data', 'Cycle detection', 'Performance of CTEs'], problems: ['Employee org hierarchy', 'Graph traversal in SQL', 'Bill of materials'] },
        { id: 'sql-5', icon: '\uD83D\uDD79\uFE0F', title: 'Stored Procedures & Functions', diff: 'Hard', subtopics: ['Procedures vs functions', 'Cursor basics', 'Exception handling', 'Dynamic SQL', 'Triggers & events'], problems: ['Audit trail trigger', 'Dynamic pivot table', 'Error-safe batch insert'] },
        { id: 'sql-6', icon: '\uD83D\uDD10', title: 'Transactions & Concurrency', diff: 'Expert', subtopics: ['ACID properties', 'Isolation levels', 'Deadlock handling', 'MVCC', 'Savepoints'], problems: ['Transfer money safely', 'Lock ordering deadlock', 'Phantom reads demo'] },
      ],
      performance: [
        { id: 'sql-7', icon: '\u26A1', title: 'Indexing Strategy', diff: 'Expert', subtopics: ['B-tree vs hash index', 'Composite index order', 'Covering index', 'Partial index', 'Index-only scans'], problems: ['Optimise slow LIKE query', 'Composite vs single index test', 'Analyse index usage with EXPLAIN'] },
        { id: 'sql-8', icon: '\uD83D\uDCC8', title: 'Query Optimization', diff: 'Expert', subtopics: ['EXPLAIN / EXPLAIN ANALYZE', 'Query planner hints', 'Partition pruning', 'Materialized views', 'Statistics & VACUUM'], problems: ['Rewrite N+1 as JOIN', 'Force index hint', 'Compare nested loop vs hash join'] },
      ],
    },
  },
  sys: {
    color: 'var(--sys)', light: 'var(--sys-l)', dark: 'var(--sys-d)',
    subs: {
      concepts: [
        { id: 'sys-1', icon: '\u2696\uFE0F', title: 'Scalability Fundamentals', diff: 'Hard', subtopics: ['Horizontal vs vertical scaling', 'Load balancers (L4/L7)', 'Consistent hashing', 'Sharding strategies', 'Replication lag'], problems: ['Scale to 10M users', 'Choose sharding key for Twitter', 'Handle hotspot partitions'] },
        { id: 'sys-2', icon: '\uD83D\uDCBE', title: 'Storage Systems', diff: 'Hard', subtopics: ['SQL vs NoSQL trade-offs', 'LSM tree vs B-tree', 'Column stores', 'Blob / object storage', 'Time-series DBs'], problems: ['Store 1B events/day', 'Choose DB for social graph', 'S3-like storage design'] },
        { id: 'sys-3', icon: '\uD83C\uDF10', title: 'Networking & CDN', diff: 'Medium', subtopics: ['DNS resolution flow', 'CDN edge caching', 'HTTP/2 & QUIC', 'WebSockets & SSE', 'gRPC vs REST'], problems: ['Reduce latency 50ms to 10ms', 'Design global CDN', 'Long-polling vs WebSocket chat'] },
      ],
      patterns: [
        { id: 'sys-4', icon: '\uD83D\uDCE8', title: 'Messaging & Event Streaming', diff: 'Hard', subtopics: ['Kafka internals', 'At-least/exactly-once delivery', 'CQRS pattern', 'Event sourcing', 'Backpressure handling'], problems: ['Design order processing pipeline', 'Idempotent consumer', 'Fan-out notification system'] },
        { id: 'sys-5', icon: '\uD83D\uDD12', title: 'Reliability & Fault Tolerance', diff: 'Expert', subtopics: ['Circuit breaker pattern', 'Retry & exponential backoff', 'Bulkhead pattern', 'Chaos engineering', 'SLA / SLO / SLI'], problems: ['Design for 99.99% uptime', 'Multi-region failover', 'Graceful degradation'] },
        { id: 'sys-6', icon: '\uD83E\uDDE9', title: 'Microservices & API Gateway', diff: 'Hard', subtopics: ['Service mesh (Istio)', 'API gateway patterns', 'Saga pattern', 'Two-phase commit', 'Service discovery'], problems: ['Decompose monolith', 'Design checkout saga', 'Rate limit API gateway'] },
      ],
      case: [
        { id: 'sys-7', icon: '\uD83D\uDC26', title: 'Design Twitter / X', diff: 'Expert', subtopics: ['Tweet fanout strategies', 'Timeline generation', 'Trending topics', 'Search indexing', 'CDN for media'], problems: ['Design the tweet write path', 'Fanout on write vs read', 'Handle celebrity tweets'] },
        { id: 'sys-8', icon: '\uD83D\uDCFA', title: 'Design YouTube / Netflix', diff: 'Expert', subtopics: ['Video transcoding pipeline', 'Adaptive bitrate streaming', 'CDN cache strategy', 'Recommendation engine', 'View count at scale'], problems: ['Upload & processing flow', 'Design watch history', 'Top-K trending videos'] },
        { id: 'sys-9', icon: '\uD83D\uDED2', title: 'Design Amazon / Flipkart', diff: 'Expert', subtopics: ['Inventory management', 'Payment gateway', 'Flash sale architecture', 'Search & ranking', 'Logistics tracking'], problems: ['Flash sale 10M concurrent', 'Distributed cart', 'Order state machine'] },
      ],
    },
  },
};

const TIMELINE = [
  { week: 'Weeks 1\u20132', title: 'DSA Foundations', tags: ['Arrays', 'Linked Lists', 'Stacks'], color: '#1D9E75' },
  { week: 'Week 3', title: 'Aptitude: Numbers & Algebra', tags: ['Number Systems', 'Ratios', 'Work-Time'], color: '#BA7517' },
  { week: 'Weeks 4\u20135', title: 'Trees, Heaps & Graphs', tags: ['BST', 'Dijkstra', 'BFS/DFS'], color: '#1D9E75' },
  { week: 'Week 6', title: 'SQL Core \u2014 SELECT to Joins', tags: ['Aggregates', 'JOINs', 'Subqueries'], color: '#185FA5' },
  { week: 'Weeks 7\u20138', title: 'Advanced DP & Greedy', tags: ['Bitmask DP', 'Interval DP', 'Knapsack'], color: '#1D9E75' },
  { week: 'Week 9', title: 'Aptitude: Logical Reasoning', tags: ['Syllogisms', 'Series', 'Puzzles'], color: '#BA7517' },
  { week: 'Weeks 10\u201311', title: 'SQL Advanced \u2014 CTEs, Windows, Perf', tags: ['Window Fns', 'CTEs', 'Indexing'], color: '#185FA5' },
  { week: 'Week 12', title: 'System Design Concepts', tags: ['Scaling', 'Load Balancing', 'Caching'], color: '#533AB7' },
  { week: 'Weeks 13\u201314', title: 'System Design Deep Dive', tags: ['Kafka', 'Microservices', 'Reliability'], color: '#533AB7' },
  { week: 'Week 15', title: 'Aptitude: Verbal & RC', tags: ['Reading Comp', 'Vocabulary', 'CR'], color: '#BA7517' },
  { week: 'Week 16', title: 'Mock Interviews & Revision', tags: ['Full DSA', 'SQL Perf', 'System Design Cases'], color: '#64748b' },
];

export {
  TRACK_LABELS,
  TRACK_ACCENTS,
  TRACK_ACCENTS_CSS,
  TRACK_COLORS,
  trackEmojis,
  DIFFICULTY,
  COMPANY_PRESETS,
  TRACKS,
  TIMELINE,
};
