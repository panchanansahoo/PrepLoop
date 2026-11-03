# PrepLoop Quick Reference Card

## Quick Start
Start developing locally with automated concurrency:
```bash
npm run dev
```

## NPM Scripts
```bash
# Backend test suite (Vitest)
npm run test:ci --prefix backend

# Frontend test suite
npm run test:ci --prefix frontend

# Mobile unit tests
npm test --prefix mobile

# Verify platform improvements
npm run test:improvements
npm run test:quick
```

## Code Snippets
### HR Token Authorization Header
```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

### Direct Database Query with Pool
```javascript
import pool from '../config/db.js';
const { rows } = await pool.query('SELECT 1');
```
