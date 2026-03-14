# 🚀 Phase 2 Collection - START HERE

**Status**: ✅ Backend operational, systems ready, collection infrastructure deployed  
**Current Date**: March 13, 2026  
**This Week's Target**: 175 new problems (50 Easy + 75 Medium + 50 Hard)  
**Timeline**: 7 days (March 13-19, 2026)  
**Estimated Effort**: ~7 hours total (~1 hour per day)

---

## 🎯 What You're Doing

You're collecting **175 NEW DSA problems** to add to the existing 22, bringing the total to **197 problems (46% of 425 goal)**.

Each problem takes about **90 seconds to collect** following a simple template.

---

## ⚡ The 5-Minute Overview

### Setup (Do this RIGHT NOW)
```bash
# Make sure you're in the Preploop directory
cd c:\Users\panch\Desktop\Preploop

# Validate the backend is running
curl http://localhost:5000/health

# The response should show: {"status":"ok","message":"Server is running"}
```

### Your Weekly Goal
| Day | Focus | Count | Time | IDs |
|-----|-------|-------|------|-----|
| 1 | Easy | 25 | 45min | 23-47 |
| 2 | Easy | 25 | 45min | 48-72 |
| 3 | Medium | 37 | 75min | 73-109 |
| 4 | Medium | 38 | 75min | 110-147 |
| 5 | Hard | 25 | 60min | 148-172 |
| 6 | Hard | 25 | 60min | 173-197 |
| 7 | Validation | - | 60min | All |
| **TOTAL** | **175** | **~7 hours** | - | - |

---

## 📋 Collection Checklist - Copy This

### Before You Start Collecting
- [ ] Backend running: `curl http://localhost:5000/health` ✅
- [ ] Opened: https://leetcode.com/problems
- [ ] Opened this file for reference
- [ ] Created/opened: `PHASE2_COLLECTED_PROBLEMS.json` file
- [ ] Located: `PHASE2_COLLECTION_HELPER.js` in backend folder

### For Each Problem (Takes ~90 seconds)
1. **Find** a suitable problem that fits the day's difficulty
2. **Extract** title, description (50+ chars), difficulty, pattern, companies
3. **Copy examples** from LeetCode (need 2+ with input/output/explanation)
4. **Create test cases** (3 types: normal, edge, large)
5. **Write starter code** for Python, JavaScript, C++, Java
6. **Add constraints** (2+ per problem)
7. **Calculate complexity** (Big O time and space)
8. **Verify** against the quality checklist
9. **Add to JSON** array in PHASE2_COLLECTED_PROBLEMS.json
10. **Continue** to next problem

---

## 🔧 Technical Setup

### Step 1: Create the Collection File
Create this file: `PHASE2_COLLECTED_PROBLEMS.json`

```json
[
  {
    "id": 23,
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to the target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    "difficulty": "Easy",
    "pattern": "Hash Map",
    "companies": ["Google", "Amazon", "Facebook", "Apple"],
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "nums[0] + nums[1] = 2 + 7 = 9, so we return [0,1]"
      },
      {
        "input": "nums = [3,2,4], target = 6",
        "output": "[1,2]",
        "explanation": "nums[1] + nums[2] = 2 + 4 = 6, so we return [1,2]"
      }
    ],
    "test_cases": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "type": "normal"
      },
      {
        "input": "nums = [3,3], target = 6",
        "output": "[0,1]",
        "type": "edge"
      },
      {
        "input": "nums = [1,2,3,4,5,6,7,8,9,10], target = 17",
        "output": "[7,8]",
        "type": "large"
      }
    ],
    "starter_code": {
      "python": "def twoSum(nums: list[int], target: int) -> list[int]:\n    pass",
      "javascript": "function twoSum(nums, target) {\n    \n}",
      "cpp": "vector<int> twoSum(vector<int>& nums, int target) {\n    \n}",
      "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"
    },
    "constraints": [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9"
    ],
    "function_name": "twoSum",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)"
  }
]
```

### Step 2: Validate Your Work
As you collect problems, occasionally validate:

```bash
# Validate the collection file
cd c:\Users\panch\Desktop\Preploop
node backend/validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json

# Should show: ✅ ALL X PROBLEMS VALIDATED SUCCESSFULLY!
```

### Step 3: Track Progress
Update: `PHASE2_COLLECTION_PROGRESS_TRACKER.md` with your daily progress

---

## 📚 Prime Sources for Collection

### 🥇 PRIMARY: LeetCode (Target: 100+ problems)
- **URL**: https://leetcode.com/problems
- **Browse by difficulty**: LeetCode → Problems → Filter by Difficulty
- **Easy**: Start with #1-100
- **Medium**: Mix from #1-300
- **Hard**: #200+

