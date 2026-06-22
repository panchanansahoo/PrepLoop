// SQL Learning Path Data — 14 Topics across 7 Stages
export const SQL_STAGES = [
  { id: 'basics', name: 'Stage 1: SQL & RDBMS Basics', color: '#818cf8', icon: '🧱' },
  { id: 'ddl', name: 'Stage 2: Data Definition & Modeling', color: '#34d399', icon: '🏗️' },
  { id: 'querying', name: 'Stage 3: Basic Querying', color: '#22d3ee', icon: '🔍' },
  { id: 'joins', name: 'Stage 4: Joins', color: '#f59e0b', icon: '🔗' },
  { id: 'grouping', name: 'Stage 5: Grouping & Aggregations', color: '#f472b6', icon: '📊' },
  { id: 'subqueries', name: 'Stage 6: Subqueries & CTEs', color: '#8b5cf6', icon: '🔄' },
  { id: 'advanced', name: 'Stage 7: Advanced SQL', color: '#ef4444', icon: '🚀' },
];

export const SQL_TOPICS = [
  // ═══════════════ STAGE 1: BASICS ═══════════════
  {
    id: 'sql-rdbms-intro', title: 'SQL & RDBMS Introduction', stage: 'basics',
    icon: '📚', color: '#818cf8', difficulty: 'Beginner', estimatedTime: '1–2 hours',
    description: 'What is SQL, what is an RDBMS, popular engines, SQL dialects, and sublanguages (DDL/DML/DCL/TCL).',
    concepts: [
      { title: 'What is SQL?', points: ['Structured Query Language — standard for relational databases', 'Declarative: you say WHAT you want, not HOW to get it', 'Engine decides execution plan (optimizer)', 'Used for querying, updating, creating, and managing data'] },
      { title: 'RDBMS Engines', points: ['MySQL: open-source, widely used in web apps', 'PostgreSQL: advanced features, JSONB, extensions', 'SQL Server: Microsoft ecosystem, T-SQL dialect', 'SQLite: embedded, file-based, great for mobile/local', 'Oracle: enterprise, PL/SQL, large-scale systems'] },
      { title: 'SQL Sublanguages', points: ['DDL (Data Definition): CREATE, ALTER, DROP, TRUNCATE', 'DML (Data Manipulation): SELECT, INSERT, UPDATE, DELETE', 'DCL (Data Control): GRANT, REVOKE', 'TCL (Transaction Control): BEGIN, COMMIT, ROLLBACK, SAVEPOINT'] },
    ],
    invariants: ['SQL is case-insensitive for keywords (SELECT = select)', 'Table = relation, Row = tuple, Column = attribute', 'Every table should have a primary key for unique identification'],
    thinkingFramework: [
      { condition: 'Need to retrieve data', action: 'SELECT (DML)' },
      { condition: 'Need to create/modify table structure', action: 'CREATE/ALTER (DDL)' },
      { condition: 'Need to control access', action: 'GRANT/REVOKE (DCL)' },
      { condition: 'Need atomic operations', action: 'BEGIN/COMMIT/ROLLBACK (TCL)' },
    ],
    tricks: [
      { name: 'Dialect Awareness', tip: 'LIMIT (MySQL/Postgres) vs TOP (SQL Server) vs FETCH FIRST (Oracle/standard SQL)', when: 'Writing portable SQL', avoid: 'N/A' },
    ],
    pitfalls: ['Assuming all SQL dialects are identical', 'Confusing DDL (structure) with DML (data)', 'Forgetting that TRUNCATE is DDL (auto-commits), not DML'],
    practiceProblems: []
  },
  // ═══════════════ STAGE 2: DATA DEFINITION ═══════════════
  {
    id: 'data-types-constraints', title: 'Data Types & Constraints', stage: 'ddl',
    icon: '🏗️', color: '#34d399', difficulty: 'Beginner', estimatedTime: '2 hours',
    description: 'Numeric, string, date/time, boolean types. NULL vs empty. PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK, DEFAULT.',
    concepts: [
      { title: 'Data Types', points: ['Numeric: INT, BIGINT, DECIMAL(p,s), FLOAT, DOUBLE', 'String: VARCHAR(n), CHAR(n), TEXT', 'Date/Time: DATE, TIME, TIMESTAMP, INTERVAL', 'Boolean: BOOLEAN (TRUE/FALSE/NULL)', 'NULL: absence of value, not same as 0 or empty string'] },
      { title: 'Constraints', points: ['PRIMARY KEY: uniquely identifies each row (NOT NULL + UNIQUE)', 'FOREIGN KEY: references another table\'s primary key → referential integrity', 'UNIQUE: no duplicate values in column', 'NOT NULL: column cannot store NULL', 'CHECK: validates data against a condition', 'DEFAULT: provides fallback value when none specified'] },
    ],
    invariants: ['NULL ≠ 0 ≠ empty string; NULL = unknown', 'NULL compared with anything = NULL (use IS NULL, not = NULL)', 'Primary key = NOT NULL + UNIQUE (implicitly)'],
    thinkingFramework: [
      { condition: 'Need unique row identifier', action: 'PRIMARY KEY (auto-increment or UUID)' },
      { condition: 'Column references another table', action: 'FOREIGN KEY with ON DELETE/UPDATE action' },
      { condition: 'Prevent invalid data', action: 'CHECK constraint' },
      { condition: 'Optional vs required field', action: 'Allow NULL vs NOT NULL' },
    ],
    tricks: [
      { name: 'VARCHAR vs TEXT', tip: 'VARCHAR(n) enforces max length; TEXT is unbounded. Use VARCHAR when you know the max.', when: 'Schema design', avoid: 'N/A' },
    ],
    pitfalls: ['Using = NULL instead of IS NULL', 'Choosing too-small column types (INT vs BIGINT)', 'Forgetting ON DELETE CASCADE on foreign keys → orphan rows'],
    practiceProblems: []
  },
  {
    id: 'normalization', title: 'Normalization (1NF–BCNF)', stage: 'ddl',
    icon: '📐', color: '#10b981', difficulty: 'Beginner–Medium', estimatedTime: '2 hours',
    description: 'Normal forms: 1NF, 2NF, 3NF, BCNF. Why normalize? Trade-offs with denormalization.',
    concepts: [
      { title: 'Normal Forms', points: ['1NF: no repeating groups, each cell has atomic value', '2NF: 1NF + no partial dependencies (every non-key depends on FULL primary key)', '3NF: 2NF + no transitive dependencies (non-key depends only on key, not other non-keys)', 'BCNF: every determinant is a candidate key'] },
      { title: 'Why Normalize?', points: ['Eliminate data redundancy', 'Prevent update/insert/delete anomalies', 'Ensure data integrity', 'Trade-off: more joins needed = slightly slower reads'] },
    ],
    invariants: ['1NF → 2NF → 3NF → BCNF (each builds on previous)', 'Denormalization = intentionally breaking normal forms for read performance', '3NF is sufficient for most applications'],
    thinkingFramework: [
      { condition: 'Repeating groups in one cell', action: 'Violates 1NF → split into rows' },
      { condition: 'Attribute depends on PART of composite key', action: 'Violates 2NF → separate table' },
      { condition: 'Non-key depends on another non-key', action: 'Violates 3NF → extract to new table' },
    ],
    tricks: [],
    pitfalls: ['Over-normalizing → too many joins', 'Under-normalizing → data anomalies', 'Forgetting that normalization is about design, not performance'],
    practiceProblems: []
  },
  // ═══════════════ STAGE 3: BASIC QUERYING ═══════════════
  {
    id: 'select-basics', title: 'SELECT, WHERE, ORDER BY', stage: 'querying',
    icon: '🔍', color: '#22d3ee', difficulty: 'Beginner', estimatedTime: '2 hours',
    description: 'SELECT list, FROM, WHERE filtering, ORDER BY sorting, LIMIT/OFFSET pagination.',
    concepts: [
      { title: 'SELECT Basics', points: ['SELECT columns FROM table — retrieves data', 'SELECT * — all columns (avoid in production)', 'WHERE — filters rows based on condition', 'ORDER BY — sorts results (ASC default, DESC)', 'LIMIT n OFFSET m — pagination'] },
      { title: 'Filtering Operators', points: ['Comparison: =, !=, <, >, <=, >=', 'Logical: AND, OR, NOT', 'IN (list) — matches any value in list', 'BETWEEN a AND b — inclusive range', 'LIKE pattern — wildcard matching (% = any chars, _ = one char)', 'IS NULL / IS NOT NULL — null checks'] },
    ],
    invariants: ['WHERE filters BEFORE grouping (GROUP BY)', 'ORDER BY is the LAST clause executed', 'LIMIT without ORDER BY gives unpredictable results', 'SQL execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT'],
    thinkingFramework: [
      { condition: 'Need specific rows', action: 'WHERE with conditions' },
      { condition: 'Need sorted output', action: 'ORDER BY column ASC/DESC' },
      { condition: 'Need first N rows', action: 'ORDER BY + LIMIT N' },
      { condition: 'Pattern matching', action: 'LIKE with % and _ wildcards' },
    ],
    tricks: [
      { name: 'Execution Order', tip: 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Knowing this explains many errors!', when: 'Debugging queries', avoid: 'N/A' },
    ],
    pitfalls: ['Using WHERE with aggregate (use HAVING)', 'NULL comparisons with = instead of IS NULL', 'LIMIT without ORDER BY'],
    practiceProblems: [
      { id: 'sql-select-all', title: 'Select All Employees', difficulty: 'Easy', pattern: 'Basic SELECT' },
      { id: 'sql-filter-where', title: 'Filter with WHERE', difficulty: 'Easy', pattern: 'WHERE clause' },
    ]
  },
  {
    id: 'aggregate-functions', title: 'Aggregate Functions', stage: 'querying',
    icon: '📊', color: '#06b6d4', difficulty: 'Beginner', estimatedTime: '1–2 hours',
    description: 'COUNT, SUM, AVG, MIN, MAX. String and date functions.',
    concepts: [
      { title: 'Aggregate Functions', points: ['COUNT(*) — counts all rows; COUNT(col) — counts non-NULL', 'SUM(col) — total of numeric column', 'AVG(col) — average (ignores NULLs)', 'MIN(col), MAX(col) — smallest/largest value', 'DISTINCT inside aggregate: COUNT(DISTINCT col)'] },
      { title: 'Common Functions', points: ['String: UPPER, LOWER, CONCAT, SUBSTRING, LENGTH, TRIM', 'Date: CURRENT_DATE, DATE_PART, EXTRACT, DATE_DIFF, DATE_ADD', 'Math: ROUND, CEIL, FLOOR, ABS, MOD', 'Null handling: COALESCE(col, default), NULLIF(a, b)'] },
    ],
    invariants: ['Aggregates ignore NULL values (except COUNT(*))', 'Cannot use aggregate in WHERE — use HAVING', 'COALESCE returns first non-NULL argument'],
    thinkingFramework: [
      { condition: 'Count rows', action: 'COUNT(*) or COUNT(column)' },
      { condition: 'Total a numeric column', action: 'SUM(col)' },
      { condition: 'Handle NULLs in output', action: 'COALESCE(col, fallback)' },
    ],
    tricks: [
      { name: 'COUNT(*) vs COUNT(col)', tip: 'COUNT(*) counts all rows including NULLs; COUNT(col) excludes NULL values in that column', when: 'Always be explicit about which you need', avoid: 'N/A' },
    ],
    pitfalls: ['AVG ignoring NULLs can give misleading results', 'Mixing aggregate and non-aggregate in SELECT without GROUP BY'],
    practiceProblems: []
  },
  // ═══════════════ STAGE 4: JOINS ═══════════════
  {
    id: 'inner-join', title: 'INNER JOIN', stage: 'joins',
    icon: '🔗', color: '#f59e0b', difficulty: 'Beginner–Medium', estimatedTime: '2 hours',
    description: 'INNER JOIN returns only matching rows from both tables. The most common join type.',
    concepts: [
      { title: 'INNER JOIN', points: ['Returns rows that have matching values in BOTH tables', 'Syntax: SELECT ... FROM A INNER JOIN B ON A.key = B.key', 'Non-matching rows are excluded from result', 'Equivalent to the intersection in a Venn diagram'] },
      { title: 'Join Conditions', points: ['ON clause specifies the join condition', 'Can join on multiple columns: ON A.x = B.x AND A.y = B.y', 'WHERE vs ON: ON is evaluated during join; WHERE filters after join', 'Join order: optimizer decides, but explicit order helps readability'] },
    ],
    invariants: ['INNER JOIN = only matching rows from both sides', 'If no match found, row is excluded entirely', 'A INNER JOIN B = B INNER JOIN A (commutative)'],
    thinkingFramework: [
      { condition: 'Need data from two tables with matching keys', action: 'INNER JOIN' },
      { condition: 'Need ALL rows from one side', action: 'Use LEFT/RIGHT JOIN instead' },
    ],
    tricks: [],
    pitfalls: ['Duplicate rows from many-to-many relationships', 'Forgetting JOIN condition → cross join (cartesian product)', 'Ambiguous column names without table alias'],
    practiceProblems: [
      { id: 'sql-inner-join-basic', title: 'Employees with Departments', difficulty: 'Easy', pattern: 'INNER JOIN' },
    ]
  },
  {
    id: 'outer-joins', title: 'LEFT, RIGHT & FULL OUTER JOIN', stage: 'joins',
    icon: '↔️', color: '#fb923c', difficulty: 'Medium', estimatedTime: '2–3 hours',
    description: 'LEFT JOIN keeps all left rows, RIGHT JOIN keeps all right rows, FULL OUTER keeps all. Venn diagram logic.',
    concepts: [
      { title: 'Outer Joins', points: ['LEFT JOIN: all rows from LEFT table + matching from right (NULLs for non-matches)', 'RIGHT JOIN: all rows from RIGHT table + matching from left', 'FULL OUTER JOIN: all rows from BOTH (NULLs where no match)', 'Use LEFT JOIN most often — common for "include even if no match"'] },
      { title: 'CROSS JOIN & SELF JOIN', points: ['CROSS JOIN: cartesian product, every row-pair combination', 'SELF JOIN: join a table to itself (e.g., employee → manager)', 'Both are useful in specific scenarios but rare in basic queries'] },
    ],
    invariants: ['LEFT JOIN: left table row count ≥ result ≥ inner join count', 'FULL OUTER JOIN: UNION of LEFT and RIGHT join results', 'CROSS JOIN result size = |A| × |B|'],
    thinkingFramework: [
      { condition: 'Include rows with no match from left table', action: 'LEFT JOIN' },
      { condition: 'Find rows with NO match (anti-join)', action: 'LEFT JOIN ... WHERE right.key IS NULL' },
      { condition: 'Employee-manager hierarchy', action: 'SELF JOIN' },
      { condition: 'Generate all combinations', action: 'CROSS JOIN' },
    ],
    tricks: [
      { name: 'Anti-Join Pattern', tip: 'LEFT JOIN + WHERE B.key IS NULL finds rows in A with no match in B', when: 'Finding "missing" or "unmatched" records', avoid: 'N/A' },
    ],
    pitfalls: ['Putting filter condition in WHERE instead of ON for outer joins → converts to inner join', 'FULL OUTER JOIN not supported in all engines (MySQL)'],
    practiceProblems: [
      { id: 'sql-left-join', title: 'Customers Without Orders', difficulty: 'Easy', pattern: 'LEFT JOIN + IS NULL' },
    ]
  },
  // ═══════════════ STAGE 5: GROUPING ═══════════════
  {
    id: 'group-by-having', title: 'GROUP BY & HAVING', stage: 'grouping',
    icon: '📊', color: '#f472b6', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'GROUP BY rules, group-wise aggregates, HAVING vs WHERE, ROLLUP/CUBE basics.',
    concepts: [
      { title: 'GROUP BY', points: ['Groups rows that have same values in specified columns', 'Every column in SELECT must be in GROUP BY or an aggregate', 'Use with COUNT, SUM, AVG, MIN, MAX for per-group statistics', 'Multiple columns: GROUP BY col1, col2 → nested grouping'] },
      { title: 'HAVING vs WHERE', points: ['WHERE: filters rows BEFORE grouping', 'HAVING: filters groups AFTER aggregation', 'HAVING can reference aggregate functions; WHERE cannot', 'Example: HAVING COUNT(*) > 5 → only groups with 6+ rows'] },
      { title: 'ROLLUP & CUBE', points: ['ROLLUP: generates subtotals from left to right (hierarchical)', 'CUBE: generates subtotals for ALL combinations', 'Both add extra summary rows with NULLs for aggregated dimensions', 'Advanced analytics — know concept for interviews'] },
    ],
    invariants: ['Execution: WHERE → GROUP BY → HAVING → SELECT', 'SELECT columns must be in GROUP BY or aggregated', 'HAVING without GROUP BY treats entire table as one group'],
    thinkingFramework: [
      { condition: 'Need per-category statistics', action: 'GROUP BY category + aggregate' },
      { condition: 'Filter on aggregate result', action: 'HAVING (not WHERE)' },
      { condition: 'Need subtotals', action: 'GROUP BY ... WITH ROLLUP' },
    ],
    tricks: [
      { name: 'Count Per Group', tip: 'SELECT category, COUNT(*) FROM t GROUP BY category — basic frequency count', when: 'Any "how many per X" question', avoid: 'N/A' },
    ],
    pitfalls: ['Using WHERE instead of HAVING for aggregate conditions', 'Selecting non-grouped, non-aggregated columns', 'Forgetting NULLs form their own group'],
    practiceProblems: [
      { id: 'sql-group-by', title: 'Count by Department', difficulty: 'Easy', pattern: 'GROUP BY + COUNT' },
      { id: 'sql-having', title: 'Departments with 5+ Employees', difficulty: 'Medium', pattern: 'HAVING' },
    ]
  },
  // ═══════════════ STAGE 6: SUBQUERIES & CTEs ═══════════════
  {
    id: 'subqueries', title: 'Subqueries & CTEs', stage: 'subqueries',
    icon: '🔄', color: '#8b5cf6', difficulty: 'Medium', estimatedTime: '3 hours',
    description: 'Scalar, row, table subqueries. Correlated vs non-correlated. CTE syntax, recursive CTEs.',
    concepts: [
      { title: 'Subquery Types', points: ['Scalar: returns single value — use in SELECT or WHERE', 'Row: returns one row — compare with row constructors', 'Table: returns multiple rows — use with IN, EXISTS, or FROM', 'Correlated: references outer query — re-executed per outer row (slower)'] },
      { title: 'IN vs EXISTS', points: ['IN: checks if value is in subquery result set', 'EXISTS: checks if subquery returns ANY rows (boolean)', 'EXISTS is often faster for correlated subqueries', 'NOT IN with NULLs is dangerous — use NOT EXISTS instead'] },
      { title: 'CTEs (WITH clause)', points: ['WITH cte_name AS (SELECT ...) — named temporary result', 'Improves readability of complex queries', 'Can reference earlier CTEs (chaining)', 'Recursive CTE: WITH RECURSIVE — for hierarchies and graphs'] },
    ],
    invariants: ['Correlated subquery: O(outer × inner) — can be slow', 'NOT IN returns no rows if subquery has NULL', 'CTE scope is limited to the immediately following query'],
    thinkingFramework: [
      { condition: 'Compare against a single value', action: 'Scalar subquery' },
      { condition: '"Is value in this set?"', action: 'IN or EXISTS' },
      { condition: 'Check existence of matching rows', action: 'EXISTS (especially correlated)' },
      { condition: 'Complex multi-step query', action: 'CTE for readability' },
      { condition: 'Tree/hierarchy traversal', action: 'Recursive CTE' },
    ],
    tricks: [
      { name: 'CTE for Readability', tip: 'Break complex queries into named CTEs — much easier to debug and understand', when: 'Any query with 3+ subqueries', avoid: 'Simple one-liner queries' },
    ],
    pitfalls: ['NOT IN with NULLs returns empty result', 'Correlated subqueries can be very slow — consider JOIN', 'Recursive CTE without proper termination → infinite loop'],
    practiceProblems: [
      { id: 'sql-subquery-scalar', title: 'Above Average Salary', difficulty: 'Easy', pattern: 'Scalar Subquery' },
      { id: 'sql-cte-basic', title: 'Department Totals with CTE', difficulty: 'Medium', pattern: 'CTE' },
    ]
  },
  // ═══════════════ STAGE 7: ADVANCED ═══════════════
  {
    id: 'window-functions', title: 'Window Functions', stage: 'advanced',
    icon: '🪟', color: '#ef4444', difficulty: 'Medium–Hard', estimatedTime: '3–4 hours',
    description: 'OVER clause, PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD. Top-N per group.',
    concepts: [
      { title: 'Window Function Basics', points: ['Operates on a set of rows (window) related to current row', 'OVER() — defines the window (all rows by default)', 'PARTITION BY — divides rows into groups (like GROUP BY but keeps all rows)', 'ORDER BY inside OVER — defines row ordering within partition'] },
      { title: 'Ranking Functions', points: ['ROW_NUMBER(): sequential 1,2,3... no ties', 'RANK(): same rank for ties, gaps after (1,1,3)', 'DENSE_RANK(): same rank for ties, no gaps (1,1,2)', 'NTILE(n): divides into n roughly equal groups'] },
      { title: 'Value Functions', points: ['LAG(col, n): value from n rows BEFORE current', 'LEAD(col, n): value from n rows AFTER current', 'FIRST_VALUE / LAST_VALUE: first/last in window', 'SUM/AVG/COUNT as window functions — running totals'] },
    ],
    invariants: ['Window functions don\'t reduce row count (unlike GROUP BY)', 'ROW_NUMBER is always unique within partition', 'RANK has gaps; DENSE_RANK does not'],
    thinkingFramework: [
      { condition: '"Top N per group"', action: 'ROW_NUMBER() PARTITION BY group ORDER BY rank' },
      { condition: '"Running total"', action: 'SUM() OVER (ORDER BY date)' },
      { condition: '"Compare with previous row"', action: 'LAG(col) OVER (ORDER BY col)' },
      { condition: '"Rank within category"', action: 'RANK() PARTITION BY category ORDER BY score DESC' },
    ],
    tricks: [
      { name: 'Top-N per Group', tip: 'Use ROW_NUMBER() in a subquery/CTE, then WHERE rn <= N in outer query', when: 'Anytime you need "top 3 per department" etc.', avoid: 'N/A' },
    ],
    pitfalls: ['Cannot use window functions in WHERE — wrap in subquery/CTE', 'LAST_VALUE default window is ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW', 'Forgetting PARTITION BY → entire table is one window'],
    practiceProblems: [
      { id: 'sql-row-number', title: 'Rank Employees by Salary', difficulty: 'Medium', pattern: 'ROW_NUMBER' },
      { id: 'sql-top-n-per-group', title: 'Top 3 per Department', difficulty: 'Medium', pattern: 'Window + Subquery' },
    ]
  },
  {
    id: 'indexing-theory', title: 'Indexing & Performance', stage: 'advanced',
    icon: '⚡', color: '#f97316', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'B-tree indexes, clustered vs non-clustered, composite indexes, index scan vs table scan.',
    concepts: [
      { title: 'How Indexes Work', points: ['Index = sorted data structure (B-tree) for fast lookup', 'Without index: full table scan O(n)', 'With index: O(log n) for point lookups, efficient range scans', 'Trade-off: faster reads, slower writes (index must be updated)'] },
      { title: 'Index Types', points: ['Clustered: data rows stored in index order (1 per table)', 'Non-clustered: separate structure pointing to data rows', 'Composite: multi-column index — order matters!', 'Covering index: includes all columns needed by query → no table lookup'] },
    ],
    invariants: ['Leftmost prefix rule: composite index (a,b,c) supports queries on (a), (a,b), (a,b,c) but NOT (b,c)', 'Index helps WHERE, JOIN, ORDER BY columns', 'Too many indexes slow down INSERT/UPDATE/DELETE'],
    thinkingFramework: [
      { condition: 'Slow SELECT query', action: 'Add index on WHERE/JOIN columns' },
      { condition: 'Composite index question', action: 'Check leftmost prefix rule' },
      { condition: 'Index helps or hurts?', action: 'Helps reads, hurts writes; check selectivity' },
    ],
    tricks: [],
    pitfalls: ['Indexing low-cardinality columns (boolean) — usually not helpful', 'Too many indexes → write performance degrades', 'Functions on indexed column prevent index use: WHERE UPPER(name) = ...'],
    practiceProblems: []
  },
  {
    id: 'transactions-acid', title: 'Transactions & ACID', stage: 'advanced',
    icon: '🔒', color: '#dc2626', difficulty: 'Medium', estimatedTime: '2 hours',
    description: 'ACID properties, isolation levels, locks, deadlocks, BEGIN/COMMIT/ROLLBACK.',
    concepts: [
      { title: 'ACID Properties', points: ['Atomicity: all-or-nothing (transaction fully completes or fully rolls back)', 'Consistency: database moves from one valid state to another', 'Isolation: concurrent transactions don\'t interfere with each other', 'Durability: committed data survives crashes (written to disk)'] },
      { title: 'Isolation Levels', points: ['Read Uncommitted: can see uncommitted changes (dirty reads)', 'Read Committed: only sees committed data (default in PostgreSQL)', 'Repeatable Read: same query returns same result within transaction', 'Serializable: strictest — transactions appear sequential'] },
      { title: 'Locks & Deadlocks', points: ['Shared lock (read): multiple readers allowed', 'Exclusive lock (write): blocks all other access', 'Deadlock: two transactions waiting for each other\'s locks', 'Prevention: consistent lock ordering, timeouts'] },
    ],
    invariants: ['Higher isolation = more consistent but slower', 'Deadlocks are detected and one transaction is rolled back', 'COMMIT makes changes permanent; ROLLBACK undoes them'],
    thinkingFramework: [
      { condition: 'Need all-or-nothing operation', action: 'Wrap in BEGIN...COMMIT/ROLLBACK' },
      { condition: 'Phantom reads are a problem', action: 'Use SERIALIZABLE isolation' },
      { condition: 'Performance is critical', action: 'Use lower isolation (Read Committed)' },
    ],
    tricks: [],
    pitfalls: ['Long-running transactions hold locks → blocking others', 'Not handling deadlocks (retry logic needed)', 'Assuming default isolation level is the same across databases'],
    practiceProblems: []
  },
  {
    id: 'views-security', title: 'Views & Access Control', stage: 'advanced',
    icon: '👁️', color: '#7c3aed', difficulty: 'Medium', estimatedTime: '1–2 hours',
    description: 'Views, materialized views, GRANT/REVOKE for access control.',
    concepts: [
      { title: 'Views', points: ['Virtual table defined by a query — no data stored', 'Simplifies complex queries — encapsulation', 'Can be used in SELECT, JOIN just like regular tables', 'Updatable views: simple views can accept INSERT/UPDATE'] },
      { title: 'Materialized Views', points: ['Stores query results physically on disk', 'Must be refreshed periodically (stale data risk)', 'Great for expensive aggregations/reports', 'Not supported in all engines (Postgres yes, MySQL no)'] },
      { title: 'Access Control', points: ['GRANT privilege ON table TO user', 'REVOKE privilege ON table FROM user', 'Privileges: SELECT, INSERT, UPDATE, DELETE, ALL', 'Role-based access: create roles, assign to users'] },
    ],
    invariants: ['View = saved query, not saved data', 'Materialized view = saved data, needs refresh', 'GRANT/REVOKE changes take effect immediately'],
    thinkingFramework: [
      { condition: 'Simplify complex repeated query', action: 'Create VIEW' },
      { condition: 'Cache expensive aggregation', action: 'Materialized VIEW with periodic refresh' },
      { condition: 'Restrict user access to certain columns', action: 'VIEW showing only allowed columns + GRANT SELECT' },
    ],
    tricks: [],
    pitfalls: ['Views with multiple joins may be slow (computed each time)', 'Materialized views can serve stale data', 'Granting too broad permissions (ALL instead of specific)'],
    practiceProblems: []
  },
];

export const getSQLTopicIds = () => SQL_TOPICS.map(t => t.id);
export const getSQLTopicsByStage = (stageId) => SQL_TOPICS.filter(t => t.stage === stageId);
