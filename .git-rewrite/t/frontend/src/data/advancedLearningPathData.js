// Track data definitions for the Advanced Learning Path
export const TRACK_LABELS = { dsa: 'DSA', apt: 'Aptitude', sql: 'SQL', sys: 'System Design' };

export const TRACK_COLORS = {
  dsa: { main: 'var(--dsa)', bg: '#E1F5EE', dark: '#085041', border: 'var(--dsa-border)' },
  apt: { main: 'var(--apt)', bg: '#FAEEDA', dark: '#633806', border: 'var(--apt-border)' },
  sql: { main: 'var(--sql)', bg: '#E6F1FB', dark: '#042C53', border: 'var(--sql-border)' },
  sys: { main: 'var(--sys)', bg: '#EEEDFE', dark: '#26215C', border: 'var(--sys-border)' },
};

export const TRACKS = {
  dsa: {
    subs: {
      fundamentals: [
        { id:'dsa-1', icon:'📦', title:'Arrays & Strings', diff:'Medium', subtopics:['Two-pointer technique','Sliding window','Prefix sum','Kadane\'s algorithm','Matrix traversal'], problems:['Longest substring without repeat','Trapping rain water','Spiral matrix','Subarray sum equals k'] },
        { id:'dsa-2', icon:'🔗', title:'Linked Lists', diff:'Medium', subtopics:['Floyd\'s cycle detection','Merge sorted lists','Reverse in groups','LRU Cache impl.','Skip list concept'], problems:['Copy list with random pointer','Merge k sorted lists','Flatten multi-level list'] },
        { id:'dsa-3', icon:'📚', title:'Stacks & Queues', diff:'Medium', subtopics:['Monotonic stack','Next greater element','Evaluate expressions','Sliding window maximum','Priority queues'], problems:['Largest rectangle in histogram','Basic calculator II','Task scheduler'] },
        { id:'dsa-4', icon:'🌳', title:'Trees & BST', diff:'Hard', subtopics:['AVL / Red-Black tree','Segment tree','Fenwick tree','Trie','LCA algorithms'], problems:['Serialize/deserialize tree','Vertical order traversal','Count of smaller after self'] },
      ],
      advanced: [
        { id:'dsa-5', icon:'🕸', title:'Graph Algorithms', diff:'Hard', subtopics:['Dijkstra / Bellman-Ford','Floyd-Warshall','Tarjan SCC','Euler path/circuit','Network flow max-flow'], problems:['Critical connections','Alien dictionary','Word ladder II'] },
        { id:'dsa-6', icon:'💡', title:'Dynamic Programming', diff:'Hard', subtopics:['Bitmask DP','Interval DP','DP on trees','Digit DP','Probability DP'], problems:['Burst balloons','Strange printer','Largest divisible subset'] },
        { id:'dsa-7', icon:'🔄', title:'Divide & Conquer', diff:'Hard', subtopics:['Merge sort variants','Closest pair points','Matrix exponentiation','FFT basics','Karatsuba mult.'], problems:['Count inversions','Median of medians','K-th largest element'] },
      ],
      competitive: [
        { id:'dsa-8', icon:'🏆', title:'Advanced Data Structures', diff:'Expert', subtopics:['Sparse table','Persistent segment tree','Suffix array','Heavy-light decomp.','Link-cut tree'], problems:['Range minimum query','Suffix automaton','K-th smallest in BST'] },
        { id:'dsa-9', icon:'🎲', title:'Randomized Algorithms', diff:'Expert', subtopics:['Reservoir sampling','Bloom filters','Skip lists','Treap / Splay tree','Monte Carlo methods'], problems:['Random pick with weight','Shuffle array','Online stock span'] },
        { id:'dsa-10', icon:'🔢', title:'Number Theory & Math', diff:'Expert', subtopics:['Sieve of Eratosthenes','Modular arithmetic','Chinese remainder theorem','Fast power','Combinatorics mod p'], problems:['Count primes','Ugly number III','Nth digit in sequence'] },
      ]
    }
  },
  apt: {
    subs: {
      quant: [
        { id:'apt-1', icon:'🔢', title:'Number Systems & HCF/LCM', diff:'Medium', subtopics:['Divisibility rules','HCF & LCM tricks','Remainders','Cyclicity of powers','Digit problems'], problems:['Find last 2 digits of large powers','LCM of first N naturals','Remainder theorems'] },
        { id:'apt-2', icon:'📐', title:'Algebra & Equations', diff:'Hard', subtopics:['Quadratic / polynomial','Ratio-proportion','Mixtures & alligation','Variation types','Inequality chains'], problems:['Profit-loss chains','Age-based word problems','Work & time with fractions'] },
        { id:'apt-3', icon:'📊', title:'Permutation & Probability', diff:'Hard', subtopics:['Circular arrangements','Derangements','Conditional probability','Bayes theorem','Expected value'], problems:['Card draw problems','Dice combinatorics','Urn models'] },
        { id:'apt-4', icon:'📏', title:'Geometry & Mensuration', diff:'Medium', subtopics:['Coordinate geometry','Circles & tangents','Solid geometry','Trigonometry ratios','Clock / Calendar'], problems:['Area of polygon from coords','Angle in circle','3D surface area'] },
      ],
      logical: [
        { id:'apt-5', icon:'🧠', title:'Logical Deductions', diff:'Hard', subtopics:['Syllogisms (Venn)','Statement-conclusion','Blood relations','Coding-decoding','Direction sense'], problems:['3-step syllogisms','Family tree puzzles','Complex direction problems'] },
        { id:'apt-6', icon:'🔣', title:'Series & Patterns', diff:'Medium', subtopics:['Number series logic','Letter series','Matrix patterns','Analogy types','Odd one out'], problems:['Missing number in series','Figure matrix','Verbal analogies'] },
        { id:'apt-7', icon:'🧩', title:'Puzzles & Data Sufficiency', diff:'Hard', subtopics:['Scheduling puzzles','Data sufficiency rules','Input-output machines','Seating arrangements','Grid puzzles'], problems:['Circular seating 8 people','Input machine 5 steps','Linear arrangement constraints'] },
      ],
      verbal: [
        { id:'apt-8', icon:'📝', title:'Reading Comprehension', diff:'Hard', subtopics:['Inference questions','Tone & attitude','Critical reasoning','Para-jumbles','Sentence correction'], problems:['Strengthen / weaken argument','Bold-faced CR questions','RC with 5 questions'] },
        { id:'apt-9', icon:'🔤', title:'Vocabulary & Grammar', diff:'Medium', subtopics:['Root words & etymology','Idioms & phrases','Fill in blanks','Error spotting','Antonyms/Synonyms'], problems:['GRE-level vocabulary','One-word substitution','Double blank sentences'] },
      ]
    }
  },
  sql: {
    subs: {
      core: [
        { id:'sql-1', icon:'🗄', title:'SELECT Mastery', diff:'Medium', subtopics:['DISTINCT & filtering','Aggregate functions','GROUP BY + HAVING','CASE expressions','String functions'], problems:['Second highest salary','Department top earners','Consecutive seats'] },
        { id:'sql-2', icon:'🔀', title:'Joins & Subqueries', diff:'Hard', subtopics:['LEFT / RIGHT / FULL outer','SELF JOIN patterns','Correlated subqueries','EXISTS vs IN','LATERAL join'], problems:['Employees not in any project','Overlapping date ranges','Bill of materials recursive'] },
        { id:'sql-3', icon:'🪟', title:'Window Functions', diff:'Hard', subtopics:['ROW_NUMBER / RANK / DENSE_RANK','LEAD & LAG','NTILE & PERCENT_RANK','Running totals','Frame specifications'], problems:['Moving average 7-day','Previous row comparison','Top-3 per category'] },
      ],
      advanced: [
        { id:'sql-4', icon:'🔄', title:'CTEs & Recursive Queries', diff:'Hard', subtopics:['WITH clause chaining','Recursive CTE','Hierarchical data','Cycle detection','Performance of CTEs'], problems:['Employee org hierarchy','Graph traversal in SQL','Bill of materials'] },
        { id:'sql-5', icon:'🕹', title:'Stored Procedures & Functions', diff:'Hard', subtopics:['Procedures vs functions','Cursor basics','Exception handling','Dynamic SQL','Triggers & events'], problems:['Audit trail trigger','Dynamic pivot table','Error-safe batch insert'] },
        { id:'sql-6', icon:'🔐', title:'Transactions & Concurrency', diff:'Expert', subtopics:['ACID properties','Isolation levels','Deadlock handling','MVCC','Savepoints'], problems:['Transfer money safely','Lock ordering deadlock','Phantom reads demo'] },
      ],
      performance: [
        { id:'sql-7', icon:'⚡', title:'Indexing Strategy', diff:'Expert', subtopics:['B-tree vs hash index','Composite index order','Covering index','Partial index','Index-only scans'], problems:['Optimise slow LIKE query','Composite vs single index test','Analyse index usage with EXPLAIN'] },
        { id:'sql-8', icon:'📈', title:'Query Optimization', diff:'Expert', subtopics:['EXPLAIN / EXPLAIN ANALYZE','Query planner hints','Partition pruning','Materialized views','Statistics & VACUUM'], problems:['Rewrite N+1 as JOIN','Force index hint','Compare nested loop vs hash join'] },
      ]
    }
  },
  sys: {
    subs: {
      concepts: [
        { id:'sys-1', icon:'⚖', title:'Scalability Fundamentals', diff:'Hard', subtopics:['Horizontal vs vertical scaling','Load balancers (L4/L7)','Consistent hashing','Sharding strategies','Replication lag'], problems:['Scale to 10M users','Choose sharding key for Twitter','Handle hotspot partitions'] },
        { id:'sys-2', icon:'💾', title:'Storage Systems', diff:'Hard', subtopics:['SQL vs NoSQL trade-offs','LSM tree vs B-tree','Column stores','Blob / object storage','Time-series DBs'], problems:['Store 1B events/day','Choose DB for social graph','S3-like storage design'] },
        { id:'sys-3', icon:'🌐', title:'Networking & CDN', diff:'Medium', subtopics:['DNS resolution flow','CDN edge caching','HTTP/2 & QUIC','WebSockets & SSE','gRPC vs REST'], problems:['Reduce latency 50ms → 10ms','Design global CDN','Long-polling vs WebSocket chat'] },
      ],
      patterns: [
        { id:'sys-4', icon:'📨', title:'Messaging & Event Streaming', diff:'Hard', subtopics:['Kafka internals','At-least/exactly-once delivery','CQRS pattern','Event sourcing','Backpressure handling'], problems:['Design order processing pipeline','Idempotent consumer','Fan-out notification system'] },
        { id:'sys-5', icon:'🔒', title:'Reliability & Fault Tolerance', diff:'Expert', subtopics:['Circuit breaker pattern','Retry & exponential backoff','Bulkhead pattern','Chaos engineering','SLA / SLO / SLI'], problems:['Design for 99.99% uptime','Multi-region failover','Graceful degradation'] },
        { id:'sys-6', icon:'🧩', title:'Microservices & API Gateway', diff:'Hard', subtopics:['Service mesh (Istio)','API gateway patterns','Saga pattern','Two-phase commit','Service discovery'], problems:['Decompose monolith','Design checkout saga','Rate limit API gateway'] },
      ],
      'case': [
        { id:'sys-7', icon:'🐦', title:'Design Twitter / X', diff:'Expert', subtopics:['Tweet fanout strategies','Timeline generation','Trending topics','Search indexing','CDN for media'], problems:['Design the tweet write path','Fanout on write vs read','Handle celebrity tweets'] },
        { id:'sys-8', icon:'📺', title:'Design YouTube / Netflix', diff:'Expert', subtopics:['Video transcoding pipeline','Adaptive bitrate streaming','CDN cache strategy','Recommendation engine','View count at scale'], problems:['Upload & processing flow','Design watch history','Top-K trending videos'] },
        { id:'sys-9', icon:'🛒', title:'Design Amazon / Flipkart', diff:'Expert', subtopics:['Inventory management','Payment gateway','Flash sale architecture','Search & ranking','Logistics tracking'], problems:['Flash sale 10M concurrent','Distributed cart','Order state machine'] },
      ]
    }
  }
};