### 🥈 SECONDARY: HackerRank (Target: 40+ problems)
- **URL**: https://www.hackerrank.com/challenges
- **Good for**: Interview prep, clear problem statements
- **Pattern**: HackerRank → Data Structures → Choose topic

### 🥉 TERTIARY: GeeksforGeeks (Target: 30+ problems)
- **URL**: https://www.geeksforgeeks.org/tag/data-structures
- **Good for**: Detailed explanations, educational content
- **Pattern**: GFG → Data Structures → Choose algorithm

### 4️⃣ FOURTH: InterviewBit (Target: 5-10 problems)
- **URL**: https://www.interviewbit.com/problems
- **Good for**: Interview-focused, slight difficulty scale variation

---

## ✅ Quality Checklist for Each Problem

**Before adding to JSON, verify ALL of these:**

- [ ] **1. Unique**: Title not in existing 22 problems, no previous duplicates
- [ ] **2. Description**: 50+ characters, clear problem statement
- [ ] **3. Pattern**: One of the 25 approved patterns
- [ ] **4. Difficulty**: Matches actual complexity (Easy/Medium/Hard)
- [ ] **5. Companies**: At least 1 company, all valid names
- [ ] **6. Examples**: At least 2, each with input/output/explanation
- [ ] **7. Test Cases**: At least 3 (normal, edge case, large input)
- [ ] **8. Starter Code**: All 4 languages (Python, JS, C++, Java)
- [ ] **9. Constraints**: At least 2 constraints, proper format
- [ ] **10. Complexity**: Both time and space complexity listed
- [ ] **11. Function Name**: Valid for all 4 languages
- [ ] **12. Valid JSON**: No syntax errors, proper structure

**EVERY problem must pass ALL 12 checks.**

---

## 🏗️ 25 Approved Patterns - Quick Reference

```
Arrays                      Trees                    Advanced
- Array                      - Tree                   - Dynamic Programming
- Linked List                - Binary Tree            - Greedy
- String                      - Binary Search Tree    - Bit Manipulation
                                                       - Trie
Graphs & Searching           Structures              - Union Find
- Graph                       - Stack                 - Topological Sort
- Backtracking                - Queue
- DFS                         - Heap                  Optimization
- BFS                         - Hash Map              - Two Pointers
- Binary Search               - Hash Set              - Sliding Window
```

**Use exactly these 25 patterns. No custom patterns.**

---

## 🏢 Top Companies Reference

Your problems will be useful if they're asked in interviews. Here's the priority list:

**Tier 1 (Most Asked - 25+% of problems)**
- Google, Amazon, Facebook, Apple, Microsoft

**Tier 2 (Frequently Asked - 10-25%)**
- Netflix, Meta, LinkedIn, Adobe, Uber

**Tier 3 (Regularly Asked - 5-10%)**
- Tesla, Apple, Oracle, IBM, Goldman Sachs, JP Morgan, Morgan Stanley

**Check**: `COMPANY_INTERVIEW` folder for verified company lists

---

## ⏱️ Timing Breakdown

### Daily Timeline

**DAY 1 (TODAY - Mar 13): 45 minutes**
- 25 Easy problems (Problem IDs: 23-47)
- ~1.8 min per problem
- Source: LeetCode #1-50 (easiest)
- End of day: 25 problems collected

**DAY 2 (Tomorrow - Mar 14): 45 minutes**
- 25 Easy problems (Problem IDs: 48-72)
- ~1.8 min per problem
- Source: LeetCode #51-100
- End of day: 50 + 50 = 50 Easy problems DONE ✅

**DAY 3 (Mar 15): 75 minutes**
- 37 Medium problems (Problem IDs: 73-109)
- ~2.0 min per problem
- Source: LeetCode #100-200
- End of day: 37 Medium problems

**DAY 4 (Mar 16): 75 minutes**
- 38 Medium problems (Problem IDs: 110-147)
- ~2.0 min per problem
- Source: LeetCode #201-300
- End of day: 75 + 75 = 75 Medium problems DONE ✅

**DAY 5 (Mar 17): 60 minutes**
- 25 Hard problems (Problem IDs: 148-172)
- ~2.4 min per problem
- Source: LeetCode #301-400
- End of day: 25 Hard problems

**DAY 6 (Mar 18): 60 minutes**
- 25 Hard problems (Problem IDs: 173-197)
- ~2.4 min per problem
- Source: LeetCode #401+
- End of day: 50 + 50 = 50 Hard problems DONE ✅

**DAY 7 (Mar 19): 60 minutes**
- Validation & Quality Assurance
- Run validator: `node validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json`
- Fix any issues
- Confirm 100% pass rate
- Flag for Phase 3 ready

**TOTAL WEEK**: ~7 hours of actual work

---

## 🚀 RIGHT NOW - Get Started

