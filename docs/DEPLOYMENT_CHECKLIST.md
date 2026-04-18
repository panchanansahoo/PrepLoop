# Production Deployment Checklist

## Pre-Deployment Security

- [ ] All environment variables configured (see `docs/SECURITY.md`)
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are 32+ characters
- [ ] No secrets in code (run `npm run scan:secrets`)
- [ ] Dependencies audited (run `npm run audit`)
- [ ] CORS configured with production domains only
- [ ] Rate limiting configured appropriately
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (Helmet)

## Database

- [ ] All migrations applied
- [ ] RLS policies reviewed and tested
- [ ] Performance indexes created
- [ ] Backup strategy configured
- [ ] Connection pooling configured
- [ ] Database credentials rotated

## Performance

- [ ] Caching strategy implemented
- [ ] Response compression enabled
- [ ] Static assets on CDN
- [ ] Database queries optimized
- [ ] Frontend bundle size < 500KB
- [ ] Images optimized (WebP format)
- [ ] Code splitting implemented

## Monitoring & Logging

- [ ] Health check endpoints tested
- [ ] Structured logging configured
- [ ] Error tracking setup (Sentry/similar)
- [ ] Performance monitoring enabled
- [ ] Alert webhooks configured
- [ ] Log aggregation setup

## Testing

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Manual QA completed

## Infrastructure

- [ ] Auto-scaling configured
- [ ] Load balancer setup
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Backup servers ready
- [ ] Disaster recovery plan documented

## Code Quality

- [ ] Linting passing (run `npm run lint`)
- [ ] Code formatted (run `npm run format`)
- [ ] No console.log in production code
- [ ] Error handling consistent
- [ ] API documentation updated

## Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring dashboards reviewed
- [ ] Performance metrics baseline established
- [ ] Rollback plan tested
- [ ] Team notified of deployment
- [ ] Documentation updated

## Environment Variables Checklist

### Critical (Must Have)
- [ ] NODE_ENV=production
- [ ] PORT
- [ ] FRONTEND_URL
- [ ] JWT_SECRET (32+ chars)
- [ ] JWT_REFRESH_SECRET (32+ chars)
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

### Optional (Feature-Dependent)
- [ ] GROQ_API_KEY (AI features)
- [ ] RAZORPAY_KEY_ID (Payments)
- [ ] RAZORPAY_KEY_SECRET (Payments)
- [ ] SMTP_USER (Email)
- [ ] SMTP_PASS (Email)
- [ ] USE_REDIS=true (Azure runtime)
- [ ] REDIS_URL=redis://:<password>@10.50.2.4:6379 (Azure private Redis)
- [ ] WEBSITE_VNET_ROUTE_ALL=1 (Azure App Service)
- [ ] ALERT_WEBHOOK_URL (Monitoring)

### Redis Release Gate
- [ ] `npm run redis:guardrails` passes
- [ ] `npm run redis:guardrails:strict` passes
- [ ] Redis remains private-only on Azure

## Security Verification

```bash
# Run all security checks
npm run scan:secrets
npm run audit
npm run lint
npm run test

# Verify environment
npm run verify:setup:strict
```

## Performance Verification

```bash
# Build frontend
npm run build --prefix frontend

# Check bundle size
du -sh frontend/dist

# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health
```

## Rollback Plan

1. Keep previous version tagged in Git
2. Database migrations should be reversible
3. Feature flags for new features
4. Blue-green deployment strategy
5. Quick rollback script ready

## Support Contacts

- DevOps: devops@preploop.com
- Security: security@preploop.com
- On-call: oncall@preploop.com
