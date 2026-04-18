# Quick Start: Security Fixes

## Immediate Setup (5 minutes)

### 1. Generate JWT Secrets
```bash
npm run generate:jwt
```

Copy the output and add to `backend/.env`:
```env
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

### 2. Verify Environment Setup
```bash
npm run verify:setup:strict
```

### 3. Run Security Scan
```bash
npm run scan:secrets
```

### 4. Test the Application
```bash
npm run dev
```

## Verify Security Features

### 1. Test Rate Limiting
```bash
# Should block after 20 requests in 1 minute
for i in {1..25}; do curl http://localhost:5000/api/ai/health; done
```

### 2. Test CORS
```bash
# Should be blocked (invalid origin)
curl -H "Origin: http://localhost:9999" http://localhost:5000/api/health

# Should work (valid origin)
curl -H "Origin: http://localhost:5173" http://localhost:5000/api/health
```

### 3. Test Input Sanitization
```bash
curl -X POST http://localhost:5000/api/test \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'
# Script tags should be stripped
```

### 4. Test Health Monitoring
```bash
npm run monitor:health
# Check logs for health check results
```

## Production Deployment

### 1. Update Environment Variables
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
PRODUCTION_DOMAIN=your-domain.com
```

### 2. Run Pre-Deployment Checks
```bash
npm run scan:secrets
npm run audit
npm run lint
npm run test
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Setup Monitoring
```bash
# In production server
export ALERT_WEBHOOK_URL=https://your-webhook-url
npm run monitor:health &
```

### 5. Setup Database Backups
```bash
# Add to crontab for daily backups
0 2 * * * cd /path/to/preploop && npm run backup:db
```

## Troubleshooting

### Issue: JWT_SECRET validation fails
**Solution**: Ensure secret is at least 32 characters
```bash
npm run generate:jwt
```

### Issue: CORS errors in production
**Solution**: Add production domain to .env
```env
PRODUCTION_FRONTEND_URL=https://your-domain.com
PRODUCTION_DOMAIN=your-domain.com
```

### Issue: Rate limiting too strict
**Solution**: Adjust limits in .env
```env
GLOBAL_RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=50
```

### Issue: Cache not working
**Solution**: Check logs for cache hits/misses
```bash
grep "Cache" backend/logs/*.log
```

## Next Steps

1. Review [SECURITY.md](./docs/SECURITY.md) for detailed security guide
2. Review [PERFORMANCE.md](./docs/PERFORMANCE.md) for optimization tips
3. Review [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) before production
4. Setup CI/CD pipeline using `.github/workflows/security.yml`

## Support

- Security issues: See [SECURITY.md](./docs/SECURITY.md)
- Performance issues: See [PERFORMANCE.md](./docs/PERFORMANCE.md)
- Deployment help: See [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)