### Minute 1-2: Setup
```bash
cd c:\Users\panch\Desktop\Preploop

# Verify backend is running
curl http://localhost:5000/health
# Should respond: {"status":"ok"}
```

### Minute 3-5: Open Resources
1. Open: https://leetcode.com/problems
2. Open: This file for reference
3. Open: `backend/PHASE2_COLLECTION_HELPER.js` for template
4. Create/open: `PHASE2_COLLECTED_PROBLEMS.json` file

### Minute 6-7: Collect First Problem
1. Browse to LeetCode #1 (Two Sum)
2. Copy: Title, description, difficulty
3. Extract: Companies (Google, Amazon, etc.)
4. Use template from PHASE2_COLLECTION_HELPER.js
5. Fill in all fields
6. Save to PHASE2_COLLECTED_PROBLEMS.json

### Minute 8+: Continue
- Problem 23: Two Sum (Easy, Hash Map)
- Problem 24: Add Two Numbers (Medium, Linked List)
- Problem 25: Longest Substring Without Repeating (Medium, Sliding Window)
- ...continue for 25 today, then 25 tomorrow

---

## 🎯 Success Criteria

**After 7 days, you need:**

✅ 175 new problems collected (IDs 23-197)  
✅ 100% validation pass rate (0 errors)  
✅ Distribution: 50 Easy, 75 Medium, 50 Hard  
✅ All 4 languages: Python, JavaScript, C++, Java  
✅ All 12 quality checklist items verified  
✅ Zero duplicates (vs existing 22)  
✅ 100+ unique companies represented  
✅ All 25 patterns covered  
✅ Valid JSON file with all 175 problems  

---

## 🛠️ Troubleshooting

### Q: How long should each problem take?
**A**: Easy 1-1.5 min, Medium 2 min, Hard 2-3 min. If taking longer:
- Skip extra research, use what's on LeetCode
- Use template from helper file, don't reinvent
- Copy/paste starter code templates, adjust minimally

### Q: Problem seems too long to do in 90 seconds
**A**: You're overthinking. Key info to extract:
- Title (copy directly)
- Description (copy from LeetCode)
- Examples (2 from LeetCode)
- Test cases (modify examples slightly)
- Starter code (use template)
- Complexity (look at solutions)

### Q: Getting JSON errors when validating
**A**: Common issues:
- Missing comma between array elements
- Quotes around strings
- Missing closing braces
- Check: https://jsonlint.com to validate

### Q: Pattern doesn't fit my problem
**A**: Use the 25 approved patterns only. If it truly doesn't fit:
- Array problems → "Array"
- Recursive problems → "Backtracking"
- Network problems → "Graph"
- Optimization problems → "Dynamic Programming"

### Q: Should I edit existing 22 problems?
**A**: NO. The existing 22 are done. Only ADD new ones (IDs 23+).

---

## 📊 Expected Progress

```
End of Day 1:  25 Easy (3%)   ▓░░░░░░░░░░░░░░░░░░░░░░░░░
End of Day 2:  50 Easy (6%)   ▓▓░░░░░░░░░░░░░░░░░░░░░░░░
End of Day 3:  87 (10%)       ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░
End of Day 4: 125 (15%)       ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░
End of Day 5: 150 (18%)       ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░
End of Day 6: 175 (21%)       ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░
End of Day 7: 175 ✅ (21%)    ✅ VALIDATED & READY
Total with 22: 197/425 (46%)  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░
```

---

## 🎓 Next Steps After Phase 2

**Week 2 (March 20-26)**: Phase 3 - Data Entry
- Input 197 problems into backend/data/dsaProblemsExtended.js
- Batch seed into database (50 problems at a time)
- Run validation suite

**Week 3 (March 27-31)**: Phase 4 - Deployment
- Final verification against VALIDATION_CHECKLIST.md
- Deploy to production at preploop.com
- Go live with all 425 problems

---

## 📞 Key Files

| File | Purpose | When to Use |
|------|---------|-----------|
| PHASE2_COLLECTION_HELPER.js | Template & reference | While collecting |
| validatePhase2Problems.js | Validation script | After each day |
| PHASE2_COLLECTION_PROGRESS_TRACKER.md | Daily tracking | Track progress |
| PHASE2_COLLECTED_PROBLEMS.json | Your output | Where problems go |
| PROBLEM_DATA_SCHEMA_REFERENCE.json | Exact schema | When unsure of format |

---

## ✨ Final Reminder

**You've got all the tools. The infrastructure is ready. The plan is clear.**

All that's left is executing it. 

**Start now. Collect your first 25 Easy problems today. You can do this.**

---

**Status**: 🟢 READY  
**Start Time**: NOW (Mar 13, 2026)  
**Target End**: March 19, 2026  
**Goal**: 175 problems (Done!)  
**Next Phase**: March 20, 2026 (Data Entry)

**Let's go! 🚀**
