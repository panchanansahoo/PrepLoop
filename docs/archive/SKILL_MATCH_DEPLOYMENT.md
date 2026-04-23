# Skill-Match Jobs - Deployment Checklist

## Pre-Deployment Checklist

### Code Review
- [ ] Backend endpoint code reviewed
- [ ] Frontend component code reviewed
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Rate limiting configured

### Testing
- [ ] Backend endpoint tested manually
- [ ] Frontend widget tested in browser
- [ ] Match score calculation verified
- [ ] Auto-refresh tested (5 min wait)
- [ ] Manual refresh tested
- [ ] Empty state tested
- [ ] Loading state tested
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

### Documentation
- [ ] Feature documentation complete
- [ ] API documentation updated
- [ ] Visual guide created
- [ ] Testing guide created
- [ ] README updated

### Security
- [ ] Authentication required on endpoint
- [ ] User can only access own data
- [ ] Rate limiting enabled
- [ ] External URLs validated
- [ ] No sensitive data exposed

### Performance
- [ ] Caching implemented (10 min TTL)
- [ ] Auto-refresh interval set (5 min)
- [ ] Cleanup on component unmount
- [ ] No memory leaks detected
- [ ] Network requests optimized

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to backend
cd backend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Run tests
npm test

# Restart backend server
pm2 restart preploop-backend
# OR
npm run start
```

### 2. Frontend Deployment

```bash
# Navigate to frontend
cd frontend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Deploy build folder
# (Copy dist/ to your hosting service)
```

### 3. Database Check

```bash
# Verify profiles table exists
# Connect to your database and run:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

# Expected columns:
# - id (UUID)
# - skills (TEXT)
# - experience_summary (TEXT)
# - experience_level (VARCHAR)
```

### 4. Environment Variables

Verify these are set in production:

**Backend (.env)**
```bash
# Job API Keys (at least one should be set)
RAPIDAPI_KEY=your_key_here
ADZUNA_APP_ID=your_id_here
ADZUNA_APP_KEY=your_key_here

# Supabase (required)
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

**Frontend (.env)**
```bash
VITE_API_URL=https://your-api-domain.com
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### 5. Smoke Tests

After deployment, run these quick tests:

**Test 1: Backend Health**
```bash
curl https://your-api-domain.com/health
# Expected: {"status": "ok"}
```

**Test 2: Skill-Match Endpoint**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-api-domain.com/api/jobs/skill-match
# Expected: JSON with jobs array
```

**Test 3: Frontend Widget**
- Navigate to https://your-domain.com/dashboard
- Login with test account
- Verify widget appears
- Check jobs load
- Test refresh button

### 6. Monitoring

Set up monitoring for:

- [ ] API endpoint response times
- [ ] Error rates
- [ ] Job API success rates
- [ ] User engagement metrics
- [ ] Widget load times

### 7. Rollback Plan

If issues occur:

```bash
# Backend rollback
cd backend
git checkout previous-commit-hash
pm2 restart preploop-backend

# Frontend rollback
cd frontend
git checkout previous-commit-hash
npm run build
# Deploy previous build
```

## Post-Deployment Checklist

### Immediate (0-1 hour)
- [ ] Verify widget appears on dashboard
- [ ] Test with real user account
- [ ] Check error logs for issues
- [ ] Monitor API response times
- [ ] Verify job data is loading

### Short-term (1-24 hours)
- [ ] Monitor user engagement
- [ ] Check for error reports
- [ ] Verify auto-refresh working
- [ ] Monitor API rate limits
- [ ] Check database performance

### Long-term (1-7 days)
- [ ] Analyze user feedback
- [ ] Review match score accuracy
- [ ] Monitor job API costs
- [ ] Check cache hit rates
- [ ] Optimize if needed

## Rollout Strategy

### Option 1: Full Rollout
- Deploy to all users immediately
- Monitor closely for first 24 hours
- Be ready to rollback if issues

### Option 2: Gradual Rollout
1. Deploy to 10% of users (Day 1)
2. Monitor for issues
3. Deploy to 50% of users (Day 2)
4. Monitor for issues
5. Deploy to 100% of users (Day 3)

### Option 3: Feature Flag
- Deploy code but keep feature disabled
- Enable for beta users first
- Gradually enable for all users
- Can disable instantly if issues

## Success Metrics

Track these metrics post-deployment:

### Technical Metrics
- Widget load time: < 3 seconds
- API response time: < 2 seconds
- Error rate: < 1%
- Cache hit rate: > 80%
- Auto-refresh success rate: > 95%

### User Metrics
- Widget visibility rate: > 80%
- Job click-through rate: > 10%
- Apply button clicks: > 5%
- Manual refresh rate: > 20%
- Widget toggle-off rate: < 10%

### Business Metrics
- User engagement increase
- Time on dashboard increase
- Profile completion rate increase
- Job application rate increase

## Common Issues & Solutions

### Issue: Widget not showing
**Check**:
- Component imported in Dashboard.jsx
- Widget registered in WIDGET_REGISTRY
- Widget enabled in localStorage
- No JavaScript errors in console

**Fix**:
```javascript
// Clear localStorage and reload
localStorage.removeItem('preploop_dashboard_widgets');
window.location.reload();
```

### Issue: No jobs loading
**Check**:
- Backend server running
- Job APIs responding
- User has skills in profile
- Network requests succeeding

**Fix**:
- Check backend logs
- Test job APIs manually
- Verify user profile data

### Issue: Match scores incorrect
**Check**:
- User skills format (comma-separated)
- Job description parsing
- Match algorithm logic

**Fix**:
- Review match score calculation
- Test with known skill sets
- Adjust algorithm if needed

### Issue: Auto-refresh not working
**Check**:
- Interval set correctly (5 min)
- Cleanup function runs on unmount
- No JavaScript errors

**Fix**:
```javascript
// Verify interval in component
useEffect(() => {
  const interval = setInterval(fetchMatchedJobs, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

## Emergency Contacts

- **Backend Issues**: [Backend Team Lead]
- **Frontend Issues**: [Frontend Team Lead]
- **Database Issues**: [Database Admin]
- **API Issues**: [API Team Lead]
- **On-Call**: [On-Call Engineer]

## Deployment Sign-Off

- [ ] Code reviewed and approved
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Deployment plan reviewed
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Team notified

**Deployed By**: _______________
**Date**: _______________
**Time**: _______________
**Version**: _______________

---

**Ready to deploy? Let's ship it! 🚀**
