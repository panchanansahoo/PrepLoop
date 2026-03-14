# Phase 2: Data Collection - Complete Plan & Progress Tracker

**Status**: 🔄 IN PROGRESS  
**Current**: 22/425 problems (5%)  
**Target**: 425 total problems  
**Timeline**: Week 1 (Complete by end of week)  
**Created**: March 13, 2026

---

## 📊 Collection Strategy

### Target Distribution
```
Easy Problems:   150 total (currently: 8|need: 142)
Medium Problems: 200 total (currently: 10|need: 190)
Hard Problems:   75 total  (currently: 4|need: 71)
─────────────────────────────────
TOTAL:          425 total  (currently: 22|need: 403)
```

### Daily Breakdown for Week 1
```
Day 1-2 (Mon-Tue):  Collect 50 Easy problems (25/day)
Day 3-4 (Wed-Thu):  Collect 75 Medium problems (37-38/day)
Day 5-6 (Fri-Sat):  Collect 50 Hard problems (25/day)
Day 7 (Sun):        Validation & Quality Check (all 175 problems)
```

### Source Priority Order
1. **LeetCode** (Premium content, most popular)
   - Filter by: Acceptance Rate, Difficulty
   - Companies: All companies collected
   
2. **HackerRank** (Good variety, free)
   - DSA section with clear patterns
   - Good test case examples
   
3. **GeeksforGeeks** (Comprehensive, free)
   - In-depth explanations
   - Multiple solutions
   
4. **CodeSignal** (Interview prep specific)
   - Real company interview problems
   
5. **InterviewBit** (Interview focus)
   - Coding interview specific

---

## 🎯 Collection Process (Step by Step)

### For Each Problem:

1. **Extract Basic Info**
   - Title (must be unique)
   - Description (50+ chars minimum)
   - Difficulty (Easy/Medium/Hard)
   - Pattern (match to 25 approved patterns)
   - Companies (min 1, ideally 2-3)

2. **Create Examples Section**
   - Minimum 2 examples
   - Each with: input, output, explanation
   - Use realistic, clear examples

3. **Generate Test Cases**
   - Minimum 3 test cases
   - Cover: normal case, edge case, large input
   - Format: {input, output, notes}

4. **Write Starter Code**
   - Python (must have)
   - JavaScript (must have)
   - C++ (preferred)
   - Java (preferred)

5. **Add Constraints**
   - Minimum 2 constraints
   - Include: array sizes, value ranges, time limits

6. **Calculate Complexity**
   - Time Complexity (Big O notation)
   - Space Complexity (Big O notation)

7. **Add Metadata**
   - Hints (optional, 1-3)
   - Tags (3-5 relevant tags)
   - Similar problems (if known)
   - Function name

---

## 📋 Quality Checklist (Before Adding Problem)

Before adding any problem to the system, verify:

- [ ] **Unique**: Title not in existing 22 problems
- [ ] **Description**: 50+ characters, clear problem statement
- [ ] **Pattern**: One of 25 approved patterns
- [ ] **Difficulty**: Easy/Medium/Hard correctly assigned
- [ ] **Companies**: At least 1 company, preferably 2-3
- [ ] **Examples**: 2+ examples with input/output/explanation
- [ ] **Test Cases**: 3+ test cases with inputs/outputs
- [ ] **Starter Code**: ALL 4 languages (Python, JS, C++, Java)
- [ ] **Constraints**: 2+ clear constraints
- [ ] **Complexity**: Time and space complexity documented
- [ ] **Function Name**: Clear, snake_case format
- [ ] **Valid JSON**: Passes JSON validation

---

## 🏗️ Data Structure Reminder

Each problem must have this exact structure:

```javascript
{
  id: 23,                          // Auto-increment from 23 onward
  title: "Problem Title",          // UNIQUE - no duplicates
  description: "Clear description...",  // 50+ characters
  difficulty: "Medium",            // Easy|Medium|Hard
  pattern: "Dynamic Programming",  // One of 25 patterns
  companies: ["Google", "Amazon"], // Min 1, usually 2-3
  examples: [
    {
      input: "...",
      output: "...",
      explanation: "Why this output..."
    }
  ],
  test_cases: [
    {
      input: "...",
      output: "...",
      notes: "Normal case"
    }
  ],
  starter_code: {
    python: "def solution(...):\n    pass",
    javascript: "function solution(...) { }",
    cpp: "...",
    java: "..."
  },
  constraints: [
    "1 ≤ n ≤ 10^5",
    "Time complexity: O(n log n)"
  ],
  hints: ["Hint 1", "Hint 2"],
  function_name: "solution",
  time_complexity: "O(n log n)",
  space_complexity: "O(n)",
  tags: ["sorting", "array", "greedy"],
  similar_problems: ["Problem 1", "Problem 2"]
}
```

