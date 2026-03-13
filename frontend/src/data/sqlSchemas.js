// ─── SQL Schemas for Practice Problems ───
// 7 real-world database schemas with tables, columns, types, constraints, sample data, and relationships.

export const SQL_SCHEMAS = [
  // ═══════════════════════════════════════════════════════════
  // 1. E-COMMERCE DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Online marketplace with customers, products, orders, and reviews.',
    icon: '🛒',
    color: '#f59e0b',
    tables: [
      {
        name: 'customers',
        columns: [
          { name: 'customer_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique customer identifier' },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false, description: 'Customer first name' },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false, description: 'Customer last name' },
          { name: 'email', type: 'VARCHAR(100)', nullable: false, unique: true, description: 'Customer email address' },
          { name: 'city', type: 'VARCHAR(50)', nullable: true, description: 'City of residence' },
          { name: 'country', type: 'VARCHAR(50)', nullable: true, description: 'Country of residence' },
          { name: 'signup_date', type: 'DATE', nullable: false, description: 'Account creation date' },
        ],
        sampleData: [
          [1, 'Alice', 'Johnson', 'alice@mail.com', 'New York', 'USA', '2023-01-15'],
          [2, 'Bob', 'Smith', 'bob@mail.com', 'London', 'UK', '2023-02-20'],
          [3, 'Carol', 'Williams', 'carol@mail.com', 'Toronto', 'Canada', '2023-03-10'],
          [4, 'David', 'Brown', 'david@mail.com', 'Sydney', 'Australia', '2023-04-05'],
          [5, 'Eve', 'Davis', 'eve@mail.com', 'Berlin', 'Germany', '2023-05-12'],
        ],
      },
      {
        name: 'categories',
        columns: [
          { name: 'category_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique category identifier' },
          { name: 'category_name', type: 'VARCHAR(50)', nullable: false, description: 'Category name' },
          { name: 'parent_category_id', type: 'INT', nullable: true, foreignKey: { table: 'categories', column: 'category_id' }, description: 'Parent category for hierarchy' },
        ],
        sampleData: [
          [1, 'Electronics', null],
          [2, 'Clothing', null],
          [3, 'Smartphones', 1],
          [4, 'Laptops', 1],
          [5, 'Men\'s Wear', 2],
        ],
      },
      {
        name: 'products',
        columns: [
          { name: 'product_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique product identifier' },
          { name: 'product_name', type: 'VARCHAR(100)', nullable: false, description: 'Product name' },
          { name: 'category_id', type: 'INT', nullable: false, foreignKey: { table: 'categories', column: 'category_id' }, description: 'Product category' },
          { name: 'price', type: 'DECIMAL(10,2)', nullable: false, description: 'Product price in USD' },
          { name: 'stock_quantity', type: 'INT', nullable: false, description: 'Current stock level' },
          { name: 'created_at', type: 'DATETIME', nullable: false, description: 'Product listing date' },
        ],
        sampleData: [
          [101, 'iPhone 15', 3, 999.99, 150, '2023-09-22'],
          [102, 'MacBook Pro', 4, 2499.99, 75, '2023-10-01'],
          [103, 'Samsung Galaxy S24', 3, 849.99, 200, '2024-01-17'],
          [104, 'Levi\'s Jeans', 5, 59.99, 500, '2023-06-15'],
          [105, 'Nike Hoodie', 5, 89.99, 300, '2023-07-20'],
        ],
      },
      {
        name: 'orders',
        columns: [
          { name: 'order_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique order identifier' },
          { name: 'customer_id', type: 'INT', nullable: false, foreignKey: { table: 'customers', column: 'customer_id' }, description: 'Customer who placed the order' },
          { name: 'order_date', type: 'DATETIME', nullable: false, description: 'Date and time order was placed' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, description: 'Total order value' },
          { name: 'status', type: "ENUM('pending','shipped','delivered','cancelled')", nullable: false, description: 'Current order status' },
        ],
        sampleData: [
          [1001, 1, '2024-01-10 14:30:00', 1059.98, 'delivered'],
          [1002, 2, '2024-01-15 09:15:00', 2499.99, 'shipped'],
          [1003, 1, '2024-02-01 16:45:00', 149.98, 'delivered'],
          [1004, 3, '2024-02-10 11:00:00', 849.99, 'pending'],
          [1005, 4, '2024-02-20 08:30:00', 59.99, 'cancelled'],
        ],
      },
      {
        name: 'order_items',
        columns: [
          { name: 'item_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique line item identifier' },
          { name: 'order_id', type: 'INT', nullable: false, foreignKey: { table: 'orders', column: 'order_id' }, description: 'Associated order' },
          { name: 'product_id', type: 'INT', nullable: false, foreignKey: { table: 'products', column: 'product_id' }, description: 'Product purchased' },
          { name: 'quantity', type: 'INT', nullable: false, description: 'Number of units' },
          { name: 'unit_price', type: 'DECIMAL(10,2)', nullable: false, description: 'Price per unit at time of purchase' },
        ],
        sampleData: [
          [1, 1001, 101, 1, 999.99],
          [2, 1001, 104, 1, 59.99],
          [3, 1002, 102, 1, 2499.99],
          [4, 1003, 104, 1, 59.99],
          [5, 1003, 105, 1, 89.99],
        ],
      },
      {
        name: 'reviews',
        columns: [
          { name: 'review_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique review identifier' },
          { name: 'product_id', type: 'INT', nullable: false, foreignKey: { table: 'products', column: 'product_id' }, description: 'Product reviewed' },
          { name: 'customer_id', type: 'INT', nullable: false, foreignKey: { table: 'customers', column: 'customer_id' }, description: 'Customer who left review' },
          { name: 'rating', type: 'INT', nullable: false, description: 'Rating from 1 to 5' },
          { name: 'review_text', type: 'TEXT', nullable: true, description: 'Review content' },
          { name: 'review_date', type: 'DATE', nullable: false, description: 'Date review was posted' },
        ],
        sampleData: [
          [1, 101, 1, 5, 'Amazing phone!', '2024-02-01'],
          [2, 102, 2, 4, 'Great laptop, a bit pricey', '2024-02-05'],
          [3, 101, 3, 4, 'Good quality', '2024-02-10'],
          [4, 104, 1, 3, 'Decent jeans', '2024-02-15'],
          [5, 103, 4, 5, 'Best phone I\'ve owned', '2024-03-01'],
        ],
      },
    ],
    relationships: [
      { from: 'orders.customer_id', to: 'customers.customer_id', type: 'many-to-one' },
      { from: 'order_items.order_id', to: 'orders.order_id', type: 'many-to-one' },
      { from: 'order_items.product_id', to: 'products.product_id', type: 'many-to-one' },
      { from: 'products.category_id', to: 'categories.category_id', type: 'many-to-one' },
      { from: 'reviews.product_id', to: 'products.product_id', type: 'many-to-one' },
      { from: 'reviews.customer_id', to: 'customers.customer_id', type: 'many-to-one' },
      { from: 'categories.parent_category_id', to: 'categories.category_id', type: 'self-referencing' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 2. SOCIAL NETWORK DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'social',
    name: 'Social Network',
    description: 'Social media platform with users, posts, followers, likes, and comments.',
    icon: '👥',
    color: '#3b82f6',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'user_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique user identifier' },
          { name: 'username', type: 'VARCHAR(30)', nullable: false, unique: true, description: 'Unique username' },
          { name: 'display_name', type: 'VARCHAR(50)', nullable: false, description: 'User display name' },
          { name: 'email', type: 'VARCHAR(100)', nullable: false, unique: true, description: 'Email address' },
          { name: 'bio', type: 'TEXT', nullable: true, description: 'User biography' },
          { name: 'join_date', type: 'DATE', nullable: false, description: 'Account creation date' },
          { name: 'is_verified', type: 'BOOLEAN', nullable: false, description: 'Verification status' },
        ],
        sampleData: [
          [1, 'johndoe', 'John Doe', 'john@mail.com', 'Software engineer', '2022-01-01', true],
          [2, 'janedoe', 'Jane Doe', 'jane@mail.com', 'Data scientist', '2022-03-15', true],
          [3, 'bob_dev', 'Bob Builder', 'bob@mail.com', 'Full-stack dev', '2022-06-20', false],
          [4, 'alice_w', 'Alice Wonder', 'alice@mail.com', null, '2023-01-10', false],
          [5, 'charlie', 'Charlie Brown', 'charlie@mail.com', 'Designer', '2023-04-05', true],
        ],
      },
      {
        name: 'posts',
        columns: [
          { name: 'post_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique post identifier' },
          { name: 'user_id', type: 'INT', nullable: false, foreignKey: { table: 'users', column: 'user_id' }, description: 'Author of the post' },
          { name: 'content', type: 'TEXT', nullable: false, description: 'Post content' },
          { name: 'created_at', type: 'DATETIME', nullable: false, description: 'Post creation timestamp' },
          { name: 'likes_count', type: 'INT', nullable: false, description: 'Number of likes' },
          { name: 'is_public', type: 'BOOLEAN', nullable: false, description: 'Public visibility' },
        ],
        sampleData: [
          [1, 1, 'Just shipped a new feature! 🚀', '2024-01-10 09:00:00', 42, true],
          [2, 2, 'Data science tip of the day...', '2024-01-11 14:30:00', 85, true],
          [3, 1, 'Working on something exciting', '2024-01-15 16:00:00', 15, false],
          [4, 3, 'My latest open source project', '2024-02-01 10:00:00', 120, true],
          [5, 5, 'New design system launched!', '2024-02-05 11:30:00', 200, true],
        ],
      },
      {
        name: 'followers',
        columns: [
          { name: 'follower_id', type: 'INT', nullable: false, foreignKey: { table: 'users', column: 'user_id' }, description: 'User who follows' },
          { name: 'following_id', type: 'INT', nullable: false, foreignKey: { table: 'users', column: 'user_id' }, description: 'User being followed' },
          { name: 'followed_at', type: 'DATETIME', nullable: false, description: 'When the follow happened' },
        ],
        sampleData: [
          [1, 2, '2023-01-05 10:00:00'],
          [1, 5, '2023-02-10 12:00:00'],
          [2, 1, '2023-01-06 09:30:00'],
          [3, 1, '2023-06-25 14:00:00'],
          [4, 2, '2023-08-15 16:00:00'],
        ],
      },
      {
        name: 'likes',
        columns: [
          { name: 'like_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique like identifier' },
          { name: 'user_id', type: 'INT', nullable: false, foreignKey: { table: 'users', column: 'user_id' }, description: 'User who liked' },
          { name: 'post_id', type: 'INT', nullable: false, foreignKey: { table: 'posts', column: 'post_id' }, description: 'Post that was liked' },
          { name: 'liked_at', type: 'DATETIME', nullable: false, description: 'When the like happened' },
        ],
        sampleData: [
          [1, 2, 1, '2024-01-10 10:00:00'],
          [2, 3, 1, '2024-01-10 11:00:00'],
          [3, 1, 2, '2024-01-12 09:00:00'],
          [4, 5, 4, '2024-02-01 12:00:00'],
          [5, 1, 5, '2024-02-06 08:00:00'],
        ],
      },
      {
        name: 'comments',
        columns: [
          { name: 'comment_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique comment identifier' },
          { name: 'post_id', type: 'INT', nullable: false, foreignKey: { table: 'posts', column: 'post_id' }, description: 'Post commented on' },
          { name: 'user_id', type: 'INT', nullable: false, foreignKey: { table: 'users', column: 'user_id' }, description: 'Comment author' },
          { name: 'content', type: 'TEXT', nullable: false, description: 'Comment text' },
          { name: 'created_at', type: 'DATETIME', nullable: false, description: 'Comment timestamp' },
        ],
        sampleData: [
          [1, 1, 2, 'Awesome work!', '2024-01-10 10:15:00'],
          [2, 2, 1, 'Great tip, thanks!', '2024-01-12 09:30:00'],
          [3, 4, 5, 'Love this project', '2024-02-01 11:00:00'],
          [4, 5, 1, 'Beautiful design!', '2024-02-06 09:00:00'],
          [5, 1, 4, 'Congrats!', '2024-01-11 08:00:00'],
        ],
      },
    ],
    relationships: [
      { from: 'posts.user_id', to: 'users.user_id', type: 'many-to-one' },
      { from: 'followers.follower_id', to: 'users.user_id', type: 'many-to-one' },
      { from: 'followers.following_id', to: 'users.user_id', type: 'many-to-one' },
      { from: 'likes.user_id', to: 'users.user_id', type: 'many-to-one' },
      { from: 'likes.post_id', to: 'posts.post_id', type: 'many-to-one' },
      { from: 'comments.post_id', to: 'posts.post_id', type: 'many-to-one' },
      { from: 'comments.user_id', to: 'users.user_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 3. HR SYSTEM DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'hr',
    name: 'HR System',
    description: 'Human resources system with employees, departments, salaries, and job history.',
    icon: '🏢',
    color: '#10b981',
    tables: [
      {
        name: 'departments',
        columns: [
          { name: 'department_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique department identifier' },
          { name: 'department_name', type: 'VARCHAR(50)', nullable: false, description: 'Department name' },
          { name: 'location', type: 'VARCHAR(50)', nullable: true, description: 'Office location' },
          { name: 'budget', type: 'DECIMAL(12,2)', nullable: true, description: 'Annual department budget' },
        ],
        sampleData: [
          [1, 'Engineering', 'San Francisco', 5000000.00],
          [2, 'Marketing', 'New York', 2000000.00],
          [3, 'Sales', 'Chicago', 3000000.00],
          [4, 'HR', 'San Francisco', 1500000.00],
          [5, 'Finance', 'New York', 1800000.00],
        ],
      },
      {
        name: 'employees',
        columns: [
          { name: 'employee_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique employee identifier' },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false, description: 'Employee first name' },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false, description: 'Employee last name' },
          { name: 'email', type: 'VARCHAR(100)', nullable: false, unique: true, description: 'Employee email' },
          { name: 'department_id', type: 'INT', nullable: false, foreignKey: { table: 'departments', column: 'department_id' }, description: 'Department assignment' },
          { name: 'manager_id', type: 'INT', nullable: true, foreignKey: { table: 'employees', column: 'employee_id' }, description: 'Direct manager (self-referencing)' },
          { name: 'hire_date', type: 'DATE', nullable: false, description: 'Date of hire' },
          { name: 'job_title', type: 'VARCHAR(50)', nullable: false, description: 'Current job title' },
          { name: 'salary', type: 'DECIMAL(10,2)', nullable: false, description: 'Current annual salary' },
        ],
        sampleData: [
          [1, 'Sarah', 'Connor', 'sarah@company.com', 1, null, '2019-03-15', 'VP Engineering', 250000.00],
          [2, 'John', 'Reese', 'john@company.com', 1, 1, '2020-06-01', 'Senior Engineer', 180000.00],
          [3, 'Kyle', 'Murphy', 'kyle@company.com', 1, 1, '2021-01-10', 'Engineer', 130000.00],
          [4, 'Lisa', 'Chen', 'lisa@company.com', 2, null, '2020-08-20', 'Marketing Director', 190000.00],
          [5, 'Mark', 'Taylor', 'mark@company.com', 3, null, '2018-11-05', 'Sales Manager', 160000.00],
        ],
      },
      {
        name: 'salaries',
        columns: [
          { name: 'salary_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique salary record identifier' },
          { name: 'employee_id', type: 'INT', nullable: false, foreignKey: { table: 'employees', column: 'employee_id' }, description: 'Employee' },
          { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, description: 'Salary amount' },
          { name: 'from_date', type: 'DATE', nullable: false, description: 'Start of salary period' },
          { name: 'to_date', type: 'DATE', nullable: true, description: 'End of salary period (NULL = current)' },
        ],
        sampleData: [
          [1, 1, 200000.00, '2019-03-15', '2021-03-14'],
          [2, 1, 250000.00, '2021-03-15', null],
          [3, 2, 150000.00, '2020-06-01', '2022-05-31'],
          [4, 2, 180000.00, '2022-06-01', null],
          [5, 3, 130000.00, '2021-01-10', null],
        ],
      },
      {
        name: 'job_history',
        columns: [
          { name: 'history_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique history record identifier' },
          { name: 'employee_id', type: 'INT', nullable: false, foreignKey: { table: 'employees', column: 'employee_id' }, description: 'Employee' },
          { name: 'department_id', type: 'INT', nullable: false, foreignKey: { table: 'departments', column: 'department_id' }, description: 'Department at that time' },
          { name: 'job_title', type: 'VARCHAR(50)', nullable: false, description: 'Job title at that time' },
          { name: 'start_date', type: 'DATE', nullable: false, description: 'Start of this position' },
          { name: 'end_date', type: 'DATE', nullable: true, description: 'End of this position (NULL = current)' },
        ],
        sampleData: [
          [1, 1, 1, 'Senior Engineer', '2019-03-15', '2020-06-30'],
          [2, 1, 1, 'VP Engineering', '2020-07-01', null],
          [3, 2, 1, 'Engineer', '2020-06-01', '2022-05-31'],
          [4, 2, 1, 'Senior Engineer', '2022-06-01', null],
          [5, 5, 3, 'Sales Rep', '2018-11-05', '2021-01-31'],
        ],
      },
    ],
    relationships: [
      { from: 'employees.department_id', to: 'departments.department_id', type: 'many-to-one' },
      { from: 'employees.manager_id', to: 'employees.employee_id', type: 'self-referencing' },
      { from: 'salaries.employee_id', to: 'employees.employee_id', type: 'many-to-one' },
      { from: 'job_history.employee_id', to: 'employees.employee_id', type: 'many-to-one' },
      { from: 'job_history.department_id', to: 'departments.department_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 4. BANKING DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'banking',
    name: 'Banking System',
    description: 'Banking platform with accounts, transactions, loans, and branches.',
    icon: '🏦',
    color: '#6366f1',
    tables: [
      {
        name: 'branches',
        columns: [
          { name: 'branch_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique branch identifier' },
          { name: 'branch_name', type: 'VARCHAR(50)', nullable: false, description: 'Branch name' },
          { name: 'city', type: 'VARCHAR(50)', nullable: false, description: 'Branch city' },
          { name: 'state', type: 'VARCHAR(30)', nullable: false, description: 'Branch state' },
        ],
        sampleData: [
          [1, 'Downtown', 'New York', 'NY'],
          [2, 'Westside', 'Los Angeles', 'CA'],
          [3, 'Loop', 'Chicago', 'IL'],
          [4, 'Financial District', 'San Francisco', 'CA'],
          [5, 'Midtown', 'Houston', 'TX'],
        ],
      },
      {
        name: 'accounts',
        columns: [
          { name: 'account_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique account identifier' },
          { name: 'customer_name', type: 'VARCHAR(100)', nullable: false, description: 'Account holder name' },
          { name: 'account_type', type: "ENUM('checking','savings','business')", nullable: false, description: 'Type of account' },
          { name: 'balance', type: 'DECIMAL(12,2)', nullable: false, description: 'Current balance' },
          { name: 'branch_id', type: 'INT', nullable: false, foreignKey: { table: 'branches', column: 'branch_id' }, description: 'Home branch' },
          { name: 'opened_date', type: 'DATE', nullable: false, description: 'Account opening date' },
          { name: 'is_active', type: 'BOOLEAN', nullable: false, description: 'Account active status' },
        ],
        sampleData: [
          [1001, 'Alice Johnson', 'checking', 5200.50, 1, '2020-01-10', true],
          [1002, 'Bob Smith', 'savings', 25000.00, 2, '2019-06-15', true],
          [1003, 'Carol Williams', 'business', 150000.75, 3, '2021-03-22', true],
          [1004, 'David Brown', 'checking', 800.00, 1, '2022-09-01', false],
          [1005, 'Eve Davis', 'savings', 42000.00, 4, '2020-11-30', true],
        ],
      },
      {
        name: 'transactions',
        columns: [
          { name: 'transaction_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique transaction identifier' },
          { name: 'account_id', type: 'INT', nullable: false, foreignKey: { table: 'accounts', column: 'account_id' }, description: 'Account involved' },
          { name: 'transaction_type', type: "ENUM('deposit','withdrawal','transfer')", nullable: false, description: 'Type of transaction' },
          { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, description: 'Transaction amount' },
          { name: 'transaction_date', type: 'DATETIME', nullable: false, description: 'When it happened' },
          { name: 'description', type: 'VARCHAR(200)', nullable: true, description: 'Transaction memo' },
        ],
        sampleData: [
          [1, 1001, 'deposit', 3000.00, '2024-01-05 10:30:00', 'Salary deposit'],
          [2, 1001, 'withdrawal', 500.00, '2024-01-10 14:00:00', 'ATM withdrawal'],
          [3, 1002, 'deposit', 5000.00, '2024-01-15 09:00:00', 'Transfer from checking'],
          [4, 1003, 'withdrawal', 10000.00, '2024-01-20 16:30:00', 'Vendor payment'],
          [5, 1005, 'deposit', 2000.00, '2024-02-01 11:00:00', 'Monthly savings'],
        ],
      },
      {
        name: 'loans',
        columns: [
          { name: 'loan_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique loan identifier' },
          { name: 'account_id', type: 'INT', nullable: false, foreignKey: { table: 'accounts', column: 'account_id' }, description: 'Borrower account' },
          { name: 'loan_type', type: "ENUM('personal','mortgage','auto','business')", nullable: false, description: 'Type of loan' },
          { name: 'principal', type: 'DECIMAL(12,2)', nullable: false, description: 'Loan principal amount' },
          { name: 'interest_rate', type: 'DECIMAL(4,2)', nullable: false, description: 'Annual interest rate' },
          { name: 'start_date', type: 'DATE', nullable: false, description: 'Loan start date' },
          { name: 'end_date', type: 'DATE', nullable: false, description: 'Loan maturity date' },
          { name: 'status', type: "ENUM('active','paid','defaulted')", nullable: false, description: 'Loan status' },
        ],
        sampleData: [
          [1, 1001, 'personal', 15000.00, 8.50, '2023-06-01', '2026-06-01', 'active'],
          [2, 1002, 'mortgage', 350000.00, 3.75, '2020-01-15', '2050-01-15', 'active'],
          [3, 1003, 'business', 100000.00, 6.00, '2022-03-01', '2027-03-01', 'active'],
          [4, 1004, 'auto', 25000.00, 5.25, '2021-09-01', '2026-09-01', 'defaulted'],
          [5, 1005, 'personal', 8000.00, 7.50, '2023-01-10', '2025-01-10', 'paid'],
        ],
      },
    ],
    relationships: [
      { from: 'accounts.branch_id', to: 'branches.branch_id', type: 'many-to-one' },
      { from: 'transactions.account_id', to: 'accounts.account_id', type: 'many-to-one' },
      { from: 'loans.account_id', to: 'accounts.account_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 5. HEALTHCARE DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'healthcare',
    name: 'Healthcare System',
    description: 'Hospital management with patients, doctors, appointments, and prescriptions.',
    icon: '🏥',
    color: '#ef4444',
    tables: [
      {
        name: 'doctors',
        columns: [
          { name: 'doctor_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique doctor identifier' },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false, description: 'Doctor first name' },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false, description: 'Doctor last name' },
          { name: 'specialization', type: 'VARCHAR(50)', nullable: false, description: 'Medical specialization' },
          { name: 'experience_years', type: 'INT', nullable: false, description: 'Years of experience' },
          { name: 'department', type: 'VARCHAR(50)', nullable: false, description: 'Hospital department' },
        ],
        sampleData: [
          [1, 'James', 'Wilson', 'Cardiology', 15, 'Cardiology'],
          [2, 'Emily', 'Roberts', 'Neurology', 10, 'Neurology'],
          [3, 'Michael', 'Lee', 'Orthopedics', 8, 'Orthopedics'],
          [4, 'Sarah', 'Patel', 'Pediatrics', 12, 'Pediatrics'],
          [5, 'David', 'Kim', 'General Medicine', 20, 'General'],
        ],
      },
      {
        name: 'patients',
        columns: [
          { name: 'patient_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique patient identifier' },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false, description: 'Patient first name' },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false, description: 'Patient last name' },
          { name: 'date_of_birth', type: 'DATE', nullable: false, description: 'Date of birth' },
          { name: 'gender', type: "ENUM('M','F','Other')", nullable: false, description: 'Gender' },
          { name: 'phone', type: 'VARCHAR(15)', nullable: true, description: 'Contact number' },
          { name: 'insurance_id', type: 'VARCHAR(20)', nullable: true, description: 'Insurance policy number' },
        ],
        sampleData: [
          [1, 'Tom', 'Harris', '1985-05-10', 'M', '555-0101', 'INS-001'],
          [2, 'Amy', 'Clark', '1990-08-22', 'F', '555-0102', 'INS-002'],
          [3, 'Roger', 'White', '1978-12-03', 'M', '555-0103', null],
          [4, 'Linda', 'Martin', '2010-03-15', 'F', '555-0104', 'INS-004'],
          [5, 'Steve', 'Garcia', '1965-07-28', 'M', '555-0105', 'INS-005'],
        ],
      },
      {
        name: 'appointments',
        columns: [
          { name: 'appointment_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique appointment identifier' },
          { name: 'patient_id', type: 'INT', nullable: false, foreignKey: { table: 'patients', column: 'patient_id' }, description: 'Patient' },
          { name: 'doctor_id', type: 'INT', nullable: false, foreignKey: { table: 'doctors', column: 'doctor_id' }, description: 'Doctor' },
          { name: 'appointment_date', type: 'DATETIME', nullable: false, description: 'Date and time' },
          { name: 'diagnosis', type: 'TEXT', nullable: true, description: 'Diagnosis notes' },
          { name: 'status', type: "ENUM('scheduled','completed','cancelled','no-show')", nullable: false, description: 'Appointment status' },
        ],
        sampleData: [
          [1, 1, 1, '2024-01-10 09:00:00', 'Routine cardiac checkup', 'completed'],
          [2, 2, 2, '2024-01-15 14:00:00', 'Migraine consultation', 'completed'],
          [3, 3, 3, '2024-02-01 10:30:00', 'Knee pain assessment', 'scheduled'],
          [4, 4, 4, '2024-02-05 11:00:00', 'Annual checkup', 'completed'],
          [5, 5, 5, '2024-02-10 16:00:00', null, 'cancelled'],
        ],
      },
      {
        name: 'prescriptions',
        columns: [
          { name: 'prescription_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique prescription identifier' },
          { name: 'appointment_id', type: 'INT', nullable: false, foreignKey: { table: 'appointments', column: 'appointment_id' }, description: 'Related appointment' },
          { name: 'medicine_name', type: 'VARCHAR(100)', nullable: false, description: 'Medicine prescribed' },
          { name: 'dosage', type: 'VARCHAR(50)', nullable: false, description: 'Dosage instructions' },
          { name: 'duration_days', type: 'INT', nullable: false, description: 'Duration in days' },
        ],
        sampleData: [
          [1, 1, 'Aspirin', '100mg daily', 30],
          [2, 1, 'Lisinopril', '10mg daily', 90],
          [3, 2, 'Sumatriptan', '50mg as needed', 15],
          [4, 4, 'Amoxicillin', '500mg 3x daily', 10],
          [5, 4, 'Vitamin D', '1000IU daily', 60],
        ],
      },
    ],
    relationships: [
      { from: 'appointments.patient_id', to: 'patients.patient_id', type: 'many-to-one' },
      { from: 'appointments.doctor_id', to: 'doctors.doctor_id', type: 'many-to-one' },
      { from: 'prescriptions.appointment_id', to: 'appointments.appointment_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 6. EDUCATION DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'education',
    name: 'Education System',
    description: 'University system with students, courses, enrollments, and professors.',
    icon: '🎓',
    color: '#8b5cf6',
    tables: [
      {
        name: 'professors',
        columns: [
          { name: 'professor_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique professor identifier' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Professor name' },
          { name: 'department', type: 'VARCHAR(50)', nullable: false, description: 'Academic department' },
          { name: 'tenure', type: 'BOOLEAN', nullable: false, description: 'Tenured status' },
        ],
        sampleData: [
          [1, 'Dr. Alan Turing', 'Computer Science', true],
          [2, 'Dr. Marie Curie', 'Physics', true],
          [3, 'Dr. Ada Lovelace', 'Mathematics', false],
          [4, 'Dr. Richard Feynman', 'Physics', true],
          [5, 'Dr. Grace Hopper', 'Computer Science', true],
        ],
      },
      {
        name: 'courses',
        columns: [
          { name: 'course_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique course identifier' },
          { name: 'course_name', type: 'VARCHAR(100)', nullable: false, description: 'Course name' },
          { name: 'department', type: 'VARCHAR(50)', nullable: false, description: 'Department offering the course' },
          { name: 'credits', type: 'INT', nullable: false, description: 'Credit hours' },
          { name: 'professor_id', type: 'INT', nullable: false, foreignKey: { table: 'professors', column: 'professor_id' }, description: 'Instructor' },
          { name: 'max_enrollment', type: 'INT', nullable: false, description: 'Maximum students allowed' },
        ],
        sampleData: [
          [101, 'Intro to Algorithms', 'Computer Science', 4, 1, 120],
          [102, 'Quantum Physics', 'Physics', 3, 2, 60],
          [103, 'Linear Algebra', 'Mathematics', 3, 3, 80],
          [104, 'Advanced Physics Lab', 'Physics', 2, 4, 30],
          [105, 'Compiler Design', 'Computer Science', 4, 5, 50],
        ],
      },
      {
        name: 'students',
        columns: [
          { name: 'student_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique student identifier' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Student name' },
          { name: 'major', type: 'VARCHAR(50)', nullable: false, description: 'Major field of study' },
          { name: 'gpa', type: 'DECIMAL(3,2)', nullable: true, description: 'Grade point average' },
          { name: 'enrollment_year', type: 'INT', nullable: false, description: 'Year of enrollment' },
        ],
        sampleData: [
          [1, 'Alex Rivera', 'Computer Science', 3.85, 2022],
          [2, 'Priya Sharma', 'Physics', 3.92, 2021],
          [3, 'Mike Chen', 'Mathematics', 3.45, 2023],
          [4, 'Sofia Lopez', 'Computer Science', 3.78, 2022],
          [5, 'James Miller', 'Physics', 3.10, 2023],
        ],
      },
      {
        name: 'enrollments',
        columns: [
          { name: 'enrollment_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique enrollment identifier' },
          { name: 'student_id', type: 'INT', nullable: false, foreignKey: { table: 'students', column: 'student_id' }, description: 'Student' },
          { name: 'course_id', type: 'INT', nullable: false, foreignKey: { table: 'courses', column: 'course_id' }, description: 'Course' },
          { name: 'grade', type: 'VARCHAR(2)', nullable: true, description: 'Final grade (NULL if in progress)' },
          { name: 'semester', type: 'VARCHAR(20)', nullable: false, description: 'Semester (e.g., Fall 2024)' },
        ],
        sampleData: [
          [1, 1, 101, 'A', 'Fall 2023'],
          [2, 1, 105, 'A-', 'Fall 2023'],
          [3, 2, 102, 'A+', 'Fall 2023'],
          [4, 3, 103, 'B+', 'Spring 2024'],
          [5, 4, 101, null, 'Spring 2024'],
        ],
      },
    ],
    relationships: [
      { from: 'courses.professor_id', to: 'professors.professor_id', type: 'many-to-one' },
      { from: 'enrollments.student_id', to: 'students.student_id', type: 'many-to-one' },
      { from: 'enrollments.course_id', to: 'courses.course_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 7. INVENTORY MANAGEMENT DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Warehouse and inventory system with products, stock, suppliers, and shipments.',
    icon: '📦',
    color: '#f97316',
    tables: [
      {
        name: 'suppliers',
        columns: [
          { name: 'supplier_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique supplier identifier' },
          { name: 'company_name', type: 'VARCHAR(100)', nullable: false, description: 'Supplier company name' },
          { name: 'contact_name', type: 'VARCHAR(50)', nullable: true, description: 'Primary contact' },
          { name: 'country', type: 'VARCHAR(50)', nullable: false, description: 'Country of origin' },
          { name: 'rating', type: 'DECIMAL(2,1)', nullable: true, description: 'Supplier rating (0-5)' },
        ],
        sampleData: [
          [1, 'TechParts Inc', 'Anna Lee', 'USA', 4.5],
          [2, 'Global Supply Co', 'Raj Patel', 'India', 4.2],
          [3, 'EuroParts GmbH', 'Hans Mueller', 'Germany', 4.8],
          [4, 'FastShip Ltd', 'Wei Zhang', 'China', 3.9],
          [5, 'Quality First', 'Maria Garcia', 'Mexico', 4.0],
        ],
      },
      {
        name: 'warehouses',
        columns: [
          { name: 'warehouse_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique warehouse identifier' },
          { name: 'warehouse_name', type: 'VARCHAR(50)', nullable: false, description: 'Warehouse name' },
          { name: 'city', type: 'VARCHAR(50)', nullable: false, description: 'City location' },
          { name: 'capacity', type: 'INT', nullable: false, description: 'Max storage units' },
        ],
        sampleData: [
          [1, 'Main Warehouse', 'Dallas', 50000],
          [2, 'East Hub', 'New Jersey', 35000],
          [3, 'West Hub', 'Oakland', 40000],
          [4, 'South Depot', 'Atlanta', 25000],
          [5, 'North Depot', 'Seattle', 30000],
        ],
      },
      {
        name: 'products',
        columns: [
          { name: 'product_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique product identifier' },
          { name: 'product_name', type: 'VARCHAR(100)', nullable: false, description: 'Product name' },
          { name: 'category', type: 'VARCHAR(50)', nullable: false, description: 'Product category' },
          { name: 'unit_cost', type: 'DECIMAL(8,2)', nullable: false, description: 'Cost per unit' },
          { name: 'supplier_id', type: 'INT', nullable: false, foreignKey: { table: 'suppliers', column: 'supplier_id' }, description: 'Primary supplier' },
        ],
        sampleData: [
          [1, 'Widget A', 'Hardware', 12.50, 1],
          [2, 'Gadget B', 'Electronics', 45.00, 2],
          [3, 'Component C', 'Hardware', 8.75, 3],
          [4, 'Module D', 'Electronics', 120.00, 4],
          [5, 'Part E', 'Accessories', 5.25, 5],
        ],
      },
      {
        name: 'stock',
        columns: [
          { name: 'stock_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique stock record identifier' },
          { name: 'product_id', type: 'INT', nullable: false, foreignKey: { table: 'products', column: 'product_id' }, description: 'Product' },
          { name: 'warehouse_id', type: 'INT', nullable: false, foreignKey: { table: 'warehouses', column: 'warehouse_id' }, description: 'Warehouse' },
          { name: 'quantity', type: 'INT', nullable: false, description: 'Current quantity' },
          { name: 'last_updated', type: 'DATETIME', nullable: false, description: 'Last stock update' },
        ],
        sampleData: [
          [1, 1, 1, 5000, '2024-02-01 08:00:00'],
          [2, 2, 1, 1200, '2024-02-01 08:00:00'],
          [3, 3, 2, 8000, '2024-01-28 10:00:00'],
          [4, 4, 3, 300, '2024-02-05 14:00:00'],
          [5, 5, 4, 15000, '2024-01-30 09:00:00'],
        ],
      },
      {
        name: 'shipments',
        columns: [
          { name: 'shipment_id', type: 'INT', primaryKey: true, nullable: false, description: 'Unique shipment identifier' },
          { name: 'product_id', type: 'INT', nullable: false, foreignKey: { table: 'products', column: 'product_id' }, description: 'Product shipped' },
          { name: 'supplier_id', type: 'INT', nullable: false, foreignKey: { table: 'suppliers', column: 'supplier_id' }, description: 'From supplier' },
          { name: 'warehouse_id', type: 'INT', nullable: false, foreignKey: { table: 'warehouses', column: 'warehouse_id' }, description: 'To warehouse' },
          { name: 'quantity', type: 'INT', nullable: false, description: 'Units shipped' },
          { name: 'ship_date', type: 'DATE', nullable: false, description: 'Shipment date' },
          { name: 'status', type: "ENUM('in_transit','delivered','delayed')", nullable: false, description: 'Shipment status' },
        ],
        sampleData: [
          [1, 1, 1, 1, 2000, '2024-01-20', 'delivered'],
          [2, 2, 2, 1, 500, '2024-01-25', 'delivered'],
          [3, 3, 3, 2, 3000, '2024-02-01', 'in_transit'],
          [4, 4, 4, 3, 100, '2024-02-05', 'delayed'],
          [5, 5, 5, 4, 5000, '2024-02-10', 'in_transit'],
        ],
      },
    ],
    relationships: [
      { from: 'products.supplier_id', to: 'suppliers.supplier_id', type: 'many-to-one' },
      { from: 'stock.product_id', to: 'products.product_id', type: 'many-to-one' },
      { from: 'stock.warehouse_id', to: 'warehouses.warehouse_id', type: 'many-to-one' },
      { from: 'shipments.product_id', to: 'products.product_id', type: 'many-to-one' },
      { from: 'shipments.supplier_id', to: 'suppliers.supplier_id', type: 'many-to-one' },
      { from: 'shipments.warehouse_id', to: 'warehouses.warehouse_id', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 8. WORLD DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'world',
    name: 'World Countries & Cities',
    description: 'Geographic database with countries, cities, and population data.',
    icon: '🌍',
    color: '#22d3ee',
    tables: [
      {
        name: 'country',
        columns: [
          { name: 'name', type: 'VARCHAR(100)', primaryKey: true, nullable: false, description: 'Country name' },
          { name: 'continent', type: 'VARCHAR(50)', nullable: false, description: 'Continent name' },
          { name: 'area', type: 'INT', nullable: true, description: 'Area in sq km' },
          { name: 'population', type: 'BIGINT', nullable: true, description: 'Total population' },
          { name: 'gdp', type: 'BIGINT', nullable: true, description: 'GDP in USD' },
        ],
        sampleData: [
          ['Afghanistan', 'Asia', 652230, 25500100, 20343000000],
          ['Albania', 'Europe', 28748, 2831741, 12960000000],
          ['Algeria', 'Africa', 2381741, 37100000, 188681000000],
          ['Andorra', 'Europe', 468, 78115, 3712000000],
          ['India', 'Asia', 3287263, 1380004385, 2875142000000],
        ],
      },
      {
        name: 'city',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'City ID' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'City name' },
          { name: 'countrycode', type: 'VARCHAR(3)', nullable: false, description: 'ISO country code' },
          { name: 'district', type: 'VARCHAR(100)', nullable: true, description: 'District or state' },
          { name: 'population', type: 'INT', nullable: true, description: 'City population' },
        ],
        sampleData: [
          [1, 'Tokyo', 'JPN', 'Tokyo-to', 13960000],
          [2, 'Delhi', 'IND', 'Delhi', 16787941],
          [3, 'Shanghai', 'CHN', 'Shanghai', 24870895],
          [4, 'Mumbai', 'IND', 'Maharashtra', 12442373],
          [5, 'São Paulo', 'BRA', 'São Paulo', 12325232],
        ],
      },
    ],
    relationships: [
      { from: 'city.countrycode', to: 'country.name', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 9. HACKERRANK-STYLE DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'hackerrank',
    name: 'Hackerrank Students & Employees',
    description: 'Database with students, employees, occupations, and organizational data.',
    icon: '🎓',
    color: '#10b981',
    tables: [
      {
        name: 'students',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'Student ID' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Student name' },
          { name: 'marks', type: 'INT', nullable: false, description: 'Total marks scored' },
        ],
        sampleData: [
          [1, 'Ashley', 81],
          [2, 'Samantha', 75],
          [3, 'Julia', 76],
          [4, 'Belvet', 84],
          [5, 'Scarlet', 80],
        ],
      },
      {
        name: 'employee',
        columns: [
          { name: 'employee_id', type: 'INT', primaryKey: true, nullable: false, description: 'Employee ID' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Employee name' },
          { name: 'months', type: 'INT', nullable: false, description: 'Months worked' },
          { name: 'salary', type: 'INT', nullable: false, description: 'Monthly salary' },
        ],
        sampleData: [
          [1, 'Rose', 15, 1968],
          [2, 'Angela', 1, 3443],
          [3, 'Frank', 17, 1608],
          [4, 'Patrick', 7, 1345],
          [5, 'Lisa', 11, 2330],
        ],
      },
      {
        name: 'occupations',
        columns: [
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Person name' },
          { name: 'occupation', type: 'VARCHAR(50)', nullable: false, description: 'Occupation type' },
        ],
        sampleData: [
          ['Samantha', 'Doctor'],
          ['Julia', 'Actor'],
          ['Maria', 'Actor'],
          ['Meera', 'Singer'],
          ['Ashley', 'Professor'],
        ],
      },
      {
        name: 'triangles',
        columns: [
          { name: 'a', type: 'INT', nullable: false, description: 'Side A' },
          { name: 'b', type: 'INT', nullable: false, description: 'Side B' },
          { name: 'c', type: 'INT', nullable: false, description: 'Side C' },
        ],
        sampleData: [
          [20, 20, 23],
          [20, 20, 20],
          [20, 21, 22],
          [13, 14, 30],
        ],
      },
      {
        name: 'bst',
        columns: [
          { name: 'n', type: 'INT', primaryKey: true, nullable: false, description: 'Node value' },
          { name: 'p', type: 'INT', nullable: true, description: 'Parent node value' },
        ],
        sampleData: [
          [1, 2],
          [3, 2],
          [6, 8],
          [9, 8],
          [2, 5],
          [8, 5],
          [5, null],
        ],
      },
    ],
    relationships: [],
  },

  // ═══════════════════════════════════════════════════════════
  // 10. CODING CONTEST DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'coding_contest',
    name: 'Coding Contest Platform',
    description: 'Platform for coding challenges, submissions, scoring, and leaderboards.',
    icon: '💻',
    color: '#8b5cf6',
    tables: [
      {
        name: 'hackers',
        columns: [
          { name: 'hacker_id', type: 'INT', primaryKey: true, nullable: false, description: 'Hacker ID' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Hacker name' },
        ],
        sampleData: [
          [1, 'Alice'],
          [2, 'Bob'],
          [3, 'Charlie'],
          [4, 'Diana'],
          [5, 'Eve'],
        ],
      },
      {
        name: 'challenges',
        columns: [
          { name: 'challenge_id', type: 'INT', primaryKey: true, nullable: false, description: 'Challenge ID' },
          { name: 'hacker_id', type: 'INT', nullable: false, foreignKey: { table: 'hackers', column: 'hacker_id' }, description: 'Creator of the challenge' },
          { name: 'difficulty_level', type: 'INT', nullable: false, description: 'Difficulty 1-10' },
        ],
        sampleData: [
          [1, 1, 3],
          [2, 1, 5],
          [3, 2, 7],
          [4, 3, 2],
          [5, 4, 9],
        ],
      },
      {
        name: 'submissions',
        columns: [
          { name: 'submission_id', type: 'INT', primaryKey: true, nullable: false, description: 'Submission ID' },
          { name: 'hacker_id', type: 'INT', nullable: false, foreignKey: { table: 'hackers', column: 'hacker_id' }, description: 'Submitter' },
          { name: 'challenge_id', type: 'INT', nullable: false, foreignKey: { table: 'challenges', column: 'challenge_id' }, description: 'Challenge attempted' },
          { name: 'score', type: 'INT', nullable: false, description: 'Score achieved' },
          { name: 'submission_date', type: 'DATE', nullable: false, description: 'When submitted' },
        ],
        sampleData: [
          [1, 1, 1, 100, '2024-01-15'],
          [2, 2, 1, 80, '2024-01-15'],
          [3, 1, 3, 90, '2024-01-16'],
          [4, 3, 2, 100, '2024-01-16'],
          [5, 4, 5, 75, '2024-01-17'],
        ],
      },
      {
        name: 'contests',
        columns: [
          { name: 'contest_id', type: 'INT', primaryKey: true, nullable: false, description: 'Contest ID' },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Contest name' },
          { name: 'start_date', type: 'DATE', nullable: false, description: 'Contest start date' },
        ],
        sampleData: [
          [1, 'Weekly Challenge 1', '2024-01-15'],
          [2, 'Monthly Sprint', '2024-02-01'],
          [3, 'Code Marathon', '2024-03-15'],
        ],
      },
      {
        name: 'projects',
        columns: [
          { name: 'task_id', type: 'INT', primaryKey: true, nullable: false, description: 'Task ID' },
          { name: 'start_date', type: 'DATE', nullable: false, description: 'Task start date' },
          { name: 'end_date', type: 'DATE', nullable: false, description: 'Task end date' },
        ],
        sampleData: [
          [1, '2024-01-01', '2024-01-02'],
          [2, '2024-01-02', '2024-01-03'],
          [3, '2024-01-03', '2024-01-04'],
          [4, '2024-01-13', '2024-01-14'],
          [5, '2024-01-14', '2024-01-15'],
        ],
      },
      {
        name: 'friends',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'Student ID' },
          { name: 'friend_id', type: 'INT', nullable: false, description: 'Best friend ID' },
        ],
        sampleData: [
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 1],
        ],
      },
      {
        name: 'packages',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'Student ID' },
          { name: 'salary', type: 'DECIMAL(10,2)', nullable: false, description: 'Offered salary' },
        ],
        sampleData: [
          [1, 15.20],
          [2, 10.06],
          [3, 11.55],
          [4, 12.12],
        ],
      },
      {
        name: 'wands',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'Wand ID' },
          { name: 'code', type: 'INT', nullable: false, description: 'Wand code' },
          { name: 'coins_needed', type: 'INT', nullable: false, description: 'Galleons to buy' },
          { name: 'power', type: 'INT', nullable: false, description: 'Wand power' },
        ],
        sampleData: [
          [1, 4, 3688, 8],
          [2, 3, 9365, 3],
          [3, 3, 7187, 10],
          [4, 4, 734, 8],
          [5, 1, 6020, 2],
        ],
      },
      {
        name: 'wands_property',
        columns: [
          { name: 'code', type: 'INT', primaryKey: true, nullable: false, description: 'Wand code' },
          { name: 'age', type: 'INT', nullable: false, description: 'Wand age' },
          { name: 'is_evil', type: 'BOOLEAN', nullable: false, description: 'Whether wand is evil' },
        ],
        sampleData: [
          [1, 45, false],
          [2, 40, false],
          [3, 4, true],
          [4, 20, false],
        ],
      },
    ],
    relationships: [
      { from: 'challenges.hacker_id', to: 'hackers.hacker_id', type: 'many-to-one' },
      { from: 'submissions.hacker_id', to: 'hackers.hacker_id', type: 'many-to-one' },
      { from: 'submissions.challenge_id', to: 'challenges.challenge_id', type: 'many-to-one' },
      { from: 'friends.friend_id', to: 'friends.id', type: 'many-to-one' },
      { from: 'wands.code', to: 'wands_property.code', type: 'many-to-one' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 11. WEATHER & GEOGRAPHY DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'geography',
    name: 'Weather & Geography',
    description: 'Weather observation stations, climate data, and geographic measurements.',
    icon: '🌦️',
    color: '#3b82f6',
    tables: [
      {
        name: 'station',
        columns: [
          { name: 'id', type: 'INT', primaryKey: true, nullable: false, description: 'Station ID' },
          { name: 'city', type: 'VARCHAR(100)', nullable: false, description: 'City name' },
          { name: 'state', type: 'VARCHAR(2)', nullable: false, description: 'State code' },
          { name: 'lat_n', type: 'DECIMAL(10,4)', nullable: false, description: 'Latitude North' },
          { name: 'long_w', type: 'DECIMAL(10,4)', nullable: false, description: 'Longitude West' },
        ],
        sampleData: [
          [1, 'New York', 'NY', 40.7128, -74.0060],
          [2, 'Los Angeles', 'CA', 34.0522, -118.2437],
          [3, 'Chicago', 'IL', 41.8781, -87.6298],
          [4, 'Houston', 'TX', 29.7604, -95.3698],
          [5, 'Phoenix', 'AZ', 33.4484, -112.0740],
        ],
      },
    ],
    relationships: [],
  },

  // ═══════════════════════════════════════════════════════════
  // 12. COMPANY HIERARCHY DATABASE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'company_hierarchy',
    name: 'Company Hierarchy',
    description: 'Multi-level company organizational structure with founders, leads, and managers.',
    icon: '🏢',
    color: '#f97316',
    tables: [
      {
        name: 'company',
        columns: [
          { name: 'company_code', type: 'VARCHAR(10)', primaryKey: true, nullable: false, description: 'Company code' },
          { name: 'founder', type: 'VARCHAR(100)', nullable: false, description: 'Founder name' },
        ],
        sampleData: [
          ['C1', 'Mokan'],
          ['C2', 'Shadowplay'],
        ],
      },
      {
        name: 'lead_manager',
        columns: [
          { name: 'lead_manager_code', type: 'VARCHAR(10)', primaryKey: true, nullable: false, description: 'Lead Manager code' },
          { name: 'company_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'company', column: 'company_code' }, description: 'Company code' },
        ],
        sampleData: [
          ['LM1', 'C1'],
          ['LM2', 'C2'],
        ],
      },
      {
        name: 'senior_manager',
        columns: [
          { name: 'senior_manager_code', type: 'VARCHAR(10)', primaryKey: true, nullable: false, description: 'Senior Manager code' },
          { name: 'lead_manager_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'lead_manager', column: 'lead_manager_code' }, description: 'Lead manager code' },
          { name: 'company_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'company', column: 'company_code' }, description: 'Company code' },
        ],
        sampleData: [
          ['SM1', 'LM1', 'C1'],
          ['SM2', 'LM1', 'C1'],
          ['SM3', 'LM2', 'C2'],
        ],
      },
      {
        name: 'manager',
        columns: [
          { name: 'manager_code', type: 'VARCHAR(10)', primaryKey: true, nullable: false, description: 'Manager code' },
          { name: 'senior_manager_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'senior_manager', column: 'senior_manager_code' }, description: 'Senior manager code' },
          { name: 'lead_manager_code', type: 'VARCHAR(10)', nullable: false, description: 'Lead manager code' },
          { name: 'company_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'company', column: 'company_code' }, description: 'Company code' },
        ],
        sampleData: [
          ['M1', 'SM1', 'LM1', 'C1'],
          ['M2', 'SM3', 'LM2', 'C2'],
          ['M3', 'SM2', 'LM1', 'C1'],
        ],
      },
      {
        name: 'employee_hierarchy',
        columns: [
          { name: 'employee_code', type: 'VARCHAR(10)', primaryKey: true, nullable: false, description: 'Employee code' },
          { name: 'manager_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'manager', column: 'manager_code' }, description: 'Manager code' },
          { name: 'senior_manager_code', type: 'VARCHAR(10)', nullable: false, description: 'Senior manager code' },
          { name: 'lead_manager_code', type: 'VARCHAR(10)', nullable: false, description: 'Lead manager code' },
          { name: 'company_code', type: 'VARCHAR(10)', nullable: false, foreignKey: { table: 'company', column: 'company_code' }, description: 'Company code' },
        ],
        sampleData: [
          ['E1', 'M1', 'SM1', 'LM1', 'C1'],
          ['E2', 'M1', 'SM1', 'LM1', 'C1'],
          ['E3', 'M2', 'SM3', 'LM2', 'C2'],
          ['E4', 'M3', 'SM2', 'LM1', 'C1'],
        ],
      },
      {
        name: 'interviews_table',
        columns: [
          { name: 'contest_id', type: 'INT', nullable: false, description: 'Contest ID' },
          { name: 'hacker_id', type: 'INT', nullable: false, description: 'Hacker ID' },
          { name: 'total_submissions', type: 'INT', nullable: false, description: 'Total submissions' },
          { name: 'total_accepted', type: 'INT', nullable: false, description: 'Total accepted' },
          { name: 'total_views', type: 'INT', nullable: false, description: 'Total views' },
          { name: 'total_unique_views', type: 'INT', nullable: false, description: 'Total unique views' },
        ],
        sampleData: [
          [1, 101, 50, 40, 200, 150],
          [2, 102, 30, 25, 100, 80],
          [3, 103, 45, 38, 180, 120],
        ],
      },
    ],
    relationships: [
      { from: 'lead_manager.company_code', to: 'company.company_code', type: 'many-to-one' },
      { from: 'senior_manager.lead_manager_code', to: 'lead_manager.lead_manager_code', type: 'many-to-one' },
      { from: 'manager.senior_manager_code', to: 'senior_manager.senior_manager_code', type: 'many-to-one' },
      { from: 'employee_hierarchy.manager_code', to: 'manager.manager_code', type: 'many-to-one' },
    ],
  },
];

// Helper to get schema by ID
export const getSchemaById = (id) => SQL_SCHEMAS.find(s => s.id === id);

