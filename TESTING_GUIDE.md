# Testing Guide

## Overview
PrepLoop uses multiple testing strategies to ensure code quality and reliability.

## Test Types

### 1. Unit Tests (Vitest)
Located in `frontend/src/test/` and `backend/scripts/test*.js`

**Run unit tests:**
```bash
# Frontend
cd frontend
npm run test
npm run test:watch  # Watch mode

# Backend
cd backend
npm run test
```

### 2. E2E Tests (Playwright)
Located in `frontend/tests/e2e/`

**Run E2E tests:**
```bash
# From root
npm run test:e2e

# From frontend
cd frontend
npm run test:e2e
npm run test:e2e:ui  # Interactive UI mode
npm run test:e2e:report  # View last report
```

**Setup test user:**
Create `.env.test` in frontend:
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### 3. Integration Tests
Located in `backend/scripts/smoke*.js`

**Run integration tests:**
```bash
cd backend
node scripts/smokeAIFeatures.js
node scripts/smokeInterviewSuite.js
node scripts/smokeDsaCodeEditor.js
```

## Writing Tests

### Unit Test Example
```javascript
import { describe, it, expect } from 'vitest';
import { sanitizeText } from '../utils/sanitize';

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const output = sanitizeText(input);
    expect(output).toBe('Hello');
  });
});
```

### E2E Test Example
```javascript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Test Coverage

### Critical Flows
- ✅ User authentication (signup, login, logout)
- ✅ DSA problem solving
- ✅ AI interview sessions
- ✅ Code submission and review
- ✅ Progress tracking
- ✅ Payment integration
- ✅ Notes management

### API Endpoints
- ✅ Auth endpoints
- ✅ DSA endpoints
- ✅ AI features endpoints
- ✅ Interview endpoints
- ✅ Payment webhooks

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Run unit tests
        run: npm run test
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Test Data Management

### Seeding Test Data
```bash
cd backend
node db/seed.js
```

### Cleanup Test Data
```bash
node scripts/cleanupTestData.js
```

## Debugging Tests

### Playwright Debug Mode
```bash
PWDEBUG=1 npm run test:e2e
```

### Headed Mode
```bash
npm run test:e2e -- --headed
```

### Specific Test
```bash
npm run test:e2e -- critical-flows.spec.js
```

### Generate Test Code
```bash
npx playwright codegen http://localhost:5173
```

## Performance Testing

### Load Testing (k6)
```bash
k6 run backend/scripts/loadTest.js
```

### Lighthouse CI
```bash
npm install -g @lhci/cli
lhci autorun
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Mocking**: Mock external services in unit tests
4. **Assertions**: Use descriptive assertions
5. **Timeouts**: Set appropriate timeouts for async operations
6. **Selectors**: Use data-testid attributes for stable selectors

## Troubleshooting

### Tests Timing Out
- Increase timeout in test config
- Check if services are running
- Verify network connectivity

### Flaky Tests
- Add explicit waits
- Use retry logic
- Check for race conditions

### Database Issues
- Ensure test database is seeded
- Check connection strings
- Verify migrations are applied

## Continuous Improvement

- Review test coverage regularly
- Add tests for bug fixes
- Update tests when features change
- Monitor test execution time
- Remove obsolete tests
