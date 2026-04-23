# Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] All environment variables configured
- [ ] API keys rotated and secured
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled and configured
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Helmet.js configured
- [ ] HTTPS enforced
- [ ] Security headers configured

### Performance
- [ ] Caching strategy implemented
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Static assets minified
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Lazy loading implemented
- [ ] CDN configured for static assets

### Monitoring
- [ ] Error tracking configured (Sentry/similar)
- [ ] APM tool integrated (New Relic/DataDog)
- [ ] Log aggregation setup
- [ ] Health check endpoints tested
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Alert rules configured

### Testing
- [ ] All unit tests passing
- [ ] E2E tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security scanning completed
- [ ] Accessibility testing done

### Database
- [ ] Migrations applied
- [ ] Backups configured
- [ ] Backup restoration tested
- [ ] Connection limits set
- [ ] Query timeouts configured
- [ ] Indexes optimized

### Infrastructure
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Load balancer configured
- [ ] Auto-scaling rules set
- [ ] Firewall rules configured
- [ ] DDoS protection enabled

## Deployment Steps

### 1. Backend Deployment
```bash
# Build
cd backend
npm install --production

# Run migrations
node scripts/runMigrations.js

# Start server
npm start
```

### 2. Frontend Deployment
```bash
# Build
cd frontend
npm run build

# Deploy to CDN/hosting
# (Vercel, Netlify, S3+CloudFront, etc.)
```

### 3. Database Migration
```bash
# Backup first
pg_dump $DATABASE_URL > backup.sql

# Apply migrations
npm run migrate

# Verify
npm run verify:migration
```

### 4. Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://preploop.com
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GROQ_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Frontend
VITE_API_URL=https://api.preploop.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Post-Deployment

### Verification
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] Payment flow working
- [ ] Email delivery working
- [ ] AI features working
- [ ] Database queries performing well

### Monitoring
- [ ] Check error rates
- [ ] Monitor response times
- [ ] Review logs for issues
- [ ] Verify metrics collection
- [ ] Test alert notifications

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify cache hit rates
- [ ] Monitor database performance
- [ ] Check API response times

## Rollback Plan

### If Issues Occur
1. **Immediate**: Switch traffic to previous version
2. **Database**: Restore from backup if needed
3. **Notify**: Alert team and stakeholders
4. **Investigate**: Review logs and metrics
5. **Fix**: Address issues in staging
6. **Redeploy**: Once verified

### Rollback Commands
```bash
# Revert to previous version
git revert HEAD
git push

# Restore database
psql $DATABASE_URL < backup.sql

# Redeploy
npm run deploy
```

## Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review performance metrics

### Weekly
- [ ] Review security alerts
- [ ] Check backup integrity
- [ ] Update dependencies
- [ ] Review user feedback

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Capacity planning

## Emergency Contacts

- **DevOps Lead**: [contact]
- **Backend Lead**: [contact]
- **Frontend Lead**: [contact]
- **Database Admin**: [contact]
- **Security Team**: [contact]

## Documentation

- [ ] API documentation updated
- [ ] Architecture diagrams current
- [ ] Runbooks created
- [ ] Incident response plan documented
- [ ] Disaster recovery plan documented

## Compliance

- [ ] GDPR compliance verified
- [ ] Data retention policies implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented

## Optimization Opportunities

### Short-term
- Enable HTTP/2
- Implement service worker
- Add Redis caching
- Optimize database queries
- Compress responses

### Long-term
- Migrate to TypeScript
- Implement GraphQL
- Add WebSocket support
- Microservices architecture
- Kubernetes deployment

## Success Metrics

- **Uptime**: > 99.9%
- **Response Time**: < 200ms (p95)
- **Error Rate**: < 0.1%
- **Core Web Vitals**: All "Good"
- **Security Score**: A+ on SSL Labs

## Notes

- Keep this checklist updated
- Document any deviations
- Share learnings with team
- Automate where possible
