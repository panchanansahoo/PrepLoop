# Complete Data Migration Guide - Preploop 425 DSA Problems

## 📋 Overview

This guide provides everything needed to migrate from **22 hand-crafted problems** to **425 complete DSA problems** on the Preploop platform.

**Timeline**: 1-2 weeks for data collection and entry  
**Effort**: ~30 hours total development/data entry  
**Status**: Framework complete, data collection ongoing

---

## 🚀 Quick Start

### For Developers
1. Read [DEPLOYMENT_START_HERE.md](DEPLOYMENT_START_HERE.md) first
2. Follow [QUICK_START.md](QUICK_START.md) for setup
3. Use [PROBLEM_DATA_SCHEMA_REFERENCE.json](PROBLEM_DATA_SCHEMA_REFERENCE.json) as data model
4. Reference [Backend Data Structure Analysis](BACKEND_DATA_STRUCTURE_ANALYSIS.md) for implementation details

### For Data Entry Tasks
1. Review the problem format in `PROBLEM_DATA_SCHEMA_REFERENCE.json`
2. Use the 22 hand-crafted problems as templates
3. Collect data from LeetCode/HackerRank
4. Update `backend/data/dsaProblemsExtended.js`
5. Run validation script to check data integrity

---

## 📊 Current Status

| Component | Status | Count |
|-----------|--------|-------|
| Hand-crafted Problems | ✅ Complete | 22/425 (5%) |
| Extended Problems Data | 🔄 In Progress | 403/425 (95%) |
| Database Schema | ✅ Ready | 15+ tables |
| Backend API | ✅ Ready | All endpoints built |
| Frontend Components | ✅ Ready | Full UI built |
| Validation Scripts | ✅ Ready | Auto-check infrastructure |
| Documentation | ✅ Complete | All guides ready |

---

## 📁 Key Files & Their Purpose

### Documentation Files
| File | Purpose |
|------|---------|
| DEPLOYMENT_START_HERE.md | Entry point for developers - what to do first |
| DEPLOYMENT_MANIFEST.md | Complete deployment checklist |
| QUICK_START.md | 5-minute setup guide |
| QUICK_REFERENCE.md | Cheat sheet for common tasks |
| BACKEND_DATA_STRUCTURE_ANALYSIS.md | Deep dive into data models |
| COMPONENT_COMPLETION_SUMMARY.md | UI component status |
| MODERN_COMPONENTS_SUMMARY.md | New component features |
| VALIDATION_CHECKLIST.md | Pre-deployment verification |
| PROBLEM_DATA_SCHEMA_REFERENCE.json | Complete data format reference |

### Code Files
| File | Purpose |
|------|---------|
| backend/db/seedProblems.js | Populates 425 problems into Supabase |
| backend/data/dsaProblemsExtended.js | Contains extended problem metadata |
| backend/routes/problems.js | API endpoints for problem queries |
| backend/services/Problem.js | Business logic for problems |
| frontend/src/pages/ProblemDetail.jsx | Problem display UI |
| frontend/src/components/ProblemFilter.jsx | Filtering/search UI |

---

## 🎯 Data Collection Roadmap

### Phase 1: Framework Completion (✅ DONE)
- [x] Database schema created
- [x] Backend API endpoints built
- [x] Frontend components created
- [x] Validation infrastructure ready
- [x] 22 hand-crafted problems as reference

### Phase 2: Data Collection (🔄 IN PROGRESS)
- [ ] Collect 50 Easy problems (days 1-2)
- [ ] Collect 75 Medium problems (days 3-5)
- [ ] Collect 25 Hard problems (days 6-7)
- [ ] Add company-specific problems (days 8-10)

### Phase 3: Data Entry (📅 PLANNED)
- [ ] Enter all problems into dsaProblemsExtended.js
- [ ] Validate against schema
- [ ] Batch test with seedProblems.js
- [ ] Performance test with 425 records

