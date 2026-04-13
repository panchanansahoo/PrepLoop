# Backend API Quick Reference

## Authentication & Authorization Quick Lookup

### Middleware Imports
```javascript
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
```

### Common Endpoint Patterns

#### Public Endpoint
```javascript
router.get('/public-data', async (req, res) => {
  const { data } = await supabaseAdmin.from('table').select('*');
  res.json({ data });
});
```

#### Authenticated Endpoint
```javascript
router.get('/user-data', authenticateToken, async (req, res) => {
  // req.user = { id, email, role }
  const userId = req.user.id;
  const { data } = await supabaseAdmin
    .from('table')
    .select('*')
    .eq('user_id', userId)
    .single();
  res.json({ data });
});
```

#### Admin-Only Endpoint
```javascript
router.post('/admin/action', authenticateToken, requireAdmin, async (req, res) => {
  // Guaranteed: req.user.role === 'admin'
  // Perform admin operation
  res.json({ success: true });
});
```

#### Optional Auth Endpoint (conditional content)
```javascript
router.get('/content', optionalAuth, async (req, res) => {
  const isAuthenticated = !!req.user;  // Optional
  // Return different content based on authentication
  res.json({ isAuthenticated });
});
```

## Jobs API Reference

### Career Ops Evaluation
```javascript
POST /api/jobs/career-ops/evaluate
Authorization: Bearer <jwt_token>
```

Evaluates a job description against a candidate profile and returns a normalized Career Ops result. The backend also persists the evaluation to Supabase when the schema is available.

### Career Ops History
```javascript
GET /api/jobs/career-ops/history?page=1&limit=10
Authorization: Bearer <jwt_token>
```

Returns the authenticated user's saved Career Ops evaluations with pagination.

## Role System

### Check Current Role (in middleware context)
```javascript
if (req.user.role === 'admin') {
  // Admin-specific logic
}
```

### Update User Role (admin only)
```javascript
await supabaseAdmin
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', userId)
  .select()
  .single();
```

## Query Patterns

### List with Pagination
```javascript
const { page = 1, limit = 20, search } = req.query;
const offset = (parseInt(page) - 1) * parseInt(limit);

let query = supabaseAdmin
  .from('table')
  .select('*', { count: 'exact' });

if (search) query = query.ilike('name', `%${search}%`);

const { data, count } = await query
  .order('created_at', { ascending: false })
  .range(offset, offset + parseInt(limit) - 1);

res.json({
  data,
  total: count,
  page: parseInt(page),
  totalPages: Math.ceil(count / parseInt(limit))
});
```

### Filter by Multiple Fields
```javascript
let query = supabaseAdmin.from('profiles').select('*');

if (role) query = query.eq('role', role);
if (tier) query = query.eq('subscription_tier', tier);
if (search) query = query.ilike('full_name', `%${search}%`);

const { data } = await query;
```

## Database Access

### Using Supabase Admin (Recommended)
```javascript
import { supabaseAdmin } from '../db/supabaseClient.js';

// SELECT
const { data, error } = await supabaseAdmin
  .from('table')
  .select('*')
  .eq('id', value);

// INSERT
const { data, error } = await supabaseAdmin
  .from('table')
  .insert([{ field: value }])
  .select();

// UPDATE
const { data, error } = await supabaseAdmin
  .from('table')
  .update({ field: newValue })
  .eq('id', id)
  .select();

// DELETE
const { error } = await supabaseAdmin
  .from('table')
  .delete()
  .eq('id', id);
```

### Using PostgreSQL Pool (for HR routes)
```javascript
import pgPool from '../config/db.js';

const result = await pgPool.query(
  'SELECT * FROM table WHERE id = $1',
  [id]
);
```

## Error Handling

### Standard Error Response
```javascript
if (!value) {
  return res.status(400).json({ error: 'Field is required' });
}
```

### Handling RLS Recursion Issues
```javascript
const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

try {
  // operation
} catch (error) {
  if (isProfilesAccessBlocked(error)) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      degraded: true
    });
  }
  res.status(500).json({ error: 'Failed to fetch data' });
}
```

## Rate Limiting

### Apply to Route
```javascript
import { forgotPasswordLimiter, verificationLimiter } from '../middleware/rateLimiter.js';

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  // Limited: 3 requests per 15 min per IP
});
```

### Available Limiters
- `forgotPasswordLimiter` - 3 per 15 min
- `verificationLimiter` - 3 per 15 min
- `contactLimiter` - 5 per hour

## Role-Based Response Examples

### List Users (Admin)
```javascript
GET /api/admin/users?page=1&limit=20&role=admin
Response:
{
  users: [
    {
      id: "uuid",
      full_name: "John Doe",
      email: "john@example.com",
      role: "admin",
      subscription_tier: "premium",
      created_at: "2026-04-01T00:00:00Z",
      last_login: "2026-04-01T12:00:00Z"
    }
  ],
  total: 150,
  page: 1,
  totalPages: 8
}
```

### Update User Role (Admin)
```javascript
PUT /api/admin/users/:id/role
Request: { role: "admin" }
Response:
{
  message: "User role updated to admin",
  user: {
    id: "uuid",
    role: "admin",
    ...
  }
}
```

### Platform Stats (Admin)
```javascript
GET /api/admin/stats
Response:
{
  totalUsers: 5000,
  adminCount: 5,
  newUsersWeek: 150,
  newUsersMonth: 500,
  totalSubmissions: 25000,
  totalInterviews: 3000,
  totalProblems: 450,
  totalPosts: 2000,
  totalResumes: 1500,
  tierBreakdown: {
    free: 4500,
    premium: 500
  },
  growthData: {
    "2026-03-28": 42,
    "2026-03-29": 38,
    ...
  }
}
```

## File Organization Reference

```
backend/
├── routes/
│   ├── admin.js           ← Admin endpoints
│   ├── auth.js            ← Auth endpoints
│   ├── library.js         ← Library + admin book mgmt
│   ├── user.js            ← User profile/dashboard
│   └── [30 other routes]
├── middleware/
│   ├── auth.js            ← authenticateToken, requireAdmin
│   ├── rateLimiter.js     ← Rate limiters
│   └── requestId.js       ← Request tracing
├── db/
│   ├── supabaseClient.js  ← Supabase clients
│   ├── schema.sql         ← Main schema
│   └── migration_*.sql    ← Migrations
├── config/
│   ├── db.js              ← PostgreSQL config
│   └── env.js             ← Env variables
├── index.js               ← Server setup & routes
└── ...
```

## Adding a New Admin Endpoint

1. **Create route** in `backend/routes/admin.js`:
```javascript
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

router.post('/admin/my-action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Your admin logic
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

2. **Route is auto-registered** in `backend/index.js`:
```javascript
app.use('/api/admin', adminRoutes);
// Now available at: POST /api/admin/my-action
```

3. **Client-side usage**:
```javascript
const response = await fetch('/api/admin/my-action', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ /* data */ })
});
```

## Current Roles

- `'user'` - Default role for all users
- `'admin'` - Platform administrators

To add new roles:
1. Update database schema (add check constraint)
2. Update middleware role checks
3. Create RLS policies
4. Update admin UI to support new roles