---

## 📦 25 Approved Patterns

When collecting problems, ensure you match to ONE of these patterns:

1. Array
2. Linked List
3. Tree
4. Binary Tree
5. Binary Search Tree
6. Graph
7. String
8. Stack
9. Queue
10. Heap
11. Hash Map
12. Hash Set
13. Dynamic Programming
14. Two Pointers
15. Sliding Window
16. Binary Search
17. Bit Manipulation
18. Greedy
19. Trie
20. Union Find
21. Topological Sort
22. DFS
23. BFS
24. Matrix
25. Backtracking

---

## 🏢 100+ Company List (Sample)

Ensure problems map to the following companies:

**FAANG + Tier 1:**
- Google
- Amazon
- Microsoft
- Facebook (Meta)
- Apple
- LinkedIn
- Bloomberg
- Uber
- Netflix
- Adobe

**Tech Giants:**
- IBM
- Intel
- Cisco
- Oracle
- Salesforce
- Stripe
- Airbnb
- GitHub
- TripAdvisor
- Yahoo

**Finance/Trading:**
- Deutsche Bank
- Goldman Sachs
- JP Morgan
- Morgan Stanley
- Citadel
- Two Sigma
- Optiver

**And 70+ more...**

---

## 📝 Collection Template

Use this template for each problem collected:

```
Problem #: 23
Source: LeetCode/HackerRank/GeeksforGeeks
Source URL: [link]
Date Collected: 2026-03-13

Title: [Title]
Difficulty: [Easy/Medium/Hard]
Pattern: [One of 25]
Companies: [List]

Description:
[Full description]

Examples:
Example 1:
  Input: [...]
  Output: [...]
  Explanation: [...]

Example 2:
  Input: [...]
  Output: [...]
  Explanation: [...]

Test Cases:
Test 1 (Normal):
  Input: [...]
  Output: [...]
  Notes: [...]

Test 2 (Edge):
  Input: [...]
  Output: [...]
  Notes: [...]

Test 3 (Large):
  Input: [...]
  Output: [...]
  Notes: [...]

Code Templates:
Python:
[code]

JavaScript:
[code]

C++:
[code]

Java:
[code]

Complexity:
Time: O(...)
Space: O(...)

Hints:
1. [Hint]
2. [Hint]

Tags: [tag1, tag2, tag3]
Similar: [problem1, problem2]
```

---

## ✅ Daily Checklist

### Day 1-2: Easy Problems (Target: 50)
- [ ] Collect 25 Easy problems on Day 1
- [ ] Collect 25 Easy problems on Day 2
- [ ] Verify all meet quality checklist
- [ ] Check for duplicates against existing 22
- [ ] All starter code in 4 languages
- [ ] Save to temporary collection file

### Day 3-4: Medium Problems (Target: 75)
- [ ] Collect 40 Medium problems on Day 3
- [ ] Collect 35 Medium problems on Day 4
- [ ] Verify all meet quality checklist
- [ ] Check pattern distribution
- [ ] Company mapping verified
- [ ] All test cases present

### Day 5-6: Hard Problems (Target: 50)
- [ ] Collect 25 Hard problems on Day 5
- [ ] Collect 25 Hard problems on Day 6
- [ ] Verify all meet quality checklist
- [ ] Higher complexity properly documented
- [ ] Edge cases covered in test cases
- [ ] Hints included where helpful

### Day 7: Validation (All 175 new)
- [ ] Run full validation script
- [ ] Check total count (22 + 175 = 197 collected so far)
- [ ] Verify JSON validity
- [ ] Check for duplicates
- [ ] Verify pattern distribution
- [ ] Confirm difficulty distribution
- [ ] Generate collection report

---

## 🔍 Duplicate Check Process

Before adding a problem, verify it's NOT already in the 22:

**Existing 22 Problems:**
1. Two Sum
2. Best Time to Buy Stock
3. Contains Duplicate
4. [... 19 more ...]

Compare by:
- [ ] Title is unique
- [ ] Problem statement is different
- [ ] Not an alternative/variant of existing

---

## 📊 Progress Tracking

### Real-Time Tracker

**Status as of March 13, 2026:**
```
✅ Complete: 22 problems (5%)
🔄 In Progress: [tracking below]
⏳ Remaining: 403 problems (95%)
```

**This Week Target:**
- Day 1-2: 50 Easy problems
- Day 3-4: 75 Medium problems  
- Day 5-6: 50 Hard problems
- **Week Total: 175 problems (41% of goal)**

**Tracking Sheet:**
```
Day 1:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 2:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 3:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 4:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 5:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 6:  [ ][ ][ ][ ][ ] (5 collected) = __ total
Day 7:  Validation & checking
```