export const TIMELINE_DATA = [
  { week:'Weeks 1–2', title:'DSA Foundations', tags:['Arrays','Linked Lists','Stacks'], track:'dsa' },
  { week:'Week 3', title:'Aptitude: Numbers & Algebra', tags:['Number Systems','Ratios','Work-Time'], track:'apt' },
  { week:'Weeks 4–5', title:'Trees, Heaps & Graphs', tags:['BST','Dijkstra','BFS/DFS'], track:'dsa' },
  { week:'Week 6', title:'SQL Core — SELECT to Joins', tags:['Aggregates','JOINs','Subqueries'], track:'sql' },
  { week:'Weeks 7–8', title:'Advanced DP & Greedy', tags:['Bitmask DP','Interval DP','Knapsack'], track:'dsa' },
  { week:'Week 9', title:'Aptitude: Logical Reasoning', tags:['Syllogisms','Series','Puzzles'], track:'apt' },
  { week:'Weeks 10–11', title:'SQL Advanced — CTEs, Windows, Perf', tags:['Window Fns','CTEs','Indexing'], track:'sql' },
  { week:'Week 12', title:'System Design Concepts', tags:['Scaling','Load Balancing','Caching'], track:'sys' },
  { week:'Weeks 13–14', title:'System Design Deep Dive', tags:['Kafka','Microservices','Reliability'], track:'sys' },
  { week:'Week 15', title:'Aptitude: Verbal & RC', tags:['Reading Comp','Vocabulary','CR'], track:'apt' },
  { week:'Week 16', title:'Mock Interviews & Revision', tags:['Full DSA','SQL Perf','System Design Cases'], track:'all' },
];

export const DIFF_COLORS = {
  Medium: { bg: '#FAEEDA', color: '#633806' },
  Hard:   { bg: '#E6F1FB', color: '#042C53' },
  Expert: { bg: '#EEEDFE', color: '#26215C' },
};

export const STORAGE_KEY = 'preploop_advanced_learning_path_v1';
