import{j as e}from"./vendor-richtext-CSQPGedM.js";import{E as S,z as y,r as d}from"./vendor-react-DI4irv9A.js";import{m as E,a as f,C as v}from"./index-B4aTn2nZ.js";import{a as x,c as T,s as A}from"./systemDesignProgress-jpJ4oz4E.js";import{A as b}from"./arrow-left-AHDmhhxU.js";import{B as C}from"./book-open-B85GWIqc.js";import{B as R}from"./brain-Ckk2aCBk.js";import{L as w}from"./lightbulb-C1Aocy63.js";import{T as D}from"./target-B7DP-J8v.js";import{C as I}from"./check-circle-CUY9jWEZ.js";import"./vendor-reactflow-DuZ3O1to.js";const k={"scalability-basics":{sections:[{title:"📖 Vertical vs Horizontal Scaling",steps:["Vertical Scaling (Scale Up): add more power (CPU, RAM, SSD) to your existing server.","Horizontal Scaling (Scale Out): add more servers and distribute the load.","Vertical: simpler, no code changes, but there's a physical ceiling (biggest AWS instance: 24TB RAM).","Horizontal: theoretically unlimited, but requires stateless design and a load balancer."],visual:`VERTICAL SCALING (Scale Up)
┌──────────────────────────────┐
│  Server v1    →    Server v2 │
│  4 CPU              32 CPU   │
│  8 GB RAM           256 GB   │
│  500 GB SSD         4 TB SSD │
│                              │
│  Same server, more power     │
│  ✓ Simple  ✗ Has a ceiling   │
└──────────────────────────────┘

HORIZONTAL SCALING (Scale Out)
                ┌─────────┐
           ┌───→│ Server 1│
           │    └─────────┘
┌──────┐   │    ┌─────────┐
│  LB  │───┼───→│ Server 2│
└──────┘   │    └─────────┘
           │    ┌─────────┐
           └───→│ Server 3│
                └─────────┘
  Add more servers as needed
  ✓ No ceiling  ✗ More complex`},{title:"📖 Latency Numbers Every Engineer Should Know",steps:["Understanding latency hierarchy helps you make informed design decisions.","Rule of thumb: each layer adds 10-100x more latency.","Always measure P99 latency, not just average — tail latency affects user experience.","SLA example: 99.9% uptime = 8.7 hours downtime/year, 99.99% = 52 minutes/year."],visual:`LATENCY REFERENCE (approximate):
┌──────────────────────────────────────────────┐
│ Operation                │ Latency           │
├──────────────────────────┼───────────────────┤
│ L1 cache reference       │ 0.5 ns            │
│ L2 cache reference       │ 7 ns              │
│ RAM reference            │ 100 ns            │
│ SSD random read          │ 16 μs             │
│ Read 1 MB from SSD       │ 49 μs             │
│ Round trip same DC       │ 0.5 ms            │
│ Read 1 MB from network   │ 10 ms             │
│ Disk seek (HDD)          │ 10 ms             │
│ Round trip US → EU       │ 150 ms            │
│ TCP handshake            │ 1.5 × RTT         │
│ TLS handshake            │ 2 × RTT           │
└──────────────────────────┴───────────────────┘

AVAILABILITY TABLE:
┌────────┬─────────────────────────┐
│  SLA   │ Downtime per year       │
├────────┼─────────────────────────┤
│ 99%    │ 3.65 days               │
│ 99.9%  │ 8.76 hours              │
│ 99.99% │ 52.6 minutes            │
│ 99.999%│ 5.26 minutes            │
└────────┴─────────────────────────┘`}]},"cap-consistency":{sections:[{title:"📖 CAP Theorem — Visual Guide",steps:["CAP says: during a network partition, a distributed system must choose between Consistency and Availability.","CP system: rejects writes/reads on the partitioned node — data stays consistent.","AP system: continues serving reads/writes, even if data is stale — stays available.","In practice, partitions are rare. Most of the time, you have all three."],visual:`THE CAP TRIANGLE:

              Consistency (C)
                  ╱╲
                 ╱  ╲
                ╱    ╲
          CP   ╱      ╲   CA (impossible in
         zone ╱   CAP   ╲  distributed sys)
             ╱  THEOREM  ╲
            ╱──────────────╲
    Availability (A) ────── Partition
                            Tolerance (P)
                   AP zone

REAL-WORLD EXAMPLES:
┌──────────────────┬────────┬──────────────────────────┐
│ System           │ Choice │ Behavior during partition │
├──────────────────┼────────┼──────────────────────────┤
│ Postgres/MySQL   │ CA/CP  │ Single node = CA; cluster │
│                  │        │ rejects writes if quorum  │
│                  │        │ lost                      │
│ MongoDB (default)│ CP     │ Primary unavailable →     │
│                  │        │ election, brief downtime  │
│ Cassandra        │ AP     │ All nodes accept writes,  │
│                  │        │ resolve conflicts later   │
│ DynamoDB         │ AP     │ Eventually consistent     │
│                  │        │ reads (optional strong)   │
│ Google Spanner   │ CP     │ Uses TrueTime for global  │
│                  │        │ consistency               │
└──────────────────┴────────┴──────────────────────────┘`},{title:"📖 Consistency Models Spectrum",steps:["Strong (Linearizable): every read returns the most recent write. Most expensive.","Sequential: all operations appear in some total order consistent with per-process ordering.","Causal: if A causes B, everyone sees A before B. Concurrent writes may be in any order.","Eventual: if no new writes, all replicas will EVENTUALLY converge. Cheapest and fastest.","Read-your-writes: you always see your own writes (but others might not immediately)."],visual:`CONSISTENCY SPECTRUM:

Strong ◄──────────────────────────────────► Eventual
(Strict)                                    (Relaxed)

  Linearizable → Sequential → Causal → Eventual
  
  ┌──────────────────────────────────────────────┐
  │ Linearizable (Strong):                       │
  │   Write(x=5) ─── wall clock ──→ Read(x) = 5 │
  │   Every read sees latest write. Guaranteed.  │
  ├──────────────────────────────────────────────┤
  │ Eventual Consistency:                        │
  │   Write(x=5) ──→ Read(x) = 3  (stale!)      │
  │             ... time passes ...              │
  │                   Read(x) = 5  (caught up!)  │
  │   Replicas converge "eventually" (ms to sec) │
  ├──────────────────────────────────────────────┤
  │ Read-Your-Writes:                            │
  │   You write x=5 → You read x=5  ✓ always    │
  │   Other user reads x → might still see 3     │
  └──────────────────────────────────────────────┘`}]},"load-balancing":{sections:[{title:"📖 Load Balancer Architecture",steps:["A load balancer sits between clients and backend servers.","It distributes incoming requests across multiple healthy servers.","L4 (transport layer): routes based on IP/port. Fast, but can't inspect HTTP content.","L7 (application layer): can route based on URL, headers, cookies. Smarter but slightly slower."],visual:`REQUEST FLOW WITH LOAD BALANCER:

  Client A ──┐
  Client B ──┤    ┌──────────┐    ┌──────────┐
  Client C ──┼───→│   Load   │───→│ Server 1 │ (healthy ✓)
  Client D ──┤    │ Balancer │───→│ Server 2 │ (healthy ✓)
  Client E ──┘    │  (L7)    │ ✗  │ Server 3 │ (unhealthy ✗)
                  └──────────┘    └──────────┘
                       │
                  Health checks
                  every 10s
                  /health → 200?

L4 vs L7:
┌──────────┬─────────────────────┬─────────────────────┐
│          │ L4 (Transport)      │ L7 (Application)    │
├──────────┼─────────────────────┼─────────────────────┤
│ Routes by│ IP + Port           │ URL, Headers, Cookie│
│ Speed    │ Faster (no inspect) │ Slightly slower     │
│ Features │ Basic               │ SSL termination,    │
│          │                     │ path-based routing, │
│          │                     │ request rewriting   │
│ Example  │ AWS NLB             │ AWS ALB, Nginx      │
└──────────┴─────────────────────┴─────────────────────┘`},{title:"📖 Consistent Hashing",steps:["Problem: hash(key) % N breaks when N (server count) changes — almost all keys get remapped!","Solution: Map both servers and keys onto a ring (0 to 2^32). Each key goes to the next server clockwise.","Adding a server: only keys between the new server and its predecessor move. ~K/N keys instead of all.","Virtual nodes: each physical server maps to 100+ points on the ring for even distribution."],visual:`CONSISTENT HASHING RING:

           0°
           │
     S3 ●──┤──● K1 (→ S3)
          ╱ │ ╲
        ╱   │   ╲
  K4 ●     │     ● S1
  (→S3)    │
      │    │        K2 ● (→ S1)
      │    │          │
  S2 ●────┤──────────┘
           │       K3 ● (→ S2)
          180°

Key assignment: each key goes to the
NEXT server clockwise on the ring.

ADDING SERVER S4:
           0°
           │
     S3 ●──┤──● K1 (→ S3, unchanged)
          ╱ │ ╲
   S4 ● ╱  │   ╲
  K4 ●     │     ● S1
  (→S4!)   │         ← K4 moved from S3 to S4
      │    │        K2 ● (→ S1, unchanged)
  S2 ●────┤──────────┘
           │       K3 ● (→ S2, unchanged)
          180°

Only K4 moved! (instead of rehashing everything)`}]},"caching-strategies":{sections:[{title:"📖 Caching Patterns Compared",steps:["Cache-Aside: app controls cache. Read: check cache → miss → read DB → store in cache. Write: write DB → invalidate cache.","Write-Through: write to both cache and DB synchronously. Consistent but adds write latency.","Write-Back: write to cache only, flush to DB asynchronously. Fast writes but risk of data loss.","Read-Through: cache itself fetches from DB on miss (transparent to app)."],visual:`CACHE-ASIDE PATTERN (Most Common):

  Read Flow:
  ┌────────┐  1. GET    ┌───────┐
  │ Client │──────────→│ Cache  │─── HIT? → Return data
  └────────┘           │(Redis) │
       │               └───────┘
       │                   │ MISS
       │    2. Query DB    ↓
       │           ┌──────────────┐
       │           │   Database   │
       │           └──────────────┘
       │                   │
       │    3. Fill cache   ↓
       │           ┌───────┐
       └──────────│ Cache  │ (set with TTL)
                   └───────┘

WRITE-THROUGH:
  ┌────────┐  Write  ┌───────┐  Sync write  ┌────┐
  │ Client │────────→│ Cache │─────────────→│ DB │
  └────────┘         └───────┘              └────┘
  ✓ Always consistent  ✗ Slower writes

WRITE-BACK:
  ┌────────┐  Write  ┌───────┐  Async flush ┌────┐
  │ Client │────────→│ Cache │ ─ ─ ─ ─ ─ →│ DB │
  └────────┘         └───────┘   (batched)  └────┘
  ✓ Fast writes  ✗ Data loss risk if cache crashes`},{title:"📖 Cache Eviction Policies",steps:["LRU (Least Recently Used): evict the entry not accessed for the longest time. Most popular.","LFU (Least Frequently Used): evict the entry accessed fewest times. Good for hot data.","FIFO: evict oldest entry. Simple but not always optimal.","TTL (Time to Live): entries expire after a set duration. Provides eventual consistency."],visual:`LRU CACHE EXAMPLE (capacity = 3):

Action      │ Cache State     │ Evicted
────────────┼─────────────────┼─────────
GET A       │ [A]             │
GET B       │ [B, A]          │
GET C       │ [C, B, A]      │
GET A       │ [A, C, B]      │  (A moved to front)
GET D       │ [D, A, C]      │  B (least recently used)
GET C       │ [C, D, A]      │  (C moved to front)
GET E       │ [E, C, D]      │  A (least recently used)

  Most Recent ◄─────────── Least Recent
  ┌───┬───┬───┐
  │ E │ C │ D │ ← Next eviction candidate
  └───┴───┴───┘

CACHE STAMPEDE PREVENTION:
  Without protection:          With mutex lock:
  Cache expires                Cache expires
  ↓                            ↓
  100 requests → all hit DB    1 request gets lock → hits DB
  (thundering herd!)           99 requests wait for cache fill
                               ↓
                               Cache filled, all get cached data`}]},"database-fundamentals":{sections:[{title:"📖 SQL vs NoSQL Decision Framework",steps:["SQL: choose when you need ACID transactions, complex joins, or well-defined schema.","NoSQL Document: choose for flexible schema, nested data, rapid iteration.","NoSQL Key-Value: choose for ultra-low latency simple lookups (caching, sessions).","NoSQL Column-Family: choose for high write throughput, time-series, IoT data."],visual:`DATABASE SELECTION GUIDE:

  Need complex       YES → PostgreSQL / MySQL
  joins/transactions? │    (Relational)
         │ NO         │
         ↓            │
  Flexible schema,   YES → MongoDB / DynamoDB
  nested objects?     │    (Document)
         │ NO         │
         ↓            │
  Simple key→value   YES → Redis / Memcached
  ultra-fast lookup?  │    (Key-Value)
         │ NO         │
         ↓            │
  High write volume, YES → Cassandra / ScyllaDB
  time-series data?   │    (Column-Family)
         │ NO         │
         ↓            │
  Relationship-heavy YES → Neo4j / Neptune
  queries (social)?        (Graph)

ACID vs BASE:
┌──────────────────┬──────────────────────────┐
│ ACID (SQL)       │ BASE (NoSQL)             │
├──────────────────┼──────────────────────────┤
│ Atomic           │ Basically Available      │
│ Consistent       │ Soft state               │
│ Isolated         │ Eventually consistent    │
│ Durable          │                          │
├──────────────────┼──────────────────────────┤
│ Bank transfers   │ Social media likes       │
│ Order processing │ Page view counters       │
│ Inventory        │ User activity logs       │
└──────────────────┴──────────────────────────┘`},{title:"📖 Indexing — How B-Trees Work",steps:["Without index: database scans ALL rows to find matching ones → O(n).","B-Tree index: balanced tree where each node holds multiple keys. Lookup = O(log n).","Composite index (a, b): sorts by a first, then b. Query on just a uses index; query on just b doesn't.","Trade-off: indexes speed up reads but slow down writes (index must be updated on insert/update)."],visual:`B-TREE INDEX ON user_id:

                    ┌──────────────┐
                    │  [50, 100]   │      ← Root
                    └──────────────┘
                   ╱       │        ╲
          ┌──────┐    ┌──────┐    ┌──────┐
          │[10,30]│    │[60,80]│    │[120] │
          └──────┘    └──────┘    └──────┘
         ╱  │  ╲      ╱  │  ╲      │
       ...  ...  ... ...  ...  ... ...
                                → leaf = pointer to actual row

QUERY: WHERE user_id = 60
  Root: 50 < 60 < 100 → middle child
  Node: 60 found! → follow pointer to row

  WITHOUT index: scan 1,000,000 rows → 1,000,000 comparisons
  WITH index:    traverse 3-4 levels → 3-4 comparisons

COMPOSITE INDEX ON (status, created_at):
  ✓ WHERE status = 'active' AND created_at > '2024-01-01'
  ✓ WHERE status = 'active'  (uses index, leftmost prefix)
  ✗ WHERE created_at > '2024-01-01'  (can't skip status!)
  
  Index order matters: put EQUALITY first, RANGE last`,code:{language:"sql",title:"Understanding Query Plans",code:`-- Check if your query uses an index:
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 12345
AND created_at > '2024-01-01';

-- Good output: "Index Scan using idx_orders_user_date"
-- Bad output:  "Seq Scan on orders" ← full table scan!

-- Create composite index (equality first, range last):
CREATE INDEX idx_orders_user_date
ON orders (user_id, created_at);

-- N+1 problem — BAD:
-- For each user, query their orders separately
-- SELECT * FROM orders WHERE user_id = 1;
-- SELECT * FROM orders WHERE user_id = 2; (N queries!)

-- GOOD: Use JOIN or IN
SELECT * FROM orders
WHERE user_id IN (1, 2, 3, 4, 5);`}}]},"api-design":{sections:[{title:"📖 RESTful API Design",steps:["Resources are nouns (users, posts, comments), not verbs.","Use HTTP methods for actions: GET (read), POST (create), PUT (replace), PATCH (update), DELETE.","Use proper status codes: 2xx success, 4xx client error, 5xx server error.","Pagination, filtering, and versioning are essential for production APIs."],visual:`REST API DESIGN:

  Resource: /api/v1/users
  ┌────────┬──────────────────┬──────┬──────────────┐
  │ Method │ Endpoint         │ Code │ Action       │
  ├────────┼──────────────────┼──────┼──────────────┤
  │ GET    │ /users           │ 200  │ List users   │
  │ GET    │ /users/123       │ 200  │ Get user 123 │
  │ POST   │ /users           │ 201  │ Create user  │
  │ PUT    │ /users/123       │ 200  │ Replace user │
  │ PATCH  │ /users/123       │ 200  │ Update fields│
  │ DELETE │ /users/123       │ 204  │ Delete user  │
  └────────┴──────────────────┴──────┴──────────────┘

  Nested resources:
  GET /users/123/posts        → User 123's posts
  GET /users/123/posts/456    → Post 456 of user 123

  Pagination (cursor-based):
  GET /posts?limit=20&after=abc123
  Response: { data: [...], next_cursor: "def456" }

  Filtering:
  GET /products?category=electronics&min_price=100

  Versioning:
  /api/v1/users  → Version 1
  /api/v2/users  → Version 2 (breaking changes)`,code:{language:"javascript",title:"Express.js REST API Example",code:`// Good REST API structure
app.get('/api/v1/users', async (req, res) => {
  const { limit = 20, after } = req.query;
  const users = await db.users
    .find(after ? { _id: { $gt: after } } : {})
    .limit(Number(limit) + 1); // fetch one extra
  
  const hasMore = users.length > limit;
  const data = users.slice(0, limit);
  
  res.json({
    data,
    next_cursor: hasMore ? data[data.length-1]._id : null,
    has_more: hasMore
  });
});

// Idempotency key for POST (payments)
app.post('/api/v1/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const cached = await redis.get(\`idem:\${idempotencyKey}\`);
  if (cached) return res.json(JSON.parse(cached));
  
  const result = await processPayment(req.body);
  await redis.set(\`idem:\${idempotencyKey}\`,
    JSON.stringify(result), 'EX', 86400);
  res.status(201).json(result);
});`}}]},"db-sharding":{sections:[{title:"📖 Sharding Strategies Visualized",steps:["Sharding = splitting one large database into smaller pieces (shards), each on a different server.","Range-based: shard by value ranges. Easy for range queries, but can create hotspots.","Hash-based: shard by hash(key) % N. Uniform distribution, but no range queries.","Directory-based: a lookup service maps keys to shards. Most flexible, adds a hop."],visual:`BEFORE SHARDING (single DB, hitting limits):
┌─────────────────────┐
│    Users Table       │
│  100M rows, 500GB   │
│  Writes: 10K/s      │
│  ← CPU at 95%!      │
└─────────────────────┘

AFTER HASH-BASED SHARDING:
  shard_id = hash(user_id) % 4

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Shard 0  │  │ Shard 1  │  │ Shard 2  │  │ Shard 3  │
  │ 25M rows │  │ 25M rows │  │ 25M rows │  │ 25M rows │
  │ 2.5K w/s │  │ 2.5K w/s │  │ 2.5K w/s │  │ 2.5K w/s │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
  hash%4=0      hash%4=1      hash%4=2      hash%4=3

RANGE-BASED SHARDING (by user name):
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Shard 1  │  │ Shard 2  │  │ Shard 3  │
  │  A — I   │  │  J — R   │  │  S — Z   │
  │ 40M rows │  │ 35M rows │  │ 25M rows │
  └──────────┘  └──────────┘  └──────────┘
      ↑ Hotspot risk! (more names start with A-I)

CROSS-SHARD QUERY PROBLEM:
  Query: "JOIN users with orders"
  If users and orders are on different shards → expensive!
  Solution: shard both by user_id → co-located`}]},"db-replication":{sections:[{title:"📖 Leader-Follower Replication",steps:["One leader (primary) handles all writes. Multiple followers (replicas) handle reads.","Write → leader → WAL/binlog → sent to followers → followers apply changes.","Synchronous: leader waits for follower confirmation. Consistent but slower.","Asynchronous: leader doesn't wait. Faster but follower may have stale data."],visual:`LEADER-FOLLOWER (Master-Replica):

  Writes                    Reads (distributed)
    │                      ╱       │       ╲
    ↓                     ↓       ↓       ↓
┌────────┐ replication ┌──────┐┌──────┐┌──────┐
│ Leader │────────────→│ F1   ││ F2   ││ F3   │
│(primary)│───────────→│(read)││(read)││(read)│
│ R+W    │────────────→│      ││      ││      │
└────────┘             └──────┘└──────┘└──────┘
    │
    │ Write Ahead Log (WAL)
    │ streams to followers

REPLICATION LAG:
  Leader:   Write x=5 at T=0
  Follower: Receives x=5 at T=0.5s  ← 500ms lag
  
  User writes "new name" → immediately reads from follower
  → Sees OLD name! (stale read)
  
  Fix: Read-your-writes guarantee
  → After writing, read from leader (or wait for replication)

FAILOVER:
  ┌────────┐              ┌──────┐
  │ Leader │──── ✗ ────── │ F1   │ ← promoted to leader!
  │ (down) │              │(new  │
  └────────┘              │leader)│
                          └──────┘
  Risk: split-brain if old leader comes back online`}]},"cdn-edge":{sections:[{title:"📖 CDN Request Flow",steps:["User requests image → DNS resolves to nearest CDN edge server (PoP).","Edge server checks cache → HIT: serve immediately (< 20ms). MISS: fetch from origin.","On miss, edge fetches from origin, caches it, serves to user, and serves future requests from cache.","TTL (Time to Live) controls how long edge caches the content before re-fetching."],visual:`CDN REQUEST FLOW:

  User (Mumbai)            User (New York)
       │                        │
       ↓                        ↓
  ┌──────────┐            ┌──────────┐
  │ Edge PoP │            │ Edge PoP │
  │ Mumbai   │            │ New York │
  │ (cached!)│            │ (miss!)  │
  └──────────┘            └──────────┘
       │                        │
       │ HIT                    │ MISS → fetch from origin
       │ < 20ms                 ↓
       │                  ┌──────────┐
       │                  │  Origin  │
       │                  │ Server   │
       │                  │ (Oregon) │
       │                  └──────────┘
       │                        │
       ↓                        ↓ 
  Response: 20ms          Response: 200ms (first time)
                          Next request: 20ms (cached)

WITHOUT CDN:             WITH CDN:
  All users → Oregon      Users → nearest edge
  Latency: 50-300ms       Latency: 5-30ms
  Origin load: 100%       Origin load: 5-10%`}]},"rate-limiting":{sections:[{title:"📖 Token Bucket Algorithm",steps:["Imagine a bucket that holds tokens. Tokens are added at a fixed rate (e.g., 10/second).","Each request consumes one token. If bucket is empty → reject (429 Too Many Requests).","Bucket has a max capacity → allows short bursts up to that capacity.","Leaky bucket is different: requests processed at fixed rate, excess queued/dropped."],visual:`TOKEN BUCKET (rate=10/s, capacity=20):

  Tokens added at 10/sec
       │ │ │ │ │
       ↓ ↓ ↓ ↓ ↓
  ┌──────────────┐  capacity = 20
  │ ●●●●●●●●●●●●│  current = 15 tokens
  │ ●●●          │
  └──────┬───────┘
         │
    Request arrives
    → consume 1 token
    → 14 tokens left ✓

  BURST: 20 requests at once
  → all 20 succeed (bucket had 20 tokens)
  → bucket empty
  → next request waits for refill (100ms for 1 token)

SLIDING WINDOW COUNTER:

  Window: 1 minute, Limit: 100 requests
  
  Previous window: 80 requests
  Current window:  30 requests (40% elapsed)
  
  Weighted count = 80 × (1 - 0.40) + 30
                 = 48 + 30 = 78 ← under limit ✓

  Timeline:
  ├──── prev minute ────┼──── curr minute ────┤
  │    80 requests      │  30 req  ← we are   │
  │                     │         here (40%)   │
  └─────────────────────┴──────────────────────┘`,code:{language:"javascript",title:"Redis Rate Limiter (Sliding Window)",code:`// Distributed rate limiter using Redis
async function isAllowed(userId, limit, windowSec) {
  const key = \`rate:\${userId}\`;
  const now = Date.now();
  const windowStart = now - windowSec * 1000;
  
  // Atomic operation with Redis pipeline
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // Remove old
  pipeline.zadd(key, now, \`\${now}:\${Math.random()}\`); // Add current
  pipeline.zcard(key);  // Count in window
  pipeline.expire(key, windowSec); // Auto-cleanup
  
  const results = await pipeline.exec();
  const count = results[2][1];
  
  return count <= limit; // true = allowed
}`}}]},"message-queues":{sections:[{title:"📖 Message Queue Architecture",steps:["Producer sends message to queue. Consumer reads from queue and processes it.","Queue acts as a buffer — producer and consumer don't need to be online simultaneously.","At-least-once delivery: message may be delivered multiple times → make consumer idempotent.","Dead Letter Queue (DLQ): messages that fail after max retries go here for manual investigation."],visual:`ASYNC PROCESSING WITH QUEUE:

  ┌────────┐   POST /order   ┌───────────┐
  │ Client │────────────────→│ API Server│
  └────────┘  Response: 202  └───────────┘
              "Order received"      │
                                    │ Enqueue
                                    ↓
                              ┌──────────┐
                              │  Queue   │
                              │ (SQS/    │
                              │ RabbitMQ)│
                              └──────────┘
                                    │ Dequeue
                                    ↓
                              ┌──────────┐
                              │ Worker   │──→ Process order
                              │ Consumer │──→ Charge payment
                              └──────────┘──→ Send email

  Benefits:
  ✓ User gets instant response (no waiting for email)
  ✓ Worker can retry on failure
  ✓ Traffic spikes buffered by queue
  ✓ Producer/consumer scale independently

DEAD LETTER QUEUE (DLQ):
  ┌───────┐   try 1   ┌────────┐
  │ Queue │──────────→│ Worker │ ← FAIL
  └───────┘   try 2   │        │ ← FAIL
       │      try 3   │        │ ← FAIL
       │              └────────┘
       │ After 3 failures:
       ↓
  ┌──────────┐
  │   DLQ    │ ← Investigate manually
  │ (poison  │    or alert + auto-fix
  │ messages)│
  └──────────┘`}]},microservices:{sections:[{title:"📖 Monolith → Microservices Evolution",steps:["Monolith: single deployable unit. Simple to develop, test, deploy. Hard to scale parts independently.","Microservices: each service independently deployable, owns its own database, communicates via APIs.","Start monolith → extract services when teams/components need independent scaling or release cycles.","API Gateway: single entry point that routes requests to appropriate services."],visual:`MONOLITH:
  ┌──────────────────────────────────────┐
  │            Single App                │
  │  ┌──────┐ ┌──────┐ ┌──────────────┐ │
  │  │Users │ │Orders│ │   Payments   │ │
  │  └──────┘ └──────┘ └──────────────┘ │
  │  ┌──────────────────────────────────┐│
  │  │        Shared Database           ││
  │  └──────────────────────────────────┘│
  └──────────────────────────────────────┘
  Deploy all or nothing. Scale all or nothing.

MICROSERVICES:
  ┌──────────┐
  │   API    │ (routing, auth, rate limiting)
  │ Gateway  │
  └──────────┘
    │    │    │
    ↓    ↓    ↓
  ┌────┐┌──────┐┌────────┐
  │User││Order ││Payment │  ← Independent services
  │Svc ││ Svc  ││  Svc   │
  └────┘└──────┘└────────┘
    │      │        │
    ↓      ↓        ↓
  ┌──┐  ┌──┐    ┌──────┐   ← Each owns its DB
  │DB│  │DB│    │  DB  │
  └──┘  └──┘    └──────┘

  ✓ Independent deploy & scale
  ✓ Team autonomy (each team owns a service)
  ✗ Network complexity (service-to-service calls)
  ✗ Distributed transactions are hard`}]},"distributed-transactions":{sections:[{title:"📖 Saga Pattern — Orchestration",steps:["Problem: booking a trip involves flight + hotel + car rental across 3 services. How to handle partial failure?","Saga: execute a chain of local transactions. If one fails, execute compensating transactions in reverse.","Orchestration: a central Saga Orchestrator directs the flow, easier to understand and debug.","Each step must have a compensating action defined upfront (book → cancel, charge → refund)."],visual:`SAGA ORCHESTRATION — Trip Booking:

  ┌──────────────┐
  │    Saga      │ (state machine)
  │ Orchestrator │
  └──────────────┘
    │    │    │
    │    │    │ Step 1: Book Flight
    ↓    │    │
  ┌──────┐   │
  │Flight│ ✓ │ Step 2: Book Hotel
  │ Svc  │   ↓
  └──────┘ ┌──────┐
           │Hotel │ ✓  Step 3: Book Car
           │ Svc  │──→ ┌─────┐
           └──────┘    │Car  │ ✗ FAILED!
                       │ Svc │
                       └─────┘

  COMPENSATION (reverse order):
  ┌──────────────┐
  │ Orchestrator │ Comp 2: Cancel Hotel
  └──────────────┘ Comp 1: Cancel Flight
    │    │
    ↓    ↓
  ┌──────┐┌──────┐
  │Flight││Hotel │
  │CANCEL││CANCEL│  ← Compensating transactions
  └──────┘└──────┘

  State Machine:
  STARTED → FLIGHT_BOOKED → HOTEL_BOOKED → CAR_BOOKED → DONE
                                   │
                              CAR_FAILED
                                   │
                         COMPENSATING_HOTEL → COMPENSATING_FLIGHT → FAILED`}]},"service-resilience":{sections:[{title:"📖 Circuit Breaker Pattern",steps:["CLOSED: normal operation, requests flow through. Count failures.","OPEN: failure threshold exceeded → all requests fail immediately (no call to downstream). Cooldown timer starts.","HALF-OPEN: after cooldown, allow ONE test request. Success → CLOSED. Failure → OPEN again.","This prevents sending requests to a service that's clearly down, avoiding cascading failures."],visual:`CIRCUIT BREAKER STATE MACHINE:

  ┌──────────┐  failure count    ┌──────────┐
  │  CLOSED  │  > threshold     │   OPEN   │
  │ (normal) │─────────────────→│(fail-fast)│
  │          │                   │          │
  └──────────┘                   └──────────┘
       ↑                              │
       │ test request                 │ cooldown
       │ succeeded                    │ timer expires
       │                              ↓
       │                        ┌──────────┐
       └────────────────────────│HALF-OPEN │
          test request          │(test one)│
          succeeded             └──────────┘
                                      │
                     test failed ─────┘→ back to OPEN

  TIMELINE EXAMPLE:
  
  Time  │ State    │ Action
  ──────┼──────────┼──────────────────────────
  T=0   │ CLOSED   │ Req 1: OK ✓
  T=1   │ CLOSED   │ Req 2: FAIL ✗ (count=1)
  T=2   │ CLOSED   │ Req 3: FAIL ✗ (count=2)
  T=3   │ CLOSED   │ Req 4: FAIL ✗ (count=3)
  T=3   │ → OPEN   │ Threshold (3) reached!
  T=4   │ OPEN     │ Req 5: REJECTED (no call)
  T=5   │ OPEN     │ Req 6: REJECTED (no call)
  T=33  │ →HALF-OPEN│ 30s cooldown elapsed
  T=33  │ HALF-OPEN│ Test req: OK ✓
  T=33  │ → CLOSED │ Back to normal!`}]},"event-driven":{sections:[{title:"📖 Kafka Architecture",steps:['Topics are named channels for events (e.g., "order-events", "user-signups").',"Partitions split a topic for parallelism. Each partition is an ordered, append-only log.","Consumer Groups enable parallel processing. Each partition is read by exactly one consumer in the group.","Offset tracks position — consumers resume from their last offset after restart."],visual:`KAFKA ARCHITECTURE:

  Producers           Topic: "orders"              Consumers
  ┌──────┐         ┌────────────────────┐         ┌──────┐
  │Order │─────────│ P0: [m1][m2][m3]   │────────→│ C1   │
  │ Svc  │    │    │ P1: [m4][m5]       │────────→│ C2   │
  └──────┘    │    │ P2: [m6][m7][m8][m9]│───────→│ C3   │
  ┌──────┐    │    └────────────────────┘         └──────┘
  │Cart  │────┘      3 partitions                Consumer Group A
  │ Svc  │           (unit of parallelism)       (3 consumers max)
  └──────┘

  Partition Key = order_id
  → All events for same order go to same partition
  → Ordering guaranteed per order ✓

  CONSUMER GROUP REBALANCING:
  If C2 dies:
    P0 → C1
    P1 → C3  ← rebalanced from C2
    P2 → C3

  RETENTION:
  Messages NOT deleted on consume!
  Kept for retention period (e.g., 7 days)
  → Multiple consumer groups can read same topic
  → Replay events by resetting offset`}]},"containers-orchestration":{sections:[{title:"📖 Kubernetes Architecture",steps:["Control Plane: API server, scheduler, controller manager — manages the cluster.","Worker Nodes: run your application pods. Each node runs kubelet + container runtime.","Pod: smallest deployable unit. Usually one container per pod. Shares network namespace.","Deployment: manages replica count, rolling updates, rollbacks."],visual:`KUBERNETES CLUSTER:

  ┌─────────────────────────────────────────────────┐
  │                  CONTROL PLANE                   │
  │  ┌───────────┐ ┌───────────┐ ┌────────────────┐ │
  │  │ API Server│ │ Scheduler │ │Controller Mgr  │ │
  │  └───────────┘ └───────────┘ └────────────────┘ │
  │  ┌───────────┐                                   │
  │  │   etcd    │ (cluster state store)             │
  │  └───────────┘                                   │
  └─────────────────────────────────────────────────┘
           │                │
  ┌────────┴───────┐ ┌──────┴─────────┐
  │  Worker Node 1 │ │  Worker Node 2 │
  │  ┌───────────┐ │ │  ┌───────────┐ │
  │  │  kubelet  │ │ │  │  kubelet  │ │
  │  └───────────┘ │ │  └───────────┘ │
  │  ┌─────┐┌─────┐│ │  ┌─────┐      │
  │  │Pod A││Pod B││ │  │Pod C│      │
  │  │(app)││(app)││ │  │(app)│      │
  │  └─────┘└─────┘│ │  └─────┘      │
  └────────────────┘ └────────────────┘

  DEPLOYMENT + ROLLING UPDATE:
  
  Desired: 3 replicas
  ┌─────┐ ┌─────┐ ┌─────┐
  │v1   │ │v1   │ │v1   │  ← current
  └─────┘ └─────┘ └─────┘
  
  Rolling update to v2:
  ┌─────┐ ┌─────┐ ┌─────┐
  │v2 ✓ │ │v1   │ │v1   │  Step 1: replace 1
  └─────┘ └─────┘ └─────┘
  ┌─────┐ ┌─────┐ ┌─────┐
  │v2 ✓ │ │v2 ✓ │ │v1   │  Step 2: replace 2
  └─────┘ └─────┘ └─────┘
  ┌─────┐ ┌─────┐ ┌─────┐
  │v2 ✓ │ │v2 ✓ │ │v2 ✓ │  Step 3: done!
  └─────┘ └─────┘ └─────┘
  Zero downtime! ✓`}]},observability:{sections:[{title:"📖 Three Pillars of Observability",steps:['Logs: discrete events. "Request X failed with error Y at time T." Use structured JSON.','Metrics: numeric measurements. "Request count: 1500/s, P99 latency: 200ms, Error rate: 0.5%".','Traces: follow a request across services. "Request spent 50ms in API, 120ms in DB, 30ms in cache."',"Together: metrics ALERT you, traces LOCATE the problem, logs EXPLAIN the root cause."],visual:`THE THREE PILLARS:

  ┌─────────────────────────────────────────────┐
  │                OBSERVABILITY                 │
  ├───────────┬──────────────┬──────────────────┤
  │   LOGS    │   METRICS    │    TRACES        │
  │           │              │                  │
  │ Discrete  │ Numeric over │ Request path     │
  │ events    │ time         │ across services  │
  │           │              │                  │
  │ What      │ How much     │ Where time       │
  │ happened? │ / how fast?  │ is spent?        │
  │           │              │                  │
  │ ELK Stack │ Prometheus/  │ Jaeger/          │
  │ Datadog   │ Grafana      │ OpenTelemetry    │
  └───────────┴──────────────┴──────────────────┘

  DISTRIBUTED TRACE (waterfall view):
  
  Request: GET /api/feed  (trace_id: abc123)
  ├─ API Gateway          [────]           12ms
  ├─ Auth Service          [──]             8ms
  ├─ Feed Service            [──────────] 145ms
  │  ├─ Redis Cache              [─]        3ms (HIT)
  │  ├─ User Service               [────]  45ms
  │  │  └─ Postgres                  [──]  30ms ← slow!
  │  └─ Post Service                [───]  40ms
  │     └─ Elasticsearch              [─]  15ms
  └─ Total                              165ms

  RED METHOD (for each service):
  Rate    → requests per second
  Errors  → error rate (% of 5xx)
  Duration → latency (P50, P95, P99)`}]},"ai-native":{sections:[{title:"📖 LLM in the Request Path",steps:["Traditional API: request → compute → respond in 5-50ms.","LLM API: request → tokenize → forward pass → generate tokens → 500ms-5s total.","Streaming is essential: send tokens as generated (SSE) so user sees output immediately.","Cost = (input_tokens + output_tokens) × price_per_token. A single request can cost $0.001-$0.10."],visual:`LLM REQUEST ARCHITECTURE:

  ┌────────┐  query   ┌──────────┐  context   ┌────────┐
  │  User  │────────→│ API + RAG │──────────→│  LLM   │
  └────────┘         │ Pipeline  │           │(GPT/   │
       ↑             └──────────┘           │Claude) │
       │                  │ retrieve         └────────┘
       │                  ↓                      │
       │             ┌──────────┐           stream tokens
       │             │ Vector DB│                │
       │             └──────────┘                ↓
       │                                   ┌──────────┐
       └───────── streaming response ──────│  Stream  │
                  (SSE / WebSocket)        │ Handler  │
                                           └──────────┘

  COST OPTIMIZATION STRATEGIES:
  ┌──────────────────────────────────────────────┐
  │ Strategy          │ Savings │ Trade-off      │
  ├───────────────────┼─────────┼────────────────┤
  │ Model routing     │  60-80% │ Lower quality │
  │ (small → large)   │         │ for easy Qs    │
  │ Response caching   │  40-70% │ Stale answers  │
  │ Prompt compression │  20-40% │ Info loss risk │
  │ Token limits       │  30-50% │ Truncated resp │
  └───────────────────┴─────────┴────────────────┘
  
  GUARDRAILS:
  Input  → [Prompt injection detection]
         → [PII redaction]
         → [Topic filtering]
  Output → [Hallucination check]
         → [Harmful content filter]
         → [Format validation]`}]},"rag-vectors":{sections:[{title:"📖 RAG Pipeline Architecture",steps:["INGEST: Split documents into chunks → generate embedding for each chunk → store in vector DB.","RETRIEVE: Embed user query → search vector DB for top-K similar chunks.","AUGMENT: Inject retrieved chunks into the LLM prompt as context.","GENERATE: LLM generates a grounded answer using your data (reduces hallucination)."],visual:`RAG PIPELINE:

  INGESTION (offline):
  ┌──────┐   chunk    ┌────────┐   embed    ┌──────────┐
  │ Docs │──────────→│ Chunks │──────────→│ Vectors  │
  │(PDF, │  (500 char │ + meta │  (ada-002) │ stored   │
  │ HTML)│  + overlap)│        │           │in VecDB  │
  └──────┘            └────────┘           └──────────┘

  QUERY TIME (online):
  ┌───────┐  embed    ┌──────────┐  top-K   ┌─────────┐
  │ Query │────────→│ Vector DB │────────→│ Context │
  │"How do│         │  (ANN     │         │ Chunks  │
  │ I..."│         │  search)  │         │ (3-5)   │
  └───────┘         └──────────┘         └─────────┘
                                              │
                                    ┌─────────┴────────┐
                                    │   LLM Prompt:     │
                                    │   System: You are │
                                    │   a helpful...    │
                                    │                   │
                                    │   Context:        │
                                    │   [chunk 1]       │
                                    │   [chunk 2]       │
                                    │   [chunk 3]       │
                                    │                   │
                                    │   Question:       │
                                    │   "How do I..."   │
                                    └───────────────────┘
                                              │
                                              ↓
                                    ┌───────────────────┐
                                    │  Grounded Answer  │
                                    │  with citations   │
                                    └───────────────────┘

  CHUNKING STRATEGIES:
  ┌──────────────────────────────────────────────┐
  │ Fixed-size (500 chars, 100 overlap):         │
  │ [=====chunk1=====]                           │
  │            [=====chunk2=====]  ← overlap     │
  │                       [=====chunk3=====]     │
  │                                              │
  │ Semantic (by paragraph/section):             │
  │ [  Introduction  ][  Methods  ][  Results  ] │
  │                                              │
  │ Recursive (split until small enough):        │
  │ Split by: \\n\\n → \\n → sentence → char       │
  └──────────────────────────────────────────────┘`}]},"sd-interview-framework":{sections:[{title:"📖 The 4-Step Interview Framework",steps:["Step 1 (3-5 min): REQUIREMENTS — Ask: Who are the users? What are the core features? What scale? What SLA?","Step 2 (3-5 min): ESTIMATION — Calculate: DAU, QPS (read/write), storage needs, bandwidth.","Step 3 (15-20 min): HIGH-LEVEL DESIGN — Draw the architecture. Start simple, add components.","Step 4 (10-15 min): DEEP DIVE — Pick the most interesting bottleneck and go deep."],visual:`THE 4-STEP FRAMEWORK:

  ┌─────────────────────────────────────────────────┐
  │ Step 1: REQUIREMENTS (3-5 min)                  │
  │  Functional: "Users can post tweets, follow,    │
  │               see timeline"                     │
  │  Non-functional: "100M DAU, <200ms latency,     │
  │               99.99% availability"              │
  ├─────────────────────────────────────────────────┤
  │ Step 2: ESTIMATION (3-5 min)                    │
  │  DAU: 100M                                      │
  │  Reads: 100M × 10 reads/day = 1B/day ≈ 12K QPS │
  │  Writes: 100M × 0.5/day = 50M/day ≈ 600 QPS    │
  │  Storage: 50M × 200B = 10GB/day ≈ 3.6TB/year   │
  ├─────────────────────────────────────────────────┤
  │ Step 3: HIGH-LEVEL DESIGN (15-20 min)           │
  │                                                 │
  │  Client → LB → API Servers → Cache → DB         │
  │                    ↓                             │
  │               Queue → Workers                   │
  │                                                 │
  │  Add: CDN, Read Replicas, Sharding as needed    │
  ├─────────────────────────────────────────────────┤
  │ Step 4: DEEP DIVE (10-15 min)                   │
  │  "Let me dive into the timeline generation..."  │
  │  Fan-out on write vs fan-out on read?           │
  │  Cache invalidation strategy?                   │
  │  How to handle celebrity accounts (hot keys)?   │
  └─────────────────────────────────────────────────┘

  BACK-OF-ENVELOPE CHEAT SHEET:
  ┌──────────────────────────────────────────────┐
  │ 1 day = 86,400 sec ≈ 100K sec (round up)    │
  │ 1M DAU → 1M/100K ≈ 10 QPS (avg)            │
  │ Peak = 2-3× average                         │
  │                                              │
  │ 1 char = 1 byte                              │
  │ 1 tweet ≈ 200 bytes                          │
  │ 1 image ≈ 200 KB                             │
  │ 1 video ≈ 5 MB                               │
  │                                              │
  │ 1 KB × 1M = 1 GB                             │
  │ 1 MB × 1M = 1 TB                             │
  └──────────────────────────────────────────────┘`}]},"auth-systems":{sections:[{title:"📖 Authentication Flow — JWT vs Session",steps:["Session-based: user logs in → server creates session in Redis → sends session_id cookie.","JWT-based: user logs in → server issues signed token → client sends in Authorization header.","JWT is stateless — no server-side storage needed. But no way to revoke until expiry.","Best practice: short-lived access token (15 min) + long-lived refresh token (7 days)."],visual:`SESSION-BASED AUTH:
  ┌────────┐  POST /login   ┌───────────┐  Store session  ┌───────┐
  │ Client │───────────────→│   Server  │────────────────→│ Redis │
  └────────┘  (user/pass)   └───────────┘                 │session│
       ↑                         │                        │ store │
       │    Set-Cookie:          │                        └───────┘
       │    session_id=abc123    │
       └─────────────────────────┘

  Subsequent requests:
  Cookie: session_id=abc123 → Server looks up in Redis → user found ✓

JWT-BASED AUTH:
  ┌────────┐  POST /login   ┌───────────┐
  │ Client │───────────────→│   Server  │
  └────────┘  (user/pass)   └───────────┘
       ↑                         │
       │    { access_token:      │  Sign with private key
       │      "eyJhbG...",       │
       │      refresh_token:     │
       │      "dGhpcz..." }     │
       └─────────────────────────┘

  Subsequent requests:
  Authorization: Bearer eyJhbG... → Server verifies signature → valid ✓
  (No server-side lookup needed!)

TOKEN REFRESH FLOW:
  Access token expired (15 min)
  ┌────────┐  POST /refresh  ┌───────────┐
  │ Client │────────────────→│   Server  │
  └────────┘ refresh_token   └───────────┘
       ↑                         │ Verify refresh token
       │  New access_token +     │ Issue new pair
       │  New refresh_token      │ Invalidate old refresh
       └─────────────────────────┘
  (Old refresh token can't be reused — detect theft)`}]},"api-security":{sections:[{title:"📖 API Security Layers",steps:["Layer 1 (Edge): CDN/WAF — absorb DDoS, filter known attack patterns.","Layer 2 (Gateway): Authentication + Rate Limiting — who are you? How fast can you go?","Layer 3 (Service): Input Validation + Authorization — is this request well-formed? Are you allowed?","Layer 4 (Data): Encryption + Access Control — is data encrypted? Row-level security."],visual:`DEFENSE IN DEPTH:

  Internet Traffic
       │
       ↓
  ┌──────────────┐  Layer 1: Edge
  │    CDN/WAF   │  - DDoS absorption
  │ (Cloudflare) │  - Bot detection
  │              │  - IP blacklisting
  └──────────────┘
       │
       ↓
  ┌──────────────┐  Layer 2: Gateway
  │  API Gateway │  - Authentication (JWT/API key)
  │  (Kong/AWS)  │  - Rate limiting (per user/IP)
  │              │  - SSL termination
  └──────────────┘
       │
       ↓
  ┌──────────────┐  Layer 3: Application
  │   Service    │  - Input validation (schema)
  │              │  - Authorization (RBAC/ABAC)
  │              │  - Business logic checks
  └──────────────┘
       │
       ↓
  ┌──────────────┐  Layer 4: Data
  │   Database   │  - Encryption at rest
  │              │  - Row-level security
  │              │  - Parameterized queries
  └──────────────┘

OWASP API TOP 10 CHEAT SHEET:
┌────┬──────────────────────────┬────────────────────┐
│ #  │ Vulnerability            │ Prevention         │
├────┼──────────────────────────┼────────────────────┤
│ 1  │ Broken Object Auth (IDOR)│ Check ownership    │
│ 2  │ Broken Authentication    │ MFA, rate-limit    │
│ 3  │ Excessive Data Exposure  │ Filter responses   │
│ 4  │ Lack of Resources/Limits │ Rate limiting      │
│ 5  │ Broken Function Auth     │ RBAC enforcement   │
│ 6  │ Mass Assignment          │ Whitelist fields   │
│ 7  │ Security Misconfig       │ Security headers   │
│ 8  │ Injection                │ Parameterized SQL  │
│ 9  │ Improper Asset Mgmt      │ API versioning     │
│ 10 │ Insufficient Logging     │ Audit trail        │
└────┴──────────────────────────┴────────────────────┘`}]},"data-protection":{sections:[{title:"📖 Encryption Architecture",steps:["In Transit: TLS 1.3 encrypts data between client and server (HTTPS).","At Rest: AES-256 encrypts data stored on disk (database, file storage).","Envelope Encryption: data encrypted with DEK (Data Encryption Key), DEK encrypted with KEK (Key Encryption Key in KMS).","E2E Encryption: data encrypted on sender device, decrypted only on receiver device — server never sees plaintext."],visual:`ENVELOPE ENCRYPTION (AWS KMS pattern):

  ┌──────────────┐
  │  Your Data   │  "Hello, World!"
  └──────────────┘
         │
         │ Encrypt with DEK
         ↓
  ┌──────────────┐  ┌──────────────┐
  │  Encrypted   │  │   DEK        │
  │  Data        │  │ (plaintext)  │
  │  (ciphertext)│  └──────────────┘
  └──────────────┘         │
                           │ Encrypt DEK with KEK (KMS)
                           ↓
                    ┌──────────────┐
                    │ Encrypted DEK│
                    └──────────────┘

  Store together:
  ┌──────────────────────────────────┐
  │  Encrypted Data + Encrypted DEK │
  │  (DEK can only be decrypted by  │
  │   KMS using the master key)     │
  └──────────────────────────────────┘

  Decrypt: KMS decrypts DEK → DEK decrypts data
  Rotate:  New KEK → re-encrypt DEKs (NOT re-encrypt all data!)

GDPR DATA RIGHTS:
┌──────────────────────────────────────────────┐
│ Right              │ What it means            │
├────────────────────┼──────────────────────────┤
│ Access             │ Show user their data     │
│ Rectification      │ Let user correct data    │
│ Erasure            │ Delete on request        │
│ Portability        │ Export in machine format │
│ Object             │ Opt out of processing   │
│ Not be profiled    │ No automated decisions   │
└────────────────────┴──────────────────────────┘`}]},"websocket-realtime":{sections:[{title:"📖 WebSocket Connection Lifecycle",steps:["HTTP Upgrade: client requests upgrade from HTTP to WebSocket via Upgrade header.","Connection established: persistent, full-duplex TCP connection.","Both sides can send messages at any time — no request-response pattern.","Connection closes: either side sends close frame, or timeout/error."],visual:`WEBSOCKET HANDSHAKE:

  Client                          Server
    │                               │
    │  GET /chat HTTP/1.1           │
    │  Upgrade: websocket           │
    │  Connection: Upgrade          │
    │  ──────────────────────→      │
    │                               │
    │  HTTP/1.1 101 Switching       │
    │  Upgrade: websocket           │
    │  ←──────────────────────      │
    │                               │
    │ ══════ WebSocket Open ══════  │
    │                               │
    │  {"type":"msg","text":"hi"}   │
    │  ──────────────────────→      │
    │                               │
    │  {"type":"msg","text":"hey"}  │
    │  ←──────────────────────      │
    │                               │
    │  PING                         │
    │  ──────────────────────→      │
    │  PONG                         │
    │  ←──────────────────────      │
    │                               │
    │  CLOSE                        │
    │  ──────────────────────→      │

SCALING WEBSOCKETS WITH PUB/SUB:

  ┌────────┐     ┌────────────┐     ┌────────┐
  │ User A │────→│ WS Server 1│────→│        │
  └────────┘     └────────────┘     │ Redis  │
                                    │ Pub/Sub│
  ┌────────┐     ┌────────────┐     │        │
  │ User B │────→│ WS Server 2│←───→│        │
  └────────┘     └────────────┘     └────────┘

  User A sends message to room "general":
  1. WS Server 1 receives message
  2. Publishes to Redis channel "room:general"
  3. WS Server 2 subscribed to "room:general"
  4. WS Server 2 pushes to User B
  
  →  Works regardless of which server users connect to!`}]},"location-systems":{sections:[{title:"📖 Geospatial Indexing",steps:["Geohash divides the world into a grid of cells identified by strings.",'Longer string = smaller cell = more precise. "9q8" = city-level, "9q8yyk" = block-level.',"Nearby search: find all points with the same geohash prefix + neighboring cells.","Common in ride-hailing: drivers report geohash, riders search by geohash prefix."],visual:`GEOHASH — Dividing the World:

  ┌───────────────────────────────────────┐
  │              World Map                │
  │  ┌───────────┬───────────┐           │
  │  │     S     │     T     │           │
  │  │ ┌───┬───┐ │ ┌───┬───┐│           │
  │  │ │ 9q│ 9r│ │ │...│...││           │
  │  │ │8yy│   │ │ │   │   ││           │
  │  │ └───┴───┘ │ └───┴───┘│           │
  │  │     U     │     V     │           │
  │  └───────────┴───────────┘           │
  └───────────────────────────────────────┘

  Precision levels:
  ┌──────────┬──────────────────┬─────────┐
  │ Length   │ Cell Size        │ Use     │
  ├──────────┼──────────────────┼─────────┤
  │ 1 char   │ ~5,000 km        │ Global  │
  │ 3 chars  │ ~156 km          │ Region  │
  │ 4 chars  │ ~39 km           │ City    │
  │ 5 chars  │ ~4.9 km          │ Area    │
  │ 6 chars  │ ~1.2 km          │ Street  │
  │ 7 chars  │ ~153 m           │ Block   │
  │ 8 chars  │ ~38 m            │ Building│
  └──────────┴──────────────────┴─────────┘

UBER MATCHING FLOW:
  ┌──────┐  Request ride   ┌───────────┐
  │ Rider│────────────────→│  Dispatch │
  └──────┘  (lat, lng)     │  Service  │
                           └───────────┘
                                │
                  ┌─────────────┤ Look up nearby cells
                  ↓             ↓
            ┌──────────┐  ┌──────────┐
            │ Cell A   │  │ Cell B   │  Redis: geohash → driver_ids
            │ [D1, D3] │  │ [D5]    │
            └──────────┘  └──────────┘
                  │             │
                  └─────┬───────┘
                        ↓
                  Rank by ETA
                  (not distance!)
                        ↓
                  ┌──────────┐
                  │ Match D3 │ → Notify driver
                  │ ETA: 3min│
                  └──────────┘`}]},"notification-system":{sections:[{title:"📖 Multi-Channel Notification Architecture",steps:["Event triggers notification (order placed, security alert, marketing campaign).","Notification service checks user preferences and routes to appropriate channels.","Each channel has its own delivery worker with retries and error handling.","Priority system ensures critical notifications (OTP) are never delayed by marketing emails."],visual:`NOTIFICATION SYSTEM ARCHITECTURE:

  Trigger Events                    Delivery
  ┌──────────┐                     ┌──────────┐
  │ Order Svc│──→                  │ Push FCM │──→ 📱 Mobile
  └──────────┘   │                 └──────────┘
  ┌──────────┐   │  ┌──────────┐  ┌──────────┐
  │ Auth Svc │──→├─→│Notif Svc │─→│ Email SES│──→ 📧 Email
  └──────────┘   │  │ + Router │  └──────────┘
  ┌──────────┐   │  └──────────┘  ┌──────────┐
  │ Promo Svc│──→│       │        │ SMS Twil │──→ 📲 SMS
  └──────────┘   │       ↓        └──────────┘
                 │  ┌──────────┐  ┌──────────┐
                 │  │User Prefs│  │ In-App WS│──→ 🔔 In-App
                 │  │ + Rules  │  └──────────┘
                 │  └──────────┘
                 │
  PRIORITY QUEUES:
  ┌────────────────────────────────────────┐
  │ Critical │ OTP, Security    │ Instant  │
  │ (P0)     │ alerts            │ delivery │
  ├──────────┼──────────────────┼──────────┤
  │ High     │ Order updates,   │ < 1 min  │
  │ (P1)     │ payment receipts │          │
  ├──────────┼──────────────────┼──────────┤
  │ Medium   │ Feature updates, │ < 5 min  │
  │ (P2)     │ recommendations  │          │
  ├──────────┼──────────────────┼──────────┤
  │ Low      │ Marketing,       │ Batched  │
  │ (P3)     │ newsletters      │ hourly   │
  └──────────┴──────────────────┴──────────┘`}]},"data-pipeline-etl":{sections:[{title:"📖 ETL Pipeline Architecture",steps:["EXTRACT: pull data from multiple sources — databases, APIs, S3 files, Kafka.","TRANSFORM: clean, validate, enrich, join, aggregate — make data analytics-ready.","LOAD: write to destination — data warehouse, data lake, search index.","Modern ELT: load raw data first, then transform inside the warehouse (cheaper compute)."],visual:`CLASSIC ETL:
  Sources              Transform           Destination
  ┌──────┐                                 ┌──────────┐
  │ MySQL│──→  ┌────────────────────┐  ──→ │Snowflake │
  └──────┘     │  Transform Layer   │      │(warehouse│
  ┌──────┐     │ • Clean nulls      │      │)         │
  │ API  │──→  │ • Join tables      │  ──→ └──────────┘
  └──────┘     │ • Aggregate        │
  ┌──────┐     │ • Type conversion  │
  │ S3   │──→  │ • Deduplication    │
  └──────┘     └────────────────────┘

MODERN ELT:
  Sources              Load Raw         Transform in DW
  ┌──────┐                              ┌────────────┐
  │ MySQL│──→ ──→ ┌──────────┐  dbt  → │  Gold      │
  └──────┘        │ Raw Layer│ ──────→  │  Tables    │
  ┌──────┐        │(Bronze)  │          │(analytics) │
  │ API  │──→ ──→ └──────────┘          └────────────┘
  └──────┘

AIRFLOW DAG EXAMPLE:
  ┌─────────┐   ┌──────────┐   ┌──────────┐
  │ Extract │──→│Transform │──→│  Load    │
  │ Users   │   │ Clean +  │   │ to DW    │
  └─────────┘   │ Validate │   └──────────┘
                └──────────┘        │
  ┌─────────┐        │             ↓
  │ Extract │──→─────┘       ┌──────────┐
  │ Orders  │                │  Quality │
  └─────────┘                │  Check   │
                             └──────────┘
                                  │
                             Pass ↓ Fail → Alert!
                             ┌──────────┐
                             │ Dashboard │
                             │ Refresh  │
                             └──────────┘`}]},"stream-processing":{sections:[{title:"📖 Stream Processing Windowing",steps:["Tumbling Window: fixed-size, non-overlapping. Count events every 5 minutes.","Sliding Window: fixed-size, overlapping. Average over last 5 min, updated every minute.","Session Window: dynamic size, grouped by user activity. Gap of inactivity closes window.",'Watermarks: "I believe no events with timestamp < W will arrive." Used to close windows.'],visual:`WINDOW TYPES:

TUMBLING (5 min, no overlap):
  Time: ──|──────|──────|──────|──────|──→
          │ W1   │ W2   │ W3   │ W4   │
  Events: ●●● ●  │ ●●   │●●●●● │ ●    │

SLIDING (5 min window, 1 min slide):
  Time: ──|────|────|────|────|────|──→
          │←─── W1 ────→│
             │←─── W2 ────→│
                │←─── W3 ────→│
  Windows overlap! Each event in multiple windows.

SESSION (gap timeout = 3 min):
  Time: ──●●──●────────────●●●──●──────────→
          │← Session 1 →│gap│← Session 2→│gap│

  User active → events grouped.
  3 min inactivity → session closes.

WATERMARK FOR LATE DATA:
  Event Time:  T=0   T=1   T=2   T=3   T=4   T=5
  Arrival:     T=0   T=1   T=3   T=2!  T=4   T=5
                                  ↑ late!

  Watermark = max_event_time - allowed_lateness
  If W=2, event at T=2 arriving late is still accepted
  If W=1, event at T=2 arriving at real-time T=3 is dropped

FLINK EXACTLY-ONCE:
  ┌────────┐  ┌───────────────────────┐  ┌────────┐
  │ Kafka  │→ │ Flink Job             │→ │ Output │
  │ Source │  │ ┌────────┐ ┌────────┐ │  │  Sink  │
  │        │  │ │ Map    │→│ Window │ │  │        │
  └────────┘  │ └────────┘ └────────┘ │  └────────┘
              │     ↓ checkpoint      │
              │ ┌────────────────┐    │
              │ │ State Snapshot │    │  periodic checkpoint
              │ │ (RocksDB)     │    │  → rollback on failure
              │ └────────────────┘    │
              └───────────────────────┘`}]},"data-lakes-warehouse":{sections:[{title:"📖 Medallion Architecture",steps:["Bronze (Raw): ingest everything as-is. Append-only. Source of truth for replay.","Silver (Cleaned): dedup, validate, type-cast. Join with reference data. Business-ready fields.","Gold (Aggregated): pre-computed aggregations, KPIs, ML features. Ready for dashboards.","Each layer is independent — reprocess Silver from Bronze, Gold from Silver anytime."],visual:`MEDALLION ARCHITECTURE:

  Sources                          Consumers
  ┌──────┐                         ┌──────────┐
  │ Apps │──→  ┌────────┐          │ BI Tools │
  └──────┘     │ BRONZE │          │(Tableau, │
  ┌──────┐     │ (Raw)  │          │ Looker)  │
  │ APIs │──→  │        │          └──────────┘
  └──────┘     │ S3/    │              ↑
  ┌──────┐     │ ADLS   │    ┌────────┐│
  │ Kafka│──→  └────────┘    │  GOLD  ││  ← Optimized
  └──────┘         │         │(Agg)   ││    for queries
               Clean │       │ KPIs,  │┘
               Dedup │       │ metrics│
                     ↓       └────────┘
               ┌────────┐        ↑
               │ SILVER │  Aggregate
               │(Clean) │  Join,
               │ Typed, │  Summarize
               │ Joined │────────┘
               └────────┘

DATA LAKE vs WAREHOUSE vs LAKEHOUSE:
┌──────────────┬────────────┬─────────────┬────────────┐
│              │ Data Lake  │ Warehouse   │ Lakehouse  │
├──────────────┼────────────┼─────────────┼────────────┤
│ Storage      │ S3/ADLS    │ Proprietary │ S3/ADLS    │
│ Format       │ Any (raw)  │ Proprietary │ Parquet    │
│ Schema       │ On-read    │ On-write    │ On-write   │
│ ACID         │ No         │ Yes         │ Yes (Delta)│
│ SQL          │ External   │ Native      │ Native     │
│ Cost         │ $ (cheap)  │ $$$ (high)  │ $$ (mid)   │
│ Use case     │ ML, raw    │ BI, reports │ Both       │
└──────────────┴────────────┴─────────────┴────────────┘`}]},"proxy-gateway-patterns":{sections:[{title:"📖 API Gateway & BFF Pattern",steps:["API Gateway: single entry point for all clients. Handles cross-cutting concerns.","BFF (Backend for Frontend): one gateway per client type — mobile gets slim data, web gets rich data.","Sidecar: helper container alongside each service — handles logging, auth, networking.","Service Mesh: sidecar on every service, managed by control plane (Istio)."],visual:`API GATEWAY PATTERN:
  
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Web App  │  │Mobile App│  │ IoT Dev  │
  └──────────┘  └──────────┘  └──────────┘
       │             │             │
       └─────────────┼─────────────┘
                     ↓
              ┌──────────────┐
              │  API Gateway │  Auth, Rate Limit,
              │  (Kong/AWS)  │  Routing, SSL, Logging
              └──────────────┘
               │     │     │
               ↓     ↓     ↓
          ┌─────┐ ┌─────┐ ┌─────┐
          │User │ │Order│ │Pay  │
          │ Svc │ │ Svc │ │ Svc │
          └─────┘ └─────┘ └─────┘

BFF (Backend for Frontend):

  ┌──────────┐        ┌──────────┐
  │ Web App  │        │Mobile App│
  └──────────┘        └──────────┘
       │                    │
       ↓                    ↓
  ┌──────────┐        ┌──────────┐
  │ Web BFF  │        │Mobile BFF│  Different data shapes!
  │(rich data│        │(slim data│
  │+ complex)│        │+ images) │
  └──────────┘        └──────────┘
       │    │              │
       ↓    ↓              ↓
  ┌─────┐ ┌─────┐    ┌─────┐
  │User │ │Order│    │User │  (Same backend services)
  │ Svc │ │ Svc │    │ Svc │
  └─────┘ └─────┘    └─────┘

SERVICE MESH (Istio):
  ┌─────────────────────────────────────┐
  │  Control Plane (Istio)              │
  │  (config, certs, policies)          │
  └─────────────────────────────────────┘
       │              │              │
  ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
  │┌───────┐│    │┌───────┐│    │┌───────┐│
  ││Envoy  ││    ││Envoy  ││    ││Envoy  ││ ← Sidecar
  ││(proxy)││    ││(proxy)││    ││(proxy)││   proxies
  │└───────┘│    │└───────┘│    │└───────┘│
  │┌───────┐│    │┌───────┐│    │┌───────┐│
  ││ Svc A ││    ││ Svc B ││    ││ Svc C ││
  │└───────┘│    │└───────┘│    │└───────┘│
  └─────────┘    └─────────┘    └─────────┘
     mTLS ←──── automatic ────→ mTLS`}]},"domain-driven-design":{sections:[{title:"📖 DDD Building Blocks",steps:['Bounded Context: a clear boundary around a domain model. "Order" means different things in Shopping vs Shipping.',"Aggregate: a cluster of objects (entities + value objects) treated as a single unit. Has one root entity.",'Domain Events: something that happened in the domain. "OrderPlaced" → triggers payment, inventory, notification.',"Repository: provides a collection-like interface for accessing aggregates. One repo per aggregate root."],visual:`BOUNDED CONTEXTS (E-Commerce):

  ┌──────────────────┐    ┌──────────────────┐
  │  Shopping Context│    │ Shipping Context  │
  │                  │    │                   │
  │  "Order" = cart  │    │ "Order" = package │
  │  items + prices  │    │ tracking, address │
  │                  │    │                   │
  │  "Product" =     │    │ "Product" =       │
  │  name, price,    │    │ weight, dims,     │
  │  description     │    │ fragile flag      │
  └──────────────────┘    └──────────────────┘
         │                       │
         │   Domain Events       │
         │  ──────────────→      │
         │  "OrderPlaced"        │
         │                       │

AGGREGATE (Order):
  ┌──────────────────────────────────┐
  │  Order (Aggregate Root)          │
  │  ┌────────────┐                  │
  │  │ orderId    │  RULES:          │
  │  │ status     │  • Total > 0     │
  │  │ createdAt  │  • Max 50 items  │
  │  └────────────┘  • Status: only  │
  │       │            valid moves   │
  │  ┌────┴────────────┐             │
  │  │ OrderItem (VO)  │             │
  │  │ productId       │             │
  │  │ quantity         │  Transaction │
  │  │ unitPrice        │  boundary!   │
  │  └─────────────────┘             │
  └──────────────────────────────────┘
  
  Load/Save as a UNIT (not individual items)

EVENT-DRIVEN ACROSS CONTEXTS:
  Shopping      │ Event Bus  │  Shipping
  Context       │ (Kafka)    │  Context
  ──────────────┼────────────┼──────────
  placeOrder()→ │OrderPlaced │→ createShipment()
                │────────────│
  chargeUser()← │PaymentDone │← processPayment()
                │────────────│`}]},"twelve-factor-app":{sections:[{title:"📖 The 12 Factors Visualized",steps:["These 12 principles guide building modern, scalable, cloud-native applications.","Core idea: apps should be portable, scalable, and deployment-agnostic.","They emerged from Heroku's experience running millions of apps.","Following these factors makes your app Kubernetes-ready and cloud-native."],visual:`THE 12 FACTORS:

  ┌──────────────────────────────────────────────┐
  │ 1. CODEBASE           One repo → many deploys│
  │    [Git Repo] → dev, staging, prod           │
  ├──────────────────────────────────────────────┤
  │ 2. DEPENDENCIES       Explicitly declared    │
  │    package.json, go.mod — no global deps     │
  ├──────────────────────────────────────────────┤
  │ 3. CONFIG             Environment variables  │
  │    DB_URL=... API_KEY=... (not in code!)     │
  ├──────────────────────────────────────────────┤
  │ 4. BACKING SERVICES   Treat as resources     │
  │    DB, Redis, S3 → swap via config           │
  ├──────────────────────────────────────────────┤
  │ 5. BUILD/RELEASE/RUN  Strict separation      │
  │    Build → artifact → config = release → run │
  ├──────────────────────────────────────────────┤
  │ 6. PROCESSES          Stateless, share-nothing│
  │    State → Redis/DB (never in process memory)│
  ├──────────────────────────────────────────────┤
  │ 7. PORT BINDING       Self-contained HTTP    │
  │    app.listen(PORT) — no external web server │
  ├──────────────────────────────────────────────┤
  │ 8. CONCURRENCY        Scale via processes    │
  │    More instances, not bigger instances       │
  ├──────────────────────────────────────────────┤
  │ 9. DISPOSABILITY      Fast start, graceful   │
  │    stop. SIGTERM → finish requests → exit    │
  ├──────────────────────────────────────────────┤
  │ 10. DEV/PROD PARITY   Same everywhere        │
  │    Docker → identical dev/staging/prod        │
  ├──────────────────────────────────────────────┤
  │ 11. LOGS              stdout only            │
  │    Write to stdout → platform collects       │
  ├──────────────────────────────────────────────┤
  │ 12. ADMIN PROCESSES   One-off commands       │
  │    Migrations, scripts → same codebase/env   │
  └──────────────────────────────────────────────┘`}]},"case-netflix":{sections:[{title:"📖 Netflix System Architecture",steps:["Client requests content → plays via adaptive bitrate streaming (ABR).","Open Connect CDN: boxes placed inside ISP networks — content served locally, not from AWS.","Backend: 700+ microservices on AWS — Zuul (gateway), Eureka (discovery), Hystrix (circuit breaker).","Recommendation engine: processes 500B+ events/day to personalize content for 200M+ users."],visual:`NETFLIX ARCHITECTURE (simplified):

  ┌──────────┐
  │ Netflix  │  What to watch? → AWS Backend
  │  Client  │  Video stream → Open Connect
  └──────────┘
     │     │
     │     └───────────────────────┐
     ↓                             ↓
  ┌──────────────┐          ┌──────────────┐
  │  AWS Backend │          │ Open Connect │
  │  (Control)   │          │ (CDN/Data)   │
  │              │          │              │
  │ ┌──────────┐ │          │ ┌──────────┐ │
  │ │ Zuul     │ │          │ │ OCA Box  │ │
  │ │(gateway) │ │          │ │(at ISP)  │ │
  │ └──────────┘ │          │ └──────────┘ │
  │ ┌──────────┐ │          │              │
  │ │ Eureka   │ │          │ Video files  │
  │ │(discover)│ │          │ pre-cached   │
  │ └──────────┘ │          │ at 1000+ PoPs│
  │ ┌──────────┐ │          └──────────────┘
  │ │ Hystrix  │ │
  │ │(breaker) │ │
  │ └──────────┘ │
  │ ┌──────────┐ │
  │ │ Recs     │ │  Personalization
  │ │ Engine   │ │  (ML models)
  │ └──────────┘ │
  └──────────────┘

  VIDEO ENCODING PIPELINE:
  ┌──────────┐  ┌───────────────────────────────┐
  │ Original │→ │ Encode into 1200+ streams:    │
  │ 4K master│  │ • 4K HDR (25 Mbps)            │
  └──────────┘  │ • 1080p (5 Mbps)              │
                │ • 720p (3 Mbps)               │
                │ • 480p (1.5 Mbps)             │
                │ • 240p (0.5 Mbps)             │
                │ × codecs (H.264, VP9, AV1)    │
                │ × audio (5.1, stereo)         │
                └───────────────────────────────┘
                         │
                    Push to CDN
                    (before launch!)`}]},"case-uber":{sections:[{title:"📖 Uber Dispatch System",steps:["Rider requests ride → Dispatch service searches for available drivers in nearby cells.","Drivers continuously report location → stored in Redis by geospatial cell.","Matching: rank available drivers by ETA (not distance!), send offer to best match.","Trip state machine: REQUESTED → MATCHED → DRIVER_ARRIVING → TRIP_STARTED → COMPLETED."],visual:`UBER DISPATCH FLOW:

  ┌──────┐  1. Request ride   ┌───────────┐
  │ Rider│───────────────────→│  Dispatch │
  │ App  │  (pickup lat/lng)  │  Service  │
  └──────┘                    └───────────┘
                                    │
                          2. Find nearby drivers
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │ Cell A   │   │ Cell B   │   │ Cell C   │
              │ Driver 1 │   │ Driver 3 │   │ (empty)  │
              │ Driver 2 │   │          │   │          │
              └──────────┘   └──────────┘   └──────────┘
                    │               │
                    └───────┬───────┘
                            ↓
                  3. Rank by ETA
                     D1: 4 min
                     D3: 2 min ← BEST
                     D2: 6 min
                            │
                            ↓
                  4. Send offer to D3
                  ┌──────────┐
                  │ Driver 3 │  Accept? ✓
                  │   App    │
                  └──────────┘
                            │
                            ↓
                  5. Trip State Machine
  REQUESTED → MATCHED → ARRIVING → IN_PROGRESS → COMPLETED
                                                      │
                                                 Payment $$

  SURGE PRICING:
  ┌─────────────────────────────────────────┐
  │  Supply (drivers) vs Demand (riders)    │
  │                                          │
  │  Normal:  Supply ≥ Demand  → 1.0x       │
  │  Busy:    Supply < Demand  → 1.5x       │
  │  Peak:    Supply << Demand → 2.5x+      │
  │                                          │
  │  Per zone (each H3 hex cell gets its    │
  │  own surge multiplier)                   │
  └─────────────────────────────────────────┘`}]},"case-whatsapp":{sections:[{title:"📖 WhatsApp Messaging Delivery",steps:["Sender sends message → encrypted on device → sent to WhatsApp server → queued for recipient.","If recipient online: deliver immediately via existing WebSocket. If offline: queue in mailbox.",'Delivery receipt: server sends "delivered" ack. Read receipt: recipient sends "read" ack.',"Media: encrypted → uploaded to CDN → URL+key sent in message → recipient downloads and decrypts."],visual:`WHATSAPP MESSAGE FLOW:

  Sender (Alice)              Server              Receiver (Bob)
  ┌──────┐                  ┌──────┐              ┌──────┐
  │ App  │                  │ WA   │              │ App  │
  └──────┘                  │Server│              └──────┘
     │                      └──────┘                 │
     │ 1. Encrypt msg          │                     │
     │ (Signal Protocol)       │                     │
     │                         │                     │
     │ 2. Send encrypted       │                     │
     │ ─────────────────────→  │                     │
     │                         │ 3a. Bob online?     │
     │                         │ YES → deliver       │
     │                         │ ─────────────────→  │
     │ ← ─ ─ ─ ─ ─ ─ ─ ─ ─  │                     │
     │   "sent" (✓)           │ ← ─ ─ ─ ─ ─ ─ ─  │
     │                         │   "delivered" (✓✓) │
     │ ← ─ ─ ─ ─ ─ ─ ─ ─ ─  │                     │
     │   "delivered" (✓✓)     │                     │
     │                         │                     │
     │                         │ (Bob reads msg)     │
     │                         │ ← ─ ─ ─ ─ ─ ─ ─  │
     │ ← ─ ─ ─ ─ ─ ─ ─ ─ ─  │   "read"            │
     │   "read" (✓✓ blue)     │                     │

  IF BOB IS OFFLINE:
     │ 2. Send encrypted       │
     │ ─────────────────────→  │                     │
     │                         │ 3b. Bob offline    │
     │ ← ─ ─ ─ ─ ─ ─ ─ ─ ─  │ Queue in mailbox   │
     │   "sent" (✓)           │ ┌────────────┐     │
     │                         │ │ Bob's inbox│     │
     │                         │ │ [msg1]     │     │
     │                         │ │ [msg2]     │     │
     │                         │ └────────────┘     │
     │                         │                     │
     │                         │ Bob comes online!   │
     │                         │ ─────────────────→  │
     │                         │ Drain inbox         │

  END-TO-END ENCRYPTION:
  ┌──────────────────────────────────────────────┐
  │ Alice                  Server          Bob   │
  │                                              │
  │ msg = "Hello"         ??????          msg =  │
  │      │                 ↑↑↑            "Hello"│
  │ encrypt(msg, key_AB)  Server           │     │
  │      │                CANNOT           │     │
  │      └──→ ciphertext → READ ──→ decrypt│     │
  │           "x8f2kj..."  this   (key_AB) │     │
  └──────────────────────────────────────────────┘`}]}},P=[{id:"theory",label:"Theory",icon:C,color:"#60a5fa"},{id:"concepts",label:"Concepts",icon:R,color:"#818cf8"},{id:"thinking",label:"Thinking",icon:w,color:"#f59e0b"},{id:"tricks",label:"Tricks & Pitfalls",icon:D,color:"#ef4444"}];function L({topic:s,isLight:i}){const r=k[s.id];return r?e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:r.sections.map((t,o)=>e.jsxs("div",{style:{background:i?"rgba(0,0,0,0.02)":"rgba(255,255,255,0.03)",border:`1px solid ${i?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.08)"}`,borderRadius:"14px",padding:"24px"},children:[e.jsx("h3",{style:{color:i?"#1e293b":"#fff",fontSize:"18px",marginBottom:"16px",fontWeight:600},children:t.title}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"10px",marginBottom:t.visual?"20px":0},children:t.steps.map((l,a)=>e.jsxs("div",{style:{display:"flex",gap:"10px",alignItems:"flex-start"},children:[e.jsxs("span",{style:{color:"#60a5fa",fontWeight:700,fontSize:"14px",minWidth:"22px"},children:[a+1,"."]}),e.jsx("span",{style:{color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.6"},children:l})]},a))}),t.visual&&e.jsx("div",{style:{background:i?"#f1f5f9":"#0a0a0a",border:`1px solid ${i?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.1)"}`,borderRadius:"10px",padding:"20px",overflow:"auto"},children:e.jsx("pre",{style:{color:i?"#334155":"#d4d4d8",fontFamily:'"Fira Code", "JetBrains Mono", monospace',fontSize:"12px",lineHeight:"1.5",margin:0,whiteSpace:"pre"},children:t.visual})}),t.code&&e.jsx("div",{style:{marginTop:"16px"},children:e.jsxs("div",{style:{background:i?"#f8fafc":"#111",border:`1px solid ${i?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.1)"}`,borderRadius:"10px",overflow:"hidden"},children:[e.jsxs("div",{style:{padding:"10px 16px",borderBottom:`1px solid ${i?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.08)"}`,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{color:"#60a5fa",fontSize:"12px",fontWeight:600},children:t.code.title}),e.jsx("span",{style:{color:"var(--zinc-600)",fontSize:"11px"},children:t.code.language})]}),e.jsx("pre",{style:{padding:"16px",color:i?"#334155":"#d4d4d8",fontFamily:'"Fira Code", "JetBrains Mono", monospace',fontSize:"12px",lineHeight:"1.6",margin:0,overflow:"auto"},children:t.code.code})]})})]},o))}):e.jsx("div",{style:{color:"var(--zinc-500)",padding:"32px",textAlign:"center"},children:"Theory content coming soon for this topic."})}function O({topic:s,isLight:i}){const[r,t]=d.useState(0);return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[s.concepts.map((o,l)=>e.jsxs("div",{style:{background:i?"rgba(0,0,0,0.02)":"rgba(255,255,255,0.03)",border:`1px solid ${i?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.08)"}`,borderRadius:"14px",overflow:"hidden"},children:[e.jsxs("button",{onClick:()=>t(r===l?-1:l),style:{width:"100%",padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",background:"transparent",border:"none"},children:[e.jsx("span",{style:{color:s.color,fontWeight:700,fontSize:"16px"},children:o.title}),e.jsx("span",{style:{marginLeft:"auto",color:"var(--zinc-500)"},children:r===l?e.jsx(f,{size:18}):e.jsx(v,{size:18})})]}),r===l&&e.jsx("div",{style:{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:"8px"},children:o.points.map((a,p)=>e.jsxs("div",{style:{display:"flex",gap:"10px",alignItems:"flex-start"},children:[e.jsx("span",{style:{color:s.color,fontSize:"8px",marginTop:"7px"},children:"●"}),e.jsx("span",{style:{color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.6"},children:a})]},p))})]},l)),s.invariants&&s.invariants.length>0&&e.jsxs("div",{style:{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"14px",padding:"20px",marginTop:"8px"},children:[e.jsx("h4",{style:{color:"#fbbf24",fontSize:"15px",fontWeight:600,marginBottom:"12px"},children:"🔑 Key Invariants"}),s.invariants.map((o,l)=>e.jsxs("div",{style:{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:"8px"},children:[e.jsx("span",{style:{color:"#fbbf24",fontSize:"8px",marginTop:"7px"},children:"◆"}),e.jsx("span",{style:{color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.5"},children:o})]},l))]})]})}function N({topic:s,isLight:i}){return e.jsx("div",{children:e.jsxs("div",{style:{background:i?"rgba(0,0,0,0.02)":"rgba(255,255,255,0.03)",border:`1px solid ${i?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.08)"}`,borderRadius:"14px",overflow:"hidden"},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`1px solid ${i?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.08)"}`},children:[e.jsx("div",{style:{padding:"14px 20px",fontWeight:700,color:"#f59e0b",fontSize:"13px"},children:"WHEN YOU SEE…"}),e.jsx("div",{style:{padding:"14px 20px",fontWeight:700,color:"#10b981",fontSize:"13px"},children:"THINK…"})]}),s.thinkingFramework.map((r,t)=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:t<s.thinkingFramework.length-1?`1px solid ${i?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.05)"}`:"none"},children:[e.jsx("div",{style:{padding:"14px 20px",color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.5",borderRight:`1px solid ${i?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.05)"}`},children:r.condition}),e.jsx("div",{style:{padding:"14px 20px",color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.5"},children:r.action})]},t))]})})}function B({topic:s,isLight:i}){return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[s.tricks&&s.tricks.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("h3",{style:{color:"#10b981",fontSize:"16px",fontWeight:600,marginBottom:"4px"},children:"💡 Pro Tips"}),s.tricks.map((r,t)=>e.jsxs("div",{style:{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"14px",padding:"20px"},children:[e.jsx("div",{style:{color:"#10b981",fontWeight:700,fontSize:"15px",marginBottom:"8px"},children:r.name}),e.jsx("p",{style:{color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.6",margin:"0 0 8px 0"},children:r.tip}),e.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap",fontSize:"12px"},children:[e.jsxs("span",{style:{color:"#34d399"},children:["✓ Use when: ",r.when]}),r.avoid&&r.avoid!=="N/A"&&e.jsxs("span",{style:{color:"#f87171"},children:["✗ Avoid: ",r.avoid]})]})]},t))]}),s.pitfalls&&s.pitfalls.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("h3",{style:{color:"#ef4444",fontSize:"16px",fontWeight:600,marginTop:"12px",marginBottom:"4px"},children:"⚠️ Common Pitfalls"}),e.jsx("div",{style:{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"14px",padding:"20px"},children:s.pitfalls.map((r,t)=>e.jsxs("div",{style:{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:t<s.pitfalls.length-1?"12px":0},children:[e.jsx("span",{style:{color:"#ef4444",fontSize:"14px"},children:"✗"}),e.jsx("span",{style:{color:"var(--zinc-300)",fontSize:"14px",lineHeight:"1.5"},children:r})]},t))})]}),s.keyDesigns&&s.keyDesigns.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("h3",{style:{color:"#818cf8",fontSize:"16px",fontWeight:600,marginTop:"12px",marginBottom:"4px"},children:"🎯 Practice Designs"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:"12px"},children:s.keyDesigns.map((r,t)=>e.jsxs("div",{style:{background:"rgba(129,140,248,0.06)",border:"1px solid rgba(129,140,248,0.2)",borderRadius:"12px",padding:"16px"},children:[e.jsx("div",{style:{color:i?"#1e293b":"#fff",fontWeight:600,fontSize:"14px",marginBottom:"6px"},children:r.title}),e.jsxs("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"},children:[e.jsx("span",{style:{fontSize:"11px",padding:"2px 8px",borderRadius:"6px",background:r.difficulty==="Easy"?"rgba(52,211,153,0.15)":r.difficulty==="Medium"?"rgba(251,191,36,0.15)":"rgba(239,68,68,0.15)",color:r.difficulty==="Easy"?"#34d399":r.difficulty==="Medium"?"#fbbf24":"#f87171"},children:r.difficulty}),e.jsx("span",{style:{color:"var(--zinc-500)",fontSize:"12px"},children:r.focus})]})]},t))})]})]})}function Q(){const{topicId:s}=S(),i=y(),{theme:r}=E(),t=r==="light",[o,l]=d.useState("theory"),a=d.useMemo(()=>x.find(n=>n.id===s),[s]),p=d.useMemo(()=>T(s),[s]);if(!a)return e.jsxs("div",{style:{maxWidth:"900px",margin:"0 auto",padding:"80px 20px",textAlign:"center"},children:[e.jsx("h2",{style:{color:t?"#1e293b":"#fff"},children:"Topic not found"}),e.jsx("button",{onClick:()=>i("/system-design"),style:{color:"#60a5fa",background:"none",border:"none",cursor:"pointer",fontSize:"16px",marginTop:"16px"},children:"← Back to System Design Path"})]});const m=n=>{A(s,n,!0),window.location.reload()},u={theory:"theoryDone",concepts:"conceptsDone",thinking:"thinkingDone",tricks:"tricksDone"}[o],h=p[u];return e.jsxs("div",{style:{maxWidth:"900px",margin:"0 auto",padding:"32px 20px 80px"},children:[e.jsxs("button",{onClick:()=>i("/system-design"),style:{display:"flex",alignItems:"center",gap:"8px",color:"var(--zinc-400)",background:"none",border:"none",cursor:"pointer",fontSize:"14px",marginBottom:"20px",padding:0},children:[e.jsx(b,{size:18})," Back to System Design"]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"14px",marginBottom:"8px"},children:[e.jsx("span",{style:{fontSize:"32px"},children:a.icon}),e.jsx("h1",{style:{color:t?"#1e293b":"#fff",fontSize:"26px",fontWeight:700,margin:0},children:a.title})]}),e.jsx("p",{style:{color:"var(--zinc-400)",fontSize:"14px",marginBottom:"28px"},children:a.description}),e.jsx("div",{style:{display:"flex",gap:"6px",marginBottom:"24px",overflowX:"auto",paddingBottom:"4px"},children:P.map(n=>{const g=n.icon,c=o===n.id;return e.jsxs("button",{onClick:()=>l(n.id),style:{display:"flex",alignItems:"center",gap:"6px",padding:"10px 16px",borderRadius:"10px",cursor:"pointer",background:c?`${n.color}18`:"transparent",border:`1px solid ${c?`${n.color}44`:t?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.06)"}`,color:c?n.color:"var(--zinc-400)",fontSize:"13px",fontWeight:c?600:400,whiteSpace:"nowrap",transition:"all 0.2s"},children:[e.jsx(g,{size:15})," ",n.label]},n.id)})}),o==="theory"&&e.jsx(L,{topic:a,isLight:t}),o==="concepts"&&e.jsx(O,{topic:a,isLight:t}),o==="thinking"&&e.jsx(N,{topic:a,isLight:t}),o==="tricks"&&e.jsx(B,{topic:a,isLight:t}),u&&e.jsx("div",{style:{marginTop:"28px",textAlign:"center"},children:h?e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:"8px",padding:"12px 24px",borderRadius:"10px",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",fontWeight:600,fontSize:"14px"},children:[e.jsx(I,{size:18})," Section completed!"]}):e.jsx("button",{onClick:()=>m(u),style:{padding:"12px 28px",borderRadius:"10px",background:`${a.color}22`,border:`1px solid ${a.color}55`,color:a.color,cursor:"pointer",fontWeight:600,fontSize:"14px",transition:"all 0.2s"},children:"✓ Mark as Complete"})})]})}export{Q as default};
