// SQL Theory Data — detailed theory sections for each SQL topic
export const sqlTheoryData = {

'sql-rdbms-intro': {
  sections: [
    {
      title: '📖 What is SQL & RDBMS?',
      steps: [
        'SQL (Structured Query Language) is the standard language for relational databases.',
        'It is DECLARATIVE — you tell the database WHAT you want, not HOW to get it.',
        'An RDBMS stores data in tables (rows and columns), enforcing structure and integrity.',
        'Key engines: MySQL, PostgreSQL, SQL Server, SQLite, Oracle — each with slight dialect differences.',
      ],
      visual: `SQL Sublanguages:
┌─────────────────────────────────────────────────┐
│                    SQL                          │
├────────────┬────────────┬───────────┬───────────┤
│    DDL     │    DML     │   DCL     │   TCL     │
│ CREATE     │ SELECT     │ GRANT     │ BEGIN     │
│ ALTER      │ INSERT     │ REVOKE    │ COMMIT    │
│ DROP       │ UPDATE     │           │ ROLLBACK  │
│ TRUNCATE   │ DELETE     │           │ SAVEPOINT │
└────────────┴────────────┴───────────┴───────────┘

Table structure:
┌────┬──────────┬─────────┬────────┐
│ id │  name    │  email  │ dept_id│
├────┼──────────┼─────────┼────────┤
│  1 │ Alice    │ a@x.com │   10   │  ← row (tuple)
│  2 │ Bob      │ b@x.com │   20   │
│  3 │ Charlie  │ c@x.com │   10   │
└────┴──────────┴─────────┴────────┘
  ↑ columns (attributes)`,
    },
  ]
},

'data-types-constraints': {
  sections: [
    {
      title: '📖 Data Types & NULL',
      steps: [
        'Choose the right type: INT for counts, DECIMAL for money, VARCHAR for variable text.',
        'NULL means "unknown" — it is NOT zero, empty string, or false.',
        'Any comparison with NULL returns NULL (falsy). Use IS NULL / IS NOT NULL.',
        'COALESCE(col, default) returns first non-NULL value.',
      ],
      visual: `Common Data Types:
┌─────────────┬──────────────────────────────┐
│ Category    │ Types                        │
├─────────────┼──────────────────────────────┤
│ Numeric     │ INT, BIGINT, DECIMAL(10,2)   │
│ String      │ VARCHAR(255), CHAR(10), TEXT  │
│ Date/Time   │ DATE, TIMESTAMP              │
│ Boolean     │ BOOLEAN (TRUE/FALSE/NULL)    │
└─────────────┴──────────────────────────────┘

NULL behavior:
  NULL = 1     → NULL (not FALSE!)
  NULL = NULL  → NULL
  NULL + 5     → NULL
  IS NULL      → TRUE  ✓ (correct way!)`,
      code: {
        language: 'sql',
        title: 'CREATE TABLE with Constraints',
        code: `CREATE TABLE employees (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  salary      DECIMAL(10, 2) CHECK (salary > 0),
  dept_id     INT,
  hire_date   DATE DEFAULT CURRENT_DATE,
  FOREIGN KEY (dept_id) REFERENCES departments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);`
      }
    },
  ]
},

'normalization': {
  sections: [
    {
      title: '📖 Database Normalization',
      steps: [
        '1NF: every cell has one atomic value. No arrays/lists in a single column.',
        '2NF: no partial dependency — every non-key column depends on the FULL primary key.',
        '3NF: no transitive dependency — non-key columns depend only on the key, not on each other.',
        'Denormalization: intentionally break rules for read performance (e.g., adding redundant columns).',
      ],
      visual: `Unnormalized (violates 1NF):
┌────┬──────┬───────────────────┐
│ id │ name │ phone_numbers     │
├────┼──────┼───────────────────┤
│  1 │ Ali  │ 111-222, 333-444  │  ← multiple values!
└────┴──────┴───────────────────┘

1NF fix — separate rows:
┌────┬──────┬──────────┐
│ id │ name │ phone    │
├────┼──────┼──────────┤
│  1 │ Ali  │ 111-222  │
│  1 │ Ali  │ 333-444  │
└────┴──────┴──────────┘

Or even better — separate table:
phones(id, person_id FK, number)`,
    },
  ]
},

'select-basics': {
  sections: [
    {
      title: '📖 SQL Execution Order',
      steps: [
        'SQL does NOT execute in the order you write it. The logical order is:',
        '1. FROM (which tables) → 2. WHERE (filter rows) → 3. GROUP BY → 4. HAVING → 5. SELECT → 6. ORDER BY → 7. LIMIT',
        'This is why you can\'t use a column alias from SELECT in WHERE — WHERE runs before SELECT!',
        'Understanding this order solves 90% of "why doesn\'t this work" questions.',
      ],
      visual: `Written order:       Execution order:
  SELECT               1. FROM
  FROM                 2. WHERE
  WHERE                3. GROUP BY
  GROUP BY             4. HAVING
  HAVING               5. SELECT
  ORDER BY             6. ORDER BY
  LIMIT                7. LIMIT

Example:
  SELECT dept, COUNT(*) AS cnt    -- 5th
  FROM employees                   -- 1st
  WHERE salary > 50000             -- 2nd
  GROUP BY dept                    -- 3rd
  HAVING COUNT(*) > 3              -- 4th
  ORDER BY cnt DESC                -- 6th
  LIMIT 5;                         -- 7th`,
      code: {
        language: 'sql',
        title: 'SELECT with Filtering & Sorting',
        code: `-- Basic SELECT with WHERE, ORDER BY, LIMIT
SELECT name, salary, department
FROM employees
WHERE salary > 50000
  AND department IN ('Engineering', 'Product')
  AND name LIKE 'A%'        -- starts with A
ORDER BY salary DESC
LIMIT 10;

-- BETWEEN for ranges
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';

-- NULL handling
SELECT name, COALESCE(phone, 'N/A') AS phone
FROM customers
WHERE email IS NOT NULL;`
      }
    },
  ]
},

'aggregate-functions': {
  sections: [
    {
      title: '📖 Aggregate Functions',
      steps: [
        'COUNT(*) counts all rows. COUNT(col) counts non-NULL values only.',
        'SUM, AVG, MIN, MAX all ignore NULL values.',
        'Use DISTINCT inside: COUNT(DISTINCT category) for unique counts.',
        'Cannot use aggregates in WHERE — use HAVING instead.',
      ],
      visual: `Table: orders
┌────┬────────┬────────┐
│ id │ amount │ region │
├────┼────────┼────────┤
│  1 │   100  │ East   │
│  2 │   200  │ West   │
│  3 │   NULL │ East   │
│  4 │   150  │ West   │
│  5 │   300  │ East   │
└────┴────────┴────────┘

COUNT(*) = 5        (all rows)
COUNT(amount) = 4   (non-NULL only)
SUM(amount) = 750   (ignores NULL)
AVG(amount) = 187.5 (750 / 4, not /5!)`,
      code: {
        language: 'sql',
        title: 'Aggregate Functions',
        code: `-- Basic aggregates
SELECT
  COUNT(*) AS total_orders,
  COUNT(DISTINCT customer_id) AS unique_customers,
  SUM(amount) AS total_revenue,
  AVG(amount) AS avg_order_value,
  MIN(amount) AS smallest_order,
  MAX(amount) AS largest_order
FROM orders
WHERE order_date >= '2024-01-01';

-- String functions
SELECT UPPER(name), LENGTH(email), CONCAT(first, ' ', last)
FROM users;`
      }
    },
  ]
},

'inner-join': {
  sections: [
    {
      title: '📖 INNER JOIN — Only Matching Rows',
      steps: [
        'INNER JOIN returns rows where the join condition matches in BOTH tables.',
        'If a row in table A has no match in table B, it is excluded entirely.',
        'Always use table aliases for readability: FROM employees e JOIN departments d.',
        'Think of it as the INTERSECTION in a Venn diagram.',
      ],
      visual: `employees:              departments:
┌────┬───────┬─────┐    ┌─────┬───────────┐
│ id │ name  │did  │    │ id  │ dept_name  │
├────┼───────┼─────┤    ├─────┼───────────┤
│  1 │ Alice │  10 │    │  10 │ Engineering│
│  2 │ Bob   │  20 │    │  20 │ Marketing │
│  3 │ Carol │  30 │    │  40 │ Legal     │  ← no employees
│  4 │ Dave  │ NULL│    └─────┴───────────┘
└────┴───────┴─────┘
     ↑ NULL dept — no match

INNER JOIN result:
┌───────┬───────────┐
│ name  │ dept_name │
├───────┼───────────┤
│ Alice │Engineering│  ✓ matched
│ Bob   │ Marketing │  ✓ matched
└───────┴───────────┘
Carol: dept 30 not in departments → excluded
Dave: NULL dept → excluded
Legal: no employees → excluded`,
      code: {
        language: 'sql',
        title: 'INNER JOIN Examples',
        code: `-- Basic INNER JOIN
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;

-- Multi-table JOIN
SELECT o.id, c.name, p.product_name, o.quantity
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
WHERE o.order_date >= '2024-01-01';`
      }
    },
  ]
},

'outer-joins': {
  sections: [
    {
      title: '📖 LEFT JOIN & Anti-Join Pattern',
      steps: [
        'LEFT JOIN keeps ALL rows from left table, NULLs for non-matching right rows.',
        'Anti-join: LEFT JOIN + WHERE right.key IS NULL → finds "missing" relationships.',
        'RIGHT JOIN = LEFT JOIN with tables swapped (rarely used, just swap table order).',
        'FULL OUTER JOIN = LEFT + RIGHT (all rows from both sides).',
      ],
      visual: `LEFT JOIN employees → departments:
┌───────┬───────────┐
│ name  │ dept_name │
├───────┼───────────┤
│ Alice │Engineering│  ✓ matched
│ Bob   │ Marketing │  ✓ matched
│ Carol │ NULL      │  ← dept 30 not found
│ Dave  │ NULL      │  ← NULL dept
└───────┴───────────┘
All employees kept, even without match!

Anti-join (customers without orders):
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
→ returns customers who never placed an order`,
      code: {
        language: 'sql',
        title: 'Outer Joins',
        code: `-- LEFT JOIN — all employees, even without department
SELECT e.name, COALESCE(d.name, 'Unassigned')
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;

-- Anti-join — customers with no orders
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;`
      }
    },
  ]
},

'group-by-having': {
  sections: [
    {
      title: '📖 GROUP BY & HAVING',
      steps: [
        'GROUP BY collapses rows with same values into one group.',
        'Every selected column must be in GROUP BY or wrapped in an aggregate.',
        'WHERE filters rows BEFORE grouping. HAVING filters groups AFTER aggregation.',
        'HAVING can reference aggregate functions; WHERE cannot.',
      ],
      visual: `Query: Departments with more than 2 employees

Step 1 — FROM employees:
│ name  │ dept │
│ Alice │ Eng  │
│ Bob   │ Eng  │
│ Carol │ Mkt  │
│ Dave  │ Eng  │
│ Eve   │ Mkt  │

Step 2 — GROUP BY dept:
│ dept │ members       │ COUNT(*) │
│ Eng  │ Alice,Bob,Dave│    3     │
│ Mkt  │ Carol,Eve     │    2     │

Step 3 — HAVING COUNT(*) > 2:
│ dept │ COUNT(*) │
│ Eng  │    3     │  ← only group kept`,
      code: {
        language: 'sql',
        title: 'GROUP BY & HAVING',
        code: `-- Count per department, filter groups
SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_sal
FROM employees
WHERE status = 'active'        -- filter rows BEFORE grouping
GROUP BY department
HAVING COUNT(*) >= 5           -- filter groups AFTER aggregation
ORDER BY avg_sal DESC;`
      }
    },
  ]
},

'subqueries': {
  sections: [
    {
      title: '📖 Subqueries, CTEs & Correlated Queries',
      steps: [
        'Scalar subquery: returns single value. Use in SELECT or WHERE.',
        'Table subquery: returns rows. Use with IN, EXISTS, or as derived table in FROM.',
        'Correlated subquery: references outer query — re-runs for each outer row.',
        'CTE (WITH clause): named temporary result set — improves readability.',
      ],
      visual: `Scalar subquery:
  SELECT name, salary
  FROM employees
  WHERE salary > (SELECT AVG(salary) FROM employees);
                  └── returns single value ──┘

Correlated subquery:
  SELECT e.name, e.salary
  FROM employees e
  WHERE e.salary > (SELECT AVG(salary)
                     FROM employees
                     WHERE dept_id = e.dept_id);
                                      ↑
                     references outer query's e.dept_id
                     → runs ONCE per outer row!

CTE:
  WITH dept_avg AS (
    SELECT dept_id, AVG(salary) AS avg_sal
    FROM employees GROUP BY dept_id
  )
  SELECT e.name, e.salary, d.avg_sal
  FROM employees e
  JOIN dept_avg d ON e.dept_id = d.dept_id
  WHERE e.salary > d.avg_sal;`,
      code: {
        language: 'sql',
        title: 'Subqueries & CTEs',
        code: `-- CTE for readability
WITH dept_stats AS (
  SELECT dept_id, COUNT(*) AS cnt, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY dept_id
)
SELECT d.dept_name, ds.cnt, ds.avg_sal
FROM dept_stats ds
JOIN departments d ON ds.dept_id = d.id
WHERE ds.cnt > 5;

-- EXISTS vs IN
SELECT c.name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);`
      }
    },
  ]
},

'window-functions': {
  sections: [
    {
      title: '📖 Window Functions — Analytics Without Grouping',
      steps: [
        'Window functions compute values OVER a set of rows without collapsing them.',
        'PARTITION BY = like GROUP BY but keeps all original rows.',
        'ROW_NUMBER(): 1,2,3... (no ties). RANK(): gaps for ties. DENSE_RANK(): no gaps.',
        'LAG/LEAD: look at previous/next row values.',
      ],
      visual: `ROW_NUMBER vs RANK vs DENSE_RANK:

Data (sorted by score DESC):
│ name  │ score │ ROW_NUMBER │ RANK │ DENSE_RANK │
│ Alice │   95  │     1      │  1   │     1      │
│ Bob   │   95  │     2      │  1   │     1      │ ← tie!
│ Carol │   90  │     3      │  3   │     2      │
│ Dave  │   85  │     4      │  4   │     3      │
                       ↑          ↑         ↑
                   always      gap after    no gap
                   unique      ties

Top-N per group pattern:
  WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY dept ORDER BY salary DESC
    ) AS rn
    FROM employees
  )
  SELECT * FROM ranked WHERE rn <= 3;`,
      code: {
        language: 'sql',
        title: 'Window Functions',
        code: `-- Running total
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- Top 3 earners per department
WITH ranked AS (
  SELECT name, department, salary,
    ROW_NUMBER() OVER (
      PARTITION BY department
      ORDER BY salary DESC
    ) AS rn
  FROM employees
)
SELECT name, department, salary
FROM ranked WHERE rn <= 3;

-- Compare with previous row
SELECT date, revenue,
  revenue - LAG(revenue) OVER (ORDER BY date) AS daily_change
FROM daily_sales;`
      }
    },
  ]
},

'indexing-theory': {
  sections: [
    {
      title: '📖 How Indexes Work',
      steps: [
        'An index is a sorted data structure (B-tree) that speeds up lookups.',
        'Without index: database scans every row (full table scan). With index: binary search O(log n).',
        'Trade-off: indexes speed up reads but slow down writes (index must be maintained).',
        'Composite index (a,b,c) supports queries on (a), (a,b), (a,b,c) — leftmost prefix rule.',
      ],
      visual: `B-tree index on "salary":

            [50000]
           /       \\
     [25000]       [75000]
     /    \\        /    \\
  [10k] [35k]  [60k] [90k]   ← leaf nodes point to rows

Query: WHERE salary = 60000
  → 50000 → right → 75000 → left → 60000 → found!
  Only 3 comparisons instead of scanning all rows

Composite index on (dept, salary):
  ✓ WHERE dept = 'Eng'
  ✓ WHERE dept = 'Eng' AND salary > 50000
  ✗ WHERE salary > 50000  (doesn't use index — leftmost prefix!)`,
    },
  ]
},

'transactions-acid': {
  sections: [
    {
      title: '📖 ACID & Isolation Levels',
      steps: [
        'ACID: Atomicity, Consistency, Isolation, Durability — guarantees for transactions.',
        'Atomicity: all statements succeed or all roll back (no partial updates).',
        'Isolation levels control what concurrent transactions can see: Read Uncommitted → Read Committed → Repeatable Read → Serializable.',
        'Higher isolation = fewer anomalies but more locking = slower performance.',
      ],
      visual: `Isolation Level Anomalies:
┌──────────────────┬────────┬──────────────┬─────────┐
│ Level            │ Dirty  │ Non-repeat-  │ Phantom │
│                  │ Read   │ able Read    │ Read    │
├──────────────────┼────────┼──────────────┼─────────┤
│ Read Uncommitted │  YES   │     YES      │   YES   │
│ Read Committed   │  NO    │     YES      │   YES   │
│ Repeatable Read  │  NO    │     NO       │   YES   │
│ Serializable     │  NO    │     NO       │   NO    │
└──────────────────┴────────┴──────────────┴─────────┘`,
      code: {
        language: 'sql',
        title: 'Transaction example',
        code: `-- Transfer $100 from account A to B
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 'A';
  UPDATE accounts SET balance = balance + 100 WHERE id = 'B';
  -- If ANY error occurs here, ROLLBACK undoes both
COMMIT;  -- makes permanent only if both succeed`
      }
    },
  ]
},

'views-security': {
  sections: [
    {
      title: '📖 Views & Access Control',
      steps: [
        'A VIEW is a saved query — it acts like a virtual table but stores no data.',
        'Use views to simplify complex queries, restrict column access, and encapsulate logic.',
        'Materialized views store results on disk — great for expensive queries but can be stale.',
        'GRANT/REVOKE controls who can SELECT, INSERT, UPDATE, DELETE on tables.',
      ],
      visual: `Regular View:
  CREATE VIEW active_employees AS
  SELECT id, name, department FROM employees
  WHERE status = 'active';

  → No data stored, runs query each time
  → SELECT * FROM active_employees;  (uses the view)

Materialized View:
  CREATE MATERIALIZED VIEW monthly_sales AS
  SELECT month, SUM(amount) AS total FROM orders
  GROUP BY month;

  → Data IS stored, must REFRESH periodically
  → REFRESH MATERIALIZED VIEW monthly_sales;`,
    },
  ]
},

};
