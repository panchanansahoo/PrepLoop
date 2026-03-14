# 🚀 Quick Reference - Exploration System Setup

## 3-Step Deployment

### ✅ STEP 1: Apply Database Migration (5 seconds)

**Via Supabase Dashboard:**
1. Go to: https://app.supabase.com → Select project
2. SQL Editor → New Query
3. Copy: `backend/db/migration_add_exploration.sql`
4. Paste & Run → ✓ Done

**Via CLI:**
```bash
supabase db push backend/db/migration_add_exploration.sql
```

---

### ✅ STEP 2: Seed Explore Questions (Choose ONE)

**FAST PATH** ⚡ (Recommended - 1-2 minutes)
```bash
cd backend
node scripts/seedExploreQuestions.js
```
✓ Pattern-based questions  
✓ No API needed  
✓ All 425 problems enhanced  

**PREMIUM PATH** 🤖 (AI-Enhanced - 20-30 minutes)
```bash
cd backend
GROQ_API_KEY=your_key node scripts/enhanceProblemsWithExplore.js
```
✓ Unique questions per problem  
✓ Uses Groq AI API  
✓ More personalized  

---

### ✅ STEP 3: Verify Setup (1 minute)

```bash
cd backend
node verify-exploration.js
```

Expected: All checks ✓ passed

---

## 🎯 What You Get

| Metric | Count |
|--------|-------|
| Problems Enhanced | 425+ |
| Explore Questions | 2,125+ |
| Test Case Scenarios | 6,375+ |
| New API Endpoints | 2 |
| Learning Questions per Problem | 5-10 |
| Test Cases per Problem | 15+ |

---

## 📡 New API Endpoints

### Endpoint 1: Enhanced Problem Detail
```
GET /api/dsa/problems/:id

Returns: problem + exploration object
- exploreQuestions: [...]
- extendedTestCases: [...]
- metadata: {...}
```

### Endpoint 2: Exploration Only
```
GET /api/dsa/problems/:id/explore

Returns: pure exploration data
- questions with hints
- test cases with descriptions
- statistics
```

---

## 🧪 Test After Setup

```bash
# Verify API is working
curl http://localhost:5000/api/dsa/problems/1/explore

# Should return explore questions and test cases
```

---

## 📊 Check Database

In Supabase SQL Editor:
```sql
SELECT COUNT(*) as enhanced_problems 
FROM problems 
WHERE explore_questions IS NOT NULL;

-- Should return: 425 (or close to it)
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Column not found" | Apply migration first (Step 1) |
| No questions in database | Run seeding script (Step 2) |
| API returning empty | Run verification script |
| Slow API response | Check database indexes applied |
| Out of API quota | Use Fast Path instead of Premium |

---

## 🎓 Integration Example

```javascript
// Fetch exploration data
const response = await fetch(`/api/dsa/problems/${id}/explore`);
const data = await response.json();

// Use in React component
<ExploreQuestions questions={data.exploreQuestions} />
<ExtendedTestCases cases={data.extendedTestCases} />
```

---

## 📝 Setup Files Reference

| File | Purpose | Status |
|------|---------|--------|
| migration_add_exploration.sql | DB schema changes | ✅ Ready |
| seedExploreQuestions.js | Template-based seeding | ✅ Ready |
| enhanceProblemsWithExplore.js | AI-powered seeding | ✅ Ready |
| setup-exploration.js | Setup wizard | ✅ Ready |
| verify-exploration.js | Verification tool | ✅ Ready |
| dsa.js (routes) | API endpoints | ✅ Modified |

---

## ⏱️ Time Estimates

| Step | Fast Path | Premium Path |
|------|-----------|--------------|
| Migration | 5s | 5s |
| Seeding | 1-2 min | 20-30 min |
| Verification | 1 min | 1 min |
| **Total** | ~5 min | ~25-35 min |

---

## 🎯 Success Criteria

After setup, you should have:
- ✅ All 425 problems with explore questions
- ✅ All 425 problems with test cases
- ✅ API endpoints returning data
- ✅ Database indexes optimized
- ✅ Verification script showing all passed

---

## 🔗 Need Help?

1. **Setup questions?** → Read EXPLORATION_SETUP_GUIDE.md
2. **How it works?** → Read EXPLORATION_SYSTEM_SUMMARY.md
3. **API details?** → Check backend/routes/dsa.js
4. **Still stuck?** → Run verify-exploration.js for diagnostics

---

## 💡 Pro Tips

1. **Start with Fast Path** - Get results immediately, switch to Premium later if needed
2. **Run verification** - Always run verify script after setup
3. **Check database** - Monitor with SQL queries if concerned about quality
4. **Test one problem** - Call `/explore` endpoint for problem ID 1 to verify
5. **Keep scripts** - Scripts are safe to re-run, they're idempotent

---

**Ready? Start with Step 1! ⬆️**

(Last updated: 2025-03-13)
