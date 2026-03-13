// ─── SQL Problems Database ───
// 150+ SQL problems across 8 categories with real-world schemas

export const SQL_CATEGORIES = [
  { id: 'basic', name: 'Basic Queries', icon: '📋', color: '#22d3ee', desc: 'SELECT, WHERE, ORDER BY, DISTINCT, LIMIT' },
  { id: 'joins', name: 'Joins', icon: '🔗', color: '#3b82f6', desc: 'INNER, LEFT, RIGHT, FULL, self-joins, cross joins' },
  { id: 'aggregations', name: 'Aggregations', icon: '📊', color: '#10b981', desc: 'COUNT, SUM, AVG, GROUP BY, HAVING' },
  { id: 'subqueries', name: 'Subqueries', icon: '🔄', color: '#f59e0b', desc: 'Scalar, correlated, EXISTS, IN, ANY/ALL' },
  { id: 'window', name: 'Window Functions', icon: '🪟', color: '#8b5cf6', desc: 'ROW_NUMBER, RANK, LAG, LEAD, running totals' },
  { id: 'advanced', name: 'Advanced Queries', icon: '⚡', color: '#ef4444', desc: 'CTEs, recursive, pivot, string/date ops' },
  { id: 'optimization', name: 'Query Optimization', icon: '🚀', color: '#f97316', desc: 'Index usage, query rewriting, execution plans' },
  { id: 'dml', name: 'Data Manipulation', icon: '✏️', color: '#ec4899', desc: 'INSERT, UPDATE, DELETE, transactions' },
];

export const SQL_TOPICS = [
  'SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'DISTINCT', 'LIMIT',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'SELF JOIN', 'CROSS JOIN',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'Subquery', 'Correlated Subquery', 'EXISTS', 'IN', 'ANY', 'ALL',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD',
  'CTE', 'Recursive CTE', 'CASE', 'COALESCE', 'CAST',
  'String Functions', 'Date Functions', 'NULL Handling',
  'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'Transactions',
  'Indexes', 'Query Plans', 'Normalization',
];

export const SQL_COMPANIES = [
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'meta', name: 'Meta', color: '#1877F2' },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF' },
  { id: 'apple', name: 'Apple', color: '#A2AAAD' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'uber', name: 'Uber', color: '#000000' },
  { id: 'stripe', name: 'Stripe', color: '#635BFF' },
  { id: 'airbnb', name: 'Airbnb', color: '#FF5A5F' },
  { id: 'twitter', name: 'Twitter/X', color: '#1DA1F2' },
];

// Helper to create a problem quickly
const p = (id, title, difficulty, category, topics, schemaId, companies, acceptance, timeEstimate, description, expectedQuery, hints, explanation) => ({
  id, title, difficulty, category, topics, schemaId, companies,
  acceptance, timeEstimate, description,
  expectedQuery, hints, explanation,
  frequency: acceptance > 70 ? 'high' : acceptance > 50 ? 'medium' : 'low',
});