### Phase 4: Deployment (📅 PLANNED)
- [ ] Run final validation suite
- [ ] Seed production database
- [ ] Verify all UI components work
- [ ] Performance test and optimize
- [ ] Deploy to production

---

## 🛠️ Technical Implementation Details

### Required Fields for Each Problem

```javascript
{
  id: 1,
  title: "Problem Title",
  description: "Long form description",
  difficulty: "Easy|Medium|Hard",
  pattern: "One of 25 patterns",
  companies: [array of company names],
  examples: [
    {
      input: "example input",
      output: "example output",
      explanation: "why this output"
    }
  ],
  test_cases: [
    {
      input: test_input,
      output: test_output,
      notes: "test description"
    }
  ],
  starter_code: {
    python: "starter code",
    javascript: "starter code",
    cpp: "starter code",
    java: "starter code"
  },
  constraints: [array of constraints],
  hints: [array of hints],
  function_name: "functionName",
  time_complexity: "O(n)",
  space_complexity: "O(n)",
  tags: [array of tags],
  similar_problems: [array of related problem titles]
}
```

### Validation Checklist

Before seeding data to database:
- [ ] All 425 problems present
- [ ] No duplicate IDs
- [ ] Title is unique for each problem
- [ ] Description ≥ 50 characters
- [ ] Difficulty is valid (Easy/Medium/Hard)
- [ ] Pattern is from approved list (25 patterns)
- [ ] Constraints array has ≥ 2 items
- [ ] Companies array has ≥ 1 item
- [ ] Examples array has ≥ 2 items
- [ ] Test cases array has ≥ 3 items
- [ ] Starter code includes all 4 languages
- [ ] Time/space complexity follows Big O notation

---

## 📝 Data Entry Template

When adding new problems to `backend/data/dsaProblemsExtended.js`:

```javascript
// Example structure for new problems
const EXTENDED_PROBLEMS = [
  // Problems 1-22 (already exist - don't modify)
  
  // Problem 23 onwards (add here)
  {
    id: 23,
    title: "Valid Palindrome",
    description: "Given a string s, determine if it is a palindrome...",
    difficulty: "Easy",
    pattern: "String",
    companies: ["Amazon", "Microsoft", "Google"],
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: "After removing non-alphanumeric characters..."
      }
    ],
    test_cases: [
      {
        input: ["A man, a plan, a canal: Panama"],
        output: true,
        notes: "Valid palindrome with mixed case"
      }
    ],
    // ... rest of fields
  },
  // Continue with problems 24-425
];
```

---

## 🔧 How to Run Seeding

### Step 1: Prepare Data
```bash
cd backend
# Ensure dsaProblemsExtended.js has all 425 problems
```

### Step 2: Run Validation
```bash
node scripts/validateProblems.js
# Outputs validation report and fixes if possible
```

### Step 3: Seed Database
```bash
# One-time seed (recommended for initial setup)
node db/index.js

# Or run specific seeding function
node -e "require('./db/seedProblems.js').seedProblems()"
```

### Step 4: Verify
```bash
# Query database to verify
node -e "
  const { supabase } = require('./config/env.js');
  supabase.from('problems')
    .select('count')
    .then(d => console.log('Total problems:', d.data));
"
```

---

## 🎨 Frontend Integration

### How Problems Display

1. **Problem List Page** (`/problems`)
   - Shows all 425 problems
   - Filterable by difficulty, pattern, company
   - Searchable by title

2. **Problem Detail Page** (`/problems/:id`)
   - Full problem description
   - Examples with explanations
   - Test cases table
   - Code editor with starter code
   - Related/similar problems

3. **Components Used**
   - `ProblemList.jsx` - Displays all problems
   - `ProblemDetail.jsx` - Shows single problem
   - `ProblemFilter.jsx` - Filtering interface
   - `CodeEditor.jsx` - Code submission
   - `TestRunner.jsx` - Execute test cases

### Styling & UX
- Dark mode support (Tailwind)
- Responsive design (mobile/tablet/desktop)
- Fast performance with virtualization
- Accessibility features (WCAG 2.1)