---

## 🛠️ Tools & Resources Needed

### For Collection:
- [x] LeetCode account (Premium access helpful)
- [x] HackerRank account (free)
- [x] GeeksforGeeks access (free)
- [x] Text editor for formatting
- [x] JSON validator (online tool)

### For Validation:
- [x] validateProblems.js script (ready in backend)
- [x] Duplicate checker script (ready)
- [x] JSON syntax checker (ready)

### For Data Entry:
- [x] Template format (PROBLEM_DATA_SCHEMA_REFERENCE.json)
- [x] Entry script (ready)
- [x] Database ready to receive data

---

## 🎓 Best Practices During Collection

1. **Stay Consistent**: Use the template exactly for every problem
2. **Test the Code**: Verify starter code compiles/runs in all languages
3. **Clear Examples**: Make examples easy to understand
4. **Avoid Duplicates**: Check existing problems before adding
5. **Pattern Mapping**: Every problem must map to one of 25 patterns
6. **Company Tagging**: Use real companies from list
7. **Quality First**: Better to have 100 great problems than 425 mediocre
8. **Document Source**: Always record where the problem came from
9. **Validate Early**: Check JSON validity as you go, not at the end
10. **Take Breaks**: Don't rush - quality matters more than speed

---

## 💾 Storage Strategy

### Temporary Collection File
Location: `c:\Users\panch\Desktop\Preploop\PHASE2_COLLECTED_PROBLEMS.json`

Format: JSON array of all collected problems during Phase 2

### Backup Strategy
- Save daily backup: `PHASE2_COLLECTED_PROBLEMS_DAY[1-7].json`
- Commit to git after each day
- Keep raw source notes in separate file

---

## 🚨 Common Pitfalls to Avoid

❌ **Wrong**: Collecting problems without verifying they're unique  
✅ **Right**: Check against existing 22 + already collected

❌ **Wrong**: Using only 1 language for starter code  
✅ **Right**: All 4 languages (Python, JS, C++, Java)

❌ **Wrong**: Vague descriptions that don't explain the problem  
✅ **Right**: Clear, 50+ character descriptions

❌ **Wrong**: Only 1 example per problem  
✅ **Right**: Minimum 2 examples minimum 3 test cases

❌ **Wrong**: Random difficulty assignments  
✅ **Right**: Consistent difficulty based on problem complexity

❌ **Wrong**: Invalid JSON structure  
✅ **Right**: Validate JSON before adding

❌ **Wrong**: Missing complexity analysis  
✅ **Right**: Both time and space complexity documented

---

## 🎯 Success Criteria for Phase 2

By end of Week 1:
- [ ] 175+ new problems collected (22 existing + 175 new = 197 total)
- [ ] 100% quality checklist pass rate
- [ ] All 4 languages present for every problem
- [ ] Valid JSON for all problems
- [ ] Zero duplicates
- [ ] Pattern distribution: 50 Easy, 75 Med, 50 Hard
- [ ] 100+ companies represented
- [ ] All problems documented with source

---

## 📞 Quick References

**Question**: "Why 4 languages in starter code?"  
**Answer**: Preploop supports Python, JavaScript, C++, and Java submissions. Each language needed for user selection.

**Question**: "Can I collect from non-listed sources?"  
**Answer**: Yes, but verify problem quality is professional interview prep standard.

**Question**: "How do I verify my JSON is valid?"  
**Answer**: Use online JSON validator or: `node -e "JSON.parse(require('fs').readFileSync('file.json', 'utf8'))"`

**Question**: "What if I find a duplicate?"  
**Answer**: Skip it and find another problem. Never add duplicates.

**Question**: "How detailed should test cases be?"  
**Answer**: Each test case should have: input, output, and brief note about what it tests.

---

## 📈 Expected Progress

```
Start of Phase 2 (March 13):     22/425 (5%)
After Day 1-2:                   72/425 (17%)
After Day 3-4:                  147/425 (35%)
After Day 5-6:                  197/425 (46%)
After Day 7 validation:         197/425 (46%)

Continue to end of Week 2:      425/425 (100%)
```

---

## 🔗 References

- Template: `PROBLEM_DATA_SCHEMA_REFERENCE.json`
- Migration Guide: `DATA_MIGRATION_COMPLETE_GUIDE.md`
- Validation: `validateProblems.js` (backend script)
- Schema: `backend/data/dsaProblemsExtended.js`

---

**Next Action**: Start collecting 50 Easy problems using this plan!

**Estimated Collection Time**: 1-2 minutes per problem (avg 90 seconds × 175 = ~260 minutes = ~4.3 hours total)

**Start Now**: Follow the daily checklist above.