export const SQL_PROBLEMS = [
  // ════════════════════════════════════════
  // BASIC QUERIES (1-20)
  // ════════════════════════════════════════
  p('sql-1', 'Select All Customers', 'Easy', 'basic', ['SELECT'], 'ecommerce', ['google', 'amazon'], 95, 5,
    'Write a query to retrieve all columns from the `customers` table.',
    'SELECT * FROM customers;',
    ['Use SELECT * to get all columns', 'No WHERE clause needed'],
    'A simple SELECT * retrieves every column and every row from the specified table.'
  ),
  p('sql-2', 'Filter by Country', 'Easy', 'basic', ['SELECT', 'WHERE'], 'ecommerce', ['amazon'], 92, 5,
    'Write a query to find all customers from the USA.',
    "SELECT * FROM customers WHERE country = 'USA';",
    ['Use WHERE to filter rows', 'String values need quotes'],
    'The WHERE clause filters rows. String comparisons use single quotes in SQL.'
  ),
  p('sql-3', 'Sort Products by Price', 'Easy', 'basic', ['SELECT', 'ORDER BY'], 'ecommerce', ['amazon', 'google'], 90, 5,
    'Write a query to list all products sorted by price in descending order.',
    'SELECT * FROM products ORDER BY price DESC;',
    ['Use ORDER BY for sorting', 'DESC for descending order'],
    'ORDER BY sorts results. DESC gives highest-first ordering.'
  ),
  p('sql-4', 'Unique Countries', 'Easy', 'basic', ['SELECT', 'DISTINCT'], 'ecommerce', ['meta'], 88, 5,
    'Write a query to find all unique countries where customers are located.',
    'SELECT DISTINCT country FROM customers;',
    ['DISTINCT removes duplicates'],
    'DISTINCT eliminates duplicate values from the result set.'
  ),
  p('sql-5', 'Top 3 Expensive Products', 'Easy', 'basic', ['SELECT', 'ORDER BY', 'LIMIT'], 'ecommerce', ['amazon'], 87, 5,
    'Write a query to find the 3 most expensive products.',
    'SELECT * FROM products ORDER BY price DESC LIMIT 3;',
    ['Combine ORDER BY with LIMIT'],
    'ORDER BY price DESC sorts highest first, LIMIT 3 returns only the top 3.'
  ),
  p('sql-6', 'Filter by Date Range', 'Easy', 'basic', ['SELECT', 'WHERE'], 'ecommerce', ['google', 'meta'], 85, 8,
    'Write a query to find all orders placed in January 2024.',
    "SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01';",
    ['Use AND for multiple conditions', 'Compare dates with string format YYYY-MM-DD'],
    'Date range filtering uses >= start and < end of next period for precision.'
  ),
  p('sql-7', 'Products in Stock', 'Easy', 'basic', ['SELECT', 'WHERE'], 'ecommerce', ['amazon'], 90, 5,
    'Write a query to find all products with stock_quantity greater than 100.',
    'SELECT * FROM products WHERE stock_quantity > 100;',
    ['Use > for greater than comparison'],
    'Numeric comparisons use standard operators: >, <, >=, <=, =, != or <>.'
  ),
  p('sql-8', 'Pattern Matching', 'Easy', 'basic', ['SELECT', 'WHERE', 'String Functions'], 'ecommerce', ['google'], 82, 8,
    'Write a query to find all products whose name contains "Samsung".',
    "SELECT * FROM products WHERE product_name LIKE '%Samsung%';",
    ['Use LIKE with % wildcards for pattern matching'],
    'LIKE with % wildcards matches any characters before and after the pattern.'
  ),
  p('sql-9', 'NULL Values', 'Easy', 'basic', ['SELECT', 'WHERE', 'NULL Handling'], 'social', ['meta', 'twitter'], 80, 8,
    'Write a query to find all users who have not set a bio (bio is NULL).',
    'SELECT * FROM users WHERE bio IS NULL;',
    ['Use IS NULL, not = NULL'],
    'NULL represents unknown values. Use IS NULL or IS NOT NULL to check for NULLs.'
  ),
  p('sql-10', 'IN Operator', 'Easy', 'basic', ['SELECT', 'WHERE', 'IN'], 'ecommerce', ['amazon', 'google'], 85, 5,
    'Write a query to find all orders with status "pending" or "shipped".',
    "SELECT * FROM orders WHERE status IN ('pending', 'shipped');",
    ['IN checks if a value matches any in a list'],
    'IN is shorthand for multiple OR conditions on the same column.'
  ),
  p('sql-11', 'BETWEEN Operator', 'Easy', 'basic', ['SELECT', 'WHERE'], 'ecommerce', ['amazon'], 88, 5,
    'Write a query to find all products priced between $50 and $200.',
    'SELECT * FROM products WHERE price BETWEEN 50 AND 200;',
    ['BETWEEN is inclusive on both ends'],
    'BETWEEN includes both boundary values. Equivalent to >= 50 AND <= 200.'
  ),
  p('sql-12', 'Multiple Columns', 'Easy', 'basic', ['SELECT'], 'hr', ['microsoft', 'google'], 92, 5,
    'Write a query to get only the first_name, last_name, and salary of all employees.',
    'SELECT first_name, last_name, salary FROM employees;',
    ['List specific column names instead of *'],
    'Selecting specific columns is better practice than SELECT * for readability and performance.'
  ),
  p('sql-13', 'Column Aliases', 'Easy', 'basic', ['SELECT'], 'hr', ['google'], 90, 5,
    'Write a query to display employee full names (first + last) as "full_name" and their salary as "annual_pay".',
    "SELECT CONCAT(first_name, ' ', last_name) AS full_name, salary AS annual_pay FROM employees;",
    ['Use AS for column aliases', 'CONCAT joins strings together'],
    'AS creates aliases for columns. CONCAT concatenates string values.'
  ),
  p('sql-14', 'Conditional Selection', 'Easy', 'basic', ['SELECT', 'WHERE'], 'banking', ['stripe', 'google'], 83, 8,
    'Write a query to find all active accounts with a balance greater than $10,000.',
    'SELECT * FROM accounts WHERE is_active = TRUE AND balance > 10000;',
    ['Combine conditions with AND'],
    'AND requires both conditions to be true for a row to be included.'
  ),
  p('sql-15', 'OR Conditions', 'Easy', 'basic', ['SELECT', 'WHERE'], 'healthcare', ['google'], 86, 5,
    'Write a query to find all appointments that are either scheduled or completed.',
    "SELECT * FROM appointments WHERE status = 'scheduled' OR status = 'completed';",
    ['Use OR when either condition should match'],
    'OR includes rows where at least one condition is true.'
  ),
  p('sql-16', 'NOT Operator', 'Easy', 'basic', ['SELECT', 'WHERE'], 'ecommerce', ['amazon'], 84, 5,
    'Write a query to find all orders that are NOT cancelled.',
    "SELECT * FROM orders WHERE status != 'cancelled';",
    ['Use != or <> or NOT for negation'],
    '!= (or <>) excludes rows matching the specified value.'
  ),
  p('sql-17', 'Count Rows', 'Easy', 'basic', ['SELECT', 'COUNT'], 'ecommerce', ['google', 'meta'], 90, 5,
    'Write a query to count the total number of products.',
    'SELECT COUNT(*) AS total_products FROM products;',
    ['COUNT(*) counts all rows'],
    'COUNT(*) returns the total number of rows in the result set.'
  ),
  p('sql-18', 'Arithmetic in SELECT', 'Easy', 'basic', ['SELECT'], 'ecommerce', ['amazon'], 88, 8,
    'Write a query to show each product name and its price with 10% tax added.',
    'SELECT product_name, price, price * 1.10 AS price_with_tax FROM products;',
    ['You can do arithmetic in SELECT'],
    'SQL supports arithmetic operations (+, -, *, /) directly in SELECT expressions.'
  ),
  p('sql-19', 'Multi-Column Sort', 'Easy', 'basic', ['SELECT', 'ORDER BY'], 'hr', ['microsoft'], 85, 8,
    'Write a query to list all employees sorted by department_id ascending, then by salary descending within each department.',
    'SELECT * FROM employees ORDER BY department_id ASC, salary DESC;',
    ['ORDER BY can have multiple columns'],
    'Multiple ORDER BY columns are evaluated left to right. Each can be ASC or DESC.'
  ),
  p('sql-20', 'CASE Expression', 'Medium', 'basic', ['SELECT', 'CASE'], 'ecommerce', ['google', 'amazon'], 72, 10,
    'Write a query to classify products as "Budget" (price < 100), "Mid-Range" (100-500), or "Premium" (> 500). Show product_name and the classification as "tier".',
    "SELECT product_name, CASE WHEN price < 100 THEN 'Budget' WHEN price <= 500 THEN 'Mid-Range' ELSE 'Premium' END AS tier FROM products;",
    ['CASE WHEN creates conditional logic', 'ELSE handles all remaining cases', 'END closes the CASE block'],
    'CASE expressions allow conditional logic in SQL, similar to if/else in programming.'
  ),

  // ════════════════════════════════════════
  // JOINS (21-45)
  // ════════════════════════════════════════
  p('sql-21', 'Basic Inner Join', 'Easy', 'joins', ['INNER JOIN'], 'ecommerce', ['google', 'amazon'], 88, 8,
    'Write a query to list all orders with the customer\'s first_name and last_name.',
    'SELECT o.order_id, c.first_name, c.last_name, o.order_date, o.total_amount FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id;',
    ['INNER JOIN matches rows from both tables', 'Use ON to specify the join condition'],
    'INNER JOIN returns only rows where there is a match in both tables.'
  ),
  p('sql-22', 'Left Join', 'Easy', 'joins', ['LEFT JOIN'], 'ecommerce', ['amazon', 'meta'], 82, 10,
    'Write a query to list ALL customers and their orders. Customers without orders should still appear with NULL order details.',
    'SELECT c.first_name, c.last_name, o.order_id, o.total_amount FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id;',
    ['LEFT JOIN keeps all rows from the left table', 'Unmatched rows get NULL for right table columns'],
    'LEFT JOIN preserves all rows from the left table. When no match exists in the right table, columns from the right table are NULL.'
  ),
  p('sql-23', 'Multi-Table Join', 'Medium', 'joins', ['INNER JOIN'], 'ecommerce', ['google', 'meta', 'amazon'], 75, 12,
    'Write a query to show each order item with the order date, product name, quantity, and unit price.',
    'SELECT o.order_date, p.product_name, oi.quantity, oi.unit_price FROM order_items oi JOIN orders o ON oi.order_id = o.order_id JOIN products p ON oi.product_id = p.product_id;',
    ['Chain multiple JOINs', 'Each JOIN adds another table'],
    'Multiple JOINs can be chained to connect 3+ tables. Each JOIN needs its own ON condition.'
  ),
  p('sql-24', 'Self Join — Manager Lookup', 'Medium', 'joins', ['SELF JOIN'], 'hr', ['google', 'microsoft', 'amazon'], 68, 15,
    'Write a query to list each employee\'s name alongside their manager\'s name. Employees without a manager should show NULL for manager name.',
    "SELECT e.first_name || ' ' || e.last_name AS employee, m.first_name || ' ' || m.last_name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id;",
    ['A self-join joins a table to itself', 'Use different aliases for the same table', 'LEFT JOIN to include employees with no manager'],
    'Self-joins use table aliases to treat one table as two. This is common for hierarchical data like org charts.'
  ),
  p('sql-25', 'Join with Aggregation', 'Medium', 'joins', ['INNER JOIN', 'COUNT', 'GROUP BY'], 'ecommerce', ['amazon', 'google'], 70, 12,
    'Write a query to find the number of orders placed by each customer. Show customer name and order count, sorted by most orders first.',
    "SELECT c.first_name, c.last_name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name ORDER BY order_count DESC;",
    ['Join customers and orders first', 'Then GROUP BY customer', 'COUNT the orders per customer'],
    'Combining JOINs with GROUP BY is one of the most common SQL patterns for summarizing related data.'
  ),
  p('sql-26', 'Products Never Ordered', 'Medium', 'joins', ['LEFT JOIN', 'NULL Handling'], 'ecommerce', ['meta', 'amazon'], 65, 12,
    'Write a query to find all products that have never been ordered.',
    'SELECT p.product_name FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id WHERE oi.item_id IS NULL;',
    ['LEFT JOIN keeps all products', 'Filter for NULLs to find non-matches'],
    'LEFT JOIN + WHERE IS NULL is a common anti-join pattern to find rows in one table with no match in another.'
  ),
  p('sql-27', 'Cross Join — All Combinations', 'Medium', 'joins', ['CROSS JOIN'], 'education', ['google'], 70, 10,
    'Write a query to generate all possible student-course combinations.',
    'SELECT s.name AS student, c.course_name FROM students s CROSS JOIN courses c;',
    ['CROSS JOIN produces the Cartesian product', 'Every row in table A is combined with every row in table B'],
    'CROSS JOIN creates all possible pairings. Useful for generating combinations, but can produce very large result sets.'
  ),
  p('sql-28', 'Join Three Tables', 'Medium', 'joins', ['INNER JOIN'], 'healthcare', ['google', 'amazon'], 72, 12,
    'Write a query to list each appointment with the patient name, doctor name, and diagnosis.',
    "SELECT p.first_name || ' ' || p.last_name AS patient, d.first_name || ' ' || d.last_name AS doctor, a.appointment_date, a.diagnosis FROM appointments a JOIN patients p ON a.patient_id = p.patient_id JOIN doctors d ON a.doctor_id = d.doctor_id;",
    ['Join appointments to both patients and doctors'],
    'Three-table joins are common when a junction/bridge table connects two entity tables.'
  ),
  p('sql-29', 'Right Join', 'Easy', 'joins', ['RIGHT JOIN'], 'hr', ['microsoft'], 78, 10,
    'Write a query to list all departments and any employees in them. Departments with no employees should still appear.',
    'SELECT d.department_name, e.first_name, e.last_name FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id;',
    ['RIGHT JOIN keeps all rows from the right table'],
    'RIGHT JOIN is the mirror of LEFT JOIN — it preserves all rows from the right table.'
  ),
  p('sql-30', 'Join with Filter', 'Medium', 'joins', ['INNER JOIN', 'WHERE'], 'ecommerce', ['amazon', 'google'], 74, 10,
    'Write a query to find all 5-star reviews with the product name and customer name.',
    "SELECT p.product_name, c.first_name, c.last_name, r.review_text FROM reviews r JOIN products p ON r.product_id = p.product_id JOIN customers c ON r.customer_id = c.customer_id WHERE r.rating = 5;",
    ['Join reviews to products and customers', 'Filter with WHERE after joining'],
    'WHERE is applied after JOINs, so you can filter on any column from the joined tables.'
  ),
  p('sql-31', 'Followers — Mutual Follows', 'Hard', 'joins', ['SELF JOIN', 'INNER JOIN'], 'social', ['meta', 'twitter'], 45, 20,
    'Write a query to find all pairs of users who follow each other (mutual followers). Show both usernames.',
    "SELECT u1.username AS user1, u2.username AS user2 FROM followers f1 JOIN followers f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id JOIN users u1 ON f1.follower_id = u1.user_id JOIN users u2 ON f1.following_id = u2.user_id WHERE f1.follower_id < f1.following_id;",
    ['Self-join the followers table to find reciprocal pairs', 'Use < to avoid duplicates'],
    'This pattern joins followers to itself to find reciprocal relationships. The < condition avoids showing (A,B) and (B,A) as separate results.'
  ),
  p('sql-32', 'Full Outer Join', 'Medium', 'joins', ['FULL JOIN'], 'inventory', ['google'], 62, 12,
    'Write a query showing all products and all warehouses — even products not in any warehouse and warehouses with no products.',
    'SELECT p.product_name, w.warehouse_name, s.quantity FROM products p FULL OUTER JOIN stock s ON p.product_id = s.product_id FULL OUTER JOIN warehouses w ON s.warehouse_id = w.warehouse_id;',
    ['FULL OUTER JOIN preserves unmatched rows from both tables'],
    'FULL OUTER JOIN combines LEFT and RIGHT JOIN behaviors — no rows are lost from either table.'
  ),
  p('sql-33', 'Revenue Per Category', 'Medium', 'joins', ['INNER JOIN', 'SUM', 'GROUP BY'], 'ecommerce', ['amazon', 'google', 'meta'], 65, 15,
    'Write a query to calculate total revenue per product category. Show category name and total revenue, sorted by revenue descending.',
    'SELECT cat.category_name, SUM(oi.quantity * oi.unit_price) AS total_revenue FROM order_items oi JOIN products p ON oi.product_id = p.product_id JOIN categories cat ON p.category_id = cat.category_id GROUP BY cat.category_name ORDER BY total_revenue DESC;',
    ['Join order_items → products → categories', 'Revenue = quantity × unit_price', 'SUM and GROUP BY for totals per category'],
    'Multi-table joins with aggregation are a staple of business reporting. The revenue calculation happens at the order_items level.'
  ),
  p('sql-34', 'Doctors Without Appointments', 'Medium', 'joins', ['LEFT JOIN', 'NULL Handling'], 'healthcare', ['google'], 70, 10,
    'Find all doctors who have no appointments scheduled.',
    'SELECT d.first_name, d.last_name, d.specialization FROM doctors d LEFT JOIN appointments a ON d.doctor_id = a.doctor_id WHERE a.appointment_id IS NULL;',
    ['LEFT JOIN doctors to appointments', 'WHERE IS NULL finds doctors with no match'],
    'Anti-join pattern: LEFT JOIN combined with IS NULL check to find unmatched rows.'
  ),
  p('sql-35', 'Join with Date Filter', 'Medium', 'joins', ['INNER JOIN', 'WHERE'], 'banking', ['stripe', 'google'], 72, 12,
    'Find all transactions made from checking accounts in January 2024. Show account holder name, transaction type, amount, and date.',
    "SELECT a.customer_name, t.transaction_type, t.amount, t.transaction_date FROM transactions t JOIN accounts a ON t.account_id = a.account_id WHERE a.account_type = 'checking' AND t.transaction_date >= '2024-01-01' AND t.transaction_date < '2024-02-01';",
    ['Join transactions with accounts first', 'Filter by account_type and date range'],
    'Combining JOINs with date range filters is common in financial queries.'
  ),

  // ════════════════════════════════════════
  // AGGREGATIONS (36-55)
  // ════════════════════════════════════════
  p('sql-36', 'Average Salary by Department', 'Easy', 'aggregations', ['AVG', 'GROUP BY'], 'hr', ['google', 'microsoft', 'amazon'], 85, 8,
    'Write a query to find the average salary for each department. Show department_id and average salary rounded to 2 decimal places.',
    'SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id;',
    ['AVG calculates the mean', 'GROUP BY splits into groups', 'ROUND to 2 decimals'],
    'GROUP BY creates groups of rows sharing the same department_id, then AVG computes the mean salary within each group.'
  ),
  p('sql-37', 'Orders Per Status', 'Easy', 'aggregations', ['COUNT', 'GROUP BY'], 'ecommerce', ['amazon'], 88, 8,
    'Write a query to count how many orders exist in each status.',
    'SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status ORDER BY order_count DESC;',
    ['GROUP BY status to create groups', 'COUNT per group'],
    'Counting by status is a fundamental reporting pattern used across all domains.'
  ),
  p('sql-38', 'HAVING Filter', 'Medium', 'aggregations', ['COUNT', 'GROUP BY', 'HAVING'], 'ecommerce', ['google', 'amazon'], 72, 10,
    'Find products that have received more than 1 review. Show product_id and review count.',
    'SELECT product_id, COUNT(*) AS review_count FROM reviews GROUP BY product_id HAVING COUNT(*) > 1;',
    ['HAVING filters groups, WHERE filters rows', 'HAVING comes after GROUP BY'],
    'HAVING is like WHERE but for aggregated groups. It filters after GROUP BY has been applied.'
  ),
  p('sql-39', 'Min and Max Salary', 'Easy', 'aggregations', ['MIN', 'MAX'], 'hr', ['microsoft'], 90, 5,
    'Write a query to find the minimum and maximum salary across all employees.',
    'SELECT MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees;',
    ['MIN and MAX find extremes'],
    'MIN and MAX work on any sortable data type: numbers, strings, dates.'
  ),
  p('sql-40', 'Total Revenue Per Customer', 'Medium', 'aggregations', ['SUM', 'GROUP BY', 'INNER JOIN'], 'ecommerce', ['amazon', 'google'], 70, 12,
    'Calculate the total amount spent by each customer. Show customer name and total amount, sorted by highest spender.',
    "SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name ORDER BY total_spent DESC;",
    ['Join customers to orders', 'SUM order amounts per customer'],
    'This combines JOIN with aggregation — a core analytics pattern.'
  ),
  p('sql-41', 'Average Rating Per Product', 'Easy', 'aggregations', ['AVG', 'GROUP BY'], 'ecommerce', ['amazon'], 82, 8,
    'Find the average rating for each product. Show product_id and average rating.',
    'SELECT product_id, ROUND(AVG(rating), 1) AS avg_rating FROM reviews GROUP BY product_id ORDER BY avg_rating DESC;',
    ['AVG(rating) computes the mean rating per product'],
    'Average ratings are one of the most common aggregation queries in e-commerce.'
  ),
  p('sql-42', 'Departments with High Avg Salary', 'Medium', 'aggregations', ['AVG', 'GROUP BY', 'HAVING'], 'hr', ['google', 'microsoft'], 68, 12,
    'Find departments where the average salary exceeds $150,000.',
    'SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id HAVING AVG(salary) > 150000;',
    ['Use HAVING to filter on aggregated values'],
    'HAVING works on aggregate values — you cannot use WHERE with AVG(), SUM(), etc.'
  ),
  p('sql-43', 'Monthly Order Totals', 'Medium', 'aggregations', ['SUM', 'GROUP BY', 'Date Functions'], 'ecommerce', ['amazon', 'google', 'meta'], 65, 15,
    'Calculate total order value per month. Show year-month and total.',
    "SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, SUM(total_amount) AS monthly_total FROM orders GROUP BY DATE_FORMAT(order_date, '%Y-%m') ORDER BY month;",
    ['Use DATE_FORMAT to extract year-month', 'GROUP BY the formatted date'],
    'Date-based aggregation is essential for time-series analysis. DATE_FORMAT extracts parts of a date.'
  ),
  p('sql-44', 'Count Per Difficulty', 'Easy', 'aggregations', ['COUNT', 'GROUP BY'], 'social', ['meta'], 85, 5,
    'Count how many public vs private posts exist.',
    'SELECT is_public, COUNT(*) AS post_count FROM posts GROUP BY is_public;',
    ['GROUP BY boolean column'],
    'Boolean columns can be grouped just like any other column.'
  ),
  p('sql-45', 'Highest Spending Customer', 'Medium', 'aggregations', ['SUM', 'GROUP BY', 'ORDER BY', 'LIMIT'], 'ecommerce', ['amazon'], 72, 10,
    'Find the customer who has spent the most money overall. Show their name and total spending.',
    "SELECT c.first_name, c.last_name, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name ORDER BY total_spent DESC LIMIT 1;",
    ['Aggregate, sort, and limit to find the top 1'],
    'ORDER BY DESC + LIMIT 1 is the standard pattern for finding the maximum.'
  ),
  p('sql-46', 'Multiple Aggregations', 'Medium', 'aggregations', ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP BY'], 'banking', ['stripe'], 68, 12,
    'For each account type, find the number of accounts, total balance, average balance, min balance, and max balance.',
    'SELECT account_type, COUNT(*) AS num_accounts, SUM(balance) AS total_balance, ROUND(AVG(balance), 2) AS avg_balance, MIN(balance) AS min_balance, MAX(balance) AS max_balance FROM accounts GROUP BY account_type;',
    ['You can use multiple aggregate functions in one query'],
    'Combining multiple aggregations gives a comprehensive statistical summary of each group.'
  ),
  p('sql-47', 'Group by Multiple Columns', 'Medium', 'aggregations', ['COUNT', 'GROUP BY'], 'hr', ['microsoft', 'google'], 70, 10,
    'Count the number of employees per department per job title.',
    'SELECT department_id, job_title, COUNT(*) AS emp_count FROM employees GROUP BY department_id, job_title ORDER BY department_id, emp_count DESC;',
    ['GROUP BY accepts multiple columns'],
    'Multi-column GROUP BY creates groups based on unique combinations of the specified columns.'
  ),
  p('sql-48', 'Conditional Aggregation', 'Medium', 'aggregations', ['COUNT', 'CASE', 'GROUP BY'], 'ecommerce', ['google', 'amazon'], 60, 15,
    'Write a single query to count orders by status: pending_count, shipped_count, delivered_count, cancelled_count.',
    "SELECT COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count, COUNT(CASE WHEN status = 'shipped' THEN 1 END) AS shipped_count, COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_count, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count FROM orders;",
    ['CASE inside COUNT for conditional counting', 'No GROUP BY needed — this pivots into columns'],
    'Conditional aggregation uses CASE inside aggregate functions to create pivot-style results in a single row.'
  ),
  p('sql-49', 'Percentage Calculation', 'Medium', 'aggregations', ['COUNT', 'GROUP BY'], 'ecommerce', ['amazon', 'meta'], 58, 15,
    'Calculate the percentage of orders in each status. Show status and percentage rounded to 1 decimal.',
    'SELECT status, COUNT(*) AS cnt, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage FROM orders GROUP BY status;',
    ['Divide each group count by total count', 'Multiply by 100 for percentage'],
    'Window function SUM() OVER() calculates the total across all groups, enabling percentage calculation.'
  ),
  p('sql-50', 'Rollup Summary', 'Hard', 'aggregations', ['SUM', 'GROUP BY'], 'ecommerce', ['google'], 48, 20,
    'Calculate total revenue per category with a grand total row at the bottom using ROLLUP.',
    'SELECT COALESCE(cat.category_name, \'TOTAL\') AS category, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.product_id JOIN categories cat ON p.category_id = cat.category_id GROUP BY ROLLUP(cat.category_name);',
    ['ROLLUP adds subtotal/grand total rows', 'COALESCE replaces NULL with a label'],
    'GROUP BY ROLLUP creates hierarchical subtotals.'
  ),

  // ════════════════════════════════════════
  // SUBQUERIES (51-65)
  // ════════════════════════════════════════
  p('sql-51', 'Scalar Subquery', 'Medium', 'subqueries', ['Subquery'], 'hr', ['google', 'amazon'], 72, 10,
    'Find all employees whose salary is above the company average.',
    'SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ['A scalar subquery returns a single value', 'Use it in WHERE for comparison'],
    'Scalar subqueries return one value and can be used anywhere a single value is expected.'
  ),
  p('sql-52', 'IN Subquery', 'Medium', 'subqueries', ['Subquery', 'IN'], 'ecommerce', ['amazon'], 70, 10,
    'Find all customers who have placed at least one order.',
    'SELECT * FROM customers WHERE customer_id IN (SELECT DISTINCT customer_id FROM orders);',
    ['IN subquery returns a list of values'],
    'IN subquery checks if a value exists in the set returned by the inner query.'
  ),
  p('sql-53', 'NOT IN Subquery', 'Medium', 'subqueries', ['Subquery', 'IN'], 'ecommerce', ['meta'], 68, 10,
    'Find all customers who have never placed an order.',
    'SELECT * FROM customers WHERE customer_id NOT IN (SELECT DISTINCT customer_id FROM orders);',
    ['NOT IN excludes matching values'],
    'NOT IN is the inverse of IN. Be careful with NULLs in the subquery result.'
  ),
  p('sql-54', 'EXISTS Subquery', 'Medium', 'subqueries', ['EXISTS', 'Correlated Subquery'], 'ecommerce', ['google', 'amazon'], 62, 15,
    'Find all products that have at least one 5-star review using EXISTS.',
    'SELECT p.product_name FROM products p WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.product_id AND r.rating = 5);',
    ['EXISTS returns TRUE if the subquery returns any rows', 'The subquery references the outer query (correlated)'],
    'EXISTS is often faster than IN for large datasets because it short-circuits on the first match.'
  ),
  p('sql-55', 'Correlated Subquery', 'Hard', 'subqueries', ['Correlated Subquery'], 'hr', ['google', 'microsoft'], 52, 18,
    'Find employees who earn more than the average salary in their own department.',
    'SELECT e.first_name, e.last_name, e.salary, e.department_id FROM employees e WHERE e.salary > (SELECT AVG(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id);',
    ['The inner query references the outer query', 'It runs once per row in the outer query'],
    'Correlated subqueries reference columns from the outer query, making them row-dependent.'
  ),
  p('sql-56', 'Subquery in FROM', 'Medium', 'subqueries', ['Subquery', 'GROUP BY'], 'ecommerce', ['amazon'], 65, 12,
    'Find the average number of orders per customer using a subquery in FROM.',
    'SELECT AVG(order_count) AS avg_orders_per_customer FROM (SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id) AS customer_orders;',
    ['Subqueries in FROM act as derived tables', 'Must be aliased'],
    'Derived tables (subqueries in FROM) let you aggregate on top of aggregations.'
  ),
  p('sql-57', 'Top N Per Group', 'Hard', 'subqueries', ['Correlated Subquery'], 'hr', ['google', 'amazon', 'meta'], 42, 20,
    'Find the top 2 highest-paid employees in each department.',
    'SELECT e.department_id, e.first_name, e.last_name, e.salary FROM employees e WHERE (SELECT COUNT(*) FROM employees e2 WHERE e2.department_id = e.department_id AND e2.salary > e.salary) < 2 ORDER BY e.department_id, e.salary DESC;',
    ['Count how many employees earn more in the same dept', 'If fewer than 2 earn more, this employee is in top 2'],
    'This correlated subquery approach works in all SQL dialects. Window functions offer a cleaner alternative.'
  ),
  p('sql-58', 'ANY / ALL Operators', 'Medium', 'subqueries', ['ANY', 'ALL', 'Subquery'], 'hr', ['microsoft'], 58, 12,
    'Find employees whose salary is greater than ALL salaries in the Marketing department (dept 2).',
    'SELECT first_name, last_name, salary FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 2);',
    ['ALL means the condition must be true for every value'],
    'ALL requires the comparison to hold against every value returned by the subquery.'
  ),
  p('sql-59', 'Subquery in SELECT', 'Medium', 'subqueries', ['Subquery'], 'ecommerce', ['google'], 60, 12,
    'For each product, show its name, price, and the average price of all products.',
    'SELECT product_name, price, (SELECT ROUND(AVG(price), 2) FROM products) AS avg_price FROM products;',
    ['Scalar subqueries can appear in SELECT'],
    'A subquery in SELECT computes a value for each row. Here the subquery is uncorrelated so it returns the same value for every row.'
  ),
  p('sql-60', 'Nested Subqueries', 'Hard', 'subqueries', ['Subquery', 'IN'], 'ecommerce', ['amazon', 'google'], 45, 20,
    'Find the names of customers who ordered products in the Electronics category (category_id = 1).',
    "SELECT first_name, last_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE order_id IN (SELECT order_id FROM order_items WHERE product_id IN (SELECT product_id FROM products WHERE category_id = 1)));",
    ['Subqueries can be nested multiple levels deep', 'Work from the innermost query outward'],
    'Deeply nested subqueries trace a path through related tables. JOINs are often more readable for this pattern.'
  ),

  // ════════════════════════════════════════
  // WINDOW FUNCTIONS (61-80)
  // ════════════════════════════════════════
  p('sql-61', 'ROW_NUMBER Basics', 'Medium', 'window', ['ROW_NUMBER'], 'hr', ['google', 'amazon'], 72, 10,
    'Assign a row number to each employee ordered by salary descending.',
    'SELECT first_name, last_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num FROM employees;',
    ['ROW_NUMBER() assigns sequential numbers', 'OVER defines the window'],
    'ROW_NUMBER assigns a unique sequential integer to each row within the result set.'
  ),
  p('sql-62', 'RANK vs DENSE_RANK', 'Medium', 'window', ['RANK', 'DENSE_RANK'], 'hr', ['google', 'microsoft'], 65, 12,
    'Rank employees by salary. Show both RANK and DENSE_RANK to see the difference.',
    'SELECT first_name, last_name, salary, RANK() OVER (ORDER BY salary DESC) AS rank, DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank FROM employees;',
    ['RANK skips numbers after ties', 'DENSE_RANK does not skip'],
    'With salaries 100, 100, 80: RANK gives 1,1,3 while DENSE_RANK gives 1,1,2.'
  ),
  p('sql-63', 'PARTITION BY', 'Medium', 'window', ['ROW_NUMBER', 'RANK'], 'hr', ['google', 'amazon', 'meta'], 60, 15,
    'Rank employees within each department by salary. Show department, name, salary, and rank.',
    'SELECT department_id, first_name, last_name, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank FROM employees;',
    ['PARTITION BY creates independent groups for the window function'],
    'PARTITION BY is like GROUP BY for window functions — it resets the calculation for each partition.'
  ),
  p('sql-64', 'Running Total', 'Medium', 'window', ['SUM'], 'banking', ['stripe', 'google'], 58, 15,
    'Calculate a running total of transaction amounts for account 1001, ordered by date.',
    'SELECT transaction_date, amount, SUM(amount) OVER (ORDER BY transaction_date) AS running_total FROM transactions WHERE account_id = 1001;',
    ['SUM() OVER (ORDER BY ...) creates a cumulative sum'],
    'A window SUM with ORDER BY accumulates values row by row, creating a running total.'
  ),
  p('sql-65', 'LAG — Previous Row', 'Medium', 'window', ['LAG'], 'banking', ['stripe', 'google'], 55, 15,
    'For each transaction on account 1001, show the previous transaction amount.',
    'SELECT transaction_date, amount, LAG(amount, 1) OVER (ORDER BY transaction_date) AS prev_amount FROM transactions WHERE account_id = 1001;',
    ['LAG(column, n) looks back n rows'],
    'LAG accesses data from a previous row without needing a self-join.'
  ),
  p('sql-66', 'LEAD — Next Row', 'Medium', 'window', ['LEAD'], 'banking', ['stripe'], 55, 15,
    'For each transaction on account 1001, show the next transaction amount.',
    'SELECT transaction_date, amount, LEAD(amount, 1) OVER (ORDER BY transaction_date) AS next_amount FROM transactions WHERE account_id = 1001;',
    ['LEAD(column, n) looks forward n rows'],
    'LEAD accesses data from a subsequent row. NULL is returned when there is no next row.'
  ),
  p('sql-67', 'Month-over-Month Change', 'Hard', 'window', ['LAG', 'Date Functions'], 'ecommerce', ['amazon', 'google', 'meta'], 42, 20,
    'Calculate the month-over-month percentage change in total order revenue.',
    "SELECT month, monthly_revenue, LAG(monthly_revenue) OVER (ORDER BY month) AS prev_month, ROUND((monthly_revenue - LAG(monthly_revenue) OVER (ORDER BY month)) * 100.0 / LAG(monthly_revenue) OVER (ORDER BY month), 1) AS pct_change FROM (SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, SUM(total_amount) AS monthly_revenue FROM orders GROUP BY DATE_FORMAT(order_date, '%Y-%m')) monthly;",
    ['First aggregate by month', 'Then use LAG to get previous month', 'Calculate percentage change'],
    'This two-step pattern (aggregate then window) is the standard approach for period-over-period analysis.'
  ),
  p('sql-68', 'Top N Per Group (Window)', 'Hard', 'window', ['ROW_NUMBER'], 'hr', ['google', 'amazon', 'microsoft'], 48, 18,
    'Find the highest-paid employee in each department using window functions.',
    'SELECT department_id, first_name, last_name, salary FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn FROM employees) ranked WHERE rn = 1;',
    ['ROW_NUMBER with PARTITION BY ranks within groups', 'Filter for rn = 1 in outer query'],
    'ROW_NUMBER + PARTITION BY is the standard window function approach for top-N-per-group queries.'
  ),
  p('sql-69', 'NTILE — Quartiles', 'Medium', 'window', ['NTILE'], 'hr', ['google'], 58, 12,
    'Divide employees into 4 salary quartiles.',
    'SELECT first_name, last_name, salary, NTILE(4) OVER (ORDER BY salary) AS quartile FROM employees;',
    ['NTILE(n) divides rows into n roughly equal groups'],
    'NTILE distributes rows into buckets. Useful for percentile analysis and data segmentation.'
  ),
  p('sql-70', 'Moving Average', 'Hard', 'window', ['AVG'], 'banking', ['stripe', 'google'], 45, 20,
    'Calculate a 3-transaction moving average of amounts for account 1001.',
    'SELECT transaction_date, amount, ROUND(AVG(amount) OVER (ORDER BY transaction_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM transactions WHERE account_id = 1001;',
    ['ROWS BETWEEN defines the window frame', '2 PRECEDING AND CURRENT ROW = 3-row window'],
    'Window frames control exactly which rows are included in each calculation. ROWS BETWEEN is the key clause.'
  ),
  p('sql-71', 'Cumulative Distribution', 'Hard', 'window', ['RANK'], 'hr', ['google'], 40, 20,
    'Calculate the percentile rank of each employee salary using PERCENT_RANK.',
    'SELECT first_name, last_name, salary, ROUND(PERCENT_RANK() OVER (ORDER BY salary) * 100, 1) AS percentile FROM employees;',
    ['PERCENT_RANK gives relative position as 0-1'],
    'PERCENT_RANK = (rank - 1) / (total_rows - 1). It shows where each value falls in the distribution.'
  ),
  p('sql-72', 'First and Last Value', 'Medium', 'window', ['LAG', 'LEAD'], 'hr', ['microsoft'], 55, 15,
    'For each employee, show the highest and lowest salary in their department using FIRST_VALUE and LAST_VALUE.',
    'SELECT first_name, department_id, salary, FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS highest_in_dept, FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary ASC) AS lowest_in_dept FROM employees;',
    ['FIRST_VALUE returns the first row in the window frame'],
    'FIRST_VALUE with different ORDER BY directions can get both min and max within a partition.'
  ),

  // ════════════════════════════════════════
  // ADVANCED QUERIES (73-92)
  // ════════════════════════════════════════
  p('sql-73', 'Basic CTE', 'Medium', 'advanced', ['CTE'], 'ecommerce', ['google', 'amazon'], 68, 12,
    'Using a CTE, find customers who have spent more than $1000 total.',
    "WITH customer_spending AS (SELECT customer_id, SUM(total_amount) AS total_spent FROM orders GROUP BY customer_id) SELECT c.first_name, c.last_name, cs.total_spent FROM customers c JOIN customer_spending cs ON c.customer_id = cs.customer_id WHERE cs.total_spent > 1000;",
    ['WITH ... AS defines a CTE', 'CTEs make complex queries more readable'],
    'CTEs (Common Table Expressions) are named temporary result sets that improve query readability.'
  ),
  p('sql-74', 'Multiple CTEs', 'Hard', 'advanced', ['CTE'], 'ecommerce', ['google', 'meta'], 50, 18,
    'Find products where the average review rating is above 4 AND total units sold exceed 1. Use two CTEs.',
    "WITH avg_ratings AS (SELECT product_id, AVG(rating) AS avg_rating FROM reviews GROUP BY product_id), total_sold AS (SELECT product_id, SUM(quantity) AS units_sold FROM order_items GROUP BY product_id) SELECT p.product_name, ar.avg_rating, ts.units_sold FROM products p JOIN avg_ratings ar ON p.product_id = ar.product_id JOIN total_sold ts ON p.product_id = ts.product_id WHERE ar.avg_rating > 4 AND ts.units_sold > 1;",
    ['Multiple CTEs are separated by commas', 'Each CTE can reference previous ones'],
    'Multiple CTEs decompose complex logic into named, readable steps.'
  ),
  p('sql-75', 'Recursive CTE — Org Chart', 'Hard', 'advanced', ['Recursive CTE'], 'hr', ['google', 'microsoft', 'amazon'], 35, 25,
    'Using a recursive CTE, build the full management chain for each employee (employee → manager → manager\'s manager → ...).',
    "WITH RECURSIVE org_chart AS (SELECT employee_id, first_name, last_name, manager_id, 1 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.employee_id, e.first_name, e.last_name, e.manager_id, oc.level + 1 FROM employees e JOIN org_chart oc ON e.manager_id = oc.employee_id) SELECT * FROM org_chart ORDER BY level, employee_id;",
    ['Recursive CTEs have a base case and recursive step', 'UNION ALL connects them', 'The recursion stops when no more rows match'],
    'Recursive CTEs traverse hierarchical data. The base case selects root nodes; the recursive step follows relationships.'
  ),
  p('sql-76', 'Recursive CTE — Category Tree', 'Hard', 'advanced', ['Recursive CTE'], 'ecommerce', ['google'], 38, 25,
    'Build the full category path for each category (e.g., "Electronics > Smartphones").',
    "WITH RECURSIVE cat_tree AS (SELECT category_id, category_name, parent_category_id, CAST(category_name AS CHAR(200)) AS full_path FROM categories WHERE parent_category_id IS NULL UNION ALL SELECT c.category_id, c.category_name, c.parent_category_id, CONCAT(ct.full_path, ' > ', c.category_name) FROM categories c JOIN cat_tree ct ON c.parent_category_id = ct.category_id) SELECT * FROM cat_tree;",
    ['Build path by concatenating names at each level'],
    'Recursive CTEs can accumulate data (like paths) as they traverse the hierarchy.'
  ),
  p('sql-77', 'UNION and UNION ALL', 'Easy', 'advanced', ['CTE'], 'hr', ['microsoft'], 78, 8,
    'Combine a list of all employee names and all department names into a single column.',
    "SELECT first_name AS name, 'Employee' AS type FROM employees UNION SELECT department_name, 'Department' FROM departments;",
    ['UNION combines result sets', 'UNION removes duplicates, UNION ALL keeps them'],
    'UNION vertically stacks results from multiple queries. Columns must match in number and type.'
  ),
  p('sql-78', 'String Functions', 'Easy', 'advanced', ['String Functions'], 'ecommerce', ['google'], 80, 8,
    'Show customer emails in uppercase and extract the domain name (part after @).',
    "SELECT email, UPPER(email) AS upper_email, SUBSTRING(email, LOCATE('@', email) + 1) AS domain FROM customers;",
    ['UPPER converts to uppercase', 'SUBSTRING extracts part of a string', 'LOCATE finds position of a character'],
    'String functions allow text manipulation directly in SQL queries.'
  ),
  p('sql-79', 'Date Functions', 'Medium', 'advanced', ['Date Functions'], 'ecommerce', ['amazon', 'google'], 68, 12,
    'For each order, show how many days ago it was placed and what day of the week it was.',
    "SELECT order_id, order_date, DATEDIFF(CURDATE(), order_date) AS days_ago, DAYNAME(order_date) AS day_of_week FROM orders;",
    ['DATEDIFF calculates difference between dates', 'DAYNAME returns the weekday name'],
    'Date functions provide powerful date manipulation without application-level processing.'
  ),
  p('sql-80', 'COALESCE and IFNULL', 'Easy', 'advanced', ['COALESCE', 'NULL Handling'], 'social', ['meta'], 82, 8,
    'Show all users, replacing NULL bios with "No bio set".',
    "SELECT username, display_name, COALESCE(bio, 'No bio set') AS bio FROM users;",
    ['COALESCE returns the first non-NULL argument'],
    'COALESCE is ANSI-standard and works across all databases. IFNULL is MySQL-specific.'
  ),
  p('sql-81', 'Pivoting Data', 'Hard', 'advanced', ['CASE', 'GROUP BY'], 'ecommerce', ['google', 'amazon'], 42, 20,
    'Create a pivot table showing each customer and their total spending per order status.',
    "SELECT c.first_name, c.last_name, SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END) AS delivered_total, SUM(CASE WHEN o.status = 'shipped' THEN o.total_amount ELSE 0 END) AS shipped_total, SUM(CASE WHEN o.status = 'pending' THEN o.total_amount ELSE 0 END) AS pending_total FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.first_name, c.last_name;",
    ['CASE inside SUM creates pivot columns', 'Each CASE handles one status value'],
    'Manual pivoting uses conditional aggregation to transform row values into columns.'
  ),
  p('sql-82', 'Generate Series — Date Range', 'Hard', 'advanced', ['Recursive CTE', 'Date Functions'], 'ecommerce', ['google'], 38, 22,
    'Generate a date series for all days in January 2024, showing each date and the number of orders placed on that date (0 if none).',
    "WITH RECURSIVE dates AS (SELECT DATE('2024-01-01') AS d UNION ALL SELECT d + INTERVAL 1 DAY FROM dates WHERE d < '2024-01-31') SELECT dates.d AS date, COUNT(o.order_id) AS order_count FROM dates LEFT JOIN orders o ON DATE(o.order_date) = dates.d GROUP BY dates.d ORDER BY dates.d;",
    ['Recursive CTE generates the date series', 'LEFT JOIN orders to include days with 0 orders'],
    'Generating date series fills gaps in time-based data, ensuring every date appears even without data.'
  ),
  p('sql-83', 'JSON in SQL', 'Hard', 'advanced', ['String Functions'], 'social', ['google', 'meta'], 35, 20,
    'Extract the first hashtag from posts whose content contains a # symbol.',
    "SELECT post_id, content, SUBSTRING_INDEX(SUBSTRING_INDEX(content, '#', -1), ' ', 1) AS first_hashtag FROM posts WHERE content LIKE '%#%';",
    ['SUBSTRING_INDEX splits strings by delimiter'],
    'While not ideal, string functions can parse simple patterns from text content.'
  ),
  p('sql-84', 'GROUPING SETS', 'Hard', 'advanced', ['GROUP BY'], 'ecommerce', ['google'], 40, 20,
    'Calculate total revenue grouped by category alone, by status alone, and overall total using GROUPING SETS.',
    "SELECT cat.category_name, o.status, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.product_id JOIN categories cat ON p.category_id = cat.category_id JOIN orders o ON oi.order_id = o.order_id GROUP BY GROUPING SETS ((cat.category_name), (o.status), ());",
    ['GROUPING SETS defines multiple grouping combinations in one query'],
    'GROUPING SETS is like running multiple GROUP BY queries and combining results with UNION ALL.'
  ),

  // ════════════════════════════════════════
  // QUERY OPTIMIZATION (85-95)
  // ════════════════════════════════════════
  p('sql-85', 'Rewrite Correlated to JOIN', 'Medium', 'optimization', ['Indexes', 'INNER JOIN'], 'hr', ['google', 'amazon'], 65, 15,
    'Rewrite this correlated subquery as a JOIN: SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)',
    'SELECT e.* FROM employees e JOIN (SELECT department_id, AVG(salary) AS avg_sal FROM employees GROUP BY department_id) dept_avg ON e.department_id = dept_avg.department_id WHERE e.salary > dept_avg.avg_sal;',
    ['Pre-compute department averages in a subquery/CTE', 'JOIN instead of correlated subquery'],
    'JOINs are typically faster than correlated subqueries because they avoid row-by-row execution.'
  ),
  p('sql-86', 'EXISTS vs IN', 'Medium', 'optimization', ['EXISTS', 'IN', 'Indexes'], 'ecommerce', ['google'], 60, 12,
    'Rewrite this query using EXISTS instead of IN: SELECT * FROM customers WHERE customer_id IN (SELECT customer_id FROM orders)',
    'SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);',
    ['EXISTS short-circuits on first match', 'More efficient when the subquery returns many rows'],
    'EXISTS stops scanning as soon as it finds a match. IN must evaluate the entire subquery result.'
  ),
  p('sql-87', 'Avoid SELECT *', 'Easy', 'optimization', ['SELECT', 'Indexes'], 'ecommerce', ['google', 'amazon'], 85, 8,
    'Rewrite SELECT * FROM products WHERE price > 100 to only select needed columns: product_name and price.',
    'SELECT product_name, price FROM products WHERE price > 100;',
    ['Select only columns you need', 'Reduces I/O and memory usage'],
    'SELECT * fetches all columns, wasting bandwidth. Specifying columns enables covering index optimizations.'
  ),
  p('sql-88', 'Index-Friendly WHERE', 'Medium', 'optimization', ['Indexes', 'WHERE'], 'ecommerce', ['google', 'amazon'], 55, 15,
    'Rewrite WHERE YEAR(order_date) = 2024 to be index-friendly (sargable).',
    "SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';",
    ['Functions on columns prevent index usage', 'Use range comparisons instead'],
    'Wrapping a column in a function (YEAR, UPPER, etc.) makes the predicate non-sargable, bypassing indexes.'
  ),
  p('sql-89', 'UNION ALL vs UNION', 'Easy', 'optimization', ['Query Plans'], 'hr', ['microsoft'], 78, 8,
    'Explain why UNION ALL is faster than UNION and rewrite a query that combines employee names from two departments.',
    "SELECT first_name, last_name FROM employees WHERE department_id = 1 UNION ALL SELECT first_name, last_name FROM employees WHERE department_id = 2;",
    ['UNION removes duplicates (requires sorting/hashing)', 'UNION ALL skips deduplication'],
    'UNION ALL is faster because it skips the expensive deduplication step. Use it when duplicates are acceptable.'
  ),
  p('sql-90', 'Pagination with OFFSET', 'Medium', 'optimization', ['LIMIT', 'Query Plans'], 'ecommerce', ['google', 'amazon'], 62, 12,
    'Write an efficient paginated query to get page 3 (items 21-30) of products sorted by price.',
    'SELECT product_id, product_name, price FROM products ORDER BY price, product_id LIMIT 10 OFFSET 20;',
    ['LIMIT sets page size', 'OFFSET skips rows', 'Include a unique column in ORDER BY for deterministic results'],
    'OFFSET-based pagination is simple but gets slower for deep pages. Keyset pagination is more efficient for large datasets.'
  ),
  p('sql-91', 'Anti-Join vs NOT IN', 'Medium', 'optimization', ['LEFT JOIN', 'NULL Handling', 'Indexes'], 'ecommerce', ['google'], 58, 15,
    'Rewrite NOT IN as a LEFT JOIN anti-pattern to find customers without orders (handles NULLs safely).',
    'SELECT c.* FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.order_id IS NULL;',
    ['LEFT JOIN + IS NULL is NULL-safe', 'NOT IN can return unexpected results with NULLs'],
    'LEFT JOIN anti-join is preferred over NOT IN because NOT IN returns no rows if any NULL exists in the subquery.'
  ),

  // ════════════════════════════════════════
  // DATA MANIPULATION (92-100)
  // ════════════════════════════════════════
  p('sql-92', 'INSERT Single Row', 'Easy', 'dml', ['INSERT'], 'ecommerce', ['amazon'], 92, 5,
    'Write a query to insert a new customer: "Frank Wilson", frank@mail.com, from Tokyo, Japan, signed up today.',
    "INSERT INTO customers (first_name, last_name, email, city, country, signup_date) VALUES ('Frank', 'Wilson', 'frank@mail.com', 'Tokyo', 'Japan', CURDATE());",
    ['INSERT INTO ... VALUES adds a new row', 'CURDATE() returns today\'s date'],
    'INSERT adds new rows. Column names and values must correspond in order and count.'
  ),
  p('sql-93', 'INSERT Multiple Rows', 'Easy', 'dml', ['INSERT'], 'ecommerce', ['amazon'], 88, 8,
    'Insert 3 new products at once into the products table.',
    "INSERT INTO products (product_name, category_id, price, stock_quantity, created_at) VALUES ('Pixel 9', 3, 699.99, 100, NOW()), ('iPad Air', 4, 599.99, 80, NOW()), ('Sony WH-1000XM5', 1, 349.99, 200, NOW());",
    ['Multiple VALUES clauses in one INSERT'],
    'Multi-row INSERT is more efficient than multiple single-row inserts.'
  ),
  p('sql-94', 'UPDATE with Condition', 'Easy', 'dml', ['UPDATE', 'WHERE'], 'ecommerce', ['amazon'], 85, 8,
    'Increase the price of all products in category 3 (Smartphones) by 10%.',
    'UPDATE products SET price = price * 1.10 WHERE category_id = 3;',
    ['UPDATE ... SET changes existing data', 'Always use WHERE to avoid updating all rows!'],
    'UPDATE modifies existing rows. Omitting WHERE updates every row in the table — a dangerous mistake.'
  ),
  p('sql-95', 'DELETE with Condition', 'Easy', 'dml', ['DELETE', 'WHERE'], 'ecommerce', ['amazon'], 82, 8,
    'Delete all cancelled orders.',
    "DELETE FROM orders WHERE status = 'cancelled';",
    ['DELETE removes rows', 'Always use WHERE to avoid deleting all data!'],
    'DELETE removes matching rows. Like UPDATE, always include WHERE unless you intend to clear the table.'
  ),
  p('sql-96', 'INSERT from SELECT', 'Medium', 'dml', ['INSERT', 'Subquery'], 'hr', ['google'], 65, 12,
    'Create a backup of all Engineering department employees by inserting them into an employees_backup table.',
    'INSERT INTO employees_backup SELECT * FROM employees WHERE department_id = 1;',
    ['INSERT ... SELECT copies data from one table to another'],
    'INSERT from SELECT is useful for data archiving, backup, and ETL operations.'
  ),
  p('sql-97', 'UPDATE with JOIN', 'Medium', 'dml', ['UPDATE', 'INNER JOIN'], 'ecommerce', ['amazon', 'google'], 55, 15,
    'Update the stock quantity of all products that have been ordered by subtracting the ordered quantity.',
    'UPDATE products p JOIN (SELECT product_id, SUM(quantity) AS total_ordered FROM order_items GROUP BY product_id) oi ON p.product_id = oi.product_id SET p.stock_quantity = p.stock_quantity - oi.total_ordered;',
    ['JOIN in UPDATE to reference another table', 'Aggregate ordered quantities first'],
    'UPDATE with JOIN allows modifying one table based on data from another — common in inventory systems.'
  ),
  p('sql-98', 'Transaction Basics', 'Medium', 'dml', ['Transactions'], 'banking', ['stripe', 'google'], 58, 15,
    'Write a transaction that transfers $500 from account 1001 to account 1002. Both operations must succeed or both must fail.',
    "START TRANSACTION; UPDATE accounts SET balance = balance - 500 WHERE account_id = 1001; UPDATE accounts SET balance = balance + 500 WHERE account_id = 1002; COMMIT;",
    ['START TRANSACTION begins atomic operations', 'COMMIT saves all changes', 'ROLLBACK would undo them all'],
    'Transactions ensure atomicity — either all operations succeed or none do. Critical for financial data.'
  ),
  p('sql-99', 'UPSERT / ON DUPLICATE', 'Medium', 'dml', ['INSERT', 'UPDATE'], 'inventory', ['amazon', 'google'], 52, 15,
    'Insert or update stock for product 1 in warehouse 1. If the entry exists, update the quantity; otherwise, insert a new record.',
    "INSERT INTO stock (product_id, warehouse_id, quantity, last_updated) VALUES (1, 1, 5000, NOW()) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), last_updated = NOW();",
    ['ON DUPLICATE KEY UPDATE handles conflicts', 'Avoids separate SELECT + INSERT/UPDATE logic'],
    'UPSERT (INSERT ... ON DUPLICATE KEY UPDATE) atomically inserts or updates based on unique constraints.'
  ),
  p('sql-100', 'Soft Delete Pattern', 'Medium', 'dml', ['UPDATE', 'WHERE'], 'ecommerce', ['google', 'amazon', 'meta'], 60, 12,
    'Instead of deleting cancelled orders, implement a soft delete by adding an is_deleted flag set to TRUE.',
    "UPDATE orders SET is_deleted = TRUE WHERE status = 'cancelled';",
    ['Soft deletes mark rows as deleted without removing them', 'Allows recovery and audit trails'],
    'Soft deletes preserve data for auditing and recovery. Applications filter with WHERE is_deleted = FALSE.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – GOOGLE (101-105)
  // ════════════════════════════════════════
  p('sql-101', 'Big Countries', 'Easy', 'basic', ['SELECT', 'WHERE'], 'world', ['google'], 82, 5,
    'A country is big if it has an area of at least 3 million sq km or a population of at least 25 million. Write a query to find the name, population, and area of the big countries.',
    "SELECT name, population, area FROM country WHERE area >= 3000000 OR population >= 25000000;",
    ['Use OR to combine two conditions', 'No need for JOIN — single table query'],
    'The OR operator allows matching rows that satisfy either condition. This is a classic filter-based query.'
  ),
  p('sql-102', 'Second Highest Salary', 'Medium', 'subqueries', ['Subquery', 'DISTINCT', 'ORDER BY', 'LIMIT'], 'hr', ['google', 'microsoft', 'amazon'], 65, 12,
    'Write a query to find the second highest distinct salary from the employees table. If there is no second highest salary, the query should return NULL.',
    "SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);",
    ['Use a subquery to find the maximum salary first', 'Then find the max salary less than that', 'Handle NULL with IFNULL if needed'],
    'This pattern uses a correlated approach: find the max, then find the max below it. Alternatively, use LIMIT 1 OFFSET 1 with DISTINCT.'
  ),
  p('sql-103', 'Nth Highest Salary', 'Medium', 'subqueries', ['Subquery', 'DISTINCT', 'ORDER BY', 'LIMIT'], 'hr', ['google', 'amazon'], 55, 15,
    'Write a query to find the Nth highest distinct salary. For example, find the 3rd highest salary.',
    "SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2;",
    ['Use DISTINCT to handle duplicate salaries', 'ORDER BY DESC puts highest first', 'OFFSET N-1 skips the top N-1 rows'],
    'The LIMIT/OFFSET approach is clean: DISTINCT removes dupes, ORDER BY DESC sorts highest first, and OFFSET skips to the Nth position.'
  ),
  p('sql-104', 'Rank Scores', 'Medium', 'window', ['DENSE_RANK'], 'hr', ['google'], 58, 12,
    'Write a query to rank scores in the employees table. Scores with the same value should have the same rank, and the next rank should be consecutive (dense ranking).',
    "SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rank FROM employees;",
    ['Use DENSE_RANK() for consecutive rankings', 'OVER (ORDER BY ...) defines the ranking order'],
    'DENSE_RANK assigns consecutive ranks without gaps. Unlike RANK(), ties get the same rank and the next rank is not skipped.'
  ),
  p('sql-105', 'Consecutive Numbers', 'Medium', 'advanced', ['SELF JOIN', 'WHERE'], 'ecommerce', ['google'], 48, 15,
    'Write a query to find all numbers that appear at least three times consecutively in a log table. Use the orders table and find order IDs where the same customer placed at least 3 consecutive orders.',
    "SELECT DISTINCT a.customer_id FROM orders a JOIN orders b ON a.order_id = b.order_id - 1 JOIN orders c ON b.order_id = c.order_id - 1 WHERE a.customer_id = b.customer_id AND b.customer_id = c.customer_id;",
    ['Self-join the table three times', 'Match consecutive IDs', 'Check that all three rows have the same value'],
    'Self-joining with ID offsets detects consecutive sequences. Three-way join catches triplets where all share the same value.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – MICROSOFT (106-110)
  // ════════════════════════════════════════
  p('sql-106', 'Combine Two Tables', 'Easy', 'joins', ['LEFT JOIN'], 'hr', ['microsoft'], 85, 8,
    'Write a query to report the first name, last name, city and state for each person, including people who do not have address information.',
    "SELECT e.first_name, e.last_name, d.department_name AS city, e.hire_date FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id;",
    ['Use LEFT JOIN to include people without addresses', 'LEFT JOIN keeps all rows from the left table'],
    'LEFT JOIN preserves all rows from the left table regardless of whether there is a match in the right table. Unmatched rows show NULL.'
  ),
  p('sql-107', 'Employees Earning More Than Their Managers', 'Easy', 'joins', ['SELF JOIN'], 'hr', ['microsoft', 'amazon'], 78, 10,
    'Write a query to find employees who earn more than their managers.',
    "SELECT e.first_name AS Employee FROM employees e JOIN employees m ON e.department_id = m.department_id WHERE e.salary > m.salary AND e.employee_id != m.employee_id;",
    ['Self-join the employee table', 'Compare salaries between employee and manager', 'Use different aliases for each copy of the table'],
    'Self-joins allow comparing rows within the same table. Here, we join employees to themselves to compare each employee with their manager.'
  ),
  p('sql-108', 'Duplicate Emails', 'Easy', 'aggregations', ['GROUP BY', 'HAVING', 'COUNT'], 'ecommerce', ['microsoft'], 80, 8,
    'Write a query to find all duplicate email addresses in the customers table.',
    "SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1;",
    ['GROUP BY groups identical emails', 'HAVING filters groups', 'COUNT(*) > 1 identifies duplicates'],
    'GROUP BY with HAVING COUNT(*) > 1 is the standard pattern for finding duplicates in any column.'
  ),
  p('sql-109', 'Department Top Three Salaries', 'Hard', 'window', ['DENSE_RANK', 'Subquery'], 'hr', ['microsoft', 'google'], 42, 20,
    'Write a query to find employees who earn one of the top three distinct salaries in each department.',
    "SELECT department_name, first_name, salary FROM (SELECT e.first_name, e.salary, d.department_name, DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rk FROM employees e JOIN departments d ON e.department_id = d.department_id) ranked WHERE rk <= 3;",
    ['Use DENSE_RANK() with PARTITION BY department', 'Wrap in a subquery and filter for rank <= 3'],
    'PARTITION BY creates separate ranking groups per department. DENSE_RANK ensures ties share ranks without gaps.'
  ),
  p('sql-110', 'Trips and Users', 'Hard', 'advanced', ['CASE', 'GROUP BY', 'LEFT JOIN'], 'ecommerce', ['microsoft'], 38, 25,
    'Write a query to find the cancellation rate of requests with unbanned users for each day. The cancellation rate is computed by dividing the number of cancelled requests by the total number of requests.',
    "SELECT order_date, ROUND(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancellation_rate FROM orders GROUP BY order_date;",
    ['Use CASE to count cancelled requests', 'Divide by total COUNT', 'ROUND for clean output'],
    'CASE inside SUM creates conditional aggregation. Dividing by COUNT(*) gives the ratio, and ROUND formats the decimal.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – AMAZON (111-115)
  // ════════════════════════════════════════
  p('sql-111', 'Delete Duplicate Emails', 'Easy', 'dml', ['DELETE', 'SELF JOIN'], 'ecommerce', ['amazon'], 70, 10,
    'Write a query to delete all duplicate email entries in the customers table, keeping only the one with the smallest ID.',
    "DELETE c1 FROM customers c1 JOIN customers c2 ON c1.email = c2.email WHERE c1.customer_id > c2.customer_id;",
    ['Self-join on email to find duplicates', 'Delete the one with the larger ID', 'Keep the smallest ID for each email'],
    'Self-join with DELETE removes duplicates by comparing IDs. The larger ID row gets deleted while the smaller one is preserved.'
  ),
  p('sql-112', 'Rising Temperature', 'Easy', 'joins', ['SELF JOIN', 'Date Functions'], 'ecommerce', ['amazon'], 72, 10,
    'Write a query to find all dates where the temperature was higher than the previous day. Use the orders table to find orders where the total amount was higher than the previous day.',
    "SELECT a.order_id, a.order_date FROM orders a JOIN orders b ON DATE(a.order_date) = DATE(b.order_date) + INTERVAL 1 DAY WHERE a.total_amount > b.total_amount;",
    ['Self-join with date arithmetic', 'Compare today vs yesterday', 'Use DATE functions for date manipulation'],
    'Self-joining with a date offset lets you compare consecutive days. DATE arithmetic adds or subtracts intervals from dates.'
  ),
  p('sql-113', 'Game Play Analysis I', 'Easy', 'aggregations', ['MIN', 'GROUP BY'], 'ecommerce', ['amazon'], 75, 8,
    'Write a query to find the first login date for each customer.',
    "SELECT customer_id, MIN(order_date) AS first_login FROM orders GROUP BY customer_id;",
    ['Use MIN() to find the earliest date', 'GROUP BY to get one result per customer'],
    'MIN() with GROUP BY finds the earliest value for each group. This pattern is fundamental for finding first occurrences.'
  ),
  p('sql-114', 'Market Analysis I', 'Medium', 'joins', ['LEFT JOIN', 'COUNT', 'GROUP BY'], 'ecommerce', ['amazon'], 55, 15,
    'Write a query to find for each customer the join date and the number of orders they made in 2023.',
    "SELECT c.customer_id, c.signup_date, COUNT(o.order_id) AS orders_2023 FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id AND YEAR(o.order_date) = 2023 GROUP BY c.customer_id, c.signup_date;",
    ['Use LEFT JOIN to include customers with no orders', 'Filter by year in the JOIN condition, not WHERE', 'COUNT on the right table column'],
    'Placing the date filter in the JOIN condition (not WHERE) ensures customers with zero orders still appear with a count of 0.'
  ),
  p('sql-115', 'Capital Gain/Loss', 'Medium', 'aggregations', ['CASE', 'SUM', 'GROUP BY'], 'banking', ['amazon'], 58, 12,
    'Write a query to report the capital gain/loss for each transaction type. Sum gains and subtract losses.',
    "SELECT transaction_type, SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END) AS net_amount FROM transactions GROUP BY transaction_type;",
    ['Use CASE to conditionally add or subtract amounts', 'SUM aggregates the net result', 'GROUP BY to separate by type'],
    'CASE inside SUM allows conditional aggregation — adding for buys and subtracting for sells to compute net gain/loss.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – TCS (116-120)
  // ════════════════════════════════════════
  p('sql-116', 'Select All', 'Easy', 'basic', ['SELECT'], 'world', ['tcs'], 95, 3,
    'Write a query to select all columns and rows from the city table.',
    "SELECT * FROM city;",
    ['SELECT * retrieves all columns', 'No WHERE clause needed for all rows'],
    'The simplest SQL query — SELECT * FROM table returns every column and every row.'
  ),
  p('sql-117', 'Revising the Select Query I', 'Easy', 'basic', ['SELECT', 'WHERE'], 'world', ['tcs'], 90, 5,
    'Write a query to select all cities with a population larger than 100,000 that are in the countrycode "USA".',
    "SELECT * FROM city WHERE population > 100000 AND countrycode = 'USA';",
    ['Combine conditions with AND', 'Use > for numeric comparisons'],
    'Multiple WHERE conditions combined with AND require all conditions to be true for a row to be included.'
  ),
  p('sql-118', 'Japanese Cities Names', 'Easy', 'basic', ['SELECT', 'WHERE'], 'world', ['tcs'], 88, 5,
    'Write a query to select the names of all cities where the countrycode is "JPN".',
    "SELECT name FROM city WHERE countrycode = 'JPN';",
    ['Select only the name column', 'Filter by countrycode'],
    'Selecting specific columns instead of * is best practice when you only need certain fields.'
  ),
  p('sql-119', 'Weather Observation Station 1', 'Easy', 'basic', ['SELECT'], 'geography', ['tcs'], 90, 5,
    'Write a query to select the city and state columns from the station table.',
    "SELECT city, state FROM station;",
    ['Select only the required columns', 'No filtering needed'],
    'Selecting specific columns from a table. This is more efficient than SELECT * when only certain columns are needed.'
  ),
  p('sql-120', 'Employee Salaries', 'Easy', 'basic', ['SELECT', 'WHERE', 'ORDER BY'], 'hackerrank', ['tcs'], 85, 5,
    'Write a query to find the names of employees whose salary exceeds $2000 per month and who have worked for less than 10 months. Sort by employee_id.',
    "SELECT name FROM employee WHERE salary > 2000 AND months < 10 ORDER BY employee_id;",
    ['Use AND to combine salary and months conditions', 'ORDER BY for sorting'],
    'Combining WHERE conditions with AND and adding ORDER BY for sorted output is a fundamental SQL pattern.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – INFOSYS (121-125)
  // ════════════════════════════════════════
  p('sql-121', 'Higher Than 75 Marks', 'Easy', 'basic', ['SELECT', 'WHERE', 'ORDER BY', 'String Functions'], 'hackerrank', ['infosys'], 82, 8,
    'Write a query to find student names who scored higher than 75. Order output by the last three characters of the name, then by ID.',
    "SELECT name FROM students WHERE marks > 75 ORDER BY RIGHT(name, 3), id;",
    ['Use RIGHT() to extract last 3 characters', 'ORDER BY can use function results', 'Secondary sort by id for ties'],
    'String functions like RIGHT() or SUBSTR() can be used in ORDER BY. Multiple sort keys handle ties.'
  ),
  p('sql-122', 'Employee Names', 'Easy', 'basic', ['SELECT', 'ORDER BY'], 'hackerrank', ['infosys'], 88, 5,
    'Write a query to print the names of all employees from the employee table, sorted alphabetically.',
    "SELECT name FROM employee ORDER BY name;",
    ['Simple SELECT with ORDER BY', 'Default sort is ascending (A-Z)'],
    'ORDER BY without specifying ASC or DESC defaults to ascending order, which gives alphabetical sorting for strings.'
  ),
  p('sql-123', 'Top Earners', 'Medium', 'aggregations', ['MAX', 'COUNT', 'GROUP BY'], 'hackerrank', ['infosys'], 62, 12,
    'Write a query to find the maximum total earnings (salary × months) among all employees, and the count of employees who earn that maximum.',
    "SELECT MAX(salary * months) AS max_earnings, COUNT(*) FROM employee WHERE salary * months = (SELECT MAX(salary * months) FROM employee);",
    ['Calculate earnings as salary × months', 'Use MAX to find the highest', 'Count employees at that max level'],
    'Computed expressions (salary * months) can be used in aggregations. The subquery finds the max, and the outer query counts matches.'
  ),
  p('sql-124', 'Weather Observation Station 3', 'Easy', 'basic', ['SELECT', 'DISTINCT', 'WHERE'], 'geography', ['infosys'], 80, 8,
    'Write a query to get a list of distinct city names from the station table where the city ID is even (i.e., ID % 2 = 0).',
    "SELECT DISTINCT city FROM station WHERE id % 2 = 0;",
    ['Use modulo (%) to check for even numbers', 'DISTINCT removes duplicate city names'],
    'The modulo operator (%) returns the remainder of division. id % 2 = 0 selects even IDs.'
  ),
  p('sql-125', 'Occupations', 'Medium', 'advanced', ['CASE', 'ROW_NUMBER', 'GROUP BY'], 'hackerrank', ['infosys'], 45, 20,
    'Write a query to pivot the occupations column so that each occupation has its own column, listing the names alphabetically under each.',
    "SELECT MAX(CASE WHEN occupation = 'Doctor' THEN name END) AS Doctor, MAX(CASE WHEN occupation = 'Professor' THEN name END) AS Professor, MAX(CASE WHEN occupation = 'Singer' THEN name END) AS Singer, MAX(CASE WHEN occupation = 'Actor' THEN name END) AS Actor FROM (SELECT name, occupation, ROW_NUMBER() OVER (PARTITION BY occupation ORDER BY name) AS rn FROM occupations) t GROUP BY rn;",
    ['Use ROW_NUMBER to create row identifiers per occupation', 'CASE WHEN pivots columns', 'GROUP BY the row number'],
    'Pivoting transforms rows into columns. ROW_NUMBER assigns a sequence per group, and CASE WHEN selects values for each new column.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – WIPRO (126-130)
  // ════════════════════════════════════════
  p('sql-126', 'Average Population of Each Continent', 'Easy', 'aggregations', ['AVG', 'GROUP BY', 'INNER JOIN'], 'world', ['wipro'], 78, 8,
    'Write a query to find the average population for each continent, calculated using the city populations.',
    "SELECT co.continent, FLOOR(AVG(ci.population)) AS avg_population FROM city ci JOIN country co ON ci.countrycode = co.name GROUP BY co.continent;",
    ['JOIN city with country on country code', 'Use AVG() for the average', 'FLOOR rounds down to integer'],
    'Joining tables and aggregating with GROUP BY gives continent-level statistics. FLOOR removes decimal places.'
  ),
  p('sql-127', 'The Report', 'Medium', 'joins', ['INNER JOIN', 'CASE', 'ORDER BY'], 'hackerrank', ['wipro'], 55, 15,
    'Write a query to generate a report of student grades. If a student scored 70 or above, display the name alongside the grade; otherwise, display NULL for the name.',
    "SELECT CASE WHEN marks >= 70 THEN name ELSE NULL END AS name, CASE WHEN marks >= 90 THEN 'A' WHEN marks >= 80 THEN 'B' WHEN marks >= 70 THEN 'C' ELSE 'F' END AS grade, marks FROM students ORDER BY grade DESC, name;",
    ['Use CASE WHEN for conditional display', 'NULLify names below threshold', 'Multi-level ORDER BY'],
    'CASE WHEN creates conditional logic in SELECT. Displaying NULL for certain rows is a common reporting requirement.'
  ),
  p('sql-128', 'Population Census', 'Easy', 'aggregations', ['SUM', 'INNER JOIN', 'WHERE'], 'world', ['wipro'], 75, 8,
    'Write a query to find the total population of all Asian cities.',
    "SELECT SUM(ci.population) AS total_population FROM city ci JOIN country co ON ci.countrycode = co.name WHERE co.continent = 'Asia';",
    ['JOIN city and country tables', 'Filter by continent', 'SUM the city populations'],
    'Joining tables, filtering with WHERE, and aggregating with SUM gives the total population for a specific continent.'
  ),
  p('sql-129', 'African Cities', 'Easy', 'joins', ['INNER JOIN', 'WHERE'], 'world', ['wipro'], 78, 8,
    'Write a query to list the names of all cities located in Africa.',
    "SELECT ci.name FROM city ci JOIN country co ON ci.countrycode = co.name WHERE co.continent = 'Africa';",
    ['JOIN city with country', 'Filter by Africa as the continent'],
    'A straightforward JOIN with a WHERE filter to select cities belonging to a specific continent.'
  ),
  p('sql-130', 'Type of Triangle', 'Easy', 'advanced', ['CASE'], 'hackerrank', ['wipro'], 72, 10,
    'Write a query to classify each record in the triangles table as Equilateral, Isosceles, Scalene, or Not A Triangle.',
    "SELECT CASE WHEN a + b <= c OR a + c <= b OR b + c <= a THEN 'Not A Triangle' WHEN a = b AND b = c THEN 'Equilateral' WHEN a = b OR b = c OR a = c THEN 'Isosceles' ELSE 'Scalene' END AS triangle_type FROM triangles;",
    ['Check triangle inequality first', 'Then check for equal sides', 'Order of CASE conditions matters'],
    'CASE WHEN evaluates conditions in order. Check validity first (triangle inequality), then classify by side equality.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – ACCENTURE (131-135)
  // ════════════════════════════════════════
  p('sql-131', 'Binary Tree Nodes', 'Medium', 'advanced', ['CASE', 'Subquery'], 'hackerrank', ['accenture'], 52, 15,
    'Write a query to classify each node in the BST table as Root, Leaf, or Inner based on its parent value.',
    "SELECT n, CASE WHEN p IS NULL THEN 'Root' WHEN n NOT IN (SELECT DISTINCT p FROM bst WHERE p IS NOT NULL) THEN 'Leaf' ELSE 'Inner' END AS node_type FROM bst ORDER BY n;",
    ['Root has NULL parent', 'Leaf nodes are not parents of any other node', 'Use NOT IN with a subquery to check'],
    'Root nodes have p IS NULL. Leaf nodes never appear as a parent (p) of other nodes. Everything else is Inner.'
  ),
  p('sql-132', 'New Companies', 'Medium', 'aggregations', ['COUNT', 'DISTINCT', 'GROUP BY', 'INNER JOIN'], 'company_hierarchy', ['accenture'], 55, 15,
    'Write a query to print the company code, founder name, and the total distinct count of lead managers, senior managers, managers, and employees.',
    "SELECT c.company_code, c.founder, COUNT(DISTINCT lm.lead_manager_code), COUNT(DISTINCT sm.senior_manager_code), COUNT(DISTINCT m.manager_code), COUNT(DISTINCT eh.employee_code) FROM company c LEFT JOIN lead_manager lm ON c.company_code = lm.company_code LEFT JOIN senior_manager sm ON c.company_code = sm.company_code LEFT JOIN manager m ON c.company_code = m.company_code LEFT JOIN employee_hierarchy eh ON c.company_code = eh.company_code GROUP BY c.company_code, c.founder ORDER BY c.company_code;",
    ['JOIN all hierarchy tables to the company table', 'Use COUNT(DISTINCT ...) for each level', 'GROUP BY company'],
    'Multiple LEFT JOINs connect all organizational levels. COUNT(DISTINCT) prevents duplicates from inflating counts.'
  ),
  p('sql-133', 'Weather Observation Station 18', 'Medium', 'aggregations', ['MIN', 'MAX', 'ABS'], 'geography', ['accenture'], 60, 10,
    'Write a query to find the Manhattan distance between the smallest and largest latitude/longitude values in the station table. Manhattan Distance = |min_lat - max_lat| + |min_long - max_long|.',
    "SELECT ROUND(ABS(MIN(lat_n) - MAX(lat_n)) + ABS(MIN(long_w) - MAX(long_w)), 4) AS manhattan_distance FROM station;",
    ['Use MIN and MAX for extreme values', 'ABS for absolute difference', 'Manhattan distance is sum of absolute differences'],
    'Manhattan distance is the sum of absolute differences along each axis. MIN/MAX find the extremes, ABS ensures positive result.'
  ),
  p('sql-134', 'The PADS', 'Medium', 'advanced', ['String Functions', 'CONCAT', 'ORDER BY'], 'hackerrank', ['accenture'], 50, 12,
    'Write a query that generates two result sets: 1) Names with their occupation initial in parentheses, 2) Count of each occupation with formatted text.',
    "SELECT CONCAT(name, '(', LEFT(occupation, 1), ')') FROM occupations ORDER BY name;",
    ['CONCAT joins strings together', 'LEFT() extracts the first character', 'Separate queries for each result set'],
    'String functions like CONCAT and LEFT/SUBSTR build formatted output. Multiple SELECT queries can be combined with UNION.'
  ),
  p('sql-135', 'Symmetric Pairs', 'Medium', 'joins', ['SELF JOIN', 'WHERE', 'GROUP BY'], 'coding_contest', ['accenture', 'cognizant'], 48, 15,
    'For the functions table, write a query to find all symmetric pairs (where f(a)=b and f(b)=a). Output pairs where the first value is less than or equal to the second.',
    "SELECT f1.hacker_id AS x, f2.hacker_id AS y FROM hackers f1 JOIN hackers f2 ON f1.hacker_id = f2.name WHERE f1.hacker_id <= f2.hacker_id GROUP BY f1.hacker_id, f2.hacker_id HAVING COUNT(*) > 1 OR f1.hacker_id < f2.hacker_id;",
    ['Self-join to find matching pairs', 'Ensure x <= y to avoid duplicates', 'Handle equal pairs separately with HAVING'],
    'Symmetric pairs are found by self-joining and matching reversed values. The x <= y condition eliminates duplicate reversed output.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – COGNIZANT (136-140)
  // ════════════════════════════════════════
  p('sql-136', 'Challenges', 'Medium', 'aggregations', ['COUNT', 'GROUP BY', 'HAVING', 'Subquery'], 'coding_contest', ['cognizant'], 50, 18,
    'Write a query to print the hacker_id, name, and the total number of challenges created by each hacker. Sort by challenge count descending, then by hacker_id. Exclude hackers whose count matches another hacker unless it is the maximum count.',
    "SELECT h.hacker_id, h.name, COUNT(c.challenge_id) AS cnt FROM hackers h JOIN challenges c ON h.hacker_id = c.hacker_id GROUP BY h.hacker_id, h.name HAVING cnt = (SELECT MAX(cnt2) FROM (SELECT COUNT(*) AS cnt2 FROM challenges GROUP BY hacker_id) t) OR cnt NOT IN (SELECT cnt3 FROM (SELECT COUNT(*) AS cnt3 FROM challenges GROUP BY hacker_id) t2 GROUP BY cnt3 HAVING COUNT(*) > 1) ORDER BY cnt DESC, h.hacker_id;",
    ['Count challenges per hacker', 'Use HAVING to filter non-unique counts', 'Allow the maximum count even if non-unique'],
    'This complex filter uses subqueries in HAVING to eliminate non-unique challenge counts while preserving the maximum.'
  ),
  p('sql-137', 'Contest Leaderboard', 'Medium', 'aggregations', ['MAX', 'SUM', 'GROUP BY', 'Subquery'], 'coding_contest', ['cognizant'], 52, 15,
    'Write a query to find the total score of each hacker. The score for each challenge is the maximum score achieved. Exclude hackers with a total score of 0.',
    "SELECT h.hacker_id, h.name, SUM(max_score) AS total_score FROM hackers h JOIN (SELECT hacker_id, challenge_id, MAX(score) AS max_score FROM submissions GROUP BY hacker_id, challenge_id) s ON h.hacker_id = s.hacker_id GROUP BY h.hacker_id, h.name HAVING total_score > 0 ORDER BY total_score DESC, h.hacker_id;",
    ['First find max score per hacker per challenge', 'Then sum those max scores per hacker', 'Exclude zero totals with HAVING'],
    'Nested aggregation: inner query finds max per challenge, outer query sums across challenges per hacker.'
  ),
  p('sql-138', 'SQL Project Planning', 'Medium', 'advanced', ['Date Functions', 'Subquery', 'ORDER BY'], 'coding_contest', ['cognizant'], 45, 20,
    'Write a query to find the start and end dates of each project. Tasks with consecutive dates belong to the same project.',
    "SELECT MIN(start_date) AS project_start, MAX(end_date) AS project_end FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY start_date) AS rn, DATEDIFF(start_date, '2024-01-01') - ROW_NUMBER() OVER (ORDER BY start_date) AS grp FROM projects) t GROUP BY grp ORDER BY DATEDIFF(MAX(end_date), MIN(start_date)), MIN(start_date);",
    ['Group consecutive dates using the row_number trick', 'The difference between date and row_number is constant for consecutive dates', 'ORDER BY project duration then start date'],
    'The consecutive-groups trick: for sequential dates, date minus row_number produces the same value, creating natural groupings.'
  ),
  p('sql-139', 'Placements', 'Medium', 'joins', ['INNER JOIN', 'WHERE'], 'coding_contest', ['cognizant'], 55, 15,
    'Write a query to output student names whose best friend got a higher salary offer than they did.',
    "SELECT f.id FROM friends f JOIN packages p1 ON f.id = p1.id JOIN packages p2 ON f.friend_id = p2.id WHERE p2.salary > p1.salary ORDER BY p2.salary;",
    ['Join friends with packages twice', 'Compare student and friend salaries', 'Order by friend salary'],
    'Double-joining the packages table (once for student, once for friend) enables direct salary comparison between pairs.'
  ),
  p('sql-140', 'Symmetric Pairs (Cognizant)', 'Medium', 'joins', ['SELF JOIN', 'WHERE', 'GROUP BY'], 'coding_contest', ['cognizant'], 48, 15,
    'For a functions table with X and Y columns, write a query to find symmetric pairs where f(X1)=Y1 and f(X2)=Y2 such that X1=Y2 and X2=Y1. Output X ≤ Y only.',
    "SELECT f1.hacker_id AS x, f2.hacker_id AS y FROM hackers f1 JOIN hackers f2 ON f1.hacker_id = f2.name WHERE f1.hacker_id <= f2.hacker_id GROUP BY f1.hacker_id, f2.hacker_id HAVING COUNT(*) > 1 OR f1.hacker_id < f2.hacker_id;",
    ['Self-join matching X↔Y pairs', 'Filter X <= Y to prevent duplicates'],
    'Symmetric pairs require cross-matching values. Self-join finds where one row X,Y matches another row Y,X.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – CAPGEMINI (141-145)
  // ════════════════════════════════════════
  p('sql-141', 'Draw The Triangle 1', 'Easy', 'advanced', ['String Functions', 'CTE'], 'hackerrank', ['capgemini'], 68, 10,
    'Write a query to print a descending triangle pattern of asterisks: 20 stars on line 1, 19 on line 2, ... 1 star on line 20.',
    "WITH RECURSIVE nums AS (SELECT 20 AS n UNION ALL SELECT n - 1 FROM nums WHERE n > 1) SELECT REPEAT('* ', n) FROM nums;",
    ['Use a recursive CTE to generate numbers 20 to 1', 'REPEAT creates the star pattern', 'Each iteration reduces by 1'],
    'Recursive CTEs generate sequences. REPEAT() or string concatenation creates patterns of varying length.'
  ),
  p('sql-142', 'Draw The Triangle 2', 'Easy', 'advanced', ['String Functions', 'CTE'], 'hackerrank', ['capgemini'], 68, 10,
    'Write a query to print an ascending triangle pattern of asterisks: 1 star on line 1, 2 on line 2, ... 20 stars on line 20.',
    "WITH RECURSIVE nums AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 20) SELECT REPEAT('* ', n) FROM nums;",
    ['Use a recursive CTE to generate numbers 1 to 20', 'REPEAT creates the star pattern', 'Each iteration increases by 1'],
    'Similar to the descending triangle but starting from 1 and incrementing. Recursive CTEs handle sequence generation elegantly.'
  ),
  p('sql-143', 'Print Prime Numbers', 'Medium', 'advanced', ['CTE', 'Recursive CTE', 'String Functions'], 'hackerrank', ['capgemini'], 42, 20,
    'Write a query to print all prime numbers up to 1000 separated by ampersands.',
    "WITH RECURSIVE nums AS (SELECT 2 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 1000) SELECT GROUP_CONCAT(n SEPARATOR '&') FROM nums x WHERE NOT EXISTS (SELECT 1 FROM nums d WHERE d.n > 1 AND d.n < x.n AND x.n % d.n = 0);",
    ['Generate numbers 2-1000 with recursive CTE', 'Check each for prime using NOT EXISTS', 'Concatenate with GROUP_CONCAT'],
    'Prime checking uses NOT EXISTS with a divisibility test. GROUP_CONCAT joins results into a single string with a custom separator.'
  ),
  p('sql-144', 'Weather Observation Station 20', 'Medium', 'window', ['ROW_NUMBER', 'COUNT', 'Subquery'], 'geography', ['capgemini'], 50, 15,
    'Write a query to find the median latitude value from the station table. Round to 4 decimal places.',
    "SELECT ROUND(lat_n, 4) AS median FROM (SELECT lat_n, ROW_NUMBER() OVER (ORDER BY lat_n) AS rn, COUNT(*) OVER () AS total FROM station) t WHERE rn = FLOOR((total + 1) / 2);",
    ['Use ROW_NUMBER to assign position', 'COUNT OVER () gets total rows', 'Median is at position (total+1)/2'],
    'Finding the median requires sorting and selecting the middle value. ROW_NUMBER with COUNT OVER() identifies the middle position.'
  ),
  p('sql-145', 'Interviews', 'Hard', 'aggregations', ['SUM', 'GROUP BY', 'INNER JOIN'], 'company_hierarchy', ['capgemini'], 38, 25,
    'Write a query to print contest_id, hacker_id, name, and the sums of total_submissions, total_accepted_submissions, total_views, and total_unique_views. Exclude rows where all four sums are zero.',
    "SELECT contest_id, hacker_id, SUM(total_submissions), SUM(total_accepted), SUM(total_views), SUM(total_unique_views) FROM interviews_table GROUP BY contest_id, hacker_id HAVING SUM(total_submissions) + SUM(total_accepted) + SUM(total_views) + SUM(total_unique_views) > 0 ORDER BY contest_id;",
    ['SUM each metric column', 'GROUP BY contest and hacker', 'HAVING filters out all-zero rows'],
    'Multiple SUM aggregations in a single query with GROUP BY. HAVING eliminates groups where every aggregated value is zero.'
  ),

  // ════════════════════════════════════════
  // DAILY CHALLENGE SQL – HCL (146-150)
  // ════════════════════════════════════════
  p('sql-146', '15 Days of Learning SQL', 'Hard', 'advanced', ['CTE', 'ROW_NUMBER', 'COUNT', 'DENSE_RANK'], 'coding_contest', ['hcl'], 32, 30,
    'Write a query to find the total number of unique hackers who made at least 1 submission each day (starting on the first day), and the hacker who made the maximum submissions each day.',
    "WITH daily AS (SELECT submission_date, hacker_id, COUNT(*) AS cnt FROM submissions GROUP BY submission_date, hacker_id), ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY submission_date ORDER BY cnt DESC, hacker_id) AS rn FROM daily) SELECT r.submission_date, (SELECT COUNT(DISTINCT hacker_id) FROM submissions s WHERE s.submission_date <= r.submission_date) AS unique_hackers, r.hacker_id, h.name FROM ranked r JOIN hackers h ON r.hacker_id = h.hacker_id WHERE r.rn = 1 ORDER BY r.submission_date;",
    ['Count submissions per hacker per day', 'Use ROW_NUMBER to rank by count per day', 'Count distinct hackers cumulatively'],
    'This complex query combines daily aggregation, ranking, and cumulative counting across multiple dimensions.'
  ),
  p('sql-147', 'SQL Project Planning', 'Medium', 'advanced', ['Date Functions', 'Subquery', 'ORDER BY'], 'coding_contest', ['hcl'], 45, 20,
    'Write a query to find projects by grouping consecutive task dates. Output the start and end dates, ordered by project duration then start date.',
    "SELECT MIN(start_date) AS project_start, MAX(end_date) AS project_end FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY start_date) AS rn, DATEDIFF(start_date, '2024-01-01') - ROW_NUMBER() OVER (ORDER BY start_date) AS grp FROM projects) t GROUP BY grp ORDER BY DATEDIFF(MAX(end_date), MIN(start_date)), MIN(start_date);",
    ['Use the gaps-and-islands technique', 'Consecutive dates form "islands"', 'date minus row_number is constant for consecutive dates'],
    'The gaps-and-islands algorithm: subtracting row_number from a sequential value produces a constant for consecutive groups.'
  ),
  p('sql-148', 'Ollivanders Inventory', 'Medium', 'joins', ['INNER JOIN', 'MIN', 'GROUP BY'], 'coding_contest', ['hcl'], 48, 18,
    'Write a query to find the minimum coins needed for each non-evil wand at each (power, age) combination.',
    "SELECT w.id, wp.age, w.coins_needed, w.power FROM wands w JOIN wands_property wp ON w.code = wp.code WHERE wp.is_evil = FALSE AND w.coins_needed = (SELECT MIN(w2.coins_needed) FROM wands w2 JOIN wands_property wp2 ON w2.code = wp2.code WHERE wp2.is_evil = FALSE AND w2.power = w.power AND wp2.age = wp.age) ORDER BY w.power DESC, wp.age DESC;",
    ['Join wands with wands_property', 'Filter out evil wands', 'Use correlated subquery for minimum coins per group'],
    'Correlated subquery finds the minimum coins for each (power, age) group while the outer query retrieves full wand details.'
  ),
  p('sql-149', 'Top Competitors', 'Medium', 'joins', ['INNER JOIN', 'COUNT', 'GROUP BY', 'HAVING'], 'coding_contest', ['hcl'], 50, 15,
    'Write a query to find hackers who achieved full scores on more than one challenge. Print hacker_id and name, sorted by challenge count descending then hacker_id.',
    "SELECT h.hacker_id, h.name FROM hackers h JOIN submissions s ON h.hacker_id = s.hacker_id JOIN challenges c ON s.challenge_id = c.challenge_id WHERE s.score = c.difficulty_level * 100 GROUP BY h.hacker_id, h.name HAVING COUNT(DISTINCT s.challenge_id) > 1 ORDER BY COUNT(DISTINCT s.challenge_id) DESC, h.hacker_id;",
    ['Join all three tables', 'Match score with full mark condition', 'COUNT distinct challenges with HAVING > 1'],
    'Multi-table joins combined with conditional filtering and HAVING create powerful analytical queries.'
  ),
  p('sql-150', 'The Blunder', 'Easy', 'aggregations', ['AVG', 'REPLACE', 'CEIL'], 'hackerrank', ['hcl'], 65, 10,
    'Write a query to find the difference between the actual average salary and the miscalculated average (where all zeros are removed from salaries). Round up to the next integer.',
    "SELECT CEIL(AVG(salary) - AVG(CAST(REPLACE(CAST(salary AS CHAR), '0', '') AS UNSIGNED))) AS error FROM employee;",
    ['REPLACE removes zeros from the string', 'CAST converts between types', 'CEIL rounds up to the next integer'],
    'String manipulation on numeric data: CAST to string, REPLACE zeros, CAST back to number, then compare averages.'
  ),
];

// ═══ Helper Functions ═══
export const getSQLProblemById = (id) => SQL_PROBLEMS.find(p => p.id === id);
export const getSQLProblemsByCategory = (cat) => SQL_PROBLEMS.filter(p => p.category === cat);
export const getSQLProblemsByDifficulty = (diff) => SQL_PROBLEMS.filter(p => p.difficulty === diff);
export const getSQLProblemsBySchema = (schemaId) => SQL_PROBLEMS.filter(p => p.schemaId === schemaId);