---

## 📊 Data Distribution Target

The 425 problems should be distributed as:

### By Difficulty
- **Easy**: 150 problems (35%)
- **Medium**: 200 problems (47%)
- **Hard**: 75 problems (18%)

### By Pattern
- **Array**: 45 problems
- **Linked List**: 20 problems
- **Tree**: 35 problems
- **Graph**: 25 problems
- **String**: 30 problems
- **Dynamic Programming**: 45 problems
- **Other patterns**: 185 problems

### By Company
- **Amazon**: 120 problems
- **Google**: 85 problems
- **Microsoft**: 95 problems
- **Facebook**: 110 problems
- **Apple**: 80 problems
- **Other companies**: 335 problems

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find problem ID 50"
**Cause**: dsaProblemsExtended.js doesn't have all problems yet
**Solution**: Continue adding problems up to ID 425

### Issue 2: Validation errors for starter code
**Cause**: Missing one of the 4 languages (Python, JS, C++, Java)
**Solution**: Add starter code for all 4 languages

### Issue 3: Duplicate problem titles
**Cause**: Copy-pasted problems without updating title
**Solution**: Each problem must have a unique title

### Issue 4: Database seeding fails
**Cause**: Authentication issue or invalid data
**Solution**: 
- Check Supabase credentials
- Run validation script first
- Check database connection

### Issue 5: Frontend shows "Loading..." forever
**Cause**: API not responding or database not seeded
**Solution**:
- Check backend server is running
- Verify database has problems
- Check browser console for errors

---

## 🎯 Success Criteria

### Phase 2 Complete (Data Collection)
✅ All 425 problems collected from reliable sources  
✅ Data validated against schema  
✅ Test cases verified  
✅ Starter code ready for all 4 languages

### Phase 3 Complete (Data Entry)
✅ All 425 problems in dsaProblemsExtended.js  
✅ Validation script passes 100%  
✅ Database seeding successful  
✅ Frontend displays all problems correctly

### Phase 4 Complete (Live Production)
✅ All 425 problems live on production  
✅ Performance metrics acceptable  
✅ User feedback positive  
✅ Monthly maintenance plan in place

---

## 📚 Reference Links

- [LeetCode Problem List](https://leetcode.com/problemset/all/)
- [HackerRank DSA](https://www.hackerrank.com/domains/data-structures)
- [GeeksforGeeks DSA](https://www.geeksforgeeks.org/data-structures/)
- [Working with Supabase](https://supabase.com/docs)
- [Database Schema Reference](PROBLEM_DATA_SCHEMA_REFERENCE.json)
- [Backend Implementation](BACKEND_DATA_STRUCTURE_ANALYSIS.md)

---

## ✅ Next Steps

1. **Read** [DEPLOYMENT_START_HERE.md](DEPLOYMENT_START_HERE.md) to understand current state
2. **Review** [PROBLEM_DATA_SCHEMA_REFERENCE.json](PROBLEM_DATA_SCHEMA_REFERENCE.json) to understand data format
3. **Start collecting** problems (50 Easy → 75 Medium → 25 Hard)
4. **Enter data** into dsaProblemsExtended.js
5. **Run validation** script periodically
6. **Batch test** with seedProblems.js
7. **Deploy** when all 425 problems ready

---

## 📞 Support & Questions

When stuck, check:
1. **Logs** - Review current backend runtime logs and terminal output
2. **Validation** - Run `validateProblems.js` for detailed errors
3. **Schema** - Reference `PROBLEM_DATA_SCHEMA_REFERENCE.json`
4. **Examples** - Check the 22 hand-crafted problems for patterns
5. **Tests** - Run `npm test` to verify backend/frontend

---

**Last Updated**: March 13, 2026  
**Current Phase**: 🔄 Phase 2 - Data Collection (In Progress)  
**Estimated Completion**: Q1 2026 (2-3 weeks)
